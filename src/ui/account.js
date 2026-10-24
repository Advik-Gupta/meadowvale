const ACC = {
  authMode: "login",
  err: "",
  flash: "",
  busy: false,
  cloud: null,
  friends: null,
  search: { q: "", users: null },
  lb: { by: "pop", rows: null },
  members: null,
  createOnline: true,
  invite: new Set(),
  noSave: false,
};
const ACC_VIEWS = { auth: 1, cloud: 1, friends: 1, leaders: 1, members: 1 };
const ACC_NOTICE_KEY = "meadowvale_notice_accounts";
let CLOUD_WORLD = null;

function accOffline() {
  try {
    return localStorage.getItem("meadowvale_offline") === "1";
  } catch (e) {
    return false;
  }
}
function accSetLoading(text) {
  const el = document.querySelector("#loading .ld-sub");
  if (el) el.textContent = text;
}
function accSavedAt(text) {
  const m = text && /"savedAt":(\d+)\}$/.exec(text.slice(-40));
  return m ? +m[1] : 0;
}
function accPlay(kind, id) {
  try {
    sessionStorage.setItem(PLAY_KEY, kind + ":" + id);
  } catch (e) {}
  location.reload();
}

async function accStartCloud(kind, id) {
  if (!API.loggedIn) throw new Error("Log in to open online worlds.");
  accSetLoading("Loading world…");
  const r = await API.get("/worlds/" + id, 60000);
  NET.world = r.world;
  NET.wantRole = kind === "spec" || r.role === "spectator" ? "spectator" : "player";
  accSetLoading("Connecting…");
  await netConnect();
  const j = await netJoin(r.world.id, NET.wantRole);
  let text = r.save;
  if (j.host) {
    NET.role = "host";
    let local = null;
    try {
      local = localStorage.getItem("meadowvale_cloud_" + id);
    } catch (e) {}
    if (local && accSavedAt(local) > accSavedAt(text)) text = local;
  } else if (j.hasHost) {
    NET.role = j.role === "spectator" ? "spectator" : "guest";
    accSetLoading("Downloading the live world…");
    const s = await netWait((m) => m.t === "snapshot", 90000);
    text = s.data;
  } else NET.role = "spectator";
  CLOUD_WORLD = {
    id: kind + ":" + id,
    key: "meadowvale_cloud_" + id,
    name: r.world.name,
    seed: r.world.seed,
    mode: r.world.mode,
    type: r.world.type,
  };
  PRELOAD_SAVE = text || null;
  boot();
  NET.booted = true;
  if (NET.host) {
    NET.forceKey = true;
    if (!text) netCloudSave(true);
  }
  netEnsureUI();
  netFlush();
  document.body.classList.add("mp-on");
  if (NET.spectator)
    toast(
      j.hasHost
        ? `👀 Watching <b>${esc(r.world.name)}</b> live`
        : `👀 Nobody is playing <b>${esc(r.world.name)}</b> right now - showing the last save.`,
      "info",
    );
}
async function bootAccount() {
  netInstall();
  setTimeout(accHeartbeat, 2000);
  window.addEventListener("beforeunload", accBeforeUnload);
  let play = "";
  try {
    play = sessionStorage.getItem(PLAY_KEY) || "";
  } catch (e) {}
  const m = /^(cloud|spec):(.+)$/.exec(play);
  if (!m) return boot();
  try {
    await accStartCloud(m[1], m[2]);
  } catch (e) {
    console.warn(e);
    try {
      sessionStorage.removeItem(PLAY_KEY);
    } catch (er) {}
    ACC.flash = e.message || "Couldn't open that world.";
    CLOUD_WORLD = null;
    NET.role = null;
    NET.closing = true;
    try {
      if (NET.ws) NET.ws.close();
    } catch (er) {}
    if (!S || S.demo || !NET.booted) boot();
  }
}
window.removeEventListener("load", boot);
window.addEventListener("load", bootAccount);

const _currentWorldAcc = currentWorld;
currentWorld = function () {
  return CLOUD_WORLD || _currentWorldAcc();
};
const _saveAcc = save;
save = function () {
  if (!S || S.demo || resetting || ACC.noSave || NET.remote) return;
  if (!NET.host) return _saveAcc();
  let text;
  try {
    text = serializeSave();
  } catch (e) {
    console.warn("save failed", e);
    return;
  }
  try {
    localStorage.setItem(SAVE_KEY, text);
  } catch (e) {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (er) {}
  }
  lastSavedAt = Date.now();
  netCloudSave(false, text);
};
function accBeforeUnload(e) {
  if (!S || S.demo || resetting || ACC.noSave || NET.remote) return;
  if (Date.now() - lastSavedAt < 8000) return;
  e.preventDefault();
  e.returnValue = "";
}

