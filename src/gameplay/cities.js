Object.assign(BUILD.townhall, {
  special: false,
  cat: "town",
  cost: 2500,
  level: 5,
  xp: 60,
  desc: "Found a new city here! Every Town Hall starts its own named town - build them as far apart as you like.",
});
Object.assign(BUILD.market, {
  special: false,
  cat: "town",
  cost: 600,
  level: 2,
  xp: 15,
  desc: "A market square - customers come here to buy produce.",
});
const CITY_NAMES = [
  "Ashford",
  "Brightwater",
  "Cedar Falls",
  "Dunmore",
  "Elmstead",
  "Fairhaven",
  "Glenrock",
  "Highmoor",
  "Ivybridge",
  "Juniper Bay",
  "Kingsport",
  "Larkspur",
  "Millbrook",
  "Northwind",
  "Oakhollow",
  "Pinecrest",
  "Queensbury",
  "Riverton",
  "Silverlake",
  "Thornfield",
  "Umberleigh",
  "Valewood",
  "Westmarch",
  "Yarrowby",
  "Zephyr Point",
  "Sakura Hills",
  "Al Noor",
  "Santorini Bay",
  "Fjordheim",
  "Dusty Gulch",
  "Coral Cove",
  "Neo Harbor",
];
const CITY_RADIUS = 70;

function ensureCities() {
  S.cities = S.cities || [];
  const known = new Set(S.cities.map((c) => c.th));
  for (const e of entsOf("townhall")) {
    if (known.has(e.id) || e.build) continue;
    S.cities.push({
      id: e.id,
      th: e.id,
      name: S.cities.length
        ? pick(CITY_NAMES.filter((n) => !S.cities.some((c) => c.name === n)))
        : "Meadowvale",
      x: e.x + 1,
      y: e.y + 1,
      founded: typeof yearOf === "function" ? yearOf(dayNum()) : 1,
    });
  }
  S.cities = S.cities.filter((c) => world.ents.has(c.th));
}
function cityAt(x, y) {
  let best = null,
    bd = CITY_RADIUS;
  for (const c of S.cities || []) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}
function cityOfEnt(e) {
  return e ? cityAt(e.x + e.w / 2, e.y + e.h / 2) : null;
}
function personCity(p) {
  const h = p.h && world.ents.get(p.h);
  return h ? cityOfEnt(h) : null;
}
function cityStats(c) {
  let pop = 0,
    bld = 0,
    homes = 0;
  for (const e of world.ents.values()) {
    if (e.nat || BUILD[e.t].flat) continue;
    if (cityOfEnt(e) !== c) continue;
    bld++;
    if (HOUSE_TYPES.includes(e.t)) homes++;
  }
  for (const p of S.people || []) if (personCity(p) === c) pop++;
  return { pop, bld, homes };
}

const _tryPlaceCities = tryPlace;
tryPlace = function () {
  const was = mode.type === "place" && mode.t === "townhall" && !mode.ent,
    n0 = countOf("townhall");
  _tryPlaceCities();
  if (was && countOf("townhall") > n0) {
    ensureCities();
    const c = S.cities[S.cities.length - 1];
    if (c) setTimeout(() => renameCity(c.id, true), 200);
  }
};
function renameCity(id, founding) {
  const c = (S.cities || []).find((x) => x.id === id);
  if (!c) return;
  dialog({
    title: founding ? "🏛️ A new city is founded!" : "✏️ Rename city",
    body: `${founding ? "Your new Town Hall starts a brand-new city. " : ""}What should it be called?<br><br><input id="city-name" class="name-in" type="text" maxlength="28" value="${c.name.replace(/"/g, "&quot;")}" autocomplete="off">`,
    yes: founding ? "Found city" : "Rename",
    no: founding ? false : "Cancel",
    onYes: () => {
      const el = document.getElementById("city-name");
      const v = el && el.value.trim();
      if (v) c.name = v.slice(0, 28);
      if (founding) {
        toast(`🏛️ <b>${c.name}</b> was founded!`, "good");
        if (typeof news === "function" && S.news)
          news("🏛️", `The city of ${c.name} was founded.`, true);
      }
    },
  });
  setTimeout(() => {
    const el = document.getElementById("city-name");
    if (el) {
      el.focus();
      el.select();
    }
  }, 60);
}

townhallPopup = function (e) {
  ensureCities();
  const c = (S.cities || []).find((x) => x.th === e.id);
  showPopup(e, {
    sig: () => (c ? c.name : "") + S.socHour,
    render: () => {
      const st = c ? cityStats(c) : { pop: 0, bld: 0, homes: 0 };
      return `<div class="pp-title">${thumbMini("townhall")} ${c ? c.name : "Town Hall"}</div><div class="pp-sub">Founded in year ${c ? c.founded : 1} · ${S.cities.length} cit${S.cities.length === 1 ? "y" : "ies"} in your world</div>
      <div class="stat-grid"><div>👥 <b>${fmt(st.pop)}</b><small>Residents</small></div><div>🏠 <b>${st.homes}</b><small>Homes</small></div><div>🏗️ <b>${st.bld}</b><small>Buildings</small></div></div>
      <div class="pp-btns mt"><button class="btn blue small" data-act="city-rename" data-id="${c ? c.id : 0}">✏️ Rename</button><button class="btn orange small" data-act="open" data-id="worldmap">🗺️ World map</button><button class="btn blue small" data-act="p-move">✋ Move</button></div>`;
    },
  });
};

