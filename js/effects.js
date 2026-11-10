// ================= Licht und Stimmung =================
function roofShade(c, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,.18)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.22)');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const s = c.createLinearGradient(x, 0, x + w, 0);
  s.addColorStop(0, 'rgba(255,255,255,.08)');
  s.addColorStop(1, 'rgba(0,0,0,.12)');
  c.fillStyle = s;
  c.fillRect(x, y, w, h);
}

function castShadow(c, x, top, w, bottom) {
  c.fillStyle = 'rgba(20,30,10,.2)';
  c.beginPath();
  c.moveTo(x + w, top + 8);
  c.lineTo(x + w + 18, top + 20);
  c.lineTo(x + w + 18, bottom + 8);
  c.lineTo(x + 18, bottom + 8);
  c.lineTo(x, bottom);
  c.lineTo(x + w, bottom);
  c.closePath();
  c.fill();
}

function grade(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  const W2 = cv.width,
    H2 = cv.height,
    h = 6 + state.t * 24;
  let warm = 0;
  if (h < 8.5) warm = ((8.5 - h) / 2.5) * 0.16;
  else if (h > 16.5 && h < 21) warm = Math.sin(((h - 16.5) / 4.5) * Math.PI) * 0.2;
  {
    const day = Math.max(0, 1 - night() * 1.6);
    if (day > 0) {
      const a = c.createLinearGradient(0, 0, 0, H2);
      a.addColorStop(0, `rgba(110,150,230,${0.16 * day})`);
      a.addColorStop(0.55, 'rgba(128,128,128,0)');
      a.addColorStop(1, `rgba(255,190,120,${0.14 * day})`);
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = a;
      c.fillRect(0, 0, W2, H2);
      c.fillStyle = `rgba(255,250,235,${0.1 * day})`;
      c.fillRect(0, 0, W2, H2);
      c.globalCompositeOperation = 'source-over';
    }
  }
  if (warm > 0) {
    c.globalCompositeOperation = 'soft-light';
    c.fillStyle = `rgba(255,150,60,${warm * 2})`;
    c.fillRect(0, 0, W2, H2);
    c.globalCompositeOperation = 'source-over';
  }
  const g = c.createRadialGradient(
    W2 / 2,
    H2 / 2,
    Math.min(W2, H2) * 0.35,
    W2 / 2,
    H2 / 2,
    Math.max(W2, H2) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(25,18,8,.32)');
  c.fillStyle = g;
  c.fillRect(0, 0, W2, H2);
}

// ================= Abbau-Animationen: Baum fällen, Ernten =================
let PARTS = [];

function chips(x, y, n, cols, up) {
  for (let k = 0; k < n; k++)
    PARTS.push({
      x: x * TILE + (Math.random() - 0.5) * 10,
      y: y * TILE + (Math.random() - 0.5) * 6,
      z: up || 14 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 90,
      vy: (Math.random() - 0.5) * 40,
      vz: 40 + Math.random() * 80,
      col: pick(cols, Math.random),
      life: 1.1 + Math.random() * 0.6,
      sz: 1.5 + Math.random() * 2,
      leaf: cols === LEAFC,
    });
}
const WOODC = ['#d9a46a', '#c08c58', '#f0cf9a', '#8a5a35'],
  LEAFC = ['#4f9a42', '#6db455', '#2f6b31', '#8fcb6a'],
  DIRTC = ['#7a4e2f', '#93613b', '#5e3a22'];
const chopSwing = (t) => {
  const u = (t % 0.4) / 0.4;
  return u < 0.6 ? 0.5 + (u / 0.6) * 2.3 : 2.8 - ((u - 0.6) / 0.4) * 2.3;
};

function startChop(t) {
  if (!state.axe) return toast('Du brauchst eine <b>Axt</b>. Die liegt in der Werkstatt.');
  player.ang = Math.atan2(t.y + 0.9 - player.y, t.x + 0.5 - player.x);
  player.work = { kind: 'chop', tree: t, t: 0, hits: 0 };
  t.shake = 0;
}

function startHarvest(p, fin) {
  player.ang = Math.atan2(p.y + 0.6 - player.y, p.x + 0.5 - player.x);
  player.work = { kind: 'harvest', t: 0, plot: p, fin };
}

function workTick(dt) {
  const w = player.work;
  if (!w) return;
  w.t += dt * (w.kind === 'chop' && state.sharp === state.day ? 1.7 : 1);
  if (w.kind === 'chop') {
    const tr = w.tree;
    if (w.t < 1.25) {
      const h = Math.floor(w.t / 0.4);
      if (h > w.hits) {
        w.hits = h;
        tr.shake = 0.25;
        chips(tr.x + 0.5, tr.y + 0.85, 9, WOODC);
        chips(tr.x + 0.5, tr.y - 0.6, 5, LEAFC, 40);
        float(tr.x + 0.5, tr.y, 'tock!', '#fff8e6');
      }
    } else if (!tr.fall) {
      tr.fall = { t: 0, dir: player.x < tr.x + 0.5 ? 1 : -1 };
      chips(tr.x + 0.5, tr.y + 0.85, 6, WOODC);
    }
    if (tr.shake > 0) tr.shake -= dt;
    if (tr.fall) {
      tr.fall.t += dt;
      if (tr.fall.t >= 0.75) {
        chips(tr.x + 0.5 + tr.fall.dir * 1.6, tr.y + 0.8, 18, LEAFC, 6);
        chips(tr.x + 0.5 + tr.fall.dir * 1.2, tr.y + 0.8, 10, WOODC, 4);
        tr.fall = null;
        state.chopped.push(tr.id);
        state.inv.wood += 2;
        float(tr.x + 0.5, tr.y - 0.5, '+2 Holz', '#ffb36b');
        player.work = null;
        changed();
      }
    }
  } else if (w.kind === 'mine') {
    const rk = w.rock;
    const h = Math.floor(w.t / 0.4);
    if (h > w.hits && w.t < 1.3) {
      w.hits = h;
      chips(rk.x + 0.5, rk.y + 0.7, 10, ['#9a9384', '#c9c4b8', '#6f6a60'], 10);
      float(rk.x + 0.5, rk.y, 'klonk!', '#fff8e6');
    }
    if (w.t >= 1.3) {
      state.mined = state.mined || [];
      state.mined.push(rk.id);
      const n = 1 + (Math.random() < 0.5 ? 1 : 0);
      state.inv.stone += n;
      chips(rk.x + 0.5, rk.y + 0.7, 16, ['#9a9384', '#c9c4b8', '#6f6a60'], 6);
      float(rk.x + 0.5, rk.y - 0.4, '+' + fmt(n, 'stone'), '#e2ddd2');
      moment('stone1', 'Den ersten Felsen abgebaut!', 'stone');
      player.work = null;
      changed();
    }
  } else if (w.kind === 'fish') {
    if (w.t >= w.dur) {
      player.work = null;
      chips(w.wx, w.wy, 14, ['#bfe8ff', '#ffffff', '#8fd0ff'], 4);
      if (w.shoal) {
        const r = Math.random(),
          k = r < 0.05 ? null : r < 0.28 ? 'fish' : r < 0.72 ? 'cod' : 'tuna';
        if (!k) {
          toast('Ein Stück Seetang. Versuch es nochmal!');
          float(player.x, player.y - 1.8, 'Seetang...', '#7cb55a');
        } else {
          state.inv[k]++;
          float(player.x, player.y - 1.8, '+1 ' + ITEMS[k].n + '!', k === 'tuna' ? '#ffd23f' : '#bfe8ff');
          if (k === 'tuna') moment('tuna1', 'Einen riesigen Thunfisch auf dem Meer gefangen!', 'fish');
          changed();
        }
        if (scene && scene.sea && Math.random() < 0.5) {
          placeShoal(scene.map, w.shoal);
          toast('Der Fischschwarm ist weitergezogen.', 1800);
        }
      } else if (Math.random() < 0.16) {
        toast('Oh! Nur ein alter Stiefel. Versuch es nochmal!');
        float(player.x, player.y - 1.8, 'Stiefel...', '#c9b48a');
      } else {
        state.inv.fish++;
        float(player.x, player.y - 1.8, '+1 Fisch!', '#bfe8ff');
        moment('fish1', 'Den ersten Fisch geangelt!', 'fish');
        changed();
      }
    }
  } else if (w.kind === 'water') {
    if (!w.sp && w.t > 0.2) {
      w.sp = 1;
      chips(w.plot.x + 0.5, w.plot.y + 0.5, 14, ['#8fd0ff', '#bfe8ff', '#5fb2ea'], 18);
    }
    if (w.t >= 0.7) {
      player.work = null;
      float(w.plot.x + 0.5, w.plot.y, 'gegossen!', '#bfe8ff');
      changed();
    }
  } else if (w.kind === 'cook') {
    const pt =
      w.fx === 'steam' || w.fx === 'oven'
        ? ['#ffffff', '#f4efe4', '#e8e8e8']
        : w.fx === 'water'
          ? ['#8fd0ff', '#bfe8ff']
          : w.fx === 'cold'
            ? ['#dff4ff', '#ffffff']
            : ['#ff9a3c', '#5fbf5a', '#f2d27a'];
    if (Math.floor(w.t / 0.18) > (w.n || 0)) {
      w.n = Math.floor(w.t / 0.18);
      chips(
        player.x + Math.cos(player.ang) * 0.9,
        player.y + Math.sin(player.ang) * 0.9 - 0.2,
        3,
        pt,
        w.fx === 'steam' || w.fx === 'oven' ? 26 : 14,
      );
    }
    if (w.t >= w.dur) {
      player.work = null;
      w.fin();
    }
  } else if (w.kind === 'harvest') {
    if (!w.dug && w.t > 0.25) {
      w.dug = 1;
      chips(w.plot.x + 0.5, w.plot.y + 0.6, 10, DIRTC, 4);
    }
    if (w.t >= 0.55) {
      player.work = null;
      w.fin();
    }
  } else if (w.kind === 'eat') {
    const t = w.t,
      mx = player.x + Math.cos(player.ang) * 0.25,
      my = player.y - 1.15,
      fc = FOODCOL[w.k] || '#d99a4a';
    const g = t > 0.9 ? Math.floor((t - 0.9) / 0.45) : -1;
    if (g >= 0 && g < 3 && g > (w.g ?? -1)) {
      w.g = g;
      float(mx, my - 0.3, ['mampf', 'mampf', 'mmh!'][g], '#ffe08a');
      chips(mx, my + 0.2, 5, [fc, '#fff1c9'], 8);
    }
    if (!w.end && t > 2.3) {
      w.end = 1;
      float(player.x, player.y - 1.9, 'Lecker!', '#fff8e6');
      chips(player.x, player.y - 1.6, 6, ['#ff7a8a', '#ffd23f'], 30);
    }
    if (t >= w.dur) {
      player.work = null;
      toast(
        w.k === 'fish'
          ? 'Roher Fisch… naja, schmeckt ein bisschen wie Sushi!'
          : `Mmh, ${ITEMS[w.k].n}! Lecker, jetzt bist du schön satt.`,
      );
      moment('eat1', 'Zum ersten Mal etwas Selbstgemachtes gegessen!', 'bread');
    }
  } else if (w.kind === 'drink') {
    const t = w.t,
      mx = player.x + Math.cos(player.ang) * 0.25,
      my = player.y - 1.15;
    if (!w.s1 && t > 0.35) {
      w.s1 = 1;
      chips(w.wx, w.wy, 12, ['#8fd0ff', '#bfe8ff', '#ffffff'], 22);
      float(w.wx, w.wy - 0.6, 'platsch', '#bfe8ff');
    }
    const g = t > 1 ? Math.floor((t - 1) / 0.42) : -1;
    if (g >= 0 && g < 3 && g > (w.g ?? -1)) {
      w.g = g;
      float(mx, my - 0.3, ['gluck', 'gluck', 'gluck!'][g], '#8fd0ff');
      chips(mx, my + 0.2, 3, ['#8fd0ff', '#bfe8ff'], 6);
    }
    if (!w.end && t > 2.3) {
      w.end = 1;
      float(player.x, player.y - 1.9, 'Ahh!', '#fff8e6');
      chips(mx, my, 5, ['#ffffff', '#bfe8ff'], 30);
    }
    if (t >= w.dur) {
      player.work = null;
      toast(
        pick(
          [
            'Frisches Brunnenwasser. Lecker und kalt!',
            'Ahh, das tut gut! Jetzt hast du wieder Kraft.',
            'Kühles Wasser direkt aus dem Brunnen. Erfrischend!',
          ],
          Math.random,
        ),
      );
      moment('drink1', 'Zum ersten Mal aus dem Brunnen getrunken.', 'drop');
    }
  } else if (w.kind === 'build') {
    const n = Math.floor(w.t / 0.3);
    if (n > (w.n || 0) && w.t < w.dur) {
      w.n = n;
      chips(w.x, w.y, 7, WOODC, 8);
      float(w.x, w.y - 0.8, 'tock!', '#fff8e6');
    }
    if (w.t >= w.dur) {
      player.work = null;
      if (w.fin) w.fin();
    }
  } else if (w.t > 5) player.work = null;
}

function drinkAt(wx, wy) {
  if (player.work || player.mount) return;
  const dx = wx - player.x,
    dy = wy - player.y;
  player.ang = Math.atan2(dy, dx);
  player.rang = player.ang;
  player.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  player.work = { kind: 'drink', t: 0, dur: 2.7, wx, wy };
}

function drinkArm(t) {
  const T = 1.95;
  if (t < 0.4) return 1.15 * (t / 0.4);
  if (t < 0.85) return 1.15 + (T - 1.15) * ((t - 0.4) / 0.45);
  if (t < 2.25) return T + 0.07 * Math.sin((t - 0.85) * 15);
  if (t < 2.7) return T * (1 - (t - 2.25) / 0.45);
  return 0;
}

function partsTick(dt) {
  for (const p of PARTS) {
    p.vz -= 260 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if (p.z < 0) {
      p.z = 0;
      p.vz *= -0.3;
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
    if (p.leaf) {
      p.vz = Math.max(p.vz, -30);
      p.vx += Math.sin(now * 6 + p.y) * 20 * dt;
    }
    p.life -= dt;
  }
  PARTS = PARTS.filter((p) => p.life > 0);
}

function drawParts(c) {
  for (const p of PARTS) {
    c.globalAlpha = Math.min(1, p.life * 2);
    c.fillStyle = p.col;
    if (p.leaf) {
      c.beginPath();
      c.ellipse(p.x, p.y - p.z, p.sz * 1.2, p.sz * 0.6, p.x, 0, 7);
      c.fill();
    } else c.fillRect(p.x - p.sz / 2, p.y - p.z - p.sz / 2, p.sz, p.sz * 0.7);
  }
  c.globalAlpha = 1;
}
