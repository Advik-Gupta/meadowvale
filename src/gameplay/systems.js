let POPCAP = 100;
const BASE_POPCAP = 60;
const MAX_LVL = 3;

function lvlOf(e) {
  return e.lvl || 1;
}
function popOf(e) {
  const b = BUILD[e.t];
  return b.pop ? Math.round(b.pop * (1 + 0.25 * (lvlOf(e) - 1))) : 0;
}
function capOf(e) {
  const b = BUILD[e.t];
  return b.cap ? Math.round(b.cap * (1 + 0.5 * (lvlOf(e) - 1))) : 0;
}
function rentOf(e) {
  const b = BUILD[e.t];
  const opera = hasType("operahouse") && !hasType("operahouse").build ? 1.1 : 1;
  return Math.max(
    1,
    Math.round(
      b.rent *
        (1 + 0.5 * (lvlOf(e) - 1)) *
        (boostOn("rent") ? 2 : 1) *
        happyMult(e) *
        utilMult() *
        opera,
    ),
  );
}
function slotsOf(e) {
  return 3 + (lvlOf(e) - 1) + (hasPerk("extraslot") ? 1 : 0);
}
function maxLvlOf(e) {
  return e.t === "townhall" ? 5 : MAX_LVL;
}
function upgradable(e) {
  const b = BUILD[e.t];
  if (e.build) return false;
  if (e.t === "townhall") return true;
  if (b.special) return false;
  if (b.orchard || e.t === "seedshed") return true;
  return !!(
    b.rent ||
    b.cap ||
    b.animal ||
    b.produce ||
    b.power ||
    b.water ||
    e.t === "field" ||
    Object.values(POOLS).some((p) => p.bld === e.t) ||
    (b.recipes && FACTORY_TYPES.includes(e.t))
  );
}
function upgradeCost(e) {
  return (
    Math.round(
      ((e.t === "field" ? 120 : BUILD[e.t].cost || 200) * 0.6 * lvlOf(e)) / 10,
    ) * 10
  );
}
function upgradeLevelReq(e) {
  return e.t === "townhall"
    ? 5 * lvlOf(e)
    : (BUILD[e.t].level || 1) + 2 * lvlOf(e);
}
function upgradeEffect(e) {
  const b = BUILD[e.t];
  if (e.t === "townhall") return "+50% cap & a grander Town Hall";
  if (b.orchard) return "More fruit per harvest";
  if (e.t === "seedshed") return "+150 seed space";
  if (b.rent) return `+50% rent, +25% residents`;
  if (b.cap) return `+50% population cap`;
  if (b.animal) return `+1 animal`;
  if (e.t === "field") return "+10% growth speed";
  if (b.produce) return "Doubles/triples output";
  if (b.power || b.water) return "+100% supply";
  if (Object.values(POOLS).some((p) => p.bld === e.t)) return "+100% storage";
  return `+1 production slot, 10% faster`;
}
function upgradeHTML(e) {
  if (!upgradable(e)) return "";
  const l = lvlOf(e);
  if (l >= maxLvlOf(e))
    return `<div class="upg-row max">★ Max level reached</div>`;
  const cost = upgradeCost(e),
    req = upgradeLevelReq(e);
  if (S.level < req)
    return `<div class="upg-row">⬆ Upgrade to ★${l + 1} unlocks at level ${req}</div>`;
  return `<div class="upg-row"><span>⬆ ★${l + 1}: ${upgradeEffect(e)}</span><button class="btn purple small ${S.coins >= cost ? "" : "disabled"}" data-act="p-upgrade">🪙 ${fmt(cost)}</button></div>`;
}
function upgradeBuilding(e) {
  if (!e || !upgradable(e) || lvlOf(e) >= maxLvlOf(e)) return;
  const b = BUILD[e.t];
  if (S.level < upgradeLevelReq(e)) {
    toast(`🔒 Requires level ${upgradeLevelReq(e)}`);
    return;
  }
  if (b.rent && POP + Math.round(b.pop * 0.25) > POPCAP) {
    toastOnce(
      "Population cap reached - build community buildings first! 🏫",
      "warn",
    );
    sfx("error");
    return;
  }
  if (!spend(upgradeCost(e))) return;
  e.lvl = lvlOf(e) + 1;
  if (b.animal) e.an.push({ f: 0 });
  S.stats.upgrades++;
  addXP(5 * e.lvl);
  recalcPop();
  e.born = NOW;
  sfx("build");
  const p = entWorld(e, b.ht || 30);
  burst(p[0], p[1], 20, ["#ffd23f", "#fff2a8", "#b07cff"], "spark", 70);
  floatText(p[0], p[1] - 10, `★${e.lvl} Upgraded!`, "#ffe680", 15);
  hidePopup();
}

