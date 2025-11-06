// src/auth/RequireRole.tsx

import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RequireRoleProps {
  allowedRoles: string[]; // مصفوفة من أكواد الأدوار المسموح بها
}

export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // أثناء تحميل بيانات المستخدم، أظهر شاشة تحميل
  if (isLoading) {
    return <div>Loading user authentication...</div>; 
  }

  // استخراج كود نوع المستخدم
  const userTypeCode = user?.user_type?.user_type_code || user?.user_type_code;

  // إذا كان المستخدم موجودًا ودوره ضمن الأدوار المسموح بها، اسمح له بالمرور
  if (user && userTypeCode && allowedRoles.includes(userTypeCode)) {
    return <Outlet />; // يعرض المكونات الفرعية (مثل <CollegesPage />)
  }

  // إذا كان المستخدم مسجلاً ولكن دوره غير مسموح به
  if (user) {
    // أعد توجيهه إلى صفحة "غير مصرح به"
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  // إذا لم يكن المستخدم مسجلاً أصلاً، `RequireAuth` سيتعامل معه
  // لكن كحماية إضافية، يمكن إعادته لصفحة تسجيل الدخول
  return <Navigate to="/login" state={{ from: location }} replace />;
}