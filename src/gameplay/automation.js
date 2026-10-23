POOLS.feed = {
  name: "Feed Stores",
  icon: "🌾",
  kinds: ["feed"],
  bld: "feedshed",
  per: 200,
  extra: { feedsilo: 700, feedmillstore: 2200 },
};
POOLS.warehouse.kinds = POOLS.warehouse.kinds.filter((k) => k !== "feed");
POOLCAP.feed = 0;
storageStats = function () {
  const byPool = {};
  for (const p in POOLS) byPool[p] = 0;
  let barn = 0;
  for (const k in S.inv) {
    const it = ITEMS[k];
    if (!it) continue;
    const p = poolOfKind(it.kind);
    if (p) byPool[p] += S.inv[k];
    else barn += S.inv[k];
  }
  const used = {};
  for (const p in byPool) {
    used[p] = Math.min(byPool[p], POOLCAP[p] || 0);
    barn += byPool[p] - used[p];
  }
  return {
    barnUsed: barn,
    barnCap: S.barnCap,
    siloUsed: used.silo,
    siloCap: POOLCAP.silo,
    used,
    cap: POOLCAP,
  };
};
const STORE_ART = (wall, roof, sign, z, w, h) => ({
  plaza: "#cfc8b8",
  blocks: [
    BL(0.2, 0.25, w - 0.4, h - 0.5, z, {
      wall,
      rc: roof,
      roof: "flat",
      win: "garage",
      door: true,
    }),
  ],
  sign,
});
Object.assign(BUILD, {
  feedshed: {
    name: "Feed Shed",
    icon: "🛖",
    cat: "farm",
    w: 2,
    h: 2,
    cost: 700,
    ht: 44,
    desc: "Keeps 200 animal feed out of the barn.",
    art: {
      blocks: [
        BL(0.25, 0.3, 1.5, 1.4, 22, {
          wall: "#d7b98c",
          rc: "#6d4c41",
          roof: "gy",
          rh: 14,
          win: "garage",
          door: true,
        }),
      ],
      sign: "🌾",
    },
  },
  feedsilo: {
    name: "Feed Silo",
    icon: "🗼",
    cat: "farm",
    w: 2,
    h: 2,
    cost: 2600,
    ht: 96,
    desc: "A tall silo for 700 feed.",
    art: {
      blocks: [
        BL(0.3, 0.3, 1.4, 1.4, 84, {
          wall: "#bcaaa4",
          rc: "#4caf50",
          roof: "dome",
          rh: 10,
          win: "none",
        }),
      ],
      sign: "🌾",
    },
  },
  feedmillstore: {
    name: "Feed Distribution Center",
    icon: "🏭",
    cat: "farm",
    w: 4,
    h: 3,
    cost: 9000,
    ht: 70,
    desc: "Industrial feed storage: 2,200 feed for big ranches.",
    art: {
      plaza: "#cfc8b8",
      blocks: [
        BL(0.2, 0.3, 1.0, 1.0, 66, {
          wall: "#d7ccc8",
          rc: "#689f38",
          roof: "dome",
          rh: 8,
          win: "none",
        }),
        BL(1.4, 0.3, 1.0, 1.0, 66, {
          wall: "#d7ccc8",
          rc: "#689f38",
          roof: "dome",
          rh: 8,
          win: "none",
        }),
        BL(0.2, 1.5, 3.6, 1.2, 24, {
          wall: "#bcaaa4",
          rc: "#5d4037",
          roof: "flat",
          win: "garage",
          door: true,
        }),
      ],
    },
  },
  grainterminal: {
    name: "Grain Terminal",
    icon: "🌾",
    cat: "farm",
    w: 4,
    h: 3,
    cost: 9000,
    ht: 90,
    desc: "Huge grain store: holds 6,000 crops.",
    art: {
      blocks: [
        BL(0.2, 0.3, 1.0, 1.0, 80, {
          wall: "#d7ccc8",
          rc: "#8d6e63",
          roof: "dome",
          rh: 8,
          win: "none",
        }),
        BL(1.3, 0.3, 1.0, 1.0, 80, {
          wall: "#d7ccc8",
          rc: "#8d6e63",
          roof: "dome",
          rh: 8,
          win: "none",
        }),
        BL(2.4, 0.3, 1.0, 1.0, 80, {
          wall: "#d7ccc8",
          rc: "#8d6e63",
          roof: "dome",
          rh: 8,
          win: "none",
        }),
        BL(0.2, 1.5, 3.6, 1.2, 24, {
          wall: "#bcaaa4",
          rc: "#6d4c41",
          roof: "flat",
          win: "garage",
          door: true,
        }),
      ],
    },
  },
  coldhub: {
    name: "Refrigerated Warehouse",
    icon: "🧊",
    cat: "farm",
    w: 3,
    h: 3,
    cost: 5200,
    ht: 56,
    desc: "Keeps 400 animal products fresh.",
    art: STORE_ART("#e3f2fd", "#64b5f6", "🧊", 34, 3, 3),
  },
  freezerplant: {
    name: "Freezer Complex",
    icon: "❄️",
    cat: "farm",
    w: 4,
    h: 4,
    cost: 12000,
    ht: 64,
    desc: "Industrial cold chain: 1,200 animal products.",
    art: STORE_ART("#e1f5fe", "#0288d1", "❄️", 40, 4, 4),
  },
  storagehall: {
    name: "Storage Hall",
    icon: "🏬",
    cat: "prod",
    w: 3,
    h: 3,
    cost: 4800,
    ht: 54,
    desc: "Holds 350 goods, feed and exotic items.",
    art: STORE_ART("#d7c4a3", "#6d6d6d", "📦", 32, 3, 3),
  },
  logistics: {
    name: "Logistics Center",
    icon: "🚚",
    cat: "prod",
    w: 4,
    h: 4,
    cost: 11000,
    ht: 60,
    desc: "Holds 1,000 goods with loading docks.",
    art: STORE_ART("#eceff1", "#455a64", "🚚", 38, 4, 4),
  },
  distribution: {
    name: "Distribution Hub",
    icon: "🏭",
    cat: "prod",
    w: 5,
    h: 5,
    cost: 24000,
    ht: 66,
    desc: "A giant warehouse: 3,000 goods.",
    art: STORE_ART("#cfd8dc", "#37474f", "🏭", 44, 5, 5),
  },
  materialyard: {
    name: "Material Yard",
    icon: "🧱",
    cat: "ind",
    w: 3,
    h: 3,
    cost: 3600,
    ht: 46,
    desc: "Stacks 300 bricks, planks, tools and ores.",
    art: STORE_ART("#d7ccc8", "#5d4037", "🧱", 26, 3, 3),
  },
  builderyard: {
    name: "Construction Supply Yard",
    icon: "🏗️",
    cat: "ind",
    w: 4,
    h: 4,
    cost: 9000,
    ht: 56,
    desc: "Holds 900 construction materials and tools.",
    art: Object.assign(STORE_ART("#ffe0b2", "#e65100", "🏗️", 30, 4, 4), {
      fx: "crane",
    }),
  },
  megadepot: {
    name: "Mega Depot",
    icon: "🏢",
    cat: "ind",
    w: 5,
    h: 5,
    cost: 22000,
    ht: 70,
    desc: "Endless shelves: 2,500 materials, tools and ores.",
    art: STORE_ART("#bcaaa4", "#3e2723", "🏢", 46, 5, 5),
  },
});
for (const t of [
  "feedshed",
  "feedsilo",
  "feedmillstore",
  "grainterminal",
  "coldhub",
  "freezerplant",
  "storagehall",
  "logistics",
  "distribution",
  "materialyard",
  "builderyard",
  "megadepot",
])
  DRAW[t] = drawArt;
