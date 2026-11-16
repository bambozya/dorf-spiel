// ================= Spielerliste, Schenken und Tauschen =================
// Oben links steht, wer gerade online ist. Ein Klick auf einen Namen öffnet ein Menü:
// etwas schenken (Münzen oder Sachen aus dem Rucksack), einen Tausch vorschlagen, privat schreiben.
// Der Spielserver reicht Geschenke und Angebote nur weiter; gebucht wird hier im Spiel.
const PLAYERS_KEY = 'younes-dorf-players';
let playersOpen = true;
let playersSig = '';
let tradeOut = null; // mein offenes Angebot: { id, to, toName, a, an, b, bn }
const tradeIn = new Map(); // Angebote an mich: id -> { id, from, fromName, a, an, b, bn, accepted }
let giveBusy = false;

const givingAvailable = () => !!(window.dorfServer && window.dorfServer.gift);
const thingLabel = (k) => (k === 'coin' ? 'Glücksmünzen' : ITEMS[k].p);
const amountOf = (k) => (k === 'coin' ? state.coins : state.inv[k] || 0);
const myThings = () => PS_ITEMS.filter((k) => amountOf(k) > 0);
const validThing = (k, n) => PS_ITEMS.includes(k) && Number.isInteger(n) && n >= 1 && n <= 1e6;
const thingOptions = (list, sel) =>
  list.map((k) => `<option value="${k}"${k === sel ? ' selected' : ''}>${thingLabel(k)}</option>`).join('');
const readAmount = (id) => Math.floor(+$(id).value);

// ---------- die Liste ----------
function onlinePlayers(ps) {
  const me = window.dorfServer && window.dorfServer.userId;
  const seen = new Set();
  const list = [];
  for (const p of ps) {
    if (p.sameTab || (p.user && (p.user === me || seen.has(p.user)))) continue;
    if (p.user) seen.add(p.user);
    const nm = typeof p.presence.nm === 'string' ? p.presence.nm.trim().slice(0, 14) : '';
    list.push({ user: p.user || null, name: nm || 'Jemand' });
  }
  return list;
}

// Wird in jedem Bild von netTick aufgerufen; gebaut wird nur, wenn sich etwas geändert hat.
function renderPlayerList(ps) {
  const on = $('online'),
    list = $('playerlist'),
    btn = $('bPlayers');
  const live = !!(room && ps.length);
  on.hidden = !live;
  btn.hidden = !live;
  if (!live) {
    list.hidden = true;
    playersSig = '';
    return;
  }
  const pl = onlinePlayers(ps);
  const sig = JSON.stringify([playersOpen, ps.length, pl, tradeOut && tradeOut.to, [...tradeIn.values()]]);
  if (sig === playersSig) return;
  playersSig = sig;
  on.textContent = 'Online: ' + ps.length + ' Spieler';
  list.hidden = !playersOpen;
  btn.classList.toggle('on', playersOpen);
  if (!pl.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Nur du bist gerade online.';
    list.replaceChildren(empty);
    return;
  }
  const asks = new Set([...tradeIn.values()].filter((t) => !t.accepted).map((t) => t.from));
  list.replaceChildren(
    ...pl.map((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = p.name;
      const tag = asks.has(p.user)
        ? 'will tauschen'
        : tradeOut && tradeOut.to === p.user
          ? 'Angebot läuft'
          : '';
      if (tag) {
        const s = document.createElement('span');
        s.className = 'tag';
        s.textContent = tag;
        b.appendChild(s);
      }
      if (givingAvailable() && p.user) {
        b.title = `${p.name}: schenken, tauschen oder schreiben`;
        b.addEventListener('click', () => openPlayerMenu(p.user, p.name));
      } else b.disabled = true;
      return b;
    }),
  );
}

function togglePlayers(on) {
  playersOpen = on === undefined ? !playersOpen : on;
  try {
    localStorage.setItem(PLAYERS_KEY, playersOpen ? '1' : '0');
  } catch (e) {}
}

