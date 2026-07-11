import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { api } from './api';

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    api.post('/track/pageview', { path: location.pathname, referrer: document.referrer }).catch(() => {});
  }, [location.pathname]);
  return null;
}
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ATSPage from './pages/ATSPage';
import EmailPage from './pages/EmailPage';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import LegalPage from './pages/LegalPage';
import CGUPage from './pages/CGUPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import OAuthCallback from './pages/OAuthCallback';
import AccountSettingsPage from './pages/AccountSettingsPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/app" replace />;
  return children;
}

function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('cookie_consent'));
  if (!visible) return null;
  const accept = () => { localStorage.setItem('cookie_consent', '1'); setVisible(false); };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
      <p className="text-xs text-gray-300 text-center sm:text-left">
        Ce site utilise le stockage local pour votre session.{' '}
        <Link to="/cookies" className="underline hover:text-white">Politique de cookies</Link>
      </p>
      <button onClick={accept} className="shrink-0 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-xs font-medium transition-colors">
        Accepter
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTracker />
        <CookieBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ats" element={<PrivateRoute><ATSPage /></PrivateRoute>} />
          <Route path="/email" element={<PrivateRoute><EmailPage /></PrivateRoute>} />
          <Route path="/accounts" element={<Navigate to="/email" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/cgu" element={<CGUPage />} />
          <Route path="/account" element={<PrivateRoute><AccountSettingsPage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
