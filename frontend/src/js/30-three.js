/* ==========================================================================
   30 — Three.js subsystem. Independent of the page: it only needs a canvas,
   a camera-progress input, and callbacks. Modules:
   DeviceCapabilityManager, PerformanceMonitor, AssetLoader, LightingSystem,
   EnvironmentManager, CameraController, GestureController, InteractionController,
   SceneManager (+ ScrollAnimationController in 40-ui.js).
   The city is procedural: no GLB assets were supplied, so AssetLoader only
   tracks disposables and is where a GLTF/Draco/KTX2 loader plugs in later.
   ========================================================================== */
const TOWER = { z: -240, scale: 0.55 };      // scale: world units per logo pixel (the tower is the logo, extruded)
const FOG_HEX = '#2a2229';
const canTween = () => hasGSAP() && !App.reduced;
const CITY = { pitch: 26, rows: 8, zStart: 400, zCount: 35, avenueHalf: 20 };
const PATH_PTS = [[0, 190, 360], [-18, 140, 270], [16, 92, 180], [-10, 52, 100], [8, 34, 34], [-5, 32, -30], [3, 38, -78]];
const LOOK_PTS = [[0, 70, -120], [0, 62, -150], [4, 56, -190], [0, 60, -215], [0, 70, -232], [0, 78, -238], [0, 74, -240]];
const ANCHOR_DEF = [{ side: -1, j: 10, h: 104 }, { side: 1, j: 13, h: 118 }, { side: -1, j: 16, h: 126 }, { side: 1, j: 19, h: 112 }];
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const DeviceCapabilityManager = {
  detect() {
    let webgl = false, renderer = '';
    try {
      const c = doc.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        webgl = true;
        const x = gl.getExtension('WEBGL_debug_renderer_info');
        if (x) renderer = String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL) || '');
        const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext();
      }
    } catch (e) { /* no WebGL */ }
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    const coarse = mqCoarse.matches, soft = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let tier = 'balanced';
    if (!webgl || soft || saveData || mem <= 2 || cores <= 2) tier = 'low';
    else if (!coarse && cores >= 6 && mem >= 4) tier = 'high';
    return { webgl, renderer, mem, cores, coarse, soft, tier, mobile: mqMobile.matches };
  },
  profile(cap) {
    if (cap.tier === 'high') return { dpr: 2, density: 1, clouds: 14, antialias: true, windows: 1 };
    return cap.mobile ? { dpr: 1.25, density: 0.5, clouds: 5, antialias: false, windows: 0.9 }
                      : { dpr: 1.5, density: 0.62, clouds: 8, antialias: false, windows: 1 };
  }
};

class PerformanceMonitor {
  constructor(onDegrade) { this.onDegrade = onDegrade; this.level = 0; this.warm = 0; this.samples = []; this.fps = 60; }
  tick(dt) {                                      // dt is the raw frame time: tab switches, throttled frames and hitches are not sustained load
    if (dt > 0.25) { this.warm = Math.max(0, this.warm - 30); this.samples.length = 0; return; }
    if (++this.warm < 90) return;
    this.samples.push(dt);
    if (this.samples.length >= 90) {
      this.fps = 1 / (this.samples.reduce((a, b) => a + b, 0) / this.samples.length);
      this.samples.length = 0;
      /* each step down needs a clearly worse frame rate; the static fallback only when the scene is truly unusable */
      if (this.fps < [26, 20, 12][Math.min(this.level, 2)]) { this.level++; this.warm = 0; this.onDegrade(this.level, this.fps); }
    }
  }
}

class AssetLoader {
  constructor() { this.items = new Set(); }
  track(o) { this.items.add(o); return o; }
  disposeAll() { this.items.forEach((o) => { if (o && o.dispose) o.dispose(); }); this.items.clear(); }
}

