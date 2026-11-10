// ================= Erfolgsmomente und der Fernseher =================
function moment(key, text, icon, quiet) {
  state.moments = state.moments || [];
  if (state.moments.some((m) => m.key === key)) return;
  state.moments.push({ key, text, icon, day: state.day });
  if (state.moments.length > 40) state.moments.shift();
  if (!quiet)
    setTimeout(
      () => toast('<b>Neuer Erfolgsmoment!</b> ' + esc(text) + ' Schau ihn dir im Fernseher an.', 4500),
      400,
    );
}
let tv = null;
const TVCOL = {
  coin: ['#ffcf4a', '#ff8a2a'],
  bridge: ['#6cc1f0', '#2f6fb0'],
  house: ['#ff9a7a', '#c0452f'],
  bolt: ['#ffe36b', '#e8a21c'],
  drop: ['#8fd8ff', '#2f8fd4'],
  horse: ['#ffd3a1', '#b5652e'],
  bed: ['#c9b2ff', '#6b4fb5'],
  carrot: ['#ffc38a', '#e8731c'],
  wheat: ['#f7e39a', '#c9a52e'],
  pumpkin: ['#ffbe7a', '#d9621a'],
  bread: ['#f5d4a0', '#a8692e'],
  soup: ['#ffd0a0', '#e8731c'],
  axe: ['#d6dde4', '#6d747d'],
  plank: ['#e8c08a', '#8a5a35'],
};

function openTV() {
  if (!hasPower(scene.house.n))
    return toast(
      'Ohne Strom bleibt der Fernseher schwarz. Kauf auf dem Zettel in der Küche Strom für das Haus.',
    );
  tv = { i: 0, t: 0, conf: [] };
  $('tv').hidden = false;
  keys.clear();
  const c = $('tvc');
  c.width = Math.round(c.clientWidth * DPR) || 800;
  c.height = Math.round(c.clientHeight * DPR) || 500;
  tvShow();
}

function closeTV() {
  tv = null;
  $('tv').hidden = true;
}

function tvShow() {
  const ms = state.moments || [];
  tv.t = 0;
  tv.conf = [];
  for (let i = 0; i < 60; i++)
    tv.conf.push({
      x: Math.random(),
      y: -Math.random(),
      v: 0.15 + Math.random() * 0.25,
      r: Math.random() * 6,
      c: pick(['#e5484d', '#ffd23f', '#3fa7d6', '#3f9a3a', '#ff8fb1', '#fff'], Math.random),
    });
  if (!ms.length) {
    $('tvt').textContent = 'Noch keine großen Momente';
    $('tvd').textContent =
      'Ernte etwas, bau die Brücke oder verkauf auf dem Markt. Dann siehst du hier deine Erfolge!';
    $('tvn').textContent = '';
    return;
  }
  const m = ms[tv.i];
  $('tvt').textContent = m.text;
  $('tvd').textContent = 'Tag ' + m.day;
  $('tvn').textContent = tv.i + 1 + ' / ' + ms.length;
}

function tvStep(d) {
  const n = (state.moments || []).length;
  if (!n) return;
  tv.i = (tv.i + d + n) % n;
  tvShow();
}

