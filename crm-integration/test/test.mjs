// Tests the CRM side of the website link against a temporary database, with a stand-in website. Nothing here touches real data.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import express from 'express';

const URI = process.env.TEST_MONGO_URI || '';
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/iconic_sync_test$/.test(URI)) { console.error('refusing to run: TEST_MONGO_URI must be the temporary local test database'); process.exit(2); }
const hmac = (secret, s) => crypto.createHmac('sha256', secret).update(s).digest('hex');
const EVENT_SECRET = crypto.randomBytes(16).toString('hex'), REQUEST_SECRET = crypto.randomBytes(16).toString('hex');
const CREATOR = new mongoose.Types.ObjectId();

/* ---------- stand-in website: checks the signature like the real one, can be switched off ---------- */
let mode = 'ok'; const got = []; let badSig = 0;
const mock = http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString(), ts = String(req.headers['x-iconic-timestamp'] || '');
    if ('sha256=' + hmac(EVENT_SECRET, ts + '.' + body) !== req.headers['x-iconic-signature'] || Math.abs(Date.now() - Number(ts)) > 300000) { badSig++; res.statusCode = 401; return res.end('{}'); }
    if (mode === 'down') return req.socket.destroy();
    if (mode === 'busy') { res.statusCode = 503; return res.end('{}'); }
    if (mode === 'reject') { res.statusCode = 422; return res.end('{}'); }
    const ev = JSON.parse(body); ev.receivedAt = Date.now(); got.push(ev); res.end('{"ok":true}');
  });
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const MOCK = mock.address().port;
Object.assign(process.env, { WEBSITE_SYNC_URL: 'http://127.0.0.1:' + MOCK + '/events', WEBSITE_EVENT_SECRET: EVENT_SECRET, WEBSITE_REQUEST_SECRET: REQUEST_SECRET, WEBSITE_SYNC_CREATED_BY: String(CREATOR), WEBSITE_SYNC_TIMEOUT_MS: '1500', TEST_MONGO_URI: URI });

/* ---------- load the CRM's models with the link's hook in place, exactly as the CRM does ---------- */
await import('./src/websiteSync/plugin.js');
const M = {}; for (const n of ['Developer', 'Lookup', 'City']) M[n] = (await import('./src/models/' + n + '.js')).default;
const { normalizeName } = await import('./src/models/City.js');
const { startWebsiteSync } = await import('./src/websiteSync/index.js');
const { default: router } = await import('./src/websiteSync/routes.js');
const { State, Outbox, Audit } = await import('./src/websiteSync/models.js');
const { stop: stopDispatcher, start: startDispatcher, backoffSeconds } = await import('./src/websiteSync/dispatcher.js');
const { run: scan, seedIfEmpty } = await import('./src/websiteSync/scanner.js');
const { buildCatalog } = await import('./src/websiteSync/projection.js');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 6000, step = 20) => { const t = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) return null; await sleep(step); } };
const evOf = (entity, id, version) => got.find((e) => e.entity === entity && e.id === String(id) && (version == null || e.version === version));
const evsOf = (entity, id) => got.filter((e) => e.entity === entity && e.id === String(id));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

await mongoose.connect(URI); await mongoose.connection.dropDatabase();

/* ---------- the CRM's API side, as the website calls it ---------- */
const app = express(); app.use('/api/website-sync', router);
const srv = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const API = srv.address().port;
const call = async (method, path, payload, o = {}) => {
  const body = payload === undefined ? '' : JSON.stringify(payload), ts = o.ts || Date.now();
  const sig = o.sig === undefined ? 'sha256=' + hmac(o.secret || REQUEST_SECRET, ts + '.' + body) : o.sig;
  const headers = { 'Content-Type': 'application/json' }; if (!o.unsigned) { headers['X-Iconic-Timestamp'] = String(ts); headers['X-Iconic-Signature'] = sig; }
  const r = await fetch('http://127.0.0.1:' + API + '/api/website-sync' + path, { method, headers, body: body || undefined });
  let j = null; try { j = await r.json(); } catch (_) { /* not json */ }
  return { status: r.status, body: j };
};
let rq = 0; const rid = () => 'req' + Date.now().toString(36) + (++rq) + crypto.randomBytes(3).toString('hex');
const edit = (method, path, fields, extra = {}) => call(method, path, Object.assign({ requestId: rid(), fields, requestedBy: { email: 'admin@iconic.test', name: 'Test Admin' } }, extra));

