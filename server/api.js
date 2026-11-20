'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');
const content = require('./content');
const applications = require('./applications');
const sell = require('./sell');
const mailer = require('./mailer');
const agentsImport = require('./agents_import');
const catalog = require('./catalog');
const catalogAdmin = require('./catalog_admin');
const { readJson, readBody, sha } = require('./util');

const { db } = store;
const err = (status, message) => { const e = new Error(message); e.status = status; return e; };
const json = (res, status, body, headers) => { const b = Buffer.from(JSON.stringify(body)); res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Cache-Control': 'no-store' }, headers)); res.end(b); };
const noContent = (res) => { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); };

/* ---- image uploads: type decided by the file's own bytes, never by what the client says ---- */
function sniff(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (b.length > 6 && /^GIF8[79]a/.test(b.slice(0, 6).toString('latin1'))) return 'image/gif';
  return '';
}
const qAsset = { add: db.prepare('INSERT OR IGNORE INTO assets (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)'), get: db.prepare('SELECT id, mime, bytes FROM assets WHERE id = ?') };
async function upload(req, res) {
  const body = await readBody(req, cfg.maxUpload);
  const mime = sniff(body); if (!mime) throw err(415, 'Only JPEG, PNG, WebP or GIF images are accepted');
  const id = sha(body, 24);
  const file = path.join(cfg.dataDir, 'uploads', id);
  if (!fs.existsSync(file)) fs.writeFileSync(file + '.tmp', body), fs.renameSync(file + '.tmp', file);
  qAsset.add.run(id, mime, body.length, Date.now());
  json(res, 201, { id, url: '/_blob/' + id });
}
function serveBlob(req, res, id) {
  const a = /^[a-f0-9]{24}$/.test(id) ? qAsset.get.get(id) : null;
  if (!a) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
  const etag = '"' + id + '"';
  const base = { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Type': a.mime, 'Cross-Origin-Resource-Policy': 'cross-origin' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, base); return res.end(); }
  let buf; try { buf = fs.readFileSync(path.join(cfg.dataDir, 'uploads', id)); } catch (_) { res.writeHead(404); return res.end(); }
  res.writeHead(200, Object.assign({ 'Content-Length': buf.length }, base)); res.end(buf);
}

/* ---- leads ---- */
const qLead = {
  add: db.prepare('INSERT INTO leads (created_at, interest, name, phone, email, message, property_id, agent_id, lang, page, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)'),
  list: db.prepare('SELECT * FROM leads WHERE (? = \'\' OR status = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?'),
  count: db.prepare('SELECT COUNT(*) AS n FROM leads WHERE (? = \'\' OR status = ?)'),
  counts: db.prepare('SELECT status, COUNT(*) AS n FROM leads GROUP BY status'),
  one: db.prepare('SELECT * FROM leads WHERE id = ?'),
  upd: db.prepare('UPDATE leads SET status = ?, note = ? WHERE id = ?'),
  del: db.prepare('DELETE FROM leads WHERE id = ?'),
  all: db.prepare('SELECT * FROM leads ORDER BY created_at DESC'),
  recent: db.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?'),
  recentAll: db.prepare('SELECT COUNT(*) AS n FROM leads WHERE created_at > ?')
};
const STATUSES = ['new', 'contacted', 'viewing', 'closed', 'spam'];
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

async function createLead(req, res) {
  const b = await readJson(req, 16 * 1024);
  const name = clean(b.name, 120), phone = clean(b.phone, 40), email = clean(b.email, 120), message = clean(b.message, 2000);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2) throw err(422, 'name');
  if (phone && !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15)) throw err(422, 'phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw err(422, 'email');
  if (!phone && !email) throw err(422, 'contact');
  const ip = auth.hashIp(auth.clientIp(req)), now = Date.now();
  if (qLead.recent.get(ip, now - 10 * 60 * 1000).n >= 5 || qLead.recentAll.get(now - 3600 * 1000).n >= 300) throw err(429, 'slow down');
  const interest = b.interest === 'viewing' ? 'viewing' : 'inquiry';
  const lang = b.lang === 'en' ? 'en' : 'ar';
  const row = [now, interest, name, phone, email, message, clean(b.property, 64) || null, clean(b.agent, 64) || null, lang, clean(b.page, 200) || null, ip];
  const r = qLead.add.run(...row);
  const lead = { id: Number(r.lastInsertRowid), created: new Date(now).toISOString(), interest, name, phone, email, message, property: row[6], agent: row[7], lang, page: row[9] };
  notify(lead);
  mailLead(lead);
  json(res, 201, { ok: true });
}
/* the team's mailbox, when it is set up: names the unit and the agent so the email reads on its own */
function mailLead(lead) {
  let propertyTitle = '', agentName = '';
  try {
    const raw = require('./content').snapshot().raw, pr = raw.properties.find((x) => x.id === lead.property), ag = raw.agents.find((x) => x.id === lead.agent);
    if (pr && pr.title) propertyTitle = pr.title.en || pr.title.ar || ''; if (ag && ag.name) agentName = ag.name.en || ag.name.ar || '';
  } catch (_) { /* the plain ids are enough */ }
  mailer.notify('lead', Object.assign({}, lead, { propertyTitle, agentName }));
}
/* optional hook (Zapier, Make, n8n, Slack…): fire and forget, never blocks or fails the visitor */
function notify(lead) {
  if (!cfg.leadWebhook) return;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  fetch(cfg.leadWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'lead.created', site: cfg.siteUrl, lead }), signal: ctl.signal })
    .catch((e) => console.warn('[leads] webhook failed:', e.message)).finally(() => clearTimeout(t));
}
const csvCell = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
function leadsCsv(res) {
  const head = ['id', 'created', 'status', 'interest', 'name', 'phone', 'email', 'message', 'property', 'agent', 'language', 'page', 'note'];
  const rows = qLead.all.all().map((r) => [r.id, new Date(r.created_at).toISOString(), r.status, r.interest, r.name, r.phone, r.email, r.message, r.property_id, r.agent_id, r.lang, r.page, r.note].map(csvCell).join(','));
  const out = '﻿' + head.join(',') + '\r\n' + rows.join('\r\n') + '\r\n';
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="iconic-leads-' + new Date().toISOString().slice(0, 10) + '.csv"', 'Cache-Control': 'no-store' });
  res.end(out);
}
const leadOut = (r) => ({ id: r.id, created: r.created_at, status: r.status, interest: r.interest, name: r.name, phone: r.phone, email: r.email, message: r.message, property: r.property_id, agent: r.agent_id, lang: r.lang, page: r.page, note: r.note || '' });

