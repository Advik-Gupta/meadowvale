const STORE_FAMILIES = {
  matstore: { icon: "🧱", name: "Material Storage", desc: "Depots and yards for bricks, planks, tools and ores. Pick a size.", members: ["depot", "materialyard", "builderyard", "megadepot", "matwarehouse", "matpark", "matterminal"] },
  cropstore: { icon: "🌾", name: "Crop Storage", desc: "Silos and granaries for harvested crops.", members: ["silo", "megasilo", "elevator", "granary", "grainterminal"] },
  coldstore: { icon: "❄️", name: "Cold Storage", desc: "Keeps milk, eggs, meat and fish fresh.", members: ["coldstore", "coldhub", "freezerplant"] },
  feedstore: { icon: "🥣", name: "Feed Storage", desc: "Feed for your animals - the Feed Mill fills it.", members: ["feedshed", "feedsilo", "feedmillstore"] },
  goodsstore: { icon: "📦", name: "Goods Warehouses", desc: "Store finished goods from your factories.", members: ["warehouse", "storagehall", "logistics", "distribution", "megawarehouse"] },
  fastfoodstore: { icon: "🥡", name: "Fast-Food Storage", desc: "Pantries and cold rooms that hold goods for your restaurants.", members: ["ffpantry", "ffcoldroom", "ffdistrib"] },
  animals: { icon: "🐄", name: "Animal Farms", desc: "Coops, sheds and ponds. Animals need feed.", members: ["coop", "cowshed", "sheepfarm", "pigpen", "goatfarm", "apiary", "duckpond", "fishpond", "alpacaranch", "oysterbed"] },
  orchards: { icon: "🍎", name: "Orchard Trees", desc: "Fruit trees that regrow after every harvest.", members: ["orchard_apple", "orchard_orange", "orchard_cherry", "orchard_olive", "orchard_coconut"] },
  houses: { icon: "🏠", name: "Houses", desc: "Family homes, from tiny houses to mansions.", members: ["h_tiny", "house", "cottage", "bungalow", "h_suburb", "farmhouse", "duplex", "townhouse", "chalet", "victorian", "villa", "h_brownstone", "h_rowhouses", "mansion", "h_farmstead", "h_treehouse"] },
  flats: { icon: "🏢", name: "Apartments & Towers", desc: "Dense housing for growing cities.", members: ["apartment", "condo", "h_dorm", "h_social", "h_midrise", "highrise", "tower", "ecotower", "h_penthouse", "skyscraper", "h_megatower"] },
  special: { icon: "🏘️", name: "Special Housing", desc: "Mobile home parks and retirement villages.", members: ["h_mobile", "h_retire"] },
  schools: { icon: "🎓", name: "Education", desc: "Kindergartens, schools, colleges and universities.", members: ["kindergarten", "school", "highschool", "college", "university", "research"] },
  health: { icon: "🏥", name: "Healthcare", desc: "Clinics and hospitals keep residents healthy.", members: ["clinic", "hospital", "childrens", "medcenter"] },
  worship: { icon: "⛪", name: "Places of Worship", desc: "Churches, temples and more.", members: ["church", "synagogue", "hindutemple", "gurdwara"] },
  parks: { icon: "🌳", name: "Parks & Gardens", desc: "Green space residents love.", members: ["park", "dogpark", "commgarden", "centralpark"] },
  power: { icon: "⚡", name: "Power Plants", desc: "From diesel generators to fusion reactors.", members: ["pw_diesel", "windturbine", "solarfarm", "powerplant", "pw_windfarm", "pw_offshore", "pw_gas", "pw_biomass", "pw_solar2", "pw_geo", "pw_coal2", "pw_hydro", "pw_nuclear", "pw_fusion"] },
  water: { icon: "💧", name: "Water Supply", desc: "Towers, pumps and treatment plants.", members: ["watertower", "pumpstation", "wt_treatment", "wt_desal", "wt_reservoir"] },
  rail: { icon: "🚂", name: "Railway", desc: "Track, signals, stations and depots.", members: ["rail", "signal", "rail_halt", "trainstation", "rail_central", "freightdepot", "rail_depot", "roundhouse", "freightyard", "maglev"] },
  air: { icon: "✈️", name: "Airports", desc: "Runways, terminals, hangars and helipads.", members: ["runway", "taxiway", "apron", "jetbridge", "controltower", "atcradar", "terminal", "terminal2", "airport", "airstrip", "air_hangar", "air_cargo", "air_fuel", "airporthotel", "helipad", "heliport"] },
  sea: { icon: "🚢", name: "Ports & Harbours", desc: "Piers, berths, shipyards and container ports.", members: ["berth", "fishingpier", "lighthouse", "ferrypier", "marina", "seaport", "shipyard", "drydock", "cruiseterm", "containerport"] },
  transit: { icon: "🚌", name: "Buses, Metro & Parking", desc: "Public transport and parking for your roads.", members: ["busstop", "busstation", "taxirank", "metro", "tramdepot", "parking", "parkgarage", "evcharge", "truckterminal"] },
  roads: { icon: "🛣️", name: "Roads & Paths", desc: "Roads let residents and customers get around.", members: ["road", "dirtpath", "stoneroad", "brickroad", "plaza"] },
  greenery: { icon: "🌷", name: "Trees & Plants", desc: "Trees, hedges and flower beds.", members: ["dtree", "palm", "hedge", "flowers", "d_planter"] },
  street: { icon: "🪑", name: "Street Furniture", desc: "Benches, lamps, kiosks and carts.", members: ["bench", "lamp", "fence", "flagpole", "d_billboard", "d_phonebox", "d_kiosk", "d_hotdog", "d_icecart", "d_clock"] },
  monuments: { icon: "🗿", name: "Monuments", desc: "Stone, golden and diamond monuments.", match: (k) => /^mon\d+$/.test(k) },
  quarries: { icon: "🪨", name: "Quarries", desc: "Stone, clay and sand.", members: ["quarry", "in_quarry2"] },
  bricks: { icon: "🧱", name: "Brickworks", desc: "Turn clay into bricks.", members: ["brickworks", "in_brickplant"] },
  glass: { icon: "🪟", name: "Glassworks", desc: "Turn sand into glass.", members: ["glassworks", "in_glassplant"] },
  tools: { icon: "🔧", name: "Tool Makers", desc: "Make tools for construction and upgrades.", members: ["toolworks", "in_toolplant"] },
  food: { icon: "🍔", name: "Fast-Food Chains", desc: "Famous restaurant chains residents queue for.", match: (k) => /^ch_(burger|chicken|pizza|sub|taco|coffee|donut|wok|noodle|icecream|steak|sushi|bbq|diner|bubble)$/.test(k) },
  retail: { icon: "🛍️", name: "Retail Chains", desc: "Supermarkets, stores, gas stations and hotels.", match: (k) => /^ch_(mart|super|fashion|electro|sports|furniture|pharmacy|gas|carwash|hotel)$/.test(k) },
  walls: { icon: "🧱", name: "Walls & Towers", desc: "Defence walls, gates and lookout posts.", members: ["mil_wall", "mil_gate", "mil_tower", "mil_sentry"] },
  milair: { icon: "🚁", name: "Air Bases", desc: "Helicopters, jets and drones.", members: ["mil_helibase", "mil_hangar", "mil_drones", "mil_airfield"] },
  naval: { icon: "⚓", name: "Naval Bases", desc: "Docks for the navy.", members: ["mil_naval", "mil_subpen", "mil_carrier"] },
  courts: { icon: "⚖️", name: "Courts", desc: "Justice for your citizens.", members: ["gov_court", "gov_supreme"] },
};

