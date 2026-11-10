// ================= Bauen: Etagen anbauen, Möbel verschieben und kaufen =================
const FLOORCOST = { coins: 80, plank: 15 },
  MAXEXTRA = 3;
const FNAME = {
  bed: 'Bett',
  nightstand: 'Nachttisch',
  wardrobe: 'Schrank',
  sofa: 'Sofa',
  tv: 'Fernseher',
  shelf: 'Regal',
  plant: 'Pflanze',
  table: 'Tisch',
  ctable: 'Couchtisch',
  chair: 'Stuhl',
  rug: 'Teppich',
  fridge: 'Kühlschrank',
  counter: 'Küchenschrank',
  sink: 'Spüle',
  stove: 'Herd',
  oven: 'Ofen',
  pantry: 'Vorratsregal',
  tub: 'Badewanne',
  toilet: 'Toilette',
  basin: 'Waschbecken',
  boxes: 'Kisten',
  pingpong: 'Tischtennisplatte',
};
const SHOPF = [
  ['bed', 'Bett', 30, 1, 2],
  ['sofa', 'Sofa', 25, 3, 1],
  ['armchair', 'Sessel', 12, 1, 1],
  ['table', 'Tisch', 15, 2, 1],
  ['ctable', 'Couchtisch', 10, 2, 1],
  ['shelf', 'Bücherregal', 20, 2, 1],
  ['tv', 'Fernseher', 40, 2, 1],
  ['wardrobe', 'Schrank', 20, 1, 1],
  ['nightstand', 'Nachttisch', 8, 1, 1],
  ['plant', 'Pflanze', 5, 1, 1],
  ['rug', 'Teppich', 10, 3, 2],
  ['boxes', 'Kisten', 5, 1, 1],
  ['pingpong', 'Tischtennisplatte', 50, 4, 2],
];
const FCOLS = [
  '#e5484d',
  '#3fa7d6',
  '#3f9a3a',
  '#f2b134',
  '#8e5bd6',
  '#ff8fb1',
  '#2f7a5a',
  '#3d6fb0',
  '#b3372a',
];
let buildMode = false,
  carry = null;
const homeOf = (n) => {
  state.homes = state.homes || {};
  return state.homes[n] || (state.homes[n] = { extra: 0, f: {} });
};
const extraOf = (n) => (state.homes && state.homes[n] && state.homes[n].extra) || 0;
const editsOf = (n, f) => {
  const h = homeOf(n);
  return h.f[f] || (h.f[f] = { mv: {}, add: [] });
};

function rebuildSolid(m) {
  for (let i = 0; i < m.S.length; i++) m.S[i] = m.T[i] === 0 ? 1 : 0;
  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  m.K = null;
}

function shiftObj(o, dx, dy) {
  o.x += dx;
  o.y += dy;
  for (const [a, b] of [
    ['ix', 'iy'],
    ['hx', 'hy'],
    ['wx', 'wy'],
  ])
    if (o[a] !== undefined) {
      o[a] += dx;
      o[b] += dy;
    }
}

function makeFurn(n, k, x, y, c) {
  const def = SHOPF.find((s) => s[0] === k) || [k, FNAME[k] || k, 0, 1, 1];
  const kind = k === 'armchair' ? 'sofa' : k;
  const o = {
    k: kind,
    x,
    y,
    w: def[3],
    h: def[4],
    c: c || pick(FCOLS, Math.random),
    solid: kind !== 'rug',
    src: 'add',
    r: 1.3,
  };
  o.ix = x + o.w / 2;
  o.iy = y + o.h + 0.35;
  if (kind === 'bed') {
    o.c = c || BEDCOL[(x + y) % 7];
    o.txt = 'Ins Bett legen';
    o.ix = x + 1.2;
    o.iy = y + 1.1;
    o.hx = x + 0.5;
    o.hy = y + 0.55;
    o.wx = x + 1.6;
    o.wy = y + 1.4;
    o.act = () => goSleep(o);
  } else if (kind === 'sofa') {
    o.txt = o.w > 1 ? 'Auf dem Sofa ausruhen' : 'Im Sessel sitzen';
    o.act = rest;
  } else if (kind === 'tv') {
    o.txt = 'Fernsehen';
    o.act = () =>
      toast(
        hasPower(n)
          ? 'Im Fernsehen läuft eine Sendung über Pferde.'
          : 'Ohne Strom bleibt der Fernseher schwarz.',
      );
  } else if (kind === 'shelf') {
    o.txt = 'Ein Buch lesen';
    o.act = () => toast('Du liest ein Buch über Häuserbau. Spannend!');
  } else if (kind === 'pingpong') {
    o.txt = 'Tischtennis spielen';
    o.iy = y + o.h + 0.6;
    o.r = 1.6;
    o.act = pingpong;
  }
  return o;
}

