const world = {
  ents: new Map(),
  byType: new Map(),
  occ: new Map(),
  tch: new Map(),
  act: new Map(),
  islands: [],
  nextId: 1,
};
let roadCache = null, mmDirty = true, marketSpotCache = null, sprinkleCache = null;
let spatialDirty = true;

const tkey = (x, y) => x * 131072 + y;
const tkeyX = (k) => Math.floor((k + 65536) / 131072), tkeyY = (k) => k - tkeyX(k) * 131072;
const ckey = (cx, cy) => cx * 100000 + cy;
const idx = tkey;
const inMap = () => true;
function isUnlocked() { return true; }

function resetWorld() {
  world.occ.clear(); world.ents.clear(); world.byType.clear(); world.act.clear(); world.tch.clear();
  world.nextId = 1;
  worldChanged();
}
function worldChanged() { roadCache = null; mmDirty = true; marketSpotCache = null; sprinkleCache = null; spatialDirty = true; }

const TCH_MAX = 1400;
function getTC(cx, cy) {
  const k = ckey(cx, cy);
  let c = world.tch.get(k);
  if (!c) {
    c = genChunkTerrain(cx, cy, S && S.terrEdits);
    world.tch.set(k, c);
    if (world.tch.size > TCH_MAX) { for (const [kk] of world.tch) { if (!world.act.has(kk)) { world.tch.delete(kk); if (world.tch.size <= TCH_MAX * 0.9) break; } } }
  }
  return c;
}
const li = (x, y) => (y & 15) * 16 + (x & 15);
function terrAt(x, y) { return getTC(x >> 4, y >> 4).terr[li(x, y)]; }
function bioAt(x, y) { return getTC(x >> 4, y >> 4).bio[li(x, y)]; }
function isWater(x, y) { return isWaterT(terrAt(x, y)); }
function setTerr(x, y, t) {
  const c = getTC(x >> 4, y >> 4); c.terr[li(x, y)] = t;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) recolorTile(x + dx, y + dy);
}
function recolorTile(x, y) {
  const c = world.tch.get(ckey(x >> 4, y >> 4)); if (!c) return;
  const k = li(x, y), t = c.terr[k];
  if (isWaterT(t)) {
    let f = 0;
    if (!isWater(x, y - 1)) f |= 1; if (!isWater(x + 1, y)) f |= 2; if (!isWater(x, y + 1)) f |= 4; if (!isWater(x - 1, y)) f |= 8;
    c.foam[k] = f; c.col[k] = null;
  } else { c.foam[k] = 0; c.col[k] = tileColour(x, y, t, c.bio[k]); }
  if (typeof invalidateGround === 'function') invalidateGround(x, y);
}

function entAt(x, y) { const id = world.occ.get(tkey(x, y)); return id != null ? world.ents.get(id) || null : null; }
function canPlace(x, y, w, h, ignore) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = x + i, Y = y + j;
    if (isWater(X, Y)) return false;
    const o = world.occ.get(tkey(X, Y));
    if (o != null && o !== ignore) return false;
  }
  return true;
}
function setOcc(e, v) {
  for (let j = 0; j < e.h; j++) for (let i = 0; i < e.w; i++) {
    const k = tkey(e.x + i, e.y + j);
    if (v === -1) { if (world.occ.get(k) === e.id) world.occ.delete(k); }
    else world.occ.set(k, v);
  }
  if (v === -1 && e.nat) natGone(e);
}
function indexEnt(e) { let s = world.byType.get(e.t); if (!s) { s = new Set(); world.byType.set(e.t, s); } s.add(e); }
function unindexEnt(e) { const s = world.byType.get(e.t); if (s) s.delete(e); }
function entsOf(t) { return world.byType.get(t) || []; }
function addEnt(e) {
  if (!e.id) e.id = world.nextId++;
  world.ents.set(e.id, e);
  indexEnt(e);
  setOcc(e, e.id);
  if (!e.nat && S && GEN) markBuilt(e);
  worldChanged();
  return e;
}
function removeEnt(e) {
  setOcc(e, -1);
  world.ents.delete(e.id);
  unindexEnt(e);
  if (!e.nat) worldChanged();
}
function newEntity(t, x, y, extra) {
  const b = BUILD[t];
  const e = { t, x, y, w: b.w, h: b.h };
  if (t === 'field') { e.crop = null; e.pt = 0; }
  if (b.rent) { e.rt = NOW; e.v = randi(6); }
  if (FACTORY_TYPES.includes(t)) { e.job = null; e.queue = []; e.out = []; }
  if (b.animal) e.an = Array.from({ length: b.slots }, () => ({ f: 0 }));
  if (t === 'apartment') e.v = randi(3);
  if (b.art && b.art.pals) e.v = randi(b.art.pals.length);
  if (b.nature || t === 'dtree' || t === 'flowers' || t === 'hedge' || t === 'palm') e.s = randi(1000);
  return Object.assign(e, extra || {});
}

