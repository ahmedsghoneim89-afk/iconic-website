/* ---------- Company email ----------
   The mailbox the site sends its team notices from, and who receives them. Admin only. The server keeps the password sealed and never sends it back:
   an empty password box means "keep the one saved". */
Object.assign(AD.en, {
  'nav.email': 'Company email',
  'em.title': 'Company email', 'em.lead': 'Set the mailbox the site sends notices from, and who receives them. New enquiries, sell requests and job applications are emailed as soon as they arrive.',
  'em.loading': 'Loading the email settings…', 'em.loadErr': 'The email settings could not be loaded. Try again in a moment.',
  'em.s.notices': 'Notices', 'em.enabled': 'Send email notices', 'em.enabledHint': 'Turn this off to stop all emails without losing the settings.',
  'em.recipients': 'Who receives them', 'em.recipientsHint': 'One email address per line, up to 10.',
  'em.events': 'Send an email for', 'em.ev.leads': 'New enquiries and viewing requests', 'em.ev.sell': 'Sell your unit requests', 'em.ev.applications': 'Job applications',
  'em.lang': 'Language of the emails', 'em.lang.ar': 'Arabic', 'em.lang.en': 'English',
  'em.s.mailbox': 'Sending mailbox', 'em.preset': 'Mail provider', 'em.preset.other': 'Other', 'em.preset.hint': 'Fills in the server, port and security for you. You still enter the mailbox and password.',
  'em.fromName': 'Sender name', 'em.fromNameHint': 'Shown to the people who receive the email.', 'em.fromEmail': 'Sender email', 'em.fromEmailHint': 'Usually the same address you log in with.', 'em.replyTo': 'Reply-to (optional)',
  'em.host': 'Mail server', 'em.port': 'Port', 'em.security': 'Security', 'em.sec.ssl': 'SSL / TLS (usually port 465)', 'em.sec.starttls': 'STARTTLS (usually port 587)', 'em.sec.none': 'None',
  'em.user': 'Username', 'em.userHint': 'Usually the full email address. Leave empty if the server needs no login.', 'em.password': 'Password', 'em.passwordSet': 'A password is saved. Leave this empty to keep it.', 'em.passwordHint': 'If the mailbox uses two-step verification, create an app password and enter it here.',
  'em.clearPw': 'Remove the saved password', 'em.pwCleared': 'The saved password will be removed when you save.',
  'em.save': 'Save settings', 'em.saved': 'Email settings saved', 'em.test': 'Send a test email', 'em.testing': 'Sending…', 'em.testOk': 'Test email sent to {to}. Check the inbox (and the spam folder).',
  'em.s.status': 'Status', 'em.lastOk': 'Last email sent', 'em.lastErr': 'Last problem', 'em.never': 'Nothing yet', 'em.counts': '{sent} sent, {failed} failed since the site last started',
  'em.v.host': 'Enter the mail server name, for example smtp.gmail.com.', 'em.v.port': 'Enter a mail port: 465, 587, 25 or 2525.', 'em.v.security': 'Choose the security type.', 'em.v.from': 'Enter a valid sender email address.',
  'em.v.replyTo': 'The reply-to address is not valid.', 'em.v.recipients': 'Enter one to ten valid email addresses, one per line.', 'em.v.password': 'Enter the password, or empty the username.', 'em.v.saveFail': 'The settings could not be saved. Try again in a moment.',
  'em.err.auth': 'The mail server did not accept the username or password. Check them, or use an app password.',
  'em.err.connect': 'Could not reach the mail server. Check the server name, the port and the security type.',
  'em.err.dns': 'The mail server name was not found. Check it for typing mistakes.',
  'em.err.tls': 'The secure connection failed. Port 465 usually needs SSL / TLS and port 587 usually needs STARTTLS.',
  'em.err.timeout': 'The mail server took too long to answer.', 'em.err.sender': 'The mail server refused the sender address. It must belong to this mailbox.',
  'em.err.recipient': 'No recipient address was accepted. Check the addresses.', 'em.err.rejected': 'The mail server refused the message.', 'em.err.temporary': 'The mail server is busy. Try again in a moment.',
  'em.err.blocked': 'That server address is not allowed.', 'em.err.incomplete': 'Enter the mail server and the sender email first.', 'em.err.recipients': 'Add at least one recipient first.', 'em.err.throttled': 'Too many emails in the last hour.', 'em.err.error': 'The email could not be sent.',
  'em.err.wait': 'Wait a few seconds and try again.'
});
Object.assign(AD.ar, {
  'nav.email': 'بريد الشركة',
  'em.title': 'بريد الشركة', 'em.lead': 'حدّد صندوق البريد الذي يرسل منه الموقع الإشعارات، ومن يستلمها. الاستفسارات وطلبات بيع الوحدات وطلبات التوظيف تصل بالبريد فور وصولها.',
  'em.loading': 'جارٍ تحميل إعدادات البريد…', 'em.loadErr': 'تعذّر تحميل إعدادات البريد. حاول مرة أخرى بعد لحظات.',
  'em.s.notices': 'الإشعارات', 'em.enabled': 'إرسال الإشعارات بالبريد', 'em.enabledHint': 'أوقف هذا الخيار لإيقاف كل الرسائل دون فقد الإعدادات.',
  'em.recipients': 'من يستلمها', 'em.recipientsHint': 'عنوان بريد واحد في كل سطر، حتى ١٠ عناوين.',
  'em.events': 'أرسل بريدًا عند', 'em.ev.leads': 'الاستفسارات وطلبات المعاينة الجديدة', 'em.ev.sell': 'طلبات «بيع وحدتك»', 'em.ev.applications': 'طلبات التوظيف',
  'em.lang': 'لغة الرسائل', 'em.lang.ar': 'العربية', 'em.lang.en': 'الإنجليزية',
  'em.s.mailbox': 'صندوق الإرسال', 'em.preset': 'مزوّد البريد', 'em.preset.other': 'غير ذلك', 'em.preset.hint': 'يملأ لك الخادم والمنفذ ونوع التأمين. ما زال عليك إدخال البريد وكلمة المرور.',
  'em.fromName': 'اسم المرسل', 'em.fromNameHint': 'يظهر لمن يستلم الرسالة.', 'em.fromEmail': 'بريد المرسل', 'em.fromEmailHint': 'عادةً هو نفس البريد الذي تسجّل به الدخول.', 'em.replyTo': 'بريد الرد (اختياري)',
  'em.host': 'خادم البريد', 'em.port': 'المنفذ', 'em.security': 'نوع التأمين', 'em.sec.ssl': 'SSL / TLS (غالبًا منفذ 465)', 'em.sec.starttls': 'STARTTLS (غالبًا منفذ 587)', 'em.sec.none': 'بدون',
  'em.user': 'اسم المستخدم', 'em.userHint': 'غالبًا هو البريد كاملًا. اتركه فارغًا إن كان الخادم لا يطلب تسجيل دخول.', 'em.password': 'كلمة المرور', 'em.passwordSet': 'توجد كلمة مرور محفوظة. اترك الخانة فارغة للإبقاء عليها.', 'em.passwordHint': 'إن كان البريد يستخدم التحقق بخطوتين، أنشئ «كلمة مرور تطبيق» وأدخلها هنا.',
  'em.clearPw': 'حذف كلمة المرور المحفوظة', 'em.pwCleared': 'ستُحذف كلمة المرور المحفوظة عند الحفظ.',
  'em.save': 'حفظ الإعدادات', 'em.saved': 'تم حفظ إعدادات البريد', 'em.test': 'إرسال رسالة تجريبية', 'em.testing': 'جارٍ الإرسال…', 'em.testOk': 'أُرسلت الرسالة التجريبية إلى {to}. راجع صندوق الوارد (وبريد السبام).',
  'em.s.status': 'الحالة', 'em.lastOk': 'آخر رسالة أُرسلت', 'em.lastErr': 'آخر مشكلة', 'em.never': 'لا شيء بعد', 'em.counts': 'أُرسل {sent} وفشل {failed} منذ آخر تشغيل للموقع',
  'em.v.host': 'اكتب اسم خادم البريد، مثل smtp.gmail.com.', 'em.v.port': 'اكتب منفذ بريد: 465 أو 587 أو 25 أو 2525.', 'em.v.security': 'اختر نوع التأمين.', 'em.v.from': 'اكتب بريد مرسل صحيحًا.',
  'em.v.replyTo': 'بريد الرد غير صحيح.', 'em.v.recipients': 'اكتب من عنوان إلى عشرة عناوين صحيحة، كل عنوان في سطر.', 'em.v.password': 'اكتب كلمة المرور، أو أفرغ اسم المستخدم.', 'em.v.saveFail': 'تعذّر حفظ الإعدادات. حاول مرة أخرى بعد لحظات.',
  'em.err.auth': 'خادم البريد لم يقبل اسم المستخدم أو كلمة المرور. راجعهما، أو استخدم كلمة مرور تطبيق.',
  'em.err.connect': 'تعذّر الوصول إلى خادم البريد. راجع اسم الخادم والمنفذ ونوع التأمين.',
  'em.err.dns': 'لم يُعثر على اسم خادم البريد. راجعه للتأكد من خلوه من أخطاء الكتابة.',
  'em.err.tls': 'فشل الاتصال الآمن. المنفذ 465 يحتاج غالبًا SSL / TLS والمنفذ 587 يحتاج غالبًا STARTTLS.',
  'em.err.timeout': 'تأخّر خادم البريد في الرد.', 'em.err.sender': 'رفض خادم البريد عنوان المرسل. يجب أن يتبع هذا الصندوق.',
  'em.err.recipient': 'لم يُقبل أي عنوان مستلم. راجع العناوين.', 'em.err.rejected': 'رفض خادم البريد الرسالة.', 'em.err.temporary': 'خادم البريد مشغول. حاول مرة أخرى بعد لحظات.',
  'em.err.blocked': 'عنوان الخادم هذا غير مسموح.', 'em.err.incomplete': 'اكتب خادم البريد وبريد المرسل أولًا.', 'em.err.recipients': 'أضف مستلمًا واحدًا على الأقل أولًا.', 'em.err.throttled': 'رسائل كثيرة في آخر ساعة.', 'em.err.error': 'تعذّر إرسال البريد.',
  'em.err.wait': 'انتظر بضع ثوانٍ وحاول مرة أخرى.'
});