/* ---------- synthetic data ---------- */
const A = (n) => ({ name: n, normalizedName: normalizeName(n) });
const alex = await M.City.create({ ...A('Alexandria'), workspace: 'ICONIC', regions: [A('Smouha'), A('Sidi Gaber')] });
const cairo = await M.City.create({ ...A('Cairo'), workspace: 'ICONIC', regions: [A('New Cairo')] });
const white = await M.City.create({ ...A('Hidden White City'), workspace: 'WHITE', regions: [A('HiddenArea')] });
const [smouha, gaber] = alex.regions, [newCairo] = cairo.regions;
const devA = await M.Developer.create({ name: 'Dev Alpha', createdBy: CREATOR }), devB = await M.Developer.create({ name: 'Dev Beta', createdBy: CREATOR });
await M.Developer.create({ name: 'Dev Unused', createdBy: CREATOR });
const mk = async (label, { dev, city, area, active = true, type = 'project-name', id } = {}) => {
  const d = await M.Lookup.create({ ...(id ? { _id: id } : {}), type, label, value: label, order: 0, active, developerId: dev ? dev._id : undefined, cityId: city ? city._id : undefined, regionId: area ? area._id : undefined, region: city ? city.name : '', subArea: area ? area.name : '', catalogType: 'project', createdBy: CREATOR });
  if (dev) await M.Developer.updateOne({ _id: dev._id }, { $addToSet: { projects: d._id } });
  return d;
};
const p1 = await mk('Palm Heights', { dev: devA, city: alex, area: smouha }), p2 = await mk('Nile Gate', { dev: devB, city: cairo }), p3 = await mk('Old Tower', { dev: devA, city: alex, area: gaber, active: false });
await mk('Hidden White Tower', { city: white }); await mk('Loose Project Text', {}); await mk('Studio', { city: alex, type: 'unit-type' });
/* things the website must never receive, planted straight into the database */
await M.Developer.collection.updateOne({ _id: devA._id }, { $set: { phone: '01000000000', notes: 'SECRET-NOTE', contacts: [{ name: 'X', phone: '0102223333' }] } });
await M.Lookup.collection.updateOne({ _id: p1._id }, { $set: { coordinates: { lat: 31.2, lng: 29.9 }, internalNotes: 'SECRET-NOTE', leadCount: 5 } });

/* ---------- first start ---------- */
await startWebsiteSync(); await sleep(700);
ok(got.length === 0, 'first start sends no events (the website takes its copy from the snapshot)', got.length);
ok(await State.countDocuments({}) === 10, 'first start records 2 cities, 3 areas, 2 developers, 3 projects', await State.countDocuments({}));
let snap = await call('GET', '/snapshot');
ok(snap.status === 200 && snap.body.ok, 'snapshot answers a signed request', snap.status);
const names = (k) => (snap.body[k] || []).map((r) => r.name).sort().join('|');
ok(names('developers') === 'Dev Alpha|Dev Beta', 'snapshot developers: only those with projects', names('developers'));
ok(names('cities') === 'Alexandria|Cairo', 'snapshot cities: ICONIC workspace only', names('cities'));
ok(names('areas') === 'New Cairo|Sidi Gaber|Smouha', 'snapshot areas', names('areas'));
ok(names('projects') === 'Nile Gate|Old Tower|Palm Heights', 'snapshot projects: no WHITE, no unlinked text, no other lookup types', names('projects'));
const sp1 = snap.body.projects.find((r) => r.name === 'Palm Heights');
ok(sp1 && sp1.developerId === String(devA._id) && sp1.cityId === String(alex._id) && sp1.areaId === String(smouha._id) && sp1.active === true && sp1.version === 1, 'project carries developer, city, area, active and version', sp1);
ok(snap.body.projects.find((r) => r.name === 'Old Tower').active === false, 'inactive project is marked inactive');
ok(snap.body.projects.find((r) => r.name === 'Nile Gate').areaId === '', 'project without an area has an empty area');
const leak = JSON.stringify(snap.body);
for (const bad of ['SECRET-NOTE', '01000000000', '0102223333', 'coordinates', '"lat"', 'leadCount', 'Hidden White', 'phone', 'contacts', 'notes']) ok(!leak.includes(bad), 'snapshot never contains ' + bad);
const keys = new Set(); for (const k of ['developers', 'cities', 'areas', 'projects']) for (const r of snap.body[k]) Object.keys(r).forEach((x) => keys.add(x));
ok([...keys].every((k) => ['id', 'version', 'name', 'active', 'developerId', 'cityId', 'areaId'].includes(k)), 'snapshot fields are only the allow-list', [...keys]);

