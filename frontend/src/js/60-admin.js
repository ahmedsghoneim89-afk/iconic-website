/* ---------- Admin dashboard ----------
   Opens on #admin (reached through the /admin address), only for people who can edit this page. Writes are also limited to editors by the database rules,
   so hiding the dashboard is a convenience and not the security boundary. */
const AD = {
  en: {
    title: 'Content dashboard', close: 'Close', lang: 'العربية', back: 'Back to the list',
    'nav.overview': 'Overview', 'nav.company': 'Company', 'nav.teams': 'Teams', 'nav.agents': 'Agents', 'nav.units': 'Units', 'nav.backup': 'Backup',
    'ov.lead': 'Everything on the site that comes from your company is edited here. Changes appear on the site as soon as they are saved.',
    'ov.teams': 'Teams', 'ov.agents': 'Agents', 'ov.units': 'Units', 'ov.todo': 'Still to add', 'ov.done': 'Nothing missing. The site has everything it needs.',
    'ov.noTeams': 'No teams yet.', 'ov.seed': 'Create the four regional teams', 'ov.seedHint': 'Alexandria, North Coast, Cairo and Red Sea, with names you can edit.',
    'ov.noWa': '{n} agent(s) without a WhatsApp number', 'ov.noPhoto': '{n} agent(s) without a photo', 'ov.noAgent': '{n} unit(s) not linked to an agent', 'ov.noUnits': 'No units yet.', 'ov.noCompany': 'Company WhatsApp, phone or email not set',
    'ov.noAgents': 'No agents yet.', 'ov.view': 'Open',
    'store.off': 'Storage is not available in this view, so nothing can be saved here. Open the page signed in as an editor.',
    'store.err': 'The database could not be reached. Saved content may be out of date.',
    'co.title': 'Company contact details', 'co.lead': 'Shown in the contact section. Leave a field empty to hide it.',
    'co.whatsapp': 'Company WhatsApp', 'co.phone': 'Company phone', 'co.email': 'Company email',
    'f.save': 'Save', 'f.cancel': 'Cancel', 'f.saving': 'Saving…', 'f.saved': 'Saved', 'f.failed': 'Could not save. Check that you can edit this page, then try again.',
    'f.add': 'Add', 'f.edit': 'Edit', 'f.delete': 'Delete', 'f.confirm': 'Delete', 'f.keep': 'Keep', 'f.req': 'Required', 'f.reqAny': 'Enter the name in at least one language',
    'f.en': 'English', 'f.ar': 'Arabic', 'f.order': 'Display order', 'f.orderHint': 'Lower numbers come first.', 'f.none': 'None', 'f.choose': 'Choose…',
    'f.badWa': 'Enter a valid number with country code, for example 201001234567, or 01001234567.', 'f.badPhone': 'Enter a valid phone number.', 'f.badEmail': 'Enter a valid email address.', 'f.badUrl': 'The link must start with https://',
    'tm.title': 'Sales teams', 'tm.lead': 'A team can serve one or more regions. Agents belong to a team.', 'tm.add': 'Add a team', 'tm.edit': 'Edit team', 'tm.new': 'New team',
    'tm.regions': 'Regions served', 'tm.regionsHint': 'Tick every region this team covers.', 'tm.reqRegion': 'Tick at least one region', 'tm.name': 'Team name', 'tm.empty': 'No teams yet. Create the four regional teams from Overview, or add one here.', 'tm.hasAgents': 'This team still has agents. Move or delete them first.',
    'tm.del': 'Delete the team “{name}”?',
    'ag.title': 'Agents', 'ag.lead': 'Photo, contact details and the units each agent handles.', 'ag.add': 'Add an agent', 'ag.edit': 'Edit agent', 'ag.new': 'New agent',
    'ag.team': 'Team', 'ag.name': 'Name', 'ag.role': 'Role', 'ag.photo': 'Photo', 'ag.wa': 'WhatsApp number', 'ag.waHint': 'With country code, digits only, for example 201001234567. A local number such as 01001234567 also works.',
    'ag.phone': 'Phone', 'ag.email': 'Email', 'ag.empty': 'No agents yet.', 'ag.needTeam': 'Add a team first. Every agent belongs to a team.',
    'ag.del': 'Delete {name}? Their units stay on the site and become unassigned.', 'ag.units': '{n} unit(s)', 'ag.allTeams': 'All teams', 'ag.noWa': 'No WhatsApp',
    'ph.upload': 'Upload a photo', 'ph.replace': 'Replace photo', 'ph.remove': 'Remove', 'ph.url': 'or paste an image link (https)', 'ph.busy': 'Uploading…', 'ph.fail': 'The photo could not be uploaded. Try a JPG or PNG under 20 MB.', 'ph.noUpload': 'Photo upload is available to editors only. You can paste an image link instead.',
    'un.title': 'Units', 'un.lead': 'Each unit belongs to a region and a project, and is handled by one agent.', 'un.add': 'Add a unit', 'un.edit': 'Edit unit', 'un.new': 'New unit',
    'un.name': 'Unit title', 'un.project': 'Project', 'un.region': 'Region', 'un.location': 'Location', 'un.type': 'Type', 'un.purpose': 'Purpose', 'un.agent': 'Handled by',
    'un.price': 'Price', 'un.priceHint': 'Leave empty to show “Price on request”.', 'un.currency': 'Currency', 'un.beds': 'Bedrooms', 'un.baths': 'Bathrooms', 'un.area': 'Area (m²)', 'un.desc': 'Description', 'un.images': 'Images',
    'un.empty': 'No units yet.', 'un.del': 'Delete the unit “{name}”?', 'un.search': 'Search units', 'un.allRegions': 'All regions', 'un.allAgents': 'All agents', 'un.unassigned': 'Unassigned', 'un.cover': 'Cover', 'un.addImages': 'Add images', 'un.moveUp': 'Move earlier', 'un.moveDown': 'Move later',
    'bk.title': 'Backup', 'bk.lead': 'Download everything as one file, or load a file made here. Importing adds and replaces records with the same id and never deletes others.',
    'bk.export': 'Download backup', 'bk.import': 'Load a backup file', 'bk.exported': 'Backup ready', 'bk.declined': 'Download cancelled', 'bk.imported': 'Imported {n} records', 'bk.bad': 'This file is not a backup from this dashboard.',
    'bk.note': 'Photos and images are stored with this page. A backup keeps their references, not the image files.'
  },
  ar: {
    title: 'لوحة إدارة المحتوى', close: 'إغلاق', lang: 'English', back: 'العودة إلى القائمة',
    'nav.overview': 'نظرة عامة', 'nav.company': 'بيانات الشركة', 'nav.teams': 'الفرق', 'nav.agents': 'الوكلاء', 'nav.units': 'الوحدات', 'nav.backup': 'نسخة احتياطية',
    'ov.lead': 'كل ما يظهر في الموقع من بيانات شركتك يُعدَّل من هنا. التغييرات تظهر في الموقع فور حفظها.',
    'ov.teams': 'الفرق', 'ov.agents': 'الوكلاء', 'ov.units': 'الوحدات', 'ov.todo': 'لم يُضَف بعد', 'ov.done': 'لا ينقص شيء. الموقع يملك كل ما يحتاجه.',
    'ov.noTeams': 'لا توجد فرق بعد.', 'ov.seed': 'إنشاء فرق المناطق الأربع', 'ov.seedHint': 'الإسكندرية والساحل الشمالي والقاهرة والبحر الأحمر، بأسماء يمكنك تعديلها.',
    'ov.noWa': '{n} وكيل بلا رقم واتساب', 'ov.noPhoto': '{n} وكيل بلا صورة', 'ov.noAgent': '{n} وحدة غير مرتبطة بوكيل', 'ov.noUnits': 'لا توجد وحدات بعد.', 'ov.noCompany': 'واتساب الشركة أو هاتفها أو بريدها غير مُدخل',
    'ov.noAgents': 'لا يوجد وكلاء بعد.', 'ov.view': 'فتح',
    'store.off': 'التخزين غير متاح في هذا العرض، فلا يمكن الحفظ هنا. افتح الصفحة وأنت مسجّل الدخول كمحرّر.',
    'store.err': 'تعذّر الوصول إلى قاعدة البيانات. قد يكون المحتوى المعروض قديمًا.',
    'co.title': 'بيانات التواصل مع الشركة', 'co.lead': 'تظهر في قسم التواصل. اترك الحقل فارغًا لإخفائه.',
    'co.whatsapp': 'واتساب الشركة', 'co.phone': 'هاتف الشركة', 'co.email': 'بريد الشركة',
    'f.save': 'حفظ', 'f.cancel': 'إلغاء', 'f.saving': 'جارٍ الحفظ…', 'f.saved': 'تم الحفظ', 'f.failed': 'تعذّر الحفظ. تأكد أنك تملك صلاحية التعديل على هذه الصفحة ثم حاول مرة أخرى.',
    'f.add': 'إضافة', 'f.edit': 'تعديل', 'f.delete': 'حذف', 'f.confirm': 'حذف', 'f.keep': 'إبقاء', 'f.req': 'مطلوب', 'f.reqAny': 'أدخل الاسم بلغة واحدة على الأقل',
    'f.en': 'الإنجليزية', 'f.ar': 'العربية', 'f.order': 'ترتيب العرض', 'f.orderHint': 'الأرقام الأصغر تظهر أولًا.', 'f.none': 'بدون', 'f.choose': 'اختر…',
    'f.badWa': 'أدخل رقمًا صحيحًا بكود الدولة، مثل 201001234567، أو 01001234567.', 'f.badPhone': 'أدخل رقم هاتف صحيحًا.', 'f.badEmail': 'أدخل بريدًا إلكترونيًا صحيحًا.', 'f.badUrl': 'يجب أن يبدأ الرابط بـ https://',
    'tm.title': 'فرق المبيعات', 'tm.lead': 'يمكن للفريق خدمة منطقة أو أكثر. كل وكيل ينتمي إلى فريق.', 'tm.add': 'إضافة فريق', 'tm.edit': 'تعديل الفريق', 'tm.new': 'فريق جديد',
    'tm.regions': 'المناطق التي يخدمها الفريق', 'tm.regionsHint': 'اختر كل منطقة يغطيها هذا الفريق.', 'tm.reqRegion': 'اختر منطقة واحدة على الأقل', 'tm.name': 'اسم الفريق', 'tm.empty': 'لا توجد فرق بعد. أنشئ فرق المناطق الأربع من النظرة العامة، أو أضف فريقًا من هنا.', 'tm.hasAgents': 'ما زال في هذا الفريق وكلاء. انقلهم أو احذفهم أولًا.',
    'tm.del': 'حذف فريق «{name}»؟',
    'ag.title': 'الوكلاء', 'ag.lead': 'الصورة وبيانات التواصل والوحدات التي يتولاها كل وكيل.', 'ag.add': 'إضافة وكيل', 'ag.edit': 'تعديل الوكيل', 'ag.new': 'وكيل جديد',
    'ag.team': 'الفريق', 'ag.name': 'الاسم', 'ag.role': 'المسمى الوظيفي', 'ag.photo': 'الصورة', 'ag.wa': 'رقم واتساب', 'ag.waHint': 'بكود الدولة وأرقام فقط، مثل 201001234567. ويصلح الرقم المحلي مثل 01001234567.',
    'ag.phone': 'الهاتف', 'ag.email': 'البريد الإلكتروني', 'ag.empty': 'لا يوجد وكلاء بعد.', 'ag.needTeam': 'أضف فريقًا أولًا. كل وكيل ينتمي إلى فريق.',
    'ag.del': 'حذف {name}؟ ستبقى وحداته في الموقع وتصبح بلا وكيل.', 'ag.units': '{n} وحدة', 'ag.allTeams': 'كل الفرق', 'ag.noWa': 'بلا واتساب',
    'ph.upload': 'رفع صورة', 'ph.replace': 'استبدال الصورة', 'ph.remove': 'إزالة', 'ph.url': 'أو الصق رابط صورة (https)', 'ph.busy': 'جارٍ الرفع…', 'ph.fail': 'تعذّر رفع الصورة. جرّب JPG أو PNG أقل من 20 ميجابايت.', 'ph.noUpload': 'رفع الصور متاح للمحرّرين فقط. يمكنك لصق رابط صورة بدلًا من ذلك.',
    'un.title': 'الوحدات', 'un.lead': 'كل وحدة تتبع منطقة ومشروعًا، ويتولاها وكيل واحد.', 'un.add': 'إضافة وحدة', 'un.edit': 'تعديل الوحدة', 'un.new': 'وحدة جديدة',
    'un.name': 'عنوان الوحدة', 'un.project': 'المشروع', 'un.region': 'المنطقة', 'un.location': 'الموقع', 'un.type': 'النوع', 'un.purpose': 'الغرض', 'un.agent': 'الوكيل المسؤول',
    'un.price': 'السعر', 'un.priceHint': 'اتركه فارغًا ليظهر «السعر عند الطلب».', 'un.currency': 'العملة', 'un.beds': 'غرف النوم', 'un.baths': 'الحمامات', 'un.area': 'المساحة (م²)', 'un.desc': 'الوصف', 'un.images': 'الصور',
    'un.empty': 'لا توجد وحدات بعد.', 'un.del': 'حذف الوحدة «{name}»؟', 'un.search': 'ابحث في الوحدات', 'un.allRegions': 'كل المناطق', 'un.allAgents': 'كل الوكلاء', 'un.unassigned': 'بلا وكيل', 'un.cover': 'الغلاف', 'un.addImages': 'إضافة صور', 'un.moveUp': 'تقديم', 'un.moveDown': 'تأخير',
    'bk.title': 'نسخة احتياطية', 'bk.lead': 'نزّل كل المحتوى في ملف واحد، أو حمّل ملفًا أُنشئ من هنا. الاستيراد يضيف السجلات ويستبدل ما له نفس المعرّف ولا يحذف غيره.',
    'bk.export': 'تنزيل نسخة احتياطية', 'bk.import': 'تحميل ملف نسخة احتياطية', 'bk.exported': 'النسخة جاهزة', 'bk.declined': 'أُلغي التنزيل', 'bk.imported': 'تم استيراد {n} سجل', 'bk.bad': 'هذا الملف ليس نسخة احتياطية من هذه اللوحة.',
    'bk.note': 'الصور تُخزَّن مع هذه الصفحة. النسخة الاحتياطية تحفظ مراجعها وليس ملفات الصور نفسها.'
  }
};
const ta = (k, v) => { let s = (AD[App.lang] && AD[App.lang][k]) || AD.en[k] || k; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; };
const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const SECTIONS = ['overview', 'company', 'teams', 'agents', 'units', 'backup'];
const AS = { open: false, sec: 'overview', form: null, dirty: false, tg: 'hero', filters: { team: '', region: '', agent: '', q: '' } };
let admEl = null, admBody = null, admToastT = 0;

