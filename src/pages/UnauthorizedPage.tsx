// src/pages/UnauthorizedPage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // استورد useAuth لتحديد الوجهة

export default function UnauthorizedPage() {
  const { user } = useAuth();

  // حدد المسار الرئيسي بذكاء:
  // إذا كان المستخدم مسجلاً ونوعه محاضر، وجهه إلى /lecturer
  // وإلا، وجهه إلى الصفحة الرئيسية /
  const homePath = user?.user_type?.user_type_code === 'lecturer' ? '/lecturer' : '/';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold text-destructive">403</h1>
      <p className="mt-2 text-xl text-muted-foreground">غير مصرح به</p>
      <p className="mt-4">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
      
      <Button asChild className="mt-6">
        <Link to={homePath} replace> {/* استخدمنا replace هنا */}
          العودة إلى الصفحة الرئيسية
        </Link>
      </Button>
    </div>
  );
}