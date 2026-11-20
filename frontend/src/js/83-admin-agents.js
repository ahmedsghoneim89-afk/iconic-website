/* ---------- Agents: list search/filters (the list itself is in 60-admin.js) and the upload from Excel ----------
   The file is read and checked by the server (/agents-import); this page only picks the file, shows what would happen, and asks for the save. */
Object.assign(AD.en, {
  'ag.manager': 'Team manager', 'ag.managerHint': 'Managers are shown first on the website. The rest of the team opens with the "Show the whole team" button.', 'ag.mgrBadge': 'Manager',
  'ag.search': 'Search name, phone or email', 'ag.kind': 'Role in the team', 'ag.kindAll': 'Everyone', 'ag.kindMgr': 'Managers only', 'ag.kindStaff': 'Not managers',
  'ag.miss': 'Details', 'ag.missAny': 'Any details', 'ag.missPhoto': 'No photo', 'ag.missUnits': 'No units',
  'ag.countAll': '{n} people', 'ag.countOf': '{n} of {all} people', 'ag.noMatch': 'Nobody matches this search.', 'ag.pages': 'Pages', 'ag.prev': 'Previous', 'ag.next': 'Next', 'ag.page': 'Page {p} of {n}',
  'ag.import': 'Upload from Excel',
  'ai.title': 'Upload agents from Excel', 'ai.lead': 'Add or update many people at once from an Excel (.xlsx) or CSV file.',
  'ai.how': 'How it works', 'ai.h1': 'The first row of the file holds the column names. Download the template to start from the right columns.',
  'ai.h2': 'A person who is already on the site (same WhatsApp number or email) is updated, not added twice. Photos and anything the file leaves empty stay as they are.',
  'ai.h3': 'Photos are added afterwards from each person\'s page.',
  'ai.cols': 'Columns', 'ai.colTeam': 'team (required): one of the team names below', 'ai.colName': 'name_ar and name_en (at least one)', 'ai.colRole': 'role_ar and role_en: the job title',
  'ai.colMgr': 'manager: yes or no. Managers are shown first on the website', 'ai.colContact': 'whatsapp, phone, email', 'ai.colOrder': 'order: a number, to sort people inside the team (optional)',
  'ai.teams': 'Team names you can use', 'ai.noTeams': 'There are no teams yet. Add a team first.',
  'ai.template': 'Download the template', 'ai.pick': 'Choose a file', 'ai.another': 'Choose another file', 'ai.checking': 'Checking the file…', 'ai.file': 'File: {name}',
  'ai.sum': '{c} new, {u} updated, {e} with problems', 'ai.sumOk': 'Ready: {c} new and {u} updated.', 'ai.skipNote': 'Rows with problems are skipped. Fix them in the file and upload it again, or import the good rows now.',
  'ai.go': 'Import {n} people', 'ai.going': 'Importing…', 'ai.rowsHead': 'Rows', 'ai.row': 'Row {n}', 'ai.more': '…and {n} more rows', 'ai.new': 'New', 'ai.upd': 'Update', 'ai.prob': 'Problem', 'ai.noName': '(no name)',
  'ai.ignored': 'Columns not used: {list}', 'ai.done': 'Done: {c} added, {u} updated, {s} skipped.', 'ai.backList': 'Back to the agents', 'ai.skipped': 'Skipped rows',
  'ai.f.file_unreadable': 'The file could not be read. Save it again as .xlsx or .csv and try again.', 'ai.f.file_empty': 'The file is empty.', 'ai.f.file_no_rows': 'The file has the column names but no people under them.',
  'ai.f.file_old_excel': 'This is an old Excel file (.xls). Open it in Excel and use Save As, then choose .xlsx.', 'ai.f.col_team': 'The file needs a "team" column.', 'ai.f.col_name': 'The file needs a name column (name_ar or name_en).',
  'ai.f.too_many': 'The file has more than 1000 rows. Split it into two files.', 'ai.f.file_too_big': 'The file is too big.', 'ai.f.413': 'The file is bigger than 5 MB.', 'ai.f.other': 'The file could not be checked. Try again in a moment.',
  'ai.e.team_missing': 'No team', 'ai.e.team_unknown': 'Team not found', 'ai.e.team_ambiguous': 'Two teams have this name', 'ai.e.name_missing': 'No name', 'ai.e.whatsapp_bad': 'WhatsApp number is not valid', 'ai.e.phone_bad': 'Phone number is not valid',
  'ai.e.email_bad': 'Email is not valid', 'ai.e.order_bad': 'Order must be a number', 'ai.e.manager_bad': 'Manager: write yes or no', 'ai.e.id_unknown': 'This id is not on the site', 'ai.e.dup_in_file': 'The same person is twice in the file', 'ai.e.invalid': 'A value is too long or not valid'
});
Object.assign(AD.ar, {
  'ag.manager': 'مدير فريق', 'ag.managerHint': 'يظهر المديرون أولًا في الموقع، وباقي الفريق يظهر بزر «إظهار كل الفريق».', 'ag.mgrBadge': 'مدير',
  'ag.search': 'ابحث بالاسم أو الهاتف أو البريد', 'ag.kind': 'الدور في الفريق', 'ag.kindAll': 'الجميع', 'ag.kindMgr': 'المديرون فقط', 'ag.kindStaff': 'غير المديرين',
  'ag.miss': 'البيانات', 'ag.missAny': 'كل الحالات', 'ag.missPhoto': 'بدون صورة', 'ag.missUnits': 'بدون وحدات',
  'ag.countAll': '{n} شخص', 'ag.countOf': '{n} من {all} شخص', 'ag.noMatch': 'لا يوجد أحد يطابق هذا البحث.', 'ag.pages': 'الصفحات', 'ag.prev': 'السابق', 'ag.next': 'التالي', 'ag.page': 'صفحة {p} من {n}',
  'ag.import': 'رفع من Excel',
  'ai.title': 'رفع الوكلاء من Excel', 'ai.lead': 'أضف أو حدّث عددًا كبيرًا من الأشخاص دفعة واحدة من ملف Excel (.xlsx) أو CSV.',
  'ai.how': 'طريقة العمل', 'ai.h1': 'الصف الأول في الملف فيه أسماء الأعمدة. حمّل النموذج لتبدأ بالأعمدة الصحيحة.',
  'ai.h2': 'من هو موجود بالفعل في الموقع (نفس رقم الواتساب أو البريد) يُحدَّث ولا يُضاف مرتين. الصور وأي خانة يتركها الملف فارغة تبقى كما هي.',
  'ai.h3': 'الصور تُضاف بعد ذلك من صفحة كل شخص.',
  'ai.cols': 'الأعمدة', 'ai.colTeam': 'team (مطلوب): اسم فريق من الأسماء بالأسفل', 'ai.colName': 'name_ar و name_en (واحد على الأقل)', 'ai.colRole': 'role_ar و role_en: المسمى الوظيفي',
  'ai.colMgr': 'manager: yes أو no (نعم أو لا). المديرون يظهرون أولًا في الموقع', 'ai.colContact': 'whatsapp و phone و email', 'ai.colOrder': 'order: رقم لترتيب الأشخاص داخل الفريق (اختياري)',
  'ai.teams': 'أسماء الفرق التي يمكن استخدامها', 'ai.noTeams': 'لا توجد فرق بعد. أضف فريقًا أولًا.',
  'ai.template': 'تحميل النموذج', 'ai.pick': 'اختيار ملف', 'ai.another': 'اختيار ملف آخر', 'ai.checking': 'جارٍ فحص الملف…', 'ai.file': 'الملف: {name}',
  'ai.sum': '{c} جديد، {u} تحديث، {e} فيهم مشاكل', 'ai.sumOk': 'جاهز: {c} جديد و{u} تحديث.', 'ai.skipNote': 'الصفوف التي فيها مشاكل ستُتخطّى. أصلحها في الملف وارفعه من جديد، أو استورد الصفوف السليمة الآن.',
  'ai.go': 'استيراد {n} شخص', 'ai.going': 'جارٍ الاستيراد…', 'ai.rowsHead': 'الصفوف', 'ai.row': 'صف {n}', 'ai.more': '…و{n} صف آخر', 'ai.new': 'جديد', 'ai.upd': 'تحديث', 'ai.prob': 'مشكلة', 'ai.noName': '(بدون اسم)',
  'ai.ignored': 'أعمدة لم تُستخدم: {list}', 'ai.done': 'تم: أُضيف {c} وحُدّث {u} وتُخطّي {s}.', 'ai.backList': 'العودة إلى الوكلاء', 'ai.skipped': 'الصفوف المتخطّاة',
  'ai.f.file_unreadable': 'تعذّرت قراءة الملف. احفظه من جديد بصيغة .xlsx أو .csv وحاول مرة أخرى.', 'ai.f.file_empty': 'الملف فارغ.', 'ai.f.file_no_rows': 'الملف فيه أسماء الأعمدة لكن لا يوجد أشخاص تحتها.',
  'ai.f.file_old_excel': 'هذا ملف Excel قديم (.xls). افتحه في Excel واختر «حفظ باسم» ثم صيغة .xlsx.', 'ai.f.col_team': 'الملف يحتاج عمود اسمه team.', 'ai.f.col_name': 'الملف يحتاج عمود اسم (name_ar أو name_en).',
  'ai.f.too_many': 'الملف فيه أكثر من 1000 صف. قسّمه إلى ملفين.', 'ai.f.file_too_big': 'الملف كبير جدًا.', 'ai.f.413': 'الملف أكبر من 5 ميجا.', 'ai.f.other': 'تعذّر فحص الملف. حاول مرة أخرى بعد لحظات.',
  'ai.e.team_missing': 'بدون فريق', 'ai.e.team_unknown': 'الفريق غير موجود', 'ai.e.team_ambiguous': 'فريقان بنفس الاسم', 'ai.e.name_missing': 'بدون اسم', 'ai.e.whatsapp_bad': 'رقم الواتساب غير صحيح', 'ai.e.phone_bad': 'رقم الهاتف غير صحيح',
  'ai.e.email_bad': 'البريد غير صحيح', 'ai.e.order_bad': 'الترتيب يجب أن يكون رقمًا', 'ai.e.manager_bad': 'مدير: اكتب نعم أو لا', 'ai.e.id_unknown': 'هذا المعرّف غير موجود في الموقع', 'ai.e.dup_in_file': 'نفس الشخص مكرر في الملف', 'ai.e.invalid': 'قيمة طويلة جدًا أو غير صحيحة'
});

