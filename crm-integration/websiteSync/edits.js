// Changes asked for by the website: names, links between records, and whether a project is active.
// Each one is checked, applied to the CRM's own collections the way the CRM's screens do it, and answered with the confirmed record and version.
// A change is refused (409) if the record has moved on since the website opened it.
import mongoose from 'mongoose';
import Developer from '../models/Developer.js';
import Lookup from '../models/Lookup.js';
import City, { normalizeName } from '../models/City.js';
import { cfg, PROJECT_TYPES } from './config.js';
import { State, Request, Audit, Claim } from './models.js';
import { run as scan } from './scanner.js';
import { publicRecord } from './projection.js';

const ALLOWED = { developer: ['name'], city: ['name'], area: ['name', 'cityId'], project: ['name', 'active', 'developerId', 'cityId', 'areaId'] };
const isId = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/.test(v);
const oid = (v) => new mongoose.Types.ObjectId(v);
const norm = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();   // the same normalisation the CRM uses for project names
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bad = (field, message, status = 422) => ({ status, body: { ok: false, code: 'invalid', field, message } });
const done = (status, record) => ({ status, body: { ok: true, record } });
const sameId = (a, b) => String(a || '') === String(b || '');

async function currentState(entity, id) {
  await scan();   // pick up anything changed in the CRM a moment ago, so the version checked is the real one
  const st = await State.findById(entity + ':' + id).lean();
  return st && !st.deleted ? st : null;
}
const conflict = (st) => ({ status: 409, body: { ok: false, code: 'version_conflict', message: 'This record changed in the CRM.', current: publicRecord(st) } });
async function finish(entity, id, status) { await scan(); const st = await State.findById(entity + ':' + id).lean(); return st && !st.deleted ? done(status, publicRecord(st)) : { status: 500, body: { ok: false, message: 'The change was saved but could not be read back.' } }; }

async function creator() {
  const c = cfg().createdBy; if (isId(c)) return oid(c);
  const User = mongoose.models.User || (await import('../models/User.js')).default;
  const u = await User.findOne({ role: { $in: ['OWNER', 'CEO', 'ADMIN'] } }).sort({ createdAt: 1 }).select('_id').lean();
  return u ? u._id : null;
}
/* same upkeep the CRM does when a project moves between developers */
async function syncProjectDeveloper(lookupId, next, previous) {
  if (previous && !sameId(previous, next)) await Developer.updateOne({ _id: previous }, { $pull: { projects: lookupId } });
  if (next) { await Developer.updateOne({ _id: next }, { $addToSet: { projects: lookupId } }); await Developer.updateMany({ _id: { $ne: next }, projects: lookupId }, { $pull: { projects: lookupId } }); }
  else await Developer.updateMany({ projects: lookupId }, { $pull: { projects: lookupId } });
}
const nameOf = (f) => { const n = String(f.name == null ? '' : f.name).replace(/\s+/g, ' ').trim(); return n; };
const checkName = (f, required) => { if (f.name === undefined) return required ? bad('name', 'Name is required') : null; const n = nameOf(f); if (!n) return bad('name', 'Name is required'); if (n.length > 120) return bad('name', 'Name is too long'); return null; };

