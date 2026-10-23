const $ = (s) => document.querySelector(s);
const THUMBS = {};
function genThumbs() {
  for (const t in BUILD)
    if (!BUILD[t].nature && BUILD[t].cat !== "soon" && t !== "bridge") {
      try {
        THUMBS[t] = makeThumb(t);
      } catch (e) {
        console.warn("thumb", t, e);
      }
    }
}
function thumbHTML(t) {
  return THUMBS[t]
    ? `<img class="thumb" src="${THUMBS[t]}" alt="">`
    : `<div class="big-ic">${BUILD[t].icon}</div>`;
}

const hudC = {};
function setTxt(id, v) {
  if (hudC[id] === v) return;
  hudC[id] = v;
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
function updateHUD() {
  setTxt("hud-level", String(S.level));
  const need = xpNeed(S.level);
  const pct = Math.min(100, (S.xp / need) * 100).toFixed(1) + "%";
  if (hudC.xpw !== pct) {
    hudC.xpw = pct;
    $("#xpfill").style.width = pct;
  }
  setTxt("hud-xp", `${S.xp} / ${need} XP`);
  setTxt("hud-coins", S.mode === "creative" ? "∞" : fmt(S.coins));
  setTxt("hud-gems", fmt(S.gems));
  setTxt("hud-hap", CITY.hap + "%");
  const ub = S.unread ? String(Math.min(9, S.unread)) : "";
  if (hudC.ub !== ub) {
    hudC.ub = ub;
    const b = $("#badge-bell");
    b.textContent = ub;
    b.classList.toggle("hidden", !ub);
  }
  const wxI = S.wx ? WEATHER[S.wx.type].icon : "☀️";
  if (hudC.wx !== wxI + seasonIdx()) {
    hudC.wx = wxI + seasonIdx();
    const c = $("#clock");
    c.title = `${SEASONS[seasonIdx()].name} · ${S.wx ? WEATHER[S.wx.type].name : "Sunny"}`;
  }
  setTxt("hud-pop", S.people ? fmt(RES) : `${fmt(POP)}/${fmt(POPCAP)}`);
  const capFull = POP >= POPCAP;
  if (hudC.capFull !== capFull) {
    hudC.capFull = capFull;
    $("#pill-pop").classList.toggle("warn", capFull);
  }
  const bs = Object.keys(S.boost)
    .filter((k) => S.boost[k] > NOW)
    .map((k) => {
      const b = BOOSTERS.find((x) => x.id === k);
      return b
        ? `<span class="boost-chip" title="${b.desc}">${b.icon} ${fmtTime(S.boost[k] - NOW)}</span>`
        : "";
    })
    .join("");
  if (hudC.bs !== bs) {
    hudC.bs = bs;
    $("#boost-bar").innerHTML = bs;
  }
  const st = storageStats(),
    used = st.barnUsed;
  setTxt("hud-barn", `${used}/${S.barnCap}`);
  const full = used >= S.barnCap;
  if (hudC.full !== full) {
    hudC.full = full;
    $("#pill-barn").classList.toggle("warn", full);
  }
  const hasSilo = st.siloCap > 0;
  if (hudC.silo !== hasSilo) {
    hudC.silo = hasSilo;
    $("#pill-silo").classList.toggle("hidden", !hasSilo);
  }
  if (hasSilo) setTxt("hud-silo", `${st.siloUsed}/${st.siloCap}`);
  setTxt("btn-pause", clock.paused ? "▶️" : "⏸️");
  setTxt("btn-speed", clock.speed + "×");
  if (hudC.spd !== clock.speed) {
    hudC.spd = clock.speed;
    $("#btn-speed").classList.toggle("fast", clock.speed > 1);
  }
  const sb = S.strike ? "!" : "";
  if (hudC.sb !== sb) {
    hudC.sb = sb;
    const b = $("#badge-staff");
    b.textContent = sb;
    b.classList.toggle("hidden", !sb);
  }
  const ready =
    S.orders.filter(canFulfill).length +
    (S.courier ? S.courier.filter((c) => c.o && canFulfill(c.o)).length : 0);
  const ob = ready
    ? String(ready)
    : S.orders.length
      ? String(S.orders.length)
      : "";
  if (hudC.ob !== ob + ready) {
    hudC.ob = ob + ready;
    const b = $("#badge-orders");
    b.textContent = ob;
    b.classList.toggle("hidden", !ob);
    b.classList.toggle("green", ready > 0);
  }
  const ac = ACHIEVEMENTS.filter((a) => S.ach[a.id] === 1).length;
  if (hudC.ac !== ac) {
    hudC.ac = ac;
    const b = $("#badge-ach");
    b.textContent = ac;
    b.classList.toggle("hidden", !ac);
  }
  const ph = ((NOW / 1000) % DAY_LEN) / DAY_LEN;
  const icon = !S.daynight
    ? "☀️"
    : ph < 0.45
      ? "☀️"
      : ph < 0.58
        ? "🌇"
        : ph < 0.92
          ? "🌙"
          : "🌅";
  setTxt(
    "clock",
    S.wx && S.wx.type !== "sunny" ? WEATHER[S.wx.type].icon : icon,
  );
  setTxt("btn-sound", S.sound ? "🔊" : "🔇");
}
function bump(sel) {
  const el = $(sel);
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}
function shakeEl(sel) {
  const el = $(sel);
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

const toastSeen = {};
function toast(html, cls) {
  const root = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast " + (cls || "");
  el.innerHTML = html;
  root.appendChild(el);
  setTimeout(() => el.classList.add("out"), 2600);
  setTimeout(() => el.remove(), 3000);
  while (root.children.length > 4) root.firstChild.remove();
}
function toastOnce(html, cls) {
  if (toastSeen[html] && Date.now() - toastSeen[html] < 2500) return;
  toastSeen[html] = Date.now();
  toast(html, cls);
}

function flyIcon(icon, sx, sy, targetSel, n) {
  const tgt = $(targetSel);
  if (!tgt) return;
  const tr = tgt.getBoundingClientRect();
  const tx = tr.left + tr.width / 2,
    ty = tr.top + tr.height / 2;
  n = Math.min(n || 1, 6);
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "flyer";
    el.textContent = icon;
    const ox = (Math.random() - 0.5) * 30,
      oy = (Math.random() - 0.5) * 20;
    el.style.left = sx + ox + "px";
    el.style.top = sy + oy + "px";
    document.body.appendChild(el);
    const dx = tx - sx - ox,
      dy = ty - sy - oy;
    const anim = el.animate(
      [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
        {
          transform: `translate(calc(-50% + ${dx * 0.12}px), calc(-50% + ${-50 + dy * 0.05}px)) scale(1.25)`,
          opacity: 1,
          offset: 0.25,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`,
          opacity: 0.9,
        },
      ],
      {
        duration: 850 + i * 60,
        delay: i * 70,
        easing: "cubic-bezier(.5,0,.75,.4)",
        fill: "forwards",
      },
    );
    anim.onfinish = () => {
      el.remove();
      bump(targetSel);
    };
  }
}

function setBanner(html) {
  const b = $("#mode-banner");
  b.innerHTML = html;
  b.classList.remove("hidden");
}
function hideBanner() {
  $("#mode-banner").classList.add("hidden");
}
function setCursorIcon(icon) {
  const c = $("#cursor-icon");
  if (!icon) {
    c.classList.add("hidden");
    return;
  }
  c.innerHTML = icon;
  c.classList.remove("hidden");
}

let panel = null;
const PANELS = {
  store: {
    title: "🏪 Store",
    tabs: [
      { id: "seeds", label: "🌱 Seeds" },
      { id: "supplies", label: "🧱 Supplies" },
      { id: "farm", label: "🚜 Farm" },
      { id: "town", label: "🏠 Homes" },
      { id: "civic", label: "🏫 Community" },
      { id: "prod", label: "🏭 Production" },
      { id: "biz", label: "💼 Business" },
      { id: "world", label: "🌍 Cultures" },
      { id: "gov", label: "🏛️ Government" },
      { id: "fun", label: "🎡 Leisure" },
      { id: "sport", label: "⚽ Sports" },
      { id: "monument", label: "🗽 Landmarks" },
      { id: "mil", label: "🪖 Military" },
      { id: "ind", label: "⛏️ Industry" },
      { id: "util", label: "⚡ Utilities" },
      { id: "trans", label: "🚂 Transport" },
      { id: "wonder", label: "🎭 Wonders" },
      { id: "deco", label: "🌳 Decor" },
      { id: "land", label: "🖌️ Landscape" },
      { id: "perks", label: "⭐ Upgrades" },
      { id: "boost", label: "🧪 Boosters" },
      { id: "soon", label: "🧭 Explore" },
    ],
    sig: () =>
      S.coins +
      "|" +
      S.level +
      "|" +
      S.stats.fieldsBought +
      "|" +
      S.barnLvl +
      "|" +
      JSON.stringify(S.seeds) +
      "|" +
      world.ents.size +
      "|" +
      POPCAP +
      "|" +
      JSON.stringify(S.perks) +
      "|" +
      Object.keys(S.boost).join() +
      "|" +
      (panel && panel.tab === "boost" ? Math.floor(NOW / 1000) : ""),
    render: renderStore,
    live: () => liveTransport(),
  },
  inventory: {
    title: "🛖 Barn",
    tabs: [
      { id: "barn", label: "📦 Storage" },
      { id: "seeds", label: "🌱 Seed Bag" },
      { id: "powers", label: "⚡ Power-ups" },
    ],
    sig: () =>
      JSON.stringify(S.inv) +
      JSON.stringify(S.seeds) +
      S.barnCap +
      "|" +
      S.coins +
      JSON.stringify(S.powers) +
      S.gems +
      JSON.stringify(POOLCAP),
    render: renderInventory,
  },
  orders: {
    title: "🧾 Orders",
    tabs: [
      { id: "market", label: "🛒 Market" },
      { id: "courier", label: "📮 Courier" },
      { id: "contracts", label: "🤝 Contracts" },
      { id: "requests", label: "📖 Requests" },
      { id: "express", label: "🚁 Express" },
    ],
    sig: () =>
      JSON.stringify([
        S.req,
        (S.express || []).map((o) => o.id),
        S.coins >= 3000,
      ]) +
      S.orders.map((o) => o.id).join(",") +
      JSON.stringify(S.inv) +
      maxOrders() +
      "|" +
      (S.courier ? S.courier.map((c) => (c.o ? c.o.id : "-")).join(",") : "") +
      (hasType("courier") ? 1 : 0) +
      S.contracts.map((c) => c.id).join(),
    render: (tab) =>
      tab === "courier"
        ? renderCourier()
        : tab === "contracts"
          ? renderContracts()
          : tab === "requests"
            ? renderRequests()
            : tab === "express"
              ? renderExpress()
              : renderOrders(),
    live: () => {
      liveOrders();
      liveCourier();
      liveTransport();
    },
  },
  transport: {
    title: "🚂 Transport",
    tabs: [
      { id: "rail", label: "🚂 Railway" },
      { id: "sea", label: "🚢 Sea Port" },
      { id: "air", label: "✈️ Airport" },
      { id: "exchange", label: "🌐 Exchange" },
    ],
    sig: () =>
      transportSig() +
      JSON.stringify([
        S.rail.type,
        S.sea.ships.map((s) => s.type),
        S.xch && S.xch.t,
      ]),
    render: (t) => renderTransport(t),
    live: () => liveTransport(),
  },
  mine: {
    title: "⛏️ Mine",
    sig: () =>
      JSON.stringify([
        S.mine && S.mine.grid.map((c) => (c.d ? 1 : 0)).join(""),
        S.inv.pickaxe,
        S.inv.dynamite,
        mineTool,
        S.mine && S.mine.depth,
      ]),
    render: () => renderMine(),
  },
  institute: {
    title: "⚙️ Engineering Institute",
    sig: () =>
      JSON.stringify([S.eng, S.inv.ironbar, S.inv.goldbar, S.coins >= 600]),
    render: () => renderInstitute(),
  },
  collections: {
    title: "🏛️ Museum Collections",
    sig: () => JSON.stringify([S.artifacts, S.colClaimed, !!hasType("museum")]),
    render: () => renderCollections(),
  },
  events: {
    title: "🎁 Events & Rewards",
    tabs: [
      { id: "daily", label: "📅 Daily" },
      { id: "wheel", label: "🎡 Lucky Wheel" },
      { id: "event", label: "🎪 Weekly Event" },
      { id: "calendar", label: "📆 Calendar" },
      { id: "merchant", label: "🧳 Merchant" },
    ],
    sig: () =>
      JSON.stringify([
        S.daily,
        S.clovers,
        S.gems,
        eventTokens(),
        S.decorBag,
        S.merchant && S.merchant.offers.map((o) => o.sold),
        S.merchant && NOW < S.merchant.until,
        S.streak,
      ]),
    render: (t) => renderEvents(t),
    live: () => liveTransport(),
  },
  city: {
    title: "🏙️ City",
    tabs: [
      { id: "overview", label: "📊 Overview" },
      { id: "mayor", label: "🌟 Mayor Perks" },
      { id: "coop", label: "⛵ Regatta" },
      { id: "rivals", label: "🏆 Region" },
      { id: "log", label: "🔔 News" },
    ],
    sig: () =>
      JSON.stringify([
        CITY,
        S.log.length,
        overlay,
        POP,
        S.mayor,
        S.level,
        S.coop && S.coop.tasks.map((t) => t.done),
        S.coop &&
          Math.floor(
            (S.stats.harvested + S.stats.crafted + S.stats.served) / 5,
          ),
      ]),
    render: (t) => renderCity(t),
  },
  staff: {
    title: "👷 Staff",
    tabs: [
      { id: "staff", label: "👷 Team" },
      { id: "hire", label: "📋 Job Board" },
      { id: "album", label: "📒 Album" },
    ],
    sig: () =>
      staffSig() + JSON.stringify(S.albumClaim) + Object.keys(S.album).length,
    render: (tab) => renderStaff(tab),
    live: () => liveStaff(),
  },
  achievements: {
    title: "🏆 Achievements",
    sig: () => JSON.stringify(S.ach) + ACHIEVEMENTS.map(achValue).join(","),
    render: renderAch,
  },
  settings: {
    title: "⚙️ Settings",
    sig: () => "" + S.sound + S.daynight + S.realism,
    render: renderSettings,
  },
};
function openPanel(name, tab) {
  if (panel && panel.name === name) {
    if (tab && tab !== panel.tab) {
      panel.tab = tab;
      renderPanel(true);
    }
    return;
  }
  closePanel(true);
  hidePopup();
  const def = PANELS[name];
  panel = { name, tab: tab || (def.tabs ? def.tabs[0].id : null), sig: null };
  const tabs = def.tabs
    ? `<div class="tabs">${def.tabs.map((t) => `<button class="tab" data-act="tab" data-tab="${t.id}">${t.label}</button>`).join("")}</div>`
    : "";
  $("#modal-root").innerHTML =
    `<div class="modal-back" data-act="backdrop"><div class="modal modal-${name}">
    <div class="modal-head"><div class="modal-title">${def.title}</div><div class="modal-wallet">🪙 <span id="mw-coins">${fmt(S.coins)}</span></div><button class="x" data-act="close" title="Close (Esc)">✕</button></div>
    ${tabs}<div class="modal-body" id="modal-body"></div></div></div>`;
  renderPanel(true);
  Sfx.play("open");
  document
    .querySelectorAll(".tool")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === name));
}
function closePanel(silent) {
  if (!panel) return;
  panel = null;
  const back = $("#modal-root .modal-back");
  if (back) {
    back.classList.add("closing");
    setTimeout(() => {
      if (!panel) $("#modal-root").innerHTML = "";
    }, 180);
  }
  if (!silent) Sfx.play("close");
  document
    .querySelectorAll(".tool")
    .forEach((b) => b.classList.remove("active"));
}
function renderPanel(force) {
  if (!panel) return;
  const def = PANELS[panel.name];
  const mw = document.getElementById("mw-coins");
  if (mw) mw.textContent = fmt(S.coins);
  const body = $("#modal-body");
  if (!body) return;

  const html = def.render(panel.tab);
  if (!force && html === panel.html) {
    if (def.live) def.live();
    return;
  }
  const first = panel.html == null || panel.lastTab !== panel.tab;
  panel.html = html;
  panel.lastTab = panel.tab;
  const st = body.scrollTop;
  body.classList.toggle("still", !first);
  const ae = document.activeElement,
    fid = ae && ae.id && body.contains(ae) ? ae.id : null,
    sel =
      fid && ae.selectionStart != null
        ? [ae.selectionStart, ae.selectionEnd]
        : null;
  body.innerHTML = html;
  body.scrollTop = st;
  if (fid) {
    const el = document.getElementById(fid);
    if (el) {
      el.focus();
      if (sel)
        try {
          el.setSelectionRange(sel[0], sel[1]);
        } catch (e) {}
    }
  }
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === panel.tab));
  if (def.live) def.live();
}

function lockHTML(l) {
  return `<div class="lock">🔒 Unlocks at level ${l}</div>`;
}
function seedCard(k) {
  const c = CROPS[k],
    locked = S.level < c.level,
    have = S.seeds[k] || 0;
  return `<div class="card ${locked ? "locked" : ""}">
    <div class="big-ic">${c.icon}<span class="seed-tag">🌱</span></div>
    <div class="card-name">${c.name} Seeds</div>
    <div class="card-stats"><span class="chip">⏱ ${fmtTime(c.time)}</span><span class="chip">×${CROP_YIELD} harvest</span><span class="chip">🪙${c.price} each</span></div>
    <div class="card-desc">In seed bag: <b>${have}</b></div>
    ${
      locked
        ? lockHTML(c.level)
        : `<div class="btnrow">
      <button class="btn ${S.coins >= c.seed ? "green" : "disabled"}" data-act="buyseed" data-id="${k}" data-n="1">+1 · 🪙${c.seed}</button>
      <button class="btn ${S.coins >= c.seed * 10 ? "green" : "disabled"}" data-act="buyseed" data-id="${k}" data-n="10">+10 · 🪙${c.seed * 10}</button></div>`
    }
  </div>`;
}
function buildCard(k) {
  const b = BUILD[k],
    locked = S.level < b.level,
    cost = buildCost(k),
    afford = S.coins >= cost;
  const owned = b.max ? countOf(k) : 0,
    maxed = b.max && owned >= b.max;
  const stats = [];
  if (b.animal)
    stats.push(
      `<span class="chip">${ITEMS[b.out].icon} / ${fmtTime(b.time)}</span>`,
      `<span class="chip">eats ${ITEMS[b.feed].icon}</span>`,
    );
  if (b.siloCap) stats.push(`<span class="chip">📦 +${b.siloCap} crops</span>`);
  if (b.max) stats.push(`<span class="chip">${owned}/${b.max} built</span>`);
  if (b.pop)
    stats.push(
      `<span class="chip">👥 ${b.pop}</span>`,
      `<span class="chip">🪙${b.rent} / ${fmtTime(b.rentTime)}</span>`,
    );
  if (b.cap) stats.push(`<span class="chip">🏘️ +${b.cap} cap</span>`);
  if (b.power) stats.push(`<span class="chip">⚡ ${b.power}</span>`);
  if (b.water) stats.push(`<span class="chip">💧 ${b.water}</span>`);
  if (b.tour) stats.push(`<span class="chip">📸 ${b.tour}</span>`);
  if (b.produce)
    stats.push(
      `<span class="chip">${b.produce.items.map((k) => ITEMS[k].icon).join("")} / ${fmtTime(b.produce.time)}</span>`,
    );
  if (needsBuild(k))
    stats.push(
      `<span class="chip" title="Needs construction materials">🏗️ ${Object.entries(
        matsFor(k),
      )
        .map(([m, n]) => n + ITEMS[m].icon)
        .join(" ")}</span>`,
    );
  const bagged = b.cat === "event" || b.cat === "unique";
  const capBlocked = b.pop && POP + b.pop > POPCAP;
  if (b.recipes)
    stats.push(
      ...b.recipes.map(
        (r) =>
          `<span class="chip" title="${GOODS[r].name}">${GOODS[r].icon}</span>`,
      ),
    );
  if (b.xp) stats.push(`<span class="chip">+${b.xp}⭐</span>`);
  stats.push(`<span class="chip">${b.w}×${b.h}</span>`);
  return `<div class="card ${locked ? "locked" : ""}">
    ${thumbHTML(k)}
    <div class="card-name">${b.name}</div>
    <div class="card-desc">${b.desc || ""}</div>
    <div class="card-stats">${stats.join("")}</div>
    ${bagged || (b.cat === "deco" && S.decorBag[k] > 0) ? `<button class="btn orange" data-act="buy" data-id="${k}">Place from storage (×${S.decorBag[k] || 0})</button>` : locked ? lockHTML(b.level) : maxed ? '<button class="btn disabled">✔ Built (max)</button>' : capBlocked ? '<button class="btn disabled" title="Build community buildings to raise the population cap">👥 Pop cap full</button>' : `<button class="btn ${afford ? "green" : "disabled"}" data-act="buy" data-id="${k}">🪙 ${fmt(cost)}</button>`}
  </div>`;
}
function renderStore(tab) {
  if (tab === "supplies") return renderSupplies();
  if (tab === "perks")
    return `<div class="hint">Permanent upgrades that automate and boost your town. Bought once, kept forever.</div><div class="cards">${PERKS.map(
      (p) => {
        const owned = hasPerk(p.id),
          locked = S.level < p.level;
        return `<div class="card perk ${locked ? "locked" : ""} ${owned ? "owned" : ""}"><div class="big-ic">${p.icon}</div><div class="card-name">${p.name}</div><div class="card-desc">${p.desc}</div>
      ${owned ? '<button class="btn disabled">✔ Owned</button>' : locked ? lockHTML(p.level) : `<button class="btn ${S.coins >= p.cost ? "purple" : "disabled"}" data-act="buyperk" data-id="${p.id}">🪙 ${fmt(p.cost)}</button>`}</div>`;
      },
    ).join("")}</div>`;
  if (tab === "boost")
    return `<div class="hint">Short power-ups. Buying again while active extends the timer. Active boosters show under your coins.</div><div class="cards">${BOOSTERS.map(
      (b) => {
        const locked = S.level < b.level,
          on = boostOn(b.id),
          c = boosterCost(b);
        return `<div class="card ${locked ? "locked" : ""} ${on ? "owned" : ""}"><div class="big-ic">${b.icon}</div><div class="card-name">${b.name}</div><div class="card-desc">${b.desc}</div>
      <div class="card-stats"><span class="chip">⏱ ${fmtTime(b.dur)}</span>${on ? `<span class="chip on">Active · <b class="live-t" data-t="${S.boost[b.id]}"></b></span>` : ""}</div>
      ${locked ? lockHTML(b.level) : `<button class="btn ${S.coins >= c ? "orange" : "disabled"}" data-act="buybooster" data-id="${b.id}">${on ? "Extend" : "Activate"} · 🪙${fmt(c)}</button>`}</div>`;
      },
    ).join("")}</div>`;
  if (tab === "soon")
    return `<div class="hint">🧭 The world never ends - every seed has its own continents, islands and biomes. Pan in any direction to explore, and build 🌉 Bridges to cross water. Biomes you discover: <b>${Object.keys(S.biomesSeen || {}).length}/${BIOMES.filter((b) => b.col).length}</b></div><div class="cards">${BIOMES.filter(
      (b) => b.col,
    )
      .map((b) => {
        const seen = S.biomesSeen && S.biomesSeen[b.id];
        return `<div class="card ${seen ? "owned" : "locked"}"><div class="big-ic">${seen ? b.icon : "❔"}</div><div class="card-name">${seen ? b.name : "Undiscovered"}</div><div class="card-desc">${seen ? "Found on day " + seen : "Keep exploring…"}</div></div>`;
      })
      .join("")}</div>`;
  if (tab === "seeds")
    return `<div class="hint">Seeds are planted on Fields. Each harvest gives <b>×${CROP_YIELD}</b> crops, and sometimes a bonus seed!</div><div class="cards">${Object.keys(CROPS).map(seedCard).join("")}</div>`;
  if (tab === "world") {
    const cur = S.storeCulture || "all";
    const chips = [["all", "🌍 All"]]
      .concat(
        Object.entries(CULTURES).map(([k, c]) => [k, c.icon + " " + c.name]),
      )
      .map(
        ([k, n]) =>
          `<button class="jb-cat ${cur === k ? "on" : ""}" data-act="store-culture" data-c="${k}">${n}</button>`,
      )
      .join("");
    const groups = Object.keys(CULTURES)
      .filter((c) => cur === "all" || cur === c)
      .map((c) => {
        const ks = Object.keys(BUILD)
          .filter((k) => BUILD[k].culture === c)
          .sort((a, b) => BUILD[a].level - BUILD[b].level);
        return `<div class="jb-sec-h">${CULTURES[c].icon} ${CULTURES[c].name}</div><div class="cards">${ks.map(buildCard).join("")}</div>`;
      })
      .join("");
    return `<div class="hint">🌍 Build districts in any style - homes house residents, shops get visitors, landmarks bring tourists and beauty. Mix them or give every town its own culture.</div><div class="jb-cats">${chips}</div>${groups}`;
  }
  let items = Object.keys(BUILD)
    .filter((k) => BUILD[k].cat === tab)
    .sort((a, b) => (BUILD[a].level || 0) - (BUILD[b].level || 0));
  if (tab === "deco")
    items = items.concat(
      Object.keys(BUILD).filter(
        (k) =>
          (BUILD[k].cat === "event" || BUILD[k].cat === "unique") &&
          S.decorBag[k] > 0,
      ),
    );
  let extra = "";
  if (tab === "farm") {
    const c = barnUpgradeCost(S.barnLvl);
    extra = `<div class="card">${thumbHTML("barn")}<div class="card-name">Barn Upgrade</div><div class="card-desc">Increase storage from ${S.barnCap} to ${S.barnCap + 25}.</div>
      <div class="card-stats"><span class="chip">📦 +25</span><span class="chip">Lv ${S.barnLvl + 1}</span></div>
      <button class="btn ${S.coins >= c ? "orange" : "disabled"}" data-act="barnup">🪙 ${fmt(c)}</button></div>`;
  }
  const hints = {
    ind: "Raw materials, construction supplies and tools. Big buildings need 🧱 materials to finish construction.",
    util: `From level 8 homes need ⚡ power and 💧 water. Supply now: ⚡${CITY.power}/${CITY.powerDemand} 💧${CITY.water}/${CITY.waterDemand}.`,
    trans:
      "Trains bring materials & tools, ships fetch exotic goods, planes pay big for crates.",
    wonder: "Huge multi-stage projects with permanent town-wide bonuses.",
    land: "Repaint your land tile by tile - drag to paint many tiles.",
    farm: "Place fields on any free land you own - barren dirt works great.",
    town: `Houses add population and pay rent. Population ${POP}/${POPCAP} - build Community buildings to raise the cap.`,
    civic: `Community buildings raise the population cap (now ${POPCAP}) so you can build more homes.`,
    prod: "Production buildings turn crops into valuable goods that customers love.",
    deco: "Roads let villagers and customers walk around. Decor makes your town shine.",
  };
  return `<div class="hint">${hints[tab] || (typeof CAT_HINTS !== "undefined" && CAT_HINTS[tab]) || ""}</div><div class="cards">${items.map(buildCard).join("")}${extra}</div>`;
}

function renderInventory(tab) {
  if (tab === "powers") {
    const ids = [...Object.keys(POWERUPS), ...Object.keys(BOOSTER_ITEMS)];
    return `<div class="hint">One-shot power-ups and booster potions. Earn them from chests, the Lucky Wheel, daily tasks and the Innovation Lab - or buy power-ups with 💎 gems.</div><div class="cards">${ids
      .map((id) => {
        const p = POWERUPS[id] || BOOSTER_ITEMS[id],
          n = S.powers[id] || 0;
        const desc = POWERUPS[id]
          ? p.desc
          : BOOSTERS.find((b) => b.id === p.boost).desc +
            " (" +
            fmtTime(BOOSTERS.find((b) => b.id === p.boost).dur) +
            ")";
        return `<div class="card ${n ? "" : "dim"}"><div class="big-ic">${p.icon}</div><div class="card-name">${p.name}</div><div class="card-desc">${desc}</div><div class="count-big">×${n}</div>
        <div class="btnrow"><button class="btn ${n ? "green" : "disabled"}" data-act="use-power" data-id="${id}">Use</button>${POWERUPS[id] ? `<button class="btn purple" data-act="gem-power" data-id="${id}">💎${p.gems}</button>` : ""}</div></div>`;
      })
      .join("")}</div>`;
  }
  if (tab === "seeds") {
    const ks = Object.keys(CROPS).filter(
      (k) => S.level >= CROPS[k].level || (S.seeds[k] || 0) > 0,
    );
    return `<div class="hint">🌱 Seed bag: <b>${seedTotal()}</b> / ${seedCap()} (build Seed Sheds for more). Season now: ${SEASONS[seasonIdx()].icon} ${SEASONS[seasonIdx()].name} - crops marked 🌸 grow 30% faster in season. Tap <b>Plant</b> then drag across empty fields.</div><div class="cards">${ks
      .map((k) => {
        const c = CROPS[k],
          n = S.seeds[k] || 0;
        return `<div class="card"><div class="big-ic">${c.icon}<span class="seed-tag">🌱</span></div><div class="card-name">${c.name} Seeds${c.seasons && c.seasons.includes(seasonIdx()) ? " 🌸" : ""}</div>
        <div class="count-big">×${n}</div>
        <div class="btnrow"><button class="btn ${n > 0 ? "green" : "disabled"}" data-act="plantmode" data-id="${k}">Plant</button><button class="btn blue" data-act="storeseeds">Buy</button></div></div>`;
      })
      .join("")}</div>`;
  }
  const st = storageStats(),
    used = st.barnUsed,
    cap = S.barnCap,
    uc = barnUpgradeCost(S.barnLvl);
  const keys = Object.keys(S.inv).filter((k) => S.inv[k] > 0);
  let head = `<div class="cap-row"><div class="cap-label">🛖 Barn <b>${used}</b> / ${cap}</div>
    <div class="cap-bar"><div style="width:${Math.min(100, (used / cap) * 100)}%" class="${used >= cap ? "full" : ""}"></div></div>
    <button class="btn orange small" data-act="barnup">Upgrade +25 · 🪙${fmt(uc)}</button></div>`;
  for (const p in POOLS)
    if (st.cap[p])
      head += `<div class="cap-row"><div class="cap-label">${POOLS[p].icon} ${POOLS[p].name} <b>${st.used[p]}</b> / ${st.cap[p]}</div>
    <div class="cap-bar"><div style="width:${Math.min(100, (st.used[p] / st.cap[p]) * 100)}%" class="silo ${st.used[p] >= st.cap[p] ? "full" : ""}"></div></div><small class="cap-note">${POOLS[p].kinds.join(", ")} go here first</small></div>`;
  if (!st.cap.silo && S.level >= BUILD.silo.level)
    head += `<div class="hint">💡 Build Grain Silos, Cold Storage, Warehouses and a Material Depot to keep your barn free.</div>`;
  if (!keys.length)
    return (
      head +
      `<div class="empty-state"><div class="es-ic">🧺</div><div>Your barn is empty.</div><div class="sub">Harvest crops from your fields to fill it up!</div></div>`
    );
  const ORD = {
    crop: 0,
    animal: 1,
    feed: 2,
    good: 3,
    exotic: 4,
    material: 5,
    tool: 6,
    ore: 7,
  };
  keys.sort((a, b) => ORD[ITEMS[a].kind] - ORD[ITEMS[b].kind]);
  return (
    head +
    `<div class="hint">Customers at the 🧾 Market pay much more than selling here directly!</div><div class="cards">${keys
      .map((k) => {
        const it = ITEMS[k],
          n = S.inv[k];
        return `<div class="card"><div class="big-ic">${it.icon}</div><div class="card-name">${it.name}</div><div class="count-big">×${n}</div>
      <div class="card-desc">Sells for 🪙${priceOf(k)} each${trendMult(k) > 1 ? " 📈" : trendMult(k) < 1 ? " 📉" : ""}</div>
      <div class="btnrow"><button class="btn green" data-act="sell" data-id="${k}">Sell 1</button><button class="btn orange" data-act="sellall" data-id="${k}">All · 🪙${fmt(priceOf(k) * n)}</button></div></div>`;
      })
      .join("")}</div>`
  );
}

function renderOrders() {
  const max = maxOrders();
  let html = `<div class="hint">Villagers visit the Market with requests. Deliver to earn coins and XP! More population = more customers (${S.orders.length}/${max} slots).</div><div class="orders">`;
  for (const o of S.orders) {
    const can = canFulfill(o);
    html += `<div class="order ${can ? "ready" : ""}">
      <div class="o-head"><div class="avatar" style="background:${o.bg}">${o.face}</div><div><div class="o-name">${o.name}</div><div class="o-sub">${o.mood}</div></div></div>
      <div class="o-items">${Object.entries(o.items)
        .map(([k, n]) => {
          const have = S.inv[k] || 0;
          return `<div class="o-item ${have >= n ? "ok" : ""}" title="${ITEMS[k].name}"><span class="ic">${ITEMS[k].icon}</span><span class="cnt">${Math.min(have, n)}/${n}</span></div>`;
        })
        .join("")}</div>
      <div class="o-reward"><span>🪙 ${fmt(o.coins)}</span><span>⭐ ${o.xp}</span></div>
      <div class="o-btns"><button class="btn ${can ? "green" : "disabled"}" data-act="deliver" data-id="${o.id}">${can ? "✔ Deliver" : "Need items"}</button><button class="btn red small" data-act="skip" data-id="${o.id}" title="Send this customer away">✕</button></div>
    </div>`;
  }
  for (let i = S.orders.length; i < max; i++)
    html += `<div class="order empty"><div class="wait-ic">⏳</div><div>${i === S.orders.length ? 'Next customer in <b class="next-cust">…</b>' : "Waiting for customers"}</div></div>`;
  return html + "</div>";
}
function liveOrders() {
  const el = document.querySelector(".next-cust");
  if (el) el.textContent = fmtTime(Math.max(0, S.nextOrder - NOW));
}

function renderAch() {
  const done = ACHIEVEMENTS.filter((a) => S.ach[a.id]).length;
  const ready = ACHIEVEMENTS.filter((a) => S.ach[a.id] === 1);
  const readyCoins = ready.reduce((n, a) => n + a.reward, 0),
    readyGems = ready.reduce((n, a) => n + 1 + Math.floor(a.reward / 250), 0);

  const order = (a) => (S.ach[a.id] === 1 ? 0 : S.ach[a.id] === 2 ? 2 : 1);
  const list = ACHIEVEMENTS.slice().sort((a, b) => order(a) - order(b));
  return `<div class="ach-summary"><b>${done}</b> / ${ACHIEVEMENTS.length} unlocked<div class="cap-bar"><div style="width:${(done / ACHIEVEMENTS.length) * 100}%"></div></div>${ready.length ? `<button class="btn orange" data-act="claim-all">🎁 Claim all ${ready.length} · 🪙${fmt(readyCoins)} 💎${readyGems}</button>` : ""}</div><div class="ach-list">${list
    .map((a) => {
      const v = achValue(a),
        st = S.ach[a.id] || 0,
        p = Math.min(1, v / a.goal);
      return `<div class="ach ${st === 2 ? "done" : st === 1 ? "ready" : ""}"><div class="ach-ic">${a.icon}<span class="medal">${["", "🥉", "🥈", "🥇"][a.tier || 1]}</span></div>
      <div class="ach-main"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>
      <div class="pbar"><div style="width:${p * 100}%"></div><span>${fmt(Math.min(v, a.goal))} / ${fmt(a.goal)}</span></div></div>
      <div class="ach-side">${st === 2 ? '<div class="claimed">✔ Claimed</div>' : st === 1 ? `<button class="btn orange" data-act="claim" data-id="${a.id}">Claim 🪙${a.reward}</button>` : `<div class="reward">🪙 ${a.reward}</div>`}</div></div>`;
    })
    .join("")}</div>`;
}

function renderSettings() {
  return `<div class="settings">
    <div class="set-row"><span>🔊 Sound effects</span><button class="toggle ${S.sound ? "on" : ""}" data-act="toggle-sound"><i></i></button></div>
    <div class="set-row"><span>🌙 Day / night cycle</span><button class="toggle ${S.daynight ? "on" : ""}" data-act="toggle-day"><i></i></button></div>
    <div class="set-row"><span>🧊 Realism Mode <small>(food spoils without Cold Storage, vehicles need fuel)</small></span><button class="toggle ${S.realism ? "on" : ""}" data-act="toggle-realism"><i></i></button></div>
    <div class="set-row"><span>💾 Your progress saves automatically</span><button class="btn blue small" data-act="save-now">Save now</button></div>
    <div class="set-row"><span>📤 Back up or move your town</span><span class="btnrow inline"><button class="btn blue small" data-act="save-export">Download save</button><button class="btn blue small" data-act="save-import">Load save file</button><button class="btn purple small" data-act="save-code">Copy transfer code</button><button class="btn purple small" data-act="save-paste">Paste code</button></span></div>
    <h3>How to play</h3>
    <ul class="controls">
      <li><b>Drag</b> the map (or WASD / arrow keys) to look around · <b>scroll</b> to zoom</li>
      <li><b>Tap an empty field</b> to plant · <b>drag</b> across fields to plant or harvest many at once</li>
      <li>Sell crops to <b>customers</b> at the Market for the best prices</li>
      <li>Tap houses with 🪙 to collect rent · tap trees & rocks to clear them</li>
      <li>The world is <b>endless</b> - explore in any direction, every seed is different. Build 🌉 Bridges across water to reach other islands</li>
      <li><b>P</b> / <b>Space</b> pause · <b>F</b> fast-forward (1×/2×/3×)</li>
      <li>Hire staff at the <b>Employment Office</b> to farm, ranch, cook and collect rent for you</li>
      <li><b>Esc</b> or right-click cancels · <b>B</b> store · <b>I</b> barn · <b>O</b> orders · <b>J</b> staff · <b>H</b> home</li>
    </ul>
    <h3>🌍 World</h3>
    <div class="set-row"><span>Seed <b class="seed-txt">${S.seedText || S.seed}</b> <small>· ${Object.keys(S.biomesSeen || {}).length} biomes discovered</small></span><button class="btn blue small" data-act="seed-copy">Copy seed</button></div>
    <div class="set-row"><span>Mode <b>${S.mode === "creative" ? "🎨 Creative" : "🏆 Career"}</b> · type <b>${(WORLD_TYPES[S.wtype] || WORLD_TYPES.normal).name}</b></span><button class="btn orange small" data-act="to-title">🏠 Worlds menu</button></div>
  </div>`;
}

let pop = null;
function showPopup(ent, def) {
  pop = Object.assign({ ent }, def);
  const el = $("#popup");
  el.innerHTML = `<div class="pp-scroll">${def.render()}</div>`;
  pop.lastSig = def.sig ? def.sig() : "";
  clearTimeout(hidePopup.t);
  el.classList.remove("hidden", "closing");
  el.classList.remove("anim");
  void el.offsetWidth;
  el.classList.add("anim");
  pop.meas = null;
  if (def.live) def.live();
  positionPopup();
  Sfx.play("pop");
}
function hidePopup(instant) {
  if (!pop) return;
  pop = null;
  const el = $("#popup");
  if (instant || THUMB) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("anim");
  el.classList.add("closing");
  clearTimeout(hidePopup.t);
  hidePopup.t = setTimeout(() => {
    el.classList.remove("closing");
    if (!pop) el.classList.add("hidden");
  }, 140);
}
function positionPopup() {
  if (!pop) return;
  const e = pop.ent,
    el = $("#popup");
  const ht = pop.z != null ? pop.z : BUILD[e.t].ht || 20;
  const wtop = P(e.x + e.w / 2, e.y + e.h / 2, ht + 6);
  let [sx, sy] = worldToScreen(wtop[0], wtop[1]);
  const wb = P(e.x + e.w, e.y + e.h),
    syBelow = worldToScreen(wb[0], wb[1])[1];
  const box = el.querySelector(".pp-scroll");
  const TOP = 70,
    BOTTOM = VH - 110;
  const roomAbove = sy - 20 - TOP,
    roomBelow = BOTTOM - syBelow - 20;

  if (!pop.meas || --pop.meas.n <= 0)
    pop.meas = {
      chrome: box ? el.offsetHeight - box.clientHeight : 0,
      h0: box ? box.scrollHeight : el.offsetHeight,
      w: el.offsetWidth,
      n: 20,
    };
  const chrome = box ? pop.meas.chrome : 0,
    h = pop.meas.h0 + chrome,
    w = pop.meas.w;
  let below = false,
    room = Infinity;
  if (h > roomAbove) {
    below = roomBelow > roomAbove;
    if (below) sy = syBelow;
    room = Math.max(160, below ? roomBelow : roomAbove);
  }
  if (box) {
    const mh = h > room ? room - chrome + "px" : "";
    if (box.style.maxHeight !== mh) box.style.maxHeight = mh;
  }
  sx = clamp(sx, w / 2 + 8, VW - w / 2 - 8);
  const L = Math.round(sx * 2) / 2 + "px",
    Tp = Math.round(sy * 2) / 2 + "px";
  if (el.style.left !== L) el.style.left = L;
  if (el.style.top !== Tp) el.style.top = Tp;
  if (pop.below !== below) {
    pop.below = below;
    el.classList.toggle("below", below);
  }
}
function updatePopup() {
  if (!pop) return;
  if (!world.ents.has(pop.ent.id) || pop.ent.dying || pop.ent.moving) {
    hidePopup();
    return;
  }
  if (pop.sig) {
    const s = pop.sig();
    if (s !== pop.lastSig) {
      pop.lastSig = s;

      const box = $("#popup .pp-scroll"),
        html = pop.render();
      if (box) {
        const st = box.scrollTop;
        box.innerHTML = html;
        box.scrollTop = st;
      } else $("#popup").innerHTML = `<div class="pp-scroll">${html}</div>`;
      pop.meas = null;
    }
  }
  if (pop.live) pop.live();
  positionPopup();
}

let dlgCb = null;
function dialog(o) {
  $("#dialog-root").innerHTML =
    `<div class="modal-back dialog-back"><div class="dialog">
    <div class="dialog-title">${o.title}</div><div class="dialog-body">${o.body}</div>
    <div class="dialog-btns">${o.no !== false ? `<button class="btn red" data-act="dlg-no">${o.no || "Cancel"}</button>` : ""}<button class="btn ${o.disabled ? "disabled" : o.cls || "green"}" data-act="dlg-yes" ${o.disabled ? "disabled" : ""}>${o.yes || "OK"}</button></div>
  </div></div>`;
  dlgCb = o.onYes || null;
  Sfx.play("open");
}
function closeDialog() {
  $("#dialog-root").innerHTML = "";
  dlgCb = null;
}
function dialogOpen() {
  return !!$("#dialog-root").innerHTML;
}

function showLevelUp(l, unlocks, reward) {
  const conf = Array.from({ length: 70 }, () => {
    const c = pick([
      "#ffd23f",
      "#ef6351",
      "#6cc04a",
      "#47b2ee",
      "#9b6ce0",
      "#ff9f43",
    ]);
    return `<i style="left:${Math.random() * 100}%;background:${c};animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.6).toFixed(2)}s;transform:rotate(${randi(360)}deg)"></i>`;
  }).join("");
  $("#levelup-root").innerHTML =
    `<div class="levelup"><div class="confetti">${conf}</div><div class="lu-card">
    <div class="lu-rays"></div><div class="lu-star"><span>${l}</span></div>
    <div class="lu-title">Level Up!</div><div class="lu-sub">You reached level ${l}</div>
    <div class="lu-reward">🪙 +${reward}</div>
    ${unlocks.length ? `<div class="lu-unlocks-title">New unlocks</div><div class="lu-unlocks">${unlocks.map((u) => `<div class="lu-u">${u.img ? `<img src="${u.img}">` : `<span>${u.icon}</span>`}<small>${u.name}</small></div>`).join("")}</div>` : ""}
    <button class="btn green big" data-act="lvl-ok">Awesome!</button></div></div>`;
}
function closeLevelUp() {
  $("#levelup-root").innerHTML = "";
}

let questSig = "";
function renderQuest() {
  const q = TUTORIAL[S.tut];
  const sig = S.tut + "|" + S.questMin;
  if (sig === questSig) return;
  questSig = sig;
  const el = $("#quest");
  if (!q) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.classList.toggle("min", !!S.questMin);
  el.innerHTML = `<div class="q-head" data-act="quest-toggle"><span>📜 Quest ${S.tut + 1}/${TUTORIAL.length}</span><span class="q-tg">${S.questMin ? "▸" : "▾"}</span></div>
    <div class="q-body"><div class="q-title">${q.title}</div><div class="q-text">${q.text}</div><div class="q-reward">Reward: 🪙 ${q.reward}</div></div>`;
}