Object.assign(ACT, {
  "to-title": () => {
    if (!S || S.demo) return toTitle();
    if (NET.remote) {
      dialog({
        title: "🚪 Leave this world?",
        body: NET.guest ? "The host keeps the world running and saves it to the owner's account." : "You'll stop watching.",
        yes: "Leave",
        onYes: () => netExitToTitle(false),
      });
      return;
    }
    const when = lastSavedAt ? Math.round((Date.now() - lastSavedAt) / 1000) : 0;
    dialog({
      title: "💾 Save before leaving?",
      body: `${NET.host ? "Your world is saved to your account" : "Your world is saved in this browser"} automatically every minute${when > 5 ? ` - last save was <b>${when < 90 ? when + " seconds" : Math.round(when / 60) + " minutes"} ago</b>` : ""}.
        <div class="acc-dlg-alt"><button class="btn red small" data-act="a-exit-nosave">Exit without saving</button></div>`,
      yes: "💾 Save & exit",
      onYes: () => (NET.host ? netExitToTitle(true) : toTitle()),
    });
  },
  "a-exit-nosave": () => {
    closeDialog();
    ACC.noSave = true;
    if (NET.role) return netExitToTitle(false);
    resetting = true;
    try {
      sessionStorage.removeItem(PLAY_KEY);
    } catch (e) {}
    location.reload();
  },
});

