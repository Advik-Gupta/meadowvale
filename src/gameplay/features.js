function orchardInit(e) {
  const o = BUILD[e.t].orchard;
  e.nt = NOW + o.mature;
  e.hl = o.harvests;
}
function orchardReady(e) {
  return e.hl > 0 && NOW >= e.nt;
}
function orchardHarvest(e, quiet) {
  const o = BUILD[e.t].orchard;
  if (!orchardReady(e)) {
    if (!quiet) orchardPopup(e);
    return 0;
  }
  const n = o.qty * lvlOf(e);
  if (spaceFor(o.item) < n) {
    if (!quiet) storageFullPrompt();
    return 0;
  }
  addItem(o.item, n);
  e.hl--;
  e.nt = NOW + o.regrow;
  S.stats.harvested += n;
  addXP(ITEMS[o.item].xp + 1);
  const p = entWorld(e, 40);
  floatText(p[0], p[1], `+${n} ${ITEMS[o.item].icon}`, "#fff");
  burst(p[0], p[1], 10, ["#e53935", "#ffb300", "#7cb342"], "leaf", 60);
  if (!quiet) {
    sfx("harvest");
    const [sx, sy] = entScreen(e, 40);
    flyIcon(ITEMS[o.item].icon, sx, sy, "#btn-inventory", n);
  }
  return n;
}
function orchardPrune(e) {
  const o = BUILD[e.t].orchard,
    c = Math.round(BUILD[e.t].cost * 0.4);
  if (e.hl > 0) return;
  if (!spend(c)) return;
  e.hl = o.harvests;
  e.nt = NOW + o.regrow;
  sfx("chop");
  hidePopup();
  toast("✂️ Pruned! The tree will fruit again.", "good");
}
function orchardPopup(e) {
  const b = BUILD[e.t],
    o = b.orchard;
  showPopup(e, {
    sig: () => "" + orchardReady(e) + e.hl + lvlOf(e),
    render:
      () => `<div class="pp-title">${b.icon} ${b.name}</div><div class="pp-sub">${ITEMS[o.item].icon} ×${o.qty * lvlOf(e)} per harvest · <b>${e.hl}</b> harvests left before pruning</div>
      ${e.hl > 0 ? '<div class="pp-row"><div class="pbar"><div id="pp-bar"></div></div><span class="pp-t" id="pp-time"></span></div>' : ""}${upgradeHTML(e)}
      <div class="pp-btns">${orchardReady(e) ? '<button class="btn green small" data-act="p-orchard">Harvest</button>' : ""}${e.hl <= 0 ? `<button class="btn orange small" data-act="p-prune">✂️ Prune · 🪙${Math.round(b.cost * 0.4)}</button>` : ""}<button class="btn blue small" data-act="p-move">✋ Move</button><button class="btn red small" data-act="p-sell">Remove</button></div>`,
    live: () => {
      const t = document.getElementById("pp-time"),
        bar = document.getElementById("pp-bar");
      if (!t) return;
      const left = Math.max(0, e.nt - NOW);
      t.textContent = left ? fmtTime(left) : "Ready!";
      bar.style.width =
        (left ? clamp(1 - left / o.regrow, 0, 1) : 1) * 100 + "%";
    },
  });
}

function shelvesOf(e) {
  return 3 + (lvlOf(e) - 1) + (engLvl(e.t) >= 5 ? 1 : 0);
}

function seedCap() {
  let c = 200;
  for (const e of entsOf("seedshed"))
    if (!e.build && !e.moving) c += 150 * lvlOf(e);
  return c;
}
function seedTotal() {
  let n = 0;
  for (const k in S.seeds) n += S.seeds[k];
  return n;
}

let lastFullPrompt = 0;
function storageFullPrompt() {
  if (Date.now() - lastFullPrompt < 15000) {
    toastOnce("Storage is full! 📦", "warn");
    return;
  }
  lastFullPrompt = Date.now();
  sfx("error");
  dialog({
    title: "📦 Storage is full!",
    body: '<div class="dlg-big">🛖</div>Your barn and storage buildings are packed. Quick-sell your cheapest surplus, open the barn to choose, or build more storage (Silos, Warehouses, Cold Storage, Material Depot).',
    no: "Open Barn",
    yes: "Quick-sell 10 cheapest",
    cls: "orange",
    onYes: quickSellSurplus,
  });
  dlgNo = () => openPanel("inventory");
}
let dlgNo = null;
function quickSellSurplus() {
  let left = 10,
    coins = 0;
  const ks = Object.keys(S.inv)
    .filter((k) => S.inv[k] > 0 && ITEMS[k])
    .sort((a, b) => ITEMS[a].price - ITEMS[b].price);
  for (const k of ks) {
    while (left && S.inv[k] > 0) {
      takeItem(k, 1);
      coins += priceOf(k);
      left--;
    }
    if (!left) break;
  }
  addCoins(coins);
  sfx("coin");
  toast(`Sold 10 items for 🪙${coins}`, "good");
}

let lastPerish = 0;
function realismTick() {
  if (!S.realism) {
    lastPerish = NOW;
    return;
  }
  if (NOW - lastPerish < 60000) return;
  lastPerish = NOW;
  let total = 0;
  const ks = [];
  for (const k in S.inv)
    if (PERISHABLE.has(k)) {
      total += S.inv[k];
      ks.push(k);
    }
  let excess = total - POOLCAP.cold;
  if (excess <= 0) return;
  let lost = 0;
  for (const k of ks) {
    const n = Math.min(
      S.inv[k],
      Math.max(1, Math.round((S.inv[k] * 0.05 * excess) / total)),
    );
    takeItem(k, n);
    lost += n;
  }
  if (lost)
    notify(
      "🦠",
      `${lost} perishable items spoiled. Build Cold Storage to keep food fresh!`,
      false,
    );
}
function useFuel(kind) {
  if (!S.realism) return true;
  const k = kind === "air" ? "jetfuel" : "diesel";
  if ((S.inv[k] || 0) > 0) {
    takeItem(k, 1);
    return true;
  }
  toastOnce(
    `No ${ITEMS[k].name} ${ITEMS[k].icon} - the trip will take 50% longer (Realism Mode).`,
    "warn",
  );
  return false;
}

function specOn(id) {
  return !S.strike && S.workers.some((w) => w.spec === id);
}
function albumAdd(w) {
  const k = w.name + w.face;
  if (!S.album[k])
    S.album[k] = {
      name: w.name,
      face: w.face,
      role: w.role,
      spec: w.spec || null,
      bg: w.bg,
    };
}
const ALBUM_GOALS = [
  { n: 5, gems: 5 },
  { n: 15, gems: 15 },
  { n: 30, gems: 30 },
  { n: 50, gems: 60 },
];
function renderAlbum() {
  const list = Object.values(S.album),
    specs = list.filter((a) => a.spec).length;
  return `<div class="hint">📒 Every worker you hire joins your album. Specialists (rare, need a University) boost the whole town. Collected <b>${list.length}</b> workers, <b>${specs}</b> specialists.</div>
    <div class="album-goals">${ALBUM_GOALS.map((g, i) => `<div class="ag ${list.length >= g.n ? "ok" : ""}">${g.n} workers → 💎${g.gems} ${S.albumClaim[i] ? "✔" : list.length >= g.n ? `<button class="btn orange small" data-act="album-claim" data-i="${i}">Claim</button>` : ""}</div>`).join("")}</div>
    <div class="album">${list.map((a) => `<div class="al-card ${a.spec ? "spec" : ""}"><div class="avatar" style="background:${a.bg || "#eee"}">${a.face}</div><b>${a.name}</b><small>${ROLES[a.role] ? ROLES[a.role].icon + " " + ROLES[a.role].name : ""}</small>${a.spec ? `<small class="spec-tag">${SPECIALISTS[a.spec].icon} ${SPECIALISTS[a.spec].name}</small>` : ""}</div>`).join("") || '<div class="empty-state">Hire workers to fill your album!</div>'}</div>`;
}

