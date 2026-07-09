import { Link } from 'react-router-dom';

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="font-bold text-indigo-600 text-lg">Autocandidat</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Conditions Générales d'Utilisation et de Vente</h1>
            <p className="text-sm text-gray-400">Dernière mise à jour : mars 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">1. Objet</h2>
            <p className="text-sm text-gray-600">
              Les présentes Conditions Générales d'Utilisation et de Vente (CGU/CGV) régissent l'accès et l'utilisation de la plateforme Autocandidat, accessible à l'adresse <strong>autocandidat.fr</strong>, éditée par Autocandidat (Auto-entrepreneur).
            </p>
            <p className="text-sm text-gray-600">
              En créant un compte, l'utilisateur accepte sans réserve les présentes conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">2. Description du service</h2>
            <p className="text-sm text-gray-600">
              Autocandidat est une plateforme SaaS permettant aux candidats à l'emploi de :
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Générer des lettres de motivation personnalisées par intelligence artificielle</li>
              <li>Rechercher des offres d'emploi via France Travail</li>
              <li>Suivre leurs candidatures (ATS simplifié)</li>
              <li>Envoyer des campagnes de candidatures par email depuis leur propre adresse</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Les lettres générées sont produites par un système d'IA (Anthropic / Claude). L'utilisateur est informé que ce contenu est généré automatiquement et doit faire l'objet d'une relecture avant envoi. Autocandidat ne garantit pas l'obtention d'entretiens ou d'emplois.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">3. Création de compte</h2>
            <p className="text-sm text-gray-600">
              L'accès au service nécessite la création d'un compte avec une adresse e-mail valide et un mot de passe. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Autocandidat ne saurait être tenu responsable des accès frauduleux résultant d'une négligence de l'utilisateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">4. Tarification et paiement</h2>
            <p className="text-sm text-gray-600">
              Le service fonctionne sur la base de l'achat de crédits de candidatures :
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Offre</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Prix TTC</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Inclus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Essai Gratuit</td>
                    <td className="px-3 py-2 border border-gray-200">0 € (à l'inscription)</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">10 candidatures automatiques + lettres IA</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Forfait 80 candidatures</td>
                    <td className="px-3 py-2 border border-gray-200">19,99 € (paiement unique)</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">80 candidatures automatiques + lettres IA</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Forfait 150 candidatures</td>
                    <td className="px-3 py-2 border border-gray-200">49,99 € (paiement unique)</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">150 candidatures + toutes fonctionnalités avancées</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Les paiements sont traités de manière sécurisée par <strong>Stripe</strong>. Autocandidat ne stocke aucune donnée bancaire. Les crédits achetés sont crédités immédiatement sur le compte utilisateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">5. Droit de rétractation</h2>
            <p className="text-sm text-gray-600">
              Conformément à l'article L.221-18 du Code de la consommation, les consommateurs disposent d'un délai de <strong>14 jours</strong> à compter de la date d'achat pour exercer leur droit de rétractation, sans avoir à justifier de motifs.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Exception :</strong> Conformément à l'article L.221-28, 13° du Code de la consommation, le droit de rétractation ne peut être exercé pour la fourniture d'un contenu numérique non fourni sur support matériel dont l'exécution a commencé, après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation. En cochant la case de consentement lors de l'inscription et en initiant une première génération de lettre, l'utilisateur reconnaît avoir été informé de cette exception et y consent expressément.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Pour exercer votre droit de rétractation (dans les cas applicables) : <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">6. Remboursements</h2>
            <p className="text-sm text-gray-600">
              Les crédits achetés (80 ou 150 candidatures) sont non remboursables une fois utilisés. En cas de dysfonctionnement technique avéré empêchant l'utilisation des crédits achetés, l'utilisateur peut contacter le support pour un remboursement au prorata ou une compensation en crédits.
            </p>
            <p className="text-sm text-gray-600">
              Tous les forfaits sont des paiements uniques, sans abonnement. Aucun prélèvement récurrent n'est effectué.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">7. Résiliation du compte</h2>
            <p className="text-sm text-gray-600">
              L'utilisateur peut supprimer son compte à tout moment en contactant <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>. La suppression entraîne la perte définitive des données et crédits restants. Autocandidat se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">8. Utilisation acceptable</h2>
            <p className="text-sm text-gray-600">Il est interdit d'utiliser Autocandidat pour :</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Envoyer des messages non sollicités (spam) en masse</li>
              <li>Usurper l'identité d'une autre personne</li>
              <li>Contourner les limites techniques du service</li>
              <li>Toute utilisation contraire aux lois en vigueur</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">9. Intelligence artificielle (AI Act)</h2>
            <p className="text-sm text-gray-600">
              Les lettres de motivation générées par Autocandidat sont produites par un système d'IA générative (Anthropic / Claude). Conformément au Règlement européen sur l'IA (AI Act, UE 2024/1689), l'utilisateur est expressément informé que :
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-2">
              <li>Le contenu est généré automatiquement par IA</li>
              <li>Les lettres produites peuvent contenir des inexactitudes et doivent être relues</li>
              <li>L'utilisateur est seul responsable du contenu envoyé aux recruteurs</li>
              <li>Autocandidat ne garantit pas la pertinence ou l'efficacité des lettres générées</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">10. Responsabilité</h2>
            <p className="text-sm text-gray-600">
              Autocandidat s'engage à fournir le service avec diligence, mais ne peut être tenu responsable des interruptions de service, des pertes de données liées à un cas de force majeure, ni des résultats des candidatures envoyées. La responsabilité d'Autocandidat est limitée au montant payé par l'utilisateur au cours des 12 derniers mois.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">11. Modifications des CGU</h2>
            <p className="text-sm text-gray-600">
              Autocandidat se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email ou via une notification dans l'application. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">12. Droit applicable et litiges</h2>
            <p className="text-sm text-gray-600">
              Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, le litige sera porté devant les tribunaux compétents du ressort du siège social d'Autocandidat, sauf disposition légale contraire applicable aux consommateurs.
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
