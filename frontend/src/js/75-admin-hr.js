/* ---------- Production-only dashboard sections: branches, jobs, job applications, users. Roles decide which ones a person sees. ---------- */
Object.assign(AD.en, {
  'nav.branches': 'Branches', 'nav.jobs': 'Jobs', 'nav.applications': 'Applications', 'nav.users': 'Users',
  'br.title': 'Branches', 'br.lead': 'The company’s branch addresses. They appear in the contact section and in the footer of the site.', 'br.add': 'Add a branch', 'br.edit': 'Edit branch', 'br.new': 'New branch',
  'br.name': 'Branch name', 'br.city': 'City or area', 'br.address': 'Address', 'br.phone': 'Phone', 'br.wa': 'WhatsApp', 'br.hours': 'Working hours', 'br.map': 'Map link',
  'br.mapHint': 'A Google Maps link that starts with https://. Leave it empty to hide the Maps button.', 'br.empty': 'No branches yet. Add them and they appear on the site at once.', 'br.del': 'Delete the branch “{name}”?', 'br.reqAny': 'Enter a name or an address',
  'jb.title': 'Jobs', 'jb.lead': 'The open positions shown on the Careers page. Hidden jobs and jobs past their closing date are not shown.', 'jb.add': 'Add a job', 'jb.edit': 'Edit job', 'jb.new': 'New job',
  'jb.name': 'Job title', 'jb.dept': 'Department', 'jb.loc': 'Location', 'jb.type': 'Type', 'jb.desc': 'Description', 'jb.req': 'Requirements', 'jb.closes': 'Closing date (optional)', 'jb.closesHint': 'After this date the job disappears from the site.',
  'jb.active': 'Show this job on the site', 'jb.empty': 'No jobs yet. The Careers page still accepts general applications while this list is empty.', 'jb.del': 'Delete the job “{name}”? Applications already received are kept.',
  'jb.shown': 'Showing', 'jb.hidden': 'Hidden', 'jb.closed': 'Closed', 'jb.apps': 'Applications', 'jb.page': 'Open on the site', 'f.badDate': 'Enter a valid date.',
  'ap.title': 'Job applications', 'ap.lead': 'Everyone who applied through the Careers page. The newest are at the top.', 'ap.all': 'All', 'ap.allJobs': 'All jobs',
  'ap.s.new': 'New', 'ap.s.reviewing': 'Reviewing', 'ap.s.interview': 'Interview', 'ap.s.hired': 'Hired', 'ap.s.rejected': 'Rejected',
  'ap.csv': 'Download CSV', 'ap.empty': 'No applications yet. They appear here as soon as someone applies.', 'ap.emptyFilter': 'No applications match this filter.', 'ap.position': 'Position', 'ap.general': 'General application',
  'ap.cv': 'Download CV', 'ap.noCv': 'No CV attached', 'ap.status': 'Status', 'ap.note': 'Private note', 'ap.reply': 'Reply on WhatsApp', 'ap.more': 'Show more',
  'ap.del': 'Delete the application from {name}? The CV file is deleted too. This cannot be undone.', 'ap.err': 'The applications could not be loaded. Try again.', 'ap.waText': 'Hello {name}, this is ICONIC Real Estate. Thank you for applying.',
  'us.title': 'Users', 'us.lead': 'The people who can sign in to this dashboard, and what each of them can do.', 'us.add': 'Add a user', 'us.new': 'New user', 'us.name': 'Name', 'us.email': 'Email', 'us.role': 'Role', 'us.pass': 'Password',
  'us.passHint': 'At least 10 characters. Give it to the person privately. They can change it under Account.', 'us.gen': 'Generate a strong password', 'us.copy': 'Copy', 'us.copied': 'Copied',
  'us.r.admin': 'Admin', 'us.r.editor': 'Editor', 'us.r.hr': 'HR',
  'us.d.admin': 'Admin: everything, including users and backups.', 'us.d.editor': 'Editor: site content (texts, units, agents, teams, branches, contact) and enquiries.', 'us.d.hr': 'HR: job postings and job applications only.',
  'us.you': 'You', 'us.last': 'Last sign-in: {when}', 'us.never': 'Has not signed in yet', 'us.reset': 'Reset password', 'us.resetTitle': 'New password for {email}', 'us.resetOk': 'Password changed. This person was signed out everywhere.',
  'us.del': 'Delete the account {email}? This cannot be undone.', 'us.created': 'Account created', 'us.roleSaved': 'Role changed', 'us.empty': 'No users.', 'us.load': 'The users could not be loaded.', 'us.ok': 'Save password',
  'us.err.exists': 'This email already has an account.', 'us.err.lastAdmin': 'At least one admin account must remain.', 'us.err.selfRole': 'You cannot change your own role.', 'us.err.selfDel': 'You cannot delete your own account.',
  'us.err.input': 'Check the email, and use a password of at least 10 characters.'
});
Object.assign(AD.ar, {
  'nav.branches': 'الفروع', 'nav.jobs': 'الوظائف', 'nav.applications': 'طلبات التوظيف', 'nav.users': 'المستخدمون',
  'br.title': 'الفروع', 'br.lead': 'عناوين فروع الشركة. تظهر في قسم التواصل وفي ذيل الموقع.', 'br.add': 'إضافة فرع', 'br.edit': 'تعديل الفرع', 'br.new': 'فرع جديد',
  'br.name': 'اسم الفرع', 'br.city': 'المدينة أو المنطقة', 'br.address': 'العنوان', 'br.phone': 'الهاتف', 'br.wa': 'واتساب', 'br.hours': 'ساعات العمل', 'br.map': 'رابط الخريطة',
  'br.mapHint': 'رابط من خرائط جوجل يبدأ بـ https://. اتركه فارغًا لإخفاء زر الخريطة.', 'br.empty': 'لا توجد فروع بعد. أضفها وستظهر في الموقع فورًا.', 'br.del': 'حذف فرع «{name}»؟', 'br.reqAny': 'أدخل اسمًا أو عنوانًا',
  'jb.title': 'الوظائف', 'jb.lead': 'الوظائف المتاحة التي تظهر في صفحة الوظائف. الوظائف المخفية أو التي انتهى تاريخها لا تظهر.', 'jb.add': 'إضافة وظيفة', 'jb.edit': 'تعديل الوظيفة', 'jb.new': 'وظيفة جديدة',
  'jb.name': 'المسمى الوظيفي', 'jb.dept': 'القسم', 'jb.loc': 'مكان العمل', 'jb.type': 'نوع الدوام', 'jb.desc': 'الوصف', 'jb.req': 'المتطلبات', 'jb.closes': 'تاريخ الإغلاق (اختياري)', 'jb.closesHint': 'بعد هذا التاريخ تختفي الوظيفة من الموقع.',
  'jb.active': 'إظهار هذه الوظيفة في الموقع', 'jb.empty': 'لا توجد وظائف بعد. صفحة الوظائف تستقبل التقديم العام حتى وهذه القائمة فارغة.', 'jb.del': 'حذف وظيفة «{name}»؟ الطلبات التي وصلت تبقى محفوظة.',
  'jb.shown': 'ظاهرة', 'jb.hidden': 'مخفية', 'jb.closed': 'منتهية', 'jb.apps': 'الطلبات', 'jb.page': 'فتح في الموقع', 'f.badDate': 'أدخل تاريخًا صحيحًا.',
  'ap.title': 'طلبات التوظيف', 'ap.lead': 'كل من قدّم عبر صفحة الوظائف. الأحدث في الأعلى.', 'ap.all': 'الكل', 'ap.allJobs': 'كل الوظائف',
  'ap.s.new': 'جديد', 'ap.s.reviewing': 'قيد المراجعة', 'ap.s.interview': 'مقابلة', 'ap.s.hired': 'تم التعيين', 'ap.s.rejected': 'مرفوض',
  'ap.csv': 'تنزيل CSV', 'ap.empty': 'لا توجد طلبات بعد. ستظهر هنا فور أن يقدّم أحد.', 'ap.emptyFilter': 'لا توجد طلبات تطابق هذا الفلتر.', 'ap.position': 'الوظيفة', 'ap.general': 'تقديم عام',
  'ap.cv': 'تنزيل السيرة الذاتية', 'ap.noCv': 'بدون سيرة ذاتية', 'ap.status': 'الحالة', 'ap.note': 'ملاحظة داخلية', 'ap.reply': 'الرد عبر واتساب', 'ap.more': 'عرض المزيد',
  'ap.del': 'حذف طلب {name}؟ سيُحذف ملف السيرة الذاتية أيضًا ولا يمكن التراجع.', 'ap.err': 'تعذّر تحميل الطلبات. حاول مرة أخرى.', 'ap.waText': 'مرحبًا {name}، معك ICONIC Real Estate. شكرًا لتقديمك لدينا.',
  'us.title': 'المستخدمون', 'us.lead': 'من يستطيع الدخول إلى هذه اللوحة، وما يستطيع كل واحد منهم فعله.', 'us.add': 'إضافة مستخدم', 'us.new': 'مستخدم جديد', 'us.name': 'الاسم', 'us.email': 'البريد الإلكتروني', 'us.role': 'الصلاحية', 'us.pass': 'كلمة المرور',
  'us.passHint': '10 أحرف على الأقل. سلّمها للشخص بشكل خاص، ويمكنه تغييرها من «الحساب».', 'us.gen': 'توليد كلمة مرور قوية', 'us.copy': 'نسخ', 'us.copied': 'تم النسخ',
  'us.r.admin': 'مدير', 'us.r.editor': 'محرّر', 'us.r.hr': 'موارد بشرية',
  'us.d.admin': 'مدير: كل شيء، بما فيه المستخدمون والنسخ الاحتياطية.', 'us.d.editor': 'محرّر: محتوى الموقع (النصوص والوحدات والوكلاء والفرق والفروع والتواصل) والاستفسارات.', 'us.d.hr': 'موارد بشرية: الوظائف وطلبات التوظيف فقط.',
  'us.you': 'أنت', 'us.last': 'آخر دخول: {when}', 'us.never': 'لم يسجّل الدخول بعد', 'us.reset': 'إعادة تعيين كلمة المرور', 'us.resetTitle': 'كلمة مرور جديدة لـ {email}', 'us.resetOk': 'تم تغيير كلمة المرور. تم تسجيل خروج هذا الشخص من كل الأجهزة.',
  'us.del': 'حذف الحساب {email}؟ لا يمكن التراجع عن ذلك.', 'us.created': 'تم إنشاء الحساب', 'us.roleSaved': 'تم تغيير الصلاحية', 'us.empty': 'لا يوجد مستخدمون.', 'us.load': 'تعذّر تحميل المستخدمين.', 'us.ok': 'حفظ كلمة المرور',
  'us.err.exists': 'هذا البريد لديه حساب بالفعل.', 'us.err.lastAdmin': 'يجب أن يبقى حساب مدير واحد على الأقل.', 'us.err.selfRole': 'لا يمكنك تغيير صلاحيتك أنت.', 'us.err.selfDel': 'لا يمكنك حذف حسابك أنت.',
  'us.err.input': 'راجع البريد، واستخدم كلمة مرور من 10 أحرف على الأقل.'
});

