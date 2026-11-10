// ================= Häuser von innen =================
const IW = 21,
  IH = 14;
const SLOTS = {
  1: ['bed', 'bed', 'kitchen', 'living', 'bath', 'store', 'store', 'store'],
  2: ['bed', 'bed', 'bed', 'living', 'bed', 'bed', 'bed', 'bath'],
  3: ['bed', 'bed', 'bed', 'living', 'bed', 'bed', 'bed', 'bath'],
  4: ['bed', 'bed', 'bed', 'living', 'bed', 'bed', 'bed', 'bath'],
  5: ['bed', 'bed', 'bed', 'bed', 'bed', 'bed', 'bed', 'store'],
  6: ['bed', 'bed', 'store', 'store', 'bed', 'bed', 'store', 'store'],
};
const BEDCOL = ['#e5484d', '#3fa7d6', '#3f9a3a', '#f2b134', '#8e5bd6', '#ff8fb1', '#2f7a5a'];
const PANTRY =
  'Mehl, Zucker, Salz, Hefe, Backpulver, Kakao, Vanillezucker, Haferflocken, Nudeln, Reis, Öl und Gewürze';
const FRIDGE = 'Milch, Butter, Eier, Sahne, Käse, Joghurt und Marmelade';
const KTOOLS =
  'Rührschüssel, Schneebesen, Nudelholz, Backbleche, Kuchenform, Waage, Messbecher, Töpfe, Pfannen und Kochlöffel';
let scene = null;
const sceneId = () => (scene ? 'h' + scene.house.n + 'f' + scene.floor : 'out');

function buildInterior(h, floor) {
  if (floor >= 2) {
    const m = buildExtra(h, floor);
    applyEdits(m, h.n, floor);
    return m;
  }
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(1),
    objs: [],
    labels: [],
  };
  const T = (x, y, w, hh, v) => {
    for (let j = y; j < y + hh; j++)
      for (let i = x; i < x + w; i++) {
        m.T[j * IW + i] = v;
        m.S[j * IW + i] = v === 0 ? 1 : 0;
      }
  };
  const O = (o) => {
    if (o.solid !== false) {
      o.solid = true;
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
    }
    m.objs.push(o);
    return o;
  };
  T(0, 0, IW, 1, 0);
  T(0, IH - 1, IW, 1, 0);
  T(0, 0, 1, IH, 0);
  T(IW - 1, 0, 1, IH, 0);
  const n = h.n;
  if (floor === 0) {
    T(8, 1, 1, 12, 0);
    T(12, 1, 1, 12, 0);
    T(1, 1, 7, 12, 2);
    T(9, 1, 3, 12, 4);
    T(8, 9, 1, 2, 4);
    T(12, 9, 1, 2, 4);
    O({
      k: 'stairs',
      x: 9,
      y: 1,
      w: 3,
      h: 2,
      solid: false,
      dir: 'up',
      ix: 10.5,
      iy: 3.3,
      r: 1.4,
      txt: 'Nach oben gehen',
      act: () => goFloor(1, 3.6, 6.9),
    });
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
      txt: 'Haus verlassen',
      act: leaveHouse,
    });
    kitchen(m, O, 1, 1, 7, 12, true, n);
    m.labels.push([1.15, 12.55, 'Küche']);
    if (n === 1) {
      m.labels.push([13.15, 12.55, 'Großer Raum']);
      O({ k: 'rug', x: 14, y: 7, w: 5, h: 4, solid: false, c: '#5a7ab0' });
      O({
        k: 'pingpong',
        x: 14,
        y: 3,
        w: 4,
        h: 2,
        ix: 16,
        iy: 5.6,
        r: 1.6,
        txt: 'Tischtennis spielen',
        act: pingpong,
      });
      O({
        k: 'sofa',
        x: 15,
        y: 10,
        w: 2,
        h: 1,
        c: '#b3372a',
        ix: 16,
        iy: 9.5,
        r: 1.3,
        txt: 'Aufs kleine Sofa setzen',
        act: rest,
      });
      O({ k: 'plant', x: 19, y: 1, w: 1, h: 1 });
      O({ k: 'plant', x: 13, y: 11, w: 1, h: 1 });
      O({ k: 'shelf', x: 13, y: 1, w: 2, h: 1 });
    } else {
      m.labels.push([13.15, 12.55, 'Wohnzimmer']);
      living(m, O, 13, 1, 7, 12, true, n);
    }
  } else {
    T(1, 5, 19, 1, 0);
    T(1, 8, 19, 1, 0);
    for (const x of [5, 10, 15]) {
      T(x, 1, 1, 4, 0);
      T(x, 9, 1, 4, 0);
    }
    T(1, 6, 19, 2, 4);
    O({
      k: 'stairs',
      x: 1,
      y: 6,
      w: 2,
      h: 2,
      solid: false,
      dir: 'down',
      ix: 2,
      iy: 7,
      r: 1.2,
      txt: 'Nach unten gehen',
      act: () => goFloor(0, 10.5, 3.8),
    });
    if (extraOf(n) > 0)
      O({
        k: 'stairs',
        x: 18,
        y: 6,
        w: 2,
        h: 2,
        solid: false,
        dir: 'up',
        ix: 18.6,
        iy: 7,
        r: 1.2,
        txt: 'Nach oben gehen (neue Etage)',
        act: () => goFloor(2, 16.2, 3),
      });
    let bedN = 0;
    SLOTS[n].forEach((typ, k) => {
      const col = k % 4,
        top = k < 4,
        rx = 1 + col * 5,
        ry = top ? 1 : 9;
      T(rx, ry, 4, 4, typ === 'bath' ? 3 : typ === 'kitchen' ? 2 : 1);
      T(rx + 1, top ? 5 : 8, 2, 1, 4);
      const back = top ? ry : ry + 3,
        front = top ? ry + 3 : ry,
        lab = (t) => m.labels.push([rx + 0.1, top ? ry + 3.62 : ry + 0.08, t]);
      if (typ === 'bed') {
        bedN++;
        const by = top ? ry : ry + 2,
          c = BEDCOL[(bedN + n) % 7];
        const bed = O({
          k: 'bed',
          x: rx,
          y: by,
          w: 1,
          h: 2,
          c,
          ix: rx + 1.2,
          iy: by + 1.1,
          r: 1.3,
          txt: 'Ins Bett legen',
        });
        bed.hx = rx + 0.5;
        bed.hy = by + 0.55;
        bed.wx = rx + 1.6;
        bed.wy = top ? ry + 2.4 : ry + 1.4;
        bed.act = () => goSleep(bed);
        O({ k: 'nightstand', x: rx + 1, y: back, w: 1, h: 1 });
        O({ k: 'wardrobe', x: rx + 3, y: back, w: 1, h: 1 });
        O({ k: 'rug', x: rx + 1, y: top ? ry + 1 : ry + 1, w: 2, h: 2, solid: false, c: c });
        lab('Schlafzimmer ' + bedN);
      } else if (typ === 'living') {
        lab(n === 1 ? 'Wohnzimmer' : 'Wohnzimmer oben');
        living(m, O, rx, ry, 4, 4, top, n);
      } else if (typ === 'kitchen') {
        lab('Küche oben');
        kitchen(m, O, rx, ry, 4, 4, top, n);
      } else if (typ === 'bath') {
        lab('Bad');
        O({
          k: 'tub',
          x: rx,
          y: back,
          w: 2,
          h: 1,
          ix: rx + 1,
          iy: top ? back + 1.4 : back - 0.3,
          r: 1.3,
          txt: 'Baden',
          act: () => needWater(n) && toast('Herrlich, ein Schaumbad! Du bist jetzt blitzsauber.'),
        });
        O({
          k: 'toilet',
          x: rx + 3,
          y: back,
          w: 1,
          h: 1,
          ix: rx + 3.5,
          iy: top ? back + 1.4 : back - 0.3,
          r: 1.1,
          txt: 'Toilette benutzen',
          act: () => toast('Spülung drücken… rauscht!'),
        });
        O({
          k: 'basin',
          x: rx + 3,
          y: top ? ry + 2 : ry + 1,
          w: 1,
          h: 1,
          ix: rx + 2.6,
          iy: top ? ry + 2.6 : ry + 1.6,
          r: 1.1,
          txt: 'Hände waschen',
          act: () => needWater(n) && toast('Hände gewaschen. Sauber!'),
        });
      } else {
        lab('Abstellkammer');
        O({
          k: 'boxes',
          x: rx,
          y: back,
          w: 1,
          h: 1,
          ix: rx + 1.4,
          iy: top ? back + 1.3 : back - 0.2,
          r: 1.4,
          txt: 'Kisten durchsuchen',
          act: () =>
            toast(
              pick(
                [
                  'Nur alte Decken und ein Fußball.',
                  'Spinnweben! Und ein kaputter Regenschirm.',
                  'Weihnachtsdeko. Viel Weihnachtsdeko.',
                  'Ein altes Foto vom Dorf, als es noch keine Häuser gab.',
                ],
                Math.random,
              ),
            ),
        });
        O({ k: 'boxes', x: rx + 1, y: back, w: 1, h: 1 });
        O({ k: 'boxes', x: rx + 3, y: top ? ry + 1 : ry + 2, w: 1, h: 1 });
      }
    });
  }
  applyEdits(m, n, floor);
  return m;
}

