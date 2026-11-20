/* ---------- Lists: the drop-down choices the company controls ----------
   Unit types and purposes. What is saved here is what the add-unit form, the property filter and the "Sell your unit" form offer.
   A choice that units or requests still use cannot be removed: hide it, and old records keep reading correctly. */
Object.assign(AD.en, {
  'nav.lists': 'Lists',
  'ls.title': 'Lists and choices', 'ls.lead': 'Control the choices people pick from. A new choice appears when you add a unit, in the property filter and, for unit types, in the "Sell your unit" form.',
  'ls.types': 'Unit types', 'ls.purposes': 'Purposes',
  'ls.typesHint': 'For example Residential, Commercial or Medical. Add one and it is offered everywhere straight away.',
  'ls.purposesHint': 'Used on units and in the property filter. The "Sell your unit" form always offers sell or rent out.',
  'ls.en': 'Name in English', 'ls.ar': 'Name in Arabic', 'ls.addType': 'Add a type', 'ls.addPurpose': 'Add a purpose',
  'ls.up': 'Move up', 'ls.down': 'Move down', 'ls.shown': 'Shown', 'ls.hide': 'Hidden', 'ls.remove': 'Remove',
  'ls.used': 'Used by {n} unit(s)', 'ls.unused': 'Not used yet', 'ls.hiddenNote': 'Hidden: not offered for new units or in the filter. Existing units keep it.',
  'ls.save': 'Save lists', 'ls.saved': 'Lists saved', 'ls.discard': 'Discard changes',
  'ls.err.name': 'Write a name in English or Arabic.', 'ls.err.none': 'Keep at least one choice shown.',
  'ls.err.in_use': '"{name}" is still used by {n} unit(s) or request(s), so it cannot be removed. Hide it instead.', 'ls.err.save': 'The lists could not be saved. Try again in a moment.',
  'ls.new': 'New choice'
});
Object.assign(AD.ar, {
  'nav.lists': 'القوائم',
  'ls.title': 'القوائم والاختيارات', 'ls.lead': 'تحكّم في الاختيارات التي يختار منها الناس. أي اختيار جديد يظهر عند إضافة وحدة وفي فلتر العقارات، وأنواع الوحدات تظهر أيضًا في نموذج «بيع وحدتك».',
  'ls.types': 'أنواع الوحدات', 'ls.purposes': 'الغرض',
  'ls.typesHint': 'مثل سكني أو تجاري أو طبي. أضف نوعًا فيظهر في كل مكان فورًا.',
  'ls.purposesHint': 'يُستخدم في الوحدات وفي فلتر العقارات. نموذج «بيع وحدتك» يعرض دائمًا بيع أو إيجار.',
  'ls.en': 'الاسم بالإنجليزية', 'ls.ar': 'الاسم بالعربية', 'ls.addType': 'إضافة نوع', 'ls.addPurpose': 'إضافة غرض',
  'ls.up': 'تحريك لأعلى', 'ls.down': 'تحريك لأسفل', 'ls.shown': 'ظاهر', 'ls.hide': 'مخفي', 'ls.remove': 'حذف',
  'ls.used': 'مستخدم في {n} وحدة', 'ls.unused': 'غير مستخدم بعد', 'ls.hiddenNote': 'مخفي: لا يظهر للوحدات الجديدة ولا في الفلتر. الوحدات الحالية تحتفظ به.',
  'ls.save': 'حفظ القوائم', 'ls.saved': 'تم حفظ القوائم', 'ls.discard': 'تجاهل التعديلات',
  'ls.err.name': 'اكتب اسمًا بالإنجليزية أو بالعربية.', 'ls.err.none': 'أبقِ اختيارًا واحدًا على الأقل ظاهرًا.',
  'ls.err.in_use': '«{name}» ما زال مستخدمًا في {n} وحدة أو طلب، فلا يمكن حذفه. أخفِه بدلًا من ذلك.', 'ls.err.save': 'تعذّر حفظ القوائم. حاول مرة أخرى بعد لحظات.',
  'ls.new': 'اختيار جديد'
});

/* the draft being edited: { types: [{id, en, ar, active, isNew}], purposes: [...] } */
const lsBase = (kind) => {
  const saved = Store.raw.lists && Array.isArray(Store.raw.lists[kind]) && Store.raw.lists[kind].length ? Store.raw.lists[kind] : null;
  return saved ? saved.map((x) => ({ id: x.id, en: x.en || '', ar: x.ar || '', active: x.active !== false })) : DEFAULT_LISTS[kind].map(([id, l]) => ({ id, en: l.en, ar: l.ar, active: true }));
};
const lsUsage = (kind) => { const f = kind === 'types' ? 'type' : 'purpose', m = new Map(); Store.raw.properties.forEach((p) => { if (p[f]) m.set(p[f], (m.get(p[f]) || 0) + 1); }); return m; };
const lsSlug = (name, taken) => {
  const base = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'choice';
  let id = base, n = 2; while (taken.has(id)) id = base + '-' + n++; return id;
};

