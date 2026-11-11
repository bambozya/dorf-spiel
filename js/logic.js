// ================= Logik =================
const OUT = { S: solid, w: MAP_W, h: MAP_H };
const curG = () => (scene ? scene.map : OUT);
let AIR = false;

function solidAt(g, x, y) {
  const i = Math.floor(x),
    j = Math.floor(y);
  if (i < 0 || j < 0 || i >= g.w || j >= g.h) return true;
  if (g === OUT && !state.bridge && j >= 28 && j < 30 && i >= BX0 && i < BX0 + BLEN && x < bridgeEnd() - 0.05)
    return false;
  if (AIR && g === OUT) {
    const h = HOP[j * g.w + i];
    if (h === 2 || (h === 1 && state.chopped.includes(TREEAT[j * g.w + i]))) return false;
  }
  return g.S[j * g.w + i] === 1;
}

function blocked(x, y, g) {
  g = g || curG();
  const hw = 0.28;
  return (
    solidAt(g, x - hw, y - 0.22) ||
    solidAt(g, x + hw, y - 0.22) ||
    solidAt(g, x - hw, y - 0.02) ||
    solidAt(g, x + hw, y - 0.02)
  );
}

function moveBody(o, dx, dy, g) {
  AIR = o === player && player.jz > 14;
  if (dx && !blocked(o.x + dx, o.y, g)) o.x += dx;
  if (dy && !blocked(o.x, o.y + dy, g)) o.y += dy;
  AIR = false;
}

// Springen
function jump() {
  if (
    player.jz > 0 ||
    player.sit ||
    player.sleep ||
    player.work ||
    tv ||
    !modal.hidden ||
    (player.mount && player.mount.type === 'bike')
  )
    return;
  player.jv = player.mount ? 240 : 260;
  player.jz = 0.01;
  chips(player.x, player.y, 6, ['#c9b48a', '#a8865f', '#e2cfa4'], 2);
}

function jumpTick(dt) {
  if (!(player.jz > 0)) return;
  player.jv -= 900 * dt;
  player.jz += player.jv * dt;
  if (player.jz <= 0) {
    player.jz = 0;
    player.jv = 0;
    chips(player.x, player.y, 8, ['#c9b48a', '#a8865f', '#e2cfa4'], 2);
    if (blocked(player.x, player.y)) {
      outer: for (let r = 0.3; r < 3; r += 0.3)
        for (let a = 0; a < 6.28; a += 0.4) {
          const nx = player.x + Math.cos(a) * r,
            ny = player.y + Math.sin(a) * r;
          if (!blocked(nx, ny)) {
            player.x = nx;
            player.y = ny;
            break outer;
          }
        }
    }
    if (player.mount) {
      player.mount.o.x = player.x;
      player.mount.o.y = player.y;
    }
  }
}

function toast(html, ms) {
  const d = document.createElement('div');
  d.className = 'toast panel';
  d.innerHTML = html;
  const box = document.getElementById('toasts');
  box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => d.remove(), ms || 3400);
}
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

function float(x, y, text, col) {
  floats.push({ x, y, text, col, t: 0 });
}

function has(o) {
  return Object.entries(o).every(([k, n]) => state.inv[k] >= n);
}

function take(o) {
  for (const [k, n] of Object.entries(o)) state.inv[k] -= n;
}

function give(o) {
  for (const [k, n] of Object.entries(o)) state.inv[k] += n;
}

function changed() {
  for (const v of [200, 500, 1000])
    if (state.coins >= v) moment('coins' + v, `${v} Glücksmünzen gesammelt!`, 'coin');
  renderHUD();
  save();
}

function cycleSeed() {
  const i = SEEDS.indexOf(state.seed);
  state.seed = SEEDS[(i + 1) % 3];
  toast('Ausgewählt: <b>' + ITEMS[state.seed].n + '</b>', 1600);
  renderHUD();
}

function newDay(slept) {
  const wasAsleep = !!player.sleep;
  wake();
  state.mined = [];
  if (wasAsleep) moment('sleep1', 'Die erste Nacht im eigenen Bett geschlafen.', 'bed');
  state.day++;
  state.t = 0;
  state.chopped = [];
  state.lastBuyers = state.buyersToday;
  state.buyersToday = 0;
  state.buyQ = schedule();
  toast(
    (wasAsleep ? 'Alle haben ausgeschlafen. ' : '') +
      `<b>Guten Morgen! Tag ${state.day}.</b> Die Bäume sind nachgewachsen und in der Scheune liegen neue Samen.`,
    4500,
  );
  if (state.bridge)
    toast(`Heute kommen <b>${state.buyQ.length}</b> Kunden im Marktdorf an deinem Stand vorbei.`, 4500);
  changed();
}