/* tiny DOM helper: h('div', {class:'x', onclick:fn}, child, 'text') */
function h(tag, props, ...kids) {
  const e = doc.createElement(tag);
  kids.flat(Infinity).forEach((c) => { if (c == null || c === false) return; e.append(c.nodeType ? c : doc.createTextNode(String(c))); });
  if (props) for (const k in props) {
    const v = props[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'multiple') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  return e;
}
const rawOf = (col, id) => Store.raw[col].find((r) => r.id === id);
const nameOf = (v) => L(v) || '—';
const agentsOfTeam = (id) => Store.raw.agents.filter((a) => a.team === id);
const unitsOfAgentId = (id) => Store.raw.properties.filter((p) => p.agent === id);
const regionOptions = () => REGIONS.map((r) => [r.id, r[App.lang]]);

function toast(msg, bad) {
  if (!admEl) return; const el = $('.adm__toast', admEl); el.textContent = msg; el.dataset.bad = bad ? '1' : ''; el.classList.add('is-on');
  clearTimeout(admToastT); admToastT = setTimeout(() => el.classList.remove('is-on'), 3200);
}
function ask(message, okLabel) {
  return new Promise((res) => {
    const done = (v) => { box.remove(); res(v); };
    const ok = h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: () => done(true), text: okLabel || ta('f.confirm') });
    const no = h('button', { type: 'button', class: 'btn btn--small', onclick: () => done(false), text: ta('f.keep') });
    const box = h('div', { class: 'adm__modal', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': message, onkeydown: (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } } }, h('div', { class: 'adm__modalbox' }, h('p', { text: message }), h('div', { class: 'adm__row' }, no, ok)));
    admEl.append(box); no.focus();
  });
}

/* ---------- form kit ---------- */
function fieldWrap(label, control, hint, err) { return h('div', { class: 'af' }, h('label', { class: 'af__l' }, label), control, hint ? h('small', { class: 'af__h', text: hint }) : null, err); }
function input(name, value, o = {}) { return h('input', { class: 'ai', name, type: o.type || 'text', value: value == null ? '' : value, dir: o.dir, placeholder: o.ph, inputmode: o.im, autocomplete: 'off', min: o.min, step: o.step, disabled: o.disabled }); }
function select(name, options, value, o = {}) {
  const s = h('select', { class: 'ai', name }, o.blank ? h('option', { value: '', text: o.blank }) : null, options.map(([v, l]) => h('option', { value: v, text: l })));
  s.value = value == null ? '' : value; return s;
}
/* a group of tick boxes (several values at once); read back with input[name][value].checked */
function regionChecks(name, values) {
  return h('div', { class: 'af__checks', role: 'group', 'aria-label': ta('tm.regions') }, REGIONS.map((r) =>
    h('label', { class: 'af__check af__check--box' }, h('input', { type: 'checkbox', name, value: r.id, checked: values.includes(r.id) }), h('span', { text: r[App.lang] }))));
}
function bil(name, label, value, area, errKey, ph) {
  const v = value && typeof value === 'object' ? value : { en: value || '', ar: '' }, mk = (lang) => h(area ? 'textarea' : 'input', { class: 'ai' + (area ? ' ai--area' : ''), name: name + '_' + lang, value: v[lang] || '', placeholder: ph ? ph[lang] : null, dir: lang === 'ar' ? 'rtl' : 'ltr', lang, rows: area ? 4 : null, autocomplete: 'off', 'aria-label': label + ' — ' + ta('f.' + lang) });
  const grid = h('div', { class: 'af__pair' }, h('div', null, h('span', { class: 'af__tag', text: ta('f.en') }), mk('en')), h('div', null, h('span', { class: 'af__tag', text: ta('f.ar') }), mk('ar')));
  return fieldWrap(label, grid, null, h('p', { class: 'af__e', 'data-err': errKey || name }));
}
const readBil = (f, name) => ({ en: (f.elements[name + '_en'].value || '').trim(), ar: (f.elements[name + '_ar'].value || '').trim() });
const hasAny = (b) => !!(b.en || b.ar);
const setErr = (f, key, msg) => { const e = f.querySelector('[data-err="' + key + '"]'); if (e) e.textContent = msg || ''; return !!msg; };

/* ---------- image helpers ---------- */
/* Resize before upload. A picture with a see-through background (a cut-out portrait) keeps it: it is saved as WebP (PNG where the browser cannot write WebP)
   instead of being flattened onto white as a JPEG, so it sits on the site's dark frame. Opaque pictures stay JPEG. */
async function shrink(file, max) {
  const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = doc.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, c.width, c.height);
  if (bmp.close) bmp.close();
  let seeThrough = false;
  if (file.type !== 'image/jpeg') { const px = x.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { seeThrough = true; break; } }
  const enc = (type, q) => new Promise((res, rej) => c.toBlob((b) => b ? res(b) : rej(new Error('encode')), type, q));
  if (seeThrough) return enc('image/webp', 0.9);   // falls back to PNG by itself where WebP cannot be written
  x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  return enc('image/jpeg', 0.86);
}
async function uploadImage(file, max) { const blob = (file.type === 'image/svg+xml' && !SERVER) ? file : await shrink(file, max); const r = await Store.assets.upload(blob); return { id: r.id }; }
const isHttps = (u) => /^https:\/\/\S+$/i.test(u);

