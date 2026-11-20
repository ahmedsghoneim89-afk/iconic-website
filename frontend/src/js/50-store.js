/* ---------- Content store ----------
   The admin dashboard writes company details, teams, agents and units to the artifact database; the site reads them live.
   Where the runtime offers no database (a plain page, or a visitor who is not signed in) none of this runs and the site shows its empty states. */
const Store = { db: null, user: null, assets: null, downloads: null, canEdit: false, live: false, error: '', raw: { company: null, texts: null, hotspots: null, about: null, layout: null, regions: null, lists: null, teams: [], agents: [], properties: [], branches: [], jobs: [] }, off: [] };
const blobUrl = (id) => id ? '/_blob/' + id : '';
const refUrl = (r) => r ? (r.id ? blobUrl(r.id) : (r.url || '')) : '';
const numOrNull = (v) => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
const orderOf = (r) => { const n = numOrNull(r.order); return n == null ? 100 : n; };

function branchFromDoc(r) {
  return { id: r.id, get name() { return L(r.name); }, get city() { return L(r.city); }, get address() { return L(r.address); }, get hours() { return L(r.hours); }, phone: r.phone || '', whatsapp: r.whatsapp || '', map: httpsUrl(r.map || '') };
}
function teamFromDoc(r) { const regions = teamRegions(r); return { id: r.id, region: regions[0] || '', regions, name: r.name || '' }; }
function agentFromDoc(r) { return { id: r.id, team: r.team, name: r.name || '', role: r.role || '', photo: refUrl(r.photo), phone: r.phone || '', whatsapp: r.whatsapp || '', email: r.email || '' }; }
function propFromDoc(r) {
  return {
    id: r.id, slug: r.slug || '', get url() { return SERVER && r.slug ? '/' + App.lang + '/property/' + r.slug : ''; }, region: r.region, agent: r.agent || null, type: r.type, purpose: r.purpose,
    price: numOrNull(r.price), currency: r.currency || 'EGP', beds: numOrNull(r.beds), baths: numOrNull(r.baths),
    get title() { return L(r.title); }, get project() { return L(r.project); }, get location() { return L(r.location); }, get description() { return L(r.description); },
    get area() { const a = numOrNull(r.area); return a ? fmtNum(a) + ' ' + t('unit.sqm') : ''; },
    images: (r.images || []).map(refUrl).filter(Boolean)
  };
}
const replaceAll = (arr, items) => { arr.length = 0; items.forEach((x) => arr.push(x)); };

