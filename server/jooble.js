const https = require('https');

/**
 * Search job offers on Jooble (aggregates HelloWork, Cadremploi, RegionsJob, etc.)
 * API: POST https://jooble.org/api/{API_KEY}
 * @param {object} params
 * @param {string} params.keywords - search terms
 * @param {string} [params.location] - city or region
 * @param {number} [params.size] - results per page (max 20 per request)
 */
async function searchJoobleOffers({ keywords = '', location = '', size = 20 } = {}) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) throw new Error('JOOBLE_API_KEY manquant');

  const body = JSON.stringify({
    keywords,
    location: location || 'France',
    resultonpage: Math.min(size, 20),
    page: 1,
  });

  const data = await httpPost(apiKey, body);

  return {
    total: data.totalCount || 0,
    offers: (data.jobs || []).map(formatOffer),
  };
}

function formatOffer(raw) {
  return {
    id: raw.id || '',
    title: raw.title || '',
    company: raw.company || 'Entreprise non précisée',
    companyWebsite: raw.link || '',
    location: raw.location || '',
    contract: raw.type || '',
    salary: raw.salary || '',
    description: raw.snippet || '',
    skills: [],
    publishedAt: raw.updated || '',
    url: raw.link || '',
    source: 'Jooble',
  };
}

function httpPost(apiKey, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'jooble.org',
      path: `/api/${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Autocandidat/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch { reject(new Error(`Jooble parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Jooble timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { searchJoobleOffers };
