import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { signProofs } from '../utils/proofs.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();

r.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('draws').select('*').eq('status', 'published').order('month', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

r.get('/mine/summary', auth, asyncHandler(async (req, res) => {
  const { data: entries, error: e1 } = await supabase.from('draw_entries').select('draw_id, scores, draws(month, numbers)').eq('user_id', req.user.id);
  const { data: wins, error: e2 } = await supabase.from('winners').select('*, draws(month)').eq('user_id', req.user.id);
  if (e1 || e2) throw e1 || e2;

  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  res.json({
    draws_entered: entries.length,
    entries,
    upcoming_draw: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`,
    total_won: wins.reduce((s, w) => s + Number(w.prize), 0),
    wins: await signProofs(wins),
  });
}));

export default r;
