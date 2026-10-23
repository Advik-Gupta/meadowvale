function drawDuck(p, st) {
  const [sx, sy] = P(p.x, p.y);
  const bob = Math.sin(T * 3 + p.ph) * 1;
  ctx.save(); ctx.translate(sx, sy + bob); ctx.scale(p.dir, 1);
  ellipse(0, -3, 5.5, 3, '#ffffff'); ellipse(-1, -3.5, 3, 1.8, '#e8e8e8');
  circle(4, -7, 2.4, '#2e7d32'); poly([[6, -7.4], [9, -6.6], [6, -6]], '#ffb300'); circle(4.6, -7.6, 0.5, '#111');
  if (st === 'ready') { for (let k = 0; k < 2; k++) ellipse(-6 + k * 3, -1, 1.2, 2.4, '#fafafa'); }
  ctx.restore();
}
function drawMushPot(p, st, e, i) {
  const x = e.x + 0.35 + (i % 3) * 0.55, y = e.y + 0.6 + Math.floor(i / 3) * 0.7;
  prism(x, y, 0.3, 0.3, 0, 5, '#8d6e63', '#795548', '#6d4c41');
  if (st === 'hungry') return;
  const a = e.an[i], g = st === 'ready' ? 1 : clamp((NOW - a.f) / BUILD[e.t].time, 0.15, 1);
  const [cx, cy] = P(x + 0.15, y + 0.15, 5);
  for (let k = 0; k < 3; k++) { const ox = (k - 1) * 3.5, h = (3 + k % 2 * 2) * g; line([cx + ox, cy], [cx + ox, cy - h], '#f3e5d0', 1.6); ellipse(cx + ox, cy - h - 1, 3 * g + 1, 2 * g + 0.6, k === 1 ? '#d84315' : '#bf8a5a'); }
}
function drawAlpaca(p, st, e, i) {
  const [sx, sy] = P(p.x, p.y);
  const a = e.an[i], g = !a.f ? 0.2 : clamp((NOW - a.f) / BUILD[e.t].time, 0, 1);
  ellipse(sx, sy, 7, 2.6, 'rgba(0,0,0,.22)');
  ctx.save(); ctx.translate(sx, sy); ctx.scale(p.dir, 1);
  const col = ['#f5e6c8', '#e0c9a6', '#ffffff', '#c8a27a'][i % 4];
  for (const lx of [-3.5, -1.5, 1.5, 3.5]) rr(lx - 0.7, -6, 1.4, 6, 0.5, shade(col, -0.25));
  ellipse(0, -8, 5.5 + g * 1.5, 3.6 + g, col);
  rr(3.5, -19, 3, 12, 1.5, col); ellipse(5.5, -19, 3, 2.2, col); circle(6.4, -19.5, 0.5, '#222');
  line([4, -21], [3.5, -23], shade(col, -0.3), 1); line([5.5, -21], [5.5, -23.5], shade(col, -0.3), 1);
  ctx.restore();
}
function drawOyster(p, st, e, i) {
  const x = e.x + 0.6 + (i % 3) * 0.45, y = e.y + 1 + (i % 2) * 0.4;
  const [sx, sy] = P(x, y, 1);
  ellipse(sx, sy, 6, 3, '#8d8f94'); ellipse(sx, sy - 1, 5, 2.3, '#b0b3b8');
  if (st === 'ready') { circle(sx, sy - 2, 1.8, '#fdfdfd'); addGlow(sx, sy - 2, 8); }
}
Object.assign(DRAW, {
  duckpond: (e) => drawPen(e, WATER_SHALLOW[((T * 2) | 0) % 8], (x, y) => { prism(x + 0.1, y + 0.1, 0.6, 0.45, 0, 10, '#c49a63', '#a1774b', '#8a6440'); poly([P(x + 0.15, y + 0.5), P(x + 0.65, y + 0.5), P(x + 0.65, y + 0.75), P(x + 0.15, y + 0.75)], '#b98b55'); }, drawDuck),
  mushcellar: (e) => drawPen(e, '#5d4a3b', (x, y) => { prism(x + 0.1, y + 0.1, 1.6, 0.35, 0, 18, null, '#6d5a4b', '#5a4a3c'); gableRoofX(x + 0.1, y + 0.1, 1.6, 0.35, 18, 8, '#4e3b2d', '#3e2f24', '#5a4a3c', 0.04); }, drawMushPot),
  alpacaranch: (e) => drawPen(e, '#b9d47a', (x, y) => { prism(x + 0.1, y + 0.1, 0.8, 0.6, 0, 18, null, '#d7b48a', '#b9966c'); gableRoofY(x + 0.1, y + 0.1, 0.8, 0.6, 18, 12, '#8d3b2f', '#7a3226', '#d7b48a', 0.06); }, drawAlpaca),
  oysterbed: (e) => drawPen(e, WATER_SHALLOW[((T * 2 + 3) | 0) % 8], (x, y) => { for (let k = 0; k < 4; k++) { const p = P(x + 0.2 + k * 0.45, y + 0.15); rr(p[0] - 1.2, p[1] - 6, 2.4, 8, 1, '#5d4037'); } }, drawOyster),
});
for (const t of ['duckpond', 'mushcellar', 'alpacaranch', 'oysterbed']) { const d = DRAW[t]; DRAW[t] = d; }

