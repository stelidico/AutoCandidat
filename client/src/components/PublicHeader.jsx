import { Link } from 'react-router-dom';

// En-tête public partagé (pages hors app connectée : tarifs, contact, pages légales)
export default function PublicHeader() {
  return (
    <header style={{ borderBottom: '1px solid #d5cdc9', backgroundColor: '#f5f1ef' }}>
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg" style={{ color: '#379683' }}>Autocandidat</Link>
        <Link to="/" className="text-sm font-medium hover:underline" style={{ color: '#557A95' }}>← Accueil</Link>
      </div>
    </header>
  );
}
