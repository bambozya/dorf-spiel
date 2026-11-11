// ================= Schneiderei im Marktdorf =================
// Ein begehbares Haus oben in der Mitte des Marktdorfs. Drinnen stehen
// Schaufensterpuppen mit Outfits, die es im Figur-Editor nicht gibt.
// Gekaufte Outfits merkt sich state.outfits und man kann sie hier
// jederzeit kostenlos wieder anziehen.

const TAILOR = V2H.find((h) => h.tailor);

const OUTFITS = [
  { id: 'gaertner', n: 'Latzhose', p: 100, set: { shirt: '#f4e04d', pants: '#4a6fa5', shoes: '#5a3a1e', cl: 0 } },
  { id: 'sport', n: 'Sportdress', p: 120, set: { shirt: '#00a86b', pants: '#f7f7f2', shoes: '#ff4500', cl: 0 } },
  { id: 'matrose', n: 'Matrosenanzug', p: 130, set: { shirt: '#f7f7f2', pants: '#1f3a6b', shoes: '#141414', cl: 0 } },
  { id: 'smoking', n: 'Smoking', p: 150, set: { shirt: '#141414', pants: '#141414', shoes: '#050505', cl: 0 } },
  { id: 'ballkleid', n: 'Ballkleid', p: 250, set: { shirt: '#e8a0c8', pants: '#e8a0c8', shoes: '#f7f7f2', cl: 2 } },
  { id: 'koenig', n: 'Königsmantel', p: 300, set: { shirt: '#6a1b4d', pants: '#6a1b4d', shoes: '#d4af37', cl: 2 } },
  { id: 'gold', n: 'Goldanzug', p: 400, set: { shirt: '#d4af37', pants: '#b8860b', shoes: '#d4af37', cl: 0 } },
];

// Aussehen der Schaufensterpuppen und des Schneiders
const MANNEQUIN_LOOK = { skin: '#d8d2c8', hair: '#d8d2c8', hs: 0, g: 'm', eye: '#d8d2c8' };
const TAILOR_LOOK = {
  skin: '#e8b98f',
  hair: '#9a9a9a',
  shirt: '#f7f7f2',
  pants: '#3a3a3a',
  shoes: '#141414',
  hs: 0,
  cl: 0,
  eye: '#4a2e1a',
  g: 'm',
};
// x-Positionen der Puppen an der oberen Wand
const MANNEQUIN_X = [2, 4, 7, 9, 12, 14, 17];

const outfitLook = (o) => Object.assign({}, MANNEQUIN_LOOK, o.set, o.id === 'ballkleid' ? { g: 'f' } : {});
const ownsOutfit = (o) => !!(state.outfits && state.outfits[o.id]);

function buyOutfit(o) {
  state.outfits = state.outfits || {};
  if (ownsOutfit(o)) return wearOutfit(o, false);
  if (state.coins < o.p)
    return toast(`Das Outfit <b>${o.n}</b> kostet ${o.p} Glücksmünzen. Du hast nur ${state.coins}.`);
  openModal(
    `<h2>${o.n}</h2><p>Möchtest du das Outfit <b>${o.n}</b> für <b>${o.p} Glücksmünzen</b> kaufen? Du ziehst es sofort an und kannst es hier jederzeit wieder anziehen.</p><div class="actions"><button class="go" id="oy">Kaufen und anziehen</button><button id="cls">Lieber nicht</button></div>`,
  );
  $('cls').onclick = closeModal;
  $('oy').onclick = () => {
    if (state.coins < o.p) return;
    state.coins -= o.p;
    state.outfits[o.id] = 1;
    closeModal();
    wearOutfit(o, true);
  };
}

function wearOutfit(o, isNew) {
  // Haare, Haut und Augen bleiben, nur die Kleidung wechselt
  state.look = Object.assign({}, state.look, o.set);
  changed();
  renderHUD();
  chips(player.x, player.y - 1, 12, ['#ffd23f', '#ff8ac8', '#bfe8ff'], 20);
  float(player.x, player.y - 1.9, isNew ? 'Neues Outfit!' : o.n, '#ffd23f');
  toast(
    isNew ? `<b>${o.n}</b> gekauft und angezogen! Steht dir super.` : `Du trägst jetzt dein <b>${o.n}</b>.`,
    3500,
  );
  if (isNew) moment('outfit_' + o.id, `Neues Outfit aus der Schneiderei: ${o.n}!`, 'coin');
  if (scene && scene.floor === 'tl') scene.map = buildTailorInterior();
}

const TAILOR_SAYS = [
  '„Willkommen! Jedes Outfit hier habe ich selbst genäht. So etwas findest du nirgendwo sonst.“',
  '„Der Goldanzug ist mein Meisterstück. Teuer, aber er glänzt in der Sonne!“',
  '„Einmal gekauft, kannst du jedes Outfit hier jederzeit wieder anziehen.“',
  '„Am Spiegel siehst du, wie dir dein Outfit steht.“',
];

