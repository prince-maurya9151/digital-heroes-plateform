
import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { simulateDraw, publishDraw } from '../controllers/draw.controller.js';
import { listScores, updateScore } from '../services/score.service.js';
import { monthlyValue, validCharityPercent, CHARITY_MIN, CHARITY_MAX } from '../services/prize.service.js';
import { signProofs } from '../utils/proofs.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();
r.use(auth, requireAdmin);

r.get('/users', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('profiles')
    .select('*, subscriptions(plan,status,current_period_end), charities(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

r.get('/users/:id', asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase.from('profiles').select('*, subscriptions(*)').eq('id', req.params.id).maybeSingle();
  if (error) throw error;
  if (!user) throw new AppError('User not found', 404);
  res.json({ user, scores: await listScores(req.params.id) });
}));

r.patch('/users/:id', asyncHandler(async (req, res) => {
  const { name, role, charity_id, charity_percent } = req.body;
  if (role !== undefined && !['subscriber', 'admin'].includes(role)) throw new AppError('Invalid role');
  if (role && req.params.id === req.user.id && role !== 'admin') throw new AppError('You cannot remove your own admin role');
  if (charity_percent !== undefined && !validCharityPercent(charity_percent)) throw new AppError(`Charity percentage must be between ${CHARITY_MIN} and ${CHARITY_MAX}`);

  const update = Object.fromEntries(Object.entries({ name, role, charity_id, charity_percent }).filter(([, v]) => v !== undefined));
  const { data, error } = await supabase.from('profiles').update(update).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

// Admin can edit any user's score
r.put('/scores/:id', asyncHandler(async (req, res) => res.json(await updateScore(null, req.params.id, req.body, true))));

r.patch('/subscriptions/:userId', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'lapsed', 'cancelled'].includes(status)) throw new AppError('Invalid status');

  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', req.params.userId).maybeSingle();
  if (!sub) throw new AppError('This user has no subscription record', 404);

  const update = { status };
  // isActive() also checks the end date, so "active" needs a future end date to actually work
  if (status === 'active' && (!sub.current_period_end || new Date(sub.current_period_end) <= new Date())) {
    update.current_period_end = new Date(Date.now() + 30 * 24 * 3600e3).toISOString();
  }
  const { data, error } = await supabase.from('subscriptions').update(update).eq('user_id', req.params.userId).select().single();
  if (error) throw error;
  res.json(data);
}));

// ----------  Draws ----------
r.post('/draws/simulate', simulateDraw);
r.post('/draws/publish', publishDraw);

// ---------- Winners ----------
r.get('/winners', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('winners').select('*, draws(month,numbers), profiles(name)').order('created_at', { ascending: false });
  if (error) throw error;
  res.json(await signProofs(data));
}));

r.patch('/winners/:id/verify', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new AppError('Status must be approved or rejected');
  const { data: w } = await supabase.from('winners').select('proof_url').eq('id', req.params.id).maybeSingle();
  if (!w) throw new AppError('Winner not found', 404);
  if (status === 'approved' && !w.proof_url) throw new AppError('Cannot approve a win without an uploaded proof');

  const { data, error } = await supabase.from('winners').update({ verify_status: status }).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

r.patch('/winners/:id/pay', asyncHandler(async (req, res) => {
  const { data: w } = await supabase.from('winners').select('verify_status').eq('id', req.params.id).maybeSingle();
  if (w?.verify_status !== 'approved') throw new AppError('Approve the winner before marking as paid');
  const { data, error } = await supabase.from('winners').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

// ---------- 5. Reports ----------
r.get('/reports', asyncHandler(async (req, res) => {
  const count = async (table, filter) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count: c, error } = await q;
    if (error) throw error;
    return c || 0;
  };

  const [d, s, don] = await Promise.all([
    supabase.from('draws').select('pool_total, jackpot_out').eq('status', 'published').order('month', { ascending: true }),
    supabase.from('subscriptions').select('plan, profiles(charity_id, charity_percent, charities(name))').eq('status', 'active'),
    supabase.from('donations').select('amount'),
  ]);
  if (d.error || s.error || don.error) throw d.error || s.error || don.error;
  const draws = d.data, subs = s.data, donations = don.data;

  
  const charity = {};
  subs.forEach((x) => {
    const name = x.profiles?.charities?.name || 'Unassigned';
    charity[name] = (charity[name] || 0) + (monthlyValue(x.plan) * (x.profiles?.charity_percent || CHARITY_MIN)) / 100;
  });

  res.json({
    total_users: await count('profiles'),
    active_subscribers: subs.length,
    total_prize_pool: draws.reduce((sum, x) => sum + Number(x.pool_total), 0),
    current_jackpot: Number(draws.at(-1)?.jackpot_out || 0),
    charity_monthly_contribution: charity,
    direct_donations_total: donations.reduce((sum, x) => sum + Number(x.amount), 0),
    draw_stats: {
      total_draws: draws.length,
      total_winners: await count('winners'),
      paid: await count('winners', (q) => q.eq('payment_status', 'paid')),
    },
  });
}));

export default r;
