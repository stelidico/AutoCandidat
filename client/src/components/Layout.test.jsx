import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../api';

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function renderLayout(initialPath = '/app') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Layout>
          <div>contenu</div>
        </Layout>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("affiche la navigation principale et masque le lien Admin pour un utilisateur classique", async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com' }, status: 200 });

    renderLayout();

    expect(await screen.findByText('CV & Lettres')).toBeInTheDocument();
    expect(screen.getByText('Candidatures')).toBeInTheDocument();
    expect(screen.getByText('Comptes Email')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('affiche le lien Admin pour un administrateur', async () => {
    api.get.mockResolvedValue({ data: { email: 'admin@example.com', is_admin: 1 }, status: 200 });

    renderLayout();

    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  test("affiche l'email de l'utilisateur connecté dans le pied de sidebar", async () => {
    api.get.mockResolvedValue({ data: { email: 'user@example.com' }, status: 200 });

    renderLayout();

    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
  });
});
