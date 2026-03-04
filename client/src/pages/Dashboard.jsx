import React, { useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [letter, setLetter] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const withLoading = async (key, fn) => {
    setLoading(key);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading('');
    }
  };

  const upload = () =>
    withLoading('upload', async () => {
      if (!file) throw new Error('Choisissez un fichier PDF');
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/upload', fd);
      if (data.text) setCvText(data.text);
    });

  const analyze = () =>
    withLoading('analyze', async () => {
      if (!cvText.trim()) throw new Error('Entrez ou uploadez un CV');
      const { data } = await api.post('/analyze', { text: cvText });
      setAnalysis(data);
    });

  const generate = () =>
    withLoading('generate', async () => {
      if (!cvText.trim()) throw new Error('Entrez ou uploadez un CV');
      let useAnalysis = analysis;
      if (!useAnalysis) {
        const { data } = await api.post('/analyze', { text: cvText });
        useAnalysis = data;
        setAnalysis(data);
      }
      const { data } = await api.post('/generate', { cvText, jobDescription: jobDesc, analysis: useAnalysis });
      setLetter(data.letter);
    });

  const copyLetter = () => {
    navigator.clipboard.writeText(letter);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">CV & Génération de lettre</h1>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CV */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">CV</h2>

            {/* PDF Upload */}
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <span className="sr-only">Choisir un PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </label>
              <button
                onClick={upload}
                disabled={loading === 'upload' || !file}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading === 'upload' ? '...' : 'Extraire'}
              </button>
            </div>

            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={10}
              placeholder="Collez le texte de votre CV ici, ou uploadez un PDF ci-dessus..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <button
              onClick={analyze}
              disabled={loading === 'analyze' || !cvText.trim()}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              {loading === 'analyze' ? 'Analyse en cours...' : 'Analyser le CV'}
            </button>
          </div>

          {/* Job description + generation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Offre d'emploi</h2>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={6}
              placeholder="Collez la description du poste ici..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <button
              onClick={generate}
              disabled={loading === 'generate' || !cvText.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors"
            >
              {loading === 'generate' ? 'Génération en cours...' : '✦ Générer la lettre'}
            </button>

            {letter && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Lettre générée</span>
                  <button
                    onClick={copyLetter}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Copier
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200">
                  {letter}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Analysis results */}
        {analysis && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Analyse du CV</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {analysis.summary && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Résumé : </span>
                  <span className="text-gray-700">{analysis.summary}</span>
                </div>
              )}
              {analysis.emails?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Emails : </span>
                  <span className="text-gray-700">{analysis.emails.join(', ')}</span>
                </div>
              )}
              {analysis.phones?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Téléphones : </span>
                  <span className="text-gray-700">{analysis.phones.join(', ')}</span>
                </div>
              )}
              {analysis.skills?.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Compétences : </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysis.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.experiences?.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Expériences :</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.experiences.map((e, i) => (
                      <li key={i} className="text-gray-700">
                        {e.role && <strong>{e.role}</strong>}
                        {e.company && ` — ${e.company}`}
                        {e.start && ` (${e.start}${e.end ? ` - ${e.end}` : ''})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
