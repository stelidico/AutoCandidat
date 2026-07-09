const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/auth');

// POST /api/promo/redeem
router.post('/redeem', requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code promo requis' });
  }

  const normalized = code.trim().toUpperCase();

  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(normalized);
  if (!promo || !promo.active) {
    return res.status(404).json({ error: 'Code promo invalide' });
  }
  if (promo.used_count >= promo.max_uses) {
    return res.status(410).json({ error: 'Ce code promo a atteint sa limite d\'utilisation' });
  }

  // Check if user already used this code
  const already = db.prepare(
    'SELECT id FROM promo_redemptions WHERE user_id = ? AND code = ?'
  ).get(req.user.id, normalized);
  if (already) {
    return res.status(409).json({ error: 'Vous avez déjà utilisé ce code promo' });
  }

  // Atomic: increment used_count + add credits + record redemption
  db.transaction(() => {
    db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?').run(normalized);
    db.prepare('UPDATE users SET applications_bonus = applications_bonus + ? WHERE id = ?')
      .run(promo.credits, req.user.id);
    db.prepare('INSERT INTO promo_redemptions (id, user_id, code) VALUES (?, ?, ?)')
      .run(uuidv4(), req.user.id, normalized);
  })();

  const user = db.prepare('SELECT applications_bonus FROM users WHERE id = ?').get(req.user.id);
  res.json({
    message: `Code appliqué ! ${promo.credits} candidatures ajoutées à votre compte.`,
    credits_added: promo.credits,
    new_balance: user.applications_bonus,
  });
});

module.exports = router;
