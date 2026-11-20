/* ---------- Dashboard sidebar: the tabs in groups ----------
   Twenty-odd tabs in one long list are hard to scan, so they sit under short headings. A tab that is in no group is never lost: it is added to the last one. */
Object.assign(AD.en, { 'navg.inbox': 'Inbox', 'navg.site': 'Website', 'navg.people': 'People', 'navg.data': 'Properties', 'navg.system': 'Settings' });
Object.assign(AD.ar, { 'navg.inbox': 'الوارد', 'navg.site': 'الموقع', 'navg.people': 'الفريق', 'navg.data': 'العقارات', 'navg.system': 'الإعدادات' });
const NAV_GROUPS = [
  ['', ['overview']],
  ['inbox', ['leads', 'sell', 'applications']],
  ['site', ['texts', 'skyline', 'about', 'company', 'branches']],
  ['people', ['teams', 'agents', 'jobs']],
  ['data', ['catalog', 'units', 'lists']],
  ['system', ['seo', 'email', 'users', 'backup', 'account']]
];
function buildNav(onPick) {
  const groups = NAV_GROUPS.map(([id, list]) => [id, list.filter((s) => SECTIONS.includes(s))]);
  const placed = new Set(groups.flatMap((g) => g[1])), spare = SECTIONS.filter((s) => !placed.has(s));
  if (spare.length) groups[groups.length - 1][1].push(...spare);
  return h('nav', { class: 'adm__nav', 'aria-label': 'Dashboard' }, groups.filter((g) => g[1].length).map(([id, list]) => h('div', { class: 'adm__group', role: 'group', 'data-group': id || 'top' },
    id ? h('p', { class: 'adm__gh', 'data-g': id, 'aria-hidden': 'true' }) : null,
    list.map((s) => h('button', { type: 'button', 'data-sec': s, onclick: () => onPick(s) })))));
}
function paintNavGroups(root) { $$('.adm__gh', root).forEach((p) => { p.textContent = ta('navg.' + p.dataset.g); }); $$('.adm__group[data-group]', root).forEach((g) => { const id = g.dataset.group; if (id !== 'top') g.setAttribute('aria-label', ta('navg.' + id)); }); }
