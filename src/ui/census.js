let cq = "",
  cFilter = "all",
  cLimit = 80;

PANELS.census = {
  title: "👥 Census",
  tabs: [
    { id: "overview", label: "📊 Overview" },
    { id: "people", label: "🧑‍🤝‍🧑 People" },
    { id: "jobs", label: "💼 Jobs" },
    { id: "biz", label: "🏪 Businesses" },
    { id: "budget", label: "💰 Budget" },
    { id: "safety", label: "🚨 Safety" },
    { id: "news", label: "📰 News" },
  ],
  sig: () =>
    [
      S.socHour,
      RES,
      S.selP,
      cFilter,
      cLimit,
      JSON.stringify(S.tax),
      (S.props || []).length,
      S.autoBiz,
      S.news.length,
      panel && panel.tab === "people" ? cq : "",
    ].join("|"),
  render: (t) => renderCensus(t),
};

function stars(r) {
  const n = Math.round(r);
  return `<span class="stars" title="${r.toFixed(1)} / 5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`;
}
function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0;
}
function kpi(icon, val, label, sub, cls) {
  return `<div class="kpi ${cls || ""}"><div class="kpi-ic">${icon}</div><div class="kpi-v">${val}</div><div class="kpi-l">${label}</div>${sub ? `<div class="kpi-s">${sub}</div>` : ""}</div>`;
}
function bar(v, max, col) {
  return `<div class="mbar"><div style="width:${clamp(v / (max || 1), 0, 1) * 100}%;background:${col || "var(--green)"}"></div></div>`;
}
function spark(vals, col, h) {
  if (vals.length < 2)
    return '<div class="spark-empty">History builds up day by day…</div>';
  const H = h || 60,
    W = 300,
    mx = Math.max(...vals, 1),
    mn = Math.min(...vals, 0);
  const pts = vals
    .map(
      (v, i) =>
        `${((i / (vals.length - 1)) * W).toFixed(1)},${(H - 4 - ((v - mn) / (mx - mn || 1)) * (H - 8)).toFixed(1)}`,
    )
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="0,${H} ${pts} ${W},${H}" fill="${col}22" stroke="none"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function entName(e) {
  return e ? BUILD[e.t].name : "-";
}
function locBtn(e) {
  return e
    ? `<button class="mini" data-act="c-locate" data-id="${e.id}" title="Show on map">📍</button>`
    : "";
}

function inCity(p) {
  return (
    !S.cCity ||
    (typeof personCity === "function" && (personCity(p) || {}).id === S.cCity)
  );
}
function cityChips() {
  if (!S.cities || S.cities.length < 2) return "";
  return `<div class="jb-cats">${[["", "🌍 All cities"]]
    .concat(S.cities.map((c) => [c.id, "🏛️ " + c.name]))
    .map(
      ([id, n]) =>
        `<button class="jb-cat ${(S.cCity || "") == id ? "on" : ""}" data-act="c-city" data-id="${id}">${n}</button>`,
    )
    .join("")}</div>`;
}
function renderCensus(tab) {
  if (!S.people) return '<div class="empty-state">Counting residents…</div>';
  if (socDirty) rebuildSocIndex();
  if (tab === "overview" || tab === "people")
    return cityChips() + (tab === "people" ? renderPeople() : renderOverview());
  if (tab === "people") return renderPeople();
  if (tab === "jobs") return renderJobsTab();
  if (tab === "biz") return renderBizTab();
  if (tab === "budget") return renderBudget();
  if (tab === "safety") return renderSafety();
  if (tab === "news") return renderNews();
  return renderOverview();
}

function renderOverview() {
  const ppl = S.people.filter(inCity),
    n = ppl.length || 1;
  let ageSum = 0,
    adults = 0,
    emp = 0,
    wealth = 0,
    kids = 0,
    seniors = 0;
  const homes = new Set(),
    pers = {},
    edu = [0, 0, 0];
  const bands = Array.from({ length: 9 }, () => [0, 0]);
  for (const p of ppl) {
    const a = ageOf(p);
    ageSum += a;
    wealth += p.m;
    homes.add(p.h);
    if (a >= 18 && a < 65) {
      adults++;
      if (p.j || p.k === "commuter") emp++;
    } else if (a < 18) kids++;
    else seniors++;
    pers[p.k] = (pers[p.k] || 0) + 1;
    if (a >= 18) edu[p.ed]++;
    bands[Math.min(8, Math.floor(a / 10))][p.g === "m" ? 0 : 1]++;
  }
  const cap = housingCap(),
    bmax = Math.max(1, ...bands.flat());
  const pyramid = bands
    .map(
      (b, i) =>
        `<div class="pyr-row"><div class="pyr-l">${bar(b[0], bmax, "#64b5f6")}</div><span>${i === 8 ? "80+" : i * 10 + "–" + (i * 10 + 9)}</span><div class="pyr-r">${bar(b[1], bmax, "#f48fb1")}</div></div>`,
    )
    .join("");
  const persList = Object.entries(pers).sort((a, b) => b[1] - a[1]);
  const pmax = persList.length ? persList[0][1] : 1;
  const hist = S.hist.slice().reverse();
  const D = S.socDay || {},
    T = S.soc || {};
  return `<div class="kpis">
      ${kpi("👥", fmt(RES), "Residents", `${fmt(cap)} homes · ${pct(RES, cap)}% full`)}
      ${kpi("🏠", fmt(homes.size), "Households", `${(RES / Math.max(1, homes.size)).toFixed(1)} per home`)}
      ${kpi("🎂", (ageSum / n).toFixed(0), "Average age", `${kids} kids · ${seniors} seniors`)}
      ${kpi("💼", pct(emp, adults) + "%", "Employment", `${S.people.filter((p) => p.k === "commuter").length} commute out · ${S.people.filter((p) => p.k === "unemployed").length} seeking`, pct(emp, adults) < 70 ? "warn" : "")}
      ${kpi("💰", fmt(wealth / n), "Avg savings", "per resident")}
      ${kpi("😊", avgHp() + "%", "Happiness", `town ${CITY.hap}%`, avgHp() < 45 ? "warn" : "")}
      ${kpi("👶", D.births || 0, "Births today", `${T.births || 0} all time`)}
      ${kpi("💍", D.marriages || 0, "Weddings today", `${T.marriages || 0} all time`)}
      ${kpi("🕯️", D.deaths || 0, "Deaths today", `${T.deaths || 0} all time`)}
      ${kpi("🚨", D.crimes || 0, "Crimes today", `${T.arrests || 0} arrests`, (D.crimes || 0) > 2 ? "warn" : "")}
    </div>
    ${advisorHTML()}
    <div class="c-grid">
      <div class="c-card"><div class="c-h">📈 Population</div>${spark(hist.map((h) => h.pop).concat([RES]), "#43a047")}<div class="c-foot">Year ${yearOf(dayNum())} · ${WEEKDAYS[((dayNum() % 7) + 7) % 7]} ${String(hourOfDay()).padStart(2, "0")}:00 · 1 day = 1 year of life</div></div>
      <div class="c-card"><div class="c-h">😊 Happiness</div>${spark(hist.map((h) => h.hp).concat([avgHp()]), "#fb8c00")}<div class="c-foot">Taxes, jobs, services, safety and needs all matter.</div></div>
      <div class="c-card"><div class="c-h">🧬 Age pyramid <small>👨 men · 👩 women</small></div><div class="pyr">${pyramid}</div></div>
      <div class="c-card"><div class="c-h">🧑‍💼 Who lives here</div><div class="pers">${persList.map(([k, v]) => `<div class="pers-row" data-act="c-filter" data-f="${k}"><span>${PERSONAS[k] ? PERSONAS[k].icon : "❔"} ${PERSONAS[k] ? PERSONAS[k].name : k}</span>${bar(v, pmax, "#7e57c2")}<b>${v}</b></div>`).join("")}</div></div>
      <div class="c-card"><div class="c-h">🎓 Education (adults)</div>${EDU.map((nm, i) => `<div class="pers-row"><span>${["📕", "🎒", "🎓"][i]} ${nm}</span>${bar(edu[i], Math.max(...edu, 1), "#26a69a")}<b>${edu[i]}</b></div>`).join("")}<div class="c-foot">Schools and a University raise education - needed for doctors, teachers, scientists and tech jobs.</div></div>
    </div>`;
}

function advisorHTML() {
  const tips = [];
  const bal = needBalance(),
    adults = S.people.filter((p) => ageOf(p) >= 18 && ageOf(p) < 65),
    unemp = adults.filter(
      (p) => !p.j && !["undergrad", "entrepreneur", "staff"].includes(p.k),
    ).length;
  const sugg = {
    food: ["bistro", "grocery", "cornershop", "restaurant"],
    fun: ["park", "cinema", "pub", "gym"],
    shop: ["boutique", "bookshop", "mall", "florist"],
    care: ["barbershop", "salon"],
    health: ["clinic", "pharmacy", "hospital"],
  };
  const buy = (t) =>
    BUILD[t] && S.level >= BUILD[t].level
      ? `<button class="btn small green" data-act="c-build" data-id="${t}">${BUILD[t].icon} Build ${BUILD[t].name}</button>`
      : "";
  for (const n in bal)
    if (bal[n].ratio < 0.7 && RES > 20)
      tips.push([
        NEEDS[n].icon,
        `Residents want more <b>${NEEDS[n].name.toLowerCase()}</b> (${bal[n].sup}/${bal[n].dem} visits an hour available).`,
        sugg[n].map(buy).filter(Boolean).slice(0, 2).join("") +
          (n === "food" &&
          [...world.ents.values()].some(
            (e) => FOOD_SHOPS.has(e.t) && e.biz && !e.biz.open,
          )
            ? "<small> or open a storefront on your food factories</small>"
            : ""),
      ]);
  if (unemp > adults.length * 0.15 && unemp > 5)
    tips.push([
      "💼",
      `<b>${unemp}</b> adults are looking for work.`,
      ["office", "grocery", "bakery"]
        .map(buy)
        .filter(Boolean)
        .slice(0, 2)
        .join(""),
    ]);
  if (
    !hasType("school") &&
    S.people.some((p) => ageOf(p) >= 6 && ageOf(p) < 18)
  )
    tips.push([
      "🏫",
      "Children have no school - they'll grow up without a diploma.",
      buy("school"),
    ]);
  if (!hasType("police") && (S.soc.crimes || 0) > 0)
    tips.push([
      "🚓",
      "Crime is going unpunished. A Police Station sends officers to every call.",
      buy("police"),
    ]);
  if (!hasType("firestation") && (S.soc.fires || 0) > 0)
    tips.push([
      "🚒",
      "Fires burn buildings down without a Fire Station.",
      buy("firestation"),
    ]);
  if (S.tax.inc > 12)
    tips.push([
      "🧾",
      `Income tax is high (${S.tax.inc}%) - people are less happy and fewer move in.`,
      '<button class="btn small blue" data-act="tab" data-tab="budget">Open budget</button>',
    ]);
  const vacant = housingCap() - RES;
  if (vacant > 20 && CITY.hap < 45)
    tips.push([
      "🏚️",
      `${vacant} homes are empty because the town isn't attractive. Improve happiness.`,
      "",
    ]);
  if (!tips.length)
    return '<div class="advisor ok">✅ Your residents are doing well. Keep growing!</div>';
  return `<div class="advisor"><div class="adv-h">🧭 Advisor</div>${tips
    .slice(0, 5)
    .map(
      ([i, t, b]) =>
        `<div class="adv-row"><span class="adv-ic">${i}</span><div class="adv-t">${t}</div><div class="adv-b">${b}</div></div>`,
    )
    .join("")}</div>`;
}

const C_FILTERS = [
  ["all", "Everyone"],
  ["adults", "Adults"],
  ["kids", "Children"],
  ["seniors", "Seniors"],
  ["unemployed", "Job seekers"],
  ["criminal", "Criminals"],
  ["entrepreneur", "Owners"],
  ["sick", "Sick"],
  ["single", "Singles"],
];
function personMatch(p) {
  if (!inCity(p)) return false;
  const a = ageOf(p);
  if (cFilter === "adults" && (a < 18 || a >= 65)) return false;
  if (cFilter === "kids" && a >= 18) return false;
  if (cFilter === "seniors" && a < 65) return false;
  if (cFilter === "sick" && !p.sk) return false;
  if (cFilter === "single" && (p.sp || a < 18)) return false;
  if (
    !["all", "adults", "kids", "seniors", "sick", "single"].includes(cFilter) &&
    p.k !== cFilter
  )
    return false;
  if (cq) {
    const s = (pName(p) + " " + persona(p).name).toLowerCase();
    if (!s.includes(cq)) return false;
  }
  return true;
}
function renderPeople() {
  const list = S.people.filter(personMatch);
  if (!S.selP || !PEOPLE.has(S.selP)) S.selP = list.length ? list[0].id : null;
  const chips =
    C_FILTERS.map(
      ([k, n]) =>
        `<button class="jb-cat ${cFilter === k ? "on" : ""}" data-act="c-filter" data-f="${k}">${n}</button>`,
    ).join("") +
    (C_FILTERS.some(([k]) => k === cFilter)
      ? ""
      : `<button class="jb-cat on" data-act="c-filter" data-f="all">${persona({ k: cFilter }).icon} ${persona({ k: cFilter }).name} ✕</button>`);
  const rows = list
    .slice(0, cLimit)
    .map(
      (p) =>
        `<button class="sl-row ${p.id === S.selP ? "sel" : ""}" data-act="c-person" data-id="${p.id}"><span class="avatar sm" style="background:${p.g === "m" ? "#e3f2fd" : "#fce4ec"}">${pFace(p)}</span><span class="sl-id"><span class="sl-name">${pName(p)}</span><span class="sl-status">${persona(p).icon} ${persona(p).name} · ${Math.floor(ageOf(p))}</span></span>${p.sk ? "🤒" : ""}${p.jail ? "🔒" : ""}</button>`,
    )
    .join("");
  const sel = S.selP && PEOPLE.get(S.selP);
  return `<div class="c-search"><input id="census-q" type="search" placeholder="🔍 Search ${fmt(RES)} residents by name or job…" value="${cq.replace(/"/g, "&quot;")}" autocomplete="off"><span class="c-count">${fmt(list.length)} found</span></div>
    <div class="jb-cats">${chips}</div>
    <div class="staff-split"><div class="staff-list">${rows || '<div class="empty-state small">Nobody matches.</div>'}${list.length > cLimit ? `<button class="btn small blue more" data-act="c-more">Show more (${list.length - cLimit})</button>` : ""}</div>
    <div class="staff-detail">${sel ? personCard(sel) : ""}</div></div>`;
}
function activityOf(p) {
  if (p.jail)
    return `🔒 In jail (${p.jail} more day${p.jail === 1 ? "" : "s"})`;
  if (p.st === "x") return "🏥 In hospital";
  const at = p.at && world.ents.get(p.at);
  if (p.st === "w")
    return p.j < 0 ? "🪪 Working on your staff" : `💼 At work · ${entName(at)}`;
  if (p.st === "s") return ageOf(p) >= 18 ? "🎓 At university" : "🏫 At school";
  if (p.st === "o" && at)
    return `${NEEDS[venueSpec(at.t) ? venueSpec(at.t).need : "fun"].icon} Out at the ${entName(at)}`;
  const h = hourOfDay();
  return h >= 23 || h < 6 ? "😴 Asleep at home" : "🏠 At home";
}
function personCard(p) {
  const home = p.h && world.ents.get(p.h),
    job = p.j > 0 && world.ents.get(p.j),
    w = p.j < 0 && S.workers.find((x) => x.id === -p.j);
  const sp = p.sp && PEOPLE.get(p.sp);
  const link = (q, rel) =>
    q
      ? `<button class="fam" data-act="c-person" data-id="${q.id}">${pFace(q)} ${pFirst(q)} <small>${rel}${ageOf(q) < 18 ? " · " + Math.floor(ageOf(q)) : ""}</small></button>`
      : "";
  const kids = p.ki.map((id) => PEOPLE.get(id)).filter(Boolean),
    pars = p.pa.map((id) => PEOPLE.get(id)).filter(Boolean);
  const need = (ic, nm, v) =>
    `<div class="need"><span>${ic} ${nm}</span>${bar(v, 100, v < 30 ? "var(--red)" : v < 60 ? "var(--orange)" : "var(--green)")}</div>`;
  return `<div class="staff-card person">
    <div class="sc-head"><div class="avatar big" style="background:${p.g === "m" ? "#e3f2fd" : "#fce4ec"}">${pFace(p)}</div><div class="sc-id"><div class="sc-name">${pName(p)}</div><div class="sc-role">${persona(p).icon} ${persona(p).name} · ${Math.floor(ageOf(p))} years old</div></div><div class="hp-badge" title="Happiness">${p.hp >= 70 ? "😄" : p.hp >= 45 ? "🙂" : p.hp >= 25 ? "😕" : "😠"} ${Math.round(p.hp)}%</div></div>
    <div class="p-now">${activityOf(p)}</div>
    <div class="p-facts">
      <div><span>🏠 Home</span><b>${home ? entName(home) : "Homeless"}</b>${locBtn(home)}</div>
      <div><span>💼 Work</span><b>${job ? `${entName(job)} · 🪙${wageOfJob(job)}/day` : w ? `${ROLES[w.role].icon} ${ROLES[w.role].name} (your staff)` : ageOf(p) < 18 ? "-" : p.k === "retiree" ? "Retired" : p.k === "undergrad" ? "Studying" : `Unemployed ${p.un ? p.un + " days" : ""}`}</b>${locBtn(job)}</div>
      <div><span>🎓 Education</span><b>${EDU[p.ed]}</b></div>
      <div><span>💰 Savings</span><b>🪙${fmt(p.m)}</b></div>
      ${p.cr ? `<div><span>📁 Record</span><b>${p.cr} crime${p.cr === 1 ? "" : "s"}</b></div>` : ""}
      ${p.fm ? `<div><span>⭐ Fame</span><b>${p.fm}</b></div>` : ""}
      ${p.sk ? "<div><span>🤒 Health</span><b>Sick - needs a clinic</b></div>" : ""}
    </div>
    ${ageOf(p) >= 3 ? `<div class="needs">${need("🍽️", "Food", p.nf)}${need("🎉", "Fun", p.nu)}${need("🛍️", "Shopping", p.ns)}${need("💇", "Care", p.nc)}</div>` : ""}
    ${sp || kids.length || pars.length ? `<div class="fam-row">${link(sp, p.g === sp?.g ? "partner" : sp?.g === "f" ? "wife" : "husband")}${kids.map((k) => link(k, k.g === "f" ? "daughter" : "son")).join("")}${pars.map((q) => link(q, q.g === "f" ? "mother" : "father")).join("")}</div>` : ""}
    <div class="c-h">📖 Life story</div><div class="story">${p.lg.map(([d, i, t]) => `<div><small>Year ${d}</small> ${i} ${t}</div>`).join("") || "<div><small>-</small> A quiet life so far.</div>"}</div>
  </div>`;
}

function renderJobsTab() {
  const sectors = {};
  let open = 0,
    filled = 0;
  const openings = [];
  for (const e of world.ents.values()) {
    const n = positionsOf(e);
    if (!n) continue;
    const s = jobSpec(e.t),
      have = (jobEmp.get(e.id) || []).length;
    const k =
      sectors[s.k] ||
      (sectors[s.k] = { n: 0, have: 0, wage: s.w, e: s.e || 0 });
    k.n += n;
    k.have += Math.min(have, n);
    filled += Math.min(have, n);
    open += Math.max(0, n - have);
    if (have < n) openings.push({ e, open: n - have, s });
  }
  const seekers = S.people.filter(
    (p) =>
      !p.j &&
      ageOf(p) >= 18 &&
      ageOf(p) < 65 &&
      !["undergrad", "entrepreneur", "retiree"].includes(p.k),
  );
  const byEd = [0, 0, 0];
  for (const p of seekers) byEd[p.ed]++;
  openings.sort((a, b) => b.open - a.open);
  const rows = Object.entries(sectors)
    .sort((a, b) => b[1].n - a[1].n)
    .map(
      ([k, v]) =>
        `<tr><td>${PERSONAS[k].icon} ${PERSONAS[k].name}</td><td>${v.have}/${v.n}</td><td>${bar(v.have, v.n, v.have >= v.n ? "var(--green)" : "var(--orange)")}</td><td>🪙${v.wage}</td><td>${v.e ? EDU[v.e] : "Anyone"}</td></tr>`,
    )
    .join("");
  return `<div class="kpis">${kpi("💼", fmt(filled), "Jobs filled")}${kpi("📋", fmt(open), "Open positions", "", open > 0 && seekers.length > 0 ? "warn" : "")}${kpi("🔎", fmt(seekers.length), "Job seekers", `${byEd[0]} no diploma · ${byEd[1]} school · ${byEd[2]} degree`)}${kpi("🪪", S.workers.length, "Your staff", "hired via 👷 Staff")}</div>
    ${open > 0 && seekers.length > 0 ? `<div class="hint">ℹ️ Some jobs stay open because applicants lack the education they need (or can't reach them by road). Build schools & a university, and connect workplaces to roads.</div>` : ""}
    <div class="c-grid"><div class="c-card wide"><div class="c-h">🏭 Jobs by profession</div><table class="c-table"><tr><th>Profession</th><th>Filled</th><th></th><th>Wage/day</th><th>Needs</th></tr>${rows}</table></div>
    <div class="c-card"><div class="c-h">📋 Biggest openings</div>${
      openings
        .slice(0, 12)
        .map(
          (o) =>
            `<div class="pers-row"><span>${BUILD[o.e.t].icon} ${BUILD[o.e.t].name}</span><small>${o.open} × ${PERSONAS[o.s.k].name}${o.s.e ? " · " + EDU[o.s.e] : ""}</small>${locBtn(o.e)}</div>`,
        )
        .join("") || '<div class="c-foot">Every job is filled.</div>'
    }</div></div>`;
}

function renderBizTab() {
  const props = (S.props || [])
    .map((pr) => {
      const p = PEOPLE.get(pr.pid);
      if (!p) return "";
      const b = BUILD[pr.t];
      return `<div class="prop"><span class="avatar sm">${pFace(p)}</span><div class="prop-t"><b>${pName(p)}</b> wants to ${pr.lease ? "take over the empty" : "open a"} <b>${b.icon} ${b.name}</b><small>${b.biz && b.biz.need ? NEEDS[b.biz.need].icon + " " + NEEDS[b.biz.need].name : "🏢 offices"} · ${b.biz ? b.biz.job.n : 0} jobs · permit fee 🪙${pr.fee} to you · savings 🪙${fmt(p.m)}</small></div><button class="mini" data-act="c-goto" data-x="${pr.x}" data-y="${pr.y}">📍</button><button class="btn small green" data-act="c-approve" data-id="${pr.id}">Approve</button><button class="btn small red" data-act="c-decline" data-id="${pr.id}">✕</button></div>`;
    })
    .join("");
  const bal = needBalance();
  const list = [...world.ents.values()].filter(
    (e) => e.biz && usable(e) && (venueSpec(e.t) || BUILD[e.t].biz),
  );
  list.sort(
    (a, b) =>
      ((b.biz.hist[0] || {}).rev || 0) - ((a.biz.hist[0] || {}).rev || 0),
  );
  const rows = list
    .map((e) => {
      const b = e.biz,
        v = venueSpec(e.t),
        own = b.vacant
          ? "<i>For lease</i>"
          : isCity(e)
            ? "🏛️ City"
            : PEOPLE.get(b.own)
              ? pFace(PEOPLE.get(b.own)) + " " + pName(PEOPLE.get(b.own))
              : "-";
      const y = b.hist[0] || {};
      return `<tr class="${b.vacant || !b.open ? "dim" : ""}"><td>${BUILD[e.t].icon} ${BUILD[e.t].name}</td><td>${own}</td><td>${v ? NEEDS[v.need].icon : "🏢"}</td><td>${(jobEmp.get(e.id) || []).length}/${positionsOf(e)}</td><td>${stars(b.rating)}</td><td>${b.cust}${y.cust != null ? ` <small>(${y.cust})</small>` : ""}</td><td>🪙${fmt(b.rev)}${y.profit != null ? ` <small class="${y.profit < 0 ? "neg" : "pos"}">${y.profit >= 0 ? "+" : ""}${fmt(y.profit)}</small>` : ""}</td><td>${locBtn(e)}</td></tr>`;
    })
    .join("");
  return `${props ? `<div class="c-card"><div class="c-h">📨 Business proposals <small>residents want to invest in Meadowvale</small></div>${props}</div>` : ""}
    <div class="c-card"><div class="c-h">⚖️ Supply & demand <small>visits per hour residents want vs. what places can serve</small></div>${Object.keys(
      NEEDS,
    )
      .map(
        (n) =>
          `<div class="pers-row"><span>${NEEDS[n].icon} ${NEEDS[n].name}</span>${bar(bal[n].sup, Math.max(bal[n].dem, bal[n].sup, 1), bal[n].ratio >= 1 ? "var(--green)" : bal[n].ratio >= 0.6 ? "var(--orange)" : "var(--red)")}<small>${bal[n].sup}/${bal[n].dem}</small></div>`,
      )
      .join("")}
      <div class="toggle-row"><span>🤝 Approve business proposals automatically</span><button class="toggle sm ${S.autoBiz ? "on" : ""}" data-act="c-autobiz"><i></i></button></div></div>
    <div class="c-card wide"><div class="c-h">🏪 All places residents visit <small>today's customers (yesterday) · revenue (yesterday's profit)</small></div>
      <table class="c-table"><tr><th>Place</th><th>Owner</th><th>For</th><th>Staff</th><th>Rating</th><th>Visitors</th><th>Revenue</th><th></th></tr>${rows || '<tr><td colspan="8">No venues yet.</td></tr>'}</table></div>`;
}

function renderBudget() {
  const B = S.bud,
    rev = B.inc + B.sales + B.biz + B.venue + B.fines + B.permits;
  const line = (ic, nm, v, neg) =>
    `<div class="bud-row"><span>${ic} ${nm}</span><b class="${neg ? "neg" : "pos"}">${neg ? "−" : "+"}🪙${fmt(v)}</b></div>`;
  const slider = (k, nm, desc, max) =>
    `<div class="tax"><div class="tax-h"><b>${nm}</b><span class="tax-v">${S.tax[k]}%</span></div><input type="range" min="0" max="${max}" value="${S.tax[k]}" data-change="c-tax" data-k="${k}"><small>${desc}</small></div>`;
  const hist = S.budHist.slice().reverse();
  const hmax = Math.max(
    1,
    ...hist.map((d) =>
      Math.max(
        d.inc + d.sales + d.biz + d.venue + d.fines + d.permits,
        d.wages,
      ),
    ),
  );
  const bars = hist
    .map((d) => {
      const r = d.inc + d.sales + d.biz + d.venue + d.fines + d.permits;
      return `<div class="hb" title="Day ${d.d}: +${Math.round(r)} / −${Math.round(d.wages)}"><div class="hb-r" style="height:${(r / hmax) * 100}%"></div><div class="hb-e" style="height:${(d.wages / hmax) * 100}%"></div></div>`;
    })
    .join("");
  return `<div class="c-grid">
    <div class="c-card"><div class="c-h">🧾 Tax rates</div>
      ${slider("inc", "💼 Income tax", "Taken from every wage. Above 8% residents get unhappy and fewer move in.", 25)}
      ${slider("sales", "🛍️ Sales tax", "On every purchase at private businesses. Above 6% shoppers grumble.", 20)}
      ${slider("biz", "🏢 Business tax", "On private business profits. High rates mean fewer new businesses and more closures.", 40)}</div>
    <div class="c-card"><div class="c-h">📅 Today so far <small>deposited every hour</small></div>
      ${line("💼", "Income tax", B.inc)}${line("🛍️", "Sales tax", B.sales)}${line("🏢", "Business tax", B.biz)}${line("🏛️", "City-run venues & shops", B.venue)}${line("⚖️", "Fines", B.fines)}${line("📝", "Permit fees", B.permits)}
      ${line("👮", "Wages: public services (after the 70% state grant) & city venues", B.wages, true)}
      <div class="bud-row tot"><span>Net</span><b class="${rev - B.wages < 0 ? "neg" : "pos"}">${rev - B.wages < 0 ? "−" : "+"}🪙${fmt(Math.abs(rev - B.wages))}</b></div>
      <div class="c-foot">Rent from homes is collected separately (tap houses or hire a Rent Collector). Factory & farm workers are paid from what they produce.</div></div>
    <div class="c-card wide"><div class="c-h">📊 Last ${hist.length} days <small><i class="lg r"></i> revenue <i class="lg e"></i> public wages</small></div><div class="hbars">${bars || '<div class="spark-empty">History builds up day by day…</div>'}</div></div></div>`;
}

function renderSafety() {
  let homes = 0;
  const cov = { safety: 0, fire: 0, health: 0, education: 0 };
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) {
      if (!usable(e)) continue;
      homes++;
      for (const s of e.svc || []) if (cov[s] != null) cov[s]++;
    }
  const T = S.soc,
    crim = S.people.filter((p) => p.k === "criminal"),
    jail = S.people.filter((p) => p.jail);
  const burnt = [...world.ents.values()].filter((e) => e.burnt),
    burning = [...world.ents.values()].filter((e) => e.fire && e.fire > NOW);
  const covRow = (ic, nm, k, t) =>
    `<div class="pers-row"><span>${ic} ${nm}</span>${bar(cov[k], homes, pct(cov[k], homes) > 70 ? "var(--green)" : "var(--orange)")}<small>${pct(cov[k], homes)}%</small>${!hasType(t) && BUILD[t] && S.level >= BUILD[t].level ? `<button class="btn small green" data-act="c-build" data-id="${t}">Build</button>` : ""}</div>`;
  return `<div class="kpis">${kpi("🦹", crim.length, "Known criminals")}${kpi("🚨", T.crimes || 0, "Crimes", `${T.prevented || 0} prevented by patrols`)}${kpi("🚔", T.arrests || 0, "Arrests", `${jail.length} in jail now`)}${kpi("🔥", T.fires || 0, "Fires", `${T.firesSaved || 0} put out`)}${kpi("🕊️", T.reformed || 0, "Reformed", "found honest work")}</div>
    <div class="c-grid"><div class="c-card"><div class="c-h">🛡️ Homes covered by services</div>${covRow("🚓", "Police", "safety", "police")}${covRow("🚒", "Fire", "fire", "firestation")}${covRow("🏥", "Health", "health", "clinic")}${covRow("🎓", "Education", "education", "school")}<div class="c-foot">Criminals strike at night where there are no patrols. Fires start more often near industry and in heatwaves.</div></div>
    <div class="c-card"><div class="c-h">🏚️ Damage</div>${burning.map((e) => `<div class="pers-row"><span>🔥 ${BUILD[e.t].name} is burning!</span>${locBtn(e)}</div>`).join("")}${burnt.map((e) => `<div class="pers-row"><span>🏚️ ${BUILD[e.t].name}</span><button class="btn small orange" data-act="c-repair" data-id="${e.id}">Rebuild · 🪙${repairCost(e)}</button>${locBtn(e)}</div>`).join("") || (burning.length ? "" : '<div class="c-foot">No damaged buildings.</div>')}</div></div>
    <div class="c-card"><div class="c-h">📰 Recent incidents</div>${
      S.news
        .filter((n) => "🔥🚒🚔🦹🏚️".includes(n.i))
        .slice(0, 12)
        .map(newsRow)
        .join("") || '<div class="c-foot">All quiet.</div>'
    }</div>`;
}
function newsRow(n) {
  return `<div class="news-row"><span class="news-t">Day ${n.d} · ${String(n.h).padStart(2, "0")}:00</span><span class="news-i">${n.i}</span><span>${n.t}</span></div>`;
}
function renderNews() {
  return `<div class="c-card">${S.news.map(newsRow).join("") || '<div class="c-foot">No news yet.</div>'}</div>`;
}

const SOURCE = {};
function buildSources() {
  for (const t in BUILD) {
    const b = BUILD[t];
    if (b.recipes)
      for (const r of b.recipes) {
        const out = (RECIPES[r] && RECIPES[r].out) || r;
        if (!SOURCE[out]) SOURCE[out] = { t };
      }
    if (b.animal && b.out && !SOURCE[b.out]) SOURCE[b.out] = { t };
    if (b.produce && b.produce.item && !SOURCE[b.produce.item])
      SOURCE[b.produce.item] = { t };
    if (b.orchard && b.orchard.item && !SOURCE[b.orchard.item])
      SOURCE[b.orchard.item] = { t };
  }
  for (const k in CROPS) SOURCE[k] = { crop: true };
}
function sourceHint(k, need) {
  if (!Object.keys(SOURCE).length) buildSources();
  const s = SOURCE[k],
    it = ITEMS[k];
  if (!s)
    return `<div class="src-row"><span>${it.icon} ${it.name}</span><small>Trains, ships, events or 🧱 Supplies</small></div>`;
  if (s.crop) {
    const c = CROPS[k];
    return `<div class="src-row"><span>${it.icon} ${it.name} ×${need}</span>${S.level >= c.level ? `<button class="btn small green" data-act="c-plant" data-id="${k}">🌱 Plant (${S.seeds[k] || 0} seeds)</button>` : `<small>🔒 crop unlocks at level ${c.level}</small>`}</div>`;
  }
  const b = BUILD[s.t],
    own = hasType(s.t);
  return `<div class="src-row"><span>${it.icon} ${it.name} ×${need}</span>${own ? `<button class="btn small blue" data-act="c-locate" data-id="${own.id}">${b.icon} Make at ${b.name}</button>` : S.level >= b.level ? `<button class="btn small green" data-act="c-build" data-id="${s.t}">🏗️ Build ${b.name} · 🪙${fmt(b.cost)}</button>` : `<small>${b.icon} ${b.name} unlocks at level ${b.level}</small>`}</div>`;
}
function missingFor(e) {
  const b = BUILD[e.t];
  if (!b.recipes) return "";
  const miss = {};
  for (const r of b.recipes) {
    const R = RECIPES[r];
    if (!R || S.level < R.level) continue;
    for (const [k, n] of Object.entries(R.in))
      if ((S.inv[k] || 0) < n)
        miss[k] = Math.max(miss[k] || 0, n - (S.inv[k] || 0));
  }
  const ks = Object.keys(miss);
  if (!ks.length) return "";
  return `<details class="pp-sec"><summary>🧩 Missing ingredients (${ks.length}) - where to get them</summary>${ks.map((k) => sourceHint(k, miss[k])).join("")}</details>`;
}
function staffHTML(e) {
  const pos = positionsOf(e),
    s = jobSpec(e.t);
  if (!s) return "";
  const emp = employeesOf(e),
    b = e.biz;
  const canSet = b && (isCity(e) || b.vacant === false) && venueSpec(e.t);
  const pool = S.people.filter(
    (p) =>
      !p.j &&
      !p.jail &&
      ageOf(p) >= 18 &&
      ageOf(p) < 65 &&
      !["undergrad", "retiree", "entrepreneur", "staff"].includes(p.k),
  );
  const qualified = pool.filter((p) => p.ed >= (s.e || 0));
  const seekers = qualified.filter((p) => {
    const h = world.ents.get(p.h);
    return h && reachable(h, e);
  }).length;
  const blockedByRoad = qualified.length - seekers,
    blockedByEdu = pool.length - qualified.length;
  const fr = frontRoad(e);
  return `<div class="pp-sec"><div class="pp-sec-h">👥 Staff <b>${emp.length}/${pos}</b> <small>${PERSONAS[s.k].icon} ${PERSONAS[s.k].name}s · 🪙${wageOfJob(e)}/day${s.e ? ` · needs a ${EDU[s.e].toLowerCase()}` : " · anyone can apply"}</small></div>
    <div class="faces">${emp
      .slice(0, 14)
      .map(
        (p) =>
          `<button class="face" data-act="c-open-person" data-id="${p.id}" title="${pName(p)}">${pFace(p)}</button>`,
      )
      .join(
        "",
      )}${emp.length > 14 ? `<small>+${emp.length - 14}</small>` : ""}${emp.length < pos ? `<small class="openings">${pos - emp.length} opening${pos - emp.length === 1 ? "" : "s"} · ${seekers} qualified applicant${seekers === 1 ? "" : "s"}</small>` : ""}</div>
    ${canSet && isCity(e) ? `<div class="cfg-row"><span>Positions</span><div class="stepper"><button data-act="b-pos" data-d="-1">−</button><b>${pos}</b><button data-act="b-pos" data-d="1">+</button></div><span>Pay</span><div class="seg">${["Low", "Fair", "High"].map((n, i) => `<button class="${b.wageLv === i ? "on" : ""}" data-act="b-wage" data-v="${i}">${n}</button>`).join("")}</div></div>` : ""}
    ${!fr ? '<div class="pp-warn">🚧 No road next to this building - residents far away can\'t get here.</div>' : ""}
    ${emp.length < pos && s.e ? `<div class="pp-note">🎓 A ${EDU[s.e].toLowerCase()} is an education level, not a building - ${EDU_HOW[s.e]}. Many newcomers already have one.</div>` : ""}
    ${emp.length < pos && seekers ? `<div class="pp-note">⏳ ${seekers} qualified job seeker${seekers === 1 ? "" : "s"} will be hired within the next game hour.</div>` : ""}
    ${emp.length < pos && blockedByRoad > 0 ? `<div class="pp-warn">🚧 ${blockedByRoad} qualified resident${blockedByRoad === 1 ? "" : "s"} can't get here - connect this building to their street with a road.</div>` : ""}
    ${emp.length < pos && !seekers && !blockedByRoad ? `<div class="pp-note">No qualified residents are looking for work${blockedByEdu ? ` (${blockedByEdu} job seeker${blockedByEdu === 1 ? " lacks" : "s lack"} the education)` : ""}. Build more homes to attract workers${s.e ? ", and schools to educate the next generation" : ""}.</div>` : ""}
    ${FACTORY_TYPES.includes(e.t) ? `<div class="pp-note">Want it fully automated? Hire a 👷 Factory Manager on the <a data-act="p-open" data-id="staff">Job Board</a>.</div>` : ""}</div>`;
}
function venueHTML(e) {
  const v = venueSpec(e.t);
  if (!v) return "";
  const b = bizState(e),
    y = b.hist[0];
  const own = b.own && b.own !== "city" && PEOPLE.get(b.own);
  let head = "";
  if (BUILD[e.t].biz) {
    if (b.vacant)
      head = `<div class="pp-note">🪧 Empty - an entrepreneur will lease it soon, or run it yourself.</div><button class="btn small green" data-act="b-cityrun">🏛️ Run it as a city business</button>`;
    else if (own)
      head = `<div class="pp-note">${pFace(own)} Owned by <a data-act="c-open-person" data-id="${own.id}">${pName(own)}</a> · you collect ${S.tax.sales}% sales tax + ${S.tax.biz}% business tax.</div>`;
    else
      head = `<div class="pp-note">🏛️ City-run: you keep the takings and pay the wages. <a data-act="b-lease">Lease it to a resident</a></div>`;
  }
  let store = "";
  if (v.goods) {
    const items = shopItems(e);
    store = `<div class="cfg-row"><span>🏪 Storefront</span><button class="toggle sm ${b.open ? "on" : ""}" data-act="b-open"><i></i></button><small>${b.open ? "open to residents" : "closed"}</small></div>
      <div class="pp-note">Sells ${items.map((k) => ITEMS[k].icon).join("")} from your barn to residents (${b.item ? `${b.srv} serving${b.srv === 1 ? "" : "s"} of ${ITEMS[b.item].icon} left` : "nothing on the shelf yet"}). Each item serves several customers and earns ~15% more than an order would.</div>
      <div class="cfg-row"><span>Keep for orders</span><div class="stepper"><button data-act="b-keep" data-d="-1">−</button><b>${b.keep}</b><button data-act="b-keep" data-d="1">+</button></div><small>of each</small></div>`;
  }
  return `<div class="pp-sec"><div class="pp-sec-h">${NEEDS[v.need].icon} ${NEEDS[v.need].name} ${stars(b.rating)}</div>${head}${store}
    <div class="vstats"><div><b>${b.cust}</b><small>visitors today</small></div><div><b>🪙${fmt(b.rev)}</b><small>takings today</small></div>${y ? `<div><b class="${(y.profit || 0) < 0 ? "neg" : ""}">🪙${fmt(y.profit || 0)}</b><small>profit yesterday</small></div>` : ""}${b.turned ? `<div><b class="neg">${b.turned}</b><small>turned away</small></div>` : ""}</div>
    ${v.price || v.goods ? `<div class="cfg-row"><span>Prices</span><div class="seg">${["Cheap", "Normal", "Premium"].map((n, i) => `<button class="${b.priceLv === i ? "on" : ""}" data-act="b-price" data-v="${i}">${n}</button>`).join("")}</div><small>🪙${v.goods ? servePrice(e) : Math.round(v.price * [0.8, 1, 1.3][b.priceLv])}/visit</small></div>` : ""}
    ${b.turned > 3 ? '<div class="pp-warn">Customers are being turned away - add staff' + (v.goods ? " or keep it stocked" : "") + ".</div>" : ""}</div>`;
}
function residentsHTML(e) {
  const noRoad = !frontRoad(e)
    ? '<div class="pp-warn">🚧 No road next to this home - its residents can only work and shop within a short walk. Build a road beside it.</div>'
    : "";
  const rs = residentsOf(e);
  if (!rs.length)
    return `<div class="pp-sec">${noRoad}<div class="pp-note">🏚️ Empty - new residents move in when the town is attractive.</div></div>`;
  return `<div class="pp-sec">${noRoad}<div class="pp-sec-h">🏠 Residents ${rs.length}/${popOf(e)}</div><div class="res-list">${rs
    .slice(0, 12)
    .map(
      (p) =>
        `<button class="res" data-act="c-open-person" data-id="${p.id}">${pFace(p)} <span>${pFirst(p)} <small>${Math.floor(ageOf(p))} · ${persona(p).icon}</small></span></button>`,
    )
    .join(
      "",
    )}${rs.length > 12 ? `<small>+${rs.length - 12} more</small>` : ""}</div></div>`;
}
function extraInfo(e) {
  if (!S.people || !e || BUILD[e.t].nature || e.t === "field" || e.build)
    return "";
  let h = "";
  if (HOUSE_TYPES.includes(e.t)) h += residentsHTML(e);
  if (venueSpec(e.t)) h += venueHTML(e);
  if (jobSpec(e.t) && (positionsOf(e) || (e.biz && !e.biz.vacant)))
    h += staffHTML(e);
  if (FACTORY_TYPES.includes(e.t)) h += missingFor(e);
  return h;
}
const _showPopupCensus = showPopup;
showPopup = function (ent, def) {
  if (ent && def && def.render && !def.noExtra) {
    const r0 = def.render,
      s0 = def.sig;
    def = Object.assign({}, def, {
      render: () => {
        const html = r0(),
          x = extraInfo(ent);
        if (!x) return html;
        const i = html.lastIndexOf('<div class="pp-btns');
        return i < 0 ? html + x : html.slice(0, i) + x + html.slice(i);
      },
      sig: () =>
        (s0 ? s0() : "") +
        "|" +
        S.socHour +
        "|" +
        (ent.biz
          ? JSON.stringify([
              ent.biz.open,
              ent.biz.keep,
              ent.biz.wageLv,
              ent.biz.priceLv,
              ent.biz.staffN,
              ent.biz.vacant,
              ent.biz.own,
            ])
          : "") +
        employeesOf(ent).length,
    });
  }
  return _showPopupCensus(ent, def);
};

const _onEntityClickCensus = onEntityClick;
onEntityClick = function (e, sx, sy) {
  if (!e) return;
  if (e.burnt) {
    showPopup(e, {
      noExtra: true,
      sig: () => "" + (S.coins >= repairCost(e)),
      render: () =>
        `<div class="pp-title">🏚️ ${BUILD[e.t].name} (burned down)</div><div class="pp-sub">It burned before firefighters arrived. Nothing works here until it's rebuilt.${hasType("firestation") ? "" : " A 🚒 Fire Station would have saved it."}</div><div class="pp-btns"><button class="btn ${S.coins >= repairCost(e) ? "orange" : "disabled"}" data-act="c-repair" data-id="${e.id}">🔨 Rebuild · 🪙${repairCost(e)}</button><button class="btn red small" data-act="p-sell">Demolish</button></div>`,
    });
    return;
  }
  if (e.build || (e.fire && e.fire > NOW))
    return _onEntityClickCensus(e, sx, sy);

  const b = BUILD[e.t];
  if (
    (b.cat === "civic" ||
      b.cat === "biz" ||
      b.cat === "util" ||
      b.cat === "wonder") &&
    !b.produce &&
    !["museum", "mine", "institute"].includes(e.t)
  ) {
    decorPopup(e);
    return;
  }
  return _onEntityClickCensus(e, sx, sy);
};

