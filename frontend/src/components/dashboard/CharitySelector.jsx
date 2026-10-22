import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import usePlans from '../common/usePlans';
import { Btn, Card, Msg, idOf, money } from '../common/ui';

export default function CharitySelector() {
  const { user, subscription, refresh } = useAuth();
  const plans = usePlans();
  const [list, setList] = useState([]);
  const [cid, setCid] = useState(user?.charity_id || '');
  const [pct, setPct] = useState(user?.charity_percent || 10);
  const [msg, setMsg] = useState({});

  useEffect(() => { api.get('/charities').then((r) => setList(r.data)).catch((e) => setMsg({ err: errMsg(e) })); }, []);

  const min = plans?.charity_min ?? 10;
  const max = plans?.charity_max ?? 50;
 
  const base = plans ? (subscription?.plan === 'yearly' ? plans.yearly / 12 : plans.monthly) : 0;

  const save = async () => {
    setMsg({});
    try {
      await api.patch('/charities/me/select', { charity_id: cid, charity_percent: pct });
      await refresh();
      setMsg({ ok: 'Saved!' });
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">My charity</h2>
      <select className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2" value={cid} onChange={(e) => setCid(e.target.value)}>
        <option value="">Select a charity</option>
        {list.map((c) => 
        <option key={idOf(c)} value={idOf(c)}>{c.name}</option>
        )}
      </select>
      <label className="mt-4 block text-sm text-white/70">Contribution: 
      <b className="text-brand">{pct}%</b> 
      (min {min}%, max {max}%)
        <input type="range" min={min} max={max} className="w-full accent-[#6fcf97]" value={Math.min(pct, max)} onChange={(e) => setPct(Number(e.target.value))} />
      </label>
      {base > 0 && 
      <p className="mt-1 text-sm text-white/60">≈ <b className="text-brand">{money((base * pct) / 100)}</b> per month goes to your charity</p>
      }
      <Btn className="mt-3" onClick={save} disabled={!cid}>Save</Btn>
      <div className="mt-3">
        <Msg type="ok">{msg.ok}</Msg>
        <Msg>{msg.err}</Msg>
      </div>
    </Card>
  );
}
