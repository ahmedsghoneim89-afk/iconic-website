/* ==========================================================================
   40 — UI layer: i18n, navigation, scroll controller, properties (Scenes 04–05),
   brand story (06), conversion form (07), micro-interactions, boot.
   ========================================================================== */
let mgr = null, cardST = [], agentST = [], lastFocus = null;

/* ---------- helpers ---------- */
function scrollToEl(el) {
  const y = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: App.reduced ? 'auto' : 'smooth' });
}
const fmtNum = (n) => new Intl.NumberFormat(App.lang === 'ar' ? 'ar-EG' : 'en-US').format(n);
const toLatinDigits = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const safeUrl = (u) => (typeof u === 'string' && /^(https?:\/\/|\/)/.test(u)) ? u : '';

/* ---------- i18n / direction ---------- */
function applyI18n() {
  root.lang = App.lang; root.dir = App.lang === 'ar' ? 'rtl' : 'ltr';
  doc.title = t('meta.title');
  [['meta[name="description"]', 'meta.desc'], ['meta[property="og:title"]', 'meta.title'], ['meta[property="og:description"]', 'meta.desc']].forEach(([sel, k]) => { const m = $(sel); if (m) m.setAttribute('content', t(k)); });
  $$('[data-i18n]').forEach((n) => { if (n.id === 'hero-title') return; n.textContent = t(n.getAttribute('data-i18n')); });
  const units = splitKinetic($('#hero-title'), t('hero.title'));
  if (hasGSAP() && !heroEntered && !App.reduced && root.classList.contains('intro-on')) gsap.set(units, kinHidden());
  const lb = $('#langBtn'); lb.textContent = t('lang.label'); lb.setAttribute('aria-label', t('lang.aria')); lb.lang = App.lang === 'ar' ? 'en' : 'ar';
  $('#skyHint').textContent = t(mgr ? (mqCoarse.matches ? 'sky.hint.touch' : 'sky.hint.pointer') : 'sky.hint.static');
  $('#hsList').setAttribute('aria-label', t('sky.list'));
  syncSubmit(); syncMenuLabel(); renderProps(); renderTeams(); renderContactActions(); renderPillars(); applyLayout();
  if (mgr && mgr.interaction) mgr.interaction.refreshLabels();
  if (!mgr && window.__staticIC) window.__staticIC.refreshLabels();
  $('#year').textContent = new Date().getFullYear();
  adminRefresh();
}
function setLang(l) {
  if (SERVER && SERVER.alt && SERVER.alt[l]) { if (l !== App.lang) location.href = SERVER.alt[l] + (location.hash || ''); return; }   // each language has its own address, so search engines index both
  if (App.introRunning) Intro.skip();          // using the header means the visitor wants the site, not the intro
  App.lang = l; applyI18n();
  if (hasGSAP()) requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ---------- brand pillars (editable list) and section switches ---------- */
let pillarST = [], pillarsBound = false;
const pillarList = () => { const own = DATA.pillars.map((p) => L(p)).filter(Boolean); return own.length ? own : [1, 2, 3, 4, 5, 6, 7, 8].map((n) => t('story.' + n)); };
function renderPillars() {
  const list = $('#pillars'), items = pillarList();
  if (list.children.length === items.length) { items.forEach((s, i) => { if (list.children[i].textContent !== s) list.children[i].textContent = s; }); return; }
  list.textContent = '';
  items.forEach((s) => { const li = doc.createElement('li'); li.textContent = s; if (App.reduced || !hasGSAP()) li.classList.add('is-on'); list.appendChild(li); });
  if (pillarsBound) bindPillars(true);
}
function bindPillars(refresh) {
  pillarST.forEach((s) => s.kill()); pillarST = [];
  if (!hasGSAP() || App.reduced) return;
  const list = $('#pillars');
  $$('li', list).forEach((li) => pillarST.push(ScrollTrigger.create({ trigger: li, start: 'top 64%', end: 'bottom 40%', toggleClass: { targets: li, className: 'is-on' } })));
  pillarST.push(ScrollTrigger.create({ trigger: list, start: 'top 70%', end: 'bottom 50%', onUpdate: (s) => list.style.setProperty('--fill', s.progress) }));
  if (refresh) ScrollTrigger.refresh();
}
/* sections the company switched off disappear together with their menu entries */
function applyLayout() {
  [['teams', DATA.layout.teams], ['about', DATA.layout.about]].forEach(([id, on]) => {
    const sec = doc.getElementById(id); if (sec) sec.hidden = !on;
    $$('.nav__list a[href="#' + id + '"], .chapters a[href="#' + id + '"]').forEach((a) => { const li = a.closest('li'); if (li) li.hidden = !on; });
  });
}

/* ---------- navigation, header, chapters ---------- */
function initNav() {
  let updateChapter = () => {};
  const hdr = $('#hdr'), nav = $('#nav'), menu = $('#menuBtn'), bar = $('#progressBar');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, dy = y - lastY;
      if (!nav.classList.contains('is-open')) {
        if (y > 140 && dy > 6) hdr.classList.add('is-hidden'); else if (dy < -6 || y <= 140) hdr.classList.remove('is-hidden');
      }
      hdr.classList.toggle('is-scrolled', y > 60); updateChapter();
      lastY = y; const max = doc.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`; ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); syncMenuLabel(); };
  menu.addEventListener('click', () => { const o = nav.classList.toggle('is-open'); menu.setAttribute('aria-expanded', String(o)); syncMenuLabel(); if (o) hdr.classList.remove('is-hidden'); });
  doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  /* in-page anchors: one smooth-scroll path, no hash writes */
  doc.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); const target = id && doc.getElementById(id); if (!target) return;
    e.preventDefault(); closeMenu(); if (App.introRunning) Intro.skip();
    scrollToEl(target); target.setAttribute('tabindex', '-1'); setTimeout(() => target.focus({ preventScroll: true }), App.reduced ? 0 : 700);
  });
  $('#langBtn').addEventListener('click', (e) => { e.preventDefault(); setLang(App.lang === 'en' ? 'ar' : 'en'); });
  /* active chapter: the section under the middle of the viewport. Measured on scroll, not with IntersectionObserver rootMargin,
     because rootMargin is ignored when the page runs inside a cross-origin iframe (an embedded preview), which made the last section to peek in win. */
  const ids = ['scene-city', 'skyline', 'properties', 'teams', 'about', 'contact'], map = { 'scene-city': null, skyline: 'skyline', properties: 'properties', teams: 'teams', about: 'about', contact: 'contact' };
  const chapEls = ids.map((id) => doc.getElementById(id));
  let curChap = null;
  updateChapter = () => {
    const mid = innerHeight / 2; let id = null;
    for (let i = 0; i < chapEls.length; i++) { const r = chapEls[i].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { id = ids[i]; break; } }
    if (!id || id === curChap) return; curChap = id;
    $$('[data-chap]').forEach((l) => l.setAttribute('aria-current', String(l.dataset.chap === id)));
    $$('.nav__link').forEach((l) => l.setAttribute('aria-current', String(!!map[id] && l.getAttribute('href') === '#' + map[id])));
  };
  window.addEventListener('resize', updateChapter, { passive: true }); updateChapter();
}
function syncMenuLabel() { const m = $('#menuBtn'); m.textContent = t($('#nav').classList.contains('is-open') ? 'nav.close' : 'nav.menu'); }

/* ---------- ScrollAnimationController: one scroll input drives the camera and every scrubbed reveal ---------- */
const ScrollAnimationController = {
  init() {
    const range = $('#cityRange'), stage = $('#stage');
    /* Scene 03 activation + canvas visibility work without GSAP and in reduced-motion mode */
    new IntersectionObserver(([en]) => { App.stageActive = en.isIntersecting; stage.classList.toggle('is-active', en.isIntersecting); if (mgr) { if (!en.isIntersecting) mgr.interaction.clear(); mgr.invalidate(); } if (en.isIntersecting && !this.engagedStage) { this.engagedStage = true; } }, { threshold: 0.6 }).observe(stage);
    new IntersectionObserver(([en]) => { if (mgr) mgr.setVisible(en.isIntersecting); }, { rootMargin: '300px 0px 300px 0px' }).observe(range);
    if (App.reduced || !hasGSAP()) { this.initStaticOrNative(range); return; }
    const hero = $('#scene-city');
    ScrollTrigger.create({
      trigger: range, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress; hero.classList.toggle('is-scrolled', self.scroll() > 40);
        if (!mgr) return;
        mgr.scroll.p = p; mgr.cam.setProgress(1 - Math.pow(1 - p, 1.35));
        mgr.cam.kickFov(clamp(Math.abs(self.getVelocity()) / 3000, 0, 1) * MOTION.camera.fovKick);
        if (App.selected >= 0 && Math.abs(p - mgr.scroll.selectedAt) > 0.025) mgr.interaction.clear();
      }
    });
    gsap.to('#heroCopy', { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=70%', scrub: true } });
    /* Scene 03 -> 04: the property surface opens out of the skyline */
    gsap.fromTo('#properties', { clipPath: 'inset(9% 7% 0% 7% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#properties', start: 'top 92%', end: 'top 25%', scrub: true } });
    this.initStory(); this.initConvert();
  },
  initStaticOrNative(range) {
    const hero = $('#scene-city');
    const apply = () => {
      const r = range.getBoundingClientRect(), span = r.height - innerHeight, p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      hero.classList.toggle('is-scrolled', scrollY > 40);
      if (!mgr) return;
      if (App.reduced) { const sk = $('#skyline').getBoundingClientRect(); mgr.cam.setProgress(sk.top < innerHeight * 0.5 ? 0.92 : 0.3); }
      else { mgr.scroll.p = p; mgr.cam.setProgress(1 - Math.pow(1 - p, 1.35)); }
    };
    let tick = false; window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { apply(); tick = false; }); } }, { passive: true });
    apply();
    Emblem.build($('#storyArt'), 'static');
    $$('.pillars li').forEach((li) => li.classList.add('is-on'));
  },
  initStory() {
    pillarsBound = true; bindPillars(false);
    const art = Emblem.build($('#storyArt'), 'draw');
    gsap.to(art.lines, { strokeDashoffset: 0, ease: 'none', stagger: 0.02, scrollTrigger: { trigger: '#about', start: 'top 75%', end: 'center 35%', scrub: true } });
    gsap.to(art.fill, { opacity: 0.55, ease: 'none', scrollTrigger: { trigger: '#about', start: 'center 55%', end: 'center 30%', scrub: true } });
  },
  initConvert() {
    gsap.fromTo('#conv-title', { clipPath: 'inset(0 0 100% 0)', y: MOTION.reveal.distance }, { clipPath: 'inset(-12% -2% -16% -2%)', y: 0, duration: MOTION.duration.cinematic, ease: MOTION.ease.emphasized, scrollTrigger: { trigger: '#contact', start: 'top 68%', once: true }, onComplete: () => gsap.set('#conv-title', { clearProps: 'clipPath,transform' }) });
  }
};

/* ---------- Scene 04: property discovery ---------- */
const realProps = () => DATA.properties;
const shownProps = () => realProps().length ? realProps() : (App.previewOn ? SAMPLE : []);
const isSample = (p) => SAMPLE.indexOf(p) >= 0;

function renderFilters(list) {
  const box = $('#filters'); box.textContent = '';
  const groups = [['type', 'props.filter.type'], ['purpose', 'props.filter.purpose'], ['region', 'props.filter.region']].map(([k, lk]) => [k, lk, [...new Set(list.map((p) => p[k]).filter(Boolean))]]).filter((g) => g[2].length > 1);
  box.hidden = !groups.length;
  groups.forEach(([key, lk, vals]) => {
    const fs = doc.createElement('fieldset'), lg = doc.createElement('legend'), row = doc.createElement('div'); lg.textContent = t(lk); row.className = 'chips';
    [null, ...vals].forEach((v) => {
      const b = doc.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = v === null ? t('props.filter.all') : (key === 'region' ? regionName(v) : key === 'type' ? typeLabel(v) : key === 'purpose' ? purposeLabel(v) : v);
      b.setAttribute('aria-pressed', String(App.filters[key] === v));
      b.addEventListener('click', () => { App.filters[key] = v; applyFilters(); $$('.chip', row).forEach((c) => c.setAttribute('aria-pressed', String(c === b))); });
      row.appendChild(b);
    });
    fs.append(lg, row); box.appendChild(fs);
  });
}
function applyFilters() {
  const cards = $$('.card'); let n = 0, shown = [];
  cards.forEach((c) => { const p = c._prop, f = App.filters, ok = (!f.type || p.type === f.type) && (!f.purpose || p.purpose === f.purpose) && (!f.region || p.region === f.region) && (!f.agent || p.agent === f.agent); c.hidden = !ok; if (ok) { n++; shown.push(c); } });
  $('#propsCount').textContent = shownProps().length ? t('props.count', { n: fmtNum(n) }) : '';
  if (hasGSAP() && !App.reduced && shown.length) gsap.fromTo(shown, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: MOTION.duration.base, ease: MOTION.ease.standard, stagger: MOTION.stagger.tight, overwrite: true, clearProps: 'transform,opacity' });
}
function mediaFor(p, cls) {
  const img = safeUrl(p.images && p.images[0]);
  if (img) { const i = doc.createElement('img'); i.className = cls; i.src = img; i.alt = p.title || ''; i.loading = 'lazy'; i.decoding = 'async'; return i; }
  const d = doc.createElement('div'); d.className = cls + ' media-ph'; return d;
}
function renderProps() {
  const list = shownProps(), grid = $('#propsGrid'), hasReal = realProps().length > 0;
  cardST.forEach((s) => s.kill()); cardST = []; grid.textContent = '';
  $('#propsEmpty').hidden = hasReal; $('#previewNote').hidden = hasReal || !App.previewOn;
  const pb = $('#previewBtn'); pb.setAttribute('aria-pressed', String(App.previewOn)); pb.textContent = t(App.previewOn ? 'props.preview.off' : 'props.preview');
  renderFilters(list); renderAgentFilter();
  list.forEach((p) => {
    const c = doc.createElement('article'); c.className = 'card'; c._prop = p;
    const m = doc.createElement('div'); m.className = 'card__media'; m.appendChild(mediaFor(p, 'media-in'));
    if (isSample(p)) { const f = doc.createElement('span'); f.className = 'card__flag'; f.textContent = App.lang === 'ar' ? 'تجريبي' : 'Sample'; m.appendChild(f); }
    const body = doc.createElement('div'); body.className = 'card__body';
    const h = doc.createElement('h3'); let b;
    if (p.url) { b = doc.createElement('a'); b.href = p.url; b.className = 'card__open'; b.textContent = p.title; }   // production: every unit has its own page
    else { b = doc.createElement('button'); b.type = 'button'; b.className = 'card__open'; b.textContent = p.title; b.setAttribute('aria-label', `${t('prop.open')}: ${p.title}`); b.addEventListener('click', (e) => openDetail(p, c, e)); }
    h.appendChild(b);
    const meta = doc.createElement('div'); meta.className = 'card__meta';
    [p.project, regionName(p.region), p.location, typeLabel(p.type), p.beds != null ? `${fmtNum(p.beds)} ${t('prop.beds')}` : null, p.area].filter(Boolean).forEach((x) => { const s = doc.createElement('span'); s.textContent = x; meta.appendChild(s); });
    const pr = doc.createElement('p'); pr.className = 'card__price'; pr.textContent = priceText(p);
    body.append(h, meta, pr); c.append(m, body); grid.appendChild(c);
    if (mqFine.matches && !App.reduced && hasGSAP()) {
      m.addEventListener('pointermove', (e) => { const r = m.getBoundingClientRect(); gsap.to(m, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotationX: -((e.clientY - r.top) / r.height - 0.5) * 12, transformPerspective: 900, duration: MOTION.duration.base * 0.7, ease: MOTION.ease.standard, overwrite: 'auto' }); });
      m.addEventListener('pointerleave', () => gsap.to(m, { rotationX: 0, rotationY: 0, duration: MOTION.duration.slow, ease: MOTION.ease.standard, overwrite: 'auto' }));
    }
  });
  const cards = $$('.card');
  $('#propsCount').textContent = cards.length ? t('props.count', { n: fmtNum(cards.length) }) : '';
  if (hasGSAP() && !App.reduced && cards.length) {
    cards.forEach((c) => { gsap.set(c.querySelector('.card__media'), { clipPath: 'inset(100% 0% 0% 0%)' }); gsap.set(c.querySelector('.card__body'), { opacity: 0, y: 18 }); });
    cardST.push(...ScrollTrigger.batch(cards, { start: 'top 90%', once: true, onEnter: (batch) => {
      gsap.to(batch.map((c) => c.querySelector('.card__media')), { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.duration.slow, ease: MOTION.ease.inOut, stagger: MOTION.stagger.base, clearProps: 'clipPath' });
      gsap.to(batch.map((c) => c.querySelector('.card__body')), { opacity: 1, y: 0, duration: MOTION.duration.slow, ease: MOTION.ease.standard, stagger: MOTION.stagger.base, delay: MOTION.delay.base, clearProps: 'all' });
      batch.forEach((c) => { if (!isSample(c._prop)) track('property_viewed', { id: c._prop.id }); });
    } }));
    cards.forEach((c) => { const inner = c.querySelector('.media-in'); cardST.push(ScrollTrigger.create({ trigger: c, start: 'top bottom', end: 'bottom top', scrub: true, animation: gsap.fromTo(inner, { yPercent: -5 }, { yPercent: 5, ease: 'none' }) })); });
  }
  applyFilters();
}
function priceText(p) {
  if (p.price == null) return t('prop.price.none');
  try { return p.currency ? new Intl.NumberFormat(App.lang === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: p.currency, maximumFractionDigits: 0 }).format(p.price) : fmtNum(p.price); } catch (e) { return fmtNum(p.price); }
}

/* ---------- Sales teams: region -> team -> agents -> linked units, with contact details ---------- */
const teamSet = () => DATA.teams.length ? { teams: DATA.teams, agents: DATA.agents, sample: false } : (App.teamsPreview ? { teams: SAMPLE_TEAMS, agents: SAMPLE_AGENTS, sample: true } : null);
const isSampleAgent = (a) => SAMPLE_AGENTS.indexOf(a) >= 0;
const findAgent = (id) => id ? DATA.agents.concat(SAMPLE_AGENTS).find((a) => a.id === id) : null;
const unitsOfAgent = (a) => (isSampleAgent(a) ? SAMPLE : DATA.properties).filter((p) => p.agent === a.id);
const regionRank = (id) => { const i = REGIONS.findIndex((r) => r.id === id); return i < 0 ? 99 : i; };
function waNumber(v) {
  let n = String(v || '').replace(/\D/g, '');
  if (/^01\d{9}$/.test(n)) n = '20' + n.slice(1);          // Egyptian mobile typed locally (01xxxxxxxxx) -> international form for wa.me
  return n;
}
function waHref(a, prop) {
  const n = waNumber(a.whatsapp); if (!n) return '';
  const name = L(a.name), ref = prop ? (prop.title || '') + (prop.id ? ' (' + prop.id + ')' : '') : '';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(prop ? t('agent.wa.unit', { name, ref }) : t('agent.wa.generic', { name }));
}
function silhouette() {
  const ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg'), c = doc.createElementNS(ns, 'circle'), b = doc.createElementNS(ns, 'path');
  svg.setAttribute('viewBox', '0 0 100 125'); svg.setAttribute('class', 'agent__sil'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  c.setAttribute('cx', '50'); c.setAttribute('cy', '48'); c.setAttribute('r', '19'); b.setAttribute('d', 'M14 125c0-29 16-47 36-47s36 18 36 47');
  svg.append(c, b); return svg;
}
function agentPhoto(a, box) {
  const u = safeUrl(a.photo);
  if (u) { const i = doc.createElement('img'); i.src = u; i.alt = t('agent.photo', { name: L(a.name) }); i.loading = 'lazy'; i.decoding = 'async'; box.appendChild(i); }
  else { box.classList.add('is-ph'); box.appendChild(silhouette()); }
}
/* WhatsApp (with a ready message), phone and email for one agent. `prop` makes the WhatsApp message about that unit. */
function contactActions(a, prop, box) {
  const wa = waHref(a, prop), sample = isSampleAgent(a);
  const link = (href, text, cls, ev, ext) => { const el = doc.createElement('a'); if (cls) el.className = cls; el.href = href; el.textContent = text; if (ext) { el.target = '_blank'; el.rel = 'noopener noreferrer'; } el.addEventListener('click', () => track(ev, { agent: a.id, property: prop ? prop.id : undefined })); return el; };
  if (wa) box.appendChild(link(wa, t('contact.whatsapp'), 'btn btn--small btn--primary', 'whatsapp_cta_clicked', true));
  else if (sample) { const d = doc.createElement('span'); d.className = 'btn btn--small btn--primary is-disabled'; d.setAttribute('aria-disabled', 'true'); d.textContent = t('contact.whatsapp'); box.appendChild(d); }
  const lines = doc.createElement('div'); lines.className = 'agent__lines';
  if (a.phone) { const l = link('tel:' + String(a.phone).replace(/[^\d+]/g, ''), String(a.phone), '', 'contact_cta_clicked'); l.dir = 'ltr'; lines.appendChild(l); }
  if (a.email && /^[^\s@]+@[^\s@]+$/.test(a.email)) { const l = link('mailto:' + a.email, a.email, '', 'contact_cta_clicked'); l.dir = 'ltr'; lines.appendChild(l); }
  if (lines.children.length) box.appendChild(lines);
  else if (sample) { const n = doc.createElement('p'); n.className = 'agent__soon'; n.textContent = t('agent.soon'); box.appendChild(n); }
}
function agentCard(a, sample, i) {
  const c = doc.createElement('article'); c.className = 'agent'; c.style.setProperty('--i', i % 4);
  const ph = doc.createElement('div'); ph.className = 'agent__photo'; agentPhoto(a, ph);
  if (sample) { const f = doc.createElement('span'); f.className = 'card__flag'; f.textContent = App.lang === 'ar' ? 'تجريبي' : 'Sample'; ph.appendChild(f); }
  const body = doc.createElement('div'); body.className = 'agent__body';
  const h = doc.createElement('h4'); h.className = 'agent__name'; h.textContent = L(a.name);
  const role = doc.createElement('p'); role.className = 'agent__role'; role.textContent = L(a.role);
  const n = unitsOfAgent(a).length, u = doc.createElement('p'); u.className = 'agent__units';
  if (n) {
    const cnt = doc.createElement('span'); cnt.textContent = plural('team.units', n);
    const b = doc.createElement('button'); b.type = 'button'; b.className = 'agent__link'; b.textContent = t('agent.units.view'); b.setAttribute('aria-label', `${t('agent.units.view')}: ${L(a.name)}`);
    b.addEventListener('click', () => showAgentUnits(a)); u.append(cnt, b);
  } else u.textContent = t('agent.units.none');
  const act = doc.createElement('div'); act.className = 'agent__actions'; contactActions(a, null, act);
  body.append(h, role, u, act); c.append(ph, body); return c;
}
let revealIO = null;
function observeReveal(els) {
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  revealIO = revealIO || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => revealIO.observe(e));
}
function drawTeams() {
  const set = teamSet(), list = $('#teamsList'); list.textContent = ''; if (!set) return;
  const teams = set.teams.slice().sort((x, y) => regionRank(x.region) - regionRank(y.region)).filter((tm) => !App.teamRegion || teamRegions(tm).includes(App.teamRegion));
  teams.forEach((tm) => {
    const agents = set.agents.filter((a) => a.team === tm.id), units = agents.reduce((n, a) => n + unitsOfAgent(a).length, 0);
    const sec = doc.createElement('section'); sec.className = 'team'; sec.dataset.region = teamRegions(tm).join(' '); sec.id = 'team-' + tm.id; sec.setAttribute('aria-labelledby', 'team-' + tm.id + '-t');
    const head = doc.createElement('header'); head.className = 'team__head';
    const h = doc.createElement('h3'); h.id = 'team-' + tm.id + '-t'; h.textContent = L(tm.name);
    const meta = doc.createElement('p'); meta.className = 'team__meta';
    [regionsLabel(teamRegions(tm)), plural('team.agents', agents.length), plural('team.units', units)].filter(Boolean).forEach((x) => { const sp = doc.createElement('span'); sp.textContent = x; meta.appendChild(sp); });
    head.append(h, meta);
    const grid = doc.createElement('div'); grid.className = 'team__agents';
    agents.forEach((a, i) => grid.appendChild(agentCard(a, set.sample, i)));
    sec.append(head, grid); list.appendChild(sec);
  });
  observeReveal($$('.agent', list));
  stageAgents(list);
}
/* Agent portraits: the frame opens upwards like a curtain the first time it is seen, then, while the card crosses the screen, the portrait drifts
   slowly inside its frame and a gold light rises behind the person, brightest at the middle of the screen (cut-out photos show it, flat photos do not mind). */
function stageAgents(list) {
  agentST.forEach((s) => s.kill()); agentST = [];
  if (!hasGSAP() || App.reduced) return;
  const frames = $$('.agent__photo:not(.is-ph)', list).filter((f) => f.querySelector('img')); if (!frames.length) return;
  gsap.set(frames, { clipPath: 'inset(100% 0% 0% 0%)' });
  agentST.push(...ScrollTrigger.batch(frames, { start: 'top 92%', once: true, onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.duration.slow, ease: MOTION.ease.inOut, stagger: MOTION.stagger.base, clearProps: 'clipPath', overwrite: 'auto' }) }));
  frames.forEach((f) => {
    const img = f.querySelector('img');
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: 0.7 } });
    tl.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, duration: 1 }, 0)
      .fromTo(f, { '--lit': 0 }, { '--lit': 1, duration: 0.5, ease: 'power1.out' }, 0)
      .to(f, { '--lit': 0.12, duration: 0.5, ease: 'power1.in' }, 0.5);
    agentST.push(tl.scrollTrigger);
  });
}
function renderTeams() {
  const set = teamSet(), filters = $('#teamFilters'), hasReal = DATA.teams.length > 0;
  filters.textContent = '';
  const pb = $('#teamsPreviewBtn'); pb.setAttribute('aria-pressed', String(App.teamsPreview)); pb.textContent = t(App.teamsPreview ? 'teams.preview.off' : 'teams.preview');
  $('#teamsEmpty').hidden = hasReal; $('#teamsNote').hidden = hasReal || !App.teamsPreview;
  if (!set) { filters.hidden = true; $('#teamsList').textContent = ''; return; }
  const regions = REGIONS.filter((r) => set.teams.some((tm) => teamRegions(tm).includes(r.id)));
  if (App.teamRegion && !regions.some((r) => r.id === App.teamRegion)) App.teamRegion = null;
  filters.hidden = regions.length < 2;
  if (regions.length > 1) {
    const fs = doc.createElement('fieldset'), lg = doc.createElement('legend'), row = doc.createElement('div'); lg.textContent = t('teams.region'); row.className = 'chips';
    [null, ...regions.map((r) => r.id)].forEach((id) => {
      const b = doc.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = id === null ? t('teams.all') : regionName(id); b.setAttribute('aria-pressed', String(App.teamRegion === id));
      b.addEventListener('click', () => { App.teamRegion = id; $$('.chip', row).forEach((c) => c.setAttribute('aria-pressed', String(c === b))); drawTeams(); if (hasGSAP()) ScrollTrigger.refresh(); });
      row.appendChild(b);
    });
    fs.append(lg, row); filters.appendChild(fs);
  }
  drawTeams();
}
function initTeams() {
  Emblem.build($('#teamsArt'), 'static');
  $('#teamsPreviewBtn').addEventListener('click', () => { App.teamsPreview = !App.teamsPreview; App.teamRegion = null; renderTeams(); if (hasGSAP()) ScrollTrigger.refresh(); });
}
function renderAgentFilter() {
  const box = $('#agentFilter'), a = App.filters.agent ? findAgent(App.filters.agent) : null;
  box.hidden = !a; if (a) $('#agentFilterText').textContent = t('props.agentfilter', { name: L(a.name) });
}
function showAgentUnits(a) {
  if (App.introRunning) Intro.skip();
  if (isSampleAgent(a)) App.previewOn = true;
  App.filters = { type: null, purpose: null, region: null, agent: a.id };
  renderProps(); if (hasGSAP()) ScrollTrigger.refresh();
  scrollToEl($('#properties'));
}
/* skyline points open one region: its properties or its sales team */
function goRegion(target, id) {
  if (App.introRunning) Intro.skip();
  if (target === 'teams') { App.teamRegion = id; renderTeams(); if (hasGSAP()) ScrollTrigger.refresh(); scrollToEl($('#teams')); }
  else { App.filters = { type: null, purpose: null, region: id, agent: null }; renderProps(); if (hasGSAP()) ScrollTrigger.refresh(); scrollToEl($('#properties')); }
}
function renderDetailAgent(p) {
  const box = $('#detailAgent'), a = findAgent(p.agent); box.textContent = ''; box.hidden = !a; if (!a) return;
  const lab = doc.createElement('p'); lab.className = 'note'; lab.textContent = t('detail.agent');
  const row = doc.createElement('div'); row.className = 'agentline__row';
  const ph = doc.createElement('div'); ph.className = 'agentline__photo'; agentPhoto(a, ph);
  const who = doc.createElement('div'); who.className = 'agentline__who';
  const nm = doc.createElement('strong'); nm.textContent = L(a.name); const rl = doc.createElement('span'); rl.textContent = L(a.role); who.append(nm, rl);
  const act = doc.createElement('div'); act.className = 'agent__actions'; contactActions(a, p, act);
  row.append(ph, who, act); box.append(lab, row);
}

/* ---------- Scene 05: property experience ---------- */
function openDetail(p, originEl, ev) {
  const d = $('#detail'); lastFocus = doc.activeElement;
  $('#detailTitle').textContent = p.title; $('#detailLoc').textContent = [p.project, p.location].filter(Boolean).join(App.lang === 'ar' ? '، ' : ', '); $('#detailPrice').textContent = priceText(p); $('#detailDesc').textContent = p.description || '';
  const media = $('#detailMedia'); media.textContent = '';
  const imgs = (p.images || []).map(safeUrl).filter(Boolean);
  if (imgs.length) imgs.forEach((u) => { const i = doc.createElement('img'); i.src = u; i.alt = p.title; i.loading = 'lazy'; i.decoding = 'async'; media.appendChild(i); });
  else { const ph = doc.createElement('div'); ph.className = 'media-in media-ph'; media.appendChild(ph); }
  const specs = $('#detailSpecs'); specs.textContent = '';
  [['prop.type', typeLabel(p.type)], ['prop.purpose', purposeLabel(p.purpose)], ['prop.beds', p.beds], ['prop.baths', p.baths], ['prop.area', p.area]].filter((x) => x[1] != null && x[1] !== '').forEach(([k, v]) => {
    const w = doc.createElement('div'), dt = doc.createElement('dt'), dd = doc.createElement('dd'); dt.textContent = t(k); dd.textContent = typeof v === 'number' ? fmtNum(v) : v; w.append(dt, dd); specs.appendChild(w);
  });
  specs.hidden = !specs.children.length;
  renderDetailAgent(p);
  const flag = $('#detailFlag'); flag.hidden = !isSample(p); flag.textContent = t('prop.sample');
  d._prop = p; d.hidden = false; root.style.overflow = 'hidden'; d.scrollTop = 0;
  const r = originEl ? originEl.getBoundingClientRect() : null, cx = ev && ev.clientX ? ev.clientX : (r ? r.left + r.width / 2 : innerWidth / 2), cy = ev && ev.clientY ? ev.clientY : (r ? r.top + r.height / 2 : innerHeight / 2);
  if (hasGSAP() && !App.reduced) gsap.fromTo(d, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(150% at ${cx}px ${cy}px)`, duration: MOTION.duration.cinematic * 0.75, ease: MOTION.ease.inOut, onComplete: () => gsap.set(d, { clearProps: 'clipPath' }) });
  $('#detailClose').focus({ preventScroll: true });
  if (!isSample(p)) track('property_details_opened', { id: p.id });
}
function closeDetail() {
  const d = $('#detail'); if (d.hidden) return;
  const done = () => { d.hidden = true; root.style.overflow = ''; if (hasGSAP()) gsap.set(d, { clearProps: 'clipPath,opacity' }); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
  if (hasGSAP() && !App.reduced) gsap.to(d, { opacity: 0, duration: MOTION.duration.base * 0.7, ease: MOTION.ease.standard, onComplete: done }); else done();
}
function initDetail() {
  $('#detailClose').addEventListener('click', closeDetail);
  doc.addEventListener('keydown', (e) => {
    const d = $('#detail'); if (d.hidden) return;
    if (e.key === 'Escape') { closeDetail(); return; }
    if (e.key === 'Tab') {
      const f = $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', d).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  $('#previewBtn').addEventListener('click', () => { App.previewOn = !App.previewOn; App.filters = { type: null, purpose: null, region: null, agent: null }; renderProps(); if (hasGSAP()) ScrollTrigger.refresh(); });
  $('#agentFilterClear').addEventListener('click', () => { App.filters.agent = null; renderProps(); if (hasGSAP()) ScrollTrigger.refresh(); });
}

/* ---------- Scene 07: conversion ---------- */
function syncSubmit() {
  const v = ($('input[name="interest"]:checked') || {}).value || 'inquiry';
  $('#submitBtn').textContent = t('form.submit.' + v);
}
function openContact(interest, prop) {
  const d = $('#detail'); if (!d.hidden) { d.hidden = true; root.style.overflow = ''; }
  const r = $(`input[name="interest"][value="${interest}"]`); if (r) r.checked = true; syncSubmit();
  $('#f-property').value = prop && !isSample(prop) ? (prop.id || prop.title || '') : '';
  $('#f-agent').value = prop && prop.agent && !isSample(prop) ? prop.agent : '';
  if (App.introRunning) Intro.skip();
  scrollToEl($('#contact')); setTimeout(() => $('#f-name').focus({ preventScroll: true }), App.reduced ? 0 : 800);
}
/* small stroke icons for the contact buttons and branch cards (decorative, constant markup) */
const ICO = {
  wa: '<path d="M4 20l1.4-4.3A8 8 0 1 1 8.5 18.7L4 20z"/><path d="M9 9.2c.4 2 2.3 3.9 4.8 4.8l1.2-1.3-1.9-.9-.7.7c-.8-.3-1.6-1.1-1.9-1.9l.7-.7-.9-1.9L9 9.2z"/>',
  phone: '<path d="M5 4h4l1.8 4.5-2.4 1.5a11 11 0 0 0 5.6 5.6l1.5-2.4L20 15v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'
};
function icoHTML(k) { return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICO[k] + '</svg>'; }
function renderContactActions() {
  const box = $('#contactActions'), c = DATA.company; box.textContent = '';
  const add = (href, label, ev, ext, icon, primary) => {
    const a = doc.createElement('a'), sp = doc.createElement('span'); a.className = 'btn btn--ico' + (primary ? ' btn--primary' : ''); a.href = href; sp.textContent = label;
    a.insertAdjacentHTML('beforeend', icoHTML(icon)); a.appendChild(sp);
    if (ext) { a.target = '_blank'; a.rel = 'noopener'; } a.addEventListener('click', () => track(ev, {})); box.appendChild(a);
  };
  if (waNumber(c.whatsapp)) add('https://wa.me/' + waNumber(c.whatsapp), t('contact.whatsapp'), 'whatsapp_cta_clicked', true, 'wa', true);
  if (c.phone) add('tel:' + String(c.phone).replace(/[^\d+]/g, ''), t('contact.call'), 'contact_cta_clicked', false, 'phone');
  if (c.email) add('mailto:' + c.email, t('contact.email'), 'contact_cta_clicked', false, 'mail');
  renderContactInfo();
}
const SOCIALS = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube'], ['tiktok', 'TikTok'], ['x', 'X']];
const httpsUrl = (u) => (typeof u === 'string' && /^https:\/\/\S+$/i.test(u.trim())) ? u.trim() : '';
const mkEl = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
/* one branch card: name, area, address, hours and the phone / WhatsApp / map actions that are filled in (same markup as the server-rendered page) */
function branchCard(b) {
  const nm = b.name || b.city, li = mkEl('li', 'branch'), acts = mkEl('div', 'branch__acts');
  const act = (href, label, icon, ext, ltr, aria) => {
    const a = mkEl('a', 'act'); a.href = href; if (ltr) a.dir = 'ltr'; if (aria) a.setAttribute('aria-label', aria); if (ext) { a.target = '_blank'; a.rel = 'noopener'; }
    a.insertAdjacentHTML('beforeend', icoHTML(icon)); a.appendChild(mkEl('span', '', label)); acts.appendChild(a); return a;
  };
  li.appendChild(mkEl('h4', 'branch__name', nm));
  if (b.city && b.name) li.appendChild(mkEl('p', 'branch__city', b.city));
  if (b.address) li.appendChild(mkEl('address', 'branch__addr', b.address));
  if (b.hours) { const p = mkEl('p', 'branch__hours'); p.append(mkEl('span', 'branch__k', t('branch.hours')), ' ' + b.hours); li.appendChild(p); }
  if (b.map) act(b.map, t('branch.map'), 'pin', true, false, t('branch.map') + ' — ' + nm).classList.add('act--map');
  if (b.phone) act('tel:' + String(b.phone).replace(/[^\d+]/g, ''), b.phone, 'phone', false, true);
  if (waNumber(b.whatsapp)) act('https://wa.me/' + waNumber(b.whatsapp), t('contact.whatsapp'), 'wa', true, false, t('contact.whatsapp') + ' — ' + nm);
  if (acts.childNodes.length) li.appendChild(acts);
  return li;
}
function renderContactInfo() {
  const box = $('#contactInfo'), c = DATA.company, el = mkEl;
  box.textContent = '';
  const row = (label, text, tag) => { const d = el('div', 'ci__row'); d.append(el('span', 'ci__k', label), el(tag || 'p', '', text)); box.appendChild(d); };
  const addr = L(c.address), hrs = L(c.hours);
  if (addr) row(t('contact.address'), addr, 'address');
  if (hrs) row(t('contact.hours'), hrs);
  const links = SOCIALS.map(([k, name]) => [name, httpsUrl((c.social || {})[k])]).filter((x) => x[1]);
  if (links.length) {
    const d = el('div', 'ci__row'), ul = el('ul', 'ci__social'); d.append(el('span', 'ci__k', t('contact.follow')), ul);
    links.forEach(([name, u]) => { const li = el('li'), a = el('a', '', name); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.addEventListener('click', () => track('contact_cta_clicked', { from: 'social' })); li.appendChild(a); ul.appendChild(li); });
    box.appendChild(d);
  }
  const bb = $('#contactBranches'); if (!bb) return; bb.textContent = '';
  if (DATA.branches.length) {
    const sec = el('section', 'cbranches__in'), h = el('h3', 'cbranches__h', t('contact.branches')), ul = el('ul', 'branches');
    h.id = 'cb-h'; sec.setAttribute('aria-labelledby', 'cb-h'); DATA.branches.forEach((b) => ul.appendChild(branchCard(b))); sec.append(h, ul); bb.appendChild(sec);
  }
}
function initForm() {
  const form = $('#leadForm'), status = $('#formStatus'); let started = false, last = 0;
  const E = { name: $('#e-name'), phone: $('#e-phone'), email: $('#e-email'), contact: $('#e-contact'), consent: $('#e-consent') };
  const setErr = (k, msg, field) => { E[k].textContent = msg || ''; if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  const val = () => {
    const f = form.elements, name = f.name.value.trim(), phone = toLatinDigits(f.phone.value.trim()), email = f.email.value.trim(), errs = [];
    const digits = phone.replace(/\D/g, '');
    const badPhone = phone && !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15);
    const badEmail = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setErr('name', name.length < 2 ? t('form.err.name') : '', f.name); if (name.length < 2) errs.push(f.name);
    setErr('phone', badPhone ? t('form.err.phone') : '', f.phone); if (badPhone) errs.push(f.phone);
    setErr('email', badEmail ? t('form.err.email') : '', f.email); if (badEmail) errs.push(f.email);
    const noContact = !phone && !email; setErr('contact', noContact ? t('form.err.contact') : ''); if (noContact) errs.push(f.phone);
    setErr('consent', !f.consent.checked ? t('form.err.consent') : '', f.consent); if (!f.consent.checked) errs.push(f.consent);
    return { errs, data: { lang: App.lang, page: location.pathname, interest: ($('input[name="interest"]:checked') || {}).value, name, phone: digits ? phone : '', email, message: f.message.value.trim(), property: f.property.value, agent: f.agent.value } };
  };
  form.addEventListener('input', () => { if (!started) { started = true; track('inquiry_initiated', { interest: ($('input[name="interest"]:checked') || {}).value }); } });
  form.addEventListener('change', (e) => { if (e.target.name === 'interest') syncSubmit(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); status.dataset.state = ''; status.textContent = '';
    const { errs, data } = val();
    if (errs.length) { errs[0].focus(); status.dataset.state = 'error'; return; }
    if (form.elements.website.value) { status.dataset.state = 'info'; status.textContent = t('form.proto'); return; }   // honeypot: bots get the same screen, nothing is processed
    if (Date.now() - last < 8000) { status.dataset.state = 'error'; status.textContent = t('form.err.wait'); return; }
    last = Date.now();
    if (!DATA.formEndpoint) { status.dataset.state = 'info'; status.textContent = t('form.proto'); return; }
    const btn = $('#submitBtn'); btn.disabled = true; status.textContent = t('form.sending');
    try {
      const res = await fetch(DATA.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.status === 429) { status.dataset.state = 'error'; status.textContent = t('form.err.wait'); return; }
      if (!res.ok) throw new Error(String(res.status));
      status.dataset.state = 'ok'; status.textContent = t('form.sent'); form.reset(); syncSubmit();
      track(data.interest === 'viewing' ? 'viewing_requested' : 'inquiry_submitted', { property: data.property || undefined });
    } catch (err) { status.dataset.state = 'error'; status.textContent = t('form.fail'); } finally { btn.disabled = false; }
  });
  doc.addEventListener('click', (e) => {
    const c = e.target.closest && e.target.closest('[data-cta]'); if (!c) return;
    const d = $('#detail'), prop = !d.hidden ? d._prop : null;
    track('contact_cta_clicked', { interest: c.dataset.cta });
    if (c.tagName === 'BUTTON' || c.getAttribute('href') === '#contact') { e.preventDefault(); e.stopPropagation(); openContact(c.dataset.cta, prop); }
  }, true);
}

/* ---------- micro-interactions (fine pointer + motion allowed) ---------- */
function initMicro() {
  $$('.btn').forEach((b) => b.addEventListener('pointerenter', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--bx', (App.lang === 'ar' ? r.right - e.clientX : e.clientX - r.left) + 'px'); b.style.setProperty('--by', (e.clientY - r.top) + 'px'); }));
  $$('[data-spotlight]').forEach((s) => s.addEventListener('pointermove', (e) => { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true }));
  if (!mqFine.matches || App.reduced || !hasGSAP()) return;
  const c = $('#cursor'), xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' }), yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  let label = '';
  window.addEventListener('pointermove', (e) => {
    c.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY);
    const hit = e.target.closest && e.target.closest('a,button,.card,input,textarea,label'), drag = !hit && App.stageActive && mgr && e.target.closest && e.target.closest('#stage');
    c.classList.toggle('is-link', !!hit); c.classList.toggle('is-drag', !!drag);
    const next = drag ? t('cursor.drag') : ''; if (next !== label) { label = next; c.textContent = next; }
  }, { passive: true });
  doc.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  const mags = $$('[data-magnetic]');
  window.addEventListener('pointermove', (e) => mags.forEach((el) => {
    const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), reach = Math.max(r.width, r.height) / 2 + 48;
    if (Math.hypot(dx, dy) < reach) { el._m = true; gsap.to(el, { x: dx * 0.22, y: dy * 0.3, duration: MOTION.duration.base * 0.7, ease: 'power3.out', overwrite: 'auto' }); }
    else if (el._m) { el._m = false; gsap.to(el, { x: 0, y: 0, duration: MOTION.duration.slow, ease: 'elastic.out(1,.4)', overwrite: 'auto' }); }
  }), { passive: true });
}

/* ---------- Scene 03 controls ---------- */
function initStageControls() {
  const rot = $('#btnRotate'), gy = $('#btnGyro'), rec = $('#btnRecenter');
  if (!mgr) { rot.hidden = true; rec.hidden = true; return; }
  rec.addEventListener('click', () => { mgr.cam.recenter(); mgr.interaction.clear(); });
  rot.addEventListener('click', () => { mgr.cam.auto = !mgr.cam.auto; rot.setAttribute('aria-pressed', String(mgr.cam.auto)); mgr.invalidate(); });
  if (App.reduced) rot.hidden = true;
  if (mqCoarse.matches && 'DeviceOrientationEvent' in window && !App.reduced) {
    gy.hidden = false;
    gy.addEventListener('click', async () => {
      const msg = $('#gyroMsg');
      if (mgr.gesture.gyroOn) { mgr.gesture.disableGyro(); gy.setAttribute('aria-pressed', 'false'); return; }
      const ok = await mgr.gesture.enableGyro();
      gy.setAttribute('aria-pressed', String(ok)); msg.textContent = ok ? t('sky.gyro.on') : t('sky.gyro.denied');
      if (!ok) { gy.hidden = true; }
    });
  }
}

/* ---------- 3D boot with graceful fallback ---------- */
function boot3D() {
  const cap = DeviceCapabilityManager.detect(); window.ICONIC_TIER = cap.tier;
  if (!hasTHREE() || cap.tier === 'low') { root.classList.add('no-webgl'); return null; }
  let m = null;
  try {
    m = new SceneManager($('#gl'), cap);
    m.onFallback = () => { m.destroy(); mgr = null; root.classList.add('no-webgl'); applyI18n(); };
    m.init(); m.scroll = { p: 0, selectedAt: 0 };
    m.interaction = new InteractionController(m, $('#hsLayer'), $('#hsList'), $('#hsCard'));
    m.gesture = new GestureController($('#stage'), m.cam, (x, y) => m.interaction.click(x, y), () => track('interactive_scene_engaged'));
  } catch (err) {
    console.warn('[ICONIC] 3D scene disabled, using the static hero:', err);
    try { if (m) m.destroy(); } catch (_) { /* ignore */ }
    root.classList.add('no-webgl'); return null;
  }
  return m;
}
function bootStaticHotspots() {
  /* without WebGL the skyline points still exist as real HTML: a list plus the same detail card */
  const stub = { env: { anchors: ANCHOR_DEF.map(() => ({ x: 0, z: 0, h: 0 })) }, cam: { flyTo() {}, release() {} }, scroll: { p: 0 }, invalidate() {}, canvas: $('#gl'), camera: null };
  const ic = new InteractionController(stub, $('#hsLayer'), $('#hsList'), $('#hsCard'));
  return ic;
}

/* ---------- main ---------- */
function main() {
  root.classList.remove('no-js');
  const gs = hasGSAP();
  if (!gs) root.classList.remove('intro-on'); else { root.classList.add('motion-ready'); gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  App.reduced = mqReduced.matches; root.classList.toggle('reduced', App.reduced);
  Emblem.lockup($('#brandMark'), 'solid'); Emblem.lockup($('#footLogo'), 'solid'); Emblem.build($('#emptyArt'), 'static');
  const mbar = $('#mbar'); if (root.classList.contains('intro-on')) mbar.classList.add('is-off');
  mgr = boot3D();
  if (!mgr) { const ic = bootStaticHotspots(); $('#hsLayer').hidden = true; window.__staticIC = ic; }
  if (SERVER) seedServerContent();
  initTeams(); applyI18n(); initNav(); initDetail(); initForm(); initStageControls(); ScrollAnimationController.init(); initMicro();
  new IntersectionObserver(([en]) => mbar.classList.toggle('is-off', en.isIntersecting || root.classList.contains('intro-on')), { threshold: 0.15 }).observe($('#contact'));
  doc.addEventListener('intro:done', () => { mbar.classList.remove('is-off'); setTimeout(settleHero, 2600); });
  $('#replayIntro').addEventListener('click', () => { if (App.introRunning || !gs || App.reduced) return; window.scrollTo(0, 0); mbar.classList.add('is-off'); Intro.play(); });
  mqReduced.addEventListener && mqReduced.addEventListener('change', () => { App.reduced = mqReduced.matches; root.classList.toggle('reduced', App.reduced); if (mgr) mgr.invalidate(); });
  /* the intro starts as soon as the display font is ready (never longer than 600 ms) and never blocks the page */
  const fontsReady = doc.fonts && doc.fonts.ready ? Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 600))]) : Promise.resolve();
  /* the intro always starts at the top. A reload can hand the page its old scroll position late (browser or ScrollTrigger restore),
     so until the visitor scrolls on purpose or the intro ends, any jump away from the top is undone */
  let holdTop = root.classList.contains('intro-on');
  const backToTop = () => { if (holdTop && window.scrollY > 0) window.scrollTo(0, 0); };
  const releaseTop = () => { holdTop = false; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((n) => window.addEventListener(n, releaseTop, { once: true, passive: true }));
  doc.addEventListener('intro:done', releaseTop);
  window.addEventListener('scroll', backToTop, { passive: true });
  window.addEventListener('load', backToTop);
  backToTop();
  fontsReady.then(() => { if (root.classList.contains('intro-on')) Intro.play(); else heroEnter(); });
  setTimeout(() => { if (!App.introRunning && gs) { gsap.set($$('#hero-title .k-char'), { clearProps: 'all' }); gsap.set(heroParts(), { clearProps: 'opacity,transform' }); } }, 9000);
  initStore();
}

