'use strict';
/*
 * ICONIC CRM catalog: developers, projects, cities and areas.
 *
 * The CRM owns names and relationships. This site owns descriptions, images, SEO text, display order and its own web addresses.
 * Changes reach us three ways, all through applyRaw(), which refuses anything older than what we already hold:
 *   - a signed event from the CRM (receive),
 *   - the full list the CRM can give us on request (reconcile, also run at start-up and from the dashboard),
 *   - the confirmed answer to an edit this site asked the CRM to make (edit).
 * Nothing here ever writes back to the CRM except edit(), so an update can never bounce between the two systems.
 */
const crypto = require('node:crypto');
const cfg = require('./config');
const store = require('./db');
const { CRM_ID, CATALOG_SITE, CATALOG_CRM, CATALOG_COLLECTIONS, fail } = require('./schema');
const { slugBase, readBody, httpError, sendJson } = require('./util');

const { db } = store;
const ENTITIES = ['developer', 'city', 'area', 'project'];
const COL = { developer: 'developers', city: 'cities', area: 'areas', project: 'projects' };
const PREFIX = { developer: 'd_', city: 'c_', area: 'a_', project: 'p_' };
const FALLBACK = { developer: 'developer', city: 'city', area: 'area', project: 'project' };
/* the only fields ever read from the CRM; coordinates, contacts, notes and counts are not on the list and are dropped */
const CRM_FIELDS = { developer: ['name'], city: ['name'], area: ['name', 'cityId'], project: ['name', 'active', 'developerId', 'cityId', 'areaId'] };
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const q = {
  event: db.prepare('SELECT 1 FROM catalog_events WHERE event_id = ?'),
  addEvent: db.prepare('INSERT INTO catalog_events (event_id, entity, entity_id, version, received_at, result) VALUES (?,?,?,?,?,?)'),
  pruneEvents: db.prepare('DELETE FROM catalog_events WHERE received_at < ?'),
  addLog: db.prepare('INSERT INTO catalog_log (at, kind, ok, detail) VALUES (?,?,?,?)'),
  pruneLog: db.prepare('DELETE FROM catalog_log WHERE id NOT IN (SELECT id FROM catalog_log ORDER BY id DESC LIMIT 300)'),
  recentLog: db.prepare('SELECT at, kind, ok, detail FROM catalog_log ORDER BY id DESC LIMIT ?'),
  getState: db.prepare('SELECT v FROM catalog_state WHERE k = ?'),
  setState: db.prepare('INSERT INTO catalog_state (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v'),
  addEdit: db.prepare('INSERT OR IGNORE INTO catalog_edits (at, user_email, entity, entity_id, request_id, fields, result, detail) VALUES (?,?,?,?,?,?,?,?)'),
  setEdit: db.prepare('UPDATE catalog_edits SET result = ?, detail = ?, entity_id = COALESCE(?, entity_id) WHERE request_id = ?'),
  getEdit: db.prepare('SELECT result, detail, entity_id FROM catalog_edits WHERE request_id = ?'),
  recentEdits: db.prepare('SELECT at, user_email, entity, entity_id, result, detail FROM catalog_edits ORDER BY id DESC LIMIT ?')
};
function getState(k, d = null) { const r = q.getState.get(k); if (!r) return d; try { return JSON.parse(r.v); } catch (_) { return d; } }
function setState(k, v) { q.setState.run(k, JSON.stringify(v)); }
function log(kind, ok, detail) { try { q.addLog.run(Date.now(), kind, ok ? 1 : 0, String(detail || '').slice(0, 400)); if (Math.random() < 0.05) q.pruneLog.run(); } catch (_) { /* the log must never break a request */ } }

/* ---- what the CRM sends: check it, keep only the allowed fields ---- */
function cleanRecord(entity, rec) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw httpError(400, 'record expected');
  const id = String(rec.id || ''); if (!CRM_ID.test(id)) throw httpError(400, 'bad record id');
  const version = Number(rec.version); if (!Number.isInteger(version) || version < 1) throw httpError(400, 'bad record version');
  const out = { id, version, deleted: rec.deleted === true };
  if (out.deleted) return out;
  for (const f of CRM_FIELDS[entity]) {
    let v = rec[f];
    if (f === 'name') { v = typeof v === 'string' ? v.replace(CTRL, '').replace(/\s+/g, ' ').trim() : ''; if (!v) throw httpError(400, entity + ' name required'); if (v.length > 160) throw httpError(400, entity + ' name too long'); }
    else if (f === 'active') v = v !== false;
    else { v = v == null || v === '' ? '' : String(v); if (v && !CRM_ID.test(v)) throw httpError(400, 'bad ' + f); }
    out[f] = v;
  }
  return out;
}

