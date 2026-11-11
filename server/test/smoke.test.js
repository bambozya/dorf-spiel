// Rauchtest: startet den Server mit einem Wegwerf-Spielstand und spielt die wichtigsten Nachrichten durch.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const PORT = 18787;
const dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dorf-')), 'db.json');
const env = {
  ...process.env,
  PORT,
  DORF_PASSWORD: 'geheim',
  DORF_OWNER_TOKEN: 'chef',
  DORF_DATA: dataFile,
  DORF_MAX_PLAYERS: 2,
  DORF_CHAT_TTL_MS: 2500,
};

function startServer() {
  const p = spawn(process.execPath, [new URL('../index.js', import.meta.url).pathname], {
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return new Promise((resolve) => p.stdout.on('data', (d) => d.toString().includes('läuft') && resolve(p)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stop = (p) =>
  new Promise((r) => {
    p.on('exit', r);
    p.kill('SIGTERM');
  });

function client() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const inbox = [];
  const waiters = [];
  let rid = 0;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
    else inbox.push(m);
  };
  const next = (pred, ms = 2000) =>
    new Promise((resolve, reject) => {
      const i = inbox.findIndex(pred);
      if (i >= 0) return resolve(inbox.splice(i, 1)[0]);
      const w = { pred, resolve };
      waiters.push(w);
      setTimeout(() => reject(new Error('timeout waiting for message')), ms);
    });
  const req = (msg) => {
    const id = ++rid;
    ws.send(JSON.stringify({ ...msg, rid: id }));
    return next((m) => m.t === 'res' && m.rid === id);
  };
  const open = new Promise((r) => (ws.onopen = r));
  return { ws, open, next, req, send: (m) => ws.send(JSON.stringify(m)) };
}

let server = await startServer();
try {
  // Falsches Passwort
  let a = client();
  await a.open;
  a.send({ t: 'hello', password: 'falsch', token: 'token-aaaaaaaaaaaaaaaa' });
  let m = await a.next((x) => x.t === 'denied');
  assert.match(m.reason, /Passwort/);

  // Richtiges Passwort, Besitzer
  a = client();
  await a.open;
  a.send({ t: 'hello', password: 'geheim', token: 'token-aaaaaaaaaaaaaaaa', ownerToken: 'chef' });
  const wa = await a.next((x) => x.t === 'welcome');
  assert.equal(wa.owner, true);
  assert.equal(wa.peers.length, 1);

  // Zweiter Spieler sieht den ersten, erster sieht den zweiten kommen
  const b = client();
  await b.open;
  b.send({ t: 'hello', password: 'geheim', token: 'token-bbbbbbbbbbbbbbbb' });
  const wb = await b.next((x) => x.t === 'welcome');
  assert.equal(wb.owner, false);
  assert.notEqual(wb.userId, wa.userId);
  assert.equal(wb.peers.length, 2);
  m = await a.next((x) => x.t === 'peers' && x.peers.length === 2);

  // Anwesenheit
  await b.req({ t: 'presence', p: { x: 10.5, y: 20, nm: 'Bea' } });
  m = await a.next((x) => x.t === 'peers' && x.peers.some((p) => p.presence.nm === 'Bea'));
  assert.equal(m.peers.find((p) => p.peer === wb.peer).presence.x, 10.5);

  // Dritter Spieler: Dorf voll
  const c3 = client();
  await c3.open;
  c3.send({ t: 'hello', password: 'geheim', token: 'token-cccccccccccccccc' });
  m = await c3.next((x) => x.t === 'denied');
  assert.match(m.reason, /voll/);

  // Uhr: kommt mit dem Willkommen und danach jede Sekunde
  assert.equal(typeof wa.clock.day, 'number');
  m = await a.next((x) => x.t === 'clock');
  assert.ok(m.time >= wa.clock.time);

  // Eigener Spielstand: nur für den Spieler selbst (und den Besitzer) sichtbar, kein Rundruf
  m = await b.req({ t: 'set', col: 'players', id: wb.userId, data: { coins: 5 } });
  assert.equal(m.ok, true);
  m = await b.req({ t: 'set', col: 'players', id: wa.userId, data: { coins: 9999 } });
  assert.equal(m.ok, false, 'fremden Spielstand schreiben ist verboten');
  m = await a.req({ t: 'get', col: 'players', id: wb.userId });
  assert.equal(m.data.coins, 5, 'der Besitzer darf lesen');
  m = await b.req({ t: 'get', col: 'players', id: wb.userId });
  assert.equal(m.data.coins, 5);
  m = await b.req({ t: 'get', col: '_server', id: 'clock' });
  assert.equal(m.ok, false);

  // Chat: Gruppe, privat, Bremse, Verlauf, Verfall
  await a.req({ t: 'presence', p: { x: 1, y: 1, nm: 'Anna' } });
  await sleep(200);
  m = await a.req({ t: 'chat', text: '  Hallo <alle>!  ' });
  assert.equal(m.ok, true);
  m = await b.next((x) => x.t === 'chat');
  assert.equal(m.msg.text, 'Hallo <alle>!');
  assert.equal(m.msg.fromName, 'Anna');
  assert.equal(m.msg.to, null);
  await a.next((x) => x.t === 'chat'); // der Absender bekommt sie auch
  m = await a.req({ t: 'chat', text: 'zu schnell' });
  assert.equal(m.ok, false, 'zwei Nachrichten innerhalb einer halben Sekunde');
  await sleep(600);
  m = await b.req({ t: 'chat', to: wa.userId, text: 'psst' });
  assert.equal(m.ok, true);
  m = await a.next((x) => x.t === 'chat' && x.msg.to === wa.userId);
  assert.equal(m.msg.toName, 'Anna');
  assert.equal(m.msg.fromName, 'Bea');
  m = await b.req({ t: 'chat', to: 'niemand', text: 'hallo?' });
  assert.equal(m.ok, false);
  m = await b.req({ t: 'chat', text: '' });
  assert.equal(m.ok, false);
  assert.equal(wb.chat.length, 0, 'beim Anmelden war der Chat leer');

  // Dokumente
  m = await a.req({ t: 'get', col: 'world', id: 'bridge' });
  assert.equal(m.exists, false);
  await a.req({ t: 'set', col: 'world', id: 'bridge', data: { built: true, by: 'A' } });
  m = await b.next((x) => x.t === 'doc' && x.col === 'world' && x.id === 'bridge');
  assert.equal(m.data.by, 'A');
  m = await b.req({ t: 'get', col: 'world', id: 'bridge' });
  assert.equal(m.exists, true);
  m = await a.req({ t: 'set', col: 'bad name', id: 'x', data: {} });
  assert.equal(m.ok, false);

  // Schloss
  m = await a.req({ t: 'acquire', col: 'locks', id: 'h1', holder: 'la', ttlMs: 3000 });
  assert.equal(m.acquired, true);
  m = await b.req({ t: 'acquire', col: 'locks', id: 'h1', holder: 'lb', ttlMs: 3000 });
  assert.equal(m.acquired, false);
  m = await a.req({ t: 'acquire', col: 'locks', id: 'h1', holder: 'la', ttlMs: 3000 });
  assert.equal(m.acquired, true, 'same holder may renew');

  // Löschen
  await a.req({ t: 'delete', col: 'world', id: 'bridge' });
  m = await b.next((x) => x.t === 'doc' && x.id === 'bridge' && x.data === null);
  await a.req({ t: 'set', col: 'admin', id: 'bans', data: { ids: { x: 1 } } });

  // Statische Dateien
  const html = await fetch(`http://127.0.0.1:${PORT}/`);
  assert.equal(html.status, 200);
  assert.equal(html.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.match(await html.text(), /js\/main\.js/);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/js/config.js`)).status, 200);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/server/index.js`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/server/.env.example`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/.gitignore`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/..%2F..%2Fetc%2Fpasswd`)).status, 404);

  // Verlauf beim Anmelden: Dritter sieht die Gruppe, nicht das private Gespräch; danach verfällt alles
  b.ws.close();
  m = await a.next((x) => x.t === 'peers' && x.peers.length === 1);
  const c = client();
  await c.open;
  c.send({ t: 'hello', password: 'geheim', token: 'token-cccccccccccccccc' });
  const wc = await c.next((x) => x.t === 'welcome');
  assert.deepEqual(
    wc.chat.map((x) => x.text),
    ['Hallo <alle>!'],
    'nur der Gruppenchat',
  );
  c.ws.close();
  await sleep(2600);
  const d = client();
  await d.open;
  d.send({ t: 'hello', password: 'geheim', token: 'token-dddddddddddddddd' });
  const wd = await d.next((x) => x.t === 'welcome');
  assert.equal(wd.chat.length, 0, 'nach Ablauf der Zeit ist der Chat leer');
  d.ws.close();
  a.ws.close();
} finally {
  await stop(server);
}

// Neustart: Spielstand ist noch da
server = await startServer();
try {
  const a = client();
  await a.open;
  a.send({ t: 'hello', password: 'geheim', token: 'token-aaaaaaaaaaaaaaaa' });
  const w = await a.next((x) => x.t === 'welcome');
  assert.deepEqual(w.collections.admin.bans, { ids: { x: 1 } });
  assert.equal(w.collections.players, undefined, 'Spielstände stehen nicht im Willkommen');
  assert.equal(w.collections._server, undefined);
  assert.equal(w.collections.world.bridge, undefined);
  a.ws.close();
} finally {
  await stop(server);
}
console.log('Rauchtest bestanden');
