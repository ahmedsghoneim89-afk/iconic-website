/* Small script for the inner pages: menu, photo gallery, enquiry form, admin sign-in. No dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  try { d.cookie = 'iconic_lang=' + root.lang + ';path=/;max-age=31536000;SameSite=Lax'; } catch (e) { /* cookies off */ }

  var nav = d.getElementById('nav'), btn = d.getElementById('menuBtn');
  if (nav && btn) {
    var close = function () { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () { var o = nav.classList.toggle('is-open'); btn.setAttribute('aria-expanded', String(o)); });
    nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  var main = d.getElementById('galMain'), thumbs = d.querySelectorAll('[data-gal]');
  if (main && thumbs.length) {
    thumbs[0].setAttribute('aria-current', 'true');
    thumbs.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); main.src = a.getAttribute('data-gal');
        thumbs.forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true');
      });
    });
  }

  var toLatin = function (s) { return s.replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x660); }); };
  var form = d.getElementById('leadForm');
  if (form) {
    var M = {}; try { M = JSON.parse(form.getAttribute('data-msgs') || '{}'); } catch (e) { /* defaults below */ }
    var status = d.getElementById('formStatus'), submit = d.getElementById('submitBtn'), last = 0;
    var E = { name: d.getElementById('e-name'), phone: d.getElementById('e-phone'), email: d.getElementById('e-email'), contact: d.getElementById('e-contact'), consent: d.getElementById('e-consent') };
    var setErr = function (k, msg, field) { E[k].textContent = msg || ''; if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    var sync = function () { var r = form.querySelector('input[name="interest"]:checked'); submit.textContent = M[r ? r.value : 'inquiry'] || submit.textContent; };
    form.addEventListener('change', function (e) { if (e.target.name === 'interest') sync(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status.dataset.state = ''; status.textContent = '';
      var f = form.elements, name = f.name.value.trim(), phone = toLatin(f.phone.value.trim()), email = f.email.value.trim(), digits = phone.replace(/\D/g, ''), bad = [];
      var badPhone = phone && !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15), badEmail = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      setErr('name', name.length < 2 ? M.name : '', f.name); if (name.length < 2) bad.push(f.name);
      setErr('phone', badPhone ? M.phone : '', f.phone); if (badPhone) bad.push(f.phone);
      setErr('email', badEmail ? M.email : '', f.email); if (badEmail) bad.push(f.email);
      setErr('contact', !phone && !email ? M.contact : ''); if (!phone && !email) bad.push(f.phone);
      setErr('consent', !f.consent.checked ? M.consent : '', f.consent); if (!f.consent.checked) bad.push(f.consent);
      if (bad.length) { bad[0].focus(); status.dataset.state = 'error'; return; }
      if (f.website.value) { status.dataset.state = 'ok'; status.textContent = M.sent; return; }   // honeypot: looks like success, nothing is sent
      if (Date.now() - last < 8000) { status.dataset.state = 'error'; status.textContent = M.wait; return; }
      last = Date.now(); submit.disabled = true; status.textContent = M.sending;
      var r = form.querySelector('input[name="interest"]:checked');
      fetch('/iconic-api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: root.lang, page: location.pathname, interest: r ? r.value : 'inquiry', name: name, phone: digits ? phone : '', email: email, message: f.message.value.trim(), property: f.property.value, agent: f.agent.value }) })
        .then(function (res) {
          if (res.status === 429) { status.dataset.state = 'error'; status.textContent = M.wait; return; }
          if (!res.ok) throw new Error(String(res.status));
          status.dataset.state = 'ok'; status.textContent = M.sent; form.reset(); sync();
        })
        .catch(function () { status.dataset.state = 'error'; status.textContent = M.fail; })
        .then(function () { submit.disabled = false; });
    });
  }

  var af = d.getElementById('applyForm');
  if (af) {
    var AM = {}; try { AM = JSON.parse(af.getAttribute('data-msgs') || '{}'); } catch (e) { /* defaults below */ }
    var ast = d.getElementById('applyStatus'), abtn = d.getElementById('applyBtn'), alast = 0, MAXCV = 5 * 1024 * 1024;
    var AE = { name: d.getElementById('ea-name'), phone: d.getElementById('ea-phone'), email: d.getElementById('ea-email'), contact: d.getElementById('ea-contact'), consent: d.getElementById('ea-consent'), cv: d.getElementById('ea-cv') };
    var setAErr = function (k, msg, field) { AE[k].textContent = msg || ''; if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    var readB64 = function (file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { var v = String(r.result); res(v.slice(v.indexOf(',') + 1)); }; r.onerror = function () { rej(r.error); }; r.readAsDataURL(file); }); };
    af.addEventListener('submit', function (e) {
      e.preventDefault(); ast.dataset.state = ''; ast.textContent = '';
      var f = af.elements, name = f.name.value.trim(), phone = toLatin(f.phone.value.trim()), email = f.email.value.trim(), digits = phone.replace(/\D/g, ''), bad = [], file = f.cv.files && f.cv.files[0];
      var badPhone = phone && !(/^[+\d][\d\s\-().]*$/.test(phone) && digits.length >= 7 && digits.length <= 15), badEmail = email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      setAErr('name', name.length < 2 ? AM.name : '', f.name); if (name.length < 2) bad.push(f.name);
      setAErr('phone', badPhone ? AM.phone : '', f.phone); if (badPhone) bad.push(f.phone);
      setAErr('email', badEmail ? AM.email : '', f.email); if (badEmail) bad.push(f.email);
      setAErr('contact', !phone && !email ? AM.contact : ''); if (!phone && !email) bad.push(f.phone);
      var cvBad = file && !/\.(pdf|docx?)$/i.test(file.name) ? AM.cvType : (file && file.size > MAXCV ? AM.cvSize : '');
      setAErr('cv', cvBad, f.cv); if (cvBad) bad.push(f.cv);
      setAErr('consent', !f.consent.checked ? AM.consent : '', f.consent); if (!f.consent.checked) bad.push(f.consent);
      if (bad.length) { bad[0].focus(); ast.dataset.state = 'error'; return; }
      if (f.website.value) { ast.dataset.state = 'ok'; ast.textContent = AM.sent; return; }   // honeypot: looks like success, nothing is sent
      if (Date.now() - alast < 8000) { ast.dataset.state = 'error'; ast.textContent = AM.wait; return; }
      alast = Date.now(); abtn.disabled = true; ast.textContent = AM.sending;
      (file ? readB64(file) : Promise.resolve('')).then(function (b64) {
        var body = { lang: root.lang, name: name, phone: digits ? phone : '', email: email, message: f.message.value.trim(), job: f.job ? f.job.value : '' };
        if (file) body.cv = { name: file.name, data: b64 };
        return fetch('/iconic-api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }).then(function (res) {
        if (res.status === 429) { ast.dataset.state = 'error'; ast.textContent = AM.wait; return; }
        if (res.status === 413) { ast.dataset.state = 'error'; ast.textContent = AM.cvSize; return; }
        if (res.status === 415) { ast.dataset.state = 'error'; ast.textContent = AM.cvType; return; }
        if (!res.ok) throw new Error(String(res.status));
        ast.dataset.state = 'ok'; ast.textContent = AM.sent; af.reset();
      }).catch(function () { ast.dataset.state = 'error'; ast.textContent = AM.fail; })
        .then(function () { abtn.disabled = false; });
    });
  }

  var login = d.getElementById('loginForm');
  if (login) {
    var L = {}; try { L = JSON.parse(login.getAttribute('data-msgs') || '{}'); } catch (e) { /* defaults */ }
    var ls = d.getElementById('loginStatus');
    login.addEventListener('submit', function (e) {
      e.preventDefault(); ls.dataset.state = ''; ls.textContent = '';
      var b = login.querySelector('button'); b.disabled = true;
      fetch('/iconic-api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ email: login.elements.email.value, password: login.elements.password.value }) })
        .then(function (res) {
          if (res.ok) { location.href = '/' + (L.lang || 'ar') + '/#admin'; return; }
          ls.dataset.state = 'error'; ls.textContent = res.status === 429 ? L.wait : L.bad; b.disabled = false;
        })
        .catch(function () { ls.dataset.state = 'error'; ls.textContent = L.fail; b.disabled = false; });
    });
  }
  /* Linked drop-down lists on the properties and projects filters: a governorate offers only its areas, a developer only its projects.
     The same rules are applied by the server (catalog_pages.js, cascade) when the page is built, so both agree. */
  var flt = d.querySelector('form.flt[data-tree]');
  if (flt) {
    var T = null; try { T = JSON.parse(flt.getAttribute('data-tree')); } catch (e) { T = null; }
    if (T && T.r) {
      var KEYS = ['d', 'c', 'a', 'p'], ROW = { d: 0, c: 1, a: 2, p: 3 }, SELS = {};
      var NAMES = { d: {}, c: {}, a: {}, p: {} }, ORDER = { d: T.d, c: T.c, a: T.a, p: T.p };
      KEYS.forEach(function (k) { (ORDER[k] || []).forEach(function (x) { NAMES[k][x[0]] = x[1]; }); });
      var AREA_CITY = {}; (T.a || []).forEach(function (x) { AREA_CITY[x[0]] = x[2]; });
      var cityOrder = (T.c || []).map(function (x) { return x[0]; });
      SELS.d = flt.elements.developer; SELS.c = flt.elements.city; SELS.a = flt.elements.area; SELS.p = flt.elements.project;
      var nf; try { nf = new Intl.NumberFormat(T.n || undefined); } catch (e) { nf = { format: String }; }
      var blank = {}; KEYS.forEach(function (k) { if (SELS[k]) blank[k] = SELS[k].options[0].text; });
      var cur = function () { var o = {}; KEYS.forEach(function (k) { o[k] = SELS[k] ? SELS[k].value : ''; }); return o; };
      var keep = function (sel, skip) {
        return T.r.filter(function (r) { return KEYS.every(function (k) { return skip.indexOf(k) >= 0 || !sel[k] || r[ROW[k]] === sel[k]; }); });
      };
      var tally = function (list, k) { var m = {}, ks = []; list.forEach(function (r) { var v = r[ROW[k]]; if (!v) return; if (!(v in m)) { m[v] = 0; ks.push(v); } m[v] += r[4]; }); return { n: m, has: function (v) { return v in m; } }; };
      var lists = function (sel) { return { d: tally(keep(sel, 'dp'), 'd'), c: tally(keep(sel, 'cap'), 'c'), a: tally(keep(sel, 'ap'), 'a'), p: tally(keep(sel, 'p'), 'p') }; };
      var opt = function (v, k, L) { var o = d.createElement('option'); o.value = v; o.textContent = NAMES[k][v] + (L.n[v] > 0 ? ' (' + nf.format(L.n[v]) + ')' : ''); return o; };
      var fill = function (k, L, value) {
        var s = SELS[k]; if (!s) return;
        s.textContent = ''; var all = d.createElement('option'); all.value = ''; all.textContent = blank[k]; s.appendChild(all);
        var ok = function (x) { return L.has(x[0]); };
        if (k === 'a' && !(SELS.c && SELS.c.value)) {
          cityOrder.forEach(function (cv) {
            var items = T.a.filter(function (x) { return x[2] === cv && ok(x); }); if (!items.length) return;
            var g = d.createElement('optgroup'); g.label = NAMES.c[cv]; items.forEach(function (x) { g.appendChild(opt(x[0], 'a', L)); }); s.appendChild(g);
          });
        } else (ORDER[k] || []).filter(ok).forEach(function (x) { s.appendChild(opt(x[0], k, L)); });
        s.value = value; if (s.value !== value) s.value = '';
      };
      var refresh = function (changed) {
        var sel = cur(), L;
        /* choosing a project or an area fixes where it is */
        if (changed === 'p' && sel.p) { var row = T.r.filter(function (r) { return r[3] === sel.p; })[0]; if (row) { sel.d = row[0]; sel.c = row[1]; sel.a = row[2]; } }
        else if (changed === 'a' && sel.a && AREA_CITY[sel.a]) sel.c = AREA_CITY[sel.a];
        /* a project stands for its own developer, governorate and area: changing one of them (even to "All") lets go of the project */
        if (changed !== 'p' && ROW[changed] !== undefined && sel.p) { var pr = T.r.filter(function (r) { return r[3] === sel.p; })[0]; if (!pr || pr[ROW[changed]] !== sel[changed]) sel.p = ''; }
        /* what no longer fits goes back to "All": the project first, then the area, then the developer, then the governorate.
           The list the person just changed is never touched, so changing the governorate keeps the developer when it still works there. */
        ['p', 'a', 'd', 'c'].forEach(function (k) { if (k !== changed && sel[k] && !lists(sel)[k].has(sel[k])) sel[k] = ''; });
        L = lists(sel);
        KEYS.forEach(function (k) { fill(k, L[k], sel[k]); });
      };
      KEYS.forEach(function (k) { if (SELS[k]) SELS[k].addEventListener('change', function () { refresh(k); }); });
    }
  }

  /* "Sell your unit": five steps with linked lists, photos resized on the device, then the request is sent and the photos follow one by one.
     The server checks everything again; this only saves the sender a round trip. */
  var sf = d.getElementById('sellForm');
  if (sf) (function () {
    var M = {}, T = { c: [], a: [], p: [] }, MAX = Number(sf.getAttribute('data-max')) || 15, LANG = sf.getAttribute('data-lang') || 'ar';
    try { M = JSON.parse(sf.getAttribute('data-msgs') || '{}'); } catch (e) { /* defaults below */ }
    try { T = JSON.parse(sf.getAttribute('data-tree') || '{}'); T.c = T.c || []; T.a = T.a || []; T.p = T.p || []; } catch (e) { /* free text only */ }
    var f = sf.elements, steps = [].slice.call(sf.querySelectorAll('.sell__step')), items = [].slice.call(sf.querySelectorAll('.sell__stepi'));
    var el = function (id) { return d.getElementById(id); };
    var status = el('sellStatus'), nextB = el('sellNext'), backB = el('sellBack'), subB = el('sellSubmit'), bar = el('sellBar'), of = el('sellOf'), words = el('sellWords');
    var cur = 1, photos = [], docFile = null, lastSend = 0, KEY = 'iconic.sell.v1';
    var nf; try { nf = new Intl.NumberFormat(LANG === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }); } catch (e) { nf = { format: String }; }
    var latin = function (s) { return toLatin(String(s == null ? '' : s)).replace(/[٬,\s]/g, '').replace(/٫/g, '.'); };
    var numOf = function (s) { var t = latin(s); if (t === '' || !/^\d+(\.\d+)?$/.test(t)) return null; return Number(t); };
    var val = function (n) { return f[n] ? String(f[n].value || '').trim() : ''; };
    var show = function (node, on) { if (node) node.hidden = !on; };
    var setErr = function (id, msg) { var p = el('es-' + id), i = el('s-' + id); if (p) p.textContent = msg || ''; if (i && i.setAttribute) i.setAttribute('aria-invalid', msg ? 'true' : 'false'); return msg ? (i || p) : null; };
    var opt = function (v, text) { var o = d.createElement('option'); o.value = v; o.textContent = text; return o; };

    /* ---- governorate, area, project ---- */
    var HAS = T.c.length > 0 && !!f.city, selC = f.city, selA = f.area, selP = f.project;
    var box = function (sel) { return sel ? sf.querySelector(sel) : null; };
    var FA = box('[data-f="area"]'), FP = box('[data-f="project"]'), OC = box('[data-other="city"]'), OA = box('[data-other="area"]'), OP = box('[data-other="project"]'), ROOMS = box('[data-f="rooms"]');
    var rebuild = function (sel, list, otherLabel, keep) {
      sel.textContent = ''; sel.appendChild(opt('', M.choose));
      list.forEach(function (x) { sel.appendChild(opt(x[0], x[1])); });
      sel.appendChild(opt('__other', otherLabel)); sel.value = keep; if (sel.value !== keep) sel.value = '';
    };
    var areaMode = 'off', projMode = 'off';
    var syncPlace = function () {
      if (!HAS) return;
      var cid = selC.value, free = cid === '__other';
      show(OC, free);
      var areas = cid && !free ? T.a.filter(function (a) { return a[2] === cid; }) : [];
      areaMode = !cid ? 'off' : (areas.length ? 'list' : 'text');
      show(FA, areaMode === 'list'); if (areaMode === 'list') rebuild(selA, areas, M.other, selA.value); else selA.value = '';
      var aid = selA.value && selA.value !== '__other' ? selA.value : '';
      show(OA, areaMode === 'text' || (areaMode === 'list' && selA.value === '__other'));
      var prs = cid && !free ? T.p.filter(function (p) { return p[2] === cid && (!aid || !p[3] || p[3] === aid); }) : [];
      projMode = !cid ? 'off' : (prs.length ? 'list' : 'text');
      show(FP, projMode === 'list'); if (projMode === 'list') rebuild(selP, prs, M.noProject, selP.value); else selP.value = '';
      show(OP, projMode === 'text' || (projMode === 'list' && selP.value === '__other'));
    };
    if (HAS) {
      selC.textContent = ''; selC.appendChild(opt('', M.choose)); T.c.forEach(function (x) { selC.appendChild(opt(x[0], x[1])); }); selC.appendChild(opt('__other', M.other));
      show(FA, false); show(FP, false);
      selC.addEventListener('change', syncPlace); selA.addEventListener('change', syncPlace);
      selP.addEventListener('change', function () {
        var p = T.p.filter(function (x) { return x[0] === selP.value; })[0];
        if (p && p[3] && selA.value !== p[3]) selA.value = p[3];
        syncPlace();
      });
    }
    var rooms = function () { var land = (sf.querySelector('input[name="type"]:checked') || {}).value === 'land'; show(ROOMS, !land); };
    sf.addEventListener('change', function (e) { if (e.target.name === 'type') rooms(); });

    /* ---- price: shown back in words and digits as it is typed ---- */
    var sayPrice = function () {
      var n = numOf(val('price')), v = f.valuation.checked;
      f.price.disabled = v; f.negotiable.disabled = v; if (v) setErr('price', '');
      words.textContent = !v && n ? nf.format(n) + ' ' + f.currency.value : '';
    };
    f.price.addEventListener('input', sayPrice); f.currency.addEventListener('change', sayPrice); f.valuation.addEventListener('change', sayPrice);

    /* ---- photos: resized and re-encoded on the device (this also drops hidden location data), then listed ---- */
    var grid = el('sellGrid'), picker = el('s-photos'), drop = el('sellDrop');
    var loadImg = function (file) { return new Promise(function (res, rej) { var u = URL.createObjectURL(file), i = new Image(); i.onload = function () { URL.revokeObjectURL(u); res(i); }; i.onerror = function () { URL.revokeObjectURL(u); rej(new Error('decode')); }; i.src = u; }); };
    var shrink = function (file) {
      return (window.createImageBitmap ? createImageBitmap(file).catch(function () { return loadImg(file); }) : loadImg(file)).then(function (img) {
        var w = img.width, h = img.height, k = Math.min(1, 1600 / Math.max(w, h)), c = d.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); if (img.close) img.close();
        return new Promise(function (res, rej) { c.toBlob(function (b) { if (b) res(b); else rej(new Error('encode')); }, 'image/jpeg', 0.82); });
      });
    };
    var drawPhotos = function () {
      grid.textContent = '';
      photos.forEach(function (p, i) {
        var t = d.createElement('div'); t.className = 'sell__tile' + (p.busy ? ' is-busy' : '');
        if (p.url) { var im = d.createElement('img'); im.src = p.url; im.alt = ''; t.appendChild(im); }
        if (i === 0 && !p.busy) { var cv = d.createElement('span'); cv.className = 'sell__cov'; cv.textContent = M.l.cover; t.appendChild(cv); }
        var rm = d.createElement('button'); rm.type = 'button'; rm.setAttribute('aria-label', M.l.remove); rm.textContent = '×';
        rm.addEventListener('click', function () { if (p.url) URL.revokeObjectURL(p.url); photos.splice(photos.indexOf(p), 1); setErr('photos', ''); drawPhotos(); });
        t.appendChild(rm); grid.appendChild(t);
      });
    };
    var addPhotos = function (list) {
      var files = [].slice.call(list), room = MAX - photos.length; setErr('photos', '');
      if (files.length > room) { setErr('photos', M.err.photoMax); files = files.slice(0, Math.max(room, 0)); }
      files.forEach(function (file) {
        if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) { setErr('photos', M.err.photoType); return; }
        var p = { name: file.name, blob: null, url: '', busy: true }; photos.push(p); drawPhotos();
        shrink(file).then(function (b) { p.blob = b; p.url = URL.createObjectURL(b); p.busy = false; drawPhotos(); })
          .catch(function () { var i = photos.indexOf(p); if (i >= 0) photos.splice(i, 1); setErr('photos', M.err.photoType); drawPhotos(); });
      });
    };
    picker.addEventListener('change', function () { addPhotos(picker.files || []); picker.value = ''; });
    ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (n === 'drop' && e.dataTransfer) addPhotos(e.dataTransfer.files); }); });
    f.doc.addEventListener('change', function () {
      var file = f.doc.files && f.doc.files[0]; docFile = null; setErr('doc', '');
      if (!file) return;
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { setErr('doc', M.err.docType); f.doc.value = ''; return; }
      if (file.size > 8 * 1024 * 1024) { setErr('doc', M.err.docSize); f.doc.value = ''; return; }
      docFile = file;
    });

    /* ---- steps ---- */
    var mail = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); };
    var check = function (n) {
      var bad = [], ph, dg, v;
      if (n === 1) {
        bad.push(setErr('name', val('name').length < 2 ? M.err.name : ''));
        ph = toLatin(val('phone')); dg = ph.replace(/\D/g, '');
        bad.push(setErr('phone', !ph || !/^[+\d][\d\s\-().]*$/.test(ph) || dg.length < 7 || dg.length > 15 ? M.err.phone : ''));
        bad.push(setErr('email', val('email') && !mail(val('email')) ? M.err.email : ''));
      } else if (n === 2) {
        var ty = sf.querySelector('input[name="type"]:checked'); var tp = el('es-type'); tp.textContent = ty ? '' : M.err.type; if (!ty) bad.push(sf.querySelector('input[name="type"]'));
        if (HAS) {
          bad.push(setErr('city', !selC.value ? M.err.city : ''));
          if (selC.value === '__other') bad.push(setErr('cityOther', val('cityOther').length < 2 ? M.err.city : ''));
          if (areaMode === 'list') bad.push(setErr('area', !selA.value ? M.err.area : ''));
          if (areaMode === 'list' && selA.value === '__other') bad.push(setErr('areaOther', val('areaOther').length < 2 ? M.err.area : ''));
        } else {
          bad.push(setErr('cityOther', val('cityOther').length < 2 ? M.err.city : ''));
        }
      } else if (n === 3) {
        v = numOf(val('areaM2')); bad.push(setErr('areaM2', !v || v <= 0 || v > 1000000 ? M.err.size : ''));
        v = numOf(val('price')); bad.push(setErr('price', !f.valuation.checked && (!v || v <= 0) ? M.err.price : ''));
        ['beds', 'baths'].forEach(function (k) { var x = val(k); bad.push(setErr(k, x && (numOf(x) == null || numOf(x) > 50) ? M.err.size : '')); });
      } else if (n === 4) {
        bad.push(setErr('video', val('video') && !/^https:\/\/\S+$/i.test(val('video')) ? M.err.video : ''));
      } else if (n === 5) {
        bad.push(setErr('consent', !f.consent.checked ? M.err.consent : ''));
      }
      return bad.filter(Boolean)[0] || null;
    };
    var locText = function () {
      var c = HAS ? (selC.value === '__other' ? val('cityOther') : (selC.selectedOptions[0] || {}).text) : val('cityOther');
      var a = areaMode === 'list' ? (selA.value === '__other' ? val('areaOther') : (selA.selectedOptions[0] || {}).text) : val('areaOther');
      var p = projMode === 'list' ? (selP.value === '__other' ? val('projectOther') : (selP.value ? (selP.selectedOptions[0] || {}).text : '')) : val('projectOther');
      return [c, a && a !== M.choose ? a : '', p && p !== M.choose ? p : ''].filter(Boolean).join(LANG === 'ar' ? '، ' : ', ');
    };
    var review = function () {
      var host = el('sellReview'), g = function (step, title, rows) {
        var s = d.createElement('section'); s.className = 'sell__rg'; var hd = d.createElement('div'); hd.className = 'sell__rgh';
        var h3 = d.createElement('h3'); h3.textContent = title; var eb = d.createElement('button'); eb.type = 'button'; eb.className = 'linklike'; eb.textContent = M.r.edit; eb.addEventListener('click', function () { go(step); });
        hd.appendChild(h3); hd.appendChild(eb); s.appendChild(hd);
        var dl = d.createElement('dl'); rows.filter(function (r) { return r[1]; }).forEach(function (r) { var dt = d.createElement('dt'), dd = d.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; dl.appendChild(dt); dl.appendChild(dd); });
        s.appendChild(dl); host.appendChild(s);
      };
      host.textContent = '';
      g(1, M.r.contact, [[M.l.who, M.o.who[f.who.value]], [M.l.name, val('name')], [M.l.phone, toLatin(val('phone'))], [M.l.email, val('email')]]);
      var n = numOf(val('price')), ty = (sf.querySelector('input[name="type"]:checked') || {}).value;
      var land = ty === 'land';
      g(2, M.r.unit, [[M.l.purpose, M.o.purpose[f.purpose.value]], [M.l.type, M.o.type[ty] || ''], [M.l.city, locText()], [M.l.size, numOf(val('areaM2')) ? nf.format(numOf(val('areaM2'))) + ' ' + M.sqm : ''],
        [M.l.beds, !land ? val('beds') : ''], [M.l.baths, !land ? val('baths') : ''], [M.l.floor, val('floor')], [M.l.finishing, f.finishing.value ? M.o.fin[f.finishing.value] : ''],
        [M.r.price, f.valuation.checked ? M.l.valuation : (n ? nf.format(n) + ' ' + f.currency.value + (f.negotiable.checked ? ' (' + M.l.negotiable + ')' : '') : '')], [M.l.details, val('details')]]);
      g(4, M.r.files, [[M.r.photos, photos.length ? nf.format(photos.filter(function (p) { return p.blob; }).length) : M.r.none], [M.r.video, val('video')], [M.r.doc, docFile ? docFile.name : M.r.none]]);
    };
    var go = function (n, quiet) {
      cur = Math.max(1, Math.min(5, n));
      steps.forEach(function (s, i) { s.hidden = i + 1 !== cur; });
      items.forEach(function (li, i) { li.classList.toggle('is-done', i + 1 < cur); li.classList.toggle('is-now', i + 1 === cur); if (i + 1 === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      bar.style.width = (cur / 5 * 100) + '%'; of.textContent = M.stepOf.replace('{n}', nf.format(cur)).replace('{total}', nf.format(5)) + ' · ' + M.steps[cur - 1];
      show(backB, cur > 1); show(nextB, cur < 5); show(subB, cur === 5); status.textContent = ''; status.dataset.state = '';
      if (cur === 5) review();
      if (quiet) return;
      var hd = el('sell-h-' + cur); try { sf.scrollIntoView({ behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* older browsers */ }
      if (hd) hd.focus({ preventScroll: true });
    };
    nextB.addEventListener('click', function () { var bad = check(cur); if (bad) { bad.focus(); return; } go(cur + 1); });
    backB.addEventListener('click', function () { go(cur - 1); });
    sf.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio' && cur < 5) { e.preventDefault(); nextB.click(); } });

    /* ---- what the sender typed survives a refresh (this tab only, never the photos) ---- */
    var NAMES = ['who', 'name', 'phone', 'email', 'purpose', 'type', 'city', 'cityOther', 'area', 'areaOther', 'project', 'projectOther', 'areaM2', 'floor', 'beds', 'baths', 'finishing', 'price', 'currency', 'details', 'video'];
    var save = function () {
      try { var o = {}; NAMES.forEach(function (k) { if (f[k]) o[k] = f[k].value; }); o.negotiable = f.negotiable.checked; o.valuation = f.valuation.checked; sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage off */ }
    };
    var restore = function () {
      var o; try { o = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { o = null; } if (!o) return;
      ['who', 'name', 'phone', 'email', 'purpose', 'type', 'cityOther', 'areaOther', 'projectOther', 'areaM2', 'floor', 'beds', 'baths', 'finishing', 'price', 'currency', 'details', 'video'].forEach(function (k) { if (o[k] != null && f[k]) f[k].value = o[k]; });
      if (HAS && o.city) { selC.value = o.city; syncPlace(); if (o.area) { selA.value = o.area; syncPlace(); } if (o.project) { selP.value = o.project; syncPlace(); } }
      f.negotiable.checked = !!o.negotiable; f.valuation.checked = !!o.valuation; rooms(); sayPrice();
    };
    var clearErr = function (e) { var t = e.target; if (t && t.id && t.type !== 'file' && t.getAttribute && t.getAttribute('aria-invalid') === 'true') setErr(t.id.replace(/^s-/, ''), ''); };
    sf.addEventListener('input', clearErr); sf.addEventListener('change', clearErr);
    sf.addEventListener('input', save); sf.addEventListener('change', save);

    /* ---- sending ---- */
    var STEP_OF_ERR = { name: 1, phone: 1, email: 1, city: 2, area: 2, project: 2, type: 2, purpose: 2, size: 3, price: 3, beds: 3, baths: 3, video: 4, consent: 5 };
    var payload = function () {
      var ty = (sf.querySelector('input[name="type"]:checked') || {}).value || '', land = ty === 'land', other = function (sel, mode, name) { return (!sel || sel.value === '__other' || mode === 'text' || !HAS) ? val(name) : ''; };
      return {
        lang: LANG, who: f.who.value, name: val('name'), phone: toLatin(val('phone')), email: val('email'), website: f.website.value, purpose: f.purpose.value, type: ty,
        city: HAS && selC.value !== '__other' ? selC.value : '', cityOther: HAS ? (selC.value === '__other' ? val('cityOther') : '') : val('cityOther'),
        area: areaMode === 'list' && selA.value !== '__other' ? selA.value : '', areaOther: HAS ? other(selA, areaMode, 'areaOther') : val('areaOther'),
        project: projMode === 'list' && selP.value !== '__other' ? selP.value : '', projectOther: HAS ? other(selP, projMode, 'projectOther') : val('projectOther'),
        areaM2: numOf(val('areaM2')), floor: val('floor'), beds: land ? '' : numOf(val('beds')), baths: land ? '' : numOf(val('baths')), finishing: f.finishing.value,
        price: f.valuation.checked ? '' : numOf(val('price')), currency: f.currency.value, negotiable: f.negotiable.checked && !f.valuation.checked, valuation: f.valuation.checked,
        details: val('details'), video: val('video'), photos: photos.filter(function (p) { return p.blob; }).length, consent: f.consent.checked
      };
    };
    var upText = el('sellUpText'), upBar = el('sellUpBar'), upBox = el('sellUp'), retry = el('sellRetry'), token = '', queue = [], sent = 0, total = 0;
    var uploadOne = function (job) {
      return fetch('/iconic-api/sell/' + token + '/files?kind=' + job.kind + '&pos=' + job.pos + '&name=' + encodeURIComponent(job.name), { method: 'POST', headers: { 'Content-Type': job.blob.type || 'application/octet-stream' }, body: job.blob })
        .then(function (r) { return r.ok || r.status === 409; }, function () { return false; });
    };
    var pump = function () {
      var failed = [], i = 0; retry.hidden = true; upBox.hidden = false;
      var paint = function () { upText.textContent = M.up.n.replace('{n}', nf.format(sent)).replace('{total}', nf.format(total)); upBar.style.width = (total ? sent / total * 100 : 100) + '%'; };
      paint();
      var next = function () {
        if (i >= queue.length) {
          queue = failed;
          if (failed.length) { upText.textContent = M.up.fail.replace('{n}', nf.format(failed.length)); retry.hidden = false; } else { upText.textContent = M.up.ok; upBar.style.width = '100%'; }
          return;
        }
        var job = queue[i++];
        uploadOne(job).then(function (ok) { if (ok) sent++; else failed.push(job); paint(); next(); });
      };
      next();
    };
    retry.addEventListener('click', pump);
    var done = function (r) {
      try { sessionStorage.removeItem(KEY); } catch (e) { /* storage off */ }
      token = r.token || '';
      var box2 = el('sellDone'); sf.hidden = true; box2.hidden = false;
      el('sellDoneText').textContent = M.done.ref.replace('{ref}', r.ref || '');
      if (r.wa) { el('sellWa').href = r.wa; show(el('sellWaBox'), true); }
      if (r.track) { el('sellTrack').href = r.track; var cp = el('sellCopy'); cp.addEventListener('click', function () { var url = location.origin + r.track; var ok = function () { cp.textContent = M.done.copied; }; if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, function () { /* the link stays visible on the button */ }); else ok(); }); }
      else { el('sellTrack').hidden = true; el('sellCopy').hidden = true; }
      queue = []; photos.forEach(function (p, i) { if (p.blob) queue.push({ kind: 'photo', blob: p.blob, name: p.name, pos: i }); }); if (docFile) queue.push({ kind: 'doc', blob: docFile, name: docFile.name, pos: 0 });
      total = queue.length; sent = 0; if (token && total) pump();
      try { box2.scrollIntoView({ block: 'start' }); } catch (e) { /* older browsers */ } box2.focus({ preventScroll: true });
    };
    sf.addEventListener('submit', function (e) {
      e.preventDefault(); if (cur !== 5) return;
      for (var n = 1; n <= 5; n++) { var bad = check(n); if (bad) { go(n); bad.focus(); return; } }
      if (f.website.value) { done({}); return; }   // the hidden field: looks like success, nothing is sent
      if (Date.now() - lastSend < 8000) { status.dataset.state = 'error'; status.textContent = M.err.wait; return; }
      lastSend = Date.now(); subB.disabled = true; status.dataset.state = 'info'; status.textContent = M.sending;
      fetch('/iconic-api/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) })
        .then(function (res) {
          if (res.status === 429) { status.dataset.state = 'error'; status.textContent = M.err.wait; return null; }
          if (res.status === 422) { return res.json().then(function (j) { var k = j && j.error, st = STEP_OF_ERR[k]; if (st) { go(st); var t = setErr(k === 'size' ? 'areaM2' : k, M.err[k === 'size' ? 'size' : k] || M.err.fail); if (t && t.focus) t.focus(); } status.dataset.state = 'error'; status.textContent = M.err[k] || M.err.fail; return null; }); }
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then(function (r) { if (r) done(r); })
        .catch(function () { status.dataset.state = 'error'; status.textContent = M.err.fail; })
        .then(function () { subB.disabled = false; });
    });
    syncPlace(); rooms(); restore(); go(1, true);
  })();
})();
