// ================= Zeichnen =================
const cv = document.getElementById('game'),
  ctx = cv.getContext('2d');
let VW = 0,
  VH = 0,
  DPR = 1,
  SC = 1,
  camX = 0,
  camY = 0,
  now = 0;

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = innerWidth;
  VH = innerHeight;
  cv.width = Math.round(VW * DPR);
  cv.height = Math.round(VH * DPR);
  cv.style.width = VW + 'px';
  cv.style.height = VH + 'px';
  SC = Math.max(1.15, Math.min(2.6, Math.min(VW, VH) / (13 * TILE)));
}
addEventListener('resize', resize);

function tile(c, i, j) {
  const g = ground[tileIndex(i, j)],
    X = i * TILE,
    Y = j * TILE,
    h = hh(i, j);
  const fill = (col) => {
    c.fillStyle = col;
    c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
  };
  if (g === 0 || g === 8) {
    fill(g ? '#73bb54' : '#7cc35a');
    if (h % 5 === 0) {
      c.fillStyle = '#5fa544';
      c.fillRect(X + (h % 20), Y + ((h >> 5) % 22) + 4, 2, 5);
      c.fillRect(X + (h % 20) + 3, Y + ((h >> 5) % 22) + 6, 2, 3);
    }
    if (h % 29 === 0) {
      c.fillStyle = h % 3 ? '#fff3a8' : '#ffffff';
      c.fillRect(X + ((h >> 3) % 24) + 3, Y + ((h >> 7) % 24) + 3, 3, 3);
      c.fillStyle = '#e8b23a';
      c.fillRect(X + ((h >> 3) % 24) + 4, Y + ((h >> 7) % 24) + 4, 1, 1);
    }
  } else if (g === 1) {
    fill('#dcb57e');
    c.fillStyle = '#c79e66';
    if (h % 3 === 0) c.fillRect(X + (h % 26) + 2, Y + ((h >> 4) % 26) + 2, 3, 2);
    if (h % 4 === 1) c.fillRect(X + ((h >> 6) % 24) + 4, Y + ((h >> 9) % 24) + 4, 2, 2);
  } else if (g === 2) {
    fill('#d3cbb9');
    c.fillStyle = '#b9ae98';
    c.fillRect(X, Y + 15, TILE, 2);
    c.fillRect(X, Y + 31, TILE, 1);
    c.fillRect(X + (j % 2 ? 8 : 24), Y, 2, 15);
    c.fillRect(X + (j % 2 ? 24 : 8), Y + 16, 2, 15);
  } else if (g === 3) {
    fill('#3d97d4');
    c.fillStyle = '#62b2e6';
    const o = (now * 18 + j * 11 + i * 5) % 40;
    c.fillRect(X + (o % 32), Y + 8, 10, 2);
    c.fillRect(X + ((o + 17) % 32), Y + 22, 8, 2);
  } else if (g === 4) {
    fill('#8b5a36');
    c.fillStyle = '#7a4c2c';
    for (let k = 4; k < 32; k += 8) c.fillRect(X, Y + k, TILE, 2);
  } else if (g === 5) {
    fill('#c49a62');
    c.fillStyle = '#b08452';
    if (h % 3 === 0) c.fillRect(X + (h % 24) + 3, Y + ((h >> 5) % 24) + 3, 4, 3);
  } else if (g === 6) {
    fill('#e6d199');
    c.fillStyle = '#d4bb7c';
    if (h % 2) c.fillRect(X + (h % 26) + 2, Y + ((h >> 4) % 26) + 2, 2, 2);
  } else if (g === 7) {
    fill('#b07a43');
    c.fillStyle = '#8a5a2b';
    for (let k = 0; k < 32; k += 7) c.fillRect(X + k, Y, 2, TILE);
    if (j === 28) {
      c.fillStyle = '#6b4226';
      c.fillRect(X, Y, TILE + 0.6, 5);
    }
    if (j === 29) {
      c.fillStyle = '#6b4226';
      c.fillRect(X, Y + 27, TILE + 0.6, 5);
    }
  }
  if (fence[tileIndex(i, j)]) {
    const L = i > 0 && fence[tileIndex(i - 1, j)],
      R = i < MAP_W - 1 && fence[tileIndex(i + 1, j)],
      U = j > 0 && fence[tileIndex(i, j - 1)],
      D = j < MAP_H - 1 && fence[tileIndex(i, j + 1)];
    c.fillStyle = '#8a5a2b';
    if (L) {
      c.fillRect(X, Y + 12, 16, 4);
      c.fillRect(X, Y + 21, 16, 4);
    }
    if (R) {
      c.fillRect(X + 16, Y + 12, 16, 4);
      c.fillRect(X + 16, Y + 21, 16, 4);
    }
    if (U) c.fillRect(X + 14, Y, 4, 16);
    if (D) c.fillRect(X + 14, Y + 16, 4, 16);
    c.fillStyle = '#6b4226';
    c.fillRect(X + 12, Y + 6, 8, 22);
    c.fillStyle = '#b88452';
    c.fillRect(X + 12, Y + 6, 8, 3);
  }
}

