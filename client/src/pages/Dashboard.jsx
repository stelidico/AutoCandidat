import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

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
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'MIS', label: 'Intérim' },
  { value: 'SAI', label: 'Saisonnier' },
  { value: 'STA', label: 'Stage' },
];

const TONES = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'formel', label: 'Formel' },
  { value: 'dynamique', label: 'Dynamique' },
  { value: 'chaleureux', label: 'Chaleureux' },
];

const REGEN_OPTIONS = [
  { value: '', label: '✦ Régénérer' },
  { value: 'plus courte', label: 'Version plus courte' },
  { value: 'plus formelle', label: 'Version plus formelle' },
  { value: 'plus dynamique', label: 'Version plus dynamique' },
  { value: 'reformuler', label: 'Reformuler (même fond)' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [cvText, setCvText] = useState(() => localStorage.getItem('ac_cv_text') || '');
  const [sector, setSector] = useState(() => localStorage.getItem('ac_sector') || '');
  const [contractType, setContractType] = useState(() => localStorage.getItem('ac_contract') || '');
  const [jobDesc, setJobDesc] = useState(() => localStorage.getItem('ac_job_desc') || '');
  const [letter, setLetter] = useState(() => localStorage.getItem('ac_letter') || '');
  const [letterEdited, setLetterEdited] = useState(() => localStorage.getItem('ac_letter') || '');
  const [analysis, setAnalysis] = useState(() => {
    try { const s = localStorage.getItem('ac_cv_analysis'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [tone, setTone] = useState(() => localStorage.getItem('ac_tone') || 'professionnel');
  const [loading, setLoading] = useState('');
  const [regenActive, setRegenActive] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState(null);
  const [hasEmailAccount, setHasEmailAccount] = useState(true);
  const [searchParams] = useSearchParams();
  const [upgradeSuccess, setUpgradeSuccess] = useState(searchParams.get('upgrade') === 'success');
  const [autoApplying, setAutoApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [fileExtracted, setFileExtracted] = useState(false);
  const [cvFileId, setCvFileId] = useState(() => localStorage.getItem('ac_cv_file_id') || null);
  const [cvFileName, setCvFileName] = useState(() => localStorage.getItem('ac_cv_filename') || '');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const dropRef = useRef(null);
  const letterTextareaRef = useRef(null);

  useEffect(() => { localStorage.setItem('ac_cv_text', cvText); }, [cvText]);
  useEffect(() => { localStorage.setItem('ac_sector', sector); }, [sector]);
  useEffect(() => { localStorage.setItem('ac_contract', contractType); }, [contractType]);
  useEffect(() => { localStorage.setItem('ac_job_desc', jobDesc); }, [jobDesc]);
  useEffect(() => { localStorage.setItem('ac_tone', tone); }, [tone]);
  useEffect(() => { if (letter) { localStorage.setItem('ac_letter', letter); setLetterEdited(letter); } }, [letter]);
  useEffect(() => { if (letterEdited) localStorage.setItem('ac_letter', letterEdited); }, [letterEdited]);
  useEffect(() => { if (cvFileId) localStorage.setItem('ac_cv_file_id', cvFileId); else localStorage.removeItem('ac_cv_file_id'); }, [cvFileId]);
  useEffect(() => { if (cvFileName) localStorage.setItem('ac_cv_filename', cvFileName); else localStorage.removeItem('ac_cv_filename'); }, [cvFileName]);
  useEffect(() => {
    api.get('/stripe/status').then(({ data }) => setQuota(data)).catch(() => {});
    api.get('/accounts').then(({ data }) => setHasEmailAccount(Array.isArray(data) && data.length > 0)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!file) { setPdfPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    const el = letterTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [letterEdited]);
  useEffect(() => {
    if (upgradeSuccess) {
      const t = setTimeout(() => setUpgradeSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [upgradeSuccess]);

  const withLoading = async (key, fn) => {
    setLoading(key);
    setError('');
    try { await fn(); }
    catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(''); }
  };

  const setNewFile = (f) => {
    setFile(f);
    setFileExtracted(false);
    setCvFileId(null);
    setCvFileName('');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setNewFile(dropped);
    else setError('Seuls les fichiers PDF sont acceptés');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = () => withLoading('upload', async () => {
    if (!file) throw new Error('Choisissez un fichier PDF');
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/upload', fd);
    if (data.text) setCvText(data.text);
    if (data.cvFileId) { setCvFileId(data.cvFileId); setCvFileName(file.name); }
    setFileExtracted(true);
  });

  const analyze = () => withLoading('analyze', async () => {
    if (!cvText.trim()) throw new Error('Entrez ou uploadez un CV');
    const { data } = await api.post('/analyze', { text: cvText });
    setAnalysis(data);
    setShowAnalysis(true);
    localStorage.setItem('ac_cv_analysis', JSON.stringify(data));
  });

  const generate = (regenInstruction = '') => withLoading('generate', async () => {
    if (!sector) throw new Error('Veuillez choisir un secteur cible.');
    if (!contractType) throw new Error('Veuillez choisir un type de contrat.');
    if (!jobDesc.trim()) throw new Error("Veuillez renseigner l'intitulé du poste.");
    if (!cvText.trim()) throw new Error('Entrez ou uploadez un CV.');
    let useAnalysis = analysis;
    if (!useAnalysis) {
      const { data } = await api.post('/analyze', { text: cvText });
      useAnalysis = data;
      setAnalysis(data);
      localStorage.setItem('ac_cv_analysis', JSON.stringify(data));
    }
    const effectiveJobDesc = jobDesc.trim() || (sector
      ? `Offres dans le secteur : ${SECTORS.find(s => s.value === sector)?.label || sector}${contractType ? ` (${contractType})` : ''}.`
      : '');
    const payload = { cvText, jobDescription: effectiveJobDesc, analysis: useAnalysis, tone };
    if (regenInstruction) payload.instruction = regenInstruction;
    const { data } = await api.post('/generate', payload);
    setLetter(data.letter);
    setAppliedCount(null);
  });

  const handleAutoApply = async () => {
    if (!letter.trim()) { setError('La lettre est vide.'); return; }
    if (!sector) { setError('Veuillez sélectionner un secteur pour la candidature automatique.'); return; }
    setAutoApplying(true);
    setError('');
    try {
      const { data } = await api.post('/jobs/auto-apply', { sector, contractType, letter: letterEdited, cvFileId, analysis, jobDesc });
      setAppliedCount(data.sent);
      api.get('/stripe/status').then(({ data: q }) => setQuota(q)).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setAutoApplying(false);
    }
  };

  const copyLetter = async () => {
    await navigator.clipboard.writeText(letterEdited);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    const blob = new Blob([letterEdited], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lettre_motivation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = letterEdited.trim() ? letterEdited.trim().split(/\s+/).length : 0;
  const charCount = letterEdited.length;
  const hasCredits = quota && (quota.isPremium || (quota.applicationsBonus || 0) > 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CV & Lettres</h1>

        {upgradeSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <span>🎉</span> Votre plan a bien été mis à jour. Merci !
          </div>
        )}

        {!hasEmailAccount && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-orange-800">
              <span>⚠️</span>
              <span><strong>Aucun compte email configuré.</strong> Vos candidatures ne pourront pas être envoyées.</span>
            </div>
            <Link to="/accounts" className="shrink-0 text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              Configurer →
            </Link>
          </div>
        )}

        {quota && !quota.isPremium && !user?.isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <span className="text-amber-800">
              {(quota.applicationsBonus || 0) > 0
                ? <><strong>{quota.applicationsBonus}</strong> candidature{quota.applicationsBonus > 1 ? 's' : ''} disponible{quota.applicationsBonus > 1 ? 's' : ''}</>
                : 'Aucun crédit — achetez un forfait pour envoyer des candidatures'
              }
            </span>
            <Link to="/pricing" className="ml-4 text-indigo-600 font-medium hover:underline whitespace-nowrap">
              Voir les forfaits →
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}{' '}
            {error.includes('Quota') && <Link to="/pricing" className="font-medium underline">Voir les plans</Link>}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Secteur cible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Secteur cible <span className="text-red-500">*</span>
            </label>
            <select value={sector} onChange={(e) => setSector(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!sector ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
              <option value="">— Choisissez un secteur —</option>
              {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Type de contrat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type de contrat <span className="text-red-500">*</span>
            </label>
            <div className={`flex flex-wrap gap-2 p-2 rounded-xl transition-colors ${!contractType ? 'bg-red-50 ring-1 ring-red-300' : ''}`}>
              {CONTRACTS.map((c) => (
                <button key={c.value} onClick={() => setContractType(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${contractType === c.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intitulé du poste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Intitulé du poste <span className="text-red-500">*</span>
            </label>
            <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={3}
              placeholder="Collez la description du poste ici (titre, missions, compétences requises)..."
              className={`w-full px-3 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${!jobDesc.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
          </div>

          {/* Ton */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ton de la lettre</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t.value} onClick={() => setTone(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${tone === t.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={() => generate()} disabled={loading === 'generate' || !cvText.trim() || !sector || !contractType || !jobDesc.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading === 'generate' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Génération en cours...
              </>
            ) : '✦ Générer la lettre'}
          </button>

          {/* Votre CV */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Votre CV</h3>

            {/* Drag & Drop zone */}
            <div ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              {file ? (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-lg">{fileExtracted ? '✅' : '📄'}</span>
                    <div>
                      <span className="font-medium truncate max-w-[180px] block">{file.name}</span>
                      {fileExtracted && <span className="text-xs text-green-600">Texte extrait</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {pdfPreviewUrl && (
                      <button onClick={() => setShowPdfPreview(true)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                        Aperçu
                      </button>
                    )}
                    {!fileExtracted && (
                      <button onClick={upload} disabled={loading === 'upload'}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors">
                        {loading === 'upload' ? 'Extraction...' : 'Extraire le texte'}
                      </button>
                    )}
                    <button onClick={() => setNewFile(null)}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs rounded-lg" title="Retirer le fichier">✕</button>
                  </div>
                </div>
              ) : cvFileId && cvFileName ? (
                /* CV uploadé lors d'une session précédente */
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-lg">✅</span>
                    <div>
                      <span className="font-medium truncate max-w-[180px] block">{cvFileName}</span>
                      <span className="text-xs text-green-600">CV enregistré · sera joint aux emails</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors cursor-pointer">
                      Remplacer
                      <input type="file" accept=".pdf,application/pdf" onChange={(e) => setNewFile(e.target.files[0])} className="sr-only" />
                    </label>
                    <button onClick={() => { setCvFileId(null); setCvFileName(''); }}
                      className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs rounded-lg" title="Retirer le fichier">✕</button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,application/pdf" onChange={(e) => setNewFile(e.target.files[0])} className="sr-only" />
                  <div className="text-gray-400 text-sm">
                    <div className="text-2xl mb-1">📁</div>
                    <span className="font-medium text-indigo-600">Cliquez</span> ou glissez votre CV ici
                    <div className="text-xs mt-1">PDF uniquement · max 5 Mo</div>
                  </div>
                </label>
              )}
            </div>

            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>🔒</span>
              Pour des raisons de sécurité, votre CV est supprimé de nos serveurs après l'envoi des candidatures.
            </p>

            <textarea value={cvText} onChange={(e) => setCvText(e.target.value)} rows={5}
              placeholder="Collez le texte de votre CV ici, ou uploadez un PDF ci-dessus..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

            {cvText.trim() && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-400">{cvText.trim().split(/\s+/).length} mots</span>
                <div className="flex flex-wrap gap-2">
                  {analysis && (
                    <button onClick={() => setShowAnalysis(true)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors">
                      Voir l'analyse
                    </button>
                  )}
                  <button onClick={analyze} disabled={loading === 'analyze'}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                    {loading === 'analyze' ? 'Analyse...' : analysis ? 'Réanalyser' : 'Analyser le CV'}
                  </button>
                  <button onClick={() => {
                    setCvText(''); setAnalysis(null);
                    localStorage.removeItem('ac_cv_analysis');
                  }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-400 text-xs rounded-lg transition-colors">
                    Effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lettre générée */}
        {letter && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4 lg:sticky lg:top-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-gray-800">Lettre de motivation</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{wordCount} mots · {charCount} caractères</span>
                <button onClick={copyLetter}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                  {copied ? '✓ Copié !' : 'Copier'}
                </button>
                <button onClick={downloadLetter}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                  Télécharger
                </button>
                <button onClick={() => { setLetter(''); setLetterEdited(''); localStorage.removeItem('ac_letter'); }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium rounded-lg transition-colors"
                  title="Effacer la lettre">
                  Effacer
                </button>
              </div>
            </div>

            <textarea ref={letterTextareaRef} value={letterEdited} onChange={(e) => setLetterEdited(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed overflow-hidden min-h-[200px]" />

            <div className="flex flex-wrap gap-2">
              {REGEN_OPTIONS.map((opt) => {
                const isActive = loading === 'generate' && regenActive === opt.value;
                return (
                  <button key={opt.value}
                    onClick={() => { setRegenActive(opt.value); generate(opt.value).finally(() => setRegenActive(null)); }}
                    disabled={loading === 'generate'}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                      opt.value === '' ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    } ${isActive ? 'opacity-100 !opacity-100' : ''}`}>
                    {isActive ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        {opt.label}
                      </span>
                    ) : opt.label}
                  </button>
                );
              })}
            </div>

            {/* Auto-apply (affiché uniquement si un secteur est sélectionné) */}
            {sector && (
              <div className="pt-3 border-t border-gray-100">
                {appliedCount !== null ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    <span>🎉</span>
                    <span>
                      <strong>{appliedCount}</strong> candidature{appliedCount > 1 ? 's' : ''} envoyée{appliedCount > 1 ? 's' : ''} !{' '}
                      <Link to="/ats" className="font-semibold underline">Voir mes candidatures</Link>
                    </span>
                  </div>
                ) : (
                  <button onClick={handleAutoApply} disabled={autoApplying || (!hasCredits && !user?.isAdmin) || !hasEmailAccount}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {autoApplying ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Envoi en cours...
                      </>
                    ) : '🚀 Envoyer mes candidatures automatiquement'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        </div>

        {/* Modal Aperçu PDF */}
        {showPdfPreview && pdfPreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPdfPreview(false)} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900">Aperçu du CV</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{file?.name}</p>
                </div>
                <button onClick={() => setShowPdfPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-bold transition-colors">
                  ✕
                </button>
              </div>
              <iframe src={pdfPreviewUrl} title="Aperçu PDF" className="flex-1 w-full rounded-b-2xl" />
            </div>
          </div>
        )}

        {/* Modal Analyse CV */}
        {showAnalysis && analysis && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAnalysis(false)} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900">Analyse de votre CV</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Informations extraites automatiquement</p>
                </div>
                <button onClick={() => setShowAnalysis(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-bold transition-colors">
                  ✕
                </button>
              </div>

              {/* Body scrollable */}
              <div className="overflow-y-auto p-5 space-y-5">
                {/* Profil */}
                {analysis.summary && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1.5">Profil</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
                  </div>
                )}

                {/* Contact */}
                {(analysis.emails?.length > 0 || analysis.phones?.length > 0) && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact détecté</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.emails?.map((e) => (
                        <span key={e} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                          ✉ {e}
                        </span>
                      ))}
                      {analysis.phones?.map((p) => (
                        <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                          📞 {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compétences */}
                {analysis.skills?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Compétences détectées <span className="text-indigo-500">({analysis.skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expériences */}
                {analysis.experiences?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Expériences <span className="text-indigo-500">({analysis.experiences.length})</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.experiences.map((e, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <div>
                            {e.role && <div className="font-medium text-gray-800 text-sm">{e.role}</div>}
                            {e.company && (
                              <div className="text-gray-500 text-xs mt-0.5">
                                {e.company}
                                {e.start && <span> · {e.start}{e.end ? ` – ${e.end}` : ''}</span>}
                              </div>
                            )}
                            {e.description && <div className="text-gray-600 text-xs mt-1">{e.description}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                <button onClick={() => setShowAnalysis(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
