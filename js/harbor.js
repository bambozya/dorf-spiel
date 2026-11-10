// ================= Hafen oben links =================
const HARBOR_COST = 1000;

function buildHarbor() {
  for (let y = 0; y <= 9; y++)
    for (let x = 0; x <= 8; x++) {
      fence[tileIndex(x, y)] = 0;
      solid[tileIndex(x, y)] = 0;
      if (ground[tileIndex(x, y)] !== 1) ground[tileIndex(x, y)] = 0;
    }
  rect(ground, 0, 0, 6, 8, 9);
  rect(solid, 0, 0, 6, 8, 1);
  rect(ground, 6, 0, 2, 9, 10);
  rect(ground, 0, 8, 6, 1, 10);
  rect(ground, 2, 3, 4, 2, 11);
  rect(solid, 2, 3, 4, 2, 0);
  if (!state.harbor) {
    rect(solid, 8, 0, 1, 10, 1);
    rect(solid, 0, 9, 9, 1, 1);
  }
}

function applyHarbor() {
  rect(solid, 8, 0, 1, 10, 0);
  rect(solid, 0, 9, 9, 1, 0);
  for (let y = 0; y <= 9; y++)
    for (let x = 0; x <= 8; x++) {
      const i = tileIndex(x, y);
      if (TREEAT[i] !== undefined && TREEAT[i] >= 0 && TREES[TREEAT[i]]) solid[i] = 1;
    }
  rect(solid, 0, 0, 6, 8, 1);
  rect(solid, 2, 3, 4, 2, 0);
  if (GCV) buildGround();
}

function seaTile(g, i, j, r, R) {
  const X = i * TILE,
    Y = j * TILE,
    t = Math.max(0, Math.min(1, Math.min(6 - i - 0.5, 8 - j - 0.5) / 5));
  const gr = g.createRadialGradient(6 * TILE, 8 * TILE, TILE * 0.5, 6 * TILE, 8 * TILE, TILE * 9);
  gr.addColorStop(0, '#5aafc2');
  gr.addColorStop(0.3, '#3489b8');
  gr.addColorStop(0.7, '#1d6696');
  gr.addColorStop(1, '#134f80');
  g.fillStyle = gr;
  g.fillRect(X, Y, TILE + 0.5, TILE + 0.5);
  for (let k = 0; k < 5; k++)
    blob(g, X + R(0, 32), Y + R(0, 32), R(5, 13), R(2, 5), t > 0.5 ? '#0f4470' : '#4fa6bf', 0.22);
  g.strokeStyle = 'rgba(210,240,255,.16)';
  g.lineWidth = 0.9;
  for (let k = 0; k < 2; k++) {
    const sx = X + R(2, 24),
      sy = Y + R(4, 28);
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(sx + 4, sy - 2.5, sx + 8, sy);
    g.quadraticCurveTo(sx + 12, sy + 2.5, sx + 16, sy);
    g.stroke();
  }
  if (i === 5)
    for (let k = 0; k < 6; k++)
      blob(g, X + 32 - R(0, 3), Y + R(0, 32), R(1.5, 3), R(1, 2.2), '#eaf6f6', R(0.35, 0.6));
  if (j === 7)
    for (let k = 0; k < 6; k++)
      blob(g, X + R(0, 32), Y + 32 - R(0, 3), R(1.5, 3), R(1, 2.2), '#eaf6f6', R(0.35, 0.6));
}

