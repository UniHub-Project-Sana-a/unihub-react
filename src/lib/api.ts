// src/lib/api.ts
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // عدّل إن لزم
  headers: { Accept: 'application/json' },
});

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    sessionStorage.setItem('access_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    sessionStorage.removeItem('access_token');
  }
}

// حقن تلقائي للتوكن و X-College-Id مع توافق Axios v1
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // تأكد من وجود كائن رؤوس من نوع AxiosHeaders
  const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;

  // Authorization
  const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // X-College-Id لطلبات الكتابة فقط
  const method = (config.method ?? '').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const collegeId =
      localStorage.getItem('active_college_id') ||
      sessionStorage.getItem('active_college_id');
    if (collegeId && !headers.has('X-College-Id')) {
      headers.set('X-College-Id', collegeId);
    }
  }

  config.headers = headers;
  return config;
});