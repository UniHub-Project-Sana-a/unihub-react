// src/components/lecturer/QRFallbackView.tsx

import { useState, useEffect, useCallback } from "react"; // استيراد useCallback
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QRCode from "react-qr-code";
import { api } from "@/lib/api";
import { Loader2, Timer, Clock } from "lucide-react";
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // ✅ --- التعديل هنا: إضافة دالة handleRefreshQR --- ✅
  const handleRefreshQR = useCallback(async () => {
    if (isRefreshing || isEnding) return; // لا تقم بالتحديث إذا كانت هناك عملية أخرى جارية
    
    setIsRefreshing(true);
    try {
      const res = await api.patch(`/v1/qr-codes/${activeQR.qr_id}/refresh`, {
        // نرسل مدة صلاحية الرمز الجديد ليقوم الخادم بحساب expires_at
        valid_minutes: settings.validMinutes,
      });
      
      const newQR: ActiveQRInfo = res.data.data;
      
      // تحديث حالة الـ QR بالبيانات الجديدة من الخادم
      setActiveQR(newQR);
      console.log("QR Code refreshed successfully:", newQR);
      
    } catch (error) {
      console.error("Failed to refresh QR code:", error);
      // في حال فشل التحديث، سيكمل المؤقت وسيتم محاولة التحديث في الدورة التالية
    } finally {
      setIsRefreshing(false);
    }
  }, [activeQR.qr_id, isRefreshing, isEnding, settings.validMinutes]); // إضافة الاعتماديات

    const handleEndSession = async (isAutoEnd: boolean = false) => {
    if (isEnding) return;
    setIsEnding(true);
    
    try {
      // الخطوة 1: إنهاء جلسة الـ QR
      console.log(`Ending QR session with ID: ${activeQR.qr_id}`);
      await api.patch(`/v1/qr-codes/${activeQR.qr_id}/end`);
      console.log("QR session ended successfully on the server.");

      // الخطوة 2: جلب سجلات الحضور
      console.log(`Fetching attendance records for timetable_id: ${lectureId}`);
      const attendanceRes = await api.get(`/v1/student-attendance`, {
        params: { timetable_id: lectureId } 
      });
      console.log("Attendance records fetched successfully.");

      const records: AttendanceRecord[] = attendanceRes.data?.data || [];

      if (!isAutoEnd) {
        toast({
          title: "انتهت الجلسة",
          description: `تم تسجيل حضور ${records.length} طالبًا.`,
        });
      }

      // الخطوة 3: استدعاء الدالة الأم وتمرير سجلات الحضور
      onEndSession(records);

    } catch (error: any) {
      // ✅ --- التعديل هنا: لعرض الخطأ الفعلي --- ✅
      console.error("Failed to end session:", error.response?.data || error);

      // استخلاص رسالة الخطأ من استجابة Laravel
      const errorMessage = 
        error.response?.data?.error ||   // رسالة الخطأ من 'error'
        error.response?.data?.message || // رسالة الخطأ من 'message'
        "فشل إنهاء الجلسة. يرجى المحاولة مرة أخرى."; // رسالة احتياطية

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      // السماح للمستخدم بالمحاولة مرة أخرى في حال الفشل
      setIsEnding(false); 
    }
  };// إضافة الاعتماديات

  // المؤقت الرئيسي الذي يعمل كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      // تحديث عداد تحديث الـ QR
      setQrRefreshTimeLeft(prev => {
        if (prev <= 1) {
          handleRefreshQR();
          return settings.intervalSeconds;
        }
        return prev - 1;
      });

      // تحديث عداد الجلسة الكلي
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          handleEndSession(true); // إنهاء الجلسة تلقائيًا
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.intervalSeconds, handleRefreshQR, handleEndSession]); // إضافة الدوال إلى الاعتماديات

  const qrProgress = (qrRefreshTimeLeft / settings.intervalSeconds) * 100;

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

      <Button onClick={() => handleEndSession(false)} variant="destructive" disabled={isEnding}>
        {isEnding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        إنهاء الجلسة الآن
      </Button>
    </div>
  );
}