'use strict';
/* Fills the site-owned part of CRM projects (description and pictures) from a reviewed JSON file.
   Safe by design: projects are matched by their exact CRM name, nothing that is already there is replaced,
   every picture is checked by its own bytes (type, size, dimensions), and a dry run (the default) writes nothing.

   File format: [{ "project": "Madinaty", "developer": "TMG" (optional, only to tell same-named projects apart),
                   "description": { "en": "...", "ar": "..." }, "images": ["https://.../a.jpg", ...] }] */
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const cfg = require('./config');
const store = require('./db');
const catalog = require('./catalog');
const { sha } = require('./util');
const { norm } = require('./catalog_admin');

const HARD_CAP = 12 * 1024 * 1024;   // never read more than this from one URL
const MAX_IMAGES = 8;

/* ---- the picture's own bytes decide what it is ---- */
function sniff(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return '';
}
function dims(b, mime) {
  try {
    if (mime === 'image/png') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + len;
      }
    }
    if (mime === 'image/webp') {
      const k = b.slice(12, 16).toString('latin1');
      if (k === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      if (k === 'VP8X') return { w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
    }
  } catch (_) { /* fall through */ }
  return null;
}

/* ---- download: https only, no IP addresses or local names, limited redirects and size ---- */
function checkUrl(u, allowHttp) {
  let x; try { x = new URL(u); } catch (_) { throw new Error('not a URL'); }
  if (allowHttp) { if (x.protocol !== 'https:' && x.protocol !== 'http:') throw new Error('http(s) only'); return x; }
  if (x.protocol !== 'https:') throw new Error('https only');
  if (net.isIP(x.hostname) || /^(localhost|.*\.local|.*\.internal)$/i.test(x.hostname)) throw new Error('public host names only');
  return x;
}
function fetchBuf(url, o, hops = 0) {
  return new Promise((resolve, reject) => {
    let x; try { x = checkUrl(url, o.allowHttp); } catch (e) { return reject(e); }
    const mod = x.protocol === 'http:' ? http : https;
    const req = mod.get(x, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IconicSiteImport/1.0)', Accept: 'image/jpeg,image/png,image/webp,*/*;q=0.5' }, timeout: o.timeout || 25000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (hops >= 3) return reject(new Error('too many redirects'));
        return resolve(fetchBuf(new URL(res.headers.location, x).href, o, hops + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const declared = Number(res.headers['content-length'] || 0);
      if (declared > HARD_CAP) { res.resume(); return reject(new Error('file is larger than ' + (HARD_CAP >> 20) + ' MB')); }
      const parts = []; let n = 0;
      res.on('data', (c) => { n += c.length; if (n > HARD_CAP) { req.destroy(new Error('file is larger than ' + (HARD_CAP >> 20) + ' MB')); } else parts.push(c); });
      res.on('end', () => resolve(Buffer.concat(parts)));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timed out')));
    req.on('error', reject);
  });
}

function saveAsset(buf, mime) {
  const id = sha(buf, 24), dir = path.join(cfg.dataDir, 'uploads'), file = path.join(dir, id);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) { fs.writeFileSync(file + '.tmp', buf); fs.renameSync(file + '.tmp', file); }
  store.db.prepare('INSERT OR IGNORE INTO assets (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)').run(id, mime, buf.length, Date.now());
  return id;
}

const has = (v) => !!(v && typeof v === 'object' && ((v.en && String(v.en).trim()) || (v.ar && String(v.ar).trim())));
const label = (n) => String(n || '');

async function importContent(items, o = {}) {
  const apply = o.apply === true, maxBytes = o.maxBytes || 1800 * 1024, minWidth = o.minWidth || 900;
  if (!Array.isArray(items)) throw new Error('the file must hold a list');
  const live = store.listDocs('projects').filter((d) => !d.data.crmDeleted && d.data.name);
  const byName = new Map();
  for (const d of live) { const k = norm(d.data.name); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(d); }
  const rep = { applied: apply, totals: { projects: 0, descriptionsSet: 0, descriptionsKept: 0, imagesAdded: 0, imagesRejected: 0, notFound: 0, ambiguous: 0 }, rows: [] };

  for (const it of items) {
    const row = { project: label(it && it.project), notes: [], images: [] };
    rep.rows.push(row); rep.totals.projects++;
    const hits = byName.get(norm(row.project)) || [];
    let doc = hits.length === 1 ? hits[0] : null;
    if (hits.length > 1 && it.developer) {
      const f = hits.filter((d) => { const dev = store.getDoc('developers', 'd_' + d.data.developerId); return dev && norm(dev.data.name) === norm(it.developer); });
      if (f.length === 1) doc = f[0];
    }
    if (!doc) { row.status = hits.length ? 'ambiguous' : 'not found'; rep.totals[hits.length ? 'ambiguous' : 'notFound']++; continue; }
    const cur = doc.data, out = {};
    row.status = 'ok';

    if (it.description && (has(it.description))) {
      if (has(cur.description)) { row.notes.push('description kept (already written)'); rep.totals.descriptionsKept++; }
      else { out.description = { en: String(it.description.en || ''), ar: String(it.description.ar || '') }; row.notes.push('description set'); rep.totals.descriptionsSet++; }
    }
    if (Array.isArray(it.images) && it.images.length) {
      if ((cur.images || []).length) row.notes.push('pictures kept (already added)');
      else {
        const ids = [];
        for (const url of it.images.slice(0, MAX_IMAGES)) {
          const im = { url, ok: false };
          row.images.push(im);
          try {
            const buf = await fetchBuf(url, o), mime = sniff(buf);
            if (!mime) throw new Error('not a JPEG, PNG or WebP picture');
            const d = dims(buf, mime);
            if (!d) throw new Error('could not read its size');
            if (d.w < minWidth) throw new Error('too small (' + d.w + 'px wide, need ' + minWidth + ')');
            if (buf.length > maxBytes) throw new Error('too heavy (' + Math.round(buf.length / 1024) + ' KB, limit ' + Math.round(maxBytes / 1024) + ')');
            if (d.w < d.h * 0.9) throw new Error('portrait picture (' + d.w + 'x' + d.h + ')');
            Object.assign(im, { ok: true, kb: Math.round(buf.length / 1024), w: d.w, h: d.h, mime });
            if (apply) ids.push({ id: saveAsset(buf, mime) });
            else ids.push(null);
            rep.totals.imagesAdded++;
          } catch (e) { im.error = e.message; rep.totals.imagesRejected++; }
        }
        const good = ids.filter(Boolean);
        if (apply && good.length) out.images = good;
        if (!row.images.some((x) => x.ok)) row.notes.push('no usable picture');
      }
    }
    if (apply && Object.keys(out).length) {
      catalog.siteUpdate('project', doc.data.crmId, out);
      catalog.log('content', true, 'project ' + row.project + ': ' + Object.keys(out).join(', ') + (out.images ? ' (' + out.images.length + ' pictures from ' + [...new Set(row.images.filter((x) => x.ok).map((x) => { try { return new URL(x.url).hostname; } catch (_) { return '?'; } }))].join(', ') + ')' : ''));
    }
  }
  return rep;
}

module.exports = { importContent, sniff, dims };
