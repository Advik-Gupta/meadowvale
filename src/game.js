let S = null;
let mode = { type: null };
let POP = 0;
let resetting = false;

function defaultState() {
  return {
    v: 2,
    mapV: MAP_V,
    seed: 0,
    seedText: "",
    spawn: { x: 0, y: 0 },
    genSpawn: { x: 0, y: 0 },
    clearBoxes: [],
    natGone: {},
    biomesSeen: {},
    coins: 100,
    xp: 0,
    level: 1,
    seeds: { wheat: 20, rice: 20 },
    inv: {},
    barnCap: 60,
    barnLvl: 0,
    stats: {
      harvested: 0,
      planted: 0,
      served: 0,
      earned: 0,
      housesBuilt: 0,
      expansions: 0,
      cleared: 0,
      crafted: 0,
      rent: 0,
      fieldsBought: 0,
      hired: 0,
      animalProducts: 0,
      couriers: 0,
      wagesPaid: 0,
      civicBuilt: 0,
      bridges: 0,
      perks: 0,
      upgrades: 0,
      trains: 0,
      voyages: 0,
      crates: 0,
      digs: 0,
      collections: 0,
      constructed: 0,
      dailies: 0,
      spins: 0,
      tourism: 0,
      wonders: 0,
    },
    perks: {},
    boost: {},
    bridges: {},
    gems: 5,
    clovers: 3,
    powers: { harvestwave: 1, rentday: 1 },
    rail: { trains: [], rep: {}, last: "pinewood" },
    sea: { ships: [], last: "coconut" },
    air: { planes: [] },
    mine: null,
    eng: {},
    artifacts: {},
    openings: {},
    jobNext: {},
    selW: null,
    staffCollapsed: {},
    mayor: {},
    req: {},
    album: {},
    albumClaim: {},
    express: [],
    expressNext: 0,
    xch: null,
    coop: null,
    realism: false,
    colClaimed: {},
    decorBag: {},
    unlockedDecor: {},
    daily: null,
    streak: { last: "", n: 0 },
    evt: null,
    contracts: [],
    rep: {},
    trends: null,
    log: [],
    unread: 0,
    wx: null,
    nextEvent: 0,
    titleIdx: 0,
    terrEdits: {},
    merchant: null,
    lastCrop: "wheat",
    wheelRot: 0,
    ach: {},
    orders: [],
    nextOrder: 0,
    orderSeq: 1,
    tut: 0,
    questMin: false,
    workers: [],
    wseq: 1,
    cands: null,
    candT: 0,
    payAcc: 0,
    payT: 0,
    strike: false,
    courier: null,
    sound: true,
    daynight: true,
    cam: null,
    created: Date.now(),
    clock: 0,
    paused: false,
    speed: 1,
    people: null,
    pseq: 1,
    news: [],
    soc: {},
    socDay: {},
    hist: [],
    budHist: [],
    bud: null,
    tax: { inc: 8, sales: 6, biz: 10 },
    props: [],
    autoBiz: false,
    selP: null,
  };
}

const NAT_CODE = { tree: 0, rock: 1, bush: 2 };
let SILOCAP = 0;
function recalcPop() {
  let p = 0,
    cap = BASE_POPCAP,
    sc = 0;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) if (!e.dying && !e.build) p += popOf(e);
  for (const t of [...CIVIC_TYPES, "townhall"])
    for (const e of entsOf(t))
      if (!e.dying && !e.moving && !e.build) cap += capOf(e);
  void sc;
  POP = p;
  POPCAP = cap;
  recalcPools();
}
function hasType(t) {
  for (const e of entsOf(t)) if (!e.moving && !e.dying) return e;
  return null;
}
function hasAnyType(list) {
  for (const t of list) {
    const e = hasType(t);
    if (e) return e;
  }
  return null;
}
function countOf(t) {
  let n = 0;
  for (const e of entsOf(t)) if (!e.dying) n++;
  return n;
}

function barnUsed() {
  return storageStats().barnUsed;
}
function barnFree() {
  const s = storageStats();
  return s.barnCap - s.barnUsed;
}

const clock = {
  t: Date.now(),
  paused: false,
  speed: 1,
  last: performance.now(),
};
let ANIM = 0;
function advanceClock() {
  const r = performance.now(),
    d = Math.min(r - clock.last, 86400000);
  clock.last = r;
  if (!clock.paused) clock.t += d * clock.speed;
  NOW = clock.t;
  return NOW;
}
function setPaused(p) {
  advanceClock();
  clock.paused = p;
  $("#pause-root").classList.toggle("hidden", !p);
  if (p) {
    hidePopup();
    sfx("close");
  } else sfx("open");
  updateHUD();
}
function togglePause() {
  setPaused(!clock.paused);
}
function cycleSpeed() {
  advanceClock();
  clock.speed = clock.speed >= 3 ? 1 : clock.speed + 1;
  toastOnce(
    clock.speed === 1 ? "▶ Normal speed" : `⏩ Fast forward ×${clock.speed}`,
    "info",
  );
  sfx("click");
}
function fieldProgress(e) {
  if (!e.crop) return 0;
  return clamp((NOW - e.pt) / CROPS[e.crop].time, 0, 1);
}
function fieldReady(e) {
  return !!e.crop && NOW - e.pt >= CROPS[e.crop].time;
}
function rentReady(e) {
  return NOW - (e.rt || 0) >= BUILD[e.t].rentTime;
}
function entScreen(e, z) {
  const w = P(e.x + e.w / 2, e.y + e.h / 2, z || 0);
  return worldToScreen(w[0], w[1]);
}
function entWorld(e, z) {
  return P(e.x + e.w / 2, e.y + e.h / 2, z || 0);
}
function addItem(k, n) {
  S.inv[k] = (S.inv[k] || 0) + n;
}
function takeItem(k, n) {
  S.inv[k] = (S.inv[k] || 0) - n;
  if (S.inv[k] <= 0) delete S.inv[k];
}
function sfx(n) {
  Sfx.play(n);
}

function addCoins(n, sx, sy) {
  if (n <= 0) return;
  S.coins += n;
  S.stats.earned += n;
  if (sx != null)
    flyIcon("🪙", sx, sy, "#pill-coins", Math.min(6, Math.ceil(n / 15)));
  else bump("#pill-coins");
}
function spend(n) {
  if (S.coins < n) {
    toastOnce("Not enough coins! 🪙", "warn");
    sfx("error");
    shakeEl("#pill-coins");
    return false;
  }
  S.coins -= n;
  bump("#pill-coins");
  return true;
}
function addXP(n) {
  if (n <= 0) return;
  if (boostOn("xp")) n *= 2;
  S.xp += n;
  if (S.level >= 100) {
    S.xp = Math.min(S.xp, xpNeed(100));
    return;
  }
  while (S.level < 100 && S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level);
    S.level++;
    onLevelUp(S.level);
  }
}
function onLevelUp(l) {
  const unlocks = [];
  for (const k in CROPS)
    if (CROPS[k].level === l)
      unlocks.push({ icon: CROPS[k].icon, name: CROPS[k].name });
  for (const k in BUILD)
    if (
      BUILD[k].level === l &&
      !BUILD[k].special &&
      !BUILD[k].nature &&
      BUILD[k].cat !== "soon"
    )
      unlocks.push({
        img: THUMBS[k],
        icon: BUILD[k].icon,
        name: BUILD[k].name,
      });
  for (const k in RECIPES)
    if (RECIPES[k].level === l)
      unlocks.push({ icon: GOODS[k].icon, name: GOODS[k].name });
  for (const p of PERKS)
    if (p.level === l) unlocks.push({ icon: p.icon, name: p.name });
  for (const isl of world.islands)
    if (isl && isl.level === l) unlocks.push({ icon: "🌉", name: isl.name });
  for (const r in ROLES)
    if (ROLES[r].level === l)
      unlocks.push({ icon: ROLES[r].icon, name: ROLES[r].name });
  const reward = 50 * l;
  S.coins += reward;
  S.stats.earned += reward;
  const lr = levelRewards(l);
  giveReward(lr);
  unlocks.unshift(
    { icon: "💎", name: `+${lr.gems} gems` },
    {
      icon: "📍",
      name: Object.entries(lr.items)
        .map(([k, n]) => n + " " + ITEMS[k].name)
        .join(", "),
    },
  );
  showLevelUp(l, unlocks, reward);
  sfx("level");
  bump(".lvl-badge");
}

function plantField(f, crop, quiet) {
  if (f.crop || f.dying) return false;
  if (S.level < CROPS[crop].level) return false;
  if (!(S.seeds[crop] > 0)) {
    if (quiet) return false;
    toastOnce(
      `Out of ${CROPS[crop].name} seeds! Buy more in the 🏪 Store.`,
      "warn",
    );
    sfx("error");
    cancelMode();
    return false;
  }
  S.seeds[crop]--;
  f.crop = crop;
  f.pt = NOW;
  S.stats.planted++;
  S.lastCrop = crop;
  if (!quiet) sfx("plant");
  const p = entWorld(f, 4);
  burst(p[0], p[1], 6, ["#7b4a2a", "#9a6a40", "#5e3a20"], "dot", 40);
  if (mode.type === "plant") updatePlantBanner();
  return true;
}
function harvestField(f, sx, sy, opts) {
  opts = opts || {};
  if (!fieldReady(f)) return false;
  if (spaceFor(f.crop) < CROP_YIELD) {
    if (opts.quiet) return false;
    storageFullPrompt();
    shakeEl("#pill-barn");
    return false;
  }
  const c = f.crop;
  let y = CROP_YIELD;
  if (hasPerk("goldenfields") && Math.random() < 0.15 && spaceFor(c) > y) y++;
  addItem(c, y);
  S.stats.harvested += y;
  f.crop = null;
  f.pt = 0;
  addXP(CROPS[c].xp);
  if (!opts.quiet) sfx("harvest");
  const p = entWorld(f, 10);
  burst(
    p[0],
    p[1],
    10,
    c === "wheat"
      ? ["#f6c84c", "#e9b23a", "#fff1a8"]
      : ["#9bd35a", "#f1dd8f", "#ffffff", "#e8412f"],
    "leaf",
    70,
  );
  floatText(
    p[0],
    p[1] - 10,
    `+${y} ${CROPS[c].icon}`,
    y > CROP_YIELD ? "#ffe680" : "#ffffff",
  );
  if (mayor("m_harvestxp")) addXP(1);
  if (
    seedTotal() < seedCap() &&
    Math.random() < 0.25 + (opts.bonus || 0) + 0.05 * mayor("m_seed")
  ) {
    S.seeds[c] = (S.seeds[c] || 0) + 1;
    floatText(p[0] + 16, p[1] - 28, "+1 🌱", "#c8ff9a", 13);
  }
  if (!opts.quiet) {
    const [ssx, ssy] = sx != null ? [sx, sy] : entScreen(f, 10);
    flyIcon(CROPS[c].icon, ssx, ssy, "#btn-inventory", 1);
  }
  if (hasPerk("autoreplant") && (S.seeds[c] || 0) > 0) plantField(f, c, true);
  if (hasPerk("combine") && !opts.sweep) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const n = entAt(f.x + dx, f.y + dy);
        if (n && n !== f && n.t === "field" && fieldReady(n))
          harvestField(n, null, null, { quiet: true, sweep: true });
      }
  }
  return true;
}
function setPlantMode(crop) {
  if (S.level < CROPS[crop].level) return;
  if (!(S.seeds[crop] > 0)) {
    toastOnce(
      `No ${CROPS[crop].name} seeds left. Buy some in the Store!`,
      "warn",
    );
    openPanel("store", "seeds");
    return;
  }
  cancelMode(true);
  mode = { type: "plant", crop };
  updatePlantBanner();
  setCursorIcon(CROPS[crop].icon);
}
function updatePlantBanner() {
  if (mode.type !== "plant") return;
  const c = CROPS[mode.crop];
  setBanner(
    `<span class="mb-ic">${c.icon}</span><span>Planting <b>${c.name}</b> · <b>${S.seeds[mode.crop] || 0}</b> seeds left - tap or drag over empty fields</span>${Object.keys(
      CROPS,
    )
      .filter((k) => S.level >= CROPS[k].level && k !== mode.crop)
      .map(
        (k) =>
          `<button class="mb-swap" data-act="swapseed" data-id="${k}" title="Switch to ${CROPS[k].name}">${CROPS[k].icon}</button>`,
      )
      .join(
        "",
      )}${canRotate(mode.t) ? '<button class="btn small purple" data-act="rotate" title="Rotate (R)">🔄 Rotate</button>' : ""}<button class="btn small red" data-act="cancel">Done</button>`,
  );
}

