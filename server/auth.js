'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const { db } = require('./db');
const { parseCookies, sha } = require('./util');

const SID = 'iconic_sid', MARK = 'iconic_admin';

/* a private random value kept next to the database; used to hash visitor IPs so they are never stored raw */
let secret = null;
function getSecret() {
  if (secret) return secret;
  const f = path.join(cfg.dataDir, '.secret');
  try { secret = fs.readFileSync(f, 'utf8').trim(); } catch (_) { /* first run */ }
  if (!secret || secret.length < 32) { secret = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(f, secret, { mode: 0o600 }); }
  return secret;
}
const hashIp = (ip) => crypto.createHmac('sha256', getSecret()).update(String(ip)).digest('hex').slice(0, 20);

function clientIp(req) {
  if (cfg.trustProxy) { const x = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); if (x) return x; }
  return req.socket.remoteAddress || '0.0.0.0';
}

/* ---- passwords: scrypt with a random salt ---- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt.toString('hex') + '$' + key.toString('hex');
}
function checkPassword(pw, stored) {
  const [kind, saltHex, keyHex] = String(stored).split('$');
  if (kind !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  const want = Buffer.from(keyHex, 'hex');
  return key.length === want.length && crypto.timingSafeEqual(key, want);
}
const DUMMY = hashPassword('not-a-real-password');   // so an unknown email costs the same time as a wrong password

/* admin: everything. editor: site content and enquiries. hr: jobs and job applications. */
const ROLES = ['admin', 'editor', 'hr'];

const q = {
  userByEmail: db.prepare('SELECT id, email, pass, role, name FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id, email, pass, role, name, created_at, last_login FROM users WHERE id = ?'),
  userCount: db.prepare('SELECT COUNT(*) AS n FROM users'),
  adminCount: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
  allUsers: db.prepare('SELECT id, email, name, role, created_at, last_login FROM users ORDER BY created_at ASC, id ASC'),
  addUser: db.prepare('INSERT INTO users (email, pass, role, name, created_at) VALUES (?, ?, ?, ?, ?)'),
  setRole: db.prepare('UPDATE users SET role = ? WHERE id = ?'),
  setName: db.prepare('UPDATE users SET name = ? WHERE id = ?'),
  delUser: db.prepare('DELETE FROM users WHERE id = ?'),
  touch: db.prepare('UPDATE users SET last_login = ? WHERE id = ?'),
  setPass: db.prepare('UPDATE users SET pass = ? WHERE id = ?'),
  addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, csrf, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'),
  getSession: db.prepare('SELECT s.user_id, s.csrf, s.expires_at, u.email, u.role, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  delUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  purge: db.prepare('DELETE FROM sessions WHERE expires_at < ?')
};

const bad = (m, status) => { const e = new Error(m); e.status = status || 400; return e; };
function createUser(email, password, role, name) {
  email = String(email || '').trim().toLowerCase(); role = role || 'admin';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) throw bad('A valid email is required');
  if (String(password || '').length < 10) throw bad('Password must be at least 10 characters');
  if (String(password).length > 200) throw bad('Password is too long');
  if (!ROLES.includes(role)) throw bad('Unknown role');
  try { const r = q.addUser.run(email, hashPassword(password), role, String(name || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80), Date.now()); return Number(r.lastInsertRowid); }
  catch (e) { if (/UNIQUE/i.test(String(e && e.message))) throw bad('This email already has an account', 409); throw e; }
}
const userOut = (u) => ({ id: u.id, email: u.email, name: u.name || '', role: u.role, created: u.created_at, lastLogin: u.last_login || null });
const listUsers = () => q.allUsers.all().map(userOut);
/* guards: nobody can lock the dashboard by removing or demoting the last admin, and nobody changes their own role or deletes themselves */
function updateUser(id, patch, actingId) {
  const u = q.userById.get(id); if (!u) throw bad('not found', 404);
  if (patch.role !== undefined && patch.role !== u.role) {
    if (!ROLES.includes(patch.role)) throw bad('Unknown role');
    if (id === actingId) throw bad('You cannot change your own role');
    if (u.role === 'admin' && q.adminCount.get().n <= 1) throw bad('At least one admin is required');
    q.setRole.run(patch.role, id);
  }
  if (patch.name !== undefined) q.setName.run(String(patch.name || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80), id);
  if (patch.password !== undefined) {
    const pw = String(patch.password || '');
    if (pw.length < 10) throw bad('Password must be at least 10 characters'); if (pw.length > 200) throw bad('Password is too long');
    q.setPass.run(hashPassword(pw), id); q.delUserSessions.run(id);    // a new password signs that person out everywhere
  }
  return userOut(q.userById.get(id));
}
function removeUser(id, actingId) {
  const u = q.userById.get(id); if (!u) throw bad('not found', 404);
  if (id === actingId) throw bad('You cannot delete your own account');
  if (u.role === 'admin' && q.adminCount.get().n <= 1) throw bad('At least one admin is required');
  q.delUserSessions.run(id); q.delUser.run(id);
}
function setPasswordFor(email, password) {
  const u = q.userByEmail.get(String(email).trim().toLowerCase()); if (!u) throw new Error('No such user');
  if (String(password || '').length < 10) throw new Error('Password must be at least 10 characters');
  q.setPass.run(hashPassword(password), u.id); q.delUserSessions.run(u.id);
}
/* first run: create the owner account from the environment, once */
function ensureAdmin() {
  if (q.userCount.get().n > 0) return false;
  if (!cfg.adminEmail || !cfg.adminPassword) return null;
  createUser(cfg.adminEmail, cfg.adminPassword, 'admin', ''); return true;
}

