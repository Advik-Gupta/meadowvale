let playerIdx = new Map();
function rebuildSpatial() {
  playerIdx = new Map();
  for (const e of world.ents.values()) {
    if (e.nat) continue;
    const k = ckey(e.x >> 4, e.y >> 4);
    let a = playerIdx.get(k); if (!a) playerIdx.set(k, a = []); a.push(e);
  }
  spatialDirty = false;
}
function visibleEnts(vr) {
  if (spatialDirty) rebuildSpatial();
  const out = [];
  for (const [cx, cy] of chunksInView(vr, 1)) {
    const k = ckey(cx, cy), a = world.act.get(k), p = playerIdx.get(k);
    if (a) for (const e of a.nat) if (world.ents.get(e.id) === e) out.push(e);
    if (p) for (const e of p) out.push(e);
  }
  return out;
}

const gbuf = { tufts: [], pebbles: [], sparks: [], foams: [], flowers: [] };
function drawGround(vr) {
  const { wx0, wx1, wy0, wy1 } = vr;
  const detail = cam.z > 0.55;
  const { tufts, pebbles, sparks, foams, flowers } = gbuf;
  tufts.length = pebbles.length = sparks.length = foams.length = flowers.length = 0;
  for (const [cx, cy] of chunksInView(vr, 0)) {
    const c = getTC(cx, cy), X0 = cx * CH, Y0 = cy * CH;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = X0 + i, y = Y0 + j;
      const sx = (x - y) * HW, sy = (x + y) * HH;
      if (sx + HW < wx0 || sx - HW > wx1 || sy + TH < wy0 || sy > wy1) continue;
      const k = j * CH + i, t = c.terr[k];
      let col;
      if (isWaterT(t)) {
        const q = ((Math.sin(T * 1.6 + x * 0.8 + y * 0.45) + Math.sin(T * 1.1 - x * 0.35 + y * 0.9)) * 0.25 + 0.5) * 7.99 | 0;
        col = (t === T_DEEP ? WATER_DEEP : WATER_SHALLOW)[q];
      } else col = c.col[k];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 0.7); ctx.lineTo(sx + HW + 1.2, sy + HH); ctx.lineTo(sx, sy + TH + 0.7); ctx.lineTo(sx - HW - 1.2, sy + HH);
      ctx.closePath(); ctx.fill();
      if (detail) {
        const d = c.det[k];
        if (t === T_GRASS || t === T_FOREST) {
          if (d < 0.45) tufts.push(sx + ((d * 80) % 36) - 18, sy + HH + ((d * 130) % 12) - 6);
          else if (d > 0.965) flowers.push(sx + ((d * 900) % 30) - 15, sy + HH + ((d * 400) % 10) - 5, d);
        } else if ((t === T_DIRT || t === T_SAND || t === T_STONE) && d < (t === T_SAND ? 0.3 : 0.5)) pebbles.push(sx + ((d * 90) % 34) - 17, sy + HH + ((d * 170) % 12) - 6, d);
        else if (t === T_DEEP && d < 0.2) sparks.push(sx + ((d * 300) % 30) - 15, sy + HH + ((d * 77) % 8) - 4, d);
        if (c.foam[k]) foams.push(x, y, c.foam[k]);
      }
    }
  }
  if (!detail) return;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(60,125,40,.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let k = 0; k < tufts.length; k += 2) { const x = tufts[k], y = tufts[k + 1]; ctx.moveTo(x - 2, y); ctx.lineTo(x - 3.5, y - 4); ctx.moveTo(x, y); ctx.lineTo(x, y - 5.5); ctx.moveTo(x + 2, y); ctx.lineTo(x + 3.5, y - 4); }
  ctx.stroke();
  for (let k = 0; k < flowers.length; k += 3) circle(flowers[k], flowers[k + 1], 1.8, flowers[k + 2] > 0.985 ? '#fff6a8' : '#ffffff');
  ctx.fillStyle = 'rgba(110,80,50,.4)';
  for (let k = 0; k < pebbles.length; k += 3) { ctx.beginPath(); ctx.ellipse(pebbles[k], pebbles[k + 1], 1.6 + pebbles[k + 2] * 2, 1 + pebbles[k + 2], 0, 0, Math.PI * 2); ctx.fill(); }
  for (let k = 0; k < sparks.length; k += 3) {
    const a = (Math.sin(T * 2.5 + sparks[k + 2] * 40) + 1) * 0.3; if (a < 0.05) continue;
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sparks[k] - 4, sparks[k + 1]); ctx.lineTo(sparks[k] + 4, sparks[k + 1]); ctx.stroke();
  }
  const fa = 0.4 + Math.sin(T * 2) * 0.15;
  ctx.strokeStyle = `rgba(255,255,255,${fa})`; ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k < foams.length; k += 3) {
    const x = foams[k], y = foams[k + 1], f = foams[k + 2];
    if (f & 1) foamSeg(x, y, x + 1, y); if (f & 2) foamSeg(x + 1, y, x + 1, y + 1); if (f & 4) foamSeg(x + 1, y + 1, x, y + 1); if (f & 8) foamSeg(x, y + 1, x, y);
  }
  ctx.stroke();
}

