const cars = [];
let tripTokens = 4, ambientT = 0, lastVR = null;
const pendingArrivals = [];

function roadPath(a, b, maxNodes) {
  if (a.x === b.x && a.y === b.y) return [[b.x, b.y]];
  const start = tkey(a.x, a.y), goal = tkey(b.x, b.y), prev = new Map([[start, start]]), q = [a.x, a.y];
  let found = false;
  for (let h = 0; h < q.length && q.length < (maxNodes || 20000) * 2; h += 2) {
    const cx = q[h], cy = q[h + 1];
    if (cx === b.x && cy === b.y) { found = true; break; }
    const c = tkey(cx, cy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, ni = tkey(nx, ny);
      if (prev.has(ni) || !isRoad(nx, ny)) continue;
      prev.set(ni, c); q.push(nx, ny);
    }
  }
  if (!found && !prev.has(goal)) return null;
  const path = [];
  for (let c = goal; c !== start; c = prev.get(c)) path.push([tkeyX(c), tkeyY(c)]);
  path.reverse();
  return path;
}

function nearView(x, y, pad) {
  const vr = lastVR; if (!vr) return false;
  return x >= vr.x0 - pad && x <= vr.x1 + pad && y >= vr.y0 - pad && y <= vr.y1 + pad;
}
const CAR_COLS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#8e24aa', '#eceff1', '#455a64', '#00897b', '#6d4c41', '#212121', '#c0ca33'];
function tripEvent(p, from, to) {
  if (!from || !to || THUMB || tripTokens < 1 || cam.z < 0.32) return;
  const ra = frontRoad(from), rb = frontRoad(to);
  if (!ra || !rb || ra.c !== rb.c) return;
  if (!nearView(ra.x, ra.y, 6) && !nearView(rb.x, rb.y, 6)) return;
  const d = Math.abs(ra.x - rb.x) + Math.abs(ra.y - rb.y);
  if (d < 2) return;
  const drive = d > 14 && (p.m > 120 || ['business', 'entrepreneur', 'doctor', 'scientist'].includes(p.k)) && ageOf(p) >= 18 && Math.random() < 0.85;
  if (drive && cars.length >= 70) return;
  if (!drive && walkers.length >= 90) return;
  const path = roadPath(ra, rb, 9000); if (!path || !path.length) return;
  tripTokens--;
  if (drive) spawnCar(Math.random() < 0.08 ? 'taxi' : 'car', ra, path, { col: CAR_COLS[p.id % CAR_COLS.length], pid: p.id });
  else {
    const w = newWalker('leave', ra.x, ra.y);
    w.path = path.length > 60 ? path.slice(0, 60) : path; w.wait = 0; w.pid = p.id;
    w.shirt = CAR_COLS[(p.id * 7) % CAR_COLS.length]; w.speed = ageOf(p) > 65 ? rand(0.8, 1) : ageOf(p) < 13 ? rand(1.5, 1.9) : rand(1.1, 1.5);
    if (ageOf(p) < 13) w.kid = true;
    walkers.push(w);
  }
}
function spawnCar(kind, start, path, o) {
  const c = Object.assign({ isCar: true, kind, x: start.x, y: start.y, path, dx: 1, dy: 0, spd: kind === 'bus' || kind === 'truck' ? 2.1 : 2.8, v: 0, alpha: 0, col: pick(CAR_COLS), wait: 0, ret: null }, o || {});
  if (path.length) { c.dx = Math.sign(path[0][0] - c.x); c.dy = Math.sign(path[0][1] - c.y); if (!c.dx && !c.dy) c.dx = 1; }
  cars.push(c);
  return c;
}
function dispatchVehicle(kind, fromE, toE, onArrive) {
  const ra = frontRoad(fromE), rb = frontRoad(toE);
  const path = ra && rb && ra.c === rb.c ? roadPath(ra, rb, 30000) : null;
  if (!path) { pendingArrivals.push({ t: NOW + 9000, fn: onArrive }); return null; }
  const c = spawnCar(kind, ra, path, { siren: true, spd: 4.2, onArrive, home: ra, col: { police: '#ffffff', fire: '#d32f2f', ambulance: '#ffffff' }[kind] });
  c.alpha = 1;
  return c;
}

