Object.assign(ROLES, {
  seedmerchant: {
    name: "Seed Merchant",
    icon: "🫘",
    level: 4,
    hire: 60,
    wage: 9,
    desc: "Keeps your seed bag topped up for every crop you grow.",
  },
  lumberjack: {
    name: "Lumberjack",
    icon: "🪓",
    level: 4,
    hire: 70,
    wage: 10,
    desc: "Chops trees & bushes on your land for planks.",
  },
  recruiter: {
    name: "Recruiter",
    icon: "📣",
    level: 5,
    hire: 120,
    wage: 12,
    desc: "Applicants arrive 50% faster and hire fees drop 10% (max 3).",
  },
  quarryman: {
    name: "Quarry Worker",
    icon: "🪨",
    level: 6,
    hire: 90,
    wage: 12,
    desc: "Breaks up boulders on your land for stone.",
  },
  trader: {
    name: "Market Trader",
    icon: "💹",
    level: 6,
    hire: 110,
    wage: 13,
    desc: "Sells your surplus produce whenever stock goes over a limit.",
  },
  envoy: {
    name: "Trade Envoy",
    icon: "🤝",
    level: 6,
    hire: 130,
    wage: 15,
    desc: "Fulfils international trade contracts from your stock.",
  },
  entertainer: {
    name: "Street Performer",
    icon: "🎻",
    level: 7,
    hire: 90,
    wage: 10,
    desc: "+3 happiness in every home (max 5).",
  },
  sweeper: {
    name: "Street Sweeper",
    icon: "🧹",
    level: 8,
    hire: 70,
    wage: 8,
    desc: "+2 happiness in every home (max 5).",
  },
  coach: {
    name: "Staff Trainer",
    icon: "🧑‍🏫",
    level: 8,
    hire: 160,
    wage: 16,
    desc: "Coaches your least experienced staff so they gain skill.",
  },
  trainloader: {
    name: "Train Loader",
    icon: "🧑‍🔧",
    level: 9,
    hire: 120,
    wage: 13,
    desc: "Unloads freight and fills train cars at the station.",
  },
  dispatcher: {
    name: "Train Dispatcher",
    icon: "🚦",
    level: 9,
    hire: 130,
    wage: 14,
    desc: "Sends loaded trains off to the destination you choose.",
  },
  mechanic: {
    name: "Mechanic",
    icon: "🔧",
    level: 12,
    hire: 200,
    wage: 18,
    desc: "Trains, ships & planes travel 4% faster each (max 5).",
  },
  stevedore: {
    name: "Stevedore",
    icon: "📦",
    level: 16,
    hire: 160,
    wage: 15,
    desc: "Unloads cargo from ships returning to port.",
  },
  harbormaster: {
    name: "Harbour Master",
    icon: "⚓",
    level: 16,
    hire: 190,
    wage: 17,
    desc: "Sends empty ships out to the voyage you choose.",
  },
  helipilot: {
    name: "Helicopter Pilot",
    icon: "🚁",
    level: 20,
    hire: 260,
    wage: 20,
    desc: "Flies out express orders from the helipad.",
  },
  cargohandler: {
    name: "Cargo Handler",
    icon: "🧳",
    level: 25,
    hire: 220,
    wage: 18,
    desc: "Packs plane cargo crates at the airport.",
  },
});
Object.assign(HATS, {
  seedmerchant: "straw",
  lumberjack: "cap",
  quarryman: "hard",
  trader: "cap",
  envoy: "top",
  entertainer: "top",
  sweeper: "capb",
  coach: "capb",
  trainloader: "hard",
  dispatcher: "capb",
  mechanic: "hard",
  stevedore: "cap",
  harbormaster: "capb",
  helipilot: "top",
  cargohandler: "hard",
  recruiter: "top",
});