/* ---------- repeat import ---------- */
ok(await seedIfEmpty() === 0, 'repeat import records nothing new');
await scan(); await scan();
ok(await State.countDocuments({}) === 10 && await State.countDocuments({ version: { $ne: 1 } }) === 0, 'repeat scans keep every version at 1');
ok(got.length === 0 && await Outbox.countDocuments({}) === 0, 'repeat scans queue nothing');

/* ---------- changes made in the CRM reach the website ---------- */
const lat = [];
const t0 = Date.now();
const p4 = await mk('Marina Bay', { dev: devB, city: alex, area: smouha });
let ev = await until(() => evOf('project', p4._id));
ok(!!ev, 'a new project is delivered'); if (ev) lat.push(ev.receivedAt - t0);
ok(ev && ev.op === 'upsert' && ev.version === 1 && ev.record.name === 'Marina Bay' && ev.record.developerId === String(devB._id) && ev.record.areaId === String(smouha._id), 'new project event has name and relationships', ev);
ok(ev && /^[a-f0-9]{32}$/.test(ev.eventId) && badSig === 0, 'events are signed and carry an event id', badSig);
ok(ev && Object.keys(ev.record).every((k) => ['entity', 'id', 'name', 'active', 'developerId', 'cityId', 'areaId'].includes(k)), 'event record fields are only the allow-list', ev && Object.keys(ev.record));

let n0 = got.length;
await M.Lookup.updateOne({ _id: p1._id }, { $set: { label: 'Palm Heights II', value: 'Palm Heights II' } });
ev = await until(() => evOf('project', p1._id, 2));
ok(ev && ev.record.name === 'Palm Heights II', 'renaming a project is delivered as version 2');
await sleep(300); ok(got.length === n0 + 1, 'a rename produces exactly one event', got.length - n0);

n0 = got.length;
await M.Lookup.updateMany({ _id: p1._id }, { $set: { developerId: devB._id } });
await M.Developer.updateOne({ _id: devA._id }, { $pull: { projects: p1._id } }); await M.Developer.updateOne({ _id: devB._id }, { $addToSet: { projects: p1._id } });
ev = await until(() => evOf('project', p1._id, 3));
ok(ev && ev.record.developerId === String(devB._id), 'moving a project to another developer (updateMany) is delivered');
await M.Lookup.findOneAndUpdate({ _id: p1._id }, { $set: { regionId: gaber._id, subArea: 'Sidi Gaber' } });
ev = await until(() => evOf('project', p1._id, 4));
ok(ev && ev.record.areaId === String(gaber._id), 'changing a project area (findOneAndUpdate) is delivered');
await M.Lookup.updateOne({ _id: p2._id }, { $set: { cityId: alex._id, region: 'Alexandria', regionId: null, subArea: '' } });
ev = await until(() => evOf('project', p2._id, 2));
ok(ev && ev.record.cityId === String(alex._id) && ev.record.areaId === '', 'moving a project to another city is delivered');

await M.City.findOneAndUpdate({ _id: alex._id }, { $set: { name: 'Alexandria Coast', normalizedName: normalizeName('Alexandria Coast') } });
ev = await until(() => evOf('city', alex._id, 2));
ok(ev && ev.record.name === 'Alexandria Coast', 'renaming a city is delivered');
await M.City.updateOne({ _id: alex._id, 'regions._id': smouha._id }, { $set: { 'regions.$.name': 'Smouha Garden', 'regions.$.normalizedName': normalizeName('Smouha Garden') } });
ev = await until(() => evOf('area', smouha._id, 2));
ok(ev && ev.record.name === 'Smouha Garden' && ev.record.cityId === String(alex._id), 'renaming an area is delivered');
const cdoc = await M.City.findById(alex._id); cdoc.regions.push(A('Stanley')); await cdoc.save();
const stanley = cdoc.regions[cdoc.regions.length - 1];
ev = await until(() => evOf('area', stanley._id, 1));
ok(ev && ev.record.name === 'Stanley' && ev.record.cityId === String(alex._id), 'a new area (document save) is delivered');
await M.Developer.updateOne({ _id: devA._id }, { $set: { name: 'Dev Alpha Group' } });
ev = await until(() => evOf('developer', devA._id, 2));
ok(ev && ev.record.name === 'Dev Alpha Group', 'renaming a developer is delivered');

