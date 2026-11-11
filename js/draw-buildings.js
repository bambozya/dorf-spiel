// ================= Hausstile =================
const SDEF = {
  classic: { n: 'Klassisch', roof: 'tile' },
  modern: { n: 'Modern', roof: 'flat', mod: 1 },
  wood: { n: 'Holzhaus', roof: 'slate', rc: '#3d434a', sh: '#e9e1cf' },
  stone: { n: 'Steinhaus', roof: 'slate', rc: '#4a4f57', sh: '#6b4a32' },
  log: { n: 'Blockhaus', roof: 'slate', rc: '#5a3a22', sh: '#3f6e3f' },
  pastel: { n: 'Bunt', roof: 'tile', rc: '#d9776a', sh: '#ffffff' },
  brick: { n: 'Backstein-Loft', roof: 'flat', mod: 1, wall: '#9c4a35' },
};
const STYLES = Object.fromEntries(Object.entries(SDEF).map(([k, v]) => [k, v.n]));
const PASTEL = ['#f6c6d0', '#bfe6d4', '#fde7a8', '#c9d8f5', '#f9d3b4', '#d9c9f2'];
const isMod = (S) => !!(SDEF[S] && SDEF[S].mod);

function houseCfg(n) {
  const hm = n && state.homes && state.homes[n],
    ex = n ? extraOf(n) : 0,
    base = (hm && SDEF[hm.style] && hm.style) || 'classic',
    fs = [];
  for (let j = 0; j < ex; j++) {
    const f = hm && hm.fs && hm.fs[j];
    fs.push(SDEF[f] ? f : base);
  }
  return { base, fs, top: ex ? fs[ex - 1] : base };
}

function houseWindows(h, cfg) {
  const n = h.n || 0;
  cfg = cfg || houseCfg(n);
  const nE = cfg.fs.length,
    EX = nE * 26,
    X = h.x * TILE,
    w = h.w * TILE,
    gt = h.y * TILE + h.h * TILE * 0.48;
  const out = isMod(cfg.base)
    ? [
        [X + 10, gt + 9, 46, 28, 'modern'],
        [X + w - 56, gt + 9, 46, 28, 'modern'],
      ]
    : [
        [X + 12, gt + 12, 22, 18, 'classic'],
        [X + w - 34, gt + 12, 22, 18, 'classic'],
      ];
  for (let k = 0; k < nE; k++) {
    const y = gt - EX + 5 + k * 26,
      sty = cfg.fs[nE - 1 - k];
    if (isMod(sty)) out.push([X + 10, y - 1, 76, 18, 'modern'], [X + w - 86, y - 1, 76, 18, 'modern']);
    else
      out.push(
        [X + 12, y, 22, 16, 'classic'],
        [X + w / 2 - 11, y, 22, 16, 'classic'],
        [X + w - 34, y, 22, 16, 'classic'],
      );
  }
  return out;
}
const HCV = {};

function houseStyle(h, n) {
  return n ? [0, 1, 2, 1, 2, 0][n - 1] : h.x % 3;
}

function paintWall(c, S, X, y0, y1, w, wall, sty, r, n) {
  const bricks = (col) => {
    c.fillStyle = shade(col, -35);
    c.fillRect(X, y0, w, y1 - y0);
    for (let y = y0, row = 0; y < y1 - 1; y += 6, row++)
      for (let bx = X - (row % 2) * 6; bx < X + w; bx += 12) {
        c.fillStyle = shade(col, -8 + Math.floor(r() * 16));
        c.fillRect(Math.max(X, bx + 1), y + 1, Math.min(10, X + w - bx - 1), Math.min(4.2, y1 - y - 1));
      }
  };
  if (S === 'modern') {
    c.fillStyle = '#e9ebea';
    c.fillRect(X, y0, w, y1 - y0);
    for (let k = 0; k < 70; k++) {
      c.fillStyle = 'rgba(0,0,0,.035)';
      c.fillRect(X + r() * w, y0 + r() * (y1 - y0), 2, 2);
    }
    c.fillStyle = '#3a3f45';
    c.fillRect(X, y1 - 3, w, 3);
    return;
  }
  if (S === 'brick') {
    bricks('#9c4a35');
    c.fillStyle = '#2b2f33';
    c.fillRect(X, y1 - 3, w, 3);
    return;
  }
  if (S === 'wood') {
    for (let x = X; x < X + w; x += 6) {
      c.fillStyle = shade('#7a5236', -10 + Math.floor(r() * 24));
      c.fillRect(x, y0, 5, y1 - y0);
      c.fillStyle = '#4e3220';
      c.fillRect(x + 5, y0, 1, y1 - y0);
    }
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.fillRect(X, y0, w, 2);
    return;
  }
  if (S === 'stone') {
    c.fillStyle = '#7d776c';
    c.fillRect(X, y0, w, y1 - y0);
    for (let y = y0, row = 0; y < y1 - 1; row++) {
      const rh = 6 + Math.floor(r() * 3);
      let bx = X - (row % 2) * 7;
      while (bx < X + w) {
        const bw = 10 + Math.floor(r() * 9),
          x0 = Math.max(X, bx + 1),
          x1 = Math.min(X + w, bx + bw);
        if (x1 > x0) {
          c.fillStyle = shade('#a39d90', -18 + Math.floor(r() * 30));
          c.beginPath();
          c.roundRect
            ? c.roundRect(x0, y + 1, x1 - x0 - 1, Math.min(rh - 1.5, y1 - y - 1), 1.5)
            : c.rect(x0, y + 1, x1 - x0 - 1, Math.min(rh - 1.5, y1 - y - 1));
          c.fill();
        }
        bx += bw;
      }
      y += rh;
    }
    return;
  }
  if (S === 'log') {
    for (let y = y0; y < y1; y += 6) {
      const g = c.createLinearGradient(0, y, 0, y + 6);
      g.addColorStop(0, '#c08a52');
      g.addColorStop(0.5, '#9a6a3a');
      g.addColorStop(1, '#5e3a1e');
      c.fillStyle = g;
      c.fillRect(X, y, w, Math.min(6, y1 - y));
      c.fillStyle = '#d9b07a';
      c.beginPath();
      c.arc(X + 1, y + 3, 3, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(X + w - 1, y + 3, 3, 0, 7);
      c.fill();
      c.strokeStyle = '#a8743f';
      c.lineWidth = 0.6;
      c.beginPath();
      c.arc(X + 1, y + 3, 1.5, 0, 7);
      c.stroke();
      c.beginPath();
      c.arc(X + w - 1, y + 3, 1.5, 0, 7);
      c.stroke();
    }
    return;
  }
  if (S === 'pastel') {
    const col = PASTEL[((n || 1) - 1) % PASTEL.length];
    c.fillStyle = col;
    c.fillRect(X, y0, w, y1 - y0);
    for (let k = 0; k < 60; k++) {
      c.fillStyle = 'rgba(255,255,255,.12)';
      c.fillRect(X + r() * w, y0 + r() * (y1 - y0), 1.5, 1.5);
    }
    c.fillStyle = '#ffffff';
    c.fillRect(X, y0, 4, y1 - y0);
    c.fillRect(X + w - 4, y0, 4, y1 - y0);
    c.fillRect(X, y0, w, 2);
    return;
  }
  c.fillStyle = wall;
  c.fillRect(X, y0, w, y1 - y0);
  if (sty === 1) bricks(wall);
  else
    for (let k = 0; k < Math.max(20, (y1 - y0) * 2); k++) {
      c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.08)';
      c.fillRect(X + r() * w, y0 + r() * (y1 - y0), 1.5, 1.5);
    }
  if (sty === 2) {
    c.fillStyle = '#5a3a22';
    c.fillRect(X, y0 + 1, w, 3);
    c.fillRect(X, y1 - 4, w, 3);
    c.fillRect(X, y0, 4, y1 - y0);
    c.fillRect(X + w - 4, y0, 4, y1 - y0);
    c.strokeStyle = '#5a3a22';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(X + 4, y0 + 4);
    c.lineTo(X + Math.min(40, (y1 - y0) * 0.9), y1 - 4);
    c.moveTo(X + w - 4, y0 + 4);
    c.lineTo(X + w - Math.min(40, (y1 - y0) * 0.9), y1 - 4);
    c.stroke();
  }
}

