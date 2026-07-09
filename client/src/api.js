import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on public pages (avoids infinite loop during initial auth check)
      const publicPaths = ['/', '/login', '/register', '/oauth-callback', '/pricing', '/contact', '/privacy', '/legal', '/cgu'];
      const isPublic = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'));
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
