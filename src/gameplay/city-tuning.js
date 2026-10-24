const WALK_RANGE = 48;
reachable = function (a, b) {
  if (dist(a, b) <= WALK_RANGE) return true;
  const ra = frontRoad(a),
    rb = frontRoad(b);
  return !!ra && !!rb && ra.c === rb.c;
};

const KITCHENS = {
  ch_burger: ["burger", "fries"],
  ch_chicken: ["sandwich", "fries"],
  ch_pizza: ["pizza", "pasta"],
  ch_sub: ["sandwich", "chips"],
  ch_taco: ["taco", "burrito"],
  ch_coffee: ["coffeecup", "cupcake"],
  ch_donut: ["donut", "coffeecup"],
  ch_wok: ["ricebowl", "curry"],
  ch_noodle: ["pasta", "ricebowl"],
  ch_icecream: ["icecream", "sundae", "popsicle"],
  ch_steak: ["burger", "fishchips"],
  ch_sushi: ["sushi", "greentea"],
  ch_bbq: ["hotdog", "burger"],
  ch_diner: ["pancakes", "omelette", "burger", "fries"],
  ch_bubble: ["bubbletea", "smoothie"],
  ch_mart: ["chips", "sandwich", "juice"],
  ch_super: ["bread", "chips", "juice", "cookie"],
  restaurant: ["pasta", "salad", "curry", "pizza"],
  pub: ["fishchips", "chips", "hotdog"],
  bistro: ["sandwich", "coffeecup", "salad"],
  jp_ramen: ["ricebowl"],
  cn_dimsum: ["ricebowl"],
  md_tavern: ["fishchips", "bread"],
  gr_taverna: ["salad"],
  ww_saloon: ["hotdog"],
  tp_tikibar: ["pinacolada", "smoothie"],
  in_chai: ["greentea"],
};
for (const t in KITCHENS) {
  KITCHENS[t] = KITCHENS[t].filter((k) => ITEMS[k]);
  if (!BUILD[t] || !KITCHENS[t].length) delete KITCHENS[t];
  else BUILD[t].desc = (BUILD[t].desc ? BUILD[t].desc + " " : "") + `Cooks and delivers ${KITCHENS[t].map((k) => ITEMS[k].icon).join("")} orders.`;
}
function kitchenCost(k, n) {
  const R = RECIPES[k];
  if (R && Object.entries(R.in).every(([i, q]) => (S.inv[i] || 0) >= q * n)) return { take: R.in, coins: 0 };
  return { take: null, coins: Math.ceil((ITEMS[k].price || 40) * 0.5 * n) };
}
function kitchenTick() {
  if (NOW - (S.kitT || 0) < 2500) return;
  S.kitT = NOW;
  const kit = {};
  for (const t in KITCHENS)
    for (const e of entsOf(t)) {
      if (!usable(e)) continue;
      for (const k of KITCHENS[t]) (kit[k] = kit[k] || []).push(e);
    }
  if (!Object.keys(kit).length) return;
  const busy = new Set();
  for (const o of S.orders.slice()) {
    let ok = true,
      hot = null;
    const miss = {};
    for (const k in o.items) {
      const lack = o.items[k] - (S.inv[k] || 0);
      const cook = (kit[k] || []).find((e) => !busy.has(e.id));
      if (cook && !hot) hot = cook;
      if (lack <= 0) continue;
      if (!cook) {
        ok = false;
        break;
      }
      miss[k] = lack;
    }
    if (!ok || !hot) continue;
    const plans = Object.entries(miss).map(([k, n]) => [k, n, kitchenCost(k, n)]);
    const coins = plans.reduce((a, p) => a + p[2].coins, 0);
    if (coins && S.coins < coins) continue;
    if (coins) S.coins -= coins;
    for (const [k, n, c] of plans) {
      if (c.take) for (const i in c.take) takeItem(i, c.take[i] * n);
      S.inv[k] = (S.inv[k] || 0) + n;
    }
    busy.add(hot.id);
    if (hot.biz) hot.biz.rev = (hot.biz.rev || 0) + Math.round(o.coins * 0.1);
    deliverOrder(o.id, null, true);
    const p = entWorld(hot, (BUILD[hot.t].ht || 40) + 10);
    floatText(p[0], p[1], "🛵 Delivered!", "#ffffff", 13);
  }
}

