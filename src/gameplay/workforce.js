const HATS = {
  farmhand: "straw",
  rancher: "cowboy",
  manager: "hard",
  rentcollector: "top",
  shopkeeper: "cap",
  clerk: "capb",
};

const NO_STAFF_LIMIT = 9999;
function staffCap() {
  const j = hasType("jobs");
  if (!j || j.build) return 0;
  return NO_STAFF_LIMIT;
}
function wageOf(w) {
  let m = 1 + 0.25 * (w.skill - 1);
  if (w.trait === "thrifty") m *= 0.75;
  if (w.trait === "laidback") m *= 0.7;
  if (hasPerk("hr")) m *= 0.8;
  if (w.spec) m *= 2;
  return Math.round(ROLES[w.role].wage * m * 10) / 10;
}
function speedOf(w) {
  let m = 1 + 0.12 * (w.skill - 1);
  if (w.trait === "speedy") m *= 1.25;
  if (w.trait === "laidback") m *= 0.8;
  if (hasPerk("nightshift")) m *= 1.25;
  m *= 0.85 + 0.3 * (CITY.hap / 100);
  return m;
}
function payroll() {
  let p = 0;
  for (const w of S.workers) p += wageOf(w);
  return p;
}
function rolesAvailable() {
  return Object.keys(ROLES).filter((r) => S.level >= ROLES[r].level);
}
function hireCost(c) {
  return Math.round(
    ROLES[c.role].hire * (c.skill === 2 ? 1.6 : 1) * (c.spec ? 3 : 1),
  );
}
function maxFields(w) {
  return 4 + 2 * w.skill;
}
function fmt1(n) {
  return (Math.round(n * 10) / 10).toString();
}

function genCandidate(role) {
  const roles = rolesAvailable();
  return {
    cid: Math.random().toString(36).slice(2, 9),
    name: pick(NAMES),
    face: pick(FACES),
    bg: pick(AVATAR_BG),
    role: role || pick(roles),
    trait: pick(Object.keys(TRAITS)),
    skill: Math.random() < 0.2 ? 2 : 1,
    spec:
      (hasType("university") || S.level >= 22) && Math.random() < 0.08
        ? pick(Object.keys(SPECIALISTS))
        : null,
    shirt: pick(SHIRTS),
    pants: pick(PANTS),
    skin: pick(SKINS),
    hair: pick(HAIRS),
  };
}
function refreshCandidates() {
  const roles = rolesAvailable();
  if (!roles.length) return;
  S.cands = roles.map((r) => genCandidate(r));
  while (S.cands.length < 8) S.cands.push(genCandidate());
  S.candT = NOW + 120000;
}
function hireWorker(cid) {
  const c = (S.cands || []).find((x) => x.cid === cid);
  if (!c) return;
  const off = hasType("jobs");
  if (!off) {
    toast("Build an Employment Office first!");
    return;
  }
  if (S.workers.length >= staffCap()) {
    toastOnce(
      "No free staff slots - grow your population or level up!",
      "warn",
    );
    sfx("error");
    return;
  }
  if (!spend(hireCost(c))) return;
  const w = {
    id: S.wseq++,
    isW: true,
    kind: "worker",
    name: c.name,
    face: c.face,
    bg: c.bg,
    role: c.role,
    trait: c.trait,
    skill: c.skill,
    sxp: SKILL_XP[c.skill - 1],
    spec: c.spec || null,
    shirt: c.shirt,
    pants: c.pants,
    skin: c.skin,
    hair: c.hair,
    hat: HATS[c.role],
    x: off.x + off.w / 2 - 0.5,
    y: off.y + off.h - 0.2,
    ph: 0,
    alpha: 1,
    cfg: {},
    status: "Heading to work",
  };
  if (w.role === "farmhand") {
    w.cfg = { crop: "auto", fields: [], auto: true };
    assignFields(w, Math.min(6, maxFields(w)));
  }
  if (w.role === "manager") {
    w.cfg = { fid: null, targets: {} };
    const f = firstUnmanagedFactory();
    if (f) setManagerFactory(w, f.id);
  }
  if (RESERVE_ROLES.includes(w.role))
    w.cfg = { reserve: w.role === "miner" ? 0 : 1 };
  if (ROLE_INIT[w.role]) w.cfg = ROLE_INIT[w.role]();
  S.workers.push(w);
  albumAdd(w);
  S.cands = S.cands.filter((x) => x !== c);
  S.cands.push(genCandidate());
  S.stats.hired++;
  sfx("build");
  toast(
    `${c.face} <b>${c.name}</b> joined as a ${ROLES[c.role].name}!`,
    "good",
  );
  const p = P(w.x + 0.5, w.y + 0.5, 20);
  floatText(p[0], p[1], "👋 Hired!", "#ffffff", 13);
  renderPanel(false);
}
function fireWorker(id) {
  const w = S.workers.find((x) => x.id === id);
  if (!w) return;
  dialog({
    title: `Dismiss ${w.name}?`,
    body: `<div class="dlg-big">${w.face}</div>${w.name} will stop working as your ${ROLES[w.role].name}.`,
    yes: "Dismiss",
    cls: "red",
    onYes: () => {
      S.workers = S.workers.filter((x) => x !== w);
      const p = P(w.x + 0.5, w.y + 0.5, 20);
      floatText(p[0], p[1], "👋 Bye!", "#ffffff", 13);
      renderPanel(true);
    },
  });
}
function assignedFieldIds() {
  const s = new Set();
  for (const w of S.workers)
    if (w.role === "farmhand") for (const id of w.cfg.fields) s.add(id);
  return s;
}
function assignFields(w, n) {
  const taken = assignedFieldIds();
  const mine = w.cfg.fields.map((id) => world.ents.get(id)).filter(Boolean);
  let ax, ay;
  if (mine.length) {
    ax = mine.reduce((a, f) => a + f.x, 0) / mine.length;
    ay = mine.reduce((a, f) => a + f.y, 0) / mine.length;
  } else {
    const b = hasType("barn") || { x: 32, y: 38 };
    ax = b.x;
    ay = b.y;
  }
  const free = [];
  for (const e of world.ents.values())
    if (e.t === "field" && !e.moving && !taken.has(e.id)) free.push(e);
  free.sort(
    (a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay),
  );
  while (w.cfg.fields.length < n && free.length)
    w.cfg.fields.push(free.shift().id);
}
function setFieldCount(w, d) {
  const n = clamp(w.cfg.fields.length + d, 0, maxFields(w));
  if (n > w.cfg.fields.length) {
    const before = w.cfg.fields.length;
    assignFields(w, n);
    if (w.cfg.fields.length === before)
      toastOnce("No unassigned fields left - buy more fields!", "warn");
  } else w.cfg.fields.length = n;
  renderPanel(true);
}
function firstUnmanagedFactory() {
  const taken = new Set(
    S.workers.filter((w) => w.role === "manager").map((w) => w.cfg.fid),
  );
  for (const e of world.ents.values())
    if (FACTORY_TYPES.includes(e.t) && !taken.has(e.id)) return e;
  return null;
}
function setManagerFactory(w, fid) {
  const f = world.ents.get(fid);
  if (!f) return;
  w.cfg.fid = fid;
  const recs = BUILD[f.t].recipes.filter((r) => S.level >= RECIPES[r].level);
  const useful = recs.filter(
    (r) =>
      typeof outputUseful !== "function" ||
      outputUseful((RECIPES[r] && RECIPES[r].out) || r),
  );
  if (!recs.some((r) => w.cfg.targets[r] > 0) && (useful.length || recs.length))
    w.cfg.targets[useful[0] || recs[0]] = 5;
}
function managerOf(e) {
  return S.workers.find((w) => w.role === "manager" && w.cfg.fid === e.id);
}
function gainSkill(w, n) {
  if (w.skill >= 5) return;
  w.sxp += n * (w.trait === "diligent" ? 2 : 1);
  while (w.skill < 5 && w.sxp >= SKILL_XP[w.skill]) {
    w.skill++;
    toast(`⭐ ${w.face} ${w.name} improved to skill level ${w.skill}!`, "good");
    const p = P(w.x + 0.5, w.y + 0.5, 30);
    floatText(p[0], p[1], "⭐ Skill up!", "#ffe680", 14);
    if (w.role === "farmhand")
      assignFields(w, Math.min(maxFields(w), w.cfg.fields.length));
  }
}

