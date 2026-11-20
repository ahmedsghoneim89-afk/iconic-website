'use strict';
/* Email notifications for the team: new enquiries, "sell your unit" requests and job applications.
   The company's own mailbox is set up from the dashboard (admin only). The password is sealed with a key kept next to the database, never sent back
   to the browser and never written to a log. The SMTP client below is small and has no dependencies. */
const net = require('node:net'), tls = require('node:tls'), dns = require('node:dns').promises, crypto = require('node:crypto');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');
const { esc, httpError } = require('./util');

const EMAIL = /^[^\s@<>()",;:\\]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
const HOST = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const PORTS = [25, 465, 587, 2525];
const SECURITY = ['ssl', 'starttls', 'none'];
const EVENTS = ['leads', 'sell', 'applications'];
const DEFAULTS = { enabled: false, host: '', port: 465, security: 'ssl', user: '', pass: '', fromName: '', fromEmail: '', replyTo: '', recipients: [], events: { leads: true, sell: true, applications: true }, lang: 'ar' };

/* ---------- settings ---------- */
const keyBytes = () => crypto.createHmac('sha256', auth.getSecret()).update('email-password-v1').digest();
function seal(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv), enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return 'v1:' + [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join(':');
}
function unseal(s) {
  try {
    const [v, iv, tag, enc] = String(s || '').split(':'); if (v !== 'v1') return '';
    const d = crypto.createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(iv, 'base64')); d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8');
  } catch (_) { return ''; }
}
function read() {
  const d = store.getDoc('private', 'email'), v = (d && d.data) || {};
  return Object.assign({}, DEFAULTS, v, { events: Object.assign({}, DEFAULTS.events, v.events || {}), recipients: Array.isArray(v.recipients) ? v.recipients : [] });
}
/* what the dashboard may see: everything except the password */
function view() {
  const s = read(), out = Object.assign({}, s, { passwordSet: !!s.pass, status: Object.assign({}, status) }); delete out.pass; return out;
}
const flat = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
function clean(body, prev) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const out = { enabled: b.enabled === true, host: flat(b.host, 253).toLowerCase(), port: Math.trunc(Number(b.port)), security: flat(b.security, 10), user: flat(b.user, 200), fromName: flat(b.fromName, 80), fromEmail: flat(b.fromEmail, 160).toLowerCase(), replyTo: flat(b.replyTo, 160).toLowerCase(), lang: b.lang === 'en' ? 'en' : 'ar' };
  if (out.host && !HOST.test(out.host)) throw httpError(422, 'host');
  if (!SECURITY.includes(out.security)) throw httpError(422, 'security');
  if (!(out.port >= 1 && out.port <= 65535) || (!cfg.smtpAllowPrivate && !PORTS.includes(out.port))) throw httpError(422, 'port');
  if (out.fromEmail && !EMAIL.test(out.fromEmail)) throw httpError(422, 'from');
  if (out.replyTo && !EMAIL.test(out.replyTo)) throw httpError(422, 'replyTo');
  const list = Array.isArray(b.recipients) ? b.recipients : String(b.recipients || '').split(/[\s,;]+/);
  const rec = []; for (const x of list) { const e = flat(x, 160).toLowerCase(); if (!e) continue; if (!EMAIL.test(e)) throw httpError(422, 'recipients'); if (!rec.includes(e)) rec.push(e); }
  if (rec.length > 10) throw httpError(422, 'recipients');
  out.recipients = rec;
  out.events = {}; EVENTS.forEach((k) => { out.events[k] = !(b.events && b.events[k] === false); });
  out.pass = typeof b.password === 'string' && b.password ? seal(b.password.slice(0, 300)) : (b.clearPassword === true ? '' : (prev.pass || ''));
  if (out.enabled) {
    if (!out.host) throw httpError(422, 'host'); if (!out.fromEmail) throw httpError(422, 'from'); if (!out.recipients.length) throw httpError(422, 'recipients');
    if (out.user && !out.pass) throw httpError(422, 'password');
  }
  return out;
}
function save(body) {
  const next = clean(body, read());
  store.putDoc('private', 'email', next);
  return view();
}

