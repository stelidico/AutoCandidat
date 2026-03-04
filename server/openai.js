require('dotenv').config();
const OpenAI = require('openai');
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function generateCoverLetter({ cvText = '', jobDescription = '', analysis = null, tone = 'professionnel' } = {}) {
  const demo = `Lettre de motivation générée (mode demo).\nPoste visé: ${jobDescription}\nRésumé CV: ${cvText.slice(0,200)}...`;
  if (!client) return demo;

  // Build a rich prompt in French using analysis when available
  let prompt = `Vous êtes un assistant qui rédige des lettres de motivation en français, adaptées aux offres et optimisées pour les logiciels ATS. `;
  prompt += `Rédige une lettre concise (3-4 paragraphes) et professionnelle en utilisant le ton: ${tone}. `;
  prompt += `Respecte les règles: personnaliser la lettre pour le poste, mettre en valeur les compétences et expériences pertinentes, inclure des mots-clés liés au poste et éviter les formulations génériques.`;

  if (jobDescription) {
    prompt += `\n\nOffre d'emploi:\n${jobDescription}`;
  }

  if (analysis) {
    try {
      const skills = Array.isArray(analysis.skills) ? analysis.skills.join(', ') : '';
      const summary = analysis.summary || '';
      prompt += `\n\nRésumé du candidat:\n${summary}`;
      if (skills) prompt += `\nCompétences clés: ${skills}`;
      if (analysis.experiences && analysis.experiences.length) {
        prompt += `\nExpériences (résumé): ` + analysis.experiences.map(e => `${e.role || ''} chez ${e.company || ''} ${e.start || ''}${e.end ? ' - ' + e.end : ''}`).join('; ');
      }
    } catch (e) {}
  } else if (cvText) {
    prompt += `\n\nCV:\n${cvText}`;
  }

  prompt += `\n\nConsigne: Fournis la lettre uniquement en texte, sans balises, et commence par une phrase d'accroche qui montre la motivation pour le poste.`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 900
  });

  return resp?.choices?.[0]?.message?.content || demo;
}

module.exports = { generateCoverLetter };
