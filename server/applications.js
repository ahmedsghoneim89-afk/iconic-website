'use strict';
/* Job applications: the public form posts here, the dashboard reads them. CV files live outside the public folders and are only ever sent to a signed-in admin or HR user, as a download. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');
const content = require('./content');
const { readJson, httpError: err, sendJson: json, cleanText: clean, csvCell } = require('./util');

const { db } = store;
const STATUSES = ['new', 'reviewing', 'interview', 'hired', 'rejected'];
const MAX_CV = 5 * 1024 * 1024;
const cvDir = path.join(cfg.dataDir, 'cv');

const q = {
  add: db.prepare('INSERT INTO applications (created_at, job_id, job_title, name, phone, email, message, cv_id, cv_name, cv_mime, cv_bytes, lang, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'),
  list: db.prepare("SELECT * FROM applications WHERE (? = '' OR status = ?) AND (? = '' OR job_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?"),
  count: db.prepare("SELECT COUNT(*) AS n FROM applications WHERE (? = '' OR status = ?) AND (? = '' OR job_id = ?)"),
  counts: db.prepare('SELECT status, COUNT(*) AS n FROM applications GROUP BY status'),
  one: db.prepare('SELECT * FROM applications WHERE id = ?'),
  upd: db.prepare('UPDATE applications SET status = ?, note = ? WHERE id = ?'),
  del: db.prepare('DELETE FROM applications WHERE id = ?'),
  all: db.prepare('SELECT * FROM applications ORDER BY created_at DESC'),
  recent: db.prepare('SELECT COUNT(*) AS n FROM applications WHERE ip_hash = ? AND created_at > ?'),
  recentAll: db.prepare('SELECT COUNT(*) AS n FROM applications WHERE created_at > ?')
};

/* the type of a CV is decided by its own first bytes, never by what the client claims */
function sniffCv(b) {
  if (b.length > 8 && b.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return { mime: 'application/msword', ext: 'doc' };
  if (b.length > 30 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4 && b.indexOf('word/') !== -1) return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
  return null;
}
const safeFileName = (raw, ext, fallback) => {
  let n = String(raw || '').split(/[\\/]/).pop().replace(/[\u0000-\u001F\u007F"<>:*?|]/g, '').replace(/\.[^.]*$/, '').trim().slice(0, 80);
  return (n || fallback) + '.' + ext;
};
const isCvId = (id) => /^[a-f0-9]{32}$/.test(String(id || ''));

/* ---- public: a candidate applies ---- */
async function create(req, res) {
  const b = await readJson(req, 8 * 1024 * 1024);
  const name = clean(b.name, 120), phone = clean(b.phone, 40), email = clean(b.email, 120), message = clean(b.message, 2000);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2) throw err(422, 'name');
  if (phone && !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15)) throw err(422, 'phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw err(422, 'email');
  if (!phone && !email) throw err(422, 'contact');

  let jobId = null, jobTitle = null; const jobRef = clean(b.job, 64);
  if (jobRef) {
    const job = content.read('jobs', jobRef);
    if (!job || job.data.active === false) throw err(422, 'job');
    jobId = jobRef; jobTitle = (job.data.title && (job.data.title.en || job.data.title.ar)) || jobRef;
  }

  let cv = null;
  if (b.cv && typeof b.cv === 'object' && b.cv.data) {
    if (typeof b.cv.data !== 'string' || b.cv.data.length > Math.ceil(MAX_CV * 1.4) + 8) throw err(413, 'cv too large');
    const bytes = Buffer.from(b.cv.data, 'base64');
    if (!bytes.length) throw err(422, 'cv');
    if (bytes.length > MAX_CV) throw err(413, 'cv too large');
    const kind = sniffCv(bytes); if (!kind) throw err(415, 'Only PDF, DOC or DOCX files are accepted');
    cv = { bytes, kind, name: safeFileName(b.cv.name, kind.ext, 'cv') };
  }

  const ip = auth.hashIp(auth.clientIp(req)), now = Date.now();
  if (q.recent.get(ip, now - 10 * 60 * 1000).n >= 4 || q.recentAll.get(now - 3600 * 1000).n >= 120) throw err(429, 'slow down');

  let cvId = null;
  if (cv) { cvId = crypto.randomBytes(16).toString('hex'); const f = path.join(cvDir, cvId); fs.writeFileSync(f + '.tmp', cv.bytes, { mode: 0o600 }); fs.renameSync(f + '.tmp', f); }
  const lang = b.lang === 'en' ? 'en' : 'ar';
  let r;
  try { r = q.add.run(now, jobId, jobTitle, name, phone, email, message, cvId, cv ? cv.name : null, cv ? cv.kind.mime : null, cv ? cv.bytes.length : null, lang, ip); }
  catch (e) { if (cvId) fs.rm(path.join(cvDir, cvId), () => {}); throw e; }
  notify({ id: Number(r.lastInsertRowid), created: new Date(now).toISOString(), job: jobTitle, name, phone, email, message, hasCv: !!cv, lang });
  json(res, 201, { ok: true });
}
function notify(app) {
  if (!cfg.leadWebhook) return;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  fetch(cfg.leadWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'application.created', site: cfg.siteUrl, application: app }), signal: ctl.signal })
    .catch((e) => console.warn('[applications] webhook failed:', e.message)).finally(() => clearTimeout(t));
}