/* ---------- the message ---------- */
const crlf = (s) => String(s).replace(/\r?\n/g, '\r\n');
const b64lines = (buf) => buf.toString('base64').replace(/(.{76})/g, '$1\r\n');
const hdr = (v) => String(v).replace(/[\r\n]+/g, ' ');
/* RFC 2047 encoded words, split on character boundaries so no letter is cut in half */
function encodeWord(text) {
  const s = hdr(text); if (/^[\x20-\x7E]*$/.test(s)) return s;
  const parts = []; let cur = '';
  for (const ch of s) { if (Buffer.byteLength(cur + ch) > 42) { parts.push(cur); cur = ''; } cur += ch; }
  if (cur) parts.push(cur);
  return parts.map((p) => '=?UTF-8?B?' + Buffer.from(p, 'utf8').toString('base64') + '?=').join('\r\n ');
}
function build(m) {
  const id = '<' + crypto.randomBytes(12).toString('hex') + '@' + (m.domain || 'localhost') + '>', boundary = '=_' + crypto.randomBytes(12).toString('hex');
  const from = m.fromName ? encodeWord(m.fromName) + ' <' + m.from + '>' : m.from;
  const head = ['From: ' + from, 'To: ' + m.to.join(', '), m.replyTo ? 'Reply-To: ' + m.replyTo : null, 'Subject: ' + encodeWord(m.subject), 'Date: ' + new Date().toUTCString(), 'Message-ID: ' + id, 'MIME-Version: 1.0', 'Auto-Submitted: auto-generated', 'Content-Type: multipart/alternative; boundary="' + boundary + '"'].filter(Boolean);
  const part = (type, body) => '--' + boundary + '\r\nContent-Type: ' + type + '; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n' + b64lines(Buffer.from(body, 'utf8')) + '\r\n';
  return head.join('\r\n') + '\r\n\r\n' + part('text/plain', crlf(m.text)) + part('text/html', crlf(m.html)) + '--' + boundary + '--\r\n';
}