function drawCityLabels() {
  if (!S.cities) return;
  for (const c of S.cities) {
    const e = world.ents.get(c.th);
    if (!e) continue;
    const p = P(e.x + 1.5, e.y + 1.5, 150),
      z = cam.z;
    if (z > 0.9) continue;
    const s = clamp(1 / z, 1, 4.5);
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.scale(s, s);
    ctx.font = "700 15px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = ctx.measureText(c.name).width + 26;
    rr(
      -w / 2,
      -14,
      w,
      28,
      14,
      "rgba(255,249,238,.94)",
      "rgba(255,255,255,1)",
      2,
    );
    ctx.fillStyle = "#4a3423";
    ctx.fillText("🏛️ " + c.name, 0, 1);
    ctx.restore();
  }
}

let exploredSet = null;
function explored() {
  if (!exploredSet) exploredSet = new Set(S.explored || []);
  return exploredSet;
}
const _loadChunkCities = loadChunk;
loadChunk = function (cx, cy) {
  const k = ckey(cx, cy);
  if (S && !explored().has(k)) {
    exploredSet.add(k);
    S.explored = S.explored || [];
    S.explored.push(k);
  }
  return _loadChunkCities(cx, cy);
};

const wm = { cx: null, cy: null, k: 0.5, drag: null };
PANELS.worldmap = {
  title: "🗺️ World Map",
  sig: () =>
    (S.cities || []).map((c) => c.name).join() +
    "|" +
    (S.explored || []).length,
  render: () => {
    ensureCities();
    const cities = (S.cities || [])
      .map((c) => {
        const st = cityStats(c);
        return `<button class="wm-city" data-act="wm-go" data-x="${c.x}" data-y="${c.y}"><b>🏛️ ${c.name}</b><small>👥 ${fmt(st.pop)} · 🏗️ ${st.bld} · year ${c.founded}</small></button>`;
      })
      .join("");
    const km = Math.round(((S.explored || []).length * 256) / 100) / 10;
    return `<div class="wm-wrap"><div class="wm-side"><div class="c-h">🏙️ Your cities</div>${cities || '<div class="c-foot">Build a Town Hall to found a city.</div>'}
      <div class="c-foot">Explored ${fmt((S.explored || []).length)} chunks (≈${km} km²) · ${Object.keys(S.biomesSeen || {}).length} biomes · seed <b>${S.seedText}</b></div>
      <div class="c-foot">Drag to pan · scroll to zoom · click to travel. Build a 🏛️ Town Hall anywhere to start another city.</div>
      <button class="btn green small" data-act="c-build" data-id="townhall">🏛️ Found a new city</button></div>
      <div class="wm-mapbox"><canvas id="wm-canvas"></canvas><div class="wm-legend"><span><i style="background:#ff8a5c"></i>Homes</span><span><i style="background:#e8503a"></i>Buildings</span><span><i style="background:#80838a"></i>Roads</span><span><i style="background:#ffffff;border:1px solid #999"></i>You are here</span></div></div></div>`;
  },
  live: () => drawWorldMap(),
};
function wmProject(x, y, W, H) {
  return [
    (x - y - (wm.cx - wm.cy)) * wm.k + W / 2,
    ((x + y - (wm.cx + wm.cy)) * wm.k) / 2 + H / 2,
  ];
}
function wmUnproject(px, py, W, H) {
  const a = (px - W / 2) / wm.k + (wm.cx - wm.cy),
    b = ((py - H / 2) * 2) / wm.k + (wm.cx + wm.cy);
  return [(a + b) / 2, (b - a) / 2];
}
function drawWorldMap() {
  const cv = document.getElementById("wm-canvas");
  if (!cv) return;
  const r = cv.getBoundingClientRect(),
    dpr = Math.min(2, window.devicePixelRatio || 1);
  if (
    cv.width !== Math.round(r.width * dpr) ||
    cv.height !== Math.round(r.height * dpr)
  ) {
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
  }
  const W = r.width,
    H = r.height,
    g = cv.getContext("2d");
  if (wm.cx == null) {
    const w = screenToWorld(VW / 2, VH / 2),
      t = worldToTileF(w[0], w[1]);
    wm.cx = t[0];
    wm.cy = t[1];
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "#1d3b52";
  g.fillRect(0, 0, W, H);

  const k = wm.k,
    ex = explored();
  g.imageSmoothingEnabled = k < 1;
  for (const key of ex) {
    const cx = Math.round(key / 100000),
      cy = key - cx * 100000;
    const [px, py] = wmProject(cx * CH, cy * CH, W, H);
    if (
      px < -CH * 2 * k ||
      px > W + CH * 2 * k ||
      py < -CH * k ||
      py > H + CH * k
    )
      continue;
    const img = mmChunk(cx, cy);
    g.drawImage(
      img,
      px - CH * k,
      py,
      (img.width * k) / MMK,
      (img.height * k) / MMK,
    );
  }

  for (const e of world.ents.values()) {
    if (e.nat) continue;
    const [px, py] = wmProject(e.x + e.w / 2, e.y + e.h / 2, W, H);
    if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
    g.fillStyle = BUILD[e.t].walk
      ? "#80838a"
      : HOUSE_TYPES.includes(e.t)
        ? "#ff8a5c"
        : e.t === "field"
          ? "#8a5a35"
          : "#e8503a";
    const s = Math.max(1.2, Math.min(e.w, e.h) * k);
    g.fillRect(px - s / 2, py - s / 4, s, s / 2 + 0.6);
  }

  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const c of S.cities || []) {
    const [px, py] = wmProject(c.x, c.y, W, H);
    g.font = "700 13px Fredoka, sans-serif";
    const tw = g.measureText("🏛️ " + c.name).width + 16;
    g.fillStyle = "rgba(255,249,238,.95)";
    g.beginPath();
    g.roundRect
      ? g.roundRect(px - tw / 2, py - 26, tw, 20, 10)
      : g.rect(px - tw / 2, py - 26, tw, 20);
    g.fill();
    g.fillStyle = "#4a3423";
    g.fillText("🏛️ " + c.name, px, py - 16);
    g.fillStyle = "#ffd23f";
    g.beginPath();
    g.arc(px, py, 4, 0, Math.PI * 2);
    g.fill();
  }

  const q = (sx, sy) => {
    const w = screenToWorld(sx, sy),
      t = worldToTileF(w[0], w[1]);
    return wmProject(t[0], t[1], W, H);
  };
  const a = q(0, 0),
    b = q(VW, 0),
    c = q(VW, VH),
    d = q(0, VH);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(...a);
  g.lineTo(...b);
  g.lineTo(...c);
  g.lineTo(...d);
  g.closePath();
  g.stroke();

  g.fillStyle = "rgba(255,255,255,.8)";
  g.font = "600 11px Fredoka, sans-serif";
  g.textAlign = "left";
  const tiles = Math.round(100 / k / 10) * 10 || 10;
  g.fillRect(12, H - 16, tiles * k, 3);
  g.fillText(`${tiles} tiles`, 12, H - 24);
}