function quayTile(g, i, j, r, R) {
  const X = i * TILE,
    Y = j * TILE;
  g.fillStyle = '#8e8a80';
  g.fillRect(X, Y, TILE + 0.5, TILE + 0.5);
  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++) {
      const v = 0.9 + r() * 0.18;
      g.fillStyle = `rgb(${[176, 170, 158].map((q) => Math.min(255, (q * v) | 0))})`;
      g.fillRect(X + a * 16 + 1, Y + b * 16 + 1, 14.5, 14.5);
      g.fillStyle = 'rgba(255,255,255,.12)';
      g.fillRect(X + a * 16 + 1, Y + b * 16 + 1, 14.5, 1.4);
      g.fillStyle = 'rgba(0,0,0,.12)';
      g.fillRect(X + a * 16 + 1, Y + b * 16 + 14, 14.5, 1.4);
    }
  if (r() < 0.3) blob(g, X + R(4, 28), Y + R(4, 28), R(2, 4), R(1, 2.5), '#6d7a52', 0.35);
  const sea = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && ground[tileIndex(x, y)] === 9;
  if (sea(i - 1, j)) {
    g.fillStyle = '#5a564e';
    g.fillRect(X, Y, 4, TILE);
    g.fillStyle = '#c9c3b6';
    g.fillRect(X + 4, Y, 2, TILE);
  }
  if (sea(i, j - 1)) {
    g.fillStyle = '#c9c3b6';
    g.fillRect(X, Y, TILE, 2.5);
  }
}

function pierTile(g, i, j, r, R) {
  const X = i * TILE,
    Y = j * TILE;
  seaTile(g, i, j, r, R);
  const done = state.harbor;
  g.fillStyle = 'rgba(10,30,45,.35)';
  g.fillRect(X, Y + (j === 4 ? TILE : 0), TILE, j === 4 ? 6 : 0);
  for (let x = X; x < X + TILE; x += 6) {
    const built = done || (i >= 4 && r() < 0.85) || (i === 3 && r() < 0.35);
    if (!built) continue;
    const v = 0.85 + r() * 0.25;
    g.fillStyle = `rgb(${[170, 118, 66].map((q) => Math.min(255, (q * v) | 0))})`;
    g.fillRect(x, Y + (j === 3 ? 2 : 0), 5.2, TILE - (j === 3 ? 2 : 2));
    g.fillStyle = 'rgba(60,35,15,.35)';
    g.fillRect(x + 1 + r() * 3, Y + 4 + r() * 18, 0.7, 6 + r() * 6);
    g.fillStyle = '#2b2b2b';
    g.fillRect(x + 2, Y + (j === 3 ? 5 : 3), 1, 1);
  }
  g.fillStyle = '#4a2e1a';
  if (j === 3) g.fillRect(X, Y + 1, TILE, 3);
  else g.fillRect(X, Y + TILE - 3, TILE, 3);
  if (!done && i < 4) {
    g.fillStyle = '#3a2414';
    g.fillRect(X + 14, Y + (j === 3 ? 2 : 0), 4, TILE - 2);
  }
}

function drawBoat(c, x, y, a, bob) {
  c.save();
  c.translate(x, y + Math.sin(now * 1.8 + (bob || 0)) * 1.2);
  c.rotate(a);
  c.fillStyle = 'rgba(10,30,45,.3)';
  c.beginPath();
  c.ellipse(2, 4, 26, 11, 0, 0, 7);
  c.fill();
  const g = c.createLinearGradient(0, -11, 0, 11);
  g.addColorStop(0, '#c98a52');
  g.addColorStop(0.5, '#9a5f30');
  g.addColorStop(1, '#6b3f1e');
  c.fillStyle = g;
  c.strokeStyle = '#3a2414';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-22, -7);
  c.quadraticCurveTo(10, -12, 25, 0);
  c.quadraticCurveTo(10, 12, -22, 7);
  c.quadraticCurveTo(-25, 0, -22, -7);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#e8d6b0';
  c.beginPath();
  c.moveTo(-19, -4.6);
  c.quadraticCurveTo(8, -9, 20, 0);
  c.quadraticCurveTo(8, 9, -19, 4.6);
  c.quadraticCurveTo(-21, 0, -19, -4.6);
  c.fill();
  c.strokeStyle = 'rgba(120,80,40,.35)';
  c.lineWidth = 0.7;
  for (let k = -2; k <= 2; k++) {
    c.beginPath();
    c.moveTo(-19, k * 1.8);
    c.quadraticCurveTo(4, k * 3, 19, k * 0.6);
    c.stroke();
  }
  c.fillStyle = '#8a5a35';
  c.fillRect(-12, -6.5, 4, 13);
  c.fillRect(6, -7.5, 4, 15);
  c.fillStyle = '#2e7fb0';
  c.fillRect(-22, -1.5, 3, 3);
  c.strokeStyle = '#a8743f';
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-2, -8);
  c.lineTo(-10, -19);
  c.moveTo(-2, 8);
  c.lineTo(-10, 19);
  c.stroke();
  c.fillStyle = '#a8743f';
  c.beginPath();
  c.ellipse(-11, -20.5, 2, 3.4, 0.6, 0, 7);
  c.ellipse(-11, 20.5, 2, 3.4, -0.6, 0, 7);
  c.fill();
  c.restore();
}

