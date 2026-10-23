function oprism(cx, cy, hx, hy, L, W, z0, z1, top, cL, cR) {
  const nx = -hy,
    ny = hx,
    l = L / 2,
    w = W / 2;
  const pts = [
    [cx + hx * l + nx * w, cy + hy * l + ny * w],
    [cx + hx * l - nx * w, cy + hy * l - ny * w],
    [cx - hx * l - nx * w, cy - hy * l - ny * w],
    [cx - hx * l + nx * w, cy - hy * l + ny * w],
  ];
  for (let i = 0; i < 4; i++) {
    const a = pts[i],
      b = pts[(i + 1) % 4],
      mx = (a[0] + b[0]) / 2 - cx,
      my = (a[1] + b[1]) / 2 - cy;
    if (mx + my <= 0.0001) continue;
    const col = my > mx ? cL : cR;
    if (col)
      poly(
        [
          P(a[0], a[1], z0),
          P(b[0], b[1], z0),
          P(b[0], b[1], z1),
          P(a[0], a[1], z1),
        ],
        col,
      );
  }
  if (top)
    poly(
      pts.map(([x, y]) => P(x, y, z1)),
      top,
    );
  return pts;
}
function headingOf(path, i) {
  const a = path[Math.max(0, i - 1)],
    b = path[Math.min(path.length - 1, i + 1)];
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}

function alongPath(path, s) {
  s = clamp(s, 0, path.length - 1);
  const i = Math.floor(s),
    f = s - i,
    a = path[i],
    b = path[Math.min(i + 1, path.length - 1)];
  const [hx, hy] = headingOf(path, i + (f > 0.5 ? 1 : 0));
  return [
    a[0] + (b[0] - a[0]) * f + 0.5,
    a[1] + (b[1] - a[1]) * f + 0.5,
    hx,
    hy,
  ];
}

const TRAIN_LIVERY = [
  ["#c62828", "#eceff1"],
  ["#1565c0", "#e3f2fd"],
  ["#2e7d32", "#f1f8e9"],
  ["#ef6c00", "#fff3e0"],
  ["#37474f", "#ffca28"],
];
function drawRailCar(x, y, hx, hy, kind, liv, seed, loco) {
  const [c1, c2] = liv;
  ellipse(...P(x + 0.05, y + 0.05), 20, 7, "rgba(0,0,0,.18)");
  oprism(x, y, hx, hy, 0.86, 0.36, 1, 4, null, "#263238", "#1c262b");
  if (loco) {
    oprism(
      x,
      y,
      hx,
      hy,
      0.9,
      0.42,
      4,
      17,
      shade(c1, 0.1),
      c1,
      shade(c1, -0.22),
    );
    oprism(
      x + hx * 0.3,
      y + hy * 0.3,
      hx,
      hy,
      0.24,
      0.43,
      11,
      16,
      null,
      "#90caf9",
      "#64b5f6",
    );
    oprism(x, y, hx, hy, 0.88, 0.43, 7, 9, null, c2, shade(c2, -0.15));
    oprism(
      x - hx * 0.1,
      y - hy * 0.1,
      hx,
      hy,
      0.4,
      0.22,
      17,
      20,
      "#455a64",
      "#37474f",
      "#263238",
    );
    if (nightAmt > 0.08) {
      const p = P(x + hx * 0.47, y + hy * 0.47, 9);
      addGlow(p[0], p[1], 16, false);
    }
    return;
  }
  if (kind === "pass") {
    oprism(
      x,
      y,
      hx,
      hy,
      0.9,
      0.42,
      4,
      16,
      shade(c2, -0.05),
      c2,
      shade(c2, -0.15),
    );
    oprism(x, y, hx, hy, 0.82, 0.43, 9, 13, null, "#455a64", "#37474f");
    oprism(x, y, hx, hy, 0.9, 0.43, 5, 7, null, c1, shade(c1, -0.2));
  } else if (kind === "tank") {
    oprism(x, y, hx, hy, 0.86, 0.34, 4, 14, "#cfd8dc", "#b0bec5", "#90a4ae");
  } else if (kind === "box") {
    oprism(x, y, hx, hy, 0.9, 0.4, 4, 15, "#8d6e63", "#795548", "#6d4c41");
  } else {
    oprism(x, y, hx, hy, 0.9, 0.38, 4, 6, "#424242", "#37474f", "#263238");
    const cc = [
      "#e53935",
      "#1e88e5",
      "#43a047",
      "#fb8c00",
      "#8e24aa",
      "#fdd835",
    ][seed % 6];
    oprism(x, y, hx, hy, 0.8, 0.36, 6, 15, shade(cc, 0.1), cc, shade(cc, -0.2));
  }
}
function drawTrainSet(path, head, id, cars, kind) {
  const liv = TRAIN_LIVERY[id % TRAIN_LIVERY.length];
  for (let k = cars; k >= 0; k--) {
    const s = head - k * 1.0;
    if (s < 0 || s > path.length - 1) continue;
    const [x, y, hx, hy] = alongPath(path, s);
    drawRailCar(
      x - 0.5,
      y - 0.5,
      hx,
      hy,
      kind === "mixed" ? ["cont", "box", "tank", "cont"][(k + id) % 4] : kind,
      liv,
      id * 7 + k,
      k === 0,
    );
    if (k === 0 && !THUMB && Math.random() < DT * 3)
      smokeAt(P(x - 0.5, y - 0.5, 22), 1, false);
  }
}

