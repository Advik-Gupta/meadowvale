const T_GRASS = 0, T_FOREST = 1, T_DIRT = 2, T_SAND = 3, T_SHALLOW = 4, T_DEEP = 5, T_SNOW = 6, T_STONE = 7;
const CH = 16;

const BIOMES = [
  { id: 'deep', name: 'Deep Ocean', icon: '🌊', t: T_DEEP },
  { id: 'ocean', name: 'Ocean', icon: '🌊', t: T_SHALLOW },
  { id: 'beach', name: 'Beach', icon: '🏖️', t: T_SAND, col: [238, 219, 160], palm: 0.03, rock: 0.01 },
  { id: 'plains', name: 'Plains', icon: '🌾', t: T_GRASS, col: [128, 199, 88], tree: 0.05, tv: [0, 0, 2], bush: 0.025, rock: 0.008 },
  { id: 'meadow', name: 'Flower Meadow', icon: '🌸', t: T_GRASS, col: [142, 206, 98], tree: 0.04, tv: [5, 0, 2], bush: 0.07, rock: 0.004 },
  { id: 'forest', name: 'Forest', icon: '🌳', t: T_FOREST, col: [96, 170, 72], tree: 0.3, tv: [0, 0, 0, 2, 1], bush: 0.04, rock: 0.01 },
  { id: 'autumn', name: 'Autumn Woods', icon: '🍂', t: T_FOREST, col: [138, 172, 74], tree: 0.28, tv: [3, 3, 0, 2], bush: 0.03, rock: 0.01 },
  { id: 'darkforest', name: 'Dark Forest', icon: '🌲', t: T_FOREST, col: [74, 146, 70], tree: 0.4, tv: [1, 1, 0], bush: 0.03, rock: 0.012 },
  { id: 'swamp', name: 'Swamp', icon: '🐸', t: T_FOREST, col: [98, 132, 74], tree: 0.18, tv: [1, 0], bush: 0.12, rock: 0.005 },
  { id: 'taiga', name: 'Taiga', icon: '🌲', t: T_FOREST, col: [88, 150, 104], tree: 0.3, tv: [1, 1, 6], bush: 0.02, rock: 0.02 },
  { id: 'tundra', name: 'Snowy Tundra', icon: '❄️', t: T_SNOW, col: [236, 243, 249], tree: 0.06, tv: [6], rock: 0.03 },
  { id: 'desert', name: 'Desert', icon: '🏜️', t: T_SAND, col: [236, 212, 148], palm: 0.006, rock: 0.02, bush: 0.012 },
  { id: 'savanna', name: 'Savanna', icon: '🦒', t: T_GRASS, col: [176, 182, 92], tree: 0.045, tv: [3, 2], bush: 0.05, rock: 0.01 },
  { id: 'jungle', name: 'Jungle', icon: '🌴', t: T_FOREST, col: [66, 168, 66], tree: 0.38, tv: [4, 0, 0, 4], bush: 0.12 },
  { id: 'mountains', name: 'Mountains', icon: '⛰️', t: T_STONE, col: [148, 148, 146], tree: 0.07, tv: [1], rock: 0.2 },
  { id: 'peaks', name: 'Snowy Peaks', icon: '🏔️', t: T_SNOW, col: [232, 238, 246], tree: 0.03, tv: [6], rock: 0.08 },
  { id: 'river', name: 'River', icon: '🏞️', t: T_SHALLOW },
  { id: 'lake', name: 'Lake', icon: '💧', t: T_SHALLOW },
  { id: 'badlands', name: 'Badlands', icon: '🏜️', t: T_DIRT, col: [206, 142, 92], rock: 0.05, bush: 0.02 },
];
const BIO = {}; BIOMES.forEach((b, i) => { BIO[b.id] = i; b.i = i; });
const LAND_COL = { [T_GRASS]: [126, 197, 88], [T_FOREST]: [94, 168, 72], [T_DIRT]: [199, 163, 107], [T_SAND]: [238, 219, 160], [T_SNOW]: [236, 243, 249], [T_STONE]: [150, 150, 150] };

let GEN = null;

