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
  googleVerification: env.GOOGLE_SITE_VERIFICATION || '',
  bingVerification: env.BING_SITE_VERIFICATION || '',
  brand: env.BRAND_NAME || 'ICONIC Real Estate',
  sessionDays: 14,
  maxUpload: 12 * 1024 * 1024
};