function kitchen(m, O, x, y, w, hh, top, n) {
  const back = top ? y : y + hh - 1,
    s = w >= 7;
  const kinds = s
    ? ['fridge', 'counter', 'sink', 'counter', 'stove', 'oven', 'counter']
    : ['fridge', 'sink', 'stove', 'oven'];
  const deco = ['bowl', 'flour', 'pots'];
  let d = 0;
  kinds.forEach((k, i) => {
    const o = {
      k,
      x: x + i,
      y: back,
      w: 1,
      h: 1,
      ix: x + i + 0.5,
      iy: top ? back + 1.35 : back - 0.35,
      r: 1.05,
    };
    if (k === 'counter') {
      o.deco = deco[d++ % 3];
      o.txt = 'Schubladen öffnen';
      o.act = () => toast('<b>In den Schubladen:</b> ' + KTOOLS + '.', 5000);
    }
    if (k === 'fridge') {
      o.txt = s ? 'Kühlschrank öffnen' : 'Kühlschrank und Vorrat ansehen';
      o.act = () =>
        toast(
          '<b>Kühlschrank:</b> ' +
            FRIDGE +
            '.' +
            (s ? '' : ' <b>Vorrat:</b> ' + PANTRY + '.') +
            (hasPower(n) ? '' : ' Ohne Strom ist er leider nicht kalt.'),
          6000,
        );
    }
    if (k === 'sink') {
      o.txt = 'Wasserhahn aufdrehen';
      o.act = () => needWater(n) && toast('Frisches Wasser läuft. Perfekt zum Kochen!');
    }
    if (k === 'oven') {
      o.txt = 'Brot backen (3 Weizen → 1 Brot)';
      o.act = () => cook(n, { wheat: 3 }, { bread: 1 }, 'Das Brot duftet herrlich!', false);
    }
    if (k === 'stove') {
      o.txt = 'Kürbissuppe kochen (2 Karotten + 1 Kürbis)';
      o.act = () => cook(n, { carrot: 2, pumpkin: 1 }, { soup: 1 }, 'Eine dampfende Kürbissuppe!', true);
    }
    O(o);
  });
  if (s) {
    O({
      k: 'pantry',
      x,
      y: y + 3,
      w: 1,
      h: 3,
      ix: x + 1.4,
      iy: y + 4.5,
      r: 1.4,
      txt: 'Vorratsregal ansehen',
      act: () => toast('<b>Vorratsregal:</b> ' + PANTRY + '.', 6000),
    });
    O({
      k: 'table',
      x: x + 2,
      y: y + 5,
      w: 3,
      h: 2,
      note: true,
      ix: x + 3.5,
      iy: y + 7.6,
      r: 1.9,
      txt: 'Zettel auf dem Küchentisch lesen',
      act: () => houseCard(HOUSES[n - 1]),
    });
    O({ k: 'chair', x: x + 1, y: y + 5, w: 1, h: 1, solid: false });
    O({ k: 'chair', x: x + 1, y: y + 6, w: 1, h: 1, solid: false });
    O({ k: 'chair', x: x + 5, y: y + 5, w: 1, h: 1, solid: false });
    O({ k: 'chair', x: x + 5, y: y + 6, w: 1, h: 1, solid: false });
    O({ k: 'plant', x: x + w - 1, y: y + hh - 2, w: 1, h: 1 });
  } else {
    const ty = top ? y + 2 : y + 1;
    O({
      k: 'table',
      x: x + 1,
      y: ty,
      w: 2,
      h: 1,
      note: true,
      ix: x + 2,
      iy: top ? ty + 1.2 : ty - 0.2,
      r: 1.6,
      txt: 'Zettel auf dem Küchentisch lesen',
      act: () => houseCard(HOUSES[n - 1]),
    });
  }
}

