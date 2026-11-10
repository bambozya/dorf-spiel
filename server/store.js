// Gemeinsamer Spielstand: Sammlungen von Dokumenten, wie eine kleine Firestore.
// Alles liegt im Speicher und wird kurz nach jeder Änderung als JSON-Datei gesichert.
import fs from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(file) {
    this.file = file;
    this.collections = {};
    this.locks = new Map(); // "col/id" -> { holder, until }
    this.saveTimer = null;
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.collections === 'object') this.collections = parsed.collections;
    } catch (e) {
      if (e.code !== 'ENOENT') console.error('Spielstand konnte nicht gelesen werden:', e.message);
    }
  }

  scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveNow();
    }, 1000);
  }

  saveNow() {
    const tmp = this.file + '.tmp';
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify({ collections: this.collections }));
    fs.renameSync(tmp, this.file);
  }

  get(col, id) {
    const c = this.collections[col];
    return c && Object.prototype.hasOwnProperty.call(c, id) ? c[id] : undefined;
  }

  set(col, id, data) {
    (this.collections[col] ||= {})[id] = data;
    this.scheduleSave();
  }

  delete(col, id) {
    const c = this.collections[col];
    if (!c) return;
    delete c[id];
    this.scheduleSave();
  }

  all(col) {
    return this.collections[col] || {};
  }

  // Kurzes Schloss, damit zwei Spieler ein Dokument nicht gleichzeitig ändern.
  acquire(col, id, holder, ttlMs) {
    const key = col + '/' + id;
    const now = Date.now();
    const cur = this.locks.get(key);
    if (cur && cur.until > now && cur.holder !== holder) return false;
    this.locks.set(key, { holder, until: now + Math.min(Math.max(ttlMs | 0, 100), 10000) });
    return true;
  }
}