function foamSeg(ax, ay, bx, by) { ctx.moveTo((ax - ay) * HW, (ax + ay) * HH + 1); ctx.lineTo((bx - by) * HW, (bx + by) * HH + 1); }

const groundCache = new Map(), farCache = new Map();
const GC_SCALE = 0.5, FAR_SCALE = 0.25, GC_MAX = 110, FAR_MAX = 260, NAT_Z = 0.3, FAR_PAD = 90;
function tileFill(g, c, i, j) {
  const k = j * CH + i, t = c.terr[k], x = c.cx * CH + i, y = c.cy * CH + j;
  g.fillStyle = isWaterT(t) ? (t === T_DEEP ? WATER_DEEP[3] : WATER_SHALLOW[3]) : c.col[k];
  const sx = (x - y) * HW, sy = (x + y) * HH;
  g.beginPath(); g.moveTo(sx, sy - 1); g.lineTo(sx + HW + 1.5, sy + HH); g.lineTo(sx, sy + TH + 1); g.lineTo(sx - HW - 1.5, sy + HH); g.closePath(); g.fill();
}
function invalidateGround(x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = ckey((x + dx) >> 4, (y + dy) >> 4); groundCache.delete(k); farCache.delete(k); }
  mmChunks.delete(ckey(x >> 4, y >> 4)); mmDirty = true;
}
function invalidateFar(cx, cy) { farCache.delete(ckey(cx, cy)); }
function resetGroundCaches() { groundCache.clear(); farCache.clear(); mmChunks.clear(); }
function chunkImage(cx, cy, far) {
  const cache = far ? farCache : groundCache, k = ckey(cx, cy);
  let img = cache.get(k);
  if (img) return img;
  const sc = far ? FAR_SCALE : GC_SCALE, pad = far ? FAR_PAD : 0;
  img = document.createElement('canvas');
  img.width = Math.ceil(2 * CH * HW * sc) + 4; img.height = Math.ceil((2 * CH * HH + pad) * sc) + 4;
  const g = img.getContext('2d'), c = getTC(cx, cy);
  const X0 = cx * CH, Y0 = cy * CH, ox = (X0 - Y0 - CH) * HW, oy = (X0 + Y0) * HH - pad;
  g.setTransform(sc, 0, 0, sc, -ox * sc + 2, -oy * sc + 2);
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) tileFill(g, c, i, j);
  if (far) {

    const prev = ctx; ctx = g;
    for (let s = 0; s < CH * 2 - 1; s++) for (let i = 0; i <= s; i++) {
      const j = s - i; if (i >= CH || j >= CH) continue;
      const x = X0 + i, y = Y0 + j, n = natureSpec(x, y, c); if (!n) continue;
      blitNature(x, y, n.t, n.v, n.s, false, 0);
    }
    ctx = prev;
  }
  img.ox = ox; img.oy = oy;
  cache.set(k, img);
  const max = far ? FAR_MAX : GC_MAX;
  while (cache.size > max) cache.delete(cache.keys().next().value);
  return img;
}
function drawGroundCached(vr) {
  const far = cam.z < NAT_Z, sc = far ? FAR_SCALE : GC_SCALE, cache = far ? farCache : groundCache;
  const list = chunksInView(vr, 0).sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  let built = 0;
  for (const [cx, cy] of list) {
    const k = ckey(cx, cy);
    if (!cache.has(k)) {
      if (built >= (far ? 10 : 16)) {
        const alt = (far ? groundCache : farCache).get(k);
        if (alt) { const s2 = far ? GC_SCALE : FAR_SCALE; ctx.drawImage(alt, alt.ox - 2 / s2, alt.oy - 2 / s2, alt.width / s2, alt.height / s2); }
        continue;
      }
      built++;
    }
    const img = chunkImage(cx, cy, far);
    ctx.drawImage(img, img.ox - 2 / sc, img.oy - 2 / sc, img.width / sc, img.height / sc);
  }
}

