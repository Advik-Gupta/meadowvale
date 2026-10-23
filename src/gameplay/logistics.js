const ANIM_MS = 9000;
function engLvl(k) {
  return (S.eng && S.eng[k]) || 0;
}
function needItemFor(scale) {
  const av = availableItems();
  const k = pick(av.length ? av : ["wheat"]);
  const kind = ITEMS[k].kind;
  const n = Math.max(
    1,
    Math.round(
      (kind === "crop"
        ? 6 + randi(7)
        : kind === "animal"
          ? 3 + randi(4)
          : 2 + randi(3)) * (scale || 1),
    ),
  );
  return [k, n];
}

function railTiles() {
  return entsOf("rail");
}
function isRail(x, y) {
  const e = entAt(x, y);
  return !!e && e.t === "rail";
}
function stationRailPath(st) {
  if (!st) return null;
  const starts = [];
  for (let i = -1; i <= st.w; i++)
    for (let j = -1; j <= st.h; j++) {
      if (i >= 0 && i < st.w && j >= 0 && j < st.h) continue;
      if (isRail(st.x + i, st.y + j)) starts.push([st.x + i, st.y + j]);
    }
  const onEdge = (x, y) => {
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if (
          Math.abs(dx) + Math.abs(dy) <= 2 &&
          (!inMap(x + dx, y + dy) ||
            isWater(x + dx, y + dy) ||
            !isUnlocked(x + dx, y + dy))
        )
          return true;
    return false;
  };

  for (let i = 0; i < st.w; i++)
    for (let j = 0; j < st.h; j++) if (onEdge(st.x + i, st.y + j)) return [];
  const prev = new Map(),
    q = [];
  for (const s of starts) {
    const k = s[0] + "," + s[1];
    prev.set(k, null);
    q.push(s);
  }
  while (q.length) {
    const [x, y] = q.shift();
    if (onEdge(x, y)) {
      const path = [];
      let k = x + "," + y;
      while (k) {
        path.push(k.split(",").map(Number));
        k = prev.get(k);
      }
      return path.reverse();
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = nx + "," + ny;
      if (!prev.has(k) && isRail(nx, ny)) {
        prev.set(k, x + "," + y);
        q.push([nx, ny]);
      }
    }
  }
  return null;
}
let railPathCache = { key: "", path: null };
function railPath() {
  const st = hasType("trainstation");
  if (!st || st.build) return null;
  const key = st.x + "," + st.y + "," + railTiles().size;
  if (railPathCache.key !== key)
    railPathCache = { key, path: stationRailPath(st) };
  return railPathCache.path;
}
function trainCount() {
  if (!hasType("trainstation") || hasType("trainstation").build) return 0;
  return (
    1 +
    (hasType("freightdepot") && !hasType("freightdepot").build ? 1 : 0) +
    (S.level >= 25 ? 1 : 0)
  );
}
function railTrip() {
  return Math.round(60000 * (1 - 0.05 * engLvl("rail")));
}
function makeCars(dest, nRewards) {
  const d = RAIL_DESTS.find((x) => x.id === dest) || RAIL_DESTS[0];
  const tier = Math.floor((S.rail.rep[d.id] || 0) / 5);
  const cars = [];
  const n = 3 + (engLvl("rail") >= 5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const [nk, nn] = needItemFor(1 + tier * 0.1);
    let rk = null,
      rn = 0;
    if (i < nRewards) {
      rk = pick(d.rewards);
      rn =
        rk === "gems"
          ? 2 + randi(3)
          : ITEMS[rk].kind === "tool"
            ? 1 + randi(2) + tier
            : 2 + randi(3) + tier;
    }
    cars.push({ nk, nn, filled: false, rk, rn, got: !rk });
  }
  return cars;
}
function railTick() {
  const want = trainCount();
  while (S.rail.trains.length < want)
    S.rail.trains.push({
      id: S.rail.trains.length,
      st: "away",
      ret: NOW + 4000 + S.rail.trains.length * 3000,
      dest: "pinewood",
      nr: 3,
    });
  for (const t of S.rail.trains) {
    if (t.st === "away" && NOW >= t.ret && railPath()) {
      t.st = "arriving";
      t.t0 = NOW;
    }
    if (t.st === "arriving" && NOW - t.t0 >= ANIM_MS) {
      t.st = "docked";
      t.cars = makeCars(t.dest, t.nr);
      notify(
        "🚂",
        `A train arrived from ${(RAIL_DESTS.find((d) => d.id === t.dest) || RAIL_DESTS[0]).name}!`,
        false,
      );
    }
    if (t.st === "departing" && NOW - t.t0 >= ANIM_MS) {
      t.st = "away";
      t.ret = NOW + railTrip() * (S.realism && !t.fuel ? 1.5 : 1);
    }
  }
}
function railCollect(ti, ci, quiet) {
  const t = S.rail.trains[ti],
    c = t && t.cars[ci];
  if (!c || c.got) return;
  if (c.rk === "gems") {
    S.gems += c.rn;
  } else {
    if (spaceFor(c.rk) < c.rn) {
      if (!quiet) {
        toastOnce("Storage is full! 📦", "warn");
        sfx("error");
      }
      return;
    }
    addItem(c.rk, c.rn);
  }
  c.got = true;
  if (!quiet) sfx("coin");
  renderPanel(true);
}
function railFill(ti, ci, quiet) {
  const t = S.rail.trains[ti],
    c = t && t.cars[ci];
  if (!c || c.filled) return;
  if ((S.inv[c.nk] || 0) < c.nn) {
    if (!quiet) {
      toastOnce(`Need ${c.nn} ${ITEMS[c.nk].icon} ${ITEMS[c.nk].name}`, "warn");
      sfx("error");
    }
    return;
  }
  takeItem(c.nk, c.nn);
  c.filled = true;
  addXP(Math.max(2, Math.round(ITEMS[c.nk].xp * c.nn * 0.6)));
  if (!quiet) sfx("craft");
  renderPanel(true);
}
function railSend(ti, dest, quiet) {
  const t = S.rail.trains[ti];
  if (!t || t.st !== "docked") return;
  const d = RAIL_DESTS.find((x) => x.id === dest);
  if (!d || S.level < d.level) return;
  for (let i = 0; i < t.cars.length; i++)
    if (!t.cars[i].got) railCollect(ti, i, true);
  const filled = t.cars.filter((c) => c.filled).length;
  if (filled === t.cars.length) S.rail.rep[dest] = (S.rail.rep[dest] || 0) + 1;
  t.nr = Math.max(1, filled);
  t.dest = dest;
  t.st = "departing";
  t.t0 = NOW;
  t.cars = [];
  t.fuel = useFuel("rail");
  S.rail.last = dest;
  S.stats.trains++;
  if (!quiet) {
    sfx("expand");
    toast(`🚂 Train departed for ${d.name}!`, "good");
  }
  renderPanel(true);
}

