// ================= HUD =================
const $ = (id) => document.getElementById(id);

function toggleKeys(on) {
  const el = $('keys');
  if (on === undefined) on = el.hidden;
  el.hidden = !on;
  $('bKeys').classList.toggle('on', on);
  try {
    localStorage.setItem('younes-dorf-keys', on ? '1' : '0');
  } catch (e) {}
}
$('bKeys').onclick = () => toggleKeys();
$('keysx').onclick = () => toggleKeys(false);
{
  let v = null;
  try {
    v = localStorage.getItem('younes-dorf-keys');
  } catch (e) {}
  toggleKeys(v !== '0');
}
const modal = $('modal'),
  sheet = $('sheet');
let modalClosable = true;

function renderHUD() {
  $('coinnum').textContent = state.coins;
  $('day').textContent = 'Tag ' + state.day;
  const inv = $('inv');
  let html = '';
  for (const k of INV_ORDER) {
    if (state.inv[k] > 0) {
      const sel = SEEDS.includes(k) && state.seed === k;
      html += `<button class="slot${sel ? ' sel' : ''}" data-k="${k}" title="${ITEMS[k].p}"><img src="${iconURL(k)}" alt="${ITEMS[k].p}"><span>${state.inv[k]}</span></button>`;
    }
  }
  for (const [k, n, , what] of TOOLS)
    if (hasTool(k))
      html += `<div class="slot" title="${n}: ${what}"><img src="${iconURL('tool_' + k)}" alt="${n}"></div>`;
  inv.innerHTML = html || '<div class="empty">Rucksack leer</div>';
  renderGoals();
}

$('inv').addEventListener('click', (e) => {
  const b = e.target.closest('.slot');
  if (!b || !b.dataset.k) return;
  const k = b.dataset.k;
  if (SEEDS.includes(k)) {
    state.seed = k;
    toast('Zum Pflanzen ausgewählt: <b>' + ITEMS[k].n + '</b>', 1600);
    renderHUD();
  } else if (EDIBLE.has(k)) {
    openModal(
      `<h2>${ITEMS[k].n}</h2><p>Du hast ${fmt(state.inv[k], k)}.${ITEMS[k].price ? ` Im Marktdorf bekommst du ${ITEMS[k].price} Münzen pro Stück.` : ''}</p><div class="actions"><button class="go" id="eatY">Essen</button><button id="cls">Behalten</button></div>`,
    );
    $('cls').onclick = closeModal;
    $('eatY').onclick = () => eatItem(k);
  } else
    toast(
      `<b>${ITEMS[k].p}:</b> ${state.inv[k]} Stück` +
        (ITEMS[k].price ? ` · im Marktdorf je ${ITEMS[k].price} Münzen` : ''),
      2200,
    );
});

function goals() {
  return [
    ['Hol Axt und Säge aus der Werkstatt', state.axe && state.saw],
    [
      'Hol Samen aus der Scheune und pflanze sie auf dem Acker',
      state.stats.harvest > 0 || state.plots.some((p) => p.c),
    ],
    ['Ernte deine erste Ernte', state.stats.harvest > 0],
    ['Hol dir einen Hammer aus der Werkstatt', hasTool('hammer') || state.bridge],
    [`Bau die Brücke über den Fluss (${bridgeWood()}/${BRIDGE_WOOD} Holz)`, state.bridge],
    ['Verkauf etwas an deinem Stand im Marktdorf', state.stats.sold > 0],
    ['Strom und Wasser für Haus 5 (je 60 Münzen)', state.up[5].p && state.up[5].w],
    ['Strom und Wasser für Haus 6 (je 60 Münzen)', state.up[6].p && state.up[6].w],
  ];
}

function renderGoals() {
  $('goallist').innerHTML = goals()
    .map((g) => `<li class="${g[1] ? 'done' : ''}">${g[0]}</li>`)
    .join('');
}

