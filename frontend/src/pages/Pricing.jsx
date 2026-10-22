import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import usePlans from '../components/common/usePlans';
import { Btn, Card, Msg, Spinner, money } from '../components/common/ui';

export default function Pricing() {
  const { user, active } = useAuth();
  const plans = usePlans();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const choose = async (plan) => {
    if (!user) return nav('/signup');
    setBusy(plan); setErr('');
    try { const { data } = await api.post('/subscription/checkout', { plan }); window.location = data.url; } // Stripe Checkout
    catch (e) { setErr(errMsg(e)); setBusy(''); }
  };

  if (!plans) return <Spinner />;
  const list = [
    { id: 'monthly', name: 'Monthly', price: plans.monthly, per: '/month', note: 'Flexible, cancel anytime' },
    { id: 'yearly', name: 'Yearly', price: plans.yearly, per: '/year', note: `Save ${plans.yearly_saving_percent}% - best value`, best: true },
  ];
  return (
    <section className="py-14 text-center">
      <h1 className="text-4xl font-extrabold">Pick a plan. Fund a cause.</h1>
      <p className="mt-3 text-white/60">Every plan includes monthly draw entry and your chosen charity contribution.</p>
      {active && 
      <div className="mx-auto mt-4 max-w-md">
        <Msg type="ok">You already have an active subscription.</Msg>
        </div>}
      <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
        {list.map((p) => (
          <motion.div key={p.id} whileHover={{ y: -6 }}>
            <Card className={`h-full ${p.best ? 'border-brand shadow-xl shadow-brand/10' : ''}`}>
              {p.best && 
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-ink">BEST VALUE</span>
              }
              <h2 className="mt-3 text-2xl font-bold">{p.name}</h2>
              <p className="mt-2 text-5xl font-black">{money(p.price)}
                <span className="text-base font-normal text-white/50">{p.per}</span>
              </p>
              <p className="mt-2 text-white/60">{p.note}</p>
              <Btn className="mt-6 w-full py-3" disabled={!!busy || active} onClick={() => choose(p.id)}>{busy === p.id ? 'Redirecting…' : `Subscribe ${p.name}`}</Btn>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-md">
        <Msg>{err}</Msg>
        </div>
      <p className="mt-6 text-xs text-white/40">Demo mode: use test card 4242 4242 4242 4242, any future date, any CVC.</p>
    </section>
  );
}