function drawOrchard(e) {
  const o = BUILD[e.t].orchard;
  const grown = e.nt == null ? 1 : clamp(1 - (e.nt - NOW) / o.mature, 0.35, 1);
  const first = e.hl === o.harvests && NOW < (e.nt || 0);
  const s = first ? 0.45 + grown * 0.55 : 1;
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  if (e.t === 'orchard_coconut') drawTree(e.x + 0.5, e.y + 0.5, 4, 30, e.id, s * 1.05);
  else drawTree(e.x + 0.5, e.y + 0.5, e.t === 'orchard_olive' ? 2 : 0, 20 + (e.id % 10), e.id, s);
  if (orchardReady(e)) {
    const col = { orchard_apple: '#e53935', orchard_orange: '#ff9800', orchard_cherry: '#c2185b', orchard_olive: '#558b2f', orchard_coconut: '#795548' }[e.t];
    for (let k = 0; k < 7; k++) circle(sx + Math.cos(k * 2.1) * 9 * s, sy - 26 * s + Math.sin(k * 1.7) * 7 * s, 2 * s, col);
    if (!THUMB) bubbleAt(e, 60, { icon: ITEMS[o.item].icon });
  } else if (e.hl <= 0 && !THUMB) bubbleAt(e, 60, { icon: '✂️', small: true });
}
for (const t of ['orchard_apple', 'orchard_orange', 'orchard_cherry', 'orchard_olive', 'orchard_coconut']) DRAW[t] = drawOrchard;

