'use strict';
const { esc } = require('../util');
const { waNumber } = require('./ctx');

const SOCIAL_NAMES = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube'], ['tiktok', 'TikTok'], ['x', 'X']];
const httpsUrl = (u) => (typeof u === 'string' && /^https:\/\/\S+$/i.test(u.trim())) ? u.trim() : '';
const SIL = '<svg class="agent__sil" viewBox="0 0 100 125" aria-hidden="true" focusable="false"><circle cx="50" cy="48" r="19"/><path d="M14 125c0-29 16-47 36-47s36 18 36 47"/></svg>';

function media(c, p, cls, eager) {
  const src = p.images[0];
  return src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(p.title)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : `<div class="${cls} media-ph"></div>`;
}
function card(c, p) {
  const meta = [p.project, c.regionName(p.region), p.location, c.typeLabel(p.type), p.beds != null ? `${c.fmtNum(p.beds)} ${c.t('prop.beds')}` : null, p.area].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
  return `<article class="card"><div class="card__media">${media(c, p, 'media-in')}</div><div class="card__body"><h3><a class="card__open" href="${esc(p.url)}">${esc(p.title)}</a></h3><div class="card__meta">${meta}</div><p class="card__price">${esc(c.priceText(p))}</p></div></article>`;
}
const cards = (c, list) => list.map((p) => card(c, p)).join('');

