function drawArt(e) {
  const b = BUILD[e.t], a = b.art;
  const pal = a.pals ? a.pals[(e.v || 0) % a.pals.length] : null;
  if (a.lawn) poly(diamond(e.x + 0.05, e.y + 0.05, e.w - 0.1, e.h - 0.1), a.lawn);
  if (a.plaza) {
    poly(diamond(e.x + 0.05, e.y + 0.05, e.w - 0.1, e.h - 0.1), a.plaza);
    ctx.strokeStyle = 'rgba(150,130,100,.25)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 1; k < e.w * 2; k++) { const p = P(e.x + k / 2, e.y + 0.05), q = P(e.x + k / 2, e.y + e.h - 0.05); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    for (let k = 1; k < e.h * 2; k++) { const p = P(e.x + 0.05, e.y + k / 2), q = P(e.x + e.w - 0.05, e.y + k / 2); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    ctx.stroke();
  }
  let top = 0;
  for (const bl of a.blocks) if (!bl.z0) groundShadow(e.x + bl.x, e.y + bl.y, bl.w, bl.h, 0.25 + bl.z / 110);
  a.blocks.forEach((bl, i) => { drawBlock(e, bl, pal, a, i); top = Math.max(top, bl.z + (bl.roof === 'flat' || bl.roof === 'green' ? 4 : bl.rh || 16)); });
  if (a.fx && ART_FX[a.fx]) top = Math.max(top, ART_FX[a.fx](e, a, pal) || 0);
  if (a.chimney && a.blocks[0]) {
    const bl = a.blocks[0], [cx, cy] = a.chimney, rh = bl.rh || 16;
    prism(e.x + cx, e.y + cy, 0.16, 0.16, bl.z + rh * 0.3, bl.z + rh + 6, '#b06048', '#9a4f3a', '#7f3e2d');
    if (a.smoke !== 'job' || e.job) smokeAt(P(e.x + cx + 0.08, e.y + cy + 0.08, bl.z + rh + 8), a.smoke === 'job' ? 2.5 : 0.8, a.smoke === 'job');
  }
  if (a.sign) {
    const sp = P(e.x + e.w / 2, e.y + e.h / 2, top + 14);
    line(P(e.x + e.w / 2, e.y + e.h / 2, top - 2), [sp[0], sp[1] + 9], '#666', 2);
    circle(sp[0], sp[1], 11, '#ffffff');
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sp[0], sp[1], 11, 0, Math.PI * 2); ctx.stroke();
    emojiAt([sp[0], sp[1] + 1], a.sign, 13);
    top += 26;
  }
  if (a.text && a.blocks[0]) {
    const bl = a.blocks[0];
    const sp = P(e.x + bl.x + bl.w / 2, e.y + bl.y + bl.h, bl.z - 5);
    signBoard(sp, a.text, a.textBg || '#5b3b1f', '#ffffff', '700 9px Fredoka, sans-serif');
  }
  if (b.rent) rentBubble(e, top + 16);
  if (FACTORY_TYPES.includes(e.t)) factoryBubble(e, top + 18);
}
function drawBlock(e, bl, pal, a, i) {
  const x = e.x + bl.x, y = e.y + bl.y, w = bl.w, h = bl.h, z0 = bl.z0 || 0, z = bl.z;
  let wall = bl.wall || (pal && pal.wall) || '#eeeeee';
  if (bl.alt) wall = shade(wall, -0.07);
  const wallR = shade(wall, -0.13);
  const rc = bl.rc || (pal && pal.roof) || '#b0503a';
  const base = z0 + (z0 ? 0 : 4);
  if (bl.open) {
    prism(x - 0.04, y - 0.04, w + 0.08, h + 0.08, 0, 3, '#e8e0d0', '#cfc6b4', '#b8af9d');
    for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) prism(x + u * (w - 0.08), y + v * (h - 0.08), 0.08, 0.08, 3, z, null, wall, wallR);
    line(P(x, y + h, z - 2), P(x + w, y + h, z - 2), wall, 2);
  } else {
    if (!z0) foundation(x, y, w, h);
    prism(x, y, w, h, base, z, null, wall, wallR);
    drawWindows(x, y, w, h, base, z, bl, wall, rc);
  }
  if (i === 0 && a.awn) awningL(x, y, w, h, 0.04, bl.win === 'shop' ? 0.48 : 0.96, base + Math.min(22, (z - base) * 0.8), 0.22, 6, a.awn[0], a.awn[1]);
  const rh = bl.rh || 16;
  switch (bl.roof) {
    case 'gx': gableRoofX(x, y, w, h, z, rh, rc, shade(rc, -0.12), wallR); break;
    case 'gy': gableRoofY(x, y, w, h, z, rh, shade(rc, -0.15), shade(rc, -0.05), wall); break;
    case 'hip': hipRoof(x, y, w, h, z, rh, rc, shade(rc, -0.18), shade(rc, 0.12)); break;
    case 'flat': case 'green': {
      prism(x - 0.03, y - 0.03, w + 0.06, h + 0.06, z, z + 3, shade(rc, 0.3), shade(wall, -0.22), shade(wall, -0.32));
      const top = bl.roof === 'green' ? '#6cbf4a' : rc;
      poly([P(x + 0.08, y + 0.08, z + 3), P(x + w - 0.08, y + 0.08, z + 3), P(x + w - 0.08, y + h - 0.08, z + 3), P(x + 0.08, y + h - 0.08, z + 3)], top);
      if (bl.roof === 'green') for (let k = 0; k < 5; k++) { const p = P(x + 0.2 + (k % 3) * (w - 0.4) / 2, y + 0.25 + Math.floor(k / 3) * (h - 0.5), z + 3); circle(p[0], p[1] - 3, 4, '#4f9d3c'); circle(p[0] - 1, p[1] - 5, 2, '#88cf5e'); }
      break;
    }
    case 'dome': {
      prism(x - 0.03, y - 0.03, w + 0.06, h + 0.06, z, z + 3, shade(rc, 0.3), shade(wall, -0.22), shade(wall, -0.32));
      const c = P(x + w / 2, y + h / 2, z + 3), rx = (w + h) / 2 * HW * 0.42;
      const g = ctx.createLinearGradient(c[0] - rx, 0, c[0] + rx, 0); g.addColorStop(0, shade(rc, 0.25)); g.addColorStop(1, shade(rc, -0.25));
      ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, rh, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      circle(c[0], c[1] - rh, 2.5, shade(rc, -0.3));
      break;
    }
  }
}
function drawWindows(x, y, w, h, base, z, bl, wall, rc) {
  const floors = bl.floors || 1, fh = (z - base) / floors;
  const doorSpan = bl.door ? (bl.win === 'shop' ? [0.52, 0.74] : [0.38, 0.62]) : null;
  const houseRow = (f, nL, nR, size) => {
    const zb = base + f * fh + fh * 0.28, zt = zb + fh * 0.46;
    for (let k = 0; k < nL; k++) {
      const u = (k + 0.5) / nL, hw = Math.min(size, 0.36 / nL);
      if (f === 0 && doorSpan && u + hw > doorSpan[0] && u - hw < doorSpan[1]) continue;
      win('L', x, y, w, h, u - hw, u + hw, zb, zt);
    }
    for (let k = 0; k < nR; k++) { const u = (k + 0.5) / nR, hw = Math.min(size, 0.36 / nR); win('R', x, y, w, h, u - hw, u + hw, zb, zt); }
  };
  switch (bl.win) {
    case 'house': for (let f = 0; f < floors; f++) houseRow(f, Math.max(1, Math.round(w * 1.6)), Math.max(1, Math.round(h * 1.6)), 0.12); break;
    case 'grid':
      for (let f = 0; f < floors; f++) {
        houseRow(f, Math.max(2, Math.round(w * 2.6)), Math.max(2, Math.round(h * 2.6)), 0.08);
        if (f) { faceL(x, y, w, h, 0, 1, base + f * fh - 0.8, base + f * fh + 0.8, shade(wall, -0.18)); faceR(x, y, w, h, 0, 1, base + f * fh - 0.8, base + f * fh + 0.8, shade(wall, -0.28)); }
      }
      break;
    case 'band':
      for (let f = 0; f < floors; f++) {
        const zb = base + f * fh + fh * 0.2, zt = zb + fh * 0.6;
        if (f === 0 && doorSpan) { win('L', x, y, w, h, 0.04, 0.36, zb, zt); win('L', x, y, w, h, 0.64, 0.96, zb, zt); }
        else win('L', x, y, w, h, 0.04, 0.96, zb, zt);
        win('R', x, y, w, h, 0.04, 0.96, zb, zt);
        if (bl.terraces && f) { faceL(x, y, w, h, 0, 1, base + f * fh - 1.5, base + f * fh + 1, '#5aa850'); faceR(x, y, w, h, 0, 1, base + f * fh - 1.5, base + f * fh + 1, '#4a8f42'); }
      }
      break;
    case 'shop': {
      const gh = floors > 1 ? fh : (z - base);
      win('L', x, y, w, h, 0.05, 0.46, base + 3, base + Math.min(gh * 0.75, 18));
      win('R', x, y, w, h, 0.12, 0.88, base + 3, base + Math.min(gh * 0.75, 18));
      for (let f = 1; f < floors; f++) houseRow(f, Math.max(1, Math.round(w * 1.6)), Math.max(1, Math.round(h * 1.6)), 0.12);
      break;
    }
    case 'columns':
      for (let k = 0; k <= 6; k++) { const u = 0.04 + k * 0.92 / 6; faceL(x, y, w, h, u - 0.02, u + 0.02, base, z - 3, '#ffffff'); faceL(x, y, w, h, u + 0.005, u + 0.02, base, z - 3, shade(wall, -0.1)); }
      faceL(x, y, w, h, 0, 1, z - 5, z, shade(wall, 0.15));
      for (let k = 0; k < 3; k++) { const u = 0.2 + k * 0.3; win('R', x, y, w, h, u - 0.08, u + 0.08, base + 5, base + (z - base) * 0.65); }
      break;
    case 'garage':
      for (const [a, c] of [[0.06, 0.34], [0.38, 0.66]]) { faceL(x, y, w, h, a, c, base, base + 20, '#ffffff'); faceL(x, y, w, h, a + 0.02, c - 0.02, base, base + 18.5, '#9e2a2a'); for (let zz = base + 4; zz < base + 18; zz += 4) faceL(x, y, w, h, a + 0.02, c - 0.02, zz, zz + 0.8, 'rgba(0,0,0,.18)'); }
      win('L', x, y, w, h, 0.74, 0.94, base + 6, base + 16);
      win('R', x, y, w, h, 0.2, 0.45, base + 8, base + 20); win('R', x, y, w, h, 0.55, 0.8, base + 8, base + 20);
      break;
    case 'clock': {
      const cp = P(x + w / 2, y + h, z - 12);
      circle(cp[0], cp[1], 6, '#fffdf5'); ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cp[0], cp[1], 6, 0, Math.PI * 2); ctx.stroke();
      const d = new Date(), ha = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, ma = d.getMinutes() / 60 * Math.PI * 2;
      line(cp, [cp[0] + Math.sin(ha) * 3.3, cp[1] - Math.cos(ha) * 3.3], '#2b2b2b', 1.3); line(cp, [cp[0] + Math.sin(ma) * 4.8, cp[1] - Math.cos(ma) * 4.8], '#2b2b2b', 1);
      win('R', x, y, w, h, 0.3, 0.7, z - 20, z - 8);
      break;
    }
  }
  if (bl.door && bl.win !== 'garage') {
    const [a, c] = doorSpan || [0.38, 0.62];
    const dz = base + Math.min(15, fh * 0.75);
    faceL(x, y, w, h, a + 0.02, c - 0.02, base, dz, '#ffffff');
    faceL(x, y, w, h, a + 0.04, c - 0.04, base, dz - 1.2, shade(rc, -0.25));
  }
}

