import { motion } from 'framer-motion';

export const Btn = ({ variant = 'primary', className = '', ...p }) => {
  const v = {
    primary: 'bg-brand text-ink hover:brightness-110 shadow-lg shadow-brand/20',
    ghost: 'border border-white/15 hover:bg-white/5',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
  };
  return <button className={`rounded-full px-5 py-2.5 font-semibold transition active:scale-95 disabled:opacity-50 ${v[variant]} ${className}`} {...p} />;
};

export const Card = ({ className = '', ...p }) => 
<div className={`rounded-2xl bg-card border border-white/10 p-5 ${className}`} {...p} />;

export const Input = ({ label, ...p }) => (
  <label className="block text-sm text-white/70">
    {label}
    <input className="mt-1 w-full rounded-xl bg-ink border border-white/10 px-3 py-2 text-white outline-none focus:border-brand" {...p} />
  </label>
);

export const Spinner = () => 
<div className="mx-auto my-10 h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />;

export const Msg = ({ type = 'error', children }) =>
  children ? 
  <p className={`rounded-xl px-3 py-2 text-sm ${type === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-brand/15 text-brand'}`}> {children}
  </p>
   : null;

export const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay }}>
    {children}
  </motion.div>
);

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const idOf = (o) => o?.id || o?._id;

export const localToday = () => new Date().toLocaleDateString('en-CA');

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