/* one picture: upload or link */
function photoField(state, label) {
  const wrap = h('div', { class: 'ph' }), msg = h('small', { class: 'af__h' });
  const draw = () => {
    wrap.textContent = '';
    const u = refUrl(state.v);
    const prev = h('div', { class: 'ph__prev' }, u ? h('img', { src: u, alt: '' }) : h('span', { text: '＋' }));
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return; msg.textContent = ta('ph.busy');
      try { state.v = await uploadImage(f, 900); msg.textContent = ''; draw(); } catch (err) { console.warn(err); msg.textContent = ta('ph.fail'); }
    } });
    const up = Store.assets ? h('button', { type: 'button', class: 'btn btn--small', onclick: () => file.click(), text: ta(u ? 'ph.replace' : 'ph.upload') }) : null;
    const rm = u ? h('button', { type: 'button', class: 'adm__link', onclick: () => { state.v = null; draw(); }, text: ta('ph.remove') }) : null;
    const link = h('input', { class: 'ai', type: 'url', dir: 'ltr', placeholder: ta('ph.url'), value: state.v && state.v.url ? state.v.url : '', 'aria-label': ta('ph.url'), onchange: (e) => { const val = e.target.value.trim(); if (!val) { if (state.v && state.v.url) state.v = null; draw(); } else if (isHttps(val)) { state.v = { url: val }; msg.textContent = ''; draw(); } else msg.textContent = ta('f.badUrl'); } });
    wrap.append(prev, h('div', { class: 'ph__side' }, h('div', { class: 'adm__row' }, up, rm, file), link, Store.assets ? null : h('small', { class: 'af__h', text: ta('ph.noUpload') }), msg));
  };
  draw(); return fieldWrap(label, wrap);
}
/* a gallery: first image is the cover */
function galleryField(state, label) {
  const wrap = h('div', { class: 'gal' }), msg = h('small', { class: 'af__h' }), grid = h('div', { class: 'gal__grid' });
  const draw = () => {
    grid.textContent = '';
    state.v.forEach((r, i) => grid.append(h('figure', { class: 'gal__item' }, h('img', { src: refUrl(r), alt: '' }),
      i === 0 ? h('span', { class: 'gal__cover', text: ta('un.cover') }) : null,
      h('div', { class: 'gal__bar' },
        h('button', { type: 'button', 'aria-label': ta('un.moveUp'), disabled: i === 0, onclick: () => { state.v.splice(i - 1, 0, state.v.splice(i, 1)[0]); draw(); }, text: '‹' }),
        h('button', { type: 'button', 'aria-label': ta('un.moveDown'), disabled: i === state.v.length - 1, onclick: () => { state.v.splice(i + 1, 0, state.v.splice(i, 1)[0]); draw(); }, text: '›' }),
        h('button', { type: 'button', 'aria-label': ta('ph.remove'), onclick: () => { state.v.splice(i, 1); draw(); }, text: '✕' })))));
  };
  const file = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async (e) => {
    const files = [...e.target.files]; if (!files.length) return; msg.textContent = ta('ph.busy');
    try { for (const f of files) state.v.push(await uploadImage(f, 1800)); msg.textContent = ''; draw(); } catch (err) { console.warn(err); msg.textContent = ta('ph.fail'); draw(); }
    e.target.value = '';
  } });
  const link = h('input', { class: 'ai', type: 'url', dir: 'ltr', placeholder: ta('ph.url'), 'aria-label': ta('ph.url'), onchange: (e) => { const val = e.target.value.trim(); if (!val) return; if (isHttps(val)) { state.v.push({ url: val }); e.target.value = ''; msg.textContent = ''; draw(); } else msg.textContent = ta('f.badUrl'); } });
  wrap.append(...[grid, h('div', { class: 'adm__row' }, Store.assets ? h('button', { type: 'button', class: 'btn btn--small', onclick: () => file.click(), text: ta('un.addImages') }) : null, file), link, Store.assets ? null : h('small', { class: 'af__h', text: ta('ph.noUpload') }), msg].filter(Boolean));
  draw(); return fieldWrap(label, wrap);
}

