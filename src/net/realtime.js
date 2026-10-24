const LOCAL_ID = 2e9;
const NET = {
  ws: null,
  role: null,
  world: null,
  wantRole: "player",
  connId: null,
  color: null,
  users: [],
  booted: false,
  queue: [],
  waiters: [],
  orig: {},
  actOrig: {},
  lastEnt: new Map(),
  lastS: {},
  lastSlow: 0,
  lastKey: 0,
  forceKey: false,
  localAt: new Map(),
  depth: 0,
  curOp: null,
  dlgOp: null,
  dlgFromOp: false,
  replaying: false,
  replayInputs: null,
  cursors: new Map(),
  chat: [],
  unread: 0,
  lastCursor: 0,
  cursorSig: "",
  savedAt: 0,
  saveWaiters: [],
  closing: false,
  retry: 0,
  stateTimer: null,
  get remote() {
    return this.role === "guest" || this.role === "spectator";
  },
  get host() {
    return this.role === "host";
  },
  get guest() {
    return this.role === "guest";
  },
  get spectator() {
    return this.role === "spectator";
  },
};

const NET_LOCAL_ACTS = new Set([
  "open",
  "close",
  "backdrop",
  "tab",
  "home",
  "cancel",
  "buy",
  "plantmode",
  "swapseed",
  "storeseeds",
  "dlg-no",
  "lvl-ok",
  "quest-toggle",
  "toggle-sound",
  "toggle-day",
  "seed-copy",
  "seed-random",
  "rotate",
  "clearmode",
  "edit",
  "ed-move",
  "ed-copy",
  "p-move",
  "p-edit",
  "hub-open",
  "overlay",
  "c-goto",
  "to-title",
  "store-family",
  "store-back",
]);
const NET_VIEW_ACTS = new Set([
  "open",
  "close",
  "backdrop",
  "tab",
  "home",
  "cancel",
  "dlg-no",
  "lvl-ok",
  "quest-toggle",
  "toggle-sound",
  "toggle-day",
  "seed-copy",
  "hub-open",
  "overlay",
  "c-goto",
  "to-title",
  "store-family",
  "store-back",
]);
const NET_BLOCKED_ACTS = new Set(["reset", "new-world", "save-import", "save-paste"]);
const NET_WRAP_FNS = [
  "tryPlace",
  "placeGroup",
  "finishClearSelect",
  "onEntityClick",
  "sweepAt",
  "togglePause",
  "cycleSpeed",
  "flipSelected",
];
const NET_STUBS = [
  "showPopup",
  "hidePopup",
  "openPanel",
  "closePanel",
  "setBanner",
  "hideBanner",
  "setCursorIcon",
  "toast",
  "toastOnce",
  "sfx",
  "flyIcon",
  "shakeEl",
  "dialog",
];
const NET_SKIP_S = new Set(["cam", "sound", "daynight", "questMin", "demo"]);
const NET_SLOW_S = new Set(["people"]);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function netSend(m) {
  if (NET.ws && NET.ws.readyState === 1) {
    NET.ws.send(JSON.stringify(m));
    return true;
  }
  return false;
}
function netWait(pred, ms) {
  return new Promise((resolve, reject) => {
    const w = { pred, resolve };
    w.timer = setTimeout(() => {
      NET.waiters = NET.waiters.filter((x) => x !== w);
      reject(new Error("The server took too long to answer."));
    }, ms || 10000);
    NET.waiters.push(w);
  });
}
function netConnect() {
  return new Promise((resolve, reject) => {
    let ws;
    try {
      ws = new WebSocket(API.wsUrl());
    } catch (e) {
      reject(new Error("Can't open a live connection."));
      return;
    }
    NET.ws = ws;
    let hello = false;
    ws.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m.t === "hello") {
        hello = true;
        NET.retry = 0;
        resolve(m);
        return;
      }
      netMessage(m);
    };
    ws.onclose = (ev) => {
      if (!hello) reject(new Error(ev.code === 4001 ? "Your login has expired - please log in again." : ev.code === 1013 ? "The server is starting up - try again in a moment." : "Can't reach the live server."));
      if (NET.ws === ws) netDisconnected();
    };
    ws.onerror = () => {};
  });
}
async function netJoin(worldId, role) {
  const p = netWait((m) => m.t === "joined" || m.t === "error", 12000);
  netSend({ t: "join", world: worldId, role });
  const j = await p;
  if (j.t === "error") throw new Error(j.error);
  NET.connId = j.id;
  NET.color = j.color;
  return j;
}
function netDisconnected() {
  if (NET.closing || !NET.booted) return;
  netStatus("🔌 Reconnecting…", true);
  const wait = Math.min(15000, 1000 * Math.pow(2, NET.retry++));
  setTimeout(netReconnect, wait);
}
async function netReconnect() {
  if (NET.closing) return;
  try {
    await netConnect();
    const j = await netJoin(NET.world.id, NET.wantRole);
    if (j.host) {
      if (!NET.host) netBecomeHost();
    } else {
      if (NET.host) netStopHost();
      NET.role = j.role === "spectator" ? "spectator" : "guest";
    }
    netStatus("", false);
    netRenderBar();
  } catch (e) {
    netDisconnected();
  }
}

