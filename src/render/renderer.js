let canvas, ctx, dpr = 1, VW = 0, VH = 0;
const cam = { x: 0, y: 0, z: 1, tx: null, ty: null, tz: null };
let T = 0, NOW = Date.now(), DT = 0.016, nightAmt = 0, THUMB = false;
const glows = [], bubbles = [], parts = [], clouds = [];
let hoverTile = null;

const BG = '#25618a';
const WATER_DEEP = [], WATER_SHALLOW = [];
for (let i = 0; i < 8; i++) {
  const k = i / 7;
  WATER_DEEP.push(rgb(mix([52, 148, 202], [74, 170, 218], k)));
  WATER_SHALLOW.push(rgb(mix([98, 196, 218], [134, 218, 230], k)));
}
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function initCanvas() {
  canvas = document.getElementById('view');
  ctx = canvas.getContext('2d', { alpha: false });

  canvas.addEventListener('contextlost', () => { if (typeof resetGroundCaches === 'function') resetGroundCaches(); natSprites.clear(); });
  canvas.addEventListener('contextrestored', () => { if (typeof resetGroundCaches === 'function') resetGroundCaches(); natSprites.clear(); });
  resize();
  window.addEventListener('resize', resize);
}
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth; VH = window.innerHeight;
  canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
}
function setWorldTransform() {
  ctx.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, (VW / 2 - cam.x * cam.z) * dpr, (VH / 2 - cam.y * cam.z) * dpr);
}

function P(x, y, z) { return [(x - y) * HW, (x + y) * HH - (z || 0)]; }
function worldToScreen(wx, wy) { return [(wx - cam.x) * cam.z + VW / 2, (wy - cam.y) * cam.z + VH / 2]; }
function screenToWorld(sx, sy) { return [(sx - VW / 2) / cam.z + cam.x, (sy - VH / 2) / cam.z + cam.y]; }
function worldToTileF(wx, wy) { const a = wx / HW, b = wy / HH; return [(a + b) / 2, (b - a) / 2]; }
function screenToTile(sx, sy) { const w = screenToWorld(sx, sy); const t = worldToTileF(w[0], w[1]); return [Math.floor(t[0]), Math.floor(t[1])]; }

function poly(pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function ellipse(x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function line(a, b, color, lw) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = color; ctx.lineWidth = lw || 1; ctx.stroke(); }
function rr(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function diamond(x, y, w, h) { w = w || 1; h = h || 1; return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)]; }
function spawn(p) { if (!THUMB) parts.push(p); }
function addBubble(b) { if (!THUMB) bubbles.push(b); }

function addGlow(x, y, r, soft) { if (!THUMB && nightAmt > 0.04) glows.push([x, y, r, soft ? 1 : 0]); }

function prism(x, y, w, h, z0, z1, top, left, right) {
  const d0 = P(x, y + h, z0), c0 = P(x + w, y + h, z0), b0 = P(x + w, y, z0);
  const a1 = P(x, y, z1), b1 = P(x + w, y, z1), c1 = P(x + w, y + h, z1), d1 = P(x, y + h, z1);
  if (left) poly([d0, c0, c1, d1], left);
  if (right) poly([c0, b0, b1, c1], right);
  if (top) poly([a1, b1, c1, d1], top);
}
function faceL(x, y, w, h, u1, u2, z1, z2, c) { poly([P(x + u1 * w, y + h, z1), P(x + u2 * w, y + h, z1), P(x + u2 * w, y + h, z2), P(x + u1 * w, y + h, z2)], c); }
function faceR(x, y, w, h, u1, u2, z1, z2, c) { poly([P(x + w, y + u1 * h, z1), P(x + w, y + u2 * h, z1), P(x + w, y + u2 * h, z2), P(x + w, y + u1 * h, z2)], c); }
function win(side, x, y, w, h, u1, u2, z1, z2, frame) {
  const f = side === 'L' ? faceL : faceR;
  f(x, y, w, h, u1, u2, z1, z2, frame || '#ffffff');
  const du = (u2 - u1) * 0.15, dz = (z2 - z1) * 0.15;
  const lit = nightAmt > 0.12;
  f(x, y, w, h, u1 + du, u2 - du, z1 + dz, z2 - dz, lit ? '#ffd76a' : side === 'L' ? '#9fd8f2' : '#7cbfe0');
  if (!lit) f(x, y, w, h, u1 + du, u1 + du + (u2 - u1) * 0.18, z1 + dz, z2 - dz, 'rgba(255,255,255,.45)');
  if (lit) {
    const um = (u1 + u2) / 2, zm = (z1 + z2) / 2;
    const p = side === 'L' ? P(x + um * w, y + h, zm) : P(x + w, y + um * h, zm);
    addGlow(p[0], p[1], 9, true);
  }
}
function gableRoofX(x, y, w, h, z, rh, cF, cB, cG, o) {
  o = o == null ? 0.1 : o;
  const ym = y + h / 2;
  const rL = P(x - o, ym, z + rh), rR = P(x + w + o, ym, z + rh);
  poly([P(x - o, y - o, z - 3), P(x + w + o, y - o, z - 3), rR, rL], cB);
  poly([P(x + w, y, z), P(x + w, y + h, z), P(x + w, ym, z + rh)], cG);
  poly([P(x - o, y + h + o, z - 3), P(x + w + o, y + h + o, z - 3), rR, rL], cF);
  line(rL, rR, 'rgba(255,255,255,.3)', 1.5);
  line(P(x - o, y + h + o, z - 3), P(x + w + o, y + h + o, z - 3), 'rgba(0,0,0,.18)', 1.5);
}
function gableRoofY(x, y, w, h, z, rh, cF, cB, cG, o) {
  o = o == null ? 0.1 : o;
  const xm = x + w / 2;
  const rT = P(xm, y - o, z + rh), rB = P(xm, y + h + o, z + rh);
  poly([P(x - o, y - o, z - 3), P(x - o, y + h + o, z - 3), rB, rT], cB);
  poly([P(x, y + h, z), P(x + w, y + h, z), P(xm, y + h, z + rh)], cG);
  poly([P(x + w + o, y - o, z - 3), P(x + w + o, y + h + o, z - 3), rB, rT], cF);
  line(rT, rB, 'rgba(255,255,255,.3)', 1.5);
}
function hipRoof(x, y, w, h, z, rh, cL, cR, cBk, o) {
  o = o == null ? 0.08 : o;
  const a = P(x + w / 2, y + h / 2, z + rh);
  const t = P(x - o, y - o, z - 2), r = P(x + w + o, y - o, z - 2), b = P(x + w + o, y + h + o, z - 2), l = P(x - o, y + h + o, z - 2);
  poly([t, r, a], cBk); poly([l, t, a], cBk);
  poly([l, b, a], cL); poly([b, r, a], cR);
}
function groundShadow(x, y, w, h, ext) { poly([P(x, y), P(x + w + ext, y), P(x + w + ext, y + h), P(x, y + h)], 'rgba(25,45,15,0.2)'); }
function smokeAt(p, rate, big) {
  if (THUMB || Math.random() > DT * rate) return;
  spawn({ type: 'smoke', x: p[0] + rand(-1, 1), y: p[1], vx: rand(3, 9), vy: rand(-18, -10), life: 2.4, max: 2.4, r: big ? 3.6 : 2.5 });
}
function bubbleAt(e, ht, b) { const p = P(e.x + e.w / 2, e.y + e.h / 2, ht); b.x = p[0]; b.y = p[1]; addBubble(b); }

function visibleRange() {
  const pts = [[0, 0], [VW, 0], [0, VH], [VW, VH]].map(([sx, sy]) => { const w = screenToWorld(sx, sy); return worldToTileF(w[0], w[1]); });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w0 = screenToWorld(0, 0), w1 = screenToWorld(VW, VH);
  return {
    x0: Math.floor(x0) - 1, x1: Math.ceil(x1) + 4,
    y0: Math.floor(y0) - 1, y1: Math.ceil(y1) + 4,
    wx0: w0[0], wy0: w0[1], wx1: w1[0], wy1: w1[1],
  };
}

function drawRoad(e) {
  const x = e.x, y = e.y;
  const nT = isRoad(x, y - 1), nR = isRoad(x + 1, y), nB = isRoad(x, y + 1), nL = isRoad(x - 1, y);
  poly(diamond(x, y), '#d4ccbb');
  const s = 0.16;
  const iT = nT ? 0 : s, iR = nR ? 0 : s, iB = nB ? 0 : s, iL = nL ? 0 : s;
  poly([P(x + iL, y + iT), P(x + 1 - iR, y + iT), P(x + 1 - iR, y + 1 - iB), P(x + iL, y + 1 - iB)], '#6f727a');

  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
  const horiz = nL || nR, vert = nT || nB;
  if (horiz && !vert) line(P(x, y + 0.5), P(x + 1, y + 0.5), 'rgba(255,240,200,.6)', 1.5);
  else if (vert && !horiz) line(P(x + 0.5, y), P(x + 0.5, y + 1), 'rgba(255,240,200,.6)', 1.5);
  ctx.setLineDash([]);
}
function drawSoil(e) {
  const x = e.x, y = e.y, i = 0.07;
  const wet = !!e.crop;
  prism(x + i, y + i, 1 - 2 * i, 1 - 2 * i, 0, 3, wet ? '#7b4a2a' : '#966139', '#6a4024', '#573419');
  ctx.strokeStyle = wet ? '#673c21' : '#7d5030'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 1; k < 4; k++) {
    const yy = y + i + (1 - 2 * i) * k / 4;
    const a = P(x + i + 0.05, yy, 3), b = P(x + 1 - i - 0.05, yy, 3);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
}

