'use strict';
const cfg = require('../config');
const { esc } = require('../util');
const F = require('./frag');

const root = (lang) => cfg.siteUrl + '/' + lang + '/';
const urls = {
  home: (l) => '/' + l + '/', props: (l) => '/' + l + '/properties', region: (l, id) => '/' + l + '/properties/' + id, prop: (l, slug) => '/' + l + '/property/' + slug
};
const orgId = () => cfg.siteUrl + '/#organization';

function orgNode(c) {
  const co = c.company, tel = String(co.phone || co.whatsapp || '').replace(/[^\d+]/g, '');
  const same = F.SOCIAL_NAMES.map(([k]) => F.httpsUrl(co.social[k])).filter(Boolean);
  return {
    '@type': 'RealEstateAgent', '@id': orgId(), name: cfg.brand, url: root(c.lang), logo: c.abs('/icon-512.png'), image: c.abs('/og-default.png'), description: c.t('meta.desc'),
    telephone: tel || undefined, email: co.email || undefined,
    address: co.address ? { '@type': 'PostalAddress', streetAddress: co.address, addressCountry: 'EG' } : undefined,
    areaServed: c.REGIONS.map((r) => ({ '@type': 'AdministrativeArea', name: r[c.lang], containedInPlace: { '@type': 'Country', name: c.lang === 'ar' ? 'مصر' : 'Egypt' } })),
    sameAs: same.length ? same : undefined, availableLanguage: ['ar', 'en']
  };
}
const siteNode = (c) => ({ '@type': 'WebSite', '@id': cfg.siteUrl + '/#website', url: root(c.lang), name: cfg.brand, inLanguage: c.lang === 'ar' ? 'ar-EG' : 'en', publisher: { '@id': orgId() } });
function crumbs(c, items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: it[1] ? cfg.siteUrl + it[1] : undefined })) };
}
function listingNode(c, p) {
  const where = [p.location, c.regionName(p.region)].filter(Boolean).join(', ');
  return {
    '@type': 'RealEstateListing', '@id': cfg.siteUrl + urls.prop(c.lang, p.slug) + '#listing', url: cfg.siteUrl + urls.prop(c.lang, p.slug), name: p.title, description: c.clip(p.description || p.title, 300),
    image: p.images.length ? p.images.map(c.abs) : undefined, dateModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined, inLanguage: c.lang === 'ar' ? 'ar-EG' : 'en',
    offers: p.price != null ? { '@type': 'Offer', price: p.price, priceCurrency: p.currency, businessFunction: p.purpose === 'rent' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell' } : undefined,
    contentLocation: where ? { '@type': 'Place', name: where, address: { '@type': 'PostalAddress', addressRegion: c.regionName(p.region), addressCountry: 'EG' } } : undefined,
    provider: { '@id': orgId() }
  };
}
const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });

/* ---- sitemap: only pages that have real content, each with its language alternates ---- */
function entries(c0, ctxFor) {
  const out = [], cs = { en: ctxFor('en'), ar: ctxFor('ar') };
  const alt = (fn) => ['en', 'ar'].map((l) => [l, cfg.siteUrl + fn(l)]).concat([['x-default', cfg.siteUrl + fn(cfg.defaultLang)]]);
  const top = cs.en.updated || Date.now();
  out.push({ alt: alt(urls.home), lastmod: top }); out.push({ alt: alt(urls.props), lastmod: top });
  F.activeRegions(cs.en).forEach((r) => {
    const ps = cs.en.props.filter((p) => p.region === r.id); if (!ps.length) return;
    out.push({ alt: alt((l) => urls.region(l, r.id)), lastmod: Math.max(...ps.map((p) => p.updatedAt)) });
  });
  cs.en.props.forEach((p) => out.push({ alt: alt((l) => urls.prop(l, p.slug)), lastmod: p.updatedAt, images: p.images.map(cs.en.abs), title: p.title }));
  return out;
}
function sitemap(ctxFor) {
  const rows = entries(null, ctxFor).map((e) => {
    const loc = e.alt.find((a) => a[0] === 'en')[1], links = e.alt.map(([l, u]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(u)}"/>`).join('');
    const mk = (l, u) => `<url><loc>${esc(u)}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''}${links}${(e.images || []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`;
    return mk('en', loc) + mk('ar', e.alt.find((a) => a[0] === 'ar')[1]);
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + rows.join('') + '</urlset>';
}
function robots() {
  const open = cfg.siteUrl.startsWith('https://') || process.env.ALLOW_INDEXING === '1';
  return (open ? 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n' : 'User-agent: *\nDisallow: /\n') + '\nSitemap: ' + cfg.siteUrl + '/sitemap.xml\n';
}
const manifest = (lang) => ({ name: cfg.brand, short_name: 'ICONIC', start_url: '/' + lang + '/', scope: '/', display: 'standalone', background_color: '#050507', theme_color: '#050507', lang, dir: lang === 'ar' ? 'rtl' : 'ltr', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] });

module.exports = { urls, orgNode, siteNode, crumbs, listingNode, graph, sitemap, robots, manifest, root };