function interactions() {
  if (scene) return interiorInteractions();
  if (player.work) return [];
  const L = [];
  if (player.mount) {
    L.push({ x: player.x, y: player.y, r: 99, text: 'Absteigen', act: dismount });
    return L;
  }
  HOUSES.forEach((h) =>
    L.push({ x: h.x + 3, y: h.y + h.h + 0.5, r: 1.5, text: houseDoorText(h), act: () => tryEnterHouse(h) }),
  );
  for (const n in GARAGES)
    if (hasGarage(+n)) {
      const g = GARAGES[n],
        hm = state.homes[n];
      L.push({
        x: g.x + 1.5,
        y: g.y + 2.4,
        r: 1.4,
        text: hm.gOpen ? 'Garagentor schließen' : 'Garagentor öffnen',
        act: () => {
          hm.gOpen = !hm.gOpen;
          float(g.x + 1.5, g.y + 0.8, hm.gOpen ? 'surrr… auf' : 'surrr… zu', '#fff8e6');
          changed();
        },
      });
    }
  L.push({ x: 34.5, y: 8.5, r: 1.6, text: 'Scheune betreten', act: enterBarn });
  L.push({ x: 34, y: 44.5, r: 1.6, text: 'Werkstatt betreten', act: enterShop });
  ROCKS.forEach((rk) => {
    if (!(state.mined || []).includes(rk.id))
      L.push({
        x: rk.x + 0.5,
        y: rk.y + 0.9,
        r: 1.25,
        text: hasTool('pickaxe') ? 'Felsen abbauen' : 'Felsen abbauen (Spitzhacke fehlt)',
        act: () => startMine(rk),
      });
  });
  if (!state.harbor) {
    L.push({
      x: 4.5,
      y: 10.3,
      r: 1.8,
      text: `Hafen freischalten (${HARBOR_COST} Münzen)`,
      act: unlockHarbor,
    });
    L.push({ x: 9.3, y: 4.5, r: 1.8, text: `Hafen freischalten (${HARBOR_COST} Münzen)`, act: unlockHarbor });
  } else L.push({ x: 3.8, y: 4.75, r: 1.3, text: 'Ins Ruderboot steigen: aufs Meer fahren', act: enterSea });
  if (state.bridge)
    L.push({
      x: TAILOR.x + 2.5,
      y: TAILOR.y + TAILOR.h + 0.5,
      r: 1.4,
      text: 'Schneiderei betreten',
      act: enterTailor,
    });
  {
    const w = nearWater();
    if (w && !player.mount)
      L.push({
        x: player.x + w.d * 0.9,
        y: player.y,
        r: 1.6,
        text: hasTool('rod') ? 'Angeln' : 'Angeln (Angel fehlt)',
        act: () => startFish(w),
      });
  }
  L.push({
    x: 39,
    y: 33.5,
    r: 1.3,
    text: 'Plumpsklo benutzen',
    act: () => {
      toast('<b>Plumpsklo:</b> Uff… erledigt! Hände waschen nicht vergessen.');
      float(player.x, player.y - 1.5, 'puh!', '#fff8e6');
    },
  });
  L.push({
    x: 70,
    y: 28.4,
    r: 2,
    text: 'Aus dem Brunnen im Marktdorf trinken',
    act: () => {
      drinkAt(WELL2.x + 1, WELL2.y + 1);
      if (Math.random() < 0.3)
        setTimeout(
          () =>
            toast('Am Grund glitzert eine Glücksmünze. Die hat bestimmt jemand für Glück hineingeworfen!'),
          2600,
        );
    },
  });
  L.push({
    x: 20,
    y: 26.4,
    r: 2,
    text: 'Wasser aus dem Brunnen trinken',
    act: () => drinkAt(WELL.x + 1, WELL.y + 1),
  });
  PSTALLS.forEach((s, i) =>
    L.push({ x: s.x + 1, y: s.y + 0.6, r: 1.75, text: psText(i), act: () => psAct(i) }),
  );
  PLOTS.forEach((p, i) => {
    const s = state.plots[i];
    if (!s) return;
    let text, act;
    if (!canUseRow(p.row)) {
      const mh = myHouses();
      L.push({
        x: p.x + 0.5,
        y: p.y + 0.7,
        r: 1.05,
        text: `Feldreihe von Haus ${p.row + 1}`,
        act: () =>
          toast(
            mh.length
              ? `Diese Reihe gehört zu <b>Haus ${p.row + 1}</b>. Deine Reihe ist die von Haus ${mh.join(' und ')}.`
              : `Diese Reihe gehört zu <b>Haus ${p.row + 1}</b>. Zieh zuerst in ein Haus ein, dann bekommst du eine eigene Feldreihe.`,
            4500,
          ),
      });
      return;
    }
    if (!s.c) {
      const sd = state.inv[state.seed] > 0 ? state.seed : SEEDS.find((k) => state.inv[k] > 0);
      if (sd) {
        text = `${ITEMS[ITEMS[sd].crop].n} pflanzen`;
        act = () => {
          state.inv[sd]--;
          s.c = ITEMS[sd].crop;
          s.g = 0;
          s.w = 0;
          float(p.x + 0.5, p.y, 'gepflanzt!', '#b9f0a0');
          changed();
        };
      } else {
        text = 'Keine Samen: hol welche in der Scheune';
        act = () =>
          toast(
            'Du hast keine Samen. In der <b>Scheune</b> gibt es jeden Tag neue, im Marktdorf kannst du Samen kaufen, und auf dem Dorfplatz tauschen andere Spieler.',
          );
      }
    } else if (s.g < CROPS[s.c].grow) {
      const pc = Math.floor((s.g / CROPS[s.c].grow) * 100);
      if (hasTool('can') && !s.w) {
        text = `${ITEMS[s.c].n} gießen (${pc} %)`;
        act = () => {
          s.w = 1;
          player.ang = Math.atan2(p.y + 0.6 - player.y, p.x + 0.5 - player.x);
          player.work = { kind: 'water', t: 0, plot: p };
        };
      } else {
        text = `${ITEMS[s.c].n} wächst${s.w ? ' (gegossen)' : ''}… ${pc} %`;
        act = null;
      }
    } else {
      text =
        s.c === 'wheat' && hasTool('scythe')
          ? 'Weizen mit der Sense ernten (alle Felder)'
          : `${ITEMS[s.c].p} ernten`;
      act = () =>
        startHarvest(p, () => {
          if (!s.c) return;
          if (s.c === 'wheat' && hasTool('scythe')) {
            let n = 0;
            state.plots.forEach((q, qi) => {
              if (q.c === 'wheat' && q.g >= CROPS.wheat.grow && q !== s && canUseRow(PLOTS[qi].row)) {
                n += 2;
                q.c = null;
                q.g = 0;
                q.w = 0;
                chips(PLOTS[qi].x + 0.5, PLOTS[qi].y + 0.6, 6, ['#e8c547', '#d6aa45'], 6);
              }
            });
            if (n) {
              state.inv.wheat += n;
              state.stats.harvest += n;
              float(player.x, player.y - 2.2, 'Sense: +' + n + ' Weizen', '#ffe08a');
            }
          }
          const y = CROPS[s.c].yield + (hasTool('shovel') && s.c !== 'wheat' ? 1 : 0);
          s.w = 0;
          state.inv[s.c] += y;
          state.stats.harvest += y;
          moment('harvest1', 'Deine allererste Ernte: ' + ITEMS[s.c].p + '!', s.c);
          if (state.stats.harvest >= 50)
            moment('harvest50', 'Schon 50 Sachen geerntet. Ein echter Bauer!', 'wheat');
          float(p.x + 0.5, p.y, '+' + fmt(y, s.c), '#ffb36b');
          s.c = null;
          s.g = 0;
          changed();
        });
    }
    L.push({ x: p.x + 0.5, y: p.y + 0.7, r: 1.05, text, act });
  });
  TREES.forEach((t) => {
    if (state.chopped.includes(t.id)) return;
    L.push({
      x: t.x + 0.5,
      y: t.y + 0.9,
      r: 1.25,
      text: state.axe ? 'Baum fällen (+2 Holz)' : 'Baum fällen (Axt fehlt)',
      act: () => chop(t),
    });
  });
  horses.forEach((h) =>
    L.push({ x: h.x, y: h.y, r: 1.4, text: `Auf ${h.name} reiten`, act: () => mount('horse', h) }),
  );
  bikes.forEach((b) =>
    L.push({
      x: b.x,
      y: b.y,
      r: 1.1,
      text: `Fahrrad fahren (von Haus ${b.house})`,
      act: () => mount('bike', b),
    }),
  );
  villagers.forEach((v) =>
    L.push({
      x: v.x,
      y: v.y,
      r: 1.4,
      text: `Mit ${v.name} reden`,
      act: () => {
        toast(`<b>${v.name}:</b> ${pick(v.lines, Math.random)}`, 4500);
        v.pause = 3;
      },
    }),
  );
  if (!state.bridge)
    L.push({
      x: Math.min(51, bridgeEnd() - 0.8),
      y: 28.9,
      r: 1.9,
      text: `Brücke ${bridgeWood() ? 'weiterbauen' : 'bauen'} (${bridgeWood()}/${BRIDGE_WOOD} Holz${hasTool('hammer') ? '' : ', Hammer fehlt'})`,
      act: buildBridge,
    });
  STALLS2.forEach((s, i) => {
    const cx = s.x + 1,
      cy = s.y + 0.6;
    if (i === MYSTALL) {
      const n = SELL.reduce((a, k) => a + state.stall[k], 0),
        mine = SELL.some((k) => state.inv[k] > 0);
      L.push({
        x: cx,
        y: cy,
        r: 1.75,
        text: mine ? 'Ware auf deinen Stand legen' : `Dein Stand: ${n} Sachen ausgelegt`,
        act: stallAct,
      });
    } else if (sellers2[i].state !== 'stall')
      L.push({
        x: cx,
        y: cy,
        r: 1.75,
        text: 'Stand geschlossen',
        act: () =>
          toast(
            'Der Stand ist geschlossen. Die Händler schlafen nachts in ihren Häusern und kommen morgens wieder.',
          ),
      });
    else if (i < 3) {
      const o = SEEDSHOP[i];
      L.push({
        x: cx,
        y: cy,
        r: 1.75,
        text: `Kaufe ${fmtB(o.get)} für ${o.cost} Münzen`,
        act: () => {
          if (state.coins < o.cost) return toast(`Dafür brauchst du ${o.cost} Glücksmünzen.`);
          state.coins -= o.cost;
          give(o.get);
          float(player.x, player.y - 1.5, '-' + o.cost, '#ffd23f');
          toast('Gekauft: <b>' + fmtB(o.get) + '</b>');
          changed();
        },
      });
    } else
      L.push({
        x: cx,
        y: cy,
        r: 1.75,
        text: 'Hallo sagen',
        act: () =>
          toast(
            '<b>Händler:</b> ' +
              pick(
                [
                  'Willkommen im Marktdorf!',
                  'Hier wird mit Münzen bezahlt, nicht getauscht.',
                  'Dein Stand ist gleich links am Eingang, der mit dem grünen Dach.',
                  'Heute ist viel los auf dem Markt!',
                ],
                Math.random,
              ),
          ),
      });
  });
  return L;
}

