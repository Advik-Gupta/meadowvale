import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import WebSocket from "ws";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
process.env.MONGODB_DB = "meadowvale_e2e_" + Date.now();
process.env.TOKEN_SECRET = "e2e-secret";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("•", ...a);

const { default: express } = await import("express");
const dbm = await import("../server/db.js");
const { createApp } = await import("../server/app.js");
const { attachRealtime } = await import("../server/realtime.js");
await dbm.connectDb();
const app = express();
app.use(express.static(root));
app.use(createApp());
const server = http.createServer(app);
const wss = attachRealtime(server);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

async function api(p, { token, method = "GET", body } = {}) {
  const res = await fetch(base + "/api" + p, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

const browsers = [];
async function browser(name, port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mv-" + name + "-"));
  const proc = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  browsers.push({ proc, dir });
  let list;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.some((t) => t.type === "page")) break;
    } catch (e) {}
    await sleep(250);
  }
  const target = list.find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.on("open", r));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send("Runtime.enable");
  const tab = {
    name,
    errors,
    send,
    async eval(expression) {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error(name + ": " + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
      return r.result.result.value;
    },
    async until(expression, ms = 20000, what) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try {
          if (await tab.eval(expression)) return true;
        } catch (e) {}
        await sleep(150);
      }
      throw new Error(`${name}: timed out waiting for ${what || expression}`);
    },
    close: () => ws.close(),
  };
  await send("Page.navigate", { url: base + "/" });
  await tab.until("document.readyState === 'complete'", 20000);
  return tab;
}
async function openWorld(tab, auth, play) {
  await tab.eval(`localStorage.setItem("meadowvale_token", ${JSON.stringify(auth.token)}); localStorage.setItem("meadowvale_user", ${JSON.stringify(JSON.stringify(auth.user))}); localStorage.setItem("meadowvale_notice_accounts", "1"); sessionStorage.setItem("meadowvale_play", ${JSON.stringify(play)}); location.reload(); true`);
  await sleep(500);
  await tab.until("typeof NET !== 'undefined' && NET.booted && !!S && !S.demo", 40000, tab.name + " booted");
}

let failed = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log("PASS", name);
  } catch (e) {
    failed++;
    console.log("FAIL", name, "::", e.message);
  }
}

