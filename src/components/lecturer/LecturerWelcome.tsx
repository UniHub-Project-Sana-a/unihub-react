import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, GraduationCap, ClipboardList } from "lucide-react"; // ✅ إضافة أيقونات جديدة
import { useAuth } from "@/context/AuthContext";
import { setAuthToken, api } from "@/lib/api";
import { useState } from "react";

// ✅ تحديث الواجهة لتستقبل دوال التحكم في العرض
interface LecturerWelcomeProps {
  name: string;
  academicTitle?: string;
  currentView: 'attendance' | 'grades'; // الصفحة الحالية
  onViewChange: (view: 'attendance' | 'grades') => void; // دالة التغيير
}

export function LecturerWelcome({ 
  name, 
  academicTitle, 
  currentView, 
  onViewChange 
}: LecturerWelcomeProps) {
  
  const { logout } = useAuth(); // استخدام دالة الخروج من الكونتكست (اختياري، أو الطريقة اليدوية أدناه)
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/v1/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    }
    
    // تنظيف التوكن والبيانات
    setAuthToken(undefined);
    localStorage.removeItem("access_token");
    // توجيه المستخدم لصفحة الدخول
    window.location.href = "/react-app/login";
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* === الجزء الأيمن: معلومات المحاضر === */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              أهلاً بك، <span className="text-primary">{academicTitle && `${academicTitle} / `}{name}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
              النظام الأكاديمي الموحد
            </p>
          </div>
        </div>

        {/* === الجزء الأيسر: أزرار التنقل والتحكم === */}
        <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
          
          {/* زر عرض سجل الحضور (الجدول الدراسي) */}
          <Button
            variant={currentView === 'attendance' ? "default" : "outline"}
            onClick={() => onViewChange('attendance')}
            className={`gap-2 transition-all ${currentView === 'attendance' ? 'shadow-md' : 'bg-background/50'}`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>سجل الحضور</span>
          </Button>

          {/* زر عرض أعمال الفصل (الجديد) */}
          <Button
            variant={currentView === 'grades' ? "default" : "outline"}
            onClick={() => onViewChange('grades')}
            className={`gap-2 transition-all ${currentView === 'grades' ? 'shadow-md' : 'bg-background/50'}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>أعمال الفصل</span>
          </Button>

          {/* فاصل عمودي يظهر فقط في الشاشات الكبيرة */}
          <div className="h-8 w-[1px] bg-border mx-2 hidden md:block"></div>

          {/* زر تسجيل الخروج */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            {loggingOut ? (
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </Button>
        </div>

      </div>
    </Card>
  );
}