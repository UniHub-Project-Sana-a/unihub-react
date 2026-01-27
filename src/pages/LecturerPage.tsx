import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// ✅ --- استيراد دوال التاريخ --- ✅
import { format, startOfWeek, endOfWeek, isToday } from "date-fns";

// استيراد المكونات الفرعية
import { LecturerWelcome } from "@/components/lecturer/LecturerWelcome";
import { LectureSchedule } from "@/components/lecturer/LectureSchedule";
import { StartQRModal, QRFormSettings } from "@/components/lecturer/StartQRModal";
import { QRSessionView } from "@/components/lecturer/QRSessionView";
import { AttendanceSummary } from "@/components/lecturer/AttendanceSummary";

// ✅ استيراد مكون الدرجات الجديد
import { GradesManager } from "@/components/lecturer/GradesManager";

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

export interface LectureSession {
  id: string; // session_id
  timetableId: string; // timetable_id
  courseId?: number; // ✅ تأكدنا أنه number أو string حسب الباك إند (يفضل number للـ IDs)
  title: string;
  groupName: string;
  groupId: string;
  date: string;
  time: string;
  isCurrent: boolean;
  isAttended: boolean;
  status: number;
  classroom: ClassroomInfo;
  classroomName: string; 
  buildingName: string;  
  departmentName: string;
  expectedStudents: number;
  sessionCode?: string;
  isMakeup?: boolean;
  
  // ✅ الحقل الجديد المسبب للخطأ
  makeupRequest?: {
    id: number;
    status: number; // 0: Pending, 1: Approved, 2: Rejected
    requestedDate: string;
  } | null;
}
export interface AttendanceRecord {
  studentName: string;
  studentId: string;
  scanTime: string;
  method: "QR" | "يدوي";
}

