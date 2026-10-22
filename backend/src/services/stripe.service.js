import { stripe } from '../config/stripe.js';
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { isActive } from '../middleware/requireSubscription.js';

const FRONT = () => process.env.FRONTEND_URL?.replace(/\/$/, '');

export async function createCheckout(user, plan) {
  const price = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : null;
  if (!price) throw new AppError('Plan must be monthly or yearly');

  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
 
  if (isActive(sub)) throw new AppError('You already have an active subscription', 409);

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${FRONT()}/dashboard?paid=1`,
    cancel_url: `${FRONT()}/pricing`,
  });
}

export async function createPortal(userId) {
  const { data: sub } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).maybeSingle();
  if (!sub?.stripe_customer_id) throw new AppError('No subscription found', 404);
  return stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${FRONT()}/dashboard` });
}

export async function createDonation(user, charityId, amount) {
  const amt = Number(amount);
  if (!amt || amt < 1) throw new AppError('A valid amount is required');
  const { data: charity } = await supabase.from('charities').select('id').eq('id', charityId).maybeSingle();
  if (!charity) throw new AppError('Charity not found', 404);

  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'inr', unit_amount: Math.round(amt * 100), product_data: { name: 'Charity donation' } } }],
    customer_email: user?.email,
    metadata: { type: 'donation', charity_id: charityId, user_id: user?.id || '' },
    success_url: `${FRONT()}/charities?donated=1`,
    cancel_url: `${FRONT()}/charities`,
  });
}
