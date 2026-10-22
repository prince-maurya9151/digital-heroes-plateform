
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, newClient } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { validCharityPercent, CHARITY_MIN, CHARITY_MAX } from '../services/prize.service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();


const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });
r.use(['/signup', '/login', '/refresh'], limiter);

r.post('/signup', asyncHandler(async (req, res) => {
  const { email, password, name, charity_id, charity_percent = CHARITY_MIN } = req.body;
  if (!email || !password || !name) throw new AppError('Name, email and password are required');
  if (password.length < 6) throw new AppError('Password must be at least 6 characters');
  if (!validCharityPercent(charity_percent)) throw new AppError(`Charity percentage must be between ${CHARITY_MIN} and ${CHARITY_MAX}`);

  
  let selectedCharityId = null;
  if (charity_id) {
    const { data: charity } = await supabase.from('charities').select('id').eq('id', charity_id).maybeSingle();
    if (charity) {
      selectedCharityId = charity.id;
    }
  }

  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new AppError(error.message, 400);
 const { error: pErr } = await supabase.from('profiles').insert({
    id: data.user.id, 
    name, 
    email, 
    role: 'subscriber', 
    charity_id: selectedCharityId, 
    charity_percent: Number(charity_percent),
  });
  
  if (pErr) { 
    await supabase.auth.admin.deleteUser(data.user.id); 
    throw pErr; 
  }
  
  res.status(201).json({ message: 'Signup successful. Please log in.' });
}));

r.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await newClient().auth.signInWithPassword({ email, password });
  if (error) throw new AppError('Invalid email or password', 401);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token, user: { ...profile, email } });
}));

r.post('/refresh', asyncHandler(async (req, res) => {
  const { data, error } = await newClient().auth.refreshSession({ refresh_token: req.body.refresh_token });
  if (error) throw new AppError('Session expired', 401);
  res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
}));

r.get('/me', auth, asyncHandler(async (req, res) => {
  const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', req.user.id).maybeSingle();
  res.json({ user: req.user, subscription });
}));

r.patch('/me', auth, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new AppError('Name is required');
  const { data, error } = await supabase.from('profiles').update({ name }).eq('id', req.user.id).select().single();
  if (error) throw error;
  res.json(data);
}));

export default r;