const POOLS = {
  silo: {
    name: "Grain Silos",
    icon: "🛢️",
    kinds: ["crop"],
    bld: "silo",
    per: 80,
    extra: { megasilo: 400, elevator: 1000, granary: 2500 },
  },
  cold: {
    name: "Cold Storage",
    icon: "❄️",
    kinds: ["animal"],
    bld: "coldstore",
    per: 60,
  },
  warehouse: {
    name: "Warehouses",
    icon: "🏬",
    kinds: ["good", "feed", "exotic"],
    bld: "warehouse",
    per: 80,
  },
  depot: {
    name: "Material Depot",
    icon: "🧰",
    kinds: ["material", "tool", "ore"],
    bld: "depot",
    per: 70,
  },
};
Object.assign(BUILD, {
  coldstore: {
    name: "Cold Storage",
    icon: "❄️",
    cat: "farm",
    w: 2,
    h: 2,
    cost: 1600,
    level: 12,
    xp: 30,
    ht: 50,
    max: 4,
    desc: "Keeps 60 eggs, milk, wool and other animal produce.",
    art: {
      blocks: [
        BL(0.25, 0.3, 1.5, 1.4, 28, {
          wall: "#e3f2fd",
          rc: "#90caf9",
          roof: "flat",
          win: "garage",
          door: true,
        }),
      ],
      sign: "❄️",
    },
  },
  warehouse: {
    name: "Warehouse",
    icon: "🏬",
    cat: "prod",
    w: 2,
    h: 2,
    cost: 1400,
    level: 11,
    xp: 30,
    ht: 50,
    max: 4,
    desc: "Stores 80 goods, feed and exotic items.",
    art: {
      blocks: [
        BL(0.2, 0.3, 1.6, 1.4, 30, {
          wall: "#c9b48a",
          rc: "#6d6d6d",
          roof: "gx",
          rh: 12,
          win: "garage",
          door: true,
        }),
      ],
      sign: "📦",
    },
  },
  depot: {
    name: "Material Depot",
    icon: "🧰",
    cat: "ind",
    w: 2,
    h: 2,
    cost: 1200,
    level: 9,
    xp: 25,
    ht: 46,
    max: 4,
    desc: "Stores 70 materials, tools and ores.",
    art: {
      blocks: [
        BL(0.25, 0.35, 1.5, 1.3, 24, {
          wall: "#d7ccc8",
          rc: "#5d4037",
          roof: "gy",
          rh: 14,
          win: "garage",
          door: true,
        }),
      ],
      sign: "🧰",
    },
  },
});
const POOLCAP = { silo: 0, cold: 0, warehouse: 0, depot: 0 };
function poolOfKind(kind) {
  for (const p in POOLS) if (POOLS[p].kinds.includes(kind)) return p;
  return null;
}
function recalcPools() {
  for (const p in POOLS) {
    let c = 0;
    const blds = Object.assign(
      { [POOLS[p].bld]: POOLS[p].per },
      POOLS[p].extra || {},
    );
    for (const t in blds)
      for (const e of entsOf(t))
        if (!e.moving && !e.dying && !e.build)
          c +=
            blds[t] * lvlOf(e) * (p === "silo" && hasPerk("bigsilo") ? 1.5 : 1);
    POOLCAP[p] = Math.round(c);
  }
  SILOCAP = POOLCAP.silo;
}

