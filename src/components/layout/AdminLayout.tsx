import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // نجعلها true افتراضياً لتظهر القائمة مفتوحة عند بدء التشغيل في الديسك توب
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // إذا تحولنا من موبايل إلى ديسك توب، نفتح القائمة تلقائياً
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
      // إذا تحولنا لموبايل، نغلق القائمة
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []); // أزلنا sidebarOpen من المصفوفة لتجنب التكرار اللانهائي

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-background to-primary/5 flex w-full" dir="rtl">
      
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        isMobile={isMobile} 
      />
      
      {/* Mobile overlay - يظهر فقط في الموبايل عند فتح القائمة */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
        // منطق الهوامش الجديد:
        // موبايل: بدون هامش
        // ديسك توب مفتوح: 64 (256px)
        // ديسك توب مغلق: 4.5rem (72px) ليطابق عرض السايدبار المنكمش
        isMobile 
          ? "mr-0 w-full" 
          : (sidebarOpen ? "mr-64 w-[calc(100%-16rem)]" : "mr-[4.5rem] w-[calc(100%-4.5rem)]")
      )}>
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-full mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}