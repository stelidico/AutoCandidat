import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Logo from '../components/Logo';

const PRESETS = [
  { label: 'Orange',          host: 'smtp.orange.fr',      port: 465, secure: true  },
  { label: 'SFR',             host: 'smtp.sfr.fr',         port: 465, secure: true  },
  { label: 'Outlook/Hotmail', host: 'smtp.office365.com',  port: 587, secure: false },
  { label: 'Yahoo',           host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  { label: 'Autre',           host: '',                    port: 587, secure: false },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null); // 'gmail' | 'smtp'
  const [consent,  setConsent]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Read OAuth error returned after redirect
  useEffect(() => {
    const err = sessionStorage.getItem('oauth_error');
    if (err) { setError(err); sessionStorage.removeItem('oauth_error'); }
  }, []);

  // SMTP fields
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPass,  setSmtpPass]  = useState('');
  const [smtpHost,  setSmtpHost]  = useState('');
  const [smtpPort,  setSmtpPort]  = useState(587);
  const [smtpSec,   setSmtpSec]   = useState(false);

  const selectPreset = (p) => { setSmtpHost(p.host); setSmtpPort(p.port); setSmtpSec(p.secure); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!provider)   return setError('Choisissez un fournisseur email');
    if (!consent)    return setError('Veuillez accepter les CGU');
    if (provider === 'smtp' && (!smtpEmail || !smtpPass)) return setError('Email et mot de passe SMTP requis');

    setLoading(true);
    try {
      if (provider === 'gmail') {
        sessionStorage.setItem('oauth_success_url', '/app');
        sessionStorage.setItem('oauth_error_url', '/register');
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const serverBase = apiBase.replace(/\/api$/, '');
        const res = await fetch(`${serverBase}/auth/google/url/register`, { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur serveur OAuth');
        const data = await res.json();
        window.location.href = data.url;
        return;
      } else {
        // SMTP: create account then add SMTP config
        await register(smtpEmail, smtpPass, smtpEmail.split('@')[0]);
        await api.post('/accounts', {
          label: smtpEmail,
          email_address: smtpEmail,
          smtp: { host: smtpHost, port: smtpPort, secure: smtpSec, user: smtpEmail, pass: smtpPass },
        });
        navigate('/app');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Erreur lors de l'inscription");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f1ef' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-1"><Logo size={36} textColor="#557A95" /></div>
          <p className="mt-2 text-sm" style={{ color: '#5D5C61' }}>Candidatures automatisées par IA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 relative" style={{ border: '1px solid #d5cdc9' }}>
          <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-xl leading-none" style={{ color: '#7395AE' }}>✕</button>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#5D5C61' }}>Créer un compte</h2>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Provider selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Se connecter avec :</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setProvider('gmail')}
                  className="flex items-center gap-3 p-4 border-2 rounded-xl transition-colors text-left"
                  style={{ borderColor: provider === 'gmail' ? '#557A95' : '#d5cdc9', backgroundColor: provider === 'gmail' ? '#eef2f5' : 'white' }}>
                  <span className="text-2xl font-bold" style={{ color: '#EA4335' }}>G</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Gmail</div>
                    <div className="text-xs text-gray-400">OAuth</div>
                  </div>
                </button>
                <button type="button" onClick={() => setProvider('smtp')}
                  className="flex items-center gap-3 p-4 border-2 rounded-xl transition-colors text-left"
                  style={{ borderColor: provider === 'smtp' ? '#557A95' : '#d5cdc9', backgroundColor: provider === 'smtp' ? '#eef2f5' : 'white' }}>
                  <span className="text-2xl">✉</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Autre</div>
                    <div className="text-xs text-gray-400">SMTP</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Gmail info */}
            {provider === 'gmail' && (
              <p className="text-xs text-center text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Une fenêtre Google s'ouvrira pour vous connecter et autoriser l'envoi d'emails.
              </p>
            )}

            {/* SMTP fields */}
            {provider === 'smtp' && (
              <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: '#d5cdc9', backgroundColor: '#faf9f8' }}>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => selectPreset(p)}
                      className="px-2.5 py-1 text-xs rounded-full border transition-colors"
                      style={{
                        borderColor: smtpHost === p.host ? '#557A95' : '#d5cdc9',
                        backgroundColor: smtpHost === p.host ? '#eef2f5' : 'white',
                        color: smtpHost === p.host ? '#557A95' : '#5D5C61',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Adresse email</label>
                  <input type="email" required value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="vous@orange.fr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe email</label>
                  <input type="password" required value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••" />
                </div>
              </div>
            )}

            {/* CGU */}
            <div className="flex items-start gap-2">
              <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 rounded" />
              <label htmlFor="consent" className="text-xs text-gray-500">
                J'accepte les{' '}
                <Link to="/cgu" target="_blank" className="hover:underline" style={{ color: '#557A95' }}>CGU/CGV</Link>,{' '}
                la <Link to="/privacy" target="_blank" className="hover:underline" style={{ color: '#557A95' }}>politique de confidentialité</Link>{' '}
                et les <Link to="/legal" target="_blank" className="hover:underline" style={{ color: '#557A95' }}>mentions légales</Link>.
              </label>
            </div>

            <button type="submit" disabled={loading || !consent}
              className="w-full py-3 px-4 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: '#557A95' }}>
              {loading ? 'Création...' : 'Créer le compte →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#5D5C61' }}>
            Déjà un compte ?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#557A95' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