// --- المكون الرئيسي ---
export default function LecturerPage() {
  // --- 1. Hooks والحالات (مُعدّلة) ---
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ✅ حالة جديدة للتحكم في الصفحة المعروضة (حضور أم درجات)
  const [currentView, setCurrentView] = useState<'attendance' | 'grades'>('attendance');

  const [currentLecturer, setCurrentLecturer] = useState<any>(null);
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LectureSession | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSessionActive, setQrSessionActive] = useState(false);
  const [qrSettings, setQrSettings] = useState<QRFormSettings | null>(null);
  const [activeQR, setActiveQR] = useState<ActiveQRInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lecturerTitle, setLecturerTitle] = useState<string | undefined>(undefined);
  const [viewDate, setViewDate] = useState(new Date());

  const lecturerName = user?.full_name || "محاضر";

  // --- 2. الدوال الرئيسية (مُعدّلة) ---
  const fetchLecturerInfoAndSchedule = useCallback(async (date: Date) => {
    if (!user?.user_id) {
      setIsLoadingSchedule(false);
      return;
    }
    
    // ملاحظة: نجلب الجدول فقط إذا كنا في وضع الحضور، أو عند التحميل الأولي
    setIsLoadingSchedule(true);
    try {
      const lecturerRes = await api.get(`/v1/lecturers`, { params: { user_id: user.user_id, with: 'academicTitle' } });
      const lecturerData = (lecturerRes.data && Array.isArray(lecturerRes.data)) ? lecturerRes.data[0] : lecturerRes.data;

      if (!lecturerData?.lecturer_id) {
        setSessions([]); 
        setIsLoadingSchedule(false);
        setLecturerTitle(undefined);
        return;
      }
      setCurrentLecturer(lecturerData);

      setLecturerTitle(lecturerData.academic_title?.title_name || lecturerData.academicTitle?.title_name);
      const lecturerId = lecturerData.lecturer_id;

      const weekStart = startOfWeek(date, { weekStartsOn: 6 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 6 });

      const sessionsRes = await api.get('/v1/lecture-sessions', {
        params: {
          lecturer_id: lecturerId,
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
        }
      });

      const sessionsData = sessionsRes.data?.data || [];
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const formattedSessions = sessionsData.map((session: any): LectureSession => {
        const startTimeStr = session.start_time?.slice(0, 5) || '00:00';
        const endTimeStr = session.end_time?.slice(0, 5) || '00:00';
        const [startH, startM] = startTimeStr.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const [endH, endM] = endTimeStr.split(':').map(Number);
        const endTotalMinutes = endH * 60 + endM;
        
        const isSessionToday = isToday(new Date(session.session_date));
        const isCurrentTime = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
        
        const groupStudentCount = session.timetable?.group?.students_count;
        const capacity = groupStudentCount || session.actual_classroom?.capacity || session.timetable?.classroom?.capacity || 50;

        return {
          id: String(session.session_id), 
          timetableId: String(session.timetable_id),
          sessionCode: session.session_code,
          title: session.timetable?.course?.course_name || 'مادة غير محددة',
          groupName: session.timetable?.group?.group_name || 'مجموعة غير محددة',
          courseId: session.timetable?.course_id,
          groupId: String(session.timetable?.group?.group_id),
          makeupRequest: session.makeupRequest,
          date: session.session_date.slice(0, 10),
          
          expectedStudents: capacity, 
          
          time: `${startTimeStr} - ${endTimeStr}`,
          isCurrent: isSessionToday && isCurrentTime,
          isAttended: session.status !== 0,
          status: session.status,
          classroomName: session.actual_classroom?.classroom_name || session.timetable?.classroom?.classroom_name || 'قاعة غير محددة',
          buildingName: session.actual_classroom?.building?.building_name || session.timetable?.classroom?.building?.building_name || 'مبنى غير محدد',
          departmentName: session.timetable?.department?.department_name || 'قسم غير محدد',
          isMakeup: Boolean(session.is_makeup),
          
          classroom: {
            latitude: session.actual_classroom?.latitude ?? session.timetable?.classroom?.latitude ?? null,
            longitude: session.actual_classroom?.longitude ?? session.timetable?.classroom?.longitude ?? null,
            allowed_distance: session.actual_classroom?.allowed_distance ?? session.timetable?.classroom?.allowed_distance ?? null,
          },
        };
      });
      setSessions(formattedSessions); 

    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل تحميل جدول الجلسات.", variant: "destructive"});
      setSessions([]); 
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLecturerInfoAndSchedule(viewDate);
  }, [fetchLecturerInfoAndSchedule, viewDate]);

  // --- 3. معالجات الأحداث (مُعدّلة) ---
  const handleStartQR = (session: LectureSession) => {
    setSelectedSession(session);
    setShowQRModal(true);
  };

  const handleQRModalSubmit = async (settings: QRFormSettings) => {
    if (!selectedSession) {
      toast({ title: "خطأ", description: "لم يتم تحديد أي جلسة.", variant: "destructive" });
      return;
    }
    
    setIsStartingSession(true);
    setShowQRModal(false);
    try {
      const payload = {
        timetable_id: Number(selectedSession.timetableId),
        session_id: Number(selectedSession.id),
        interval_seconds: settings.intervalSeconds,
        valid_minutes: settings.validMinutes,
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
    setSelectedSession(null);
    setAttendanceRecords([]);
    fetchLecturerInfoAndSchedule(viewDate);
  };

  // --- 4. جزء العرض (Render) ---
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ✅ مكون الترحيب والتحكم في التبويبات */}
        <LecturerWelcome 
            name={lecturerName} 
            academicTitle={lecturerTitle} 
            currentView={currentView}
            onViewChange={setCurrentView} 
        />

        {/* ========================================================= */}
        {/* العرض الأول: قسم الحضور (الجدول، QR، الملخص) */}
        {/* ========================================================= */}
        {currentView === 'attendance' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* الحالة الافتراضية: عرض الجدول */}
            {!qrSessionActive && !sessionEnded && (
              <>
                <LectureSchedule
                    sessions={sessions}
                    onStartQR={handleStartQR}
                    isLoading={isLoadingSchedule}
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    onRefresh={() => fetchLecturerInfoAndSchedule(viewDate)}
                    lecturerName={lecturerName}
                    lecturerId={currentLecturer?.lecturer_id} 
                    collegeId={currentLecturer?.college_id}
                />
                {isStartingSession && (
                    <div className="flex flex-col items-center justify-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">جاري بدء جلسة الحضور...</p>
                    </div>
                )}
              </>
            )}

            {/* الحالة الثانية: جلسة QR نشطة */}
            {qrSessionActive && qrSettings && selectedSession && activeQR && (
              <QRSessionView
                settings={qrSettings}
                lectureTitle={selectedSession.title}
                groupName={selectedSession.groupName}
                lectureId={selectedSession.timetableId} 
                initialQR={activeQR}
                onEndSession={handleEndSession}
              />
            )}

            {/* الحالة الثالثة: ملخص الحضور */}
            {sessionEnded && selectedSession && (
              <AttendanceSummary
                records={attendanceRecords}
                lectureTitle={selectedSession.title}
                groupName={selectedSession.groupName}
                lecturerName={lecturerName}
                classroomName={selectedSession.classroomName}
                buildingName={selectedSession.buildingName}
                groupId={selectedSession.groupId} 
                timetableId={selectedSession.timetableId}
                sessionId={selectedSession.id}
                onFinalized={handleBackToSchedule}
                collegeId={currentLecturer?.college_id} 
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* العرض الثاني: قسم إدارة الدرجات */}
        {/* ========================================================= */}
        {currentView === 'grades' && (
           <GradesManager />
        )}


        {/* المودال: يبقى خارج الشروط لأنه يظهر فوق المحتوى */}
        <StartQRModal
          expectedCount={selectedSession?.expectedStudents || 50}
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
          onSubmit={handleQRModalSubmit}
          lectureId={selectedSession?.timetableId ?? null}
          classroomInfo={selectedSession?.classroom ?? null}
        />
      </div>
    </div>
  );
}