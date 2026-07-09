const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const requireAuth = require('../middleware/auth');
const { searchOffers, calculateMatchScore } = require('../francetravail');
const { searchAdzunaOffers } = require('../adzuna');
const { searchJoobleOffers } = require('../jooble');
const { searchJSearchOffers } = require('../jsearch');
const db = require('../db');
const logger = require('../logger');

// ─── Mapping secteur UI → mot-clé SIRENE court ────────────────────────────────
const SIRENE_KEYWORD_MAP = {
  'informatique développement logiciel': 'informatique',
  'marketing communication digital':     'communication',
  'comptabilité finance audit':          'comptabilité',
  'ressources humaines recrutement':     'recrutement',
  'commerce vente business development': 'commerce',
  'ingénierie mécanique électronique':   'ingénierie',
  'santé médical infirmier aide soignant': 'santé',
  'enseignement formation éducation':    'formation',
  'droit juridique notariat':            'juridique',
  'architecture bâtiment travaux publics': 'bâtiment',
  'logistique transport supply chain':   'transport',
  'restauration hôtellerie tourisme':    'restauration',
  'design graphisme ux ui':              'design',
  'administration assistanat secrétariat': 'administration',
};

function toSireneKeyword(sector) {
  return SIRENE_KEYWORD_MAP[sector] || sector.split(' ')[0];
}


