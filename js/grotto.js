// ================= Kampf in der Grotte =================
const BOTLOOK = {
  skin: '#c9a07a',
  hair: '#1d1d24',
  shirt: '#5a1d1d',
  pants: '#2b2b2b',
  shoes: '#1d1d24',
  hs: 0,
  cl: 0,
  eye: '#ff3b3b',
  g: 'm',
};
let FIGHT = { on: false },
  MYPEER = null,
  fightFlash = 0,
  LOSTTO = null;
const inGrotto = () => scene && scene.floor === 'gr';
const POSE_T = [0, 0.12, 0.24, 0.31, 0.38];

function botPose(b) {
  if (b.state === 'wind') return Math.min(2, 1 + Math.floor(b.t / 0.2));
  if (b.state === 'strike') return b.t < 0.12 ? 3 : 4;
  return 0;
}

function sprFighter(L, a, ph, pose) {
  const T2 = Math.PI * 2,
    q = Math.round(((((a - player.ang - Math.PI / 2) % T2) + T2) % T2) / (Math.PI / 8)) % 16,
    fr = walkFrame(ph);
  return mkSpr(
    'F' + q + 'f' + fr + 'p' + pose + lkKey(L),
    48,
    70,
    (c) =>
      drawPerson(c, 24, 66, L, 'down', fr ? (fr * Math.PI) / 4 : 0, {
        ang: (q * Math.PI) / 8,
        chop: POSE_T[pose],
        tool: 'sword',
      }),
    2,
    66,
  );
}

