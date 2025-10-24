import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type MeUser = {
  user_id: number;
  full_name: string;
  email: string;
  user_type_id: number;
};

type AuthContextType = {
  user: MeUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const refreshMe = async () => {
    const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/v1/auth/me");
      const data = res.data?.data ?? res.data;
      setUser(data as MeUser);
    } catch {
      setAuthToken(undefined);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, remember?: boolean) => {
    setAuthToken(newToken);
    if (remember) localStorage.setItem("access_token", newToken);
    await refreshMe();
  };

  const logout = async () => {
    try {
      await api.post("/v1/auth/logout");
    } catch {}
    setAuthToken(undefined);
    setUser(null);
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshMe,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}