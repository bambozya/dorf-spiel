// ================= Chat =================
// Ein Gruppenchat für alle und private Gespräche zwischen zwei Spielern.
// Nachrichten laufen über den Spielserver (net.js) und verfallen dort nach 24 Stunden.
const CHAT_TTL_MS = 24 * 60 * 60 * 1000;
let chatOpen = false;
let chatThread = null; // null = Gruppenchat, sonst die Kennung des Gesprächspartners
const chatUnread = new Map(); // Gespräch -> ungelesene Nachrichten
const chatNames = new Map(); // Kennung -> Name, aus Nachrichten und Anwesenheit

const chatAvailable = () => !!(window.dorfServer && window.dorfServer.chat);
const chatKey = (thread) => thread || 'all';

// Gesprächspartner einer Nachricht aus meiner Sicht
function chatThreadOf(m) {
  if (!m.to) return null;
  return m.from === window.dorfServer.userId ? m.to : m.from;
}

function chatMessages(thread) {
  const cutoff = Date.now() - CHAT_TTL_MS;
  return window.dorfServer.chat.history().filter((m) => m.at >= cutoff && chatThreadOf(m) === thread);
}

function rememberNames(m) {
  if (m.from) chatNames.set(m.from, m.fromName || 'Jemand');
  if (m.to) chatNames.set(m.to, m.toName || 'Jemand');
}

function chatTime(at) {
  const d = new Date(at);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function renderChatTabs() {
  const tabs = $('chattabs');
  const me = window.dorfServer.userId;
  // Gespräche: alle, mit denen ich schon geschrieben habe, plus alle, die gerade online sind
  const threads = new Map();
  for (const m of window.dorfServer.chat.history()) {
    rememberNames(m);
    const t = chatThreadOf(m);
    if (t && t !== me) threads.set(t, chatNames.get(t));
  }
  for (const p of window.dorfServer.players()) {
    chatNames.set(p.user, p.name);
    threads.set(p.user, p.name);
  }
  const online = new Set(window.dorfServer.players().map((p) => p.user));
  const tab = (thread, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = chatThread === thread ? 'on' : '';
    b.textContent = label;
    if (thread && !online.has(thread)) b.classList.add('off');
    const n = chatUnread.get(chatKey(thread)) || 0;
    if (n) {
      const s = document.createElement('span');
      s.className = 'unread';
      s.textContent = n;
      b.appendChild(s);
    }
    b.addEventListener('click', () => openChat(thread));
    return b;
  };
  tabs.replaceChildren(tab(null, 'Alle'), ...[...threads].map(([id, name]) => tab(id, name)));
}

function renderChatLog() {
  const log = $('chatlog');
  const me = window.dorfServer.userId;
  const msgs = chatMessages(chatThread).slice(-200);
  log.replaceChildren(
    ...msgs.map((m) => {
      const row = document.createElement('div');
      row.className = 'cmsg' + (m.from === me ? ' me' : '');
      const who = document.createElement('b');
      who.textContent = m.from === me ? 'Du' : m.fromName || 'Jemand';
      const when = document.createElement('small');
      when.textContent = chatTime(m.at);
      const text = document.createElement('span');
      text.textContent = m.text;
      row.append(who, when, text);
      return row;
    }),
  );
  if (!msgs.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = chatThread
      ? `Noch keine Nachrichten mit ${chatNames.get(chatThread) || 'diesem Spieler'}. Nur ihr zwei lest dieses Gespräch.`
      : 'Noch nichts geschrieben. Alle im Dorf lesen mit. Nachrichten verschwinden nach 24 Stunden.';
    log.appendChild(empty);
  }
  log.scrollTop = log.scrollHeight;
}

function updateChatBadge() {
  let n = 0;
  for (const v of chatUnread.values()) n += v;
  const badge = $('chatbadge');
  badge.hidden = !n;
  badge.textContent = n;
}

function openChat(thread) {
  chatThread = thread;
  chatOpen = true;
  $('chat').hidden = false;
  chatUnread.delete(chatKey(thread));
  updateChatBadge();
  renderChatTabs();
  renderChatLog();
  $('chatinput').focus();
}

function closeChat() {
  chatOpen = false;
  $('chat').hidden = true;
  $('chatinput').blur();
}

function toggleChat() {
  if (!chatAvailable()) return;
  if (chatOpen) closeChat();
  else openChat(chatThread);
}

async function sendChat() {
  const input = $('chatinput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    const r = await window.dorfServer.chat.send(chatThread, text);
    if (!r.ok) toast(esc(r.error || 'Senden hat nicht geklappt.'), 2500);
  } catch (e) {
    toast('Keine Verbindung zum Server.', 2500);
  }
  input.focus();
}

// Neue Nachricht vom Server; null heißt: der Verlauf wurde neu geladen (Anmeldung)
function onChatMessage(m) {
  if (m) {
    rememberNames(m);
    const thread = chatThreadOf(m);
    const mine = m.from === window.dorfServer.userId;
    if (!mine && !(chatOpen && chatThread === thread)) {
      const key = chatKey(thread);
      chatUnread.set(key, (chatUnread.get(key) || 0) + 1);
      const preview = m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text;
      toast(`💬 <b>${esc(m.fromName || 'Jemand')}</b>${thread ? ' (privat)' : ''}: ${esc(preview)}`, 4000);
    }
  }
  updateChatBadge();
  if (chatOpen) {
    renderChatTabs();
    renderChatLog();
  }
}

(() => {
  if (!chatAvailable()) return; // in der Claude-Umgebung gibt es keinen Chat
  $('bChat').hidden = false;
  $('bChat').addEventListener('click', () => toggleChat());
  $('chatform').addEventListener('submit', (e) => {
    e.preventDefault();
    sendChat();
  });
  $('chatinput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeChat();
    }
  });
  window.dorfServer.chat.onMessage(onChatMessage);
  // Wer kommt und geht, ändert die Liste der Gespräche
  window.claude.use('room').then((r) => r && r.onPeers(() => chatOpen && renderChatTabs()));
})();
