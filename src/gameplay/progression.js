function mineLoot(depth) {
  const pool = MINE_LOOT.filter((l) => depth >= l[2]);
  const tot = pool.reduce(
    (a, l) =>
      a +
      l[1] +
      (l[0] && depth > 1
        ? l[0] === "goldore" || l[0] === "gems"
          ? depth
          : 0
        : 0),
    0,
  );
  let r = Math.random() * tot;
  for (const l of pool) {
    r -=
      l[1] +
      (l[0] && depth > 1
        ? l[0] === "goldore" || l[0] === "gems"
          ? depth
          : 0
        : 0);
    if (r <= 0) return l[0];
  }
  return "";
}
function newMineLayer(depth) {
  S.mine = {
    depth,
    grid: Array.from({ length: MINE_W * MINE_H }, () => ({
      d: false,
      it: mineLoot(depth),
    })),
  };
}
function mineDig(i, tool, quiet) {
  if (!hasType("mine") || hasType("mine").build) return;
  if (!S.mine) newMineLayer(1);
  const cell = S.mine.grid[i];
  if (!cell || cell.d) return;
  const t = tool || "pickaxe";
  if (!(S.inv[t] > 0)) {
    if (!quiet) {
      toastOnce(
        `You need a ${ITEMS[t].name} ${ITEMS[t].icon}! Get them from trains to Ironvale or the Tool Workshop.`,
        "warn",
      );
      sfx("error");
    }
    return;
  }
  takeItem(t, 1);
  const cells = t === "dynamite" ? neighbours3(i) : [i];
  const found = [];
  for (const j of cells) {
    const c = S.mine.grid[j];
    if (c.d) continue;
    c.d = true;
    S.stats.digs++;
    if (c.it === "gems") {
      S.gems += 1 + randi(2);
      found.push("💎");
    } else if (c.it === "coins") {
      const n = 40 * S.mine.depth + randi(60);
      addCoins(n);
      found.push("🪙" + n);
    } else if (c.it === "artifact") {
      const a = pickArtifact(pick(["farming", "fossil", "royal"]));
      gainArtifact(a);
      found.push(ARTIFACTS[a].icon);
    } else if (c.it) {
      addItem(c.it, 1);
      found.push(ITEMS[c.it].icon);
    }
  }
  addXP(cells.length);
  if (!quiet) {
    sfx("chop");
    if (found.length) toastOnce(`⛏️ Found ${found.join(" ")}`, "good");
    renderPanel(true);
  }
}
function neighbours3(i) {
  const x = i % MINE_W,
    y = Math.floor(i / MINE_W),
    r = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx,
        Y = y + dy;
      if (X >= 0 && Y >= 0 && X < MINE_W && Y < MINE_H) r.push(Y * MINE_W + X);
    }
  return r;
}
function mineDescend() {
  const dug = S.mine.grid.filter((c) => c.d).length;
  if (dug < S.mine.grid.length * 0.6) {
    toastOnce("Dig at least 60% of this layer first.", "warn");
    return;
  }
  newMineLayer(S.mine.depth + 1);
  sfx("expand");
  renderPanel(true);
}
let mineTool = "pickaxe";
function renderMine() {
  const m = hasType("mine");
  if (!m)
    return lockedHub("mine", "Bridge to Stonepeak Isle and build it there.");
  if (m.build) return lockedHub("mine");
  if (!S.mine) newMineLayer(1);
  const dug = S.mine.grid.filter((c) => c.d).length;
  return `<div class="hint">Tap tiles to dig with a ⛏️ Pickaxe (you have <b>${S.inv.pickaxe || 0}</b>) or blast 3×3 with 🧨 Dynamite (<b>${S.inv.dynamite || 0}</b>). Deeper layers hide gold, gems and crystals.</div>
    <div class="mine-bar"><b>Depth ${S.mine.depth}</b> · dug ${dug}/${S.mine.grid.length}
      <span class="tool-pick"><button class="pick ${mineTool === "pickaxe" ? "on" : ""}" data-act="mine-tool" data-t="pickaxe">⛏️</button><button class="pick ${mineTool === "dynamite" ? "on" : ""}" data-act="mine-tool" data-t="dynamite">🧨</button></span>
      <button class="btn blue small" data-act="mine-down">⬇ Descend</button></div>
    <div class="mine-grid" style="grid-template-columns:repeat(${MINE_W},1fr)">${S.mine.grid.map((c, i) => `<button class="mcell ${c.d ? "dug" : ""} d${Math.min(5, S.mine.depth)}" data-act="mine-dig" data-i="${i}" ${c.d ? "disabled" : ""}>${c.d ? (c.it === "gems" ? "💎" : c.it === "coins" ? "🪙" : c.it === "artifact" ? "🏺" : c.it ? ITEMS[c.it].icon : "") : ""}</button>`).join("")}</div>`;
}