function accRow(w, kind) {
  const live = w.live && w.live.online ? `<span class="acc-live">🟢 ${w.live.online} online</span>` : "";
  const s = w.stats || {};
  const btns =
    kind === "mine"
      ? `<button class="btn green small" data-act="a-play" data-id="${w.id}">▶ Play</button><button class="btn blue small" data-act="a-members" data-id="${w.id}" title="Players">👥</button><button class="btn blue small" data-act="a-rename" data-id="${w.id}" title="Rename">✏️</button><button class="btn red small" data-act="a-delworld" data-id="${w.id}" title="Delete">🗑️</button>`
      : kind === "shared"
        ? `<button class="btn green small" data-act="a-play" data-id="${w.id}">▶ Play</button><button class="btn blue small" data-act="a-watch" data-id="${w.id}" title="Watch">👀</button><button class="btn red small" data-act="a-leave" data-id="${w.id}" title="Leave">🚪</button>`
        : `<button class="btn blue small" data-act="a-watch" data-id="${w.id}">👀 Watch</button>`;
  return `<div class="ttl-world"><div class="tw-ic">${(WORLD_TYPES[w.type] || WORLD_TYPES.normal).icon}</div>
    <div class="tw-main"><div class="tw-name">${esc(w.name)} ${live}</div>
    <div class="tw-sub">${kind === "mine" ? "" : `by <b>${esc(w.owner.username)}</b> · `}${(GAME_MODES[w.mode] || GAME_MODES.career).icon} ${(GAME_MODES[w.mode] || GAME_MODES.career).name}${w.members.length ? ` · 👥 ${w.members.map((m) => esc(m.username)).join(", ")}` : ""}</div>
    <div class="tw-sub">${w.hasSave ? `⭐ Lv ${s.level || 1} · 👥 ${fmt(s.pop || 0)} · 🪙 ${fmt(s.coins || 0)}` : "Not started yet"}</div></div>
    <div class="tw-btns">${btns}</div></div>`;
}
function accHead(title) {
  return `<div class="ttl-h">${title}<button class="ttl-x" data-act="t-view" data-v="home">✕</button></div>`;
}
function accBody() {
  const loading = '<div class="c-foot">Loading…</div>';
  const err = ACC.err ? `<div class="acc-err">${esc(ACC.err)}</div>` : "";
  if (titleView === "auth") {
    const su = ACC.authMode === "signup";
    return `<div class="ttl-card acc-auth">
      <div class="acc-tabs"><button class="acc-tab ${su ? "" : "on"}" data-act="a-authmode" data-v="login">🔑 Log in</button><button class="acc-tab ${su ? "on" : ""}" data-act="a-authmode" data-v="signup">✨ Create account</button></div>
      <label class="ttl-l">Username<input id="acc-user" class="ttl-in" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false"></label>
      <label class="ttl-l">Password<input id="acc-pass" class="ttl-in" type="password" maxlength="200" autocomplete="${su ? "new-password" : "current-password"}"></label>
      ${su ? '<div class="acc-hint">3-20 letters, numbers or _ · at least 6 characters for the password</div>' : ""}
      ${err}
      <button class="ttl-btn primary" data-act="a-auth" ${ACC.busy ? "disabled" : ""}>${ACC.busy ? "Please wait…" : su ? "Create account" : "Log in"}</button>
      <div class="acc-why">An account lets you play online with friends, watch their worlds and appear on the leaderboards.</div>
      <button class="acc-link" data-act="a-offline">Play offline without an account ›</button></div>`;
  }
  if (titleView === "cloud") {
    const c = ACC.cloud;
    const sec = (title, list, kind, empty) =>
      `<div class="acc-sec">${title}</div>${list.length ? `<div class="ttl-worlds">${list.map((w) => accRow(w, kind)).join("")}</div>` : `<div class="c-foot">${empty}</div>`}`;
    return `<div class="ttl-card">${accHead("🌐 Online Worlds")}${err}
      <button class="ttl-btn primary" data-act="a-newonline">✨ New online world <small>play together with friends</small></button>
      ${c ? sec("My worlds", c.mine, "mine", "No online worlds yet - create one, or upload a world from 🌍 My Worlds.") + sec("Shared with me", c.shared, "shared", "When a friend adds you to their world it shows up here.") + sec("Friends' worlds", c.friends, "friends", "Your friends' worlds appear here - you can watch them live.") : loading}</div>`;
  }
  if (titleView === "members") {
    const m = ACC.members;
    if (!m) return `<div class="ttl-card">${accHead("👥 Players")}${err}${loading}</div>`;
    const ids = new Set(m.world.members.map((x) => x.id));
    const add = m.friends.filter((f) => !ids.has(f.id));
    return `<div class="ttl-card">${accHead("👥 Players in " + esc(m.world.name))}${err}
      <div class="acc-sec">Players</div>${m.world.members.length ? m.world.members.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b><span class="acc-sp"></span><button class="btn red small" data-act="a-rmmember" data-w="${m.world.id}" data-u="${u.id}">Remove</button></div>`).join("") : '<div class="c-foot">Only you so far.</div>'}
      <div class="acc-sec">Add a friend</div>${add.length ? add.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b><span class="acc-sp"></span><button class="btn green small" data-act="a-addmember" data-w="${m.world.id}" data-u="${u.id}">➕ Add</button></div>`).join("") : '<div class="c-foot">Add friends in 👥 Friends first - then you can invite them here.</div>'}
      <button class="ttl-btn" data-act="a-view" data-v="cloud">‹ Back to Online Worlds</button></div>`;
  }
  if (titleView === "friends") {
    const f = ACC.friends,
      sr = ACC.search.users;
    const status = (u) =>
      u.playing ? `<small class="acc-on">🟢 ${u.playing.role === "spectator" ? "watching" : "playing"} ${esc(u.playing.name)}</small>` : u.online ? '<small class="acc-on">🟢 online</small>' : `<small class="acc-off">${accSeen(u.lastSeen)}</small>`;
    const rel = (u) =>
      u.relation === "friend"
        ? '<span class="acc-tag">Friends ✓</span>'
        : u.relation === "sent"
          ? '<span class="acc-tag">Request sent</span>'
          : u.relation === "incoming"
            ? `<button class="btn green small" data-act="a-accept" data-u="${u.id}">Accept</button>`
            : `<button class="btn green small" data-act="a-request" data-n="${esc(u.username)}">➕ Add friend</button>`;
    return `<div class="ttl-card">${accHead("👥 Friends")}${err}
      <div class="ttl-row"><input id="acc-q" class="ttl-in" placeholder="Find players by username…" value="${esc(ACC.search.q)}" maxlength="20" autocomplete="off" autocapitalize="off"><button class="btn blue" data-act="a-search">🔍 Search</button></div>
      ${sr ? (sr.length ? sr.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b>${u.online ? '<small class="acc-on">🟢</small>' : ""}<span class="acc-sp"></span>${rel(u)}</div>`).join("") : '<div class="c-foot">No players found.</div>') : ""}
      ${
        f
          ? `${f.incoming.length ? `<div class="acc-sec">Friend requests</div>${f.incoming.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b><span class="acc-sp"></span><button class="btn green small" data-act="a-accept" data-u="${u.id}">Accept</button><button class="btn red small" data-act="a-decline" data-u="${u.id}">✕</button></div>`).join("")}` : ""}
      <div class="acc-sec">My friends (${f.friends.length})</div>${f.friends.length ? f.friends.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b>${status(u)}<span class="acc-sp"></span>${u.playing ? `<button class="btn blue small" data-act="a-play" data-id="${u.playing.id}" title="Join or watch">${u.playing.role === "spectator" ? "👀" : "▶"} Join</button>` : ""}<button class="btn red small" data-act="a-unfriend" data-u="${u.id}" data-n="${esc(u.username)}" title="Remove friend">✕</button></div>`).join("") : '<div class="c-foot">Search for your friends\' usernames above to add them.</div>'}
      ${f.outgoing.length ? `<div class="acc-sec">Sent requests</div>${f.outgoing.map((u) => `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b><span class="acc-sp"></span><button class="btn small" data-act="a-decline" data-u="${u.id}">Cancel</button></div>`).join("")}` : ""}`
          : loading
      }</div>`;
  }
  if (titleView === "leaders") {
    const tabs = { coins: "🪙 Coins", level: "⭐ Level", pop: "👥 Population", cities: "🏛️ Cities", buildings: "🏗️ Buildings" };
    const rows = ACC.lb.rows;
    const me = API.user && API.user.username;
    const friends = new Set(((ACC.friends && ACC.friends.friends) || []).map((u) => u.username));
    return `<div class="ttl-card">${accHead("🏆 Global Leaderboards")}${err}
      <div class="acc-tabs wrap">${Object.entries(tabs).map(([k, v]) => `<button class="acc-tab ${ACC.lb.by === k ? "on" : ""}" data-act="a-lb" data-v="${k}">${v}</button>`).join("")}</div>
      ${
        rows
          ? rows.length
            ? `<div class="acc-lb">${rows.map((r) => `<div class="acc-lbr ${r.owner === me ? "me" : ""}"><span class="acc-rank">${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</span><span class="acc-lbn"><b>${esc(r.name)}</b><small>by ${esc(r.owner)}</small></span><span class="acc-lbv">${fmt(r.stats[ACC.lb.by] || 0)}</span>${r.owner === me || friends.has(r.owner) ? `<button class="btn blue small" data-act="a-watch" data-id="${r.id}" title="Watch">👀</button>` : "<span></span>"}</div>`).join("")}</div>`
            : '<div class="c-foot">No ranked worlds yet. Career worlds saved to an account appear here.</div>'
          : loading
      }
      <div class="acc-hint">Only Career worlds are ranked. Stats update every time a world is saved.</div></div>`;
  }
  return "";
}

const _renderTitleAcc = renderTitle;
renderTitle = function () {
  const el = document.getElementById("title-root");
  if (!el) return;
  const flash = ACC.flash ? `<div class="acc-flash">⚠️ ${esc(ACC.flash)}</div>` : "";
  const chip = API.loggedIn
    ? `<div class="acc-chip"><span>👤 <b>${esc(API.user.username)}</b></span><button class="btn small" data-act="a-logout">Log out</button></div>`
    : titleView !== "auth"
      ? `<div class="acc-chip"><button class="btn green small" data-act="a-view" data-v="auth">🔑 Log in / Sign up</button></div>`
      : "";
  if (ACC_VIEWS[titleView]) {
    el.innerHTML = `<div class="ttl-back"><div class="ttl-logo ${titleView === "auth" ? "" : "small"}"><div class="ttl-title">Meadowvale</div>${titleView === "auth" ? '<div class="ttl-tag">Build anything, anywhere - together with your friends.</div>' : ""}</div>${flash}${accBody()}${chip}<div class="ttl-foot">v1.1</div></div>`;
    const u = document.getElementById("acc-user");
    if (u && !u.value) u.focus();
    return;
  }
  _renderTitleAcc();
  const back = el.querySelector(".ttl-back");
  if (!back) return;
  back.insertAdjacentHTML("beforeend", chip);
  if (flash) back.querySelector(".ttl-logo").insertAdjacentHTML("afterend", flash);
  const foot = back.querySelector(".ttl-foot");
  if (foot) foot.textContent = API.loggedIn ? "v1.1 · signed in as " + API.user.username : "v1.1 · offline worlds are saved in this browser";
  const menu = back.querySelector(".ttl-menu");
  if (menu && API.loggedIn) {
    const first = menu.querySelector('[data-v="create"]');
    first.insertAdjacentHTML(
      "beforebegin",
      `<button class="ttl-btn" data-act="a-view" data-v="cloud">🌐 Online Worlds <small>play with friends</small></button>`,
    );
    menu.insertAdjacentHTML(
      "beforeend",
      `<div class="acc-menu-row"><button class="ttl-btn" data-act="a-view" data-v="friends">👥 Friends${ACC.friends && ACC.friends.incoming.length ? ` <b class="acc-badge">${ACC.friends.incoming.length}</b>` : ""}</button><button class="ttl-btn" data-act="a-view" data-v="leaders">🏆 Leaderboards</button></div>`,
    );
  } else if (menu)
    menu.insertAdjacentHTML("beforeend", `<button class="ttl-btn" data-act="a-view" data-v="leaders" ${API.reachable === false ? "disabled" : ""}>🏆 Leaderboards</button>`);
  if (titleView === "worlds" && API.loggedIn)
    for (const b of back.querySelectorAll('.tw-btns [data-act="t-export"]'))
      b.insertAdjacentHTML("beforebegin", `<button class="btn green small" data-act="a-upload" data-id="${b.dataset.id}" title="Upload to my account to play online">☁️</button>`);
  if (titleView === "create" && API.loggedIn) {
    const head = back.querySelector(".ttl-card .ttl-h");
    const fr = (ACC.friends && ACC.friends.friends) || [];
    head.insertAdjacentHTML(
      "afterend",
      `<div class="ttl-l">Where to save</div><div class="ttl-opts"><button class="ttl-opt ${ACC.createOnline ? "on" : ""}" data-act="a-online" data-v="1"><b>🌐 Online</b><small>Saved to your account. Friends can join and watch live.</small></button><button class="ttl-opt ${ACC.createOnline ? "" : "on"}" data-act="a-online" data-v="0"><b>💻 This browser</b><small>Single player, works offline.</small></button></div>
      ${ACC.createOnline ? `<div class="ttl-l">Invite friends <small>- they can build with you (you can add more later)</small></div><div class="acc-invite">${fr.length ? fr.map((u) => `<button class="acc-pick ${ACC.invite.has(u.id) ? "on" : ""}" data-act="a-pick" data-u="${u.id}">${ACC.invite.has(u.id) ? "✓ " : ""}${esc(u.username)}</button>`).join("") : '<small class="acc-hint">No friends yet - add some from 👥 Friends.</small>'}</div>` : ""}`,
    );
  }
};

async function accLoad(view) {
  ACC.err = "";
  try {
    if (view === "cloud" || view === "worlds") {
      ACC.cloud = await API.get("/worlds");
      accAutoLink();
    }
    if (view === "friends" || view === "home" || view === "create" || view === "leaders") {
      if (API.loggedIn) ACC.friends = await API.get("/friends");
    }
    if (view === "leaders") ACC.lb.rows = (await API.get("/leaderboard?by=" + ACC.lb.by)).rows;
  } catch (e) {
    ACC.err = e.message;
    if (!API.loggedIn && view !== "leaders") titleView = "auth";
  }
  if (titleView === view || (view === "home" && !ACC_VIEWS[titleView])) renderTitle();
}
function accGo(view) {
  readTitleForm();
  titleView = view;
  ACC.err = "";
  if (view === "members") ACC.members = null;
  if (view === "leaders") ACC.lb.rows = null;
  sfx("click");
  renderTitle();
  accLoad(view);
}
async function accDo(fn, view) {
  ACC.err = "";
  try {
    await fn();
  } catch (e) {
    ACC.err = e.message;
    toast("⚠️ " + esc(e.message), "warn");
  }
  if (view) await accLoad(view);
  else renderTitle();
}
async function accLoadMembers(id) {
  try {
    const [c, f] = await Promise.all([API.get("/worlds"), API.get("/friends")]);
    ACC.cloud = c;
    ACC.friends = f;
    const w = c.mine.find((x) => x.id === id);
    if (!w) throw new Error("World not found.");
    ACC.members = { world: w, friends: f.friends };
  } catch (e) {
    ACC.err = e.message;
  }
  renderTitle();
}

const _tViewAcc = ACT["t-view"];
const _tCreateAcc = ACT["t-create"];
Object.assign(ACT, {
  "t-view": (d) => {
    _tViewAcc(d);
    if (d.v === "home" || d.v === "create" || (d.v === "worlds" && API.loggedIn)) accLoad(d.v);
  },
  "t-create": () => {
    if (!(API.loggedIn && ACC.createOnline)) return _tCreateAcc();
    if (ACC.creating) return;
    ACC.creating = true;
    readTitleForm();
    accDo(async () => {
      const r = await API.post("/worlds", {
        name: titleForm.name.trim() || "New World",
        seed: titleForm.seed.trim() || randomSeedText(),
        mode: titleForm.mode,
        type: titleForm.type,
        members: [...ACC.invite],
      });
      accPlay("cloud", r.world.id);
    }).then(() => setTimeout(() => (ACC.creating = false), 3000));
  },
  "a-view": (d) => accGo(d.v),
  "a-authmode": (d) => {
    ACC.authMode = d.v;
    ACC.err = "";
    renderTitle();
  },
  "a-auth": async () => {
    const u = document.getElementById("acc-user").value.trim(),
      p = document.getElementById("acc-pass").value;
    if (!u || !p) {
      ACC.err = "Enter a username and password.";
      renderTitle();
      return;
    }
    ACC.busy = true;
    ACC.err = "";
    renderTitle();
    document.getElementById("acc-user").value = u;
    try {
      const r = await API.post("/auth/" + (ACC.authMode === "signup" ? "signup" : "login"), { username: u, password: p });
      API.setAuth(r.token, r.user);
      try {
        localStorage.removeItem("meadowvale_offline");
        localStorage.setItem(ACC_NOTICE_KEY, "1");
      } catch (e) {}
      ACC.busy = false;
      titleView = "home";
      toast(ACC.authMode === "signup" ? `🎉 Welcome to Meadowvale, <b>${esc(r.user.username)}</b>!` : `👋 Welcome back, <b>${esc(r.user.username)}</b>!`, "good");
      renderTitle();
      accLoad("home");
      if (worldsList().length && ACC.authMode === "signup")
        setTimeout(
          () =>
            dialog({
              title: "☁️ Bring your worlds online",
              body: "Your existing worlds are still safe in this browser.<br><br>Open <b>🌍 My Worlds</b> and press <b>☁️</b> on any world to copy it to your account - then you can play it with friends from any device.",
              no: false,
              yes: "Got it",
            }),
          500,
        );
    } catch (e) {
      ACC.busy = false;
      ACC.err = e.message;
      renderTitle();
      const pw = document.getElementById("acc-pass");
      if (pw) pw.focus();
    }
  },
  "a-offline": () => {
    try {
      localStorage.setItem("meadowvale_offline", "1");
    } catch (e) {}
    titleView = "home";
    ACC.err = "";
    renderTitle();
  },
  "a-logout": () => {
    API.logout();
    ACC.cloud = ACC.friends = null;
    titleView = "auth";
    renderTitle();
  },
  "a-play": (d) => accPlay("cloud", d.id),
  "a-watch": (d) => accPlay("spec", d.id),
  "a-newonline": () => {
    ACC.createOnline = true;
    titleView = "create";
    if (!titleForm.seed) titleForm.seed = randomSeedText();
    renderTitle();
    accLoad("create");
  },
  "a-online": (d) => {
    readTitleForm();
    ACC.createOnline = d.v === "1";
    renderTitle();
  },
  "a-pick": (d) => {
    readTitleForm();
    if (ACC.invite.has(d.u)) ACC.invite.delete(d.u);
    else ACC.invite.add(d.u);
    renderTitle();
  },
  "a-members": (d) => {
    titleView = "members";
    ACC.members = null;
    ACC.err = "";
    renderTitle();
    accLoadMembers(d.id);
  },
  "a-addmember": (d) =>
    accDo(async () => {
      await API.post(`/worlds/${d.w}/members`, { userId: d.u });
      toast("➕ Added - they can now join and build.", "good");
    }).then(() => (titleView === "members" ? accLoadMembers(d.w) : accInviteDialog())),
  "a-rmmember": (d) => accDo(() => API.del(`/worlds/${d.w}/members/${d.u}`)).then(() => (titleView === "members" ? accLoadMembers(d.w) : accInviteDialog())),
  "a-rename": (d) => {
    const w = ACC.cloud && ACC.cloud.mine.find((x) => x.id === d.id);
    if (!w) return;
    dialog({
      title: "✏️ Rename world",
      body: `<input id="acc-rename" class="name-in" maxlength="32" value="${esc(w.name)}">`,
      yes: "Rename",
      onYes: () => {
        const v = document.getElementById("acc-rename").value.trim();
        if (v)
          accDo(async () => {
            await API.patch("/worlds/" + d.id, { name: v });
            const list = worldsList(),
              local = list.find((x) => x.cloudId === d.id);
            if (local) {
              local.name = v;
              _saveWorldsListAcc(list);
            }
          }, "cloud");
      },
    });
  },
  "a-delworld": (d) => {
    const w = ACC.cloud && ACC.cloud.mine.find((x) => x.id === d.id);
    if (!w) return;
    dialog({
      title: "🗑️ Delete online world?",
      body: `<b>${esc(w.name)}</b> will be deleted for everyone, forever.`,
      yes: "Delete",
      cls: "red",
      onYes: () => accDo(() => API.del("/worlds/" + d.id), "cloud"),
    });
  },
  "a-leave": (d) => {
    const w = ACC.cloud && ACC.cloud.shared.find((x) => x.id === d.id);
    if (!w) return;
    dialog({
      title: "🚪 Leave this world?",
      body: `You won't be able to build in <b>${esc(w.name)}</b> unless ${esc(w.owner.username)} adds you again.`,
      yes: "Leave",
      cls: "red",
      onYes: () => accDo(() => API.del(`/worlds/${d.id}/members/${API.user.id}`), "cloud"),
    });
  },
  "a-search": () => {
    const q = (document.getElementById("acc-q").value || "").trim();
    ACC.search.q = q;
    if (q.length < 2) {
      ACC.search.users = null;
      ACC.err = "Type at least 2 letters.";
      renderTitle();
      return;
    }
    accDo(async () => {
      ACC.search.users = (await API.get("/friends/search?q=" + encodeURIComponent(q))).users;
    });
  },
  "a-request": (d) =>
    accDo(async () => {
      const r = await API.post("/friends/request", { username: d.n });
      toast(r.status === "friend" ? `🤝 You and <b>${esc(d.n)}</b> are now friends!` : `📨 Friend request sent to <b>${esc(d.n)}</b>`, "good");
      if (ACC.search.q.length >= 2) ACC.search.users = (await API.get("/friends/search?q=" + encodeURIComponent(ACC.search.q))).users;
    }, "friends"),
  "a-accept": (d) =>
    accDo(async () => {
      await API.post("/friends/accept", { userId: d.u });
      if (ACC.search.users) ACC.search.users = (await API.get("/friends/search?q=" + encodeURIComponent(ACC.search.q))).users;
    }, "friends"),
  "a-decline": (d) => accDo(() => API.post("/friends/decline", { userId: d.u }), "friends"),
  "a-unfriend": (d) =>
    dialog({
      title: "Remove friend?",
      body: `Remove <b>${esc(d.n)}</b> from your friends?`,
      yes: "Remove",
      cls: "red",
      onYes: () => accDo(() => API.del("/friends/" + d.u), "friends"),
    }),
  "a-lb": (d) => {
    ACC.lb.by = d.v;
    ACC.lb.rows = null;
    renderTitle();
    accLoad("leaders");
  },
  "a-upload": (d) => {
    const w = worldsList().find((x) => x.id === d.id);
    if (!w) return;
    let raw = null;
    try {
      raw = localStorage.getItem(worldKey(w));
    } catch (e) {}
    if (!raw) {
      toast("That world hasn't been saved yet - play it for a moment first.", "warn");
      return;
    }
    const update = !!w.cloudId;
    dialog({
      title: update ? "☁️ Update the online copy?" : "☁️ Upload to your account?",
      body: update
        ? `This world is already in your account. Its online copy will be replaced with this browser's version of <b>${esc(w.name)}</b>.`
        : `<b>${esc(w.name)}</b> will be copied to your account as an online world. The copy in this browser stays too, and renaming either one renames both.`,
      yes: update ? "Update" : "Upload",
      onYes: () =>
        accDo(async () => {
          if (ACC.uploading) return;
          ACC.uploading = true;
          try {
            toast("☁️ Uploading…", "info");
            const sv = JSON.parse(raw);
            const stats = {
              level: sv.S.level,
              coins: Math.floor(sv.S.coins || 0),
              pop: (sv.S.people || []).length || w.pop || 0,
              cities: (sv.S.cities || []).length,
              buildings: (sv.ents || []).length,
            };
            let done = false;
            if (update)
              try {
                await API.put(`/worlds/${w.cloudId}/save`, { save: raw, stats });
                await API.patch("/worlds/" + w.cloudId, { name: w.name });
                done = true;
              } catch (e) {}
            if (!done) {
              const r = await API.post("/worlds", { name: w.name, seed: w.seed, mode: w.mode, type: w.type, save: raw, stats });
              accLinkLocal(w.id, r.world.id);
            }
            toast(`☁️ <b>${esc(w.name)}</b> is ${update && done ? "updated" : "now"} in 🌐 Online Worlds!`, "good");
          } finally {
            ACC.uploading = false;
          }
        }),
    });
  },
  "a-export-all": () => {
    for (const w of worldsList()) ACT["t-export"]({ id: w.id });
  },
  "mp-invite": () => accInviteDialog(),
});