function claimed(id, self) {
  for (const w of S.workers)
    if (w !== self && w.task && w.task.id === id) return true;
  return false;
}
function frontOf(e) {
  return [e.x + e.w / 2 - 0.5, e.y + e.h - 0.25];
}
function taskTarget(w) {
  const t = w.task;
  if (t.type === "walk") return [t.x, t.y];
  const e = world.ents.get(t.id);
  if (!e || e.moving || e.dying) return null;
  if (e.t === "field") return [e.x, e.y];
  return frontOf(e);
}
function nearestBy(w, list) {
  let best = null,
    bd = 1e9;
  for (const it of list) {
    if (w.unreach && w.unreach[it.e.id] > NOW) continue;
    const [tx, ty] = it.e.t === "field" ? [it.e.x, it.e.y] : frontOf(it.e);
    const d = Math.hypot(tx - w.x, ty - w.y);
    if (d < bd) {
      bd = d;
      best = it;
    }
  }
  return best;
}
function decide(w) {
  switch (w.role) {
    case "farmhand": {
      const fs = w.cfg.fields
        .map((id) => world.ents.get(id))
        .filter((f) => f && f.t === "field");
      w.cfg.fields = fs.map((f) => f.id);
      if (!fs.length) {
        w.status = "No fields assigned";
        return null;
      }
      const smart = w.cfg.crop === "auto";
      const pickd = smart ? pickDemandCrop(w) : { crop: w.cfg.crop, why: "" };
      const crop = pickd.crop,
        c = CROPS[crop];
      const canSeed =
        !!c &&
        S.level >= c.level &&
        ((S.seeds[crop] || 0) > 0 || (w.cfg.auto && S.coins >= c.seed));
      const cands = [];
      let full = false;
      for (const f of fs) {
        if (f.moving || f.dying || claimed(f.id, w)) continue;
        if (fieldReady(f)) {
          if (spaceFor(f.crop) >= CROP_YIELD)
            cands.push({ e: f, a: "harvest" });
          else full = true;
        } else if (!f.crop && canSeed) cands.push({ e: f, a: "plant" });
      }
      const best = nearestBy(w, cands);
      if (!best) {
        const growing = fs.filter((f) => f.crop && !fieldReady(f)).length,
          blocked = cands.length > 0;
        w.status = full
          ? "Storage full!"
          : blocked
            ? "Can't reach its fields - connect them with a road or bridge"
            : !canSeed && fs.some((f) => !f.crop)
              ? `Out of ${c.name} seeds (no coins to buy more)`
              : growing
                ? `Tending ${growing} growing field${growing === 1 ? "" : "s"}`
                : "Waiting for crops";
        return null;
      }
      w.status =
        best.a === "harvest"
          ? `Harvesting ${CROPS[best.e.crop].name}`
          : `Planting ${c.name}${pickd.why ? " " + pickd.why : ""}`;
      return { type: best.a, id: best.e.id, crop, work: 0.55 };
    }
    case "rancher": {
      const cands = [];
      let need = null;
      for (const e of world.ents.values()) {
        if (!BUILD[e.t].animal || e.moving || claimed(e.id, w)) continue;
        const c = animalCounts(e),
          b = BUILD[e.t];
        if (c.ready && spaceFor(b.out) >= 1) cands.push({ e, a: "collect" });
        else if (c.hungry) {
          if ((S.inv[b.feed] || 0) > 0) cands.push({ e, a: "feed" });
          else need = b.feed;
        }
      }
      const best = nearestBy(w, cands);
      if (!best) {
        w.status = need
          ? `Needs ${ITEMS[need].name}`
          : hasAnyType(ANIMAL_TYPES)
            ? "Animals are content"
            : "No animals yet";
        return null;
      }
      w.status =
        best.a === "collect"
          ? `Collecting ${ITEMS[BUILD[best.e.t].out].name}`
          : "Feeding animals";
      return { type: best.a, id: best.e.id, work: 0.8 };
    }
    case "rentcollector": {
      const cands = [];
      for (const e of world.ents.values())
        if (BUILD[e.t].rent && !e.moving && rentReady(e) && !claimed(e.id, w))
          cands.push({ e, a: "rent" });
      const best = nearestBy(w, cands);
      if (!best) {
        w.status = cands.length
          ? "Can't reach the homes waiting for rent"
          : "All rent collected";
        return null;
      }
      w.status = `Collecting rent (${cands.length} home${cands.length === 1 ? "" : "s"} ready)`;
      return { type: "rent", id: best.e.id, work: 0.5 };
    }
    case "manager": {
      const f = world.ents.get(w.cfg.fid);
      if (!f || !FACTORY_TYPES.includes(f.t)) {
        w.status = "No factory assigned";
        return null;
      }
      const [fx, fy] = frontOf(f);
      if (Math.hypot(fx - w.x, fy - w.y) > 0.3) {
        w.status = `Going to ${BUILD[f.t].name}`;
        return { type: "walk", x: fx, y: fy, work: 0.1 };
      }
      if (
        f.out.length &&
        spaceFor(RECIPES[f.out[0]].out || f.out[0]) >=
          (RECIPES[f.out[0]].qty || 1)
      ) {
        w.status = "Collecting goods";
        return { type: "collect", id: f.id, work: 0.4 };
      }
      if ((f.job ? 1 : 0) + f.queue.length < slotsOf(f)) {
        for (const r of BUILD[f.t].recipes) {
          const tgt = w.cfg.targets[r] || 0;
          if (!tgt || S.level < RECIPES[r].level) continue;
          const q = RECIPES[r].qty || 1;
          const pending =
            (f.job && f.job.r === r ? 1 : 0) +
            f.queue.filter((x) => x === r).length +
            f.out.filter((x) => x === r).length;
          if (
            (S.inv[RECIPES[r].out || r] || S.powers[r] || 0) + pending * q >=
            tgt
          )
            continue;
          if (
            Object.entries(RECIPES[r].in).every(
              ([k, n]) => (S.inv[k] || 0) >= n,
            )
          ) {
            w.status = `Making ${GOODS[r].name}`;
            return { type: "make", id: f.id, r, work: 0.35 };
          }
        }
      }
      w.status = f.job
        ? `Supervising ${GOODS[f.job.r].name}`
        : "Waiting for ingredients";
      return null;
    }
    case "builder": {
      const sites = [...world.ents.values()].filter((e) => e.build);
      if (!sites.length) {
        w.status = "No construction sites";
        return null;
      }
      const best = nearestBy(
        w,
        sites.map((e) => ({ e })),
      );
      if (!best) {
        w.status = "No reachable construction sites";
        return null;
      }
      w.status = `Building ${BUILD[best.e.t].name}`;
      return { type: "construct", id: best.e.id, work: 6 };
    }
    case "conductor":
    case "dockworker":
    case "pilot":
    case "miner":
    case "tourguide": {
      const hub = hasType(
        {
          conductor: "trainstation",
          dockworker: "seaport",
          pilot: "airport",
          miner: "mine",
          tourguide: "townhall",
        }[w.role],
      );
      if (!hub || hub.build) {
        w.status = "Waiting for their workplace to be built";
        return null;
      }
      const [fx, fy] = frontOf(hub);
      if (Math.hypot(fx - w.x, fy - w.y) > 0.5) {
        w.status = "Heading to work";
        return { type: "walk", x: fx, y: fy, work: 0.1 };
      }
      const res = w.cfg.reserve || 0;
      if (w.role === "tourguide") {
        w.status = `Guiding ${CITY.tourists} tourists`;
        return null;
      }
      if (w.role === "miner") {
        if ((S.inv.pickaxe || 0) <= res) {
          w.status = "Out of pickaxes";
          return null;
        }
        if (!S.mine) newMineLayer(1);
        const i = S.mine.grid.findIndex((c) => !c.d);
        if (i < 0) {
          mineDescendAuto();
          w.status = "Going deeper";
          return null;
        }
        w.status = `Digging at depth ${S.mine.depth}`;
        return { type: "dig", id: hub.id, i, work: 5 };
      }
      if (w.role === "conductor") {
        const ti = S.rail.trains.findIndex((t) => t.st === "docked");
        if (ti < 0) {
          w.status = "Waiting for a train";
          return null;
        }
        w.status = "Loading freight";
        return { type: "train", id: hub.id, i: ti, work: 2 };
      }
      if (w.role === "dockworker") {
        const si = S.sea.ships.findIndex((s) => s.st === "docked");
        if (si < 0) {
          w.status = "Ships are at sea";
          return null;
        }
        w.status = "Working the docks";
        return { type: "ship2", id: hub.id, i: si, work: 2 };
      }
      if (w.role === "pilot") {
        const pi = S.air.planes.findIndex((p) => p.st === "docked");
        if (pi < 0) {
          w.status = "Waiting for a plane";
          return null;
        }
        w.status = "Packing crates";
        return { type: "plane", id: hub.id, i: pi, work: 2 };
      }
      return null;
    }
    case "shopkeeper":
    case "clerk": {
      const shop = hasType(w.role === "shopkeeper" ? "market" : "courier");
      if (!shop) {
        w.status =
          w.role === "clerk" ? "Needs a Courier Office" : "Needs a Market";
        return null;
      }
      const [fx, fy] = frontOf(shop);
      if (Math.hypot(fx - w.x, fy - w.y) > 0.4) {
        w.status = "Heading to the counter";
        return { type: "walk", x: fx, y: fy, work: 0.1 };
      }
      const res = w.cfg.reserve || 0;
      const okRes = (o) =>
        Object.entries(o.items).every(([k, n]) => (S.inv[k] || 0) - n >= res);
      if (w.role === "shopkeeper") {
        const o = S.orders.find(
          (o) =>
            okRes(o) &&
            !walkers.some(
              (c) => c.kind === "c" && c.order === o.id && c.path.length,
            ),
        );
        if (o) {
          w.status = `Serving ${o.name}`;
          return { type: "serve", id: shop.id, oid: o.id, work: 0.9 };
        }
        w.status = S.orders.length
          ? "Waiting for stock"
          : "Waiting for customers";
      } else {
        const i = (S.courier || []).findIndex((s) => s.o && okRes(s.o));
        if (i >= 0) {
          w.status = `Packing for ${S.courier[i].o.dest}`;
          return { type: "ship", id: shop.id, i, work: 1.4 };
        }
        w.status = "Waiting for stock";
      }
      return null;
    }
  }
  return null;
}
function doTask(w) {
  const t = w.task;
  if (t.type === "walk") return;
  const e = world.ents.get(t.id);
  if (!e) return;
  const green = w.trait === "greenthumb" ? 0.15 : 0;
  switch (t.type) {
    case "harvest": {
      const ic = e.crop && CROPS[e.crop] ? CROPS[e.crop].icon : null;
      if (harvestField(e, null, null, { quiet: true, bonus: green })) {
        gainSkill(w, 1);
        w.bubble = ic;
        w.bubbleT = 1;
      }
      break;
    }
    case "plant": {
      const ck = t.crop || w.cfg.crop,
        c = CROPS[ck];
      if (!c) break;
      if (!(S.seeds[ck] > 0) && w.cfg.auto && S.coins >= c.seed) {
        S.coins -= c.seed;
        S.seeds[ck] = (S.seeds[ck] || 0) + 1;
      }
      if (plantField(e, ck, true)) gainSkill(w, 0.5);
      break;
    }
    case "collect":
      if (BUILD[e.t].animal) {
        if (collectAnimals(e, true, green)) {
          gainSkill(w, 1);
          w.bubble = ITEMS[BUILD[e.t].out].icon;
          w.bubbleT = 1.2;
        }
      } else if (collectGoods(e, true)) gainSkill(w, 1);
      break;
    case "feed":
      if (feedAnimals(e, true)) gainSkill(w, 0.5);
      break;
    case "rent": {
      let n = 0;
      for (const t of HOUSE_TYPES)
        for (const h of entsOf(t))
          if (
            BUILD[h.t].rent &&
            !h.moving &&
            rentReady(h) &&
            Math.abs(h.x - e.x) + Math.abs(h.y - e.y) <= 8 + w.skill * 2
          ) {
            collectRent(h, true);
            n++;
          }
      if (n) {
        gainSkill(w, n);
        w.bubble = "🪙";
        w.bubbleT = 1;
      }
      break;
    }
    case "make":
      startRecipe(e, t.r, true);
      gainSkill(w, 0.5);
      w.bubble = GOODS[t.r].icon;
      w.bubbleT = 1.2;
      break;
    case "construct":
      if (e.build) {
        deliverMats(e, true);
        gainSkill(w, 1);
      }
      break;
    case "dig":
      mineDig(t.i, "pickaxe", true);
      gainSkill(w, 1);
      w.bubble = "⛏️";
      w.bubbleT = 1;
      break;
    case "train": {
      const tr = S.rail.trains[t.i];
      if (!tr || tr.st !== "docked") break;
      const res = w.cfg.reserve || 0;
      tr.cars.forEach((c, ci) => {
        if (!c.got) railCollect(t.i, ci, true);
        if (!c.filled && (S.inv[c.nk] || 0) - c.nn >= res)
          railFill(t.i, ci, true);
      });
      if (tr.cars.every((c) => c.filled))
        railSend(t.i, S.rail.last || "pinewood", true);
      gainSkill(w, 1);
      break;
    }
    case "ship2": {
      const sh = S.sea.ships[t.i];
      if (!sh || sh.st !== "docked") break;
      if (seaUnload(t.i, true))
        seaSend(t.i, S.sea.last || "coconut", false, true);
      gainSkill(w, 1);
      break;
    }
    case "plane": {
      const pl = S.air.planes[t.i];
      if (!pl || pl.st !== "docked") break;
      const res = w.cfg.reserve || 0;
      pl.crates.forEach((c, ci) => {
        if (!c.filled && (S.inv[c.k] || 0) - c.n >= res) airFill(t.i, ci, true);
      });
      if (pl.crates.every((c) => c.filled)) airSend(t.i);
      gainSkill(w, 1);
      break;
    }
    case "serve": {
      const o = S.orders.find((x) => x.id === t.oid);
      if (o && canFulfill(o)) {
        deliverOrder(o.id, null, true);
        gainSkill(w, 1);
        w.bubble = "✅";
        w.bubbleT = 1.2;
      }
      break;
    }
    case "ship": {
      const s = S.courier && S.courier[t.i];
      if (s && s.o && canFulfill(s.o)) {
        deliverCourier(t.i, null, true);
        gainSkill(w, 1.5);
        w.bubble = "📦";
        w.bubbleT = 1.2;
      }
      break;
    }
  }
}
function anchorOf(w) {
  if (w.role === "farmhand") {
    const f = world.ents.get(w.cfg.fields[0]);
    if (f) return [f.x, f.y];
  }
  if (w.role === "rancher") {
    const a = hasAnyType(ANIMAL_TYPES);
    if (a) return frontOf(a);
  }
  if (w.role === "manager") {
    const f = world.ents.get(w.cfg.fid);
    if (f) return frontOf(f);
  }
  if (w.role === "shopkeeper") {
    const m = hasType("market");
    if (m) return frontOf(m);
  }
  if (w.role === "clerk") {
    const c = hasType("courier");
    if (c) return frontOf(c);
  }
  const h = hasType("townhall") || hasType("jobs");
  return h ? frontOf(h) : [w.x, w.y];
}
function updateWorkers(dt) {
  if (!S.workers || !S.workers.length) return;
  for (const w of S.workers) {
    if (w.bubbleT > 0) {
      w.bubbleT -= dt;
      if (w.bubbleT <= 0) w.bubble = null;
    }
    if (S.strike) {
      w.moving = false;
      w.working = false;
      w.task = null;
      w.bubble = "💸";
      w.bubbleT = 0.5;
      w.status = "On strike - unpaid wages";
      continue;
    }
    if (w.task) {
      const tgt = taskTarget(w);
      if (!tgt) {
        w.task = null;
        w.path = null;
        continue;
      }

      const gk = Math.round(tgt[0]) + "," + Math.round(tgt[1]);
      if (w.pathFor !== gk) {
        w.pathFor = gk;
        w.path = walkPath(
          Math.round(w.x),
          Math.round(w.y),
          Math.round(tgt[0]),
          Math.round(tgt[1]),
          w.task.id && world.ents.get(w.task.id),
        );
        if (!w.path) {
          if (w.task.id) {
            w.unreach = w.unreach || {};
            w.unreach[w.task.id] = NOW + 60000;
            const e = world.ents.get(w.task.id);
            w.status = `Can't reach the ${e ? BUILD[e.t].name : "job"} - connect it with a road or bridge`;
          }
          w.task = null;
          w.pathFor = null;
          w.think = 1;
          continue;
        }
      }
      const node = w.path && w.path.length ? w.path[0] : tgt;
      const dx = node[0] - w.x,
        dy = node[1] - w.y,
        d = Math.hypot(dx, dy),
        st = 2.1 * speedOf(w) * dt;
      if (d > 0.04 || (w.path && w.path.length)) {
        if (d <= st) {
          w.x = node[0];
          w.y = node[1];
          if (w.path && w.path.length) w.path.shift();
        } else {
          w.x += (dx / d) * st;
          w.y += (dy / d) * st;
        }
        w.moving = true;
        w.working = false;
        w.ph += dt * 9 * speedOf(w);
        continue;
      }
      w.moving = false;
      w.working = w.task.type !== "walk";
      w.workT -= dt * speedOf(w);
      if (w.workT <= 0) {
        doTask(w);
        w.task = null;
        w.pathFor = null;
        w.working = false;
        w.think = 0.2;
      }
      continue;
    }
    w.moving = false;
    w.working = false;
    w.think = (w.think || 0) - dt;
    if (w.think > 0) continue;
    w.think = 0.5;
    const t = decide(w);
    if (t) {
      w.task = t;
      w.workT = t.work;
    } else if (Math.random() < 0.25) {
      const [ax, ay] = anchorOf(w),
        tx = ax + rand(-1.2, 1.2),
        ty = ay + rand(-1.2, 1.2);
      if (!walkable(Math.round(tx), Math.round(ty), null)) continue;
      w.task = { type: "walk", x: tx, y: ty };
      w.workT = rand(0.8, 2.5);
      if (Math.random() < 0.3) {
        w.bubble = "💤";
        w.bubbleT = 1.5;
      }
    }
  }
}
function payTick() {
  if (!S.workers.length) {
    S.payT = NOW;
    S.strike = false;
    return;
  }
  const dtMin = clamp((NOW - (S.payT || NOW)) / 60000, 0, 0.05);
  S.payT = NOW;
  if (!S.strike) S.payAcc = (S.payAcc || 0) + payroll() * dtMin;
  const due = Math.floor(S.payAcc || 0);
  if (due > 0) {
    if (S.coins >= due) {
      S.coins -= due;
      S.payAcc -= due;
      S.stats.wagesPaid += due;
      if (S.strike) {
        S.strike = false;
        toast("👷 Wages paid - your staff are back to work!", "good");
      }
    } else if (!S.strike) {
      S.strike = true;
      toast("💸 You can't afford wages! Your staff stopped working.", "warn");
      sfx("error");
    }
  }
}
function workforceTick() {
  if (!hasType("jobs")) return;
  if (!S.cands || NOW >= S.candT) refreshCandidates();
  jobBoardTick();
}

