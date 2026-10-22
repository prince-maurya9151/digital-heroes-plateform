import { stripe } from '../config/stripe.js';
import { supabase } from '../config/supabase.js';

const mapStatus = (s) =>
  ['active', 'trialing'].includes(s) ? 'active' : s === 'canceled' ? 'cancelled' : 'lapsed';

async function syncSubscription(sub, userId = null) {
  const user_id = userId || sub.metadata?.user_id;
  if (!user_id) return;
  const item = sub.items.data[0];
  const end = sub.current_period_end ?? item.current_period_end;
  
  const { error } = await supabase.from('subscriptions').upsert({
    user_id,
    plan: item.price.id === process.env.STRIPE_PRICE_YEARLY ? 'yearly' : 'monthly',
    status: mapStatus(sub.status),
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  try {
    const obj = event.data.object;

    if (event.type === 'checkout.session.completed') {
      if (obj.mode === 'subscription') {
        
        const userId = obj.metadata?.user_id;
        const sub = await stripe.subscriptions.retrieve(obj.subscription);
        await syncSubscription(sub, userId);
      } else if (obj.metadata?.type === 'donation') {
        const { error } = await supabase.from('donations').insert({
          charity_id: obj.metadata.charity_id,
          user_id: obj.metadata.user_id || null,
          amount: obj.amount_total / 100,
          stripe_session_id: obj.id,
        });
        if (error && error.code !== '23505') throw error;
      }
    } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncSubscription(obj);
    } else if (event.type === 'invoice.payment_failed') {
      const subId = obj.subscription || obj.parent?.subscription_details?.subscription;
      if (subId) {
        const { error } = await supabase.from('subscriptions').update({ status: 'lapsed' }).eq('stripe_subscription_id', subId);
        if (error) throw error;
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).send('Webhook handler failed');
  }
}