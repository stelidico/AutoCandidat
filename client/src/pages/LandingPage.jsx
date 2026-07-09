import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Logo from '../components/Logo';

// Palette : #5D5C61 texte | #379683 titres H2/H3 | #7395AE décoratif | #557A95 boutons | #B1A296 fonds

const FEATURES = [
  { icon: '✦', title: 'Lettre IA en 30 secondes', desc: 'Notre IA analyse votre CV et l\'offre pour générer une lettre personnalisée, sans formules génériques.' },
  { icon: '🔍', title: 'Recherche d\'offres intégrée', desc: 'Accédez à des milliers d\'offres France Travail en temps réel, avec un score de matching basé sur votre profil.' },
  { icon: '📋', title: 'Suivi des candidatures', desc: 'Gérez votre pipeline de candidatures avec des statuts clairs : Envoyée → Entretien → Acceptée.' },
  { icon: '✉', title: 'Campagnes d\'envoi email', desc: 'Envoyez vos candidatures en masse depuis votre propre adresse email, avec votre compte Gmail ou SMTP.' },
  { icon: '📊', title: 'Score de matching CV', desc: 'Comparez votre profil à chaque offre et identifiez en un coup d\'œil les postes qui correspondent le mieux.' },
  { icon: '🎯', title: 'Personnalisation du ton', desc: 'Choisissez parmi 4 tons (Professionnel, Formel, Dynamique, Chaleureux) et régénérez à volonté.' },
];

const STEPS = [
  { num: '01', title: 'Importez votre CV', desc: 'Glissez votre PDF ou collez le texte. Notre IA extrait et analyse votre profil en quelques secondes.' },
  { num: '02', title: 'Trouvez l\'offre', desc: 'Recherchez parmi des milliers d\'offres France Travail ou collez directement la description du poste.' },
  { num: '03', title: 'Candidatez', desc: 'Générez votre lettre, envoyez-la, et suivez l\'avancement de toutes vos candidatures.' },
];

const SUCCESS_STATS = [
  { value: '30s', label: 'Lettre générée', sub: 'personnalisée par l\'IA' },
  { value: '3×', label: 'Plus de candidatures', sub: 'objectif atteignable chaque semaine' },
  { value: '0€', label: 'Sans abonnement', sub: 'paiement unique, sans engagement' },
  { value: '7j', label: 'Satisfait ou remboursé', sub: 'garantie sans conditions' },
];

const PLANS = [
  {
    name: 'Essai Gratuit',
    price: '0€',
    period: 'à l\'inscription',
    featured: false,
    badge: null,
    features: ['10 candidatures automatiques', 'Lettre personnalisée par l\'IA', 'Entreprises sélectionnées par l\'IA', 'Envoi avec ton adresse mail', 'Sans engagement'],
    cta: 'Commencer gratuitement',
    href: '/register',
  },
  {
    name: 'Forfait 19,99€',
    price: '19,99€',
    period: 'paiement unique',
    featured: true,
    badge: 'Meilleure valeur',
    features: ['80 candidatures automatiques', 'Lettre personnalisée par l\'IA', 'Entreprises sélectionnées par l\'IA', 'Envoi avec ton adresse mail', 'Suivi des candidatures', 'Sans engagement'],
    cta: 'Commencer — 19,99€',
    href: '/register',
  },
  {
    name: 'Forfait 49,99€',
    price: '49,99€',
    period: 'paiement unique',
    featured: false,
    badge: null,
    features: ['150 candidatures automatiques', 'Lettre personnalisée par l\'IA', 'Envoi avec ton adresse mail', 'Visualisation des liens de chaque offre', 'Suivi ouverture par le recruteur', 'Relance automatique 7 jours', 'Support prioritaire', 'Sans engagement'],
    cta: 'Commencer — 49,99€',
    href: '/register',
  },
];