function hudTick() {
  const hr = (6 + state.t * 24) % 24,
    h = Math.floor(hr),
    mi = Math.floor(((hr - h) * 60) / 10) * 10;
  $('clock').textContent = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  $('bBuild').hidden = !scene || !!scene.shop;
  $('place').textContent =
    scene && scene.shop
      ? scene.label || 'Werkstatt'
      : scene
        ? `Haus ${scene.house.n} · ${scene.floor === 0 ? 'Erdgeschoss' : scene.floor === 1 ? 'Obergeschoss' : scene.floor + '. Obergeschoss'}`
        : player.x < 43
          ? 'Heimatdorf'
          : player.x < 56
            ? 'Am Fluss'
            : 'Marktdorf';
  {
    const kp = $('keys');
    if (!kp.hidden) {
      const b = Math.round($('stat').getBoundingClientRect().bottom + 12) + 'px';
      if (kp.style.top !== b) kp.style.top = b;
    }
  }
  {
    const fh = $('focushint'),
      nf = !document.hasFocus() && modal.hidden && !document.body.classList.contains('touch');
    if (fh.hidden !== !nf) fh.hidden = !nf;
  }
  const pr = $('prompt');
  if (cur && modal.hidden) {
    pr.hidden = false;
    $('ptext').textContent = cur.text;
    pr.querySelector('kbd').hidden = !cur.act;
    pr.querySelector('kbd').textContent = cur.key || 'E';
  } else pr.hidden = true;
}

function openModal(html, closable = true) {
  try {
    psOpen = null;
  } catch (e) {}
  sheet.innerHTML = html;
  modal.hidden = false;
  modalClosable = closable;
  keys.clear();
}

function closeModal() {
  if (!modalClosable) return;
  modal.hidden = true;
  try {
    psOpen = null;
  } catch (e) {}
}
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

