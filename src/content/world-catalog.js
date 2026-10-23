const B5 = (x, y, w, h, z, wall, rc, roof, win, o) =>
  BL(
    x,
    y,
    w,
    h,
    z,
    Object.assign({ wall, rc, roof, rh: 14, win, door: true }, o || {}),
  );
function asset(t, name, icon, cat, w, h, cost, art, o) {
  BUILD[t] = Object.assign(
    {
      name,
      icon,
      cat,
      w,
      h,
      cost,
      level: 1,
      xp: Math.max(1, Math.round(cost / 80)),
      ht: art.ht || 60,
      art,
      desc: "",
    },
    o || {},
  );
  DRAW[t] = drawArt;
  const b = BUILD[t];
  if (o && o.job) JOBS[t] = o.job;
  if (o && o.venue) VENUES[t] = o.venue;
  if (o && o.pop) {
    HOUSE_TYPES.push(t);
    b.rentTime = b.rentTime || 30000 + o.pop * 900;
    b.rent = b.rent || Math.round(o.pop * 3);
  }
  if (o && o.svc) for (const s of [].concat(o.svc)) SERVICES[s].types.push(t);
  if (o && o.cap && !CIVIC_TYPES.includes(t)) CIVIC_TYPES.push(t);
  if (o && o.beauty) BEAUTY[t] = o.beauty;
  if (o && o.pollute) POLLUTERS.push(t);
  return b;
}