const JOB_CATS = [
  {
    id: "farm",
    name: "Farming & Land",
    icon: "🌾",
    roles: ["farmhand", "rancher", "seedmerchant", "lumberjack", "quarryman"],
  },
  {
    id: "make",
    name: "Production",
    icon: "🏭",
    roles: ["manager", "builder", "miner"],
  },
  {
    id: "trade",
    name: "Trade & Sales",
    icon: "💰",
    roles: ["shopkeeper", "clerk", "trader", "envoy", "rentcollector"],
  },
  {
    id: "trans",
    name: "Transport",
    icon: "🚂",
    roles: [
      "conductor",
      "trainloader",
      "dispatcher",
      "dockworker",
      "stevedore",
      "harbormaster",
      "pilot",
      "cargohandler",
      "helipilot",
      "mechanic",
    ],
  },
  {
    id: "town",
    name: "Town Services",
    icon: "🏙️",
    roles: ["tourguide", "entertainer", "sweeper", "coach", "recruiter"],
  },
];
const ROLE_HUB = {
  shopkeeper: "market",
  clerk: "courier",
  conductor: "trainstation",
  trainloader: "trainstation",
  dispatcher: "trainstation",
  dockworker: "seaport",
  stevedore: "seaport",
  harbormaster: "seaport",
  pilot: "airport",
  cargohandler: "airport",
  helipilot: "helipad",
  miner: "mine",
  trader: "market",
};
function roleNeeds(r) {
  const h = ROLE_HUB[r];
  if (h && BUILD[h] && !(hasType(h) && !hasType(h).build))
    return `Needs a ${BUILD[h].name}`;
  if (r === "manager" && !FACTORY_TYPES.some((t) => hasType(t)))
    return "Needs a factory";
  if (r === "rancher" && !hasAnyType(ANIMAL_TYPES))
    return "Needs an animal farm";
  return "";
}
const RESERVE_ROLES = [
  "shopkeeper",
  "clerk",
  "conductor",
  "pilot",
  "miner",
  "dockworker",
  "trainloader",
  "cargohandler",
  "envoy",
  "helipilot",
];
function staffOf(r) {
  return S.strike ? 0 : S.workers.filter((w) => w.role === r).length;
}

const ROLE_INIT = {
  seedmerchant: () => ({ n: 10 }),
  lumberjack: () => ({ trees: true, bushes: true }),
  trader: () => ({
    keep: 30,
    crop: true,
    animal: true,
    good: true,
    exotic: false,
  }),
  dispatcher: () => ({ dest: "auto", partial: false }),
  harbormaster: () => ({ dest: "auto" }),
};

function goHub(w, type) {
  const hub = hasType(type);
  if (!hub || hub.build) {
    w.status = `Needs a ${BUILD[type].name}`;
    return { hub: null };
  }
  const [fx, fy] = frontOf(hub);
  if (Math.hypot(fx - w.x, fy - w.y) > 0.5) {
    w.status = "Heading to work";
    return { hub, task: { type: "walk", x: fx, y: fy, work: 0.1 } };
  }
  return { hub };
}
function natureList(w, types) {
  const out = [];
  for (const t of types)
    for (const e of entsOf(t))
      if (!e.dying && isUnlocked(e.x, e.y) && !claimed(e.id, w))
        out.push({ e });
  return out;
}

function staffClear(e) {
  if (!e || e.dying) return false;
  const b = BUILD[e.t];
  if (S.coins < b.clear) return false;
  S.coins -= b.clear;
  e.dying = NOW + 350;
  setOcc(e, -1);
  worldChanged();
  S.stats.cleared++;
  addXP(b.xp);
  sfx("chop");
  const drop = e.t === "tree" ? "planks" : e.t === "rock" ? "stone" : null;
  const p = entWorld(e, 18);
  if (drop && spaceFor(drop) > 0) {
    const n = 1 + randi(2);
    addItem(drop, n);
    floatText(p[0], p[1] - 16, `+${n} ${ITEMS[drop].icon}`, "#ffffff", 12);
  }
  burst(
    p[0],
    p[1],
    10,
    e.t === "rock"
      ? ["#9ba1a7", "#7d838a", "#c9ced2"]
      : ["#4b9a38", "#62b545", "#88cf5e", "#7a4f2c"],
    e.t === "rock" ? "dot" : "leaf",
    60,
  );
  return true;
}
function okReserve(items, res) {
  return Object.entries(items).every(([k, n]) => (S.inv[k] || 0) - n >= res);
}
function pickDest(list, cur, last) {
  const open = list.filter((d) => S.level >= d.level);
  if (!open.length) return null;
  if (cur && cur !== "auto" && open.some((d) => d.id === cur)) return cur;
  const i = open.findIndex((d) => d.id === last);
  return open[(i + 1) % open.length].id;
}
function sellable(w, k) {
  const it = ITEMS[k];
  return it && it.price && w.cfg[it.kind] && (S.inv[k] || 0) > w.cfg.keep;
}

