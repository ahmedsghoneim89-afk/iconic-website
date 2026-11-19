'use strict';
/* "Sell your unit": the five-step form, and the private page where the sender follows the request. */
const cfg = require('../config');
const { esc } = require('../util');
const I = require('../i18n.json');
const F = require('./frag');
const S = require('./seo');
const P = require('./pages');
const { waNumber } = require('./ctx');
const sell = require('../sell');

const CUR = sell.CURRENCIES;
const sep = (c) => (c.lang === 'ar' ? '، ' : ', ');

/* governorates, areas and projects for the linked lists: [id, name], [id, name, cityId], [id, name, cityId, areaId] */
function sellTree(c) {
  const K = c.catalog, count = {};
  K.shownProjects.forEach((p) => { const k = p.city.id + '|' + p.name.toLowerCase(); count[k] = (count[k] || 0) + 1; });
  return {
    c: K.cities.map((x) => [x.id, x.name]),
    a: K.areas.map((x) => [x.id, x.name, x.cityId]),
    p: K.shownProjects.map((x) => [x.id, count[x.city.id + '|' + x.name.toLowerCase()] > 1 && x.developer ? x.name + ' (' + x.developer.name + ')' : x.name, x.city.id, x.area ? x.area.id : ''])
  };
}

const err = (id) => `<p class="err" id="es-${id}" role="alert"></p>`;
const field = (c, id, labelKey, control, extra) => `<div class="field"${extra || ''}><label for="s-${id}">${esc(c.t(labelKey))}</label>${control}${err(id)}</div>`;
const input = (id, o) => { o = o || {}; return `<input id="s-${id}" name="${o.name || id}" type="${o.type || 'text'}"${o.auto ? ` autocomplete="${o.auto}"` : ' autocomplete="off"'}${o.mode ? ` inputmode="${o.mode}"` : ''}${o.dir ? ` dir="${o.dir}"` : ''}${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''} aria-describedby="es-${id}">`; };
const seg = (c, name, legendKey, items, checked, attrs) => `<fieldset class="seg"${attrs || ''}><legend>${esc(c.t(legendKey))}</legend>${items.map(([v, text]) => `<label><input type="radio" name="${name}" value="${esc(v)}"${v === checked ? ' checked' : ''}><span>${esc(text)}</span></label>`).join('')}</fieldset>`;

function messages(c) {
  const t = (k) => c.t(k), e = {};
  ['name', 'phone', 'email', 'city', 'area', 'type', 'size', 'price', 'video', 'photoType', 'photoMax', 'docType', 'docSize', 'consent', 'fail', 'wait'].forEach((k) => { e[k] = t('sell.err.' + k); });
  const l = {};
  ['who', 'name', 'phone', 'email', 'city', 'area', 'project', 'type', 'purpose', 'size', 'beds', 'baths', 'floor', 'finishing', 'price', 'negotiable', 'valuation', 'details', 'video', 'doc'].forEach((k) => { l[k] = t('sell.' + k); });
  l.remove = t('sell.photos.remove'); l.cover = t('sell.photos.cover');
  const r = {}; ['edit', 'contact', 'unit', 'price', 'files', 'photos', 'doc', 'video', 'none'].forEach((k) => { r[k] = t('sell.review.' + k); });
  const o = {};
  o.who = { owner: t('sell.who.owner'), broker: t('sell.who.broker') };
  o.purpose = { sale: t('sell.purpose.sale'), rent: t('sell.purpose.rent') };
  o.fin = Object.fromEntries(sell.FINISHING.map((k) => [k, t('sell.fin.' + k)]));
  o.type = Object.fromEntries(I.types.map((x) => [x[0], c.typeLabel(x[0])]));
  return {
    err: e, l, r, o, sending: t('sell.sending'), next: t('sell.next'), submit: t('sell.submit'), stepOf: t('sell.stepof'), steps: [1, 2, 3, 4, 5].map((n) => t('sell.s' + n)),
    done: { ref: t('sell.done.lede'), copied: t('sell.done.copied'), copy: t('sell.done.copy') },
    up: { n: t('sell.up.n'), ok: t('sell.up.ok'), fail: t('sell.up.fail') }, other: t('sell.other'), choose: t('sell.choose'), noProject: t('sell.noProject'), sqm: t('unit.sqm')
  };
}