function mayor(id) {
  return (S.mayor && S.mayor[id]) || 0;
}
function mayorSpent() {
  let n = 0;
  for (const k in S.mayor) n += S.mayor[k];
  return n;
}
function mayorPoints() {
  return Math.max(0, S.level - 1 - mayorSpent());
}
function branchSpent(b) {
  return MAYOR_TREE[b].perks.reduce((a, p) => a + mayor(p.id), 0);
}
function buyMayor(branch, i) {
  const p = MAYOR_TREE[branch].perks[i];
  if (mayor(p.id) >= p.max) return;
  if (mayorPoints() < 1) {
    toastOnce("No perk points left - you get 1 every level.", "warn");
    return;
  }
  if (branchSpent(branch) < i) {
    toastOnce(
      `Spend ${i} point${i > 1 ? "s" : ""} in ${MAYOR_TREE[branch].name} first.`,
      "warn",
    );
    return;
  }
  S.mayor[p.id] = mayor(p.id) + 1;
  sfx("ach");
  recalcPop();
  renderPanel(true);
}
function respecMayor() {
  if (!mayorSpent()) return;
  dialog({
    title: "Reset Mayor perks?",
    body: "All your perk points will be refunded so you can choose again.",
    yes: "Reset · 💎20",
    cls: "purple",
    onYes: () => {
      if (spendGems(20)) {
        S.mayor = {};
        renderPanel(true);
      }
    },
  });
}
function renderMayor() {
  return `<div class="hint">🌟 You earn <b>1 perk point per level</b>. Points available: <b>${mayorPoints()}</b>. Each row unlocks after spending that many points in the branch. <button class="btn purple small" data-act="mayor-respec">Respec · 💎20</button></div>
    <div class="tree">${Object.entries(MAYOR_TREE)
      .map(
        ([bk, b]) =>
          `<div class="branch"><div class="br-head">${b.icon} ${b.name} <small>${branchSpent(bk)} pts</small></div>${b.perks
            .map((p, i) => {
              const r = mayor(p.id),
                locked = branchSpent(bk) < i,
                max = r >= p.max;
              return `<button class="perk-node ${locked ? "locked" : ""} ${r ? "has" : ""} ${max ? "max" : ""}" data-act="mayor-buy" data-b="${bk}" data-i="${i}" ${locked || max ? "disabled" : ""}><span class="pn-ic">${locked ? "🔒" : p.icon}</span><span class="pn-main"><b>${p.name}</b><small>${p.desc}</small></span><span class="pn-r">${r}/${p.max}</span></button>`;
            })
            .join("")}</div>`,
      )
      .join("")}</div>`;
}

function reqStep(q) {
  return S.req[q.id] || 0;
}
function reqStepDone(st) {
  if (st.items)
    return Object.entries(st.items).every(([k, n]) => (S.inv[k] || 0) >= n);
  if (st.build) {
    const e = hasType(st.build);
    return !!e && !e.build;
  }
  if (st.count)
    return Object.entries(st.count).every(
      ([t, n]) => [...entsOf(t)].filter((e) => !e.build).length >= n,
    );
  if (st.coins) return S.coins >= st.coins;
  if (st.stat)
    return Object.entries(st.stat).every(([k, n]) => (S.stats[k] || 0) >= n);
  return true;
}
function advanceRequest(id) {
  const q = REQUESTS.find((x) => x.id === id);
  if (!q) return;
  const i = reqStep(q),
    st = q.steps[i];
  if (!st) return;
  if (!reqStepDone(st)) {
    toastOnce("Not done yet!", "warn");
    sfx("error");
    return;
  }
  if (st.items) for (const k in st.items) takeItem(k, st.items[k]);
  if (st.coins) spend(st.coins);
  S.req[id] = i + 1;
  addXP(15 + i * 10);
  sfx("ach");
  if (S.req[id] >= q.steps.length) {
    const r = Object.assign({}, q.reward);
    const decor = r.decor;
    delete r.decor;
    giveReward(r, `${q.who}'s story complete`);
    if (decor) S.decorBag[decor] = (S.decorBag[decor] || 0) + 1;
  } else
    toast(
      `${q.face} ${q.who}: Thank you! Next: ${q.steps[i + 1].text}`,
      "good",
    );
  renderPanel(true);
}
function renderRequests() {
  const avail = REQUESTS.filter((q) => S.level >= q.level);
  const locked = REQUESTS.filter((q) => S.level < q.level);
  return `<div class="hint">📖 Story requests from your residents. Finish each chain for gems, coins and unique rewards.</div><div class="orders">${avail
    .map((q) => {
      const i = reqStep(q),
        done = i >= q.steps.length,
        st = q.steps[i];
      const desc = done ? "Story complete!" : st.text;
      const need = done
        ? ""
        : st.items
          ? Object.entries(st.items)
              .map(
                ([k, n]) =>
                  `<div class="o-item ${(S.inv[k] || 0) >= n ? "ok" : ""}"><span class="ic">${ITEMS[k].icon}</span><span class="cnt">${Math.min(S.inv[k] || 0, n)}/${n}</span></div>`,
              )
              .join("")
          : st.build
            ? `<div class="o-item ${reqStepDone(st) ? "ok" : ""}">${BUILD[st.build].icon} ${BUILD[st.build].name}</div>`
            : st.count
              ? Object.entries(st.count)
                  .map(
                    ([t, n]) =>
                      `<div class="o-item ${[...entsOf(t)].length >= n ? "ok" : ""}">${BUILD[t].icon} ${[...entsOf(t)].length}/${n}</div>`,
                  )
                  .join("")
              : st.coins
                ? `<div class="o-item ${S.coins >= st.coins ? "ok" : ""}">🪙 ${fmt(st.coins)}</div>`
                : st.stat
                  ? Object.entries(st.stat)
                      .map(
                        ([k, n]) =>
                          `<div class="o-item ${(S.stats[k] || 0) >= n ? "ok" : ""}">${k} ${Math.min(S.stats[k] || 0, n)}/${n}</div>`,
                      )
                      .join("")
                  : "";
      return `<div class="order ${done ? "done-q" : reqStepDone(st) ? "ready" : ""}"><div class="o-head"><div class="avatar" style="background:#e1f5fe">${q.face}</div><div><div class="o-name">${q.who}</div><div class="o-sub">Chapter ${Math.min(i + 1, q.steps.length)}/${q.steps.length}</div></div></div>
      <div class="q-text">“${desc}”</div><div class="o-items">${need}</div>
      <div class="o-reward"><span>🏁 ${q.reward.gems ? "💎" + q.reward.gems : ""} ${q.reward.coins ? "🪙" + fmt(q.reward.coins) : ""} ${q.reward.decor ? BUILD[q.reward.decor].icon : ""}</span></div>
      ${done ? '<div class="claimed">✔ Complete</div>' : `<div class="o-btns"><button class="btn ${reqStepDone(st) ? "green" : "disabled"}" data-act="req-go" data-id="${q.id}">${st.items || st.coins ? "Hand over" : "Done!"}</button></div>`}</div>`;
    })
    .join(
      "",
    )}${locked.map((q) => `<div class="order empty"><div class="wait-ic">${q.face}</div><div>${q.who}<br><small>🔒 Level ${q.level}</small></div></div>`).join("")}</div>`;
}

