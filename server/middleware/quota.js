const db = require('../db');

// Génération de lettre : autorisée si premium ou si l'utilisateur a des crédits actifs
function checkLetterQuota(req, res, next) {
  const user = db.prepare(
    'SELECT applications_bonus, premium_until FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = Math.floor(Date.now() / 1000);
  if (user.premium_until > now) return next(); // Premium illimité
  if ((user.applications_bonus || 0) > 0) return next(); // A des crédits

  return res.status(402).json({
    error: 'Achetez un forfait pour générer des lettres et envoyer des candidatures.',
    code: 'QUOTA_LETTERS',
  });
}

// Enregistrement de lettres (pour statistiques internes, sans blocage)
function incrementLetters(userId) {
  db.prepare('UPDATE users SET letters_this_month = letters_this_month + 1 WHERE id = ?').run(userId);
}

module.exports = { checkLetterQuota, incrementLetters };
