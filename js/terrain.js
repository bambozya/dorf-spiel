// ================= Realistischer Boden (einmal vorgezeichnet) =================
const GSC = 1.5;
let GCV = null,
  GP = null,
  GPW = 0;
const MUDS = [];

function blob(g, x, y, rx, ry, col, a) {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, 7);
  g.fill();
  g.globalAlpha = 1;
}
const RIVL = 48 * TILE,
  RIVR = 52 * TILE;

function waterTile(g, i, j, r, R) {
  const X = i * TILE,
    Y = j * TILE;
  const gr = g.createLinearGradient(RIVL, 0, RIVR, 0);
  gr.addColorStop(0, '#6fae9c');
  gr.addColorStop(0.08, '#3f97b5');
  gr.addColorStop(0.3, '#24719f');
  gr.addColorStop(0.5, '#1b5f8e');
  gr.addColorStop(0.7, '#24719f');
  gr.addColorStop(0.92, '#3f97b5');
  gr.addColorStop(1, '#6fae9c');
  g.fillStyle = gr;
  g.fillRect(X, Y, TILE + 0.5, TILE + 0.5);
  const edge = i === 48 || i === 51;
  for (let k = 0; k < 5; k++)
    blob(g, X + R(0, 32), Y + R(0, 32), R(5, 13), R(2, 5), edge ? '#4d9fb0' : '#164d78', edge ? 0.25 : 0.22);
  if (edge) {
    for (let k = 0; k < 9; k++) {
      const px = i === 48 ? X + R(1, 16) : X + R(16, 31),
        py = Y + R(1, 31),
        pr = R(0.8, 2.2);
      blob(g, px, py, pr, pr * 0.7, pick(['#8c8a74', '#a39a7c', '#6f7466', '#b5ab8a'], r), 0.45);
    }
  }
  g.strokeStyle = 'rgba(200,235,255,.10)';
  g.lineWidth = 0.8;
  for (let k = 0; k < 3; k++) {
    const sx = X + R(2, 28),
      sy = Y + R(2, 28);
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(sx + R(-4, 4), sy + R(3, 6), sx + R(-3, 3), sy + R(7, 12));
    g.stroke();
  }
  if (i === 48) {
    for (let k = 0; k < 7; k++)
      blob(g, X + R(0, 3.5), Y + R(0, 32), R(1.5, 3.5), R(1, 2.5), '#e8f4f2', R(0.35, 0.6));
  }
  if (i === 51) {
    for (let k = 0; k < 7; k++)
      blob(g, X + 32 - R(0, 3.5), Y + R(0, 32), R(1.5, 3.5), R(1, 2.5), '#e8f4f2', R(0.35, 0.6));
  }
}

function drawBanks(g) {
  for (let j = 1; j < MAP_H - 1; j++) {
    if (j >= 27 && j <= 30) continue;
    for (const [i, dir] of [
      [47, 1],
      [52, -1],
    ]) {
      const t = ground[tileIndex(i, j)];
      if (t === 3 || t === 7) continue;
      const r = rng(j * 131 + i * 7),
        X = i * TILE,
        Y = j * TILE;
      const ex = dir > 0 ? X + 32 : X;
      g.fillStyle = 'rgba(60,45,25,.25)';
      g.fillRect(dir > 0 ? ex - 4 : ex, Y, 4, TILE);
      const n = 1 + ((r() * 2.4) | 0);
      for (let k = 0; k < n; k++) {
        const sx = ex - dir * (2 + r() * 7),
          sy = Y + 4 + r() * 24,
          sr = 2 + r() * 3.2;
        blob(g, sx + 1, sy + 1.2, sr, sr * 0.7, '#3d3a33', 0.35);
        blob(g, sx, sy, sr, sr * 0.72, pick(['#8f897e', '#a39d90', '#7d786d'], r), 1);
        blob(g, sx - sr * 0.3, sy - sr * 0.3, sr * 0.45, sr * 0.28, '#ffffff', 0.25);
      }
      if (r() < 0.45) {
        const bx = ex - dir * (4 + r() * 8),
          by = Y + 6 + r() * 20;
        for (let k = 0; k < 7; k++) {
          const x = bx + (r() - 0.5) * 7,
            h = 7 + r() * 9,
            lean = (r() - 0.5) * 3;
          g.strokeStyle = pick(['#5d8a3a', '#6f9a44', '#4f7a32'], r);
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x, by + 4);
          g.quadraticCurveTo(x + lean * 0.4, by + 4 - h * 0.6, x + lean, by + 4 - h);
          g.stroke();
          if (r() < 0.35) {
            g.fillStyle = '#6b4226';
            g.fillRect(x + lean - 1, by + 4 - h - 1, 2, 4);
          }
        }
      }
    }
  }
}

