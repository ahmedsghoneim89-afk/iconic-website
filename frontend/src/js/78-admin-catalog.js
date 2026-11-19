/* ---------- Catalog: developers, projects, cities and areas from the ICONIC CRM ----------
   Names and links belong to the CRM. An admin can change them here: the change goes to the CRM first and the dashboard shows only what the CRM confirms.
   Descriptions, pictures, search text and order belong to this site and are saved here. */
Object.assign(AD.en, {
  'nav.catalog': 'Catalog',
  'ct.lead': 'Developers, projects, cities and areas come from the ICONIC CRM and reach the site within moments of a change. Descriptions, pictures, search text and order are kept on the site.',
  'ct.loading': 'Loading the catalog…', 'ct.loadErr': 'The catalog could not be loaded. Try again in a moment.',
  'ct.t.projects': 'Projects', 'ct.t.developers': 'Developers', 'ct.t.places': 'Cities and areas', 'ct.t.sync': 'Link status',
  'ct.search': 'Search', 'ct.allDevs': 'All developers', 'ct.allCities': 'All cities', 'ct.anyStatus': 'Any status', 'ct.active': 'Active', 'ct.inactive': 'Inactive',
  'ct.units': '{n} unit(s)', 'ct.projects': '{n} project(s)', 'ct.more': 'Showing the first {n}. Narrow the search to see more.',
  'ct.add.project': 'Add a project', 'ct.add.developer': 'Add a developer', 'ct.add.city': 'Add a city', 'ct.add.area': 'Add an area',
  'ct.new.project': 'New project', 'ct.new.developer': 'New developer', 'ct.new.city': 'New city', 'ct.new.area': 'New area',
  'ct.edit.project': 'Edit project', 'ct.edit.developer': 'Edit developer', 'ct.edit.city': 'Edit city', 'ct.edit.area': 'Edit area',
  'ct.empty.projects': 'No projects yet. They appear here as soon as the CRM link has imported them.', 'ct.empty.developers': 'No developers yet. They appear here as soon as the CRM link has imported them.', 'ct.empty.places': 'No cities yet.', 'ct.noMatch': 'Nothing matches this search.',
  'ct.crm': 'From the CRM', 'ct.crmHint': 'Saved to the CRM first. The dashboard shows the values the CRM confirms.', 'ct.readonly': 'Only admins can change names and links. You can edit the site content below.',
  'ct.site': 'Shown on the site', 'ct.siteHint': 'Kept on this site only. The CRM never sees it.',
  'ct.f.name': 'Name', 'ct.f.developer': 'Developer', 'ct.f.city': 'City', 'ct.f.area': 'Area', 'ct.f.noDev': 'No developer', 'ct.f.noArea': 'No area',
  'ct.f.active': 'Active project', 'ct.f.activeHint': 'An inactive project is hidden from the site. Its units stay on the site.',
  'ct.f.region': 'Region on the site', 'ct.f.regionHint': 'The site region this city belongs to. Projects and units in the city appear under it.', 'ct.f.desc': 'Description', 'ct.f.logo': 'Logo', 'ct.f.images': 'Pictures',
  'ct.noRegion': 'No region yet', 'ct.cityFixed': 'An area stays in its city.',
  'ct.save.crm': 'Save to the CRM', 'ct.save.site': 'Save site content', 'ct.confirmed': 'Saved. The CRM confirmed version {v}.', 'ct.siteSaved': 'Site content saved', 'ct.nochange': 'Nothing was changed.',
  'ct.err.conflict': 'This record was changed in the CRM after you opened it. Your entries are kept. Press Save again to apply your changes on top of the latest values.', 'ct.err.latest': 'Latest in the CRM', 'ct.err.fix': 'Fix the highlighted field and save again.',
  'ct.err.perm': 'Only admins can change CRM names and links.', 'ct.err.down': 'The CRM could not be reached or did not confirm. Nothing was changed. Your entries are kept. Try again in a moment.', 'ct.err.gone': 'This record no longer exists in the CRM.',
  'ct.version': 'CRM version {v}', 'ct.updated': 'last change {when}', 'ct.viewSite': 'Open on the site',
  'ct.s.title': 'Link with the CRM', 'ct.s.off': 'The link is not set up on this server yet. Ask whoever manages the server to add the CRM link settings.',
  'ct.s.records': 'Records held', 'ct.s.event': 'Last change received from the CRM', 'ct.s.check': 'Last full check', 'ct.s.edit': 'Last change made here', 'ct.s.problem': 'Last problem', 'ct.s.none': 'Nothing yet', 'ct.s.noProblem': 'None',
  'ct.s.checkNow': 'Check again now', 'ct.s.checking': 'Checking…', 'ct.s.checked': 'Checked. The site matches the CRM.', 'ct.s.checkFail': 'The check failed: {msg}',
  'ct.s.queue': 'Delivery from the CRM', 'ct.s.waiting': 'Waiting to be delivered', 'ct.s.refused': 'Refused by the site', 'ct.s.lastSent': 'Last delivered', 'ct.s.lastFail': 'Last delivery problem', 'ct.s.unreach': 'The CRM could not be reached: {msg}', 'ct.s.resend': 'Send again', 'ct.s.resent': '{n} change(s) queued to send again',
  'ct.res.created': 'added', 'ct.res.updated': 'updated', 'ct.res.deleted': 'removed', 'ct.res.duplicate': 'already received', 'ct.res.stale': 'older than what the site holds, ignored', 'ct.res.unchanged': 'no change',
  'ct.ent.developer': 'developer', 'ct.ent.project': 'project', 'ct.ent.city': 'city', 'ct.ent.area': 'area',
  'ct.s.recent': 'Recent activity', 'ct.s.sums': '{d} developers, {p} projects, {c} cities, {a} areas', 'ct.s.hidden': '{n} hidden',
  'ct.s.units': 'Units and projects', 'ct.s.unitsHint': 'A unit that only has a project name can be matched to the CRM project with the same name. Only exact, single matches are linked. Nothing else on the unit changes.',
  'ct.s.unitsNow': '{linked} of {total} units are linked to a CRM project.', 'ct.s.preview': 'Preview the matches', 'ct.s.apply': 'Link {n} unit(s)', 'ct.s.applied': '{n} unit(s) linked', 'ct.s.working': 'Working…',
  'ct.r.linked': 'Will be linked', 'ct.r.ambiguous': 'Needs a decision (more than one project has this name)', 'ct.r.missing': 'No project with this name in the CRM', 'ct.r.broken': 'Linked project no longer exists in the CRM', 'ct.r.nothing': 'Nothing to link.', 'ct.r.noText': '{n} unit(s) have no project name.',
  'ct.u.project': 'Project from the CRM', 'ct.u.hint': 'Pick a developer, governorate or area to narrow the projects. The unit follows its project: developer, governorate, area and region all come from it. Leave the project empty for a unit with no project.',
  'ct.u.developer': 'Developer', 'ct.u.city': 'Governorate', 'ct.u.area': 'Area', 'ct.u.all': 'All', 'ct.u.cleared': 'The project was cleared because it is not in the choices you made. Pick another project.', 'ct.u.none': 'Not linked', 'ct.u.loading': 'The project list is still loading. Close this form and open it again in a moment.', 'ct.u.followed': 'The region and location come from the project.'
});
Object.assign(AD.ar, {
  'nav.catalog': 'الكتالوج',
  'ct.lead': 'المطورون والمشاريع والمدن والمناطق تأتي من نظام ICONIC CRM وتصل إلى الموقع خلال لحظات من أي تغيير. الوصف والصور ونصوص البحث والترتيب تُحفظ في الموقع.',
  'ct.loading': 'جارٍ تحميل الكتالوج…', 'ct.loadErr': 'تعذّر تحميل الكتالوج. حاول مرة أخرى بعد لحظات.',
  'ct.t.projects': 'المشاريع', 'ct.t.developers': 'المطورون', 'ct.t.places': 'المدن والمناطق', 'ct.t.sync': 'حالة الربط',
  'ct.search': 'بحث', 'ct.allDevs': 'كل المطورين', 'ct.allCities': 'كل المدن', 'ct.anyStatus': 'أي حالة', 'ct.active': 'نشط', 'ct.inactive': 'غير نشط',
  'ct.units': '{n} وحدة', 'ct.projects': '{n} مشروع', 'ct.more': 'المعروض أول {n}. ضيّق البحث لرؤية المزيد.',
  'ct.add.project': 'إضافة مشروع', 'ct.add.developer': 'إضافة مطور', 'ct.add.city': 'إضافة مدينة', 'ct.add.area': 'إضافة منطقة',
  'ct.new.project': 'مشروع جديد', 'ct.new.developer': 'مطور جديد', 'ct.new.city': 'مدينة جديدة', 'ct.new.area': 'منطقة جديدة',
  'ct.edit.project': 'تعديل المشروع', 'ct.edit.developer': 'تعديل المطور', 'ct.edit.city': 'تعديل المدينة', 'ct.edit.area': 'تعديل المنطقة',
  'ct.empty.projects': 'لا توجد مشاريع بعد. تظهر هنا فور أن يستوردها الربط مع النظام.', 'ct.empty.developers': 'لا يوجد مطورون بعد. يظهرون هنا فور أن يستوردهم الربط مع النظام.', 'ct.empty.places': 'لا توجد مدن بعد.', 'ct.noMatch': 'لا توجد نتائج مطابقة للبحث.',
  'ct.crm': 'من نظام CRM', 'ct.crmHint': 'يُحفظ في النظام أولًا، وتعرض لوحة الإدارة القيم التي يؤكدها النظام فقط.', 'ct.readonly': 'تغيير الأسماء والروابط للمدير فقط. يمكنك تعديل محتوى الموقع أدناه.',
  'ct.site': 'يظهر في الموقع', 'ct.siteHint': 'يُحفظ في هذا الموقع فقط ولا يراه نظام CRM.',
  'ct.f.name': 'الاسم', 'ct.f.developer': 'المطور', 'ct.f.city': 'المدينة', 'ct.f.area': 'المنطقة', 'ct.f.noDev': 'بدون مطور', 'ct.f.noArea': 'بدون منطقة',
  'ct.f.active': 'مشروع نشط', 'ct.f.activeHint': 'المشروع غير النشط يُخفى من الموقع، وتبقى وحداته ظاهرة.',
  'ct.f.region': 'الإقليم في الموقع', 'ct.f.regionHint': 'إقليم الموقع الذي تتبعه هذه المدينة. تظهر مشاريعها ووحداتها تحته.', 'ct.f.desc': 'الوصف', 'ct.f.logo': 'الشعار', 'ct.f.images': 'الصور',
  'ct.noRegion': 'بلا إقليم بعد', 'ct.cityFixed': 'المنطقة تبقى في مدينتها.',
  'ct.save.crm': 'حفظ في النظام', 'ct.save.site': 'حفظ محتوى الموقع', 'ct.confirmed': 'تم الحفظ. أكّد النظام الإصدار {v}.', 'ct.siteSaved': 'تم حفظ محتوى الموقع', 'ct.nochange': 'لم يتغير شيء.',
  'ct.err.conflict': 'تغيّر هذا السجل في النظام بعد فتحك له. بياناتك محفوظة. اضغط حفظ مرة أخرى لتطبيق تعديلاتك فوق أحدث القيم.', 'ct.err.latest': 'الأحدث في النظام', 'ct.err.fix': 'صحّح الحقل المحدد ثم احفظ مرة أخرى.',
  'ct.err.perm': 'تغيير أسماء النظام وروابطه للمدير فقط.', 'ct.err.down': 'تعذّر الوصول إلى النظام أو لم يؤكد التغيير. لم يتغير شيء. بياناتك محفوظة، حاول مرة أخرى بعد لحظات.', 'ct.err.gone': 'هذا السجل لم يعد موجودًا في النظام.',
  'ct.version': 'إصدار النظام {v}', 'ct.updated': 'آخر تغيير {when}', 'ct.viewSite': 'فتح في الموقع',
  'ct.s.title': 'الربط مع النظام', 'ct.s.off': 'الربط غير مُعدّ على هذا الخادم بعد. اطلب من مسؤول الخادم إضافة إعدادات الربط.',
  'ct.s.records': 'السجلات المحفوظة', 'ct.s.event': 'آخر تغيير وصل من النظام', 'ct.s.check': 'آخر فحص كامل', 'ct.s.edit': 'آخر تغيير تم من هنا', 'ct.s.problem': 'آخر مشكلة', 'ct.s.none': 'لا شيء بعد', 'ct.s.noProblem': 'لا توجد',
  'ct.s.checkNow': 'افحص الآن مرة أخرى', 'ct.s.checking': 'جارٍ الفحص…', 'ct.s.checked': 'تم الفحص. الموقع مطابق للنظام.', 'ct.s.checkFail': 'فشل الفحص: {msg}',
  'ct.s.queue': 'التسليم من النظام', 'ct.s.waiting': 'في انتظار التسليم', 'ct.s.refused': 'رفضها الموقع', 'ct.s.lastSent': 'آخر تسليم', 'ct.s.lastFail': 'آخر مشكلة في التسليم', 'ct.s.unreach': 'تعذّر الوصول إلى النظام: {msg}', 'ct.s.resend': 'إرسال مرة أخرى', 'ct.s.resent': 'تمت جدولة {n} تغيير للإرسال مرة أخرى',
  'ct.res.created': 'أُضيف', 'ct.res.updated': 'تحدّث', 'ct.res.deleted': 'حُذف', 'ct.res.duplicate': 'وصل من قبل', 'ct.res.stale': 'أقدم مما في الموقع فتم تجاهله', 'ct.res.unchanged': 'بلا تغيير',
  'ct.ent.developer': 'مطور', 'ct.ent.project': 'مشروع', 'ct.ent.city': 'مدينة', 'ct.ent.area': 'منطقة',
  'ct.s.recent': 'آخر النشاطات', 'ct.s.sums': '{d} مطور، {p} مشروع، {c} مدينة، {a} منطقة', 'ct.s.hidden': '{n} مخفي',
  'ct.s.units': 'الوحدات والمشاريع', 'ct.s.unitsHint': 'الوحدة التي لها اسم مشروع فقط يمكن مطابقتها مع مشروع النظام بنفس الاسم. تُربط المطابقات الدقيقة والمفردة فقط، ولا يتغير أي شيء آخر في الوحدة.',
  'ct.s.unitsNow': '{linked} من {total} وحدة مرتبطة بمشروع في النظام.', 'ct.s.preview': 'معاينة المطابقات', 'ct.s.apply': 'ربط {n} وحدة', 'ct.s.applied': 'تم ربط {n} وحدة', 'ct.s.working': 'جارٍ العمل…',
  'ct.r.linked': 'سيتم ربطها', 'ct.r.ambiguous': 'تحتاج قرارًا (أكثر من مشروع بنفس الاسم)', 'ct.r.missing': 'لا يوجد مشروع بهذا الاسم في النظام', 'ct.r.broken': 'المشروع المرتبط لم يعد موجودًا في النظام', 'ct.r.nothing': 'لا يوجد ما يُربط.', 'ct.r.noText': '{n} وحدة بلا اسم مشروع.',
  'ct.u.project': 'المشروع من النظام', 'ct.u.hint': 'اختر مطورًا أو محافظة أو منطقة لتضييق قائمة المشاريع. الوحدة تتبع مشروعها: المطور والمحافظة والمنطقة والإقليم كلها تأتي منه. اترك المشروع فارغًا لوحدة بلا مشروع.',
  'ct.u.developer': 'المطور', 'ct.u.city': 'المحافظة', 'ct.u.area': 'المنطقة', 'ct.u.all': 'الكل', 'ct.u.cleared': 'تم إلغاء المشروع لأنه لا يطابق اختياراتك. اختر مشروعًا آخر.', 'ct.u.none': 'غير مرتبطة', 'ct.u.loading': 'قائمة المشاريع ما زالت تُحمَّل. أغلق هذا النموذج وافتحه بعد لحظات.', 'ct.u.followed': 'الإقليم والموقع يأتيان من المشروع.'
});
if (SERVER) { [ROLE_SECTIONS.admin, ROLE_SECTIONS.editor].forEach((a) => { const i = a.indexOf('units'); a.splice(i < 0 ? a.length : i, 0, 'catalog'); }); }