function sportsDay(d) {
  const st = hasType("stadium");
  if (st && ((d % 7) + 7) % 7 === 6 && usable(st)) {
    const ath = employeesOf(st),
      rival = pick(RIVALS).name;
    const us = randi(3) + Math.min(3, Math.floor(ath.length / 4)),
      them = randi(4);
    const fans = Math.min(RES, Math.round(RES * rand(0.15, 0.3)));
    const tix = fans * 18;
    bizState(st).rev += tix;
    S.bud.venue += tix;
    for (const p of S.people)
      if (Math.random() < 0.3) p.nu = Math.min(100, p.nu + 30);
    const star = ath.length ? pick(ath) : null;
    if (star) {
      star.fm += us > them ? 8 : 2;
      lifeLog(
        star,
        "⚽",
        us > them
          ? `Scored in a ${us}–${them} win over ${rival}`
          : `Played against ${rival}`,
      );
    }
    news(
      "⚽",
      `Meadowvale FC ${us > them ? "beat" : us === them ? "drew with" : "lost to"} ${rival} ${us}–${them} in front of ${fmt(fans)} fans${star && us > them ? ` - ${pName(star)} was man of the match` : ""}! (🪙${fmt(tix)} tickets)`,
      true,
    );
  }
  const gyms = [...entsOf("gym")].filter(usable);
  if (gyms.length && Math.random() < 0.25) {
    const a = employeesOf(pick(gyms));
    if (a.length) {
      const p = pick(a);
      p.fm += 3;
      lifeLog(p, "🏅", "Set a personal best");
      news("🏅", `Athlete ${pName(p)} won the Meadowvale fun run!`);
    }
  }
  if (hasType("park") && ((d % 7) + 7) % 7 === 5 && Math.random() < 0.5) {
    for (const p of S.people)
      if (Math.random() < 0.2) p.nu = Math.min(100, p.nu + 20);
    news("🎪", "A weekend fair in the park lifted everyone's spirits.");
  }
}

