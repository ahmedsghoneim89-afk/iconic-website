// Draws the favicon set and the default social image from the traced logo. Run: NODE_PATH=/opt/npm-tools/node_modules node make_icons.js
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const root = fs.existsSync(path.join(__dirname, '..', 'server')) ? path.join(__dirname, '..') : path.join(__dirname, '..', 'iconic-server');
const pub = path.join(root, 'public');
const logo = fs.readFileSync(path.join(pub, 'logo.svg'), 'utf8'), mark = fs.readFileSync(path.join(pub, 'mark.svg'), 'utf8');
const markPath = /<path d="([^"]+)"/.exec(mark)[1], box = /viewBox="([^"]+)"/.exec(mark)[1].split(' ').map(Number);

function tile(size, frac, radius) {
  const h = size * frac, s = h / box[3], w = box[2] * s, tx = (size - w) / 2 - box[0] * s, ty = (size - h) / 2 - box[1] * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#050507"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})"><path d="${markPath}" fill="#c8a96a" fill-rule="evenodd"/></g></svg>`;
}
(async () => {
  fs.writeFileSync(path.join(pub, 'favicon.svg'), tile(64, 0.66, 12));
  const png = (svg, n) => sharp(Buffer.from(svg), { density: 300 }).resize(n, n).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(pub, 'apple-touch-icon.png'), await png(tile(180, 0.62, 0), 180));
  fs.writeFileSync(path.join(pub, 'icon-192.png'), await png(tile(192, 0.56, 0), 192));
  fs.writeFileSync(path.join(pub, 'icon-512.png'), await png(tile(512, 0.56, 0), 512));
  const p32 = await png(tile(64, 0.7, 10), 32), hd = Buffer.alloc(22);
  hd.writeUInt16LE(0, 0); hd.writeUInt16LE(1, 2); hd.writeUInt16LE(1, 4); hd[6] = 32; hd[7] = 32; hd.writeUInt16LE(1, 10); hd.writeUInt16LE(32, 12); hd.writeUInt32LE(p32.length, 14); hd.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([hd, p32]));
  // social image 1200x630: the full logo on the brand's obsidian, framed by a fine gold line
  const lb = /viewBox="([^"]+)"/.exec(logo)[1].split(' ').map(Number), H = 330, s = H / lb[3], W = lb[2] * s, x = (1200 - W) / 2, y = (630 - H) / 2;
  const inner = logo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630"><defs><radialGradient id="g" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="#14141b"/><stop offset="1" stop-color="#050507"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#c8a96a" stroke-opacity=".35" stroke-width="1.5"/><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(5)}) translate(${-lb[0]} ${-lb[1]})">${inner}</g></svg>`;
  fs.writeFileSync(path.join(pub, 'og-default.png'), await sharp(Buffer.from(og), { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toBuffer());
  console.log(fs.readdirSync(pub).map((f) => f + ' ' + fs.statSync(path.join(pub, f)).size).join('\n'));
})();
