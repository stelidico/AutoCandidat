const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000 })
  : null;

async function generateCoverLetter({ cvText = '', jobDescription = '', analysis = null, tone = 'professionnel', instruction = '', userId = null, candidateName = '' } = {}) {
  const demo = `Lettre de motivation générée (mode demo).\nPoste visé: ${jobDescription}\nRésumé CV: ${cvText.slice(0, 200)}...`;
  if (!client) return demo;

  const structureNote = `\n\nStructure attendue:\n- Commence par "Madame, Monsieur," sur sa propre ligne (formule d'appel).\n- Termine par une formule de politesse complète (ex: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.") suivie du nom du candidat${candidateName ? ` (${candidateName})` : ''} sur la ligne suivante.`;

  let userContent;
  if (instruction) {
    // Regenerate with specific instruction
    userContent = `Réécris la lettre de motivation précédente en appliquant cette instruction: "${instruction}". Conserve les informations clés du profil et de l'offre, ainsi que la formule d'appel et la formule de politesse finale. Fournis uniquement la nouvelle lettre en texte brut.`;
    userContent += structureNote;
  } else {
    userContent = `Rédige une lettre de motivation concise (3-4 paragraphes) et professionnelle en français, avec le ton: ${tone}. `;
    userContent += `Personnalise la lettre pour le poste, mets en valeur les compétences pertinentes, inclue des mots-clés ATS et évite les formulations génériques.`;
    userContent += structureNote;
  }

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

  userContent += `\n\nFournis la lettre uniquement en texte, sans balises. Après la formule d'appel, enchaîne directement avec une phrase d'accroche percutante.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: "Tu es un expert en rédaction de lettres de motivation en français, optimisées pour les recruteurs et les logiciels ATS.",
    messages: [{ role: 'user', content: userContent }],
  });

  if (userId && response.usage) {
    try {
      db.prepare(`
        INSERT INTO ai_usage (id, user_id, action, model, input_tokens, output_tokens)
        VALUES (?, ?, 'generate_letter', 'claude-opus-4-6', ?, ?)
      `).run(uuidv4(), userId, response.usage.input_tokens || 0, response.usage.output_tokens || 0);
    } catch (_) {}
  }

  return response.content[0]?.text || demo;
}

module.exports = { generateCoverLetter };
