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

// ---------- Versionen für css/ und js/ ----------
// Jede Datei bekommt in index.html ein ?v=<Prüfsumme ihres Inhalts>. Ändert sich die Datei, ändert
// sich die Adresse, und jeder Browser lädt sie neu. Versionierte Dateien dürfen ewig im Cache bleiben,
// index.html selbst nie. Aus allen Prüfsummen entsteht eine Build-Kennung, die der Client beim
// Anmelden mit seiner eigenen vergleicht (siehe net.js): nach einem Deploy lädt ein offener Tab neu.
const assetCache = new Map(); // Pfad -> { mtimeMs, hash }

function assetHash(rel) {
  const file = path.join(CONFIG.webRoot, rel);
  try {
    const st = fs.statSync(file);
    const cached = assetCache.get(rel);
    if (cached && cached.mtimeMs === st.mtimeMs) return cached.hash;
    const hash = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
    assetCache.set(rel, { mtimeMs: st.mtimeMs, hash });
    return hash;
  } catch (e) {
    return null;
  }
}

function versionedIndex() {
  const html = fs.readFileSync(path.join(CONFIG.webRoot, 'index.html'), 'utf8');
  const hashes = [];
  const out = html.replace(/(href|src)="((?:css|js)\/[^"?]+)"/g, (m, attr, rel) => {
    const h = assetHash(rel);
    if (!h) return m;
    hashes.push(rel + '@' + h);
    return `${attr}="${rel}?v=${h}"`;
  });
  const build = crypto.createHash('sha1').update(hashes.join('\n')).digest('hex').slice(0, 10);
  return {
    html: out.replace('</head>', `    <meta name="dorf-build" content="${build}" />\n  </head>`),
    build,
  };
}

