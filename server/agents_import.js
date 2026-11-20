'use strict';
/* Bulk upload of sales agents from an Excel (.xlsx) or CSV file.
   The file is read here, on the server, with no outside library: an .xlsx is a zip of XML parts. Nothing is trusted from the browser except the file itself.
   `plan` reads and checks every row and reports what would happen; `apply` does the same and then saves the good rows in one step.
   A person already on the site (same id, WhatsApp number or email) is updated, and only with the columns the file fills in, so photos and everything else stay. */
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const store = require('./db');
const schema = require('./schema');
const { httpError } = require('./util');

const MAX_ROWS = 1000, MAX_PART = 24 * 1024 * 1024;
const bad = (code) => httpError(422, code);

/* ---------- reading an .xlsx ---------- */
function unzip(buf) {
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) throw bad('file_unreadable');
  const files = new Map(); let p = buf.readUInt32LE(end + 16);
  const count = buf.readUInt16LE(end + 10);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw bad('file_unreadable');
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    files.set(buf.toString('utf8', p + 46, p + 46 + nameLen), { method: buf.readUInt16LE(p + 10), size: buf.readUInt32LE(p + 20), full: buf.readUInt32LE(p + 24), at: buf.readUInt32LE(p + 42) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return (name) => {
    const f = files.get(name); if (!f) return null;
    if (f.full > MAX_PART) throw bad('file_too_big');
    if (buf.readUInt32LE(f.at) !== 0x04034b50) throw bad('file_unreadable');
    const start = f.at + 30 + buf.readUInt16LE(f.at + 26) + buf.readUInt16LE(f.at + 28), data = buf.subarray(start, start + f.size);
    if (f.method === 0) return data.toString('utf8');
    if (f.method === 8) return zlib.inflateRawSync(data, { maxOutputLength: MAX_PART }).toString('utf8');
    throw bad('file_unreadable');
  };
}
const unxml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (k === 'amp') return '&'; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'quot') return '"'; if (k === 'apos') return "'";
  const n = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
  return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
}).replace(/_x([0-9A-Fa-f]{4})_/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
const texts = (xml) => { let out = ''; for (const m of xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) out += m[1]; return unxml(out); };
const colIndex = (ref) => { const m = /^([A-Z]+)/i.exec(ref || ''); if (!m) return -1; let n = 0; for (const ch of m[1].toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

function readXlsx(buf) {
  let read; try { read = unzip(buf); } catch (e) { throw e.status ? e : bad('file_unreadable'); }
  try {
    const wb = read('xl/workbook.xml'); if (wb == null) throw bad('file_unreadable');
    let part = 'xl/worksheets/sheet1.xml';
    const first = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb), rels = read('xl/_rels/workbook.xml.rels');
    if (first && rels) { for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) { const id = /\bId="([^"]+)"/.exec(m[1]), tg = /\bTarget="([^"]+)"/.exec(m[1]); if (id && tg && id[1] === first[1]) { part = tg[1].startsWith('/') ? tg[1].slice(1) : 'xl/' + tg[1].replace(/^\.\//, ''); break; } } }
    const sheet = read(part); if (sheet == null) throw bad('file_unreadable');
    const sst = read('xl/sharedStrings.xml'), shared = sst ? [...sst.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1])) : [];
    const rows = [];
    for (const rm of sheet.replace(/<row\b[^>]*\/>/g, '').matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const row = []; let next = 0; const rn = /\br="(\d+)"/.exec(rm[1]);
      for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cm[1], body = cm[2] || '', ref = /\br="([^"]+)"/.exec(attrs), type = /\bt="([^"]+)"/.exec(attrs);
        const at = ref ? colIndex(ref[1]) : next; next = at + 1; if (at < 0 || at > 200) continue;
        const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body); let val = '';
        if (type && type[1] === 's') val = shared[parseInt(v && v[1], 10)] || '';
        else if (type && type[1] === 'inlineStr') val = texts(body);
        else if (type && type[1] === 'b') val = v && v[1] === '1' ? 'TRUE' : 'FALSE';
        else if (type && type[1] === 'e') val = '';
        else if (v) { val = unxml(v[1]); if (!type || type[1] === 'n') { const n = Number(val); if (Number.isFinite(n) && Number.isInteger(n) && Math.abs(n) < 1e21) val = BigInt(n).toString(); } }
        row[at] = val;
      }
      const at = rn ? parseInt(rn[1], 10) - 1 : rows.length; if (at < 0 || at > 100000) continue;
      while (rows.length < at) rows.push([]);
      rows[at] = Array.from(row, (x) => (x == null ? '' : String(x)));
    }
    return rows;
  } catch (e) { throw e.status ? e : bad('file_unreadable'); }
}

/* ---------- reading a CSV ---------- */
function decodeText(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le', 2);
  if (buf[0] === 0xfe && buf[1] === 0xff) { const b = Buffer.from(buf.subarray(2)); b.swap16(); return b.toString('utf16le'); }
  const body = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? buf.subarray(3) : buf;
  try { return new TextDecoder('utf-8', { fatal: true }).decode(body); } catch (_) { /* not UTF-8: an Arabic Windows export */ }
  try { return new TextDecoder('windows-1256').decode(body); } catch (_) { return body.toString('latin1'); }
}
function readCsv(buf) {
  let text = decodeText(buf);
  let delim = ',';
  const sep = /^sep=(.)\r?\n/i.exec(text); if (sep) { delim = sep[1]; text = text.slice(sep[0].length); }
  else { const line = text.split(/\r?\n/, 1)[0] || ''; const c = { ',': 0, ';': 0, '\t': 0 }; for (const ch of line) if (ch in c) c[ch]++; delim = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; if (!c[delim]) delim = ','; }
  const rows = []; let row = [], cell = '', quoted = false, any = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += ch; continue; }
    if (ch === '"' && !cell) { quoted = true; any = true; }
    else if (ch === delim) { row.push(cell); cell = ''; any = true; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; if (any || cell) { row.push(cell); rows.push(row); } row = []; cell = ''; any = false; }
    else { cell += ch; any = true; }
    if (rows.length > MAX_ROWS + 50) break;
  }
  if (any || cell) { row.push(cell); rows.push(row); }
  return rows;
}
function readRows(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) throw bad('file_empty');
  if (buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return readXlsx(buf);
  if (buf.length > 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) throw bad('file_old_excel');
  return readCsv(buf);
}