function drawBridgeDeck(g, x0, x1, done) {
  if (x1 <= x0) return;
  const Y0 = 28 * TILE,
    Y1 = 30 * TILE,
    r = rng(4242);
  // Schatten auf dem Wasser und Pfähle
  const sg = g.createLinearGradient(0, Y1, 0, Y1 + 9);
  sg.addColorStop(0, 'rgba(10,30,45,.45)');
  sg.addColorStop(1, 'rgba(10,30,45,0)');
  g.fillStyle = sg;
  g.fillRect(x0, Y1, x1 - x0, 9);
  g.fillStyle = 'rgba(10,30,45,.25)';
  g.fillRect(x0, Y0 - 3, x1 - x0, 3);
  for (let px = 48.5; px < x1 / TILE; px += 1) {
    const X = px * TILE;
    g.fillStyle = '#3a2a1e';
    g.fillRect(X - 3, Y1 - 2, 6, 8);
    g.fillStyle = '#5a3a1e';
    g.fillRect(X - 3, Y1 - 2, 2, 8);
    g.strokeStyle = 'rgba(220,240,255,.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(X, Y1 + 6, 6, 2, 0, 0, Math.PI);
    g.stroke();
  }
  // Bohlen
  g.fillStyle = '#2e2016';
  g.fillRect(x0, Y0, x1 - x0, Y1 - Y0);
  for (let x = x0; x < x1; x += 6) {
    const w = Math.min(5.2, x1 - x),
      v = 0.86 + r() * 0.24,
      off = (r() - 0.5) * 1.4;
    g.fillStyle = `rgb(${[176, 122, 67].map((q) => Math.min(255, (q * v) | 0))})`;
    g.fillRect(x, Y0 + 1 + off, w, Y1 - Y0 - 2);
    g.fillStyle = 'rgba(255,240,210,.14)';
    g.fillRect(x, Y0 + 1 + off, w, 1.2);
    g.fillStyle = 'rgba(60,35,15,.35)';
    for (let k = 0; k < 3; k++) g.fillRect(x + 0.8 + r() * (w - 1.6), Y0 + 4 + r() * 44, 0.7, 5 + r() * 9);
    if (r() < 0.12) {
      g.fillStyle = 'rgba(50,30,12,.6)';
      g.beginPath();
      g.ellipse(x + w / 2, Y0 + 10 + r() * 40, 1.2, 0.8, 0, 0, 7);
      g.fill();
    }
    g.fillStyle = '#2b2b2b';
    g.fillRect(x + 1.2, Y0 + 5, 1, 1);
    g.fillRect(x + w - 2.2, Y0 + 5, 1, 1);
    g.fillRect(x + 1.2, Y1 - 6, 1, 1);
    g.fillRect(x + w - 2.2, Y1 - 6, 1, 1);
  }
  // Längsbalken
  g.fillStyle = '#4a2e1a';
  g.fillRect(x0, Y0 - 1, x1 - x0, 4);
  g.fillRect(x0, Y1 - 3, x1 - x0, 4);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.fillRect(x0, Y0 - 1, x1 - x0, 1);
  g.fillStyle = '#3a2414';
  g.fillRect(x0, Y1 + 1, x1 - x0, 3);
  if (!done) {
    g.fillStyle = '#3a2414';
    g.fillRect(x1 - 3, Y0 - 2, 4, Y1 - Y0 + 6);
  }
}

function drawBridgePart(g) {
  const w = bridgeWood();
  if (w <= 0) return;
  drawBridgeDeck(g, BX0 * TILE, bridgeEnd() * TILE, w >= BRIDGE_WOOD);
}

