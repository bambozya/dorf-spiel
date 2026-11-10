// ================= Online-Modus =================
let room = null;
const others = new Map();
let presT = 0,
  lastPres = '',
  allSleepT = 0;
(async () => {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const r = await window.claude.use('room');
      if (r) {
        room = r;
        r.onPeers(
          () => {},
          () => {
            room = null;
            others.clear();
          },
        );
      }
    }
  } catch (e) {
    room = null;
  }
})();
const okCol = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const num = (v, a, b) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, v)) : null);

function viewerPeers() {
  if (!room) return [];
  try {
    return room.peers().filter((p) => p.kind === 'viewer' && p.presence && typeof p.presence.d === 'number');
  } catch (e) {
    return [];
  }
}

// Die Uhr des eigenen Spielservers (net.js); in der Claude-Umgebung gibt es sie nicht.
function serverClock() {
  const c = window.dorfServer && window.dorfServer.clock;
  return c && typeof c.day === 'number' && typeof c.time === 'number' ? c : null;
}

// Eigene Uhr an die gemeinsame angleichen; ein neuer Tag löst den Morgen aus.
function followClock(d, t) {
  if (d === null || t === null) return;
  const D = Math.floor(d);
  if (D > state.day) {
    state.day = D - 1;
    newDay();
    state.t = t;
  } else if (D < state.day) {
    state.day = D;
    state.t = t;
  } else if (Math.abs(t - state.t) > 0.01) state.t = t;
}

function isLeader() {
  const ps = viewerPeers();
  if (!ps.length) return true;
  const s = [...ps].sort((a, b) => (a.peer < b.peer ? -1 : 1));
  return !!s[0].sameTab;
}

function netTick(dt) {
  const ps = viewerPeers(),
    seen = new Set();
  if (!MYPEER) {
    const me = ps.find((p) => p.sameTab);
    if (me) MYPEER = me.peer;
  }
  for (const p of ps) {
    if (p.sameTab) continue;
    const pr = p.presence,
      x = num(pr.x, 0, 90),
      y = num(pr.y, 0, 50);
    if (x === null || y === null) continue;
    seen.add(p.peer);
    let o = others.get(p.peer);
    if (!o) {
      o = { x, y, phase: 0 };
      others.set(p.peer, o);
    }
    o.tx = x;
    o.ty = y;
    o.f = ['up', 'down', 'left', 'right'].includes(pr.f) ? pr.f : 'down';
    o.sc = typeof pr.sc === 'string' ? pr.sc.slice(0, 8) : 'out';
    o.nm = typeof pr.nm === 'string' ? pr.nm.slice(0, 14) : '';
    const lk = Array.isArray(pr.lk) ? pr.lk : [];
    o.lk = {
      skin: okCol(lk[0]) ? lk[0] : '#e8b98f',
      hair: okCol(lk[1]) ? lk[1] : '#2a1d14',
      shirt: okCol(lk[2]) ? lk[2] : '#3fa7d6',
      pants: okCol(lk[3]) ? lk[3] : '#2f4a7a',
      shoes: okCol(lk[4]) ? lk[4] : '#3b2a1e',
      hs: Math.max(0, Math.min(4, lk[5] | 0)),
      cl: Math.max(0, Math.min(2, lk[6] | 0)),
      eye: okCol(lk[7]) ? lk[7] : '#4a2e1a',
      g: lk[8] === 'f' ? 'f' : 'm',
    };
    o.sl = pr.sl === true;
    o.mt = pr.mt === 'horse' || pr.mt === 'bike' ? pr.mt : '';
    o.mc = okCol(pr.mc) ? pr.mc : '#8a5a35';
    o.hp = num(pr.hp, 0, 100);
    o.sw = pr.sw === 1;
    o.lost = typeof pr.lost === 'string' ? pr.lost : null;
    fightIncoming(p, o);
    o.mv = pr.mv === 1;
    o.si = pr.si === 1;
    o.jz = num(pr.jz, 0, 200) || 0;
    o.a = num(pr.a, -50, 50);
    if (Math.hypot(o.tx - o.x, o.ty - o.y) > 4) {
      o.x = o.tx;
      o.y = o.ty;
    } else {
      const a = Math.min(1, dt * 10);
      o.x += (o.tx - o.x) * a;
      o.y += (o.ty - o.y) * a;
    }
    if (o.mv) o.phase += dt * 12;
  }
  for (const k of [...others.keys()]) if (!seen.has(k)) others.delete(k);
  // gemeinsame Uhr: entweder gibt der Server die Zeit vor oder der Spieler, der am längsten dabei ist
  const sc = serverClock();
  if (sc) followClock(sc.day, sc.time);
  else if (ps.length && !isLeader()) {
    const L = [...ps].sort((a, b) => (a.peer < b.peer ? -1 : 1))[0];
    followClock(num(L.presence.d, 1, 1e6), num(L.presence.t, 0, 1));
  }
  // Schlafen: erst wenn alle online im Bett liegen
  if (player.sleep) {
    const tot = ps.length || 1,
      asl = ps.length ? ps.filter((p) => p.presence.sl === true).length : 1;
    $('sleeptext').innerHTML =
      tot === 1
        ? '<b>Gute Nacht!</b> Du schläfst…'
        : `<b>Du liegst im Bett.</b> ${asl} von ${tot} Spielern schlafen. Die Nacht geht erst vorbei, wenn alle im Bett sind.`;
    if (asl >= tot && !sc && isLeader()) {
      allSleepT += dt;
      if (allSleepT > 1.8) {
        allSleepT = 0;
        newDay(true);
      }
    } else allSleepT = 0;
  } else allSleepT = 0;
  // eigene Position senden
  presT += dt;
  if (room && presT >= 0.1) {
    presT = 0;
    const L = state.look;
    const p = {
      x: +player.x.toFixed(2),
      y: +player.y.toFixed(2),
      f: player.face,
      sc: sceneId(),
      nm: state.name || '',
      lk: [
        L.skin,
        L.hair,
        L.shirt,
        L.pants,
        L.shoes,
        L.hs | 0,
        L.cl | 0,
        L.eye || '#4a2e1a',
        L.g === 'f' ? 'f' : 'm',
      ],
      sl: !!player.sleep,
      mt: player.mount ? player.mount.type : '',
      mc: player.mount ? player.mount.o.body || player.mount.o.col : '',
      mv: player.moving ? 1 : 0,
      jz: Math.round(player.jz || 0),
      si: player.sit ? 1 : 0,
      a: +player.rang.toFixed(2),
      d: state.day,
      t: +state.t.toFixed(3),
    };
    if (FIGHT.on) {
      p.hp = FIGHT.hp;
      p.fg = FIGHT.foe === 'bot' ? 'bot' : FIGHT.foe;
    }
    if (FIGHT.hit) p.hit = FIGHT.hit;
    if (LOSTTO && Date.now() < LOSTTO.until) p.lost = LOSTTO.peer;
    if (FIGHT.sw >= 0) p.sw = 1;
    const s = JSON.stringify(p);
    if (s !== lastPres) {
      lastPres = s;
      room.presence(p).catch(() => {});
    }
  }
  const on = $('online');
  if (room && ps.length) {
    on.hidden = false;
    const names = [...others.values()].map((o) => o.nm || 'Jemand');
    on.textContent = 'Online: ' + ps.length + (ps.length === 1 ? ' Spieler' : ' Spieler');
    on.title = names.length ? 'Mit dir online: ' + names.join(', ') : 'Nur du bist gerade online';
  } else on.hidden = true;
}