const JOB_AI = {
  seedmerchant: {
    decide(w) {
      if (seedTotal() >= seedCap()) {
        w.status = "Seed bag is full";
        return null;
      }
      const k = Object.keys(CROPS).find(
        (k) =>
          S.level >= CROPS[k].level &&
          (S.seeds[k] || 0) < w.cfg.n &&
          S.coins >= CROPS[k].seed,
      );
      if (!k) {
        w.status = "Seed bag is stocked";
        return null;
      }
      const shop = hasType("market") || hasType("jobs");
      w.status = `Buying ${CROPS[k].icon} ${CROPS[k].name} seeds`;
      return { type: "j-seed", id: shop.id, crop: k, work: 1.2 };
    },
    act(w, t) {
      const c = CROPS[t.crop],
        n = Math.min(
          w.cfg.n - (S.seeds[t.crop] || 0),
          seedCap() - seedTotal(),
          Math.floor(S.coins / c.seed),
        );
      if (n > 0) {
        S.coins -= c.seed * n;
        S.seeds[t.crop] = (S.seeds[t.crop] || 0) + n;
        gainSkill(w, 0.5);
        w.bubble = c.icon;
        w.bubbleT = 1;
      }
    },
  },
  lumberjack: {
    decide(w) {
      const types = [w.cfg.trees && "tree", w.cfg.bushes && "bush"].filter(
        Boolean,
      );
      const best = nearestBy(w, natureList(w, types));
      if (!best) {
        w.status = types.length
          ? "No trees left to chop"
          : "Nothing selected to chop";
        return null;
      }
      if (S.coins < BUILD[best.e.t].clear) {
        w.status = "Needs coins to clear land";
        return null;
      }
      w.status = best.e.t === "tree" ? "Chopping a tree" : "Clearing bushes";
      return {
        type: "j-clear",
        id: best.e.id,
        work: best.e.t === "tree" ? 3 : 1.5,
      };
    },
    act(w, t) {
      const e = world.ents.get(t.id);
      if (staffClear(e)) {
        gainSkill(w, 1);
        w.bubble = "🪵";
        w.bubbleT = 1;
      }
    },
  },
  quarryman: {
    decide(w) {
      const best = nearestBy(w, natureList(w, ["rock"]));
      if (!best) {
        w.status = "No boulders left";
        return null;
      }
      if (S.coins < BUILD.rock.clear) {
        w.status = "Needs coins to clear land";
        return null;
      }
      w.status = "Breaking a boulder";
      return { type: "j-clear", id: best.e.id, work: 4 };
    },
    act(w, t) {
      const e = world.ents.get(t.id);
      if (staffClear(e)) {
        gainSkill(w, 1);
        w.bubble = "🪨";
        w.bubbleT = 1;
      }
    },
  },
  trader: {
    decide(w) {
      const g = goHub(w, "market");
      if (!g.hub || g.task) return g.task || null;
      const k = Object.keys(S.inv).find((k) => sellable(w, k));
      if (!k) {
        w.status = `Stock is under ${w.cfg.keep} of everything`;
        return null;
      }
      w.status = `Selling surplus ${ITEMS[k].icon} ${ITEMS[k].name}`;
      return { type: "j-sell", id: g.hub.id, k, work: 1.2 };
    },
    act(w, t) {
      if (!sellable(w, t.k)) return;
      const n = (S.inv[t.k] || 0) - w.cfg.keep;
      takeItem(t.k, n);
      addCoins(priceOf(t.k) * n);
      S.stats.traderSold = (S.stats.traderSold || 0) + n;
      gainSkill(w, 1);
      w.bubble = "🪙";
      w.bubbleT = 1;
    },
  },
  envoy: {
    decide(w) {
      const res = w.cfg.reserve || 0,
        c = (S.contracts || []).find((c) => !c.done && okReserve(c.items, res));
      if (!c) {
        w.status = (S.contracts || []).length
          ? "Waiting for contract goods"
          : "No contracts right now";
        return null;
      }
      const hall = hasType("townhall") || hasType("jobs");
      w.status = `Sealing a deal with ${c.town}`;
      return { type: "j-contract", id: hall.id, cid: c.id, work: 2 };
    },
    act(w, t) {
      const c = S.contracts.find((x) => x.id === t.cid);
      if (c && canFulfill(c)) {
        deliverContract(c.id);
        gainSkill(w, 2);
        w.bubble = "🤝";
        w.bubbleT = 1.2;
      }
    },
  },
  entertainer: {
    decide(w) {
      const homes = [];
      for (const t of HOUSE_TYPES)
        for (const e of entsOf(t)) if (!e.build) homes.push(e);
      if (!homes.length) {
        w.status = "No audience yet";
        return null;
      }
      const h = pick(homes),
        [fx, fy] = frontOf(h);
      w.status = pick([
        "Playing the fiddle",
        "Juggling for kids",
        "Busking on Main St",
        "Putting on a show",
      ]);
      return { type: "j-show", pos: [fx + rand(-0.4, 0.4), fy + 0.4], work: 4 };
    },
    act(w) {
      gainSkill(w, 0.3);
      w.bubble = pick(["🎵", "🎶", "🎭"]);
      w.bubbleT = 1.5;
    },
  },
  sweeper: {
    decide(w) {
      const roads = [...entsOf("road")];
      if (!roads.length) {
        w.status = "No streets to sweep";
        return null;
      }
      const r = pick(roads);
      w.status = "Sweeping the streets";
      return { type: "j-sweep", pos: [r.x, r.y], work: 2.5 };
    },
    act(w) {
      gainSkill(w, 0.3);
      w.bubble = "✨";
      w.bubbleT = 0.8;
    },
  },
  coach: {
    decide(w) {
      const pupil = S.workers
        .filter((o) => o !== w && o.skill < 5 && o.role !== "coach")
        .sort((a, b) => a.skill - b.skill || a.sxp - b.sxp)[0];
      if (!pupil) {
        w.status = "Everyone is a master!";
        return null;
      }
      w.status = `Coaching ${pupil.name}`;
      return {
        type: "j-coach",
        pos: [pupil.x + 0.3, pupil.y + 0.3],
        wid: pupil.id,
        work: 3,
      };
    },
    act(w, t) {
      const p = S.workers.find((o) => o.id === t.wid);
      if (p) {
        gainSkill(p, 2 + w.skill * 0.5);
        p.bubble = "📚";
        p.bubbleT = 1.2;
        gainSkill(w, 0.3);
      }
    },
  },
  recruiter: {
    decide(w) {
      const g = goHub(w, "jobs");
      if (g.task) return g.task;
      const open = Object.values(S.openings || {}).reduce((a, n) => a + n, 0);
      w.status = open
        ? `Interviewing for ${open} opening${open === 1 ? "" : "s"}`
        : "Posting job ads";
      return null;
    },
  },
  trainloader: {
    decide(w) {
      const g = goHub(w, "trainstation");
      if (!g.hub || g.task) return g.task || null;
      const res = w.cfg.reserve || 0;
      const i = S.rail.trains.findIndex(
        (t) =>
          t.st === "docked" &&
          t.cars &&
          t.cars.some(
            (c) => !c.got || (!c.filled && (S.inv[c.nk] || 0) - c.nn >= res),
          ),
      );
      if (i < 0) {
        const tr = S.rail.trains.find((t) => t.st === "docked" && t.cars);
        const need = tr && tr.cars.find((c) => !c.filled);
        w.status = need
          ? `Waiting for ${need.nn} ${ITEMS[need.nk].icon}`
          : tr
            ? "Train is loaded"
            : "Waiting for a train";
        return null;
      }
      w.status = "Loading freight cars";
      return { type: "j-load", id: g.hub.id, i, work: 1.5 };
    },
    act(w, t) {
      const tr = S.rail.trains[t.i];
      if (!tr || tr.st !== "docked") return;
      const res = w.cfg.reserve || 0;
      tr.cars.forEach((c, ci) => {
        if (!c.got) railCollect(t.i, ci, true);
        if (!c.filled && (S.inv[c.nk] || 0) - c.nn >= res)
          railFill(t.i, ci, true);
      });
      gainSkill(w, 1);
      w.bubble = "📦";
      w.bubbleT = 1;
    },
  },
  dispatcher: {
    decide(w) {
      const g = goHub(w, "trainstation");
      if (!g.hub || g.task) return g.task || null;
      for (const t of S.rail.trains) {
        if (t.st !== "docked") t.seen = 0;
        else if (!t.seen) t.seen = NOW;
      }
      const i = S.rail.trains.findIndex(
        (t) =>
          t.st === "docked" &&
          t.cars &&
          (t.cars.every((c) => c.filled) ||
            (w.cfg.partial &&
              NOW - t.seen > 45000 &&
              t.cars.some((c) => c.filled))),
      );
      if (i < 0) {
        w.status = S.rail.trains.some((t) => t.st === "docked")
          ? "Waiting until the train is loaded"
          : "Waiting for a train";
        return null;
      }
      w.status = "Signalling departure";
      return { type: "j-dispatch", id: g.hub.id, i, work: 1 };
    },
    act(w, t) {
      const tr = S.rail.trains[t.i];
      if (!tr || tr.st !== "docked") return;
      tr.cars.forEach((c, ci) => {
        if (!c.got) railCollect(t.i, ci, true);
      });
      const d = pickDest(RAIL_DESTS, w.cfg.dest, S.rail.last);
      if (!d) return;
      railSend(t.i, d, true);
      gainSkill(w, 1);
      w.bubble = "🚦";
      w.bubbleT = 1.2;
    },
  },
  mechanic: {
    decide(w) {
      const hub = ["trainstation", "seaport", "airport"]
        .map(hasType)
        .find((h) => h && !h.build);
      if (!hub) {
        w.status = "Needs a station, port or airport";
        return null;
      }
      const [fx, fy] = frontOf(hub);
      w.status = pick([
        "Tuning engines",
        "Greasing axles",
        "Checking the brakes",
        "Patching a hull",
      ]);
      return {
        type: "j-fix",
        pos: [fx + rand(-0.6, 0.6), fy + rand(0, 0.5)],
        work: 4,
      };
    },
    act(w) {
      gainSkill(w, 0.4);
      w.bubble = "🔧";
      w.bubbleT = 1;
    },
  },
  stevedore: {
    decide(w) {
      const g = goHub(w, "seaport");
      if (!g.hub || g.task) return g.task || null;
      const i = S.sea.ships.findIndex((s) => s.st === "docked" && s.cargo);
      if (i < 0) {
        w.status = "No cargo to unload";
        return null;
      }
      w.status = "Unloading cargo";
      return { type: "j-unload", id: g.hub.id, i, work: 2 };
    },
    act(w, t) {
      if (seaUnload(t.i, true)) {
        gainSkill(w, 1);
        w.bubble = "📦";
        w.bubbleT = 1;
      } else w.status = "Storage is full!";
    },
  },
  harbormaster: {
    decide(w) {
      const g = goHub(w, "seaport");
      if (!g.hub || g.task) return g.task || null;
      const i = S.sea.ships.findIndex((s) => s.st === "docked" && !s.cargo);
      if (i < 0) {
        w.status = S.sea.ships.some((s) => s.st === "docked")
          ? "Waiting for unloading"
          : "Ships are at sea";
        return null;
      }
      w.status = "Charting a voyage";
      return { type: "j-sail", id: g.hub.id, i, work: 1.5 };
    },
    act(w, t) {
      const d = pickDest(SEA_DESTS, w.cfg.dest, S.sea.last);
      if (!d) return;
      seaSend(t.i, d, false, true);
      gainSkill(w, 1);
      w.bubble = "⛵";
      w.bubbleT = 1.2;
    },
  },
  helipilot: {
    decide(w) {
      const g = goHub(w, "helipad");
      if (!g.hub || g.task) return g.task || null;
      const res = w.cfg.reserve || 0,
        o = (S.express || []).find((o) => (S.inv[o.k] || 0) - o.n >= res);
      if (!o) {
        w.status = (S.express || []).length
          ? "Waiting for express goods"
          : "No express orders";
        return null;
      }
      w.status = `Flying ${o.n} ${ITEMS[o.k].icon} out`;
      return { type: "j-heli", id: g.hub.id, oid: o.id, work: 2 };
    },
    act(w, t) {
      const o = (S.express || []).find((x) => x.id === t.oid);
      if (o && (S.inv[o.k] || 0) >= o.n) {
        deliverExpress(o.id);
        gainSkill(w, 1.5);
        w.bubble = "🚁";
        w.bubbleT = 1.2;
      }
    },
  },
  cargohandler: {
    decide(w) {
      const g = goHub(w, "airport");
      if (!g.hub || g.task) return g.task || null;
      const res = w.cfg.reserve || 0;
      const i = S.air.planes.findIndex(
        (p) =>
          p.st === "docked" &&
          p.crates &&
          p.crates.some((c) => !c.filled && (S.inv[c.k] || 0) - c.n >= res),
      );
      if (i < 0) {
        w.status = S.air.planes.some((p) => p.st === "docked")
          ? "Waiting for crate goods"
          : "Waiting for a plane";
        return null;
      }
      w.status = "Packing cargo crates";
      return { type: "j-crate", id: g.hub.id, i, work: 1.5 };
    },
    act(w, t) {
      const p = S.air.planes[t.i];
      if (!p || p.st !== "docked") return;
      const res = w.cfg.reserve || 0;
      p.crates.forEach((c, ci) => {
        if (!c.filled && (S.inv[c.k] || 0) - c.n >= res) airFill(t.i, ci, true);
      });
      gainSkill(w, 1);
      w.bubble = "🧳";
      w.bubbleT = 1;
    },
  },
};