const STORE_ART_T = typeof STORE_ART === "function" ? STORE_ART : null;
Object.assign(BUILD, {
  matwarehouse: { name: "Industrial Material Warehouse", icon: "🏗️", cat: "ind", w: 6, h: 6, cost: 60000, ht: 78, level: 1, tier: 1, desc: "Racks to the roof: 6,000 materials, tools and ores.", art: STORE_ART_T("#cfd8dc", "#455a64", "🏗️", 50, 6, 6) },
  matpark: { name: "Material Logistics Park", icon: "🚛", cat: "ind", w: 7, h: 7, cost: 150000, ht: 84, level: 1, tier: 1, desc: "A whole site for stock: 15,000 materials, tools and ores.", art: Object.assign(STORE_ART_T("#ffe0b2", "#bf360c", "🚛", 54, 7, 7), { fx: "crane" }) },
  matterminal: { name: "Bulk Material Terminal", icon: "🏭", cat: "ind", w: 8, h: 8, cost: 360000, ht: 92, level: 1, tier: 1, desc: "Feeds the fastest factories: 40,000 materials, tools and ores.", art: Object.assign(STORE_ART_T("#b0bec5", "#263238", "🏭", 58, 8, 8), { fx: "crane" }) },
  megawarehouse: { name: "Mega Warehouse", icon: "📦", cat: "prod", w: 6, h: 6, cost: 52000, ht: 76, level: 1, tier: 1, desc: "8,000 goods, feed and exotic items.", art: STORE_ART_T("#d7ccc8", "#4e342e", "📦", 50, 6, 6) },
  ffpantry: { name: "Fast-Food Pantry", icon: "🥡", cat: "biz", w: 2, h: 2, cost: 2200, ht: 40, level: 1, tier: 1, desc: "Stores 250 burgers, fries, tacos and other goods for your restaurants.", art: STORE_ART_T("#fff3e0", "#e65100", "🥡", 24, 2, 2) },
  ffcoldroom: { name: "Restaurant Cold Room", icon: "🧊", cat: "biz", w: 3, h: 3, cost: 7500, ht: 50, level: 1, tier: 1, desc: "Chilled storage for 900 prepared foods and goods.", art: STORE_ART_T("#e1f5fe", "#0277bd", "🧊", 30, 3, 3) },
  ffdistrib: { name: "Food Service Distribution Center", icon: "🚚", cat: "biz", w: 5, h: 4, cost: 26000, ht: 62, level: 1, tier: 1, desc: "Supplies every kitchen in town: 3,500 goods.", art: STORE_ART_T("#ffebee", "#c62828", "🚚", 40, 5, 4) },
});
for (const t of ["matwarehouse", "matpark", "matterminal", "megawarehouse", "ffpantry", "ffcoldroom", "ffdistrib"]) DRAW[t] = drawArt;
Object.assign(POOLS.depot.extra, { matwarehouse: 6000, matpark: 15000, matterminal: 40000 });
Object.assign(POOLS.warehouse.extra, { megawarehouse: 8000, ffpantry: 250, ffcoldroom: 900, ffdistrib: 3500 });
Object.assign(JOBS, {
  matwarehouse: { n: 24, k: "worker", w: 48 },
  matpark: { n: 40, k: "worker", w: 50 },
  matterminal: { n: 60, k: "worker", w: 52 },
  megawarehouse: { n: 30, k: "driver", w: 50 },
  ffpantry: { n: 2, k: "driver", w: 36 },
  ffcoldroom: { n: 4, k: "driver", w: 40 },
  ffdistrib: { n: 14, k: "driver", w: 46 },
});

