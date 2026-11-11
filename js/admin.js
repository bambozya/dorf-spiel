// ================= Admin (nur für den Besitzer des Spiels) =================
let isAdmin = false,
  isOwnerAcc = false;
(async () => {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const u = await window.claude.use('user');
      if (u && (await u.isOwner())) isOwnerAcc = true;
    }
  } catch (e) {}
})();
const codeHash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

function setAdmin(on) {
  isAdmin = !!on;
  $('bAdmin').hidden = !isAdmin;
  try {
    if (on) localStorage.setItem('younes-dorf-admin', '1');
    else localStorage.removeItem('younes-dorf-admin');
  } catch (e) {}
  if (!on) {
    state.infCoins = false;
    state.infMat = false;
    state.masterKey = false;
  }
}
{
  let v = null;
  try {
    v = localStorage.getItem('younes-dorf-admin');
  } catch (e) {}
  if (v === '1') setAdmin(true);
}

function tryCode(c) {
  c = (c || '').trim();
  if (!c) return false;
  if (codeHash(c) === 3265318270) {
    setAdmin(true);
    toast('<b>Admin freigeschaltet!</b> Oben ist jetzt der Admin-Knopf.', 4500);
    return true;
  }
  toast('Dieser Code stimmt leider nicht.');
  return false;
}
const MATS = [
  'wood',
  'plank',
  'stone',
  'fish',
  'cod',
  'tuna',
  'carrot',
  'wheat',
  'pumpkin',
  'bread',
  'soup',
  'cake',
  'pie',
  'ffish',
  'salad',
  'seed_carrot',
  'seed_wheat',
  'seed_pumpkin',
];

function adminTick() {
  if (!isAdmin) return;
  if (state.infCoins && state.coins < 999999) state.coins = 999999;
  if (state.infMat) for (const k of MATS) if (state.inv[k] < 999) state.inv[k] = 999;
}