storageStats = function () {
  const byPool = { silo: 0, cold: 0, warehouse: 0, depot: 0 };
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
    used[p] = Math.min(byPool[p], POOLCAP[p]);
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
spaceFor = function (k) {
  const it = ITEMS[k];
  if (!it) return 0;
  if (it.kind === "booster") return 1e9;
  const s = storageStats(),
    bf = s.barnCap - s.barnUsed;
  const p = poolOfKind(it.kind);
  return bf + (p ? s.cap[p] - s.used[p] : 0);
};

function addGems(n, why) {
  if (n <= 0) return;
  S.gems += n;
  bump("#pill-gems");
  if (why) toast(`💎 +${n} gems - ${why}`, "good");
}
function spendGems(n) {
  if (S.gems < n) {
    toastOnce(
      "Not enough gems 💎 - earn them from achievements, level-ups, chests & the mine.",
      "warn",
    );
    sfx("error");
    shakeEl("#pill-gems");
    return false;
  }
  S.gems -= n;
  bump("#pill-gems");
  return true;
}
function gemCost(ms) {
  return Math.max(1, Math.ceil(ms / 30000));
}

function notify(icon, text, toastIt) {
  S.log.unshift({ t: Date.now(), icon, text });
  if (S.log.length > 40) S.log.length = 40;
  S.unread = (S.unread || 0) + 1;
  if (toastIt !== false) toast(`${icon} ${text}`, "info");
}

function needsBuild(t) {
  const b = BUILD[t];
  if (
    b.flat ||
    b.paint ||
    b.cat === "event" ||
    b.cat === "unique" ||
    t === "rail" ||
    t === "fence"
  )
    return false;
  return !!(
    b.cap ||
    ["trans", "ind", "util", "wonder"].includes(b.cat) ||
    (b.rent && b.level >= 9) ||
    (b.cat === "prod" && b.level >= 11)
  );
}
function matsFor(t) {
  const b = BUILD[t],
    c = b.cost || 0,
    n = Math.max(1, Math.round(Math.sqrt(c) / 12));
  const m = { planks: n + 1, bricks: n };
  if (b.level >= 10) m.glass = Math.max(1, Math.round(n * 0.6));
  if (b.level >= 18) m.steel = Math.max(1, Math.round(n * 0.4));
  if (b.cat === "wonder") {
    m.steel = n * 2;
    m.glass = n * 2;
    m.goldbar = 3;
  }
  return m;
}
function buildTimeFor(t) {
  const c = BUILD[t].cost || 0;
  return Math.round(
    clamp(8000 + c * 4, 8000, BUILD[t].cat === "wonder" ? 600000 : 240000),
  );
}
function startConstruction(e) {
  e.build = {
    need: matsFor(e.t),
    have: {},
    st: NOW,
    dur: buildTimeFor(e.t),
    prog: 0,
  };
}
function siteBuilders(e) {
  return S.workers.filter(
    (w) => w.role === "builder" && w.task && w.task.id === e.id && w.working,
  ).length;
}
function constructionTick(dt) {
  for (const e of world.ents.values()) {
    if (!e.build) continue;
    const b = e.build;
    if (b.prog < 1)
      b.prog = Math.min(1, b.prog + (dt / b.dur) * (1 + 0.5 * siteBuilders(e)));
    if (b.prog >= 1 && matsComplete(e)) finishConstruction(e);
  }
}
function matsComplete(e) {
  for (const k in e.build.need)
    if ((e.build.have[k] || 0) < e.build.need[k]) return false;
  return true;
}
function deliverMats(e, quiet) {
  let n = 0;
  for (const k in e.build.need) {
    const missing = e.build.need[k] - (e.build.have[k] || 0);
    const give = Math.min(missing, S.inv[k] || 0);
    if (give > 0) {
      takeItem(k, give);
      e.build.have[k] = (e.build.have[k] || 0) + give;
      n += give;
    }
  }
  if (n && !quiet) {
    sfx("build");
    const p = entWorld(e, 30);
    floatText(p[0], p[1], `+${n} materials`, "#ffffff", 13);
  }
  if (!n && !quiet) {
    const miss = Object.entries(e.build.need)
      .filter(([k, v]) => (e.build.have[k] || 0) < v)
      .map(([k, v]) => `${v - (e.build.have[k] || 0)} ${ITEMS[k].icon}`)
      .join(" ");
    toastOnce(
      `Need materials: ${miss}. Buy them in Store → 🧱 Supplies, or get them from trains 🚂, the Quarry & factories.`,
      "warn",
    );
    sfx("error");
  }
  return n;
}
function finishConstruction(e) {
  delete e.build;
  e.born = NOW;
  S.stats.constructed++;
  if (BUILD[e.t].cat === "wonder") {
    S.stats.wonders++;
    addGems(10, "Wonder completed!");
  }
  if (e.t === "jobs") refreshCandidates();
  recalcPop();
  recalcPools();
  worldChanged();
  const p = entWorld(e, 40);
  burst(
    p[0],
    p[1],
    30,
    ["#ffd23f", "#ef6351", "#6cc04a", "#47b2ee"],
    "confetti",
    90,
  );
  sfx("level");
  notify("🏗️", `${BUILD[e.t].name} is complete!`);
}
function constructionPopup(e) {
  const b = BUILD[e.t];
  showPopup(e, {
    sig: () =>
      JSON.stringify([
        e.build && e.build.have,
        S.inv,
        S.gems,
        e.build && e.build.prog >= 1,
        S.coins >= missingMatsCost(e),
      ]),
    render: () => {
      if (!e.build) return "";
      const rows = Object.entries(e.build.need)
        .map(([k, v]) => {
          const h = e.build.have[k] || 0;
          return `<span class="ing ${h >= v ? "ok" : ""}">${ITEMS[k].icon} ${h}/${v} <small>(have ${S.inv[k] || 0})</small></span>`;
        })
        .join("");
      const left = (1 - e.build.prog) * e.build.dur;
      return `<div class="pp-title">🏗️ Building ${b.name}</div>
        <div class="pp-row"><div class="pbar"><div id="pp-bar"></div></div><span class="pp-t" id="pp-time"></span></div>
        <div class="pp-sub">Materials needed:</div><div class="r-ing wrap">${rows}</div>
        <div class="pp-btns mt"><button class="btn green small" data-act="p-mats">📦 Deliver materials</button>${missingMatsCost(e) ? `<button class="btn orange small" data-act="p-buymats">🛒 Buy missing · 🪙${fmt(missingMatsCost(e))}</button>` : ""}
        ${e.build.prog < 1 ? `<button class="btn purple small" data-act="p-gemfinish">💎 ${gemCost(left)} Finish now</button>` : ""}
        <button class="btn red small" data-act="p-cancelbuild">Cancel</button></div>`;
    },
    live: () => {
      if (!e.build) return;
      const t = document.getElementById("pp-time"),
        bar = document.getElementById("pp-bar");
      if (t)
        t.textContent =
          e.build.prog >= 1
            ? matsComplete(e)
              ? "Done!"
              : "Waiting for materials"
            : fmtTime(
                ((1 - e.build.prog) * e.build.dur) /
                  (1 + 0.5 * siteBuilders(e)),
              );
      if (bar) bar.style.width = e.build.prog * 100 + "%";
    },
  });
}

const CITY = {
  power: 0,
  powerDemand: 0,
  water: 0,
  waterDemand: 0,
  hap: 50,
  tourism: 0,
  tourists: 0,
  title: 0,
};
function utilRatio(kind) {
  if (S.level < 8) return 1;
  const d = kind === "power" ? CITY.powerDemand : CITY.waterDemand,
    s = kind === "power" ? CITY.power : CITY.water;
  return d <= 0 ? 1 : clamp(s / d, 0, 1);
}
let lastCityCalc = 0;
function cityTick() {
  if (NOW - lastCityCalc < 1500 && lastCityCalc) return;
  lastCityCalc = NOW;
  let pw = 0,
    wa = 0,
    pd = 0,
    wd = 0;
  for (const e of world.ents.values()) {
    if (e.build || e.moving) continue;
    const b = BUILD[e.t];
    if (b.power) pw += b.power * lvlOf(e);
    if (b.water) wa += b.water * lvlOf(e);
    if (b.pop) {
      pd += popOf(e);
      wd += popOf(e) * 1.2;
    }
    if (b.recipes) pd += 8;
  }
  CITY.power = pw;
  CITY.water = wa;
  CITY.powerDemand = Math.round(pd);
  CITY.waterDemand = Math.round(wd);

  const svcs = [];
  for (const sid in SERVICES)
    for (const t of SERVICES[sid].types)
      for (const e of entsOf(t))
        if (!e.build && !e.moving)
          svcs.push({
            sid,
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            r: SERVICES[sid].r + (lvlOf(e) - 1) * 2,
          });
  const deco = [],
    poll = [];
  for (const t in BEAUTY)
    for (const e of entsOf(t))
      deco.push({ x: e.x + 0.5, y: e.y + 0.5, v: BEAUTY[t] });
  for (const t of POLLUTERS)
    for (const e of entsOf(t))
      if (!e.build) poll.push({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
  const util = (utilRatio("power") + utilRatio("water")) / 2;
  const palaceBonus = hasType("palace") && !hasType("palace").build ? 10 : 0;
  let sum = 0,
    n = 0;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) {
      const cx = e.x + e.w / 2,
        cy = e.y + e.h / 2;
      const got = new Set();
      for (const s of svcs)
        if (!got.has(s.sid) && Math.hypot(s.x - cx, s.y - cy) <= s.r)
          got.add(s.sid);
      let beauty = 0;
      for (const d of deco)
        if (Math.abs(d.x - cx) <= 4 && Math.abs(d.y - cy) <= 4) beauty += d.v;
      let pol = 0;
      for (const p of poll)
        if (Math.abs(p.x - cx) <= 5 && Math.abs(p.y - cy) <= 5) pol += 10;
      const h = clamp(
        38 +
          got.size * 8 +
          Math.min(16, beauty) -
          pol +
          (util - 0.8) * 30 +
          palaceBonus,
        0,
        100,
      );
      e.hap = Math.round(h);
      e.svc = [...got];
      sum += h;
      n++;
    }
  CITY.hap = n ? Math.round(sum / n) : 50;

  let attr = 0,
    hotel = 0;
  for (const e of world.ents.values()) {
    if (e.build) continue;
    const b = BUILD[e.t];
    if (b.tour) attr += b.tour * lvlOf(e);
    if (b.hotel) hotel += b.hotel * lvlOf(e);
  }
  if (hasType("airport")) attr *= 1.4;
  if (hasType("seaport")) attr *= 1.15;
  if (hasType("trainstation")) attr *= 1.1;
  CITY.tourism = Math.round(
    attr * (CITY.hap / 60) * (1 + 0.1 * mayor("m_tour")),
  );
  CITY.tourists = Math.round(Math.min(CITY.tourism / 6, 20 + hotel));

  let ti = 0;
  for (let i = 0; i < TITLES.length; i++) if (POP >= TITLES[i].pop) ti = i;
  if (ti > (S.titleIdx || 0)) {
    S.titleIdx = ti;
    addGems(5 * ti, `Meadowvale is now a ${TITLES[ti].name}!`);
    notify("🏙️", `Your settlement grew into a ${TITLES[ti].name}!`);
    sfx("level");
  }
  CITY.title = S.titleIdx || 0;
}
function happyMult(e) {
  return 0.75 + 0.5 * ((e.hap == null ? 50 : e.hap) / 100);
}
function utilMult() {
  const u = (utilRatio("power") + utilRatio("water")) / 2;
  return 0.6 + 0.4 * u;
}
let tourAcc = 0;
function tourismTick(dt) {
  const guides = Math.min(
    3,
    S.workers.filter((w) => w.role === "tourguide" && !S.strike).length,
  );
  const perMin = CITY.tourists * 3 * (1 + 0.2 * guides);
  tourAcc += (perMin * dt) / 60000;
  if (tourAcc >= 1) {
    const c = Math.floor(tourAcc);
    tourAcc -= c;
    S.coins += c;
    S.stats.earned += c;
    S.stats.tourism += c;
  }
}

const SEASONS = [
  { name: "Spring", icon: "🌷" },
  { name: "Summer", icon: "☀️" },
  { name: "Autumn", icon: "🍂" },
  { name: "Winter", icon: "❄️" },
];
const WEATHER = {
  sunny: { name: "Sunny", icon: "☀️" },
  cloudy: { name: "Cloudy", icon: "⛅" },
  rain: { name: "Rain", icon: "🌧️", desc: "Crops grow 25% faster" },
  storm: { name: "Storm", icon: "⛈️", desc: "Ships are delayed" },
  heat: { name: "Heatwave", icon: "🥵", desc: "Animals are 25% slower" },
  snow: { name: "Snow", icon: "🌨️", desc: "Crops grow 20% slower" },
};
function seasonIdx() {
  return Math.floor(NOW / (DAY_LEN * 2000)) % 4;
}
function weatherTick() {
  if (!S.wx || NOW >= S.wx.until) {
    const s = seasonIdx();
    const roll = Math.random();
    let type = "sunny";
    if (s === 3) type = roll < 0.4 ? "snow" : roll < 0.6 ? "cloudy" : "sunny";
    else if (roll < 0.25) type = "rain";
    else if (roll < 0.35) type = "storm";
    else if (roll < (s === 1 ? 0.5 : 0.4)) type = "heat";
    else if (roll < 0.55) type = "cloudy";
    S.wx = { type, until: NOW + rand(120000, 240000) };
    if (type !== "sunny" && type !== "cloudy")
      notify(
        WEATHER[type].icon,
        `${WEATHER[type].name}: ${WEATHER[type].desc}`,
        false,
      );
  }
}
function weatherGrowMult() {
  const t = S.wx && S.wx.type;
  let m = t === "rain" ? 0.25 : t === "snow" ? -0.2 : 0;
  if (seasonIdx() === 3 && t !== "snow") m -= 0.1;
  return m;
}

function randomEventTick() {
  if (!S.nextEvent) S.nextEvent = NOW + 180000;
  if (NOW < S.nextEvent || S.level < 3) return;
  S.nextEvent = NOW + rand(180000, 320000);
  const kind = pick(["crows", "merchant", "festival"]);
  if (kind === "crows") {
    const fields = [...entsOf("field")].filter((f) => f.crop && !fieldReady(f));
    if (!fields.length) return;
    const f = pick(fields);
    const guarded = [...entsOf("scarecrow")].some(
      (s) => Math.abs(s.x - f.x) <= 4 && Math.abs(s.y - f.y) <= 4,
    );
    if (guarded)
      notify("🐦", "Crows swooped in - but your scarecrow chased them off!");
    else {
      f.pt = NOW;
      const p = entWorld(f, 20);
      floatText(p[0], p[1], "🐦🐦 Crows!", "#ffffff", 14);
      notify("🐦", "Crows pecked a field! Build Scarecrows to protect crops.");
    }
  } else if (kind === "merchant") {
    const pool = [
      "planks",
      "bricks",
      "glass",
      "stake",
      "shovel",
      "pickaxe",
      "coconut",
      "spice",
      "pearl",
      "ironbar",
    ];
    S.merchant = {
      until: NOW + 120000,
      offers: [0, 1, 2].map(() => {
        const k = pick(pool);
        const n = 2 + randi(4);
        return {
          k,
          n,
          coins: Math.round(ITEMS[k].price * n * 1.3),
          gems: Math.max(1, Math.round((ITEMS[k].price * n) / 120)),
        };
      }),
    };
    notify(
      "🧳",
      "A travelling merchant is in town for 2 minutes! Check 🎁 Events.",
    );
  } else if (kind === "festival") {
    S.boost.market = Math.max(NOW, S.boost.market || 0) + 90000;
    notify(
      "🎉",
      "Street festival! Customers arrive faster and pay more for 90s.",
    );
  } else if (kind === "fire") {
    const cands = [...world.ents.values()].filter(
      (e) => FACTORY_TYPES.includes(e.t) && !e.build,
    );
    if (!cands.length) return;
    const e = pick(cands);
    if (hasType("firestation"))
      notify(
        "🚒",
        `A small fire at the ${BUILD[e.t].name} was put out by your firefighters!`,
      );
    else {
      e.fire = NOW + 45000;
      notify(
        "🔥",
        `Fire at the ${BUILD[e.t].name}! Production paused - tap it to put it out (or build a Fire Station).`,
      );
    }
  }
}

function placeOK(t, x, y, ign, W, H) {
  const b0 = BUILD[t],
    b =
      W && (W !== b0.w || H !== b0.h)
        ? Object.assign({}, b0, { w: W, h: H })
        : b0;
  if (b.place === "water") {
    for (let j = 0; j < b.h; j++)
      for (let i = 0; i < b.w; i++) {
        const X = x + i,
          Y = y + j;
        const tt = terrAt(X, Y);
        if (t === "bridge" || b0.anyWater ? !isWaterT(tt) : tt !== T_SHALLOW)
          return false;
        const o = world.occ.get(tkey(X, Y));
        if (o != null && o !== ign) return false;
      }
    return true;
  }
  if (!canPlace(x, y, b.w, b.h, ign)) return false;
  if (b.place === "coast") {
    for (let j = -1; j <= b.h; j++)
      for (let i = -1; i <= b.w; i++)
        if (isWater(x + i, y + j) && inMap(x + i, y + j)) return true;
    return false;
  }
  if (b.place === "rocky") {
    const bi = BIOMES[bioAt(x, y)].id;
    return bi === "mountains" || bi === "peaks" || terrAt(x, y) === T_STONE;
  }
  return true;
}
function placeHint(t) {
  const p = BUILD[t].place;
  return p === "water"
    ? "Must be built on shallow water."
    : p === "coast"
      ? "Must touch the sea or a lake."
      : p === "rocky"
        ? "Must be built in the ⛰️ mountains (grey stone ground)."
        : "Can't build there.";
}

function paintTile(t, x, y) {
  const b = BUILD[t];
  if (entAt(x, y)) return false;
  const cur = terrAt(x, y);
  if (b.onWater ? !isWaterT(cur) : isWaterT(cur)) return false;
  if (cur === b.paint) return false;
  if (b.tool && !(S.inv[b.tool] > 0)) {
    toastOnce(
      `Needs a ${ITEMS[b.tool].name} ${ITEMS[b.tool].icon} - make one at the Tool Workshop or get one from trains.`,
      "warn",
    );
    return false;
  }
  if (!spend(b.cost)) return false;
  if (b.tool) takeItem(b.tool, 1);
  S.terrEdits[x + "," + y] = b.paint;
  setTerr(x, y, b.paint);
  worldChanged();
  const p = P(x + 0.5, y + 0.5);
  burst(p[0], p[1], 6, ["#c9b99a", "#8fd06a"], "dot", 30);
  return true;
}

function producerReady(e) {
  return NOW - (e.pp || 0) >= BUILD[e.t].produce.time;
}
function producerCollect(e, quiet) {
  const pr = BUILD[e.t].produce;
  if (!producerReady(e)) {
    if (!quiet) producerPopup(e);
    return 0;
  }
  const k = pr.items[(e.pc || 0) % pr.items.length];
  const n = pr.qty * lvlOf(e);
  if (spaceFor(k) < n) {
    if (!quiet) {
      toastOnce("Storage is full! 📦", "warn");
      sfx("error");
    }
    return 0;
  }
  addItem(k, n);
  e.pc = (e.pc || 0) + 1;
  e.pp = NOW;
  addXP(2);
  const p = entWorld(e, 20);
  floatText(p[0], p[1], `+${n} ${ITEMS[k].icon}`, "#ffffff");
  if (!quiet) {
    sfx("harvest");
    const [sx, sy] = entScreen(e, 20);
    flyIcon(ITEMS[k].icon, sx, sy, "#btn-inventory", n);
  }
  return n;
}
function producerPopup(e) {
  const pr = BUILD[e.t].produce;
  showPopup(e, {
    sig: () => "" + producerReady(e) + lvlOf(e),
    render:
      () => `<div class="pp-title">${thumbMini(e.t)} ${BUILD[e.t].name}</div><div class="pp-sub">Produces ${pr.items.map((k) => ITEMS[k].icon).join(" ")} ×${pr.qty * lvlOf(e)} every ${fmtTime(pr.time)}</div>
      <div class="pp-row"><div class="pbar"><div id="pp-bar"></div></div><span class="pp-t" id="pp-time"></span></div>${upgradeHTML(e)}
      <div class="pp-btns">${producerReady(e) ? '<button class="btn green small" data-act="p-produce">Collect</button>' : ""}<button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Sell</button></div>`,
    live: () => {
      const t = document.getElementById("pp-time"),
        b = document.getElementById("pp-bar");
      const g = clamp((NOW - (e.pp || 0)) / pr.time, 0, 1);
      if (t)
        t.textContent = g >= 1 ? "Ready!" : fmtTime(pr.time - (NOW - e.pp));
      if (b) b.style.width = g * 100 + "%";
    },
  });
}

function usePower(id) {
  if (!(S.powers[id] > 0)) return;
  if (BOOSTER_ITEMS[id]) {
    const bb = BOOSTERS.find((x) => x.id === BOOSTER_ITEMS[id].boost);
    S.powers[id]--;
    S.boost[bb.id] = Math.max(NOW, S.boost[bb.id] || 0) + bb.dur;
    toast(`${bb.icon} ${bb.name} active!`, "good");
    sfx("level");
    renderPanel(true);
    return;
  }
  let n = 0;
  if (id === "harvestwave")
    for (const f of [...entsOf("field")])
      if (
        fieldReady(f) &&
        isUnlocked(f.x, f.y) &&
        harvestField(f, null, null, { quiet: true, sweep: true })
      )
        n++;
  if (id === "sproutrain") {
    const c = S.lastCrop || "wheat";
    for (const f of entsOf("field")) if (!f.crop && plantField(f, c, true)) n++;
  }
  if (id === "rentday")
    for (const t of HOUSE_TYPES)
      for (const e of entsOf(t))
        if (rentReady(e) && !e.build) {
          collectRent(e, true);
          n++;
        }
  if (id === "timeskip")
    for (const t of FACTORY_TYPES)
      for (const e of entsOf(t))
        if (e.job) {
          e.job.st -= e.job.d || RECIPES[e.job.r].time;
          factoryTick(e);
          n++;
        }
  if (id === "clearsaw") {
    const [cx, cy] = screenToTile(VW / 2, VH / 2);
    for (const e of [...world.ents.values()])
      if (
        BUILD[e.t].nature &&
        Math.abs(e.x - cx) < 8 &&
        Math.abs(e.y - cy) < 8
      ) {
        removeEnt(e);
        S.stats.cleared++;
        n++;
      }
  }
  if (!n) {
    toast("Nothing to do right now - saved for later.");
    return;
  }
  S.powers[id]--;
  sfx("level");
  toast(`${POWERUPS[id].icon} ${POWERUPS[id].name}: ${n} done!`, "good");
  renderPanel(true);
}
function buyPowerWithGems(id) {
  const p = POWERUPS[id];
  if (!spendGems(p.gems)) return;
  S.powers[id] = (S.powers[id] || 0) + 1;
  sfx("coin");
  renderPanel(true);
}
function grantRandomPower() {
  const id = pick(Object.keys(POWERUPS));
  S.powers[id] = (S.powers[id] || 0) + 1;
  return id;
}
function grantRandomBooster() {
  const id = pick(Object.keys(BOOSTER_ITEMS));
  S.powers[id] = (S.powers[id] || 0) + 1;
  return id;
}

function giveReward(r, why) {
  const parts = [];
  if (r.coins) {
    addCoins(r.coins);
    parts.push(`🪙${fmt(r.coins)}`);
  }
  if (r.gems) {
    S.gems += r.gems;
    parts.push(`💎${r.gems}`);
  }
  if (r.clovers) {
    S.clovers += r.clovers;
    parts.push(`🍀${r.clovers}`);
  }
  if (r.power)
    for (let i = 0; i < r.power; i++) {
      const id = grantRandomPower();
      parts.push(POWERUPS[id].icon);
    }
  if (r.booster)
    for (let i = 0; i < r.booster; i++) {
      const id = grantRandomBooster();
      parts.push(BOOSTER_ITEMS[id].icon);
    }
  if (r.mats)
    for (let i = 0; i < r.mats; i++) {
      const k = pick(["planks", "bricks", "glass", "stake", "pickaxe"]);
      addItem(k, 1);
      parts.push(ITEMS[k].icon);
    }
  if (r.items)
    for (const [k, n] of Object.entries(r.items)) {
      addItem(k, n);
      parts.push(`${n}${ITEMS[k].icon}`);
    }
  if (why) toast(`🎁 ${why}: ${parts.join(" ")}`, "good");
  bump("#pill-gems");
  return parts.join(" ");
}

function levelRewards(l) {
  const r = { gems: l % 5 === 0 ? 5 : 1, items: { stake: 2 } };
  if (l >= 6) r.items.shovel = 1;
  if (l % 5 === 0) r.items.deed = 1;
  if (l >= 8) r.items.planks = 3;
  return r;
}