let cur = null;

function findCur() {
  let best = null,
    bd = 1;
  for (const it of interactions()) {
    let d = Math.hypot(it.x - player.x, it.y - player.y) / (it.r + 0.8);
    if (view === '3d' && !(scene && scene.sea) && it.r < 50) {
      const ax = it.x - player.x,
        ay = it.y - player.y,
        l = Math.hypot(ax, ay) || 1;
      if ((ax * Math.cos(player.ang) + ay * Math.sin(player.ang)) / l < 0.2 && l > 0.5) d += 0.6;
    }
    if (d < bd) {
      bd = d;
      best = it;
    }
  }
  cur = best;
}

function doAct() {
  if (!modal.hidden || tv || player.work) return;
  if (player.sleep) {
    wake();
    return;
  }
  if (player.sit) {
    standUp();
    return;
  }
  findCur();
  if (cur && cur.act) cur.act();
}

function barnAct() {
  if (state.barnDay === state.day) return toast('Die Scheune ist für heute leer. Morgen gibt es neue Samen.');
  const g = state.day === 1 ? { seed_carrot: 4, seed_wheat: 2 } : { seed_carrot: 3, seed_wheat: 1 };
  give(g);
  state.barnDay = state.day;
  toast('Aus der Scheune: <b>' + fmtB(g) + '</b>');
  float(34.5, 7.5, '+Samen', '#b9f0a0');
  changed();
}