function accLinkLocal(localId, cloudId) {
  const list = worldsList(),
    w = list.find((x) => x.id === localId);
  if (!w) return;
  w.cloudId = cloudId;
  _saveWorldsListAcc(list);
}
const _saveWorldsListAcc = saveWorldsList;
saveWorldsList = function (list) {
  let prev = [];
  try {
    prev = JSON.parse(localStorage.getItem(WORLDS_KEY) || "[]");
  } catch (e) {}
  _saveWorldsListAcc(list);
  if (!API.loggedIn) return;
  for (const w of list) {
    const p = prev.find((x) => x.id === w.id);
    if (w.cloudId && p && p.name !== w.name) API.patch("/worlds/" + w.cloudId, { name: w.name }).catch(() => {});
  }
};
function accAutoLink() {
  if (!ACC.cloud) return;
  const list = worldsList();
  let changed = false;
  for (const w of list) {
    if (w.cloudId) continue;
    const same = ACC.cloud.mine.filter((c) => c.seed === String(w.seed) && c.mode === (w.mode || "career") && c.hasSave);
    if (same.length !== 1 || list.some((x) => x.cloudId === same[0].id)) continue;
    w.cloudId = same[0].id;
    changed = true;
    if (same[0].name !== w.name) {
      API.patch("/worlds/" + same[0].id, { name: w.name }).catch(() => {});
      same[0].name = w.name;
    }
  }
  if (changed) _saveWorldsListAcc(list);
}
function accHeartbeat() {
  if (!API.loggedIn || document.hidden) return;
  API.post("/auth/ping").catch(() => {});
}
setInterval(accHeartbeat, 45000);
document.addEventListener("visibilitychange", accHeartbeat);
setInterval(() => {
  if (document.hidden || !API.loggedIn || !document.getElementById("title-root")) return;
  if (titleView === "friends" || titleView === "cloud") accLoad(titleView);
}, 20000);
function accSeen(t) {
  if (!t) return "offline";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 60 ? `seen ${Math.max(1, m)} min ago` : m < 1440 ? `seen ${Math.round(m / 60)} h ago` : `seen ${Math.round(m / 1440)} d ago`;
}