Object.assign(ART_FX, {
  coaster(e) {
    const x = e.x,
      y = e.y,
      w = e.w,
      h = e.h;
    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const t = k / 40,
        a = t * Math.PI * 2;
      const px = x + w / 2 + Math.cos(a) * (w * 0.38),
        py = y + h / 2 + Math.sin(a) * (h * 0.38),
        z = 18 + Math.max(0, Math.sin(a * 2)) * 50;
      const p = P(px, py, z);
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2,
        px = x + w / 2 + Math.cos(a) * (w * 0.38),
        py = y + h / 2 + Math.sin(a) * (h * 0.38),
        z = 18 + Math.max(0, Math.sin(a * 2)) * 50;
      line(P(px, py, 0), P(px, py, z), "#9e9e9e", 1.4);
    }
    const a = T * 1.2,
      cp = P(
        x + w / 2 + Math.cos(a) * w * 0.38,
        y + h / 2 + Math.sin(a) * h * 0.38,
        22 + Math.max(0, Math.sin(a * 2)) * 50,
      );
    rr(cp[0] - 6, cp[1] - 5, 12, 6, 2, "#ffca28");
    return 80;
  },
  pool(e) {
    const i = 0.3;
    poly(diamond(e.x + i, e.y + i, e.w - i * 2, e.h - i * 2), "#ffffff");
    poly(
      diamond(
        e.x + i + 0.1,
        e.y + i + 0.1,
        e.w - i * 2 - 0.2,
        e.h - i * 2 - 0.2,
      ),
      "#4fc3f7",
    );
    for (let k = 1; k < 4; k++) {
      const a = P(e.x + i + 0.1, e.y + i + (k * (e.h - i * 2)) / 4),
        b = P(e.x + e.w - i - 0.1, e.y + i + (k * (e.h - i * 2)) / 4);
      line(a, b, "rgba(255,255,255,.6)", 1);
    }
    return 10;
  },
  court(e, a) {
    poly(
      diamond(e.x + 0.15, e.y + 0.15, e.w - 0.3, e.h - 0.3),
      a.courtCol || "#c0603c",
    );
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const p = (u, v) =>
      P(e.x + 0.3 + u * (e.w - 0.6), e.y + 0.3 + v * (e.h - 0.6));
    for (const [a1, b1] of [
      [
        [0, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [1, 1],
      ],
      [
        [1, 1],
        [0, 1],
      ],
      [
        [0, 1],
        [0, 0],
      ],
      [
        [0.5, 0],
        [0.5, 1],
      ],
    ]) {
      const s = p(...a1),
        t2 = p(...b1);
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(t2[0], t2[1]);
    }
    ctx.stroke();
    const c = p(0.5, 0.5);
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], 8, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (a.hoops)
      for (const v of [0.02, 0.98]) {
        const h = p(0.5, v);
        line(h, [h[0], h[1] - 18], "#757575", 1.5);
        rr(h[0] - 4, h[1] - 22, 8, 5, 1, "#fafafa");
      }
    return 20;
  },
  oval(e, a) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2),
      rx = ((e.w + e.h) / 2) * HW * 0.82,
      ry = rx * 0.5;
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = a.trackCol || "#c75b3a";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], rx * 0.78, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = a.infield || "#6cbf4a";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 1;
    for (const f of [0.86, 0.94]) {
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], rx * f, ry * (f * 0.95), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (a.cars)
      for (let k = 0; k < 3; k++) {
        const an = T * (1 + k * 0.15) + k * 2;
        rr(
          c[0] + Math.cos(an) * rx * 0.89 - 4,
          c[1] + Math.sin(an) * ry * 0.85 - 2,
          8,
          4,
          1,
          ["#e53935", "#1e88e5", "#fdd835"][k],
        );
      }
    return 10;
  },
  golf(e) {
    for (let k = 0; k < 4; k++) {
      const u = 0.2 + (k % 2) * 0.55,
        v = 0.2 + Math.floor(k / 2) * 0.55;
      const c = P(e.x + e.w * u + 0.4, e.y + e.h * v + 0.4);
      ellipse(c[0], c[1], 22, 11, "#7cd36a");
      ellipse(c[0] + 8, c[1] + 2, 6, 3, "#f3e3b0");
      line(c, [c[0], c[1] - 16], "#eee", 1);
      poly(
        [
          [c[0], c[1] - 16],
          [c[0] + 7, c[1] - 13],
          [c[0], c[1] - 10],
        ],
        "#e53935",
      );
    }
    return 20;
  },
  tent(e, a) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2),
      r = (e.w + e.h) * 9,
      hgt = a.tentH || 46;
    for (let k = 0; k < 12; k++) {
      const a1 = (k / 12) * Math.PI * 2,
        a2 = ((k + 1) / 12) * Math.PI * 2;
      poly(
        [
          [c[0], c[1] - hgt],
          [c[0] + Math.cos(a1) * r, c[1] + Math.sin(a1) * r * 0.5 - 8],
          [c[0] + Math.cos(a2) * r, c[1] + Math.sin(a2) * r * 0.5 - 8],
        ],
        k % 2 ? a.tc1 || "#e53935" : a.tc2 || "#fafafa",
      );
    }
    line([c[0], c[1] - hgt], [c[0], c[1] - hgt - 12], "#795548", 1.5);
    poly(
      [
        [c[0], c[1] - hgt - 12],
        [c[0] + 9, c[1] - hgt - 9],
        [c[0], c[1] - hgt - 6],
      ],
      "#fdd835",
    );
    return hgt + 14;
  },
  cooling(e) {
    for (const [u, v] of [
      [0.8, 0.9],
      [2.1, 0.9],
    ]) {
      if (u > e.w - 0.6) continue;
      const c = P(e.x + u, e.y + v),
        r = 20;
      poly(
        [
          [c[0] - r, c[1]],
          [c[0] - r * 0.7, c[1] - 44],
          [c[0] - r * 0.85, c[1] - 66],
          [c[0] + r * 0.85, c[1] - 66],
          [c[0] + r * 0.7, c[1] - 44],
          [c[0] + r, c[1]],
        ],
        "#cfd8dc",
      );
      poly(
        [
          [c[0], c[1]],
          [c[0] + r * 0.7, c[1] - 44],
          [c[0] + r * 0.85, c[1] - 66],
          [c[0] + r, c[1]],
        ],
        "#b0bec5",
      );
      ellipse(c[0], c[1] - 66, r * 0.85, 5, "#90a4ae");
      smokeAt([c[0], c[1] - 70], 3, true);
    }
    return 80;
  },
  dam(e) {
    poly(diamond(e.x, e.y + e.h * 0.6, e.w, e.h * 0.4), "#4fa3c7");
    prism(
      e.x + 0.1,
      e.y + 0.4,
      e.w - 0.2,
      0.4,
      0,
      40,
      "#cfd8dc",
      "#b0bec5",
      "#90a4ae",
    );
    for (let k = 0; k < 3; k++) {
      const p = P(e.x + 0.6 + (k * (e.w - 1.2)) / 2, e.y + 0.8, 10);
      for (let j = 0; j < 4; j++)
        spawn({
          type: "dot",
          x: p[0] + rand(-3, 3),
          y: p[1],
          vx: rand(-4, 4),
          vy: rand(10, 30),
          g: 90,
          life: 0.5,
          max: 0.5,
          r: 1.6,
          c: "#e1f5fe",
        });
    }
    return 44;
  },
  turbines(e) {
    for (let k = 0; k < Math.min(4, e.w * e.h); k++) {
      const u = 0.5 + (k % 2) * (e.w - 1),
        v = 0.5 + Math.floor(k / 2) * (e.h - 1);
      const b = P(e.x + u, e.y + v),
        top = [b[0], b[1] - 80];
      line(b, top, "#eceff1", 3);
      const a = T * 2.4 + k;
      for (let j = 0; j < 3; j++) {
        const aa = a + j * 2.094;
        line(
          top,
          [top[0] + Math.cos(aa) * 24, top[1] + Math.sin(aa) * 24],
          "#fafafa",
          2.5,
        );
      }
      circle(top[0], top[1], 3, "#cfd8dc");
    }
    return 104;
  },
  derrick(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2);
    prism(
      e.x + 0.2,
      e.y + 0.2,
      e.w - 0.4,
      e.h - 0.4,
      0,
      16,
      "#ffb300",
      "#f57c00",
      "#e65100",
    );
    ctx.strokeStyle = "#424242";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c[0] - 12, c[1] - 16);
    ctx.lineTo(c[0], c[1] - 80);
    ctx.lineTo(c[0] + 12, c[1] - 16);
    for (let k = 1; k < 6; k++) {
      const yy = c[1] - 16 - k * 12,
        wd = 12 - k * 2;
      ctx.moveTo(c[0] - wd, yy);
      ctx.lineTo(c[0] + wd, yy);
    }
    ctx.stroke();
    if (Math.random() < DT * 2) smokeAt([c[0] + 18, c[1] - 30], 3, true);
    return 84;
  },
  cages(e, a) {
    const ics = a.animals || ["🦁", "🦒", "🐘", "🦓"];
    for (let k = 0; k < 4; k++) {
      const u = 0.15 + (k % 2) * (e.w / 2),
        v = 0.15 + Math.floor(k / 2) * (e.h / 2);
      poly(
        diamond(e.x + u, e.y + v, e.w / 2 - 0.3, e.h / 2 - 0.3),
        k % 2 ? "#a5d6a7" : "#dcedc8",
      );
      const c = P(e.x + u + e.w / 4 - 0.15, e.y + v + e.h / 4 - 0.15);
      emojiAt(
        [c[0], c[1] - 8 + Math.sin(T * 2 + k) * 1.5],
        ics[k % ics.length],
        16,
      );
    }
    return 26;
  },
  neon(e, a) {
    const c = P(e.x + e.w / 2, e.y + e.h, 30);
    const on = Math.floor(T * 3 + e.id) % 4 !== 0;
    signBoard(
      c,
      a.neonText || "OPEN",
      on ? a.neonCol || "#d500f9" : "#4a148c",
      "#ffffff",
      "700 10px Fredoka, sans-serif",
    );
    if (nightAmt > 0.05 && on) addGlow(c[0], c[1], 26, false);
    return 0;
  },
  screen(e) {
    const a = P(e.x + 0.3, e.y + 0.4, 10),
      b = P(e.x + e.w - 0.3, e.y + 0.4, 10);
    poly([a, b, [b[0], b[1] - 34], [a[0], a[1] - 34]], "#263238");
    poly(
      [
        [a[0] + 3, a[1] - 4],
        [b[0] - 3, b[1] - 4],
        [b[0] - 3, b[1] - 30],
        [a[0] + 3, a[1] - 30],
      ],
      nightAmt > 0.1 ? "#90caf9" : "#607d8b",
    );
    for (let k = 0; k < 6; k++) {
      const p = P(
        e.x + 0.6 + (k % 3) * 0.9,
        e.y + 1.4 + Math.floor(k / 3) * 0.9,
      );
      rr(
        p[0] - 6,
        p[1] - 4,
        12,
        5,
        2,
        ["#e53935", "#1e88e5", "#43a047"][k % 3],
      );
    }
    return 40;
  },
  graves(e) {
    for (let k = 0; k < 12; k++) {
      const p = P(
        e.x + 0.35 + ((k % 4) * (e.w - 0.7)) / 3,
        e.y + 0.35 + (Math.floor(k / 4) * (e.h - 0.7)) / 2,
      );
      rr(p[0] - 2.5, p[1] - 8, 5, 8, 2, "#9e9e9e");
    }
    return 10;
  },
  parked(e) {
    poly(diamond(e.x + 0.05, e.y + 0.05, e.w - 0.1, e.h - 0.1), "#78797b");
    for (let k = 0; k < e.w * e.h * 2; k++) {
      const u = (k % (e.w * 2)) / 2 + 0.25,
        v = Math.floor(k / (e.w * 2)) + 0.4;
      if (hash2(e.id, k, 3) < 0.3) continue;
      const c = {
        x: e.x + u - 0.5,
        y: e.y + v - 0.5,
        dx: 0,
        dy: 1,
        kind: "car",
        col: CAR_COLS[(e.id + k) % CAR_COLS.length],
        alpha: 1,
      };
      drawCar(c);
    }
    return 12;
  },
  pumps(e) {
    prism(
      e.x + 0.2,
      e.y + 0.2,
      e.w - 0.4,
      e.h - 0.4,
      22,
      26,
      "#fafafa",
      "#e53935",
      "#c62828",
    );
    for (const u of [0.3, 0.7])
      prism(
        e.x + u * e.w - 0.1,
        e.y + e.h / 2 - 0.1,
        0.2,
        0.2,
        0,
        22,
        null,
        "#bdbdbd",
        "#9e9e9e",
      );
    for (const u of [0.35, 0.65])
      prism(
        e.x + u * e.w - 0.08,
        e.y + e.h * 0.7,
        0.16,
        0.12,
        0,
        10,
        "#e53935",
        "#c62828",
        "#b71c1c",
      );
    return 30;
  },
  billboard(e, a) {
    const p = P(e.x + 0.5, e.y + 0.5, 30);
    line(P(e.x + 0.5, e.y + 0.5), p, "#616161", 2);
    rr(p[0] - 22, p[1] - 22, 44, 22, 2, a.bbCol || "#1e88e5", "#fff", 1.5);
    emojiAt([p[0], p[1] - 11], a.bbIcon || "🛍️", 13);
    return 56;
  },

  eiffel(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2),
      col = "#8d6e63",
      dk = "#6d4c41";
    const leg = (s) => {
      poly(
        [
          [c[0] + s * 30, c[1] + 6],
          [c[0] + s * 18, c[1] - 30],
          [c[0] + s * 7, c[1] - 70],
          [c[0] + s * 3, c[1] - 120],
          [c[0] + s * 1, c[1] - 150],
          [c[0], c[1] - 150],
          [c[0] + s * 2, c[1] - 120],
          [c[0] + s * 4, c[1] - 70],
          [c[0] + s * 10, c[1] - 30],
          [c[0] + s * 20, c[1] + 6],
        ],
        s > 0 ? dk : col,
      );
    };
    leg(-1);
    leg(1);
    ctx.strokeStyle = dk;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const yy = c[1] - k * 14,
        wd = 28 - k * 2.6;
      ctx.moveTo(c[0] - wd, yy);
      ctx.lineTo(c[0] + wd, yy - 10);
      ctx.moveTo(c[0] + wd, yy);
      ctx.lineTo(c[0] - wd, yy - 10);
    }
    ctx.stroke();
    rr(c[0] - 22, c[1] - 34, 44, 4, 1, col);
    rr(c[0] - 12, c[1] - 74, 24, 3, 1, col);
    line([c[0], c[1] - 150], [c[0], c[1] - 166], dk, 1.5);
    if (nightAmt > 0.1)
      for (let k = 0; k < 6; k++)
        addGlow(c[0] + rand(-14, 14) * (1 - k / 6), c[1] - k * 24, 10, true);
    return 170;
  },
  liberty(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2);
    prism(
      e.x + 0.3,
      e.y + 0.3,
      e.w - 0.6,
      e.h - 0.6,
      0,
      40,
      "#bcaaa4",
      "#a1887f",
      "#8d6e63",
    );
    const g = "#4db6ac",
      dg = "#26a69a",
      b = c[1] - 40;
    poly(
      [
        [c[0] - 10, b],
        [c[0] - 8, b - 46],
        [c[0] + 8, b - 46],
        [c[0] + 10, b],
      ],
      g,
    );
    poly(
      [
        [c[0], b],
        [c[0] + 8, b - 46],
        [c[0] + 10, b],
      ],
      dg,
    );
    circle(c[0], b - 52, 6, g);
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.32;
      line(
        [c[0], b - 56],
        [c[0] + Math.cos(a) * 11, b - 56 + Math.sin(a) * 11],
        g,
        1.6,
      );
    }
    line([c[0] + 7, b - 40], [c[0] + 13, b - 78], g, 3.5);
    poly(
      [
        [c[0] + 10, b - 78],
        [c[0] + 16, b - 78],
        [c[0] + 13, b - 90],
      ],
      "#ffca28",
    );
    if (nightAmt > 0.05) addGlow(c[0] + 13, b - 84, 20, false);
    rr(c[0] - 14, b - 30, 6, 10, 1, "#80cbc4");
    return 140;
  },
  bigben(e) {
    prism(e.x + 0.2, e.y + 0.2, 0.8, 0.8, 4, 120, null, "#d4b483", "#bfa06a");
    for (let k = 1; k < 8; k++) {
      faceL(
        e.x + 0.2,
        e.y + 0.2,
        0.8,
        0.8,
        0,
        1,
        4 + k * 13,
        5 + k * 13,
        "#b08d57",
      );
      faceR(
        e.x + 0.2,
        e.y + 0.2,
        0.8,
        0.8,
        0,
        1,
        4 + k * 13,
        5 + k * 13,
        "#9c7a46",
      );
    }
    const cl = P(e.x + 0.6, e.y + 1.0, 104);
    circle(cl[0], cl[1], 7, "#fffdf5");
    line(cl, [cl[0], cl[1] - 5], "#333", 1);
    line(cl, [cl[0] + 3, cl[1]], "#333", 1);
    const cr = P(e.x + 1.0, e.y + 0.6, 104);
    circle(cr[0] + 1, cr[1], 6, "#fffdf0");
    const t = P(e.x + 0.6, e.y + 0.6, 120);
    poly(
      [
        [t[0] - 16, t[1] + 4],
        [t[0], t[1] - 34],
        [t[0] + 16, t[1] + 4],
      ],
      "#455a64",
    );
    poly(
      [
        [t[0], t[1] + 4],
        [t[0], t[1] - 34],
        [t[0] + 16, t[1] + 4],
      ],
      "#37474f",
    );
    prism(
      e.x + 1.1,
      e.y + 0.3,
      e.w - 1.3,
      e.h - 0.6,
      4,
      40,
      "#c8a776",
      "#d4b483",
      "#bfa06a",
    );
    return 160;
  },
  colosseum(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2),
      rx = ((e.w + e.h) / 2) * HW * 0.78,
      ry = rx * 0.5,
      H = 46;
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - H, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#c8a879";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - H + 6, rx * 0.72, ry * 0.68, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e4cfa1";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - 6, rx * 0.6, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#d9b98a";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c[0] - rx, c[1] - H);
    ctx.ellipse(c[0], c[1] - H, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(c[0] + rx, c[1]);
    ctx.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = "#d7b98c";
    ctx.fill();
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 14; k++) {
        const a = (Math.PI * (k + 0.5)) / 14,
          px = c[0] - Math.cos(a) * rx * 0.97,
          py = c[1] - H + 8 + r * 13 + Math.sin(a) * ry;
        rr(px - 2.5, py, 5, 8, 2.5, "#8d6e4a");
      }
    return 60;
  },
  tajmahal(e) {
    const x = e.x,
      y = e.y,
      w = e.w,
      h = e.h;
    poly(diamond(x + 0.2, y + 0.2, w - 0.4, h - 0.4), "#f5f5f0");
    prism(
      x + 1.0,
      y + 1.0,
      w - 2,
      h - 2,
      4,
      44,
      "#ffffff",
      "#f5f5f0",
      "#e8e8e0",
    );
    const c = P(x + w / 2, y + h / 2, 44);
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - 18, 26, 30, 0, Math.PI, 0);
    ctx.lineTo(c[0] + 26, c[1]);
    ctx.lineTo(c[0] - 26, c[1]);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#e0e0d8";
    ctx.lineWidth = 1;
    ctx.stroke();
    line([c[0], c[1] - 48], [c[0], c[1] - 60], "#c9a227", 1.5);
    for (const [u, v] of [
      [0.4, 0.4],
      [w - 0.4, 0.4],
      [0.4, h - 0.4],
      [w - 0.4, h - 0.4],
    ]) {
      const p = P(x + u, y + v);
      rr(p[0] - 3, p[1] - 70, 6, 70, 3, "#fafaf5");
      circle(p[0], p[1] - 72, 4, "#ffffff");
    }
    for (const u of [0.35, 0.65]) {
      const a = P(x + w * u, y + h - 1.0, 10);
      ctx.beginPath();
      ctx.ellipse(a[0], a[1] - 22, 6, 12, 0, Math.PI, 0);
      ctx.fillStyle = "#cfd8dc";
      ctx.fill();
    }
    return 110;
  },
  pyramid(e) {
    const x = e.x + 0.1,
      y = e.y + 0.1,
      w = e.w - 0.2,
      h = e.h - 0.2,
      apex = P(x + w / 2, y + h / 2, (w + h) * 22);
    poly([P(x, y + h), P(x + w, y + h), apex], "#e0c48a");
    poly([P(x + w, y + h), P(x + w, y), apex], "#c9a96c");
    ctx.strokeStyle = "rgba(120,90,50,.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < 10; k++) {
      const f = k / 10,
        za = (w + h) * 22 * f,
        a = P(x + (w * f) / 2, y + h - (h * f) / 2, za),
        b = P(x + w - (w * f) / 2, y + h - (h * f) / 2, za),
        c = P(x + w - (w * f) / 2, y + (h * f) / 2, za);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
    }
    ctx.stroke();
    return (w + h) * 22 + 10;
  },
  sphinx(e) {
    prism(
      e.x + 0.2,
      e.y + 0.6,
      e.w - 0.4,
      0.8,
      0,
      16,
      "#e0c48a",
      "#d2b47a",
      "#c4a46a",
    );
    prism(
      e.x + 0.2,
      e.y + 0.65,
      0.7,
      0.7,
      16,
      40,
      "#e0c48a",
      "#d2b47a",
      "#c4a46a",
    );
    const h = P(e.x + 0.55, e.y + 1.0, 44);
    poly(
      [
        [h[0] - 10, h[1]],
        [h[0], h[1] - 14],
        [h[0] + 10, h[1]],
      ],
      "#3f6fb5",
    );
    return 50;
  },
  redeemer(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2);
    poly(
      [
        [c[0] - 40, c[1] + 10],
        [c[0] - 6, c[1] - 50],
        [c[0] + 8, c[1] - 52],
        [c[0] + 42, c[1] + 10],
      ],
      "#7c8c5a",
    );
    poly(
      [
        [c[0] + 8, c[1] - 52],
        [c[0] + 42, c[1] + 10],
        [c[0], c[1] + 10],
      ],
      "#66764a",
    );
    const b = c[1] - 52;
    rr(c[0] - 5, b - 50, 10, 50, 3, "#eceff1");
    rr(c[0] - 34, b - 42, 68, 6, 3, "#eceff1");
    circle(c[0], b - 54, 5, "#eceff1");
    return 120;
  },
  opera(e) {
    const shell = (u, s, col) => {
      const b = P(e.x + u, e.y + e.h * 0.6, 10);
      poly(
        [
          [b[0] - 18 * s, b[1]],
          [b[0] + 12 * s, b[1] - 48 * s],
          [b[0] + 22 * s, b[1]],
        ],
        col,
      );
      poly(
        [
          [b[0] + 12 * s, b[1] - 48 * s],
          [b[0] + 22 * s, b[1]],
          [b[0] + 26 * s, b[1] - 4],
        ],
        shade(col, -0.12),
      );
    };
    prism(
      e.x + 0.2,
      e.y + 0.2,
      e.w - 0.4,
      e.h - 0.4,
      0,
      10,
      "#d7ccc8",
      "#bcaaa4",
      "#a1887f",
    );
    shell(0.8, 1, "#fafafa");
    shell(1.6, 1.2, "#fafafa");
    shell(2.5, 1.1, "#f5f5f5");
    shell(3.2, 0.8, "#fafafa");
    return 70;
  },
  pisa(e) {
    const c = P(e.x + 0.5, e.y + 0.5),
      lean = 0.18;
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(lean);
    for (let k = 0; k < 8; k++) {
      rr(-12, -14 - k * 13, 24, 13, 2, k % 2 ? "#f5f0e6" : "#ebe4d6");
      for (let j = 0; j < 4; j++)
        rr(-10 + j * 6, -12 - k * 13, 2, 9, 1, "#d6cdbb");
    }
    rr(-9, -120, 18, 12, 3, "#ebe4d6");
    ctx.restore();
    return 130;
  },
  arc(e) {
    prism(e.x + 0.1, e.y + 0.6, 0.6, 0.8, 0, 60, null, "#ece4d0", "#d8ceb6");
    prism(
      e.x + e.w - 0.7,
      e.y + 0.6,
      0.6,
      0.8,
      0,
      60,
      null,
      "#ece4d0",
      "#d8ceb6",
    );
    prism(
      e.x + 0.1,
      e.y + 0.6,
      e.w - 0.2,
      0.8,
      40,
      66,
      "#f5efe0",
      "#ece4d0",
      "#d8ceb6",
    );
    const a = P(e.x + e.w / 2, e.y + 1.4, 26);
    ctx.beginPath();
    ctx.ellipse(a[0], a[1], 10, 14, 0, Math.PI, 0);
    ctx.fillStyle = "rgba(80,60,40,.25)";
    ctx.fill();
    return 70;
  },
  stonehenge(e) {
    const c = [e.x + e.w / 2, e.y + e.h / 2];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2,
        x = c[0] + Math.cos(a) * (e.w * 0.36),
        y = c[1] + Math.sin(a) * (e.h * 0.36);
      prism(x - 0.1, y - 0.1, 0.2, 0.2, 0, 22, "#9e9e9e", "#8d8d8d", "#7b7b7b");
      if (k % 2 === 0) {
        const x2 = c[0] + Math.cos(a + 0.6) * (e.w * 0.36),
          y2 = c[1] + Math.sin(a + 0.6) * (e.h * 0.36);
        poly(
          [P(x, y, 22), P(x2, y2, 22), P(x2, y2, 27), P(x, y, 27)],
          "#a8a8a8",
        );
      }
    }
    return 30;
  },
  moai(e) {
    for (let k = 0; k < Math.max(1, e.w); k++) {
      const p = P(e.x + 0.5 + k, e.y + 0.6);
      rr(p[0] - 7, p[1] - 40, 14, 40, 3, "#6d6a66");
      rr(p[0] - 8, p[1] - 30, 16, 4, 1, "#5d5a56");
      rr(p[0] - 2, p[1] - 28, 4, 10, 1, "#5d5a56");
    }
    return 44;
  },
  burj(e) {
    const x = e.x + e.w / 2,
      y = e.y + e.h / 2;
    const tiers = [
      [0.9, 0, 120],
      [0.7, 120, 220],
      [0.5, 220, 300],
      [0.32, 300, 360],
      [0.18, 360, 410],
    ];
    for (const [s, z0, z1] of tiers)
      prism(
        x - s / 2,
        y - s / 2,
        s,
        s,
        z0,
        z1,
        "#cfd8dc",
        "#b0bec5",
        "#90a4ae",
      );
    const top = P(x, y, 410);
    line(top, [top[0], top[1] - 40], "#90a4ae", 2);
    if (nightAmt > 0.1)
      for (let k = 0; k < 8; k++) {
        const p = P(x, y, 40 + k * 45);
        addGlow(p[0], p[1], 12, true);
      }
    return 460;
  },
  brandenburg(e) {
    for (let k = 0; k < 6; k++)
      prism(
        e.x + 0.15 + (k * (e.w - 0.4)) / 5,
        e.y + 0.6,
        0.12,
        0.12,
        0,
        40,
        null,
        "#e8dcc0",
        "#d6c8a8",
      );
    prism(
      e.x + 0.1,
      e.y + 0.5,
      e.w - 0.2,
      0.4,
      40,
      52,
      "#efe5cc",
      "#e8dcc0",
      "#d6c8a8",
    );
    const q = P(e.x + e.w / 2, e.y + 0.7, 52);
    rr(q[0] - 10, q[1] - 14, 20, 14, 2, "#4db6ac");
    return 70;
  },
  needle(e, a) {
    const c = [e.x + e.w / 2, e.y + e.h / 2],
      H = a.needleH || 160;
    prism(
      c[0] - 0.12,
      c[1] - 0.12,
      0.24,
      0.24,
      0,
      H,
      null,
      "#eceff1",
      "#cfd8dc",
    );
    const p = P(c[0], c[1], H);
    ellipse(p[0], p[1], 26, 9, a.discCol || "#fafafa");
    ellipse(p[0], p[1] - 6, 22, 8, a.discCol2 || "#ffb300");
    line([p[0], p[1] - 8], [p[0], p[1] - 40], "#cfd8dc", 2);
    if (nightAmt > 0.1) addGlow(p[0], p[1], 30, false);
    return H + 44;
  },
  twins(e) {
    for (const u of [0.25, e.w - 1.05]) {
      const x = e.x + u,
        y = e.y + 0.4;
      for (let k = 0; k < 6; k++) {
        const s = 0.8 - k * 0.07;
        prism(
          x + (0.8 - s) / 2,
          y + (0.8 - s) / 2,
          s,
          s,
          k * 50,
          (k + 1) * 50,
          "#cfd8dc",
          "#b0bec5",
          "#90a4ae",
        );
      }
      const p = P(x + 0.4, y + 0.4, 300);
      line(p, [p[0], p[1] - 40], "#b0bec5", 2);
    }
    const a = P(e.x + 0.65, e.y + 0.8, 170),
      b = P(e.x + e.w - 0.65, e.y + 0.8, 170);
    line(a, b, "#90a4ae", 4);
    return 350;
  },
  greatwall(e) {
    prism(e.x, e.y + 0.25, 1, 0.5, 0, 22, "#bcaaa4", "#a1887f", "#8d6e63");
    for (let k = 0; k < 3; k++)
      prism(
        e.x + k * 0.35,
        e.y + 0.65,
        0.18,
        0.1,
        22,
        27,
        "#a1887f",
        "#8d6e63",
        "#795548",
      );
    return 28;
  },
  windmillNL(e) {
    const b = P(e.x + 0.5, e.y + 0.5);
    poly(
      [
        [b[0] - 12, b[1]],
        [b[0] - 8, b[1] - 46],
        [b[0] + 8, b[1] - 46],
        [b[0] + 12, b[1]],
      ],
      "#8d6e63",
    );
    const top = [b[0], b[1] - 48];
    poly(
      [
        [top[0] - 10, top[1] + 2],
        [top[0], top[1] - 12],
        [top[0] + 10, top[1] + 2],
      ],
      "#5d4037",
    );
    const a = T * 0.8;
    for (let k = 0; k < 4; k++) {
      const aa = a + (k * Math.PI) / 2;
      const ex = top[0] + Math.cos(aa) * 30,
        ey = top[1] + Math.sin(aa) * 30;
      line(top, [ex, ey], "#4e342e", 2);
      line(
        [
          top[0] + Math.cos(aa) * 8 + Math.cos(aa + 1.57) * 4,
          top[1] + Math.sin(aa) * 8 + Math.sin(aa + 1.57) * 4,
        ],
        [ex + Math.cos(aa + 1.57) * 5, ey + Math.sin(aa + 1.57) * 5],
        "#efebe9",
        4,
      );
    }
    return 80;
  },
  capitol(e) {
    const x = e.x,
      y = e.y,
      w = e.w,
      h = e.h;
    prism(
      x + 0.2,
      y + 0.6,
      w - 0.4,
      h - 1,
      4,
      34,
      "#fafafa",
      "#f0f0ea",
      "#dcdcd4",
    );
    const c = P(x + w / 2, y + h / 2, 34);
    prism(
      x + w / 2 - 0.7,
      y + h / 2 - 0.7,
      1.4,
      1.4,
      34,
      54,
      null,
      "#f5f5f0",
      "#e0e0d8",
    );
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - 22, 26, 34, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = "#fafafa";
    ctx.fill();
    ctx.strokeStyle = "#d6d6ce";
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let k = -2; k <= 2; k++)
      line([c[0] + k * 8, c[1] - 22], [c[0] + k * 4, c[1] - 52], "#e0e0d8", 1);
    prism(
      x + w / 2 - 0.15,
      y + h / 2 - 0.15,
      0.3,
      0.3,
      74,
      88,
      null,
      "#fafafa",
      "#e0e0d8",
    );
    const f = P(x + w / 2, y + h / 2, 92);
    circle(f[0], f[1], 3, "#c9a227");
    for (let k = 0; k <= 8; k++)
      faceL(
        x + 0.2,
        y + 0.6,
        w - 0.4,
        h - 1,
        0.3 + k * 0.05 - 0.008,
        0.3 + k * 0.05 + 0.008,
        4,
        30,
        "#ffffff",
      );
    return 100;
  },
  scales(e) {
    const p = P(e.x + e.w / 2, e.y + e.h, 50);
    signBoard(
      p,
      "⚖️ COURT",
      "#37474f",
      "#ffffff",
      "700 9px Fredoka, sans-serif",
    );
    return 0;
  },
  bars(e) {
    for (let k = 0; k < 8; k++)
      faceL(
        e.x + 0.2,
        e.y + 0.3,
        e.w - 0.4,
        e.h - 0.6,
        0.1 + k * 0.1,
        0.11 + k * 0.1,
        8,
        30,
        "#455a64",
      );
    for (const [u, v] of [
      [0.2, 0.2],
      [e.w - 0.3, 0.2],
      [0.2, e.h - 0.3],
      [e.w - 0.3, e.h - 0.3],
    ])
      prism(
        e.x + u - 0.1,
        e.y + v - 0.1,
        0.2,
        0.2,
        0,
        50,
        "#9e9e9e",
        "#8d8d8d",
        "#7b7b7b",
      );
    return 50;
  },
  dish(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2, 24);
    ctx.beginPath();
    ctx.ellipse(c[0], c[1] - 10, 22, 14, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#fafafa";
    ctx.fill();
    ctx.strokeStyle = "#b0bec5";
    ctx.stroke();
    line([c[0], c[1] - 10], [c[0] + 8, c[1] - 28], "#9e9e9e", 1.5);
    return 44;
  },
  rocketPad(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2, 8);
    prism(
      e.x + 0.3,
      e.y + 0.3,
      e.w - 0.6,
      e.h - 0.6,
      0,
      8,
      "#9e9e9e",
      "#8d8d8d",
      "#7b7b7b",
    );
    rr(c[0] - 6, c[1] - 90, 12, 86, 6, "#fafafa");
    poly(
      [
        [c[0] - 6, c[1] - 90],
        [c[0], c[1] - 108],
        [c[0] + 6, c[1] - 90],
      ],
      "#e53935",
    );
    for (const s of [-1, 1])
      poly(
        [
          [c[0] + s * 6, c[1] - 20],
          [c[0] + s * 14, c[1] - 6],
          [c[0] + s * 6, c[1] - 8],
        ],
        "#e53935",
      );
    line([c[0] + 18, c[1]], [c[0] + 18, c[1] - 96], "#e65100", 3);
    return 112;
  },
});