function shipCount() {
  const p = hasType("seaport");
  if (!p || p.build) return 0;
  return 1 + (S.level >= 20 ? 1 : 0) + (S.level >= 30 ? 1 : 0);
}
function voyageTime(d) {
  let m = 1 - 0.05 * engLvl("sea");
  if (hasType("lighthouse")) m *= 0.9;
  if (S.wx && S.wx.type === "storm") m *= hasType("lighthouse") ? 1.25 : 1.5;
  return Math.round(d.time * m);
}
function seaTick() {
  const want = shipCount();
  while (S.sea.ships.length < want)
    S.sea.ships.push({
      id: S.sea.ships.length,
      st: "docked",
      cargo: null,
      dest: null,
    });
  for (const s of S.sea.ships) {
    if (s.st === "departing" && NOW - s.t0 >= ANIM_MS) {
      s.st = "sailing";
    }
    if (s.st === "sailing" && NOW >= s.ret) {
      s.st = "arriving";
      s.t0 = NOW;
    }
    if (s.st === "arriving" && NOW - s.t0 >= ANIM_MS) {
      s.st = "docked";
      if (s.dest === "ferry") {
        s.cargo = null;
        notify("⛴️", "Your ferry is back in port.", false);
        continue;
      }
      const d = SEA_DESTS.find((x) => x.id === s.dest);
      const cargo = {};
      const ty = SHIP_TYPES[s.type || "cargo"];
      const n = Math.round(
        (3 + randi(4)) *
          (s.gift ? 1.5 : 1) *
          (ty.cargo || 1) *
          (ty.oil && d.id === "oil" ? ty.oil : 1),
      );
      for (let i = 0; i < n; i++) {
        const k = pick(d.goods);
        cargo[k] = (cargo[k] || 0) + 1;
      }
      s.cargo = cargo;
      if (d.artifacts && Math.random() < 0.35)
        s.art = pickArtifact(d.artifacts);
      S.stats.voyages++;
      notify("🚢", `Your ship returned from ${d.name}!`);
    }
  }
}
function seaUnload(si, quiet) {
  const s = S.sea.ships[si];
  if (!s || !s.cargo) return true;
  for (const [k, n] of Object.entries(s.cargo)) {
    if (spaceFor(k) < n) {
      if (!quiet) {
        toastOnce("Storage is full! 📦", "warn");
        sfx("error");
      }
      return false;
    }
  }
  for (const [k, n] of Object.entries(s.cargo)) addItem(k, n);
  if (s.art) {
    gainArtifact(s.art);
    s.art = null;
  }
  addXP(10);
  s.cargo = null;
  if (!quiet) sfx("coin");
  renderPanel(true);
  return true;
}
function seaSend(si, dest, gift, quiet) {
  const s = S.sea.ships[si];
  if (!s || s.st !== "docked") return;
  if (!seaUnload(si, quiet)) return;
  const d = SEA_DESTS.find((x) => x.id === dest);
  if (!d || S.level < d.level) return;
  s.gift = false;
  if (gift) {
    const [gk, gn] = seaGift(d);
    if ((S.inv[gk] || 0) >= gn) {
      takeItem(gk, gn);
      s.gift = true;
    } else if (!quiet) {
      toastOnce(`Need ${gn} ${ITEMS[gk].icon} for the gift`, "warn");
      return;
    }
  }
  s.fuel = useFuel("sea");
  s.dest = dest;
  s.st = "departing";
  s.t0 = NOW;
  s.ret = NOW + ANIM_MS + voyageTime(d) * (S.realism && !s.fuel ? 1.5 : 1);
  S.sea.last = dest;
  if (!quiet) {
    sfx("expand");
    toast(`⛵ Ship set sail for ${d.name}!`, "good");
  }
  renderPanel(true);
}
function seaGift(d) {
  const map = {
    fishing: ["bread", 3],
    coconut: ["cheese", 3],
    spice: ["pizza", 2],
    reef: ["juice", 3],
    volcano: ["steel", 2],
    oil: ["ironbar", 3],
  };
  return map[d.id] || ["bread", 3];
}
function portDock() {
  const p = hasType("seaport");
  if (!p) return null;
  let best = null,
    bd = 1e9;
  for (let j = -3; j <= p.h + 3; j++)
    for (let i = -3; i <= p.w + 3; i++) {
      const x = p.x + i,
        y = p.y + j;
      if (!inMap(x, y) || !isWater(x, y)) continue;
      const d = Math.hypot(x - (p.x + p.w / 2), y - (p.y + p.h / 2));
      if (d < bd) {
        bd = d;
        best = [x, y];
      }
    }
  return best;
}