const TRAIN_TYPES = [
  { name: "Steam Engine", icon: "🚂", mult: 1, level: 1 },
  {
    name: "Diesel Locomotive",
    icon: "🚆",
    mult: 0.85,
    level: 18,
    cost: { coins: 8000, steel: 4 },
  },
  {
    name: "Electric Train",
    icon: "🚄",
    mult: 0.7,
    level: 28,
    cost: { coins: 20000, steel: 8, glass: 6 },
    power: true,
  },
  {
    name: "Bullet Train",
    icon: "🚅",
    mult: 0.55,
    level: 38,
    cost: { coins: 50000, steel: 15, ironbar: 10 },
    power: true,
  },
];
function signalBonus() {
  let n = 0;
  for (const s of entsOf("signal")) {
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (isRail(s.x + dx, s.y + dy)) {
          near = true;
          break;
        }
    if (near) n++;
  }
  return Math.min(5, n) * 0.03;
}
function costOK(c) {
  for (const k in c) {
    if (k === "coins") {
      if (S.coins < c[k]) return false;
    } else if ((S.inv[k] || 0) < c[k]) return false;
  }
  return true;
}
function payCost(c) {
  for (const k in c)
    if (k === "coins") S.coins -= c[k];
    else takeItem(k, c[k]);
}
function costHTML(c) {
  return Object.entries(c)
    .map(([k, n]) => (k === "coins" ? `🪙${fmt(n)}` : `${ITEMS[k].icon}${n}`))
    .join(" ");
}
function upgradeTrain() {
  const nx = TRAIN_TYPES[(S.rail.type || 0) + 1];
  if (!nx) return;
  if (S.level < nx.level) {
    toastOnce(`🔒 Level ${nx.level}`, "warn");
    return;
  }
  if (!costOK(nx.cost)) {
    toastOnce(`Need ${costHTML(nx.cost)}`, "warn");
    sfx("error");
    return;
  }
  payCost(nx.cost);
  S.rail.type = (S.rail.type || 0) + 1;
  sfx("level");
  toast(`${nx.icon} Upgraded to ${nx.name}!`, "good");
  renderPanel(true);
}
function railPassenger(ti) {
  const t = S.rail.trains[ti];
  if (!t || t.st !== "docked") return;
  for (let i = 0; i < t.cars.length; i++)
    if (!t.cars[i].got) railCollect(ti, i, true);
  const coins = Math.round(40 + CITY.tourists * 6 + POP * 0.2);
  addCoins(coins);
  S.stats.tourism += coins;
  addXP(10);
  t.st = "departing";
  t.t0 = NOW;
  t.cars = [];
  t.nr = Math.max(1, t.nr || 1);
  t.fuel = useFuel("rail");
  S.stats.trains++;
  sfx("expand");
  toast(
    `🚃 Passenger service departed! Tickets earned 🪙${fmt(coins)}`,
    "good",
  );
  renderPanel(true);
}

const SHIP_TYPES = {
  cargo: { name: "Cargo Ship", icon: "🚢", level: 1 },
  ferry: {
    name: "Ferry",
    icon: "⛴️",
    level: 22,
    cost: { coins: 8000, planks: 10, glass: 4 },
  },
  container: {
    name: "Container Ship",
    icon: "🛳️",
    level: 30,
    cost: { coins: 15000, steel: 6 },
    cargo: 1.6,
  },
  tanker: {
    name: "Tanker",
    icon: "🛢️",
    level: 34,
    cost: { coins: 20000, steel: 8 },
    oil: 2,
  },
};
function berthCount() {
  let n = 0;
  for (const e of entsOf("berth")) if (!e.build) n++;
  return n;
}
function refitShip(si, type) {
  const s = S.sea.ships[si],
    T2 = SHIP_TYPES[type];
  if (!s || s.st !== "docked" || !T2) return;
  if (!hasType("shipyard") || hasType("shipyard").build) {
    toast("Build a Shipyard to refit ships.");
    return;
  }
  if (S.level < T2.level) {
    toastOnce(`🔒 Level ${T2.level}`, "warn");
    return;
  }
  if (T2.cost && !costOK(T2.cost)) {
    toastOnce(`Need ${costHTML(T2.cost)}`, "warn");
    sfx("error");
    return;
  }
  if (T2.cost) payCost(T2.cost);
  s.type = type;
  sfx("build");
  toast(`${T2.icon} Ship refitted as a ${T2.name}!`, "good");
  renderPanel(true);
}
function ferryRun(si) {
  const s = S.sea.ships[si];
  if (!s || s.st !== "docked") return;
  if (!seaUnload(si, true)) return;
  const coins = Math.round(60 + CITY.tourists * 8);
  addCoins(coins);
  S.stats.tourism += coins;
  addXP(12);
  s.dest = "ferry";
  s.st = "departing";
  s.t0 = NOW;
  s.ret = NOW + ANIM_MS + 60000;
  s.fuel = useFuel("sea");
  sfx("expand");
  toast(`⛴️ Ferry departed with tourists! 🪙${fmt(coins)}`, "good");
  renderPanel(true);
}

function passengerFlight(pi) {
  const p = S.air.planes[pi];
  if (!p || p.st !== "docked") return;
  if (!hasType("terminal") || hasType("terminal").build) {
    toast("Build a Passenger Terminal first.");
    return;
  }
  const coins = Math.round(300 + CITY.tourists * 15);
  addCoins(coins);
  S.stats.tourism += coins;
  addXP(25);
  p.st = "departing";
  p.t0 = NOW;
  p.crates = [];
  p.fuel = useFuel("air");
  sfx("expand");
  toast(`🛫 Passenger flight departed! 🪙${fmt(coins)} in tickets`, "good");
  renderPanel(true);
}

function expressTick() {
  const pad = hasType("helipad");
  if (!pad || pad.build) return;
  S.express = (S.express || []).filter((o) => o.until > NOW);
  if (S.express.length < 3 && NOW >= (S.expressNext || 0)) {
    const [k, n0] = needItemFor(0.6),
      n = Math.max(1, n0);
    S.express.push({
      id: S.orderSeq++,
      k,
      n,
      coins: Math.round(priceOf(k) * n * 2.2),
      gem: Math.random() < 0.35 ? 1 : 0,
      until: NOW + 240000,
    });
    S.expressNext = NOW + 60000;
  }
}
function deliverExpress(id) {
  const o = (S.express || []).find((x) => x.id === id);
  if (!o) return;
  if ((S.inv[o.k] || 0) < o.n) {
    toastOnce(`Need ${o.n} ${ITEMS[o.k].icon}`, "warn");
    sfx("error");
    return;
  }
  takeItem(o.k, o.n);
  addCoins(o.coins);
  if (o.gem) S.gems += o.gem;
  addXP(8);
  S.stats.served++;
  S.express = S.express.filter((x) => x !== o);
  S.heliFly = NOW;
  sfx("coin");
  toast(
    `🚁 Express delivery! +🪙${fmt(o.coins)}${o.gem ? " 💎1" : ""}`,
    "good",
  );
  renderPanel(true);
}
function renderExpress() {
  const pad = hasType("helipad");
  if (!pad || pad.build) return lockedHub("helipad");
  return `<div class="hint">🚁 Small, urgent orders flown out by helicopter. They expire quickly but pay double - sometimes with a gem!</div><div class="orders">${
    (S.express || [])
      .map(
        (
          o,
        ) => `<div class="order ${(S.inv[o.k] || 0) >= o.n ? "ready" : ""}"><div class="o-head"><div class="avatar" style="background:#e3f2fd">🚁</div><div><div class="o-name">Express #${o.id}</div><div class="o-sub">Expires in <b class="live-t" data-t="${o.until}">…</b></div></div></div>
    <div class="o-items"><div class="o-item ${(S.inv[o.k] || 0) >= o.n ? "ok" : ""}"><span class="ic">${ITEMS[o.k].icon}</span><span class="cnt">${Math.min(S.inv[o.k] || 0, o.n)}/${o.n}</span></div></div>
    <div class="o-reward"><span>🪙 ${fmt(o.coins)}</span>${o.gem ? "<span>💎 1</span>" : ""}</div><div class="o-btns"><button class="btn ${(S.inv[o.k] || 0) >= o.n ? "green" : "disabled"}" data-act="exp-deliver" data-id="${o.id}">Fly it!</button></div></div>`,
      )
      .join("") || '<div class="empty-state">⏳ Next express order soon…</div>'
  }</div>`;
}