function drawRail(c, y, front) {
  const x0 = BX0 * TILE,
    x1 = bridgeEnd() * TILE;
  if (x1 - x0 < 4) return;
  const Y = y * TILE;
  const post = (X) => {
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.fillRect(X - 1, Y + 1, 6, 3);
    c.fillStyle = '#5a3a1e';
    c.fillRect(X, Y - 15, 4, 17);
    c.fillStyle = '#7a5030';
    c.fillRect(X, Y - 15, 1.5, 17);
    c.fillStyle = '#3a2414';
    c.fillRect(X, Y - 16, 4, 2);
  };
  for (let x = x0 + 1; x <= x1 - 3; x += TILE) post(x);
  if ((x1 - x0) % TILE > 6) post(x1 - 5);
  c.fillStyle = '#6b4226';
  c.fillRect(x0, Y - 14, x1 - x0, 3);
  c.fillStyle = '#a8743f';
  c.fillRect(x0, Y - 14, x1 - x0, 1);
  c.fillStyle = '#5a3a1e';
  c.fillRect(x0, Y - 7, x1 - x0, 2);
  if (front) {
    c.fillStyle = 'rgba(0,0,0,.15)';
    c.fillRect(x0, Y - 11, x1 - x0, 1);
  }
}

function sprBridgePost() {
  return mkSpr(
    'bpost',
    8,
    24,
    (c) => {
      c.fillStyle = '#5a3a1e';
      c.fillRect(2, 4, 4, 20);
      c.fillStyle = '#7a5030';
      c.fillRect(2, 4, 1.5, 20);
      c.fillStyle = '#3a2414';
      c.fillRect(1, 2, 6, 3);
      c.fillStyle = '#6b4226';
      c.fillRect(0, 6, 8, 2);
    },
    3,
    24,
  );
}

