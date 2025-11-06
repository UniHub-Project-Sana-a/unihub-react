import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pause, Play, StopCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { QRSettings, ActiveQRInfo, AttendanceRecord } from "@/pages/LecturerPage";

// وسّع واجهة Window لتعريف Echo
declare global {
  interface Window { Echo: any; }
}

interface QRFallbackViewProps {
  settings: QRSettings;
  initialQR: ActiveQRInfo;
  lectureId: string;
  onEndSession: (records: AttendanceRecord[]) => void;
}

export function QRFallbackView({
  settings,
  initialQR,
  lectureId,
  onEndSession,
}: QRFallbackViewProps) {
  const [currentQR, setCurrentQR] = useState(initialQR);
  const [timeLeft, setTimeLeft] = useState(0); // هذا هو `countdown`
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // دالة لتحديث الرمز
  const refreshQRCode = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await api.post('/v1/qr-codes/refresh', {
        qr_id: currentQR.qr_id,
        valid_minutes: settings.validMinutes,
      });
      // تحديث الرمز الحالي بالبيانات الجديدة
      setCurrentQR(res.data);
    } catch (error) {
      console.error("Failed to refresh QR code:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // تأثير لتشغيل العدادات والتحديث
  useEffect(() => {
    const startCountdown = () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      
      countdownIntervalRef.current = setInterval(() => {
        const expiryTime = new Date(currentQR.expires_at).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeLeft(remaining);
      }, 1000);
    };

    const startRefreshInterval = () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      
      refreshIntervalRef.current = setInterval(() => {
        refreshQRCode();
      }, settings.intervalSeconds * 1000);
    };

    if (!isPaused) {
      startCountdown();
      startRefreshInterval();
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [currentQR, isPaused, settings.intervalSeconds]);

  // تأثير للاستماع إلى تحديثات الحضور
  useEffect(() => {
    if (window.Echo) {
      const channel = window.Echo.channel(`lecture.${lectureId}`);
      channel.listen('.student.attended', (event: any) => {
        console.log('New attendance record via WebSocket:', event.record);
        const newRecord: AttendanceRecord = {
          studentName: event.record.student_name,
          studentId: event.record.student_id,
          scanTime: new Date(event.record.scan_time).toLocaleTimeString("ar-SA"),
          method: "QR",
        };
        setAttendance(prev => [...prev, newRecord]);
      });
        
      return () => {
        channel.stopListening('.student.attended');
        window.Echo.leave(`lecture.${lectureId}`);
      };
    }
  }, [lectureId]);

  // دالة الإيقاف المؤقت/الاستئناف
  const handlePauseToggle = () => {
    setIsPaused(prev => !prev);
  };

  // دالة إنهاء الجلسة
  const handleEndSession = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    onEndSession(attendance);
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative p-4 bg-white rounded-lg shadow-lg">
            <QRCode value={currentQR.qr_code_value} size={256} />
            {isRefreshing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xl px-6 py-3">
              يتغير خلال: {timeLeft} ثانية {/* <-- تم استخدام timeLeft */}
            </Badge>
            <Badge variant="secondary" className="text-xl px-6 py-3">
              عدد الطلاب: {attendance.length} / {settings.maxScans}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePauseToggle} // <-- الدالة موجودة الآن
            className="gap-2"
          >
            {isPaused ? (
              <> <Play className="w-4 h-4" /> استئناف </>
            ) : (
              <> <Pause className="w-4 h-4" /> إيقاف مؤقت </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndSession}
            className="gap-2"
          >
            <StopCircle className="w-4 h-4" />
            إنهاء الجلسة
          </Button>
        </div>
      </div>
    </div>
  );
}