function natGone(e) {
  if (!S) return;
  S.natGone = S.natGone || {};
  const k = ckey(e.x >> 4, e.y >> 4), l = li(e.x, e.y);
  const a = S.natGone[k] || (S.natGone[k] = []);
  if (!a.includes(l)) a.push(l);
  if (typeof invalidateFar === 'function') invalidateFar(e.x >> 4, e.y >> 4);
}
function natCleared(x, y) {
  for (const b of S.clearBoxes || []) {
    const dx = Math.max(b.x0 - x, 0, x - b.x1), dy = Math.max(b.y0 - y, 0, y - b.y1), d = Math.max(dx, dy);
    if (d === 0) return true;
    if (d < 7 && hash2(x, y, 5151) > d / 7) return true;
  }
  return false;
}

function natureSpec(x, y, c) {
  const k = li(x, y), t = c.terr[k];
  const n = natureAt(x, y, t, c.bio[k]); if (!n) return null;
  const o = world.occ.get(tkey(x, y));
  if (o != null) { const oe = world.ents.get(o); if (!oe || !oe.nat) return null; }
  if (natCleared(x, y)) return null;
  const gone = S.natGone && S.natGone[ckey(c.cx, c.cy)]; if (gone && gone.includes(k)) return null;
  return n;
}
function loadChunk(cx, cy) {
  const k = ckey(cx, cy); if (world.act.has(k)) return;
  const c = getTC(cx, cy), a = { cx, cy, nat: [] };
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const x = cx * CH + i, y = cy * CH + j, n = natureSpec(x, y, c); if (!n) continue;
    const e = { t: n.t, x, y, w: 1, h: 1, v: n.v, s: n.s, nat: true, id: world.nextId++ };
    world.ents.set(e.id, e); indexEnt(e); world.occ.set(tkey(x, y), e.id); a.nat.push(e);
  }
  world.act.set(k, a);
}
function unloadChunk(k) {
  const a = world.act.get(k); if (!a) return;
  for (const e of a.nat) {
    if (world.ents.get(e.id) !== e || e.dying) continue;
    world.ents.delete(e.id); unindexEnt(e);
    const tk = tkey(e.x, e.y); if (world.occ.get(tk) === e.id) world.occ.delete(tk);
  }
  world.act.delete(k);
}

let streamT = 0;
function chunkScreenRect(cx, cy) { const X0 = cx * CH, Y0 = cy * CH; return [(X0 - Y0 - CH) * HW, (X0 + Y0) * HH, (X0 - Y0 + CH) * HW, (X0 + Y0 + 2 * CH) * HH]; }
function chunksInView(vr, pad) {
  const out = [], px = pad * CH * HW * 2, py = pad * CH * HH * 2;
  const cx0 = Math.floor(vr.x0 / CH) - pad, cx1 = Math.floor(vr.x1 / CH) + pad, cy0 = Math.floor(vr.y0 / CH) - pad, cy1 = Math.floor(vr.y1 / CH) + pad;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const r = chunkScreenRect(cx, cy);
    if (r[2] >= vr.wx0 - px && r[0] <= vr.wx1 + px && r[3] >= vr.wy0 - py - 80 && r[1] <= vr.wy1 + py) out.push([cx, cy]);
  }
  return out;
}
function streamChunks(vr, budgetMs) {
  const want = chunksInView(vr, 1), t0 = performance.now();
  const mid = [(vr.x0 + vr.x1) / 2 / CH, (vr.y0 + vr.y1) / 2 / CH];
  want.sort((a, b) => Math.hypot(a[0] - mid[0], a[1] - mid[1]) - Math.hypot(b[0] - mid[0], b[1] - mid[1]));
  let n = 0;
  for (const [cx, cy] of want) {
    if (world.act.has(ckey(cx, cy))) continue;
    if (n > 0 && performance.now() - t0 > budgetMs) break;
    loadChunk(cx, cy); n++;
  }
  if (++streamT % 20 === 0) {
    const keep = new Set(chunksInView(vr, 3).map(([cx, cy]) => ckey(cx, cy)));
    for (const k of [...world.act.keys()]) if (!keep.has(k)) unloadChunk(k);
  }
  return n;
}
function loadAround(x, y, r) { for (let cy = (y - r) >> 4; cy <= (y + r) >> 4; cy++) for (let cx = (x - r) >> 4; cx <= (x + r) >> 4; cx++) loadChunk(cx, cy); }

function genStart(seed) {
  initGen(seed, 0, 0);
  const sp = findSpawn();
  S.spawn = sp; S.genSpawn = { x: 0, y: 0 };
  genVillage(mulberry32(seed + 77), sp.x, sp.y);
  loadAround(sp.x, sp.y, 40);
  worldChanged();
}

