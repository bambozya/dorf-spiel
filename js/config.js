'use strict';

// ================= Grundwerte =================
const TILE = 32,
  MAP_W = 86,
  MAP_H = 48,
  DAY = 360; // ein ganzer Tag (24 Stunden) = 6 Minuten
const tileIndex = (x, y) => y * MAP_W + x;
const ground = new Uint8Array(MAP_W * MAP_H),
  solid = new Uint8Array(MAP_W * MAP_H),
  fence = new Uint8Array(MAP_W * MAP_H);

// Boden: 0 Gras,1 Weg,2 Pflaster,3 Wasser,4 Acker,5 Erde,6 Sand,7 Brücke,8 dunkles Gras
function hh(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rect(a, x, y, w, h, v) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < MAP_W && j < MAP_H) a[tileIndex(i, j)] = v;
}

function fenceRect(x0, y0, x1, y1, gaps) {
  const g = new Set(gaps.map((p) => p[0] + ',' + p[1]));
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++) {
      if (x !== x0 && x !== x1 && y !== y0 && y !== y1) continue;
      if (g.has(x + ',' + y)) continue;
      fence[tileIndex(x, y)] = 1;
      solid[tileIndex(x, y)] = 1;
    }
}

const ITEMS = {
  carrot: { n: 'Karotte', p: 'Karotten', price: 4 },
  wheat: { n: 'Weizen', p: 'Weizen', price: 6 },
  pumpkin: { n: 'Kürbis', p: 'Kürbisse', price: 15 },
  bread: { n: 'Brot', p: 'Brote', price: 20 },
  soup: { n: 'Kürbissuppe', p: 'Kürbissuppen', price: 28 },
  cake: { n: 'Karottenkuchen', p: 'Karottenkuchen', price: 35 },
  pie: { n: 'Kürbiskuchen', p: 'Kürbiskuchen', price: 40 },
  ffish: { n: 'Bratfisch', p: 'Bratfische', price: 22 },
  salad: { n: 'Karottensalat', p: 'Karottensalate', price: 12 },
  seed_carrot: { n: 'Karottensamen', p: 'Karottensamen', crop: 'carrot' },
  seed_wheat: { n: 'Weizensamen', p: 'Weizensamen', crop: 'wheat' },
  seed_pumpkin: { n: 'Kürbissamen', p: 'Kürbissamen', crop: 'pumpkin' },
  wood: { n: 'Holz', p: 'Holz' },
  plank: { n: 'Brett', p: 'Bretter' },
  stone: { n: 'Stein', p: 'Steine', price: 3 },
  fish: { n: 'Fisch', p: 'Fische', price: 10 },
  cod: { n: 'Kabeljau', p: 'Kabeljaue', price: 20 },
  tuna: { n: 'Thunfisch', p: 'Thunfische', price: 40 },
};

const CROPS = {
  carrot: { grow: 45, yield: 2 },
  wheat: { grow: 75, yield: 2 },
  pumpkin: { grow: 120, yield: 1 },
};
const SELL = [
  'carrot',
  'wheat',
  'pumpkin',
  'bread',
  'soup',
  'cake',
  'pie',
  'ffish',
  'salad',
  'fish',
  'cod',
  'tuna',
  'stone',
];
const SEEDS = ['seed_carrot', 'seed_wheat', 'seed_pumpkin'];
const INV_ORDER = [
  'wood',
  'plank',
  'stone',
  'fish',
  'cod',
  'tuna',
  'carrot',
  'wheat',
  'pumpkin',
  'bread',
  'soup',
  'cake',
  'pie',
  'ffish',
  'salad',
  'seed_carrot',
  'seed_wheat',
  'seed_pumpkin',
];
const fmt = (n, k) => n + ' ' + (n === 1 ? ITEMS[k].n : ITEMS[k].p);
const fmtB = (o) =>
  Object.entries(o)
    .map(([k, n]) => fmt(n, k))
    .join(' + ');

const HOUSES = [
  { n: 1, x: 3, y: 20, w: 6, h: 5, beds: 2, wall: '#f3d48a', roof: '#c0452f' },
  { n: 2, x: 12, y: 12, w: 6, h: 5, beds: 6, wall: '#f6e7c8', roof: '#3d6fb0' },
  { n: 3, x: 16, y: 35, w: 6, h: 5, beds: 6, wall: '#dbe8c6', roof: '#7a4a8c' },
  { n: 4, x: 21, y: 12, w: 6, h: 5, beds: 6, wall: '#f1c9b0', roof: '#2f7a5a' },
  { n: 5, x: 30, y: 22, w: 6, h: 5, beds: 7, wall: '#d8c3a0', roof: '#6b4a2f' },
  { n: 6, x: 30, y: 31, w: 6, h: 5, beds: 4, wall: '#cdbfa8', roof: '#5e5a52' },
];

