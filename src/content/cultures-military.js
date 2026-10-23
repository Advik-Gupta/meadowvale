Object.assign(ART_FX, {
  finial(e) {
    const p = P(e.x + e.w / 2, e.y + e.h / 2, e.ht0 || BUILD[e.t].ht - 8);
    line(p, [p[0], p[1] - 12], "#c9a227", 2);
    circle(p[0], p[1] - 12, 2, "#ffd54f");
    return 0;
  },
  torii(e) {
    const red = "#c62828",
      dk = "#8e1b1b";
    for (const u of [0.18, 0.82])
      prism(e.x + u - 0.06, e.y + 0.45, 0.12, 0.12, 0, 40, null, red, dk);
    prism(
      e.x - 0.05,
      e.y + 0.42,
      1.1,
      0.18,
      40,
      44,
      "#222",
      "#2b2b2b",
      "#1b1b1b",
    );
    prism(e.x + 0.05, e.y + 0.44, 0.9, 0.14, 33, 36, null, red, dk);
    return 46;
  },
  zen(e) {
    for (let k = 0; k < 6; k++) {
      const a = P(e.x + 0.15, e.y + 0.2 + k * 0.28),
        b = P(e.x + e.w - 0.15, e.y + 0.2 + k * 0.28);
      line(a, b, "rgba(160,140,110,.45)", 1);
    }
    rockBlob(
      ...P(e.x + 0.6, e.y + 0.7),
      9,
      8,
      3,
      "#9ba1a7",
      "#7d838a",
      "#c9ced2",
    );
    rockBlob(
      ...P(e.x + 1.4, e.y + 1.3),
      6,
      6,
      9,
      "#9ba1a7",
      "#7d838a",
      "#c9ced2",
    );
    drawTree(e.x + 1.6, e.y + 0.4, 5, 22, e.id, 0.7);
    return 30;
  },
  minaret(e) {
    const x = e.x + e.w - 0.45,
      y = e.y + 0.15;
    prism(x, y, 0.3, 0.3, 4, 84, null, "#f3ead8", "#d9cfbc");
    prism(
      x - 0.04,
      y - 0.04,
      0.38,
      0.38,
      62,
      66,
      "#e0d6c2",
      "#cfc4ae",
      "#bdb29c",
    );
    const c = P(x + 0.15, y + 0.15, 84);
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], 6, 9, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = "#2e7d6b";
    ctx.fill();
    line([c[0], c[1] - 9], [c[0], c[1] - 16], "#c9a227", 1.5);
    circle(c[0], c[1] - 16, 1.6, "#ffd54f");
    return 100;
  },
  windtower(e) {
    prism(
      e.x + 0.25,
      e.y + 0.25,
      0.4,
      0.4,
      20,
      46,
      "#e3cfa6",
      "#d6bf92",
      "#c4ab7c",
    );
    for (const u of [0.3, 0.5, 0.7])
      faceL(
        e.x + 0.25,
        e.y + 0.25,
        0.4,
        0.4,
        u - 0.06,
        u + 0.06,
        36,
        44,
        "#6d4c41",
      );
    return 50;
  },
  oasis(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2);
    ellipse(c[0], c[1] + 2, 26, 11, "#c9b37a");
    ellipse(c[0], c[1] + 2, 20, 8, "#4fc3f7");
    ellipse(c[0] - 4, c[1], 8, 3, "rgba(255,255,255,.4)");
    drawTree(e.x + 0.3, e.y + 0.4, 4, 12, e.id, 1);
    drawTree(e.x + 1.7, e.y + 1.6, 4, 30, e.id + 1, 0.9);
    return 40;
  },
  timber(e) {
    const bl = BUILD[e.t].art.blocks[0],
      x = e.x + bl.x,
      y = e.y + bl.y,
      z0 = 4,
      z1 = bl.z,
      dark = "#4e342e";
    for (const u of [0.02, 0.33, 0.66, 0.98])
      faceL(x, y, bl.w, bl.h, u - 0.015, u + 0.015, z0, z1, dark);
    for (const zz of [z0 + (z1 - z0) * 0.5, z1 - 1]) {
      faceL(x, y, bl.w, bl.h, 0, 1, zz - 0.8, zz + 0.8, dark);
      faceR(x, y, bl.w, bl.h, 0, 1, zz - 0.8, zz + 0.8, dark);
    }
    for (const u of [0.02, 0.5, 0.98])
      faceR(x, y, bl.w, bl.h, u - 0.015, u + 0.015, z0, z1, dark);
    return 0;
  },
  crenel(e) {
    const a = BUILD[e.t].art,
      bl = a.blocks[a.crenelBlock || 0],
      x = e.x + bl.x,
      y = e.y + bl.y,
      z = bl.z;
    const n = Math.max(3, Math.round(bl.w * 3));
    for (let k = 0; k < n; k++)
      prism(
        x + (k * bl.w) / n,
        y + bl.h - 0.12,
        (bl.w / n) * 0.6,
        0.12,
        z,
        z + 5,
        "#cfc8bb",
        "#b8b0a2",
        "#a39b8d",
      );
    for (let k = 0; k < Math.max(3, Math.round(bl.h * 3)); k++)
      prism(
        x + bl.w - 0.12,
        y + (k * bl.h) / Math.max(3, Math.round(bl.h * 3)),
        0.12,
        (bl.h / Math.max(3, Math.round(bl.h * 3))) * 0.6,
        z,
        z + 5,
        "#cfc8bb",
        "#b8b0a2",
        "#a39b8d",
      );
    if (a.banner) {
      const p = P(x + bl.w / 2, y + bl.h / 2, z + 5);
      line(p, [p[0], p[1] - 22], "#5d4037", 1.5);
      poly(
        [
          [p[0], p[1] - 22],
          [p[0] + 12, p[1] - 18],
          [p[0], p[1] - 14],
        ],
        a.banner,
      );
    }
    return 30;
  },
  stilts(e) {
    for (const [u, v] of [
      [0.15, 0.15],
      [0.85, 0.15],
      [0.15, 0.85],
      [0.85, 0.85],
    ])
      prism(
        e.x + u * e.w - 0.04,
        e.y + v * e.h - 0.04,
        0.08,
        0.08,
        -4,
        12,
        null,
        "#6d4c41",
        "#5d4037",
      );
    return 0;
  },
  tiki(e) {
    for (const u of [0.25, 0.75]) {
      const p = P(e.x + u, e.y + 0.9);
      rr(p[0] - 3, p[1] - 22, 6, 22, 2, "#8d6e63");
      circle(p[0], p[1] - 18, 1.2, "#fff");
      circle(p[0] + 2, p[1] - 18, 1.2, "#fff");
      emojiAt([p[0], p[1] - 28], "🔥", 9);
    }
    return 30;
  },
  shikhara(e) {
    const c = [e.x + e.w / 2, e.y + e.h / 2];
    for (let k = 0; k < 5; k++) {
      const s = 0.9 - k * 0.15;
      prism(
        c[0] - s / 2,
        c[1] - s / 2,
        s,
        s,
        30 + k * 12,
        42 + k * 12,
        "#e0a96d",
        "#d4935a",
        "#c27f47",
      );
    }
    const p = P(c[0], c[1], 92);
    circle(p[0], p[1], 4, "#ffb300");
    line(p, [p[0], p[1] - 10], "#c9a227", 1.5);
    return 100;
  },
  stepwell(e) {
    for (let k = 0; k < 5; k++) {
      const i = 0.1 + k * 0.17;
      poly(
        diamond(e.x + i, e.y + i, e.w - i * 2, e.h - i * 2),
        shade("#d7b98c", -k * 0.07),
      );
    }
    poly(diamond(e.x + 0.95, e.y + 0.95, e.w - 1.9, e.h - 1.9), "#4fa3c7");
    return 10;
  },
  cactus(e) {
    for (const [u, v, h] of [
      [0.3, 0.4, 26],
      [0.75, 0.7, 18],
    ]) {
      const p = P(e.x + u, e.y + v);
      rr(p[0] - 3, p[1] - h, 6, h, 3, "#5a9b4a");
      rr(p[0] - 9, p[1] - h * 0.7, 6, 4, 2, "#5a9b4a");
      rr(p[0] - 9, p[1] - h * 0.95, 4, 10, 2, "#5a9b4a");
    }
    return 30;
  },
  glass(e) {
    const a = BUILD[e.t].art;
    for (const bl of a.blocks) {
      faceL(
        e.x + bl.x,
        e.y + bl.y,
        bl.w,
        bl.h,
        0.04,
        0.96,
        (bl.z0 || 4) + 2,
        bl.z - 2,
        "rgba(160,220,255,.35)",
      );
      faceR(
        e.x + bl.x,
        e.y + bl.y,
        bl.w,
        bl.h,
        0.04,
        0.96,
        (bl.z0 || 4) + 2,
        bl.z - 2,
        "rgba(120,190,240,.3)",
      );
    }
    return 0;
  },

  flagpole2(e) {
    const p = P(e.x + 0.3, e.y + 0.3, 4);
    line(p, [p[0], p[1] - 60], "#9e9e9e", 2);
    const w = Math.sin(T * 3 + e.id) * 2;
    poly(
      [
        [p[0], p[1] - 60],
        [p[0] + 18, p[1] - 56 + w],
        [p[0], p[1] - 50],
      ],
      "#2e7d32",
    );
    return 64;
  },
  tanks(e) {
    for (const [u, v] of [
      [0.7, 0.8],
      [1.6, 1.4],
      [2.3, 0.7],
    ])
      if (u < e.w && v < e.h) drawTank(e.x + u, e.y + v);
    return 20;
  },
  artillery(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2, 6);
    ellipse(c[0], c[1] + 4, 20, 8, "rgba(0,0,0,.2)");
    prism(
      e.x + 0.6,
      e.y + 0.6,
      0.8,
      0.8,
      0,
      8,
      "#6b7046",
      "#555a38",
      "#454a2c",
    );
    ctx.strokeStyle = "#3e4228";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c[0], c[1] - 6);
    ctx.lineTo(c[0] + 24, c[1] - 22);
    ctx.stroke();
    return 30;
  },
  radar(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2, 34),
      a = T * 1.6;
    prism(
      e.x + e.w / 2 - 0.12,
      e.y + e.h / 2 - 0.12,
      0.24,
      0.24,
      4,
      34,
      null,
      "#9e9e9e",
      "#757575",
    );
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.scale(Math.cos(a), 1);
    ctx.beginPath();
    ctx.ellipse(0, -8, 18, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#eceff1";
    ctx.fill();
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    if (nightAmt > 0.1) addGlow(c[0], c[1] - 24, 10, false);
    circle(c[0], c[1] - 24, 2, Math.floor(T * 2) % 2 ? "#ff1744" : "#b71c1c");
    return 60;
  },
  heli(e) {
    const c = P(e.x + e.w / 2, e.y + e.h / 2, 2);
    ellipse(c[0], c[1], 30, 14, "#5d6b4a");
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], 22, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawHeli(c[0], c[1] - 8, T * 18, "#4b5320");
    return 30;
  },
  hangarArch(e) {
    const x = e.x + 0.2,
      y = e.y + 0.2,
      w = e.w - 0.4,
      h = e.h - 0.4;
    for (let k = 0; k <= 8; k++) {
      const f = k / 8,
        zz = 6 + Math.sin(f * Math.PI) * 30;
      const a = P(x + f * w, y + h, 6),
        b = P(x + f * w, y + h, zz);
      void a;
      void b;
    }
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const f = k / 12;
      pts.push(P(x, y + h - f * h, 6 + Math.sin(f * Math.PI) * 30));
    }
    for (let k = 12; k >= 0; k--) {
      const f = k / 12;
      pts.push(P(x + w, y + h - f * h, 6 + Math.sin(f * Math.PI) * 30));
    }
    poly(pts, "#7d8471");
    const fr = [];
    for (let k = 0; k <= 12; k++) {
      const f = k / 12;
      fr.push(P(x + f * w, y + h, 6 + Math.sin(f * Math.PI) * 30));
    }
    fr.push(P(x + w, y + h, 4), P(x, y + h, 4));
    poly(fr, "#8d947f");
    const d = [];
    for (let k = 2; k <= 10; k++) {
      const f = k / 12;
      d.push(P(x + f * w, y + h, 4 + Math.sin(f * Math.PI) * 24));
    }
    d.push(P(x + (w * 10) / 12, y + h, 4), P(x + (w * 2) / 12, y + h, 4));
    poly(d, "#3b4034");
    return 40;
  },
  warship(e) {
    if (typeof drawShipModel === "function")
      drawShipModel(
        e.x + e.w / 2 + 0.6,
        e.y + e.h + 1.2,
        "navy",
        1,
        0,
        0.9,
        e.id,
      );
    return 20;
  },
  missile(e) {
    prism(
      e.x + 0.4,
      e.y + 0.4,
      1.2,
      1.2,
      0,
      6,
      "#6b7046",
      "#555a38",
      "#454a2c",
    );
    const c = P(e.x + 1, e.y + 1, 6),
      ang = -0.9;
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(ang);
    rr(-2, -40, 9, 40, 4, "#eceff1");
    poly(
      [
        [-2, -40],
        [2.5, -50],
        [7, -40],
      ],
      "#c62828",
    );
    ctx.restore();
    return 50;
  },
  obstacles(e) {
    for (let k = 0; k < 4; k++) {
      const p = P(e.x + 0.5 + k * 0.6, e.y + 0.6 + (k % 2) * 1.2);
      rr(p[0] - 8, p[1] - 10, 16, 3, 1, "#8d6e63");
      rr(p[0] - 8, p[1] - 10, 2, 10, 1, "#6d4c41");
      rr(p[0] + 6, p[1] - 10, 2, 10, 1, "#6d4c41");
    }
    for (let k = 0; k < 3; k++) {
      const p = P(e.x + 0.7 + k * 0.7, e.y + e.h - 0.6);
      circle(p[0], p[1] - 2, 3, "#4b5320");
    }
    return 16;
  },
  sandbags(e) {
    for (let k = 0; k < 6; k++) {
      const p = P(e.x + 0.1 + (k * (e.w - 0.2)) / 5, e.y + e.h - 0.15);
      ellipse(p[0], p[1] - 3, 5, 3, "#c2a878");
    }
    return 6;
  },
});
function drawTank(x, y) {
  prism(x - 0.35, y - 0.22, 0.7, 0.44, 0, 7, "#5b6136", "#4b5320", "#3c4219");
  prism(x - 0.2, y - 0.15, 0.36, 0.3, 7, 12, "#6b7046", "#555a38", "#454a2c");
  const a = P(x, y, 10),
    b = P(x + 0.55, y, 11);
  line(a, b, "#3c4219", 3);
}
function drawHeli(x, y, rot, col) {
  ellipse(x, y, 14, 7, col || "#4b5320");
  rr(x + 8, y - 2, 16, 3, 1, col || "#4b5320");
  rr(x - 8, y - 5, 8, 4, 2, "#90caf9");
  const r = 26;
  ctx.strokeStyle = "rgba(40,40,40,.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(rot) * r, y - 9 - Math.sin(rot) * 5);
  ctx.lineTo(x + Math.cos(rot) * r, y - 9 + Math.sin(rot) * 5);
  ctx.stroke();
}

