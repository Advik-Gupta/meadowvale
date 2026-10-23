producerCollect = function (e, quiet) {
  const pr = BUILD[e.t].produce;
  if (!producerReady(e)) {
    if (!quiet) producerPopup(e);
    return 0;
  }
  const n = pr.qty * lvlOf(e);
  const items = pr.items.filter((k) => spaceFor(k) >= n);
  if (!items.length) {
    e.full = true;
    if (!quiet) {
      toastOnce("Storage is full! 📦 Build a Material Yard or Depot.", "warn");
      sfx("error");
    }
    return 0;
  }
  e.full = false;
  for (const k of items) addItem(k, n);
  e.pp = NOW;
  addXP(2);
  const p = entWorld(e, 20);
  floatText(
    p[0],
    p[1],
    items.map((k) => `+${n}${ITEMS[k].icon}`).join(" "),
    "#ffffff",
  );
  if (!quiet) {
    sfx("harvest");
    const [sx, sy] = entScreen(e, 20);
    flyIcon(ITEMS[items[0]].icon, sx, sy, "#btn-inventory", n * items.length);
  }
  return n * items.length;
};

function producersReady(w) {
  const out = [];
  for (const e of world.ents.values()) {
    const b = BUILD[e.t];
    if (
      !b.produce ||
      e.build ||
      e.moving ||
      e.burnt ||
      !producerReady(e) ||
      claimed(e.id, w)
    )
      continue;
    out.push({ e });
  }
  return out;
}
ROLES.quarryman.desc =
  "Collects stone, clay and sand from quarries and other producers, then breaks boulders.";
const _quarryDecide = JOB_AI.quarryman.decide;
JOB_AI.quarryman.decide = function (w) {
  const best = nearestBy(w, producersReady(w));
  if (best) {
    w.status = `Collecting from the ${BUILD[best.e.t].name}`;
    return { type: "j-collect", id: best.e.id, work: 1.2 };
  }
  return _quarryDecide(w);
};
const _quarryAct = JOB_AI.quarryman.act;
JOB_AI.quarryman.act = function (w, t) {
  if (t.type === "j-collect") {
    const e = world.ents.get(t.id);
    if (e && producerCollect(e, true)) {
      gainSkill(w, 1);
      w.bubble = "⛏️";
      w.bubbleT = 1;
    } else if (e && e.full) w.status = "Storage full — build more storage";
    return;
  }
  return _quarryAct(w, t);
};

const HUB_PANELS = {
  trainstation: ["transport", "rail", "🚂 Railway"],
  freightdepot: ["transport", "rail", "🚂 Railway"],
  signal: ["transport", "rail", "🚂 Railway"],
  rail_central: ["transport", "rail", "🚂 Railway"],
  rail_halt: ["transport", "rail", "🚂 Railway"],
  shipyard: ["transport", "sea", "🚢 Sea port"],
  berth: ["transport", "sea", "🚢 Sea port"],
  seaport: ["transport", "sea", "🚢 Sea port"],
  lighthouse: ["transport", "sea", "🚢 Sea port"],
  terminal: ["transport", "air", "✈️ Airport"],
  airport: ["transport", "air", "✈️ Airport"],
  controltower: ["transport", "air", "✈️ Airport"],
  exchange: ["transport", "exchange", "🌐 Exchange"],
  helipad: ["orders", "express", "🚁 Express orders"],
  mine: ["mine", null, "⛏️ Mine"],
  institute: ["institute", null, "⚙️ Institute"],
  museum: ["collections", null, "🏺 Collections"],
  barn: ["inventory", null, "🛖 Barn"],
  market: ["orders", null, "🧾 Orders"],
  courier: ["orders", "courier", "📮 Courier"],
  jobs: ["staff", null, "👷 Staff"],
};
function hubPopup(e) {
  const [pn, tab, label] = HUB_PANELS[e.t],
    b = BUILD[e.t];
  showPopup(e, {
    sig: () => "" + lvlOf(e) + (S.coins >= upgradeCost(e)),
    render:
      () => `<div class="pp-title">${thumbMini(e.t)} ${b.name}</div><div class="pp-sub">${b.desc || ""}</div>${upgradeHTML(e)}
      <div class="pp-btns"><button class="btn green small" data-act="hub-open" data-p="${pn}" data-t="${tab || ""}">${label} ›</button><button class="btn blue small" data-act="p-move">✋ Move</button>${b.special ? "" : '<button class="btn red small" data-act="p-sell">Sell</button>'}</div>`,
  });
}
const _onEntityClickOps = onEntityClick;
onEntityClick = function (e, sx, sy) {
  if (
    e &&
    !e.build &&
    !e.burnt &&
    !(e.fire && e.fire > NOW) &&
    HUB_PANELS[e.t]
  ) {
    hubPopup(e);
    return;
  }
  return _onEntityClickOps(e, sx, sy);
};