const V2H = [
  { x: 58, y: 9, w: 5, h: 4, wall: '#f6dfb8', roof: '#c0452f' },
  { x: 78, y: 9, w: 5, h: 4, wall: '#e3eef5', roof: '#3d6fb0' },
  { x: 58, y: 39, w: 5, h: 4, wall: '#f1d0c0', roof: '#2f7a5a' },
  { x: 78, y: 39, w: 5, h: 4, wall: '#e8e0f5', roof: '#7a4a8c' },
];
const BARN = { x: 31, y: 3, w: 7, h: 5 },
  SHOP = { x: 31, y: 39, w: 6, h: 5 },
  KLO = { x: 38, y: 31, w: 2, h: 2 },
  WELL = { x: 19, y: 25 },
  WELL2 = { x: 69, y: 26 };

// Acker: 6 Reihen (eine pro Haus) mit je 8 Beeten
const PLOTS = [];
for (let r = 0; r < 6; r++)
  for (let k = 0; k < 8; k++) PLOTS.push({ x: 12 + k * 2, y: 2 + r, row: r, first: k === 0 });
const PADDOCK = { x0: 36.6, y0: 12.8, x1: 40.4, y1: 19.8 };
const TRADES = [
  { name: 'Gemüsestand', give: { carrot: 2 }, get: { seed_wheat: 3 }, aw: ['#e5484d', '#fff8e6'] },
  { name: 'Bäckerei', give: { wheat: 3 }, get: { bread: 1 }, aw: ['#f2b134', '#fff8e6'] },
  { name: 'Holzhandel', give: { wood: 2 }, get: { seed_carrot: 3 }, aw: ['#3f8f3a', '#fff8e6'] },
  { name: 'Gärtnerei', give: { wheat: 2 }, get: { seed_pumpkin: 2 }, aw: ['#8e5bd6', '#fff8e6'] },
  { name: 'Schreinerei', give: { carrot: 3 }, get: { plank: 2 }, aw: ['#3d6fb0', '#fff8e6'] },
  { name: 'Hofladen', give: { pumpkin: 1 }, get: { wood: 4 }, aw: ['#e8731c', '#fff8e6'] },
];

const STALLS1 = [
  { x: 14, y: 21 },
  { x: 22, y: 21 },
  { x: 13, y: 23 },
  { x: 25, y: 24 },
  { x: 14, y: 29 },
  { x: 22, y: 29 },
];
const SEEDSHOP = [
  { get: { seed_carrot: 3 }, cost: 5 },
  { get: { seed_wheat: 3 }, cost: 8 },
  { get: { seed_pumpkin: 2 }, cost: 12 },
];
const STALLS2 = [
  [62, 15],
  [66, 15],
  [70, 15],
  [74, 15],
  [78, 15],
  [60, 22],
  [60, 33],
  [79, 21],
  [79, 26],
  [79, 31],
  [62, 37],
  [66, 37],
  [70, 37],
  [74, 37],
  [78, 37],
].map((p, k) => ({ x: p[0], y: p[1], k }));
const MYSTALL = 5;

const SKIN = ['#f6d2b3', '#e8b98f', '#c68a5f', '#8d5a3b', '#5e3a25'];
const HAIR = ['#2a1d14', '#6b4226', '#c98a3a', '#e8d17a', '#b33a2a', '#3a3a3a'];
const SHIRT = ['#3fa7d6', '#e5484d', '#3f9a3a', '#f2b134', '#8e5bd6', '#ff8fb1'];
const PANTS = ['#2f4a7a', '#3a3a3a', '#6b4f2a', '#3f6e3f', '#7a2f4a'];
const SHOES = ['#3b2a1e', '#202020', '#e8e8e8', '#b33a2a'];
const r0 = rng(7);
const pick = (a, r) => a[Math.floor(r() * a.length)];
const EYES = ['#4a2e1a', '#3d6fb0', '#3f8f3a', '#7a7a7a'];
const HAIRSTYLES = ['Kurz', 'Lang', 'Pferdeschwanz', 'Zöpfe', 'Bob'],
  CLOTHES = ['Hose', 'Rock', 'Kleid'];
const randLook = (r) => {
  const g = r() < 0.5 ? 'f' : 'm';
  return {
    g,
    skin: pick(SKIN, r),
    hair: pick(HAIR, r),
    shirt: pick(SHIRT, r),
    pants: pick(PANTS, r),
    shoes: pick(SHOES, r),
    eye: pick(EYES, r),
    hs: g === 'f' ? pick([1, 2, 3, 4], r) : pick([0, 0, 4], r),
    cl: g === 'f' ? pick([0, 1, 2], r) : 0,
  };
};
const lkKey = (L) =>
  L
    ? L.skin + L.hair + L.shirt + L.pants + L.shoes + (L.hs | 0) + (L.cl | 0) + (L.eye || '') + (L.g || '')
    : '';
