const Anthropic = require('@anthropic-ai/sdk');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

async function generateCoverLetter({ cvText = '', jobDescription = '', analysis = null, tone = 'professionnel' } = {}) {
  const demo = `Lettre de motivation générée (mode demo).\nPoste visé: ${jobDescription}\nRésumé CV: ${cvText.slice(0, 200)}...`;
  if (!client) return demo;

  let userContent = `Rédige une lettre de motivation concise (3-4 paragraphes) et professionnelle en français, avec le ton: ${tone}. `;
  userContent += `Personnalise la lettre pour le poste, mets en valeur les compétences pertinentes, inclue des mots-clés ATS et évite les formulations génériques.`;

  if (jobDescription) {
    userContent += `\n\nOffre d'emploi:\n${jobDescription}`;
  }

  if (analysis) {
    try {
      const skills = Array.isArray(analysis.skills) ? analysis.skills.join(', ') : '';
      const summary = analysis.summary || '';
      userContent += `\n\nRésumé du candidat:\n${summary}`;
      if (skills) userContent += `\nCompétences clés: ${skills}`;
      if (analysis.experiences && analysis.experiences.length) {
        userContent += `\nExpériences: ` + analysis.experiences
          .map(e => `${e.role || ''} chez ${e.company || ''} ${e.start || ''}${e.end ? ' - ' + e.end : ''}`)
          .join('; ');
      }
    } catch (e) {}
  } else if (cvText) {
    userContent += `\n\nCV:\n${cvText}`;
  }

  userContent += `\n\nFournis la lettre uniquement en texte, sans balises, commence par une phrase d'accroche.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: "Tu es un expert en rédaction de lettres de motivation en français, optimisées pour les recruteurs et les logiciels ATS.",
    messages: [{ role: 'user', content: userContent }],
  });

  return response.content[0]?.text || demo;
}

module.exports = { generateCoverLetter };
