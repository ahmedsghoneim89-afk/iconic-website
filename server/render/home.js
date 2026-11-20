'use strict';
const cfg = require('../config');
const { esc, jsonForScript } = require('../util');
const F = require('./frag');
const S = require('./seo');
const T = require('./templates');
const P = require('./pages');
const CP = require('./catalog_pages');

const other = (l) => (l === 'ar' ? 'en' : 'ar');
const strip = (o) => { const x = Object.assign({}, o); delete x._u; return x; };

/* the home page: the designed experience, with its content already in the HTML so search engines and slow phones get it at once */
function homePage(c, opts) {
  opts = opts || {};
  const l = c.lang, inline = [];
  let b = T.homeBody;
  b = b.replace(/(<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, old, close) => open + esc(c.t(key)) + close);
  b = b.replace('<!--SSR:cards-->', F.cards(c, c.props)).replace('<!--SSR:teams-->', F.teams(c)).replace('<!--SSR:pillars-->', F.pillars(c))
    .replace('<!--SSR:catalog-->', CP.homeBlock(c)).replace('<!--SSR:filters-->', () => CP.unitFilterBlock(c, CP.resolveFilters(c, null))).replace('<!--SSR:navcat-->', c.catalog.shownProjects.length ? `<li><a class="nav__link" href="/${l}/projects">${esc(c.t('nav.projects'))}</a></li><li><a class="nav__link" href="/${l}/developers">${esc(c.t('nav.developers'))}</a></li>` : '')
    .replace('<!--SSR:actions-->', F.contactActions(c)).replace('<!--SSR:info-->', F.contactInfo(c, { branches: false })).replace('<!--SSR:branches-->', F.branchesSection(c))
    .replace('<!--SSR:count-->', c.props.length ? esc(c.t('props.count', { n: c.fmtNum(c.props.length) })) : '')
    .replace('<!--SSR:year-->', String(new Date().getFullYear()));
  if (c.props.length) b = b.replace('<div class="empty" id="propsEmpty">', '<div class="empty" id="propsEmpty" hidden>');
  if (c.teams.length) b = b.replace('<div class="empty" id="teamsEmpty">', '<div class="empty" id="teamsEmpty" hidden>');
  if (!c.layout.teams) b = b.replace('<section class="teams" id="teams"', '<section class="teams" id="teams" hidden').replace('<li><a class="nav__link" href="#teams"', '<li hidden><a class="nav__link" href="#teams"').replace('<li><a href="#teams" data-chap="teams">', '<li hidden><a href="#teams" data-chap="teams">');
  if (!c.layout.about) b = b.replace('<section class="story" id="about"', '<section class="story" id="about" hidden').replace('<li><a class="nav__link" href="#about"', '<li hidden><a class="nav__link" href="#about"').replace('<li><a href="#about" data-chap="about">', '<li hidden><a href="#about" data-chap="about">');
  b = b.split('/__LANG__/').join('/' + l + '/');
  const o2 = other(l);
  b = b.replace(/<button class="lang"[^>]*>[^<]*<\/button>/, `<a class="lang" id="langBtn" href="/${o2}/" hreflang="${o2}" lang="${o2}" aria-label="${esc(c.t('lang.aria'))}">${esc(c.t('lang.label'))}</a>`);

  const strip1 = (a) => (Array.isArray(a) ? a.map(strip) : a);
  const boot = { lang: l, site: cfg.siteUrl, alt: { en: '/en/', ar: '/ar/' }, data: { company: c.raw.company, texts: c.raw.texts, hotspots: c.raw.hotspots, about: c.raw.about, layout: c.raw.layout, teams: strip1(c.raw.teams), agents: strip1(c.raw.agents), properties: strip1(c.rawProps), branches: strip1(c.raw.branches) } };
  const headJs = `(function(){var d=document.documentElement;d.classList.add('js');try{history.scrollRestoration='manual';}catch(e){}try{document.cookie='iconic_lang=${l};path=/;max-age=31536000;SameSite=Lax';}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('reduced');else if(!${opts.bot ? 'true' : 'false'}&&!location.hash)d.classList.add('intro-on');}catch(e){if(!${opts.bot ? 'true' : 'false'})d.classList.add('intro-on');}})();`;
  const bootJs = 'window.__ICONIC__=' + jsonForScript(boot) + ';';
  inline.push(headJs, bootJs);

  const path = S.urls.home;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c)]);
  const [gsap, st, three] = T.vendorUrls();
  const html = `<!DOCTYPE html>
<html lang="${l}" dir="${c.dir}">
<head>
${P.head(c, { path, title: c.t('meta.title'), description: c.t('meta.desc'), jsonld })}
<script>${headJs}</script>
<script>${bootJs}</script>
</head>
<body>
${b}
<script defer src="${gsap}"></script><script defer src="${st}"></script><script defer src="${three}"></script>
<script defer src="/iconic-assets/${T.assets.js}"></script>
</body>
</html>`;
  return { html, inline };
}
module.exports = { homePage };
