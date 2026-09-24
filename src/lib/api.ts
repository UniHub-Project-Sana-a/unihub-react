// src/lib/api.ts
import axios from 'axios';

// قراءة الـ API URL من Environment Variables مع fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

// Log للتأكد (فقط في Development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
});

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    sessionStorage.setItem('access_token', token);
    localStorage.setItem('access_token', token); // حفظ في كلاهما
  } else {
    delete api.defaults.headers.common['Authorization'];
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('access_token');
  }
}

// تحميل الـ Token عند بدء التطبيق
const savedToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
if (savedToken) {
  setAuthToken(savedToken);
}

// Request Interceptor - إضافة Token تلقائياً
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // طباعة الخطأ للتشخيص
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // معالجة 401 Unauthorized
    if (error.response?.status === 401) {
      const isLoginPage = error.config?.url?.endsWith('/auth/login');
      
      if (!isLoginPage) {
        setAuthToken(undefined);
        window.location.hash = '#/login';
      }
    }

    return Promise.reject(error);
  }
);