async function accInviteDialog() {
  if (!NET.world) return;
  try {
    const [c, f] = await Promise.all([API.get("/worlds"), API.get("/friends")]);
    const w = c.mine.find((x) => x.id === NET.world.id);
    if (!w) return;
    const ids = new Set(w.members.map((m) => m.id));
    const rows = f.friends
      .map(
        (u) =>
          `<div class="acc-user"><span class="acc-av">${esc(u.username[0].toUpperCase())}</span><b>${esc(u.username)}</b>${u.online ? '<small class="acc-on">🟢</small>' : ""}<span class="acc-sp"></span>${ids.has(u.id) ? `<button class="btn red small" data-act="a-rmmember" data-w="${w.id}" data-u="${u.id}">Remove</button>` : `<button class="btn green small" data-act="a-addmember" data-w="${w.id}" data-u="${u.id}">➕ Add</button>`}</div>`,
      )
      .join("");
    dialog({
      title: "👥 Players in this world",
      body: `<div class="acc-dlg-list">${rows || "Add friends from the main menu's 👥 Friends first."}</div><small>Players can build with you. Any friend of yours can watch.</small>`,
      no: false,
      yes: "Done",
    });
  } catch (e) {
    toast("⚠️ " + esc(e.message), "warn");
  }
}

const _startTitleAcc = startTitle;
startTitle = function () {
  if (!API.loggedIn && !accOffline() && API.reachable !== false) titleView = "auth";
  _startTitleAcc();
  accHeartbeat();
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" || !ev.target || !ev.target.id) return;
    if (ev.target.id === "acc-user") document.getElementById("acc-pass").focus();
    else if (ev.target.id === "acc-pass") ACT["a-auth"]();
    else if (ev.target.id === "acc-q") ACT["a-search"]();
  });
  if (API.loggedIn)
    API.get("/auth/me", 8000).then(
      (r) => {
        API.setAuth(API.token, r.user);
        accLoad("home");
      },
      () => {
        if (!API.loggedIn) {
          titleView = "auth";
          ACC.flash = "Your login expired - please log in again.";
        }
        renderTitle();
      },
    );
  else if (titleView === "auth") {
    let up = false;
    const slow = setTimeout(() => {
      if (up || titleView !== "auth") return;
      ACC.err = "⏳ Waking up the server - this can take up to a minute…";
      renderTitle();
    }, 3000);
    API.get("/health", 90000).then(
      () => {
        up = true;
        clearTimeout(slow);
        if (titleView === "auth" && ACC.err.startsWith("⏳")) {
          ACC.err = "";
          renderTitle();
        }
      },
      () => {
        clearTimeout(slow);
        if (titleView === "auth") {
          ACC.err = "Can't reach the Meadowvale server right now - you can still play offline.";
          renderTitle();
        }
      },
    );
  }
  let seen = false;
  try {
    seen = !!localStorage.getItem(ACC_NOTICE_KEY);
  } catch (e) {}
  if (!seen && worldsList().length) {
    const done = () => {
      try {
        localStorage.setItem(ACC_NOTICE_KEY, "1");
      } catch (e) {}
    };
    setTimeout(() => {
      dialog({
        title: "🛡️ Your worlds are safe",
        body: `<div class="dlg-big">🌍</div>Meadowvale now has <b>accounts</b>, <b>friends</b> and <b>live multiplayer</b>!<br><br>
          Your ${worldsList().length === 1 ? "world is" : worldsList().length + " worlds are"} still saved in this browser - nothing was lost, and you can keep playing offline.<br><br>
          To play online: <b>create a free account</b>, open <b>🌍 My Worlds</b> and press <b>☁️</b> to copy a world into your account.
          <div class="acc-dlg-alt"><button class="btn blue small" data-act="a-export-all">📤 Download a backup of every world</button></div>`,
        yes: API.loggedIn ? "Great!" : "Create account",
        no: API.loggedIn ? false : "Maybe later",
        onYes: () => {
          done();
          if (!API.loggedIn) {
            ACC.authMode = "signup";
            titleView = "auth";
            renderTitle();
          }
        },
      });
      dlgNo = done;
    }, 700);
  }
};
