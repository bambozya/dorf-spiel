// ================= Garagen =================
const GARAGES = {
  1: { x: 9, y: 23 },
  2: { x: 9, y: 15 },
  3: { x: 22, y: 37 },
  4: { x: 18, y: 15 },
  5: { x: 36, y: 21 },
  6: { x: 36, y: 37 },
};
const GCOST = { coins: 60, plank: 20, stone: 10 };
const hasGarage = (n) => !!(state.homes && state.homes[n] && state.homes[n].garage);

function applyGarages() {
  for (const [n, g] of Object.entries(GARAGES))
    for (let j = g.y; j < g.y + 2; j++)
      for (let i = g.x; i < g.x + 3; i++) solid[tileIndex(i, j)] = hasGarage(+n) ? 1 : 0;
}

function buildGarage(h) {
  const n = h.n;
  if (hasGarage(n)) return;
  if (!hasTool('hammer')) return toast('Zum Bauen brauchst du einen <b>Hammer</b> aus der Werkstatt.');
  if (state.coins < GCOST.coins || state.inv.plank < GCOST.plank || state.inv.stone < GCOST.stone)
    return toast(
      `Für eine Garage brauchst du ${GCOST.coins} Glücksmünzen, ${GCOST.plank} Bretter und ${GCOST.stone} Steine.`,
    );
  const g = GARAGES[n];
  if (!scene && player.x > g.x - 0.4 && player.x < g.x + 3.4 && player.y > g.y - 0.2 && player.y < g.y + 2.3)
    return toast('Geh kurz zur Seite, du stehst genau da, wo die Garage hin soll.');
  state.coins -= GCOST.coins;
  state.inv.plank -= GCOST.plank;
  state.inv.stone -= GCOST.stone;
  homeOf(n).garage = 1;
  applyGarages();
  build3D();
  chips(g.x + 1.5, g.y + 1.5, 20, ['#c9c2b4', '#a8743f', '#9a9384'], 20);
  moment('garage', 'Eine eigene Garage gebaut!', 'house');
  toast(`<b>Haus ${n} hat jetzt eine Garage!</b> Sie steht neben dem Haus. Mit E öffnest du das Tor.`, 5000);
  changed();
}

function garageCv(n, open) {
  const hs = HOUSES[n - 1],
    S = houseCfg(n).base,
    key = 'g' + n + S + (open ? 1 : 0);
  if (HCV[key]) return HCV[key];
  const w = 96,
    h = 64,
    cv = document.createElement('canvas'),
    K = 2;
  cv.width = (w + 20) * K;
  cv.height = (h + 30) * K;
  const c = cv.getContext('2d');
  c.scale(K, K);
  const X = 10,
    Y = 22,
    wt = Y + h * 0.42,
    bot = Y + h,
    r = rng(n * 71 + 3);
  paintWall(c, S, X, wt, bot, w, hs.wall, houseStyle(hs, n), r, n);
  c.fillStyle = isMod(S) ? '#4a4f55' : '#8f897e';
  c.fillRect(X - 1, bot - 5, w + 2, 5);
  const gx = X + 12,
    gw = w - 24,
    gy = wt + 6,
    gh = bot - gy - 3;
  c.fillStyle = 'rgba(0,0,0,.35)';
  c.fillRect(gx - 2, gy - 2, gw + 4, gh + 3);
  if (open) {
    const g = c.createLinearGradient(0, gy, 0, gy + gh);
    g.addColorStop(0, '#15181c');
    g.addColorStop(1, '#33383e');
    c.fillStyle = g;
    c.fillRect(gx, gy, gw, gh);
    c.fillStyle = '#6b4226';
    c.fillRect(gx + 4, gy + 6, 22, 2);
    c.fillRect(gx + 4, gy + 14, 22, 2);
    c.fillStyle = '#c9d1da';
    c.fillRect(gx + 7, gy + 2, 3, 4);
    c.fillStyle = '#e5484d';
    c.fillRect(gx + 13, gy + 1, 5, 5);
    c.fillStyle = '#3f9a3a';
    c.fillRect(gx + 20, gy + 10, 4, 4);
    c.fillStyle = '#e5484d';
    c.fillRect(gx + gw - 30, gy + gh - 10, 18, 7);
    c.fillStyle = '#2b2b2b';
    c.fillRect(gx + gw - 28, gy + gh - 3, 4, 3);
    c.fillRect(gx + gw - 17, gy + gh - 3, 4, 3);
    c.fillStyle = '#c9d1da';
    c.fillRect(gx + gw - 14, gy + gh - 18, 2, 10);
    c.fillStyle = isMod(S) ? '#c9ced3' : '#f4efe4';
    c.fillRect(gx, gy, gw, 4);
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.fillRect(gx, gy + 4, gw, 2);
  } else if (S === 'wood' || S === 'log' || S === 'stone') {
    for (let x = gx; x < gx + gw; x += 6) {
      c.fillStyle = shade('#8a5a35', -8 + Math.floor(r() * 18));
      c.fillRect(x, gy, 5, gh);
      c.fillStyle = '#5a3a22';
      c.fillRect(x + 5, gy, 1, gh);
    }
    c.fillStyle = '#5a3a22';
    c.fillRect(gx, gy + 4, gw, 2);
    c.fillRect(gx, gy + gh - 6, gw, 2);
    c.fillStyle = '#2b2b2b';
    c.fillRect(gx + gw / 2 - 1, gy + gh / 2 - 2, 2, 5);
  } else {
    const pc = isMod(S) ? '#c9ced3' : S === 'brick' ? '#3a3f45' : '#f4efe4';
    for (let y = gy; y < gy + gh; y += 5) {
      c.fillStyle = pc;
      c.fillRect(gx, y, gw, 4.2);
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.fillRect(gx, y + 4.2, gw, 0.8);
    }
    c.fillStyle = 'rgba(255,255,255,.25)';
    c.fillRect(gx, gy, gw, 1);
    c.fillStyle = '#8f9aa3';
    c.fillRect(gx + gw / 2 - 6, gy + gh - 5, 12, 1.6);
  }
  c.fillStyle = '#a8a193';
  c.fillRect(gx - 3, bot - 3, gw + 6, 3);
  drawRoof(c, X, Y, wt + 4, w, S, SDEF[S].rc || hs.roof, r, false);
  if (S === 'modern' || S === 'brick') {
    c.fillStyle = '#2b2f33';
    c.fillRect(X + w - 8, wt + 8, 3, 8);
    c.fillStyle = '#fff3c0';
    c.fillRect(X + w - 8, wt + 8, 3, 2);
  }
  return (HCV[key] = cv);
}

function drawGarage(c, n) {
  const g = GARAGES[n],
    X = g.x * TILE,
    Y = g.y * TILE;
  castShadow(c, X, Y, 96, Y + 64);
  c.drawImage(garageCv(n, state.homes[n].gOpen), X - 10, Y - 22, 116, 94);
}
