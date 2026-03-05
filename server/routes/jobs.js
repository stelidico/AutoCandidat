const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const requireAuth = require('../middleware/auth');
const { searchOffers, calculateMatchScore } = require('../francetravail');
const db = require('../db');
const logger = require('../logger');

// ─── GET /api/jobs/search ─────────────────────────────────────────────────────
router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const {
      keywords = '',
      location = '',
      contract = '',
      publishedSince = '31',
      page = '0',
    } = req.query;

    if (!keywords.trim()) {
      return res.status(400).json({ error: 'Le paramètre keywords est requis' });
    }

    const result = await searchOffers({
      keywords: keywords.trim(),
      location: location.trim(),
      contract: contract.trim(),
      publishedSince: parseInt(publishedSince) || 31,
      page: parseInt(page) || 0,
      size: 20,
    });

    res.json(result);
  } catch (err) {
    logger.error('France Travail search error', { err: err.message });
    if (err.message.includes('manquants')) {
      return res.status(503).json({ error: 'Service de recherche non configuré (FT_CLIENT_ID/FT_CLIENT_SECRET manquants)' });
    }
    next(err);
  }
});

// ─── POST /api/jobs/match ─────────────────────────────────────────────────────
router.post('/match', requireAuth, async (req, res) => {
  try {
    const { offers, cvAnalysis } = req.body;
    if (!Array.isArray(offers)) {
      return res.status(400).json({ error: 'offers doit être un tableau' });
    }
    const scored = offers.map((offer) => ({
      ...offer,
      matchScore: calculateMatchScore(offer, cvAnalysis),
    }));
    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/jobs/auto-apply ────────────────────────────────────────────────
// Cherche des offres France Travail et crée des candidatures ATS automatiquement.
// Le candidat ne voit jamais les offres — uniquement le nombre envoyé.
//
// Forfaits :
//   Premium (50€/mois) → jusqu'à 150 candidatures, crédit inchangé
//   Forfait 290 (29€)  → jusqu'à 290 candidatures, crédit déduit du réel envoyé
//   Forfait 100 (10€)  → jusqu'à 100 candidatures, crédit déduit du réel envoyé
//   Aucun crédit       → 402 (doit acheter un forfait)
router.post('/auto-apply', requireAuth, async (req, res, next) => {
  try {
    const { sector, contractType = '', letter } = req.body;
    if (!sector || !letter) {
      return res.status(400).json({ error: 'sector et letter sont requis' });
    }

    const user = db.prepare(
      'SELECT applications_bonus, premium_until FROM users WHERE id = ?'
    ).get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Math.floor(Date.now() / 1000);
    const isPremium = user.premium_until > now;
    const bonus = user.applications_bonus || 0;

    if (!isPremium && bonus <= 0) {
      return res.status(402).json({
        error: 'Achetez un forfait pour envoyer vos candidatures.',
        code: 'QUOTA_APPLICATIONS',
      });
    }

    // Nombre max à chercher selon le forfait
    const searchSize = isPremium ? 150 : bonus;

    const result = await searchOffers({
      keywords: sector,
      contract: contractType,
      publishedSince: 31,
      page: 0,
      size: searchSize,
    });

    const offers = result.offers.slice(0, searchSize);
    if (offers.length === 0) {
      return res.json({ sent: 0, total: result.total || 0 });
    }

    // Insertion groupée en transaction
    const nowTs = Math.floor(Date.now() / 1000);
    const insertApp = db.prepare(`
      INSERT INTO applications
        (id, user_id, company, job_title, offer_url, status, location, applied_at, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, ?)
    `);
    const insertBatch = db.transaction((rows) => {
      for (const row of rows) insertApp.run(row);
    });

    const rows = offers.map((offer) => [
      uuidv4(),
      req.user.id,
      offer.company,
      offer.title,
      offer.url,
      offer.location,
      nowTs,
      `Candidature automatique — Secteur: ${sector}\n\nLettre:\n${letter}`,
      nowTs,
      nowTs,
    ]);

    insertBatch(rows);

    // Déduire uniquement les candidatures réellement envoyées
    if (!isPremium) {
      const newBonus = Math.max(0, bonus - rows.length);
      db.prepare('UPDATE users SET applications_bonus = ? WHERE id = ?').run(newBonus, req.user.id);
    }

    logger.info('Auto-apply batch sent', {
      userId: req.user.id,
      count: rows.length,
      sector,
      mode: isPremium ? 'premium' : `forfait-${bonus}`,
    });
    res.json({ sent: rows.length, total: result.total || rows.length });
  } catch (err) {
    if (err.message?.includes('manquants')) {
      return res.status(503).json({ error: 'Service de recherche non configuré (FT_CLIENT_ID/FT_CLIENT_SECRET manquants)' });
    }
    next(err);
  }
});

module.exports = router;