function drawRoof(c, X, ry0, ry1, w, top, roofCol, r, chim) {
  if (SDEF[top].roof === 'flat') {
    c.fillStyle = '#8d9196';
    c.fillRect(X - 3, ry0 + 4, w + 6, ry1 - ry0 - 4);
    for (let k = 0; k < w * 1.4; k++) {
      c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.12)';
      c.fillRect(X + r() * w, ry0 + 4 + r() * (ry1 - ry0 - 6), 1.4, 1.4);
    }
    const ed = top === 'brick' ? '#6e3326' : '#5a5f65';
    c.fillStyle = ed;
    c.fillRect(X - 3, ry0 + 4, w + 6, 5);
    c.fillRect(X - 3, ry1 - 5, w + 6, 5);
    c.fillRect(X - 3, ry0 + 4, 5, ry1 - ry0 - 4);
    c.fillRect(X + w - 2, ry0 + 4, 5, ry1 - ry0 - 4);
    if (chim) {
      for (let p = 0; p < Math.floor((w - 40) / 44); p++) {
        const px2 = X + 14 + p * 44,
          py2 = ry0 + 16;
        c.fillStyle = '#c9d1da';
        c.fillRect(px2 - 1, py2 - 1, 38, 26);
        c.fillStyle = '#1f2f4a';
        c.fillRect(px2, py2, 36, 24);
        c.strokeStyle = 'rgba(150,180,220,.5)';
        c.lineWidth = 0.6;
        for (let q = 1; q < 4; q++) {
          c.beginPath();
          c.moveTo(px2 + q * 9, py2);
          c.lineTo(px2 + q * 9, py2 + 24);
          c.stroke();
        }
        c.beginPath();
        c.moveTo(px2, py2 + 12);
        c.lineTo(px2 + 36, py2 + 12);
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.18)';
        c.fillRect(px2 + 2, py2 + 2, 10, 4);
      }
      if (top === 'brick') {
        c.fillStyle = '#3a8a3a';
        for (let k = 0; k < 14; k++) {
          c.beginPath();
          c.arc(X + w - 30 + r() * 20, ry0 + 16 + r() * (ry1 - ry0 - 26), 3 + r() * 2, 0, 7);
          c.fill();
        }
      } else {
        c.fillStyle = '#b9bfc5';
        c.fillRect(X + w - 34, ry0 + 18, 16, 12);
        c.fillStyle = '#d7dde2';
        c.fillRect(X + w - 34, ry0 + 18, 16, 3);
      }
    }
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.fillRect(X, ry1, w, 5);
    return;
  }
  if (chim) {
    const chx = X + w - 38,
      Y = ry0 + 14;
    c.fillStyle = top === 'stone' ? '#8f897e' : top === 'wood' || top === 'log' ? '#6d6a66' : '#9c4a35';
    c.fillRect(chx, Y - 28, 14, 24);
    c.fillStyle = 'rgba(0,0,0,.18)';
    for (let q = 0; q < 4; q++) c.fillRect(chx, Y - 24 + q * 6, 14, 1);
    c.fillStyle = '#5e5046';
    c.fillRect(chx - 2, Y - 31, 18, 4);
  }
  const rect = SDEF[top].roof === 'slate';
  c.fillStyle = shade(roofCol, -35);
  c.fillRect(X - 7, ry0, w + 14, ry1 - ry0);
  for (let y = ry0 + 4, row = 0; y < ry1; y += 7, row++)
    for (let bx = X - 7 - (row % 2) * 7; bx < X + w + 7; bx += 14) {
      const tx = Math.max(X - 7, bx),
        tw = Math.min(13, X + w + 7 - tx);
      if (tw <= 0) continue;
      c.fillStyle = shade(roofCol, -10 + Math.floor(r() * 22) + Math.floor(((y - ry0) / (ry1 - ry0)) * -14));
      c.beginPath();
      if (rect) c.rect(tx, y, tw, 6);
      else {
        c.moveTo(tx, y);
        c.lineTo(tx + tw, y);
        c.lineTo(tx + tw, y + 5);
        c.quadraticCurveTo(tx + tw / 2, y + 8, tx, y + 5);
        c.closePath();
      }
      c.fill();
    }
  c.fillStyle = shade(roofCol, -50);
  c.fillRect(X - 7, ry0, w + 14, 5);
  c.fillStyle = shade(roofCol, 30);
  c.fillRect(X - 7, ry0, w + 14, 1.5);
  const sg = c.createLinearGradient(X - 7, 0, X + w + 7, 0);
  sg.addColorStop(0, 'rgba(255,255,255,.14)');
  sg.addColorStop(0.15, 'rgba(255,255,255,0)');
  sg.addColorStop(0.85, 'rgba(0,0,0,0)');
  sg.addColorStop(1, 'rgba(0,0,0,.2)');
  c.fillStyle = sg;
  c.fillRect(X - 7, ry0, w + 14, ry1 - ry0);
  c.fillStyle = rect ? '#5a3a22' : '#8f9aa3';
  c.fillRect(X - 7, ry1 - 1, w + 14, 3);
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.fillRect(X, ry1 + 2, w, 6);
}

function houseCv(h, n, cfgO) {
  const cfg = cfgO || houseCfg(n),
    nE = cfg.fs.length,
    EX = nE * 26,
    key = (n || 'v' + h.x) + '_' + cfg.base + '_' + cfg.fs.join(',');
  if (HCV[key]) return HCV[key];
  const w = h.w * TILE,
    ht = h.h * TILE + EX,
    cv = document.createElement('canvas'),
    K = 2;
  cv.width = (w + 40) * K;
  cv.height = (ht + 60) * K;
  const c = cv.getContext('2d');
  c.scale(K, K);
  const X = 20,
    Y = 40,
    wt = Y + h.h * TILE * 0.48,
    bot = Y + ht,
    sty = houseStyle(h, n),
    r = rng((n || h.x) * 131 + 7),
    wall = h.wall,
    top = cfg.top,
    B = cfg.base;
  paintWall(c, B, X, wt + EX, bot, w, wall, sty, r, n);
  for (let j = 0; j < nE; j++)
    paintWall(c, cfg.fs[j], X, wt + EX - (j + 1) * 26, wt + EX - j * 26, w, wall, sty, r, n);
  for (let j = 0; j < nE; j++) {
    c.fillStyle = 'rgba(0,0,0,.2)';
    c.fillRect(X, wt + EX - j * 26 - 1, w, 2);
  }
  const wg = c.createLinearGradient(X, 0, X + w, 0);
  wg.addColorStop(0, 'rgba(255,255,255,.1)');
  wg.addColorStop(1, 'rgba(0,0,0,.14)');
  c.fillStyle = wg;
  c.fillRect(X, wt, w, bot - wt);
  if (isMod(B)) {
    c.fillStyle = '#4a4f55';
    c.fillRect(X - 1, bot - 6, w + 2, 6);
  } else {
    c.fillStyle = '#8f897e';
    c.fillRect(X - 1, bot - 7, w + 2, 7);
    for (let sx = X; sx < X + w; sx += 9 + r() * 5) {
      c.fillStyle = shade('#8f897e', -15 + Math.floor(r() * 30));
      c.fillRect(sx, bot - 6, 7, 5);
    }
  }
  const gt = wt + EX,
    dx = X + w / 2 - 11,
    dy = bot - 37;
  if (!isMod(B)) {
    const shutter = (SDEF[B] && SDEF[B].sh) || shade(h.roof, 15);
    for (const wx of [X + 12, X + w - 34]) {
      c.fillStyle = shutter;
      c.fillRect(wx - 8, gt + 11, 6, 20);
      c.fillRect(wx + 24, gt + 11, 6, 20);
      c.fillStyle = 'rgba(0,0,0,.25)';
      for (const sx of [wx - 8, wx + 24])
        for (let q = 0; q < 4; q++) c.fillRect(sx + 1, gt + 13 + q * 5, 4, 1);
      c.fillStyle = '#c9c2b4';
      c.fillRect(wx - 2, gt + 31, 26, 3);
      c.fillStyle = '#7a4c2c';
      c.fillRect(wx, gt + 34, 22, 6);
      for (let q = 0; q < 6; q++) {
        c.fillStyle = '#3f8f3a';
        c.beginPath();
        c.arc(wx + 2 + q * 3.6, gt + 34, 2.4, 0, 7);
        c.fill();
        c.fillStyle = pick(['#e5484d', '#ffd23f', '#ff8fb1', '#ffffff'], r);
        c.beginPath();
        c.arc(wx + 2 + q * 3.6, gt + 32.6, 1.4, 0, 7);
        c.fill();
      }
    }
    const doorC = B === 'pastel' ? '#3d6fb0' : B === 'stone' ? '#4a2e1c' : '#6b4226';
    c.fillStyle = '#e9e1cf';
    c.fillRect(dx - 3, dy - 3, 28, 33);
    c.fillStyle = doorC;
    c.fillRect(dx, dy, 22, 30);
    c.fillStyle = shade(doorC, -20);
    for (let q = 1; q < 4; q++) c.fillRect(dx + q * 5.5, dy + 9, 1, 21);
    c.fillStyle = '#a9dcef';
    c.fillRect(dx + 5, dy + 3, 12, 5);
    c.fillStyle = '#e9e1cf';
    c.fillRect(dx + 10.5, dy + 3, 1, 5);
    c.fillStyle = '#f2b134';
    c.beginPath();
    c.arc(dx + 18, dy + 17, 1.6, 0, 7);
    c.fill();
    c.fillStyle = '#a8a193';
    c.fillRect(dx - 5, bot - 6, 32, 6);
    c.fillStyle = '#c9c2b4';
    c.fillRect(dx - 5, bot - 6, 32, 2);
    c.fillStyle = '#2b2b2b';
    c.fillRect(dx + 28, dy + 2, 5, 8);
    c.fillStyle = '#e8dca0';
    c.fillRect(dx + 29, dy + 3.5, 3, 5);
  } else {
    c.fillStyle = '#3a3f45';
    c.fillRect(dx, dy, 22, 31);
    c.fillStyle = '#8fb6cc';
    c.fillRect(dx + 3, dy + 3, 4, 25);
    c.fillStyle = '#c9d1da';
    c.fillRect(dx + 16, dy + 9, 2, 13);
    c.fillStyle = '#3a3f45';
    c.fillRect(dx - 8, dy - 7, 38, 4);
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(dx - 6, dy - 3, 34, 3);
    c.fillStyle = '#bfc3c6';
    c.fillRect(dx - 5, bot - 5, 32, 5);
    c.fillStyle = '#2b2f33';
    c.fillRect(dx + 29, dy + 3, 2, 12);
    c.fillStyle = '#fff3c0';
    c.fillRect(dx + 29, dy + 3, 2, 3);
    if (B === 'modern') {
      c.fillStyle = '#8a5a35';
      for (let q = 0; q < 5; q++) c.fillRect(dx + 36 + q * 4, dy - 6, 3, 37);
    }
  }
  if (n) {
    c.fillStyle = isMod(B) ? '#3a3f45' : '#2f5fa8';
    c.fillRect(dx - 17, dy + 2, 11, 9);
    c.strokeStyle = '#fff';
    c.lineWidth = 1;
    c.strokeRect(dx - 16, dy + 3, 9, 7);
    c.fillStyle = '#fff';
    c.font = 'bold 8px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillText(n, dx - 11.5, dy + 9.4);
  }
  drawRoof(c, X, Y - 14, wt + 4, w, top, SDEF[top].rc || h.roof, r, true);
  return (HCV[key] = cv);
}