const _decideBase = decide,
  _doTaskBase = doTask,
  _taskTargetBase = taskTarget,
  _anchorBase = anchorOf;
decide = function (w) {
  const ai = JOB_AI[w.role];
  return ai ? ai.decide(w) : _decideBase(w);
};
doTask = function (w) {
  const ai = JOB_AI[w.role],
    t = w.task;
  if (ai && t && t.type.startsWith("j-")) {
    if (ai.act) ai.act(w, t);
    return;
  }
  _doTaskBase(w);
};
taskTarget = function (w) {
  if (w.task && w.task.pos) return w.task.pos;
  return _taskTargetBase(w);
};
anchorOf = function (w) {
  const h = ROLE_HUB[w.role] && hasType(ROLE_HUB[w.role]);
  if (h && !h.build) return frontOf(h);
  return _anchorBase(w);
};

function civicBonus() {
  return (
    3 * Math.min(5, staffOf("entertainer")) +
    2 * Math.min(5, staffOf("sweeper"))
  );
}
const _cityTickJobs = cityTick;
cityTick = function () {
  _cityTickJobs.apply(this, arguments);
  const b = civicBonus();
  if (!b) return;
  let sum = 0,
    n = 0;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) {
      if (e.hap == null) continue;
      e.hap = Math.min(100, e.hap + b);
      sum += e.hap;
      n++;
    }
  if (n) CITY.hap = Math.round(sum / n);
};
function mechMult() {
  return 1 - 0.04 * Math.min(5, staffOf("mechanic"));
}
const _railTripJobs = railTrip,
  _voyageJobs = voyageTime,
  _flightJobs = flightTime;
