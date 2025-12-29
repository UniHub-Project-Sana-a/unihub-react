// src/components/lecturer/QRFallbackView.tsx

import { useState, useEffect, useCallback } from "react"; 
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QRCode from "react-qr-code";
import { api } from "@/lib/api";
import { Loader2, Timer, Clock, Plus } from "lucide-react"; // ✅ تمت إضافة أيقونة Plus
import { useToast } from "@/hooks/use-toast";
import { AttendanceRecord, ActiveQRInfo } from "@/pages/LecturerPage";

interface QRSettings {
  intervalSeconds: number;
  validMinutes: number;
}
interface QRFallbackViewProps {
  settings: QRSettings;
  initialQR: ActiveQRInfo;
  lectureId: string;
  onEndSession: (records: AttendanceRecord[]) => void;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function QRFallbackView({ settings, initialQR, lectureId, onEndSession }: QRFallbackViewProps) {
  const { toast } = useToast();

  const [activeQR, setActiveQR] = useState<ActiveQRInfo>(initialQR);
  const [qrRefreshTimeLeft, setQrRefreshTimeLeft] = useState(settings.intervalSeconds);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(settings.validMinutes * 60);

  // ✅ --- إضافة حالة لتتبع عدد مرات التمديد ---
  const [extensionsCount, setExtensionsCount] = useState(0);
  const MAX_EXTENSIONS = 3;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleRefreshQR = useCallback(async () => {
    if (isRefreshing || isEnding) return; 
    
    setIsRefreshing(true);
    try {
      const res = await api.patch(`/v1/qr-codes/${activeQR.qr_id}/refresh`, {
        valid_minutes: settings.validMinutes,
      });
      
      const newQR: ActiveQRInfo = res.data.data;
      setActiveQR(newQR);
      console.log("QR Code refreshed successfully:", newQR);
      
    } catch (error) {
      console.error("Failed to refresh QR code:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeQR.qr_id, isRefreshing, isEnding, settings.validMinutes]); 

    const handleEndSession = async (isAutoEnd: boolean = false) => {
    if (isEnding) return;
    setIsEnding(true);
    
    try {
      console.log(`Ending QR session with ID: ${activeQR.qr_id}`);
      await api.patch(`/v1/qr-codes/${activeQR.qr_id}/end`);
      console.log("QR session ended successfully on the server.");

      console.log(`Fetching attendance records for timetable_id: ${lectureId}`);
      
      // ✅ 1. تحديد تاريخ اليوم لضمان جلب حضور هذه الجلسة فقط
      const today = new Date().toISOString().split('T')[0];

      const attendanceRes = await api.get(`/v1/student-attendance`, {
        params: { 
            timetable_id: lectureId,
            attendance_date: today, // ✅ الفلترة بالتاريخ
            per_page: 1000          // ✅ ضمان جلب جميع الطلاب (تجاوز تقسيم الصفحات)
        } 
      });
      console.log("Attendance records fetched successfully.");

      const records: AttendanceRecord[] = attendanceRes.data?.data || [];

      if (!isAutoEnd) {
        toast({
          title: "انتهت الجلسة",
          description: `تم تسجيل حضور ${records.length} طالبًا.`,
        });
      }

      onEndSession(records);

    } catch (error: any) {
      console.error("Failed to end session:", error.response?.data || error);

      const errorMessage = 
        error.response?.data?.error ||   
        error.response?.data?.message || 
        "فشل إنهاء الجلسة. يرجى المحاولة مرة أخرى."; 

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      setIsEnding(false); 
    }
  };

  // ✅ --- دالة تمديد الوقت ---
  const handleExtendSession = async () => {
    if (extensionsCount >= MAX_EXTENSIONS) return;

    try {
        // 1. طلب التمديد من السيرفر
        await api.patch(`/v1/qr-codes/${activeQR.qr_id}/extend`);

        // 2. إذا نجح السيرفر، نحدث الواجهة
        setSessionTimeLeft((prev) => prev + 60);
        setExtensionsCount((prev) => prev + 1);

        toast({
            title: "تم التمديد",
            description: `تم إضافة دقيقة واحدة بنجاح. (متبقي ${MAX_EXTENSIONS - (extensionsCount + 1)} محاولات)`,
            variant: "default", // لون أخضر أو عادي
        });

    } catch (error) {
        console.error("فشل تمديد الوقت", error);
        toast({
            title: "فشل التمديد",
            description: "حدث خطأ أثناء محاولة تمديد الوقت في السيرفر.",
            variant: "destructive",
        });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setQrRefreshTimeLeft(prev => {
        if (prev <= 1) {
          handleRefreshQR();
          return settings.intervalSeconds;
        }
        return prev - 1;
      });

      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          handleEndSession(true); 
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.intervalSeconds, handleRefreshQR, handleEndSession]); 

  const qrProgress = (qrRefreshTimeLeft / settings.intervalSeconds) * 100;

    // هل الوقت المتبقي 30 ثانية أو أقل؟
  const isTimeLow = sessionTimeLeft <= 30;
  
  // هل وصل للحد الأقصى من التمديد؟
  const isLimitReached = extensionsCount >= MAX_EXTENSIONS;

  // هل يمكن الضغط على الزر الآن؟
  // الشرط: الوقت قليل + لم يصل للحد الأقصى + الجلسة لا يتم إنهاؤها حالياً
  const canExtend = isTimeLow && !isLimitReached && !isEnding;

  return (
    <div className="flex flex-col items-center gap-6">
      <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
        <QRCode value={activeQR.qr_code_value} size={256} />
      </div>

      <div className="w-full max-w-sm text-center space-y-4">
        <div>
          <div className="flex items-center justify-center gap-2 text-lg font-mono">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <span>يتغير الرمز خلال: {qrRefreshTimeLeft} ثانية</span>
          </div>
          <Progress value={qrProgress} className="mt-1 h-2" />
        </div>
        
        <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            <span>الوقت المتبقي: {formatTime(sessionTimeLeft)}</span>
        </div>
      </div>

      {/* ✅ --- منطقة الأزرار المعدلة --- */}
      <div className="flex flex-col w-full max-w-xs gap-3">
        
        {/* زر التمديد الذكي */}
        <Button 
            onClick={handleExtendSession} 
            variant="outline" 
            className={`w-full gap-2 transition-all duration-300 ${
                canExtend 
                ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" // ستايل عندما يكون متاحاً
                : "border-primary/20"
            }`}
            disabled={!canExtend} // 🔒 معطل إلا إذا تحقق الشرط
        >
            {isLimitReached ? (
                // الحالة 1: استنفذ مرات التمديد
                <span className="text-destructive flex items-center gap-2">
                    تم استنفاذ مرات التمديد ({MAX_EXTENSIONS}/{MAX_EXTENSIONS})
                </span>
            ) : !isTimeLow ? (
                // الحالة 2: الوقت ما زال طويلاً
                <span className="text-muted-foreground flex items-center gap-2">
                    التمديد متاح في آخر 30 ثانية
                </span>
            ) : (
                // الحالة 3: متاح للتمديد
                <>
                    <Plus className="w-4 h-4" />
                    تمديد دقيقة ({extensionsCount}/{MAX_EXTENSIONS})
                </>
            )}
        </Button>

        {/* زر الإنهاء */}
        <Button onClick={() => handleEndSession(false)} variant="destructive" disabled={isEnding} className="w-full">
            {isEnding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            إنهاء الجلسة الآن
        </Button>
      </div>
    </div>
  );
}