const CHAIN = (t, name, icon, wall, roof, accent, sign, price, need, o) =>
  asset(
    t,
    name,
    icon,
    "biz",
    (o && o.w) || 2,
    (o && o.h) || 2,
    (o && o.cost) || 1100,
    Object.assign(
      {
        blocks: [
          B5(
            0.25,
            0.3,
            ((o && o.w) || 2) - 0.5,
            ((o && o.h) || 2) - 0.6,
            (o && o.z) || 26,
            wall,
            roof,
            (o && o.roof) || "flat",
            "shop",
          ),
        ],
        awn: [accent, "#ffffff"],
        text: sign,
        textBg: accent,
      },
      (o && o.art) || {},
    ),
    Object.assign(
      {
        biz: {
          need: need || "food",
          price,
          job: { n: (o && o.jobs) || 6, k: "chef", w: 34 },
          per: 8,
        },
        desc: (o && o.desc) || `A busy ${name} franchise.`,
      },
      (o && o.extra) || {},
    ),
  );
CHAIN(
  "ch_burger",
  "Golden Burger",
  "🍔",
  "#fff3e0",
  "#d32f2f",
  "#d32f2f",
  "GOLDEN BURGER",
  9,
  "food",
  {
    art: { fx: "billboard", bbIcon: "🍔", bbCol: "#d32f2f" },
    desc: "Drive-thru burgers and fries - the busiest kitchen in town.",
  },
);
CHAIN(
  "ch_chicken",
  "Colonel Cluck's",
  "🍗",
  "#fafafa",
  "#c62828",
  "#b71c1c",
  "CLUCK",
  10,
  "food",
  { desc: "Bucket-sized fried chicken." },
);
CHAIN(
  "ch_pizza",
  "Pizza Palazzo",
  "🍕",
  "#ffebee",
  "#2e7d32",
  "#2e7d32",
  "PIZZA",
  11,
  "food",
  { roof: "hip" },
);
CHAIN(
  "ch_sub",
  "Sub Station",
  "🥪",
  "#e8f5e9",
  "#ffeb3b",
  "#2e7d32",
  "SUB STATION",
  8,
  "food",
);
CHAIN(
  "ch_taco",
  "Taco Fiesta",
  "🌮",
  "#fff8e1",
  "#7b1fa2",
  "#7b1fa2",
  "TACO FIESTA",
  8,
  "food",
);
CHAIN(
  "ch_coffee",
  "Green Bean Coffee",
  "☕",
  "#efebe9",
  "#1b5e20",
  "#1b5e20",
  "GREEN BEAN",
  7,
  "food",
  { desc: "Lattes, laptops and long queues." },
);
CHAIN(
  "ch_donut",
  "Donut Dynasty",
  "🍩",
  "#fce4ec",
  "#ec407a",
  "#ec407a",
  "DONUTS",
  6,
  "food",
);
CHAIN(
  "ch_wok",
  "Panda Wok",
  "🥡",
  "#ffebee",
  "#c62828",
  "#212121",
  "PANDA WOK",
  9,
  "food",
);
CHAIN(
  "ch_noodle",
  "Noodle Bar",
  "🍜",
  "#3e2723",
  "#b71c1c",
  "#b71c1c",
  "NOODLES",
  10,
  "food",
);
CHAIN(
  "ch_icecream",
  "Scoops Ice Cream",
  "🍦",
  "#e1f5fe",
  "#f48fb1",
  "#f06292",
  "SCOOPS",
  5,
  "food",
  { w: 1, h: 1, cost: 450, z: 18, jobs: 2 },
);
CHAIN(
  "ch_steak",
  "Prime Steakhouse",
  "🥩",
  "#4e342e",
  "#212121",
  "#6d4c41",
  "STEAKHOUSE",
  26,
  "food",
  { roof: "gx", cost: 2400 },
);
CHAIN(
  "ch_sushi",
  "Sushi Train",
  "🍣",
  "#fafafa",
  "#263238",
  "#d32f2f",
  "SUSHI",
  18,
  "food",
);
CHAIN(
  "ch_bbq",
  "Smokehouse BBQ",
  "🍖",
  "#6d4c41",
  "#3e2723",
  "#bf360c",
  "BBQ",
  16,
  "food",
  { roof: "gx", art: { chimney: [0.5, 0.5] } },
);
CHAIN(
  "ch_diner",
  "Route 66 Diner",
  "🥞",
  "#e0f7fa",
  "#00838f",
  "#e53935",
  "DINER",
  12,
  "food",
  { w: 3, cost: 1600 },
);
CHAIN(
  "ch_bubble",
  "Bubble Tea Bar",
  "🧋",
  "#f3e5f5",
  "#8e24aa",
  "#8e24aa",
  "BOBA",
  7,
  "food",
  { w: 1, h: 1, cost: 500, z: 18, jobs: 2 },
);
CHAIN(
  "ch_mart",
  "QuickMart 24/7",
  "🏪",
  "#e3f2fd",
  "#1565c0",
  "#1565c0",
  "24/7",
  7,
  "shop",
);
CHAIN(
  "ch_super",
  "MegaMart Supermarket",
  "🛒",
  "#fafafa",
  "#0277bd",
  "#0277bd",
  "MEGAMART",
  14,
  "shop",
  { w: 4, h: 3, cost: 5200, jobs: 22, z: 30, extra: { ht: 60 } },
);
CHAIN(
  "ch_fashion",
  "Threads Fashion",
  "👕",
  "#fafafa",
  "#212121",
  "#212121",
  "THREADS",
  24,
  "shop",
  { z: 32 },
);
CHAIN(
  "ch_electro",
  "ByteBox Electronics",
  "📱",
  "#e8eaf6",
  "#283593",
  "#283593",
  "BYTEBOX",
  34,
  "shop",
  { cost: 2600 },
);
CHAIN(
  "ch_sports",
  "Sprint Sports Store",
  "👟",
  "#e0f2f1",
  "#00695c",
  "#00695c",
  "SPRINT",
  22,
  "shop",
);
CHAIN(
  "ch_furniture",
  "Nordhem Furniture",
  "🛋️",
  "#fff9c4",
  "#1565c0",
  "#1565c0",
  "NORDHEM",
  30,
  "shop",
  { w: 4, h: 4, cost: 6400, jobs: 24, z: 34 },
);
CHAIN(
  "ch_pharmacy",
  "CarePlus Pharmacy",
  "💊",
  "#ffffff",
  "#c62828",
  "#c62828",
  "CAREPLUS",
  12,
  "health",
);
CHAIN(
  "ch_gas",
  "FuelUp Gas Station",
  "⛽",
  "#fafafa",
  "#e53935",
  "#e53935",
  "FUEL",
  10,
  "care",
  { w: 3, cost: 1800, z: 18, art: { fx: "pumps" } },
);
CHAIN(
  "ch_carwash",
  "Splash Car Wash",
  "🚿",
  "#e1f5fe",
  "#0288d1",
  "#0288d1",
  "SPLASH",
  9,
  "care",
);
CHAIN(
  "ch_hotel",
  "Grand Plaza Hotel",
  "🏨",
  "#eceff1",
  "#455a64",
  "#455a64",
  "GRAND HOTEL",
  34,
  "fun",
  {
    w: 3,
    h: 3,
    cost: 12000,
    jobs: 30,
    z: 120,
    extra: { ht: 140, tour: 60 },
    art: {
      blocks: [
        B5(0.3, 0.3, 2.4, 2.4, 120, "#eceff1", "#455a64", "flat", "grid", {
          floors: 10,
        }),
      ],
    },
  },
);