DRAW.signal = (e) => {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  line([sx, sy], [sx, sy - 34], '#455a64', 2.5);
  rr(sx - 4, sy - 44, 8, 14, 2, '#263238');
  const go = Math.sin(T * 0.8 + e.id) > -0.3;
  circle(sx, sy - 40, 2.2, go ? '#43a047' : '#2e3d2e'); circle(sx, sy - 34, 2.2, go ? '#3a2020' : '#e53935');
  addGlow(sx, sy - (go ? 40 : 34), 10);
};
DRAW.berth = (e) => {
  prism(e.x + 0.1, e.y + 0.05, 0.8, 1.9, 0, 4, '#b98b55', '#8a5a34', '#7a4f2c');
  for (const v of [0.2, 1.0, 1.8]) { const p = P(e.x + 0.9, e.y + v, 4); rr(p[0] - 1.5, p[1] - 6, 3, 6, 1, '#5d4037'); }
};
DRAW.helipad = (e) => {
  const c = P(e.x + 1, e.y + 1, 2);
  prism(e.x + 0.15, e.y + 0.15, 1.7, 1.7, 0, 2, '#5a6570', '#4a545e', '#3e464e');
  ctx.beginPath(); ctx.ellipse(c[0], c[1], 26, 13, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '700 13px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', c[0], c[1]);
  const fly = THUMB ? 0 : clamp((NOW - (S.heliFly || 0)) / 4000, 0, 1);
  const away = fly > 0 && fly < 1, up = away ? Math.sin(fly * Math.PI) * 120 : 0;
  ctx.save(); ctx.globalAlpha = away ? 1 - Math.abs(fly - 0.5) * 0.6 : 1;
  const hx = c[0] + (away ? fly * 80 : 0), hy = c[1] - 8 - up;
  ellipse(c[0], c[1], 16 - up / 10, 6, 'rgba(0,0,0,.18)');
  ellipse(hx, hy, 13, 7, '#e53935'); ellipse(hx + 6, hy - 2, 5, 4, '#90caf9');
  line([hx - 10, hy], [hx - 24, hy - 3], '#e53935', 3); line([hx - 24, hy - 3], [hx - 24, hy - 9], '#333', 1.5);
  line([hx - 6, hy + 7], [hx + 8, hy + 7], '#333', 1.5);
  const r = (T * 25) % Math.PI; line([hx - Math.cos(r) * 22, hy - 9 - Math.sin(r) * 3], [hx + Math.cos(r) * 22, hy - 9 + Math.sin(r) * 3], '#333', 2);
  ctx.restore();
  if (!THUMB && S.express && S.express.length) bubbleAt(e, 50, { icon: '📦', count: S.express.length });
};
Object.assign(ART_FX, {
  crane(e) { const b = P(e.x + 2.5, e.y + 2.5, 0), top = P(e.x + 2.5, e.y + 2.5, 70); line(b, top, '#f2b632', 4); line(top, [top[0] - 50, top[1] + 6], '#f2b632', 3); line([top[0] - 44, top[1] + 5], [top[0] - 44, top[1] + 30 + Math.sin(T) * 4], '#555', 1); prism(e.x + 0.4, e.y + 1.8, 1.8, 0.7, 0, 6, '#c62828', '#b71c1c', '#8e1515'); return 74; },
  refinery(e) {
    for (const [u, v, r, h] of [[1.5, 0.5, 9, 40], [1.5, 1.4, 7, 30]]) { const [cx, cy] = P(e.x + u, e.y + v); cylinder(cx, cy, r, r / 2, 0, h, ['#eceff1', '#cfd8dc', '#90a4ae', '#e0e6e9']); }
    const [fx, fy] = P(e.x + 0.4, e.y + 0.4); line([fx, fy], [fx, fy - 64], '#78909c', 3);
    if (!THUMB) { const fl = 6 + Math.sin(T * 9) * 2; ellipse(fx, fy - 68, 3, fl, '#ff9800'); addGlow(fx, fy - 68, 22); }
    return 70;
  },
  skilift(e) {
    const a = P(e.x + 0.2, e.y + 0.2, 0), b = P(e.x + 1.9, e.y + 0.2, 0);
    line(a, [a[0], a[1] - 40], '#555', 2); line(b, [b[0], b[1] - 20], '#555', 2); line([a[0], a[1] - 40], [b[0], b[1] - 20], '#333', 1);
    const t = (T * 0.15) % 1, px = a[0] + (b[0] - a[0]) * t, py = a[1] - 40 + 20 * t + (b[1] - a[1]) * t;
    rr(px - 3, py, 6, 5, 1, '#e53935');
    return 60;
  },
  rink(e) {
    const x = e.x + 0.15, y = e.y + 0.15;
    prism(x, y, 1.7, 1.7, 0, 3, '#e3f2fd', '#b0bec5', '#90a4ae');
    poly([P(x + 0.1, y + 0.1, 3), P(x + 1.6, y + 0.1, 3), P(x + 1.6, y + 1.6, 3), P(x + 0.1, y + 1.6, 3)], '#d6f0ff', '#ffffff', 2);
    for (let k = 0; k < 4; k++) { const a = T * 0.8 + k * 1.6; const p = P(x + 0.85 + Math.cos(a) * 0.5, y + 0.85 + Math.sin(a) * 0.5, 3); rr(p[0] - 2, p[1] - 10, 4, 7, 2, ['#e53935', '#1e88e5', '#43a047', '#ffb300'][k]); circle(p[0], p[1] - 12, 2, '#f3d9a0'); }
    return 20;
  },
});
DRAW.snowman = (e) => {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(sx + 2, sy, 10, 4, 'rgba(0,0,0,.15)');
  circle(sx, sy - 7, 8, '#ffffff'); circle(sx, sy - 19, 6, '#fafafa'); circle(sx, sy - 28, 4.5, '#ffffff');
  poly([[sx, sy - 28], [sx + 7, sy - 27], [sx, sy - 26.5]], '#ff7043');
  rr(sx - 4, sy - 36, 8, 4, 1, '#222'); rr(sx - 6, sy - 33, 12, 1.6, 0.8, '#222');
  line([sx - 5, sy - 20], [sx - 13, sy - 26], '#6d4c41', 1.4); line([sx + 5, sy - 20], [sx + 13, sy - 25], '#6d4c41', 1.4);
  rr(sx - 6, sy - 24, 12, 2.5, 1, '#e53935');
};
DRAW.xmastree = (e) => {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(sx + 3, sy, 12, 5, 'rgba(0,0,0,.2)');
  rr(sx - 2, sy - 8, 4, 8, 1, '#6d4c41');
  for (let k = 0; k < 3; k++) poly([[sx - 16 + k * 3, sy - 6 - k * 14], [sx + 16 - k * 3, sy - 6 - k * 14], [sx, sy - 26 - k * 14]], ['#1b5e20', '#2e7d32', '#388e3c'][k]);
  for (let k = 0; k < 10; k++) { const on = ((T * 3 | 0) + k) % 3; const px = sx + Math.sin(k * 2.3) * (12 - k), py = sy - 10 - k * 4.5; circle(px, py, 1.6, ['#ffeb3b', '#e53935', '#42a5f5'][on]); addGlow(px, py, 8); }
  poly([[sx, sy - 66], [sx + 3, sy - 59], [sx - 3, sy - 59]], '#ffd23f');
};
for (const t in BUILD) if (BUILD[t].art && !DRAW[t]) DRAW[t] = drawArt;

