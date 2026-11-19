/* ==========================================================================
   10 — logo rendering. The geometry (LOGO, 05-logo.js) is a vector tracing of the
   supplied ICONIC logo. One source feeds the header and footer lockups, the intro
   line-draw, the particle targets and the decorative background art.
   ========================================================================== */
const Emblem = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs, parent) => { const n = doc.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const EO = 'evenodd';

  /* The emblem: a solid fill (outer shape with the fin slits as holes) plus one outline per contour, so the intro and the
     story can draw it line by line. mode 'draw' starts hidden; 'static' is line art only (decorative backgrounds). */
  function addMark(parent, mode) {
    const hidden = mode === 'draw', out = { fill: null, lines: [] };
    const g = el('g', { class: 'lg-mark' }, parent);
    if (mode !== 'static') out.fill = el('path', { d: LOGO.mark.c.join(' '), 'fill-rule': EO, class: 'lg-fill', opacity: hidden ? 0 : 1 }, g);
    LOGO.mark.c.forEach((d) => out.lines.push(el('path', { d, class: 'lg-line', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': hidden ? 1 : 0 }, g)));
    return out;
  }
  /* emblem only */
  function build(svg, mode) {
    svg.textContent = '';
    svg.setAttribute('viewBox', LOGO.mark.box.join(' '));
    return addMark(svg, mode);
  }
  /* the full lockup: emblem + ICONIC + REAL ESTATE, exactly as supplied. mode 'solid' (static) or 'draw' (intro, hidden) */
  function lockup(svg, mode) {
    svg.textContent = '';
    svg.setAttribute('viewBox', LOGO.box.join(' '));
    if (mode !== 'draw') {
      const g = el('g', { class: 'lg' }, svg);
      el('path', { d: LOGO.mark.c.join(' '), 'fill-rule': EO, class: 'lg-fill' }, g);
      const w = el('g', { class: 'lg-word' }, g); LOGO.word.forEach((l) => el('path', { d: l.d, 'fill-rule': EO }, w));
      el('path', { d: LOGO.sub.d, 'fill-rule': EO, class: 'lg-sub' }, g);
      return {};
    }
    const out = addMark(svg, 'draw');
    const top = Math.min(...LOGO.word.map((l) => l.b[1])) - 3, bottom = Math.max(...LOGO.word.map((l) => l.b[3])) + 3;
    const defs = el('defs', {}, svg), cp = el('clipPath', { id: 'lgWordClip' }, defs);
    el('rect', { x: LOGO.box[0], y: top, width: LOGO.box[2], height: bottom - top }, cp);
    const w = el('g', { class: 'lg-word', 'clip-path': 'url(#lgWordClip)' }, svg);
    out.letters = LOGO.word.map((l) => el('path', { d: l.d, 'fill-rule': EO }, w));
    out.rise = bottom - top + 6;
    out.sub = el('path', { d: LOGO.sub.d, 'fill-rule': EO, class: 'lg-sub', opacity: 0 }, svg);
    return out;
  }
  /* sample points along the drawn outlines (logo space) for the particle assembly */
  function points(refs, n) {
    const lens = refs.lines.map((p) => p.getTotalLength()), total = lens.reduce((a, b) => a + b, 0), pts = [];
    refs.lines.forEach((p, i) => {
      const k = Math.max(2, Math.round(n * lens[i] / total));
      for (let j = 0; j < k; j++) { const q = p.getPointAtLength(lens[i] * j / k); pts.push({ x: q.x, y: q.y }); }
    });
    return pts;
  }
  return { build, lockup, points };
})();

/* Kinetic type: words are masked, characters rise. Arabic is split by word only so letter joining is never broken. */
function splitKinetic(node, text) {
  node.setAttribute('aria-label', text);
  node.textContent = '';
  const units = [], words = text.split(' '), joined = App.lang === 'ar';
  words.forEach((w, i) => {
    const wrap = doc.createElement('span'); wrap.className = 'k-word'; wrap.setAttribute('aria-hidden', 'true');
    if (joined) { wrap.classList.add('k-word--open'); const s = doc.createElement('span'); s.className = 'k-char'; s.textContent = w; wrap.appendChild(s); units.push(s); }
    else for (const ch of w) { const s = doc.createElement('span'); s.className = 'k-char'; s.textContent = ch; wrap.appendChild(s); units.push(s); }
    node.appendChild(wrap);
    if (i < words.length - 1) node.appendChild(doc.createTextNode(' '));
  });
  return units;
}
