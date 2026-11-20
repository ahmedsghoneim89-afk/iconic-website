'use strict';
/* Public pages for the ICONIC CRM catalog: developers, projects and areas, plus the filters on the properties pages. Names come from the CRM,
   texts and pictures from this site. A page with nothing to show says so, and is kept out of search engines and the sitemap. */
const cfg = require('../config');
const { esc } = require('../util');
const F = require('./frag');
const S = require('./seo');
const P = require('./pages');

const { page, crumbsHtml, para } = P;
const sep = (c) => (c.lang === 'ar' ? '، ' : ', ');
const home = (c) => [c.t('pg.home'), '/' + c.lang + '/'];

/* ---------- what is worth showing ---------- */
const unitsOf = (c, key, id) => c.props.filter((p) => p[key] === id);
const projectsOfDeveloper = (c, d) => c.catalog.shownProjects.filter((p) => p.developer && p.developer.id === d.id);
const projectsOfArea = (c, a) => c.catalog.shownProjects.filter((p) => p.area && p.area.id === a.id);
const projectHasContent = (c, p) => !!(p.description || p.images.length || unitsOf(c, 'projectId', p.id).length);
const developerHasContent = (c, d) => !!(projectsOfDeveloper(c, d).length || unitsOf(c, 'developerId', d.id).length);
const areaHasContent = (c, a) => !!(projectsOfArea(c, a).length || unitsOf(c, 'areaId', a.id).length);

/* ---------- small pieces ---------- */
function projectCard(c, p) {
  const n = unitsOf(c, 'projectId', p.id).length, img = p.images[0];
  const meta = [p.developer && p.developer.name, p.area && p.area.name, p.city.name].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
  return `<article class="card"><div class="card__media">${img ? `<img class="media-in" src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : '<div class="media-in media-ph"></div>'}</div>
<div class="card__body"><h3><a class="card__open" href="${esc(p.url)}">${esc(p.name)}</a></h3><div class="card__meta">${meta}</div><p class="card__price">${esc(c.t('pg.proj.unitsN', { n: c.fmtNum(n) }))}</p></div></article>`;
}
function developerCard(c, d) {
  const n = projectsOfDeveloper(c, d).length;
  return `<article class="dcard"><div class="dcard__logo">${d.logo ? `<img src="${esc(d.logo)}" alt="" loading="lazy" decoding="async">` : `<span aria-hidden="true">${esc(Array.from(d.name)[0] || '')}</span>`}</div>