function drawWin(c, x, y, w, h, mode, S) {
  if (S === 'modern') {
    c.fillStyle = '#2b2f33';
    c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    if (mode === 'lit') {
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#ffe9a0');
      g.addColorStop(1, '#ffc65a');
      c.fillStyle = g;
    } else if (mode === 'dark') c.fillStyle = '#1d2538';
    else {
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#cfe6f2');
      g.addColorStop(0.45, '#7fa9c2');
      g.addColorStop(1, '#4d7690');
      c.fillStyle = g;
    }
    c.fillRect(x, y, w, h);
    if (mode === 'day') {
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath();
      c.moveTo(x + w * 0.15, y + h);
      c.lineTo(x + w * 0.35, y);
      c.lineTo(x + w * 0.45, y);
      c.lineTo(x + w * 0.25, y + h);
      c.fill();
    }
    c.fillStyle = '#2b2f33';
    c.fillRect(x + w / 2 - 0.75, y, 1.5, h);
    return;
  }
  c.fillStyle = '#f4efe4';
  c.fillRect(x - 2, y - 2, w + 4, h + 4);
  if (mode === 'lit') {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffe9a0');
    g.addColorStop(1, '#ffc65a');
    c.fillStyle = g;
  } else if (mode === 'dark') c.fillStyle = '#26304a';
  else {
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#d8f0fb');
    g.addColorStop(0.5, '#8cc4e0');
    g.addColorStop(1, '#5f9cc0');
    c.fillStyle = g;
  }
  c.fillRect(x, y, w, h);
  if (mode === 'day') {
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.moveTo(x + 2, y + h - 3);
    c.lineTo(x + 7, y + 2);
    c.lineTo(x + 10, y + 2);
    c.lineTo(x + 5, y + h - 3);
    c.fill();
  }
  c.fillStyle = mode === 'lit' ? 'rgba(229,72,77,.55)' : 'rgba(255,255,255,.55)';
  c.fillRect(x, y, 3, h);
  c.fillRect(x + w - 3, y, 3, h);
  c.fillStyle = '#f4efe4';
  c.fillRect(x + w / 2 - 1, y, 2, h);
  c.fillRect(x, y + h / 2 - 1, w, 2);
}

function drawHouse(c, h, n) {
  const cfg = houseCfg(n),
    EX = cfg.fs.length * 26,
    X = h.x * TILE,
    Y = h.y * TILE - EX,
    w = h.w * TILE,
    ht = h.h * TILE + EX;
  castShadow(c, X, Y, w, Y + ht);
  c.drawImage(houseCv(h, n, cfg), X - 20, Y - 40, w + 40, ht + 60);
  const nt = night(),
    lit = nt > 0.15 && (!n || hasPower(n)),
    mode = nt > 0.15 ? (lit ? 'lit' : 'dark') : 'day';
  for (const r of houseWindows(h, cfg)) drawWin(c, r[0], r[1], r[2], r[3], mode, r[4]);
  if (n && hasPower(n) && SDEF[cfg.top].roof !== 'flat') {
    c.fillStyle = 'rgba(235,235,235,.55)';
    const sm = (now * 12) % 24;
    c.beginPath();
    c.arc(X + w - 31 + Math.sin(now + sm / 6) * 2, Y - 34 - sm, 4 + sm / 8, 0, 7);
    c.fill();
  }
  if (n >= 5 && !hasWater(n)) {
    c.fillStyle = '#5e7a8a';
    c.fillRect(X + w + 2, Y + ht - 22, 12, 20);
    c.fillStyle = '#3e5a6a';
    c.fillRect(X + w + 2, Y + ht - 16, 12, 2);
    c.fillRect(X + w + 2, Y + ht - 8, 12, 2);
  }
  if (lit) {
    const lx = X + w / 2 + 19,
      ly = Y + ht - 30;
    c.fillStyle = 'rgba(255,220,130,.35)';
    c.beginPath();
    c.arc(lx, ly, 9, 0, 7);
    c.fill();
    c.fillStyle = '#fff3b0';
    c.fillRect(lx - 1.5, ly - 2.5, 3, 5);
  }
}

function floorChooser(h) {
  const n = h.n,
    cfg = houseCfg(n);
  if (!hasTool('hammer'))
    return toast('Zum Bauen brauchst du einen <b>Hammer</b>. Er hängt in der Werkstatt an der Wand.');
  if (state.coins < FLOORCOST.coins || state.inv.plank < FLOORCOST.plank)
    return toast(
      `Für eine neue Etage brauchst du ${FLOORCOST.coins} Glücksmünzen und ${FLOORCOST.plank} Bretter.`,
    );
  const opts = Object.entries(STYLES)
    .map(([k, l]) => {
      const c2 = { base: cfg.base, fs: cfg.fs.concat([k]), top: k };
      return `<button class="pick" data-s="${k}"><img src="${houseCv(h, n, c2).toDataURL()}" alt=""><b>${l}</b></button>`;
    })
    .join('');
  openModal(
    `<h2>Wie soll die neue Etage aussehen?</h2><p>Kosten: ${FLOORCOST.coins} Glücksmünzen und ${FLOORCOST.plank} Bretter. Das Dach passt sich der obersten Etage an.</p><div class="picks">${opts}</div><div class="actions"><button id="cls">Abbrechen</button></div>`,
  );
  $('cls').onclick = () => houseCard(h);
  sheet.querySelectorAll('.pick').forEach(
    (b) =>
      (b.onclick = () => {
        addFloor(h, b.dataset.s);
        houseCard(h);
      }),
  );
}