const FAQS = [
  { q: 'Comment fonctionne la génération de lettre ?', a: 'Notre IA analyse votre CV et la description du poste pour créer une lettre personnalisée. Elle met en avant vos compétences pertinentes, utilise des mots-clés ATS et adapte le ton selon vos préférences.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Votre CV et vos lettres sont stockés de façon chiffrée. Nous ne partageons jamais vos données avec des tiers. Vous pouvez supprimer votre compte et toutes vos données à tout moment.' },
  { q: 'Faut-il un abonnement pour commencer ?', a: 'Non. Vous commencez avec 10 candidatures gratuites à l\'inscription. Ensuite, achetez uniquement des crédits selon vos besoins (19,99€ pour 80 candidatures, 49,99€ pour 150 avec toutes les fonctionnalités avancées). Pas d\'abonnement imposé, sans engagement.' },
  { q: 'Puis-je envoyer des candidatures depuis ma propre adresse email ?', a: 'Oui. Vous pouvez connecter votre compte Gmail via OAuth ou configurer un compte SMTP (Orange, SFR, Outlook...) pour envoyer vos candidatures depuis votre propre adresse.' },
  { q: 'Les lettres sont-elles vraiment personnalisées ?', a: 'Oui. Chaque lettre est générée en combinant vos expériences, vos compétences spécifiques et les exigences de l\'offre. Vous pouvez ensuite l\'éditer, changer le ton ou demander une réécriture.' },
  { q: 'Dans quelles langues la lettre peut-elle être générée ?', a: 'La lettre est générée en français par défaut. Vous pouvez demander une version en anglais ou dans une autre langue en ajoutant une instruction lors de la génération (ex : "Rédige la lettre en anglais").' },
  { q: 'Puis-je modifier la lettre générée ?', a: 'Oui, vous pouvez éditer directement le texte ou demander une réécriture avec une instruction précise (ex : "Sois plus enthousiaste", "Mentionne mes 5 ans d\'expérience"). Vous pouvez régénérer à volonté.' },
  { q: 'Que se passe-t-il si je n\'utilise pas tous mes crédits ?', a: 'Vos crédits ne sont pas limités dans le temps. Ils restent disponibles indéfiniment sur votre compte, sans date d\'expiration.' },
  { q: 'Y a-t-il une garantie de remboursement ?', a: 'Oui. Si vous n\'êtes pas satisfait dans les 7 jours suivant votre achat, contactez-nous à contact@autocandidat.fr et nous vous rembourserons intégralement, sans questions.' },
];