function drawTrainOnPath(path, head, id) {
  drawTrainSet(path, head, id, 4, "mixed");
}
function drawTrainAt(x, y, id) {
  const path = [];
  for (let k = 6; k >= 0; k--) path.push([Math.round(x) + k, Math.round(y)]);
  drawTrainSet(path, 6, id, 4, "mixed");
}

Object.assign(BUILD, {
  rail_halt: {
    name: "Railway Halt",
    icon: "🚏",
    cat: "trans",
    w: 1,
    h: 3,
    cost: 450,
    level: 8,
    xp: 8,
    ht: 34,
    desc: "A small platform with a shelter. Build next to track - commuter trains stop at every halt and station on the same line.",
    art: {
      plaza: "#cfc6b4",
      blocks: [
        BL(0.15, 0.8, 0.7, 1.4, 18, {
          open: true,
          wall: "#607d8b",
          rc: "#455a64",
          roof: "gy",
          rh: 8,
        }),
      ],
      sign: "🚏",
    },
  },
  rail_central: {
    name: "Central Station",
    icon: "🚉",
    cat: "trans",
    w: 4,
    h: 5,
    cost: 6500,
    level: 14,
    xp: 90,
    ht: 90,
    desc: "A grand passenger terminal. Residents ride trains from it to work in other towns.",
    art: {
      plaza: "#d7ccc8",
      blocks: [
        BL(0.2, 0.3, 3.6, 2.2, 46, {
          wall: "#d7ccc8",
          rc: "#5d4037",
          roof: "gy",
          rh: 22,
          win: "columns",
          door: true,
        }),
        BL(0.3, 2.7, 3.4, 2.0, 22, {
          open: true,
          wall: "#78909c",
          rc: "#37474f",
          roof: "gy",
          rh: 12,
        }),
      ],
      fx: "clock2",
    },
  },
  rail_depot: {
    name: "Rail Depot",
    icon: "🏭",
    cat: "trans",
    w: 3,
    h: 3,
    cost: 2400,
    level: 10,
    xp: 30,
    ht: 50,
    desc: "Maintains the fleet: commuter trains run more often.",
    art: {
      plaza: "#bdbdbd",
      blocks: [
        BL(0.2, 0.3, 2.6, 2.2, 28, {
          wall: "#a1887f",
          rc: "#5d4037",
          roof: "gx",
          rh: 14,
          win: "garage",
          door: true,
        }),
      ],
    },
  },
});
ART_FX.clock2 = (e) => {
  const p = P(e.x + 1.9, e.y + 2.5, 52);
  circle(p[0], p[1], 7, "#fffdf5");
  line(p, [p[0], p[1] - 5], "#333", 1.2);
  line(p, [p[0] + 3.5, p[1]], "#333", 1);
  return 0;
};
for (const t of ["rail_halt", "rail_central", "rail_depot"]) DRAW[t] = drawArt;
JOBS.rail_central = { n: 10, k: "driver", w: 55 };
JOBS.rail_halt = { n: 1, k: "driver", w: 40 };
JOBS.rail_depot = { n: 8, k: "worker", w: 50 };
const STATION_TYPES = ["trainstation", "rail_halt", "rail_central"];
let railNet = { v: -1 };
function railNetwork() {
  if (railNet.v === worldVer) return railNet;
  const comp = new Map();
  let id = 0;
  for (const r of entsOf("rail")) {
    if (comp.has(tkey(r.x, r.y))) continue;
    const q = [r.x, r.y];
    comp.set(tkey(r.x, r.y), id);
    for (let h = 0; h < q.length; h += 2)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = q[h] + dx,
          ny = q[h + 1] + dy,
          k = tkey(nx, ny);
        if (!comp.has(k) && isRail(nx, ny)) {
          comp.set(k, id);
          q.push(nx, ny);
        }
      }
    id++;
  }
  const stations = [];
  for (const t of STATION_TYPES)
    for (const e of entsOf(t)) {
      if (e.build || e.moving) continue;
      let best = null;
      for (let j = -1; j <= e.h; j++)
        for (let i = -1; i <= e.w; i++) {
          const c = comp.get(tkey(e.x + i, e.y + j));
          if (c != null) {
            best = { c, x: e.x + i, y: e.y + j };
            break;
          }
        }
      if (best) stations.push({ e, c: best.c, x: best.x, y: best.y });
    }
  railNet = { v: worldVer, comp, stations };
  return railNet;
}
function railPathBetween(a, b) {
  const start = tkey(a.x, a.y),
    prev = new Map([[start, start]]),
    q = [a.x, a.y];
  for (let h = 0; h < q.length && q.length < 60000; h += 2) {
    const x = q[h],
      y = q[h + 1];
    if (x === b.x && y === b.y) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = tkey(nx, ny);
      if (!prev.has(k) && isRail(nx, ny)) {
        prev.set(k, tkey(x, y));
        q.push(nx, ny);
      }
    }
  }
  const goal = tkey(b.x, b.y);
  if (!prev.has(goal)) return null;
  const path = [];
  for (let c = goal; c !== start; c = prev.get(c))
    path.push([tkeyX(c), tkeyY(c)]);
  path.push([a.x, a.y]);
  return path.reverse();
}
const commuterTrains = [];
let commuterT = 0;
function updateCommuters(dt) {
  commuterT -= dt;
  const net = railNetwork();
  if (commuterT <= 0 && net.stations.length >= 2) {
    commuterT = 9 / (1 + entsOf("rail_depot").size * 0.5);
    if (commuterTrains.length < 3 + entsOf("rail_depot").size * 2) {
      const a = pick(net.stations),
        others = net.stations.filter((s) => s !== a && s.c === a.c);
      if (others.length) {
        const b = pick(others),
          path = railPathBetween(a, b);
        if (path && path.length > 4)
          commuterTrains.push({
            path,
            s: 0,
            v: 0,
            cars: 3 + randi(3),
            id: randi(1000),
            wait: 0,
            kind: "pass",
          });
      }
    }
  }
  for (let i = commuterTrains.length - 1; i >= 0; i--) {
    const c = commuterTrains[i],
      left = c.path.length - 1 - c.s;
    const target = left < 4 ? Math.max(0.6, left * 1.2) : 5.5;
    c.v += (target - c.v) * Math.min(1, dt * 1.5);
    c.s += c.v * dt;
    if (c.s >= c.path.length - 1 + c.cars) commuterTrains.splice(i, 1);
  }
}

