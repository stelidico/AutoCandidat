const https = require('https');

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/fr/search/1';

/**
 * Search job offers on Adzuna (aggregates Indeed, Monster, etc.)
 * @param {object} params
 * @param {string} params.keywords - search terms
 * @param {string} [params.location] - city or region
 * @param {number} [params.size] - results per page (max 50)
 */
async function searchAdzunaOffers({ keywords = '', location = '', size = 50 } = {}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error('ADZUNA_APP_ID / ADZUNA_APP_KEY manquants');

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(Math.min(size, 50)),
    what: keywords,
  });
  if (location) params.set('where', location);

  const url = `${BASE_URL}?${params.toString()}`;
  const data = await httpGet(url);

  return {
    total: data.count || 0,
    offers: (data.results || []).map(formatOffer),
  };
}

function formatOffer(raw) {
  return {
    id: raw.id,
    title: raw.title || '',
    company: raw.company?.display_name || 'Entreprise non précisée',
    companyWebsite: raw.redirect_url || '',
    location: raw.location?.display_name || '',
    contract: raw.contract_time || '',
    salary: raw.salary_min ? `${raw.salary_min}–${raw.salary_max || ''}€` : '',
    description: raw.description || '',
    skills: [],
    publishedAt: raw.created || '',
    url: raw.redirect_url || '',
    source: 'Adzuna',
  };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'Autocandidat/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch { reject(new Error(`Adzuna parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Adzuna timeout')); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { searchAdzunaOffers };
