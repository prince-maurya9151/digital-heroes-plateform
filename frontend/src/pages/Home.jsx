import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { Btn, Card, Reveal, idOf } from '../components/common/ui';

const steps = [
  ['1', 'Subscribe', 'Choose monthly or yearly. Part of every payment goes to a cause you pick.'],
  ['2', 'Enter your scores', 'Add your last 5 Stableford scores. Simple, quick, always up to date.'],
  ['3', 'Join the monthly draw', 'Match 3, 4 or 5 numbers to win a share of the prize pool.'],
];
const tiers = [['5 numbers', '40%', 'Jackpot — rolls over if unclaimed'], ['4 numbers', '35%', 'Split among winners'], ['3 numbers', '25%', 'Split among winners']];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => { api.get('/charities?featured=true').then((r) => setFeatured(r.data.slice(0, 3))).catch(() => {}); }, []);

  return (
    <>
      {/* HERO: charity-first, golf cliche nahi */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <motion.div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-warm/20 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 9, repeat: Infinity }} />
        <motion.div className="relative max-w-3xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="mb-4 text-sm tracking-widest text-brand">PLAY · WIN · GIVE</p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">Your game can change 
            <span className="font-serif italic text-brand">someone's life.</span>
            </h1>
          <p className="mt-6 text-lg text-white/70">Every subscription funds a charity you choose. Track your scores, enter monthly draws, and win — while giving back.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/pricing">
            <Btn className="px-8 py-4 text-lg">Subscribe & make an impact</Btn>
            </Link>
            <a href="#how">
              <Btn variant="ghost" className="px-8 py-4 text-lg">How it works</Btn>
            </a>
          </div>
        </motion.div>
      </section>

      <section id="how" className="py-12">
        <Reveal>
          <h2 className="mb-8 text-3xl font-bold">How it works</h2>
          </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.1}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-brand/50">
                <span className="text-4xl font-black text-brand/60">{n}</span>
                <h3 className="mt-2 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/60">{d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold">How you win</h2>
          <p className="mb-8 text-white/60">A fixed share of every subscription builds the monthly prize pool.</p></Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map(([m, p, d], i) => (
            <Reveal key={m} delay={i * 0.1}>
              <Card>
                <p className="text-white/60">{m}</p>
                <p className="text-5xl font-black text-warm">{p}</p>
                <p className="mt-2 text-sm text-white/60">{d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12">
        <Reveal>
          <h2 className="mb-8 text-3xl font-bold">Charity spotlight</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.length === 0 && 
          <p className="text-white/50">Featured charities will appear here.</p>
          }
          {featured.map((c) => (
            <Reveal key={idOf(c)}>
              <Link to={`/charities/${idOf(c)}`}>
                <Card className="h-full transition hover:-translate-y-1 hover:border-brand/50">
                  {c.image_url && 
                  <img src={c.image_url} alt={c.name} className="mb-3 h-40 w-full rounded-xl object-cover" />
                  }
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-white/60">{c.description}</p>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="my-12 rounded-3xl bg-gradient-to-r from-brand/20 to-warm/20 p-10 text-center">
          <h2 className="text-3xl font-bold">Ready to play for something bigger?</h2>
          <Link to="/pricing">
          <Btn className="mt-6 px-10 py-4 text-lg">Subscribe now</Btn>
          </Link>
        </section>
      </Reveal>
    </>
  );
}