function groundBase(g, i, j) {
  const t = ground[tileIndex(i, j)],
    X = i * TILE,
    Y = j * TILE,
    r = rng(hh(i, j) + 7),
    R = (a, b) => a + r() * (b - a);
  const fill = (c) => {
    g.fillStyle = c;
    g.fillRect(X, Y, TILE + 0.5, TILE + 0.5);
  };
  if (t === 0 || t === 8) {
    fill(t ? '#72b752' : '#79bf57');
    for (let k = 0; k < 6; k++)
      blob(
        g,
        X + R(0, 32),
        Y + R(0, 32),
        R(4, 12),
        R(3, 9),
        pick(['#8ccd67', '#5fa544', '#86c95f', '#66ad4a', '#93d16f'], r),
        0.28,
      );
    for (let k = 0; k < 22; k++) {
      g.fillStyle = pick(['#4f9a3c', '#5ea946', '#a5dd7e', '#8bcf68'], r);
      const bx = X + R(0, 31),
        by = Y + R(2, 32);
      g.fillRect(bx, by - R(3, 6), 1, R(3, 6));
    }
    if (r() < 0.05) {
      const fx = X + R(5, 27),
        fy = Y + R(5, 27),
        fc = pick(['#ffffff', '#ffe066', '#c9a3ff', '#ff9ec4'], r);
      for (const [a, b] of [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
      ])
        blob(g, fx + a, fy + b, 1.6, 1.6, fc, 1);
      blob(g, fx, fy, 1.2, 1.2, '#e8a21c', 1);
    }
  } else if (t === 1) {
    fill('#d0a670');
    for (let k = 0; k < 5; k++)
      blob(
        g,
        X + R(0, 32),
        Y + R(0, 32),
        R(5, 12),
        R(3, 8),
        pick(['#c4975f', '#dcb88a', '#c99e68'], r),
        0.35,
      );
    for (let k = 0; k < 7; k++) {
      const px = X + R(1, 31),
        py = Y + R(1, 31),
        pr = R(0.8, 2.4);
      blob(g, px + 0.6, py + 0.6, pr, pr * 0.8, '#8f6d45', 0.5);
      blob(g, px, py, pr, pr * 0.8, pick(['#b8936a', '#a88660', '#e3cfa8'], r), 1);
    }
  } else if (t === 2) {
    fill('#a89e8a');
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++) {
        const sx = X + a * 8 + (b % 2 ? 4 : 0) - 2,
          sy = Y + b * 8,
          c0 = pick(['#d8d0be', '#cdc4b0', '#e2dbca', '#c7bda8', '#d2c8b2'], r);
        g.fillStyle = c0;
        g.beginPath();
        g.roundRect ? g.roundRect(sx + 0.8, sy + 0.8, 6.6, 6.6, 2) : g.rect(sx + 0.8, sy + 0.8, 6.6, 6.6);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.25)';
        g.fillRect(sx + 1.6, sy + 1.2, 4, 1.2);
        g.fillStyle = 'rgba(0,0,0,.12)';
        g.fillRect(sx + 1.2, sy + 6, 5.4, 1);
      }
  } else if (t === 3 || t === 7) {
    waterTile(g, i, j, r, R);
  } else if (t === 9) {
    seaTile(g, i, j, r, R);
  } else if (t === 10) {
    quayTile(g, i, j, r, R);
  } else if (t === 11) {
    pierTile(g, i, j, r, R);
  } else if (t === 4) {
    fill('#7a4e2f');
    for (let k = 4; k < 32; k += 8) {
      g.fillStyle = '#62391f';
      g.fillRect(X, Y + k, TILE, 2.5);
      g.fillStyle = '#93613b';
      g.fillRect(X, Y + k + 2.5, TILE, 1.5);
    }
    for (let k = 0; k < 8; k++)
      blob(g, X + R(0, 32), Y + R(0, 32), R(1, 2.5), R(1, 2), pick(['#8f5d38', '#5e3a22'], r), 0.9);
  } else if (t === 5) {
    fill('#b78b58');
    for (let k = 0; k < 6; k++)
      blob(g, X + R(0, 32), Y + R(0, 32), R(4, 10), R(3, 7), pick(['#a87c4c', '#c69a66', '#9c7246'], r), 0.4);
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = 'rgba(80,55,30,.55)';
      g.lineWidth = 1.3;
      g.beginPath();
      g.arc(X + R(4, 28), Y + R(4, 28), 2.5, 0.2, Math.PI - 0.2);
      g.stroke();
    }
    for (let k = 0; k < 4; k++) {
      g.strokeStyle = pick(['#e8c547', '#d9b23a'], r);
      g.lineWidth = 0.8;
      const hx = X + R(0, 30),
        hy = Y + R(0, 30);
      g.beginPath();
      g.moveTo(hx, hy);
      g.lineTo(hx + R(-5, 5), hy + R(-3, 3));
      g.stroke();
    }
  } else if (t === 6) {
    fill('#e2cd96');
    for (let k = 0; k < 30; k++) {
      g.fillStyle = pick(['#d4bb7c', '#efdcae', '#cbb173'], r);
      g.fillRect(X + R(0, 32), Y + R(0, 32), 1, 1);
    }
    const nearW =
      (i > 0 && ground[tileIndex(i - 1, j)] === 3) || (i < MAP_W - 1 && ground[tileIndex(i + 1, j)] === 3);
    if (nearW) {
      const gr = g.createLinearGradient(
        ground[tileIndex(i - 1, j)] === 3 ? X : X + TILE,
        0,
        ground[tileIndex(i - 1, j)] === 3 ? X + TILE : X,
        0,
      );
      gr.addColorStop(0, 'rgba(120,95,50,.35)');
      gr.addColorStop(1, 'rgba(120,95,50,0)');
      g.fillStyle = gr;
      g.fillRect(X, Y, TILE, TILE);
    }
  } else if (t === 7) {
    fill('#9a6a3a');
    for (let k = 0; k < 32; k += 6) {
      g.fillStyle = pick(['#b07a43', '#a87340', '#bd8650'], r);
      g.fillRect(X + k, Y, 5, TILE);
      g.fillStyle = 'rgba(60,35,15,.35)';
      g.fillRect(X + k + R(1, 4), Y + R(0, 24), 0.8, R(4, 8));
    }
    g.fillStyle = '#5a3a22';
    if (j === 28) g.fillRect(X, Y, TILE + 0.5, 5);
    if (j === 29) g.fillRect(X, Y + 27, TILE + 0.5, 5);
  }
}

function edgeTufts(g, i, j) {
  const t = ground[tileIndex(i, j)];
  if (t === 0 || t === 8 || t === 3 || t === 7) return;
  const r = rng(hh(i, j) + 99),
    X = i * TILE,
    Y = j * TILE;
  const isG = (a, b) =>
    a >= 0 &&
    b >= 0 &&
    a < MAP_W &&
    b < MAP_H &&
    (ground[tileIndex(a, b)] === 0 || ground[tileIndex(a, b)] === 8);
  const side = (n, fn) => {
    if (!n) return;
    for (let k = 0; k < 7; k++) {
      const [x, y] = fn(r() * 32);
      blob(g, x, y, 2 + r() * 3.5, 1.5 + r() * 2.5, pick(['#79bf57', '#6fb551', '#84c862'], r), 1);
    }
  };
  side(isG(i, j - 1), (u) => [X + u, Y + r() * 2]);
  side(isG(i, j + 1), (u) => [X + u, Y + 32 - r() * 2]);
  side(isG(i - 1, j), (u) => [X + r() * 2, Y + u]);
  side(isG(i + 1, j), (u) => [X + 32 - r() * 2, Y + u]);
}

