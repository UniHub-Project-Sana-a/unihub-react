
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, Users, Calendar, GraduationCap, FileText, 
  BarChart3, Settings, ChevronDown, 
  Clock, DollarSign, Database, BookOpen, UserCog,
  ClipboardList, Shield, Plug, History, Upload, Eye, 
  Link as LinkIcon, RefreshCw, Activity, TrendingUp
} from "lucide-react";
import logoSidebar from "@/assets/logo-sidebar.png";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const menuItems = [
  {
    title: "لوحة التحكم",
    icon: Home,
    href: "/",
    badge: null,
    subItems: undefined
  },
  {
    title: "الكليات",
    icon: GraduationCap,
    href: "/colleges",
    badge: null,
    subItems: undefined
  },
  {
    title: "إدارة المستخدمين",
    icon: Users,
    href: "/users",
    badge: null,
    subItems: [
      { title: "جميع المستخدمين", href: "/users" },
      { title: "الأدوار والصلاحيات", href: "/users/roles" },
      { title: "التحكم في الوصول", href: "/users/access-control" }
    ]
  },
  {
    title: "الجدول الزمني",
    icon: Calendar,
    href: "/timetable",
    badge: null,
    subItems: [
      { title: "استيراد الجدول", href: "/timetable" },
      { title: "عرض الجدول", href: "/timetable" },
      { title: "ربط المقررات", href: "/timetable/course-mapping" }
    ]
  },
  {
    title: "تسجيل الطلاب",
    icon: ClipboardList,
    href: "/enrollment/import-students",
    badge: null,
    subItems: [
      { title: "استيراد الطلاب", href: "/enrollment/import" },
      { title: "إدارة المجموعات", href: "/enrollment/groups" },
      { title: "تعيين المقررات", href: "/enrollment" }
    ]
  },
  {
    title: "إدارة الأعذار",
    icon: Clock,
    href: "/excuse/pending-requests",
    badge: null,
    subItems: [
      { title: "الطلبات المعلّقة", href: "/excuses" },
      { title: "تسويات الرواتب", href: "/excuses/pending" }
    ]
  },
  {
    title: "التقارير",
    icon: BarChart3,
    href: "/reports",
    badge: null,
    subItems: [
      { title: "التقارير المالية", href: "/reports" },
      { title: "عبء التدريس", href: "/reports/teaching" },
      { title: "الحضور والغياب", href: "/reports/attendance" },
      { title: "نظرة عامة على الدرجات", href: "/reports/grades-overview" }
    ]
  },
  {
    title: "التكامل",
    icon: Plug,
    href: "/integration/mobile-sync",
    badge: null,
    subItems: [
      { title: "مزامنة الجوال", href: "/integration/mobile" },
      { title: "حالة واجهة البرمجة (API)", href: "/integration/api-status" },
      { title: "المراقبة الفورية", href: "/integration/real-time" }
    ]
  },
  {
    title: "إدارة المقررات",
    icon: BookOpen,
    href: "/course-management",
    badge: null,
    subItems: [
      { title: "عرض الأقسام", href: "/course-management" },
      { title: "تقارير الدرجات", href: "/course-management/grade-reports" },
      { title: "تصدير البيانات", href: "/course-management/export" }
    ]
  },
  {
    title: "سجل التدقيق",
    icon: History,
    href: "/auditlog",
    badge: null,
    subItems: undefined
  },
  {
    title: "الإعدادات",
    icon: Settings,
    href: "/settings",
    badge: null,
    subItems: undefined
  },
  {
    title: "أعضاء الهيئة الأكاديمية",
    icon: UserCog,
    href: "/academic-staff",
    badge: null,
    subItems: undefined
  }
];

export function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full bg-sidebar shadow-2xl z-40 transition-all duration-300 border-l border-sidebar-border flex flex-col",
      isOpen ? "w-64" : isMobile ? "w-0 overflow-hidden" : "w-16",
      isMobile && "z-50"
    )}>
      {/* Logo */}
      <div className="h-20 flex items-center justify-center px-[25px] border-b border-sidebar-border bg-sidebar flex-shrink-0">
        <img src={logoSidebar} alt="UniHub" className="w-full h-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent hover:scrollbar-thumb-sidebar-accent/80 pt-4 sm:pt-6 px-2 sm:px-3 pb-6">
        <div className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => (
            <div key={item.title} className="mb-1 sm:mb-2">
              <div
                className={cn(
                  "flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 cursor-pointer group",
                  location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground shadow-md",
                  (!isOpen && !isMobile) && "justify-center",
                  "text-sm sm:text-base"
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
                  className="flex items-center space-x-reverse space-x-2 sm:space-x-3 flex-1 min-w-0"
                  onClick={(e) => {
                    if (item.subItems) {
                      e.preventDefault();
                    } else if (isMobile) {
                      onToggle();
                    }
                  }}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  {(isOpen || isMobile) && (
                    <>
                      <span className="font-medium truncate">{item.title}</span>
                      {item.badge && (
                        <span className="bg-destructive/10 text-destructive text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
                {(isOpen || isMobile) && item.subItems && (
                  <ChevronDown 
                    className={cn(
                      "w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0",
                      expandedItems.includes(item.title) && "rotate-180"
                    )} 
                  />
                )}
              </div>

              {/* Sub Items */}
              {(isOpen || isMobile) && item.subItems && expandedItems.includes(item.title) && (
                <div className="mr-4 sm:mr-6 mt-1 sm:mt-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      to={subItem.href}
                      className={cn(
                        "block px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent rounded-lg transition-colors duration-200",
                        location.pathname === subItem.href && "text-sidebar-accent-foreground bg-sidebar-accent"
                      )}
                      onClick={() => isMobile && onToggle()}
                    >
                      <span className="truncate">{subItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