try {
  const host = await api("/auth/signup", { method: "POST", body: { username: "HostHana", password: "secret123" } });
  const guest = await api("/auth/signup", { method: "POST", body: { username: "GuestGabe", password: "secret123" } });
  const watcher = await api("/auth/signup", { method: "POST", body: { username: "WatchWes", password: "secret123" } });
  await api("/friends/request", { token: host.token, method: "POST", body: { username: "GuestGabe" } });
  await api("/friends/accept", { token: guest.token, method: "POST", body: { userId: host.user.id } });
  await api("/friends/request", { token: watcher.token, method: "POST", body: { username: "HostHana" } });
  await api("/friends/accept", { token: host.token, method: "POST", body: { userId: watcher.user.id } });
  const { world } = await api("/worlds", { token: host.token, method: "POST", body: { name: "Coop Town", seed: "e2e-seed", members: [guest.user.id] } });
  log("world", world.id);

  const A = await browser("host", 9301),
    B = await browser("guest", 9302),
    C = await browser("spectator", 9303);

  await step("host boots a fresh online world", async () => {
    await openWorld(A, host, "cloud:" + world.id);
    assert.equal(await A.eval("NET.role"), "host");
    await A.until("NET.savedAt > 0", 15000, "first cloud save");
  });
  await step("guest joins and receives the live snapshot", async () => {
    await openWorld(B, guest, "cloud:" + world.id);
    assert.equal(await B.eval("NET.role"), "guest");
    const [a, b] = await Promise.all([A.eval("S.seedText"), B.eval("S.seedText")]);
    assert.equal(a, b);
    await A.until("NET.users.length === 2", 5000, "presence on host");
  });
  await step("spectator (friend of the owner) watches", async () => {
    await openWorld(C, watcher, "cloud:" + world.id);
    assert.equal(await C.eval("NET.role"), "spectator");
  });

  const spot = await A.eval(`(() => { for (let r = 3; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = S.spawn.x + dx, y = S.spawn.y + dy; if (placeOK('road', x, y, -1, 1, 1) && placeOK('road', x + 1, y, -1, 1, 1) && placeOK('road', x + 2, y, -1, 1, 1)) return [x, y]; } })()`);
  await step("guest builds a road - host and spectator see it", async () => {
    await B.eval(`startPlace('road'); hoverTile = [${spot[0]}, ${spot[1]}]; tryPlace(); cancelMode(true); true`);
    await A.until(`entAt(${spot[0]}, ${spot[1]}) && entAt(${spot[0]}, ${spot[1]}).t === 'road'`, 8000, "road on host");
    await C.until(`entAt(${spot[0]}, ${spot[1]}) && entAt(${spot[0]}, ${spot[1]}).t === 'road'`, 8000, "road on spectator");
    await B.until(`entAt(${spot[0]}, ${spot[1]}) && entAt(${spot[0]}, ${spot[1]}).id < 2e9`, 8000, "guest has the host's copy");
  });
  await step("host builds - guest sees it in real time", async () => {
    const t0 = Date.now();
    await A.eval(`startPlace('road'); hoverTile = [${spot[0] + 1}, ${spot[1]}]; tryPlace(); cancelMode(true); true`);
    await B.until(`entAt(${spot[0] + 1}, ${spot[1]}) && entAt(${spot[0] + 1}, ${spot[1]}).t === 'road'`, 5000, "road on guest");
    log("host → guest latency ~" + (Date.now() - t0) + "ms");
  });
  await step("coins and inventory stay in sync", async () => {
    const coins = await A.eval("S.coins");
    await B.until(`Math.abs(S.coins - ${coins}) < 50`, 5000, "coins on guest");
  });
  await step("guest moves the host's road with the move tool", async () => {
    await B.eval(`(() => { const e = entAt(${spot[0] + 1}, ${spot[1]}); startMove(e); hoverTile = [${spot[0] + 2}, ${spot[1]}]; tryPlace(); return true; })()`);
    await A.until(`entAt(${spot[0] + 2}, ${spot[1]}) && entAt(${spot[0] + 2}, ${spot[1]}).t === 'road' && !entAt(${spot[0] + 1}, ${spot[1]})`, 8000, "road moved on host");
  });
  await step("guest sells a building through its popup button", async () => {
    await B.eval(`(() => { const e = entAt(${spot[0]}, ${spot[1]}); onEntityClick(e, 400, 300); const btn = document.querySelector('#popup [data-act="p-sell"]'); if (btn) btn.click(); const yes = document.querySelector('#dialog-root [data-act="dlg-yes"]'); if (yes) yes.click(); return true; })()`);
    await A.until(`!entAt(${spot[0]}, ${spot[1]})`, 8000, "road sold on host");
    await B.until(`!entAt(${spot[0]}, ${spot[1]})`, 8000, "road gone on guest");
  });
  await step("spectators cannot build", async () => {
    await C.eval(`startPlace('road'); hoverTile = [${spot[0] + 5}, ${spot[1] + 5}]; tryPlace(); true`);
    await sleep(1500);
    assert.equal(await A.eval(`!!entAt(${spot[0] + 5}, ${spot[1] + 5})`), false);
  });
  await step("chat reaches everyone", async () => {
    await B.eval(`netSend({ t: "chat", text: "hello from gabe" }); true`);
    await A.until(`NET.chat.some((m) => m.text === "hello from gabe")`, 5000, "chat on host");
    await C.until(`NET.chat.some((m) => m.text === "hello from gabe")`, 5000, "chat on spectator");
  });
  await step("cursors are shared", async () => {
    await B.eval(`hoverTile = [${spot[0] + 3}, ${spot[1] + 3}]; NET.lastCursor = 0; netSendCursor(); true`);
    await A.until(`[...NET.cursors.values()].some((c) => c.name === "GuestGabe")`, 5000, "guest cursor on host");
  });
  await step("guest reconnects after the connection drops", async () => {
    await B.eval(`NET.ws.close(); true`);
    await B.until(`NET.ws && NET.ws.readyState === 1 && NET.role === "guest"`, 15000, "guest reconnected");
    await B.eval(`startPlace('road'); hoverTile = [${spot[0] + 4}, ${spot[1]}]; tryPlace(); cancelMode(true); true`);
    await A.until(`entAt(${spot[0] + 4}, ${spot[1]}) && entAt(${spot[0] + 4}, ${spot[1]}).t === 'road'`, 8000, "road after reconnect");
  });
  await step("state broadcast stays cheap", async () => {
    const r = await A.eval(`(() => { const t0 = performance.now(); const m = netBuildState(); const t1 = performance.now(); NET.forceKey = true; const k = netBuildState(); const top = Object.entries(m.S).map(([key, v]) => key + ":" + JSON.stringify(v).length).sort((a, b) => +b.split(":")[1] - +a.split(":")[1]).slice(0, 6).join(" "); return { ms: t1 - t0, kms: performance.now() - t1, diff: JSON.stringify(m).length, key: JSON.stringify(k).length, ents: world.ents.size, top, upd: m.ents ? m.ents.upd.length : 0 }; })()`);
    log(`diff ${(r.diff / 1024).toFixed(1)}KB in ${r.ms.toFixed(1)}ms · keyframe ${(r.key / 1024).toFixed(1)}KB in ${r.kms.toFixed(1)}ms · ${r.ents} entities · ${r.upd} changed · biggest: ${r.top}`);
    assert.ok(r.ms < 80, "diff build took " + r.ms + "ms");
  });
  await step("host leaves - guest takes over hosting and keeps saving", async () => {
    await A.eval(`netCloudSave(true).then(() => { NET.closing = true; NET.ws.close(); return true; })`);
    await B.until(`NET.role === "host"`, 8000, "guest promoted");
    await B.eval(`startPlace('road'); hoverTile = [${spot[0]}, ${spot[1] + 2}]; tryPlace(); cancelMode(true); true`);
    await C.until(`entAt(${spot[0]}, ${spot[1] + 2}) && entAt(${spot[0]}, ${spot[1] + 2}).t === 'road'`, 8000, "spectator sees new host's build");
    const ok = await B.eval(`netCloudSave(true)`);
    assert.equal(ok, true);
    const w = await api("/worlds/" + world.id, { token: host.token });
    const saved = JSON.parse(w.save);
    assert.ok(saved.ents.some((e) => e.t === "road" && e.x === spot[0] && e.y === spot[1] + 2), "cloud save has the new road");
  });
  await step("leaderboard lists the world", async () => {
    const lb = await api("/leaderboard?by=buildings", { token: host.token });
    assert.ok(lb.rows.some((r) => r.name === "Coop Town"));
  });
  await step("no page errors", async () => {
    const errs = [...A.errors, ...B.errors, ...C.errors];
    assert.deepEqual(errs, []);
  });
  for (const t of [A, B, C]) t.close();
} catch (e) {
  failed++;
  console.log("ERROR", e.stack || e.message);
} finally {
  await Promise.all(browsers.map((b) => new Promise((r) => (b.proc.exitCode != null ? r() : (b.proc.once("exit", r), b.proc.kill())))));
  for (const b of browsers) {
    try {
      fs.rmSync(b.dir, { recursive: true, force: true, maxRetries: 5 });
    } catch (e) {}
  }
  for (const c of wss.clients) c.terminate();
  wss.close();
  server.closeAllConnections?.();
  server.close();
  const { MongoClient } = await import("mongodb");
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  await c.db(process.env.MONGODB_DB).dropDatabase();
  await c.close();
  await dbm.closeDb();
  console.log(failed ? `${failed} failed` : "all multiplayer checks passed");
  process.exit(failed ? 1 : 0);
}
