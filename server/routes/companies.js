const express = require('express');
const router = express.Router();
const https = require('https');
const requireAuth = require('../middleware/auth');

// NAF code → label (codes les plus courants)
const NAF_LABELS = {
  '62': 'Informatique', '63': 'Services informatiques', '58': 'Édition logicielle',
  '74': 'Activités spécialisées', '73': 'Publicité / Études de marché',
  '70': 'Conseil / Management', '71': 'Architecture / Ingénierie',
  '72': 'Recherche & Développement', '69': 'Droit / Comptabilité',
  '64': 'Finance / Banque', '65': 'Assurance', '66': 'Activités financières',
  '47': 'Commerce de détail', '46': 'Commerce de gros', '45': 'Commerce automobile',
  '55': 'Hôtellerie', '56': 'Restauration', '93': 'Loisirs / Sport',
  '86': 'Santé', '87': 'Hébergement médical', '88': 'Action sociale',
  '85': 'Enseignement', '84': 'Administration publique',
  '41': 'Construction', '42': 'Génie civil', '43': 'Travaux spécialisés',
  '10': 'Industrie alimentaire', '13': 'Textile', '20': 'Chimie',
  '25': 'Métallurgie', '26': 'Électronique', '27': 'Équipements électriques',
  '28': 'Machines industrielles', '29': 'Automobile',
  '49': 'Transport terrestre', '50': 'Transport maritime', '51': 'Transport aérien',
  '52': 'Logistique', '53': 'Livraison',
  '78': 'Ressources humaines / Recrutement',
  '79': 'Agences de voyage', '80': 'Sécurité',
  '81': 'Services aux bâtiments', '82': 'Services administratifs',
  '90': 'Arts / Spectacle', '91': 'Bibliothèques / Culture',
  '96': 'Services aux particuliers',
};

function getNafLabel(code) {
  if (!code) return '';
  const prefix2 = code.slice(0, 2);
  return NAF_LABELS[prefix2] || code;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json', 'User-Agent': 'Autocandidat/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

// ─── GET /api/companies/search ─────────────────────────────────────────────
router.get('/search', requireAuth, async (req, res) => {
  const { q = '', departement = '', page = 1 } = req.query;
  if (!q.trim()) return res.status(400).json({ error: 'Paramètre q requis' });

  const params = new URLSearchParams({ q: q.trim(), limite: '20', page: String(page) });
  if (departement) params.set('departement', departement.trim());

  try {
    const data = await httpGet(`https://recherche-entreprises.api.gouv.fr/search?${params}`);
    res.json({
      results: (data.results || []).map((r) => ({
        siren: r.siren,
        name: r.nom_complet,
        address: r.siege?.adresse || '',
        postalCode: r.siege?.code_postal || '',
        department: r.siege?.departement || '',
        naf: r.siege?.activite_principale || '',
        sector: getNafLabel(r.siege?.activite_principale),
        size: r.categorie_entreprise || '',
        establishments: r.nombre_etablissements_ouverts || 0,
      })),
      total: data.total_results || 0,
      page: data.page || 1,
      totalPages: data.total_pages || 1,
    });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la recherche SIRENE' });
  }
});

module.exports = router;