for (const t in BUILD) {
  const b = BUILD[t];
  if (b.cat === "mil") b.def = Math.max(1, Math.round(Math.sqrt(b.cost || 0) / 4));
}
const SCORE_SETS = {
  health: ["clinic", "pharmacy", "hospital", "childrens", "medcenter", "gov_ambulance", "mil_hospital", "ch_pharmacy", "seniorhome"],
  education: ["kindergarten", "school", "highschool", "college", "university", "research", "library", "fun_library2", "mil_academy", "daycare", "institute"],
  safety: ["police", "gov_policehq", "firestation", "gov_firehq", "gov_prison", "gov_court", "gov_supreme", "ww_sheriff"],
};
const SCORE_OF = {};
for (const k in SCORE_SETS) for (const t of SCORE_SETS[k]) SCORE_OF[t] = k;
function cityScores() {
  const s = { defense: 0, health: 0, education: 0, safety: 0, leisure: 0, culture: 0 };
  for (const e of world.ents.values()) {
    if (e.nat || e.build || e.burnt) continue;
    const b = BUILD[e.t];
    if (!b) continue;
    const lv = lvlOf(e),
      size = e.w * e.h;
    if (b.def) s.defense += b.def * lv;
    const k = SCORE_OF[e.t];
    if (k) s[k] += size * 4 * lv;
    else if (b.cat === "fun" || b.cat === "sport" || ["park", "dogpark", "commgarden", "centralpark", "playground"].includes(e.t)) s.leisure += size * 2 * lv;
    else if (b.cat === "monument" || b.cat === "wonder" || ["museum", "fun_artmuseum", "fun_natmuseum", "operahouse"].includes(e.t)) s.culture += size * 5 * lv;
  }
  return s;
}
const DEFENSE_RANKS = [
  [0, "Undefended"],
  [50, "Guarded"],
  [250, "Fortified"],
  [1000, "Stronghold"],
  [4000, "Military Power"],
  [12000, "Superpower"],
];
function defenseRank(v) {
  let r = DEFENSE_RANKS[0][1];
  for (const [min, n] of DEFENSE_RANKS) if (v >= min) r = n;
  return r;
}
function cityScoresHTML() {
  const s = cityScores();
  const row = (ic, nm, v, sub) => `<div class="score"><span>${ic}</span><b>${fmt(v)}</b><small>${nm}${sub ? ` · ${sub}` : ""}</small></div>`;
  return `<div class="cbox wide"><div class="cb-t">🏅 City scores</div><div class="scores">${row("🪖", "Defense", s.defense, defenseRank(s.defense))}${row("🏥", "Health", s.health)}${row("🎓", "Education", s.education)}${row("🚓", "Safety", s.safety)}${row("🎡", "Leisure", s.leisure)}${row("🎭", "Culture", s.culture)}</div><small>Every military building adds defense points; hospitals, schools, police and parks add to their scores. Upgrading multiplies them.</small></div>`;
}
const _renderCityTune = renderCity;
renderCity = function (tab) {
  const html = _renderCityTune(tab);
  return html.startsWith('<div class="city-grid">') ? html.replace('<div class="city-grid">', '<div class="city-grid">' + cityScoresHTML()) : html;
};
PANELS.city.render = (t) => renderCity(t);
const _buildCardTune = buildCard;
buildCard = function (k) {
  const html = _buildCardTune(k),
    b = BUILD[k];
  if (!b) return html;
  const chips = [];
  if (b.def) chips.push(`<span class="chip" title="Defense points">🛡️ +${b.def}</span>`);
  if (KITCHENS[k]) chips.push(`<span class="chip" title="Cooks and delivers orders">🛵 ${KITCHENS[k].map((i) => ITEMS[i].icon).join("")}</span>`);
  return chips.length ? html.replace('<div class="card-stats">', '<div class="card-stats">' + chips.join("")) : html;
};