function shopAct() {
  if (!state.axe || !state.saw) {
    state.axe = true;
    state.saw = true;
    moment('tools', 'Axt und Säge aus der Werkstatt geholt.', 'axe');
    toast(
      'Du hast jetzt eine <b>Axt</b> und eine <b>Säge</b>! Fäll Bäume und säg das Holz hier zu Brettern.',
      4500,
    );
    changed();
    return;
  }
  if (state.inv.wood < 1) return toast('Du brauchst Holz. Fäll mit der Axt einen Baum.');
  state.inv.wood--;
  state.inv.plank += 2;
  state.stats.planks += 2;
  float(34, 43.5, '+2 Bretter', '#ffb36b');
  changed();
}

function chop(t) {
  startChop(t);
}

function trade(t) {
  if (!has(t.give)) return toast(`<b>${t.name}:</b> Dafür brauche ich ${fmtB(t.give)} von dir.`);
  take(t.give);
  give(t.get);
  toast(`<b>Getauscht!</b> ${fmtB(t.give)} → ${fmtB(t.get)}`);
  float(player.x, player.y - 1.6, 'getauscht!', '#b9f0a0');
  changed();
}
let bridgeBusy = false;

async function buildBridge() {
  if (state.bridge || bridgeBusy) return;
  if (!hasTool('hammer'))
    return toast('Zum Bauen brauchst du einen <b>Hammer</b>. Den gibt es in der Werkstatt.', 4500);
  if (state.inv.wood < 1)
    return toast(
      `Du hast kein Holz dabei. Die Brücke braucht insgesamt <b>${BRIDGE_WOOD} Holz</b>, ${bridgeWood()} sind schon verbaut. Holz bekommst du durch Bäumefällen.`,
      5000,
    );
  bridgeBusy = true;
  let used = 0,
    total = bridgeWood();
  try {
    if (WORLDDB) {
      const ref = WORLDDB.doc('bridge');
      let ok = false;
      for (let t = 0; t < 8 && !ok; t++) {
        const a = await ref.acquire({ holder: BR_HOLDER, ttlMs: 3000 });
        if (a.acquired) {
          const g = await ref.get();
          const d = g.exists ? g.data() || {} : {};
          const cur = d.built ? BRIDGE_WOOD : Math.max(0, +d.w || 0, bridgeWood());
          used = Math.min(state.inv.wood, BRIDGE_WOOD - cur);
          total = cur + used;
          if (used > 0)
            await ref.set({
              w: total,
              built: total >= BRIDGE_WOOD,
              by: total >= BRIDGE_WOOD ? (state.name || 'Jemand').slice(0, 14) : d.by || null,
              at: Date.now(),
            });
          ok = true;
        } else await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      }
      if (!ok) throw new Error('busy');
    } else {
      used = Math.min(state.inv.wood, BRIDGE_WOOD - total);
      total += used;
    }
  } catch (e) {
    bridgeBusy = false;
    return toast('Das hat nicht geklappt. Versuch es gleich nochmal.');
  }
  bridgeBusy = false;
  if (used <= 0) return bridgeSet(total);
  state.inv.wood -= used;
  player.work = { kind: 'build', t: 0, dur: 1.2, x: Math.min(51.5, bridgeEnd()), y: 28.9 };
  bridgeSet(total, true);
  if (!state.bridge)
    toast(
      `<b>${used} Holz verbaut!</b> Die Brücke ist jetzt ${Math.round((total / BRIDGE_WOOD) * 100)} % fertig (${total}/${BRIDGE_WOOD}). Für den Rest fehlen noch ${BRIDGE_WOOD - total} Holz.`,
      5000,
    );
  float(player.x, player.y - 1.6, '+' + used + ' Holz verbaut', '#ffd23f');
  changed();
}
const BR_HOLDER = 'b' + Math.random().toString(36).slice(2);