function living(m, O, x, y, w, hh, top, n) {
  const tv = {
    k: 'tv',
    ix: 0,
    iy: 0,
    r: 1.2,
    txt: 'Fernsehen',
    act: () =>
      toast(
        hasPower(n)
          ? pick(
              [
                'Im Fernsehen läuft eine Sendung über Pferde.',
                'Es kommt ein Film über Ritter und Brücken.',
                'Wetterbericht: Morgen scheint die Sonne!',
              ],
              Math.random,
            )
          : 'Ohne Strom bleibt der Fernseher schwarz.',
      ),
  };
  if (w >= 7) {
    O({
      k: 'shelf',
      x,
      y,
      w: 2,
      h: 1,
      ix: x + 1,
      iy: y + 1.4,
      r: 1.2,
      txt: 'Ein Buch lesen',
      act: () => toast('Du liest ein Buch über Brückenbau. Spannend!'),
    });
    O(Object.assign(tv, { x: x + 3, y, w: 2, h: 1, ix: x + 4, iy: y + 1.4 }));
    O({ k: 'plant', x: x + 6, y, w: 1, h: 1 });
    O({ k: 'rug', x: x + 1, y: y + 2, w: 5, h: 4, solid: false, c: '#b3372a' });
    O({ k: 'ctable', x: x + 2, y: y + 3, w: 2, h: 1 });
    O({
      k: 'sofa',
      x: x + 1,
      y: y + 6,
      w: 4,
      h: 1,
      c: '#3d6fb0',
      ix: x + 3,
      iy: y + 7.4,
      r: 1.5,
      txt: 'Auf dem Sofa ausruhen',
      act: rest,
    });
    O({
      k: 'sofa',
      x: x + 6,
      y: y + 3,
      w: 1,
      h: 1,
      c: '#3d6fb0',
      ix: x + 5.6,
      iy: y + 3.6,
      r: 1,
      txt: 'Im Sessel sitzen',
      act: rest,
    });
    O({ k: 'plant', x: x + 6, y: y + hh - 2, w: 1, h: 1 });
  } else {
    const back = top ? y : y + 3,
      mid = top ? y + 2 : y + 1;
    O({ k: 'shelf', x, y: back, w: 1, h: 1 });
    O(Object.assign(tv, { x: x + 1, y: back, w: 2, h: 1, ix: x + 2, iy: top ? back + 1.4 : back - 0.3 }));
    O({ k: 'plant', x: x + 3, y: back, w: 1, h: 1 });
    O({
      k: 'sofa',
      x,
      y: mid,
      w: 2,
      h: 1,
      c: '#2f7a5a',
      ix: x + 1,
      iy: top ? mid + 1.3 : mid - 0.3,
      r: 1.2,
      txt: 'Auf dem Sofa ausruhen',
      act: rest,
    });
    O({ k: 'sofa', x: x + 3, y: mid, w: 1, h: 1, c: '#2f7a5a' });
  }
}

function needWater(n) {
  if (hasWater(n)) return true;
  toast(`Kein Wasser! Haus ${n} braucht noch einen Wasseranschluss (60 Glücksmünzen, steht auf dem Zettel).`);
  return false;
}

function cook(n, need, out, msg, water) {
  if (!hasPower(n))
    return toast(`Ohne Strom geht der Herd nicht. Haus ${n} braucht noch Strom (60 Glücksmünzen).`);
  if (water && !hasWater(n))
    return toast(`Für Suppe brauchst du Wasser. Haus ${n} hat noch keinen Wasseranschluss.`);
  if (!has(need))
    return toast(
      'Dafür brauchst du ' + fmtB(need) + '. Alles andere (Mehl, Salz, Gewürze…) ist in der Küche.',
    );
  take(need);
  give(out);
  moment(
    'cook_' + Object.keys(out)[0],
    out.bread ? 'Dein erstes selbst gebackenes Brot!' : 'Deine erste Kürbissuppe gekocht!',
    Object.keys(out)[0],
  );
  toast('<b>' + msg + '</b> Du hast jetzt ' + fmtB(out) + '. Im Marktdorf bekommst du viel dafür.');
  float(player.x, player.y - 1.6, '+' + fmtB(out), '#ffb36b');
  changed();
}

function pingpong() {
  const a = 11,
    b = Math.floor(Math.random() * 10);
  toast(
    Math.random() < 0.6
      ? `Tischtennis: Du gewinnst <b>${a} zu ${b}</b>!`
      : `Tischtennis: Knapp verloren, <b>${b} zu ${a}</b>. Revanche?`,
  );
}

function rest() {
  toast('Du ruhst dich kurz aus. Gemütlich!');
}

function enterHouse(h) {
  scene = { house: h, floor: 0, map: buildInterior(h, 0), outX: h.x + 3, outY: h.y + h.h + 0.6 };
  player.x = 10.5;
  player.y = 11.9;
  player.face = 'up';
  toast(
    `<b>Haus ${h.n}</b>. Die Treppe nach oben ist hinten in der Mitte. Möbel verschieben: daneben stellen und <b>P</b> drücken.`,
    4000,
  );
}

function goFloor(f, x, y) {
  cancelCarry();
  player.sit = null;
  scene.floor = f;
  scene.map = buildInterior(scene.house, f);
  player.x = x;
  player.y = y;
}

function leaveHouse() {
  setBuild(false);
  player.sit = null;
  closeTV();
  player.x = scene.outX;
  player.y = scene.outY;
  player.face = 'down';
  scene = null;
}

function goSleep(bed) {
  if (state.t < 13 / 24) return toast('Du bist noch nicht müde. Ab 19 Uhr kannst du ins Bett gehen.');
  for (const o of others.values())
    if (o.sl && o.sc === sceneId() && Math.hypot(o.tx - bed.hx, o.ty - bed.hy) < 0.5)
      return toast('In diesem Bett schläft schon jemand.');
  player.sleep = bed;
  player.x = bed.hx;
  player.y = bed.hy;
  $('sleep').hidden = false;
}

function wake() {
  const b = player.sleep;
  if (!b) return;
  player.sleep = null;
  player.x = b.wx;
  player.y = b.wy;
  player.face = 'down';
  $('sleep').hidden = true;
}

