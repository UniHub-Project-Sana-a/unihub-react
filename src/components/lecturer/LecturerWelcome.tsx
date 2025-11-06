import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // <-- استيراد الزر
import { User, LogOut } from "lucide-react"; // <-- استيراد أيقونة الخروج
import { useAuth } from "@/context/AuthContext"; // <-- استيراد useAuth لتنفيذ الخروج

interface LecturerWelcomeProps {
  name: string;
}

export function LecturerWelcome({ name }: LecturerWelcomeProps) {
  const { logout } = useAuth(); // <-- الحصول على دالة logout

  const handleLogout = () => {
    // يمكنك إضافة رسالة تأكيد هنا إذا أردت
    // if (confirm("هل أنت متأكد من أنك تريد تسجيل الخروج؟")) {
    //   logout();
    // }
    logout();
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
              أهلاً بك، {name}
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة الحضور والمحاضرات
            </p>
          </div>
        </div>

        {/* الجزء الأيسر: زر تسجيل الخروج */}
        <div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
      {/* ================================================ */}
    </Card>
  );
}