function drawCrops(e) {
  if (!e.crop) return;
  const g = fieldProgress(e), ready = g >= 1, i = 0.07;
  const pop = !THUMB && NOW - e.pt < 250 ? (NOW - e.pt) / 250 : 1;
  for (let k = 1; k < 4; k++) {
    const v = i + (1 - 2 * i) * k / 4;
    for (let m = 1; m < 4; m++) {
      const u = i + (1 - 2 * i) * m / 4;
      const [sx, sy] = P(e.x + u, e.y + v, 3);
      const sw = THUMB ? 0 : Math.sin(T * 2.2 + e.x * 0.7 + e.y * 0.5 + u * 3 + v * 2) * (ready ? 1.6 : 0.8);
      if (pop < 1) { ctx.save(); ctx.translate(sx, sy); ctx.scale(pop, pop); ctx.translate(-sx, -sy); drawPlant(e.crop, sx, sy, g, sw, ready); ctx.restore(); }
      else drawPlant(e.crop, sx, sy, g, sw, ready);
    }
  }
  if (THUMB) return;
  if (ready) {
    if (Math.random() < DT * 0.9) { const p = P(e.x + rand(0.2, 0.8), e.y + rand(0.2, 0.8), rand(14, 24)); spawn({ type: 'spark', x: p[0], y: p[1], vx: 0, vy: -8, life: 0.9, max: 0.9, r: rand(2, 3.5) }); }
  } else if (cam.z > 0.5) {
    bubbleAt(e, 26, { type: 'bar', p: g });
  }
}
function drawPlant(c, sx, sy, g, sw, ready) {
  ctx.lineCap = 'round';
  if (g < 0.15) {
    ctx.strokeStyle = '#7ccd45'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx - 1.8, sy - 3.2); ctx.moveTo(sx, sy); ctx.lineTo(sx + 1.8, sy - 3.8); ctx.stroke();
    return;
  }
  switch (c) {
    case 'wheat': {
      const h = 5 + 12 * g;
      const col = rgb(mix([112, 176, 62], [232, 186, 74], clamp((g - 0.4) / 0.6, 0, 1)));
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath();
      for (let k = -1; k <= 1; k++) { ctx.moveTo(sx + k * 2, sy); ctx.quadraticCurveTo(sx + k * 2.4, sy - h * 0.6, sx + k * 3 + sw, sy - h); }
      ctx.stroke();
      if (g > 0.55) {
        const hc = ready ? '#f6c84c' : col;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath(); ctx.ellipse(sx + k * 3 + sw, sy - h - 2.6, 1.7, 3.8, k * 0.2, 0, Math.PI * 2); ctx.fillStyle = hc; ctx.fill();
        }
        if (ready) {
          ctx.strokeStyle = 'rgba(255,240,180,.8)'; ctx.lineWidth = 0.7; ctx.beginPath();
          for (let k = -1; k <= 1; k++) { ctx.moveTo(sx + k * 3 + sw, sy - h - 5.5); ctx.lineTo(sx + k * 3.6 + sw, sy - h - 9); }
          ctx.stroke();
        }
      }
      break;
    }
    case 'rice': {
      const h = 4 + 10 * g;
      ctx.strokeStyle = ready ? '#c4cf5c' : g > 0.85 ? '#a7c95a' : '#4fae4a'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let k = -2; k <= 2; k++) { ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + k * 1.2, sy - h * 0.6, sx + k * 2.8 + sw * 0.7, sy - h * (1 - Math.abs(k) * 0.12)); }
      ctx.stroke();
      if (g > 0.6) {
        ctx.strokeStyle = ready ? '#f5d76e' : '#cfd88a'; ctx.lineWidth = ready ? 2.4 : 1.8; ctx.beginPath();
        for (const k of [-1, 1]) { ctx.moveTo(sx + k * 1.5 + sw, sy - h); ctx.quadraticCurveTo(sx + k * 4.5 + sw, sy - h - 1, sx + k * 5.5 + sw, sy - h + 3.5); }
        ctx.stroke();
      }
      break;
    }
    case 'corn': {
      const h = 6 + 18 * g;
      ctx.strokeStyle = '#5a9e34'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * 0.5, sy - h); ctx.stroke();
      ctx.strokeStyle = '#6cbf42'; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(sx, sy - h * 0.3); ctx.quadraticCurveTo(sx - 5, sy - h * 0.45, sx - 7 + sw, sy - h * 0.2);
      ctx.moveTo(sx, sy - h * 0.5); ctx.quadraticCurveTo(sx + 5, sy - h * 0.65, sx + 7 + sw, sy - h * 0.4);
      ctx.stroke();
      if (g > 0.65) {
        ctx.beginPath(); ctx.ellipse(sx + 2.6 + sw * 0.4, sy - h * 0.58, 2.1, 4.2, 0.25, 0, Math.PI * 2); ctx.fillStyle = ready ? '#f7d23a' : '#cbd56b'; ctx.fill();
        ctx.strokeStyle = '#7fbf4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + 1, sy - h * 0.45); ctx.lineTo(sx + 3.5 + sw * 0.4, sy - h * 0.52); ctx.stroke();
        ctx.strokeStyle = '#d8b04a'; ctx.beginPath(); ctx.moveTo(sx + sw * 0.5, sy - h); ctx.lineTo(sx - 2 + sw * 0.5, sy - h - 3); ctx.moveTo(sx + sw * 0.5, sy - h); ctx.lineTo(sx + 2 + sw * 0.5, sy - h - 3); ctx.stroke();
      }
      break;
    }
    case 'carrot': {
      const h = 3 + 8 * g;
      ctx.strokeStyle = '#4fb43c'; ctx.lineWidth = 1.3; ctx.beginPath();
      for (let k = -1; k <= 1; k++) {
        const tx = sx + k * 3 + sw * 0.6, ty = sy - h;
        ctx.moveTo(sx, sy); ctx.lineTo(tx, ty);
        ctx.moveTo((sx + tx) / 2, (sy + ty) / 2); ctx.lineTo((sx + tx) / 2 - 1.5, (sy + ty) / 2 - 1.5);
        ctx.moveTo((sx + tx) / 2, (sy + ty) / 2); ctx.lineTo((sx + tx) / 2 + 1.5, (sy + ty) / 2 - 1.5);
      }
      ctx.stroke();
      if (g > 0.55) ellipse(sx, sy - 0.3, 2.8, 1.7, ready ? '#f5841f' : '#e8a35a');
      break;
    }
    case 'tomato': {
      const r = 2 + 4 * g;
      ctx.strokeStyle = '#8a6239'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + 2, sy); ctx.lineTo(sx + 2, sy - r * 2 - 4); ctx.stroke();
      circle(sx - 1.5 + sw * 0.3, sy - r - 1, r, '#3f9a3a');
      circle(sx + 1.5 + sw * 0.3, sy - r - 2.5, r * 0.85, '#52b046');
      if (g > 0.5) {
        const fc = ready ? '#e8412f' : g > 0.8 ? '#f08b3b' : '#a5d24f';
        circle(sx - 2.5 + sw * 0.3, sy - r - 0.5, 1.8, fc); circle(sx + 2 + sw * 0.3, sy - r - 1, 1.7, fc); circle(sx + sw * 0.3, sy - r * 1.8 - 1, 1.6, fc);
      }
      break;
    }
    case 'strawberry': {
      const r = 1.5 + 2.5 * g;
      circle(sx - 2.5, sy - 2, r, '#3d8f3a'); circle(sx + 2.5, sy - 2, r, '#3d8f3a'); circle(sx + sw * 0.3, sy - 3.5, r, '#4ea844');
      if (g > 0.6) {
        const fc = ready ? '#e5334b' : '#f3a3a3';
        circle(sx - 2.2, sy - 0.4, 1.9, fc); circle(sx + 2.6, sy, 1.8, fc);
        if (ready) { circle(sx - 2.6, sy - 0.8, 0.4, '#ffe9a8'); circle(sx + 2.2, sy - 0.4, 0.4, '#ffe9a8'); }
      }
      break;
    }
    case 'potato': {
      const r = 1.5 + 3.5 * g;
      circle(sx - 2, sy - r * 0.8, r * 0.8, '#4f9d3c'); circle(sx + 2 + sw * 0.3, sy - r, r * 0.9, '#5fb447');
      if (g > 0.5) { circle(sx - 1 + sw * 0.3, sy - r * 1.6, 1.1, '#f3f0ff'); circle(sx + 2.5 + sw * 0.3, sy - r * 1.8, 1, '#e8dcff'); }
      if (ready) { ellipse(sx - 3, sy + 0.5, 2.4, 1.6, '#c9995a'); ellipse(sx + 2.8, sy + 0.8, 2.2, 1.5, '#b88a4f'); }
      break;
    }
    case 'sugarcane': {
      const h = 6 + 20 * g;
      ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.strokeStyle = ready ? '#b9cf5a' : '#7cb846'; ctx.beginPath(); ctx.moveTo(sx + k * 2.5, sy); ctx.lineTo(sx + k * 2.5 + sw * 0.5, sy - h); ctx.stroke();
        ctx.strokeStyle = 'rgba(70,110,40,.6)'; ctx.lineWidth = 0.8; ctx.beginPath();
        for (let m = 1; m < 4; m++) { const yy = sy - h * m / 4; ctx.moveTo(sx + k * 2.5 - 1.2, yy); ctx.lineTo(sx + k * 2.5 + 1.2, yy); }
        ctx.stroke(); ctx.lineWidth = 2;
      }
      ctx.strokeStyle = '#5fae3e'; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(sx, sy - h * 0.8); ctx.quadraticCurveTo(sx - 6, sy - h, sx - 8 + sw, sy - h * 0.7);
      ctx.moveTo(sx, sy - h * 0.9); ctx.quadraticCurveTo(sx + 6, sy - h * 1.05, sx + 8 + sw, sy - h * 0.8); ctx.stroke();
      break;
    }
    case 'cotton': {
      const h = 4 + 10 * g;
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * 0.4, sy - h); ctx.moveTo(sx, sy - h * 0.5); ctx.lineTo(sx - 3 + sw * 0.3, sy - h * 0.8); ctx.moveTo(sx, sy - h * 0.6); ctx.lineTo(sx + 3 + sw * 0.3, sy - h * 0.9); ctx.stroke();
      circle(sx - 2, sy - h * 0.5, 2.2, '#4f9d3c'); circle(sx + 2, sy - h * 0.6, 2, '#5fb447');
      if (g > 0.55) { const c = ready ? '#ffffff' : '#dfe8d0', r = ready ? 2.4 : 1.5; circle(sx + sw * 0.4, sy - h - 1, r, c); circle(sx - 3 + sw * 0.3, sy - h * 0.8 - 1, r * 0.9, c); circle(sx + 3 + sw * 0.3, sy - h * 0.9 - 1, r * 0.9, c); }
      break;
    }
    case 'pumpkin': {
      ctx.strokeStyle = '#4f9d3c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx - 5, sy); ctx.quadraticCurveTo(sx, sy - 3, sx + 5, sy); ctx.stroke();
      circle(sx - 3, sy - 2, 1.5 + g * 1.5, '#4f9d3c'); circle(sx + 3.5, sy - 1.5, 1.5 + g * 1.5, '#5fb447');
      if (g > 0.35) {
        const r = 1 + 3.5 * g, c = ready ? '#f08a24' : g > 0.75 ? '#e8b04a' : '#a7c958';
        ellipse(sx, sy - r * 0.7, r * 1.25, r * 0.85, c);
        ctx.strokeStyle = 'rgba(120,60,10,.35)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(sx, sy - r * 1.5); ctx.lineTo(sx, sy); ctx.stroke();
        line([sx, sy - r * 1.5], [sx + 1, sy - r * 1.5 - 1.8], '#6b4a2f', 1.2);
      }
      break;
    }
    default: drawGenericPlant(c, sx, sy, g, sw, ready);
  }
}