let mm = null, mmx = null, mmBase = null, mmBaseCtx = null, mmLast = 0, mmCenter = { x: 0, y: 0 };
const MMK = 1, MM_R = 96;
const mmChunks = new Map();
const MM_COL = { [T_SNOW]: '#eef4f8', [T_GRASS]: '#7cc458', [T_FOREST]: '#5ea848', [T_DIRT]: '#c6a36b', [T_SAND]: '#ecd9a0', [T_SHALLOW]: '#62c2da', [T_DEEP]: '#3a96c8', [T_STONE]: '#9b9b98' };
let mmTerr = null;
function mmPt(x, y) { const dx = x - mmCenter.x, dy = y - mmCenter.y; return [(dx - dy) * MMK + MM_R * 2 * MMK, (dx + dy) * MMK / 2 + MM_R * MMK]; }
function mmToTile(px, py) { const a = (px - MM_R * 2 * MMK) / MMK, b = (py - MM_R * MMK) * 2 / MMK; return [mmCenter.x + (a + b) / 2, mmCenter.y + (b - a) / 2]; }
function initMinimap() {
  mm = document.getElementById('minimap'); mmx = mm.getContext('2d');
  mm.width = MM_R * 4 * MMK; mm.height = MM_R * 2 * MMK;
  mmBase = document.createElement('canvas'); mmBase.width = mm.width; mmBase.height = mm.height;
  mmBaseCtx = mmBase.getContext('2d');
}
function mmChunk(cx, cy) {
  const k = ckey(cx, cy); let img = mmChunks.get(k); if (img) return img;
  img = document.createElement('canvas'); img.width = CH * 2 * MMK + 2; img.height = CH * MMK + 2;
  const g = img.getContext('2d'), c = getTC(cx, cy);
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) { g.fillStyle = MM_COL[c.terr[j * CH + i]] || '#7cc458'; g.fillRect((i - j) * MMK + CH * MMK, (i + j) * MMK / 2, 2 * MMK, Math.max(1, MMK)); }
  mmChunks.set(k, img); if (mmChunks.size > 900) mmChunks.delete(mmChunks.keys().next().value);
  return img;
}
function redrawMinimapBase() {
  const [tx, ty] = (() => { const w = screenToWorld(VW / 2, VH / 2); return worldToTileF(w[0], w[1]); })();
  mmCenter = { x: Math.round(tx), y: Math.round(ty) };
  const c = mmBaseCtx; c.fillStyle = '#25618a'; c.fillRect(0, 0, mmBase.width, mmBase.height);
  let built = 0, missing = false;
  for (let cy = (mmCenter.y - MM_R) >> 4; cy <= (mmCenter.y + MM_R) >> 4; cy++) for (let cx = (mmCenter.x - MM_R) >> 4; cx <= (mmCenter.x + MM_R) >> 4; cx++) {
    if (!mmChunks.has(ckey(cx, cy)) && built++ > 24) { missing = true; continue; }
    const img = mmChunk(cx, cy), [px, py] = mmPt(cx * CH, cy * CH);
    c.drawImage(img, px - CH * MMK, py);
  }
  if (spatialDirty) rebuildSpatial();
  for (const list of playerIdx.values()) for (const e of list) {
    if (Math.abs(e.x - mmCenter.x) > MM_R + 4 || Math.abs(e.y - mmCenter.y) > MM_R + 4) continue;
    c.fillStyle = BUILD[e.t].walk ? (e.t === 'bridge' ? '#b98b55' : '#80838a') : e.t === 'field' ? '#8a5a35' : HOUSE_TYPES.includes(e.t) ? '#ff8a5c' : e.t === 'dtree' ? '#2f6b2a' : '#e8503a';
    for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) { const [px, py] = mmPt(x, y); c.fillRect(px - MMK, py, 2 * MMK, Math.max(1, MMK)); }
  }
  mmDirty = missing; mmLast = performance.now();
}
function drawMinimap() {
  if (!mm) return;
  const w = screenToWorld(VW / 2, VH / 2), t = worldToTileF(w[0], w[1]);
  const moved = Math.abs(t[0] - mmCenter.x) + Math.abs(t[1] - mmCenter.y) > 12;
  if ((mmDirty || moved) && performance.now() - mmLast > (moved ? 250 : 900)) redrawMinimapBase();
  mmx.clearRect(0, 0, mm.width, mm.height);
  mmx.drawImage(mmBase, 0, 0);
  const toMM = (sx, sy) => { const q = screenToWorld(sx, sy), tt = worldToTileF(q[0], q[1]); return mmPt(tt[0], tt[1]); };
  const a = toMM(0, 0), b = toMM(VW, VH);
  mmx.strokeStyle = '#fff'; mmx.lineWidth = 1.5;
  mmx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
}

(function warmSprites() {
  const jobs = [];
  for (const hi of [false, true]) {
    for (let v = 0; v < 7; v++) for (let k = 0; k < (v === 2 ? 3 : 1); k++) jobs.push(['tree', v, 15 + k * 37, hi]);
    for (let k = 0; k < 12; k++) jobs.push(['rock', 0, k * 10, hi]);
    for (let k = 0; k < 6; k++) jobs.push(['bush', 0, k * 10 + 5, hi]);
  }
  const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 50));
  const step = (dl) => { while (jobs.length && dl.timeRemaining() > 2) { const [t, v, s, hi] = jobs.pop(); natSprite(t, v, s, hi); } if (jobs.length) idle(step); };
  window.addEventListener('load', () => setTimeout(() => idle(step), 1500));
})();
