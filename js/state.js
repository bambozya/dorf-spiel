// ================= Spielstand =================
const SAVEKEY = 'younes-dorf-v2';
let state,
  player,
  horses,
  bikes,
  villagers,
  buyers = [],
  floats = [],
  sellers2 = [];

function freshState() {
  return {
    v: 1,
    coins: 100,
    inv: {
      wood: 0,
      plank: 0,
      stone: 0,
      fish: 0,
      cod: 0,
      tuna: 0,
      carrot: 0,
      wheat: 0,
      pumpkin: 0,
      bread: 0,
      soup: 0,
      cake: 0,
      pie: 0,
      ffish: 0,
      salad: 0,
      seed_carrot: 0,
      seed_wheat: 0,
      seed_pumpkin: 0,
    },
    axe: false,
    saw: false,
    day: 1,
    t: 0.02,
    bridge: false,
    plots: PLOTS.map(() => ({ c: null, g: 0 })),
    chopped: [],
    barnDay: 0,
    up: { 5: { p: 0, w: 0 }, 6: { p: 0, w: 0 } },
    stall: {
      carrot: 0,
      wheat: 0,
      pumpkin: 0,
      bread: 0,
      soup: 0,
      cake: 0,
      pie: 0,
      ffish: 0,
      salad: 0,
      fish: 0,
      cod: 0,
      tuna: 0,
      stone: 0,
    },
    stats: { harvest: 0, planks: 0, sold: 0, earned: 0 },
    homes: {},
    moments: [],
    seed: 'seed_carrot',
    look: { skin: '#e8b98f', hair: '#2a1d14', shirt: '#3fa7d6', pants: '#2f4a7a', shoes: '#3b2a1e' },
    name: '',
    created: false,
    px: 20.5,
    py: 18.6,
    buyQ: schedule(),
    buyersToday: 0,
    lastBuyers: 0,
  };
}

function schedule() {
  const n = 1 + Math.floor(Math.random() * 20);
  const a = [];
  for (let i = 0; i < n; i++) a.push(0.04 + Math.random() * 0.55);
  a.sort((x, y) => x - y);
  return a;
}

function save() {
  try {
    if (scene) {
      state.px = scene.outX;
      state.py = scene.outY;
    } else {
      state.px = player.x;
      state.py = player.y;
    }
    localStorage.setItem(SAVEKEY, JSON.stringify(state));
  } catch (e) {}
  if (window.dorfServer) window.dorfServer.savePlayer(state);
}

function load(data) {
  let s = null;
  if (data && data.state) s = data.state;
  if (!s) {
    try {
      const raw = localStorage.getItem(SAVEKEY);
      if (raw) s = JSON.parse(raw);
    } catch (e) {}
  }
  const f = freshState();
  if (s && s.v === 1) {
    state = Object.assign(f, s);
    if (!Array.isArray(state.plots)) state.plots = [];
    state.plots = state.plots.slice(0, PLOTS.length);
    while (state.plots.length < PLOTS.length) state.plots.push({ c: null, g: 0 });
    state.inv = Object.assign(f.inv, s.inv || {});
    state.stall = Object.assign(f.stall, s.stall || {});
    state.stats = Object.assign(f.stats, s.stats || {});
  } else state = f;
}