function netMessage(m) {
  const i = NET.waiters.findIndex((w) => w.pred(m));
  if (i >= 0) {
    const w = NET.waiters.splice(i, 1)[0];
    clearTimeout(w.timer);
    w.resolve(m);
    return;
  }
  if (!NET.booted) {
    NET.queue.push(m);
    return;
  }
  netHandle(m);
}
function netFlush() {
  const q = NET.queue;
  NET.queue = [];
  for (const m of q) netHandle(m);
}
function netHandle(m) {
  switch (m.t) {
    case "state":
      if (NET.remote) netApplyState(m.data);
      return;
    case "snapshot":
      if (NET.remote) netReloadFrom(m.data);
      return;
    case "need-snapshot":
      if (NET.host) {
        netSend({ t: "snapshot", to: m.to, data: serializeSave() });
        NET.forceKey = true;
      }
      return;
    case "op":
      if (NET.host) {
        netReplay(m.op, m.from, m.name);
        netStateSoon();
      }
      return;
    case "reply":
      if (NET.remote && m.msg && m.msg.t === "ents") netApplyEnts(m.msg);
      return;
    case "host":
      netBecomeHost();
      return;
    case "presence":
      netPresence(m.users || []);
      return;
    case "cursor":
      NET.cursors.set(m.id, { name: m.name, color: m.color, x: m.x, y: m.y, m: m.m, at: Date.now() });
      return;
    case "chat":
      netChatAdd(m);
      return;
    case "saved":
      if (!m.skipped) NET.savedAt = m.at || Date.now();
      for (const r of NET.saveWaiters.splice(0)) r(true);
      netRenderBar();
      return;
    case "kicked":
      NET.closing = true;
      dialog({
        title: "🚪 Left the world",
        body: esc(m.reason || "You were removed from this world."),
        no: false,
        yes: "Back to menu",
        onYes: () => netExitToTitle(false),
      });
      return;
    case "error":
      toast("⚠️ " + esc(m.error), "warn");
      return;
  }
}

function netEntPack(e) {
  const o = Object.assign({}, e);
  if (o.moving) {
    o.x = o.ox;
    o.y = o.oy;
  }
  delete o.moving;
  delete o.ox;
  delete o.oy;
  delete o.born;
  return o;
}
function netSKey(k) {
  if (k === "workers")
    return (S.workers || []).map((w) => {
      const o = Object.assign({}, w);
      delete o.path;
      delete o.pathFor;
      delete o.unreach;
      delete o._tx;
      delete o._ty;
      return o;
    });
  return S[k];
}
function netHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
function netBuildState() {
  advanceClock();
  const now = Date.now(),
    key = NET.forceKey || now - NET.lastKey > 5000,
    slow = key || now - NET.lastSlow > 4000;
  if (key) {
    NET.lastKey = now;
    NET.forceKey = false;
  }
  if (slow) NET.lastSlow = now;
  const upd = [],
    del = [],
    seen = new Set(),
    sums = key ? {} : null;
  for (const e of world.ents.values()) {
    if (e.nat || e.dying) continue;
    seen.add(e.id);
    const o = netEntPack(e),
      s = JSON.stringify(o);
    if (sums) sums[e.id] = netHash(s);
    if (NET.lastEnt.get(e.id) !== s) {
      NET.lastEnt.set(e.id, s);
      upd.push(o);
    }
  }
  for (const id of NET.lastEnt.keys())
    if (!seen.has(id)) {
      del.push(id);
      NET.lastEnt.delete(id);
    }
  const sd = {};
  let any = upd.length || del.length;
  for (const k in S) {
    if (NET_SKIP_S.has(k) || (NET_SLOW_S.has(k) && !slow)) continue;
    const v = netSKey(k),
      s = JSON.stringify(v);
    if (s === undefined) continue;
    if (NET.lastS[k] !== s || (key && s.length < 20000)) {
      NET.lastS[k] = s;
      sd[k] = v;
      any = true;
    }
  }
  const msg = { clock: { t: clock.t, paused: clock.paused, speed: clock.speed }, S: sd };
  if (upd.length || del.length) msg.ents = { upd, del };
  if (sums) msg.sums = sums;
  return any || key ? msg : { clock: msg.clock };
}
function netSendState() {
  clearTimeout(NET.stateTimer);
  NET.stateTimer = null;
  if (!NET.host || NET.users.length < 2) return;
  netSend({ t: "state", data: netBuildState() });
}
function netStateSoon() {
  if (NET.host && NET.users.length > 1 && !NET.stateTimer) NET.stateTimer = setTimeout(netSendState, 40);
}