const ART_FX = {
  park(e) {
    const x = e.x, y = e.y;
    poly([P(x + 0.9, y + 0.1), P(x + 1.1, y + 0.1), P(x + 1.1, y + 1.9), P(x + 0.9, y + 1.9)], '#d8c79a');
    poly([P(x + 0.1, y + 0.9), P(x + 1.9, y + 0.9), P(x + 1.9, y + 1.1), P(x + 0.1, y + 1.1)], '#d8c79a');
    for (const [u, v, k] of [[0.45, 0.45, 0], [1.5, 0.45, 2], [0.45, 1.5, 2]]) drawTree(x + u, y + v, k, 30 + k * 7, e.id + k, 0.7);
    const p = P(x + 1.5, y + 1.5); for (let k = 0; k < 7; k++) circle(p[0] + Math.cos(k) * 8, p[1] + Math.sin(k * 1.7) * 4, 2.2, ['#ff6b8a', '#ffd23f', '#fff', '#b07cff'][k % 4]);
    return 40;
  },
  flag(e, a) {
    const bl = a.blocks[0], fz = bl.z + 6;
    const p = P(e.x + bl.x + 0.12, e.y + bl.y + bl.h - 0.1, fz);
    line(P(e.x + bl.x + 0.12, e.y + bl.y + bl.h - 0.1, 0), [p[0], p[1] - 22], '#777', 1.5);
    waveFlag(p[0], p[1] - 22, '#e53935');
    return fz + 24;
  },
  flags(e, a) {
    const bl = a.blocks[0];
    const cols = ['#e53935', '#ffd23f', '#43a047', '#1e88e5'];
    for (let k = 0; k < 4; k++) { const p = P(e.x + bl.x + 0.2 + k * (bl.w - 0.4) / 3, e.y + bl.y + bl.h - 0.1, bl.z + 3); line(p, [p[0], p[1] - 14], '#777', 1.2); waveFlag(p[0], p[1] - 14, cols[k], 0.6); }
    return bl.z + 20;
  },
  tower(e, a) {
    const bl = a.blocks[0];
    prism(e.x + bl.x + bl.w - 0.35, e.y + bl.y, 0.35, 0.35, 4, bl.z + 26, null, '#b71c1c', '#8e1515');
    hipRoof(e.x + bl.x + bl.w - 0.35, e.y + bl.y, 0.35, 0.35, bl.z + 26, 8, '#5a5a5a', '#444', '#6a6a6a', 0.03);
    return bl.z + 34;
  },
  helipad(e, a) {
    const bl = a.blocks[0], c = P(e.x + bl.x + bl.w * 0.65, e.y + bl.y + bl.h * 0.5, bl.z + 3);
    ctx.beginPath(); ctx.ellipse(c[0], c[1], 16, 8, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a6570'; ctx.fill();
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '700 9px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', c[0], c[1] + 0.5);
    return bl.z + 6;
  },
  marquee(e, a) {
    const bl = a.blocks[0];
    for (let k = 0; k < 12; k++) { const u = (k + 0.5) / 12; const p = P(e.x + bl.x + u * bl.w, e.y + bl.y + bl.h, bl.z - 2); const on = (Math.floor(T * 4) + k) % 2; circle(p[0], p[1], 1.6, on ? '#ffe066' : '#c9a227'); if (on) addGlow(p[0], p[1], 8); }
    return bl.z + 4;
  },
  antenna(e, a) {
    const bl = a.blocks[a.blocks.length - 1], p = P(e.x + bl.x + bl.w / 2, e.y + bl.y + bl.h / 2, bl.z + 3);
    line(p, [p[0], p[1] - 26], '#7a7a7a', 1.5);
    const on = Math.sin(T * 3) > 0; circle(p[0], p[1] - 26, 2, on ? '#ff3b30' : '#8a2a2a'); if (on) addGlow(p[0], p[1] - 26, 14);
    return bl.z + 30;
  },
  tank(e) {
    const [cx, cy] = P(e.x + 1.65, e.y + 0.45);
    cylinder(cx, cy, 8, 4, 0, 36, ['#eef2f4', '#c6cfd6', '#8d9aa5', '#d7dee3']);
    return 40;
  },
  cone(e, a) {
    const bl = a.blocks[0], p = P(e.x + bl.x + bl.w / 2, e.y + bl.y + bl.h / 2, bl.z + 4);
    poly([[p[0] - 6, p[1] - 10], [p[0] + 6, p[1] - 10], [p[0], p[1] + 4]], '#e0a85a');
    circle(p[0], p[1] - 13, 7, '#ffb6c1'); circle(p[0] - 3, p[1] - 17, 4, '#fff5e6'); circle(p[0] + 1, p[1] - 21, 2.5, '#e53935');
    return bl.z + 26;
  },
  lanterns(e, a) {
    const bl = a.blocks[0];
    for (let k = 0; k < 4; k++) { const p = P(e.x + bl.x + (k + 0.5) * bl.w / 4, e.y + bl.y + bl.h + 0.08, bl.z - 4); const sw = Math.sin(T * 2 + k) * 1; ellipse(p[0] + sw, p[1], 2.6, 3.4, '#e53935'); addGlow(p[0], p[1], 10); }
    return bl.z;
  },
  fountainmini(e) {
    const c = P(e.x + 1.5, e.y + 2.55);
    ellipse(c[0], c[1], 12, 6, '#cfd6dc'); ellipse(c[0], c[1] - 1, 9.5, 4.5, WATER_SHALLOW[(T * 3 | 0) % 8]);
    for (let k = 0; k < 6; k++) { const ph = (T + k / 6) % 1; circle(c[0] + Math.cos(k) * ph * 7, c[1] - 8 * ph + 10 * ph * ph - 3, 1.1, 'rgba(210,245,255,.9)'); }
    return 0;
  },
  dome(e, a) {
    const bl = a.blocks[0], c = P(e.x + bl.x + bl.w / 2, e.y + bl.y + bl.h / 2, bl.z + 3);
    const g = ctx.createLinearGradient(c[0] - 26, 0, c[0] + 26, 0); g.addColorStop(0, '#f2f4f6'); g.addColorStop(1, '#9aa3ab');
    ctx.beginPath(); ctx.ellipse(c[0], c[1], 26, 30, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(-0.35); ctx.fillStyle = '#2b3440'; ctx.fillRect(-3, -30, 6, 26); ctx.restore();
    const tp = P(e.x + bl.x + bl.w / 2, e.y + bl.y + bl.h / 2, bl.z + 26);
    line([tp[0] + 4, tp[1] - 2], [tp[0] + 16, tp[1] - 16], '#c0c6cc', 3);
    return bl.z + 34;
  },
  playground(e) {
    const x = e.x, y = e.y;
    prism(x + 0.3, y + 0.3, 0.3, 0.3, 0, 18, '#ff7043', '#f4511e', '#d84315');
    poly([P(x + 0.6, y + 0.35, 18), P(x + 0.6, y + 0.55, 18), P(x + 1.3, y + 0.55, 1), P(x + 1.3, y + 0.35, 1)], '#ffca28');
    for (const u of [1.0, 1.7]) { line(P(x + u, y + 1.2, 0), P(x + u, y + 1.2, 22), '#5c6bc0', 2); line(P(x + u, y + 1.8, 0), P(x + u, y + 1.8, 22), '#5c6bc0', 2); }
    line(P(x + 1.0, y + 1.2, 22), P(x + 1.7, y + 1.2, 22), '#5c6bc0', 2); line(P(x + 1.0, y + 1.8, 22), P(x + 1.7, y + 1.8, 22), '#5c6bc0', 2);
    for (const u of [1.2, 1.5]) { const s = Math.sin(T * 2.5 + u * 3) * 0.12; const a = P(x + u, y + 1.5, 22), b2 = P(x + u + s, y + 1.5, 6); line(a, b2, '#555', 1); rr(b2[0] - 3, b2[1] - 1, 6, 2, 1, '#ef5350'); }
    const sb = P(x + 0.5, y + 1.5); ellipse(sb[0], sb[1], 10, 5, '#f3e2a8');
    return 30;
  },
  stadium(e) {
    const x = e.x + 0.15, y = e.y + 0.15, w = 2.7, h = 2.7;
    groundShadow(x, y, w, h, 0.8);
    prism(x, y, w, h, 0, 26, null, '#e8e4dc', '#cfc9bd');
    for (let k = 0; k < 8; k++) { faceL(x, y, w, h, k / 8 + 0.02, k / 8 + 0.1, 6, 20, k % 2 ? '#1e88e5' : '#e53935'); faceR(x, y, w, h, k / 8 + 0.02, k / 8 + 0.1, 6, 20, k % 2 ? '#1565c0' : '#c62828'); }
    poly([P(x, y, 26), P(x + w, y, 26), P(x + w, y + h, 26), P(x, y + h, 26)], '#bdb6a8');
    poly([P(x + 0.45, y + 0.45, 26), P(x + w - 0.45, y + 0.45, 26), P(x + w - 0.45, y + h - 0.45, 26), P(x + 0.45, y + h - 0.45, 26)], '#5cb83a');
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2;
    line(P(x + w / 2, y + 0.45, 26), P(x + w / 2, y + h - 0.45, 26), 'rgba(255,255,255,.8)', 1.2);
    const c = P(x + w / 2, y + h / 2, 26); ctx.beginPath(); ctx.ellipse(c[0], c[1], 12, 6, 0, 0, Math.PI * 2); ctx.stroke();
    for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const p = P(x + u * w, y + v * h, 26); line(p, [p[0], p[1] - 30], '#888', 2); rr(p[0] - 5, p[1] - 36, 10, 6, 1, '#eee'); if (nightAmt > 0.1) addGlow(p[0], p[1] - 33, 40); }
    return 64;
  },
  ferris(e) {
    const x = e.x, y = e.y;
    const hub = P(x + 1, y + 1.1, 56);
    const R = 44;
    line(P(x + 0.5, y + 1.1, 0), hub, '#7a8a9a', 3); line(P(x + 1.5, y + 1.1, 0), hub, '#7a8a9a', 3);
    ctx.strokeStyle = '#e0e6ea'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(hub[0], hub[1], R * 0.82, R, 0, 0, Math.PI * 2); ctx.stroke();
    const rot = THUMB ? 0.3 : T * 0.35;
    const cols = ['#e53935', '#ffd23f', '#43a047', '#1e88e5', '#8e24aa', '#ff7043', '#00acc1', '#f06292'];
    for (let k = 0; k < 8; k++) {
      const a = rot + (k * Math.PI) / 4, px = hub[0] + Math.cos(a) * R * 0.82, py = hub[1] + Math.sin(a) * R;
      line(hub, [px, py], 'rgba(200,210,220,.9)', 1.2);
      rr(px - 5, py, 10, 8, 2.5, cols[k]); if (nightAmt > 0.1) addGlow(px, py + 4, 12);
    }
    circle(hub[0], hub[1], 4, '#5a6570');
    return 110;
  },
};
function waveFlag(px, py, col, s) {
  s = s || 1;
  const wv = THUMB ? 0 : T * 6;
  ctx.beginPath(); ctx.moveTo(px, py);
  for (let k = 0; k <= 6; k++) ctx.lineTo(px + k * 2.4 * s, py + Math.sin(wv + k * 0.9) * 1.5 * s * (k / 6));
  for (let k = 6; k >= 0; k--) ctx.lineTo(px + k * 2.4 * s, py + 8 * s + Math.sin(wv + k * 0.9) * 1.5 * s * (k / 6));
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}