function drawHarborProps(c, D) {
  if (!state.harbor) {
    const tape = (x0, y0, x1, y1) => {
      const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 10);
      for (let k = 0; k < n; k++) {
        const ax = x0 + ((x1 - x0) * k) / n,
          ay = y0 + ((y1 - y0) * k) / n,
          bx = x0 + ((x1 - x0) * (k + 1)) / n,
          by = y0 + ((y1 - y0) * (k + 1)) / n;
        c.strokeStyle = k % 2 ? '#ffffff' : '#d9302a';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
      }
    };
    D.push([
      9.6,
      () => {
        const Y = 9.55 * TILE;
        for (let x = 0; x <= 9; x++) {
          c.fillStyle = '#3a3a3a';
          c.fillRect(x * TILE + 2, Y - 16, 3, 18);
        }
        tape(0, Y - 12, 9 * TILE + 4, Y - 12);
        tape(0, Y - 4, 9 * TILE + 4, Y - 4);
        const sx = 3 * TILE,
          sy = Y - 34;
        c.fillStyle = '#3a3a3a';
        c.fillRect(sx + 14, sy + 16, 3, 18);
        c.fillRect(sx + 54, sy + 16, 3, 18);
        c.fillStyle = '#f2c12e';
        c.fillRect(sx, sy, 72, 20);
        c.strokeStyle = '#2b2b2b';
        c.lineWidth = 2;
        c.strokeRect(sx, sy, 72, 20);
        c.fillStyle = '#2b2b2b';
        c.font = 'bold 8px "Pixelify Sans", monospace';
        c.textAlign = 'center';
        c.fillText('BAUSTELLE HAFEN', sx + 36, sy + 9);
        c.fillText(HARBOR_COST + ' Münzen', sx + 36, sy + 17);
      },
    ]);
    D.push([
      9,
      () => {
        for (let y = 0; y < 9; y++) {
          c.fillStyle = '#3a3a3a';
          c.fillRect(8.55 * TILE, y * TILE + 16, 3, 18);
        }
        tape(8.6 * TILE, 0, 8.6 * TILE, 9.5 * TILE - 12);
      },
    ]);
    D.push([
      6.6,
      () => {
        const X = 6.3 * TILE,
          Y = 6.4 * TILE;
        c.fillStyle = '#d9b77a';
        c.beginPath();
        c.ellipse(X, Y, 18, 10, 0, 0, 7);
        c.fill();
        c.fillStyle = '#e8cc94';
        c.beginPath();
        c.ellipse(X - 3, Y - 4, 11, 6, 0, 0, 7);
        c.fill();
        c.fillStyle = '#8a8a8a';
        c.fillRect(X + 8, Y - 2, 9, 7);
      },
    ]);
    D.push([
      2.2,
      () => {
        const X = 6.2 * TILE,
          Y = 1.5 * TILE;
        for (let k = 0; k < 5; k++) {
          c.fillStyle = k % 2 ? '#b98a52' : '#a8743f';
          c.fillRect(X, Y - k * 4, 40, 4);
          c.fillStyle = 'rgba(0,0,0,.2)';
          c.fillRect(X, Y - k * 4 + 3, 40, 1);
        }
      },
    ]);
    for (const [x, y] of [
      [7.5, 4.2],
      [6.4, 8.4],
      [7.6, 7.6],
    ])
      D.push([
        y,
        () => {
          const X = x * TILE,
            Y = y * TILE;
          c.fillStyle = '#f26b1d';
          c.beginPath();
          c.moveTo(X - 5, Y);
          c.lineTo(X, Y - 14);
          c.lineTo(X + 5, Y);
          c.closePath();
          c.fill();
          c.fillStyle = '#fff';
          c.fillRect(X - 2.6, Y - 8, 5.2, 2.2);
          c.fillStyle = '#2b2b2b';
          c.fillRect(X - 6, Y - 1, 12, 2);
        },
      ]);
    D.push([
      3,
      () => {
        const X = 3.2 * TILE,
          Y = 2.6 * TILE;
        c.strokeStyle = '#c9a227';
        c.lineWidth = 2;
        c.strokeRect(X, Y - 26, 24, 26);
        c.beginPath();
        c.moveTo(X, Y);
        c.lineTo(X + 24, Y - 26);
        c.moveTo(X, Y - 26);
        c.lineTo(X + 24, Y);
        c.stroke();
      },
    ]);
    return;
  }
  D.push([6.2, () => drawBoat(c, 3.7 * TILE, 5.75 * TILE, 0, 0)]);
  for (const [x, y] of [
    [5.8, 2.75],
    [5.8, 5.25],
    [1.9, 2.75],
  ])
    D.push([
      y,
      () => {
        const X = x * TILE,
          Y = y * TILE;
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.beginPath();
        c.ellipse(X + 1, Y + 3, 5, 2.5, 0, 0, 7);
        c.fill();
        c.fillStyle = '#2f3337';
        c.fillRect(X - 3.5, Y - 8, 7, 10);
        c.fillStyle = '#4a5056';
        c.beginPath();
        c.ellipse(X, Y - 8, 4.5, 2.4, 0, 0, 7);
        c.fill();
      },
    ]);
  D.push([
    5.3,
    () => {
      c.strokeStyle = '#d9c39a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(5.8 * TILE, 5.25 * TILE - 6);
      c.quadraticCurveTo(5.2 * TILE, 5.7 * TILE, 4.4 * TILE, 5.7 * TILE);
      c.stroke();
    },
  ]);
  D.push([
    1.8,
    () => {
      const X = 6.3 * TILE,
        Y = 1.6 * TILE;
      for (const [dx, dy, col] of [
        [0, 0, '#a8743f'],
        [18, 4, '#b98a52'],
        [6, -14, '#9a6a3a'],
      ]) {
        c.fillStyle = col;
        c.fillRect(X + dx, Y + dy - 14, 16, 14);
        c.strokeStyle = '#5a3a1e';
        c.lineWidth = 1;
        c.strokeRect(X + dx, Y + dy - 14, 16, 14);
        c.beginPath();
        c.moveTo(X + dx, Y + dy - 14);
        c.lineTo(X + dx + 16, Y + dy);
        c.stroke();
      }
    },
  ]);
  D.push([
    8.6,
    () => {
      const X = 7.6 * TILE,
        Y = 8.6 * TILE;
      c.fillStyle = '#2f3337';
      c.fillRect(X - 1.5, Y - 40, 3, 40);
      c.fillStyle = '#f6e7b0';
      c.fillRect(X - 4, Y - 48, 8, 8);
      c.strokeStyle = '#2f3337';
      c.lineWidth = 1.2;
      c.strokeRect(X - 4, Y - 48, 8, 8);
      if (night() > 0.3) {
        c.fillStyle = 'rgba(255,220,140,.25)';
        c.beginPath();
        c.arc(X, Y - 44, 22, 0, 7);
        c.fill();
      }
    },
  ]);
  D.push([
    8.9,
    () => {
      const X = 6 * TILE,
        Y = 8.9 * TILE;
      c.fillStyle = '#5a3a1e';
      c.fillRect(X + 10, Y - 14, 3, 16);
      c.fillStyle = '#c99a62';
      c.fillRect(X - 4, Y - 26, 32, 14);
      c.strokeStyle = '#5a3a1e';
      c.lineWidth = 1;
      c.strokeRect(X - 4, Y - 26, 32, 14);
      c.fillStyle = '#1f4f7a';
      c.font = 'bold 9px "Pixelify Sans", monospace';
      c.textAlign = 'center';
      c.fillText('HAFEN', X + 12, Y - 16);
    },
  ]);
}
let harborBusy = false;