function sprTorch(fr) {
  return mkSpr(
    'torch' + fr,
    24,
    44,
    (c) => {
      const g = c.createRadialGradient(12, 12, 1, 12, 12, 12);
      g.addColorStop(0, 'rgba(255,210,120,.75)');
      g.addColorStop(1, 'rgba(255,150,50,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(12, 12, 12, 0, 7);
      c.fill();
      c.fillStyle = '#4a2e1a';
      c.fillRect(10.5, 16, 3, 26);
      c.fillStyle = '#2f3337';
      c.fillRect(9, 15, 6, 3);
      const f = [0, 1.4, -1][fr];
      c.fillStyle = '#ff8a1e';
      c.beginPath();
      c.ellipse(12, 10 - f * 0.5, 4, 7 + f, 0, 0, 7);
      c.fill();
      c.fillStyle = '#ffe08a';
      c.beginPath();
      c.ellipse(12, 12, 2, 3.6, 0, 0, 7);
      c.fill();
    },
    3,
    44,
  );
}
let shakeT = 0;

function fightFoeObj() {
  if (!FIGHT.on) return null;
  if (FIGHT.foe === 'bot') return FIGHT.bot;
  const o = others.get(FIGHT.foe);
  return o && o.sc === sceneId() ? o : null;
}

function startFight(foePeer, quiet) {
  if (FIGHT.on || !inGrotto()) return;
  if (!state.sword)
    return toast('Ohne Schwert geht das nicht. Nimm zuerst das <b>Schwert</b> aus dem Stein.');
  let foe = foePeer;
  if (!foe) {
    for (const [k, o] of others)
      if (o.sc === sceneId() && !o.sl) {
        foe = k;
        break;
      }
  }
  FIGHT = {
    on: true,
    foe: foe || 'bot',
    hp: 100,
    cd: 0,
    sw: -1,
    seq: FIGHT.seq || 0,
    hit: null,
    prev: view,
    t: 0,
  };
  if (FIGHT.foe === 'bot')
    FIGHT.bot = {
      x: 10.5,
      y: 7.2,
      ang: Math.PI / 2,
      hp: 100,
      state: 'walk',
      t: 0,
      phase: 0,
      hitT: 0,
      mv: false,
    };
  if (view !== 'normal') setView('normal');
  const nm =
    FIGHT.foe === 'bot' ? 'den Schatzwächter' : esc((others.get(FIGHT.foe) || {}).nm || 'einen Spieler');
  toast(
    quiet
      ? `<b>${nm} ist auch in der Grotte!</b> Ihr kämpft gegeneinander. Mit <b>N</b> schlägst du zu.`
      : `<b>Kampf gegen ${nm}!</b> Mit <b>N</b> schlägst du zu. Weich zurück, wenn er ausholt!`,
    5000,
  );
  $('fightbar').hidden = false;
}

function endFight(win, why) {
  if (!FIGHT.on) return;
  const prev = FIGHT.prev;
  if (win === false && FIGHT.foe !== 'bot') LOSTTO = { peer: FIGHT.foe, until: Date.now() + 6000 };
  FIGHT = { on: false, seq: FIGHT.seq };
  $('fightbar').hidden = true;
  if (prev && prev !== view) setView(prev);
  if (win) {
    if (scene && inGrotto()) {
      scene.won = true;
      scene.map = buildSecretMap();
    }
    toast(`<b>Gewonnen!</b> ${why || ''} Die Schatztruhe ist jetzt offen.`, 5000);
    float(player.x, player.y - 1.9, 'Sieg!', '#ffd23f');
    chips(player.x, player.y - 1, 16, ['#ffd23f', '#fff1a8'], 30);
    moment('fight1', 'Den ersten Kampf in der Grotte gewonnen!', 'coin');
  } else if (win === false) {
    toast(`<b>Verloren!</b> ${why || ''} Du landest wieder im Boot. Versuch es nochmal!`, 5000);
    if (inGrotto()) leaveSecret();
  } else if (why) toast(why, 4000);
}

function attack() {
  if (!state.sword) return;
  if (FIGHT.cd > 0 || player.work || player.sleep || player.sit) return;
  FIGHT.cd = 0.55;
  FIGHT.sw = 0;
  if (!FIGHT.on) {
    FIGHT.sw = 0;
    return;
  }
  const f = fightFoeObj();
  if (!f) return;
  const dx = f.x - player.x,
    dy = f.y - player.y,
    d = Math.hypot(dx, dy);
  if (d > 1.9) return;
  const fa = view === '3d' ? player.ang : player.rang;
  if (d > 0.3 && (dx * Math.cos(fa) + dy * Math.sin(fa)) / d < 0.3) return;
  const dmg = 13 + Math.floor(Math.random() * 6);
  if (FIGHT.foe === 'bot') {
    const b = FIGHT.bot;
    b.hp = Math.max(0, b.hp - dmg);
    b.hitT = 0.25;
    const nx = b.x + (dx / d) * 0.45,
      ny = b.y + (dy / d) * 0.45;
    if (!blocked(nx, ny)) {
      b.x = nx;
      b.y = ny;
    }
    if (b.state === 'wind') {
      b.state = 'walk';
      b.t = 0;
    }
  } else {
    FIGHT.seq++;
    FIGHT.hit = [FIGHT.foe, FIGHT.seq, dmg];
  }
  float(f.x, f.y - 1.7, '-' + dmg, '#ff6b6b');
  chips(f.x, f.y - 0.9, 6, ['#ffffff', '#ff6b6b'], 12);
}

function fightTick(dt) {
  if (shakeT > 0) shakeT -= dt;
  autoPvP();
  if (FIGHT.sw >= 0) {
    FIGHT.sw += dt;
    if (FIGHT.sw > 0.45) FIGHT.sw = -1;
  }
  if (FIGHT.cd > 0) FIGHT.cd -= dt;
  if (fightFlash > 0) fightFlash -= dt;
  if (!FIGHT.on) return;
  if (!inGrotto()) return endFight(null, 'Der Kampf ist abgebrochen.');
  FIGHT.t += dt;
  if (FIGHT.foe === 'bot') {
    const b = FIGHT.bot;
    if (b.hitT > 0) b.hitT -= dt;
    const dx = player.x - b.x,
      dy = player.y - b.y,
      d = Math.hypot(dx, dy) || 1;
    b.ang = Math.atan2(dy, dx);
    b.t += dt;
    b.mv = false;
    if (b.hp <= 0) return endFight(true, 'Der Schatzwächter gibt auf.');
    const mv = (vx, vy) => {
      const nx = b.x + vx,
        ny = b.y + vy;
      if (!blocked(nx, b.y)) b.x = nx;
      if (!blocked(b.x, ny)) b.y = ny;
    };
    if (b.state === 'walk') {
      if (d > 1.35) {
        mv((dx / d) * 2.7 * dt, (dy / d) * 2.7 * dt);
        b.mv = true;
        b.phase += dt * 11;
      } else {
        const side = Math.sin(FIGHT.t * 1.7) > 0 ? 1 : -1;
        mv((-dy / d) * side * 1.2 * dt, (dx / d) * side * 1.2 * dt);
        b.mv = true;
        b.phase += dt * 8;
        if (b.t > 0.35) {
          b.state = 'wind';
          b.t = 0;
        }
      }
    } else if (b.state === 'wind') {
      if (d > 2.6) {
        b.state = 'walk';
        b.t = 0;
      } else if (b.t > 0.42) {
        b.state = 'strike';
        b.t = 0;
        b.hitDone = false;
      }
    } else if (b.state === 'strike') {
      if (b.t < 0.16 && d > 0.95) mv((dx / d) * 5.5 * dt, (dy / d) * 5.5 * dt);
      if (!b.hitDone && b.t >= 0.12) {
        b.hitDone = true;
        if (d < 1.75) {
          const dmg = 9 + Math.floor(Math.random() * 6);
          FIGHT.hp = Math.max(0, FIGHT.hp - dmg);
          fightFlash = 0.4;
          shakeT = 0.3;
          float(player.x, player.y - 1.7, '-' + dmg, '#ff3b3b');
          const kx = player.x + (dx / d) * 0.55,
            ky = player.y + (dy / d) * 0.55;
          if (!blocked(kx, player.y)) player.x = kx;
          if (!blocked(player.x, ky)) player.y = ky;
        } else float(b.x, b.y - 1.8, 'verfehlt!', '#fff8e6');
      }
      if (b.t > 0.5) {
        b.state = 'walk';
        b.t = 0;
      }
    }
  } else {
    const o = others.get(FIGHT.foe);
    if (o && o.lost === MYPEER) return endFight(true, `${esc(o.nm || 'Dein Gegner')} ist besiegt.`);
    if (!o || o.sc !== sceneId()) return endFight(null, 'Dein Gegner ist gegangen. Der Kampf ist vorbei.');
    if (o.hp != null && o.hp <= 0) return endFight(true, `${esc(o.nm || 'Dein Gegner')} ist besiegt.`);
  }
  if (FIGHT.hp <= 0)
    return endFight(
      false,
      FIGHT.foe === 'bot' ? 'Der Schatzwächter war stärker.' : 'Dein Gegner war stärker.',
    );
  const f = fightFoeObj(),
    fh = FIGHT.foe === 'bot' ? FIGHT.bot.hp : f && f.hp != null ? f.hp : 100,
    fn = FIGHT.foe === 'bot' ? 'Schatzwächter' : (f && f.nm) || 'Gegner';
  $('fightbar').innerHTML =
    `<div class="fside"><b>${esc(state.name || 'Du')}</b><div class="hpb"><i style="width:${FIGHT.hp}%"></i></div></div><div class="vs">⚔</div><div class="fside"><b>${esc(fn)}</b><div class="hpb foe"><i style="width:${fh}%"></i></div></div><div class="fhint">N: zuschlagen${FIGHT.foe === 'bot' && FIGHT.bot.state === 'wind' ? ' · <b>Er holt aus! Zurück!</b>' : ''}</div>`;
}

function autoPvP() {
  if (!inGrotto() || (FIGHT.on && FIGHT.foe !== 'bot')) return;
  for (const [k, o] of others) {
    if (o.sc !== sceneId() || o.sl) continue;
    if (!state.sword) {
      state.sword = 1;
      changed();
      if (scene.map) scene.map = buildSecretMap();
      toast('Du schnappst dir das <b>Schwert</b> aus dem Stein!', 3000);
    }
    if (FIGHT.on) {
      const pv = FIGHT.prev;
      FIGHT = { on: false, seq: FIGHT.seq };
      $('fightbar').hidden = true;
      FIGHT.prevKeep = pv;
    }
    const pv = FIGHT.prevKeep;
    startFight(k, true);
    if (pv) FIGHT.prev = pv;
    return;
  }
}

function fightIncoming(p, o) {
  const pr = p.presence;
  if (
    Array.isArray(pr.hit) &&
    pr.hit.length === 3 &&
    typeof pr.hit[0] === 'string' &&
    typeof pr.hit[1] === 'number'
  ) {
    const seq = pr.hit[1];
    if (o._hitSeq === undefined) o._hitSeq = seq;
    else if (seq > o._hitSeq) {
      o._hitSeq = seq;
      if (pr.hit[0] === MYPEER && FIGHT.on && FIGHT.foe === p.peer) {
        const dmg = Math.max(5, Math.min(20, +pr.hit[2] || 0));
        FIGHT.hp = Math.max(0, FIGHT.hp - dmg);
        fightFlash = 0.35;
        float(player.x, player.y - 1.7, '-' + dmg, '#ff3b3b');
      }
    }
  }
  if (!FIGHT.on && pr.fg === MYPEER && o.sc === sceneId() && inGrotto() && state.sword)
    startFight(p.peer, true);
}

function drawFPSword(c) {
  if (!state.sword || !(FIGHT.on || inGrotto())) return;
  const W2 = cv.width,
    H2 = cv.height,
    s = H2 / 700,
    sk = shakeT > 0 ? shakeT * 40 * s : 0,
    sw = FIGHT.sw >= 0 ? FIGHT.sw : -1,
    k = sw >= 0 ? Math.sin(Math.min(1, sw / 0.45) * Math.PI) : 0;
  c.save();
  c.translate(
    W2 * 0.74 - k * W2 * 0.18 + (Math.random() - 0.5) * sk,
    H2 * 0.98 - k * H2 * 0.12 + (Math.random() - 0.5) * sk,
  );
  c.rotate(-0.55 - k * 1.1);
  c.scale(s, s);
  const g = c.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, '#f4f7fa');
  g.addColorStop(0.5, '#b9c1ca');
  g.addColorStop(1, '#6d7680');
  c.fillStyle = g;
  c.strokeStyle = '#2f343a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-9, -30);
  c.lineTo(-9, -250);
  c.lineTo(0, -285);
  c.lineTo(9, -250);
  c.lineTo(9, -30);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.fillRect(-2, -245, 3, 210);
  c.fillStyle = '#c9a227';
  c.strokeStyle = '#6b5414';
  c.beginPath();
  c.roundRect ? c.roundRect(-38, -34, 76, 14, 5) : c.rect(-38, -34, 76, 14);
  c.fill();
  c.stroke();
  c.fillStyle = '#5a3418';
  c.fillRect(-7, -20, 14, 70);
  c.strokeStyle = '#2e1a0c';
  c.lineWidth = 1.5;
  for (let y = -16; y < 46; y += 8) {
    c.beginPath();
    c.moveTo(-7, y);
    c.lineTo(7, y + 5);
    c.stroke();
  }
  c.fillStyle = '#c9a227';
  c.beginPath();
  c.arc(0, 56, 10, 0, 7);
  c.fill();
  c.stroke();
  c.restore();
  if (fightFlash > 0) {
    c.fillStyle = `rgba(200,0,0,${fightFlash * 0.9})`;
    c.fillRect(0, 0, W2, H2);
  }
}