function drawGenericPlant(c, sx, sy, g, sw, ready) {
  const L = CROPS[c].look || { shape: 'bush', leaf: '#5fae3e', fruit: '#e53935' };
  const unripe = '#b9d36a';
  switch (L.shape) {
    case 'leafy': {
      const r = 1.5 + 3.2 * g;
      circle(sx - 2, sy - r * 0.7, r * 0.8, shade(L.leaf, -0.15)); circle(sx + 2, sy - r * 0.7, r * 0.8, shade(L.leaf, -0.1)); circle(sx + sw * 0.2, sy - r, r, L.leaf);
      if (ready) circle(sx + sw * 0.2, sy - r * 1.1, r * 0.55, L.fruit);
      break;
    }
    case 'bush': {
      const r = 1.6 + 3.6 * g;
      circle(sx - 1.6 + sw * 0.3, sy - r - 0.5, r, shade(L.leaf, -0.12)); circle(sx + 1.8 + sw * 0.3, sy - r * 1.3, r * 0.85, L.leaf);
      if (g > 0.5) { const fc = ready ? L.fruit : unripe; circle(sx - 2.5 + sw * 0.3, sy - r, 1.5, fc); circle(sx + 2 + sw * 0.3, sy - r * 1.2, 1.4, fc); circle(sx + sw * 0.3, sy - r * 1.9, 1.3, fc); }
      break;
    }
    case 'flower': {
      const h = 4 + (L.h || 18) * g;
      line([sx, sy], [sx + sw * 0.5, sy - h], shade(L.leaf, -0.1), 1.4);
      ellipse(sx - 2, sy - h * 0.4, 2.2, 1, L.leaf); ellipse(sx + 2, sy - h * 0.55, 2.2, 1, L.leaf);
      if (g > 0.5) {
        if ((L.h || 18) < 15) { const fc = ready ? L.fruit : '#c7b8e0'; for (let k = 0; k < 4; k++) circle(sx + sw * 0.5, sy - h - k * 1.6, 1.3, fc); }
        else { const r = ready ? 3.4 : 2.2; circle(sx + sw * 0.5, sy - h, r, ready ? L.fruit : '#d8e08a'); circle(sx + sw * 0.5, sy - h, r * 0.45, '#6b4a2a'); }
      }
      break;
    }
    case 'vine': {
      const h = 4 + 14 * g;
      line([sx, sy], [sx, sy - 16], '#8a6239', 1.2);
      ctx.strokeStyle = L.leaf; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 4 + sw, sy - h / 2, sx + sw * 0.5, sy - h); ctx.stroke();
      circle(sx - 2 + sw * 0.3, sy - h * 0.5, 2, L.leaf); circle(sx + 2.5 + sw * 0.3, sy - h * 0.75, 2, shade(L.leaf, -0.1));
      if (g > 0.6) { const fc = ready ? L.fruit : unripe; for (const [dx, dy] of [[0, 0], [1.4, 0.4], [0.6, 1.6], [-0.8, 1]]) circle(sx + 2 + dx + sw * 0.3, sy - h * 0.55 + dy, 1.1, fc); }
      break;
    }
    case 'tree': {
      const r = 2 + 4.5 * g, th = 3 + 7 * g;
      line([sx, sy], [sx, sy - th], '#7a4f2c', 1.6);
      circle(sx + sw * 0.4, sy - th - r * 0.6, r, L.leaf); circle(sx - r * 0.4 + sw * 0.4, sy - th - r, r * 0.6, shade(L.leaf, 0.12));
      if (g > 0.6) { const fc = ready ? L.fruit : unripe; for (let k = 0; k < 4; k++) circle(sx + Math.cos(k * 1.7) * r * 0.6 + sw * 0.4, sy - th - r * 0.6 + Math.sin(k * 2.3) * r * 0.5, 1.2, fc); }
      break;
    }
  }
}