// 3D: moderne Wand (Modern und Backstein-Loft)
function modernWall(hs, HS, face, wc, u, v, ty, S) {
  const nt = night(),
    Hw = 1.6 + HS.fs.length * 0.9,
    lit = nt > 0.15 && hasPower(hs.n);
  const glass = () => {
    if (lit) setC('#ffd98a', 1);
    else if (nt > 0.15) setC('#1d2538', 1);
    else setC('#7fa9c2', 0.88 + ((u * 2 + v * 0.7) % 1 < 0.18 ? 0.35 : 0));
  };
  const dc = hs.x + 3,
    front = face === 's' && ty === hs.y + hs.h - 1,
    nd = front && Math.abs(wc - dc) < 0.9;
  if (isMod(HS.top) && v > Hw - 0.08) {
    setC(HS.top === 'brick' ? '#6e3326' : '#3a3f45', 1.1);
    return;
  }
  if (v < 1.6) {
    if (v < 0.12) {
      setC('#4a4f55', 1);
      return;
    }
    if (front && Math.abs(wc - dc) < 0.4 && v < 1.05) {
      if (Math.abs(wc - dc + 0.18) < 0.05 && v > 0.1 && v < 0.95) glass();
      else if (Math.abs(wc - dc - 0.22) < 0.03 && v > 0.4 && v < 0.7) setC('#c9d1da', 1);
      else setC('#3a3f45', 1);
      return;
    }
    if (front && Math.abs(wc - dc) < 0.62 && v > 1.06 && v < 1.13) {
      setC('#3a3f45', 1);
      return;
    }
    if (!nd && u > 0.08 && u < 0.92 && v > 0.38 && v < 1.38) {
      if (
        u < 0.11 ||
        u > 0.89 ||
        v < 0.41 ||
        v > 1.35 ||
        Math.abs(u - 0.5) < 0.012 ||
        (S === 'brick' && Math.abs(v - 0.88) < 0.012)
      )
        setC('#2b2f33', 1);
      else glass();
      return;
    }
  } else {
    const lv = (v - 1.6) % 0.9;
    if (lv < 0.05) {
      setC(S === 'brick' ? '#2b2f33' : '#3a3f45', 1);
      return;
    }
    if (u > 0.06 && u < 0.94 && lv > 0.16 && lv < 0.74) {
      if (u < 0.09 || u > 0.91 || lv < 0.19 || lv > 0.71) setC('#2b2f33', 1);
      else glass();
      return;
    }
  }
  if (S === 'brick') {
    brickC('#9c4a35', wc, v);
    return;
  }
  setC('#e9ebea', 0.97 + (hh((wc * 16) | 0, (v * 16) | 0) % 5) * 0.012);
}

function woodC(wc) {
  if ((wc * 6) % 1 < 0.12) setC('#4e3220', 1);
  else setC('#7a5236', 0.86 + (hh((wc * 6) | 0, 7) % 8) * 0.035);
}

function brickC(col, wc, v) {
  const row = (v * 14) | 0;
  if ((v * 14) % 1 < 0.14 || (wc * 5 + (row % 2) * 0.5) % 1 < 0.07) {
    setC(col, 0.62);
    return;
  }
  setC(col, 0.86 + (hh(row, (wc * 5 + (row % 2) * 0.5) | 0) % 9) * 0.03);
}

function stoneC(wc, v) {
  const row = (v * 8) | 0,
    bx = wc * 2.4 + (row % 2) * 0.43;
  if ((v * 8) % 1 < 0.13 || bx % 1 < 0.07) {
    setC('#7d776c', 1);
    return;
  }
  setC('#a39d90', 0.84 + (hh(row, bx | 0) % 10) * 0.03);
}

function logC(v) {
  const lv = (v * 7) % 1;
  if (lv < 0.07) {
    setC('#4a2e18', 1);
    return;
  }
  setC('#9a6a3a', 0.72 + 0.4 * Math.sin(lv * Math.PI));
}

function styleC(S, hs, wc, v) {
  if (S === 'wood') {
    woodC(wc);
    return true;
  }
  if (S === 'stone') {
    stoneC(wc, v);
    return true;
  }
  if (S === 'log') {
    logC(v);
    return true;
  }
  if (S === 'pastel') {
    setC(PASTEL[((hs.n || 1) - 1) % PASTEL.length], 0.98 + (hh((wc * 16) | 0, (v * 16) | 0) % 4) * 0.01);
    return true;
  }
  if (S === 'brick') {
    brickC('#9c4a35', wc, v);
    return true;
  }
  return false;
}

function drawBarn(c) {
  const X = BARN.x * TILE,
    Y = BARN.y * TILE,
    w = BARN.w * TILE,
    ht = BARN.h * TILE,
    wt = Y + ht * 0.42;
  castShadow(c, X, Y, w, Y + ht);
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(X + 5, Y + ht - 3, w, 7);
  c.fillStyle = '#b8432f';
  c.fillRect(X, wt, w, Y + ht - wt);
  c.fillStyle = '#a33a28';
  for (let x = X; x < X + w; x += 12) c.fillRect(x, wt, 2, Y + ht - wt);
  c.fillStyle = '#5a3a28';
  c.fillRect(X - 8, Y - 16, w + 16, wt - Y + 20);
  c.fillStyle = '#4a2e20';
  for (let yy = Y - 6; yy < wt + 2; yy += 10) c.fillRect(X - 8, yy, w + 16, 3);
  roofShade(c, X - 8, Y - 16, w + 16, wt - Y + 20);
  c.fillStyle = '#fff8e6';
  c.fillRect(X + w / 2 - 26, wt - 24, 52, 18);
  c.fillStyle = '#2e2216';
  c.font = 'bold 13px "Pixelify Sans", monospace';
  c.textAlign = 'center';
  c.fillText('Scheune', X + w / 2, wt - 10);
  const dx = X + w / 2 - 28,
    dy = Y + ht - 58;
  c.fillStyle = '#fff8e6';
  c.fillRect(dx - 3, dy - 3, 62, 61);
  c.fillStyle = '#8f2f22';
  c.fillRect(dx, dy, 56, 58);
  c.strokeStyle = '#fff8e6';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(dx, dy);
  c.lineTo(dx + 28, dy + 58);
  c.moveTo(dx + 28, dy);
  c.lineTo(dx, dy + 58);
  c.moveTo(dx + 28, dy);
  c.lineTo(dx + 56, dy + 58);
  c.moveTo(dx + 56, dy);
  c.lineTo(dx + 28, dy + 58);
  c.stroke();
  c.fillStyle = '#fff8e6';
  c.fillRect(dx + 27, dy, 3, 58);
  // Heuballen
  c.fillStyle = '#e8c547';
  c.fillRect(X + 8, Y + ht - 22, 26, 20);
  c.fillStyle = '#c9a52e';
  c.fillRect(X + 8, Y + ht - 14, 26, 2);
}

function drawShop(c) {
  const X = SHOP.x * TILE,
    Y = SHOP.y * TILE,
    w = SHOP.w * TILE,
    ht = SHOP.h * TILE,
    wt = Y + ht * 0.45;
  castShadow(c, X, Y, w, Y + ht);
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(X + 5, Y + ht - 3, w, 7);
  c.fillStyle = '#b98a5a';
  c.fillRect(X, wt, w, Y + ht - wt);
  c.fillStyle = '#a07446';
  for (let y = wt + 8; y < Y + ht; y += 10) c.fillRect(X, y, w, 2);
  c.fillStyle = '#6d6a66';
  c.fillRect(X - 6, Y - 12, w + 12, wt - Y + 16);
  roofShade(c, X - 6, Y - 12, w + 12, wt - Y + 16);
  c.fillStyle = '#5a5754';
  for (let yy = Y - 2; yy < wt + 2; yy += 10) c.fillRect(X - 6, yy, w + 12, 3);
  c.fillStyle = '#fff8e6';
  c.fillRect(X + w / 2 - 34, wt - 24, 68, 18);
  c.fillStyle = '#2e2216';
  c.font = 'bold 13px "Pixelify Sans", monospace';
  c.textAlign = 'center';
  c.fillText('Werkstatt', X + w / 2, wt - 10);
  const dx = X + w / 2 - 14,
    dy = Y + ht - 34;
  c.fillStyle = '#4a3424';
  c.fillRect(dx, dy, 28, 34);
  c.fillStyle = '#6b4a32';
  c.fillRect(dx + 3, dy + 3, 22, 28);
  drawTool(c, 'axe', X + 22, wt + 26, 24);
  drawTool(c, 'saw', X + w - 24, wt + 22, 24);
  // Hobelbank
  c.fillStyle = '#8a5a35';
  c.fillRect(X + w + 4, Y + ht - 20, 22, 6);
  c.fillRect(X + w + 6, Y + ht - 14, 3, 12);
  c.fillRect(X + w + 21, Y + ht - 14, 3, 12);
}

