
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const isActive = (sub) =>
  !!sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date();
export const requireSubscription = asyncHandler(async (req, res, next) => {
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', req.user.id).maybeSingle();
  if (!isActive(sub)) throw new AppError('Active subscription required', 402);
  req.subscription = sub;
  next();
});