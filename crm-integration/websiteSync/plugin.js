// Loaded first by the CRM (before any model is compiled). After every write to a catalog model it asks the scanner to look again,
// which is what makes a change reach the website within moments. It never reads or changes the data itself.
import mongoose from 'mongoose';
import { notify } from './trigger.js';

const WATCHED = new Set(['Developer', 'Project', 'Lookup', 'City']);
const nameOf = (x) => { try { return x && (x.modelName || (x.constructor && x.constructor.modelName) || (x.model && x.model.modelName)) || ''; } catch (_) { return ''; } };
function fire() { try { if (WATCHED.has(nameOf(this))) notify(); } catch (_) { /* never throw from a hook */ } }

if (!mongoose.__iconicWebsiteSyncPlugin) {
  mongoose.__iconicWebsiteSyncPlugin = true;
  mongoose.plugin((schema) => {
    schema.post('save', fire);
    schema.post('insertMany', fire);
    for (const op of ['findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete', 'updateOne', 'updateMany', 'replaceOne', 'deleteOne', 'deleteMany']) schema.post(op, { document: false, query: true }, fire);
    schema.post('deleteOne', { document: true, query: false }, fire);
  });
}
