import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Input, Msg, Spinner, idOf } from '../common/ui';

const empty = { name: '', description: '', image_url: '', category: '', featured: false, events: [] };

export default function CharityManager() {
  const [list, setList] = useState(null);
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get('/charities').then((r) => setList(r.data)).catch((e) => setErr(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editing) await api.put(`/charities/${editing}`, f); else await api.post('/charities', f);
      setF(empty); setEditing(null); load();
    } catch (e) { setErr(errMsg(e)); }
  };

  const del = async (id) => {
    if (!confirm('Delete this charity?')) return;
    try { await api.delete(`/charities/${id}`); load(); } catch (e) { setErr(errMsg(e)); }
  };

  const setEvent = (i, patch) => setF({ ...f, events: f.events.map((ev, j) => (j === i ? { ...ev, ...patch } : ev)) });
  const addEvent = () => setF({ ...f, events: [...f.events, { title: '', date: '', location: '' }] });
  const removeEvent = (i) => setF({ ...f, events: f.events.filter((_, j) => j !== i) });

  if (!list && !err) return <Spinner />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <h3 className="mb-3 font-semibold">{editing ? 'Edit' : 'Add'} charity</h3>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="Category" value={f.category || ''} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <Input label="Image URL" value={f.image_url || ''} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
          <label className="block text-sm text-white/70">Description
            <textarea rows="3" className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured on homepage
          </label>

          <div>
            <p className="mb-2 text-sm text-white/70">Upcoming events</p>
            {f.events.map((ev, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_9rem_1fr_auto] gap-2">
                <input placeholder="Title" className="rounded-xl border border-white/10 bg-ink px-2 py-1 text-sm" value={ev.title || ''} onChange={(e) => setEvent(i, { title: e.target.value })} />
                <input type="date" className="rounded-xl border border-white/10 bg-ink px-2 py-1 text-sm" value={ev.date || ''} onChange={(e) => setEvent(i, { date: e.target.value })} />
                <input placeholder="Location" className="rounded-xl border border-white/10 bg-ink px-2 py-1 text-sm" value={ev.location || ''} onChange={(e) => setEvent(i, { location: e.target.value })} />
                <button type="button" className="text-red-400" onClick={() => removeEvent(i)} aria-label="Remove event">✕</button>
              </div>
            ))}
            <button type="button" className="text-sm text-brand" onClick={addEvent}>+ Add event</button>
          </div>

          <Msg>{err}</Msg>
          <div className="flex gap-2">
            <Btn>{editing ? 'Update' : 'Add'}</Btn>
            {editing && <Btn type="button" variant="ghost" onClick={() => { setEditing(null); setF(empty); }}>Cancel</Btn>}
          </div>
        </form>
      </Card>
      <div className="space-y-2">
        {list?.map((c) => (
          <Card key={idOf(c)} className="flex items-center justify-between">
            <span>{c.name} {c.featured && 
              <span className="text-xs text-warm">★ featured</span>
              }
            </span>
            <span className="flex gap-3 text-sm">
              <button className="text-warm" onClick={() => { setEditing(idOf(c)); setF({ ...empty, ...c, events: Array.isArray(c.events) ? c.events : [] }); }}>Edit</button>
              <button className="text-red-400" onClick={() => del(idOf(c))}>Delete</button>
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