function drawMud(g, m) {
  const r = rng(m.s);
  blob(g, m.x + 1.5, m.y + 1.5, m.rx + 2, m.ry + 1.5, '#3e2a18', 0.25);
  for (let k = 0; k < 4; k++)
    blob(
      g,
      m.x + (r() - 0.5) * m.rx * 0.8,
      m.y + (r() - 0.5) * m.ry * 0.6,
      m.rx * (0.55 + r() * 0.4),
      m.ry * (0.55 + r() * 0.4),
      '#6a4628',
      1,
    );
  blob(g, m.x, m.y, m.rx * 0.75, m.ry * 0.7, '#55381f', 1);
  blob(g, m.x + m.rx * 0.15, m.y + m.ry * 0.1, m.rx * 0.4, m.ry * 0.35, '#4a3019', 1);
  blob(g, m.x - m.rx * 0.3, m.y - m.ry * 0.25, m.rx * 0.28, m.ry * 0.18, '#a88c6a', 0.55);
  blob(g, m.x - m.rx * 0.32, m.y - m.ry * 0.3, m.rx * 0.12, m.ry * 0.08, '#ffffff', 0.35);
  for (let k = 0; k < 5; k++)
    blob(
      g,
      m.x + (r() - 0.5) * m.rx * 2.4,
      m.y + (r() - 0.5) * m.ry * 2.2,
      1 + r() * 1.5,
      0.8 + r(),
      '#6a4628',
      0.8,
    );
}

function fenceTile(g, i, j) {
  if (!fence[tileIndex(i, j)]) return;
  const X = i * TILE,
    Y = j * TILE;
  const L = i > 0 && fence[tileIndex(i - 1, j)],
    Rt = i < MAP_W - 1 && fence[tileIndex(i + 1, j)],
    U = j > 0 && fence[tileIndex(i, j - 1)],
    D = j < MAP_H - 1 && fence[tileIndex(i, j + 1)];
  g.fillStyle = 'rgba(0,0,0,.18)';
  if (L || Rt) g.fillRect(X + (L ? 0 : 16), Y + 27, L && Rt ? 32 : 16, 3);
  const rail = (x, y, w, h) => {
    g.fillStyle = '#8a5a2b';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#a87444';
    g.fillRect(x, y, w, 1);
  };
  if (L) {
    rail(X, Y + 12, 16, 4);
    rail(X, Y + 21, 16, 4);
  }
  if (Rt) {
    rail(X + 16, Y + 12, 16, 4);
    rail(X + 16, Y + 21, 16, 4);
  }
  if (U) {
    g.fillStyle = '#7a4e25';
    g.fillRect(X + 14, Y, 4, 16);
  }
  if (D) {
    g.fillStyle = '#7a4e25';
    g.fillRect(X + 14, Y + 16, 4, 16);
  }
  g.fillStyle = '#5e3c1e';
  g.fillRect(X + 12, Y + 6, 8, 22);
  g.fillStyle = '#7a5230';
  g.fillRect(X + 12, Y + 6, 4, 22);
  g.fillStyle = '#b88452';
  g.fillRect(X + 12, Y + 5, 8, 3);
}