const CULTURES = {
  japan: { name: "Japanese", icon: "🏯" },
  china: { name: "Chinese", icon: "🐉" },
  arabia: { name: "Arabian", icon: "🕌" },
  med: { name: "Mediterranean", icon: "🏛️" },
  nordic: { name: "Nordic", icon: "⛵" },
  medieval: { name: "Medieval", icon: "🏰" },
  india: { name: "Indian", icon: "🪔" },
  west: { name: "Wild West", icon: "🤠" },
  tropic: { name: "Tropical", icon: "🌺" },
  modern: { name: "Modern", icon: "🏙️" },
};

function cult(c, name, icon, kind, o) {
  const b = Object.assign(
    {
      name,
      icon,
      cat: "world",
      culture: c,
      w: 2,
      h: 2,
      level: 3,
      xp: 0,
      ht: 60,
    },
    o,
  );
  b.xp = b.xp || Math.max(2, Math.round((b.cost || 200) / 60));
  if (kind === "home") {
    b.rentTime = b.rentTime || 30000 + b.pop * 1500;
    b.rent = b.rent || Math.round(b.pop * 3.2);
  }
  if (kind === "shop")
    b.biz = {
      need: o.need,
      price: o.price || 12,
      job: o.job || { n: 3, k: "clerk", w: 36 },
      per: 6,
    };
  if (kind === "landmark") {
    b.tour = b.tour || Math.round((b.cost || 1000) / 120);
    b.cap = b.cap || Math.round((b.cost || 1000) / 40);
  }
  b.kind = kind;
  return b;
}
const B2 = (x, y, w, h, z, o) => BL(x, y, w, h, z, o);
const WORLD_BUILDINGS = {
  jp_machiya: cult("japan", "Machiya Townhouse", "🏠", "home", {
    cost: 260,
    level: 3,
    pop: 6,
    ht: 56,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 24, {
          wall: "#efe6d2",
          rc: "#37474f",
          roof: "hip",
          rh: 14,
          win: "house",
          door: true,
        }),
      ],
      fx: "timber",
    },
  }),
  jp_ryokan: cult("japan", "Ryokan Inn", "♨️", "shop", {
    cost: 1200,
    level: 8,
    need: "fun",
    price: 22,
    w: 3,
    h: 2,
    ht: 66,
    art: {
      lawn: "#8bc34a",
      blocks: [
        B2(0.2, 0.3, 2.6, 1.4, 26, {
          wall: "#f3ead8",
          rc: "#4e342e",
          roof: "hip",
          rh: 16,
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
      lanterns: true,
      fx: "lanterns",
    },
  }),
  jp_ramen: cult("japan", "Ramen Bar", "🍜", "shop", {
    cost: 520,
    level: 5,
    need: "food",
    price: 12,
    ht: 50,
    art: {
      blocks: [
        B2(0.3, 0.3, 1.4, 1.4, 24, {
          wall: "#3e2723",
          rc: "#b71c1c",
          roof: "gx",
          rh: 12,
          win: "shop",
          door: true,
        }),
      ],
      awn: ["#b71c1c", "#fff8e1"],
      sign: "🍜",
    },
  }),
  jp_shrine: cult("japan", "Shinto Shrine", "⛩️", "landmark", {
    cost: 1600,
    level: 9,
    ht: 70,
    art: {
      lawn: "#a5d6a7",
      blocks: [
        B2(0.5, 0.4, 1, 1.0, 22, {
          wall: "#c62828",
          rc: "#263238",
          roof: "gy",
          rh: 18,
          win: "none",
          door: true,
        }),
      ],
    },
  }),
  jp_pagoda: cult("japan", "Five-Story Pagoda", "🏯", "landmark", {
    cost: 4200,
    level: 14,
    ht: 130,
    art: {
      blocks: [
        B2(0.35, 0.35, 1.3, 1.3, 20, {
          wall: "#b71c1c",
          rc: "#37474f",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.45, 0.45, 1.1, 1.1, 40, {
          z0: 30,
          wall: "#b71c1c",
          rc: "#37474f",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.55, 0.55, 0.9, 0.9, 60, {
          z0: 50,
          wall: "#b71c1c",
          rc: "#37474f",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.62, 0.62, 0.76, 0.76, 80, {
          z0: 70,
          wall: "#b71c1c",
          rc: "#37474f",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.7, 0.7, 0.6, 0.6, 100, {
          z0: 90,
          wall: "#b71c1c",
          rc: "#37474f",
          roof: "hip",
          rh: 14,
          win: "none",
        }),
      ],
    },
  }),
  jp_torii: cult("japan", "Torii Gate", "⛩️", "decor", {
    cost: 160,
    level: 4,
    w: 1,
    h: 1,
    ht: 46,
    art: { blocks: [], fx: "torii" },
  }),
  jp_zen: cult("japan", "Zen Garden", "🪨", "decor", {
    cost: 300,
    level: 6,
    ht: 30,
    art: { plaza: "#e8dcc0", blocks: [], fx: "zen" },
  }),
  jp_castle: cult("japan", "Castle Keep", "🏯", "landmark", {
    cost: 9000,
    level: 20,
    w: 3,
    h: 3,
    ht: 150,
    art: {
      blocks: [
        B2(0.2, 0.2, 2.6, 2.6, 26, {
          wall: "#9e9e9e",
          rc: "#37474f",
          roof: "flat",
          win: "none",
        }),
        B2(0.55, 0.55, 1.9, 1.9, 56, {
          z0: 26,
          wall: "#fafafa",
          rc: "#455a64",
          roof: "hip",
          rh: 14,
          win: "grid",
          floors: 2,
        }),
        B2(0.85, 0.85, 1.3, 1.3, 90, {
          z0: 70,
          wall: "#fafafa",
          rc: "#455a64",
          roof: "hip",
          rh: 18,
          win: "house",
        }),
      ],
    },
  }),

  cn_siheyuan: cult("china", "Courtyard House", "🏮", "home", {
    cost: 600,
    level: 6,
    w: 3,
    h: 3,
    pop: 12,
    ht: 50,
    art: {
      plaza: "#d7ccc8",
      blocks: [
        B2(0.2, 0.2, 2.6, 0.9, 22, {
          wall: "#9e9e9e",
          rc: "#455a64",
          roof: "gx",
          rh: 12,
          win: "house",
        }),
        B2(0.2, 1.1, 0.9, 1.7, 20, {
          wall: "#9e9e9e",
          rc: "#455a64",
          roof: "gy",
          rh: 10,
          win: "house",
        }),
        B2(1.9, 1.1, 0.9, 1.7, 20, {
          wall: "#9e9e9e",
          rc: "#455a64",
          roof: "gy",
          rh: 10,
          win: "house",
          door: true,
        }),
      ],
      fx: "lanterns",
    },
  }),
  cn_pagoda: cult("china", "Lotus Pagoda", "🛕", "landmark", {
    cost: 3800,
    level: 13,
    ht: 120,
    art: {
      blocks: [
        B2(0.35, 0.35, 1.3, 1.3, 24, {
          wall: "#ffe082",
          rc: "#2e7d32",
          roof: "hip",
          rh: 10,
          win: "none",
          door: true,
        }),
        B2(0.48, 0.48, 1.04, 1.04, 46, {
          z0: 34,
          wall: "#ffe082",
          rc: "#2e7d32",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.6, 0.6, 0.8, 0.8, 68, {
          z0: 56,
          wall: "#ffe082",
          rc: "#2e7d32",
          roof: "hip",
          rh: 10,
          win: "none",
        }),
        B2(0.7, 0.7, 0.6, 0.6, 88, {
          z0: 78,
          wall: "#ffe082",
          rc: "#2e7d32",
          roof: "hip",
          rh: 14,
          win: "none",
        }),
      ],
    },
  }),
  cn_dimsum: cult("china", "Dim Sum House", "🥟", "shop", {
    cost: 700,
    level: 6,
    need: "food",
    price: 14,
    ht: 56,
    art: {
      blocks: [
        B2(0.3, 0.3, 1.4, 1.4, 28, {
          wall: "#c62828",
          rc: "#2e7d32",
          roof: "hip",
          rh: 14,
          win: "shop",
          door: true,
        }),
      ],
      sign: "🥟",
      fx: "lanterns",
    },
  }),
  cn_pavilion: cult("china", "Garden Pavilion", "⛩️", "decor", {
    cost: 420,
    level: 5,
    ht: 50,
    art: {
      lawn: "#9ccc65",
      blocks: [
        B2(0.4, 0.4, 1.2, 1.2, 24, {
          open: true,
          wall: "#c62828",
          rc: "#2e7d32",
          roof: "hip",
          rh: 14,
        }),
      ],
    },
  }),
  cn_moongate: cult("china", "Moon Gate Wall", "🌕", "decor", {
    cost: 220,
    level: 5,
    w: 2,
    h: 1,
    ht: 40,
    art: {
      blocks: [
        B2(0.05, 0.35, 1.9, 0.3, 30, {
          wall: "#eceff1",
          rc: "#455a64",
          roof: "gx",
          rh: 6,
          win: "none",
        }),
      ],
    },
  }),

  ar_house: cult("arabia", "Adobe House", "🏠", "home", {
    cost: 220,
    level: 3,
    pop: 5,
    ht: 44,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 24, {
          wall: "#e3c79a",
          rc: "#d4b483",
          roof: "flat",
          win: "house",
          door: true,
        }),
      ],
    },
  }),
  ar_windhouse: cult("arabia", "Wind-Tower House", "🏘️", "home", {
    cost: 480,
    level: 6,
    pop: 8,
    ht: 60,
    art: {
      blocks: [
        B2(0.2, 0.3, 1.6, 1.4, 28, {
          wall: "#ecd9b0",
          rc: "#dcc49a",
          roof: "flat",
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
      fx: "windtower",
    },
  }),
  ar_riad: cult("arabia", "Riad", "🕌", "home", {
    cost: 900,
    level: 9,
    w: 3,
    h: 3,
    pop: 14,
    ht: 56,
    art: {
      blocks: [
        B2(0.2, 0.2, 2.6, 2.6, 30, {
          wall: "#f0c9a0",
          rc: "#e0b88f",
          roof: "flat",
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
      fx: "oasis",
    },
  }),
  ar_mosque: cult("arabia", "Grand Mosque", "🕌", "landmark", {
    cost: 5200,
    level: 15,
    w: 3,
    h: 3,
    ht: 110,
    art: {
      plaza: "#efe3c8",
      blocks: [
        B2(0.3, 0.3, 2.2, 2.2, 34, {
          wall: "#f6efe2",
          rc: "#2e7d6b",
          roof: "dome",
          rh: 30,
          win: "columns",
          door: true,
        }),
      ],
      fx: "minaret",
    },
  }),
  ar_souk: cult("arabia", "Souk Bazaar", "🧺", "shop", {
    cost: 800,
    level: 7,
    need: "shop",
    price: 16,
    w: 3,
    h: 2,
    ht: 44,
    art: {
      blocks: [
        B2(0.15, 0.3, 2.7, 1.4, 22, {
          wall: "#e3c79a",
          rc: "#c0392b",
          roof: "flat",
          win: "shop",
          door: true,
        }),
      ],
      awn: ["#c0392b", "#f1c40f"],
      sign: "🧺",
    },
  }),
  ar_oasis: cult("arabia", "Oasis Pool", "🌴", "decor", {
    cost: 380,
    level: 5,
    ht: 40,
    art: { blocks: [], fx: "oasis" },
  }),

  gr_house: cult("med", "Cycladic House", "🏠", "home", {
    cost: 280,
    level: 4,
    pop: 6,
    ht: 50,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 26, {
          wall: "#ffffff",
          rc: "#1e88e5",
          roof: "dome",
          rh: 10,
          win: "house",
          door: true,
        }),
      ],
    },
  }),
  gr_villa: cult("med", "Terracotta Villa", "🏡", "home", {
    cost: 700,
    level: 8,
    w: 3,
    h: 2,
    pop: 10,
    ht: 58,
    art: {
      lawn: "#9ccc65",
      blocks: [
        B2(0.2, 0.3, 2.6, 1.4, 28, {
          wall: "#ffe0b2",
          rc: "#d84315",
          roof: "hip",
          rh: 14,
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
    },
  }),
  gr_temple: cult("med", "Marble Temple", "🏛️", "landmark", {
    cost: 6000,
    level: 16,
    w: 3,
    h: 3,
    ht: 80,
    art: {
      plaza: "#eeeeee",
      blocks: [
        B2(0.25, 0.25, 2.5, 2.5, 40, {
          wall: "#fafafa",
          rc: "#e0e0e0",
          roof: "gx",
          rh: 16,
          win: "columns",
        }),
      ],
    },
  }),
  gr_taverna: cult("med", "Taverna", "🫒", "shop", {
    cost: 620,
    level: 6,
    need: "food",
    price: 15,
    ht: 54,
    art: {
      blocks: [
        B2(0.3, 0.3, 1.4, 1.4, 26, {
          wall: "#ffffff",
          rc: "#1565c0",
          roof: "flat",
          win: "shop",
          door: true,
        }),
      ],
      awn: ["#1565c0", "#ffffff"],
      sign: "🫒",
    },
  }),
  gr_chapel: cult("med", "Blue-Dome Chapel", "⛪", "landmark", {
    cost: 1800,
    level: 10,
    ht: 80,
    art: {
      blocks: [
        B2(0.35, 0.35, 1.3, 1.3, 30, {
          wall: "#ffffff",
          rc: "#1e88e5",
          roof: "dome",
          rh: 20,
          win: "house",
          door: true,
        }),
      ],
    },
  }),
  it_campanile: cult("med", "Bell Tower", "🔔", "landmark", {
    cost: 2400,
    level: 12,
    w: 1,
    h: 1,
    ht: 140,
    art: {
      blocks: [
        B2(0.1, 0.1, 0.8, 0.8, 110, {
          wall: "#d7a77a",
          rc: "#bf5f2e",
          roof: "hip",
          rh: 22,
          win: "grid",
          floors: 6,
        }),
      ],
    },
  }),

  no_cabin: cult("nordic", "Timber Cabin", "🛖", "home", {
    cost: 240,
    level: 3,
    pop: 5,
    ht: 52,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 22, {
          wall: "#b23a2c",
          rc: "#37474f",
          roof: "gx",
          rh: 22,
          win: "house",
          door: true,
        }),
      ],
      chimney: [0.4, 0.5],
    },
  }),
  no_longhouse: cult("nordic", "Longhouse", "🏚️", "home", {
    cost: 520,
    level: 6,
    w: 3,
    h: 2,
    pop: 9,
    ht: 54,
    art: {
      blocks: [
        B2(0.15, 0.35, 2.7, 1.3, 18, {
          wall: "#6d4c41",
          rc: "#8d6e63",
          roof: "gx",
          rh: 26,
          win: "house",
          door: true,
        }),
      ],
    },
  }),
  no_stave: cult("nordic", "Stave Church", "⛪", "landmark", {
    cost: 2600,
    level: 11,
    ht: 120,
    art: {
      blocks: [
        B2(0.3, 0.3, 1.4, 1.4, 26, {
          wall: "#4e342e",
          rc: "#3e2723",
          roof: "hip",
          rh: 18,
          win: "none",
          door: true,
        }),
        B2(0.55, 0.55, 0.9, 0.9, 52, {
          z0: 42,
          wall: "#4e342e",
          rc: "#3e2723",
          roof: "hip",
          rh: 18,
          win: "none",
        }),
        B2(0.75, 0.75, 0.5, 0.5, 80, {
          z0: 68,
          wall: "#4e342e",
          rc: "#3e2723",
          roof: "hip",
          rh: 26,
          win: "none",
        }),
      ],
    },
  }),
  no_sauna: cult("nordic", "Lakeside Sauna", "🧖", "shop", {
    cost: 520,
    level: 6,
    need: "care",
    price: 12,
    ht: 44,
    art: {
      blocks: [
        B2(0.35, 0.35, 1.3, 1.2, 20, {
          wall: "#8d6e63",
          rc: "#4e342e",
          roof: "gy",
          rh: 12,
          win: "house",
          door: true,
        }),
      ],
      chimney: [0.6, 0.5],
    },
  }),

  md_timber: cult("medieval", "Timber-Frame House", "🏠", "home", {
    cost: 300,
    level: 4,
    pop: 7,
    ht: 62,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 32, {
          wall: "#f4ecd8",
          rc: "#795548",
          roof: "gx",
          rh: 22,
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
      fx: "timber",
      chimney: [1.3, 0.5],
    },
  }),
  md_tavern: cult("medieval", "Tavern", "🍺", "shop", {
    cost: 680,
    level: 6,
    need: "fun",
    price: 11,
    ht: 64,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 30, {
          wall: "#efe0c4",
          rc: "#5d4037",
          roof: "gx",
          rh: 20,
          win: "house",
          door: true,
          floors: 2,
        }),
      ],
      fx: "timber",
      sign: "🍺",
      chimney: [0.4, 0.5],
    },
  }),
  md_chapel: cult("medieval", "Stone Chapel", "⛪", "landmark", {
    cost: 1900,
    level: 9,
    ht: 96,
    art: {
      blocks: [
        B2(0.3, 0.45, 1.4, 1.2, 28, {
          wall: "#bdbdbd",
          rc: "#546e7a",
          roof: "gx",
          rh: 18,
          win: "house",
          door: true,
        }),
        B2(0.3, 0.2, 0.5, 0.5, 70, {
          wall: "#bdbdbd",
          rc: "#546e7a",
          roof: "hip",
          rh: 22,
          win: "none",
        }),
      ],
    },
  }),
  md_castle: cult("medieval", "Castle Keep", "🏰", "landmark", {
    cost: 11000,
    level: 22,
    w: 4,
    h: 4,
    ht: 140,
    art: {
      plaza: "#bcaaa4",
      blocks: [
        B2(0.2, 0.2, 3.6, 3.6, 30, {
          wall: "#9e9e9e",
          rc: "#757575",
          roof: "flat",
          win: "none",
        }),
        B2(1.0, 1.0, 2.0, 2.0, 80, {
          z0: 30,
          wall: "#a8a8a8",
          rc: "#757575",
          roof: "flat",
          win: "house",
          floors: 3,
        }),
      ],
      crenelBlock: 1,
      banner: "#c62828",
      fx: "crenel",
    },
  }),
  md_well: cult("medieval", "Village Well", "🪣", "decor", {
    cost: 120,
    level: 3,
    w: 1,
    h: 1,
    ht: 30,
    art: {
      blocks: [
        B2(0.25, 0.25, 0.5, 0.5, 10, {
          wall: "#9e9e9e",
          rc: "#6d4c41",
          roof: "gx",
          rh: 14,
          win: "none",
        }),
      ],
    },
  }),

  in_haveli: cult("india", "Haveli Mansion", "🏰", "home", {
    cost: 1100,
    level: 10,
    w: 3,
    h: 3,
    pop: 16,
    ht: 70,
    art: {
      blocks: [
        B2(0.2, 0.2, 2.6, 2.6, 40, {
          wall: "#ffb74d",
          rc: "#ef6c00",
          roof: "flat",
          win: "house",
          door: true,
          floors: 3,
        }),
      ],
      fx: "lanterns",
    },
  }),
  in_temple: cult("india", "Shikhara Temple", "🛕", "landmark", {
    cost: 4800,
    level: 14,
    w: 3,
    h: 3,
    ht: 110,
    art: {
      plaza: "#f3e0c2",
      blocks: [
        B2(0.4, 0.4, 2.2, 2.2, 30, {
          wall: "#e0a96d",
          rc: "#c27f47",
          roof: "flat",
          win: "columns",
          door: true,
        }),
      ],
      fx: "shikhara",
    },
  }),
  in_stepwell: cult("india", "Stepwell", "🪜", "landmark", {
    cost: 2200,
    level: 12,
    w: 3,
    h: 3,
    ht: 14,
    art: { blocks: [], fx: "stepwell" },
  }),
  in_chai: cult("india", "Chai Stall", "🫖", "shop", {
    cost: 260,
    level: 4,
    need: "food",
    price: 5,
    w: 1,
    h: 1,
    ht: 36,
    job: { n: 1, k: "chef", w: 28 },
    art: {
      blocks: [
        B2(0.15, 0.2, 0.7, 0.6, 16, {
          wall: "#ffcc80",
          rc: "#e65100",
          roof: "flat",
          win: "shop",
        }),
      ],
      awn: ["#e65100", "#fff3e0"],
    },
  }),

  ww_ranch: cult("west", "Ranch House", "🏠", "home", {
    cost: 260,
    level: 3,
    pop: 5,
    ht: 48,
    art: {
      blocks: [
        B2(0.2, 0.3, 1.6, 1.4, 22, {
          wall: "#bcaaa4",
          rc: "#6d4c41",
          roof: "gx",
          rh: 14,
          win: "house",
          door: true,
        }),
      ],
      fx: "cactus",
    },
  }),
  ww_saloon: cult("west", "Saloon", "🤠", "shop", {
    cost: 700,
    level: 6,
    need: "fun",
    price: 12,
    ht: 64,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 34, {
          wall: "#a1887f",
          rc: "#5d4037",
          roof: "flat",
          win: "shop",
          door: true,
          floors: 2,
        }),
      ],
      text: "SALOON",
      textBg: "#4e342e",
    },
  }),
  ww_sheriff: cult("west", "Sheriff's Office", "⭐", "civic", {
    cost: 900,
    level: 6,
    ht: 52,
    cap: 40,
    art: {
      blocks: [
        B2(0.3, 0.3, 1.4, 1.4, 26, {
          wall: "#d7ccc8",
          rc: "#795548",
          roof: "flat",
          win: "shop",
          door: true,
        }),
      ],
      text: "SHERIFF",
      textBg: "#795548",
    },
  }),
  ww_store: cult("west", "General Store", "🛒", "shop", {
    cost: 480,
    level: 4,
    need: "shop",
    price: 10,
    ht: 54,
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 28, {
          wall: "#c8a97e",
          rc: "#6d4c41",
          roof: "flat",
          win: "shop",
          door: true,
        }),
      ],
      text: "GENERAL",
      textBg: "#33691e",
    },
  }),
  ww_watertower: cult("west", "Water Tank Tower", "🛢️", "decor", {
    cost: 300,
    level: 5,
    w: 1,
    h: 1,
    ht: 70,
    art: { blocks: [], fx: "tank" },
  }),

  tp_stilt: cult("tropic", "Stilt Hut", "🛖", "home", {
    cost: 220,
    level: 3,
    pop: 4,
    ht: 46,
    place: "shore",
    art: {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 24, {
          z0: 10,
          wall: "#d7b98c",
          rc: "#a1887f",
          roof: "hip",
          rh: 18,
          win: "house",
          door: true,
        }),
      ],
      fx: "stilts",
    },
  }),
  tp_bungalow: cult("tropic", "Beach Bungalow", "🏝️", "home", {
    cost: 420,
    level: 6,
    pop: 6,
    ht: 46,
    art: {
      lawn: "#ffe082",
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 22, {
          wall: "#fff8e1",
          rc: "#8d6e63",
          roof: "hip",
          rh: 16,
          win: "house",
          door: true,
        }),
      ],
    },
  }),
  tp_tikibar: cult("tropic", "Tiki Bar", "🍹", "shop", {
    cost: 560,
    level: 6,
    need: "fun",
    price: 13,
    ht: 46,
    art: {
      lawn: "#ffe082",
      blocks: [
        B2(0.35, 0.35, 1.3, 1.3, 20, {
          open: true,
          wall: "#8d6e63",
          rc: "#a1887f",
          roof: "hip",
          rh: 16,
        }),
      ],
      fx: "tiki",
    },
  }),

  mo_villa: cult("modern", "Glass Villa", "🏡", "home", {
    cost: 1400,
    level: 12,
    w: 3,
    h: 2,
    pop: 8,
    ht: 54,
    art: {
      lawn: "#9ccc65",
      blocks: [
        B2(0.2, 0.3, 2.0, 1.4, 22, {
          wall: "#eceff1",
          rc: "#455a64",
          roof: "flat",
          win: "band",
          door: true,
        }),
        B2(1.0, 0.4, 1.8, 1.2, 40, {
          z0: 22,
          wall: "#fafafa",
          rc: "#455a64",
          roof: "flat",
          win: "band",
        }),
      ],
      fx: "glass",
    },
  }),
  mo_loft: cult("modern", "Loft Apartments", "🏢", "home", {
    cost: 3200,
    level: 16,
    pop: 40,
    ht: 110,
    art: {
      blocks: [
        B2(0.2, 0.2, 1.6, 1.6, 90, {
          wall: "#bcaaa4",
          rc: "#5d4037",
          roof: "green",
          win: "grid",
          door: true,
          floors: 7,
        }),
      ],
    },
  }),
  mo_tower: cult("modern", "Glass Skyscraper", "🌆", "home", {
    cost: 12000,
    level: 28,
    pop: 260,
    ht: 230,
    art: {
      blocks: [
        B2(0.2, 0.2, 1.6, 1.6, 200, {
          wall: "#90a4ae",
          rc: "#37474f",
          roof: "flat",
          win: "grid",
          door: true,
          floors: 18,
        }),
      ],
      fx: "glass",
    },
  }),
  mo_dome: cult("modern", "Eco Biodome", "🌐", "landmark", {
    cost: 7000,
    level: 20,
    w: 3,
    h: 3,
    ht: 70,
    art: {
      lawn: "#81c784",
      blocks: [
        B2(0.3, 0.3, 2.4, 2.4, 10, {
          wall: "#c8e6c9",
          rc: "#81d4fa",
          roof: "dome",
          rh: 44,
          win: "none",
        }),
      ],
    },
  }),
  mo_gallery: cult("modern", "Modern Art Gallery", "🖼️", "shop", {
    cost: 2600,
    level: 14,
    need: "fun",
    price: 18,
    w: 3,
    h: 2,
    ht: 50,
    job: { n: 4, k: "artist", w: 55, e: 1 },
    art: {
      blocks: [
        B2(0.2, 0.3, 1.5, 1.4, 30, {
          wall: "#fafafa",
          rc: "#212121",
          roof: "flat",
          win: "band",
          door: true,
        }),
        B2(1.5, 0.5, 1.3, 1.2, 20, {
          wall: "#212121",
          rc: "#fafafa",
          roof: "flat",
          win: "none",
        }),
      ],
    },
  }),
};
Object.assign(BUILD, WORLD_BUILDINGS);
for (const t in WORLD_BUILDINGS) {
  const b = WORLD_BUILDINGS[t];
  DRAW[t] = drawArt;
  if (b.kind === "home") HOUSE_TYPES.push(t);
  if (b.kind === "landmark" || b.kind === "decor")
    BEAUTY[t] = b.kind === "landmark" ? 6 : 2;
  if (b.kind === "civic") SERVICES.safety.types.push(t);
}

