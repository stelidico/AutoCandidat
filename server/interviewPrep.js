const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000 })
  : null;

function demoPrep(jobTitle, company) {
  return {
    questions: [
      { category: 'Motivation', question: `Pourquoi souhaitez-vous rejoindre ${company || 'cette entreprise'} ?`, tip: 'Appuyez-vous sur un élément concret de leur activité ou de leurs valeurs.' },
      { category: 'Expérience', question: `Parlez-moi d'une expérience en lien avec le poste${jobTitle ? ` de ${jobTitle}` : ''}.`, tip: 'Utilisez la méthode STAR (Situation, Tâche, Action, Résultat).' },
    ],
    questionsToAsk: ['Quelles sont les priorités du poste dans les 3 premiers mois ?'],
  };
}

async function generateInterviewPrep({
  jobTitle = '', company = '', jobDescription = '', analysis = null,
  cvText = '', userId = null,
} = {}) {
  if (!client) return demoPrep(jobTitle, company);

  let profileContent = '';
  if (analysis) {
    try {
      const skills = Array.isArray(analysis.skills) ? analysis.skills.join(', ') : '';
      profileContent += `Résumé du candidat: ${analysis.summary || ''}`;
      if (skills) profileContent += `\nCompétences clés: ${skills}`;
      if (analysis.experiences?.length) {
        profileContent += `\nExpériences: ` + analysis.experiences
          .map((e) => `${e.role || ''} chez ${e.company || ''} ${e.start || ''}${e.end ? ` - ${e.end}` : ''}`)
          .join('; ');
      }
    } catch (_) {}
  } else if (cvText) {
    profileContent = `CV:\n${cvText}`;
  }

  const userContent = `Prépare un candidat à un entretien d'embauche en français.

Poste : ${jobTitle || 'non précisé'}
Entreprise : ${company || 'non précisée'}
${jobDescription ? `Description du poste :\n${jobDescription}` : ''}

Profil du candidat :
${profileContent || 'non précisé'}

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans texte autour) avec cette forme exacte :
{
  "questions": [
    { "category": "...", "question": "...", "tip": "..." }
  ],
  "questionsToAsk": ["...", "..."]
}

Génère 6 à 8 questions probables, réparties entre motivation, expérience/compétences techniques, comportemental (méthode STAR) et questions spécifiques à l'entreprise/au poste. Pour chaque question, "tip" est un conseil court et concret pour y répondre en s'appuyant sur le profil du candidat. "questionsToAsk" contient 3 à 4 questions pertinentes que le candidat peut poser au recruteur.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1536,
    system: "Tu es un coach en préparation d'entretien d'embauche, expert du marché du travail français.",
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0]?.text || '';

  if (userId && response.usage) {
    try {
      db.prepare(`
        INSERT INTO ai_usage (id, user_id, action, model, input_tokens, output_tokens)
        VALUES (?, ?, 'interview_prep', 'claude-opus-4-6', ?, ?)
      `).run(uuidv4(), userId, response.usage.input_tokens || 0, response.usage.output_tokens || 0);
    } catch (_) {}
  }

  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : text;
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.questions) && parsed.questions.length) return parsed;
  } catch (_) {}

  return demoPrep(jobTitle, company);
}

module.exports = { generateInterviewPrep };
