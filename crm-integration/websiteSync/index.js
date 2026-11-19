// Entry point used by the CRM: `app.use('/api/website-sync', router)` and `startWebsiteSync()` once the database is connected.
import router from './routes.js';
import { enabled, cfg } from './config.js';
import { ensureIndexes } from './models.js';
import { attach, seedIfEmpty, run } from './scanner.js';
import { start } from './dispatcher.js';

export async function startWebsiteSync() {
  if (!enabled()) { console.log('[website-sync] not configured; the link is off'); return; }   // installed but dormant until the secrets are set
  try {
    await ensureIndexes();
    attach();
    await seedIfEmpty();
    await run();
    start();
    // safety net, not the delivery path: changes made outside the CRM app (a database shell, a restore) are noticed within a minute. One worker is enough.
    if (!process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0') setInterval(() => run().catch(() => {}), 60000).unref();
    console.log('[website-sync] ready; events go to', new URL(cfg().url).origin);
  } catch (e) { console.error('[website-sync] could not start; the CRM keeps running without it:', e && e.stack || e); }
}
export default router;
