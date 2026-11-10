// ================= Haus-Codes (gemeinsam für alle Online-Spieler) =================
let LOCKDB = null,
  LOCKS = {},
  locksReady = false,
  MYNAME_ID = null;
const KNOWNKEY = 'younes-dorf-housekeys';

function knownCodes() {
  try {
    return JSON.parse(localStorage.getItem(KNOWNKEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function rememberCode(n, h) {
  const k = knownCodes();
  k['h' + n] = h;
  try {
    localStorage.setItem(KNOWNKEY, JSON.stringify(k));
  } catch (e) {}
}
const lockHash = (n, salt, code) => codeHash('haus' + n + ':' + salt + ':' + code).toString(36);
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const db = await window.claude.use('db');
    if (!db) return;
    const col = db.collection('locks');
    LOCKDB = col;
    col.onSnapshot(
      (qs) => {
        const L = {};
        qs.docs.forEach((d) => {
          if (d.exists) {
            const v = d.data();
            if (v && v.h) L[d.id] = v;
          }
        });
        LOCKS = L;
        locksReady = true;
      },
      () => {
        LOCKDB = null;
      },
    );
  } catch (e) {}
})();

function houseLock(n) {
  return LOCKS['h' + n] || null;
}

async function lockEdit(id, fn) {
  const ref = LOCKDB.doc(id);
  for (let t = 0; t < 8; t++) {
    const a = await ref.acquire({ holder: LOCK_HOLDER, ttlMs: 3000 });
    if (a.acquired) {
      const g = await ref.get();
      const d = g.exists ? JSON.parse(JSON.stringify(g.data())) : null;
      const r = fn(d);
      if (!r) return null;
      if (r === 'delete') {
        await ref.delete();
        delete LOCKS[id];
        return 'deleted';
      }
      await ref.set(r);
      LOCKS[id] = r;
      return r;
    }
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  }
  throw new Error('busy');
}
const LOCK_HOLDER = 'l' + Math.random().toString(36).slice(2);

function moveIn(n) {
  if (!MYID || !LOCKDB) return;
  const L = houseLock(n);
  if (L && L.res && L.res[MYID]) return;
  lockEdit('h' + n, (cur) => {
    if (!cur || !cur.h) return null;
    cur.res = cur.res || {};
    if (cur.res[MYID]) return null;
    cur.res[MYID] = (state.name || 'Jemand').slice(0, 14);
    return cur;
  }).catch(() => {});
}

function hasHouseKey(n) {
  const L = houseLock(n);
  if (!L) return true;
  if (isAdmin && state.masterKey) return true;
  return knownCodes()['h' + n] === L.h;
}

function houseDoorText(h) {
  if (!LOCKDB) return `Haus ${h.n} betreten`;
  const L = houseLock(h.n);
  if (!L) return `Haus ${h.n} betreten (noch frei)`;
  return hasHouseKey(h.n) ? `Haus ${h.n} betreten` : `Haus ${h.n} 🔒 Code eingeben`;
}

function tryEnterHouse(h) {
  const n = h.n;
  if (!LOCKDB) return enterHouse(h);
  if (!locksReady) return toast('Einen Moment, die Haustüren werden noch geladen …');
  const L = houseLock(n);
  if (!L) return claimDialog(h);
  if (hasHouseKey(n)) {
    if (knownCodes()['h' + n] === L.h) moveIn(n);
    return enterHouse(h);
  }
  codeDialog(h);
}

function codeField(btn) {
  return `<div class="codebox"><input id="hcode" type="password" autocomplete="off" maxlength="12" placeholder="Code"><button class="go" id="hok">${btn}</button><button id="cls">Abbrechen</button></div>`;
}

function bindCode(go) {
  const ci = $('hcode');
  setTimeout(() => {
    try {
      ci.focus();
    } catch (e) {}
  }, 30);
  $('hok').onclick = () => go(ci.value.trim(), ci);
  $('cls').onclick = closeModal;
  ci.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      go(ci.value.trim(), ci);
    } else if (e.key === 'Escape') {
      closeModal();
    }
  };
}

function codeDialog(h) {
  const L = houseLock(h.n);
  openModal(
    `<h2>Haus ${h.n} ist abgeschlossen 🔒</h2><p>Dieses Haus gehört <b>${esc((L.by || 'jemandem').toString().slice(0, 14))}</b>. Nur wer den Code kennt, kommt hinein.</p>${codeField('Aufschließen')}`,
  );
  bindCode((c, ci) => {
    const now = houseLock(h.n);
    if (!now) {
      closeModal();
      return tryEnterHouse(h);
    }
    if (c && lockHash(h.n, now.salt, c) === now.h) {
      rememberCode(h.n, now.h);
      moveIn(h.n);
      closeModal();
      toast('Klick! Die Tür ist offen.');
      enterHouse(h);
    } else {
      ci.value = '';
      toast('Falscher Code. Die Tür bleibt zu.');
    }
  });
}