function startPlace(t) {
  const b = BUILD[t];
  if (S.level < b.level) {
    toast(`🔒 ${b.name} unlocks at level ${b.level}`);
    return;
  }
  if (b.paint) {
    closePanel(true);
    hidePopup();
    cancelMode(true);
    mode = { type: "paint", t };
    setBanner(
      `<span class="mb-ic">${b.icon}</span><span><b>${b.name}</b> · 🪙${b.cost}${b.tool ? " + " + ITEMS[b.tool].icon : ""} per tile - tap or drag over your land</span><button class="btn small red" data-act="cancel">Done</button>`,
    );
    return;
  }
  if ((b.cat === "event" || b.cat === "unique") && !(S.decorBag[t] > 0)) {
    toast("You need to earn this decoration first (🎁 Events / 🏛️ Museum).");
    return;
  }
  if (b.max && countOf(t) >= b.max) {
    toastOnce(
      `You can only have ${b.max} ${b.name}${b.max > 1 ? "s" : ""}.`,
      "warn",
    );
    sfx("error");
    return;
  }
  if (S.coins < buildCost(t)) {
    toastOnce("Not enough coins! 🪙", "warn");
    sfx("error");
    shakeEl("#pill-coins");
    return;
  }
  closePanel(true);
  hidePopup();
  cancelMode(true);
  mode = { type: "place", t, rot: canRotate(t) ? lastRot : false };
  updatePlaceBanner();
  sfx("click");
}
function updatePlaceBanner() {
  if (mode.type !== "place") return;
  const b = BUILD[mode.t];
  if (mode.ent)
    setBanner(
      `<span class="mb-ic">✋</span><span>Moving <b>${b.name}</b> - tap a green spot to place it</span>${canRotate(mode.t) ? '<button class="btn small purple" data-act="rotate" title="Rotate (R)">🔄 Rotate</button>' : ""}<button class="btn small red" data-act="cancel">Cancel</button>`,
    );
  else
    setBanner(
      `<span class="mb-ic">🔨</span><span>Placing <b>${b.name}</b> · ${b.cat === "event" || b.cat === "unique" || (b.cat === "deco" && S.decorBag[mode.t] > 0) ? `from storage ×${S.decorBag[mode.t] || 0}` : "🪙" + fmt(buildCost(mode.t))} - tap green spots to place, keep going for more</span><button class="btn small red" data-act="cancel">Done</button>`,
    );
}
function startMove(e) {
  if (!e) return;
  if (e.t === "field" && e.crop) {
    toast("Harvest this field before moving it.");
    return;
  }
  hidePopup();
  cancelMode(true);
  setOcc(e, -1);
  e.moving = true;
  e.ox = e.x;
  e.oy = e.y;
  worldChanged();
  mode = { type: "place", t: e.t, ent: e, rot: !!e.flip, ow: e.w, oh: e.h };
  updatePlaceBanner();
}
function placeDims() {
  const b = BUILD[mode.t];
  if (!b) return [1, 1];
  return mode.rot && !b.flat ? [b.h, b.w] : [b.w, b.h];
}
function canRotate(t) {
  const b = BUILD[t];
  return !!b && !b.flat && !b.paint && t !== "field";
}
function rotatePlacement() {
  if (mode.type !== "place" || !canRotate(mode.t)) return;
  mode.rot = !mode.rot;
  lastRot = mode.rot;
  sfx("click");
  updatePlaceBanner();
}
let lastRot = false;
function ghostPos() {
  if (mode.type !== "place" || !hoverTile) return null;
  const [W, H] = placeDims();
  return [
    hoverTile[0] - Math.floor((W - 1) / 2),
    hoverTile[1] - Math.floor((H - 1) / 2),
  ];
}
function tryPlace() {
  const g = ghostPos();
  if (!g) return;
  const b = BUILD[mode.t],
    ign = mode.ent ? mode.ent.id : -1,
    [W, H] = placeDims();
  if (!placeOK(mode.t, g[0], g[1], ign, W, H)) {
    sfx("error");
    let why = placeHint(mode.t);
    if (!isUnlocked(g[0], g[1]) || !isUnlocked(g[0] + b.w - 1, g[1] + b.h - 1))
      why = "That island needs a 🌉 bridge first!";
    toastOnce(why, "warn");
    return;
  }
  const wp = P(g[0] + W / 2, g[1] + H / 2, 4);
  if (mode.ent) {
    const e = mode.ent;
    e.x = g[0];
    e.y = g[1];
    e.w = W;
    e.h = H;
    e.flip = !!mode.rot && canRotate(e.t);
    e.moving = false;
    delete e.ox;
    delete e.oy;
    setOcc(e, e.id);
    e.born = NOW;
    worldChanged();
    sfx("build");
    burst(wp[0], wp[1], 14, ["#e8dcc4", "#c9b99a", "#ffffff"], "dot", 60);
    mode = { type: null };
    hideBanner();
    return;
  }
  const cost = buildCost(mode.t);
  if (b.pop && POP + b.pop > POPCAP) {
    toastOnce(
      `👥 Population cap reached (${POP}/${POPCAP})! Build community buildings like a Park or School to raise it.`,
      "warn",
    );
    sfx("error");
    return;
  }
  const bag =
    b.cat === "event" ||
    b.cat === "unique" ||
    (b.cat === "deco" && S.decorBag[mode.t] > 0);
  if (bag) {
    if (!(S.decorBag[mode.t] > 0)) {
      cancelMode();
      return;
    }
    S.decorBag[mode.t]--;
  } else if (!spend(cost)) {
    cancelMode();
    return;
  }
  const e = addEnt(
    newEntity(
      mode.t,
      g[0],
      g[1],
      mode.rot && canRotate(mode.t) ? { w: W, h: H, flip: true } : {},
    ),
  );
  e.born = NOW;
  if (b.produce) e.pp = NOW;
  if (b.orchard) orchardInit(e);
  if (needsBuild(mode.t)) {
    startConstruction(e);
    toast(
      `🏗️ Construction started! Tap the site to deliver ${Object.entries(
        e.build.need,
      )
        .map(([k, n]) => n + " " + ITEMS[k].icon)
        .join(" ")}.`,
      "info",
    );
  }
  if (mode.t === "field") S.stats.fieldsBought++;
  if (HOUSE_TYPES.includes(mode.t)) S.stats.housesBuilt++;
  if (b.walk) S.stats.roadsBuilt = (S.stats.roadsBuilt || 0) + 1;
  if (b.cap) S.stats.civicBuilt++;
  addXP(b.xp || 0);
  recalcPop();
  sfx("build");
  burst(
    wp[0],
    wp[1],
    b.w > 1 ? 22 : 10,
    ["#e8dcc4", "#c9b99a", "#ffffff"],
    "dot",
    b.w > 1 ? 90 : 50,
  );
  floatText(wp[0], wp[1] - 20, `-🪙${cost}`, "#ffd23f", 13);
  if (b.xp) floatText(wp[0], wp[1] - 38, `+${b.xp}⭐`, "#c8ff9a", 12);
  if (mode.t === "jobs") {
    refreshCandidates();
    toast(
      "🧑‍💼 Employment Office open! Hire staff from the 👷 Staff menu.",
      "good",
    );
  }
  if (mode.t === "courier") {
    courierTick();
    toast(
      "📮 Courier Office open! Find contracts in 🧾 Orders → Courier.",
      "good",
    );
  }
  if (FACTORY_TYPES.includes(mode.t)) {
    const m = S.workers.find(
      (w) => w.role === "manager" && !world.ents.get(w.cfg.fid),
    );
    if (m) setManagerFactory(m, e.id);
  }

  if (bag && !(S.decorBag[mode.t] > 0)) {
    mode = { type: null };
    hideBanner();
  } else if (b.max && countOf(mode.t) >= b.max) {
    toastOnce(`That's the maximum number of ${b.name}s.`, "info");
    mode = { type: null };
    hideBanner();
  } else if (!bag && S.coins < buildCost(mode.t)) {
    toastOnce("Out of coins for more!", "warn");
    mode = { type: null };
    hideBanner();
  } else updatePlaceBanner();
}
function cancelMode(silent) {
  if (mode.type === "group") cancelGroup();
  if (mode.type === "edit") editSel.clear();
  if (mode.type === "place" && mode.ent) {
    const e = mode.ent;
    e.x = e.ox;
    e.y = e.oy;
    if (mode.ow) {
      e.w = mode.ow;
      e.h = mode.oh;
    }
    e.moving = false;
    delete e.ox;
    delete e.oy;
    setOcc(e, e.id);
    worldChanged();
  }
  mode = { type: null };
  hideBanner();
  setCursorIcon(null);
  if (!silent) sfx("close");
}
function sellEntity(e) {
  if (!e) return;
  const b = BUILD[e.t];
  if (b.special) {
    toast(
      e.t === "bridge"
        ? "Bridges are permanent."
        : `The ${b.name} is essential - it can't be sold, but you can move it.`,
    );
    return;
  }
  if (e.t === "field" && e.crop) {
    toast("Harvest this field first.");
    return;
  }
  if (e.t === "jobs" && S.workers.length) {
    toast("Dismiss your staff before selling the Employment Office.");
    return;
  }
  const refund = e.t === "field" ? 5 : refundFor(e.t);
  const doSell = () => {
    const [sx, sy] = entScreen(e, 20);
    const wp = entWorld(e, 4);
    removeEnt(e);
    recalcPop();
    hidePopup();
    addCoins(refund, sx, sy);
    sfx("coin");
    burst(wp[0], wp[1], 14, ["#e8dcc4", "#c9b99a"], "dot", 60);
  };
  if (b.flat) {
    doSell();
    return;
  }
  dialog({
    title: `Sell ${b.name}?`,
    body: `<div class="dlg-big">${THUMBS[e.t] ? `<img src="${THUMBS[e.t]}">` : b.icon}</div>You'll get back <b>🪙 ${refund}</b>.${b.pop ? `<br><small>Population will drop by ${b.pop}.</small>` : ""}`,
    yes: `Sell for 🪙${refund}`,
    cls: "orange",
    onYes: doSell,
  });
}

