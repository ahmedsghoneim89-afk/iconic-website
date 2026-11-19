// Looks at the catalog as it is now, compares it with what the website was last told, and records every difference as a new
// version plus a waiting event. Safe to run from every worker at once: a record's version moves forward only if nobody else moved it first.
import crypto from 'node:crypto';
import { buildCatalog, hashOf } from './projection.js';
import { State, Outbox } from './models.js';
import { setHandler } from './trigger.js';
import { kick } from './dispatcher.js';

let scanning = null, again = false;
const log = (...a) => console.log('[website-sync]', ...a);

/* a change was made: look at once. Changes that arrive while a scan is running share one follow-up scan, so a bulk import is a couple of scans, not one per record. */
export function schedule() { setImmediate(() => run().catch((e) => console.error('[website-sync] scan failed:', e && e.message || e))); }
/* a scan that starts after this call; calls made while one is running share the follow-up scan */
export function run() {
  if (scanning) { again = true; return scanning; }
  scanning = (async () => { do { again = false; await scanOnce(); } while (again); })().finally(() => { scanning = null; });
  return scanning;
}

async function emit(state) {
  const ev = { eventId: crypto.randomUUID().replace(/-/g, ''), entity: state.entity, entityId: state.entityId, version: state.version, op: state.deleted ? 'delete' : 'upsert', record: state.deleted ? null : state.record, status: 'pending', attempts: 0, nextAttemptAt: new Date(), createdAt: new Date() };
  try { await Outbox.create(ev); } catch (e) { if (e && e.code !== 11000) throw e; }   // the same version is never queued twice
  await State.updateOne({ _id: state._id, emittedVersion: { $lt: state.version } }, { $set: { emittedVersion: state.version } });
  kick();
}
async function advance(key, rec, hash, st) {
  const [entity, ...rest] = key.split(':'), entityId = rest.join(':'), deleted = !rec;
  let after;
  if (!st) {
    try { after = (await State.create({ _id: key, entity, entityId, version: 1, hash: hash || '', deleted, emittedVersion: 0, record: rec })).toObject(); }
    catch (e) { if (e && e.code === 11000) return; throw e; }   // another worker got there first
  } else {
    after = await State.findOneAndUpdate({ _id: key, version: st.version }, { $set: { hash: hash || st.hash, deleted, record: rec || st.record }, $inc: { version: 1 } }, { new: true }).lean();
    if (!after) return;
  }
  await emit(after);
}
async function scanOnce() {
  const catalog = await buildCatalog();
  const states = await State.find({}).lean(), byKey = new Map(states.map((s) => [s._id, s]));
  const touched = new Set();
  for (const [key, rec] of catalog) { const h = hashOf(rec), st = byKey.get(key); if (!st || st.hash !== h || st.deleted) { touched.add(key); await advance(key, rec, h, st); } }
  for (const st of states) if (!catalog.has(st._id) && !st.deleted) { touched.add(st._id); await advance(st._id, null, null, st); }
  for (const st of states) if (st.emittedVersion < st.version && !touched.has(st._id)) await emit(st);   // a crash between "version moved" and "event queued" is repaired here
}

/* first start: record the catalog as version 1 without queueing events; the website takes its first copy from the snapshot */
export async function seedIfEmpty() {
  if (await State.estimatedDocumentCount() > 0) return 0;
  const catalog = await buildCatalog(), docs = [];
  for (const [key, rec] of catalog) { const [entity, ...rest] = key.split(':'); docs.push({ _id: key, entity, entityId: rest.join(':'), version: 1, hash: hashOf(rec), deleted: false, emittedVersion: 1, record: rec }); }
  if (docs.length) { try { await State.insertMany(docs, { ordered: false }); } catch (e) { if (!(e && (e.code === 11000 || (e.writeErrors || []).every((w) => w.code === 11000)))) throw e; } }
  log('first start: recorded', docs.length, 'catalog records'); return docs.length;
}
export const attach = () => setHandler(() => schedule());
