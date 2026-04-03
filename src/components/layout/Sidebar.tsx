import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { 
  Home, Users, GraduationCap, ChevronDown, LucideIcon,
  LayoutDashboard, BookOpen, MapPin, Award, UserCheck, Calendar, 
  Users2, Clock, FileBarChart, History, BadgeCheck
} from "lucide-react";
import logoSidebar from "@/assets/logo-sidebar.png";
import logoMini from "@/assets/logo-mini.png";

// 1. تعريف الواجهات لتجنب ts-ignore
interface SubItem {
  title: string;
  href: string;
}

interface SidebarItem {
  title: string;
  icon: LucideIcon;
  href: string;
  perm: string | null;
  subItems?: SubItem[];
  state?: { activeTab: string }; // خاص بتبويبات الكلية
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const { user: me } = useAuth();
  const { can } = usePermission();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // الوصول الآمن للبيانات
  // ملاحظة: تأكد من أن User Interface في AuthContext تدعم هذه الحقول
  const userRole = (me as any)?.user_type?.user_type_code || (me as any)?.user_type_code;
  const collegeId = (me as any)?.college_id;
  const isSuperUser = userRole === 'presidency' || userRole === 'admin';

  // 2. بناء القائمة ديناميكياً
  const menuItems: SidebarItem[] = useMemo(() => {
    // A. قائمة المشرف العام
    if (isSuperUser) {
      return [
        { title: "لوحة التحكم", icon: Home, href: "/", perm: null },
        { title: "الكليات", icon: GraduationCap, href: "/colleges", perm: null },
        {
          title: "إدارة المستخدمين",
          icon: Users,
          href: "/users",
          perm: null,
          subItems: [
            { title: "جميع المستخدمين", href: "/users" },
            { title: "الأدوار", href: "/users/roles" },
            { title: "التحكم في الوصول", href: "/users/access-control" }
          ]
        },
      ];
    }

    // B. قائمة موظفي الكلية
    if (collegeId) {
      const basePath = `/colleges/${collegeId}/dashboard`;
      
      const collegeItems = [
        { title: "لوحة التحكم", icon: LayoutDashboard, href: basePath, perm: "dashboard.view_college", tab: "colleges-dashboard" },
        { title: "المستخدمين", icon: Users, href: "/users", perm: "users.view" },
        { title: "الخطة الدراسية", icon: BookOpen, href: basePath, perm: "study_plan.view", tab: "departments" },
        { title: "القاعات", icon: MapPin, href: basePath, perm: "locations.view", tab: "classrooms" },
        { title: "الرتب الأكاديمية", icon: Award, href: basePath, perm: "academic_titles.view", tab: "academic-titles" },
        { title: "هيئة التدريس", icon: UserCheck, href: basePath, perm: "staff.view", tab: "Academic Staff" },
        { title: "الجدول الزمني", icon: Calendar, href: basePath, perm: "timetable.view_lectures", tab: "Timetable" },
        { title: "الفترات", icon: Clock, href: basePath, perm: "periods.view", tab: "periods" },
        { title: "التسجيل", icon: Users2, href: basePath, perm: "groups.view", tab: "Enrollment" },
        { title: "التقارير", icon: FileBarChart, href: basePath, perm: "reports.view_custom", tab: "Reports" },
        { title: "طلبات التعويض", icon: History, href: basePath, perm: "requests.view_makeup", tab: "MakeupRequests" },
        { title: "ضمان الجودة", icon: BadgeCheck, href: basePath, perm: "dashboard.view_college", tab: "QualityAssurance" },
      ];

      return collegeItems
        .filter(item => can(item.perm))
        .map(item => ({
          title: item.title,
          icon: item.icon,
          href: item.href,
          perm: item.perm,
          state: (item as any).tab ? { activeTab: (item as any).tab } : undefined
        }));
    }

    return [];
  }, [isSuperUser, collegeId, can]);