function buildExtra(h, floor) {
  const ex = extraOf(h.n),
    m = {
      w: IW,
      h: IH,
      S: new Uint8Array(IW * IH),
      T: new Uint8Array(IW * IH).fill(1),
      objs: [],
      labels: [],
    };
  for (let i = 0; i < IW; i++) {
    m.T[i] = 0;
    m.T[(IH - 1) * IW + i] = 0;
  }
  for (let j = 0; j < IH; j++) {
    m.T[j * IW] = 0;
    m.T[j * IW + IW - 1] = 0;
  }
  m.objs.push({
    k: 'stairs',
    x: 17,
    y: 1,
    w: 2,
    h: 2,
    solid: false,
    dir: 'down',
    ix: 18,
    iy: 3.3,
    r: 1.3,
    txt: 'Nach unten gehen',
    act: () => (floor === 2 ? goFloor(1, 17.2, 6.9) : goFloor(floor - 1, 3.4, 3)),
  });
  if (floor - 1 < ex)
    m.objs.push({
      k: 'stairs',
      x: 1,
      y: 1,
      w: 2,
      h: 2,
      solid: false,
      dir: 'up',
      ix: 2,
      iy: 3.3,
      r: 1.3,
      txt: 'Nach oben gehen',
      act: () => goFloor(floor + 1, 16.2, 3),
    });
  m.labels.push([1.15, 12.55, `${floor}. Obergeschoss · Hier kannst du Möbel aufstellen (Bauen)`]);
  rebuildSolid(m);
  return m;
}

function applyEdits(m, n, floor) {
  try {
    afterBuild(m);
  } catch (e) {}
  m.objs.forEach((o, i) => {
    o.di = i;
    o.x0 = o.x;
    o.y0 = o.y;
    if (!o.src) o.src = 'def';
  });
  const e = state.homes && state.homes[n] && state.homes[n].f[floor];
  if (!e) return;
  for (const [i, p] of Object.entries(e.mv)) {
    const o = m.objs[+i];
    if (o) shiftObj(o, p[0] - o.x, p[1] - o.y);
  }
  e.add.forEach((a, j) => {
    if (!a || a.x < 0) return;
    const o = makeFurn(n, a.k, a.x, a.y, a.c);
    o.ai = j;
    m.objs.push(o);
  });
  afterBuild(m);
  rebuildSolid(m);
}

function afterBuild(m) {
  for (const o of m.objs) {
    if (['fridge', 'sink', 'stove', 'oven', 'counter', 'pantry'].includes(o.k)) {
      const kk = o.k;
      o.txt = {
        fridge: 'Kühlschrank öffnen',
        sink: 'Wasserhahn benutzen',
        stove: 'Herd: kochen und braten',
        oven: 'Backofen: backen',
        counter: 'Arbeitsplatte: Salat schneiden',
        pantry: 'Vorratsregal ansehen',
      }[kk];
      o.act = () => kitchenUse(kk);
    }
    if (o.k === 'sofa') {
      o.txt = o.w > 1 ? 'Aufs Sofa setzen' : 'In den Sessel setzen';
      o.act = () => sitDown(o);
    }
    if (o.k === 'tv') {
      o.txt = 'Fernseher einschalten: deine größten Momente';
      o.act = openTV;
    }
  }
}