/* ---------- columns ---------- */
const hnorm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9ء-ي]/g, '');
const ALIASES = {
  id: ['id', 'معرف', 'كود', 'code'],
  team: ['team', 'team name', 'الفريق', 'فريق', 'اسم الفريق'],
  name_ar: ['name ar', 'name_ar', 'arabic name', 'ar name', 'name in arabic', 'الاسم بالعربي', 'الاسم بالعربية', 'الاسم عربي', 'الاسم العربي', 'اسم عربي'],
  name_en: ['name en', 'name_en', 'english name', 'en name', 'name in english', 'الاسم بالانجليزي', 'الاسم بالانجليزية', 'الاسم انجليزي', 'الاسم الانجليزي', 'اسم انجليزي'],
  name: ['name', 'full name', 'الاسم', 'اسم', 'الاسم الكامل'],
  role_ar: ['role ar', 'role_ar', 'title ar', 'job title ar', 'المسمى الوظيفي بالعربي', 'الوظيفة بالعربي', 'المسمى بالعربي', 'المنصب بالعربي'],
  role_en: ['role en', 'role_en', 'title en', 'job title en', 'المسمى الوظيفي بالانجليزي', 'الوظيفة بالانجليزي', 'المسمى بالانجليزي', 'المنصب بالانجليزي'],
  role: ['role', 'title', 'job title', 'position', 'المسمى الوظيفي', 'الوظيفة', 'المسمى', 'المنصب'],
  manager: ['manager', 'is manager', 'team manager', 'team lead', 'lead', 'مدير', 'مدير فريق', 'مدير الفريق', 'هل هو مدير', 'قائد الفريق'],
  whatsapp: ['whatsapp', 'wa', 'whatsapp number', 'واتساب', 'واتس اب', 'الواتساب', 'واتس', 'رقم الواتساب', 'رقم واتساب'],
  phone: ['phone', 'mobile', 'tel', 'telephone', 'phone number', 'الهاتف', 'التليفون', 'الموبايل', 'موبايل', 'رقم الهاتف', 'رقم التليفون', 'رقم الموبايل', 'تليفون', 'هاتف'],
  email: ['email', 'mail', 'email address', 'البريد', 'الايميل', 'البريد الالكتروني', 'ايميل', 'بريد'],
  order: ['order', 'sort order', 'sort', 'ترتيب', 'الترتيب']
};
const ALIAS_MAP = new Map(); for (const k of Object.keys(ALIASES)) for (const a of ALIASES[k]) ALIAS_MAP.set(hnorm(a), k);
function mapColumns(header) {
  const cols = {}, ignored = [];
  header.forEach((h, i) => { const label = String(h || '').trim(); if (!label) return; const k = ALIAS_MAP.get(hnorm(label)); if (k && cols[k] == null) cols[k] = i; else ignored.push(label); });
  return { cols, ignored };
}