function stationNear(e, r) {
  const net = railNetwork();
  const [cx, cy] = center(e);
  let best = null,
    bd = r;
  for (const s of net.stations) {
    const d =
      Math.abs(s.e.x + s.e.w / 2 - cx) + Math.abs(s.e.y + s.e.h / 2 - cy);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}
const _reachableTransit = reachable;
reachable = function (a, b) {
  if (_reachableTransit(a, b)) return true;
  const sa = stationNear(a, 14),
    sb = sa && stationNear(b, 14);
  return !!sa && !!sb && sa !== sb && sa.c === sb.c;
};

function drawShipModel(x, y, kind, hx, hy, scale, seed) {
  const k = scale || 1,
    L =
      (kind === "cruise"
        ? 4.4
        : kind === "container"
          ? 3.4
          : kind === "tanker"
            ? 3.6
            : kind === "ferry"
              ? 3.0
              : kind === "navy"
                ? 3.2
                : kind === "fishing"
                  ? 1.4
                  : 1.1) * k,
    W = (kind === "fishing" || kind === "sail" ? 0.5 : 0.95) * k;
  const bob = Math.sin(T * 1.7 + x * 0.7) * 1.2;
  ellipse(...P(x, y), L * 22, W * 9, "rgba(255,255,255,.28)");
  const hullCol =
    kind === "cruise"
      ? "#fafafa"
      : kind === "tanker"
        ? "#8e2c25"
        : kind === "navy"
          ? "#78909c"
          : kind === "ferry"
            ? "#eceff1"
            : kind === "container"
              ? "#263f5f"
              : kind === "fishing"
                ? "#c62828"
                : "#fafafa";
  const z0 = bob - 2,
    deck = bob + 7 * k;
  oprism(
    x - hx * 0.05 * L,
    y - hy * 0.05 * L,
    hx,
    hy,
    L * 0.9,
    W,
    z0,
    deck,
    shade(hullCol, 0.12),
    hullCol,
    shade(hullCol, -0.2),
  );

  const bx = x + hx * L * 0.4,
    by = y + hy * L * 0.4,
    nx = -hy,
    ny = hx;
  poly(
    [
      P(bx + (nx * W) / 2, by + (ny * W) / 2, deck),
      P(bx + hx * L * 0.14, by + hy * L * 0.14, deck + 1),
      P(bx - (nx * W) / 2, by - (ny * W) / 2, deck),
    ],
    shade(hullCol, 0.12),
  );
  poly(
    [
      P(bx + (nx * W) / 2, by + (ny * W) / 2, z0),
      P(bx + hx * L * 0.14, by + hy * L * 0.14, z0),
      P(bx + hx * L * 0.14, by + hy * L * 0.14, deck + 1),
      P(bx + (nx * W) / 2, by + (ny * W) / 2, deck),
    ],
    shade(hullCol, -0.1),
  );
  oprism(
    x,
    y,
    hx,
    hy,
    L * 0.92,
    W * 1.01,
    z0 + 1,
    z0 + 3,
    null,
    "#b71c1c",
    "#8e1b1b",
  );
  const aft = (f) => [x - hx * L * f, y - hy * L * f];
  if (kind === "container") {
    const cols = [
      "#e53935",
      "#1e88e5",
      "#43a047",
      "#fb8c00",
      "#fdd835",
      "#8e24aa",
      "#00897b",
    ];
    for (let r = 0; r < 5; r++)
      for (let h = 0; h < 2; h++) {
        const f = 0.32 - r * 0.13,
          cx = x + hx * L * f,
          cy = y + hy * L * f,
          cc = cols[(seed + r * 3 + h) % cols.length];
        oprism(
          cx,
          cy,
          hx,
          hy,
          L * 0.11,
          W * 0.8,
          deck + h * 6,
          deck + h * 6 + 6,
          shade(cc, 0.12),
          cc,
          shade(cc, -0.2),
        );
      }
    const [ax, ay] = aft(0.36);
    oprism(
      ax,
      ay,
      hx,
      hy,
      L * 0.12,
      W * 0.85,
      deck,
      deck + 22 * k,
      "#fafafa",
      "#eceff1",
      "#cfd8dc",
    );
    oprism(
      ax,
      ay,
      hx,
      hy,
      L * 0.13,
      W * 0.86,
      deck + 16 * k,
      deck + 19 * k,
      null,
      "#455a64",
      "#37474f",
    );
  } else if (kind === "tanker") {
    for (let r = 0; r < 4; r++) {
      const f = 0.28 - r * 0.15;
      const [cx, cy] = [x + hx * L * f, y + hy * L * f];
      const p = P(cx, cy, deck + 3);
      ellipse(p[0], p[1], 9 * k, 4 * k, "#cfd8dc");
    }
    const [ax, ay] = aft(0.38);
    oprism(
      ax,
      ay,
      hx,
      hy,
      L * 0.12,
      W * 0.8,
      deck,
      deck + 18 * k,
      "#fafafa",
      "#eceff1",
      "#cfd8dc",
    );
  } else if (kind === "cruise") {
    for (let d = 0; d < 4; d++) {
      const s = 0.78 - d * 0.1;
      oprism(
        x - hx * L * 0.06,
        y - hy * L * 0.06,
        hx,
        hy,
        L * s,
        W * (0.86 - d * 0.04),
        deck + d * 7 * k,
        deck + (d + 1) * 7 * k,
        "#fafafa",
        "#eceff1",
        "#cfd8dc",
      );
      oprism(
        x - hx * L * 0.06,
        y - hy * L * 0.06,
        hx,
        hy,
        L * s * 0.98,
        W * (0.87 - d * 0.04),
        deck + d * 7 * k + 3,
        deck + d * 7 * k + 5,
        null,
        "#0277bd",
        "#01579b",
      );
    }
    const [fx, fy] = aft(0.2);
    oprism(
      fx,
      fy,
      hx,
      hy,
      0.3,
      0.3,
      deck + 28 * k,
      deck + 40 * k,
      "#c62828",
      "#c62828",
      "#b71c1c",
    );
  } else if (kind === "ferry") {
    oprism(
      x - hx * L * 0.05,
      y - hy * L * 0.05,
      hx,
      hy,
      L * 0.72,
      W * 0.85,
      deck,
      deck + 8 * k,
      "#fafafa",
      "#eceff1",
      "#cfd8dc",
    );
    oprism(
      x - hx * L * 0.05,
      y - hy * L * 0.05,
      hx,
      hy,
      L * 0.7,
      W * 0.86,
      deck + 3,
      deck + 6,
      null,
      "#1e88e5",
      "#1565c0",
    );
    oprism(
      x - hx * L * 0.1,
      y - hy * L * 0.1,
      hx,
      hy,
      L * 0.45,
      W * 0.7,
      deck + 8 * k,
      deck + 15 * k,
      "#fafafa",
      "#eceff1",
      "#cfd8dc",
    );
    const [fx, fy] = aft(0.18);
    oprism(
      fx,
      fy,
      hx,
      hy,
      0.18,
      0.18,
      deck + 15 * k,
      deck + 24 * k,
      "#1565c0",
      "#1565c0",
      "#0d47a1",
    );
  } else if (kind === "navy") {
    const [ax, ay] = aft(0.08);
    oprism(
      ax,
      ay,
      hx,
      hy,
      L * 0.3,
      W * 0.7,
      deck,
      deck + 16 * k,
      "#90a4ae",
      "#90a4ae",
      "#78909c",
    );
    oprism(
      ax,
      ay,
      hx,
      hy,
      0.08,
      0.08,
      deck + 16 * k,
      deck + 34 * k,
      null,
      "#607d8b",
      "#546e7a",
    );
    const [tx, ty] = [x + hx * L * 0.28, y + hy * L * 0.28];
    oprism(
      tx,
      ty,
      hx,
      hy,
      0.3,
      0.3,
      deck,
      deck + 5,
      "#90a4ae",
      "#78909c",
      "#607d8b",
    );
    const a = P(tx, ty, deck + 4),
      b = P(tx + hx * 0.5, ty + hy * 0.5, deck + 5);
    line(a, b, "#546e7a", 2.5);
  } else if (kind === "fishing") {
    const [ax, ay] = aft(0.15);
    oprism(
      ax,
      ay,
      hx,
      hy,
      L * 0.3,
      W * 0.7,
      deck,
      deck + 9,
      "#fafafa",
      "#eceff1",
      "#cfd8dc",
    );
    const m = P(x + hx * 0.2, y + hy * 0.2, deck);
    line(m, [m[0], m[1] - 22], "#5d4037", 1.5);
  } else {
    const m = P(x, y, deck);
    line(m, [m[0], m[1] - 30 * k], "#6d4c41", 1.5);
    poly(
      [
        [m[0], m[1] - 30 * k],
        [m[0], m[1] - 3],
        [m[0] - (hx - hy) * 14 * k, m[1] - 4],
      ],
      "#fffdf5",
    );
  }
  if (
    !THUMB &&
    (kind === "container" ||
      kind === "tanker" ||
      kind === "ferry" ||
      kind === "cruise") &&
    Math.random() < DT * 2
  ) {
    const [ax, ay] = aft(0.38);
    smokeAt(P(ax, ay, deck + 26 * k), 1, true);
  }
}

const seaRoutes = new Map();
function seaRoute(dock) {
  const key = tkey(dock[0], dock[1]);
  if (seaRoutes.has(key)) return seaRoutes.get(key);
  const start = key,
    prev = new Map([[start, start]]),
    q = [dock[0], dock[1]];
  let goal = null;
  for (let h = 0; h < q.length && q.length < 40000; h += 2) {
    const x = q[h],
      y = q[h + 1];
    if (Math.hypot(x - dock[0], y - dock[1]) > 46 && terrAt(x, y) === T_DEEP) {
      goal = tkey(x, y);
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = tkey(nx, ny);
      if (!prev.has(k) && isWater(nx, ny)) {
        prev.set(k, tkey(x, y));
        q.push(nx, ny);
      }
    }
  }
  let path = null;
  if (goal != null) {
    path = [];
    for (let c = goal; c !== start; c = prev.get(c))
      path.push([tkeyX(c), tkeyY(c)]);
    path.push(dock);
    path.reverse();
    path = smoothPath(path);
  }
  seaRoutes.set(key, path);
  return path;
}
function smoothPath(p) {
  if (p.length < 4) return p;
  const out = [p[0]];
  for (let i = 1; i < p.length - 1; i++)
    out.push([
      (p[i - 1][0] + p[i][0] * 2 + p[i + 1][0]) / 4,
      (p[i - 1][1] + p[i][1] * 2 + p[i + 1][1]) / 4,
    ]);
  out.push(p[p.length - 1]);
  return out;
}
const SHIP_KINDS = ["container", "ferry", "tanker"];

function drawAirliner(x, y, z, hx, hy, k, livery, alpha) {
  k = k || 1;
  const nx = -hy,
    ny = hx,
    Lf = 1.9 * k,
    span = 1.0 * k;
  ctx.globalAlpha = alpha == null ? 1 : alpha;

  const sh = (pts) =>
    poly(
      pts.map(([a, b]) => P(a + z / 90, b + z / 90, 0)),
      `rgba(0,0,0,${0.18 * Math.max(0.2, 1 - z / 500)})`,
    );
  sh([
    [x + (hx * Lf) / 2, y + (hy * Lf) / 2],
    [x + nx * span, y + ny * span],
    [x - (hx * Lf) / 2, y - (hy * Lf) / 2],
    [x - nx * span, y - ny * span],
  ]);
  const col = livery || "#1e88e5";

  const wing = (s) =>
    poly(
      [
        P(
          x + hx * 0.12 * k + nx * 0.12 * k * s,
          y + hy * 0.12 * k + ny * 0.12 * k * s,
          z + 4,
        ),
        P(
          x - hx * 0.28 * k + nx * span * s,
          y - hy * 0.28 * k + ny * span * s,
          z + 4,
        ),
        P(
          x - hx * 0.46 * k + nx * span * s,
          y - hy * 0.46 * k + ny * span * s,
          z + 4,
        ),
        P(
          x - hx * 0.2 * k + nx * 0.12 * k * s,
          y - hy * 0.2 * k + ny * 0.12 * k * s,
          z + 4,
        ),
      ],
      "#dfe5ea",
    );
  const far = nx + ny < 0 ? 1 : -1;
  wing(far);
  const eng = (s) =>
    oprism(
      x - hx * 0.05 * k + nx * 0.45 * k * s,
      y - hy * 0.05 * k + ny * 0.45 * k * s,
      hx,
      hy,
      0.32 * k,
      0.12 * k,
      z,
      z + 4,
      "#b0bec5",
      "#90a4ae",
      "#78909c",
    );
  eng(far);
  oprism(
    x,
    y,
    hx,
    hy,
    Lf,
    0.24 * k,
    z + 2,
    z + 10 * k,
    "#f5f7fa",
    "#eef1f4",
    "#d9dee3",
  );
  oprism(
    x,
    y,
    hx,
    hy,
    Lf * 0.9,
    0.245 * k,
    z + 6 * k,
    z + 7.5 * k,
    null,
    col,
    shade(col, -0.2),
  );
  const nose = P(x + hx * Lf * 0.55, y + hy * Lf * 0.55, z + 6 * k);
  circle(nose[0], nose[1], 3.2 * k, "#eef1f4");

  const tx = x - hx * Lf * 0.45,
    ty = y - hy * Lf * 0.45;
  poly(
    [
      P(tx, ty, z + 10 * k),
      P(tx + hx * 0.32 * k, ty + hy * 0.32 * k, z + 10 * k),
      P(tx - hx * 0.08 * k, ty - hy * 0.08 * k, z + 26 * k),
    ],
    col,
  );
  for (const s of [1, -1])
    poly(
      [
        P(tx + hx * 0.1 * k, ty + hy * 0.1 * k, z + 8),
        P(
          tx - hx * 0.05 * k + nx * 0.36 * k * s,
          ty - hy * 0.05 * k + ny * 0.36 * k * s,
          z + 8,
        ),
        P(
          tx - hx * 0.15 * k + nx * 0.36 * k * s,
          ty - hy * 0.15 * k + ny * 0.36 * k * s,
          z + 8,
        ),
      ],
      "#cfd8dc",
    );
  wing(-far);
  eng(-far);
  if (nightAmt > 0.1 && !THUMB) {
    const w1 = P(
        x - hx * 0.4 * k + nx * span,
        y - hy * 0.4 * k + ny * span,
        z + 4,
      ),
      w2 = P(x - hx * 0.4 * k - nx * span, y - hy * 0.4 * k - ny * span, z + 4);
    if (Math.floor(T * 1.5) % 2) {
      circle(w1[0], w1[1], 2, "#ff1744");
      circle(w2[0], w2[1], 2, "#00e676");
    }
  }
  ctx.globalAlpha = 1;
}

Object.assign(BUILD, {
  runway: {
    name: "Runway",
    icon: "🛬",
    cat: "trans",
    w: 1,
    h: 1,
    cost: 80,
    level: 20,
    xp: 1,
    ht: 0,
    flat: true,
    multi: true,
    desc: "Drag a long straight line (10+ tiles). Planes taxi out, roll down it and take off.",
  },
  taxiway: {
    name: "Taxiway",
    icon: "🟨",
    cat: "trans",
    w: 1,
    h: 1,
    cost: 30,
    level: 20,
    xp: 0,
    ht: 0,
    flat: true,
    multi: true,
    walk: false,
    desc: "Connects runways, aprons and terminals.",
  },
  apron: {
    name: "Apron",
    icon: "⬜",
    cat: "trans",
    w: 1,
    h: 1,
    cost: 25,
    level: 20,
    xp: 0,
    ht: 0,
    flat: true,
    multi: true,
    desc: "Concrete parking stands for aircraft.",
  },
  air_hangar: {
    name: "Aircraft Hangar",
    icon: "🛩️",
    cat: "trans",
    w: 4,
    h: 4,
    cost: 7000,
    level: 24,
    xp: 80,
    ht: 50,
    desc: "Maintenance hangar - more planes in your fleet.",
    art: { plaza: "#9e9e9e", blocks: [], fx: "hangarArch" },
  },
  air_cargo: {
    name: "Air Cargo Terminal",
    icon: "📦",
    cat: "trans",
    w: 4,
    h: 3,
    cost: 6000,
    level: 25,
    xp: 70,
    ht: 46,
    desc: "Handles freight: cargo planes earn more.",
    art: {
      plaza: "#bdbdbd",
      blocks: [
        BL(0.2, 0.3, 3.6, 2.2, 28, {
          wall: "#eceff1",
          rc: "#607d8b",
          roof: "flat",
          win: "garage",
          door: true,
        }),
      ],
      text: "CARGO",
      textBg: "#ef6c00",
    },
  },
  air_fuel: {
    name: "Fuel Farm",
    icon: "🛢️",
    cat: "trans",
    w: 2,
    h: 2,
    cost: 2200,
    level: 22,
    xp: 25,
    ht: 40,
    desc: "Jet fuel storage for the airport.",
    art: { plaza: "#bdbdbd", blocks: [], fx: "tank" },
  },
});
for (const t of ["air_hangar", "air_cargo", "air_fuel"]) DRAW[t] = drawArt;
JOBS.air_hangar = { n: 10, k: "worker", w: 60, e: 1 };
JOBS.air_cargo = { n: 12, k: "driver", w: 50 };
function isT(x, y, t) {
  const e = entAt(x, y);
  return !!e && e.t === t;
}
FLAT.runway = (e) => {
  const x = e.x,
    y = e.y,
    alongY =
      (isT(x, y - 1, "runway") || isT(x, y + 1, "runway")) &&
      !(isT(x - 1, y, "runway") || isT(x + 1, y, "runway"));
  poly(diamond(x, y), "#3d4246");
  const end = alongY
    ? !(isT(x, y - 1, "runway") && isT(x, y + 1, "runway"))
    : !(isT(x - 1, y, "runway") && isT(x + 1, y, "runway"));
  if (end)
    for (let k = 0; k < 5; k++) {
      const u = 0.14 + k * 0.18;
      const a = alongY ? P(x + u, y + 0.3) : P(x + 0.3, y + u),
        b = alongY ? P(x + u, y + 0.7) : P(x + 0.7, y + u);
      line(a, b, "#f5f5f5", 2.4);
    }
  else {
    const a = alongY ? P(x + 0.5, y + 0.25) : P(x + 0.25, y + 0.5),
      b = alongY ? P(x + 0.5, y + 0.75) : P(x + 0.75, y + 0.5);
    line(a, b, "#f5f5f5", 2);
  }
  for (const v of [0.06, 0.94]) {
    const a = alongY ? P(x + v, y) : P(x, y + v),
      b = alongY ? P(x + v, y + 1) : P(x + 1, y + v);
    line(a, b, "rgba(255,255,255,.7)", 1.2);
    if (nightAmt > 0.08) {
      const m = alongY ? P(x + v, y + 0.5) : P(x + 0.5, y + v);
      circle(m[0], m[1], 1.6, "#fff59d");
      addGlow(m[0], m[1], 7, false);
    }
  }
};
FLAT.taxiway = (e) => {
  const x = e.x,
    y = e.y;
  poly(diamond(x, y), "#53585c");
  const conn = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].filter(([dx, dy]) =>
    ["taxiway", "runway", "apron"].some((t) => isT(x + dx, y + dy, t)),
  );
  const c = P(x + 0.5, y + 0.5);
  for (const [dx, dy] of conn.length
    ? conn
    : [
        [1, 0],
        [-1, 0],
      ])
    line(c, P(x + 0.5 + dx * 0.5, y + 0.5 + dy * 0.5), "#fdd835", 1.6);
  if (nightAmt > 0.08) {
    circle(c[0], c[1], 1.4, "#64b5f6");
    addGlow(c[0], c[1], 6, false);
  }
};
FLAT.apron = (e) => {
  poly(diamond(e.x, e.y), "#a9adb0");
  const a = P(e.x, e.y + 0.05),
    b = P(e.x + 1, e.y + 0.05);
  line(a, b, "rgba(253,216,53,.8)", 1);
};