function drawPig(p, st) {
  const [sx, sy] = P(p.x, p.y);
  const wig = st === 'busy' ? Math.sin(T * 5 + p.ph) * 0.6 : 0;
  ellipse(sx, sy, 7.5, 2.6, 'rgba(0,0,0,.22)');
  ctx.save(); ctx.translate(sx, sy); ctx.scale(p.dir, 1);
  for (const lx of [-4, -1.5, 2, 4.5]) rr(lx - 0.9, -4, 1.8, 4, 0.6, '#e8909e');
  ellipse(0, -6.5, 7, 4.5, '#f6a5b5');
  ellipse(-1.5, -8, 3.5, 1.5, 'rgba(255,255,255,.35)');
  ctx.save(); ctx.translate(6.5, -7.5 + wig);
  circle(0, 0, 3, '#f6a5b5'); ellipse(2.4, 0.6, 1.5, 1.2, '#e8909e'); circle(2.2, 0.4, 0.35, '#7a3a44'); circle(2.8, 0.8, 0.35, '#7a3a44');
  poly([[-1.5, -2], [-0.5, -4], [0.3, -2.2]], '#e8909e'); circle(0.6, -0.8, 0.45, '#222');
  ctx.restore();
  ctx.strokeStyle = '#e8909e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-7.5, -7, 1.3, 0, Math.PI * 1.6); ctx.stroke();
  if (st === 'ready') ellipse(-2, -1, 3, 1, 'rgba(120,80,40,.5)');
  ctx.restore();
}
function drawGoat(p, st) {
  const [sx, sy] = P(p.x, p.y);
  const hop = st === 'ready' ? Math.abs(Math.sin(T * 4 + p.ph)) * 2 : 0;
  ellipse(sx, sy, 6.5, 2.4, 'rgba(0,0,0,.22)');
  ctx.save(); ctx.translate(sx, sy - hop); ctx.scale(p.dir, 1);
  for (const lx of [-3.5, -1.5, 1.5, 3.5]) rr(lx - 0.6, -5, 1.2, 5, 0.5, '#6b4a2f');
  ellipse(0, -7, 5.5, 3.4, '#e8d8bf'); ellipse(-1, -6, 3, 2, '#d0b48c');
  ctx.save(); ctx.translate(5, -9.5);
  ellipse(0, 0, 2.2, 2.6, '#e8d8bf'); line([-0.8, -2], [-2.2, -4.2], '#8a7a6a', 1.1); line([0.6, -2.2], [0.2, -4.6], '#8a7a6a', 1.1);
  line([0.6, 2.2], [0.3, 4], '#bba98f', 1.2); circle(0.7, -0.6, 0.45, '#222');
  ctx.restore();
  ctx.restore();
}
function drawHive(p, st, e, i) {
  const x = e.x + [0.5, 1.1, 1.45][i % 3], y = e.y + [1.3, 1.45, 0.85][i % 3];
  groundShadow(x, y, 0.32, 0.32, 0.2);
  prism(x, y, 0.32, 0.32, 0, 6, '#fff3cf', '#f2e2b0', '#d9c48d');
  prism(x, y, 0.32, 0.32, 6, 12, '#fff3cf', '#f6d36b', '#e0b84a');
  prism(x - 0.03, y - 0.03, 0.38, 0.38, 12, 14, '#c8a050', '#a8823a', '#8f6c2c');
  const fp = P(x + 0.16, y + 0.32, 3); rr(fp[0] - 2, fp[1] - 1, 4, 2, 1, '#5a3a1a');
  if (st !== 'hungry') {
    const c = P(x + 0.16, y + 0.16, 18);
    for (let k = 0; k < 4; k++) { const a = T * 3 + k * 1.6 + i; const bx = c[0] + Math.cos(a) * 9, by = c[1] + Math.sin(a * 1.3) * 4; circle(bx, by, 1.4, '#ffcc00'); line([bx - 0.8, by], [bx + 0.8, by], '#222', 0.6); }
  }
  if (st === 'ready') { const hp = P(x + 0.32, y + 0.16, 10); ellipse(hp[0] + 2, hp[1] + 2, 1.6, 2.4, '#f2a20f'); }
}
function drawFish(p, st, e, i) {
  const fx = e.x + 1 + Math.cos(T * 0.6 + i * 2.1) * 0.5, fy = e.y + 1.1 + Math.sin(T * 0.6 + i * 2.1) * 0.4;
  const [sx, sy] = P(fx, fy, 1);
  const dir = Math.sin(T * 0.6 + i * 2.1) > 0 ? -1 : 1;
  ctx.save(); ctx.translate(sx, sy); ctx.scale(dir, 1); ctx.globalAlpha = st === 'hungry' ? 0.45 : 0.85;
  const col = ['#ff9f43', '#ffd23f', '#ff6b6b'][i % 3];
  ellipse(0, 0, 4.5, 2, col); poly([[-3.5, 0], [-7, -2.5], [-7, 2.5]], col);
  ctx.restore(); ctx.globalAlpha = 1;
  if (st === 'ready' && Math.sin(T * 2 + i * 2) > 0.92 && !THUMB) spawn({ type: 'fish', x: sx, y: sy, vx: rand(-12, 12), vy: -40, g: 130, life: 0.6, max: 0.6, c: col });
}
Object.assign(DRAW, {
  pigpen: (e) => drawPen(e, '#b8936a', (x, y) => {
    ellipse(...P(x + 1.3, y + 1.3), 22, 10, '#8a6a45');
    prism(x + 0.1, y + 0.1, 0.8, 0.6, 0, 16, null, '#c98d5a', '#a8744a');
    gableRoofY(x + 0.1, y + 0.1, 0.8, 0.6, 16, 10, '#8a4a2c', '#7a3f25', '#c98d5a', 0.06);
  }, drawPig),
  apiary: (e) => drawPen(e, '#a3d46e', (x, y) => {
    for (let k = 0; k < 10; k++) { const p = P(x + 0.2 + (k * 0.37) % 1.6, y + 0.2 + ((k * 0.61) % 1.5)); circle(p[0], p[1] - 2, 1.6, ['#ff6b8a', '#ffd23f', '#fff', '#b07cff'][k % 4]); }
  }, drawHive),
  goatfarm: (e) => drawPen(e, '#b3d47a', (x, y) => {
    prism(x + 0.1, y + 0.1, 0.85, 0.6, 0, 16, null, '#d8c4a0', '#b9a37e');
    gableRoofY(x + 0.1, y + 0.1, 0.85, 0.6, 16, 11, '#4a6a8a', '#3f5a7a', '#d8c4a0', 0.06);
    prism(x + 1.2, y + 0.4, 0.4, 0.3, 0, 6, '#9a8f84', '#857a70', '#70665c');
  }, drawGoat),
  fishpond: (e) => drawPen(e, WATER_SHALLOW[((T * 2) | 0) % 8], (x, y) => {
    poly([P(x + 0.05, y + 0.05), P(x + 0.7, y + 0.05), P(x + 0.7, y + 0.35), P(x + 0.05, y + 0.35)], '#b98b55');
    prism(x + 0.05, y + 0.05, 0.65, 0.3, 0, 3, '#c99a62', '#a87a48', '#8f663a');
  }, drawFish),
});

