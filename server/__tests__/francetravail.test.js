const { calculateMatchScore } = require('../francetravail');

describe('calculateMatchScore', () => {
  test('retourne 0 sans analyse de CV', () => {
    const offer = { title: 'Développeur', description: '', skills: [] };
    expect(calculateMatchScore(offer, null)).toBe(0);
  });

  test("retourne un score neutre (50) quand il n'y a rien à comparer", () => {
    const offer = { title: 'x', description: '', skills: [] };
    const analysis = { skills: [], experiences: [], summary: '' };
    expect(calculateMatchScore(offer, analysis)).toBe(50);
  });

  test("score 100 quand toutes les compétences du CV apparaissent dans l'offre", () => {
    const offer = {
      title: 'Développeur React',
      description: 'Poste React et Node.js',
      skills: ['React', 'Node.js'],
    };
    const analysis = { skills: ['React', 'Node.js'], experiences: [], summary: '' };
    expect(calculateMatchScore(offer, analysis)).toBe(100);
  });

  test("score bas quand les compétences du CV n'apparaissent pas dans l'offre", () => {
    const offer = { title: 'Comptable', description: 'Gestion comptable', skills: ['Comptabilité'] };
    const analysis = { skills: ['React', 'Node.js'], experiences: [], summary: '' };
    expect(calculateMatchScore(offer, analysis)).toBeLessThan(50);
  });
});
