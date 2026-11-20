'use strict';
/* One request's view of the content: translated text, formatted values and tidy copies of every record, in one language. */
const I = require('../i18n.json');
const cfg = require('../config');

const Lists = require('../lists');
const REGIONS = I.regions, JOB_TYPES = I.jobTypes;
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const cut = s.slice(0, n - 1); return cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)).replace(/[,.;:،\-–—\s]+$/, '') + '…'; };

function make(lang, snap) {
  const raw = snap.raw;
  /* the editable lists: TYPES and PURPOSES know every choice (for names and for reading shared links), the *Choices are what a visitor or editor is offered */
  const lst = Lists.normalize(raw.lists), TYPES = Lists.pairs(lst.types), PURPOSES = Lists.pairs(lst.purposes);
  const typeChoices = Lists.pairs(lst.types.filter((x) => x.active)), purposeChoices = Lists.pairs(lst.purposes.filter((x) => x.active));
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
  const regionRank = (id) => { const i = REGIONS.findIndex((r) => r.id === id); return i < 0 ? 99 : i; };
  /* a team serves one or more regions; documents saved before that only carry `region` */
  const teamRegions = (x) => (Array.isArray(x.regions) && x.regions.length ? x.regions : (x.region ? [x.region] : [])).filter((r) => REGIONS.some((g) => g.id === r)).sort((a, b) => regionRank(a) - regionRank(b));
  const regionsLabel = (ids) => ids.map(regionName).filter(Boolean).join(lang === 'ar' ? '، ' : ', ');
  const teams = raw.teams.map((x) => { const regions = teamRegions(x); return { id: x.id, regions, region: regions[0] || '', name: L(x.name) }; });
  /* ICONIC CRM catalog. Names and links come from the CRM; descriptions, images and SEO text come from this site.
     An inactive project is kept out of the public lists and its page is gone; a project deleted in the CRM is not known here at all. */
  const live = (a) => (a || []).filter((x) => !x.crmDeleted && x.slug && x.name);
  const byName = (a, b) => (a.order == null ? 100 : a.order) - (b.order == null ? 100 : b.order) || a.name.localeCompare(b.name, lang);
  const cities = live(raw.cities).map((r) => ({ id: r.crmId, slug: r.slug, name: r.name, region: REGIONS.some((g) => g.id === r.region) ? r.region : '', description: L(r.description), order: r.order })).sort(byName);
  const cityById = new Map(cities.map((x) => [x.id, x]));
  const areas = live(raw.areas).filter((r) => cityById.has(r.cityId)).map((r) => ({
    id: r.crmId, slug: r.slug, name: r.name, cityId: r.cityId, city: cityById.get(r.cityId), url: '/' + lang + '/areas/' + r.slug, description: L(r.description), images: (r.images || []).map(imgPath).filter(Boolean),
    seoTitle: L(r.seoTitle), seoDescription: L(r.seoDescription), order: r.order, updatedAt: r._u || 0
  })).sort(byName);
  const areaById = new Map(areas.map((x) => [x.id, x]));
  const developers = live(raw.developers).map((r) => ({
    id: r.crmId, slug: r.slug, name: r.name, url: '/' + lang + '/developers/' + r.slug, description: L(r.description), logo: imgPath(r.logo), seoTitle: L(r.seoTitle), seoDescription: L(r.seoDescription), order: r.order, updatedAt: r._u || 0
  })).sort(byName);
  const developerById = new Map(developers.map((x) => [x.id, x]));
  const projects = live(raw.projects).filter((r) => cityById.has(r.cityId)).map((r) => {
    const city = cityById.get(r.cityId), a = areaById.get(r.areaId), developer = developerById.get(r.developerId) || null;
    return {
      id: r.crmId, slug: r.slug, name: r.name, active: r.active !== false, url: '/' + lang + '/projects/' + r.slug, developer, city, area: a && a.cityId === r.cityId ? a : null, region: city.region,
      description: L(r.description), images: (r.images || []).map(imgPath).filter(Boolean), seoTitle: L(r.seoTitle), seoDescription: L(r.seoDescription), order: r.order, updatedAt: r._u || 0
    };
  }).sort(byName);
  const projectById = new Map(projects.map((x) => [x.id, x]));
  const shownProjects = projects.filter((x) => x.active);
  const catalog = { cities, areas, developers, projects, shownProjects, cityById, areaById, developerById, projectById };

  /* the 3D home page draws from the stored documents; give it the same project-derived values the other pages use */
  const rawProps = raw.properties.map((p) => {
    const pr = p.projectId ? projectById.get(p.projectId) : null; if (!pr) return p;
    const where = pr.area ? pr.area.name : pr.city.name;
    return Object.assign({}, p, { region: pr.region || p.region, project: { en: pr.name, ar: pr.name }, location: { en: where, ar: where } });
  });
  const props = raw.properties.map((p) => {
    const area = p.area != null && p.area !== '' ? Number(p.area) : null;
    const pr = p.projectId ? projectById.get(p.projectId) : null;   // a unit linked to a project takes developer, area and region from it
    return {
      id: p.id, slug: p.slug || '', url: '/' + lang + '/property/' + p.slug, region: (pr && pr.region) || p.region, type: p.type, purpose: p.purpose, agent: p.agent || null,
      price: p.price == null ? null : Number(p.price), currency: p.currency || 'EGP', beds: p.beds == null ? null : Number(p.beds), baths: p.baths == null ? null : Number(p.baths),
      areaNum: area, area: area ? fmtNum(area) + ' ' + t('unit.sqm') : '',
      title: L(p.title), project: pr ? pr.name : L(p.project), location: pr ? (pr.area ? pr.area.name : pr.city.name) : L(p.location),
      projectId: pr ? pr.id : '', projectUrl: pr && pr.active ? pr.url : '', developerId: pr && pr.developer ? pr.developer.id : '', cityId: pr ? pr.city.id : '', areaId: pr && pr.area ? pr.area.id : '',
      description: L(p.description), seoTitle: L(p.seoTitle), seoDescription: L(p.seoDescription),
      images: (p.images || []).map(imgPath).filter(Boolean), updatedAt: p._u || 0, createdAt: p.createdAt || p._u || 0
    };
  }).filter((p) => p.slug);

  const branches = (raw.branches || []).map((b) => ({ id: b.id, name: L(b.name), city: L(b.city), address: L(b.address), phone: b.phone || '', whatsapp: b.whatsapp || '', hours: L(b.hours), map: /^https:\/\/\S+$/i.test(b.map || '') ? b.map : '' })).filter((b) => b.name || b.address);
  const today = new Date().toISOString().slice(0, 10);
  const jobs = (raw.jobs || []).filter((j) => j.active !== false && j.slug && !(j.closes && j.closes < today)).map((j) => ({
    id: j.id, slug: j.slug, url: '/' + lang + '/careers/' + j.slug, title: L(j.title), department: L(j.department), location: L(j.location), type: j.type || 'full', typeLabel: jobTypeLabel(j.type || 'full'),
    description: L(j.description), requirements: L(j.requirements), posted: j.posted || '', closes: j.closes || '', updatedAt: j._u || 0
  })).filter((j) => j.title);
  return { lang, dir: lang === 'ar' ? 'rtl' : 'ltr', raw, texts, t, fmtNum, plural, L, regionName, regionsLabel, typeLabel, purposeLabel, jobTypeLabel, priceText, imgPath, abs, company, layout, regionSeo, agents, agentById, teams, regionRank, props, rawProps, catalog, branches, jobs, today, REGIONS, TYPES, PURPOSES, typeChoices, purposeChoices, clip, brand: cfg.brand, updated: snap.updated };
}

const waNumber = (v) => { let n = String(v || '').replace(/\D/g, ''); if (/^01\d{9}$/.test(n)) n = '20' + n.slice(1); return n; };
module.exports = { make, waNumber, clip, REGIONS };
