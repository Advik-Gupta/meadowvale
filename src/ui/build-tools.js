const GFX_KEY = "meadowvale_gfx";
const GFX_DEFAULT = { bubbles: true, particles: true, people: true, cars: true, vehicles: true, life: true, clouds: true, labels: true, quality: "high", seeThrough: "off", planPaths: true, fps: false };
const GFX = Object.assign({}, GFX_DEFAULT);
try {
  Object.assign(GFX, JSON.parse(localStorage.getItem(GFX_KEY) || "{}"));
} catch (e) {}
function saveGfx() {
  try {
    localStorage.setItem(GFX_KEY, JSON.stringify(GFX));
  } catch (e) {}
}
const GFX_PRESETS = {
  low: { bubbles: false, particles: false, people: false, cars: false, vehicles: true, life: false, clouds: false, labels: true, quality: "low" },
  balanced: { bubbles: true, particles: true, people: true, cars: false, vehicles: true, life: false, clouds: false, labels: true, quality: "medium" },
  high: { bubbles: true, particles: true, people: true, cars: true, vehicles: true, life: true, clouds: true, labels: true, quality: "high" },
};
const GFX_QUALITY = { high: 2, medium: 1, low: 0.75 };

function applyQuality() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, GFX_QUALITY[GFX.quality] || 2);
  canvas.width = Math.round(VW * dpr);
  canvas.height = Math.round(VH * dpr);
  if (typeof resetGroundCaches === "function") resetGroundCaches();
}
const _resizeBT = resize;
resize = function () {
  _resizeBT();
  if (GFX.quality !== "high") applyQuality();
};
window.addEventListener("resize", () => {
  if (GFX.quality !== "high") applyQuality();
});
const _initCanvasBT = initCanvas;
initCanvas = function () {
  _initCanvasBT();
  if (GFX.quality !== "high") applyQuality();
};

function gfxGate(name, key) {
  const f = window[name];
  if (typeof f !== "function") return;
  window[name] = function (...a) {
    if (!GFX[key]) return;
    return f.apply(this, a);
  };
}
gfxGate("drawBubbles", "bubbles");
gfxGate("drawParticles", "particles");
gfxGate("drawPerson", "people");
gfxGate("updateWalkers", "people");
gfxGate("drawCar", "cars");
gfxGate("updateTraffic", "cars");
gfxGate("drawVehicles", "vehicles");
gfxGate("drawLife", "life");
gfxGate("updateLife", "life");
gfxGate("drawClouds", "clouds");
gfxGate("drawWeatherFX", "clouds");
gfxGate("drawCityLabels", "labels");
const _spawnBT = spawn;
spawn = function (p) {
  if (GFX.particles) _spawnBT(p);
};

function bigBuilding(e) {
  const b = BUILD[e.t];
  return b && !b.flat && !b.nature && ((b.ht || 0) >= 70 || e.w * e.h >= 9);
}
function seeThroughHere(e) {
  if (GFX.seeThrough === "off" || e.nat || !bigBuilding(e)) return false;
  if (GFX.seeThrough === "all") return true;
  if (!hoverTile) return false;
  const [hx, hy] = hoverTile;
  return e.x + e.w > hx - 1 && e.y + e.h > hy - 1 && e.x - hx < 7 && e.y - hy < 7 && e.x + e.y + e.w + e.h > hx + hy + 1;
}
const _drawEntBT = drawEnt;
drawEnt = function (e) {
  if (!THUMB && seeThroughHere(e)) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    _drawEntBT(e);
    ctx.restore();
    return;
  }
  _drawEntBT(e);
};
const SEE_LABELS = { off: "Off", near: "Near cursor", all: "All big buildings" };
function cycleSeeThrough() {
  const order = ["off", "near", "all"];
  GFX.seeThrough = order[(order.indexOf(GFX.seeThrough) + 1) % order.length];
  saveGfx();
  toast(`👁️ See-through: <b>${SEE_LABELS[GFX.seeThrough]}</b>`, "info");
  const b = document.getElementById("btn-see");
  if (b) b.classList.toggle("on", GFX.seeThrough !== "off");
  renderPanel(true);
}