POOLS.silo.extra = Object.assign(POOLS.silo.extra || {}, {
  grainterminal: 6000,
});
POOLS.cold.extra = Object.assign(POOLS.cold.extra || {}, {
  coldhub: 400,
  freezerplant: 1200,
});
POOLS.warehouse.extra = Object.assign(POOLS.warehouse.extra || {}, {
  storagehall: 350,
  logistics: 1000,
  distribution: 3000,
});
POOLS.depot.extra = Object.assign(POOLS.depot.extra || {}, {
  materialyard: 300,
  builderyard: 900,
  megadepot: 2500,
});
Object.assign(JOBS, {
  feedshed: { n: 1, k: "farmer", w: 30 },
  feedsilo: { n: 2, k: "farmer", w: 34 },
  feedmillstore: { n: 8, k: "worker", w: 42 },
  grainterminal: { n: 6, k: "worker", w: 42 },
  coldhub: { n: 4, k: "worker", w: 40 },
  freezerplant: { n: 8, k: "worker", w: 44 },
  storagehall: { n: 4, k: "driver", w: 40 },
  logistics: { n: 12, k: "driver", w: 46 },
  distribution: { n: 24, k: "driver", w: 48 },
  materialyard: { n: 4, k: "worker", w: 40 },
  builderyard: { n: 8, k: "worker", w: 44 },
  megadepot: { n: 16, k: "worker", w: 46 },
  silo: { n: 1, k: "farmer", w: 30 },
  warehouse: { n: 2, k: "driver", w: 38 },
  depot: { n: 2, k: "worker", w: 38 },
  coldstore: { n: 2, k: "worker", w: 38 },
});