function drawPlot(c, p, s) {
  if (p.first) {
    const X = (p.x - 1.6) * TILE,
      Y = p.y * TILE;
    c.fillStyle = '#6b4226';
    c.fillRect(X + 14, Y + 10, 3, 20);
    c.fillStyle = '#c99a62';
    c.fillRect(X + 3, Y + 5, 25, 13);
    c.strokeStyle = '#6b4226';
    c.lineWidth = 1.5;
    c.strokeRect(X + 3, Y + 5, 25, 13);
    c.fillStyle = '#2e2216';
    c.font = 'bold 10px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillText('Haus ' + (p.row + 1), X + 15.5, Y + 15);
  }
  const X = p.x * TILE,
    Y = p.y * TILE;
  c.fillStyle = '#5e3a20';
  c.beginPath();
  c.ellipse(X + 16, Y + 18, 14, 11, 0, 0, 7);
  c.fill();
  c.fillStyle = '#7a4e2f';
  c.beginPath();
  c.ellipse(X + 16, Y + 16, 12.5, 9, 0, 0, 7);
  c.fill();
  c.fillStyle = 'rgba(255,220,180,.12)';
  c.beginPath();
  c.ellipse(X + 13, Y + 13, 6, 3, 0, 0, 7);
  c.fill();
  if (s.w && s.c) {
    c.fillStyle = 'rgba(40,25,15,.4)';
    c.beginPath();
    c.ellipse(X + 16, Y + 16, 12.5, 9, 0, 0, 7);
    c.fill();
    c.fillStyle = 'rgba(150,210,255,.6)';
    c.fillRect(X + 8, Y + 12, 2, 1.4);
    c.fillRect(X + 22, Y + 18, 2, 1.4);
  }
  if (!s.c) return;
  const g = s.g / CROPS[s.c].grow;
  drawCrop(c, s.c, X + 16, Y + 20, Math.max(0.12, g), p.x * 3 + p.y);
  if (g >= 1 && Math.sin(now * 4 + p.x + p.y) > 0.6) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(X + 27, Y + 1);
    c.lineTo(X + 28, Y + 4);
    c.lineTo(X + 31, Y + 5);
    c.lineTo(X + 28, Y + 6);
    c.lineTo(X + 27, Y + 9);
    c.lineTo(X + 26, Y + 6);
    c.lineTo(X + 23, Y + 5);
    c.lineTo(X + 26, Y + 4);
    c.fill();
  }
}

// ---- Figuren als echte 3D-Klötzchen (wie Minecraft): Kopf, Körper, Arme, Beine ----
const FACEANG = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 };
let FDT = 0.016;

function angOf(o, t) {
  if (t === undefined || t === null || isNaN(t)) t = Math.PI / 2;
  if (o.rang === undefined || isNaN(o.rang)) o.rang = t;
  let d = t - o.rang;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  o.rang += d * Math.min(1, FDT * 10);
  return o.rang;
}
const SHC = new Map();