let applyTimer = 0;
const scheduleApply = () => { clearTimeout(applyTimer); applyTimer = setTimeout(applyContent, 60); };
/* raw documents -> the objects the page draws from. No drawing here, so it can run before the first render. */
function hydrateData() {
  applyLists(Store.raw.lists);
  const R = Store.raw, byOrder = (a, b) => orderOf(a) - orderOf(b) || String(a.id).localeCompare(String(b.id));
  const co = R.company || {};
  DATA.company = { whatsapp: co.whatsapp || null, phone: co.phone || null, email: co.email || null, address: co.address || null, hours: co.hours || null, social: co.social && typeof co.social === 'object' ? co.social : {} };
  DATA.formEndpoint = SERVER ? '/iconic-api/leads' : (httpsUrl(co.formEndpoint) || null);   // production: the server itself stores enquiries
  /* site texts: the shipped copy plus whatever the company has changed. Unknown keys and non-text values are ignored. */
  let textsChanged = false;
  ['en', 'ar'].forEach((lg) => {
    const own = (R.texts && R.texts[lg]) || {}, next = Object.assign({}, I18N_BASE[lg]);
    Object.keys(own).forEach((k) => { if (Object.prototype.hasOwnProperty.call(I18N_BASE[lg], k) && typeof own[k] === 'string' && own[k].trim()) next[k] = own[k]; });
    if (JSON.stringify(next) !== JSON.stringify(I18N[lg])) { I18N[lg] = next; textsChanged = true; }
  });
  Object.keys(DATA.hotspots).forEach((k) => { delete DATA.hotspots[k]; });
  const hsRaw = R.hotspots || {};
  Object.keys(hsRaw).forEach((k) => { const v = hsRaw[k]; if (/^[1-9]\d?$/.test(k) && v && typeof v === 'object' && (L(v.label) || L(v.text) || safeHref(v.href))) DATA.hotspots[k] = v; });
  replaceAll(DATA.pillars, ((R.about && Array.isArray(R.about.pillars)) ? R.about.pillars : []).filter((x) => x && typeof x === 'object' && (x.en || x.ar)));
  DATA.layout = { teams: !(R.layout && R.layout.teams === false), about: !(R.layout && R.layout.about === false) };
  replaceAll(DATA.teams, R.teams.slice().sort(byOrder).map(teamFromDoc));
  replaceAll(DATA.agents, R.agents.slice().sort(byOrder).map(agentFromDoc));
  replaceAll(DATA.properties, R.properties.slice().sort(byOrder).map(propFromDoc));
  replaceAll(DATA.branches, R.branches.slice().sort(byOrder).map(branchFromDoc));
  return textsChanged;
}
function applyContent() {
  const textsChanged = hydrateData();
  if (App.filters.agent && !findAgent(App.filters.agent)) App.filters.agent = null;
  if (textsChanged) applyI18n();
  else {
    renderProps(); renderTeams(); renderContactActions(); renderPillars(); applyLayout();
    if (mgr && mgr.interaction) mgr.interaction.refreshLabels(); if (!mgr && window.__staticIC) window.__staticIC.refreshLabels();
  }
  const d = $('#detail'); if (d && !d.hidden && d._prop) { const cur = DATA.properties.find((x) => x.id === d._prop.id); if (cur) renderDetailAgent(cur); }
  if (hasGSAP()) ScrollTrigger.refresh();
  adminRefresh();
}
function subscribe(ref, key, single) {
  Store.off.push(ref.onSnapshot((snap) => {
    Store.raw[key] = single ? (snap.exists ? Object.assign({}, snap.data()) : null) : snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    Store.live = true; Store.error = ''; scheduleApply();
  }, (e) => { Store.error = (e && e.code) || 'error'; adminRefresh(); }));
}
/* production: the server sends every document inside the page, so the first render already has the real content */
function seedServerContent() {
  const D = SERVER.data || {};
  ['company', 'texts', 'hotspots', 'about', 'layout', 'lists'].forEach((k) => { Store.raw[k] = D[k] || null; });
  ['teams', 'agents', 'properties', 'branches'].forEach((k) => { Store.raw[k] = Array.isArray(D[k]) ? D[k] : []; });
  Store.live = true; hydrateData();
}
async function enableServerAdmin() {
  try {
    const me = await (await fetch('/iconic-api/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })).json();
    if (!me || !me.admin) return;
    const rest = restClient(me.csrf);
    Store.db = rest.db; Store.user = { canEdit: async () => true }; Store.canEdit = true; Store.assets = rest.assets; Store.downloads = rest.downloads; Store.me = me; Store.rest = rest; applyRoleSections();
    ['company', 'texts', 'hotspots', 'about', 'layout', 'regions', 'lists'].forEach((k) => subscribe(Store.db.doc('site/' + k), k, true));
    ['teams', 'agents', 'properties', 'branches', 'jobs'].forEach((c) => subscribe(Store.db.collection(c), c, false));
    initAdminEntry();
  } catch (err) { console.warn('[ICONIC] admin session unavailable:', err); }
}
async function initStore() {
  if (SERVER) { if (/(?:^|;\s*)iconic_admin=1/.test(doc.cookie)) await enableServerAdmin(); return; }
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    Store.db = db; Store.user = user;
    if (user) { try { Store.canEdit = !!(await user.canEdit()); } catch (_) { /* viewer stays read-only */ } }
    if (db) { ['company', 'texts', 'hotspots', 'about', 'layout'].forEach((k) => subscribe(db.doc('site/' + k), k, true)); ['teams', 'agents', 'properties'].forEach((c) => subscribe(db.collection(c), c, false)); }
    if (Store.canEdit) {
      try { Store.assets = await window.claude.use('assets'); } catch (_) { Store.assets = null; }
      try { Store.downloads = await window.claude.use('downloads'); } catch (_) { Store.downloads = null; }
    }
  } catch (err) { console.warn('[ICONIC] content store unavailable:', err); }
  initAdminEntry();
}
const newId = (p) => p + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const dbSet = (col, id, data) => Store.db.doc(col + '/' + id).set(data);
const dbDel = (col, id) => Store.db.doc(col + '/' + id).delete();
