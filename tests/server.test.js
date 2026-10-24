import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import WebSocket from "ws";

process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
process.env.MONGODB_DB = "meadowvale_test_" + Date.now();
process.env.TOKEN_SECRET = "test-secret";

let server, wss, base, wsBase, closeDb, dropDb;

before(async () => {
  const dbm = await import("../server/db.js");
  const { createApp } = await import("../server/app.js");
  const { attachRealtime } = await import("../server/realtime.js");
  const { MongoClient } = await import("mongodb");
  await dbm.connectDb();
  closeDb = dbm.closeDb;
  dropDb = async () => {
    const c = new MongoClient(process.env.MONGODB_URI);
    await c.connect();
    await c.db(process.env.MONGODB_DB).dropDatabase();
    await c.close();
  };
  server = http.createServer(createApp());
  wss = attachRealtime(server);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
  wsBase = base.replace("http", "ws");
});

after(async () => {
  for (const c of wss.clients) c.terminate();
  wss.close();
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
  await dropDb();
  await closeDb();
});

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
}
const signup = async (username) => (await api("/api/auth/signup", { method: "POST", body: { username, password: "secret123" } })).data;

function socket(token) {
  const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
  const inbox = [];
  const waiters = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
    else inbox.push(m);
  });
  ws.next = (pred, ms = 3000) =>
    new Promise((resolve, reject) => {
      const i = inbox.findIndex(pred);
      if (i >= 0) return resolve(inbox.splice(i, 1)[0]);
      const t = setTimeout(() => reject(new Error("timeout waiting for message")), ms);
      waiters.push({ pred, resolve: (m) => { clearTimeout(t); resolve(m); } });
    });
  ws.sendJ = (m) => ws.send(JSON.stringify(m));
  ws.opened = new Promise((r) => ws.on("open", r));
  return ws;
}

test("accounts: signup, duplicate names, login, me", async () => {
  const a = await signup("Alice_1");
  assert.ok(a.token);
  assert.equal(a.user.username, "Alice_1");
  const dup = await api("/api/auth/signup", { method: "POST", body: { username: "alice_1", password: "secret123" } });
  assert.equal(dup.status, 409);
  const bad = await api("/api/auth/login", { method: "POST", body: { username: "Alice_1", password: "nope" } });
  assert.equal(bad.status, 401);
  const ok = await api("/api/auth/login", { method: "POST", body: { username: "alice_1", password: "secret123" } });
  assert.equal(ok.status, 200);
  const me = await api("/api/auth/me", { token: ok.data.token });
  assert.equal(me.data.user.username, "Alice_1");
  assert.equal((await api("/api/auth/me", { token: "forged.token" })).status, 401);
});

test("friends, shared worlds, saves, spectating, leaderboard and live play", async () => {
  const bob = await signup("Bob"), cara = await signup("Cara"), dan = await signup("Dan");
  const found = await api("/api/friends/search?q=ca", { token: bob.token });
  assert.ok(found.data.users.some((u) => u.username === "Cara"));
  await api("/api/friends/request", { token: bob.token, method: "POST", body: { username: "Cara" } });
  let caraF = await api("/api/friends", { token: cara.token });
  assert.equal(caraF.data.incoming[0].username, "Bob");
  await api("/api/friends/accept", { token: cara.token, method: "POST", body: { userId: bob.user.id } });
  await api("/api/friends/request", { token: dan.token, method: "POST", body: { username: "Bob" } });
  await api("/api/friends/accept", { token: bob.token, method: "POST", body: { userId: dan.user.id } });
  const bobF = await api("/api/friends", { token: bob.token });
  assert.deepEqual(bobF.data.friends.map((f) => f.username).sort(), ["Cara", "Dan"]);

  const save = JSON.stringify({ S: { level: 7, coins: 5000 }, ents: [{ id: 1, t: "house" }] });
  const created = await api("/api/worlds", { token: bob.token, method: "POST", body: { name: "Bobville", seed: "abc", members: [cara.user.id], save, stats: { level: 7, coins: 5000, pop: 120 } } });
  const wid = created.data.world.id;
  assert.equal(created.data.world.members[0].username, "Cara");
  const asCara = await api(`/api/worlds/${wid}`, { token: cara.token });
  assert.equal(asCara.data.role, "player");
  assert.equal(JSON.parse(asCara.data.save).S.coins, 5000);
  const asDan = await api(`/api/worlds/${wid}`, { token: dan.token });
  assert.equal(asDan.data.role, "spectator");
  const stranger = await signup("Eve");
  assert.equal((await api(`/api/worlds/${wid}`, { token: stranger.token })).status, 404);
  assert.equal((await api(`/api/worlds/${wid}/save`, { token: dan.token, method: "PUT", body: { save } })).status, 404);
  await api(`/api/worlds/${wid}/save`, { token: cara.token, method: "PUT", body: { save: JSON.stringify({ S: { coins: 9 } }), stats: { level: 8, coins: 9000, pop: 300 } } });
  const lb = await api("/api/leaderboard?by=pop", { token: bob.token });
  assert.equal(lb.data.rows[0].name, "Bobville");
  assert.equal(lb.data.rows[0].stats.pop, 300);
  const lists = await api("/api/worlds", { token: dan.token });
  assert.equal(lists.data.friends[0].name, "Bobville");

  const host = socket(bob.token), guest = socket(cara.token), spec = socket(dan.token);
  await Promise.all([host.opened, guest.opened, spec.opened]);
  host.sendJ({ t: "join", world: wid, role: "player" });
  const hj = await host.next((m) => m.t === "joined");
  assert.equal(hj.host, true);
  guest.sendJ({ t: "join", world: wid, role: "player" });
  const gj = await guest.next((m) => m.t === "joined");
  assert.equal(gj.host, false);
  const need = await host.next((m) => m.t === "need-snapshot");
  host.sendJ({ t: "snapshot", to: need.to, data: { hello: "world" } });
  assert.deepEqual((await guest.next((m) => m.t === "snapshot")).data, { hello: "world" });
  guest.sendJ({ t: "op", op: { k: "place", t: "house", x: 3, y: 4 } });
  const op = await host.next((m) => m.t === "op");
  assert.equal(op.name, "Cara");
  assert.equal(op.op.t, "house");
  spec.sendJ({ t: "join", world: wid, role: "spectator" });
  assert.equal((await spec.next((m) => m.t === "joined")).role, "spectator");
  await host.next((m) => m.t === "need-snapshot");
  spec.sendJ({ t: "op", op: { k: "place" } });
  host.sendJ({ t: "state", data: { tick: 1 } });
  assert.deepEqual((await guest.next((m) => m.t === "state")).data, { tick: 1 });
  assert.deepEqual((await spec.next((m) => m.t === "state")).data, { tick: 1 });
  await assert.rejects(host.next((m) => m.t === "op", 400));
  guest.sendJ({ t: "chat", text: "hi all" });
  assert.equal((await host.next((m) => m.t === "chat")).text, "hi all");
  host.sendJ({ t: "save", save: JSON.stringify({ S: { coins: 77 } }), stats: { coins: 77, pop: 1 }, force: true });
  const sv = await host.next((m) => m.t === "saved" || m.t === "error");
  assert.equal(sv.t, "saved");
  assert.equal(JSON.parse((await api(`/api/worlds/${wid}`, { token: bob.token })).data.save).S.coins, 77);
  host.close();
  assert.equal((await guest.next((m) => m.t === "host")).t, "host");
  guest.close();
  spec.close();
});