const FUN = (t, name, icon, w, h, cost, art, price, o) =>
  asset(
    t,
    name,
    icon,
    "fun",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        venue: { need: "fun", price, per: (o && o.per) || 10 },
        job: {
          n: (o && o.jobs) || 6,
          k: (o && o.k) || "clerk",
          w: (o && o.wage) || 38,
        },
        tour: Math.round(cost / 400),
        beauty: (o && o.beauty) || 0,
      },
      o || {},
    ),
  );
FUN(
  "fun_bowling",
  "Bowling Alley",
  "🎳",
  3,
  2,
  1800,
  {
    blocks: [B5(0.2, 0.3, 2.6, 1.4, 28, "#311b92", "#1a237e", "flat", "band")],
    fx: "neon",
    neonText: "BOWL",
    neonCol: "#ff4081",
  },
  12,
);
FUN(
  "fun_multiplex",
  "IMAX Multiplex",
  "🎬",
  4,
  3,
  6800,
  {
    blocks: [B5(0.2, 0.3, 3.6, 2.4, 50, "#263238", "#111", "flat", "none")],
    fx: "neon",
    neonText: "IMAX",
    neonCol: "#2979ff",
  },
  16,
  { jobs: 14 },
);
FUN(
  "fun_themepark",
  "Theme Park",
  "🎢",
  6,
  6,
  32000,
  {
    plaza: "#e0d6c2",
    blocks: [B5(0.3, 4.5, 1.6, 1.2, 26, "#ffcdd2", "#e53935", "hip", "shop")],
    fx: "coaster",
  },
  40,
  {
    jobs: 60,
    per: 40,
    tour: 220,
    beauty: 10,
    desc: "Roller coasters and candy floss - a huge tourist magnet.",
  },
);
FUN(
  "fun_waterpark",
  "Water Park",
  "🌊",
  5,
  5,
  18000,
  {
    plaza: "#b2ebf2",
    blocks: [B5(0.4, 0.4, 1.2, 1.2, 50, "#4fc3f7", "#0288d1", "flat", "none")],
    fx: "pool",
  },
  26,
  { jobs: 30, per: 30, tour: 120 },
);
FUN(
  "fun_zoo",
  "City Zoo",
  "🦁",
  5,
  5,
  14000,
  { lawn: "#9ccc65", blocks: [], fx: "cages" },
  18,
  { jobs: 24, per: 30, tour: 110, beauty: 6, k: "scientist", wage: 50 },
);
FUN(
  "fun_safari",
  "Safari Park",
  "🦒",
  6,
  6,
  22000,
  {
    lawn: "#cdb879",
    blocks: [],
    fx: "cages",
    animals: ["🦒", "🦓", "🐘", "🦏"],
  },
  24,
  { jobs: 30, per: 34, tour: 150 },
);
FUN(
  "fun_aquarium",
  "Aquarium",
  "🐠",
  4,
  3,
  9000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 36, "#e1f5fe", "#0277bd", "dome", "band", {
        rh: 20,
      }),
    ],
    sign: "🐠",
  },
  18,
  { jobs: 16, tour: 70 },
);
FUN(
  "fun_casino",
  "Casino Royale",
  "🎰",
  4,
  4,
  16000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 3.4, 60, "#4a148c", "#ffd700", "flat", "grid", {
        floors: 4,
      }),
    ],
    fx: "neon",
    neonText: "CASINO",
    neonCol: "#ffd700",
  },
  40,
  { jobs: 30, tour: 90 },
);
FUN(
  "fun_club",
  "Nightclub",
  "🪩",
  2,
  2,
  2200,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 26, "#212121", "#000", "flat", "none")],
    fx: "neon",
    neonText: "CLUB",
    neonCol: "#00e5ff",
  },
  18,
  { jobs: 6 },
);
FUN(
  "fun_arena",
  "Concert Arena",
  "🎤",
  5,
  5,
  26000,
  {
    plaza: "#cfd8dc",
    blocks: [
      B5(0.4, 0.4, 4.2, 4.2, 40, "#eceff1", "#90a4ae", "dome", "band", {
        rh: 24,
      }),
    ],
  },
  34,
  { jobs: 30, per: 50, tour: 140 },
);
FUN(
  "fun_theater",
  "Grand Theater",
  "🎭",
  3,
  3,
  7000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 44, "#8d1d2c", "#4e0d17", "gx", "columns", {
        rh: 18,
      }),
    ],
  },
  24,
  { jobs: 14, k: "artist", tour: 50 },
);
FUN(
  "fun_comedy",
  "Comedy Club",
  "😂",
  2,
  2,
  1600,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 24, "#fff176", "#212121", "flat", "shop")],
    fx: "neon",
    neonText: "HA HA",
    neonCol: "#ff9100",
  },
  12,
  { k: "artist" },
);
FUN(
  "fun_escape",
  "Escape Rooms",
  "🔐",
  2,
  2,
  1400,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 24, "#424242", "#212121", "flat", "shop")],
    sign: "🔐",
  },
  14,
  { jobs: 4 },
);
FUN(
  "fun_karts",
  "Go-Kart Track",
  "🏎️",
  5,
  4,
  7800,
  {
    blocks: [],
    fx: "oval",
    trackCol: "#424242",
    infield: "#7cb342",
    cars: true,
  },
  15,
  { jobs: 8 },
);
FUN(
  "fun_minigolf",
  "Mini Golf",
  "⛳",
  3,
  3,
  1800,
  { lawn: "#8bc34a", blocks: [], fx: "golf" },
  9,
  { jobs: 3 },
);
FUN(
  "fun_karaoke",
  "Karaoke Lounge",
  "🎙️",
  2,
  2,
  1300,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 26, "#e91e63", "#880e4f", "flat", "band")],
    fx: "neon",
    neonText: "SING",
    neonCol: "#f50057",
  },
  11,
);
FUN(
  "fun_circus",
  "Big Top Circus",
  "🎪",
  4,
  4,
  6000,
  { lawn: "#c5e1a5", blocks: [], fx: "tent" },
  14,
  { jobs: 12, k: "artist", tour: 40 },
);
FUN(
  "fun_planetarium",
  "Planetarium",
  "🔭",
  3,
  3,
  8000,
  {
    blocks: [
      B5(0.4, 0.4, 2.2, 2.2, 20, "#eceff1", "#283593", "dome", "none", {
        rh: 30,
      }),
    ],
  },
  12,
  { k: "scientist", wage: 60, tour: 50 },
);
FUN(
  "fun_botanic",
  "Botanical Garden",
  "🌺",
  5,
  4,
  7400,
  {
    lawn: "#9ccc65",
    blocks: [
      B5(1.5, 1.2, 2.0, 1.6, 20, "#c8e6c9", "#a5d6a7", "dome", "none", {
        rh: 26,
      }),
    ],
    fx: "park",
  },
  6,
  { jobs: 8, k: "farmer", beauty: 10, tour: 40 },
);
FUN(
  "fun_drivein",
  "Drive-in Cinema",
  "🚗",
  4,
  4,
  3800,
  { plaza: "#9e9e9e", blocks: [], fx: "screen" },
  12,
  { jobs: 4 },
);
FUN(
  "fun_pier",
  "Amusement Pier",
  "🎡",
  4,
  3,
  12000,
  { plaza: "#bcaaa4", blocks: [], fx: "ferris" },
  14,
  { place: "coast", jobs: 14, tour: 80 },
);
FUN(
  "fun_trampoline",
  "Trampoline Park",
  "🤸",
  3,
  2,
  2200,
  {
    blocks: [B5(0.2, 0.3, 2.6, 1.4, 30, "#e3f2fd", "#ff7043", "flat", "band")],
    sign: "🤸",
  },
  12,
);
FUN(
  "fun_lasertag",
  "Laser Tag Arena",
  "🔫",
  3,
  2,
  2400,
  {
    blocks: [B5(0.2, 0.3, 2.6, 1.4, 30, "#1a237e", "#000", "flat", "none")],
    fx: "neon",
    neonText: "LASER",
    neonCol: "#76ff03",
  },
  13,
);
FUN(
  "fun_natmuseum",
  "Natural History Museum",
  "🦕",
  4,
  3,
  11000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 44, "#efebe9", "#8d6e63", "gx", "columns", {
        rh: 18,
      }),
    ],
    sign: "🦕",
  },
  10,
  { jobs: 12, k: "scientist", wage: 60, tour: 80 },
);
FUN(
  "fun_artmuseum",
  "Art Museum",
  "🖼️",
  4,
  3,
  10000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 40, "#fafafa", "#9e9e9e", "flat", "columns"),
    ],
    sign: "🖼️",
  },
  12,
  { jobs: 12, k: "artist", tour: 70 },
);
FUN(
  "fun_library2",
  "Grand Library",
  "📚",
  3,
  3,
  6000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 40, "#d7ccc8", "#5d4037", "dome", "columns", {
        rh: 18,
      }),
    ],
  },
  0,
  { jobs: 8, k: "teacher", svc: "education" },
);

const SPORT = (t, name, icon, w, h, cost, art, price, o) =>
  asset(
    t,
    name,
    icon,
    "sport",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        venue: { need: "fun", price, per: (o && o.per) || 12 },
        job: { n: (o && o.jobs) || 4, k: "athlete", w: (o && o.wage) || 50 },
        tour: Math.round(cost / 500),
      },
      o || {},
    ),
  );
SPORT(
  "sp_basket",
  "Basketball Court",
  "🏀",
  2,
  2,
  400,
  { blocks: [], fx: "court", courtCol: "#c0603c", hoops: true },
  0,
  { jobs: 1, svc: "green" },
);
SPORT(
  "sp_tennis",
  "Tennis Club",
  "🎾",
  3,
  2,
  1400,
  { blocks: [], fx: "court", courtCol: "#2e7d32" },
  8,
  { jobs: 3 },
);
SPORT(
  "sp_soccer",
  "Football Pitch",
  "⚽",
  4,
  3,
  1800,
  { blocks: [], fx: "court", courtCol: "#43a047" },
  4,
  { jobs: 4 },
);
SPORT(
  "sp_baseball",
  "Baseball Park",
  "⚾",
  5,
  5,
  16000,
  { plaza: "#c8e6c9", blocks: [], fx: "stadium" },
  18,
  { jobs: 30, per: 40, tour: 100 },
);
SPORT(
  "sp_cricket",
  "Cricket Ground",
  "🏏",
  5,
  5,
  12000,
  { blocks: [], fx: "oval", trackCol: "#8bc34a", infield: "#7cb342" },
  14,
  { jobs: 22, per: 30 },
);
SPORT(
  "sp_golf",
  "Golf Course",
  "🏌️",
  7,
  6,
  20000,
  {
    lawn: "#7cb342",
    blocks: [B5(0.3, 4.8, 1.6, 1.0, 22, "#fafafa", "#2e7d32", "hip", "house")],
    fx: "golf",
  },
  30,
  { jobs: 14, beauty: 8 },
);
SPORT(
  "sp_pool",
  "Public Swimming Pool",
  "🏊",
  3,
  3,
  2600,
  { plaza: "#e0f2f1", blocks: [], fx: "pool" },
  4,
  { jobs: 4, svc: "green" },
);
SPORT(
  "sp_aquatics",
  "Aquatics Center",
  "🏊",
  4,
  4,
  14000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 3.4, 30, "#e1f5fe", "#0277bd", "dome", "band", {
        rh: 22,
      }),
    ],
  },
  10,
  { jobs: 14 },
);
SPORT(
  "sp_skate",
  "Skate Park",
  "🛹",
  3,
  3,
  1200,
  {
    plaza: "#bdbdbd",
    blocks: [
      B5(0.3, 0.3, 0.9, 0.9, 6, "#9e9e9e", "#757575", "flat", "none"),
      B5(1.8, 1.8, 0.9, 0.9, 6, "#9e9e9e", "#757575", "flat", "none"),
    ],
  },
  0,
  { jobs: 1, svc: "green" },
);
SPORT(
  "sp_racetrack",
  "Grand Prix Circuit",
  "🏁",
  8,
  6,
  45000,
  {
    blocks: [
      B5(0.4, 0.4, 2.0, 0.8, 28, "#eceff1", "#c62828", "flat", "grid", {
        floors: 2,
      }),
    ],
    fx: "oval",
    trackCol: "#424242",
    infield: "#66bb6a",
    cars: true,
  },
  40,
  { jobs: 50, per: 60, tour: 260 },
);
SPORT(
  "sp_olympic",
  "Olympic Stadium",
  "🏟️",
  7,
  7,
  60000,
  { plaza: "#cfd8dc", blocks: [], fx: "stadium" },
  40,
  { jobs: 70, per: 80, tour: 300, beauty: 10 },
);
SPORT(
  "sp_arena",
  "Indoor Sports Arena",
  "🏟️",
  4,
  4,
  15000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 3.4, 40, "#eceff1", "#1565c0", "dome", "band", {
        rh: 20,
      }),
    ],
  },
  22,
  { jobs: 24, per: 40 },
);
SPORT(
  "sp_boxing",
  "Boxing Gym",
  "🥊",
  2,
  2,
  1400,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 26, "#b71c1c", "#212121", "flat", "band")],
    sign: "🥊",
  },
  9,
  { jobs: 3 },
);
SPORT(
  "sp_climb",
  "Climbing Wall",
  "🧗",
  2,
  2,
  1600,
  {
    blocks: [B5(0.3, 0.3, 1.4, 1.4, 50, "#ff7043", "#455a64", "flat", "none")],
    sign: "🧗",
  },
  10,
  { jobs: 2 },
);
SPORT(
  "sp_equestrian",
  "Equestrian Center",
  "🏇",
  5,
  4,
  9000,
  {
    lawn: "#c5e1a5",
    blocks: [B5(0.3, 0.3, 2.0, 1.2, 24, "#8d6e63", "#4e342e", "gx", "garage")],
    fx: "oval",
    trackCol: "#bcaaa4",
    infield: "#8bc34a",
  },
  16,
  { jobs: 10 },
);
SPORT(
  "sp_velodrome",
  "Velodrome",
  "🚴",
  5,
  4,
  14000,
  {
    blocks: [
      B5(0.3, 0.3, 4.4, 3.4, 26, "#eceff1", "#90a4ae", "dome", "none", {
        rh: 18,
      }),
    ],
  },
  12,
  { jobs: 12 },
);
SPORT(
  "sp_rugby",
  "Rugby Stadium",
  "🏉",
  6,
  5,
  26000,
  { plaza: "#cfd8dc", blocks: [], fx: "stadium" },
  22,
  { jobs: 40, per: 50, tour: 140 },
);
SPORT(
  "sp_skijump",
  "Ski Jump",
  "⛷️",
  2,
  5,
  9000,
  {
    blocks: [
      B5(0.4, 0.2, 1.2, 1.0, 80, "#eceff1", "#90a4ae", "flat", "none"),
      B5(0.6, 1.2, 0.8, 3.6, 30, "#fafafa", "#cfd8dc", "flat", "none"),
    ],
  },
  14,
  { jobs: 6, tour: 40 },
);