/* ---------- one row ---------- */
const waKey = (v) => { let d = String(v || '').replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/\D/g, ''); if (/^01\d{9}$/.test(d)) d = '20' + d.slice(1); else if (/^1\d{9}$/.test(d)) d = '20' + d; return d; };
const phoneText = (v) => { let s = String(v || '').replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).trim(); if (/^1\d{9}$/.test(s)) s = '0' + s; return s; };
const isAr = (s) => /[؀-ۿ]/.test(s);
const YES = new Set(['yes', 'y', 'true', '1', 'x', '✓', '✔', 'نعم', 'ايوه', 'ايوا', 'اه', 'صح', 'مدير']), NO = new Set(['no', 'n', 'false', '0', 'لا', 'خطا', 'مش']);
function asFlag(v) {
  const s = String(v || '').trim(); if (!s) return undefined;
  const n = hnorm(s); if (YES.has(n) || YES.has(s.toLowerCase())) return true; if (NO.has(n) || NO.has(s.toLowerCase())) return false;
  if (/manager|مدير/i.test(s) && !/غير|not|non/i.test(s)) return true;
  return null;
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function plan(buf) {
  const all = readRows(buf), filled = (r) => r.some((c) => String(c || '').trim());
  const h = all.findIndex(filled); if (h < 0) throw bad('file_empty');
  if (!all.slice(h + 1).some(filled)) throw bad('file_no_rows');
  const { cols, ignored } = mapColumns(all[h]);
  if (cols.team == null) throw bad('col_team');
  if (cols.name == null && cols.name_ar == null && cols.name_en == null) throw bad('col_name');
  const body = []; all.forEach((r, i) => { if (i > h && filled(r)) body.push({ n: i + 1, r }); }); if (body.length > MAX_ROWS) throw bad('too_many');
  const teams = store.listDocs('teams').map((d) => ({ id: d.id, label: (d.data.name && (d.data.name.en || d.data.name.ar)) || d.id, keys: [d.id, d.data.name && d.data.name.en, d.data.name && d.data.name.ar].filter(Boolean).map(hnorm) }));
  const people = store.listDocs('agents'), byId = new Map(people.map((d) => [d.id, d])), byWa = new Map(), byMail = new Map();
  for (const d of people) { const k = waKey(d.data.whatsapp); if (k.length >= 8 && !byWa.has(k)) byWa.set(k, d); const m = String(d.data.email || '').toLowerCase(); if (m && !byMail.has(m)) byMail.set(m, d); }
  const get = (r, k) => (cols[k] == null ? '' : String(r[cols[k]] == null ? '' : r[cols[k]]).trim());
  // people added without an `order` keep the file's order: they come after everyone already placed
  let nextOrder = Math.max(100, ...people.map((d) => (typeof d.data.order === 'number' ? d.data.order : 0)));
  const seen = new Set(), out = [], counts = { create: 0, update: 0, error: 0 };
  body.forEach(({ n, r }) => {
    const row = { row: n, action: null, errors: [], name: '', team: get(r, 'team'), id: '', data: null };
    const errs = row.errors;
    // team
    let team = null; const tt = get(r, 'team');
    if (!tt) errs.push('team_missing'); else { const k = hnorm(tt), hit = teams.filter((x) => x.keys.includes(k)); if (hit.length === 1) { team = hit[0]; row.team = hit[0].label; } else errs.push(hit.length ? 'team_ambiguous' : 'team_unknown'); }
    // names and roles
    const name = { en: get(r, 'name_en'), ar: get(r, 'name_ar') }, g = get(r, 'name'); if (g) { const lang = isAr(g) ? 'ar' : 'en'; if (!name[lang]) name[lang] = g; }
    const role = { en: get(r, 'role_en'), ar: get(r, 'role_ar') }, gr = get(r, 'role'); if (gr) { const lang = isAr(gr) ? 'ar' : 'en'; if (!role[lang]) role[lang] = gr; }
    row.name = name.ar || name.en;
    // contact
    const wa = get(r, 'whatsapp'), phone = get(r, 'phone'), mail = get(r, 'email').toLowerCase(), order = get(r, 'order'), mgr = asFlag(get(r, 'manager')), idIn = get(r, 'id');
    if (wa && !(waKey(wa).length >= 8 && waKey(wa).length <= 15)) errs.push('whatsapp_bad');
    if (phone && phoneText(phone).replace(/\D/g, '').length < 7) errs.push('phone_bad');
    if (mail && !EMAIL.test(mail)) errs.push('email_bad');
    if (order && !(Number.isFinite(Number(order)) && Math.abs(Number(order)) <= 9999)) errs.push('order_bad');
    if (mgr === null) errs.push('manager_bad');
    // who is this: an id, then the WhatsApp number, then the email; otherwise a new person
    let prev = null;
    if (idIn) { prev = byId.get(idIn) || null; if (!prev) errs.push('id_unknown'); }
    if (!prev && !idIn && wa && waKey(wa).length >= 8) prev = byWa.get(waKey(wa)) || null;
    if (!prev && !idIn && mail) prev = byMail.get(mail) || null;
    if (!prev && !(name.en || name.ar)) errs.push('name_missing');
    if (!errs.length) {
      // the same person twice in one file
      const keys = []; if (prev) keys.push('id:' + prev.id); if (wa) keys.push('wa:' + waKey(wa)); if (mail) keys.push('em:' + mail);
      if (keys.some((k) => seen.has(k))) errs.push('dup_in_file'); else keys.forEach((k) => seen.add(k));
    }
    if (!errs.length) {
      const data = prev ? JSON.parse(JSON.stringify(prev.data)) : { name: { en: '', ar: '' }, role: { en: '', ar: '' }, manager: false };
      data.team = team.id;
      data.name = { en: name.en || (data.name && data.name.en) || '', ar: name.ar || (data.name && data.name.ar) || '' };
      data.role = { en: role.en || (data.role && data.role.en) || '', ar: role.ar || (data.role && data.role.ar) || '' };
      if (mgr !== undefined) data.manager = mgr; else if (!prev) data.manager = false;
      if (wa) data.whatsapp = phoneText(wa); if (phone) data.phone = phoneText(phone); if (mail) data.email = mail;
      if (order) data.order = Number(order); else if (!prev) data.order = Math.min(9999, ++nextOrder);
      const id = prev ? prev.id : 'a-' + crypto.randomBytes(5).toString('hex');
      try { row.data = schema.validate('agents', id, data); row.id = id; row.action = prev ? 'update' : 'create'; }
      catch (_) { errs.push('invalid'); }
    }
    if (errs.length) { row.action = null; row.data = null; counts.error++; } else counts[row.action]++;
    out.push(row);
  });
  return { columns: { found: Object.keys(cols), ignored }, total: body.length, counts, rows: out };
}

function apply(buf) {
  const p = plan(buf), good = p.rows.filter((r) => r.data);
  if (good.length) store.transaction((tx) => { for (const r of good) tx.put('agents', r.id, r.data); });
  return { created: p.counts.create, updated: p.counts.update, skipped: p.counts.error, errors: p.rows.filter((r) => r.errors.length).map((r) => ({ row: r.row, name: r.name, errors: r.errors })) };
}
const preview = (buf) => { const p = plan(buf); return { columns: p.columns, total: p.total, counts: p.counts, rows: p.rows.map((r) => ({ row: r.row, action: r.action, name: r.name, team: r.team, errors: r.errors })) }; };

module.exports = { plan, preview, apply, readRows, hnorm, waKey };