function shc(hex, b) {
  const k = hex + ((b * 40) | 0);
  let v = SHC.get(k);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = `rgb(${Math.min(255, ((n >> 16) & 255) * b) | 0},${Math.min(255, ((n >> 8) & 255) * b) | 0},${Math.min(255, (n & 255) * b) | 0})`;
    SHC.set(k, v);
  }
  return v;
}
const BOXF = [
  [
    'front',
    [0, 1, 0],
    (b) => [
      [b[0], b[4], b[5]],
      [b[3], b[4], b[5]],
      [b[3], b[4], b[2]],
      [b[0], b[4], b[2]],
    ],
  ],
  [
    'back',
    [0, -1, 0],
    (b) => [
      [b[3], b[1], b[5]],
      [b[0], b[1], b[5]],
      [b[0], b[1], b[2]],
      [b[3], b[1], b[2]],
    ],
  ],
  [
    'side',
    [1, 0, 0],
    (b) => [
      [b[3], b[4], b[5]],
      [b[3], b[1], b[5]],
      [b[3], b[1], b[2]],
      [b[3], b[4], b[2]],
    ],
  ],
  [
    'side',
    [-1, 0, 0],
    (b) => [
      [b[0], b[4], b[5]],
      [b[0], b[1], b[5]],
      [b[0], b[1], b[2]],
      [b[0], b[4], b[2]],
    ],
  ],
  [
    'top',
    [0, 0, 1],
    (b) => [
      [b[0], b[1], b[5]],
      [b[3], b[1], b[5]],
      [b[3], b[4], b[5]],
      [b[0], b[4], b[5]],
    ],
  ],
  [
    'bottom',
    [0, 0, -1],
    (b) => [
      [b[0], b[4], b[2]],
      [b[3], b[4], b[2]],
      [b[3], b[1], b[2]],
      [b[0], b[1], b[2]],
    ],
  ],
];

