import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection, LegalTable } from '../components/LegalLayout';

const SECTIONS = [
  { id: 'definition', label: "1. Qu'est-ce qu'un cookie ?" },
  { id: 'necessaire', label: '2. Cookie strictement nécessaire' },
  { id: 'localstorage', label: '3. Stockage local du navigateur' },
  { id: 'audience', label: "4. Mesure d'audience" },
  { id: 'pixel', label: "5. Pixel de suivi d'email (Premium)" },
  { id: 'ce-que-nous-ne-faisons-pas', label: '6. Ce que nous ne faisons pas' },
  { id: 'preferences', label: '7. Gérer vos préférences' },
  { id: 'plus-infos', label: "8. Plus d'informations" },
];

export default function CookiesPage() {
  return (
    <LegalLayout title="Politique de cookies" lastUpdated="juillet 2026" sections={SECTIONS}>
      <LegalSection id="definition" number="1" title="Qu'est-ce qu'un cookie ?">
        <p>
          Un cookie est un petit fichier texte déposé par un site web dans votre navigateur. Il peut servir à
          mémoriser une session de connexion, des préférences, ou à mesurer l'audience d'un site. Cette page
          détaille précisément ce qu'Autocandidat dépose ou non sur votre appareil.
        </p>
      </LegalSection>

      <LegalSection id="necessaire" number="2" title="Cookie strictement nécessaire (authentification)">
        <p>Autocandidat dépose un unique cookie technique, indispensable au fonctionnement du service :</p>
        <LegalTable
          head={['Nom', 'Finalité', 'Durée', 'Type']}
          rows={[
            ['token', 'Maintient votre session connectée (authentification)', '7 jours', 'HttpOnly, non lisible par du code tiers'],
          ]}
        />
        <p>
          Ce cookie étant strictement nécessaire au fonctionnement du service (vous garder connecté), il est
          exempté de consentement au titre de l'article 82 de la loi Informatique et Libertés / directive
          ePrivacy.
        </p>
      </LegalSection>

      <LegalSection id="localstorage" number="3" title="Stockage local du navigateur (localStorage)">
        <p>
          Autocandidat utilise le stockage local de votre navigateur (localStorage) — techniquement distinct
          d'un cookie — pour conserver localement, sur votre appareil uniquement : le brouillon de votre CV
          et de vos lettres en cours de rédaction, vos préférences (secteur, ton), et votre choix concernant
          la bannière de consentement. Ces données ne sont jamais transmises à un tiers et restent sur votre
          appareil jusqu'à ce que vous les effaciez.
        </p>
      </LegalSection>

      <LegalSection id="audience" number="4" title="Mesure d'audience">
        <p>
          Aucun cookie n'est utilisé à cette fin. À la place, chaque page consultée déclenche un
          enregistrement anonymisé (URL visitée, référent) associé à une géolocalisation approximative de
          l'adresse IP, réalisée via le service tiers <strong>ip-api.com</strong>. L'adresse IP elle-même
          n'est pas conservée : seule la ville/le pays qui en est déduit est stocké, à des fins de
          statistiques internes de fréquentation.
        </p>
        <p>
          Ce traitement est fondé sur notre intérêt légitime à mesurer l'audience du service (art. 6.1.f
          RGPD). Vous pouvez vous y opposer à tout moment en nous contactant à{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>.
        </p>
      </LegalSection>

      <LegalSection id="pixel" number="5" title="Pixel de suivi d'ouverture d'email (forfait Premium)">
        <p>
          Pour les utilisateurs du forfait Premium, un pixel de suivi est inséré dans les emails de
          candidature <strong>envoyés par vous</strong> via le service, afin de détecter si le destinataire
          (le recruteur) a ouvert l'email — utile pour déclencher une relance automatique. Ce mécanisme ne
          concerne pas votre propre messagerie et n'est pas un cookie déposé sur votre navigateur.
        </p>
      </LegalSection>

      <LegalSection id="ce-que-nous-ne-faisons-pas" number="6" title="Ce que nous ne faisons pas">
        <ul className="list-disc list-inside space-y-1">
          <li>Aucun cookie publicitaire ou de traçage cross-site (Google Ads, Facebook Pixel, etc.)</li>
          <li>Aucune revente de données de navigation à des tiers</li>
          <li>Aucun outil de mesure d'audience tiers (type Google Analytics) déployé à ce jour</li>
        </ul>
      </LegalSection>

      <LegalSection id="preferences" number="7" title="Gérer vos préférences">
        <p>
          Le cookie d'authentification étant strictement nécessaire, il n'existe pas de bandeau de refus pour
          celui-ci : vous pouvez à tout moment vous déconnecter pour le faire expirer, ou le supprimer
          manuellement via les réglages de votre navigateur (ce qui vous déconnectera). Pour la mesure
          d'audience par géolocalisation IP, voir la section 4 ci-dessus pour vous y opposer.
        </p>
      </LegalSection>

      <LegalSection id="plus-infos" number="8" title="Plus d'informations">
        <p>
          Pour le détail complet du traitement de vos données personnelles, consultez notre{' '}
          <Link to="/privacy" className="hover:underline" style={{ color: '#557A95' }}>politique de confidentialité</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