const EXCHANGE_GOODS = [
  "radio",
  "necklace",
  "ring",
  "toycar",
  "perfume",
  "carkit",
  "handbag",
  "chocolate",
  "bonbons",
  "sweater",
  "sofa",
  "wine",
  "book",
  "teddy",
];
function exchangeTick() {
  if (!S.xch || NOW - S.xch.t > 300000) {
    const old = (S.xch && S.xch.m) || {},
      m = {};
    for (const k of EXCHANGE_GOODS)
      m[k] = clamp((old[k] || 1.4) + rand(-0.35, 0.35), 0.9, 2.6);
    S.xch = { t: NOW, m };
  }
}
function exchangeSell(k, all) {
  const n = all ? S.inv[k] || 0 : Math.min(1, S.inv[k] || 0);
  if (!n) return;
  const price = Math.round(ITEMS[k].price * S.xch.m[k]);
  takeItem(k, n);
  addCoins(price * n);
  addXP(Math.round(ITEMS[k].xp * n * 0.5));
  sfx("coin");
  renderPanel(true);
}
function renderExchange() {
  const ex = hasType("exchange");
  if (!ex || ex.build) return lockedHub("exchange");
  exchangeTick();
  return `<div class="hint">🌐 World prices for luxury goods change every 5 minutes. Sell when the multiplier is high! Next update in <b class="live-t" data-t="${S.xch.t + 300000}">…</b></div><div class="cards">${EXCHANGE_GOODS.map(
    (k) => {
      const m = S.xch.m[k],
        n = S.inv[k] || 0;
      return `<div class="card ${n ? "" : "dim"}"><div class="big-ic">${ITEMS[k].icon}</div><div class="card-name">${ITEMS[k].name}</div><div class="card-stats"><span class="chip ${m >= 1.6 ? "on" : ""}">×${m.toFixed(2)}</span><span class="chip">🪙${fmt(Math.round(ITEMS[k].price * m))}</span><span class="chip">have ${n}</span></div>
      <div class="btnrow"><button class="btn ${n ? "green" : "disabled"}" data-act="xch-sell" data-id="${k}">Sell 1</button><button class="btn ${n ? "orange" : "disabled"}" data-act="xch-sell" data-id="${k}" data-all="1">All</button></div></div>`;
    },
  ).join("")}</div>`;
}

function seasonalNow() {
  const d = new Date(),
    m = d.getMonth(),
    day = d.getDate();
  return (
    SEASONAL_EVENTS.find((e) => e.m === m && day >= e.d0 && day <= e.d1) || null
  );
}
function renderCalendar() {
  const now = seasonalNow(),
    months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
  return `<div class="hint">📆 Seasonal events follow the real calendar. While one is active you earn <b>double 🎟️ tokens</b> and can buy its exclusive decoration in the Weekly Event shop.</div>
    <div class="ach-list">${SEASONAL_EVENTS.map((e) => `<div class="ach ${now === e ? "ready" : ""}"><div class="ach-ic">${e.icon}</div><div class="ach-main"><div class="ach-name">${e.name}</div><div class="ach-desc">${months[e.m]} ${e.d0} – ${months[e.m]} ${e.d1} · exclusive: ${BUILD[e.decor].icon} ${BUILD[e.decor].name}</div></div><div class="ach-side">${now === e ? '<b class="claimed">ACTIVE NOW</b>' : ""}</div></div>`).join("")}</div>`;
}

