function cylinder(cx, cy, rx, ry, z0, z1, cols) {
  const yb = cy - z0, yt = cy - z1;
  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, cols[0]); g.addColorStop(0.45, cols[1]); g.addColorStop(1, cols[2]);
  ctx.beginPath();
  ctx.moveTo(cx - rx, yt); ctx.lineTo(cx - rx, yb);
  ctx.ellipse(cx, yb, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx, yt);
  ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ellipse(cx, yt, rx, ry, cols[3] || cols[1]);
}
function drawSilo(e) {
  const [cx, cy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(cx + 10, cy + 2, 24, 9, 'rgba(25,45,15,.22)');
  prism(e.x + 0.12, e.y + 0.12, 0.76, 0.76, 0, 3, '#c9c2b4', '#b3ab9b', '#9c9486');
  const rx = 19, ry = 9.5, H = 58;
  cylinder(cx, cy, rx, ry, 3, H, ['#f2f5f7', '#d3dae0', '#9aa6b0', '#c3ccd4']);
  ctx.strokeStyle = 'rgba(80,90,100,.22)'; ctx.lineWidth = 1;
  for (let z = 12; z < H; z += 11) { ctx.beginPath(); ctx.ellipse(cx, cy - z, rx, ry, 0, 0, Math.PI); ctx.stroke(); }

  const st = THUMB ? { siloUsed: 40, siloCap: 80 } : storageStats();
  const share = st.siloCap ? st.siloUsed / st.siloCap : 0;
  rr(cx + 6, cy - H + 6, 5, H - 14, 2, 'rgba(60,50,40,.35)');
  if (share > 0.01) rr(cx + 6.8, cy - 8 - (H - 15.6) * share, 3.4, (H - 15.6) * share, 1.5, share > 0.95 ? '#ef6351' : '#f3c94c');

  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0); g.addColorStop(0, '#e2604a'); g.addColorStop(1, '#a53a2a');
  ctx.beginPath(); ctx.ellipse(cx, cy - H, rx, 17, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  circle(cx, cy - H - 17, 2.5, '#8e2f22');

  ctx.strokeStyle = '#6b7680'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 9, cy - 2); ctx.lineTo(cx - 9, cy - H + 4); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx - 5, cy - H + 6);
  for (let z = 6; z < H - 4; z += 5) { ctx.moveTo(cx - 9, cy - z); ctx.lineTo(cx - 5, cy - z + 0.8); }
  ctx.stroke();
}
function drawFeedMill(e) {
  const x = e.x + 0.22, y = e.y + 0.3, w = 1.2, h = 1.4, wh = 26;
  groundShadow(x, y, w + 0.4, h, 0.5);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#e3cf9f', '#c9b27f');
  for (let k = 1; k < 6; k++) faceL(x, y, w, h, k / 6 - 0.01, k / 6 + 0.01, 4, wh, 'rgba(120,90,40,.18)');
  faceL(x, y, w, h, 0.35, 0.7, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.38, 0.67, 4, 19, '#7a5534');
  win('R', x, y, w, h, 0.3, 0.6, 12, 21);
  gableRoofX(x, y, w, h, wh, 14, '#9aa3ab', '#878f97', '#c9b27f');

  const tx = x + w + 0.02, ty = y + 0.1, tw = 0.36;
  prism(tx, ty, tw, tw, 0, 64, '#c8bfb2', '#b7ae9f', '#9e9586');
  for (let z = 10; z < 64; z += 12) faceL(tx, ty, tw, tw, 0, 1, z, z + 1.5, 'rgba(0,0,0,.12)');
  hipRoof(tx, ty, tw, tw, 64, 8, '#8f989f', '#7c858c', '#a3abb2', 0.04);
  line(P(tx, ty + tw * 0.5, 56), P(x + w * 0.6, y + h * 0.5, wh + 10), '#8a7f70', 3);

  for (const [u, v] of [[0.05, 1.5], [0.22, 1.56], [0.13, 1.45]]) { const p = P(e.x + u + 0.1, e.y + v, 0); rr(p[0] - 4, p[1] - 7, 8, 8, 3, '#e8dcc0', '#c9b88f', 1); }
  if (e.job) {
    smokeAt(P(tx + tw / 2, ty + tw / 2, 74), 2.5);
    if (!THUMB && Math.random() < DT * 3) { const p = P(x + w * 0.5, y + h, 6); spawn({ type: 'dot', x: p[0] + rand(-8, 8), y: p[1], vx: rand(-10, 10), vy: rand(-20, -8), g: 30, life: 0.8, max: 0.8, r: 1.3, c: '#f3e2a8' }); }
  }
  factoryBubble(e, 80);
}
function drawDairy(e) {
  const x = e.x + 0.3, y = e.y + 0.28, w = 1.4, h = 1.44, wh = 26;
  groundShadow(x, y, w, h, 0.55);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#fbfbf7', '#e2e2da');
  faceL(x, y, w, h, 0, 1, 4, 8, '#5b9bd5'); faceR(x, y, w, h, 0, 1, 4, 8, '#4a86bd');
  win('L', x, y, w, h, 0.08, 0.36, 11, 21);
  faceL(x, y, w, h, 0.5, 0.7, 4, 19, '#ffffff'); faceL(x, y, w, h, 0.52, 0.68, 4, 18, '#3e6f9e');
  win('R', x, y, w, h, 0.2, 0.45, 11, 21); win('R', x, y, w, h, 0.6, 0.85, 11, 21);
  gableRoofX(x, y, w, h, wh, 18, '#5b9bd5', '#4a86bd', '#e2e2da');

  const [tcx, tcy] = P(e.x + 0.22, e.y + 1.2);
  cylinder(tcx, tcy, 8, 4, 0, 34, ['#eef2f4', '#c6cfd6', '#8d9aa5', '#d7dee3']);

  const sp = P(x + w * 0.5, y + h * 0.5, wh + 22);
  line(P(x + w * 0.5, y + h * 0.5, wh + 12), [sp[0], sp[1] + 8], '#777', 2);
  circle(sp[0], sp[1], 11, '#ffffff'); ctx.strokeStyle = '#5b9bd5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sp[0], sp[1], 11, 0, Math.PI * 2); ctx.stroke();
  emojiAt([sp[0], sp[1] + 1], '🧀', 12);
  if (e.job) smokeAt(P(x + 0.3, y + 0.3, wh + 18), 1.5);
  factoryBubble(e, 72);
}
function drawTextile(e) {
  const x = e.x + 0.22, y = e.y + 0.28, w = 1.56, h = 1.44, wh = 28;
  groundShadow(x, y, w, h, 0.6);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#c0644a', '#a0503a');
  for (let z = 8; z < wh; z += 4) { faceL(x, y, w, h, 0, 1, z, z + 0.6, 'rgba(255,255,255,.12)'); faceR(x, y, w, h, 0, 1, z, z + 0.6, 'rgba(255,255,255,.1)'); }
  for (const u of [0.06, 0.28, 0.72]) win('L', x, y, w, h, u, u + 0.16, 10, 22);
  faceL(x, y, w, h, 0.48, 0.64, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.5, 0.62, 4, 19, '#4a2e22');
  win('R', x, y, w, h, 0.15, 0.4, 10, 22); win('R', x, y, w, h, 0.58, 0.83, 10, 22);

  prism(x, y, w, h, wh, wh + 2, '#7f8890', '#6f777e', '#5f676e');
  const n = 3;
  for (let k = 0; k < n; k++) {
    const x0 = x + (w * k) / n, x1 = x + (w * (k + 1)) / n;
    poly([P(x0, y, wh + 2), P(x0, y + h, wh + 2), P(x0, y + h, wh + 16), P(x0, y, wh + 16)], '#bfe3f2');
    poly([P(x0, y, wh + 16), P(x0, y + h, wh + 16), P(x1, y + h, wh + 2), P(x1, y, wh + 2)], '#8d969e');
    poly([P(x1, y, wh + 2), P(x1, y + h, wh + 2), P(x0, y + h, wh + 16)], 'rgba(0,0,0,0)');
  }
  const chx = x + w - 0.2, chy = y + 0.1;
  prism(chx, chy, 0.18, 0.18, wh, wh + 40, '#9a4632', '#7f3a28', '#6a2f20');
  if (e.job) smokeAt(P(chx + 0.09, chy + 0.09, wh + 42), 3, true);
  const sp = P(x + w * 0.2, y + h + 0.02, 24);
  circle(sp[0], sp[1], 8, '#fff4e6'); emojiAt([sp[0], sp[1] + 0.5], '🧵', 10);
  factoryBubble(e, 80);
}
function drawCourier(e) {
  const x = e.x + 0.3, y = e.y + 0.25, w = 1.4, h = 1.2, wh = 28;
  groundShadow(x, y, w, h, 0.5);
  poly([P(e.x + 0.1, e.y + 1.5), P(e.x + 1.9, e.y + 1.5), P(e.x + 1.9, e.y + 1.95), P(e.x + 0.1, e.y + 1.95)], '#cfc8b8');
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#f4efe2', '#dcd5c4');
  faceL(x, y, w, h, 0, 1, 4, 8, '#d64545'); faceR(x, y, w, h, 0, 1, 4, 8, '#b83636');
  win('L', x, y, w, h, 0.06, 0.32, 11, 22); win('L', x, y, w, h, 0.7, 0.94, 11, 22);
  faceL(x, y, w, h, 0.42, 0.6, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.44, 0.58, 4, 19, '#2e5e9e');
  win('R', x, y, w, h, 0.25, 0.75, 12, 22);
  gableRoofX(x, y, w, h, wh, 16, '#d64545', '#b83636', '#dcd5c4');
  const sp = P(x + w * 0.5, y + h, wh + 4);
  signBoard([sp[0], sp[1] - 2], 'COURIER', '#2e5e9e', '#ffe39a');

  const mb = P(e.x + 0.2, e.y + 1.7);
  rr(mb[0] - 1, mb[1] - 10, 2, 10, 1, '#555'); rr(mb[0] - 4, mb[1] - 16, 8, 7, 3, '#2e5e9e');

  const out = !THUMB && walkers.some((w2) => w2.kind === 'van' && !w2.fading);
  if (!out) drawVan({ x: e.x + 0.85, y: e.y + 1.25, dx: 1, dy: 0, color: '#e74c3c' });
  if (!THUMB && S.courier) { const n = S.courier.filter((s) => s.o && canFulfill(s.o)).length; if (n) bubbleAt(e, 64, { icon: '📦', count: n }); }
}
function drawJobs(e) {
  const x = e.x + 0.3, y = e.y + 0.3, w = 1.4, h = 1.4, wh = 42;
  groundShadow(x, y, w, h, 0.8);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#e9e2f2', '#cfc6dc');
  for (const z of [9, 26]) {
    for (const u of [0.06, 0.3, 0.7]) win('L', x, y, w, h, u, u + 0.18, z, z + 11);
    for (const u of [0.1, 0.4, 0.7]) win('R', x, y, w, h, u, u + 0.2, z, z + 11);
  }
  faceL(x, y, w, h, 0.5, 0.68, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.52, 0.66, 4, 19, '#6b4fa0');
  poly([P(x + w * 0.46, y + h, 23), P(x + w * 0.72, y + h, 23), P(x + w * 0.72, y + h + 0.18, 19), P(x + w * 0.46, y + h + 0.18, 19)], '#7b5fb5');
  prism(x - 0.04, y - 0.04, w + 0.08, h + 0.08, wh, wh + 4, '#cfc6dc', '#b5a9c7', '#9f92b3');
  const sp = P(x + w * 0.5, y + h * 0.5, wh + 18);
  line(P(x + w * 0.5, y + h * 0.5, wh + 4), [sp[0], sp[1] + 8], '#666', 2);
  signBoard(sp, '💼 JOBS', '#6b4fa0', '#ffffff', '700 10px Fredoka, sans-serif');
  if (!THUMB && S.openings && Object.values(S.openings).some((n) => n > 0)) bubbleAt(e, 82, { icon: '📋', count: Object.values(S.openings).reduce((a, n) => a + n, 0) });
}
Object.assign(DRAW, { silo: drawSilo, feedmill: drawFeedMill, dairy: drawDairy, textile: drawTextile, courier: drawCourier, jobs: drawJobs });