let AI = { phase: 'pick', name: '', file: null, prev: null, result: null, err: '', busy: false };
const AI_COLS = ['team', 'name_ar', 'name_en', 'role_ar', 'role_en', 'manager', 'whatsapp', 'phone', 'email', 'order'];
function aiTemplate() {
  const csv = '﻿' + AI_COLS.join(',') + '\r\n';
  const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = doc.createElement('a'); a.href = u; a.download = 'agents-template.csv'; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
const aiFileErr = (e) => ta(e && e.code === 413 ? 'ai.f.413' : 'ai.f.' + ((e && e.serverMessage) || 'other')) || ta('ai.f.other');
async function aiCheck(file) {
  AI = { phase: 'checking', name: file.name, file, prev: null, result: null, err: '', busy: true }; drawAdmin();
  try { AI.prev = await Store.rest.call('POST', '/agents-import', undefined, { type: 'application/octet-stream', body: file }); AI.phase = 'preview'; }
  catch (e) { console.warn(e); AI.phase = 'pick'; AI.err = aiFileErr(e); }
  AI.busy = false; if (AS.open && AS.form && AS.form.kind === 'agent-import') drawAdmin();
}
async function aiApply() {
  if (AI.busy || !AI.file) return; AI.busy = true; drawAdmin();
  try { AI.result = await Store.rest.call('POST', '/agents-import?apply=1', undefined, { type: 'application/octet-stream', body: AI.file }); AI.phase = 'done'; Store.rest.refresh(); }
  catch (e) { console.warn(e); AI.err = aiFileErr(e); AI.phase = 'pick'; }
  AI.busy = false; if (AS.open && AS.form && AS.form.kind === 'agent-import') drawAdmin();
}
function viewAgentsImport() {
  if (AS.form && AS.form.fresh) { AI = { phase: 'pick', name: '', file: null, prev: null, result: null, err: '', busy: false }; AS.form.fresh = false; }
  const R = Store.raw, back = () => { AS.form = null; drawAdmin(); };
  const pick = h('input', { type: 'file', class: 'ai__file', accept: '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'aria-label': ta('ai.pick'), onchange: (e) => { const f = e.target.files && e.target.files[0]; if (f) aiCheck(f); } });
  const chooseBtn = (label) => h('button', { type: 'button', class: 'btn btn--small' + (AI.phase === 'pick' ? ' btn--primary' : ''), disabled: AI.busy, onclick: () => pick.click(), text: label });
  const head = h('header', { class: 'adm__head' }, h('div', null, h('button', { type: 'button', class: 'adm__link', onclick: back, text: '‹ ' + ta('back') }), h('h2', { text: ta('ai.title') }), h('p', { class: 'note', text: ta('ai.lead') })));
  const teamsNow = R.teams.map((tm) => h('li', { class: 'ai__chip', text: nameOf(tm.name) }));
  const help = h('section', { class: 'adm__card ai__help' }, h('h3', { class: 'ls__h', text: ta('ai.how') }),
    h('ul', { class: 'ai__ul' }, h('li', { text: ta('ai.h1') }), h('li', { text: ta('ai.h2') }), h('li', { text: ta('ai.h3') })),
    h('h3', { class: 'ls__h', text: ta('ai.cols') }),
    h('ul', { class: 'ai__ul', dir: 'auto' }, ['ai.colTeam', 'ai.colName', 'ai.colRole', 'ai.colMgr', 'ai.colContact', 'ai.colOrder'].map((k) => h('li', { text: ta(k) }))),
    h('h3', { class: 'ls__h', text: ta('ai.teams') }), teamsNow.length ? h('ul', { class: 'ai__chips' }, teamsNow) : h('p', { class: 'note', text: ta('ai.noTeams') }));
  const tools = h('div', { class: 'adm__row ai__tools' }, h('button', { type: 'button', class: 'btn btn--small', onclick: aiTemplate, text: ta('ai.template') }), AI.phase === 'checking' || AI.phase === 'done' ? null : chooseBtn(AI.phase === 'preview' ? ta('ai.another') : ta('ai.pick')), pick);
  let body = null;
  if (AI.err) body = h('p', { class: 'af__e ai__err', role: 'alert', text: AI.err });
  if (AI.phase === 'checking') body = h('p', { class: 'note', role: 'status', text: ta('ai.checking') });
  if (AI.phase === 'preview' && AI.prev) {
    const P = AI.prev, good = P.counts.create + P.counts.update, rows = P.rows.slice().sort((a, b) => (b.errors.length ? 1 : 0) - (a.errors.length ? 1 : 0) || a.row - b.row), cap = 300;
    const li = (r) => h('li', { class: 'ai__row', 'data-state': r.errors.length ? 'bad' : r.action },
      h('span', { class: 'ai__n', text: ta('ai.row', { n: fmtNum(r.row) }) }), h('strong', { text: r.name || ta('ai.noName') }), h('span', { class: 'note', text: r.team || '' }),
      h('span', { class: 'ai__st', text: r.errors.length ? ta('ai.prob') : ta(r.action === 'create' ? 'ai.new' : 'ai.upd') }),
      r.errors.length ? h('span', { class: 'ai__why', text: r.errors.map((c) => ta('ai.e.' + c) + (c === 'team_unknown' && r.team ? ': ' + r.team : '')).join(' · ') }) : null);
    body = h('section', { class: 'adm__card ai__prev', 'aria-live': 'polite' }, h('p', { class: 'ai__file-name', text: ta('ai.file', { name: AI.name }) }),
      h('p', { class: 'ai__sum', text: P.counts.error ? ta('ai.sum', { c: fmtNum(P.counts.create), u: fmtNum(P.counts.update), e: fmtNum(P.counts.error) }) : ta('ai.sumOk', { c: fmtNum(P.counts.create), u: fmtNum(P.counts.update) }) }),
      P.columns.ignored.length ? h('p', { class: 'note', dir: 'auto', text: ta('ai.ignored', { list: P.columns.ignored.join(', ') }) }) : null,
      P.counts.error ? h('p', { class: 'note', text: ta('ai.skipNote') }) : null,
      h('h3', { class: 'ls__h', text: ta('ai.rowsHead') }), h('ul', { class: 'ai__rows' }, rows.slice(0, cap).map(li)), rows.length > cap ? h('p', { class: 'note', text: ta('ai.more', { n: fmtNum(rows.length - cap) }) }) : null,
      h('div', { class: 'adm__row adm__row--end' }, h('button', { type: 'button', class: 'btn btn--small btn--primary', disabled: !good || AI.busy, onclick: aiApply, text: AI.busy ? ta('ai.going') : ta('ai.go', { n: fmtNum(good) }) })));
  }
  if (AI.phase === 'done' && AI.result) {
    const D = AI.result;
    body = h('section', { class: 'adm__card ai__prev', role: 'status' }, h('p', { class: 'ai__sum', text: ta('ai.done', { c: fmtNum(D.created), u: fmtNum(D.updated), s: fmtNum(D.skipped) }) }),
      D.errors.length ? [h('h3', { class: 'ls__h', text: ta('ai.skipped') }), h('ul', { class: 'ai__rows' }, D.errors.map((r) => h('li', { class: 'ai__row', 'data-state': 'bad' }, h('span', { class: 'ai__n', text: ta('ai.row', { n: fmtNum(r.row) }) }), h('strong', { text: r.name || ta('ai.noName') }), h('span', { class: 'ai__why', text: r.errors.map((c) => ta('ai.e.' + c)).join(' · ') }))))] : null,
      h('div', { class: 'adm__row adm__row--end' }, h('button', { type: 'button', class: 'btn btn--small btn--primary', onclick: back, text: ta('ai.backList') })));
  }
  return h('div', { class: 'ai' }, head, help, tools, body);
}