/* a region suggestion from a city's name; only when the name makes it obvious, the dashboard lets staff change it */
function suggestRegion(name) {
  const n = String(name || '').toLowerCase();
  if (/alex|اسكندر|إسكندر/.test(n)) return 'alexandria';
  if (/north coast|sahel|alamein|الساحل|العلمين/.test(n)) return 'north-coast';
  if (/cairo|zayed|october|tagamo|new capital|القاهر|زايد|أكتوبر|اكتوبر|التجمع|العاصمة/.test(n)) return 'cairo';
  if (/red sea|hurghada|gouna|البحر الأحمر|البحر الاحمر|الغردقة|الجونة/.test(n)) return 'red-sea';
  return '';
}
const makeSlug = (entity, name, crmId) => slugBase(name, FALLBACK[entity]) + '-' + crmId.slice(-6);

/* ---- the one place records are applied. t is a store.transaction handle ---- */
function applyRaw(t, entity, rec, now) {
  const col = COL[entity], id = PREFIX[entity] + rec.id;
  const prev = t.get(col, id);
  if (prev && Number(prev.data.crmVersion) >= rec.version) return 'stale';
  const data = Object.assign({}, prev ? prev.data : {});
  data.crmId = rec.id; data.crmVersion = rec.version; data.crmAt = now;
  if (rec.deleted) { data.crmDeleted = true; t.put(col, id, data); return 'deleted'; }   // kept as a marker so an older update that arrives late is still refused
  data.crmDeleted = false;
  for (const f of CRM_FIELDS[entity]) data[f] = rec[f];
  if (!data.slug) data.slug = makeSlug(entity, data.name, rec.id);   // a web address never changes after it is first made, even when the CRM renames the record
  if (entity === 'city' && data.region === undefined) data.region = suggestRegion(data.name);
  t.put(col, id, data);
  return prev ? 'updated' : 'created';
}
const COUNT0 = () => ({ created: 0, updated: 0, deleted: 0, stale: 0 });
const bumpCount = (c, r) => { c[r] = (c[r] || 0) + 1; };

/* ---- signatures ---- */
const sign = (secret, ts, body) => 'sha256=' + crypto.createHmac('sha256', secret).update(ts + '.' + body).digest('hex');
function verify(secret, ts, sig, body) {
  if (!secret) throw httpError(503, 'The CRM link is not configured');
  const n = Number(ts); if (!Number.isFinite(n) || Math.abs(Date.now() - n) > 5 * 60 * 1000) throw httpError(401, 'missing or old timestamp');
  const want = Buffer.from(sign(secret, String(ts), body)), got = Buffer.from(String(sig || ''));
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) throw httpError(401, 'bad signature');
}

/* ---- events from the CRM ---- */
function handleEvent(ev) {
  if (!ev || typeof ev !== 'object') throw httpError(400, 'event expected');
  const eventId = String(ev.eventId || ''); if (!/^[A-Za-z0-9_-]{8,80}$/.test(eventId)) throw httpError(400, 'bad event id');
  if (!ENTITIES.includes(ev.entity)) throw httpError(400, 'unknown entity');
  if (ev.op !== 'upsert' && ev.op !== 'delete') throw httpError(400, 'unknown operation');
  if (q.event.get(eventId)) return { result: 'duplicate', version: Number(ev.version) || 0 };
  const rec = cleanRecord(ev.entity, Object.assign({}, ev.record || {}, { id: ev.id, version: ev.version, deleted: ev.op === 'delete' }));
  const now = Date.now();
  const result = store.transaction((t) => { const r = applyRaw(t, ev.entity, rec, now); q.addEvent.run(eventId, ev.entity, rec.id, rec.version, now, r); return r; });
  setState('lastEvent', { at: now, eventId, entity: ev.entity, id: rec.id, version: rec.version, result, origin: ev.origin || 'crm' });
  log('event', true, ev.entity + ' ' + rec.id + ' v' + rec.version + ' ' + result);
  if (Math.random() < 0.02) q.pruneEvents.run(now - 30 * 864e5);
  return { result, version: rec.version };
}
async function receive(req, res) {
  const raw = (await readBody(req, 256 * 1024)).toString('utf8');
  try {
    verify(cfg.crmEventSecret, req.headers['x-iconic-timestamp'], req.headers['x-iconic-signature'], raw);
    let ev; try { ev = JSON.parse(raw); } catch (_) { throw httpError(400, 'bad json'); }
    const r = handleEvent(ev);
    return sendJson(res, 200, Object.assign({ ok: true }, r));
  } catch (e) {
    if (!e.status || e.status >= 500) log('event', false, e.message); else if (e.status !== 401) { log('event', false, 'refused: ' + e.message); setState('lastError', { at: Date.now(), kind: 'event', message: e.message }); }
    throw e;
  }
}