function buildGround() {
  if (!MUDS.length) {
    const r = rng(2024);
    for (let j = 1; j < MAP_H - 1; j++)
      for (let i = 1; i < MAP_W - 1; i++) {
        const t = ground[tileIndex(i, j)];
        if (solid[tileIndex(i, j)]) continue;
        let ok = true;
        for (let b = -1; b <= 1 && ok; b++)
          for (let a = -1; a <= 1; a++) {
            const q = ground[tileIndex(i + a, j + b)];
            if (solid[tileIndex(i + a, j + b)] || (t !== 5 && q !== 0 && q !== 8)) {
              ok = false;
              break;
            }
          }
        if (PLOTG[tileIndex(i, j)]) ok = false;
        if (ok && r() < (t === 5 ? 0.08 : 0.014))
          MUDS.push({
            x: i * TILE + 8 + r() * 16,
            y: j * TILE + 10 + r() * 12,
            rx: 7 + r() * 7,
            ry: 4 + r() * 3.5,
            s: (i * 977 + j) | 0,
          });
      }
  }
  GCV = document.createElement('canvas');
  GCV.width = Math.round(MAP_W * TILE * GSC);
  GCV.height = Math.round(MAP_H * TILE * GSC);
  const g = GCV.getContext('2d');
  g.scale(GSC, GSC);
  for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) groundBase(g, i, j);
  for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) edgeTufts(g, i, j);
  MUDS.forEach((m) => drawMud(g, m));
  for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) fenceTile(g, i, j);
  drawBanks(g);
  drawBridgePart(g);
  // kleine Version für die 3D-Ansicht
  const sm = document.createElement('canvas');
  GPW = MAP_W * GPT;
  sm.width = GPW;
  sm.height = MAP_H * GPT;
  const sc = sm.getContext('2d');
  sc.imageSmoothingEnabled = true;
  sc.imageSmoothingQuality = 'high';
  sc.drawImage(GCV, 0, 0, GPW, MAP_H * GPT);
  GP = new Uint32Array(sc.getImageData(0, 0, GPW, MAP_H * GPT).data.buffer);
}

function waterFx(c, x0, x1, y0, y1) {
  const be = bridgeEnd();
  for (let j = y0; j <= y1; j++)
    for (let i = Math.max(x0, 48); i <= Math.min(x1, 51); i++) {
      if (ground[tileIndex(i, j)] !== 3 && ground[tileIndex(i, j)] !== 7) continue;
      if (j >= 28 && j < 30 && i + 1 <= be) continue;
      const X = i * TILE,
        Y = j * TILE,
        h = hh(i, j),
        mid = i === 49 || i === 50,
        sp = mid ? 22 : 13;
      for (let k = 0; k < 3; k++) {
        const o = ((now * sp + ((h >> (k * 5)) & 31) + k * 11) % 40) - 6,
          lx = X + ((h >> (3 + k * 4)) & 15) * 1.7 + 2,
          len = 5 + ((h >> k) & 7);
        c.fillStyle = k === 2 ? 'rgba(10,40,70,.18)' : 'rgba(215,240,255,.28)';
        c.fillRect(
          lx + Math.sin(now * 1.5 + o * 0.2 + k) * 1.2,
          Y + Math.max(0, o),
          1,
          Math.max(0, Math.min(len, 32 - Math.max(0, o), o + len)),
        );
      }
      if (Math.sin(now * 3 + h) > 0.95) {
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.fillRect(X + (h % 28) + 2, Y + ((h >> 4) % 28) + 2, 2, 1.2);
      }
      if (i === 48 || i === 51) {
        const ex = i === 48 ? X + 1 : X + 29;
        for (let k = 0; k < 3; k++) {
          const fy = (now * 8 + k * 11 + (h & 15)) % 32;
          c.fillStyle = 'rgba(240,250,250,.5)';
          c.fillRect(ex + Math.sin(now * 4 + k) * 1.2, Y + fy, 2, 1.2);
        }
      }
      if (j === 30 && be > 48.5) {
        for (let px = 48.5; px < Math.min(be, 52); px += 1) {
          if (px < i || px >= i + 1) continue;
          const X0 = px * TILE,
            ph = (now * 1.4) % 1;
          c.strokeStyle = `rgba(225,245,255,${0.5 * (1 - ph)})`;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(X0 - 2 - ph * 6, Y + 4 + ph * 14);
          c.lineTo(X0, Y + 2);
          c.lineTo(X0 + 2 + ph * 6, Y + 4 + ph * 14);
          c.stroke();
        }
      }
    }
}

// ================= Bäume mit Wind =================
const CANOPY = {};
let NOSWAY = false;

function treeSway(t) {
  if (NOSWAY) return 0;
  const base = Math.sin(now * 1.7 + t.x * 0.35 + t.id * 1.7) * 0.018 + Math.sin(now * 0.9 + t.y * 0.2) * 0.01;
  const gust = Math.pow(Math.max(0, Math.sin(now * 0.18 - t.x * 0.06 - t.y * 0.02)), 8);
  return base + gust * (0.1 + Math.sin(now * 7 + t.id) * 0.025);
}

// ================= Schönere Bäume: Eiche, Birke, Tanne aus echten Blättern =================
const TREEPAL = [
  ['#1f4a24', '#2a5f2d', '#367535', '#468c3e', '#5ea54d', '#7dbd62', '#9ccf78'],
  ['#3f7a2c', '#4f8a34', '#62a03e', '#78b54a', '#93c95c', '#b2dc7a'],
  ['#173d24', '#1d4a2c', '#245a33', '#2e6d3c', '#3b8248', '#4f9a58'],
];

