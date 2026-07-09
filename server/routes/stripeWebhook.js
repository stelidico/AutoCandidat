const Stripe = require('stripe');
const db = require('../db');
const logger = require('../logger');

module.exports = async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('Stripe webhook signature invalid', { err: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const now = Math.floor(Date.now() / 1000);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata || {};
    if (!userId || !plan) return res.json({ received: true });

    if (plan === 'boost') {
      // N'écrase pas 'premium' si l'utilisateur a déjà le forfait supérieur
      db.prepare(`UPDATE users SET applications_bonus = applications_bonus + 80,
        plan = CASE WHEN plan = 'premium' THEN 'premium' ELSE 'boost' END WHERE id = ?`).run(userId);
      logger.info('Forfait boost activated', { userId });
    } else if (plan === 'premium') {
      db.prepare(`UPDATE users SET applications_bonus = applications_bonus + 150, plan = 'premium' WHERE id = ?`).run(userId);
      logger.info('Forfait premium activated', { userId });
    }
  }

  // Renouvellement d'abonnement
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
      const until = now + 35 * 24 * 3600;
      db.prepare('UPDATE users SET premium_until = ? WHERE stripe_customer_id = ?')
        .run(until, invoice.customer);
      logger.info('Premium renewed', { customer: invoice.customer });
    }
  }

  // Annulation abonnement — on laisse expirer naturellement (premium_until reste)
  if (event.type === 'customer.subscription.deleted') {
    logger.info('Subscription cancelled', { customer: event.data.object.customer });
  }

  res.json({ received: true });
};