function netClearNatUnder(e) {
  for (let j = 0; j < e.h; j++)
    for (let i = 0; i < e.w; i++) {
      const id = world.occ.get(tkey(e.x + i, e.y + j));
      if (id == null || id === e.id) continue;
      const o = world.ents.get(id);
      if (o && o.nat) removeEnt(o);
    }
}
function netApplyEnt(o) {
  const old = world.ents.get(o.id);
  if (old) {
    if (!old.moving) setOcc(old, -1);
    unindexEnt(old);
    if (old.nat) {
      world.ents.delete(old.id);
    }
  }
  const e = o;
  if (old && old.moving && !old.nat) {
    e.moving = true;
    e.ox = e.x;
    e.oy = e.y;
  }
  if (old && old.born) e.born = old.born;
  world.ents.set(e.id, e);
  indexEnt(e);
  if (!e.moving) {
    netClearNatUnder(e);
    setOcc(e, e.id);
  }
  if (old && !old.nat) {
    if (pop && pop.ent === old) pop.ent = e;
    if (mode.ent === old) mode.ent = e;
    if (mode.members) for (const m of mode.members) if (m.e === old) m.e = e;
  }
}
function netDropEnt(id) {
  const e = world.ents.get(id);
  if (!e || e.nat) return;
  if (mode.ent === e || (mode.members && mode.members.some((m) => m.e === e))) cancelMode(true);
  if (pop && pop.ent === e) hidePopup(true);
  editSel.delete(id);
  if (e.moving) {
    world.ents.delete(e.id);
    unindexEnt(e);
  } else removeEnt(e);
  NET.localAt.delete(id);
}
function netApplyEnts(d) {
  for (const o of d.upd || []) netApplyEnt(o);
  for (const id of d.del || []) netDropEnt(id);
  worldChanged();
}
function netRefreshNature() {
  for (const e of [...world.ents.values()]) {
    if (!e.nat || e.dying) continue;
    const gone = S.natGone && S.natGone[ckey(e.x >> 4, e.y >> 4)];
    if ((gone && gone.includes(li(e.x, e.y))) || natCleared(e.x, e.y)) {
      const tk = tkey(e.x, e.y);
      if (world.occ.get(tk) === e.id) world.occ.delete(tk);
      world.ents.delete(e.id);
      unindexEnt(e);
      if (typeof invalidateFar === "function") invalidateFar(e.x >> 4, e.y >> 4);
    }
  }
}
function netApplyTerr(prev, next) {
  for (const k in next) {
    if (prev && prev[k] === next[k]) continue;
    const [x, y] = k.split(",").map(Number);
    if (world.tch.has(ckey(x >> 4, y >> 4))) setTerr(x, y, next[k]);
  }
}
function netMergeWorkers(prev, next) {
  const by = new Map((prev || []).map((w) => [w.id, w]));
  for (const w of next) {
    const o = by.get(w.id);
    w._tx = w.x;
    w._ty = w.y;
    if (o && Math.hypot(o.x - w.x, o.y - w.y) < 6) {
      w.x = o.x;
      w.y = o.y;
    }
    if (o && o.path) w.path = o.path;
  }
}
function netApplyState(d) {
  if (!d) return;
  if (d.clock) {
    clock.t = d.clock.t;
    clock.last = performance.now();
    clock.speed = d.clock.speed;
    if (clock.paused !== d.clock.paused) setPaused(d.clock.paused);
    NOW = clock.t;
  }
  if (d.ents) netApplyEnts(d.ents);
  let nat = false;
  for (const k in d.S || {}) {
    const prev = S[k],
      v = d.S[k];
    if (k === "workers") netMergeWorkers(prev, v);
    if (k === "terrEdits") netApplyTerr(prev, v);
    if (k === "natGone" || k === "clearBoxes") nat = true;
    S[k] = v;
  }
  if (nat) netRefreshNature();
  const now = Date.now();
  for (const [id, at] of NET.localAt) if (now - at > 3000) netDropEnt(id);
  if (d.sums) {
    const stale = [];
    for (const e of world.ents.values()) {
      if (e.nat || e.dying) continue;
      if (e.id >= LOCAL_ID) continue;
      const h = d.sums[e.id];
      if (h == null) stale.push(e.id);
      else if (h !== netHash(JSON.stringify(netEntPack(e)))) stale.push(e.id);
    }
    const need = [];
    for (const id in d.sums) if (!world.ents.has(+id)) need.push(+id);
    for (const id of stale) if (d.sums[id] == null) netDropEnt(id);
    const fix = stale.filter((id) => d.sums[id] != null).concat(need);
    if (fix.length) netSend({ t: "op", op: { k: "resync", ids: fix.slice(0, 2000) } });
  }
  if (d.ents || nat) {
    worldChanged();
    recalcPop();
  }
}
function netReloadFrom(text) {
  if (!text) return;
  const c = { x: cam.x, y: cam.y, z: cam.z };
  cancelMode(true);
  hidePopup(true);
  PRELOAD_SAVE = text;
  load();
  world.nextId = Math.max(world.nextId, LOCAL_ID);
  NET.localAt.clear();
  cam.x = c.x;
  cam.y = c.y;
  cam.z = c.z;
  recalcPop();
  worldChanged();
}