const CT = { tab: 'projects', data: null, loading: null, err: '', q: '', dev: '', city: '', status: '', form: null, crm: null, report: null, working: '', timer: 0, limit: 200 };
const CT_KIND = { developer: 'developers', project: 'projects', city: 'cities', area: 'areas' };
const ctBy = (kind, id) => (CT.data && id ? CT.data[CT_KIND[kind]].find((x) => x.id === id) : null) || null;
const catalogProject = (id) => ctBy('project', id), catalogCity = (id) => ctBy('city', id);
const catalogRegion = (pr) => { const c = catalogCity(pr.cityId); return c && c.region ? c.region : ''; };
const unitProjectName = (p) => { const pr = p.projectId && catalogProject(p.projectId); return pr ? pr.name : L(p.project); };
const unitRegion = (p) => { const pr = p.projectId && catalogProject(p.projectId); return (pr && catalogRegion(pr)) || p.region; };
const ctAdmin = () => !SERVER || (typeof myRole === 'function' ? myRole() === 'admin' : true);
const ctRes = (r) => { const k = 'ct.res.' + r; return AD[App.lang][k] ? ta(k) : String(r || ''); };
const ctEnt = (e) => { const k = 'ct.ent.' + e; return AD[App.lang][k] ? ta(k) : String(e || ''); };
const ctWhen = (ts) => { if (!ts) return '—'; try { return new Date(ts).toLocaleString(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'medium' }); } catch (_) { return String(ts); } };
const ctRedraw = () => { if (AS.open && AS.sec === 'catalog' && !AS.dirty && !CT.form) drawAdmin(); };
const ctReq = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function loadCatalog() {
  if (!SERVER || !Store.rest) return Promise.resolve();
  if (CT.loading) return CT.loading;
  CT.loading = Store.rest.call('GET', '/catalog/all').then((d) => { CT.data = d; CT.err = ''; }).catch((e) => { console.warn(e); CT.err = ta('ct.loadErr'); }).finally(() => { CT.loading = null; ctRedraw(); });
  return CT.loading;
}
async function ctLoadCrm() { try { CT.crm = await Store.rest.call('GET', '/catalog/crm-status'); } catch (e) { CT.crm = { reachable: false, error: (e && e.serverMessage) || 'error' }; } }
function ctSyncTick() {
  clearInterval(CT.timer); CT.timer = 0;
  if (!(AS.open && AS.sec === 'catalog' && CT.tab === 'sync')) return;
  CT.timer = setInterval(async () => {
    if (!(AS.open && AS.sec === 'catalog' && CT.tab === 'sync' && !CT.form) || document.hidden) { if (!(AS.open && AS.sec === 'catalog' && CT.tab === 'sync')) { clearInterval(CT.timer); CT.timer = 0; } return; }
    await Promise.all([loadCatalog(), ctLoadCrm()]); ctRedraw();
  }, 10000);
}

