import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RedirectIfAuthed({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next");

  if (loading) return children;
  if (isAuthenticated) {
    return <Navigate to={next || "/"} replace />;
  }
  return children;
}