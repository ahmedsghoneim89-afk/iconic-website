'use strict';
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
/* JSON inside a <script>: nothing in it may close the tag or start a comment */
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const sha = (s, n = 24) => crypto.createHash('sha256').update(s).digest('hex').slice(0, n);

function slugBase(s, fallback) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || fallback || 'unit';
}

const parseCookies = (h) => { const o = {}; String(h || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; };

async function readBody(req, limit) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) { const e = new Error('too large'); e.status = 413; throw e; } chunks.push(c); }
  return Buffer.concat(chunks);
}
async function readJson(req, limit = 1024 * 1024) {
  const b = await readBody(req, limit);
  if (!b.length) return {};
  try { return JSON.parse(b.toString('utf8')); } catch (_) { const e = new Error('bad json'); e.status = 400; throw e; }
}

/* compression: brotli or gzip when the client accepts it. Results for identical bodies are cached. */
const cz = new Map();
function pickEncoding(req) {
  const a = String(req.headers['accept-encoding'] || '');
  return /\bbr\b/.test(a) ? 'br' : /\bgzip\b/.test(a) ? 'gzip' : '';
}
function compress(enc, body, key) {
  if (!enc) return body;
  const k = key ? enc + ':' + key : '';
  if (k && cz.has(k)) return cz.get(k);
  const out = enc === 'br' ? zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : zlib.gzipSync(body, { level: 6 });
  if (k) { if (cz.size > 400) cz.clear(); cz.set(k, out); }
  return out;
}
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json|ld\+json)|image\/svg)/;

/* small helpers shared by the API modules */
const httpError = (status, message) => { const e = new Error(message); e.status = status; return e; };
const sendJson = (res, status, body, headers) => { const b = Buffer.from(JSON.stringify(body)); res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Cache-Control': 'no-store' }, headers)); res.end(b); };
const cleanText = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const csvCell = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

module.exports = { httpError, sendJson, cleanText, csvCell, esc, jsonForScript, sha, slugBase, parseCookies, readBody, readJson, pickEncoding, compress, COMPRESSIBLE };