await M.Lookup.updateOne({ _id: p2._id }, { $set: { active: false } });
ev = await until(() => evOf('project', p2._id, 3));
ok(ev && ev.op === 'upsert' && ev.record.active === false, 'deactivating a project is delivered as inactive, not deleted');
await M.Lookup.deleteOne({ _id: p3._id });
ev = await until(() => evOf('project', p3._id, 2));
ok(ev && ev.op === 'delete' && !ev.record, 'deleting a project (deleteOne) is delivered as a delete');
ok((await State.findById('project:' + p3._id).lean()).deleted === true, 'deleted project is kept as a tombstone');
const doc4 = await M.Lookup.findById(p4._id); await doc4.deleteOne();
ev = await until(() => evOf('project', p4._id, 2));
ok(ev && ev.op === 'delete', 'deleting a project document is delivered as a delete');
await M.Lookup.create({ _id: p3._id, type: 'project-name', label: 'Old Tower', value: 'Old Tower', order: 0, active: true, developerId: devA._id, cityId: alex._id, region: 'Alexandria Coast', catalogType: 'project', createdBy: CREATOR });
ev = await until(() => evOf('project', p3._id, 3));
ok(ev && ev.op === 'upsert' && ev.version === 3, 'a record that comes back gets a higher version than its delete');
await M.Developer.deleteOne({ _id: devB._id });
ev = await until(() => evOf('developer', devB._id, 2));
ok(ev && ev.op === 'delete', 'deleting a developer is delivered');
ev = await until(() => got.find((e) => e.entity === 'project' && e.id === String(p1._id) && e.version === 5));
ok(ev && ev.record.developerId === '', 'projects of a deleted developer lose the developer link', ev);

/* ---------- bulk import ---------- */
n0 = got.length; const tb = Date.now();
const bulk = []; for (let i = 0; i < 25; i++) bulk.push({ type: 'project-name', label: 'Bulk ' + i, value: 'Bulk ' + i, order: 0, active: true, cityId: cairo._id, regionId: newCairo._id, region: 'Cairo', subArea: 'New Cairo', catalogType: 'project', createdBy: CREATOR });
const inserted = await M.Lookup.insertMany(bulk);
const allIn = await until(() => inserted.every((d) => evOf('project', d._id, 1)), 10000);
ok(!!allIn, 'bulk insert: all 25 delivered', got.length - n0); const bulkMs = Date.now() - tb;
await sleep(500);
ok(new Set(got.slice(n0).map((e) => e.eventId)).size === got.length - n0, 'bulk insert: no event delivered twice');
ok(await Outbox.countDocuments({ entityId: { $in: inserted.map((d) => String(d._id)) } }) === 25, 'bulk insert: exactly one queued event per record');
await Promise.all([scan(), scan(), scan()]);
ok(await State.countDocuments({ entityId: { $in: inserted.map((d) => String(d._id)) }, version: { $ne: 1 } }) === 0, 'parallel scans do not move versions');
await M.Lookup.findOneAndDelete({ _id: inserted[0]._id });
ev = await until(() => evOf('project', inserted[0]._id, 2));
ok(ev && ev.op === 'delete', 'findOneAndDelete is delivered');

/* ---------- latency: write returned to event received ---------- */
for (let i = 0; i < 20; i++) {
  const v = i + 2, tt = Date.now(); await M.Lookup.updateOne({ _id: inserted[1]._id }, { $set: { label: 'Latency ' + i } });
  const e = await until(() => evOf('project', inserted[1]._id, v), 5000, 5); if (e) lat.push(e.receivedAt - tt);
}
ok(lat.length === 21, 'latency samples collected', lat.length);