PERSONAS.soldier = { name: "Soldier", icon: "🪖" };
const MIL = (name, icon, level, cost, w, h, ht, art, desc, o) =>
  Object.assign(
    {
      name,
      icon,
      cat: "mil",
      w,
      h,
      cost,
      level,
      xp: Math.round(cost / 70),
      ht,
      art,
      desc,
    },
    o || {},
  );
Object.assign(BUILD, {
  mil_wall: MIL(
    "Defense Wall",
    "🧱",
    5,
    40,
    1,
    1,
    30,
    {
      blocks: [
        B2(0, 0.2, 1, 0.6, 22, {
          wall: "#a1887f",
          rc: "#8d8478",
          roof: "flat",
          win: "none",
        }),
      ],
      fx: "crenel",
    },
    "Fortified stone wall - drag to build long walls.",
    { multi: true },
  ),
  mil_gate: MIL(
    "Fortress Gate",
    "🚪",
    6,
    400,
    2,
    1,
    48,
    {
      blocks: [
        B2(0, 0.15, 0.5, 0.7, 40, {
          wall: "#9e9e9e",
          rc: "#757575",
          roof: "flat",
          win: "none",
        }),
        B2(1.5, 0.15, 0.5, 0.7, 40, {
          wall: "#9e9e9e",
          rc: "#757575",
          roof: "flat",
          win: "none",
        }),
        B2(0.5, 0.25, 1, 0.5, 40, {
          z0: 26,
          wall: "#8d8d8d",
          rc: "#757575",
          roof: "flat",
          win: "none",
        }),
      ],
      banner: "#2e7d32",
      fx: "crenel",
    },
    "A gate through your walls (roads pass under it).",
  ),
  mil_tower: MIL(
    "Watchtower",
    "🗼",
    6,
    350,
    1,
    1,
    90,
    {
      blocks: [
        B2(0.15, 0.15, 0.7, 0.7, 70, {
          wall: "#8d8d8d",
          rc: "#616161",
          roof: "hip",
          rh: 16,
          win: "grid",
          floors: 4,
        }),
      ],
    },
    "Guards keep watch over the nearby streets.",
    { job: { n: 2, k: "soldier", w: 50 } },
  ),
  mil_barracks: MIL(
    "Army Barracks",
    "🪖",
    8,
    1600,
    3,
    2,
    56,
    {
      blocks: [
        B2(0.15, 0.3, 2.7, 1.4, 26, {
          wall: "#7d8471",
          rc: "#4b5320",
          roof: "gx",
          rh: 12,
          win: "house",
          door: true,
        }),
      ],
      fx: "flagpole2",
    },
    "Home of the town garrison. Soldiers patrol and keep crime down.",
    { job: { n: 12, k: "soldier", w: 55 } },
  ),
  mil_hq: MIL(
    "Military HQ",
    "🎖️",
    14,
    5200,
    3,
    3,
    80,
    {
      plaza: "#b0b39a",
      blocks: [
        B2(0.3, 0.3, 2.4, 2.4, 40, {
          wall: "#8d947f",
          rc: "#4b5320",
          roof: "flat",
          win: "grid",
          door: true,
          floors: 3,
        }),
      ],
      fx: "flagpole2",
    },
    "Command centre. Holds a military parade every weekend.",
    { job: { n: 10, k: "soldier", w: 75, e: 1 } },
  ),
  mil_bunker: MIL(
    "Bunker",
    "🛡️",
    9,
    900,
    2,
    2,
    26,
    {
      blocks: [
        B2(0.25, 0.25, 1.5, 1.5, 12, {
          wall: "#9e9e9e",
          rc: "#7b7b7b",
          roof: "green",
          win: "none",
          door: true,
        }),
      ],
      fx: "sandbags",
    },
    "A reinforced shelter.",
    { job: { n: 3, k: "soldier", w: 50 } },
  ),
  mil_armory: MIL(
    "Armory",
    "🗃️",
    10,
    1400,
    2,
    2,
    48,
    {
      blocks: [
        B2(0.25, 0.3, 1.5, 1.4, 26, {
          wall: "#6b7046",
          rc: "#3c4219",
          roof: "flat",
          win: "garage",
          door: true,
        }),
      ],
    },
    "Stores equipment for the garrison.",
    { job: { n: 4, k: "soldier", w: 55 } },
  ),
  mil_tankdepot: MIL(
    "Tank Depot",
    "🛡️",
    16,
    4800,
    3,
    3,
    40,
    {
      plaza: "#a1a58a",
      blocks: [
        B2(0.2, 0.2, 1.2, 1.0, 26, {
          wall: "#6b7046",
          rc: "#3c4219",
          roof: "flat",
          win: "garage",
        }),
      ],
      fx: "tanks",
    },
    "Armoured vehicles parked and ready.",
    { job: { n: 8, k: "soldier", w: 65 } },
  ),
  mil_artillery: MIL(
    "Artillery Battery",
    "💥",
    15,
    2600,
    2,
    2,
    34,
    { plaza: "#b0b39a", blocks: [], fx: "artillery" },
    "Coastal defense guns.",
    { job: { n: 4, k: "soldier", w: 60 } },
  ),
  mil_radar: MIL(
    "Radar Station",
    "📡",
    17,
    3400,
    2,
    2,
    64,
    { plaza: "#cfd8dc", blocks: [], fx: "radar" },
    "Watches the skies (and spots storms early).",
    { job: { n: 4, k: "scientist", w: 80, e: 2 } },
  ),
  mil_helibase: MIL(
    "Helicopter Base",
    "🚁",
    18,
    5600,
    3,
    3,
    40,
    { plaza: "#9e9e9e", blocks: [], fx: "heli" },
    "Military helicopters patrol over your town.",
    { job: { n: 6, k: "soldier", w: 70, e: 1 } },
  ),
  mil_hangar: MIL(
    "Jet Hangar",
    "✈️",
    22,
    9000,
    4,
    4,
    50,
    { plaza: "#8d8d8d", blocks: [], fx: "hangarArch" },
    "Fighter jets fly patrols - sometimes right over your city.",
    { job: { n: 10, k: "soldier", w: 85, e: 1 } },
  ),
  mil_naval: MIL(
    "Naval Base",
    "⚓",
    20,
    8000,
    3,
    3,
    50,
    {
      plaza: "#b0bec5",
      blocks: [
        B2(0.2, 0.2, 1.6, 1.4, 30, {
          wall: "#90a4ae",
          rc: "#37474f",
          roof: "flat",
          win: "grid",
          door: true,
          floors: 2,
        }),
      ],
      fx: "warship",
    },
    "Warships guard the coast. Must touch water.",
    { place: "coast", job: { n: 12, k: "soldier", w: 70 } },
  ),
  mil_missile: MIL(
    "Missile Defense",
    "🚀",
    26,
    7600,
    2,
    2,
    50,
    { plaza: "#b0b39a", blocks: [], fx: "missile" },
    "The last line of defense.",
    { job: { n: 4, k: "soldier", w: 80, e: 1 } },
  ),
  mil_training: MIL(
    "Training Grounds",
    "🏃",
    9,
    1200,
    3,
    3,
    20,
    { lawn: "#9e9d6c", blocks: [], fx: "obstacles" },
    "Recruits train here - boosts soldiers and athletes.",
    { job: { n: 3, k: "soldier", w: 50 } },
  ),
});
for (const t of Object.keys(BUILD).filter((k) => BUILD[k].cat === "mil")) {
  DRAW[t] = drawArt;
  const b = BUILD[t];
  if (b.job) JOBS[t] = b.job;
  if (t !== "mil_wall") SERVICES.safety.types.push(t);
}
BEAUTY.mil_wall = 0;