/* wraps fields in a <form> with Save / Cancel; build(f) returns {data} or null after setting errors */
function formShell(title, fields, onSave, onCancel, onDelete) {
  const status = h('p', { class: 'adm__status', role: 'status' });
  const save = h('button', { type: 'submit', class: 'btn btn--small btn--primary', text: ta('f.save') });
  const f = h('form', { class: 'adm__form', novalidate: true });
  f.append(...fields, h('div', { class: 'adm__row adm__row--end' }, onDelete ? h('button', { type: 'button', class: 'adm__link adm__link--bad', onclick: onDelete, text: ta('f.delete') }) : null, h('span', { class: 'adm__grow' }), h('button', { type: 'button', class: 'btn btn--small', onclick: onCancel, text: ta('f.cancel') }), save), status);
  f.addEventListener('input', (e) => { AS.dirty = true; const w = e.target.closest && e.target.closest('.af'); if (w) w.querySelectorAll('.af__e').forEach((x) => { x.textContent = ''; }); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); status.textContent = '';
    const data = onSave.collect(f); if (!data) return;
    save.disabled = true; save.textContent = ta('f.saving');
    try { const done = await onSave.write(data); AS.dirty = false; toast(typeof done === 'string' ? done : ta('f.saved')); } catch (err) { console.warn(err); status.textContent = (err && err.userMessage) || ta('f.failed'); save.disabled = false; save.textContent = ta('f.save'); }
  });
  return f;
}
const orderField = (v) => fieldWrap(ta('f.order'), input('order', v == null ? '' : v, { type: 'number', step: '1', im: 'numeric' }), ta('f.orderHint'));

/* ---------- sections ---------- */
function sectionHead(title, lead, action) { return h('header', { class: 'adm__head' }, h('div', null, h('h2', { text: title }), lead ? h('p', { class: 'note', text: lead }) : null), action || null); }
const addBtn = (label, fn) => h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: fn, text: label });
const goSec = (s) => { AS.sec = s; AS.form = null; drawAdmin(); };