/* ---------- website down: the CRM keeps working, events wait and go out later ---------- */
mode = 'down'; n0 = got.length;
const tw = Date.now(); const po = await mk('Outage One', { dev: devA, city: cairo, area: newCairo }); const writeMs = Date.now() - tw;
ok(writeMs < 1500, 'saving in the CRM is not slowed by a website that is down', writeMs);
await sleep(1600);
let ob = await Outbox.findOne({ entityId: String(po._id) }).lean();
ok(got.length === n0 && ob && ob.status === 'pending' && ob.attempts >= 1 && /not reachable/.test(ob.lastError || '') && new Date(ob.nextAttemptAt) > new Date(), 'while the website is down the event waits with an error and a later retry time', ob && { s: ob.status, a: ob.attempts, e: ob.lastError });
ok(backoffSeconds(1) === 1 && backoffSeconds(4) === 8 && backoffSeconds(12) === 300, 'retry pauses grow and stop at five minutes');
mode = 'ok';
ev = await until(() => evOf('project', po._id, 1), 15000);
ok(!!ev, 'when the website is back the waiting event is delivered by the retry');
ob = await Outbox.findOne({ entityId: String(po._id) }).lean(); ok(ob && ob.status === 'sent', 'delivered event is marked sent');
const st = await call('GET', '/status'); ok(st.status === 200 && st.body.pending === 0 && st.body.sent > 0 && st.body.records > 0, 'status reports the queue', st.body);

mode = 'busy'; const pb = await mk('Busy One', { city: cairo }); await sleep(900);
ob = await Outbox.findOne({ entityId: String(pb._id) }).lean(); ok(ob && ob.status === 'pending' && /503/.test(ob.lastError || ''), 'a website answering 503 is retried', ob && ob.lastError);
mode = 'reject'; const pr = await mk('Rejected One', { city: cairo }); await sleep(900);
ob = await Outbox.findOne({ entityId: String(pr._id) }).lean(); ok(ob && ob.status === 'rejected' && ob.lastHttp === 422, 'an event the website refuses is marked rejected, not retried forever', ob && ob.status);
mode = 'ok';
const rd = await call('POST', '/redeliver', { scope: 'rejected' }); ok(rd.status === 200 && rd.body.requeued >= 1, 'the "send again" action re-queues rejected events', rd.body);
ok(!!(await until(() => evOf('project', pr._id, 1))), 'a re-queued event is delivered');
ok(!!(await until(() => evOf('project', pb._id, 1), 12000)), 'the 503 event is delivered once the website answers');

/* ---------- restarts and several workers, using real separate processes ---------- */
const kids = []; const spawnKid = () => { const c = spawn(process.execPath, ['child.mjs'], { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] }); c.out = ''; c.stdout.on('data', (d) => { c.out += d; }); c.stderr.on('data', (d) => { c.out += d; }); kids.push(c); return c; };
const killKid = async (c) => { c.kill('SIGKILL'); await new Promise((r) => c.once('exit', r)); };
stopDispatcher(); mode = 'ok';
await M.Lookup.updateOne({ _id: po._id }, { $set: { label: 'Outage One renamed', value: 'Outage One renamed' } }); await sleep(300);
ok(!evOf('project', po._id, 2), 'precondition: this worker is not delivering');
let k1 = spawnKid();
ev = await until(() => evOf('project', po._id, 2), 15000);
ok(!!ev, 'a freshly started worker delivers events another worker queued (durable queue)');
ok(/\[website-sync\] ready/.test(k1.out), 'the worker reports it is ready', k1.out.slice(-200));
await killKid(k1);
/* crash between "version moved" and "event queued" */
await State.updateOne({ _id: 'project:' + po._id }, { $inc: { version: 1 } });
ok(!evOf('project', po._id, 3), 'precondition: no event for the half-finished version');
k1 = spawnKid(); ev = await until(() => evOf('project', po._id, 3), 15000);
ok(!!ev, 'a version that never got its event is repaired when a worker starts');
await killKid(k1);
/* several workers looking at one change at the same moment */
await M.Lookup.collection.updateOne({ _id: po._id }, { $set: { label: 'Outage One by shell', value: 'Outage One by shell' } });
const before = (await State.findById('project:' + po._id).lean()).version;
const ka = spawnKid(), kb = spawnKid(); await scan();
ev = await until(() => evOf('project', po._id, before + 1), 15000);
ok(!!ev && ev.record.name === 'Outage One by shell', 'a change made outside the CRM app is found when a worker starts');
await sleep(2000);
ok((await State.findById('project:' + po._id).lean()).version === before + 1 && await Outbox.countDocuments({ entity: 'project', entityId: String(po._id), version: before + 1 }) === 1, 'three workers, one change: one new version and one queued event');
ok(evsOf('project', po._id).filter((e) => e.version === before + 1).length === 1, 'and the website received it once');
/* a lot of events, shared by two workers */
n0 = got.length; const bulk2 = []; for (let i = 0; i < 30; i++) bulk2.push({ type: 'project-name', label: 'Shared ' + i, value: 'Shared ' + i, order: 0, active: true, cityId: cairo._id, region: 'Cairo', catalogType: 'project', createdBy: CREATOR });
const ins2 = await M.Lookup.insertMany(bulk2);
ok(!!(await until(() => ins2.every((d) => evOf('project', d._id, 1)), 20000)), 'two workers deliver 30 queued events between them');
await sleep(800); const ids = got.slice(n0).map((e) => e.eventId); ok(new Set(ids).size === ids.length, 'no event was delivered twice by the two workers', ids.length - new Set(ids).size);
await killKid(ka); await killKid(kb); startDispatcher();