function hasPerk(id) {
  return !!(S && S.perks && S.perks[id]);
}
function buyPerk(id) {
  const p = PERKS.find((x) => x.id === id);
  if (!p || hasPerk(id)) return;
  if (S.level < p.level) {
    toast(`🔒 Unlocks at level ${p.level}`);
    return;
  }
  if (!spend(p.cost)) return;
  S.perks[id] = true;
  S.stats.perks++;
  sfx("ach");
  toast(`${p.icon} <b>${p.name}</b> unlocked! ${p.desc}`, "good");
  recalcPop();
  renderPanel(true);
}

function boostOn(id) {
  return !!(S && S.boost && S.boost[id] > NOW);
}
function boosterCost(b) {
  return Math.round((b.cost * (1 + S.level * 0.08)) / 10) * 10;
}
function buyBooster(id) {
  const b = BOOSTERS.find((x) => x.id === id);
  if (!b) return;
  if (S.level < b.level) {
    toast(`🔒 Unlocks at level ${b.level}`);
    return;
  }
  if (!spend(boosterCost(b))) return;
  S.boost[id] = Math.max(NOW, S.boost[id] || 0) + b.dur;
  sfx("level");
  toast(
    `${b.icon} <b>${b.name}</b> active for ${fmtTime(S.boost[id] - NOW)}!`,
    "good",
  );
  renderPanel(true);
}

function sprinkledFields() {
  if (sprinkleCache) return sprinkleCache;
  sprinkleCache = new Set();
  for (const sp of entsOf("sprinkler")) {
    if (sp.moving) continue;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const f = entAt(sp.x + dx, sp.y + dy);
        if (f && f.t === "field") sprinkleCache.add(f);
      }
  }
  return sprinkleCache;
}

let lastSysNow = 0;
function systemsTick() {
  const dt = clamp(NOW - (lastSysNow || NOW), 0, 2000);
  lastSysNow = NOW;
  if (dt > 0) {
    const grow = boostOn("grow");
    const spr = sprinkledFields();
    const wm = weatherGrowMult(),
      em = 0.03 * engLvl("fields");
    for (const f of entsOf("field")) {
      if (!f.crop) continue;
      let extra =
        wm +
        em +
        0.1 * (lvlOf(f) - 1) +
        0.05 * mayor("m_grow") +
        (specOn("agronomist") ? 0.15 : 0);
      const cs = CROPS[f.crop].seasons;
      if (cs) extra += cs.includes(seasonIdx()) ? 0.3 : -0.25;
      if (grow) extra += 1;
      if (spr.has(f)) extra += 0.25;
      if (extra) f.pt -= extra * dt;
    }
    const am = 0.05 * mayor("m_animal") + (specOn("vet") ? 0.15 : 0);
    if (am)
      for (const t of ANIMAL_TYPES)
        for (const e of entsOf(t))
          for (const a of e.an) if (a.f) a.f -= dt * am;
    if (boostOn("animal"))
      for (const t of ANIMAL_TYPES)
        for (const e of entsOf(t)) for (const a of e.an) if (a.f) a.f -= dt;
    if (S.wx && S.wx.type === "heat")
      for (const t of ANIMAL_TYPES)
        for (const e of entsOf(t))
          for (const a of e.an) if (a.f) a.f += dt * 0.25;

    const pr = utilRatio("power"),
      slow = S.level >= 10 ? (1 - pr) * 0.5 : 0;
    for (const t of FACTORY_TYPES)
      for (const e of entsOf(t)) {
        if (!e.job) continue;
        if (e.fire && e.fire > NOW) e.job.st += dt;
        else if (slow > 0) e.job.st += dt * slow;
      }
  }
  if (hasPerk("autorent")) {
    for (const t of HOUSE_TYPES)
      for (const e of entsOf(t))
        if (!e.moving && rentReady(e)) collectRent(e, true, 0.9);
  }
  for (const k in S.boost)
    if (S.boost[k] <= NOW) {
      const b = BOOSTERS.find((x) => x.id === k);
      delete S.boost[k];
      if (b) toastOnce(`${b.icon} ${b.name} has worn off.`, "info");
    }
}
