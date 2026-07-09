import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function Placeholder({ value, fallback }) {
  if (value) return <span>{value}</span>;
  return <span className="text-amber-500 italic">{fallback}</span>;
}

export default function LegalPage() {
  const [s, setS] = useState({});
  useEffect(() => { api.get('/settings').then(r => setS(r.data)).catch(() => {}); }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="font-bold text-indigo-600 text-lg">Autocandidat</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Mentions légales</h1>
            <p className="text-sm text-gray-400">Dernière mise à jour : mars 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">1. Éditeur du site</h2>
            <p className="text-sm text-gray-600">
              <strong>Dénomination sociale :</strong> Autocandidat<br />
              <strong>Forme juridique :</strong> Auto-entrepreneur<br />
              <strong>Adresse postale :</strong> <Placeholder value={s.legal_address} fallback="[À compléter dans les paramètres admin]" /><br />
              <strong>E-mail :</strong> <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">2. Hébergement</h2>
            <p className="text-sm text-gray-600">
              <strong>Frontend :</strong> Vercel Inc., 340 Pine Street Suite 1502, San Francisco, CA 94104, États-Unis<br />
              Site : <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">vercel.com</a>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Backend :</strong> Railway Corp., San Francisco, CA, États-Unis<br />
              Site : <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">railway.app</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">3. Propriété intellectuelle</h2>
            <p className="text-sm text-gray-600">
              L'ensemble des contenus présents sur ce site (textes, visuels, code source) est la propriété exclusive d'Autocandidat, sauf mention contraire. Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, est strictement interdite sans autorisation écrite préalable de l'éditeur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">4. Intelligence artificielle</h2>
            <p className="text-sm text-gray-600">
              Les lettres de motivation générées par ce service sont produites par un système d'intelligence artificielle (Anthropic / Claude). Conformément au Règlement européen sur l'IA (AI Act, UE 2024/1689), l'utilisateur est informé que le contenu généré est le produit d'un système d'IA. L'utilisateur demeure responsable de la relecture, modification et utilisation de ce contenu.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">5. Limitation de responsabilité</h2>
            <p className="text-sm text-gray-600">
              Autocandidat s'efforce d'assurer la disponibilité et la précision du service, mais ne peut garantir l'exhaustivité ou l'actualité des informations. Les lettres générées par IA ont une valeur indicative et ne constituent pas un conseil professionnel. L'utilisation du service se fait sous la seule responsabilité de l'utilisateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">6. Données personnelles</h2>
            <p className="text-sm text-gray-600">
              Pour toute information sur le traitement de vos données personnelles, consultez notre{' '}
              <Link to="/privacy" className="text-indigo-600 hover:underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">7. Conditions d'utilisation</h2>
            <p className="text-sm text-gray-600">
              L'utilisation du service est soumise à nos{' '}
              <Link to="/cgu" className="text-indigo-600 hover:underline">Conditions Générales d'Utilisation et de Vente</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">8. Droit applicable et juridiction</h2>
            <p className="text-sm text-gray-600">
              Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera porté devant les tribunaux compétents du ressort du siège social de l'éditeur, sauf disposition légale contraire.
            </p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