const _drawTownHall = DRAW.townhall;
DRAW.townhall = (e) => {
  const l = lvlOf(e);
  if (l >= 2) for (const [u, v] of [[0.1, 1.3], [2.3, 0.05]]) { prism(e.x + u, e.y + v, 0.6, 0.6, 0, 30, null, '#f6f1e7', '#ddd5c6'); hipRoof(e.x + u, e.y + v, 0.6, 0.6, 30, 14, l >= 4 ? '#f2c94c' : '#4a7fc4', l >= 4 ? '#d4a82a' : '#3a66a3', l >= 4 ? '#f7d774' : '#5b8fd1', 0.04); }
  _drawTownHall(e);
  if (l >= 3) for (const u of [0.4, 2.6]) { const p = P(e.x + u, e.y + 2.9, 0); line(p, [p[0], p[1] - 34], '#888', 1.5); waveFlag(p[0], p[1] - 34, l >= 5 ? '#ffd23f' : '#1e88e5', 0.8); }
  if (l >= 5 && !THUMB && Math.random() < DT * 3) { const p = P(e.x + 1.5, e.y + 1.5, 110); spawn({ type: 'spark', x: p[0] + rand(-20, 20), y: p[1] + rand(-20, 10), vx: 0, vy: -10, life: 0.9, max: 0.9, r: 3 }); }
};

