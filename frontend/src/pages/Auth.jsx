import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import usePlans from '../components/common/usePlans';
import { Btn, Card, Input, Msg, idOf } from '../components/common/ui';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(f.email, f.password); nav(u.role === 'admin' ? '/admin' : '/dashboard'); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Card className="mx-auto my-16 max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Welcome back</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Input label="Password" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Msg>{err}</Msg>
        <Btn className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</Btn>
      </form>
      <p className="mt-4 text-sm text-white/60">New here? 
      <Link className="text-brand" to="/signup">Create account</Link>
      </p>
    </Card>
  );
}
export function Signup() {
  const { signup, login } = useAuth();
  const plans = usePlans();
  const nav = useNavigate();
  const [charities, setCharities] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', charity_id: '', charity_percent: 10 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const min = plans?.charity_min ?? 10;
  const max = plans?.charity_max ?? 50;

  useEffect(() => { 
    api.get('/charities')
      .then((r) => setCharities(r.data))
      .catch(() => {}); 
  }, []);

  const submit = async (e) => {
    e.preventDefault(); 
    setBusy(true); 
    setErr('');
    try {
      await signup({ 
        ...f, 
        charity_id: f.charity_id || null, 
        charity_percent: Number(f.charity_percent) 
      });
      await login(f.email, f.password);
      nav('/pricing');
    } catch (e) { 
      setErr(errMsg(e)); 
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <Card className="mx-auto my-16 max-w-md">
      <h1 className="mb-4 text-2xl font-bold">Join Digital Heroes</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Input label="Password (min 6)" type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        
        <label className="block text-sm text-white/70">
          Choose your charity
          <select 
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-white" 
            value={f.charity_id} 
            onChange={(e) => setF({ ...f, charity_id: e.target.value })}
          >
            <option value="">Select later</option>
            {charities.map((c) => (
              <option key={idOf(c)} value={idOf(c)}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-white/70">
          Contribution: 
          <b className="text-brand">{f.charity_percent}%</b>
           of your fee (min {min}%)
          <input type="range" min={min} max={max} className="w-full accent-[#6fcf97]" value={f.charity_percent} onChange={(e) => setF({ ...f, charity_percent: e.target.value })} />
        </label>

        <Msg>{err}</Msg>
        <Btn className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Btn>
      </form>
      <p className="mt-4 text-sm text-white/60">Already a member? 
        <Link className="text-brand" to="/login">Login</Link>
      </p>
    </Card>
  );
}