import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount by calling /users/me (cookie sent automatically)
  useEffect(() => {
    // validateStatus prevents axios from throwing on 401, avoiding the redirect interceptor
    api.get('/users/me', { validateStatus: (s) => s < 500 })
      .then(({ data, status }) => {
        if (status === 200) {
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            sender_email: data.sender_email,
            isAdmin: !!data.is_admin,
            plan: data.plan || 'free',
            applications_bonus: data.applications_bonus,
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/users/login', { email, password });
    setUser({ id: data.id, email: data.email, name: data.name, sender_email: data.sender_email, isAdmin: !!data.isAdmin, plan: data.plan || 'free' });
  }, []);

  const register = useCallback(async (email, password, name, sender_email) => {
    const { data } = await api.post('/users/register', { email, password, name, sender_email });
    setUser({ id: data.id, email: data.email, name: data.name, sender_email: data.sender_email, isAdmin: !!data.isAdmin, plan: 'free' });
  }, []);

  // Called after OAuth popup success — re-fetch user from server (cookie already set)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        sender_email: data.sender_email,
        isAdmin: !!data.is_admin,
        plan: data.plan || 'free',
        applications_bonus: data.applications_bonus,
      });
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/users/logout'); } catch {}
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: '#557A95', fontSize: '14px' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
