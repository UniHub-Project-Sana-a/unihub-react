import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, Users, GraduationCap, Settings, ChevronDown, 
  // ... باقي الأيقونات
} from "lucide-react";
import logoSidebar from "@/assets/logo-sidebar.png";
import logoMini from "@/assets/logo-mini.png";

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
      { title: "التحكم في الوصول", href: "/users/access-control" }
    ]
  },
  {
    title: "الإعدادات",
    icon: Settings,
    href: "/settings",
    badge: null,
    subItems: undefined
  },
];

export function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // حالة القائمة المنكمشة (فقط في الديسك توب وعندما تكون مغلقة)
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
        // منطق العرض:
        // موبايل: إما 64 (مفتوح) أو 0 (مخفي)
        // ديسك توب: إما 64 (مفتوح) أو أيقونات فقط (منكمش)
        isMobile 
          ? (isOpen ? "w-64 translate-x-0" : "w-64 translate-x-full") // للموبايل نستخدم translate للإخفاء السلس
          : (isOpen ? "w-64" : "w-[4.5rem]"), 
        isMobile && "z-50"
      )}
    >
            {/* Logo Area */}
      <div className={cn(
        // أبقينا ارتفاع الصندوق h-20 كما طلبت (لم نكبر الصندوق)
        "h-20 flex items-center border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm flex-shrink-0 transition-all duration-300 overflow-hidden",
        
        // إزالة الـ Padding تماماً (px-0) لنسمح للصورة أن تأخذ راحتها في المساحة
        "justify-center px-0"
      )}>
        {isCollapsed ? (
          <img 
            src={logoMini} 
            alt="UniHub Mini" 
            // الشعار الصغير:
            // w-12 h-12 (48px)
            // هذا حجم كبير ومناسب جداً للسايدبار المنكمش
            className="w-full h-59 object-contain animate-in fade-in zoom-in duration-300"
          />
        ) : (
          <img 
            src={logoSidebar} 
            alt="UniHub" 
            // الشعار الكبير:
            // h-16 (64px) من أصل h-20 (80px) المتاحة في الصندوق
            // هذا يعني أن الصورة ستملأ الصندوق بالكامل تقريباً مع هامش بسيط جداً
            className="h-21 w-full object-contain animate-in fade-in slide-in-from-right-4 duration-300" 
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-4 px-3">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || item.subItems?.some(sub => sub.href === location.pathname);
            
            return (
              <div key={item.title} className="relative group">
                {/* Main Item */}
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
                        {item.badge && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
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

                  {/* Tooltip on Hover (Collapsed Mode) */}
                  {isCollapsed && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.title}
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                  )}
                </div>

                {/* Sub Items Dropdown - تحسين الألوان هنا */}
                {!isCollapsed && item.subItems && expandedItems.includes(item.title) && (
                  <div className="mr-4 mt-1 border-r-2 border-gray-200 pr-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium",
                          // 🔥 تحسين التباين: ألوان أغمق وأوضح 🔥
                          location.pathname === subItem.href 
                            ? "text-primary bg-primary/10 border border-primary/20 shadow-sm" // الحالة النشطة
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100" // الحالة العادية
                        )}
                        onClick={() => isMobile && onToggle()}
                      >
                        {/* نقطة صغيرة لتمييز القوائم */}
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