const walkers = [];

function isRoad(x, y) { const e = entAt(x, y); return !!e && !!BUILD[e.t].walk && !e.moving; }
function roads() {
  if (!roadCache) {
    roadCache = [];
    for (const e of world.ents.values()) if (BUILD[e.t].walk && !e.moving && (e.t === 'bridge' || isUnlocked(e.x, e.y))) roadCache.push(e);
  }
  return roadCache;
}
function bfs(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  if (!isRoad(sx, sy) || !isRoad(tx, ty)) return null;
  return roadPath({ x: sx, y: sy }, { x: tx, y: ty }, 20000);
}
function marketSpot() {
  if (marketSpotCache) return marketSpotCache;
  let m = null;
  for (const e of world.ents.values()) if (e.t === 'market' && !e.moving) { m = e; break; }
  if (!m) return null;
  let best = null, bd = 1e9;
  for (const r of roads()) {
    const dx = Math.max(m.x - r.x, 0, r.x - (m.x + m.w - 1));
    const dy = Math.max(m.y - r.y, 0, r.y - (m.y + m.h - 1));
    const d = dx + dy;
    if (d < bd) { bd = d; best = r; }
  }
  marketSpotCache = best ? { x: best.x, y: best.y } : { x: m.x, y: m.y + m.h };
  return marketSpotCache;
}

function newWalker(kind, x, y) {
  return {
    isW: true, kind, x, y, path: [], speed: rand(1.1, 1.6), ph: Math.random() * 6,
    shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hair: pick(HAIRS),
    wait: rand(0, 1.5), alpha: 0, ox: rand(-0.2, 0.2), oy: rand(-0.2, 0.2), moving: false, bubble: null, bubbleT: 0,
  };
}
function spawnVillager() {
  const rs = roads(); if (!rs.length) return;
  const r = pick(rs);
  walkers.push(newWalker('v', r.x, r.y));
}
function spawnCustomer(o, instant) {
  const spot = marketSpot();
  const rs = roads();
  const w = newWalker('c', 0, 0);
  w.order = o.id; w.shirt = o.color; w.ox = rand(-0.4, 0.4); w.oy = rand(-0.4, 0.4); w.speed = rand(1.5, 1.9);
  if (!spot) return;
  if (instant || !rs.length) { w.x = spot.x; w.y = spot.y; }
  else {

    let start = pick(rs);
    for (let k = 0; k < 8; k++) { const r = pick(rs); if (Math.abs(r.x - spot.x) + Math.abs(r.y - spot.y) > 8) { start = r; break; } }
    w.x = start.x; w.y = start.y;
    const p = bfs(start.x, start.y, spot.x, spot.y);
    if (p) w.path = p; else { w.x = spot.x; w.y = spot.y; }
    w.wait = 0;
  }
  walkers.push(w);
}
function customerLeave(orderId, happy) {
  const w = walkers.find((w) => w.kind === 'c' && w.order === orderId);
  if (!w) return;
  w.kind = 'leave';
  w.bubble = happy ? pick(['😊', '😍', '🥰', '👍', '❤️']) : '😞';
  w.bubbleT = 3;
  const rs = roads();
  w.x = Math.round(w.x); w.y = Math.round(w.y);
  if (rs.length) {
    let dest = pick(rs);
    for (let k = 0; k < 8; k++) { const r = pick(rs); if (Math.abs(r.x - w.x) + Math.abs(r.y - w.y) > 8) { dest = r; break; } }
    w.path = bfs(w.x, w.y, dest.x, dest.y) || [];
  }
  w.wait = 0.5;
  if (!w.path.length) w.fading = true;
}

function updateWalkers(dt) {
  const target = clamp(Math.floor(POP / 12), 2, 10);
  let nv = 0;
  for (const w of walkers) if (w.kind === 'v' && !w.fading) nv++;
  if (nv < target && Math.random() < dt * 1.5) spawnVillager();

  for (let i = walkers.length - 1; i >= 0; i--) {
    const w = walkers[i];
    if (w.fading) { w.alpha -= dt * 2; w.moving = false; if (w.alpha <= 0) walkers.splice(i, 1); continue; }
    if (w.alpha < 1) w.alpha = Math.min(1, w.alpha + dt * 2);
    if (w.bubbleT > 0) { w.bubbleT -= dt; if (w.bubbleT <= 0) w.bubble = null; }
    if (w.kind === 'c' && !w.path.length) {

      const o = S.orders.find((o) => o.id === w.order);
      if (!o) { customerLeave(w.order, false); continue; }
      const keys = Object.keys(o.items);
      w.bubble = canFulfill(o) ? '✅' : ITEMS[keys[Math.floor(T / 1.6) % keys.length]].icon;
      w.moving = false;
      const spot = marketSpot();
      if (spot && (Math.abs(spot.x - w.x) + Math.abs(spot.y - w.y) > 1.5)) {
        const p = bfs(Math.round(w.x), Math.round(w.y), spot.x, spot.y);
        if (p) w.path = p; else { w.x = spot.x; w.y = spot.y; }
      }
      continue;
    }
    if (w.wait > 0) { w.wait -= dt; w.moving = false; continue; }
    if (w.path.length) {
      const [tx, ty] = w.path[0];
      if (!isRoad(tx, ty)) { w.path = []; w.x = Math.round(w.x); w.y = Math.round(w.y); continue; }
      const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy), st = w.speed * dt;
      if (d > 0.001) { w.dx = dx; w.dy = dy; }
      if (d <= st) { w.x = tx; w.y = ty; w.path.shift(); }
      else { w.x += (dx / d) * st; w.y += (dy / d) * st; }
      w.moving = true; w.ph += dt * w.speed * 9;
    } else {
      w.moving = false;
      if (w.kind === 'leave' || w.kind === 'van') { w.fading = true; continue; }

      if (nv > target + 2) { w.fading = true; nv--; continue; }
      const rs = roads();
      if (!rs.length || !isRoad(w.x, w.y)) { w.fading = true; continue; }
      const d = pick(rs);
      const p = bfs(w.x, w.y, d.x, d.y);
      if (p && p.length) w.path = p.length > 30 ? p.slice(0, 30) : p;
      w.wait = rand(0.4, 2.5);
      if (Math.random() < 0.12) { w.bubble = pick(['💬', '🎵', '❤️', '☀️', '🌾', '😄', '👋']); w.bubbleT = 2; }
    }
  }
}