const PLAN = { t: null, tiles: [], seg: [], a: null, drag: false };
function planType(t) {
  const b = BUILD[t];
  return GFX.planPaths && b && b.multi && b.w === 1 && b.h === 1 && !b.paint;
}
function planActive() {
  return mode.type === "place" && !mode.ent && planType(mode.t);
}
function planReset() {
  PLAN.tiles = [];
  PLAN.seg = [];
  PLAN.drag = false;
  PLAN.a = null;
  PLAN.t = null;
  PLAN.segLens = [];
}
function lPath(a, b) {
  const out = [],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    sx = Math.sign(dx),
    sy = Math.sign(dy);
  let x = a[0],
    y = a[1];
  const xFirst = Math.abs(dx) >= Math.abs(dy);
  out.push({ x, y, along: xFirst ? "x" : "y" });
  if (xFirst) {
    while (x !== b[0]) out.push({ x: (x += sx), y, along: "x" });
    while (y !== b[1]) out.push({ x, y: (y += sy), along: "y" });
  } else {
    while (y !== b[1]) out.push({ x, y: (y += sy), along: "y" });
    while (x !== b[0]) out.push({ x: (x += sx), y, along: "x" });
  }
  return out;
}
function planTiles() {
  const seen = new Set(),
    out = [];
  for (const p of PLAN.tiles.concat(PLAN.seg)) {
    const k = p.x + "," + p.y;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}
function planOK(p) {
  const e = entAt(p.x, p.y);
  if (e && e.t === mode.t) return false;
  return placeOK(mode.t, p.x, p.y, -1, 1, 1);
}
function planFlip(p) {
  return canRotate(mode.t) ? (p.along === "y") !== !!mode.rot : false;
}
function updatePlanBanner() {
  if (!planActive()) return;
  const b = BUILD[mode.t],
    all = planTiles(),
    ok = all.filter(planOK).length,
    cost = ok * buildCost(mode.t);
  setBanner(
    `<span class="mb-ic">${b.icon}</span><span>${
      all.length
        ? `<b>${ok}</b> ${b.name} tile${ok === 1 ? "" : "s"} planned${S.mode === "creative" ? "" : ` · 🪙${fmt(cost)}`}${all.length > ok ? ` <small>(${all.length - ok} blocked)</small>` : ""}`
        : `<b>${b.name}</b> - drag to lay out a path, then press Build`
    }</span>${canRotate(mode.t) ? '<button class="btn small purple" data-act="rotate" title="Rotate (R)">🔄</button>' : ""}${
      all.length
        ? `<button class="btn small green" data-act="plan-build" title="Build (Enter)" ${ok ? "" : "disabled"}>✓ Build</button><button class="btn small" data-act="plan-undo" title="Undo last segment (Backspace)">↩</button><button class="btn small" data-act="plan-clear">✕ Clear</button>`
        : ""
    }<button class="btn small red" data-act="cancel">Done</button>`,
  );
}
function planCommit() {
  if (!planActive()) return;
  const t = mode.t,
    list = planTiles().filter(planOK),
    rot0 = mode.rot,
    h0 = hoverTile;
  let n = 0;
  for (const p of list) {
    if (mode.type !== "place" || mode.t !== t) break;
    mode.rot = planFlip(p);
    hoverTile = [p.x, p.y];
    const before = entAt(p.x, p.y);
    tryPlace();
    const after = entAt(p.x, p.y);
    if (after && after !== before) n++;
  }
  hoverTile = h0;
  if (mode.type === "place") mode.rot = rot0;
  PLAN.tiles = [];
  PLAN.seg = [];
  if (n) toast(`🛠️ Built ${n} ${BUILD[t].name} tile${n === 1 ? "" : "s"}`, "good");
  updatePlanBanner();
}
const _dragPlaceBT = dragPlaceAt;
dragPlaceAt = function (sx, sy) {
  if (!planActive()) return _dragPlaceBT(sx, sy);
  const t = screenToTile(sx, sy);
  if (PLAN.t !== mode.t) {
    planReset();
    PLAN.t = mode.t;
  }
  if (!PLAN.drag) {
    PLAN.drag = true;
    PLAN.a = t;
  }
  PLAN.seg = lPath(PLAN.a, t);
  updatePlanBanner();
};
function planEndDrag() {
  if (!PLAN.drag) return;
  PLAN.drag = false;
  const before = PLAN.tiles.length;
  PLAN.tiles = planTiles();
  PLAN.segLens = (PLAN.segLens || []).concat([PLAN.tiles.length - before]);
  PLAN.seg = [];
  updatePlanBanner();
}
const _updatePlaceBannerBT = updatePlaceBanner;
updatePlaceBanner = function () {
  if (planActive()) {
    if (PLAN.t !== mode.t) {
      planReset();
      PLAN.t = mode.t;
    }
    return updatePlanBanner();
  }
  _updatePlaceBannerBT();
  if (mode.type === "place" && !mode.ent && canRotate(mode.t)) {
    const el = $("#mode-banner");
    if (el && !el.querySelector('[data-act="rotate"]'))
      el.querySelector('[data-act="cancel"]').insertAdjacentHTML("beforebegin", '<button class="btn small purple" data-act="rotate" title="Rotate (R)">🔄 Rotate</button>');
  }
};
const _rotatePlacementBT = rotatePlacement;
rotatePlacement = function () {
  _rotatePlacementBT();
  if (planActive()) updatePlanBanner();
};
const _cancelModeBT = cancelMode;
cancelMode = function (silent) {
  planReset();
  return _cancelModeBT(silent);
};
Object.assign(ACT, {
  "plan-build": () => planCommit(),
  "plan-undo": () => {
    const lens = PLAN.segLens || [];
    if (!lens.length) return;
    const n = lens.pop();
    PLAN.tiles = PLAN.tiles.slice(0, Math.max(0, PLAN.tiles.length - n));
    updatePlanBanner();
  },
  "plan-clear": () => {
    PLAN.tiles = [];
    PLAN.seg = [];
    PLAN.segLens = [];
    updatePlanBanner();
  },
  "see-through": () => cycleSeeThrough(),
  "gfx-toggle": (d) => {
    GFX[d.k] = !GFX[d.k];
    saveGfx();
    if (d.k === "fps") fpsEl();
    renderPanel(true);
  },
  "gfx-set": (d) => {
    GFX[d.k] = d.v;
    saveGfx();
    if (d.k === "quality") applyQuality();
    if (d.k === "seeThrough") {
      const b = document.getElementById("btn-see");
      if (b) b.classList.toggle("on", GFX.seeThrough !== "off");
    }
    renderPanel(true);
  },
  "gfx-preset": (d) => {
    Object.assign(GFX, GFX_PRESETS[d.v]);
    saveGfx();
    applyQuality();
    toast(`🎨 Graphics set to <b>${d.v}</b>`, "info");
    renderPanel(true);
  },
});

function drawPlanOverlay() {
  if (!planActive()) return;
  const all = planTiles();
  if (!all.length) return;
  setWorldTransform();
  const show = all.length <= 400;
  for (const p of all) {
    const ok = planOK(p);
    poly(diamond(p.x, p.y), ok ? "rgba(110,230,90,.42)" : "rgba(240,70,60,.42)", ok ? "#e4ffd0" : "#ffd0c8", 1);
  }
  if (!show) return;
  ctx.save();
  ctx.globalAlpha = 0.6;
  THUMB = true;
  for (const p of all) {
    if (!planOK(p)) continue;
    const e = newEntity(mode.t, p.x, p.y, { id: 0, s: 30, v: 0, flip: planFlip(p) });
    if (FLAT[e.t]) FLAT[e.t](e);
    else if (DRAW[e.t]) {
      if (e.flip) {
        const [fx] = P(e.x + 0.5, e.y + 0.5);
        ctx.save();
        ctx.translate(fx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-fx, 0);
        DRAW[e.t](e);
        ctx.restore();
      } else DRAW[e.t](e);
    }
  }
  THUMB = false;
  ctx.restore();
}
let fpsT = performance.now(),
  fpsN = 0;
function fpsEl() {
  let el = document.getElementById("fps");
  if (!GFX.fps) {
    if (el) el.remove();
    return null;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "fps";
    document.body.appendChild(el);
  }
  return el;
}
const _renderBT = render;
render = function () {
  _renderBT();
  drawPlanOverlay();
  if (GFX.fps) {
    fpsN++;
    const now = performance.now();
    if (now - fpsT > 500) {
      const el = fpsEl();
      if (el) el.textContent = Math.round((fpsN * 1000) / (now - fpsT)) + " FPS";
      fpsT = now;
      fpsN = 0;
    }
  }
};

const _initInputBT = initInput;
initInput = function () {
  _initInputBT();
  canvas.addEventListener("pointerup", planEndDrag, true);
  canvas.addEventListener("pointercancel", planEndDrag, true);
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (dialogOpen() || panel) return;
      const k = e.key.toLowerCase();
      if (planActive() && planTiles().length && (k === "enter" || k === "backspace")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        ACT[k === "enter" ? "plan-build" : "plan-undo"]();
        return;
      }
      if (k === "l") ACT["see-through"]();
    },
    true,
  );
  const right = document.getElementById("hud-right");
  if (right && !document.getElementById("btn-see")) {
    const b = document.createElement("button");
    b.className = "round-btn" + (GFX.seeThrough !== "off" ? " on" : "");
    b.id = "btn-see";
    b.title = "See through big buildings (L)";
    b.dataset.act = "see-through";
    b.textContent = "👁️";
    right.insertBefore(b, right.lastElementChild);
  }
  fpsEl();
};