function netBecomeHost() {
  const was = NET.role;
  NET.role = "host";
  NET.wantRole = "player";
  for (const id of [...NET.localAt.keys()]) netDropEnt(id);
  let max = 0;
  for (const e of world.ents.values()) if (!e.nat && e.id < LOCAL_ID) max = Math.max(max, e.id);
  world.nextId = max + 1;
  for (const w of S.workers || []) {
    delete w._tx;
    delete w._ty;
    w.task = null;
    w.unreach = {};
    w.path = null;
    w.pathFor = null;
  }
  lastTickNow = NOW;
  NET.lastEnt = new Map();
  NET.lastS = {};
  NET.forceKey = true;
  if (was && was !== "host") toast("👑 You're now hosting this world - the simulation runs on your device.", "good");
  netRenderBar();
}
function netStopHost() {
  NET.lastEnt = new Map();
  NET.lastS = {};
}

function netRef(e) {
  if (!e) return null;
  return { id: e.id, t: e.t, x: e.moving ? e.ox : e.x, y: e.moving ? e.oy : e.y, n: e.nat ? 1 : 0 };
}
function netResolve(r) {
  if (!r) return null;
  if (!r.n && r.id < LOCAL_ID) {
    const e = world.ents.get(r.id);
    if (e && e.t === r.t) return e;
  }
  if (r.n) loadAround(r.x, r.y, 1);
  const e = entAt(r.x, r.y);
  if (e && e.t === r.t) return e;
  if (!r.n) for (const o of entsOf(r.t)) if (o.x === r.x && o.y === r.y) return o;
  return null;
}
function netReadInputs(root) {
  const out = {};
  for (const el of (root || document).querySelectorAll("input[id],select[id],textarea[id]")) {
    if (el.id.startsWith("mp-")) continue;
    out[el.id] = { value: el.value, checked: !!el.checked };
  }
  return out;
}
function netPackMode() {
  if (!mode || !mode.type) return null;
  const o = {};
  for (const k in mode) {
    const v = mode[k];
    if (v == null || typeof v !== "object") o[k] = v;
    else if (Array.isArray(v) && v.every((x) => typeof x === "number")) o[k] = v.slice();
  }
  if (mode.ent) o.ent = netRef(mode.ent);
  if (mode.members) o.members = mode.members.map((m) => netRef(m.e));
  return o;
}
function netCtx() {
  return {
    mode: netPackMode(),
    hover: hoverTile ? [hoverTile[0], hoverTile[1]] : null,
    pop: pop && pop.ent ? netRef(pop.ent) : null,
    sel: editSel.size ? [...editSel].map((id) => netRef(world.ents.get(id))).filter(Boolean) : null,
    rot: lastRot,
    inputs: netReadInputs(),
  };
}
function netSendOp(op) {
  if (!netSend({ t: "op", op })) toastOnce("🔌 Not connected - your change may not be saved.", "warn");
}
function netRun(op, fn) {
  NET.depth++;
  NET.curOp = op;
  NET.dlgFromOp = false;
  const before = world.nextId;
  let r;
  try {
    r = fn();
  } finally {
    NET.depth--;
    NET.curOp = null;
  }
  for (let id = before; id < world.nextId; id++) {
    const e = world.ents.get(id);
    if (e && !e.nat) NET.localAt.set(id, Date.now());
  }
  if (NET.dlgFromOp) NET.dlgOp = op;
  else netSendOp(op);
  NET.dlgFromOp = false;
  return r;
}
function netViewOnly() {
  toastOnce("👀 You're spectating - ask the owner to add you as a player to build.", "info");
}
function netWrapFn(name) {
  const orig = window[name];
  if (typeof orig !== "function") return;
  NET.orig[name] = orig;
  window[name] = function (...args) {
    if (NET.host && !NET.replaying) {
      const r = orig.apply(this, args);
      netStateSoon();
      return r;
    }
    if (!NET.remote || NET.replaying || NET.depth) return orig.apply(this, args);
    if (NET.spectator) {
      if (name === "onEntityClick") return orig.apply(this, args);
      if (name !== "sweepAt") netViewOnly();
      return;
    }
    let a = null;
    if (name === "onEntityClick") a = netRef(args[0]);
    if (name === "sweepAt") a = { tile: screenToTile(args[0], args[1]), pm: ptr.mode };
    return netRun({ k: name, args: a, ctx: netCtx() }, () => orig.apply(this, args));
  };
}
function netAct(k, f, d, el, ev) {
  if (!NET.role || NET.replaying || NET.depth) return f(d, el, ev);
  if (NET_BLOCKED_ACTS.has(k)) {
    toast("That isn't available in an online world - use the Worlds menu instead.", "info");
    return;
  }
  if (k === "dlg-no") NET.dlgOp = null;
  if (NET.host) {
    const r = f(d, el, ev);
    netStateSoon();
    return r;
  }
  if (!NET.remote) return f(d, el, ev);
  if (k === "dlg-yes") {
    const op = NET.dlgOp;
    NET.dlgOp = null;
    if (!op || NET.spectator) return f(d, el, ev);
    const inputs = netReadInputs($("#dialog-root"));
    const op2 = Object.assign({}, op, { confirm: (op.confirm || 0) + 1, dlgInputs: (op.dlgInputs || []).concat([inputs]) });
    return netRun(op2, () => f(d, el, ev));
  }
  const local = NET_LOCAL_ACTS.has(k) || /^(t|a|mp)-/.test(k);
  if (NET.spectator) {
    if (NET_VIEW_ACTS.has(k) || /^(t|a|mp)-/.test(k)) return f(d, el, ev);
    netViewOnly();
    return;
  }
  if (local) return f(d, el, ev);
  if (k === "save-now") {
    netSendOp({ k: "save" });
    toast("💾 Asked the host to save the world.", "good");
    return;
  }
  return netRun({ k: "act", name: k, data: Object.assign({}, d), ctx: netCtx() }, () => f(d, el, ev));
}

