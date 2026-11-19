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
})();