function viewOverview() {
  const R = Store.raw, c = R.company || {};
  const stat = (n, label, sec) => h('button', { type: 'button', class: 'adm__stat', onclick: () => goSec(sec) }, h('strong', { text: fmtNum(n) }), h('span', { text: label }));
  const todo = [];
  if (!R.teams.length) todo.push([ta('ov.noTeams'), 'teams']);
  if (!R.agents.length) todo.push([ta('ov.noAgents'), 'agents']);
  if (!R.properties.length) todo.push([ta('ov.noUnits'), 'units']);
  const noWa = R.agents.filter((a) => !waNumber(a.whatsapp)).length, noPh = R.agents.filter((a) => !refUrl(a.photo)).length, noAg = R.properties.filter((p) => !p.agent || !rawOf('agents', p.agent)).length;
  if (noWa) todo.push([ta('ov.noWa', { n: fmtNum(noWa) }), 'agents']); if (noPh) todo.push([ta('ov.noPhoto', { n: fmtNum(noPh) }), 'agents']);
  if (noAg && R.properties.length) todo.push([ta('ov.noAgent', { n: fmtNum(noAg) }), 'units']);
  if (!c.whatsapp && !c.phone && !c.email) todo.push([ta('ov.noCompany'), 'company']);
  const seed = !R.teams.length ? h('div', { class: 'adm__card' }, h('p', { text: ta('ov.seedHint') }), h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: async (e) => {
    e.target.disabled = true;
    try { for (let i = 0; i < REGIONS.length; i++) { const r = REGIONS[i]; await dbSet('teams', 't-' + r.id, { regions: [r.id], region: r.id, name: { en: r.en + ' team', ar: 'فريق ' + r.ar }, order: (i + 1) * 10 }); } toast(ta('f.saved')); } catch (err) { console.warn(err); toast(ta('f.failed'), true); e.target.disabled = false; }
  }, text: ta('ov.seed') })) : null;
  return h('div', null, sectionHead(ta('nav.overview'), ta('ov.lead')),
    h('div', { class: 'adm__stats' }, stat(R.teams.length, ta('ov.teams'), 'teams'), stat(R.agents.length, ta('ov.agents'), 'agents'), stat(R.properties.length, ta('ov.units'), 'units')),
    seed,
    h('div', { class: 'adm__quick' }, [['texts', 'ov.q.texts'], ['skyline', 'ov.q.skyline'], ['about', 'ov.q.about'], ['company', 'ov.q.company']].map(([sec, k]) => h('button', { type: 'button', class: 'btn btn--small', onclick: () => goSec(sec), text: ta(k) }))),
    h('h3', { class: 'adm__h3', text: ta('ov.todo') }),
    todo.length ? h('ul', { class: 'adm__todo' }, todo.map(([m, s]) => h('li', null, h('span', { text: m }), h('button', { type: 'button', class: 'adm__link', onclick: () => goSec(s), text: ta('ov.view') })))) : h('p', { class: 'note', text: ta('ov.done') }));
}

function viewCompany() {
  const c = Store.raw.company || {}, so = c.social || {};
  const err = (k) => h('p', { class: 'af__e', 'data-err': k });
  const socialFields = SOCIALS.map(([k, name]) => fieldWrap(name, input('soc_' + k, so[k], { type: 'url', dir: 'ltr', ph: 'https://' }), null, err('soc_' + k)));
  const f = formShell(ta('co.title'), [
    h('h3', { class: 'adm__h3', text: ta('co.contact') }),
    fieldWrap(ta('co.whatsapp'), input('whatsapp', c.whatsapp, { type: 'tel', dir: 'ltr', im: 'tel' }), ta('ag.waHint'), err('whatsapp')),
    h('div', { class: 'af__pair' },
      fieldWrap(ta('co.phone'), input('phone', c.phone, { type: 'tel', dir: 'ltr', im: 'tel' }), null, err('phone')),
      fieldWrap(ta('co.email'), input('email', c.email, { type: 'email', dir: 'ltr' }), null, err('email'))),
    bil('address', ta('co.address'), c.address, true),
    bil('hours', ta('co.hours'), c.hours, true),
    h('h3', { class: 'adm__h3', text: ta('co.social') }),
    h('p', { class: 'note', text: ta('co.socialHint') }),
    h('div', { class: 'af__pair' }, socialFields),
    ...(SERVER ? [] : [h('h3', { class: 'adm__h3', text: ta('co.form') }),
    fieldWrap(ta('co.endpoint'), input('formEndpoint', c.formEndpoint, { type: 'url', dir: 'ltr', ph: 'https://' }), ta('co.endpointHint'), err('formEndpoint'))])
  ], {
    collect: (f) => {
      const v = (n) => (f.elements[n].value || '').trim(); let bad = false;
      if (v('whatsapp') && !(waNumber(v('whatsapp')).length >= 8 && waNumber(v('whatsapp')).length <= 15)) bad = setErr(f, 'whatsapp', ta('f.badWa')) || bad; else setErr(f, 'whatsapp');
      if (v('phone') && !(v('phone').replace(/\D/g, '').length >= 7)) bad = setErr(f, 'phone', ta('f.badPhone')) || bad; else setErr(f, 'phone');
      if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) bad = setErr(f, 'email', ta('f.badEmail')) || bad; else setErr(f, 'email');
      const social = {};
      SOCIALS.forEach(([k]) => { const u = v('soc_' + k); if (u && !isHttps(u)) bad = setErr(f, 'soc_' + k, ta('f.badUrl')) || bad; else { setErr(f, 'soc_' + k); if (u) social[k] = u; } });
      const fe = SERVER ? '' : v('formEndpoint');
      if (fe && !isHttps(fe)) bad = setErr(f, 'formEndpoint', ta('f.badUrl')) || bad; else if (!SERVER) setErr(f, 'formEndpoint');
      return bad ? null : Object.assign({ whatsapp: v('whatsapp'), phone: v('phone'), email: v('email'), address: readBil(f, 'address'), hours: readBil(f, 'hours'), social }, SERVER ? {} : { formEndpoint: fe });
    },
    write: (d) => dbSet('site', 'company', d).then(() => { const b = $('button[type=submit]', f); b.disabled = false; b.textContent = ta('f.save'); })
  }, () => goSec('overview'));
  return h('div', null, sectionHead(ta('co.title'), ta('co.lead')), f);
}

