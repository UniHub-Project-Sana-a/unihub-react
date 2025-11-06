import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات
import { LecturerWelcome } from "@/components/lecturer/LecturerWelcome";
import { LectureSchedule } from "@/components/lecturer/LectureSchedule";
import { StartQRModal, QRFormSettings } from "@/components/lecturer/StartQRModal";
import { QRSessionView } from "@/components/lecturer/QRSessionView";
import { AttendanceSummary } from "@/components/lecturer/AttendanceSummary";

// --- واجهات الأنواع (Types) ---
// هذه الواجهة هي نفسها QRFormSettings لكن بدون بيانات الموقع، يمكنك توحيدها لاحقًا
export interface QRSettings {
  intervalSeconds: number;
  validMinutes: number;
  maxScans: number;
  latitude: number;
  longitude: number;
  allowedDistance: number;
}

// الواجهة التي تصف بيانات الرمز النشط القادم من الـ API
export interface ActiveQRInfo {
  qr_id: number;
  qr_code_value: string;
  expires_at: string;
}

// الواجهة التي تصف المحاضرة في جدول العرض
export interface Lecture {
  id: string; // entry_id
  title: string;
  date: string;
  time: string;
  groupName: string;
  isCurrent: boolean;
}

// الواجهة التي تصف سجل حضور طالب
export interface AttendanceRecord {
  studentName: string;
  studentId: string; // academic_number
  scanTime: string;
  method: "QR" | "يدوي";
}

// دالة لتطبيع أسماء الأيام لضمان التطابق
const normalizeDayName = (name?: string): string => {
  if (!name) return "";
  const s = name.trim().replace(/أ|إ|آ/g, "ا").toLowerCase();
  const map: Record<string, string> = {
    "الاحد": "الأحد", "الاثنين": "الاثنين", "الثلاثاء": "الثلاثاء",
    "الاربعاء": "الأربعاء", "الخميس": "الخميس", "الجمعه": "الجمعة", "السبت": "السبت",
  };
  for (const key in map) {
    if (s.includes(key)) return map[key];
  }
  return name;
};

export default function LecturerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSessionActive, setQrSessionActive] = useState(false);
  const [qrSettings, setQrSettings] = useState<QRSettings | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQR, setActiveQR] = useState<ActiveQRInfo | null>(null);

  const lecturerName = user?.full_name || "محاضر";

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const res = await api.get('/v1/lecturer/schedule');
        const entries = res.data?.data || [];
        
        const now = new Date();
        const todayDayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(now);
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const formattedLectures = entries.map((entry: any): Lecture => {
          const startTimeStr = entry.period?.start_time?.slice(0, 5) || '00:00';
          const endTimeStr = entry.period?.end_time?.slice(0, 5) || '00:00';

          const [startH, startM] = startTimeStr.split(':').map(Number);
          const startTotalMinutes = startH * 60 + startM;
          const [endH, endM] = endTimeStr.split(':').map(Number);
          const endTotalMinutes = endH * 60 + endM;

          const lectureDayName = normalizeDayName(entry.day?.day_name_ar || entry.day?.day_name);
          const todayDayNameNormalized = normalizeDayName(todayDayName);
          const isToday = lectureDayName === todayDayNameNormalized;
          const isCurrentTime = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
          const isCurrent = isToday && isCurrentTime;
          
          return {
            id: String(entry.entry_id),
            title: entry.course?.course_name || 'مادة غير محددة',
            groupName: entry.group?.group_name || 'مجموعة غير محددة',
            date: lectureDayName,
            time: `${startTimeStr} - ${endTimeStr}`,
            isCurrent: isCurrent,
          };
        });
        setLectures(formattedLectures);
      } catch (error) {
        console.error("Failed to fetch lecturer schedule:", error);
        setLectures([]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleStartQR = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowQRModal(true);
  };

  const handleQRModalSubmit = async (settings: QRFormSettings) => {
    if (!selectedLecture) {
      console.error("handleQRModalSubmit: No lecture selected!");
      return;
    }
  
    setIsLoading(true);
    console.log("Step 1: Submitting QR settings...", settings);
  
    try {
      const payload = {
        entry_id: Number(selectedLecture.id),
        ...settings,
      };
  
      const res = await api.post('/v1/qr-codes/start-session', payload);
      const firstQrCode = res.data;
  
      console.log("Step 2: API response received", firstQrCode);
  
      if (!firstQrCode || !firstQrCode.qr_code_value) {
        throw new Error("Invalid response from start-session API");
      }
  
      const newActiveQR: ActiveQRInfo = {
        qr_id: firstQrCode.qr_id,
        qr_code_value: firstQrCode.qr_code_value,
        expires_at: firstQrCode.expires_at,
      };
  
      // هذا الجزء هو الأهم: تحديث الحالات لبدء الجلسة
      setActiveQR(newActiveQR);
      setQrSettings(settings);
      setShowQRModal(false);
      setQrSessionActive(true);
      setSessionEnded(false);
      setAttendanceRecords([]);
  
      console.log("Step 3: Session state updated. QR session should be active.");
  
    } catch (error) {
      console.error("Failed to start QR session:", error);
      toast({ // استخدم التوست لإظهار الخطأ للمستخدم
        title: "فشل بدء الجلسة",
        description: (error as any)?.response?.data?.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    setQrSessionActive(false);
    setSessionEnded(true);
  };

  const handleAddManualAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => [...prev, record]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {!qrSessionActive && !sessionEnded && (
          <>
            <LecturerWelcome name={lecturerName} />
            {isLoadingSchedule ? (
              <div className="text-center p-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">جاري تحميل جدول المحاضرات...</p>
              </div>
            ) : (
              <LectureSchedule lectures={lectures} onStartQR={handleStartQR} />
            )}
          </>
        )}

        {qrSessionActive && qrSettings && selectedLecture && activeQR && (
          <QRSessionView
            settings={{...qrSettings, latitude: 0, longitude: 0, allowedDistance: 0}} // QRSettings تحتاج لبيانات الموقع
            lectureTitle={selectedLecture.title}
            groupName={selectedLecture.groupName}
            lectureId={selectedLecture.id}
            initialQR={activeQR}
            onEndSession={handleEndSession}
          />
        )}

        {sessionEnded && selectedLecture && (
          <AttendanceSummary
            records={attendanceRecords}
            onAddManual={handleAddManualAttendance}
            lectureTitle={selectedLecture.title}
            groupName={selectedLecture.groupName}
            lectureId={selectedLecture.id}
          />
        )}

        <StartQRModal
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
          onSubmit={handleQRModalSubmit}
        />
      </div>
    </div>
  );
}