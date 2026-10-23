const HOUR_MS = (DAY_LEN * 1000) / 24;
let RES = 0;
const PEOPLE = new Map();
let homeRes = new Map(),
  jobEmp = new Map(),
  socDirty = true;
let venueCache = null,
  stationCache = null;

function absHour() {
  return Math.floor((NOW / 1000 / DAY_LEN + 0.25) * 24);
}
function hourOfDay() {
  return ((absHour() % 24) + 24) % 24;
}
function dayNum() {
  return Math.floor(absHour() / 24);
}
function dayF() {
  return NOW / 1000 / DAY_LEN + 0.25;
}
function ageOf(p) {
  return Math.max(0, dayF() - p.b);
}
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function yearOf(d) {
  return d - (S.day0 || 0) + 1;
}
function isWeekend(d) {
  return ((d % 7) + 7) % 7 >= 5;
}

function pName(p) {
  return (
    (p.g === "m" ? FIRST_M : FIRST_F)[p.n % 40] + " " + LAST[p.l % LAST.length]
  );
}
function pFirst(p) {
  return (p.g === "m" ? FIRST_M : FIRST_F)[p.n % 40];
}
function pFace(p) {
  const a = ageOf(p);
  if (a < 3) return "👶";
  if (a < 13) return p.g === "m" ? "👦" : "👧";
  if (a < 18) return "🧑";
  if (a >= 65) return p.g === "m" ? "👴" : "👵";
  return p.g === "m"
    ? ["👨", "🧔", "👨‍🦱", "👱‍♂️"][p.id % 4]
    : ["👩", "👩‍🦰", "👱‍♀️", "👩‍🦱"][p.id % 4];
}
function persona(p) {
  return PERSONAS[p.k] || PERSONAS.worker;
}

function rebuildSocIndex() {
  PEOPLE.clear();
  homeRes = new Map();
  jobEmp = new Map();
  for (const p of S.people) {
    PEOPLE.set(p.id, p);
    if (p.h) {
      let a = homeRes.get(p.h);
      if (!a) homeRes.set(p.h, (a = []));
      a.push(p.id);
    }
    if (p.j > 0) {
      let a = jobEmp.get(p.j);
      if (!a) jobEmp.set(p.j, (a = []));
      a.push(p.id);
    }
  }
  RES = S.people.length;
  socDirty = false;
}
function residentsOf(e) {
  if (socDirty) rebuildSocIndex();
  return (homeRes.get(e.id) || []).map((id) => PEOPLE.get(id)).filter(Boolean);
}
function employeesOf(e) {
  if (socDirty) rebuildSocIndex();
  return (jobEmp.get(e.id) || []).map((id) => PEOPLE.get(id)).filter(Boolean);
}
function homeFree(e) {
  return popOf(e) - (homeRes.get(e.id) || []).length;
}
function usable(e) {
  return e && !e.build && !e.moving && !e.dying && !e.burnt;
}
function center(e) {
  return [e.x + e.w / 2, e.y + e.h / 2];
}
function dist(a, b) {
  const [ax, ay] = center(a),
    [bx, by] = center(b);
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function newPerson(o) {
  const p = Object.assign(
    {
      id: S.pseq++,
      n: randi(40),
      l: randi(LAST.length),
      g: Math.random() < 0.5 ? "m" : "f",
      b: dayF() - 25,
      h: 0,
      j: 0,
      k: "unemployed",
      ed: 1,
      sch: 0,
      m: 60,
      sp: 0,
      pa: [],
      ki: [],
      hp: 62,
      nf: rand(50, 90),
      nu: rand(40, 90),
      ns: rand(40, 90),
      nc: rand(40, 90),
      sk: 0,
      jail: 0,
      cr: 0,
      st: "h",
      at: 0,
      un: 0,
      lg: [],
      fm: 0,
      stay: 0,
    },
    o || {},
  );
  S.people.push(p);
  PEOPLE.set(p.id, p);
  RES = S.people.length;
  return p;
}
function setHome(p, e) {
  if (p.h) {
    const a = homeRes.get(p.h);
    if (a) {
      const i = a.indexOf(p.id);
      if (i >= 0) a.splice(i, 1);
    }
  }
  p.h = e ? e.id : 0;
  if (e) {
    let a = homeRes.get(e.id);
    if (!a) homeRes.set(e.id, (a = []));
    a.push(p.id);
  }
}
function setJob(p, e, kind) {
  if (p.j > 0) {
    const a = jobEmp.get(p.j);
    if (a) {
      const i = a.indexOf(p.id);
      if (i >= 0) a.splice(i, 1);
    }
  }
  p.j = e ? e.id : 0;
  p.un = 0;
  if (e) {
    let a = jobEmp.get(e.id);
    if (!a) jobEmp.set(e.id, (a = []));
    a.push(p.id);
    if (kind) p.k = kind;
  }
}
function removePerson(p, why) {
  setHome(p, null);
  setJob(p, null);
  const sp = p.sp && PEOPLE.get(p.sp);
  if (sp) sp.sp = 0;
  const w = S.workers && S.workers.find((x) => x.pid === p.id);
  if (w) w.pid = 0;
  for (const e of world.ents.values())
    if (e.biz && e.biz.own === p.id) {
      e.biz.own = 0;
      e.biz.vacant = true;
    }
  PEOPLE.delete(p.id);
  const i = S.people.indexOf(p);
  if (i >= 0) S.people.splice(i, 1);
  RES = S.people.length;
  if (why === "death") {
    socStat("deaths");
  }
}
function lifeLog(p, icon, text) {
  p.lg.unshift([yearOf(dayNum()), icon, text]);
  if (p.lg.length > 5) p.lg.length = 5;
}
function news(icon, text, important) {
  S.news.unshift({ d: yearOf(dayNum()), h: hourOfDay(), i: icon, t: text });
  if (S.news.length > 90) S.news.length = 90;
  if (important) notify(icon, text);
}
function socStat(k, n) {
  S.soc[k] = (S.soc[k] || 0) + (n || 1);
  S.socDay[k] = (S.socDay[k] || 0) + (n || 1);
}

function moveInFamily(home, quiet) {
  const free = homeFree(home);
  if (free <= 0) return 0;
  const l = randi(LAST.length),
    r = Math.random();
  const size = Math.min(free, r < 0.35 ? 1 : r < 0.65 ? 2 : 2 + 1 + randi(3));
  const adultAge = rand(20, 46),
    rich = Math.random();
  const edu = rich < 0.25 ? 2 : rich < 0.85 ? 1 : 0;
  const a = newPerson({
    l,
    b: dayF() - adultAge,
    ed: edu,
    m: Math.round(rand(40, 260) * (1 + edu * 0.6)),
  });
  a.k = "unemployed";
  setHome(a, home);
  const fam = [a];
  if (size >= 2) {
    const b = newPerson({
      l,
      g: Math.random() < 0.92 ? (a.g === "m" ? "f" : "m") : a.g,
      b: dayF() - clamp(adultAge + rand(-6, 6), 19, 60),
      ed: Math.max(0, edu - (Math.random() < 0.3 ? 1 : 0)),
      m: Math.round(rand(30, 180)),
    });
    a.sp = b.id;
    b.sp = a.id;
    setHome(b, home);
    fam.push(b);
    for (let k = 2; k < size; k++) {
      const kidAge = rand(0, Math.min(17, adultAge - 19));
      const c = newPerson({
        l,
        b: dayF() - kidAge,
        ed: 0,
        m: 0,
        pa: [a.id, b.id],
      });
      c.k = kidAge < 3 ? "baby" : kidAge < 6 ? "child" : "student";
      a.ki.push(c.id);
      b.ki.push(c.id);
      setHome(c, home);
      fam.push(c);
    }
  }
  if (adultAge > 64) for (const p of fam) if (ageOf(p) >= 65) p.k = "retiree";
  for (const p of fam) lifeLog(p, "📦", "Moved to Meadowvale");
  socStat("immigrants", fam.length);
  if (!quiet && fam.length >= 3 && Math.random() < 0.3)
    news("📦", `The ${LAST[l]} family (${fam.length}) moved to town.`);
  return fam.length;
}
function housingCap() {
  let c = 0;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t)) if (usable(e)) c += popOf(e);
  return c;
}

