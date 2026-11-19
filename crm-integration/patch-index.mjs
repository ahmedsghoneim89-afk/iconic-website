// Adds the four lines the website link needs to the CRM's src/index.js. Refuses to touch the file unless every anchor is found exactly once.
// Usage: node patch-index.mjs <path to src/index.js> [--undo]
import fs from 'node:fs';
const file = process.argv[2], undo = process.argv.includes('--undo');
let src = fs.readFileSync(file, 'utf8');
const MARK = '// ICONIC website link';
const edits = [
  { anchor: "import uploadRoutes from './routes/uploads.js';", line: "import './websiteSync/plugin.js'; " + MARK + ": must load before any model", where: 'before' },
  { anchor: "import { startLicenseHeartbeat, verifyRuntimeLicense } from './security/licenseClient.js';", line: "import websiteSyncRouter, { startWebsiteSync } from './websiteSync/index.js'; " + MARK, where: 'after' },
  { anchor: "app.use(compression({ level: 6, threshold: 1024 }));", line: "app.use('/api/website-sync', websiteSyncRouter); " + MARK + ": signed requests, reads its own raw body", where: 'before' },
  { anchor: "const HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';", line: "startWebsiteSync(); " + MARK, where: 'before' }
];
if (undo) {
  const kept = src.split('\n').filter((l) => !l.includes(MARK));
  fs.writeFileSync(file, kept.join('\n')); console.log('website link lines removed'); process.exit(0);
}
if (src.includes(MARK)) { console.log('already patched'); process.exit(0); }
const lines = src.split('\n');
const at = (anchor) => { const hits = lines.map((l, i) => (l.trim() === anchor ? i : -1)).filter((i) => i >= 0); if (hits.length !== 1) { console.error('anchor not found exactly once (' + hits.length + '): ' + anchor); process.exit(2); } return hits[0]; };
const plan = edits.map((e) => ({ i: at(e.anchor), e }));
plan.sort((a, b) => b.i - a.i);   // from the bottom up so earlier line numbers stay valid
for (const { i, e } of plan) {
  const indent = lines[i].match(/^\s*/)[0];
  lines.splice(e.where === 'before' ? i : i + 1, 0, indent + e.line);
}
fs.writeFileSync(file, lines.join('\n')); console.log('patched ' + plan.length + ' places');