document.addEventListener("pointerdown", (ev) => {
  if (ev.target.id !== "wm-canvas") return;
  wm.drag = { x: ev.clientX, y: ev.clientY, moved: false };
  ev.target.setPointerCapture(ev.pointerId);
});
document.addEventListener("pointermove", (ev) => {
  if (!wm.drag || ev.target.id !== "wm-canvas") return;
  const dx = ev.clientX - wm.drag.x,
    dy = ev.clientY - wm.drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) wm.drag.moved = true;
  const a = dx / wm.k,
    b = (dy * 2) / wm.k;
  wm.cx -= (a + b) / 2;
  wm.cy -= (b - a) / 2;
  wm.drag.x = ev.clientX;
  wm.drag.y = ev.clientY;
  drawWorldMap();
});
document.addEventListener("pointerup", (ev) => {
  if (!wm.drag) return;
  const d = wm.drag;
  wm.drag = null;
  if (!d.moved && ev.target.id === "wm-canvas") {
    const r = ev.target.getBoundingClientRect();
    const [tx, ty] = wmUnproject(
      ev.clientX - r.left,
      ev.clientY - r.top,
      r.width,
      r.height,
    );
    travelTo(tx, ty);
  }
});
document.addEventListener(
  "wheel",
  (ev) => {
    if (ev.target.id !== "wm-canvas") return;
    ev.preventDefault();
    const r = ev.target.getBoundingClientRect(),
      mx = ev.clientX - r.left,
      my = ev.clientY - r.top;
    const before = wmUnproject(mx, my, r.width, r.height);
    wm.k = clamp(wm.k * Math.exp(-ev.deltaY * 0.0015), 0.04, 4);
    const after = wmUnproject(mx, my, r.width, r.height);
    wm.cx += before[0] - after[0];
    wm.cy += before[1] - after[1];
    drawWorldMap();
  },
  { passive: false },
);
function travelTo(x, y) {
  closePanel(true);
  const p = P(x, y);
  cam.tx = p[0];
  cam.ty = p[1];
  sfx("click");
}
Object.assign(ACT, {
  "wm-go": (d) => travelTo(+d.x, +d.y),
  "city-rename": (d) => {
    hidePopup();
    renameCity(+d.id);
  },
});
