// Delivers queued events to the website: at once when something is queued, again with growing pauses when the website is unreachable.
// An event is removed from the queue only after the website says it has it. Any worker may deliver; a lease keeps two from sending the same one.
import crypto from 'node:crypto';
import { Outbox } from './models.js';
import { cfg, enabled } from './config.js';

let stopped = false, looping = false, rerun = false, idle = null;
const LEASE_MS = 30000, MAX_BACKOFF_S = 300;
export const backoffSeconds = (attempts) => Math.min(MAX_BACKOFF_S, Math.pow(2, Math.max(0, attempts - 1)));
const sign = (secret, ts, body) => 'sha256=' + crypto.createHmac('sha256', secret).update(ts + '.' + body).digest('hex');

export function kick() { if (stopped || !enabled()) return; setImmediate(() => loop().catch((e) => console.error('[website-sync] delivery loop failed:', e && e.message || e))); }
export function stop() { stopped = true; clearTimeout(idle); }
export function start() { stopped = false; kick(); }

async function claim() {
  const now = new Date();
  return Outbox.findOneAndUpdate({ status: 'pending', nextAttemptAt: { $lte: now }, $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }] }, { $set: { lockedUntil: new Date(Date.now() + LEASE_MS) }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, new: true }).lean();
}
export async function deliverOne(ev) {
  const c = cfg();
  const body = JSON.stringify({ eventId: ev.eventId, entity: ev.entity, id: ev.entityId, version: ev.version, op: ev.op, occurredAt: new Date(ev.createdAt).getTime(), record: ev.record || undefined });
  const ts = String(Date.now()), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), c.timeoutMs);
  let http = 0, err = '';
  try {
    const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Iconic-Timestamp': ts, 'X-Iconic-Signature': sign(c.eventSecret, ts, body) }, body, signal: ctl.signal });
    http = r.status; if (r.status !== 200) err = 'website answered ' + r.status;
  } catch (e) { err = e && e.name === 'AbortError' ? 'website did not answer in time' : 'website not reachable'; }
  finally { clearTimeout(timer); }
  if (http === 200) { await Outbox.updateOne({ _id: ev._id }, { $set: { status: 'sent', sentAt: new Date(), lastHttp: 200, lastError: '', lockedUntil: null } }); return 'sent'; }
  const permanent = http >= 400 && http < 500 && ![401, 408, 429].includes(http);   // the website understood and refused: waiting will not help
  if (permanent) { await Outbox.updateOne({ _id: ev._id }, { $set: { status: 'rejected', lastHttp: http, lastError: err, lockedUntil: null } }); return 'rejected'; }
  await Outbox.updateOne({ _id: ev._id }, { $set: { lastHttp: http, lastError: err, lockedUntil: null, nextAttemptAt: new Date(Date.now() + backoffSeconds(ev.attempts) * 1000 + Math.floor(Math.random() * 400)) } });
  return 'retry';
}
async function loop() {
  if (looping) { rerun = true; return; }
  looping = true;
  try { do { rerun = false; for (;;) { if (stopped || !enabled()) break; const ev = await claim(); if (!ev) break; await deliverOne(ev); } } while (rerun); }
  finally { looping = false; scheduleIdle().catch(() => {}); }
}
/* wake up when the next retry is due; otherwise look every few seconds, which also picks up events queued by another worker */
async function scheduleIdle() {
  clearTimeout(idle); if (stopped || !enabled()) return;
  const next = await Outbox.findOne({ status: 'pending' }).sort({ nextAttemptAt: 1 }).select('nextAttemptAt lockedUntil').lean();
  const wait = next ? Math.min(5000, Math.max(250, Math.max(new Date(next.nextAttemptAt).getTime(), next.lockedUntil ? new Date(next.lockedUntil).getTime() : 0) - Date.now())) : 5000;
  idle = setTimeout(kick, wait); if (idle.unref) idle.unref();
}
/* for the status page and the "send again" action */
export async function outboxStatus() {
  const rows = await Outbox.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, oldest: { $min: '$createdAt' } } }]);
  const by = Object.fromEntries(rows.map((r) => [r._id, { count: r.n, oldest: r.oldest }]));
  const lastSent = await Outbox.findOne({ status: 'sent' }).sort({ sentAt: -1 }).select('sentAt entity entityId version').lean();
  const lastFailure = await Outbox.findOne({ status: { $in: ['pending', 'rejected'] }, lastError: { $ne: '' } }).sort({ _id: -1 }).select('lastError lastHttp attempts status entity entityId version').lean();
  return { pending: (by.pending || {}).count || 0, oldestPending: (by.pending || {}).oldest || null, rejected: (by.rejected || {}).count || 0, sent: (by.sent || {}).count || 0, lastSent, lastFailure };
}
export async function redeliver(scope) {
  const q = scope === 'all' ? { status: { $in: ['pending', 'rejected'] } } : { status: 'rejected' };
  const r = await Outbox.updateMany(q, { $set: { status: 'pending', nextAttemptAt: new Date(), lockedUntil: null, attempts: 0, lastError: '' } });
  kick(); return r.modifiedCount || 0;
}