// ----- Innen zeichnen -----
function drawFurn(c, o) {
  if (o.k === 'isle' || o.k === 'searock' || o.k === 'buoy' || o.k === 'shoal' || o.k === 'dock')
    return drawSeaObj(c, o);
  if (
    o.k === 'cpool' ||
    o.k === 'crystal' ||
    o.k === 'chest' ||
    o.k === 'wallsign' ||
    o.k === 'cexit' ||
    o.k === 'swordstone' ||
    o.k === 'torch'
  )
    return drawCaveObj(c, o);
  const X = o.x * TILE,
    Y = o.y * TILE,
    w = o.w * TILE,
    h = o.h * TILE,
    k = o.k;
  const top = (col) => {
    c.fillStyle = '#e9e1cf';
    c.fillRect(X, Y, TILE, 20);
    c.fillStyle = col || '#b98a5a';
    c.fillRect(X, Y + 20, TILE, 12);
    c.fillStyle = 'rgba(0,0,0,.15)';
    c.fillRect(X, Y + 20, TILE, 2);
  };
  if (k === 'bed') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 2, Y + 1, w - 4, h - 2);
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 4, Y + 6, w - 8, h - 10);
    c.fillStyle = '#fff';
    c.fillRect(X + 7, Y + 9, w - 14, 11);
    c.fillStyle = o.c;
    c.fillRect(X + 4, Y + 24, w - 8, h - 30);
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.fillRect(X + 4, Y + 24, w - 8, 5);
  } else if (k === 'nightstand') {
    c.fillStyle = '#a8743f';
    c.fillRect(X + 5, Y + 10, 22, 20);
    c.fillStyle = '#8a5a2b';
    c.fillRect(X + 5, Y + 19, 22, 2);
    c.fillStyle = '#f2e2c0';
    c.fillRect(X + 11, Y + 1, 10, 9);
    c.fillStyle = '#6b4226';
    c.fillRect(X + 15, Y + 10, 2, 2);
  } else if (k === 'wardrobe') {
    c.fillStyle = '#7a4c2c';
    c.fillRect(X + 2, Y - 14, 28, 44);
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 4, Y - 12, 11, 40);
    c.fillRect(X + 17, Y - 12, 11, 40);
    c.fillStyle = '#f2b134';
    c.fillRect(X + 13, Y + 6, 2, 4);
    c.fillRect(X + 17, Y + 6, 2, 4);
  } else if (k === 'sofa') {
    c.fillStyle = shade(o.c, -30);
    c.fillRect(X + 2, Y - 6, w - 4, 14);
    c.fillStyle = o.c;
    c.fillRect(X + 2, Y + 6, w - 4, 20);
    c.fillStyle = shade(o.c, -15);
    c.fillRect(X, Y - 2, 7, 28);
    c.fillRect(X + w - 7, Y - 2, 7, 28);
    c.fillStyle = 'rgba(255,255,255,.15)';
    for (let i = 1; i < o.w; i++) c.fillRect(X + i * TILE - 1, Y + 6, 2, 20);
  } else if (k === 'tv') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 2, Y + 14, w - 4, 16);
    c.fillStyle = '#222';
    c.fillRect(X + 8, Y - 8, w - 16, 22);
    c.fillStyle = hasPower(scene.house.n) ? '#4a8ac0' : '#333';
    c.fillRect(X + 11, Y - 5, w - 22, 16);
  } else if (k === 'shelf') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 2, Y - 14, w - 4, 44);
    const bc = ['#e5484d', '#3d6fb0', '#f2b134', '#3f9a3a', '#8e5bd6'];
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < (w - 10) / 6; i++) {
        c.fillStyle = bc[(i + r * 2) % 5];
        c.fillRect(X + 5 + i * 6, Y - 11 + r * 13, 5, 10);
      }
  } else if (k === 'plant') {
    c.fillStyle = '#c0452f';
    c.fillRect(X + 10, Y + 16, 12, 13);
    c.fillStyle = '#3c8a3a';
    c.beginPath();
    c.arc(X + 16, Y + 8, 10, 0, 7);
    c.fill();
    c.fillStyle = '#55a846';
    c.beginPath();
    c.arc(X + 12, Y + 5, 6, 0, 7);
    c.fill();
  } else if (k === 'table' || k === 'ctable') {
    c.fillStyle = '#8a5a2b';
    c.fillRect(X + 4, Y + h - 8, 4, 8);
    c.fillRect(X + w - 8, Y + h - 8, 4, 8);
    c.fillStyle = '#b98a5a';
    c.fillRect(X + 2, Y + 2, w - 4, h - 10);
    c.fillStyle = '#d4a46a';
    c.fillRect(X + 2, Y + 2, w - 4, 4);
    if (o.note) {
      c.save();
      c.translate(X + w / 2 + 6, Y + h / 2 - 4);
      c.rotate(-0.15);
      c.fillStyle = '#fff';
      c.fillRect(-8, -10, 16, 20);
      c.fillStyle = '#8aa';
      for (let i = 0; i < 4; i++) c.fillRect(-5, -6 + i * 4, 10, 1);
      c.restore();
      c.fillStyle = '#e8e2d4';
      c.beginPath();
      c.arc(X + 16, Y + h / 2 - 3, 8, 0, 7);
      c.fill();
      c.fillStyle = '#e5484d';
      c.fillRect(X + 12, Y + h / 2 - 7, 4, 4);
      c.fillStyle = '#f2b134';
      c.fillRect(X + 17, Y + h / 2 - 6, 4, 4);
    }
  } else if (k === 'chair') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 9, Y + 9, 14, 14);
    c.fillStyle = '#6b4226';
    c.fillRect(X + 9, Y + 6, 14, 4);
  } else if (k === 'rug') {
    c.fillStyle = o.c;
    c.fillRect(X + 4, Y + 4, w - 8, h - 8);
    c.strokeStyle = 'rgba(255,255,255,.45)';
    c.lineWidth = 2;
    c.strokeRect(X + 8, Y + 8, w - 16, h - 16);
  } else if (k === 'fridge') {
    c.fillStyle = '#e8eef2';
    c.fillRect(X + 3, Y - 16, 26, 46);
    c.fillStyle = '#c9d1da';
    c.fillRect(X + 3, Y, 26, 2);
    c.fillRect(X + 24, Y - 10, 2, 8);
    c.fillRect(X + 24, Y + 6, 2, 10);
    c.fillStyle = '#e5484d';
    c.fillRect(X + 7, Y - 12, 5, 5);
  } else if (k === 'counter') {
    top();
    if (o.deco === 'bowl') {
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(X + 14, Y + 10, 8, 0, Math.PI);
      c.fill();
      c.fillStyle = '#f2cf8f';
      c.fillRect(X + 7, Y + 8, 14, 3);
      c.fillStyle = '#8a5a35';
      c.fillRect(X + 22, Y + 4, 8, 3);
    } else if (o.deco === 'flour') {
      c.fillStyle = '#f4efe4';
      c.fillRect(X + 5, Y + 1, 12, 15);
      c.fillStyle = '#c9b48a';
      c.fillRect(X + 5, Y + 6, 12, 3);
      c.fillStyle = '#f2f2f2';
      c.fillRect(X + 20, Y + 8, 4, 6);
      c.fillRect(X + 25, Y + 8, 4, 6);
    } else {
      c.fillStyle = '#7d8590';
      c.fillRect(X + 4, Y + 4, 14, 10);
      c.fillStyle = '#5a5f66';
      c.fillRect(X + 18, Y + 7, 8, 3);
      c.fillStyle = '#8a5a35';
      c.fillRect(X + 22, Y + 2, 2, 12);
    }
  } else if (k === 'sink') {
    top();
    c.fillStyle = '#b9c4cc';
    c.fillRect(X + 6, Y + 5, 20, 11);
    c.fillStyle = '#8f9aa3';
    c.fillRect(X + 14, Y + 1, 3, 6);
  } else if (k === 'stove') {
    top('#7d8590');
    c.fillStyle = '#333';
    for (const [a, b] of [
      [9, 6],
      [22, 6],
      [9, 14],
      [22, 14],
    ]) {
      c.beginPath();
      c.arc(X + a, Y + b, 4, 0, 7);
      c.fill();
    }
    c.fillStyle = '#5a5f66';
    c.fillRect(X + 3, Y + 23, 26, 3);
  } else if (k === 'oven') {
    top('#7d8590');
    c.fillStyle = '#2b2b2b';
    c.fillRect(X + 6, Y + 22, 20, 8);
    c.fillStyle = hasPower(scene.house.n) ? '#ff9a3c' : '#444';
    c.fillRect(X + 8, Y + 24, 16, 4);
    c.fillStyle = '#d99a52';
    c.fillRect(X + 8, Y + 6, 16, 7);
  } else if (k === 'pantry') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 2, Y, 26, h);
    c.fillStyle = '#6b4226';
    for (let r = 0; r < h; r += 24) c.fillRect(X + 2, Y + r + 20, 26, 4);
    const it = [
      '#f4efe4',
      '#e5484d',
      '#f2b134',
      '#fff',
      '#3f9a3a',
      '#c9b48a',
      '#8e5bd6',
      '#ff9a3c',
      '#f4efe4',
    ];
    it.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(X + 5 + (i % 3) * 8, Y + 6 + Math.floor(i / 3) * 24, 6, 13);
    });
  } else if (k === 'tub') {
    c.fillStyle = '#f4f8fa';
    c.fillRect(X + 2, Y + 2, w - 4, 28);
    c.fillStyle = '#bfe3f2';
    c.fillRect(X + 6, Y + 6, w - 12, 20);
    c.fillStyle = '#fff';
    c.fillRect(X + 10, Y + 9, 6, 4);
    c.fillRect(X + 20, Y + 14, 5, 4);
  } else if (k === 'toilet') {
    c.fillStyle = '#f4f8fa';
    c.fillRect(X + 8, Y + 2, 16, 9);
    c.beginPath();
    c.ellipse(X + 16, Y + 20, 9, 10, 0, 0, 7);
    c.fill();
    c.fillStyle = '#bfe3f2';
    c.beginPath();
    c.ellipse(X + 16, Y + 20, 5, 6, 0, 0, 7);
    c.fill();
  } else if (k === 'basin') {
    c.fillStyle = '#f4f8fa';
    c.fillRect(X + 5, Y + 8, 22, 14);
    c.fillStyle = '#bfe3f2';
    c.fillRect(X + 9, Y + 11, 14, 8);
    c.fillStyle = '#9fd3e6';
    c.fillRect(X + 7, Y - 8, 18, 12);
  } else if (k === 'boxes') {
    c.fillStyle = '#b98a5a';
    c.fillRect(X + 3, Y + 8, 26, 22);
    c.fillStyle = '#a07446';
    c.fillRect(X + 3, Y + 17, 26, 3);
    c.fillStyle = '#c99a62';
    c.fillRect(X + 8, Y - 4, 18, 13);
    c.fillStyle = '#a07446';
    c.fillRect(X + 8, Y + 2, 18, 2);
  } else if (k === 'pingpong') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 8, Y + h - 8, 4, 8);
    c.fillRect(X + w - 12, Y + h - 8, 4, 8);
    c.fillStyle = '#2f7a5a';
    c.fillRect(X + 2, Y + 2, w - 4, h - 10);
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.strokeRect(X + 4, Y + 4, w - 8, h - 14);
    c.fillStyle = '#fff';
    c.fillRect(X + w / 2 - 1, Y - 2, 3, h - 4);
    c.fillRect(X + w / 2 - 10, Y + h / 2 - 8, 4, 4);
    c.fillStyle = '#e5484d';
    c.fillRect(X + 14, Y + 12, 9, 9);
    c.fillRect(X + w - 24, Y + 20, 9, 9);
  } else if (k === 'stairs') {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = o.dir === 'up' ? i : n - 1 - i;
      c.fillStyle = shade('#a8743f', -t * 10);
      c.fillRect(X, Y + (i * h) / n, w, h / n + 0.5);
      c.fillStyle = 'rgba(0,0,0,.2)';
      c.fillRect(X, Y + ((i + 1) * h) / n - 2, w, 2);
    }
    c.fillStyle = '#fff8e6';
    c.font = 'bold 11px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillText(o.dir === 'up' ? '▲ oben' : '▼ unten', X + w / 2, Y + h / 2 + 4);
  } else if (k === 'sack') {
    const empty = o.house ? sackTaken(o.house) : barnTaken(o.seed);
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.beginPath();
    c.ellipse(X + 16, Y + 29, 13, 4, 0, 0, 7);
    c.fill();
    if (empty) {
      c.fillStyle = '#b39a70';
      c.beginPath();
      c.ellipse(X + 16, Y + 24, 13, 6, 0, 0, 7);
      c.fill();
      c.fillStyle = '#9a835c';
      c.fillRect(X + 8, Y + 20, 16, 2);
    } else {
      const g = c.createLinearGradient(X + 4, 0, X + 28, 0);
      g.addColorStop(0, '#e3cc9e');
      g.addColorStop(1, '#a88c5e');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(X + 6, Y + 29);
      c.quadraticCurveTo(X + 2, Y + 8, X + 9, Y - 2);
      c.lineTo(X + 23, Y - 2);
      c.quadraticCurveTo(X + 30, Y + 8, X + 26, Y + 29);
      c.closePath();
      c.fill();
      c.fillStyle = '#8a6d42';
      c.fillRect(X + 10, Y - 1, 12, 2);
      c.fillStyle = o.col;
      c.beginPath();
      c.ellipse(X + 16, Y - 2, 6, 2.4, 0, 0, 7);
      c.fill();
      for (let q = 0; q < 6; q++) c.fillRect(X + 11 + q * 2, Y - 4 + (q % 2), 1.5, 1.5);
      c.fillStyle = '#fff8e6';
      c.fillRect(X + 9, Y + 10, 14, 9);
      c.fillStyle = o.col;
      if (o.house) {
        c.font = 'bold 8px "Pixelify Sans", monospace';
        c.textAlign = 'center';
        c.fillText(o.house, X + 16, Y + 17.5);
      } else {
        c.beginPath();
        c.arc(X + 16, Y + 14.5, 3, 0, 7);
        c.fill();
      }
    }
    if (o.house) {
      c.fillStyle = '#2e2216';
      c.font = 'bold 6px "Pixelify Sans", monospace';
      c.textAlign = 'center';
      c.fillText('Haus ' + o.house, X + 16, Y + 36);
    }
  } else if (k === 'hay') {
    const g = c.createLinearGradient(0, Y - 8, 0, Y + 30);
    g.addColorStop(0, '#f2d27a');
    g.addColorStop(1, '#c9a24f');
    c.fillStyle = g;
    c.fillRect(X + 1, Y - 8, w - 2, 37);
    c.strokeStyle = 'rgba(150,110,40,.6)';
    c.lineWidth = 1;
    for (let q = 0; q < 10; q++) {
      c.beginPath();
      c.moveTo(X + 3 + (q * (w - 6)) / 10, Y - 6);
      c.lineTo(X + 5 + (q * (w - 6)) / 10, Y + 27);
      c.stroke();
    }
    c.fillStyle = '#8a6d42';
    c.fillRect(X + 1, Y + 2, w - 2, 2);
    c.fillRect(X + 1, Y + 18, w - 2, 2);
  } else if (k === 'ladder') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 6, Y - 20, 4, 50);
    c.fillRect(X + 22, Y - 20, 4, 50);
    for (let q = 0; q < 6; q++) c.fillRect(X + 6, Y - 16 + q * 8, 20, 3);
  } else if (k === 'fork') {
    c.strokeStyle = '#8a5a35';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(X + 16, Y + 28);
    c.lineTo(X + 16, Y - 4);
    c.stroke();
    c.strokeStyle = '#9aa3ab';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(X + 9, Y - 4);
    c.lineTo(X + 23, Y - 4);
    for (const fx of [9, 14, 18, 23]) {
      c.moveTo(X + fx, Y - 4);
      c.lineTo(X + fx, Y - 16);
    }
    c.stroke();
  } else if (k === 'cart') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 4, Y + 6, w - 8, h - 26);
    c.fillStyle = '#a8743f';
    c.fillRect(X + 4, Y + 6, w - 8, 5);
    c.fillStyle = '#f2d27a';
    c.beginPath();
    c.ellipse(X + w / 2, Y + 6, w / 2 - 6, 12, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = '#5a3a22';
    c.lineWidth = 3;
    for (const wx of [X + 14, X + w - 14]) {
      c.beginPath();
      c.arc(wx, Y + h - 12, 9, 0, 7);
      c.stroke();
      c.beginPath();
      c.moveTo(wx - 9, Y + h - 12);
      c.lineTo(wx + 9, Y + h - 12);
      c.moveTo(wx, Y + h - 21);
      c.lineTo(wx, Y + h - 3);
      c.stroke();
    }
    c.strokeStyle = '#6b4226';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(X + w - 4, Y + h - 24);
    c.lineTo(X + w + 14, Y + h - 10);
    c.stroke();
  } else if (k === 'toolrack') {
    c.fillStyle = '#b98a5a';
    c.fillRect(X + 1, Y - 14, 30, 40);
    c.fillStyle = 'rgba(0,0,0,.25)';
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 5; b++) c.fillRect(X + 5 + a * 7, Y - 10 + b * 8, 1.5, 1.5);
    c.fillStyle = '#6b4226';
    c.fillRect(X + 14, Y - 12, 4, 3);
    drawTool(c, o.tool, X + 16, Y + 3, 30);
    {
      const tn = (TOOLS.find((t) => t[0] === o.tool) || [])[1] || '';
      c.font = 'bold 6.5px "Pixelify Sans", monospace';
      c.textAlign = 'center';
      const lw = Math.max(26, c.measureText(tn).width + 6);
      c.fillStyle = '#f3e6c4';
      c.fillRect(X + 16 - lw / 2, Y + 18, lw, 8);
      c.strokeStyle = '#6b4226';
      c.lineWidth = 0.8;
      c.strokeRect(X + 16 - lw / 2, Y + 18, lw, 8);
      c.fillStyle = '#2e2216';
      c.fillText(tn, X + 16, Y + 24.5);
    }
    if (hasTool(o.tool)) {
      c.fillStyle = '#3f9a3a';
      c.beginPath();
      c.arc(X + 26, Y - 9, 4.5, 0, 7);
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(X + 23.8, Y - 9);
      c.lineTo(X + 25.5, Y - 7.2);
      c.lineTo(X + 28.4, Y - 11);
      c.stroke();
    }
  } else if (k === 'bench') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 4, Y + 14, 5, 18);
    c.fillRect(X + w - 9, Y + 14, 5, 18);
    c.fillStyle = '#a8743f';
    c.fillRect(X, Y, w, 16);
    c.fillStyle = '#c99a62';
    c.fillRect(X, Y, w, 4);
    c.fillStyle = '#7d8590';
    c.fillRect(X + 4, Y - 6, 10, 7);
    c.fillStyle = '#4e555e';
    c.fillRect(X + 6, Y - 9, 6, 3);
    drawTool(c, 'saw', X + w - 28, Y + 4, 26);
    c.fillStyle = 'rgba(240,210,160,.8)';
    for (let i = 0; i < 8; i++) c.fillRect(X + 30 + i * 5, Y + 8 + (i % 3), 2, 1);
  } else if (k === 'grind') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 6, Y + 14, 4, 16);
    c.fillRect(X + 22, Y + 14, 4, 16);
    c.fillStyle = '#8a8a8a';
    c.beginPath();
    c.arc(X + 16, Y + 8, 11, 0, 7);
    c.fill();
    c.fillStyle = '#b0b0b0';
    c.beginPath();
    c.arc(X + 16, Y + 8, 7, 0, 7);
    c.fill();
    c.fillStyle = '#5a5a5a';
    c.beginPath();
    c.arc(X + 16, Y + 8, 2, 0, 7);
    c.fill();
  } else if (k === 'sawhorse') {
    c.strokeStyle = '#6b4226';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(X + 8, Y + 30);
    c.lineTo(X + 14, Y + 8);
    c.lineTo(X + 20, Y + 30);
    c.moveTo(X + w - 20, Y + 30);
    c.lineTo(X + w - 14, Y + 8);
    c.lineTo(X + w - 8, Y + 30);
    c.stroke();
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 2, Y + 2, w - 4, 9);
    c.fillStyle = '#d4a46a';
    c.beginPath();
    c.ellipse(X + w - 3, Y + 6.5, 3, 4.5, 0, 0, 7);
    c.fill();
  } else if (k === 'planks') {
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? '#c99a62' : '#d9a46a';
      c.fillRect(X + 2, Y + 22 - i * 5, w - 4, 5);
      c.fillStyle = 'rgba(0,0,0,.15)';
      c.fillRect(X + 2, Y + 26 - i * 5, w - 4, 1);
    }
  } else if (k === 'barrel') {
    const g = c.createLinearGradient(X + 4, 0, X + 28, 0);
    g.addColorStop(0, '#94603a');
    g.addColorStop(1, '#4e2e17');
    c.fillStyle = g;
    c.fillRect(X + 5, Y - 4, 22, 34);
    c.fillStyle = '#3a3a3a';
    c.fillRect(X + 5, Y + 2, 22, 2);
    c.fillRect(X + 5, Y + 22, 22, 2);
    c.fillStyle = '#6e4426';
    c.beginPath();
    c.ellipse(X + 16, Y - 4, 11, 3.5, 0, 0, 7);
    c.fill();
  } else if (k === 'door') {
    c.fillStyle = '#6b4226';
    c.fillRect(X + 3, Y, 26, TILE);
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 6, Y + 3, 20, 12);
    c.fillStyle = '#f2b134';
    c.fillRect(X + 22, Y + 18, 3, 3);
    c.fillStyle = '#b3372a';
    c.fillRect(X - 2, Y - 8, 36, 7);
  }
}