/* ----- teams ----- */
function viewTeams() {
  if (AS.form && AS.form.kind === 'team') return teamForm(AS.form.id);
  const R = Store.raw, order = (a, b) => orderOf(a) - orderOf(b);
  const rows = R.teams.slice().sort(order).map((tm) => {
    const ag = agentsOfTeam(tm.id), units = ag.reduce((n, a) => n + unitsOfAgentId(a.id).length, 0);
    return h('li', { class: 'adm__li' }, h('div', { class: 'adm__li-main' }, h('strong', { text: nameOf(tm.name) }), h('span', { class: 'note', text: [regionsLabel(teamRegions(tm)), plural('team.agents', ag.length), plural('team.units', units)].filter(Boolean).join(' | ') })),
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => { AS.form = { kind: 'team', id: tm.id }; drawAdmin(); }, text: ta('f.edit') }));
  });
  return h('div', null, sectionHead(ta('tm.title'), ta('tm.lead'), addBtn(ta('tm.add'), () => { AS.form = { kind: 'team', id: null }; drawAdmin(); })), layoutSwitch('teams', ta('lay.teams')), rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: ta('tm.empty') }));
}
function teamForm(id) {
  const r = id ? rawOf('teams', id) : null;
  const del = r ? async () => {
    if (agentsOfTeam(id).length) { toast(ta('tm.hasAgents'), true); return; }
    if (!(await ask(ta('tm.del', { name: nameOf(r.name) })))) return;
    try { await dbDel('teams', id); toast(ta('f.saved')); AS.form = null; drawAdmin(); } catch (e) { console.warn(e); toast(ta('f.failed'), true); }
  } : null;
  const f = formShell('', [
    fieldWrap(ta('tm.regions'), regionChecks('regions', r ? teamRegions(r) : []), ta('tm.regionsHint'), h('p', { class: 'af__e', 'data-err': 'regions' })),
    bil('name', ta('tm.name'), r && r.name, false), orderField(r && r.order)
  ], {
    collect: (f) => {
      const regions = REGIONS.filter((x) => f.querySelector('input[name="regions"][value="' + x.id + '"]').checked).map((x) => x.id), name = readBil(f, 'name'); let bad = false;
      bad = setErr(f, 'regions', regions.length ? '' : ta('tm.reqRegion')) || bad; bad = setErr(f, 'name', hasAny(name) ? '' : ta('f.reqAny')) || bad;
      return bad ? null : { regions, region: regions[0], name, order: numOrNull(f.elements.order.value) };
    },
    write: async (d) => { await dbSet('teams', id || newId('t'), d); AS.form = null; drawAdmin(); }
  }, () => { AS.form = null; drawAdmin(); }, del);
  return h('div', null, backHead(r ? ta('tm.edit') : ta('tm.new')), f);
}
const backHead = (title) => h('header', { class: 'adm__head' }, h('div', null, h('button', { type: 'button', class: 'adm__link', onclick: () => { AS.form = null; drawAdmin(); }, text: '‹ ' + ta('back') }), h('h2', { text: title })));

/* ----- agents ----- */
function viewAgents() {
  if (AS.form && AS.form.kind === 'agent') return agentForm(AS.form.id);
  const R = Store.raw, tf = AS.filters.team;
  const teamOpts = h('select', { class: 'ai ai--inline', 'aria-label': ta('ag.team'), onchange: (e) => { AS.filters.team = e.target.value; drawAdmin(); } }, h('option', { value: '', text: ta('ag.allTeams') }), R.teams.map((tm) => h('option', { value: tm.id, text: nameOf(tm.name) })));
  teamOpts.value = tf;
  const list = R.agents.filter((a) => !tf || a.team === tf).sort((a, b) => orderOf(a) - orderOf(b));
  const cards = list.map((a) => {
    const tm = rawOf('teams', a.team), n = unitsOfAgentId(a.id).length, u = refUrl(a.photo);
    return h('article', { class: 'adm__agent' }, h('div', { class: 'adm__thumb' }, u ? h('img', { src: u, alt: '' }) : silhouette()),
      h('div', { class: 'adm__agent-main' }, h('strong', { text: nameOf(a.name) }), h('span', { class: 'note', text: L(a.role) }), h('span', { class: 'note', text: [tm ? nameOf(tm.name) : '', ta('ag.units', { n: fmtNum(n) })].filter(Boolean).join(' | ') }),
        h('span', { class: 'adm__badge', 'data-ok': waNumber(a.whatsapp) ? '1' : '', text: waNumber(a.whatsapp) ? 'WhatsApp ✓' : ta('ag.noWa') })),
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => { AS.form = { kind: 'agent', id: a.id }; drawAdmin(); }, text: ta('f.edit') }));
  });
  return h('div', null, sectionHead(ta('ag.title'), ta('ag.lead'), R.teams.length ? addBtn(ta('ag.add'), () => { AS.form = { kind: 'agent', id: null }; drawAdmin(); }) : null),
    !R.teams.length ? h('p', { class: 'adm__empty', text: ta('ag.needTeam') }) : [h('div', { class: 'adm__filters' }, teamOpts), cards.length ? h('div', { class: 'adm__cards' }, cards) : h('p', { class: 'adm__empty', text: ta('ag.empty') })]);
}
function agentForm(id) {
  const r = id ? rawOf('agents', id) : null, ph = { v: r ? r.photo || null : null };
  const del = r ? async () => {
    if (!(await ask(ta('ag.del', { name: nameOf(r.name) })))) return;
    try { for (const p of unitsOfAgentId(id)) await dbSet('properties', p.id, Object.assign({}, stripId(p), { agent: '' })); await dbDel('agents', id); toast(ta('f.saved')); AS.form = null; drawAdmin(); } catch (e) { console.warn(e); toast(ta('f.failed'), true); }
  } : null;
  const f = formShell('', [
    fieldWrap(ta('ag.team'), select('team', Store.raw.teams.map((tm) => [tm.id, nameOf(tm.name) + ' — ' + regionsLabel(teamRegions(tm))]), r ? r.team : (AS.filters.team || ''), { blank: ta('f.choose') }), null, h('p', { class: 'af__e', 'data-err': 'team' })),
    bil('name', ta('ag.name'), r && r.name, false), bil('role', ta('ag.role'), r && r.role, false), photoField(ph, ta('ag.photo')),
    fieldWrap(ta('ag.wa'), input('whatsapp', r && r.whatsapp, { type: 'tel', dir: 'ltr', im: 'tel' }), ta('ag.waHint'), h('p', { class: 'af__e', 'data-err': 'whatsapp' })),
    fieldWrap(ta('ag.phone'), input('phone', r && r.phone, { type: 'tel', dir: 'ltr', im: 'tel' }), null, h('p', { class: 'af__e', 'data-err': 'phone' })),
    fieldWrap(ta('ag.email'), input('email', r && r.email, { type: 'email', dir: 'ltr' }), null, h('p', { class: 'af__e', 'data-err': 'email' })),
    orderField(r && r.order)
  ], {
    collect: (f) => {
      const v = (n) => (f.elements[n].value || '').trim(), name = readBil(f, 'name'); let bad = false;
      bad = setErr(f, 'team', v('team') ? '' : ta('f.req')) || bad; bad = setErr(f, 'name', hasAny(name) ? '' : ta('f.reqAny')) || bad;
      const wa = waNumber(v('whatsapp')); bad = setErr(f, 'whatsapp', v('whatsapp') && !(wa.length >= 8 && wa.length <= 15) ? ta('f.badWa') : '') || bad;
      bad = setErr(f, 'phone', v('phone') && v('phone').replace(/\D/g, '').length < 7 ? ta('f.badPhone') : '') || bad;
      bad = setErr(f, 'email', v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) ? ta('f.badEmail') : '') || bad;
      return bad ? null : { team: v('team'), name, role: readBil(f, 'role'), photo: ph.v || null, whatsapp: v('whatsapp'), phone: v('phone'), email: v('email'), order: numOrNull(f.elements.order.value) };
    },
    write: async (d) => { await dbSet('agents', id || newId('a'), d); AS.form = null; drawAdmin(); }
  }, () => { AS.form = null; drawAdmin(); }, del);
  return h('div', null, backHead(r ? ta('ag.edit') : ta('ag.new')), f);
}
const stripId = (r) => { const o = Object.assign({}, r); delete o.id; return o; };