function drawKlo(c) {
  const X = KLO.x * TILE + 10,
    Y = KLO.y * TILE;
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(X + 3, Y + 60, 46, 6);
  c.fillStyle = '#9a6a3e';
  c.fillRect(X, Y + 8, 44, 54);
  c.fillStyle = '#7a5230';
  for (let x = X; x < X + 44; x += 9) c.fillRect(x, Y + 8, 2, 54);
  c.fillStyle = '#5a3a28';
  c.fillRect(X - 5, Y - 2, 54, 12);
  c.fillStyle = '#6b4226';
  c.fillRect(X + 10, Y + 20, 24, 42);
  c.fillStyle = '#2e2216';
  c.fillRect(X + 17, Y + 26, 4, 3);
  c.fillRect(X + 23, Y + 26, 4, 3);
  c.fillRect(X + 17, Y + 29, 10, 3);
  c.fillRect(X + 19, Y + 32, 6, 2);
  c.fillRect(X + 21, Y + 34, 2, 2);
}

function wellDrinkPhase(cx, cy) {
  const w = player.work;
  if (!w || w.kind !== 'drink') return 0;
  if (Math.abs(w.wx * TILE - cx) > 4 || Math.abs(w.wy * TILE - (cy - 6)) > 8) return 0;
  const t = w.t;
  return t < 0.3 ? t / 0.3 : t < 0.55 ? 1 : t < 0.9 ? 1 - (t - 0.55) / 0.35 : 0;
}

function wellStoneRing(c, cx, cy, rx, ry, y0, y1, front) {
  const r = rng(cx * 7 + cy);
  for (let row = 0; row < 3; row++) {
    const ya = y0 + (row * (y1 - y0)) / 3,
      yb = ya + (y1 - y0) / 3,
      n = 9,
      off = row % 2 ? 0.5 : 0;
    for (let k = 0; k < n; k++) {
      const a0 = (Math.PI * (k + off)) / n,
        a1 = (Math.PI * (k + off + 1)) / n;
      if (a0 >= Math.PI) continue;
      const A1 = Math.min(Math.PI, a1);
      const xa = cx - rx * Math.cos(a0),
        xb = cx - rx * Math.cos(A1),
        sa = Math.sin(a0) * ry,
        sb = Math.sin(A1) * ry,
        lit = 0.82 + 0.28 * (1 - (a0 + A1) / 2 / Math.PI) + (r() - 0.5) * 0.14;
      const base = [154, 147, 132].map((v) => Math.min(255, (v * lit) | 0));
      c.fillStyle = `rgb(${base})`;
      c.beginPath();
      c.moveTo(xa + 0.6, ya + sa + 0.6);
      c.lineTo(xb - 0.6, ya + sb + 0.6);
      c.lineTo(xb - 0.6, yb + sb - 0.6);
      c.lineTo(xa + 0.6, yb + sa - 0.6);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.13)';
      c.fillRect(Math.min(xa, xb) + 1, ya + Math.min(sa, sb) + 0.8, Math.abs(xb - xa) - 2, 1);
    }
  }
}

function drawWellBase(c, w) {
  const cx = (w.x + 1) * TILE,
    cy = (w.y + 1) * TILE + 6,
    RX = 28,
    RY = 17,
    H = 17,
    r = rng(w.x * 31 + w.y);
  // Schatten
  const sg = c.createRadialGradient(cx + 4, cy + H + 4, 4, cx + 4, cy + H + 4, 40);
  sg.addColorStop(0, 'rgba(0,0,0,.32)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sg;
  c.beginPath();
  c.ellipse(cx + 4, cy + H + 4, 40, 12, 0, 0, 7);
  c.fill();
  // Mauer vorne
  c.fillStyle = '#5d574d';
  c.beginPath();
  c.ellipse(cx, cy + H, RX, RY, 0, 0, Math.PI);
  c.lineTo(cx - RX, cy);
  c.ellipse(cx, cy, RX, RY, 0, Math.PI, 0, true);
  c.closePath();
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(cx, cy + H, RX, RY, 0, 0, Math.PI);
  c.lineTo(cx - RX, cy);
  c.ellipse(cx, cy, RX, RY, 0, Math.PI, 0, true);
  c.closePath();
  c.clip();
  wellStoneRing(c, cx, cy, RX, RY, cy, cy + H);
  const gr = c.createLinearGradient(cx - RX, 0, cx + RX, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.06)');
  gr.addColorStop(0.7, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,.28)');
  c.fillStyle = gr;
  c.fillRect(cx - RX, cy - 2, RX * 2, H + RY + 2);
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.fillRect(cx - RX, cy + H + RY - 5, RX * 2, 5);
  // Moos
  for (let i = 0; i < 5; i++) {
    const a = 0.4 + r() * 2.3,
      mx = cx - RX * Math.cos(a),
      my = cy + H + Math.sin(a) * RY - 2 - r() * 4;
    c.fillStyle = r() < 0.5 ? 'rgba(92,128,58,.85)' : 'rgba(70,104,44,.8)';
    c.beginPath();
    c.ellipse(mx, my, 3 + r() * 3, 1.6 + r() * 1.4, 0, 0, 7);
    c.fill();
  }
  c.restore();
  // Rand oben
  c.fillStyle = '#bdb5a4';
  c.beginPath();
  c.ellipse(cx, cy, RX, RY, 0, 0, 7);
  c.fill();
  c.strokeStyle = 'rgba(70,64,55,.55)';
  c.lineWidth = 1;
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * (RX - 7), cy + Math.sin(a) * (RY - 5));
    c.lineTo(cx + Math.cos(a) * RX, cy + Math.sin(a) * RY);
    c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,.18)';
  c.beginPath();
  c.ellipse(cx - 3, cy - 3, RX - 4, RY - 5, 0, Math.PI * 1.05, Math.PI * 1.75);
  c.lineTo(cx - 3, cy - 3);
  c.fill();
  // Loch und Wasser
  const hg = c.createLinearGradient(0, cy - 11, 0, cy + 11);
  hg.addColorStop(0, '#1d2326');
  hg.addColorStop(1, '#3a4146');
  c.fillStyle = hg;
  c.beginPath();
  c.ellipse(cx, cy, RX - 7, RY - 6, 0, 0, 7);
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(cx, cy, RX - 7, RY - 6, 0, 0, 7);
  c.clip();
  const wg = c.createLinearGradient(0, cy - 4, 0, cy + 10);
  wg.addColorStop(0, '#24577a');
  wg.addColorStop(1, '#3d8fc0');
  c.fillStyle = wg;
  c.beginPath();
  c.ellipse(cx, cy + 4, RX - 9, RY - 8, 0, 0, 7);
  c.fill();
  c.strokeStyle = 'rgba(190,230,255,.45)';
  c.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const ph = (now * 0.6 + k / 3) % 1;
    c.globalAlpha = 1 - ph;
    c.beginPath();
    c.ellipse(cx + Math.sin(k * 2) * 3, cy + 5, 3 + ph * 12, 1.5 + ph * 4, 0, 0, 7);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.fillRect(cx - 8 + Math.sin(now * 1.7) * 3, cy + 2, 7, 1.2);
  c.restore();
}

