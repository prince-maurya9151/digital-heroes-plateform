import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { isActive } from '../middleware/requireSubscription.js';
import { createCheckout, createPortal } from '../services/stripe.service.js';
import { getPlans } from '../services/prize.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();

r.get('/plans', (req, res) => res.json(getPlans()));

r.use(auth);

r.get('/status', asyncHandler(async (req, res) => {
  const { data } = await supabase.from('subscriptions').select('*').eq('user_id', req.user.id).maybeSingle();
  res.json({ subscription: data, active: isActive(data) });
}));

r.post('/checkout', asyncHandler(async (req, res) => {
  const s = await createCheckout(req.user, req.body.plan);
  res.json({ url: s.url });
}));

r.post('/portal', asyncHandler(async (req, res) => {
  const s = await createPortal(req.user.id);
  res.json({ url: s.url });
}));

export default r;
