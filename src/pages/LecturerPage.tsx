import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// استيراد المكونات الفرعية
import { LecturerWelcome } from "@/components/lecturer/LecturerWelcome";
import { LectureSchedule } from "@/components/lecturer/LectureSchedule";
import { StartQRModal, QRFormSettings } from "@/components/lecturer/StartQRModal";
import { QRSessionView } from "@/components/lecturer/QRSessionView";
import { AttendanceSummary } from "@/components/lecturer/AttendanceSummary";

// --- واجهات الأنواع (Types) ---
export interface ActiveQRInfo {
  qr_id: number;
  qr_code_value: string;
  expires_at: string;
}
export interface ClassroomInfo {
  latitude: number | null;
  longitude: number | null;
  allowed_distance: number | null;
}
export interface Lecture {
  id: string; // timetable_id
  title: string;
  date: string;
  time: string;
  groupName: string;
  groupId: string;
  isCurrent: boolean;
  isAttended: boolean;
  classroom: ClassroomInfo;
}
export interface AttendanceRecord {
  studentName: string;
  studentId: string;
  scanTime: string;
  method: "QR" | "يدوي";
}

const normalizeDayName = (name?: string): string => {
  if (!name) return "";
  const s = name.trim().replace(/أ|إ|آ/g, "ا").toLowerCase();
  const map: Record<string, string> = {
    "الاحد": "الأحد", "الاثنين": "الاثنين", "الثلاثاء": "الثلاثاء",
    "الاربعاء": "الأربعاء", "الخميس": "الخميس", "الجمعه": "الجمعة", "السبت": "السبت",
  };
  for (const key in map) { if (s.includes(key)) return map[key]; }
  return name;
};