for (const t in BUILD) {
  const b = BUILD[t];
  b.tier = b.tier || b.level || 1;
  if (b.cat !== "soon") b.level = 1;
  delete b.max;
}
for (const r in RECIPES) {
  RECIPES[r].tier = RECIPES[r].level || 1;
  RECIPES[r].level = 1;
}
for (const k in CROPS) {
  CROPS[k].tier = CROPS[k].level || 1;
  CROPS[k].level = 1;
}

needsBuild = function (t) {
  const b = BUILD[t];
  if (
    b.flat ||
    b.paint ||
    b.cat === "event" ||
    b.cat === "unique" ||
    t === "rail" ||
    t === "fence" ||
    b.multi ||
    b.nature
  )
    return false;
  return !!(
    b.cap ||
    ["trans", "ind", "util", "wonder", "mil"].includes(b.cat) ||
    (b.rent && b.tier >= 9) ||
    (b.cat === "prod" && b.tier >= 11) ||
    (b.cost || 0) >= 1500
  );
};

function staffRatio(e) {
  if (typeof positionsOf !== "function") return 0;
  const pos = positionsOf(e);
  if (!pos) return 0;
  return Math.min(1, (jobEmp.get(e.id) || []).length / pos);
}
const _jobDurAuto = jobDur;
jobDur = function (e, r) {
  const s = staffRatio(e);
  return Math.round(_jobDurAuto(e, r) * (s > 0 ? 1.2 - 0.35 * s : 1));
};
function itemDemand() {
  if (itemDemand.c && itemDemand.c.t === NOW) return itemDemand.c.need;
  const need = {},
    want = (k, n) => {
      if (n > 0) need[k] = (need[k] || 0) + n;
    },
    wantAll = (items) => {
      for (const k in items) want(k, items[k]);
    };
  for (const o of S.orders) wantAll(o.items);
  for (const c of S.courier || []) if (c.o) wantAll(c.o.items);
  for (const c of S.contracts || []) if (!c.done) wantAll(c.items);
  for (const o of S.express || []) want(o.k, o.n);
  for (const t of (S.rail && S.rail.trains) || [])
    if (t.st === "docked" && t.cars)
      for (const c of t.cars) if (!c.filled) want(c.nk, c.nn);
  for (const p of (S.air && S.air.planes) || [])
    if (p.st === "docked" && p.crates)
      for (const c of p.crates) if (!c.filled) want(c.k, c.n);
  for (const t of ANIMAL_TYPES) {
    const n = countOf(t);
    if (n) want(BUILD[t].feed, n * (BUILD[t].slots || 3) * 2);
  }
  itemDemand.c = { t: NOW, need };
  return need;
}
function outputUseful(out) {
  const it = ITEMS[out];
  if (!it) return false;
  if (it.kind === "feed")
    return (
      ANIMAL_TYPES.some((t) => BUILD[t].feed === out && countOf(t) > 0) ||
      (itemDemand()[out] || 0) > 0
    );
  return true;
}
function autoRecipe(e) {
  const b = BUILD[e.t];
  if (!b.recipes) return null;
  const can = (r) =>
    RECIPES[r] &&
    Object.entries(RECIPES[r].in).every(([k, n]) => (S.inv[k] || 0) >= n);
  if (e.autoR && e.autoR !== "auto") return can(e.autoR) ? e.autoR : null;
  const need = itemDemand();
  let best = null,
    bestGap = 0;
  for (const r of b.recipes) {
    const out = (RECIPES[r] && RECIPES[r].out) || r;
    if (!can(r) || !outputUseful(out)) continue;
    const have = S.inv[out] || 0,
      target = Math.max(
        need[out] || 0,
        ITEMS[out] && ITEMS[out].kind === "feed" ? 0 : 6,
      );
    const gap = target - have;
    if (gap > bestGap) {
      bestGap = gap;
      best = r;
    }
  }
  return best;
}
let autoT = 0;
function automationTick() {
  if (!S.people || ++autoT % 2) return;
  for (const t of FACTORY_TYPES)
    for (const e of entsOf(t)) {
      if (
        e.build ||
        e.moving ||
        e.burnt ||
        e.autoR === "off" ||
        (e.fire && e.fire > NOW)
      )
        continue;
      const s = staffRatio(e);
      if (s <= 0) continue;
      if (e.out && e.out.length) collectGoods(e, true);
      const busy = (e.job ? 1 : 0) + (e.queue ? e.queue.length : 0),
        want = Math.max(1, Math.round(slotsOf(e) * s));
      if (busy < want) {
        const r = autoRecipe(e);
        if (r) startRecipe(e, r, true);
      }
    }
  for (const e of world.ents.values()) {
    const b = BUILD[e.t];
    if (e.nat || e.build || e.burnt || e.moving) continue;
    if (b.produce && producerReady(e) && staffRatio(e) > 0)
      producerCollect(e, true);
    if (b.animal && staffRatio(e) > 0) {
      feedAnimals(e, true);
      collectAnimals(e, true);
    }
  }
}

