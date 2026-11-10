// ================= Sichten: Normal, 3D, Karte =================
let view = 'normal';
const RGB = {};
function rgb(h) {
  return (
    RGB[h] ||
    (RGB[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])
  );
}
const CC = [0, 0, 0];
function setC(h, m) {
  const a = rgb(h);
  CC[0] = a[0] * m;
  CC[1] = a[1] * m;
  CC[2] = a[2] * m;
}
const WK = new Uint8Array(MAP_W * MAP_H),
  WV = new Uint8Array(MAP_W * MAP_H);
const HK = [0, 2.2, 2.6, 2.0, 1.6, 0.6, 0.6, 0.7, 2.0, 1.15];
const AOM = new Uint8Array(MAP_W * MAP_H),
  FACEL = { s: 1, w: 0.9, e: 0.74, n: 0.62 };

function aoMask(K, w, h, tall, out) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const t = j * w + i;
      if (tall(t)) {
        out[t] = 0;
        continue;
      }
      let mk = 0;
      if (i > 0 && tall(t - 1)) mk |= 1;
      if (i < w - 1 && tall(t + 1)) mk |= 2;
      if (j > 0 && tall(t - w)) mk |= 4;
      if (j < h - 1 && tall(t + w)) mk |= 8;
      out[t] = mk;
    }
}

function gableOf(k, ti) {
  if (k === 1 || k === 8) {
    const hs = k === 1 ? HOUSES[WV[ti]] : V2H[WV[ti]],
      ex = k === 1 ? extraOf(hs.n) * 0.9 : 0,
      top = k === 1 ? houseCfg(hs.n).top : 'classic';
    return {
      x0: hs.x,
      y0: hs.y,
      x1: hs.x + hs.w,
      y1: hs.y + hs.h,
      Hw: 1.6 + ex,
      Hr: SDEF[top].roof === 'flat' ? 0 : 1.25,
      wall: hs.wall,
      roof: SDEF[top].rc || hs.roof,
      sty: houseStyle(hs, k === 1 ? hs.n : 0),
      st: top,
      hs,
    };
  }
  if (k === 2)
    return {
      x0: BARN.x,
      y0: BARN.y,
      x1: BARN.x + BARN.w,
      y1: BARN.y + BARN.h,
      Hw: 1.9,
      Hr: 1.4,
      wall: '#b8432f',
      roof: '#5a3a28',
      sty: 0,
    };
  if (k === 3)
    return {
      x0: SHOP.x,
      y0: SHOP.y,
      x1: SHOP.x + SHOP.w,
      y1: SHOP.y + SHOP.h,
      Hw: 1.45,
      Hr: 1.05,
      wall: '#b98a5a',
      roof: '#6d6a66',
      sty: 0,
    };
  return null;
}

function build3D() {
  WK.fill(0);
  WV.fill(0);
  const r = (x, y, w, h, k, v) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        WK[tileIndex(i, j)] = k;
        WV[tileIndex(i, j)] = v;
      }
  };
  for (let i = 0; i < MAP_W * MAP_H; i++) if (fence[i]) WK[i] = 5;
  HOUSES.forEach((h, i) => r(h.x, h.y, h.w, h.h, 1, i));
  V2H.forEach((h, i) => r(h.x, h.y, h.w, h.h, 8, i));
  r(BARN.x, BARN.y, BARN.w, BARN.h, 2, 0);
  r(SHOP.x, SHOP.y, SHOP.w, SHOP.h, 3, 0);
  r(KLO.x, KLO.y, 2, 2, 4, 0);
  r(WELL.x, WELL.y, 2, 2, 7, 0);
  r(WELL2.x, WELL2.y, 2, 2, 7, 0);
  STALLS1.forEach((s) => r(s.x, s.y, 2, 1, 6, 0));
  STALLS2.forEach((s) => r(s.x, s.y, 2, 1, 6, 0));
  for (const n in GARAGES) if (hasGarage(+n)) r(GARAGES[n].x, GARAGES[n].y, 3, 2, 9, +n);
  aoMask(WK, MAP_W, MAP_H, (t) => WK[t] && HK[WK[t]] >= 1.5, AOM);
}
const GC = [
  '#7cc35a',
  '#dcb57e',
  '#d3cbb9',
  '#3d97d4',
  '#8b5a36',
  '#c49a62',
  '#e6d199',
  '#b07a43',
  '#73bb54',
].map(rgb);
const PLOTG = new Uint8Array(MAP_W * MAP_H);
PLOTS.forEach((p) => (PLOTG[tileIndex(p.x, p.y)] = 1));
const PLOTC = rgb('#6a4225');
const GPT = 32;
let Q3 = 0.8,
  PITCH = 0,
  q3avg = 10,
  CLOUD = null;
const lerpRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const FURN = {
  sack: [0.8, '#c9a878'],
  hay: [1, '#e2c071'],
  ladder: [1.9, '#8a5a35'],
  fork: [1.5, '#8a5a35'],
  cart: [1, '#8a5a35'],
  toolrack: [1.6, '#b98a5a'],
  bench: [0.9, '#a8743f'],
  grind: [0.8, '#8a8a8a'],
  sawhorse: [0.7, '#8a5a35'],
  planks: [0.6, '#c99a62'],
  barrel: [0.95, '#6e4426'],
  bed: [0.5, '#8a5a35'],
  nightstand: [0.6, '#a8743f'],
  wardrobe: [1.8, '#7a4c2c'],
  sofa: [0.7, null],
  tv: [0.95, '#3a3a3a'],
  shelf: [1.8, '#6b4226'],
  plant: [0.8, '#3c8a3a'],
  table: [0.7, '#b98a5a'],
  ctable: [0.45, '#b98a5a'],
  fridge: [1.8, '#e8eef2'],
  counter: [0.9, '#b98a5a'],
  sink: [0.9, '#b98a5a'],
  stove: [0.9, '#7d8590'],
  oven: [0.9, '#7d8590'],
  pantry: [1.8, '#8a5a35'],
  tub: [0.55, '#f4f8fa'],
  toilet: [0.6, '#f4f8fa'],
  basin: [0.9, '#f4f8fa'],
  boxes: [0.8, '#b98a5a'],
  pingpong: [0.75, '#6b4226'],
};
const FTOP = {
  bed: null,
  sofa: null,
  table: '#d4a46a',
  ctable: '#d4a46a',
  counter: '#e9e1cf',
  sink: '#b9c4cc',
  stove: '#333333',
  oven: '#e9e1cf',
  tub: '#bfe3f2',
  toilet: '#bfe3f2',
  basin: '#bfe3f2',
  pingpong: '#2f7a5a',
  plant: '#55a846',
  boxes: '#c99a62',
  nightstand: '#c99a62',
};

function prep3D(m) {
  if (m.K) return;
  m.AOM = new Uint8Array(IW * IH);
  m.K = new Uint8Array(IW * IH);
  m.OI = new Int16Array(IW * IH).fill(-1);
  m.FC = [];
  for (let i = 0; i < IW * IH; i++) {
    if (m.T[i] === 0) m.K[i] = 20;
    m.FC[i] = rgb(
      ['#6b4f3a', '#d4a06a', '#efe8d8', '#cfe6ef', '#b98450', '#c4a060', '#1f6f9e', '#3d4a52'][m.T[i]] ||
        '#6b4f3a',
    );
  }
  m.objs.forEach((o, oi) => {
    for (let j = o.y; j < o.y + o.h; j++)
      for (let i = o.x; i < o.x + o.w; i++) {
        const t = j * IW + i;
        if (o.k === 'rug' && !(i === o.x || i === o.x + o.w - 1 || j === o.y || j === o.y + o.h - 1))
          m.FC[t] = rgb(o.c);
        else if (o.k === 'rug') m.FC[t] = rgb(shade(o.c, 30));
        if (o.k === 'stairs') m.FC[t] = rgb('#8a5a35');
        if (o.solid && FURN[o.k]) {
          m.K[t] = 21;
          m.OI[t] = oi;
        }
      }
  });
  aoMask(m.K, IW, IH, (t) => m.K[t] === 20 || (m.K[t] === 21 && FURN[m.objs[m.OI[t]].k][0] >= 1.5), m.AOM);
}