function drawHedge(e) {
  const x = e.x + 0.08, y = e.y + 0.08;
  groundShadow(x, y, 0.84, 0.84, 0.2);
  prism(x, y, 0.84, 0.84, 0, 12, '#5cb347', '#4a9a3a', '#3d8530');
  for (let k = 0; k < 4; k++) { const p = P(x + 0.2 + (k % 2) * 0.45, y + 0.2 + Math.floor(k / 2) * 0.45, 12); circle(p[0], p[1], 3.5, '#6cc455'); }
}
function drawFlagpole(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  prism(e.x + 0.35, e.y + 0.35, 0.3, 0.3, 0, 4, '#ddd', '#bbb', '#999');
  line([sx, sy - 4], [sx, sy - 56], '#9aa3ab', 2);
  waveFlag(sx + 1, sy - 56, '#2e86de', 1.3);
  circle(sx, sy - 57, 1.8, '#ffd23f');
}
function drawSprinkler(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(sx, sy, 6, 3, 'rgba(0,0,0,.2)');
  rr(sx - 1.5, sy - 12, 3, 12, 1, '#7a8a9a'); circle(sx, sy - 13, 2.5, '#5a6a7a');
  if (THUMB) return;
  for (let k = 0; k < 10; k++) {
    const ph = (T * 0.9 + k / 10) % 1, a = T * 2 + k * 0.63;
    const r = ph * 40, h = 14 * ph - 18 * ph * ph;
    circle(sx + Math.cos(a) * r, sy - 13 + Math.sin(a) * r * 0.5 - h * 2, 1.2, `rgba(170,225,255,${0.9 - ph * 0.7})`);
  }
}
function drawScarecrow(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  const sw = THUMB ? 0 : Math.sin(T * 1.5 + e.id) * 1;
  ellipse(sx + 2, sy, 6, 2.5, 'rgba(0,0,0,.2)');
  line([sx, sy], [sx, sy - 30], '#7a5534', 2);
  line([sx - 11, sy - 22 + sw], [sx + 11, sy - 22 - sw], '#7a5534', 2);
  rr(sx - 5, sy - 25, 10, 12, 2, '#3f7fbf');
  for (const dx of [-11, 11]) { line([sx + dx, sy - 22], [sx + dx + Math.sign(dx) * 2, sy - 19], '#e6c35c', 1.5); }
  circle(sx, sy - 29, 4, '#f3d9a0');
  circle(sx - 1.4, sy - 29.5, 0.6, '#333'); circle(sx + 1.4, sy - 29.5, 0.6, '#333');
  drawHat('straw', sx, sy - 32);
}
function drawWindTurbine(e) {
  const [sx, sy] = P(e.x + 0.5, e.y + 0.5);
  ellipse(sx + 6, sy + 1, 10, 4, 'rgba(0,0,0,.2)');
  poly([[sx - 3, sy], [sx + 3, sy], [sx + 1.4, sy - 110], [sx - 1.4, sy - 110]], '#eef1f4');
  poly([[sx, sy], [sx + 3, sy], [sx + 1.4, sy - 110], [sx, sy - 110]], '#d3d9de');
  rr(sx - 4, sy - 116, 10, 6, 2, '#e6eaee');
  const hub = [sx - 2, sy - 113], rot = THUMB ? 0.4 : T * 1.6;
  for (let k = 0; k < 3; k++) {
    const a = rot + k * Math.PI * 2 / 3;
    const tip = [hub[0] + Math.cos(a) * 34 * 0.8, hub[1] + Math.sin(a) * 34];
    const pa = a + Math.PI / 2;
    poly([[hub[0] + Math.cos(pa) * 2, hub[1] + Math.sin(pa) * 2], tip, [hub[0] - Math.cos(pa) * 2, hub[1] - Math.sin(pa) * 2]], '#ffffff', '#c9d0d6', 0.8);
  }
  circle(hub[0], hub[1], 2.4, '#b0b8bf');
}
Object.assign(DRAW, {
  hedge: drawHedge, flagpole: drawFlagpole, sprinkler: drawSprinkler, scarecrow: drawScarecrow, windturbine: drawWindTurbine,
  palm: (e) => drawTree(e.x + 0.5, e.y + 0.5, 4, (e.s || 0) % 30 + 20, e.id || 0, 1.05),
});