const TREE_PAL = [
  ['#4b9a38', '#62b545', '#88cf5e'],
  ['#2f7d4a', '#3f9a5a', '#5bb874'],
  ['#56a83c', '#76c34d', '#a0d96e'],
  ['#d9822b', '#eba13a', '#f6c35a'],
  ['#56b85a', '#76c34d', '#a0d96e'],
  ['#f48fb1', '#f8bbd0', '#fce4ec'],
  ['#4f7f6a', '#e3eef2', '#ffffff'],
];
function drawTree(cx, cy, v, seed, id, scale) {
  const [sx, sy] = P(cx, cy);
  const s = (scale || 1) * (0.85 + (seed % 37) / 100);
  const pal = TREE_PAL[v] || TREE_PAL[0];
  if (!THUMB && cam.z < 0.38) {
    if (v === 1 || v === 6) poly([[sx - 14 * s, sy - 6 * s], [sx, sy - 44 * s], [sx + 14 * s, sy - 6 * s]], v === 6 ? '#dfeaf0' : pal[0]);
    else circle(sx, sy - 22 * s, 14 * s, v === 4 ? '#56b85a' : pal[0]);
    return;
  }
  const sw = THUMB ? 0 : Math.sin(T * 1.3 + id * 1.37) * 1.3;
  ellipse(sx + 5 * s, sy + 1, 15 * s, 6.5 * s, 'rgba(20,50,10,.25)');
  if (v === 4) {
    ctx.strokeStyle = '#9a7048'; ctx.lineWidth = 3.5 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 6 * s, sy - 18 * s, sx + 3 * s + sw, sy - 34 * s); ctx.stroke();
    const tx = sx + 3 * s + sw, ty = sy - 34 * s;
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + 0.3, len = 15 * s;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + 5 * s;
      ctx.strokeStyle = k % 2 ? '#3f9a4a' : '#56b85a'; ctx.lineWidth = 3.2 * s;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + ex) / 2, ty - 6 * s, ex, ey); ctx.stroke();
    }
    circle(tx - 1.5 * s, ty + 2 * s, 2 * s, '#7a5230'); circle(tx + 1.5 * s, ty + 2.5 * s, 2 * s, '#6b4527');
    return;
  }
  if (v === 1 || v === 6) {
    poly([[sx - 2.5 * s, sy], [sx + 2.5 * s, sy], [sx + 2 * s, sy - 10 * s], [sx - 2 * s, sy - 10 * s]], '#6b4527');
    for (let k = 0; k < 3; k++) {
      const bw = (17 - k * 4) * s, by = sy - 7 * s - k * 11 * s, ht = 17 * s, ox = sw * (k + 1) * 0.5;
      poly([[sx - bw, by], [sx + ox, by - ht - 6 * s], [sx, by + 2 * s]], pal[1]);
      poly([[sx, by + 2 * s], [sx + ox, by - ht - 6 * s], [sx + bw, by]], pal[0]);
    }
  } else {
    poly([[sx - 3 * s, sy], [sx + 3 * s, sy], [sx + 2 * s, sy - 14 * s], [sx - 2 * s, sy - 14 * s]], '#7a4f2c');
    const c0 = sy - 24 * s;
    circle(sx + sw * 0.6 + s, c0 + 3 * s, 14 * s, pal[0]);
    circle(sx - 7 * s + sw * 0.8, c0 + s, 9.5 * s, pal[0]);
    circle(sx + 8 * s + sw * 0.8, c0 + s, 9 * s, pal[0]);
    circle(sx - 3 * s + sw, c0 - 5 * s, 10 * s, pal[1]);
    circle(sx + 5 * s + sw, c0 - 3 * s, 8 * s, pal[1]);
    circle(sx - 4 * s + sw, c0 - 9 * s, 5.5 * s, pal[2]);
    if (v === 2 && seed % 3 === 0) {
      for (let k = 0; k < 5; k++) circle(sx + sw + ((seed * (k + 3)) % 20 - 10) * s, c0 + ((seed * (k + 7)) % 16 - 8) * s, 1.8 * s, '#e8412f');
    }
  }
}
function rockBlob(x, y, rx, ry, seed, base, dark, light) {
  const n = 7, pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const j = 0.75 + hash2(seed, i, 3) * 0.35;
    pts.push([x + Math.cos(a) * rx * j, y + Math.sin(a) * ry * j]);
  }
  pts.push([x + rx * 0.9, y + 2]); pts.push([x - rx * 0.9, y + 2]);
  poly(pts, base);
  poly([pts[3], pts[4], pts[5], pts[6], [x + rx * 0.9, y + 2], [x, y + 2]], dark);
  ellipse(x - rx * 0.3, y - ry * 0.55, rx * 0.32, ry * 0.15, light);
}
function drawRock(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.55);
  const s = 0.8 + (e.s % 40) / 100;
  ellipse(sx + 3, sy + 2, 16 * s, 6 * s, 'rgba(0,0,0,.2)');
  rockBlob(sx - 3 * s, sy, 12 * s, 14 * s, e.s, '#9ba1a7', '#7d838a', '#c9ced2');
  rockBlob(sx + 8 * s, sy + 3 * s, 7 * s, 7 * s, e.s + 7, '#a7adb2', '#868c92', '#d2d6d9');
  if (e.s % 3 === 0) ellipse(sx - 6 * s, sy - 4 * s, 3 * s, 1.5 * s, 'rgba(110,170,80,.7)');
}
function drawBush(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  const s = 0.8 + (e.s % 30) / 100;
  const sw = THUMB ? 0 : Math.sin(T * 1.6 + e.id) * 0.8;
  ellipse(sx + 3, sy + 1, 13 * s, 5 * s, 'rgba(20,50,10,.22)');
  circle(sx - 6 * s, sy - 5 * s, 7 * s, '#428f34');
  circle(sx + 6 * s, sy - 5 * s, 7 * s, '#428f34');
  circle(sx + sw, sy - 9 * s, 8 * s, '#55ad42');
  circle(sx - 2 * s + sw, sy - 12 * s, 4 * s, '#80cb5e');
  if (e.s % 2) {
    const bc = e.s % 4 === 1 ? '#e0475a' : '#7b5bd6';
    circle(sx - 5 * s, sy - 7 * s, 1.6 * s, bc); circle(sx + 4 * s, sy - 10 * s, 1.6 * s, bc); circle(sx + 7 * s, sy - 4 * s, 1.6 * s, bc);
  }
}

const HOUSE_PAL = [
  { wall: '#f7e9cc', wallR: '#e2cda4', roof: '#e0574a', roofB: '#c94a3e', roofD: '#a83a30' },
  { wall: '#d6ecf7', wallR: '#b6d3e6', roof: '#4f7fc2', roofB: '#446fae', roofD: '#355a8f' },
  { wall: '#fbe0cf', wallR: '#ebc3aa', roof: '#62a84a', roofB: '#56963f', roofD: '#447a31' },
  { wall: '#fff1b5', wallR: '#ecd98b', roof: '#9563b0', roofB: '#82559b', roofD: '#6a4380' },
  { wall: '#f2f2ee', wallR: '#d8d8d0', roof: '#d98236', roofB: '#c4732d', roofD: '#a35d22' },
];
function foundation(x, y, w, h) { prism(x - 0.06, y - 0.06, w + 0.12, h + 0.12, 0, 4, '#d7cfbf', '#b9b0a0', '#a39a8a'); }
function frontPath(e, x0, x1) { poly([P(x0, e.y + e.h - 0.3), P(x1, e.y + e.h - 0.3), P(x1, e.y + e.h), P(x0, e.y + e.h)], '#ddd3bd'); }
function rentBubble(e, ht) { if (BUILD[e.t].rent && rentReady(e)) bubbleAt(e, ht, { icon: '🪙' }); }

