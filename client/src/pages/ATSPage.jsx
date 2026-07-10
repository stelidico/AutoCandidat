import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const STATUSES = [
  { value: 'all',       label: 'Toutes',          color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  { value: 'draft',     label: 'Brouillon',        color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  { value: 'sent',      label: 'Envoyée',          color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  { value: 'waiting',   label: 'En attente',       color: 'text-amber-700',  bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  { value: 'response',  label: 'Réponse reçue',    color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
  { value: 'interview', label: 'Entretien',        color: 'text-indigo-700', bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  { value: 'refused',   label: 'Refusée',          color: 'text-red-700',    bg: 'bg-red-50',     dot: 'bg-red-500' },
  { value: 'accepted',  label: 'Acceptée',         color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-500' },
  { value: 'failed',    label: 'Échec envoi',      color: 'text-orange-700', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
];

function statusInfo(value) {
  return STATUSES.find((s) => s.value === value) || STATUSES[0];
}

// ─── Modal Formulaire ─────────────────────────────────────────────────────────
function AppForm({ initial = {}, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    company: '',
    job_title: '',
    offer_url: '',
    status: 'sent',
    location: '',
    salary: '',
    contact_name: '',
    contact_email: '',
    source: '',
    email_used: '',
    notes: '',
    ...initial,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">
            {initial.id ? 'Modifier la candidature' : 'Ajouter une candidature'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entreprise *</label>
            <input value={form.company} onChange={set('company')} placeholder="ex: Crédit Agricole"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Poste *</label>
            <input value={form.job_title} onChange={set('job_title')} placeholder="ex: Développeur React"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lieu</label>
              <input value={form.location} onChange={set('location')} placeholder="ex: Paris"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Salaire</label>
              <input value={form.salary} onChange={set('salary')} placeholder="ex: 40-45k€"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
            <select value={form.status} onChange={set('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {STATUSES.filter((s) => s.value !== 'all').map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source de l'offre</label>
              <select value={form.source} onChange={set('source')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Sélectionner —</option>
                <option value="France Travail">France Travail</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Welcome to the Jungle">Welcome to the Jungle</option>
                <option value="Monster">Monster</option>
                <option value="Apec">Apec</option>
                <option value="Candidature spontanée">Candidature spontanée</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lien de l'offre</label>
              <input value={form.offer_url} onChange={set('offer_url')} placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email utilisé pour l'envoi</label>
            <input value={form.email_used} onChange={set('email_used')} placeholder="ex: mon.email@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <input value={form.contact_name} onChange={set('contact_name')} placeholder="Nom du recruteur"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email contact</label>
              <input value={form.contact_email} onChange={set('contact_email')} placeholder="recruteur@..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Entretien le 15 mars à 14h, relancer si pas de réponse..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.company.trim() || !form.job_title.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte candidature ────────────────────────────────────────────────────────
function AppCard({ app, onEdit, onDelete, onStatusChange, isPremium, navigate }) {
  const s = statusInfo(app.status);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const appliedDate = app.applied_at
    ? new Date(app.applied_at * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{app.job_title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="font-medium text-gray-700">{app.company}</span>
            {app.location && <><span>·</span><span>{app.location}</span></>}
            {app.salary && <><span>·</span><span className="text-green-600">{app.salary}</span></>}
            {appliedDate && <><span>·</span><span>{appliedDate}</span></>}
          </div>
        </div>

        {/* Status badge / menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.color} border-transparent hover:border-current transition-colors`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
            {s.label}
            <span className="text-[10px] opacity-60">▼</span>
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
              {STATUSES.filter((st) => st.value !== 'all').map((st) => (
                <button
                  key={st.value}
                  onClick={() => { onStatusChange(app.id, st.value); setShowStatusMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 text-left ${app.status === st.value ? 'font-semibold' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                  {st.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {app.status === 'failed' && app.notes && (
        <div className="mt-2 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          {app.notes}
        </div>
      )}

      {(app.source || app.email_used || (isPremium && app.email_opened_at) || (isPremium && app.follow_up_sent_at)) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
          {app.source && <span>📌 {app.source}</span>}
          {app.email_used && <span>✉ {app.email_used}</span>}
          {app.apply_method === 'form' && <span>📝 Via formulaire en ligne</span>}
          {isPremium && app.email_opened_at && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              👁 Ouvert le {new Date(app.email_opened_at * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isPremium && app.follow_up_sent_at && (
            <span className="flex items-center gap-1 text-blue-500 font-medium">
              🔔 Relancé le {new Date(app.follow_up_sent_at * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      )}

      {app.notes && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{app.notes}</p>
      )}

      {isPremium && app.status === 'sent' && !app.contact_email && app.apply_method !== 'form' && (
        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
          ⚠️ Pas d'email renseigné dans l'offre — envoyé à l'adresse RH générique
        </p>
      )}

      {app.offer_url && (
        isPremium ? (
          <a href={app.offer_url} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline truncate">
            🔗 {app.offer_url}
          </a>
        ) : (
          <button onClick={() => navigate('/pricing')}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors">
            🔒 Lien de l'offre — Forfait 49,99€
          </button>
        )
      )}

      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => onEdit(app)}
          className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs rounded-lg transition-colors">
          Modifier
        </button>
        <button onClick={() => onDelete(app.id)}
          className="px-2.5 py-1 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs rounded-lg transition-colors ml-auto">
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ATSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === 'premium';
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/applications'),
        api.get('/applications/stats'),
      ]);
      setApps(appsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    try {
      if (editingApp) {
        await api.put(`/applications/${editingApp.id}`, form);
      } else {
        await api.post('/applications', form);
      }
      await load();
      setShowForm(false);
      setEditingApp(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette candidature ?')) return;
    try {
      await api.delete(`/applications/${id}`);
      setApps((prev) => prev.filter((a) => a.id !== id));
      const statsRes = await api.get('/applications/stats');
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.put(`/applications/${id}`, { status });
      setApps((prev) => prev.map((a) => (a.id === id ? updated.data : a)));
      const statsRes = await api.get('/applications/stats');
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);
  const total = apps.length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi des candidatures</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} candidature{total !== 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => { setEditingApp(null); setShowForm(true); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Ajouter une candidature
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STATUSES.filter((s) => s.value !== 'all').map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(filter === s.value ? 'all' : s.value)}
              className={`rounded-xl p-3 text-center transition-colors border ${
                filter === s.value
                  ? `${s.bg} border-current ${s.color}`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xl font-bold ${filter === s.value ? s.color : 'text-gray-800'}`}>
                {stats[s.value] || 0}
              </div>
              <div className={`text-xs mt-0.5 ${filter === s.value ? s.color : 'text-gray-500'}`}>
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {s.label}
              {s.value !== 'all' && stats[s.value] ? ` (${stats[s.value]})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium text-gray-500">
              {filter === 'all' ? 'Aucune candidature' : `Aucune candidature "${statusInfo(filter).label}"`}
            </p>
            <p className="text-sm mt-1">
              {filter === 'all'
                ? 'Ajoutez votre première candidature pour commencer le suivi'
                : 'Changez le filtre ou ajoutez une candidature'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onEdit={(a) => { setEditingApp(a); setShowForm(true); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                isPremium={isPremium}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <AppForm
          initial={editingApp || {}}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingApp(null); }}
          saving={saving}
        />
      )}
    </Layout>
  );
}