function engTargets() {
  const t = [
    {
      id: "fields",
      name: "Fields",
      icon: "🌾",
      desc: "+3% crop growth per level",
    },
  ];
  if (hasType("trainstation"))
    t.push({
      id: "rail",
      name: "Trains",
      icon: "🚂",
      desc: "-5% trip time; extra car at Lv5",
    });
  if (hasType("seaport"))
    t.push({
      id: "sea",
      name: "Ships",
      icon: "🚢",
      desc: "-5% voyage time per level",
    });
  if (hasType("airport"))
    t.push({
      id: "air",
      name: "Planes",
      icon: "✈️",
      desc: "-5% flight time per level",
    });
  for (const f of FACTORY_TYPES)
    if (hasType(f))
      t.push({
        id: f,
        name: BUILD[f].name,
        icon: BUILD[f].icon,
        desc: "-4% production time per level",
      });
  return t;
}
function engCost(l) {
  return {
    coins: Math.round((600 * Math.pow(l + 1, 1.6)) / 10) * 10,
    ironbar: l + 1,
    goldbar: l >= 4 ? l - 3 : 0,
  };
}
function engUpgrade(id) {
  if (!hasType("institute") || hasType("institute").build) return;
  const l = engLvl(id);
  if (l >= 10) return;
  const c = engCost(l);
  if ((S.inv.ironbar || 0) < c.ironbar || (S.inv.goldbar || 0) < c.goldbar) {
    toastOnce(
      `Need ${c.ironbar} 🔗 Iron Ingots${c.goldbar ? ` and ${c.goldbar} 🥇 Gold Ingots` : ""} - smelt them at the Foundry.`,
      "warn",
    );
    sfx("error");
    return;
  }
  if (!spend(c.coins)) return;
  takeItem("ironbar", c.ironbar);
  if (c.goldbar) takeItem("goldbar", c.goldbar);
  S.eng[id] = l + 1;
  S.stats.upgrades++;
  sfx("level");
  toast(`⚙️ ${id} upgraded to level ${l + 1}!`, "good");
  renderPanel(true);
}
function renderInstitute() {
  const i = hasType("institute");
  if (!i || i.build) return lockedHub("institute");
  return `<div class="hint">Permanent upgrades paid with ingots from the Foundry (you have 🔗${S.inv.ironbar || 0} 🥇${S.inv.goldbar || 0}).</div><div class="eng-list">${engTargets()
    .map((t) => {
      const l = engLvl(t.id),
        c = engCost(l);
      return `<div class="ach"><div class="ach-ic">${t.icon}</div><div class="ach-main"><div class="ach-name">${t.name} <small>Lv ${l}/10</small></div><div class="ach-desc">${t.desc}</div><div class="pbar"><div style="width:${l * 10}%"></div></div></div>
      <div class="ach-side">${l >= 10 ? '<div class="claimed">MAX</div>' : `<button class="btn purple small" data-act="eng-up" data-id="${t.id}">🪙${fmt(c.coins)} 🔗${c.ironbar}${c.goldbar ? " 🥇" + c.goldbar : ""}</button>`}</div></div>`;
    })
    .join("")}</div>`;
}