// --- المكون الرئيسي ---
export default function LecturerPage() {
  // --- 1. Hooks والحالات ---
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSessionActive, setQrSessionActive] = useState(false);
  const [qrSettings, setQrSettings] = useState<QRFormSettings | null>(null);
  const [activeQR, setActiveQR] = useState<ActiveQRInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);

  const lecturerName = user?.full_name || "محاضر";

  // --- 2. الدوال الرئيسية ---

  // دالة جلب الجدول
  const fetchSchedule = useCallback(async () => {
    if (!user?.user_id) {
      setIsLoadingSchedule(false);
      return;
    }
    
    setIsLoadingSchedule(true);
    try {
      const lecturerRes = await api.get(`/v1/lecturers`, { params: { user_id: user.user_id } });
      const lecturerData = (lecturerRes.data?.data || lecturerRes.data || [])[0];
      if (!lecturerData?.lecturer_id) {
        setLectures([]);
        setIsLoadingSchedule(false);
        return;
      }
      const lecturerId = lecturerData.lecturer_id;

      const [timetableRes, lecturerAttendanceRes] = await Promise.all([
          api.get(`/v1/timetable`, { params: { lecturer_id: lecturerId, with: 'course,group,day,period,classroom' } }),
          api.get(`/v1/lecturer-attendance`, { params: { lecturer_id: lecturerId } })
      ]);
      
      const entries = timetableRes.data?.data || timetableRes.data || [];
      const attendedTimetableIds = new Set((lecturerAttendanceRes.data?.data || []).map((att: any) => att.timetable_id));
      
      const now = new Date();
      const todayDayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(now);
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const formattedLectures = entries.map((entry: any): Lecture => {
        const lectureDayName = normalizeDayName(entry.day?.day_name);
        const startTimeStr = entry.period?.start_time?.slice(0, 5) || '00:00';
        const endTimeStr = entry.period?.end_time?.slice(0, 5) || '00:00';
        const [startH, startM] = startTimeStr.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const [endH, endM] = endTimeStr.split(':').map(Number);
        const endTotalMinutes = endH * 60 + endM;
        
        const isToday = lectureDayName === normalizeDayName(todayDayName);
        const isCurrentTime = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;

        return {
          id: String(entry.timetable_id),
          title: entry.course?.course_name || 'مادة غير محددة',
          groupName: entry.group?.group_name || 'مجموعة غير محددة',
          groupId: String(entry.group?.group_id),
          date: lectureDayName,
          time: `${startTimeStr} - ${endTimeStr}`,
          isCurrent: isToday && isCurrentTime,
          isAttended: attendedTimetableIds.has(entry.timetable_id),
          classroom: {
            latitude: entry.classroom?.latitude ?? null,
            longitude: entry.classroom?.longitude ?? null,
            allowed_distance: entry.classroom?.allowed_distance ?? null,
          },
        };
      });
      setLectures(formattedLectures);
    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل تحميل الجدول الزمني.", variant: "destructive"});
      setLectures([]);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [user, toast]);

  // استدعاء دالة جلب الجدول عند تحميل المكون
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // --- 3. معالجات الأحداث (Event Handlers) ---

  const handleStartQR = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowQRModal(true);
  };

  const handleQRModalSubmit = async (settings: QRFormSettings) => {
    if (!selectedLecture) {
      toast({ title: "خطأ", description: "لم يتم تحديد أي محاضرة.", variant: "destructive" });
      return;
    }
    
    setIsStartingSession(true);
    setShowQRModal(false);
    try {
      const payload = {
        timetable_id: Number(selectedLecture.id),
        interval_seconds: settings.intervalSeconds,
        valid_minutes: settings.validMinutes, // <-- التأكد من إرسال هذا الحقل
        latitude: settings.latitude,
        longitude: settings.longitude,
        allowed_distance: settings.allowedDistance,
      };
      const res = await api.post('/v1/qr-codes/start-session', payload);
      const firstQrCode = res.data.data || res.data;
      if (!firstQrCode?.qr_code_value) throw new Error("استجابة غير صالحة من الخادم.");

      setActiveQR(firstQrCode);
      setQrSettings(settings);
      setQrSessionActive(true);
      setSessionEnded(false);
      setAttendanceRecords([]);
    } catch (error: any) {
      toast({ title: "فشل بدء الجلسة", description: error?.response?.data?.message || "حدث خطأ غير متوقع.", variant: "destructive" });
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    setQrSessionActive(false);
    setSessionEnded(true);
    setActiveQR(null);
    setQrSettings(null);
  };
  
  const handleBackToSchedule = () => {
    setSessionEnded(false);
    setSelectedLecture(null);
    setAttendanceRecords([]);
    // تحديث الجدول لإظهار حالة "تم التحضير"
    fetchSchedule();
  };

  // --- 4. جزء العرض (Render) ---
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* الحالة الافتراضية: عرض الجدول */}
        {!qrSessionActive && !sessionEnded && (
          <>
            <LecturerWelcome name={lecturerName} />
            {isLoadingSchedule ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <LectureSchedule lectures={lectures} onStartQR={handleStartQR} />
            )}
            {isStartingSession && (
                <div className="flex flex-col items-center justify-center p-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">جاري بدء جلسة الحضور...</p>
                </div>
            )}
          </>
        )}

        {/* الحالة الثانية: جلسة QR نشطة */}
        {qrSessionActive && qrSettings && selectedLecture && activeQR && (
          <QRSessionView
            settings={qrSettings}
            lectureTitle={selectedLecture.title}
            groupName={selectedLecture.groupName}
            lectureId={selectedLecture.id}
            initialQR={activeQR}
            onEndSession={handleEndSession}
          />
        )}

        {/* الحالة الثالثة: ملخص الحضور */}
        {sessionEnded && selectedLecture && (
          <AttendanceSummary
            records={attendanceRecords}
            lectureTitle={selectedLecture.title}
            groupName={selectedLecture.groupName}
            groupId={selectedLecture.groupId} 
            timetableId={selectedLecture.id}
            onFinalized={handleBackToSchedule}
          />
        )}

        {/* المودال: يظهر عند الحاجة */}
        <StartQRModal
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
          onSubmit={handleQRModalSubmit}
          lectureId={selectedLecture?.id ?? null}
          classroomInfo={selectedLecture?.classroom ?? null}
        />
      </div>
    </div>
  );
}