function planeCount() {
  const a = hasType("airport");
  if (!a || a.build) return 0;
  return 1 + (S.level >= 30 ? 1 : 0);
}
function flightTime() {
  return Math.round(
    120000 * (1 - 0.05 * engLvl("air")) * (hasType("controltower") ? 0.85 : 1),
  );
}
function makeCrates() {
  const n = 3 + randi(3) + (S.level >= 30 ? 1 : 0);
  return Array.from({ length: n }, () => {
    const [k, nn] = needItemFor(1.4);
    return { k, n: nn, filled: false, help: 0 };
  });
}
function airTick() {
  const want = planeCount();
  while (S.air.planes.length < want)
    S.air.planes.push({ id: S.air.planes.length, st: "away", ret: NOW + 5000 });
  for (const p of S.air.planes) {
    if (p.st === "away" && NOW >= p.ret) {
      p.st = "arriving";
      p.t0 = NOW;
    }
    if (p.st === "arriving" && NOW - p.t0 >= ANIM_MS) {
      p.st = "docked";
      p.crates = makeCrates();
      p.deadline = NOW + 360000;
      notify("✈️", "A cargo plane landed with new crate requests!");
    }
    if (p.st === "docked") {
      for (const c of p.crates)
        if (c.help && !c.filled && NOW >= c.help) {
          c.filled = true;
          c.byHelp = true;
          crateReward(c, 0.5, true);
          notify("🤝", `${pick(RIVALS).name} helped fill a crate!`, false);
        }
      if (NOW >= p.deadline) airSend(S.air.planes.indexOf(p), true);
    }
    if (p.st === "departing" && NOW - p.t0 >= ANIM_MS) {
      p.st = "away";
      p.ret = NOW + flightTime() * (S.realism && !p.fuel ? 1.5 : 1);
    }
  }
}
function crateReward(c, mult, quiet) {
  const coins = Math.round(ITEMS[c.k].price * c.n * 1.6 * mult),
    xp = Math.round(ITEMS[c.k].xp * c.n * 1.4 * mult);
  addCoins(coins);
  addXP(xp);
  S.stats.crates++;
  if (!quiet) toastOnce(`📦 Crate packed: +🪙${fmt(coins)} ⭐${xp}`, "good");
}
function airFill(pi, ci, quiet) {
  const p = S.air.planes[pi],
    c = p && p.crates[ci];
  if (!c || c.filled) return;
  if ((S.inv[c.k] || 0) < c.n) {
    if (!quiet) {
      toastOnce(`Need ${c.n} ${ITEMS[c.k].icon} ${ITEMS[c.k].name}`, "warn");
      sfx("error");
    }
    return;
  }
  takeItem(c.k, c.n);
  c.filled = true;
  crateReward(c, 1, quiet);
  if (!quiet) sfx("coin");
  renderPanel(true);
}
function airHelp(pi, ci) {
  const p = S.air.planes[pi],
    c = p && p.crates[ci];
  if (!c || c.filled || c.help) return;
  if (p.crates.some((x) => x.help)) {
    toastOnce("Only one help request per plane.", "warn");
    return;
  }
  c.help = NOW + 60000;
  toast(
    "🤝 Help requested - a neighbouring town will fill it in about a minute.",
    "info",
  );
  renderPanel(true);
}
function airSend(pi, auto) {
  const p = S.air.planes[pi];
  if (!p || p.st !== "docked") return;
  const all = p.crates.every((c) => c.filled);
  if (all) {
    const chest = { gems: 2 + randi(4), items: {} };
    const k = pick(["ironbar", "goldbar", "steel", "glass", "deed", "pickaxe"]);
    chest.items[k] = 1 + randi(2);
    if (Math.random() < 0.5) chest.power = 1;
    else chest.booster = 1;
    giveReward(chest, "Cargo chest");
    const tourists = 20 + randi(20);
    addCoins(tourists * 5);
    S.stats.tourism += tourists * 5;
  } else if (auto) notify("✈️", "A plane left before all crates were filled.");
  p.st = "departing";
  p.t0 = NOW;
  p.crates = [];
  p.fuel = useFuel("air");
  sfx("expand");
  renderPanel(true);
}