let runwayCache = { v: -1, r: null };
function bestRunway() {
  if (runwayCache.v === worldVer) return runwayCache.r;
  let best = null;
  for (const e of entsOf("runway")) {
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      if (isT(e.x - dx, e.y - dy, "runway")) continue;
      let n = 1;
      while (isT(e.x + dx * n, e.y + dy * n, "runway")) n++;
      if (n >= 10 && (!best || n > best.n))
        best = { x: e.x, y: e.y, dx, dy, n };
    }
  }
  runwayCache = { v: worldVer, r: best };
  return best;
}

function flightPose(ap, rw, g, slot) {
  const sx = rw.x + 0.5,
    sy = rw.y + 0.5,
    hx = rw.dx,
    hy = rw.dy;
  const park = [ap.x + ap.w + 0.6 + slot * 1.4, ap.y + ap.h * 0.5];
  if (g < 0.22) {
    const f = g / 0.22,
      x = park[0] + (sx - park[0]) * f,
      y = park[1] + (sy - park[1]) * f,
      d = Math.hypot(sx - park[0], sy - park[1]) || 1;
    return [x, y, 0, (sx - park[0]) / d, (sy - park[1]) / d];
  }
  const f = (g - 0.22) / 0.78,
    dist = Math.pow(f, 1.8) * (rw.n * 2.6),
    x = sx + hx * dist,
    y = sy + hy * dist;
  const lift = Math.max(0, dist - rw.n * 0.7),
    z = Math.min(420, lift * lift * 2.2);
  return [x, y, z, hx, hy];
}