const MON = (t, name, icon, w, h, cost, fx, tour, o) => {
  const { art: extraArt, plaza, ...rest } = o || {};
  return asset(
    t,
    name,
    icon,
    "monument",
    w,
    h,
    cost,
    Object.assign(
      { plaza: plaza || "#e7dfcc", blocks: [], fx },
      extraArt || {},
    ),
    Object.assign(
      {
        tour,
        beauty: 14,
        cap: Math.round(cost / 200),
        desc: "A world-famous landmark. Tourists love it.",
      },
      rest,
    ),
  );
};
MON("lm_eiffel", "Eiffel Tower", "🗼", 3, 3, 40000, "eiffel", 260, {
  desc: "The iron lady of Paris - lights up at night.",
});
MON("lm_liberty", "Statue of Liberty", "🗽", 3, 3, 36000, "liberty", 240);
MON("lm_bigben", "Big Ben", "🕰️", 2, 2, 30000, "bigben", 200);
MON("lm_colosseum", "Colosseum", "🏟️", 5, 5, 46000, "colosseum", 280);
MON("lm_taj", "Taj Mahal", "🕌", 5, 5, 60000, "tajmahal", 320, {
  plaza: "#f3efe2",
});
MON("lm_pyramid", "Great Pyramid", "🔺", 5, 5, 52000, "pyramid", 300, {
  plaza: "#e8d7a8",
});
MON("lm_sphinx", "Great Sphinx", "🦁", 3, 2, 24000, "sphinx", 150, {
  plaza: "#e8d7a8",
});
MON("lm_redeemer", "Christ the Redeemer", "✝️", 3, 3, 38000, "redeemer", 220, {
  plaza: "#9ccc65",
});
MON("lm_opera", "Harbour Opera House", "🎶", 4, 3, 50000, "opera", 260, {
  plaza: "#d7ccc8",
  place: "coast",
});
MON("lm_pisa", "Leaning Tower", "🏛️", 1, 1, 22000, "pisa", 160);
MON("lm_arc", "Triumphal Arch", "🏛️", 3, 2, 26000, "arc", 160);
MON("lm_stonehenge", "Stonehenge", "🪨", 4, 4, 18000, "stonehenge", 120, {
  plaza: "#9ccc65",
});
MON("lm_moai", "Moai Statues", "🗿", 3, 1, 14000, "moai", 100, {
  plaza: "#9ccc65",
});
MON("lm_burj", "Sky Spire", "🏙️", 2, 2, 120000, "burj", 420, {
  desc: "The tallest tower on Earth.",
});
MON(
  "lm_brandenburg",
  "Brandenburg Gate",
  "🏛️",
  3,
  2,
  24000,
  "brandenburg",
  150,
);
MON("lm_needle", "Space Needle", "🗼", 2, 2, 34000, "needle", 210);
MON("lm_cntower", "Broadcast Tower", "📡", 2, 2, 42000, "needle", 230, {
  art: { needleH: 260, discCol: "#cfd8dc", discCol2: "#90a4ae" },
});
MON("lm_twins", "Twin Towers", "🏢", 4, 2, 90000, "twins", 360);
MON("lm_greatwall", "Great Wall", "🧱", 1, 1, 300, "greatwall", 2, {
  multi: true,
  plaza: null,
  desc: "Drag to build your own great wall.",
});
MON("lm_windmill", "Dutch Windmill", "🌷", 2, 2, 6000, "windmillNL", 50, {
  plaza: "#aed581",
});
MON("lm_parthenon", "Parthenon", "🏛️", 5, 3, 44000, null, 260, {
  art: {
    blocks: [
      B5(0.3, 0.3, 4.4, 2.4, 40, "#f5efe0", "#e8dcc0", "gx", "columns", {
        rh: 14,
        door: false,
      }),
    ],
  },
});
MON("lm_angkor", "Angkor Temple", "🛕", 5, 5, 58000, "shikhara", 300, {
  plaza: "#c8b48a",
  art: {
    blocks: [
      B5(0.4, 0.4, 4.2, 4.2, 24, "#bfa77a", "#a68d5e", "flat", "columns"),
    ],
  },
});
MON("lm_spaceport", "Rocket Launch Pad", "🚀", 4, 4, 80000, "rocketPad", 320, {
  plaza: "#9e9e9e",
});
for (const t of Object.keys(BUILD).filter((k) => BUILD[k].cat === "monument"))
  JOBS[t] = {
    n: Math.max(2, Math.round((BUILD[t].tour || 10) / 25)),
    k: "clerk",
    w: 36,
  };
delete JOBS.lm_greatwall;

const GOV = (t, name, icon, w, h, cost, art, o) =>
  asset(
    t,
    name,
    icon,
    "gov",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        cap: Math.round(cost / 70),
        job: {
          n: (o && o.jobs) || 8,
          k: (o && o.k) || "official",
          w: (o && o.wage) || 60,
          e: 1,
        },
      },
      o || {},
    ),
  );
GOV(
  "gov_cityhall",
  "City Hall Annex",
  "🏛️",
  3,
  3,
  4200,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 44, "#eceff1", "#455a64", "hip", "columns", {
        rh: 16,
      }),
    ],
    fx: "flag",
  },
  { desc: "More council offices: +civic capacity and faster permits." },
);
GOV(
  "gov_parliament",
  "Parliament",
  "🏛️",
  5,
  4,
  30000,
  { plaza: "#e0e0e0", blocks: [], fx: "capitol" },
  {
    jobs: 40,
    tour: 120,
    beauty: 10,
    desc: "The seat of government. Residents feel represented: +4 happiness everywhere.",
  },
);
GOV(
  "gov_court",
  "Courthouse",
  "⚖️",
  3,
  3,
  6000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 40, "#f5f5f0", "#9e9e9e", "gx", "columns", {
        rh: 16,
      }),
    ],
    fx: "scales",
  },
  {
    svc: "safety",
    desc: "Justice is served: more arrests lead to convictions.",
  },
);
GOV(
  "gov_supreme",
  "Supreme Court",
  "⚖️",
  4,
  4,
  22000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 3.4, 54, "#fafafa", "#cfd8dc", "gx", "columns", {
        rh: 20,
      }),
    ],
  },
  { svc: "safety", jobs: 20, tour: 40 },
);
GOV(
  "gov_policehq",
  "Police Headquarters",
  "🚔",
  3,
  3,
  9000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 60, "#1565c0", "#0d47a1", "flat", "grid", {
        floors: 4,
      }),
    ],
    text: "POLICE HQ",
    textBg: "#0d47a1",
  },
  { svc: "safety", k: "police", jobs: 30, wage: 65 },
);
GOV(
  "gov_prison",
  "Prison",
  "🔒",
  5,
  5,
  16000,
  {
    plaza: "#9e9e9e",
    blocks: [
      B5(1.0, 1.0, 3.0, 3.0, 36, "#bdbdbd", "#757575", "flat", "grid", {
        floors: 2,
      }),
    ],
    fx: "bars",
  },
  {
    svc: "safety",
    k: "police",
    jobs: 30,
    desc: "Criminals serve longer sentences and are less likely to offend again.",
  },
);
GOV(
  "gov_firehq",
  "Fire Headquarters",
  "🚒",
  3,
  3,
  8000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 40, "#c62828", "#b71c1c", "flat", "garage", {
        floors: 2,
      }),
    ],
    text: "FIRE HQ",
    textBg: "#b71c1c",
  },
  { svc: "fire", k: "firefighter", jobs: 24, wage: 62 },
);
GOV(
  "gov_ambulance",
  "Ambulance Station",
  "🚑",
  2,
  2,
  2800,
  {
    blocks: [
      B5(0.25, 0.3, 1.5, 1.4, 26, "#ffffff", "#e53935", "flat", "garage"),
    ],
    sign: "🚑",
  },
  { svc: "health", k: "doctor", jobs: 8, wage: 60 },
);
GOV(
  "gov_tax",
  "Tax Office",
  "🧾",
  2,
  2,
  5000,
  {
    blocks: [
      B5(0.25, 0.3, 1.5, 1.4, 40, "#eceff1", "#546e7a", "flat", "grid", {
        floors: 3,
      }),
    ],
    sign: "🧾",
  },
  { desc: "Collects taxes efficiently: +10% tax revenue each (up to 3)." },
);
GOV(
  "gov_bank",
  "Central Bank",
  "🏦",
  3,
  3,
  20000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 50, "#f5f5f0", "#9e9e9e", "gx", "columns", {
        rh: 16,
      }),
    ],
    sign: "🏦",
  },
  {
    k: "business",
    jobs: 18,
    wage: 90,
    desc: "Pays 0.5% daily interest on your savings (up to 🪙5,000 a day).",
  },
);
GOV(
  "gov_post",
  "Post Office",
  "📮",
  2,
  2,
  1800,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 28, "#fff8e1", "#c62828", "gx", "shop")],
    sign: "📮",
  },
  { k: "driver", jobs: 10, wage: 42 },
);
GOV(
  "gov_dmv",
  "Licensing Office",
  "🪪",
  2,
  2,
  2200,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 30, "#eceff1", "#607d8b", "flat", "band")],
    sign: "🪪",
  },
  { jobs: 6 },
);
GOV(
  "gov_embassy",
  "Embassy",
  "🏳️",
  3,
  3,
  12000,
  {
    lawn: "#9ccc65",
    blocks: [
      B5(0.4, 0.4, 2.2, 2.0, 40, "#fafafa", "#8d6e63", "hip", "house", {
        floors: 2,
      }),
    ],
    fx: "flags",
  },
  {
    jobs: 14,
    wage: 80,
    tour: 30,
    desc: "Diplomats bring better international trade contracts.",
  },
);
GOV(
  "gov_planning",
  "City Planning Department",
  "📐",
  3,
  2,
  6500,
  {
    blocks: [
      B5(0.2, 0.3, 2.6, 1.4, 44, "#e3f2fd", "#1565c0", "flat", "band", {
        floors: 3,
      }),
    ],
    sign: "📐",
  },
  {
    jobs: 12,
    desc: "City planners automatically post Job Board openings: a manager for every new factory, ranchers for animals, farmhands for fields and rent collectors for neighbourhoods.",
  },
);
GOV(
  "gov_census",
  "Statistics Bureau",
  "📊",
  2,
  2,
  3200,
  {
    blocks: [
      B5(0.25, 0.3, 1.5, 1.4, 36, "#ede7f6", "#5e35b1", "flat", "grid", {
        floors: 3,
      }),
    ],
    sign: "📊",
  },
  { jobs: 8, desc: "Better data for the Census." },
);
GOV(
  "gov_election",
  "Election Hall",
  "🗳️",
  3,
  2,
  4000,
  {
    blocks: [B5(0.2, 0.3, 2.6, 1.4, 30, "#fafafa", "#1565c0", "gx", "columns")],
    sign: "🗳️",
  },
  {
    jobs: 6,
    desc: "Holds an election every 7 years - your approval rating decides the bonus.",
  },
);
GOV(
  "gov_archive",
  "National Archive",
  "🗄️",
  3,
  3,
  8000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 40, "#d7ccc8", "#5d4037", "flat", "columns"),
    ],
  },
  { jobs: 8, k: "scientist", tour: 20 },
);
GOV(
  "gov_ministry",
  "Ministry Building",
  "🏢",
  3,
  3,
  18000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 100, "#cfd8dc", "#455a64", "flat", "grid", {
        floors: 8,
      }),
    ],
  },
  { jobs: 40, wage: 75 },
);
GOV(
  "gov_customs",
  "Customs House",
  "🛃",
  3,
  2,
  6000,
  {
    blocks: [
      B5(0.2, 0.3, 2.6, 1.4, 34, "#e0e0e0", "#37474f", "hip", "house", {
        floors: 2,
      }),
    ],
  },
  { jobs: 10, place: "coast" },
);
GOV(
  "gov_social",
  "Social Services",
  "🤝",
  2,
  2,
  2600,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 30, "#fff3e0", "#ef6c00", "flat", "band")],
    sign: "🤝",
  },
  { jobs: 8, desc: "Helps the unemployed: fewer residents turn to crime." },
);

const PWR = (t, name, icon, w, h, cost, power, art, o) =>
  asset(
    t,
    name,
    icon,
    "util",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        power,
        job: {
          n: (o && o.jobs) || 6,
          k: (o && o.k) || "worker",
          w: (o && o.wage) || 55,
          e: (o && o.e) || 0,
        },
        desc: `${(o && o.d) || ""} Produces ${power} power.`,
      },
      o || {},
    ),
  );
