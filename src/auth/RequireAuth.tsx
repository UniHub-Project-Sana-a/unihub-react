import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        جارٍ التحقق من الجلسة...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}