// What the website may know. Built field by field from an allow-list: names, links between records, and whether a project is active.
// No coordinates, contacts, notes, lead or unit counts, and nothing belonging to the WHITE workspace.
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Developer from '../models/Developer.js';
import Lookup from '../models/Lookup.js';
import City from '../models/City.js';
import { cfg, PROJECT_TYPES } from './config.js';
import { Claim } from './models.js';

const clean = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const sid = (v) => (v ? String(v) : '');

export async function buildCatalog() {
  const cities = await City.find({ workspace: cfg().workspace }).select('name regions').lean();
  const cityIds = cities.map((c) => c._id);
  const lookups = await Lookup.find({ type: { $in: PROJECT_TYPES }, cityId: { $in: cityIds } }).select('label active developerId cityId regionId').lean();
  const claimed = (await Claim.find({ _id: /^developer:/ }).select('_id').lean()).map((c) => c._id.slice(10));
  const devIds = new Set(lookups.map((l) => sid(l.developerId)).filter(Boolean)); claimed.forEach((id) => devIds.add(id));
  const devs = await Developer.find({ _id: { $in: [...devIds].filter((id) => mongoose.isValidObjectId(id)) } }).select('name').lean();
  const devSet = new Set(devs.map((d) => sid(d._id)));
  const records = new Map(), areaCity = new Map();
  for (const c of cities) {
    records.set('city:' + c._id, { entity: 'city', id: sid(c._id), name: clean(c.name) });
    for (const r of c.regions || []) { areaCity.set(sid(r._id), sid(c._id)); records.set('area:' + r._id, { entity: 'area', id: sid(r._id), name: clean(r.name), cityId: sid(c._id) }); }
  }
  for (const d of devs) records.set('developer:' + d._id, { entity: 'developer', id: sid(d._id), name: clean(d.name) });
  for (const l of lookups) {
    const cityId = sid(l.cityId), areaId = sid(l.regionId);
    records.set('project:' + l._id, { entity: 'project', id: sid(l._id), name: clean(l.label), active: l.active !== false, developerId: devSet.has(sid(l.developerId)) ? sid(l.developerId) : '', cityId, areaId: areaId && areaCity.get(areaId) === cityId ? areaId : '' });
  }
  for (const [k, r] of records) if (!r.name) records.delete(k);   // the website refuses unnamed records
  return records;
}

export const hashOf = (rec) => crypto.createHash('sha1').update(JSON.stringify(rec, Object.keys(rec).sort())).digest('hex');
/* the shape the website receives */
export const publicRecord = (st) => { const { entity, id, ...rest } = st.record || {}; return Object.assign({ id: st.entityId, version: st.version }, rest); };