function initEntities() {
  player = {
    x: state.px,
    y: state.py,
    face: 'down',
    ang: Math.PI / 2,
    rang: Math.PI / 2,
    phase: 0,
    moving: false,
    mount: null,
  };
  horses = [
    { x: 37, y: 14, body: '#8a5a35', mane: '#3b2414', name: 'Karamell' },
    { x: 39.5, y: 13.6, body: '#f1ece2', mane: '#b9ad98', name: 'Luna' },
    { x: 37.5, y: 17.5, body: '#2e2a28', mane: '#111111', name: 'Blitz' },
    { x: 39.8, y: 19, body: '#b5652e', mane: '#f2e2c0', name: 'Fanny' },
  ].map((h) =>
    Object.assign(h, {
      face: 'left',
      phase: 0,
      tx: h.x,
      ty: h.y,
      wait: Math.random() * 3,
      home: Object.assign({}, PADDOCK),
    }),
  );
  bikes = [
    { x: 37.5, y: 24.7, col: '#e5484d', house: 5 },
    { x: 37.5, y: 26, col: '#3fa7d6', house: 5 },
    { x: 37.5, y: 34.7, col: '#f2b134', house: 6 },
    { x: 37.5, y: 36, col: '#3f9a3a', house: 6 },
  ].map((b) => Object.assign(b, { face: 'right' }));
  const r = rng(11);
  villagers = [
    {
      name: 'Oma Hilde',
      look: { skin: '#f6d2b3', hair: '#e8e8e8', shirt: '#8e5bd6', pants: '#3a3a3a', shoes: '#3b2a1e' },
      pts: [
        [20, 18.1],
        [28.6, 18.1],
        [28.6, 44.7],
        [4, 44.7],
        [28.6, 44.7],
      ],
      lines: [
        'Früher haben wir alles auf dem Markt getauscht. Das machen wir heute noch!',
        'Haus 5 und 6 brauchen dringend Strom und Wasser. Vielleicht kannst du helfen?',
        'Das Plumpsklo ist… gemütlich. Sagen wir so.',
      ],
    },
    {
      name: 'Bauer Kemal',
      look: { skin: '#c68a5f', hair: '#2a1d14', shirt: '#3f9a3a', pants: '#6b4f2a', shoes: '#3b2a1e' },
      pts: [
        [17, 23.6],
        [23.6, 23.6],
        [23.6, 27.7],
        [17, 27.7],
      ],
      lines: [
        'Karotten wachsen am schnellsten. Kürbisse dauern, bringen aber viel!',
        'In der Scheune liegen jeden Morgen frische Samen.',
        'Im Marktdorf drüben kaufen die Leute deine Ernte für Münzen.',
      ],
    },
    {
      name: 'Mia',
      look: { skin: '#e8b98f', hair: '#c98a3a', shirt: '#ff8fb1', pants: '#2f4a7a', shoes: '#e8e8e8' },
      pts: [
        [4, 10.9],
        [33, 10.9],
      ],
      lines: [
        'Hast du die Pferde schon gestreichelt? Luna ist meine Lieblingsstute!',
        'Mit dem Fahrrad bist du superschnell.',
        'Über den Fluss kommt man nur mit einer Brücke. Dafür braucht man 500 Holz und einen Hammer. Man kann sie Stück für Stück bauen.',
      ],
    },
  ].map((v) => Object.assign(v, { x: v.pts[0][0], y: v.pts[0][1], i: 1, face: 'down', phase: 0, pause: 0 }));
  villagers = []; // Das Heimatdorf gehört jetzt nur den Online-Spielern
  sellers2 = STALLS2.map((s, i) => ({
    x: s.x + 1,
    y: s.y + 0.3,
    sx: s.x + 1,
    sy: s.y + 0.3,
    state: 'stall',
    path: [],
    face: 'down',
    phase: 0,
    off: r(),
    hi: (s.x < 70 ? 0 : 1) + (s.y < 26 ? 0 : 2),
    look: randLook(r),
    goods: [
      pick(['carrot', 'wheat', 'pumpkin', 'bread', 'wood', 'plank'], r),
      pick(['carrot', 'wheat', 'pumpkin', 'bread'], r),
    ],
    aw: pick(
      [
        ['#e5484d', '#fff8e6'],
        ['#3d6fb0', '#fff8e6'],
        ['#f2b134', '#fff8e6'],
        ['#8e5bd6', '#fff8e6'],
        ['#2f7a5a', '#fff8e6'],
      ],
      r,
    ),
  }));
  STALLS1.forEach((s, i) => (s.look = randLook(r)));
  buyers = [];
  floats = [];
}