<div class="dcard__body"><h3><a class="card__open" href="${esc(d.url)}">${esc(d.name)}</a></h3><p class="note">${esc(c.t('pg.dev.count', { n: c.fmtNum(n) }))}</p></div></article>`;
}
const emptyBlock = (title, body) => `<div class="empty pg__empty">${title ? `<h2>${esc(title)}</h2>` : ''}<p>${esc(body)}</p></div>`;
const section = (id, title, inner) => `<section class="pgs" aria-labelledby="${id}"><h2 class="h3" id="${id}">${esc(title)}</h2>${inner}</section>`;
const gallery = (c, images, title) => !images.length ? '' : `<div class="pgp__media"><figure class="pgp__main"><img id="galMain" src="${esc(images[0])}" alt="${esc(title)}" fetchpriority="high" decoding="async"></figure>${images.length > 1 ? `<ul class="pgp__thumbs" aria-label="${esc(c.t('pg.prop.gallery'))}">${images.map((u, i) => `<li><a href="${esc(u)}" data-gal="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(title)} ${c.fmtNum(i + 1)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></a></li>`).join('')}</ul>` : ''}</div>`;
const metaRow = (c, rows) => { const r = rows.filter((x) => x[1]); return r.length ? `<dl class="specs">${r.map(([k, v]) => `<div><dt>${esc(c.t(k))}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''; };
const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const regionLink = (c, id) => (id ? link('/' + c.lang + '/properties/' + id, c.regionName(id)) : '');

/* ---------- filters: a GET form with linked drop-down lists, so it works without scripts and a result can be shared ----------
   One row per project that can be chosen: [developer, governorate, area, project, weight]. The lists narrow each other the way
   the data is linked: a governorate offers only its areas, a developer only its projects. page.js applies the same rules while
   someone is choosing; here they decide what the page offers after the form is sent. */
const BEDS = [1, 2, 3, 4, 5];
const SORTS = ['newest', 'oldest', 'price_asc', 'price_desc'];
const CURRENCY_IDS = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
/* a number typed by a person: Arabic digits and thousands separators are fine, anything else is ignored */
function typedNumber(v) {
  const s = String(v || '').replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x6F0).replace(/[,\u066C\s]/g, '').replace(/\u066B/g, '.');
  const n = /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : 0;
  return n > 0 && n <= 1e12 ? n : 0;
}
function resolveFilters(c, sp) {
  const get = (k) => String((sp && sp.get && sp.get(k)) || '').slice(0, 120);
  const K = c.catalog;
  const find = (arr, slug) => (slug ? arr.find((x) => x.slug === slug) || null : null);
  const f = { developer: find(K.developers, get('developer')), project: find(K.projects, get('project')), area: find(K.areas, get('area')), city: find(K.cities, get('city')) };
  /* a project or an area already says where it is, so the other choices follow it */
  if (f.project) { f.developer = f.project.developer || null; f.city = f.project.city; f.area = f.project.area || null; }
  else if (f.area) f.city = f.area.city;
  const type = get('type'), purpose = get('purpose'), beds = parseInt(get('beds'), 10);
  f.type = c.TYPES.some((x) => x[0] === type) ? type : '';
  f.purpose = c.PURPOSES.some((x) => x[0] === purpose) ? purpose : '';
  f.beds = beds >= 1 && beds <= 9 ? beds : 0;
  const baths = parseInt(get('baths'), 10), cur = get('currency'), sort = get('sort');
  f.baths = baths >= 1 && baths <= 9 ? baths : 0;
  f.priceMin = typedNumber(get('price_min')); f.priceMax = typedNumber(get('price_max'));
  f.areaMin = typedNumber(get('area_min')); f.areaMax = typedNumber(get('area_max'));
  /* "from" above "to" is a slip of the hand, not an empty result */
  if (f.priceMax && f.priceMin > f.priceMax) { const t = f.priceMin; f.priceMin = f.priceMax; f.priceMax = t; }
  if (f.areaMax && f.areaMin > f.areaMax) { const t = f.areaMin; f.areaMin = f.areaMax; f.areaMax = t; }
  f.currency = CURRENCY_IDS.includes(cur) ? cur : '';
  f.sort = SORTS.includes(sort) ? sort : '';
  f.active = !!(f.developer || f.project || f.area || f.city || f.type || f.purpose || f.beds || f.baths || f.priceMin || f.priceMax || f.areaMin || f.areaMax || f.currency || f.sort);
  return f;
}
const cascadeRows = (projects, weight) => projects.map((p) => ({ d: p.developer ? p.developer.slug : '', c: p.city.slug, a: p.area ? p.area.slug : '', p: p.slug, u: weight(p) }));
/* what each list offers for the current choices, with how many units (or projects) are behind every entry */
function cascade(rows, sel) {
  const keep = (skip) => rows.filter((r) => ['d', 'c', 'a', 'p'].every((k) => skip.includes(k) || !sel[k] || r[k] === sel[k]));
  const tally = (list, k) => { const m = new Map(); list.forEach((r) => { if (r[k]) m.set(r[k], (m.get(r[k]) || 0) + r.u); }); return m; };
  return { d: tally(keep('dp'), 'd'), c: tally(keep('cap'), 'c'), a: tally(keep('ap'), 'a'), p: tally(keep('p'), 'p') };
}
function select(c, name, label, groups, current, count) {
  const opt = (o) => `<option value="${esc(o.slug)}"${current && current.slug === o.slug ? ' selected' : ''}>${esc(o.name)}${count && count.get(o.slug) > 0 ? ` (${esc(c.fmtNum(count.get(o.slug)))})` : ''}</option>`;
  const body = groups.map((g) => (g.label ? `<optgroup label="${esc(g.label)}">${g.items.map(opt).join('')}</optgroup>` : g.items.map(opt).join(''))).join('');
  return `<label class="flt__f"><span>${esc(label)}</span><select name="${name}"><option value="">${esc(c.t('flt.all'))}</option>${body}</select></label>`;
}
/* a plain list of fixed choices (type, purpose, bedrooms) */
function simpleSelect(c, name, label, options, current) {
  return `<label class="flt__f"><span>${esc(label)}</span><select name="${name}"><option value="">${esc(c.t('flt.all'))}</option>${options.map(([v, l]) => `<option value="${esc(v)}"${String(current) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
}
/* a from / to pair of numbers (price, size); sent as <name>_min and <name>_max */
function rangeField(c, name, label, min, max) {
  const one = (suffix, word, v) => `<input type="text" inputmode="decimal" autocomplete="off" name="${name}_${suffix}" value="${v ? esc(String(v)) : ''}" placeholder="${esc(c.t('flt.' + word))}" aria-label="${esc(label + ' – ' + c.t('flt.' + word))}">`;
  return `<div class="flt__f flt__range" role="group" aria-label="${esc(label)}"><span>${esc(label)}</span><div class="flt__pair">${one('min', 'from', min)}<i aria-hidden="true">–</i>${one('max', 'to', max)}</div></div>`;
}
/* opts.rows: the projects to choose from; opts.project: offer a project list; opts.units: offer type, purpose and bedrooms */
function filterForm(c, basePath, f, opts) {
  const K = c.catalog, rows = opts.rows || [], sel = { d: f.developer ? f.developer.slug : '', c: f.city ? f.city.slug : '', a: f.area ? f.area.slug : '', p: f.project ? f.project.slug : '' };
  const fields = [];
  let tree = '';
  if (rows.length) {
    const lists = cascade(rows, sel);
    /* whatever is chosen stays visible even when a shared link names a combination the lists would not offer */
    const offered = (all, k, cur) => all.filter((x) => lists[k].has(x.slug) || (cur && cur.slug === x.slug));
    const devs = offered(K.developers, 'd', f.developer), cities = offered(K.cities, 'c', f.city), areas = offered(K.areas, 'a', f.area), projs = opts.project ? offered(K.projects, 'p', f.project) : [];
    const areaGroups = f.city ? [{ items: areas }] : K.cities.map((ct) => ({ label: ct.name, items: areas.filter((a) => a.cityId === ct.id) })).filter((g) => g.items.length);
    if (cities.length) fields.push(select(c, 'city', c.t('flt.city'), [{ items: cities }], f.city, lists.c));
    if (areas.length) fields.push(select(c, 'area', c.t('flt.area'), areaGroups, f.area, lists.a));
    if (devs.length) fields.push(select(c, 'developer', c.t('flt.developer'), [{ items: devs }], f.developer, lists.d));
    if (projs.length) fields.push(select(c, 'project', c.t('flt.project'), [{ items: projs }], f.project, lists.p));
    /* everything page.js needs to keep the lists linked without another request */
    const inRows = (k) => new Set(rows.map((r) => r[k]));
    const dv = inRows('d'), ct = inRows('c'), ar = inRows('a'), pj = inRows('p');
    tree = JSON.stringify({
      r: rows.map((r) => [r.d, r.c, r.a, r.p, r.u]), d: K.developers.filter((x) => dv.has(x.slug)).map((x) => [x.slug, x.name]), c: K.cities.filter((x) => ct.has(x.slug)).map((x) => [x.slug, x.name]),
      a: K.areas.filter((x) => ar.has(x.slug)).map((x) => [x.slug, x.name, x.city.slug]), p: opts.project ? K.projects.filter((x) => pj.has(x.slug)).map((x) => [x.slug, x.name]) : [], n: c.lang === 'ar' ? 'ar-EG' : 'en-US'
    });
  }
  if (opts.units) {
    fields.push(simpleSelect(c, 'type', c.t('flt.type'), c.typeChoices.map((x) => [x[0], x[1][c.lang]]), f.type));
    fields.push(simpleSelect(c, 'purpose', c.t('flt.purpose'), c.purposeChoices.map((x) => [x[0], x[1][c.lang]]), f.purpose));
    fields.push(simpleSelect(c, 'beds', c.t('flt.beds'), BEDS.map((n) => [n, c.fmtNum(n) + '+']), f.beds || ''));
    fields.push(simpleSelect(c, 'baths', c.t('flt.baths'), BEDS.map((n) => [n, c.fmtNum(n) + '+']), f.baths || ''));
    /* prices are compared as typed, so a currency choice appears only when the units are priced in more than one */
    const currencies = CURRENCY_IDS.filter((x) => c.props.some((p) => p.currency === x));
    if (currencies.length > 1) fields.push(simpleSelect(c, 'currency', c.t('flt.currency'), currencies.map((x) => [x, x]), f.currency));
    fields.push(rangeField(c, 'price', c.t('flt.price'), f.priceMin, f.priceMax));
    fields.push(rangeField(c, 'area', c.t('flt.size'), f.areaMin, f.areaMax));
    fields.push(`<label class="flt__f flt__f--wide"><span>${esc(c.t('flt.sort'))}</span><select name="sort"><option value="">${esc(c.t('flt.sort.default'))}</option>${SORTS.map((v) => `<option value="${v}"${f.sort === v ? ' selected' : ''}>${esc(c.t('flt.sort.' + v))}</option>`).join('')}</select></label>`);
  }
  if (!fields.length) return '';
  return `<form class="flt" method="get" action="${esc(basePath)}" aria-label="${esc(c.t('flt.title'))}"${tree ? ` data-tree="${esc(tree)}"` : ''}>${fields.join('')}<div class="flt__go"><button class="btn btn--small btn--primary" type="submit">${esc(c.t('flt.apply'))}</button>${f.active ? `<a class="btn btn--small" href="${esc(basePath)}">${esc(c.t('flt.reset'))}</a>` : ''}</div></form>`;
}
function filterUnits(c, f) {
  const list = c.props.filter((p) => (!f.developer || p.developerId === f.developer.id) && (!f.project || p.projectId === f.project.id) && (!f.area || p.areaId === f.area.id) && (!f.city || p.cityId === f.city.id)
    && (!f.type || p.type === f.type) && (!f.purpose || p.purpose === f.purpose) && (!f.beds || (p.beds != null && p.beds >= f.beds)) && (!f.baths || (p.baths != null && p.baths >= f.baths))
    && (!f.currency || p.currency === f.currency)
    && (!(f.priceMin || f.priceMax) || (p.price != null && (!f.priceMin || p.price >= f.priceMin) && (!f.priceMax || p.price <= f.priceMax)))
    && (!(f.areaMin || f.areaMax) || (p.areaNum != null && (!f.areaMin || p.areaNum >= f.areaMin) && (!f.areaMax || p.areaNum <= f.areaMax))));
  return sortUnits(list, f.sort);
}
/* newest and oldest follow the day a unit was added; a unit with no price goes last either way */
function sortUnits(list, sort) {
  if (!sort) return list;
  const price = (p) => (p.price == null ? null : p.price), when = (p) => p.createdAt || p.updatedAt || 0;
  const cmp = {
    newest: (a, b) => when(b) - when(a), oldest: (a, b) => when(a) - when(b),
    price_asc: (a, b) => (price(a) == null) - (price(b) == null) || price(a) - price(b), price_desc: (a, b) => (price(a) == null) - (price(b) == null) || price(b) - price(a)
  }[sort];
  return list.map((p, i) => [p, i]).sort((x, y) => cmp(x[0], y[0]) || x[1] - y[1]).map((x) => x[0]);
}
/* the properties page, with the catalog filters; the lists come from the CRM projects, with the number of units in each */
function unitFilterBlock(c, f) {
  const K = c.catalog, count = new Map();
  c.props.forEach((p) => { if (p.projectId) count.set(p.projectId, (count.get(p.projectId) || 0) + 1); });
  const rows = cascadeRows(K.projects.filter((p) => p.active || count.has(p.id)), (p) => count.get(p.id) || 0);
  return filterForm(c, '/' + c.lang + '/properties', f, { rows, project: true, units: true });
}

/* ---------- developers ---------- */
function developersPage(c) {
  const l = c.lang, list = c.catalog.developers.filter((d) => developerHasContent(c, d)), path = (x) => S.urls.developers(x);
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [home(c), [c.t('pg.dev.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.dev.title'))}</h1><p class="lede">${esc(c.t('pg.dev.lede'))}</p></header>
${list.length ? `<div class="dgrid">${list.map((d) => developerCard(c, d)).join('')}</div>` : emptyBlock(c.t('pg.dev.empty.title'), c.t('pg.dev.empty.body'))}</div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.dev.title'), path(l)]]), list.length ? { '@type': 'ItemList', itemListElement: list.slice(0, 100).map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.siteUrl + d.url, name: d.name })) } : null]);
  return page(c, { path, title: `${c.t('pg.dev.title')} | ${cfg.brand}`, description: c.clip(c.t('pg.dev.lede') + ' ' + c.t('meta.desc'), 158), jsonld, nav: 'devs', noindex: !list.length }, body);
}
function developerPage(c, d) {
  const l = c.lang, path = (x) => S.urls.developer(x, d.slug), projects = projectsOfDeveloper(c, d), units = unitsOf(c, 'developerId', d.id), has = projects.length || units.length;
  const body = `<article class="wrap pg__wrap">${crumbsHtml(c, [home(c), [c.t('pg.dev.title'), '/' + l + '/developers'], [d.name]])}
<header class="pg__head dhead">${d.logo ? `<div class="dcard__logo dcard__logo--lg"><img src="${esc(d.logo)}" alt="" decoding="async"></div>` : ''}<h1 class="h2">${esc(d.name)}</h1></header>
${d.description ? `<div class="pg__intro">${para(d.description)}</div>` : ''}
${section('dp-h', c.t('pg.dev.projects', { name: d.name }), projects.length ? `<div class="grid">${projects.map((p) => projectCard(c, p)).join('')}</div>` : emptyBlock('', c.t('pg.dev.noProjects')))}
${section('du-h', c.t('pg.dev.units', { name: d.name }), units.length ? `<p class="note" aria-live="polite">${esc(c.t('props.count', { n: c.fmtNum(units.length) }))}</p><div class="grid">${F.cards(c, units)}</div>` : emptyBlock('', c.t('pg.dev.noUnits')))}</article>`;
  const org = { '@type': 'Organization', '@id': cfg.siteUrl + path(l) + '#developer', name: d.name, url: cfg.siteUrl + path(l), logo: d.logo ? c.abs(d.logo) : undefined, description: d.description ? c.clip(d.description, 300) : undefined };
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.dev.title'), S.urls.developers(l)], [d.name, path(l)]]), org]);
  return page(c, { path, title: d.seoTitle || `${d.name} | ${c.t('pg.dev.title')} | ${cfg.brand}`, description: d.seoDescription || c.clip(d.description || (c.t('pg.dev.projects', { name: d.name }) + '. ' + c.t('meta.desc')), 158), jsonld, nav: 'devs', noindex: !has, image: d.logo ? c.abs(d.logo) : null }, body);
}

/* ---------- projects ---------- */
function projectsPage(c, f) {
  const l = c.lang, K = c.catalog, path = (x) => S.urls.projects(x);
  const list = K.shownProjects.filter((p) => (!f.developer || (p.developer && p.developer.id === f.developer.id)) && (!f.area || (p.area && p.area.id === f.area.id)) && (!f.city || p.city.id === f.city.id));
  const form = K.shownProjects.length ? filterForm(c, '/' + l + '/projects', f, { rows: cascadeRows(K.shownProjects, () => 1), project: false, units: false }) : '';
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [home(c), [c.t('pg.proj.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.proj.title'))}</h1><p class="lede">${esc(c.t('pg.proj.lede'))}</p></header>${form}
${!K.shownProjects.length ? emptyBlock(c.t('pg.proj.empty.title'), c.t('pg.proj.empty.body'))
    : list.length ? `<p class="note" aria-live="polite">${esc(c.t('pg.proj.count', { n: c.fmtNum(list.length) }))}</p><div class="grid">${list.map((p) => projectCard(c, p)).join('')}</div>` : emptyBlock(c.t('flt.none.title'), c.t('flt.none.body'))}</div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.proj.title'), path(l)]]), list.length ? { '@type': 'ItemList', itemListElement: list.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.siteUrl + p.url, name: p.name })) } : null]);
  return page(c, { path, title: `${c.t('pg.proj.title')} | ${cfg.brand}`, description: c.clip(c.t('pg.proj.lede') + ' ' + c.t('meta.desc'), 158), jsonld, nav: 'projects', noindex: !K.shownProjects.length || f.active }, body);
}
function projectPage(c, p) {
  const l = c.lang, path = (x) => S.urls.project(x, p.slug), units = unitsOf(c, 'projectId', p.id);
  const where = [p.area && link(p.area.url, p.area.name), esc(p.city.name), p.region && c.regionName(p.region).trim().toLowerCase() !== String(p.city.name).trim().toLowerCase() && regionLink(c, p.region)].filter(Boolean).join(esc(sep(c)));
  const body = `<article class="wrap pg__wrap pgp">${crumbsHtml(c, [home(c), [c.t('pg.proj.title'), '/' + l + '/projects'], [p.name]])}
<div class="pgp__grid">${gallery(c, p.images, p.name) || '<div class="pgp__media"><div class="pgp__main media-ph" role="img" aria-label="' + esc(p.name) + '"></div></div>'}
<div class="pgp__body"><h1 class="pgp__title">${esc(p.name)}</h1>
${metaRow(c, [['pg.proj.developer', p.developer ? link(p.developer.url, p.developer.name) : ''], ['pg.proj.where', where]])}
${p.description ? `<section class="pgp__about"><h2>${esc(c.t('pg.proj.about'))}</h2>${para(p.description)}</section>` : ''}
<div class="cta-row"><a class="btn btn--primary" href="/${l}/#contact">${esc(c.t('cta.inquiry'))}</a><a class="btn" href="/${l}/projects">${esc(c.t('pg.proj.all'))}</a></div></div></div>
${section('pu-h', c.t('pg.proj.units', { name: p.name }), units.length ? `<p class="note" aria-live="polite">${esc(c.t('props.count', { n: c.fmtNum(units.length) }))}</p><div class="grid">${F.cards(c, units)}</div>` : emptyBlock('', c.t('pg.proj.noUnits')))}</article>`;
  const place = { '@type': 'Place', '@id': cfg.siteUrl + path(l) + '#project', name: p.name, url: cfg.siteUrl + path(l), description: p.description ? c.clip(p.description, 300) : undefined, image: p.images.length ? p.images.map(c.abs) : undefined, address: { '@type': 'PostalAddress', addressLocality: p.area ? p.area.name : p.city.name, addressRegion: p.city.name, addressCountry: 'EG' } };
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.proj.title'), S.urls.projects(l)], [p.name, path(l)]]), place]);
  return page(c, { path, title: p.seoTitle || `${p.name} | ${c.t('pg.proj.title')} | ${cfg.brand}`, description: p.seoDescription || c.clip(p.description || [p.name, p.developer && p.developer.name, p.area ? p.area.name : p.city.name].filter(Boolean).join(' - ') + '. ' + c.t('meta.desc'), 158), jsonld, nav: 'projects', noindex: !projectHasContent(c, p), image: p.images[0] ? c.abs(p.images[0]) : null }, body);
}

/* ---------- areas ---------- */
function areaPage(c, a) {
  const l = c.lang, path = (x) => S.urls.area(x, a.slug), projects = projectsOfArea(c, a), units = unitsOf(c, 'areaId', a.id), region = a.city.region;
  const crumbs = [home(c), [c.t('pg.props.title'), '/' + l + '/properties']].concat(region ? [[c.regionName(region), '/' + l + '/properties/' + region]] : []).concat([[a.name]]);
  const body = `<article class="wrap pg__wrap">${crumbsHtml(c, crumbs)}
<header class="pg__head"><h1 class="h2">${esc(a.name)}</h1><p class="lede">${esc(c.t('pg.area.lede', { area: a.name, city: a.city.name }))}</p></header>
${a.description ? `<div class="pg__intro">${para(a.description)}</div>` : ''}${gallery(c, a.images, a.name)}
${section('ap-h', c.t('pg.area.projects', { area: a.name }), projects.length ? `<div class="grid">${projects.map((p) => projectCard(c, p)).join('')}</div>` : emptyBlock('', c.t('pg.area.noProjects')))}
${section('au-h', c.t('pg.area.units', { area: a.name }), units.length ? `<p class="note" aria-live="polite">${esc(c.t('props.count', { n: c.fmtNum(units.length) }))}</p><div class="grid">${F.cards(c, units)}</div>` : emptyBlock('', c.t('pg.area.noUnits')))}</article>`;
  const place = { '@type': 'Place', '@id': cfg.siteUrl + path(l) + '#area', name: a.name, url: cfg.siteUrl + path(l), description: a.description ? c.clip(a.description, 300) : undefined, containedInPlace: { '@type': 'City', name: a.city.name, address: { '@type': 'PostalAddress', addressCountry: 'EG' } } };
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, crumbs.map((x, i) => [x[0], i === 0 ? S.urls.home(l) : (x[1] || path(l))])), place]);
  return page(c, { path, title: a.seoTitle || `${a.name}, ${a.city.name} | ${cfg.brand}`, description: a.seoDescription || c.clip(c.t('pg.area.lede', { area: a.name, city: a.city.name }) + ' ' + c.t('meta.desc'), 158), jsonld, nav: 'props', noindex: !areaHasContent(c, a) && !a.description, image: a.images[0] ? c.abs(a.images[0]) : null }, body);
}