function houseCard(h) {
  const n = h.n,
    p = hasPower(n),
    w = hasWater(n),
    up = n >= 5;
  const hasL = [`${h.beds} Schlafzimmer mit Betten (oben)`];
  if (n === 1)
    hasL.push(
      'Küche unten und oben',
      'Wohnzimmer (oben)',
      'Großer Raum unten mit Tischtennisplatte und kleinem Sofa',
      'Badezimmer mit Toilette (oben)',
    );
  else if (n < 5)
    hasL.push('Küche (unten links)', 'Wohnzimmer unten rechts und oben', 'Badezimmer mit Toilette (oben)');
  else
    hasL.push(
      'Küche (unten links)',
      'Wohnzimmer (unten rechts)',
      '2 Fahrräder vor dem Haus',
      'Plumpsklo draußen',
    );
  hasL.push('In der Küche: alles zum Backen und Kochen');
  hasL.push(`Eine eigene Ackerreihe mit 8 Beeten (Schild „Haus ${n}“ auf dem Acker)`);
  if (p) hasL.push('Strom');
  if (w) hasL.push('Wasser');
  const need = [];
  if (!p) need.push('Strom: 60 Glücksmünzen (ohne Strom gehen Herd, Ofen und Fernseher nicht)');
  if (!w) need.push('Wasser: 60 Glücksmünzen (ohne Wasser kein Wasserhahn)');
  const cfgN = houseCfg(n);
  let html = `<div class="paper"><h2>Haus ${n}</h2><p><b>Das hat das Haus:</b></p><ul>${hasL.map((x) => '<li>' + x + '</li>').join('')}</ul>
    <p><b>Das braucht das Haus noch:</b></p><ul>${need.length ? need.map((x) => '<li>' + x + '</li>').join('') : '<li>Nichts. Alles da!</li>'}</ul></div>`;
  if (up && (!p || !w)) html += `<p>Du hast <b>${state.coins}</b> Glücksmünzen.</p>`;
  const ex = extraOf(n);
  html += `<p><b>Bauen:</b> Das Haus hat ${2 + ex} Etagen${hasGarage(n) ? ' und eine Garage' : ''}.${hasGarage(n) ? '' : ` Eine Garage kostet ${GCOST.coins} Münzen, ${GCOST.plank} Bretter und ${GCOST.stone} Steine (du hast ${state.inv.stone} Steine).`}${ex < MAXEXTRA ? ` Eine neue Etage kostet ${FLOORCOST.coins} Glücksmünzen und ${FLOORCOST.plank} Bretter (du hast ${state.inv.plank}).` : ' Höher geht es nicht.'} Möbel verschieben: drinnen neben ein Möbelstück stellen und <b>P</b> drücken.</p>`;
  {
    const sb = (f, cur) =>
      Object.entries(STYLES)
        .map(([k, l]) => `<button data-f="${f}" data-s="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`)
        .join('');
    html += `<div class="looks"><img src="${houseCv(h, n).toDataURL()}" alt="So sieht Haus ${n} von außen aus"><div><p><b>Aussehen</b> (kostenlos, du brauchst einen Hammer)</p>
      <div class="stylerow"><span>Ganzes Haus</span>${sb('all', cfgN.fs.every((x) => x === cfgN.base) ? cfgN.base : '')}</div>
      ${cfgN.fs.map((x, j) => `<div class="stylerow"><span>${j + 2}. Obergeschoss</span>${sb(j, x)}</div>`).join('')}</div></div>`;
  }
  html += '<div class="actions">';
  if (!hasGarage(n))
    html += `<button class="go" id="uG" ${state.coins < GCOST.coins || state.inv.plank < GCOST.plank || state.inv.stone < GCOST.stone ? 'disabled' : ''}>Garage bauen</button>`;
  if (ex < MAXEXTRA)
    html += `<button class="go" id="uF" ${state.coins < FLOORCOST.coins || state.inv.plank < FLOORCOST.plank ? 'disabled' : ''}>Etage anbauen</button>`;
  if (up && !p)
    html += `<button class="go" id="uP" ${state.coins < 60 ? 'disabled' : ''}>Strom anschließen: 60 Münzen</button>`;
  if (up && !w)
    html += `<button class="go" id="uW" ${state.coins < 60 ? 'disabled' : ''}>Wasser anschließen: 60 Münzen</button>`;
  html += '<button id="cls">Schließen</button></div>';
  openModal(html);
  $('cls').onclick = closeModal;
  const buyUp = (k) => {
    if (state.coins < 60) return;
    state.coins -= 60;
    state.up[n][k] = 1;
    moment(
      k + n,
      k === 'p' ? `Haus ${n} hat jetzt Strom!` : `Haus ${n} hat jetzt Wasser!`,
      k === 'p' ? 'bolt' : 'drop',
    );
    if (state.up[5].p && state.up[5].w && state.up[6].p && state.up[6].w)
      moment('alldone', 'Alle 6 Häuser haben Strom und Wasser!', 'house');
    toast(
      k === 'p'
        ? `<b>Haus ${n} hat jetzt Strom!</b> Nachts leuchten die Fenster.`
        : `<b>Haus ${n} hat jetzt Wasser!</b>`,
      4000,
    );
    changed();
    if (state.up[5].p && state.up[5].w && state.up[6].p && state.up[6].w)
      toast(
        '<b>Geschafft!</b> Jetzt haben alle 6 Häuser Strom und Wasser. Das ganze Dorf feiert dich!',
        6000,
      );
    houseCard(h);
  };
  if ($('uF')) $('uF').onclick = () => floorChooser(h);
  if ($('uG'))
    $('uG').onclick = () => {
      buildGarage(h);
      houseCard(h);
    };
  sheet.querySelectorAll('.stylerow button').forEach(
    (b) =>
      (b.onclick = () => {
        if (!hasTool('hammer'))
          return toast('Zum Umbauen brauchst du einen <b>Hammer</b> aus der Werkstatt.');
        const hm = homeOf(n),
          f = b.dataset.f,
          sv = b.dataset.s;
        if (f === 'all') {
          hm.style = sv;
          hm.fs = (hm.fs || []).map(() => sv);
        } else {
          hm.fs = hm.fs || [];
          hm.fs[+f] = sv;
        }
        float(player.x, player.y - 1.6, 'umgebaut!', '#ffd23f');
        moment('style_' + sv, 'Ein Haus im Stil „' + STYLES[sv] + '“ gestaltet!', 'house');
        changed();
        houseCard(h);
      }),
  );
  if ($('uP')) $('uP').onclick = () => buyUp('p');
  if ($('uW')) $('uW').onclick = () => buyUp('w');
}

