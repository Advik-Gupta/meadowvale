window.addEventListener('load', () => setTimeout(runBalance, 300));

function runBalance() {
  closeDialog(); closeDialog();
  const rows = ['minute | level | coins | pop/cap | earned | served | harvested'];
  const jump = (ms) => { clock.t += ms; advanceClock(); };
  const SIM_MIN = 120, STEP = 2000;
  for (let t = 0; t <= SIM_MIN * 60000; t += STEP) {
    jump(STEP);

    const crops = Object.keys(CROPS).filter((k) => S.level >= CROPS[k].level).sort((a, b) => CROPS[b].price / CROPS[b].time - CROPS[a].price / CROPS[a].time);
    for (const f of entsOf('field')) {
      if (fieldReady(f)) harvestField(f, null, null, { quiet: true });
      if (!f.crop) { const c = crops.find((k) => (S.seeds[k] || 0) > 0) || crops.find((k) => S.coins >= CROPS[k].seed * 5); if (c) { if (!(S.seeds[c] > 0)) buySeeds(c, 5); plantField(f, c, true); } }
    }

    for (const o of [...S.orders]) if (canFulfill(o)) deliverOrder(o.id, null, true);
    for (const tp of HOUSE_TYPES) for (const e of entsOf(tp)) if (rentReady(e)) collectRent(e, true);

    if (barnFree() < 10) for (const k of Object.keys(S.inv)) if (ITEMS[k].kind === 'crop' && S.inv[k] > 10) sellItem(k, S.inv[k] - 10);

    if (S.coins > 400 && entsOf('field').size < 40) { const p = (() => { for (let y = 48; y < 80; y++) for (let x = 48; x < 80; x++) if (canPlace(x, y, 1, 1)) return [x, y]; })(); if (p) { const c = buildCost('field'); if (spend(c)) { addEnt(newEntity('field', p[0], p[1])); S.stats.fieldsBought++; } } }
    tick();
    if (t % 600000 === 0) rows.push(`${String(t / 60000).padStart(6)} | ${String(S.level).padStart(5)} | ${String(S.coins).padStart(6)} | ${POP}/${POPCAP} | ${String(S.stats.earned).padStart(6)} | ${String(S.stats.served).padStart(6)} | ${S.stats.harvested}`);
  }
  rows.push('', `After ${SIM_MIN} simulated minutes: level ${S.level}, ${entsOf('field').size} fields, ${S.stats.served} customers served.`);
  const pre = document.createElement('pre'); pre.id = 'results'; pre.textContent = rows.join('\n'); document.body.appendChild(pre);
}
