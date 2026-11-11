// ================= Verbindung zum Spielserver =================
// Stellt window.claude.use('room' | 'db' | 'user') bereit, so wie es die Online-Dateien erwarten,
// nur dass dahinter unser eigener Server (server/index.js) über einen WebSocket steckt.
// Läuft das Spiel in der Claude-Umgebung, gibt es window.claude schon und diese Datei tut nichts.
(() => {
  if (window.claude && typeof window.claude.use === 'function') {
    document.addEventListener('DOMContentLoaded', () => document.getElementById('login').remove());
    return;
  }

  const TOKEN_KEY = 'younes-dorf-token';
  const PASSWORD_KEY = 'younes-dorf-password';
  const OWNER_KEY = 'younes-dorf-owner';
  const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';

  const storage = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch (e) {}
    },
  };

  // Jedes Gerät bekommt einmal einen zufälligen Token; daraus macht der Server die Spieler-Kennung.
  function deviceToken() {
    let t = storage.get(TOKEN_KEY);
    if (!t || t.length < 16) {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      t = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      storage.set(TOKEN_KEY, t);
    }
    return t;
  }

  // Besitzer-Token aus der Adresse übernehmen (?owner=…) und danach aus der Adresse entfernen.
  (() => {
    const url = new URL(location.href);
    const o = url.searchParams.get('owner');
    if (o) {
      storage.set(OWNER_KEY, o);
      url.searchParams.delete('owner');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  })();

  // ---------- Verbindung ----------
  let ws = null;
  let connected = false; // angemeldet und bereit
  let me = { peer: null, userId: null, owner: false };
  let peers = []; // [{peer, presence}]
  let collections = {};
  let nextRid = 1;
  const pending = new Map(); // rid -> {resolve, reject}
  const peerListeners = new Set();
  const docListeners = new Set(); // {col, id|null, cb}
  const readyWaiters = []; // resolve-Funktionen, die auf die erste Anmeldung warten
  let backoff = 1000;
  let startGame = null; // wird von main.js über hot.ready() gesetzt
  let started = false;
  let lastSaved = '';
  let saveTimer = null;

  let chatHistory = [];
  const chatListeners = new Set();

  // Für das Spiel: Uhr des Servers, Speichern des eigenen Spielstands, Chat, Mitspieler.
  const dorfServer = {
    clock: null, // { day, time } vom Server, null solange nicht verbunden
    userId: null,
    // Mitspieler, die gerade online sind (ohne mich): [{ user, name }]
    players: () =>
      peers
        .filter((p) => p.user && p.user !== me.userId)
        .map((p) => ({ user: p.user, name: (p.presence && p.presence.nm) || 'Jemand' })),
    chat: {
      history: () => chatHistory,
      send: (to, text) => request({ t: 'chat', to: to || null, text }),
      onMessage: (cb) => {
        chatListeners.add(cb);
        return () => chatListeners.delete(cb);
      },
    },
    savePlayer(st) {
      if (!connected || !st) return;
      const s = JSON.stringify(st);
      if (s === lastSaved) return;
      lastSaved = s;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        request({ t: 'set', col: 'players', id: me.userId, data: JSON.parse(s) }).catch(
          () => (lastSaved = ''),
        );
      }, 300);
    },
  };
  window.dorfServer = dorfServer;

  // Beim ersten Anmelden den eigenen Spielstand vom Server holen und dann das Spiel starten.
  async function startAfterLogin() {
    if (started || !startGame) return;
    started = true;
    let saved = null;
    try {
      const r = await request({ t: 'get', col: 'players', id: me.userId });
      if (r.ok && r.exists) saved = r.data;
    } catch (e) {}
    if (saved) lastSaved = JSON.stringify(saved);
    startGame({ state: saved });
  }

  function request(msg) {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return reject(new Error('nicht verbunden'));
      const rid = nextRid++;
      pending.set(rid, { resolve, reject });
      ws.send(JSON.stringify({ ...msg, rid }));
      setTimeout(() => {
        if (pending.delete(rid)) reject(new Error('keine Antwort'));
      }, 8000);
    });
  }

  function connect(password) {
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    login.status('Verbinde …');
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          t: 'hello',
          password,
          token: deviceToken(),
          ownerToken: storage.get(OWNER_KEY) || undefined,
        }),
      );
    };
    ws.onmessage = (e) => handle(JSON.parse(e.data), password);
    ws.onclose = () => {
      const was = connected;
      connected = false;
      for (const p of pending.values()) p.reject(new Error('Verbindung weg'));
      pending.clear();
      peers = [];
      notifyPeers();
      if (was) {
        login.status('Verbindung verloren, versuche es erneut …');
        login.show();
        setTimeout(() => connect(password), backoff);
        backoff = Math.min(backoff * 2, 15000);
      } else if (!login.denied) {
        login.status('Der Server ist gerade nicht erreichbar.');
        login.enable();
      }
    };
    ws.onerror = () => {};
  }

  function handle(msg, password) {
    switch (msg.t) {
      case 'welcome': {
        connected = true;
        backoff = 1000;
        me = { peer: msg.peer, userId: msg.userId, owner: msg.owner };
        dorfServer.userId = me.userId;
        chatHistory = Array.isArray(msg.chat) ? msg.chat : [];
        for (const cb of chatListeners) cb(null); // Verlauf neu laden
        peers = msg.peers;
        collections = msg.collections || {};
        if (msg.clock) dorfServer.clock = msg.clock;
        storage.set(PASSWORD_KEY, password);
        login.hide();
        notifyPeers();
        for (const l of docListeners) emitDoc(l);
        while (readyWaiters.length) readyWaiters.shift()();
        startAfterLogin();
        return;
      }
      case 'clock':
        dorfServer.clock = { day: msg.day, time: msg.time };
        return;
      case 'chat':
        chatHistory.push(msg.msg);
        if (chatHistory.length > 600) chatHistory = chatHistory.slice(-600);
        for (const cb of chatListeners) {
          try {
            cb(msg.msg);
          } catch (e) {}
        }
        return;
      case 'denied':
        login.denied = true;
        storage.set(PASSWORD_KEY, null);
        login.status(msg.reason || 'Abgelehnt.');
        login.show();
        login.enable();
        return;
      case 'peers':
        peers = msg.peers;
        notifyPeers();
        return;
      case 'doc': {
        const col = (collections[msg.col] ||= {});
        if (msg.data === null) delete col[msg.id];
        else col[msg.id] = msg.data;
        for (const l of docListeners) if (l.col === msg.col && (l.id === null || l.id === msg.id)) emitDoc(l);
        return;
      }
      case 'res': {
        const p = pending.get(msg.rid);
        if (!p) return;
        pending.delete(msg.rid);
        p.resolve(msg);
        return;
      }
    }
  }

  function notifyPeers() {
    for (const cb of peerListeners) {
      try {
        cb();
      } catch (e) {}
    }
  }

  const snapshotOf = (id, data) => ({ id, exists: data !== undefined, data: () => data });

  function emitDoc(l) {
    try {
      if (l.id === null) {
        const col = collections[l.col] || {};
        l.cb({ docs: Object.keys(col).map((id) => snapshotOf(id, col[id])) });
      } else l.cb(snapshotOf(l.id, (collections[l.col] || {})[l.id]));
    } catch (e) {}
  }

  const whenReady = () => (connected ? Promise.resolve() : new Promise((r) => readyWaiters.push(r)));

  // ---------- die Objekte, die das Spiel benutzt ----------
  const room = {
    peers: () =>
      peers.map((p) => ({
        peer: p.peer,
        user: p.user,
        kind: 'viewer',
        sameTab: p.peer === me.peer,
        presence: p.presence || {},
      })),
    presence: (p) => (connected ? request({ t: 'presence', p }) : Promise.resolve()),
    onPeers: (cb) => {
      peerListeners.add(cb);
      return () => peerListeners.delete(cb);
    },
  };

  function docRef(col, id) {
    return {
      id,
      get: () => request({ t: 'get', col, id }).then((r) => snapshotOf(id, r.exists ? r.data : undefined)),
      set: (data) =>
        request({ t: 'set', col, id, data }).then((r) => {
          if (!r.ok) throw new Error(r.error || 'Speichern fehlgeschlagen');
        }),
      delete: () => request({ t: 'delete', col, id }),
      acquire: ({ holder, ttlMs }) =>
        request({ t: 'acquire', col, id, holder, ttlMs }).then((r) => ({ acquired: !!r.acquired })),
      onSnapshot: (cb) => {
        const l = { col, id, cb };
        docListeners.add(l);
        if (connected) emitDoc(l);
        return () => docListeners.delete(l);
      },
    };
  }

  const db = {
    collection: (col) => ({
      doc: (id) => docRef(col, id),
      onSnapshot: (cb) => {
        const l = { col, id: null, cb };
        docListeners.add(l);
        if (connected) emitDoc(l);
        return () => docListeners.delete(l);
      },
    }),
    doc: (path) => {
      const [col, id] = path.split('/');
      return docRef(col, id);
    },
  };

  const user = {
    id: () => whenReady().then(() => me.userId),
    isOwner: () => whenReady().then(() => me.owner),
  };

  window.claude = {
    use: async (what) => {
      await whenReady();
      return { room, db, user }[what] || null;
    },
    // main.js wartet mit dem Start, bis wir angemeldet sind und der Spielstand da ist.
    hot: {
      ready: (fn) => {
        startGame = fn;
        if (connected) startAfterLogin();
      },
      snapshot: () => {},
    },
  };

  // ---------- Passwort-Fenster ----------
  const login = {
    denied: false,
    el: null,
    show() {
      this.el.hidden = false;
    },
    hide() {
      this.el.hidden = true;
    },
    status(text) {
      document.getElementById('loginmsg').textContent = text;
    },
    enable() {
      document.getElementById('loginbtn').disabled = false;
      document.getElementById('loginpw').focus();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    login.el = document.getElementById('login');
    const form = document.getElementById('loginform');
    const input = document.getElementById('loginpw');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = input.value.trim();
      if (!pw) return;
      login.denied = false;
      document.getElementById('loginbtn').disabled = true;
      connect(pw);
    });
    const saved = storage.get(PASSWORD_KEY);
    if (saved) {
      input.value = saved;
      document.getElementById('loginbtn').disabled = true;
      connect(saved);
    } else input.focus();
  });
})();
