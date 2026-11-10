// ================= Sprites =================
function spr(c, rows, pal, x, y, p) {
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '.') continue;
      c.fillStyle = pal[ch];
      c.fillRect(x + i * p, y + j * p, p, p);
    }
  }
}
const BAG = ['..t..t..', '...tt...', '..sSSs..', '.sSSSSs.', '.sScCSs.', '.sSccSs.', '.sSSSSs.', '..ssss..'];
const SP = {
  coin: {
    r: ['..YYYY..', '.YyyyyY.', 'YyKyyKyY', 'YyyyyyyY', 'YKyyyyKY', 'YyKKKKyY', '.YyyyyY.', '..YYYY..'],
    p: { Y: '#c98a12', y: '#ffd23f', K: '#5a3a00' },
  },
  carrot: {
    r: ['.....gG.', '....gGg.', '...oOg..', '..oOo...', '.oOo....', '.Oo.....', 'oo......', 'o.......'],
    p: { o: '#e8731c', O: '#ff9a3c', g: '#3f9a3a', G: '#6cc24a' },
  },
  wheat: {
    r: ['...yY...', '..yYy...', '...yY.y.', '..yYyYy.', '...yYy..', '....Y...', '....g...', '....g...'],
    p: { y: '#d9a72e', Y: '#f5d36b', g: '#8a9a3a' },
  },
  pumpkin: {
    r: ['...gg...', '....g...', '.oOoOoo.', 'oOoOoOoo', 'oOoOoOoo', 'oOoOoOoo', '.oOoOoo.', '........'],
    p: { o: '#d9621a', O: '#ff9a3c', g: '#3f7a2a' },
  },
  soup: {
    r: ['........', '.s....s.', '..s..s..', 'bBBBBBBb', 'bOoOoOob', '.bOoOob.', '..bbbb..', '........'],
    p: { b: '#6d747d', B: '#c9d1da', O: '#ff9a3c', o: '#e8731c', s: '#e8e8e8' },
  },
  bread: {
    r: ['........', '..bBBb..', '.bBwBwb.', 'bBwBwBBb', 'bBBBBBBb', '.bbbbbb.', '........', '........'],
    p: { b: '#a8692e', B: '#d99a52', w: '#f2cf8f' },
  },
  seed_carrot: { r: BAG, p: { t: '#7a5a3a', s: '#b99a6a', S: '#e8d3a6', c: '#e8731c', C: '#3f9a3a' } },
  seed_wheat: { r: BAG, p: { t: '#7a5a3a', s: '#b99a6a', S: '#e8d3a6', c: '#d9a72e', C: '#f5d36b' } },
  seed_pumpkin: { r: BAG, p: { t: '#7a5a3a', s: '#b99a6a', S: '#e8d3a6', c: '#d9621a', C: '#3f7a2a' } },
  wood: {
    r: ['........', '........', '.bbbbbbr', 'bBBBBBrR', 'bBBBBBrR', 'bbbbbbbr', '........', '........'],
    p: { b: '#6b4226', B: '#8a5a35', r: '#c99a62', R: '#e8c08a' },
  },
  plank: {
    r: ['........', 'pPPPPPPp', 'pPPpPPPp', 'pppppppp', 'pPPPPpPp', 'pPPPPPPp', 'pppppppp', '........'],
    p: { p: '#a8743f', P: '#d9a46a' },
  },
  axe: {
    r: ['..ggg...', '.gGGg...', '.gGGbb..', '..g.b...', '....b...', '....b...', '....b...', '........'],
    p: { g: '#7d8590', G: '#c9d1da', b: '#8a5a35' },
  },
  saw: {
    r: ['........', '........', 'bb......', 'bBgggggg', 'bBGGGGGg', 'bb.v.v.v', '........', '........'],
    p: { b: '#8a5a35', B: '#b5652e', g: '#7d8590', G: '#c9d1da', v: '#7d8590' },
  },
};

const iconCache = {};

// ================= Realistisches Gemüse =================
const VEG = new Set([
  'carrot',
  'wheat',
  'pumpkin',
  'bread',
  'soup',
  'fish',
  'cod',
  'tuna',
  'stone',
  'cake',
  'pie',
  'ffish',
  'salad',
]);