function bridgeSet(w, mine) {
  w = Math.max(0, Math.min(BRIDGE_WOOD, w | 0));
  if (state.bridge) return;
  if (w >= BRIDGE_WOOD) {
    state.bridge = true;
    state.bridgeWood = BRIDGE_WOOD;
    applyBridge();
    try {
      build3D();
    } catch (e) {}
    moment('bridge', 'Die Brücke über den Fluss gebaut!', 'bridge');
    if (mine) {
      toast('<b>Die Brücke steht!</b> Jetzt kannst du ins Marktdorf und dort deine Ernte verkaufen.', 5000);
      float(50, 27.5, 'Brücke gebaut!', '#ffd23f');
    }
    changed();
    return;
  }
  if (w === (state.bridgeWood || 0)) return;
  state.bridgeWood = w;
  if (GCV) buildGround();
  changed();
}

function stallAct() {
  let moved = 0;
  for (const k of SELL) {
    if (state.inv[k] > 0) {
      state.stall[k] += state.inv[k];
      moved += state.inv[k];
      state.inv[k] = 0;
    }
  }
  if (moved) {
    toast(
      `Du hast <b>${moved} Sachen</b> auf deinen Stand gelegt. Die Kunden kaufen sie im Laufe des Tages.`,
      4500,
    );
    changed();
  } else {
    const n = SELL.reduce((a, k) => a + state.stall[k], 0);
    toast(
      n
        ? `Auf deinem Stand liegen ${n} Sachen. Heute waren schon ${state.buyersToday} Kunden da.`
        : 'Dein Stand ist leer. Bring Ernte oder Brot mit!',
    );
  }
}