function initSociety() {
  S.people = [];
  S.pseq = S.pseq || 1;
  if (!S.news) S.news = [];
  rebuildSocIndex();
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t))
      if (usable(e)) {
        let g = 0;
        while (homeFree(e) > 0 && g++ < 30) moveInFamily(e, true);
      }

  for (let i = 0; i < 3; i++) jobMarket(400);
  S.socHour = absHour();
  S.socDayN = dayNum();
  S.day0 = dayNum();
  news("🏡", `Meadowvale's first census: ${S.people.length} residents.`);
}

function svcStations() {
  if (stationCache && stationCache.h === S.socHour && !socDirty)
    return stationCache.list;
  const list = [];
  for (const sid in SERVICES)
    for (const t of SERVICES[sid].types)
      for (const e of entsOf(t))
        if (usable(e))
          list.push({
            sid,
            e,
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            r: SERVICES[sid].r + (lvlOf(e) - 1) * 2,
          });
  stationCache = { h: S.socHour, list };
  return list;
}
function coverage(sid, x, y) {
  let c = 0;
  for (const s of svcStations())
    if (s.sid === sid) {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d <= s.r) c = Math.max(c, 1 - d / (s.r * 1.6));
    }
  return c;
}

let roadComp = null,
  roadVer = -1,
  worldVer = 0;
const _worldChangedSoc = worldChanged;
worldChanged = function () {
  worldVer++;
  venueCache = null;
  stationCache = null;
  return _worldChangedSoc.apply(this, arguments);
};
function roadComponents() {
  if (roadComp && roadVer === worldVer) return roadComp;
  roadComp = new Map();
  let id = 0;
  for (const r of roads()) {
    if (roadComp.has(tkey(r.x, r.y))) continue;
    const q = [r.x, r.y];
    roadComp.set(tkey(r.x, r.y), id);
    for (let h = 0; h < q.length; h += 2) {
      const cx = q[h],
        cy = q[h + 1];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = cx + dx,
          ny = cy + dy,
          ni = tkey(nx, ny);
        if (roadComp.has(ni) || !isRoad(nx, ny)) continue;
        roadComp.set(ni, id);
        q.push(nx, ny);
      }
    }
    id++;
  }
  roadVer = worldVer;
  return roadComp;
}

function frontRoad(e) {
  if (!e) return null;
  if (e._fr && e._fr.v === worldVer) return e._fr.r;
  const rc = roadComponents();
  let best = null,
    bd = 1e9;
  const cx = e.x + e.w / 2,
    cy = e.y + e.h + 0.5;
  for (let y = e.y - 1; y <= e.y + e.h; y++)
    for (let x = e.x - 1; x <= e.x + e.w; x++) {
      if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) continue;
      const rcomp = rc.get(tkey(x, y));
      if (rcomp == null) continue;
      const d = Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - cy);
      if (d < bd) {
        bd = d;
        best = { x, y, c: rcomp };
      }
    }
  e._fr = { v: worldVer, r: best };
  return best;
}
function reachable(a, b) {
  const d = dist(a, b);
  if (d <= 7) return true;
  const ra = frontRoad(a),
    rb = frontRoad(b);
  return !!ra && !!rb && ra.c === rb.c;
}

function positionsOf(e) {
  const s = jobSpec(e.t);
  if (!s || !usable(e)) return 0;
  if (e.biz && e.biz.staffN != null) return e.biz.staffN;
  if (e.biz && e.biz.vacant) return 0;
  return Math.round(s.n * (1 + 0.25 * (lvlOf(e) - 1)));
}
function bizState(e) {
  if (!e.biz) {
    const v = venueSpec(e.t),
      b = BUILD[e.t];
    e.biz = {
      own: b.biz ? 0 : "city",
      vacant: !!b.biz,
      rev: 0,
      cust: 0,
      turned: 0,
      cash: 300,
      hist: [],
      wageLv: 1,
      priceLv: 1,
      rating: 3,
      open: true,
      srv: 0,
      item: null,
      keep: 5,
      red: 0,
    };
    if (v && v.goods) e.biz.open = false;
  }
  return e.biz;
}
function isCity(e) {
  return !e.biz || e.biz.own === "city";
}
function wageOfJob(e) {
  const s = jobSpec(e.t);
  return s ? Math.round(s.w * (e.biz ? [0.8, 1, 1.25][e.biz.wageLv] : 1)) : 0;
}
function openHours(need, h) {
  if (need === "health") return true;
  if (need === "food") return h >= 7 && h <= 22;
  if (need === "fun") return h >= 10 || h <= 1;
  return h >= 9 && h <= 20;
}
function venues() {
  if (venueCache && venueCache.h === S.socHour) return venueCache.by;
  const by = { food: [], fun: [], shop: [], care: [], health: [] };
  for (const e of world.ents.values()) {
    if (!usable(e)) continue;
    const v = venueSpec(e.t);
    if (!v) continue;
    const b = bizState(e);
    if (b.vacant || !b.open) continue;
    const staff = v.per ? (jobEmp.get(e.id) || []).length : 0;
    const cap = v.per
      ? Math.max(staff ? 1 : 0, staff) * v.per * (1 + 0.25 * (lvlOf(e) - 1))
      : 999;
    const price = v.goods
      ? servePrice(e)
      : Math.round((v.price || 0) * [0.8, 1, 1.3][b.priceLv]);
    by[v.need].push({
      e,
      v,
      cap,
      price,
      used: 0,
      rating: b.rating,
      kids: v.kids,
    });
  }
  venueCache = { h: S.socHour, by };
  return by;
}

function shopItems(e) {
  const b = BUILD[e.t];
  return (b.recipes || []).filter(
    (r) => ITEMS[r] && S.level >= (RECIPES[r] ? RECIPES[r].level : 1),
  );
}
function servePrice(e) {
  const it = ITEMS[e.biz.item || shopItems(e)[0]];
  const base = it
    ? clamp(Math.round(it.price / (GOODS_SHOPS.has(e.t) ? 4 : 10)), 4, 60)
    : 10;
  return Math.round(base * [0.8, 1, 1.3][e.biz.priceLv]);
}
function restock(e) {
  const b = e.biz,
    list = shopItems(e)
      .filter((k) => (S.inv[k] || 0) > b.keep)
      .sort((x, y) => (S.inv[y] || 0) - (S.inv[x] || 0));
  if (!list.length) return false;
  const k = list[0];
  takeItem(k, 1);
  b.item = k;
  const price = servePrice(e);
  b.srv = Math.max(1, Math.round((ITEMS[k].price * 1.15) / price));
  return true;
}