function buildTailorInterior() {
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(1),
    objs: [],
    labels: [[1.15, 12.55, 'Schneiderei']],
  };
  // Wände am Rand, heller Fliesenboden in der Mitte
  for (let i = 0; i < IW; i++) {
    m.T[i] = 0;
    m.T[(IH - 1) * IW + i] = 0;
  }
  for (let j = 0; j < IH; j++) {
    m.T[j * IW] = 0;
    m.T[j * IW + IW - 1] = 0;
  }
  for (let j = 4; j < 10; j++) for (let i = 5; i < 16; i++) m.T[j * IW + i] = 3;

  const O = (o) => {
    o.solid = o.solid !== false;
    m.objs.push(o);
    return o;
  };
  OUTFITS.forEach((o, k) => {
    const x = MANNEQUIN_X[k];
    O({
      k: 'mannequin',
      x,
      y: 1,
      w: 1,
      h: 1,
      outfit: o,
      ix: x + 0.5,
      iy: 2.5,
      r: 1.15,
      txt: ownsOutfit(o) ? `${o.n} anziehen` : `${o.n}: ${o.p} Münzen`,
      act: () => buyOutfit(o),
    });
  });
  O({
    k: 'tcounter',
    x: 8,
    y: 6,
    w: 5,
    h: 1,
    ix: 10.5,
    iy: 7.6,
    r: 1.8,
    txt: 'Mit dem Schneider reden',
    act: () => toast(pick(TAILOR_SAYS, Math.random), 5000),
  });
  O({ k: 'tailorman', x: 13, y: 6, w: 1, h: 1 });
  O({ k: 'fabric', x: 1, y: 5, w: 1, h: 3 });
  O({ k: 'fabric', x: 19, y: 5, w: 1, h: 3 });
  O({
    k: 'sewing',
    x: 3,
    y: 10,
    w: 2,
    h: 1,
    ix: 4,
    iy: 11.4,
    r: 1.3,
    txt: 'Nähmaschine ansehen',
    act: () => toast('Ratter-ratter! Die Nähmaschine des Schneiders. Hier entstehen alle Outfits.'),
  });
  O({
    k: 'mirror',
    x: 16,
    y: 10,
    w: 2,
    h: 1,
    ix: 17,
    iy: 11.4,
    r: 1.3,
    txt: 'In den Spiegel schauen',
    act: () => {
      float(player.x, player.y - 1.9, pick(['Schick!', 'Sieht gut aus!', 'Wow!'], Math.random), '#fff8e6');
      chips(player.x, player.y - 1.2, 8, ['#ffffff', '#bfe8ff'], 16);
    },
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
    txt: 'Schneiderei verlassen',
    act: leaveHouse,
  });

  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  for (let i = 0; i < m.S.length; i++) if (m.T[i] === 0) m.S[i] = 1;
  return m;
}

function enterTailor() {
  scene = {
    shop: true,
    label: 'Schneiderei',
    house: { n: 0 },
    floor: 'tl',
    map: buildTailorInterior(),
    outX: TAILOR.x + 2.5,
    outY: TAILOR.y + TAILOR.h + 0.7,
  };
  player.x = 10.5;
  player.y = 11.9;
  player.face = 'up';
  player.ang = player.rang = -Math.PI / 2;
  toast(
    '<b>Schneiderei.</b> Hier gibt es besondere Outfits, die du nirgendwo sonst zusammenstellen kannst. Geh zu einer Puppe und drück E.',
    5000,
  );
}

// ----- Zeichnen -----
const TAILOR_KINDS = new Set(['mannequin', 'tcounter', 'tailorman', 'fabric', 'sewing', 'mirror']);

