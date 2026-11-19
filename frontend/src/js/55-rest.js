/* ---------- REST client for the production server ----------
   Gives the dashboard the same small database / upload / download surface it gets from the prototype runtime,
   so one dashboard serves both. Only used for a signed-in editor. */
function restClient(csrf) {
  const subs = new Set();
  const call = async (method, path, body, raw) => {
    const headers = { 'X-CSRF-Token': csrf, Accept: 'application/json' };
    if (raw) headers['Content-Type'] = raw.type; else if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch('/api' + path, { method, credentials: 'same-origin', headers, body: raw ? raw.body : (body !== undefined ? JSON.stringify(body) : undefined) });
    if (res.status === 404 && method === 'GET') return null;
    if (!res.ok) { const e = new Error('http ' + res.status); e.code = res.status; throw e; }
    return res.status === 204 ? null : res.json();
  };
  const refresh = () => subs.forEach((f) => f());
  const listen = (f) => { subs.add(f); f(); return () => subs.delete(f); };
  const docRef = (path) => ({
    id: path.split('/').pop(), path,
    set: async (d) => { await call('PUT', '/db/' + path, d); refresh(); },
    delete: async () => { await call('DELETE', '/db/' + path); refresh(); },
    onSnapshot(next, err) { return listen(async () => { try { const r = await call('GET', '/db/' + path); next({ id: path.split('/').pop(), exists: !!r, data: () => (r ? r.data : undefined) }); } catch (e) { if (err) err(e); } }); }
  });
  const colRef = (col) => ({
    doc: (id) => docRef(col + '/' + id),
    onSnapshot(next, err) { return listen(async () => { try { const r = await call('GET', '/db/' + col), docs = ((r && r.docs) || []).map((d) => ({ id: d.id, exists: true, data: () => d.data })); next({ docs, size: docs.length, empty: !docs.length }); } catch (e) { if (err) err(e); } }); }
  });
  return {
    call, refresh, listen,
    db: { doc: docRef, collection: colRef },
    assets: { upload: async (blob) => { const r = await call('POST', '/assets', undefined, { type: blob.type || 'application/octet-stream', body: blob }); return { id: r.id, url: r.url }; } },
    downloads: { save: async ({ filename, data }) => { const u = URL.createObjectURL(new Blob([data], { type: 'application/json' })), a = doc.createElement('a'); a.href = u; a.download = filename; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return { status: 'saved' }; } }
  };
}