PWR(
  "pw_diesel",
  "Diesel Generator",
  "🔌",
  1,
  1,
  500,
  60,
  {
    blocks: [
      B5(0.1, 0.15, 0.8, 0.7, 14, "#ffb300", "#455a64", "flat", "garage"),
    ],
    chimney: [0.3, 0.3],
  },
  { jobs: 1, pollute: true, d: "Small and noisy." },
);
PWR(
  "pw_gas",
  "Gas Turbine Plant",
  "🔥",
  3,
  2,
  5500,
  600,
  {
    blocks: [
      B5(0.2, 0.3, 2.6, 1.4, 34, "#cfd8dc", "#546e7a", "flat", "grid", {
        floors: 2,
      }),
    ],
    fx: "stacks",
  },
  { jobs: 14, pollute: true, d: "Cleaner than coal." },
);
PWR(
  "pw_coal2",
  "Coal Power Station",
  "🏭",
  4,
  3,
  9000,
  1100,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 44, "#9aa3ab", "#5a6570", "flat", "grid", {
        floors: 3,
      }),
    ],
    fx: "stacks",
  },
  { jobs: 30, pollute: true, d: "Huge output, very smoky." },
);
PWR(
  "pw_hydro",
  "Hydro Dam",
  "🌊",
  4,
  3,
  16000,
  1400,
  { blocks: [], fx: "dam" },
  {
    jobs: 20,
    place: "coast",
    d: "Clean power from water. Must touch a river, lake or sea.",
  },
);
PWR(
  "pw_windfarm",
  "Wind Farm",
  "🌬️",
  3,
  3,
  7000,
  420,
  { lawn: "#a5d6a7", blocks: [], fx: "turbines" },
  { jobs: 4, d: "Four big turbines." },
);
PWR(
  "pw_offshore",
  "Offshore Wind",
  "🌀",
  3,
  3,
  14000,
  900,
  { blocks: [], fx: "turbines" },
  { jobs: 6, place: "water", anyWater: true, d: "Built out at sea." },
);
PWR(
  "pw_solar2",
  "Solar Park",
  "🔆",
  4,
  4,
  11000,
  700,
  { lawn: "#9fcf6a", blocks: [], fx: "solar" },
  { jobs: 4, d: "Acres of silent panels." },
);
PWR(
  "pw_geo",
  "Geothermal Plant",
  "♨️",
  3,
  3,
  15000,
  1000,
  {
    blocks: [B5(0.3, 0.3, 2.4, 2.4, 30, "#eceff1", "#ff7043", "flat", "grid")],
    fx: "stacks",
  },
  { jobs: 14, e: 1, d: "Heat from deep underground." },
);
PWR(
  "pw_biomass",
  "Biomass Plant",
  "🌿",
  3,
  2,
  6000,
  500,
  {
    blocks: [B5(0.2, 0.3, 2.6, 1.4, 30, "#a5d6a7", "#33691e", "gx", "garage")],
    chimney: [0.5, 0.5],
  },
  { jobs: 10, d: "Burns farm waste." },
);
PWR(
  "pw_nuclear",
  "Nuclear Power Plant",
  "☢️",
  5,
  5,
  60000,
  4800,
  {
    plaza: "#cfd8dc",
    blocks: [
      B5(2.6, 2.8, 2.0, 1.8, 40, "#eceff1", "#90a4ae", "dome", "grid", {
        rh: 18,
      }),
    ],
    fx: "cooling",
  },
  {
    jobs: 60,
    e: 2,
    wage: 95,
    k: "scientist",
    d: "Enormous clean output. Needs graduates to run.",
  },
);
PWR(
  "pw_fusion",
  "Fusion Reactor",
  "⚛️",
  5,
  5,
  200000,
  15000,
  {
    plaza: "#b0bec5",
    blocks: [
      B5(0.6, 0.6, 3.8, 3.8, 40, "#e8eaf6", "#3949ab", "dome", "band", {
        rh: 30,
      }),
    ],
    fx: "glow",
  },
  { jobs: 80, e: 2, wage: 130, k: "scientist", d: "The future of energy." },
);
asset(
  "wt_treatment",
  "Water Treatment Plant",
  "💧",
  "util",
  4,
  3,
  9000,
  {
    plaza: "#b3e5fc",
    blocks: [B5(0.2, 0.2, 1.6, 1.2, 26, "#e1f5fe", "#0277bd", "flat", "grid")],
    fx: "pool",
  },
  {
    cat: "util",
    water: 1500,
    job: { n: 14, k: "worker", w: 52 },
    desc: "Cleans 1,500 units of water.",
  },
);
asset(
  "wt_desal",
  "Desalination Plant",
  "🌊",
  "util",
  4,
  3,
  16000,
  {
    blocks: [B5(0.2, 0.3, 3.6, 2.4, 34, "#eceff1", "#0288d1", "flat", "band")],
  },
  {
    cat: "util",
    water: 2600,
    place: "coast",
    job: { n: 20, k: "worker", w: 60, e: 1 },
    desc: "Turns seawater into 2,600 units of drinking water.",
  },
);
asset(
  "wt_reservoir",
  "Reservoir",
  "🏞️",
  "util",
  4,
  4,
  7000,
  { blocks: [], fx: "pool" },
  {
    cat: "util",
    water: 1000,
    job: { n: 4, k: "worker", w: 45 },
    desc: "Stores 1,000 units of water.",
  },
);

const COM = (t, name, icon, w, h, cost, art, o) =>
  asset(
    t,
    name,
    icon,
    "civic",
    w,
    h,
    cost,
    art,
    Object.assign({ cap: Math.round(cost / 40) }, o || {}),
  );
COM(
  "kindergarten",
  "Kindergarten",
  "🧸",
  2,
  2,
  900,
  {
    lawn: "#c5e1a5",
    blocks: [B5(0.3, 0.3, 1.4, 1.2, 22, "#fff9c4", "#ffb300", "gx", "house")],
  },
  { svc: "education", job: { n: 5, k: "teacher", w: 42, e: 1 } },
);
COM(
  "highschool",
  "High School",
  "🏫",
  4,
  3,
  5200,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.2, 36, "#ffccbc", "#5d4037", "flat", "grid", {
        floors: 3,
      }),
    ],
    fx: "flag",
  },
  {
    svc: "education",
    job: { n: 16, k: "teacher", w: 62, e: 2 },
    desc: "Teenagers earn their high-school diploma here.",
  },
);
COM(
  "college",
  "Community College",
  "🎓",
  4,
  4,
  9000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 2.4, 44, "#d7ccc8", "#3e2723", "hip", "grid", {
        floors: 3,
      }),
    ],
  },
  { svc: "education", job: { n: 20, k: "teacher", w: 70, e: 2 } },
);
COM(
  "research",
  "Research Institute",
  "🔬",
  4,
  3,
  20000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 60, "#e8f5e9", "#00897b", "flat", "band", {
        floors: 4,
      }),
    ],
    fx: "antenna",
  },
  { svc: "education", job: { n: 30, k: "scientist", w: 110, e: 2 } },
);
COM(
  "medcenter",
  "Medical Center",
  "🏥",
  4,
  4,
  18000,
  {
    blocks: [
      B5(0.3, 0.3, 3.4, 3.4, 70, "#fafafa", "#e53935", "flat", "grid", {
        floors: 6,
      }),
    ],
    fx: "helipad",
  },
  {
    svc: "health",
    job: { n: 40, k: "doctor", w: 95, e: 2 },
    venue: { need: "health", price: 30, per: 6 },
  },
);
COM(
  "childrens",
  "Children's Hospital",
  "🧒",
  3,
  3,
  9000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 44, "#e1f5fe", "#ffb300", "flat", "grid", {
        floors: 3,
      }),
    ],
  },
  { svc: "health", job: { n: 20, k: "doctor", w: 88, e: 2 } },
);
COM(
  "seniorhome",
  "Retirement Home",
  "🧓",
  3,
  2,
  3200,
  {
    lawn: "#c5e1a5",
    blocks: [
      B5(0.2, 0.3, 2.6, 1.4, 30, "#fff3e0", "#8d6e63", "hip", "house", {
        floors: 2,
      }),
    ],
  },
  {
    job: { n: 10, k: "doctor", w: 50, e: 1 },
    desc: "Seniors live longer and happier.",
  },
);
COM(
  "commcenter",
  "Community Center",
  "🤝",
  3,
  2,
  2200,
  { blocks: [B5(0.2, 0.3, 2.6, 1.4, 26, "#fff8e1", "#ef6c00", "gx", "shop")] },
  {
    venue: { need: "fun", price: 0, per: 20 },
    job: { n: 4, k: "clerk", w: 36 },
  },
);
COM(
  "church",
  "Church",
  "⛪",
  3,
  3,
  3800,
  {
    blocks: [
      B5(0.6, 0.8, 1.8, 1.8, 30, "#eceff1", "#546e7a", "gx", "house", {
        rh: 22,
      }),
      B5(0.6, 0.3, 0.6, 0.6, 76, "#eceff1", "#546e7a", "hip", "none", {
        rh: 26,
      }),
    ],
  },
  { beauty: 6 },
);
COM(
  "synagogue",
  "Synagogue",
  "🕍",
  3,
  3,
  3800,
  {
    blocks: [
      B5(0.4, 0.4, 2.2, 2.2, 34, "#f5f0e6", "#4e6e9e", "dome", "house", {
        rh: 18,
      }),
    ],
  },
  { beauty: 6 },
);
COM(
  "hindutemple",
  "Hindu Temple",
  "🛕",
  3,
  3,
  4200,
  {
    blocks: [
      B5(0.4, 0.4, 2.2, 2.2, 26, "#ffcc80", "#ef6c00", "flat", "columns"),
    ],
    fx: "shikhara",
  },
  { beauty: 8 },
);
COM(
  "gurdwara",
  "Gurdwara",
  "🛕",
  3,
  3,
  4200,
  {
    blocks: [
      B5(0.4, 0.4, 2.2, 2.2, 34, "#fafafa", "#ffc107", "dome", "columns", {
        rh: 20,
      }),
    ],
  },
  { beauty: 8 },
);
COM(
  "cemetery",
  "Cemetery",
  "🪦",
  4,
  3,
  1600,
  { lawn: "#9ccc65", blocks: [], fx: "graves" },
  { beauty: 2 },
);
COM(
  "centralpark",
  "Central Park",
  "🌳",
  6,
  6,
  9000,
  { lawn: "#8bc34a", blocks: [], fx: "park" },
  { svc: "green", beauty: 16, venue: { need: "fun", price: 0, per: 0 } },
);
COM(
  "dogpark",
  "Dog Park",
  "🐕",
  3,
  3,
  900,
  {
    lawn: "#9ccc65",
    blocks: [],
    fx: "cages",
    animals: ["🐕", "🐩", "🐕‍🦺", "🦮"],
  },
  { svc: "green", beauty: 4, venue: { need: "fun", price: 0, per: 0 } },
);
COM(
  "commgarden",
  "Community Garden",
  "🥕",
  3,
  3,
  800,
  { lawn: "#a1887f", blocks: [], fx: "park" },
  { svc: "green", beauty: 5 },
);

const TR = (t, name, icon, w, h, cost, art, o) =>
  asset(t, name, icon, "trans", w, h, cost, art, o);
