const WORLDS_KEY = "meadowvale_worlds",
  PLAY_KEY = "meadowvale_play",
  LEGACY_KEY = "meadowvale_save_v3";
const WORLD_TYPES = {
  normal: {
    name: "Normal",
    icon: "🌍",
    bias: 0,
    desc: "Continents, islands and every biome.",
  },
  archipelago: {
    name: "Archipelago",
    icon: "🏝️",
    bias: -0.035,
    desc: "Hundreds of islands - bridges and ferries matter.",
  },
  pangaea: {
    name: "Supercontinent",
    icon: "🗺️",
    bias: 0.045,
    desc: "Endless land with lakes and inland seas.",
  },
  islands: {
    name: "Tiny Islands",
    icon: "🌊",
    bias: -0.065,
    desc: "Mostly ocean. A real challenge.",
  },
};
const GAME_MODES = {
  career: {
    name: "Career",
    icon: "🏆",
    desc: "Earn coins, gather materials and grow step by step.",
  },
  creative: {
    name: "Creative",
    icon: "🎨",
    desc: "Unlimited coins and materials - build anything instantly.",
  },
};

function worldsList() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(WORLDS_KEY) || "[]");
  } catch (e) {
    list = [];
  }
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && !list.some((w) => w.key === LEGACY_KEY)) {
      const d = JSON.parse(legacy);
      list.push({
        id: "w" + Date.now().toString(36),
        key: LEGACY_KEY,
        name: "My World",
        seed: d.S.seedText || String(d.S.seed),
        mode: "career",
        type: "normal",
        created: d.S.created || Date.now(),
        played: d.savedAt || Date.now(),
        level: d.S.level,
        pop: d.S.people ? d.S.people.length : 0,
      });
      localStorage.setItem(WORLDS_KEY, JSON.stringify(list));
    }
  } catch (e) {}
  return list.sort((a, b) => (b.played || 0) - (a.played || 0));
}
function saveWorldsList(list) {
  try {
    localStorage.setItem(WORLDS_KEY, JSON.stringify(list));
  } catch (e) {}
}
function worldKey(w) {
  return w.key || "meadowvale_world_" + w.id;
}
function currentWorld() {
  let id = null,
    legacySeed = null;
  try {
    id = sessionStorage.getItem(PLAY_KEY);
    legacySeed = localStorage.getItem("meadowvale_next_seed");
    localStorage.removeItem("meadowvale_next_seed");
  } catch (e) {}
  const list = worldsList();
  if (legacySeed != null) {
    const w = createWorld({ name: "New World", seed: legacySeed });
    sessionStorage.setItem(PLAY_KEY, w.id);
    return w;
  }
  if (!id) return null;
  return (
    list.find((w) => w.id === id) || createWorld({ id, name: "New World" })
  );
}
function createWorld(o) {
  const list = worldsList();
  const w = {
    id: o.id || "w" + Date.now().toString(36) + randi(1000),
    name: (o.name || "New World").slice(0, 32),
    seed: o.seed || randomSeedText(),
    mode: o.mode || "career",
    type: o.type || "normal",
    created: Date.now(),
    played: Date.now(),
    level: 1,
    pop: 0,
  };
  list.push(w);
  saveWorldsList(list);
  return w;
}
function playWorld(id) {
  save();
  sessionStorage.setItem(PLAY_KEY, id);
  location.reload();
}
function toTitle() {
  save();
  sessionStorage.removeItem(PLAY_KEY);
  location.reload();
}
let lastWorldMeta = 0;
function updateWorldMeta() {
  if (!S || S.demo || Date.now() - lastWorldMeta < 5000) return;
  lastWorldMeta = Date.now();
  const list = worldsList(),
    w = list.find((x) => worldKey(x) === SAVE_KEY);
  if (w) {
    w.played = Date.now();
    w.level = S.level;
    w.pop = typeof RES !== "undefined" ? RES : POP;
    w.cities = (S.cities || []).length;
    saveWorldsList(list);
  }
}

const _spendTitle = spend;
spend = function (n) {
  if (S && S.mode === "creative") {
    bump("#pill-coins");
    return true;
  }
  return _spendTitle(n);
};
const _needsBuildTitle = needsBuild;
needsBuild = function (t) {
  return S && S.mode === "creative" ? false : _needsBuildTitle(t);
};
const _initGenTitle = initGen;
initGen = function (seed, sx, sy) {
  _initGenTitle(seed, sx, sy);
  GEN.bias = S && WORLD_TYPES[S.wtype] ? WORLD_TYPES[S.wtype].bias : 0;
};
const _genTileTitle = genTile;
genTile = function (x, y) {
  if (!GEN.bias) return _genTileTitle(x, y);

  const r = _genTileTitle(x, y),
    e = r[2] + GEN.bias;
  if (r[1] === BIO.deep && e >= 0.425) return [T_SHALLOW, BIO.ocean, e];
  if ((r[1] === BIO.ocean || r[1] === BIO.deep) && e >= 0.47)
    return [T_GRASS, BIO.plains, e];
  if (
    r[0] !== T_SHALLOW &&
    r[0] !== T_DEEP &&
    e < 0.47 &&
    r[1] !== BIO.river &&
    r[1] !== BIO.lake
  )
    return [
      e < 0.425 ? T_DEEP : T_SHALLOW,
      e < 0.425 ? BIO.deep : BIO.ocean,
      e,
    ];
  return r;
};

