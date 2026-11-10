// ================= Eingabe =================
const keys = new Set();
let joy = { x: 0, y: 0 };
const keyOf = (e) => {
  const c = e.code || '';
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();
  if (c === 'Space') return ' ';
  if (c === 'Enter' || c === 'NumpadEnter') return 'enter';
  return (e.key || '').toLowerCase();
};
addEventListener('keydown', (e) => {
  const k = keyOf(e);
  if (document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
  if (tv) {
    e.preventDefault();
    if (k === 'arrowright') tvStep(1);
    else if (k === 'arrowleft') tvStep(-1);
    else if (k === 'escape' || k === 'e' || k === ' ' || k === 'enter') closeTV();
    return;
  }
  if (!modal.hidden) {
    if (k === 'escape' || (k === 'e' && modalClosable)) {
      closeModal();
      e.preventDefault();
    }
    return;
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === ' ') {
    if (!e.repeat) {
      if (player.sit || player.sleep) doAct();
      else jump();
    }
    return;
  }
  if (k === 'e' || k === 'enter') {
    if (!e.repeat) doAct();
    return;
  }
  if (k === 'b' && scene && !scene.shop) {
    setBuild(!buildMode);
    return;
  }
  if (k === 'x' && carry) {
    removeCarry();
    return;
  }
  if (k === 'p' && scene && !scene.shop && !player.sleep && !player.sit && modal.hidden) {
    if (carry) placeCarry();
    else {
      let best = null,
        bd = 1;
      for (const it of buildInteractions()) {
        const d = Math.hypot(it.x - player.x, it.y - player.y) / it.r;
        if (d < bd) {
          bd = d;
          best = it;
        }
      }
      if (best) best.act();
      else toast('Hier ist kein Möbelstück zum Aufheben. Stell dich direkt daneben und drück P.');
    }
    return;
  }
  if (k === 'q') {
    cycleSeed();
    return;
  }
  if (k === 'h') {
    toggleKeys();
    return;
  }
  if (k === 'n') {
    attack();
    return;
  }
  if (k === 'v') {
    setView(view === 'normal' ? '3d' : view === '3d' ? 'map' : 'normal');
    return;
  }
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(keyOf(e)));
cv.addEventListener('pointerdown', () => {
  try {
    window.focus();
  } catch (e) {}
});
addEventListener('blur', () => keys.clear());
const stick = document.getElementById('stick'),
  knob = document.getElementById('knob');
let stickId = null;

function stickMove(e) {
  const r = stick.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2),
    dy = e.clientY - (r.top + r.height / 2);
  const m = Math.hypot(dx, dy),
    mx = 45;
  if (m > mx) {
    dx = (dx / m) * mx;
    dy = (dy / m) * mx;
  }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  joy = { x: dx / mx, y: dy / mx };
  if (Math.hypot(joy.x, joy.y) < 0.25) joy = { x: 0, y: 0 };
}
stick.addEventListener('pointerdown', (e) => {
  stickId = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  stickMove(e);
});
stick.addEventListener('pointermove', (e) => {
  if (e.pointerId === stickId) stickMove(e);
});
const stickEnd = (e) => {
  if (e.pointerId !== stickId) return;
  stickId = null;
  joy = { x: 0, y: 0 };
  knob.style.transform = '';
};
stick.addEventListener('pointerup', stickEnd);
stick.addEventListener('pointercancel', stickEnd);
document.getElementById('act').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  doAct();
});
document.getElementById('jumpbtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (player.sit || player.sleep) doAct();
  else jump();
});
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
