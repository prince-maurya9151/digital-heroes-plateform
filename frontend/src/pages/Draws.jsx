import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import { Card, Msg, Spinner, money } from '../components/common/ui';

const tiers = [['5 numbers', '40%', 'Jackpot - rolls over if unclaimed'],
 ['4 numbers', '35%', 'Split equally among winners'], 
 ['3 numbers', '25%', 'Split equally among winners']
];

export default function Draws() {
  const [draws, setDraws] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/draws').then((r) => setDraws(r.data)).catch((e) => setErr(errMsg(e))); }, []);

  return (
    <section className="py-10">
      <h1 className="text-3xl font-bold">Monthly draws</h1>
      <p className="mt-2 max-w-2xl text-white/60">Every month, 5 numbers between 1 and 45 are drawn. Subscribers with 5 saved scores are entered automatically; match 3, 4 or 5 numbers to win a share of the prize pool.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {tiers.map(([m, p, d]) => 
        <Card key={m}>
          <p className="text-white/60">{m}</p>
          <p className="text-4xl font-black text-warm">{p}</p>
          <p className="mt-1 text-sm text-white/60">{d}</p>
        </Card>)}
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-semibold">Results</h2>
      <Msg>{err}</Msg>
      {!draws && !err ? 
      <Spinner /> : draws?.length === 0 ? 
      <p className="text-white/50">No draws have been published yet.</p> 
      : (
        <div className="space-y-3">
          {draws?.map((d) => (
            <Card key={d.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/60">{d.month} · {d.mode}</p>
                  <div className="mt-2 flex gap-2">{d.numbers.map((n) => 
                    <span key={n} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">{n}</span>
                    )}
                    </div>
                </div>
                <div className="text-sm text-white/70">
                  <p>Prize pool: 
                    <b>{money(d.pool_total)}</b>
                  </p>
                  <p>Entries: 
                    <b>{d.subscriber_count}</b>
                  </p>
                  {Number(d.jackpot_out) > 0 && 
                  <p>Jackpot rolled over: 
                    <b className="text-warm">{money(d.jackpot_out)}</b>
                  </p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