/* cities and areas under a region (areas that have projects or units); shown on the region page */
function placesBlock(c, regionId) {
  const K = c.catalog, rows = K.cities.filter((x) => x.region === regionId).map((ct) => ({ ct, areas: K.areas.filter((a) => a.cityId === ct.id && areaHasContent(c, a)) })).filter((r) => r.areas.length);
  if (!rows.length) return '';
  return `<section class="places" aria-labelledby="pl-h"><h2 class="h3" id="pl-h">${esc(c.t('pg.region.places', { region: c.regionName(regionId) }))}</h2><ul class="places__list">${rows.map((r) => `<li><strong>${esc(r.ct.name)}</strong><ul class="chips">${r.areas.map((a) => `<li><a class="chip" href="${esc(a.url)}">${esc(a.name)}</a></li>`).join('')}</ul></li>`).join('')}</ul></section>`;
}

/* ---------- the properties page, with the catalog filters ---------- */
function propertiesPage(c, f) {
  const l = c.lang, path = (x) => S.urls.props(x), list = f.active ? filterUnits(c, f) : c.props;
  const title = `${c.t('pg.props.title')} | ${cfg.brand}`;
  const empty = f.active ? emptyBlock(c.t('flt.none.title'), c.t('flt.none.body')) : `<div class="empty pg__empty"><h2>${esc(c.t('props.empty.title'))}</h2><p>${esc(c.t('props.empty.body'))}</p></div>`;
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [home(c), [c.t('pg.props.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.props.title'))}</h1><p class="lede">${esc(c.t('pg.props.lede'))}</p></header>${F.regionLinks(c, 'all')}${unitFilterBlock(c, f)}
${list.length ? `<p class="note" aria-live="polite">${esc(c.t('props.count', { n: c.fmtNum(list.length) }))}</p><div class="grid">${F.cards(c, list)}</div>` : empty}</div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.props.title'), path(l)]]), list.length && !f.active ? { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.siteUrl + p.url, name: p.title })) } : null]);
  return page(c, { path, title, description: c.clip(c.t('pg.props.lede') + ' ' + c.t('meta.desc'), 158), jsonld, nav: 'props', noindex: !list.length || f.active }, body);
}