function rotateEnt(e) {
  if (!e || !canRotate(e.t)) return;
  if (e.w === e.h) e.flip = !e.flip;
  else {
    setOcc(e, -1);
    if (placeOK(e.t, e.x, e.y, e.id, e.h, e.w)) {
      const w = e.w;
      e.w = e.h;
      e.h = w;
      e.flip = !e.flip;
    } else toastOnce("No room to turn it here — move it first.", "warn");
    setOcc(e, e.id);
  }
  worldChanged();
  sfx("click");
}
function editOne(e) {
  hidePopup();
  enterEdit();
  editToggle(e);
}
const _showPopupOps = showPopup;
showPopup = function (ent, def) {
  if (ent && def && def.render && !def.noOps) {
    const r0 = def.render;
    def = Object.assign({}, def, {
      render: () => {
        let html = r0();
        const b = BUILD[ent.t];
        if (
          canRotate(ent.t) &&
          html.includes('data-act="p-move"') &&
          !html.includes('data-act="p-rotate"')
        )
          html = html.replace(
            /(<button[^>]*data-act="p-move"[^>]*>[^<]*<\/button>)/,
            '$1<button class="btn blue small" data-act="p-rotate">🔄 Rotate</button>',
          );
        if (b.flat && !b.nature && !html.includes('data-act="p-edit"')) {
          const i = html.lastIndexOf("</div>");
          html =
            html.slice(0, i) +
            '<button class="btn blue small" data-act="p-edit">✏️ Edit / move</button>' +
            html.slice(i);
          if (ent.t === "rail")
            html = html.replace(
              '<div class="pp-btns',
              '<div class="pp-note">Track pieces turn by themselves to join their neighbours. Use ✏️ Edit to select several and move or remove them.</div><div class="pp-btns',
            );
        }
        return html;
      },
    });
  }
  return _showPopupOps(ent, def);
};
Object.assign(ACT, {
  "hub-open": (d) => {
    hidePopup();
    openPanel(d.p, d.t || undefined);
  },
  "p-rotate": () => {
    const e = popEnt();
    if (e) {
      rotateEnt(e);
      if (pop) pop.lastSig = "";
    }
  },
  "p-edit": () => {
    const e = popEnt();
    if (e) editOne(e);
  },
});

function recipeBlockers(e) {
  const b = BUILD[e.t];
  if (!b.recipes) return [];
  const miss = {};
  for (const r of b.recipes) {
    const R = RECIPES[r];
    if (!R) continue;
    const out = R.out || r;
    if (typeof outputUseful === "function" && !outputUseful(out)) continue;
    for (const [k, n] of Object.entries(R.in))
      if ((S.inv[k] || 0) < n) miss[k] = Math.max(miss[k] || 0, n);
  }
  return Object.entries(miss);
}
const _autoHTMLOps = autoProduceHTML;
autoProduceHTML = function (e) {
  let html = _autoHTMLOps(e);
  if (!html) return html;
  const busy = e.job || (e.queue && e.queue.length);
  const miss = busy ? [] : recipeBlockers(e);
  if (miss.length) {
    const src = (k) => {
      const s = typeof SOURCE !== "undefined" && SOURCE[k];
      if (s && s.crop) return "fields";
      if (s && s.t)
        return BUILD[s.t].name + (hasType(s.t) ? "" : " (not built)");
      for (const t in BUILD)
        if (BUILD[t].produce && BUILD[t].produce.items.includes(k))
          return BUILD[t].name + (hasType(t) ? "" : " (not built)");
      return "Supplies / trade";
    };
    html += `<div class="pp-warn">⏳ Waiting for ${miss.map(([k, n]) => `${ITEMS[k].icon} ${ITEMS[k].name} (${S.inv[k] || 0}/${n}) from the ${src(k)}`).join(", ")}</div>`;
  }
  if (e.out && e.out.length && e.out.length >= shelvesOf(e))
    html +=
      '<div class="pp-warn">📦 Shelves full and storage has no room — build more storage.</div>';
  return html;
};
const _extraInfoOps = extraInfo;
extraInfo = function (e) {
  let html = _extraInfoOps(e);
  if (e && BUILD[e.t].produce && !e.build) {
    const s = staffRatio(e),
      quarry = S.workers.some((w) => w.role === "quarryman");
    html += `<div class="pp-sec"><div class="pp-sec-h">⚙️ Collection</div><div class="pp-note">${s > 0 ? "Residents working here collect everything into storage automatically." : quarry ? "Your Quarry Workers collect from here." : "Hire residents (connect it to a road) or a Quarry Worker from the Job Board and it will be collected automatically."}${e.full ? '</div><div class="pp-warn">📦 Storage is full — build a Material Yard or Depot.' : ""}</div></div>`;
  }
  return html;
};
