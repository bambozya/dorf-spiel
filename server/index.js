// Spielserver für Younes' Dorf.
// - liefert die Spieldateien (index.html, css/, js/) aus
// - ein WebSocket unter /ws: Passwort, Anwesenheit der Spieler, gemeinsamer Spielstand
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Store } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(__dirname, '.env'));

const CONFIG = {
  port: Number(process.env.PORT) || 8787,
  host: process.env.HOST || '127.0.0.1',
  password: process.env.DORF_PASSWORD || '',
  ownerToken: process.env.DORF_OWNER_TOKEN || '',
  maxPlayers: Number(process.env.DORF_MAX_PLAYERS) || 30,
  dataFile: process.env.DORF_DATA || path.join(__dirname, 'data', 'db.json'),
  webRoot: path.resolve(__dirname, '..'),
};
if (!CONFIG.password) {
  console.error('DORF_PASSWORD fehlt. Bitte in server/.env setzen (siehe .env.example).');
  process.exit(1);
}

const store = new Store(CONFIG.dataFile);
store.checkWritable();

// Sammlungen, die nicht an alle gehen: "players" gehört jedem Spieler selbst, "_…" nur dem Server.
const isPrivate = (col) => col === 'players' || col.startsWith('_');
const publicCollections = () =>
  Object.fromEntries(Object.entries(store.collections).filter(([col]) => !isPrivate(col)));

// ---------- die gemeinsame Uhr ----------
// Ein Tag hat 24 Stunden: von 6 bis 22 Uhr vergehen 4 Minuten, die Nacht dauert 5 Minuten.
// Schlafen alle Spieler, die online sind, springt die Uhr auf den nächsten Morgen.
const clock = Object.assign({ day: 1, t: 0.02 }, store.get('_server', 'clock') || {});
let clockLast = Date.now();
let clockSendT = 0;
let allAsleepT = 0;

function tickClock() {
  const now = Date.now();
  const dt = Math.min(5, (now - clockLast) / 1000);
  clockLast = now;
  const hour = 6 + clock.t * 24;
  clock.t += dt * (hour >= 22 ? 8 / 24 / 300 : 16 / 24 / 240);
  let dayChanged = false;
  if (clock.t >= 1) {
    clock.day += 1;
    clock.t = 0;
    dayChanged = true;
  }
  const online = [...clients.values()].filter((c) => c.ready);
  if (online.length && online.every((c) => c.presence && c.presence.sl === true)) {
    allAsleepT += dt;
    if (allAsleepT > 1.8) {
      allAsleepT = 0;
      clock.day += 1;
      clock.t = 0;
      dayChanged = true;
    }
  } else allAsleepT = 0;
  clockSendT += dt;
  if (dayChanged || clockSendT >= 1) {
    clockSendT = 0;
    broadcast({ t: 'clock', day: clock.day, time: +clock.t.toFixed(4) });
  }
  if (dayChanged) store.set('_server', 'clock', { day: clock.day, t: clock.t });
}
setInterval(tickClock, 250).unref();
setInterval(() => store.set('_server', 'clock', { day: clock.day, t: clock.t }), 30000).unref();

// ---------- statische Dateien ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(CONFIG.webRoot, rel));
  const inside = file.startsWith(CONFIG.webRoot + path.sep);
  const hidden = rel.split('/').some((part) => part.startsWith('.') || part === 'server');
  if (!inside || hidden) return reply(res, 404, 'Nicht gefunden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return reply(res, 404, 'Nicht gefunden');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    fs.createReadStream(file).pipe(res);
  });
}

function reply(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

// ---------- Passwort-Versuche pro IP begrenzen ----------
const attempts = new Map(); // ip -> { count, until }
function tooManyAttempts(ip) {
  const a = attempts.get(ip);
  return !!a && a.count >= 5 && a.until > Date.now();
}
function failedAttempt(ip) {
  const a = attempts.get(ip) || { count: 0, until: 0 };
  a.count += 1;
  a.until = Date.now() + 10 * 60 * 1000;
  attempts.set(ip, a);
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, a] of attempts) if (a.until < now) attempts.delete(ip);
}, 60 * 1000).unref();

// ---------- Spieler ----------
const clients = new Map(); // ws -> { peer, userId, owner, presence, alive }
const PRESENCE_LIMIT = 2000; // Bytes pro Anwesenheits-Nachricht
const DOC_LIMIT = 64 * 1024; // Bytes pro Dokument
let peersDirty = false;

const userIdOf = (token) =>
  crypto
    .createHash('sha256')
    .update('dorf:' + token)
    .digest('base64url')
    .slice(0, 20);

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg, except) {
  const s = JSON.stringify(msg);
  for (const [ws, c] of clients) if (c.ready && ws !== except && ws.readyState === ws.OPEN) ws.send(s);
}

function peerList() {
  const list = [];
  for (const c of clients.values()) if (c.ready) list.push({ peer: c.peer, presence: c.presence });
  return list;
}

// Anwesenheit gesammelt verschicken, höchstens zehnmal pro Sekunde.
setInterval(() => {
  if (!peersDirty) return;
  peersDirty = false;
  broadcast({ t: 'peers', peers: peerList() });
}, 100).unref();