function waHref(c, a, prop) {
  const n = waNumber(a.whatsapp); if (!n) return '';
  const ref = prop ? prop.title + (prop.id ? ' (' + prop.id + ')' : '') : '';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(prop ? c.t('agent.wa.unit', { name: a.name, ref }) : c.t('agent.wa.generic', { name: a.name }));
}
function agentActions(c, a, prop) {
  const wa = waHref(c, a, prop), lines = [];
  if (a.phone) lines.push(`<a dir="ltr" href="tel:${esc(String(a.phone).replace(/[^\d+]/g, ''))}">${esc(a.phone)}</a>`);
  if (a.email && /^[^\s@]+@[^\s@]+$/.test(a.email)) lines.push(`<a dir="ltr" href="mailto:${esc(a.email)}">${esc(a.email)}</a>`);
  return (wa ? `<a class="btn btn--small btn--primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(c.t('contact.whatsapp'))}</a>` : '') + (lines.length ? `<div class="agent__lines">${lines.join('')}</div>` : '');
}
const agentPhoto = (c, a) => a.photo ? `<img src="${esc(a.photo)}" alt="${esc(c.t('agent.photo', { name: a.name }))}" loading="lazy" decoding="async">` : SIL;
function agentCard(c, a, i) {
  const n = c.props.filter((p) => p.agent === a.id).length;
  return `<article class="agent" style="--i:${i % 4}"><div class="agent__photo${a.photo ? '' : ' is-ph'}">${agentPhoto(c, a)}</div><div class="agent__body"><h4 class="agent__name">${esc(a.name)}</h4><p class="agent__role">${esc(a.role)}</p><p class="agent__units">${n ? `<span>${esc(c.plural('team.units', n))}</span>` : esc(c.t('agent.units.none'))}</p><div class="agent__actions">${agentActions(c, a, null)}</div></div></article>`;
}
function teams(c, only) {
  if (!c.layout.teams && !only) return '';
  return c.teams.slice().sort((x, y) => c.regionRank(x.region) - c.regionRank(y.region)).filter((tm) => !only || tm.regions.includes(only)).map((tm) => {
    const ag = c.agents.filter((a) => a.team === tm.id), units = ag.reduce((n, a) => n + c.props.filter((p) => p.agent === a.id).length, 0);
    const meta = [c.regionsLabel(tm.regions), c.plural('team.agents', ag.length), c.plural('team.units', units)].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
    return `<section class="team" data-region="${esc(tm.regions.join(' '))}" id="team-${esc(tm.id)}" aria-labelledby="team-${esc(tm.id)}-t"><header class="team__head"><h3 id="team-${esc(tm.id)}-t">${esc(tm.name)}</h3><p class="team__meta">${meta}</p></header><div class="team__agents">${ag.map((a, i) => agentCard(c, a, i)).join('')}</div></section>`;
  }).join('');
}
function pillars(c) {
  const own = ((c.raw.about && Array.isArray(c.raw.about.pillars)) ? c.raw.about.pillars : []).map((p) => c.L(p)).filter(Boolean);
  const list = own.length ? own : [1, 2, 3, 4, 5, 6, 7, 8].map((n) => c.t('story.' + n));
  return list.map((s) => `<li>${esc(s)}</li>`).join('');
}
/* small stroke icons shared by the contact buttons and the branch cards (decorative: the text next to them names the action) */
const ICO = {
  wa: '<path d="M4 20l1.4-4.3A8 8 0 1 1 8.5 18.7L4 20z"/><path d="M9 9.2c.4 2 2.3 3.9 4.8 4.8l1.2-1.3-1.9-.9-.7.7c-.8-.3-1.6-1.1-1.9-1.9l.7-.7-.9-1.9L9 9.2z"/>',
  phone: '<path d="M5 4h4l1.8 4.5-2.4 1.5a11 11 0 0 0 5.6 5.6l1.5-2.4L20 15v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'
};
const ico = (k) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICO[k]}</svg>`;
function contactActions(c) {
  const co = c.company, out = [];
  if (waNumber(co.whatsapp)) out.push(`<a class="btn btn--primary btn--ico" href="https://wa.me/${waNumber(co.whatsapp)}" target="_blank" rel="noopener">${ico('wa')}<span>${esc(c.t('contact.whatsapp'))}</span></a>`);
  if (co.phone) out.push(`<a class="btn btn--ico" href="tel:${esc(String(co.phone).replace(/[^\d+]/g, ''))}">${ico('phone')}<span>${esc(c.t('contact.call'))}</span></a>`);
  if (co.email) out.push(`<a class="btn btn--ico" href="mailto:${esc(co.email)}">${ico('mail')}<span>${esc(c.t('contact.email'))}</span></a>`);
  return out.join('');
}
/* the company's branches: name, area, address, hours, and phone / WhatsApp / map actions, each only when filled in */
function branchItem(c, b) {
  const nm = b.name || b.city, acts = [];
  if (b.map) acts.push(`<a class="act act--map" href="${esc(b.map)}" target="_blank" rel="noopener" aria-label="${esc(c.t('branch.map') + ' — ' + nm)}">${ico('pin')}<span>${esc(c.t('branch.map'))}</span></a>`);
  if (b.phone) acts.push(`<a class="act" dir="ltr" href="tel:${esc(String(b.phone).replace(/[^\d+]/g, ''))}">${ico('phone')}<span>${esc(b.phone)}</span></a>`);
  if (waNumber(b.whatsapp)) acts.push(`<a class="act" href="https://wa.me/${waNumber(b.whatsapp)}" target="_blank" rel="noopener" aria-label="${esc(c.t('contact.whatsapp') + ' — ' + nm)}">${ico('wa')}<span>${esc(c.t('contact.whatsapp'))}</span></a>`);
  return `<li class="branch"><h4 class="branch__name">${esc(nm)}</h4>${b.city && b.name ? `<p class="branch__city">${esc(b.city)}</p>` : ''}${b.address ? `<address class="branch__addr">${esc(b.address)}</address>` : ''}${b.hours ? `<p class="branch__hours"><span class="branch__k">${esc(c.t('branch.hours'))}</span> ${esc(b.hours)}</p>` : ''}${acts.length ? `<div class="branch__acts">${acts.join('')}</div>` : ''}</li>`;
}
/* the list of branch cards; the home page shows it as its own block under the contact form, inner pages inside the footer */
function branchList(c) { return `<ul class="branches">${c.branches.map((b) => branchItem(c, b)).join('')}</ul>`; }
function branchesSection(c) {
  return c.branches.length ? `<section class="cbranches__in" aria-labelledby="cb-h"><h3 class="cbranches__h" id="cb-h">${esc(c.t('contact.branches'))}</h3>${branchList(c)}</section>` : '';
}
function branchesBlock(c) {
  return c.branches.length ? `<div class="ci__row ci__branches"><span class="ci__k">${esc(c.t('contact.branches'))}</span>${branchList(c)}</div>` : '';
}
function contactInfo(c, o) {
  const co = c.company, rows = [];
  if (co.address) rows.push(`<div class="ci__row"><span class="ci__k">${esc(c.t('contact.address'))}</span><address>${esc(co.address)}</address></div>`);
  if (co.hours) rows.push(`<div class="ci__row"><span class="ci__k">${esc(c.t('contact.hours'))}</span><p>${esc(co.hours)}</p></div>`);
  if (c.branches.length && !(o && o.branches === false)) rows.push(branchesBlock(c));
  const links = SOCIAL_NAMES.map(([k, n]) => [n, httpsUrl(co.social[k])]).filter((x) => x[1]);
  if (links.length) rows.push(`<div class="ci__row"><span class="ci__k">${esc(c.t('contact.follow'))}</span><ul class="ci__social">${links.map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join('')}</ul></div>`);
  return rows.join('');
}
/* regions that actually have something to show, as plain links: they connect the pages for visitors and for search engines */
function activeRegions(c) { return c.REGIONS.filter((r) => c.props.some((p) => p.region === r.id) || c.teams.some((tm) => tm.regions.includes(r.id))); }
function regionLinks(c, current) {
  const rs = activeRegions(c); if (!rs.length) return '';
  const li = (href, text, on) => `<li><a class="chip" href="${esc(href)}"${on ? ' aria-current="true"' : ''}>${esc(text)}</a></li>`;
  return `<nav class="regionlinks" aria-label="${esc(c.t('home.regions'))}"><p class="note regionlinks__t">${esc(c.t('home.regions'))}</p><ul class="chips">${li('/' + c.lang + '/properties', c.t('pg.all'), current === 'all')}${rs.map((r) => li('/' + c.lang + '/properties/' + r.id, r[c.lang], current === r.id)).join('')}</ul></nav>`;
}
function leadForm(c, o) {
  o = o || {};
  const m = JSON.stringify({ name: c.t('form.err.name'), phone: c.t('form.err.phone'), email: c.t('form.err.email'), contact: c.t('form.err.contact'), consent: c.t('form.err.consent'), sending: c.t('form.sending'), sent: c.t('form.sent'), fail: c.t('form.fail'), wait: c.t('form.err.wait'), inquiry: c.t('form.submit.inquiry'), viewing: c.t('form.submit.viewing') });
  return `<form class="form" id="leadForm" novalidate aria-labelledby="form-title" data-msgs="${esc(m)}">