let titleView = "home",
  titleSel = null;
function renderTitle() {
  const list = worldsList();
  const el = document.getElementById("title-root");
  const ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1
      ? "just now"
      : m < 60
        ? m + " min ago"
        : m < 1440
          ? Math.round(m / 60) + " h ago"
          : Math.round(m / 1440) + " days ago";
  };
  let body = "";
  if (titleView === "home") {
    const last = list[0];
    body = `<div class="ttl-menu">
      ${last ? `<button class="ttl-btn primary" data-act="t-play" data-id="${last.id}">▶ Continue <small>${last.name}</small></button>` : ""}
      <button class="ttl-btn ${last ? "" : "primary"}" data-act="t-view" data-v="create">✨ Create New World</button>
      <button class="ttl-btn" data-act="t-view" data-v="worlds" ${list.length ? "" : "disabled"}>🌍 My Worlds <small>${list.length}</small></button>
      <button class="ttl-btn" data-act="t-import">📥 Import a World</button>
    </div>`;
  } else if (titleView === "worlds") {
    body = `<div class="ttl-card"><div class="ttl-h">🌍 My Worlds<button class="ttl-x" data-act="t-view" data-v="home">✕</button></div><div class="ttl-worlds">${
      list
        .map(
          (w) => `
      <div class="ttl-world ${titleSel === w.id ? "sel" : ""}" data-act="t-sel" data-id="${w.id}">
        <div class="tw-ic">${(WORLD_TYPES[w.type] || WORLD_TYPES.normal).icon}</div>
        <div class="tw-main"><div class="tw-name">${w.name.replace(/</g, "&lt;")}</div><div class="tw-sub">${(GAME_MODES[w.mode] || GAME_MODES.career).icon} ${(GAME_MODES[w.mode] || GAME_MODES.career).name} · seed <b>${String(w.seed).replace(/</g, "&lt;")}</b></div>
        <div class="tw-sub">⭐ Lv ${w.level || 1} · 👥 ${fmt(w.pop || 0)}${w.cities > 1 ? " · 🏛️ " + w.cities + " cities" : ""} · played ${ago(w.played || w.created)}</div></div>
        <div class="tw-btns"><button class="btn green small" data-act="t-play" data-id="${w.id}">▶ Play</button><button class="btn blue small" data-act="t-rename" data-id="${w.id}">✏️</button><button class="btn blue small" data-act="t-export" data-id="${w.id}">📤</button><button class="btn red small" data-act="t-delete" data-id="${w.id}">🗑️</button></div>
      </div>`,
        )
        .join("") || '<div class="c-foot">No worlds yet.</div>'
    }</div></div>`;
  } else if (titleView === "create") {
    const f = titleForm;
    body = `<div class="ttl-card"><div class="ttl-h">✨ Create New World<button class="ttl-x" data-act="t-view" data-v="home">✕</button></div>
      <label class="ttl-l">World name<input id="tw-name" class="ttl-in" maxlength="32" value="${f.name.replace(/"/g, "&quot;")}" autocomplete="off"></label>
      <label class="ttl-l">Seed <small>- the same seed always makes the same world</small><div class="ttl-row"><input id="tw-seed" class="ttl-in" maxlength="40" value="${f.seed.replace(/"/g, "&quot;")}" autocomplete="off"><button class="btn small" data-act="t-reroll">🎲 Random</button></div></label>
      <div class="ttl-l">Game mode</div><div class="ttl-opts">${Object.entries(
        GAME_MODES,
      )
        .map(
          ([k, m]) =>
            `<button class="ttl-opt ${f.mode === k ? "on" : ""}" data-act="t-mode" data-v="${k}"><b>${m.icon} ${m.name}</b><small>${m.desc}</small></button>`,
        )
        .join("")}</div>
      <div class="ttl-l">World type</div><div class="ttl-opts four">${Object.entries(
        WORLD_TYPES,
      )
        .map(
          ([k, m]) =>
            `<button class="ttl-opt ${f.type === k ? "on" : ""}" data-act="t-type" data-v="${k}"><b>${m.icon} ${m.name}</b><small>${m.desc}</small></button>`,
        )
        .join("")}</div>
      <button class="ttl-btn primary" data-act="t-create">🌱 Create World</button></div>`;
  }
  el.innerHTML = `<div class="ttl-back"><div class="ttl-logo"><div class="ttl-title">Meadowvale</div><div class="ttl-tag">Build anything, anywhere - an endless world of towns, cities and nations.</div></div>${body}<div class="ttl-foot">v1.0 · every world is saved in this browser</div></div>`;
}
const titleForm = {
  name: "New World",
  seed: "",
  mode: "career",
  type: "normal",
};
function readTitleForm() {
  const n = document.getElementById("tw-name"),
    s = document.getElementById("tw-seed");
  if (n) titleForm.name = n.value;
  if (s) titleForm.seed = s.value;
}
Object.assign(ACT, {
  "t-view": (d) => {
    readTitleForm();
    titleView = d.v;
    if (d.v === "create" && !titleForm.seed) titleForm.seed = randomSeedText();
    sfx("click");
    renderTitle();
  },
  "t-sel": (d, el, ev) => {
    if (ev && ev.target.closest("button")) return;
    titleSel = d.id;
    renderTitle();
  },
  "t-play": (d) => {
    sfx("click");
    playWorld(d.id);
  },
  "t-reroll": () => {
    readTitleForm();
    titleForm.seed = randomSeedText();
    renderTitle();
  },
  "t-mode": (d) => {
    readTitleForm();
    titleForm.mode = d.v;
    renderTitle();
  },
  "t-type": (d) => {
    readTitleForm();
    titleForm.type = d.v;
    renderTitle();
  },
  "t-create": () => {
    readTitleForm();
    const w = createWorld({
      name: titleForm.name.trim() || "New World",
      seed: titleForm.seed.trim() || randomSeedText(),
      mode: titleForm.mode,
      type: titleForm.type,
    });
    playWorld(w.id);
  },
  "t-rename": (d) => {
    const list = worldsList(),
      w = list.find((x) => x.id === d.id);
    if (!w) return;
    dialog({
      title: "✏️ Rename world",
      body: `<input id="tw-rename" class="name-in" maxlength="32" value="${w.name.replace(/"/g, "&quot;")}">`,
      yes: "Rename",
      onYes: () => {
        const v = document.getElementById("tw-rename").value.trim();
        if (v) {
          w.name = v;
          saveWorldsList(list);
          renderTitle();
        }
      },
    });
  },
  "t-delete": (d) => {
    const list = worldsList(),
      w = list.find((x) => x.id === d.id);
    if (!w) return;
    dialog({
      title: "🗑️ Delete world?",
      body: `<b>${w.name.replace(/</g, "&lt;")}</b> will be gone forever.`,
      yes: "Delete",
      cls: "red",
      onYes: () => {
        localStorage.removeItem(worldKey(w));
        saveWorldsList(list.filter((x) => x !== w));
        renderTitle();
      },
    });
  },
  "t-export": (d) => {
    const w = worldsList().find((x) => x.id === d.id);
    if (!w) return;
    const raw = localStorage.getItem(worldKey(w));
    if (!raw) {
      toast("That world has not been saved yet.");
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify({ meta: w, save: JSON.parse(raw) })], {
        type: "application/json",
      }),
    );
    a.download = w.name.replace(/[^\w-]+/g, "_") + ".meadowvale.json";
    a.click();
  },
  "t-import": () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      f.text().then((txt) => {
        try {
          const d = JSON.parse(txt),
            save0 = d.save || d,
            meta = d.meta || {};
          const w = createWorld({
            name: meta.name || "Imported World",
            seed: (save0.S && (save0.S.seedText || save0.S.seed)) || "",
            mode: meta.mode,
            type: meta.type,
          });
          localStorage.setItem(worldKey(w), JSON.stringify(save0));
          toast("📥 World imported!", "good");
          titleView = "worlds";
          renderTitle();
        } catch (e) {
          toast("That file is not a Meadowvale world.", "warn");
        }
      });
    };
    inp.click();
  },
  "to-title": () => toTitle(),
});