function handleHello(ws, c, msg, ip) {
  if (c.ready) return;
  if (tooManyAttempts(ip)) return deny(ws, 'Zu viele Versuche. Bitte in zehn Minuten noch einmal.');
  if (typeof msg.password !== 'string' || !safeEqual(msg.password, CONFIG.password)) {
    failedAttempt(ip);
    return deny(ws, 'Falsches Passwort.');
  }
  const online = [...clients.values()].filter((x) => x.ready).length;
  if (online >= CONFIG.maxPlayers) return deny(ws, 'Das Dorf ist gerade voll. Bitte später noch einmal.');
  const token = typeof msg.token === 'string' && msg.token.length >= 16 ? msg.token.slice(0, 64) : null;
  if (!token) return deny(ws, 'Ungültige Anmeldung.');
  c.userId = userIdOf(token);
  c.owner =
    !!CONFIG.ownerToken && typeof msg.ownerToken === 'string' && safeEqual(msg.ownerToken, CONFIG.ownerToken);
  c.ready = true;
  send(ws, {
    t: 'welcome',
    peer: c.peer,
    userId: c.userId,
    owner: c.owner,
    peers: peerList(),
    collections: publicCollections(),
    clock: { day: clock.day, time: +clock.t.toFixed(4) },
  });
  peersDirty = true;
  console.log(`+ ${c.userId} (${online + 1} online)`);
}

function deny(ws, reason) {
  send(ws, { t: 'denied', reason });
  setTimeout(() => ws.close(4001, 'denied'), 50);
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)),
    y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const validName = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(s);

// Darf dieser Spieler das Dokument lesen oder schreiben?
function mayAccess(c, col, id) {
  if (!validName(col) || !validName(id)) return false;
  if (col.startsWith('_')) return false;
  if (col === 'players') return id === c.userId || c.owner;
  return true;
}

function handleMessage(ws, c, raw, ip) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    return;
  }
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'hello') return handleHello(ws, c, msg, ip);
  if (!c.ready) return;
  const rid = typeof msg.rid === 'number' ? msg.rid : null;
  const res = (body) => rid !== null && send(ws, { t: 'res', rid, ...body });
  switch (msg.t) {
    case 'presence': {
      if (!msg.p || typeof msg.p !== 'object') return;
      const s = JSON.stringify(msg.p);
      if (s.length > PRESENCE_LIMIT) return;
      c.presence = msg.p;
      peersDirty = true;
      return res({ ok: true });
    }
    case 'get': {
      if (!mayAccess(c, msg.col, msg.id)) return res({ ok: false });
      const data = store.get(msg.col, msg.id);
      return res({ ok: true, exists: data !== undefined, data: data === undefined ? null : data });
    }
    case 'set': {
      if (!mayAccess(c, msg.col, msg.id) || !msg.data || typeof msg.data !== 'object')
        return res({ ok: false });
      if (JSON.stringify(msg.data).length > DOC_LIMIT) return res({ ok: false, error: 'zu groß' });
      store.set(msg.col, msg.id, msg.data);
      if (!isPrivate(msg.col)) broadcast({ t: 'doc', col: msg.col, id: msg.id, data: msg.data });
      return res({ ok: true });
    }
    case 'delete': {
      if (!mayAccess(c, msg.col, msg.id)) return res({ ok: false });
      store.delete(msg.col, msg.id);
      if (!isPrivate(msg.col)) broadcast({ t: 'doc', col: msg.col, id: msg.id, data: null });
      return res({ ok: true });
    }
    case 'acquire': {
      if (!mayAccess(c, msg.col, msg.id) || typeof msg.holder !== 'string') return res({ ok: false });
      const acquired = store.acquire(msg.col, msg.id, c.peer + ':' + msg.holder.slice(0, 40), msg.ttlMs);
      return res({ ok: true, acquired });
    }
    case 'ping':
      return res({ ok: true });
    default:
      return res({ ok: false, error: 'unbekannt' });
  }
}

// ---------- Server ----------
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, 'Nicht erlaubt');
  if (req.url === '/healthz') return reply(res, 200, 'ok');
  serveStatic(req, res);
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });

wss.on('connection', (ws, req) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
  const c = {
    peer: 'p' + crypto.randomBytes(6).toString('base64url'),
    userId: null,
    owner: false,
    presence: {},
    ready: false,
    alive: true,
  };
  clients.set(ws, c);
  ws.on('pong', () => (c.alive = true));
  ws.on('message', (raw) => handleMessage(ws, c, raw.toString(), ip));
  ws.on('close', () => {
    clients.delete(ws);
    if (c.ready) {
      peersDirty = true;
      console.log(`- ${c.userId} (${[...clients.values()].filter((x) => x.ready).length} online)`);
    }
  });
  ws.on('error', () => {});
  // Wer sich nicht binnen zehn Sekunden anmeldet, fliegt raus.
  setTimeout(() => {
    if (!c.ready) ws.close(4002, 'timeout');
  }, 10000).unref();
});

// Tote Verbindungen erkennen
setInterval(() => {
  for (const [ws, c] of clients) {
    if (!c.alive) return ws.terminate();
    c.alive = false;
    ws.ping();
  }
}, 30000).unref();

function loadDotEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) {}
}

function shutdown() {
  console.log('Server wird beendet, Spielstand wird gesichert …');
  store.saveNow();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(CONFIG.port, CONFIG.host, () => {
  console.log(
    `Dorf-Server läuft auf http://${CONFIG.host}:${CONFIG.port} (Spieldateien aus ${CONFIG.webRoot})`,
  );
});
