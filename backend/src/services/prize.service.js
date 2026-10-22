const MONTHLY = Number(process.env.MONTHLY_PRICE || 500);
const YEARLY = Number(process.env.YEARLY_PRICE || 5000);
export const POOL_PCT = Number(process.env.POOL_PERCENT || 50);
export const SHARES = { 5: 0.4, 4: 0.35, 3: 0.25 };

export const CHARITY_MIN = 10;
export const CHARITY_MAX = 100 - POOL_PCT;

const r2 = (n) => Math.round(n * 100) / 100;

export const getPlans = () => ({
  monthly: MONTHLY,
  yearly: YEARLY,
  pool_percent: POOL_PCT,
  charity_min: CHARITY_MIN,
  charity_max: CHARITY_MAX,
  yearly_saving_percent: Math.round((1 - YEARLY / (MONTHLY * 12)) * 100),
});

export const monthlyValue = (plan) => (plan === 'yearly' ? YEARLY / 12 : MONTHLY);

export const validCharityPercent = (p) => Number.isFinite(Number(p)) && Number(p) >= CHARITY_MIN && Number(p) <= CHARITY_MAX;

export function buildPools(subs, jackpotCarry = 0) {
  const total = subs.reduce((s, x) => s + (monthlyValue(x.plan) * POOL_PCT) / 100, 0);
  return {
    total: r2(total),
    tier5: r2(total * SHARES[5] + jackpotCarry), 
    tier4: r2(total * SHARES[4]),
    tier3: r2(total * SHARES[3]),
  };
}

export function allocate(pools, winners) {
  const count = { 3: 0, 4: 0, 5: 0 };
  winners.forEach((w) => count[w.match_count]++);
  const withPrize = winners.map((w) => ({
    ...w,
    prize: r2(pools[`tier${w.match_count}`] / count[w.match_count]),
  }));
  return { winners: withPrize, jackpot_out: count[5] === 0 ? pools.tier5 : 0 };
}