/* ---- calls to the CRM ---- */
async function crmCall(method, path, bodyObj) {
  if (!cfg.crmUrl || !cfg.crmRequestSecret) throw httpError(503, 'The CRM link is not configured');
  const body = bodyObj ? JSON.stringify(bodyObj) : '', ts = String(Date.now());
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), cfg.crmTimeoutMs);
  try {
    const r = await fetch(cfg.crmUrl + path, { method, headers: { 'Content-Type': 'application/json', 'X-Iconic-Timestamp': ts, 'X-Iconic-Signature': sign(cfg.crmRequestSecret, ts, body) }, body: body || undefined, signal: ctl.signal });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (_) { /* not JSON */ }
    return { status: r.status, json };
  } catch (e) {
    throw httpError(502, e && e.name === 'AbortError' ? 'The CRM did not answer in time' : 'Could not reach the CRM');
  } finally { clearTimeout(timer); }
}

/* ---- full list from the CRM ---- */
let running = false;
async function reconcile(trigger) {
  if (running) throw httpError(409, 'A check is already running');
  running = true; const started = Date.now();
  try {
    const r = await crmCall('GET', '/snapshot');
    if (r.status !== 200 || !r.json || r.json.ok !== true) throw httpError(502, 'The CRM could not give its list (' + r.status + ')');
    const snap = r.json, lists = {};
    for (const e of ENTITIES) {   // everything is checked before anything is stored: a bad list leaves the last good copy untouched
      const arr = snap[COL[e]]; if (!Array.isArray(arr)) throw httpError(502, 'The CRM list is missing ' + COL[e]);
      lists[e] = arr.map((x) => cleanRecord(e, x));
    }
    const generatedAt = Number(snap.generatedAt) || started, counts = COUNT0(), seenAll = {};
    store.transaction((t) => {
      for (const e of ENTITIES) {
        const seen = new Set(); seenAll[e] = seen;
        for (const rec of lists[e]) { seen.add(rec.id); bumpCount(counts, applyRaw(t, e, rec, started)); }
        for (const d of store.listDocs(COL[e])) {   // records we hold that the CRM no longer lists
          const cid = d.data.crmId; if (!cid || seen.has(cid) || d.data.crmDeleted) continue;
          if ((d.data.crmAt || 0) >= generatedAt - 1000) continue;   // arrived by event after the list was made
          t.put(COL[e], d.id, Object.assign({}, d.data, { crmDeleted: true, crmAt: started })); bumpCount(counts, 'deleted');
        }
      }
    });
    const res = { at: Date.now(), ok: true, trigger: trigger || 'manual', ms: Date.now() - started, counts, totals: Object.fromEntries(ENTITIES.map((e) => [e, lists[e].length])) };
    setState('lastReconcile', res); log('reconcile', true, (trigger || 'manual') + ' ' + JSON.stringify(res.totals));
    return res;
  } catch (e) {
    setState('lastReconcile', { at: Date.now(), ok: false, trigger: trigger || 'manual', error: e.message });
    log('reconcile', false, e.message); throw e;
  } finally { running = false; }
}

