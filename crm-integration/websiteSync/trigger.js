// A tiny switchboard with no imports, so the global plugin can be loaded before any model is compiled.
let handler = null;
export const setHandler = (fn) => { handler = fn; };
export const notify = () => { try { if (handler) handler(); } catch (_) { /* a change in the CRM must never fail because of the website link */ } };
