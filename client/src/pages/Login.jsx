import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Résultat OAuth déposé par OAuthCallback après redirection (retour de connectGmail)
  useEffect(() => {
    const err = sessionStorage.getItem('oauth_error');
    if (err) { setError(err); sessionStorage.removeItem('oauth_error'); }
    const ok = sessionStorage.getItem('oauth_success');
    if (ok) {
      sessionStorage.removeItem('oauth_success');
      setLoading(true);
      refreshUser().then(() => navigate('/app'));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGmail = async () => {
    setError('');
    setLoading(true);
    try {
      sessionStorage.setItem('oauth_success_url', '/login');
      sessionStorage.setItem('oauth_error_url', '/login');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const serverBase = apiBase.replace(/\/api$/, '');
      const res = await fetch(`${serverBase}/auth/google/url/register`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur serveur OAuth');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      sessionStorage.removeItem('oauth_success_url');
      sessionStorage.removeItem('oauth_error_url');
      setError(err.message || 'Erreur connexion Gmail');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f1ef' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-1"><Logo size={36} textColor="#557A95" /></div>
          <p className="mt-2 text-sm sm:text-base" style={{ color: '#5D5C61' }}>Candidatures automatisées par IA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 relative" style={{ border: '1px solid #d5cdc9' }}>
          <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-xl leading-none" style={{ color: '#7395AE' }}>✕</button>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#5D5C61' }}>Connexion</h2>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Gmail login */}
          <button onClick={loginWithGmail} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 rounded-xl mb-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            style={{ borderColor: '#d5cdc9' }}>
            <span className="text-xl font-bold" style={{ color: '#EA4335' }}>G</span>
            Continuer avec Gmail
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: '#557A95' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#5D5C61' }}>
            Pas de compte ?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#557A95' }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
