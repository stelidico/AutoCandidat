import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import PublicHeader from '../components/PublicHeader';

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

  const fieldStyle = {
    borderColor: '#d5cdc9',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f1ef' }}>
      <PublicHeader />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {state === 'success' ? (
            <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4" style={{ borderColor: '#d5cdc9' }}>
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-bold" style={{ color: '#1C1C1E' }}>Message envoyé !</h2>
              <p className="text-sm" style={{ color: '#5D5C61' }}>Nous vous répondrons sous 24–48h.</p>
              <Link to="/" className="inline-block text-sm hover:underline" style={{ color: '#557A95' }}>← Retour à l'accueil</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#d5cdc9' }}>
              <div className="border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#7395AE12', borderColor: '#d5cdc9' }}>
                <h1 className="text-base font-semibold" style={{ color: '#379683' }}>Message</h1>
                <button
                  onClick={() => navigate(-1)}
                  className="text-xl font-bold leading-none transition-colors"
                  style={{ color: '#9a2b1f' }}
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Email</label>
                  <input
                    type="email" required value={form.email} onChange={set('email')}
                    placeholder="email@example.com"
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#557A95'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#d5cdc9'; }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Nom</label>
                  <input
                    type="text" value={form.name} onChange={set('name')}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#557A95'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#d5cdc9'; }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Sujet</label>
                  <select
                    value={form.subject} onChange={set('subject')}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#557A95'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#d5cdc9'; }}
                  >
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Objet</label>
                  <input
                    type="text" value={form.objet} onChange={set('objet')}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#557A95'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#d5cdc9'; }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Contenu</label>
                  <textarea
                    required value={form.content} onChange={set('content')} rows={6}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#557A95'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#d5cdc9'; }}
                  />
                </div>

                {state === 'error' && (
                  <p className="text-sm" style={{ color: '#9a2b1f' }}>Erreur lors de l'envoi. Veuillez réessayer.</p>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit" disabled={state === 'loading'}
                    className="px-8 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                    style={{ backgroundColor: '#557A95' }}
                    onMouseEnter={(e) => { if (state !== 'loading') e.currentTarget.style.backgroundColor = '#4a6a82'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#557A95'; }}
                  >
                    {state === 'loading' ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="text-center text-xs mt-4" style={{ color: '#7395AE' }}>Nous répondons sous 24–48h.</p>
        </div>
      </div>
    </div>
  );
}
