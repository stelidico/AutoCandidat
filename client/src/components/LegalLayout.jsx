import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from './PublicHeader';

// Habillage partagé par les pages légales (CGU, Confidentialité, Mentions légales,
// Cookies) : sommaire à ancres avec suivi de défilement (scrollspy), au lieu
// d'une simple liste de sections sans navigation.
export default function LegalLayout({ title, lastUpdated, sections, children }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveId(top.target.id);
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1ef' }}>
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">

        {/* Sommaire — repliable sur mobile */}
        <details className="lg:hidden mb-6 rounded-xl border" style={{ borderColor: '#d5cdc9', backgroundColor: 'white' }}>
          <summary className="px-4 py-3 text-sm font-semibold cursor-pointer select-none" style={{ color: '#379683' }}>
            Sommaire
          </summary>
          <nav className="px-4 pb-3 flex flex-col gap-1">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm py-1" style={{ color: '#5D5C61' }}>{s.label}</a>
            ))}
          </nav>
        </details>

        {/* Sommaire desktop — collant, suit le défilement */}
        <nav className="hidden lg:block sticky top-8 self-start h-fit max-h-[80vh] overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#7395AE' }}>Sommaire</p>
          <ul className="space-y-0.5 border-l" style={{ borderColor: '#d5cdc9' }}>
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block pl-3 py-1 text-sm -ml-px border-l-2 transition-colors leading-snug"
                  style={{
                    borderColor: activeId === s.id ? '#557A95' : 'transparent',
                    color: activeId === s.id ? '#557A95' : '#7395AE',
                    fontWeight: activeId === s.id ? 600 : 400,
                  }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenu */}
        <div className="min-w-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-3" style={{ color: '#1C1C1E' }}>{title}</h1>
            <span
              className="inline-block text-xs font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: '#7395AE25', color: '#557A95' }}
            >
              Dernière mise à jour : {lastUpdated}
            </span>
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-8 space-y-10"
            style={{ borderColor: '#d5cdc9', backgroundColor: 'white' }}
          >
            {children}
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm hover:underline" style={{ color: '#7395AE' }}>← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section numérotée (reprend le motif "01 / 02 / 03" déjà utilisé sur la landing page).
export function LegalSection({ id, number, title, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: '96px' }} className="space-y-3">
      <h2 className="flex items-center gap-3 text-lg font-bold" style={{ color: '#379683' }}>
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
          style={{ backgroundColor: '#37968320', color: '#379683' }}
        >
          {number}
        </span>
        {title}
      </h2>
      <div className="pl-10 text-sm leading-relaxed space-y-3" style={{ color: '#5D5C61' }}>
        {children}
      </div>
    </section>
  );
}

// Sous-section (ex : rubriques internes à "Gmail via Google OAuth")
export function LegalSubsection({ title, children }) {
  return (
    <div className="space-y-1.5 pt-1">
      <h3 className="text-sm font-semibold" style={{ color: '#557A95' }}>{title}</h3>
      {children}
    </div>
  );
}

// Encart pour un point d'attention (droit de rétractation, exception, etc.)
export function LegalCallout({ children }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm"
      style={{ backgroundColor: '#B1A29622', borderLeft: '3px solid #557A95', color: '#5D5C61' }}
    >
      {children}
    </div>
  );
}

// Table restylée avec la palette du site (remplace les bordures grises brutes)
export function LegalTable({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#d5cdc9' }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ backgroundColor: '#7395AE18' }}>
            {head.map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: '#557A95' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #d5cdc9' }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top" style={{ color: j === 0 ? '#1C1C1E' : '#5D5C61', fontWeight: j === 0 ? 600 : 400 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
