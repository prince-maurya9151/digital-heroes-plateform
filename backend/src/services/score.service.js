import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const MAX_SCORES = 5;
const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

function validate({ score, played_on }) {
  const s = Number(score);
  if (!Number.isInteger(s) || s < 1 || s > 45) throw new AppError('Score must be a whole number between 1 and 45');

  const d = String(played_on || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new AppError('A valid date is required');
  const [y, m, day] = d.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, day));
 
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== day) throw new AppError('A valid date is required');
  if (d > todayIST()) throw new AppError('Date cannot be in the future');

  return { score: s, played_on: d };
}

export async function listScores(userId) {
  const { data, error } = await supabase.from('scores').select('*')
    .eq('user_id', userId).order('played_on', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addScore(userId, body) {
  const v = validate(body);

  const existing = await listScores(userId);
 
  if (existing.length >= MAX_SCORES && v.played_on < existing[existing.length - 1].played_on) {
    throw new AppError('You already have 5 more recent scores. This date is older than all of them.');
  }

  const { error } = await supabase.from('scores').insert({ user_id: userId, ...v });
  if (error) {
    if (error.code === '23505') throw new AppError('A score for this date already exists. Edit or delete it instead.', 409);
    throw error;
  }

  const all = await listScores(userId);
  const extra = all.slice(MAX_SCORES).map((s) => s.id);
  if (extra.length) {
    const { error: delErr } = await supabase.from('scores').delete().in('id', extra);
    if (delErr) throw delErr;
  }
  return listScores(userId);
}

export async function updateScore(userId, id, body, isAdmin = false) {
  const v = validate(body);
  let q = supabase.from('scores').update(v).eq('id', id);
  if (!isAdmin) q = q.eq('user_id', userId);
  const { data, error } = await q.select().maybeSingle();
  if (error?.code === '23505') throw new AppError('A score for this date already exists', 409);
  if (error) throw error;
  if (!data) throw new AppError('Score not found', 404);
  return data;
}

export async function deleteScore(userId, id) {
  const { error } = await supabase.from('scores').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