function pickArtifact(set) {
  const c = COLLECTIONS.find((x) => x.id === set) || pick(COLLECTIONS);
  return pick(c.items)[0];
}
function gainArtifact(id) {
  S.artifacts[id] = (S.artifacts[id] || 0) + 1;
  notify(
    ARTIFACTS[id].icon,
    `Found an artifact: ${ARTIFACTS[id].name}! See the Museum.`,
  );
}
function collectionDone(c) {
  return c.items.every(([id]) => S.artifacts[id] > 0);
}
function claimCollection(id) {
  const c = COLLECTIONS.find((x) => x.id === id);
  if (!c || !collectionDone(c) || S.colClaimed[id]) return;
  if (!hasType("museum")) {
    toastOnce(
      "Build a Museum (Store → Community) to display your collection!",
      "warn",
    );
    return;
  }
  S.colClaimed[id] = true;
  S.stats.collections++;
  for (const [aid] of c.items) S.artifacts[aid]--;
  giveReward({ gems: c.gems, coins: c.coins || 0 }, `${c.name} complete`);
  if (c.decor) {
    S.decorBag[c.decor] = (S.decorBag[c.decor] || 0) + 1;
    toast(
      `🏛️ Unlocked a unique decoration: ${BUILD[c.decor].name} (Store → Decor)!`,
      "good",
    );
  }
  sfx("ach");
  renderPanel(true);
}
function swapDuplicates() {
  const dupes = Object.keys(S.artifacts).filter((k) => S.artifacts[k] > 1);
  let total = dupes.reduce((a, k) => a + S.artifacts[k] - 1, 0);
  if (total < 3) {
    toastOnce("You need 3 duplicate artifacts to trade.", "warn");
    return;
  }
  let need = 3;
  for (const k of dupes)
    while (need && S.artifacts[k] > 1) {
      S.artifacts[k]--;
      need--;
    }
  const missing = Object.keys(ARTIFACTS).filter((k) => !S.artifacts[k]);
  const got = missing.length ? pick(missing) : pick(Object.keys(ARTIFACTS));
  gainArtifact(got);
  renderPanel(true);
}
function renderCollections() {
  return `<div class="hint">Artifacts come from the ⛏️ Mine, 🪸 Coral Reef voyages and clearing old land. Complete a set and display it in a Museum for gems & rewards.
    <button class="btn blue small" data-act="col-swap">🔄 Trade 3 duplicates</button></div><div class="col-list">${COLLECTIONS.map(
      (c) => {
        const done = collectionDone(c),
          claimed = S.colClaimed[c.id];
        return `<div class="col-card ${claimed ? "done" : done ? "ready" : ""}"><div class="col-head">${c.icon} <b>${c.name}</b> <small>💎${c.gems}${c.coins ? " 🪙" + fmt(c.coins) : ""}${c.decor ? " + unique decor" : ""}</small></div>
      <div class="col-items">${c.items.map(([id, name, icon]) => `<div class="col-it ${S.artifacts[id] > 0 ? "have" : ""}" title="${name}"><span>${S.artifacts[id] > 0 || claimed ? icon : "❔"}</span><small>${name}${S.artifacts[id] > 1 ? " ×" + S.artifacts[id] : ""}</small></div>`).join("")}</div>
      ${claimed ? '<div class="claimed">✔ On display</div>' : done ? `<button class="btn orange" data-act="col-claim" data-id="${c.id}">Display & claim</button>` : ""}</div>`;
      },
    ).join("")}</div>`;
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function dailyTick() {
  const today = todayStr();
  if (!S.daily || S.daily.day !== today) {
    const pool = DAILY_TEMPLATES.filter((t) => S.level >= (t.level || 1));
    const tasks = [];
    while (tasks.length < 3 && pool.length) {
      const t = pool.splice(randi(pool.length), 1)[0];
      tasks.push({
        stat: t.stat,
        name: t.name.replace("{n}", Math.round(t.base + t.per * S.level)),
        icon: t.icon,
        goal: Math.round(t.base + t.per * S.level),
        base: S.stats[t.stat] || 0,
        claimed: false,
      });
    }
    S.daily = { day: today, tasks, bonus: false };
  }
}
function dailyProg(t) {
  return Math.min(t.goal, (S.stats[t.stat] || 0) - t.base);
}
function claimDaily(i) {
  const t = S.daily.tasks[i];
  if (!t || t.claimed || dailyProg(t) < t.goal) return;
  t.claimed = true;
  S.stats.dailies++;
  giveReward({ coins: 80 + 20 * S.level, clovers: 1 }, "Daily task");
  if (S.daily.tasks.every((x) => x.claimed) && !S.daily.bonus) {
    S.daily.bonus = true;
    giveReward({ gems: 5, power: 1 }, "All daily tasks done");
  }
  renderPanel(true);
}
function loginStreak() {
  const today = todayStr();
  if (S.streak.last === today) return null;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yest = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  S.streak.n = S.streak.last === yest ? S.streak.n + 1 : 1;
  S.streak.last = today;
  const day = ((S.streak.n - 1) % 7) + 1;
  const r = { coins: 100 * day, clovers: 1 };
  if (day === 7) r.gems = 10;
  else if (day >= 4) r.gems = 2;
  return { day, r };
}

let wheelSpinning = false;
function spinWheel() {
  if (wheelSpinning) return;
  if (S.clovers < 1) {
    toastOnce(
      "You need a 🍀 clover to spin! Earn them from daily tasks and login streaks.",
      "warn",
    );
    sfx("error");
    return;
  }
  S.clovers--;
  S.stats.spins++;
  const tot = WHEEL.reduce((a, s) => a + s.w, 0);
  let r = Math.random() * tot,
    idx = 0;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].w;
    if (r <= 0) {
      idx = i;
      break;
    }
  }
  wheelSpinning = true;
  const el = document.getElementById("wheel");
  const seg = 360 / WHEEL.length;
  S.wheelRot =
    (S.wheelRot || 0) +
    360 * 5 +
    (360 - (idx * seg + seg / 2)) -
    ((S.wheelRot || 0) % 360);
  if (el) el.style.transform = `rotate(${S.wheelRot}deg)`;
  sfx("click");
  setTimeout(
    () => {
      wheelSpinning = false;
      giveReward(WHEEL[idx].r, `Lucky Wheel: ${WHEEL[idx].label}`);
      sfx("ach");
      renderPanel(true);
    },
    el ? 3200 : 0,
  );
}

