import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ForceLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return null;
}
