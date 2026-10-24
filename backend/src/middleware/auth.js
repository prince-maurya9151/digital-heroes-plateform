
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auth = asyncHandler(async (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw new AppError('Login required', 401);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new AppError('Invalid or expired token', 401);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile) throw new AppError('Profile not found', 401);

  req.user = { ...profile, email: data.user.email };
  next();
});
