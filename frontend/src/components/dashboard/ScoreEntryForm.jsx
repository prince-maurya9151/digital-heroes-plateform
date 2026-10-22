import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Input, Msg, Spinner, idOf, localToday, fmtDate } from '../common/ui';

export default function ScoreEntryForm() {
  const [scores, setScores] = useState(null);
  const [f, setF] = useState({ score: '', played_on: localToday() });
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get('/scores').then((r) => setScores(r.data)).catch((e) => { setErr(errMsg(e)); setScores([]); }), []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setEditing(null); setF({ score: '', played_on: localToday() }); };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editing) await api.put(`/scores/${editing}`, f); else await api.post('/scores', f);
      reset(); load();
    } catch (e) { setErr(errMsg(e)); }
  };

  const del = async (id) => {
    if (!confirm('Delete this score?')) return;
    try { await api.delete(`/scores/${id}`); load(); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <Card className="md:col-span-2">
      <h2 className="mb-1 text-lg font-semibold">My scores</h2>
      <p className="mb-4 text-sm text-white/60">Latest 5 Stableford scores (1–45). A new score replaces the oldest.</p>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <Input label="Score" type="number" min="1" max="45" required value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} />
          </div>
        <div className="w-44">
          <Input label="Date" type="date" max={localToday()} required value={f.played_on} onChange={(e) => setF({ ...f, played_on: e.target.value })} />
        </div>
        <Btn>{editing ? 'Update' : 'Add score'}</Btn>
        {editing && 
        <Btn type="button" variant="ghost" onClick={reset}>Cancel</Btn>
        }
      </form>
      <div className="mt-3">
        <Msg>{err}</Msg>
        </div>
      {!scores ? 
      <Spinner /> : scores.length === 0 ? 
      <p className="mt-4 text-white/50">No scores yet. Add your first one!</p>
       : (
        <ul className="mt-4 space-y-2">
          <AnimatePresence>
            {scores.map((s) => (
              <motion.li key={idOf(s)} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between rounded-xl bg-ink px-4 py-3">
                <span>
                  <b className="mr-3 text-2xl text-brand">{s.score}</b>
                <span className="text-white/60">{fmtDate(s.played_on)}</span>
                </span>
                <span className="flex gap-3 text-sm">
                  <button className="text-warm" onClick={() => { setEditing(idOf(s)); setF({ score: s.score, played_on: String(s.played_on).slice(0, 10) }); }}>Edit
                    
                  </button>
                  <button className="text-red-400" onClick={() => del(idOf(s))}>Delete</button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
}