function drawTailorObj(c, o) {
  const X = o.x * TILE,
    Y = o.y * TILE,
    w = o.w * TILE;
  if (o.k === 'mannequin') {
    const own = ownsOutfit(o.outfit);
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath();
    c.ellipse(X + 16, Y + 30, 10, 3, 0, 0, 7);
    c.fill();
    c.fillStyle = '#5a3a1e';
    c.fillRect(X + 10, Y + 28, 12, 3);
    drawPerson(c, X + 16, Y + 29, outfitLook(o.outfit), 'down', 0, { ang: Math.PI / 2 });
    // Preisschild
    c.font = 'bold 7px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    const t = own ? '✓ deins' : o.outfit.p + ' 🪙',
      tw = c.measureText(t).width + 6;
    c.fillStyle = own ? '#3f9a3a' : '#fff8e6';
    c.fillRect(X + 16 - tw / 2, Y + 33, tw, 9);
    c.strokeStyle = '#5a3a1e';
    c.lineWidth = 0.8;
    c.strokeRect(X + 16 - tw / 2, Y + 33, tw, 9);
    c.fillStyle = own ? '#fff' : '#2e2216';
    c.fillText(t, X + 16, Y + 40);
  } else if (o.k === 'tcounter') {
    c.fillStyle = '#6b4226';
    c.fillRect(X, Y + 4, w, 26);
    c.fillStyle = '#a8743f';
    c.fillRect(X, Y + 2, w, 8);
    c.fillStyle = 'rgba(255,255,255,.15)';
    c.fillRect(X, Y + 2, w, 2);
    c.fillStyle = '#e8d6b0';
    c.fillRect(X + 10, Y + 3, 22, 5);
    c.fillStyle = '#c95a7a';
    c.fillRect(X + 40, Y + 2, 18, 6);
    c.fillStyle = '#d4af37';
    c.beginPath();
    c.arc(X + w - 24, Y + 5, 3, 0, 7);
    c.fill();
    // Maßband
    c.strokeStyle = '#3fa7d6';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(X + 70, Y + 4);
    c.quadraticCurveTo(X + 90, Y + 12, X + 110, Y + 4);
    c.stroke();
  } else if (o.k === 'tailorman') {
    drawPerson(c, X + 16, Y + 30, TAILOR_LOOK, 'down', 0, { ang: Math.PI / 2 });
    c.strokeStyle = '#e5484d';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(X + 10, Y + 2);
    c.quadraticCurveTo(X + 16, Y + 10, X + 22, Y + 2);
    c.stroke();
  } else if (o.k === 'fabric') {
    const cols = ['#c95a7a', '#3fa7d6', '#f2c12e', '#3f9a3a', '#8a5cd6', '#f26b1d'];
    for (let k = 0; k < 6; k++) {
      const yy = Y + 4 + k * 14;
      c.fillStyle = cols[(k + (o.x > 10 ? 3 : 0)) % 6];
      c.fillRect(X + 3, yy, 26, 11);
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.fillRect(X + 3, yy, 26, 3);
      c.fillStyle = 'rgba(0,0,0,.2)';
      c.beginPath();
      c.ellipse(X + 29, yy + 5.5, 2, 5.5, 0, 0, 7);
      c.fill();
    }
  } else if (o.k === 'sewing') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X, Y + 12, w, 18);
    c.fillStyle = '#a8743f';
    c.fillRect(X, Y + 10, w, 5);
    c.fillStyle = '#2b2b2b';
    c.fillRect(X + 14, Y - 6, 32, 16);
    c.fillRect(X + 14, Y - 6, 8, 22);
    c.fillStyle = '#d4af37';
    c.fillRect(X + 18, Y - 3, 24, 2);
    c.fillStyle = '#c0c0c0';
    c.fillRect(X + 40, Y + 8, 2, 6);
    c.fillStyle = '#f7f7f2';
    c.fillRect(X + 26, Y + 11, 22, 4);
  } else if (o.k === 'mirror') {
    c.fillStyle = '#8a5a35';
    c.fillRect(X + 8, Y - 30, 48, 60);
    const g = c.createLinearGradient(X + 12, Y - 26, X + 52, Y + 26);
    g.addColorStop(0, '#e8f6fb');
    g.addColorStop(0.5, '#a9d3e4');
    g.addColorStop(1, '#d9eef5');
    c.fillStyle = g;
    c.fillRect(X + 12, Y - 26, 40, 52);
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath();
    c.moveTo(X + 16, Y - 22);
    c.lineTo(X + 26, Y - 22);
    c.lineTo(X + 16, Y - 8);
    c.fill();
  }
}

// Schild über der Tür (Außenansicht)
function drawTailorSign(c) {
  const X = (TAILOR.x + TAILOR.w / 2) * TILE,
    Y = (TAILOR.y + TAILOR.h) * TILE - 50;
  c.fillStyle = '#5a3a1e';
  c.fillRect(X - 44, Y - 1, 88, 18);
  c.fillStyle = '#f3e6c4';
  c.fillRect(X - 42, Y + 1, 84, 14);
  c.fillStyle = '#7a3f8c';
  c.font = 'bold 10px "Pixelify Sans", monospace';
  c.textAlign = 'center';
  c.fillText('✂ SCHNEIDEREI', X, Y + 11.5);
}

// Puppen und Schneider als Figuren in der 3D-Ansicht
function addTailorSprites3D(add) {
  for (const o of scene.map.objs) {
    if (o.k === 'mannequin') add(o.x + 0.5, o.y + 0.6, sprPerson(outfitLook(o.outfit), Math.PI / 2, null));
    else if (o.k === 'tailorman') add(o.x + 0.5, o.y + 0.6, sprPerson(TAILOR_LOOK, Math.PI / 2, null));
  }
}
