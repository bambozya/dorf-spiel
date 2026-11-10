// ================= Fahrrad in 3D =================
function drawBike3D(c, fx, fy, b, ang, phase, rider, s) {
  s = s || 1;
  const ca = Math.cos(ang),
    sa = Math.sin(ang);
  const P3 = (x, y, z) => {
    const wx = -x * sa + y * ca,
      wy = x * ca + y * sa;
    return [fx + wx * s, fy + (wy * 0.5 - z) * s];
  };
  const col = b.col || '#e5484d',
    dk = shade(col, -45),
    lt = shade(col, 55),
    cr = (phase || 0) * 0.5,
    R = 7.6,
    nt = night();
  // Schatten
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.beginPath();
  const sh = [P3(0, -19, 0), P3(2.5, 0, 0), P3(0, 19, 0), P3(-2.5, 0, 0)];
  sh.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.closePath();
  c.fill();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const tube = (a, b2, cl, w) => {
    const p = P3(...a),
      q = P3(...b2);
    c.strokeStyle = shade(cl, -55);
    c.lineWidth = (w + 1) * s;
    c.beginPath();
    c.moveTo(p[0], p[1]);
    c.lineTo(q[0], q[1]);
    c.stroke();
    c.strokeStyle = cl;
    c.lineWidth = w * s;
    c.stroke();
    c.strokeStyle = shade(cl, 70);
    c.lineWidth = Math.max(0.6, w * 0.3) * s;
    c.beginPath();
    c.moveTo(p[0], p[1] - w * 0.25 * s);
    c.lineTo(q[0], q[1] - w * 0.25 * s);
    c.stroke();
  };
  const ring = (cy0, rad, x, cl, w, a0, a1) => {
    c.strokeStyle = cl;
    c.lineWidth = w * s;
    c.beginPath();
    const n = 28;
    for (let k = 0; k <= n; k++) {
      const a = (a0 || 0) + (((a1 === undefined ? Math.PI * 2 : a1) - (a0 || 0)) * k) / n;
      const p = P3(x, cy0 + Math.cos(a) * rad, R + Math.sin(a) * rad);
      k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
    }
    c.stroke();
  };
  const wheel = (cy0, rear) => {
    ring(cy0, R, -1.3, '#111111', 2.6);
    ring(cy0, R, 1.3, '#2b2b2b', 2.6);
    ring(cy0, R, 0, '#3a3a3a', 2.4);
    ring(cy0, R - 0.2, 0, 'rgba(90,90,90,.6)', 0.6);
    ring(cy0, R - 1.7, 0, '#d9e0e6', 1.2);
    ring(cy0, R - 2.1, 0, '#8f9aa3', 0.5);
    c.strokeStyle = 'rgba(215,222,228,.75)';
    c.lineWidth = 0.35 * s;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + cr * (rear ? 1 : 1.05);
      const p = P3(0, cy0, R),
        q = P3(0, cy0 + Math.cos(a) * (R - 1.8), R + Math.sin(a) * (R - 1.8));
      c.beginPath();
      c.moveTo(p[0], p[1]);
      c.lineTo(q[0], q[1]);
      c.stroke();
    }
    const h = P3(0, cy0, R);
    c.fillStyle = '#b9c2cb';
    c.beginPath();
    c.arc(h[0], h[1], 1.4 * s, 0, 7);
    c.fill();
    c.fillStyle = '#6d747d';
    c.beginPath();
    c.arc(h[0], h[1], 0.6 * s, 0, 7);
    c.fill();
    ring(cy0, R + 1.6, 0, shade(col, -20), 1.4, Math.PI * 0.08, Math.PI * 0.92);
  };
  const RA = [0, -11.5, R],
    FA = [0, 11.5, R],
    BB = [0, -0.5, 6.5],
    ST = [0, -4.5, 17],
    HT = [0, 8, 17.5],
    HB = [0, 9, 13];
  const farY = sa < 0 ? 11.5 : -11.5;
  wheel(farY, farY < 0);
  // Antrieb: Kettenblatt, Kette, Ritzel
  ring(-11.5, 2, 1.2, '#7d8590', 1);
  const cb = P3(1.2, -0.5, 6.5);
  c.strokeStyle = '#9aa3ab';
  c.lineWidth = 1.2 * s;
  c.beginPath();
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * Math.PI * 2,
      rr = k % 2 ? 3.4 : 3.9,
      p = P3(1.2, -0.5 + Math.cos(a) * rr, 6.5 + Math.sin(a) * rr);
    k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
  }
  c.stroke();
  tube([1.2, -0.5, 10.2], [1.2, -11.5, 9.5], '#4e555e', 0.6);
  tube([1.2, -0.5, 2.8], [1.2, -11.5, 5.5], '#4e555e', 0.6);
  // Rahmen
  tube(RA, BB, dk, 1.5);
  tube(RA, ST, dk, 1.3);
  tube(BB, ST, col, 2.2);
  tube(ST, HT, col, 2.1);
  tube(BB, HB, col, 2.6);
  tube(HT, HB, col, 2.6);
  tube(HB, FA, '#aab3bb', 1.5);
  // Gepäckträger mit Rücklicht
  tube([0, -4.5, 15], [0, -13, 13.5], '#8f9aa3', 0.8);
  tube([0, -13, 13.5], [0, -11.5, R], '#8f9aa3', 0.7);
  {
    const p = P3(0, -14, 13.2);
    c.fillStyle = '#c92a2a';
    c.fillRect(p[0] - 1.5 * s, p[1] - 1 * s, 3 * s, 2 * s);
    if (nt > 0.15) {
      c.fillStyle = 'rgba(255,60,60,.35)';
      c.beginPath();
      c.arc(p[0], p[1], 5 * s, 0, 7);
      c.fill();
    }
  }
  // Sattel
  tube([0, -4.5, 17], [0, -4.6, 19.3], '#9aa3ab', 1);
  {
    const q = [P3(-2.2, -7, 19.6), P3(2.2, -7, 19.6), P3(1.1, -1, 19.8), P3(-1.1, -1, 19.8)];
    c.fillStyle = '#2b2b2b';
    c.beginPath();
    q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    c.fill();
    c.strokeStyle = '#111';
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.moveTo(q[0][0], q[0][1] + 1.2 * s);
    c.lineTo(q[1][0], q[1][1] + 1.2 * s);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.fillRect(q[3][0] - 1 * s, q[3][1] - 0.6 * s, 2 * s, 1 * s);
  }
  // Lenker, Griffe, Klingel, Lampe
  tube([0, 8, 17.5], [0, 8.3, 21], '#9aa3ab', 1.1);
  tube([-6.5, 8.8, 21], [6.5, 8.8, 21], '#7d8590', 1.1);
  tube([-6.5, 8.8, 21], [-8.5, 8.2, 21], '#1e1e1e', 2);
  tube([6.5, 8.8, 21], [8.5, 8.2, 21], '#1e1e1e', 2);
  {
    const p = P3(3, 9, 21.8);
    c.fillStyle = '#d9e0e6';
    c.beginPath();
    c.arc(p[0], p[1], 1.3 * s, 0, 7);
    c.fill();
  }
  {
    const p = P3(0, 10.2, 16);
    c.fillStyle = '#e8eef2';
    c.beginPath();
    c.arc(p[0], p[1], 1.8 * s, 0, 7);
    c.fill();
    c.fillStyle = nt > 0.15 ? '#fff6b0' : '#cfd7de';
    c.beginPath();
    c.arc(p[0], p[1], 1.1 * s, 0, 7);
    c.fill();
    if (nt > 0.15) {
      c.fillStyle = 'rgba(255,240,170,.3)';
      c.beginPath();
      const a = P3(0, 24, 1),
        b2 = P3(-6, 26, 0),
        d = P3(6, 26, 0);
      c.moveTo(p[0], p[1]);
      c.lineTo(b2[0], b2[1]);
      c.lineTo(a[0], a[1]);
      c.lineTo(d[0], d[1]);
      c.closePath();
      c.fill();
    }
  }
  // Kurbel und Pedale
  const pd = (sd) => {
    const a = cr + (sd > 0 ? 0 : Math.PI),
      py = -0.5 + Math.cos(a) * 3.6,
      pz = 6.5 + Math.sin(a) * 3.6;
    tube([sd * 1.8, -0.5, 6.5], [sd * 2.8, py, pz], '#7d8590', 0.9);
    const p = P3(sd * 4, py, pz);
    c.fillStyle = '#2b2b2b';
    c.fillRect(p[0] - 1.6 * s, p[1] - 0.8 * s, 3.2 * s, 1.6 * s);
  };
  pd(-1);
  if (!rider) tube([-1, -0.5, 6.5], [-3.5, 2, 0], '#6d747d', 0.8);
  if (rider)
    renderParts(
      c,
      fx,
      fy,
      shiftParts(personParts(rider, 0, { ride: 1, bike: 1, pedal: cr }), 0, -4.5, 4.5),
      ang,
      s,
    );
  pd(1);
  wheel(-farY, -farY < 0);
}