function leafAt(g, x, y, sz, a, col) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, sz, sz * 0.52, a, 0, 7);
  g.fill();
}

function canopyCv(v, apple) {
  const key = v + '_' + (apple ? 1 : 0);
  if (CANOPY[key]) return CANOPY[key];
  const cv = document.createElement('canvas');
  cv.width = cv.height = 200;
  const g = cv.getContext('2d');
  g.scale(2.5, 2.5);
  const r = rng(53 + v * 29),
    pal = TREEPAL[v],
    tx = 40,
    ty = 62;
  const shadeCol = (lx, ly, extra) => {
    let l = 0.55 - (lx * 0.55 + ly * 0.75) + extra + (r() - 0.5) * 0.35;
    l = Math.max(0, Math.min(0.999, l));
    return pal[Math.floor(l * pal.length)];
  };
  if (v === 2) {
    // Tanne: Etagen mit Nadeln
    g.fillStyle = '#4a2e1a';
    g.fillRect(tx - 2, 40, 4, 24);
    for (let k = 0; k < 6; k++) {
      const y0 = 8 + k * 9,
        hw = 5 + k * 5.2,
        y1 = y0 + 14;
      g.fillStyle = pal[0];
      g.beginPath();
      g.moveTo(tx, y0);
      for (let s = 0; s <= 8; s++) {
        const xx = tx - hw + (s * hw) / 4;
        g.lineTo(xx, y1 + (s % 2 ? 3 : 0));
      }
      g.closePath();
      g.fill();
      for (let n = 0; n < 70 + k * 10; n++) {
        const u = r() * 2 - 1,
          vv = r();
        const x = tx + u * hw * vv,
          y = y0 + vv * 14 + r() * 2;
        g.strokeStyle = shadeCol(u * 0.8, vv * 0.6 - 0.3, 0.15);
        g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + u * 2.2, y + 1.6 + r());
        g.stroke();
      }
    }
    return (CANOPY[key] = cv);
  }
  const birch = v === 1,
    cx = 40,
    cy = birch ? 34 : 36,
    RX = birch ? 17 : 24,
    RY = birch ? 24 : 21,
    nCl = birch ? 7 : 8;
  const cl = [];
  for (let k = 0; k < nCl; k++) {
    const a = -Math.PI / 2 + (k / nCl - 0.5) * Math.PI * 1.7 + (r() - 0.5) * 0.4,
      d = 0.35 + r() * 0.55;
    cl.push({
      x: cx + Math.cos(a) * RX * d,
      y: cy + Math.sin(a) * RY * d * 0.9 + (r() - 0.3) * 4,
      r: (birch ? 7 : 10) + r() * (birch ? 3 : 5),
    });
  }
  cl.push({ x: cx, y: cy - 2, r: birch ? 9 : 13 });
  cl.sort((a, b) => a.y - b.y);
  // Äste
  g.lineCap = 'round';
  for (const q of cl) {
    g.strokeStyle = birch ? '#d8d2c4' : '#5a3a22';
    g.lineWidth = birch ? 1.2 : 2.4;
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + (q.x - tx) * 0.2, ty - (ty - q.y) * 0.6, q.x, q.y + q.r * 0.3);
    g.stroke();
  }
  // Blätter-Büschel (hinten dunkler, vorne und oben heller)
  cl.forEach((q, ci) => {
    const back = ci < cl.length / 2 ? -0.08 : 0.06;
    if (!birch) {
      g.fillStyle = pal[1];
      g.beginPath();
      g.ellipse(q.x, q.y, q.r * 0.82, q.r * 0.72, 0, 0, 7);
      g.fill();
    }
    const n = birch ? 45 : 95;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2,
        d = Math.sqrt(r());
      const lx = Math.cos(a) * d,
        ly = Math.sin(a) * d;
      const x = q.x + lx * q.r,
        y = q.y + ly * q.r * 0.85;
      leafAt(
        g,
        x,
        y,
        birch ? 1.7 : 2.1,
        a + r(),
        shadeCol(lx + ((q.x - cx) / RX) * 0.5, ly + ((q.y - cy) / RY) * 0.6, back),
      );
    }
  });
  // Lichtkanten oben links
  for (let k = 0; k < (birch ? 20 : 40); k++) {
    const q = pick(cl, r),
      a = -Math.PI * 0.75 + (r() - 0.5) * 1.2;
    leafAt(g, q.x + Math.cos(a) * q.r * 0.8, q.y + Math.sin(a) * q.r * 0.7, 1.8, a, pal[pal.length - 1]);
  }
  if (apple && !birch)
    for (let k = 0; k < 7; k++) {
      const q = pick(cl, r),
        x = q.x + (r() - 0.5) * q.r,
        y = q.y + (r() - 0.2) * q.r * 0.7;
      g.fillStyle = '#a3222a';
      g.beginPath();
      g.arc(x + 0.4, y + 0.5, 2.2, 0, 7);
      g.fill();
      g.fillStyle = '#e0444a';
      g.beginPath();
      g.arc(x, y, 2, 0, 7);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.75)';
      g.fillRect(x - 1, y - 1, 0.9, 0.9);
    }
  return (CANOPY[key] = cv);
}