function carryTarget() {
  const o = carry.o,
    ca = Math.cos(player.ang),
    sa = Math.sin(player.ang);
  const cx = player.x + ca * (1 + o.w / 2),
    cy = player.y - 0.3 + sa * (1 + o.h / 2);
  return [Math.round(cx - o.w / 2), Math.round(cy - o.h / 2)];
}

function canPlace(x, y, o) {
  const m = scene.map;
  for (let j = y; j < y + o.h; j++)
    for (let i = x; i < x + o.w; i++) {
      if (i < 1 || j < 1 || i >= IW - 1 || j >= IH - 1) return false;
      const t = j * IW + i;
      if (m.T[t] === 0) return false;
      if (o.solid && (m.S[t] || (Math.floor(player.x) === i && Math.floor(player.y - 0.1) === j)))
        return false;
      if (
        m.objs.some(
          (q) =>
            (q.k === 'stairs' || q.k === 'door') && i >= q.x && i < q.x + q.w && j >= q.y && j < q.y + q.h,
        )
      )
        return false;
    }
  return true;
}

function pickUp(o) {
  const m = scene.map;
  m.objs.splice(m.objs.indexOf(o), 1);
  rebuildSolid(m);
  carry = { o, ox: o.x, oy: o.y };
  toast(`Du trägst: <b>${FNAME[o.k] || 'Möbel'}</b>. Geh dorthin, wo es stehen soll, und drück P.`, 3000);
}

function placeCarry() {
  const o = carry.o,
    [x, y] = carryTarget();
  if (!canPlace(x, y, o)) return toast('Hier ist kein Platz. Such dir eine freie Stelle.');
  shiftObj(o, x - o.x, y - o.y);
  scene.map.objs.push(o);
  rebuildSolid(scene.map);
  const e = editsOf(scene.house.n, scene.floor);
  if (o.src === 'add')
    e.add[o.ai] = { k: o.k === 'sofa' && o.w === 1 ? 'armchair' : o.k, x: o.x, y: o.y, c: o.c };
  else e.mv[o.di] = [o.x, o.y];
  carry = null;
  float(player.x, player.y - 1.6, 'abgestellt!', '#b9f0a0');
  changed();
}

function cancelCarry() {
  if (!carry) return;
  const o = carry.o;
  if (carry.ox < 0) {
    const e = editsOf(scene.house.n, scene.floor);
    e.add[o.ai] = null;
    state.coins += carry.price || 0;
    carry = null;
    toast('Das gekaufte Möbelstück wurde nicht aufgestellt. Du hast deine Münzen zurück.');
    changed();
    return;
  }
  shiftObj(o, carry.ox - o.x, carry.oy - o.y);
  if (scene) {
    scene.map.objs.push(o);
    rebuildSolid(scene.map);
  }
  carry = null;
}

function removeCarry() {
  if (!carry) return;
  const o = carry.o;
  if (o.src !== 'add')
    return toast('Die Möbel, die schon im Haus waren, bleiben im Haus. Du kannst sie aber verschieben.');
  if (!carry.isNew) {
    const e = editsOf(scene.house.n, scene.floor);
    e.add[o.ai] = null;
    e.add = e.add;
  }
  carry = null;
  toast('Weggeräumt.');
  changed();
}

function buildInteractions() {
  if (carry) {
    const [x, y] = carryTarget();
    const ok = canPlace(x, y, carry.o);
    return [
      {
        x: player.x,
        y: player.y,
        r: 99,
        text: ok ? `${FNAME[carry.o.k] || 'Möbel'} hier abstellen` : 'Hier ist kein Platz',
        act: placeCarry,
      },
    ];
  }
  return scene.map.objs
    .filter((o) => o.k !== 'stairs' && o.k !== 'door')
    .map((o) => ({
      x: o.x + o.w / 2,
      y: o.y + o.h / 2 + 0.3,
      r: Math.max(o.w, o.h) / 2 + 0.9,
      text: 'Aufheben: ' + (FNAME[o.k] || 'Möbel'),
      act: () => pickUp(o),
    }));
}

function setBuild(on) {
  if (on && !scene) return;
  buildMode = on;
  if (!on) cancelCarry();
  $('bBuild').classList.toggle('on', on);
  $('buildbar').hidden = !on;
  if (on)
    toast(
      '<b>Baumodus:</b> Geh zu einem Möbelstück und drück P (oder E) zum Aufheben. Dann wieder P zum Abstellen. Neue Möbel bekommst du unter „Möbel kaufen“.',
      5500,
    );
}

