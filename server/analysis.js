const Anthropic = require('@anthropic-ai/sdk');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function extractEmails(text) {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set((text.match(re) || [])));
}

function extractPhones(text) {
  const re = /(?:\+\d{1,3}[ -])?(?:\(?\d{2,3}\)?[ -]?)?\d{2,4}[ -]?\d{2,4}[ -]?\d{2,4}/g;
  return Array.from(new Set((text.match(re) || []).map(s => s.trim())));
}

const COMMON_SKILLS = [
  'JavaScript','TypeScript','React','Node.js','Express','Python','Django','Flask',
  'SQL','NoSQL','MongoDB','PostgreSQL','Docker','Kubernetes','AWS','GCP','Azure',
  'HTML','CSS','Sass','Git','CI/CD','REST','GraphQL','Machine Learning','TensorFlow','PyTorch','NLP'
];

function extractSkills(text) {
  const found = new Set();
  for (const s of COMMON_SKILLS) {
    const re = new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (re.test(text)) found.add(s);
  }
  return Array.from(found);
}

async function analyzeText(text) {
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  let skills = extractSkills(text);
  let summary = text.split('\n').slice(0, 5).join(' ').trim();
  let experiences = [];

  if (client) {
    const prompt = `Extrais les informations du CV suivant et retourne UNIQUEMENT un objet JSON valide avec ces clés:\n- summary: résumé court du profil\n- skills: tableau de compétences\n- experiences: tableau de {company, role, start, end, description}\n- education: tableau de formations\n\nCV:\n\n${text}`;
    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: 'Tu es un parser de CV. Retourne UNIQUEMENT du JSON valide, sans markdown ni texte autour.',
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0]?.text || '';
      try {
        const parsed = JSON.parse(content);
        summary = parsed.summary || summary;
        experiences = parsed.experiences || experiences;
        if (Array.isArray(parsed.skills) && parsed.skills.length) skills = parsed.skills;
      } catch (e) {
        summary = content.substring(0, 800);
      }
    } catch (err) {
      // ignore errors, return best-effort local extraction
    }
  }

  return { emails, phones, skills, summary, experiences };
}

module.exports = { analyzeText };