function sellForm(c) {
  const l = c.lang, tree = sellTree(c), hasCatalog = tree.c.length > 0;
  const stepHead = (n) => `<h2 class="sell__h" id="sell-h-${n}" tabindex="-1">${esc(c.t('sell.s' + n))}</h2><p class="note sell__hint">${esc(c.t('sell.s' + n + '.hint'))}</p>`;
  const sel = (id, name, blankKey, extra) => `<select id="s-${id}" name="${name}" aria-describedby="es-${id}"${extra || ''}><option value="">${esc(c.t(blankKey || 'sell.choose'))}</option></select>`;
  const other = (id, labelKey) => `<div class="field sell__other" data-other="${id}" hidden><label for="s-${id}Other">${esc(c.t(labelKey))}</label>${input(id + 'Other', { name: id + 'Other' })}<p class="err" id="es-${id}Other" role="alert"></p></div>`;
  const types = I.types.map((x) => [x[0], c.typeLabel(x[0])]);
  const place = hasCatalog
    ? `<div class="row2">${field(c, 'city', 'sell.city', sel('city', 'city'))}${other('city', 'sell.city')}</div>
<div class="row2">${field(c, 'area', 'sell.area', sel('area', 'area'), ' data-f="area"')}${other('area', 'sell.area')}</div>
<div class="row2">${field(c, 'project', 'sell.project', sel('project', 'project'), ' data-f="project"')}${other('project', 'sell.projectName')}</div>`
    : `<div class="row2">${field(c, 'cityOther', 'sell.city', input('cityOther', { name: 'cityOther' }))}${field(c, 'areaOther', 'sell.area', input('areaOther', { name: 'areaOther' }))}</div>
${field(c, 'projectOther', 'sell.projectName', input('projectOther', { name: 'projectOther' }))}`;
  const fin = `<select id="s-finishing" name="finishing"><option value="">${esc(c.t('sell.choose'))}</option>${sell.FINISHING.map((k) => `<option value="${k}">${esc(c.t('sell.fin.' + k))}</option>`).join('')}</select>`;
  const cur = `<select id="s-currency" name="currency">${CUR.map((k) => `<option value="${k}">${esc(k)}</option>`).join('')}</select>`;
  const steps = [1, 2, 3, 4, 5].map((n) => `<li class="sell__stepi" data-i="${n}"><span class="sell__n" aria-hidden="true">${c.fmtNum(n)}</span><span class="sell__t">${esc(c.t('sell.s' + n))}</span></li>`).join('');
  return `<form class="form sell" id="sellForm" novalidate data-lang="${l}" data-max="${sell.MAX_PHOTOS}" data-tree="${esc(JSON.stringify(tree))}" data-msgs="${esc(JSON.stringify(messages(c)))}" aria-label="${esc(c.t('pg.sell.title'))}">
<nav class="sell__prog" aria-label="${esc(c.t('sell.steps'))}"><ol class="sell__steps">${steps}</ol><div class="sell__bar" aria-hidden="true"><span id="sellBar"></span></div><p class="sell__of note" id="sellOf" aria-live="polite"></p></nav>
<section class="sell__step" data-step="1" aria-labelledby="sell-h-1">${stepHead(1)}
${seg(c, 'who', 'sell.who', [['owner', c.t('sell.who.owner')], ['broker', c.t('sell.who.broker')]], 'owner')}
${field(c, 'name', 'sell.name', input('name', { auto: 'name' }))}
<div class="row2">${field(c, 'phone', 'sell.phone', input('phone', { type: 'tel', auto: 'tel', mode: 'tel', dir: 'ltr' }))}${field(c, 'email', 'sell.email', input('email', { type: 'email', auto: 'email', dir: 'ltr' }))}</div>
<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div></section>
<section class="sell__step" data-step="2" aria-labelledby="sell-h-2" hidden>${stepHead(2)}
${seg(c, 'purpose', 'sell.purpose', [['sale', c.t('sell.purpose.sale')], ['rent', c.t('sell.purpose.rent')]], 'sale')}
${seg(c, 'type', 'sell.type', types, '')}<p class="err" id="es-type" role="alert"></p>
${place}</section>
<section class="sell__step" data-step="3" aria-labelledby="sell-h-3" hidden>${stepHead(3)}
<div class="row2">${field(c, 'areaM2', 'sell.size', input('areaM2', { name: 'areaM2', type: 'text', mode: 'decimal', dir: 'ltr' }))}${field(c, 'floor', 'sell.floor', input('floor', { dir: 'ltr' }))}</div>
<div class="row2" data-f="rooms">${field(c, 'beds', 'sell.beds', input('beds', { mode: 'numeric', dir: 'ltr' }))}${field(c, 'baths', 'sell.baths', input('baths', { mode: 'numeric', dir: 'ltr' }))}</div>
${field(c, 'finishing', 'sell.finishing', fin)}
<div class="row2 sell__price">${field(c, 'price', 'sell.price', input('price', { mode: 'numeric', dir: 'ltr' }))}${field(c, 'currency', 'sell.currency', cur)}</div>
<p class="note sell__words" id="sellWords" aria-live="polite"></p>
<label class="consent"><input type="checkbox" name="negotiable" id="s-negotiable"><span>${esc(c.t('sell.negotiable'))}</span></label>
<label class="consent"><input type="checkbox" name="valuation" id="s-valuation"><span>${esc(c.t('sell.valuation'))}</span></label>
${field(c, 'details', 'sell.details', '<textarea id="s-details" name="details" rows="4" maxlength="1500"></textarea>')}</section>
<section class="sell__step" data-step="4" aria-labelledby="sell-h-4" hidden>${stepHead(4)}
<div class="sell__drop" id="sellDrop"><p class="sell__label">${esc(c.t('sell.photos'))}</p><p class="note">${esc(c.t('sell.photos.hint'))}</p>
<div class="sell__grid" id="sellGrid"></div>
<div class="sell__pick"><input id="s-photos" class="sell__file" type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple><label class="btn btn--small" for="s-photos">${esc(c.t('sell.photos.add'))}</label><span class="note">${esc(c.t('sell.photos.drop'))}</span></div>
<p class="err" id="es-photos" role="alert"></p></div>
${field(c, 'video', 'sell.video', input('video', { type: 'url', dir: 'ltr' }) + `<small class="note">${esc(c.t('sell.video.hint'))}</small>`)}
<div class="field"><label for="s-doc">${esc(c.t('sell.doc'))}</label><input id="s-doc" name="doc" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-describedby="es-doc"><small class="note">${esc(c.t('sell.doc.hint'))}</small>${err('doc')}</div></section>
<section class="sell__step" data-step="5" aria-labelledby="sell-h-5" hidden>${stepHead(5)}
<div class="sell__review" id="sellReview"></div>
<label class="consent"><input type="checkbox" id="s-consent" name="consent" aria-describedby="es-consent"><span>${esc(c.t('sell.consent'))}</span></label>${err('consent')}</section>
<div class="sell__nav"><button type="button" class="btn" id="sellBack" hidden>${esc(c.t('sell.back'))}</button><span class="sell__grow"></span><button type="button" class="btn btn--primary" id="sellNext">${esc(c.t('sell.next'))}</button><button type="submit" class="btn btn--primary" id="sellSubmit" hidden>${esc(c.t('sell.submit'))}</button></div>
<p class="status" id="sellStatus" role="status" aria-live="polite"></p></form>
<section class="sell__done" id="sellDone" hidden tabindex="-1" aria-labelledby="sell-done-h"><div class="sell__check" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
<h2 class="h3" id="sell-done-h">${esc(c.t('sell.done.title'))}</h2><p class="lede" id="sellDoneText"></p>
<div class="sell__acts"><div class="sell__act" id="sellWaBox" hidden><a class="btn btn--primary" id="sellWa" target="_blank" rel="noopener noreferrer">${esc(c.t('sell.done.wa'))}</a><p class="note">${esc(c.t('sell.done.waHint'))}</p></div>
<div class="sell__act"><a class="btn" id="sellTrack">${esc(c.t('sell.done.track'))}</a><p class="note">${esc(c.t('sell.done.trackHint'))}</p><button type="button" class="linklike" id="sellCopy">${esc(c.t('sell.done.copy'))}</button></div></div>
<div class="sell__up" id="sellUp" hidden><p id="sellUpText" role="status" aria-live="polite"></p><div class="sell__bar" aria-hidden="true"><span id="sellUpBar"></span></div><button type="button" class="btn btn--small" id="sellRetry" hidden>${esc(c.t('sell.up.retry'))}</button></div>
<p><a class="linklike" href="/${l}/sell">${esc(c.t('sell.done.another'))}</a></p></section>`;
}