function drawWellTop(c, cx, cy, dp) {
  const RX = 28;
  const post = (x) => {
    const g = c.createLinearGradient(x - 3, 0, x + 3, 0);
    g.addColorStop(0, '#8a5a35');
    g.addColorStop(0.5, '#6b4226');
    g.addColorStop(1, '#4a2e1a');
    c.fillStyle = g;
    c.fillRect(x - 3, cy - 50, 6, 52);
    c.fillStyle = 'rgba(30,15,5,.35)';
    c.fillRect(x - 1, cy - 46, 0.8, 14);
    c.fillRect(x + 1, cy - 26, 0.8, 10);
    c.fillStyle = '#4a2e1a';
    c.fillRect(x - 4, cy - 2, 8, 4);
  };
  post(cx - RX + 3);
  post(cx + RX - 3);
  // Winde
  const wy = cy - 33,
    dg = c.createLinearGradient(0, wy - 4, 0, wy + 4);
  dg.addColorStop(0, '#a8743f');
  dg.addColorStop(0.5, '#8a5a35');
  dg.addColorStop(1, '#5a3a1e');
  c.fillStyle = dg;
  c.fillRect(cx - RX + 6, wy - 4, 2 * RX - 12, 8);
  c.strokeStyle = '#c9b48a';
  c.lineWidth = 1;
  for (let k = -9; k <= 9; k += 2.2) {
    c.beginPath();
    c.moveTo(cx + k, wy - 4);
    c.lineTo(cx + k + 1.4, wy + 4);
    c.stroke();
  }
  c.fillStyle = '#4a4f55';
  c.fillRect(cx + RX, wy - 1, 7, 2);
  c.fillRect(cx + RX + 6, wy - 1, 2, 8);
  c.fillStyle = '#2e2216';
  c.fillRect(cx + RX + 5, wy + 6, 4, 4);
  // Seil und Eimer
  const sway = Math.sin(now * 1.3) * 1.2,
    by = cy - 16 + dp * 17,
    bx = cx + sway * (1 - dp);
  c.strokeStyle = '#c9b48a';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(cx, wy + 4);
  c.lineTo(bx, by - 6);
  c.stroke();
  c.strokeStyle = '#5a5a5a';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(bx, by - 3, 4, Math.PI, 0);
  c.stroke();
  const bg = c.createLinearGradient(bx - 5, 0, bx + 5, 0);
  bg.addColorStop(0, '#a8743f');
  bg.addColorStop(1, '#6b4226');
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(bx - 5, by - 3);
  c.lineTo(bx + 5, by - 3);
  c.lineTo(bx + 4, by + 5);
  c.lineTo(bx - 4, by + 5);
  c.closePath();
  c.fill();
  c.fillStyle = '#4a4f55';
  c.fillRect(bx - 5, by - 2, 10, 1.2);
  c.fillRect(bx - 4.4, by + 2.6, 8.8, 1.2);
  if (dp > 0.6) {
    c.fillStyle = '#5fb2ea';
    c.beginPath();
    c.ellipse(bx, by - 3, 4.4, 1.2, 0, 0, 7);
    c.fill();
  }
  // Dach mit Schindeln
  const ry = cy - 66,
    ey = cy - 44,
    L = RX + 10;
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.moveTo(cx - L, ey);
  c.lineTo(cx + L, ey);
  c.lineTo(cx + L - 4, ey + 5);
  c.lineTo(cx - L + 4, ey + 5);
  c.closePath();
  c.fill();
  c.fillStyle = '#6e2a18';
  c.beginPath();
  c.moveTo(cx - L + 6, ry - 4);
  c.lineTo(cx + L - 6, ry - 4);
  c.lineTo(cx + L - 6, ry);
  c.lineTo(cx - L + 6, ry);
  c.fill();
  c.save();
  c.beginPath();
  c.moveTo(cx - L + 6, ry);
  c.lineTo(cx + L - 6, ry);
  c.lineTo(cx + L, ey);
  c.lineTo(cx - L, ey);
  c.closePath();
  c.clip();
  c.fillStyle = '#8f3a22';
  c.fillRect(cx - L, ry, 2 * L, ey - ry);
  const rr = rng(cx | 0);
  for (let y = ry, row = 0; y < ey; y += 4.4, row++) {
    const off = row % 2 ? 3.5 : 0,
      lit = 0.85 + (0.2 * (y - ry)) / (ey - ry);
    for (let x = cx - L - 7 + off; x < cx + L; x += 7) {
      const v = lit + (rr() - 0.5) * 0.16;
      c.fillStyle = `rgb(${[181, 72, 44].map((q) => Math.min(255, (q * v) | 0))})`;
      c.fillRect(x + 0.5, y, 6, 4);
      c.fillStyle = 'rgba(60,20,10,.45)';
      c.fillRect(x + 0.5, y + 3.4, 6, 1);
    }
  }
  const rg = c.createLinearGradient(cx - L, 0, cx + L, 0);
  rg.addColorStop(0, 'rgba(255,255,255,.08)');
  rg.addColorStop(1, 'rgba(0,0,0,.22)');
  c.fillStyle = rg;
  c.fillRect(cx - L, ry, 2 * L, ey - ry);
  c.restore();
  c.fillStyle = '#5a2214';
  c.fillRect(cx - L, ey - 1.5, 2 * L, 2.5);
  c.fillStyle = '#7a2f1b';
  c.fillRect(cx - L + 5, ry - 6, 2 * L - 10, 3);
  c.fillStyle = 'rgba(255,255,255,.15)';
  c.fillRect(cx - L + 5, ry - 6, 2 * L - 10, 1);
}

function drawWell(c, w) {
  const cx = (w.x + 1) * TILE,
    cy = (w.y + 1) * TILE + 6,
    dp = wellDrinkPhase(cx, cy);
  drawWellBase(c, w);
  if (dp > 0.5) {
    c.save();
    c.beginPath();
    c.ellipse(cx, cy, 21, 11, 0, 0, 7);
    c.clip();
    drawWellTop(c, cx, cy, dp);
    c.restore();
    c.save();
    c.beginPath();
    c.rect(cx - 60, cy - 80, 120, 80);
    c.clip();
    drawWellTop(c, cx, cy, dp);
    c.restore();
  } else drawWellTop(c, cx, cy, dp);
}

function sprWellTop() {
  return mkSpr(
    'wellTop',
    96,
    120,
    (c) => {
      const sv = now;
      now = 0;
      drawWellTop(c, 48, 96, 0);
      now = sv;
    },
    3,
    118,
  );
}

function drawStall(c, s, aw, goods, label) {
  const X = s.x * TILE,
    Y = s.y * TILE,
    r = rng(s.x * 131 + s.y * 7),
    A = aw[0],
    B = aw[1];
  const sg = c.createRadialGradient(X + 34, Y + 30, 4, X + 34, Y + 30, 40);
  sg.addColorStop(0, 'rgba(0,0,0,.3)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sg;
  c.beginPath();
  c.ellipse(X + 34, Y + 30, 40, 10, 0, 0, 7);
  c.fill();
  // hintere Pfosten
  c.fillStyle = '#4a2e1a';
  c.fillRect(X + 8, Y - 34, 4, 40);
  c.fillRect(X + 52, Y - 34, 4, 40);
  // Tischplatte
  c.fillStyle = '#8a5a35';
  c.fillRect(X + 1, Y + 1, 62, 12);
  for (let k = 0; k < 4; k++) {
    c.fillStyle = ['#b07a43', '#a87340', '#bd8650', '#a06d3c'][k];
    c.fillRect(X + 1, Y + 1 + k * 3, 62, 2.6);
  }
  // Tischdecke
  c.fillStyle = B;
  c.fillRect(X + 9, Y + 1, 46, 12);
  c.fillStyle = shade(B, -18);
  for (let x = X + 9; x < X + 55; x += 6) c.fillRect(x, Y + 1, 3, 12);
  c.fillStyle = B;
  c.beginPath();
  c.moveTo(X + 9, Y + 12);
  for (let x = X + 9; x <= X + 55; x += 4.6) c.lineTo(x, (((x - X) / 4.6) | 0) % 2 ? Y + 19 : Y + 17);
  c.lineTo(X + 55, Y + 12);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,.12)';
  c.fillRect(X + 9, Y + 12, 46, 1.5);
  // Vorderwand aus Brettern
  for (let k = 0; k < 8; k++) {
    const x = X + 1 + k * 7.75,
      v = 0.88 + r() * 0.2;
    c.fillStyle = `rgb(${[168, 116, 63].map((q) => Math.min(255, (q * v) | 0))})`;
    c.fillRect(x, Y + 13, 7.4, 19);
    c.fillStyle = 'rgba(60,35,15,.3)';
    c.fillRect(x + 1.5 + r() * 4, Y + 15 + r() * 6, 0.7, 6 + r() * 6);
    c.fillStyle = 'rgba(40,25,10,.55)';
    c.fillRect(x + 7.2, Y + 13, 0.6, 19);
    c.fillStyle = '#3a2a1e';
    c.fillRect(x + 3.3, Y + 15, 1, 1);
    c.fillRect(x + 3.3, Y + 28, 1, 1);
  }
  c.fillStyle = '#5a3a1e';
  c.fillRect(X + 1, Y + 21, 62, 2.5);
  const fg = c.createLinearGradient(0, Y + 13, 0, Y + 32);
  fg.addColorStop(0, 'rgba(0,0,0,.18)');
  fg.addColorStop(0.25, 'rgba(0,0,0,0)');
  fg.addColorStop(1, 'rgba(0,0,0,.25)');
  c.fillStyle = fg;
  c.fillRect(X + 1, Y + 13, 62, 19);
  // Waren in Körben
  goods.forEach((g, i) => {
    const bx = X + 14 + i * 18,
      by = Y + 8;
    c.fillStyle = '#7a5530';
    c.beginPath();
    c.ellipse(bx, by + 2, 8, 4, 0, 0, 7);
    c.fill();
    c.fillStyle = '#a87a48';
    c.beginPath();
    c.ellipse(bx, by, 8, 3.4, 0, 0, 7);
    c.fill();
    c.strokeStyle = 'rgba(70,45,20,.6)';
    c.lineWidth = 0.7;
    for (let k = -6; k <= 6; k += 3) {
      c.beginPath();
      c.moveTo(bx + k, by - 2);
      c.lineTo(bx + k, by + 5);
      c.stroke();
    }
    if (VEG.has(g)) drawVeg(c, g, bx, by + 1, 17);
    else if (SP[g]) spr(c, SP[g].r, SP[g].p, bx - 8, by - 9, 2);
  });
  // vordere Pfosten
  for (const px of [X + 1, X + 58]) {
    const g = c.createLinearGradient(px, 0, px + 5, 0);
    g.addColorStop(0, '#8a5a35');
    g.addColorStop(1, '#4a2e1a');
    c.fillStyle = g;
    c.fillRect(px, Y - 28, 5, 61);
  }
  // Stoffdach mit Streifen
  const yb = Y - 46,
    yf = Y - 24,
    n = 8;
  for (let i = 0; i < n; i++) {
    const xb0 = X + 6 + (i * 52) / n,
      xb1 = X + 6 + ((i + 1) * 52) / n,
      xf0 = X - 4 + (i * 72) / n,
      xf1 = X - 4 + ((i + 1) * 72) / n;
    c.fillStyle = i % 2 ? B : A;
    c.beginPath();
    c.moveTo(xb0, yb);
    c.lineTo(xb1, yb);
    c.lineTo(xf1, yf + Math.sin(((i + 1) / n) * Math.PI) * 2);
    c.lineTo(xf0, yf + Math.sin((i / n) * Math.PI) * 2);
    c.closePath();
    c.fill();
  }
  const ag = c.createLinearGradient(0, yb, 0, yf);
  ag.addColorStop(0, 'rgba(255,255,255,.18)');
  ag.addColorStop(1, 'rgba(0,0,0,.16)');
  c.fillStyle = ag;
  c.beginPath();
  c.moveTo(X + 6, yb);
  c.lineTo(X + 58, yb);
  c.lineTo(X + 68, yf + 2);
  c.lineTo(X - 4, yf + 2);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(X + 6, yb, 52, 1.5);
  // Volant
  for (let i = 0; i < n; i++) {
    const x = X - 4 + i * 9 + 4.5,
      y = yf + Math.sin(((i + 0.5) / n) * Math.PI) * 2;
    c.fillStyle = i % 2 ? shade(B, -22) : shade(A, -22);
    c.beginPath();
    c.moveTo(x - 4.5, y);
    c.lineTo(x + 4.5, y);
    c.lineTo(x + 4.5, y + 3);
    c.arc(x, y + 3, 4.5, 0, Math.PI);
    c.closePath();
    c.fill();
  }
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.fillRect(X + 2, yf + 9, 60, 2);
  // Schild
  if (label) {
    c.font = 'bold 10px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    const tw = Math.max(30, c.measureText(label).width + 12),
      sx = X + TILE - tw / 2,
      sy = Y - 62;
    c.fillStyle = '#4a2e1a';
    c.fillRect(X + TILE - tw / 2 + 6, sy + 12, 2, 6);
    c.fillRect(X + TILE + tw / 2 - 8, sy + 12, 2, 6);
    c.fillStyle = '#6b4226';
    c.fillRect(sx, sy, tw, 14);
    c.fillStyle = '#c99a62';
    c.fillRect(sx + 1.5, sy + 1.5, tw - 3, 11);
    c.fillStyle = 'rgba(120,80,40,.25)';
    c.fillRect(sx + 1.5, sy + 6, tw - 3, 1);
    c.fillStyle = '#2e2216';
    c.fillText(label, X + TILE, sy + 10.5);
  }
}

