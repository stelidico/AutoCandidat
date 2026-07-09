import { useState } from 'react';
import { api } from '../api';
import Layout from '../components/Layout';

const DEPARTMENTS = [
  { value: '', label: 'Tous départements' },
  { value: '01', label: '01 - Ain' }, { value: '02', label: '02 - Aisne' },
  { value: '03', label: '03 - Allier' }, { value: '06', label: '06 - Alpes-Maritimes' },
  { value: '13', label: '13 - Bouches-du-Rhône' }, { value: '14', label: '14 - Calvados' },
  { value: '17', label: '17 - Charente-Maritime' }, { value: '21', label: '21 - Côte-d\'Or' },
  { value: '25', label: '25 - Doubs' }, { value: '29', label: '29 - Finistère' },
  { value: '30', label: '30 - Gard' }, { value: '31', label: '31 - Haute-Garonne' },
  { value: '33', label: '33 - Gironde' }, { value: '34', label: '34 - Hérault' },
  { value: '35', label: '35 - Ille-et-Vilaine' }, { value: '37', label: '37 - Indre-et-Loire' },
  { value: '38', label: '38 - Isère' }, { value: '40', label: '40 - Landes' },
  { value: '42', label: '42 - Loire' }, { value: '44', label: '44 - Loire-Atlantique' },
  { value: '45', label: '45 - Loiret' }, { value: '49', label: '49 - Maine-et-Loire' },
  { value: '54', label: '54 - Meurthe-et-Moselle' }, { value: '57', label: '57 - Moselle' },
  { value: '59', label: '59 - Nord' }, { value: '60', label: '60 - Oise' },
  { value: '62', label: '62 - Pas-de-Calais' }, { value: '63', label: '63 - Puy-de-Dôme' },
  { value: '64', label: '64 - Pyrénées-Atlantiques' }, { value: '67', label: '67 - Bas-Rhin' },
  { value: '68', label: '68 - Haut-Rhin' }, { value: '69', label: '69 - Rhône' },
  { value: '71', label: '71 - Saône-et-Loire' }, { value: '73', label: '73 - Savoie' },
  { value: '74', label: '74 - Haute-Savoie' }, { value: '75', label: '75 - Paris' },
  { value: '76', label: '76 - Seine-Maritime' }, { value: '77', label: '77 - Seine-et-Marne' },
  { value: '78', label: '78 - Yvelines' }, { value: '80', label: '80 - Somme' },
  { value: '83', label: '83 - Var' }, { value: '84', label: '84 - Vaucluse' },
  { value: '85', label: '85 - Vendée' }, { value: '87', label: '87 - Haute-Vienne' },
  { value: '91', label: '91 - Essonne' }, { value: '92', label: '92 - Hauts-de-Seine' },
  { value: '93', label: '93 - Seine-Saint-Denis' }, { value: '94', label: '94 - Val-de-Marne' },
  { value: '95', label: '95 - Val-d\'Oise' },
  { value: '971', label: '971 - Guadeloupe' }, { value: '972', label: '972 - Martinique' },
  { value: '973', label: '973 - Guyane' }, { value: '974', label: '974 - La Réunion' },
];

const SIZE_LABELS = {
  GE: 'Grande entreprise', ETI: 'ETI (250–4999)', PME: 'PME', '': '',
};

function CompanyCard({ company, onAdd, added }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{company.name}</h3>
          {company.sector && (
            <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{company.sector}</span>
          )}
        </div>
        {company.size && (
          <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">{SIZE_LABELS[company.size] || company.size}</span>
        )}
      </div>

      {company.address && (
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <span className="mt-0.5">📍</span>
          <span>{company.address}</span>
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">SIREN : {company.siren}</span>
        <button
          onClick={() => onAdd(company)}
          disabled={added}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            added
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {added ? '✓ Ajouté' : '+ Candidature'}
        </button>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({}); // siren → true

  const search = async (p = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: query, page: p });
      if (department) params.set('departement', department);
      const { data } = await api.get(`/companies/search?${params}`);
      setResults(data.results);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    search(1);
  };

  const handleAdd = async (company) => {
    try {
      await api.post('/applications', {
        company: company.name,
        location: company.address,
        job_title: 'Candidature spontanée',
        status: 'draft',
        notes: `SIREN : ${company.siren}${company.naf ? ` | Code NAF : ${company.naf}` : ''}${company.sector ? ` (${company.sector})` : ''}`,
      });
      setAdded((prev) => ({ ...prev, [company.siren]: true }));
    } catch {
      setError('Erreur lors de l\'ajout à l\'ATS.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recherche d'entreprises</h1>
          <p className="text-sm text-gray-500 mt-1">Base SIRENE (INSEE) — plus de 10 millions d'entreprises françaises</p>
        </div>

        {/* Formulaire de recherche */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom d'entreprise, secteur, mot-clé…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {/* Résultats */}
        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-900">{total.toLocaleString('fr-FR')}</strong> entreprise{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
                {department && ` dans le département ${department}`}
              </p>
              <p className="text-xs text-gray-400">Page {page} / {totalPages}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((company) => (
                <CompanyCard
                  key={company.siren}
                  company={company}
                  onAdd={handleAdd}
                  added={!!added[company.siren]}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-2 justify-center pt-2">
                <button
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); search(p); }}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
                >
                  ←
                </button>
                <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { const p = page + 1; setPage(p); search(p); }}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun résultat. Essayez un autre mot-clé ou département.
          </div>
        )}

        {results.length === 0 && !query && (
          <div className="text-center py-12 text-gray-400 text-sm space-y-2">
            <div className="text-4xl">🏢</div>
            <p>Recherchez des entreprises par nom, secteur ou activité.</p>
            <p className="text-xs">Exemples : "boulangerie", "développeur", "cabinet comptable Lyon"</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