function roleOrder() {
  return Object.keys(ROLES).sort(
    (a, b) =>
      ROLES[a].level - ROLES[b].level ||
      ROLES[a].name.localeCompare(ROLES[b].name),
  );
}
function staffSummary() {
  const open = Object.values(S.openings || {}).reduce(
    (a, n) => a + (n || 0),
    0,
  );
  return `<div class="staff-sum"><div>👷 Staff <b>${S.workers.length}</b></div><div>📋 Open positions <b>${open}</b></div><div>💸 Payroll <b>🪙${fmt1(payroll())}/min</b></div>
    ${S.strike ? '<div class="strike">⚠️ On strike - not enough coins for wages</div>' : ""}</div>`;
}
function renderStaff(tab) {
  if (tab === "album") return renderAlbum();
  if (!hasType("jobs")) {
    const ok = S.level >= BUILD.jobs.level;
    return `<div class="empty-state"><div class="es-ic">🧑‍💼</div><div>Build an <b>Employment Office</b> to hire residents.</div>
      <div class="sub">${ok ? "Post job openings and residents will apply to farm, ranch, cook, haul cargo and run your town for a wage." : `Unlocks at level ${BUILD.jobs.level}.`}</div>
      ${ok ? `<button class="btn green" data-act="buy" data-id="jobs">Build · 🪙${BUILD.jobs.cost}</button>` : ""}</div>`;
  }
  return tab === "hire" ? renderJobBoard() : renderTeam();
}