function personParts(L, phase, opt) {
  const sw = phase ? Math.sin(phase) * 0.6 : 0,
    dk = '#2b2118',
    sk = L.skin,
    hr = L.hair,
    ride = opt.ride,
    hs = L.hs | 0,
    cl = L.cl | 0,
    eye = L.eye || '#4a2e1a',
    fem = L.g === 'f';
  const legS = ride ? (opt.bike ? 0.75 : 0.3) : opt.seated ? 1.45 : opt.cheer ? sw * 0.3 : sw;
  let armS = opt.cheer
    ? Math.PI * 0.92 + Math.sin(phase * 0.7) * 0.25
    : ride
      ? opt.bike
        ? 1.15
        : 0.7
      : opt.seated
        ? 0.45
        : -sw * 0.85;
  if (opt.chop !== undefined) armS = chopSwing(opt.chop);
  if (opt.reach !== undefined) armS = 1.25 * Math.sin(Math.min(1, opt.reach / 0.55) * Math.PI);
  if (opt.jump !== undefined) {
    armS = opt.jump > 0 ? 2.6 : 1.6;
  }
  const pd = opt.bike ? Math.sin(opt.pedal || 0) * 0.45 : 0,
    rL = opt.jump !== undefined ? 0.55 : ride ? legS + pd : legS,
    rR = opt.jump !== undefined ? -0.2 : ride || opt.seated ? legS - pd : -legS;
  let armR =
    ride ||
    opt.seated ||
    opt.cheer ||
    opt.jump !== undefined ||
    opt.chop !== undefined ||
    opt.reach !== undefined
      ? armS
      : -armS;
  if (opt.drink !== undefined) {
    armR = drinkArm(opt.drink);
    armS = armR;
  }
  const P = [],
    legCol = cl ? sk : L.pants,
    lx = ride
      ? [
          [-9.4, -3.4],
          [3.4, 9.4],
        ]
      : [
          [-6, -0.4],
          [0.4, 6],
        ];
  const legP = (x0, x1, r) => {
    P.push({ b: [x0, -2.6, 2.5, x1, 2.6, 15], pv: [0, 15], r, col: legCol, bot: L.shoes });
    P.push({
      b: [x0 - 0.2, -3, 0, x1 + 0.2, 4.6, 2.6],
      pv: [0, 15],
      r,
      col: L.shoes,
      top: shade(L.shoes, 18),
    });
  };
  legP(lx[0][0], lx[0][1], rL);
  legP(lx[1][0], lx[1][1], rR);
  if (cl) {
    const sc = cl === 2 ? L.shirt : L.pants,
      hem = [[0, 0.85, 1, 1, shade(sc, -25)]];
    P.push({
      b: [-7.4, -4.2, 9.5, 7.4, 4.2, 16.5],
      col: sc,
      top: sc,
      deco: { front: hem, back: hem, side: hem },
    });
  }
  const belt = cl ? [] : [[0, 0.88, 1, 1, shade(L.pants, -30)]],
    tw = fem ? 6.2 : 6.8;
  P.push({
    b: [-tw, -3.2, 15, tw, 3.2, 27],
    col: L.shirt,
    top: shade(L.shirt, 10),
    deco: { front: belt.concat([[0.38, 0, 0.62, 0.1, sk]]), back: belt, side: belt },
  });
  P.push({ b: [-2, -2, 27, 2, 2, 28.8], col: sk });
  const arm = (x0, x1, r) => {
    const sl = [[0, 0.55, 1, 1, sk]];
    P.push({
      b: [x0, -2, 16, x1, 2, 27],
      pv: [0, 26.4],
      r,
      col: L.shirt,
      deco: { front: sl, back: sl, side: sl },
      bot: sk,
    });
    P.push({ b: [x0 + 0.2, -1.8, 13.6, x1 - 0.2, 1.8, 16.2], pv: [0, 26.4], r, col: shade(sk, -6) });
  };
  arm(-10.4, -6.9, armS);
  arm(6.9, 10.4, armR);
  if (opt.chop !== undefined && opt.tool === 'sword')
    P.push(
      { b: [8.5, -1, 12.4, 9.9, 2.4, 14.4], pv: [0, 26.4], r: armS, col: '#5a3418' },
      { b: [7.4, 2.4, 12, 11, 3.6, 14.8], pv: [0, 26.4], r: armS, col: '#c9a227' },
      { b: [8.7, 3.6, 12.6, 9.7, 19, 13.8], pv: [0, 26.4], r: armS, col: '#c9d1da', top: '#f4f7fa' },
    );
  else if (opt.chop !== undefined)
    P.push(
      { b: [8.3, -1, 13, 10.1, 12, 14.8], pv: [0, 26.4], r: armS, col: '#8a5a35' },
      opt.tool === 'pick'
        ? { b: [8.1, 6, 11, 10.3, 17, 13], pv: [0, 26.4], r: armS, col: '#9aa3ab', top: '#c9d1da' }
        : { b: [8, 9, 10.5, 10.4, 13.5, 18.5], pv: [0, 26.4], r: armS, col: '#9aa3ab', top: '#c9d1da' },
    );
  else if (opt.drink !== undefined && opt.drink > 0.3 && opt.drink < 2.6) {
    const hy = 12.4 * Math.sin(armR),
      hz = 26.4 - 12.4 * Math.cos(armR),
      tilt = armR > 1.8 ? -0.5 : 0;
    P.push({
      b: [-2.8, hy - 2.4, hz - 1.5, 2.8, hy + 2.4, hz + 4.5],
      pv: [hy, hz + 1.5],
      r: tilt,
      col: opt.food ? FOODCOL[opt.food] || '#d99a4a' : '#a8743f',
      top: opt.food ? FOODCOL[opt.food] || '#d99a4a' : '#5fb2ea',
      bot: opt.food ? FOODCOL[opt.food] || '#d99a4a' : '#8a5a2b',
      deco: {
        front: [[0, 0.15, 1, 0.3, '#8a5a2b']],
        side: [[0, 0.15, 1, 0.3, '#8a5a2b']],
        back: [[0, 0.15, 1, 0.3, '#8a5a2b']],
      },
    });
  } else if (opt.tool === 'can' && opt.reach !== undefined)
    P.push({ b: [7.5, 0, 9, 11.5, 8, 15.5], pv: [0, 26.4], r: armS, col: '#3f9a3a', top: '#5fbf5a' });
  const lip = fem ? '#c4505c' : '#9a3b35',
    blush = fem ? '#eb9c96' : '#e3a291';
  const face = [
    [0, 0, 1, hs === 0 ? 0.2 : 0.15, hr],
    [0.16, 0.4, 0.4, 0.54, '#ffffff'],
    [0.6, 0.4, 0.84, 0.54, '#ffffff'],
    [0.25, 0.4, 0.38, 0.54, eye],
    [0.62, 0.4, 0.75, 0.54, eye],
    [0.28, 0.43, 0.35, 0.52, '#111111'],
    [0.65, 0.43, 0.72, 0.52, '#111111'],
    [0.29, 0.42, 0.31, 0.45, '#ffffff'],
    [0.66, 0.42, 0.68, 0.45, '#ffffff'],
    [0.14, 0.3, 0.4, 0.35, shade(hr, -12)],
    [0.6, 0.3, 0.86, 0.35, shade(hr, -12)],
    [0.36, 0.75, 0.64, 0.8, lip],
    [0.3, 0.71, 0.37, 0.76, lip],
    [0.63, 0.71, 0.7, 0.76, lip],
    [0.08, 0.6, 0.2, 0.68, blush],
    [0.8, 0.6, 0.92, 0.68, blush],
  ];
  if (fem) face.push([0.12, 0.36, 0.18, 0.42, dk], [0.82, 0.36, 0.88, 0.42, dk]);
  if (hs === 1 || hs === 3 || hs === 4) face.push([0, 0, 0.1, 0.55, hr], [0.9, 0, 1, 0.55, hr]);
  P.push({
    b: [-6, -5.5, 28.6, 6, 5.5, 40],
    col: sk,
    top: hr,
    deco: {
      front: face,
      side: [
        [0, 0, 1, 0.25, hr],
        [0.6, 0, 1, 0.55, hr],
      ],
      back: [[0, 0, 1, 0.7, hr]],
    },
  });
  P.push({ b: [-0.9, 5.5, 32, 0.9, 6.5, 34.6], col: shade(sk, -14), top: shade(sk, -4) });
  P.push(
    { b: [-6.6, -1, 32.4, -6, 1.2, 35.4], col: shade(sk, -10) },
    { b: [6, -1, 32.4, 6.6, 1.2, 35.4], col: shade(sk, -10) },
  );
  P.push({ b: [-6.4, -5.9, 38, 6.4, 5.8, 41.2], col: hr, top: shade(hr, 16) });
  const tie = (c) => ({
    front: [[0, 0.78, 1, 0.88, c]],
    back: [[0, 0.78, 1, 0.88, c]],
    side: [[0, 0.78, 1, 0.88, c]],
  });
  if (hs === 0 || hs === 2 || hs === 3) P.push({ b: [-6.4, -6, 31, 6.4, -5, 41], col: hr });
  if (hs === 1)
    P.push(
      { b: [-6.7, -6.4, 21, 6.7, -4.8, 41], col: hr },
      { b: [-6.9, -4.8, 24, -6, 3, 40], col: hr },
      { b: [6, -4.8, 24, 6.9, 3, 40], col: hr },
    );
  if (hs === 2)
    P.push({
      b: [-1.6, -9, 25, 1.6, -6, 37.5],
      col: hr,
      deco: {
        front: [[0, 0.08, 1, 0.18, '#e5484d']],
        back: [[0, 0.08, 1, 0.18, '#e5484d']],
        side: [[0, 0.08, 1, 0.18, '#e5484d']],
      },
    });
  if (hs === 3)
    P.push(
      { b: [-7.6, -3.2, 21, -5.8, -1, 35], col: hr, deco: tie('#3fa7d6') },
      { b: [5.8, -3.2, 21, 7.6, -1, 35], col: hr, deco: tie('#3fa7d6') },
    );
  if (hs === 4)
    P.push(
      { b: [-6.7, -6.4, 30, 6.7, -4.8, 41], col: hr },
      { b: [-6.9, -4.8, 30.5, -6, 4, 40], col: hr },
      { b: [6, -4.8, 30.5, 6.9, 4, 40], col: hr },
    );
  return P;
}

