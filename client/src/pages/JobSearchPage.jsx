import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';

const SECTORS = [
  { value: 'informatique développement logiciel', label: 'Informatique / Développement' },
  { value: 'marketing communication digital', label: 'Marketing / Communication' },
  { value: 'comptabilité finance audit', label: 'Comptabilité / Finance' },
  { value: 'ressources humaines recrutement', label: 'Ressources humaines' },
  { value: 'commerce vente business development', label: 'Commerce / Vente' },
  { value: 'ingénierie mécanique électronique', label: 'Ingénierie / Industrie' },
  { value: 'santé médical infirmier aide soignant', label: 'Santé / Médical' },
  { value: 'enseignement formation éducation', label: 'Enseignement / Formation' },
  { value: 'droit juridique notariat', label: 'Droit / Juridique' },
  { value: 'architecture bâtiment travaux publics', label: 'BTP / Architecture' },
  { value: 'logistique transport supply chain', label: 'Logistique / Transport' },
  { value: 'restauration hôtellerie tourisme', label: 'Restauration / Hôtellerie' },
  { value: 'design graphisme ux ui', label: 'Design / UX-UI' },
  { value: 'administration assistanat secrétariat', label: 'Administration / Assistanat' },
];

const CONTRACTS = [
  { value: '', label: 'Tous types de contrat' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'MIS', label: 'Intérim' },
  { value: 'SAI', label: 'Saisonnier' },
];

const STEPS = ['Votre profil', 'Votre lettre', 'Confirmation'];

export default function JobSearchPage() {
  const [step, setStep] = useState(0);

  // Step 0
  const [cvText, setCvText] = useState('');
  const [sector, setSector] = useState('');
  const [contractType, setContractType] = useState('');

  // Step 1
  const [letter, setLetter] = useState('');

  // Step 2
  const [sentCount, setSentCount] = useState(0);
  const [totalFound, setTotalFound] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState(null);

  // Load CV from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ac_cv_text');
    if (saved) setCvText(saved);
  }, []);

  // Load quota
  useEffect(() => {
    api.get('/stripe/status').then(({ data }) => setQuota(data)).catch(() => {});
  }, []);

  const handleGenerateLetter = async () => {
    if (!cvText.trim()) { setError('Veuillez coller votre CV.'); return; }
    if (!sector) { setError('Veuillez sélectionner un secteur.'); return; }
    setError('');
    setLoading(true);
    try {
      const sectorLabel = SECTORS.find((s) => s.value === sector)?.label || sector;
      const jobDescription = `Offres dans le secteur : ${sectorLabel}${contractType ? ` (${contractType})` : ''}.\nRédigez une lettre de motivation percutante et adaptée à ce secteur, en valorisant les compétences du CV ci-joint.`;
      const { data } = await api.post('/generate', {
        cvText,
        jobDescription,
        tone: 'professional',
      });
      setLetter(data.letter || data.text || '');
      setStep(1);
    } catch (err) {
      if (err.response?.data?.code === 'QUOTA_LETTERS') {
        setError('Quota de lettres atteint ce mois-ci.');
      } else {
        setError(err.response?.data?.error || 'Erreur lors de la génération.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoApply = async () => {
    if (!letter.trim()) { setError('La lettre est vide.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/jobs/auto-apply', { sector, contractType, letter });
      setSentCount(data.sent);
      setTotalFound(data.total);
      setStep(2);
      // Refresh quota
      api.get('/stripe/status').then(({ data: q }) => setQuota(q)).catch(() => {});
    } catch (err) {
      if (err.response?.data?.code === 'QUOTA_APPLICATIONS') {
        setError('Quota de candidatures atteint. Achetez le Pack Boost pour envoyer davantage.');
      } else {
        setError(err.response?.data?.error || "Erreur lors de l'envoi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setLetter('');
    setSentCount(0);
    setTotalFound(0);
    setError('');
  };

  const hasCredits = quota && !quota.isPremium && (quota.applicationsBonus || 0) > 0;
  const creditCount = hasCredits ? quota.applicationsBonus : 0;
  const remaining = quota
    ? quota.isPremium ? '∞' : creditCount
    : '…';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidature automatique</h1>
          <p className="text-sm text-gray-500 mt-1">
            L'IA envoie vos candidatures aux offres correspondantes — sans que vous ayez à les parcourir.
          </p>
        </div>

        {/* Quota bar */}
        {quota && !quota.isPremium && hasCredits && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-indigo-700 font-medium">
              <strong>{creditCount} candidatures</strong> disponibles
            </span>
          </div>
        )}
        {quota && !quota.isPremium && !hasCredits && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-amber-700 font-medium">Aucun crédit — achetez un forfait pour commencer</span>
            <Link to="/pricing" className="text-indigo-600 hover:underline font-medium text-xs shrink-0 ml-3">
              Voir les forfaits →
            </Link>
          </div>
        )}

        {/* Steps indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step ? 'bg-indigo-600 text-white' :
                  i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-indigo-600' : i < step ? 'text-gray-500' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <span>⚠</span>
            <div>
              {error}
              {error.includes('Quota') && (
                <Link to="/pricing" className="ml-2 text-indigo-600 hover:underline font-medium">Voir les plans →</Link>
              )}
            </div>
          </div>
        )}

        {/* ── Step 0: Votre profil ── */}
        {step === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Votre CV <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={8}
                placeholder="Collez ici le texte de votre CV (expériences, compétences, formation…)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Astuce : analysez votre CV dans <Link to="/app" className="text-indigo-500 hover:underline">CV &amp; Lettres</Link> pour qu'il soit pré-rempli ici.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Secteur cible <span className="text-red-500">*</span>
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Choisissez un secteur —</option>
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de contrat</label>
              <div className="flex flex-wrap gap-2">
                {CONTRACTS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setContractType(c.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      contractType === c.value
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateLetter}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Génération de votre lettre…
                </>
              ) : '✦ Générer ma lettre de motivation'}
            </button>
          </div>
        )}

        {/* ── Step 1: Votre lettre ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Votre lettre de motivation</label>
                <span className="text-xs text-gray-400">Modifiable</span>
              </div>
              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={14}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              <strong>Comment ça fonctionne ?</strong> En cliquant sur "Envoyer", vos candidatures seront transmises
              automatiquement aux offres correspondant à votre secteur sur France Travail.
              Vous retrouverez les réponses des entreprises directement dans votre messagerie.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(0); setError(''); }}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleAutoApply}
                disabled={loading || remaining === 0}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Envoi en cours…
                  </>
                ) : hasCredits ? (
                  <>🚀 Envoyer {creditCount} candidatures</>
                ) : (
                  <>
                    🚀 Envoyer mes candidatures
                    {remaining !== '∞' && remaining !== '…' && (
                      <span className="text-xs opacity-80">(max {remaining})</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirmation ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {sentCount} candidature{sentCount > 1 ? 's' : ''} envoyée{sentCount > 1 ? 's' : ''} !
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                {totalFound > sentCount && (
                  <span>{totalFound.toLocaleString('fr-FR')} offres trouvées — </span>
                )}
                Vos candidatures ont été transmises aux entreprises de votre secteur.
                <br />
                Vous serez contacté directement si votre profil les intéresse.
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-700">
              Suivez les réponses des entreprises dans{' '}
              <Link to="/ats" className="font-semibold underline">votre espace candidatures</Link>.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/ats"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors"
              >
                Voir mes candidatures
              </Link>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition-colors"
              >
                Nouvelle recherche
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
