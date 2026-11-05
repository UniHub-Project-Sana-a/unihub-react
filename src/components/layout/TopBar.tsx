// src/components/layout/TopBar.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Menu, Settings, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAuthToken, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StudentNotificationsModal, { AnnouncementItem } from "@/components/student/StudentNotificationsModal";

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const navigate = useNavigate();
  const { user, myUserType } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // حالة الإشعارات والتنبيهات للدكاترة
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isLecturer = Boolean(user?.is_lecturer || user?.lecturer_id || user?.lecturer);
  const userRole = (user?.user_type?.user_type_code || user?.user_type_code || myUserType?.user_type_code || '').toLowerCase();
  const isMultiRole = isLecturer && userRole !== 'lecturer';
  const isStudent = userRole === 'student' || Boolean((user as any)?.student_id || (user as any)?.student);

  // دالة جلب الإعلانات وحساب غير المقروء
  const fetchAnnouncements = useCallback(async () => {
    if (!isStudent) return;
    try {
      const res = await api.get("/v1/student/announcements");
      const list: AnnouncementItem[] = res.data?.announcements || [];
      setAnnouncements(list);

      let readIds: number[] = [];
      try {
        const raw = localStorage.getItem("unihub_read_announcements");
        if (raw) readIds = JSON.parse(raw);
      } catch {}

      const unread = list.filter((i) => !readIds.includes(i.id)).length;
      setUnreadCount(unread);
    } catch (e) {
      console.warn("Failed to fetch student announcements in TopBar:", e);
    }
  }, [isStudent]);

  useEffect(() => {
    if (isStudent) {
      fetchAnnouncements();

      // فحص دوري كل دقيقة للتنبيهات الجديدة القادمة من الدكاترة
      const interval = setInterval(fetchAnnouncements, 60000);

      const handleReadSync = () => {
        let readIds: number[] = [];
        try {
          const raw = localStorage.getItem("unihub_read_announcements");
          if (raw) readIds = JSON.parse(raw);
        } catch {}
        setAnnouncements((prev) => {
          const unread = prev.filter((i) => !readIds.includes(i.id)).length;
          setUnreadCount(unread);
          return prev;
        });
      };

      window.addEventListener("unihub:announcements-read", handleReadSync);
      window.addEventListener("unihub:announcements-updated", fetchAnnouncements);

      return () => {
        clearInterval(interval);
        window.removeEventListener("unihub:announcements-read", handleReadSync);
        window.removeEventListener("unihub:announcements-updated", fetchAnnouncements);
      };
    }
  }, [isStudent, fetchAnnouncements]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/v1/auth/logout");
    } catch (error) {
      console.warn("Logout API failed, forcing local logout.");
    }
    if (setAuthToken) {
      setAuthToken(null);
    }
    // تنظيف التخزين المحلي
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.hash = "/login";
  };

  return (
    <header className="h-16 bg-card shadow-lg border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-reverse space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="hover:bg-accent"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center space-x-reverse space-x-3 sm:space-x-4">
        {/* زر التبديل الذكي لوضع التدريس للمسؤولين الممارسين للتدريس */}
        {isMultiRole && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/lecturer')}
            className="gap-2 border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 font-semibold shadow-xs transition-all h-9 px-3"
            title="الانتقال إلى واجهة المحاضر ورصد الدرجات والتحضير"
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">واجهة المحاضر (التدريس)</span>
            <span className="sm:hidden">المحاضر</span>
          </Button>
        )}

        {/* أيقونة تنبيهات وإعلانات الدكاترة في الـ Header للطلاب */}
        {isStudent && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotificationsModal(true)}
              className="relative hover:bg-accent text-foreground h-9 w-9 rounded-full transition-all"
              aria-label="تنبيهات وإعلانات الدكاترة"
              title={unreadCount > 0 ? `لديك ${unreadCount} تنبيهات غير مقروءة من الدكاترة` : "تنبيهات وإعلانات الدكاترة"}
            >
              <Bell className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? "+99" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        )}

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

        {/* بيانات المستخدم التعريفيّة في الهيدر */}
        <div className="flex items-center space-x-reverse space-x-3 pr-3 sm:pr-4 border-r border-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-xs">
            {user?.full_name ? (
              <span className="text-sm font-bold text-primary-foreground">
                {user.full_name.charAt(0)}
              </span>
            ) : (
              <User className="w-4 h-4 text-primary-foreground" />
            )}
          </div>

          <div className="text-sm max-lg:hidden text-right">
            <p className="font-semibold text-foreground leading-tight">
              {user?.full_name || "مستخدم"}
            </p>

            <p className="text-muted-foreground text-xs">
              {myUserType?.user_type_name
                || (user as any)?.user_type?.user_type_name
                || (user as any)?.user_type_code
                || "طالب"}
            </p>
          </div>
        </div>
      </div>

      {/* نافذة تنبيهات وإعلانات الدكاترة المنبثقة من الـ Header */}
      {isStudent && (
        <StudentNotificationsModal
          open={showNotificationsModal}
          onClose={() => {
            setShowNotificationsModal(false);
            fetchAnnouncements();
          }}
          announcements={announcements}
          onRefresh={fetchAnnouncements}
        />
      )}
    </header>
  );
}
