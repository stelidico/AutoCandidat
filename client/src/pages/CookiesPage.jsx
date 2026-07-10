import { Link } from 'react-router-dom';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="font-bold text-indigo-600 text-lg">Autocandidat</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Politique de cookies</h1>
            <p className="text-sm text-gray-400">Dernière mise à jour : juillet 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">1. Qu'est-ce qu'un cookie ?</h2>
            <p className="text-sm text-gray-600">
              Un cookie est un petit fichier texte déposé par un site web dans votre navigateur. Il peut servir à mémoriser une session de connexion, des préférences, ou à mesurer l'audience d'un site. Cette page détaille précisément ce qu'Autocandidat dépose ou non sur votre appareil.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">2. Cookie strictement nécessaire (authentification)</h2>
            <p className="text-sm text-gray-600 mb-2">
              Autocandidat dépose un unique cookie technique, indispensable au fonctionnement du service :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Nom</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Finalité</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Durée</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-mono">token</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Maintient votre session connectée (authentification)</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">7 jours</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">HttpOnly, non lisible par du code tiers</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Ce cookie étant strictement nécessaire au fonctionnement du service (vous garder connecté), il est exempté de consentement au titre de l'article 82 de la loi Informatique et Libertés / directive ePrivacy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">3. Stockage local du navigateur (localStorage)</h2>
            <p className="text-sm text-gray-600">
              Autocandidat utilise le stockage local de votre navigateur (localStorage) — techniquement distinct d'un cookie — pour conserver localement, sur votre appareil uniquement : le brouillon de votre CV et de vos lettres en cours de rédaction, vos préférences (secteur, ton), et votre choix concernant la bannière de consentement. Ces données ne sont jamais transmises à un tiers et restent sur votre appareil jusqu'à ce que vous les effaciez.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">4. Mesure d'audience</h2>
            <p className="text-sm text-gray-600">
              Aucun cookie n'est utilisé à cette fin. À la place, chaque page consultée déclenche un enregistrement anonymisé (URL visitée, référent) associé à une géolocalisation approximative de l'adresse IP, réalisée via le service tiers <strong>ip-api.com</strong>. L'adresse IP elle-même n'est pas conservée : seule la ville/le pays qui en est déduit est stocké, à des fins de statistiques internes de fréquentation.
            </p>
            <p className="text-sm text-gray-600">
              Ce traitement est fondé sur notre intérêt légitime à mesurer l'audience du service (art. 6.1.f RGPD). Vous pouvez vous y opposer à tout moment en nous contactant à <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">5. Pixel de suivi d'ouverture d'email (forfait Premium)</h2>
            <p className="text-sm text-gray-600">
              Pour les utilisateurs du forfait Premium, un pixel de suivi est inséré dans les emails de candidature <strong>envoyés par vous</strong> via le service, afin de détecter si le destinataire (le recruteur) a ouvert l'email — utile pour déclencher une relance automatique. Ce mécanisme ne concerne pas votre propre messagerie et n'est pas un cookie déposé sur votre navigateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">6. Ce que nous ne faisons pas</h2>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Aucun cookie publicitaire ou de traçage cross-site (Google Ads, Facebook Pixel, etc.)</li>
              <li>Aucune revente de données de navigation à des tiers</li>
              <li>Aucun outil de mesure d'audience tiers (type Google Analytics) déployé à ce jour</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">7. Gérer vos préférences</h2>
            <p className="text-sm text-gray-600">
              Le cookie d'authentification étant strictement nécessaire, il n'existe pas de bandeau de refus pour celui-ci : vous pouvez à tout moment vous déconnecter pour le faire expirer, ou le supprimer manuellement via les réglages de votre navigateur (ce qui vous déconnectera). Pour la mesure d'audience par géolocalisation IP, voir la section 4 ci-dessus pour vous y opposer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">8. Plus d'informations</h2>
            <p className="text-sm text-gray-600">
              Pour le détail complet du traitement de vos données personnelles, consultez notre{' '}
              <Link to="/privacy" className="text-indigo-600 hover:underline">politique de confidentialité</Link>.
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
