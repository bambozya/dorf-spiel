// ================= Werkstatt von innen und Werkzeuge =================
const TOOLS = [
  ['axe', 'Axt', 0, 'Bäume fällen'],
  ['saw', 'Säge', 0, 'Holz zu Brettern sägen'],
  ['hammer', 'Hammer', 15, 'Neue Etagen an Häuser anbauen'],
  ['shovel', 'Schaufel', 15, 'Karotten und Kürbisse tiefer ausgraben: +1 Ernte'],
  ['can', 'Gießkanne', 20, 'Pflanzen gießen: sie wachsen doppelt so schnell'],
  ['scythe', 'Sense', 25, 'Alle reifen Weizenfelder auf einmal ernten'],
  ['pickaxe', 'Spitzhacke', 30, 'Felsen abbauen: gibt Steine'],
  ['rod', 'Angel', 20, 'Am Fluss Fische angeln'],
];
const hasTool = (k) =>
  k === 'axe' ? state.axe : k === 'saw' ? state.saw : !!(state.tools && state.tools[k]);

function drawTool(c, k, x, y, S) {
  c.save();
  c.translate(x, y);
  const s = S / 32;
  c.scale(s, s);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const stick = (pts, w, col, dk) => {
    c.strokeStyle = dk || '#5a3a1e';
    c.lineWidth = w + 1.3;
    c.beginPath();
    c.moveTo(...pts[0]);
    if (pts.length === 3) c.quadraticCurveTo(...pts[1], ...pts[2]);
    else c.lineTo(...pts[1]);
    c.stroke();
    c.strokeStyle = col || '#c08a52';
    c.lineWidth = w;
    c.stroke();
    c.strokeStyle = 'rgba(255,240,210,.45)';
    c.lineWidth = w * 0.3;
    c.stroke();
  };
  const steel = (f, a, b, dark) => {
    const g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, dark ? '#5d646d' : '#f4f7fa');
    g.addColorStop(0.45, dark ? '#3c424a' : '#b9c1ca');
    g.addColorStop(1, dark ? '#24282d' : '#6d7680');
    c.fillStyle = g;
    c.strokeStyle = '#2f343a';
    c.lineWidth = 0.7;
    c.beginPath();
    f();
    c.closePath();
    c.fill();
    c.stroke();
  };
  const grip = (x1, y1, x2, y2, w, col) => {
    c.strokeStyle = '#1d1d1d';
    c.lineWidth = w + 1.2;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = w;
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 0.5;
    for (let t = 0.15; t < 1; t += 0.2) {
      const px = x1 + (x2 - x1) * t,
        py = y1 + (y2 - y1) * t,
        nx = -(y2 - y1),
        ny = x2 - x1,
        l = Math.hypot(nx, ny) || 1;
      c.beginPath();
      c.moveTo(px - ((nx / l) * w) / 2, py - ((ny / l) * w) / 2);
      c.lineTo(px + ((nx / l) * w) / 2, py + ((ny / l) * w) / 2);
      c.stroke();
    }
  };
  const bolt = (x1, y1) => {
    c.fillStyle = '#d9b45a';
    c.beginPath();
    c.arc(x1, y1, 0.9, 0, 7);
    c.fill();
    c.fillStyle = '#8a6a20';
    c.fillRect(x1 - 0.6, y1 - 0.1, 1.2, 0.3);
  };
  if (k === 'axe') {
    // Fällaxt: geschwungener Stiel, roter Kopf, blanke Schneide
    stick(
      [
        [-9, 15],
        [-1, 4],
        [6, -10],
      ],
      3.2,
      '#d4a46a',
    );
    grip(-9.5, 15, -6.5, 10.5, 3.6, '#2b2b2b');
    c.fillStyle = '#b5301f';
    c.strokeStyle = '#5a160d';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(1, -14);
    c.lineTo(9, -12);
    c.lineTo(9, -5);
    c.lineTo(1, -6);
    c.closePath();
    c.fill();
    c.stroke();
    steel(
      () => {
        c.moveTo(8.6, -12.5);
        c.quadraticCurveTo(15, -16, 17.5, -12);
        c.quadraticCurveTo(18.5, -7, 17, -2);
        c.quadraticCurveTo(14, -2.5, 8.6, -5);
      },
      [9, -14],
      [18, -2],
    );
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(17.2, -12);
    c.quadraticCurveTo(18, -7, 16.6, -2.6);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(2, -13, 5, 1.2);
  } else if (k === 'saw') {
    // Handsäge: breites Blatt mit Zähnen, Holzgriff mit Loch
    steel(
      () => {
        c.moveTo(-15, 1);
        c.lineTo(5, -8);
        c.lineTo(7, -8);
        c.lineTo(7, 5.5);
        c.lineTo(-15, 6);
      },
      [-15, -8],
      [7, 6],
    );
    c.fillStyle = '#2f343a';
    for (let i = -15; i < 6.5; i += 1.6) {
      c.beginPath();
      c.moveTo(i, 6);
      c.lineTo(i + 0.8, 7.6);
      c.lineTo(i + 1.6, 6);
      c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,.7)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-13, 2.2);
    c.lineTo(4, -5.6);
    c.stroke();
    c.fillStyle = '#8a4f2a';
    c.strokeStyle = '#4a2a14';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(6, -10);
    c.quadraticCurveTo(17, -12, 17, -2);
    c.lineTo(17, 7);
    c.quadraticCurveTo(12, 9, 6, 7);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#e9dcc3';
    c.beginPath();
    c.ellipse(12, -1, 2.6, 4.5, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#4a2a14';
    c.stroke();
    bolt(8.2, -6);
    bolt(8.2, 4);
  } else if (k === 'hammer') {
    // Klauenhammer: Stahlkopf mit Schlagfläche und Klaue, gelb-schwarzer Griff
    stick(
      [
        [-6, 15],
        [3, -7],
      ],
      3.2,
      '#d9b06e',
    );
    grip(-6.6, 15.5, -2.6, 6.2, 4, '#f2c12e');
    steel(
      () => {
        c.moveTo(-1, -11);
        c.lineTo(9, -11);
        c.lineTo(9, -6);
        c.lineTo(-1, -6);
      },
      [-1, -11],
      [9, -6],
      true,
    );
    steel(
      () => {
        c.moveTo(8.5, -12.2);
        c.lineTo(12.5, -12.2);
        c.lineTo(12.5, -4.8);
        c.lineTo(8.5, -4.8);
      },
      [8.5, -12],
      [12.5, -5],
    );
    c.fillStyle = '#3c424a';
    c.strokeStyle = '#24282d';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-1, -11);
    c.quadraticCurveTo(-7, -12, -10, -17);
    c.lineTo(-8.4, -17.5);
    c.quadraticCurveTo(-6, -14, -1, -8.5);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-1, -8);
    c.quadraticCurveTo(-6, -8, -9.5, -12);
    c.lineTo(-8, -13);
    c.quadraticCurveTo(-5, -10, -1, -6);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.fillRect(0, -10.4, 8, 1);
  } else if (k === 'shovel') {
    // Spaten: D-Griff, langer Stiel, spitzes Blatt
    stick(
      [
        [-11, -12],
        [4, 6],
      ],
      2.6,
      '#c9965c',
    );
    c.strokeStyle = '#1d1d1d';
    c.lineWidth = 2.4;
    c.beginPath();
    c.ellipse(-12.5, -14, 4, 2.4, -0.9, 0, 7);
    c.stroke();
    c.strokeStyle = '#3a3a3a';
    c.lineWidth = 1.4;
    c.stroke();
    steel(
      () => {
        c.moveTo(1.5, 3.5);
        c.lineTo(8.5, -2);
        c.quadraticCurveTo(14, 4, 17, 12);
        c.quadraticCurveTo(14.5, 15.5, 10.5, 16.5);
        c.quadraticCurveTo(5, 12, 1.5, 3.5);
      },
      [2, -2],
      [16, 16],
      true,
    );
    c.fillStyle = 'rgba(120,90,55,.55)';
    c.beginPath();
    c.ellipse(12.5, 12.5, 3, 2, 0.6, 0, 7);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(3, 4);
    c.quadraticCurveTo(7, 10, 10.5, 15.5);
    c.stroke();
  } else if (k === 'can') {
    // verzinkte Gießkanne mit Brause
    const g = c.createLinearGradient(-11, 0, 8, 0);
    g.addColorStop(0, '#cfd6dc');
    g.addColorStop(0.4, '#9aa6b0');
    g.addColorStop(1, '#5f6b75');
    c.fillStyle = g;
    c.strokeStyle = '#3e474f';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-10, -3);
    c.lineTo(6, -3);
    c.lineTo(7.5, 13);
    c.lineTo(-11.5, 13);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(-11, 4, 18.5, 1.2);
    c.fillRect(-11.3, 10, 19, 1.2);
    c.strokeStyle = '#7d8892';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(6, 8);
    c.lineTo(16, -5);
    c.stroke();
    c.strokeStyle = '#3e474f';
    c.lineWidth = 0.6;
    c.stroke();
    c.fillStyle = '#8a96a0';
    c.strokeStyle = '#3e474f';
    c.beginPath();
    c.ellipse(16.8, -6.2, 3.4, 2, -0.9, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = '#3e474f';
    for (const [a, b] of [
      [16, -6.5],
      [17.4, -5.4],
      [17.2, -7.3],
    ])
      c.fillRect(a, b, 0.6, 0.6);
    c.strokeStyle = '#7d8892';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-8, -3);
    c.quadraticCurveTo(-2, -14, 4, -3);
    c.stroke();
    c.beginPath();
    c.moveTo(-10, 0);
    c.quadraticCurveTo(-16, 4, -10.8, 10);
    c.stroke();
    c.fillStyle = 'rgba(140,210,255,.9)';
    for (const [a, b] of [
      [19.5, -3],
      [20.5, 0],
      [18.6, 1.5],
    ])
      c.fillRect(a, b, 1, 1.6);
  } else if (k === 'scythe') {
    // Sense: langer gebogener Stiel mit zwei Griffen, lange Klinge
    stick(
      [
        [-11, 15],
        [-6, 0],
        [0, -14],
      ],
      2.4,
      '#c9965c',
    );
    stick(
      [
        [-8, 7],
        [-4, 9],
      ],
      2,
      '#a8743f',
    );
    stick(
      [
        [-4, -6],
        [0, -4],
      ],
      2,
      '#a8743f',
    );
    steel(
      () => {
        c.moveTo(-0.5, -14.5);
        c.quadraticCurveTo(12, -18, 19, -8);
        c.quadraticCurveTo(10, -13, 0, -11.5);
      },
      [0, -18],
      [19, -8],
    );
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(1, -11.8);
    c.quadraticCurveTo(10, -13.2, 18.5, -8.4);
    c.stroke();
  } else if (k === 'pickaxe') {
    // Spitzhacke: dunkler Eisenkopf mit zwei Spitzen
    stick(
      [
        [-7, 15],
        [2, -8],
      ],
      3,
      '#c9965c',
    );
    grip(-7.4, 15.5, -4.4, 9, 3.6, '#7a3b1f');
    steel(
      () => {
        c.moveTo(-13, -3);
        c.quadraticCurveTo(-4, -12, 2, -11.5);
        c.quadraticCurveTo(9, -12, 17, -5);
        c.quadraticCurveTo(9, -8.6, 2, -8);
        c.quadraticCurveTo(-5, -8, -13, -3);
      },
      [-13, -12],
      [17, -3],
      true,
    );
    c.fillStyle = '#4e555e';
    c.fillRect(0, -12.6, 4, 5.4);
    c.strokeStyle = 'rgba(255,255,255,.5)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-11, -4);
    c.quadraticCurveTo(-4, -10.5, 2, -10.5);
    c.quadraticCurveTo(9, -10.5, 15.5, -5.6);
    c.stroke();
  } else if (k === 'rod') {
    // Angel: Rute mit Ringen, Rolle, Schnur, Pose
    c.strokeStyle = '#3a2a1e';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-13, 15);
    c.quadraticCurveTo(-2, 0, 14, -15);
    c.stroke();
    c.strokeStyle = '#2f5f8a';
    c.lineWidth = 1.6;
    c.stroke();
    grip(-13, 15, -9, 10.6, 3.2, '#c9a77a');
    for (const t of [0.35, 0.6, 0.82]) {
      const px = -13 + t * 27,
        py = 15 - t * 30 + Math.sin(t * 3) * 1.5;
      c.strokeStyle = '#9aa3ab';
      c.lineWidth = 0.6;
      c.beginPath();
      c.arc(px, py, 0.9, 0, 7);
      c.stroke();
    }
    c.fillStyle = '#3a3a3a';
    c.beginPath();
    c.arc(-6.5, 8.5, 3.2, 0, 7);
    c.fill();
    c.fillStyle = '#b9c1ca';
    c.beginPath();
    c.arc(-6.5, 8.5, 1.8, 0, 7);
    c.fill();
    c.strokeStyle = '#3a3a3a';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6.5, 8.5);
    c.lineTo(-3.8, 10.5);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 0.45;
    c.beginPath();
    c.moveTo(14, -15);
    c.quadraticCurveTo(16, -4, 15, 5);
    c.stroke();
    c.fillStyle = '#e5484d';
    c.beginPath();
    c.ellipse(15, 6.5, 1.5, 2.2, 0, 0, 7);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(13.6, 6.5, 2.8, 1);
  }
  c.restore();
}