for (const t in BUILD) if (BUILD[t].art && !DRAW[t]) DRAW[t] = drawArt;

function drawBridge(e) {
  const x = e.x, y = e.y, alongX = e.dir ? e.dir === 'x' : (isRoad(x - 1, y) || isRoad(x + 1, y)) && !(isRoad(x, y - 1) || isRoad(x, y + 1));

  for (const [u, v] of alongX ? [[0.5, 0.1], [0.5, 0.9]] : [[0.1, 0.5], [0.9, 0.5]]) { const p = P(x + u, y + v); rr(p[0] - 1.5, p[1] - 3, 3, 9, 1, '#5a3d26'); }
  const ins = 0.12;
  const pts = alongX ? [P(x, y + ins, 4), P(x + 1, y + ins, 4), P(x + 1, y + 1 - ins, 4), P(x, y + 1 - ins, 4)] : [P(x + ins, y, 4), P(x + 1 - ins, y, 4), P(x + 1 - ins, y + 1, 4), P(x + ins, y + 1, 4)];
  const side = alongX ? [P(x, y + 1 - ins, 4), P(x + 1, y + 1 - ins, 4), P(x + 1, y + 1 - ins, 0), P(x, y + 1 - ins, 0)] : [P(x + 1 - ins, y, 4), P(x + 1 - ins, y + 1, 4), P(x + 1 - ins, y + 1, 0), P(x + 1 - ins, y, 0)];
  poly(side, '#7a5534');
  poly(pts, '#c49a63');
  ctx.strokeStyle = 'rgba(90,60,30,.45)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 1; k < 5; k++) { const t = k / 5; const a = alongX ? P(x + t, y + ins, 4) : P(x + ins, y + t, 4); const b = alongX ? P(x + t, y + 1 - ins, 4) : P(x + 1 - ins, y + t, 4); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  for (const v of [ins, 1 - ins]) {
    const a = alongX ? P(x, y + v, 12) : P(x + v, y, 12), b = alongX ? P(x + 1, y + v, 12) : P(x + v, y + 1, 12);
    line(a, b, '#8a5a34', 2);
    for (const t of [0, 0.5]) { const p = alongX ? P(x + t, y + v, 4) : P(x + v, y + t, 4); line(p, [p[0], p[1] - 8], '#6b4527', 2); }
  }
}
function drawPlaza(e) {
  poly(diamond(e.x, e.y), '#e3ddd0');
  ctx.strokeStyle = 'rgba(160,145,120,.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (const t of [0.5]) { const a = P(e.x + t, e.y), b = P(e.x + t, e.y + 1), c = P(e.x, e.y + t), d = P(e.x + 1, e.y + t); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
  ctx.stroke();
}
function drawDirtPath(e) {
  const x = e.x, y = e.y, s = 0.14;
  const iT = isRoad(x, y - 1) ? 0 : s, iR = isRoad(x + 1, y) ? 0 : s, iB = isRoad(x, y + 1) ? 0 : s, iL = isRoad(x - 1, y) ? 0 : s;
  poly([P(x + iL, y + iT), P(x + 1 - iR, y + iT), P(x + 1 - iR, y + 1 - iB), P(x + iL, y + 1 - iB)], '#c09662');
  const p = P(x + 0.5, y + 0.5); circle(p[0] - 5, p[1] - 1, 1.2, '#a07a4a'); circle(p[0] + 4, p[1] + 2, 1, '#a07a4a');
}
const FLAT = { road: drawRoad, bridge: drawBridge, plaza: drawPlaza, dirtpath: drawDirtPath };

function drawLvlStars(e) {
  const p = P(e.x + e.w / 2, e.y + e.h, 2);
  const s = '★'.repeat(e.lvl - 1);
  ctx.font = '700 11px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(80,50,10,.8)'; ctx.strokeText(s, p[0], p[1] + 4);
  ctx.fillStyle = '#ffd23f'; ctx.fillText(s, p[0], p[1] + 4);
}

