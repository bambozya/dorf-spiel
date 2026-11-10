// ================= Bannen (nur der Besitzer) =================
let BANDB = null,
  BANS = {},
  MYID = null,
  banned = false;
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const [db, u] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (u) {
      try {
        MYID = await u.id();
      } catch (e) {}
    }
    if (!db) return;
    BANDB = db.doc('admin/bans');
    BANDB.onSnapshot(
      (snap) => {
        const d = snap.exists ? snap.data() : null;
        BANS = d && d.ids && typeof d.ids === 'object' ? d.ids : {};
        if (MYID && BANS[MYID] && !isOwnerAcc) banMe();
        if (!modal.hidden && $('aBanList')) renderBanList();
      },
      () => {},
    );
  } catch (e) {}
})();

function banMe() {
  if (banned) return;
  banned = true;
  try {
    room && room.presence({ x: null, y: null, sc: 'gone', nm: null });
  } catch (e) {}
  room = null;
  others.clear();
  const d = document.createElement('div');
  d.id = 'banned';
  d.innerHTML =
    '<div class="panel"><h2>Du wurdest ausgeschlossen</h2><p>Der Besitzer dieses Spiels hat dich gebannt. Du kannst gerade nicht mitspielen.</p></div>';
  document.body.appendChild(d);
}

function renderBanList() {
  const box = $('aBanList');
  if (!box) return;
  let h = '';
  if (!isOwnerAcc) {
    box.innerHTML = '<p>Bannen kann nur der Besitzer des Spiels.</p>';
    return;
  }
  const ps = room ? room.peers().filter((p) => p.kind === 'viewer' && !p.sameTab && !p.isMe) : [];
  if (!room) h += '<p>Der Online-Modus ist hier gerade nicht verbunden.</p>';
  else if (!ps.length) h += '<p>Gerade ist niemand anderes online.</p>';
  for (const p of ps) {
    const nm = esc(((p.presence && p.presence.nm) || '').toString().slice(0, 14) || 'Jemand');
    const id = p.by;
    h += `<div class="banrow"><span><b>${nm}</b>${p.guest ? ' (Gast)' : ''}</span>${id ? (BANS[id] ? '<em>gebannt</em>' : `<button class="ban" data-id="${esc(id)}" data-n="${nm}">Bannen</button>`) : '<em>kann nicht gebannt werden</em>'}</div>`;
  }
  const bl = Object.entries(BANS);
  if (bl.length) {
    h += '<p><b>Gebannte Spieler</b></p>';
    for (const [id, v] of bl)
      h += `<div class="banrow"><span>${esc((v && v.n) || 'Jemand')}</span><button class="unban" data-id="${esc(id)}">Entbannen</button></div>`;
  }
  if (!BANDB) h += '<p>Bannen ist hier nicht verfügbar (die Bann-Liste kann nicht gespeichert werden).</p>';
  box.innerHTML = h;
  box.querySelectorAll('.ban').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!BANDB || !isAdmin) return;
        b.disabled = true;
        const nb = Object.assign({}, BANS, { [b.dataset.id]: { n: b.dataset.n, at: Date.now() } });
        try {
          await BANDB.set({ ids: nb });
          toast(`<b>${b.dataset.n}</b> wurde gebannt.`);
        } catch (e) {
          toast('Bannen hat nicht geklappt. Versuch es nochmal.');
          b.disabled = false;
        }
      }),
  );
  box.querySelectorAll('.unban').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!BANDB || !isAdmin) return;
        b.disabled = true;
        const nb = Object.assign({}, BANS);
        delete nb[b.dataset.id];
        try {
          await BANDB.set({ ids: nb });
          toast('Der Spieler darf wieder mitspielen.');
        } catch (e) {
          toast('Entbannen hat nicht geklappt.');
          b.disabled = false;
        }
      }),
  );
}