function unlockHarbor() {
  if (state.harbor || harborBusy) return;
  if (state.coins < HARBOR_COST)
    return toast(
      `Den Hafen freizuschalten kostet <b>${HARBOR_COST} Glücksmünzen</b>. Du hast ${state.coins}.`,
      4000,
    );
  openModal(
    `<h2>Hafen freischalten?</h2><p>Für <b>${HARBOR_COST} Glücksmünzen</b> wird der Hafen fertig gebaut. Dann kannst du dort angeln und mit dem Boot aufs Meer fahren.</p><p class="keys">Der Hafen ist danach für alle Spieler offen, genau wie die Brücke.</p><div class="actions"><button class="go" id="hy">Ja, freischalten</button><button id="cls">Abbrechen</button></div>`,
  );
  $('cls').onclick = closeModal;
  $('hy').onclick = () => {
    if (state.coins < HARBOR_COST) return;
    state.coins -= HARBOR_COST;
    closeModal();
    harborSet(true, true);
    shareHarbor();
    changed();
  };
}

function harborSet(on, mine, by) {
  if (!on || state.harbor) return;
  state.harbor = true;
  applyHarbor();
  try {
    build3D();
  } catch (e) {}
  moment('harbor', 'Den Hafen freigeschaltet!', 'fish');
  if (mine) {
    toast(
      '<b>Der Hafen ist offen!</b> Am Steg kannst du angeln, und mit dem Ruderboot fährst du aufs Meer hinaus.',
      5000,
    );
    float(4, 7, 'Hafen offen!', '#ffd23f');
  } else
    toast(
      `<b>Der Hafen ist offen!</b> ${by ? esc(String(by).slice(0, 14)) + ' hat ihn freigeschaltet.' : ''}`,
      5000,
    );
  changed();
}

