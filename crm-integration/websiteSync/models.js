// Collections owned by the website link. None of them is part of the CRM's own data.
import mongoose from 'mongoose';
const { Schema } = mongoose;
const def = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const Mixed = Schema.Types.Mixed;

/* the last version of each record we told the website about, and what it looked like */
export const State = def('WebsiteSyncState', new Schema({
  _id: String, entity: String, entityId: String, version: Number, hash: String, deleted: { type: Boolean, default: false },
  emittedVersion: { type: Number, default: 0 }, record: Mixed
}, { timestamps: true, collection: 'websitesync_state', versionKey: false }));

/* events waiting to be delivered; they survive restarts and a website that is down */
const outbox = new Schema({
  eventId: { type: String, required: true, unique: true }, entity: String, entityId: String, version: Number, op: String, record: Mixed,
  status: { type: String, default: 'pending' },   // pending | sent | rejected
  attempts: { type: Number, default: 0 }, nextAttemptAt: Date, lockedUntil: Date, lastError: String, lastHttp: Number, sentAt: Date, createdAt: { type: Date, default: Date.now }
}, { collection: 'websitesync_outbox', versionKey: false });
outbox.index({ entity: 1, entityId: 1, version: 1 }, { unique: true });
outbox.index({ status: 1, nextAttemptAt: 1 });
export const Outbox = def('WebsiteSyncOutbox', outbox);

/* answers to edit requests, so a retried request is answered again and never applied twice */
const request = new Schema({ requestId: { type: String, required: true, unique: true }, status: Number, body: Mixed, createdAt: { type: Date, default: Date.now, expires: 7 * 86400 } }, { collection: 'websitesync_requests', versionKey: false });
export const Request = def('WebsiteSyncRequest', request);

/* who asked for each change made from the website */
export const Audit = def('WebsiteSyncAudit', new Schema({ at: { type: Date, default: Date.now }, requestId: String, entity: String, entityId: String, requestedBy: Mixed, fields: Mixed, before: Mixed, after: Mixed, status: Number }, { collection: 'websitesync_audit', versionKey: false }));

/* developers created from the website belong to the ICONIC catalog even before they have a project */
export const Claim = def('WebsiteSyncClaim', new Schema({ _id: String, createdAt: { type: Date, default: Date.now } }, { collection: 'websitesync_claims', versionKey: false }));

export const Meta = def('WebsiteSyncMeta', new Schema({ _id: String, value: Mixed }, { collection: 'websitesync_meta', versionKey: false }));
export const ensureIndexes = () => Promise.all([State.createIndexes(), Outbox.createIndexes(), Request.createIndexes()]);