function collectRent(e, quiet, mult) {
  if (!e || !rentReady(e)) return;
  const b = BUILD[e.t];
  e.rt = NOW;
  const amt = Math.max(1, Math.round(rentOf(e) * (mult || 1)));
  if (quiet) addCoins(amt);
  else {
    const [sx, sy] = entScreen(e, b.ht);
    addCoins(amt, sx, sy);
  }
  S.stats.rent++;
  addXP(1);
  if (!quiet) sfx("coin");
  const p = entWorld(e, b.ht);
  floatText(p[0], p[1], `+🪙${amt}`, "#ffd23f");
  burst(p[0], p[1], 8, ["#ffd23f", "#fff2a8"], "spark", 50);
  if (!quiet || (pop && pop.ent === e)) hidePopup();
}
function clearNature(e) {
  if (!e || e.dying) return;
  const b = BUILD[e.t];
  if (!spend(b.clear)) return;
  e.dying = NOW + 350;
  setOcc(e, -1);
  worldChanged();
  S.stats.cleared++;
  addXP(b.xp);
  sfx("chop");
  const drop = e.t === "tree" ? "planks" : e.t === "rock" ? "stone" : null;
  if (drop && spaceFor(drop) > 0) {
    const n = 1 + randi(2);
    addItem(drop, n);
    const dp = entWorld(e, 30);
    floatText(dp[0], dp[1] - 16, `+${n} ${ITEMS[drop].icon}`, "#ffffff", 12);
  }
  if (Math.random() < 0.04) gainArtifact(pickArtifact("farming"));
  const p = entWorld(e, 18);
  const cols =
    e.t === "rock"
      ? ["#9ba1a7", "#7d838a", "#c9ced2"]
      : ["#4b9a38", "#62b545", "#88cf5e", "#7a4f2c"];
  burst(p[0], p[1], 16, cols, e.t === "rock" ? "dot" : "leaf", 80);
  floatText(p[0], p[1] - 20, `+${b.xp}⭐`, "#c8ff9a", 13);
  hidePopup();
}

function jobDur(e, r) {
  let m =
    typeof managerOf === "function" && managerOf(e) && !S.strike ? 0.85 : 1;
  m *= 1 - 0.1 * (lvlOf(e) - 1);
  if (hasPerk("overtime")) m *= 0.9;
  if (boostOn("factory")) m *= 0.5;
  return Math.round(RECIPES[r].time * m);
}
function factoryTick(e) {
  while (e.job && NOW >= e.job.st + (e.job.d || RECIPES[e.job.r].time)) {
    if (e.out.length >= shelvesOf(e)) {
      e.job.st = NOW - (e.job.d || RECIPES[e.job.r].time);
      e.job.full = true;
      break;
    }
    e.job.full = false;
    const end = e.job.st + (e.job.d || RECIPES[e.job.r].time);
    e.out.push(e.job.r);
    e.job = e.queue.length
      ? { r: e.queue[0], st: end, d: jobDur(e, e.queue.shift()) }
      : null;
  }
  if (!e.job && e.queue.length) {
    const r = e.queue.shift();
    e.job = { r, st: NOW, d: jobDur(e, r) };
  }
}
function startRecipe(e, r, quiet) {
  const R = RECIPES[r];
  if (!e || S.level < R.level) return false;
  if ((e.job ? 1 : 0) + e.queue.length >= slotsOf(e)) {
    if (!quiet) {
      toastOnce(
        `Production queue is full (${slotsOf(e)} max) - upgrade to add slots.`,
        "warn",
      );
      sfx("error");
    }
    return false;
  }
  for (const k in R.in)
    if ((S.inv[k] || 0) < R.in[k]) {
      if (!quiet) {
        toastOnce(
          `Missing ingredients: need ${R.in[k]} ${ITEMS[k].icon} ${ITEMS[k].name}`,
          "warn",
        );
        sfx("error");
      }
      return false;
    }
  for (const k in R.in) takeItem(k, R.in[k]);
  if (!e.job) e.job = { r, st: NOW, d: jobDur(e, r) };
  else e.queue.push(r);
  if (!quiet) sfx("craft");
  return true;
}
function collectGoods(e, quiet) {
  if (!e || !e.out.length) return 0;
  let n = 0,
    lastIc = "📦";
  const [sx, sy] = entScreen(e, BUILD[e.t].ht);
  while (
    e.out.length &&
    spaceFor(RECIPES[e.out[0]].out || e.out[0]) >= (RECIPES[e.out[0]].qty || 1)
  ) {
    const r = e.out.shift(),
      q = RECIPES[r].qty || 1,
      item = RECIPES[r].out || r;
    if (GOODS[r] && GOODS[r].kind === "booster")
      S.powers[r] = (S.powers[r] || 0) + q;
    else addItem(item, q);
    S.stats.crafted += q;
    addXP(GOODS[r].xp);
    n += q;
    lastIc = GOODS[r].icon;
    if (!quiet) flyIcon(GOODS[r].icon, sx, sy, "#btn-inventory", q);
  }
  if (e.out.length && !quiet) {
    storageFullPrompt();
    shakeEl("#pill-barn");
  }
  if (n) {
    if (!quiet) sfx("coin");
    const p = entWorld(e, BUILD[e.t].ht);
    burst(p[0], p[1], 10, ["#ffd23f", "#fff"], "spark", 50);
    if (quiet) floatText(p[0], p[1] - 8, `+${n} ${lastIc}`, "#ffffff", 12);
  }
  return n;
}

function buySeeds(k, n) {
  const c = CROPS[k];
  if (S.level < c.level) return;
  n = Math.min(n, seedCap() - seedTotal());
  if (n <= 0) {
    toastOnce(
      `🌱 Seed bag is full (${seedCap()}). Build a Seed Shed for more room.`,
      "warn",
    );
    sfx("error");
    return;
  }
  if (!spend(c.seed * n)) return;
  S.seeds[k] = (S.seeds[k] || 0) + n;
  sfx("coin");
  toastOnce(`+${n} ${c.icon} ${c.name} seeds`, "good");
  if (mode.type === "plant") updatePlantBanner();
}
function upgradeBarn() {
  const c = barnUpgradeCost(S.barnLvl);
  if (!spend(c)) return;
  S.barnLvl++;
  S.barnCap += 25;
  addXP(5);
  sfx("build");
  toast(`🛖 Barn upgraded! Capacity is now <b>${S.barnCap}</b>`, "good");
}
function sellItem(k, n, el) {
  n = Math.min(n, S.inv[k] || 0);
  if (n <= 0) return;
  takeItem(k, n);
  const r = el
    ? el.getBoundingClientRect()
    : { left: VW / 2, top: VH / 2, width: 0, height: 0 };
  addCoins(priceOf(k) * n, r.left + r.width / 2, r.top + r.height / 2);
  sfx("coin");
}

function maxOrders() {
  return Math.min(6, 3 + Math.floor(POP / 25));
}
function ownedFactoryTypes() {
  const s = new Set();
  for (const e of world.ents.values())
    if (FACTORY_TYPES.includes(e.t)) s.add(e.t);
  return s;
}
function availableItems() {
  const list = [];
  for (const k in CROPS) if (S.level >= CROPS[k].level) list.push(k);
  for (const t of ANIMAL_TYPES) if (hasType(t)) list.push(BUILD[t].out);
  for (const f of ownedFactoryTypes())
    for (const r of BUILD[f].recipes)
      if (
        S.level >= RECIPES[r].level &&
        !GOODS[r].noOrder &&
        !RECIPES[r].out &&
        ITEMS[r] &&
        ITEMS[r].kind === "good"
      )
        list.push(r);
  return list;
}
function canFulfill(o) {
  for (const k in o.items) if ((S.inv[k] || 0) < o.items[k]) return false;
  return true;
}
function makeOrder(forced) {
  let items = {};
  if (forced) items = forced;
  else {
    const avail = availableItems();
    let n = 1;
    if (S.level >= 2 && Math.random() < 0.55) n++;
    if (S.level >= 4 && Math.random() < 0.35) n++;
    n = Math.min(n, avail.length);
    const pool = avail.slice();

    while (Object.keys(items).length < n && pool.length) {
      const k = pool.splice(randi(pool.length), 1)[0];
      const kind = ITEMS[k].kind;
      if (kind !== "crop" && Math.random() < 0.35 && pool.length >= n) continue;
      items[k] =
        kind === "good"
          ? 1 + randi(2)
          : kind === "animal"
            ? 1 + randi(3)
            : 2 + randi(3 + Math.floor(S.level / 2));
    }
  }
  let value = 0,
    xp = 0;
  for (const k in items) {
    value += priceOf(k) * items[k];
    xp += ITEMS[k].xp * items[k];
  }
  const coins = Math.round(
    value *
      (1.35 + Math.random() * 0.4) *
      (1 + POP / 300) *
      (hasPerk("tips") ? 1.15 : 1) *
      (boostOn("market") ? 1.25 : 1) *
      (1 + 0.05 * mayor("m_orders")),
  );
  return {
    id: S.orderSeq++,
    name: pick(NAMES),
    face: pick(FACES),
    bg: pick(AVATAR_BG),
    color: pick(SHIRTS),
    mood: pick(MOODS),
    items,
    coins,
    xp: Math.max(2, Math.round(xp * 1.3)),
  };
}
function updateOrders() {
  if (S.orders.length < maxOrders() && NOW >= S.nextOrder) {
    const o = makeOrder();
    S.orders.push(o);
    spawnCustomer(o, false);
    S.nextOrder =
      NOW +
      (6000 + Math.random() * 8000) *
        (hasPerk("fastcustomers") ? 0.7 : 1) *
        (boostOn("market") ? 0.33 : 1);
    sfx("ding");
    toastOnce(`${o.face} <b>${o.name}</b> arrived at the Market!`, "info");
  } else if (S.orders.length >= maxOrders())
    S.nextOrder = Math.max(S.nextOrder, NOW + 5000);
}
function deliverOrder(id, el, quiet) {
  const o = S.orders.find((o) => o.id === id);
  if (!o) return;
  if (!canFulfill(o)) {
    if (quiet) return;
    const miss = Object.entries(o.items)
      .filter(([k, n]) => (S.inv[k] || 0) < n)
      .map(([k, n]) => `${n - (S.inv[k] || 0)} ${ITEMS[k].icon}`)
      .join(", ");
    toastOnce(`Still need: ${miss}`, "warn");
    sfx("error");
    return;
  }
  for (const k in o.items) takeItem(k, o.items[k]);
  S.orders = S.orders.filter((x) => x.id !== id);
  if (quiet) addCoins(o.coins);
  else {
    const r = el
      ? el.getBoundingClientRect()
      : { left: VW / 2, top: VH / 2, width: 0, height: 0 };
    addCoins(o.coins, r.left + r.width / 2, r.top);
  }
  addXP(o.xp);
  S.stats.served++;
  if (!quiet) {
    sfx("coin");
    toast(
      `${o.face} ${o.name} paid <b>🪙${fmt(o.coins)}</b> and ⭐${o.xp}. Thank you!`,
      "good",
    );
  } else {
    const m = hasType("market");
    if (m) {
      const p = entWorld(m, 60);
      floatText(p[0], p[1], `+🪙${fmt(o.coins)}`, "#ffd23f", 14);
    }
  }
  customerLeave(o.id, true);
  S.nextOrder = Math.min(Math.max(S.nextOrder, NOW + 3000), NOW + 6000);
  renderPanel(true);
}
function skipOrder(id) {
  const o = S.orders.find((o) => o.id === id);
  if (!o) return;
  S.orders = S.orders.filter((x) => x.id !== id);
  customerLeave(o.id, false);
  S.nextOrder = NOW + 7000;
  sfx("close");
  renderPanel(true);
}