function netFakeInput(v) {
  const noop = () => {};
  return {
    value: v.value,
    checked: v.checked,
    dataset: {},
    style: {},
    classList: { contains: () => false, add: noop, remove: noop, toggle: noop },
    focus: noop,
    select: noop,
    blur: noop,
    addEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}
const NET_REPLAY_FNS = new Set(NET_WRAP_FNS);
function netReplay(op, from, who) {
  if (!op || typeof op !== "object") return;
  if (op.k === "save") {
    netCloudSave(true);
    return;
  }
  if (op.k === "resync") {
    const upd = [],
      del = [];
    for (const id of (op.ids || []).slice(0, 2000)) {
      const e = world.ents.get(id);
      if (e && !e.nat && !e.dying) upd.push(netEntPack(e));
      else del.push(id);
    }
    netSend({ t: "reply", to: from, msg: { t: "ents", upd, del } });
    return;
  }
  if (op.k !== "act" && !NET_REPLAY_FNS.has(op.k)) return;
  if (op.k === "act" && (!NET.actOrig[op.name] || NET_LOCAL_ACTS.has(op.name) || NET_BLOCKED_ACTS.has(op.name) || op.name === "dlg-yes" || /^(t|a|mp)-/.test(op.name))) return;
  const ctx = op.ctx || {};
  const pts = [];
  if (ctx.hover) pts.push(ctx.hover);
  if (ctx.pop) pts.push([ctx.pop.x, ctx.pop.y]);
  if (op.args && op.args.tile) pts.push(op.args.tile);
  if (op.args && op.args.x != null) pts.push([op.args.x, op.args.y]);
  for (const p of pts) loadAround(p[0], p[1], 4);
  const m = ctx.mode;
  if (m && m.a && m.b) {
    const x0 = Math.min(m.a[0], m.b[0]),
      x1 = Math.max(m.a[0], m.b[0]),
      y0 = Math.min(m.a[1], m.b[1]),
      y1 = Math.max(m.a[1], m.b[1]);
    if ((x1 - x0) * (y1 - y0) < 40000)
      for (let cy = y0 >> 4; cy <= y1 >> 4; cy++) for (let cx = x0 >> 4; cx <= x1 >> 4; cx++) loadChunk(cx, cy);
  }
  netSandbox(op, () => {
    if (op.k === "act") {
      const el = document.createElement("button");
      for (const k in op.data || {}) el.dataset[k] = op.data[k];
      NET.actOrig[op.name](el.dataset, el, { target: el });
    } else if (op.k === "onEntityClick") {
      const e = netResolve(op.args);
      if (!e) return;
      const s = entScreen(e);
      NET.orig.onEntityClick(e, s[0], s[1]);
    } else if (op.k === "sweepAt") {
      const [tx, ty] = op.args.tile,
        sst = window.screenToTile,
        pm = ptr.mode,
        pl = ptr.last;
      window.screenToTile = () => [tx, ty];
      ptr.mode = op.args.pm;
      ptr.last = "";
      try {
        NET.orig.sweepAt(0, 0);
      } finally {
        window.screenToTile = sst;
        ptr.mode = pm;
        ptr.last = pl;
      }
    } else NET.orig[op.k]();
  });
}
function netRebuildMode(m) {
  if (!m) return;
  if (m.type === "place" && m.ent) {
    const e = netResolve(m.ent);
    if (!e || e.moving) return;
    startMove(e);
    if (mode.type === "place") mode.rot = !!m.rot;
    return;
  }
  if (m.type === "group") {
    editSel.clear();
    for (const r of m.members || []) {
      const e = netResolve(r);
      if (e && !e.moving) editSel.add(e.id);
    }
    startGroup(!!m.copy);
    return;
  }
  mode = Object.assign({}, m);
  delete mode.ent;
  delete mode.members;
}
function netSandbox(op, fn) {
  const ctx = op.ctx || {};
  const saved = { mode, pop, hover: hoverTile, sel: [...editSel], dlgCb, dlgNo, lastRot };
  const stubs = {},
    pending = [];
  let confirms = op.confirm || 0;
  for (const n of NET_STUBS) {
    stubs[n] = window[n];
    window[n] =
      n === "dialog"
        ? (o) => {
            if (confirms > 0) {
              confirms--;
              pending.push(o);
            }
          }
        : () => {};
  }
  const gid = document.getElementById,
    qs = document.querySelector;
  document.getElementById = function (id) {
    const v = NET.replayInputs && NET.replayInputs[id];
    return v ? netFakeInput(v) : gid.call(document, id);
  };
  document.querySelector = function (sel) {
    const mm = /^#([\w-]+)$/.exec(sel),
      v = mm && NET.replayInputs && NET.replayInputs[mm[1]];
    return v ? netFakeInput(v) : qs.call(document, sel);
  };
  NET.replaying = true;
  NET.replayInputs = ctx.inputs || {};
  try {
    mode = { type: null };
    pop = null;
    hoverTile = ctx.hover || null;
    lastRot = !!ctx.rot;
    editSel.clear();
    for (const r of ctx.sel || []) {
      const e = netResolve(r);
      if (e) editSel.add(e.id);
    }
    if (ctx.pop) {
      const e = netResolve(ctx.pop);
      if (e) pop = { ent: e };
    }
    netRebuildMode(ctx.mode);
    fn();
    let lvl = 0;
    while (pending.length) {
      const o = pending.shift();
      NET.replayInputs = Object.assign({}, ctx.inputs || {}, (op.dlgInputs || [])[lvl++] || {});
      dlgCb = o.onYes || null;
      if (o.onYes) o.onYes();
    }
    if ((mode.type === "place" && mode.ent) || mode.type === "group") cancelMode(true);
  } catch (err) {
    console.warn("multiplayer action failed", op, err);
  } finally {
    for (const n in stubs) window[n] = stubs[n];
    document.getElementById = gid;
    document.querySelector = qs;
    NET.replaying = false;
    NET.replayInputs = null;
    mode = saved.mode;
    pop = saved.pop;
    hoverTile = saved.hover;
    lastRot = saved.lastRot;
    dlgCb = saved.dlgCb;
    dlgNo = saved.dlgNo;
    editSel.clear();
    for (const id of saved.sel) editSel.add(id);
  }
}

function netWorldStats() {
  let b = 0;
  for (const e of world.ents.values()) if (!e.nat) b++;
  return {
    level: S.level,
    coins: Math.floor(S.coins || 0),
    pop: typeof RES !== "undefined" && RES ? RES : POP,
    cities: (S.cities || []).length,
    buildings: b,
  };
}
function netCloudSave(force, text) {
  if (!NET.host || !S) return Promise.resolve(false);
  text = text || serializeSave();
  const stats = netWorldStats();
  if (netSend({ t: "save", save: text, stats, force: !!force }))
    return new Promise((r) => {
      NET.saveWaiters.push(r);
      setTimeout(() => r(false), 15000);
    });
  return API.put("/worlds/" + NET.world.id + "/save", { save: text, stats }).then(
    () => {
      NET.savedAt = Date.now();
      netRenderBar();
      return true;
    },
    () => false,
  );
}

function netPresence(users) {
  const before = new Set(NET.users.map((u) => u.id));
  const now = new Set(users.map((u) => u.id));
  if (NET.booted) {
    for (const u of users) if (!before.has(u.id) && u.id !== NET.connId) toast(`${u.role === "spectator" ? "👀" : "🎮"} <b>${esc(u.name)}</b> joined${u.role === "spectator" ? " to watch" : ""}`, "info");
    for (const u of NET.users) if (!now.has(u.id)) {
      toast(`👋 <b>${esc(u.name)}</b> left`, "info");
      NET.cursors.delete(u.id);
    }
  }
  NET.users = users;
  netRenderBar();
}
function netChatAdd(m) {
  NET.chat.push(m);
  if (NET.chat.length > 80) NET.chat.shift();
  const box = $("#mp-chat");
  if (!box || box.classList.contains("hidden")) {
    NET.unread++;
    if (m.id !== NET.connId) toast(`💬 <b>${esc(m.name)}</b>: ${esc(m.text)}`, "info");
  }
  netRenderChat();
  netRenderBar();
}
function netRenderChat() {
  const log = $("#mp-chat-log");
  if (!log) return;
  log.innerHTML = NET.chat
    .map((m) => `<div class="mp-msg"><b style="color:${esc(m.color)}">${esc(m.name)}</b> ${esc(m.text)}</div>`)
    .join("") || '<div class="mp-empty">Say hi to everyone in this world 👋</div>';
  log.scrollTop = log.scrollHeight;
}
function netStatus(text, warn) {
  const el = $("#mp-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("hidden", !text);
  el.classList.toggle("warn", !!warn);
}
function netAgo(t) {
  const s = Math.round((Date.now() - t) / 1000);
  return s < 10 ? "just now" : s < 60 ? s + "s ago" : Math.round(s / 60) + " min ago";
}
function netRenderBar() {
  const bar = $("#mp-bar");
  if (!bar || !NET.world) return;
  const role = NET.host ? "👑 Hosting" : NET.guest ? "🎮 Playing" : "👀 Spectating";
  const owner = NET.world.owner && API.user && NET.world.owner.id === API.user.id;
  const noHost = NET.spectator && !NET.users.some((u) => u.host);
  bar.innerHTML = `<span class="mp-world" title="${esc(NET.world.name)}">🌐 ${esc(NET.world.name)}</span><span class="mp-role">${role}${noHost ? " · owner offline" : ""}</span>
    <span class="mp-users">${NET.users
      .map((u) => `<span class="mp-av" style="background:${esc(u.color)}" title="${esc(u.name)}${u.host ? " (host)" : u.role === "spectator" ? " (watching)" : ""}">${esc(u.name[0].toUpperCase())}${u.host ? "<i>👑</i>" : ""}</span>`)
      .join("")}</span>
    ${NET.host ? `<span class="mp-saved" title="Saved to your account every minute">☁️ ${NET.savedAt ? netAgo(NET.savedAt) : "not saved yet"}</span>` : ""}
    <button class="mp-btn" data-act="mp-chat" title="Chat (Enter)">💬${NET.unread ? `<b>${NET.unread}</b>` : ""}</button>
    ${owner ? '<button class="mp-btn" data-act="mp-invite" title="Invite friends">➕</button>' : ""}`;
}
function netEnsureUI() {
  if ($("#mp-bar")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div id="mp-bar"></div><div id="mp-status" class="hidden"></div><div id="mp-cursors"></div>
    <div id="mp-chat" class="hidden"><div class="mp-chat-h">💬 World chat<button class="mp-x" data-act="mp-chat">✕</button></div><div id="mp-chat-log"></div>
    <form id="mp-chat-form"><input id="mp-chat-in" maxlength="240" placeholder="Message everyone…" autocomplete="off"><button class="btn green small">Send</button></form></div>`;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  $("#mp-chat-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const i = $("#mp-chat-in"),
      text = i.value.trim();
    if (text) netSend({ t: "chat", text });
    i.value = "";
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" || !NET.role) return;
    if (ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA")) {
      if (ev.target.id === "mp-chat-in" && !ev.target.value.trim()) ACT["mp-chat"]();
      return;
    }
    if (dialogOpen()) return;
    ACT["mp-chat"](null, null, null, true);
  });
  canvas.addEventListener("pointermove", netSendCursor);
  netRenderBar();
  netRenderChat();
  setInterval(() => {
    if (NET.host) netRenderBar();
  }, 15000);
}
function netModeLabel() {
  if (mode.type === "place" && BUILD[mode.t]) return (mode.ent ? "✋ Moving " : "🔨 ") + BUILD[mode.t].name;
  if (mode.type === "group") return mode.copy ? "📋 Pasting" : "✋ Moving buildings";
  if (mode.type === "edit") return "✏️ Editing";
  if (mode.type === "clear") return "🪓 Clearing land";
  if (mode.type === "plant") return "🌱 Planting";
  if (mode.type === "paint" && BUILD[mode.t]) return "🖌️ " + BUILD[mode.t].name;
  return "";
}
function netSendCursor() {
  if (!NET.role || !hoverTile) return;
  const now = performance.now();
  if (now - NET.lastCursor < 110) return;
  const m = netModeLabel(),
    sig = hoverTile[0] + "," + hoverTile[1] + m;
  if (sig === NET.cursorSig) return;
  NET.lastCursor = now;
  NET.cursorSig = sig;
  netSend({ t: "cursor", x: hoverTile[0], y: hoverTile[1], m });
}
function netDrawCursors() {
  const root = $("#mp-cursors");
  if (!root) return;
  const now = Date.now();
  for (const [id, c] of NET.cursors) {
    let el = c.el;
    if (now - c.at > 30000) {
      if (el) el.remove();
      NET.cursors.delete(id);
      continue;
    }
    if (!el) {
      el = c.el = document.createElement("div");
      el.className = "mp-cursor";
      root.appendChild(el);
    }
    const lbl = esc(c.name) + (c.m ? " · " + esc(c.m) : "");
    if (el.dataset.l !== lbl) {
      el.dataset.l = lbl;
      el.innerHTML = `<i style="border-color:${esc(c.color)}"></i><span style="background:${esc(c.color)}">${lbl}</span>`;
    }
    c.sx = c.sx == null ? c.x : c.sx + (c.x - c.sx) * 0.25;
    c.sy = c.sy == null ? c.y : c.sy + (c.y - c.sy) * 0.25;
    const w = P(c.sx + 0.5, c.sy + 0.5),
      [sx, sy] = worldToScreen(w[0], w[1]);
    el.style.transform = `translate(${Math.round(sx)}px,${Math.round(sy)}px)`;
  }
}

function netExitToTitle(doSave) {
  NET.closing = true;
  const go = () => {
    try {
      if (NET.ws) NET.ws.close();
    } catch (e) {}
    sessionStorage.removeItem(PLAY_KEY);
    resetting = true;
    location.reload();
  };
  if (doSave && NET.host) {
    toast("☁️ Saving to your account…", "info");
    netCloudSave(true).then(go);
  } else go();
}

Object.assign(ACT, {
  "mp-chat": (d, el, ev, focusOnly) => {
    const box = $("#mp-chat");
    if (!box) return;
    const show = focusOnly || box.classList.contains("hidden");
    box.classList.toggle("hidden", !show);
    if (show) {
      NET.unread = 0;
      netRenderChat();
      netRenderBar();
      setTimeout(() => $("#mp-chat-in").focus(), 0);
    } else $("#mp-chat-in").blur();
  },
});

function netInstall() {
  for (const k of Object.keys(ACT)) {
    const f = ACT[k];
    NET.actOrig[k] = f;
    ACT[k] = function (d, el, ev) {
      return netAct(k, f, d, el, ev);
    };
  }
  for (const n of NET_WRAP_FNS) netWrapFn(n);
  const _dialogNet = dialog;
  dialog = function (o) {
    if (NET.curOp) NET.dlgFromOp = true;
    else if (!NET.replaying) NET.dlgOp = null;
    return _dialogNet(o);
  };
  const _tickNet = tick;
  tick = function () {
    if (!NET.remote) return _tickNet();
    advanceClock();
    if (S.people) RES = S.people.length;
    recalcPop();
    renderPanel(false);
    drawMinimap();
  };
  const _workersNet = updateWorkers;
  updateWorkers = function (dt) {
    if (!NET.remote) return _workersNet(dt);
    for (const w of S.workers || []) {
      if (w._tx == null) continue;
      w.x += (w._tx - w.x) * 0.12;
      w.y += (w._ty - w.y) * 0.12;
      w.moving = Math.hypot(w._tx - w.x, w._ty - w.y) > 0.05;
    }
  };
  const _loadNet = load;
  load = function () {
    const r = _loadNet();
    if (NET.remote) world.nextId = Math.max(world.nextId, LOCAL_ID);
    return r;
  };
  const _popupNet = updatePopup;
  updatePopup = function () {
    _popupNet();
    if (NET.role) netDrawCursors();
  };
  if (typeof simulateOffline === "function") {
    const _simNet = simulateOffline;
    simulateOffline = function (ms) {
      return NET.remote ? null : _simNet(ms);
    };
  }
  if (typeof loginStreak === "function") {
    const _streakNet = loginStreak;
    loginStreak = function () {
      return NET.remote ? null : _streakNet();
    };
  }
  setInterval(() => {
    if (NET.host && NET.users.length > 1) netSendState();
  }, 400);
}
