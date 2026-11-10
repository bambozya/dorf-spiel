// ================= Haus-Säcke in der Scheune und eigene Feldreihe =================
let BARNDB = null,
  BARNS = {};
(async () => {
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const db = await window.claude.use('db');
    if (!db) return;
    BARNDB = db.collection('barn');
    BARNDB.onSnapshot(
      (qs) => {
        const N = {};
        qs.docs.forEach((d) => {
          if (d.exists) N[d.id] = d.data();
        });
        BARNS = N;
      },
      () => {
        BARNDB = null;
      },
    );
  } catch (e) {}
})();
const houseMode = () => !!LOCKDB;

function isResident(n) {
  if (!LOCKDB) return true;
  const L = houseLock(n);
  if (!L || !MYID) return false;
  return !!((L.res && L.res[MYID]) || L.uid === MYID || knownCodes()['h' + n] === L.h);
}

function myHouses() {
  const r = [];
  for (let n = 1; n <= 6; n++) if (houseLock(n) && isResident(n)) r.push(n);
  return r;
}
const canUseRow = (row) => !houseMode() || isResident(row + 1);
const HSACK = { seed_carrot: 3, seed_wheat: 2, seed_pumpkin: 1 };
const sackTaken = (n) => {
  const d = BARNS['h' + n];
  return !!(d && d.day === state.day);
};
const BR_SACK = 's' + Math.random().toString(36).slice(2);
let sackBusy = false;

async function takeHouseSack(n) {
  if (sackBusy) return;
  if (!houseLock(n))
    return toast(`Haus ${n} gehört noch niemandem. Den Sack darf erst jemand nehmen, der dort wohnt.`);
  if (!isResident(n))
    return toast(
      `Das ist der Saatsack von <b>Haus ${n}</b>. Den dürfen nur die Bewohner von Haus ${n} nehmen.`,
      4000,
    );
  if (sackTaken(n))
    return toast(
      `Den Sack von Haus ${n} hat heute schon jemand aus deinem Haus geleert. Morgen früh ist er wieder voll.`,
      4000,
    );
  sackBusy = true;
  let ok = false;
  try {
    const ref = BARNDB.doc('h' + n);
    for (let t = 0; t < 8; t++) {
      const a = await ref.acquire({ holder: BR_SACK, ttlMs: 3000 });
      if (a.acquired) {
        const g = await ref.get();
        const d = g.exists ? g.data() : null;
        if (d && d.day === state.day) {
          BARNS['h' + n] = d;
          break;
        }
        const nd = { day: state.day, by: (state.name || 'Jemand').slice(0, 14), at: Date.now() };
        await ref.set(nd);
        BARNS['h' + n] = nd;
        ok = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    }
  } catch (e) {
    sackBusy = false;
    return toast('Das hat nicht geklappt. Versuch es gleich nochmal.');
  }
  sackBusy = false;
  if (!ok) return toast(`Zu spät, jemand aus Haus ${n} hat den Sack gerade geleert.`);
  for (const k in HSACK) state.inv[k] = (state.inv[k] || 0) + HSACK[k];
  float(player.x, player.y - 1.6, '+3 Karotten-, +2 Weizen-, +1 Kürbissamen', '#b9f0a0');
  chips(player.x, player.y - 0.4, 8, ['#d9b45a', '#b98a5a', '#f2d27a'], 10);
  changed();
}