// ---------- Menü für einen Spieler ----------
function openPlayerMenu(user, name) {
  if (!givingAvailable() || !state || !state.created) return;
  const asks = [...tradeIn.values()].find((t) => t.from === user && !t.accepted);
  if (asks) return showTradeOffer(asks.id);
  const mine = tradeOut && tradeOut.to === user ? tradeOut : null;
  let h = `<h2>${esc(name)}</h2>`;
  if (mine)
    h += `<div class="boxline"><span>Dein Angebot läuft: Du gibst <b>${psName(mine.a, mine.an)}</b> für <b>${psName(mine.b, mine.bn)}</b>.</span><button id="pmCancel">Zurückziehen</button></div>`;
  else if (tradeOut)
    h += `<p class="keys">Du wartest noch auf eine Antwort von ${esc(tradeOut.toName)}. Erst danach kannst du einen neuen Tausch vorschlagen.</p>`;
  h += `<p>Was möchtest du machen?</p><div class="actions"><button class="go" id="pmGift">Schenken</button><button class="go" id="pmTrade"${tradeOut ? ' disabled' : ''}>Tausch vorschlagen</button><button id="pmChat">Schreiben</button><button id="cls">Schließen</button></div>`;
  openModal(h);
  $('cls').onclick = closeModal;
  $('pmGift').onclick = () => openGiftForm(user, name);
  $('pmTrade').onclick = () => openTradeForm(user, name);
  $('pmChat').onclick = () => {
    closeModal();
    openChat(user);
  };
  if (mine) $('pmCancel').onclick = () => cancelTrade().then(() => openPlayerMenu(user, name));
}

// ---------- Schenken ----------
function openGiftForm(user, name) {
  const mine = myThings();
  if (!mine.length) {
    openModal(
      `<h2>${esc(name)} etwas schenken</h2><p>Du hast gerade nichts zum Verschenken: keine Münzen und nichts im Rucksack.</p><div class="actions"><button id="gBack">Zurück</button></div>`,
    );
    $('gBack').onclick = () => openPlayerMenu(user, name);
    return;
  }
  openModal(
    `<h2>${esc(name)} etwas schenken</h2><p>Such aus, was du verschenken möchtest. Es kommt sofort bei ${esc(name)} an.</p>
    <div class="offerform"><span>Ich schenke</span><input id="gn" type="number" inputmode="numeric" min="1" value="1"><select id="gk">${thingOptions(mine, mine[0])}</select></div>
    <p class="keys" id="ghint"></p>
    <div class="actions"><button class="go" id="gOk">Schenken</button><button id="gBack">Zurück</button></div>`,
  );
  const hint = () => {
    const k = $('gk').value;
    $('ghint').textContent = `Du hast ${psName(k, amountOf(k))}.`;
    $('gn').max = amountOf(k);
  };
  $('gk').onchange = hint;
  hint();
  $('gBack').onclick = () => openPlayerMenu(user, name);
  $('gOk').onclick = () => sendGift(user, name, $('gk').value, readAmount('gn'));
}

async function sendGift(user, name, k, n) {
  if (giveBusy) return;
  if (!validThing(k, n)) return toast('Gib eine Zahl ab 1 ein.');
  if (!invHas(k, n)) return toast(`So viel hast du nicht. Du hast ${psName(k, amountOf(k))}.`);
  giveBusy = true;
  // erst abziehen, dann schicken; klappt es nicht, kommt alles zurück
  invAdd(k, -n);
  changed();
  let ok = false,
    err = '';
  try {
    const r = await window.dorfServer.gift(user, k, n);
    ok = !!r.ok;
    err = r.error || '';
  } catch (e) {
    err = 'Keine Verbindung zum Server.';
  }
  giveBusy = false;
  if (!ok) {
    invAdd(k, n);
    changed();
    return toast(esc(err || 'Das Schenken hat nicht geklappt.'));
  }
  toast(`🎁 Du hast <b>${esc(name)}</b> ${psName(k, n)} geschenkt.`, 4000);
  closeModal();
}

function onGift(m) {
  if (!m || !state || !validThing(m.k, m.n)) return;
  invAdd(m.k, m.n);
  changed();
  float(player.x, player.y - 1.6, '+' + psName(m.k, m.n), '#ffd23f');
  toast(`🎁 <b>${esc(m.fromName || 'Jemand')}</b> schenkt dir <b>${psName(m.k, m.n)}</b>!`, 6000);
}

