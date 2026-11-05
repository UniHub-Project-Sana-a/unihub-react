import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
// افترض أن setAuthToken و api مستوردان بشكل صحيح
import { api, setAuthToken } from "@/lib/api"; 
import axios from "axios";

interface UserType {
  user_type_id: number;
  user_type_name: string;
  user_type_code: string;
}

interface LecturerInfo {
  lecturer_id: number;
  department_id: number;
  // ... أي خصائص أخرى تأتي من جدول المحاضرين
}
interface User {
  user_id: number;
  full_name: string;
  email: string;
  user_type_code?: string;
  user_type: UserType;
  college_id?: number;
  permissions?: string[];
  lecturer?: LecturerInfo
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, remember: boolean) => Promise<void>; // أصبحت async وقابلة للانتظار
  logout: () => void;
  myUserType: UserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    try {
      // نستخدم رابط الـ public lookup إذا كان متاحاً، أو المحمي
      const res = await api.get('/v1/lookups/user-types', { timeout: 5000 });
      const types = res.data.data || res.data;
      if (Array.isArray(types)) {
        setUserTypes(types);
        localStorage.setItem('user_types', JSON.stringify(types));
      }
    } catch (error) {
      console.error("Failed to fetch user types lookup:", error);
      const cachedTypes = localStorage.getItem('user_types');
      if (cachedTypes) {
        try {
          const types = JSON.parse(cachedTypes);
          if (Array.isArray(types)) setUserTypes(types);
        } catch (cacheError) {
          console.error("Failed to restore cached user types:", cacheError);
          localStorage.removeItem('user_types');
        }
      }
    }
  }, []);

  // دالة لجلب المستخدم وتحديث الحالة (تُستخدم في useEffect و login)
  const fetchAndSetUser = useCallback(async (token: string, allowCachedUser = false) => {
    setAuthToken(token);
    try {
      const response = await api.get('/v1/auth/me', allowCachedUser ? { timeout: 5000 } : undefined);
      const userData = response.data?.data ?? response.data;
      const authenticatedUser = userData.user ?? userData;
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      await fetchTypes();
      return true; // نجاح
    } catch (error) {
      console.error("Failed to fetch user:", error);

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const canUseCachedUser =
        status === undefined || status >= 500 || status === 408 || status === 429;
      if (allowCachedUser && canUseCachedUser) {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser) as User;
            if (userData?.user_id) {
              setUser(userData);
              const cachedTypes = localStorage.getItem('user_types');
              if (cachedTypes) {
                try {
                  const types = JSON.parse(cachedTypes);
                  if (Array.isArray(types)) setUserTypes(types);
                } catch (cacheError) {
                  console.error("Failed to restore cached user types:", cacheError);
                  localStorage.removeItem('user_types');
                }
              }
              return true;
            }
            localStorage.removeItem('user');
          } catch (cacheError) {
            console.error("Failed to restore cached user:", cacheError);
            localStorage.removeItem('user');
            localStorage.removeItem('user_types');
          }
        }
      }

      if (status === 401 || (status !== undefined && status !== 429) || !allowCachedUser) {
        setAuthToken(undefined);
        localStorage.removeItem('user');
        localStorage.removeItem('user_types');
      }
      setUser(null);
      return false; // فشل
    }
  }, [fetchTypes]);

    useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      
      // 1. جلب المستخدم
      if (token) {
        await fetchAndSetUser(token, true);
      }

      
      
      // 3. إيقاف التحميل
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchAndSetUser]);

  // تم التعديل: أصبحنا ندير isLoading داخلياً لضمان انتظار RequireAuth
  const login = async (token: string, remember: boolean): Promise<void> => {
    setIsLoading(true); // ابدأ التحميل فوراً عند محاولة تسجيل الدخول
    let success = false;
    
    try {
        success = await fetchAndSetUser(token);

        if (success) {
            // حفظ التوكن بناءً على خيار التذكر
            if (remember) {
              localStorage.setItem('access_token', token);
              sessionStorage.removeItem('access_token');
            } else {
              sessionStorage.setItem('access_token', token);
              localStorage.removeItem('access_token');
            }
        } else {
             // إذا فشل جلب المستخدم بعد الحصول على التوكن
             throw new Error("فشل جلب بيانات المستخدم بعد التوثيق.");
        }
    } catch (error) {
        console.error("Login process failed:", error);
        throw error; // ارفع الخطأ ليمكن لـ finalizeLogin الإمساك به
    } finally {
        // انتهى التحميل، سيسمح لـ RequireAuth بالتنفيذ
        setIsLoading(false); 
    }
  };

  const logout = () => {
    setAuthToken(undefined);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_types');
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  };

  const myUserType = useMemo(() => {
    if (!user || !userTypes || userTypes.length === 0) return null;
    return userTypes.find(t => t.user_type_id === (user as any).user_type_id) || null;
  }, [user, userTypes]);

  const value = { user, isLoading, login, logout, myUserType };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};