function achValue(a) {
  return a.stat === "level"
    ? S.level
    : a.stat === "pop"
      ? POP
      : S.stats[a.stat] || 0;
}
function checkAch() {
  for (const a of ACHIEVEMENTS) {
    if (!S.ach[a.id] && achValue(a) >= a.goal) {
      S.ach[a.id] = 1;
      toast(
        `🏆 Achievement unlocked: <b>${a.name}</b> - claim it in Goals!`,
        "ach",
      );
      sfx("ach");
    }
  }
}
function claimAch(id, el) {
  const a = ACHIEVEMENTS.find((a) => a.id === id);
  if (!a || S.ach[id] !== 1) return;
  S.ach[id] = 2;
  const r = el.getBoundingClientRect();
  addCoins(a.reward, r.left + r.width / 2, r.top);
  addGems(1 + Math.floor(a.reward / 250));
  sfx("coin");
  renderPanel(true);
}
function claimAllAch(el) {
  const ready = ACHIEVEMENTS.filter((a) => S.ach[a.id] === 1);
  if (!ready.length) return;
  let coins = 0,
    gems = 0;
  for (const a of ready) {
    S.ach[a.id] = 2;
    coins += a.reward;
    gems += 1 + Math.floor(a.reward / 250);
  }
  const r = el
    ? el.getBoundingClientRect()
    : { left: VW / 2, top: VH / 2, width: 0 };
  addCoins(coins, r.left + r.width / 2, r.top);
  S.gems += gems;
  bump("#pill-gems");
  sfx("ach");
  toast(
    `🏆 Claimed ${ready.length} achievement${ready.length > 1 ? "s" : ""}: +🪙${fmt(coins)} 💎${gems}`,
    "good",
  );
  renderPanel(true);
}
function checkTutorial() {
  const q = TUTORIAL[S.tut];
  if (q && q.check()) {
    S.coins += q.reward;
    S.stats.earned += q.reward;
    toast(`✅ Quest complete: <b>${q.title}</b> · +🪙${q.reward}`, "good");
    bump("#pill-coins");
    sfx("ach");
    S.tut++;
  }
  renderQuest();
}

function popEnt() {
  return pop && pop.ent;
}
function seedPicker(f) {
  showPopup(f, {
    z: 14,
    sig: () => JSON.stringify(S.seeds) + S.level + (f.crop || ""),
    render: () => {
      const keys = Object.keys(CROPS).sort(
        (a, b) => CROPS[a].level - CROPS[b].level,
      );
      const unlocked = keys.filter((k) => S.level >= CROPS[k].level),
        nextLocked = keys.find((k) => S.level < CROPS[k].level);
      const moreLocked =
        keys.filter((k) => S.level < CROPS[k].level).length -
        (nextLocked ? 1 : 0);
      const list = unlocked
        .concat(nextLocked ? [nextLocked] : [])
        .map((k) => {
          const c = CROPS[k],
            lock = S.level < c.level,
            n = S.seeds[k] || 0;
          return `<button class="seed-btn ${lock ? "locked" : ""} ${!lock && n <= 0 ? "empty" : ""} ${c.seasons && c.seasons.includes(seasonIdx()) ? "inseason" : ""}" data-act="p-plant" data-id="${k}" ${lock ? "disabled" : ""} title="${c.name}${c.seasons ? (c.seasons.includes(seasonIdx()) ? " - in season! +30%" : " - out of season −25%") : ""}">
          <span class="sb-ic">${lock ? "🔒" : c.icon}</span><span class="sb-n">${lock ? "Lv " + c.level : "×" + n}</span><span class="sb-t">${lock ? "" : fmtTime(c.time)}</span></button>`;
        })
        .join("");
      return `<div class="pp-title">🌱 Plant a crop</div><div class="pp-sub">Pick a seed, then drag across empty fields.</div>
        <div class="seed-grid">${list}</div>${moreLocked > 0 ? `<div class="pp-sub mt">🔒 ${moreLocked} more crops unlock as you level up</div>` : ""}
        <div class="pp-btns mt"><button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Remove</button></div>`;
    },
  });
}
function fieldInfo(f) {
  const c = CROPS[f.crop];
  showPopup(f, {
    z: 24,
    sig: () => (f.crop || "") + fieldReady(f),
    render: () => {
      if (!f.crop)
        return `<div class="pp-title">Field</div><div class="pp-sub">Empty</div>`;
      if (fieldReady(f))
        return `<div class="pp-title">${c.icon} ${c.name}</div><div class="pp-sub">Ready to harvest!</div><div class="pp-btns"><button class="btn green small" data-act="p-harvest">🌾 Harvest</button></div>`;
      return `<div class="pp-title">${c.icon} ${c.name}</div><div class="pp-sub">Growing… ready in <b id="pp-time"></b></div><div class="pbar"><div id="pp-bar"></div></div>`;
    },
    live: () => {
      const t = document.getElementById("pp-time"),
        b = document.getElementById("pp-bar");
      if (t && f.crop)
        t.textContent = fmtTime(CROPS[f.crop].time - (NOW - f.pt));
      if (b) b.style.width = fieldProgress(f) * 100 + "%";
    },
  });
}
function housePopup(e) {
  const b = BUILD[e.t];
  showPopup(e, {
    sig: () => "" + rentReady(e) + lvlOf(e) + (S.coins >= upgradeCost(e)),
    render: () => `<div class="pp-title">${thumbMini(e.t)} ${b.name}</div>
      <div class="pp-sub">👥 ${popOf(e)} residents · pays 🪙${rentOf(e)} every ${fmtTime(b.rentTime)}${lvlOf(e) > 1 ? " · " + "★".repeat(lvlOf(e)) : ""}</div>
      ${rentReady(e) ? "" : `<div class="pp-row"><div class="pbar"><div id="pp-bar"></div></div><span class="pp-t" id="pp-time"></span></div>`}${upgradeHTML(e)}
      <div class="pp-btns">${rentReady(e) ? `<button class="btn green small" data-act="p-collect">Collect 🪙${rentOf(e)}</button>` : ""}<button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Sell</button></div>`,
    live: () => {
      const t = document.getElementById("pp-time"),
        bar = document.getElementById("pp-bar");
      const left = b.rentTime - (NOW - e.rt);
      if (t) t.textContent = fmtTime(Math.max(0, left));
      if (bar)
        bar.style.width = clamp((NOW - e.rt) / b.rentTime, 0, 1) * 100 + "%";
    },
  });
}
function thumbMini(t) {
  return THUMBS[t]
    ? `<img class="pp-thumb" src="${THUMBS[t]}">`
    : BUILD[t].icon;
}
function factoryPopup(e) {
  const b = BUILD[e.t];
  showPopup(e, {
    sig: () =>
      JSON.stringify([
        e.job && e.job.r,
        e.queue,
        e.out,
        S.inv,
        S.level,
        !!managerOf(e),
        lvlOf(e),
        S.coins >= upgradeCost(e),
      ]),
    render: () => {
      const slots = [];
      if (e.job) slots.push(GOODS[e.job.r].icon);
      for (const q of e.queue) slots.push(GOODS[q].icon);
      while (slots.length < slotsOf(e)) slots.push("");
      const recipes = b.recipes
        .map((r) => {
          const R = RECIPES[r],
            G = GOODS[r],
            lock = S.level < R.level;
          const ok =
            !lock &&
            Object.entries(R.in).every(([k, n]) => (S.inv[k] || 0) >= n);
          const ing = Object.entries(R.in)
            .map(
              ([k, n]) =>
                `<span class="ing ${(S.inv[k] || 0) >= n ? "ok" : ""}">${ITEMS[k].icon}${S.inv[k] || 0}/${n}</span>`,
            )
            .join("");
          return `<div class="recipe ${lock ? "locked" : ""}"><span class="r-ic">${G.icon}</span><div class="r-main"><div class="r-name">${G.name}${R.qty ? " ×" + R.qty : ""} <small>⏱${fmtTime(jobDur(e, r))} · 🪙${G.price}</small></div><div class="r-ing">${lock ? `🔒 Level ${R.level}` : ing}</div></div>
          ${lock ? "" : `<button class="btn small ${ok ? "green" : "disabled"}" data-act="p-make" data-id="${r}">Make</button>`}</div>`;
        })
        .join("");
      const mgr = managerOf(e);
      return `<div class="pp-title">${thumbMini(e.t)} ${b.name}</div>${mgr ? `<div class="pp-sub">👷 Managed by ${mgr.face} ${mgr.name} (+15% speed)</div>` : ""}
        <div class="job-row">${e.job ? `<span class="job-ic">${GOODS[e.job.r].icon}</span><div class="pbar"><div id="pp-bar"></div></div><span class="pp-t" id="pp-time"></span>` : '<span class="idle">💤 Idle - pick a recipe below</span>'}</div>
        <div class="pp-sub">🗄️ Shelves ${e.out.length}/${shelvesOf(e)}${e.job && e.job.full ? ' - <b style="color:#c2402f">full! Collect to keep producing</b>' : ""}</div>
        <div class="slots">${slots.map((s) => `<span class="slot">${s}</span>`).join("")}${e.out.length ? `<button class="btn orange small" data-act="p-collectgoods">Collect ${e.out.map((r) => GOODS[r].icon).join("")}</button>` : ""}</div>
        <div class="recipes">${recipes}</div>${upgradeHTML(e)}
        <div class="pp-btns mt"><button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Sell</button></div>`;
    },
    live: () => {
      if (!e.job) return;
      const d = e.job.d || RECIPES[e.job.r].time;
      const t = document.getElementById("pp-time"),
        bar = document.getElementById("pp-bar");
      if (t) t.textContent = fmtTime(Math.max(0, d - (NOW - e.job.st)));
      if (bar) bar.style.width = clamp((NOW - e.job.st) / d, 0, 1) * 100 + "%";
    },
  });
}
function naturePopup(e) {
  const b = BUILD[e.t];
  const name = e.t === "tree" ? TREE_NAMES[e.v || 0] : b.name;
  showPopup(e, {
    sig: () => "" + (S.coins >= b.clear),
    render:
      () => `<div class="pp-title">${b.icon} ${name}</div><div class="pp-sub">Clear it away to free up land · +${b.xp}⭐</div>
      <div class="pp-btns"><button class="btn ${S.coins >= b.clear ? "green" : "disabled"}" data-act="p-clear">${e.t === "rock" ? "⛏️ Break" : "🪓 Clear"} · 🪙${b.clear}</button><button class="btn blue small" data-act="clearmode">🪓 Clear an area…</button></div>`,
  });
}
function decorPopup(e) {
  const b = BUILD[e.t];
  showPopup(e, {
    sig: () => "" + lvlOf(e) + (S.coins >= upgradeCost(e)),
    render:
      () => `<div class="pp-title">${thumbMini(e.t)} ${b.name}${lvlOf(e) > 1 ? " " + "★".repeat(lvlOf(e)) : ""}</div><div class="pp-sub">${b.desc || ""}${b.cap ? `<br>🏘️ Raises the population cap by <b>${capOf(e)}</b>` : ""}${e.t === "silo" ? `<br>📦 Holds ${BUILD.silo.siloCap * (hasPerk("bigsilo") ? 1.5 : 1)} crops` : ""}</div>${upgradeHTML(e)}
      <div class="pp-btns">${b.flat ? `<button class="btn green small" data-act="p-road" data-id="${e.t}">➕ Build more</button>` : '<button class="btn blue small" data-act="p-move">✋ Move</button>'}${storeable(e) ? '<button class="btn orange small" data-act="p-store">📦 Store</button>' : ""}${b.special ? "" : `<button class="btn red small" data-act="p-sell">${b.flat ? "Remove" : "Sell"}</button>`}</div>`,
  });
}
function townhallPopup(e) {
  const counts = { houses: 0, fields: 0, prod: 0 };
  void counts;
  for (const x of world.ents.values()) {
    if (HOUSE_TYPES.includes(x.t)) counts.houses++;
    if (x.t === "field") counts.fields++;
    if (FACTORY_TYPES.includes(x.t)) counts.prod++;
  }
  showPopup(e, {
    render:
      () => `<div class="pp-title">${thumbMini("townhall")} Meadowvale Town Hall</div>
      <div class="stat-grid"><div>👥 <b>${POP}/${POPCAP}</b><small>Population</small></div><div>🏠 <b>${counts.houses}</b><small>Homes</small></div><div>🟫 <b>${counts.fields}</b><small>Fields</small></div>
      <div>🏭 <b>${counts.prod}</b><small>Production</small></div><div>🗺️ <b>${S.stats.expansions}</b><small>Expansions</small></div><div>🛒 <b>${S.stats.served}</b><small>Served</small></div></div>
      <div class="pp-btns mt"><button class="btn orange small" data-act="p-open" data-id="achievements">🏆 Goals</button><button class="btn blue small" data-act="p-move">✋ Move</button></div>`,
  });
}

