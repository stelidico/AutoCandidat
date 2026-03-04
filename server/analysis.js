require('dotenv').config();
const OpenAI = require('openai');
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function extractEmails(text) {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set((text.match(re) || [])));
}

function extractPhones(text) {
  const re = /(?:\+\d{1,3}[ \-])?(?:\(?\d{2,3}\)?[ \-]?)?\d{2,4}[ \-]?\d{2,4}[ \-]?\d{2,4}/g;
  return Array.from(new Set((text.match(re) || []).map(s => s.trim())));
}

const COMMON_SKILLS = [
  'JavaScript','TypeScript','React','Node.js','Express','Python','Django','Flask','SQL','NoSQL','MongoDB','PostgreSQL','Docker','Kubernetes','AWS','GCP','Azure','HTML','CSS','Sass','Git','CI/CD','REST','GraphQL','Machine Learning','TensorFlow','PyTorch','NLP'
];

function extractSkills(text) {
  const found = new Set();
  const lower = text.toLowerCase();
  for (const s of COMMON_SKILLS) {
    const re = new RegExp('\\b' + s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\b', 'i');
    if (re.test(lower)) found.add(s);
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
    const prompt = `Extract a JSON object from the following CV text in French with keys: summary (short), skills (array of strings), experiences (array of {company, role, start, end, description}), education (array). Return ONLY valid JSON. CV:\n\n${text}`;
    try {
      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800
      });
      const content = resp?.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        summary = parsed.summary || summary;
        experiences = parsed.experiences || experiences;
        if (Array.isArray(parsed.skills) && parsed.skills.length) skills = parsed.skills;
      } catch (e) {
        // fallback: keep simple summary
        summary = content.substring(0, 800);
      }
    } catch (err) {
      // ignore OpenAI errors, return best-effort local extraction
    }
  }

  return { emails, phones, skills, summary, experiences };
}

module.exports = { analyzeText };
