import { useState, useEffect } from 'react';
import CharityManager from '../components/admin/CharityManager';
import DrawSimulator from '../components/admin/DrawSimulator';
import UserTable from '../components/admin/UserTable';
import WinnerVerification from '../components/admin/WinnerVerification';
import api, { errMsg } from '../api/axios';
import { Card, Msg, Spinner, money } from '../components/common/ui';

const TABS = ['Reports', 'Users', 'Draws', 'Charities', 'Winners'];

function Reports() {
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/admin/reports').then((x) => setR(x.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <Msg>{err}</Msg>;
  if (!r) return <Spinner />;

  const stats = [
    ['Total users', r.total_users],
    ['Active subscribers', r.active_subscribers],
    ['Total prize pool', money(r.total_prize_pool)],
    ['Current jackpot', money(r.current_jackpot)],
    ['Direct donations', money(r.direct_donations_total)],
    ['Draws held', r.draw_stats.total_draws],
    ['Winners', r.draw_stats.total_winners],
    ['Paid out', r.draw_stats.paid],
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <Card key={k}>
            <p className="text-sm text-white/60">{k}</p>
            <p className="text-2xl font-bold text-brand">{v}</p>
            </Card>
        ))}
      </div>
      <Card className="mt-4">
        <h3 className="mb-2 font-semibold">Monthly charity contribution (by charity, estimate)</h3>
        {Object.keys(r.charity_monthly_contribution).length === 0 ? 
        <p className="text-white/50">No data yet.</p>
         :
          Object.entries(r.charity_monthly_contribution).map(([k, v]) => 
          <p key={k} className="flex justify-between border-b border-white/5 py-1">
            <span>{k}</span>
            <b>{money(v)}
            </b>
          </p>
        )}
      </Card>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('Reports');
  return (
    <section className="py-10">
      <h1 className="text-3xl font-bold">Admin panel</h1>
      <div className="my-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm transition ${tab === t ? 'bg-brand text-ink font-semibold' : 'border border-white/15 hover:bg-white/5'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Reports' && <Reports />}
      {tab === 'Users' && <UserTable />}
      {tab === 'Draws' && <DrawSimulator />}
      {tab === 'Charities' && <CharityManager />}
      {tab === 'Winners' && <WinnerVerification />}
    </section>
  );
}
