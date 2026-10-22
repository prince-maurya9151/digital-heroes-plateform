# Digital Heroes Backend
1. `npm install`  2. `.env.example` -> `.env` bharein  3. Supabase me `src/db/schema.sql` run + bucket `proofs`
4. `npm run dev`  5. Stripe: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`

## Assumptions (decisions)
- Subscription fee ka POOL_PERCENT (default 50%) prize pool me jata hai.
- Yearly plan: price/12 = monthly equivalent pool contribution.
- Draw eligibility: active subscription + exactly 5 scores.
- Match = draw ke 5 numbers aur user ke 5 scores ke distinct common values.
- Jackpot (5-match) na jeete to poora tier5 pool agle month me carry.
- Rolling 5: date ke hisaab se latest 5 scores rakhe jate hain.
- Algorithmic draw: jo score users ne zyada dale unke nikalne ke chance zyada (+1 smoothing).
