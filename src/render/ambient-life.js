const birds = [];
let birdTimer = 4, fishTimer = 2;

function updateLife(dt) {
  if (dt <= 0) return;
  birdTimer -= dt;
  if (birdTimer <= 0) {
    birdTimer = rand(10, 22);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const halfW = VW / 2 / cam.z;
    const n = 3 + randi(4);
    birds.push({
      x: cam.x - dir * (halfW + 120), y: cam.y + rand(-VH / 3, VH / 3) / cam.z,
      vx: dir * rand(55, 85), vy: rand(-12, 12), n, ph: Math.random() * 6, life: 40,
      offs: Array.from({ length: n }, (_, i) => [-(Math.ceil(i / 2)) * 14 * dir, (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 9]),
    });
  }
  for (let i = birds.length - 1; i >= 0; i--) {
    const b = birds[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) birds.splice(i, 1);
  }
  fishTimer -= dt;
  if (fishTimer <= 0) {
    fishTimer = rand(1.2, 3);
    const vr = visibleRange();
    for (let k = 0; k < 8; k++) {
      const x = vr.x0 + randi(Math.max(1, vr.x1 - vr.x0)), y = vr.y0 + randi(Math.max(1, vr.y1 - vr.y0));
      if (!isWater(x, y)) continue;
      const p = P(x + 0.5, y + 0.5);
      const dirx = Math.random() < 0.5 ? -1 : 1;
      spawn({ type: 'fish', x: p[0], y: p[1], vx: dirx * rand(14, 22), vy: -48, g: 130, life: 0.72, max: 0.72, c: pick(['#ff9f43', '#7fc8f8', '#c0c8d0']) });
      for (let j = 0; j < 6; j++) spawn({ type: 'dot', x: p[0], y: p[1], vx: rand(-20, 20), vy: rand(-30, -10), g: 120, life: 0.5, max: 0.5, r: 1.3, c: '#ffffff' });
      break;
    }
  }
}
function drawLife(vr) {

  if (nightAmt < 0.2 && cam.z > 0.55) {
    const cols = ['#ff7eb6', '#ffd23f', '#8fd3ff', '#b28dff', '#ffffff'];
    for (const e of world.ents.values()) {
      if (e.t !== 'flowers' || e.x < vr.x0 || e.x > vr.x1 || e.y < vr.y0 || e.y > vr.y1) continue;
      const t = T * 0.9 + e.id;
      const [cx, cy] = P(e.x + 0.5, e.y + 0.5, 16);
      const x = cx + Math.sin(t) * 13, y = cy + Math.sin(t * 2) * 5 - Math.abs(Math.sin(t * 3)) * 5;
      const f = Math.abs(Math.sin(T * 16 + e.id)) * 2.6 + 0.4;
      const c = cols[e.id % cols.length];
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.ellipse(x - f * 0.8, y, f, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + f * 0.8, y, f, 2.2, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillRect(x - 0.4, y - 1.5, 0.8, 3);
    }
  }

  for (const b of birds) {
    for (let i = 0; i < b.n; i++) {
      const [ox, oy] = b.offs[i];
      const x = b.x + ox, y = b.y + oy;
      ellipse(x + 30, y + 40, 3, 1.2, 'rgba(10,30,20,.12)');
      const flap = Math.sin(T * 9 + b.ph + i) * 3;
      const by = y - 70;
      ctx.strokeStyle = nightAmt > 0.2 ? '#20202a' : '#3a3a44'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 5, by - flap); ctx.quadraticCurveTo(x - 2.5, by - 2, x, by); ctx.quadraticCurveTo(x + 2.5, by - 2, x + 5, by - flap); ctx.stroke();
    }
  }
}