function buildShopInterior() {
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(1),
    objs: [],
    labels: [[1.15, 12.55, 'Werkstatt']],
  };
  for (let i = 0; i < IW; i++) {
    m.T[i] = 0;
    m.T[(IH - 1) * IW + i] = 0;
  }
  for (let j = 0; j < IH; j++) {
    m.T[j * IW] = 0;
    m.T[j * IW + IW - 1] = 0;
  }
  for (let j = 1; j < IH - 1; j++) for (let i = 1; i < IW - 1; i++) m.T[j * IW + i] = 4;
  const O = (o) => {
    o.solid = o.solid !== false;
    m.objs.push(o);
    return o;
  };
  TOOLS.forEach(([k, n, price, what], i) => {
    const own = hasTool(k);
    O({
      k: 'toolrack',
      tool: k,
      x: 2 + i * 2,
      y: 1,
      w: 1,
      h: 1,
      ix: 2.5 + i * 2,
      iy: 2.4,
      r: 1,
      txt: own
        ? `${n}: hast du schon (${what})`
        : price
          ? `${n} kaufen: ${price} Münzen (${what})`
          : `${n} nehmen (${what})`,
      act: own ? null : () => takeTool(k, n, price, what),
    });
  });
  O({
    k: 'bench',
    x: 8,
    y: 6,
    w: 3,
    h: 1,
    ix: 9.5,
    iy: 7.5,
    r: 1.6,
    txt: 'Werkbank: 1 Holz → 2 Bretter sägen',
    act: sawWood,
  });
  O({
    k: 'grind',
    x: 15,
    y: 6,
    w: 1,
    h: 1,
    ix: 15.5,
    iy: 7.4,
    r: 1.2,
    txt: 'Axt am Schleifstein schärfen',
    act: () => {
      if (!state.axe) return toast('Du hast noch keine Axt.');
      state.sharp = state.day;
      toast('<b>Zzzing!</b> Deine Axt ist scharf. Heute fällst du Bäume viel schneller.');
      chips(15.5, 6.6, 8, ['#ffe9a8', '#fff', '#ffd23f'], 12);
    },
  });
  O({
    k: 'sawhorse',
    x: 3,
    y: 9,
    w: 2,
    h: 1,
    ix: 4,
    iy: 10.4,
    r: 1.3,
    txt: 'Holzbock ansehen',
    act: () => toast('Ein alter Holzbock. Hier wurden schon viele Bretter gesägt.'),
  });
  O({
    k: 'planks',
    x: 15,
    y: 9,
    w: 2,
    h: 1,
    ix: 16,
    iy: 10.4,
    r: 1.3,
    txt: 'Bretterstapel',
    act: () =>
      toast(`Du hast ${fmt(state.inv.plank, 'plank')} und ${fmt(state.inv.wood, 'wood')} im Rucksack.`),
  });
  O({ k: 'barrel', x: 18, y: 11, w: 1, h: 1 });
  O({ k: 'boxes', x: 1, y: 11, w: 1, h: 1 });
  O({ k: 'shelf', x: 18, y: 1, w: 2, h: 1 });
  O({
    k: 'door',
    x: 10,
    y: 13,
    w: 1,
    h: 1,
    solid: false,
    ix: 10.5,
    iy: 12.6,
    r: 1.1,
    txt: 'Werkstatt verlassen',
    act: leaveHouse,
  });
  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  for (let i = 0; i < m.S.length; i++) if (m.T[i] === 0) m.S[i] = 1;
  return m;
}

