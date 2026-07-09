const https = require('https');

const HOST = 'jsearch.p.rapidapi.com';

/**
 * Search job offers via JSearch (agrège Google for Jobs : LinkedIn, Indeed, Glassdoor, etc.)
 * https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * @param {object} params
 * @param {string} params.keywords - mots-clés (ex: "développeur react")
 * @param {string} [params.location] - ville ou région
 * @param {number} [params.size] - nombre de résultats souhaités (~10 par page facturée, max 3 pages)
 */
async function searchJSearchOffers({ keywords = '', location = '', size = 20 } = {}) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error('RAPIDAPI_KEY manquant');

  const query = location ? `${keywords} in ${location}` : `${keywords} in France`;
  const numPages = Math.min(Math.max(Math.ceil(size / 10), 1), 3);

  const params = new URLSearchParams({
    query,
    page: '1',
    num_pages: String(numPages),
    country: 'fr',
    date_posted: 'all',
  });

  const data = await httpGet(`/search-v2?${params.toString()}`, apiKey);
  const offers = (data.data?.jobs || []).map(formatOffer);

  return {
    total: offers.length,
    offers: offers.slice(0, size),
  };
}

function formatOffer(raw) {
  return {
    id: raw.job_id || '',
    title: raw.job_title || '',
    company: raw.employer_name || 'Entreprise non précisée',
    companyWebsite: raw.employer_website || '',
    location: [raw.job_city, raw.job_country].filter(Boolean).join(', '),
    contract: raw.job_employment_type || '',
    salary: raw.job_salary_string || (raw.job_min_salary ? `${raw.job_min_salary}–${raw.job_max_salary || ''} ${raw.job_salary_period || ''}`.trim() : ''),
    description: raw.job_description || '',
    skills: raw.job_required_skills || [],
    publishedAt: raw.job_posted_at_datetime_utc || '',
    url: raw.job_apply_link || raw.job_google_link || '',
    source: 'JSearch',
  };
}

function httpGet(path, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: HOST,
      path,
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': HOST,
        Accept: 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch { reject(new Error(`JSearch parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('JSearch timeout')); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { searchJSearchOffers };