function drawTree(c, t) {
  if (GCV || NOSWAY) return drawTreeReal(c, t);
  const X = t.x * TILE + 16,
    Y = t.y * TILE + 28;
  if (state.chopped.includes(t.id)) {
    c.fillStyle = '#6b4226';
    c.fillRect(X - 8, Y - 10, 16, 10);
    c.fillStyle = '#c99a62';
    c.fillRect(X - 8, Y - 12, 16, 4);
    c.fillStyle = '#a8743f';
    c.fillRect(X - 3, Y - 11, 6, 2);
    return;
  }
  c.fillStyle = 'rgba(0,0,0,.2)';
  c.beginPath();
  c.ellipse(X, Y, 15, 5, 0, 0, 7);
  c.fill();
  c.fillStyle = '#7a4c2c';
  c.fillRect(X - 5, Y - 22, 10, 22);
  c.fillStyle = '#64391f';
  c.fillRect(X + 1, Y - 22, 4, 22);
  const v = (t.id % 3) * 3;
  c.fillStyle = '#3c8a3a';
  c.beginPath();
  c.arc(X, Y - 38 - v, 19, 0, 7);
  c.arc(X - 13, Y - 27, 13, 0, 7);
  c.arc(X + 13, Y - 27, 13, 0, 7);
  c.fill();
  c.fillStyle = '#55a846';
  c.beginPath();
  c.arc(X - 5, Y - 43 - v, 10, 0, 7);
  c.arc(X + 8, Y - 32, 7, 0, 7);
  c.fill();
  if (t.apple) {
    c.fillStyle = '#e5484d';
    c.fillRect(X - 10, Y - 30, 4, 4);
    c.fillRect(X + 7, Y - 40, 4, 4);
    c.fillRect(X + 2, Y - 24, 4, 4);
  }
}

function drawSign(c, x, y, text) {
  const X = x * TILE,
    Y = y * TILE;
  c.font = 'bold 12px "Pixelify Sans", monospace';
  const tw = c.measureText(text).width + 12;
  c.fillStyle = '#6b4226';
  c.fillRect(X + 14, Y - 4, 4, 30);
  c.fillStyle = '#c99a62';
  c.fillRect(X + 16 - tw / 2, Y - 12, tw, 18);
  c.strokeStyle = '#6b4226';
  c.lineWidth = 2;
  c.strokeRect(X + 16 - tw / 2, Y - 12, tw, 18);
  c.fillStyle = '#2e2216';
  c.textAlign = 'center';
  c.fillText(text, X + 16, Y + 2);
}

function drawSite(c) {
  const X = Math.max(46, Math.min(50.4, bridgeEnd() - 1.7)) * TILE,
    Y = 27 * TILE;
  c.fillStyle = '#a8743f';
  c.fillRect(X + 2, Y + 14, 24, 5);
  c.fillRect(X + 4, Y + 9, 22, 5);
  c.fillStyle = '#8a5a2b';
  c.fillRect(X + 2, Y + 18, 24, 1);
  c.fillStyle = '#f2b134';
  c.fillRect(X + 20, Y - 6, 4, 24);
  c.fillStyle = '#2e2216';
  c.fillRect(X + 20, Y, 4, 3);
  c.fillRect(X + 20, Y + 8, 4, 3);
}