/* ----- who sees what ----- */
const ROLE_SECTIONS = {
  admin: ['overview', 'leads', 'sell', 'applications', 'texts', 'skyline', 'about', 'company', 'branches', 'teams', 'agents', 'units', 'jobs', 'seo', 'users', 'backup', 'account'],
  editor: ['overview', 'leads', 'sell', 'texts', 'skyline', 'about', 'company', 'branches', 'teams', 'agents', 'units', 'seo', 'backup', 'account'],
  hr: ['applications', 'jobs', 'account']
};
const myRole = () => (Store.me && Store.me.role) || 'admin';
function applyRoleSections() { SECTIONS.splice(0, SECTIONS.length, ...(ROLE_SECTIONS[myRole()] || ROLE_SECTIONS.editor)); if (!SECTIONS.includes(AS.sec)) AS.sec = SECTIONS[0]; }
const isoToday = () => new Date().toISOString().slice(0, 10);
const errText = (e, map) => { const m = (e && e.serverMessage) || ''; for (const k in map) if (m === k) return ta(map[k]); return ''; };

/* ----- branches ----- */
function viewBranches() {
  if (AS.form && AS.form.kind === 'branch') return branchForm(AS.form.id);
  const rows = Store.raw.branches.slice().sort((a, b) => orderOf(a) - orderOf(b)).map((b) => h('li', { class: 'adm__li' },
    h('div', { class: 'adm__li-main' }, h('strong', { text: L(b.name) || L(b.city) || '—' }), h('span', { class: 'note', text: [L(b.city), L(b.address)].filter(Boolean).join(' | ') })),
    h('button', { type: 'button', class: 'btn btn--small', onclick: () => { AS.form = { kind: 'branch', id: b.id }; drawAdmin(); }, text: ta('f.edit') })));
  return h('div', null, sectionHead(ta('br.title'), ta('br.lead'), addBtn(ta('br.add'), () => { AS.form = { kind: 'branch', id: null }; drawAdmin(); })),
    rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: ta('br.empty') }));
}
function branchForm(id) {
  const r = id ? rawOf('branches', id) : null, err = (k) => h('p', { class: 'af__e', 'data-err': k });
  const del = r ? async () => {
    if (!(await ask(ta('br.del', { name: L(r.name) || L(r.city) || L(r.address) })))) return;
    try { await dbDel('branches', id); toast(ta('f.saved')); AS.form = null; drawAdmin(); } catch (e) { console.warn(e); toast(ta('f.failed'), true); }
  } : null;
  const f = formShell('', [
    bil('name', ta('br.name'), r && r.name, false), bil('city', ta('br.city'), r && r.city, false), bil('address', ta('br.address'), r && r.address, true),
    h('div', { class: 'af__pair' }, fieldWrap(ta('br.phone'), input('phone', r && r.phone, { type: 'tel', dir: 'ltr', im: 'tel' }), null, err('phone')), fieldWrap(ta('br.wa'), input('whatsapp', r && r.whatsapp, { type: 'tel', dir: 'ltr', im: 'tel' }), ta('ag.waHint'), err('whatsapp'))),
    bil('hours', ta('br.hours'), r && r.hours, false),
    fieldWrap(ta('br.map'), input('map', r && r.map, { type: 'url', dir: 'ltr', ph: 'https://' }), ta('br.mapHint'), err('map')),
    orderField(r && r.order)
  ], {
    collect: (f) => {
      const v = (n) => (f.elements[n].value || '').trim(), name = readBil(f, 'name'), address = readBil(f, 'address'); let bad = false;
      bad = setErr(f, 'name', hasAny(name) || hasAny(address) ? '' : ta('br.reqAny')) || bad;
      bad = setErr(f, 'phone', v('phone') && v('phone').replace(/\D/g, '').length < 7 ? ta('f.badPhone') : '') || bad;
      const wa = waNumber(v('whatsapp')); bad = setErr(f, 'whatsapp', v('whatsapp') && !(wa.length >= 8 && wa.length <= 15) ? ta('f.badWa') : '') || bad;
      bad = setErr(f, 'map', v('map') && !isHttps(v('map')) ? ta('f.badUrl') : '') || bad;
      return bad ? null : { name, city: readBil(f, 'city'), address, phone: v('phone'), whatsapp: v('whatsapp'), hours: readBil(f, 'hours'), map: v('map'), order: numOrNull(f.elements.order.value) };
    },
    write: async (d) => { await dbSet('branches', id || newId('b'), d); AS.form = null; drawAdmin(); }
  }, () => { AS.form = null; drawAdmin(); }, del);
  return h('div', null, backHead(r ? ta('br.edit') : ta('br.new')), f);
}

