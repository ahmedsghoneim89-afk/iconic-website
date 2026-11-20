'use strict';
/* The drop-down lists the company edits from the dashboard: unit types and purposes.
   The shipped choices live in i18n.json; once the dashboard saves, its copy (site/lists) is the one in use. Choices are never deleted while a unit
   or a request uses them: they are hidden instead, which keeps every old record readable. */
const I = require('./i18n.json');
const store = require('./db');
const KINDS = ['types', 'purposes'];
const FIELD = { types: 'type', purposes: 'purpose' };

const defaults = (kind) => I[kind].map((x) => ({ id: x[0], en: x[1].en, ar: x[1].ar, active: true }));
/* a saved document may hold one list or both; what it lacks falls back to the shipped choices */
function normalize(doc) {
  const out = {};
  for (const k of KINDS) out[k] = doc && Array.isArray(doc[k]) && doc[k].length ? doc[k] : defaults(k);
  return out;
}
function read() { const d = store.getDoc('site', 'lists'); return normalize(d && d.data); }
/* every id that exists, hidden or not: what a stored unit may carry */
const ids = (kind) => read()[kind].map((x) => x.id);
/* the same lists as [id, {en, ar}] pairs, the shape the pages use for labels; a missing language shows the other one */
const pairs = (list) => list.map((x) => [x.id, { en: x.en || x.ar, ar: x.ar || x.en }]);

/* how many units and sell requests use each choice */
function usage() {
  const out = { types: new Map(), purposes: new Map() };
  const bump = (m, id) => { if (id) m.set(id, (m.get(id) || 0) + 1); };
  for (const d of store.listDocs('properties')) { bump(out.types, d.data.type); bump(out.purposes, d.data.purpose); }
  try {
    for (const r of store.db.prepare('SELECT type, COUNT(*) AS n FROM sell_requests GROUP BY type').all()) if (r.type) out.types.set(r.type, (out.types.get(r.type) || 0) + r.n);
    for (const r of store.db.prepare('SELECT purpose, COUNT(*) AS n FROM sell_requests GROUP BY purpose').all()) if (r.purpose) out.purposes.set(r.purpose, (out.purposes.get(r.purpose) || 0) + r.n);
  } catch (_) { /* no requests table yet */ }
  return out;
}
/* a save may rename, reorder, hide and add; it may not drop a choice that is still in use */
function assertSafe(next) {
  const cur = read(), used = usage();
  for (const k of KINDS) {
    if (!next[k]) continue;
    const keep = new Set(next[k].map((x) => x.id));
    for (const x of cur[k]) if (!keep.has(x.id) && used[k].get(x.id)) { const e = new Error('in_use:' + k + ':' + x.id + ':' + used[k].get(x.id)); e.status = 409; throw e; }
  }
}
module.exports = { KINDS, FIELD, defaults, normalize, read, ids, pairs, usage, assertSafe };