/* ---- dashboard ---- */
const out = (r) => ({ id: r.id, created: r.created_at, status: r.status, job: r.job_id || '', jobTitle: r.job_title || '', name: r.name, phone: r.phone, email: r.email, message: r.message, lang: r.lang, note: r.note || '', cv: r.cv_id ? { name: r.cv_name, mime: r.cv_mime, bytes: r.cv_bytes } : null });

function list(req, res, url) {
  const st = STATUSES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : '';
  const job = clean(url.searchParams.get('job'), 64);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 30)), offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const counts = {}; q.counts.all().forEach((r) => { counts[r.status] = r.n; });
  json(res, 200, { total: q.count.get(st, st, job, job).n, counts, applications: q.list.all(st, st, job, job, limit, offset).map(out) });
}
function csv(res) {
  const head = ['id', 'created', 'status', 'position', 'name', 'phone', 'email', 'message', 'cv', 'language', 'note'];
  const rows = q.all.all().map((r) => [r.id, new Date(r.created_at).toISOString(), r.status, r.job_title || 'General application', r.name, r.phone, r.email, r.message, r.cv_name || '', r.lang, r.note].map(csvCell).join(','));
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="iconic-applications-' + new Date().toISOString().slice(0, 10) + '.csv"', 'Cache-Control': 'no-store' });
  res.end('﻿' + head.join(',') + '\r\n' + rows.join('\r\n') + '\r\n');
}
function cvDownload(res, row) {
  if (!row.cv_id || !isCvId(row.cv_id)) throw err(404, 'not found');
  let buf; try { buf = fs.readFileSync(path.join(cvDir, row.cv_id)); } catch (_) { throw err(404, 'The file is no longer on the server'); }
  const fn = row.cv_name || 'cv';
  res.writeHead(200, {
    'Content-Type': row.cv_mime || 'application/octet-stream', 'Content-Length': buf.length, 'Cache-Control': 'no-store',
    'Content-Disposition': 'attachment; filename="cv-' + row.id + path.extname(fn) + '"; filename*=UTF-8\'\'' + encodeURIComponent(fn),
    'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Cross-Origin-Resource-Policy': 'same-origin'
  });
  res.end(buf);
}
/* GET/PATCH/DELETE on /applications/:id and /applications/:id/cv */
async function item(req, res, id, sub) {
  const row = q.one.get(id); if (!row) throw err(404, 'not found');
  if (sub === 'cv' && req.method === 'GET') return cvDownload(res, row);
  if (sub) throw err(404, 'not found');
  if (req.method === 'PATCH') {
    const b = await readJson(req, 8192), status = b.status === undefined ? row.status : b.status;
    if (!STATUSES.includes(status)) throw err(400, 'bad status');
    q.upd.run(status, b.note === undefined ? row.note : clean(b.note, 1000), id); return json(res, 200, out(q.one.get(id)));
  }
  if (req.method === 'DELETE') {
    q.del.run(id); if (isCvId(row.cv_id)) fs.rm(path.join(cvDir, row.cv_id), () => {});
    res.writeHead(204, { 'Cache-Control': 'no-store' }); return res.end();
  }
  throw err(405, 'method');
}

module.exports = { create, list, csv, item, STATUSES, sniffCv };