function shareHarbor() {
  if (WORLDDB && state.harbor)
    WORLDDB.doc('harbor')
      .set({ open: true, by: (state.name || 'Jemand').slice(0, 14), at: Date.now() })
      .catch(() => {});
}

// ---- Das Meer ----
function seaFree(m, x, y) {
  return (
    x > 0 &&
    y > 0 &&
    x < IW - 1 &&
    y < IH - 2 &&
    !m.S[y * IW + x] &&
    !m.objs.some((o) => o.k === 'shoal' && Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 3)
  );
}

function placeShoal(m, o) {
  for (let t = 0; t < 60; t++) {
    const x = 1 + ((Math.random() * (IW - 3)) | 0),
      y = 1 + ((Math.random() * (IH - 4)) | 0);
    if (seaFree(m, x, y) && Math.hypot(x - player.x, y - player.y) > 3) {
      o.x = x;
      o.y = y;
      o.ix = x + 0.5;
      o.iy = y + 0.5;
      return;
    }
  }
}

function buildSeaMap() {
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(6),
    objs: [],
    labels: [[1.15, 12.55, 'Das offene Meer']],
    sea: 1,
  };
  const O = (o) => {
    o.solid = o.solid !== false;
    m.objs.push(o);
    return o;
  };
  O({ k: 'isle', x: 3, y: 2, w: 3, h: 2 });
  O({ k: 'searock', x: 12, y: 2, w: 1, h: 1 });
  O({ k: 'searock', x: 7, y: 9, w: 1, h: 1 });
  O({ k: 'searock', x: 16, y: 5, w: 1, h: 1 });
  O({ k: 'searock', x: 2, y: 10, w: 1, h: 1 });
  O({ k: 'buoy', x: 9, y: 5, w: 1, h: 1, solid: false });
  O({ k: 'buoy', x: 14, y: 9, w: 1, h: 1, solid: false });
  O({
    k: 'dock',
    x: 16,
    y: 12,
    w: 4,
    h: 1,
    ix: 18,
    iy: 11.4,
    r: 1.6,
    txt: 'Zurück zum Hafen rudern',
    act: () => {
      leaveHouse();
      toast('Zurück im Hafen.');
    },
  });
  for (let i = 0; i < IW; i++) {
    m.S[i] = 1;
    m.S[(IH - 1) * IW + i] = 1;
  }
  for (let j = 0; j < IH; j++) {
    m.S[j * IW] = 1;
    m.S[j * IW + IW - 1] = 1;
  }
  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  for (const [x, y] of [
    [7, 3],
    [3, 5],
  ]) {
    const o = O({
      k: 'shoal',
      x,
      y,
      w: 1,
      h: 1,
      solid: false,
      ix: x + 0.5,
      iy: y + 0.5,
      r: 1.7,
      txt: 'Fischschwarm: hier angeln',
      secret: 1,
    });
    o.act = () => enterSecret(o);
  }
  for (let k = 0; k < 4; k++) {
    const o = O({
      k: 'shoal',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      solid: false,
      r: 1.7,
      txt: 'Fischschwarm: hier angeln',
    });
    o.act = () => seaFish(o);
    placeShoal(m, o);
  }
  return m;
}