// ---- Geheime Grotte (Eingang: Fischschwärme an der Insel) ----
function buildSecretMap() {
  const m = {
    w: IW,
    h: IH,
    S: new Uint8Array(IW * IH),
    T: new Uint8Array(IW * IH).fill(7),
    objs: [],
    labels: [[1.15, 12.55, 'Geheime Grotte']],
    cave: 1,
  };
  for (let j = 0; j < IH; j++)
    for (let i = 0; i < IW; i++) {
      const dx = Math.max(0, Math.abs(i - 10) - 6.2) / 3.4,
        dy = Math.max(0, Math.abs(j - 6.5) - 2.6) / 3.2;
      if (i < 1 || j < 1 || i > IW - 2 || j > IH - 2 || dx * dx + dy * dy > 1) m.T[j * IW + i] = 0;
    }
  for (const [i, j] of [
    [5, 4],
    [15, 4],
    [5, 9],
    [15, 9],
  ])
    m.T[j * IW + i] = 0;
  for (const [x, y] of [
    [3, 3],
    [17, 3],
    [2, 7],
    [18, 7],
    [7, 1],
    [13, 1],
    [4, 11],
    [16, 11],
  ])
    m.objs.push({ k: 'torch', x, y, w: 1, h: 1, solid: false });
  const O = (o) => {
    o.solid = o.solid !== false;
    m.objs.push(o);
    return o;
  };
  const open = state.secretDay === state.day;
  const won = scene && scene.won;
  if (!state.sword)
    O({
      k: 'swordstone',
      x: 8,
      y: 9,
      w: 1,
      h: 1,
      ix: 8.5,
      iy: 10.4,
      r: 1.2,
      txt: 'Das Schwert aus dem Stein ziehen',
      act: () => {
        state.sword = 1;
        changed();
        toast(
          '<b>Du hast ein Schwert!</b> Es gehört dir jetzt für immer. Mit <b>N</b> schlägst du zu. Geh zur Truhe, um den Kampf zu beginnen.',
          6000,
        );
        moment('sword1', 'Das Schwert aus dem Stein gezogen!', 'coin');
        float(player.x, player.y - 1.8, 'Schwert!', '#ffd23f');
        scene.map = buildSecretMap();
      },
    });
  O({
    k: 'chest',
    x: 10,
    y: 4,
    w: 1,
    h: 1,
    ix: 10.5,
    iy: 5.5,
    r: 1.2,
    txt: open
      ? 'Schatztruhe (heute leer)'
      : won
        ? 'Schatztruhe öffnen'
        : !state.sword
          ? 'Schatztruhe (verschlossen)'
          : 'Kampf um den Schatz beginnen',
    act: () => {
      if (state.secretDay === state.day) return toast('Die Truhe ist heute schon leer. Komm morgen wieder!');
      if (!scene.won) {
        if (!state.sword)
          return toast(
            '<b>Die Truhe ist verschlossen.</b> Diesen Schatz musst du dir erst im Kampf verdienen. Dafür brauchst du das <b>Schwert</b> aus dem Stein.',
            5500,
          );
        if (FIGHT.on) return;
        return startFight();
      }
      openTreasure();
      scene.map = buildSecretMap();
    },
  });
  O({
    k: 'cexit',
    x: 10,
    y: 12,
    w: 1,
    h: 1,
    solid: false,
    ix: 10.5,
    iy: 12.2,
    r: 1.2,
    txt: 'Zurück nach oben ins Boot',
    act: leaveSecret,
  });
  for (let i = 0; i < m.S.length; i++) if (m.T[i] === 0) m.S[i] = 1;
  for (const o of m.objs)
    if (o.solid)
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) m.S[j * IW + i] = 1;
  return m;
}