/* ----- jobs ----- */
function viewJobs() {
  if (AS.form && AS.form.kind === 'job') return jobForm(AS.form.id);
  const today = isoToday();
  const rows = Store.raw.jobs.slice().sort((a, b) => orderOf(a) - orderOf(b)).map((j) => {
    const closed = j.closes && j.closes < today, state = j.active === false ? 'jb.hidden' : closed ? 'jb.closed' : 'jb.shown';
    return h('li', { class: 'adm__li' },
      h('div', { class: 'adm__li-main' }, h('strong', { text: nameOf(j.title) }), h('span', { class: 'note', text: [L(j.department), L(j.location), (JOB_TYPES.find((x) => x[0] === (j.type || 'full')) || [0, {}])[1][App.lang]].filter(Boolean).join(' | ') }),
        h('span', { class: 'adm__badge', 'data-ok': state === 'jb.shown' ? '1' : '', text: ta(state) })),
      h('div', { class: 'adm__row' },
        h('button', { type: 'button', class: 'adm__link', onclick: () => { AS.appJob = j.id; AS.sec = 'applications'; AS.form = null; drawAdmin(); }, text: ta('jb.apps') }),
        h('button', { type: 'button', class: 'btn btn--small', onclick: () => { AS.form = { kind: 'job', id: j.id }; drawAdmin(); }, text: ta('f.edit') })));
  });
  return h('div', null, sectionHead(ta('jb.title'), ta('jb.lead'), addBtn(ta('jb.add'), () => { AS.form = { kind: 'job', id: null }; drawAdmin(); })),
    rows.length ? h('ul', { class: 'adm__list' }, rows) : h('p', { class: 'adm__empty', text: ta('jb.empty') }));
}
function jobForm(id) {
  const r = id ? rawOf('jobs', id) : null, err = (k) => h('p', { class: 'af__e', 'data-err': k });
  const del = r ? async () => {
    if (!(await ask(ta('jb.del', { name: nameOf(r.title) })))) return;
    try { await dbDel('jobs', id); toast(ta('f.saved')); AS.form = null; drawAdmin(); } catch (e) { console.warn(e); toast(ta('f.failed'), true); }
  } : null;
  const active = h('input', { type: 'checkbox', name: 'active', checked: r ? r.active !== false : true });
  const f = formShell('', [
    bil('title', ta('jb.name'), r && r.title, false), bil('department', ta('jb.dept'), r && r.department, false), bil('location', ta('jb.loc'), r && r.location, false),
    fieldWrap(ta('jb.type'), select('type', JOB_TYPES.map(([k, l]) => [k, l[App.lang]]), r && r.type ? r.type : 'full')),
    bil('description', ta('jb.desc'), r && r.description, true), bil('requirements', ta('jb.req'), r && r.requirements, true),
    fieldWrap(ta('jb.closes'), input('closes', r && r.closes, { type: 'date', dir: 'ltr' }), ta('jb.closesHint'), err('closes')),
    h('label', { class: 'af__check' }, active, h('span', { text: ta('jb.active') })),
    orderField(r && r.order),
    r && r.slug ? h('p', { class: 'note' }, h('a', { href: '/' + App.lang + '/careers/' + r.slug, target: '_blank', rel: 'noopener', text: ta('jb.page') })) : null
  ].filter(Boolean), {
    collect: (f) => {
      const v = (n) => (f.elements[n].value || '').trim(), title = readBil(f, 'title'); let bad = false;
      bad = setErr(f, 'title', hasAny(title) ? '' : ta('f.reqAny')) || bad;
      bad = setErr(f, 'closes', v('closes') && !/^\d{4}-\d{2}-\d{2}$/.test(v('closes')) ? ta('f.badDate') : '') || bad;
      return bad ? null : { title, department: readBil(f, 'department'), location: readBil(f, 'location'), type: v('type') || 'full', description: readBil(f, 'description'), requirements: readBil(f, 'requirements'), closes: v('closes'), active: f.elements.active.checked, order: numOrNull(f.elements.order.value) };
    },
    write: async (d) => { await dbSet('jobs', id || newId('j'), d); AS.form = null; drawAdmin(); }
  }, () => { AS.form = null; drawAdmin(); }, del);
  return h('div', null, backHead(r ? ta('jb.edit') : ta('jb.new')), f);
}