function drawSleeper(c, x, y, L, blanket) {
  const X = x * TILE,
    Y = y * TILE;
  c.fillStyle = blanket;
  c.fillRect(X - 12, Y + 6, 24, 30);
  c.fillStyle = 'rgba(255,255,255,.3)';
  c.fillRect(X - 12, Y + 6, 24, 5);
  c.fillStyle = L.skin;
  c.fillRect(X - 7, Y - 8, 14, 14);
  c.fillStyle = L.hair;
  c.fillRect(X - 7, Y - 8, 14, 4);
  c.fillStyle = '#2b2118';
  c.fillRect(X - 5, Y - 1, 4, 1);
  c.fillRect(X + 1, Y - 1, 4, 1);
  c.font = 'bold 12px "Pixelify Sans", monospace';
  c.fillStyle = '#fff8e6';
  c.textAlign = 'left';
  const z = (now * 1.2) % 1;
  c.globalAlpha = 1 - z;
  c.fillText('z', X + 8, Y - 10 - z * 14);
  c.fillText('Z', X + 13, Y - 18 - z * 14);
  c.globalAlpha = 1;
}

function nameTag(c, x, y, nm) {
  if (!nm) return;
  c.font = 'bold 11px "Nunito", sans-serif';
  c.textAlign = 'center';
  const tw = c.measureText(nm).width + 8;
  c.fillStyle = 'rgba(46,34,22,.75)';
  c.fillRect(x - tw / 2, y - 11, tw, 14);
  c.fillStyle = '#fff8e6';
  c.fillText(nm, x, y);
}