  const isCollapsed = !isMobile && !isOpen;

  const toggleExpanded = (title: string) => {
    if (isCollapsed) {
      onToggle();
      setTimeout(() => {
        setExpandedItems(prev => [...prev, title]);
      }, 150);
      return;
    }
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <aside 
      className={cn(
        "fixed top-0 right-0 h-full bg-sidebar shadow-xl z-40 transition-all duration-300 ease-in-out border-l border-sidebar-border flex flex-col",
        isMobile 
          ? (isOpen ? "w-64 translate-x-0" : "w-64 translate-x-full") 
          : (isOpen ? "w-64" : "w-[4.5rem]"), 
        isMobile && "z-50"
      )}
    >
      {/* Logo Area */}
      <div className={cn(
        "h-20 flex items-center border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm flex-shrink-0 transition-all duration-300 overflow-hidden justify-center px-0"
      )}>
        {isCollapsed ? (
          <img src={logoMini} alt="UniHub Mini" className="w-10 h-10 object-contain animate-in fade-in zoom-in duration-300" />
        ) : (
          <img src={logoSidebar} alt="UniHub" className="h-16 w-full object-contain animate-in fade-in slide-in-from-right-4 duration-300 px-4" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-4 px-3">
        <div className="space-y-2">
          {menuItems.map((item) => {
            // منطق التنشيط المحسن
            const currentTabState = (location.state as any)?.activeTab;
            
            const isActive = 
              // 1. القائمة الفرعية نشطة
              (item.subItems && item.subItems.some(sub => location.pathname === sub.href)) ||
              // 2. تطابق الرابط والتبويب (للكليات)
              (item.state && location.pathname === item.href && currentTabState === item.state.activeTab) ||
              // 3. تطابق الرابط فقط (للمسؤولين أو عند عدم وجود تبويب)
              (!item.state && !item.subItems && location.pathname === item.href);

            return (
              <div key={item.title} className="relative group">
                <div
                  className={cn(
                    "flex items-center py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative select-none",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-sidebar-foreground hover:bg-gray-100 hover:text-gray-900",
                    isCollapsed ? "justify-center px-0" : "justify-between px-3"
                  )}
                  onClick={() => {
                    if (item.subItems) {
                      toggleExpanded(item.title);
                    } else if (isMobile) {
                      onToggle();
                    }
                  }}
                >
                  <Link 
                    to={item.href} 
                    state={item.state} 
                    className={cn(
                      "flex items-center min-w-0",
                      !isCollapsed && "space-x-reverse space-x-3 flex-1" 
                    )}
                    onClick={(e) => {
                      if (item.subItems) e.preventDefault();
                      else if (isMobile) onToggle();
                    }}
                  >
                    <item.icon 
                      className={cn(
                        "flex-shrink-0 transition-all duration-300",
                        isCollapsed ? "w-6 h-6" : "w-5 h-5"
                      )} 
                    />
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 overflow-hidden mr-3">
                        <span className="font-semibold truncate text-sm">{item.title}</span>
                      </div>
                    )}
                  </Link>

                  {!isCollapsed && item.subItems && (
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200 opacity-70",
                        expandedItems.includes(item.title) && "rotate-180"
                      )} 
                    />
                  )}

                  {isCollapsed && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.title}
                      {/* مثلث التلميح (تم عكس الاتجاه ليتناسب مع RTL) */}
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                  )}
                </div>

                {/* Sub Items */}
                {!isCollapsed && item.subItems && expandedItems.includes(item.title) && (
                  <div className="mr-4 mt-1 border-r-2 border-gray-200 pr-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium",
                          location.pathname === subItem.href 
                            ? "text-primary bg-primary/10 border border-primary/20 shadow-sm" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                        onClick={() => isMobile && onToggle()}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          location.pathname === subItem.href ? "bg-primary" : "bg-gray-400"
                        )} />
                        <span className="truncate">{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}