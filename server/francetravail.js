const https = require('https');
const querystring = require('querystring');

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

let _token = null;
let _tokenExpiry = 0;

// ─── Fetch OAuth token (cached) ───────────────────────────────────────────────
async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 30000) return _token;

  const clientId = process.env.FT_CLIENT_ID;
  const clientSecret = process.env.FT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('FT_CLIENT_ID / FT_CLIENT_SECRET manquants');

  const body = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'api_offresdemploiv2 o2dsoffre',
  });

  const data = await httpPost(TOKEN_URL, body, { 'Content-Type': 'application/x-www-form-urlencoded' });
  _token = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _token;
}

// ─── Search job offers ────────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.keywords - mots-clés (ex: "développeur react")
 * @param {string} [params.location] - code département (ex: "75") ou commune INSEE
 * @param {string} [params.contract] - CDI, CDD, MIS, SAI, etc.
 * @param {number} [params.publishedSince] - jours depuis publication (1,3,7,14,31)
 * @param {number} [params.page] - page (0-based)
 * @param {number} [params.size] - résultats par page (max 150)
 */
async function searchOffers({ keywords = '', location = '', contract = '', publishedSince = 31, page = 0, size = 20 } = {}) {
  const token = await getToken();

  const params = new URLSearchParams();
  if (keywords) params.set('motsCles', keywords);
  if (location) {
    // If numeric and 2-3 chars, treat as department
    if (/^\d{2,3}$/.test(location)) {
      params.set('departement', location);
    } else {
      params.set('commune', location);
    }
  }
  if (contract) params.set('typeContrat', contract);
  if (publishedSince) params.set('publieeDepuis', publishedSince);

  const start = page * size;
  const end = start + size - 1;
  params.set('range', `${start}-${end}`);

  const url = `${SEARCH_URL}?${params.toString()}`;
  const data = await httpGet(url, { Authorization: `Bearer ${token}`, Accept: 'application/json' });

  return {
    total: data.resultats ? (data.Content_Range ? parseContentRange(data.Content_Range) : data.resultats.length) : 0,
    offers: (data.resultats || []).map(formatOffer),
  };
}

function parseContentRange(header) {
  const m = header.match(/\/(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

function extractContactEmail(raw) {
  // France Travail sometimes provides contact info in contact.coordonnees
  const coordonnees = raw.contact?.coordonnees || '';
  const emailMatch = coordonnees.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) return emailMatch[0].toLowerCase();
  // Also check urlPostulation which can be a mailto: link
  const postulation = raw.origineOffre?.urlOrigine || '';
  if (postulation.startsWith('mailto:')) return postulation.replace('mailto:', '').split('?')[0].toLowerCase();
  return '';
}

function formatOffer(raw) {
  return {
    id: raw.id,
    title: raw.intitule || '',
    company: raw.entreprise?.nom || 'Entreprise non précisée',
    companyWebsite: raw.entreprise?.url || raw.origineOffre?.urlOrigine || '',
    contactEmail: extractContactEmail(raw),
    location: raw.lieuTravail?.libelle || '',
    contract: raw.typeContratLibelle || raw.typeContrat || '',
    salary: raw.salaire?.libelle || '',
    description: raw.description || '',
    skills: (raw.competences || []).map((c) => c.libelle).filter(Boolean),
    qualifications: raw.qualitesProfessionnelles?.map((q) => q.libelle).filter(Boolean) || [],
    experience: raw.experienceLibelle || '',
    publishedAt: raw.dateCreation || '',
    url: raw.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${raw.id}`,
    source: 'France Travail',
  };
}

// ─── Calculate matching score ─────────────────────────────────────────────────
function calculateMatchScore(offer, cvAnalysis) {
  if (!cvAnalysis) return 0;

  const cvSkills = (cvAnalysis.skills || []).map((s) => s.toLowerCase());
  const cvText = [
    cvAnalysis.summary || '',
    ...(cvAnalysis.experiences || []).map((e) => `${e.role || ''} ${e.company || ''}`),
    ...cvSkills,
  ].join(' ').toLowerCase();

  const offerText = `${offer.title} ${offer.description} ${offer.skills.join(' ')}`.toLowerCase();

  // Keyword matching
  let matches = 0;
  let total = 0;

  for (const skill of cvSkills) {
    if (skill.length < 3) continue;
    total++;
    if (offerText.includes(skill)) matches++;
  }

  // Also check offer skills against CV text
  for (const skill of offer.skills) {
    const s = skill.toLowerCase();
    if (s.length < 3) continue;
    total++;
    if (cvText.includes(s)) matches++;
  }

  if (total === 0) return 50; // no skills to compare → neutral score
  return Math.round((matches / total) * 100);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('France Travail token timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers,
    }, (res) => {
      let data = '';
      // Capture Content-Range for pagination
      const contentRange = res.headers['content-range'] || '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          if (contentRange) json.Content_Range = contentRange;
          resolve(json);
        } catch {
          // Empty or non-JSON (206 with empty body)
          resolve({ resultats: [], Content_Range: contentRange });
        }
      });
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('France Travail search timeout')); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { searchOffers, calculateMatchScore };
