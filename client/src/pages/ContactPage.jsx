import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const SUBJECTS = ['Technique', 'Facturation', 'Compte', 'Suggestion', 'Autre'];

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', subject: 'Technique', objet: '', content: '' });
  const [state, setState] = useState('idle');

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState('loading');
    try {
      await api.post('/contact', form);
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-indigo-600 text-xl">Autocandidat</Link>
        </div>

        {state === 'success' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900">Message envoyé !</h2>
            <p className="text-gray-500 text-sm">Nous vous répondrons sous 24–48h.</p>
            <Link to="/" className="inline-block text-sm text-indigo-600 hover:underline">← Retour à l'accueil</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-800">Message</h1>
              <button
                onClick={() => navigate(-1)}
                className="text-red-500 hover:text-red-700 text-xl font-bold leading-none"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email" required value={form.email} onChange={set('email')}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                <input
                  type="text" value={form.name} onChange={set('name')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Sujet</label>
                <select
                  value={form.subject} onChange={set('subject')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Objet</label>
                <input
                  type="text" value={form.objet} onChange={set('objet')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Contenu</label>
                <textarea
                  required value={form.content} onChange={set('content')} rows={6}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {state === 'error' && (
                <p className="text-red-600 text-sm">Erreur lors de l'envoi. Veuillez réessayer.</p>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="submit" disabled={state === 'loading'}
                  className="px-8 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded transition-colors"
                >
                  {state === 'loading' ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">Nous répondons sous 24–48h.</p>
      </div>
    </div>
  );
}