/* ----- units ----- */
function viewUnits() {
  if (AS.form && AS.form.kind === 'unit') return unitForm(AS.form.id);
  const R = Store.raw, F = AS.filters;
  const sel = (key, blank, opts) => { const s = h('select', { class: 'ai ai--inline', 'aria-label': blank, onchange: (e) => { F[key] = e.target.value; drawAdmin(); } }, h('option', { value: '', text: blank }), opts.map(([v, l]) => h('option', { value: v, text: l }))); s.value = F[key]; return s; };
  const q = h('input', { class: 'ai ai--inline', type: 'search', placeholder: ta('un.search'), 'aria-label': ta('un.search'), value: F.q, oninput: (e) => { F.q = e.target.value; clearTimeout(q._t); q._t = setTimeout(() => { drawAdmin(); const n = $('input[type=search]', admBody); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); } });
  const needle = F.q.trim().toLowerCase();
  const list = R.properties.filter((p) => (!F.region || p.region === F.region) && (!F.agent || (F.agent === '-' ? !p.agent : p.agent === F.agent)) && (!needle || [p.title, p.project, p.location].map((v) => (v && typeof v === 'object') ? (v.en || '') + ' ' + (v.ar || '') : (v || '')).join(' ').toLowerCase().includes(needle))).sort((a, b) => orderOf(a) - orderOf(b));
  const rows = list.map((p) => {
    const ag = p.agent ? rawOf('agents', p.agent) : null, cover = refUrl((p.images || [])[0]);
    return h('li', { class: 'adm__li' }, h('div', { class: 'adm__thumb adm__thumb--sq' }, cover ? h('img', { src: cover, alt: '' }) : null),
      h('div', { class: 'adm__li-main' }, h('strong', { text: nameOf(p.title) }), h('span', { class: 'note', text: [unitProjectName(p), regionName(unitRegion(p)), typeLabel(p.type), purposeLabel(p.purpose)].filter(Boolean).join(' | ') }), h('span', { class: 'note', text: ag ? nameOf(ag.name) : ta('un.unassigned') })),
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => { AS.form = { kind: 'unit', id: p.id }; drawAdmin(); }, text: ta('f.edit') }));
  });
  return h('div', null, sectionHead(ta('un.title'), ta('un.lead'), addBtn(ta('un.add'), () => { AS.form = { kind: 'unit', id: null }; drawAdmin(); })),
    h('div', { class: 'adm__filters' }, sel('region', ta('un.allRegions'), regionOptions()), sel('agent', ta('un.allAgents'), [['-', ta('un.unassigned')]].concat(R.agents.map((a) => [a.id, nameOf(a.name)]))), q),
    rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: R.properties.length ? '' : ta('un.empty') }));
}
function unitForm(id) {
  const r = id ? rawOf('properties', id) : null, gal = { v: r && Array.isArray(r.images) ? r.images.slice() : [] };
  const del = r ? async () => {
    if (!(await ask(ta('un.del', { name: nameOf(r.title) })))) return;
    try { await dbDel('properties', id); toast(ta('f.saved')); AS.form = null; drawAdmin(); } catch (e) { console.warn(e); toast(ta('f.failed'), true); }
  } : null;
  const agentOpts = Store.raw.agents.map((a) => { const tm = rawOf('teams', a.team); return [a.id, nameOf(a.name) + (tm ? ' — ' + regionsLabel(teamRegions(tm)) : '')]; });
  const num = (name, label, v, step) => fieldWrap(label, input(name, v == null ? '' : v, { type: 'number', min: '0', step: step || '1', im: 'decimal' }));
  const f = formShell('', [
    bil('title', ta('un.name'), r && r.title, false), ...(SERVER ? [catalogProjectField(r)] : []), bil('project', ta('un.project'), r && r.project, false),
    h('div', { class: 'af__row' },
      fieldWrap(ta('un.region'), select('region', regionOptions(), r ? r.region : (AS.filters.region || ''), { blank: ta('f.choose') }), null, h('p', { class: 'af__e', 'data-err': 'region' })),
      fieldWrap(ta('un.type'), select('type', TYPES.map(([k, l]) => [k, l[App.lang]]), r ? r.type : '', { blank: ta('f.choose') }), null, h('p', { class: 'af__e', 'data-err': 'type' })),
      fieldWrap(ta('un.purpose'), select('purpose', PURPOSES.map(([k, l]) => [k, l[App.lang]]), r ? r.purpose : '', { blank: ta('f.choose') }), null, h('p', { class: 'af__e', 'data-err': 'purpose' }))),
    bil('location', ta('un.location'), r && r.location, false),
    fieldWrap(ta('un.agent'), select('agent', agentOpts, r ? r.agent : (AS.filters.agent && AS.filters.agent !== '-' ? AS.filters.agent : ''), { blank: ta('f.none') })),
    h('div', { class: 'af__row' }, num('price', ta('un.price'), r && r.price, 'any'), fieldWrap(ta('un.currency'), select('currency', CURRENCIES.map((c) => [c, c]), r && r.currency ? r.currency : 'EGP')), num('beds', ta('un.beds'), r && r.beds), num('baths', ta('un.baths'), r && r.baths), num('area', ta('un.area'), r && r.area, 'any')),
    h('small', { class: 'af__h', text: ta('un.priceHint') }),
    bil('description', ta('un.desc'), r && r.description, true), galleryField(gal, ta('un.images')),
    ...(SERVER ? [h('h3', { class: 'adm__h3', text: ta('un.seo') }), h('p', { class: 'note', text: ta('un.seoHint') }), withCount(bil('seoTitle', ta('un.seoTitle'), r && r.seoTitle, false), 60), withCount(bil('seoDescription', ta('un.seoDesc'), r && r.seoDescription, true), 160)] : []),
    orderField(r && r.order)
  ], {
    collect: (f) => {
      const v = (n) => f.elements[n].value, title = readBil(f, 'title'); let bad = false;
      bad = setErr(f, 'title', hasAny(title) ? '' : ta('f.reqAny')) || bad;
      const pj = f.elements.projectId && v('projectId') ? catalogProject(v('projectId')) : null, derived = pj ? catalogRegion(pj) : '';
      ['region', 'type', 'purpose'].forEach((k) => { if (k === 'region' && derived) { setErr(f, k, ''); return; } bad = setErr(f, k, v(k) ? '' : ta('f.req')) || bad; });
      return bad ? null : { title, project: readBil(f, 'project'), projectId: f.elements.projectId ? v('projectId') : ((r && r.projectId) || ''), region: derived || v('region'), type: v('type'), purpose: v('purpose'), location: readBil(f, 'location'), agent: v('agent') || '', price: numOrNull(v('price')), currency: v('currency') || 'EGP', beds: numOrNull(v('beds')), baths: numOrNull(v('baths')), area: numOrNull(v('area')), description: readBil(f, 'description'), images: gal.v, order: numOrNull(v('order')), ...(SERVER ? { seoTitle: readBil(f, 'seoTitle'), seoDescription: readBil(f, 'seoDescription') } : {}) };
    },
    write: async (d) => { await dbSet('properties', id || newId('p'), d); AS.form = null; drawAdmin(); }
  }, () => { AS.form = null; drawAdmin(); }, del);
  return h('div', null, backHead(r ? ta('un.edit') : ta('un.new')), f);
}

