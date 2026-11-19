// The website's door into the CRM: signed requests only. Mounted before the CRM's own body parsing so the exact bytes can be checked.
import express from 'express';
import crypto from 'node:crypto';
import { cfg } from './config.js';
import { State } from './models.js';
import { run as scan } from './scanner.js';
import { publicRecord } from './projection.js';
import { applyEdit } from './edits.js';
import { outboxStatus, redeliver } from './dispatcher.js';

const router = express.Router();
router.use(express.raw({ type: () => true, limit: '256kb' }));

function signed(req, res, next) {
  const secret = cfg().requestSecret;
  if (!secret) return res.status(503).json({ ok: false, message: 'The website link is not configured' });
  const ts = String(req.headers['x-iconic-timestamp'] || ''), sig = String(req.headers['x-iconic-signature'] || '');
  const n = Number(ts); if (!Number.isFinite(n) || Math.abs(Date.now() - n) > 5 * 60 * 1000) return res.status(401).json({ ok: false, message: 'Missing or old timestamp' });
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const want = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(ts + '.' + body).digest('hex')), got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return res.status(401).json({ ok: false, message: 'Bad signature' });
  try { req.payload = body ? JSON.parse(body) : {}; } catch (_) { return res.status(400).json({ ok: false, message: 'Bad JSON' }); }
  next();
}
const guard = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { console.error('[website-sync] request failed:', e && e.stack || e); if (!res.headersSent) res.status(500).json({ ok: false, message: 'The CRM could not handle this request' }); } };

router.get('/snapshot', signed, guard(async (req, res) => {
  await scan();
  const states = await State.find({ deleted: false }).lean(), out = { ok: true, generatedAt: Date.now(), scope: 'ICONIC', developers: [], cities: [], areas: [], projects: [] };
  const key = { developer: 'developers', city: 'cities', area: 'areas', project: 'projects' };
  for (const st of states) if (key[st.entity] && st.record) out[key[st.entity]].push(publicRecord(st));
  res.json(out);
}));
router.get('/status', signed, guard(async (req, res) => { res.json(Object.assign({ ok: true }, await outboxStatus(), { records: await State.countDocuments({ deleted: false }) })); }));
router.post('/redeliver', signed, guard(async (req, res) => { res.json({ ok: true, requeued: await redeliver(req.payload && req.payload.scope === 'all' ? 'all' : 'rejected') }); }));
router.post('/entities/:entity', signed, guard(async (req, res) => { const r = await applyEdit(req.params.entity, null, req.payload); res.status(r.status).json(r.body); }));
router.patch('/entities/:entity/:id', signed, guard(async (req, res) => { const r = await applyEdit(req.params.entity, req.params.id, req.payload); res.status(r.status).json(r.body); }));
router.use((req, res) => res.status(404).json({ ok: false, message: 'Not found' }));
export default router;
