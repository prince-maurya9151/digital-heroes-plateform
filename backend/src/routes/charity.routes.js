import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createDonation } from '../services/stripe.service.js';
import { validCharityPercent, CHARITY_MIN, CHARITY_MAX } from '../services/prize.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();


r.get('/', asyncHandler(async (req, res) => {
  let q = supabase.from('charities').select('*').order('name');
  if (req.query.search) q = q.ilike('name', `%${req.query.search}%`);
  if (req.query.featured === 'true') q = q.eq('featured', true);
  if (req.query.category) q = q.eq('category', req.query.category);
  const { data, error } = await q;
  if (error) throw error;
  res.json(data);
}));


r.patch('/me/select', auth, asyncHandler(async (req, res) => {
  const { charity_id, charity_percent } = req.body;
  if (!validCharityPercent(charity_percent)) throw new AppError(`Charity percentage must be between ${CHARITY_MIN} and ${CHARITY_MAX}`);
  const { data: charity } = await supabase.from('charities').select('id').eq('id', charity_id).maybeSingle();
  if (!charity) throw new AppError('Selected charity does not exist');
  const { data, error } = await supabase.from('profiles').update({ charity_id, charity_percent: Number(charity_percent) }).eq('id', req.user.id).select().single();
  if (error) throw error;
  res.json(data);
}));

r.get('/:id', asyncHandler(async (req, res) => {
  const { data } = await supabase.from('charities').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) throw new AppError('Charity not found', 404);
  res.json(data);
}));

r.post('/:id/donate', auth, asyncHandler(async (req, res) => {
  const s = await createDonation(req.user, req.params.id, req.body.amount);
  res.json({ url: s.url });
}));

const fields = ({ name, description, image_url, category, featured, events }) => ({
  name, description, image_url, category, featured: !!featured, events: Array.isArray(events) ? events : [],
});

r.post('/', auth, requireAdmin, asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new AppError('Name is required');
  const { data, error } = await supabase.from('charities').insert(fields(req.body)).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

r.put('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new AppError('Name is required');
  const { data, error } = await supabase.from('charities').update(fields(req.body)).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

r.delete('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('charities').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

export default r;
