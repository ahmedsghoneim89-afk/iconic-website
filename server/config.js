'use strict';
const path = require('node:path');
const env = process.env;
const root = path.resolve(__dirname, '..');
const siteUrl = (env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
module.exports = {
  root,
  port: Number(env.PORT) || 3000,
  host: env.HOST || '0.0.0.0',
  siteUrl,
  secure: siteUrl.startsWith('https://'),
  dataDir: path.resolve(env.DATA_DIR || path.join(root, 'data')),
  defaultLang: env.DEFAULT_LANG === 'en' ? 'en' : 'ar',
  trustProxy: env.TRUST_PROXY === '1',
  adminEmail: (env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: env.ADMIN_PASSWORD || '',
  leadWebhook: env.LEAD_WEBHOOK_URL || '',
  /* optional: push every new "sell your unit" request to the company's WhatsApp through Meta's WhatsApp Cloud API (secrets stay in the environment, never in the code) */
  waToken: env.WA_CLOUD_TOKEN || '', waPhoneId: env.WA_CLOUD_PHONE_ID || '', waTo: env.WA_NOTIFY_TO || '', waTemplate: env.WA_TEMPLATE || '', waTemplateLang: env.WA_TEMPLATE_LANG || 'ar', waUrl: (env.WA_CLOUD_URL || 'https://graph.facebook.com/v21.0').replace(/\/+$/, ''),
  /* mail notices: the dashboard holds the mailbox; this only lets a development setup use a mail server on the same machine */
  smtpAllowPrivate: env.SMTP_ALLOW_PRIVATE === '1',
  googleVerification: env.GOOGLE_SITE_VERIFICATION || '',
  bingVerification: env.BING_SITE_VERIFICATION || '',
  brand: env.BRAND_NAME || 'ICONIC Real Estate',
  /* ICONIC CRM catalog link: one secret signs what the CRM sends us, another signs what we send the CRM */
  crmUrl: (env.CRM_SYNC_URL || '').replace(/\/+$/, ''),
  crmEventSecret: env.CRM_EVENT_SECRET || '',
  crmRequestSecret: env.CRM_REQUEST_SECRET || '',
  crmTimeoutMs: Number(env.CRM_TIMEOUT_MS) || 10000,
  crmSafetyHours: env.CRM_SAFETY_RECONCILE_HOURS === undefined ? 6 : Number(env.CRM_SAFETY_RECONCILE_HOURS),
  sessionDays: 14,
  maxUpload: 12 * 1024 * 1024
};