/* ---------- small pieces ---------- */
const ctErr = (key) => h('p', { class: 'af__e', 'data-err': key });
const ctTabs = () => h('div', { class: 'adm__tabs', role: 'tablist' }, ['projects', 'developers', 'places', 'sync'].map((k) => h('button', { type: 'button', role: 'tab', class: 'adm__tab', 'aria-selected': CT.tab === k ? 'true' : 'false', text: ta('ct.t.' + k),
  onclick: () => { CT.tab = k; CT.form = null; drawAdmin(); if (k === 'sync') { Promise.all([loadCatalog(), ctLoadCrm()]).then(ctRedraw); ctSyncTick(); } } })));
const ctOpen = (kind, id, extra) => { CT.form = Object.assign({ kind, id }, extra || {}); drawAdmin(); };
const ctSearch = (label, onChange) => {
  const q = h('input', { class: 'ai ai--inline', type: 'search', placeholder: label, 'aria-label': label, value: CT.q, oninput: (e) => { CT.q = e.target.value; clearTimeout(q._t); q._t = setTimeout(() => { onChange(); const n = $('input[type=search]', admBody); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); } });
  return q;
};
const ctSel = (aria, blank, opts, value, onChange) => { const s = h('select', { class: 'ai ai--inline', 'aria-label': aria, onchange: (e) => { onChange(e.target.value); } }, h('option', { value: '', text: blank }), opts.map(([v, l]) => h('option', { value: v, text: l }))); s.value = value; return s; };
const ctNames = (arr) => arr.map((x) => [x.id, x.name]);
const ctText = (...p) => p.filter(Boolean).join(' ').toLowerCase();
const ctDevName = (id) => { const d = ctBy('developer', id); return d ? d.name : ''; };
const ctWhere = (p) => { const a = ctBy('area', p.areaId), c = ctBy('city', p.cityId); return [a && a.name, c && c.name].filter(Boolean).join(', '); };

/* ---------- views ---------- */
function viewCatalog() {
  if (!CT.data) { if (!CT.loading) loadCatalog(); return h('div', null, sectionHead(ta('nav.catalog'), ta('ct.lead')), h('p', { class: 'adm__empty', text: CT.err || ta('ct.loading') })); }
  if (CT.form) return ctForm();
  const body = { projects: ctProjects, developers: ctDevelopers, places: ctPlaces, sync: ctSync }[CT.tab]();
  return h('div', null, sectionHead(ta('nav.catalog'), ta('ct.lead')), ctTabs(), body);
}
VIEWS.catalog = viewCatalog;

function ctProjects() {
  const D = CT.data, needle = CT.q.trim().toLowerCase(), units = {};
  D.units.forEach((u) => { if (u.projectId) units[u.projectId] = (units[u.projectId] || 0) + 1; });
  const all = D.projects.filter((p) => (!CT.dev || p.developerId === CT.dev) && (!CT.city || p.cityId === CT.city) && (!CT.status || (CT.status === 'active') === (p.active !== false)) && (!needle || ctText(p.name, ctDevName(p.developerId), ctWhere(p)).includes(needle)));
  const rows = all.slice(0, CT.limit).map((p) => h('li', { class: 'adm__li' },
    h('div', { class: 'adm__li-main' }, h('strong', { text: p.name }), h('span', { class: 'note', text: [ctDevName(p.developerId), ctWhere(p)].filter(Boolean).join(' | ') }),
      h('span', { class: 'note', text: ta('ct.units', { n: fmtNum(units[p.id] || 0) }) })),
    h('span', { class: 'adm__badge', 'data-ok': p.active !== false ? '1' : '', text: ta(p.active !== false ? 'ct.active' : 'ct.inactive') }),
    h('button', { type: 'button', class: 'btn btn--small', onclick: () => ctOpen('project', p.id), text: ta('f.edit') })));
  return h('div', null,
    ctAdmin() ? h('div', { class: 'adm__row' }, addBtn(ta('ct.add.project'), () => ctOpen('project', null))) : null,
    h('div', { class: 'adm__filters' }, ctSearch(ta('ct.search'), drawAdmin), ctSel(ta('ct.f.developer'), ta('ct.allDevs'), ctNames(D.developers), CT.dev, (v) => { CT.dev = v; drawAdmin(); }),
      ctSel(ta('ct.f.city'), ta('ct.allCities'), ctNames(D.cities), CT.city, (v) => { CT.city = v; drawAdmin(); }),
      ctSel('', ta('ct.anyStatus'), [['active', ta('ct.active')], ['inactive', ta('ct.inactive')]], CT.status, (v) => { CT.status = v; drawAdmin(); })),
    rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: D.projects.length ? ta('ct.noMatch') : ta('ct.empty.projects') }),
    all.length > CT.limit ? h('p', { class: 'note', text: ta('ct.more', { n: fmtNum(CT.limit) }) }) : null);
}
function ctDevelopers() {
  const D = CT.data, needle = CT.q.trim().toLowerCase(), count = {};
  D.projects.forEach((p) => { if (p.developerId) count[p.developerId] = (count[p.developerId] || 0) + 1; });
  const all = D.developers.filter((d) => !needle || d.name.toLowerCase().includes(needle));
  const rows = all.slice(0, CT.limit).map((d) => { const u = refUrl(d.logo);
    return h('li', { class: 'adm__li' }, h('div', { class: 'adm__thumb adm__thumb--sq' }, u ? h('img', { src: u, alt: '' }) : null),
      h('div', { class: 'adm__li-main' }, h('strong', { text: d.name }), h('span', { class: 'note', text: ta('ct.projects', { n: fmtNum(count[d.id] || 0) }) })),
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => ctOpen('developer', d.id), text: ta('f.edit') })); });
  return h('div', null, ctAdmin() ? h('div', { class: 'adm__row' }, addBtn(ta('ct.add.developer'), () => ctOpen('developer', null))) : null,
    h('div', { class: 'adm__filters' }, ctSearch(ta('ct.search'), drawAdmin)),
    rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: D.developers.length ? ta('ct.noMatch') : ta('ct.empty.developers') }),
    all.length > CT.limit ? h('p', { class: 'note', text: ta('ct.more', { n: fmtNum(CT.limit) }) }) : null);
}
function ctPlaces() {
  const D = CT.data, blocks = D.cities.map((c) => {
    const areas = D.areas.filter((a) => a.cityId === c.id);
    return h('section', { class: 'adm__card adm__place' },
      h('div', { class: 'adm__row adm__row--spread' }, h('div', null, h('strong', { text: c.name }), h('span', { class: 'note', text: c.region ? regionName(c.region) : ta('ct.noRegion') })),
        h('div', { class: 'adm__row' }, ctAdmin() ? h('button', { type: 'button', class: 'btn btn--small', onclick: () => ctOpen('area', null, { cityId: c.id }), text: ta('ct.add.area') }) : null,
          h('button', { type: 'button', class: 'btn btn--small', onclick: () => ctOpen('city', c.id), text: ta('f.edit') }))),
      areas.length ? h('ul', { class: 'adm__list adm__list--tight' }, areas.map((a) => h('li', { class: 'adm__li' }, h('div', { class: 'adm__li-main' }, h('span', { text: a.name })), h('button', { type: 'button', class: 'btn btn--small', onclick: () => ctOpen('area', a.id), text: ta('f.edit') })))) : null);
  });
  return h('div', null, ctAdmin() ? h('div', { class: 'adm__row' }, addBtn(ta('ct.add.city'), () => ctOpen('city', null))) : null, blocks.length ? h('div', { class: 'adm__stack' }, blocks) : h('p', { class: 'adm__empty', text: ta('ct.empty.places') }));
}