function jobRow(r) {
  const R = ROLES[r],
    locked = S.level < R.level,
    n = S.workers.filter((w) => w.role === r).length,
    open = (S.openings && S.openings[r]) || 0,
    need = !locked && roleNeeds(r);
  return `<div class="jb-row ${locked ? "locked" : ""} ${open ? "hiring" : ""}">
    <div class="jb-ic">${R.icon}</div>
    <div class="jb-main"><div class="jb-name">${R.name}${n ? `<span class="jb-emp">👥 ${n}</span>` : ""}</div><div class="jb-desc">${R.desc}</div>
      <div class="jb-meta"><span class="chip">💸 🪙${R.wage}/min</span><span class="chip">✍️ fee 🪙${hireCost({ role: r, skill: 1 })}</span>${need ? `<span class="chip warn">⚠️ ${need}</span>` : ""}</div></div>
    <div class="jb-open">${
      locked
        ? `<div class="lock">🔒 Level ${R.level}</div>`
        : `
      <div class="stepper big"><button data-act="job-open" data-role="${r}" data-d="-1" ${open ? "" : "disabled"}>−</button><b>${open}</b><button data-act="job-open" data-role="${r}" data-d="1">+</button></div>
      <div class="jb-quick"><button class="btn small blue" data-act="job-open" data-role="${r}" data-d="5">+5</button>${open ? `<button class="btn small red" data-act="job-open" data-role="${r}" data-d="-999">Close</button>` : ""}</div>
      <small class="jb-next" id="jb-${r}"></small>`
    }</div></div>`;
}
function renderJobBoard() {
  const cat = S.jobCat || "all";
  const openRoles = Object.keys(S.openings || {}).filter(
    (r) => S.openings[r] > 0 && ROLES[r],
  );
  const chips = [
    { id: "all", name: "All jobs", icon: "📋" },
    ...JOB_CATS,
    { id: "open", name: "Hiring now", icon: "🟢" },
  ]
    .map((c) => {
      const n =
        c.id === "all"
          ? Object.keys(ROLES).length
          : c.id === "open"
            ? openRoles.length
            : c.roles.length;
      return `<button class="jb-cat ${cat === c.id ? "on" : ""}" data-act="job-cat" data-c="${c.id}">${c.icon} ${c.name} <small>${n}</small></button>`;
    })
    .join("");
  const cats =
    cat === "open"
      ? [{ id: "open", name: "Hiring now", icon: "🟢", roles: openRoles }]
      : JOB_CATS.filter((c) => cat === "all" || c.id === cat);
  const body = cats
    .map((c) => {
      const roles = c.roles
        .filter((r) => ROLES[r])
        .sort(
          (a, b) =>
            (S.level < ROLES[a].level) - (S.level < ROLES[b].level) ||
            ROLES[a].level - ROLES[b].level,
        );
      if (!roles.length)
        return `<div class="empty-state small">No openings posted yet - use <b>+</b> on any job.</div>`;
      return `<div class="jb-sec"><div class="jb-sec-h">${c.icon} ${c.name}</div>${roles.map(jobRow).join("")}</div>`;
    })
    .join("");
  return (
    staffSummary() +
    `<div class="hint">📋 <b>Post openings</b> for the jobs you need. Residents apply over time and take the job automatically (you pay the hire fee when they start). No limit - hire as many as you can pay.</div>
    <div class="jb-cats">${chips}</div><div class="job-board">${body}</div>`
  );
}
function jobBoardTick() {
  if (!hasType("jobs") || hasType("jobs").build) return;
  S.openings = S.openings || {};
  S.jobNext = S.jobNext || {};
  for (const r in S.openings) {
    if (!(S.openings[r] > 0) || !ROLES[r] || S.level < ROLES[r].level) continue;
    if (!S.jobNext[r]) S.jobNext[r] = NOW + rand(4000, 9000);
    if (NOW < S.jobNext[r]) continue;
    const c = genCandidate(r),
      cost = hireCost(c);
    if (S.coins < cost) {
      S.jobNext[r] = NOW + 5000;
      S.jobBroke = r;
      continue;
    }
    c.cid = "jb" + Math.random().toString(36).slice(2, 8);
    S.cands = S.cands || [];
    S.cands.push(c);
    hireWorker(c.cid);
    S.openings[r]--;
    S.jobNext[r] =
      S.openings[r] > 0
        ? NOW + rand(6000, 12000) / (1 + 0.5 * recruiters())
        : 0;
  }
}
function changeOpenings(r, d) {
  S.openings = S.openings || {};
  S.openings[r] = clamp((S.openings[r] || 0) + d, 0, 99);
  if (d > 0 && !S.jobNext[r])
    S.jobNext = Object.assign(S.jobNext || {}, { [r]: NOW + rand(3000, 7000) });
  sfx("click");
  renderPanel(false);
}

