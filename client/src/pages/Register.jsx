import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!consent) return setError('Veuillez accepter les CGU');
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères');

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/app');
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
          <h2 className="text-xl font-semibold mb-1" style={{ color: '#5D5C61' }}>Créer un compte</h2>
          <p className="text-xs mb-6" style={{ color: '#7395AE' }}>
            Vous pourrez connecter votre email d'envoi plus tard, au moment d'envoyer vos candidatures.
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Jean Dupont" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="8 caractères minimum" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

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
