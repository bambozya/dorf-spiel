// ================= Häuser: was einer baut, sehen alle =================
// Etagen, Garage (samt Tor), Aussehen sowie Strom und Wasser eines Hauses liegen zusätzlich als
// Dokument "houses/h<Nummer>" beim Server. Jeder Spieler gleicht seinen Spielstand damit ab:
// - Gebautes geht nie verloren: Es gilt immer das Meiste (Etagen, Garage, Strom, Wasser).
// - Beim Aussehen und beim Garagentor gilt die letzte Änderung.
// Möbel und Einrichtung bleiben bei jedem Spieler selbst.
let HOUSEDB = null,
  HOUSEDOCS = {},
  housesReady = false, // das erste Mal Post vom Server bekommen
  housesSynced = false; // der eigene Spielstand ist einmal abgeglichen (ab dann gibt es Meldungen)
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const db = await window.claude.use('db');
    if (!db) return;
    const col = db.collection('houses');
    HOUSEDB = col;
    col.onSnapshot(
      (qs) => {
        const N = {};
        qs.docs.forEach((d) => {
          if (d.exists) N[d.id] = d.data();
        });
        HOUSEDOCS = N;
        housesReady = true;
        syncHouses(false);
      },
      () => {
        HOUSEDB = null;
      },
    );
  } catch (e) {}
})();

// Das, was von einem Haus für alle sichtbar ist, in einer festen Form
function houseFacts(src, up) {
  src = src && typeof src === 'object' ? src : {};
  const extra = Math.max(0, Math.min(MAXEXTRA, src.extra | 0));
  const style = SDEF[src.style] ? src.style : 'classic';
  const fs = [];
  for (let j = 0; j < extra; j++) fs.push(Array.isArray(src.fs) && SDEF[src.fs[j]] ? src.fs[j] : style);
  const garage = src.garage ? 1 : 0;
  return {
    extra,
    garage,
    gOpen: garage && src.gOpen ? 1 : 0,
    style,
    fs,
    p: (up || src).p ? 1 : 0,
    w: (up || src).w ? 1 : 0,
  };
}
const houseLocal = (n) => houseFacts(state.homes && state.homes[n], (state.up && state.up[n]) || {});
const houseEmpty = (f) => !f.extra && !f.garage && f.style === 'classic' && !f.p && !f.w;
const houseSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function houseMerge(L, R, localWins) {
  const look = localWins ? L : R,
    other = localWins ? R : L,
    extra = Math.max(L.extra, R.extra),
    garage = L.garage | R.garage,
    fs = [];
  for (let j = 0; j < extra; j++) fs.push(look.fs[j] || other.fs[j] || look.style);
  return {
    extra,
    garage,
    gOpen: garage ? look.gOpen : 0,
    style: look.style,
    fs,
    p: L.p | R.p,
    w: L.w | R.w,
  };
}

// Was ein anderer gebaut hat, zählt nicht zu den eigenen Erfolgsmomenten (siehe main.js)
const builtByOther = (key) => !!(state.foreign && state.foreign[key]);
function markForeign(key) {
  if ((state.moments || []).some((m) => m.key === key)) return;
  (state.foreign = state.foreign || {})[key] = 1;
}

function houseApply(n, was, now, by) {
  const hm = homeOf(n),
    who = by ? esc(String(by).slice(0, 14)) : 'Jemand';
  hm.extra = now.extra;
  hm.style = now.style;
  hm.fs = now.fs.slice();
  if (now.garage) {
    hm.garage = 1;
    hm.gOpen = !!now.gOpen;
  }
  if (state.up && state.up[n]) {
    if (now.p) state.up[n].p = 1;
    if (now.w) state.up[n].w = 1;
  }
  for (let e = was.extra + 1; e <= now.extra; e++) markForeign('floor' + n + '_' + e);
  if (now.p && !was.p) markForeign('p' + n);
  if (now.w && !was.w) markForeign('w' + n);
  if (!housesSynced) return;
  if (now.extra > was.extra)
    toast(`<b>Haus ${n} ist gewachsen!</b> ${who} hat angebaut, es hat jetzt ${now.extra + 2} Etagen.`, 5000);
  if (now.garage && !was.garage)
    toast(`<b>Haus ${n} hat jetzt eine Garage!</b> ${who} hat sie gebaut.`, 5000);
  if (n >= 5 && now.p && !was.p)
    toast(`<b>Haus ${n} hat jetzt Strom!</b> ${who} hat ihn angeschlossen.`, 4500);
  if (n >= 5 && now.w && !was.w)
    toast(`<b>Haus ${n} hat jetzt Wasser!</b> ${who} hat es angeschlossen.`, 4500);
}

// localWins: Ich habe gerade selbst etwas geändert (changed()), sonst kommt die Änderung vom Server.
function syncHouses(localWins) {
  if (!HOUSEDB || !housesReady || !state || !player) return;
  let took = false,
    garageNew = false;
  for (const h of HOUSES) {
    const n = h.n,
      doc = HOUSEDOCS['h' + n],
      L = houseLocal(n),
      R = doc ? houseFacts(doc) : null,
      M = R ? houseMerge(L, R, localWins) : L;
    if (!houseSame(M, L)) {
      houseApply(n, L, M, doc && doc.by);
      took = true;
      if (M.garage && !L.garage) garageNew = true;
      if (M.extra !== L.extra && scene && scene.house === h && scene.floor >= 1)
        scene.map = buildInterior(h, scene.floor);
    }
    if (R ? !houseSame(M, R) : !houseEmpty(M)) {
      const out = { ...M, by: (state.name || 'Jemand').slice(0, 14), at: Date.now() };
      HOUSEDOCS['h' + n] = out;
      HOUSEDB.doc('h' + n)
        .set(out)
        .catch(() => {});
    }
  }
  housesSynced = true;
  if (!took) return;
  applyGarages();
  try {
    build3D();
  } catch (e) {}
  if (garageNew && !scene) {
    // Steht man genau dort, wo eine Garage entstanden ist, rückt man vor das Tor.
    for (const [n, g] of Object.entries(GARAGES))
      if (
        hasGarage(+n) &&
        player.x > g.x - 0.3 &&
        player.x < g.x + 3.3 &&
        player.y > g.y - 0.3 &&
        player.y < g.y + 2.3
      )
        player.y = g.y + 2.6;
  }
  renderHUD();
  save();
}