function famMembers(id) {
  const f = STORE_FAMILIES[id];
  if (!f.list) f.list = f.members ? f.members.filter((k) => BUILD[k]) : Object.keys(BUILD).filter(f.match);
  return f.list;
}
function famCat(id) {
  const ks = famMembers(id);
  return ks.length ? BUILD[ks[0]].cat : null;
}
const FAM_OF = {};
function famIndex() {
  if (famIndex.done) return;
  famIndex.done = true;
  for (const id in STORE_FAMILIES) {
    const ks = famMembers(id),
      cat = famCat(id);
    const same = ks.filter((k) => BUILD[k].cat === cat);
    STORE_FAMILIES[id].list = same;
    if (same.length < 2) continue;
    for (const k of same) FAM_OF[k] = id;
  }
}
function famCard(id) {
  const f = STORE_FAMILIES[id],
    ks = famMembers(id);
  const costs = ks.map((k) => buildCost(k)),
    min = Math.min(...costs),
    owned = ks.reduce((a, k) => a + countOf(k), 0);
  const sizes = ks.map((k) => BUILD[k].w * BUILD[k].h);
  const small = ks[sizes.indexOf(Math.min(...sizes))],
    big = ks[sizes.indexOf(Math.max(...sizes))];
  const sz = (k) => BUILD[k].w + "×" + BUILD[k].h;
  return `<div class="card fam-card" data-act="store-family" data-f="${id}">
    <div class="fam-stack">${thumbHTML(ks[0])}<span class="fam-n">${ks.length}</span></div>
    <div class="card-name">${f.icon} ${f.name}</div>
    <div class="card-desc">${f.desc}</div>
    <div class="card-stats"><span class="chip">${ks.length} options</span>${small !== big ? `<span class="chip">${sz(small)} → ${sz(big)}</span>` : ""}${owned ? `<span class="chip on">${owned} built</span>` : ""}</div>
    <button class="btn blue" data-act="store-family" data-f="${id}">${S.mode === "creative" ? "" : `From 🪙${fmt(min)} · `}See all ›</button></div>`;
}
function famView(id) {
  const f = STORE_FAMILIES[id];
  return `<div class="fam-head"><button class="btn small" data-act="store-back">‹ Back</button><div><b>${f.icon} ${f.name}</b><small>${f.desc}</small></div></div><div class="cards">${famMembers(id).map(buildCard).join("")}</div>`;
}
function storeSearch(q) {
  const s = q.toLowerCase();
  const hits = Object.keys(BUILD)
    .filter((k) => {
      const b = BUILD[k];
      if (b.nature || !b.cat || b.cat === "event" || b.cat === "unique" || k === "barn") return false;
      return b.name.toLowerCase().includes(s) || (b.desc || "").toLowerCase().includes(s);
    })
    .slice(0, 60);
  return `<div class="hint">${hits.length ? `${hits.length}${hits.length === 60 ? "+" : ""} buildings match <b>${q.replace(/</g, "&lt;")}</b>` : `Nothing matches <b>${q.replace(/</g, "&lt;")}</b> - try another word.`}</div><div class="cards">${hits.map(buildCard).join("")}</div>`;
}
const STORE_NO_SEARCH = { perks: 1, boost: 1, soon: 1, seeds: 1, supplies: 1 };
const _renderStoreFam = renderStore;
renderStore = function (tab) {
  famIndex();
  const q = (panel && panel.q) || "";
  const bar = STORE_NO_SEARCH[tab] && !q ? "" : `<div class="store-search"><input id="store-q" type="search" placeholder="🔍 Search all buildings…" value="${q.replace(/"/g, "&quot;")}" autocomplete="off"></div>`;
  if (q.trim()) return bar + storeSearch(q.trim());
  if (panel && panel.family && famCat(panel.family) === tab) return bar + famView(panel.family);
  const hidden = [];
  for (const k in FAM_OF) {
    const id = FAM_OF[k];
    if (BUILD[k].cat === tab && famMembers(id)[0] !== k) {
      hidden.push(k);
      BUILD[k].cat = "_fam";
    }
  }
  const bc = buildCard;
  buildCard = (k) => (FAM_OF[k] && famMembers(FAM_OF[k])[0] === k && BUILD[k].cat === tab ? famCard(FAM_OF[k]) : bc(k));
  try {
    return bar + _renderStoreFam(tab);
  } finally {
    buildCard = bc;
    for (const k of hidden) BUILD[k].cat = tab;
  }
};
PANELS.store.render = renderStore;
Object.assign(ACT, {
  "store-family": (d) => {
    if (!panel) return;
    panel.family = d.f;
    const body = $("#modal-body");
    renderPanel(true);
    if (body) body.scrollTop = 0;
    sfx("click");
  },
  "store-back": () => {
    if (!panel) return;
    panel.family = null;
    renderPanel(true);
    sfx("click");
  },
});
const _tabFam = ACT.tab;
ACT.tab = (d) => {
  if (panel) {
    panel.family = null;
    panel.q = "";
  }
  _tabFam(d);
};
document.addEventListener("input", (ev) => {
  if (ev.target && ev.target.id === "store-q" && panel) {
    panel.q = ev.target.value;
    renderPanel(true);
  }
});