function onEntityClick(e, sx, sy) {
  if (e.build) {
    constructionPopup(e);
    return;
  }
  if (e.fire && e.fire > NOW) {
    if (spend(50)) {
      e.fire = 0;
      sfx("chop");
      toast("🧯 Fire put out!", "good");
    }
    return;
  }
  if (BUILD[e.t].produce) {
    producerCollect(e);
    return;
  }
  if (BUILD[e.t].orchard) {
    if (e.hl <= 0) orchardPopup(e);
    else orchardHarvest(e);
    return;
  }
  switch (e.t) {
    case "trainstation":
    case "freightdepot":
    case "signal":
      openPanel("transport", "rail");
      return;
    case "shipyard":
    case "berth":
      openPanel("transport", "sea");
      return;
    case "terminal":
      openPanel("transport", "air");
      return;
    case "exchange":
      openPanel("transport", "exchange");
      return;
    case "helipad":
      openPanel("orders", "express");
      return;
    case "seaport":
    case "lighthouse":
      openPanel("transport", "sea");
      return;
    case "airport":
    case "controltower":
      openPanel("transport", "air");
      return;
    case "mine":
      openPanel("mine");
      return;
    case "institute":
      openPanel("institute");
      return;
    case "museum":
      openPanel("collections");
      return;
    case "field":
      if (fieldReady(e)) harvestField(e, sx, sy);
      else if (!e.crop) {
        if (mode.type === "plant") plantField(e, mode.crop);
        else seedPicker(e);
      } else fieldInfo(e);
      return;
    case "tree":
    case "rock":
    case "bush":
      naturePopup(e);
      return;
    case "barn":
      openPanel("inventory");
      return;
    case "market":
      openPanel("orders");
      return;
    case "townhall":
      townhallPopup(e);
      return;
    case "courier":
      openPanel("orders", "courier");
      return;
    case "jobs":
      openPanel("staff");
      return;
    case "silo":
      decorPopup(e);
      return;
    case "bridge":
      decorPopup(e);
      return;
  }
  if (BUILD[e.t].animal) {
    animalClick(e);
    return;
  }
  if (BUILD[e.t].rent) {
    if (rentReady(e)) collectRent(e);
    else housePopup(e);
    return;
  }
  if (FACTORY_TYPES.includes(e.t)) {
    if (e.out.length) collectGoods(e);
    else factoryPopup(e);
    return;
  }
  decorPopup(e);
}

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0],
      yi = pts[i][1],
      xj = pts[j][0],
      yj = pts[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function pickEntity(sx, sy) {
  const [wx, wy] = screenToWorld(sx, sy);
  const vr = visibleRange();
  const cands = [];
  for (const e of world.ents.values()) {
    if (e.moving || e.dying) continue;
    const ht = BUILD[e.t].ht || 0;
    if (ht < 18) continue;
    if (e.x > vr.x1 || e.y > vr.y1 || e.x + e.w < vr.x0 || e.y + e.h < vr.y0)
      continue;
    const ins = e.w === 1 ? 0.18 : 0.05;
    const x = e.x + ins,
      y = e.y + ins,
      w = e.w - ins * 2,
      h = e.h - ins * 2;
    const hex = [
      P(x, y + h),
      P(x + w, y + h),
      P(x + w, y),
      P(x + w, y, ht),
      P(x, y, ht),
      P(x, y + h, ht),
    ];
    if (pointInPoly(wx, wy, hex)) cands.push(e);
  }
  if (cands.length) {
    cands.sort((a, b) => depthOf(b) - depthOf(a));
    return cands[0];
  }
  const [tx, ty] = screenToTile(sx, sy);
  return entAt(tx, ty);
}

function handleClick(sx, sy) {
  const [tx, ty] = screenToTile(sx, sy);
  if (mode.type === "place") {
    tryPlace();
    return;
  }
  if (mode.type === "group") {
    placeGroup();
    return;
  }
  if (mode.type === "edit") {
    editToggle(pickEntity(sx, sy));
    return;
  }
  const hit = pickEntity(sx, sy);
  hidePopup();
  if (!hit) {
    if (mode.type === "plant") cancelMode();
    return;
  }
  if (mode.type === "plant" && !(hit.t === "field")) cancelMode(true);
  onEntityClick(hit, sx, sy);
}

const ptr = {
  down: false,
  sx: 0,
  sy: 0,
  lx: 0,
  ly: 0,
  mode: null,
  btn: 0,
  last: "",
  vx: 0,
  vy: 0,
  t: 0,
};
const keys = {};
let lastMouse = [0, 0];

function dragPlaceAt(sx, sy) {
  if (mode.type !== "place") return;
  const t = screenToTile(sx, sy),
    key = t[0] + "," + t[1];
  if (key === ptr.last) return;
  ptr.last = key;
  hoverTile = t;
  const [W, H] = placeDims(),
    g = ghostPos();
  if (g && placeOK(mode.t, g[0], g[1], -1, W, H)) tryPlace();
}
function sweepAt(sx, sy) {
  const [tx, ty] = screenToTile(sx, sy);
  const key = tx + "," + ty;
  if (key === ptr.last) return;
  ptr.last = key;
  const f = entAt(tx, ty);
  if (ptr.mode === "paint") {
    paintTile(mode.t, tx, ty);
    return;
  }
  if (!f || f.t !== "field" || !isUnlocked(tx, ty)) return;
  if (ptr.mode === "harvest" && fieldReady(f)) harvestField(f, sx, sy);
  else if (ptr.mode === "plant" && !f.crop && mode.type === "plant")
    plantField(f, mode.crop);
}

function initInput() {
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", (e) => {
    Sfx.init();
    canvas.setPointerCapture(e.pointerId);
    ptr.down = true;
    ptr.sx = ptr.lx = e.clientX;
    ptr.sy = ptr.ly = e.clientY;
    ptr.btn = e.button;
    ptr.last = "";
    cam.tx = null;
    cam.vx = cam.vy = 0;
    ptr.vx = ptr.vy = 0;
    ptr.t = performance.now();
    if (e.button !== 0) {
      ptr.mode = "rpan";
      return;
    }
    ptr.mode = "pending";
    if (mode.type === "place") {
      if (BUILD[mode.t].multi && !mode.ent) {
        ptr.mode = "placedrag";
        ptr.last = "";
        hoverTile = screenToTile(e.clientX, e.clientY);
        dragPlaceAt(e.clientX, e.clientY);
      }
      return;
    }
    if (mode.type === "paint") {
      ptr.mode = "paint";
      sweepAt(e.clientX, e.clientY);
      return;
    }
    if (mode.type === "clear") {
      ptr.mode = "clearsel";
      mode.a = mode.b = screenToTile(e.clientX, e.clientY);
      updateClearBanner();
      return;
    }
    const [tx, ty] = screenToTile(e.clientX, e.clientY);
    const f = entAt(tx, ty);
    if (f && f.t === "field" && isUnlocked(tx, ty)) {
      if (fieldReady(f)) {
        hidePopup();
        ptr.mode = "harvest";
        sweepAt(e.clientX, e.clientY);
      } else if (!f.crop && mode.type === "plant") {
        hidePopup();
        ptr.mode = "plant";
        sweepAt(e.clientX, e.clientY);
      }
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    lastMouse = [e.clientX, e.clientY];
    hoverTile = screenToTile(e.clientX, e.clientY);
    const ci = $("#cursor-icon");
    if (!ci.classList.contains("hidden")) {
      ci.style.left = e.clientX + "px";
      ci.style.top = e.clientY + "px";
    }
    if (!ptr.down) return;
    const dx = e.clientX - ptr.lx,
      dy = e.clientY - ptr.ly;
    if (
      ptr.mode === "pending" &&
      Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6
    ) {
      ptr.mode = "pan";
      canvas.classList.add("panning");
    }
    if (
      ptr.mode === "rpan" &&
      Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 4
    ) {
      ptr.moved = true;
      canvas.classList.add("panning");
    }
    if (ptr.mode === "placedrag") {
      const steps = Math.ceil(Math.hypot(dx, dy) / 8);
      for (let i = 1; i <= steps; i++)
        dragPlaceAt(ptr.lx + (dx * i) / steps, ptr.ly + (dy * i) / steps);
    }
    if (ptr.mode === "clearsel") {
      const t2 = screenToTile(e.clientX, e.clientY);
      if (t2[0] !== mode.b[0] || t2[1] !== mode.b[1]) {
        mode.b = t2;
        updateClearBanner();
      }
    }
    if (ptr.mode === "pan" || (ptr.mode === "rpan" && ptr.moved)) {
      cam.x -= dx / cam.z;
      cam.y -= dy / cam.z;
      const now = performance.now(),
        dts = Math.max(1, now - (ptr.t || now)) / 1000;
      ptr.t = now;
      const a = Math.min(1, dts * 18);
      ptr.vx += (-dx / cam.z / dts - ptr.vx) * a;
      ptr.vy += (-dy / cam.z / dts - ptr.vy) * a;
    }
    if (
      ptr.mode === "harvest" ||
      ptr.mode === "plant" ||
      ptr.mode === "paint"
    ) {
      const steps = Math.ceil(Math.hypot(dx, dy) / 8);
      for (let i = 1; i <= steps; i++)
        sweepAt(ptr.lx + (dx * i) / steps, ptr.ly + (dy * i) / steps);
    }
    ptr.lx = e.clientX;
    ptr.ly = e.clientY;
  });
  const up = (e) => {
    if (!ptr.down) return;
    if (ptr.mode === "pending") handleClick(e.clientX, e.clientY);
    else if (ptr.mode === "clearsel") finishClearSelect();
    else if (ptr.mode === "rpan" && !ptr.moved) {
      if (mode.type) cancelMode();
      else hidePopup();
    }
    if (
      (ptr.mode === "pan" || ptr.mode === "rpan") &&
      performance.now() - (ptr.t || 0) < 90
    ) {
      const sp = Math.hypot(ptr.vx, ptr.vy),
        max = 2600 / cam.z,
        k = sp > max ? max / sp : 1;
      if (sp * cam.z > 120) {
        cam.vx = ptr.vx * k;
        cam.vy = ptr.vy * k;
      }
    }
    ptr.down = false;
    ptr.mode = null;
    ptr.moved = false;
    canvas.classList.remove("panning");
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", () => {
    if (!ptr.down) hoverTile = null;
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      zoomAt(
        e.clientX,
        e.clientY,
        Math.exp(-clamp(dy, -120, 120) * (e.ctrlKey ? 0.012 : 0.0022)),
      );
    },
    { passive: false },
  );

  window.addEventListener("keydown", (e) => {
    if (
      e.target &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
    )
      return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (
      (k === "p" || k === " ") &&
      !dialogOpen() &&
      !$("#levelup-root").innerHTML
    ) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (clock.paused && k === "escape" && !panel && !dialogOpen()) {
      setPaused(false);
      return;
    }
    if (k === "escape") {
      if ($("#levelup-root").innerHTML) closeLevelUp();
      else if (dialogOpen()) closeDialog();
      else if (panel) closePanel();
      else if (pop) hidePopup();
      else if (mode.type) cancelMode();
    }
    if (panel || dialogOpen()) return;
    if (k === "b") openPanel("store");
    if (k === "i") openPanel("inventory");
    if (k === "o") openPanel("orders");
    if (k === "g") openPanel("achievements");
    if (k === "j") openPanel("staff");
    if (k === "t") openPanel("transport");
    if (k === "c") openPanel("city");
    if (k === "e") openPanel("events");
    if (k === "n") openPanel("census");
    if (k === "m") openPanel("worldmap");
    if (k === "v") ACT.edit();
    if (k === "r" && mode.type === "place") {
      rotatePlacement();
      return;
    }
    if (k === "r" && mode.type === "edit") {
      flipSelected();
      return;
    }
    if (k === "x") ACT.clearmode();
    if (k === "f") cycleSpeed();
    if (k === "h") goHome();
    if (k === "=" || k === "+") zoomAt(VW / 2, VH / 2, 1.2);
    if (k === "-" || k === "_") zoomAt(VW / 2, VH / 2, 1 / 1.2);
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
  });

  const mmEl = document.getElementById("minimap");
  mmEl.addEventListener("pointerdown", (e) => {
    const r = mmEl.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * mmEl.width,
      py = ((e.clientY - r.top) / r.height) * mmEl.height;
    const [tx, ty] = mmToTile(px, py);
    const w = P(tx, ty);
    cam.tx = w[0];
    cam.ty = w[1];
    sfx("click");
  });

  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    Sfx.init();
    if (el.disabled) return;
    const f = ACT[el.dataset.act];
    if (f) f(el.dataset, el, ev);
  });
}
const ZMIN = 0.18,
  ZMAX = 2.6;

