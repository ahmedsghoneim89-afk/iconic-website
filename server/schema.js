'use strict';
/* Strict shapes for everything the dashboard can store. Unknown fields are dropped, wrong types are refused. */
const I = require('./i18n.json');
const REGION_IDS = I.regions.map((r) => r.id), TYPE_IDS = I.types.map((x) => x[0]), PURPOSE_IDS = I.purposes.map((x) => x[0]);
const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const SOCIALS = ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'x'];
const fail = (m) => { const e = new Error(m); e.status = 400; throw e; };

const S = (max = 200) => (v) => {
  const s = (typeof v === 'string' ? v : v == null ? '' : typeof v === 'number' ? String(v) : fail('text expected')).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (s.length > max) fail('text too long'); return s;
};
const bi = (max) => (v) => {
  if (v == null || v === '') return { en: '', ar: '' };
  if (typeof v === 'string') return { en: S(max)(v), ar: '' };
  if (typeof v !== 'object' || Array.isArray(v)) fail('bilingual text expected');
  return { en: S(max)(v.en), ar: S(max)(v.ar) };
};
const num = (min, max) => (v) => {
  if (v === '' || v == null) return null;
  const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) fail('number out of range'); return n;
};
const httpsUrl = (max = 500) => (v) => { const s = S(max)(v); if (s && !/^https:\/\/[^\s<>"']+$/i.test(s)) fail('https link expected'); return s; };
const oneOf = (list, blank) => (v) => { const s = S(80)(v); if (!s && blank) return ''; if (!list.includes(s)) fail('unknown option'); return s; };
const bool = (v) => v !== false;
const email = (v) => { const s = S(120)(v); if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) fail('email expected'); return s; };
const img = (v) => {
  if (v == null || v === '') return null;
  if (typeof v !== 'object') fail('image expected');
  if (v.id != null) { if (!/^[a-f0-9]{24}$/.test(String(v.id))) fail('bad image id'); return { id: String(v.id) }; }
  if (v.url != null) { const u = httpsUrl(500)(v.url); return u ? { url: u } : null; }
  return null;
};
const arr = (item, max) => (v) => { if (v == null) return []; if (!Array.isArray(v)) fail('list expected'); if (v.length > max) fail('too many items'); return v.map(item).filter((x) => x != null); };
const obj = (shape) => (v) => {
  if (v == null) v = {}; if (typeof v !== 'object' || Array.isArray(v)) fail('object expected');
  const out = {}; for (const k of Object.keys(shape)) if (v[k] !== undefined) out[k] = shape[k](v[k]); return out;
};
const link = (v) => { const s = S(300)(v); if (s && !/^#[\w-]+$/.test(s) && !/^https:\/\/[^\s<>"']+$/i.test(s)) fail('link must be #section or https'); return s; };

const textsLang = (lang) => (v) => {
  const out = {}; if (v == null) return out; if (typeof v !== 'object' || Array.isArray(v)) fail('texts expected');
  for (const k of Object.keys(v)) { if (!Object.prototype.hasOwnProperty.call(I.i18n[lang], k)) continue; const s = S(1200)(v[k]); if (s) out[k] = s; }
  return out;
};
const hotspots = (v) => {
  const out = {}; if (v == null) return out; if (typeof v !== 'object') fail('object expected');
  for (const k of Object.keys(v)) if (/^[1-9]$/.test(k)) { const o = obj({ label: bi(80), text: bi(400), href: link })(v[k]); if ((o.label && (o.label.en || o.label.ar)) || (o.text && (o.text.en || o.text.ar)) || o.href) out[k] = o; }
  return out;
};
const regions = (v) => {
  const out = {}; if (v == null) return out; if (typeof v !== 'object') fail('object expected');
  for (const k of Object.keys(v)) if (REGION_IDS.includes(k)) out[k] = obj({ title: bi(120), description: bi(320), intro: bi(2500) })(v[k]);
  return out;
};

const SITE = {
  company: obj({ whatsapp: S(30), phone: S(30), email, address: bi(500), hours: bi(500), social: obj(Object.fromEntries(SOCIALS.map((k) => [k, httpsUrl(300)]))) }),
  texts: obj({ en: textsLang('en'), ar: textsLang('ar') }),
  hotspots,
  about: obj({ pillars: arr((p) => { const o = bi(120)(p); return (o.en || o.ar) ? o : null; }, 12) }),
  layout: obj({ teams: bool, about: bool }),
  regions
};
const COLLECTIONS = {
  teams: (v) => { const o = obj({ region: oneOf(REGION_IDS), name: bi(120), order: num(-9999, 9999) })(v); if (!o.region) fail('region required'); if (!(o.name && (o.name.en || o.name.ar))) fail('name required'); return o; },
  agents: (v) => { const o = obj({ team: S(80), name: bi(120), role: bi(120), photo: img, whatsapp: S(30), phone: S(30), email, order: num(-9999, 9999) })(v); if (!o.team) fail('team required'); if (!(o.name && (o.name.en || o.name.ar))) fail('name required'); return o; },
  properties: (v) => {
    const o = obj({ title: bi(160), project: bi(160), location: bi(200), description: bi(4000), seoTitle: bi(120), seoDescription: bi(320), region: oneOf(REGION_IDS), type: oneOf(TYPE_IDS), purpose: oneOf(PURPOSE_IDS), agent: S(80), price: num(0, 1e12), currency: oneOf(CURRENCIES, true), beds: num(0, 99), baths: num(0, 99), area: num(0, 1e6), images: arr(img, 30), order: num(-9999, 9999) })(v);
    if (!(o.title && (o.title.en || o.title.ar))) fail('title required'); if (!o.region || !o.type || !o.purpose) fail('region, type and purpose required'); return o;
  }
};

const ID = /^[A-Za-z0-9_-]{1,64}$/;
function validate(col, id, data) {
  if (!ID.test(id)) fail('bad id');
  if (col === 'site') { if (!SITE[id]) { const e = new Error('unknown document'); e.status = 404; throw e; } return SITE[id](data); }
  if (!COLLECTIONS[col]) { const e = new Error('unknown collection'); e.status = 404; throw e; }
  return COLLECTIONS[col](data);
}
const readable = (col, id) => (col === 'site' ? (id == null || !!SITE[id]) : !!COLLECTIONS[col]);

module.exports = { validate, readable, fail, REGION_IDS, TYPE_IDS, PURPOSE_IDS, CURRENCIES, SOCIALS, S, ID };