/* ---------- SMTP ---------- */
class SmtpError extends Error { constructor(code, message) { super(message || code); this.code = code; } }
const isPrivate = (ip) => {
  if (net.isIPv6(ip)) { const l = ip.toLowerCase(); return l === '::1' || l === '::' || l.startsWith('fe80') || l.startsWith('fc') || l.startsWith('fd') || (l.startsWith('::ffff:') && isPrivate(l.slice(7))); }
  const p = ip.split('.').map(Number); if (p.length !== 4 || p.some((x) => !(x >= 0 && x <= 255))) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
};
const TIMEOUT = 20000;
function reader(sock) {
  let buf = '', waiter = null, failure = null;
  const take = () => {
    const lines = buf.split('\r\n'); if (lines.length < 2) return null;
    const got = []; let used = 0;
    for (let i = 0; i < lines.length - 1; i++) { got.push(lines[i]); used += lines[i].length + 2; if (/^\d{3}( |$)/.test(lines[i])) { buf = buf.slice(used); return { code: Number(lines[i].slice(0, 3)), text: got.map((l) => l.slice(4)).join('\n') }; } }
    return null;
  };
  const pump = () => { if (!waiter) return; if (failure) { const w = waiter; waiter = null; return w.reject(failure); } const r = take(); if (r) { const w = waiter; waiter = null; w.resolve(r); } };
  const onData = (d) => { buf += d.toString('latin1'); pump(); };
  const onFail = (e) => { failure = failure || e; pump(); };
  sock.on('data', onData);
  sock.on('error', (e) => onFail(new SmtpError(e && /CERT|SSL|TLS|self.signed|altname|certificate/i.test((e.code || '') + (e.message || '')) ? 'tls' : 'connect', e && e.code)));
  sock.on('timeout', () => { onFail(new SmtpError('timeout')); sock.destroy(); });
  sock.on('close', () => onFail(new SmtpError('connect', 'closed')));
  return { next: () => new Promise((resolve, reject) => { waiter = { resolve, reject }; pump(); }), detach: () => { sock.off('data', onData); } };
}
const connectTo = (o, ip) => new Promise((resolve, reject) => {
  const done = (s) => { s.setTimeout(TIMEOUT); resolve(s); };
  const fail = (e) => reject(new SmtpError(e && /CERT|SSL|TLS|self.signed|altname|certificate/i.test((e.code || '') + (e.message || '')) ? 'tls' : 'connect', e && e.code));
  const s = o.security === 'ssl' ? tls.connect({ host: ip, port: o.port, servername: o.host }, () => done(s)) : net.connect({ host: ip, port: o.port }, () => done(s));
  s.once('error', fail); s.setTimeout(TIMEOUT, () => { s.destroy(); reject(new SmtpError('timeout')); });
});
const upgrade = (sock, o) => new Promise((resolve, reject) => {
  const s = tls.connect({ socket: sock, servername: o.host }, () => { s.setTimeout(TIMEOUT); resolve(s); });
  s.once('error', (e) => reject(new SmtpError('tls', e && e.code)));
});
const failFor = (r, stage) => {
  if ([530, 534, 535, 538, 454].includes(r.code) || stage === 'auth') return new SmtpError('auth', r.text);
  if (stage === 'from') return new SmtpError('sender', r.text);
  return new SmtpError(r.code >= 500 ? 'rejected' : 'temporary', r.text);
};
async function transmit(o, msg) {
  const addrs = await dns.lookup(o.host, { all: true }).catch(() => { throw new SmtpError('dns'); });
  if (!addrs.length) throw new SmtpError('dns');
  if (!cfg.smtpAllowPrivate && addrs.some((a) => isPrivate(a.address))) throw new SmtpError('blocked');
  let sock = await connectTo(o, addrs[0].address), rd = reader(sock);
  const say = async (line, ok, stage) => { sock.write(line + '\r\n'); const r = await rd.next(); if (!ok.includes(r.code)) throw failFor(r, stage); return r; };
  try {
    const hello = await rd.next(); if (hello.code !== 220) throw failFor(hello, 'hello');
    const name = (() => { try { return new URL(cfg.siteUrl).hostname || 'localhost'; } catch (_) { return 'localhost'; } })();
    let caps = await say('EHLO ' + name, [250], 'hello');
    if (o.security === 'starttls') {
      if (!/STARTTLS/i.test(caps.text)) throw new SmtpError('tls', 'no STARTTLS');
      await say('STARTTLS', [220], 'tls'); rd.detach(); sock = await upgrade(sock, o); rd = reader(sock);
      caps = await say('EHLO ' + name, [250], 'hello');
    }
    if (o.user) {
      const pass = o.pass || '';
      if (/AUTH[^\n]*PLAIN/i.test(caps.text)) await say('AUTH PLAIN ' + Buffer.from('\0' + o.user + '\0' + pass).toString('base64'), [235], 'auth');
      else { await say('AUTH LOGIN', [334], 'auth'); await say(Buffer.from(o.user).toString('base64'), [334], 'auth'); await say(Buffer.from(pass).toString('base64'), [235], 'auth'); }
    }
    await say('MAIL FROM:<' + msg.from + '>', [250], 'from');
    let accepted = 0;
    for (const to of msg.to) { sock.write('RCPT TO:<' + to + '>\r\n'); const r = await rd.next(); if ([250, 251].includes(r.code)) accepted++; }
    if (!accepted) throw new SmtpError('recipient');
    await say('DATA', [354], 'data');
    sock.write(build(msg).replace(/^\./gm, '..') + '\r\n.\r\n');
    const end = await rd.next(); if (end.code !== 250) throw failFor(end, 'data');
    try { sock.write('QUIT\r\n'); } catch (_) { /* gone already */ }
    return { accepted };
  } finally { try { sock.end(); } catch (_) { /* closed */ } setTimeout(() => { try { sock.destroy(); } catch (_) { /* closed */ } }, 1500).unref(); }
}

