import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, LogOut, GraduationCap, ClipboardList, Megaphone, FileCheck, Building2 } from "lucide-react"; // ✅ إضافة أيقونات جديدة
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useState } from "react";

// ✅ تحديث الواجهة لتستقبل دوال التحكم في العرض
export type LecturerViewType = 'attendance' | 'grades' | 'announcements' | 'excuses';

interface LecturerWelcomeProps {
  name: string;
  academicTitle?: string;
  currentView: LecturerViewType; // الصفحة الحالية
  onViewChange: (view: LecturerViewType) => void; // دالة التغيير
}

export function LecturerWelcome({ 
  name, 
  academicTitle, 
  currentView, 
  onViewChange 
}: LecturerWelcomeProps) {
  
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // استخدام دالة الخروج من الكونتكست (اختياري، أو الطريقة اليدوية أدناه)
  const [loggingOut, setLoggingOut] = useState(false);

  const userRole = (user as any)?.user_type?.user_type_code || (user as any)?.user_type_code;
  const collegeId = (user as any)?.college_id;
  const isSuperUser = userRole === 'presidency' || userRole === 'admin';
  const hasAdminRole = isSuperUser || userRole === 'dean' || userRole === 'dept_head' || userRole === 'head_of_department' || !!collegeId;
  const adminLandingPath = isSuperUser ? '/' : (collegeId ? `/colleges/${collegeId}/dashboard` : '/colleges');

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/v1/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    }
    logout();
    navigate("/login", { replace: true });
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

          {/* زر إعلانات وتنبيهات الطلاب */}
          <Button
            variant={currentView === 'announcements' ? "default" : "outline"}
            onClick={() => onViewChange('announcements')}
            className={`gap-2 transition-all ${currentView === 'announcements' ? 'shadow-md' : 'bg-background/50'}`}
          >
            <Megaphone className="w-4 h-4" />
            <span>إعلانات الطلاب</span>
          </Button>

          {/* زر أعذار الطلاب */}
          <Button
            variant={currentView === 'excuses' ? "default" : "outline"}
            onClick={() => onViewChange('excuses')}
            className={`gap-2 transition-all ${currentView === 'excuses' ? 'shadow-md' : 'bg-background/50'}`}
          >
            <FileCheck className="w-4 h-4" />
            <span>أعذار الغياب</span>
          </Button>

          {/* زر العودة للوحة تحكم الإدارة الأكاديمية / الكلية */}
          {hasAdminRole && (
            <Button
              variant="outline"
              onClick={() => navigate(adminLandingPath)}
              className="gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold shadow-xs transition-all"
              title="العودة إلى لوحة تحكم إدارة الكلية / النظام"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة إدارة الكلية 🏛️</span>
              <span className="sm:hidden">الإدارة</span>
            </Button>
          )}

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