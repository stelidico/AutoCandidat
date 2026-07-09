const express = require('express');
const Stripe = require('stripe');
const requireAuth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

function getUserQuota(userId) {
  const user = db.prepare(
    'SELECT applications_bonus, premium_until FROM users WHERE id = ?'
  ).get(userId);
  if (!user) return null;

  const now = Math.floor(Date.now() / 1000);
  const isPremium = user.premium_until > now;
  const bonus = user.applications_bonus || 0;

  return {
    plan: isPremium ? 'premium' : (bonus > 0 ? 'paid' : 'none'),
    isPremium,
    applicationsBonus: bonus,
    applications: {
      unlimited: isPremium,
    },
    premiumUntil: isPremium ? user.premium_until : null,
  };
}

// GET /api/stripe/status
router.get('/status', requireAuth, (req, res) => {
  const quota = getUserQuota(req.user.id);
  if (!quota) return res.status(404).json({ error: 'User not found' });
  res.json(quota);
});

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { plan } = req.body;
  if (!['boost', 'premium'].includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const sessionParams = {
    payment_method_types: ['card'],
    metadata: { userId: req.user.id, plan },
    success_url: `${frontendUrl}/?upgrade=success`,
    cancel_url: `${frontendUrl}/pricing`,
    customer_email: req.user.email,
  };

  if (plan === 'boost') {
    sessionParams.mode = 'payment';
    sessionParams.line_items = [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Autocandidat — 80 candidatures automatiques' },
        unit_amount: 1999,
      },
      quantity: 1,
    }];
  } else {
    sessionParams.mode = 'payment';
    sessionParams.line_items = [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Autocandidat — 150 candidatures automatiques' },
        unit_amount: 4999,
      },
      quantity: 1,
    }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  res.json({ url: session.url });
});

module.exports = router;