function lerpCol(a, b, t) {
  const A = rgb(a),
    B = rgb(b);
  return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`;
}

function frond(c, x, y, len, ang, col, w) {
  const ex = x + Math.cos(ang) * len,
    ey = y + Math.sin(ang) * len;
  c.strokeStyle = col;
  c.lineWidth = w || 1;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + Math.cos(ang + 0.3) * len * 0.5, y + Math.sin(ang + 0.3) * len * 0.5, ex, ey);
  c.stroke();
  c.fillStyle = col;
  for (let k = 0.35; k < 1; k += 0.18) {
    const px = x + (ex - x) * k,
      py = y + (ey - y) * k,
      s = len * 0.13 * (1.15 - k);
    c.beginPath();
    c.ellipse(px + Math.cos(ang - 1.3) * s, py + Math.sin(ang - 1.3) * s, s, s * 0.45, ang - 1.3, 0, 7);
    c.fill();
    c.beginPath();
    c.ellipse(px + Math.cos(ang + 1.3) * s, py + Math.sin(ang + 1.3) * s, s, s * 0.45, ang + 1.3, 0, 7);
    c.fill();
  }
}

function drawVeg(c, k, x, y, S) {
  c.save();
  c.translate(x, y);
  const s = S / 32;
  c.scale(s, s);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (k === 'carrot') {
    c.rotate(-0.55);
    for (const [a, l, col] of [
      [-2.2, 11, '#2f7a2a'],
      [-1.75, 13, '#3f9a3a'],
      [-1.35, 12, '#4fae46'],
      [-1.0, 10, '#3f9a3a'],
      [-2.6, 9, '#5fbb52'],
    ])
      frond(c, 0, -9, l, a, col, 1.1);
    const g = c.createLinearGradient(-5, 0, 5, 0);
    g.addColorStop(0, '#ffb25e');
    g.addColorStop(0.45, '#f37f22');
    g.addColorStop(1, '#c4561a');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-5, -9);
    c.quadraticCurveTo(-5.5, -2, -1.2, 13);
    c.quadraticCurveTo(0, 15.5, 1.2, 13);
    c.quadraticCurveTo(5.5, -2, 5, -9);
    c.quadraticCurveTo(0, -11, -5, -9);
    c.fill();
    c.strokeStyle = 'rgba(140,60,10,.55)';
    c.lineWidth = 0.7;
    for (const yy of [-4, 0, 4, 8]) {
      c.beginPath();
      c.moveTo(-3.5 + yy * 0.18, yy);
      c.quadraticCurveTo(0, yy + 1.2, 1.5 - yy * 0.08, yy + 0.4);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,230,190,.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-3.4, -7);
    c.quadraticCurveTo(-3.6, 0, -1.4, 8);
    c.stroke();
  } else if (k === 'wheat') {
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.17,
        bx = i * 1.2,
        by = 14,
        tx = bx + Math.cos(a) * 24,
        ty = by + Math.sin(a) * 24;
      c.strokeStyle = i % 2 ? '#b9922f' : '#cfa83c';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(tx, ty);
      c.stroke();
      for (let g = 0; g < 6; g++) {
        const t = 0.62 + g * 0.065,
          gx = bx + (tx - bx) * t,
          gy = by + (ty - by) * t;
        for (const sd of [-1, 1]) {
          const gr = c.createLinearGradient(gx - 2, gy, gx + 2, gy);
          gr.addColorStop(0, '#f7dc84');
          gr.addColorStop(1, '#c9982e');
          c.fillStyle = gr;
          c.beginPath();
          c.ellipse(gx + sd * 1.5, gy, 1.9, 1.1, a + sd * 0.6, 0, 7);
          c.fill();
        }
      }
      c.strokeStyle = 'rgba(230,200,120,.8)';
      c.lineWidth = 0.4;
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(tx + Math.cos(a - 0.15) * 5, ty + Math.sin(a - 0.15) * 5);
      c.stroke();
    }
    c.fillStyle = '#8a5a2b';
    c.fillRect(-4.5, 7, 9, 2.6);
    c.fillStyle = '#a8743f';
    c.fillRect(-4.5, 7, 9, 0.9);
  } else if (k === 'pumpkin') {
    const lob = [
      [-8, 1, 7.5, 9],
      [8, 1, 7.5, 9],
      [-4, 1, 7, 10],
      [4, 1, 7, 10],
      [0, 1, 6.5, 10.5],
    ];
    lob.forEach(([lx, ly, rx, ry], i) => {
      const g = c.createRadialGradient(lx - 3, ly - 4, 1, lx, ly, ry * 1.1);
      g.addColorStop(0, i < 2 ? '#ffa64a' : '#ffb35a');
      g.addColorStop(0.7, i < 2 ? '#d9621a' : '#ee7a22');
      g.addColorStop(1, '#a8461a');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(lx, ly, rx, ry, 0, 0, 7);
      c.fill();
    });
    c.strokeStyle = 'rgba(150,60,15,.45)';
    c.lineWidth = 0.8;
    for (const lx of [-5.8, -1.8, 1.8, 5.8]) {
      c.beginPath();
      c.moveTo(lx * 0.8, -8);
      c.quadraticCurveTo(lx * 1.15, 1, lx * 0.8, 10.5);
      c.stroke();
    }
    c.strokeStyle = '#5a6b2a';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(0, -8);
    c.quadraticCurveTo(1, -13, 4, -14);
    c.stroke();
    c.fillStyle = '#4f8f3a';
    c.beginPath();
    c.ellipse(-5, -10, 4.5, 2.4, -0.5, 0, 7);
    c.fill();
    c.strokeStyle = '#3a6e2a';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-8, -8.5);
    c.lineTo(-2, -11.5);
    c.stroke();
    c.fillStyle = 'rgba(255,240,200,.35)';
    c.beginPath();
    c.ellipse(-2.5, -3, 1.6, 4, 0, 0, 7);
    c.fill();
  } else if (k === 'fish') {
    c.rotate(-0.2);
    const g = c.createLinearGradient(0, -7, 0, 7);
    g.addColorStop(0, '#6f8fa8');
    g.addColorStop(0.5, '#c9d8e4');
    g.addColorStop(1, '#eef3f6');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-13, 0);
    c.quadraticCurveTo(-2, -10, 9, -1);
    c.lineTo(15, -7);
    c.lineTo(14, 7);
    c.lineTo(9, 1);
    c.quadraticCurveTo(-2, 10, -13, 0);
    c.fill();
    c.fillStyle = 'rgba(230,120,160,.45)';
    c.fillRect(-8, -1, 13, 2);
    c.fillStyle = '#1a1a1a';
    c.beginPath();
    c.arc(-8, -2, 1.4, 0, 7);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(-8.6, -2.8, 0.8, 0.8);
    c.strokeStyle = 'rgba(60,80,100,.5)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-5, -5);
    c.quadraticCurveTo(-3, 0, -5, 5);
    c.stroke();
  } else if (k === 'cod' || k === 'tuna') {
    const tu = k === 'tuna';
    c.rotate(-0.2);
    if (tu) c.scale(1.12, 1.12);
    const g = c.createLinearGradient(0, -8, 0, 8);
    g.addColorStop(0, tu ? '#1f3a5f' : '#6f6a45');
    g.addColorStop(0.45, tu ? '#5f7fa8' : '#b7a77a');
    g.addColorStop(1, tu ? '#e8eef3' : '#f1ead6');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-14, 0);
    c.quadraticCurveTo(-3, tu ? -11 : -9, 9, -1.5);
    c.lineTo(15, tu ? -9 : -7);
    c.lineTo(tu ? 13 : 14, 0);
    c.lineTo(15, tu ? 9 : 7);
    c.lineTo(9, 1.5);
    c.quadraticCurveTo(-3, tu ? 11 : 9, -14, 0);
    c.fill();
    if (tu) {
      c.fillStyle = '#f2c12e';
      for (let q = 0; q < 4; q++) {
        c.fillRect(1 + q * 2.2, -5.6 + q * 0.7, 1.3, 1.3);
        c.fillRect(1 + q * 2.2, 4.4 - q * 0.7, 1.3, 1.3);
      }
      c.fillStyle = '#1f3a5f';
      c.beginPath();
      c.moveTo(-2, -7);
      c.lineTo(3, -12);
      c.lineTo(4, -6);
      c.fill();
    } else {
      c.fillStyle = 'rgba(80,70,40,.5)';
      for (let q = 0; q < 7; q++) c.fillRect(-9 + q * 2.6, -4 + ((q * 7) % 3), 1.2, 1.2);
      c.strokeStyle = '#e8e2cc';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-6, -1);
      c.quadraticCurveTo(1, 1, 8, 0);
      c.stroke();
      c.strokeStyle = '#5a5030';
      c.beginPath();
      c.moveTo(-12, 2);
      c.lineTo(-13, 5);
      c.stroke();
    }
    c.fillStyle = '#1a1a1a';
    c.beginPath();
    c.arc(-9, -2, 1.4, 0, 7);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(-9.6, -2.8, 0.8, 0.8);
  } else if (k === 'stone') {
    const g = c.createRadialGradient(-4, -4, 1, 0, 0, 13);
    g.addColorStop(0, '#d6d1c6');
    g.addColorStop(0.7, '#8f897e');
    g.addColorStop(1, '#5f5a52');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-12, 4);
    c.lineTo(-9, -6);
    c.lineTo(0, -10);
    c.lineTo(10, -5);
    c.lineTo(12, 5);
    c.lineTo(4, 10);
    c.lineTo(-7, 9);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(50,45,40,.4)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-3, -8);
    c.lineTo(0, 0);
    c.lineTo(6, 2);
    c.stroke();
  } else if (k === 'cake' || k === 'pie') {
    c.fillStyle = '#f4efe4';
    c.beginPath();
    c.ellipse(0, 6, 15, 5, 0, 0, 7);
    c.fill();
    c.fillStyle = '#d9cfb8';
    c.beginPath();
    c.ellipse(0, 7, 15, 4, 0, 0, Math.PI);
    c.fill();
    if (k === 'cake') {
      c.fillStyle = '#c98a4a';
      c.fillRect(-11, -6, 22, 11);
      c.fillStyle = '#fff8e6';
      c.beginPath();
      c.ellipse(0, -6, 11, 4, 0, 0, 7);
      c.fill();
      c.fillStyle = '#b8732f';
      c.fillRect(-11, -1, 22, 1.5);
      for (const [a, b] of [
        [-5, -7],
        [0, -5],
        [5, -7],
      ]) {
        c.fillStyle = '#ff9a3c';
        c.beginPath();
        c.ellipse(a, b, 2.2, 1.1, 0.3, 0, 7);
        c.fill();
        c.fillStyle = '#3f9a3a';
        c.fillRect(a - 0.5, b - 2.2, 1, 1.2);
      }
    } else {
      c.fillStyle = '#c98a4a';
      c.beginPath();
      c.ellipse(0, 1, 13, 6, 0, 0, 7);
      c.fill();
      c.fillStyle = '#e8731c';
      c.beginPath();
      c.ellipse(0, 0, 10.5, 4.3, 0, 0, 7);
      c.fill();
      c.strokeStyle = '#e8b070';
      c.lineWidth = 1.2;
      for (let i = -8; i <= 8; i += 4) {
        c.beginPath();
        c.moveTo(i, -4);
        c.lineTo(i + 2, 4);
        c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.3)';
      c.fillRect(-6, -2, 3, 1);
    }
  } else if (k === 'ffish') {
    c.fillStyle = '#f4efe4';
    c.beginPath();
    c.ellipse(0, 4, 15, 6, 0, 0, 7);
    c.fill();
    c.save();
    c.translate(0, -1);
    c.rotate(-0.1);
    const g = c.createLinearGradient(0, -6, 0, 6);
    g.addColorStop(0, '#c97a2a');
    g.addColorStop(1, '#8a4a16');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-11, 0);
    c.quadraticCurveTo(0, -8, 8, -1);
    c.lineTo(13, -5);
    c.lineTo(12, 5);
    c.lineTo(8, 1);
    c.quadraticCurveTo(0, 8, -11, 0);
    c.fill();
    c.strokeStyle = 'rgba(60,30,10,.6)';
    c.lineWidth = 0.8;
    for (const x of [-4, 0, 4]) {
      c.beginPath();
      c.moveTo(x, -4);
      c.lineTo(x + 2, 3);
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#ffe066';
    c.beginPath();
    c.moveTo(-14, 4);
    c.lineTo(-9, 2);
    c.lineTo(-9, 6);
    c.fill();
    c.fillStyle = '#3f9a3a';
    c.fillRect(6, 5, 3, 1.5);
  } else if (k === 'salad') {
    c.fillStyle = '#f4efe4';
    c.beginPath();
    c.moveTo(-13, -1);
    c.quadraticCurveTo(-12, 11, 0, 11);
    c.quadraticCurveTo(12, 11, 13, -1);
    c.closePath();
    c.fill();
    c.fillStyle = '#3fa7d6';
    c.fillRect(-11, 4, 22, 1.5);
    for (let i = 0; i < 14; i++) {
      c.fillStyle = i % 3 ? '#ff9a3c' : '#5fbf5a';
      c.save();
      c.translate(-9 + (i % 7) * 3, -2 + (i > 6 ? -3 : 0));
      c.rotate(i);
      c.fillRect(-2, -0.6, 4, 1.4);
      c.restore();
    }
  } else if (k === 'bread') {
    const g = c.createLinearGradient(0, -8, 0, 9);
    g.addColorStop(0, '#e3a75a');
    g.addColorStop(0.6, '#b8732f');
    g.addColorStop(1, '#8a5222');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 1, 14, 8.5, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#f3d299';
    c.lineWidth = 1.6;
    for (const d of [-6, 0, 6]) {
      c.beginPath();
      c.moveTo(d - 2.5, -3);
      c.quadraticCurveTo(d, -1, d + 2.5, 3);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 10; i++) c.fillRect(-10 + i * 2.2, -5 + (i % 3), 1, 1);
  } else if (k === 'soup') {
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = 'rgba(255,255,255,.7)';
      c.lineWidth = 1.2;
      const sx = -5 + i * 5,
        o = Math.sin((typeof now === 'number' ? now : 0) * 3 + i) * 1.5;
      c.beginPath();
      c.moveTo(sx, -4);
      c.quadraticCurveTo(sx + 3 + o, -9, sx, -13);
      c.quadraticCurveTo(sx - 3, -16, sx + 1, -19);
      c.stroke();
    }
    c.fillStyle = '#f4efe4';
    c.beginPath();
    c.moveTo(-14, 0);
    c.quadraticCurveTo(-13, 13, 0, 13);
    c.quadraticCurveTo(13, 13, 14, 0);
    c.closePath();
    c.fill();
    c.fillStyle = '#3d6fb0';
    c.fillRect(-12.5, 4, 25, 2);
    c.fillStyle = '#d8d1c2';
    c.beginPath();
    c.ellipse(0, 0, 14, 4, 0, 0, 7);
    c.fill();
    const g = c.createRadialGradient(-3, -1, 1, 0, 0, 12);
    g.addColorStop(0, '#ffb25e');
    g.addColorStop(1, '#e06a1c');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 0, 12, 3.2, 0, 0, 7);
    c.fill();
    c.fillStyle = '#3f9a3a';
    for (const [a, b] of [
      [-5, -0.5],
      [3, 0.6],
      [-1, 1],
      [6, -0.8],
    ])
      c.fillRect(a, b, 1.4, 1);
  }
  c.restore();
}

// Pflanzen auf dem Acker, je nach Wachstum
function drawCrop(c, k, cx, by, g, seed) {
  const sw =
    Math.sin(now * 1.6 + seed) * 0.06 +
    (typeof treeSway === 'function' ? treeSway({ x: seed, y: seed, id: seed | 0 }) * 0.8 : 0);
  g = Math.min(1, g);
  c.save();
  c.translate(cx, by);
  c.scale(1.5, 1.5);
  c.lineCap = 'round';
  if (k === 'carrot') {
    const n = 3 + Math.round(g * 4),
      L = 4 + g * 12;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1 || 1) - 0.5) * 1.5 + sw;
      frond(c, 0, 0, L * (0.75 + (i % 2) * 0.25), a, i % 2 ? '#3f9a3a' : '#5bb54b', 0.9);
    }
    if (g >= 1) {
      const gr = c.createRadialGradient(-1, 1, 0.5, 0, 1, 4);
      gr.addColorStop(0, '#ffa85a');
      gr.addColorStop(1, '#d9621a');
      c.fillStyle = gr;
      c.beginPath();
      c.ellipse(0, 1.5, 4, 2.4, 0, 0, 7);
      c.fill();
    }
  } else if (k === 'wheat') {
    const n = 5,
      H = 5 + g * 20,
      col = g < 0.7 ? '#5aa944' : lerpCol('#8bb54a', '#d8b24a', Math.min(1, (g - 0.7) / 0.3));
    for (let i = 0; i < n; i++) {
      const ox = (i - 2) * 2.6,
        a = -Math.PI / 2 + sw * 1.5 + (i - 2) * 0.06,
        tx = ox + Math.cos(a) * H,
        ty = Math.sin(a) * H;
      c.strokeStyle = col;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(ox, 0);
      c.quadraticCurveTo(ox, ty * 0.5, tx, ty);
      c.stroke();
      if (g > 0.45) {
        c.strokeStyle = col;
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(ox, -H * 0.3);
        c.lineTo(ox + (i % 2 ? 4 : -4), -H * 0.45);
        c.stroke();
      }
      if (g > 0.6)
        for (let q = 0; q < 5; q++) {
          const gx = tx - Math.cos(a) * q * 1.5,
            gy = ty - Math.sin(a) * q * 1.5;
          c.fillStyle = g >= 1 ? (q % 2 ? '#f2d27a' : '#d6aa45') : '#9cc25a';
          c.beginPath();
          c.ellipse(gx - 1, gy, 1.3, 0.8, a + 0.6, 0, 7);
          c.fill();
          c.beginPath();
          c.ellipse(gx + 1, gy, 1.3, 0.8, a - 0.6, 0, 7);
          c.fill();
        }
    }
  } else if (k === 'pumpkin') {
    const nl = 2 + Math.round(g * 3);
    for (let i = 0; i < nl; i++) {
      const a = (i / nl) * Math.PI * 2 + 0.4,
        d = 4 + g * 5,
        lx = Math.cos(a) * d,
        ly = Math.sin(a) * d * 0.5 - 3,
        r = 2.5 + g * 3.5;
      c.strokeStyle = '#4f8f3a';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -2);
      c.lineTo(lx, ly);
      c.stroke();
      const gr = c.createRadialGradient(lx - 1, ly - 1, 0.5, lx, ly, r);
      gr.addColorStop(0, '#7cc35a');
      gr.addColorStop(1, '#3a7a2e');
      c.fillStyle = gr;
      c.beginPath();
      for (let q = 0; q < 5; q++) {
        const aa = (q / 5) * Math.PI * 2;
        c.lineTo(lx + Math.cos(aa) * r, ly + Math.sin(aa) * r * 0.7);
        c.lineTo(lx + Math.cos(aa + 0.6) * r * 0.7, ly + Math.sin(aa + 0.6) * r * 0.5);
      }
      c.closePath();
      c.fill();
    }
    if (g > 0.45) {
      c.restore();
      c.save();
      const ps = g >= 1 ? 25 : 8 + ((g - 0.45) / 0.55) * 12;
      c.translate(cx + 2, by - ps * 0.3);
      if (g < 1) c.filter = 'hue-rotate(40deg) saturate(.7)';
      drawVeg(c, 'pumpkin', 0, 0, ps);
      c.filter = 'none';
    }
  }
  c.restore();
}

function iconURL(k) {
  if (iconCache[k]) return iconCache[k];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  if (k.startsWith('tool_')) drawTool(x, k.slice(5), 32, 32, 56);
  else if (VEG.has(k)) drawVeg(x, k, 32, 34, 56);
  else {
    x.imageSmoothingEnabled = false;
    spr(x, SP[k].r, SP[k].p, 0, 0, 8);
  }
  return (iconCache[k] = c.toDataURL());
}