function enterSecret(o) {
  const back = scene;
  player.work = null;
  scene = {
    shop: true,
    label: 'Geheime Grotte',
    house: { n: 0 },
    floor: 'gr',
    map: buildSecretMap(),
    outX: 3.8,
    outY: 4.6,
    back,
    backX: o.ix + (o.ix > 5 ? 1.3 : -1.3),
    backY: o.iy,
  };
  player.x = 10.5;
  player.y = 11.4;
  player.face = 'up';
  player.ang = player.rang = -Math.PI / 2;
  toast(
    '<b>Psst… ein Geheimnis!</b> Unter den Fischen war ein versteckter Eingang. Du bist in einer geheimen Grotte gelandet.',
    5500,
  );
  moment('secret1', 'Die geheime Grotte unter der Insel entdeckt!', 'fish');
}

function leaveSecret() {
  if (FIGHT.on) {
    const pv = FIGHT.prev;
    FIGHT = { on: false, seq: FIGHT.seq };
    $('fightbar').hidden = true;
    if (pv && pv !== view) setView(pv);
  }
  const s = scene;
  scene = s.back || {
    sea: true,
    shop: true,
    label: 'Meer',
    house: { n: 0 },
    floor: 'sea',
    map: buildSeaMap(),
    outX: 3.8,
    outY: 4.6,
  };
  player.x = s.backX || 8;
  player.y = s.backY || 4;
  player.face = 'down';
  toast('Wieder oben im Boot.');
}