/* ----- backup ----- */
function viewBackup() {
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const j = JSON.parse(await f.text()); if (!j || j.format !== 'iconic-content-v1') throw new Error('format');
      let n = 0; const put = async (col, rows) => { for (const r of rows || []) { if (!r || !r.id) continue; await dbSet(col, r.id, stripId(r)); n++; } };
      for (const k of ['company', 'texts', 'hotspots', 'about', 'layout'].concat(SERVER ? ['regions'] : [])) { if (j[k] && typeof j[k] === 'object') { await dbSet('site', k, j[k]); n++; } }
      await put('teams', j.teams); await put('agents', j.agents); await put('properties', j.properties); toast(ta('bk.imported', { n: fmtNum(n) }));
    } catch (err) { console.warn(err); toast(ta('bk.bad'), true); }
  } });
  return h('div', null, sectionHead(ta('bk.title'), ta('bk.lead')),
    h('div', { class: 'adm__row' },
      Store.downloads ? h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: async () => {
        const R = Store.raw, data = JSON.stringify({ format: 'iconic-content-v1', exportedAt: new Date().toISOString(), company: R.company, texts: R.texts, hotspots: R.hotspots, about: R.about, layout: R.layout, regions: SERVER ? R.regions : undefined, teams: R.teams, agents: R.agents, properties: R.properties }, null, 2);
        try { await Store.downloads.save({ filename: 'iconic-content-backup.json', data }); toast(ta('bk.exported')); } catch (err) { toast(ta(err && err.code === 'declined' ? 'bk.declined' : 'f.failed'), !(err && err.code === 'declined')); }
      }, text: ta('bk.export') }) : null,
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => file.click(), text: ta('bk.import') }), file),
    h('p', { class: 'note', text: ta('bk.note') }));
}

/* ---------- shell ---------- */
const VIEWS = { overview: viewOverview, company: viewCompany, teams: viewTeams, agents: viewAgents, units: viewUnits, backup: viewBackup };
function drawChrome() {
  $('.adm__title', admEl).textContent = ta('title'); $('.adm__lang', admEl).textContent = ta('lang'); $('.adm__x', admEl).textContent = ta('close');
  $$('.adm__nav button', admEl).forEach((b) => { b.textContent = ta('nav.' + b.dataset.sec) + (b.dataset.sec === 'leads' && AS.newLeads ? ' (' + fmtNum(AS.newLeads) + ')' : '') + (b.dataset.sec === 'applications' && AS.newApps ? ' (' + fmtNum(AS.newApps) + ')' : ''); b.setAttribute('aria-current', String(b.dataset.sec === AS.sec)); });
  const warn = $('.adm__warn', admEl); warn.hidden = !(!Store.db || Store.error); warn.textContent = !Store.db ? ta('store.off') : ta('store.err');
}
function drawAdmin() {
  if (!admEl) return;
  AS.dirty = false; drawChrome();
  admBody.textContent = ''; admBody.append(VIEWS[AS.sec]()); admBody.scrollTop = 0;
}
/* snapshots and language changes redraw the open dashboard, unless someone is typing in a form */
function adminRefresh() {
  if (!AS.open || !admEl) return;
  if (AS.form || AS.dirty || (AS.sec === 'catalog' && CT.form)) { drawChrome(); return; }
  const y = admBody.scrollTop; drawAdmin(); admBody.scrollTop = y;
}
function buildAdmin() {
  const nav = h('nav', { class: 'adm__nav', 'aria-label': 'Dashboard' }, SECTIONS.map((s) => h('button', { type: 'button', 'data-sec': s, onclick: () => goSec(s) })));
  admBody = h('div', { class: 'adm__body' });
  admEl = h('div', { class: 'adm', id: 'adminRoot', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Content dashboard', hidden: true, onkeydown: (e) => { if (e.key === 'Escape' && !$('.adm__modal', admEl)) closeAdmin(); } },
    h('aside', { class: 'adm__side' }, h('div', { class: 'adm__brand' }, h('span', { class: 'adm__title' })), nav,
      h('div', { class: 'adm__foot' }, h('button', { type: 'button', class: 'adm__link adm__lang', onclick: () => setLang(App.lang === 'en' ? 'ar' : 'en') }), h('button', { type: 'button', class: 'btn btn--small adm__x', onclick: closeAdmin }))),
    h('div', { class: 'adm__main' }, h('p', { class: 'adm__warn', role: 'alert', hidden: true }), admBody),
    h('div', { class: 'adm__toast', role: 'status', 'aria-live': 'polite' }));
  doc.body.append(admEl);
}
function openAdmin() {
  if (!Store.canEdit) return;
  if (!admEl) buildAdmin();
  if (!SECTIONS.includes(AS.sec)) AS.sec = SECTIONS[0];
  AS.open = true; AS.form = null; admEl.hidden = false; root.style.overflow = 'hidden'; drawAdmin(); if (SERVER) { refreshLeadCount(); refreshAppCount(); loadCatalog(); }
  $('.adm__nav button[aria-current=true]', admEl).focus({ preventScroll: true });
}
function closeAdmin() { if (!admEl) return; AS.open = false; admEl.hidden = true; root.style.overflow = ''; if (location.hash === '#admin') { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* ignore */ } } }
/* No visible link on the public site: signed-in editors reach the dashboard through the /admin address, which lands here on #admin */
function initAdminEntry() {
  if (!Store.canEdit) return;
  window.addEventListener('hashchange', () => { if (location.hash === '#admin') openAdmin(); });
  if (location.hash === '#admin') openAdmin();
}