// ---------- Tauschen ----------
function openTradeForm(user, name) {
  const mine = myThings();
  if (!mine.length) {
    openModal(
      `<h2>Tausch mit ${esc(name)}</h2><p>Du hast gerade nichts zum Tauschen: keine Münzen und nichts im Rucksack.</p><div class="actions"><button id="tBack">Zurück</button></div>`,
    );
    $('tBack').onclick = () => openPlayerMenu(user, name);
    return;
  }
  const want = PS_ITEMS.find((k) => k !== mine[0]);
  openModal(
    `<h2>Tausch mit ${esc(name)}</h2><p>Sag, was du gibst und was du dafür haben möchtest. ${esc(name)} kann annehmen oder ablehnen.</p>
    <div class="offerform">
    <span>Ich gebe</span><input id="tan" type="number" inputmode="numeric" min="1" value="1"><select id="ta">${thingOptions(mine, mine[0])}</select>
    <span>und will</span><input id="tbn" type="number" inputmode="numeric" min="1" value="1"><select id="tb">${thingOptions(PS_ITEMS, want)}</select></div>
    <p class="keys" id="thint"></p>
    <div class="actions"><button class="go" id="tOk">Tausch vorschlagen</button><button id="tBack">Zurück</button></div>`,
  );
  const hint = () => {
    const k = $('ta').value;
    $('thint').textContent = `Du hast ${psName(k, amountOf(k))}.`;
    $('tan').max = amountOf(k);
  };
  $('ta').onchange = hint;
  hint();
  $('tBack').onclick = () => openPlayerMenu(user, name);
  $('tOk').onclick = () =>
    sendTradeOffer(user, name, $('ta').value, readAmount('tan'), $('tb').value, readAmount('tbn'));
}

async function sendTradeOffer(user, name, a, an, b, bn) {
  if (giveBusy) return;
  if (!validThing(a, an) || !validThing(b, bn)) return toast('Gib bei beiden eine Zahl ab 1 ein.');
  if (a === b) return toast('Such zwei verschiedene Sachen aus, sonst ist es kein Tausch.');
  if (!invHas(a, an)) return toast(`So viel hast du nicht. Du hast ${psName(a, amountOf(a))}.`);
  giveBusy = true;
  let r = null;
  try {
    r = await window.dorfServer.trade({ op: 'offer', to: user, a, an, b, bn });
  } catch (e) {}
  giveBusy = false;
  if (!r || !r.ok) return toast(esc((r && r.error) || 'Keine Verbindung zum Server.'));
  tradeOut = { id: r.id, to: user, toName: name, a, an, b, bn };
  toast(`Angebot an <b>${esc(name)}</b> geschickt. Jetzt muss ${esc(name)} antworten.`, 4000);
  closeModal();
}

async function cancelTrade() {
  const tr = tradeOut;
  if (!tr) return;
  try {
    const r = await window.dorfServer.trade({ op: 'cancel', id: tr.id });
    if (r.ok && tradeOut === tr) {
      tradeOut = null;
      toast('Angebot zurückgezogen.', 2200);
    }
  } catch (e) {}
}

const tradeModalShows = (id) => !modal.hidden && !!sheet.querySelector(`[data-trade="${id}"]`);

// Ein Angebot an mich: annehmen, ablehnen oder später entscheiden
function showTradeOffer(id) {
  const tr = tradeIn.get(id);
  if (!tr) return;
  const ok = invHas(tr.b, tr.bn);
  openModal(
    `<h2>Tauschangebot</h2><p data-trade="${tr.id}"><b>${esc(tr.fromName)}</b> möchte mit dir tauschen.</p>
    <div class="offer"><span>Du bekommst <b>${psName(tr.a, tr.an)}</b><br>und gibst dafür <b>${psName(tr.b, tr.bn)}</b></span></div>
    <p class="keys">Du hast ${psName(tr.b, amountOf(tr.b))}.${ok ? '' : ' Das reicht nicht für diesen Tausch.'}</p>
    <div class="actions"><button class="go" id="trYes"${ok ? '' : ' disabled'}>${ok ? 'Annehmen' : 'Zu wenig'}</button><button id="trNo">Ablehnen</button><button id="trLater">Später</button></div>`,
  );
  $('trYes').onclick = () => answerTrade(id, true);
  $('trNo').onclick = () => answerTrade(id, false);
  $('trLater').onclick = closeModal;
}

async function answerTrade(id, accept) {
  const tr = tradeIn.get(id);
  if (!tr || tr.accepted) return;
  if (accept && !invHas(tr.b, tr.bn)) return toast(`Dafür brauchst du ${psName(tr.b, tr.bn)}.`);
  if (accept) tr.accepted = true;
  else tradeIn.delete(id);
  if (tradeModalShows(id)) closeModal();
  let r = null;
  try {
    r = await window.dorfServer.trade({ op: 'answer', id, accept });
  } catch (e) {}
  if (accept && (!r || !r.ok)) {
    tradeIn.delete(id);
    toast('Dieses Angebot gibt es nicht mehr.');
  }
}

