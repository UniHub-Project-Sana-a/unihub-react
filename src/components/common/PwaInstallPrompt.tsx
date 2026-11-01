import React, { useState, useEffect } from "react";
import { Download, Smartphone, Share, X, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // تحقق مما إذا كان التطبيق مثبتاً بالفعل ويعمل بوضع standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // التحقق مما إذا كان الجهاز بنظام iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // الاستماع لحدث جاهزية تثبيت الـ PWA في متصفحات كروم وإيدج وأندرويد
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // إذا كان iOS ولم يكن مثبتاً، نظهر اقتراح التثبيت بعد ثانية واحدة
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    // في حال عدم دعم المتصفح للحدث التلقائي ولم يكن مثبتاً، نظهره أيضاً كاقتراح عام بعد ثانيتين
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone) {
        setIsVisible(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsVisible(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // إرشادات عامة إذا كان المتصفح لا يدعم التشغيل البرمجي للنافذة
      alert(
        "لتثبيت التطبيق: افتح قائمة خيارات المتصفح (⋮ في أعلى أو أسفل الشاشة) واضغط على 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'."
      );
    }
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-card/95 backdrop-blur-md border border-primary/30 shadow-2xl rounded-2xl p-4 text-card-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="flex-1 text-right">
            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>تثبيت تطبيق UniHub</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              ثبّت التطبيق الآن على جهازك للوصول السريع بدون متصفح وبأداء أسرع واستقبال الإشعارات!
            </p>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* إذا كان آيفون / iOS */}
        {isIOS ? (
          <div className="mt-3 p-2.5 bg-muted/50 rounded-xl text-xs text-muted-foreground space-y-1 border border-border/50 text-right">
            <p className="font-semibold text-foreground flex items-center gap-1">
              <Share className="w-3.5 h-3.5 text-primary" /> خطوات التثبيت على الآيفون:
            </p>
            <p>1. اضغط على زر المشاركة (Share) أسفل المتصفح.</p>
            <p>2. اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> 📲.</p>
          </div>
        ) : (
          /* أندرويد وكمبيوتر */
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md gap-1.5 h-9"
            >
              <Download className="w-4 h-4" />
              تثبيت التطبيق الآن
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
            >
              لاحقاً
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