/* ---------- one record: the CRM's part and the site's part, saved separately ---------- */
function ctSummary(kind, r) {
  if (kind === 'project') return [r.name, ctDevName(r.developerId), ctWhere(r), ta(r.active !== false ? 'ct.active' : 'ct.inactive')].filter(Boolean).join(' | ');
  if (kind === 'area') return [r.name, (ctBy('city', r.cityId) || {}).name].filter(Boolean).join(' | ');
  return r.name;
}
function ctError(e, f, st, kind) {
  const code = e && e.code, p = (e && e.payload) || {}, out = new Error('catalog');
  if (code === 409 && p.record) {
    st.version = p.record.version; const arr = CT.data[CT_KIND[kind]], i = arr.findIndex((x) => x.id === p.record.id); if (i >= 0) arr[i] = Object.assign({}, arr[i], p.record);
    out.userMessage = ta('ct.err.conflict') + ' ' + ta('ct.err.latest') + ': ' + ctSummary(kind, p.record);
  } else if (code === 422) {
    const msg = e.serverMessage || ta('ct.err.fix'); out.userMessage = msg;
    if (p.field && f.querySelector('[data-err="' + p.field + '"]')) { setErr(f, p.field, msg); out.userMessage = ta('ct.err.fix'); }
  } else if (code === 404) out.userMessage = ta('ct.err.gone');
  else if (code === 403) out.userMessage = ta('ct.err.perm');
  else out.userMessage = ta('ct.err.down');
  return out;
}
function crmForm(kind, rec, cityId0) {
  const D = CT.data, admin = ctAdmin(), base = rec ? Object.assign({}, rec) : {}, st = { version: rec ? rec.version : 0 };
  const fields = [h('h3', { class: 'adm__h3', text: ta('ct.crm') }), h('p', { class: 'note', text: admin ? ta('ct.crmHint') : ta('ct.readonly') }),
    fieldWrap(ta('ct.f.name'), input('name', base.name || '', { disabled: !admin }), null, ctErr('name'))];
  let areaSel = null;
  const fillAreas = (cityId, keep) => { if (!areaSel) return; areaSel.textContent = ''; areaSel.append(h('option', { value: '', text: ta('ct.f.noArea') })); D.areas.filter((a) => a.cityId === cityId).forEach((a) => areaSel.append(h('option', { value: a.id, text: a.name }))); areaSel.value = keep || ''; };
  if (kind === 'project') {
    const citySel = select('cityId', ctNames(D.cities), base.cityId || '', { blank: ta('f.choose') });
    areaSel = select('areaId', [], '', {});
    citySel.disabled = !admin; areaSel.disabled = !admin; fillAreas(base.cityId, base.areaId);
    citySel.addEventListener('change', () => fillAreas(citySel.value, ''));
    const dev = select('developerId', ctNames(D.developers), base.developerId || '', { blank: ta('ct.f.noDev') }); dev.disabled = !admin;
    fields.push(fieldWrap(ta('ct.f.developer'), dev, null, ctErr('developerId')), fieldWrap(ta('ct.f.city'), citySel, null, ctErr('cityId')), fieldWrap(ta('ct.f.area'), areaSel, null, ctErr('areaId')),
      h('div', { class: 'af' }, h('label', { class: 'af__check af__check--box' }, h('input', { type: 'checkbox', name: 'active', checked: base.active !== false, disabled: !admin }), h('span', { text: ta('ct.f.active') })), h('small', { class: 'af__h', text: ta('ct.f.activeHint') })));
  }
  if (kind === 'area') {
    if (rec) fields.push(fieldWrap(ta('ct.f.city'), h('p', { class: 'af__static', text: (ctBy('city', rec.cityId) || {}).name || '' }), ta('ct.cityFixed')));
    else fields.push(fieldWrap(ta('ct.f.city'), select('cityId', ctNames(D.cities), cityId0 || '', { blank: ta('f.choose') }), null, ctErr('cityId')));
  }
  const keys = { developer: ['name'], city: ['name'], area: ['name'].concat(rec ? [] : ['cityId']), project: ['name', 'developerId', 'cityId', 'areaId', 'active'] }[kind];
  const form = formShell('', fields, {
    collect: (f) => {
      if (!admin) return null;
      const cur = {}; keys.forEach((k) => { const el = f.elements[k]; cur[k] = k === 'active' ? !!el.checked : (el.value || '').trim(); });
      let bad = setErr(f, 'name', cur.name ? '' : ta('f.req'));
      if (kind === 'project' || (kind === 'area' && !rec)) bad = setErr(f, 'cityId', cur.cityId ? '' : ta('f.req')) || bad;
      if (bad) return null;
      const out = {}; keys.forEach((k) => { if (!rec ? (k === 'active' ? cur[k] === false : cur[k] !== '') : cur[k] !== (k === 'active' ? base.active !== false : (base[k] || ''))) out[k] = cur[k]; });
      if (!rec && kind === 'project') out.active = cur.active;
      if (rec && kind === 'project' && out.cityId !== undefined && out.areaId === undefined) out.areaId = cur.areaId;   // the area list was refilled for the new city
      if (rec && !Object.keys(out).length) { toast(ta('ct.nochange')); return null; }
      return out;
    },
    write: async (fieldsOut) => {
      const body = { requestId: ctReq(), fields: fieldsOut }; if (rec) body.expectedVersion = st.version;
      try { const r = await Store.rest.call(rec ? 'PATCH' : 'POST', '/catalog/' + kind + (rec ? '/' + rec.id : ''), body); await loadCatalog(); CT.form = null; drawAdmin(); return ta('ct.confirmed', { v: fmtNum(r.record.version) }); }
      catch (e) { throw ctError(e, form, st, kind); }
    }
  }, () => { CT.form = null; drawAdmin(); });
  const submit = $('button[type=submit]', form); if (submit) { submit.textContent = ta('ct.save.crm'); if (!admin) submit.hidden = true; }
  return form;
}
function siteForm(kind, rec) {
  const st = { logo: { v: rec.logo || null }, images: { v: Array.isArray(rec.images) ? rec.images.slice() : [] } };
  const fields = [h('h3', { class: 'adm__h3', text: ta('ct.site') }), h('p', { class: 'note', text: ta('ct.siteHint') })];
  if (kind === 'city') fields.push(fieldWrap(ta('ct.f.region'), select('region', regionOptions(), rec.region || '', { blank: ta('f.none') }), ta('ct.f.regionHint')));
  fields.push(bil('description', ta('ct.f.desc'), rec.description, true));
  if (kind === 'developer') fields.push(photoField(st.logo, ta('ct.f.logo')));
  if (kind === 'project' || kind === 'area') fields.push(galleryField(st.images, ta('ct.f.images')));
  fields.push(h('h3', { class: 'adm__h3', text: ta('un.seo') }), h('p', { class: 'note', text: ta('un.seoHint') }), withCount(bil('seoTitle', ta('un.seoTitle'), rec.seoTitle, false), 60), withCount(bil('seoDescription', ta('un.seoDesc'), rec.seoDescription, true), 160), orderField(rec.order));
  const form = formShell('', fields, {
    collect: (f) => Object.assign({ description: readBil(f, 'description'), seoTitle: readBil(f, 'seoTitle'), seoDescription: readBil(f, 'seoDescription'), order: numOrNull(f.elements.order.value) },
      kind === 'city' ? { region: f.elements.region.value } : {}, kind === 'developer' ? { logo: st.logo.v || null } : {}, kind === 'project' || kind === 'area' ? { images: st.images.v } : {}),
    write: async (body) => { try { await Store.rest.call('PATCH', '/catalog/' + kind + '/' + rec.id + '/site', body); await loadCatalog(); CT.form = null; drawAdmin(); return ta('ct.siteSaved'); } catch (e) { const er = new Error('site'); er.userMessage = ctSiteError(e); throw er; } }
  }, () => { CT.form = null; drawAdmin(); });
  const submit = $('button[type=submit]', form); if (submit) submit.textContent = ta('ct.save.site');
  return form;
}
const ctSiteError = (e) => (e && e.code === 404 ? ta('ct.err.gone') : ta('f.failed'));
function ctForm() {
  const { kind, id, cityId } = CT.form, rec = id ? ctBy(kind, id) : null;
  if (id && !rec) { CT.form = null; return viewCatalog(); }
  const bits = rec ? [ta('ct.version', { v: fmtNum(rec.version) }), rec.crmAt ? ta('ct.updated', { when: ctWhen(rec.crmAt) }) : ''].filter(Boolean).join(' | ') : '';
  const pub = rec && kind === 'project' && rec.active !== false && rec.slug ? h('a', { class: 'adm__link', href: '/' + App.lang + '/projects/' + rec.slug, target: '_blank', rel: 'noopener', text: ta('ct.viewSite') }) : null;
  return h('div', null, h('header', { class: 'adm__head' }, h('div', null, h('button', { type: 'button', class: 'adm__link', onclick: () => { CT.form = null; drawAdmin(); }, text: '‹ ' + ta('back') }), h('h2', { text: ta(rec ? 'ct.edit.' + kind : 'ct.new.' + kind) + (rec ? ': ' + rec.name : '') }), bits ? h('p', { class: 'note', text: bits }) : null, pub)),
    crmForm(kind, rec, cityId), rec ? siteForm(kind, rec) : h('p', { class: 'note', text: ta('ct.siteHint') }));
}

