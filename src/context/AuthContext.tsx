import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
// افترض أن setAuthToken و api مستوردان بشكل صحيح
import { api, setAuthToken } from "@/lib/api"; 

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
  lecturer?: LecturerInfo
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, remember: boolean) => Promise<void>; // أصبحت async وقابلة للانتظار
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // دالة لجلب المستخدم وتحديث الحالة (تُستخدم في useEffect و login)
  const fetchAndSetUser = async (token: string) => {
    setAuthToken(token);
    try {
      const response = await api.get('/v1/auth/me');
      const userData = response.data?.data ?? response.data;
      setUser(userData.user ?? userData);
      return true; // نجاح
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setAuthToken(undefined);
      setUser(null);
      return false; // فشل
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      
      if (token) {
        // لا نحتاج لـ setIsLoading(true) هنا لأنها تبدأ بـ true
        await fetchAndSetUser(token);
      }
      
      // توقف التحميل بعد انتهاء المحاولة الأولية
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
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