function drawHouse(e, o) {
  const pal = HOUSE_PAL[(e.v || 0) % HOUSE_PAL.length];
  const ins = 0.3, x = e.x + ins, y = e.y + ins, w = e.w - ins * 2, h = e.h - ins * 2;
  const wh = o.wallH, rh = o.roofH;
  groundShadow(x, y, w, h, 0.55);
  frontPath(e, x + w * 0.42, x + w * 0.6);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, pal.wall, pal.wallR);
  faceL(x, y, w, h, 0.4, 0.62, 4, 19, '#ffffff');
  faceL(x, y, w, h, 0.43, 0.59, 4, 17.5, '#8a5634');
  const kn = P(x + w * 0.56, y + h, 10); circle(kn[0], kn[1], 0.9, '#f3d36b');
  win('L', x, y, w, h, 0.08, 0.3, 9, 19); win('L', x, y, w, h, 0.72, 0.93, 9, 19);
  win('R', x, y, w, h, 0.15, 0.4, 9, 19); win('R', x, y, w, h, 0.6, 0.85, 9, 19);
  if (o.ry) gableRoofY(x, y, w, h, wh, rh, pal.roofD, pal.roofB, pal.wall);
  else gableRoofX(x, y, w, h, wh, rh, pal.roof, pal.roofB, pal.wallR);
  if (o.ry) win('L', x, y, w, h, 0.42, 0.58, wh + 4, wh + 11);
  const chx = x + w * 0.66, chy = y + h * 0.22;
  prism(chx, chy, 0.16, 0.16, wh + rh * 0.4, wh + rh + 6, '#b06048', '#9a4f3a', '#7f3e2d');
  smokeAt(P(chx + 0.08, chy + 0.08, wh + rh + 8), 0.9);

  faceL(x, y, w, h, 0.08, 0.3, 7, 9, '#7a5534');
  rentBubble(e, wh + rh + 18);
}
function drawVilla(e) {
  const x = e.x + 0.22, y = e.y + 0.22;
  groundShadow(x, y, 1.56, 1.56, 0.5);

  poly(diamond(e.x + 0.06, e.y + 0.06, 1.88, 1.88), '#86c95f');
  frontPath(e, x + 0.3, x + 0.5);
  foundation(x, y, 1.0, 1.56);
  prism(x, y, 1.0, 1.56, 4, 30, null, '#fbf6ec', '#e3dccd');
  win('L', x, y, 1.0, 1.56, 0.2, 0.75, 10, 22);
  win('R', x, y, 1.0, 1.56, 0.1, 0.3, 10, 22); win('R', x, y, 1.0, 1.56, 0.4, 0.6, 10, 22);
  gableRoofY(x, y, 1.0, 1.56, 30, 22, '#b85b31', '#cf6a3c', '#fbf6ec');
  win('L', x, y, 1.0, 1.56, 0.4, 0.6, 34, 42);

  const wx = x + 1.0, wy = y + 0.45, ww = 0.56, whh = 1.11;
  foundation(wx, wy, ww, whh);
  prism(wx, wy, ww, whh, 4, 24, null, '#f6efe0', '#ddd4c2');
  faceL(wx, wy, ww, whh, 0.25, 0.75, 4, 18, '#ffffff'); faceL(wx, wy, ww, whh, 0.3, 0.7, 4, 17, '#7c4f32');
  win('R', wx, wy, ww, whh, 0.2, 0.45, 9, 19); win('R', wx, wy, ww, whh, 0.6, 0.85, 9, 19);
  gableRoofX(wx, wy, ww, whh, 24, 16, '#cf6a3c', '#b85b31', '#ddd4c2');
  prism(x + 0.2, y + 0.3, 0.16, 0.16, 40, 58, '#b06048', '#9a4f3a', '#7f3e2d');
  smokeAt(P(x + 0.28, y + 0.38, 60), 0.8);
  rentBubble(e, 70);
}
function drawApartment(e) {
  const pals = [['#e9d8c4', '#cdb79f', '#c8614a'], ['#cfd8e3', '#aebccc', '#5c6f8a'], ['#f1e0b5', '#d8c290', '#8a7a55']];
  const p = pals[(e.v || 0) % 3];
  const x = e.x + 0.25, y = e.y + 0.25, w = 1.5, h = 1.5, H = 100;
  groundShadow(x, y, w, h, 1.3);
  prism(x - 0.05, y - 0.05, w + 0.1, h + 0.1, 0, 6, '#bdb6aa', '#a39c90', '#8c867b');
  prism(x, y, w, h, 6, H, null, p[0], p[1]);
  for (let f = 0; f < 4; f++) {
    const z = 16 + f * 21;
    for (let k = 0; k < 3; k++) {
      const u1 = 0.08 + k * 0.31;
      if (!(f === 0 && k === 1)) win('L', x, y, w, h, u1, u1 + 0.22, z, z + 12);
      win('R', x, y, w, h, u1, u1 + 0.22, z, z + 12);
    }
    if (f > 0) { faceL(x, y, w, h, 0, 1, z - 4.5, z - 3, p[2]); faceR(x, y, w, h, 0, 1, z - 4.5, z - 3, shade(p[2], -0.2)); }
  }
  faceL(x, y, w, h, 0.4, 0.6, 6, 24, '#ffffff'); faceL(x, y, w, h, 0.42, 0.58, 6, 23, '#5b6b78');
  poly([P(x + w * 0.36, y + h, 27), P(x + w * 0.64, y + h, 27), P(x + w * 0.64, y + h + 0.2, 24), P(x + w * 0.36, y + h + 0.2, 24)], p[2]);
  prism(x, y, w, h, H, H + 4, '#9a9590', shade(p[0], -0.15), shade(p[1], -0.15));
  poly([P(x + 0.08, y + 0.08, H + 4), P(x + w - 0.08, y + 0.08, H + 4), P(x + w - 0.08, y + h - 0.08, H + 4), P(x + 0.08, y + h - 0.08, H + 4)], '#7f7a75');
  prism(x + 0.85, y + 0.3, 0.38, 0.38, H + 4, H + 18, '#8c97a1', '#79848e', '#66717a');
  prism(x + 0.25, y + 0.9, 0.3, 0.3, H + 4, H + 10, '#c9c4bb', '#b2ada4', '#9b968e');
  rentBubble(e, H + 32);
}
function drawBarn(e) {
  const x = e.x + 0.18, y = e.y + 0.18, w = 1.64, h = 1.64, wh = 30, rh = 26;
  groundShadow(x, y, w, h, 0.6);
  prism(x, y, w, h, 0, wh, null, '#c8432f', '#a3341f');
  ctx.lineCap = 'round';
  for (const [a, b] of [[P(x, y + h, 0), P(x, y + h, wh)], [P(x + w, y + h, 0), P(x + w, y + h, wh)], [P(x + w, y, 0), P(x + w, y, wh)], [P(x, y + h, wh), P(x + w, y + h, wh)], [P(x + w, y + h, wh), P(x + w, y, wh)]]) line(a, b, '#fff4e6', 2.2);
  faceL(x, y, w, h, 0.27, 0.73, 0, 23, '#fff4e6');
  faceL(x, y, w, h, 0.3, 0.7, 0, 21, '#8e2a1c');
  line(P(x + w * 0.3, y + h, 0), P(x + w * 0.7, y + h, 21), '#fff4e6', 1.8);
  line(P(x + w * 0.7, y + h, 0), P(x + w * 0.3, y + h, 21), '#fff4e6', 1.8);
  line(P(x + w * 0.5, y + h, 0), P(x + w * 0.5, y + h, 21), '#fff4e6', 1.5);
  win('R', x, y, w, h, 0.25, 0.4, 14, 22); win('R', x, y, w, h, 0.6, 0.75, 14, 22);
  gableRoofY(x, y, w, h, wh, rh, '#6d4c41', '#5d4037', '#c8432f', 0.12);
  const ap = P(x + w / 2, y + h, wh + rh);
  line(P(x, y + h, wh), ap, '#fff4e6', 2.2); line(P(x + w, y + h, wh), ap, '#fff4e6', 2.2);
  faceL(x, y, w, h, 0.4, 0.6, wh + 3, wh + 13, '#fff4e6'); faceL(x, y, w, h, 0.43, 0.57, wh + 4, wh + 12, '#5a1e14');

  prism(e.x + 0.02, e.y + 1.62, 0.32, 0.28, 0, 9, '#f6d97a', '#e6bf4f', '#cfa83f');
  prism(e.x + 1.65, e.y + 1.55, 0.3, 0.32, 0, 9, '#f6d97a', '#e6bf4f', '#cfa83f');
  if (!THUMB && barnFree() <= 0) bubbleAt(e, 74, { icon: '⚠️' });
}
function drawMarket(e) {
  const x = e.x, y = e.y;
  poly(diamond(x + 0.05, y + 0.05, 1.9, 1.9), '#e9dfc8');
  ctx.strokeStyle = 'rgba(160,140,110,.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 1; k < 4; k++) { const a = P(x + 0.05 + k * 0.475, y + 0.05), b = P(x + 0.05 + k * 0.475, y + 1.95); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); const c = P(x + 0.05, y + 0.05 + k * 0.475), d = P(x + 1.95, y + 0.05 + k * 0.475); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
  ctx.stroke();
  groundShadow(x + 0.2, y + 0.2, 1.6, 1.4, 0.3);
  prism(x + 0.2, y + 0.2, 1.6, 0.22, 0, 34, '#a0703c', '#b98546', '#8a5c2e');

  prism(x + 0.3, y + 0.5, 0.3, 0.3, 0, 8, '#c99a5a', '#b5864a', '#9a703c');

  prism(x + 0.25, y + 1.05, 1.5, 0.45, 0, 13, '#e2b06a', '#c28a48', '#a87436');
  const goods = ['#f4c64e', '#e8412f', '#f08a24', '#7cc04a', '#f6cf35'];
  for (let k = 0; k < 5; k++) {
    const p = P(x + 0.4 + k * 0.29, y + 1.27, 13);
    ellipse(p[0], p[1] - 2, 5.5, 3.4, goods[k]);
    ellipse(p[0] - 1.5, p[1] - 3.5, 1.8, 1, 'rgba(255,255,255,.5)');
  }
  for (const [px, py] of [[x + 0.22, y + 1.62], [x + 1.71, y + 1.62]]) prism(px, py, 0.07, 0.07, 0, 31, '#8a5c2e', '#7a4f26', '#6a431f');
  const n = 6;
  for (let k = 0; k < n; k++) {
    const x0 = x + 0.15 + k * (1.7 / n), x1 = x0 + 1.7 / n;
    poly([P(x0, y + 0.15, 40), P(x1, y + 0.15, 40), P(x1, y + 1.75, 30), P(x0, y + 1.75, 30)], k % 2 ? '#fff7ee' : '#e8473a');
  }
  for (let k = 0; k < n; k++) {
    const x0 = x + 0.15 + k * (1.7 / n), x1 = x0 + 1.7 / n, xm = (x0 + x1) / 2;
    poly([P(x0, y + 1.75, 30), P(x1, y + 1.75, 30), P(xm, y + 1.75, 25.5)], k % 2 ? '#efe2d2' : '#c9372b');
  }
  poly([P(x + 1.85, y + 0.15, 40), P(x + 1.85, y + 1.75, 30), P(x + 1.85, y + 1.75, 27), P(x + 1.85, y + 0.15, 37)], '#b52f24');
  const sp = P(x + 1, y + 0.3, 54);
  line(P(x + 0.6, y + 0.3, 40), P(x + 0.6, y + 0.3, 50), '#5b3b1f', 1.5); line(P(x + 1.4, y + 0.3, 40), P(x + 1.4, y + 0.3, 50), '#5b3b1f', 1.5);
  rr(sp[0] - 27, sp[1] - 8, 54, 16, 4, '#5b3b1f');
  ctx.fillStyle = '#ffe39a'; ctx.font = '700 9.5px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('MARKET', sp[0], sp[1] + 0.5);
  if (!THUMB && S.orders.length) bubbleAt(e, 74, { icon: '🧾', count: S.orders.length });
}
function drawTownHall(e) {
  const x = e.x, y = e.y;
  poly(diamond(x + 0.05, y + 0.05, 2.9, 2.9), '#e6dccb');
  const bx = x + 0.35, by = y + 0.3, bw = 2.3, bh = 2.25;
  groundShadow(bx, by, bw, bh, 0.9);
  prism(bx + 0.6, by + bh, 1.1, 0.3, 0, 4, '#e3dccd', '#cbc2b0', '#b5ac9a');
  prism(bx + 0.6, by + bh, 1.1, 0.15, 4, 8, '#e3dccd', '#cbc2b0', '#b5ac9a');
  prism(bx, by, bw, bh, 0, 8, '#d8d0c0', '#c4bba9', '#aea592');
  prism(bx, by, bw, bh, 8, 48, null, '#f6f1e7', '#ddd5c6');
  faceL(bx, by, bw, bh, 0.38, 0.62, 8, 28, '#e8dfcc');
  faceL(bx, by, bw, bh, 0.43, 0.57, 8, 25, '#6b4a2f');
  for (const u of [0.1, 0.24, 0.76, 0.9]) win('L', bx, by, bw, bh, u - 0.045, u + 0.045, 14, 30);
  for (const u of [0.04, 0.32, 0.68, 0.96]) { faceL(bx, by, bw, bh, u - 0.018, u + 0.018, 8, 44, '#ffffff'); faceL(bx, by, bw, bh, u + 0.006, u + 0.018, 8, 44, '#e2dacb'); }
  faceL(bx, by, bw, bh, 0, 1, 42, 48, '#ece4d4'); faceR(bx, by, bw, bh, 0, 1, 42, 48, '#d3cab9');
  for (const u of [0.15, 0.42, 0.69]) { win('R', bx, by, bw, bh, u, u + 0.14, 14, 26); win('R', bx, by, bw, bh, u, u + 0.14, 30, 39); }
  hipRoof(bx, by, bw, bh, 48, 24, '#4a7fc4', '#3a66a3', '#5b8fd1', 0.12);
  const tx = bx + 0.85, ty = by + 0.82, tw = 0.6;
  prism(tx, ty, tw, tw, 56, 94, null, '#f6f1e7', '#ddd5c6');
  const cp = P(tx + tw / 2, ty + tw, 81);
  circle(cp[0], cp[1], 6.5, '#fffdf5'); ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cp[0], cp[1], 6.5, 0, Math.PI * 2); ctx.stroke();
  const d = new Date(), ha = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, ma = d.getMinutes() / 60 * Math.PI * 2;
  line(cp, [cp[0] + Math.sin(ha) * 3.5, cp[1] - Math.cos(ha) * 3.5], '#2b2b2b', 1.4);
  line(cp, [cp[0] + Math.sin(ma) * 5, cp[1] - Math.cos(ma) * 5], '#2b2b2b', 1);
  win('R', tx, ty, tw, tw, 0.3, 0.7, 74, 88);
  hipRoof(tx, ty, tw, tw, 94, 20, '#4a7fc4', '#3a66a3', '#5b8fd1', 0.06);
  const fp = P(tx + tw / 2, ty + tw / 2, 113);
  line(fp, [fp[0], fp[1] - 18], '#5a5a5a', 1.4);
  const wv = THUMB ? 0 : T * 6;
  ctx.beginPath(); ctx.moveTo(fp[0], fp[1] - 18);
  for (let k = 0; k <= 6; k++) ctx.lineTo(fp[0] + k * 2.4, fp[1] - 18 + Math.sin(wv + k * 0.9) * 1.5 * (k / 6));
  for (let k = 6; k >= 0; k--) ctx.lineTo(fp[0] + k * 2.4, fp[1] - 10 + Math.sin(wv + k * 0.9) * 1.5 * (k / 6));
  ctx.closePath(); ctx.fillStyle = '#e74c3c'; ctx.fill();
}
function drawWindmill(e) {
  const x = e.x, y = e.y, cx = x + 1, cy = y + 1;
  groundShadow(x + 0.5, y + 0.5, 1, 1, 1.2);
  prism(x + 0.42, y + 0.42, 1.16, 1.16, 0, 10, '#c4bcaf', '#a8a093', '#8f877a');
  const b0 = 0.5, t0 = 0.28, zb = 10, zt = 80;
  poly([P(cx - b0, cy + b0, zb), P(cx + b0, cy + b0, zb), P(cx + t0, cy + t0, zt), P(cx - t0, cy + t0, zt)], '#f3ead8');
  poly([P(cx + b0, cy + b0, zb), P(cx + b0, cy - b0, zb), P(cx + t0, cy - t0, zt), P(cx + t0, cy + t0, zt)], '#d9cdb4');
  for (const zz of [30, 52]) { const k = (zz - zb) / (zt - zb), hs = b0 + (t0 - b0) * k; line(P(cx - hs, cy + hs, zz), P(cx + hs, cy + hs, zz), 'rgba(150,120,80,.35)', 1); }
  poly([P(cx - 0.12, cy + b0, zb), P(cx + 0.12, cy + b0, zb), P(cx + 0.11, cy + 0.48, 30), P(cx - 0.11, cy + 0.48, 30)], '#7a5234');
  const wy2 = cy + 0.38;
  poly([P(cx + 0.38, cy - 0.05, 40), P(cx + 0.38, cy + 0.12, 40), P(cx + 0.36, cy + 0.12, 52), P(cx + 0.36, cy - 0.05, 52)], nightAmt > 0.12 ? '#ffd76a' : '#8cc6e0');
  if (nightAmt > 0.12) { const g = P(cx + 0.37, cy + 0.03, 46); addGlow(g[0], g[1], 14); }
  void wy2;
  hipRoof(cx - t0 - 0.05, cy - t0 - 0.05, 2 * t0 + 0.1, 2 * t0 + 0.1, zt, 20, '#c0492f', '#9e3a24', '#d0583c', 0.05);
  const hub = P(cx, cy + t0 + 0.2, zt - 6);
  const ang = THUMB ? 0.5 : T * 1.1;
  const proj = (u, v, L, Lz) => [hub[0] + u * L * HW * 0.7, hub[1] + u * L * HH * 0.7 - v * Lz];
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const a = ang + k * Math.PI / 2, u = Math.cos(a), v = Math.sin(a);
    const pu = Math.cos(a + Math.PI / 2), pv = Math.sin(a + Math.PI / 2);
    const p0 = proj(u, v, 0.3, 10), p1 = proj(u, v, 1.45, 48);
    const q0 = [p0[0] + pu * 5.5, p0[1] + pu * 2.7 - pv * 7], q1 = [p1[0] + pu * 5.5, p1[1] + pu * 2.7 - pv * 7];
    poly([p0, p1, q1, q0], 'rgba(250,244,230,.95)', '#9a7a55', 1);
    ctx.strokeStyle = 'rgba(154,122,85,.6)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let m = 1; m < 4; m++) { const t = m / 4; ctx.moveTo(lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)); ctx.lineTo(lerp(q0[0], q1[0], t), lerp(q0[1], q1[1], t)); }
    ctx.stroke();
    line(hub, p1, '#6b4a2f', 2);
  }
  circle(hub[0], hub[1], 3.6, '#5a3d26');
}

