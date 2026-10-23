function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function makeNoise(seed) {
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbm(n, x, y, o) {
  let s = 0, a = 1, f = 1, t = 0;
  for (let i = 0; i < o; i++) { s += n(x * f + i * 17.3, y * f - i * 9.1) * a; t += a; a *= 0.5; f *= 2; }
  return s / t;
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e5) return Math.round(n / 1e3) + 'k';
  return n.toLocaleString('en-US');
}
function fmtTime(ms) {
  if (ms < 10000) return (Math.max(0, ms) / 1000).toFixed(ms < 1000 ? 1 : 1).replace(/\.0$/, '') + 's';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return m + 'm' + (r ? ' ' + String(r).padStart(2, '0') + 's' : '');
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}
function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function rgb(a) { return `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`; }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function hexRgb(h) {
  if (h[0] !== '#') { const m = h.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128]; }
  h = h.slice(1); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
}
const _shadeCache = new Map();
function shade(hex, f) {
  const k = hex + f; let r = _shadeCache.get(k);
  if (!r) { const c = hexRgb(hex); r = rgb(f < 0 ? mix(c, [0, 0, 0], -f) : mix(c, [255, 255, 255], f)); _shadeCache.set(k, r); }
  return r;
}