function coopTick() {
  const week = Math.floor(Date.now() / (7 * 86400000));
  if (!S.coop || S.coop.week !== week) {
    if (S.coop && S.coop.week !== week) {
      const rank = coopRanking().findIndex((r) => r.me) + 1;
      const r = [
        null,
        { gems: 30, booster: 2 },
        { gems: 20, booster: 1 },
        { gems: 12 },
        { gems: 6 },
        { gems: 3 },
      ][rank] || { gems: 2 };
      giveReward(r, `Last week's regatta: you finished #${rank}`);
    }
    const pool = REGATTA_TASKS.slice(),
      tasks = [];
    while (tasks.length < 5 && pool.length) {
      const t = pool.splice(randi(pool.length), 1)[0];
      const goal = Math.round(t.base * (1 + S.level / 15));
      tasks.push({
        stat: t.stat,
        name: t.name.replace("{n}", goal),
        goal,
        base: S.stats[t.stat] || 0,
        pts: t.pts,
        done: false,
      });
    }
    S.coop = { week, team: COOP_TEAMS[0], tasks, pts: 0, start: Date.now() };
  }
}
function coopRanking() {
  const hours = (Date.now() - S.coop.start) / 3600000;
  const rivals = COOP_TEAMS.slice(1).map((n, i) => ({
    name: n,
    pts: Math.round(hours * (6 + i * 3) + Math.sin(hours + i) * 10 + i * 20),
  }));
  const myTeam = Math.round(S.coop.pts + hours * 4);
  return rivals
    .concat([{ name: S.coop.team + " (your team)", pts: myTeam, me: true }])
    .sort((a, b) => b.pts - a.pts);
}
function claimCoopTask(i) {
  const t = S.coop.tasks[i];
  if (!t || t.done || (S.stats[t.stat] || 0) - t.base < t.goal) return;
  t.done = true;
  S.coop.pts += t.pts;
  sfx("ach");
  toast(`⛵ Regatta task done! +${t.pts} points for your team`, "good");
  renderPanel(true);
}
function renderCoop() {
  const rk = coopRanking();
  return `<div class="hint">⛵ <b>Weekly Regatta</b> - you sail with AI teammates in <b>${S.coop.team}</b>. Finish tasks to push your yacht ahead. Rewards are paid when the week ends.</div>
    <div class="regatta">${rk.map((r, i) => `<div class="lane ${r.me ? "me" : ""}"><span class="rank">#${i + 1}</span><span class="lane-name">${r.name}</span><div class="lane-track"><span class="yacht" style="left:${Math.min(92, (r.pts / Math.max(1, rk[0].pts)) * 92)}%">⛵</span></div><b>${r.pts}</b></div>`).join("")}</div>
    <div class="ach-list">${S.coop.tasks
      .map((t, i) => {
        const p = Math.min(t.goal, (S.stats[t.stat] || 0) - t.base);
        return `<div class="ach ${t.done ? "done" : p >= t.goal ? "ready" : ""}"><div class="ach-ic">🏁</div><div class="ach-main"><div class="ach-name">${t.name}</div><div class="pbar"><div style="width:${(p / t.goal) * 100}%"></div><span>${p}/${t.goal}</span></div></div><div class="ach-side">${t.done ? '<div class="claimed">✔</div>' : p >= t.goal ? `<button class="btn orange" data-act="coop-claim" data-i="${i}">+${t.pts} pts</button>` : `<div class="reward">${t.pts} pts</div>`}</div></div>`;
      })
      .join("")}</div>`;
}

function simulateOffline(ms) {
  if (!S.workers.length || ms < 60000) return null;
  const cap = (4 + 2 * mayor("m_offline")) * 3600000,
    t = Math.min(ms, cap);
  const got = {};
  let rent = 0;
  const add = (k, n) => {
    if (n > 0) {
      addItem(k, n);
      got[k] = (got[k] || 0) + n;
    }
  };
  for (const w of S.workers) {
    const sp = speedOf(w);
    if (w.role === "farmhand") {
      const c = CROPS[w.cfg.crop];
      if (!c || S.level < c.level) continue;
      const fields = w.cfg.fields
        .map((id) => world.ents.get(id))
        .filter(Boolean);
      const cycles = Math.max(0, Math.floor(t / (c.time + 1500 / sp)) - 1);
      let n = cycles * fields.length;
      const seedsAvail =
        (S.seeds[w.cfg.crop] || 0) +
        (w.cfg.auto ? Math.floor(S.coins / c.seed) : 0);
      n = Math.min(
        n,
        seedsAvail,
        Math.floor(spaceFor(w.cfg.crop) / CROP_YIELD),
      );
      if (n <= 0) continue;
      const fromBag = Math.min(n, S.seeds[w.cfg.crop] || 0);
      S.seeds[w.cfg.crop] -= fromBag;
      S.coins -= (n - fromBag) * c.seed;
      add(w.cfg.crop, n * CROP_YIELD);
      S.stats.harvested += n * CROP_YIELD;
      S.stats.planted += n;
    } else if (w.role === "rancher") {
      for (const tp of ANIMAL_TYPES)
        for (const e of entsOf(tp)) {
          const b = BUILD[e.t],
            cycles = Math.max(0, Math.floor(t / b.time) - 1);
          const n = Math.min(
            cycles * e.an.length,
            S.inv[b.feed] || 0,
            spaceFor(b.out),
          );
          if (n > 0) {
            takeItem(b.feed, n);
            add(b.out, n);
            S.stats.animalProducts += n;
          }
        }
    } else if (w.role === "rentcollector") {
      for (const tp of HOUSE_TYPES)
        for (const e of entsOf(tp)) {
          if (e.build) continue;
          const n = Math.max(0, Math.floor(t / BUILD[e.t].rentTime) - 1);
          if (n) {
            const c = rentOf(e) * n;
            S.coins += c;
            rent += c;
            S.stats.rent += n;
          }
        }
    } else if (w.role === "manager") {
      const f = world.ents.get(w.cfg.fid);
      if (!f) continue;
      for (const r of BUILD[f.t].recipes) {
        const tgt = w.cfg.targets[r] || 0;
        if (!tgt || S.level < RECIPES[r].level) continue;
        const R = RECIPES[r],
          q = R.qty || 1,
          item = R.out || r;
        let n = Math.floor(
          t / jobDur(f, r) / Math.max(1, BUILD[f.t].recipes.length),
        );
        n = Math.min(n, Math.ceil(Math.max(0, tgt - (S.inv[item] || 0)) / q));
        for (const k in R.in)
          n = Math.min(n, Math.floor((S.inv[k] || 0) / R.in[k]));
        n = Math.min(n, Math.floor(spaceFor(item) / q));
        if (n > 0) {
          for (const k in R.in) takeItem(k, R.in[k] * n);
          add(item, n * q);
          S.stats.crafted += n * q;
        }
      }
    }
  }
  const wages = Math.min(S.coins, Math.round((payroll() * t) / 60000));
  S.coins -= wages;
  S.stats.wagesPaid += wages;
  return { t, got, rent, wages };
}

const editSel = new Set();
function enterEdit() {
  closePanel(true);
  hidePopup();
  cancelMode(true);
  mode = { type: "edit" };
  editSel.clear();
  updateEditBanner();
}
function updateEditBanner() {
  if (mode.type !== "edit") return;
  setBanner(`<span class="mb-ic">✏️</span><span><b>Edit mode</b> · ${editSel.size} selected - tap buildings to select</span>
    <button class="btn small blue" data-act="ed-move" ${editSel.size ? "" : "disabled"}>✋ Move</button><button class="btn small green" data-act="ed-copy" ${editSel.size ? "" : "disabled"}>📋 Copy</button>
    <button class="btn small orange" data-act="ed-store" ${editSel.size ? "" : "disabled"}>📦 Store</button><button class="btn small purple" data-act="ed-flip" ${editSel.size ? "" : "disabled"} title="Rotate (R)">🔄 Rotate</button>
    <button class="btn small red" data-act="ed-sell" ${editSel.size ? "" : "disabled"}>Sell</button><button class="btn small" data-act="cancel">Done</button>`);
}
function editToggle(e) {
  if (!e || BUILD[e.t].nature || e.t === "bridge" || e.build) return;
  if (editSel.has(e.id)) editSel.delete(e.id);
  else editSel.add(e.id);
  sfx("click");
  updateEditBanner();
}
function selEnts() {
  return [...editSel].map((id) => world.ents.get(id)).filter(Boolean);
}
function startGroup(copy) {
  const es = selEnts();
  if (!es.length) return;
  const ax = Math.min(...es.map((e) => e.x)),
    ay = Math.min(...es.map((e) => e.y));
  const members = es.map((e) => ({ e, dx: e.x - ax, dy: e.y - ay }));
  if (!copy)
    for (const m of members) {
      setOcc(m.e, -1);
      m.e.moving = true;
      m.ox = m.e.x;
      m.oy = m.e.y;
    }
  worldChanged();
  mode = { type: "group", members, copy };
  setBanner(
    `<span class="mb-ic">${copy ? "📋" : "✋"}</span><span>${copy ? "Paste" : "Move"} <b>${members.length}</b> building${members.length > 1 ? "s" : ""} - tap a spot${copy ? ` · cost 🪙${fmt(groupCost(members))}` : ""}</span><button class="btn small red" data-act="cancel">Cancel</button>`,
  );
}
function groupCost(members) {
  return members.reduce(
    (a, m) =>
      a +
      (BUILD[m.e.t].special ||
      BUILD[m.e.t].cat === "event" ||
      BUILD[m.e.t].cat === "unique"
        ? 0
        : buildCost(m.e.t)),
    0,
  );
}
function groupOK(ax, ay) {
  return (
    mode.members.every((m) =>
      placeOK(m.e.t, ax + m.dx, ay + m.dy, -1, m.e.w, m.e.h),
    ) && noOverlap(ax, ay)
  );
}
function noOverlap(ax, ay) {
  const seen = new Set();
  for (const m of mode.members)
    for (let j = 0; j < m.e.h; j++)
      for (let i = 0; i < m.e.w; i++) {
        const k = ax + m.dx + i + "," + (ay + m.dy + j);
        if (seen.has(k)) return false;
        seen.add(k);
      }
  return true;
}
function placeGroup() {
  if (!hoverTile) return;
  const [ax, ay] = hoverTile;
  if (!groupOK(ax, ay)) {
    sfx("error");
    toastOnce("Can't place the group there.", "warn");
    return;
  }
  if (mode.copy) {
    const copyable = mode.members.filter(
      (m) =>
        !BUILD[m.e.t].special &&
        !BUILD[m.e.t].max &&
        BUILD[m.e.t].cat !== "event" &&
        BUILD[m.e.t].cat !== "unique",
    );
    if (!spend(groupCost(copyable))) return;
    for (const m of copyable) {
      const e = addEnt(
        newEntity(m.e.t, ax + m.dx, ay + m.dy, {
          v: m.e.v,
          flip: m.e.flip,
          w: m.e.w,
          h: m.e.h,
        }),
      );
      e.born = NOW;
      if (BUILD[e.t].produce) e.pp = NOW;
      if (BUILD[e.t].orchard) orchardInit(e);
      if (needsBuild(e.t)) startConstruction(e);
    }
    toast(
      `📋 Pasted ${copyable.length} building${copyable.length > 1 ? "s" : ""}`,
      "good",
    );
  } else {
    for (const m of mode.members) {
      m.e.x = ax + m.dx;
      m.e.y = ay + m.dy;
      m.e.moving = false;
      setOcc(m.e, m.e.id);
      m.e.born = NOW;
    }
  }
  sfx("build");
  worldChanged();
  recalcPop();
  mode = { type: null };
  hideBanner();
  editSel.clear();
}
function cancelGroup() {
  if (mode.type !== "group" || mode.copy) return;
  for (const m of mode.members) {
    m.e.x = m.ox;
    m.e.y = m.oy;
    m.e.moving = false;
    setOcc(m.e, m.e.id);
  }
  worldChanged();
}
function storeable(e) {
  const b = BUILD[e.t];
  return ["deco", "event", "unique"].includes(b.cat) && !b.flat;
}
function storeSelected() {
  let n = 0;
  for (const e of selEnts())
    if (storeable(e)) {
      S.decorBag[e.t] = (S.decorBag[e.t] || 0) + 1;
      removeEnt(e);
      n++;
    }
  editSel.clear();
  toast(
    n
      ? `📦 Stored ${n} decoration${n > 1 ? "s" : ""} - place them again from Store → Decor for free.`
      : "Only decorations can be stored.",
    n ? "good" : "warn",
  );
  updateEditBanner();
}
function flipSelected() {
  let blocked = 0;
  for (const e of selEnts()) {
    if (!canRotate(e.t)) continue;
    if (e.w === e.h) {
      e.flip = !e.flip;
      continue;
    }
    setOcc(e, -1);
    if (placeOK(e.t, e.x, e.y, -1, e.h, e.w)) {
      const w = e.w;
      e.w = e.h;
      e.h = w;
      e.flip = !e.flip;
    } else blocked++;
    setOcc(e, e.id);
  }
  worldChanged();
  sfx("click");
  if (blocked)
    toastOnce(
      `${blocked} building${blocked > 1 ? "s" : ""} had no room to rotate.`,
      "warn",
    );
}
function sellSelected() {
  const es = selEnts().filter((e) => !BUILD[e.t].special);
  if (!es.length) return;
  const total = es.reduce(
    (a, e) => a + (e.t === "field" ? 5 : refundFor(e.t)),
    0,
  );
  dialog({
    title: `Sell ${es.length} buildings?`,
    body: `You'll get back 🪙${fmt(total)}.`,
    yes: "Sell all",
    cls: "orange",
    onYes: () => {
      for (const e of es) removeEnt(e);
      addCoins(total);
      editSel.clear();
      recalcPop();
      updateEditBanner();
    },
  });
}
function drawEditOverlay() {
  if (mode.type === "edit")
    for (const e of selEnts()) {
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -T * 20;
      poly(diamond(e.x, e.y, e.w, e.h), "rgba(255,230,120,.25)", "#ffd23f", 3);
      ctx.setLineDash([]);
    }
  if (mode.type === "group" && hoverTile) {
    const [ax, ay] = hoverTile,
      ok = groupOK(ax, ay);
    for (const m of mode.members) {
      poly(
        diamond(ax + m.dx, ay + m.dy, m.e.w, m.e.h),
        ok ? "rgba(110,230,90,.4)" : "rgba(240,70,60,.45)",
        ok ? "#e4ffd0" : "#ffd0c8",
        2,
      );
      const g = Object.assign({}, m.e, {
        x: ax + m.dx,
        y: ay + m.dy,
        born: 0,
        moving: false,
      });
      ctx.save();
      ctx.globalAlpha = 0.65;
      THUMB = true;
      if (g.flip) {
        const [fx] = P(g.x + g.w / 2, g.y + g.h / 2);
        ctx.translate(fx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-fx, 0);
      }
      if (FLAT[g.t]) FLAT[g.t](g);
      else {
        const pg = rotProxy(g);
        if (g.t === "field") drawSoil(pg);
        if (DRAW[g.t]) DRAW[g.t](pg);
      }
      THUMB = false;
      ctx.restore();
    }
  }
}