/* ---------- changes asked for by the website ---------- */
const who = { email: 'admin@iconic.test', name: 'Test Admin' };
let r = await call('POST', '/entities/developer', { requestId: 'devreq0001', fields: { name: 'Dev Gamma' }, requestedBy: who });
ok(r.status === 201 && r.body.ok && /^[a-f0-9]{24}$/.test(r.body.record.id) && r.body.record.version === 1 && r.body.record.name === 'Dev Gamma', 'create developer: confirmed record with id and version', r);
const gammaId = r.body.record.id; const gdoc = await M.Developer.findById(gammaId).lean();
ok(gdoc && String(gdoc.createdBy) === String(CREATOR), 'the developer exists in the CRM with the integration user as creator');
const again = await call('POST', '/entities/developer', { requestId: 'devreq0001', fields: { name: 'Dev Gamma' }, requestedBy: who });
ok(again.status === 201 && again.body.record.id === gammaId && await M.Developer.countDocuments({ name: 'Dev Gamma' }) === 1, 'the same request sent again is answered again and not applied twice');
const audit = await Audit.findOne({ requestId: 'devreq0001' }).lean(); ok(audit && audit.requestedBy.email === 'admin@iconic.test' && audit.after && audit.after.name === 'Dev Gamma', 'the audit trail records who asked');
ok(!!(await until(() => evOf('developer', gammaId, 1))), 'the new developer is also announced to the website');
r = await edit('POST', '/entities/developer', { name: 'dev gamma' }); ok(r.status === 422 && r.body.field === 'name', 'duplicate developer name is refused whatever the letter case', r.body);
r = await edit('POST', '/entities/developer', { name: '   ' }); ok(r.status === 422 && r.body.field === 'name', 'empty name is refused');
r = await edit('POST', '/entities/developer', { name: 'X', notes: 'hello' }); ok(r.status === 422 && r.body.field === 'notes', 'a field outside the allow-list is refused', r.body);
r = await edit('POST', '/entities/developer', { name: 'X', phone: '010' }); ok(r.status === 422, 'contact fields cannot be written');
r = await edit('POST', '/entities/project', { name: 'Zed', coordinates: { lat: 1, lng: 2 }, cityId: String(cairo._id) }); ok(r.status === 422 && r.body.field === 'coordinates', 'coordinates cannot be written', r.body);
r = await edit('POST', '/entities/city', { name: 'Marsa Matruh' }); ok(r.status === 201, 'create city', r.body); const cityId = r.body.record.id;
r = await edit('POST', '/entities/city', { name: 'marsa matruh' }); ok(r.status === 422, 'duplicate city name is refused');
r = await edit('POST', '/entities/area', { name: 'Sidi Abdel Rahman', cityId }); ok(r.status === 201 && r.body.record.cityId === cityId, 'create area inside a city', r.body); const areaId = r.body.record.id;
r = await edit('POST', '/entities/area', { name: 'Sidi Abdel Rahman', cityId }); ok(r.status === 422, 'duplicate area in the same city is refused');
r = await edit('POST', '/entities/area', { name: 'Nowhere', cityId: String(white._id) }); ok(r.status === 422 && r.body.field === 'cityId', 'an area cannot be created in a city outside the ICONIC catalog', r.body);
r = await edit('POST', '/entities/project', { name: 'API Project', developerId: gammaId, cityId, areaId }); ok(r.status === 201 && r.body.record.developerId === gammaId && r.body.record.areaId === areaId && r.body.record.active === true, 'create project with developer, city and area', r.body);
const projId = r.body.record.id; let pd = await M.Lookup.findById(projId).lean();
ok(pd && pd.label === 'API Project' && pd.value === 'API Project' && pd.region === 'Marsa Matruh' && pd.subArea === 'Sidi Abdel Rahman' && String(pd.developerId) === gammaId, 'the CRM record has the same fields its own screens would set', pd && { r: pd.region, s: pd.subArea });
ok((await M.Developer.findById(gammaId).lean()).projects.map(String).includes(projId), 'the developer\'s project list is kept in step');
ok(!!(await until(() => evOf('project', projId, 1))), 'the new project is announced to the website');
r = await edit('POST', '/entities/project', { name: 'API project', cityId }); ok(r.status === 422 && r.body.field === 'name', 'duplicate project name is refused');
r = await edit('POST', '/entities/project', { name: 'Bad Area', cityId: String(cairo._id), areaId }); ok(r.status === 422 && r.body.field === 'areaId', 'an area from another city is refused', r.body);
r = await edit('POST', '/entities/project', { name: 'Bad Dev', cityId, developerId: String(new mongoose.Types.ObjectId()) }); ok(r.status === 422 && r.body.field === 'developerId', 'an unknown developer is refused');
r = await edit('POST', '/entities/project', { name: 'Bad Id', cityId, developerId: 'zzz' }); ok(r.status === 422 && r.body.field === 'developerId', 'a malformed id is refused');
r = await edit('POST', '/entities/project', { name: 'No City' }); ok(r.status === 422 && r.body.field === 'cityId', 'a project needs a city');

