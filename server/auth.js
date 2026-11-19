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

const q = {
  userByEmail: db.prepare('SELECT id, email, pass FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id, email, pass FROM users WHERE id = ?'),
  userCount: db.prepare('SELECT COUNT(*) AS n FROM users'),
  addUser: db.prepare('INSERT INTO users (email, pass, created_at) VALUES (?, ?, ?)'),
  setPass: db.prepare('UPDATE users SET pass = ? WHERE id = ?'),
  addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, csrf, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'),
  getSession: db.prepare('SELECT s.user_id, s.csrf, s.expires_at, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  delUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  purge: db.prepare('DELETE FROM sessions WHERE expires_at < ?')
};

function createUser(email, password) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('A valid email is required');
  if (String(password || '').length < 10) throw new Error('Password must be at least 10 characters');
  q.addUser.run(email, hashPassword(password), Date.now());
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
  createUser(cfg.adminEmail, cfg.adminPassword); return true;
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
  q.addSession.run(sha(token, 64), u.id, csrf, now + cfg.sessionDays * 86400000, now);
  return { status: 200, token, csrf, email: u.email };
}
function session(req) {
  const t = parseCookies(req.headers.cookie)[SID]; if (!t || t.length > 200) return null;
  const s = q.getSession.get(sha(t, 64)); if (!s) return null;
  if (s.expires_at < Date.now()) { q.delSession.run(sha(t, 64)); return null; }
  return { userId: s.user_id, csrf: s.csrf, email: s.email, token: t };
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

module.exports = { createUser, setPasswordFor, ensureAdmin, login, session, logout, changePassword, sessionCookies, clearCookies, sameOrigin, clientIp, hashIp, lockedFor, getSecret, MARK };