/* ----- applications ----- */
const APP_STATUS = ['new', 'reviewing', 'interview', 'hired', 'rejected'];
async function refreshAppCount() {
  if (!SERVER || !Store.rest || !['admin', 'hr'].includes(myRole())) return;
  try { const r = await Store.rest.call('GET', '/applications?limit=1'); AS.newApps = (r && r.counts && r.counts.new) || 0; if (AS.open) drawChrome(); } catch (_) { /* the count is a convenience */ }
}
function applicationItem(a, reload) {
  const sel = h('select', { class: 'ai ld__sel', 'aria-label': ta('ap.status'), onchange: async (e) => { try { await Store.rest.call('PATCH', '/applications/' + a.id, { status: e.target.value }); a.status = e.target.value; item.dataset.status = a.status; toast(ta('f.saved')); refreshAppCount(); } catch (_) { toast(ta('f.failed'), true); e.target.value = a.status; } } },
    APP_STATUS.map((s) => h('option', { value: s, text: ta('ap.s.' + s) })));
  sel.value = a.status;
  const note = h('input', { class: 'ai', value: a.note || '', placeholder: ta('ap.note'), 'aria-label': ta('ap.note'), maxlength: 1000, onchange: async (e) => { try { await Store.rest.call('PATCH', '/applications/' + a.id, { note: e.target.value }); toast(ta('f.saved')); } catch (_) { toast(ta('f.failed'), true); } } });
  const wa = a.phone ? waNumber(a.phone) : '';
  const item = h('article', { class: 'ld__item', 'data-status': a.status },
    h('header', { class: 'ld__top' }, h('strong', { class: 'ld__name', text: a.name }), h('span', { class: 'ld__badge', text: a.jobTitle || ta('ap.general') }), h('time', { class: 'note', text: fmtWhen(a.created) })),
    h('p', { class: 'ld__lines' }, a.phone ? h('a', { href: 'tel:' + String(a.phone).replace(/[^\d+]/g, ''), dir: 'ltr', text: a.phone }) : null, a.email ? h('a', { href: 'mailto:' + a.email, dir: 'ltr', text: a.email }) : null),
    a.message ? h('p', { class: 'ld__msg', text: a.message }) : null,
    h('div', { class: 'adm__row' }, a.cv ? h('a', { class: 'btn btn--small', href: '/iconic-api/applications/' + a.id + '/cv', download: '', text: ta('ap.cv') + ' (' + a.cv.name + ')' }) : h('span', { class: 'note', text: ta('ap.noCv') })),
    h('div', { class: 'af__row' }, fieldWrap(ta('ap.status'), sel), fieldWrap(ta('ap.note'), note)),
    h('div', { class: 'adm__row' },
      wa ? h('a', { class: 'btn btn--small btn--primary', href: 'https://wa.me/' + wa + '?text=' + encodeURIComponent(ta('ap.waText', { name: a.name })), target: '_blank', rel: 'noopener noreferrer', text: ta('ap.reply') }) : null,
      h('span', { class: 'adm__grow' }),
      h('button', { type: 'button', class: 'adm__link adm__link--bad', text: ta('f.delete'), onclick: async () => { if (!(await ask(ta('ap.del', { name: a.name })))) return; try { await Store.rest.call('DELETE', '/applications/' + a.id); toast(ta('f.saved')); reload(); refreshAppCount(); } catch (_) { toast(ta('f.failed'), true); } } })));
  return item;
}
function viewApplications() {
  const wrap = h('div'), chips = h('div', { class: 'chips ld__chips' }), list = h('div', { class: 'ld__list' }), more = h('button', { type: 'button', class: 'btn btn--small', text: ta('ap.more'), hidden: true });
  const state = { filter: AS.appFilter || '', job: AS.appJob || '', offset: 0, total: 0 }, PAGE = 30;
  const jobSel = h('select', { class: 'ai ai--inline', 'aria-label': ta('ap.position'), onchange: (e) => { state.job = AS.appJob = e.target.value; load(true); } }, h('option', { value: '', text: ta('ap.allJobs') }), Store.raw.jobs.map((j) => h('option', { value: j.id, text: nameOf(j.title) })));
  jobSel.value = state.job;
  const csv = h('a', { class: 'btn btn--small', href: '/iconic-api/applications.csv', download: '', text: ta('ap.csv') });
  const drawChips = (counts) => {
    chips.textContent = ''; const total = APP_STATUS.reduce((n, s) => n + (counts[s] || 0), 0);
    [['', ta('ap.all') + ' (' + fmtNum(total) + ')']].concat(APP_STATUS.map((s) => [s, ta('ap.s.' + s) + ' (' + fmtNum(counts[s] || 0) + ')'])).forEach(([v, label]) => {
      chips.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.filter === v), text: label, onclick: () => { state.filter = AS.appFilter = v; load(true); } }));
    });
  };
  async function load(reset) {
    if (reset) { state.offset = 0; list.textContent = ''; }
    try {
      const r = await Store.rest.call('GET', '/applications?status=' + state.filter + '&job=' + encodeURIComponent(state.job) + '&limit=' + PAGE + '&offset=' + state.offset);
      state.total = r.total; drawChips(r.counts || {}); AS.newApps = (r.counts && r.counts.new) || 0; drawChrome();
      r.applications.forEach((a) => list.append(applicationItem(a, () => load(true))));
      state.offset += r.applications.length; more.hidden = state.offset >= state.total;
      if (!state.total) list.append(h('p', { class: 'note ld__none', text: ta(state.filter || state.job ? 'ap.emptyFilter' : 'ap.empty') }));
    } catch (_) { list.append(h('p', { class: 'adm__status', role: 'alert', text: ta('ap.err') })); }
  }
  more.addEventListener('click', () => load(false));
  wrap.append(sectionHead(ta('ap.title'), ta('ap.lead'), csv), h('div', { class: 'adm__filters' }, jobSel), chips, list, h('div', { class: 'adm__row' }, more));
  load(true); return wrap;
}