function exportSave() {
  save();
  const blob = new Blob([localStorage.getItem(SAVE_KEY)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `meadowvale-save-${todayStr()}.json`;
  a.click();
  toast("💾 Save file downloaded!", "good");
}
function importSaveText(txt) {
  try {
    if (!txt.trim().startsWith("{"))
      txt = decodeURIComponent(escape(atob(txt.trim())));
    const d = JSON.parse(txt);
    if (!d.S || !d.ents) throw new Error("not a save");
    resetting = true;
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
    location.reload();
  } catch (e) {
    toast("❌ That save file / code is not valid.", "warn");
  }
}
function importSaveFile() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json";
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    f.text().then(importSaveText);
  };
  inp.click();
}
function copyTransferCode() {
  save();
  const code = btoa(
    unescape(encodeURIComponent(localStorage.getItem(SAVE_KEY))),
  );
  (navigator.clipboard
    ? navigator.clipboard.writeText(code)
    : Promise.reject()
  ).then(
    () =>
      toast(
        `📋 Transfer code copied (${Math.round(code.length / 1024)} KB). Paste it on another device.`,
        "good",
      ),
    () =>
      dialog({
        title: "Transfer code",
        body: `<textarea class="code-box" readonly>${code}</textarea>`,
        no: false,
        yes: "Close",
      }),
  );
}
function pasteTransferCode() {
  dialog({
    title: "📥 Load transfer code",
    body: '<textarea id="code-in" class="code-box" placeholder="Paste your transfer code here"></textarea><br><small>This replaces your current town.</small>',
    yes: "Load",
    cls: "orange",
    onYes: () => {
      const el = document.getElementById("code-in");
      if (el) importSaveText(el.value);
    },
  });
  setTimeout(() => {
    const el = document.getElementById("code-in");
    if (el) el.focus();
  }, 50);
}

const SAVE_VERSION = 6;
function migrateSave(d) {
  const S0 = d.S;
  if ((S0.v || 1) < 3) {
    S0.perks = S0.perks || {};
    S0.boost = S0.boost || {};
    S0.bridges = S0.bridges || {};
  }
  if ((S0.v || 1) < 4) {
    S0.gems = S0.gems || 5;
    S0.powers = S0.powers || {};
  }
  if ((S0.v || 1) < 5) {
    S0.mayor = S0.mayor || {};
    S0.req = S0.req || {};
    S0.album = S0.album || {};
    for (const w of S0.workers || []) albumAddRaw(S0, w);
  }
  if ((S0.mapV || 1) < MAP_V) migrateToInfinite(d);
  S0.v = SAVE_VERSION;
  return d;
}