function openTreasure() {
  if (state.secretDay === state.day) return toast('Die Truhe ist heute schon leer. Komm morgen wieder!');
  state.secretDay = state.day;
  const c = 80 + Math.floor(Math.random() * 121),
    extra = pick(['tuna', 'cod', 'cake', 'pie'], Math.random);
  state.coins += c;
  state.inv[extra] = (state.inv[extra] || 0) + 1;
  chips(10.5, 4.6, 18, ['#ffd23f', '#fff1a8', '#ffb000'], 40);
  float(10.5, 3.6, '+' + c + ' Glücksmünzen!', '#ffd23f');
  float(10.5, 2.9, '+1 ' + ITEMS[extra].n, '#bfe8ff');
  toast(`<b>Schatz gefunden!</b> In der Truhe waren ${c} Glücksmünzen und ${fmt(1, extra)}.`, 5000);
  moment('treasure1', 'Den Schatz in der geheimen Grotte gefunden!', 'coin');
  changed();
}

function drawCaveObj(c, o) {
  const X = o.x * TILE,
    Y = o.y * TILE,
    w = o.w * TILE,
    h = o.h * TILE;
  if (o.k === 'cpool') {
    const g = c.createRadialGradient(X + w / 2, Y + h / 2, 4, X + w / 2, Y + h / 2, w / 2);
    g.addColorStop(0, '#5fe0ff');
    g.addColorStop(1, '#1b5f8e');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(X + w / 2, Y + h / 2, w / 2, h / 2.2, 0, 0, 7);
    c.fill();
    c.strokeStyle = 'rgba(200,250,255,.5)';
    c.lineWidth = 1;
    const ph = (now * 0.7) % 1;
    c.beginPath();
    c.ellipse(X + w / 2, Y + h / 2, (ph * w) / 2.5, (ph * h) / 4, 0, 0, 7);
    c.stroke();
  } else if (o.k === 'crystal') {
    const gl = 0.5 + 0.5 * Math.sin(now * 2 + o.x);
    c.fillStyle = o.col.replace(')', ',0.2)').replace('#', '');
    c.save();
    c.globalAlpha = 0.25 + 0.2 * gl;
    c.fillStyle = o.col;
    c.beginPath();
    c.arc(X + 16, Y + 14, 18, 0, 7);
    c.fill();
    c.restore();
    for (const [dx, hh2, lean] of [
      [-6, 18, -0.3],
      [2, 26, 0],
      [9, 16, 0.35],
    ]) {
      c.save();
      c.translate(X + 16 + dx, Y + 26);
      c.rotate(lean);
      c.fillStyle = o.col;
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(-3, -hh2 * 0.7);
      c.lineTo(0, -hh2);
      c.lineTo(3, -hh2 * 0.7);
      c.lineTo(4, 0);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.fillRect(-1.5, -hh2 * 0.8, 1.4, hh2 * 0.6);
      c.restore();
    }
  } else if (o.k === 'chest') {
    const open = state.secretDay === state.day,
      gl = 0.5 + 0.5 * Math.sin(now * 3);
    if (!open) {
      c.save();
      c.globalAlpha = 0.3 + 0.2 * gl;
      c.fillStyle = '#ffd23f';
      c.beginPath();
      c.arc(X + 16, Y + 14, 24, 0, 7);
      c.fill();
      c.restore();
    }
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(X + 16, Y + 30, 16, 4, 0, 0, 7);
    c.fill();
    c.fillStyle = '#7a4a24';
    c.fillRect(X + 2, Y + 12, 28, 18);
    c.fillStyle = '#c9a227';
    c.fillRect(X + 2, Y + 12, 28, 3);
    c.fillRect(X + 6, Y + 12, 3, 18);
    c.fillRect(X + 23, Y + 12, 3, 18);
    if (open) {
      c.fillStyle = '#5a3418';
      c.beginPath();
      c.moveTo(X + 2, Y + 12);
      c.lineTo(X + 4, Y - 2);
      c.lineTo(X + 28, Y - 2);
      c.lineTo(X + 30, Y + 12);
      c.closePath();
      c.fill();
      c.fillStyle = '#2a1a0c';
      c.fillRect(X + 4, Y + 10, 24, 3);
    } else {
      c.fillStyle = '#8a5a2b';
      c.beginPath();
      c.moveTo(X + 2, Y + 12);
      c.quadraticCurveTo(X + 16, Y - 2, X + 30, Y + 12);
      c.closePath();
      c.fill();
      c.fillStyle = '#c9a227';
      c.fillRect(X + 14, Y + 10, 5, 7);
      c.fillStyle = '#2b2b2b';
      c.fillRect(X + 15.8, Y + 13, 1.4, 2.5);
      for (let k = 0; k < 3; k++) {
        const a = now * 2 + k * 2.1;
        c.fillStyle = 'rgba(255,240,150,.9)';
        c.fillRect(X + 16 + Math.cos(a) * 14, Y + 6 + Math.sin(a * 1.3) * 8, 1.6, 1.6);
      }
    }
  } else if (o.k === 'wallsign') {
    c.fillStyle = '#6f6a62';
    c.fillRect(X + 4, Y + 2, w - 8, h - 6);
    c.strokeStyle = '#4a463f';
    c.lineWidth = 2;
    c.strokeRect(X + 4, Y + 2, w - 8, h - 6);
    c.fillStyle = '#c9e8ff';
    c.font = 'bold 7px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.fillText('≈ ⚓ ≈', X + w / 2, Y + 12);
    c.fillText('~ ◊ ~', X + w / 2, Y + 21);
  } else if (o.k === 'torch') {
    const fl = Math.sin(now * 13 + o.x * 3) * 0.5 + Math.sin(now * 7.3 + o.y) * 0.5;
    c.save();
    c.globalAlpha = 0.22 + 0.06 * fl;
    const g = c.createRadialGradient(X + 16, Y + 8, 2, X + 16, Y + 8, 58);
    g.addColorStop(0, '#ffcf6b');
    g.addColorStop(1, 'rgba(255,160,60,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(X + 16, Y + 8, 58, 0, 7);
    c.fill();
    c.restore();
    c.fillStyle = '#4a2e1a';
    c.fillRect(X + 14, Y + 8, 4, 16);
    c.fillStyle = '#2f3337';
    c.fillRect(X + 12, Y + 7, 8, 3);
    c.fillStyle = '#ff8a1e';
    c.beginPath();
    c.ellipse(X + 16, Y + 2 - fl, 4.2, 7 + fl, 0, 0, 7);
    c.fill();
    c.fillStyle = '#ffe08a';
    c.beginPath();
    c.ellipse(X + 16, Y + 4 - fl * 0.5, 2, 4, 0, 0, 7);
    c.fill();
  } else if (o.k === 'swordstone') {
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(X + 16, Y + 28, 16, 5, 0, 0, 7);
    c.fill();
    c.fillStyle = '#6f6a62';
    c.beginPath();
    c.moveTo(X + 2, Y + 28);
    c.lineTo(X + 5, Y + 14);
    c.lineTo(X + 16, Y + 10);
    c.lineTo(X + 28, Y + 15);
    c.lineTo(X + 30, Y + 28);
    c.closePath();
    c.fill();
    c.fillStyle = '#8f897e';
    c.fillRect(X + 8, Y + 14, 14, 4);
    const gl = 0.5 + 0.5 * Math.sin(now * 3);
    c.save();
    c.globalAlpha = 0.25 + 0.25 * gl;
    c.fillStyle = '#bfe8ff';
    c.beginPath();
    c.arc(X + 16, Y - 6, 16, 0, 7);
    c.fill();
    c.restore();
    c.fillStyle = '#d8dee5';
    c.fillRect(X + 14.5, Y - 18, 3, 30);
    c.fillStyle = '#c9a227';
    c.fillRect(X + 9, Y - 20, 14, 3);
    c.fillStyle = '#5a3418';
    c.fillRect(X + 14.5, Y - 29, 3, 9);
    c.fillStyle = '#c9a227';
    c.beginPath();
    c.arc(X + 16, Y - 30, 2.4, 0, 7);
    c.fill();
  } else if (o.k === 'cexit') {
    c.fillStyle = 'rgba(0,0,0,.45)';
    c.beginPath();
    c.ellipse(X + 16, Y + 18, 14, 9, 0, 0, 7);
    c.fill();
    c.strokeStyle = '#8a5a35';
    c.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(X + 8, Y + 10 + k * 5);
      c.lineTo(X + 24, Y + 10 + k * 5);
      c.stroke();
    }
    c.fillStyle = 'rgba(180,230,255,.25)';
    c.beginPath();
    c.ellipse(X + 16, Y + 12, 10, 16, 0, 0, 7);
    c.fill();
  }
}

