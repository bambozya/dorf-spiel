// ================= Spieler-Stände auf dem Dorfplatz =================
let PSDB = null,
  PS = {},
  psReady = false;
const PS_HOLDER = 'h' + Math.random().toString(36).slice(2);
const PS_ITEMS = ['coin', ...INV_ORDER];
const psName = (k, n) => (k === 'coin' ? n + (n === 1 ? ' Glücksmünze' : ' Glücksmünzen') : fmt(n, k));
const invHas = (k, n) => (k === 'coin' ? state.coins : state.inv[k] || 0) >= n;
const invAdd = (k, n) => {
  if (k === 'coin') state.coins += n;
  else state.inv[k] = (state.inv[k] || 0) + n;
};
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const db = await window.claude.use('db');
    if (!db) return;
    const col = db.collection('pstalls');
    PSDB = col;
    col.onSnapshot(
      (qs) => {
        const N = {};
        qs.docs.forEach((d) => {
          if (d.exists) {
            const v = d.data();
            if (v && v.owner) N[d.id] = v;
          }
        });
        if (psReady && MYID) {
          for (const id in N) {
            const o = N[id],
              old = PS[id];
            if (o.owner === MYID && old && old.owner === MYID) {
              const sum = (b) => Object.values(b || {}).reduce((a, x) => a + x, 0);
              if (sum(o.box) > sum(old.box))
                toast('<b>Jemand hat an deinem Stand getauscht!</b> Hol dir deine Sachen am Stand ab.', 4500);
            }
          }
        }
        const before = psOpen !== null ? JSON.stringify(PS['s' + psOpen] || null) : '';
        PS = N;
        psReady = true;
        if (
          !modal.hidden &&
          psOpen !== null &&
          !psBusy &&
          JSON.stringify(PS['s' + psOpen] || null) !== before
        )
          psRender();
      },
      () => {
        PSDB = null;
      },
    );
  } catch (e) {}
})();
const psOf = (i) => PS['s' + i] || null;
const gen = (n) => {
  n = (n || 'Jemand').toString().slice(0, 14);
  return /[sßxz]$/i.test(n) ? n + '’' : n + 's';
};

function psMine() {
  for (let i = 0; i < STALLS1.length; i++) {
    const d = psOf(i);
    if (d && MYID && d.owner === MYID) return i;
  }
  return -1;
}

function psLabel(i) {
  if (!PSDB) return 'Dorfstand';
  const d = psOf(i);
  return d ? gen((d.by || 'Jemand').slice(0, 12)) + ' Stand' : 'Frei!';
}

function psGoods(i) {
  const d = psOf(i);
  if (!d || !d.offers) return [];
  const g = [];
  for (const o of d.offers) if (o.left > 0 && o.a !== 'coin' && !g.includes(o.a)) g.push(o.a);
  return g.slice(0, 3);
}

function psText(i) {
  if (!PSDB) return 'Dorfstand (nur im Online-Spiel)';
  const d = psOf(i);
  if (!d) return 'Freier Stand: übernehmen';
  if (MYID && d.owner === MYID) return 'Deinen Stand einrichten';
  const n = (d.offers || []).filter((o) => o.left > 0).length;
  return `${gen((d.by || 'Jemand').slice(0, 12))} Stand: tauschen (${n} ${n === 1 ? 'Angebot' : 'Angebote'})`;
}

async function psEdit(i, fn) {
  const ref = PSDB.doc('s' + i);
  for (let t = 0; t < 8; t++) {
    const a = await ref.acquire({ holder: PS_HOLDER, ttlMs: 3000 });
    if (a.acquired) {
      const g = await ref.get();
      const d = g.exists ? JSON.parse(JSON.stringify(g.data())) : null;
      const r = fn(d);
      if (!r) return null;
      if (r === 'delete') {
        await ref.delete();
        delete PS['s' + i];
        return 'deleted';
      }
      await ref.set(r);
      PS['s' + i] = r;
      return r;
    }
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  }
  throw new Error('busy');
}
let psOpen = null,
  psBusy = false;

function psAct(i) {
  if (!PSDB)
    return toast(
      'Die Stände auf dem Dorfplatz gehören den Spielern. Tauschen geht hier nur im <b>Online-Spiel</b>.',
      4500,
    );
  if (!psReady) return toast('Einen Moment, die Stände werden noch geladen …');
  const d = psOf(i);
  if (!d) {
    if (!MYID) return toast('Um einen Stand zu übernehmen, musst du angemeldet sein.');
    const m = psMine();
    if (m >= 0) return toast('Du hast schon einen Stand. Jeder darf nur einen haben.');
    openModal(
      `<h2>Freier Stand</h2><p>Hier kannst du deinen eigenen Tauschstand aufmachen. Du legst Sachen aus und bestimmst, was du dafür haben willst. Andere Spieler können tauschen, auch wenn du gerade nicht da bist.</p><div class="actions"><button class="go" id="psClaim">Stand übernehmen</button><button id="cls">Abbrechen</button></div>`,
    );
    $('cls').onclick = closeModal;
    $('psClaim').onclick = async () => {
      $('psClaim').disabled = true;
      try {
        const r = await psEdit(i, (cur) =>
          cur && cur.owner
            ? null
            : { owner: MYID, by: (state.name || 'Jemand').slice(0, 14), offers: [], box: {}, at: Date.now() },
        );
        if (!r) {
          toast('Schade, jemand war schneller.');
          closeModal();
          return;
        }
        moment('stall1', 'Deinen eigenen Stand auf dem Dorfplatz aufgemacht!', 'coin');
        psOpen = i;
        psRender();
      } catch (e) {
        toast('Das hat nicht geklappt. Versuch es nochmal.');
        closeModal();
      }
    };
    return;
  }
  psOpen = i;
  psRender();
}