function sleeping(p, h) {
  const job = p.j > 0 && world.ents.get(p.j),
    s = job && jobSpec(job.t);
  if (s && s.sh === "n") return h >= 4 && h < 12;
  if (s && s.sh === "a" && p.id % 3 === 0) return h >= 9 && h < 16;
  if (p.k === "criminal") return h >= 5 && h < 13;
  return h >= 23 || h < 6;
}
function working(p, h, wk) {
  if (p.k === "commuter") return !wk && h >= 7 && h < 18;
  if (!p.j) return false;
  if (p.j < 0) return h >= 7 && h < 19;
  const e = world.ents.get(p.j);
  if (!usable(e)) return false;
  const s = jobSpec(e.t) || {};
  if (s.sh === "n") return h >= 17 || h < 2;
  if (s.sh === "a") return p.id % 3 === 0 ? h >= 22 || h < 6 : h >= 7 && h < 19;
  if (wk && !venueSpec(e.t)) return false;
  const v = venueSpec(e.t);
  if (v) return openHours(v.need, h) && (h + p.id) % 24 < 18;
  return h >= 8 && h < 17;
}
const PREFS = {
  athlete: {
    gym: 3,
    stadium: 3,
    juicebar: 2,
    icerink: 2,
    skilodge: 2,
    park: 2,
  },
  business: {
    restaurant: 2.5,
    gourmet: 3,
    teahouse: 2,
    boutique: 2,
    operahouse: 2,
    hotel2: 2,
  },
  entrepreneur: { restaurant: 2.5, gourmet: 3, boutique: 2 },
  artist: { museum: 3, operahouse: 3, cafe: 2, bookshop: 2.5, florist: 2 },
  scientist: { observatory: 3, bookshop: 2, cafe: 2, library: 2 },
  student: { arcade: 3, icecream: 2.5, cinema: 2, playground: 2, snack: 2 },
  undergrad: { cafe: 2.5, pub: 2.5, arcade: 2, library: 2, cinema: 2 },
  retiree: {
    park: 3,
    teahouse: 2.5,
    florist: 2,
    museum: 2,
    gazebo: 2,
    bakery: 2,
  },
  criminal: { pub: 3, arcade: 2 },
  police: { cafe: 2, diner: 2 },
  firefighter: { grill: 2, pizzeria: 2 },
  doctor: { cafe: 2, juicebar: 2 },
};
function chooseVenue(p, need, home) {
  const list = venues()[need];
  if (!list || !list.length) return null;
  const h = hourOfDay(),
    age = ageOf(p),
    pref = PREFS[p.k] || {};
  let tot = 0;
  const cand = [];
  for (const v of list) {
    if (v.used >= v.cap || !openHours(need, h)) continue;
    if (v.kids && age > 13) continue;
    if (v.price > p.m && v.price > 0) continue;
    if (!reachable(home, v.e)) continue;
    const d = dist(home, v.e);
    let s = (Math.pow(v.rating, 1.6) * (pref[v.e.t] || 1)) / (1 + d / 16);
    if (v.price > p.m * 0.25) s *= 0.35;
    if (age < 13 && v.price > 0) s *= 0.3;
    cand.push([v, s]);
    tot += s;
  }
  if (!cand.length) return null;
  let r = Math.random() * tot;
  for (const [v, s] of cand) {
    r -= s;
    if (r <= 0) return v;
  }
  return cand[cand.length - 1][0];
}
function payTo(e, amount) {
  const b = e.biz;
  b.rev += amount;
  b.cust++;
  if (isCity(e)) {
    S.bud.venue += amount;
    return;
  }
  const tax = (amount * S.tax.sales) / 100;
  S.bud.sales += tax;
  b.cash += amount - tax;
}
function visit(p, v, home) {
  const e = v.e,
    b = e.biz;
  if (v.v.goods) {
    if (b.srv <= 0 && !restock(e)) {
      b.turned++;
      b.oos = (b.oos || 0) + 1;
      return false;
    }
    b.srv--;
  }
  if (v.price > 0) {
    p.m -= v.price;
    payTo(e, v.price);
  } else {
    b.cust++;
  }
  v.used++;
  p.st = "o";
  p.at = e.id;
  p.stay = 1 + randi(2);
  if (typeof tripEvent === "function") tripEvent(p, home, e);
  return true;
}
function stepPerson(p, h, wk) {
  p.nf = Math.max(0, p.nf - 4.2);
  p.nu = Math.max(0, p.nu - 2.4);
  p.ns = Math.max(0, p.ns - 1.1);
  p.nc = Math.max(0, p.nc - 0.9);
  if (p.jail > 0) {
    p.st = "j";
    p.at = 0;
    return;
  }
  if (p.st === "x") return;
  const home = p.h && world.ents.get(p.h);
  if (!home) return;
  const age = ageOf(p);
  if (sleeping(p, h)) {
    if (
      p.st !== "h" &&
      p.at &&
      typeof tripEvent === "function" &&
      Math.random() < 0.3
    )
      tripEvent(p, world.ents.get(p.at), home);
    p.st = "h";
    p.at = 0;
    return;
  }
  if (working(p, h, wk)) {
    const job = p.j > 0 && world.ents.get(p.j);
    if (p.st !== "w" && job && typeof tripEvent === "function")
      tripEvent(p, home, job);
    p.st = "w";
    p.at = p.j > 0 ? p.j : 0;
    earn(p, job);
    if (h === 12 && p.nf < 70) {
      const v = chooseVenue(p, "food", job || home);
      if (v && v.price <= p.m) {
        p.m -= v.price;
        payTo(v.e, v.price);
        v.used++;
        if (v.v.goods && v.e.biz.srv > 0) v.e.biz.srv--;
        p.nf = Math.min(100, p.nf + 55);
      }
    }
    return;
  }

  if (age >= 6 && age < 18 && !wk && h >= 8 && h < 15 && hasSchoolSeat()) {
    if (
      p.st !== "s" &&
      typeof tripEvent === "function" &&
      Math.random() < 0.5
    ) {
      const sc = nearestOf(["school"], home);
      if (sc) tripEvent(p, home, sc);
    }
    p.st = "s";
    p.at = 0;
    p.sch++;
    p.nu = Math.min(100, p.nu + 4);
    return;
  }
  if (age >= 18 && age < 22 && p.k === "undergrad" && !wk && h >= 9 && h < 16) {
    p.st = "s";
    p.at = 0;
    p.sch++;
    return;
  }
  if (age < 3) {
    p.st = "h";
    return;
  }

  if (p.st === "o" && p.stay > 0) {
    p.stay--;
    return;
  }
  if (p.st === "o") {
    if (typeof tripEvent === "function" && Math.random() < 0.4)
      tripEvent(p, world.ents.get(p.at), home);
    p.st = "h";
    p.at = 0;
  }

  const needs = [
    ["food", p.nf],
    ["fun", p.nu],
    ["shop", p.ns],
    ["care", p.nc],
  ];
  if (p.sk > 0) needs.push(["health", 0]);
  needs.sort((a, b) => a[1] - b[1]);
  for (const [need, val] of needs) {
    const urge = (100 - val) / 100;
    if (Math.random() > urge * (wk ? 1.3 : 1) - 0.12) continue;
    if (age < 13 && need !== "fun") continue;
    const v = chooseVenue(p, need, home);
    if (!v) {
      if (need === "food" && val < 25) {
        p.nf = Math.min(100, p.nf + 40);
        p.m = Math.max(0, p.m - 3);
      }
      continue;
    }
    if (visit(p, v, home)) {
      const gain = 45 + v.rating * 6;
      if (need === "food") p.nf = Math.min(100, p.nf + gain);
      if (need === "fun") p.nu = Math.min(100, p.nu + gain);
      if (need === "shop") p.ns = Math.min(100, p.ns + gain);
      if (need === "care") p.nc = Math.min(100, p.nc + gain);
      if (need === "health") {
        p.sk = 0;
        lifeLog(p, "💊", `Treated at the ${BUILD[v.e.t].name}`);
      }
      return;
    }
  }
  if (p.nf < 30) {
    p.nf += 35;
    p.m = Math.max(0, p.m - 3);
  }
}
const STATE_GRANT = 0.7;
function earn(p, job) {
  if (p.k === "commuter") {
    const wage = (22 + p.ed * 14) / 8,
      tax = (wage * S.tax.inc) / 100;
    p.m += wage - tax;
    S.bud.inc += tax;
    return;
  }
  if (p.j < 0) {
    const w = S.workers.find((x) => x.id === -p.j);
    const pay = w ? wageOf(w) * 0.6 : 3;
    p.m += pay;
    return;
  }
  if (!job) return;
  const wage = wageOfJob(job) / 8;
  const tax = (wage * S.tax.inc) / 100;
  p.m += wage - tax;
  S.bud.inc += tax;
  if (PUBLIC_SERVICE_TYPES.has(job.t)) S.bud.wages += wage * (1 - STATE_GRANT);
  else if (job.biz && isCity(job) && venueSpec(job.t)) S.bud.wages += wage;
  else if (job.biz && !isCity(job)) job.biz.cash -= wage;
}
let schoolSeatCache = { h: -1, ok: false };
function hasSchoolSeat() {
  if (schoolSeatCache.h !== S.socHour)
    schoolSeatCache = { h: S.socHour, ok: !!hasType("school") };
  return schoolSeatCache.ok;
}
function nearestOf(types, from) {
  let best = null,
    bd = 1e9;
  for (const t of types)
    for (const e of entsOf(t))
      if (usable(e)) {
        const d = dist(e, from);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
  return best;
}

function personTargetHp(p) {
  const home = p.h && world.ents.get(p.h);
  if (!home) return 20;
  let h = 56 + ((home.hap == null ? 50 : home.hap) - 50) * 0.3;
  const age = ageOf(p);
  if (
    age >= 18 &&
    age < 65 &&
    !["undergrad", "homemaker", "retiree"].includes(p.k)
  )
    h += p.j ? 8 : p.k === "commuter" ? 3 : -4 - Math.min(8, p.un);
  h += p.m > 400 ? 6 : p.m < 15 ? -8 : 0;
  h += ((p.nf + p.nu + p.ns + p.nc) / 4 - 55) * 0.18;
  h -= Math.max(0, S.tax.inc - 8) * 1.4 + Math.max(0, S.tax.sales - 6) * 0.9;
  h += Math.max(0, 8 - S.tax.inc) * 0.6;
  if (p.sk) h -= 10;
  if (p.sp) h += 4;
  if (home.crimeT && NOW - home.crimeT < DAY_LEN * 1000) h -= 12;
  if (typeof civicBonus === "function") h += civicBonus() * 0.5;
  return clamp(h, 0, 100);
}

function jobMarket(limit) {
  if (socDirty) rebuildSocIndex();
  const open = [];
  for (const e of world.ents.values()) {
    const n = positionsOf(e);
    if (!n) continue;
    const have = (jobEmp.get(e.id) || []).length;
    if (have > n) {
      const extra = employeesOf(e).slice(n);
      for (const p of extra) {
        setJob(p, null);
        p.k = "unemployed";
        lifeLog(p, "📉", `Laid off from the ${BUILD[e.t].name}`);
      }
    } else if (have < n) open.push({ e, n: n - have, s: jobSpec(e.t) });
  }
  if (!open.length) return;
  const seekers = S.people.filter(
    (p) =>
      !p.j &&
      !p.jail &&
      p.k !== "retiree" &&
      p.k !== "undergrad" &&
      p.k !== "entrepreneur" &&
      ageOf(p) >= 18 &&
      ageOf(p) < 65 &&
      p.h,
  );
  seekers.sort((a, b) => (a.k === "commuter") - (b.k === "commuter"));
  seekers.sort((a, b) => b.ed - a.ed || Math.random() - 0.5);
  let n = 0;
  for (const p of seekers) {
    if (n >= limit) break;
    if (p.k === "criminal" && Math.random() < 0.6) continue;
    const home = world.ents.get(p.h);
    if (!home) continue;
    let best = null,
      bs = -1;
    for (const o of open) {
      if (o.n <= 0 || (o.s.e || 0) > p.ed) continue;
      if (!reachable(home, o.e)) continue;
      const s =
        ((o.s.w + 20) / (1 + dist(home, o.e) / 25)) *
        (o.s.e === p.ed ? 1.2 : 1);
      if (s > bs) {
        bs = s;
        best = o;
      }
    }
    if (!best) continue;
    const wasCrim = p.k === "criminal";
    if (p.k === "commuter")
      lifeLog(p, "🏡", "Stopped commuting - found work in town");
    setJob(p, best.e, best.s.k);
    best.n--;
    n++;
    lifeLog(
      p,
      "💼",
      `Hired as ${persona(p).name.toLowerCase()} at the ${BUILD[best.e.t].name}`,
    );
    if (wasCrim) {
      lifeLog(p, "🕊️", "Turned their life around");
      socStat("reformed");
    }
  }
  commuters();
}
function commuters() {
  let adults = 0,
    com = 0;
  for (const p of S.people) {
    const a = ageOf(p);
    if (a >= 18 && a < 65) {
      adults++;
      if (p.k === "commuter") com++;
    }
  }
  const max = Math.floor(adults * 0.3);
  for (const p of S.people) {
    if (com >= max) break;
    if (
      p.j ||
      p.jail ||
      p.k !== "unemployed" ||
      ageOf(p) < 18 ||
      ageOf(p) >= 65 ||
      Math.random() > 0.35
    )
      continue;
    p.k = "commuter";
    p.un = 0;
    com++;
    lifeLog(p, "🚆", "Found a job in a nearby town");
  }
}

function dailyLife() {
  const d = dayNum();
  const singles = [],
    hosp = !!hasType("hospital") || !!hasType("clinic");
  for (const p of [...S.people]) {
    const age = ageOf(p);

    if (p.k === "baby" && age >= 3) p.k = "child";
    if (p.k === "child" && age >= 6) p.k = "student";
    if ((p.k === "student" || p.k === "child") && age >= 18) {
      if (p.sch > 200) p.ed = Math.max(p.ed, 1);
      if (
        p.ed >= 1 &&
        hasType("university") &&
        Math.random() < 0.5 + (p.m > 100 ? 0.15 : 0)
      ) {
        p.k = "undergrad";
        p.sch = 0;
        lifeLog(p, "🎓", "Started university");
      } else {
        p.k = "unemployed";
        lifeLog(p, "🎂", "Became an adult");
      }
      p.m += 40;
    }
    if (p.k === "undergrad" && age >= 22) {
      p.ed = 2;
      p.k = "unemployed";
      lifeLog(p, "🎓", "Graduated from university");
      news("🎓", `${pName(p)} graduated from Meadowvale University.`);
    }

    if (age >= 65 && p.k !== "retiree" && p.k !== "entrepreneur") {
      if (p.j < 0) {
        const w = S.workers.find((x) => x.id === -p.j);
        if (w) w.pid = 0;
        p.j = 0;
      }
      setJob(p, null);
      p.k = "retiree";
      lifeLog(p, "🧓", "Retired");
    }

    if (age >= 18) p.m = Math.max(0, p.m - 6);
    if (
      !p.j &&
      age >= 18 &&
      age < 65 &&
      !["undergrad", "retiree", "entrepreneur", "commuter"].includes(p.k)
    )
      p.un++;
    if (p.k === "retiree") p.m += 10;

    if (
      !p.sk &&
      Math.random() <
        (age > 65 ? 0.04 : 0.012) * (coverageHome(p, "health") > 0 ? 0.5 : 1)
    ) {
      p.sk = 1 + randi(3);
      lifeLog(p, "🤒", "Caught the flu");
      maybeAmbulance(p);
    } else if (p.sk) {
      p.sk--;
      if (p.st === "x" && !p.sk) p.st = "h";
    }

    if (p.jail > 0) {
      p.jail--;
      if (!p.jail) {
        p.st = "h";
        if (Math.random() < 0.45) {
          p.k = "unemployed";
          lifeLog(p, "🕊️", "Released and going straight");
        } else lifeLog(p, "🚪", "Released from jail");
      }
    }

    if (
      age >= 18 &&
      age < 60 &&
      !p.j &&
      p.k !== "criminal" &&
      p.un >= 3 &&
      p.m < 30 &&
      p.hp < 42 &&
      Math.random() < 0.08
    ) {
      p.k = "criminal";
      lifeLog(p, "🦹", "Fell in with a bad crowd");
    }

    const risk =
      age < 70
        ? 0.0004
        : 0.006 *
          Math.pow((age - 68) / 6, 1.6) *
          (hosp ? 0.7 : 1) *
          (p.sk ? 1.8 : 1);
    if (Math.random() < risk) {
      const sp = p.sp && PEOPLE.get(p.sp);
      if (sp) {
        lifeLog(sp, "🖤", `Lost their partner ${pFirst(p)}`);
        sp.m += Math.round(p.m * 0.8);
      }
      if (p.fm > 30 || Math.random() < 0.15)
        news("🕯️", `${pName(p)} passed away at ${Math.floor(age)}.`);
      removePerson(p, "death");
      continue;
    }

    p.hp = Math.round(p.hp + (personTargetHp(p) - p.hp) * 0.5);
    if (
      (age >= 20 && age <= 48 && !p.sp && p.k !== "criminal") ||
      (p.k === "criminal" && Math.random() < 0.3 && !p.sp && age >= 20)
    )
      singles.push(p);
  }

  for (let i = 0; i < singles.length; i++) {
    const a = singles[i];
    if (a.sp || Math.random() > 0.05) continue;
    for (let k = 0; k < 12; k++) {
      const b = singles[randi(singles.length)];
      if (!b || b === a || b.sp || b.l === a.l) continue;
      if ((b.g === a.g) !== Math.random() < 0.08) continue;
      if (Math.abs(ageOf(a) - ageOf(b)) > 12) continue;
      marry(a, b);
      break;
    }
  }

  for (const p of [...S.people]) {
    if (p.g !== "f" || !p.sp) continue;
    const age = ageOf(p),
      home = world.ents.get(p.h);
    if (
      age < 21 ||
      age > 43 ||
      p.ki.length >= 4 ||
      !home ||
      homeFree(home) <= 0
    )
      continue;
    if (Math.random() < 0.07) birth(p, PEOPLE.get(p.sp), home);
  }

  for (const p of S.people)
    if (p.sp && p.ki.length && Math.random() < 0.05) {
      const h = world.ents.get(p.h);
      if (h && homeFree(h) <= 0) relocateFamily(p);
    }

  for (const p of [...S.people]) {
    p.lowD = p.hp < 25 ? (p.lowD || 0) + 1 : 0;
    if (ageOf(p) < 18 || p.lowD < 3 || Math.random() > 0.3 || !PEOPLE.has(p.id))
      continue;
    const fam = familyOf(p);
    if (fam.length >= 4 || Math.random() < 0.2)
      news(
        "🧳",
        `The ${LAST[p.l]} household (${fam.length}) left town - they were unhappy.`,
      );
    for (const q of fam) removePerson(q);
    socStat("emigrants", fam.length);
  }

  bizProposals();
  dailyBusiness();
  if (typeof sportsDay === "function") sportsDay(d);
}
function familyOf(p) {
  const out = new Map([[p.id, p]]);
  const sp = p.sp && PEOPLE.get(p.sp);
  if (sp) out.set(sp.id, sp);
  for (const id of [...p.ki, ...(sp ? sp.ki : [])]) {
    const c = PEOPLE.get(id);
    if (c && c.h === p.h && ageOf(c) < 18) out.set(c.id, c);
  }
  return [...out.values()];
}
function marry(a, b) {
  a.sp = b.id;
  b.sp = a.id;
  const ha = world.ents.get(a.h),
    hb = world.ents.get(b.h);
  const famB = familyOf(b).filter(
    (q) => q === b || (ageOf(q) < 18 && q.pa.includes(b.id)),
  );
  if (ha && homeFree(ha) >= famB.length) for (const q of famB) setHome(q, ha);
  else if (hb && homeFree(hb) >= 1) setHome(a, hb);
  if (Math.random() < 0.7 && a.g !== b.g) {
    const wife = a.g === "f" ? a : b,
      hus = a.g === "f" ? b : a;
    wife.l = hus.l;
  }
  lifeLog(a, "💍", `Married ${pFirst(b)}`);
  lifeLog(b, "💍", `Married ${pFirst(a)}`);
  socStat("marriages");
  news("💍", `${pName(a)} and ${pName(b)} got married!`);
}
function birth(mom, dad, home) {
  const c = newPerson({
    l: mom.l,
    b: dayF(),
    ed: 0,
    m: 0,
    pa: [mom.id, dad ? dad.id : 0].filter(Boolean),
    k: "baby",
    hp: 70,
  });
  setHome(c, home);
  mom.ki.push(c.id);
  if (dad) dad.ki.push(c.id);
  lifeLog(mom, "👶", `Had a baby: ${pFirst(c)}`);
  if (dad) lifeLog(dad, "👶", `Had a baby: ${pFirst(c)}`);
  lifeLog(c, "🎉", "Born in Meadowvale");
  socStat("births");
  news(
    "👶",
    `${pFirst(mom)}${dad ? " & " + pFirst(dad) : ""} ${LAST[mom.l]} welcomed baby ${pFirst(c)}.`,
  );
}
function relocateFamily(p) {
  const fam = familyOf(p);
  let best = null;
  for (const t of HOUSE_TYPES)
    for (const e of entsOf(t))
      if (usable(e) && homeFree(e) >= fam.length && e.id !== p.h) {
        if (!best || popOf(e) > popOf(best)) best = e;
      }
  if (!best) return false;
  for (const q of fam) setHome(q, best);
  lifeLog(p, "🏠", `Moved to a bigger ${BUILD[best.t].name.toLowerCase()}`);
  return true;
}
function coverageHome(p, sid) {
  const h = p.h && world.ents.get(p.h);
  if (!h) return 0;
  const [x, y] = center(h);
  return coverage(sid, x, y);
}

function maybeAmbulance(p) {
  if (ageOf(p) < 60 || Math.random() > 0.4) return;
  const hosp = nearestOf(
    ["hospital"],
    world.ents.get(p.h) || { x: 128, y: 128, w: 1, h: 1 },
  );
  const home = world.ents.get(p.h);
  if (!hosp || !home) return;
  p.st = "x";
  lifeLog(p, "🚑", "Taken to hospital");
  if (typeof dispatchVehicle === "function")
    dispatchVehicle("ambulance", hosp, home, () => {});
}
function fireRisk(e) {
  const b = BUILD[e.t];
  if (
    b.nature ||
    b.flat ||
    b.walk ||
    b.cat === "deco" ||
    b.cat === "land" ||
    b.cat === "event" ||
    e.t === "field" ||
    e.t === "bridge" ||
    b.special
  )
    return 0;
  let r = 0.00011;
  if (POLLUTERS.includes(e.t) || b.cat === "ind") r *= 3;
  if (FOOD_SHOPS.has(e.t)) r *= 1.6;
  if (S.wx && S.wx.type === "heat") r *= 1.8;
  if (
    S.wx &&
    (S.wx.type === "rain" || S.wx.type === "storm" || S.wx.type === "snow")
  )
    r *= 0.4;
  const [x, y] = center(e);
  return r * (1 - 0.8 * coverage("fire", x, y));
}
function hourlyIncidents(h) {
  if (S.level < 3) return;

  for (const e of world.ents.values()) {
    if (!usable(e) || (e.fire && e.fire > NOW)) continue;
    if (Math.random() < fireRisk(e)) startFire(e);
  }

  if (h >= 21 || h <= 4)
    for (const p of S.people)
      if (p.k === "criminal" && !p.jail && Math.random() < 0.18)
        attemptCrime(p);
}
function startFire(e) {
  e.fire = NOW + HOUR_MS * 3;
  e.fireT0 = NOW;
  socStat("fires");
  const st = nearestOf(["firestation"], e);
  news(
    "🔥",
    `Fire at the ${BUILD[e.t].name}!${st ? " Firefighters are on their way." : " There is no fire station - tap it to call volunteers (🪙50)."}`,
    true,
  );
  if (st && typeof dispatchVehicle === "function")
    dispatchVehicle("fire", st, e, () => extinguish(e, st));
  else if (st) setTimeout(() => extinguish(e, st), 4000);
}
function extinguish(e, st) {
  if (!e.fire || e.fire < NOW) return;
  e.fire = 0;
  socStat("firesSaved");
  const crew = st ? employeesOf(st) : [];
  const hero = crew.length ? pick(crew) : null;
  if (hero) {
    hero.fm += 5;
    lifeLog(hero, "🧯", `Put out a fire at the ${BUILD[e.t].name}`);
  }
  news(
    "🚒",
    `${hero ? "Firefighter " + pName(hero) + " and crew" : "Firefighters"} saved the ${BUILD[e.t].name}.`,
  );
  const p = entWorld(e, 40);
  floatText(p[0], p[1], "🧯 Saved!", "#ffffff", 14);
}
function fireBurnout() {
  for (const e of world.ents.values()) {
    if (!e.fire || e.fire > NOW || !e.fireT0) continue;
    e.fire = 0;
    e.fireT0 = 0;
    e.burnt = NOW;
    news("🏚️", `The ${BUILD[e.t].name} burned down. Tap it to rebuild.`, true);
    for (const p of residentsOf(e)) {
      setHome(p, null);
    }
    for (const p of employeesOf(e)) {
      setJob(p, null);
      p.k = "unemployed";
    }
    worldChanged();
  }
}
function attemptCrime(p) {
  const home = world.ents.get(p.h);
  if (!home) return;
  const cands = [];
  for (let k = 0; k < 14; k++) {
    const t = pick(
      Math.random() < 0.55
        ? HOUSE_TYPES
        : [
            "bakery",
            "grill",
            "cornershop",
            "boutique",
            "bank",
            "mall",
            "restaurant",
            "jewelry",
            "pub",
            "grocery",
          ],
    );
    const list = [...entsOf(t)];
    if (!list.length) continue;
    const e = pick(list);
    if (usable(e) && e.id !== home.id && dist(e, home) < 40) cands.push(e);
  }
  if (!cands.length) return;
  const e = pick(cands),
    [x, y] = center(e),
    cov = coverage("safety", x, y);
  if (Math.random() < cov * 0.6) {
    socStat("prevented");
    return;
  }
  const isHome = HOUSE_TYPES.includes(e.t);
  let loot = 0;
  if (isHome) {
    for (const v of residentsOf(e)) {
      const l = Math.round(v.m * 0.15);
      v.m -= l;
      loot += l;
      v.hp -= 8;
    }
  } else {
    const b = bizState(e);
    loot = Math.min(Math.max(0, Math.round(b.cash * 0.2)), 300) + 20;
    b.cash -= loot;
    b.rating = Math.max(1, b.rating - 0.5);
  }
  p.m += loot;
  p.cr++;
  e.crimeT = NOW;
  socStat("crimes");
  const what = isHome
    ? "burglary at a " + BUILD[e.t].name.toLowerCase()
    : "robbery at the " + BUILD[e.t].name;
  const st = nearestOf(["police"], e);
  if (!st) {
    news(
      "🦹",
      `A ${what} - nobody came. Build a Police Station!`,
      S.socDay.crimes <= 1,
    );
    return;
  }
  const inc = { e, p, st, what };
  if (typeof dispatchVehicle === "function")
    dispatchVehicle("police", st, e, () => policeArrive(inc));
  else policeArrive(inc);
}
function policeArrive(inc) {
  const { e, p, st } = inc;
  if (!PEOPLE.has(p.id)) return;
  const [x, y] = center(e);
  const chance =
    0.4 +
    0.35 * coverage("safety", x, y) +
    0.06 * (lvlOf(st) - 1) +
    Math.min(0.15, employeesOf(st).length * 0.02);
  const cop = pick(employeesOf(st));
  if (Math.random() < chance) {
    const fine = Math.min(p.m, 200);
    p.m -= fine;
    S.bud.fines += fine;
    p.jail = 2 + randi(3);
    p.st = "j";
    p.at = 0;
    setJob(p, null);
    lifeLog(p, "🚔", `Arrested for ${inc.what.split(" at ")[0]}`);
    if (cop) {
      cop.fm += 3;
      lifeLog(cop, "🚔", `Arrested ${pName(p)}`);
    }
    socStat("arrests");
    news(
      "🚔",
      `${cop ? "Officer " + pName(cop) : "Police"} arrested ${pName(p)} after a ${inc.what}.`,
    );
  } else
    news(
      "🦹",
      `Police arrived too late - the ${inc.what.split(" at ")[0]} suspect escaped.`,
    );
}

function dailyBusiness() {
  for (const e of world.ents.values()) {
    if (!e.biz || !usable(e)) continue;
    const b = e.biz,
      v = venueSpec(e.t),
      s = jobSpec(e.t);
    const staff = (jobEmp.get(e.id) || []).length,
      pos = positionsOf(e);

    let r = 3 + (lvlOf(e) - 1) * 0.3 + (b.wageLv - 1) * 0.5;
    if (pos && staff >= pos) r += 0.8;
    else if (pos && staff < pos / 2) r -= 1;
    if (v && v.goods && b.oos > 3) r -= 1;
    if (b.turned > b.cust * 0.3 && b.turned > 4) r -= 0.5;
    b.rating = clamp(
      Math.round((b.rating * 0.4 + clamp(r, 1, 5) * 0.6) * 10) / 10,
      1,
      5,
    );
    const day = { rev: Math.round(b.rev), cust: b.cust, turned: b.turned };
    if (!isCity(e) && !b.vacant) {
      const costs = b.rev * 0.32 + (BUILD[e.t].cost || 500) * 0.004;
      b.cash -= costs;
      const profit = b.rev - costs - (s ? staff * wageOfJob(e) : 0);
      if (profit > 0) {
        const tax = (profit * S.tax.biz) / 100;
        S.bud.biz += tax;
        b.cash -= tax;
      }
      day.profit = Math.round(profit);
      const own = PEOPLE.get(b.own);
      if (own && b.cash > 400) {
        const take = Math.round((b.cash - 400) * 0.5);
        b.cash -= take;
        own.m += take;
      }
      b.red = profit < 0 ? b.red + 1 : 0;
      if (b.cash < -250 || b.red >= 5) closeBusiness(e, own);
    } else if (isCity(e) && v)
      day.profit = Math.round(b.rev - (s ? staff * wageOfJob(e) : 0));
    b.hist.unshift(day);
    if (b.hist.length > 7) b.hist.length = 7;
    b.rev = 0;
    b.cust = 0;
    b.turned = 0;
    b.oos = 0;
  }
}
function closeBusiness(e, own) {
  const b = e.biz;
  news(
    "📉",
    `${BUILD[e.t].name}${own ? " owned by " + pName(own) : ""} went out of business.`,
    true,
  );
  if (own) {
    own.k = "unemployed";
    lifeLog(own, "📉", `Closed their ${BUILD[e.t].name.toLowerCase()}`);
    own.hp -= 20;
  }
  b.own = 0;
  b.vacant = true;
  b.cash = 300;
  b.red = 0;
  for (const p of employeesOf(e)) {
    setJob(p, null);
    p.k = "unemployed";
  }
  socStat("bizClosed");
}
function openBusiness(e, p) {
  const b = bizState(e);
  b.own = p.id;
  b.vacant = false;
  b.cash = Math.max(300, Math.round(p.m * 0.3));
  p.m -= Math.round(p.m * 0.3);
  setJob(p, e, "entrepreneur");
  p.k = "entrepreneur";
  lifeLog(p, "🎉", `Opened a ${BUILD[e.t].name.toLowerCase()}`);
  socStat("bizOpened");
  news("🎉", `${pName(p)} opened a ${BUILD[e.t].name}!`, true);
  venueCache = null;
}

function needBalance() {
  const by = venues(),
    out = {};
  for (const n in NEEDS) {
    let sup = 0;
    for (const v of by[n] || []) sup += Math.min(v.cap, 60);
    const dem =
      RES *
      { food: 0.09, fun: 0.06, shop: 0.03, care: 0.025, health: 0.012 }[n];
    out[n] = {
      sup: Math.round(sup),
      dem: Math.round(dem),
      ratio: dem ? sup / dem : 9,
    };
  }
  return out;
}
function bizProposals() {
  S.props = (S.props || []).filter(
    (pr) => pr.until > dayNum() && PEOPLE.has(pr.pid),
  );
  if (S.props.length >= 4 || S.tax.biz > 22 || RES < 30) return;
  const rich = S.people.filter(
    (p) =>
      ["business", "worker", "clerk", "chef", "unemployed"].includes(p.k) &&
      p.m > 350 &&
      ageOf(p) > 22 &&
      ageOf(p) < 60 &&
      p.ed >= 1,
  );
  if (!rich.length || Math.random() > 0.5 + rich.length * 0.02) return;
  const p = pick(rich),
    bal = needBalance();
  const vacant = [...world.ents.values()].filter(
    (e) => e.biz && e.biz.vacant && usable(e) && BUILD[e.t].level <= S.level,
  );
  const needs = Object.keys(bal).sort((a, b) => bal[a].ratio - bal[b].ratio);
  let type = null,
    spot = null,
    lease = null;
  if (vacant.length && Math.random() < 0.6) {
    lease = pick(vacant);
    type = lease.t;
  } else {
    const want = needs[0];
    const opts = BIZ_TYPES.filter(
      (t) =>
        BUILD[t].level <= S.level &&
        (BUILD[t].biz.need === want ||
          (!BUILD[t].biz.need && Math.random() < 0.25)),
    );
    type = opts.length
      ? pick(opts)
      : pick(BIZ_TYPES.filter((t) => BUILD[t].level <= S.level));
    if (!type) return;
    spot = findBizSpot(type, world.ents.get(p.h));
    if (!spot) return;
  }
  const pr = {
    id: S.orderSeq++,
    pid: p.id,
    t: type,
    x: spot ? spot[0] : lease.x,
    y: spot ? spot[1] : lease.y,
    lease: lease ? lease.id : 0,
    until: dayNum() + 3,
    fee: Math.round(BUILD[type].cost * 0.15),
  };
  S.props.push(pr);
  if (S.autoBiz) {
    approveProposal(pr.id);
    return;
  }
  notify(
    "💼",
    `${pName(p)} wants to ${lease ? "take over the empty" : "open a new"} ${BUILD[type].name} (permit fee 🪙${pr.fee} for you). See 👥 Census → Businesses.`,
  );
}
function findBizSpot(t, near) {
  const b = BUILD[t],
    rc = roadComponents();
  const [cx, cy] = near ? center(near) : [S.spawn.x, S.spawn.y];
  let best = null,
    bd = 1e9;
  for (let k = 0; k < 500; k++) {
    const x = Math.round(cx + rand(-22, 22)),
      y = Math.round(cy + rand(-22, 22));
    if (!placeOK(t, x, y, -1, b.w, b.h)) continue;
    let road = false;
    for (let yy = y - 1; yy <= y + b.h && !road; yy++)
      for (let xx = x - 1; xx <= x + b.w; xx++)
        if (rc.has(tkey(xx, yy))) {
          road = true;
          break;
        }
    if (!road) continue;
    const d = Math.abs(x - cx) + Math.abs(y - cy);
    if (d < bd) {
      bd = d;
      best = [x, y];
    }
  }
  return best;
}
function approveProposal(id) {
  const pr = (S.props || []).find((x) => x.id === id);
  if (!pr) return;
  const p = PEOPLE.get(pr.pid);
  S.props = S.props.filter((x) => x !== pr);
  if (!p) return;
  let e;
  if (pr.lease) {
    e = world.ents.get(pr.lease);
    if (!e || !e.biz || !e.biz.vacant) {
      toastOnce("That building is no longer available.", "warn");
      return;
    }
  } else {
    if (!placeOK(pr.t, pr.x, pr.y, -1, BUILD[pr.t].w, BUILD[pr.t].h)) {
      const s = findBizSpot(pr.t, world.ents.get(p.h));
      if (!s) {
        toastOnce("No free lot next to a road for that business.", "warn");
        return;
      }
      pr.x = s[0];
      pr.y = s[1];
    }
    e = addEnt(newEntity(pr.t, pr.x, pr.y));
    e.born = NOW;
    recalcPop();
  }
  S.coins += pr.fee;
  S.bud.permits += pr.fee;
  openBusiness(e, p);
  sfx("build");
  const w = entWorld(e, 30);
  floatText(
    w[0],
    w[1],
    `🎉 ${BUILD[pr.t].name} opened! +🪙${pr.fee}`,
    "#ffffff",
    13,
  );
}
function declineProposal(id) {
  S.props = (S.props || []).filter((x) => x.id !== id);
}

function newBudgetDay() {
  return {
    d: yearOf(dayNum()),
    inc: 0,
    sales: 0,
    biz: 0,
    venue: 0,
    fines: 0,
    permits: 0,
    wages: 0,
    paid: 0,
  };
}
function settleBudget() {
  const B = S.bud,
    inn = B.inc + B.sales + B.biz + B.venue + B.fines - (B._in || 0),
    out = B.wages - (B._out || 0);
  B._in = B.inc + B.sales + B.biz + B.venue + B.fines;
  B._out = B.wages;
  const net = Math.round(inn - out + (S.budCarry || 0));
  S.budCarry = inn - out + (S.budCarry || 0) - net;
  if (net > 0) {
    S.coins += net;
    S.stats.earned += net;
    S.stats.taxes = (S.stats.taxes || 0) + net;
  } else if (net < 0) {
    const pay = Math.min(S.coins, -net);
    S.coins -= pay;
    if (pay < -net) {
      S.deficit = (S.deficit || 0) + 1;
      if (S.deficit === 1)
        notify(
          "⚠️",
          "The city budget is in deficit - public workers were not fully paid. Raise taxes or build businesses.",
        );
    } else S.deficit = 0;
  }
  B.paid += net;
  const th = hasType("townhall");
  if (th && net) {
    const w = entWorld(th, 80);
    floatText(
      w[0],
      w[1],
      `${net > 0 ? "+" : ""}🪙${fmt(net)} taxes`,
      net > 0 ? "#c8ff9a" : "#ffb0a0",
      12,
    );
  }
}

function societyTick() {
  if (!S.people) initSociety();
  if (socDirty) rebuildSocIndex();
  if (!S.bud) S.bud = newBudgetDay();
  const ah = absHour();
  if (S.socHour == null) S.socHour = ah;

  let steps = clamp(ah - S.socHour, 0, 3);
  if (ah - S.socHour > 3) S.socHour = ah - 3;
  while (steps-- > 0) {
    const h0 = ((S.socHour % 24) + 24) % 24,
      wk0 = isWeekend(Math.floor(S.socHour / 24));
    for (let i = S.socCur || 0; i < S.people.length; i++)
      stepPerson(S.people[i], h0, wk0);
    S.socHour++;
    S.socCur = 0;
    venueCache = null;
    const h = ((S.socHour % 24) + 24) % 24;
    hourly(h);
    if (h === 0) newDay();
  }

  const frac = clamp((NOW / 1000 / DAY_LEN + 0.25) * 24 - S.socHour, 0, 1);
  const target = Math.floor(S.people.length * frac),
    h = hourOfDay(),
    wk = isWeekend(dayNum());
  for (let i = S.socCur || 0; i < target && i < S.people.length; i++)
    stepPerson(S.people[i], h, wk);
  S.socCur = Math.max(S.socCur || 0, target);
  fireBurnout();
}
function hourly(h) {
  for (const p of [...S.people]) {
    if (p.h && !usable(world.ents.get(p.h))) {
      setHome(p, null);
    }
    if (!p.h) {
      let home = null;
      for (const t of HOUSE_TYPES) {
        for (const e of entsOf(t))
          if (usable(e) && homeFree(e) > 0) {
            home = e;
            break;
          }
        if (home) break;
      }
      if (home) setHome(p, home);
      else if (Math.random() < 0.5) {
        removePerson(p);
        socStat("emigrants");
      }
    }
    if (p.j > 0 && !world.ents.get(p.j)) {
      setJob(p, null);
      p.k = "unemployed";
    }
    if (p.j < 0 && !S.workers.some((w) => w.id === -p.j)) {
      p.j = 0;
      p.k = "unemployed";
    }
  }
  jobMarket(80);

  const cap = housingCap(),
    free = cap - RES;
  const attract = (CITY.hap || 50) / 100 - Math.max(0, S.tax.inc - 10) * 0.02;
  if (free > 0 && attract > 0.3) {
    let budget = Math.min(free, 2 + Math.ceil(free * 0.15 * attract));
    const homes = [];
    for (const t of HOUSE_TYPES)
      for (const e of entsOf(t))
        if (usable(e) && homeFree(e) > 0) homes.push(e);
    while (budget > 0 && homes.length) {
      const e = homes[randi(homes.length)];
      const n = moveInFamily(e);
      budget -= Math.max(1, n);
      if (homeFree(e) <= 0) homes.splice(homes.indexOf(e), 1);
    }
  }
  hourlyIncidents(h);
  settleBudget();
}
function newDay() {
  dailyLife();

  const emp = S.people.filter((p) => p.j).length,
    adults = S.people.filter((p) => {
      const a = ageOf(p);
      return a >= 18 && a < 65;
    }).length;
  const B = S.bud,
    rev = B.inc + B.sales + B.biz + B.venue + B.fines + B.permits;
  S.hist.unshift({
    d: yearOf(dayNum() - 1),
    pop: RES,
    emp: adults ? Math.round((emp / adults) * 100) : 0,
    hp: avgHp(),
    rev: Math.round(rev),
    exp: Math.round(B.wages),
    crimes: S.socDay.crimes || 0,
    births: S.socDay.births || 0,
    deaths: S.socDay.deaths || 0,
  });
  if (S.hist.length > 60) S.hist.length = 60;
  S.budHist.unshift(Object.assign({}, B));
  if (S.budHist.length > 14) S.budHist.length = 14;
  S.bud = newBudgetDay();
  S.socDay = {};
}
function avgHp() {
  if (!S.people.length) return 50;
  let s = 0;
  for (const p of S.people) s += p.hp;
  return Math.round(s / S.people.length);
}

const _cityTickSoc = cityTick;
cityTick = function () {
  _cityTickSoc.apply(this, arguments);
  if (S.people && S.people.length)
    CITY.hap = Math.round(CITY.hap * 0.5 + avgHp() * 0.5);
};

const _rentReadySoc = rentReady;
rentReady = function (e) {
  return !e.burnt && _rentReadySoc(e);
};
const _factoryTickSoc = factoryTick;
factoryTick = function (e) {
  if (e.burnt) {
    if (e.job) e.job.st += 250;
    return;
  }
  return _factoryTickSoc(e);
};
function repairCost(e) {
  return Math.round(((BUILD[e.t].cost || 300) * 0.3) / 10) * 10 + 20;
}
function repairBuilding(e) {
  if (!e.burnt || !spend(repairCost(e))) return;
  e.burnt = 0;
  worldChanged();
  sfx("build");
  const w = entWorld(e, 30);
  floatText(w[0], w[1], "🔨 Rebuilt!", "#ffffff", 14);
  hidePopup();
}

const _hireWorkerSoc = hireWorker;
hireWorker = function (cid) {
  const c = (S.cands || []).find((x) => x.cid === cid),
    before = S.workers.length;
  const p =
    c && S.people
      ? S.people.find(
          (q) =>
            !q.j &&
            q.k !== "criminal" &&
            q.k !== "staff" &&
            ageOf(q) >= 18 &&
            ageOf(q) < 65 &&
            q.k !== "undergrad" &&
            q.k !== "retiree",
        )
      : null;
  if (p) c.name = pFirst(p);
  _hireWorkerSoc(cid);
  if (p && S.workers.length > before) {
    const w = S.workers[S.workers.length - 1];
    setJob(p, null);
    p.j = -w.id;
    p.k = "staff";
    p.un = 0;
    w.pid = p.id;
    lifeLog(
      p,
      "🪪",
      `Joined your staff as ${ROLES[w.role].name.toLowerCase()}`,
    );
  }
};
