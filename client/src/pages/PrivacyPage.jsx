import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection, LegalSubsection, LegalTable } from '../components/LegalLayout';

const SECTIONS = [
  { id: 'responsable', label: '1. Responsable du traitement' },
  { id: 'dpo', label: '2. Délégué à la protection des données' },
  { id: 'collecte', label: '3. Données collectées' },
  { id: 'finalites', label: '4. Finalités du traitement' },
  { id: 'base-legale', label: '5. Base légale' },
  { id: 'conservation', label: '6. Durée de conservation' },
  { id: 'sous-traitants', label: '7. Sous-traitants et destinataires' },
  { id: 'transferts', label: '8. Transferts hors UE' },
  { id: 'ia', label: '9. IA et contenu généré' },
  { id: 'gmail', label: '10. Gmail via Google OAuth' },
  { id: 'cookies', label: '11. Cookies et mesure d’audience' },
  { id: 'droits', label: '12. Vos droits (RGPD)' },
  { id: 'cnil', label: '13. Réclamation auprès de la CNIL' },
];

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" lastUpdated="juillet 2026" sections={SECTIONS}>
      <LegalSection id="responsable" number="1" title="Responsable du traitement">
        <p>
          <strong>Autocandidat</strong> — Auto-entrepreneur<br />
          E-mail :{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection id="dpo" number="2" title="Délégué à la Protection des Données (DPO)">
        <p>
          Aucun DPO n'a été désigné à ce stade. Si le volume de traitement de données à caractère personnel
          venait à atteindre un seuil systématique ou à grande échelle, une désignation sera effectuée
          conformément à l'article 37 du RGPD et notifiée à la CNIL. Pour toute question relative à la
          protection des données :{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection id="collecte" number="3" title="Données collectées">
        <ul className="list-disc list-inside space-y-1">
          <li>Nom, adresse e-mail et mot de passe (inscription)</li>
          <li>Contenu textuel du CV (extrait du PDF pour la génération de lettres)</li>
          <li>Comptes email connectés (Gmail OAuth ou identifiants SMTP)</li>
          <li>Historique des candidatures, campagnes et lettres générées</li>
          <li>Logs d'utilisation (génération de lettres, envois d'emails)</li>
          <li>Données de paiement (gérées exclusivement par Stripe — non stockées par Autocandidat)</li>
        </ul>
      </LegalSection>

      <LegalSection id="finalites" number="4" title="Finalités du traitement">
        <ul className="list-disc list-inside space-y-1">
          <li>Fourniture du service (génération de lettres personnalisées par IA, envoi de candidatures)</li>
          <li>Authentification et sécurité du compte</li>
          <li>Amélioration de la qualité du service</li>
          <li>Facturation et gestion des achats de crédits (via Stripe)</li>
        </ul>
      </LegalSection>

      <LegalSection id="base-legale" number="5" title="Base légale">
        <p>
          Le traitement est fondé sur l'exécution du contrat (CGU) auquel l'utilisateur est partie (art.
          6.1.b RGPD), et sur le consentement explicite de l'utilisateur pour les communications optionnelles
          (art. 6.1.a RGPD).
        </p>
      </LegalSection>

      <LegalSection id="conservation" number="6" title="Durée de conservation">
        <p>
          Les données sont conservées pendant toute la durée d'activité du compte, puis supprimées dans un
          délai de 30 jours suivant la clôture du compte, sauf obligations légales contraires (ex. :
          conservation des données de facturation pendant 10 ans).
        </p>
      </LegalSection>

      <LegalSection id="sous-traitants" number="7" title="Sous-traitants et destinataires">
        <p>
          Les données ne sont pas vendues. Elles peuvent être transmises aux sous-traitants suivants dans le
          cadre strict de la fourniture du service :
        </p>
        <LegalTable
          head={['Sous-traitant', 'Rôle', 'Données transmises', 'Pays']}
          rows={[
            ['Anthropic', 'Génération IA des lettres', 'Contenu du CV + description du poste', 'USA'],
            ['Stripe', 'Paiement sécurisé', 'Données de facturation', 'USA'],
            ['Google', 'OAuth Gmail (si connecté)', "Tokens d'accès Gmail", 'USA'],
            ['Vercel / Railway', 'Hébergement', 'Toutes données en transit', 'USA'],
            ['Resend', "Envoi d'email de secours (si aucun compte email connecté)", 'Adresse et contenu des emails envoyés', 'USA'],
            ['ip-api.com', 'Géolocalisation approximative (ville/pays) à des fins de statistiques internes', 'Adresse IP', 'Non communiqué'],
          ]}
        />
      </LegalSection>

      <LegalSection id="transferts" number="8" title="Transferts hors Union européenne">
        <p>
          Certains de nos sous-traitants sont établis aux États-Unis. Ces transferts sont encadrés par les
          garanties suivantes, conformément aux articles 44 à 49 du RGPD :
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Anthropic :</strong> Clauses contractuelles types (CCT) approuvées par la Commission européenne. Les données du CV sont traitées pour la seule génération de la lettre et ne sont pas utilisées pour entraîner les modèles d'Anthropic sans accord explicite.</li>
          <li><strong>Stripe :</strong> Certifié Data Privacy Framework (DPF) UE–États-Unis.</li>
          <li><strong>Google :</strong> Certifié Data Privacy Framework (DPF) UE–États-Unis.</li>
          <li><strong>Vercel / Railway :</strong> Clauses contractuelles types (CCT) applicables.</li>
          <li><strong>Resend :</strong> Clauses contractuelles types (CCT) applicables.</li>
          <li><strong>ip-api.com :</strong> Service utilisé uniquement pour convertir une adresse IP en ville/pays ; l'adresse IP n'est pas conservée après ce calcul.</li>
        </ul>
      </LegalSection>

      <LegalSection id="ia" number="9" title="Intelligence artificielle et contenu généré">
        <p>
          Le contenu du CV et la description du poste fournis par l'utilisateur sont transmis à Anthropic
          (Claude) pour la génération des lettres de motivation. Ces données sont traitées en tant que
          données à caractère personnel. Elles ne sont pas utilisées par Anthropic pour l'entraînement de ses
          modèles dans le cadre de l'API commerciale, conformément à la politique d'utilisation des données
          d'Anthropic. L'utilisateur est informé que les lettres produites sont générées par IA et restent
          sous sa responsabilité éditoriale.
        </p>
      </LegalSection>

      <LegalSection id="gmail" number="10" title="Utilisation de Gmail via Google OAuth">
        <p>
          Autocandidat propose une intégration facultative avec Gmail via le protocole OAuth 2.0 de Google.
          Cette section décrit précisément comment les données Gmail sont utilisées, conformément aux
          exigences de la{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
            Google API Services User Data Policy
          </a>.
        </p>

        <LegalSubsection title="Données accédées">
          <p>
            Lorsque vous connectez votre compte Gmail, Autocandidat demande uniquement la permission
            d'<strong>envoyer des emails en votre nom</strong> (scope{' '}
            <code className="px-1 rounded text-xs" style={{ backgroundColor: '#7395AE20' }}>https://mail.google.com/</code>
            ). Aucun email reçu, aucune pièce jointe, aucun contact et aucune donnée de votre boîte de
            réception ne sont lus, stockés ou traités.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Finalité exclusive">
          <p>
            L'accès à Gmail est utilisé <strong>uniquement</strong> pour envoyer vos lettres de candidature
            depuis votre propre adresse email, à la destination que vous choisissez explicitement.
            Autocandidat n'envoie aucun email sans votre déclenchement volontaire.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Ce que nous ne faisons pas">
          <ul className="list-disc list-inside space-y-1">
            <li>Nous ne lisons pas votre boîte de réception</li>
            <li>Nous ne stockons pas le contenu de vos emails envoyés</li>
            <li>Nous ne partageons pas vos données Gmail avec des tiers</li>
            <li>Nous n'utilisons pas vos données Gmail à des fins publicitaires</li>
            <li>Nous ne transférons pas vos données Gmail à des humains, sauf sur votre demande explicite ou obligation légale</li>
          </ul>
        </LegalSubsection>

        <LegalSubsection title="Stockage des jetons d'accès">
          <p>
            Les jetons d'accès OAuth (access token et refresh token) délivrés par Google sont stockés de
            manière chiffrée dans notre base de données sécurisée, uniquement sur nos serveurs. Ils ne sont
            jamais transmis au navigateur ni partagés avec des tiers.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Révocation de l'accès">
          <p>Vous pouvez révoquer l'accès Gmail à tout moment de deux façons :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Depuis Autocandidat : section <strong>Comptes email → Supprimer le compte Gmail</strong></li>
            <li>
              Directement depuis Google :{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
                myaccount.google.com/permissions
              </a>{' '}
              → rechercher "Autocandidat" → Révoquer l'accès
            </li>
          </ul>
          <p>La révocation supprime immédiatement les jetons d'accès de nos serveurs.</p>
        </LegalSubsection>

        <LegalSubsection title="Conformité Google API Services">
          <p>
            L'utilisation des données obtenues via les API Google respecte la{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
              Politique d'utilisation des données des services d'API Google
            </a>
            , y compris les exigences relatives à l'utilisation limitée (<em>Limited Use</em>).
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="cookies" number="11" title="Cookies, stockage local et mesure d'audience">
        <p>
          Pour le détail complet des cookies utilisés, du stockage local et de la mesure d'audience,
          consultez notre{' '}
          <Link to="/cookies" className="hover:underline" style={{ color: '#557A95' }}>politique de cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection id="droits" number="12" title="Vos droits (RGPD)">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Rectification</strong> : corriger des données inexactes</li>
          <li><strong>Effacement</strong> : demander la suppression de vos données ("droit à l'oubli")</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Opposition</strong> : vous opposer à un traitement fondé sur l'intérêt légitime</li>
          <li><strong>Limitation</strong> : restreindre temporairement le traitement</li>
        </ul>
        <p>
          Pour exercer ces droits :{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
          . Nous répondons sous 30 jours.
        </p>
      </LegalSection>

      <LegalSection id="cnil" number="13" title="Réclamation auprès de la CNIL">
        <p>
          Si vous estimez que le traitement de vos données ne respecte pas le RGPD, vous pouvez introduire
          une réclamation auprès de la <strong>CNIL</strong> —{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
            www.cnil.fr
          </a>{' '}
          — ou de toute autre autorité de contrôle compétente dans votre État membre.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