const SKINS = [
  {
    id: 'space',
    n: 'Weltraumheld',
    p: 450,
    set: { hair: '#f2d16b', shirt: '#c9d3dc', pants: '#5b6b7a', shoes: '#e5484d', cl: 0 },
  },
  {
    id: 'pirat',
    n: 'Pirat',
    p: 400,
    set: { hair: '#1a1a1a', shirt: '#f4efe2', pants: '#2b2b2b', shoes: '#4a2e1a', cl: 0 },
  },
  {
    id: 'ninja',
    n: 'Ninja',
    p: 480,
    set: { hair: '#1d1d24', shirt: '#1d1d24', pants: '#1d1d24', shoes: '#1d1d24', cl: 0 },
  },
  {
    id: 'zauber',
    n: 'Zauberer',
    p: 500,
    set: { hair: '#e8e8e8', shirt: '#5b3fa0', pants: '#5b3fa0', shoes: '#3a2a6a', cl: 2 },
  },
  {
    id: 'clown',
    n: 'Clown',
    p: 420,
    set: { hair: '#e5484d', shirt: '#ffd23f', pants: '#3fa7d6', shoes: '#e5484d', cl: 0 },
  },
];

function openLook(first) {
  const L = Object.assign({ g: 'm', hs: 0, cl: 0, eye: '#4a2e1a' }, state.look);
  state.skins = state.skins || {};
  const skinRow = () =>
    first
      ? ''
      : `<div><label>Skins</label><div class="opts txt" id="skinRow">${SKINS.map((k) => `<button data-skin="${k.id}">${k.n}${state.skins[k.id] ? '' : ' · ' + k.p + ' 🪙'}</button>`).join('')}</div></div>`;
  const trow = (key, label, arr) =>
    `<div><label>${label}</label><div class="opts txt">${arr.map(([n, v]) => `<button data-key="${key}" data-c="${v}" class="${String(L[key]) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
  const row = (key, label, arr) =>
    `<div><label>${label}</label><div class="opts">${arr.map((c) => `<button data-key="${key}" data-c="${c}" style="background:${c}" class="${L[key] === c ? 'on' : ''}" aria-label="${label} ${c}"></button>`).join('')}</div></div>`;
  openModal(
    `<h2>${first ? 'Willkommen im Dorf!' : 'Deine Figur'}</h2>
    ${first ? '<p>Gestalte zuerst deine Figur. Danach geht es los.</p>' : ''}
    <div class="look"><canvas id="prev" width="120" height="160"></canvas><div class="sw">
    <div><label for="pname">Name</label><input id="pname" maxlength="14" placeholder="Dein Name" autocomplete="off" value="${esc(state.name)}"></div>
    ${trow('g', 'Typ', [
      ['Junge', 'm'],
      ['Mädchen', 'f'],
    ])}${trow(
      'hs',
      'Frisur',
      HAIRSTYLES.map((n, i) => [n, i]),
    )}${trow(
      'cl',
      'Kleidung',
      CLOTHES.map((n, i) => [n, i]),
    )}
    ${row('skin', 'Haut', SKIN)}${row('hair', 'Haare', HAIR)}${row('eye', 'Augen', EYES)}${row('shirt', 'Oberteil', SHIRT)}${row('pants', 'Hose / Rock', PANTS)}${row('shoes', 'Schuhe', SHOES)}${skinRow()}</div></div>
    ${first ? '<p class="keys">Laufen: Pfeiltasten oder WASD · Aktion: E · Springen: Leertaste · Samen wechseln: Q. Am Handy: Steuerkreuz links, E- und Hopp-Knopf rechts.</p>' : ''}
    <div class="actions"><button class="go" id="ok">${first ? "Los geht's!" : 'Fertig'}</button></div>
    <div class="codebox"><label for="pcode">Code</label><input id="pcode" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="Geheimcode"><button id="pcodeok">Freischalten</button></div>`,
    !first,
  );
  const pc = $('prev').getContext('2d');
  let f = 0;
  const faces = ['down', 'left', 'up', 'right'];
  const draw = () => {
    pc.setTransform(1, 0, 0, 1, 0, 0);
    pc.fillStyle = '#8fd0ff';
    pc.fillRect(0, 0, 120, 160);
    pc.fillStyle = '#7cc35a';
    pc.fillRect(0, 118, 120, 42);
    pc.setTransform(3, 0, 0, 3, 60, 136);
    drawPerson(pc, 0, 0, L, 'down', 0, { ang: Math.PI / 2 + f * 0.035 });
  };
  draw();
  const iv = setInterval(() => {
    if (modal.hidden || !$('prev')) {
      clearInterval(iv);
      return;
    }
    f++;
    draw();
  }, 30);
  const mark = () =>
    sheet
      .querySelectorAll('.opts button')
      .forEach((x) => x.classList.toggle('on', String(L[x.dataset.key]) === x.dataset.c));
  sheet.querySelectorAll('.opts button').forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.key;
        L[k] = k === 'hs' || k === 'cl' ? +b.dataset.c : b.dataset.c;
        if (k === 'g') {
          if (L.g === 'f' && L.hs === 0) L.hs = 1;
          if (L.g === 'm') {
            L.hs = 0;
            L.cl = 0;
          }
        }
        mark();
        draw();
      }),
  );
  sheet.querySelectorAll('[data-skin]').forEach(
    (b) =>
      (b.onclick = () => {
        const k = SKINS.find((x) => x.id === b.dataset.skin);
        if (!k) return;
        if (!state.skins[k.id]) {
          if (state.coins < k.p)
            return toast(`Der Skin <b>${k.n}</b> kostet ${k.p} Glücksmünzen. Du hast nur ${state.coins}.`);
          state.coins -= k.p;
          state.skins[k.id] = 1;
          changed();
          b.textContent = k.n;
          toast(`Skin <b>${k.n}</b> gekauft! Klick auf <b>Fertig</b>, um ihn zu behalten.`);
        }
        Object.assign(L, k.set);
        mark();
        draw();
      }),
  );
  {
    const ci = $('pcode');
    const go = () => {
      if (tryCode(ci.value)) {
        ci.value = '';
        $('pcodeok').textContent = '✓ Admin an';
      } else {
        ci.value = '';
        ci.focus();
      }
    };
    $('pcodeok').onclick = go;
    ci.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        go();
      }
    };
  }
  $('ok').onclick = () => {
    const nm = ($('pname').value || '').trim().slice(0, 14);
    if (!nm) {
      toast('Gib deiner Figur zuerst einen Namen.');
      $('pname').focus();
      return;
    }
    state.look = L;
    state.name = nm;
    state.created = true;
    modalClosable = true;
    closeModal();
    changed();
    if (first)
      toast(
        `Hallo <b>${esc(state.name || 'du')}</b>! Du hast <b>100 Glücksmünzen</b>. Geh zuerst in die <b>Werkstatt</b> (unten rechts) und hol Axt und Säge.`,
        6000,
      );
  };
}