function horseParts(h, phase) {
  const sw = phase ? Math.sin(phase) * 0.55 : 0,
    B = h.body,
    M = h.mane,
    dark = shade(B, -35),
    hoof = [[0, 0.84, 1, 1, '#3a2a1e']];
  const leg = (x0, y0, r) => ({
    b: [x0, y0, 0, x0 + 4, y0 + 4, 14],
    pv: [y0 + 2, 14],
    r,
    col: B,
    deco: { front: hoof, back: hoof, side: hoof },
    bot: '#3a2a1e',
  });
  return [
    leg(-5.5, 7, sw),
    leg(1.5, 7, -sw),
    leg(-5.5, -13, -sw),
    leg(1.5, -13, sw),
    { b: [-6, -15, 13, 6, 13, 26], col: B, top: shade(B, 12) },
    { b: [-3, 8, 21, 3, 15, 34], col: B, top: M, deco: { back: [[0.3, 0, 0.7, 1, M]] } },
    { b: [-1.4, 6, 24, 1.4, 9, 36], col: M },
    {
      b: [-3.5, 12, 29, 3.5, 25, 36],
      col: B,
      top: B,
      deco: {
        front: [
          [0, 0, 1, 1, dark],
          [0.15, 0.35, 0.3, 0.55, '#1a1a1a'],
          [0.7, 0.35, 0.85, 0.55, '#1a1a1a'],
        ],
        side: [
          [0.15, 0.15, 0.3, 0.45, '#111111'],
          [0.7, 0, 1, 1, dark],
        ],
        top: [
          [0, 0.6, 1, 1, shade(B, -10)],
          [0.3, 0, 0.7, 0.25, M],
        ],
      },
    },
    { b: [-3.2, 13, 36, -1.2, 15.5, 40], col: B },
    { b: [1.2, 13, 36, 3.2, 15.5, 40], col: B },
    {
      b: [-1.6, -19, 12, 1.6, -15, 25],
      pv: [-15, 25],
      r: -0.25 + (phase ? Math.sin(phase * 0.5) * 0.15 : 0),
      col: M,
    },
  ];
}

