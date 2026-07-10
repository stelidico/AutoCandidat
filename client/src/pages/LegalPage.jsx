import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import LegalLayout, { LegalSection } from '../components/LegalLayout';

const SECTIONS = [
  { id: 'editeur', label: '1. Éditeur du site' },
  { id: 'hebergement', label: '2. Hébergement' },
  { id: 'propriete', label: '3. Propriété intellectuelle' },
  { id: 'ia', label: '4. Intelligence artificielle' },
  { id: 'responsabilite', label: '5. Limitation de responsabilité' },
  { id: 'donnees', label: '6. Données personnelles' },
  { id: 'cgu', label: "7. Conditions d'utilisation" },
  { id: 'juridiction', label: '8. Droit applicable et juridiction' },
];

function Placeholder({ value, fallback }) {
  if (value) return <span>{value}</span>;
  return <span className="italic" style={{ color: '#8a6410' }}>{fallback}</span>;
}

export default function LegalPage() {
  const [s, setS] = useState({});
  useEffect(() => { api.get('/settings').then(r => setS(r.data)).catch(() => {}); }, []);

  return (
    <LegalLayout title="Mentions légales" lastUpdated="mars 2026" sections={SECTIONS}>
      <LegalSection id="editeur" number="1" title="Éditeur du site">
        <p>
          <strong>Dénomination sociale :</strong> Autocandidat<br />
          <strong>Forme juridique :</strong> Auto-entrepreneur<br />
          <strong>Adresse postale :</strong>{' '}
          <Placeholder value={s.legal_address} fallback="[À compléter dans les paramètres admin]" /><br />
          <strong>E-mail :</strong>{' '}
          <a href="mailto:contact@autocandidat.fr" className="hover:underline" style={{ color: '#557A95' }}>
            contact@autocandidat.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection id="hebergement" number="2" title="Hébergement">
        <p>
          <strong>Frontend :</strong> Vercel Inc., 340 Pine Street Suite 1502, San Francisco, CA 94104,
          États-Unis<br />
          Site :{' '}
          <a href="https://vercel.com" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
            vercel.com
          </a>
        </p>
        <p>
          <strong>Backend :</strong> Railway Corp., San Francisco, CA, États-Unis<br />
          Site :{' '}
          <a href="https://railway.app" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#557A95' }}>
            railway.app
          </a>
        </p>
      </LegalSection>

      <LegalSection id="propriete" number="3" title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus présents sur ce site (textes, visuels, code source) est la propriété
          exclusive d'Autocandidat, sauf mention contraire. Toute reproduction, représentation, modification,
          publication ou adaptation, totale ou partielle, est strictement interdite sans autorisation écrite
          préalable de l'éditeur.
        </p>
      </LegalSection>

      <LegalSection id="ia" number="4" title="Intelligence artificielle">
        <p>
          Les lettres de motivation générées par ce service sont produites par un système d'intelligence
          artificielle (Anthropic / Claude). Conformément au Règlement européen sur l'IA (AI Act, UE
          2024/1689), l'utilisateur est informé que le contenu généré est le produit d'un système d'IA.
          L'utilisateur demeure responsable de la relecture, modification et utilisation de ce contenu.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" number="5" title="Limitation de responsabilité">
        <p>
          Autocandidat s'efforce d'assurer la disponibilité et la précision du service, mais ne peut garantir
          l'exhaustivité ou l'actualité des informations. Les lettres générées par IA ont une valeur
          indicative et ne constituent pas un conseil professionnel. L'utilisation du service se fait sous la
          seule responsabilité de l'utilisateur.
        </p>
      </LegalSection>

      <LegalSection id="donnees" number="6" title="Données personnelles">
        <p>
          Pour toute information sur le traitement de vos données personnelles, consultez notre{' '}
          <Link to="/privacy" className="hover:underline" style={{ color: '#557A95' }}>politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection id="cgu" number="7" title="Conditions d'utilisation">
        <p>
          L'utilisation du service est soumise à nos{' '}
          <Link to="/cgu" className="hover:underline" style={{ color: '#557A95' }}>
            Conditions Générales d'Utilisation et de Vente
          </Link>.
        </p>
      </LegalSection>

      <LegalSection id="juridiction" number="8" title="Droit applicable et juridiction">
        <p>
          Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera porté
          devant les tribunaux compétents du ressort du siège social de l'éditeur, sauf disposition légale
          contraire.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