TR(
  "busstation",
  "Bus Station",
  "🚌",
  3,
  2,
  3200,
  {
    plaza: "#bdbdbd",
    blocks: [
      B5(0.2, 0.3, 2.6, 1.0, 22, "#e3f2fd", "#1565c0", "gx", "band", {
        open: true,
      }),
    ],
  },
  {
    job: { n: 12, k: "driver", w: 44 },
    desc: "More buses on your roads; residents reach jobs further away.",
  },
);
TR(
  "busstop",
  "Bus Stop",
  "🚏",
  1,
  1,
  120,
  {
    blocks: [
      B5(0.15, 0.35, 0.7, 0.3, 18, "#90caf9", "#1565c0", "flat", "none", {
        open: true,
      }),
    ],
  },
  {},
);
TR(
  "metro",
  "Metro Station",
  "Ⓜ️",
  2,
  2,
  9000,
  {
    plaza: "#cfd8dc",
    blocks: [B5(0.4, 0.4, 1.2, 1.2, 18, "#eceff1", "#c62828", "flat", "band")],
    sign: "Ⓜ️",
  },
  {
    job: { n: 10, k: "driver", w: 55 },
    desc: "Underground trains: residents within 18 tiles of any two metro stations commute between them.",
  },
);
TR(
  "tramdepot",
  "Tram Depot",
  "🚋",
  3,
  3,
  5200,
  {
    blocks: [B5(0.2, 0.3, 2.6, 2.2, 28, "#fff3e0", "#e65100", "gx", "garage")],
  },
  { job: { n: 14, k: "driver", w: 48 } },
);
TR(
  "taxirank",
  "Taxi Rank",
  "🚕",
  2,
  1,
  600,
  { plaza: "#ffeb3b", blocks: [] },
  { job: { n: 6, k: "driver", w: 40 } },
);
TR(
  "parking",
  "Parking Lot",
  "🅿️",
  2,
  2,
  300,
  { blocks: [], fx: "parked" },
  { multi: false },
);
TR(
  "parkgarage",
  "Parking Garage",
  "🅿️",
  3,
  3,
  4200,
  {
    blocks: [
      B5(0.2, 0.2, 2.6, 2.6, 48, "#bdbdbd", "#757575", "flat", "band", {
        floors: 5,
      }),
    ],
    sign: "🅿️",
  },
  { job: { n: 2, k: "clerk", w: 34 } },
);
TR(
  "evcharge",
  "EV Charging Hub",
  "🔋",
  2,
  2,
  1800,
  { blocks: [], fx: "pumps" },
  { job: { n: 1, k: "clerk", w: 34 } },
);
TR(
  "truckterminal",
  "Truck Terminal",
  "🚛",
  4,
  3,
  7000,
  {
    plaza: "#9e9e9e",
    blocks: [
      B5(0.2, 0.3, 2.0, 2.4, 26, "#eceff1", "#455a64", "flat", "garage"),
    ],
  },
  { job: { n: 18, k: "driver", w: 50 } },
);
TR(
  "cruiseterm",
  "Cruise Terminal",
  "🛳️",
  4,
  3,
  18000,
  {
    plaza: "#cfd8dc",
    blocks: [
      B5(0.2, 0.3, 3.6, 2.0, 36, "#fafafa", "#0277bd", "flat", "band", {
        floors: 2,
      }),
    ],
    fx: "warship",
  },
  {
    place: "coast",
    tour: 160,
    job: { n: 24, k: "clerk", w: 46 },
    desc: "Cruise ships dock here, bringing crowds of tourists.",
  },
);
TR(
  "marina",
  "Marina",
  "⛵",
  3,
  3,
  4800,
  { blocks: [] },
  { place: "water", tour: 40, beauty: 6, job: { n: 4, k: "clerk", w: 40 } },
);
TR(
  "ferrypier",
  "Ferry Pier",
  "⛴️",
  2,
  2,
  2400,
  {
    plaza: "#bcaaa4",
    blocks: [B5(0.4, 0.4, 1.2, 1.0, 18, "#fafafa", "#1565c0", "gx", "band")],
  },
  { place: "coast", job: { n: 6, k: "driver", w: 44 } },
);
TR(
  "containerport",
  "Container Terminal",
  "🏗️",
  5,
  4,
  28000,
  { plaza: "#bdbdbd", blocks: [], fx: "crane" },
  {
    place: "coast",
    job: { n: 40, k: "driver", w: 58 },
    desc: "Huge cranes: sea trade earns 20% more.",
  },
);
TR(
  "drydock",
  "Dry Dock",
  "⚓",
  4,
  3,
  16000,
  { plaza: "#9e9e9e", blocks: [], fx: "crane" },
  {
    place: "coast",
    job: { n: 24, k: "worker", w: 56 },
    desc: "Lets you commission the largest ships.",
  },
);
TR(
  "heliport",
  "City Heliport",
  "🚁",
  2,
  2,
  6000,
  {
    blocks: [
      B5(0.2, 0.2, 1.6, 1.6, 60, "#cfd8dc", "#455a64", "flat", "grid", {
        floors: 5,
      }),
    ],
    fx: "helipad",
  },
  { job: { n: 6, k: "driver", w: 60 } },
);
TR(
  "airstrip",
  "Regional Airstrip",
  "🛩️",
  8,
  2,
  9000,
  { blocks: [] },
  {
    job: { n: 6, k: "driver", w: 55 },
    desc: "A small runway with a hangar for prop planes.",
  },
);
TR(
  "terminal2",
  "Terminal 2",
  "🛫",
  5,
  3,
  24000,
  {
    blocks: [
      B5(0.2, 0.3, 4.6, 2.4, 34, "#e3f2fd", "#1565c0", "flat", "band", {
        floors: 2,
      }),
    ],
    text: "✈ TERMINAL 2",
    textBg: "#0d47a1",
  },
  { tour: 120, job: { n: 30, k: "clerk", w: 48 } },
);
TR(
  "jetbridge",
  "Jet Bridge Gate",
  "🛬",
  1,
  2,
  3000,
  {
    blocks: [B5(0.3, 0.2, 0.4, 1.6, 18, "#cfd8dc", "#90a4ae", "flat", "band")],
  },
  { job: { n: 2, k: "clerk", w: 40 } },
);
TR(
  "airporthotel",
  "Airport Hotel",
  "🏨",
  3,
  3,
  12000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 80, "#eceff1", "#455a64", "flat", "grid", {
        floors: 7,
      }),
    ],
    sign: "🛏️",
  },
  {
    venue: { need: "fun", price: 28, per: 12 },
    job: { n: 20, k: "clerk", w: 42 },
  },
);
TR(
  "atcradar",
  "ATC Radar",
  "📡",
  2,
  2,
  7000,
  { plaza: "#cfd8dc", blocks: [], fx: "radar" },
  { job: { n: 4, k: "scientist", w: 80, e: 2 } },
);
TR(
  "roundhouse",
  "Locomotive Roundhouse",
  "🚂",
  4,
  4,
  9000,
  {
    plaza: "#a1887f",
    blocks: [B5(0.3, 0.3, 3.4, 2.0, 30, "#8d6e63", "#4e342e", "gx", "garage")],
  },
  { job: { n: 18, k: "worker", w: 52 } },
);
TR(
  "freightyard",
  "Freight Yard",
  "🚃",
  6,
  3,
  12000,
  { plaza: "#bcaaa4", blocks: [] },
  { job: { n: 24, k: "driver", w: 50 } },
);
TR(
  "maglev",
  "Maglev Station",
  "🚄",
  3,
  4,
  40000,
  {
    plaza: "#eceff1",
    blocks: [
      B5(0.2, 0.3, 2.6, 3.4, 30, "#fafafa", "#00acc1", "dome", "band", {
        rh: 14,
      }),
    ],
  },
  { job: { n: 20, k: "driver", w: 80, e: 1 }, tour: 60 },
);
for (const t of ["metro", "busstation", "maglev"]) STATION_TYPES.push(t);

const INDUS = (t, name, icon, w, h, cost, art, o) =>
  asset(
    t,
    name,
    icon,
    "ind",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        job: {
          n: (o && o.jobs) || 20,
          k: (o && o.k) || "worker",
          w: (o && o.wage) || 52,
          e: (o && o.e) || 0,
        },
      },
      o || {},
    ),
  );
INDUS(
  "in_steel",
  "Steel Mill",
  "🏭",
  5,
  4,
  26000,
  {
    blocks: [B5(0.2, 0.3, 4.6, 3.2, 50, "#8d6e63", "#4e342e", "gx", "garage")],
    fx: "stacks",
  },
  { jobs: 60, pollute: true },
);
INDUS(
  "in_cars",
  "Car Factory",
  "🚗",
  6,
  4,
  40000,
  {
    blocks: [
      B5(0.2, 0.3, 5.6, 3.2, 40, "#eceff1", "#546e7a", "flat", "garage"),
    ],
  },
  { jobs: 90, wage: 64 },
);
INDUS(
  "in_chips",
  "Microchip Fab",
  "💾",
  4,
  4,
  52000,
  {
    blocks: [B5(0.3, 0.3, 3.4, 3.4, 36, "#fafafa", "#00838f", "flat", "band")],
  },
  { jobs: 50, k: "scientist", wage: 110, e: 2 },
);
INDUS(
  "in_sawmill",
  "Sawmill",
  "🪚",
  3,
  3,
  3200,
  {
    plaza: "#d7b98c",
    blocks: [B5(0.3, 0.3, 2.4, 1.6, 26, "#a1887f", "#5d4037", "gx", "garage")],
  },
  { jobs: 12, produce: { items: ["planks"], qty: 4, time: 60000 } },
);
INDUS(
  "in_brewery",
  "Brewery",
  "🍺",
  3,
  3,
  7000,
  {
    blocks: [B5(0.3, 0.3, 2.4, 2.4, 34, "#bcaaa4", "#4e342e", "gx", "grid")],
    chimney: [0.5, 0.5],
  },
  { jobs: 20 },
);
INDUS(
  "in_winery",
  "Winery",
  "🍷",
  4,
  3,
  8000,
  {
    lawn: "#9c27b0",
    blocks: [B5(0.3, 0.3, 2.4, 1.6, 26, "#efebe9", "#6a1b9a", "hip", "house")],
  },
  { jobs: 14, beauty: 4, tour: 20 },
);
INDUS(
  "in_food",
  "Food Processing Plant",
  "🥫",
  4,
  3,
  12000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 34, "#eceff1", "#c62828", "flat", "garage"),
    ],
  },
  { jobs: 36 },
);
INDUS(
  "in_recycle",
  "Recycling Center",
  "♻️",
  4,
  3,
  6000,
  {
    plaza: "#c8e6c9",
    blocks: [
      B5(0.2, 0.3, 2.6, 2.0, 26, "#a5d6a7", "#2e7d32", "flat", "garage"),
    ],
  },
  { jobs: 18, desc: "Cuts pollution in the surrounding area." },
);
INDUS(
  "in_landfill",
  "Landfill",
  "🗑️",
  5,
  5,
  2400,
  { plaza: "#8d6e63", blocks: [] },
  { jobs: 8, pollute: true },
);
INDUS(
  "in_incinerator",
  "Waste-to-Energy Plant",
  "🔥",
  3,
  3,
  14000,
  {
    blocks: [B5(0.3, 0.3, 2.4, 2.4, 40, "#9e9e9e", "#616161", "flat", "grid")],
    fx: "stacks",
  },
  { jobs: 18, power: 400, pollute: true },
);
INDUS(
  "in_datacenter",
  "Data Center",
  "🖥️",
  4,
  3,
  30000,
  {
    blocks: [B5(0.2, 0.3, 3.6, 2.4, 30, "#263238", "#00e5ff", "flat", "band")],
  },
  { jobs: 20, k: "scientist", wage: 120, e: 2 },
);
INDUS(
  "in_pharma",
  "Pharmaceutical Lab",
  "💊",
  4,
  3,
  24000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 40, "#fafafa", "#43a047", "flat", "band", {
        floors: 3,
      }),
    ],
  },
  { jobs: 30, k: "scientist", wage: 100, e: 2 },
);
INDUS(
  "in_oilrig",
  "Oil Rig",
  "🛢️",
  3,
  3,
  30000,
  { blocks: [], fx: "derrick" },
  { jobs: 30, place: "water", anyWater: true, wage: 80 },
);
INDUS(
  "in_textile2",
  "Garment Factory",
  "🧵",
  4,
  3,
  9000,
  { blocks: [B5(0.2, 0.3, 3.6, 2.4, 36, "#f3e5f5", "#6a1b9a", "gx", "grid")] },
  { jobs: 40, wage: 44 },
);
INDUS(
  "in_aerospace",
  "Aerospace Works",
  "✈️",
  6,
  5,
  70000,
  { plaza: "#9e9e9e", blocks: [], fx: "hangarArch" },
  { jobs: 80, k: "scientist", wage: 120, e: 2 },
);
INDUS(
  "in_shipworks",
  "Shipbuilding Yard",
  "🚢",
  6,
  4,
  50000,
  { plaza: "#9e9e9e", blocks: [], fx: "crane" },
  { jobs: 70, place: "coast", wage: 66 },
);
INDUS(
  "in_quarry2",
  "Granite Quarry",
  "⛏️",
  4,
  4,
  6000,
  { plaza: "#9e9e9e", blocks: [], fx: "quarry" },
  { jobs: 16, produce: { items: ["stone"], qty: 6, time: 60000 } },
);
INDUS(
  "in_brickplant",
  "Brick Plant",
  "🧱",
  4,
  3,
  9000,
  {
    blocks: [B5(0.2, 0.3, 3.6, 2.4, 30, "#bf6a45", "#6d4c41", "gx", "garage")],
    fx: "stacks",
  },
  {
    jobs: 24,
    produce: { items: ["bricks"], qty: 6, time: 60000 },
    desc: "Industrial-scale bricks: 6 every minute once staffed.",
  },
);
INDUS(
  "in_glassplant",
  "Float Glass Plant",
  "🪟",
  4,
  3,
  12000,
  {
    blocks: [B5(0.2, 0.3, 3.6, 2.4, 30, "#e1f5fe", "#0277bd", "flat", "band")],
  },
  { jobs: 22, produce: { items: ["glass"], qty: 4, time: 60000 } },
);
INDUS(
  "in_toolplant",
  "Tool Factory",
  "🛠️",
  4,
  3,
  14000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 30, "#cfd8dc", "#37474f", "flat", "garage"),
    ],
  },
  { jobs: 26, produce: { items: ["shovel"], qty: 2, time: 60000 } },
);

const HOME = (t, name, icon, w, h, cost, pop, art, o) =>
  asset(
    t,
    name,
    icon,
    "town",
    w,
    h,
    cost,
    art,
    Object.assign({ pop }, o || {}),
  );
HOME("h_tiny", "Tiny House", "🏠", 1, 1, 90, 2, {
  blocks: [
    B5(0.15, 0.2, 0.7, 0.6, 16, "#ffe0b2", "#6d4c41", "gy", "house", {
      rh: 12,
    }),
  ],
});
HOME("h_mobile", "Mobile Home Park", "🚐", 3, 3, 600, 14, {
  plaza: "#bdbdbd",
  blocks: [
    B5(0.2, 0.3, 1.2, 0.5, 12, "#eceff1", "#90a4ae", "flat", "house", {
      door: false,
    }),
    B5(1.6, 0.3, 1.2, 0.5, 12, "#fff3e0", "#90a4ae", "flat", "house", {
      door: false,
    }),
    B5(0.2, 1.6, 1.2, 0.5, 12, "#e3f2fd", "#90a4ae", "flat", "house", {
      door: false,
    }),
    B5(1.6, 1.6, 1.2, 0.5, 12, "#fce4ec", "#90a4ae", "flat", "house", {
      door: false,
    }),
  ],
});
HOME("h_rowhouses", "Row Houses", "🏘️", 4, 2, 900, 16, {
  blocks: [0, 1, 2, 3].map((k) =>
    B5(
      0.1 + k,
      0.3,
      0.9,
      1.4,
      30,
      ["#ffccbc", "#c5e1a5", "#b3e5fc", "#fff9c4"][k],
      "#6d4c41",
      "gx",
      "house",
      { floors: 2, rh: 12 },
    ),
  ),
});
HOME("h_brownstone", "Brownstones", "🏘️", 3, 2, 1400, 18, {
  blocks: [0, 1, 2].map((k) =>
    B5(0.1 + k, 0.3, 0.9, 1.4, 44, "#8d5a44", "#5d4037", "flat", "house", {
      floors: 3,
    }),
  ),
});
HOME("h_dorm", "Student Dorm", "🎓", 3, 2, 2400, 40, {
  blocks: [
    B5(0.2, 0.3, 2.6, 1.4, 50, "#ffe0b2", "#e65100", "flat", "grid", {
      floors: 4,
    }),
  ],
});
HOME("h_social", "Social Housing Block", "🏢", 3, 3, 3600, 70, {
  blocks: [
    B5(0.3, 0.3, 2.4, 2.4, 70, "#d7ccc8", "#795548", "flat", "grid", {
      floors: 6,
    }),
  ],
});
HOME("h_midrise", "Mid-rise Apartments", "🏢", 3, 3, 5200, 90, {
  blocks: [
    B5(0.3, 0.3, 2.4, 2.4, 80, "#eceff1", "#546e7a", "flat", "grid", {
      floors: 7,
    }),
  ],
});
HOME("h_retire", "Retirement Village", "🏡", 4, 4, 4200, 36, {
  lawn: "#aed581",
  blocks: [
    B5(0.2, 0.3, 1.6, 1.2, 20, "#fff8e1", "#8d6e63", "hip", "house"),
    B5(2.2, 0.3, 1.6, 1.2, 20, "#fff8e1", "#8d6e63", "hip", "house"),
    B5(0.2, 2.3, 1.6, 1.2, 20, "#fff8e1", "#8d6e63", "hip", "house"),
    B5(2.2, 2.3, 1.6, 1.2, 20, "#fff8e1", "#8d6e63", "hip", "house"),
  ],
});
HOME("h_penthouse", "Luxury Penthouse Tower", "🌆", 3, 3, 26000, 160, {
  blocks: [
    B5(0.3, 0.3, 2.4, 2.4, 180, "#263238", "#ffd54f", "flat", "grid", {
      floors: 16,
    }),
  ],
  fx: "glass",
});
HOME("h_megatower", "Mega Residential Tower", "🏙️", 4, 4, 60000, 500, {
  blocks: [
    B5(0.3, 0.3, 3.4, 3.4, 260, "#90a4ae", "#37474f", "flat", "grid", {
      floors: 24,
    }),
  ],
  fx: "glass",
});
HOME("h_suburb", "Suburban Home", "🏡", 2, 2, 420, 6, {
  lawn: "#9ccc65",
  blocks: [
    B5(0.25, 0.3, 1.5, 1.4, 24, "#fafafa", "#455a64", "gx", "house", {
      rh: 16,
    }),
  ],
  chimney: [1.3, 0.5],
});
HOME("h_farmstead", "Farmstead", "🏚️", 3, 3, 700, 8, {
  lawn: "#c5e1a5",
  blocks: [
    B5(0.3, 0.3, 1.6, 1.4, 24, "#fff3e0", "#b71c1c", "gx", "house", { rh: 16 }),
  ],
  fx: "park",
});
HOME("h_treehouse", "Treehouse Village", "🌳", 3, 3, 1800, 12, {
  lawn: "#9ccc65",
  blocks: [
    B5(0.6, 0.6, 1.0, 1.0, 40, "#a1887f", "#5d4037", "hip", "house", {
      z0: 26,
    }),
  ],
  fx: "park",
});

