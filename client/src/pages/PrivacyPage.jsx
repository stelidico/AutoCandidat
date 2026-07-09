import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="font-bold text-indigo-600 text-lg">Autocandidat</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Politique de confidentialité</h1>
            <p className="text-sm text-gray-400">Dernière mise à jour : mars 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">1. Responsable du traitement</h2>
            <p className="text-sm text-gray-600">
              <strong>Autocandidat</strong> — Auto-entrepreneur<br />
              E-mail : <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">2. Délégué à la Protection des Données (DPO)</h2>
            <p className="text-sm text-gray-600">
              Aucun DPO n'a été désigné à ce stade. Si le volume de traitement de données à caractère personnel venait à atteindre un seuil systématique ou à grande échelle, une désignation sera effectuée conformément à l'article 37 du RGPD et notifiée à la CNIL. Pour toute question relative à la protection des données : <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">3. Données collectées</h2>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Nom, adresse e-mail et mot de passe (inscription)</li>
              <li>Contenu textuel du CV (extrait du PDF pour la génération de lettres)</li>
              <li>Comptes email connectés (Gmail OAuth ou identifiants SMTP)</li>
              <li>Historique des candidatures, campagnes et lettres générées</li>
              <li>Logs d'utilisation (génération de lettres, envois d'emails)</li>
              <li>Données de paiement (gérées exclusivement par Stripe — non stockées par Autocandidat)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">4. Finalités du traitement</h2>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Fourniture du service (génération de lettres personnalisées par IA, envoi de candidatures)</li>
              <li>Authentification et sécurité du compte</li>
              <li>Amélioration de la qualité du service</li>
              <li>Facturation et gestion des achats de crédits (via Stripe)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">5. Base légale</h2>
            <p className="text-sm text-gray-600">
              Le traitement est fondé sur l'exécution du contrat (CGU) auquel l'utilisateur est partie (art. 6.1.b RGPD), et sur le consentement explicite de l'utilisateur pour les communications optionnelles (art. 6.1.a RGPD).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">6. Durée de conservation</h2>
            <p className="text-sm text-gray-600">
              Les données sont conservées pendant toute la durée d'activité du compte, puis supprimées dans un délai de 30 jours suivant la clôture du compte, sauf obligations légales contraires (ex. : conservation des données de facturation pendant 10 ans).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">7. Sous-traitants et destinataires</h2>
            <p className="text-sm text-gray-600 mb-2">
              Les données ne sont pas vendues. Elles peuvent être transmises aux sous-traitants suivants dans le cadre strict de la fourniture du service :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Sous-traitant</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Rôle</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Données transmises</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-700">Pays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Anthropic</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Génération IA des lettres</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Contenu du CV + description du poste</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">USA</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Stripe</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Paiement sécurisé</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Données de facturation</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">USA</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Google</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">OAuth Gmail (si connecté)</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Tokens d'accès Gmail</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">USA</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 font-medium">Vercel / Railway</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Hébergement</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">Toutes données en transit</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-600">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">8. Transferts hors Union européenne</h2>
            <p className="text-sm text-gray-600">
              Certains de nos sous-traitants sont établis aux États-Unis. Ces transferts sont encadrés par les garanties suivantes, conformément aux articles 44 à 49 du RGPD :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mt-2">
              <li><strong>Anthropic :</strong> Clauses contractuelles types (CCT) approuvées par la Commission européenne. Les données du CV sont traitées pour la seule génération de la lettre et ne sont pas utilisées pour entraîner les modèles d'Anthropic sans accord explicite.</li>
              <li><strong>Stripe :</strong> Certifié Data Privacy Framework (DPF) UE–États-Unis.</li>
              <li><strong>Google :</strong> Certifié Data Privacy Framework (DPF) UE–États-Unis.</li>
              <li><strong>Vercel / Railway :</strong> Clauses contractuelles types (CCT) applicables.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">9. Intelligence artificielle et contenu généré</h2>
            <p className="text-sm text-gray-600">
              Le contenu du CV et la description du poste fournis par l'utilisateur sont transmis à Anthropic (Claude) pour la génération des lettres de motivation. Ces données sont traitées en tant que données à caractère personnel. Elles ne sont pas utilisées par Anthropic pour l'entraînement de ses modèles dans le cadre de l'API commerciale, conformément à la politique d'utilisation des données d'Anthropic. L'utilisateur est informé que les lettres produites sont générées par IA et restent sous sa responsabilité éditoriale.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800">10. Utilisation de Gmail via Google OAuth</h2>
            <p className="text-sm text-gray-600">
              Autocandidat propose une intégration facultative avec Gmail via le protocole OAuth 2.0 de Google. Cette section décrit précisément comment les données Gmail sont utilisées, conformément aux exigences de la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google API Services User Data Policy</a>.
            </p>

            <h3 className="text-sm font-semibold text-gray-700 mt-3">Données accédées</h3>
            <p className="text-sm text-gray-600">
              Lorsque vous connectez votre compte Gmail, Autocandidat demande uniquement la permission d'<strong>envoyer des emails en votre nom</strong> (scope <code className="bg-gray-100 px-1 rounded text-xs">https://mail.google.com/</code>). Aucun email reçu, aucune pièce jointe, aucun contact et aucune donnée de votre boîte de réception ne sont lus, stockés ou traités.
            </p>

            <h3 className="text-sm font-semibold text-gray-700">Finalité exclusive</h3>
            <p className="text-sm text-gray-600">
              L'accès à Gmail est utilisé <strong>uniquement</strong> pour envoyer vos lettres de candidature depuis votre propre adresse email, à la destination que vous choisissez explicitement. Autocandidat n'envoie aucun email sans votre déclenchement volontaire.
            </p>

            <h3 className="text-sm font-semibold text-gray-700">Ce que nous ne faisons pas</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Nous ne lisons pas votre boîte de réception</li>
              <li>Nous ne stockons pas le contenu de vos emails envoyés</li>
              <li>Nous ne partageons pas vos données Gmail avec des tiers</li>
              <li>Nous n'utilisons pas vos données Gmail à des fins publicitaires</li>
              <li>Nous ne transférons pas vos données Gmail à des humains, sauf sur votre demande explicite ou obligation légale</li>
            </ul>

            <h3 className="text-sm font-semibold text-gray-700">Stockage des jetons d'accès</h3>
            <p className="text-sm text-gray-600">
              Les jetons d'accès OAuth (access token et refresh token) délivrés par Google sont stockés de manière chiffrée dans notre base de données sécurisée, uniquement sur nos serveurs. Ils ne sont jamais transmis au navigateur ni partagés avec des tiers.
            </p>

            <h3 className="text-sm font-semibold text-gray-700">Révocation de l'accès</h3>
            <p className="text-sm text-gray-600">
              Vous pouvez révoquer l'accès Gmail à tout moment de deux façons :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Depuis Autocandidat : section <strong>Comptes email → Supprimer le compte Gmail</strong></li>
              <li>Directement depuis Google : <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">myaccount.google.com/permissions</a> → rechercher "Autocandidat" → Révoquer l'accès</li>
            </ul>
            <p className="text-sm text-gray-600 mt-1">
              La révocation supprime immédiatement les jetons d'accès de nos serveurs.
            </p>

            <h3 className="text-sm font-semibold text-gray-700">Conformité Google API Services</h3>
            <p className="text-sm text-gray-600">
              L'utilisation des données obtenues via les API Google respecte la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Politique d'utilisation des données des services d'API Google</a>, y compris les exigences relatives à l'utilisation limitée (<em>Limited Use</em>).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">11. Cookies et stockage local</h2>

            <p className="text-sm text-gray-600">
              Ce site n'utilise pas de cookies de traçage ou publicitaires. La session utilisateur est maintenue via le stockage local du navigateur (localStorage), qui ne constitue pas un cookie au sens de la directive ePrivacy mais reste soumis au consentement de l'utilisateur. Aucun script d'analyse ou de mesure d'audience tiers n'est déployé à ce jour.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">12. Vos droits (RGPD)</h2>
            <p className="text-sm text-gray-600">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Rectification</strong> : corriger des données inexactes</li>
              <li><strong>Effacement</strong> : demander la suppression de vos données ("droit à l'oubli")</li>
              <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Opposition</strong> : vous opposer à un traitement fondé sur l'intérêt légitime</li>
              <li><strong>Limitation</strong> : restreindre temporairement le traitement</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Pour exercer ces droits : <a href="mailto:contact@autocandidat.fr" className="text-indigo-600 hover:underline">contact@autocandidat.fr</a>. Nous répondons sous 30 jours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-gray-800">13. Réclamation auprès de la CNIL</h2>
            <p className="text-sm text-gray-600">
              Si vous estimez que le traitement de vos données ne respecte pas le RGPD, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> — <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">www.cnil.fr</a> — ou de toute autre autorité de contrôle compétente dans votre État membre.
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