function enterSea() {
  if (player.mount) return toast('Steig zuerst ab.');
  scene = {
    sea: true,
    shop: true,
    label: 'Meer',
    house: { n: 0 },
    floor: 'sea',
    map: buildSeaMap(),
    outX: 3.8,
    outY: 4.6,
  };
  player.x = 18;
  player.y = 10.6;
  player.face = 'up';
  player.ang = player.rang = -Math.PI / 2;
  toast(
    '<b>Aufs Meer!</b> Rudere mit W A S D zu den springenden Fischen und angle dort mit E. Am Steg unten rechts geht es zurück.',
    5500,
  );
  moment('sea1', 'Zum ersten Mal mit dem Boot aufs Meer gefahren!', 'fish');
}

function seaFish(o) {
  if (!hasTool('rod')) return toast('Zum Angeln brauchst du eine <b>Angel</b> aus der Werkstatt.');
  if (player.work) return;
  player.ang = player.rang = Math.atan2(o.iy - player.y, o.ix - player.x);
  player.work = { kind: 'fish', t: 0, dur: 1.8 + Math.random() * 1.8, wx: o.ix, wy: o.iy, shoal: o };
}

function drawSeaTile(c, X, Y, i, j) {
  const h = hh(i, j);
  c.strokeStyle = 'rgba(220,245,255,.22)';
  c.lineWidth = 1;
  const o = (now * 10 + (h & 31)) % 32;
  c.beginPath();
  c.moveTo(X + ((h >> 5) & 15), Y + o);
  c.quadraticCurveTo(X + ((h >> 5) & 15) + 5, Y + o - 2.5, X + ((h >> 5) & 15) + 10, Y + o);
  c.stroke();
  if (Math.sin(now * 2.5 + h) > 0.93) {
    c.fillStyle = 'rgba(255,255,255,.8)';
    c.fillRect(X + (h % 26) + 3, Y + ((h >> 3) % 26) + 3, 2, 1.2);
  }
}