function currentEvent() {
  const week = Math.floor(Date.now() / (7 * 86400000));
  const ev = EVENTS[week % EVENTS.length];
  const end = (week + 1) * 7 * 86400000;
  return { ev, week, end };
}
function eventTick() {
  const { ev, week } = currentEvent();
  if (!S.evt || S.evt.week !== week)
    S.evt = { week, id: ev.id, base: S.stats[ev.stat] || 0, spent: 0 };
}
function eventTokens() {
  const { ev } = currentEvent();
  return (
    Math.floor(
      (((S.stats[ev.stat] || 0) - S.evt.base) / ev.per) *
        (seasonalNow() ? 2 : 1),
    ) - S.evt.spent
  );
}
function buyEventDecor(t) {
  const b = BUILD[t];
  if (eventTokens() < b.tokens) {
    toastOnce(`Need ${b.tokens} 🎟️ tokens`, "warn");
    sfx("error");
    return;
  }
  S.evt.spent += b.tokens;
  S.decorBag[t] = (S.decorBag[t] || 0) + 1;
  toast(`🎟️ Got a ${b.name}! Place it from Store → Decor.`, "good");
  sfx("ach");
  renderPanel(true);
}

function merchantBuy(i, gems) {
  const m = S.merchant;
  if (!m || NOW > m.until) return;
  const o = m.offers[i];
  if (!o || o.sold) return;
  if (gems ? !spendGems(o.gems) : !spend(o.coins)) return;
  addItem(o.k, o.n);
  o.sold = true;
  sfx("coin");
  toast(`🧳 Bought ${o.n} ${ITEMS[o.k].icon}`, "good");
  renderPanel(true);
}