function initGen(seed, sx, sy) {
  GEN = { seed, sx: sx || 0, sy: sy || 0,
    nC: makeNoise(seed + 11), nI: makeNoise(seed + 23), nD: makeNoise(seed + 37), nR: makeNoise(seed + 41), nR2: makeNoise(seed + 43),
    nL: makeNoise(seed + 59), nT: makeNoise(seed + 61), nH: makeNoise(seed + 73), nW: makeNoise(seed + 89), nF: makeNoise(seed + 97), nV: makeNoise(seed + 101) };
}
function hashSeed(text) {
  const s = String(text == null ? '' : text).trim();
  if (/^-?\d+$/.test(s) && Math.abs(+s) < 2e9) return +s | 0;
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}
const SEED_WORDS = ['amber', 'birch', 'cobalt', 'delta', 'ember', 'fjord', 'glade', 'harbor', 'indigo', 'juniper', 'kelp', 'lagoon', 'maple', 'nectar', 'orchid', 'pebble', 'quartz', 'river', 'saffron', 'tundra', 'umber', 'valley', 'willow', 'yarrow', 'zephyr'];
function randomSeedText() { return pick(SEED_WORDS) + '-' + pick(SEED_WORDS) + '-' + (100 + randi(900)); }

function genTile(x, y) {
  const G = GEN;
  const c = fbm(G.nC, x / 560, y / 560, 4), isl = fbm(G.nI, x / 170, y / 170, 4), det = fbm(G.nD, x / 30, y / 30, 3);
  let e = c * 0.62 + isl * 0.38 + (det - 0.5) * 0.16;
  let tmp = fbm(G.nT, x / 430, y / 430, 3) + (fbm(G.nW, x / 50, y / 50, 2) - 0.5) * 0.05;
  let hum = fbm(G.nH, x / 370, y / 370, 3);

  const dx = x - G.sx, dy = y - G.sy, s = Math.exp(-(dx * dx + dy * dy) / (70 * 70));
  if (s > 0.01) {
    if (e < 0.54) e += (0.54 - e) * s;
    if (e > 0.6) e -= (e - 0.58) * s;
  }
  if (e < 0.425) return [T_DEEP, BIO.deep, e];
  if (e < 0.47) return [T_SHALLOW, BIO.ocean, e];

  if (e < 0.6 && s < 0.55) {
    const r1 = Math.abs(fbm(G.nR, x / 280, y / 280, 3) - 0.5), r2 = Math.abs(fbm(G.nR2, x / 190, y / 190, 3) - 0.5);
    const w = 0.0085 + (e - 0.47) * 0.012;
    if (r1 < w || r2 < w * 0.7) return [T_SHALLOW, BIO.river, e];
    const lk = fbm(G.nL, x / 70, y / 70, 3);
    if (lk < 0.27 && e < 0.56) return [lk < 0.24 ? T_DEEP : T_SHALLOW, BIO.lake, e];
  }
  if (e < 0.487 && s < 0.7) return tmp < 0.36 ? [T_SNOW, BIO.tundra, e] : [T_SAND, BIO.beach, e];
  if (e > 0.665) return tmp < 0.58 ? [T_SNOW, BIO.peaks, e] : [T_STONE, BIO.mountains, e];
  if (e > 0.615) return [T_STONE, BIO.mountains, e];
  let b;
  if (tmp < 0.37) b = BIO.tundra;
  else if (tmp < 0.44) b = BIO.taiga;
  else if (tmp > 0.6) b = hum < 0.38 ? (fbm(G.nV, x / 120, y / 120, 2) > 0.6 ? BIO.badlands : BIO.desert) : hum < 0.53 ? BIO.savanna : BIO.jungle;
  else if (hum < 0.4) b = BIO.plains;
  else if (hum < 0.47) b = BIO.meadow;
  else if (hum < 0.6) b = fbm(G.nV, x / 90, y / 90, 2) > 0.6 ? BIO.autumn : BIO.forest;
  else b = e < 0.52 ? BIO.swamp : BIO.darkforest;
  if (b === BIO.swamp && fbm(G.nL, x / 9, y / 9, 2) < 0.36) return [T_SHALLOW, BIO.swamp, e];
  return [BIOMES[b].t, b, e];
}