const EM = { data: null, loading: null, err: '', clearPw: false };
const EM_PRESETS = { gmail: { host: 'smtp.gmail.com', port: 465, security: 'ssl' }, hostinger: { host: 'smtp.hostinger.com', port: 465, security: 'ssl' }, microsoft: { host: 'smtp.office365.com', port: 587, security: 'starttls' } };
function emLoad() {
  if (EM.loading) return EM.loading;
  EM.loading = Store.rest.call('GET', '/email-settings').then((d) => { EM.data = d; EM.err = ''; }).catch((e) => { console.warn(e); EM.err = ta('em.loadErr'); })
    .finally(() => { EM.loading = null; if (AS.open && AS.sec === 'email' && !AS.dirty) drawAdmin(); });
  return EM.loading;
}
const emWhen = (t) => (t ? new Intl.DateTimeFormat(App.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t)) : ta('em.never'));

function viewEmail() {
  if (!EM.data) { if (!EM.loading) emLoad(); return h('div', null, sectionHead(ta('em.title'), ta('em.lead')), h('p', { class: EM.err ? 'adm__empty' : 'note', text: EM.err || ta('em.loading') })); }
  const D = EM.data, status = h('p', { class: 'adm__status', role: 'status' }), result = h('p', { class: 'em__result', role: 'status' });
  const f = h('form', { class: 'adm__form em', novalidate: true });
  const err = (k) => h('p', { class: 'af__e', 'data-err': k });
  const check = (name, label, on, hint) => h('label', { class: 'af__check' }, h('input', { type: 'checkbox', name, checked: !!on }), h('span', null, label, hint ? h('small', { class: 'af__h', text: hint }) : null));
  const preset = select('preset', [['gmail', 'Gmail / Google Workspace'], ['hostinger', 'Hostinger'], ['microsoft', 'Microsoft 365'], ['other', ta('em.preset.other')]], (Object.keys(EM_PRESETS).find((k) => EM_PRESETS[k].host === D.host)) || 'other');
  preset.addEventListener('change', () => { const p = EM_PRESETS[preset.value]; if (!p) return; f.elements.host.value = p.host; f.elements.port.value = p.port; f.elements.security.value = p.security; AS.dirty = true; });
  const hasPw = D.passwordSet && !EM.clearPw;
  const pw = h('input', { class: 'ai', type: 'password', name: 'password', autocomplete: 'new-password', dir: 'ltr', placeholder: hasPw ? '••••••••' : '' });
  const pwNote = h('div', null, hasPw ? h('small', { class: 'af__h', text: ta('em.passwordSet') }) : (EM.clearPw ? h('small', { class: 'af__h', text: ta('em.pwCleared') }) : h('small', { class: 'af__h', text: ta('em.passwordHint') })),
    D.passwordSet && !EM.clearPw ? h('button', { type: 'button', class: 'adm__link adm__link--bad', text: ta('em.clearPw'), onclick: () => { EM.clearPw = true; AS.dirty = true; const keep = collect(true); EM.data = Object.assign({}, D, keep); drawAdmin(); } }) : null);
  function collect(soft) {
    const v = (n) => (f.elements[n].value || '').trim(), checked = (n) => f.elements[n].checked;
    const out = { enabled: checked('enabled'), host: v('host'), port: Number(v('port')), security: v('security'), user: v('user'), fromName: v('fromName'), fromEmail: v('fromEmail'), replyTo: v('replyTo'), lang: v('lang'), recipients: v('recipients').split(/[\s,;]+/).filter(Boolean),
      events: { leads: checked('ev_leads'), sell: checked('ev_sell'), applications: checked('ev_applications') } };
    if (!soft) { if (pw.value) out.password = pw.value; if (EM.clearPw) out.clearPassword = true; }
    return out;
  }
  const okDd = h('dd'), errDd = h('dd'), countsP = h('p', { class: 'note' });
  const paintStatus = (d) => {
    const st = (d && d.status) || {};
    okDd.textContent = emWhen(st.lastOk);
    errDd.textContent = st.lastError ? emWhen(st.lastErrorAt) + ' · ' + (AD[App.lang]['em.err.' + st.lastError] || st.lastError) : ta('em.never');
    countsP.textContent = ta('em.counts', { sent: fmtNum(st.sent || 0), failed: fmtNum(st.failed || 0) });
  };
  paintStatus(D);
  f.append(
    h('section', { class: 'adm__card em__card' }, h('h3', { class: 'ls__h', text: ta('em.s.notices') }),
      check('enabled', ta('em.enabled'), D.enabled, ta('em.enabledHint')),
      fieldWrap(ta('em.recipients'), h('textarea', { class: 'ai ai--area', name: 'recipients', rows: 3, dir: 'ltr', value: (D.recipients || []).join('\n') }), ta('em.recipientsHint'), err('recipients')),
      h('div', { class: 'af', role: 'group', 'aria-label': ta('em.events') }, h('span', { class: 'af__l', text: ta('em.events') }), h('div', { class: 'em__checks' }, check('ev_leads', ta('em.ev.leads'), D.events && D.events.leads !== false), check('ev_sell', ta('em.ev.sell'), D.events && D.events.sell !== false), check('ev_applications', ta('em.ev.applications'), D.events && D.events.applications !== false))),
      fieldWrap(ta('em.lang'), select('lang', [['ar', ta('em.lang.ar')], ['en', ta('em.lang.en')]], D.lang || 'ar'))),
    h('section', { class: 'adm__card em__card' }, h('h3', { class: 'ls__h', text: ta('em.s.mailbox') }),
      fieldWrap(ta('em.preset'), preset, ta('em.preset.hint')),
      h('div', { class: 'af__pair' }, fieldWrap(ta('em.fromName'), input('fromName', D.fromName), ta('em.fromNameHint')), fieldWrap(ta('em.fromEmail'), input('fromEmail', D.fromEmail, { type: 'email', dir: 'ltr', im: 'email' }), ta('em.fromEmailHint'), err('from'))),
      fieldWrap(ta('em.replyTo'), input('replyTo', D.replyTo, { type: 'email', dir: 'ltr', im: 'email' }), null, err('replyTo')),
      h('div', { class: 'em__server' }, fieldWrap(ta('em.host'), input('host', D.host, { dir: 'ltr', ph: 'smtp.example.com' }), null, err('host')), fieldWrap(ta('em.port'), input('port', D.port, { type: 'number', min: '1', step: '1', im: 'numeric', dir: 'ltr' }), null, err('port')),
        fieldWrap(ta('em.security'), select('security', [['ssl', ta('em.sec.ssl')], ['starttls', ta('em.sec.starttls')], ['none', ta('em.sec.none')]], D.security || 'ssl'), null, err('security'))),
      h('div', { class: 'af__pair' }, fieldWrap(ta('em.user'), input('user', D.user, { dir: 'ltr' }), ta('em.userHint')), fieldWrap(ta('em.password'), pw, null, err('password'))), pwNote),
    h('section', { class: 'adm__card em__card' }, h('h3', { class: 'ls__h', text: ta('em.s.status') }),
      h('dl', { class: 'adm__kvs' }, h('div', { class: 'adm__kv' }, h('dt', { text: ta('em.lastOk') }), okDd), h('div', { class: 'adm__kv' }, h('dt', { text: ta('em.lastErr') }), errDd)), countsP),
    status, result);
  const save = h('button', { type: 'submit', class: 'btn btn--small btn--primary', text: ta('em.save') });
  const testBtn = h('button', { type: 'button', class: 'btn btn--small', text: ta('em.test') });
  f.append(h('div', { class: 'adm__row adm__row--end' }, testBtn, save));
  const clearErrs = () => { f.querySelectorAll('.af__e').forEach((x) => { x.textContent = ''; }); status.textContent = ''; };
  const persist = async () => {
    clearErrs();
    try { const d = await Store.rest.call('PUT', '/email-settings', collect(false)); EM.data = d; EM.clearPw = false; AS.dirty = false; return d; }
    catch (e) {
      const code = (e && e.serverMessage) || ''; const key = { host: 'host', port: 'port', security: 'security', from: 'from', replyTo: 'replyTo', recipients: 'recipients', password: 'password' }[code];
      if (key) { const t = f.querySelector('[data-err="' + key + '"]'); if (t) t.textContent = ta('em.v.' + code); else status.textContent = ta('em.v.' + code); } else status.textContent = ta('em.v.saveFail');
      return null;
    }
  };
  f.addEventListener('input', () => { AS.dirty = true; });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); save.disabled = true; save.textContent = ta('f.saving'); result.textContent = '';
    const d = await persist(); save.disabled = false; save.textContent = ta('em.save');
    if (d) { toast(ta('em.saved')); drawAdmin(); }
  });
  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true; testBtn.textContent = ta('em.testing'); result.textContent = ''; result.dataset.state = '';
    try {
      const d = await persist(); if (!d) return;
      const r = await Store.rest.call('POST', '/email-settings/test');
      result.dataset.state = r.ok ? 'ok' : 'bad'; result.textContent = r.ok ? ta('em.testOk', { to: r.to.join(', ') }) : ta('em.err.' + r.error) || ta('em.err.error');
      EM.data = await Store.rest.call('GET', '/email-settings'); paintStatus(EM.data);
    } catch (e) { result.dataset.state = 'bad'; result.textContent = e && e.code === 429 ? ta('em.err.wait') : ta('em.err.error'); }
    finally { testBtn.disabled = false; testBtn.textContent = ta('em.test'); }
  });
  return h('div', null, sectionHead(ta('em.title'), ta('em.lead')), f);
}
if (SERVER) {
  VIEWS.email = viewEmail;
  const i = ROLE_SECTIONS.admin.indexOf('seo'); ROLE_SECTIONS.admin.splice(i < 0 ? ROLE_SECTIONS.admin.length : i + 1, 0, 'email');
}