function claimDialog(h) {
  openModal(
    `<h2>Haus ${h.n} ist noch frei!</h2><p>Du bist die erste Person hier. Such dir einen <b>Code</b> für dieses Haus aus (mindestens 3 Zeichen). Danach kommt nur noch hinein, wer den Code kennt.</p><p class="keys">Merk dir den Code gut. Wenn du ihn vergisst, kann ihn der Admin zurücksetzen.</p>${codeField('Code festlegen')}`,
  );
  bindCode(async (c, ci) => {
    if (c.length < 3) {
      toast('Der Code braucht mindestens 3 Zeichen.');
      return;
    }
    $('hok').disabled = true;
    const ref = LOCKDB.doc('h' + h.n);
    try {
      const holder = (MYID || 'p') + ':' + Math.random().toString(36).slice(2);
      const a = await ref.acquire({ holder, ttlMs: 5000 });
      if (!a.acquired) {
        toast('Jemand anderes sucht gerade einen Code für dieses Haus aus. Versuch es gleich nochmal.');
        $('hok').disabled = false;
        return;
      }
      const cur = await ref.get();
      const d = cur.exists ? cur.data() : null;
      if (d && d.h) {
        closeModal();
        toast('Schade, jemand war schneller und hat schon einen Code festgelegt.');
        return codeDialog(h);
      }
      const salt = Math.random().toString(36).slice(2, 10),
        hh = lockHash(h.n, salt, c);
      const nd = {
        h: hh,
        salt,
        by: (state.name || 'Jemand').slice(0, 14),
        uid: MYID || null,
        res: MYID ? { [MYID]: (state.name || 'Jemand').slice(0, 14) } : {},
        at: Date.now(),
      };
      await ref.set(nd);
      LOCKS['h' + h.n] = nd;
      rememberCode(h.n, hh);
      closeModal();
      toast(`Haus ${h.n} gehört jetzt dir! Dein Code ist gespeichert.`, 4500);
      moment('house' + h.n, `Haus ${h.n} ist jetzt dein Zuhause!`, 'house');
      enterHouse(h);
    } catch (e) {
      toast('Das hat nicht geklappt. Versuch es nochmal.');
      const b = $('hok');
      if (b) b.disabled = false;
    }
  });
}

async function resetHouseCode(n) {
  if (!isAdmin || !LOCKDB) return;
  try {
    await LOCKDB.doc('h' + n).delete();
    delete LOCKS['h' + n];
    toast(`Der Code von Haus ${n} ist gelöscht. Wer zuerst hineingeht, sucht einen neuen aus.`, 4500);
  } catch (e) {
    toast('Zurücksetzen hat nicht geklappt.');
  }
}

// ================= Brücke: einmal gebaut, für alle da =================
let WORLDDB = null;
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const db = await window.claude.use('db');
    if (!db) return;
    WORLDDB = db.collection('world');
    WORLDDB.doc('harbor').onSnapshot(
      (sn) => {
        const d = sn && sn.exists ? sn.data() : null;
        if (d && d.open && !state.harbor) harborSet(true, false, d.by);
        else if (state.harbor && !(d && d.open)) shareHarbor();
      },
      () => {},
    );
    WORLDDB.doc('bridge').onSnapshot(
      (sn) => {
        const d = sn && sn.exists ? sn.data() : null;
        const sw = d ? (d.built ? BRIDGE_WOOD : Math.max(0, +d.w || 0)) : 0;
        if (sw >= BRIDGE_WOOD && !state.bridge) {
          bridgeSet(BRIDGE_WOOD);
          toast(
            `<b>Die Brücke steht!</b> ${d.by ? esc(String(d.by).slice(0, 14)) + ' hat das letzte Stück gebaut. ' : ''}Jetzt kommen alle ins Marktdorf.`,
            5000,
          );
        } else if (sw > bridgeWood()) bridgeSet(sw);
        else if (bridgeWood() > sw) shareBridge();
      },
      () => {},
    );
  } catch (e) {}
})();

function shareBridge() {
  if (!WORLDDB) return;
  const w = bridgeWood();
  WORLDDB.doc('bridge')
    .set({ w, built: w >= BRIDGE_WOOD, by: (state.name || 'Jemand').slice(0, 14), at: Date.now() })
    .catch(() => {});
}
