// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setAuthToken } from "@/lib/api";

interface UserType {
  user_type_id: number;
  user_type_name: string;
  user_type_code: string;
}

interface User {
  user_id: number;
  full_name: string;
  email: string;
  user_type_code?: string; // خاصية احتياطية لو كانت على المستوى الأعلى
  user_type: UserType; // <-- استخدم الواجهة الجديدة هنا
  // أضف أي حقول أخرى تحتاجها
  college_id?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean; // <-- الخاصية الجديدة
  login: (token: string, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- ابدأ بـ true

  useEffect(() => {
    const initializeAuth = async () => {
      // تحقق من وجود توكن في sessionStorage أو localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      
      if (token) {
        setAuthToken(token); // جهّز الهيدر
        try {
          // حاول جلب بيانات المستخدم
          const response = await api.get('/v1/auth/me');
          const userData = response.data?.data ?? response.data;
          setUser(userData.user ?? userData);
        } catch (error) {
          console.error("Failed to fetch user on initial load", error);
          // إذا فشل، يعني أن التوكن غير صالح، فقم بتسجيل الخروج
          setAuthToken(undefined); 
        }
      }
      
      // في كل الأحوال، أوقف التحميل بعد انتهاء المحاولة
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string, remember: boolean) => {
    // عند تسجيل الدخول، أعد جلب بيانات المستخدم لتحديث الحالة
    const fetchUserOnLogin = async () => {
      setAuthToken(token);
      try {
        const response = await api.get('/v1/auth/me');
        const userData = response.data?.data ?? response.data;
        setUser(userData.user ?? userData);
        if (remember) {
          localStorage.setItem('access_token', token);
        } else {
          sessionStorage.setItem('access_token', token);
        }
      } catch (error) {
        console.error("Login failed: could not fetch user", error);
        setAuthToken(undefined);
      }
    };
    fetchUserOnLogin();
  };

  const logout = () => {
    setAuthToken(undefined);
    setUser(null);
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    // يمكنك إضافة توجيه إلى صفحة تسجيل الدخول هنا إذا أردت
    // window.location.href = '/login';
  };

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};