function genChunkTerrain(cx, cy, edits) {
  const N = CH * CH, terr = new Uint8Array(N), bio = new Uint8Array(N), det = new Float32Array(N), foam = new Uint8Array(N), col = new Array(N);
  const X0 = cx * CH, Y0 = cy * CH, G = GEN;
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const x = X0 + i, y = Y0 + j, k = j * CH + i;
    const g = genTile(x, y);
    let t = g[0];
    const ed = edits && edits[x + ',' + y]; if (ed != null) t = ed;
    terr[k] = t; bio[k] = g[1]; det[k] = hash2(x, y, G.seed + 5);
  }
  const tAt = (x, y) => { const i = x - X0, j = y - Y0; if (i >= 0 && j >= 0 && i < CH && j < CH) return terr[j * CH + i]; const ed = edits && edits[x + ',' + y]; return ed != null ? ed : genTile(x, y)[0]; };
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const x = X0 + i, y = Y0 + j, k = j * CH + i, t = terr[k];
    if (isWaterT(t)) {
      let f = 0;
      if (!isWaterT(tAt(x, y - 1))) f |= 1; if (!isWaterT(tAt(x + 1, y))) f |= 2;
      if (!isWaterT(tAt(x, y + 1))) f |= 4; if (!isWaterT(tAt(x - 1, y))) f |= 8;
      foam[k] = f; col[k] = null; continue;
    }
    col[k] = tileColour(x, y, t, bio[k]);
  }
  return { cx, cy, terr, bio, det, foam, col };
}
function tileColour(x, y, t, bio) {
  const B = BIOMES[bio], base = (B && B.col && B.t === t) ? B.col : LAND_COL[t] || LAND_COL[T_GRASS];
  const h = hash2(x, y, GEN.seed) - 0.5, n = fbm(GEN.nF, x / 3.5, y / 3.5, 2) - 0.5, v = h * 9 + n * 26;
  if (t === T_SNOW) return rgb([base[0] + v * 0.3, base[1] + v * 0.3, base[2] + v * 0.2]);
  if (t === T_STONE) return rgb([base[0] + v * 0.5, base[1] + v * 0.5, base[2] + v * 0.55]);
  return rgb([base[0] + v * 0.6, base[1] + v, base[2] + v * 0.45]);
}
function isWaterT(t) { return t === T_SHALLOW || t === T_DEEP; }

function natureAt(x, y, t, bio) {
  if (isWaterT(t)) return null;
  const B = BIOMES[bio]; if (!B) return null;
  const G = GEN, r = hash2(x, y, G.seed + 31), grove = fbm(G.nF, x / 8, y / 8, 2);
  const s = Math.floor(hash2(x, y, G.seed + 7) * 1000);
  let tree = (B.tree || 0) * (grove > 0.56 ? 1.6 : grove < 0.42 ? 0.45 : 1);
  if (tree > 0 && r < tree) return { t: 'tree', v: B.tv[Math.floor(hash2(x, y, G.seed + 13) * B.tv.length)], s };
  let p = tree;
  if (B.palm) { p += B.palm; if (r < p) return { t: 'tree', v: 4, s }; }
  if (B.rock) { p += B.rock; if (r < p) return { t: 'rock', v: 0, s }; }
  if (B.bush) { p += B.bush; if (r < p) return { t: 'bush', v: 0, s }; }
  return null;
}

function findSpawn() {
  const good = new Set([BIO.plains, BIO.meadow, BIO.forest, BIO.autumn, BIO.savanna]);
  let best = null;
  for (let ring = 0; ring <= 30 && !best; ring++) {
    for (let a = 0; a < Math.max(1, ring * 6) && !best; a++) {
      const ang = a / Math.max(1, ring * 6) * Math.PI * 2, x = Math.round(Math.cos(ang) * ring * 20), y = Math.round(Math.sin(ang) * ring * 20);
      let land = 0, n = 0, ok = 0;
      for (let j = -22; j <= 22; j += 3) for (let i = -22; i <= 22; i += 3) { const g = genTile(x + i, y + j); n++; if (!isWaterT(g[0]) && g[0] !== T_STONE) land++; if (good.has(g[1])) ok++; }
      if (land / n > 0.98 && ok / n > 0.6) best = { x, y };
    }
  }
  return best || { x: GEN.sx, y: GEN.sy };
}