function sellPage(c) {
  const l = c.lang, path = S.urls.sell, title = `${c.t('pg.sell.title')} | ${cfg.brand}`;
  const how = [1, 2, 3, 4].map((n) => `<li><strong>${esc(c.t('sell.how.' + n))}</strong><span>${esc(c.t('sell.how.' + n + 't'))}</span></li>`).join('');
  const body = `<div class="wrap pg__wrap">${P.crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.sell.title')]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.sell.title'))}</h1><p class="lede">${esc(c.t('pg.sell.lede'))}</p></header>
<div class="sellgrid"><aside class="sell__how" aria-labelledby="how-h"><h2 class="sell__label" id="how-h">${esc(c.t('sell.how.title'))}</h2><ol>${how}</ol></aside><div class="sellgrid__form">${sellForm(c)}</div></div></div>`;
  const jsonld = S.graph([S.orgNode(c), S.siteNode(c), S.crumbs(c, [[c.t('pg.home'), S.urls.home(l)], [c.t('pg.sell.title'), S.urls.sell(l)]])]);
  return P.page(c, { path, title, description: c.clip(c.t('pg.sell.meta'), 158), jsonld, nav: 'sell' }, body);
}

/* ---- the sender's own page ---- */
const dateText = (c, ms) => { try { return new Intl.DateTimeFormat(c.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(new Date(ms)); } catch (_) { return new Date(ms).toISOString().slice(0, 10); } };
function trackPage(c, t) {
  const l = c.lang, path = (x) => S.urls.sellTrack(x, t.token), rent = t.purpose === 'rent';
  const keys = ['received', 'reviewed', 'inspected', 'published', rent ? 'rented' : 'sold'];
  const co = waNumber(c.company.whatsapp), tel = String(c.company.phone || '').replace(/[^\d+]/g, '');
  const agent = t.agentId ? c.agentById.get(t.agentId) : null, awa = agent ? waNumber(agent.whatsapp) : '';
  const unit = t.unitId && ['published', 'sold'].includes(t.status) ? c.props.find((p) => p.id === t.unitId) : null;
  const facts = [[c.typeLabel(t.type), 0], [c.purposeLabel(t.purpose), 0], [t.where.split(' › ').join(sep(c)), 0], [t.areaM2 ? c.fmtNum(t.areaM2) + ' ' + c.t('unit.sqm') : '', 0]].filter((x) => x[0]);
  const price = t.valuation ? c.t('track.valuation') : t.price != null ? c.priceText({ price: t.price, currency: t.currency }) : '';
  const stepList = t.step < 0 ? '' : `<ol class="trk__steps" aria-label="${esc(c.t('track.stage'))}">${keys.map((k, i) => {
    const state = i < t.step ? 'done' : i === t.step ? 'now' : 'todo', when = t.reached[i];
    return `<li class="trk__s is-${state}"${state === 'now' ? ' aria-current="step"' : ''}><span class="trk__dot" aria-hidden="true">${state === 'done' ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : c.fmtNum(i + 1)}</span><span class="trk__lab">${esc(c.t('track.step.' + k))}</span>${when && state !== 'todo' ? `<time class="trk__when note" datetime="${new Date(when).toISOString()}">${esc(dateText(c, when))}</time>` : ''}</li>`;
  }).join('')}</ol>`;
  const stage = t.step < 0
    ? `<section class="trk__now trk__now--off"><h2 class="h3">${esc(c.t('track.rejected.title'))}</h2><p class="lede">${esc(c.t('track.rejected.body'))}</p><p><a class="btn" href="/${l}/sell">${esc(c.t('sell.done.another'))}</a></p></section>`
    : `<section class="trk__now"><p class="sell__label">${esc(c.t('track.stage'))}</p><h2 class="h3">${esc(c.t('track.step.' + keys[t.step]))}</h2><p class="lede">${esc(c.t('track.d.' + keys[t.step]))}</p></section>`;
  const msg = t.clientNote ? `<section class="trk__msg" aria-labelledby="trk-msg"><h2 class="sell__label" id="trk-msg">${esc(c.t('track.msg'))}</h2><p>${esc(t.clientNote)}</p>${t.note ? `<p class="note">${esc(dateText(c, t.note))}</p>` : ''}</section>` : '';
  const ag = agent ? `<section class="trk__agent" aria-labelledby="trk-ag"><h2 class="sell__label" id="trk-ag">${esc(c.t('track.agent'))}</h2><div class="agentline__row"><div class="agentline__photo agent__photo${agent.photo ? '' : ' is-ph'}">${F.agentPhoto(c, agent)}</div><div class="agentline__who"><strong>${esc(agent.name)}</strong><span>${esc(agent.role)}</span></div>${awa ? `<a class="btn btn--small btn--primary" target="_blank" rel="noopener noreferrer" href="https://wa.me/${awa}?text=${encodeURIComponent(c.t('track.wa.text', { ref: t.ref }))}">${esc(c.t('track.agent.wa', { name: agent.name }))}</a>` : ''}</div></section>` : '';
  const acts = [co ? `<a class="btn${agent ? '' : ' btn--primary'}" target="_blank" rel="noopener noreferrer" href="https://wa.me/${co}?text=${encodeURIComponent(c.t('track.wa.text', { ref: t.ref }))}">${esc(c.t('track.wa'))}</a>` : '', tel ? `<a class="btn" href="tel:${esc(tel)}">${esc(c.t('track.call'))}</a>` : '', unit ? `<a class="btn" href="${esc(unit.url)}">${esc(c.t('track.view'))}</a>` : ''].filter(Boolean).join('');
  const body = `<div class="wrap pg__wrap trk">${P.crumbsHtml(c, [[c.t('pg.home'), '/' + l + '/'], [c.t('pg.sell.title'), '/' + l + '/sell'], [t.ref]])}
<header class="pg__head"><h1 class="h2">${esc(c.t('pg.track.title'))}</h1><p class="trk__ref"><span class="note">${esc(c.t('track.ref'))}</span> <strong dir="ltr">${esc(t.ref)}</strong></p><p class="note">${esc(c.t('track.sent', { date: dateText(c, t.created) }))} · ${esc(c.t('track.updated', { date: dateText(c, t.updated) }))}</p></header>
${stage}${stepList}${msg}${ag}
<section class="trk__unit" aria-labelledby="trk-unit"><h2 class="sell__label" id="trk-unit">${esc(c.t('track.unit'))}</h2><p class="trk__facts">${facts.map((x) => `<span>${esc(x[0])}</span>`).join('')}</p>${price ? `<p class="trk__price">${esc(price)}</p>` : ''}${t.photos ? `<p class="note">${esc(c.t('track.photos', { n: c.fmtNum(t.photos) }))}</p>` : ''}</section>
${acts ? `<div class="cta-row trk__acts">${acts}</div>` : ''}
<p class="note trk__private">${esc(c.t('track.private'))}</p></div>`;
  return P.page(c, { path, title: `${c.t('pg.track.title')} ${t.ref} | ${cfg.brand}`, description: c.t('track.private'), noindex: true, nav: 'sell' }, body);
}
module.exports = { sellPage, trackPage, sellTree };
