import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo  } from "react";
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
  myUserType: UserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

   const fetchTypes = async () => {
    try {
      // نستخدم رابط الـ public lookup إذا كان متاحاً، أو المحمي
      const res = await api.get('/v1/lookups/user-types');
      const types = res.data.data || res.data;
      if (Array.isArray(types)) {
        setUserTypes(types);
      }
    } catch (error) {
      console.error("Failed to fetch user types lookup:", error);
    }
  };

  // دالة لجلب المستخدم وتحديث الحالة (تُستخدم في useEffect و login)
  const fetchAndSetUser = async (token: string) => {
    setAuthToken(token);
    try {
      const response = await api.get('/v1/auth/me');
      const userData = response.data?.data ?? response.data;
      setUser(userData.user ?? userData);
      await fetchTypes();
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
      
      // 1. جلب المستخدم
      if (token) {
        await fetchAndSetUser(token);
      }

      
      
      // 3. إيقاف التحميل
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