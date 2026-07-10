import LegalLayout, { LegalSection, LegalCallout, LegalTable } from '../components/LegalLayout';

const SECTIONS = [
  { id: 'objet', label: '1. Objet' },
  { id: 'service', label: '2. Description du service' },
  { id: 'compte', label: '3. Création de compte' },
  { id: 'tarifs', label: '4. Tarification et paiement' },
  { id: 'retractation', label: '5. Droit de rétractation' },
  { id: 'remboursements', label: '6. Remboursements' },
  { id: 'resiliation', label: '7. Résiliation du compte' },
  { id: 'utilisation', label: '8. Utilisation acceptable' },
  { id: 'ia', label: '9. Intelligence artificielle' },
  { id: 'responsabilite', label: '10. Responsabilité' },
  { id: 'modifications', label: '11. Modifications des CGU' },
  { id: 'litiges', label: '12. Droit applicable et litiges' },
];

export default function CGUPage() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation et de Vente"
      lastUpdated="mars 2026"
      sections={SECTIONS}
    >
      <LegalSection id="objet" number="1" title="Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation et de Vente (CGU/CGV) régissent l'accès et
          l'utilisation de la plateforme Autocandidat, accessible à l'adresse <strong>autocandidat.fr</strong>,
          éditée par Autocandidat (Auto-entrepreneur).
        </p>
        <p>En créant un compte, l'utilisateur accepte sans réserve les présentes conditions.</p>
      </LegalSection>

      <LegalSection id="service" number="2" title="Description du service">
        <p>Autocandidat est une plateforme SaaS permettant aux candidats à l'emploi de :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Générer des lettres de motivation personnalisées par intelligence artificielle</li>
          <li>Rechercher des offres d'emploi via France Travail</li>
          <li>Suivre leurs candidatures (ATS simplifié)</li>
          <li>Envoyer des campagnes de candidatures par email depuis leur propre adresse</li>
        </ul>
        <p>
          Les lettres générées sont produites par un système d'IA (Anthropic / Claude). L'utilisateur est
          informé que ce contenu est généré automatiquement et doit faire l'objet d'une relecture avant envoi.
          Autocandidat ne garantit pas l'obtention d'entretiens ou d'emplois.
        </p>
      </LegalSection>

      <LegalSection id="compte" number="3" title="Création de compte">
        <p>
          L'accès au service nécessite la création d'un compte avec une adresse e-mail valide et un mot de
          passe. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité
          de ses identifiants. Autocandidat ne saurait être tenu responsable des accès frauduleux résultant
          d'une négligence de l'utilisateur.
        </p>
      </LegalSection>

      <LegalSection id="tarifs" number="4" title="Tarification et paiement">
        <p>Le service fonctionne sur la base de l'achat de crédits de candidatures :</p>
        <LegalTable
          head={['Offre', 'Prix TTC', 'Inclus']}
          rows={[
            ['Essai Gratuit', "0 € (à l'inscription)", 'Candidatures automatiques + lettres IA'],
            ['Forfait 80 candidatures', '19,99 € (paiement unique)', 'Candidatures automatiques + lettres IA'],
            ['Forfait 150 candidatures', '49,99 € (paiement unique)', 'Candidatures + toutes fonctionnalités avancées'],
          ]}
        />
        <p>
          Les paiements sont traités de manière sécurisée par <strong>Stripe</strong>. Autocandidat ne stocke
          aucune donnée bancaire. Les crédits achetés sont crédités immédiatement sur le compte utilisateur.
        </p>
      </LegalSection>

      <LegalSection id="retractation" number="5" title="Droit de rétractation">
        <p>
          Conformément à l'article L.221-18 du Code de la consommation, les consommateurs disposent d'un
          délai de <strong>14 jours</strong> à compter de la date d'achat pour exercer leur droit de
          rétractation, sans avoir à justifier de motifs.
        </p>
        <LegalCallout>
          <strong>Exception :</strong> conformément à l'article L.221-28, 13° du Code de la consommation, le
          droit de rétractation ne peut être exercé pour la fourniture d'un contenu numérique non fourni sur
          support matériel dont l'exécution a commencé, après accord préalable exprès du consommateur et
          renoncement exprès à son droit de rétractation. En cochant la case de consentement lors de
          l'inscription et en initiant une première génération de lettre, l'utilisateur reconnaît avoir été
          informé de cette exception et y consent expressément.
        </LegalCallout>
        <p>
          Pour exercer votre droit de rétractation (dans les cas applicables) :{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection id="remboursements" number="6" title="Remboursements">
        <p>
          Les crédits achetés (80 ou 150 candidatures) sont non remboursables une fois utilisés. En cas de
          dysfonctionnement technique avéré empêchant l'utilisation des crédits achetés, l'utilisateur peut
          contacter le support pour un remboursement au prorata ou une compensation en crédits.
        </p>
        <p>
          Tous les forfaits sont des paiements uniques, sans abonnement. Aucun prélèvement récurrent n'est
          effectué.
        </p>
      </LegalSection>

      <LegalSection id="resiliation" number="7" title="Résiliation du compte">
        <p>
          L'utilisateur peut supprimer son compte à tout moment en contactant{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
          . La suppression entraîne la perte définitive des données et crédits restants. Autocandidat se
          réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.
        </p>
      </LegalSection>

      <LegalSection id="utilisation" number="8" title="Utilisation acceptable">
        <p>Il est interdit d'utiliser Autocandidat pour :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Envoyer des messages non sollicités (spam) en masse</li>
          <li>Usurper l'identité d'une autre personne</li>
          <li>Contourner les limites techniques du service</li>
          <li>Toute utilisation contraire aux lois en vigueur</li>
        </ul>
      </LegalSection>

      <LegalSection id="ia" number="9" title="Intelligence artificielle (AI Act)">
        <p>
          Les lettres de motivation générées par Autocandidat sont produites par un système d'IA générative
          (Anthropic / Claude). Conformément au Règlement européen sur l'IA (AI Act, UE 2024/1689),
          l'utilisateur est expressément informé que :
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Le contenu est généré automatiquement par IA</li>
          <li>Les lettres produites peuvent contenir des inexactitudes et doivent être relues</li>
          <li>L'utilisateur est seul responsable du contenu envoyé aux recruteurs</li>
          <li>Autocandidat ne garantit pas la pertinence ou l'efficacité des lettres générées</li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilite" number="10" title="Responsabilité">
        <p>
          Autocandidat s'engage à fournir le service avec diligence, mais ne peut être tenu responsable des
          interruptions de service, des pertes de données liées à un cas de force majeure, ni des résultats
          des candidatures envoyées. La responsabilité d'Autocandidat est limitée au montant payé par
          l'utilisateur au cours des 12 derniers mois.
        </p>
      </LegalSection>

      <LegalSection id="modifications" number="11" title="Modifications des CGU">
        <p>
          Autocandidat se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés
          par email ou via une notification dans l'application. La poursuite de l'utilisation du service
          après modification vaut acceptation des nouvelles conditions.
        </p>
      </LegalSection>

      <LegalSection id="litiges" number="12" title="Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera
          recherchée en priorité. À défaut, le litige sera porté devant les tribunaux compétents du ressort
          du siège social d'Autocandidat, sauf disposition légale contraire applicable aux consommateurs.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