function updateTraffic(dt) {
  if (!S || dt <= 0) return;
  tripTokens = Math.min(6, tripTokens + dt * 5);
  for (let i = pendingArrivals.length - 1; i >= 0; i--) if (NOW >= pendingArrivals[i].t) { const a = pendingArrivals.splice(i, 1)[0]; if (a.fn) a.fn(); }

  ambientT -= dt;
  if (ambientT <= 0 && lastVR && cam.z >= 0.32) {
    const h = hourOfDay ? hourOfDay() : 12, rush = (h >= 7 && h <= 9) || (h >= 16 && h <= 19) ? 2 : h >= 23 || h < 5 ? 0.25 : 1;
    ambientT = 1.2 / rush;
    const want = Math.min(26, Math.round((RES || 0) / 30 * rush));
    if (cars.filter((c) => !c.siren).length < want) {
      const rs = roads().filter((r) => r.t !== 'bridge' && nearView(r.x, r.y, 2));
      if (rs.length > 6) {
        const a = pick(rs), b = pick(rs);
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 6) {
          const path = roadPath(a, b, 6000);
          if (path) { const r = Math.random(); spawnCar(r < 0.06 && RES > 120 ? 'bus' : r < 0.14 && RES > 60 ? 'truck' : r < 0.2 && RES > 80 ? 'taxi' : 'car', a, path); }
        }
      }
    }
  }
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    if (c.fading) { c.alpha -= dt * 2.5; if (c.alpha <= 0) cars.splice(i, 1); continue; }
    if (c.alpha < 1) c.alpha = Math.min(1, c.alpha + dt * 3);
    if (c.wait > 0) { c.wait -= dt; if (c.wait <= 0 && c.after) { const f = c.after; c.after = null; f(); } continue; }
    if (!c.path.length) {
      if (c.onArrive) { const f = c.onArrive; c.onArrive = null; c.wait = c.kind === 'fire' ? 3.5 : 2.5; c.working = true; c.after = () => { f(); c.working = false; goHomeCar(c); }; continue; }
      c.fading = true; continue;
    }
    const [tx, ty] = c.path[0];
    if (!isRoad(tx, ty)) { c.fading = true; continue; }

    let block = false;
    if (!c.siren) for (const o of cars) {
      if (o === c || o.fading) continue;
      const ax = o.x - c.x, ay = o.y - c.y;
      if (o.dx === c.dx && o.dy === c.dy && ax * c.dx + ay * c.dy > 0.05 && ax * c.dx + ay * c.dy < 0.75 && Math.abs(ax * c.dy - ay * c.dx) < 0.3) { block = true; break; }
    }
    const target = block ? 0 : c.spd;
    c.v += (target - c.v) * Math.min(1, dt * (block ? 10 : 3));
    const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), st = c.v * dt;
    if (d > 0.001) { c.dx = Math.sign(Math.round(dx * 100)); c.dy = c.dx ? 0 : Math.sign(dy); }
    if (d <= st) { c.x = tx; c.y = ty; c.path.shift(); }
    else { c.x += (dx / d) * st; c.y += (dy / d) * st; }
  }
}
function goHomeCar(c) {
  if (!c.home) { c.fading = true; return; }
  const p = roadPath({ x: Math.round(c.x), y: Math.round(c.y) }, c.home, 30000);
  c.siren = false; c.spd = 2.6;
  if (p && p.length) { c.path = p; c.home = null; } else c.fading = true;
}