function mount(type, o) {
  player.mount = { type, o };
  player.x = o.x;
  player.y = o.y;
  if (blocked(player.x, player.y)) {
    player.mount = null;
    return;
  }
  if (type === 'horse') moment('ride1', 'Zum ersten Mal auf ' + o.name + ' geritten!', 'horse');
  toast(type === 'horse' ? `Du reitest auf <b>${o.name}</b>. Hü!` : "Los geht's mit dem Fahrrad!", 2000);
}

function dismount() {
  const o = player.mount.o;
  o.x = player.x;
  o.y = player.y;
  if (player.mount.type === 'horse') {
    const inP =
      o.x > PADDOCK.x0 - 0.5 && o.x < PADDOCK.x1 + 0.5 && o.y > PADDOCK.y0 - 0.5 && o.y < PADDOCK.y1 + 0.5;
    o.home = inP ? Object.assign({}, PADDOCK) : { x0: o.x - 2, y0: o.y - 1.5, x1: o.x + 2, y1: o.y + 1.5 };
    o.tx = o.x;
    o.ty = o.y;
    o.wait = 2;
  }
  player.mount = null;
  let tries = [
    [0, 0.6],
    [0.7, 0],
    [-0.7, 0],
    [0, -0.6],
  ];
  for (const [a, b] of tries) {
    if (!blocked(player.x + a, player.y + b)) {
      player.x += a;
      player.y += b;
      break;
    }
  }
}