function furnShop() {
  openModal(`<h2>Möbel kaufen</h2><p>Du hast <b>${state.coins}</b> Glücksmünzen. Nach dem Kauf trägst du das Möbelstück und stellst es mit E ab.</p>
    <div class="shopgrid">${SHOPF.map((f, i) => `<button class="go" data-i="${i}" ${state.coins < f[2] ? 'disabled' : ''}>${f[1]} · ${f[2]}</button>`).join('')}</div>
    <div class="actions"><button id="cls">Schließen</button></div>`);
  $('cls').onclick = closeModal;
  sheet.querySelectorAll('.shopgrid button').forEach(
    (b) =>
      (b.onclick = () => {
        const f = SHOPF[+b.dataset.i];
        if (state.coins < f[2]) return;
        cancelCarry();
        state.coins -= f[2];
        moment('furn1', 'Das erste eigene Möbelstück gekauft: ' + f[1] + '!', 'bed');
        const n = scene.house.n,
          e = editsOf(n, scene.floor),
          o = makeFurn(n, f[0], 0, 0);
        o.ai = e.add.length;
        e.add.push({ k: f[0], x: -50, y: -50, c: o.c });
        carry = { o, ox: -50, oy: -50, price: f[2] };
        carry.o.x = -50;
        carry.o.y = -50;
        closeModal();
        changed();
        toast(`Gekauft: <b>${f[1]}</b>. Such dir einen Platz und drück E.`, 3500);
      }),
  );
}

function addFloor(h, sty) {
  const n = h.n,
    ex = extraOf(n);
  if (ex >= MAXEXTRA) return toast('Höher geht es nicht. Das Haus hat schon die meisten Etagen.');
  if (!hasTool('hammer'))
    return toast('Zum Bauen brauchst du einen <b>Hammer</b>. Er hängt in der Werkstatt an der Wand.');
  if (state.coins < FLOORCOST.coins || state.inv.plank < FLOORCOST.plank)
    return toast(
      `Für eine neue Etage brauchst du ${FLOORCOST.coins} Glücksmünzen und ${FLOORCOST.plank} Bretter.`,
    );
  state.coins -= FLOORCOST.coins;
  state.inv.plank -= FLOORCOST.plank;
  {
    const hm = homeOf(n);
    hm.extra = ex + 1;
    hm.fs = hm.fs || [];
    hm.fs[ex] = sty || hm.style || 'classic';
  }
  moment('floor' + n + '_' + (ex + 1), `Haus ${n} um eine Etage größer gebaut!`, 'house');
  if (scene && scene.house === h && scene.floor >= 1) scene.map = buildInterior(h, scene.floor);
  toast(
    `<b>Haus ${n} ist jetzt ${ex + 3} Etagen hoch!</b> Die Treppe nach oben findest du im Obergeschoss rechts im Flur.`,
    5000,
  );
  float(player.x, player.y - 1.6, 'Etage gebaut!', '#ffd23f');
  changed();
}

// ================= Sofa: richtig hinsetzen =================
function sitDown(o) {
  if (player.mount) return;
  const sx = Math.max(o.x + 0.5, Math.min(o.x + o.w - 0.5, player.x)),
    seat = o.x + Math.floor(sx - o.x) + 0.5;
  player.sit = { o, px: player.x, py: player.y };
  player.x = seat;
  player.y = o.y + 0.62;
  player.ang = Math.PI / 2;
  player.rang = Math.PI / 2;
  player.moving = false;
  toast('Du sitzt gemütlich. Mit der <b>Leertaste</b> stehst du wieder auf.', 2600);
}

function standUp() {
  const s = player.sit;
  if (!s) return;
  player.sit = null;
  const o = s.o;
  let nx = player.x,
    ny = o.y + o.h + 0.45;
  if (blocked(nx, ny)) {
    nx = s.px;
    ny = s.py;
  }
  player.x = nx;
  player.y = ny;
}
