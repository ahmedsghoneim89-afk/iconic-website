'use strict';
/* Strict shapes for everything the dashboard can store. Unknown fields are dropped, wrong types are refused. */
const I = require('./i18n.json');
const REGION_IDS = I.regions.map((r) => r.id), TYPE_IDS = I.types.map((x) => x[0]), PURPOSE_IDS = I.purposes.map((x) => x[0]), JOB_TYPE_IDS = I.jobTypes.map((x) => x[0]);
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
const flag = (v) => v === true;
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

/* editable drop-down lists: every choice has a lasting id, a name in each language and a switch that hides it from new use */
const LIST_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const listItem = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) fail('list item expected');
  const id = S(40)(v.id).toLowerCase(), en = S(60)(v.en), ar = S(60)(v.ar);
  if (!LIST_ID.test(id)) fail('bad list id'); if (!en && !ar) fail('name required');
  return { id, en, ar, active: v.active !== false };
};
const listOf = (v) => {
  const items = arr(listItem, 60)(v), seen = new Set();
  items.forEach((x) => { if (seen.has(x.id)) fail('duplicate id'); seen.add(x.id); });
  if (!items.some((x) => x.active)) fail('keep at least one visible choice');
  return items;
};
const SITE = {
  lists: obj({ types: listOf, purposes: listOf }),
  company: obj({ whatsapp: S(30), phone: S(30), email, address: bi(500), hours: bi(500), social: obj(Object.fromEntries(SOCIALS.map((k) => [k, httpsUrl(300)]))) }),
  texts: obj({ en: textsLang('en'), ar: textsLang('ar') }),
  hotspots,
  about: obj({ pillars: arr((p) => { const o = bi(120)(p); return (o.en || o.ar) ? o : null; }, 12) }),
  layout: obj({ teams: bool, about: bool }),
  regions
};
const isoDate = (v) => { const s = S(10)(v); if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) fail('date expected'); return s; };
const hasText = (b) => !!(b && (b.en || b.ar));
const COLLECTIONS = {
  branches: (v) => {
    const o = obj({ name: bi(120), city: bi(80), address: bi(400), phone: S(30), whatsapp: S(30), hours: bi(200), map: httpsUrl(500), order: num(-9999, 9999) })(v);
    if (!hasText(o.name) && !hasText(o.address)) fail('name or address required'); return o;
  },
  jobs: (v) => {
    const o = obj({ title: bi(140), department: bi(100), location: bi(160), type: oneOf(JOB_TYPE_IDS, true), description: bi(6000), requirements: bi(4000), active: bool, closes: isoDate, order: num(-9999, 9999) })(v);
    if (!hasText(o.title)) fail('title required'); if (!o.type) o.type = 'full'; if (o.active === undefined) o.active = true; return o;
  },
  teams: (v) => {
    /* a team can serve several regions: `regions` is the list; `region` (first of them) is kept for older readers */
    const o = obj({ regions: arr(oneOf(REGION_IDS), REGION_IDS.length), region: oneOf(REGION_IDS, true), name: bi(120), order: num(-9999, 9999) })(v);
    const set = new Set(o.regions || []); if (!set.size && o.region) set.add(o.region);
    if (!set.size) fail('region required');
    o.regions = REGION_IDS.filter((r) => set.has(r)); o.region = o.regions[0];
    if (!(o.name && (o.name.en || o.name.ar))) fail('name required'); return o;
  },
  agents: (v) => { const o = obj({ team: S(80), name: bi(120), role: bi(120), manager: flag, photo: img, whatsapp: S(30), phone: S(30), email, order: num(-9999, 9999) })(v); if (!o.team) fail('team required'); if (!(o.name && (o.name.en || o.name.ar))) fail('name required'); return o; },
  properties: (v) => {
    const o = obj({ title: bi(160), project: bi(160), projectId: oid, location: bi(200), description: bi(4000), seoTitle: bi(120), seoDescription: bi(320), region: oneOf(REGION_IDS), type: oneOf(require('./lists').ids('types')), purpose: oneOf(require('./lists').ids('purposes')), agent: S(80), price: num(0, 1e12), currency: oneOf(CURRENCIES, true), beds: num(0, 99), baths: num(0, 99), area: num(0, 1e6), images: arr(img, 30), order: num(-9999, 9999) })(v);
    if (!(o.title && (o.title.en || o.title.ar))) fail('title required'); if (!o.region || !o.type || !o.purpose) fail('region, type and purpose required'); return o;
  }
};

/* ICONIC CRM catalog. Names and relationships belong to the CRM and change only through the catalog link; the generic endpoint refuses writes. */
const CRM_ID = /^[a-f0-9]{24}$/;
function oid(v) { const s = S(40)(v); if (s && !CRM_ID.test(s)) fail('bad CRM id'); return s; }
const seo = { seoTitle: bi(120), seoDescription: bi(320), order: num(-9999, 9999) };
/* what this site owns for each kind of record */
const CATALOG_SITE = {
  developer: obj(Object.assign({ description: bi(4000), logo: img }, seo)),
  project: obj(Object.assign({ description: bi(4000), images: arr(img, 30) }, seo)),
  city: obj(Object.assign({ region: oneOf(REGION_IDS, true), description: bi(4000) }, seo)),
  area: obj(Object.assign({ description: bi(4000), images: arr(img, 12) }, seo))
};
/* what the CRM owns, as this site may ask for it to be changed */
const name120 = (v) => { const s = S(120)(v); if (!s) fail('name required'); return s; };
const CATALOG_CRM = {
  developer: obj({ name: name120 }),
  city: obj({ name: name120 }),
  area: obj({ name: name120, cityId: oid }),
  project: obj({ name: name120, active: bool, developerId: oid, cityId: oid, areaId: oid })
};
const CATALOG_COLLECTIONS = { developers: 'developer', projects: 'project', cities: 'city', areas: 'area' };
const readOnly = () => fail('Edit this record from the catalog screen');
COLLECTIONS.developers = readOnly; COLLECTIONS.projects = readOnly; COLLECTIONS.cities = readOnly; COLLECTIONS.areas = readOnly;

const ID = /^[A-Za-z0-9_-]{1,64}$/;
function validate(col, id, data) {
  if (!ID.test(id)) fail('bad id');
  if (col === 'site') { if (!SITE[id]) { const e = new Error('unknown document'); e.status = 404; throw e; } return SITE[id](data); }
  if (!COLLECTIONS[col]) { const e = new Error('unknown collection'); e.status = 404; throw e; }
  return COLLECTIONS[col](data);
}
const readable = (col, id) => (col === 'site' ? (id == null || !!SITE[id]) : !!COLLECTIONS[col]);

module.exports = { validate, readable, fail, CRM_ID, CATALOG_SITE, CATALOG_CRM, CATALOG_COLLECTIONS, REGION_IDS, TYPE_IDS, PURPOSE_IDS, JOB_TYPE_IDS, CURRENCIES, SOCIALS, S, ID };