/* ---------- link status ---------- */
const ctRow = (k, v) => h('div', { class: 'adm__kv' }, h('dt', { text: k }), h('dd', null, v));
function ctSync() {
  const D = CT.data, S = D.status || {}, C = CT.crm, admin = ctAdmin();
  const ev = S.lastEvent, rc = S.lastReconcile, ed = S.lastEdit, er = S.lastError, c = S.counts || {};
  const sums = ta('ct.s.sums', { d: fmtNum((c.developer || {}).total || 0), p: fmtNum((c.project || {}).total || 0), c: fmtNum((c.city || {}).total || 0), a: fmtNum((c.area || {}).total || 0) });
  const hid = Object.values(c).reduce((n, x) => n + ((x && x.hidden) || 0), 0);
  const checkBtn = admin ? h('button', { type: 'button', class: 'btn btn--small btn--primary', disabled: !S.configured || !!CT.working, text: CT.working === 'check' ? ta('ct.s.checking') : ta('ct.s.checkNow'), onclick: async (e) => {
    CT.working = 'check'; e.target.disabled = true; e.target.textContent = ta('ct.s.checking');
    try { await Store.rest.call('POST', '/catalog/reconcile', {}); toast(ta('ct.s.checked')); } catch (x) { toast(ta('ct.s.checkFail', { msg: (x && x.serverMessage) || '' }), true); }
    CT.working = ''; await Promise.all([loadCatalog(), ctLoadCrm()]); ctRedraw();
  } }) : null;
  const status = h('section', { class: 'adm__card adm__wide' }, h('h3', { class: 'adm__h3', text: ta('ct.s.title') }), S.configured ? null : h('p', { class: 'adm__status', text: ta('ct.s.off') }),
    h('dl', { class: 'adm__kvs' },
      ctRow(ta('ct.s.records'), sums + (hid ? ' (' + ta('ct.s.hidden', { n: fmtNum(hid) }) + ')' : '')),
      ctRow(ta('ct.s.event'), ev ? ctWhen(ev.at) + ' | ' + ctEnt(ev.entity) + ' | ' + ctRes(ev.result) : ta('ct.s.none')),
      ctRow(ta('ct.s.check'), rc ? ctWhen(rc.at) + (rc.ok ? ' | ' + rc.trigger : ' | ' + (rc.error || '')) : ta('ct.s.none')),
      ctRow(ta('ct.s.edit'), ed ? ctWhen(ed.at) + ' | ' + ctEnt(ed.entity) + ' | ' + ed.by : ta('ct.s.none')),
      ctRow(ta('ct.s.problem'), er ? ctWhen(er.at) + ' | ' + er.message : ta('ct.s.noProblem'))), checkBtn ? h('div', { class: 'adm__row' }, checkBtn) : null);
  let queue;
  if (!C) queue = h('p', { class: 'note', text: ta('ct.loading') });
  else if (!C.reachable) queue = h('p', { class: 'adm__status', text: ta('ct.s.unreach', { msg: C.error || '' }) });
  else {
    const lf = C.lastFailure, ls = C.lastSent, stuck = (C.pending || 0) + (C.rejected || 0);
    queue = h('div', null, h('dl', { class: 'adm__kvs' }, ctRow(ta('ct.s.waiting'), fmtNum(C.pending || 0) + (C.oldestPending ? ' | ' + ctWhen(new Date(C.oldestPending).getTime()) : '')), ctRow(ta('ct.s.refused'), fmtNum(C.rejected || 0)),
      ctRow(ta('ct.s.lastSent'), ls ? ctWhen(new Date(ls.sentAt).getTime()) + ' | ' + ctEnt(ls.entity) : ta('ct.s.none')), ctRow(ta('ct.s.lastFail'), lf ? ctEnt(lf.entity) + ' | ' + (lf.lastError || '') + (lf.lastHttp ? ' (' + lf.lastHttp + ')' : '') : ta('ct.s.noProblem'))),
      admin && stuck ? h('div', { class: 'adm__row' }, h('button', { type: 'button', class: 'btn btn--small', text: ta('ct.s.resend'), onclick: async (e) => { e.target.disabled = true; try { const r = await Store.rest.call('POST', '/catalog/crm-redeliver', { scope: 'all' }); toast(ta('ct.s.resent', { n: fmtNum(r.requeued || 0) })); } catch (x) { toast(ta('f.failed'), true); } await ctLoadCrm(); ctRedraw(); } })) : null);
  }
  const recent = (S.log || []).concat([]).map((l) => h('li', { class: 'adm__li' }, h('div', { class: 'adm__li-main' }, h('span', { text: l.kind + ' | ' + l.detail }), h('span', { class: 'note', text: ctWhen(l.at) })), h('span', { class: 'adm__badge', 'data-ok': l.ok ? '1' : '', text: l.ok ? 'OK' : '!' })));
  return h('div', { class: 'adm__stack' }, status, h('section', { class: 'adm__card adm__wide' }, h('h3', { class: 'adm__h3', text: ta('ct.s.queue') }), queue),
    ctUnits(), h('section', { class: 'adm__card adm__wide' }, h('h3', { class: 'adm__h3', text: ta('ct.s.recent') }), recent.length ? h('ul', { class: 'adm__list' }, recent) : h('p', { class: 'note', text: ta('ct.s.none') })));
}
function ctUnits() {
  const D = CT.data, linked = D.units.filter((u) => u.projectId).length, rep = CT.report, admin = ctAdmin();
  const list = (key, k, fmt) => (rep[key] || []).length ? h('details', { class: 'adm__details', open: key === 'ambiguous' || key === 'brokenLinks' || key === 'missing' }, h('summary', { text: ta(k) + ' (' + fmtNum(rep[key].length) + ')' }), h('ul', { class: 'adm__list adm__list--tight' }, rep[key].slice(0, 100).map((x) => h('li', { class: 'adm__li' }, h('div', { class: 'adm__li-main' }, h('span', { text: x.title }), h('span', { class: 'note', text: fmt(x) })))))) : null;
  const run = async (apply, btn) => {
    CT.working = 'units'; if (btn) { btn.disabled = true; btn.textContent = ta('ct.s.working'); }
    try { CT.report = await Store.rest.call('POST', '/catalog/link-units', { apply }); if (apply) { toast(ta('ct.s.applied', { n: fmtNum(CT.report.totals.linked) })); await loadCatalog(); } } catch (x) { toast(ta('f.failed'), true); }
    CT.working = ''; ctRedraw();
  };
  return h('section', { class: 'adm__card adm__wide' }, h('h3', { class: 'adm__h3', text: ta('ct.s.units') }), h('p', { class: 'note', text: ta('ct.s.unitsHint') }), h('p', { text: ta('ct.s.unitsNow', { linked: fmtNum(linked), total: fmtNum(D.units.length) }) }),
    admin ? h('div', { class: 'adm__row' }, h('button', { type: 'button', class: 'btn btn--small', disabled: !!CT.working, text: ta('ct.s.preview'), onclick: (e) => run(false, e.target) }),
      rep && !rep.applied && rep.totals.linked ? h('button', { type: 'button', class: 'btn btn--small btn--primary', disabled: !!CT.working, text: ta('ct.s.apply', { n: fmtNum(rep.totals.linked) }), onclick: (e) => run(true, e.target) }) : null) : null,
    rep ? h('div', { class: 'adm__stack' }, rep.totals.linked || rep.totals.ambiguous || rep.totals.missing || rep.totals.brokenLink ? null : h('p', { class: 'note', text: ta('ct.r.nothing') }),
      list('linked', 'ct.r.linked', (x) => x.text + ' → ' + x.project), list('ambiguous', 'ct.r.ambiguous', (x) => x.text + ' → ' + x.candidates.map((c) => c.name).join(' / ')), list('missing', 'ct.r.missing', (x) => x.text), list('brokenLinks', 'ct.r.broken', (x) => x.projectId),
      rep.totals.noProjectText ? h('p', { class: 'note', text: ta('ct.r.noText', { n: fmtNum(rep.totals.noProjectText) }) }) : null) : null);
}

