import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const success = params.get('gmail_connected');
    const error = params.get('gmail_error');

    const successUrl = sessionStorage.getItem('oauth_success_url') || '/app';
    const errorUrl = sessionStorage.getItem('oauth_error_url') || '/login';
    sessionStorage.removeItem('oauth_success_url');
    sessionStorage.removeItem('oauth_error_url');

    if (success) {
      sessionStorage.setItem('oauth_success', '1');
      window.location.replace(successUrl);
    } else {
      sessionStorage.setItem('oauth_error', decodeURIComponent(error || 'Erreur OAuth'));
      window.location.replace(errorUrl);
    }
  }, [params]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#555' }}>
      <p>Connexion en cours...</p>
    </div>
  );
}