function rivalPop(r, i) {
  const days = (Date.now() - S.created) / 86400000;
  return Math.round(
    r.base + r.rate * days * 6 + Math.sin(days * 3 + i) * 10 + S.level * 8,
  );
}
function contractsTick() {
  S.contracts = S.contracts.filter((c) => c.deadline > NOW || c.done);
  while (S.contracts.filter((c) => !c.done).length < 3 && S.level >= 6) {
    const r = pick(RIVALS),
      items = {};
    const n = 2 + randi(2);
    for (let i = 0; i < n; i++) {
      const [k, q] = needItemFor(2);
      items[k] = (items[k] || 0) + q;
    }
    let value = 0;
    for (const k in items) value += ITEMS[k].price * items[k];
    S.contracts.push({
      id: S.orderSeq++,
      town: r.name,
      mayor: r.mayor,
      items,
      coins: Math.round(value * 2.2),
      gems: 1 + randi(3),
      deadline: NOW + 600000 + randi(300000),
    });
  }
}
function deliverContract(id) {
  const c = S.contracts.find((x) => x.id === id);
  if (!c || c.done) return;
  if (!canFulfill(c)) {
    toastOnce("Missing items for this contract.", "warn");
    sfx("error");
    return;
  }
  for (const k in c.items) takeItem(k, c.items[k]);
  c.done = true;
  S.rep[c.town] = (S.rep[c.town] || 0) + 1;
  giveReward({ coins: c.coins, gems: c.gems }, `Contract for ${c.town}`);
  addXP(Math.round(c.coins / 20));
  S.stats.served++;
  S.contracts = S.contracts.filter((x) => x.id !== id);
  renderPanel(true);
}
function trendsTick() {
  const today = todayStr();
  if (
    !S.trends ||
    S.trends.day !== today ||
    (S.trends.hot.length < 3 && availableItems().length >= 5)
  ) {
    const pool = availableItems().slice();
    const hot = [],
      cold = [];
    while (hot.length < 3 && pool.length)
      hot.push(pool.splice(randi(pool.length), 1)[0]);
    while (cold.length < 2 && pool.length)
      cold.push(pool.splice(randi(pool.length), 1)[0]);
    S.trends = { day: today, hot, cold };
  }
}
function trendMult(k) {
  if (!S.trends) return 1;
  return S.trends.hot.includes(k) ? 1.5 : S.trends.cold.includes(k) ? 0.7 : 1;
}
function priceOf(k) {
  return Math.max(1, Math.round(ITEMS[k].price * trendMult(k)));
}
function renderContracts() {
  if (S.level < 6)
    return '<div class="empty-state"><div class="es-ic">🤝</div><div>Business contracts from neighbouring towns unlock at level 6.</div></div>';
  const tr = S.trends
    ? `<div class="hint">📈 <b>Market trends today:</b> ${S.trends.hot.map((k) => `${ITEMS[k].icon} +50%`).join(" · ")} &nbsp; 📉 ${S.trends.cold.map((k) => `${ITEMS[k].icon} −30%`).join(" · ")}</div>`
    : "";
  return (
    tr +
    `<div class="orders">${S.contracts
      .map((c) => {
        const can = canFulfill(c);
        return `<div class="order ${can ? "ready" : ""}"><div class="o-head"><div class="avatar" style="background:#ffe0b2">🤝</div><div><div class="o-name">${c.town}</div><div class="o-sub">${c.mayor} · rep ${S.rep[c.town] || 0}</div></div></div>
    <div class="o-items">${Object.entries(c.items)
      .map(
        ([k, n]) =>
          `<div class="o-item ${(S.inv[k] || 0) >= n ? "ok" : ""}"><span class="ic">${ITEMS[k].icon}</span><span class="cnt">${Math.min(S.inv[k] || 0, n)}/${n}</span></div>`,
      )
      .join("")}</div>
    <div class="o-reward"><span>🪙 ${fmt(c.coins)}</span><span>💎 ${c.gems}</span><span class="live-t small" data-t="${c.deadline}"></span></div>
    <div class="o-btns"><button class="btn ${can ? "green" : "disabled"}" data-act="ct-deliver" data-id="${c.id}">${can ? "✔ Deliver" : "Need items"}</button></div></div>`;
      })
      .join("")}</div>`
  );
}