const flyers = [];
let flyT = 8;
function updateFlyers(dt) {
  flyT -= dt;
  if (flyT <= 0 && lastVR && RES > 40) {
    flyT = rand(18, 40);
    const a = rand(0, Math.PI * 2),
      hx = Math.cos(a),
      hy = Math.sin(a);
    const mid = [(lastVR.x0 + lastVR.x1) / 2, (lastVR.y0 + lastVR.y1) / 2],
      R = Math.max(lastVR.x1 - lastVR.x0, lastVR.y1 - lastVR.y0);
    const jets = entsOf("mil_hangar").size > 0 && Math.random() < 0.4;
    flyers.push({
      x: mid[0] - hx * R,
      y: mid[1] - hy * R,
      hx,
      hy,
      z: jets ? 160 : 380,
      v: jets ? 26 : 9,
      life: (R * 2) / (jets ? 26 : 9),
      kind: jets ? "jet" : "liner",
      liv: pick(["#1e88e5", "#c62828", "#2e7d32", "#6a1b9a", "#ef6c00"]),
    });
    if (jets)
      flyers.push(
        Object.assign({}, flyers[flyers.length - 1], {
          x: flyers[flyers.length - 1].x - hy * 1.6,
          y: flyers[flyers.length - 1].y + hx * 1.6,
        }),
      );
  }
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i];
    f.x += f.hx * f.v * dt;
    f.y += f.hy * f.v * dt;
    f.life -= dt;
    if (f.kind === "liner" && !THUMB && Math.random() < dt * 20) {
      const p = P(f.x - f.hx * 1, f.y - f.hy * 1, f.z + 6);
      spawn({
        type: "smoke",
        x: p[0],
        y: p[1],
        vx: 0,
        vy: 0,
        life: 3,
        max: 3,
        r: 2.2,
      });
    }
    if (f.life <= 0) flyers.splice(i, 1);
  }
}
function drawJet(x, y, z, hx, hy) {
  const nx = -hy,
    ny = hx;
  poly(
    [
      P(x + hx * 0.8, y + hy * 0.8, z),
      P(x - hx * 0.4 + nx * 0.6, y - hy * 0.4 + ny * 0.6, z),
      P(x - hx * 0.6, y - hy * 0.6, z),
      P(x - hx * 0.4 - nx * 0.6, y - hy * 0.4 - ny * 0.6, z),
    ],
    "#78909c",
  );
  poly(
    [
      P(x + hx * 0.8, y + hy * 0.8, z),
      P(x - hx * 0.6, y - hy * 0.6, z),
      P(x - hx * 0.5, y - hy * 0.5, z + 8),
    ],
    "#546e7a",
  );
  poly(
    [
      P(x + hx * 0.8 + z / 90, y + hy * 0.8 + z / 90, 0),
      P(x - hx * 0.4 + nx * 0.6 + z / 90, y - hy * 0.4 + ny * 0.6 + z / 90, 0),
      P(x - hx * 0.6 + z / 90, y - hy * 0.6 + z / 90, 0),
      P(x - hx * 0.4 - nx * 0.6 + z / 90, y - hy * 0.4 - ny * 0.6 + z / 90, 0),
    ],
    "rgba(0,0,0,.12)",
  );
}

