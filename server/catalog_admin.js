'use strict';
/* Dashboard side of the catalog: the lists the screens draw from, and linking existing units to CRM projects by name. */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const store = require('./db');
const cat = require('./catalog');

const label = (v) => (v && typeof v === 'object') ? (v.en || v.ar || '') : String(v || '');

function all() {
  const out = {};
  for (const e of cat.ENTITIES) out[cat.COL[e]] = store.listDocs(cat.COL[e]).filter((d) => !d.data.crmDeleted).map((d) => cat.docView(e, d)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const props = store.listDocs('properties'), ids = new Set(out.projects.map((p) => p.id));
  out.units = props.map((p) => ({ id: p.id, title: label(p.data.title), projectId: ids.has(p.data.projectId) ? p.data.projectId : '', projectText: label(p.data.project) }));
  out.status = cat.status();
  return out;
}

/* One name, however it was typed: no diacritics, one kind of alef/yaa/taa marbuta, no punctuation, lower case. A match must be exact after that. */
const norm = (s) => String(s || '').normalize('NFKD').replace(/[̀-ًͯ-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/* Looks at every unit that has no project link yet and finds the one CRM project whose name equals its project text (English or Arabic).
   Only a single, unambiguous match is linked. Everything else is listed so a person can decide. Nothing but `projectId` is ever written. */
function linkUnits(o = {}) {
  const apply = o.apply === true;
  const projects = store.listDocs('projects').filter((d) => !d.data.crmDeleted && d.data.name);
  const byName = new Map();
  for (const d of projects) { const k = norm(d.data.name); if (!k) continue; if (!byName.has(k)) byName.set(k, []); byName.get(k).push(d); }
  const live = new Set(projects.map((d) => d.data.crmId));
  const rep = { at: Date.now(), applied: apply, totals: { units: 0, alreadyLinked: 0, linked: 0, ambiguous: 0, missing: 0, noProjectText: 0, brokenLink: 0 }, linked: [], ambiguous: [], missing: [], brokenLinks: [] };
  const writes = [];
  for (const p of store.listDocs('properties')) {
    const d = p.data, title = label(d.title) || p.id; rep.totals.units++;
    if (d.projectId) {
      if (live.has(d.projectId)) rep.totals.alreadyLinked++;
      else { rep.totals.brokenLink++; rep.brokenLinks.push({ unit: p.id, title, projectId: d.projectId }); }   // the project was deleted in the CRM; the unit keeps its text and stays on the site
      continue;
    }
    const raw = [d.project && d.project.en, d.project && d.project.ar].map((x) => String(x || '').trim()).filter(Boolean), keys = [...new Set(raw.map(norm).filter(Boolean))];
    if (!keys.length) { rep.totals.noProjectText++; continue; }
    const hits = new Map(); for (const k of keys) for (const m of byName.get(k) || []) hits.set(m.data.crmId, m);
    if (hits.size === 1) {
      const m = [...hits.values()][0]; rep.totals.linked++;
      rep.linked.push({ unit: p.id, title, text: raw.join(' / '), project: m.data.name, projectId: m.data.crmId });
      writes.push([p.id, Object.assign({}, d, { projectId: m.data.crmId })]);
    } else if (hits.size > 1) { rep.totals.ambiguous++; rep.ambiguous.push({ unit: p.id, title, text: raw.join(' / '), candidates: [...hits.values()].map((m) => ({ projectId: m.data.crmId, name: m.data.name })) }); }
    else { rep.totals.missing++; rep.missing.push({ unit: p.id, title, text: raw.join(' / ') }); }
  }
  if (apply && writes.length) store.transaction((t) => { for (const [id, data] of writes) t.put('properties', id, data); });
  if (apply) {
    try { const dir = path.join(cfg.dataDir, 'backups'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'catalog-link-report-' + new Date(rep.at).toISOString().replace(/[:.]/g, '-') + '.json'), JSON.stringify(rep, null, 2)); } catch (_) { /* the report is also returned */ }
    cat.log('link-units', true, rep.totals.linked + ' linked, ' + rep.totals.ambiguous + ' ambiguous, ' + rep.totals.missing + ' missing');
  }
  return rep;
}

module.exports = { all, linkUnits, norm };