// ─── Composants ───────────────────────────────────────────────────────────────

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: '#379683' }} className="text-sm">★</span>
      ))}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderColor: '#7395AE' }} className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? '#B1A296' + '20' : 'white' }}
      >
        <span style={{ color: '#5D5C61' }} className="font-medium text-sm">{q}</span>
        <span style={{ color: '#7395AE' }} className={`text-lg transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div style={{ borderColor: '#7395AE', color: '#5D5C61' }} className="px-5 pb-4 text-sm leading-relaxed border-t">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', text: '', stars: 5 });
  const [formState, setFormState] = useState(null);

  const fetchTestimonials = () => {
    fetch('/api/testimonials')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setTestimonials(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTestimonials();
    const onVisible = () => { if (document.visibilityState === 'visible') fetchTestimonials(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && showForm) setForm(f => ({ ...f, name: user.name || '' }));
  }, [user, showForm]);

  const submitReview = async (e) => {
    e.preventDefault();
    setFormState('sending');
    try {
      await api.post('/testimonials', form);
      setFormState('sent');
      setShowForm(false);
    } catch {
      setFormState('error');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#5D5C61' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size={28} textColor="white" />
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#B1A296' }}>
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/cgu" className="hover:text-white transition-colors">CGU/CGV</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app"
                className="px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: '#557A95' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4a6a82'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#557A95'}
              >
                Mon espace →
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                  style={{ color: '#B1A296' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = '#B1A296'}
                >
                  Connexion
                </Link>
                <Link to="/register"
                  className="px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#557A95' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4a6a82'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#557A95'}
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 pb-20 px-4" style={{ backgroundColor: '#B1A296' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">

          {/* Colonne texte */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge IA */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full mb-4"
              style={{ backgroundColor: '#7395AE', color: 'white' }}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Propulsé par l'IA · et des bases de données intégrées
            </div>

            {/* Logos sources */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              {/* France Travail */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#003189"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">FT</text></svg>
                <span className="text-xs font-semibold" style={{ color: '#003189' }}>France Travail</span>
              </div>
              {/* Adzuna */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#E8F500"/><text x="16" y="22" textAnchor="middle" fill="#222" fontSize="10" fontWeight="bold" fontFamily="Arial">AZ</text></svg>
                <span className="text-xs font-semibold text-gray-700">Adzuna</span>
              </div>
              {/* Indeed */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#2164F3"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">in</text></svg>
                <span className="text-xs font-semibold text-gray-700">Indeed</span>
              </div>
              {/* Monster */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#6D1FDC"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">M</text></svg>
                <span className="text-xs font-semibold text-gray-700">Monster</span>
              </div>
              {/* Jooble */}
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#F97316"/><text x="16" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">J</text></svg>
                <span className="text-xs font-semibold text-gray-700">Jooble</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold leading-tight mb-6" style={{ color: '#1C1C1E' }}>
              Candidatez{' '}
              <span style={{ color: '#3D6B7D' }}>intelligemment</span>
              ,<br />décrochez vos entretiens
            </h1>

            <p className="text-lg max-w-2xl mb-8 leading-relaxed" style={{ color: '#2C2C2E' }}>
              Autocandidat génère des lettres de motivation personnalisées en 30 secondes,
              recherche des offres d'emploi et suit vos candidatures — tout en un seul endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to={user ? '/app' : '/register'}
                className="px-7 py-3.5 text-white font-bold rounded-xl transition-colors text-base shadow-lg"
                style={{ backgroundColor: '#3D6B7D', boxShadow: '0 4px 14px rgba(61,107,125,0.5)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2d5566'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3D6B7D'}
              >
                {user ? 'Accéder à mon espace →' : 'Voir les forfaits →'}
              </Link>
              <a href="#features"
                className="px-7 py-3.5 font-semibold rounded-xl transition-colors border-2 text-base"
                style={{ backgroundColor: 'white', color: '#1C1C1E', borderColor: '#1C1C1E' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1C1C1E'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#1C1C1E'; }}
              >
                Voir les fonctionnalités
              </a>
            </div>

            <p className="text-xs mt-4 font-medium" style={{ color: '#2C2C2E' }}>Sans engagement · Paiement unique</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mt-10 mx-auto lg:mx-0">
              {[
                { n: '10 000+', l: 'lettres générées' },
                { n: '94%', l: 'taux de satisfaction' },
                { n: '30s', l: 'par lettre' },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#1C1C1E' }}>{s.n}</div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: '#2C2C2E' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne vidéo */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '3px solid rgba(255,255,255,0.3)' }}>
              <video
                src="/Autocandidat.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto block"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#379683' }}>Tout ce dont vous avez besoin</h2>
            <p style={{ color: '#5D5C61' }}>Une plateforme complète pour optimiser votre recherche d'emploi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border transition-colors"
                style={{ borderColor: '#7395AE' + '40' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#7395AE'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#7395AE' + '40'}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
                  style={{ backgroundColor: '#7395AE' + '25' }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#379683' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5D5C61' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#B1A296' + '30' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#379683' }}>Postulez en 3 étapes</h2>
            <p style={{ color: '#5D5C61' }}>Simple, rapide, efficace.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 text-white rounded-2xl flex items-center justify-center font-bold text-sm mx-auto mb-4"
                  style={{ backgroundColor: '#557A95' }}>
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: '#379683' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5D5C61' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-4" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#379683' }}>Pourquoi choisir Autocandidat ?</h2>
            <p style={{ color: '#5D5C61' }}>Des outils concrets pour candidater plus vite et mieux.</p>
          </div>

          {/* Statistiques de réussite */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            {SUCCESS_STATS.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl" style={{ backgroundColor: '#7395AE' + '18' }}>
                <div className="text-3xl font-bold mb-1" style={{ color: '#557A95' }}>{s.value}</div>
                <div className="text-sm font-medium" style={{ color: '#5D5C61' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#7395AE' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mb-12" style={{ color: '#7395AE' }}>Fonctionnalités mesurées · Garanties contractuelles · Résultats selon profil et secteur</p>

          {/* Témoignages */}
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <div key={t.id || t.name} className="p-5 rounded-2xl border flex flex-col gap-3 transition-colors"
                  style={{ borderColor: '#7395AE' + '50' }}>
                  <div className="flex items-center justify-between">
                    <Stars count={t.stars} />
                    <span className="text-xs" style={{ color: '#7395AE' }}>{t.date}</span>
                  </div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: '#5D5C61' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: '#7395AE' + '30' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: '#7395AE' + '25', color: '#557A95' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#5D5C61' }}>{t.name}</div>
                      <div className="text-xs" style={{ color: '#7395AE' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm py-8" style={{ color: '#7395AE' }}>Aucun avis pour le moment. Soyez le premier !</p>
          )}

          {/* Bouton / formulaire avis */}
          <div className="mt-10 text-center">
            {formState === 'sent' && (
              <p className="text-sm font-medium" style={{ color: '#379683' }}>Merci ! Votre avis est en attente de modération.</p>
            )}
            {!showForm && formState !== 'sent' && (
              user ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border transition-colors"
                  style={{ borderColor: '#557A95', color: '#557A95' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#557A95'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#557A95'; }}
                >
                  Laisser un avis
                </button>
              ) : (
                <Link to="/login" className="text-sm hover:underline" style={{ color: '#557A95' }}>
                  Connectez-vous pour laisser un avis
                </Link>
              )
            )}
            {showForm && (
              <form onSubmit={submitReview} className="mt-6 max-w-lg mx-auto text-left bg-white border rounded-2xl p-6 space-y-4"
                style={{ borderColor: '#7395AE' + '60' }}>
                <h3 className="text-base font-semibold" style={{ color: '#379683' }}>Votre avis</h3>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Note</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, stars: n }))}
                        className="text-2xl transition-colors"
                        style={{ color: n <= form.stars ? '#379683' : '#ccc' }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Prénom Nom</label>
                  <input type="text" required maxLength={60} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex : Sophie M."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#7395AE', '--tw-ring-color': '#557A95' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Poste / Ville <span style={{ color: '#7395AE' }}>(optionnel)</span></label>
                  <input type="text" maxLength={80} value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="Ex : Développeur web, Paris"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#7395AE' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#5D5C61' }}>Votre témoignage</label>
                  <textarea required minLength={20} maxLength={500} rows={4} value={form.text}
                    onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="Décrivez votre expérience avec Autocandidat…"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: '#7395AE' }} />
                </div>
                {formState === 'error' && <p className="text-xs text-red-500">Une erreur est survenue, réessayez.</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={formState === 'sending'}
                    className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                    style={{ backgroundColor: '#557A95' }}>
                    {formState === 'sending' ? 'Envoi…' : 'Envoyer'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm" style={{ color: '#7395AE' }}>
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-4" style={{ backgroundColor: '#B1A296' + '25' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#379683' }}>Tarifs simples et transparents</h2>
            <p style={{ color: '#5D5C61' }}>Achetez des crédits selon vos besoins, sans abonnement imposé.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className="bg-white rounded-2xl p-6 flex flex-col border-2"
                style={{ borderColor: plan.featured ? '#557A95' : '#7395AE' + '50' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold" style={{ color: '#5D5C61' }}>{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold" style={{ color: '#557A95' }}>{plan.price}</span>
                      <span className="text-xs" style={{ color: '#7395AE' }}>{plan.period}</span>
                    </div>
                  </div>
                  {plan.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: '#379683' + '20', color: '#379683' }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#5D5C61' }}>
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: '#379683' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={user ? '/pricing' : plan.href}
                  className="block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors text-white"
                  style={{ backgroundColor: plan.featured ? '#557A95' : '#7395AE' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4a6a82'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = plan.featured ? '#557A95' : '#7395AE'}
                >
                  {user ? 'Choisir ce forfait' : plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Badges de confiance */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white"
                style={{ borderColor: '#7395AE' + '50', color: '#5D5C61' }}>
                🔒 Paiement sécurisé Stripe
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white"
                style={{ borderColor: '#7395AE' + '50', color: '#5D5C61' }}>
                💳 Visa · Mastercard · CB
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white"
                style={{ borderColor: '#7395AE' + '50', color: '#5D5C61' }}>
                🛡 SSL 256-bit
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: '#7395AE' }}>
              Satisfait ou remboursé 7 jours · Sans abonnement · Résiliation immédiate
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-4" style={{ backgroundColor: 'white' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#379683' }}>Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#B1A296' + '20' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#379683' }}>À propos d'Autocandidat</h2>
          <p className="text-base leading-relaxed mb-5" style={{ color: '#5D5C61' }}>
            Autocandidat est né d'un constat simple : la recherche d'emploi est épuisante. Rédiger des dizaines de lettres personnalisées, suivre ses candidatures, trouver les bonnes offres — cela prend des heures chaque jour, pour des résultats souvent décevants.
          </p>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#5D5C61' }}>
            Nous avons construit Autocandidat pour que chaque candidat puisse se concentrer sur ce qui compte vraiment : préparer ses entretiens et décrocher le poste qu'il mérite. L'IA s'occupe du reste — en 30 secondes, pas en 30 minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium" style={{ color: '#7395AE' }}>
            <span className="flex items-center gap-1.5">🇫🇷 Fondé en France</span>
            <span className="flex items-center gap-1.5">🔒 RGPD conforme</span>
            <span className="flex items-center gap-1.5">🌍 Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5">✉ contact@autocandidat.fr</span>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#557A95' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à booster votre recherche d'emploi ?
          </h2>
          <p className="mb-8" style={{ color: '#B1A296' }}>
            Rejoignez des milliers de candidats qui utilisent Autocandidat pour décrocher leurs entretiens.
          </p>
          <Link to="/register"
            className="inline-block px-8 py-3 font-bold rounded-xl transition-colors"
            style={{ backgroundColor: 'white', color: '#557A95' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B1A296'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            Voir les forfaits →
          </Link>
          <p className="text-xs mt-4" style={{ color: '#B1A296' }}>Sans engagement · Paiement unique</p>
        </div>
      </section>

    </div>
  );
}