function viewLists() {
  if (!AS.lists) AS.lists = { types: lsBase('types'), purposes: lsBase('purposes') };
  const D = AS.lists, status = h('p', { class: 'adm__status', role: 'status' }), usage = { types: lsUsage('types'), purposes: lsUsage('purposes') };
  const touch = () => { AS.dirty = true; status.textContent = ''; };
  const wrap = h('div', { class: 'ls' });
  const card = (kind) => {
    const list = D[kind], box = h('section', { class: 'adm__card ls__card', 'aria-labelledby': 'ls-h-' + kind });
    const draw = () => {
      box.textContent = '';
      const rows = list.map((x, i) => {
        const used = x.isNew ? 0 : (usage[kind].get(x.id) || 0);
        const mk = (lang) => h('input', { class: 'ai', type: 'text', value: x[lang], maxlength: 60, dir: lang === 'ar' ? 'rtl' : 'ltr', 'aria-label': ta('ls.' + lang) + ' ' + (i + 1), placeholder: ta('ls.' + lang),
          oninput: (e) => { x[lang] = e.target.value; touch(); } });
        const move = (d) => { const j = i + d; if (j < 0 || j >= list.length) return; list.splice(i, 1); list.splice(j, 0, x); touch(); draw(); };
        const shown = h('input', { type: 'checkbox', checked: x.active, onchange: (e) => { x.active = e.target.checked; touch(); draw(); } });
        const rm = h('button', { type: 'button', class: 'adm__link adm__link--bad', disabled: used > 0, title: used > 0 ? ta('ls.used', { n: fmtNum(used) }) : '', text: ta('ls.remove'),
          onclick: () => { list.splice(i, 1); touch(); draw(); } });
        return h('li', { class: 'ls__row' + (x.active ? '' : ' is-off') },
          h('div', { class: 'ls__move' },
            h('button', { type: 'button', class: 'ls__arrow', disabled: i === 0, 'aria-label': ta('ls.up'), title: ta('ls.up'), onclick: () => move(-1), text: '↑' }),
            h('button', { type: 'button', class: 'ls__arrow', disabled: i === list.length - 1, 'aria-label': ta('ls.down'), title: ta('ls.down'), onclick: () => move(1), text: '↓' })),
          h('div', { class: 'ls__names' }, mk('en'), mk('ar')),
          h('label', { class: 'af__check ls__show' }, shown, h('span', { text: x.active ? ta('ls.shown') : ta('ls.hide') })),
          h('span', { class: 'note ls__used', text: used > 0 ? ta('ls.used', { n: fmtNum(used) }) : ta('ls.unused') }),
          rm);
      });
      box.append(h('h3', { class: 'ls__h', id: 'ls-h-' + kind, text: ta('ls.' + kind) }), h('p', { class: 'note', text: ta('ls.' + kind + 'Hint') }),
        h('ul', { class: 'ls__list' }, rows),
        list.some((x) => !x.active) ? h('p', { class: 'note ls__hidden', text: ta('ls.hiddenNote') }) : null,
        h('div', { class: 'adm__row' }, h('button', { type: 'button', class: 'btn btn--small', text: '+ ' + ta(kind === 'types' ? 'ls.addType' : 'ls.addPurpose'),
          onclick: () => { list.push({ id: '', en: '', ar: '', active: true, isNew: true }); touch(); draw(); const last = $$('.ls__row:last-child .ai', box)[0]; if (last) last.focus(); } })));
    };
    draw(); return box;
  };
  wrap.append(card('types'), card('purposes'));
  const save = h('button', { type: 'button', class: 'btn btn--small btn--primary', text: ta('ls.save'), onclick: async () => {
    status.textContent = '';
    const out = {};
    for (const kind of ['types', 'purposes']) {
      const taken = new Set(D[kind].filter((x) => !x.isNew).map((x) => x.id)), items = [];
      for (const x of D[kind]) {
        const en = (x.en || '').trim(), ar = (x.ar || '').trim();
        if (!en && !ar) { status.textContent = ta('ls.err.name'); return; }
        let id = x.id; if (x.isNew || !id) { id = lsSlug(en, taken); taken.add(id); }
        items.push({ id, en, ar, active: x.active });
      }
      if (!items.some((x) => x.active)) { status.textContent = ta('ls.err.none'); return; }
      out[kind] = items;
    }
    save.disabled = true; save.textContent = ta('f.saving');
    try { await dbSet('site', 'lists', out); Store.raw.lists = out; applyLists(out); AS.lists = null; AS.dirty = false; toast(ta('ls.saved')); drawAdmin(); }
    catch (e) {
      console.warn(e); save.disabled = false; save.textContent = ta('ls.save');
      const m = /^in_use:(types|purposes):([^:]+):(\d+)$/.exec((e && e.serverMessage) || '');
      if (m) { const hit = D[m[1]].find((x) => x.id === m[2]); status.textContent = ta('ls.err.in_use', { name: (hit && (App.lang === 'ar' ? hit.ar || hit.en : hit.en || hit.ar)) || m[2], n: fmtNum(Number(m[3])) }); } else status.textContent = ta('ls.err.save');
    }
  } });
  const discard = h('button', { type: 'button', class: 'adm__link', text: ta('ls.discard'), onclick: () => { AS.lists = null; AS.dirty = false; drawAdmin(); } });
  return h('div', null, sectionHead(ta('ls.title'), ta('ls.lead')), wrap, h('div', { class: 'adm__row adm__row--end ls__bar' }, status, h('span', { class: 'adm__grow' }), discard, save));
}
if (SERVER) { VIEWS.lists = viewLists; [ROLE_SECTIONS.admin, ROLE_SECTIONS.editor].forEach((a) => { const i = a.indexOf('units'); a.splice(i < 0 ? a.length : i + 1, 0, 'lists'); }); }
