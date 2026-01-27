import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RequirePermissionProps {
  permission: string;
}

export default function RequirePermission({ permission }: RequirePermissionProps) {
  const { can } = usePermission();
  const { isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ الفحص الحاسم: هل يملك الصلاحية؟
  if (can(permission)) {
    return <Outlet />;
  }

  // ❌ إذا لم يملك الصلاحية: اعرض صفحة "غير مصرح"
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-red-50 p-4 rounded-full mb-4">
            <ShieldAlert className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">وصول غير مصرح به</h1>
        <p className="text-muted-foreground max-w-md mb-6">
            عذراً، حسابك لا يمتلك الصلاحية المطلوبة ({permission}) لعرض هذه الصفحة.
        </p>
        
        {/* يمكنك إضافة زر للعودة */}
        <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
            عودة للصفحة السابقة
        </button>
    </div>
  );
}