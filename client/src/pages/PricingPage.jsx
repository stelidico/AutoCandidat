import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import { PRICING_PLANS } from '../data/pricingPlans';

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleBuy = async (planId) => {
    if (planId === 'free') { navigate('/app'); return; }
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
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#379683' }}>Choisissez votre formule</h1>
          <p style={{ color: '#5D5C61' }}>L'IA envoie vos candidatures — vous attendez les réponses.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-6 flex flex-col border-2"
              style={{
                borderColor: plan.highlight ? '#557A95' : '#d5cdc9',
                backgroundColor: plan.highlight ? '#eef2f5' : 'white',
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-white text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#379683' }}>
                    Meilleure valeur
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#5D5C61' }}>{plan.name}</h2>
                <p className="text-sm mt-0.5" style={{ color: '#7395AE' }}>{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold" style={{ color: '#557A95' }}>{plan.price}</span>
                {plan.period && (
                  <span className="text-sm ml-1" style={{ color: '#7395AE' }}>{plan.period}</span>
                )}
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#5D5C61' }}>
                    <span className="mt-0.5 shrink-0 font-bold" style={{ color: '#379683' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading === plan.id}
                className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 text-white"
                style={{ backgroundColor: '#557A95' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4a6a82'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#557A95'; }}
              >
                {loading === plan.id ? 'Redirection…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Paiement sécurisé par Stripe · Paiement unique, sans abonnement
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