// Lenker vorne im Bild, wenn man in der 3D-Ansicht Fahrrad fährt
function bikeHUD(cx, RW, RH) {
  const b = player.mount.o,
    col = b.col || '#e5484d',
    bob = player.moving ? Math.sin(player.phase) * RH * 0.006 : 0,
    y = RH * 0.9 + bob,
    L = state.look;
  cx.lineCap = 'round';
  cx.strokeStyle = '#5e666f';
  cx.lineWidth = RH * 0.03;
  cx.beginPath();
  cx.moveTo(RW * 0.5, RH * 1.05);
  cx.lineTo(RW * 0.5, y);
  cx.stroke();
  cx.strokeStyle = col;
  cx.lineWidth = RH * 0.045;
  cx.beginPath();
  cx.moveTo(RW * 0.5, RH * 1.1);
  cx.lineTo(RW * 0.5, RH * 0.98 + bob);
  cx.stroke();
  cx.strokeStyle = '#8f9aa3';
  cx.lineWidth = RH * 0.022;
  cx.beginPath();
  cx.moveTo(RW * 0.2, y + RH * 0.03);
  cx.quadraticCurveTo(RW * 0.5, y - RH * 0.025, RW * 0.8, y + RH * 0.03);
  cx.stroke();
  cx.strokeStyle = 'rgba(255,255,255,.5)';
  cx.lineWidth = RH * 0.006;
  cx.beginPath();
  cx.moveTo(RW * 0.25, y + RH * 0.018);
  cx.quadraticCurveTo(RW * 0.5, y - RH * 0.032, RW * 0.75, y + RH * 0.018);
  cx.stroke();
  for (const sd of [-1, 1]) {
    const gx = RW * (0.5 + sd * 0.33);
    cx.strokeStyle = '#1e1e1e';
    cx.lineWidth = RH * 0.05;
    cx.beginPath();
    cx.moveTo(gx - sd * RW * 0.05, y + RH * 0.035);
    cx.lineTo(gx + sd * RW * 0.04, y + RH * 0.05);
    cx.stroke();
    cx.fillStyle = L.skin;
    cx.beginPath();
    cx.ellipse(gx, y + RH * 0.035, RW * 0.035, RH * 0.04, 0, 0, 7);
    cx.fill();
    cx.fillStyle = shade(L.skin, -20);
    cx.fillRect(gx - RW * 0.03, y + RH * 0.05, RW * 0.06, RH * 0.008);
  }
  cx.fillStyle = '#d9e0e6';
  cx.beginPath();
  cx.arc(RW * 0.6, y - RH * 0.01, RH * 0.022, 0, 7);
  cx.fill();
  cx.fillStyle = '#9aa3ab';
  cx.beginPath();
  cx.arc(RW * 0.6, y - RH * 0.01, RH * 0.01, 0, 7);
  cx.fill();
}