/* ---- developers ---- */
async function developer(id, expected, f, by, rid) {
  const nm = f.name !== undefined ? nameOf(f) : '';
  const dupe = nm ? await Developer.findOne(Object.assign({ name: new RegExp('^' + esc(nm) + '$', 'i') }, id ? { _id: { $ne: id } } : {})).select('_id').lean() : null;
  if (dupe) return bad('name', 'A developer with this name already exists');
  if (!id) {
    const by_ = await creator(); if (!by_) return { status: 500, body: { ok: false, message: 'No CRM user available to record as creator' } };
    const doc = await Developer.create({ name: nm, createdBy: by_ }); await Claim.updateOne({ _id: 'developer:' + doc._id }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    return finish('developer', String(doc._id), 201);
  }
  const cur = await Developer.findById(id).select('updatedAt').lean(); if (!cur) return { status: 404, body: { ok: false, message: 'Developer not found' } };
  if (nm) { const r = await Developer.findOneAndUpdate({ _id: id, updatedAt: cur.updatedAt }, { $set: { name: nm } }, { new: true }).lean(); if (!r) return conflict(await currentState('developer', id)); }
  return finish('developer', id, 200);
}
/* ---- cities ---- */
async function city(id, expected, f) {
  const nm = f.name !== undefined ? nameOf(f) : '', ws = cfg().workspace;
  if (nm) { const dupe = await City.findOne(Object.assign({ workspace: ws, normalizedName: normalizeName(nm) }, id ? { _id: { $ne: id } } : {})).select('_id').lean(); if (dupe) return bad('name', 'A city with this name already exists'); }
  if (!id) { const doc = await City.create({ name: nm, normalizedName: normalizeName(nm), workspace: ws, regions: [] }); return finish('city', String(doc._id), 201); }
  const cur = await City.findOne({ _id: id, workspace: ws }).select('name updatedAt').lean(); if (!cur) return { status: 404, body: { ok: false, message: 'City not found' } };
  if (nm && nm !== cur.name) {
    const r = await City.findOneAndUpdate({ _id: id, updatedAt: cur.updatedAt }, { $set: { name: nm, normalizedName: normalizeName(nm) } }, { new: true }).lean();
    if (!r) return conflict(await currentState('city', id));
    await Lookup.updateMany({ cityId: oid(id), region: cur.name }, { $set: { region: nm } });   // projects keep the city's name beside its id, as the CRM's own city screen does
  }
  return finish('city', id, 200);
}
/* ---- areas (the regions inside a city) ---- */
async function area(id, expected, f, by, rid, st) {
  const ws = cfg().workspace, nm = f.name !== undefined ? nameOf(f) : '';
  if (!id) {
    if (!f.cityId) return bad('cityId', 'City is required');
    const c = await City.findOne({ _id: f.cityId, workspace: ws }); if (!c) return bad('cityId', 'City is not in the ICONIC catalog');
    if (c.regions.some((r) => r.normalizedName === normalizeName(nm))) return bad('name', 'This city already has an area with this name');
    c.regions.push({ name: nm, normalizedName: normalizeName(nm) }); await c.save();
    return finish('area', String(c.regions[c.regions.length - 1]._id), 201);
  }
  if (f.cityId !== undefined && !sameId(f.cityId, st.record.cityId)) return bad('cityId', 'An area cannot be moved to another city');
  const c = await City.findOne({ _id: st.record.cityId, workspace: ws }); const reg = c && c.regions.id(id); if (!reg) return { status: 404, body: { ok: false, message: 'Area not found' } };
  if (nm && nm !== reg.name) {
    if (c.regions.some((r) => !sameId(r._id, id) && r.normalizedName === normalizeName(nm))) return bad('name', 'This city already has an area with this name');
    const old = reg.name, r = await City.findOneAndUpdate({ _id: c._id, updatedAt: c.updatedAt, 'regions._id': oid(id) }, { $set: { 'regions.$.name': nm, 'regions.$.normalizedName': normalizeName(nm) } }, { new: true }).lean();
    if (!r) return conflict(await currentState('area', id));
    await Lookup.updateMany({ regionId: oid(id), subArea: old }, { $set: { subArea: nm } });
  }
  return finish('area', id, 200);
}
/* ---- projects (a project name in the CRM's catalog) ---- */
async function project(id, expected, f) {
  const ws = cfg().workspace, nm = f.name !== undefined ? nameOf(f) : '';
  const pickCity = async (cid) => (cid ? City.findOne({ _id: cid, workspace: ws }).lean() : null);
  if (nm) {   // names are unique across the catalog, compared the way the CRM compares them
    const key = norm(nm), q = { type: { $in: PROJECT_TYPES }, $or: [{ normalizedLabel: key }, { normalizedLabel: { $exists: false }, label: new RegExp('^' + esc(nm) + '$', 'i') }] };
    if (id) q._id = { $ne: oid(id) }; if (await Lookup.findOne(q).select('_id').lean()) return bad('name', 'A project with this name already exists');
  }
  if (f.developerId && !(await Developer.exists({ _id: f.developerId }))) return bad('developerId', 'That developer does not exist');
  let cur = null, c = null;
  if (id) { cur = await Lookup.findOne({ _id: id, type: { $in: PROJECT_TYPES } }).lean(); if (!cur) return { status: 404, body: { ok: false, message: 'Project not found' } }; c = await pickCity(cur.cityId); }
  if (f.cityId !== undefined) { if (!f.cityId) return bad('cityId', 'City is required'); c = await pickCity(f.cityId); if (!c) return bad('cityId', 'City is not in the ICONIC catalog'); }
  else if (!id) return bad('cityId', 'City is required');
  const cityChanged = !cur || !sameId(cur.cityId, c._id);
  let regionId = cityChanged ? null : (cur && cur.regionId) || null, subArea = cityChanged ? '' : (cur && cur.subArea) || '';
  if (f.areaId !== undefined) {
    if (f.areaId) { const a = (c.regions || []).find((r) => sameId(r._id, f.areaId)); if (!a) return bad('areaId', 'That area is not in the selected city'); regionId = a._id; subArea = a.name; }
    else { regionId = null; subArea = ''; }
  }
  const set = { region: c.name, cityId: c._id, regionId, subArea };
  if (nm) { set.label = nm; set.value = nm; }
  if (f.active !== undefined) set.active = !!f.active;
  if (f.developerId !== undefined) set.developerId = f.developerId ? oid(f.developerId) : null;
  if (!id) {
    const by_ = await creator();
    const doc = await Lookup.create({ type: 'project-name', label: nm, value: nm, order: 0, active: set.active !== false, developerId: set.developerId || undefined, cityId: c._id, regionId, region: c.name, subArea, catalogType: 'project', createdBy: by_ || undefined });
    if (set.developerId) await syncProjectDeveloper(doc._id, set.developerId, null);
    return finish('project', String(doc._id), 201);
  }
  const r = await Lookup.findOneAndUpdate({ _id: id, updatedAt: cur.updatedAt }, { $set: set }, { new: true }).lean();
  if (!r) return conflict(await currentState('project', id));
  if (f.developerId !== undefined) await syncProjectDeveloper(r._id, r.developerId || null, cur.developerId || null);
  return finish('project', id, 200);
}
const HANDLERS = { developer, city, area, project };

export async function applyEdit(entity, id, input) {
  if (!HANDLERS[entity]) return { status: 404, body: { ok: false, message: 'Unknown kind' } };
  const { requestId, expectedVersion, fields, requestedBy } = input || {};
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(requestId || ''))) return bad('requestId', 'requestId is required', 400);
  const prior = await Request.findOne({ requestId }).lean(); if (prior) return { status: prior.status, body: prior.body };
  let out, before = null;
  try {
    const f = fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : null;
    if (!f) return bad('fields', 'fields required', 400);
    for (const k of Object.keys(f)) if (!ALLOWED[entity].includes(k)) return bad(k, 'This field cannot be changed from the website');
    for (const k of ['developerId', 'cityId', 'areaId']) if (f[k] !== undefined && f[k] !== '' && !isId(f[k])) return bad(k, 'Invalid id');
    if (f.active !== undefined && typeof f.active !== 'boolean') return bad('active', 'active must be true or false');
    const nameBad = checkName(f, !id); if (nameBad) return nameBad;
    if (id && !isId(id)) return { status: 404, body: { ok: false, message: 'Not found' } };
    let st = null;
    if (id) {
      st = await currentState(entity, id); if (!st) return { status: 404, body: { ok: false, message: 'Not found' } };
      if (!Number.isInteger(expectedVersion)) return bad('expectedVersion', 'expectedVersion is required', 400);
      if (expectedVersion !== st.version) return conflict(st);
      before = publicRecord(st);
    }
    out = await HANDLERS[entity](id, expectedVersion, f, requestedBy || {}, requestId, st);
  } catch (e) {
    if (e && e.code === 11000) out = bad('name', 'This name already exists');
    else if (e && e.name === 'ValidationError') out = bad(Object.keys(e.errors || {})[0] || 'fields', 'The CRM rejected these values');
    else { console.error('[website-sync] edit failed:', e && e.stack || e); out = { status: 500, body: { ok: false, message: 'The CRM could not save this change' } }; }
  }
  const after = out.body && out.body.record || null;
  try { await Audit.create({ requestId, entity, entityId: id || (after && after.id) || '', requestedBy: { email: String((requestedBy || {}).email || '').slice(0, 160), name: String((requestedBy || {}).name || '').slice(0, 120) }, fields, before, after, status: out.status }); } catch (_) { /* the trail is best effort; the change itself is already safe */ }
  if (out.status < 500) await Request.create({ requestId, status: out.status, body: out.body }).catch(() => {});
  return out;
}