function psRender() {
  const i = psOpen;
  if (i === null) return;
  const d = psOf(i);
  const keep = {};
  for (const id of ['oan', 'oa', 'obn', 'ob', 'ok2']) {
    const e = $(id);
    if (e) keep[id] = e.value;
  }
  if (!d) {
    closeModal();
    psOpen = null;
    return;
  }
  const mine = MYID && d.owner === MYID;
  const opt = (sel) =>
    PS_ITEMS.map(
      (k) =>
        `<option value="${k}"${k === sel ? ' selected' : ''}>${k === 'coin' ? 'Glücksmünzen' : ITEMS[k].p}</option>`,
    ).join('');
  let h = '';
  if (mine) {
    const box = Object.entries(d.box || {}).filter(([, n]) => n > 0);
    h += `<h2>Dein Stand</h2><div class="boxline"><span>${box.length ? '<b>Eingetauscht:</b> ' + box.map(([k, n]) => psName(k, n)).join(', ') : 'In deiner Kasse ist noch nichts.'}</span>${box.length ? '<button class="go" id="psCollect">Abholen</button>' : ''}</div>`;
    h += `<p><b>Deine Angebote</b></p>`;
    if (!(d.offers || []).length) h += '<p class="keys">Noch keine Angebote. Leg unten etwas aus!</p>';
    for (const o of d.offers || [])
      h += `<div class="offer"><span>Du gibst <b>${psName(o.a, o.an)}</b> für <b>${psName(o.b, o.bn)}</b> <small>${o.left > 0 ? 'noch ' + o.left + '×' : 'ausverkauft'}</small></span><button class="psDel" data-id="${o.id}">${o.left > 0 ? 'Zurücknehmen' : 'Entfernen'}</button></div>`;
    if ((d.offers || []).length < 6)
      h += `<p><b>Neues Angebot</b></p><div class="offerform">
      <span>Ich gebe</span><input id="oan" type="number" min="1" max="99" value="1"><select id="oa">${opt('carrot')}</select>
      <span>und will</span><input id="obn" type="number" min="1" max="99" value="1"><select id="ob">${opt('wood')}</select>
      <span>so oft</span><input id="ok2" type="number" min="1" max="50" value="1"><span class="keys">mal</span></div>
      <p class="keys" id="ohint"></p><div class="actions"><button class="go" id="psAdd">Angebot auslegen</button></div>`;
    h += `<div class="actions"><button id="psQuit">Stand aufgeben</button><button id="cls">Schließen</button></div>`;
  } else {
    const offers = (d.offers || []).filter((o) => o.left > 0);
    h += `<h2>${esc(gen(d.by))} Stand</h2><p>Du gibst etwas von dir und bekommst dafür etwas vom Stand. Das klappt auch, wenn ${esc((d.by || 'der Besitzer').slice(0, 14))} gerade nicht online ist.</p>`;
    if (!offers.length) h += '<p class="keys">Hier liegt gerade nichts zum Tauschen.</p>';
    for (const o of offers) {
      const ok = invHas(o.b, o.bn);
      h += `<div class="offer"><span>Du bekommst <b>${psName(o.a, o.an)}</b><br>und gibst dafür <b>${psName(o.b, o.bn)}</b> <small>noch ${o.left}×</small></span><button class="go psTrade" data-id="${o.id}"${ok ? '' : ' disabled title="Das hast du nicht genug."'}>${ok ? 'Tauschen' : 'Zu wenig'}</button></div>`;
    }
    h += `<div class="actions"><button id="cls">Schließen</button></div>`;
  }
  openModal(h);
  for (const id in keep) {
    const e = $(id);
    if (e) e.value = keep[id];
  }
  psOpen = i;
  $('cls').onclick = () => {
    psOpen = null;
    closeModal();
  };
  const run = async (fn) => {
    if (psBusy) return;
    psBusy = true;
    try {
      await fn();
    } catch (e) {
      toast('Das hat nicht geklappt. Versuch es gleich nochmal.');
    }
    psBusy = false;
    if (psOpen !== null && !modal.hidden) psRender();
  };
  if (mine) {
    const hint = () => {
      const e = $('ohint');
      if (!e) return;
      const an = +$('oan').value || 0,
        k = +$('ok2').value || 0,
        a = $('oa').value;
      e.textContent = `Dafür legst du ${psName(a, an * k)} aus. Du hast ${a === 'coin' ? state.coins : state.inv[a] || 0}.`;
    };
    ['oan', 'oa', 'ok2'].forEach((id) => {
      const e = $(id);
      if (e) e.oninput = e.onchange = hint;
    });
    hint();
    const ca = $('psCollect');
    if (ca)
      ca.onclick = () =>
        run(async () => {
          let got = null;
          const r = await psEdit(i, (cur) => {
            if (!cur || cur.owner !== MYID) return null;
            got = cur.box || {};
            cur.box = {};
            return cur;
          });
          if (r && got) {
            for (const [k, n] of Object.entries(got)) if (n > 0) invAdd(k, n);
            toast(
              'Abgeholt: <b>' +
                Object.entries(got)
                  .filter(([, n]) => n > 0)
                  .map(([k, n]) => psName(k, n))
                  .join(', ') +
                '</b>',
            );
            changed();
          }
        });
    sheet.querySelectorAll('.psDel').forEach(
      (b) =>
        (b.onclick = () =>
          run(async () => {
            let back = null;
            const r = await psEdit(i, (cur) => {
              if (!cur || cur.owner !== MYID) return null;
              const o = (cur.offers || []).find((x) => x.id === b.dataset.id);
              if (!o) return null;
              back = o;
              cur.offers = cur.offers.filter((x) => x !== o);
              return cur;
            });
            if (r && back && back.left > 0) {
              invAdd(back.a, back.an * back.left);
              toast('Zurück in deinem Rucksack: <b>' + psName(back.a, back.an * back.left) + '</b>');
              changed();
            }
          })),
    );
    const ad = $('psAdd');
    if (ad)
      ad.onclick = () =>
        run(async () => {
          const a = $('oa').value,
            b = $('ob').value,
            an = Math.floor(+$('oan').value),
            bn = Math.floor(+$('obn').value),
            k = Math.floor(+$('ok2').value);
          if (!(an >= 1 && an <= 99 && bn >= 1 && bn <= 99 && k >= 1 && k <= 50))
            return toast('Bitte gib Zahlen zwischen 1 und 99 ein (so oft: bis 50).');
          if (a === b) return toast('Du kannst nicht dasselbe gegen dasselbe tauschen.');
          if (!invHas(a, an * k))
            return toast('Dafür hast du nicht genug ' + (a === 'coin' ? 'Glücksmünzen' : ITEMS[a].p) + '.');
          const o = { id: Math.random().toString(36).slice(2, 9), a, an, b, bn, left: k };
          const r = await psEdit(i, (cur) => {
            if (!cur || cur.owner !== MYID || (cur.offers || []).length >= 6) return null;
            cur.offers = [...(cur.offers || []), o];
            return cur;
          });
          if (r) {
            invAdd(a, -an * k);
            toast('Dein Angebot liegt jetzt am Stand!');
            changed();
          }
        });
    $('psQuit').onclick = () =>
      run(async () => {
        let old = null;
        const r = await psEdit(i, (cur) => {
          if (!cur || cur.owner !== MYID) return null;
          old = cur;
          return 'delete';
        });
        if (r && old) {
          for (const o of old.offers || []) if (o.left > 0) invAdd(o.a, o.an * o.left);
          for (const [k, n] of Object.entries(old.box || {})) if (n > 0) invAdd(k, n);
          changed();
          toast('Du hast den Stand aufgegeben. Alle Sachen sind wieder in deinem Rucksack.');
          psOpen = null;
          closeModal();
        }
      });
  } else {
    sheet.querySelectorAll('.psTrade').forEach(
      (b) =>
        (b.onclick = () =>
          run(async () => {
            const loc = (d.offers || []).find((x) => x.id === b.dataset.id);
            if (!loc) return;
            if (!invHas(loc.b, loc.bn)) return toast('Dafür hast du nicht genug.');
            let deal = null;
            const r = await psEdit(i, (cur) => {
              if (!cur || cur.owner !== d.owner) return null;
              const o = (cur.offers || []).find((x) => x.id === loc.id);
              if (!o || o.left < 1) return null;
              o.left--;
              cur.box = cur.box || {};
              cur.box[o.b] = (cur.box[o.b] || 0) + o.bn;
              deal = { a: o.a, an: o.an, b: o.b, bn: o.bn };
              return cur;
            });
            if (r && deal) {
              invAdd(deal.b, -deal.bn);
              invAdd(deal.a, deal.an);
              toast(`<b>Getauscht!</b> Du hast ${psName(deal.a, deal.an)} bekommen.`);
              float(player.x, player.y - 1.6, 'getauscht!', '#b9f0a0');
              moment('ptrade1', 'Zum ersten Mal mit einem anderen Spieler getauscht!', 'coin');
              changed();
            } else toast('Schade, das Angebot ist gerade weg.');
          })),
    );
  }
}

async function psReset(i) {
  if (!isAdmin || !PSDB) return;
  try {
    await PSDB.doc('s' + i).delete();
    delete PS['s' + i];
    toast('Der Stand ist wieder frei.');
  } catch (e) {
    toast('Das hat nicht geklappt.');
  }
}
