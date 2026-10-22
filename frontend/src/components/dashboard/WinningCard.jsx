import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Msg, Spinner, money, idOf } from '../common/ui';
import ProofUploadModal from './ProofUploadModal';

export default function WinningCard() {
  const [sum, setSum] = useState(null);
  const [draws, setDraws] = useState([]);
  const [err, setErr] = useState('');
  const [activeModalWinId, setActiveModalWinId] = useState(null);

  const load = useCallback(() => {
    api.get('/draws/mine/summary').then((r) => setSum(r.data)).catch((e) => setErr(errMsg(e)));
    api.get('/draws').then((r) => setDraws(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="md:col-span-2">
    <Msg>{err}</Msg>
    </div>;
  if (!sum) return <Spinner />;

  const latest = draws[0];
  const wins = sum.wins || [];
  const badge = { pending: 'text-warm', approved: 'text-brand', rejected: 'text-red-400', paid: 'text-brand' };

  return (
    <>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Participation</h2>
        <p>Draws entered: 
          <b className="text-brand">{sum.draws_entered}</b>
          </p>
        <p>Upcoming draw: 
          <b>{sum.upcoming_draw}</b>
          </p>
        {latest && (
          <div className="mt-4"><p className="text-sm text-white/60">Latest draw ({latest.month})</p>
            <div className="mt-2 flex gap-2">{latest.numbers.map((n) => <span key={n} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">{n}</span>
          )}
            </div>
          </div>
        )}
      </Card>

      <Card className="md:col-span-2">
        <h2 className="mb-1 text-lg font-semibold">Winnings</h2>
        <p className="mb-3">Total won:
           <b className="text-2xl text-warm">{money(sum.total_won)}</b>
        </p>
        {wins.length === 0 ? 
        <p className="text-white/50">No wins yet - keep playing!</p>
         : (
          <ul className="space-y-3">
            {wins.map((w) => {
              const winId = idOf(w);
              return (
                <li key={winId} className="rounded-xl bg-ink p-4 border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{w.draws?.month} · 
                      <b>{w.match_count}-number match</b> 
                      · {money(w.prize)}
                    </span>
                    <span className="text-sm">Verification: 
                      <b className={badge[w.verify_status]}>{w.verify_status}</b> 
                      · Payment: <b className={badge[w.payment_status]}>{w.payment_status}</b>
                      </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {w.verify_status !== 'approved' && (
                      <Btn variant="ghost" className="!py-1 text-sm" onClick={() => setActiveModalWinId(winId)}>
                        {w.proof_url ? 'Replace proof screenshot' : 'Upload proof screenshot'}
                      </Btn>
                    )}
                    {w.proof_url && 
                    <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-sm text-brand underline">View uploaded proof
                    </a>
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {activeModalWinId && (
        <ProofUploadModal winId={activeModalWinId} onClose={() => setActiveModalWinId(null)} onSuccess={load} />
      )}
    </>
  );
}
