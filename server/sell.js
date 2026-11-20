'use strict';
/* "Sell your unit": an owner or a broker sends a unit through the form on the site. The request is kept here, the team follows it through a
   few stages in the dashboard, and the sender follows it on a private page (an unguessable link). Photos and ownership papers are stored outside
   the public folders and only ever sent to a signed-in admin or editor. Nothing here is sent to the CRM. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');
const content = require('./content');
const I = require('./i18n.json');
const { waNumber } = require('./render/ctx');
const { readJson, httpError: err, sendJson: json, cleanText: clean, csvCell, sha } = require('./util');

const { db } = store;
const dir = path.join(cfg.dataDir, 'sell');
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

/* the stages, in the order a request moves through them */
const STATUSES = ['new', 'contacted', 'inspection', 'pricing', 'published', 'sold', 'rejected'];
/* what the sender sees: five steps. Inspection and pricing are one step for them. */
const STEPS = ['received', 'reviewed', 'inspected', 'published', 'sold'];
const STEP_OF = { new: 0, contacted: 1, inspection: 2, pricing: 2, published: 3, sold: 4 };
const FINISHING = ['finished', 'semi', 'core', 'furnished'];
const WHO = ['owner', 'broker'];
const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const Lists = require('./lists');
/* a seller picks from the unit types the company offers now; "sell or rent out" stays fixed */
const PURPOSE_IDS = I.purposes.map((x) => x[0]);
const MAX_PHOTOS = 15, MAX_PHOTO = 6 * 1024 * 1024, MAX_DOC = 8 * 1024 * 1024, MAX_TOTAL = 80 * 1024 * 1024, UPLOAD_DAYS = 7;