const buildId = () => versionedIndex().build;

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(CONFIG.webRoot, rel));
  const inside = file.startsWith(CONFIG.webRoot + path.sep);
  const hidden = rel.split('/').some((part) => part.startsWith('.') || part === 'server');
  if (!inside || hidden) return reply(res, 404, 'Nicht gefunden');
  if (rel === '/index.html') {
    const { html } = versionedIndex();
    res.writeHead(200, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    return res.end(html);
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return reply(res, 404, 'Nicht gefunden');
    const versioned = url.searchParams.get('v') && url.searchParams.get('v') === assetHash(rel.slice(1));
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'no-cache',
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

// ---------- Chat ----------
// Ein Gruppenchat für alle und private Gespräche. Nachrichten verfallen nach 24 Stunden.
const CHAT_TTL = Number(process.env.DORF_CHAT_TTL_MS) || 24 * 60 * 60 * 1000;
const CHAT_MAX = 2000;
const CHAT_TEXT_MAX = 240;
let chat = ((store.get('_chat', 'log') || {}).messages || []).filter((m) => m && typeof m.at === 'number');
let chatSeq = chat.reduce((m, x) => Math.max(m, x.id | 0), 0);

const saveChat = () => store.set('_chat', 'log', { messages: chat });

function pruneChat() {
  const cutoff = Date.now() - CHAT_TTL;
  const before = chat.length;
  chat = chat.filter((m) => m.at >= cutoff);
  if (chat.length > CHAT_MAX) chat = chat.slice(-CHAT_MAX);
  if (chat.length !== before) saveChat();
}
setInterval(pruneChat, 60 * 1000).unref();

// Alles, was dieser Spieler sehen darf: der Gruppenchat und seine eigenen privaten Gespräche.
function chatFor(userId) {
  pruneChat();
  return chat.filter((m) => !m.to || m.from === userId || m.to === userId).slice(-300);
}

const nameOf = (c) =>
  c.presence && typeof c.presence.nm === 'string' && c.presence.nm.trim()
    ? c.presence.nm.trim().slice(0, 14)
    : 'Jemand';

// Name eines Spielers, der gerade nicht online ist, aus früheren Nachrichten
function knownName(userId) {
  for (let i = chat.length - 1; i >= 0; i--) {
    const m = chat[i];
    if (m.from === userId) return m.fromName;
    if (m.to === userId) return m.toName;
  }
  return null;
}

function handleChat(c, msg, res) {
  const text =
    typeof msg.text === 'string'
      ? msg.text
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .trim()
          .slice(0, CHAT_TEXT_MAX)
      : '';
  if (!text) return res({ ok: false, error: 'Leere Nachricht.' });
  const now = Date.now();
  c.chatTimes = (c.chatTimes || []).filter((t) => now - t < 60 * 1000);
  const last = c.chatTimes[c.chatTimes.length - 1];
  if (c.chatTimes.length >= 20 || (last && now - last < 500))
    return res({ ok: false, error: 'Langsamer bitte.' });
  c.chatTimes.push(now);
  let to = null;
  let toName = null;
  if (msg.to) {
    if (typeof msg.to !== 'string' || msg.to === c.userId)
      return res({ ok: false, error: 'Ungültiger Empfänger.' });
    const rc = [...clients.values()].find((x) => x.ready && x.userId === msg.to);
    toName = rc ? nameOf(rc) : knownName(msg.to);
    if (!toName) return res({ ok: false, error: 'Diesen Spieler gibt es hier nicht.' });
    to = msg.to;
  }
  const m = { id: ++chatSeq, from: c.userId, fromName: nameOf(c), to, toName, text, at: now };
  chat.push(m);
  if (chat.length > CHAT_MAX) chat = chat.slice(-CHAT_MAX);
  saveChat();
  const out = JSON.stringify({ t: 'chat', msg: m });
  for (const [w, x] of clients) {
    if (!x.ready || w.readyState !== w.OPEN) continue;
    if (!to || x.userId === to || x.userId === c.userId) w.send(out);
  }
  return res({ ok: true, id: m.id });
}

// ---------- Schenken und Tauschen ----------
// Der Server reicht Geschenke und Tauschangebote nur weiter. Was jemand besitzt, weiß der Browser
// des Spielers; dort wird abgezogen und gutgeschrieben.
// Ein Tausch läuft in drei Schritten: Angebot -> Annehmen -> Bestätigen durch den Anbieter.
const TRADE_TTL = Number(process.env.DORF_TRADE_TTL_MS) || 60 * 1000;
const TRADE_COMMIT_TTL = 10 * 1000;
const trades = new Map(); // id -> { id, from, fromName, to, toName, a, an, b, bn, state, until, fromWs, toWs }
let tradeSeq = 0;

const validThing = (k, n) =>
  typeof k === 'string' && /^[a-z_]{1,24}$/.test(k) && Number.isInteger(n) && n >= 1 && n <= 1e6;
const tradeInfo = (tr) => ({
  id: tr.id,
  from: tr.from,
  fromName: tr.fromName,
  to: tr.to,
  toName: tr.toName,
  a: tr.a,
  an: tr.an,
  b: tr.b,
  bn: tr.bn,
});
const tradeEvent = (ws, ev, tr) => send(ws, { t: 'trade', ev, trade: tradeInfo(tr) });

function socketOf(userId) {
  for (const [ws, c] of clients) if (c.ready && c.userId === userId && ws.readyState === ws.OPEN) return ws;
  return null;
}

// Bremse für Geschenke und Angebote
function tooFast(c) {
  const now = Date.now();
  c.giveTimes = (c.giveTimes || []).filter((t) => now - t < 60 * 1000);
  const last = c.giveTimes[c.giveTimes.length - 1];
  if (c.giveTimes.length >= 40 || (last && now - last < 250)) return true;
  c.giveTimes.push(now);
  return false;
}

function recipientOf(c, msg, res) {
  if (typeof msg.to !== 'string' || msg.to === c.userId) {
    res({ ok: false, error: 'Ungültiger Empfänger.' });
    return null;
  }
  const ws = socketOf(msg.to);
  if (!ws) res({ ok: false, error: 'Dieser Spieler ist nicht mehr online.' });
  return ws;
}

function handleGift(c, msg, res) {
  if (!validThing(msg.k, msg.n)) return res({ ok: false, error: 'Ungültiges Geschenk.' });
  const to = recipientOf(c, msg, res);
  if (!to) return;
  if (tooFast(c)) return res({ ok: false, error: 'Langsamer bitte.' });
  send(to, { t: 'gift', from: c.userId, fromName: nameOf(c), k: msg.k, n: msg.n });
  return res({ ok: true });
}

function handleTrade(ws, c, msg, res) {
  if (msg.op === 'offer') {
    if (!validThing(msg.a, msg.an) || !validThing(msg.b, msg.bn) || msg.a === msg.b)
      return res({ ok: false, error: 'Ungültiges Angebot.' });
    for (const tr of trades.values())
      if (tr.fromWs === ws) return res({ ok: false, error: 'Du hast schon ein Angebot offen.' });
    const to = recipientOf(c, msg, res);
    if (!to) return;
    if (tooFast(c)) return res({ ok: false, error: 'Langsamer bitte.' });
    const tr = {
      id: ++tradeSeq,
      from: c.userId,
      fromName: nameOf(c),
      to: msg.to,
      toName: nameOf(clients.get(to)),
      a: msg.a,
      an: msg.an,
      b: msg.b,
      bn: msg.bn,
      state: 'open',
      until: Date.now() + TRADE_TTL,
      fromWs: ws,
      toWs: to,
    };
    trades.set(tr.id, tr);
    tradeEvent(to, 'offer', tr);
    return res({ ok: true, id: tr.id });
  }
  const tr = trades.get(msg.id);
  if (!tr) return res({ ok: false, error: 'Dieses Angebot gibt es nicht mehr.' });
  switch (msg.op) {
    case 'answer': {
      if (tr.toWs !== ws || tr.state !== 'open') return res({ ok: false });
      if (msg.accept === true) {
        tr.state = 'accepted';
        tr.until = Date.now() + TRADE_COMMIT_TTL;
        tradeEvent(tr.fromWs, 'accepted', tr);
      } else {
        trades.delete(tr.id);
        tradeEvent(tr.fromWs, 'declined', tr);
      }
      return res({ ok: true });
    }
    case 'commit': {
      if (tr.fromWs !== ws || tr.state !== 'accepted') return res({ ok: false });
      trades.delete(tr.id);
      const there = tr.toWs.readyState === tr.toWs.OPEN;
      tradeEvent(tr.toWs, msg.ok === true ? 'done' : 'failed', tr);
      return res({ ok: there && msg.ok === true });
    }
    case 'cancel': {
      if (tr.fromWs !== ws || tr.state !== 'open') return res({ ok: false });
      trades.delete(tr.id);
      tradeEvent(tr.toWs, 'cancelled', tr);
      return res({ ok: true });
    }
    default:
      return res({ ok: false, error: 'unbekannt' });
  }
}

// Angebote, auf die niemand antwortet, verfallen.
setInterval(() => {
  const now = Date.now();
  for (const tr of trades.values()) {
    if (tr.until > now) continue;
    trades.delete(tr.id);
    tradeEvent(tr.fromWs, 'expired', tr);
    tradeEvent(tr.toWs, tr.state === 'accepted' ? 'failed' : 'expired', tr);
  }
}, 500).unref();

// Geht einer der beiden, ist das Angebot weg.
function dropTradesOf(ws) {
  for (const tr of trades.values()) {
    if (tr.fromWs !== ws && tr.toWs !== ws) continue;
    trades.delete(tr.id);
    if (tr.fromWs === ws) tradeEvent(tr.toWs, tr.state === 'accepted' ? 'failed' : 'cancelled', tr);
    else tradeEvent(tr.fromWs, 'cancelled', tr);
  }
}

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
  for (const c of clients.values())
    if (c.ready) list.push({ peer: c.peer, user: c.userId, presence: c.presence });
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
    chat: chatFor(c.userId),
    build: buildId(),
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
    case 'chat':
      return handleChat(c, msg, res);
    case 'gift':
      return handleGift(c, msg, res);
    case 'trade':
      return handleTrade(ws, c, msg, res);
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
    dropTradesOf(ws);
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