/* Procedural window shader injected into MeshStandardMaterial: constant-size lit windows in world space. */
function makeCityMaterial(opts, assets) {
  const m = new THREE.MeshStandardMaterial({ color: opts.color || 0xffffff, metalness: opts.metal, roughness: opts.rough });
  const uni = { value: opts.win };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWin = uni;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm; varying vec2 vBld;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vWNrm = objectNormal;
        #ifdef USE_INSTANCING
          vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vBld = instanceMatrix[3].xz;
        #else
          vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vBld = modelMatrix[3].xz;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec3 vWNrm; varying vec2 vBld; uniform float uWin;
        float hsh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 nA = abs(vWNrm);
          float sideF = step(nA.y, 0.5) * step(2.0, vWPos.y);
          float u = mix(vWPos.x, vWPos.z, step(nA.z, nA.x));
          float bs = hsh(floor(vBld) * 0.017);
          vec2 cell = vec2(u / (2.5 + bs * 1.8), vWPos.y / 3.4);
          vec2 id = floor(cell), fr = fract(cell);
          float win = smoothstep(.1, .2, fr.x) * smoothstep(.9, .8, fr.x) * smoothstep(.14, .24, fr.y) * smoothstep(.86, .76, fr.y);
          float rr = hsh(id + floor(vBld) * 0.07);
          float lit = step(1.0 - (.16 + bs * .34), rr);
          float tone = hsh(id * 2.3 + bs);
          vec3 warm = mix(vec3(1.0, .70, .36), vec3(.78, .88, 1.0), step(.82, tone));
          totalEmissiveRadiance += warm * win * lit * sideF * (.55 + .45 * hsh(id * 1.7)) * uWin;
        }`);
  };
  m.customProgramCacheKey = () => 'iconic-city-win';
  assets.track(m);
  return m;
}

class LightingSystem {
  constructor(scene) {
    this.hemi = new THREE.HemisphereLight(0x6e7fae, 0x140f0b, 0.7);
    this.sun = new THREE.DirectionalLight(0xffc58a, 1.25); this.sun.position.set(-120, 70, -260);
    this.glow = new THREE.PointLight(0xffb870, 1.5, 200, 1.6); this.glow.position.set(0, 18, TOWER.z + 44);
    scene.add(this.hemi, this.sun, this.glow);
  }
}

class EnvironmentManager {
  constructor(scene, renderer, cfg, assets) {
    this.scene = scene; this.renderer = renderer; this.cfg = cfg; this.assets = assets;
    this.clouds = []; this.cityItems = []; this.anchors = [];
    this.buildSky(); this.buildEnv(); this.buildGround(); this.buildCity(); this.buildTower(); this.buildClouds();
  }
  buildSky() {
    const c = doc.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    [[0, '#04060d'], [.26, '#0c1325'], [.43, '#262a40'], [.47, '#7d5848'], [.492, '#d99c5f'], [.499, '#4a3733'], [.506, FOG_HEX], [1, FOG_HEX]].forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    const glow = g.createRadialGradient(256, 238, 0, 256, 238, 260);        // u = .25 faces -z: behind the ICONIC tower
    glow.addColorStop(0, 'rgba(255,176,96,.62)'); glow.addColorStop(.4, 'rgba(214,128,80,.22)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow; g.fillRect(0, 0, 1024, 512);
    this.sky = this.assets.track(new THREE.CanvasTexture(c));
    this.sky.mapping = THREE.EquirectangularReflectionMapping; this.sky.encoding = THREE.sRGBEncoding;
    this.scene.background = this.sky;
    this.scene.fog = new THREE.FogExp2(FOG_HEX, 0.0021);
  }
  buildEnv() {                                                   // also called again after a WebGL context restore
    if (this.envRT) this.envRT.dispose();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pm.fromEquirectangular(this.sky); pm.dispose();
    this.scene.environment = this.envRT.texture;
  }
  buildGround() {
    const g = this.assets.track(new THREE.PlaneGeometry(8000, 8000));        // reaches past the far plane, so no ground edge is ever visible
    const m = this.assets.track(new THREE.MeshStandardMaterial({ color: 0x0a0a0d, metalness: 0.6, roughness: 0.4 }));
    const mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2; this.scene.add(mesh);
    const lg = this.assets.track(new THREE.BoxGeometry(0.45, 0.12, 900));
    const lm = this.assets.track(new THREE.MeshBasicMaterial({ color: 0xc8a96a }));
    [-18.6, 18.6].forEach((x) => { const l = new THREE.Mesh(lg, lm); l.position.set(x, 0.08, -40); this.scene.add(l); });
  }
  generateCity() {
    const rnd = mulberry32(20241118), items = [];
    for (let j = 0; j < CITY.zCount; j++) {
      const z0 = CITY.zStart - j * CITY.pitch;
      for (const side of [-1, 1]) for (let r = 0; r < CITY.rows; r++) {
        const xc = side * (CITY.avenueHalf + 14 + r * 24);
        if (Math.abs(z0 - TOWER.z) < 44 && Math.abs(xc) < 132) { rnd(); rnd(); rnd(); rnd(); rnd(); rnd(); continue; }
        const w = 13 + rnd() * 9, d = 13 + rnd() * 9, x = xc + (rnd() - 0.5) * 5, z = z0 + (rnd() - 0.5) * 5;
        let h = (30 + rnd() * 75) * (1 + 0.06 * r); if (rnd() < 0.07) h *= 1.7;
        h = Math.min(h, 170); if (Math.abs(z - TOWER.z) < 130) h = Math.min(h, 120);
        const it = { x, z, w, d, h, imp: r + rnd() * 0.5, anchor: null, tone: rnd(), tone2: rnd() };
        const a = ANCHOR_DEF.findIndex((q) => q.side === side && q.j === j);
        if (a >= 0 && r === 0) { it.w = 18; it.d = 18; it.x = side * 31; it.z = z0; it.h = ANCHOR_DEF[a].h; it.imp = -1; it.anchor = a; }
        items.push(it);
      }
    }
    return items.sort((p, q) => p.imp - q.imp);
  }
  buildCity() {
    const items = this.cityItems = this.generateCity();
    const geo = this.assets.track(new THREE.BoxGeometry(1, 1, 1)); geo.translate(0, 0.5, 0);
    const mat = makeCityMaterial({ metal: 0.7, rough: 0.35, win: 1.5 * this.cfg.windows }, this.assets);
    const mesh = this.city = new THREE.InstancedMesh(geo, mat, items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    items.forEach((it, i) => {
      m4.compose(p.set(it.x, 0, it.z), q, s.set(it.w, it.h, it.d)); mesh.setMatrixAt(i, m4);
      col.setHSL(0.58 + it.tone * 0.08, 0.1 + it.tone2 * 0.15, 0.1 + it.tone * 0.16); mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false;
    this.setDensity(this.cfg.density);
    this.scene.add(mesh);
    this.anchors = ANCHOR_DEF.map((_, a) => items.find((it) => it.anchor === a));
  }
  setDensity(d) { this.city.count = Math.max(ANCHOR_DEF.length, Math.floor(this.cityItems.length * d)); }
  /* The landmark is the logo itself, extruded: a gold front plate (the logo's solid shape, its fin slits cut through as windows),
     three glass volumes behind it with the logo's sloped roofs, and the crescent as a low plinth. Geometry comes from LOGO.tower. */
  buildTower() {
    const T = LOGO.tower, S = TOWER.scale, grp = this.tower = new THREE.Group(); grp.position.set(0, 0, TOWER.z);
    const X = (px) => (px - T.cx) * S, Y = (py) => (T.base - py) * S, V = (q) => new THREE.Vector2(X(q[0]), Y(q[1]));
    const orient = (pts, cw) => (THREE.ShapeUtils.isClockWise(pts) === cw ? pts : pts.slice().reverse());
    const glass = makeCityMaterial({ color: 0x1c212b, metal: 0.9, rough: 0.18, win: 1.9 * this.cfg.windows }, this.assets);
    const gold = this.assets.track(new THREE.MeshStandardMaterial({ color: 0xb48a3e, metalness: 0.72, roughness: 0.36, emissive: 0x7a5820, emissiveIntensity: 0.6, fog: false }));   // the landmark stays gold through the haze
    const add = (geo, mat) => { this.assets.track(geo); const m = new THREE.Mesh(geo, mat); grp.add(m); return m; };
    /* glass volumes (upper tier, main tier, lower step), front faces on z = 0; the upper tier sits 3 units back so overlapping faces never fight */
    const depth = [26, 46, 32];
    T.tiers.forEach((poly, i) => {
      const geo = new THREE.ExtrudeGeometry(new THREE.Shape(poly.map(V)), { depth: depth[i], bevelEnabled: false, steps: 1 });
      geo.translate(0, 0, -depth[i] - (i === 0 ? 3 : 0)); add(geo, glass);
    });
    /* front plate with the slits as holes */
    const plate = new THREE.Shape(orient(T.sil.map(V), true));
    T.holes.forEach((h) => plate.holes.push(new THREE.Path(orient(h.map(V), false))));
    const pg = new THREE.ExtrudeGeometry(plate, { depth: 1.8, bevelEnabled: false, steps: 1 }); pg.translate(0, 0, 0.05); add(pg, gold);
    /* crescent plinth, lying flat: the logo's lower arc is its front edge, tapering to a point at both tips */
    const lower = T.arc.map(([x, y]) => new THREE.Vector2(X(x), (y - T.base) * S));
    const half = (T.arc[T.arc.length - 1][0] - T.arc[0][0]) / 2 * S, mid = (T.arc[0][0] + T.arc[T.arc.length - 1][0]) / 2;
    const upper = lower.map((q) => { const u = (q.x / S + T.cx - mid) / (half / S); return new THREE.Vector2(q.x, q.y - 50 * Math.max(0, 1 - u * u)); }).reverse();
    const lg = new THREE.ExtrudeGeometry(new THREE.Shape(lower.concat(upper)), { depth: 1.3, bevelEnabled: false, steps: 1 });
    lg.rotateX(Math.PI / 2); lg.translate(0, 1.3, 0); add(lg, gold);
    this.scene.add(grp);
    this.towerMeshes = grp.children.filter((c) => c.isMesh);
  }
  buildClouds() {
    const c = doc.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rnd = mulberry32(7);
    for (let i = 0; i < 11; i++) {
      const x = 40 + rnd() * 176, y = 80 + rnd() * 96, r = 36 + rnd() * 52, rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    }
    this.cloudTex = this.assets.track(new THREE.CanvasTexture(c)); this.cloudTex.encoding = THREE.sRGBEncoding;
    this.cloudGroup = new THREE.Group();
    for (let i = 0; i < this.cfg.clouds; i++) {
      const sm = this.assets.track(new THREE.SpriteMaterial({ map: this.cloudTex, color: 0xf0c8a4, transparent: true, opacity: 0.14 + rnd() * 0.14, depthWrite: false, fog: false }));
      const sp = new THREE.Sprite(sm), w = 150 + rnd() * 200;
      sp.scale.set(w, w * 0.45, 1); sp.position.set((rnd() - 0.5) * 640, 85 + rnd() * 160, (rnd() - 0.5) * 760);
      sp.userData.speed = 1 + rnd() * 2; this.cloudGroup.add(sp);
    }
    this.scene.add(this.cloudGroup);
  }
  update(dt) {
    if (App.reduced || !this.cloudGroup.visible) return;
    this.cloudGroup.children.forEach((sp) => { sp.position.x += sp.userData.speed * dt; if (sp.position.x > 340) sp.position.x = -340; });
  }
  dispose() { if (this.envRT) this.envRT.dispose(); this.assets.disposeAll(); }
}

class CameraController {
  constructor(camera, onChange) {
    this.camera = camera; this.onChange = onChange;
    this.path = new THREE.CatmullRomCurve3(PATH_PTS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
    this.look = new THREE.CatmullRomCurve3(LOOK_PTS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
    this.progress = 0; this.smooth = 0;
    this.user = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
    this.par = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
    this.gyro = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
    this.focus = { blend: 0, pos: new THREE.Vector3(), look: new THREE.Vector3() };
    this.auto = false; this.kick = 0; this.baseFov = 50;
    this.vPos = new THREE.Vector3(); this.vLook = new THREE.Vector3(); this.d = new THREE.Vector3(); this.r = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.lastPos = new THREE.Vector3(); this.lastQ = new THREE.Quaternion();
  }
  setAspect(a) { this.baseFov = a < 0.9 ? 66 : (a < 1.3 ? 58 : 50); this.camera.aspect = a; this.camera.fov = this.baseFov; this.camera.updateProjectionMatrix(); }
  setProgress(p) { this.progress = clamp(p, 0, 1); this.onChange(); }
  kickFov(v) { this.kick = Math.max(this.kick, v); }
  steer(dx, dy, useY) {
    const M = MOTION.camera;
    this.user.tyaw = clamp(this.user.tyaw + dx * 0.0042, -M.maxYaw, M.maxYaw);
    if (useY) this.user.tpitch = clamp(this.user.tpitch + dy * 0.003, -M.maxPitch, M.maxPitch);
    this.onChange();
  }
  recenter() { this.user.tyaw = 0; this.user.tpitch = 0; this.onChange(); }
  flyTo(pos, look, instant) {
    const f = this.focus; gsap.killTweensOf(f); gsap.killTweensOf(f.pos); gsap.killTweensOf(f.look);
    const inst = instant || !canTween(), tick = () => this.onChange();
    if (f.blend > 0.98 && !inst) {
      gsap.to(f.pos, { x: pos.x, y: pos.y, z: pos.z, duration: MOTION.camera.flyTo, ease: MOTION.camera.flyEase, onUpdate: tick });
      gsap.to(f.look, { x: look.x, y: look.y, z: look.z, duration: MOTION.camera.flyTo, ease: MOTION.camera.flyEase });
    } else {
      f.pos.copy(pos); f.look.copy(look);
      if (inst) { f.blend = 1; this.onChange(); } else gsap.to(f, { blend: 1, duration: MOTION.camera.flyTo, ease: MOTION.camera.flyEase, onUpdate: tick });
    }
  }
  release() {
    const f = this.focus; gsap.killTweensOf(f); gsap.killTweensOf(f.pos); gsap.killTweensOf(f.look);
    if (!canTween()) { f.blend = 0; this.onChange(); } else gsap.to(f, { blend: 0, duration: MOTION.camera.flyTo * 0.8, ease: MOTION.camera.flyEase, onUpdate: () => this.onChange() });
  }
  /* returns true while the view is still changing (lets reduced-motion mode stop rendering when idle) */
  update(dt, time) {
    const M = MOTION.camera, S = MOTION.spring, inst = App.reduced;
    this.smooth = inst ? this.progress : damp(this.smooth, this.progress, S.camera, dt);
    const u = clamp(this.smooth, 0, 1);
    this.path.getPointAt(u, this.vPos); this.look.getPointAt(u, this.vLook);
    if (this.focus.blend > 0.0001) { this.vPos.lerp(this.focus.pos, this.focus.blend); this.vLook.lerp(this.focus.look, this.focus.blend); }
    const k = inst ? 1e3 : S.camera * 1.3;
    this.user.yaw = damp(this.user.yaw, this.user.tyaw, k, dt); this.user.pitch = damp(this.user.pitch, this.user.tpitch, k, dt);
    this.par.yaw = damp(this.par.yaw, this.par.tyaw, inst ? 1e3 : S.parallax, dt); this.par.pitch = damp(this.par.pitch, this.par.tpitch, inst ? 1e3 : S.parallax, dt);
    this.gyro.yaw = damp(this.gyro.yaw, this.gyro.tyaw, inst ? 1e3 : S.gyro, dt); this.gyro.pitch = damp(this.gyro.pitch, this.gyro.tpitch, inst ? 1e3 : S.gyro, dt);
    const yaw = this.user.yaw + this.par.yaw + this.gyro.yaw + (this.auto && !inst ? Math.sin(time * M.autoRotateSpeed) * 0.32 : 0);
    const pitch = this.user.pitch + this.par.pitch + this.gyro.pitch;
    this.d.copy(this.vLook).sub(this.vPos).applyAxisAngle(this.up, yaw);
    this.r.crossVectors(this.d, this.up).normalize(); this.d.applyAxisAngle(this.r, pitch);
    this.camera.position.copy(this.vPos); this.camera.lookAt(this.vPos.x + this.d.x, this.vPos.y + this.d.y, this.vPos.z + this.d.z);
    this.kick = damp(this.kick, 0, 3, dt);
    const fov = this.baseFov + this.kick;
    if (Math.abs(fov - this.camera.fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    this.camera.updateMatrixWorld(); this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();
    const moved = this.lastPos.distanceToSquared(this.camera.position) > 1e-5 || 1 - Math.abs(this.lastQ.dot(this.camera.quaternion)) > 1e-8 || this.kick > 0.02;
    this.lastPos.copy(this.camera.position); this.lastQ.copy(this.camera.quaternion);
    return moved || this.auto;
  }
}

/* Pointer drag, hero pointer parallax and optional gyroscope; vertical touch swipes are always left to the page. */
class GestureController {
  constructor(stage, cam, onClick, onEngage) {
    this.stage = stage; this.cam = cam; this.onClick = onClick; this.onEngage = onEngage;
    this.id = null; this.lx = 0; this.ly = 0; this.moved = 0; this.dragging = false; this.engaged = false; this.gyroOn = false; this.base = null;
    this.down = (e) => {
      if (!App.stageActive || (e.target.closest && e.target.closest('button,a,aside,input,label'))) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.id = e.pointerId; this.lx = e.clientX; this.ly = e.clientY; this.moved = 0; this.dragging = false;
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    };
    this.move = (e) => {
      if (e.pointerId !== this.id) return;
      const dx = e.clientX - this.lx, dy = e.clientY - this.ly; this.lx = e.clientX; this.ly = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      if (this.moved > 6) { if (!this.dragging) { this.dragging = true; stage.classList.add('is-dragging'); if (!this.engaged) { this.engaged = true; onEngage(); } } cam.steer(dx, dy, e.pointerType !== 'touch'); }
    };
    this.up = (e) => {
      if (e.pointerId !== this.id) return;
      const wasClick = !this.dragging && e.type === 'pointerup';
      this.id = null; this.dragging = false; stage.classList.remove('is-dragging');
      try { stage.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (wasClick) onClick(e.clientX, e.clientY);
    };
    stage.addEventListener('pointerdown', this.down); stage.addEventListener('pointermove', this.move);
    stage.addEventListener('pointerup', this.up); stage.addEventListener('pointercancel', this.up);
    this.pm = (e) => {
      if (App.reduced || !mqFine.matches || App.selected >= 0) { cam.par.tyaw = 0; cam.par.tpitch = 0; return; }
      const nx = (e.clientX / innerWidth - 0.5) * 2, ny = (e.clientY / innerHeight - 0.5) * 2, d = MOTION.camera.parallaxDeg * Math.PI / 180;
      cam.par.tyaw = -nx * d; cam.par.tpitch = -ny * d * 0.6; cam.onChange();
    };
    window.addEventListener('pointermove', this.pm, { passive: true });
    this.orient = (e) => {
      if (e.gamma == null) return;
      const max = MOTION.camera.gyroMaxDeg * Math.PI / 180;
      if (!this.base) this.base = { b: e.beta || 0 };
      cam.gyro.tyaw = clamp(-(e.gamma / 45), -1, 1) * max;
      cam.gyro.tpitch = clamp(((e.beta || 0) - this.base.b) / 45, -1, 1) * max * 0.6; cam.onChange();
    };
  }
  /* explicit activation only; resolves true when sensors answer, false when unavailable or refused */
  async enableGyro() {
    if (!('DeviceOrientationEvent' in window)) return false;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return false; }
    } catch (e) { return false; }
    this.base = null;
    return new Promise((resolve) => {
      let got = false;
      const probe = (e) => { if (e.gamma != null) { got = true; this.gyroOn = true; window.addEventListener('deviceorientation', this.orient); resolve(true); } window.removeEventListener('deviceorientation', probe); };
      window.addEventListener('deviceorientation', probe);
      setTimeout(() => { if (!got) { window.removeEventListener('deviceorientation', probe); resolve(false); } }, 1500);
    });
  }
  disableGyro() { window.removeEventListener('deviceorientation', this.orient); this.gyroOn = false; this.cam.gyro.tyaw = 0; this.cam.gyro.tpitch = 0; this.cam.onChange(); }
  dispose() {
    const s = this.stage; s.removeEventListener('pointerdown', this.down); s.removeEventListener('pointermove', this.move);
    s.removeEventListener('pointerup', this.up); s.removeEventListener('pointercancel', this.up);
    window.removeEventListener('pointermove', this.pm); this.disableGyro();
  }
}

/* Hotspots: DOM markers projected from 3D, raycast building picking, selection state. */
class InteractionController {
  constructor(mgr, layer, list, card) {
    this.mgr = mgr; this.layer = layer; this.list = list; this.card = card;
    const vec = (x, y, z) => hasTHREE() ? new THREE.Vector3(x, y, z) : { x, y, z };   // plain objects when WebGL is unavailable
    this.ray = hasTHREE() ? new THREE.Raycaster() : null; this.v = hasTHREE() ? new THREE.Vector3() : null; this.ndc = hasTHREE() ? new THREE.Vector2() : null;
    const env = mgr.env, a = env.anchors;
    this.spots = [{ top: vec(4.5, 208, TOWER.z), pos: vec(0, 100, -4), look: vec(4, 100, TOWER.z) }]
      .concat(a.map((it) => ({
        top: vec(it.x, it.h + 4, it.z),
        pos: vec(it.x * 0.2, clamp(it.h * 0.72, 55, 95), it.z + 105),
        look: vec(it.x, it.h * 0.68, it.z)
      })));
    this.markers = this.spots.map((s, i) => {
      const b = doc.createElement('button'); b.type = 'button'; b.className = 'hs'; b.dataset.i = i;
      b.innerHTML = '<i></i><b></b>'; b.addEventListener('click', () => this.select(i)); layer.appendChild(b); return b;
    });
    this.chips = this.spots.map((s, i) => {
      const li = doc.createElement('li'), b = doc.createElement('button'); b.type = 'button'; b.className = 'chip'; b.addEventListener('click', () => this.select(i));
      li.appendChild(b); list.appendChild(li); return b;
    });
    this.refreshLabels();
  }
  label(i) { const d = DATA.hotspots[i]; return i === 0 ? t('hs.brand.title') : (d && L(d.label)) || (REGIONS[i - 1] ? regionName(REGIONS[i - 1].id) : t('hs.slot.title', { n: i + 1 })); }
  linked(i) { return i === 0 || !!REGIONS[i - 1] || !!DATA.hotspots[i]; }
  refreshLabels() {
    this.spots.forEach((s, i) => {
      const l = this.label(i); this.markers[i].setAttribute('aria-label', l); this.markers[i].querySelector('b').textContent = l;
      this.markers[i].dataset.linked = String(this.linked(i)); this.chips[i].textContent = l;
    });
    if (App.selected >= 0) this.renderCard(App.selected);
  }
  renderCard(i) {
    const c = this.card, d = DATA.hotspots[i], reg = i > 0 ? REGIONS[i - 1] : null; c.textContent = '';
    const h = doc.createElement('h3'); h.textContent = this.label(i);
    const p = doc.createElement('p'); p.textContent = i === 0 ? t('hs.brand.text') : (d && L(d.text)) || (reg ? t('hs.region.text', { region: regionName(reg.id) }) : t('hs.slot.text'));
    const row = doc.createElement('div'); row.className = 'cta-row';
    const href = i === 0 ? (DATA.layout.about ? '#about' : '') : (d && safeHref(d.href));
    const add = (text, cls, fn) => { const b = doc.createElement('button'); b.type = 'button'; b.className = 'btn btn--small ' + cls; b.textContent = text; b.addEventListener('click', fn); row.appendChild(b); };
    if (href) { const a = doc.createElement('a'); a.className = 'btn btn--small btn--primary'; a.href = href; if (href.charAt(0) !== '#') { a.target = '_blank'; a.rel = 'noopener'; } a.textContent = i === 0 ? t('hs.brand.cta') : this.label(i); a.addEventListener('click', () => track('contact_cta_clicked', { from: 'hotspot' })); row.appendChild(a); }
    else if (reg) {
      const r = regionName(reg.id);
      add(t('hs.region.props', { region: r }), 'btn--primary', () => { track('contact_cta_clicked', { from: 'hotspot', region: reg.id }); goRegion('properties', reg.id); });
      if (DATA.layout.teams) add(t('hs.region.team', { region: r }), '', () => { track('contact_cta_clicked', { from: 'hotspot', region: reg.id }); goRegion('teams', reg.id); });
    }
    const back = doc.createElement('button'); back.type = 'button'; back.className = 'btn btn--small'; back.textContent = t('hs.back'); back.addEventListener('click', () => this.clear());
    row.appendChild(back); c.append(h, p, row); c.hidden = false;
  }
  select(i) {
    App.selected = i; this.mgr.scroll.selectedAt = this.mgr.scroll.p;
    this.mgr.cam.flyTo(this.spots[i].pos, this.spots[i].look);
    this.markers.forEach((m, k) => m.setAttribute('aria-pressed', String(k === i))); this.chips.forEach((c, k) => c.setAttribute('aria-current', String(k === i)));
    this.renderCard(i); track('interactive_building_selected', { slot: i }); this.mgr.invalidate();
  }
  clear() {
    if (App.selected < 0) return; App.selected = -1; this.card.hidden = true; this.mgr.cam.release();
    this.markers.forEach((m) => m.setAttribute('aria-pressed', 'false')); this.chips.forEach((c) => c.removeAttribute('aria-current')); this.mgr.invalidate();
  }
  pick(cx, cy) {
    const r = this.mgr.canvas.getBoundingClientRect(); this.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.mgr.camera);
    const th = this.ray.intersectObjects(this.mgr.env.towerMeshes, false); if (th.length) return 0;
    const hits = this.ray.intersectObject(this.mgr.env.city, false);
    if (hits.length) { const it = this.mgr.env.cityItems[hits[0].instanceId]; if (it && it.anchor != null) return it.anchor + 1; }
    return -1;
  }
  click(cx, cy) { const i = this.pick(cx, cy); if (i >= 0) this.select(i); }
  update() {
    const cam = this.mgr.camera, w = this.layer.clientWidth, h = this.layer.clientHeight;
    this.spots.forEach((s, i) => {
      this.v.copy(s.top).applyMatrix4(cam.matrixWorldInverse);
      const m = this.markers[i], dist = -this.v.z;
      if (this.v.z >= -2 || dist > 520) { m.style.visibility = 'hidden'; return; }
      this.v.copy(s.top).project(cam);
      const x = (this.v.x * 0.5 + 0.5) * w, y = (-this.v.y * 0.5 + 0.5) * h;
      if (x < -30 || x > w + 30 || y < -30 || y > h + 30) { m.style.visibility = 'hidden'; return; }
      m.style.visibility = ''; m.style.transform = `translate(${x}px,${y}px)`;
      m.style.opacity = App.selected >= 0 && App.selected !== i ? 0.45 : 1;
    });
  }
}

class SceneManager {
  constructor(canvas, cap) {
    this.canvas = canvas; this.cap = cap; this.cfg = DeviceCapabilityManager.profile(cap);
    this.assets = new AssetLoader(); this.raf = 0; this.last = 0; this.visible = true; this.lost = false; this.destroyed = false; this.idle = 0; this.dpr = this.cfg.dpr;
    this.onFallback = () => {};
    this.frame = this.frame.bind(this);
  }
  init() {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: this.cfg.antialias, powerPreference: 'high-performance', alpha: false, stencil: false });
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(50, 1, 1, 2400);
    this.light = new LightingSystem(this.scene);
    this.env = new EnvironmentManager(this.scene, r, this.cfg, this.assets);
    this.cam = new CameraController(this.camera, () => this.invalidate());
    this.perf = new PerformanceMonitor((level, fps) => this.degrade(level, fps));
    this.resize(true);
    this.onResize = () => { clearTimeout(this.rt); this.rt = setTimeout(() => this.resize(false), 120); };
    this.onVis = () => { if (document.hidden) this.pause(); else this.start(); };
    this.onLost = (e) => { e.preventDefault(); this.lost = true; this.pause(); root.classList.add('gl-lost'); };
    this.onRestored = () => { this.lost = false; this.env.buildEnv(); root.classList.remove('gl-lost'); this.start(); };
    window.addEventListener('resize', this.onResize); document.addEventListener('visibilitychange', this.onVis);
    this.canvas.addEventListener('webglcontextlost', this.onLost); this.canvas.addEventListener('webglcontextrestored', this.onRestored);
  }
  resize(force) {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    if (!force && this.w === w && Math.abs(this.h - h) < 120) return;       // ignore mobile URL-bar height jitter
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.dpr)); this.renderer.setSize(w, h, false);
    this.cam.setAspect(w / h); this.invalidate();
  }
  degrade(level) {
    if (level === 1) { this.dpr = Math.min(this.dpr, 1); this.env.cloudGroup.visible = false; this.resize(true); }
    else if (level === 2) { this.env.setDensity(this.cfg.density * 0.5); this.dpr = 1; this.resize(true); }
    else { this.onFallback(); }
  }
  setVisible(v) { this.visible = v; if (v) this.start(); else this.pause(); }
  start() { if (this.destroyed || this.lost || !this.visible || document.hidden || this.raf) return; this.last = performance.now(); this.idle = 0; this.raf = requestAnimationFrame(this.frame); }
  pause() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  invalidate() { this.idle = 0; this.start(); }
  frame(now) {
    this.raf = 0; if (this.destroyed || this.lost || !this.visible) return;
    const raw = (now - this.last) / 1000 || 0.016, dt = Math.min(0.1, raw); this.last = now;
    const moved = this.cam.update(dt, now / 1000);
    this.env.update(dt);
    if (App.stageActive && this.interaction) this.interaction.update();
    this.renderer.render(this.scene, this.camera);
    if (!root.classList.contains('gl-ready')) root.classList.add('gl-ready');
    this.perf.tick(raw);
    if (App.reduced) { this.idle = moved ? 0 : this.idle + 1; if (this.idle > 3) return; }
    this.raf = requestAnimationFrame(this.frame);
  }
  destroy() {
    if (this.destroyed) return; this.destroyed = true; this.pause();
    window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onVis);
    this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    if (this.interaction) this.interaction.layer.textContent = '';
    this.env.dispose();
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); });
    this.renderer.dispose(); this.renderer.forceContextLoss();
    root.classList.remove('gl-ready');
  }
}
