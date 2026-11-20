'use strict';
const cfg = require('../config');
const { esc, jsonForScript } = require('../util');
const F = require('./frag');
const S = require('./seo');
const T = require('./templates');

const indexable = cfg.siteUrl.startsWith('https://') || process.env.ALLOW_INDEXING === '1';
const other = (l) => (l === 'ar' ? 'en' : 'ar');
const para = (s) => String(s || '').split(/\n{1,}/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('');

/* ---------- document shell ---------- */
function head(c, o) {
  const lang = c.lang, canon = cfg.siteUrl + o.path(lang), image = o.image || c.abs('/og-default.png');
  const robots = (o.noindex || !indexable) ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  const alts = ['en', 'ar'].map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(cfg.siteUrl + o.path(l))}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${esc(cfg.siteUrl + o.path(cfg.defaultLang))}">`;
  return `<meta charset="utf-8">
<title>${esc(o.title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(o.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canon)}">
${o.noindex ? '' : alts}
<meta name="theme-color" content="#050507">
<meta property="og:type" content="${o.ogType || 'website'}"><meta property="og:site_name" content="${esc(cfg.brand)}"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(canon)}"><meta property="og:image" content="${esc(image)}"><meta property="og:locale" content="${lang === 'ar' ? 'ar_EG' : 'en_US'}"><meta property="og:locale:alternate" content="${lang === 'ar' ? 'en_US' : 'ar_EG'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(o.title)}"><meta name="twitter:description" content="${esc(o.description)}"><meta name="twitter:image" content="${esc(image)}">
${cfg.googleVerification ? `<meta name="google-site-verification" content="${esc(cfg.googleVerification)}">` : ''}${cfg.bingVerification ? `<meta name="msvalidate.01" content="${esc(cfg.bingVerification)}">` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest?lang=${lang}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@300;400;500;600&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap">
<link rel="stylesheet" href="/iconic-assets/${T.assets.css}">${T.assets.pageCss ? `<link rel="stylesheet" href="/iconic-assets/${T.assets.pageCss}">` : ''}
${o.jsonld ? `<script type="application/ld+json">${jsonForScript(o.jsonld)}</script>` : ''}`;
}