const DEC = (t, name, icon, cost, art, o) =>
  asset(
    t,
    name,
    icon,
    "deco",
    (o && o.w) || 1,
    (o && o.h) || 1,
    cost,
    art,
    Object.assign({ beauty: (o && o.beauty) || 1 }, o || {}),
  );
DEC("d_billboard", "Billboard", "🪧", 120, { blocks: [], fx: "billboard" });
DEC("d_phonebox", "Phone Box", "☎️", 60, {
  blocks: [
    B5(0.3, 0.3, 0.4, 0.4, 30, "#c62828", "#b71c1c", "flat", "none", {
      door: false,
    }),
  ],
});
DEC(
  "d_kiosk",
  "News Kiosk",
  "📰",
  150,
  { blocks: [B5(0.2, 0.2, 0.6, 0.6, 18, "#2e7d32", "#1b5e20", "hip", "shop")] },
  {
    venue: { need: "shop", price: 3, per: 6 },
    job: { n: 1, k: "clerk", w: 28 },
  },
);
DEC(
  "d_hotdog",
  "Hot Dog Cart",
  "🌭",
  140,
  {
    blocks: [
      B5(0.25, 0.3, 0.5, 0.4, 12, "#fff176", "#d32f2f", "flat", "none", {
        door: false,
      }),
    ],
  },
  {
    venue: { need: "food", price: 4, per: 8 },
    job: { n: 1, k: "chef", w: 28 },
  },
);
DEC(
  "d_icecart",
  "Ice Cream Cart",
  "🍨",
  140,
  {
    blocks: [
      B5(0.25, 0.3, 0.5, 0.4, 12, "#fce4ec", "#f06292", "flat", "none", {
        door: false,
      }),
    ],
  },
  {
    venue: { need: "food", price: 4, per: 8 },
    job: { n: 1, k: "chef", w: 28 },
  },
);
DEC(
  "d_planter",
  "Flower Planter",
  "🪴",
  30,
  { blocks: [], fx: "fountainmini" },
  { beauty: 2 },
);
DEC(
  "d_sculpture",
  "Modern Sculpture",
  "🗿",
  900,
  {
    plaza: "#eeeeee",
    blocks: [
      B5(0.35, 0.35, 0.3, 0.3, 44, "#ff7043", "#ff7043", "flat", "none", {
        door: false,
      }),
    ],
  },
  { beauty: 6 },
);
DEC(
  "d_memorial",
  "War Memorial",
  "🎖️",
  1800,
  {
    plaza: "#e0e0e0",
    blocks: [
      B5(0.3, 0.3, 0.4, 0.4, 60, "#eceff1", "#bdbdbd", "hip", "none", {
        door: false,
        rh: 10,
      }),
    ],
  },
  { beauty: 8 },
);
DEC(
  "d_clock",
  "Street Clock",
  "🕰️",
  220,
  {
    blocks: [
      B5(0.4, 0.4, 0.2, 0.2, 40, "#37474f", "#212121", "hip", "clock", {
        door: false,
        rh: 6,
      }),
    ],
  },
  { beauty: 2 },
);
DEC(
  "d_flagplaza",
  "Flag Plaza",
  "🏳️",
  600,
  {
    plaza: "#e0e0e0",
    blocks: [
      B5(0.3, 0.6, 1.4, 0.6, 6, "#e0e0e0", "#bdbdbd", "flat", "none", {
        door: false,
      }),
    ],
    fx: "flags",
  },
  { w: 2, h: 2, beauty: 5 },
);
DEC(
  "d_bandstand",
  "Bandstand",
  "🎺",
  1400,
  {
    lawn: "#9ccc65",
    blocks: [
      B5(0.3, 0.3, 1.4, 1.4, 22, "#fafafa", "#c62828", "hip", "none", {
        open: true,
      }),
    ],
  },
  { w: 2, h: 2, beauty: 6 },
);
DEC(
  "d_pond",
  "Duck Pond",
  "🦆",
  500,
  { lawn: "#9ccc65", blocks: [], fx: "oasis" },
  { w: 2, h: 2, beauty: 6 },
);

const MIL2 = (t, name, icon, w, h, cost, art, o) =>
  asset(
    t,
    name,
    icon,
    "mil",
    w,
    h,
    cost,
    art,
    Object.assign(
      {
        job: { n: (o && o.jobs) || 10, k: "soldier", w: (o && o.wage) || 60 },
        svc: "safety",
      },
      o || {},
    ),
  );
MIL2(
  "mil_airfield",
  "Military Airfield",
  "🛩️",
  10,
  4,
  60000,
  {
    plaza: "#8d8d8d",
    blocks: [
      B5(0.3, 0.3, 2.0, 1.6, 26, "#7d8471", "#4b5320", "flat", "garage"),
    ],
    fx: "flagpole2",
  },
  {
    jobs: 60,
    desc: "A runway for fighter squadrons - jets patrol your skies.",
  },
);
MIL2(
  "mil_carrier",
  "Carrier Dock",
  "🚢",
  6,
  4,
  90000,
  { plaza: "#90a4ae", blocks: [], fx: "warship" },
  { jobs: 80, place: "coast", desc: "Home port of an aircraft carrier." },
);
MIL2(
  "mil_subpen",
  "Submarine Pen",
  "⚓",
  4,
  3,
  30000,
  {
    blocks: [
      B5(0.2, 0.3, 3.6, 2.4, 24, "#78909c", "#455a64", "flat", "garage"),
    ],
  },
  { jobs: 30, place: "coast" },
);
MIL2(
  "mil_drones",
  "Drone Base",
  "🛸",
  3,
  3,
  14000,
  {
    plaza: "#9e9e9e",
    blocks: [B5(0.4, 0.4, 1.4, 1.2, 20, "#7d8471", "#4b5320", "flat", "band")],
    fx: "radar",
  },
  { jobs: 12, wage: 80 },
);
MIL2(
  "mil_academy",
  "Military Academy",
  "🎖️",
  4,
  4,
  18000,
  {
    lawn: "#9e9d6c",
    blocks: [
      B5(0.3, 0.3, 3.4, 2.0, 40, "#a1887f", "#4b5320", "hip", "grid", {
        floors: 3,
      }),
    ],
    fx: "flagpole2",
  },
  { jobs: 30, wage: 70 },
);
MIL2(
  "mil_hospital",
  "Army Hospital",
  "🏥",
  3,
  3,
  12000,
  {
    blocks: [
      B5(0.3, 0.3, 2.4, 2.4, 40, "#7d8471", "#e53935", "flat", "grid", {
        floors: 3,
      }),
    ],
  },
  { jobs: 24, svc: "health" },
);
MIL2(
  "mil_fort",
  "Star Fort",
  "🏰",
  6,
  6,
  26000,
  {
    plaza: "#a1887f",
    blocks: [
      B5(0.4, 0.4, 5.2, 5.2, 20, "#9e9e9e", "#757575", "flat", "none"),
      B5(2.2, 2.2, 1.6, 1.6, 40, "#a8a8a8", "#757575", "flat", "house", {
        z0: 20,
      }),
    ],
    crenelBlock: 0,
    banner: "#1565c0",
    fx: "crenel",
  },
  { jobs: 40, tour: 60 },
);
MIL2(
  "mil_aa",
  "Anti-Air Battery",
  "🎯",
  2,
  2,
  9000,
  { plaza: "#b0b39a", blocks: [], fx: "artillery" },
  { jobs: 6 },
);
MIL2(
  "mil_recruit",
  "Recruitment Office",
  "📢",
  2,
  2,
  1600,
  {
    blocks: [B5(0.25, 0.3, 1.5, 1.4, 26, "#7d8471", "#4b5320", "flat", "shop")],
    sign: "🪖",
  },
  { jobs: 4 },
);
MIL2(
  "mil_silo",
  "Missile Silo",
  "🚀",
  3,
  3,
  40000,
  { plaza: "#9e9e9e", blocks: [], fx: "missile" },
  { jobs: 12, wage: 90 },
);
MIL2(
  "mil_sentry",
  "Sentry Post",
  "💂",
  1,
  1,
  220,
  {
    blocks: [
      B5(0.25, 0.25, 0.5, 0.5, 26, "#7d8471", "#4b5320", "hip", "none", {
        rh: 8,
      }),
    ],
  },
  { jobs: 1 },
);

const govCount = (t) =>
  [...entsOf(t)].filter((e) => !e.build && !e.burnt).length;
const _settleBudget5 = settleBudget;
settleBudget = function () {
  const before = S.coins;
  _settleBudget5.apply(this, arguments);
  const gain = S.coins - before,
    tax = Math.min(3, govCount("gov_tax"));
  if (gain > 0 && tax) {
    const bonus = Math.round(gain * 0.1 * tax);
    S.coins += bonus;
    S.bud.inc += bonus;
  }
};
const _newDay5 = newDay;
newDay = function () {
  const r = _newDay5.apply(this, arguments);
  if (govCount("gov_bank")) {
    const i = Math.min(5000, Math.round(S.coins * 0.005));
    if (i > 0) {
      S.coins += i;
      news("🏦", `The Central Bank paid 🪙${fmt(i)} interest.`);
    }
  }
  if (govCount("gov_election") && ((dayNum() % 7) + 7) % 7 === 0) {
    const ap = CITY.hap;
    S.approval = ap;
    if (ap >= 60) {
      const prize = Math.round(500 + RES * 2);
      S.coins += prize;
      news(
        "🗳️",
        `Election day: you were re-elected with ${ap}% approval! Campaign donations: 🪙${fmt(prize)}.`,
        true,
      );
    } else
      news(
        "🗳️",
        `Election day: only ${ap}% approve of the council. Residents want more services and lower taxes.`,
        true,
      );
  }
  if (govCount("gov_social"))
    for (const p of S.people)
      if (p.k === "criminal" && !p.jail && Math.random() < 0.06) {
        p.k = "unemployed";
        lifeLog(p, "🤝", "Got help from social services");
      }
  return r;
};
const _targetHp5 = personTargetHp;
personTargetHp = function (p) {
  return clamp(
    _targetHp5(p) +
      (govCount("gov_parliament") ? 4 : 0) +
      Math.min(4, govCount("gov_cityhall") * 2),
    0,
    100,
  );
};
const _policeArrive5 = policeArrive;
policeArrive = function (inc) {
  _policeArrive5(inc);
  if (inc.p && inc.p.jail && govCount("gov_prison")) inc.p.jail += 2;
};

const _tryPlace5 = tryPlace;
tryPlace = function () {
  const t = mode.type === "place" && !mode.ent ? mode.t : null,
    n0 = t ? countOf(t) : 0;
  _tryPlace5();
  if (!t || countOf(t) <= n0 || !govCount("gov_planning") || !hasType("jobs"))
    return;
  S.openings = S.openings || {};
  S.jobNext = S.jobNext || {};
  const post = (role, n, why) => {
    S.openings[role] = (S.openings[role] || 0) + n;
    toastOnce(
      `📐 Planners posted ${n} ${ROLES[role].name} opening${n === 1 ? "" : "s"} (${why}).`,
      "info",
    );
  };
  if (FACTORY_TYPES.includes(t)) post("manager", 1, "new factory");
  else if (
    BUILD[t].animal &&
    S.workers.filter((w) => w.role === "rancher").length * 3 <
      [...ANIMAL_TYPES].reduce((a, k) => a + countOf(k), 0)
  )
    post("rancher", 1, "more animals");
  else if (
    t === "field" &&
    S.workers.filter((w) => w.role === "farmhand").length * 10 <
      countOf("field")
  )
    post("farmhand", 1, "more fields");
  else if (
    HOUSE_TYPES.includes(t) &&
    S.workers.filter((w) => w.role === "rentcollector").length * 25 <
      HOUSE_TYPES.reduce((a, k) => a + countOf(k), 0)
  )
    post("rentcollector", 1, "growing neighbourhood");
};

const CAT_HINTS = {
  gov: "🏛️ Run the city: courts, police HQ, prisons, tax office, central bank, parliament and city planners who post jobs for you.",
  sport:
    "⚽ From neighbourhood courts to Olympic stadiums - athletes work here and residents come to play and watch.",
  fun: "🎡 Places to have fun. Residents pay to visit, and the big ones bring tourists.",
  monument:
    "🗽 World-famous landmarks: huge tourism and beauty, and a few even light up at night.",
};
