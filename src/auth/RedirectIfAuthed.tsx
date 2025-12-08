import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// استيراد أيقونة تحميل لتحسين المظهر
import { Loader2 } from "lucide-react"; 

export default function RedirectIfAuthed({ children }: { children: JSX.Element }) {
  // 1. التصحيح: استخدمنا user و isLoading الموجودة فعلياً في الكونتكست
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // تحديد الوجهة: إما الرابط المحفوظ في state أو الصفحة الرئيسية
  const from = location.state?.from?.pathname || "/";

  // 2. أثناء التحميل، لا تعرض صفحة الدخول حتى نتأكد، اعرض شاشة تحميل
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. إذا كان المستخدم موجوداً، وجهه للصفحة المطلوبة (أو الرئيسية)
  if (user) {
    return <Navigate to={from} replace />;
  }

  // 4. إذا لم يكن مسجلاً، اسمح بعرض صفحة الدخول (children)
  return children;
}