railTrip = function () {
  return Math.round(_railTripJobs.apply(this, arguments) * mechMult());
};
voyageTime = function () {
  return Math.round(_voyageJobs.apply(this, arguments) * mechMult());
};
flightTime = function () {
  return Math.round(_flightJobs.apply(this, arguments) * mechMult());
};
function recruiters() {
  return Math.min(3, staffOf("recruiter"));
}
const _hireCostJobs = hireCost;
hireCost = function (c) {
  return Math.round(_hireCostJobs(c) * (1 - 0.1 * recruiters()));
};

function cfgToggle(w, key, label) {
  return `<div class="cfg-row"><span>${label}</span><button class="toggle sm ${w.cfg[key] ? "on" : ""}" data-act="w-cfg" data-id="${w.id}" data-k="${key}"><i></i></button></div>`;
}
function cfgStep(w, key, label, d, note) {
  return `<div class="cfg-row"><span>${label}</span><div class="stepper"><button data-act="w-cfgn" data-id="${w.id}" data-k="${key}" data-d="${-d}">−</button><b>${w.cfg[key] || 0}</b><button data-act="w-cfgn" data-id="${w.id}" data-k="${key}" data-d="${d}">+</button></div>${note ? `<small>${note}</small>` : ""}</div>`;
}
function cfgDest(w, list) {
  return `<div class="cfg-row col"><span>Destination</span><div class="picks"><button class="pick wide ${w.cfg.dest === "auto" ? "on" : ""}" data-act="w-dest" data-id="${w.id}" data-d="auto" title="Rotate through every destination">🔁 Rotate</button>${list.map((d) => `<button class="pick wide ${w.cfg.dest === d.id ? "on" : ""}" data-act="w-dest" data-id="${w.id}" data-d="${d.id}" ${S.level < d.level ? "disabled" : ""} title="${d.name}${S.level < d.level ? " (level " + d.level + ")" : ""}">${d.icon}</button>`).join("")}</div></div>`;
}
const JOB_UI = {
  seedmerchant: (w) =>
    cfgStep(w, "n", "🫘 Keep per crop", 5, `bag ${seedTotal()}/${seedCap()}`) +
    '<div class="cfg-note">Buys seeds for every unlocked crop until you have this many.</div>',
  lumberjack: (w) =>
    cfgToggle(w, "trees", "🌲 Chop trees") +
    cfgToggle(w, "bushes", "🌿 Clear bushes") +
    `<div class="cfg-note">Works on your unlocked land, paying the normal clearing cost. Trees drop 🪵 planks.</div>`,
  quarryman: () =>
    '<div class="cfg-note">Breaks boulders on your unlocked land (normal clearing cost). Drops 🪨 stone.</div>',
  trader: (w) =>
    cfgStep(w, "keep", "📦 Keep", 5, "of each item") +
    cfgToggle(w, "crop", "🌾 Sell crops") +
    cfgToggle(w, "animal", "🥚 Sell animal goods") +
    cfgToggle(w, "good", "🍞 Sell factory goods") +
    cfgToggle(w, "exotic", "🥥 Sell exotic goods") +
    `<div class="cfg-note">Sold so far: ${S.stats.traderSold || 0} items.</div>`,
  envoy: () =>
    `<div class="cfg-note">Fulfils trade contracts from your stock for coins, gems & reputation.</div>`,
  entertainer: () =>
    `<div class="cfg-note">Wanders between homes putting on shows. Town happiness +${civicBonus()} from performers & sweepers.</div>`,
  sweeper: () =>
    `<div class="cfg-note">Keeps the streets clean. Town happiness +${civicBonus()} from performers & sweepers.</div>`,
  coach: () =>
    '<div class="cfg-note">Visits your least skilled staff and teaches them - the better the trainer, the faster they learn.</div>',
  recruiter: () =>
    `<div class="cfg-note">${recruiters()} recruiter${recruiters() === 1 ? "" : "s"} active: applicants arrive ${50 * recruiters()}% faster and hire fees are ${10 * recruiters()}% cheaper.</div>`,
  dispatcher: (w) =>
    cfgDest(w, RAIL_DESTS) +
    cfgToggle(w, "partial", "⏱️ Send half-loaded trains after 45s"),
  harbormaster: (w) =>
    cfgDest(w, SEA_DESTS) +
    '<div class="cfg-note">Sends empty ships out again. Pair with a Stevedore to unload.</div>',
  mechanic: () =>
    `<div class="cfg-note">${staffOf("mechanic")} mechanic${staffOf("mechanic") === 1 ? "" : "s"}: all trips are ${Math.round((1 - mechMult()) * 100)}% shorter.</div>`,
  stevedore: () =>
    '<div class="cfg-note">Unloads returning ships into your barn. Pair with a Harbour Master to send them out again.</div>',
};
