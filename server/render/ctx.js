'use strict';
/* One request's view of the content: translated text, formatted values and tidy copies of every record, in one language. */
const I = require('../i18n.json');
const cfg = require('../config');

const REGIONS = I.regions, TYPES = I.types, PURPOSES = I.purposes, JOB_TYPES = I.jobTypes;
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const cut = s.slice(0, n - 1); return cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)).replace(/[,.;:،\-–—\s]+$/, '') + '…'; };

function make(lang, snap) {
  const raw = snap.raw;
  const texts = Object.assign({}, I.i18n[lang]);
  const own = (raw.texts && raw.texts[lang]) || {};
  for (const k of Object.keys(own)) if (Object.prototype.hasOwnProperty.call(I.i18n[lang], k) && typeof own[k] === 'string' && own[k].trim()) texts[k] = own[k];
  const t = (key, vars) => { let s = texts[key] || I.i18n.en[key] || key; if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]); return s; };
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US'), pr = new Intl.PluralRules(lang === 'ar' ? 'ar' : 'en');
  const fmtNum = (n) => nf.format(n);
  const plural = (base, n) => { const cat = pr.select(n); return t(texts[base + '.' + cat] ? base + '.' + cat : base + '.other', { n: fmtNum(n) }); };
  const L = (v) => (v && typeof v === 'object') ? (v[lang] || v.en || v.ar || '') : (v == null ? '' : String(v));
  const regionName = (id) => { const r = REGIONS.find((x) => x.id === id); return r ? r[lang] : ''; };
  const keyLabel = (list, k) => { const f = list.find((x) => x[0] === k); return f ? f[1][lang] : (k || ''); };
  const typeLabel = (k) => keyLabel(TYPES, k), purposeLabel = (k) => keyLabel(PURPOSES, k), jobTypeLabel = (k) => keyLabel(JOB_TYPES, k);
  const priceText = (p) => {
    if (p.price == null) return t('prop.price.none');
    try { return p.currency ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: p.currency, maximumFractionDigits: 0 }).format(p.price) : fmtNum(p.price); } catch (_) { return fmtNum(p.price); }
  };
  const imgPath = (r) => r ? (r.id ? '/_blob/' + r.id : (r.url || '')) : '';
  const abs = (u) => (/^https?:\/\//.test(u) ? u : cfg.siteUrl + u);

  const co = raw.company || {};
  const company = { whatsapp: co.whatsapp || '', phone: co.phone || '', email: co.email || '', address: L(co.address), hours: L(co.hours), social: co.social || {} };
  const layout = { teams: !(raw.layout && raw.layout.teams === false), about: !(raw.layout && raw.layout.about === false) };
  const regionSeo = (id) => { const r = (raw.regions && raw.regions[id]) || {}; return { title: L(r.title), description: L(r.description), intro: L(r.intro) }; };

  const agents = raw.agents.map((a) => ({ id: a.id, team: a.team, name: L(a.name), role: L(a.role), photo: imgPath(a.photo), phone: a.phone || '', whatsapp: a.whatsapp || '', email: a.email || '' }));
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const teams = raw.teams.map((x) => ({ id: x.id, region: x.region, name: L(x.name) }));
  const regionRank = (id) => { const i = REGIONS.findIndex((r) => r.id === id); return i < 0 ? 99 : i; };
  const props = raw.properties.map((p) => {
    const area = p.area != null && p.area !== '' ? Number(p.area) : null;
    return {
      id: p.id, slug: p.slug || '', url: '/' + lang + '/property/' + p.slug, region: p.region, type: p.type, purpose: p.purpose, agent: p.agent || null,
      price: p.price == null ? null : Number(p.price), currency: p.currency || 'EGP', beds: p.beds == null ? null : Number(p.beds), baths: p.baths == null ? null : Number(p.baths),
      areaNum: area, area: area ? fmtNum(area) + ' ' + t('unit.sqm') : '',
      title: L(p.title), project: L(p.project), location: L(p.location), description: L(p.description), seoTitle: L(p.seoTitle), seoDescription: L(p.seoDescription),
      images: (p.images || []).map(imgPath).filter(Boolean), updatedAt: p._u || 0
    };
  }).filter((p) => p.slug);

  const branches = (raw.branches || []).map((b) => ({ id: b.id, name: L(b.name), city: L(b.city), address: L(b.address), phone: b.phone || '', whatsapp: b.whatsapp || '', hours: L(b.hours), map: /^https:\/\/\S+$/i.test(b.map || '') ? b.map : '' })).filter((b) => b.name || b.address);
  const today = new Date().toISOString().slice(0, 10);
  const jobs = (raw.jobs || []).filter((j) => j.active !== false && j.slug && !(j.closes && j.closes < today)).map((j) => ({
    id: j.id, slug: j.slug, url: '/' + lang + '/careers/' + j.slug, title: L(j.title), department: L(j.department), location: L(j.location), type: j.type || 'full', typeLabel: jobTypeLabel(j.type || 'full'),
    description: L(j.description), requirements: L(j.requirements), posted: j.posted || '', closes: j.closes || '', updatedAt: j._u || 0
  })).filter((j) => j.title);
  return { lang, dir: lang === 'ar' ? 'rtl' : 'ltr', raw, texts, t, fmtNum, plural, L, regionName, typeLabel, purposeLabel, jobTypeLabel, priceText, imgPath, abs, company, layout, regionSeo, agents, agentById, teams, regionRank, props, branches, jobs, today, REGIONS, TYPES, PURPOSES, clip, brand: cfg.brand, updated: snap.updated };
}

const waNumber = (v) => { let n = String(v || '').replace(/\D/g, ''); if (/^01\d{9}$/.test(n)) n = '20' + n.slice(1); return n; };
module.exports = { make, waNumber, clip, REGIONS };
