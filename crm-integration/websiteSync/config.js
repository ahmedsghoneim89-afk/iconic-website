// Settings come from the CRM's runtime environment, read when needed (the environment is loaded after the imports run).
export const cfg = () => ({
  url: String(process.env.WEBSITE_SYNC_URL || '').trim(),                 // where the website receives events
  eventSecret: String(process.env.WEBSITE_EVENT_SECRET || ''),            // we sign events with this
  requestSecret: String(process.env.WEBSITE_REQUEST_SECRET || ''),        // the website signs its requests to us with this
  createdBy: String(process.env.WEBSITE_SYNC_CREATED_BY || '').trim(),    // CRM user recorded as creator of records made from the website (optional)
  timeoutMs: Number(process.env.WEBSITE_SYNC_TIMEOUT_MS) || 8000,
  workspace: 'ICONIC'
});
export const enabled = () => { const c = cfg(); return !!(c.url && c.eventSecret && c.requestSecret); };
export const PROJECT_TYPES = ['project-name', 'project_name'];