function drawOther(c, o) {
  const fx = o.x * TILE,
    fy = o.y * TILE - (o.jz || 0);
  if (o.jz > 0) {
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.beginPath();
    c.ellipse(fx, o.y * TILE, 9, 4, 0, 0, 7);
    c.fill();
  }
  if (o.sl) {
    drawSleeper(c, o.x, o.y, o.lk, o.lk.shirt);
    nameTag(c, fx, fy - 16, o.nm);
    return;
  }
  if (o.mt === 'horse') {
    drawHorse3D(
      c,
      fx,
      fy,
      { body: o.mc, mane: '#3b2414' },
      angOf(o, o.a != null ? o.a : FACEANG[o.f]),
      o.mv ? o.phase : 0,
      o.lk,
    );
    nameTag(c, fx, fy - 62, o.nm);
  } else if (o.mt === 'bike') {
    drawBike3D(
      c,
      fx,
      fy,
      { col: o.mc },
      angOf(o, o.a != null ? o.a : FACEANG[o.f]),
      o.mv ? o.phase : 0,
      o.lk,
    );
    nameTag(c, fx, fy - 52, o.nm);
  } else {
    drawPerson(c, fx, fy + (o.si ? 2 : 0), o.lk, o.f, o.mv ? o.phase : 0, {
      seated: o.si,
      ang: angOf(o, o.a != null ? o.a : FACEANG[o.f]),
      chop: o.sw ? 0.4 : undefined,
      tool: o.sw ? 'sword' : undefined,
    });
    nameTag(c, fx, fy - 44, o.nm);
  }
}