/* ---- a change staff ask for in the dashboard: sent to the CRM first, shown here only once the CRM confirms ---- */
const docView = (entity, d) => d && Object.assign({ id: d.data.crmId, version: d.data.crmVersion }, d.data);
function localCheck(entity, f, id) {
  const has = (e, cid) => { const d = store.getDoc(COL[e], PREFIX[e] + cid); return d && !d.data.crmDeleted ? d : null; };
  if (f.developerId && !has('developer', f.developerId)) fail('That developer is not in the catalog');
  if (f.cityId && !has('city', f.cityId)) fail('That city is not in the catalog');
  if (f.areaId) { const a = has('area', f.areaId); if (!a) fail('That area is not in the catalog'); const city = f.cityId || (id && (store.getDoc('projects', 'p_' + id) || { data: {} }).data.cityId); if (city && a.data.cityId !== city) fail('That area belongs to a different city'); }
  if (entity === 'area' && f.cityId && !has('city', f.cityId)) fail('That city is not in the catalog');
}
async function edit(entity, id, input, user) {
  if (!ENTITIES.includes(entity)) throw httpError(404, 'unknown kind');
  input = input || {};
  const fields = CATALOG_CRM[entity](input.fields || {});
  if (!Object.keys(fields).length) throw httpError(400, 'nothing to change');
  const create = !id;
  if (create && !fields.name) throw httpError(400, 'name required');
  let expected = null;
  if (!create) {
    if (!CRM_ID.test(id)) throw httpError(404, 'unknown record');
    const doc = store.getDoc(COL[entity], PREFIX[entity] + id); if (!doc || doc.data.crmDeleted) throw httpError(404, 'unknown record');
    expected = Number(input.expectedVersion); if (!Number.isInteger(expected) || expected < 1) throw httpError(400, 'expectedVersion required');
  }
  localCheck(entity, fields, id);
  const requestId = /^[A-Za-z0-9_-]{8,64}$/.test(String(input.requestId || '')) ? String(input.requestId) : crypto.randomUUID();
  q.addEdit.run(Date.now(), user.email || '', entity, id || null, requestId, JSON.stringify(fields), 'pending', '');
  const body = { requestId, entity, id: id || undefined, expectedVersion: expected, fields, requestedBy: { email: user.email || '', name: user.name || '' } };
  let r;
  try { r = await crmCall(create ? 'POST' : 'PATCH', '/entities/' + entity + (create ? '' : '/' + id), body); }
  catch (e) { q.setEdit.run('failed', e.message, null, requestId); log('edit', false, entity + ' ' + (id || 'new') + ': ' + e.message); setState('lastError', { at: Date.now(), kind: 'edit', message: e.message }); throw e; }
  const j = r.json || {};
  if ((r.status === 200 || r.status === 201) && j.ok === true && j.record) {
    const recs = [{ e: entity, rec: cleanRecord(entity, j.record) }];
    for (const a of Array.isArray(j.affected) ? j.affected : []) if (a && ENTITIES.includes(a.entity)) recs.push({ e: a.entity, rec: cleanRecord(a.entity, a.record) });
    store.transaction((t) => { for (const x of recs) applyRaw(t, x.e, x.rec, Date.now()); });
    const stored = store.getDoc(COL[entity], PREFIX[entity] + recs[0].rec.id);
    q.setEdit.run('ok', 'v' + recs[0].rec.version, recs[0].rec.id, requestId);
    setState('lastEdit', { at: Date.now(), entity, id: recs[0].rec.id, version: recs[0].rec.version, by: user.email || '' });
    log('edit', true, entity + ' ' + recs[0].rec.id + ' v' + recs[0].rec.version + ' by ' + (user.email || '?'));
    return { requestId, record: docView(entity, stored) };
  }
  if (r.status === 409 && j.current) {   // someone changed it in the CRM since the form was opened: show them what is there now
    try { const cur = cleanRecord(entity, j.current); store.transaction((t) => applyRaw(t, entity, cur, Date.now())); } catch (_) { /* keep what we hold */ }
    const e = httpError(409, 'This record was changed in the CRM after you opened it. The latest values are shown.');
    e.payload = { code: 'version_conflict', record: docView(entity, store.getDoc(COL[entity], PREFIX[entity] + id)) };
    q.setEdit.run('conflict', 'expected v' + expected, null, requestId); log('edit', false, entity + ' ' + id + ': version conflict'); throw e;
  }
  const refused = r.status >= 400 && r.status < 500 && r.status !== 401 && r.status !== 403 && r.status !== 408 && r.status !== 429;
  const msg = refused ? String(j.message || 'The CRM refused this change').slice(0, 300) : r.status === 401 || r.status === 403 ? 'The CRM did not accept this website\'s credentials' : 'The CRM could not save this change (' + r.status + ')';
  q.setEdit.run('failed', msg, null, requestId); log('edit', false, entity + ' ' + (id || 'new') + ': ' + msg); setState('lastError', { at: Date.now(), kind: 'edit', message: msg });
  const e = httpError(refused ? (r.status === 404 ? 404 : 422) : 502, msg); if (j.field) e.payload = { code: j.code || 'refused', field: String(j.field) }; throw e;
}

