import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

function getUserFromToken() {
  try {
    const token = localStorage.getItem('autocandidat_token');
    if (!token) return null;
    const [, payload] = token.split('.');
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (data.exp * 1000 < Date.now()) {
      localStorage.removeItem('autocandidat_token');
      return null;
    }
    return { id: data.sub, email: data.email };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromToken);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/users/login', { email, password });
    localStorage.setItem('autocandidat_token', data.token);
    setUser({ id: data.id, email: data.email, name: data.name, sender_email: data.sender_email });
  }, []);

  const register = useCallback(async (email, password, name, sender_email) => {
    const { data } = await api.post('/users/register', { email, password, name, sender_email });
    localStorage.setItem('autocandidat_token', data.token);
    setUser({ id: data.id, email: data.email, name: data.name, sender_email: data.sender_email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('autocandidat_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