function update(dt) {
  now += dt;
  {
    const hr = 6 + state.t * 24;
    state.t += dt * (hr >= 22 ? 8 / 24 / 300 : 16 / 24 / 240);
  }
  if (state.t >= 1) {
    if (!serverClock() && isLeader()) newDay();
    else state.t = 0.9999;
  }
  for (const p of state.plots)
    if (p.c && p.g < CROPS[p.c].grow) {
      p.g += dt * (p.w ? 2 : 1);
      if (p.g >= CROPS[p.c].grow) renderGoals();
    }
  // Bewegung
  let mx = 0,
    my = 0;
  if (modal.hidden) {
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('w') || keys.has('arrowup')) my -= 1;
    if (keys.has('s') || keys.has('arrowdown')) my += 1;
    mx += joy.x;
    my += joy.y;
  }
  if (view === '3d' && !(scene && scene.sea)) {
    let turn = 0,
      fw = 0,
      sf = 0;
    mx = 0;
    my = 0;
    if (modal.hidden && !player.sleep) {
      if (keys.has('arrowleft')) turn -= 1;
      if (keys.has('arrowright')) turn += 1;
      if (keys.has('a')) sf -= 1;
      if (keys.has('d')) sf += 1;
      if (keys.has('w') || keys.has('arrowup')) fw += 1;
      if (keys.has('s') || keys.has('arrowdown')) fw -= 1;
      turn += joy.x;
      fw -= joy.y;
    }
    player.ang += turn * 2.6 * dt;
    {
      const ca = Math.cos(player.ang),
        sa = Math.sin(player.ang);
      mx = ca * fw - sa * sf;
      my = sa * fw + ca * sf;
    }
    const ca = Math.cos(player.ang),
      sa = Math.sin(player.ang);
    player.face = Math.abs(ca) > Math.abs(sa) ? (ca < 0 ? 'left' : 'right') : sa < 0 ? 'up' : 'down';
  }
  if (player.sleep || player.sit || tv || player.work) {
    mx = 0;
    my = 0;
  }
  const m = Math.hypot(mx, my);
  player.moving = m > 0.1;
  if (player.moving) {
    if (m > 1) {
      mx /= m;
      my /= m;
    }
    const sp = player.mount ? (player.mount.type === 'horse' ? 7 : 8.5) : 4.3;
    moveBody(player, mx * sp * dt, my * sp * dt);
    if (view !== '3d') {
      player.face = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'left' : 'right') : my < 0 ? 'up' : 'down';
      player.ang = Math.atan2(my, mx);
    }
    player.phase += dt * (player.mount ? 16 : 12);
    if (player.mount) {
      player.mount.o.x = player.x;
      player.mount.o.y = player.y;
    }
  }
  player.ang = Math.atan2(Math.sin(player.ang), Math.cos(player.ang));
  {
    let d = player.ang - player.rang;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    player.rang += d * Math.min(1, dt * 12);
    player.rang = Math.atan2(Math.sin(player.rang), Math.cos(player.rang));
  }
  // Pferde
  for (const h of horses) {
    if (player.mount && player.mount.o === h) continue;
    if (h.wait > 0) {
      h.wait -= dt;
      h.phase = 0;
      continue;
    }
    const dx = h.tx - h.x,
      dy = h.ty - h.y,
      d = Math.hypot(dx, dy);
    if (d < 0.15) {
      h.wait = 1 + Math.random() * 4;
      h.tx = h.home.x0 + Math.random() * (h.home.x1 - h.home.x0);
      h.ty = h.home.y0 + Math.random() * (h.home.y1 - h.home.y0);
      continue;
    }
    const sp = 1.3 * dt,
      ox = h.x,
      oy = h.y;
    moveBody(h, (dx / d) * sp, (dy / d) * sp, OUT);
    h.phase += dt * 8;
    h.dir = Math.atan2(dy, dx);
    if (Math.abs(dx) > 0.05) h.face = dx < 0 ? 'left' : 'right';
    if (h.x === ox && h.y === oy) {
      h.tx = h.x;
      h.ty = h.y;
    }
  }
  sellerTick(dt);
  // Dorfbewohner
  for (const v of villagers) {
    if (v.pause > 0) {
      v.pause -= dt;
      v.phase = 0;
      v.face = 'down';
      continue;
    }
    const [tx, ty] = v.pts[v.i],
      dx = tx - v.x,
      dy = ty - v.y,
      d = Math.hypot(dx, dy);
    if (d < 0.1) {
      v.i = (v.i + 1) % v.pts.length;
      v.pause = Math.random() < 0.3 ? 2 : 0;
      continue;
    }
    const sp = Math.min(d, 1.6 * dt);
    v.x += (dx / d) * sp;
    v.y += (dy / d) * sp;
    v.phase += dt * 9;
    v.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  }
  // Kunden im Marktdorf
  while (state.buyQ.length && state.buyQ[0] <= state.t) {
    state.buyQ.shift();
    state.buyersToday++;
    const hi = Math.floor(Math.random() * 4),
      way = V2WAY[hi];
    buyers.push({
      x: V2DOOR[hi][0],
      y: V2DOOR[hi][1],
      hi,
      look: randLook(Math.random),
      path: [...way]
        .reverse()
        .slice(1)
        .concat([
          [62.6, 23.7],
          [61, 23.7],
        ]),
      i: 0,
      state: 'in',
      wait: 0,
      phase: 0,
      face: 'down',
    });
  }
  for (const b of buyers) {
    if (b.state === 'buy') {
      b.wait -= dt;
      b.phase = 0;
      b.face = 'up';
      if (b.wait <= 0) {
        buy(b);
        b.state = 'out';
        b.path = [[62.6, 23.7], ...V2WAY[b.hi]];
        b.i = 0;
      }
      continue;
    }
    const [tx, ty] = b.path[b.i],
      dx = tx - b.x,
      dy = ty - b.y,
      d = Math.hypot(dx, dy);
    if (d < 0.08) {
      b.i++;
      if (b.i >= b.path.length) {
        if (b.state === 'in') {
          b.state = 'buy';
          b.wait = 1.2;
        } else b.gone = true;
      }
      continue;
    }
    const sp = Math.min(d, 2 * dt);
    b.dir = Math.atan2(dy, dx);
    b.x += (dx / d) * sp;
    b.y += (dy / d) * sp;
    b.phase += dt * 10;
    b.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  }
  buyers = buyers.filter((b) => !b.gone);
  workTick(dt);
  partsTick(dt);
  adminTick();
  jumpTick(dt);
  fightTick(dt);
  floats.forEach((f) => (f.t += dt));
  floats = floats.filter((f) => f.t < 1.6);
  netTick(dt);
  findCur();
}

