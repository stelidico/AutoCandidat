import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

export default function EmailPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [smtp, setSmtp] = useState({ email_address: '', pass: '' });

  const SMTP_PRESETS = {
    'outlook.com': { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    'hotmail.com': { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    'live.com':    { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    'yahoo.fr':    { host: 'smtp.mail.yahoo.com',   port: 465, secure: true  },
    'yahoo.com':   { host: 'smtp.mail.yahoo.com',   port: 465, secure: true  },
    'laposte.net': { host: 'smtp.laposte.net',       port: 465, secure: true  },
    'orange.fr':   { host: 'smtp.orange.fr',         port: 465, secure: true  },
    'free.fr':     { host: 'smtp.free.fr',           port: 465, secure: true  },
    'sfr.fr':      { host: 'smtp.sfr.fr',            port: 465, secure: true  },
    'wanadoo.fr':  { host: 'smtp.wanadoo.fr',        port: 465, secure: true  },
  };

  function getSmtpPreset(email) {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    return SMTP_PRESETS[domain] || { host: `smtp.${domain}`, port: 587, secure: false };
  }

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Lit le résultat OAuth déposé par OAuthCallback après redirection
  useEffect(() => {
    const err = sessionStorage.getItem('oauth_error');
    if (err) { setError(err); sessionStorage.removeItem('oauth_error'); }
    const ok = sessionStorage.getItem('oauth_success');
    if (ok) { setSuccess('Compte Gmail connecté avec succès'); sessionStorage.removeItem('oauth_success'); load(); setTimeout(() => setSuccess(''), 4000); }
  }, [load]);

  const connectGmail = async () => {
    try {
      sessionStorage.setItem('oauth_success_url', '/email');
      sessionStorage.setItem('oauth_error_url', '/email');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const serverBase = apiBase.replace(/\/api$/, '');
      const res = await fetch(`${serverBase}/auth/google/url`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      sessionStorage.removeItem('oauth_success_url');
      sessionStorage.removeItem('oauth_error_url');
      setError(err.message || 'Erreur connexion Gmail');
    }
  };

  const addSmtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const preset = getSmtpPreset(smtp.email_address);
      await api.post('/accounts', {
        label: smtp.email_address,
        email_address: smtp.email_address,
        smtp: { host: preset.host, port: preset.port, secure: preset.secure, user: smtp.email_address, pass: smtp.pass },
      });
      setShowSmtpForm(false);
      setSmtp({ email_address: '', pass: '' });
      setSuccess('Compte SMTP ajouté');
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur ajout compte');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce compte ?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur suppression');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Comptes Email</h1>
          <div className="flex gap-2">
            <button
              onClick={connectGmail}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              ✉ Connecter Gmail
            </button>
            <button
              onClick={() => setShowSmtpForm(!showSmtpForm)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              + SMTP
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

        {showSmtpForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Ajouter un compte email</h2>
            <p className="text-xs text-gray-400 mb-4">Outlook, Yahoo, Orange, Free, SFR, Laposte...</p>
            <form onSubmit={addSmtp} className="flex flex-col gap-4 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                <input type="email" required value={smtp.email_address}
                  onChange={(e) => setSmtp((s) => ({ ...s, email_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="vous@outlook.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input type="password" required value={smtp.pass}
                  onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors">
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
                <button type="button" onClick={() => setShowSmtpForm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {accounts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">✉</div>
              <p className="font-medium">Aucun compte email</p>
              <p className="text-sm mt-1">Connectez un compte Gmail ou ajoutez un compte SMTP</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Compte</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Ajouté le</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{a.label || a.email_address}</div>
                      {a.label && a.label !== a.email_address && (
                        <div className="text-gray-500 text-xs">{a.email_address}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.provider === 'gmail' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {a.provider === 'gmail' ? 'Gmail OAuth' : 'SMTP'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {new Date(a.created_at * 1000).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