/* ---------- the notices ---------- */
const status = { lastOk: 0, lastError: '', lastErrorAt: 0, sent: 0, failed: 0 };
const W = {
  ar: { dir: 'rtl', open: 'افتح لوحة التحكم', foot: 'رسالة تلقائية من موقع', name: 'الاسم', phone: 'الهاتف', email: 'البريد', message: 'الرسالة', unit: 'الوحدة', page: 'الصفحة', agent: 'المسؤول', job: 'الوظيفة', cv: 'السيرة الذاتية', cvYes: 'مرفقة في لوحة التحكم', when: 'الوقت', ref: 'المرجع',
    lead: 'استفسار جديد من {name}', viewing: 'طلب معاينة جديد من {name}', sell: 'طلب بيع وحدة جديد {ref}', app: 'طلب توظيف جديد: {job}', test: 'رسالة تجريبية', testBody: 'وصلت هذه الرسالة، يعني إعدادات البريد سليمة. ستصلك إشعارات الاستفسارات وطلبات بيع الوحدات وطلبات التوظيف على هذا العنوان.' },
  en: { dir: 'ltr', open: 'Open the dashboard', foot: 'Automatic message from', name: 'Name', phone: 'Phone', email: 'Email', message: 'Message', unit: 'Unit', page: 'Page', agent: 'Agent', job: 'Job', cv: 'CV', cvYes: 'attached in the dashboard', when: 'Time', ref: 'Reference',
    lead: 'New enquiry from {name}', viewing: 'New viewing request from {name}', sell: 'New sell request {ref}', app: 'New job application: {job}', test: 'Test message', testBody: 'This message arrived, so the email settings work. Enquiries, sell requests and job applications will be sent to this address.' }
};
const fill = (s, v) => { for (const k in v) s = s.split('{' + k + '}').join(v[k]); return s; };
function shell(lang, title, rows, o) {
  const w = W[lang] || W.ar, link = cfg.siteUrl + '/admin';
  const tr = rows.filter((r) => r[1]).map(([k, v, kind]) => {
    const val = kind === 'tel' ? `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ''))}" style="color:#7a5d1c;text-decoration:none">${esc(v)}</a>` : kind === 'mail' ? `<a href="mailto:${esc(v)}" style="color:#7a5d1c;text-decoration:none">${esc(v)}</a>` : esc(v).replace(/\n/g, '<br>');
    return `<tr><td style="padding:9px 14px;color:#7c7667;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee9db">${esc(k)}</td><td style="padding:9px 14px;font-size:15px;line-height:1.55;color:#161412;border-bottom:1px solid #eee9db">${val}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html lang="${lang}" dir="${w.dir}"><body style="margin:0;padding:24px 12px;background:#f4f1ea;font-family:Tahoma,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;direction:${w.dir}">
<tr><td style="background:#0b0b0d;padding:18px 22px;color:#c8a96a;font-size:18px;letter-spacing:.04em">${esc(cfg.brand)}</td></tr>
<tr><td style="padding:22px 22px 8px;font-size:20px;line-height:1.4;color:#161412;text-align:${lang === 'ar' ? 'right' : 'left'}">${esc(title)}</td></tr>
<tr><td style="padding:0 8px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:${lang === 'ar' ? 'right' : 'left'}">${tr}</table></td></tr>
${o && o.note ? `<tr><td style="padding:10px 22px;font-size:15px;line-height:1.6;color:#161412">${esc(o.note)}</td></tr>` : ''}
<tr><td style="padding:16px 22px 24px"><a href="${esc(link)}" style="display:inline-block;background:#c8a96a;color:#0b0b0d;text-decoration:none;padding:11px 20px;border-radius:3px;font-size:15px">${esc(w.open)}</a></td></tr>
<tr><td style="padding:12px 22px;background:#f4f1ea;color:#8a8372;font-size:12px">${esc(w.foot)} ${esc(cfg.siteUrl.replace(/^https?:\/\//, ''))}</td></tr></table></body></html>`;
  const text = [title, '', ...rows.filter((r) => r[1]).map(([k, v]) => k + ': ' + v), '', w.open + ': ' + link].join('\n');
  return { html, text };
}
function compose(kind, d, lang) {
  const w = W[lang] || W.ar, when = d.created ? new Date(d.created).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '';
  if (kind === 'lead') {
    const title = fill(d.interest === 'viewing' ? w.viewing : w.lead, { name: d.name });
    return Object.assign({ subject: title }, shell(lang, title, [[w.name, d.name], [w.phone, d.phone, 'tel'], [w.email, d.email, 'mail'], [w.message, d.message], [w.unit, d.propertyTitle || d.property], [w.agent, d.agentName || d.agent], [w.page, d.page], [w.when, when]]));
  }
  if (kind === 'sell') {
    const title = fill(w.sell, { ref: d.ref });
    return Object.assign({ subject: title }, shell(lang, title, [[w.ref, d.ref]].concat(typeof d.rows === 'function' ? d.rows(lang) : (d.rows || [])).concat([[w.when, when]])));
  }
  if (kind === 'application') {
    const title = fill(w.app, { job: d.job || '' });
    return Object.assign({ subject: title }, shell(lang, title, [[w.job, d.job], [w.name, d.name], [w.phone, d.phone, 'tel'], [w.email, d.email, 'mail'], [w.message, d.message], [w.cv, d.hasCv ? w.cvYes : ''], [w.when, when]]));
  }
  return Object.assign({ subject: w.test }, shell(lang, w.test, [[w.when, new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC']], { note: w.testBody }));
}

/* ---------- sending ---------- */
const recent = []; const PER_HOUR = 60;
const reason = (e) => (e && e.code) || 'error';
async function deliver(s, kind, d, to) {
  const m = compose(kind, d, s.lang), domain = (() => { try { return new URL(cfg.siteUrl).hostname; } catch (_) { return 'localhost'; } })();
  await transmit({ host: s.host, port: s.port, security: s.security, user: s.user, pass: s.pass ? unseal(s.pass) : '' },
    { from: s.fromEmail, fromName: s.fromName || cfg.brand, replyTo: s.replyTo, to, subject: '[' + cfg.brand + '] ' + m.subject, text: m.text, html: m.html, domain });
}
/* tell the team; resolves to 'off', 'sent' or 'failed:<why>' and never throws, so a broken mailbox can never hurt a visitor */
async function notify(kind, d) {
  try {
    const s = read(), ev = { lead: 'leads', sell: 'sell', application: 'applications' }[kind];
    if (!s.enabled || !s.host || !s.fromEmail || !s.recipients.length || s.events[ev] === false) return 'off';
    const now = Date.now(); while (recent.length && recent[0] < now - 3600000) recent.shift();
    if (recent.length >= PER_HOUR) { status.failed++; status.lastError = 'throttled'; status.lastErrorAt = now; return 'failed:throttled'; }
    recent.push(now);
    let last = null;
    for (let i = 0; i < 2; i++) {
      try { await deliver(s, kind, d, s.recipients); status.sent++; status.lastOk = Date.now(); return 'sent'; }
      catch (e) { last = e; if (!['connect', 'timeout', 'temporary', 'dns'].includes(reason(e))) break; await new Promise((r) => setTimeout(r, 4000)); }
    }
    status.failed++; status.lastError = reason(last); status.lastErrorAt = Date.now();
    console.warn('[mail] could not send a ' + kind + ' notice:', reason(last));
    return 'failed:' + reason(last);
  } catch (e) { console.warn('[mail] notice failed:', e && e.message); return 'failed:error'; }
}
let lastTest = 0;
/* the dashboard's "send a test email": uses the saved settings, goes to the recipients (or to the person asking) */
async function test(toSelf) {
  const s = read(); if (Date.now() - lastTest < 4000) throw httpError(429, 'slow down'); lastTest = Date.now();
  if (!s.host || !s.fromEmail) return { ok: false, error: 'incomplete' };
  const to = s.recipients.length ? s.recipients : (EMAIL.test(toSelf || '') ? [toSelf] : []);
  if (!to.length) return { ok: false, error: 'recipients' };
  try { await deliver(s, 'test', {}, to); status.lastOk = Date.now(); status.sent++; return { ok: true, to }; }
  catch (e) { status.failed++; status.lastError = reason(e); status.lastErrorAt = Date.now(); return { ok: false, error: reason(e) }; }
}
module.exports = { view, save, notify, test, read, compose, EMAIL };
