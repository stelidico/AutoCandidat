import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmailPage from './EmailPage';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderEmailPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <EmailPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('EmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    api.get.mockImplementation((url) => {
      if (url === '/users/me') return Promise.resolve({ data: {}, status: 200 });
      if (url === '/accounts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
  });

  test("affiche l'état vide quand aucun compte email n'est configuré", async () => {
    renderEmailPage();
    expect(await screen.findByText('Aucun compte email')).toBeInTheDocument();
  });

  test('liste les comptes email existants', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/users/me') return Promise.resolve({ data: {}, status: 200 });
      if (url === '/accounts') {
        return Promise.resolve({
          data: [{ id: '1', label: 'Pro Gmail', email_address: 'pro@gmail.com', provider: 'gmail', created_at: 1700000000 }],
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderEmailPage();

    expect(await screen.findByText('Pro Gmail')).toBeInTheDocument();
    expect(screen.getByText('Gmail OAuth')).toBeInTheDocument();
  });

  test('affiche le formulaire SMTP au clic sur "+ SMTP"', async () => {
    renderEmailPage();
    await screen.findByText('Aucun compte email');

    fireEvent.click(screen.getByText('+ SMTP'));

    expect(screen.getByText('Ajouter un compte email')).toBeInTheDocument();
  });

  test('affiche le message de succès après une redirection OAuth réussie et nettoie le flag', async () => {
    sessionStorage.setItem('oauth_success', '1');

    renderEmailPage();

    expect(await screen.findByText('Compte Gmail connecté avec succès')).toBeInTheDocument();
    expect(sessionStorage.getItem('oauth_success')).toBeNull();
  });

  test('affiche le message d\'erreur déposé par OAuthCallback et nettoie le flag', async () => {
    sessionStorage.setItem('oauth_error', "Erreur d'authentification Gmail");

    renderEmailPage();

    expect(await screen.findByText("Erreur d'authentification Gmail")).toBeInTheDocument();
    expect(sessionStorage.getItem('oauth_error')).toBeNull();
  });

  test('connectGmail demande l\'URL OAuth avec les cookies de session et mémorise le chemin de retour', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' }) });

    renderEmailPage();
    await screen.findByText('Aucun compte email');

    fireEvent.click(screen.getByText('✉ Connecter Gmail'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/auth/google/url', { credentials: 'include' }));
    expect(sessionStorage.getItem('oauth_success_url')).toBe('/email');
    expect(sessionStorage.getItem('oauth_error_url')).toBe('/email');
  });
});