function drawVehicles() {
  const path = railPath(),
    st = hasType("trainstation");
  if (st && !st.build)
    for (const t of S.rail.trains) {
      if (
        path &&
        path.length &&
        (t.st === "arriving" || t.st === "departing")
      ) {
        let g = clamp((NOW - t.t0) / ANIM_MS, 0, 1);
        if (t.st === "arriving") g = 1 - g;
        drawTrainOnPath(path, g * (path.length + 5), t.id);
      } else if (t.st === "docked")
        drawTrainAt(st.x + 0.2 + t.id * 0.05 - 1, st.y + st.h, t.id);
    }

  for (const c of commuterTrains)
    drawTrainSet(c.path, c.s, c.id, c.cars, "pass");

  const dock = portDock();
  if (dock) {
    const route = seaRoute(dock);
    for (const s of S.sea.ships) {
      if (s.st === "sailing") continue;
      const kind = s.kind || SHIP_KINDS[s.id % SHIP_KINDS.length];
      if (s.st === "docked" || !route) {
        const d = route
          ? alongPath(route, 2 + s.id * 2.6)
          : [dock[0] + 0.5, dock[1] + 0.5, 1, 0];
        drawShipModel(d[0], d[1], kind, d[2], d[3], 0.85, s.id);
        continue;
      }
      let g = clamp((NOW - s.t0) / ANIM_MS, 0, 1);
      if (s.st === "arriving") g = 1 - g;
      const [x, y, hx, hy] = alongPath(
          route,
          2 + s.id * 2.6 + g * (route.length - 3),
        ),
        sg = s.st === "arriving" ? -1 : 1;
      ctx.globalAlpha = g > 0.85 ? (1 - g) / 0.15 : 1;
      drawShipModel(x, y, kind, hx * sg, hy * sg, 0.85, s.id);
      ctx.globalAlpha = 1;
    }
  }

  const ap = hasType("airport"),
    rw = bestRunway();
  if (ap && !ap.build)
    for (const p of S.air.planes) {
      if (p.st === "away") continue;
      let g = 0;
      if (p.st === "departing") g = clamp((NOW - p.t0) / ANIM_MS, 0, 1);
      if (p.st === "arriving") g = 1 - clamp((NOW - p.t0) / ANIM_MS, 0, 1);
      if (rw) {
        const [x, y, z, hx, hy] = flightPose(ap, rw, g, p.id);
        const s = p.st === "arriving" ? -1 : 1;
        const [pk, pl] = planeLook(p);
        drawAirliner(
          x - 0.5,
          y - 0.5,
          z,
          hx * s,
          hy * s,
          pk,
          pl,
          g > 0.9 ? (1 - g) * 10 : 1,
        );
      } else
        drawAirliner(
          ap.x + ap.w + 0.6 + p.id * 1.4 + g * 12,
          ap.y + ap.h * 0.5,
          Math.max(0, g - 0.4) * 400,
          1,
          0,
          planeLook(p)[0],
          planeLook(p)[1],
          1 - Math.max(0, g - 0.75) * 4,
        );
    }

  for (const hb of entsOf("mil_helibase")) {
    const a = T * 0.4 + hb.id,
      [cx, cy] = [hb.x + 1.5 + Math.cos(a) * 9, hb.y + 1.5 + Math.sin(a) * 9],
      p = P(cx, cy, 130);
    drawHeli(p[0], p[1], T * 20, "#4b5320");
    ellipse(...P(cx + 1.4, cy + 1.4), 10, 4, "rgba(0,0,0,.12)");
  }

  for (const f of flyers) {
    if (f.kind === "jet") drawJet(f.x, f.y, f.z, f.hx, f.hy);
    else drawAirliner(f.x, f.y, f.z, f.hx, f.hy, 1.1, f.liv, 1);
  }

  for (const b of boats) drawShipModel(b.x, b.y, b.kind, b.hx, b.hy, 1, b.id);
}