function enterShop() {
  scene = { shop: true, house: { n: 0 }, floor: 0, map: buildShopInterior(), outX: 34, outY: 44.7 };
  player.x = 10.5;
  player.y = 11.9;
  player.face = 'up';
  player.ang = -Math.PI / 2;
  toast('<b>Werkstatt.</b> An der Wand hängen die Werkzeuge, an der Werkbank sägst du Holz.', 3500);
}

function takeTool(k, n, price, what) {
  if (price && state.coins < price) return toast(`Für ${n} brauchst du ${price} Glücksmünzen.`);
  state.coins -= price;
  if (k === 'axe') state.axe = true;
  else if (k === 'saw') state.saw = true;
  else {
    state.tools = state.tools || {};
    state.tools[k] = 1;
  }
  if (k === 'axe' || k === 'saw') moment('tools', 'Axt und Säge aus der Werkstatt geholt.', 'axe');
  else moment('tool_' + k, `Neues Werkzeug: ${n}!`, 'tool_' + k);
  toast(`<b>${n}</b> ist jetzt in deinem Rucksack. ${what}.`, 4000);
  float(player.x, player.y - 1.6, n + '!', '#ffd23f');
  scene.map = buildShopInterior();
  changed();
}

function sawWood() {
  if (!state.saw) return toast('Dafür brauchst du die <b>Säge</b>. Sie hängt an der Werkzeugwand.');
  if (state.inv.wood < 1) return toast('Du brauchst Holz. Fäll mit der Axt einen Baum.');
  state.inv.wood--;
  state.inv.plank += 2;
  state.stats.planks += 2;
  chips(9.5, 6.6, 10, WOODC, 10);
  float(9.5, 6, '+2 Bretter', '#ffb36b');
  changed();
}