function migrateToInfinite(d) {
  const S0 = d.S,
    OLD = 256;
  d.ents = (d.ents || []).filter((e) => BUILD[e.t] && !BUILD[e.t].nature);
  const th = d.ents.find((e) => e.t === "townhall");
  const c = th ? { x: th.x + 1, y: th.y + 1 } : { x: 124, y: 124 };
  S0.spawn = c;
  S0.genSpawn = c;
  if (d.ents.length) {
    let x0 = 1e9,
      y0 = 1e9,
      x1 = -1e9,
      y1 = -1e9;
    for (const e of d.ents) {
      x0 = Math.min(x0, e.x);
      y0 = Math.min(y0, e.y);
      x1 = Math.max(x1, e.x + e.w);
      y1 = Math.max(y1, e.y + e.h);
    }
    S0.clearBoxes = [{ x0: x0 - 3, y0: y0 - 3, x1: x1 + 3, y1: y1 + 3 }];
  } else S0.clearBoxes = [];
  const te = {};
  for (const k in S0.terrEdits || {}) {
    const i = +k;
    if (isNaN(i)) {
      te[k] = S0.terrEdits[k];
      continue;
    }
    te[(i % OLD) + "," + Math.floor(i / OLD)] = S0.terrEdits[k];
  }
  S0.terrEdits = te;
  S0.natGone = {};
  S0.bridges = {};
  S0.cam = null;
  S0.seedText = S0.seedText || String(S0.seed);
  S0.mapV = MAP_V;
  d.migratedToInfinite = true;
}
function postLoadFixups(d) {
  if (d.migratedToInfinite) {
    S.terrEdits = S.terrEdits || {};
    for (const e of world.ents.values()) {
      if (e.nat || e.t === "bridge" || BUILD[e.t].place === "water") continue;
      for (let y = e.y; y < e.y + e.h; y++)
        for (let x = e.x; x < e.x + e.w; x++)
          if (isWater(x, y)) {
            S.terrEdits[x + "," + y] = T_GRASS;
            setTerr(x, y, T_GRASS);
          }
    }
    setTimeout(
      () =>
        toast(
          "🌍 Your town now sits in an <b>endless world</b> - explore in any direction!",
          "good",
        ),
      1500,
    );
  }
  S.natGone = S.natGone || {};
  S.clearBoxes = S.clearBoxes || [];
  S.biomesSeen = S.biomesSeen || {};
  worldChanged();
}
function albumAddRaw(S0, w) {
  S0.album = S0.album || {};
  const k = w.name + w.face;
  if (!S0.album[k])
    S0.album[k] = {
      name: w.name,
      face: w.face,
      role: w.role,
      spec: w.spec || null,
      bg: w.bg,
    };
}

function endgameTick() {
  realismTick();
  expressTick();
  exchangeTick();
  coopTick();
  for (const t of [
    "orchard_apple",
    "orchard_orange",
    "orchard_cherry",
    "orchard_olive",
    "orchard_coconut",
  ])
    for (const e of entsOf(t)) if (e.hl == null) orchardInit(e);
}

const _rentOf = rentOf;
rentOf = function (e) {
  return Math.max(
    1,
    Math.round(
      _rentOf(e) *
        (1 + 0.05 * mayor("m_rent")) *
        (specOn("accountant") ? 1.05 : 1),
    ),
  );
};
const _jobDur = jobDur;
jobDur = function (e, r) {
  return Math.round(
    _jobDur(e, r) *
      (1 - 0.04 * mayor("m_fspeed")) *
      (1 - 0.04 * engLvl(e.t)) *
      (specOn("chef") ? 0.9 : 1),
  );
};
const _priceOf = priceOf;
priceOf = function (k) {
  return Math.max(1, Math.round(_priceOf(k) * (1 + 0.05 * mayor("m_value"))));
};
const _slotsOf = slotsOf;
slotsOf = function (e) {
  return _slotsOf(e) + mayor("m_slot");
};
const _staffCap = staffCap;
staffCap = function () {
  const c = _staffCap();
  return c ? c + mayor("m_staff") : 0;
};
function vehicleMult() {
  return (1 - 0.05 * mayor("m_vehicle")) * (specOn("logistics") ? 0.9 : 1);
}
const _railTrip = railTrip;
railTrip = function () {
  const tt = TRAIN_TYPES[S.rail.type || 0];
  const m = tt.power && utilRatio("power") < 1 ? 1 : tt.mult;
  return Math.round(_railTrip() * m * (1 - signalBonus()) * vehicleMult());
};
const _voyageTime = voyageTime;
voyageTime = function (d) {
  return Math.round(_voyageTime(d) * vehicleMult());
};
const _flightTime = flightTime;
flightTime = function () {
  return Math.round(_flightTime() * vehicleMult());
};
const _shipCount = shipCount;
shipCount = function () {
  const n = _shipCount();
  return n ? Math.min(4, 1 + berthCount()) : 0;
};
const _buildTimeFor = buildTimeFor;
buildTimeFor = function (t) {
  return Math.round(
    _buildTimeFor(t) *
      (1 - 0.1 * mayor("m_build")) *
      (specOn("engineer") ? 0.8 : 1),
  );
};
const _matsFor = matsFor;
matsFor = function (t) {
  const m = _matsFor(t),
    b = BUILD[t];
  if (b.cat === "wonder")
    Object.assign(m, { cranehook: 1, jackhammer: 1, torch: 1 });
  else if (b.rent && b.level >= 30) m.cranehook = 1;
  return m;
};

const SUPPLIES = [
  { k: "planks", level: 1 },
  { k: "bricks", level: 1 },
  { k: "stake", level: 2 },
  { k: "shovel", level: 4 },
  { k: "glass", level: 8 },
  { k: "deed", level: 10 },
  { k: "pickaxe", level: 12 },
  { k: "steel", level: 18 },
  { k: "dynamite", level: 22 },
  { k: "diesel", level: 29 },
  { k: "jetfuel", level: 30 },
];
function supplyPrice(k) {
  return Math.round(ITEMS[k].price * 2);
}
function buyMaterial(k, n) {
  const s = SUPPLIES.find((x) => x.k === k);
  if (!s) return;
  if (S.level < s.level) {
    toastOnce(`🔒 ${ITEMS[k].name} unlocks at level ${s.level}`, "warn");
    return;
  }
  n = Math.min(n, Math.max(0, spaceFor(k)));
  if (n <= 0) {
    storageFullPrompt();
    return;
  }
  if (!spend(supplyPrice(k) * n)) return;
  addItem(k, n);
  sfx("coin");
  toastOnce(`+${n} ${ITEMS[k].icon} ${ITEMS[k].name}`, "good");
  renderPanel(true);
}
function missingMats(e) {
  const m = {};
  if (!e || !e.build) return m;
  for (const k in e.build.need) {
    const miss = e.build.need[k] - (e.build.have[k] || 0) - (S.inv[k] || 0);
    if (miss > 0) m[k] = miss;
  }
  return m;
}
function missingMatsCost(e) {
  let c = 0;
  const m = missingMats(e);
  for (const k in m) c += supplyPrice(k) * m[k];
  return c;
}
function buyMissingMats(e) {
  const m = missingMats(e),
    cost = missingMatsCost(e);
  if (!cost) {
    deliverMats(e);
    return;
  }
  if (!spend(cost)) return;
  for (const k in m) addItem(k, m[k]);
  deliverMats(e);
}
function renderSupplies() {
  return `<div class="hint">🧱 Building supplies for construction sites, land expansion and the mine. Prices are steep - once you unlock trains 🚂, the Quarry and the Brickworks you can get them much cheaper. Tip: construction sites have a <b>🛒 Buy missing</b> button.</div><div class="cards">${SUPPLIES.map(
    (s) => {
      const it = ITEMS[s.k],
        locked = S.level < s.level,
        p = supplyPrice(s.k);
      return `<div class="card ${locked ? "locked" : ""}"><div class="big-ic">${it.icon}</div><div class="card-name">${it.name}</div><div class="card-desc">You have <b>${S.inv[s.k] || 0}</b></div>
      ${locked ? lockHTML(s.level) : `<div class="btnrow"><button class="btn ${S.coins >= p ? "green" : "disabled"}" data-act="buymat" data-id="${s.k}" data-n="1">+1 · 🪙${fmt(p)}</button><button class="btn ${S.coins >= p * 5 ? "green" : "disabled"}" data-act="buymat" data-id="${s.k}" data-n="5">+5 · 🪙${fmt(p * 5)}</button></div>`}</div>`;
    },
  ).join("")}</div>`;
}

