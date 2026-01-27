// src/lib/api.ts
import axios from 'axios';

// استخدم IP جهازك هنا
// const API_BASE_URL = 'http://127.0.0.1/api'; 

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { Accept: 'application/json' },
});

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    sessionStorage.setItem('access_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('access_token');
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !error.config.url.endsWith('/auth/login')) {
      setAuthToken(undefined);
      // const next = window.location.pathname + window.location.search;
      // window.location.href = `/login?next=${encodeURIComponent(next)}`;
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);