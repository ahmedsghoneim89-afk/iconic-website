'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('../config');

const dir = path.join(cfg.root, 'server', 'templates');
const publicDir = path.join(cfg.root, 'public');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_) { return d; } };
const assets = readJson('assets.json', { css: '', js: '', page: '', pageCss: '' });
let homeBody = ''; try { homeBody = fs.readFileSync(path.join(dir, 'home-body.html'), 'utf8'); } catch (_) { /* run the build first */ }

/* animation libraries: served from this site when they are in public/vendor, otherwise from the CDN */
const VENDOR = [['gsap.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'], ['ScrollTrigger.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'], ['three.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js']];
const vendorUrls = () => VENDOR.map(([f, cdn]) => (fs.existsSync(path.join(publicDir, 'vendor', f)) ? '/vendor/' + f : cdn));

module.exports = { assets, homeBody, vendorUrls, publicDir };