// Felsen
const ROCKS = [];

function addRock(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
  const i = tileIndex(x, y);
  if (solid[i] || fence[i] || (ground[i] !== 0 && ground[i] !== 8)) return;
  solid[i] = 1;
  HOP[i] = 2;
  ROCKS.push({ x, y, id: ROCKS.length, v: hh(x, y) % 3 });
}

function placeRocks() {
  const r = rng(777);
  let n = 0;
  for (let tries = 0; tries < 600 && n < 18; tries++) {
    const x = Math.floor(r() * MAP_W),
      y = Math.floor(r() * MAP_H);
    const ok =
      (x >= 43 && x <= 46) ||
      (x >= 53 && x <= 55) ||
      (x > 56 && (y < 7 || y > 44)) ||
      (x < 41 && x > 2 && (y === 2 || y === 45 || x === 2 || x === 40));
    if (!ok) continue;
    const before = ROCKS.length;
    addRock(x, y);
    if (ROCKS.length > before) n++;
  }
}

function drawRock(c, rk) {
  const X = rk.x * TILE + 16,
    Y = rk.y * TILE + 26,
    mined = (state.mined || []).includes(rk.id),
    s = mined ? 0.45 : 1;
  blob(c, X + 6, Y + 2, 16 * s, 5 * s, '#000', 0.2);
  const g = c.createRadialGradient(X - 5 * s, Y - 14 * s, 2, X, Y - 7 * s, 18 * s);
  g.addColorStop(0, '#c9c4b8');
  g.addColorStop(0.6, '#8f897e');
  g.addColorStop(1, '#5f5a52');
  c.fillStyle = g;
  c.beginPath();
  const pts = [
    [-14, 0],
    [-13, -9],
    [-6, -17],
    [4, -18],
    [12, -11],
    [14, -2],
    [8, 2],
    [-6, 2],
  ];
  pts.forEach(([a, b], i) => {
    const q = [X + a * s * (1 + (rk.v - 1) * 0.08), Y + b * s];
    i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
  });
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(50,45,40,.45)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(X - 4 * s, Y - 15 * s);
  c.lineTo(X - 1 * s, Y - 8 * s);
  c.lineTo(X + 5 * s, Y - 6 * s);
  c.stroke();
  if (!mined) {
    c.fillStyle = 'rgba(120,160,80,.6)';
    c.beginPath();
    c.ellipse(X - 9, Y - 2, 4, 2, 0, 0, 7);
    c.fill();
  }
}

function startMine(rk) {
  if (!hasTool('pickaxe')) return toast('Dafür brauchst du eine <b>Spitzhacke</b> aus der Werkstatt.');
  player.ang = Math.atan2(rk.y + 0.8 - player.y, rk.x + 0.5 - player.x);
  player.work = { kind: 'mine', rock: rk, t: 0, hits: 0 };
}

// Angeln
function nearWater() {
  if (scene) return null;
  for (const d of [-1, 1]) {
    const tx = Math.floor(player.x + d * 0.95),
      ty = Math.floor(player.y - 0.1);
    if (tx >= 0 && tx < MAP_W && (ground[tileIndex(tx, ty)] === 3 || ground[tileIndex(tx, ty)] === 9))
      return { x: tx + 0.5, y: player.y - 0.1, d };
  }
  return null;
}

function startFish(w) {
  if (!hasTool('rod')) return toast('Dafür brauchst du eine <b>Angel</b> aus der Werkstatt.');
  player.ang = w.d > 0 ? 0 : Math.PI;
  player.work = { kind: 'fish', t: 0, dur: 2.5 + Math.random() * 2.5, wx: w.x + w.d * 0.6, wy: w.y };
}