function renderEvents(tab) {
  if (tab === "calendar") return renderCalendar();
  if (tab === "wheel") {
    const seg = 360 / WHEEL.length;
    const grad = WHEEL.map(
      (s, i) =>
        `${["#ffd23f", "#ef6351", "#6cc04a", "#47b2ee", "#9b6ce0", "#ff9f43", "#1abc9c", "#e91e63"][i]} ${i * seg}deg ${(i + 1) * seg}deg`,
    ).join(",");
    return `<div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="wheel" id="wheel" style="background:conic-gradient(${grad});transform:rotate(${S.wheelRot || 0}deg)">${WHEEL.map((s, i) => `<span style="transform:rotate(${i * seg + seg / 2}deg) translateY(-118px) rotate(${-(i * seg + seg / 2)}deg)">${s.label}</span>`).join("")}</div>
      <div class="wheel-side"><div class="big">🍀 ${S.clovers}</div><button class="btn green big" data-act="wheel-spin">Spin! (1 🍀)</button><div class="odds">${WHEEL.map((s) => `${s.label}: ${Math.round((s.w / WHEEL.reduce((a, x) => a + x.w, 0)) * 100)}%`).join("<br>")}</div></div></div>`;
  }
  if (tab === "event") {
    const { ev, end } = currentEvent();
    const sn = seasonalNow();
    const items = [
      "lantern",
      "cherrytree",
      "pumpkinstatue",
      "goldfountain",
      "xmastree",
    ].filter(
      (t) =>
        t !== "xmastree" ||
        (sn && sn.decor === "xmastree") ||
        S.decorBag.xmastree,
    );
    return `${sn ? `<div class="event-banner seasonal"><div class="ev-ic">${sn.icon}</div><div><div class="ev-name">${sn.name} is on!</div><div>Double 🎟️ tokens while it lasts · exclusive: ${BUILD[sn.decor].icon} ${BUILD[sn.decor].name}</div></div></div>` : ""}<div class="event-banner"><div class="ev-ic">${ev.icon}</div><div><div class="ev-name">${ev.name}</div><div>${ev.desc}</div><small>Ends in ${Math.max(1, Math.ceil((end - Date.now()) / 3600000))} hours</small></div><div class="ev-tok">🎟️ ${eventTokens()}</div></div>
      <div class="cards">${items.map((t) => `<div class="card">${thumbHTML(t)}<div class="card-name">${BUILD[t].name}</div><div class="card-desc">${BUILD[t].desc}</div><div class="card-stats"><span class="chip">owned ${S.decorBag[t] || 0}</span></div><button class="btn ${eventTokens() >= BUILD[t].tokens ? "orange" : "disabled"}" data-act="ev-buy" data-id="${t}">🎟️ ${BUILD[t].tokens}</button></div>`).join("")}</div>`;
  }
  if (tab === "merchant") {
    const m = S.merchant && NOW < S.merchant.until ? S.merchant : null;
    if (!m)
      return '<div class="empty-state"><div class="es-ic">🧳</div><div>No merchant in town right now.</div><div class="sub">A travelling merchant visits every few minutes.</div></div>';
    return `<div class="hint">🧳 The merchant leaves in <b class="live-t" data-t="${m.until}">…</b></div><div class="cards">${m.offers
      .map(
        (
          o,
          i,
        ) => `<div class="card ${o.sold ? "owned" : ""}"><div class="big-ic">${ITEMS[o.k].icon}</div><div class="card-name">${o.n} × ${ITEMS[o.k].name}</div>
      ${o.sold ? '<button class="btn disabled">Sold</button>' : `<div class="btnrow"><button class="btn green" data-act="mer-buy" data-i="${i}">🪙${fmt(o.coins)}</button><button class="btn purple" data-act="mer-buy" data-i="${i}" data-g="1">💎${o.gems}</button></div>`}</div>`,
      )
      .join("")}</div>`;
  }

  const st = S.streak;
  return `<div class="streak">🔥 Login streak: <b>${st.n} day${st.n === 1 ? "" : "s"}</b> · 🍀 ${S.clovers} clovers · 💎 ${S.gems} gems</div>
    <div class="ach-list">${S.daily.tasks
      .map((t, i) => {
        const p = dailyProg(t),
          done = p >= t.goal;
        return `<div class="ach ${t.claimed ? "done" : done ? "ready" : ""}"><div class="ach-ic">${t.icon}</div><div class="ach-main"><div class="ach-name">${t.name}</div>
      <div class="pbar"><div style="width:${(p / t.goal) * 100}%"></div><span>${p}/${t.goal}</span></div></div>
      <div class="ach-side">${t.claimed ? '<div class="claimed">✔</div>' : done ? `<button class="btn orange" data-act="daily-claim" data-i="${i}">Claim</button>` : `<div class="reward">🪙${80 + 20 * S.level} 🍀1</div>`}</div></div>`;
      })
      .join("")}</div>
    <div class="hint">Finish all 3 for a bonus of 💎5 and a power-up. New tasks every day.</div>`;
}