const _tryPlaceAuto = tryPlace;
tryPlace = function () {
  const t = mode.type === "place" && !mode.ent ? mode.t : null,
    n0 = t ? countOf(t) : 0;
  _tryPlaceAuto();
  if (!t || countOf(t) <= n0 || !S.people) return;
  const spec = jobSpec(t);
  if (!spec) return;
  const e = [...entsOf(t)].reduce((a, b) => (!a || b.id > a.id ? b : a), null);
  if (!e || e.build) {
    toastOnce(
      `📋 ${spec.n} jobs will open when construction finishes.`,
      "info",
    );
    return;
  }
  setTimeout(() => {
    jobMarket(spec.n * 2);
    venueCache = null;
    const n = employeesOf(e).length;
    toastOnce(
      `📋 ${positionsOf(e)} jobs posted at the ${BUILD[t].name} - ${n} resident${n === 1 ? "" : "s"} already hired.`,
      "good",
    );
  }, 150);
};

const _finishConstructionAuto = finishConstruction;
finishConstruction = function (e) {
  const r = _finishConstructionAuto.apply(this, arguments);
  if (S.people && jobSpec(e.t)) setTimeout(() => jobMarket(60), 100);
  return r;
};

function autoProduceHTML(e) {
  const b = BUILD[e.t];
  if (!b.recipes || !FACTORY_TYPES.includes(e.t)) return "";
  const cur = e.autoR || "auto",
    s = staffRatio(e);
  const btn = (v, label, title) =>
    `<button class="${cur === v ? "on" : ""}" data-act="b-autor" data-v="${v}" title="${title || ""}">${label}</button>`;
  return `<div class="pp-sec"><div class="pp-sec-h">⚙️ Automatic production ${s > 0 ? `<small>staffed ${Math.round(s * 100)}% · runs by itself</small>` : "<small>needs workers</small>"}</div>
    <div class="seg wrap">${btn("auto", "🧠 Smart", "Makes only what is needed: orders, trains, planes, contracts and feed for the animals you own")}${b.recipes.map((r) => btn(r, GOODS[r] ? GOODS[r].icon : "•", GOODS[r] ? GOODS[r].name : r)).join("")}${btn("off", "⏸ Off")}</div>
    <div class="pp-note">${s > 0 ? "Residents working here start recipes and move finished goods into storage automatically." : "Hire residents (positions above) and this building will produce on its own."}</div></div>`;
}
Object.assign(ACT, {
  "b-autor": (d) => {
    const e = popEnt();
    if (e) {
      e.autoR = d.v;
      if (pop) pop.lastSig = "";
      sfx("click");
    }
  },
});
const _extraInfoAuto = extraInfo;
extraInfo = function (e) {
  return (
    _extraInfoAuto(e) + (e && !e.build && S.people ? autoProduceHTML(e) : "")
  );
};

const _buildCostAuto = buildCost;
buildCost = function (t) {
  return Math.round(_buildCostAuto(t) * (1 - 0.05 * mayor("m_land")));
};
