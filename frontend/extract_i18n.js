// Runs 00-core.js with stubbed browser globals and writes the copy tables the server needs.
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/src/js/00-core.js', 'utf8');
const stub = { documentElement: { style: { setProperty() {} } }, querySelector() { return null; }, querySelectorAll() { return []; } };
const ctx = { window: { ICONIC: null }, document: stub, matchMedia: () => ({ matches: false, addEventListener() {} }), Intl, console, setTimeout, clearTimeout };
vm.createContext(ctx);
vm.runInContext(src + '\n;globalThis.__out = { I18N, REGIONS, TYPES, PURPOSES, JOB_TYPES };', ctx);
const o = ctx.__out;
fs.writeFileSync(process.argv[2], JSON.stringify({ i18n: o.I18N, regions: o.REGIONS, types: o.TYPES, purposes: o.PURPOSES, jobTypes: o.JOB_TYPES }));
console.log('i18n keys en/ar:', Object.keys(o.I18N.en).length, Object.keys(o.I18N.ar).length);
