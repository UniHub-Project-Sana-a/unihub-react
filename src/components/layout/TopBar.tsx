// src/components/layout/TopBar.tsx
import { useState } from "react";
import { Search, Bell, User, Menu, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { setAuthToken, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, myUserType } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);


  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/v1/auth/logout");
    }  catch (error) {
        console.warn("Logout API failed, forcing local logout.");
    }
    if (setAuthToken) { 
        setAuthToken(null); 
    }
    // تنظيف التخزين المحلي
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/react-app/login";
  };

  return (
    <header className="h-16 bg-card shadow-lg border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-reverse space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="hover:bg-accent" // تم حذف lg:hidden
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* <div className="relative w-96 max-lg:hidden">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن الطلاب، المحاضرين، المقررات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted/50 border-0 focus:bg-background focus:shadow-md transition-all duration-200"
          />
        </div> */}
      </div>

      <div className="flex items-center space-x-reverse space-x-4">
        {/* <Button variant="ghost" size="icon" className="relative hover:bg-accent" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center p-0 bg-destructive">
            3
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" className="hover:bg-accent" aria-label="Settings">
          <Settings className="w-5 h-5" />
        </Button> */}

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

        <div className="flex items-center space-x-reverse space-x-3 pr-4 border-r border-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            {/* عرض الحرف الأول من الاسم إذا توفر، أو أيقونة المستخدم */}
            {user?.full_name ? (
              <span className="text-sm font-bold text-primary-foreground">
                {user.full_name.charAt(0)}
              </span>
            ) : (
              <User className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
          
          <div className="text-sm max-lg:hidden text-right">
            <p className="font-medium text-foreground">
              {user?.full_name || "مستخدم"}
            </p>
            
            <p className="text-muted-foreground text-xs">
              {/* الأولوية 1: النوع المحسوب من المصفوفة */}
              {myUserType?.user_type_name 
               /* الأولوية 2: النوع القادم مباشرة داخل كائن المستخدم */
               || (user as any)?.user_type?.user_type_name 
               /* الأولوية 3: الكود */
               || (user as any)?.user_type_code 
               /* الأخير: افتراضي */
               || "زائر"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}