function locateEnt(e) {
  if (!e) return;
  closePanel(true);
  const p = P(e.x + e.w / 2, e.y + e.h / 2);
  cam.tx = p[0];
  cam.ty = p[1];
  if (cam.z < 0.9) zoomAt(VW / 2, VH / 2, 1.1 / cam.z);
  setTimeout(() => {
    if (world.ents.has(e.id)) onEntityClick(e, VW / 2, VH / 2);
  }, 420);
}
Object.assign(ACT, {
  "c-person": (d) => {
    S.selP = +d.id;
    sfx("click");
    renderPanel(false);
  },
  "c-open-person": (d) => {
    S.selP = +d.id;
    cFilter = "all";
    cq = "";
    hidePopup();
    openPanel("census", "people");
  },
  "c-filter": (d) => {
    cFilter = d.f;
    cLimit = 80;
    if (panel && panel.tab !== "people") {
      panel.tab = "people";
    }
    sfx("click");
    renderPanel(true);
  },
  "c-more": () => {
    cLimit += 120;
    renderPanel(false);
  },
  "c-city": (d) => {
    S.cCity = d.id ? +d.id : null;
    sfx("click");
    renderPanel(true);
  },
  "c-locate": (d) => locateEnt(world.ents.get(+d.id)),
  "c-goto": (d) => {
    closePanel(true);
    const p = P(+d.x + 1, +d.y + 1);
    cam.tx = p[0];
    cam.ty = p[1];
  },
  "c-build": (d) => {
    hidePopup();
    closePanel(true);
    startPlace(d.id);
  },
  "c-plant": (d) => {
    hidePopup();
    closePanel(true);
    setPlantMode(d.id);
  },
  "c-approve": (d) => {
    approveProposal(+d.id);
    renderPanel(true);
  },
  "c-decline": (d) => {
    declineProposal(+d.id);
    sfx("click");
    renderPanel(true);
  },
  "c-autobiz": () => {
    S.autoBiz = !S.autoBiz;
    renderPanel(false);
  },
  "c-repair": (d) => {
    const e = world.ents.get(+d.id);
    if (e) repairBuilding(e);
    renderPanel(false);
  },
  "b-open": () => {
    const e = popEnt();
    if (e) {
      bizState(e).open = !e.biz.open;
      venueCache = null;
      sfx("click");
    }
  },
  "b-keep": (d) => {
    const e = popEnt();
    if (e) {
      const b = bizState(e);
      b.keep = clamp(b.keep + +d.d, 0, 99);
    }
  },
  "b-wage": (d) => {
    const e = popEnt();
    if (e) {
      bizState(e).wageLv = +d.v;
      sfx("click");
    }
  },
  "b-price": (d) => {
    const e = popEnt();
    if (e) {
      bizState(e).priceLv = +d.v;
      venueCache = null;
      sfx("click");
    }
  },
  "b-pos": (d) => {
    const e = popEnt();
    if (e) {
      const b = bizState(e),
        s = jobSpec(e.t);
      b.staffN = clamp(positionsOf(e) + +d.d, 0, Math.round(s.n * 2.5));
      jobMarket(40);
      venueCache = null;
      sfx("click");
    }
  },
  "b-cityrun": () => {
    const e = popEnt();
    if (e) {
      const b = bizState(e);
      b.own = "city";
      b.vacant = false;
      b.open = true;
      jobMarket(40);
      venueCache = null;
      sfx("build");
    }
  },
  "b-lease": () => {
    const e = popEnt();
    if (e) {
      const b = bizState(e);
      b.own = 0;
      b.vacant = true;
      for (const p of employeesOf(e)) {
        setJob(p, null);
        p.k = "unemployed";
      }
      venueCache = null;
      sfx("click");
    }
  },
});

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.id === "census-q") {
    cq = el.value.trim().toLowerCase();
    cLimit = 80;
    renderPanel(false);
    return;
  }
  if (el.dataset && el.dataset.change === "c-tax") {
    S.tax[el.dataset.k] = +el.value;
    const v = el.parentElement.querySelector(".tax-v");
    if (v) v.textContent = el.value + "%";
  }
});
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset && el.dataset.change === "c-tax") renderPanel(false);
});