function renderTransport(tab) {
  if (tab === "exchange") return renderExchange();
  if (tab === "sea") return renderSea();
  if (tab === "air") return renderAir();
  return renderRail();
}
function lockedHub(t, extra) {
  const b = BUILD[t],
    ok = S.level >= b.level;
  const e = hasType(t);
  if (e && e.build)
    return `<div class="empty-state"><div class="es-ic">🏗️</div><div>Your ${b.name} is under construction.</div><div class="sub">Tap it on the map to deliver materials.</div></div>`;
  return `<div class="empty-state"><div class="es-ic">${b.icon}</div><div>Build a <b>${b.name}</b> to unlock this.</div><div class="sub">${ok ? b.desc + (extra ? "<br>" + extra : "") : `Unlocks at level ${b.level}.`}</div>
    ${ok ? `<button class="btn green" data-act="buy" data-id="${t}">Build · 🪙${fmt(b.cost)}</button>` : ""}</div>`;
}
function renderRail() {
  if (!trainCount()) return lockedHub("trainstation");
  const path = railPath();
  let html = path
    ? ""
    : `<div class="hint warn">🛤️ Your station isn't connected yet! Lay <b>Rail Track</b> (Store → Transport) from the station to the <b>coast</b> (any shoreline - a beach, river or lake bank) so trains can arrive. <button class="btn blue small" data-act="buy" data-id="rail">Lay track</button></div>`;
  const tt = TRAIN_TYPES[S.rail.type || 0],
    nx = TRAIN_TYPES[(S.rail.type || 0) + 1];
  html += `<div class="hint">Trains bring construction materials, tools and more. Fill every car to grow your reputation with a destination (better rewards).${S.realism ? " ⛽ Realism: each trip uses 1 Diesel." : ""}</div>
    <div class="hub-card row"><span class="hub-ic">${tt.icon}</span><div><b>${tt.name}</b><br><small>Trip ${fmtTime(railTrip())} · signals −${Math.round(signalBonus() * 100)}%${tt.power && utilRatio("power") < 1 ? " · ⚠️ needs full power" : ""}</small></div>
    ${nx ? `<button class="btn purple small ${S.level >= nx.level && costOK(nx.cost) ? "" : "disabled"}" data-act="train-up">⬆ ${nx.icon} ${nx.name} · ${S.level < nx.level ? "🔒 Lv " + nx.level : costHTML(nx.cost)}</button>` : '<span class="claimed">Fastest train!</span>'}</div>`;
  S.rail.trains.forEach((t, ti) => {
    html += `<div class="hub-card"><div class="hub-head"><span class="hub-ic">🚂</span><b>Train ${ti + 1}</b><span class="hub-st">${t.st === "docked" ? "🟢 At the station" : t.st === "away" ? `🕒 Back in <b class="live-t" data-t="${t.ret}">…</b>` : t.st === "arriving" ? "🚂 Arriving…" : "💨 Departing…"}</span>
      ${t.st === "away" ? `<button class="btn purple small" data-act="rail-gem" data-i="${ti}">💎 ${gemCost(t.ret - NOW)}</button>` : ""}</div>`;
    if (t.st === "docked") {
      html += `<div class="cars">${t.cars
        .map(
          (c, ci) => `<div class="car ${c.filled ? "ok" : ""}">
        <div class="car-rew">${c.rk ? (c.got ? "✔ collected" : `<button class="btn orange small" data-act="rail-collect" data-i="${ti}" data-c="${ci}">${c.rk === "gems" ? "💎" : ITEMS[c.rk].icon} ×${c.rn}</button>`) : "<small>empty</small>"}</div>
        <div class="car-body">🚃</div>
        <div class="car-need">${c.filled ? "✅ Loaded" : `<button class="btn ${(S.inv[c.nk] || 0) >= c.nn ? "green" : "disabled"} small" data-act="rail-fill" data-i="${ti}" data-c="${ci}">${ITEMS[c.nk].icon} ${S.inv[c.nk] || 0}/${c.nn}</button>`}</div></div>`,
        )
        .join("")}</div>
        <div class="dests">${RAIL_DESTS.map(
          (d) =>
            `<button class="dest ${S.level < d.level ? "locked" : ""}" data-act="rail-send" data-i="${ti}" data-d="${d.id}" ${S.level < d.level ? "disabled" : ""}><span>${d.icon}</span><b>${d.name}</b><small>${
              S.level < d.level
                ? "🔒 Lv " + d.level
                : d.rewards
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((k) => (k === "gems" ? "💎" : ITEMS[k].icon))
                    .join("") + ` · rep ${S.rail.rep[d.id] || 0}`
            }</small></button>`,
        ).join("")}</div>
        <div class="hub-note">Choose a destination to send the train (${fmtTime(railTrip())} round trip). Unloaded cars come back empty. <button class="btn blue small" data-act="rail-pass" data-i="${ti}">🚃 Passenger run · ~🪙${fmt(Math.round(40 + CITY.tourists * 6 + POP * 0.2))}</button></div>`;
    }
    html += "</div>";
  });
  return html;
}
function renderSea() {
  if (!shipCount())
    return lockedHub("seaport", "Place it so it touches the sea.");
  let html = `<div class="hint">⚓ Ships: ${S.sea.ships.length} (each Berth adds one, max 4). ${hasType("shipyard") ? "Your Shipyard can refit docked ships." : "Build a Shipyard to refit ships as ferries, container ships or tankers."}</div><div class="hint">Ships sail to exotic islands. Send a gift to bring back 50% more cargo. ${S.wx && S.wx.type === "storm" ? "⛈️ <b>Storm:</b> voyages take longer!" : ""}</div>`;
  S.sea.ships.forEach((s, si) => {
    const d =
      s.dest === "ferry"
        ? { name: "the mainland (ferry)" }
        : s.dest && SEA_DESTS.find((x) => x.id === s.dest);
    const sty = SHIP_TYPES[s.type || "cargo"];
    html += `<div class="hub-card"><div class="hub-head"><span class="hub-ic">${sty.icon}</span><b>${sty.name} ${si + 1}</b><span class="hub-st">${s.st === "docked" ? "🟢 In port" : s.st === "sailing" ? `⛵ At ${d.name} · back in <b class="live-t" data-t="${s.ret}">…</b>` : s.st === "arriving" ? "⛵ Arriving…" : "⛵ Leaving port…"}</span>
      ${s.st === "sailing" ? `<button class="btn purple small" data-act="sea-gem" data-i="${si}">💎 ${gemCost(s.ret - NOW)}</button>` : ""}</div>`;
    if (s.st === "docked") {
      if (hasType("shipyard") && !hasType("shipyard").build)
        html += `<div class="dests">${Object.entries(SHIP_TYPES)
          .filter(([k]) => k !== (s.type || "cargo"))
          .map(
            ([k, ty]) =>
              `<button class="dest ${S.level < ty.level ? "locked" : ""}" data-act="ship-refit" data-i="${si}" data-t="${k}" ${S.level < ty.level ? "disabled" : ""}><span>${ty.icon}</span><b>Refit: ${ty.name}</b><small>${S.level < ty.level ? "🔒 Lv " + ty.level : ty.cost ? costHTML(ty.cost) : "free"}</small></button>`,
          )
          .join("")}</div>`;
      if ((s.type || "cargo") === "ferry")
        html += `<div class="pp-btns mt"><button class="btn green" data-act="ferry-run" data-i="${si}">⛴️ Ferry run · ~🪙${fmt(Math.round(60 + CITY.tourists * 8))}</button></div>`;
      if (s.cargo)
        html += `<div class="cargo">Cargo: ${Object.entries(s.cargo)
          .map(([k, n]) => `${ITEMS[k].icon}×${n}`)
          .join(
            " ",
          )} ${s.art ? ARTIFACTS[s.art].icon + " artifact!" : ""} <button class="btn orange small" data-act="sea-unload" data-i="${si}">Unload</button></div>`;
      html += `<div class="dests">${SEA_DESTS.map((d2) => {
        const [gk, gn] = seaGift(d2);
        return `<div class="dest ${S.level < d2.level ? "locked" : ""}"><span>${d2.icon}</span><b>${d2.name}</b><small>${
          S.level < d2.level
            ? "🔒 Lv " + d2.level
            : d2.goods
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((k) => ITEMS[k].icon)
                .join("") +
              " · " +
              fmtTime(voyageTime(d2))
        }</small>
        ${S.level >= d2.level ? `<div class="dest-btns"><button class="btn green small" data-act="sea-send" data-i="${si}" data-d="${d2.id}">Sail</button><button class="btn blue small ${(S.inv[gk] || 0) >= gn ? "" : "disabled"}" data-act="sea-send" data-i="${si}" data-d="${d2.id}" data-g="1" title="Bring ${gn} ${ITEMS[gk].name} as a gift">+🎁 ${gn}${ITEMS[gk].icon}</button></div>` : ""}</div>`;
      }).join("")}</div>`;
    }
    html += "</div>";
  });
  return html;
}
function renderAir() {
  if (!planeCount()) return lockedHub("airport");
  let html =
    '<div class="hint">Fill crates for coins & XP. Fill them all before take-off to win a reward chest (gems, ingots, power-ups). Stuck? Ask a neighbouring town for help.</div>';
  S.air.planes.forEach((p, pi) => {
    html += `<div class="hub-card"><div class="hub-head"><span class="hub-ic">✈️</span><b>Plane ${pi + 1}</b><span class="hub-st">${p.st === "docked" ? `🟢 Boarding · leaves in <b class="live-t" data-t="${p.deadline}">…</b>` : p.st === "away" ? `🕒 Back in <b class="live-t" data-t="${p.ret}">…</b>` : "✈️ Taxiing…"}</span>
      ${p.st === "away" ? `<button class="btn purple small" data-act="air-gem" data-i="${pi}">💎 ${gemCost(p.ret - NOW)}</button>` : ""}</div>`;
    if (p.st === "docked") {
      html += `<div class="cars">${p.crates
        .map(
          (
            c,
            ci,
          ) => `<div class="car crate ${c.filled ? "ok" : ""}"><div class="car-body">${c.filled ? "✅" : "📦"}</div>
        <div class="car-need">${
          c.filled
            ? c.byHelp
              ? "🤝 Helped"
              : "Packed!"
            : `<button class="btn ${(S.inv[c.k] || 0) >= c.n ? "green" : "disabled"} small" data-act="air-fill" data-i="${pi}" data-c="${ci}">${ITEMS[c.k].icon} ${S.inv[c.k] || 0}/${c.n}</button>
        ${c.help ? "<small>help coming…</small>" : `<button class="btn blue small" data-act="air-help" data-i="${pi}" data-c="${ci}">🤝 Help</button>`}`
        }</div></div>`,
        )
        .join("")}</div>
        <div class="pp-btns mt"><button class="btn orange" data-act="air-send" data-i="${pi}">🛫 Take off ${p.crates.every((c) => c.filled) ? "(🎁 chest!)" : "(no chest)"}</button>${hasType("terminal") && !hasType("terminal").build ? `<button class="btn blue" data-act="air-pass" data-i="${pi}">🧳 Passenger flight · ~🪙${fmt(Math.round(300 + CITY.tourists * 15))}</button>` : ""}</div>`;
    }
    html += "</div>";
  });
  return html;
}
function liveTransport() {
  document.querySelectorAll(".live-t").forEach((el) => {
    el.textContent = fmtTime(Math.max(0, +el.dataset.t - NOW));
  });
}
function transportSig() {
  return JSON.stringify([
    S.rail.trains.map((t) => [
      t.st,
      t.cars && t.cars.map((c) => [c.filled, c.got]),
    ]),
    S.sea.ships.map((s) => [s.st, !!s.cargo]),
    S.air.planes.map((p) => [
      p.st,
      p.crates && p.crates.map((c) => [c.filled, !!c.help]),
    ]),
    S.inv,
    S.level,
    !!railPath(),
    S.gems,
  ]);
}