function drawTreeReal(c, t) {
  const X = t.x * TILE + 16,
    Y = t.y * TILE + 28,
    v = t.id % 3;
  if (state.chopped.includes(t.id)) {
    blob(c, X + 3, Y - 1, 11, 4, '#000', 0.18);
    c.fillStyle = v === 1 ? '#e6e0d2' : '#6b4226';
    c.fillRect(X - 7, Y - 10, 14, 10);
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.fillRect(X + 2, Y - 10, 5, 10);
    c.fillStyle = '#d4a46a';
    c.beginPath();
    c.ellipse(X, Y - 11, 7, 2.6, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#a8743f';
    c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(X, Y - 11, 4, 1.4, 0, 0, 7);
    c.stroke();
    return;
  }
  let sw = treeSway(t);
  if (t.shake > 0) sw += Math.sin(now * 60) * t.shake * 0.25;
  const fall = t.fall ? ((Math.pow(Math.min(1, t.fall.t / 0.75), 2.2) * Math.PI) / 2) * t.fall.dir : 0;
  if (!fall) {
    blob(c, X + 11, Y + 1, v === 1 ? 16 : 22, v === 1 ? 5 : 7, '#000', 0.17);
    blob(c, X + 3, Y, 9, 3.5, '#000', 0.12);
  } else {
    c.fillStyle = '#6b4226';
    c.fillRect(X - 7, Y - 8, 14, 8);
    c.fillStyle = '#d4a46a';
    c.beginPath();
    c.ellipse(X, Y - 9, 7, 2.6, 0, 0, 7);
    c.fill();
    c.save();
    c.translate(X, Y - 8);
    c.rotate(fall);
    c.scale(1, 1 - (Math.abs(fall) / Math.PI) * 0.6);
    c.translate(-X, -(Y - 8));
  }
  if (v === 1) {
    c.fillStyle = '#ece8df';
    c.fillRect(X - 3, Y - 26, 6, 26);
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.fillRect(X + 1, Y - 26, 2, 26);
    c.fillStyle = '#2e2a26';
    for (const [a, b, w] of [
      [-3, -22, 3],
      [0, -15, 3],
      [-3, -9, 2],
      [1, -5, 2],
    ])
      c.fillRect(X + a, Y + b, w, 1.4);
  } else if (v === 2) {
    c.fillStyle = '#4a2e1a';
    c.fillRect(X - 3, Y - 10, 6, 10);
  } else {
    const tg = c.createLinearGradient(X - 6, 0, X + 6, 0);
    tg.addColorStop(0, '#94603a');
    tg.addColorStop(0.6, '#6e4426');
    tg.addColorStop(1, '#4e2e17');
    c.fillStyle = tg;
    c.fillRect(X - 5, Y - 24, 10, 24);
    c.fillStyle = '#5a361d';
    c.fillRect(X - 8, Y - 3, 4, 3);
    c.fillRect(X + 4, Y - 3, 5, 3);
    c.fillStyle = 'rgba(40,20,8,.45)';
    c.fillRect(X - 2, Y - 20, 1, 7);
    c.fillRect(X + 1, Y - 12, 1, 6);
  }
  c.save();
  c.translate(X, Y - 20);
  c.transform(1, 0, -sw * (v === 2 ? 0.6 : 1), 1, 0, 0);
  c.drawImage(canopyCv(v, t.apple), -40, -62, 80, 80);
  c.restore();
  if (fall) c.restore();
}
