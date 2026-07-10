import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return n == null ? '–' : Number(n).toLocaleString('fr-FR');
}
function fmtDate(d) {
  if (!d) return '–';
  return new Date(d * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '–';
  return new Date(d * 1000).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Visits Chart ─────────────────────────────────────────────────────────────
function VisitsChart({ days = 30 }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/admin/visits?days=${days}`).then(r => setData(r.data)).catch(() => {});
  }, [days]);

  if (!data) return <p className="text-gray-400 text-sm">Chargement...</p>;

  // Fill missing days with 0
  const filled = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.daily.find(r => r.day === key);
    filled.push({ day: key, visits: found ? found.visits : 0 });
  }
  const max = Math.max(...filled.map(d => d.visits), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-700">{data.today}</div>
          <div className="text-xs text-indigo-500 mt-1">Visites aujourd'hui</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700">{filled.reduce((s, d) => s + d.visits, 0)}</div>
          <div className="text-xs text-purple-500 mt-1">Visites ({days}j)</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-700">{data.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total toutes périodes</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-xs font-medium text-gray-500 mb-3">Visites par jour ({days} derniers jours)</h3>
        <div className="flex items-end gap-0.5 h-32">
          {filled.map(({ day, visits }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-indigo-400 hover:bg-indigo-500 rounded-t transition-colors"
                style={{ height: `${Math.max((visits / max) * 100, visits > 0 ? 4 : 0)}%` }}
              />
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {new Date(day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : {visits}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{new Date(filled[0]?.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          <span>Aujourd'hui</span>
        </div>
      </div>

      {/* Top pages + Top cities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.topPages?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Pages les plus visitées</h3>
            <div className="space-y-2">
              {data.topPages.map(p => (
                <div key={p.path} className="flex items-center justify-between">
                  <span className="text-gray-700 font-mono text-xs truncate">{p.path || '/'}</span>
                  <span className="text-indigo-600 font-medium text-xs ml-2 shrink-0">{p.visits}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.topCities?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Villes des visiteurs</h3>
            <div className="space-y-2">
              {data.topCities.map(c => {
                const maxV = data.topCities[0].visits;
                return (
                  <div key={`${c.city}-${c.country}`} className="flex items-center gap-2">
                    <span className="text-gray-700 text-xs w-28 truncate shrink-0">{c.city} <span className="text-gray-400">{c.country}</span></span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${(c.visits / maxV) * 100}%` }} />
                    </div>
                    <span className="text-indigo-600 font-medium text-xs shrink-0">{c.visits}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visitDays, setVisitDays] = useState(30);

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data); setLoading(false); });
  }, []);

  if (loading) return <p className="text-gray-500">Chargement...</p>;
  if (!stats) return <p className="text-red-500">Erreur de chargement.</p>;

  const cards = [
    { label: 'Utilisateurs total',      value: fmt(stats.users?.total),             color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Premium',                 value: fmt(stats.users?.premium),            color: 'bg-green-50 text-green-700' },
    { label: 'Suspendus',               value: fmt(stats.users?.suspended),          color: 'bg-red-50 text-red-700' },
    { label: 'Candidatures totales',    value: fmt(stats.applications?.total),       color: 'bg-purple-50 text-purple-700' },
    { label: 'Tokens IA (entrée)',      value: fmt(stats.ai?.total_input_tokens),    color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Tokens IA (sortie)',      value: fmt(stats.ai?.total_output_tokens),   color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Emails SMTP ok (7j)',     value: fmt(stats.smtp?.ok_7d),              color: 'bg-blue-50 text-blue-700' },
    { label: 'Emails SMTP erreur (7j)', value: fmt(stats.smtp?.error_7d),           color: 'bg-red-50 text-red-700' },
    { label: 'Témoignages en attente',  value: fmt(stats.testimonials?.pending),     color: 'bg-orange-50 text-orange-700' },
    { label: 'Support prioritaire (Premium)', value: fmt(stats.support?.priority), color: stats.support?.priority > 0 ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-gray-50 text-gray-600' },
    { label: 'Support en attente (tous)', value: fmt(stats.support?.open),          color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm mt-1 opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Visites du site</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setVisitDays(d)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${visitDays === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                  {d}j
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!confirm('Supprimer toutes les données de visites ? Cette action est irréversible.')) return;
                await api.delete('/admin/page-views');
                window.location.reload();
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        <VisitsChart days={visitDays} />
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/users', { params: { search, plan, page } })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [search, plan, page]);

  useEffect(() => { setPage(1); }, [search, plan]);
  useEffect(() => { load(); }, [load]);

  function openEdit(u) {
    setEditUser(u);
    setEditForm({
      plan: u.plan,
      applications_bonus: u.applications_bonus ?? 0,
      letters_this_month: u.letters_this_month ?? 0,
      suspended: u.suspended ?? 0,
    });
    setError('');
  }

  async function saveEdit() {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/users/${editUser.id}`, editForm);
      setEditUser(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Supprimer ${u.email} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  }

  async function purgeUser(u) {
    if (!confirm(`Anonymiser (RGPD) ${u.email} ? Les données personnelles seront effacées.`)) return;
    try {
      await api.post(`/admin/users/${u.id}/purge`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
          placeholder="Rechercher email / nom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="border rounded-lg px-3 py-2 text-sm" value={plan} onChange={e => setPlan(e.target.value)}>
          <option value="">Tous les plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 font-medium text-gray-600">Email</th>
              <th className="p-3 font-medium text-gray-600">Nom</th>
              <th className="p-3 font-medium text-gray-600">Plan</th>
              <th className="p-3 font-medium text-gray-600">Candidatures</th>
              <th className="p-3 font-medium text-gray-600">Lettres</th>
              <th className="p-3 font-medium text-gray-600">Statut</th>
              <th className="p-3 font-medium text-gray-600">Inscription</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">Aucun utilisateur</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    {u.email}
                    {(u.applications_bonus || 0) > 0 && !u.suspended && !u.is_admin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 whitespace-nowrap">⭐ Prioritaire</span>
                    )}
                  </div>
                </td>
                <td className="p-3">{u.name || '–'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                    u.plan === 'pro' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{u.plan}</span>
                </td>
                <td className="p-3">{fmt(u.applications_used)} / {fmt((u.applications_quota || 0) + (u.applications_bonus || 0))}</td>
                <td className="p-3">{fmt(u.letters_this_month)}</td>
                <td className="p-3">
                  {u.suspended ? (
                    <span className="text-red-600 text-xs font-medium">Suspendu</span>
                  ) : u.is_admin ? (
                    <span className="text-purple-600 text-xs font-medium">Admin</span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">Actif</span>
                  )}
                </td>
                <td className="p-3 text-gray-400">{fmtDate(u.created_at)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => openEdit(u)} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 whitespace-nowrap">Modifier</button>
                    <button onClick={() => purgeUser(u)} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 whitespace-nowrap">RGPD</button>
                    <button onClick={() => deleteUser(u)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 whitespace-nowrap">Suppr.</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">←</button>
          <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">→</button>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-lg">Modifier — {editUser.email}</h3>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm">
                Plan
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={editForm.plan}
                  onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              <label className="block text-sm">
                Bonus candidatures
                <input
                  type="number" min="0"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={editForm.applications_bonus}
                  onChange={e => setEditForm(f => ({ ...f, applications_bonus: Number(e.target.value) }))}
                />
              </label>
              <label className="block text-sm">
                Lettres ce mois (reset manuel)
                <input
                  type="number" min="0"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={editForm.letters_this_month}
                  onChange={e => setEditForm(f => ({ ...f, letters_this_month: Number(e.target.value) }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editForm.suspended}
                  onChange={e => setEditForm(f => ({ ...f, suspended: e.target.checked ? 1 : 0 }))}
                />
                Compte suspendu
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm border rounded-lg">Annuler</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Testimonials Tab ─────────────────────────────────────────────────────────
function TestimonialsTab() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/testimonials', { params: { status } })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id, newStatus) {
    try {
      await api.patch(`/admin/testimonials/${id}`, { status: newStatus });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer ce témoignage ?')) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvés' : 'Rejetés'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">Aucun témoignage dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{t.name}</span>
                  {t.role && <span className="text-gray-400 text-sm ml-2">— {t.role}</span>}
                  <span className="ml-2 text-yellow-500">{'★'.repeat(t.stars || 5)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                  {status === 'pending' && (
                    <>
                      <button onClick={() => moderate(t.id, 'approved')} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 whitespace-nowrap">Approuver</button>
                      <button onClick={() => moderate(t.id, 'rejected')} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 whitespace-nowrap">Rejeter</button>
                    </>
                  )}
                  {status === 'approved' && (
                    <button onClick={() => moderate(t.id, 'rejected')} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 whitespace-nowrap">Dépublier</button>
                  )}
                  {status === 'rejected' && (
                    <button onClick={() => moderate(t.id, 'approved')} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 whitespace-nowrap">Réapprouver</button>
                  )}
                  <button onClick={() => remove(t.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 whitespace-nowrap">Suppr.</button>
                </div>
              </div>
              <p className="text-sm text-gray-700 italic">"{t.text}"</p>
              <p className="text-xs text-gray-400">Source: {t.source} · {fmtDate(t.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Support Tab ──────────────────────────────────────────────────────────────
// Les messages Premium (is_priority) remontent toujours en premier, quelle que
// soit leur date — c'est ce qui matérialise l'engagement "Support prioritaire".
function SupportTab() {
  const [status, setStatus] = useState('open');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/support', { params: { status } })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function resolve(id, newStatus) {
    try {
      await api.patch(`/admin/support/${id}`, { status: newStatus });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['open', 'resolved', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'open' ? 'En attente' : s === 'resolved' ? 'Résolus' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">Aucun message dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {items.map(m => (
            <div key={m.id} className={`border rounded-xl p-4 space-y-2 ${m.is_priority ? 'border-red-300 bg-red-50/40' : ''}`}>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  {m.is_priority === 1 && (
                    <span className="inline-block mr-2 px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">🔴 PRIORITAIRE</span>
                  )}
                  <span className="font-semibold">{m.name || 'Anonyme'}</span>
                  <span className="text-gray-400 text-sm ml-2">— {m.email}</span>
                  {m.user_plan && <span className="ml-2 text-xs text-gray-400">({m.user_plan})</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.status === 'open' ? (
                    <button onClick={() => resolve(m.id, 'resolved')} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 whitespace-nowrap">Marquer résolu</button>
                  ) : (
                    <button onClick={() => resolve(m.id, 'open')} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 whitespace-nowrap">Rouvrir</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">Sujet : {m.subject || '—'} {m.objet && `· ${m.objet}`}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.content}</p>
              <p className="text-xs text-gray-400">{fmtDateTime(m.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Usage Tab ─────────────────────────────────────────────────────────────
function AIUsageTab() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/ai-usage', { params: { days } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="text-gray-400">Chargement...</p>;
  if (!data) return null;

  const maxTokens = Math.max(...(data.by_day || []).map(d => (d.total_in || 0) + (d.total_out || 0)), 1);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              days === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d} jours
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-700">{fmt(data.summary?.total_calls)}</div>
          <div className="text-sm text-yellow-600 mt-1">Appels IA</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-700">{fmt(data.summary?.total_in)}</div>
          <div className="text-sm text-yellow-600 mt-1">Tokens entrée</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-700">{fmt(data.summary?.total_out)}</div>
          <div className="text-sm text-yellow-600 mt-1">Tokens sortie</div>
        </div>
      </div>

      {/* Bar chart */}
      {data.by_day?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Tokens par jour</h3>
          <div className="flex items-end gap-1 h-32">
            {data.by_day.map(d => {
              const total = (d.total_in || 0) + (d.total_out || 0);
              const h = Math.round((total / maxTokens) * 100);
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
                  <div
                    className="w-full bg-yellow-400 rounded-t transition-all"
                    style={{ height: `${h}%` }}
                    title={`${d.day}: ${fmt(total)} tokens`}
                  />
                  <span className="text-xs text-gray-400 rotate-45 origin-left">{d.day?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Derniers appels</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 font-medium text-gray-500">Date</th>
              <th className="p-2 font-medium text-gray-500">Modèle</th>
              <th className="p-2 font-medium text-gray-500">Entrée</th>
              <th className="p-2 font-medium text-gray-500">Sortie</th>
              <th className="p-2 font-medium text-gray-500">User ID</th>
            </tr>
          </thead>
          <tbody>
            {(data.recent || []).map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-gray-400">{fmtDateTime(r.created_at)}</td>
                <td className="p-2 font-mono text-xs">{r.model}</td>
                <td className="p-2">{fmt(r.input_tokens)}</td>
                <td className="p-2">{fmt(r.output_tokens)}</td>
                <td className="p-2 font-mono text-xs text-gray-400">{r.user_id?.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SMTP Log Tab ─────────────────────────────────────────────────────────────
function SMTPLogTab() {
  const [status, setStatus] = useState('');
  const [days, setDays] = useState(7);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/smtp-log', { params: { status, days } })
      .then(r => setLogs(r.data))
      .finally(() => setLoading(false));
  }, [status, days]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <select className="border rounded-lg px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="ok">OK</option>
          <option value="error">Erreur</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>7 jours</option>
          <option value={14}>14 jours</option>
          <option value={30}>30 jours</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 font-medium text-gray-600">Date</th>
              <th className="p-3 font-medium text-gray-600">Destinataire</th>
              <th className="p-3 font-medium text-gray-600">Provider</th>
              <th className="p-3 font-medium text-gray-600">Statut</th>
              <th className="p-3 font-medium text-gray-600">Erreur</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Chargement...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Aucun log</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-3 text-gray-400">{fmtDateTime(l.created_at)}</td>
                <td className="p-3 font-mono text-xs">{l.to_email}</td>
                <td className="p-3">{l.provider || '–'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    l.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{l.status}</span>
                </td>
                <td className="p-3 text-red-500 text-xs max-w-xs truncate">{l.error || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/audit-log', { params: { page } })
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 font-medium text-gray-600">Date</th>
              <th className="p-3 font-medium text-gray-600">Admin</th>
              <th className="p-3 font-medium text-gray-600">Action</th>
              <th className="p-3 font-medium text-gray-600">Cible</th>
              <th className="p-3 font-medium text-gray-600">Détail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Chargement...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Aucune entrée</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-3 text-gray-400">{fmtDateTime(l.created_at)}</td>
                <td className="p-3 font-mono text-xs">{l.admin_email || l.admin_id?.slice(0, 8)}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100">{l.action}</span>
                </td>
                <td className="p-3 text-gray-500 text-xs">{l.target_type} {l.target_id?.slice(0, 8)}</td>
                <td className="p-3 text-xs text-gray-400 max-w-xs truncate">
                  {l.detail ? JSON.stringify(JSON.parse(l.detail)) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">←</button>
          <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}

// ─── SettingsTab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState({ legal_address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      setForm(f => ({ ...f, ...data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.patch('/admin/settings', form);
      setSuccess(true);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Chargement…</p>;

  const fields = [
    { key: 'legal_address', label: 'Adresse postale', placeholder: 'Ex : 12 rue des Lilas, 75001 Paris' },
  ];

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Paramètres légaux</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ces informations apparaissent dans les Mentions légales, la Politique de confidentialité et les CGU.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Paramètres sauvegardés.</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'testimonials', label: 'Témoignages' },
  { id: 'support', label: 'Support' },
  { id: 'ai', label: 'Tokens IA' },
  { id: 'smtp', label: 'Logs SMTP' },
  { id: 'audit', label: 'Audit' },
  { id: 'settings', label: 'Paramètres' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Back-Office Admin</h1>
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Accès restreint</span>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 border-b border-gray-200 min-w-max sm:min-w-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'testimonials' && <TestimonialsTab />}
          {tab === 'support' && <SupportTab />}
          {tab === 'ai' && <AIUsageTab />}
          {tab === 'smtp' && <SMTPLogTab />}
          {tab === 'audit' && <AuditTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </Layout>
  );
}
