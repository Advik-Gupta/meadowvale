const FLEET_SHIPS = {
  trawler: {
    name: "Fishing Trawler",
    icon: "🎣",
    kind: "fishing",
    cost: 3500,
    needs: "seaport",
    desc: "A small, hardy boat for short trips.",
  },
  yacht: {
    name: "Luxury Yacht",
    icon: "🛥️",
    kind: "sail",
    cost: 9000,
    needs: "marina",
    tour: 8,
    desc: "Brings wealthy visitors (+tourism).",
  },
  ferry: {
    name: "Passenger Ferry",
    icon: "⛴️",
    kind: "ferry",
    cost: 12000,
    needs: "ferrypier",
    tour: 10,
    desc: "Carries commuters and tourists between islands.",
  },
  container: {
    name: "Container Ship",
    icon: "🚢",
    kind: "container",
    cost: 30000,
    needs: "seaport",
    desc: "A big cargo ship for long voyages.",
  },
  tanker: {
    name: "Oil Tanker",
    icon: "🛢️",
    kind: "tanker",
    cost: 34000,
    needs: "drydock",
    desc: "Moves fuel and oil across the ocean.",
  },
  cruise: {
    name: "Cruise Liner",
    icon: "🛳️",
    kind: "cruise",
    cost: 60000,
    needs: "cruiseterm",
    tour: 40,
    desc: "A floating city of tourists: big tourism boost.",
  },
};
const FLEET_PLANES = {
  prop: {
    name: "Prop Plane",
    icon: "🛩️",
    scale: 0.55,
    livery: "#43a047",
    cost: 6000,
    needs: "airport",
    desc: "Small and cheap.",
  },
  seaplane: {
    name: "Seaplane",
    icon: "🛩️",
    scale: 0.6,
    livery: "#ef6c00",
    cost: 9000,
    needs: "marina",
    tour: 6,
    desc: "Lands on water; tourists love it.",
  },
  bizjet: {
    name: "Business Jet",
    icon: "✈️",
    scale: 0.7,
    livery: "#212121",
    cost: 18000,
    needs: "airport",
    desc: "Fast and fancy.",
  },
  regional: {
    name: "Regional Jet",
    icon: "✈️",
    scale: 0.85,
    livery: "#1565c0",
    cost: 22000,
    needs: "airport",
    desc: "A workhorse for short routes.",
  },
  airliner: {
    name: "Wide-body Airliner",
    icon: "✈️",
    scale: 1.15,
    livery: "#c62828",
    cost: 48000,
    needs: "air_hangar",
    tour: 12,
    desc: "Long-haul flights full of tourists.",
  },
  cargojet: {
    name: "Cargo Freighter",
    icon: "📦",
    scale: 1.1,
    livery: "#ff8f00",
    cost: 52000,
    needs: "air_cargo",
    desc: "Heavy cargo: more crates per flight.",
  },
  jumbo: {
    name: "Jumbo Jet",
    icon: "🛫",
    scale: 1.4,
    livery: "#6a1b9a",
    cost: 90000,
    needs: "air_hangar",
    tour: 24,
    desc: "The queen of the skies.",
  },
};
function fleet() {
  S.fleet = S.fleet || { ships: [], planes: [] };
  return S.fleet;
}
const _shipCountFleet = shipCount;
shipCount = function () {
  const n = _shipCountFleet();
  return n ? n + fleet().ships.length : 0;
};
const _planeCountFleet = planeCount;
planeCount = function () {
  const n = _planeCountFleet();
  return n ? n + fleet().planes.length : 0;
};
function fleetTick() {
  const f = fleet(),
    bs = _shipCountFleet(),
    bp = _planeCountFleet();
  S.sea.ships.forEach((s, i) => {
    const k = f.ships[i - bs];
    s.kind = k ? FLEET_SHIPS[k].kind : undefined;
    s.fk = k;
  });
  S.air.planes.forEach((p, i) => {
    p.fk = f.planes[i - bp] || null;
  });
}
function planeLook(p) {
  const F = p && p.fk && FLEET_PLANES[p.fk];
  return F ? [F.scale, F.livery] : [1, "#1e88e5"];
}
function buyFleet(type, k) {
  const D = type === "ship" ? FLEET_SHIPS[k] : FLEET_PLANES[k];
  if (!D) return;
  if (!hasType(D.needs)) {
    toastOnce(`Needs a ${BUILD[D.needs].name} first.`, "warn");
    sfx("error");
    return;
  }
  if (!spend(D.cost)) return;
  (type === "ship" ? fleet().ships : fleet().planes).push(k);
  sfx("level");
  toast(`${D.icon} <b>${D.name}</b> commissioned!`, "good");
  renderPanel(true);
}
function fleetTourism() {
  let t = 0;
  for (const k of fleet().ships) t += FLEET_SHIPS[k].tour || 0;
  for (const k of fleet().planes) t += FLEET_PLANES[k].tour || 0;
  return t;
}
const _cityTickFleet = cityTick;
cityTick = function () {
  _cityTickFleet.apply(this, arguments);
  const t = fleetTourism();
  if (t) CITY.tourists += t;
};
function renderFleet() {
  const f = fleet();
  const card = (type, k, D) => {
    const have = (type === "ship" ? f.ships : f.planes).filter(
        (x) => x === k,
      ).length,
      ok = !!hasType(D.needs),
      can = ok && S.coins >= D.cost;
    return `<div class="card"><div class="big-ic">${D.icon}</div><div class="card-name">${D.name}</div><div class="card-desc">${D.desc}</div>
      <div class="card-stats"><span class="chip">Owned ${have}</span>${D.tour ? `<span class="chip">🧳 +${D.tour} tourists</span>` : ""}</div>
      ${ok ? `<button class="btn ${can ? "green" : "disabled"}" data-act="fleet-buy" data-type="${type}" data-k="${k}">Commission · 🪙${fmt(D.cost)}</button>` : `<button class="btn blue" data-act="c-build" data-id="${D.needs}">Needs ${BUILD[D.needs].icon} ${BUILD[D.needs].name}</button>`}</div>`;
  };
  return `<div class="hint">🛠️ Commission your own fleet. Every ship and plane joins your trade routes - it sails or flies from your port and airport - and passenger vessels bring tourists.</div>
    <div class="jb-sec-h">🚢 Ships · ${f.ships.length} commissioned</div><div class="cards">${Object.entries(
      FLEET_SHIPS,
    )
      .map(([k, D]) => card("ship", k, D))
      .join("")}</div>
    <div class="jb-sec-h">✈️ Aircraft · ${f.planes.length} commissioned</div><div class="cards">${Object.entries(
      FLEET_PLANES,
    )
      .map(([k, D]) => card("plane", k, D))
      .join("")}</div>`;
}
PANELS.transport.tabs.push({ id: "fleet", label: "🛠️ Fleet" });
const _transportSigFleet = PANELS.transport.sig;
PANELS.transport.sig = () =>
  _transportSigFleet() +
  "|" +
  fleet().ships.length +
  "," +
  fleet().planes.length +
  "," +
  S.coins;
const _renderTransportFleet = renderTransport;
renderTransport = function (tab) {
  return tab === "fleet" ? renderFleet() : _renderTransportFleet(tab);
};
Object.assign(ACT, { "fleet-buy": (d) => buyFleet(d.type, d.k) });