$('wakeup').onclick = () => wake();
$('bAdmin').onclick = () => openAdmin();
$('tvp').onclick = () => tvStep(-1);
$('tvx').onclick = () => tvStep(1);
$('tvoff').onclick = () => closeTV();
$('bBuild').onclick = () => setBuild(!buildMode);
$('bDone').onclick = () => setBuild(false);
$('bShop').onclick = () => furnShop();
document.querySelectorAll('#views button').forEach((b) => (b.onclick = () => setView(b.dataset.v)));
$('bLook').onclick = () => openLook(false);
$('bGoals').onclick = () => {
  $('goals').hidden = !$('goals').hidden;
};
$('bNew').onclick = () => {
  const online = (typeof PSDB !== 'undefined' && PSDB) || (typeof LOCKDB !== 'undefined' && LOCKDB);
  openModal(
    `<h2>Neu anfangen?</h2><p>Das gilt <b>nur für dich</b>. Die anderen Spieler spielen ganz normal weiter.</p><p>Du verlierst alles, was du bisher hattest: Münzen, Rucksack, Werkzeuge, Ernte, Möbel und Figur${online ? ', außerdem deinen Stand auf dem Dorfplatz mit allem darin und du ziehst aus deinem Haus aus: Für dich ist es wieder abgeschlossen, die anderen Bewohner behalten es. Wohnt dort sonst niemand, wird das Haus wieder frei' : ''}.</p><div class="actions"><button class="go" id="yes">Ja, alles löschen und neu starten</button><button id="no">Abbrechen</button></div>`,
  );
  $('no').onclick = closeModal;
  $('yes').onclick = async () => {
    $('yes').disabled = true;
    const shared = viewerPeers().filter((p) => !p.sameTab).length > 0,
      keepDay = state.day,
      keepT = state.t;
    try {
      await releaseMine();
    } catch (e) {}
    try {
      localStorage.removeItem(KNOWNKEY);
    } catch (e) {}
    scene = null;
    player.sleep = null;
    player.sit = null;
    player.work = null;
    player.carry = null;
    player.mount = null;
    try {
      localStorage.removeItem(SAVEKEY);
    } catch (e) {}
    const wasAdmin = isAdmin,
      keepBridge = !!state.bridge,
      keepBW = state.bridgeWood || 0,
      keepHarbor = !!state.harbor;
    state = freshState();
    state.bridge = keepBridge;
    state.bridgeWood = keepBW;
    state.harbor = keepHarbor;
    if (shared) {
      state.day = keepDay;
      state.t = keepT;
    }
    if (wasAdmin) setAdmin(true);
    buildWorld();
    if (state.bridge) applyBridge();
    initEntities();
    closeModal();
    renderHUD();
    openLook(true);
  };
};

async function releaseMine() {
  if (!MYID) return;
  const jobs = [];
  if (typeof PSDB !== 'undefined' && PSDB) {
    const i = psMine();
    if (i >= 0) jobs.push(psEdit(i, (cur) => (cur && cur.owner === MYID ? 'delete' : null)).catch(() => {}));
  }
  if (typeof LOCKDB !== 'undefined' && LOCKDB) {
    for (const id in LOCKS) {
      const L = LOCKS[id];
      if (!L || !(L.uid === MYID || (L.res && L.res[MYID]))) continue;
      // nur selbst ausziehen: wohnt sonst niemand mehr drin, wird das Haus wieder frei
      jobs.push(
        lockEdit(id, (cur) => {
          if (!cur) return null;
          if (!cur.res) return null;
          delete cur.res[MYID];
          const left = Object.keys(cur.res);
          if (!left.length) return 'delete';
          if (cur.uid === MYID) {
            cur.uid = left[0];
            cur.by = cur.res[left[0]];
          }
          return cur;
        }).catch(() => {}),
      );
    }
  }
  await Promise.all(jobs);
}
