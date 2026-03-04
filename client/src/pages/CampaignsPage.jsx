import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

const STATUS_LABELS = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  queued: { label: 'En attente', color: 'bg-yellow-50 text-yellow-700' },
  running: { label: 'En cours', color: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Terminée', color: 'bg-green-50 text-green-700' },
  failed: { label: 'Échouée', color: 'bg-red-50 text-red-700' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const pollRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    account_id: '',
    email_subject: 'Candidature spontanée',
    email_footer: '',
    cv_text: '',
    targets_text: 'recruteur@entreprise.com,Entreprise,Développeur',
  });

  const loadList = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([api.get('/campaigns'), api.get('/accounts')]);
      setCampaigns(r1.data);
      setAccounts(r2.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try {
      const { data } = await api.get(`/campaigns/${id}`);
      setDetail(data);
      // Update status in list too
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: data.status } : c)));
    } catch {
      setDetail(null);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Poll detail if a campaign is running or queued
  useEffect(() => {
    const hasActive = campaigns.some((c) => c.status === 'running' || c.status === 'queued');
    if (hasActive) {
      pollRef.current = setInterval(() => {
        loadList();
        if (selectedId) loadDetail(selectedId);
      }, 5000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [campaigns, selectedId, loadList, loadDetail]);

  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail]);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const lines = form.targets_text.split('\n').map((l) => l.trim()).filter(Boolean);
      const targets = lines.map((l) => {
        const parts = l.split(',');
        return { email: parts[0]?.trim(), company: parts[1]?.trim(), jobTitle: parts[2]?.trim() };
      });
      await api.post('/campaigns', {
        name: form.name,
        account_id: form.account_id || undefined,
        email_subject: form.email_subject,
        email_footer: form.email_footer,
        cv_text: form.cv_text,
        targets,
      });
      setShowForm(false);
      setSuccess('Campagne créée');
      setTimeout(() => setSuccess(''), 4000);
      await loadList();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur création');
    } finally {
      setCreating(false);
    }
  };

  const start = async (id) => {
    setError('');
    try {
      await api.post(`/campaigns/${id}/start`);
      setSuccess('Campagne lancée !');
      setTimeout(() => setSuccess(''), 4000);
      await loadList();
      if (selectedId === id) loadDetail(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lancement');
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      if (selectedId === id) { setSelectedId(null); setDetail(null); }
      await loadList();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur suppression');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Nouvelle campagne
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Nouvelle campagne</h2>
            <form onSubmit={create} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Campagne Dev React"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compte email</label>
                  <select
                    value={form.account_id}
                    onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- choisir --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.label || a.email_address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objet email</label>
                  <input
                    value={form.email_subject}
                    onChange={(e) => setForm((f) => ({ ...f, email_subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature (optionnelle)</label>
                  <input
                    value={form.email_footer}
                    onChange={(e) => setForm((f) => ({ ...f, email_footer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Cordialement, Prénom NOM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte CV (optionnel, commun à toutes les cibles)</label>
                <textarea
                  rows={3}
                  value={form.cv_text}
                  onChange={(e) => setForm((f) => ({ ...f, cv_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Collez votre CV ici..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cibles (une par ligne : email,entreprise,poste)
                </label>
                <textarea
                  rows={5}
                  value={form.targets_text}
                  onChange={(e) => setForm((f) => ({ ...f, targets_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="rh@acme.com,Acme Corp,Développeur React"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format : email,entreprise,intitulé_poste — une cible par ligne
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {creating ? 'Création...' : 'Créer la campagne'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">◈</div>
                <p className="font-medium">Aucune campagne</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {campaigns.map((c) => {
                  const st = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
                  return (
                    <li
                      key={c.id}
                      onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedId === c.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 truncate">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {c.targets_count} cible{c.targets_count !== 1 ? 's' : ''}
                            {c.results_count > 0 && ` · ${c.results_count} envoyé${c.results_count !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {selectedId && detail ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800">{detail.name}</h2>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_LABELS[detail.status] || STATUS_LABELS.draft).color}`}>
                      {(STATUS_LABELS[detail.status] || STATUS_LABELS.draft).label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {(detail.status === 'draft' || detail.status === 'completed' || detail.status === 'failed') && (
                      <button
                        onClick={() => start(detail.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        ▶ Lancer
                      </button>
                    )}
                    {detail.status !== 'running' && detail.status !== 'queued' && (
                      <button
                        onClick={() => remove(detail.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {(detail.status === 'running' || detail.status === 'queued') && (
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                    <span className="animate-pulse">●</span>
                    {detail.status === 'queued' ? 'En attente de traitement...' : `Envoi en cours — ${detail.results?.length || 0} / ${detail.targets?.length || 0}`}
                  </div>
                )}

                {/* Results */}
                {detail.results && detail.results.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Résultats ({detail.results.filter((r) => r.ok).length}/{detail.results.length} réussis)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-100">
                            <th className="text-left pb-2 font-medium">Email</th>
                            <th className="text-left pb-2 font-medium">Entreprise</th>
                            <th className="text-left pb-2 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {detail.results.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-3 text-gray-700">{r.target?.email}</td>
                              <td className="py-1.5 pr-3 text-gray-500">{r.target?.company || '—'}</td>
                              <td className="py-1.5">
                                {r.ok ? (
                                  <span className="text-green-600 font-medium">✓ Envoyé</span>
                                ) : (
                                  <span className="text-red-600" title={r.error}>✗ Erreur</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Targets preview */}
                {detail.targets && detail.targets.length > 0 && detail.results?.length === 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {detail.targets.length} cible{detail.targets.length !== 1 ? 's' : ''}
                    </div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {detail.targets.slice(0, 5).map((t, i) => (
                        <li key={i}>{t.email}{t.company ? ` — ${t.company}` : ''}{t.jobTitle ? ` (${t.jobTitle})` : ''}</li>
                      ))}
                      {detail.targets.length > 5 && (
                        <li className="text-gray-400">...et {detail.targets.length - 5} autres</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                <p>Sélectionnez une campagne pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