function tvIcon(x, icon, X, Y, S, t) {
  if (icon.startsWith('tool_')) {
    drawTool(x, icon.slice(5), X, Y, S);
    return;
  }
  if (VEG.has(icon)) {
    drawVeg(x, icon, X, Y, S);
    return;
  }
  if (SP[icon]) {
    spr(x, SP[icon].r, SP[icon].p, X - S / 2, Y - S / 2, S / 8);
    return;
  }
  if (icon === 'horse') {
    drawHorse3D(x, X, Y + S * 0.4, horses[1], t * 0.8, t * 8, null, S / 45);
    return;
  }
  x.save();
  x.translate(X, Y);
  const s = S / 100;
  x.scale(s, s);
  if (icon === 'house') {
    x.fillStyle = '#f6e7c8';
    x.fillRect(-40, -10, 80, 55);
    x.fillStyle = '#3d6fb0';
    x.beginPath();
    x.moveTo(-50, -8);
    x.lineTo(0, -50);
    x.lineTo(50, -8);
    x.fill();
    x.fillStyle = '#a9dcef';
    x.fillRect(-30, 0, 18, 16);
    x.fillRect(12, 0, 18, 16);
    x.fillStyle = '#6b4226';
    x.fillRect(-8, 15, 16, 30);
  } else if (icon === 'bridge') {
    x.fillStyle = '#3d97d4';
    x.fillRect(-55, 20, 110, 25);
    x.fillStyle = '#b07a43';
    x.fillRect(-55, 0, 110, 16);
    x.fillStyle = '#6b4226';
    for (let i = -50; i < 55; i += 12) x.fillRect(i, 0, 3, 16);
    x.fillRect(-55, -14, 110, 5);
    for (let i = -52; i < 56; i += 26) x.fillRect(i, -14, 5, 18);
  } else if (icon === 'bolt') {
    x.fillStyle = '#ffd23f';
    x.strokeStyle = '#8a5a00';
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(10, -50);
    x.lineTo(-25, 5);
    x.lineTo(0, 5);
    x.lineTo(-10, 50);
    x.lineTo(28, -8);
    x.lineTo(3, -8);
    x.closePath();
    x.fill();
    x.stroke();
  } else if (icon === 'drop') {
    x.fillStyle = '#3fa7d6';
    x.beginPath();
    x.moveTo(0, -50);
    x.quadraticCurveTo(38, 0, 30, 18);
    x.arc(0, 18, 30, 0, Math.PI);
    x.quadraticCurveTo(-38, 0, 0, -50);
    x.fill();
    x.fillStyle = '#bfe8ff';
    x.fillRect(-15, 5, 8, 16);
  } else if (icon === 'bed') {
    x.fillStyle = '#6b4226';
    x.fillRect(-45, -10, 90, 50);
    x.fillStyle = '#fff';
    x.fillRect(-40, -5, 25, 20);
    x.fillStyle = '#8e5bd6';
    x.fillRect(-12, -5, 52, 40);
    x.fillStyle = '#fff8e6';
    x.font = 'bold 28px "Pixelify Sans", monospace';
    x.fillText('Z', 30, -25);
    x.fillText('z', 48, -40);
  }
  x.restore();
}

function tvDraw(dt) {
  if (!tv) return;
  const ms = state.moments || [];
  tv.t += dt;
  if (ms.length > 1 && tv.t > 6) {
    tvStep(1);
  }
  const c = $('tvc'),
    x = c.getContext('2d'),
    W2 = c.width / DPR,
    H2 = c.height / DPR;
  x.setTransform(DPR, 0, 0, DPR, 0, 0);
  const m = ms[tv.i],
    col = TVCOL[m ? m.icon : 'coin'] || TVCOL.coin;
  const g = x.createLinearGradient(0, 0, 0, H2);
  g.addColorStop(0, col[0]);
  g.addColorStop(1, col[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, W2, H2);
  x.save();
  x.translate(W2 * 0.62, H2 * 0.42);
  x.rotate(now * 0.25);
  x.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 12; i++) {
    x.rotate(Math.PI / 6);
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(W2, -W2 * 0.12);
    x.lineTo(W2, W2 * 0.12);
    x.fill();
  }
  x.restore();
  x.fillStyle = '#7cc35a';
  x.fillRect(0, H2 * 0.8, W2, H2 * 0.2);
  x.fillStyle = '#5fa544';
  x.fillRect(0, H2 * 0.8, W2, 5);
  if (m) {
    const jump = Math.abs(Math.sin(tv.t * 4)) * H2 * 0.05;
    drawPerson(x, W2 * 0.3, H2 * 0.84 - jump, state.look, 'down', tv.t * 10, {
      ang: Math.PI / 2 + Math.sin(tv.t * 1.3) * 0.6,
      s: H2 / 95,
      cheer: 1,
    });
    tvIcon(x, m.icon, W2 * 0.64, H2 * 0.4 + Math.sin(tv.t * 2.5) * H2 * 0.02, Math.min(W2, H2) * 0.38, tv.t);
  } else {
    drawPerson(x, W2 * 0.5, H2 * 0.84, state.look, 'down', 0, {
      ang: Math.PI / 2 + Math.sin(tv.t) * 0.5,
      s: H2 / 95,
    });
  }
  if (m)
    for (const p of tv.conf) {
      p.y += p.v * dt;
      p.r += dt * 4;
      if (p.y > 1.05) {
        p.y = -0.05;
        p.x = Math.random();
      }
      x.save();
      x.translate(p.x * W2, p.y * H2);
      x.rotate(p.r);
      x.fillStyle = p.c;
      x.fillRect(-4, -2, 8, 4);
      x.restore();
    }
}
