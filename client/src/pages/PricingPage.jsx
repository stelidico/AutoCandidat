import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const plans = [
  {
    id: 'boost',
    name: '100 candidatures',
    price: '10€',
    period: 'paiement unique',
    description: 'Envoyez 100 candidatures en un clic',
    features: [
      '100 candidatures automatiques',
      'Lettre personnalisée par l\'IA',
      'Offres France Travail correspondantes',
      'Sans engagement',
    ],
    cta: 'Commencer — 10€',
    disabled: false,
    highlight: false,
  },
  {
    id: 'standard',
    name: '290 candidatures',
    price: '29€',
    period: 'paiement unique',
    description: 'Envoyez 290 candidatures en un clic',
    features: [
      '290 candidatures automatiques',
      'Lettre personnalisée par l\'IA',
      'Offres France Travail correspondantes',
      'Sans engagement',
    ],
    cta: 'Commencer — 29€',
    disabled: false,
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '50€',
    period: '/ mois',
    description: 'Candidatures illimitées chaque mois',
    features: [
      'Candidatures illimitées',
      'Lettres illimitées',
      'Campagnes email illimitées',
      'Support prioritaire',
    ],
    cta: 'Passer au Premium',
    disabled: false,
    highlight: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleBuy = async (planId) => {
    setLoading(planId);
    setError('');
    try {
      const { data } = await api.post('/stripe/create-checkout-session', { plan: planId });
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la redirection vers le paiement.');
      setLoading(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choisissez votre formule</h1>
          <p className="text-gray-500">L'IA envoie vos candidatures — vous attendez les réponses.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-indigo-500 shadow-lg bg-indigo-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Meilleure valeur
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {loading === plan.id ? 'Redirection…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Paiement sécurisé par Stripe · Annulation à tout moment pour le Premium
        </p>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Retour
          </button>
        </div>
      </div>
    </Layout>
  );
}