function carBox(c, L, W, z0, z1, top, left, right) {
  const lane = 0.17, cx = c.x + 0.5 + (c.dx ? 0 : -c.dy * lane), cy = c.y + 0.5 + (c.dy ? 0 : c.dx * lane);
  const along = c.dx !== 0;
  const w = along ? L : W, h = along ? W : L;
  prism(cx - w / 2, cy - h / 2, w, h, z0, z1, top, left, right);
  return [cx, cy];
}
function drawCar(c) {
  ctx.globalAlpha = c.alpha;
  const lane = 0.17, cx = c.x + 0.5 + (c.dx ? 0 : -c.dy * lane), cy = c.y + 0.5 + (c.dy ? 0 : c.dx * lane);
  const [sx, sy] = P(cx, cy);
  const K = c.kind;
  const L = K === 'bus' ? 0.86 : K === 'fire' ? 0.74 : K === 'truck' ? 0.66 : K === 'ambulance' ? 0.56 : 0.46, W = K === 'bus' || K === 'fire' || K === 'truck' ? 0.3 : 0.26;
  ellipse(sx + 2, sy + 3, (L * 26 + 6), 6, 'rgba(0,0,0,.22)');
  const col = c.col || '#e53935', dk = shade(col, -0.18), dk2 = shade(col, -0.3);
  if (K === 'bus') {
    carBox(c, L, W, 2, 17, shade(col, 0.15), dk, dk2);
    carBox(c, L * 0.94, W * 1.02, 9, 14, null, '#37474f', '#263238');
  } else if (K === 'truck') {
    carBox(c, L, W, 2, 8, dk, dk, dk2);
    const back = { x: c.x - c.dx * 0.12, y: c.y - c.dy * 0.12, dx: c.dx, dy: c.dy };
    carBox(back, L * 0.62, W * 1.05, 8, 18, '#eceff1', '#cfd8dc', '#b0bec5');
    const front = { x: c.x + c.dx * 0.22, y: c.y + c.dy * 0.22, dx: c.dx, dy: c.dy };
    carBox(front, L * 0.3, W, 8, 14, shade(col, 0.1), '#37474f', '#263238');
  } else if (K === 'fire') {
    carBox(c, L, W, 2, 12, '#e53935', '#c62828', '#b71c1c');
    const front = { x: c.x + c.dx * 0.24, y: c.y + c.dy * 0.24, dx: c.dx, dy: c.dy };
    carBox(front, L * 0.3, W, 12, 17, '#ef5350', '#37474f', '#263238');
    const [ax, ay] = P(cx - c.dx * 0.25, cy - c.dy * 0.25, 15), [bx, by] = P(cx + c.dx * 0.15, cy + c.dy * 0.15, 15);
    line([ax, ay], [bx, by], '#cfd8dc', 2.5);
  } else {
    carBox(c, L, W, 2, 8, dk, dk, dk2);
    const cab = { x: c.x - c.dx * 0.03, y: c.y - c.dy * 0.03, dx: c.dx, dy: c.dy };
    carBox(cab, L * 0.58, W * 0.92, 8, 13, K === 'taxi' ? '#fdd835' : shade(col, 0.12), '#455a64', '#37474f');
    if (K === 'taxi') { const [tx, ty] = P(cx, cy, 15); rr(tx - 3, ty - 2, 6, 3, 1, '#212121'); }
    if (K === 'police') { carBox(c, L * 0.99, W * 1.01, 4.5, 6.5, null, '#1565c0', '#0d47a1'); }
    if (K === 'ambulance') { const [rx, ry] = P(cx, cy, 10); ctx.fillStyle = '#e53935'; ctx.fillRect(rx - 3, ry - 1, 6, 2); ctx.fillRect(rx - 1, ry - 3, 2, 6); }
  }
  if (c.siren || c.working) {
    const on = Math.floor(T * 8) % 2 === 0, [lx, ly] = P(cx, cy, K === 'fire' ? 19 : K === 'ambulance' ? 16 : 15);
    circle(lx - 3, ly, 2.2, on ? '#ff1744' : '#2979ff'); circle(lx + 3, ly, 2.2, on ? '#2979ff' : '#ff1744');
    if (!THUMB) addGlow(lx, ly, 22, false);
  }
  if (c.working && K === 'fire' && Math.random() < DT * 30) {
    const [wx, wy] = P(cx, cy, 16);
    spawn({ type: 'dot', x: wx, y: wy, vx: rand(-40, 40), vy: rand(-60, -30), g: 160, life: 0.6, max: 0.6, r: 1.6, c: '#90caf9' });
  }
  if (nightAmt > 0.08) { const [hx, hy] = P(cx + c.dx * L / 2, cy + c.dy * L / 2, 5); addGlow(hx, hy, 12, true); }
  ctx.globalAlpha = 1;
}