function wallCol(k, ti, face, wc, u, v, m) {
  const tx = ti % (m ? IW : MAP_W),
    ty = (ti / (m ? IW : MAP_W)) | 0,
    nt = night();
  if (k === 9) {
    const n = WV[ti],
      g = GARAGES[n],
      hs = HOUSES[n - 1],
      S = houseCfg(n).base,
      open = state.homes[n] && state.homes[n].gOpen;
    if (v > 1.06) {
      setC(isMod(S) ? (S === 'brick' ? '#6e3326' : '#3a3f45') : shade(SDEF[S].rc || hs.roof, -20), 1);
      return;
    }
    if (face === 's' && ty === g.y + 1 && wc > g.x + 0.35 && wc < g.x + 2.65 && v < 0.92) {
      if (open) {
        setC(v < 0.1 ? '#5a5f65' : '#1c2024', 1);
        return;
      }
      if (S === 'wood' || S === 'log' || S === 'stone') {
        if ((wc * 6) % 1 < 0.12) setC('#5a3a22', 1);
        else setC('#8a5a35', 0.9);
        return;
      }
      setC(isMod(S) ? '#c9ced3' : S === 'brick' ? '#3a3f45' : '#f4efe4', (v * 10) % 1 < 0.12 ? 0.8 : 1);
      return;
    }
    if (v < 0.1) {
      setC(isMod(S) ? '#4a4f55' : '#8f897e', 1);
      return;
    }
    if (!styleC(S, hs, wc, v)) setC(S === 'modern' ? '#e9ebea' : hs.wall, 1);
    return;
  }
  if (k === 1 || k === 8) {
    const hs = k === 1 ? HOUSES[WV[ti]] : V2H[WV[ti]],
      Ht = k === 1 ? 2.2 + extraOf(hs.n) * 0.9 : HK[k];
    const HS = k === 1 ? houseCfg(hs.n) : null,
      fj = v < 1.6 ? -1 : Math.floor((v - 1.6) / 0.9),
      SS = HS ? (fj < 0 ? HS.base : HS.fs[Math.min(fj, HS.fs.length - 1)] || HS.base) : 'classic';
    if (isMod(SS)) {
      modernWall(hs, HS, face, wc, u, v, ty, SS);
      return;
    }
    const wallF = () => {
      if (!styleC(SS, hs, wc, v)) setC(hs.wall, 1);
    };
    if (v >= 1.6 && v < Ht - 0.6) {
      const lv = (v - 1.6) % 0.9;
      if (u > 0.26 && u < 0.74 && lv > 0.2 && lv < 0.62) {
        setC(
          u < 0.31 || u > 0.69 || lv < 0.24 || lv > 0.58
            ? '#fff8e6'
            : nt > 0.15 && k === 1 && hasPower(hs.n)
              ? '#ffd86b'
              : '#a9dcef',
          1,
        );
        return;
      }
      wallF();
      return;
    }
    if (v > Ht - 0.62 && v < Ht - 0.57) {
      setC('#8f9aa3', 1);
      return;
    }
    if (v > Ht - 0.6) {
      const rv = (v - (Ht - 0.6)) * 12,
        row = rv | 0,
        cl = wc * 5 + (row % 2) * 0.5,
        fr = rv % 1;
      let mm = 0.88 + (hh(row, cl | 0) % 10) * 0.025;
      if (cl % 1 < 0.07) mm *= 0.72;
      if (fr < 0.18) mm *= 0.78;
      setC(hs.roof, mm);
      return;
    }
    const dc = k === 1 ? hs.x + 3 : hs.x + 2.5,
      front = face === 's' && ty === hs.y + hs.h - 1;
    if (front && Math.abs(wc - dc) < 0.42 && v < 1.06) {
      if (Math.abs(wc - dc) < 0.36 && v < 1) {
        setC('#6b4226', 1);
        if (Math.abs(wc - dc - 0.22) < 0.05 && Math.abs(v - 0.5) < 0.06) setC('#f2b134', 1);
      } else setC('#4a2e1c', 1);
      return;
    }
    if (u > 0.26 && u < 0.74 && v > 0.72 && v < 1.3 && !(front && Math.abs(wc - dc) < 0.9)) {
      if (u < 0.31 || u > 0.69 || v < 0.77 || v > 1.25 || Math.abs(u - 0.5) < 0.025) setC('#fff8e6', 1);
      else {
        const lit =
          nt > 0.15 &&
          (k === 8
            ? sellers2.some((q, i) => i !== MYSTALL && q.hi === WV[ti] && q.state === 'inside')
            : hasPower(hs.n));
        setC(lit ? '#ffd86b' : nt > 0.15 ? '#2b3448' : '#a9dcef', 1);
      }
      return;
    }
    const sty = houseStyle(hs, k === 1 ? hs.n : 0);
    if (v < 0.14) {
      const row = (v * 14) | 0;
      setC(
        '#8f897e',
        (wc * 3 + row * 0.5) % 1 < 0.06 || (v * 14) % 1 < 0.12
          ? 0.75
          : 0.92 + (hh((wc * 3) | 0, row) % 8) * 0.02,
      );
      return;
    }
    if (
      v > 0.72 &&
      v < 1.3 &&
      ((u > 0.14 && u < 0.26) || (u > 0.74 && u < 0.86)) &&
      !(front && Math.abs(wc - dc) < 0.9)
    ) {
      setC((SDEF[SS] && SDEF[SS].sh) || shade(hs.roof, 15), ((v * 22) | 0) % 2 ? 0.82 : 1);
      return;
    }
    if (v > 0.62 && v < 0.72 && u > 0.26 && u < 0.74 && !(front && Math.abs(wc - dc) < 0.9)) {
      if (v > 0.68) {
        const q = ((wc * 24) | 0) % 4;
        setC(q === 0 ? '#e5484d' : q === 2 ? '#ffd23f' : '#3f8f3a', 1);
      } else setC('#7a4c2c', 1);
      return;
    }
    if (styleC(SS, hs, wc, v)) return;
    if (sty === 1) {
      const row = (v * 14) | 0;
      if ((v * 14) % 1 < 0.14 || (wc * 5 + (row % 2) * 0.5) % 1 < 0.07) {
        setC(hs.wall, 1.08);
        return;
      }
      setC(hs.wall, 0.72 + (hh(row, (wc * 5 + (row % 2) * 0.5) | 0) % 9) * 0.025);
      return;
    }
    if (
      sty === 2 &&
      ((v > 0.14 && v < 0.2) ||
        (v > 1.42 && v < 1.5) ||
        u < 0.05 ||
        u > 0.95 ||
        ((wc | 0) % 2 === 0 && Math.abs(u - (v - 0.2) / 1.22) < 0.04))
    ) {
      setC('#5a3a22', 1);
      return;
    }
    setC(hs.wall, 0.96 + (hh((wc * 16) | 0, (v * 16) | 0) % 6) * 0.012);
    return;
  }
  if (k === 2) {
    if (v > 1.9) {
      setC('#5a3a28', ((v * 8) | 0) % 2 ? 0.85 : 1);
      return;
    }
    if (face === 's' && wc > 33.4 && wc < 35.6 && v < 1.7) {
      const a = (wc - 33.4) / 2.2,
        b = v / 1.7;
      if (
        Math.abs(a - b) < 0.03 ||
        Math.abs(a - (1 - b)) < 0.03 ||
        a < 0.03 ||
        a > 0.97 ||
        b > 0.96 ||
        Math.abs(a - 0.5) < 0.015
      )
        setC('#fff8e6', 1);
      else setC('#8f2f22', 1);
      return;
    }
    setC('#b8432f', (wc * 5) % 1 < 0.1 ? 0.85 : 1);
    return;
  }
  if (k === 3) {
    if (v > 1.45) {
      setC('#6d6a66', ((v * 8) | 0) % 2 ? 0.85 : 1);
      return;
    }
    if (face === 's' && wc > 33.55 && wc < 34.45 && v < 1.05) {
      setC('#4a3424', 1);
      return;
    }
    if (face === 's' && v > 1.12 && v < 1.36 && wc > 33.1 && wc < 34.9) {
      setC('#fff8e6', 1);
      return;
    }
    setC('#b98a5a', (v * 6) % 1 < 0.12 ? 0.85 : 1);
    return;
  }
  if (k === 4) {
    if (v > 1.4) {
      setC('#5a3a28', 1);
      return;
    }
    if (face === 's' && wc > 38.65 && wc < 39.35 && v < 1.25) {
      setC(Math.abs(wc - 39) < 0.06 && v > 0.95 && v < 1.08 ? '#2e2216' : '#6b4226', 1);
      return;
    }
    setC('#9a6a3e', (wc * 4) % 1 < 0.12 ? 0.8 : 1);
    return;
  }
  if (k === 5 || k === 6) {
    const pw = wc * 7,
      pi = Math.floor(pw),
      fr = pw - pi,
      h = hh(pi, ti),
      gap = fr < 0.07,
      grain = (Math.sin(v * 38 + h * 0.7 + fr * 3) * 0.5 + 0.5) * 0.07;
    const top = k === 6 || v > 0.5;
    setC(
      gap ? '#4a2e1a' : top ? '#b98a52' : '#8a5a2b',
      (gap ? 1 : 0.9 + (h % 9) * 0.02 - grain) * (top && k === 5 ? 1.12 : 1),
    );
    return;
  }

  if (k === 7) {
    const row = Math.floor(v * 11),
      sh2 = row % 2 ? 0.5 : 0,
      sx = wc * 5 + sh2,
      si = Math.floor(sx),
      fu = sx - si,
      fv = v * 11 - row,
      mort = fu < 0.08 || fv < 0.12,
      h = hh(si + row * 31, row + ti);
    setC(
      mort ? '#6d675c' : ['#9a9384', '#a8a191', '#8c867a', '#b0a998', '#948e80'][h % 5],
      mort ? 1 : (0.92 + fv * 0.12) * (v < 0.08 ? 0.85 : 1),
    );
    return;
  }
  if (k === 20 && scene && scene.map.cave) {
    const W2 = wc + tx * 1.7 + ty * 0.9,
      n =
        Math.sin(W2 * 5.3 + v * 3.1) * 0.45 +
        Math.sin(W2 * 13.7 + v * 8.9) * 0.25 +
        Math.sin(v * 21 + W2 * 2.3) * 0.15 +
        Math.sin(W2 * 31 + v * 27) * 0.08,
      crack = Math.abs(Math.sin(W2 * 6.1 + v * 3.7 + Math.sin(v * 9) * 0.6)) < 0.035;
    const torch =
      0.55 + 0.45 * Math.max(0, Math.sin(W2 * 1.3 + 0.6)) * Math.max(0, 1 - Math.abs(v - 1.1) * 0.6);
    setC(v < 0.14 ? '#3d5236' : crack ? '#1d2226' : '#56606a', (0.62 + n * 0.22) * (0.85 + torch * 0.35));
    return;
  }
  if (k === 20) {
    if (
      tx === 10 &&
      ty === IH - 1 &&
      face === 'n' &&
      wc > 10.12 &&
      wc < 10.88 &&
      v < 1.45 &&
      scene.floor === 0
    ) {
      setC(Math.abs(wc - 10.7) < 0.05 && Math.abs(v - 0.7) < 0.06 ? '#f2b134' : '#6b4226', 1);
      return;
    }
    if (v < 0.14) {
      setC('#a8865f', 1);
      return;
    }
    if (v > 1.86) {
      setC('#8a6a4e', 1);
      return;
    }
    setC(scene.floor ? '#e8dcc8' : '#efe1c3', (wc * 2) % 1 < 0.04 ? 0.92 : 1);
    return;
  }
  if (k === 21) {
    const o = m.objs[m.OI[ti]],
      f = FURN[o.k];
    const base = f[1] || o.c;
    if (o.k === 'fridge') {
      setC(
        Math.abs(v - 1.1) < 0.03 || (u > 0.8 && u < 0.85 && v > 0.5 && v < 1.6) ? '#9aa3ab' : '#e8eef2',
        1,
      );
      return;
    }
    if (o.k === 'oven' && v > 0.15 && v < 0.55 && u > 0.2 && u < 0.8) {
      setC(hasPower(scene.house.n) ? '#ff9a3c' : '#2b2b2b', 1);
      return;
    }
    if (o.k === 'tv' && v > 0.45 && u > 0.1 && u < 0.9) {
      setC(hasPower(scene.house.n) ? '#4a8ac0' : '#222222', 1);
      return;
    }
    if ((o.k === 'shelf' || o.k === 'pantry') && v > 0.15 && v < 1.7) {
      const bc = ['#e5484d', '#3d6fb0', '#f2b134', '#3f9a3a', '#f4efe4', '#8e5bd6'];
      setC((v * 3) % 1 < 0.12 ? '#4a2e1c' : bc[((u * 6) | 0) + ((((v * 3) | 0) * 2) % 6)] || '#6b4226', 1);
      return;
    }
    if (o.k === 'wardrobe' && Math.abs(u - 0.5) < 0.03) {
      setC('#4a2e1c', 1);
      return;
    }
    if (o.k === 'bed' && v > 0.3) {
      setC(o.c, 1);
      return;
    }
    if (o.k === 'pingpong' && v > 0.6) {
      setC('#2f7a5a', 1);
      return;
    }
    if (o.k === 'counter' || o.k === 'sink' || o.k === 'stove') {
      setC(v > 0.78 ? '#e9e1cf' : base, 1);
      return;
    }
    setC(base, 1);
    return;
  }
  setC('#888888', 1);
}