function renderTeam() {
  if (!S.workers.length)
    return (
      staffSummary() +
      `<div class="empty-state"><div class="es-ic">👷</div><div>No staff yet.</div><div class="sub">Open the <b>📋 Job Board</b> and post some openings.</div><button class="btn green" data-act="tab" data-tab="hire">Open the Job Board</button></div>`
    );
  if (!S.workers.some((w) => w.id === S.selW)) S.selW = S.workers[0].id;
  S.staffCollapsed = S.staffCollapsed || {};
  const order = JOB_CATS.flatMap((c) => c.roles)
    .concat(roleOrder())
    .filter((r, i, a) => a.indexOf(r) === i);
  const groups = order
    .filter((r) => S.workers.some((w) => w.role === r))
    .map((r) => {
      const list = S.workers.filter((w) => w.role === r),
        R = ROLES[r],
        col = S.staffCollapsed[r];
      return `<div class="sl-group"><button class="sl-head" data-act="grp-toggle" data-role="${r}"><span>${col ? "▸" : "▾"}</span>${R.icon} <b>${R.name}</b><span class="sl-count">${list.length}</span></button>
      ${
        col
          ? ""
          : list
              .map(
                (
                  w,
                ) => `<button class="sl-row ${w.id === S.selW ? "sel" : ""} ${S.strike ? "strike" : ""}" data-act="w-select" data-id="${w.id}">
        <span class="avatar sm" style="background:${w.bg}">${w.face}</span>
        <span class="sl-id"><span class="sl-name">${w.name}${w.spec ? " " + SPECIALISTS[w.spec].icon : ""}</span><span class="sl-status" id="wl-${w.id}"></span></span>
        <span class="sl-stars">${"★".repeat(w.skill)}</span></button>`,
              )
              .join("")
      }</div>`;
    })
    .join("");
  const sel = S.workers.find((w) => w.id === S.selW);
  return (
    staffSummary() +
    `<div class="staff-split"><div class="staff-list">${groups}</div><div class="staff-detail">${sel ? staffCard(sel) : ""}</div></div>`
  );
}
function staffCard(w) {
  const R = ROLES[w.role],
    Tt = TRAITS[w.trait];
  const lo = SKILL_XP[w.skill - 1],
    hi = SKILL_XP[w.skill];
  const prog = w.skill >= 5 ? 1 : clamp((w.sxp - lo) / (hi - lo), 0, 1);
  let cfg = "";
  if (w.role === "farmhand") {
    const crops =
      `<button class="pick wide ${w.cfg.crop === "auto" ? "on" : ""}" data-act="w-crop" data-id="${w.id}" data-crop="auto" title="Plant whatever orders, contracts, trains, planes and factories need">🧠 Smart</button>` +
      Object.keys(CROPS)
        .filter((k) => S.level >= CROPS[k].level)
        .map(
          (k) =>
            `<button class="pick ${w.cfg.crop === k ? "on" : ""}" data-act="w-crop" data-id="${w.id}" data-crop="${k}" title="${CROPS[k].name}">${CROPS[k].icon}</button>`,
        )
        .join("");
    cfg = `<div class="cfg-row"><span>Grow</span><div class="picks">${crops}</div></div>
      <div class="cfg-row"><span>🟫 Fields</span><div class="stepper"><button data-act="w-fields" data-id="${w.id}" data-d="-1">−</button><b>${w.cfg.fields.length}</b><button data-act="w-fields" data-id="${w.id}" data-d="1">+</button></div><small>max ${maxFields(w)}</small></div>
      <div class="cfg-row"><span>Auto-buy seeds</span><button class="toggle sm ${w.cfg.auto ? "on" : ""}" data-act="w-auto" data-id="${w.id}"><i></i></button></div>`;
  } else if (w.role === "manager") {
    const facs = [...world.ents.values()].filter((e) =>
      FACTORY_TYPES.includes(e.t),
    );
    const f = world.ents.get(w.cfg.fid);
    cfg = `<div class="cfg-row"><span>Factory</span><div class="picks">${
      facs
        .map((e) => {
          const m = managerOf(e);
          return `<button class="pick wide ${w.cfg.fid === e.id ? "on" : ""}" data-act="w-fac" data-id="${w.id}" data-fid="${e.id}" title="${BUILD[e.t].name}${m && m !== w ? " (managed by " + m.name + ")" : ""}">${BUILD[e.t].icon}</button>`;
        })
        .join("") || "<small>Build a factory first</small>"
    }</div></div>`;
    if (f)
      cfg +=
        BUILD[f.t].recipes
          .filter((r) => S.level >= RECIPES[r].level)
          .map(
            (r) =>
              `<div class="cfg-row"><span>${GOODS[r].icon} ${GOODS[r].name}</span><div class="stepper"><button data-act="w-target" data-id="${w.id}" data-r="${r}" data-d="-1">−</button><b>${w.cfg.targets[r] || 0}</b><button data-act="w-target" data-id="${w.id}" data-r="${r}" data-d="1">+</button></div><small>have ${S.inv[r] || 0}</small></div>`,
          )
          .join("") +
        '<div class="cfg-note">Keeps this many in stock (0 = don\'t make). +15% factory speed.</div>';
  } else if (w.role === "rancher") {
    let n = 0;
    for (const t of ANIMAL_TYPES) n += entsOf(t).size || 0;
    cfg = `<div class="cfg-note">Feeds & collects from all ${n} animal building${n === 1 ? "" : "s"}. Keep feed in the barn!</div>`;
  } else if (JOB_UI[w.role] && !RESERVE_ROLES.includes(w.role)) {
    cfg = JOB_UI[w.role](w);
  } else if (RESERVE_ROLES.includes(w.role)) {
    cfg = `<div class="cfg-row"><span>Keep in stock</span><div class="stepper"><button data-act="w-reserve" data-id="${w.id}" data-d="-1">−</button><b>${w.cfg.reserve || 0}</b><button data-act="w-reserve" data-id="${w.id}" data-d="1">+</button></div><small>of each item</small></div>
      <div class="cfg-note">${{ shopkeeper: "Serves market customers", clerk: "Ships courier contracts", conductor: "Loads & dispatches trains", pilot: "Fills cargo crates", miner: "Digs with pickaxes", dockworker: "Unloads & resends ships", trainloader: "Loads train cars", cargohandler: "Packs plane crates", envoy: "Fulfils trade contracts", helipilot: "Flies express orders" }[w.role]} automatically, never dipping below this reserve.</div>`;
  } else if (w.role === "builder" || w.role === "tourguide") {
    cfg = `<div class="cfg-note">${w.role === "builder" ? "Delivers materials to construction sites and speeds them up 50%." : "+20% tourism income."}</div>`;
  } else {
    let n = 0;
    for (const t of HOUSE_TYPES) n += entsOf(t).size || 0;
    cfg = `<div class="cfg-note">Collects rent from all ${n} homes automatically.</div>`;
  }
  return `<div class="staff-card ${S.strike ? "strike" : ""}">
    <div class="sc-head"><div class="avatar" style="background:${w.bg}">${w.face}</div><div class="sc-id"><div class="sc-name">${w.name}</div><div class="sc-role">${R.icon} ${R.name}</div></div><div class="sc-stars" title="Skill level ${w.skill}">${"★".repeat(w.skill)}<span>${"★".repeat(5 - w.skill)}</span></div></div>
    <div class="sc-meta">${w.spec ? `<span class="chip on" title="${SPECIALISTS[w.spec].desc}">${SPECIALISTS[w.spec].icon} ${SPECIALISTS[w.spec].name}</span>` : ""}<span class="chip" title="${Tt.desc}">${Tt.icon} ${Tt.name}</span><span class="chip">🪙${fmt1(wageOf(w))}/min</span></div>
    <div class="pbar sm" title="Skill progress"><div style="width:${prog * 100}%"></div></div>
    <div class="sc-status" id="ws-${w.id}"></div>
    <div class="sc-cfg">${cfg}</div>
    <div class="sc-btns"><button class="btn blue small" data-act="w-locate" data-id="${w.id}">📍 Locate</button>${w.skill < 5 ? `<button class="btn purple small" data-act="w-train" data-id="${w.id}" title="Needs a School">📚 Train · 🪙${100 * w.skill}</button>` : ""}<button class="btn red small" data-act="w-fire" data-id="${w.id}">Dismiss</button></div></div>`;
}
function liveStaff() {
  for (const w of S.workers) {
    for (const pre of ["ws-", "wl-"]) {
      const el = document.getElementById(pre + w.id);
      if (el && el.textContent !== (w.status || ""))
        el.textContent = w.status || "";
    }
  }
  for (const r in ROLES) {
    const el = document.getElementById("jb-" + r);
    if (!el) continue;
    const open = (S.openings && S.openings[r]) || 0;
    el.textContent = !open
      ? ""
      : S.jobBroke === r && S.coins < ROLES[r].hire
        ? "💸 Need coins for the hire fee"
        : `Next applicant in ${fmtTime(Math.max(0, (S.jobNext[r] || NOW) - NOW))}`;
  }
}
function staffSig() {
  return JSON.stringify([
    S.workers.map((w) => [w.id, w.skill, w.cfg]),
    (S.cands || []).map((c) => c.cid),
    staffCap(),
    S.strike,
    S.coins >= 20,
    hasType("jobs") ? 1 : 0,
    S.level,
  ]);
}

