import { Fragment, useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Msg, Spinner, idOf, fmtDate } from '../common/ui';

export default function UserTable() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [open, setOpen] = useState(null);
  const [scores, setScores] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get('/admin/users').then((r) => setUsers(r.data)).catch((e) => setErr(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const subOf = (u) => (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions);

  const setStatus = async (u, status) => {
    try { await api.patch(`/admin/subscriptions/${idOf(u)}`, { status }); 
    load(); 
  } catch (e) {
     alert(errMsg(e)); 
    }
  };

  const setRole = async (u) => {
    if (idOf(u) === me.id) return alert('You cannot change your own role.');
    const role = u.role === 'admin' ? 'subscriber' : 'admin';
    if (!confirm(`Change ${u.name} to ${role}?`)) return;
    try { await api.patch(`/admin/users/${idOf(u)}`, { role });
     load(); 
    } catch (e) {
       alert(errMsg(e)); 
      }
  };

  const loadScores = async (u) => {
    try {
      const id = idOf(u);
      const { data } = await api.get(`/admin/users/${id}`);
      setScores(data.scores); setOpen(id);
    } catch (e) { alert(errMsg(e)); 

    }
  };
  const showScores = (u) => (open === idOf(u) ? setOpen(null) : loadScores(u));

  const editScore = async (s, u) => {
    const score = prompt('New score (1-45)', s.score); if (!score) return;
    const played_on = prompt('Date (YYYY-MM-DD)', String(s.played_on).slice(0, 10)); 
    if (!played_on) return;
    try { await api.put(`/admin/scores/${idOf(s)}`,
     { score, played_on }); loadScores(u); 
    } catch (e) { alert(errMsg(e));

     }
  };

  if (err) return <Msg>{err}</Msg>;
  if (!users) return <Spinner />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-white/50">
          <tr>
            <th className="p-2">Name</th>
              <th>Role</th>
              <th>Charity</th>
              <th>Plan</th>
              <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>{users.map((u) => { const s = subOf(u); return (
          <Fragment key={idOf(u)}>
          <tr className="border-t border-white/10">
            <td className="p-2">{u.name}</td>
            <td><button className="text-warm" onClick={() => setRole(u)}>{u.role}</button></td>
            <td>{u.charities?.name || '—'} ({u.charity_percent}%)</td>
            <td>{s?.plan || '—'}</td>
            <td>{s ? <select className="rounded bg-ink px-1 py-1" value={s.status} onChange={(e) => setStatus(u, e.target.value)}>
            <option>active</option>
            <option>lapsed</option>
            <option>cancelled</option>
            </select> : 'none'}
            </td>
            <td>
              <button className="text-brand" onClick={() => showScores(u)}>Scores</button>
            </td>
          </tr>
          {open === idOf(u) && <tr><td colSpan="6" className="bg-ink p-3">{scores.length === 0 ? 'No scores' : scores.map((sc) => <span key={idOf(sc)} className="mr-3 inline-block rounded-lg bg-card px-3 py-1">{sc.score} · {
          fmtDate(sc.played_on)}
           <button className="ml-2 text-warm" onClick={() => editScore(sc, u)}>edit</button>
           </span>
          )}
          </td></tr>
          }
        </Fragment>);
       })}
       
       </tbody>
    </table>
    </div>
  );
}