// ─── AI company selection via Claude ─────────────────────────────────────────
async function selectCompaniesWithAI(companies, cvAnalysis, jobTitle, needed) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
  if (!client || companies.length === 0) return companies.slice(0, needed);

  // Send all companies to Claude (each line ≈ 20-30 tokens, well within Haiku context)
  const list = companies.map((c, i) =>
    `${i + 1}. ${c.name} | ${c.sector || c.naf || 'N/A'} | ${c.size || ''} | ${c.address || ''}`
  ).join('\n');

  const profile = cvAnalysis
    ? `Résumé: ${cvAnalysis.summary || ''}\nCompétences: ${(cvAnalysis.skills || []).join(', ')}\nExpériences: ${(cvAnalysis.experiences || []).map(e => `${e.role || ''} chez ${e.company || ''}`).join('; ')}`
    : '';

  const prompt = `Profil candidat:\n${profile}\n\nPoste recherché: ${jobTitle}\n\nSélectionne exactement ${needed} entreprises les plus pertinentes pour ce profil parmi cette liste. Réponds UNIQUEMENT avec les numéros séparés par des virgules.\n\n${list}`;

  try {
    const response = await client.messages.create(
      { model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] },
      { timeout: 12000 },
    );
    const indices = (response.content[0]?.text || '').match(/\d+/g)
      ?.map(n => parseInt(n) - 1)
      .filter(i => i >= 0 && i < companies.length) || [];
    return indices.length > 0 ? indices.slice(0, needed).map(i => companies[i]) : companies.slice(0, needed);
  } catch {
    return companies.slice(0, needed);
  }
}

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
// 1. Vérifie le quota (premium / bonus / admin)
// 2. Cherche des entreprises via SIRENE (base INSEE)
// 3. L'IA (Claude) sélectionne les plus pertinentes selon le profil CV
// 4. Crée les entrées ATS immédiatement
// 5. Met en file d'attente l'envoi des emails (worker)
// 6. Répond immédiatement avec le nombre de candidatures créées
router.post('/auto-apply', requireAuth, async (req, res, next) => {
  try {
    const { sector, contractType = '', letter, cvFileId = null, analysis = null, jobDesc = '' } = req.body;
    if (!sector || !letter) {
      return res.status(400).json({ error: 'sector et letter sont requis' });
    }

    const user = db.prepare(
      'SELECT applications_bonus, premium_until, is_admin, plan FROM users WHERE id = ?'
    ).get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isAdmin = !!user.is_admin;
    const bonus = user.applications_bonus || 0;
    const isPremiumPlan = user.plan === 'premium';

    // Taille du lot définie par le forfait
    const PLAN_BATCH = { free: 10, boost: 80, premium: 150 };
    const planBatch = isAdmin ? 150 : (PLAN_BATCH[user.plan] || 10);

    if (!isAdmin && bonus <= 0) {
      return res.status(402).json({
        error: 'Achetez un forfait pour envoyer vos candidatures.',
        code: 'QUOTA_APPLICATIONS',
      });
    }
    if (!isAdmin && bonus < planBatch) {
      return res.status(402).json({
        error: `Crédits insuffisants pour lancer une session complète (${planBatch} candidatures). Vous avez ${bonus} crédit${bonus > 1 ? 's' : ''} restant${bonus > 1 ? 's' : ''}.`,
        code: 'QUOTA_APPLICATIONS',
      });
    }

    // Vérification compte email AVANT de lancer (évite les candidatures créées mais jamais envoyées)
    const emailAccount = db.prepare(`
      SELECT provider, smtp_host, oauth_refresh_token FROM email_accounts
      WHERE user_id = ?
      ORDER BY
        CASE WHEN provider = 'gmail' AND oauth_refresh_token IS NOT NULL THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 1
    `).get(req.user.id);
    const hasResend = !!process.env.RESEND_API_KEY;

    if (!emailAccount && !hasResend) {
      return res.status(422).json({
        error: 'Aucun compte email configuré. Connectez votre Gmail (OAuth) ou ajoutez un compte SMTP dans "Comptes Email" avant de lancer l\'auto-candidature.',
        code: 'NO_EMAIL_ACCOUNT',
      });
    }
    // Détecter tout compte Gmail invalide (SMTP ou OAuth sans refresh token)
    if (emailAccount) {
      const isGmailSmtp = emailAccount.provider !== 'gmail' && /gmail/i.test(emailAccount.smtp_host || '');
      const isGmailOAuthBroken = emailAccount.provider === 'gmail' && !emailAccount.oauth_refresh_token;
      if (isGmailSmtp || isGmailOAuthBroken) {
        return res.status(422).json({
          error: 'Votre compte Gmail n\'est pas correctement configuré. Supprimez-le dans "Comptes Email" et reconnectez via le bouton "Connecter Gmail" (OAuth).',
          code: 'GMAIL_NOT_SUPPORTED',
        });
      }
    }

    // Déduire tous les crédits du forfait en une fois avant envoi
    if (!isAdmin) {
      db.prepare('UPDATE users SET applications_bonus = applications_bonus - ? WHERE id = ?').run(planBatch, req.user.id);
    }
    const maxCompanies = planBatch;

    // 1. Search France Travail (offres réelles) — SIRENE supprimé (aucun email fiable)
    let ftCompanies = [];
    if (process.env.FT_CLIENT_ID && process.env.FT_CLIENT_SECRET) {
      try {
        const ftResult = await searchOffers({ keywords: jobDesc.trim() || toSireneKeyword(sector), publishedSince: 31, size: 100 });
        const seenFt = new Set();
        ftCompanies = ftResult.offers
          .filter((o) => o.company && o.company !== 'Entreprise non précisée')
          .filter((o) => { const k = o.company.toLowerCase().trim(); if (seenFt.has(k)) return false; seenFt.add(k); return true; })
          .map((o) => ({
            name: o.company,
            address: o.location,
            naf: '',
            sector,
            size: '',
            companyWebsite: o.companyWebsite || '',
            contactEmail: o.contactEmail || '',
            jobTitle: o.title,
            offerUrl: o.url,
            source: 'France Travail',
          }));
      } catch (ftErr) {
        logger.warn('France Travail search skipped in auto-apply', { err: ftErr.message });
      }
    }

    // 1c. Search Adzuna + Jooble + JSearch (Google for Jobs : LinkedIn, Indeed, Glassdoor...) en parallèle
    let adzunaCompanies = [];
    let joobleCompanies = [];
    let jsearchCompanies = [];
    const searchKeywords = jobDesc.trim() || toSireneKeyword(sector);

    await Promise.all([
      (async () => {
        if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return;
        try {
          const azResult = await searchAdzunaOffers({ keywords: searchKeywords, size: 50 });
          const seen = new Set();
          adzunaCompanies = azResult.offers
            .filter((o) => o.company && o.company !== 'Entreprise non précisée')
            .filter((o) => { const k = o.company.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
            .map((o) => ({
              name: o.company,
              address: o.location,
              naf: '', sector, size: '',
              companyWebsite: o.companyWebsite || '',
              jobTitle: o.title,
              offerUrl: o.url,
              source: 'Adzuna',
            }));
        } catch (err) {
          logger.warn('Adzuna search skipped', { err: err.message });
        }
      })(),
      (async () => {
        if (!process.env.JOOBLE_API_KEY) return;
        try {
          const jbResult = await searchJoobleOffers({ keywords: searchKeywords, size: 20 });
          const seen = new Set();
          joobleCompanies = jbResult.offers
            .filter((o) => o.company && o.company !== 'Entreprise non précisée' && o.url)
            .filter((o) => { const k = o.company.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
            .map((o) => ({
              name: o.company,
              address: o.location,
              naf: '', sector, size: '',
              companyWebsite: o.companyWebsite || '',
              jobTitle: o.title,
              offerUrl: o.url,
              source: 'Jooble',
            }));
        } catch (err) {
          logger.warn('Jooble search skipped', { err: err.message });
        }
      })(),
      (async () => {
        if (!process.env.RAPIDAPI_KEY) return;
        try {
          const jsResult = await searchJSearchOffers({ keywords: searchKeywords, size: 20 });
          const seen = new Set();
          jsearchCompanies = jsResult.offers
            .filter((o) => o.company && o.company !== 'Entreprise non précisée' && o.url)
            .filter((o) => { const k = o.company.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
            .map((o) => ({
              name: o.company,
              address: o.location,
              naf: '', sector, size: '',
              companyWebsite: o.companyWebsite || '',
              jobTitle: o.title,
              offerUrl: o.url,
              source: 'JSearch',
            }));
        } catch (err) {
          logger.warn('JSearch search skipped', { err: err.message });
        }
      })(),
    ]);

    // Fusionner : FT priorité 1, Adzuna priorité 2, Jooble priorité 3, JSearch priorité 4
    // SIRENE supprimé — aucun email fiable
    const seenNames = new Set(ftCompanies.map((c) => c.name.toLowerCase().trim()));
    const uniqueAdzuna = adzunaCompanies.filter((c) => {
      const k = c.name.toLowerCase().trim();
      if (seenNames.has(k)) return false;
      seenNames.add(k);
      return true;
    });
    const uniqueJooble = joobleCompanies.filter((c) => {
      const k = c.name.toLowerCase().trim();
      if (seenNames.has(k)) return false;
      seenNames.add(k);
      return true;
    });
    const uniqueJSearch = jsearchCompanies.filter((c) => {
      const k = c.name.toLowerCase().trim();
      if (seenNames.has(k)) return false;
      seenNames.add(k);
      return true;
    });
    const allCandidates = [...ftCompanies, ...uniqueAdzuna, ...uniqueJooble, ...uniqueJSearch];

    if (allCandidates.length === 0) {
      return res.status(503).json({
        error: 'Aucune offre trouvée pour ce secteur actuellement. Réessayez dans quelques minutes ou modifiez le secteur.',
        code: 'NO_OFFERS_FOUND',
      });
    }

    // 2. Claude AI selects the best companies from the merged pool
    const needed = Math.min(maxCompanies, allCandidates.length);
    const jobTitle = jobDesc.trim() || sector;
    const selected = await selectCompaniesWithAI(allCandidates, analysis, jobTitle, needed);
    const final = selected.slice(0, needed);

    // 3. Queue emails — ATS entries et crédits déduits UNIQUEMENT après envoi réussi (dans le worker)
    const items = final.map((c) => ({
      appId: uuidv4(),
      company: c.name,
      title: c.jobTitle || jobTitle,
      offerUrl: c.offerUrl || c.companyWebsite || '',
      location: c.address || '',
      companyWebsite: c.companyWebsite || '',
      contactEmail: c.contactEmail || '',
      source: c.source || 'auto-apply',
      sector,
    }));

    db.prepare('INSERT INTO jobs (id, type, payload) VALUES (?, ?, ?)').run(
      uuidv4(),
      'auto_apply_emails',
      JSON.stringify({ userId: req.user.id, items, letter, cvFileId, isAdmin }),
    );

    logger.info('AI auto-apply queued', {
      userId: req.user.id,
      count: items.length,
      sector,
      mode: isAdmin ? 'admin' : isPremiumPlan ? 'premium' : `forfait-${bonus}`,
    });
    res.json({ sent: items.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