r = await edit('PATCH', '/entities/project/' + projId, { name: 'API Project Renamed' }, { expectedVersion: 1 });
ok(r.status === 200 && r.body.record.version === 2 && r.body.record.name === 'API Project Renamed', 'edit with the right version is confirmed with the new version', r.body);
n0 = got.length; await sleep(1200); ok(evsOf('project', projId).length === 2 && got.length - n0 === 0, 'no update loop: one event per version and nothing more afterwards', evsOf('project', projId).length);
r = await edit('PATCH', '/entities/project/' + projId, { name: 'Stale Name' }, { expectedVersion: 1 });
ok(r.status === 409 && r.body.code === 'version_conflict' && r.body.current.name === 'API Project Renamed' && r.body.current.version === 2, 'edit with an old version is refused with the current record', r.body);
ok((await M.Lookup.findById(projId).lean()).label === 'API Project Renamed', 'a refused edit changes nothing');
await M.Lookup.updateOne({ _id: projId }, { $set: { label: 'Renamed in the CRM', value: 'Renamed in the CRM' } });
r = await edit('PATCH', '/entities/project/' + projId, { active: false }, { expectedVersion: 2 });
ok(r.status === 409 && r.body.current.name === 'Renamed in the CRM', 'a change made in the CRM a moment ago is noticed as a conflict', r.body);
r = await edit('PATCH', '/entities/project/' + projId, { active: false }, { expectedVersion: r.body.current && r.body.current.version });
ok(r.status === 200 && r.body.record.active === false && r.body.record.name === 'Renamed in the CRM', 'after reading the new version the edit goes through and keeps the CRM\'s name', r.body);
r = await edit('PATCH', '/entities/project/' + projId, { name: 'No Version' }); ok(r.status === 400, 'an edit without a version is refused');
r = await edit('PATCH', '/entities/project/' + new mongoose.Types.ObjectId(), { name: 'Ghost' }, { expectedVersion: 1 }); ok(r.status === 404, 'editing a record that does not exist answers 404');
r = await edit('PATCH', '/entities/project/not-an-id', { name: 'Ghost' }, { expectedVersion: 1 }); ok(r.status === 404, 'a malformed id answers 404');
const cur = (await call('GET', '/snapshot')).body.projects.find((x) => x.id === projId);
const devD = (await edit('POST', '/entities/developer', { name: 'Dev Delta' })).body.record.id;
r = await edit('PATCH', '/entities/project/' + projId, { developerId: devD }, { expectedVersion: cur.version });
ok(r.status === 200 && r.body.record.developerId === devD, 'moving a project to another developer');
ok(!(await M.Developer.findById(gammaId).lean()).projects.map(String).includes(projId) && (await M.Developer.findById(devD).lean()).projects.map(String).includes(projId), 'both developers\' project lists follow the move');
r = await edit('PATCH', '/entities/project/' + projId, { developerId: '' }, { expectedVersion: r.body.record.version });
ok(r.status === 200 && r.body.record.developerId === '' && !(await M.Developer.findById(devD).lean()).projects.map(String).includes(projId), 'removing the developer from a project');
r = await edit('PATCH', '/entities/city/' + cityId, { name: 'Marsa Matruh Coast' }, { expectedVersion: 1 });
ok(r.status === 200 && r.body.record.name === 'Marsa Matruh Coast', 'rename a city', r.body);
ok((await M.Lookup.findById(projId).lean()).region === 'Marsa Matruh Coast', 'the new city name is carried into the CRM project records');
r = await edit('PATCH', '/entities/area/' + areaId, { name: 'Sidi Abdel Rahman Bay' }, { expectedVersion: 1 });
ok(r.status === 200 && r.body.record.name === 'Sidi Abdel Rahman Bay', 'rename an area', r.body);
ok((await M.Lookup.findById(projId).lean()).subArea === 'Sidi Abdel Rahman Bay', 'the new area name is carried into the CRM project records');
r = await edit('PATCH', '/entities/area/' + areaId, { cityId: String(cairo._id) }, { expectedVersion: 2 }); ok(r.status === 422 && r.body.field === 'cityId', 'an area cannot be moved to another city');
await sleep(500);