function zoomAt(mx, my, f, instant) {
  if (cam.zt == null || cam._z !== cam.z) cam.zt = cam.z;
  cam.zt = clamp(cam.zt * f, ZMIN, ZMAX);
  cam.zax = mx;
  cam.zay = my;
  if (instant) setZoom(cam.zt, mx, my);
}
function setZoom(z, mx, my) {
  const [wx, wy] = screenToWorld(mx, my);
  cam.z = cam._z = z;
  cam.x = wx - (mx - VW / 2) / cam.z;
  cam.y = wy - (my - VH / 2) / cam.z;
}
function goHome() {
  const th = hasType("townhall"),
    p = th ? P(th.x + 1, th.y + 3) : P(S.spawn.x, S.spawn.y + 2);
  cam.tx = p[0];
  cam.ty = p[1];
  sfx("click");
}
function updateCamera(dt) {
  if (cam._z !== cam.z) {
    cam.zt = cam.z;
    cam._z = cam.z;
  }

  if (cam.zt != null && Math.abs(cam.zt - cam.z) > 1e-4) {
    const k = 1 - Math.exp(-dt * 14);
    let z = cam.z * Math.pow(cam.zt / cam.z, k);
    if (Math.abs(cam.zt - z) < 1e-3) z = cam.zt;
    setZoom(
      z,
      cam.zax == null ? VW / 2 : cam.zax,
      cam.zay == null ? VH / 2 : cam.zay,
    );
  }

  let kx = 0,
    ky = 0;
  if (!panel && !dialogOpen()) {
    if (keys["a"] || keys["arrowleft"]) kx -= 1;
    if (keys["d"] || keys["arrowright"]) kx += 1;
    if (keys["w"] || keys["arrowup"]) ky -= 1;
    if (keys["s"] || keys["arrowdown"]) ky += 1;
  }
  const fast = keys["shift"] ? 1.8 : 1,
    n = Math.hypot(kx, ky) || 1;
  const tvx = ((kx / n) * 820 * fast) / cam.z,
    tvy = ((ky / n) * 820 * fast) / cam.z;
  const ka = 1 - Math.exp(-dt * (kx || ky ? 9 : 7));
  cam.kvx = (cam.kvx || 0) + (tvx - (cam.kvx || 0)) * ka;
  cam.kvy = (cam.kvy || 0) + (tvy - (cam.kvy || 0)) * ka;
  if (Math.abs(cam.kvx) + Math.abs(cam.kvy) > 0.5) {
    cam.x += cam.kvx * dt;
    cam.y += cam.kvy * dt;
    if (kx || ky) cam.tx = null;
  } else cam.kvx = cam.kvy = 0;

  if (!ptr.down && (cam.vx || cam.vy)) {
    cam.x += cam.vx * dt;
    cam.y += cam.vy * dt;
    const d = Math.exp(-dt * 4.2);
    cam.vx *= d;
    cam.vy *= d;
    if (Math.hypot(cam.vx, cam.vy) * cam.z < 8) cam.vx = cam.vy = 0;
  }

  if (cam.tx != null) {
    const k = 1 - Math.exp(-dt * 6);
    cam.x += (cam.tx - cam.x) * k;
    cam.y += (cam.ty - cam.y) * k;
    if (Math.hypot(cam.tx - cam.x, cam.ty - cam.y) < 0.5) cam.tx = null;
  }
}

