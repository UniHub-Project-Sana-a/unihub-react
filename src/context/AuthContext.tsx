import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type MeUser = {
  user_id: number;
  full_name: string;
  email: string;
  user_type_id: number;
  college_id?: number | null;
};

type AuthContextType = {
  token: string | null;
  user: MeUser | null;
  loading: boolean;
  isAuthenticated: boolean; // <-- تأكد من وجود هذه الخاصية
  login: (token: string, remember?: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  );
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        setAuthToken(token);
        try {
          const res = await api.get("/v1/auth/me");
          setUser(res.data?.data ?? res.data);
        } catch {
          setAuthToken(undefined);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, [token]);

  const login = async (newToken: string, remember?: boolean) => {
    if (remember) {
      localStorage.setItem("access_token", newToken);
    } else {
      sessionStorage.setItem("access_token", newToken);
    }
    setToken(newToken);
  };

  const logout = () => {
    api.post("/v1/auth/logout").catch(() => {});
    setAuthToken(undefined);
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!user, // <-- توفير isAuthenticated
      login,
      logout,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}