/* ---- login throttling: per address and per email, in memory ---- */
const fails = new Map();
function throttleKey(ip, email) { return ip + '|' + String(email).toLowerCase(); }
function locked(k) { const f = fails.get(k); return !!(f && f.n >= 6 && f.until > Date.now()); }
function noteFail(k) { const f = fails.get(k) || { n: 0, until: 0 }; f.n++; f.until = Date.now() + 15 * 60 * 1000; fails.set(k, f); if (fails.size > 5000) fails.clear(); }
function lockedFor(ip, email) { return locked(throttleKey(ip, email)) || locked('ip|' + ip); }

function login(ip, email, password) {
  email = String(email || '').trim().toLowerCase(); password = String(password || '');
  const k = throttleKey(ip, email), kip = 'ip|' + ip;
  if (locked(k) || locked(kip)) return { status: 429 };
  const u = q.userByEmail.get(email);
  const ok = checkPassword(password, u ? u.pass : DUMMY) && !!u;
  if (!ok) { noteFail(k); noteFail(kip); return { status: 401 }; }
  fails.delete(k);
  const token = crypto.randomBytes(32).toString('base64url'), csrf = crypto.randomBytes(24).toString('base64url');
  const now = Date.now(); q.purge.run(now);
  q.addSession.run(sha(token, 64), u.id, csrf, now + cfg.sessionDays * 86400000, now); q.touch.run(now, u.id);
  return { status: 200, token, csrf, email: u.email, role: u.role };
}
function session(req) {
  const t = parseCookies(req.headers.cookie)[SID]; if (!t || t.length > 200) return null;
  const s = q.getSession.get(sha(t, 64)); if (!s) return null;
  if (s.expires_at < Date.now()) { q.delSession.run(sha(t, 64)); return null; }
  return { userId: s.user_id, csrf: s.csrf, email: s.email, role: s.role, name: s.name || '', token: t };
}
function logout(req) { const t = parseCookies(req.headers.cookie)[SID]; if (t) q.delSession.run(sha(t, 64)); }
function changePassword(userId, current, next) {
  const u = q.userById.get(userId); if (!u || !checkPassword(String(current || ''), u.pass)) return false;
  if (String(next || '').length < 10) { const e = new Error('Password must be at least 10 characters'); e.status = 400; throw e; }
  q.setPass.run(hashPassword(next), userId); return true;
}

/* ---- cookies ---- */
const attrs = () => '; Path=/; SameSite=Lax' + (cfg.secure ? '; Secure' : '');
function sessionCookies(token) {
  const age = '; Max-Age=' + cfg.sessionDays * 86400;
  return [SID + '=' + token + attrs() + age + '; HttpOnly', MARK + '=1' + attrs() + age];
}
function clearCookies() { return [SID + '=' + attrs() + '; Max-Age=0; HttpOnly', MARK + '=' + attrs() + '; Max-Age=0']; }

/* state-changing requests must come from this site */
function sameOrigin(req) {
  const o = req.headers.origin; if (!o) return true;
  try { const u = new URL(o); const host = String(req.headers.host || ''); return u.host === host || u.origin === new URL(cfg.siteUrl).origin; } catch (_) { return false; }
}

module.exports = { ROLES, listUsers, updateUser, removeUser, createUser, setPasswordFor, ensureAdmin, login, session, logout, changePassword, sessionCookies, clearCookies, sameOrigin, clientIp, hashIp, lockedFor, getSecret, MARK };
