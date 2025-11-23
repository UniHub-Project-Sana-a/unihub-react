import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // <-- استيراد الزر
import { User, LogOut } from "lucide-react"; // <-- استيراد أيقونة الخروج
import { useAuth } from "@/context/AuthContext"; // <-- استيراد useAuth لتنفيذ الخروج
import { setAuthToken, api } from "@/lib/api";
import { useState } from "react";
interface LecturerWelcomeProps {
  name: string;
  academicTitle?: string;
}

export function LecturerWelcome({ name, academicTitle }: LecturerWelcomeProps) {
  const { logout } = useAuth(); // <-- الحصول على دالة logout
  const [loggingOut, setLoggingOut] = useState(false);


  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/v1/auth/logout");
    } catch {}
    // تنظيف التوكن
    setAuthToken(undefined);
    localStorage.removeItem("access_token");
    // لا نحذف active_college_id
    window.location.href = "/login";
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      {/* ========== التعديل هنا: استخدام Flexbox ========== */}
      <div className="flex items-center justify-between">
        {/* الجزء الأيمن: الأيقونة والاسم */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              أهلاً بك، {academicTitle && `${academicTitle} / `}{name}
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة الحضور والمحاضرات
            </p>
          </div>
        </div>

        {/* الجزء الأيسر: زر تسجيل الخروج */}
        <div>
          {/* زر تسجيل الخروج */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Logout"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </Button>
        </div>
      </div>
      {/* ================================================ */}
    </Card>
  );
}