function openAdmin() {
  if (!isAdmin) return;
  const b = (id, t, cls) => `<button id="${id}" class="${cls || ''}">${t}</button>`;
  openModal(`<h2>Admin</h2><p>Diesen Bereich sieht nur, wer den Geheimcode eingegeben hat.</p>
    <p><b>Unendlich</b></p><div class="actions">${b('aInfC', (state.infCoins ? '✓ ' : '') + 'Unendlich Münzen', state.infCoins ? 'go' : '')}${b('aInfM', (state.infMat ? '✓ ' : '') + 'Unendlich Material', state.infMat ? 'go' : '')}</div>
    <p><b>Holen</b></p><div class="actions">${b('aC', '+1000 Münzen')}${b('aW', '+50 Holz und Bretter')}${b('aS', '+50 Steine')}${b('aSe', '+20 Samen von allem')}${b('aV', '+20 Gemüse, Brot und Suppe')}${b('aT', 'Alle Werkzeuge')}</div>
    <p><b>Abkürzungen</b></p><div class="actions">${b('aG', 'Alle Pflanzen sofort reif')}${b('aB', 'Brücke sofort bauen')}${b('aH', 'Strom und Wasser für alle Häuser')}${b('aM', 'Zeit: Morgen')}${b('aN', 'Zeit: Abend')}</div>
    <p><b>Häuser</b></p><div class="actions">${b('aKey', (state.masterKey ? '✓ ' : '') + 'Generalschlüssel: in jedes Haus', state.masterKey ? 'go' : '')}</div><div id="aHouses"></div>
    <p><b>Stände auf dem Dorfplatz</b></p><div id="aStalls"></div>
    <p><b>Online-Spieler bannen</b></p><div id="aBanList"></div>
    <div class="actions">${b('aOff', 'Admin wieder ausschalten')}${b('cls', 'Schließen', 'go')}</div>`);
  renderBanList();
  $('aOff').onclick = () => {
    setAdmin(false);
    changed();
    closeModal();
    toast('Admin ist aus. Mit dem Code kannst du ihn wieder einschalten.');
  };
  const on = (id, f) => {
    const e = $(id);
    if (e)
      e.onclick = () => {
        f();
        changed();
        openAdmin();
      };
  };
  on('aKey', () => {
    state.masterKey = !state.masterKey;
  });
  {
    const sb = $('aStalls');
    if (sb) {
      if (!PSDB) sb.innerHTML = '<p>Die Stände gibt es nur im Online-Spiel.</p>';
      else {
        sb.innerHTML = PSTALLS.map((s, i) => {
          const d = psOf(i);
          const name = psVillage(i) === 0 ? 'Dorfplatz ' + (i + 1) : 'Marktdorf ' + (i - STALLS1.length + 1);
          return `<div class="banrow"><span><b>${name}</b> ${d ? 'von ' + esc((d.by || 'jemand').slice(0, 14)) + ' · ' + (d.offers || []).filter((o) => o.left > 0).length + ' Angebote' : 'frei'}</span>${d ? `<button class="sreset" data-i="${i}">Stand räumen</button>` : ''}</div>`;
        }).join('');
        sb.querySelectorAll('.sreset').forEach(
          (x) =>
            (x.onclick = async () => {
              x.disabled = true;
              await psReset(+x.dataset.i);
              openAdmin();
            }),
        );
      }
    }
  }
  {
    const hb = $('aHouses');
    if (hb) {
      if (!LOCKDB) hb.innerHTML = '<p>Haus-Codes gibt es nur im Online-Spiel.</p>';
      else {
        hb.innerHTML = HOUSES.map((h) => {
          const L = houseLock(h.n);
          return `<div class="banrow"><span><b>Haus ${h.n}</b> ${
            L
              ? '🔒 ' +
                (L.res && Object.keys(L.res).length
                  ? esc(
                      Object.values(L.res)
                        .map((x) => String(x).slice(0, 14))
                        .join(', '),
                    )
                  : 'von ' + esc((L.by || 'jemand').toString().slice(0, 14)))
              : 'noch frei'
          }</span>${L ? `<button class="hreset" data-n="${h.n}">Code löschen</button>` : ''}</div>`;
        }).join('');
        hb.querySelectorAll('.hreset').forEach(
          (x) =>
            (x.onclick = async () => {
              x.disabled = true;
              await resetHouseCode(+x.dataset.n);
              openAdmin();
            }),
        );
      }
    }
  }
  on('aInfC', () => {
    state.infCoins = !state.infCoins;
    if (state.infCoins) state.coins = 999999;
  });
  on('aInfM', () => {
    state.infMat = !state.infMat;
    adminTick();
  });
  on('aC', () => (state.coins += 1000));
  on('aW', () => {
    state.inv.wood += 50;
    state.inv.plank += 50;
  });
  on('aS', () => (state.inv.stone += 50));
  on('aSe', () => {
    state.inv.seed_carrot += 20;
    state.inv.seed_wheat += 20;
    state.inv.seed_pumpkin += 20;
  });
  on('aV', () => {
    for (const k of ['carrot', 'wheat', 'pumpkin', 'bread', 'soup']) state.inv[k] += 20;
  });
  on('aT', () => {
    state.axe = true;
    state.saw = true;
    state.tools = state.tools || {};
    for (const [k] of TOOLS) if (k !== 'axe' && k !== 'saw') state.tools[k] = 1;
    if (scene && scene.shop && !scene.label) scene.map = buildShopInterior();
  });
  on('aG', () => {
    for (const p of state.plots) if (p.c) p.g = CROPS[p.c].grow;
  });
  on('aB', () => {
    if (!state.bridge) {
      bridgeSet(BRIDGE_WOOD);
      shareBridge();
      moment('bridge', 'Die Brücke über den Fluss gebaut!', 'bridge');
    }
  });
  on('aH', () => {
    for (const n of [5, 6]) {
      state.up[n].p = 1;
      state.up[n].w = 1;
    }
  });
  on('aM', () => {
    state.t = 0.02;
  });
  on('aN', () => {
    state.t = 13.5 / 24;
  });
  $('cls').onclick = closeModal;
}
