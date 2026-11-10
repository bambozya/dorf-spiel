// ================= Scheune von innen: tägliche Samen =================
const BARNSEEDS = [
  ['seed_carrot', 'Karottensamen', 3, '#e8731c'],
  ['seed_wheat', 'Weizensamen', 2, '#d9a72e'],
  ['seed_pumpkin', 'Kürbissamen', 1, '#d9621a'],
];
const barnTaken = (k) => state.barnT && state.barnT.day === state.day && state.barnT.k[k];

function takeSeeds(k, n, amt) {
  if (barnTaken(k))
    return toast(`Den ${n}-Sack hast du heute schon geleert. Morgen früh ist er wieder voll.`);
  if (!state.barnT || state.barnT.day !== state.day) state.barnT = { day: state.day, k: {} };
  const a = state.day === 1 && k === 'seed_carrot' ? 4 : amt;
  state.barnT.k[k] = 1;
  state.barnDay = state.day;
  state.inv[k] += a;
  float(player.x, player.y - 1.6, '+' + fmt(a, k), '#b9f0a0');
  chips(player.x, player.y - 0.4, 8, ['#d9b45a', '#b98a5a', '#f2d27a'], 10);
  changed();
}

function buildBarnInterior() {
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(5),
    objs: [],
    labels: [[1.15, 12.55, 'Scheune']],
  };
  for (let i = 0; i < IW; i++) {
    m.T[i] = 0;
    m.T[(IH - 1) * IW + i] = 0;
  }
  for (let j = 0; j < IH; j++) {
    m.T[j * IW] = 0;
    m.T[j * IW + IW - 1] = 0;
  }
  const O = (o) => {
    o.solid = o.solid !== false;
    m.objs.push(o);
    return o;
  };
  if (houseMode()) {
    for (let n = 1; n <= 6; n++) {
      const mine = isResident(n) && houseLock(n);
      O({
        k: 'sack',
        house: n,
        col: ['#e5484d', '#f2a33a', '#3f9a3a', '#3fa7d6', '#8a5cd6', '#d94f7a'][n - 1],
        x: 4 + n * 2 - 1,
        y: 4,
        w: 1,
        h: 1,
        ix: 4.5 + n * 2 - 1,
        iy: 5.5,
        r: 1.1,
        txt: !houseLock(n)
          ? `Saatsack von Haus ${n} (Haus ist noch frei)`
          : !mine
            ? `Saatsack von Haus ${n} (gehört nicht dir)`
            : sackTaken(n)
              ? `Saatsack von Haus ${n}: heute leer`
              : `Saatsack von Haus ${n} nehmen (Karotten-, Weizen-, Kürbissamen)`,
        act: async () => {
          await takeHouseSack(n);
          if (scene && scene.label === 'Scheune') scene.map = buildBarnInterior();
        },
      });
    }
  } else
    BARNSEEDS.forEach(([k, n, amt, col], i) =>
      O({
        k: 'sack',
        seed: k,
        col,
        x: 8 + i * 2,
        y: 4,
        w: 1,
        h: 1,
        ix: 8.5 + i * 2,
        iy: 5.5,
        r: 1.1,
        txt: barnTaken(k)
          ? `${n}: heute leer`
          : `${n} nehmen (+${state.day === 1 && k === 'seed_carrot' ? 4 : amt})`,
        act: () => {
          takeSeeds(k, n, amt);
          scene.map = buildBarnInterior();
        },
      }),
    );
  O({ k: 'hay', x: 1, y: 1, w: 2, h: 1 });
  O({ k: 'hay', x: 3, y: 1, w: 2, h: 1 });
  O({ k: 'hay', x: 1, y: 2, w: 2, h: 1 });
  O({ k: 'hay', x: 16, y: 1, w: 2, h: 1 });
  O({ k: 'hay', x: 18, y: 1, w: 2, h: 1 });
  O({ k: 'hay', x: 18, y: 2, w: 2, h: 1 });
  O({
    k: 'ladder',
    x: 13,
    y: 1,
    w: 1,
    h: 1,
    ix: 13.5,
    iy: 2.4,
    r: 1,
    txt: 'Leiter zum Heuboden',
    act: () => toast('Oben auf dem Heuboden ist nur Heu. Und eine schlafende Katze.'),
  });
  O({ k: 'fork', x: 6, y: 1, w: 1, h: 1 });
  O({
    k: 'cart',
    x: 2,
    y: 8,
    w: 3,
    h: 2,
    ix: 3.5,
    iy: 10.5,
    r: 1.6,
    txt: 'Heuwagen',
    act: () => toast('Ein alter Heuwagen. Die Räder quietschen ein bisschen.'),
  });
  O({ k: 'hay', x: 16, y: 9, w: 2, h: 1 });
  O({ k: 'hay', x: 17, y: 10, w: 2, h: 1 });
  O({ k: 'barrel', x: 19, y: 11, w: 1, h: 1 });
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
    txt: 'Scheune verlassen',
    act: leaveHouse,
  });
  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  for (let i = 0; i < m.S.length; i++) if (m.T[i] === 0) m.S[i] = 1;
  return m;
}

function enterBarn() {
  scene = {
    shop: true,
    label: 'Scheune',
    house: { n: 0 },
    floor: 0,
    map: buildBarnInterior(),
    outX: 34.5,
    outY: 8.7,
  };
  player.x = 10.5;
  player.y = 11.9;
  player.face = 'up';
  player.ang = -Math.PI / 2;
  toast(
    houseMode()
      ? '<b>Scheune.</b> Jedes Haus hat seinen eigenen Saatsack. Nur die Bewohner dürfen ihn nehmen, jeden Morgen ist er wieder voll.'
      : '<b>Scheune.</b> Vorne stehen die Saatsäcke. Jeden Morgen sind sie wieder voll.',
    4000,
  );
}