// Der andere hat angenommen: Ich bestätige, und erst wenn der Server das weitergereicht hat, wird getauscht.
async function commitTrade(tr) {
  const mine = !!tradeOut && tradeOut.id === tr.id;
  const can = mine && validThing(tr.a, tr.an) && validThing(tr.b, tr.bn) && invHas(tr.a, tr.an);
  let r = null;
  try {
    r = await window.dorfServer.trade({ op: 'commit', id: tr.id, ok: can });
  } catch (e) {}
  if (!mine) return;
  tradeOut = null;
  const who = esc(tr.toName || 'Jemand');
  if (!can) return toast(`Der Tausch mit <b>${who}</b> hat nicht geklappt: Du hast nicht mehr genug.`, 5000);
  if (!r || !r.ok) return toast(`Der Tausch mit <b>${who}</b> hat nicht geklappt.`, 5000);
  invAdd(tr.a, -Math.min(tr.an, amountOf(tr.a)));
  invAdd(tr.b, tr.bn);
  changed();
  toast(
    `🤝 <b>${who}</b> hat angenommen! Du hast ${psName(tr.a, tr.an)} gegeben und <b>${psName(tr.b, tr.bn)}</b> bekommen.`,
    6000,
  );
}

// Nachricht vom Server zu einem Tausch; null heißt: neu angemeldet, alle Angebote sind weg
function onTradeEvent(m) {
  if (!m) {
    for (const id of tradeIn.keys()) if (tradeModalShows(id)) closeModal();
    tradeOut = null;
    tradeIn.clear();
    return;
  }
  const tr = m.trade;
  if (!tr || !state) return;
  const iOffered = tr.from === window.dorfServer.userId;
  const other = esc((iOffered ? tr.toName : tr.fromName) || 'Jemand');
  const forget = () => {
    if (iOffered) {
      if (tradeOut && tradeOut.id === tr.id) tradeOut = null;
    } else {
      if (tradeModalShows(tr.id)) closeModal();
      tradeIn.delete(tr.id);
    }
  };
  switch (m.ev) {
    case 'offer': {
      if (!validThing(tr.a, tr.an) || !validThing(tr.b, tr.bn)) {
        window.dorfServer.trade({ op: 'answer', id: tr.id, accept: false }).catch(() => {});
        return;
      }
      tradeIn.set(tr.id, { ...tr, fromName: tr.fromName || 'Jemand', accepted: false });
      if (modal.hidden && state.created) showTradeOffer(tr.id);
      else
        toast(
          `🤝 <b>${other}</b> schlägt dir einen Tausch vor. Klick oben links auf den Namen, um zu antworten.`,
          6000,
        );
      return;
    }
    case 'accepted':
      commitTrade(tr);
      return;
    case 'declined':
      forget();
      toast(`<b>${other}</b> möchte gerade nicht tauschen.`, 4000);
      return;
    case 'cancelled':
      forget();
      toast(
        iOffered
          ? `<b>${other}</b> ist nicht mehr online. Dein Angebot ist weg.`
          : `<b>${other}</b> hat das Tauschangebot zurückgezogen.`,
        4000,
      );
      return;
    case 'expired':
      forget();
      toast(
        iOffered
          ? `<b>${other}</b> hat nicht geantwortet. Dein Angebot ist abgelaufen.`
          : `Das Tauschangebot von <b>${other}</b> ist abgelaufen.`,
        4000,
      );
      return;
    case 'failed':
      forget();
      toast(`Der Tausch mit <b>${other}</b> hat nicht geklappt.`, 5000);
      return;
    case 'done': {
      const mine = tradeIn.get(tr.id);
      if (!mine || !mine.accepted) return;
      tradeIn.delete(tr.id);
      invAdd(mine.b, -Math.min(mine.bn, amountOf(mine.b)));
      invAdd(mine.a, mine.an);
      changed();
      toast(
        `🤝 Getauscht mit <b>${other}</b>! Du hast ${psName(mine.b, mine.bn)} gegeben und <b>${psName(mine.a, mine.an)}</b> bekommen.`,
        6000,
      );
      return;
    }
  }
}

(() => {
  try {
    playersOpen = localStorage.getItem(PLAYERS_KEY) !== '0';
  } catch (e) {}
  $('bPlayers').addEventListener('click', () => togglePlayers());
  if (!givingAvailable()) return; // in der Claude-Umgebung gibt es nur die Liste
  window.dorfServer.onGift(onGift);
  window.dorfServer.onTrade(onTradeEvent);
})();
