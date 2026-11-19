'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

fs.mkdirSync(path.join(cfg.dataDir, 'uploads'), { recursive: true });
fs.mkdirSync(path.join(cfg.dataDir, 'cv'), { recursive: true, mode: 0o700 });
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
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new', job_id TEXT, job_title TEXT,
  name TEXT NOT NULL, phone TEXT, email TEXT, message TEXT, cv_id TEXT, cv_name TEXT, cv_mime TEXT, cv_bytes INTEGER, lang TEXT, ip_hash TEXT, note TEXT);
CREATE INDEX IF NOT EXISTS applications_created ON applications (created_at DESC);
/* CRM catalog link: events already handled (replay protection), the activity log, edits sent to the CRM, and small status values */
CREATE TABLE IF NOT EXISTS catalog_events (event_id TEXT PRIMARY KEY, entity TEXT NOT NULL, entity_id TEXT NOT NULL, version INTEGER NOT NULL, received_at INTEGER NOT NULL, result TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS catalog_events_at ON catalog_events (received_at);
CREATE TABLE IF NOT EXISTS catalog_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, ok INTEGER NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS catalog_edits (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, user_email TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, request_id TEXT NOT NULL UNIQUE, fields TEXT, result TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS catalog_state (k TEXT PRIMARY KEY, v TEXT NOT NULL);
`);
/* older databases: add the columns that arrived later (existing accounts become admins) */
function ensureColumn(table, col, ddl) {
  if (!db.prepare('PRAGMA table_info(' + table + ')').all().some((c) => c.name === col)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + ddl);
}
ensureColumn('users', 'role', "role TEXT NOT NULL DEFAULT 'admin'");
ensureColumn('users', 'name', "name TEXT NOT NULL DEFAULT ''");
ensureColumn('users', 'last_login', 'last_login INTEGER');

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
/* several writes that succeed or fail together, with one cache invalidation at the end */
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn({ put: (col, id, data) => q.putDoc.run(col, id, JSON.stringify(data), Date.now()), get: getDoc, del: (col, id) => q.delDoc.run(col, id) }); db.exec('COMMIT'); bump(); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch (_) { /* already rolled back */ } throw e; }
}
function delDoc(col, id) { q.delDoc.run(col, id); bump(); }
function allDocs() { return q.allDocs.all().map((r) => ({ col: r.col, id: r.id, data: JSON.parse(r.data), updatedAt: r.updated_at })); }

module.exports = { db, getDoc, listDocs, putDoc, delDoc, allDocs, transaction, onChange, get version() { return version; }, bump };