function innerHeader(c, o) {
  const l = c.lang, o2 = other(l), cur = (k) => (o.nav === k ? ' aria-current="true"' : '');
  const lis = [`<li><a class="nav__link" href="/${l}/">${esc(c.t('pg.home'))}</a></li>`, `<li><a class="nav__link" href="/${l}/properties"${cur('props')}>${esc(c.t('nav.properties'))}</a></li>`];
  if (c.catalog.shownProjects.length) lis.push(`<li><a class="nav__link" href="/${l}/projects"${cur('projects')}>${esc(c.t('nav.projects'))}</a></li>`, `<li><a class="nav__link" href="/${l}/developers"${cur('devs')}>${esc(c.t('nav.developers'))}</a></li>`);
  lis.push(`<li><a class="nav__link" href="/${l}/sell"${cur('sell')}>${esc(c.t('nav.sell'))}</a></li>`);
  if (c.layout.teams) lis.push(`<li><a class="nav__link" href="/${l}/#teams">${esc(c.t('nav.teams'))}</a></li>`);
  if (c.layout.about) lis.push(`<li><a class="nav__link" href="/${l}/#about">${esc(c.t('nav.about'))}</a></li>`);
  lis.push(`<li><a class="nav__link" href="/${l}/#contact">${esc(c.t('nav.contact'))}</a></li>`);
  lis.push(`<li><a class="nav__link" href="/${l}/careers"${cur('careers')}>${esc(c.t('nav.careers'))}</a></li>`);
  return `<a class="skip-link" href="#main">${esc(c.t('skip.content'))}</a>
<header class="hdr hdr--solid" id="hdr"><a class="brand" href="/${l}/" aria-label="${esc(cfg.brand)}"><img class="brand__img" src="/logo.svg" alt="${esc(cfg.brand)}" width="53" height="56"></a>
<nav class="nav" id="nav" aria-label="Primary"><ul class="nav__list">${lis.join('')}</ul><a class="btn btn--small btn-cta" href="/${l}/#contact">${esc(c.t('cta.viewing'))}</a></nav>
<a class="lang" href="${esc(o.path(o2))}" hreflang="${o2}" lang="${o2}" aria-label="${esc(c.t('lang.aria'))}">${esc(c.t('lang.label'))}</a>
<button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="nav">${esc(c.t('nav.menu'))}</button></header>`;
}
function innerFooter(c, o) {
  const l = c.lang, info = F.contactInfo(c, { branches: false }), acts = F.contactActions(c);
  return `<footer class="foot foot--pg"><div class="wrap foot__cols">
<div class="foot__about"><a class="foot__brand" href="/${l}/" aria-label="${esc(cfg.brand)}"><img class="foot__img" src="/logo.svg" alt="${esc(cfg.brand)}" width="106" height="112" loading="lazy"></a><p>${esc(c.t('meta.desc'))}</p></div>
${F.activeRegions(c).length ? `<nav aria-label="${esc(c.t('home.regions'))}"><h2 class="foot__h">${esc(c.t('home.regions'))}</h2><ul>${F.activeRegions(c).map((r) => `<li><a href="/${l}/properties/${r.id}">${esc(r[l])}</a></li>`).join('')}</ul></nav>` : ''}
${c.catalog.shownProjects.length ? `<nav aria-label="${esc(c.t('nav.projects'))}"><h2 class="foot__h">${esc(c.t('nav.projects'))}</h2><ul><li><a href="/${l}/projects">${esc(c.t('pg.proj.title'))}</a></li><li><a href="/${l}/developers">${esc(c.t('pg.dev.title'))}</a></li></ul></nav>` : ''}
<div class="foot__contact"><h2 class="foot__h">${esc(c.t('nav.contact'))}</h2>${acts ? `<div class="contact-actions">${acts}</div>` : ''}<div class="contact-info">${info}</div></div></div>
${c.branches.length ? `<div class="wrap cbranches foot__branches">${F.branchesSection(c)}</div>` : ''}
<div class="wrap foot__base"><span class="foot__copy">© ${new Date().getFullYear()} ${esc(c.t('foot.rights'))}</span><a class="foot__link" href="/${l}/sell">${esc(c.t('foot.sell'))}</a><a class="foot__link" href="/${l}/careers">${esc(c.t('foot.careers'))}</a></div></footer>`;
}
function crumbsHtml(c, items) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map((it, i) => (i === items.length - 1 ? `<li aria-current="page">${esc(it[0])}</li>` : `<li><a href="${esc(it[1])}">${esc(it[0])}</a></li>`)).join('')}</ol></nav>`;
}
function page(c, o, mainHtml) {
  return `<!DOCTYPE html>