/* ---- what this site owns: saved here at once, never sent to the CRM ---- */
function siteUpdate(entity, id, input) {
  if (!ENTITIES.includes(entity)) throw httpError(404, 'unknown kind');
  const doc = CRM_ID.test(id) ? store.getDoc(COL[entity], PREFIX[entity] + id) : null;
  if (!doc || doc.data.crmDeleted) throw httpError(404, 'unknown record');
  const own = CATALOG_SITE[entity](input || {});
  const data = Object.assign({}, doc.data, own);
  store.putDoc(COL[entity], PREFIX[entity] + id, data);
  return docView(entity, { data });
}

/* ---- status for the dashboard ---- */
function status() {
  const counts = {};
  for (const e of ENTITIES) { const all = store.listDocs(COL[e]); counts[e] = { total: all.filter((d) => !d.data.crmDeleted).length, hidden: all.filter((d) => d.data.crmDeleted || d.data.active === false).length }; }
  return {
    configured: !!(cfg.crmUrl && cfg.crmRequestSecret && cfg.crmEventSecret),
    lastEvent: getState('lastEvent'), lastReconcile: getState('lastReconcile'), lastEdit: getState('lastEdit'), lastError: getState('lastError'),
    counts, reconciling: running,
    log: q.recentLog.all(15).map((r) => ({ at: r.at, kind: r.kind, ok: !!r.ok, detail: r.detail })),
    edits: q.recentEdits.all(10).map((r) => ({ at: r.at, by: r.user_email, entity: r.entity, id: r.entity_id, result: r.result, detail: r.detail }))
  };
}

/* ---- the CRM's own delivery queue, for the dashboard ---- */
async function crmStatus() {
  try { const r = await crmCall('GET', '/status'); if (r.status === 200 && r.json && r.json.ok) { const { ok, ...rest } = r.json; return Object.assign({ reachable: true }, rest); } return { reachable: false, error: 'The CRM answered ' + r.status }; }
  catch (e) { return { reachable: false, error: e.message }; }
}
async function crmRedeliver(scope, who) {
  const r = await crmCall('POST', '/redeliver', { scope: scope === 'all' ? 'all' : 'rejected' });
  if (r.status !== 200 || !r.json || r.json.ok !== true) throw httpError(502, 'The CRM could not re-send (' + r.status + ')');
  log('redeliver', true, (scope === 'all' ? 'all' : 'refused') + ': ' + r.json.requeued + ' by ' + (who || '?')); return { requeued: r.json.requeued };
}

/* ---- start-up: take the CRM's list once, then keep a slow safety check running in case an event was ever missed ---- */
let timers = [];
function startLink() {
  if (!cfg.crmUrl || !cfg.crmRequestSecret) return;
  timers.push(setTimeout(() => reconcile('startup').catch((e) => console.warn('[catalog] start-up check failed:', e.message)), 3000));
  if (cfg.crmSafetyHours > 0) timers.push(setInterval(() => reconcile('safety').catch((e) => console.warn('[catalog] safety check failed:', e.message)), cfg.crmSafetyHours * 3600 * 1000));
  timers.forEach((t) => t.unref && t.unref());
}
function stopLink() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; }

module.exports = { crmStatus, crmRedeliver, log, getState, setState, ENTITIES, COL, PREFIX, CRM_FIELDS, cleanRecord, applyRaw, handleEvent, receive, reconcile, edit, siteUpdate, status, startLink, stopLink, sign, verify, suggestRegion, makeSlug, docView, CATALOG_COLLECTIONS };
