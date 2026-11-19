'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

fs.mkdirSync(path.join(cfg.dataDir, 'uploads'), { recursive: true });
const db = new DatabaseSync(path.join(cfg.dataDir, 'iconic.db'));
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (col, id));
CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new', interest TEXT,
  name TEXT NOT NULL, phone TEXT, email TEXT, message TEXT, property_id TEXT, agent_id TEXT, lang TEXT, page TEXT, ip_hash TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS leads_created ON leads (created_at DESC);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, pass TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
`);

const q = {
  getDoc: db.prepare('SELECT data, updated_at FROM docs WHERE col = ? AND id = ?'),
  listDocs: db.prepare('SELECT id, data, updated_at FROM docs WHERE col = ?'),
  putDoc: db.prepare('INSERT INTO docs (col, id, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'),
  delDoc: db.prepare('DELETE FROM docs WHERE col = ? AND id = ?'),
  allDocs: db.prepare('SELECT col, id, data, updated_at FROM docs')
};

/* every content change bumps `version`, which invalidates cached pages */
let version = 1; const listeners = new Set();
const bump = () => { version++; listeners.forEach((f) => f()); };
const onChange = (f) => listeners.add(f);

function getDoc(col, id) { const r = q.getDoc.get(col, id); return r ? { id, data: JSON.parse(r.data), updatedAt: r.updated_at } : null; }
function listDocs(col) { return q.listDocs.all(col).map((r) => ({ id: r.id, data: JSON.parse(r.data), updatedAt: r.updated_at })); }
function putDoc(col, id, data) { q.putDoc.run(col, id, JSON.stringify(data), Date.now()); bump(); }
function delDoc(col, id) { q.delDoc.run(col, id); bump(); }
function allDocs() { return q.allDocs.all().map((r) => ({ col: r.col, id: r.id, data: JSON.parse(r.data), updatedAt: r.updated_at })); }

module.exports = { db, getDoc, listDocs, putDoc, delDoc, allDocs, onChange, get version() { return version; }, bump };