function buy(b) {
  const avail = SELL.filter((k) => state.stall[k] > 0);
  const near = player.x > 55;
  if (!avail.length) {
    if (near) toast('Eine Kundin schaut an deinem Stand vorbei, aber er ist leer.');
    return;
  }
  let n = 1 + Math.floor(Math.random() * 3),
    got = {},
    sum = 0;
  while (n-- > 0) {
    const a = SELL.filter((k) => state.stall[k] > 0);
    if (!a.length) break;
    const k = pick(a, Math.random);
    state.stall[k]--;
    got[k] = (got[k] || 0) + 1;
    sum += ITEMS[k].price;
  }
  state.coins += sum;
  moment('sale1', 'Der erste Kunde hat an deinem Stand gekauft!', 'coin');
  if (sum >= 40) moment('big' + state.day, `Großer Verkauf: ${sum} Glücksmünzen auf einmal!`, 'coin');
  state.stats.sold += Object.values(got).reduce((a, x) => a + x, 0);
  state.stats.earned += sum;
  float(61, 22.6, '+' + sum, '#ffd23f');
  toast(`Ein Kunde kaufte <b>${fmtB(got)}</b> (+${sum} Glücksmünzen)`);
  changed();
}

// Händler im Marktdorf: abends nach Hause, morgens zurück zum Stand
const V2DOOR = [
  [60.5, 13.6],
  [80.5, 13.6],
  [60.5, 43.5],
  [80.5, 43.5],
];
const V2WAY = [
  [
    [63.5, 18.5],
    [61, 17.5],
    [60.5, 13.6],
  ],
  [
    [76.5, 18.5],
    [80.5, 17.5],
    [80.5, 13.6],
  ],
  [
    [63.5, 34.5],
    [64.5, 38.4],
    [64.5, 43.5],
    [60.5, 43.5],
  ],
  [
    [76.5, 34.5],
    [76.5, 38.4],
    [76.5, 43.5],
    [80.5, 43.5],
  ],
];

function sellerTick(dt) {
  const hr = 6 + state.t * 24;
  sellers2.forEach((s, i) => {
    if (i === MYSTALL) return;
    const front = [s.sx, STALLS2[i].y === 37 ? 36.2 : s.sy + 1.3];
    if (s.state === 'stall' && hr >= 20 + s.off * 1.5) {
      s.state = 'going';
      s.path = [front, ...V2WAY[s.hi]];
    } else if (s.state === 'inside' && hr < 19 && hr >= 6.2 + s.off * 0.8) {
      s.state = 'returning';
      s.x = V2DOOR[s.hi][0];
      s.y = V2DOOR[s.hi][1];
      s.path = [...V2WAY[s.hi]]
        .reverse()
        .slice(1)
        .concat([front, [s.sx, s.sy]]);
    }
    if (s.state === 'going' || s.state === 'returning') {
      if (!s.path.length) {
        s.state = s.state === 'going' ? 'inside' : 'stall';
        s.face = 'down';
        return;
      }
      const [tx, ty] = s.path[0],
        dx = tx - s.x,
        dy = ty - s.y,
        d = Math.hypot(dx, dy);
      if (d < 0.06) {
        s.path.shift();
        return;
      }
      const sp = Math.min(d, 1.7 * dt);
      s.dir = Math.atan2(dy, dx);
      s.x += (dx / d) * sp;
      s.y += (dy / d) * sp;
      s.phase += dt * 10;
      s.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    }
  });
}
