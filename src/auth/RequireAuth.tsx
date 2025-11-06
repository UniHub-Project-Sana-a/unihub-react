// src/auth/RequireAuth.tsx

import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // إذا كانت بيانات المستخدم قيد التحميل، أظهر رسالة انتظار
  if (isLoading) {
    return <div>Loading authentication...</div>; 
  }

  // إذا كان المستخدم موجودًا (مسجل دخوله)، اسمح له بالمرور إلى المسارات الفرعية
  if (user) {
    return <Outlet />; // <-- هذا هو التغيير الرئيسي. يعرض المكون الفرعي المطابق للمسار
  }

  // إذا لم يكن المستخدم مسجلاً، أعد توجيهه إلى صفحة تسجيل الدخول
  return <Navigate to="/login" state={{ from: location }} replace />;
}