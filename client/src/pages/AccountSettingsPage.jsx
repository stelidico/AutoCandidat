import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('autocandidat_token');
      const res = await fetch('/api/users/me/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-autocandidat.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du téléchargement. Réessayez.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await api.delete('/users/me', { data: { password: deletePassword } });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Erreur lors de la suppression.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6 py-4">
        <h1 className="text-xl font-bold" style={{ color: '#5D5C61' }}>Mon compte</h1>

        {/* Infos */}
        <div className="bg-white rounded-2xl border p-5 space-y-2" style={{ borderColor: '#d5cdc9' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#379683' }}>Informations</h2>
          <div className="text-sm" style={{ color: '#5D5C61' }}>
            <span className="font-medium">Nom :</span> {user?.name || '—'}
          </div>
          <div className="text-sm" style={{ color: '#5D5C61' }}>
            <span className="font-medium">Email :</span> {user?.email}
          </div>
          <div className="text-sm" style={{ color: '#5D5C61' }}>
            <span className="font-medium">Forfait :</span>{' '}
            {user?.plan === 'premium' ? 'Forfait 49,99€' : user?.plan === 'boost' ? 'Forfait 19,99€' : 'Essai gratuit'}
          </div>
        </div>

        {/* Télécharger mes données */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#d5cdc9' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#379683' }}>Télécharger mes données</h2>
          <p className="text-xs mb-4" style={{ color: '#7395AE' }}>
            Conformément au RGPD (droit d'accès et portabilité), téléchargez l'ensemble de vos données personnelles au format PDF : profil, candidatures, comptes email.
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: '#557A95' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4a6a82'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#557A95'; }}
          >
            {exportLoading ? 'Préparation…' : '⬇ Télécharger mes données'}
          </button>
        </div>

        {/* Supprimer mon compte */}
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <h2 className="text-sm font-semibold mb-1 text-red-700">Supprimer mon compte</h2>
          <p className="text-xs mb-4 text-gray-500">
            Cette action est <strong>irréversible</strong>. Toutes vos données (profil, candidatures, comptes email, crédits restants) seront définitivement supprimées.
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-red-700">Confirmez en saisissant votre mot de passe :</p>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading || !deletePassword}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {deleteLoading ? 'Suppression…' : 'Confirmer la suppression'}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
