import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

interface RequireRoleProps {
  allowedRoles: string[];
}

export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = user?.user_type?.user_type_code || user?.user_type_code;
  const collegeId = user?.college_id;

  // ✅ الحالة 1: المستخدم لديه الصلاحية -> اسمح بالمرور
  if (user && role && allowedRoles.includes(role)) {
    return <Outlet />;
  }

  // ❌ الحالة 2: المستخدم موجود لكنه في المكان الخطأ -> وجهه لمكانه الصحيح
  if (user) {
    let homePath = "/"; // افتراضي

    if (role === 'presidency' || role === 'admin') {
        homePath = "/";
    } 
    else if (role === 'lecturer') {
        homePath = "/lecturer";
    }
    else if (role === 'student') {
        homePath = "/student/qa";
    }
    else if (collegeId) { 
        // للعمداء ورؤساء الأقسام
        homePath = `/colleges/${collegeId}/dashboard`;
    }

    // 🔥🔥🔥 صمام الأمان (The Fix) 🔥🔥🔥
    // نتحقق: هل نحن بالفعل في الصفحة التي نريد التوجيه إليها؟
    // إذا نعم، فهذا يعني أن المستخدم وصل لوجهته "المفترضة" لكنه لا يملك صلاحية رؤيتها
    // (مثلاً عميد بدون college_id صحيح، أو خطأ في إعدادات الراوتر)
    // في هذه الحالة: لا توجهه مرة أخرى (لمنع اللوب)، بل اعرض رسالة خطأ.
    
    // إزالة الـ trailing slash للمقارنة الدقيقة
    const currentPath = location.pathname.replace(/\/$/, "");
    const targetPath = homePath.replace(/\/$/, "");

    if (currentPath === targetPath || currentPath.startsWith(targetPath)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold mb-2">خطأ في الصلاحيات أو الإعدادات</h1>
                <p className="text-muted-foreground max-w-md">
                    حسابك ({role}) لا يمتلك الصلاحية لعرض هذه الصفحة، 
                    أو أن بيانات كليتك غير مكتملة في النظام.
                </p>
                <p className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded">
                    المسار الحالي: {currentPath} <br/>
                    الدور الحالي: {role}
                </p>
            </div>
        );
    }

    // إذا لم نكن في الصفحة المستهدفة، وجهه إليها
    return <Navigate to={homePath} replace />;
  }
  
  // 3. غير مسجل -> لصفحة الدخول
  return <Navigate to="/login" state={{ from: location }} replace />;
}