const ACT = {
  open: (d) => {
    if (panel && panel.name === d.id) closePanel();
    else openPanel(d.id);
  },
  close: () => closePanel(),
  backdrop: (d, el, ev) => {
    if (ev.target === el) closePanel();
  },
  tab: (d) => {
    panel.tab = d.tab;
    renderPanel(true);
    sfx("click");
  },
  home: () => goHome(),
  cancel: () => cancelMode(),
  buy: (d) => startPlace(d.id),
  buyseed: (d) => buySeeds(d.id, +d.n),
  barnup: () => upgradeBarn(),
  sell: (d, el) => sellItem(d.id, 1, el),
  sellall: (d, el) => sellItem(d.id, S.inv[d.id] || 0, el),
  plantmode: (d) => {
    closePanel(true);
    setPlantMode(d.id);
  },
  swapseed: (d) => setPlantMode(d.id),
  storeseeds: () => openPanel("store", "seeds"),
  deliver: (d, el) => deliverOrder(+d.id, el),
  skip: (d) => skipOrder(+d.id),
  claim: (d, el) => claimAch(d.id, el),
  "claim-all": (d, el) => claimAllAch(el),
  "toggle-sound": () => {
    S.sound = !S.sound;
    Sfx.on = S.sound;
    if (S.sound) sfx("click");
    renderPanel(true);
  },
  "toggle-day": () => {
    S.daynight = !S.daynight;
    sfx("click");
    renderPanel(true);
  },
  "save-now": () => {
    save();
    toast("💾 Game saved!", "good");
  },
  reset: () => newWorldDialog(randomSeedText()),
  "new-world": () => {
    const el = document.getElementById("seed-in");
    newWorldDialog(el && el.value.trim() ? el.value.trim() : randomSeedText());
  },
  "seed-random": () => {
    const el = document.getElementById("seed-in");
    if (el) el.value = randomSeedText();
    sfx("click");
  },
  "seed-copy": () => {
    (navigator.clipboard
      ? navigator.clipboard.writeText(S.seedText)
      : Promise.reject()
    ).then(
      () => toast("🌍 Seed copied!", "good"),
      () => toast("Seed: " + S.seedText),
    );
  },
  "dlg-yes": () => {
    const cb = dlgCb;
    closeDialog();
    if (cb) cb();
  },
  "dlg-no": () => {
    const f = dlgNo;
    dlgNo = null;
    closeDialog();
    sfx("close");
    if (f) f();
  },
  "lvl-ok": () => {
    closeLevelUp();
    sfx("click");
  },
  "quest-toggle": () => {
    S.questMin = !S.questMin;
    renderQuest();
  },
  "p-plant": (d) => {
    const f = popEnt();
    const k = d.id;
    if (!(S.seeds[k] > 0)) {
      hidePopup();
      toastOnce(`No ${CROPS[k].name} seeds left!`, "warn");
      openPanel("store", "seeds");
      return;
    }
    hidePopup();
    setPlantMode(k);
    if (f && f.t === "field") plantField(f, k);
  },
  "p-harvest": () => {
    const f = popEnt();
    hidePopup();
    if (f) harvestField(f);
  },
  "p-move": () => startMove(popEnt()),
  "p-sell": () => sellEntity(popEnt()),
  "p-collect": () => collectRent(popEnt()),
  "p-clear": () => clearNature(popEnt()),
  "p-make": (d) => startRecipe(popEnt(), d.id),
  "p-collectgoods": () => collectGoods(popEnt()),
  "p-open": (d) => {
    hidePopup();
    openPanel(d.id);
  },
  "p-road": (d) => startPlace(d.id || "road"),
  "p-upgrade": () => upgradeBuilding(popEnt()),
  buymat: (d) => buyMaterial(d.id, +d.n),
  "p-buymats": () => {
    const e = popEnt();
    if (e && e.build) buyMissingMats(e);
  },
  "p-mats": () => {
    const e = popEnt();
    if (e && e.build) deliverMats(e);
  },
  "p-gemfinish": () => {
    const e = popEnt();
    if (e && e.build && spendGems(gemCost((1 - e.build.prog) * e.build.dur))) {
      e.build.prog = 1;
      sfx("level");
    }
  },
  "p-cancelbuild": () => {
    const e = popEnt();
    if (!e || !e.build) return;
    dialog({
      title: "Cancel construction?",
      body: "You get back 50% of the coins and any delivered materials.",
      yes: "Cancel build",
      cls: "red",
      onYes: () => {
        for (const k in e.build.have) addItem(k, e.build.have[k]);
        addCoins(Math.floor(buildCost(e.t) * 0.5));
        removeEnt(e);
        hidePopup();
        recalcPop();
      },
    });
  },
  "p-orchard": () => {
    const e = popEnt();
    hidePopup();
    if (e) orchardHarvest(e);
  },
  "p-prune": () => orchardPrune(popEnt()),
  "p-store": () => {
    const e = popEnt();
    if (e && storeable(e)) {
      S.decorBag[e.t] = (S.decorBag[e.t] || 0) + 1;
      removeEnt(e);
      hidePopup();
      toast("📦 Stored - place it again from Store → Decor.", "good");
    }
  },
  rotate: () => rotatePlacement(),
  clearmode: () => {
    if (mode.type === "clear") cancelMode();
    else enterClearMode();
  },
  edit: () => {
    if (mode.type === "edit") cancelMode();
    else enterEdit();
  },
  "ed-move": () => startGroup(false),
  "ed-copy": () => startGroup(true),
  "ed-store": () => storeSelected(),
  "ed-flip": () => flipSelected(),
  "ed-sell": () => sellSelected(),
  "mayor-buy": (d) => buyMayor(d.b, +d.i),
  "mayor-respec": () => respecMayor(),
  "req-go": (d) => advanceRequest(d.id),
  "album-claim": (d) => {
    const i = +d.i,
      g = ALBUM_GOALS[i];
    if (S.albumClaim[i] || Object.keys(S.album).length < g.n) return;
    S.albumClaim[i] = true;
    addGems(g.gems, "Worker album milestone");
    renderPanel(true);
  },
  "train-up": () => upgradeTrain(),
  "rail-pass": (d) => railPassenger(+d.i),
  "ship-refit": (d) => refitShip(+d.i, d.t),
  "ferry-run": (d) => ferryRun(+d.i),
  "air-pass": (d) => passengerFlight(+d.i),
  "exp-deliver": (d) => deliverExpress(+d.id),
  "xch-sell": (d) => exchangeSell(d.id, !!d.all),
  "coop-claim": (d) => claimCoopTask(+d.i),
  "toggle-realism": () => {
    S.realism = !S.realism;
    sfx("click");
    renderPanel(true);
    toast(
      S.realism
        ? "🧊 Realism Mode on: food spoils without Cold Storage, vehicles need fuel."
        : "Realism Mode off.",
      "info",
    );
  },
  "save-export": () => exportSave(),
  "save-import": () => importSaveFile(),
  "save-code": () => copyTransferCode(),
  "save-paste": () => pasteTransferCode(),
  "p-produce": () => {
    const e = popEnt();
    if (e) {
      producerCollect(e);
      hidePopup();
    }
  },
  "rail-collect": (d) => railCollect(+d.i, +d.c),
  "rail-fill": (d) => railFill(+d.i, +d.c),
  "rail-send": (d) => railSend(+d.i, d.d),
  "rail-gem": (d) => {
    const t = S.rail.trains[+d.i];
    if (t && t.st === "away" && spendGems(gemCost(t.ret - NOW))) {
      t.ret = NOW;
      renderPanel(true);
    }
  },
  "sea-unload": (d) => seaUnload(+d.i),
  "sea-send": (d) => seaSend(+d.i, d.d, !!d.g),
  "sea-gem": (d) => {
    const s2 = S.sea.ships[+d.i];
    if (s2 && s2.st === "sailing" && spendGems(gemCost(s2.ret - NOW))) {
      s2.ret = NOW;
      renderPanel(true);
    }
  },
  "air-fill": (d) => airFill(+d.i, +d.c),
  "air-help": (d) => airHelp(+d.i, +d.c),
  "air-send": (d) => airSend(+d.i),
  "air-gem": (d) => {
    const p2 = S.air.planes[+d.i];
    if (p2 && p2.st === "away" && spendGems(gemCost(p2.ret - NOW))) {
      p2.ret = NOW;
      renderPanel(true);
    }
  },
  "mine-dig": (d) => mineDig(+d.i, mineTool),
  "mine-tool": (d) => {
    mineTool = d.t;
    renderPanel(true);
  },
  "mine-down": () => mineDescend(),
  "eng-up": (d) => engUpgrade(d.id),
  "col-claim": (d) => claimCollection(d.id),
  "col-swap": () => swapDuplicates(),
  "daily-claim": (d) => claimDaily(+d.i),
  "wheel-spin": () => spinWheel(),
  "ev-buy": (d) => buyEventDecor(d.id),
  "mer-buy": (d) => merchantBuy(+d.i, !!d.g),
  "ct-deliver": (d) => deliverContract(+d.id),
  "use-power": (d) => usePower(d.id),
  "gem-power": (d) => buyPowerWithGems(d.id),
  overlay: (d) => {
    overlay = d.id || null;
    renderPanel(true);
    if (overlay) closePanel(true);
  },
  bell: () => {
    S.unread = 0;
    openPanel("city", "log");
  },
  "w-train": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (!w || w.skill >= 5) return;
    if (!hasType("school")) {
      toast("Build a School to train staff.");
      return;
    }
    if (!spend(100 * w.skill)) return;
    gainSkill(
      w,
      Math.ceil((SKILL_XP[w.skill] - w.sxp) * 0.6) /
        (w.trait === "diligent" ? 2 : 1),
    );
    sfx("ach");
    renderPanel(true);
  },
  buyperk: (d) => buyPerk(d.id),
  buybooster: (d) => buyBooster(d.id),
  "w-reserve": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg.reserve = clamp((w.cfg.reserve || 0) + +d.d, 0, 20);
      renderPanel(false);
      sfx("click");
    }
  },
  "p-feed": () => {
    const e = popEnt();
    if (e) feedAnimals(e);
  },
  "p-collectanimals": () => {
    const e = popEnt();
    if (e) collectAnimals(e);
  },
  "p-gofeed": () => {
    const m = hasType("feedmill");
    hidePopup();
    if (!m) {
      toast(
        S.level >= BUILD.feedmill.level
          ? "🏭 Build a Feed Mill (Store → Production) to make feed."
          : `🏭 The Feed Mill unlocks at level ${BUILD.feedmill.level}.`,
      );
      return;
    }
    const c = P(m.x + 1, m.y + 1);
    cam.tx = c[0];
    cam.ty = c[1];
    setTimeout(() => factoryPopup(m), 350);
  },
  pause: () => togglePause(),
  resume: () => setPaused(false),
  speed: () => cycleSpeed(),
  "c-deliver": (d, el) => deliverCourier(+d.i, el),
  "c-skip": (d) => skipCourier(+d.i),
  "w-hire": (d) => hireWorker(d.id),
  "job-open": (d) => changeOpenings(d.role, +d.d),
  "store-culture": (d) => {
    S.storeCulture = d.c;
    sfx("click");
    renderPanel(false);
  },
  "job-cat": (d) => {
    S.jobCat = d.c;
    sfx("click");
    renderPanel(false);
  },
  "w-cfg": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg[d.k] = !w.cfg[d.k];
      sfx("click");
      renderPanel(false);
    }
  },
  "w-cfgn": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg[d.k] = clamp((w.cfg[d.k] || 0) + +d.d, 0, 500);
      sfx("click");
      renderPanel(false);
    }
  },
  "w-dest": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg.dest = d.d;
      sfx("click");
      renderPanel(false);
    }
  },
  "w-select": (d) => {
    S.selW = +d.id;
    sfx("click");
    renderPanel(false);
  },
  "grp-toggle": (d) => {
    S.staffCollapsed = S.staffCollapsed || {};
    S.staffCollapsed[d.role] = !S.staffCollapsed[d.role];
    renderPanel(false);
  },
  "w-refresh": () => {
    if (spend(20)) {
      refreshCandidates();
      renderPanel(true);
      sfx("click");
    }
  },
  "w-fire": (d) => fireWorker(+d.id),
  "w-crop": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg.crop = d.crop;
      renderPanel(true);
      sfx("click");
    }
  },
  "w-fields": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      setFieldCount(w, +d.d);
      sfx("click");
    }
  },
  "w-auto": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg.auto = !w.cfg.auto;
      renderPanel(true);
      sfx("click");
    }
  },
  "w-fac": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (!w) return;
    const other = managerOf(world.ents.get(+d.fid));
    if (other && other !== w) {
      other.cfg.fid = w.cfg.fid;
    }
    setManagerFactory(w, +d.fid);
    renderPanel(true);
    sfx("click");
  },
  "w-target": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      w.cfg.targets[d.r] = clamp((w.cfg.targets[d.r] || 0) + +d.d, 0, 40);
      renderPanel(true);
      sfx("click");
    }
  },
  "w-locate": (d) => {
    const w = S.workers.find((x) => x.id === +d.id);
    if (w) {
      closePanel(true);
      const p = P(w.x + 0.5, w.y + 0.5);
      cam.tx = p[0];
      cam.ty = p[1];
      cam.z = Math.max(cam.z, 1.3);
      w.bubble = "👋";
      w.bubbleT = 2.5;
    }
  },
};