function drawInterior() {
  const m = scene.map,
    c = ctx,
    SCv = view === 'map' ? Math.min(VW / (m.w * TILE), VH / (m.h * TILE)) * 0.92 : SC,
    vw = VW / SCv,
    vh = VH / SCv,
    mw = m.w * TILE,
    mh = m.h * TILE;
  let tx = player.x * TILE - vw / 2,
    ty = player.y * TILE - vh / 2 - 16;
  tx = mw < vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, tx));
  ty = mh < vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, ty));
  const k = SCv * DPR;
  camX = Math.round(tx * k) / k;
  camY = Math.round(ty * k) / k;
  c.setTransform(k, 0, 0, k, -camX * k, -camY * k);
  c.fillStyle = m.sea ? '#1f6f9e' : m.cave ? '#151a1d' : '#2a2018';
  c.fillRect(camX, camY, vw, vh);
  if (m.sea) {
    const g = c.createRadialGradient(
      m.w * TILE * 0.55,
      m.h * TILE * 0.45,
      TILE,
      m.w * TILE * 0.55,
      m.h * TILE * 0.45,
      m.w * TILE * 0.62,
    );
    g.addColorStop(0, '#14507e');
    g.addColorStop(0.55, '#1d6696');
    g.addColorStop(1, '#3a93b8');
    c.fillStyle = g;
    c.fillRect(0, 0, m.w * TILE, m.h * TILE);
  }
  for (let j = 0; j < m.h; j++)
    for (let i = 0; i < m.w; i++) {
      const t = m.T[j * IW + i],
        X = i * TILE,
        Y = j * TILE;
      if (t === 0 && m.cave) {
        const h = hh(i, j);
        c.fillStyle = '#1f2529';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        c.fillStyle = h % 2 ? '#2c343a' : '#262d32';
        c.beginPath();
        c.ellipse(X + 16, Y + 16, 15, 13, h % 3, 0, 7);
        c.fill();
        c.fillStyle = 'rgba(120,200,230,.08)';
        c.fillRect(X + 8, Y + 6, 6, 2);
      } else if (t === 0) {
        c.fillStyle = '#6b4f3a';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        c.fillStyle = '#8a6a4e';
        c.fillRect(X, Y, TILE + 0.6, 5);
        if (j < m.h - 1 && m.T[(j + 1) * IW + i] !== 0) {
          c.fillStyle = scene.floor ? '#e8dcc8' : '#efe1c3';
          c.fillRect(X, Y + 8, TILE + 0.6, 24);
          c.fillStyle = 'rgba(120,90,60,.12)';
          if (i % 2) c.fillRect(X + 14, Y + 8, 3, 24);
          c.fillStyle = '#a8865f';
          c.fillRect(X, Y + 28, TILE + 0.6, 4);
        }
      } else if (t === 1) {
        c.fillStyle = '#d4a06a';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        c.fillStyle = '#c08c58';
        c.fillRect(X, Y + 15, TILE, 2);
        c.fillRect(X, Y + 31, TILE, 1);
        c.fillRect(X + (j % 2 ? 6 : 22), Y, 2, 15);
        c.fillRect(X + (j % 2 ? 22 : 6), Y + 16, 2, 15);
      } else if (t === 2) {
        for (let a = 0; a < 2; a++)
          for (let b = 0; b < 2; b++) {
            c.fillStyle = (a + b + i + j) % 2 ? '#efe8d8' : '#d9cfb8';
            c.fillRect(X + a * 16, Y + b * 16, 16.6, 16.6);
          }
      } else if (t === 3) {
        c.fillStyle = '#cfe6ef';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        c.fillStyle = '#b8d6e2';
        c.fillRect(X, Y + 15, TILE, 2);
        c.fillRect(X + 15, Y, 2, TILE);
      } else if (t === 6) {
        drawSeaTile(c, X, Y, i, j);
      } else if (t === 7) {
        const h = hh(i, j);
        c.fillStyle = '#3e4950';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        for (let q = 0; q < 4; q++) {
          const bx = X + ((h >> (q * 3)) % 30),
            by = Y + ((h >> (q * 3 + 2)) % 30);
          c.fillStyle = q % 2 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.09)';
          c.beginPath();
          c.ellipse(bx, by, 7 + ((h >> q) % 8), 4 + ((h >> (q + 2)) % 5), (h % 7) * 0.4, 0, 7);
          c.fill();
        }
        for (let q = 0; q < 3; q++) {
          const px = X + ((h >> (q * 4 + 1)) % 28) + 2,
            py = Y + ((h >> (q * 4 + 3)) % 28) + 2;
          c.fillStyle = '#57636b';
          c.beginPath();
          c.ellipse(px, py, 1.6, 1.1, 0, 0, 7);
          c.fill();
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.fillRect(px - 1.2, py + 0.8, 2.6, 0.8);
        }
      } else if (t === 5) {
        c.fillStyle = '#b39058';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        const h = hh(i, j);
        for (let q = 0; q < 9; q++) {
          c.strokeStyle = q % 2 ? '#e2c071' : '#c9a24f';
          c.lineWidth = 1;
          const sx = X + ((h >> q) % 28) + 2,
            sy = Y + ((h >> (q + 3)) % 28) + 2;
          c.beginPath();
          c.moveTo(sx, sy);
          c.lineTo(sx + ((h >> q) % 2 ? 6 : -5), sy + ((h >> (q + 1)) % 2 ? 2 : -2));
          c.stroke();
        }
      } else {
        c.fillStyle = '#b98450';
        c.fillRect(X, Y, TILE + 0.6, TILE + 0.6);
        c.fillStyle = '#a47040';
        c.fillRect(X, Y + 15, TILE, 2);
      }
    }
  m.objs.filter((o) => o.k === 'rug').forEach((o) => drawFurn(c, o));
  m.labels.forEach(([x, y, t]) => {
    c.font = 'bold 11px "Nunito", sans-serif';
    const tw = c.measureText(t).width + 8;
    c.fillStyle = 'rgba(255,248,230,.85)';
    c.fillRect(x * TILE, y * TILE, tw, 15);
    c.fillStyle = '#2e2216';
    c.textAlign = 'left';
    c.fillText(t, x * TILE + 4, y * TILE + 11);
  });
  const D = [];
  m.objs.forEach((o) => {
    if (o.k !== 'rug') D.push([o.k === 'stairs' || o.k === 'door' ? -1 : o.y + o.h, () => drawFurn(c, o)]);
  });
  const sid = sceneId(),
    late = [];
  for (const o of others.values())
    if (o.sc === sid) {
      if (o.sl) late.push(() => drawOther(c, o));
      else D.push([o.y, () => drawOther(c, o)]);
    }
  if (player.sleep)
    late.push(() => {
      drawSleeper(c, player.x, player.y, state.look, player.sleep.c);
      nameTag(c, player.x * TILE, player.y * TILE - 16, state.name);
    });
  else if (player.sit)
    D.push([
      player.sit.o.y + player.sit.o.h + 0.02,
      () => {
        drawPerson(c, player.x * TILE, player.y * TILE + 2, state.look, 'down', 0, {
          seated: 1,
          ang: Math.PI / 2,
        });
        nameTag(c, player.x * TILE, player.y * TILE - 40, state.name);
      },
    ]);
  else if (m.sea) {
    const fsh = player.work && player.work.kind === 'fish';
    D.push([
      player.y,
      () => {
        drawBoat(c, player.x * TILE, player.y * TILE + 4, player.rang, 0);
        drawPerson(c, player.x * TILE, player.y * TILE + 2, state.look, 'down', 0, {
          seated: 1,
          ang: player.rang,
          tool: fsh ? 'rod' : undefined,
          reach: fsh ? 0.27 : undefined,
          drink: player.work && player.work.kind === 'eat' ? player.work.t : undefined,
          food: player.work && player.work.kind === 'eat' ? player.work.k : undefined,
        });
        nameTag(c, player.x * TILE, player.y * TILE - 40, state.name);
      },
    ]);
    if (fsh) D.push([player.y + 0.05, () => drawFishLine(c)]);
  } else
    D.push([
      player.y,
      () => {
        const ew = player.work && (player.work.kind === 'eat' || player.work.kind === 'drink');
        drawPerson(
          c,
          player.x * TILE,
          player.y * TILE,
          state.look,
          player.face,
          player.moving ? player.phase : 0,
          {
            ang: player.rang,
            drink: ew ? player.work.t : undefined,
            food: player.work && player.work.kind === 'eat' ? player.work.k : undefined,
            chop: FIGHT.sw >= 0 ? FIGHT.sw * 1.3 : undefined,
            tool: FIGHT.sw >= 0 ? 'sword' : undefined,
          },
        );
        nameTag(c, player.x * TILE, player.y * TILE - 44, state.name);
      },
    ]);
  if (FIGHT.on && FIGHT.foe === 'bot' && inGrotto()) {
    const b = FIGHT.bot;
    D.push([
      b.y,
      () => {
        if (b.hitT > 0) {
          c.save();
          c.globalAlpha = 0.6;
        }
        drawPerson(c, b.x * TILE, b.y * TILE, BOTLOOK, 'down', b.mv ? b.phase : 0, {
          ang: b.ang,
          chop: b.state === 'wind' ? 0.15 : b.state === 'strike' ? Math.min(0.9, b.t * 2 + 0.3) : undefined,
          tool: 'sword',
        });
        if (b.hitT > 0) c.restore();
        nameTag(c, b.x * TILE, b.y * TILE - 44, 'Schatzwächter');
      },
    ]);
  }
  D.sort((a, b) => a[0] - b[0]);
  for (const d of D) d[1]();
  late.forEach((f) => f());
  if (carry) {
    const [x, y] = carryTarget(),
      o = carry.o,
      ok = canPlace(x, y, o),
      g = Object.assign({}, o, { x, y });
    c.globalAlpha = 0.6;
    drawFurn(c, g);
    c.globalAlpha = 1;
    c.strokeStyle = ok ? '#3fdc6a' : '#ff4d4d';
    c.lineWidth = 3;
    c.setLineDash([6, 4]);
    c.strokeRect(x * TILE + 2, y * TILE + 2, o.w * TILE - 4, o.h * TILE - 4);
    c.setLineDash([]);
  }
  if (cur && cur.act && !player.sleep && !carry) {
    const mx = cur.x * TILE,
      my = (cur.y - 1.4) * TILE + Math.sin(now * 5) * 3;
    c.fillStyle = '#fff8e6';
    c.strokeStyle = '#2e2216';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(mx - 6, my - 6);
    c.lineTo(mx + 6, my - 6);
    c.lineTo(mx, my + 3);
    c.closePath();
    c.fill();
    c.stroke();
  }
  floats.forEach((f) => {
    c.globalAlpha = Math.max(0, 1 - f.t / 1.6);
    c.font = 'bold 14px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillStyle = '#2e2216';
    c.fillText(f.text, f.x * TILE + 1, (f.y - f.t * 0.8) * TILE + 1);
    c.fillStyle = f.col || '#ffd23f';
    c.fillText(f.text, f.x * TILE, (f.y - f.t * 0.8) * TILE);
    c.globalAlpha = 1;
  });
  const n = night();
  if (n > 0) {
    const pw = hasPower(scene.house.n);
    c.fillStyle = `rgba(18,24,64,${pw ? n * 0.35 : Math.min(0.8, n * 1.4)})`;
    c.fillRect(camX, camY, vw, vh);
  }
  if (view === 'map') drawDots(c, SCv);
}

function interiorInteractions() {
  if (player.sleep) return [{ x: player.x, y: player.y, r: 99, text: 'Aufstehen', act: wake }];
  if (player.sit) return [{ x: player.x, y: player.y, r: 99, text: 'Aufstehen (Leertaste)', act: standUp }];
  if (buildMode || carry) return buildInteractions().map((i) => Object.assign(i, { key: 'P' }));
  if (FIGHT.on) return [];
  return scene.map.objs
    .filter((o) => o.act)
    .map((o) => ({ x: o.ix, y: o.iy, r: o.r || 1.2, text: o.txt, act: o.act }));
}
