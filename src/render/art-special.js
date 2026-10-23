Object.assign(ART_FX, {
  stacks(e, a) {
    const x = e.x, y = e.y;
    for (const [u, v, h] of [[1.55, 0.35, 70], [1.25, 0.25, 58]]) {
      const [cx, cy] = P(x + u, y + v);
      cylinder(cx, cy, 7, 3.5, 0, h, ['#c9cfd4', '#a8b0b6', '#7c868e', '#b6bec4']);
      ctx.fillStyle = '#e53935'; ctx.fillRect(cx - 7, cy - h + 6, 14, 4);
      if (!THUMB && (e.job || BUILD[e.t].power)) smokeAt([cx, cy - h - 2], 4, true);
    }
    return 76;
  },
  solar(e) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const x = e.x + 0.18 + i * 0.58, y = e.y + 0.18 + j * 0.58;
      line(P(x + 0.2, y + 0.4, 0), P(x + 0.2, y + 0.4, 6), '#7a8a9a', 1.5);
      poly([P(x, y, 10), P(x + 0.45, y, 10), P(x + 0.45, y + 0.4, 5), P(x, y + 0.4, 5)], '#2f4f8f', '#9fb8e0', 1);
      const sh = P(x + 0.1, y + 0.1, 9.5); ellipse(sh[0], sh[1], 3, 1, 'rgba(255,255,255,.35)');
    }
    return 14;
  },
  watertower(e) {
    const [cx, cy] = P(e.x + 0.5, e.y + 0.5);
    ellipse(cx + 6, cy + 2, 14, 5, 'rgba(0,0,0,.2)');
    for (const dx of [-9, 9]) line([cx + dx, cy], [cx + dx * 0.5, cy - 48], '#8a9aa8', 2.2);
    line([cx, cy + 4], [cx, cy - 48], '#8a9aa8', 2.2);
    line([cx - 7, cy - 24], [cx + 7, cy - 24], '#8a9aa8', 1.5);
    cylinder(cx, cy - 48, 16, 7, 0, 26, ['#e3f2fd', '#90caf9', '#5c8fbf', '#bbdefb']);
    ctx.beginPath(); ctx.ellipse(cx, cy - 74, 16, 9, 0, Math.PI, 0); ctx.fillStyle = '#5c8fbf'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 9px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('H₂O', cx, cy - 58);
    return 86;
  },
  quarry(e) {
    const x = e.x, y = e.y;
    poly(diamond(x + 0.1, y + 0.1, 1.8, 1.8), '#b9a17e');
    poly(diamond(x + 0.4, y + 0.4, 1.2, 1.2), '#9a8262');
    poly(diamond(x + 0.65, y + 0.65, 0.7, 0.7), '#7d684d');
    for (const [u, v] of [[0.3, 1.5], [1.5, 0.3], [1.6, 1.4]]) rockBlob(...P(x + u, y + v), 7, 7, (u * 10) | 0, '#a7adb2', '#868c92', '#d2d6d9');
    const c = P(x + 1.5, y + 1.6); rr(c[0] - 8, c[1] - 9, 16, 7, 2, '#f2b632'); circle(c[0] - 5, c[1] - 1, 2.5, '#333'); circle(c[0] + 5, c[1] - 1, 2.5, '#333');
    if (producerReady(e) && !THUMB) bubbleAt(e, 34, { icon: ITEMS[BUILD[e.t].produce.items[(e.pc || 0) % 3]].icon });
    else if (!THUMB) bubbleAt(e, 28, { type: 'bar', p: clamp((NOW - (e.pp || 0)) / BUILD[e.t].produce.time, 0, 1), color: '#c9a27a' });
    return 20;
  },
  glow(e) { if (e.job) { const p = P(e.x + 0.5, e.y + 1.7, 10); addGlow(p[0], p[1], 30); ellipse(p[0], p[1], 6, 3, '#ff9800'); } return 0; },
  greenhouse(e) {
    const x = e.x + 0.2, y = e.y + 0.2, w = 1.6, h = 1.6;
    groundShadow(x, y, w, h, 0.3);
    prism(x, y, w, h, 0, 4, '#e8e0d0', '#cfc6b4', '#b8af9d');
    poly([P(x, y + h, 4), P(x + w, y + h, 4), P(x + w, y + h, 22), P(x, y + h, 22)], 'rgba(190,235,255,.55)', '#ffffff', 1.2);
    poly([P(x + w, y, 4), P(x + w, y + h, 4), P(x + w, y + h, 22), P(x + w, y, 22)], 'rgba(160,215,240,.55)', '#ffffff', 1.2);
    for (let k = 0; k < 6; k++) { const p = P(x + 0.25 + (k % 3) * 0.55, y + 0.4 + Math.floor(k / 3) * 0.7, 4); circle(p[0], p[1] - 5, 4, ['#4f9d3c', '#e53935', '#f6e7a1'][k % 3]); }
    gableRoofX(x, y, w, h, 22, 14, 'rgba(210,240,255,.6)', 'rgba(180,225,245,.6)', 'rgba(170,215,240,.6)', 0.04);
    factoryBubble(e, 50);
    return 40;
  },
  mine(e) {
    const x = e.x, y = e.y;
    poly(diamond(x + 0.05, y + 0.05, 2.9, 2.9), '#a08a6a');
    rockBlob(...P(x + 1.2, y + 1.0), 46, 38, 7, '#8f8478', '#73695f', '#b3aa9f');
    const m = P(x + 1.4, y + 1.6, 4);
    ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.ellipse(m[0], m[1] - 10, 14, 13, 0, Math.PI, 0); ctx.lineTo(m[0] + 14, m[1]); ctx.lineTo(m[0] - 14, m[1]); ctx.fill();
    ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m[0] - 15, m[1]); ctx.lineTo(m[0] - 15, m[1] - 14); ctx.lineTo(m[0] + 15, m[1] - 14); ctx.lineTo(m[0] + 15, m[1]); ctx.stroke();
    for (const t of [0.3, 0.9, 1.5]) line(P(x + 1.4 + t * 0.3, y + 1.8 + t * 0.6), P(x + 1.5 + t * 0.3, y + 1.8 + t * 0.6), '#5d4037', 2);
    const cart = P(x + 2.0, y + 2.4, 2); rr(cart[0] - 8, cart[1] - 9, 16, 8, 2, '#6d4c41'); circle(cart[0] - 5, cart[1], 2.2, '#333'); circle(cart[0] + 5, cart[1], 2.2, '#333');
    for (let k = 0; k < 3; k++) circle(cart[0] - 4 + k * 4, cart[1] - 10, 2.5, ['#333', '#9aa0a6', '#f3c94c'][k]);
    const l = P(x + 1.4, y + 1.6, 26); addGlow(l[0], l[1], 20);
    return 60;
  },
  station(e) {
    const x = e.x, y = e.y;
    poly([P(x, y + 1.1), P(x + 4, y + 1.1), P(x + 4, y + 1.95), P(x, y + 1.95)], '#cfc8b8');
    for (const v of [1.35, 1.7]) line(P(x, y + v, 1), P(x + 4, y + v, 1), '#6d6d6d', 2);
    ctx.strokeStyle = '#7a5534'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = P(x + k * 0.25 + 0.1, y + 1.28, 0.5), b = P(x + k * 0.25 + 0.1, y + 1.78, 0.5); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
    for (const u of [0.5, 1.5, 2.5, 3.5]) line(P(x + u, y + 1.05, 0), P(x + u, y + 1.05, 24), '#5d4037', 2);
    poly([P(x, y + 0.9, 26), P(x + 4, y + 0.9, 26), P(x + 4, y + 1.3, 22), P(x, y + 1.3, 22)], '#8a3a2a');
    const c = P(x + 1.6, y + 0.9, 40); circle(c[0], c[1], 6, '#fffdf5'); line(c, [c[0], c[1] - 4], '#333', 1); line(c, [c[0] + 3, c[1]], '#333', 1);
    return 50;
  },
  port(e) {
    const x = e.x, y = e.y;
    for (let k = 0; k < 6; k++) { const u = 2.2 + (k % 3) * 0.55, v = 0.3 + Math.floor(k / 3) * 0.5; prism(x + u, y + v, 0.5, 0.4, 0, 12 + (k % 2) * 10, null, ['#e53935', '#1e88e5', '#43a047', '#ff9800', '#8e24aa', '#00897b'][k], shade(['#e53935', '#1e88e5', '#43a047', '#ff9800', '#8e24aa', '#00897b'][k], -0.25)); }
    const b = P(x + 3.3, y + 2.3, 0), top = P(x + 3.3, y + 2.3, 60);
    line(b, top, '#f2b632', 4); line(top, [top[0] - 34, top[1] + 4], '#f2b632', 3); line([top[0] - 30, top[1] + 4], [top[0] - 30, top[1] + 30], '#555', 1);
    rr(top[0] - 34, top[1] + 28, 8, 6, 1, '#1e88e5');
    for (let k = 0; k < 4; k++) { const p = P(x + 0.4 + k * 0.9, y + 2.8, 0); rr(p[0] - 1.5, p[1] - 6, 3, 8, 1, '#5d4037'); }
    return 64;
  },
  lighthouse(e) {
    const [cx, cy] = P(e.x + 0.5, e.y + 0.5);
    ellipse(cx + 6, cy + 2, 16, 6, 'rgba(0,0,0,.2)');
    poly([[cx - 10, cy], [cx + 10, cy], [cx + 6, cy - 80], [cx - 6, cy - 80]], '#fafafa');
    for (let k = 0; k < 4; k++) { const z0 = 10 + k * 18; poly([[cx - 10 + z0 * 0.05, cy - z0], [cx + 10 - z0 * 0.05, cy - z0], [cx + 10 - (z0 + 8) * 0.05, cy - z0 - 8], [cx - 10 + (z0 + 8) * 0.05, cy - z0 - 8]], '#e53935'); }
    rr(cx - 8, cy - 92, 16, 12, 2, '#ffe9a8'); hipRoof(e.x + 0.3, e.y + 0.3, 0.4, 0.4, 92, 12, '#c62828', '#a52323', '#e53935', 0.05);
    addGlow(cx, cy - 86, 40);
    if (nightAmt > 0.08 && !THUMB) {
      const a = T * 1.2, len = 160;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,180,${0.18 * nightAmt / 0.42})`;
      ctx.beginPath(); ctx.moveTo(cx, cy - 86); ctx.lineTo(cx + Math.cos(a) * len, cy - 86 + Math.sin(a) * len * 0.4 - 10); ctx.lineTo(cx + Math.cos(a) * len, cy - 86 + Math.sin(a) * len * 0.4 + 10); ctx.fill(); ctx.restore();
    }
    return 110;
  },
  airport(e) {
    const x = e.x, y = e.y;
    poly([P(x + 0.05, y + 1.9), P(x + 5.95, y + 1.9), P(x + 5.95, y + 2.9), P(x + 0.05, y + 2.9)], '#555b62');
    ctx.setLineDash([8, 8]); line(P(x + 0.2, y + 2.4), P(x + 5.8, y + 2.4), '#ffffff', 2); ctx.setLineDash([]);
    for (let k = 0; k < 10; k++) { const p = P(x + 0.3 + k * 0.6, y + 1.95); circle(p[0], p[1], 1.4, nightAmt > 0.1 ? '#ffeb3b' : '#bbb'); if (nightAmt > 0.1) addGlow(p[0], p[1], 8); }
    poly([P(x + 0.05, y + 0.05), P(x + 5.95, y + 0.05), P(x + 5.95, y + 1.85), P(x + 0.05, y + 1.85)], '#d9d4c8');
    const tx = x + 0.3, ty = y + 0.2;
    foundation(tx, ty, 2.6, 0.9); prism(tx, ty, 2.6, 0.9, 4, 26, null, '#e8eef2', '#c8d2da');
    win('L', tx, ty, 2.6, 0.9, 0.04, 0.96, 9, 22); win('R', tx, ty, 2.6, 0.9, 0.1, 0.9, 9, 22);
    prism(tx - 0.03, ty - 0.03, 2.66, 0.96, 26, 29, '#9aa7b2', '#b6c1ca', '#9aa7b2');
    prism(x + 3.4, y + 0.2, 1.8, 1.2, 0, 24, '#8e9aa5', '#b0bcc6', '#97a3ad');
    const [hx, hy] = P(x + 3.4 + 0.9, y + 1.4, 12); ctx.fillStyle = '#3b444c'; ctx.beginPath(); ctx.ellipse(hx, hy, 18, 12, 0, Math.PI, 0); ctx.fill();
    signBoard(P(tx + 1.3, ty + 0.9, 34), '✈ MEADOWVALE INTL', '#1565c0', '#ffffff', '700 8px Fredoka, sans-serif');
    return 40;
  },
  tower2(e) {
    const p = P(e.x + 0.5, e.y + 0.5, 86);
    poly([[p[0] - 14, p[1]], [p[0] + 14, p[1]], [p[0] + 18, p[1] - 12], [p[0] - 18, p[1] - 12]], '#4fc3f7', '#e8ecef', 2);
    rr(p[0] - 16, p[1] - 16, 32, 4, 2, '#37474f');
    const on = Math.sin(T * 4) > 0; circle(p[0], p[1] - 22, 2.5, on ? '#ff3b30' : '#7a2020'); if (on) addGlow(p[0], p[1] - 22, 16);
    return 110;
  },
  opera(e) {
    const c = P(e.x + 1.5, e.y + 1.4, 36);
    for (let k = 0; k < 3; k++) { const ox = (k - 1) * 22, s = 1 - Math.abs(k - 1) * 0.2; ctx.beginPath(); ctx.moveTo(c[0] + ox - 18 * s, c[1]); ctx.quadraticCurveTo(c[0] + ox, c[1] - 60 * s, c[0] + ox + 18 * s, c[1]); ctx.closePath(); ctx.fillStyle = ['#f5f1e6', '#ffffff', '#ece6d6'][k]; ctx.fill(); ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5; ctx.stroke(); }
    return 100;
  },
  rocket(e) {
    const [cx, cy] = P(e.x + 2.3, e.y + 0.8);
    line([cx - 22, cy], [cx - 18, cy - 110], '#9aa3ab', 3); for (let k = 0; k < 6; k++) line([cx - 22 + k * 0.6, cy - k * 18], [cx - 6, cy - k * 18 - 6], '#9aa3ab', 1.5);
    poly([[cx - 8, cy - 10], [cx + 8, cy - 10], [cx + 8, cy - 100], [cx - 8, cy - 100]], '#f5f7fa');
    poly([[cx - 8, cy - 100], [cx + 8, cy - 100], [cx, cy - 124]], '#e53935');
    poly([[cx - 8, cy - 10], [cx - 16, cy], [cx - 8, cy - 30]], '#e53935'); poly([[cx + 8, cy - 10], [cx + 16, cy], [cx + 8, cy - 30]], '#e53935');
    circle(cx, cy - 70, 4, '#4fc3f7');
    ctx.fillStyle = '#1565c0'; ctx.font = '700 7px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('MV-1', cx, cy - 45);
    return 160;
  },
});

const _origDrawBlock = drawBlock;
drawBlock = function (e, bl, pal, a, i) {
  if (bl.roof !== 'saw') return _origDrawBlock(e, bl, pal, a, i);
  _origDrawBlock(e, Object.assign({}, bl, { roof: 'none' }), pal, a, i);
  const x = e.x + bl.x, y = e.y + bl.y, w = bl.w, h = bl.h, z = bl.z, rc = bl.rc || '#7f8890';
  prism(x, y, w, h, z, z + 2, rc, shade(rc, -0.15), shade(rc, -0.3));
  for (let k = 0; k < 3; k++) {
    const x0 = x + (w * k) / 3, x1 = x + (w * (k + 1)) / 3;
    poly([P(x0, y, z + 2), P(x0, y + h, z + 2), P(x0, y + h, z + 14), P(x0, y, z + 14)], '#bfe3f2');
    poly([P(x0, y, z + 14), P(x0, y + h, z + 14), P(x1, y + h, z + 2), P(x1, y, z + 2)], shade(rc, 0.05));
  }
};

function drawFence(e) {
  const x = e.x, y = e.y;
  const n = (dx, dy) => { const o = entAt(x + dx, y + dy); return o && o.t === 'fence'; };
  const segs = [];
  if (n(1, 0) || n(-1, 0) || (!n(0, 1) && !n(0, -1))) segs.push([P(x, y + 0.5), P(x + 1, y + 0.5), 'x']);
  if (n(0, 1) || n(0, -1)) segs.push([P(x + 0.5, y), P(x + 0.5, y + 1), 'y']);
  for (const [a, b] of segs) {
    for (let k = 0; k <= 4; k++) { const t = k / 4, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t; rr(px - 1.2, py - 11, 2.4, 11, 1, '#ffffff', '#d0d0d0', 0.6); }
    for (const z of [4, 8]) line([a[0], a[1] - z], [b[0], b[1] - z], '#f4f4f4', 1.6);
  }
}
function drawRail(e) {
  const x = e.x, y = e.y;
  const nT = isRail(x, y - 1), nB = isRail(x, y + 1), nL = isRail(x - 1, y), nR = isRail(x + 1, y);
  poly(diamond(x, y), '#bfae95');
  const alongY = (nT || nB) && !(nL || nR);
  ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let k = 0; k < 4; k++) { const t = 0.125 + k * 0.25; const a = alongY ? P(x + 0.18, y + t) : P(x + t, y + 0.18), b = alongY ? P(x + 0.82, y + t) : P(x + t, y + 0.82); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  for (const v of [0.33, 0.67]) { const a = alongY ? P(x + v, y, 1) : P(x, y + v, 1), b = alongY ? P(x + v, y + 1, 1) : P(x + 1, y + v, 1); line(a, b, '#8d9aa5', 2); }
}
function roadVariant(top, mid) {
  return (e) => {
    const x = e.x, y = e.y;
    poly(diamond(x, y), top);
    ctx.strokeStyle = mid; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const a = P(x + k / 4, y), b = P(x + k / 4, y + 1), c = P(x, y + k / 4), d = P(x + 1, y + k / 4); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
    ctx.stroke();
  };
}
Object.assign(FLAT, { rail: drawRail, stoneroad: roadVariant('#a9a49a', 'rgba(70,65,60,.35)'), brickroad: roadVariant('#c0664c', 'rgba(110,40,25,.35)') });
function drawPier(e) {
  const x = e.x, y = e.y;
  for (const [u, v] of [[0.15, 0.2], [0.85, 0.2], [0.15, 1.8], [0.85, 1.8]]) { const p = P(x + u, y + v); rr(p[0] - 1.5, p[1] - 4, 3, 10, 1, '#5a3d26'); }
  prism(x + 0.1, y + 0.05, 0.8, 1.9, 0, 5, '#c49a63', '#8a5a34', '#7a4f2c');
  const [fx, fy] = P(x + 0.55, y + 1.5, 5);
  ctx.fillStyle = '#1e88e5'; rr(fx - 3, fy - 12, 6, 8, 2, '#1e88e5'); circle(fx, fy - 15, 3, '#f3d9a0'); drawHat('straw', fx, fy - 17);
  const sw = Math.sin(T * 1.5) * 3; line([fx + 2, fy - 10], [fx + 22, fy - 26 + sw], '#5d4037', 1.2); line([fx + 22, fy - 26 + sw], [fx + 24, fy + 8], 'rgba(255,255,255,.6)', 0.6);
  if (!THUMB) { if (producerReady(e)) bubbleAt(e, 30, { icon: '🐟' }); else bubbleAt(e, 24, { type: 'bar', p: clamp((NOW - (e.pp || 0)) / BUILD[e.t].produce.time, 0, 1), color: '#4fc3f7' }); }
}
function drawLantern(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  line([sx, sy], [sx, sy - 34], '#5d4037', 2.5); line([sx, sy - 34], [sx + 10, sy - 34], '#5d4037', 2);
  const sw = Math.sin(T * 2 + e.id) * 1.5;
  ellipse(sx + 10 + sw, sy - 26, 6, 8, '#e53935'); rr(sx + 6 + sw, sy - 35, 8, 3, 1, '#c9a227'); addGlow(sx + 10, sy - 26, 30);
}
function drawPumpkin(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(sx + 3, sy, 14, 5, 'rgba(0,0,0,.2)');
  for (const dx of [-8, 8, 0]) ellipse(sx + dx * 0.7, sy - 14, 9, 13, dx ? '#e67e22' : '#f39c12');
  rr(sx - 2, sy - 32, 4, 6, 1, '#4e7a2a');
  poly([[sx - 6, sy - 18], [sx - 2, sy - 18], [sx - 4, sy - 22]], '#3a2000'); poly([[sx + 2, sy - 18], [sx + 6, sy - 18], [sx + 4, sy - 22]], '#3a2000');
  if (nightAmt > 0.1) addGlow(sx, sy - 14, 24);
}
function drawCarrotStatue(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  prism(e.x + 0.2, e.y + 0.2, 0.6, 0.6, 0, 12, '#e1dccf', '#c9c3b5', '#b0aa9c');
  poly([[sx - 7, sy - 16], [sx + 7, sy - 16], [sx, sy - 50]], '#f6c445'); poly([[sx, sy - 16], [sx + 7, sy - 16], [sx, sy - 50]], '#d9a92e');
  for (const dx of [-4, 0, 4]) line([sx, sy - 16], [sx + dx, sy - 8], '#c9a227', 2);
  addGlow(sx, sy - 30, 26);
  if (!THUMB && Math.random() < DT * 2) spawn({ type: 'spark', x: sx + rand(-10, 10), y: sy - rand(20, 50), vx: 0, vy: -8, life: 0.8, max: 0.8, r: 2.5 });
}
Object.assign(DRAW, {
  fence: drawFence, fishingpier: drawPier, lantern: drawLantern, pumpkinstatue: drawPumpkin, goldencarrot: drawCarrotStatue,
  cherrytree: (e) => { TREE_PAL[5] = ['#f48fb1', '#f8bbd0', '#fce4ec']; drawTree(e.x + 0.5, e.y + 0.5, 5, 40, e.id || 0, 1.1); },
  goldfountain: (e) => { drawFountain(e); const p = P(e.x + 1, e.y + 1, 34); circle(p[0], p[1] - 8, 6, '#ffd23f'); addGlow(p[0], p[1] - 8, 30); },
});
for (const t in BUILD) if (BUILD[t].art && !DRAW[t]) DRAW[t] = drawArt;

function drawConstruction(e) {
  const x = e.x + 0.12, y = e.y + 0.12, w = e.w - 0.24, h = e.h - 0.24;
  const g = e.build.prog, H = Math.max(14, Math.min(70, (BUILD[e.t].ht || 40) * 0.7)) * Math.max(0.25, g);
  poly(diamond(e.x + 0.04, e.y + 0.04, e.w - 0.08, e.h - 0.08), '#c9b38c');
  prism(x + 0.1, y + 0.1, w - 0.2, h - 0.2, 0, H, '#d8cbb3', '#c8b89a', '#b3a283');
  ctx.strokeStyle = '#e0a020'; ctx.lineWidth = 1.5;
  for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) line(P(x + u * w, y + v * h, 0), P(x + u * w, y + v * h, H + 10), '#e0a020', 1.6);
  for (let z = 8; z < H + 10; z += 10) { line(P(x, y + h, z), P(x + w, y + h, z), '#e0a020', 1.2); line(P(x + w, y, z), P(x + w, y + h, z), '#e0a020', 1.2); }
  const top = P(x + w * 0.8, y + h * 0.3, H + 10), arm = P(x + w * 0.8, y + h * 0.3, H + 46);
  line(top, arm, '#f2b632', 3); line(arm, [arm[0] - 40, arm[1] + 6], '#f2b632', 2.5);
  const sw = Math.sin(T * 1.2) * 4; line([arm[0] - 34 + sw, arm[1] + 5], [arm[0] - 34 + sw, arm[1] + 24], '#555', 1); rr(arm[0] - 38 + sw, arm[1] + 24, 8, 5, 1, '#b5543c');
  if (!THUMB) {
    if (Math.random() < DT * 2) { const p = P(x + rand(0, w), y + rand(0, h), H); spawn({ type: 'dot', x: p[0], y: p[1], vx: rand(-15, 15), vy: rand(-30, -10), g: 80, life: 0.6, max: 0.6, r: 1.5, c: '#d8cbb3' }); }
    const done = g >= 1 && !matsComplete(e);
    bubbleAt(e, H + 26, done ? { icon: '🧱' } : { type: 'bar', p: g, color: '#f2b632' });
  }
}

const wxDrops = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random()]);
function drawWeatherFX() {
  const t = S.wx && S.wx.type, s = seasonIdx();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (s === 3) { ctx.fillStyle = 'rgba(235,245,255,0.14)'; ctx.fillRect(0, 0, VW, VH); }
  else if (s === 2) { ctx.fillStyle = 'rgba(255,150,40,0.05)'; ctx.fillRect(0, 0, VW, VH); }
  if (t === 'heat') { ctx.fillStyle = 'rgba(255,170,60,0.08)'; ctx.fillRect(0, 0, VW, VH); }
  if (t === 'rain' || t === 'storm' || t === 'snow') {
    const snow = t === 'snow';
    ctx.strokeStyle = snow ? 'rgba(255,255,255,.85)' : 'rgba(200,220,255,.45)'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const d of wxDrops) {
      const sp = snow ? 0.08 : t === 'storm' ? 0.9 : 0.6;
      const yy = ((d[1] + T * sp * (0.6 + d[2])) % 1) * VH, xx = ((d[0] + (snow ? Math.sin(T + d[2] * 6) * 0.01 : T * 0.05)) % 1) * VW;
      if (snow) { ctx.moveTo(xx + 2, yy); ctx.arc(xx, yy, 1.6 + d[2], 0, Math.PI * 2); }
      else { ctx.moveTo(xx, yy); ctx.lineTo(xx - 4, yy + 14); }
    }
    snow ? ctx.fill() : ctx.stroke();
    if (t === 'storm') { ctx.fillStyle = 'rgba(20,30,50,.18)'; ctx.fillRect(0, 0, VW, VH);
      if (!S.lightOff) {
        if (!drawWeatherFX.next || drawWeatherFX.next - T > 60) drawWeatherFX.next = T + 14 + Math.random() * 22;
        if (T >= drawWeatherFX.next) { drawWeatherFX.flash = 1; drawWeatherFX.next = T + 14 + Math.random() * 22; }
        const f = drawWeatherFX.flash || 0;
        if (f > 0.01) { ctx.fillStyle = `rgba(225,232,255,${(0.13 * f).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); drawWeatherFX.flash = f * Math.exp(-DT * 9); }
      }
    }
  }
  setWorldTransform();
}