function shiftParts(ps, ox, oy, oz) {
  return ps.map((p) =>
    Object.assign({}, p, {
      b: [p.b[0] + ox, p.b[1] + oy, p.b[2] + oz, p.b[3] + ox, p.b[4] + oy, p.b[5] + oz],
      pv: p.pv ? [p.pv[0] + oy, p.pv[1] + oz] : null,
    }),
  );
}

function renderParts(c, fx, fy, parts, ang, s) {
  const ca = Math.cos(ang),
    sa = Math.sin(ang),
    F = [];
  for (const p of parts) {
    const cr = p.r ? Math.cos(p.r) : 1,
      sr = p.r ? Math.sin(p.r) : 0;
    const T = (x, y, z) => {
      if (p.r) {
        const dy = y - p.pv[0],
          dz = z - p.pv[1];
        y = p.pv[0] + dy * cr - dz * sr;
        z = p.pv[1] + dy * sr + dz * cr;
      }
      const wx = -x * sa + y * ca,
        wy = x * ca + y * sa;
      return [fx + wx * s, fy + (wy * 0.5 - z) * s, 2 * wy + z];
    };
    for (const [name, n, cf] of BOXF) {
      let ny = n[1],
        nz = n[2];
      if (p.r) {
        const a = ny * cr - nz * sr,
          b2 = ny * sr + nz * cr;
        ny = a;
        nz = b2;
      }
      const nwx = -n[0] * sa + ny * ca,
        nwy = n[0] * ca + ny * sa;
      if (2 * nwy + nz <= 0.02) continue;
      const pts = cf(p.b).map((q) => T(q[0], q[1], q[2]));
      const dep = (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4;
      const li = Math.max(0.55, Math.min(1.08, 0.76 + 0.2 * nz + 0.14 * nwy - 0.06 * nwx));
      const col = name === 'top' && p.top ? p.top : name === 'bottom' && p.bot ? p.bot : p.col;
      F.push({ pts, dep, li, col, deco: p.deco && p.deco[name] });
    }
  }
  F.sort((a, b) => a.dep - b.dep);
  c.lineJoin = 'round';
  for (const f of F) {
    const q = f.pts;
    c.fillStyle = c.strokeStyle = shc(f.col, f.li);
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(q[0][0], q[0][1]);
    c.lineTo(q[1][0], q[1][1]);
    c.lineTo(q[2][0], q[2][1]);
    c.lineTo(q[3][0], q[3][1]);
    c.closePath();
    c.fill();
    c.stroke();
    if (f.deco)
      for (const d of f.deco) {
        const P2 = (u, v) => [
          q[0][0] * (1 - u) * (1 - v) + q[1][0] * u * (1 - v) + q[2][0] * u * v + q[3][0] * (1 - u) * v,
          q[0][1] * (1 - u) * (1 - v) + q[1][1] * u * (1 - v) + q[2][1] * u * v + q[3][1] * (1 - u) * v,
        ];
        const a = P2(d[0], d[1]),
          b2 = P2(d[2], d[1]),
          cc = P2(d[2], d[3]),
          e = P2(d[0], d[3]);
        c.fillStyle = shc(d[4], f.li);
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b2[0], b2[1]);
        c.lineTo(cc[0], cc[1]);
        c.lineTo(e[0], e[1]);
        c.closePath();
        c.fill();
      }
  }
}

function drawModel(c, fx, fy, L, ang, phase, opt) {
  renderParts(c, fx, fy, personParts(L, phase, opt), ang, opt.s || 1);
}