<html lang="${c.lang}" dir="${c.dir}" class="pgroot">
<head>
${head(c, o)}
</head>
<body class="pgbody">
${innerHeader(c, o)}
<main id="main" class="pg" tabindex="-1">${mainHtml}</main>
${innerFooter(c, o)}
<script defer src="/iconic-assets/${T.assets.page}"></script>
</body>
</html>`;
}

/* ---------- pages ---------- */
function propertiesPage(c) {
  const l = c.lang, path = (x) => S.urls.props(x);
  const title = `${c.t('pg.props.title')} | ${cfg.brand}`;
  const crumbs = [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.props.title'), null]];
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.props.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.props.title'))}</h1><p class="lede">${esc(c.t('pg.props.lede'))}</p></header>${F.regionLinks(c, 'all')}
${c.props.length ? `<p class="note" aria-live="polite">${esc(c.t('props.count', { n: c.fmtNum(c.props.length) }))}</p><div class="grid">${F.cards(c, c.props)}</div>` : `<div class="empty pg__empty"><h2>${esc(c.t('props.empty.title'))}</h2><p>${esc(c.t('props.empty.body'))}</p></div>`}</div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, crumbs.map((x, i) => [x[0], i === 0 ? x[1] : S.urls.props(l)])), c.props.length ? { '@type': 'ItemList', itemListElement: c.props.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.siteUrl + p.url, name: p.title })) } : null]);
  return page(c, { path, title, description: c.clip(c.t('pg.props.lede') + ' ' + c.t('meta.desc'), 158), jsonld, nav: 'props', noindex: !c.props.length }, body);
}
function regionPage(c, id) {
  const l = c.lang, region = c.regionName(id), seo = c.regionSeo(id), list = c.props.filter((p) => p.region === id), hasTeam = c.teams.some((tm) => tm.regions.includes(id));
  const path = (x) => S.urls.region(x, id);
  const title = seo.title || `${c.t('pg.region.title', { region })} | ${cfg.brand}`;
  const desc = seo.description || c.clip(c.t('pg.region.lede', { region }) + ' ' + c.t('meta.desc'), 158);
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.props.title'), '/' + l + '/properties'], [region]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.region.title', { region }))}</h1><p class="lede">${esc(c.t('pg.region.lede', { region }))}</p></header>
${seo.intro ? `<div class="pg__intro">${para(seo.intro)}</div>` : ''}${F.regionLinks(c, id)}${require('./catalog_pages').placesBlock(c, id)}
${list.length ? `<p class="note" aria-live="polite">${esc(c.t('pg.region.count', { n: c.fmtNum(list.length) }))}</p><div class="grid">${F.cards(c, list)}</div>` : `<div class="empty pg__empty"><p>${esc(c.t('pg.region.empty', { region }))}</p></div>`}
${hasTeam && c.layout.teams ? `<div class="teams__list pg__team">${F.teams(c, id)}</div>` : ''}</div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.props.title'), S.urls.props(l)], [region, S.urls.region(l, id)]]), list.length ? { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.siteUrl + p.url, name: p.title })) } : null]);
  return page(c, { path, title, description: desc, jsonld, nav: 'props', noindex: !list.length, image: list.length && list[0].images[0] ? c.abs(list[0].images[0]) : null }, body);
}
function propertyPage(c, p) {
  const l = c.lang, region = c.regionName(p.region), path = (x) => S.urls.prop(x, p.slug), agent = p.agent ? c.agentById.get(p.agent) : null;
  const where = [p.project, p.location, region].filter(Boolean).join(l === 'ar' ? '، ' : ', ');
  const K = c.catalog, dev = p.developerId ? K.developerById.get(p.developerId) : null, area = p.areaId ? K.areaById.get(p.areaId) : null;
  const a = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
  const whereHtml = p.projectId ? [p.projectUrl ? a(p.projectUrl, p.project) : esc(p.project), area ? a(area.url, area.name) : esc(p.location), region ? a('/' + l + '/properties/' + p.region, region) : ''].filter(Boolean).join(esc(l === 'ar' ? '، ' : ', ')) : esc(where);
  const title = p.seoTitle || `${p.title} — ${region} | ${cfg.brand}`;
  const base = p.description ? c.clip(p.description, 156) : c.clip(`${p.title}. ${c.purposeLabel(p.purpose)}, ${c.typeLabel(p.type)}${region ? ', ' + region : ''}. ${c.priceText(p)}.`, 156);
  const specs = [['prop.type', c.typeLabel(p.type)], ['prop.purpose', c.purposeLabel(p.purpose)], ['prop.beds', p.beds == null ? null : c.fmtNum(p.beds)], ['prop.baths', p.baths == null ? null : c.fmtNum(p.baths)], ['prop.area', p.area]].filter((x) => x[1]);
  const main = p.images[0], rest = p.images;
  const gallery = main ? `<figure class="pgp__main"><img id="galMain" src="${esc(main)}" alt="${esc(p.title)}" fetchpriority="high" decoding="async"></figure>${rest.length > 1 ? `<ul class="pgp__thumbs" aria-label="${esc(c.t('pg.prop.gallery'))}">${rest.map((u, i) => `<li><a href="${esc(u)}" data-gal="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(p.title)} ${c.fmtNum(i + 1)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></a></li>`).join('')}</ul>` : ''}` : `<div class="pgp__main media-ph" role="img" aria-label="${esc(p.title)}"></div>`;
  const related = c.props.filter((x) => x.region === p.region && x.id !== p.id).slice(0, 3);
  const body = `<article class="wrap pg__wrap pgp">${crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.props.title'), '/' + l + '/properties'], [region, '/' + l + '/properties/' + p.region], [p.title]])}
<div class="pgp__grid"><div class="pgp__media">${gallery}</div>
<div class="pgp__body"><p class="pgp__tags"><span>${esc(c.purposeLabel(p.purpose))}</span><span>${esc(c.typeLabel(p.type))}</span></p>
<h1 class="pgp__title">${esc(p.title)}</h1>${where ? `<p class="pgp__loc">${whereHtml}</p>` : ''}${dev ? `<p class="pgp__loc">${esc(c.t('prop.developer'))}: ${a(dev.url, dev.name)}</p>` : ''}<p class="detail__price">${esc(c.priceText(p))}</p>
${specs.length ? `<dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(c.t(k))}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
${p.description ? `<section class="pgp__about"><h2>${esc(c.t('pg.prop.about'))}</h2>${para(p.description)}</section>` : ''}
${agent ? `<div class="agentline"><p class="note">${esc(c.t('detail.agent'))}</p><div class="agentline__row"><div class="agentline__photo agent__photo${agent.photo ? '' : ' is-ph'}">${F.agentPhoto(c, agent)}</div><div class="agentline__who"><strong>${esc(agent.name)}</strong><span>${esc(agent.role)}</span></div><div class="agent__actions">${F.agentActions(c, agent, p)}</div></div></div>` : ''}
<p class="pgp__ref note">${esc(c.t('prop.ref'))}: <span dir="ltr">${esc(p.id)}</span></p>
<div class="cta-row"><a class="btn btn--primary" href="#ask">${esc(c.t('cta.inquiry'))}</a><a class="btn" href="/${l}/properties/${esc(p.region)}">${esc(c.t('pg.prop.back'))}</a></div></div></div>
<section class="convert pgp__ask" id="ask" aria-labelledby="ask-h"><div class="convert__grid"><div><h2 class="h3" id="ask-h">${esc(c.t('pg.prop.ask'))}</h2><p class="lede">${esc(c.t('conv.lede'))}</p></div>${F.leadForm(c, { property: p.id, agent: p.agent })}</div></section>
${related.length ? `<section class="pgp__more" aria-labelledby="more-h"><h2 class="h3" id="more-h">${esc(c.t('pg.prop.related', { region }))}</h2><div class="grid">${F.cards(c, related)}</div></section>` : ''}</article>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.props.title'), S.urls.props(l)], [region, S.urls.region(l, p.region)], [p.title, S.urls.prop(l, p.slug)]]), S.listingNode(c, p)]);
  return page(c, { path, title, description: p.seoDescription || base, jsonld, nav: 'props', ogType: 'website', image: main ? c.abs(main) : null }, body);
}
const jobMeta = (c, j) => [[j.department, 'job.dept'], [j.location, 'job.location'], [j.typeLabel, 'job.type']].filter((x) => x[0]);
function jobCard(c, j) {
  const meta = jobMeta(c, j).map((x) => `<span>${esc(x[0])}</span>`).join('');
  return `<li class="job"><div class="job__main"><h3 class="job__title"><a class="job__open" href="${esc(j.url)}">${esc(j.title)}</a></h3>${meta ? `<p class="job__meta">${meta}</p>` : ''}</div><a class="btn btn--small" href="${esc(j.url)}">${esc(c.t('job.view'))}</a></li>`;
}
function careersPage(c) {
  const l = c.lang, path = (x) => S.urls.careers(x);
  const title = `${c.t('pg.careers.title')} | ${cfg.brand}`;
  const list = c.jobs.length
    ? `<section aria-labelledby="open-h"><h2 class="h3" id="open-h">${esc(c.t('pg.careers.open'))}</h2><ul class="jobs">${c.jobs.map((j) => jobCard(c, j)).join('')}</ul></section>`
    : `<div class="empty pg__empty"><h2>${esc(c.t('pg.careers.empty.title'))}</h2><p>${esc(c.t('pg.careers.empty.body'))}</p></div>`;
  const body = `<div class="wrap pg__wrap">${crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.careers.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.careers.title'))}</h1><p class="lede">${esc(c.t('pg.careers.lede'))}</p></header>${list}
<section class="convert pgp__ask" id="apply" aria-labelledby="apply-h"><div class="convert__grid"><div><h2 class="h3" id="apply-h">${esc(c.t('pg.careers.general'))}</h2><p class="lede">${esc(c.t('pg.careers.generalLede'))}</p></div>${F.applyForm(c, {})}</div></section></div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.careers.title'), S.urls.careers(l)]])]);
  return page(c, { path, title, description: c.clip(c.t('pg.careers.lede'), 158), jsonld, nav: 'careers', noindex: !c.jobs.length }, body);
}
function jobPage(c, j) {
  const l = c.lang, path = (x) => S.urls.job(x, j.slug);
  const title = `${j.title} | ${c.t('pg.careers.title')} | ${cfg.brand}`;
  const meta = jobMeta(c, j).map(([v, k]) => `<div><dt>${esc(c.t(k))}</dt><dd>${esc(v)}</dd></div>`);
  if (j.closes) meta.push(`<div><dt>${esc(c.t('job.closes'))}</dt><dd><time datetime="${esc(j.closes)}">${esc(j.closes)}</time></dd></div>`);
  const body = `<article class="wrap pg__wrap pgp">${crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.careers.title'), '/' + l + '/careers'], [j.title]])}
<header class="pg__head"><h1 class="h2">${esc(j.title)}</h1>${meta.length ? `<dl class="specs">${meta.join('')}</dl>` : ''}</header>
${j.description ? `<section class="pgp__about"><h2>${esc(c.t('job.about'))}</h2>${para(j.description)}</section>` : ''}
${j.requirements ? `<section class="pgp__about"><h2>${esc(c.t('job.req'))}</h2>${para(j.requirements)}</section>` : ''}
<section class="convert pgp__ask" id="apply" aria-labelledby="apply-h"><div class="convert__grid"><div><h2 class="h3" id="apply-h">${esc(c.t('job.apply'))}</h2><p class="lede">${esc(j.title)}</p><p><a class="btn" href="/${l}/careers">${esc(c.t('job.back'))}</a></p></div>${F.applyForm(c, { job: j })}</div></section></article>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.careers.title'), S.urls.careers(l)], [j.title, S.urls.job(l, j.slug)]]), S.jobNode(c, j)]);
  return page(c, { path, title, description: c.clip(j.description || (j.title + '. ' + c.t('pg.careers.lede')), 158), jsonld, nav: 'careers' }, body);
}
function notFoundPage(c) {
  const l = c.lang, path = (x) => '/' + x + '/';
  const body = `<div class="wrap pg__wrap pg__nf"><h1 class="h2">${esc(c.t('pg.404.title'))}</h1><p class="lede">${esc(c.t('pg.404.body'))}</p><p><a class="btn btn--primary" href="/${l}/">${esc(c.t('pg.404.cta'))}</a></p></div>`;
  return page(c, { path, title: `${c.t('pg.404.title')} | ${cfg.brand}`, description: c.t('pg.404.body'), noindex: true, nav: '' }, body);
}
function loginPage(c) {
  const l = c.lang, ar = l === 'ar', X = ar ? { t: 'تسجيل دخول الإدارة', e: 'البريد الإلكتروني', p: 'كلمة المرور', go: 'دخول', bad: 'البريد أو كلمة المرور غير صحيحة.', wait: 'محاولات كثيرة. حاول بعد دقائق.', fail: 'تعذّر الاتصال. حاول مرة أخرى.' } : { t: 'Admin sign in', e: 'Email', p: 'Password', go: 'Sign in', bad: 'Wrong email or password.', wait: 'Too many attempts. Try again in a few minutes.', fail: 'Could not connect. Please try again.' };
  const path = () => '/admin';
  const body = `<div class="wrap pg__wrap pg__login"><h1 class="h2">${esc(X.t)}</h1><form class="form" id="loginForm" novalidate data-msgs="${esc(JSON.stringify({ bad: X.bad, wait: X.wait, fail: X.fail, lang: l }))}">
<div class="field"><label for="l-email">${esc(X.e)}</label><input id="l-email" name="email" type="email" autocomplete="username" required dir="ltr"></div>
<div class="field"><label for="l-pass">${esc(X.p)}</label><input id="l-pass" name="password" type="password" autocomplete="current-password" required dir="ltr"></div>
<button class="btn btn--primary" type="submit">${esc(X.go)}</button><p class="status" id="loginStatus" role="alert" aria-live="polite"></p></form></div>`;
  return page(c, { path, title: `${X.t} | ${cfg.brand}`, description: X.t, noindex: true, nav: '' }, body).replace('<meta name="robots"', '<meta name="robots"');
}
module.exports = { crumbsHtml, careersPage, jobPage, propertiesPage, regionPage, propertyPage, notFoundPage, loginPage, head, page, indexable, para };
