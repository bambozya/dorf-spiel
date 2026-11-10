// ================= Start =================
let last = 0,
  saveT = 0;

function loop(ts) {
  if (banned) {
    return;
  }
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  FDT = dt;
  last = ts;
  update(dt);
  saveT += dt;
  if (saveT > 4) {
    saveT = 0;
    save();
  }
  render();
  if (tv) tvDraw(dt);
  hudTick();
  requestAnimationFrame(loop);
}

function start(data) {
  load(data);
  buildWorld();
  applyGarages();
  build3D();
  if (state.bridge) applyBridge();
  buildGround();
  initEntities();
  resize();
  $('coinimg').src = iconURL('coin');
  renderHUD();
  // Erfolge, die schon vor dem Fernseher passiert sind
  if (state.axe) moment('tools', 'Axt und Säge aus der Werkstatt geholt.', 'axe', 1);
  if (state.stats.harvest > 0) moment('harvest1', 'Deine allererste Ernte!', 'carrot', 1);
  if (state.bridge) moment('bridge', 'Die Brücke über den Fluss gebaut!', 'bridge', 1);
  if (state.stats.sold > 0) moment('sale1', 'Der erste Kunde hat an deinem Stand gekauft!', 'coin', 1);
  for (const n of [5, 6]) {
    if (state.up[n].p) moment('p' + n, `Haus ${n} hat jetzt Strom!`, 'bolt', 1);
    if (state.up[n].w) moment('w' + n, `Haus ${n} hat jetzt Wasser!`, 'drop', 1);
  }
  for (const [n, h] of Object.entries(state.homes || {}))
    for (let e = 1; e <= (h.extra || 0); e++)
      moment('floor' + n + '_' + e, `Haus ${n} um eine Etage größer gebaut!`, 'house', 1);
  if (!state.created) openLook(true);
  requestAnimationFrame((t) => {
    last = t;
    requestAnimationFrame(loop);
  });
}

try {
  window.claude?.hot?.snapshot?.(() => {
    save();
    return { state: state };
  });
} catch (e) {}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