// Pferd in 3D, wahlweise mit Reiter im Sattel
function drawHorse3D(c, fx, fy, h, ang, phase, rider, s) {
  s = s || 1;
  const ca = Math.abs(Math.cos(ang)),
    sa = Math.abs(Math.sin(ang));
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.beginPath();
  c.ellipse(fx, fy, (7 + 15 * ca) * s, (3.5 + 8 * sa) * s, 0, 0, 7);
  c.fill();
  let parts = horseParts(h, phase);
  if (rider) parts = parts.concat(shiftParts(personParts(rider, 0, { ride: 1 }), 0, -2, 11));
  renderParts(c, fx, fy, parts, ang, s);
}

function drawPerson(c, fx, fy, L, face, phase, opt) {
  opt = opt || {};
  const a = opt.ang !== undefined ? opt.ang : (FACEANG[face] ?? Math.PI / 2),
    s = opt.s || 1;
  if (!opt.seated && !opt.noShadow) {
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.beginPath();
    c.ellipse(fx, fy, 11 * s, 4.5 * s, 0, 0, 7);
    c.fill();
  }
  drawModel(c, fx, fy, L, a, phase, opt);
}

function drawHorse(c, fx, fy, h, phase) {
  c.save();
  c.translate(fx, fy);
  if (h.face === 'right') c.scale(-1, 1);
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.beginPath();
  c.ellipse(0, 0, 20, 5, 0, 0, 7);
  c.fill();
  const a = phase ? Math.round(Math.sin(phase) * 2) : 0;
  c.fillStyle = shade(h.body, -25);
  c.fillRect(-14, -12 - Math.max(0, a), 4, 12);
  c.fillRect(8, -12 - Math.max(0, -a), 4, 12);
  c.fillStyle = h.body;
  c.fillRect(-9, -12 - Math.max(0, -a), 4, 12);
  c.fillRect(13, -12 - Math.max(0, a), 4, 12);
  c.fillStyle = '#3a2a1e';
  c.fillRect(-14, -2, 4, 2);
  c.fillRect(-9, -2, 4, 2);
  c.fillRect(8, -2, 4, 2);
  c.fillRect(13, -2, 4, 2);
  c.fillStyle = h.body;
  c.fillRect(-16, -25, 34, 14);
  c.fillStyle = shade(h.body, 15);
  c.fillRect(-14, -25, 30, 4);
  c.fillRect(-22, -36, 9, 14);
  c.fillStyle = h.body;
  c.fillRect(-22, -36, 9, 14);
  c.fillRect(-30, -38, 13, 9);
  c.fillStyle = shade(h.body, -30);
  c.fillRect(-32, -33, 5, 5);
  c.fillStyle = '#111';
  c.fillRect(-25, -36, 2, 2);
  c.fillStyle = h.body;
  c.fillRect(-19, -41, 3, 4);
  c.fillStyle = h.mane;
  c.fillRect(-15, -39, 4, 16);
  c.fillRect(-20, -40, 5, 3);
  c.fillRect(18, -24, 4, 14);
  c.fillRect(20, -12, 3, 3);
  c.restore();
}

function drawBike(c, fx, fy, b) {
  c.save();
  c.translate(fx, fy);
  if (b.face === 'left') c.scale(-1, 1);
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.beginPath();
  c.ellipse(0, 0, 16, 4, 0, 0, 7);
  c.fill();
  c.strokeStyle = '#2b2b2b';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(-10, -7, 6, 0, 7);
  c.stroke();
  c.beginPath();
  c.arc(10, -7, 6, 0, 7);
  c.stroke();
  c.strokeStyle = b.col;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-10, -7);
  c.lineTo(-2, -7);
  c.lineTo(5, -16);
  c.lineTo(-5, -16);
  c.lineTo(-2, -7);
  c.moveTo(5, -16);
  c.lineTo(10, -7);
  c.moveTo(-5, -16);
  c.lineTo(-6, -19);
  c.moveTo(5, -16);
  c.lineTo(7, -21);
  c.stroke();
  c.fillStyle = '#2b2b2b';
  c.fillRect(-9, -21, 7, 3);
  c.fillRect(5, -23, 6, 3);
  c.restore();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt,
    g = ((n >> 8) & 255) + amt,
    b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function night() {
  const h = 6 + state.t * 24;
  return h < 19 ? 0 : h < 22 ? ((h - 19) / 3) * 0.55 : h < 29 ? 0.55 : (30 - h) * 0.55;
}

function hasPower(n) {
  return n < 5 || state.up[n].p;
}
function hasWater(n) {
  return n < 5 || state.up[n].w;
}