function drawVehicles() {
  const path = railPath(),
    st = hasType("trainstation");
  if (st && !st.build) {
    for (const t of S.rail.trains) {
      let pos = null;
      if (t.st === "docked")
        pos = {
          x: st.x + 0.3 + t.id * 0.05,
          y: st.y + st.h - 0.55,
          dir: "x",
          k: 0,
        };
      if (
        path &&
        path.length &&
        (t.st === "arriving" || t.st === "departing")
      ) {
        let g = clamp((NOW - t.t0) / ANIM_MS, 0, 1);
        if (t.st === "arriving") g = 1 - g;
        drawTrainOnPath(path, g * (path.length + 3), t.id);
      } else if (pos) drawTrainAt(pos.x, pos.y, t.id);
    }
  }

  const dock = portDock();
  if (dock)
    for (const s of S.sea.ships) {
      if (s.st === "sailing") continue;
      const dx = dock[0] - 64,
        dy = dock[1] - 64,
        dl = Math.hypot(dx, dy) || 1;
      let g = 0,
        a = 1;
      if (s.st === "departing") g = clamp((NOW - s.t0) / ANIM_MS, 0, 1);
      if (s.st === "arriving") g = 1 - clamp((NOW - s.t0) / ANIM_MS, 0, 1);
      a = 1 - g;
      const off = s.id * 1.2;
      drawShip(
        dock[0] + 0.5 + (dx / dl) * (g * 18 + off),
        dock[1] + 0.5 + (dy / dl) * (g * 18 + off),
        a,
        dx / dl,
        dy / dl,
      );
    }

  const ap = hasType("airport");
  if (ap && !ap.build)
    for (const p of S.air.planes) {
      if (p.st === "away") continue;
      let g = 0;
      if (p.st === "departing") g = clamp((NOW - p.t0) / ANIM_MS, 0, 1);
      if (p.st === "arriving") g = 1 - clamp((NOW - p.t0) / ANIM_MS, 0, 1);
      const x = ap.x + 0.6 + g * 7,
        y = ap.y + 2.3 - p.id * 0.0,
        z = 6 + Math.max(0, g - 0.45) * 220;
      drawPlane(
        x + (p.st === "docked" ? 3.2 + p.id * 1.2 : 0),
        y - (p.st === "docked" ? 1.0 : 0),
        z,
        1 - Math.max(0, g - 0.7) / 0.3,
      );
    }
}
function drawTrainAt(x, y, id) {
  const cols = ["#c62828", "#1565c0", "#2e7d32"];
  for (let k = 3; k >= 0; k--) {
    const cx = x + k * 0.72;
    if (k === 3) {
      prism(
        cx,
        y,
        0.62,
        0.36,
        2,
        16,
        "#333",
        cols[id % 3],
        shade(cols[id % 3], -0.25),
      );
      prism(cx + 0.38, y + 0.08, 0.2, 0.2, 16, 22, "#222", "#333", "#222");
    } else prism(cx, y, 0.62, 0.36, 2, 13, "#8d6e63", "#a1887f", "#795548");
  }
}
function drawTrainOnPath(path, head, id) {
  for (let k = 0; k < 4; k++) {
    const p = head - k * 0.9;
    if (p < 0 || p > path.length - 1) continue;
    const i = Math.floor(p),
      f = p - i,
      a = path[i],
      b = path[Math.min(i + 1, path.length - 1)];
    const x = a[0] + (b[0] - a[0]) * f,
      y = a[1] + (b[1] - a[1]) * f;
    const loco = k === 0,
      col = ["#c62828", "#1565c0", "#2e7d32"][id % 3];
    prism(
      x + 0.2,
      y + 0.2,
      0.6,
      0.6,
      2,
      loco ? 16 : 13,
      loco ? "#333" : "#8d6e63",
      loco ? col : "#a1887f",
      loco ? shade(col, -0.25) : "#795548",
    );
    if (loco) smokeAt(P(x + 0.5, y + 0.5, 24), 4, true);
  }
}
function drawShip(x, y, a, dx, dy) {
  if (a <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = a;
  const [sx, sy] = P(x, y);
  const bob = Math.sin(T * 1.8 + x) * 1.5;
  ellipse(sx, sy + 3, 26, 8, "rgba(255,255,255,.35)");
  ctx.translate(sx, sy + bob);
  const flip = dx - dy < 0 ? -1 : 1;
  ctx.scale(flip, 1);
  poly(
    [
      [-26, -6],
      [24, -6],
      [16, 6],
      [-20, 6],
    ],
    "#c62828",
  );
  poly(
    [
      [-26, -10],
      [24, -10],
      [24, -6],
      [-26, -6],
    ],
    "#f5f5f5",
  );
  rr(-16, -26, 22, 16, 2, "#eceff1");
  rr(-12, -22, 6, 5, 1, "#90caf9");
  rr(-3, -22, 6, 5, 1, "#90caf9");
  rr(10, -34, 6, 24, 1, "#37474f");
  rr(9, -36, 8, 4, 1, "#c62828");
  for (let k = 0; k < 3; k++)
    rr(-24 + k * 8, -18, 7, 8, 1, ["#ff9800", "#1e88e5", "#43a047"][k]);
  ctx.restore();
  if (a > 0.5) smokeAt(P(x, y, 40), 1.5);
}
function drawPlane(x, y, z, a) {
  if (a <= 0.02) return;
  const [sx, sy] = P(x, y, z);
  const [gx, gy] = P(x, y, 0);
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  ellipse(gx, gy + 2, 22, 6, "rgba(0,0,0,.2)");
  ctx.translate(sx, sy);
  poly(
    [
      [-30, -6],
      [30, -9],
      [36, -4],
      [30, 0],
      [-30, 2],
    ],
    "#f5f7fa",
  );
  poly(
    [
      [-30, -6],
      [30, -9],
      [30, -7],
      [-30, -4],
    ],
    "#1e88e5",
  );
  poly(
    [
      [-6, -4],
      [8, -4],
      [-12, 14],
      [-20, 14],
    ],
    "#dfe5ea",
  );
  poly(
    [
      [-6, -6],
      [8, -6],
      [-4, -20],
      [-12, -20],
    ],
    "#cfd8dc",
  );
  poly(
    [
      [-30, -5],
      [-24, -5],
      [-32, -18],
      [-36, -18],
    ],
    "#1e88e5",
  );
  for (let k = 0; k < 6; k++) circle(-16 + k * 7, -3, 1.3, "#90caf9");
  ctx.restore();
}
