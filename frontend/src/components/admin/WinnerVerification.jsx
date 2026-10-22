import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api/axios';
import { Btn, Card, Msg, Spinner, money, idOf } from '../common/ui';

export default function WinnerVerification() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get('/admin/winners').then((r) => setList(r.data)).catch((e) => setErr(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const act = async (url, body) => { try { await api.patch(url, body); load(); } catch (e) { alert(errMsg(e)); 

  } };

  if (err) return <Msg>{err}</Msg>;
  if (!list) return <Spinner />;
  if (!list.length) return <p className="text-white/50">No winners yet.</p>;
  return (
    <div className="space-y-3">{list.map((w) => (
      <Card key={idOf(w)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <b>{w.profiles?.name || 'User'}</b>
             · {w.draws?.month} · {w.match_count}-match
            · <b className="text-warm">{money(w.prize)}</b>
            </span>
          <span className="text-sm">Verify: <b>{w.verify_status}</b>
           · Pay: 
           <b>{w.payment_status}</b>
           </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-sm text-brand">View proof</a> :     <span className="text-sm text-white/40">No proof uploaded</span>}
          {w.proof_url && w.verify_status === 'pending' && <>
          <Btn className="!py-1" onClick={() => act(`/admin/winners/${idOf(w)}/verify`, { status: 'approved' })}>Approve</Btn>
          <Btn variant="danger" className="!py-1" onClick={() => act(`/admin/winners/${idOf(w)}/verify`, { status: 'rejected'})}>Reject</Btn>
              </>
              }
          {w.verify_status === 'approved' && w.payment_status === 'pending' &&
           <Btn className="!py-1" onClick={() => act(`/admin/winners/${idOf(w)}/pay`)}>Mark paid</Btn>
           }
        </div>
      </Card>
    ))}
    </div>
  );
}