function startTitle() {
  S = defaultState();
  S.demo = true;
  S.seedText = randomSeedText();
  S.seed = hashSeed(S.seedText);
  S.daynight = false;
  resetWorld();
  genStart(S.seed);
  const p = P(S.spawn.x, S.spawn.y + 2);
  cam.x = p[0];
  cam.y = p[1];
  cam.z = 0.55;
  const root = document.createElement("div");
  root.id = "title-root";
  document.body.appendChild(root);
  document.body.classList.add("on-title");
  renderTitle();
  initInputTitle();
  const ld = document.getElementById("loading");
  if (ld) {
    ld.classList.add("done");
    setTimeout(() => ld.remove(), 600);
  }
  let last = performance.now();
  const frame = (t) => {
    const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
    last = t;
    T += dt;
    ANIM = T;
    NOW = Date.now();
    cam.x += dt * 26;
    cam.y += dt * 9;
    updateClouds(dt);
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function initInputTitle() {
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el || el.disabled) return;
    Sfx.init();
    const f = ACT[el.dataset.act];
    if (f) f(el.dataset, el, ev);
  });
  document.addEventListener("keydown", (ev) => {
    if (
      ev.key === "Enter" &&
      titleView === "create" &&
      ev.target.classList.contains("ttl-in")
    )
      ACT["t-create"]();
    if (ev.key === "Escape" && titleView !== "home") {
      titleView = "home";
      renderTitle();
    }
  });
}

const _saveTitle = save;
save = function () {
  if (!S || S.demo) return;
  _saveTitle();
  updateWorldMeta();
};
