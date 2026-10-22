import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Card, Msg, fmtDate } from '../components/common/ui';
import api, { errMsg } from '../api/axios';
import CharitySelector from '../components/dashboard/CharitySelector';
import ScoreEntryForm from '../components/dashboard/ScoreEntryForm';
import WinningCard from '../components/dashboard/WinningCard';

function SubscriptionCard() {
  const { subscription, active, refresh } = useAuth();
  const [params] = useSearchParams();
  const justPaid = !!params.get('paid');

  useEffect(() => {
    if (!justPaid || active) return;
    let tries = 0;
    const t = setInterval(() => { refresh(); if (++tries >= 6) clearInterval(t); }, 2500);
    return () => clearInterval(t);
  }, [justPaid, active, refresh]);

  const manage = async () => {
    try { const { data } = await api.post('/subscription/portal'); window.location = data.url; }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">Subscription</h2>
      <p className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${active ? 'bg-brand' : 'bg-red-400'}`} />
        <b>{active ? 'Active' : subscription?.status === 'cancelled' ? 'Cancelled' : subscription?.status === 'lapsed' ? 'Lapsed' : 'Inactive'}</b>
        {subscription?.plan && 
        <span className="text-white/60">· {subscription.plan}</span>}
      </p>
      {subscription && 
      <p className="mt-1 text-sm text-white/60">
        {subscription.cancel_at_period_end ? 'Ends on' : 'Renews on'}
        :
         {fmtDate(subscription.current_period_end)}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {active ? 
        <Btn variant="ghost" onClick={manage}>Manage / Cancel</Btn>
         : 
         <Link to="/pricing">
          <Btn>Subscribe</Btn>
        </Link>}
        <Btn variant="ghost" onClick={refresh}>Refresh</Btn>
      </div>
      {justPaid && !active && 
      <div className="mt-3">
        <Msg type="ok">Payment received - activating your subscription…</Msg>
        </div>}
    </Card>
  );
}

export default function Dashboard() {
  const { user, active } = useAuth();
  if (!user) return null;

  return (
    <section className="py-10">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold">Hi, {user.name} 👋</motion.h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SubscriptionCard />
        <CharitySelector />
        {active ? (
          <ScoreEntryForm />
        ) : (
          <Card className="md:col-span-2 text-center">
            <p className="text-lg">🔒 Subscribe to unlock score entry and monthly draws.</p>
            <Link to="/pricing">
              <Btn className="mt-4">See plans</Btn>
            </Link>
          </Card>
        )}
        
        <WinningCard />
      </div>
    </section>
  );
}