/* ---------- the project field on the unit form ----------
   Developer, governorate, area and project are linked lists built from the CRM. Each one offers only what fits the others:
   a governorate offers its own areas, a developer its own projects. Choosing a project fills in the rest. */
function ctLink(rows, sel) {
  const keep = (skip) => rows.filter((x) => ['d', 'c', 'a', 'p'].every((k) => skip.includes(k) || !sel[k] || x[k] === sel[k]));
  const ids = (list, k) => new Set(list.map((x) => x[k]).filter(Boolean));
  return { d: ids(keep('dp'), 'd'), c: ids(keep('cap'), 'c'), a: ids(keep('ap'), 'a'), p: ids(keep('p'), 'p') };
}
function catalogProjectField(r) {
  const D = CT.data;
  if (!D) return h('div', { class: 'af' }, h('label', { class: 'af__l', text: ta('ct.u.project') }), h('small', { class: 'af__h', text: ta('ct.u.loading') }));
  const rows = D.projects.filter((p) => p.active !== false || (r && r.projectId === p.id)).map((p) => ({ d: p.developerId || '', c: p.cityId || '', a: p.areaId || '', p: p.id }));
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), App.lang);
  const used = (k) => new Set(rows.map((x) => x[k]));
  const pool = { d: D.developers.filter((x) => used('d').has(x.id)).sort(byName), c: D.cities.filter((x) => used('c').has(x.id)).sort(byName), a: D.areas.filter((x) => used('a').has(x.id)).sort(byName), p: D.projects.filter((x) => used('p').has(x.id)).sort(byName) };
  const sels = { d: select('x_developer', [], '', { blank: ta('ct.u.all') }), c: select('x_city', [], '', { blank: ta('ct.u.all') }), a: select('x_area', [], '', { blank: ta('ct.u.all') }), p: select('projectId', [], '', { blank: ta('ct.u.none') }) };
  const note = h('small', { class: 'af__h', text: ta('ct.u.hint') });
  const label = (k, x, sel) => {
    if (k === 'a') return sel.c ? x.name : x.name + ' — ' + ((ctBy('city', x.cityId) || {}).name || '');
    if (k === 'p') { const dn = ctDevName(x.developerId); return x.name + (!sel.d && dn ? ' — ' + dn : '') + (x.active === false ? ' (' + ta('ct.inactive') + ')' : ''); }
    return x.name;
  };
  const fill = (k, ok, sel) => {
    const s = sels[k], blank = s.options[0].text; s.textContent = ''; s.append(h('option', { value: '', text: blank }));
    pool[k].filter((x) => ok.has(x.id)).forEach((x) => s.append(h('option', { value: x.id, text: label(k, x, sel) })));
    s.value = sel[k]; if (s.value !== sel[k]) s.value = '';
  };
  const read = () => ({ d: sels.d.value, c: sels.c.value, a: sels.a.value, p: sels.p.value });
  let first = true, autoRegion = '';
  const refresh = (changed) => {
    const sel = read(), had = sel.p; let L;
    /* a project or an area fixes where it is */
    if (changed === 'p' && sel.p) { const x = rows.find((y) => y.p === sel.p); if (x) { sel.d = x.d; sel.c = x.c; sel.a = x.a; } }
    else if (changed === 'a' && sel.a) { const a = ctBy('area', sel.a); if (a) sel.c = a.cityId; }
    /* a project stands for its own developer, governorate and area: changing one of them (even to "All") lets go of the project */
    if (['d', 'c', 'a'].includes(changed) && sel.p) { const x = rows.find((y) => y.p === sel.p); if (!x || x[changed] !== sel[changed]) sel.p = ''; }
    /* what no longer fits goes back to "All": the project first, then the area, the developer, the governorate. The list just changed is never touched. */
    ['p', 'a', 'd', 'c'].forEach((k) => { if (k !== changed && sel[k] && !ctLink(rows, sel)[k].has(sel[k])) sel[k] = ''; });
    L = ctLink(rows, sel);
    ['d', 'c', 'a', 'p'].forEach((k) => fill(k, L[k], sel));
    note.textContent = !first && had && !sel.p && changed !== 'p' ? ta('ct.u.cleared') : ta('ct.u.hint');
    sync();
  };
  const sync = () => {
    const f = sels.p.form; if (!f) return;
    const pj = sels.p.value ? catalogProject(sels.p.value) : null, ct = sels.c.value ? catalogCity(sels.c.value) : null;
    const region = pj ? catalogRegion(pj) : (ct && ct.region) || '';
    /* the region follows the project; with only a governorate it follows that, until the person picks a region by hand */
    const reg = f.elements.region; if (reg) { if (pj) { if (region) { reg.value = region; autoRegion = region; } reg.disabled = !!region; } else { reg.disabled = false; if (region && (!reg.value || reg.value === autoRegion)) { reg.value = region; autoRegion = region; } } }
    const txt = f.querySelector('[name=project_en]'); const w = txt && txt.closest('.af'); if (w) w.hidden = !!pj;
    if (pj) note.textContent = ta('ct.u.followed');
  };
  /* start from the unit's own project, if it has one */
  const startSel = r && r.projectId && rows.some((x) => x.p === r.projectId) ? { d: '', c: '', a: '', p: r.projectId } : { d: '', c: '', a: '', p: '' };
  fill('p', new Set(rows.map((x) => x.p)), startSel);
  refresh(startSel.p ? 'p' : '');
  first = false;
  ['d', 'c', 'a', 'p'].forEach((k) => sels[k].addEventListener('change', () => refresh(k)));
  setTimeout(sync, 0);
  return h('div', { class: 'af-group' },
    h('div', { class: 'af__row' }, fieldWrap(ta('ct.u.developer'), sels.d), fieldWrap(ta('ct.u.city'), sels.c), fieldWrap(ta('ct.u.area'), sels.a)),
    fieldWrap(ta('ct.u.project'), sels.p, null, note));
}
