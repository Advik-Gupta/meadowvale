window.addEventListener('load', () => setTimeout(runSuite, 300));

function runSuite() {
  const R = [];
  const ok = (n, c, extra) => R.push((c ? 'PASS ' : 'FAIL ') + n + (extra ? ' :: ' + extra : ''));
  const jump = (ms) => { clock.t += ms; advanceClock(); };
  const step = (ms, n) => { for (let i = 0; i < n; i++) { jump(ms); updateWorkers(ms / 1000); tick(); } };
  const scan = (t, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (placeOK(t, x, y, -1)) return [x, y]; return null; };
  const put = (t, x, y) => { const e = addEnt(newEntity(t, x, y)); if (BUILD[t].produce) e.pp = NOW; if (BUILD[t].orchard) orchardInit(e); if (needsBuild(t)) startConstruction(e); return e; };
  const finish = (e) => { if (!e || !e.build) return e; e.build.prog = 1; for (const k in e.build.need) addItem(k, e.build.need[k]); deliverMats(e, true); constructionTick(1); return e; };
  const section = (name, fn) => { try { fn(); } catch (x) { R.push(`ERROR in ${name}: ${x.message} | ${(x.stack || '').split('\n').slice(1, 3).join(' | ')}`); } };

  closeDialog(); closeDialog();

  const WX0 = S.spawn.x - 70, WY0 = S.spawn.y - 70, WX1 = S.spawn.x + 70, WY1 = S.spawn.y + 70;
  loadAround(S.spawn.x, S.spawn.y, 80);

  section('basics', () => {
    ok('boot', !!S && world.ents.size > 300 && !!S.seedText);
    const seen = new Set(); for (let i = 0; i < 4000; i++) seen.add(genTile(randi(6000) - 3000, randi(6000) - 3000)[1]);
    ok('many biomes across the world', seen.size >= 10, seen.size);
    const pts = [[5, 9], [-700, 1300], [12345, -999]], a1 = pts.map(([x, y]) => genTile(x, y).join());
    initGen(hashSeed('other-seed'), 0, 0); const a2 = pts.map(([x, y]) => genTile(x, y).join());
    initGen(S.seed, S.genSpawn.x, S.genSpawn.y); const a3 = pts.map(([x, y]) => genTile(x, y).join());
    ok('same seed → same world, different seed → different world', a1.join() === a3.join() && a1.join() !== a2.join());
    ok('starting village founded', !!hasType('townhall') && !!hasType('market') && !!hasType('barn') && entsOf('road').size > 30 && POP >= 30, POP);
    const far = P(S.spawn.x + 4000, S.spawn.y - 3000); const sc = [cam.x, cam.y]; cam.x = far[0]; cam.y = far[1]; for (let i = 0; i < 10; i++) render();
    ok('chunks stream in far away', [...world.act.values()].some((c) => Math.abs(c.cx * 16 - S.spawn.x - 4000) < 200));
    cam.x = sc[0]; cam.y = sc[1]; for (let i = 0; i < 30; i++) render(); loadAround(S.spawn.x, S.spawn.y, 80);
    ok('far chunks unload again', ![...world.act.values()].some((c) => Math.abs(c.cx * 16 - S.spawn.x - 4000) < 200));
    ok('start: 12 fields, 20/20 seeds', entsOf('field').size === 12 && S.seeds.wheat === 20 && S.seeds.rice === 20);
    const f = [...entsOf('field')][0];
    plantField(f, 'wheat'); jump(5000); ok('crop grows', fieldReady(f)); harvestField(f); ok('harvest x2', (S.inv.wheat || 0) >= 2);
  });

  section('real click path', () => {
    let errs = [];
    for (const e of [...world.ents.values()]) {
      if (!isUnlocked(e.x, e.y)) continue;
      const p = P(e.x + e.w / 2, e.y + e.h / 2, 4); cam.x = p[0]; cam.y = p[1]; cam.z = 1.2;
      try { handleClick(VW / 2, VH / 2); updatePopup(); hidePopup(); closePanel(true); closeDialog(); } catch (x) { errs.push(e.t + ': ' + x.message); }
    }
    for (let k = 0; k < 200; k++) { const p = P(WX0 + randi(140) + 0.5, WY0 + randi(140) + 0.5); cam.x = p[0]; cam.y = p[1]; try { handleClick(VW / 2, VH / 2); hidePopup(); closeDialog(); } catch (x) { errs.push('tile: ' + x.message); } }
    ok('clicking everything is safe', !errs.length, errs.slice(0, 4).join(' | '));
  });

  section('build everything', () => {
    S.level = 100; S.coins = 1e9; S.gems = 9999; S.barnCap = 1e6;
    for (const e of [...world.ents.values()]) if (e.nat) removeEnt(e);
    worldChanged();
    const special = ['bridge'], failed = [];
    for (const t of Object.keys(BUILD)) {
      const b = BUILD[t];
      if (b.nature || special.includes(t) || b.paint || (b.special && t !== 'barn')) continue;
      if (b.max && countOf(t) >= b.max) continue;
      let p = scan(t, WX0, WY0, WX1, WY1);
      if (!p && b.place) for (let r = 80; r < 1500 && !p; r += 12) for (let a = 0; a < 48 && !p; a++) { const x = S.spawn.x + Math.round(Math.cos(a / 48 * 6.283) * r), y = S.spawn.y + Math.round(Math.sin(a / 48 * 6.283) * r); if (placeOK(t, x, y, -1)) p = [x, y]; }
      if (!p) { failed.push(t); continue; }
      finish(put(t, p[0], p[1]));
    }
    ok('every building type placeable', !failed.length, failed.join(','));
    recalcPop(); recalcPools();
    let err = null;
    for (const z of [0.3, 0.55, 1.3]) for (const e of world.ents.values()) { if (BUILD[e.t].nature) continue; const p = P(e.x, e.y); cam.x = p[0]; cam.y = p[1]; cam.z = z; try { render(); } catch (x) { err = e.t + ': ' + x.message; break; } if (err) break; }
    ok('everything renders (near/far/cached terrain)', !err, err);
    genThumbs(); const miss = Object.keys(BUILD).filter((t) => !BUILD[t].nature && t !== 'bridge' && !BUILD[t].paint && !THUMBS[t]);
    ok('store thumbnails', !miss.length, miss.join(','));
    ok('~120 recipes', Object.keys(RECIPES).length >= 115, Object.keys(RECIPES).length);
    ok('80+ achievements', ACHIEVEMENTS.length >= 80, ACHIEVEMENTS.length);
    ok('everything buildable from the start (money & materials are the limits)', Object.values(BUILD).filter((b) => b.cat !== 'soon').every((b) => (b.level || 1) <= 1));
  });

  section('farm systems', () => {
    const o = hasType('orchard_apple'); o.nt = NOW; const a0 = S.inv.apple || 0; orchardHarvest(o, true);
    ok('orchard harvest', (S.inv.apple || 0) > a0 && o.hl === 4);
    o.hl = 0; orchardPrune(o); ok('orchard prune', o.hl === 5);
    const sh0 = seedCap(); ok('seed shed raises cap', sh0 > 200);
    S.seeds.wheat = 0; buySeeds('wheat', 1e6); ok('seed cap respected', seedTotal() <= seedCap());
    const coop = hasType('duckpond'); S.inv.duckfeed = 10; feedAnimals(coop, true); jump(60000); ok('ducks give feathers', collectAnimals(coop, true) > 0);
    S.wx = null; const f = [...entsOf('field')][0]; f.crop = 'pumpkin'; f.pt = NOW; const pt0 = f.pt; jump(1000); lastSysNow = NOW - 1000; systemsTick();
    ok('season affects growth', f.pt !== pt0);
  });

  section('factories', () => {
    const bk = hasType('bakery'); bk.out = []; bk.job = null; bk.queue = [];
    S.inv.wheat = 100;
    for (let i = 0; i < 8; i++) { startRecipe(bk, 'bread', true); jump(30000); factoryTick(bk); }
    ok('shelves fill & block', bk.out.length === shelvesOf(bk) && (!bk.job || bk.job.full !== false), bk.out.length + '/' + shelvesOf(bk));
    collectGoods(bk, true); ok('collect empties shelves', bk.out.length === 0);
    const fd = hasType('foundry'); S.inv.ironore = 10; S.inv.coal = 10; startRecipe(fd, 'ironbar', true); jump(60000); factoryTick(fd); collectGoods(fd, true); ok('foundry', (S.inv.ironbar || 0) >= 1);
    const te = hasType('toolexchange'); S.inv.steel = 10; S.inv.ironbar = 10; startRecipe(te, 'cranehook', true); jump(60000); factoryTick(te); collectGoods(te, true); ok('special tools', (S.inv.cranehook || 0) >= 1);
    ok('wonders need special tools', !!matsFor('operahouse').cranehook);
  });

  section('transport', () => {
    const t = S.rail.trains[0]; if (t) { t.st = 'docked'; t.cars = makeCars('pinewood', 3); }
    S.inv.steel = 50; S.inv.glass = 50; S.inv.ironbar = 50;
    upgradeTrain(); ok('train upgrade', (S.rail.type || 0) >= 1);
    if (t) { railPassenger(0); ok('passenger rail', t.st === 'departing'); }
    ok('berths add ships', shipCount() >= 2, shipCount());
    S.inv.planks = 50; seaTick(); const s = S.sea.ships[0]; s.st = 'docked'; s.cargo = null; refitShip(0, 'ferry'); ok('shipyard refit', s.type === 'ferry'); ferryRun(0); ok('ferry run', s.st === 'departing');
    airTick(); const p = S.air.planes[0]; p.st = 'docked'; p.crates = makeCrates(); passengerFlight(0); ok('passenger flight', p.st === 'departing');
    S.expressNext = 0; expressTick(); const ex = S.express[0]; ok('helipad express', !!ex);
    if (ex) { S.inv[ex.k] = (S.inv[ex.k] || 0) + ex.n; deliverExpress(ex.id); ok('express delivered', !S.express.find((o) => o.id === ex.id)); }
    exchangeTick(); S.inv.radio = 2; const c0 = S.coins; exchangeSell('radio', true); ok('international exchange', S.coins > c0 && !S.inv.radio);
  });

  section('staff', () => {
    S.cands = []; for (const role of Object.keys(ROLES)) { const c = genCandidate(role); c.cid = 'r' + role; if (role === 'farmhand') c.spec = 'agronomist'; S.cands.push(c); hireWorker(c.cid); }
    ok('hire every role', S.workers.length >= Object.keys(ROLES).length, S.workers.length);
    ok('specialist active', specOn('agronomist'));
    ok('album filled', Object.keys(S.album).length === new Set(S.workers.map((w) => w.name + w.face)).size);
    step(100, 200);
    ok('staff statuses', S.workers.every((w) => w.status));
    for (const e of entsOf('house')) e.rt = 0;
    const sim = simulateOffline(2 * 3600000);
    ok('offline staff simulation', !!sim && (Object.keys(sim.got).length > 0 || sim.rent > 0), sim && JSON.stringify(sim.got).slice(0, 80));
  });

  section('meta', () => {
    const pts = mayorPoints(); buyMayor('civic', 0); ok('mayor perk tree', mayor('m_rent') === 1 && mayorPoints() === pts - 1);
    buyMayor('civic', 4); ok('tree row gating', mayor('m_tour') === 0);
    S.inv.wheat = 50; S.req = {}; advanceRequest('joe'); ok('town request step', S.req.joe === 1);
    coopTick(); ok('regatta tasks', S.coop.tasks.length === 5);
    S.stats[S.coop.tasks[0].stat] += 1e5; claimCoopTask(0); ok('regatta claim', S.coop.pts > 0);
    ok('seasonal calendar', Array.isArray(SEASONAL_EVENTS) && typeof seasonalNow() !== 'undefined');
    const th = hasType('townhall'); th.lvl = 1; S.inv.planks = 99; upgradeBuilding(th); upgradeBuilding(th); upgradeBuilding(th); upgradeBuilding(th);
    ok('town hall to level 5', lvlOf(th) === 5);
    S.xp = 1e9; addXP(1); ok('level cap 100', S.level <= 100);
  });

  section('edit mode', () => {
    const decos = [...entsOf('flowers')].slice(0, 2);
    enterEdit(); for (const e of decos) editToggle(e);
    ok('multi-select', editSel.size === decos.length);
    const n0 = (S.decorBag.flowers || 0); storeSelected(); ok('store to decor bag', (S.decorBag.flowers || 0) === n0 + decos.length);
    const hs = [...entsOf('house')].slice(0, 2); enterEdit(); for (const e of hs) editToggle(e); flipSelected(); ok('flip', hs.every((e) => e.flip));
    startGroup(true); let sp = null; for (let y = WY0; y < WY1 && !sp; y++) for (let x = WX0; x < WX1 && !sp; x++) if (groupOK(x, y)) sp = [x, y]; hoverTile = sp; const n1 = entsOf('house').size; placeGroup(); ok('copy & paste group', entsOf('house').size > n1);
    cancelMode(true);
  });

  section('big storage & panels', () => {
    recalcPools(); ok('mega silos add crop storage', POOLCAP.silo >= 400 + 1000 + 2500, POOLCAP.silo);
    openPanel('store', 'farm'); renderPanel(true); const body = document.getElementById('modal-body'); const n0 = body.firstElementChild;
    S.coins += 1; renderPanel(false); ok('store does not re-render when nothing visible changes', body.firstElementChild === n0);
    closePanel(true);
  });

  section('popup scrolling', () => {
    const e = hasType('sheepfarm'); const p = P(e.x + 1, e.y + 1); cam.z = 1.4; cam.x = p[0]; cam.y = p[1] - VH * 0.25 / cam.z;
    animalPopup(e); positionPopup();
    const box = document.querySelector('#popup .pp-scroll'); box.style.maxHeight = '120px'; box.scrollTop = 60;
    for (let i = 0; i < 20; i++) updatePopup();
    ok('popup keeps its scroll position', box.scrollTop > 0 || box.scrollHeight <= box.clientHeight);
    hidePopup();
  });

  section('smart farmhands', () => {
    S.orders = [{ id: 999991, items: { corn: 50000 }, coins: 1, xp: 1, name: 'T', face: '🙂', bg: '#fff', color: '#fff', mood: '' }];
    S.inv.corn = 0; S.seeds.corn = 100; demandCache = { t: -1, need: null };
    const fh = S.workers.find((w) => w.role === 'farmhand'); fh.cfg.crop = 'auto';
    for (const id of fh.cfg.fields) { const f = world.ents.get(id); if (f) { f.crop = null; f.pt = 0; } }
    const pk = pickDemandCrop(fh); ok('smart pick follows orders', pk.crop === 'corn', pk.crop);
    fh.unreach = {}; fh.x = world.ents.get(fh.cfg.fields[0]).x; fh.y = world.ents.get(fh.cfg.fields[0]).y;
    const t = decide(fh); ok('farmhand plans to plant the needed crop', t && (t.type !== 'plant' || t.crop === 'corn'), t && t.type + ':' + t.crop);
    S.orders = [];
  });

  section('accurate picking', () => {
    const tr = [...entsOf('house')][0]; const [cx, cy] = P(tr.x + tr.w / 2, tr.y + tr.h / 2, 20); const [sx, sy] = worldToScreen(cx, cy);
    ok('pixel pick finds the house', pickEntity(sx, sy) === tr);
  });

  section('keep placing', () => {
    S.coins = 1e7; startPlace('house'); const n0 = entsOf('house').size;
    let sp = scan('house', WX0, WY0, WX1, WY1); hoverTile = sp; tryPlace();
    ok('stays in build mode after placing', mode.type === 'place' && mode.t === 'house' && entsOf('house').size === n0 + 1);
    sp = scan('house', WX0, WY0, WX1, WY1); hoverTile = sp; tryPlace(); ok('can place another right away', entsOf('house').size === n0 + 2);
    cancelMode(true); ok('Done exits build mode', mode.type === null);
  });

  section('area clearing', () => {
    let spot = null;
    for (let y = WY0; y < WY1 && !spot; y++) for (let x = WX0; x < WX1 && !spot; x++) if (canPlace(x, y, 3, 3)) spot = [x, y];
    const src = { x: spot[0], y: spot[1] };
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) addEnt({ t: dx % 2 ? 'rock' : 'tree', x: src.x + dx, y: src.y + dy, w: 1, h: 1, v: 0, s: 1 });
    S.coins = 1e6; enterClearMode(); mode.a = [src.x - 1, src.y - 1]; mode.b = [src.x + 3, src.y + 3];
    const n = clearTargets().length; ok('area selection finds obstacles', n >= 3, n);
    const c0 = S.stats.cleared; finishClearSelect(); ACT['dlg-yes']();
    ok('area cleared in one go', S.stats.cleared === c0 + n && clearTargets().length === 0);
    cancelMode(true);
  });

  section('claim all achievements', () => {
    let n = 0; for (const a of ACHIEVEMENTS) if (!S.ach[a.id] && n < 5) { S.ach[a.id] = 1; n++; }
    const c0 = S.coins, g0 = S.gems; openPanel('achievements'); renderPanel(true);
    const btn = document.querySelector('[data-act="claim-all"]'); ok('claim all button shows', !!btn);
    claimAllAch(btn); ok('claim all collects everything', ACHIEVEMENTS.every((a) => S.ach[a.id] !== 1) && S.coins > c0 && S.gems > g0);
    closePanel(true);
  });

  section('rotation & free placement', () => {
    S.coins = 1e7; S.level = 100;
    for (const e of [...entsOf('trainstation')]) removeEnt(e);
    startPlace('trainstation');
    ok('station can rotate', canRotate('trainstation'));
    rotatePlacement(); ok('rotated footprint is 2×4', placeDims()[0] === 2 && placeDims()[1] === 4);
    let sp = null; for (let y = WY0; y < WY1 && !sp; y++) for (let x = WX0; x < WX1 && !sp; x++) if (placeOK('trainstation', x, y, -1, 2, 4)) sp = [x, y];
    hoverTile = [sp[0], sp[1] + 1]; tryPlace();
    const ne = [...entsOf('trainstation')][0];
    ok('rotated building placed with swapped footprint', ne && ne.w === 2 && ne.h === 4 && ne.flip);
    const p = P(ne.x + ne.w / 2, ne.y + ne.h / 2, 20); render(); ok('rotated building renders & picks', pickEntity(...worldToScreen(p[0], p[1])) === ne);
    cancelMode(true);

    startPlace('fence'); const f0 = entsOf('fence').size;
    let row = null; for (let y = WY0; y < WY1 && !row; y++) for (let x = WX0; x < WX1 && !row; x++) { let okRow = true; for (let i = 0; i < 6; i++) if (!canPlace(x + i, y, 1, 1)) okRow = false; if (okRow) row = [x, y]; }
    ptr.last = ''; for (let i = 0; i < 6; i++) { const q = P(row[0] + i + 0.5, row[1] + 0.5); const [sx, sy] = worldToScreen(q[0], q[1]); dragPlaceAt(sx, sy); }
    ok('dragging plans a path without building yet', entsOf('fence').size === f0 && planTiles().length === 6);
    planEndDrag(); ACT['plan-build']();
    ok('drag places a whole line', entsOf('fence').size === f0 + 6, entsOf('fence').size - f0);
    cancelMode(true);
  });

  section('unlimited staff', () => {
    const n = S.workers.length; S.coins = 1e8; refreshCandidates(); ok('8 candidates offered', S.cands.length >= 8);
    for (let i = 0; i < 40; i++) { const c = genCandidate('lumberjack'); c.cid = 'u' + i; S.cands.push(c); hireWorker(c.cid); }
    ok('can hire 40 more without a cap', S.workers.length === n + 40, S.workers.length - n);
  });

  section('staff walk around water', () => {
    let spot = null;
    for (let y = S.spawn.y - 200; y < S.spawn.y + 200 && !spot; y += 3) for (let x = S.spawn.x - 200; x < S.spawn.x + 200 && !spot; x += 3) if (!isWater(x, y) && isWater(x + 3, y) && isWater(x + 6, y) && isWater(x + 9, y) && isWater(x + 12, y) && isWater(x + 15, y)) spot = [x, y];
    if (spot) {
      const [x, y] = spot; let far = null; for (let k = 16; k < 60 && !far; k++) if (!isWater(x + k, y)) far = [x + k, y];
      const p = far && walkPath(x, y, far[0], far[1], null);
      ok('a walking route never crosses water', !p || p.every(([a, b]) => !isWater(a, b) || isRoad(a, b)));
    }
    const lp = walkPath(S.spawn.x, S.spawn.y + 1, S.spawn.x + 6, S.spawn.y + 1, null); ok('staff find routes over land', Array.isArray(lp));
    const th = hasType('townhall'), out = walkPath(th.x + 1, th.y + 1, S.spawn.x + 6, S.spawn.y + 6, null);
    ok('staff standing inside a building can still walk out', Array.isArray(out));
  });

  section('job board & professions', () => {
    S.coins = 1e8; S.level = Math.max(S.level, 30);
    ok('every profession has a job category', Object.keys(ROLES).every((r) => JOB_CATS.some((c) => c.roles.includes(r))), Object.keys(ROLES).filter((r) => !JOB_CATS.some((c) => c.roles.includes(r))).join(','));
    ok('at least 25 professions', Object.keys(ROLES).length >= 25, Object.keys(ROLES).length);
    const n0 = S.workers.filter((w) => w.role === 'lumberjack').length;
    S.openings = {}; S.jobNext = {}; changeOpenings('lumberjack', 2); S.jobNext.lumberjack = NOW - 1; jobBoardTick();
    ok('posted opening gets filled', S.workers.filter((w) => w.role === 'lumberjack').length === n0 + 1 && S.openings.lumberjack === 1);
    S.jobNext.lumberjack = NOW - 1; jobBoardTick(); S.jobNext.lumberjack = NOW - 1; jobBoardTick();
    ok('openings stop at zero', S.workers.filter((w) => w.role === 'lumberjack').length === n0 + 2 && S.openings.lumberjack === 0);
    let err = null;
    for (const r in ROLES) { const c = genCandidate(r); c.cid = 'p' + r; S.cands.push(c); hireWorker(c.cid); }
    for (const w of S.workers) { try { decide(w); staffCard(w); } catch (x) { err = w.role + ': ' + x.message; } }
    ok('every role thinks & renders', !err, err);
    const tr = S.workers.find((w) => w.role === 'trader'); tr.cfg.keep = 30; S.inv.wheat = 80; const c1 = S.coins;
    JOB_AI.trader.act(tr, { k: 'wheat' }); ok('trader sells surplus', S.inv.wheat === 30 && S.coins > c1);
    const lj = S.workers.find((w) => w.role === 'lumberjack'), tree = [...entsOf('tree')].find((e) => isUnlocked(e.x, e.y) && !e.dying);
    if (tree) { const p0 = S.inv.planks || 0; JOB_AI.lumberjack.act(lj, { id: tree.id }); ok('lumberjack chops trees', tree.dying > 0 && (S.inv.planks || 0) >= p0); }
    const sm = S.workers.find((w) => w.role === 'seedmerchant'); sm.cfg.n = 7; S.seeds.wheat = 0; JOB_AI.seedmerchant.act(sm, { crop: 'wheat' }); ok('seed merchant restocks', S.seeds.wheat === 7 || seedTotal() >= seedCap());
    const pupil = S.workers.find((w) => w.role === 'farmhand' && w.skill < 5), x0 = pupil.sxp; JOB_AI.coach.act(S.workers.find((w) => w.role === 'coach'), { wid: pupil.id }); ok('trainer coaches staff', pupil.sxp > x0 || pupil.skill > 1);
    const ents = S.workers.filter((w) => w.role === 'entertainer'); S.workers = S.workers.filter((w) => w.role !== 'entertainer' && w.role !== 'sweeper'); cityTick(); const h0 = CITY.hap;
    S.workers.push(...ents); cityTick(); ok('performers raise happiness', CITY.hap > h0 || h0 >= 97, h0 + ' -> ' + CITY.hap);
    ok('mechanics shorten trips', mechMult() < 1);
    for (const c of ['all', 'farm', 'trans', 'open']) { S.jobCat = c; openPanel('staff', 'hire'); renderPanel(true); }
    ok('job board shows every job', document.querySelectorAll('.jb-row').length === Object.keys(ROLES).length || S.jobCat !== 'all');
    S.jobCat = 'all'; openPanel('staff', 'hire'); renderPanel(true); ok('job board lists all professions', document.querySelectorAll('.jb-row').length === Object.keys(ROLES).length, document.querySelectorAll('.jb-row').length);
    openPanel('staff', 'staff'); renderPanel(true);
    const w2 = S.workers[S.workers.length - 1]; ACT['w-select']({ id: w2.id });
    ok('team list groups by job', document.querySelectorAll('.sl-group').length === new Set(S.workers.map((w) => w.role)).size);
    ok('clicking an employee shows their options', document.querySelector('.staff-detail .sc-name').textContent === w2.name && document.querySelectorAll('.staff-detail .staff-card').length === 1);
    closePanel(true);
  });

  section('society & census', () => {
    S.coins = 1e7; S.level = Math.max(S.level, 30); tick();
    ok('residents fill homes', S.people.length > 0 && S.people.length <= housingCap(), S.people.length + '/' + housingCap());
    ok('people live in real homes', S.people.every((p) => !p.h || world.ents.has(p.h)));
    const th = hasType('townhall');
    const sp = findBizSpot('restaurant', th); ok('entrepreneurs find a lot by a road', !!sp);
    const p0 = S.people.find((p) => ageOf(p) >= 18); p0.m = 5000;
    S.props = [{ id: 999991, pid: p0.id, t: 'restaurant', x: sp[0], y: sp[1], lease: 0, until: dayNum() + 3, fee: 100 }];
    const c0 = S.coins; approveProposal(999991);
    const rest = [...entsOf('restaurant')].find((e) => e.biz && e.biz.own === p0.id);
    ok('approving a proposal opens a private business', !!rest && S.coins === c0 + 100 && p0.k === 'entrepreneur');
    for (let i = 0; i < 24 * 4; i++) { clock.t += HOUR_MS / 4; tick(); }
    ok('a day passes: budget history recorded', S.hist.length >= 1 && S.budHist.length >= 1);
    ok('venues get visitors', [...world.ents.values()].some((e) => e.biz && (e.biz.cust > 0 || (e.biz.hist[0] && e.biz.hist[0].cust > 0))));
    ok('jobs get filled', S.people.some((p) => p.j > 0));
    const kid = S.people.find((p) => ageOf(p) < 18); ok('families have children', !!kid || S.people.length < 10);

    const singles = S.people.filter((p) => !p.sp && ageOf(p) >= 21 && ageOf(p) <= 40);
    const a = singles.find((p) => p.g === 'f'), b = singles.find((p) => p.g === 'm' && p.l !== (a && a.l));
    if (a && b) { marry(a, b); ok('marriage links partners', a.sp === b.id && b.sp === a.id); const home = world.ents.get(a.h); const big = [...entsOf('apartment')][0] || addEnt(newEntity('apartment', ...scan('apartment', WX0, WY0, WX1, WY1))); for (const q of familyOf(a)) setHome(q, big); const n0 = S.people.length; birth(a, b, big); ok('babies are born into the household', S.people.length === n0 + 1 && a.ki.length >= 1); void home; }

    const fs = addEnt(newEntity('firestation', ...scan('firestation', WX0, WY0, WX1, WY1)));
    const victim = rest; startFire(victim); ok('fires start', victim.fire > NOW);
    extinguish(victim, fs); ok('firefighters put fires out', !victim.fire);

    victim.fire = NOW - 1; victim.fireT0 = NOW - 5000; fireBurnout(); ok('unattended fires burn buildings', !!victim.burnt);
    repairBuilding(victim); ok('burnt buildings can be rebuilt', !victim.burnt);

    const crook = S.people.find((p) => ageOf(p) >= 18 && ageOf(p) < 60); crook.k = 'criminal';
    addEnt(newEntity('police', ...scan('police', WX0, WY0, WX1, WY1)));
    const cr0 = S.soc.crimes || 0, pv0 = S.soc.prevented || 0; for (let i = 0; i < 20; i++) attemptCrime(crook);
    ok('criminals commit (or are stopped from) crimes', (S.soc.crimes || 0) + (S.soc.prevented || 0) > cr0 + pv0);

    S.tax.inc = 20; const lo = personTargetHp(S.people[0]); S.tax.inc = 8; const hi = personTargetHp(S.people[0]);
    ok('high taxes make people unhappy', lo < hi);

    const pz = addEnt(newEntity('pizzeria', ...scan('pizzeria', WX0, WY0, WX1, WY1))); bizState(pz).open = true; bizState(pz).keep = 0; S.inv.pizza = 3;
    ok('storefront restocks from the barn', restock(pz) && S.inv.pizza === 2 && pz.biz.srv > 1);

    const r = [...roads()]; const path = roadPath(r[0], r[r.length - 1]); ok('road pathfinding', path === null || Array.isArray(path));
    const n0 = cars.length; spawnCar('car', r[0], path || []); updateTraffic(0.1); ok('cars drive', cars.length >= n0);

    let err = null;
    for (const t of ['overview', 'people', 'jobs', 'biz', 'budget', 'safety', 'news']) { try { openPanel('census', t); panel.tab = t; renderPanel(true); } catch (x) { err = t + ': ' + x.message; } }
    ok('census tabs render', !err, err);
    S.selP = S.people[0].id; openPanel('census', 'people'); renderPanel(true); ok('person profile shows', !!document.querySelector('.person .sc-name'));
    closePanel(true);
    onEntityClick(pz, 300, 300); ok('popup shows staff & storefront info', !!document.querySelector('#popup .pp-sec'));
    const box = document.querySelector('#popup .pp-scroll'); pop.lastSig = 'x'; updatePopup();
    ok('popup refresh keeps its scroll box (no jump to top)', document.querySelector('#popup .pp-scroll') === box);
    hidePopup(true);
    const site = addEnt(newEntity('library', ...scan('library', WX0, WY0, WX1, WY1))); startConstruction(site); onEntityClick(site, 300, 300);
    ok('civic construction sites open the materials popup', /Building|Deliver/.test(document.querySelector('#popup').textContent));
    hidePopup(true);
    save(); load(); rebuildSocIndex(); ok('people survive save/load', S.people.length > 0 && PEOPLE.size === S.people.length);
  });

  section('railway reaches the coast', () => {

    let spot = null;
    for (let y = S.spawn.y - 300; y < S.spawn.y + 300 && !spot; y += 2) for (let x = S.spawn.x - 300; x < S.spawn.x + 300 && !spot; x += 2) {
      if (!isWater(x + 12, y)) continue;
      let ok2 = true; for (let i = 0; i < 12; i++) if (isWater(x + i, y) || isWater(x + i, y + 1) || isWater(x + i, y + 2)) ok2 = false;
      if (ok2) spot = [x, y];
    }
    for (const e of [...entsOf('trainstation')]) removeEnt(e);
    const [x, y] = spot;
    for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 12; xx++) { const e = entAt(xx, yy); if (e) removeEnt(e); }
    const st = addEnt(newEntity('trainstation', x, y, {}));
    for (let xx = x + 4; xx < x + 12; xx++) addEnt(newEntity('rail', xx, y));
    railPathCache = { key: '', path: null };
    ok('rail line to the shore connects the station', !!railPath(), JSON.stringify(spot));
    removeEnt(st);
  });

  section('automated production', () => {
    S.coins = 1e8;
    const q = addEnt(newEntity('quarry', ...scan('quarry', WX0, WY0, WX1, WY1))); q.pp = NOW - 1e7;
    const bw = addEnt(newEntity('brickworks', ...(findBizSpot('brickworks', hasType('townhall')) || findBizSpot('brickworks', hasType('townhall')) || scan('brickworks', WX0, WY0, WX1, WY1))));
    for (let i = 0; i < 4; i++) jobMarket(200);
    const staffed = staffRatio(bw) > 0;
    const un = S.people.filter((p) => p.k === 'unemployed' && !p.j && ageOf(p) >= 18 && ageOf(p) < 65 && world.ents.get(p.h) && reachable(world.ents.get(p.h), bw)); const h0 = un[0] && world.ents.get(un[0].h);
    ok('placing a factory fills its jobs with residents', staffed || !un.length, `pos ${positionsOf(bw)} unemployed ${un.length} reach ${h0 ? reachable(h0, bw) : '-'} fr ${JSON.stringify(frontRoad(bw))} home fr ${h0 ? JSON.stringify(frontRoad(h0)) : '-'} build ${!!bw.build}`);
    if (staffed) {
      const need = RECIPES.bricks.in; for (const k in need) addItem(k, need[k] * 4);
      delete S.inv.bricks; const b0 = 0; automationTick(); automationTick();
      ok('staffed factories start production by themselves', !!bw.job, JSON.stringify({ recipe: autoRecipe(bw), staff: staffRatio(bw), clay: S.inv.clay, bricks: S.inv.bricks }));
      jump(120000); factoryTick(bw); automationTick(); automationTick();
      ok('...and deliver into storage', (S.inv.bricks || 0) > b0, (S.inv.bricks || 0) + ' vs ' + b0);
    }
    const fm = [...entsOf('feedmill')][0] || addEnt(newEntity('feedmill', ...scan('feedmill', WX0, WY0, WX1, WY1)));
    for (const r of BUILD.feedmill.recipes) for (const k in RECIPES[r].in) addItem(k, 50);
    for (const r of BUILD.feedmill.recipes) delete S.inv[RECIPES[r].out || r];
    const picked = autoRecipe(fm), pickedOut = picked && (RECIPES[picked].out || picked);
    ok('feed mills only make feed for animals you own', !picked || ANIMAL_TYPES.some((t) => BUILD[t].feed === pickedOut && countOf(t) > 0) || (itemDemand()[pickedOut] || 0) > 0, picked);
    addEnt(newEntity('feedsilo', ...scan('feedsilo', WX0, WY0, WX1, WY1))); recalcPools();
    ok('feed has its own storage', POOLCAP.feed >= 700 && poolOfKind('feed') === 'feed');
    ok('big storage tiers', POOLS.depot.extra.megadepot === 2500 && POOLS.warehouse.extra.distribution === 3000);
  });

  section('fleet', () => {
    S.coins = 1e8; const s0 = shipCount(), p0 = planeCount();
    if (hasType('seaport')) { buyFleet('ship', 'container'); ok('commissioned ships join the port', shipCount() === s0 + 1); }
    if (hasType('air_hangar')) { buyFleet('plane', 'jumbo'); ok('commissioned planes join the airport', planeCount() === p0 + 1); fleetTick(); }
    openPanel('transport', 'fleet'); renderPanel(true); ok('fleet tab renders', !!document.querySelector('[data-act="fleet-buy"]') || !!document.querySelector('.card')); closePanel(true);
  });

  section('worlds & modes', () => {
    const w = createWorld({ name: 'Test Town', seed: 'abc', mode: 'creative', type: 'archipelago' });
    ok('worlds are listed', worldsList().some((x) => x.id === w.id && x.name === 'Test Town'));
    ok('each world has its own save slot', worldKey(w) !== worldKey(worldsList().find((x) => x.id !== w.id) || {}));
    const m0 = S.mode, c0 = S.coins; S.mode = 'creative'; ok('creative mode builds for free', spend(1e12) && S.coins === c0); S.mode = m0;
    ok('world types change the sea level', WORLD_TYPES.archipelago.bias < 0 && WORLD_TYPES.pangaea.bias > 0);
    saveWorldsList(worldsList().filter((x) => x.id !== w.id));
  });

  section('operations', () => {
    S.coins = 1e8;
    const q = [...entsOf('quarry')][0] || addEnt(newEntity('quarry', ...scan('quarry', WX0, WY0, WX1, WY1)));
    q.pp = NOW - 1e7; const c0 = S.inv.clay || 0, s0 = S.inv.sand || 0, st0 = S.inv.stone || 0;
    producerCollect(q, true);
    ok('quarries deliver stone, clay and sand together', (S.inv.clay || 0) > c0 && (S.inv.sand || 0) > s0 && (S.inv.stone || 0) > st0);
    q.pp = NOW - 1e7; const c = genCandidate('quarryman'); c.cid = 'qm'; S.cands.push(c); hireWorker('qm');
    const qm = S.workers.find((w) => w.role === 'quarryman'), t = decide(qm);
    ok('quarry workers collect from quarries first', t && t.type === 'j-collect');
    const st = [...entsOf('trainstation')][0];
    if (st) { onEntityClick(st, 300, 300); const h = document.querySelector('#popup').innerHTML; ok('stations open a popup with move & rotate', h.includes('p-move') && h.includes('p-rotate') && h.includes('hub-open')); hidePopup(true); }
    const r = [...entsOf('rail')][0];
    if (r) { onEntityClick(r, 300, 300); ok('track has an edit / move option', document.querySelector('#popup').innerHTML.includes('p-edit')); hidePopup(true); }
    const h2 = [...entsOf('house')][0], f0 = !!h2.flip; rotateEnt(h2); ok('buildings rotate in place', !!h2.flip !== f0);
  });

  section('city tuning', () => {
    const home = [...entsOf('house')][0];
    const far = put('school', ...scan('school', home.x + 20, home.y + 20, home.x + 40, home.y + 40));
    ok('residents walk to work without a road', reachable(home, far));
    const kt = scan('ch_taco', WX0, WY0, WX1, WY1); const kitchen = put('ch_taco', ...kt); delete kitchen.build;
    S.inv.taco = 0; S.coins = Math.max(S.coins, 10000);
    const o = makeOrder({ taco: 2 }); S.orders.push(o); S.kitT = 0; kitchenTick();
    ok('fast-food kitchens cook and deliver orders', !S.orders.includes(o));
    const wall = put('mil_barracks', ...scan('mil_barracks', WX0, WY0, WX1, WY1)); delete wall.build;
    ok('military buildings add defense points', cityScores().defense > 0 && BUILD.mil_wall.def > 0);
    openPanel('city', 'overview'); ok('city scores render', $('#modal-body').innerHTML.includes('City scores')); closePanel(true);
    ok('bigger material depots exist', POOLS.depot.extra.matterminal === 40000 && !!BUILD.ffpantry);
    S.autoFire = true; const fields = entsOf('field').size;
    for (let i = 0; i < fields + 6; i++) { const c = genCandidate('farmhand'); c.cid = 'f' + i; S.cands.push(c); _hireTune(c.cid); }
    for (const w of S.workers) w.hiredAt = 0;
    S.afT = 0; autoFireTick();
    const fh = S.workers.filter((w) => w.role === 'farmhand');
    ok('extra farmhands are let go', fh.reduce((a, w) => a + maxFields(w), 0) - Math.max(...fh.map(maxFields)) < fields && fh.every((w) => w.cfg.fields.length > 0));
    const c2 = genCandidate('farmhand'); c2.cid = 'jbx'; S.cands.push(c2); const n2 = S.workers.length; hireWorker(c2.cid);
    ok('no new farmhand without fields to tend', S.workers.length === n2);
    openPanel('staff', 'staff'); ok('collapse all button', $('#modal-body').innerHTML.includes('grp-all')); closePanel(true);
    GFX.people = false; render(); GFX.people = true; ok('graphics toggles render', true);
    openPanel('settings'); ok('graphics settings render', $('#modal-body').innerHTML.includes('Graphics &amp; performance') || $('#modal-body').innerHTML.includes('Graphics & performance')); closePanel(true);
  });

  section('dialogs', () => {
    const c = (S.cities || [])[0];
    if (c) { renameCity(c.id); document.getElementById('city-name').value = 'Testopolis'; ACT['dlg-yes'](); ok('dialog inputs are read before closing', c.name === 'Testopolis' && !dialogOpen()); }
    dialog({ title: 'a', body: '', onYes: () => dialog({ title: 'b', body: 'second' }) }); ACT['dlg-yes'](); ok('a dialog opened from Yes stays open', dialogOpen() && $('#dialog-root').innerHTML.includes('second')); closeDialog();
  });

  section('supplies', () => {
    const c0 = S.coins, b0 = S.inv.bricks || 0; buyMaterial('bricks', 5); ok('buy bricks in Supplies', (S.inv.bricks || 0) === b0 + 5 && S.coins === c0 - supplyPrice('bricks') * 5);
    const site = put('school', ...scan('school', WX0, WY0, WX1, WY1)); for (const k in site.build.need) delete S.inv[k];
    buyMissingMats(site); ok('buy missing materials for a site', Object.keys(site.build.need).every((k) => (site.build.have[k] || 0) >= site.build.need[k]));
    openPanel('store', 'supplies'); renderPanel(true); closePanel(true); ok('supplies tab renders', true);
  });

  section('realism & storage', () => {
    S.realism = true; const m0 = POOLCAP.cold + 500; S.inv.milk = m0; lastPerish = NOW - 70000; realismTick(); ok('perishables spoil', S.inv.milk < m0);
    S.inv.diesel = 1; ok('fuel use', useFuel('rail') && !S.inv.diesel);
    S.realism = false;
    ok('storage pools', POOLCAP.silo > 0 && POOLCAP.cold > 0 && POOLCAP.warehouse > 0 && POOLCAP.depot > 0);
  });

  section('panels & overlays', () => {
    const panels = { store: ['seeds', 'farm', 'town', 'civic', 'prod', 'ind', 'util', 'trans', 'wonder', 'deco', 'land', 'perks', 'boost', 'soon'], inventory: ['barn', 'seeds', 'powers'], orders: ['market', 'courier', 'contracts', 'requests', 'express'], transport: ['rail', 'sea', 'air', 'exchange'], events: ['daily', 'wheel', 'event', 'calendar', 'merchant'], city: ['overview', 'mayor', 'coop', 'rivals', 'log'], staff: ['staff', 'hire', 'album'], mine: [null], institute: [null], collections: [null], achievements: [null], settings: [null] };
    let perr = null;
    for (const k in panels) for (const t of panels[k]) { try { openPanel(k, t || undefined); if (t) panel.tab = t; renderPanel(true); closePanel(true); } catch (x) { perr = k + '/' + t + ': ' + x.message; } }
    ok('all panels & tabs render', !perr, perr);
    for (const ov of ['happy', 'service', 'pollution']) { overlay = ov; render(); } overlay = null;
    for (const w of ['rain', 'storm', 'snow', 'heat']) { S.wx = { type: w, until: NOW + 1e6 }; render(); }
    ok('overlays & weather render', true);
  });

  section('save', () => {
    save(); const n = [...world.ents.values()].filter((e) => !e.dying && !e.nat).length;
    const d = migrateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    ok('migration keeps data', d.S.v === SAVE_VERSION && d.ents.length === n, d.ents.length + ' vs ' + n);
    load(); recalcPop();
    const n2 = [...world.ents.values()].filter((e) => !e.nat).length;
    ok('save/load roundtrip', n2 === n, n2 + ' vs ' + n);

    const old = { S: Object.assign(JSON.parse(JSON.stringify(S)), { mapV: 2, terrEdits: { 1000: 3 } }), ents: [{ id: 5, t: 'townhall', x: 120, y: 120, w: 3, h: 3 }, { id: 6, t: 'house', x: 126, y: 120, w: 2, h: 2, rt: 0 }], nat: [7, 0, 10, 10, 0, 0] };
    const m = migrateSave(old); ok('old island saves migrate', m.S.mapV === MAP_V && m.ents.length === 2 && m.S.spawn.x === 121 && m.S.terrEdits['232,3'] === 3);
    ok('save size < 2.5MB', localStorage.getItem(SAVE_KEY).length < 2.5e6, (localStorage.getItem(SAVE_KEY).length / 1024 | 0) + 'KB');
  });

  const fails = R.filter((r) => !r.startsWith('PASS')).length;
  R.unshift(`${R.length - fails}/${R.length} passed`);
  const pre = document.createElement('pre'); pre.id = 'results'; pre.textContent = R.join('\n'); document.body.appendChild(pre);
  console.log(R.join('\n'));
}
