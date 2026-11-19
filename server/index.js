'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const store = require('./db');
const auth = require('./auth');
const api = require('./api');
const catalog = require('./catalog');
const content = require('./content');
const { compress, pickEncoding, COMPRESSIBLE, parseCookies, sha, esc } = require('./util');
const Ctx = require('./render/ctx');
const Pages = require('./render/pages');
const { homePage } = require('./render/home');
const SEO = require('./render/seo');
const CP = require('./render/catalog_pages');
const T = require('./render/templates');
const SP = require('./render/sell_pages');
const sell = require('./sell');

const LANGS = ['ar', 'en'];
const REGION_IDS = Ctx.REGIONS.map((r) => r.id);
const MIME = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const BOT = /bot|crawl|spider|slurp|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|telegram|preview|bing|yandex|baidu|duckduck/i;

/* ---- headers ---- */
function baseHeaders() {
  const h = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', 'Cross-Origin-Opener-Policy': 'same-origin' };
  if (cfg.secure) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}
function csp(inline) {
  const hashes = inline.map((s) => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'").join(' ');
  return ["default-src 'self'", `script-src 'self' ${hashes} https://cdnjs.cloudflare.com`.replace(/\s+/g, ' '), "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", 'font-src https://fonts.gstatic.com', "img-src 'self' data: blob: https:", "connect-src 'self'", "worker-src 'self' blob:", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join('; ');
}

/* ---- response helpers ---- */
function send(req, res, status, body, type, extra) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const headers = Object.assign(baseHeaders(), { 'Content-Type': type, Vary: 'Accept-Encoding' }, extra);
  const enc = COMPRESSIBLE.test(type) && buf.length > 700 ? pickEncoding(req) : '';
  const out = enc ? compress(enc, buf, headers.ETag || '') : buf;
  if (enc) headers['Content-Encoding'] = enc;
  headers['Content-Length'] = out.length;
  res.writeHead(status, headers); res.end(req.method === 'HEAD' ? undefined : out);
}
const redirect = (res, status, to, extra) => { res.writeHead(status, Object.assign(baseHeaders(), { Location: to, 'Cache-Control': status === 301 ? 'public, max-age=3600' : 'no-store' }, extra)); res.end(); };

/* ---- language choice for the bare address ---- */
function pickLang(req) {
  const ck = parseCookies(req.headers.cookie).iconic_lang; if (LANGS.includes(ck)) return ck;
  const items = String(req.headers['accept-language'] || '').split(',').map((s) => { const [tag, q] = s.trim().split(';q='); return { tag: (tag || '').toLowerCase(), q: q === undefined ? 1 : Number(q) || 0 }; }).sort((a, b) => b.q - a.q);
  for (const it of items) { if (it.tag.startsWith('ar')) return 'ar'; if (it.tag.startsWith('en')) return 'en'; }
  return cfg.defaultLang;
}

/* ---- page cache: one entry per page, dropped whenever content changes ---- */
const cache = new Map(); let cacheV = -1;
function cached(key, build) {
  if (cacheV !== store.version) { cache.clear(); cacheV = store.version; }
  let e = cache.get(key);
  if (!e) { const r = build(); e = { html: r.html, status: r.status || 200, csp: csp(r.inline || []), etag: '"' + sha(r.html, 20) + '"' }; if (cache.size > 800) cache.clear(); cache.set(key, e); }
  return e;
}
const fkey = (f) => [f.developer, f.project, f.area, f.city].map((x) => (x ? x.id : '')).concat([f.type || '', f.purpose || '', f.beds || '']).join('-');
const ctxFor = (lang) => Ctx.make(lang, content.snapshot());
function sendPage(req, res, e) {
  if (req.headers['if-none-match'] === e.etag && e.status === 200) { res.writeHead(304, Object.assign(baseHeaders(), { ETag: e.etag, 'Cache-Control': 'no-cache' })); return res.end(); }
  send(req, res, e.status, e.html, 'text/html; charset=utf-8', { ETag: e.etag, 'Content-Security-Policy': e.csp, 'Cache-Control': e.status === 200 ? 'no-cache' : 'no-store' });
}

/* ---- static files ---- */
const files = new Map();
function staticFile(req, res, abs, immutable) {
  let f = files.get(abs);
  if (!f) {
    let buf; try { buf = fs.readFileSync(abs); } catch (_) { return false; }
    f = { buf, type: MIME[path.extname(abs)] || 'application/octet-stream', etag: '"' + sha(buf, 20) + '"' }; files.set(abs, f);
  }
  if (req.headers['if-none-match'] === f.etag) { res.writeHead(304, Object.assign(baseHeaders(), { ETag: f.etag })); res.end(); return true; }
  send(req, res, 200, f.buf, f.type, { ETag: f.etag, 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400' });
  return true;
}
const PUBLIC_FILES = new Set(['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-default.png', 'logo.svg', 'mark.svg']);

function notFound(req, res, lang) {
  const e = cached('404:' + lang, () => ({ html: Pages.notFoundPage(ctxFor(lang)), status: 404 }));
  sendPage(req, res, e);
}

async function route(req, res) {
  const url = new URL(req.url, 'http://x'); let p = url.pathname;
  // Separate paths keep the website independent of legacy CRM routes on a shared host.
  if (p === '/iconic-api' || p.startsWith('/iconic-api/')) {
    url.pathname = '/api' + p.slice('/iconic-api'.length);
    return api.handle(req, res, url);
  }
  if (p.startsWith('/api/') || p === '/api') return api.handle(req, res, url);
  if (p.startsWith('/iconic-assets/')) p = '/assets/' + p.slice('/iconic-assets/'.length);
  const m = req.method;
  if (m !== 'GET' && m !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }

  if (p.startsWith('/_blob/')) return api.serveBlob(req, res, p.slice(7));
  if (p.startsWith('/assets/') && /^\/assets\/[\w.\-]+$/.test(p)) { if (staticFile(req, res, path.join(T.publicDir, p), true)) return; return notFound(req, res, pickLang(req)); }
  if (p.startsWith('/vendor/') && /^\/vendor\/[\w.\-]+$/.test(p)) { if (staticFile(req, res, path.join(T.publicDir, p), false)) return; return notFound(req, res, pickLang(req)); }
  if (PUBLIC_FILES.has(p.slice(1))) { if (staticFile(req, res, path.join(T.publicDir, p.slice(1)), false)) return; return notFound(req, res, pickLang(req)); }
  if (p === '/healthz') return send(req, res, 200, 'ok', 'text/plain; charset=utf-8', { 'Cache-Control': 'no-store' });
  if (p === '/robots.txt') return send(req, res, 200, SEO.robots(), 'text/plain; charset=utf-8', { 'Cache-Control': 'public, max-age=3600' });
  if (p === '/sitemap.xml') {
    const e = cached('sitemap', () => ({ html: SEO.sitemap(ctxFor) }));
    return send(req, res, 200, e.html, 'application/xml; charset=utf-8', { ETag: e.etag, 'Cache-Control': 'public, max-age=900' });
  }
  if (p === '/site.webmanifest') { const l = url.searchParams.get('lang') === 'en' ? 'en' : 'ar'; return send(req, res, 200, JSON.stringify(SEO.manifest(l)), 'application/manifest+json; charset=utf-8', { 'Cache-Control': 'public, max-age=86400' }); }

  if (p === '/') return redirect(res, 302, '/' + pickLang(req) + '/', { Vary: 'Accept-Language, Cookie' });
  if (p === '/index.html') return redirect(res, 301, '/');
  if (p === '/admin' || p === '/admin/') {
    const lang = pickLang(req);
    if (auth.session(req)) return redirect(res, 302, '/' + lang + '/#admin');
    return sendPage(req, res, cached('login:' + lang, () => ({ html: Pages.loginPage(ctxFor(lang)) })));
  }

  const seg = p.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch (_) { return s; } });
  const lang = seg[0];
  if (!LANGS.includes(lang)) return notFound(req, res, pickLang(req));
  const trailing = p.endsWith('/');
  /* canonical forms: the home page ends with a slash, everything else does not */
  if (seg.length === 1 && !trailing) return redirect(res, 301, '/' + lang + '/' + url.search);
  if (seg.length > 1 && trailing) return redirect(res, 301, p.replace(/\/+$/, '') + url.search);

  if (seg.length === 1) {
    const bot = BOT.test(String(req.headers['user-agent'] || ''));
    return sendPage(req, res, cached('home:' + lang + (bot ? ':bot' : ''), () => homePage(ctxFor(lang), { bot })));
  }
  if (seg[1] === 'properties' && seg.length === 2) {
    const f = CP.resolveFilters(ctxFor(lang), url.searchParams);
    return sendPage(req, res, cached('props:' + lang + ':' + fkey(f), () => ({ html: CP.propertiesPage(ctxFor(lang), f) })));   // a filtered view is kept out of search engines
  }
  /* ICONIC CRM catalog pages. A project that is inactive or gone, or a record this site does not know, is a 404. */
  if (seg[1] === 'developers' && seg.length === 2) return sendPage(req, res, cached('devs:' + lang, () => ({ html: CP.developersPage(ctxFor(lang)) })));
  if (seg[1] === 'developers' && seg.length === 3) {
    if (!ctxFor(lang).catalog.developers.some((x) => x.slug === seg[2])) return notFound(req, res, lang);
    return sendPage(req, res, cached('dev:' + lang + ':' + seg[2], () => { const c = ctxFor(lang); return { html: CP.developerPage(c, c.catalog.developers.find((x) => x.slug === seg[2])) }; }));
  }
  if (seg[1] === 'projects' && seg.length === 2) {
    const f = CP.resolveFilters(ctxFor(lang), url.searchParams);
    return sendPage(req, res, cached('projs:' + lang + ':' + fkey(f), () => ({ html: CP.projectsPage(ctxFor(lang), f) })));
  }
  if (seg[1] === 'projects' && seg.length === 3) {
    if (!ctxFor(lang).catalog.shownProjects.some((x) => x.slug === seg[2])) return notFound(req, res, lang);
    return sendPage(req, res, cached('proj:' + lang + ':' + seg[2], () => { const c = ctxFor(lang); return { html: CP.projectPage(c, c.catalog.shownProjects.find((x) => x.slug === seg[2])) }; }));
  }
  if (seg[1] === 'areas' && seg.length === 3) {
    if (!ctxFor(lang).catalog.areas.some((x) => x.slug === seg[2])) return notFound(req, res, lang);
    return sendPage(req, res, cached('area:' + lang + ':' + seg[2], () => { const c = ctxFor(lang); return { html: CP.areaPage(c, c.catalog.areas.find((x) => x.slug === seg[2])) }; }));
  }
  if (seg[1] === 'properties' && seg.length === 3) {
    if (!REGION_IDS.includes(seg[2])) return notFound(req, res, lang);
    return sendPage(req, res, cached('region:' + lang + ':' + seg[2], () => ({ html: Pages.regionPage(ctxFor(lang), seg[2]) })));
  }
  /* "sell your unit": the form is an ordinary cached page; the sender's own page is private, built fresh each time and never kept by caches or search engines */
  if (seg[1] === 'sell' && seg.length === 2) return sendPage(req, res, cached('sell:' + lang, () => ({ html: SP.sellPage(ctxFor(lang)) })));
  if (seg[1] === 'sell' && seg.length === 4 && seg[2] === 'track') {
    const t = sell.track(seg[3]); if (!t) return notFound(req, res, lang);
    return send(req, res, 200, SP.trackPage(ctxFor(lang), t), 'text/html; charset=utf-8', { 'Content-Security-Policy': csp([]), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' });
  }
  if (seg[1] === 'careers' && seg.length === 2) return sendPage(req, res, cached('careers:' + lang + ':' + new Date().toISOString().slice(0, 10), () => ({ html: Pages.careersPage(ctxFor(lang)) })));
  if (seg[1] === 'careers' && seg.length === 3) {
    const job = ctxFor(lang).jobs.find((x) => x.slug === seg[2]); if (!job) return notFound(req, res, lang);
    return sendPage(req, res, cached('job:' + lang + ':' + job.slug + ':' + new Date().toISOString().slice(0, 10), () => { const c = ctxFor(lang); return { html: Pages.jobPage(c, c.jobs.find((x) => x.slug === job.slug)) }; }));
  }
  if (seg[1] === 'property' && seg.length === 3) {
    const c = ctxFor(lang); let prop = c.props.find((x) => x.slug === seg[2]);
    if (!prop) { const tail = seg[2].split('-').pop(); const moved = tail && tail.length >= 5 ? c.props.find((x) => x.slug.endsWith('-' + tail)) : null; if (moved) return redirect(res, 301, moved.url); return notFound(req, res, lang); }
    return sendPage(req, res, cached('prop:' + lang + ':' + prop.slug, () => ({ html: Pages.propertyPage(ctxFor(lang), prop) })));
  }
  return notFound(req, res, lang);
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    const status = e && e.status && e.status < 600 ? e.status : 500;
    if (status >= 500) console.error('[error]', req.method, req.url, e && e.stack || e);
    if (res.headersSent) return res.end();
    if ((req.url || '').startsWith('/api/') || (req.url || '').startsWith('/iconic-api/')) return api.json(res, status, { error: status >= 500 ? 'Server error' : (e.message || 'error') });
    res.writeHead(status, Object.assign(baseHeaders(), { 'Content-Type': 'text/plain; charset=utf-8' })); res.end(status >= 500 ? 'Server error' : 'Request error');
  });
});
server.headersTimeout = 20000; server.requestTimeout = 60000; server.keepAliveTimeout = 5000;

function start() {
  const made = auth.ensureAdmin();
  if (made === true) console.log('[setup] admin account created for ' + cfg.adminEmail + '. Remove ADMIN_PASSWORD from the environment now.');
  if (made === null) console.log('[setup] No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) and restart, or run: node server/cli.js create-admin');
  auth.getSecret();
  catalog.startLink();
  server.listen(cfg.port, cfg.host, () => console.log(`[ready] ${cfg.brand} on ${cfg.host}:${cfg.port}  site=${cfg.siteUrl}`));
  const stop = () => { catalog.stopLink(); server.close(() => { try { store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); store.db.close(); } catch (_) { /* closing anyway */ } process.exit(0); }); setTimeout(() => process.exit(0), 8000).unref(); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
if (require.main === module) start();
module.exports = { server, start, route };