let overlay = null;
function renderCity(tab) {
  if (tab === "mayor") return renderMayor();
  if (tab === "coop") return renderCoop();
  if (tab === "rivals") {
    const rows = RIVALS.map((r, i) => ({
      name: r.name,
      who: r.mayor,
      pop: rivalPop(r, i),
      style: r.style,
    }))
      .concat([
        {
          name: "Meadowvale (you)",
          who: "🧑‍🌾 You",
          pop: POP,
          me: true,
          style: TITLES[CITY.title].name,
        },
      ])
      .sort((a, b) => b.pop - a.pop);
    return `<div class="hint">🏆 Weekly leaderboard of the region by population. Help towns with contracts to build reputation.</div><div class="board">${rows.map((r, i) => `<div class="brow ${r.me ? "me" : ""}"><span class="rank">#${i + 1}</span><b>${r.name}</b><small>${r.who} · ${r.style}</small><span class="bpop">👥 ${fmt(r.pop)}</span></div>`).join("")}</div>`;
  }
  if (tab === "log")
    return `<div class="log">${S.log.length ? S.log.map((l) => `<div class="log-row"><span>${l.icon}</span><div>${l.text}</div><small>${new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") : '<div class="empty-state">No news yet.</div>'}</div>`;
  const pw = CITY.powerDemand
      ? Math.min(100, (CITY.power / CITY.powerDemand) * 100)
      : 100,
    wa = CITY.waterDemand
      ? Math.min(100, (CITY.water / CITY.waterDemand) * 100)
      : 100;
  const svcCount = {};
  for (const sid in SERVICES) svcCount[sid] = 0;
  let homes = 0;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) {
      homes++;
      for (const s of e.svc || []) svcCount[s]++;
    }
  const wx = S.wx ? WEATHER[S.wx.type] : WEATHER.sunny,
    se = SEASONS[seasonIdx()];
  return `<div class="city-grid">
    <div class="cbox"><div class="cb-t">🏙️ ${TITLES[CITY.title].name}</div><div class="cb-big">👥 ${fmt(POP)} / ${fmt(POPCAP)}</div><small>${CITY.title < TITLES.length - 1 ? `Next: ${TITLES[CITY.title + 1].name} at ${fmt(TITLES[CITY.title + 1].pop)}` : "Top title reached!"}</small></div>
    <div class="cbox"><div class="cb-t">😊 Happiness</div><div class="cb-big">${CITY.hap}%</div><div class="cap-bar"><div style="width:${CITY.hap}%"></div></div><small>Raises rent up to +25%</small></div>
    <div class="cbox"><div class="cb-t">📸 Tourism</div><div class="cb-big">${CITY.tourists} tourists</div><small>~🪙${Math.round(CITY.tourists * 3)}/min · earned 🪙${fmt(S.stats.tourism)}</small></div>
    <div class="cbox"><div class="cb-t">${se.icon} ${se.name} · ${wx.icon} ${wx.name}</div><small>${wx.desc || "Nice day!"}${seasonIdx() === 3 ? " · Winter: crops a bit slower (greenhouses unaffected)" : ""}</small></div>
    <div class="cbox wide"><div class="cb-t">⚡ Power ${fmt(CITY.power)} / ${fmt(CITY.powerDemand)}</div><div class="cap-bar"><div class="${pw < 100 ? "full" : ""}" style="width:${pw}%"></div></div>
      <div class="cb-t">💧 Water ${fmt(CITY.water)} / ${fmt(CITY.waterDemand)}</div><div class="cap-bar"><div class="${wa < 100 ? "full" : ""}" style="width:${wa}%"></div></div>
      <small>${S.level < 8 ? "Utilities become required at level 8." : pw < 100 || wa < 100 ? "⚠️ Shortage! Rent is reduced. Build power & water in Store → Utilities." : "✔ Fully supplied."}</small></div>
    <div class="cbox wide"><div class="cb-t">🏛️ Service coverage (${homes} homes)</div><div class="svc">${Object.entries(
      SERVICES,
    )
      .map(
        ([sid, s]) =>
          `<div class="svc-row"><span>${s.icon} ${s.name}</span><div class="cap-bar"><div style="width:${homes ? (svcCount[sid] / homes) * 100 : 0}%"></div></div><small>${homes ? Math.round((svcCount[sid] / homes) * 100) : 0}%</small></div>`,
      )
      .join("")}</div></div>
  </div>
  <div class="overlay-row"><b>Map overlays:</b> ${[
    ["", "Off"],
    ["happy", "😊 Happiness"],
    ["service", "🏛️ Services"],
    ["pollution", "🏭 Pollution"],
  ]
    .map(
      ([k, l]) =>
        `<button class="pick wide ${overlay === (k || null) ? "on" : ""}" data-act="overlay" data-id="${k}">${l}</button>`,
    )
    .join("")}</div>`;
}
function drawOverlay(vr) {
  if (!overlay) return;
  if (overlay === "happy")
    for (const t of HOUSE_TYPES)
      for (const e of entsOf(t)) {
        const h = e.hap == null ? 50 : e.hap,
          c = h > 66 ? "80,200,80" : h > 40 ? "240,200,60" : "230,70,60";
        poly(diamond(e.x, e.y, e.w, e.h), `rgba(${c},.45)`, `rgba(${c},.9)`, 2);
        const p = P(e.x + e.w / 2, e.y + e.h / 2, 70);
        ctx.font = "700 12px Fredoka";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,.6)";
        ctx.lineWidth = 3;
        ctx.strokeText(h + "%", p[0], p[1]);
        ctx.fillText(h + "%", p[0], p[1]);
      }
  if (overlay === "service" || overlay === "pollution") {
    const list =
      overlay === "pollution"
        ? POLLUTERS.map((t) => [t, 5, "230,90,60"])
        : Object.values(SERVICES).flatMap((s, i) =>
            s.types.map((t) => [
              t,
              s.r,
              [
                "80,140,240",
                "240,90,60",
                "240,240,240",
                "160,100,240",
                "250,180,60",
                "80,200,90",
              ][i],
            ]),
          );
    for (const [t, r, c] of list)
      for (const e of entsOf(t)) {
        const p = P(e.x + e.w / 2, e.y + e.h / 2);
        ctx.beginPath();
        ctx.ellipse(
          p[0],
          p[1],
          r * HW * 1.41,
          r * HH * 1.41,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(${c},.12)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${c},.7)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
  }
}
function mineDescendAuto() {
  newMineLayer(S.mine.depth + 1);
}