function genVillage(rng, cx, cy) {
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const L1 = ri(12, 16), L2 = ri(12, 16), V1 = ri(7, 10), V2 = ri(7, 11);
  const side = rng() < 0.5 ? 1 : -1;
  const roadAt = new Set();
  const R = (x, y) => { if (!isWater(x, y) && !entAt(x, y)) { addEnt(newEntity('road', x, y)); roadAt.add(tkey(x, y)); } };
  for (let x = cx - L1; x <= cx + L2; x++) R(x, cy);
  for (let y = cy - V1; y <= cy + V2; y++) R(cx, y);
  const y2 = cy + side * ri(7, 8), xa = cx - ri(6, 9), xb = cx + ri(8, 12);
  if (rng() < 0.75) { for (let x = xa; x <= xb; x++) R(x, y2); }
  const free = (t, x, y) => { const b = BUILD[t]; return canPlace(x, y, b.w, b.h); };
  const put = (t, x, y, extra) => free(t, x, y) ? addEnt(newEntity(t, x, y, extra)) : null;
  const H = (t, x, y) => put(t, x, y, { v: Math.floor(rng() * 6), rt: NOW - Math.floor(rng() * BUILD[t].rentTime * 0.9) });

  put('townhall', cx + 1, cy - 3) || put('townhall', cx - 4, cy - 3);
  put('market', cx + 1, cy + 1) || put('market', cx - 3, cy + 1);
  put('fountain', cx - 3, cy - 2);
  put('bench', cx - 4, cy - 1); put('lamp', cx - 1, cy - 1); put('lamp', cx + 4, cy - 1); put('lamp', cx - 1, cy + 1);

  const lots = [];
  for (let x = cx - L1 + 4; x <= cx + L2 - 1; x += 3) { if (Math.abs(x - cx) > 4) { lots.push([x, cy - 2]); lots.push([x, cy + 1]); } }
  for (let y = cy - V1; y <= cy + V2 - 1; y += 3) { if (Math.abs(y - cy) > 3 && Math.abs(y - y2) > 2) { lots.push([cx - 2, y]); lots.push([cx + 1, y]); } }
  for (let x = xa + 1; x <= xb - 1; x += 3) { if (Math.abs(x - cx) > 2) { lots.push([x, y2 - 2]); lots.push([x, y2 + 1]); } }
  for (let i = lots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [lots[i], lots[j]] = [lots[j], lots[i]]; }
  let homes = 0, pop = 0;
  for (const [x, y] of lots) {
    if (pop >= 46) break;
    const t = rng() < 0.35 ? 'cottage' : 'house';
    if (H(t, x, y)) { homes++; pop += BUILD[t].pop; if (rng() < 0.4) put('flowers', x + 2, y + (y < cy ? 1 : 0)); }
  }

  const fx = cx - L1 - 1, dir = rng() < 0.5 ? 1 : -1;
  for (let x = fx - 5; x < fx; x++) R(x, cy);
  const fy = dir > 0 ? cy + 1 : cy - 3;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) put('field', fx - 1 - i, fy + j * dir + (dir < 0 ? 0 : 0));
  put('barn', fx + 1, dir > 0 ? cy + 1 : cy - 2) || put('barn', fx - 6, cy + dir);
  put('windmill', fx - 3, dir > 0 ? cy - 3 : cy + 2) || put('windmill', fx - 6, cy - 3);
  for (let k = 0; k < 8; k++) put('dtree', cx + ri(-L1, L2), cy + ri(-V1, V2));
  S.clearBoxes = [{ x0: cx - L1 - 9, y0: cy - V1 - 3, x1: cx + L2 + 3, y1: cy + V2 + 3 }];
  void homes;
}

function markBuilt(e) {
  S.natGone = S.natGone || {};
  for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) {
    const c = getTC(x >> 4, y >> 4), l = li(x, y);
    if (!natureAt(x, y, c.terr[l], c.bio[l])) continue;
    const k = ckey(x >> 4, y >> 4), a = S.natGone[k] || (S.natGone[k] = []);
    if (!a.includes(l)) a.push(l);
  }
}

let discT = 0;
function discoverTick() {
  if (++discT % 4 || !S) return;
  const w = screenToWorld(VW / 2, VH / 2), t = worldToTileF(w[0], w[1]);
  const b = BIOMES[bioAt(Math.floor(t[0]), Math.floor(t[1]))];
  if (!b || !b.col) return;
  S.biomesSeen = S.biomesSeen || {};
  if (S.biomesSeen[b.id]) return;
  const first = !Object.keys(S.biomesSeen).length;
  S.biomesSeen[b.id] = typeof yearOf === 'function' && S.day0 != null ? yearOf(dayNum()) : 1;
  if (first) return;
  S.stats.expansions++; addXP(10);
  toast(`🧭 Discovered <b>${b.icon} ${b.name}</b>! (${Object.keys(S.biomesSeen).length} biomes found)`, 'good');
  if (typeof news === 'function' && S.news) news(b.icon, `Explorers mapped a new biome: ${b.name}.`);
}
