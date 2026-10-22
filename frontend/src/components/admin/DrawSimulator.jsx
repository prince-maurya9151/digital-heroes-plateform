import { useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Input, Msg, money, localToday } from '../common/ui';

export default function DrawSimulator() {
  const [month, setMonth] = useState(localToday().slice(0, 7));
  const [mode, setMode] = useState('random');
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  const run = async (kind) => {
    setBusy(true); setMsg({});
    try {
    
      const body = { month, mode, ...(kind === 'publish' && res ? { numbers: res.numbers } : {}) };
      const { data } = await api.post(`/admin/draws/${kind}`, body);
      setRes(data);
      if (kind === 'publish') setMsg({ ok: 'Draw published!' });
    } catch (e) { setMsg({ err: errMsg(e) }); } finally { setBusy(false); }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44"><Input label="Month" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setRes(null); }} /></div>
        <label className="text-sm text-white/70">Draw logic
          <select className="mt-1 block rounded-xl border border-white/10 bg-ink px-3 py-2" value={mode} onChange={(e) => { setMode(e.target.value); setRes(null); }}>
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic (score frequency)</option>
          </select>
        </label>
        <Btn variant="ghost" disabled={busy} onClick={() => run('simulate')}>Simulate</Btn>
        <Btn disabled={busy || !res?.simulated} onClick={() => { if (confirm('Publish this draw? This cannot be undone.')) run('publish'); }}>Publish</Btn>
      </div>
      <div className="mt-3"><Msg type="ok">{msg.ok}</Msg><Msg>{msg.err}</Msg></div>
      {res && (
        <div className="mt-5">
          <p className="mb-2 text-sm text-white/60">{res.simulated ? 'SIMULATION (not saved)' : 'PUBLISHED'} · {res.subscriber_count} eligible subscribers</p>
          <div className="flex gap-2">{res.numbers.map((n) => <span key={n} className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/20 text-lg font-bold text-brand">{n}</span>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
            <Card>Total pool<br /><b>{money(res.pools.total)}</b></Card>
            <Card>5-match pool<br /><b>{money(res.pools.tier5)}</b></Card>
            <Card>4-match pool<br /><b>{money(res.pools.tier4)}</b></Card>
            <Card>3-match pool<br /><b>{money(res.pools.tier3)}</b></Card>
          </div>
          <p className="mt-3 text-sm">Winners: <b>{res.winners.length}</b> · Jackpot carried forward: 
          <b className="text-warm">{money(res.jackpot_out)}</b>
          </p>
          {res.winners.map((w, i) => 
          <p key={i} className="text-sm text-white/70">{w.match_count}-match → {money(w.prize)}</p>
          )}
        </div>
      )}
    </Card>
  );
}