function topCol(k, ti, m) {
  if (k === 9) return '#8d9196';
  if (k === 5) return '#a8743f';
  if (k === 6) return '#c99a62';
  if (k === 7) return '#3d97d4';
  if (k === 21) {
    const o = m.objs[m.OI[ti]];
    return FTOP[o.k] || o.c || shade(FURN[o.k][1], 25);
  }
  return '#777777';
}

// Bilder für Figuren, Bäume usw. (aus den 2D-Zeichnungen gemacht)
const SPR = new Map();

function mkSpr(key, w, h, fn, k, oy) {
  let cv = SPR.get(key);
  if (cv) return cv;
  k = k || 3;
  cv = document.createElement('canvas');
  cv.width = w * k;
  cv.height = h * k;
  cv._k = k;
  cv._oy = oy === undefined ? h : oy;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.scale(k, k);
  fn(c);
  SPR.set(key, cv);
  if (SPR.size > 700) SPR.clear();
  return cv;
}
const walkFrame = (ph) =>
  ph === null || ph === undefined || !isFinite(ph)
    ? 0
    : (Math.floor((((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8) + 1;
const sprTree = (t) =>
  mkSpr(
    'tree' + (t.id % 3) + (t.apple ? 1 : 0),
    64,
    100,
    (c) => {
      c.translate(16, 70);
      NOSWAY = true;
      drawTree(c, { x: 0, y: 0, id: t.id % 3, apple: t.apple });
      NOSWAY = false;
    },
    3,
    97,
  );
const sprStump = () =>
  mkSpr('stump', 32, 16, (c) => {
    c.fillStyle = '#6b4226';
    c.fillRect(8, 6, 16, 10);
    c.fillStyle = '#c99a62';
    c.fillRect(8, 4, 16, 4);
  });
const sprPerson = (L, a, ph) => {
  const T2 = Math.PI * 2,
    q = Math.round(((((a - player.ang - Math.PI / 2) % T2) + T2) % T2) / (Math.PI / 8)) % 16,
    fr = walkFrame(ph);
  return mkSpr(
    'p' + q + 'f' + fr + lkKey(L),
    32,
    46,
    (c) => drawPerson(c, 16, 44, L, 'down', fr ? (fr * Math.PI) / 4 : 0, { ang: (q * Math.PI) / 8 }),
    2,
    44,
  );
};
const sprHorse = (body, mane, L, a, ph) => {
  const T2 = Math.PI * 2,
    q = Math.round(((((a - player.ang - Math.PI / 2) % T2) + T2) % T2) / (Math.PI / 8)) % 16,
    fr = walkFrame(ph);
  return mkSpr(
    'h' + q + 'f' + fr + body + mane + lkKey(L),
    80,
    96,
    (c) => drawHorse3D(c, 40, 78, { body, mane }, (q * Math.PI) / 8, fr ? (fr * Math.PI) / 4 : 0, L),
    2,
    78,
  );
};
const sprBike = (col, L, a, ph) => {
  const T2 = Math.PI * 2,
    q = Math.round(((((a - player.ang - Math.PI / 2) % T2) + T2) % T2) / (Math.PI / 8)) % 16,
    fr = walkFrame(ph);
  return mkSpr(
    'b' + q + 'f' + fr + col + lkKey(L),
    56,
    64,
    (c) => drawBike3D(c, 28, 56, { col }, (q * Math.PI) / 8, fr ? (fr * Math.PI) / 4 : 0, L),
    2,
    56,
  );
};
const sprIcon = (k) =>
  mkSpr('i' + k, 24, 26, (c) => {
    if (VEG.has(k)) drawVeg(c, k, 12, 14, 22);
    else spr(c, SP[k].r, SP[k].p, 0, 2, 3);
  });
const sprSprout = (big) =>
  mkSpr('sp' + big, 24, 24, (c) => {
    c.fillStyle = big ? '#4c9d3c' : '#5fb84a';
    c.fillRect(10, big ? 6 : 14, 4, big ? 18 : 10);
    c.fillStyle = '#6cc24a';
    c.fillRect(3, big ? 8 : 14, 7, 5);
    c.fillRect(14, big ? 6 : 12, 7, 5);
  });
const sprStall = (aw, goods, label) =>
  mkSpr('s' + aw.join() + goods.join() + label, 72, 100, (c) => {
    drawStall(c, { x: 0, y: 0 }, aw, goods, label);
  });

function sprStallT(aw, goods, label) {
  return mkSpr(
    'S' + aw.join() + goods.join() + label,
    76,
    104,
    (c) => {
      c.translate(6, 68);
      drawStall(c, { x: 0, y: 0 }, aw, goods, label);
    },
    3,
    100,
  );
}

const RC = document.createElement('canvas'),
  rctx = RC.getContext('2d');
let RIMG = null,
  RB = null,
  RW = 0,
  RH = 0,
  ZB = null;

function render3D() {
  const t0 = performance.now();
  const rw = Math.max(240, Math.min(1100, Math.round(VW * Q3))) & ~1,
    rh = Math.max(120, Math.round((rw * VH) / VW)) & ~1;
  if (!RIMG || Math.abs(rw - RW) > 8 || Math.abs(rh - RH) > 8) {
    RW = rw;
    RH = rh;
    RC.width = RW;
    RC.height = RH;
    RIMG = rctx.createImageData(RW, RH);
    RB = new Uint32Array(RIMG.data.buffer);
    ZB = new Float32Array(RW);
  }
  const inside = !!scene,
    m = inside ? scene.map : null;
  if (m) prep3D(m);
  const gw = inside ? IW : MAP_W,
    gh = inside ? IH : MAP_H;
  const px = player.x,
    py = player.y - 0.12,
    dX = Math.cos(player.ang),
    dY = Math.sin(player.ang),
    PL = 0.72,
    plX = -dY * PL,
    plY = dX * PL;
  const proj = RW / 2 / PL,
    hor = Math.round(
      RH / 2 + PITCH * RH * 0.55 + (shakeT > 0 ? (Math.random() - 0.5) * shakeT * RH * 0.12 : 0),
    ),
    eye =
      (player.jz || 0) / 32 +
      (player.sit ? 0.72 : player.mount ? (player.mount.type === 'horse' ? 1.75 : 1.25) : 1.0) +
      (player.moving
        ? Math.abs(Math.sin(player.phase)) * (player.mount && player.mount.type === 'horse' ? 0.06 : 0.03)
        : 0),
    nt = night();
  const MAXD = inside ? 24 : 30;
  // Himmel / Decke
  const cave = inside && scene && scene.map.cave,
    skyT = cave ? rgb('#14191c') : inside ? rgb('#e9dfcc') : rgb('#5fb2ea'),
    skyB = cave ? rgb('#283035') : inside ? rgb('#d9cdb6') : rgb('#d6eeff'),
    nT = rgb('#070b22'),
    nB = rgb('#1d2552'),
    ni = inside ? 0 : Math.min(1, nt / 0.55);
  const fog = [
    skyB[0] + (nB[0] - skyB[0]) * ni,
    skyB[1] + (nB[1] - skyB[1]) * ni,
    skyB[2] + (nB[2] - skyB[2]) * ni,
  ];
  for (let y = 0; y < Math.min(hor, RH); y++) {
    const a = y / hor;
    let r = skyT[0] + (skyB[0] - skyT[0]) * a,
      g = skyT[1] + (skyB[1] - skyT[1]) * a,
      b = skyT[2] + (skyB[2] - skyT[2]) * a;
    if (ni > 0) {
      r += (nT[0] + (nB[0] - nT[0]) * a - r) * ni;
      g += (nT[1] + (nB[1] - nT[1]) * a - g) * ni;
      b += (nT[2] + (nB[2] - nT[2]) * a - b) * ni;
    }
    const col = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0),
      row = y * RW;
    for (let x = 0; x < RW; x++) RB[row + x] = col;
    if (ni > 0.3 && !inside)
      for (let x = 0; x < RW; x++) {
        const hsh = hh(x + ((player.ang * 60) | 0), y);
        if (hsh % 500 === 0) RB[row + x] = 0xffffffff;
      }
  }
  if (!inside && hor > 0) {
    const hrs = 6 + state.t * 24,
      sunA = ((hrs - 6) / 14) * Math.PI,
      sunE = Math.sin(Math.max(0, Math.min(1, (hrs - 6) / 14)) * Math.PI),
      day = 1 - ni;
    if (!CLOUD) {
      const CW = 2048,
        CHh = 96;
      CLOUD = new Float32Array(CW * CHh);
      const r = rng(9);
      const base = [];
      for (let k = 0; k < 64 * 8; k++) base.push(r());
      const sm = (t) => t * t * (3 - 2 * t);
      for (let y = 0; y < CHh; y++)
        for (let x = 0; x < CW; x++) {
          let v = 0,
            a = 1;
          for (let o = 0; o < 5; o++) {
            const m = 1 << o,
              X2 = (x / 32) * m,
              Y2 = (y / 24) * m + o * 1.7;
            const i0 = Math.floor(X2),
              j0 = Math.floor(Y2),
              fx2 = sm(X2 - i0),
              fy2 = sm(Y2 - j0);
            const g = (i, j) => base[(((i % 64) + 64) % 64) + (((j % 8) + 8) % 8) * 64];
            v +=
              a *
              ((g(i0, j0) * (1 - fx2) + g(i0 + 1, j0) * fx2) * (1 - fy2) +
                (g(i0, j0 + 1) * (1 - fx2) + g(i0 + 1, j0 + 1) * fx2) * fy2);
            a *= 0.5;
          }
          const fade = Math.min(1, y / 10) * Math.min(1, (CHh - y) / 18);
          CLOUD[y * CW + x] = Math.max(0, v / 1.94 - 0.47) * 3.2 * fade;
        }
    }
    const mtn = lerpRGB(rgb('#93acc4'), rgb('#2a3358'), ni),
      hil = lerpRGB(rgb('#7fae6c'), rgb('#1f2c3a'), ni);
    for (let x = 0; x < RW; x++) {
      const cx = (2 * x) / RW - 1,
        th = Math.atan2(dY + plY * cx, dX + plX * cx);
      const cu = (((th / (Math.PI * 2) + 1) % 1) * 2048 + now * 4) % 2048 | 0,
        ch = Math.min(hor, RH) * 0.72;
      if (day > 0.05)
        for (let y = 0; y < ch; y++) {
          const cr = CLOUD[(((y / ch) * 95) | 0) * 2048 + cu],
            cv = cr * day;
          if (cv > 0.02) {
            const i = y * RW + x,
              o = RB[i],
              a = Math.min(0.92, cv),
              dk = Math.max(0, Math.min(1, (cr - 0.55) * 0.9)) * (y / ch),
              cR = 250 - dk * 48,
              cG = 252 - dk * 42,
              cB = 255 - dk * 30;
            RB[i] =
              (255 << 24) |
              ((((o >> 16) & 255) * (1 - a) + cB * a) << 16) |
              ((((o >> 8) & 255) * (1 - a) + cG * a) << 8) |
              ((o & 255) * (1 - a) + cR * a);
          }
        }
      const mh =
          (0.055 + 0.03 * Math.sin(th * 3 + 1) + 0.022 * Math.sin(th * 7 + 2) + 0.01 * Math.sin(th * 17)) *
          RH,
        hh2 = (0.025 + 0.014 * Math.sin(th * 5 + 0.5) + 0.008 * Math.sin(th * 11 + 3)) * RH;
      for (let y = Math.max(0, Math.floor(hor - mh)); y < Math.min(hor, RH); y++) {
        const near = y > hor - hh2,
          c2 = near ? hil : mtn;
        RB[y * RW + x] = (255 << 24) | ((c2[2] | 0) << 16) | ((c2[1] | 0) << 8) | (c2[0] | 0);
      }
    }
    if (sunE > 0 && ni < 0.9) {
      let dA = sunA - -Math.atan2(-dY, dX) * 0 - Math.atan2(dY, dX);
      dA = Math.atan2(Math.sin(sunA - Math.atan2(dY, dX)), Math.cos(sunA - Math.atan2(dY, dX)));
      if (Math.cos(dA) > 0.2) {
        const sx = (RW / 2) * (1 + Math.tan(dA) / PL),
          sy = hor - sunE * RH * 0.38 - RH * 0.04,
          sr = RH * 0.045;
        for (let y = Math.max(0, Math.floor(sy - sr * 2)); y < Math.min(hor, sy + sr * 2); y++)
          for (let x = Math.max(0, Math.floor(sx - sr * 2)); x < Math.min(RW, sx + sr * 2); x++) {
            const d = Math.hypot(x - sx, y - sy) / sr;
            if (d < 2) {
              const i = y * RW + x,
                o = RB[i],
                a = d < 1 ? 1 : (2 - d) * 0.35;
              const sc = hrs < 9 || hrs > 17 ? [255, 190, 110] : [255, 246, 200];
              RB[i] =
                (255 << 24) |
                ((((o >> 16) & 255) * (1 - a) + sc[2] * a) << 16) |
                ((((o >> 8) & 255) * (1 - a) + sc[1] * a) << 8) |
                ((o & 255) * (1 - a) + sc[0] * a);
            }
          }
      }
    }
  }
  // Boden
  const r0x = dX - plX,
    r0y = dY - plY,
    r1x = dX + plX,
    r1y = dY + plY;
  const BE = state.bridge || inside ? 0 : bridgeEnd();
  for (let y = Math.max(0, hor); y < RH; y++) {
    const rd = (eye * proj) / (y - hor + 0.5);
    let fx = px + rd * r0x,
      fy = py + rd * r0y;
    const sx = (rd * (r1x - r0x)) / RW,
      sy = (rd * (r1y - r0y)) / RW;
    const fogA = inside ? 0 : Math.min(0.85, Math.pow(Math.min(1, rd / MAXD), 1.6));
    const row = y * RW;
    for (let x = 0; x < RW; x++, fx += sx, fy += sy) {
      const tx = Math.floor(fx),
        ty = Math.floor(fy);
      let r, g, b;
      if (tx < 0 || ty < 0 || tx >= gw || ty >= gh) {
        r = 60;
        g = 110;
        b = 50;
      } else {
        const ti = ty * gw + tx;
        let c,
          mul = 1;
        if (inside) {
          c = m.FC[ti];
          const t = m.T[ti];
          if (t === 7) {
            mul =
              0.78 +
              0.14 * Math.sin(fx * 3.1 + Math.sin(fy * 2.3)) * Math.sin(fy * 2.7 + fx * 0.7) +
              0.08 * Math.sin(fx * 17 + fy * 13);
          } else if (t === 1 && (fy * 2) % 1 < 0.07) mul = 0.88;
          else if (t === 2 && (((fx * 2) | 0) + ((fy * 2) | 0)) & 1) mul = 0.9;
          else if (t === 3 && ((fx * 2) % 1 < 0.06 || (fy * 2) % 1 < 0.06)) mul = 0.88;
        } else if (GP && !PLOTG[ti]) {
          const v = GP[((fy * GPT) | 0) * GPW + ((fx * GPT) | 0)];
          c = null;
          r = v & 255;
          g = (v >> 8) & 255;
          b = (v >> 16) & 255;
          if ((ground[ti] === 3 || ground[ti] === 9) && !(ty >= 28 && ty < 30 && fx < BE)) {
            const m2 =
              0.9 +
              0.08 * Math.sin(now * 2.2 + fy * 4.5 + fx * 1.7) +
              0.05 * Math.sin(now * 3.1 - fy * 7 + fx * 3) +
              (Math.sin(now * 2.6 + fy * 11 - fx * 5) > 0.94 ? 0.28 : 0);
            r *= m2;
            g *= m2;
            b *= m2;
          }
        } else {
          const gt = ground[ti];
          c = GC[gt];
          if (PLOTG[ti]) c = PLOTC;
          if (gt === 2 && ((fx * 2) % 1 < 0.06 || (fy * 2) % 1 < 0.06)) mul = 0.88;
          else if (gt === 3) {
            if (Math.sin(now * 2 + fy * 3 + fx * 1.3) > 0.85) mul = 1.25;
          } else if (gt === 7 && (fx * 5) % 1 < 0.14) mul = 0.8;
          else {
            const n = hh((fx * 8) | 0, (fy * 8) | 0) & 15;
            mul = 0.95 + n * 0.006;
          }
        }
        if (c) {
          r = c[0] * mul;
          g = c[1] * mul;
          b = c[2] * mul;
        }
        const am = inside ? m.AOM[ti] : AOM[ti];
        if (am) {
          const ux = fx - tx,
            uy = fy - ty;
          let o = 0;
          if (am & 1 && ux < 0.35) o = (0.35 - ux) / 0.35;
          if (am & 2 && ux > 0.65) o = Math.max(o, (ux - 0.65) / 0.35);
          if (am & 4 && uy < 0.35) o = Math.max(o, (0.35 - uy) / 0.35);
          if (am & 8 && uy > 0.65) o = Math.max(o, (uy - 0.65) / 0.35);
          const q = 1 - o * o * 0.45;
          r *= q;
          g *= q;
          b *= q;
        }
      }
      if (fogA > 0) {
        r += (fog[0] - r) * fogA;
        g += (fog[1] - g) * fogA;
        b += (fog[2] - b) * fogA;
      }
      RB[row + x] =
        (255 << 24) |
        ((b > 255 ? 255 : b | 0) << 16) |
        ((g > 255 ? 255 : g | 0) << 8) |
        (r > 255 ? 255 : r | 0);
    }
  }
  // Wände (Strahlen)
  const KG = inside ? m.K : WK,
    hits = [];
  const put = (x, y, r, g, b, fa) => {
    if (fa > 0) {
      r += (fog[0] - r) * fa;
      g += (fog[1] - g) * fa;
      b += (fog[2] - b) * fa;
    }
    RB[y * RW + x] =
      (255 << 24) |
      ((b > 255 ? 255 : b | 0) << 16) |
      ((g > 255 ? 255 : g | 0) << 8) |
      (r > 255 ? 255 : r | 0);
  };
  // Haus mit dreieckigem Satteldach: Giebel an den Seiten, schräge Dachflächen oben
  function gableColumn(x, rx, ry, d1, k, ti, face, wc, u, sd) {
    const G2 = gableOf(k, ti),
      cy = (G2.y0 + G2.y1) / 2,
      half = (G2.y1 - G2.y0) / 2;
    const hAt = (yy) => G2.Hw + G2.Hr * Math.max(0, 1 - Math.abs(yy - cy) / half);
    const tx1 = rx > 0 ? (G2.x1 - px) / rx : (G2.x0 - px) / rx,
      ty1 = ry > 0 ? (G2.y1 - py) / ry : (G2.y0 - py) / ry,
      tExit = Math.min(isFinite(tx1) ? tx1 : 1e9, isFinite(ty1) ? ty1 : 1e9);
    const fa0 = Math.min(0.85, Math.pow(Math.min(1, d1 / MAXD), 1.6)),
      yB = hor + (eye * proj) / d1,
      pu = proj / d1;
    const hy = py + d1 * ry,
      hEntry = sd === 0 ? hAt(hy) : G2.Hw;
    let sh = FACEL[face];
    {
      const n1 = sd === 1 ? ti - 1 : ti - gw,
        n2 = sd === 1 ? ti + 1 : ti + gw;
      if ((u < 0.04 && KG[n1] !== k) || (u > 0.96 && KG[n2] !== k)) sh *= 0.7;
    }
    const yTop = hor - (hEntry - eye) * pu;
    for (let y = Math.max(0, Math.floor(yTop)); y < Math.min(RH, yB); y++) {
      const v = (yB - y) / pu;
      if (v > G2.Hw) {
        const gv = Math.abs(hy - cy) < 0.22 && Math.abs(v - (G2.Hw + G2.Hr * 0.42)) < 0.16;
        if (gv) setC('#26304a', 1);
        else if (G2.sty === 2 && (((v - G2.Hw) * 6) % 1 < 0.12 || Math.abs(hy - cy) < 0.05))
          setC('#5a3a22', 1);
        else if (G2.st && G2.st !== 'classic' && styleC(G2.st, G2.hs, wc, v)) {
        } else if (G2.sty === 1) {
          const row = (v * 14) | 0;
          setC(G2.wall, (v * 14) % 1 < 0.14 ? 1.08 : 0.74 + (hh(row, (wc * 5) | 0) % 9) * 0.025);
        } else setC(G2.wall, 0.97);
      } else wallCol(k, ti, face, wc, u, v, null);
      const ao = v < 0.3 ? 0.68 + v * 1.07 : 1;
      put(x, y, CC[0] * sh * ao, CC[1] * sh * ao, CC[2] * sh * ao, fa0);
    }
    let ymin = Math.max(0, Math.floor(yTop));
    const R = rgb(G2.roof);
    for (let t = d1 + 0.004; t < tExit && ymin > 0; t += Math.max(0.025, t * 0.012)) {
      const sx = px + rx * t,
        sy = py + ry * t,
        hgt = hAt(sy),
        ys = Math.floor(hor - ((hgt - eye) * proj) / t);
      if (ys < ymin) {
        const a = Math.abs(sy - cy) / half,
          south = sy > cy,
          row = (a * 7) | 0;
        let mm = (south ? 0.98 : 0.66) * (0.9 + (hh(row, (sx * 3 + (row % 2) * 0.5) | 0) % 8) * 0.02);
        if ((a * 7) % 1 > 0.82) mm *= 0.78;
        if ((sx * 3 + (row % 2) * 0.5) % 1 < 0.06) mm *= 0.8;
        if (a < 0.05) mm *= 0.7;
        let col = R;
        if (a > 0.95) {
          col = rgb('#8f9aa3');
          mm = south ? 1 : 0.7;
        }
        const fa = Math.min(0.85, Math.pow(Math.min(1, t / MAXD), 1.6));
        for (let y = Math.max(0, ys); y < ymin; y++) put(x, y, col[0] * mm, col[1] * mm, col[2] * mm, fa);
        ymin = Math.max(0, ys);
      }
    }
  }
  for (let x = 0; x < RW; x++) {
    const cx = (2 * x) / RW - 1,
      rx = dX + plX * cx,
      ry = dY + plY * cx;
    let mx = Math.floor(px),
      my = Math.floor(py);
    const ddx = Math.abs(1 / rx),
      ddy = Math.abs(1 / ry);
    const stx = rx < 0 ? -1 : 1,
      sty = ry < 0 ? -1 : 1;
    let sdx = rx < 0 ? (px - mx) * ddx : (mx + 1 - px) * ddx,
      sdy = ry < 0 ? (py - my) * ddy : (my + 1 - py) * ddy;
    hits.length = 0;
    ZB[x] = MAXD;
    let side = 0;
    for (let s = 0; s < 80; s++) {
      if (sdx < sdy) {
        sdx += ddx;
        mx += stx;
        side = 0;
      } else {
        sdy += ddy;
        my += sty;
        side = 1;
      }
      if (mx < 0 || my < 0 || mx >= gw || my >= gh) break;
      const ti = my * gw + mx,
        k = KG[ti];
      if (!k) continue;
      const d1 = side === 0 ? sdx - ddx : sdy - ddy;
      if (d1 > MAXD) break;
      const d2 = Math.min(sdx, sdy);
      let h = inside ? (k === 20 ? 2 : FURN[m.objs[m.OI[ti]].k][0]) : HK[k];
      if (!inside && (k === 1 || k === 2 || k === 3 || k === 8)) {
        const gg = gableOf(k, ti);
        h = gg.Hw + gg.Hr;
      }
      const wc = side === 0 ? py + d1 * ry : px + d1 * rx,
        face = side === 0 ? (stx > 0 ? 'w' : 'e') : sty > 0 ? 'n' : 's';
      hits.push([d1, d2, k, ti, face, wc, h, side]);
      if (h >= 1.9) {
        ZB[x] = d1;
        break;
      }
    }
    for (let i = hits.length - 1; i >= 0; i--) {
      const [d1, d2, k, ti, face, wc, h, sd] = hits[i];
      const u = wc - Math.floor(wc);
      if (!inside && (k === 1 || k === 2 || k === 3 || k === 8)) {
        gableColumn(x, rx, ry, d1, k, ti, face, wc, u, sd);
        continue;
      }
      const fogA = inside ? 0 : Math.min(0.85, Math.pow(Math.min(1, d1 / MAXD), 1.6));
      if (h < eye) {
        const tc = rgb(topCol(k, ti, m));
        const yN = Math.min(RH, hor + ((eye - h) * proj) / d1),
          yF = Math.max(0, hor + ((eye - h) * proj) / d2);
        const col =
          (255 << 24) |
          (((tc[2] + (fog[2] - tc[2]) * fogA) | 0) << 16) |
          (((tc[1] + (fog[1] - tc[1]) * fogA) | 0) << 8) |
          ((tc[0] + (fog[0] - tc[0]) * fogA) | 0);
        for (let y = Math.floor(yF); y < yN; y++) RB[y * RW + x] = col;
      }
      const yT = hor - ((h - eye) * proj) / d1,
        yB = hor + (eye * proj) / d1,
        span = yB - yT;
      let sh = FACEL[face];
      {
        const n1 = sd === 1 ? ti - 1 : ti - gw,
          n2 = sd === 1 ? ti + 1 : ti + gw;
        if ((u < 0.04 && KG[n1] !== k) || (u > 0.96 && KG[n2] !== k)) sh *= 0.7;
      }
      for (let y = Math.max(0, Math.floor(yT)); y < Math.min(RH, yB); y++) {
        const v = ((yB - y) / span) * h;
        wallCol(k, ti, face, wc, u, v, m);
        const ao = v < 0.3 ? 0.68 + v * 1.07 : 1;
        let r = CC[0] * sh * ao,
          g = CC[1] * sh * ao,
          b = CC[2] * sh * ao;
        if (fogA > 0) {
          r += (fog[0] - r) * fogA;
          g += (fog[1] - g) * fogA;
          b += (fog[2] - b) * fogA;
        }
        RB[y * RW + x] =
          (255 << 24) |
          ((b > 255 ? 255 : b | 0) << 16) |
          ((g > 255 ? 255 : g | 0) << 8) |
          (r > 255 ? 255 : r | 0);
      }
    }
  }
  rctx.putImageData(RIMG, 0, 0);
  rctx.imageSmoothingEnabled = true;
  rctx.imageSmoothingQuality = 'high';
  // Figuren und Bäume
  const S3 = [];
  const add = (x, y, cv, sc, ns) => S3.push({ x, y, cv, sc: sc || 1, ns });
  if (!inside) {
    for (const rk of ROCKS)
      add(
        rk.x + 0.5,
        rk.y + 0.7,
        mkSpr(
          'rock' + rk.v + ((state.mined || []).includes(rk.id) ? 'm' : ''),
          40,
          30,
          (c) => {
            c.translate(-rk.x * TILE - 16 + 20, -rk.y * TILE - 26 + 28);
            drawRock(c, rk);
          },
          3,
          28,
        ),
      );
    for (const t of TREES) {
      if (Math.abs(t.x - px) > MAXD || Math.abs(t.y - py) > MAXD) continue;
      add(t.x + 0.5, t.y + 0.6, state.chopped.includes(t.id) ? sprStump() : sprTree(t));
    }
    horses.forEach((h) => {
      if (!(player.mount && player.mount.o === h))
        add(
          h.x,
          h.y,
          sprHorse(h.body, h.mane, null, h.rang ?? h.dir ?? Math.PI, h.wait > 0 ? null : h.phase),
        );
    });
    bikes.forEach((b) => {
      if (!(player.mount && player.mount.o === b)) add(b.x, b.y, sprBike(b.col, null, b.ang ?? 0, null));
    });
    sellers2.forEach((s, i) => {
      if (i !== MYSTALL && s.state !== 'inside')
        add(
          s.x,
          s.y - 0.4,
          sprPerson(
            s.look,
            s.state === 'stall' ? Math.PI / 2 : (s.rang ?? s.dir),
            s.state === 'stall' ? null : s.phase,
          ),
        );
    });
    buyers.forEach((b) =>
      add(b.x, b.y, sprPerson(b.look, b.rang ?? b.dir ?? 0, b.state === 'buy' ? null : b.phase)),
    );
    PLOTS.forEach((p, i) => {
      const s = state.plots[i];
      if (!s.c) return;
      const g = Math.min(1, s.g / CROPS[s.c].grow),
        q = Math.round(g * 4);
      add(
        p.x + 0.5,
        p.y + 0.6,
        mkSpr(
          'crop' + s.c + q,
          32,
          32,
          (c) => {
            const sv = now;
            now = 0;
            drawCrop(c, s.c, 16, 30, Math.max(0.12, q / 4), 1);
            now = sv;
          },
          3,
          30,
        ),
        1,
      );
    });
    STALLS1.forEach((s, i) => add(s.x + 1, s.y + 1, sprStallT(TRADES[i].aw, psGoods(i), psLabel(i))));
    {
      const be = bridgeEnd();
      if (bridgeWood() > 0)
        for (let x = BX0 + 0.06; x <= be - 0.05; x += 1) {
          add(x, 28.1, sprBridgePost(), 1, 1);
          add(x, 29.92, sprBridgePost(), 1, 1);
        }
      if (bridgeWood() >= BRIDGE_WOOD) {
        add(51.94, 28.1, sprBridgePost(), 1, 1);
        add(51.94, 29.92, sprBridgePost(), 1, 1);
      }
    }
    if (state.harbor)
      add(
        3.7,
        5.75,
        mkSpr(
          'boat3d',
          70,
          30,
          (c) => {
            const g = c.createLinearGradient(0, 10, 0, 26);
            g.addColorStop(0, '#c98a52');
            g.addColorStop(1, '#5a3418');
            c.fillStyle = g;
            c.strokeStyle = '#3a2414';
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(2, 10);
            c.lineTo(68, 8);
            c.quadraticCurveTo(62, 24, 50, 26);
            c.lineTo(14, 26);
            c.quadraticCurveTo(5, 22, 2, 10);
            c.closePath();
            c.fill();
            c.stroke();
            c.strokeStyle = 'rgba(60,30,10,.45)';
            c.lineWidth = 0.8;
            for (const y of [15, 20]) {
              c.beginPath();
              c.moveTo(5, y);
              c.lineTo(63, y - 1);
              c.stroke();
            }
            c.fillStyle = '#e8d6b0';
            c.fillRect(3, 9, 64, 2.2);
            c.fillStyle = '#2e7fb0';
            c.fillRect(2, 11, 4, 4);
            c.strokeStyle = '#a8743f';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(30, 10);
            c.lineTo(42, 2);
            c.stroke();
            c.fillStyle = 'rgba(255,255,255,.55)';
            c.fillRect(10, 26, 46, 1.5);
          },
          3,
          27,
        ),
        1,
        1,
      );
    add(WELL.x + 1, WELL.y + 1.02, sprWellTop(), 1, 1);
    add(WELL2.x + 1, WELL2.y + 1.02, sprWellTop(), 1, 1);
    STALLS2.forEach((s, i) => {
      const me = i === MYSTALL,
        seed = i < 3;
      add(
        s.x + 1,
        s.y + 1,
        sprStallT(
          me ? ['#3f8f3a', '#fff8e6'] : sellers2[i].aw,
          me
            ? SELL.filter((k) => state.stall[k] > 0).slice(0, 3)
            : seed
              ? Object.keys(SEEDSHOP[i].get)
              : sellers2[i].goods,
          me ? 'Dein Stand' : seed ? 'Samen' : '',
        ),
      );
    });
  }
  const sid = sceneId();
  for (const o of others.values()) {
    if (o.sc !== sid || o.sl) continue;
    if (inGrotto() && o.mt === '') {
      add(o.x, o.y, sprFighter(o.lk, o.rang ?? o.a ?? FACEANG[o.f], o.mv ? o.phase : null, o.sw ? 3 : 0));
      continue;
    }
    add(
      o.x,
      o.y,
      o.mt === 'horse'
        ? sprHorse(o.mc, '#3b2414', o.lk, o.rang ?? o.a ?? 0, o.mv ? o.phase : null)
        : o.mt === 'bike'
          ? sprBike(o.mc, o.lk, o.rang ?? o.a ?? 0, o.mv ? o.phase : null)
          : sprPerson(o.lk, o.rang ?? o.a ?? FACEANG[o.f], o.mv ? o.phase : null),
    );
  }
  if (inside && scene.map.cave)
    for (const o of scene.map.objs)
      if (o.k === 'torch') {
        const fr = ((now * 10 + o.x) | 0) % 3;
        add(
          o.x + 0.5 + (o.x < 3 ? -0.35 : o.x > 17 ? 0.35 : 0),
          o.y + 0.5 + (o.y < 2 ? -0.35 : o.y > 10 ? 0.35 : 0),
          sprTorch(fr),
          1.1,
          1,
        );
      }
  if (FIGHT.on && FIGHT.foe === 'bot' && inGrotto()) {
    const b = FIGHT.bot;
    add(b.x, b.y, sprFighter(BOTLOOK, b.ang, b.mv ? b.phase : null, botPose(b)), 1.05);
  }
  const inv = 1 / (plX * dY - dX * plY);
  S3.forEach((s) => {
    const ax = s.x - px,
      ay = s.y - py;
    s.tx = inv * (dY * ax - dX * ay);
    s.ty = inv * (-plY * ax + plX * ay);
  });
  S3.sort((a, b) => b.ty - a.ty);
  for (const s of S3) {
    if (s.ty < 0.2 || s.ty > MAXD) continue;
    const cv = s.cv,
      scx = (RW / 2) * (1 + s.tx / s.ty),
      hp = ((cv.height / (32 * cv._k)) * s.sc * proj) / s.ty,
      wp = ((cv.width / (32 * cv._k)) * s.sc * proj) / s.ty,
      bot = hor + (eye * proj) / s.ty + (((cv.height / cv._k - cv._oy) / 32) * s.sc * proj) / s.ty,
      top = bot - hp,
      x0 = scx - wp / 2;
    if (x0 > RW || x0 + wp < 0) continue;
    const fogA = inside ? 0 : Math.min(0.85, Math.pow(Math.min(1, s.ty / MAXD), 1.6));
    {
      const gb = hor + (eye * proj) / s.ty,
        cxs = Math.max(0, Math.min(RW - 1, scx | 0));
      if (!s.ns && s.ty < ZB[cxs]) {
        rctx.fillStyle = `rgba(0,0,0,${0.28 * (1 - fogA)})`;
        rctx.beginPath();
        rctx.ellipse(scx, gb, wp * 0.32, Math.max(1, wp * 0.07), 0, 0, 7);
        rctx.fill();
      }
    }
    const xa = Math.max(0, Math.floor(x0)),
      xb = Math.min(RW, Math.ceil(x0 + wp));
    let run = -1;
    for (let sx = xa; sx <= xb; sx++) {
      const vis = sx < xb && s.ty < ZB[sx];
      if (vis && run < 0) run = sx;
      else if (!vis && run >= 0) {
        const s0 = ((run - x0) / wp) * cv.width,
          s1 = ((sx - x0) / wp) * cv.width;
        rctx.drawImage(
          cv,
          Math.max(0, s0),
          0,
          Math.min(cv.width, s1) - Math.max(0, s0),
          cv.height,
          run,
          top,
          sx - run,
          hp,
        );
        run = -1;
      }
    }
    if (fogA > 0.05) {
      rctx.fillStyle = `rgba(${fog[0] | 0},${fog[1] | 0},${fog[2] | 0},${fogA * 0.8})`;
    }
  }
  if (player.mount && player.mount.type === 'bike') bikeHUD(rctx, RW, RH);
  if (player.mount && player.mount.type === 'horse') {
    const h = player.mount.o,
      sc = RH / 70,
      bob = player.moving ? Math.abs(Math.sin(player.phase)) * sc * 1.6 : 0;
    renderParts(
      rctx,
      RW / 2,
      RH * 1.38 + bob + PITCH * RH * 0.55,
      horseParts(h, 0).slice(5, 10),
      -Math.PI / 2,
      sc,
    );
  }
  // Licht
  let dark = inside ? (hasPower(scene.house.n) ? nt * 0.4 : Math.min(0.85, nt * 1.5)) : nt * 0.9;
  if (dark > 0) {
    rctx.fillStyle = `rgba(10,14,40,${dark})`;
    rctx.fillRect(0, 0, RW, RH);
  }
  // kleines Fadenkreuz
  const ch = Math.max(2, (RW / 320) | 0);
  rctx.fillStyle = 'rgba(255,248,230,.85)';
  rctx.fillRect(RW / 2 - ch / 2, RH / 2 - ch * 2, ch, ch * 4);
  rctx.fillRect(RW / 2 - ch * 2, RH / 2 - ch / 2, ch * 4, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(RC, 0, 0, cv.width, cv.height);
  if (!inside) grade(ctx);
  drawFPSword(ctx);
  // Bildqualität an die Geschwindigkeit des Geräts anpassen
  q3avg = q3avg * 0.9 + (performance.now() - t0) * 0.1;
  if (q3avg > 18 && Q3 > 0.4) {
    Q3 -= 0.05;
    q3avg = 13;
  } else if (q3avg < 10 && Q3 < 1) {
    Q3 += 0.05;
    q3avg = 13;
  }
}

function drawDots(c, s) {
  const r = 7 / s,
    fs = 12 / s;
  c.textAlign = 'center';
  c.font = `bold ${fs}px "Nunito", sans-serif`;
  const dot = (x, y, col, nm, pulse) => {
    const X = x * TILE,
      Y = y * TILE;
    if (pulse) {
      c.fillStyle = 'rgba(229,72,77,.35)';
      c.beginPath();
      c.arc(X, Y, r * (1.6 + Math.sin(now * 4) * 0.5), 0, 7);
      c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(X, Y, r + 2 / s, 0, 7);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.arc(X, Y, r, 0, 7);
    c.fill();
    if (nm) {
      const tw = c.measureText(nm).width + 8 / s;
      c.fillStyle = 'rgba(46,34,22,.8)';
      c.fillRect(X - tw / 2, Y - r - fs * 1.5, tw, fs * 1.3);
      c.fillStyle = '#fff8e6';
      c.fillText(nm, X, Y - r - fs * 0.5);
    }
  };
  const sid = sceneId();
  for (const o of others.values()) if (o.sc === sid) dot(o.x, o.y, '#3d6fb0', o.nm || 'Jemand', false);
  dot(player.x, player.y, '#e5484d', state.name || 'Du', true);
}

function setView(v) {
  view = v;
  document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
  if (v !== '3d' && document.pointerLockElement === cv && document.exitPointerLock)
    document.exitPointerLock();
  if (v === '3d')
    toast(
      '<b>3D-Sicht:</b> Klick ins Bild und schau dich mit der Maus um (Esc gibt die Maus wieder frei). Am Touchpad: mit zwei Fingern wischen. W/S oder ↑/↓ laufen, A/D seitwärts, ←/→ drehen, E benutzen. Am Handy: Steuerkreuz zum Laufen, über das Bild wischen zum Umsehen.',
      6500,
    );
  if (v === 'map') toast('<b>Karte:</b> Du bist der rote Punkt, andere Spieler sind blau.', 3000);
}

function render() {
  if (view === '3d' && !(scene && scene.sea)) render3D();
  else world();
}

// Mit der Maus umsehen: ins Bild klicken (Maus wird gefangen, Esc gibt sie frei) oder mit gedrückter Taste ziehen
let dragId = null,
  lastPX = 0,
  lastPY = 0;

function look(dx, dy) {
  player.ang += dx * 0.0032;
  PITCH = Math.max(-0.7, Math.min(0.7, PITCH - dy * 0.0028));
}
cv.addEventListener('pointerdown', (e) => {
  if (view !== '3d' || !modal.hidden) return;
  dragId = e.pointerId;
  lastPX = e.clientX;
  lastPY = e.clientY;
  if (e.pointerType === 'mouse' && document.pointerLockElement !== cv && cv.requestPointerLock) {
    try {
      const r = cv.requestPointerLock();
      if (r && r.catch) r.catch(() => {});
    } catch (err) {}
  }
});
addEventListener('pointermove', (e) => {
  if (view !== '3d') return;
  if (document.pointerLockElement === cv) {
    look(e.movementX || 0, e.movementY || 0);
    return;
  }
  if (e.pointerId === dragId) {
    look(e.clientX - lastPX, e.clientY - lastPY);
    lastPX = e.clientX;
    lastPY = e.clientY;
  }
});
addEventListener('pointerup', (e) => {
  if (e.pointerId === dragId) dragId = null;
});

// Touchpad: mit zwei Fingern wischen dreht die Sicht
cv.addEventListener(
  'wheel',
  (e) => {
    if (view !== '3d' || !modal.hidden) return;
    e.preventDefault();
    if (e.ctrlKey) return;
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    look(e.deltaX * k * 0.8, e.deltaY * k * 0.8);
  },
  { passive: false },
);
addEventListener('pointercancel', (e) => {
  if (e.pointerId === dragId) dragId = null;
});