function drawSeaObj(c, o) {
  const X = o.x * TILE,
    Y = o.y * TILE;
  if (o.k === 'isle') {
    c.fillStyle = '#e8d29a';
    c.beginPath();
    c.ellipse(X + 48, Y + 34, 52, 30, 0, 0, 7);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.stroke();
    c.fillStyle = '#7cb55a';
    c.beginPath();
    c.ellipse(X + 44, Y + 28, 34, 18, 0, 0, 7);
    c.fill();
    c.fillStyle = '#5f9a44';
    c.beginPath();
    c.ellipse(X + 38, Y + 24, 18, 9, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#8a5a35';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(X + 58, Y + 34);
    c.quadraticCurveTo(X + 62, Y + 12, X + 56, Y - 4);
    c.stroke();
    c.fillStyle = '#3f8a3a';
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      c.beginPath();
      c.ellipse(X + 56 + Math.cos(a) * 9, Y - 4 + Math.sin(a) * 4, 10, 3, a, 0, 7);
      c.fill();
    }
  } else if (o.k === 'searock') {
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.beginPath();
    c.ellipse(X + 16, Y + 24, 15, 6, 0, 0, 7);
    c.fill();
    c.fillStyle = '#6f6a62';
    c.beginPath();
    c.moveTo(X + 4, Y + 24);
    c.lineTo(X + 8, Y + 8);
    c.lineTo(X + 18, Y + 4);
    c.lineTo(X + 28, Y + 12);
    c.lineTo(X + 28, Y + 24);
    c.closePath();
    c.fill();
    c.fillStyle = '#8f897e';
    c.beginPath();
    c.moveTo(X + 8, Y + 10);
    c.lineTo(X + 18, Y + 5);
    c.lineTo(X + 22, Y + 14);
    c.lineTo(X + 10, Y + 18);
    c.closePath();
    c.fill();
  } else if (o.k === 'buoy') {
    const b = Math.sin(now * 2 + o.x) * 1.5;
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.beginPath();
    c.ellipse(X + 16, Y + 22 + b, 9, 3, 0, 0, 7);
    c.fill();
    c.fillStyle = '#d9302a';
    c.beginPath();
    c.moveTo(X + 10, Y + 20 + b);
    c.lineTo(X + 16, Y + 2 + b);
    c.lineTo(X + 22, Y + 20 + b);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(X + 12.5, Y + 10 + b, 7, 3);
  } else if (o.k === 'shoal') {
    for (let k = 0; k < 4; k++) {
      const ph = (now * 0.9 + k * 0.25) % 1,
        a = k * 1.7 + o.x,
        rx = X + 16 + Math.cos(a) * 9,
        ry = Y + 16 + Math.sin(a) * 6;
      c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(rx, ry, 3 + ph * 9, 1.5 + ph * 3.5, 0, 0, 7);
      c.stroke();
      if (ph < 0.35) {
        const jy = Math.sin((ph / 0.35) * Math.PI) * 9;
        c.fillStyle = '#c9d8e4';
        c.beginPath();
        c.ellipse(rx, ry - jy, 4, 1.8, ph * 6, 0, 7);
        c.fill();
      }
    }
    c.fillStyle = 'rgba(15,50,80,.35)';
    c.beginPath();
    c.ellipse(X + 16, Y + 18, 13, 7, 0, 0, 7);
    c.fill();
  } else if (o.k === 'dock') {
    c.fillStyle = 'rgba(10,30,45,.35)';
    c.fillRect(X, Y + TILE, o.w * TILE, 6);
    for (let x = X; x < X + o.w * TILE; x += 6) {
      c.fillStyle = ((x / 6) | 0) % 2 ? '#a8743f' : '#b98a52';
      c.fillRect(x, Y + 2, 5.2, TILE - 2);
    }
    c.fillStyle = '#4a2e1a';
    c.fillRect(X, Y, o.w * TILE, 3);
    c.fillRect(X, Y + TILE - 3, o.w * TILE, 3);
    c.fillStyle = '#2f3337';
    c.fillRect(X + 4, Y - 6, 6, 9);
    c.fillRect(X + o.w * TILE - 10, Y - 6, 6, 9);
    c.fillStyle = '#c99a62';
    c.fillRect(X + (o.w * TILE) / 2 - 24, Y - 22, 48, 13);
    c.fillStyle = '#1f4f7a';
    c.font = 'bold 8px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillText('→ HAFEN', X + (o.w * TILE) / 2, Y - 12.5);
  }
}