/* the home page: the newest projects and developers, with a way to the full lists; nothing at all when the CRM has none */
const newest = (arr, n) => arr.slice().sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0, n);   // CRM ids start with their creation time
function homeBlock(c) {
  const K = c.catalog, l = c.lang;
  if (!K.shownProjects.length) return '';
  const projects = newest(K.shownProjects, 6), devs = newest(K.developers.filter((d) => developerHasContent(c, d)), 8);
  return `<section class="latest" id="latest" aria-labelledby="latest-title"><div class="wrap">
<div class="latest__block"><div class="latest__head"><h2 class="h2" id="latest-title">${esc(c.t('home.latest.title'))}</h2><a class="btn btn--small" href="/${l}/projects">${esc(c.t('home.latest.all'))}</a></div>
<div class="grid">${projects.map((p) => projectCard(c, p)).join('')}</div></div>
${devs.length ? `<div class="latest__block"><div class="latest__head"><h2 class="h3" id="latest-devs">${esc(c.t('home.devs.title'))}</h2><a class="btn btn--small" href="/${l}/developers">${esc(c.t('home.devs.all'))}</a></div>
<div class="dgrid" aria-labelledby="latest-devs">${devs.map((d) => developerCard(c, d)).join('')}</div></div>` : ''}
</div></section>`;
}

module.exports = { homeBlock, propertiesPage, developersPage, developerPage, projectsPage, projectPage, areaPage, placesBlock, resolveFilters, filterUnits, sortUnits, unitFilterBlock, developerHasContent, projectHasContent, areaHasContent };