const pickCanvas = document.createElement("canvas");
pickCanvas.width = pickCanvas.height = 1;
const pickCtx = pickCanvas.getContext("2d", { willReadFrequently: true });
function paintsPixel(e, wx, wy) {
  const d = DRAW[e.t];
  if (!d) return false;
  const prev = ctx,
    prevT = THUMB;
  pickCtx.setTransform(1, 0, 0, 1, 0, 0);
  pickCtx.clearRect(0, 0, 1, 1);
  pickCtx.setTransform(cam.z, 0, 0, cam.z, -wx * cam.z, -wy * cam.z);
  ctx = pickCtx;
  THUMB = true;
  try {
    if (e.build) drawConstruction(e);
    else if (e.flip) {
      const [fx] = P(e.x + e.w / 2, e.y + e.h / 2);
      ctx.translate(fx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-fx, 0);
      d(rotProxy(e));
    } else d(e);
  } catch (err) {}
  ctx = prev;
  THUMB = prevT;
  return pickCtx.getImageData(0, 0, 1, 1).data[3] > 110;
}
pickEntity = function (sx, sy) {
  const [wx, wy] = screenToWorld(sx, sy);
  const vr = visibleRange();
  const cands = [];
  for (const e of visibleEnts(vr)) {
    if (e.moving || e.dying || FLAT[e.t]) continue;
    const b = BUILD[e.t];

    const l = P(e.x, e.y + e.h)[0],
      r = P(e.x + e.w, e.y)[0],
      bot = P(e.x + e.w, e.y + e.h)[1],
      top = P(e.x, e.y)[1] - (b.ht || 20) - 40;
    if (wx < l - 12 || wx > r + 12 || wy < top || wy > bot + 4) continue;
    cands.push(e);
  }
  cands.sort((a, b) => depthOf(b) - depthOf(a));
  for (const e of cands) if (paintsPixel(e, wx, wy)) return e;

  const [tx, ty] = screenToTile(sx, sy);
  return entAt(tx, ty);
};

function enterClearMode() {
  closePanel(true);
  hidePopup();
  cancelMode(true);
  mode = { type: "clear", a: null, b: null };
  setBanner(
    '<span class="mb-ic">🪓</span><span><b>Clear an area</b> - drag over your land to select trees, rocks & bushes</span><button class="btn small red" data-act="cancel">Done</button>',
  );
}
function clearRect() {
  if (!mode.a || !mode.b) return null;
  return {
    x0: Math.min(mode.a[0], mode.b[0]),
    y0: Math.min(mode.a[1], mode.b[1]),
    x1: Math.max(mode.a[0], mode.b[0]),
    y1: Math.max(mode.a[1], mode.b[1]),
  };
}
function clearTargets() {
  const r = clearRect();
  if (!r) return [];
  const out = [];
  for (let y = r.y0; y <= r.y1; y++)
    for (let x = r.x0; x <= r.x1; x++) {
      if (!isUnlocked(x, y)) continue;
      const e = entAt(x, y);
      if (e && BUILD[e.t].nature && !e.dying) out.push(e);
    }
  return out;
}
function clearSummary(list) {
  const c = { tree: 0, rock: 0, bush: 0 };
  let cost = 0;
  for (const e of list) {
    c[e.t]++;
    cost += BUILD[e.t].clear;
  }
  return { c, cost };
}
function updateClearBanner() {
  if (mode.type !== "clear") return;
  const list = clearTargets(),
    { c, cost } = clearSummary(list);
  setBanner(
    `<span class="mb-ic">🪓</span><span>${list.length ? `<b>${list.length}</b> selected: 🌳${c.tree} 🪨${c.rock} 🌿${c.bush} · 🪙${fmt(cost)}` : "<b>Clear an area</b> - drag over your land"}</span><button class="btn small red" data-act="cancel">Done</button>`,
  );
}
function finishClearSelect() {
  const list = clearTargets();
  if (!list.length) {
    toastOnce(
      "Nothing to clear there - drag over trees, rocks or bushes on land you own.",
      "info",
    );
    mode.a = mode.b = null;
    updateClearBanner();
    return;
  }
  const { c, cost } = clearSummary(list);

  const sorted = list
    .slice()
    .sort((a, b) => BUILD[a.t].clear - BUILD[b.t].clear);
  let afford = 0,
    sum = 0;
  for (const e of sorted) {
    if (sum + BUILD[e.t].clear > S.coins) break;
    sum += BUILD[e.t].clear;
    afford++;
  }
  if (!afford) {
    toastOnce("Not enough coins to clear anything here! 🪙", "warn");
    sfx("error");
    mode.a = mode.b = null;
    updateClearBanner();
    return;
  }
  dialog({
    title: "🪓 Clear this area?",
    body: `<div class="dlg-chips"><span class="chip">🌳 ${c.tree} trees</span><span class="chip">🪨 ${c.rock} rocks</span><span class="chip">🌿 ${c.bush} bushes</span></div>
      ${afford < list.length ? `<div class="dlg-warn">You can afford ${afford} of ${list.length} - the cheapest will be cleared first.</div>` : ""}
      You'll get planks, stone and XP.`,
    yes: `Clear ${afford} · 🪙${fmt(sum)}`,
    cls: "green",
    onYes: () => clearMany(sorted.slice(0, afford), sum),
  });
  dlgNo = () => {
    mode.a = mode.b = null;
    updateClearBanner();
  };
}
function clearMany(list, cost) {
  if (!spend(cost)) return;
  let xp = 0;
  const drops = {};
  list.forEach((e, i) => {
    const b = BUILD[e.t];
    e.dying = NOW + 150 + i * 25;
    setOcc(e, -1);
    S.stats.cleared++;
    xp += b.xp;
    const drop = e.t === "tree" ? "planks" : e.t === "rock" ? "stone" : null;
    if (drop && spaceFor(drop) > 0) {
      const n = 1 + randi(2);
      addItem(drop, n);
      drops[drop] = (drops[drop] || 0) + n;
    }
    if (Math.random() < 0.04) gainArtifact(pickArtifact("farming"));
    if (i < 40) {
      const p = entWorld(e, 18);
      burst(
        p[0],
        p[1],
        6,
        e.t === "rock"
          ? ["#9ba1a7", "#c9ced2"]
          : ["#4b9a38", "#88cf5e", "#7a4f2c"],
        e.t === "rock" ? "dot" : "leaf",
        60,
      );
    }
  });
  worldChanged();
  addXP(xp);
  sfx("chop");
  setTimeout(() => sfx("chop"), 160);
  toast(
    `🪓 Cleared ${list.length}! +${xp}⭐ ${Object.entries(drops)
      .map(([k, n]) => `${n}${ITEMS[k].icon}`)
      .join(" ")}`,
    "good",
  );
  mode.a = mode.b = null;
  updateClearBanner();
}
function drawClearOverlay() {
  if (mode.type !== "clear" || !mode.a) return;
  const r = clearRect();
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -T * 20;
  poly(
    diamond(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1),
    "rgba(255,240,150,.18)",
    "#ffd23f",
    2.5,
  );
  ctx.setLineDash([]);
  for (const e of clearTargets())
    poly(diamond(e.x, e.y), "rgba(239,99,81,.35)", "rgba(239,99,81,.9)", 1.5);
}
const _drawEditOverlay = drawEditOverlay;
drawEditOverlay = function () {
  _drawEditOverlay();
  drawClearOverlay();
};