const boats = [];
let boatT = 3;
function updateBoats(dt) {
  boatT -= dt;
  if (boatT <= 0 && lastVR && cam.z > 0.3) {
    boatT = rand(4, 9);
    if (boats.length < 6)
      for (let k = 0; k < 30; k++) {
        const x = lastVR.x0 + randi(Math.max(1, lastVR.x1 - lastVR.x0)),
          y = lastVR.y0 + randi(Math.max(1, lastVR.y1 - lastVR.y0));
        if (
          !isWater(x, y) ||
          !isWater(x + 2, y) ||
          !isWater(x - 2, y) ||
          !isWater(x, y + 2) ||
          !isWater(x, y - 2)
        )
          continue;
        const a = rand(0, 6.28);
        boats.push({
          x: x + 0.5,
          y: y + 0.5,
          hx: Math.cos(a),
          hy: Math.sin(a),
          kind: Math.random() < 0.6 ? "sail" : "fishing",
          id: randi(99),
          life: rand(25, 50),
        });
        break;
      }
  }
  for (let i = boats.length - 1; i >= 0; i--) {
    const b = boats[i],
      sp = b.kind === "sail" ? 0.9 : 0.6;
    const nx = b.x + b.hx * sp * dt * 2,
      ny = b.y + b.hy * sp * dt * 2;
    if (!isWater(Math.floor(nx + b.hx), Math.floor(ny + b.hy))) {
      const a = Math.atan2(b.hy, b.hx) + rand(1.6, 3.2);
      b.hx = Math.cos(a);
      b.hy = Math.sin(a);
    } else {
      b.x += b.hx * sp * dt;
      b.y += b.hy * sp * dt;
    }
    b.life -= dt;
    if (b.life <= 0) boats.splice(i, 1);
  }
}
function updateTransit(dt) {
  if (dt <= 0 || !S) return;
  updateCommuters(dt);
  updateFlyers(dt);
  updateBoats(dt);
}