const AUTOFIRE_IDLE = 15 * 60000;
function farmhandCapacity() {
  return S.workers.filter((w) => w.role === "farmhand").reduce((a, w) => a + maxFields(w), 0);
}
function liveFields() {
  return [...entsOf("field")].filter((f) => !f.moving && !f.build);
}
const _hireTune = hireWorker;
hireWorker = function (cid) {
  const c = (S.cands || []).find((x) => x.cid === cid);
  if (c && c.role === "farmhand" && S.autoFire !== false && farmhandCapacity() >= liveFields().length) {
    toastOnce("🌾 Your farmhands can already tend every field - build more fields before hiring another.", "warn");
    if (S.openings && S.openings.farmhand) S.openings.farmhand = 0;
    if (String(cid).startsWith("jb")) S.cands = S.cands.filter((x) => x !== c);
    return;
  }
  const n = S.workers.length;
  _hireTune(cid);
  if (S.workers.length > n) {
    const w = S.workers[S.workers.length - 1];
    w.hiredAt = NOW;
    w.busyAt = NOW;
  }
};
const _decideTune = decide;
decide = function (w) {
  const t = _decideTune(w);
  if (t || !w.busyAt) w.busyAt = NOW;
  return t;
};
function dismissWorkers(list, why) {
  if (!list.length) return;
  const gone = new Set(list);
  S.workers = S.workers.filter((w) => !gone.has(w));
  const byRole = {};
  for (const w of list) byRole[w.role] = (byRole[w.role] || 0) + 1;
  const txt = Object.entries(byRole)
    .map(([r, n]) => `${n} ${ROLES[r] ? ROLES[r].icon + " " + ROLES[r].name : r}${n > 1 ? "s" : ""}`)
    .join(", ");
  toast(`🤖 Let go ${txt} - ${why}. They found jobs in town.`, "info");
  if (typeof news === "function" && S.news) news("🤖", `Let go ${txt} (${why}).`);
  renderPanel(true);
}
function autoFireTick() {
  if (NOW - (S.afT || 0) < 15000) return;
  S.afT = NOW;
  if (S.autoFire === false || S.strike || !S.workers.length) return;
  const fh = S.workers.filter((w) => w.role === "farmhand");
  if (fh.length) {
    const fields = liveFields();
    for (const w of fh) w.cfg.fields = (w.cfg.fields || []).filter((id) => world.ents.has(id) && world.ents.get(id).t === "field");
    const sorted = fh.slice().sort((a, b) => b.skill - a.skill || b.cfg.fields.length - a.cfg.fields.length);
    const keep = [];
    let cap = 0;
    for (const w of sorted) {
      if (cap >= fields.length) break;
      keep.push(w);
      cap += maxFields(w);
    }
    const extra = fh.filter((w) => !keep.includes(w) && NOW - (w.hiredAt || 0) > 60000);
    if (extra.length) {
      const gone = new Set(extra);
      for (const w of extra) w.cfg.fields = [];
      for (const w of keep) if (!gone.has(w)) assignFields(w, maxFields(w));
      dismissWorkers(extra, "there aren't enough fields for them");
    } else for (const w of keep) if (!w.cfg.fields.length) assignFields(w, maxFields(w));
  }
  const idle = S.workers.filter((w) => w.role !== "farmhand" && w.busyAt && NOW - w.busyAt > AUTOFIRE_IDLE && NOW - (w.hiredAt || 0) > AUTOFIRE_IDLE);
  dismissWorkers(idle, "they had nothing to do for a long time");
}
const _tickTune = tick;
tick = function () {
  _tickTune();
  kitchenTick();
  autoFireTick();
};

const _renderTeamTune = renderTeam;
renderTeam = function () {
  const html = _renderTeamTune();
  if (!S.workers.length) return html;
  const roles = [...new Set(S.workers.map((w) => w.role))],
    allCol = roles.every((r) => S.staffCollapsed && S.staffCollapsed[r]);
  const bar = `<div class="team-tools"><button class="btn small" data-act="grp-all" data-v="${allCol ? 0 : 1}">${allCol ? "▾ Expand all" : "▸ Collapse all"}</button>
    <span class="team-af"><span>🤖 Auto-dismiss idle staff</span><button class="toggle sm ${S.autoFire === false ? "" : "on"}" data-act="autofire"><i></i></button></span></div>`;
  return html.replace('<div class="staff-split">', bar + '<div class="staff-split">');
};
Object.assign(ACT, {
  "grp-all": (d) => {
    S.staffCollapsed = S.staffCollapsed || {};
    for (const w of S.workers) S.staffCollapsed[w.role] = d.v === "1";
    renderPanel(true);
  },
  autofire: () => {
    S.autoFire = S.autoFire === false;
    toast(S.autoFire ? "🤖 Idle staff and farmhands without fields will be let go automatically." : "Auto-dismiss is off.", "info");
    renderPanel(true);
  },
});