<h3 id="form-title">${esc(c.t('form.title'))}</h3>
<fieldset class="seg"><legend>${esc(c.t('form.interest'))}</legend><label><input type="radio" name="interest" value="inquiry" checked><span>${esc(c.t('form.interest.inquiry'))}</span></label><label><input type="radio" name="interest" value="viewing"><span>${esc(c.t('form.interest.viewing'))}</span></label></fieldset>
<div class="field"><label for="f-name">${esc(c.t('form.name'))}</label><input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="e-name"><p class="err" id="e-name" role="alert"></p></div>
<div class="row2"><div class="field"><label for="f-phone">${esc(c.t('form.phone'))}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="e-phone"><p class="err" id="e-phone" role="alert"></p></div>
<div class="field"><label for="f-email">${esc(c.t('form.email'))}</label><input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="e-email"><p class="err" id="e-email" role="alert"></p></div></div>
<p class="err" id="e-contact" role="alert"></p>
<div class="field"><label for="f-msg">${esc(c.t('form.message'))}</label><textarea id="f-msg" name="message" rows="3"></textarea></div>
<input type="hidden" name="property" value="${esc(o.property || '')}"><input type="hidden" name="agent" value="${esc(o.agent || '')}">
<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<label class="consent"><input type="checkbox" id="f-consent" name="consent" aria-describedby="e-consent"><span>${esc(c.t('form.consent'))}</span></label><p class="err" id="e-consent" role="alert"></p>
<button class="btn btn--primary" id="submitBtn" type="submit">${esc(c.t('form.submit.inquiry'))}</button><p class="status" id="formStatus" role="status" aria-live="polite"></p></form>`;
}
/* ---- job application form ---- */
function applyForm(c, o) {
  o = o || {};
  const m = JSON.stringify({ name: c.t('form.err.name'), phone: c.t('form.err.phone'), email: c.t('form.err.email'), contact: c.t('form.err.contact'), consent: c.t('form.err.consent'), cvType: c.t('apply.err.cvType'), cvSize: c.t('apply.err.cvSize'), sending: c.t('apply.sending'), sent: c.t('apply.sent'), fail: c.t('apply.fail'), wait: c.t('form.err.wait') });
  const jobField = o.job
    ? `<input type="hidden" name="job" value="${esc(o.job.id)}">`
    : `<div class="field"><label for="a-job">${esc(c.t('apply.job'))}</label><select id="a-job" name="job"><option value="">${esc(c.t('apply.general'))}</option>${c.jobs.map((j) => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('')}</select></div>`;
  return `<form class="form" id="applyForm" novalidate aria-labelledby="apply-title" data-msgs="${esc(m)}">
<h3 id="apply-title">${esc(o.title || c.t('apply.title'))}</h3>
${jobField}
<div class="field"><label for="a-name">${esc(c.t('form.name'))}</label><input id="a-name" name="name" type="text" autocomplete="name" required aria-describedby="ea-name"><p class="err" id="ea-name" role="alert"></p></div>
<div class="row2"><div class="field"><label for="a-phone">${esc(c.t('form.phone'))}</label><input id="a-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="ea-phone"><p class="err" id="ea-phone" role="alert"></p></div>
<div class="field"><label for="a-email">${esc(c.t('form.email'))}</label><input id="a-email" name="email" type="email" autocomplete="email" aria-describedby="ea-email"><p class="err" id="ea-email" role="alert"></p></div></div>
<p class="err" id="ea-contact" role="alert"></p>
<div class="field"><label for="a-msg">${esc(c.t('apply.message'))}</label><textarea id="a-msg" name="message" rows="3"></textarea></div>
<div class="field"><label for="a-cv">${esc(c.t('apply.cv'))}</label><input id="a-cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-describedby="ea-cv"><small class="note">${esc(c.t('apply.cvHint'))}</small><p class="err" id="ea-cv" role="alert"></p></div>
<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<label class="consent"><input type="checkbox" id="a-consent" name="consent" aria-describedby="ea-consent"><span>${esc(c.t('apply.consent'))}</span></label><p class="err" id="ea-consent" role="alert"></p>
<button class="btn btn--primary" id="applyBtn" type="submit">${esc(c.t('apply.submit'))}</button><p class="status" id="applyStatus" role="status" aria-live="polite"></p></form>`;
}
module.exports = { applyForm, branchItem, branchesBlock, branchesSection, card, cards, agentCard, teams, pillars, contactActions, contactInfo, regionLinks, activeRegions, leadForm, waHref, agentActions, agentPhoto, httpsUrl, SOCIAL_NAMES };