/* ---- who may do what: admin everything, editor = site content + enquiries, hr = jobs + applications ---- */
const WRITERS = { jobs: ['admin', 'hr'] }, CONTENT_WRITERS = ['admin', 'editor'];
const need = (s, roles) => { if (!roles.includes(s.role)) throw err(403, 'Your account cannot do this'); };

/* ---- router ---- */
async function handle(req, res, url) {
  const p = url.pathname.replace(/^\/api/, '') || '/', m = req.method; let seg;
  try { seg = p.split('/').filter(Boolean).map(decodeURIComponent); } catch (_) { throw err(400, 'bad address'); }

  if (p === '/leads' && m === 'POST') { if (!auth.sameOrigin(req)) throw err(403, 'origin'); return createLead(req, res); }
  if (p === '/applications' && m === 'POST') { if (!auth.sameOrigin(req)) throw err(403, 'origin'); return applications.create(req, res); }
  /* "sell your unit": the form, then the photos one by one with the private token the form handed back */
  if (p === '/sell' && m === 'POST') { if (!auth.sameOrigin(req)) throw err(403, 'origin'); return sell.create(req, res); }
  if (seg[0] === 'sell' && seg.length === 3 && seg[2] === 'files' && m === 'POST' && sell.isToken(seg[1])) { if (!auth.sameOrigin(req)) throw err(403, 'origin'); return sell.addFile(req, res, seg[1], url); }
  /* the CRM's signed events: no browser session, the signature is the proof */
  if (p === '/catalog/events' && m === 'POST') return catalog.receive(req, res);
  if (p === '/login' && m === 'POST') {
    if (!auth.sameOrigin(req)) throw err(403, 'origin');
    const b = await readJson(req, 4096), ip = auth.clientIp(req);
    const r = await auth.login(ip, b.email, b.password);
    if (r.status === 429) throw err(429, 'Too many attempts. Try again in a few minutes.');
    if (r.status !== 200) throw err(401, 'Wrong email or password');
    return json(res, 200, { ok: true, csrf: r.csrf, email: r.email, role: r.role }, { 'Set-Cookie': auth.sessionCookies(r.token) });
  }
  const s = auth.session(req);
  if (p === '/me' && m === 'GET') return json(res, 200, s ? { admin: true, csrf: s.csrf, email: s.email, role: s.role, name: s.name } : { admin: false });
  if (!s) throw err(401, 'Sign in required');
  if (m !== 'GET' && m !== 'HEAD') {
    if (!auth.sameOrigin(req)) throw err(403, 'origin');
    if (req.headers['x-csrf-token'] !== s.csrf) throw err(403, 'csrf');
  }

  if (p === '/logout' && m === 'POST') { auth.logout(req); return json(res, 200, { ok: true }, { 'Set-Cookie': auth.clearCookies() }); }
  if (p === '/account/password' && m === 'POST') {
    const b = await readJson(req, 4096);
    if (!auth.changePassword(s.userId, b.current, b.next)) throw err(403, 'Current password is wrong');
    return json(res, 200, { ok: true });
  }
  if (p === '/assets' && m === 'POST') { need(s, CONTENT_WRITERS); return upload(req, res); }
  /* many sales agents at once from an Excel or CSV file: ?apply=1 saves, without it the file is only checked */
  if (p === '/agents-import' && m === 'POST') {
    need(s, CONTENT_WRITERS);
    const file = await readBody(req, 5 * 1024 * 1024);
    return json(res, 200, agentsImport[url.searchParams.get('apply') === '1' ? 'apply' : 'preview'](file));
  }

  /* ---- people who can sign in (admin only) ---- */
  if (seg[0] === 'users') {
    need(s, ['admin']);
    if (!seg[1] && m === 'GET') return json(res, 200, { users: auth.listUsers(), roles: auth.ROLES, me: s.userId });
    if (!seg[1] && m === 'POST') {
      const b = await readJson(req, 4096);
      const id = auth.createUser(b.email, b.password, String(b.role || 'editor'), b.name);
      return json(res, 201, { user: auth.listUsers().find((u) => u.id === id) });
    }
    if (seg[1] && /^\d+$/.test(seg[1])) {
      const id = Number(seg[1]);
      if (m === 'PATCH') { const b = await readJson(req, 4096); return json(res, 200, { user: auth.updateUser(id, { role: b.role, name: b.name, password: b.password }, s.userId) }); }
      if (m === 'DELETE') { auth.removeUser(id, s.userId); return noContent(res); }
    }
    throw err(404, 'not found');
  }

  /* ---- ICONIC CRM catalog ---- */
  if (seg[0] === 'catalog') {
    if (seg[1] === 'status' && m === 'GET') { need(s, CONTENT_WRITERS); return json(res, 200, catalog.status()); }
    if (seg[1] === 'crm-status' && m === 'GET') { need(s, CONTENT_WRITERS); return json(res, 200, await catalog.crmStatus()); }
    if (seg[1] === 'crm-redeliver' && m === 'POST') { need(s, ['admin']); const b = await readJson(req, 4096); return json(res, 200, await catalog.crmRedeliver(b && b.scope, s.email)); }
    if (seg[1] === 'all' && m === 'GET') { need(s, CONTENT_WRITERS); return json(res, 200, catalogAdmin.all()); }
    if (seg[1] === 'link-units' && m === 'POST') { need(s, ['admin']); const b = await readJson(req, 4096); return json(res, 200, catalogAdmin.linkUnits({ apply: b && b.apply === true })); }
    if (seg[1] === 'reconcile' && m === 'POST') { need(s, ['admin']); return json(res, 200, await catalog.reconcile('admin:' + s.email)); }
    const entity = seg[1], id = seg[2];
    if (catalog.ENTITIES.includes(entity)) {
      const user = { email: s.email, name: s.name };
      if (!id && m === 'POST') { need(s, ['admin']); try { return json(res, 201, await catalog.edit(entity, null, await readJson(req, 64 * 1024), user)); } catch (e) { if (e.payload) return json(res, e.status, Object.assign({ error: e.message }, e.payload)); throw e; } }
      if (id && seg[3] === 'site' && m === 'PATCH') { need(s, CONTENT_WRITERS); return json(res, 200, { record: catalog.siteUpdate(entity, id, await readJson(req, 128 * 1024)) }); }
      if (id && !seg[3] && m === 'PATCH') { need(s, ['admin']); try { return json(res, 200, await catalog.edit(entity, id, await readJson(req, 64 * 1024), user)); } catch (e) { if (e.payload) return json(res, e.status, Object.assign({ error: e.message }, e.payload)); throw e; } }
    }
    throw err(404, 'not found');
  }

  /* the company mailbox the team notices are sent from: admin only, and the password never comes back out */
  if (seg[0] === 'email-settings') {
    need(s, ['admin']);
    if (!seg[1] && m === 'GET') return json(res, 200, mailer.view());
    if (!seg[1] && m === 'PUT') return json(res, 200, mailer.save(await readJson(req, 16 * 1024)));
    if (seg[1] === 'test' && m === 'POST') return json(res, 200, await mailer.test(s.email));
    throw err(404, 'not found');
  }
  if (seg[0] === 'db') {
    const col = seg[1], id = seg[2];
    if (m === 'GET' && col && !id) return json(res, 200, { docs: content.list(col) });
    if (m === 'GET' && col && id) { const d = content.read(col, id); return d ? json(res, 200, { id, data: d.data }) : noContent(res); }   // known document that was never saved: empty answer, not an error (unknown ids still 404 from content.read)
    if ((m === 'PUT' || m === 'DELETE') && col) need(s, WRITERS[col] || CONTENT_WRITERS);
    if (m === 'PUT' && col && id) { const data = content.write(col, id, await readJson(req, 512 * 1024)); return json(res, 200, { id, data }); }
    if (m === 'DELETE' && col && id) { content.del(col, id); return noContent(res); }
  }

  /* ---- job applications (admin and hr) ---- */
  if (seg[0] === 'applications' || p === '/applications.csv') {
    need(s, ['admin', 'hr']);
    if (p === '/applications.csv' && m === 'GET') return applications.csv(res);
    if (!seg[1] && m === 'GET') return applications.list(req, res, url);
    if (seg[1] && /^\d+$/.test(seg[1])) return applications.item(req, res, Number(seg[1]), seg[2]);
    throw err(404, 'not found');
  }

  /* ---- sell requests (admin and editor; only an admin may delete one) ---- */
  if (seg[0] === 'sell' || p === '/sell.csv') {
    need(s, CONTENT_WRITERS);
    if (p === '/sell.csv' && m === 'GET') return sell.csv(res);
    if (!seg[1] && m === 'GET') return sell.list(req, res, url);
    if (seg[1] && /^\d+$/.test(seg[1])) return sell.item(req, res, Number(seg[1]), seg[2], seg[3], s, url);
    throw err(404, 'not found');
  }

  /* ---- enquiries (admin and editor) ---- */
  if (p === '/leads.csv' || p === '/leads' || (seg[0] === 'leads' && seg[1])) need(s, CONTENT_WRITERS);
  if (p === '/leads.csv' && m === 'GET') return leadsCsv(res);
  if (p === '/leads' && m === 'GET') {
    const st = STATUSES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : '';
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50)), offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    const counts = {}; qLead.counts.all().forEach((r) => { counts[r.status] = r.n; });
    return json(res, 200, { total: qLead.count.get(st, st).n, counts, leads: qLead.list.all(st, st, limit, offset).map(leadOut) });
  }
  if (seg[0] === 'leads' && seg[1] && /^\d+$/.test(seg[1])) {
    const id = Number(seg[1]), row = qLead.one.get(id); if (!row) throw err(404, 'not found');
    if (m === 'PATCH') {
      const b = await readJson(req, 8192), status = b.status === undefined ? row.status : b.status;
      if (!STATUSES.includes(status)) throw err(400, 'bad status');
      qLead.upd.run(status, b.note === undefined ? row.note : clean(b.note, 1000), id); return json(res, 200, leadOut(qLead.one.get(id)));
    }
    if (m === 'DELETE') { qLead.del.run(id); return noContent(res); }
  }
  throw err(404, 'not found');
}

module.exports = { handle, serveBlob, json, STATUSES };
