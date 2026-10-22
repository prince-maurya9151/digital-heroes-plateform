import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { buildPools, allocate } from './prize.service.js';

const pickRandom = () => {
  const set = new Set();
  while (set.size < 5) set.add(1 + Math.floor(Math.random() * 45));
  return [...set].sort((a, b) => a - b);
};


function pickWeighted(allScores) {
  const w = {};
  for (let n = 1; n <= 45; n++) w[n] = 1; 
  allScores.forEach((s) => (w[s] += 1));
  const picked = [];
  while (picked.length < 5) {
    const pool = Object.keys(w).map(Number).filter((n) => !picked.includes(n));
    const total = pool.reduce((s, n) => s + w[n], 0);
    let r = Math.random() * total;
    for (const n of pool) { r -= w[n]; if (r <= 0) { picked.push(n); break; } }
  }
  return picked.sort((a, b) => a - b);
}

function validateNumbers(numbers) {
  const ok = Array.isArray(numbers) && numbers.length === 5
    && numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 45)
    && new Set(numbers).size === 5;
  if (!ok) throw new AppError('numbers must be 5 unique integers between 1 and 45');
  return [...numbers].sort((a, b) => a - b);
}

async function loadEligible() {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.rpc('eligible_entries').range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  const byUser = {};
  rows.forEach((r) => (byUser[r.user_id] = r.scores));
  return { subs: rows.map((r) => ({ user_id: r.user_id, plan: r.plan })), byUser, all: rows.flatMap((r) => r.scores) };
}

async function lastCarry() {
  const { data, error } = await supabase.from('draws').select('jackpot_out').eq('status', 'published')
    .order('month', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return Number(data?.jackpot_out || 0);
}

export async function runDraw({ month, mode, numbers, publish = false }) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw new AppError('month must be in YYYY-MM format');
  if (!['random', 'algorithmic'].includes(mode)) throw new AppError('mode must be random or algorithmic');

  if (publish) {
    const { data: ex } = await supabase.from('draws').select('id').eq('month', month).maybeSingle();
    if (ex) throw new AppError('A draw for this month is already published', 409);
  }

  const { subs, byUser, all } = await loadEligible();
  const carry = await lastCarry();
  const drawNumbers = numbers !== undefined && numbers !== null
    ? validateNumbers(numbers)
    : mode === 'random' ? pickRandom() : pickWeighted(all);

  const raw = subs
    .map((s) => ({ user_id: s.user_id, match_count: new Set(byUser[s.user_id].filter((x) => drawNumbers.includes(x))).size }))
    .filter((w) => w.match_count >= 3);
  const pools = buildPools(subs, carry);
  const { winners, jackpot_out } = allocate(pools, raw);

  const result = { month, mode, numbers: drawNumbers, subscriber_count: subs.length, jackpot_in: carry, pools, winners, jackpot_out };
  if (!publish) return { ...result, simulated: true };
  

  const { data: drawId, error } = await supabase.rpc('publish_draw', {
    p_draw: {
      month, mode, numbers: drawNumbers, pool_total: pools.total,
      tier5_pool: pools.tier5, tier4_pool: pools.tier4, tier3_pool: pools.tier3,
      jackpot_in: carry, jackpot_out, subscriber_count: subs.length,
    },
    p_entries: subs.map((s) => ({ user_id: s.user_id, scores: byUser[s.user_id] })),
    p_winners: winners,
  });
  if (error) {
    if (error.code === '23505') throw new AppError('A draw for this month is already published', 409);
    throw error;
  }
  return { ...result, draw_id: drawId, simulated: false };
}