/* ---------- who may call ---------- */
const bad = [
  ['no signature', await call('GET', '/snapshot', undefined, { unsigned: true })],
  ['wrong secret', await call('GET', '/snapshot', undefined, { secret: 'not-the-secret' })],
  ['old timestamp', await call('GET', '/snapshot', undefined, { ts: Date.now() - 10 * 60 * 1000 })],
  ['forged signature', await call('GET', '/snapshot', undefined, { sig: 'sha256=' + '0'.repeat(64) })],
  ['edit with wrong secret', await call('POST', '/entities/developer', { requestId: 'forged0001', fields: { name: 'Intruder' } }, { secret: 'nope' })],
  ['status unsigned', await call('GET', '/status', undefined, { unsigned: true })]
];
for (const [n, x] of bad) ok(x.status === 401 && !(x.body && (x.body.projects || x.body.developers)), 'refused: ' + n, x.status);
ok(await M.Developer.countDocuments({ name: 'Intruder' }) === 0, 'a forged edit changed nothing');
const rp = await call('GET', '/snapshot', undefined, { ts: Date.now() - 1000 }); ok(rp.status === 200, 'a request a second old is accepted');
ok((await call('GET', '/nothing-here')).status === 404, 'unknown paths answer 404');

/* ---------- the website\'s copy can always be rebuilt from the snapshot ---------- */
await scan(); const fin = await call('GET', '/snapshot'), live = await buildCatalog();
const snapIds = new Set(['developers', 'cities', 'areas', 'projects'].flatMap((k) => fin.body[k].map((x) => x.id))), liveIds = new Set([...live.values()].map((x) => x.id));
ok(snapIds.size === liveIds.size && [...liveIds].every((i) => snapIds.has(i)), 'snapshot matches the live catalog record for record', { snap: snapIds.size, live: liveIds.size });
ok(fin.body.projects.every((p) => p.version >= 1) && !fin.body.projects.find((p) => p.id === String(p3._id) && p.version < 3), 'snapshot versions are the latest versions');
const drained = await until(async () => (await Outbox.countDocuments({ status: 'pending' })) === 0, 8000, 100);
ok(!!drained, 'nothing is left waiting at the end', (await Outbox.find({ status: 'pending' }).select('entity version attempts lastError nextAttemptAt').lean()).map((o) => [o.entity, o.version, o.attempts, o.lastError]));

/* ---------- report ---------- */
const lines = ['RESULT passed=' + pass + ' failed=' + fail, 'LATENCY_MS write-returned-to-event-received: samples=' + lat.length + ' median=' + median(lat) + ' p95=' + pct(lat, 0.95) + ' max=' + Math.max(...lat) + ' | bulk25=' + bulkMs];
console.log(lines.join('\n'));
for (const k of kids) { try { k.kill('SIGKILL'); } catch (_) { /* gone */ } }
srv.close(); mock.close(); await mongoose.disconnect(); process.exit(fail ? 1 : 0);