function world() {
  if (scene) {
    drawInterior();
    return;
  }
  const SCv = view === 'map' ? Math.min(VW / (MAP_W * TILE), VH / (MAP_H * TILE)) : SC;
  const c = ctx,
    vw = VW / SCv,
    vh = VH / SCv;
  let tx = player.x * TILE - vw / 2,
    ty = player.y * TILE - vh / 2 - 16;
  tx = MAP_W * TILE < vw ? (MAP_W * TILE - vw) / 2 : Math.max(0, Math.min(MAP_W * TILE - vw, tx));
  ty = MAP_H * TILE < vh ? (MAP_H * TILE - vh) / 2 : Math.max(0, Math.min(MAP_H * TILE - vh, ty));
  const k = SCv * DPR;
  camX = Math.round(tx * k) / k;
  camY = Math.round(ty * k) / k;
  c.setTransform(k, 0, 0, k, -camX * k, -camY * k);
  c.imageSmoothingEnabled = false;
  const x0 = Math.max(0, Math.floor(camX / TILE)),
    x1 = Math.min(MAP_W - 1, Math.ceil((camX + vw) / TILE)),
    y0 = Math.max(0, Math.floor(camY / TILE)),
    y1 = Math.min(MAP_H - 1, Math.ceil((camY + vh) / TILE));
  if (view === 'map') {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#2e2216';
    c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(k, 0, 0, k, -camX * k, -camY * k);
  }
  c.fillStyle = '#7cc35a';
  c.fillRect(Math.max(0, camX), Math.max(0, camY), Math.min(vw, MAP_W * TILE), Math.min(vh, MAP_H * TILE));
  if (GCV) {
    c.imageSmoothingEnabled = true;
    const gw = x1 - x0 + 1,
      gh = y1 - y0 + 1;
    c.drawImage(
      GCV,
      x0 * TILE * GSC,
      y0 * TILE * GSC,
      gw * TILE * GSC,
      gh * TILE * GSC,
      x0 * TILE,
      y0 * TILE,
      gw * TILE,
      gh * TILE,
    );
    c.imageSmoothingEnabled = false;
    waterFx(c, x0, x1, y0, y1);
  } else for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) tile(c, i, j);
  PLOTS.forEach((p, i) => drawPlot(c, p, state.plots[i]));
  const D = [],
    vis = (x, y) => x > x0 - 4 && x < x1 + 4 && y > y0 - 3 && y < y1 + 5;
  HOUSES.forEach((h) => vis(h.x + 3, h.y) && D.push([h.y + h.h, () => drawHouse(c, h, h.n)]));
  V2H.forEach(
    (h) =>
      vis(h.x + 3, h.y) &&
      D.push([
        h.y + h.h,
        () => {
          drawHouse(c, h, 0);
          if (h.tailor) drawTailorSign(c);
        },
      ]),
  );
  D.push(
    [BARN.y + BARN.h, () => drawBarn(c)],
    [SHOP.y + SHOP.h, () => drawShop(c)],
    [KLO.y + 2, () => drawKlo(c)],
    [WELL.y + 2, () => drawWell(c, WELL)],
    [WELL2.y + 2, () => drawWell(c, WELL2)],
  );
  PSTALLS.forEach((s, i) => {
    D.push([s.y + 1, () => drawStall(c, s, psAwning(i), psGoods(i), psLabel(i))]);
  });
  STALLS2.forEach((s, i) => {
    if (!vis(s.x, s.y)) return;
    const me = i === MYSTALL,
      seed = i < 3;
    const sl = sellers2[i];
    if (!me && sl.state !== 'inside')
      D.push([
        sl.y,
        () =>
          drawPerson(c, sl.x * TILE, sl.y * TILE, sl.look, sl.face, sl.state === 'stall' ? 0 : sl.phase, {
            ang: angOf(sl, sl.state === 'stall' ? Math.PI / 2 : sl.dir),
          }),
      ]);
    const goods = me
      ? SELL.filter((k) => state.stall[k] > 0).slice(0, 3)
      : seed
        ? Object.keys(SEEDSHOP[i].get)
        : sellers2[i].goods;
    D.push([
      s.y + 1,
      () =>
        drawStall(
          c,
          s,
          me ? ['#3f8f3a', '#fff8e6'] : sellers2[i].aw,
          goods,
          me ? 'Dein Stand' : seed ? 'Samen' : '',
        ),
    ]);
  });
  TREES.forEach((t) => vis(t.x, t.y) && D.push([t.y + 0.95, () => drawTree(c, t)]));
  for (const n in GARAGES)
    if (hasGarage(+n) && vis(GARAGES[n].x + 1, GARAGES[n].y))
      D.push([GARAGES[n].y + 2, () => drawGarage(c, +n)]);
  ROCKS.forEach((rk) => vis(rk.x, rk.y) && D.push([rk.y + 0.9, () => drawRock(c, rk)]));
  if (player.work && player.work.kind === 'fish') D.push([player.y + 0.05, () => drawFishLine(c)]);
  drawHarborProps(c, D);
  D.push([26.9, () => drawSign(c, 44, 26, 'Marktdorf →')], [26.9, () => drawSign(c, 54, 26, 'Marktdorf')]);
  if (!state.bridge) D.push([28, () => drawSite(c)]);
  if (bridgeWood() > 0) {
    D.push([28.02, () => drawRail(c, 28, false)]);
    D.push([29.98, () => drawRail(c, 30, true)]);
  }
  horses.forEach((h) => {
    if (player.mount && player.mount.o === h) return;
    D.push([h.y, () => drawHorse3D(c, h.x * TILE, h.y * TILE, h, angOf(h, h.dir), h.wait > 0 ? 0 : h.phase)]);
  });
  bikes.forEach((b) => {
    if (player.mount && player.mount.o === b) return;
    D.push([
      b.y,
      () => drawBike3D(c, b.x * TILE, b.y * TILE, b, b.ang ?? (b.face === 'left' ? Math.PI : 0), 0, null),
    ]);
  });
  villagers.forEach((v) =>
    D.push([v.y, () => drawPerson(c, v.x * TILE, v.y * TILE, v.look, v.face, v.phase)]),
  );
  buyers.forEach((b) =>
    D.push([
      b.y,
      () =>
        drawPerson(c, b.x * TILE, b.y * TILE, b.look, b.face, b.phase, {
          ang: angOf(b, b.state === 'buy' ? -Math.PI / 2 : b.dir),
        }),
    ]),
  );
  D.push([
    player.y + ((player.jz || 0) > 20 ? 3 : 0),
    () => {
      const fx = player.x * TILE,
        jz = player.jz || 0,
        fy = player.y * TILE - jz;
      if (jz > 0) {
        const k = Math.max(0.4, 1 - jz / 120);
        c.fillStyle = 'rgba(0,0,0,.2)';
        c.beginPath();
        c.ellipse(fx, player.y * TILE, 12 * k, 5 * k, 0, 0, 7);
        c.fill();
      }
      if (player.mount && player.mount.type === 'horse') {
        const h = player.mount.o;
        h.rang = player.rang;
        h.dir = player.rang;
        drawHorse3D(c, fx, fy, h, player.rang, player.moving ? player.phase : 0, state.look);
      } else if (player.mount) {
        const b = player.mount.o;
        b.ang = player.rang;
        drawBike3D(c, fx, fy, b, player.rang, player.moving ? player.phase : 0, state.look);
      } else
        drawPerson(c, fx, fy, state.look, player.face, player.jz > 0 ? 0 : player.moving ? player.phase : 0, {
          noShadow: player.jz > 0,
          jump: player.jz > 0 ? player.jv : undefined,
          ang: player.rang,
          chop:
            player.work && (player.work.kind === 'chop' || player.work.kind === 'mine')
              ? player.work.t
              : undefined,
          tool:
            player.work && player.work.kind === 'mine'
              ? 'pick'
              : player.work && player.work.kind === 'fish'
                ? 'rod'
                : player.work && player.work.kind === 'water'
                  ? 'can'
                  : 'axe',
          reach:
            player.work &&
            (player.work.kind === 'fish' || player.work.kind === 'water' || player.work.kind === 'cook')
              ? 0.27
              : undefined,
          reach: player.work && player.work.kind === 'harvest' ? player.work.t : undefined,
          drink:
            player.work && (player.work.kind === 'drink' || player.work.kind === 'eat')
              ? player.work.t
              : undefined,
          food: player.work && player.work.kind === 'eat' ? player.work.k : undefined,
        });
      c.font = 'bold 11px "Nunito", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = 'rgba(46,34,22,.75)';
      const nm = state.name || '';
      const tw = c.measureText(nm).width + 8;
      const ny = fy - (player.mount ? (player.mount.type === 'horse' ? 66 : 50) : 44);
      if (nm) {
        c.fillRect(fx - tw / 2, ny - 11, tw, 14);
        c.fillStyle = '#fff8e6';
        c.fillText(nm, fx, ny);
      }
    },
  ]);
  for (const o of others.values()) if (o.sc === 'out') D.push([o.y, () => drawOther(c, o)]);
  D.sort((a, b) => a[0] - b[0]);
  D.forEach((d) => d[1]());
  drawParts(c);
  // Zielmarkierung
  if (cur && cur.act && !player.mount) {
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
  grade(c);
  c.setTransform(SCv * DPR, 0, 0, SCv * DPR, -camX * SCv * DPR, -camY * SCv * DPR);
  // Nacht
  const n = night();
  if (n > 0) {
    c.fillStyle = `rgba(18,24,64,${n})`;
    c.fillRect(camX, camY, vw, vh);
    c.globalCompositeOperation = 'lighter';
    HOUSES.forEach((h) => {
      if (!hasPower(h.n)) return;
      for (const r of houseWindows(h)) {
        c.fillStyle = `rgba(255,190,90,${n * 0.35})`;
        c.fillRect(r[0] - 8, r[1] - 6, r[2] + 16, r[3] + 16);
        c.fillStyle = `rgba(255,220,130,${n * 0.5})`;
        c.fillRect(r[0], r[1], r[2], r[3]);
      }
    });
    V2H.forEach((h, hi) => {
      if (!sellers2.some((q, i) => i !== MYSTALL && q.hi === hi && q.state === 'inside')) return;
      for (const r of houseWindows(h)) {
        c.fillStyle = `rgba(255,200,110,${n * 0.4})`;
        c.fillRect(r[0] - 6, r[1] - 4, r[2] + 12, r[3] + 10);
      }
    });
    c.globalCompositeOperation = 'source-over';
  }
  if (view === 'map') drawDots(c, SCv);
}
