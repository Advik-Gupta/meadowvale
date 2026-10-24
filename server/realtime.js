import { WebSocketServer } from "ws";
import { userFromToken } from "./auth.js";
import { db } from "./db.js";
import { canPlay, canSpectate, loadWorld, storeSave } from "./worlds.js";

const rooms = new Map();
const online = new Map();
const COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#00897b", "#d81b60", "#6d4c41"];
let seq = 1;

export function isOnline(userId) {
  return online.has(userId);
}
export function activeWorldOf(userId) {
  for (const [id, room] of rooms) for (const c of room.conns) if (c.userId === userId) return { id, name: room.name, role: c.role };
  return null;
}
export function roomInfo(worldId) {
  const room = rooms.get(worldId);
  if (!room) return { online: 0, players: [] };
  return { online: room.conns.size, players: [...room.conns].map((c) => ({ name: c.name, role: c.role, host: room.host === c })) };
}
export function kickFromWorld(worldId, userId) {
  const room = rooms.get(worldId);
  if (!room) return;
  for (const c of [...room.conns]) if (!userId || c.userId === userId) {
    send(c, { t: "kicked", reason: userId ? "You were removed from this world." : "This world was deleted." });
    leave(c);
  }
}

function send(c, msg) {
  if (c.ws.readyState === 1) c.ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
}
function broadcast(room, msg, except) {
  const text = typeof msg === "string" ? msg : JSON.stringify(msg);
  for (const c of room.conns) if (c !== except) send(c, text);
}
function presence(room) {
  broadcast(room, { t: "presence", users: [...room.conns].map((c) => ({ id: c.id, uid: c.userId, name: c.name, color: c.color, role: c.role, host: room.host === c })) });
}
function pickHost(room) {
  room.host = [...room.conns].find((c) => c.role === "player") || null;
  if (room.host) send(room.host, { t: "host" });
}
function leave(c) {
  const room = c.world && rooms.get(c.world);
  c.world = null;
  if (!room) return;
  room.conns.delete(c);
  if (room.host === c) pickHost(room);
  if (!room.conns.size) rooms.delete(room.id);
  else presence(room);
}

async function join(c, msg) {
  const w = await loadWorld(msg.world);
  const wantPlay = msg.role !== "spectator";
  if (!w || !(wantPlay ? canPlay(c.user, w) : canSpectate(c.user, w))) return send(c, { t: "error", error: "You can't join this world." });
  leave(c);
  const id = String(w._id);
  let room = rooms.get(id);
  if (room)
    for (const old of [...room.conns])
      if (old.userId === c.userId) {
        send(old, { t: "kicked", reason: "You opened this world in another tab or device." });
        leave(old);
      }
  room = rooms.get(id);
  if (!room) rooms.set(id, (room = { id, name: w.name, conns: new Set(), host: null, lastSave: 0 }));
  c.world = id;
  c.role = wantPlay ? "player" : "spectator";
  c.color = COLORS[room.conns.size % COLORS.length];
  room.conns.add(c);
  const promoted = !room.host && c.role === "player";
  if (promoted) room.host = c;
  send(c, { t: "joined", id: c.id, world: id, role: c.role, host: room.host === c, hasHost: !!room.host, color: c.color });
  if (promoted) for (const x of room.conns) if (x !== c) send(c, { t: "need-snapshot", to: x.id });
  if (room.host && room.host !== c) send(room.host, { t: "need-snapshot", to: c.id });
  presence(room);
}

async function handle(c, msg) {
  const room = c.world && rooms.get(c.world);
  switch (msg.t) {
    case "join":
      return join(c, msg);
    case "leave":
      return leave(c);
    case "ping":
      return send(c, { t: "pong", at: msg.at });
  }
  if (!room) return;
  const isHost = room.host === c;
  switch (msg.t) {
    case "state":
      if (isHost) broadcast(room, { t: "state", data: msg.data }, c);
      return;
    case "snapshot": {
      if (!isHost) return;
      const to = [...room.conns].find((x) => x.id === msg.to);
      if (to) send(to, { t: "snapshot", data: msg.data });
      return;
    }
    case "op":
      if (room.host && !isHost && (c.role === "player" || (msg.op && msg.op.k === "resync"))) send(room.host, { t: "op", from: c.id, name: c.name, op: msg.op });
      return;
    case "reply": {
      if (!isHost) return;
      const to = [...room.conns].find((x) => x.id === msg.to);
      if (to) send(to, { t: "reply", msg: msg.msg });
      return;
    }
    case "cursor":
      broadcast(room, { t: "cursor", id: c.id, uid: c.userId, name: c.name, color: c.color, x: +msg.x || 0, y: +msg.y || 0, m: String(msg.m || "").slice(0, 48) }, c);
      return;
    case "chat": {
      const text = String(msg.text || "").trim().slice(0, 240);
      if (text) broadcast(room, { t: "chat", id: c.id, name: c.name, color: c.color, text, at: Date.now() });
      return;
    }
    case "save":
      if (!isHost || c.role !== "player") return;
      if (Date.now() - room.lastSave < 15000 && !msg.force) return send(c, { t: "saved", skipped: true });
      room.lastSave = Date.now();
      try {
        await storeSave(room.id, msg.save, msg.stats);
        send(c, { t: "saved", at: Date.now() });
      } catch (e) {
        send(c, { t: "error", error: "Saving failed: " + e.message });
      }
      return;
  }
}

export function attachRealtime(server) {
  const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 64 * 1024 * 1024 });
  wss.on("connection", async (ws, req) => {
    if (!db.users) return ws.close(1013, "starting");
    const token = new URL(req.url, "http://x").searchParams.get("token");
    const user = await userFromToken(token).catch(() => null);
    if (!user) return ws.close(4001, "unauthorized");
    const c = { id: "c" + seq++, ws, user, userId: String(user._id), name: user.username, world: null, role: null, alive: true };
    ws.conn = c;
    if (!online.has(c.userId)) online.set(c.userId, new Set());
    online.get(c.userId).add(c);
    ws.on("pong", () => (c.alive = true));
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      handle(c, msg).catch((e) => send(c, { t: "error", error: e.message }));
    });
    ws.on("close", () => {
      leave(c);
      const set = online.get(c.userId);
      if (set) { set.delete(c); if (!set.size) online.delete(c.userId); }
    });
    send(c, { t: "hello", id: c.id, user: { id: c.userId, username: c.name } });
  });
  const beat = setInterval(() => {
    for (const ws of wss.clients) {
      const c = ws.conn;
      if (c && !c.alive) { ws.terminate(); continue; }
      if (c) c.alive = false;
      ws.ping();
    }
  }, 30000);
  beat.unref();
  wss.on("close", () => clearInterval(beat));
  return wss;
}