const q = {
  add: db.prepare(`INSERT INTO sell_requests (token, created_at, updated_at, lang, who, name, phone, email, city_id, city_name, area_id, area_name, project_id, project_name, type, purpose, area_m2, beds, baths, finishing, floor, price, currency, valuation, negotiable, details, video_url, photos_declared, ip_hash)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
  one: db.prepare('SELECT * FROM sell_requests WHERE id = ?'),
  byToken: db.prepare('SELECT * FROM sell_requests WHERE token = ?'),
  counts: db.prepare('SELECT status, COUNT(*) AS n FROM sell_requests GROUP BY status'),
  all: db.prepare('SELECT * FROM sell_requests ORDER BY created_at DESC'),
  recent: db.prepare('SELECT COUNT(*) AS n FROM sell_requests WHERE ip_hash = ? AND created_at > ?'),
  recentAll: db.prepare('SELECT COUNT(*) AS n FROM sell_requests WHERE created_at > ?'),
  twin: db.prepare('SELECT * FROM sell_requests WHERE phone = ? AND created_at > ? AND type IS ? AND purpose IS ? AND city_name IS ? AND area_name IS ? AND project_name IS ? AND area_m2 IS ? AND price IS ? ORDER BY created_at DESC LIMIT 1'),
  setStatus: db.prepare('UPDATE sell_requests SET status = ?, updated_at = ? WHERE id = ?'),
  setAgent: db.prepare('UPDATE sell_requests SET agent_id = ?, updated_at = ? WHERE id = ?'),
  setClientNote: db.prepare('UPDATE sell_requests SET client_note = ?, updated_at = ? WHERE id = ?'),
  setUnit: db.prepare('UPDATE sell_requests SET unit_id = ?, updated_at = ? WHERE id = ?'),
  setWa: db.prepare('UPDATE sell_requests SET wa_state = ? WHERE id = ?'),
  touch: db.prepare('UPDATE sell_requests SET updated_at = ? WHERE id = ?'),
  del: db.prepare('DELETE FROM sell_requests WHERE id = ?'),
  addEvent: db.prepare('INSERT INTO sell_events (request_id, at, kind, actor, from_status, to_status, text, public) VALUES (?,?,?,?,?,?,?,?)'),
  events: db.prepare('SELECT * FROM sell_events WHERE request_id = ? ORDER BY at ASC, id ASC'),
  delEvents: db.prepare('DELETE FROM sell_events WHERE request_id = ?'),
  files: db.prepare('SELECT * FROM sell_files WHERE request_id = ? ORDER BY kind ASC, pos ASC, created_at ASC'),
  file: db.prepare('SELECT * FROM sell_files WHERE id = ? AND request_id = ?'),
  fileStat: db.prepare("SELECT SUM(CASE WHEN kind = 'photo' THEN 1 ELSE 0 END) AS photos, SUM(CASE WHEN kind = 'doc' THEN 1 ELSE 0 END) AS docs, COALESCE(SUM(bytes), 0) AS bytes FROM sell_files WHERE request_id = ?"),
  addFile: db.prepare('INSERT INTO sell_files (id, request_id, kind, name, mime, bytes, pos, created_at) VALUES (?,?,?,?,?,?,?,?)'),
  delFiles: db.prepare('DELETE FROM sell_files WHERE request_id = ?'),
  asset: db.prepare('INSERT OR IGNORE INTO assets (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)')
};

const refOf = (id) => 'SR-' + String(id).padStart(5, '0');
const isToken = (s) => /^[a-f0-9]{32}$/.test(String(s || ''));
const isFileId = (s) => /^[a-f0-9]{32}$/.test(String(s || ''));
const label = (list, key, lang) => { const f = list.find((x) => x[0] === key); return f ? f[1][lang] : (key || ''); };
const event = (id, kind, actor, o) => { o = o || {}; q.addEvent.run(id, Date.now(), kind, actor || '', o.from || null, o.to || null, o.text || null, o.public ? 1 : 0); };

/* ---- the words used in WhatsApp messages and in the tracking page ---- */
const W = {
  ar: {
    head: 'طلب بيع جديد', ref: 'رقم الطلب', name: 'الاسم', phone: 'الموبايل', email: 'البريد', unit: 'الوحدة', where: 'الموقع', size: 'المساحة', sqm: 'م²', beds: 'غرف', baths: 'حمامات', finishing: 'التشطيب', floor: 'الدور',
    price: 'السعر المطلوب', negotiable: 'قابل للتفاوض', valuation: 'يريد تقييمًا للسعر', photos: 'الصور', video: 'فيديو', details: 'ملاحظات', track: 'متابعة الطلب', admin: 'لوحة الإدارة', agent: 'الوكيل',
    who: { owner: 'مالك', broker: 'وسيط' }, fin: { finished: 'تشطيب كامل', semi: 'نصف تشطيب', core: 'بدون تشطيب', furnished: 'مفروشة' }, cur: { EGP: 'جنيه', USD: 'دولار', EUR: 'يورو', GBP: 'جنيه إسترليني', AED: 'درهم', SAR: 'ريال' },
    clientHello: 'مرحبًا ICONIC، أرسلت للتو طلب بيع وحدة من الموقع.'
  },
  en: {
    head: 'New sell request', ref: 'Request', name: 'Name', phone: 'Mobile', email: 'Email', unit: 'Unit', where: 'Location', size: 'Size', sqm: 'm²', beds: 'bedrooms', baths: 'bathrooms', finishing: 'Finishing', floor: 'Floor',
    price: 'Asking price', negotiable: 'negotiable', valuation: 'wants a price valuation', photos: 'Photos', video: 'Video', details: 'Notes', track: 'Track the request', admin: 'Dashboard', agent: 'Agent',
    who: { owner: 'Owner', broker: 'Broker' }, fin: { finished: 'Fully finished', semi: 'Semi-finished', core: 'Core and shell', furnished: 'Furnished' }, cur: { EGP: 'EGP', USD: 'USD', EUR: 'EUR', GBP: 'GBP', AED: 'AED', SAR: 'SAR' },
    clientHello: 'Hello ICONIC, I just sent a request to sell a unit through the website.'
  }
};
const num = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
const whereOf = (r, sep) => [r.city_name, r.area_name, r.project_name].filter(Boolean).join(sep || ' › ');
const trackPath = (lang, token) => '/' + lang + '/sell/track/' + token;

/* the same facts, as lines of text. `forStaff` adds the dashboard link, otherwise the sender's own tracking link. */
function summaryLines(r, lang, forStaff) {
  const w = W[lang] || W.ar, ar = lang === 'ar', lines = [];
  lines.push('*' + (forStaff ? w.head : w.clientHello) + '*');
  lines.push(w.ref + ': ' + refOf(r.id));
  lines.push(w.name + ': ' + r.name + ' (' + w.who[r.who || 'owner'] + ')');
  lines.push(w.phone + ': ' + r.phone);
  if (r.email) lines.push(w.email + ': ' + r.email);
  lines.push(w.unit + ': ' + [label(Lists.pairs(Lists.read().types), r.type, lang), label(I.purposes, r.purpose, lang)].filter(Boolean).join(' - '));
  const wh = whereOf(r, ' > '); if (wh) lines.push(w.where + ': ' + wh);
  const spec = [];
  if (r.area_m2) spec.push(w.size + ': ' + num(r.area_m2) + ' ' + w.sqm);
  if (r.beds != null) spec.push(r.beds + ' ' + w.beds);
  if (r.baths != null) spec.push(r.baths + ' ' + w.baths);
  if (r.finishing) spec.push(w.finishing + ': ' + (w.fin[r.finishing] || r.finishing));
  if (r.floor) spec.push(w.floor + ': ' + r.floor);
  if (spec.length) lines.push(spec.join(' | '));
  if (r.valuation) lines.push(w.price + ': ' + w.valuation);
  else if (r.price != null) lines.push(w.price + ': ' + num(r.price) + ' ' + (w.cur[r.currency] || r.currency || '') + (r.negotiable ? ' (' + w.negotiable + ')' : ''));
  if (r.photos_declared) lines.push(w.photos + ': ' + r.photos_declared);
  if (r.video_url) lines.push(w.video + ': ' + r.video_url);
  if (r.details) lines.push(w.details + ': ' + String(r.details).replace(/\s+/g, ' ').slice(0, 300));
  lines.push((forStaff ? w.admin + ': ' + cfg.siteUrl + '/admin' : w.track + ': ' + cfg.siteUrl + trackPath(r.lang === 'en' ? 'en' : 'ar', r.token)));
  return lines;
}
const companyWa = () => { const c = (content.snapshot().raw.company) || {}; return waNumber(c.whatsapp); };
/* a click-to-chat link to the company's WhatsApp, with the request already written in. Empty when the company has no WhatsApp number yet. */
function clientWaLink(r) {
  const n = companyWa(); if (!n) return '';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(summaryLines(r, r.lang === 'en' ? 'en' : 'ar', false).join('\n'));
}

/* ---- telling the team: the WhatsApp Cloud API when it is set up, and the optional webhook ---- */
async function postJson(url, headers, body) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try { const res = await fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body), signal: ctl.signal }); return res; }
  finally { clearTimeout(t); }
}
async function pushWhatsApp(r) {
  if (!cfg.waToken || !cfg.waPhoneId) return 'off';
  const to = waNumber(cfg.waTo) || companyWa(); if (!to) return 'no-number';
  const text = summaryLines(r, 'ar', true).join('\n');
  const msg = cfg.waTemplate
    /* template parameters cannot hold line breaks, so the lines are joined */
    ? { messaging_product: 'whatsapp', to, type: 'template', template: { name: cfg.waTemplate, language: { code: cfg.waTemplateLang }, components: [{ type: 'body', parameters: [{ type: 'text', text: text.replace(/\*/g, '').split('\n').join(' | ').replace(/\s{2,}/g, ' ').slice(0, 1000) }] }] } }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body: text.slice(0, 3800) } };
  try {
    const res = await postJson(cfg.waUrl + '/' + encodeURIComponent(cfg.waPhoneId) + '/messages', { Authorization: 'Bearer ' + cfg.waToken }, msg);
    return res.ok ? 'sent' : 'failed:' + res.status;
  } catch (e) { return 'failed:' + (e && e.name === 'AbortError' ? 'timeout' : 'network'); }
}
async function notifyTeam(id) {
  const r = q.one.get(id); if (!r) return 'gone';
  let state = 'off';
  try { state = await pushWhatsApp(r); } catch (e) { state = 'failed:error'; }
  q.setWa.run(state, id);
  if (state !== 'off') event(id, 'notify', 'system', { text: 'whatsapp ' + state });
  /* the team's mailbox: the same facts as the WhatsApp message, as rows */
  const mail = await require('./mailer').notify('sell', { ref: refOf(r.id), created: new Date(r.created_at).toISOString(), rows: (lang) => summaryLines(r, lang, true).map((l) => l.replace(/\*/g, '')).filter((l) => l.includes(': ')).slice(1).map((l) => { const i = l.indexOf(': '); return [l.slice(0, i), l.slice(i + 2)]; }) });
  if (mail !== 'off') event(id, 'notify', 'system', { text: 'email ' + mail });
  if (cfg.leadWebhook) {
    postJson(cfg.leadWebhook, {}, { event: 'sell_request.created', site: cfg.siteUrl, request: { id: r.id, ref: refOf(r.id), created: new Date(r.created_at).toISOString(), name: r.name, who: r.who, phone: r.phone, email: r.email, city: r.city_name, area: r.area_name, project: r.project_name, type: r.type, purpose: r.purpose, areaM2: r.area_m2, beds: r.beds, baths: r.baths, finishing: r.finishing, floor: r.floor, price: r.price, currency: r.currency, valuation: !!r.valuation, negotiable: !!r.negotiable, details: r.details, video: r.video_url, lang: r.lang, text: summaryLines(r, 'ar', true).join('\n') } })
      .catch((e) => console.warn('[sell] webhook failed:', e.message));
  }
  return state;
}

/* ---- public: the form ---- */
const catalogLists = () => {
  const raw = content.snapshot().raw, live = (a) => (a || []).filter((x) => !x.crmDeleted && x.name);
  return { cities: live(raw.cities), areas: live(raw.areas), projects: live(raw.projects).filter((x) => x.active !== false) };
};
const toNum = (v, min, max, code) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/,/g, '')); if (!Number.isFinite(n) || n < min || n > max) throw err(422, code); return n;
};
function validate(b) {
  const name = clean(b.name, 120), phone = clean(b.phone, 40), email = clean(b.email, 120), digits = phone.replace(/\D/g, '');
  if (name.length < 2) throw err(422, 'name');
  if (!phone || !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15)) throw err(422, 'phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw err(422, 'email');
  if (b.consent !== true) throw err(422, 'consent');
  const who = WHO.includes(b.who) ? b.who : 'owner';

  /* the place: ids from the catalog when the site has one, otherwise (or when the list has no match) the words the sender typed */
  const K = catalogLists();
  let city = null, area = null, project = null;
  const cityId = clean(b.city, 40), areaId = clean(b.area, 40), projectId = clean(b.project, 40);
  if (cityId) { city = K.cities.find((x) => x.crmId === cityId); if (!city) throw err(422, 'city'); }
  if (areaId) { area = K.areas.find((x) => x.crmId === areaId); if (!area || (city && area.cityId !== city.crmId)) throw err(422, 'area'); if (!city) city = K.cities.find((x) => x.crmId === area.cityId) || null; }
  if (projectId) { project = K.projects.find((x) => x.crmId === projectId); if (!project || (city && project.cityId !== city.crmId) || (area && project.areaId && project.areaId !== area.crmId)) throw err(422, 'project'); if (!city) city = K.cities.find((x) => x.crmId === project.cityId) || null; if (!area && project.areaId) area = K.areas.find((x) => x.crmId === project.areaId) || null; }
  const cityName = city ? city.name : clean(b.cityOther, 80), areaName = area ? area.name : clean(b.areaOther, 80), projectName = project ? project.name : clean(b.projectOther, 120);
  if (!cityName) throw err(422, 'city');

  const type = clean(b.type, 30), purpose = clean(b.purpose, 30);
  if (!Lists.read().types.some((x) => x.active && x.id === type)) throw err(422, 'type');
  if (!PURPOSE_IDS.includes(purpose)) throw err(422, 'purpose');
  const areaM2 = toNum(b.areaM2, 1, 1000000, 'size'); if (areaM2 == null) throw err(422, 'size');
  const beds = toNum(b.beds, 0, 50, 'beds'), baths = toNum(b.baths, 0, 50, 'baths');
  const finishing = FINISHING.includes(b.finishing) ? b.finishing : '';
  const valuation = b.valuation === true, price = valuation ? null : toNum(b.price, 0, 1e12, 'price');
  if (!valuation && (price == null || price <= 0)) throw err(422, 'price');
  const currency = CURRENCIES.includes(b.currency) ? b.currency : 'EGP';
  const video = clean(b.video, 300); if (video && !/^https:\/\/[^\s<>"']+$/i.test(video)) throw err(422, 'video');
  return {
    who, name, phone, email, lang: b.lang === 'en' ? 'en' : 'ar',
    cityId: city ? city.crmId : null, cityName, areaId: area ? area.crmId : null, areaName, projectId: project ? project.crmId : null, projectName,
    type, purpose, areaM2, beds: beds == null ? null : Math.round(beds), baths: baths == null ? null : Math.round(baths), finishing, floor: clean(b.floor, 20),
    price, currency, valuation, negotiable: !valuation && b.negotiable === true, details: clean(b.details, 1500), video, photos: Math.max(0, Math.min(MAX_PHOTOS, Math.round(Number(b.photos) || 0)))
  };
}
async function create(req, res) {
  const b = await readJson(req, 32 * 1024);
  if (b && b.website) return json(res, 201, { ok: true });   // the hidden field: only a program fills it, so nothing is kept
  const v = validate(b || {});
  const ip = auth.hashIp(auth.clientIp(req)), now = Date.now();
  if (q.recent.get(ip, now - 10 * 60 * 1000).n >= 6 || q.recentAll.get(now - 3600 * 1000).n >= 80) throw err(429, 'slow down');
  /* the same request sent twice (a double tap, a retry) is one request */
  const twin = q.twin.get(v.phone, now - 10 * 60 * 1000, v.type, v.purpose, v.cityName, v.areaName || '', v.projectName || '', v.areaM2, v.price);
  if (twin) return json(res, 200, reply(twin));
  const token = crypto.randomBytes(16).toString('hex');
  const r = q.add.run(token, now, now, v.lang, v.who, v.name, v.phone, v.email, v.cityId, v.cityName, v.areaId, v.areaName || '', v.projectId, v.projectName || '', v.type, v.purpose, v.areaM2, v.beds, v.baths, v.finishing, v.floor, v.price, v.currency, v.valuation ? 1 : 0, v.negotiable ? 1 : 0, v.details, v.video, v.photos, ip);
  const id = Number(r.lastInsertRowid);
  event(id, 'created', 'client', { to: 'new', public: true });
  const row = q.one.get(id);
  notifyTeam(id).catch((e) => console.warn('[sell] notify failed:', e && e.message));
  json(res, 201, reply(row));
}
const reply = (r) => ({ ok: true, ref: refOf(r.id), token: r.token, track: trackPath(r.lang === 'en' ? 'en' : 'ar', r.token), wa: clientWaLink(r) });

/* ---- files: type decided by the file's own bytes ---- */
function sniff(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (b.length > 8 && b.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}
const safeName = (raw, ext, fallback) => {
  const n = String(raw || '').split(/[\\/]/).pop().replace(/[\u0000-\u001F\u007F"<>:*?|]/g, '').replace(/\.[^.]*$/, '').trim().slice(0, 80);
  return (n || fallback) + '.' + ext;
};
/* A body over the limit is read and thrown away, so the sender gets a clear "too large" answer instead of a dropped connection. */
async function readCapped(req, limit) {
  const hard = limit * 4, chunks = []; let n = 0, over = false;
  for await (const c of req) {
    n += c.length; if (n > hard) throw err(413, 'file too large');
    if (over) continue;
    if (n > limit) { over = true; chunks.length = 0; continue; }
    chunks.push(c);
  }
  if (over) throw err(413, 'file too large');
  return Buffer.concat(chunks);
}
async function addFile(req, res, token, url) {
  const r = q.byToken.get(token); if (!r) throw err(404, 'not found');
  if (['sold', 'rejected'].includes(r.status) || Date.now() - r.created_at > UPLOAD_DAYS * 86400000) throw err(403, 'closed');
  const kind = url.searchParams.get('kind') === 'doc' ? 'doc' : 'photo';
  const st = q.fileStat.get(r.id);
  if (kind === 'photo' && (st.photos || 0) >= MAX_PHOTOS) throw err(409, 'too many photos');
  if (kind === 'doc' && (st.docs || 0) >= 1) throw err(409, 'document already attached');
  const body = await readCapped(req, kind === 'doc' ? MAX_DOC : MAX_PHOTO);
  if (!body.length) throw err(422, 'empty');
  if ((st.bytes || 0) + body.length > MAX_TOTAL) throw err(413, 'too much data');
  const type = sniff(body);
  if (!type || (kind === 'photo' && type.mime === 'application/pdf')) throw err(415, kind === 'photo' ? 'Only JPEG, PNG or WebP photos are accepted' : 'Only PDF, JPEG or PNG files are accepted');
  const id = crypto.randomBytes(16).toString('hex'), f = path.join(dir, id);
  fs.writeFileSync(f + '.tmp', body, { mode: 0o600 }); fs.renameSync(f + '.tmp', f);
  try { q.addFile.run(id, r.id, kind, safeName(url.searchParams.get('name'), type.ext, kind === 'doc' ? 'document' : 'photo'), type.mime, body.length, Number(url.searchParams.get('pos')) || 0, Date.now()); }
  catch (e) { fs.rm(f, () => {}); throw e; }
  q.touch.run(Date.now(), r.id);
  json(res, 201, { ok: true, id });
}
function sendFile(res, row, inline) {
  if (!isFileId(row.id)) throw err(404, 'not found');
  let buf; try { buf = fs.readFileSync(path.join(dir, row.id)); } catch (_) { throw err(404, 'The file is no longer on the server'); }
  const fn = row.name || (row.kind + '-' + row.id.slice(0, 6));
  res.writeHead(200, {
    'Content-Type': row.mime, 'Content-Length': buf.length, 'Cache-Control': 'private, no-store',
    'Content-Disposition': (inline && row.mime.startsWith('image/') ? 'inline' : 'attachment') + '; filename="' + refOf(row.request_id) + path.extname(fn) + '"; filename*=UTF-8\'\'' + encodeURIComponent(fn),
    'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self'", 'Cross-Origin-Resource-Policy': 'same-origin'
  });
  res.end(buf);
}

/* ---- the sender's own page ---- */
function stepReached(events) {
  const at = [null, null, null, null, null];
  events.forEach((e) => { if (e.kind === 'created') at[0] = at[0] || e.at; if (e.kind === 'status' && STEP_OF[e.to_status] != null) { const s = STEP_OF[e.to_status]; for (let i = 0; i <= s; i++) at[i] = at[i] || e.at; } });
  return at;
}
function track(token) {
  if (!isToken(token)) return null;
  const r = q.byToken.get(token); if (!r) return null;
  const events = q.events.all(r.id), photos = (q.fileStat.get(r.id).photos) || 0;
  const raw = content.snapshot().raw, ag = r.agent_id ? (raw.agents || []).find((a) => a.id === r.agent_id) : null;
  const rejectedAt = events.filter((e) => e.kind === 'status' && e.to_status === 'rejected').map((e) => e.at).pop() || null;
  const step = r.status === 'rejected' ? -1 : STEP_OF[r.status];
  const reached = stepReached(events);
  /* a step that was passed over (the team jumped straight to Published) shows the time it was passed */
  return {
    ref: refOf(r.id), token: r.token, lang: r.lang === 'en' ? 'en' : 'ar', status: r.status, step, reached, rejectedAt, created: r.created_at, updated: r.updated_at, name: r.name,
    type: r.type, purpose: r.purpose, where: whereOf(r), areaM2: r.area_m2, beds: r.beds, baths: r.baths, price: r.price, currency: r.currency, valuation: !!r.valuation, photos, clientNote: r.client_note || '',
    note: (events.filter((e) => e.kind === 'client_note').pop() || {}).at || null, unitId: r.unit_id || '', agentId: ag ? ag.id : ''
  };
}

/* ---- dashboard ---- */
const out = (r) => ({
  id: r.id, ref: refOf(r.id), created: r.created_at, updated: r.updated_at, status: r.status, lang: r.lang, who: r.who, name: r.name, phone: r.phone, email: r.email || '',
  city: r.city_name || '', area: r.area_name || '', project: r.project_name || '', cityId: r.city_id || '', areaId: r.area_id || '', projectId: r.project_id || '',
  type: r.type, purpose: r.purpose, areaM2: r.area_m2, beds: r.beds, baths: r.baths, finishing: r.finishing || '', floor: r.floor || '', price: r.price, currency: r.currency, valuation: !!r.valuation, negotiable: !!r.negotiable,
  details: r.details || '', video: r.video_url || '', photosDeclared: r.photos_declared, agent: r.agent_id || '', clientNote: r.client_note || '', unit: r.unit_id || '', wa: r.wa_state || '', token: r.token
});
const outFile = (f) => ({ id: f.id, kind: f.kind, name: f.name, mime: f.mime, bytes: f.bytes });
const outEvent = (e) => ({ id: e.id, at: e.at, kind: e.kind, actor: e.actor, from: e.from_status || '', to: e.to_status || '', text: e.text || '', public: !!e.public });

function list(req, res, url) {
  const st = STATUSES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : '';
  const text = clean(url.searchParams.get('q'), 60).toLowerCase();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30)), offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const where = [], args = [];
  if (st) { where.push('r.status = ?'); args.push(st); }
  if (text) {
    const like = '%' + text.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    where.push("(LOWER(r.name) LIKE ? ESCAPE '\\' OR r.phone LIKE ? ESCAPE '\\' OR LOWER(COALESCE(r.project_name,'')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(r.area_name,'')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(r.city_name,'')) LIKE ? ESCAPE '\\' OR LOWER('sr-' || printf('%05d', r.id)) LIKE ? ESCAPE '\\')");
    args.push(like, like, like, like, like, like);
  }
  const w = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const total = db.prepare('SELECT COUNT(*) AS n FROM sell_requests r' + w).get(...args).n;
  const rows = db.prepare('SELECT r.*, (SELECT COUNT(*) FROM sell_files f WHERE f.request_id = r.id AND f.kind = \'photo\') AS photos, (SELECT f.id FROM sell_files f WHERE f.request_id = r.id AND f.kind = \'photo\' ORDER BY f.pos ASC, f.created_at ASC LIMIT 1) AS cover FROM sell_requests r' + w + ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?').all(...args, limit, offset);
  const counts = {}; q.counts.all().forEach((r) => { counts[r.status] = r.n; });
  json(res, 200, { total, counts, requests: rows.map((r) => Object.assign(out(r), { photos: r.photos, cover: r.cover || '' })) });
}
function detail(id) {
  const r = q.one.get(id); if (!r) throw err(404, 'not found');
  return Object.assign(out(r), { files: q.files.all(id).map(outFile), events: q.events.all(id).map(outEvent), trackUrl: trackPath(r.lang === 'en' ? 'en' : 'ar', r.token), clientWa: clientWaLink(r), staffText: summaryLines(r, 'ar', true).join('\n') });
}
function csv(res) {
  const head = ['ref', 'created', 'status', 'name', 'who', 'phone', 'email', 'governorate', 'area', 'project', 'type', 'purpose', 'area_m2', 'beds', 'baths', 'finishing', 'floor', 'price', 'currency', 'wants_valuation', 'negotiable', 'agent', 'unit', 'language', 'details'];
  const rows = q.all.all().map((r) => [refOf(r.id), new Date(r.created_at).toISOString(), r.status, r.name, r.who, r.phone, r.email, r.city_name, r.area_name, r.project_name, r.type, r.purpose, r.area_m2, r.beds, r.baths, r.finishing, r.floor, r.price, r.currency, r.valuation ? 'yes' : '', r.negotiable ? 'yes' : '', r.agent_id, r.unit_id, r.lang, r.details].map(csvCell).join(','));
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="iconic-sell-requests-' + new Date().toISOString().slice(0, 10) + '.csv"', 'Cache-Control': 'no-store' });
  res.end('﻿' + head.join(',') + '\r\n' + rows.join('\r\n') + '\r\n');
}
/* a unit form filled in from the request. The photos are copied into the public image store only now, because the person pressed the button. */
function prepareUnit(id) {
  const r = q.one.get(id); if (!r) throw err(404, 'not found');
  const K = catalogLists(), city = r.city_id ? K.cities.find((x) => x.crmId === r.city_id) : null, ar = r.lang !== 'en';
  const project = r.project_id ? K.projects.find((x) => x.crmId === r.project_id) : null;
  const images = [];
  q.files.all(id).filter((f) => f.kind === 'photo').slice(0, 30).forEach((f) => {
    let buf; try { buf = fs.readFileSync(path.join(dir, f.id)); } catch (_) { return; }
    const aid = sha(buf, 24), file = path.join(cfg.dataDir, 'uploads', aid);
    if (!fs.existsSync(file)) { fs.writeFileSync(file + '.tmp', buf); fs.renameSync(file + '.tmp', file); }
    q.asset.run(aid, f.mime, buf.length, Date.now()); images.push({ id: aid });
  });
  const where = r.project_name || r.area_name || r.city_name || '';
  const w = W[ar ? 'ar' : 'en'], extra = [];
  if (r.finishing) extra.push(w.finishing + ': ' + (w.fin[r.finishing] || r.finishing));
  if (r.floor) extra.push(w.floor + ': ' + r.floor);
  const text = [r.details || '', extra.join('. ')].filter(Boolean).join('\n\n');
  const both = (en, arText) => ({ en, ar: arText });
  const unit = {
    title: both(label(Lists.pairs(Lists.read().types), r.type, 'en') + ' ' + num(r.area_m2) + ' m² - ' + where, label(Lists.pairs(Lists.read().types), r.type, 'ar') + ' ' + num(r.area_m2) + ' م² - ' + where),
    projectId: project ? project.crmId : '', project: project ? both('', '') : both(r.project_name || '', r.project_name || ''),
    region: city && city.region ? city.region : '', type: r.type, purpose: r.purpose, location: both(r.area_name || r.city_name || '', r.area_name || r.city_name || ''),
    agent: r.agent_id || '', price: r.valuation ? null : r.price, currency: r.currency || 'EGP', beds: r.beds, baths: r.baths, area: r.area_m2,
    description: ar ? both('', text) : both(text, ''), images
  };
  return { unit, requestId: id, photos: images.length };
}

async function item(req, res, id, sub, subId, s, url) {
  const r = q.one.get(id); if (!r) throw err(404, 'not found');
  const who = s.email;
  if (sub === 'files' && subId && req.method === 'GET') { const f = q.file.get(subId, id); if (!f) throw err(404, 'not found'); return sendFile(res, f, url.searchParams.get('download') !== '1'); }
  if (sub === 'prepare-unit' && req.method === 'POST') { const o = prepareUnit(id); event(id, 'prepare', who, { text: 'photos ' + o.photos }); return json(res, 200, o); }
  if (sub === 'link-unit' && req.method === 'POST') {
    const b = await readJson(req, 2048), unitId = clean(b.unit, 64);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(unitId) || !store.getDoc('properties', unitId)) throw err(422, 'unknown unit');
    q.setUnit.run(unitId, Date.now(), id); event(id, 'unit', who, { text: unitId });
    if (b.publish === true && !['published', 'sold'].includes(r.status)) { q.setStatus.run('published', Date.now(), id); event(id, 'status', who, { from: r.status, to: 'published', public: true }); }
    return json(res, 200, detail(id));
  }
  if (sub === 'notify' && req.method === 'POST') { const state = await notifyTeam(id); return json(res, 200, { state }); }
  if (sub) throw err(404, 'not found');
  if (req.method === 'GET') return json(res, 200, detail(id));
  if (req.method === 'PATCH') {
    const b = await readJson(req, 16 * 1024), now = Date.now();
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) throw err(400, 'bad status');
      if (b.status !== r.status) { q.setStatus.run(b.status, now, id); event(id, 'status', who, { from: r.status, to: b.status, public: true }); }
    }
    if (b.agent !== undefined) {
      const a = clean(b.agent, 64);
      if (a && !store.getDoc('agents', a)) throw err(422, 'unknown agent');
      if (a !== (r.agent_id || '')) { q.setAgent.run(a || null, now, id); event(id, 'assign', who, { text: a }); }
    }
    if (b.clientNote !== undefined) {
      const t = clean(b.clientNote, 600);
      if (t !== (r.client_note || '')) { q.setClientNote.run(t, now, id); if (t) event(id, 'client_note', who, { text: t, public: true }); }
    }
    if (b.note !== undefined) { const t = clean(b.note, 1000); if (t) { event(id, 'note', who, { text: t }); q.touch.run(now, id); } }
    return json(res, 200, detail(id));
  }
  if (req.method === 'DELETE') {
    if (s.role !== 'admin') throw err(403, 'Your account cannot do this');
    q.files.all(id).forEach((f) => { if (isFileId(f.id)) fs.rm(path.join(dir, f.id), () => {}); });
    q.delFiles.run(id); q.delEvents.run(id); q.del.run(id);
    res.writeHead(204, { 'Cache-Control': 'no-store' }); return res.end();
  }
  throw err(405, 'method');
}

module.exports = { create, addFile, item, list, csv, track, isToken, refOf, STATUSES, STEPS, STEP_OF, FINISHING, WHO, CURRENCIES, MAX_PHOTOS, MAX_PHOTO, MAX_DOC, catalogLists, trackPath, W };