function factoryBubble(e, ht) {
  if (THUMB) return;
  if (e.out && e.out.length) bubbleAt(e, ht, { icon: GOODS[e.out[0]].icon, count: e.out.length });
  else if (e.job) bubbleAt(e, ht - 6, { type: 'bar', p: clamp((NOW - e.job.st) / (e.job.d || RECIPES[e.job.r].time), 0, 1), color: '#ffb236' });
}
function awningL(x, y, w, h, u1, u2, z, depth, n, c1, c2) {
  for (let k = 0; k < n; k++) {
    const a = u1 + (u2 - u1) * k / n, b = u1 + (u2 - u1) * (k + 1) / n;
    poly([P(x + a * w, y + h, z), P(x + b * w, y + h, z), P(x + b * w, y + h + depth, z - 7), P(x + a * w, y + h + depth, z - 7)], k % 2 ? c2 : c1);
  }
}
function signBoard(p, text, bg, fg, font) {
  ctx.font = font || '700 9px Fredoka, sans-serif';
  const w = Math.max(30, ctx.measureText(text).width + 12);
  rr(p[0] - w / 2, p[1] - 8, w, 16, 5, bg, '#ffffff', 1.5);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, p[0], p[1] + 0.5);
}
function emojiAt(p, ch, size) {
  ctx.font = `${size}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, p[0], p[1]);
}
function drawBakery(e) {
  const x = e.x + 0.28, y = e.y + 0.28, w = 1.44, h = 1.44, wh = 28, rh = 22;
  groundShadow(x, y, w, h, 0.55);
  frontPath(e, x + w * 0.5, x + w * 0.68);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#f4d9a8', '#ddbd86');
  faceL(x, y, w, h, 0, 1, 4, 9, '#c0763f'); faceR(x, y, w, h, 0, 1, 4, 9, '#a5622f');
  win('L', x, y, w, h, 0.07, 0.4, 11, 21);
  faceL(x, y, w, h, 0.5, 0.68, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.52, 0.66, 4, 19, '#7a4526');
  win('R', x, y, w, h, 0.18, 0.42, 12, 21); win('R', x, y, w, h, 0.6, 0.84, 12, 21);
  awningL(x, y, w, h, 0.04, 0.43, 25, 0.22, 5, '#b5482e', '#fff4e6');
  gableRoofX(x, y, w, h, wh, rh, '#a0522d', '#8b4513', '#ddbd86');
  const chx = x + w * 0.12, chy = y + h * 0.18;
  prism(chx, chy, 0.24, 0.24, wh + 4, wh + rh + 12, '#b5651d', '#9c5418', '#7f4413');
  if (e.job) smokeAt(P(chx + 0.12, chy + 0.12, wh + rh + 14), 3, true);
  const sp = P(x + w * 0.75, y + h + 0.05, 24);
  line([sp[0], sp[1] - 14], [sp[0], sp[1] - 9], '#5b3b1f', 1.2);
  circle(sp[0], sp[1], 8, '#fff4e6'); emojiAt([sp[0], sp[1] + 0.5], '🥖', 10);
  factoryBubble(e, 72);
}
function drawSnack(e) {
  const x = e.x + 0.28, y = e.y + 0.28, w = 1.44, h = 1.44, wh = 30;
  groundShadow(x, y, w, h, 0.55);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#ffd95e', '#e6b93f');
  faceL(x, y, w, h, 0.08, 0.6, 10, 22, '#ffffff'); faceL(x, y, w, h, 0.1, 0.58, 11, 21, '#5a3a2a');
  prism(x + w * 0.05, y + h, w * 0.6, 0.12, 4, 11, '#f2f2f2', '#d9d9d9', '#c4c4c4');
  faceL(x, y, w, h, 0.7, 0.88, 4, 20, '#ffffff'); faceL(x, y, w, h, 0.72, 0.86, 4, 19, '#c0392b');
  win('R', x, y, w, h, 0.2, 0.45, 12, 22); win('R', x, y, w, h, 0.6, 0.85, 12, 22);
  awningL(x, y, w, h, 0.04, 0.64, 26, 0.24, 6, '#e8473a', '#ffffff');
  prism(x - 0.04, y - 0.04, w + 0.08, h + 0.08, wh, wh + 4, '#d64532', '#e85a45', '#c23b2a');
  poly([P(x + 0.06, y + 0.06, wh + 4), P(x + w - 0.06, y + 0.06, wh + 4), P(x + w - 0.06, y + h - 0.06, wh + 4), P(x + 0.06, y + h - 0.06, wh + 4)], '#b8392b');
  const bp = P(x + w / 2, y + h / 2, wh + 22);
  line(P(x + w / 2, y + h / 2, wh + 4), [bp[0], bp[1] + 8], '#555', 2);
  circle(bp[0], bp[1], 13, '#fff7d6'); ctx.strokeStyle = '#e8473a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bp[0], bp[1], 13, 0, Math.PI * 2); ctx.stroke();
  emojiAt([bp[0], bp[1] + 1], '🍿', 15);
  factoryBubble(e, 78);
}
function drawDiner(e) {
  const x = e.x + 0.26, y = e.y + 0.26, w = 1.48, h = 1.48, wh = 28;
  groundShadow(x, y, w, h, 0.55);
  foundation(x, y, w, h);
  prism(x, y, w, h, 4, wh, null, '#8fd6cc', '#6fbfb4');
  faceL(x, y, w, h, 0, 1, 19, 22, '#eef3f6'); faceR(x, y, w, h, 0, 1, 19, 22, '#d5dde2');
  for (const [a, b] of [[0.05, 0.28], [0.3, 0.5]]) win('L', x, y, w, h, a, b, 8, 18);
  faceL(x, y, w, h, 0.58, 0.76, 4, 19, '#ffffff'); faceL(x, y, w, h, 0.6, 0.74, 4, 18, '#d64545');
  win('L', x, y, w, h, 0.8, 0.96, 8, 18);
  for (const [a, b] of [[0.06, 0.3], [0.36, 0.62], [0.68, 0.94]]) win('R', x, y, w, h, a, b, 8, 18);
  prism(x - 0.05, y - 0.05, w + 0.1, h + 0.1, wh, wh + 4, '#f1ebe0', '#e04f5f', '#c4404f');
  poly([P(x + 0.06, y + 0.06, wh + 4), P(x + w - 0.06, y + 0.06, wh + 4), P(x + w - 0.06, y + h - 0.06, wh + 4), P(x + 0.06, y + h - 0.06, wh + 4)], '#d8d2c6');
  prism(x + 0.9, y + 0.3, 0.3, 0.3, wh + 4, wh + 12, '#b9c2c9', '#a3acb3', '#8d969d');
  const sp = P(x + w * 0.45, y + h * 0.6, wh + 20);
  line(P(x + w * 0.45, y + h * 0.6, wh + 4), [sp[0], sp[1] + 8], '#777', 2);
  signBoard(sp, 'DINER', '#2b2140', '#ff6fb0', '700 11px Fredoka, sans-serif');
  addGlow(sp[0], sp[1], 26);
  factoryBubble(e, 74);
}

function drawFlowers(e) {
  const x = e.x + 0.14, y = e.y + 0.14, w = 0.72;
  prism(x, y, w, w, 0, 5, '#5c3d24', '#8a6a48', '#735638');
  const cols = ['#ff6b8a', '#ffd23f', '#ffffff', '#b07cff', '#ff9f43', '#ff4f6d'];
  const sd = e.s || 7;
  for (let k = 0; k < 9; k++) {
    const u = 0.2 + (k % 3) * 0.3 + (hash2(sd, k, 1) - 0.5) * 0.12, v = 0.2 + Math.floor(k / 3) * 0.3 + (hash2(sd, k, 2) - 0.5) * 0.12;
    const p = P(x + u * w, y + v * w, 5);
    const sw = THUMB ? 0 : Math.sin(T * 2 + k + e.x) * 0.8;
    line(p, [p[0] + sw, p[1] - 6], '#4f9a3a', 1.2);
    circle(p[0] + sw, p[1] - 7, 2.6, cols[(sd + k) % cols.length]);
    circle(p[0] + sw, p[1] - 7, 0.9, '#fff3a0');
  }
}
function drawBench(e) {
  const x = e.x, y = e.y;
  ellipse(...P(x + 0.55, y + 0.55), 16, 6, 'rgba(0,0,0,.15)');
  for (const u of [0.25, 0.75]) prism(x + u - 0.03, y + 0.45, 0.06, 0.2, 0, 7, '#3d3d3d', '#333', '#2a2a2a');
  prism(x + 0.2, y + 0.42, 0.6, 0.26, 7, 9, '#c58b52', '#a87442', '#8f6236');
  prism(x + 0.2, y + 0.38, 0.6, 0.05, 9, 18, '#c58b52', '#b07a45', '#8f6236');
}
function drawLamp(e) {
  const x = e.x + 0.46, y = e.y + 0.46;
  ellipse(...P(x + 0.04, y + 0.04), 6, 2.5, 'rgba(0,0,0,.2)');
  prism(x - 0.04, y - 0.04, 0.16, 0.16, 0, 4, '#4a5866', '#3d4a57', '#33404c');
  prism(x, y, 0.08, 0.08, 4, 40, '#3d4a57', '#33404c', '#2a3540');
  const on = nightAmt > 0.08;
  prism(x - 0.06, y - 0.06, 0.2, 0.2, 40, 49, '#3d4a57', on ? '#ffe28a' : '#e9eef2', on ? '#f5c95a' : '#cdd6dd');
  hipRoof(x - 0.08, y - 0.08, 0.24, 0.24, 49, 6, '#2a3540', '#232d36', '#33404c', 0.02);
  const g = P(x + 0.04, y + 0.04, 45);
  addGlow(g[0], g[1], 48);
}
function drawFountain(e) {
  const x = e.x, y = e.y;
  groundShadow(x + 0.15, y + 0.15, 1.7, 1.7, 0.2);
  prism(x + 0.15, y + 0.15, 1.7, 1.7, 0, 10, '#d6dce1', '#bcc4cb', '#a2abb3');
  const wp = [P(x + 0.28, y + 0.28, 9), P(x + 1.72, y + 0.28, 9), P(x + 1.72, y + 1.72, 9), P(x + 0.28, y + 1.72, 9)];
  poly(wp, WATER_SHALLOW[(T * 3 | 0) % 8]);
  const c = P(x + 1, y + 1, 9);
  for (let k = 0; k < 3; k++) {
    const r = ((T * 0.6 + k / 3) % 1);
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - r)})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(c[0], c[1], 8 + r * 34, (8 + r * 34) / 2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  prism(x + 0.88, y + 0.88, 0.24, 0.24, 9, 26, '#e4e9ed', '#c7ced4', '#adb5bc');
  prism(x + 0.7, y + 0.7, 0.6, 0.6, 26, 30, '#7fd3ef', '#c7ced4', '#adb5bc');
  const top = P(x + 1, y + 1, 34);
  if (!THUMB) {
    for (let k = 0; k < 14; k++) {
      const ph = (T * 1.1 + k / 14) % 1, a = k * 2.399;
      const dx = Math.cos(a) * ph * 26, dy = Math.sin(a) * ph * 13;
      const z = 14 * ph - 30 * ph * ph;
      circle(top[0] + dx, top[1] + dy - z - 4, 1.4, 'rgba(200,240,255,.9)');
    }
  }
  circle(top[0], top[1] - 4, 2.5, 'rgba(220,248,255,.95)');
}
function drawStatue(e) {
  const x = e.x, y = e.y;
  groundShadow(x + 0.2, y + 0.2, 0.6, 0.6, 0.3);
  prism(x + 0.15, y + 0.15, 0.7, 0.7, 0, 6, '#e1dccf', '#c9c3b5', '#b0aa9c');
  prism(x + 0.25, y + 0.25, 0.5, 0.5, 6, 20, '#ddd7ca', '#c2bcae', '#a9a294');
  prism(x + 0.4, y + 0.4, 0.2, 0.2, 20, 42, '#6fae9f', '#5f9e8f', '#4f8a7c');
  const hp = P(x + 0.5, y + 0.5, 47); circle(hp[0], hp[1], 4.5, '#6fae9f');
  const sh = P(x + 0.55, y + 0.5, 38);
  line(sh, [sh[0] + 6, sh[1] - 16], '#5f9e8f', 3);
  circle(sh[0] + 6, sh[1] - 19, 3, '#ffd23f');
  addGlow(sh[0] + 6, sh[1] - 19, 20);
}

function drawPerson(w) {
  if (w.kind === 'van') { drawVan(w); return; }
  const ox = w.ox || 0, oy = w.oy || 0;
  const [sx, sy] = P(w.x + 0.5 + ox, w.y + 0.5 + oy);
  const sw = w.moving ? Math.sin(w.ph) * 3 : 0;
  const bob = w.moving ? Math.abs(Math.cos(w.ph)) * 1 : 0;
  ctx.globalAlpha = w.alpha == null ? 1 : w.alpha;
  ellipse(sx, sy, 5, 2.2, 'rgba(0,0,0,.25)');
  ctx.lineCap = 'round';
  ctx.strokeStyle = w.pants; ctx.lineWidth = 2.4; ctx.beginPath();
  ctx.moveTo(sx - 1.5, sy - 8); ctx.lineTo(sx - 1.5 + sw, sy - 0.8);
  ctx.moveTo(sx + 1.5, sy - 8); ctx.lineTo(sx + 1.5 - sw, sy - 0.8); ctx.stroke();
  ctx.strokeStyle = w.shirt; ctx.lineWidth = 2; ctx.beginPath();
  if (w.working) {
    const a = Math.sin(T * 14) * 3;
    ctx.moveTo(sx - 3.5, sy - 15); ctx.lineTo(sx - 5, sy - 10 + a);
    ctx.moveTo(sx + 3.5, sy - 15); ctx.lineTo(sx + 5, sy - 10 - a);
  } else {
    ctx.moveTo(sx - 3.5, sy - 15 - bob); ctx.lineTo(sx - 4 - sw * 0.7, sy - 9 - bob);
    ctx.moveTo(sx + 3.5, sy - 15 - bob); ctx.lineTo(sx + 4 + sw * 0.7, sy - 9 - bob);
  }
  ctx.stroke();
  rr(sx - 4, sy - 17 - bob, 8, 10, 3, w.shirt);
  circle(sx, sy - 20.5 - bob, 3.6, w.skin);
  ctx.fillStyle = w.hair; ctx.beginPath(); ctx.arc(sx, sy - 21.2 - bob, 3.8, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  if (w.hat) drawHat(w.hat, sx, sy - 23 - bob);
  ctx.globalAlpha = 1;
  if (w.bubble) addBubble({ x: sx, y: sy - 36, icon: w.bubble, small: true });
}

function drawHat(h, x, y) {
  switch (h) {
    case 'straw': ellipse(x, y + 0.5, 6.5, 1.8, '#e8c35a'); ctx.fillStyle = '#e2b84a'; ctx.beginPath(); ctx.arc(x, y + 0.5, 3.4, Math.PI, 0); ctx.fill(); line([x - 3.3, y - 0.2], [x + 3.3, y - 0.2], '#c0392b', 1); break;
    case 'cowboy': ellipse(x, y + 0.5, 6.5, 1.6, '#8a5a34'); rr(x - 3.2, y - 3.5, 6.4, 4.2, 1.5, '#7a4e2c'); break;
    case 'hard': ctx.fillStyle = '#ffb000'; ctx.beginPath(); ctx.arc(x, y + 0.8, 4, Math.PI, 0); ctx.fill(); rr(x - 5, y + 0.2, 10, 1.6, 0.8, '#f0a000'); break;
    case 'top': ellipse(x, y + 0.6, 5.5, 1.4, '#222'); rr(x - 3, y - 5, 6, 5.6, 1, '#2a2a2a'); line([x - 3, y - 0.6], [x + 3, y - 0.6], '#c0392b', 1.1); break;
    case 'cap': case 'capb': { const c = h === 'cap' ? '#e53935' : '#1e88e5'; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + 1, 3.8, Math.PI, 0); ctx.fill(); rr(x, y + 0.2, 5.5, 1.4, 0.7, c); break; }
  }
}
function drawVan(w) {
  const cx = w.x + 0.5, cy = w.y + 0.5;
  const alongX = Math.abs(w.dx || 1) >= Math.abs(w.dy || 0);
  ctx.globalAlpha = w.alpha == null ? 1 : w.alpha;
  const [sx, sy] = P(cx, cy);
  ellipse(sx + 2, sy + 1, 14, 6, 'rgba(0,0,0,.25)');
  const L = 0.34, W = 0.17;
  const bx = alongX ? cx - L : cx - W, by = alongX ? cy - W : cy - L, bw = alongX ? L * 2 : W * 2, bh = alongX ? W * 2 : L * 2;
  const body = w.color || '#e74c3c';
  prism(bx, by, bw, bh, 2, 15, '#f6f6f6', shade(body, 0), shade(body, -0.2));

  const fwd = alongX ? (w.dx || 1) > 0 : (w.dy || 1) > 0;
  if (alongX && fwd) faceR(bx, by, bw, bh, 0.15, 0.85, 8, 13, '#9fd8f2');
  else if (!alongX && fwd) faceL(bx, by, bw, bh, 0.15, 0.85, 8, 13, '#9fd8f2');
  else if (alongX) faceL(bx, by, bw, bh, 0.05, 0.3, 8, 13, '#9fd8f2');
  else faceR(bx, by, bw, bh, 0.05, 0.3, 8, 13, '#9fd8f2');
  if (alongX) faceL(bx, by, bw, bh, 0.35, 0.8, 5, 11, '#ffffff'); else faceR(bx, by, bw, bh, 0.35, 0.8, 5, 11, '#ffffff');
  for (const [u, v] of alongX ? [[0.2, 1], [0.8, 1]] : [[1, 0.2], [1, 0.8]]) { const p = P(bx + u * bw, by + v * bh, 2); circle(p[0], p[1], 2.3, '#2b2b2b'); }
  ctx.globalAlpha = 1;
  if (w.bubble) addBubble({ x: sx, y: sy - 30, icon: w.bubble, small: true });
}

const natSprites = new Map(), SPR_RES = 0.8, SPR_HI = 2, SPR_Z = 0.72;
const NAT_SPR_CODE = { tree: 0, rock: 1, bush: 2 };
function natLook(t, v, s) {
  if (t === 'tree') return [v === 2 ? 15 + (s % 3) * 37 : 15, 0.85 + (s % 37) / 100];
  if (t === 'rock') return [(s % 12) * 10, 1];
  return [(s % 6) * 10 + 5, 1];
}
function natSprite(t, v, look, hi) {
  const res = hi ? SPR_HI : SPR_RES;
  const key = (((NAT_SPR_CODE[t] || 0) * 16 + (v || 0)) * 4096 + look) * 2 + (hi ? 1 : 0);
  let c = natSprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  const W = 96, H = 100, ox = 48, oy = 84;
  c.width = Math.ceil(W * res); c.height = Math.ceil(H * res); c.res = res;
  const prev = ctx; ctx = c.getContext('2d');
  ctx.setTransform(res, 0, 0, res, ox * res, oy * res);
  const th = THUMB; THUMB = true;
  const z = cam.z; cam.z = 1;
  const fake = { x: -0.5, y: -0.5, w: 1, h: 1, v, s: look, id: 0 };
  if (t === 'tree') drawTree(0, 0, v, look, 0);
  else if (t === 'rock') { fake.y = -0.55; drawRock(fake); }
  else drawBush(fake);
  cam.z = z; THUMB = th; ctx = prev;
  c.ox = ox; c.oy = oy;
  natSprites.set(key, c);
  return c;
}

function blitNature(x, y, t, v, s, hi, sway) {
  const [look, scale] = natLook(t, v, s), c = natSprite(t, v, look, hi), [sx, sy] = P(x + 0.5, y + 0.5);
  const w = c.width / c.res * scale, h = c.height / c.res * scale;
  if (sway) { ctx.save(); ctx.transform(1, 0, sway, 1, -sway * sy, 0); ctx.drawImage(c, sx - c.ox * scale, sy - c.oy * scale, w, h); ctx.restore(); }
  else ctx.drawImage(c, sx - c.ox * scale, sy - c.oy * scale, w, h);
}
const useSprite = (e) => !THUMB && !e.dying;
function drawNatE(e) {
  const near = cam.z >= SPR_Z, sway = near && e.t !== 'rock' ? Math.sin(T * (e.t === 'tree' ? 1.3 : 1.6) + (e.id || 0) * 1.37) * (e.t === 'tree' ? 0.018 : 0.012) : 0;
  blitNature(e.x, e.y, e.t, e.v || 0, e.s || 0, near, sway);
}
const DRAW = {
  field: drawCrops,
  tree: (e) => useSprite(e) ? drawNatE(e) : drawTree(e.x + 0.5, e.y + 0.5, e.v || 0, e.s || 0, e.id || 0),
  dtree: (e) => drawTree(e.x + 0.5, e.y + 0.5, 0, (e.s || 0) % 20 + 20, e.id || 0, 1.12),
  rock: (e) => useSprite(e) ? drawNatE(e) : drawRock(e),
  bush: (e) => useSprite(e) ? drawNatE(e) : drawBush(e),
  house: (e) => drawHouse(e, { wallH: 24, roofH: 20 }),
  cottage: (e) => drawHouse(e, { wallH: 22, roofH: 28, ry: true }),
  villa: drawVilla, apartment: drawApartment,
  barn: drawBarn, market: drawMarket, townhall: drawTownHall, windmill: drawWindmill,
  bakery: drawBakery, snack: drawSnack, diner: drawDiner,
  flowers: drawFlowers, bench: drawBench, lamp: drawLamp, fountain: drawFountain, statue: drawStatue,
};

function rotProxy(e) {
  if (!e.flip) return e;
  const b = BUILD[e.t]; if (!b || (e.w === b.w && e.h === b.h)) return e;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  return Object.assign({}, e, { w: b.w, h: b.h, x: cx - b.w / 2, y: cy - b.h / 2 });
}
function drawEnt(e) {
  const d = DRAW[e.t]; if (!d) return;
  let s = 1, a = 1, shx = 0;
  if (e.born && NOW - e.born < 500) s = easeOutBack(clamp((NOW - e.born) / 500, 0, 1)) * 0.4 + 0.6;
  if (e.dying) {
    if (NOW < e.dying) shx = Math.sin(NOW / 25) * 2.5;
    else { const k = clamp((NOW - e.dying) / 450, 0, 1); s = 1 - k * 0.5; a = 1 - k; }
  }
  if (e.build) { drawConstruction(e); return; }
  if (e.fire && e.fire > NOW && !THUMB) {
    if (Math.random() < DT * 10) { const p = P(e.x + rand(0.2, e.w - 0.2), e.y + rand(0.2, e.h - 0.2), rand(20, 50)); spawn({ type: 'dot', x: p[0], y: p[1], vx: rand(-6, 6), vy: rand(-40, -20), g: -10, life: 0.7, max: 0.7, r: rand(2, 4), c: pick(['#ff9800', '#ff5722', '#ffeb3b']) }); }
    bubbleAt(e, (BUILD[e.t].ht || 40) + 20, { icon: '🔥' });
  }
  if (e.flip) {
    const [fx] = P(e.x + e.w / 2, e.y + e.h / 2);
    ctx.save(); ctx.translate(fx, 0); ctx.scale(-1, 1); ctx.translate(-fx, 0);

    const c = ctx, base = CanvasRenderingContext2D.prototype.fillText;
    c.fillText = function (t, x, y, m) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); if (m == null) base.call(c, t, x, y); else base.call(c, t, x, y, m); c.restore(); };
  }
  if (s !== 1 || a !== 1 || shx) {
    const [bx, by] = P(e.x + e.w / 2, e.y + e.h / 2);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(bx + shx, by); ctx.scale(s, s); ctx.translate(-bx, -by); d(rotProxy(e)); ctx.restore();
  } else d(rotProxy(e));
  if (e.flip) { delete ctx.fillText; ctx.restore(); }
  if (e.lvl > 1 && !THUMB) drawLvlStars(e);
}
function depthOf(o) { return o.isCar ? o.x + o.y + 1.05 : o.isW ? o.x + o.y + 1 + (o.ox || 0) + (o.oy || 0) : o.x + o.y + (o.w + o.h) / 2; }

function drawPlacement() {
  const g = ghostPos(); if (!g) return;
  const b = BUILD[mode.t], ign = mode.ent ? mode.ent.id : -1, [W, H] = placeDims();
  const ok = placeOK(mode.t, g[0], g[1], ign, W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const tok = b.place === 'water' ? ok : canPlace(g[0] + i, g[1] + j, 1, 1, ign);
    poly(diamond(g[0] + i, g[1] + j), tok ? 'rgba(110,230,90,.45)' : 'rgba(240,70,60,.5)');
  }
  poly(diamond(g[0], g[1], W, H), null, ok ? '#e4ffd0' : '#ffd0c8', 2);
}
function drawGhost() {
  const g = ghostPos(); if (!g) return;
  const b = BUILD[mode.t];
  const [W, H] = placeDims();
  const e = Object.assign(mode.ent ? Object.assign({}, mode.ent) : newEntity(mode.t, g[0], g[1], { id: 0, s: 30, v: 0 }), { x: g[0], y: g[1], w: W, h: H, flip: !!mode.rot, born: 0, dying: 0 });
  ctx.save(); ctx.globalAlpha = 0.72; THUMB = true;
  const bob = Math.sin(T * 5) * 2; ctx.translate(0, -4 + bob);
  if (e.flip) { const [fx] = P(e.x + e.w / 2, e.y + e.h / 2); ctx.translate(fx, 0); ctx.scale(-1, 1); ctx.translate(-fx, 0); }
  if (FLAT[e.t]) FLAT[e.t](e); else { const pe = rotProxy(e); if (e.t === 'field') drawSoil(pe); if (DRAW[e.t]) DRAW[e.t](pe); }
  THUMB = false; ctx.restore();
  void b;
}

function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.g) p.vy += p.g * dt;
    if (p.rot != null) p.rot += (p.vr || 3) * dt;
  }
  if (parts.length > 600) parts.splice(0, parts.length - 600);
}
function drawParticles(text) {
  for (const p of parts) {
    if ((p.type === 'text') !== text) continue;
    const a = clamp(p.life / p.max, 0, 1);
    switch (p.type) {
      case 'smoke': ctx.fillStyle = `rgba(235,235,235,${a * 0.5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (1 - a) * 2.4), 0, Math.PI * 2); ctx.fill(); break;
      case 'dot': ctx.globalAlpha = a; circle(p.x, p.y, p.r, p.c); ctx.globalAlpha = 1; break;
      case 'fish': {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -2.5); ctx.lineTo(-8, 2.5); ctx.closePath(); ctx.fill();
        ctx.restore(); break;
      }
      case 'leaf':
      case 'confetti':
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.c;
        if (p.type === 'leaf') { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore(); break;
      case 'spark': {
        const r = p.r * Math.sin(a * Math.PI);
        ctx.fillStyle = `rgba(255,248,190,${a})`; ctx.beginPath();
        ctx.moveTo(p.x, p.y - r * 2); ctx.lineTo(p.x + r * 0.5, p.y - r * 0.5); ctx.lineTo(p.x + r * 2, p.y); ctx.lineTo(p.x + r * 0.5, p.y + r * 0.5);
        ctx.lineTo(p.x, p.y + r * 2); ctx.lineTo(p.x - r * 0.5, p.y + r * 0.5); ctx.lineTo(p.x - r * 2, p.y); ctx.lineTo(p.x - r * 0.5, p.y - r * 0.5); ctx.closePath(); ctx.fill();
        break;
      }
      case 'text': {
        const k = Math.max(1, 0.8 / cam.z);
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.font = `700 ${Math.round((p.size || 15) * k)}px Fredoka, ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4 * k; ctx.strokeStyle = 'rgba(60,35,10,.75)'; ctx.lineJoin = 'round';
        ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.c || '#fff'; ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1; break;
      }
    }
  }
}
function floatText(wx, wy, text, c, size) { spawn({ type: 'text', x: wx, y: wy, vx: 0, vy: -34, life: 1.4, max: 1.4, text, c: c || '#ffffff', size }); }
function burst(wx, wy, n, colors, type, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(0.4, 1) * (speed || 60);
    spawn({ type: type || 'dot', x: wx, y: wy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - (speed || 60) * 0.6, g: 160, life: rand(0.6, 1.1), max: 1.1, r: rand(1.5, 3.2), c: pick(colors), rot: Math.random() * 6, vr: rand(-8, 8) });
  }
}
function initClouds() {
  clouds.length = 0;
  for (let i = 0; i < 8; i++) clouds.push({ x: cam.x + rand(-2000, 2000), y: cam.y + rand(-1400, 1400), s: rand(0.8, 1.6), v: rand(6, 14) });
}
function updateClouds(dt) {
  for (const c of clouds) { c.x += c.v * dt; if (c.x > cam.x + 2400 || c.x < cam.x - 2600 || Math.abs(c.y - cam.y) > 1800) { c.x = cam.x - 2400; c.y = cam.y + rand(-1400, 1400); } }
}
const PUFFS = [[0, 0, 1], [-38, 6, 0.75], [36, 8, 0.8], [-14, -14, 0.8], [18, -10, 0.7]];
function drawClouds() {
  const fade = clamp(1.45 - cam.z, 0, 1) * 0.6;
  for (const c of clouds) {
    ctx.fillStyle = 'rgba(10,30,50,.07)';
    for (const [dx, dy, r] of PUFFS) { ctx.beginPath(); ctx.ellipse(c.x + dx * c.s, c.y + dy * c.s * 0.5, 34 * r * c.s, 16 * r * c.s, 0, 0, Math.PI * 2); ctx.fill(); }
    if (fade > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      for (const [dx, dy, r] of PUFFS) { ctx.beginPath(); ctx.ellipse(c.x + dx * c.s - 80, c.y + dy * c.s - 260, 34 * r * c.s, 22 * r * c.s, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}

function drawBubbles() {
  const k = Math.max(1, 0.8 / cam.z);
  for (const b of bubbles) {
    if (b.type === 'bar') {
      const w = 30 * k, h = 6 * k;
      rr(b.x - w / 2, b.y - h / 2, w, h, h / 2, 'rgba(40,25,10,.55)');
      if (b.p > 0.02) rr(b.x - w / 2 + 1, b.y - h / 2 + 1, (w - 2) * b.p, h - 2, (h - 2) / 2, b.color || '#7ddb4a');
      continue;
    }
    const r = (b.small ? 10 : 14) * k;
    const bob = Math.sin(T * 3 + (b.x + b.y) * 0.01) * 2 * k;
    const x = b.x, y = b.y + bob;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + 1.5 * k, y + 2 * k, r, r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.moveTo(x - 4 * k, y + r - 2 * k); ctx.lineTo(x, y + r + 6 * k); ctx.lineTo(x + 4 * k, y + r - 2 * k); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8c88a'; ctx.lineWidth = 2 * k; ctx.stroke();
    ctx.font = `${Math.round(r * 1.15)}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.icon, x, y + 1 * k);
    if (b.count > 1) {
      circle(x + r * 0.8, y - r * 0.8, 6.5 * k, '#ef6351');
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(9 * k)}px Fredoka, sans-serif`; ctx.fillText(b.count, x + r * 0.8, y - r * 0.8 + 0.5);
    }
  }
}

function computeNight() {
  if (!S || !S.daynight) return 0;
  const ph = (NOW / 1000 % DAY_LEN) / DAY_LEN;
  const v = Math.cos((ph - 0.75) * Math.PI * 2);
  return clamp((v - 0.2) / 0.8, 0, 1) * 0.42 + (S.wx && S.wx.type === 'storm' ? 0.08 : 0);
}
function render() {
  nightAmt = computeNight();
  glows.length = 0; bubbles.length = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, VW, VH);
  setWorldTransform();
  const vr = visibleRange();
  if (typeof lastVR !== 'undefined') lastVR = vr;
  streamChunks(vr, 5);
  if (cam.z <= 0.6 && typeof drawGroundCached === 'function') drawGroundCached(vr); else drawGround(vr);

  const objs = [];
  const farNat = cam.z < NAT_Z;
  for (const e of (typeof visibleEnts === 'function' ? visibleEnts(vr) : world.ents.values())) {
    if (e.x > vr.x1 || e.y > vr.y1 || e.x + e.w < vr.x0 || e.y + e.h < vr.y0) continue;
    if (e.moving || (farNat && NAT_CODE[e.t] != null)) continue;
    if (FLAT[e.t]) FLAT[e.t](e);
    else { if (e.t === 'field') drawSoil(e); objs.push(e); }
  }

  if (hoverTile && mode.type !== 'place' && isUnlocked(hoverTile[0], hoverTile[1])) {
    const he = entAt(hoverTile[0], hoverTile[1]);
    const plantable = mode.type === 'plant' && he && he.t === 'field' && !he.crop;
    poly(diamond(hoverTile[0], hoverTile[1]), plantable ? 'rgba(255,250,170,.3)' : 'rgba(255,255,255,.12)', 'rgba(255,255,255,.55)', 1.5);
  }
  drawOverlay(vr);
  if (mode.type === 'place') drawPlacement();
  for (const w of walkers) if (w.x >= vr.x0 - 1 && w.x <= vr.x1 && w.y >= vr.y0 - 1 && w.y <= vr.y1) objs.push(w);
  if (S.workers) for (const w of S.workers) if (w.x >= vr.x0 - 1 && w.x <= vr.x1 && w.y >= vr.y0 - 1 && w.y <= vr.y1) objs.push(w);
  if (typeof cars !== 'undefined') for (const c of cars) if (c.x >= vr.x0 - 1 && c.x <= vr.x1 && c.y >= vr.y0 - 1 && c.y <= vr.y1) objs.push(c);
  objs.sort((a, b) => depthOf(a) - depthOf(b));
  for (const o of objs) { if (o.isCar) drawCar(o); else if (o.isW) drawPerson(o); else drawEnt(o); }
  drawVehicles();
  if (typeof drawEditOverlay === 'function') drawEditOverlay();
  if (typeof drawLife === 'function') drawLife(vr);
  if (mode.type === 'place') drawGhost();
  drawParticles(false);
  if (typeof drawCityLabels === 'function') drawCityLabels();
  drawClouds();

  if (nightAmt > 0.01) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(14,22,70,${nightAmt})`; ctx.fillRect(0, 0, VW, VH);
    setWorldTransform();
    ctx.globalCompositeOperation = 'lighter';
    const k = nightAmt / 0.42;

    const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    soft.addColorStop(0, `rgba(255,190,100,${0.16 * k})`); soft.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = soft;
    for (const [x, y, r, s] of glows) if (s) { ctx.setTransform(cam.z * dpr * r, 0, 0, cam.z * dpr * r, (VW / 2 + (x - cam.x) * cam.z) * dpr, (VH / 2 + (y - cam.y) * cam.z) * dpr); ctx.fillRect(-1, -1, 2, 2); }
    setWorldTransform();

    for (const [x, y, r, s] of glows) {
      if (s) continue;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,196,110,${0.42 * k})`); g.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawWeatherFX();
  drawParticles(true);
  drawBubbles();
}

function makeThumb(t) {
  const b = BUILD[t];
  const size = 120, c = document.createElement('canvas');
  c.width = c.height = size * 2;
  const prev = ctx;
  ctx = c.getContext('2d');
  THUMB = true;
  const savedNight = nightAmt; nightAmt = 0;
  const e = newEntity(t, 0, 0, { id: 1, s: 33, v: 0 });
  if (t === 'field') { e.crop = 'wheat'; e.pt = 0; }
  const ht = b.ht || 16;
  const fw = (b.w + b.h) * HW, fh = (b.w + b.h) * HH + ht + 10;
  const sc = Math.min((size * 2 * 0.9) / fw, (size * 2 * 0.86) / fh);
  const cxw = ((b.w - b.h) / 2) * HW, cyw = ((b.w + b.h) * HH - ht) / 2;
  ctx.setTransform(sc, 0, 0, sc, size - cxw * sc, size - cyw * sc + 4);
  poly(diamond(0, 0, b.w, b.h), '#8fd06a');
  poly([P(0, b.h), P(b.w, b.h), P(b.w, b.h, -6), P(0, b.h, -6)], '#b98b55');
  poly([P(b.w, 0), P(b.w, b.h), P(b.w, b.h, -6), P(b.w, 0, -6)], '#9c7140');
  if (FLAT[t]) FLAT[t](e);
  else { if (t === 'field') drawSoil(e); if (DRAW[t]) DRAW[t](e); }
  THUMB = false; nightAmt = savedNight;
  ctx = prev;
  return c.toDataURL();
}