let lastTickNow = 0;
function tick() {
  advanceClock();
  const tdt = clamp(NOW - (lastTickNow || NOW), 0, 5000);
  lastTickNow = NOW;
  constructionTick(tdt);
  cityTick();
  tourismTick(tdt);
  weatherTick();
  randomEventTick();
  railTick();
  seaTick();
  airTick();
  dailyTick();
  eventTick();
  contractsTick();
  trendsTick();
  if (typeof endgameTick === "function") endgameTick();
  for (const e of world.ents.values()) {
    if (FACTORY_TYPES.includes(e.t)) factoryTick(e);
    if (e.dying && NOW > e.dying + 460) {
      unindexEnt(e);
      world.ents.delete(e.id);
      worldChanged();
    }
  }
  recalcPop();
  discoverTick();
  if (typeof ensureCities === "function" && discT % 8 === 0) ensureCities();
  systemsTick();
  updateOrders();
  courierTick();
  workforceTick();
  rentCollectorSweep();
  if (typeof societyTick === "function") societyTick();
  if (typeof automationTick === "function") automationTick();
  if (typeof fleetTick === "function") fleetTick();
  payTick();
  checkAch();
  checkTutorial();
  renderPanel(false);
  drawMinimap();
}

function serializeSave() {
  const ents = [];
  for (const e of world.ents.values()) {
    if (e.dying || e.nat) continue;
    const o = Object.assign({}, e);
    if (o.moving) {
      o.x = o.ox;
      o.y = o.oy;
    }
    delete o.moving;
    delete o.ox;
    delete o.oy;
    delete o.born;
    ents.push(o);
  }
  S.cam = { x: cam.x, y: cam.y, z: cam.z };
  advanceClock();
  S.clock = clock.t;
  S.paused = clock.paused;
  S.speed = clock.speed;
  return JSON.stringify({ S, ents, nextId: world.nextId, savedAt: Date.now() });
}
let lastSavedAt = Date.now();
function save() {
  if (!S || resetting) return;
  try {
    localStorage.setItem(SAVE_KEY, serializeSave());
    lastSavedAt = Date.now();
  } catch (err) {
    console.warn("save failed", err);
  }
}
let PRELOAD_SAVE = null;
function load() {
  try {
    const raw =
      PRELOAD_SAVE != null ? PRELOAD_SAVE : localStorage.getItem(SAVE_KEY);
    PRELOAD_SAVE = null;
    if (!raw) return false;
    let d = JSON.parse(raw);
    if (typeof migrateSave === "function") d = migrateSave(d);
    const def = defaultState();
    S = Object.assign(def, d.S);
    S.stats = Object.assign(defaultState().stats, d.S.stats || {});
    S.perks = S.perks || {};
    S.boost = S.boost || {};
    S.bridges = S.bridges || {};
    const dd = defaultState();
    for (const k of ["rail", "sea", "air", "streak"])
      S[k] = Object.assign(dd[k], S[k] || {});

    clock.t = S.clock
      ? S.clock +
        (S.paused ? 0 : Math.max(0, Date.now() - (d.savedAt || Date.now())))
      : Date.now();
    clock.paused = !!S.paused;
    clock.speed = S.speed || 1;
    clock.last = performance.now();
    NOW = clock.t;
    for (const w of S.workers) {
      w.task = null;
      w.isW = true;
      w.unreach = {};
      w.path = null;
      w.pathFor = null;
    }
    initGen(
      S.seed,
      S.genSpawn ? S.genSpawn.x : 0,
      S.genSpawn ? S.genSpawn.y : 0,
    );
    resetWorld();
    if (typeof resetGroundCaches === "function") resetGroundCaches();
    mmTerr = null;
    for (const e of d.ents) {
      if (!BUILD[e.t] || BUILD[e.t].nature) continue;
      world.ents.set(e.id, e);
      indexEnt(e);
      setOcc(e, e.id);
    }
    world.nextId = Math.max(d.nextId || 1, ...d.ents.map((e) => e.id + 1));
    if (typeof postLoadFixups === "function") postLoadFixups(d);
    worldChanged();
    return d.savedAt || true;
  } catch (err) {
    console.warn("load failed", err);
    return false;
  }
}
function newWorldDialog(seed) {
  dialog({
    title: "🌍 Start a new world?",
    body: `This permanently deletes your current town and all progress.<br><br>New world seed: <b>${seed.replace(/</g, "&lt;")}</b><br><small>The same seed always generates the same world and starting village.</small>`,
    yes: "Create world",
    cls: "red",
    onYes: () => {
      resetting = true;
      localStorage.removeItem(SAVE_KEY);
      localStorage.setItem("meadowvale_next_seed", seed);
      location.reload();
    },
  });
}
function newGame(seedText, opts) {
  S = defaultState();
  S.seedText = String(seedText || randomSeedText());
  S.seed = hashSeed(S.seedText);
  S.mode = (opts && opts.mode) || "career";
  S.wtype = (opts && opts.type) || "normal";
  if (S.mode === "creative") {
    S.coins = 1e9;
    S.gems = 9999;
  }
  resetWorld();
  if (typeof resetGroundCaches === "function") resetGroundCaches();
  genStart(S.seed);
  S.orders.push(makeOrder({ wheat: 4 }));
  S.orders.push(makeOrder({ rice: 3 }));
  S.nextOrder = NOW + 15000;
}

let lastT = performance.now();
function loop(t) {
  const realDT = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  advanceClock();
  DT = clock.paused ? 0 : realDT * clock.speed;
  ANIM += DT;
  T = ANIM;
  updateCamera(realDT);
  updateParticles(DT);
  updateWalkers(DT);
  updateWorkers(DT);
  updateLife(DT);
  if (typeof updateTraffic === "function") updateTraffic(DT);
  if (typeof updateTransit === "function") updateTransit(DT);
  updateClouds(DT);
  render();
  updatePopup();
  updateHUD();
  requestAnimationFrame(loop);
}

function boot() {
  initCanvas();
  initMinimap();
  initClouds();
  try {
    for (const k of OLD_SAVE_KEYS) localStorage.removeItem(k);
  } catch (e) {}
  const world0 = currentWorld();
  if (!world0) {
    startTitle();
    return;
  }
  SAVE_KEY = worldKey(world0);
  const loaded = load();
  const fresh = !loaded;
  if (fresh) newGame(world0.seed, world0);
  Sfx.on = S.sound;
  if (fresh) {
    clock.t = Date.now();
    clock.last = performance.now();
  }
  NOW = clock.t;
  recalcPop();
  genThumbs();
  if (S.cam) {
    cam.x = S.cam.x;
    cam.y = S.cam.y;
    cam.z = S.cam.z;
  } else {
    const p = P(S.spawn.x, S.spawn.y + 2);
    cam.x = p[0];
    cam.y = p[1];
    cam.z = 1.15;
  }
  for (const o of S.orders) spawnCustomer(o, true);
  for (let i = 0; i < Math.min(12, Math.floor(POP / 3)); i++) {
    spawnVillager();
    const w = walkers[walkers.length - 1];
    if (w) {
      w.alpha = 1;
    }
  }
  initInput();
  renderQuest();
  updateHUD();
  requestAnimationFrame(loop);
  tick();
  setInterval(tick, 250);
  if (clock.paused) setPaused(true);
  setInterval(save, 60000);
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) save();
  });
  const ld = $("#loading");
  ld.classList.add("done");
  setTimeout(() => ld.remove(), 600);
  if (fresh) {
    dialog({
      title: "🌾 Welcome to Meadowvale!",
      body: `<div class="dlg-big">🧑‍🌾</div>You've inherited a little farm next to a sleepy village.<br><br>
        You have <b>20 🌾 wheat</b> and <b>20 🍚 rice</b> seeds. Plant them, harvest, and sell your crops to villagers at the market.
        Grow the town, clear the wild land and expand across the whole island!`,
      no: false,
      yes: "Let's farm! 🚜",
    });
  } else if (typeof loaded === "number" && Date.now() - loaded > 60000) {
    toast(
      "👋 Welcome back! Your crops kept growing while you were away.",
      "good",
    );
  }
  dailyTick();
  eventTick();
  if (!fresh && typeof loaded === "number") {
    const sim = simulateOffline(Date.now() - loaded);
    if (sim && (Object.keys(sim.got).length || sim.rent))
      setTimeout(
        () =>
          dialog({
            title: "👷 While you were away…",
            body: `<div class="dlg-big">📋</div>Your staff worked for <b>${fmtTime(sim.t)}</b>:<div class="dlg-chips">${Object.entries(
              sim.got,
            )
              .map(
                ([k, n]) => `<span class="chip">${ITEMS[k].icon} +${n}</span>`,
              )
              .join(
                "",
              )}${sim.rent ? `<span class="chip">🪙 +${fmt(sim.rent)} rent</span>` : ""}</div><small>Wages paid: 🪙${fmt(sim.wages)}</small>`,
            no: false,
            yes: "Great!",
          }),
        600,
      );
  }
  const ls = loginStreak();
  if (ls && !fresh)
    setTimeout(
      () =>
        dialog({
          title: `🔥 Day ${ls.day} login bonus!`,
          body: `<div class="dlg-big">🎁</div>Thanks for coming back! Your streak is <b>${S.streak.n} day${S.streak.n === 1 ? "" : "s"}</b>.<br>Reward: <b>${giveReward(ls.r)}</b>`,
          no: false,
          yes: "Collect",
        }),
      900,
    );
  else if (ls) giveReward(ls.r);
}
window.addEventListener("load", boot);