let demandCache = { t: -1, need: null };
function cropDemand() {
  if (demandCache.t === NOW || (demandCache.need && NOW - demandCache.t < 1000))
    return demandCache.need;
  const need = {};
  const want = (k, n) => {
    if (CROPS[k] && n > 0) need[k] = (need[k] || 0) + n;
  };
  const wantItems = (items) => {
    for (const k in items) want(k, items[k]);
  };
  for (const o of S.orders) wantItems(o.items);
  for (const s of S.courier || []) if (s.o) wantItems(s.o.items);
  for (const c of S.contracts || []) if (!c.done) wantItems(c.items);
  for (const o of S.express || []) want(o.k, o.n);
  for (const t of (S.rail && S.rail.trains) || [])
    if (t.st === "docked")
      for (const c of t.cars) if (!c.filled) want(c.nk, c.nn);
  for (const p of (S.air && S.air.planes) || [])
    if (p.st === "docked")
      for (const c of p.crates) if (!c.filled) want(c.k, c.n);
  if (typeof REQUESTS !== "undefined")
    for (const q of REQUESTS) {
      const st = q.steps[(S.req && S.req[q.id]) || 0];
      if (st && st.items && S.level >= q.level) wantItems(st.items);
    }

  for (const w of S.workers)
    if (w.role === "manager") {
      const f = world.ents.get(w.cfg.fid);
      if (!f) continue;
      for (const r of BUILD[f.t].recipes) {
        const tgt = w.cfg.targets[r] || 0,
          R = RECIPES[r];
        if (!tgt || S.level < R.level) continue;
        const short = Math.ceil(
          Math.max(0, tgt - (S.inv[R.out || r] || 0)) / (R.qty || 1),
        );
        for (const k in R.in) want(k, R.in[k] * short);
      }
    }

  for (const k in need) need[k] -= S.inv[k] || 0;
  for (const f of entsOf("field"))
    if (f.crop && need[f.crop] != null) need[f.crop] -= CROP_YIELD;
  demandCache = { t: NOW, need };
  return need;
}
function pickDemandCrop(w) {
  const need = cropDemand();
  const ok = (k) =>
    CROPS[k] &&
    S.level >= CROPS[k].level &&
    ((S.seeds[k] || 0) > 0 || (w.cfg.auto && S.coins >= CROPS[k].seed));
  const wanted = Object.keys(need)
    .filter((k) => need[k] > 0 && ok(k))
    .sort((a, b) => need[b] - need[a]);
  if (wanted.length)
    return {
      crop: wanted[0],
      why: `(needed: ${Math.max(0, need[wanted[0]])} more)`,
    };

  const fallback = Object.keys(CROPS)
    .filter(ok)
    .sort(
      (a, b) =>
        CROPS[b].price / (CROPS[b].time + 4000) -
        CROPS[a].price / (CROPS[a].time + 4000),
    );
  return { crop: fallback[0] || "wheat", why: "" };
}