function drawFishLine(c) {
  const w = player.work,
    hx = player.x * TILE + Math.cos(player.ang) * 30,
    hy = player.y * TILE - 40,
    bx = w.wx * TILE,
    by = w.wy * TILE + Math.sin(now * 6) * 1.5 + (w.t > w.dur - 0.5 ? 5 : 0);
  c.strokeStyle = '#6b4226';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(player.x * TILE + Math.cos(player.ang) * 8, player.y * TILE - 16);
  c.lineTo(hx, hy);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.8)';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(hx, hy);
  c.quadraticCurveTo((hx + bx) / 2, by - 6, bx, by);
  c.stroke();
  c.fillStyle = '#e5484d';
  c.beginPath();
  c.arc(bx, by - 2, 2.6, 0, 7);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(bx - 2.5, by - 2, 5, 2);
  c.strokeStyle = 'rgba(255,255,255,.5)';
  c.beginPath();
  c.ellipse(bx, by, 5 + Math.sin(now * 3) * 2, 2, 0, 0, 7);
  c.stroke();
}

// ---- Essen ----
const EDIBLE = new Set(['fish', 'cod', 'tuna', 'ffish', 'bread', 'soup', 'cake', 'pie', 'salad', 'carrot']);
const FOODCOL = {
  fish: '#c9d8e4',
  cod: '#b7a77a',
  tuna: '#3d5a80',
  ffish: '#d99a4a',
  bread: '#c98a3a',
  soup: '#e07a2a',
  cake: '#e8a35c',
  pie: '#d9781e',
  salad: '#f08a3a',
  carrot: '#f08a3a',
};

function eatItem(k) {
  if (player.work || player.sleep || player.mount)
    return toast('Gerade nicht, mach erst fertig, was du tust.');
  if (!(state.inv[k] > 0)) return;
  state.inv[k]--;
  player.work = { kind: 'eat', t: 0, dur: 2.7, k };
  closeModal();
  changed();
}
