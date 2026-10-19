// src/lib/api.ts
import axios from 'axios';

// قراءة الـ API URL من Environment Variables مع fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

// Log للتأكد (فقط في Development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

// ===== روابط ملفات التخزين (Laravel storage:link) =====
// نبني رابط التخزين من نفس مضيف الواجهة (VITE_API_BASE_URL) بدل الاعتماد على
// APP_URL في الباك اند، لأن APP_URL قد يشير إلى مضيف/IP مختلف فيتعذّر عرض الصورة.
export const API_ORIGIN = (() => {
  try {
    return API_BASE_URL ? new URL(API_BASE_URL).origin : "";
  } catch {
    return "";
  }
})();

// مسار التطبيق الأساسي بدون /api (مثال: https://host/unihub-api/api -> /unihub-api)
const API_APP_PATH = (() => {
  try {
    if (!API_BASE_URL) return "";
    const p = new URL(API_BASE_URL).pathname.replace(/\/api\/?$/, "");
    return p === "/" ? "" : p.replace(/\/$/, "");
  } catch {
    return "";
  }
})();

export const STORAGE_BASE_URL = `${API_ORIGIN}${API_APP_PATH}/storage/`;

/**
 * يحوّل مسار ملف مخزّن في Laravel (مثل `colleges/1.png`) إلى رابط كامل صالح للعرض.
 * - الروابط الكاملة (http/https/data/blob) تُعاد كما هي.
 * - المسارات النسبية تُبنى على STORAGE_BASE_URL.
 */
export function storageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  return `${STORAGE_BASE_URL}${path.replace(/^\/+/, "")}`;
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

// --- استخراج رسالة خطأ مفهومة من أي استجابة (JSON / نص / HTML) ---
export function getApiErrorMessage(
  error: any,
  fallback = "حدث خطأ غير متوقع، حاول مرة أخرى"
): string {
  const status: number | undefined = error?.response?.status;
  const data = error?.response?.data;

  // 1) استجابة غير JSON (مثل صفحة HTML التي يعرضها الخادم عند خطأ 500)
  if (typeof data === "string") {
    const text = data.trim();
    if (text.startsWith("<")) {
      if (status && status >= 500) {
        return `خطأ في الخادم (${status}). تعذّر تنفيذ العملية، حاول لاحقاً.`;
      }
      if (status === 404) return "العنوان غير موجود (404). تحقّق من إعدادات الخادم.";
      if (status === 401) return "انتهت صلاحية الجلسة، الرجاء تسجيل الدخول من جديد.";
      if (status === 403) return "ليس لديك صلاحية لتنفيذ هذه العملية.";
      return `استجابة غير متوقعة من الخادم (${status ?? "?"}).`;
    }
    if (text) return text;
  }

  // 2) أخطاء التحقق من الصحة (Laravel: field => [msg, ...])
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (typeof first === "string" && first) return first;
  }

  // 3) رسالة السيرفر الصريحة (JSON)
  if (data?.message) return String(data.message);
  if (data?.error) return String(data.error);

  // 4) حالات بلا محتوى مفيد في الاستجابة
  if (status === 500) return "خطأ في الخادم (500). تعذّر تنفيذ العملية، حاول لاحقاً.";
  if (status === 404) return "العنوان غير موجود (404).";
  if (status === 401) return "انتهت صلاحية الجلسة، الرجاء تسجيل الدخول من جديد.";
  if (status === 403) return "ليس لديك صلاحية لتنفيذ هذه العملية.";
  if (error?.code === "ECONNABORTED") return "انتهت مهلة الاتصال بالخادم، حاول مرة أخرى.";
  if (error?.message && !/(network|timeout|json)/i.test(error.message)) {
    return String(error.message);
  }

  return fallback;
}