for (const t in BUILD) delete BUILD[t].max;

const ANY_SURFACE = [
  "road",
  "stoneroad",
  "brickroad",
  "dirtpath",
  "plaza",
  "rail",
  "bridge",
];
for (const t of ANY_SURFACE) if (BUILD[t]) BUILD[t].anySurface = true;
const _placeOK4 = placeOK;
placeOK = function (t, x, y, ign, W, H) {
  const b = BUILD[t];
  if (b && b.anySurface) {
    for (let j = 0; j < (H || b.h); j++)
      for (let i = 0; i < (W || b.w); i++) {
        const o = world.occ.get(tkey(x + i, y + j));
        if (o != null && o !== ign) return false;
      }
    return true;
  }
  if (b && b.place === "shore") {
    if (!canPlace(x, y, b.w, b.h, ign)) return false;
    for (let j = -2; j <= b.h + 1; j++)
      for (let i = -2; i <= b.w + 1; i++)
        if (isWater(x + i, y + j)) return true;
    return false;
  }
  return _placeOK4(t, x, y, ign, W, H);
};

function waterDeck(e, col) {
  const x = e.x,
    y = e.y;
  for (const [u, v] of [
    [0.2, 0.2],
    [0.8, 0.8],
    [0.2, 0.8],
    [0.8, 0.2],
  ]) {
    const p = P(x + u, y + v);
    rr(p[0] - 1.5, p[1] - 2, 3, 9, 1, "#6d6d6d");
  }
  poly(
    [P(x, y + 1, 4), P(x + 1, y + 1, 4), P(x + 1, y + 1, 0), P(x, y + 1, 0)],
    shade(col, -0.25),
  );
  poly(
    [P(x + 1, y, 4), P(x + 1, y + 1, 4), P(x + 1, y + 1, 0), P(x + 1, y, 0)],
    shade(col, -0.35),
  );
}
for (const t of ANY_SURFACE) {
  const f = FLAT[t];
  if (!f || t === "bridge") continue;
  FLAT[t] = (e) => {
    if (!THUMB && isWater(e.x, e.y)) {
      waterDeck(e, t === "rail" ? "#8d6e63" : "#9e9e9e");
      ctx.save();
      ctx.translate(0, -4);
      f(e);
      ctx.restore();
      if (t !== "rail") {
        const a = P(e.x, e.y + 1, 9),
          b = P(e.x + 1, e.y + 1, 9);
        line(a, b, "#cfd8dc", 1.5);
      }
      return;
    }
    f(e);
  };
}
