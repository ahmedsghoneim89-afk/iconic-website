/* ==========================================================================
   20 — Scene 01: signature intro (SVG path draw, particle assembly, masked
   kinetic wordmark, light sweep, camera-style push-through). Skippable at any
   moment; any scroll or key also skips it; header stays above it.
   ========================================================================== */
const heroParts = () => ['#heroSupport', '#heroCta', '#heroScroll'];
let heroEntered = false;
/* Latin titles rise out of a mask. Arabic is never masked (its tall strokes and marks would be clipped): it fades up instead. */
const kinHidden = () => (App.lang === 'ar' ? { opacity: 0, y: 36 } : { yPercent: 112 });
const kinShown = () => (App.lang === 'ar' ? { opacity: 1, y: 0 } : { yPercent: 0 });
function heroEnter() {
  if (heroEntered || !hasGSAP() || App.reduced) return;
  heroEntered = true;
  const chars = $$('#hero-title .k-char'), ar = App.lang === 'ar';
  gsap.fromTo(chars, kinHidden(), Object.assign({
    duration: MOTION.duration.cinematic * (ar ? 0.6 : 0.8), ease: MOTION.ease.emphasized, stagger: ar ? MOTION.stagger.loose : MOTION.stagger.tight, overwrite: true,
    onComplete: () => gsap.set(chars, { clearProps: 'transform,opacity' })
  }, kinShown()));
  gsap.fromTo(heroParts(), { opacity: 0, y: MOTION.reveal.distance }, { opacity: 1, y: 0, duration: MOTION.duration.slow, ease: MOTION.ease.standard, stagger: MOTION.delay.base, delay: 0.55, overwrite: true, clearProps: 'transform' });
}
function heroHide() {
  if (!hasGSAP()) return;
  heroEntered = false;
  gsap.set($$('#hero-title .k-char'), kinHidden());
  gsap.set(heroParts(), { opacity: 0 });
}
/* safety net: whatever happened during the intro, the headline must end fully visible */
function settleHero() {
  if (!hasGSAP() || !heroEntered) return;
  const chars = $$('#hero-title .k-char');
  if (chars.length && !gsap.isTweening(chars[0])) gsap.set(chars, { clearProps: 'transform,opacity' });
}

const Intro = (() => {
  let tl = null, raf = 0, parts = null, handlers = null;
  const el = $('#intro'), stage = $('#introStage'), skipBtn = $('#skipIntro');

  function particleCount() {
    const tier = (window.ICONIC_TIER || 'balanced');
    return tier === 'high' ? 280 : (mqMobile.matches ? 110 : 170);
  }
  function runParticles(refSvg, refs) {
    const cv = $('#introParticles'), dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = refSvg.getBoundingClientRect(), vb = LOGO.box, pts = Emblem.points(refs, particleCount() * 2);
    const n = Math.min(particleCount(), pts.length);
    parts = [];
    for (let i = 0; i < n; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      const ang = Math.random() * Math.PI * 2, rad = Math.max(W, H) * (0.35 + Math.random() * 0.4);
      parts.push({ sx: W / 2 + Math.cos(ang) * rad, sy: H / 2 + Math.sin(ang) * rad,
        tx: r.left + (p.x - vb[0]) / vb[2] * r.width, ty: r.top + (p.y - vb[1]) / vb[3] * r.height,
        d: Math.random() * 0.7, dur: 1.4 + Math.random() * 0.9, s: 0.8 + Math.random() * 1.5 });
    }
    const t0 = performance.now();
    const frame = (now) => {
      const el_ = (now - t0) / 1000; ctx.clearRect(0, 0, W, H);
      const fade = clamp(1 - (el_ - 1.9) / 0.9, 0, 1);
      if (fade <= 0) { raf = 0; return; }
      ctx.fillStyle = '#e0cb97';
      for (const p of parts) {
        const k = clamp((el_ - p.d) / p.dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
        ctx.globalAlpha = (0.25 + 0.75 * k) * fade;
        ctx.beginPath(); ctx.arc(lerp(p.sx, p.tx, e), lerp(p.sy, p.ty, e), p.s, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function stopParticles() { if (raf) cancelAnimationFrame(raf); raf = 0; const cv = $('#introParticles'); const c = cv.getContext('2d'); if (c) c.clearRect(0, 0, cv.width, cv.height); }

  function bindSkip() {
    const any = (e) => { if (e.type === 'keydown' && !['Escape', ' ', 'Enter', 'PageDown', 'ArrowDown', 'End'].includes(e.key)) return; skip(); };
    handlers = [['wheel', any], ['touchmove', any], ['keydown', any]];
    handlers.forEach(([n, h]) => window.addEventListener(n, h, { passive: true }));
  }
  function unbindSkip() { if (handlers) handlers.forEach(([n, h]) => window.removeEventListener(n, h)); handlers = null; }

  function finish() {
    unbindSkip(); stopParticles();
    root.classList.remove('intro-on');
    if (hasGSAP()) gsap.set([el, stage], { clearProps: 'all' });
    App.introRunning = false;
    doc.dispatchEvent(new CustomEvent('intro:done'));
  }
  function skip() {
    if (!App.introRunning) return;
    App.introRunning = false;
    if (tl) tl.kill();
    unbindSkip(); stopParticles();
    heroEnter();
    gsap.to(stage, { scale: 1.12, opacity: 0, duration: MOTION.duration.fast, ease: MOTION.ease.standard });
    gsap.to(el, { opacity: 0, duration: MOTION.duration.base * 0.6, ease: MOTION.ease.standard, onComplete: finish });
  }

  function play() {
    if (!hasGSAP() || App.reduced) { finish(); return; }
    App.introRunning = true; root.classList.add('intro-on');
    const svg = $('#introEmblem'), refs = Emblem.lockup(svg, 'draw'), sweep = $('#introSweep');
    gsap.set([el, stage], { clearProps: 'all' });
    gsap.set(refs.letters, { y: refs.rise });
    gsap.set(sweep, { xPercent: -260, skewX: -20, opacity: 0 });
    heroHide();
    bindSkip();
    runParticles(svg, refs);
    const E = MOTION.ease, D = MOTION.duration;
    tl = gsap.timeline({ defaults: { ease: E.standard }, onComplete: finish });
    tl.to(refs.lines, { strokeDashoffset: 0, duration: 1.2, ease: E.inOut, stagger: { each: 0.04, from: 'start' } }, 0.25)
      .to(refs.fill, { opacity: 1, duration: 0.9 }, 1.75)
      .to(refs.letters, { y: 0, duration: D.slow, ease: E.emphasized, stagger: MOTION.stagger.base }, 1.7)
      .to(refs.sub, { opacity: 1, duration: D.slow * 0.8 }, 2.7)
      .set(sweep, { opacity: 1 }, 2.4)
      .to(sweep, { xPercent: 700, duration: 1.3, ease: E.inOut }, 2.4)
      .to(stage, { scale: 1.55, opacity: 0, duration: D.slow, ease: 'power2.in' }, 3.7)
      .to(el, { opacity: 0, duration: D.slow * 0.9, ease: 'power1.in' }, 3.85)
      .add(heroEnter, 3.9);
  }
  skipBtn.addEventListener('click', skip);
  return { play, skip };
})();
