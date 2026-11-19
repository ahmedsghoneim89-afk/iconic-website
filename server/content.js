'use strict';
/* Reads and writes content documents and builds the snapshot the pages are drawn from. */
const store = require('./db');
const { validate, readable } = require('./schema');
const { slugBase, httpError } = require('./util');

const SITE_IDS = ['company', 'texts', 'hotspots', 'about', 'layout', 'regions'];
let cache = null, cacheVersion = -1;

function snapshot() {
  if (cache && cacheVersion === store.version) return cache;
  const raw = { company: null, texts: null, hotspots: null, about: null, layout: null, regions: null, teams: [], agents: [], properties: [], branches: [], jobs: [], developers: [], projects: [], cities: [], areas: [] };
  let updated = 0;
  for (const d of store.allDocs()) {
    updated = Math.max(updated, d.updatedAt);
    if (d.col === 'site' && SITE_IDS.includes(d.id)) raw[d.id] = d.data;
    else if (raw[d.col] && Array.isArray(raw[d.col])) raw[d.col].push(Object.assign({ id: d.id, _u: d.updatedAt }, d.data));
  }
  const ord = (a, b) => (a.order == null ? 100 : a.order) - (b.order == null ? 100 : b.order) || String(a.id).localeCompare(String(b.id));
  ['teams', 'agents', 'properties', 'branches', 'jobs', 'developers', 'projects', 'cities', 'areas'].forEach((k) => raw[k].sort(ord));
  cache = { raw, updated, version: store.version }; cacheVersion = store.version;
  return cache;
}

function slugFor(id, data, fallback) {
  const base = slugBase((data.title && data.title.en) || (data.project && data.project.en) || '', fallback);
  return base + '-' + String(id).replace(/[^a-z0-9]/gi, '').slice(-7).toLowerCase();
}
function write(col, id, body) {
  const data = validate(col, id, body);
  if (col === 'properties') { const prev = store.getDoc(col, id); data.slug = (prev && prev.data.slug) || slugFor(id, data); }   // a unit keeps its address even when its title changes
  if (col === 'properties' && data.projectId) {   // a unit linked to a CRM project takes its website region from the project's city
    const pr = store.getDoc('projects', 'p_' + data.projectId);
    if (!pr || pr.data.crmDeleted) throw httpError(422, 'unknown project');
    const city = store.getDoc('cities', 'c_' + pr.data.cityId);
    if (city && !city.data.crmDeleted && city.data.region) data.region = city.data.region;
  }
  if (col === 'jobs') {   // a job keeps its address and its first publishing date
    const prev = store.getDoc(col, id);
    data.slug = (prev && prev.data.slug) || slugFor(id, data, 'job'); data.posted = (prev && prev.data.posted) || new Date().toISOString().slice(0, 10);
  }
  store.putDoc(col, id, data);
  return data;
}
function list(col) {
  if (!readable(col)) { const e = new Error('unknown collection'); e.status = 404; throw e; }
  return store.listDocs(col).map((d) => ({ id: d.id, data: d.data }));
}
function read(col, id) {
  if (!readable(col, id)) { const e = new Error('unknown document'); e.status = 404; throw e; }
  const d = store.getDoc(col, id); return d ? { id, data: d.data } : null;
}
function del(col, id) { if (!readable(col, id)) { const e = new Error('unknown document'); e.status = 404; throw e; } store.delDoc(col, id); }

module.exports = { snapshot, write, list, read, del, slugFor, SITE_IDS };