function walkable(x, y, goal, loose) {
  const e = entAt(x, y);
  if (e && BUILD[e.t].walk) return true;
  if (isWater(x, y)) return false;
  if (!e || e === goal || e.nat || e.t === "field" || BUILD[e.t].flat || loose)
    return true;
  return false;
}
function bfsWalk(sx, sy, tx, ty, goal, loose) {
  const startEnt = entAt(sx, sy),
    wet = isWater(sx, sy) && !isRoad(sx, sy);
  const pad = 40,
    x0 = Math.min(sx, tx) - pad,
    x1 = Math.max(sx, tx) + pad,
    y0 = Math.min(sy, ty) - pad,
    y1 = Math.max(sy, ty) + pad;
  const start = tkey(sx, sy),
    goalK = tkey(tx, ty),
    prev = new Map([[start, start]]),
    q = [sx, sy];
  let found = false;
  for (let h = 0; h < q.length && q.length < 160000; h += 2) {
    const x = q[h],
      y = q[h + 1];
    if (x === tx && y === ty) {
      found = true;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
      const k = tkey(nx, ny);
      if (prev.has(k)) continue;
      const here = entAt(nx, ny);
      const ok =
        nx === tx && ny === ty
          ? !(isWater(nx, ny) && !isRoad(nx, ny))
          : walkable(nx, ny, goal, loose) ||
            (startEnt && here === startEnt) ||
            (wet && isWater(nx, ny));
      if (!ok) continue;
      prev.set(k, tkey(x, y));
      q.push(nx, ny);
    }
  }
  if (!found) return null;
  const path = [];
  for (let c = goalK; c !== start; c = prev.get(c))
    path.push([tkeyX(c), tkeyY(c)]);
  return path.reverse();
}
function walkPath(sx, sy, tx, ty, goal) {
  if (sx === tx && sy === ty) return [];
  return (
    bfsWalk(sx, sy, tx, ty, goal, false) || bfsWalk(sx, sy, tx, ty, goal, true)
  );
}

let rentSweepT = 0;
function rentCollectorSweep() {
  if (S.strike || ++rentSweepT % 8) return;
  const cols = S.workers.filter((w) => w.role === "rentcollector");
  if (!cols.length) return;
  let budget = cols.reduce((a, w) => a + 2 + w.skill, 0);
  for (const t of HOUSE_TYPES)
    for (const h of entsOf(t)) {
      if (budget <= 0) return;
      if (BUILD[h.t].rent && !h.moving && !h.build && rentReady(h)) {
        collectRent(h, true);
        budget--;
      }
    }
}