function gfxSettingsHTML() {
  const tg = (k, label, sub) => `<div class="set-row"><span>${label}${sub ? ` <small>${sub}</small>` : ""}</span><button class="toggle ${GFX[k] ? "on" : ""}" data-act="gfx-toggle" data-k="${k}"><i></i></button></div>`;
  const seg = (k, opts) => `<div class="seg">${Object.entries(opts).map(([v, n]) => `<button class="${GFX[k] === v ? "on" : ""}" data-act="gfx-set" data-k="${k}" data-v="${v}">${n}</button>`).join("")}</div>`;
  return `<h3>🎨 Graphics & performance</h3>
    <div class="set-row"><span>Quick preset <small>- lower settings run faster in big cities</small></span><span class="btnrow inline"><button class="btn small" data-act="gfx-preset" data-v="low">🐢 Low</button><button class="btn small" data-act="gfx-preset" data-v="balanced">⚖️ Balanced</button><button class="btn small" data-act="gfx-preset" data-v="high">✨ High</button></span></div>
    <div class="set-row"><span>🖥️ Render resolution</span>${seg("quality", { high: "Sharp", medium: "Normal", low: "Fast" })}</div>
    <div class="set-row"><span>👁️ See through big buildings <small>(L)</small></span>${seg("seeThrough", SEE_LABELS)}</div>
    ${tg("bubbles", "💬 Icons above buildings", "ready crops, rent, alerts")}
    ${tg("particles", "✨ Floating numbers & effects")}
    ${tg("people", "🚶 Residents & staff walking")}
    ${tg("cars", "🚗 Cars & traffic")}
    ${tg("vehicles", "🚂 Trains, ships & planes")}
    ${tg("life", "🐦 Birds & wildlife")}
    ${tg("clouds", "☁️ Clouds & weather effects")}
    ${tg("labels", "🏷️ City name labels")}
    ${tg("planPaths", "🛣️ Plan roads, rails & walls before building", "drag a path, then press Build")}
    ${tg("fps", "📈 Show FPS counter")}`;
}
const _renderSettingsBT = renderSettings;
renderSettings = function () {
  const html = _renderSettingsBT();
  return html.includes("<h3>How to play</h3>") ? html.replace("<h3>How to play</h3>", gfxSettingsHTML() + "<h3>How to play</h3>") : html + gfxSettingsHTML();
};
PANELS.settings.render = () => renderSettings();

const KEEP_SCROLL = ".staff-list, .staff-detail, .job-board, .wm-side, .log, .board, .c-card, .acc-dlg-list, .res-list, [data-keep-scroll]";
const _renderPanelBT = renderPanel;
renderPanel = function (force) {
  const body = document.getElementById("modal-body");
  let saved = null;
  if (body && panel) {
    saved = [];
    const els = body.querySelectorAll(KEEP_SCROLL);
    for (let i = 0; i < els.length; i++) if (els[i].scrollTop) saved.push([i, els[i].className.split(" ")[0], els[i].scrollTop]);
  }
  const before = panel && panel.html;
  _renderPanelBT(force);
  if (saved && saved.length && panel && panel.html !== before) {
    const els = body.querySelectorAll(KEEP_SCROLL);
    for (const [i, c, st] of saved) if (els[i] && els[i].className.split(" ")[0] === c) els[i].scrollTop = st;
  }
};
