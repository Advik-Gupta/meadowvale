const DESTS = ['Pinewood', 'Harbor City', 'Ironvale', 'Sunnyside', 'Old Mill Town', 'Riverbend', 'Maple Grove', 'Lakeview'];
const COURIER_SLOTS = 6;

function courierTick() {
  if (!hasType('courier')) return;
  if (!S.courier) S.courier = [];
  while (S.courier.length < COURIER_SLOTS) S.courier.push({ o: null, cd: NOW + S.courier.length * 1500 });
  for (const s of S.courier) if (!s.o && NOW >= s.cd) s.o = makeCourierOrder();
}
function courierCooldown(base) { return base * (hasPerk('autoship') ? 0.5 : 1); }
function makeCourierOrder() {
  const avail = availableItems();
  let n = 1 + (Math.random() < 0.6 ? 1 : 0) + (S.level >= 6 && Math.random() < 0.4 ? 1 : 0);
  n = Math.min(n, avail.length);
  const pool = avail.slice(), items = {};
  while (Object.keys(items).length < n && pool.length) {
    const k = pool.splice(randi(pool.length), 1)[0];
    const kind = ITEMS[k].kind;
    items[k] = kind === 'good' ? 2 + randi(3) : kind === 'animal' ? 3 + randi(4) : 5 + randi(5 + S.level);
  }
  let value = 0, xp = 0;
  for (const k in items) { value += ITEMS[k].price * items[k]; xp += ITEMS[k].xp * items[k]; }
  return { id: S.orderSeq++, items, dest: pick(DESTS), coins: Math.round(value * (1.6 + Math.random() * 0.3) * (1 + POP / 300)), xp: Math.max(4, Math.round(xp * 1.6)) };
}
function deliverCourier(i, el, quiet) {
  const s = S.courier && S.courier[i]; if (!s || !s.o) return;
  if (!canFulfill(s.o)) {
    if (quiet) return;
    const miss = Object.entries(s.o.items).filter(([k, n]) => (S.inv[k] || 0) < n).map(([k, n]) => `${n - (S.inv[k] || 0)} ${ITEMS[k].icon}`).join(', ');
    toastOnce(`Still need: ${miss}`, 'warn'); sfx('error'); return;
  }
  for (const k in s.o.items) takeItem(k, s.o.items[k]);
  if (quiet) addCoins(s.o.coins);
  else { const r = el ? el.getBoundingClientRect() : { left: VW / 2, top: VH / 2, width: 0, height: 0 }; addCoins(s.o.coins, r.left + r.width / 2, r.top); }
  addXP(s.o.xp);
  S.stats.couriers++;
  if (!quiet) sfx('coin');
  toast(`🚚 Contract shipped to <b>${s.o.dest}</b>! +🪙${fmt(s.o.coins)} ⭐${s.o.xp}`, 'good');
  s.o = null; s.cd = NOW + courierCooldown(25000);
  spawnVan();
  renderPanel(true);
}
function skipCourier(i) {
  const s = S.courier && S.courier[i]; if (!s || !s.o) return;
  s.o = null; s.cd = NOW + courierCooldown(40000);
  sfx('close'); renderPanel(true);
}
function spawnVan() {
  const off = hasType('courier'), rs = roads();
  if (!off || !rs.length) return;
  let start = null, bd = 1e9;
  for (const r of rs) { const d = Math.abs(r.x - (off.x + 1)) + Math.abs(r.y - (off.y + 1)); if (d < bd) { bd = d; start = r; } }
  let dest = start, dd = -1;
  for (let k = 0; k < 14; k++) { const r = pick(rs); const d = Math.abs(r.x - start.x) + Math.abs(r.y - start.y); if (d > dd) { dd = d; dest = r; } }
  const path = bfs(start.x, start.y, dest.x, dest.y);
  walkers.push({ isW: true, kind: 'van', x: start.x, y: start.y, path: path || [], speed: 3.2, ph: 0, wait: 0.2, alpha: 0, ox: 0, oy: 0, dx: 1, dy: 0, color: pick(['#e74c3c', '#2e86de', '#27ae60', '#f39c12']), bubble: '📦', bubbleT: 3 });
  if (!path || !path.length) walkers[walkers.length - 1].fading = true;
}
function renderCourier() {
  if (!hasType('courier')) {
    const ok = S.level >= BUILD.courier.level;
    return `<div class="empty-state"><div class="es-ic">📮</div><div>Build a <b>Courier Office</b> to take on big regional delivery contracts.</div>
      <div class="sub">${ok ? 'Contracts pay ~60% more than market customers, and a van drives each one out of town!' : `Unlocks at level ${BUILD.courier.level}.`}</div>
      ${ok ? `<button class="btn green" data-act="buy" data-id="courier">Build · 🪙${BUILD.courier.cost}</button>` : ''}</div>`;
  }
  const cards = (S.courier || []).map((s, i) => {
    if (!s.o) return `<div class="order empty"><div class="wait-ic">🚚</div><div>New contract in <b class="cour-cd" data-i="${i}">…</b></div></div>`;
    const o = s.o, can = canFulfill(o);
    return `<div class="order courier ${can ? 'ready' : ''}">
      <div class="o-head"><div class="avatar" style="background:#cfe3ff">📦</div><div><div class="o-name">Ship to ${o.dest}</div><div class="o-sub">Regional contract #${o.id}</div></div></div>
      <div class="o-items">${Object.entries(o.items).map(([k, n]) => { const have = S.inv[k] || 0; return `<div class="o-item ${have >= n ? 'ok' : ''}" title="${ITEMS[k].name}"><span class="ic">${ITEMS[k].icon}</span><span class="cnt">${Math.min(have, n)}/${n}</span></div>`; }).join('')}</div>
      <div class="o-reward"><span>🪙 ${fmt(o.coins)}</span><span>⭐ ${o.xp}</span></div>
      <div class="o-btns"><button class="btn ${can ? 'green' : 'disabled'}" data-act="c-deliver" data-i="${i}">${can ? '🚚 Ship it' : 'Need items'}</button><button class="btn red small" data-act="c-skip" data-i="${i}" title="Discard contract">✕</button></div></div>`;
  }).join('');
  return `<div class="hint">Regional contracts are bigger and pay better. Each shipment is driven out of town by a delivery van.</div><div class="orders">${cards}</div>`;
}
function liveCourier() {
  document.querySelectorAll('.cour-cd').forEach((el) => { const s = S.courier && S.courier[+el.dataset.i]; if (s) el.textContent = fmtTime(Math.max(0, s.cd - NOW)); });
}
