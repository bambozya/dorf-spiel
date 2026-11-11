// ================= Welt bauen =================
const TREES = [];
const HOP = new Uint8Array(MAP_W * MAP_H),
  TREEAT = new Int16Array(MAP_W * MAP_H).fill(-1);
const GSPOT = [
  [9, 23],
  [9, 15],
  [22, 37],
  [18, 15],
  [36, 21],
  [36, 37],
];

function addTree(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
  const i = tileIndex(x, y);
  if (solid[i] || fence[i]) return;
  if (GSPOT.some(([gx, gy]) => x >= gx && x < gx + 3 && y >= gy && y < gy + 2)) return;
  if (ground[i] !== 0 && ground[i] !== 8) return;
  solid[i] = 1;
  HOP[i] = 1;
  TREEAT[i] = TREES.length;
  TREES.push({ x, y, id: TREES.length, apple: hh(x, y) % 4 === 0 });
}

function buildWorld() {
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) ground[tileIndex(x, y)] = hh(x, y) % 6 === 0 ? 8 : 0;
  // Fluss rechts vom Dorf
  rect(ground, 47, 0, 1, MAP_H, 6);
  rect(ground, 52, 0, 1, MAP_H, 6);
  rect(ground, 48, 0, 4, MAP_H, 3);
  rect(solid, 48, 0, 4, MAP_H, 1);
  // Das Dorf ist umrandet
  fenceRect(1, 1, 42, 46, [
    [42, 27],
    [42, 28],
    [42, 29],
    [42, 30],
  ]);
  fenceRect(56, 8, 84, 44, [
    [56, 27],
    [56, 28],
    [56, 29],
    [56, 30],
  ]);
  fenceRect(35, 11, 41, 20, [
    [35, 15],
    [35, 16],
  ]); // Koppel
  buildHarbor();
  // Wege Heimatdorf
  rect(ground, 3, 10, 32, 2, 1);
  rect(ground, 33, 8, 2, 2, 1); // oberer Weg + Scheune
  rect(ground, 9, 17, 26, 2, 1);
  rect(ground, 34, 15, 1, 2, 1); // Weg vor Haus 2 und 4, zur Koppel
  rect(ground, 12, 19, 16, 13, 2); // Marktplatz
  rect(ground, 5, 25, 7, 2, 1); // zu Haus 1
  rect(ground, 28, 17, 2, 29, 1); // Weg rechts runter
  rect(ground, 30, 27, 4, 1, 1);
  rect(ground, 30, 36, 4, 1, 1);
  rect(ground, 38, 33, 2, 1, 1);
  rect(ground, 18, 32, 2, 3, 1);
  rect(ground, 18, 40, 2, 4, 1); // zu Haus 3
  rect(ground, 3, 44, 38, 2, 1); // unterer Weg (Werkstatt)
  rect(ground, 28, 28, 15, 2, 1); // zum Fluss
  rect(ground, 10, 2, 18, 6, 4); // Acker
  rect(ground, 36, 12, 5, 8, 5); // Koppel-Boden
  // Weg übern Fluss ins Marktdorf
  rect(ground, 43, 28, 5, 2, 1);
  rect(ground, 52, 28, 4, 2, 1);
  rect(ground, 56, 28, 5, 2, 1);
  // Marktdorf: großer ovaler Marktplatz
  for (let y = 9; y < 44; y++)
    for (let x = 57; x < 84; x++) {
      const a = (x + 0.5 - 70.5) / 13.5,
        b = (y + 0.5 - 26.5) / 15;
      if (a * a + b * b <= 1) ground[tileIndex(x, y)] = 2;
    }
  for (const h of V2H) rect(ground, h.x + 2, h.y + h.h, 1, 1, 1);
  // Feste Dinge
  for (const h of HOUSES) rect(solid, h.x, h.y, h.w, h.h, 1);
  for (const h of V2H) rect(solid, h.x, h.y, h.w, h.h, 1);
  rect(solid, BARN.x, BARN.y, BARN.w, BARN.h, 1);
  rect(solid, SHOP.x, SHOP.y, SHOP.w, SHOP.h, 1);
  rect(solid, KLO.x, KLO.y, 2, 2, 1);
  rect(solid, WELL.x, WELL.y, 2, 2, 1);
  rect(solid, WELL2.x, WELL2.y, 2, 2, 1);
  for (const s of PSTALLS) rect(solid, s.x, s.y, 2, 1, 1);
  for (const s of STALLS2) rect(solid, s.x, s.y, 2, 1, 1);
  // Bäume im Dorf
  [
    [3, 3],
    [6, 6],
    [10, 3],
    [3, 8],
    [10, 21],
    [3, 14],
    [7, 13],
    [19, 13],
    [29, 13],
    [31, 14],
    [3, 28],
    [6, 31],
    [9, 34],
    [3, 37],
    [10, 39],
    [5, 41],
    [13, 37],
    [24, 37],
    [25, 34],
    [40, 23],
    [40, 35],
    [39, 41],
    [40, 38],
    [29, 2],
    [39, 4],
    [40, 8],
    [11, 30],
    [3, 17],
    [24, 42],
    [12, 42],
  ].forEach((p) => addTree(p[0], p[1]));
  const r = rng(42);
  // Wald am Fluss
  for (let y = 1; y < MAP_H - 1; y++)
    for (let x = 43; x <= 46; x++) {
      if (y >= 26 && y <= 31) continue;
      if (r() < 0.55) addTree(x, y);
    }
  for (let y = 0; y < MAP_H; y++)
    for (let x = 53; x <= 55; x++) {
      if (y >= 25 && y <= 32) continue;
      if (r() < 0.35) addTree(x, y);
    }
  for (let x = 53; x < MAP_W; x++) {
    for (let y = 0; y <= 6; y++) if (r() < 0.4) addTree(x, y);
    for (let y = 45; y < MAP_H; y++) if (r() < 0.4) addTree(x, y);
  }
  [
    [58, 15],
    [58, 36],
    [82, 15],
    [82, 36],
    [64, 42],
    [72, 42],
    [66, 10],
    [72, 10],
  ].forEach((p) => addTree(p[0], p[1]));
  if (typeof placeRocks === 'function' && !ROCKS.length) placeRocks();
  for (let x = 0; x < MAP_W; x++) {
    addTree(x, 0);
    addTree(x, MAP_H - 1);
  }
}

const BRIDGE_WOOD = 500,
  BX0 = 48,
  BLEN = 4;

function applyBridge() {
  rect(ground, 48, 28, 4, 2, 7);
  rect(solid, 48, 28, 4, 2, 0);
  if (GCV) buildGround();
}
const bridgeWood = () =>
  state.bridge ? BRIDGE_WOOD : Math.max(0, Math.min(BRIDGE_WOOD, state.bridgeWood || 0));
const bridgeEnd = () => BX0 + (BLEN * bridgeWood()) / BRIDGE_WOOD;