/* ----- users ----- */
const ROLE_KEYS = ['admin', 'editor', 'hr'];
function strongPassword() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', buf = new Uint32Array(16); crypto.getRandomValues(buf);
  return Array.from(buf, (n) => abc[n % abc.length]).join('');
}
const copyText = async (text) => { try { await navigator.clipboard.writeText(text); toast(ta('us.copied')); } catch (_) { /* the text stays visible for copying by hand */ } };
/* a small dialog that asks for a new password for one person */
function askPassword(email) {
  return new Promise((res) => {
    const done = (v) => { box.remove(); res(v); };
    const pw = h('input', { class: 'ai', type: 'text', dir: 'ltr', autocomplete: 'off', spellcheck: 'false', 'aria-label': ta('us.pass') }), msg = h('small', { class: 'af__e' });
    const gen = h('button', { type: 'button', class: 'btn btn--small', text: ta('us.gen'), onclick: () => { pw.value = strongPassword(); } });
    const cp = h('button', { type: 'button', class: 'btn btn--small', text: ta('us.copy'), onclick: () => { if (pw.value) copyText(pw.value); } });
    const ok = h('button', { type: 'button', class: 'btn btn--small btn--primary', text: ta('us.ok'), onclick: () => { if (pw.value.length < 10) { msg.textContent = ta('ac.short'); return; } done(pw.value); } });
    const no = h('button', { type: 'button', class: 'btn btn--small', text: ta('f.cancel'), onclick: () => done(null) });
    const box = h('div', { class: 'adm__modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': ta('us.resetTitle', { email }), onkeydown: (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } } },
      h('div', { class: 'adm__modalbox' }, h('p', { text: ta('us.resetTitle', { email }) }), pw, h('div', { class: 'adm__row' }, gen, cp), msg, h('small', { class: 'af__h', text: ta('us.passHint') }), h('div', { class: 'adm__row' }, no, ok)));
    admEl.append(box); pw.focus();
  });
}
function userItem(u, meId, reload) {
  const self = u.id === meId, fail = (e) => toast(errText(e, { 'At least one admin is required': 'us.err.lastAdmin', 'You cannot change your own role': 'us.err.selfRole', 'You cannot delete your own account': 'us.err.selfDel' }) || ta('f.failed'), true);
  const sel = h('select', { class: 'ai ld__sel', 'aria-label': ta('us.role'), disabled: self, onchange: async (e) => { try { await Store.rest.call('PATCH', '/users/' + u.id, { role: e.target.value }); u.role = e.target.value; toast(ta('us.roleSaved')); } catch (err) { fail(err); e.target.value = u.role; } } },
    ROLE_KEYS.map((r) => h('option', { value: r, text: ta('us.r.' + r) })));
  sel.value = u.role;
  const last = u.lastLogin ? ta('us.last', { when: fmtWhen(u.lastLogin) }) : ta('us.never');
  return h('article', { class: 'ld__item' },
    h('header', { class: 'ld__top' }, h('strong', { class: 'ld__name', text: u.name || u.email }), self ? h('span', { class: 'ld__badge', text: ta('us.you') }) : null),
    u.name ? h('p', { class: 'ld__lines' }, h('span', { dir: 'ltr', text: u.email })) : null, h('p', { class: 'note', text: last }),
    h('div', { class: 'af__row' }, fieldWrap(ta('us.role'), sel)),
    h('div', { class: 'adm__row' },
      h('button', { type: 'button', class: 'btn btn--small', text: ta('us.reset'), onclick: async () => {
        const pw = await askPassword(u.email); if (!pw) return;
        try { await Store.rest.call('PATCH', '/users/' + u.id, { password: pw }); toast(ta('us.resetOk')); } catch (err) { fail(err); }
      } }),
      h('span', { class: 'adm__grow' }),
      self ? null : h('button', { type: 'button', class: 'adm__link adm__link--bad', text: ta('f.delete'), onclick: async () => { if (!(await ask(ta('us.del', { email: u.email })))) return; try { await Store.rest.call('DELETE', '/users/' + u.id); toast(ta('f.saved')); reload(); } catch (err) { fail(err); } } })));
}
function userForm() {
  const err = (k) => h('p', { class: 'af__e', 'data-err': k });
  const pw = input('password', '', { type: 'text', dir: 'ltr' }); pw.setAttribute('spellcheck', 'false');
  const gen = h('button', { type: 'button', class: 'btn btn--small', text: ta('us.gen'), onclick: () => { pw.value = strongPassword(); pw.dispatchEvent(new Event('input', { bubbles: true })); } });
  const cp = h('button', { type: 'button', class: 'btn btn--small', text: ta('us.copy'), onclick: () => { if (pw.value) copyText(pw.value); } });
  const f = formShell('', [
    fieldWrap(ta('us.name'), input('name', '', {})),
    fieldWrap(ta('us.email'), input('email', '', { type: 'email', dir: 'ltr' }), null, err('email')),
    fieldWrap(ta('us.role'), select('role', ROLE_KEYS.map((r) => [r, ta('us.r.' + r)]), 'editor')),
    h('ul', { class: 'note us__roles' }, ROLE_KEYS.map((r) => h('li', { text: ta('us.d.' + r) }))),
    fieldWrap(ta('us.pass'), pw, ta('us.passHint'), err('password')), h('div', { class: 'adm__row' }, gen, cp)
  ], {
    collect: (f) => {
      const v = (n) => (f.elements[n].value || '').trim(); let bad = false;
      bad = setErr(f, 'email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) ? '' : ta('f.badEmail')) || bad;
      bad = setErr(f, 'password', f.elements.password.value.length >= 10 ? '' : ta('ac.short')) || bad;
      return bad ? null : { name: v('name'), email: v('email'), role: v('role'), password: f.elements.password.value };
    },
    write: async (d) => {
      try { await Store.rest.call('POST', '/users', d); } catch (e) {
        const m = errText(e, { 'This email already has an account': 'us.err.exists' }); toast(m || ta('us.err.input'), true); throw e;
      }
      toast(ta('us.created')); AS.form = null; drawAdmin();
    }
  }, () => { AS.form = null; drawAdmin(); });
  return h('div', null, backHead(ta('us.new')), f);
}
function viewUsers() {
  if (AS.form && AS.form.kind === 'user') return userForm();
  const list = h('div', { class: 'ld__list' });
  async function load() {
    list.textContent = '';
    try { const r = await Store.rest.call('GET', '/users'); r.users.forEach((u) => list.append(userItem(u, r.me, load))); if (!r.users.length) list.append(h('p', { class: 'note', text: ta('us.empty') })); }
    catch (_) { list.append(h('p', { class: 'adm__status', role: 'alert', text: ta('us.load') })); }
  }
  load();
  return h('div', null, sectionHead(ta('us.title'), ta('us.lead'), addBtn(ta('us.add'), () => { AS.form = { kind: 'user' }; drawAdmin(); })),
    h('ul', { class: 'note us__roles' }, ROLE_KEYS.map((r) => h('li', { text: ta('us.d.' + r) }))), list);
}

if (SERVER) Object.assign(VIEWS, { branches: viewBranches, jobs: viewJobs, applications: viewApplications, users: viewUsers });