function siloFill() { if (THUMB) return 0.5; const s = storageStats(); return s.siloCap ? s.siloUsed / s.siloCap : 0; }
function domeTop(cx, cy, rx, h, col) { const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0); g.addColorStop(0, shade(col, 0.15)); g.addColorStop(1, shade(col, -0.3)); ctx.beginPath(); ctx.ellipse(cx, cy, rx, h, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); }
function gauge(cx, cy, h) { const f = siloFill(); rr(cx - 2.5, cy - h, 5, h - 6, 2, 'rgba(60,50,40,.35)'); if (f > 0.01) rr(cx - 1.7, cy - 7 - (h - 7.6) * f, 3.4, (h - 7.6) * f, 1.5, f > 0.95 ? '#ef6351' : '#f3c94c'); }
DRAW.megasilo = (e) => {
  groundShadow(e.x + 0.2, e.y + 0.2, 1.6, 1.6, 0.9);
  prism(e.x + 0.1, e.y + 0.1, 1.8, 1.8, 0, 4, '#c9c2b4', '#b3ab9b', '#9c9486');
  for (const [u, v] of [[0.6, 0.55], [1.45, 0.55], [1.0, 1.4]]) {
    const [cx, cy] = P(e.x + u, e.y + v);
    cylinder(cx, cy, 17, 8.5, 4, 72, ['#f2f5f7', '#d3dae0', '#9aa6b0', '#c3ccd4']);
    domeTop(cx, cy - 72, 17, 14, '#e2604a');
  }
  const p = P(e.x + 1.0, e.y + 1.4); gauge(p[0] + 8, p[1], 60);
  line(P(e.x + 0.6, e.y + 0.55, 80), P(e.x + 1.45, e.y + 0.55, 80), '#8a96a0', 3);
};
DRAW.elevator = (e) => {
  groundShadow(e.x + 0.2, e.y + 0.2, 1.6, 1.6, 1.4);
  prism(e.x + 0.1, e.y + 0.1, 1.8, 1.8, 0, 4, '#c9c2b4', '#b3ab9b', '#9c9486');
  prism(e.x + 0.2, e.y + 0.25, 0.55, 0.55, 4, 128, '#d7d2c8', '#cfc9bd', '#b7b0a3');
  hipRoof(e.x + 0.2, e.y + 0.25, 0.55, 0.55, 128, 12, '#8d6e63', '#6d4c41', '#a1887f', 0.05);
  for (const u of [0.95, 1.4]) for (const v of [0.6, 1.4]) { const [cx, cy] = P(e.x + u, e.y + v); cylinder(cx, cy, 11, 5.5, 4, 92, ['#ebe7df', '#d4cec3', '#a49d90', '#ddd8cf']); }
  line(P(e.x + 0.5, e.y + 0.55, 118), P(e.x + 1.4, e.y + 1.4, 96), '#8a7f70', 3);
  const p = P(e.x + 1.4, e.y + 1.4); gauge(p[0] + 6, p[1], 80);
  signBoard(P(e.x + 0.48, e.y + 0.8, 100), 'GRAIN', '#6d4c41', '#ffe39a');
};
DRAW.granary = (e) => {
  groundShadow(e.x + 0.2, e.y + 0.2, 2.6, 2.6, 1.2);
  poly(diamond(e.x + 0.05, e.y + 0.05, 2.9, 2.9), '#d9cfb8');
  const x = e.x + 1.2, y = e.y + 1.2, w = 1.6, h = 1.6;
  foundation(x, y, w, h); prism(x, y, w, h, 4, 40, null, '#c8432f', '#a3341f');
  faceL(x, y, w, h, 0.3, 0.7, 4, 30, '#fff4e6'); faceL(x, y, w, h, 0.33, 0.67, 4, 28, '#8e2a1c');
  gableRoofY(x, y, w, h, 40, 30, '#6d4c41', '#5d4037', '#c8432f', 0.1);
  for (const [u, v] of [[0.55, 0.55], [1.5, 0.45], [2.45, 0.5], [0.5, 1.6], [0.55, 2.5]]) {
    const [cx, cy] = P(e.x + u, e.y + v);
    cylinder(cx, cy, 15, 7.5, 0, 88, ['#f2f5f7', '#d3dae0', '#9aa6b0', '#c3ccd4']);
    domeTop(cx, cy - 88, 15, 12, '#c9a227');
  }
  const p = P(e.x + 2.45, e.y + 0.5); gauge(p[0] + 8, p[1], 76);
};
