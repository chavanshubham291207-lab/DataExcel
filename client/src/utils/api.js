import axios from 'axios';

/**
 * Normalizes the VITE_API_URL for local and production deployment (Vercel -> Render).
 */
const getBaseURL = () => {
  let url = (import.meta.env.VITE_API_URL || 'https://dataexcel-1.onrender.com/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor to inject JWT token in Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null' && typeof token === 'string' && token.length > 5) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global 401 Unauthorized / Expired JWT handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authenticated session on 401 Unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('candidateUser');
      localStorage.removeItem('recruiter');

      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
