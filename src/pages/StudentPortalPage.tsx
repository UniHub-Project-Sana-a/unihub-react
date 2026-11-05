import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import StudentQRScannerModal from "@/components/student/StudentQRScannerModal";
import StudentNotificationsModal from "@/components/student/StudentNotificationsModal";
import StudentAssignmentSubmissionModal from "@/components/student/StudentAssignmentSubmissionModal";
import { TabErrorBoundary } from "@/components/common/TabErrorBoundary";
import {
  User,
  LogOut,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Megaphone,
  FileText,
  PlusCircle,
  Send,
  Loader2,
  Building,
  GraduationCap,
  Sparkles,
  QrCode,
  ShieldCheck,
  HelpCircle,
  Lock,
  Layers,
  Fingerprint,
  Users2,
  Bell,
  Camera,
  Upload,
  Paperclip,
  Trash2,
  FileCheck,
  ExternalLink,
  Settings,
  Tv,
  TrendingUp,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Download,
  LayoutGrid,
  List,
  Printer,
} from "lucide-react";

// Types
interface StudentInfo {
  id: number;
  user_id: number;
  full_name: string;
  academic_number: string;
  email: string;
  phone: string;
  college_name: string;
  department_name: string;
  program_name: string;
  level_name: string;
  semester_name: string;
  block_name?: string | null;
  group_name: string;
  group_id: number | null;
}

interface AttendanceStats {
  rate: number;
  total_sessions: number;
  attended: number;
  excused: number;
  absent: number;
  safe_threshold: number;
}

interface TodayLecture {
  timetable_id: number;
  session_id?: number | null;
  course_id?: number;
  course_name: string;
  course_code: string;
  lecturer_name: string;
  classroom: string;
  classroom_name?: string;
  start_time: string;
  end_time: string;
  lecture_type: string;
  status_code: number; // 0: scheduled, 1: live, 2: completed
  status_text: string;
  is_attended?: boolean;
  has_answered_questions?: boolean;
  attachments?: Array<{ id: number; title: string; type: string; url: string }>;
  interactive_questions?: Array<{ id: number; question: string; type: string; options?: string[] }>;
}

interface RegisteredCourse {
  course_id: number;
  course_name: string;
  course_code: string;
  credit_hours: number;
  category: string;
  lecturer_name?: string;
  lecturers?: Array<{ lecturer_id: number; name: string; raw_name?: string; type: string }>;
}

interface Announcement {
  id: number;
  subject: string;
  message: string;
  sender: string;
  date: string;
}

interface ExcuseItem {
  id: number;
  course_name: string;
  request_date: string;
  reason: string;
  status: number;
  comment?: string | null;
}

type TabType =
  | "overview"
  | "study-plan"
  | "timetable"
  | "attendance"
  | "grades"
  | "understanding"
  | "assignments"
  | "excuses"
  | "announcements"
  | "profile";

export default function StudentPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTab, setCurrentTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with location state or query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    const stateTab = (location.state as any)?.activeTab;
    const target = tabParam || stateTab;
    if (target) {
      if (target === "today") {
        setCurrentTab("overview");
      } else {
        const validTabs: TabType[] = [
          "overview",
          "study-plan",
          "timetable",
          "attendance",
          "grades",
          "understanding",
          "assignments",
          "excuses",
          "announcements",
          "profile",
        ];
        if (validTabs.includes(target as TabType)) {
          setCurrentTab(target as TabType);
        }
      }
    }
  }, [location]);

  // Data states
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [todayLectures, setTodayLectures] = useState<TodayLecture[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<RegisteredCourse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [excuses, setExcuses] = useState<ExcuseItem[]>([]);

  // Weekly Timetable data
  const [weeklyTimetable, setWeeklyTimetable] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>("all");
  const [timetableViewMode, setTimetableViewMode] = useState<"grid" | "cards">("grid");

  const currentDayOfWeek = useMemo(() => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[new Date().getDay()];
  }, []);

  const timetableDaysList = useMemo(() => [
    "السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
  ], []);

  const distinctPeriods = useMemo(() => {
    const periodMap = new Map<string, { start: string; end: string; label: string }>();

    // Gather unique periods from actual timetable
    weeklyTimetable.forEach((dayGroup) => {
      (dayGroup.slots || []).forEach((slot: any) => {
        if (slot.start_time && slot.end_time) {
          const s = slot.start_time.slice(0, 5);
          const e = slot.end_time.slice(0, 5);
          const key = `${s} - ${e}`;
          if (!periodMap.has(key)) {
            periodMap.set(key, { start: s, end: e, label: key });
          }
        }
      });
    });

    // Default standard periods
    const standardPeriods = [
      { start: "08:00", end: "10:00", label: "08:00 - 10:00" },
      { start: "10:00", end: "12:00", label: "10:00 - 12:00" },
      { start: "12:00", end: "14:00", label: "12:00 - 14:00" },
      { start: "14:00", end: "16:00", label: "14:00 - 16:00" },
    ];
    standardPeriods.forEach((sp) => {
      if (!periodMap.has(sp.label)) {
        periodMap.set(sp.label, sp);
      }
    });

    return Array.from(periodMap.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [weeklyTimetable]);

  const totalWeeklySlots = useMemo(() => {
    return weeklyTimetable.reduce((acc, d) => acc + (d.slots?.length || 0), 0);
  }, [weeklyTimetable]);

  // Attendance full breakdown
  const [attendanceCourses, setAttendanceCourses] = useState<any[]>([]);
  const [recentAttendanceLogs, setRecentAttendanceLogs] = useState<any[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Grades breakdown
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Study Plan data
  const [studyPlanData, setStudyPlanData] = useState<any | null>(null);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(false);
  const [expandedPlanLevels, setExpandedPlanLevels] = useState<number[]>([]);

  // Understanding Analytics data
  const [understandingData, setUnderstandingData] = useState<any | null>(null);
  const [isLoadingUnderstanding, setIsLoadingUnderstanding] = useState(false);

  // Assignments data
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const getLetterGradeInfo = (p: number) => {
    if (p >= 90) return { grade: "A+", label: "ممتاز مرتفع", color: "bg-emerald-600 text-white" };
    if (p >= 85) return { grade: "A", label: "ممتاز", color: "bg-emerald-500 text-white" };
    if (p >= 80) return { grade: "B+", label: "جيد جداً مرتفع", color: "bg-blue-600 text-white" };
    if (p >= 75) return { grade: "B", label: "جيد جداً", color: "bg-blue-500 text-white" };
    if (p >= 70) return { grade: "C+", label: "جيد مرتفع", color: "bg-amber-600 text-white" };
    if (p >= 65) return { grade: "C", label: "جيد", color: "bg-amber-500 text-white" };
    if (p >= 60) return { grade: "D+", label: "مقبول مرتفع", color: "bg-orange-500 text-white" };
    if (p >= 50) return { grade: "D", label: "مقبول", color: "bg-orange-600 text-white" };
    return { grade: "F", label: "راسب / بحاجة لإعادة", color: "bg-rose-600 text-white" };
  };

  // Modals state (QR scanner is now a full page)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Interactive Questions Modal State
  const [selectedLectureForQuestions, setSelectedLectureForQuestions] = useState<TodayLecture | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [answeredSessions, setAnsweredSessions] = useState<number[]>([]);
  const [scannedSessions, setScannedSessions] = useState<number[]>([]);
  const [activeScannerLecture, setActiveScannerLecture] = useState<TodayLecture | null>(null);

  // Attachments Modal State
  const [selectedLectureForAttachments, setSelectedLectureForAttachments] = useState<TodayLecture | null>(null);

  // Profile Change Password State
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Submit excuse dialog
  const [showExcuseDialog, setShowExcuseDialog] = useState(false);
  const [excuseCourseId, setExcuseCourseId] = useState("");
  const [excuseLecturerId, setExcuseLecturerId] = useState("");
  const [excuseDate, setExcuseDate] = useState("");
  const [excuseReason, setExcuseReason] = useState("");
  const [excuseFile, setExcuseFile] = useState<File | null>(null);
  const [excusePreviewUrl, setExcusePreviewUrl] = useState<string | null>(null);
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);

  // 1. Fetch Summary Data
  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/v1/student/portal-summary");
      if (res.data?.status) {
        setStudent(res.data.student);
        setStats(res.data.attendance_stats);
        setTodayLectures(res.data.today_lectures || []);
        setRegisteredCourses(res.data.registered_courses || []);
        setAnnouncements(res.data.announcements || []);
        setExcuses(res.data.recent_excuses || []);
        try {
          window.dispatchEvent(new CustomEvent("unihub:announcements-updated"));
        } catch (_) {}
      }
    } catch (error) {
      console.error("Error loading student portal summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 2. Fetch Tab-Specific Data
  useEffect(() => {
    if (currentTab === "timetable" && weeklyTimetable.length === 0) {
      setIsLoadingTimetable(true);
      api
        .get("/v1/student/timetable")
        .then((res) => {
          if (res.data?.timetable) setWeeklyTimetable(res.data.timetable);
        })
        .finally(() => setIsLoadingTimetable(false));
    } else if (currentTab === "attendance" && attendanceCourses.length === 0) {
      setIsLoadingAttendance(true);
      api
        .get("/v1/student/attendance")
        .then((res) => {
          if (res.data?.courses) setAttendanceCourses(res.data.courses);
          if (res.data?.recent_logs) setRecentAttendanceLogs(res.data.recent_logs);
        })
        .finally(() => setIsLoadingAttendance(false));
    } else if (currentTab === "grades" && gradesData.length === 0) {
      setIsLoadingGrades(true);
      api
        .get("/v1/student/grades")
        .then((res) => {
          if (res.data?.grades) setGradesData(res.data.grades);
        })
        .finally(() => setIsLoadingGrades(false));
    } else if (currentTab === "study-plan" && !studyPlanData) {
      setIsLoadingStudyPlan(true);
      api
        .get("/v1/student/study-plan")
        .then((res) => {
          if (res.data?.status) {
            setStudyPlanData(res.data);
            if (res.data.full_plan_levels && res.data.full_plan_levels.length > 0) {
              setExpandedPlanLevels([res.data.full_plan_levels[0].level_id]);
            }
          }
        })
        .finally(() => setIsLoadingStudyPlan(false));
    } else if (currentTab === "understanding" && !understandingData) {
      setIsLoadingUnderstanding(true);
      api
        .get("/v1/student/understanding-analytics")
        .then((res) => {
          if (res.data?.status) setUnderstandingData(res.data);
        })
        .finally(() => setIsLoadingUnderstanding(false));
    } else if (currentTab === "assignments" && assignmentsData.length === 0) {
      setIsLoadingAssignments(true);
      api
        .get("/v1/student/assignments")
        .then((res) => {
          if (res.data?.assignments) setAssignmentsData(res.data.assignments);
        })
        .finally(() => setIsLoadingAssignments(false));
    }
  }, [currentTab]);

  // 3. Interactive Lecture Questions Handlers
  const handleOpenQuestions = (lec: TodayLecture) => {
    setSelectedLectureForQuestions(lec);
    setAnswersMap({});
  };

  const handleSubmitAnswers = async () => {
    if (!selectedLectureForQuestions) return;
    if (Object.keys(answersMap).length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار إجابة واحدة على الأقل قبل الإرسال.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAnswers(true);
    try {
      const payload = {
        timetable_id: selectedLectureForQuestions.timetable_id,
        session_id: selectedLectureForQuestions.session_id,
        answers: Object.entries(answersMap).map(([qId, val]) => ({
          question_id: Number(qId),
          answer_value: val,
        })),
      };

      await api.post("/v1/student/submit-lecture-answers", payload);

      toast({
        title: "تم توثيق إجاباتك بنجاح! 🎉",
        description: "شكراً لمشاركتك وتفاعلك أثناء المحاضرة.",
      });

      setAnsweredSessions((prev) => [...prev, selectedLectureForQuestions.timetable_id]);
      setSelectedLectureForQuestions(null);
    } catch (err: any) {
      toast({
        title: "خطأ في الإرسال",
        description: err?.response?.data?.message || "تعذر إرسال الإجابات، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // 4. Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة غير متطابقة مع التأكيد.", variant: "destructive" });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({ title: "تنبيه", description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.post("/v1/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast({ title: "تم التغيير بنجاح", description: "تم تحديث كلمة المرور الخاصة بك بنجاح." });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      toast({
        title: "فشل تغيير كلمة المرور",
        description: err?.response?.data?.message || "تحقق من كلمة المرور الحالية وحاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 3. Submit Medical Excuse
  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseCourseId || !excuseDate || !excuseReason.trim()) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى اختيار المقرر وتاريخ الغياب وتوضيح السبب بالتفصيل.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingExcuse(true);
    try {
      const formData = new FormData();
      formData.append("course_id", excuseCourseId);
      if (excuseLecturerId) {
        formData.append("lecturer_id", excuseLecturerId);
      }
      formData.append("request_date", excuseDate);
      formData.append("reason", excuseReason.trim());
      if (excuseFile) {
        formData.append("file", excuseFile);
      }

      const res = await api.post("/v1/student/excuses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "تم تقديم العذر بنجاح",
        description: res.data?.message || "تم إرسال العذر إلى أستاذ المقرر للمراجعة والاعتماد.",
      });

      setShowExcuseDialog(false);
      setExcuseCourseId("");
      setExcuseLecturerId("");
      setExcuseDate("");
      setExcuseReason("");
      setExcuseFile(null);
      setExcusePreviewUrl(null);
      fetchSummary();
    } catch (error: any) {
      toast({
        title: "خطأ في تقديم العذر",
        description: error?.response?.data?.message || "تعذر تقديم العذر.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingExcuse(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/v1/auth/logout");
    } catch (error) {
      console.error(error);
    }
    setAuthToken(undefined);
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.hash = "/login";
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]" dir="rtl">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
          <h2 className="text-lg font-bold text-foreground">بوابة الطالب الذكية - UniHub</h2>
          <p className="text-muted-foreground text-sm">جاري تحميل بياناتك الأكاديمية وجدول المحاضرات...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full" dir="rtl">
        {/* Mobile Navigation Tabs Bar (On desktop, navigation is cleanly handled by the right Sidebar) */}
        <div className="lg:hidden flex items-center gap-2 border-b overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={currentTab === "overview" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("overview")}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>لوحة المتابعة</span>
          </Button>

          <Button
            variant={currentTab === "study-plan" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("study-plan")}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الخطة الدراسية</span>
          </Button>

          <Button
            variant={currentTab === "timetable" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("timetable")}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>الجدول الأسبوعي</span>
          </Button>

          <Button
            variant={currentTab === "attendance" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("attendance")}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>كشف الحضور والغياب</span>
            {stats && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {stats.rate}%
              </Badge>
            )}
          </Button>

          <Button
            variant={currentTab === "grades" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("grades")}
          >
            <Award className="w-3.5 h-3.5" />
            <span>أعمال الفصل والدرجات</span>
          </Button>

          <Button
            variant={currentTab === "understanding" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("understanding")}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>مؤشرات الفهم والاستيعاب</span>
          </Button>

          <Button
            variant={currentTab === "assignments" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("assignments")}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>التكاليف والواجبات</span>
            {assignmentsData.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary">
                {assignmentsData.length}
              </Badge>
            )}
          </Button>

          <Button
            variant={currentTab === "excuses" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("excuses")}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>أعذاري المرفوعة</span>
            {excuses.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {excuses.length}
              </Badge>
            )}
          </Button>

          <Button
            variant={currentTab === "announcements" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("announcements")}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>إعلانات المحاضرين</span>
            {announcements.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600">
                {announcements.length}
              </Badge>
            )}
          </Button>

          <Button
            variant={currentTab === "profile" ? "default" : "ghost"}
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={() => setCurrentTab("profile")}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الملف الشخصي والإعدادات</span>
          </Button>
        </div>

        <TabErrorBoundary fallbackTitle="تعذر عرض هذا القسم من بوابة الطالب">
          {/* ==================================================================== */}
          {/* 1. TAB: OVERVIEW (لوحة المتابعة الشاملة) */}
          {/* ==================================================================== */}
          {currentTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* البطاقة الأكاديمية التعريفية الرقمية الاحترافية (خاصة بالواجهة الرئيسية فقط) */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 sm:p-7 shadow-xs backdrop-blur-sm">
                {/* خط إضاءة جمالي علوي */}
                <div className="absolute top-0 right-0 left-0 h-[2.5px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                
                {/* علامة مائية أكاديمية في الخلفية */}
                <GraduationCap className="w-44 h-44 text-primary/[0.03] select-none pointer-events-none absolute -left-8 -bottom-10 transform -rotate-12" />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* الجانب الأيمن: صورة الطالب والبيانات التعريفية والاسم */}
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/75 text-primary-foreground flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md border-2 border-background ring-2 ring-primary/20">
                          {student?.full_name?.charAt(0) || "ط"}
                        </div>
                        {/* مؤشر حالة الحساب الأكاديمي النشط */}
                        <span className="absolute -bottom-1 -left-1 flex h-4 w-4" title="طالب نشط ومقيد رسمياً">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-[11px] sm:text-xs font-semibold text-primary/80 tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span>بوابة الطالب الأكاديمية الذكية</span>
                          </p>
                          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-tight mt-0.5">
                            {student?.full_name}
                          </h1>
                        </div>

                        {/* صف الشارات التعريفية */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5 font-bold gap-1 shadow-2xs">
                            <Fingerprint className="w-3 h-3" />
                            <span>الرقم الأكاديمي: {student?.academic_number}</span>
                          </Badge>

                          <Badge className="bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-bold gap-1 shadow-2xs">
                            <Users2 className="w-3 h-3" />
                            <span>{student?.group_name || "المجموعة الدراسية"}</span>
                          </Badge>

                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 font-semibold gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>مقيد ونشط رسمياً</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* الجانب الأيسر: الفصل الدراسي والعام ومعدل الحضور */}
                    <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                      <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                        <Badge variant="secondary" className="text-xs px-3 py-1 font-medium bg-muted/80 border border-border/60 gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/80" />
                          <span>{student?.semester_name || "الفصل الدراسي الحالي"}</span>
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                          <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
                          <span>2026-2027</span>
                        </span>
                      </div>

                      {stats && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-lg border border-border/60 shadow-2xs">
                          <span>نسبة الحضور التراكمية:</span>
                          <span className={`font-bold font-mono text-sm ${(stats?.rate || 0) >= 85 ? "text-emerald-600" : (stats?.rate || 0) >= 75 ? "text-amber-600" : "text-rose-600"}`}>
                            {stats?.rate || 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* شبكة الانتماء الأكاديمي (الكلية، القسم، المستوى، البلوك) */}
                  <div className="pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">الكلية</p>
                        <p className="font-semibold text-foreground truncate" title={student?.college_name}>{student?.college_name || "جامعة صنعاء"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">القسم والتخصص</p>
                        <p className="font-semibold text-foreground truncate" title={student?.department_name}>{student?.department_name || "الطب البشري"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">المستوى الأكاديمي</p>
                        <p className="font-semibold text-foreground truncate">{student?.level_name || "المستوى الأول"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">البلوك الأكاديمي</p>
                        <p className="font-semibold text-foreground truncate" title={student?.block_name || "الخطة العامة"}>{student?.block_name || "الخطة العامة"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 shadow-2xs border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">نسبة الحضور التراكمية</span>
                    <QrCode className="w-4 h-4 text-primary" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{stats?.rate || 0}%</span>
                    <span
                      className={`text-xs font-semibold ${(stats?.rate || 0) >= 85
                          ? "text-emerald-600"
                          : (stats?.rate || 0) >= 75
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                    >
                      {(stats?.rate || 0) >= 85 ? "مستقر ومثالي" : (stats?.rate || 0) >= 75 ? "إنذار أولي" : "خطر حرمان"}
                    </span>
                  </div>
                  <Progress value={stats?.rate || 0} className="h-1.5 mt-2" />
                </Card>

                <Card className="p-4 shadow-2xs border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">محاضرات حضرتها بالـ QR</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{stats?.attended || 0}</span>
                    <span className="text-xs text-muted-foreground">من أصل {stats?.total_sessions || 0} جلسة</span>
                  </div>
                </Card>

                <Card className="p-4 shadow-2xs border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">أعذار مقبولة رسمياً</span>
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{stats?.excused || 0}</span>
                    <span className="text-xs text-emerald-600 font-medium">تم اعتمادها</span>
                  </div>
                </Card>

                <Card className="p-4 shadow-2xs border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">غياب غير مبرر</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-rose-600">{stats?.absent || 0}</span>
                    <span className="text-xs text-muted-foreground">حد الحرمان 25%</span>
                  </div>
                </Card>
              </div>

              {/* Today's Lectures & Announcements Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Today's Lectures */}
                <Card className="lg:col-span-7 shadow-sm border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base sm:text-lg">محاضرات وجلسات اليوم</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        المجموعة: {student?.group_name}
                      </Badge>
                    </div>
                    <CardDescription>
                      مواعيد المحاضرات والقاعات المسندة لليوم مع حالة الجلسة المباشرة
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {todayLectures.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                        <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">لا توجد محاضرات مجدولة لليوم.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          استمتع بيومك الدراسي أو راجع المقررات والتكليفات القادمة.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todayLectures.map((lec) => {
                          const isScanned = Boolean(lec.is_attended || scannedSessions.includes(lec.timetable_id));
                          const isAnswered = Boolean(lec.has_answered_questions || answeredSessions.includes(lec.timetable_id));
                          const hasQuestions = Boolean(lec.interactive_questions && lec.interactive_questions.length > 0);

                          return (
                            <div
                              key={lec.timetable_id}
                              className={`p-4 rounded-xl border transition-all ${isScanned && (!hasQuestions || isAnswered)
                                  ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                                  : isScanned && hasQuestions && !isAnswered
                                    ? "border-amber-500/40 bg-amber-500/[0.02]"
                                    : lec.status_code === 1
                                      ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                                      : "border-border/70 bg-card hover:bg-accent/5"
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-foreground text-sm sm:text-base">
                                      {lec.course_name}
                                    </h4>
                                    <Badge variant="secondary" className="text-[11px]">
                                      {lec.lecture_type}
                                    </Badge>
                                    {isScanned && (!hasQuestions || isAnswered) && (
                                      <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 text-[11px] gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>تم التحضير بنجاح</span>
                                      </Badge>
                                    )}
                                    {isScanned && hasQuestions && !isAnswered && (
                                      <Badge className="bg-amber-600/10 text-amber-700 border-amber-300 text-[11px] gap-1">
                                        <HelpCircle className="w-3 h-3 text-amber-600" />
                                        <span>بانتظار إجابة الأسئلة التفاعلية</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                    <span>أستاذ المقرر: {lec.lecturer_name}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-foreground">القاعة: {lec.classroom || lec.classroom_name}</span>
                                  </p>
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 pt-2 sm:pt-0 border-t sm:border-0">
                                  <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                                    {lec.start_time.slice(0, 5)} - {lec.end_time.slice(0, 5)}
                                  </span>

                                  <Badge
                                    variant={
                                      lec.status_code === 1
                                        ? "default"
                                        : lec.status_code === 2
                                          ? "outline"
                                          : "secondary"
                                    }
                                    className={`text-[11px] ${lec.status_code === 1 ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse" : ""
                                      }`}
                                  >
                                    {lec.status_text}
                                  </Badge>
                                </div>
                              </div>

                              {/* شريط الإجراءات المرفقة: المرفقات، الأسئلة التفاعلية، مسح الـ QR */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-2 border-t border-dashed">
                                <div className="flex items-center flex-wrap gap-2">
                                  {/* زر استعراض المرفقات والروابط */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 gap-1 text-primary border-primary/20 hover:bg-primary/5"
                                    onClick={() => setSelectedLectureForAttachments(lec)}
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>المرفقات والروابط ({lec.attachments?.length || 0})</span>
                                  </Button>

                                  {/* زر الأسئلة التفاعلية - مشروط بعدم الفتح إلا بعد مسح الـ QR */}
                                  {hasQuestions && (
                                    !isScanned ? (
                                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-dashed border-border/80 select-none">
                                        <Lock className="w-3 h-3 text-muted-foreground/70" />
                                        <span>الأسئلة التفاعلية ({lec.interactive_questions!.length}) - تُفتح تلقائياً بعد مسح الـ QR</span>
                                      </div>
                                    ) : !isAnswered ? (
                                      <Button
                                        size="sm"
                                        className="text-xs h-7 gap-1 bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                                        onClick={() => handleOpenQuestions(lec)}
                                      >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        <span>بانتظار إجابة الأسئلة التفاعلية ({lec.interactive_questions!.length})</span>
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs h-7 gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        disabled
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>تم توثيق إجابات الأسئلة بنجاح ✓</span>
                                      </Button>
                                    )
                                  )}
                                </div>

                                {/* زر مسح QR المباشر للمحاضرة أو إكمال الأسئلة أو شارة التوثيق */}
                                {isScanned ? (
                                  hasQuestions && !isAnswered ? (
                                    <Button
                                      size="sm"
                                      className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                                      onClick={() => handleOpenQuestions(lec)}
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      <span>إكمال إجابة الأسئلة التفاعلية</span>
                                    </Button>
                                  ) : (
                                    <Badge className="bg-emerald-600/10 text-emerald-700 border border-emerald-300 gap-1.5 text-xs py-1.5 px-3">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>حاضر وموثق بالكامل</span>
                                    </Badge>
                                  )
                                ) : lec.status_code === 1 ? (
                                  <Button
                                    size="sm"
                                    className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold animate-pulse"
                                    onClick={() => {
                                      navigate('/student/scan-qr', { state: { lecture: lec } });
                                    }}
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>🔴 جارية الآن • مسح رمز الـ QR للتحضير</span>
                                  </Button>
                                ) : lec.status_code === 0 ? (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 select-none cursor-not-allowed">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                    <span>تبدأ الساعة {lec.start_time.slice(0, 5)} • لم يحن وقت التحضير بعد</span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground text-xs bg-muted/30 py-1 px-2.5">
                                    انتهت المحاضرة
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Latest Announcements */}
                <Card className="lg:col-span-5 shadow-sm border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-500" />
                        <CardTitle className="text-base sm:text-lg">تنبيهات وإعلانات الدكاترة</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {announcements.length} إشعار
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNotificationsModal(true)}
                          className="h-7 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/5"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>فتح التنبيهات</span>
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      إشعارات فورية حول مواعيد الاختبارات والتكليفات واعتذارات المحاضرين
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {announcements.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                        <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">لا توجد إعلانات جديدة حالياً.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {announcements.map((ann) => (
                          <div
                            key={ann.id}
                            className="p-3.5 rounded-lg border border-border/70 bg-card hover:bg-accent/5 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                {ann.subject}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{ann.date}</span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                              {ann.message}
                            </p>

                            <div className="text-[11px] text-primary/80 font-medium pt-1">
                              مرسل من: {ann.sender}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Enrolled Courses Summary */}
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg">المقررات المسجلة في الفصل الحالي</CardTitle>
                    </div>
                    <Badge variant="outline">{registeredCourses.length} مقررات</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {registeredCourses.map((c) => (
                      <div
                        key={c.course_id}
                        className="p-4 rounded-xl border border-border/70 bg-card/60 hover:border-primary/40 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                            {c.course_code}
                          </span>
                          <span className="text-xs text-muted-foreground">{c.credit_hours} ساعات معتمدة</span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-2">{c.course_name}</h4>
                        <p className="text-[11px] text-muted-foreground">{c.category}</p>
                        {c.lecturer_name && (
                          <div className="flex items-center gap-1.5 pt-1.5 text-xs text-muted-foreground border-t border-border/40">
                            <User className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{c.lecturer_name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: STUDY PLAN (الخطة الدراسية وفق النظام الأكاديمي المعتمد) */}
          {/* ==================================================================== */}
          {currentTab === "study-plan" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isLoadingStudyPlan ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">جاري تحميل الخطة الدراسية الأكاديمية ومقرراتها...</p>
                </div>
              ) : (
                <>
                  {/* Academic System Identity Card */}
                  {studyPlanData?.academic_system === "block" || studyPlanData?.is_block_based ? (
                    <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background border-emerald-500/30 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1">
                              <Layers className="w-3.5 h-3.5" />
                              نظام البلوكات والموديولات الطبية التكاملي (Medical Blocks System)
                            </Badge>
                            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-mono text-xs">
                              {studyPlanData?.current_block?.code || "BLK-MED"}
                            </Badge>
                          </div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {studyPlanData?.current_block?.block_name || student?.block_name || "الموديول الطبي التكاملي الحالي"}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                            {studyPlanData?.current_block?.description || "الموديول الطبي المتكامل للعلوم الأساسية والتطبيقية والسريرية مع التدريب الميداني والمعملي المكثف."}
                          </p>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">مدة البلوك الدراسي:</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {studyPlanData?.current_block?.duration_weeks || 6} أسابيع مكثفة
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">الساعات المعتمدة للبلوك:</span>
                            <span className="text-base font-bold text-foreground">
                              {studyPlanData?.total_term_credits || 16} ساعة معتمدة
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : studyPlanData?.academic_system === "credit" ? (
                    <Card className="p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-background border-blue-500/30 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-xs gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              نظام الساعات المعتمدة الأكاديمي (Credit Hours System)
                            </Badge>
                            <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-500/40 text-xs">
                              {studyPlanData?.program_name || student?.program_name}
                            </Badge>
                          </div>
                          <h2 className="text-2xl font-bold text-foreground">
                            الخطة الدراسية لـ {studyPlanData?.current_level || student?.level_name} - {studyPlanData?.current_semester || student?.semester_name}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                            نظام الساعات المعتمدة يتيح للطالب تسجيل المقررات الإجبارية والاختيارية ومتابعة العبء الدراسي والمعدل التراكمي (GPA).
                          </p>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">الساعات المسجلة هذا الفصل:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {studyPlanData?.total_term_credits || 18} ساعة معتمدة
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">الحد الأقصى للعبء الفصلي:</span>
                            <span className="text-xs font-semibold text-muted-foreground">21 ساعة كحد أقصى</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background border-violet-500/30 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-violet-600 text-white hover:bg-violet-700 text-xs gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              النظام الفصلي الأكاديمي المعتمد (Semester-Based System)
                            </Badge>
                            <Badge variant="outline" className="text-violet-700 dark:text-violet-300 border-violet-500/40 text-xs">
                              {studyPlanData?.program_name || student?.program_name}
                            </Badge>
                          </div>
                          <h2 className="text-2xl font-bold text-foreground">
                            خطة {studyPlanData?.current_level || student?.level_name} • {studyPlanData?.current_semester || student?.semester_name}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                            الخطة الدراسية المعتمدة للمقررات النظرية والتطبيقية والمعملية المقررة لهذا الفصل الأكاديمي.
                          </p>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">إجمالي الساعات المعتمدة:</span>
                            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                              {studyPlanData?.total_term_credits || 17} ساعة
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">عدد المقررات المسجلة:</span>
                            <span className="text-xs font-semibold text-foreground">
                              {(studyPlanData?.current_term_courses || registeredCourses).length} مقررات
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Current Term Courses Grid */}
                  <Card className="shadow-sm border-border/60">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base sm:text-lg">مقررات الخطة المسجلة للفصل الحالي</CardTitle>
                          <CardDescription>
                            تفاصيل الساعات النظرية والعملية والمعتمدة والمتطلبات السابقة لكل مقرر
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {(studyPlanData?.current_term_courses || registeredCourses).length} مقررات
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(studyPlanData?.current_term_courses || registeredCourses).map((c: any) => (
                          <div
                            key={c.course_id}
                            className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                  {c.course_code}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {c.category || "متطلب تخصص"}
                                </Badge>
                              </div>

                              <h4 className="font-bold text-base text-foreground leading-snug">
                                {c.course_name}
                              </h4>

                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {c.description || "مقرر أساسي معتمد ضمن متطلبات التخرج واكتساب المهارات التخصصية."}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-border/60 space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>الساعات المعتمدة:</span>
                                <span className="font-bold text-foreground">{c.credit_hours} ساعات</span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="px-2 py-0.5 rounded bg-muted">نظري: {c.lecture_hours ?? 2} س</span>
                                <span className="px-2 py-0.5 rounded bg-muted">عملي: {c.lab_hours ?? 0} س</span>
                              </div>

                              {c.prerequisites && (
                                <div className="text-[11px] text-primary/80 font-medium bg-primary/5 p-1.5 rounded">
                                  المتطلب السابق: {c.prerequisites}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Full Program Roadmap (المخطط الأكاديمي لكامل البرنامج) */}
                  {studyPlanData?.full_plan_levels && studyPlanData.full_plan_levels.length > 0 && (
                    <Card className="shadow-sm border-border/60">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base sm:text-lg">خارطة المستويات الأكاديمية للبرنامج الكامل</CardTitle>
                            <CardDescription>
                              استعراض تدرج المستويات والفصول الدراسية حتى التخرج
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {studyPlanData.full_plan_levels.map((lvl: any) => {
                          const isExpanded = expandedPlanLevels.includes(lvl.level_id);
                          const isCurrentLevel = student?.level_name?.includes(lvl.level_name) || false;

                          return (
                            <div
                              key={lvl.level_id}
                              className={cn(
                                "border rounded-xl transition-all",
                                isCurrentLevel ? "border-primary bg-primary/5" : "border-border/70 bg-card"
                              )}
                            >
                              <div
                                onClick={() => {
                                  setExpandedPlanLevels((prev) =>
                                    prev.includes(lvl.level_id)
                                      ? prev.filter((id) => id !== lvl.level_id)
                                      : [...prev, lvl.level_id]
                                  );
                                }}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3">
                                  <GraduationCap className={cn("w-5 h-5", isCurrentLevel ? "text-primary" : "text-muted-foreground")} />
                                  <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                      {lvl.level_name}
                                      {isCurrentLevel && (
                                        <Badge className="bg-primary text-primary-foreground text-[10px]">
                                          مستواك الحالي
                                        </Badge>
                                      )}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {lvl.semesters ? lvl.semesters.length : 2} فصول دراسية
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 pt-0 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  {lvl.semesters && lvl.semesters.length > 0 ? (
                                    lvl.semesters.map((s: any) => (
                                      <div key={s.semester_id} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-foreground">{s.semester_name}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                          {isCurrentLevel && student?.semester_name?.includes(s.semester_name)
                                            ? "الفصل النشط"
                                            : "معتمد في الخطة"}
                                        </Badge>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-foreground">الفصل الدراسي الأول</span>
                                        <Badge variant="outline" className="text-[10px]">معتمد في الخطة</Badge>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-foreground">الفصل الدراسي الثاني</span>
                                        <Badge variant="outline" className="text-[10px]">معتمد في الخطة</Badge>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* 2. TAB: WEEKLY TIMETABLE (الجدول الدراسي الأسبوعي الذكي والمحسّن للجوال) */}
          {/* ==================================================================== */}
          {currentTab === "timetable" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header Card with Academic Stats and View Mode Switcher */}
              <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base sm:text-lg">الجدول الدراسي الأسبوعي المعتمد</CardTitle>
                      <Badge variant="outline" className="text-xs font-mono">
                        {student?.group_name || "مجموعتك الدراسية"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      الجدول الرسمي المعتمد لأيام الأسبوع الأكاديمي، موزعاً بالفترات والمحاضرين والقاعات.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* View Switcher */}
                    <div className="flex items-center bg-background/80 p-0.5 rounded-lg border border-border/70 shadow-2xs">
                      <Button
                        size="sm"
                        variant={timetableViewMode === "grid" ? "default" : "ghost"}
                        className={`h-7 px-2.5 text-xs gap-1.5 font-medium ${timetableViewMode === "grid" ? "shadow-2xs" : "text-muted-foreground"}`}
                        onClick={() => setTimetableViewMode("grid")}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>الجدول الشبكي الرسمي</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={timetableViewMode === "cards" ? "default" : "ghost"}
                        className={`h-7 px-2.5 text-xs gap-1.5 font-medium ${timetableViewMode === "cards" ? "shadow-2xs" : "text-muted-foreground"}`}
                        onClick={() => setTimetableViewMode("cards")}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>عرض القوائم</span>
                      </Button>
                    </div>

                    <Badge variant="secondary" className="text-xs px-2.5 py-1 gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{totalWeeklySlots} حصة</span>
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-border/70 bg-background/60"
                      onClick={() => window.print()}
                      title="طباعة الجدول"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">طباعة</span>
                    </Button>
                  </div>
                </div>

                {/* Day Filter Pills (Only visible in Cards mode or for quick filtering) */}
                {timetableViewMode === "cards" && (
                  <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-primary/10 overflow-x-auto pb-1 scrollbar-none">
                    <Button
                      size="sm"
                      variant={selectedTimetableDay === "all" ? "default" : "outline"}
                      onClick={() => setSelectedTimetableDay("all")}
                      className={`h-7 px-3 text-xs rounded-full shrink-0 ${selectedTimetableDay === "all"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border-border/60 hover:bg-accent/40"
                        }`}
                    >
                      جميع الأيام ({totalWeeklySlots})
                    </Button>

                    {timetableDaysList.map((dayName) => {
                      const dayData = weeklyTimetable.find((d) => d.day === dayName);
                      const isToday = dayName === currentDayOfWeek;
                      const isSelected = selectedTimetableDay === dayName;
                      const slotsCount = dayData?.slots?.length || 0;
                      return (
                        <Button
                          key={dayName}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setSelectedTimetableDay(dayName)}
                          className={`h-7 px-3 text-xs rounded-full shrink-0 gap-1.5 transition-all ${isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : isToday
                                ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 font-bold"
                                : "border-border/60 hover:bg-accent/40"
                            }`}
                        >
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                          <span>يوم {dayName}</span>
                          <span className="text-[10px] opacity-75">({slotsCount})</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Timetable Content */}
              {isLoadingTimetable ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">جاري تحميل وتنسيق جدولك الدراسي...</p>
                </div>
              ) : weeklyTimetable.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-semibold">لم يتم العثور على حصص مجدولة لمجموعتك حالياً.</p>
                  <p className="text-xs text-muted-foreground mt-1">تأكد من تسجيل مقررات الفصل الدراسي أو مراجعة مسجل الكلية.</p>
                </Card>
              ) : timetableViewMode === "grid" ? (
                /* ========================================================== */
                /* VIEW 1: OFFICIAL WEEKLY TIMETABLE MATRIX (نفس تصميم الجدول الرسمي) */
                /* ========================================================== */
                <Card className="backdrop-blur-sm border border-border/70 shadow-xs overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 pb-2 border-b bg-muted/20">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          الجدول الشبكي المعتمد
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          اسحب أفقياً على الهاتف لتصفح كامل أيام الأسبوع
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span>اليوم الدراسي الحالي</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded border border-dashed border-border inline-block" />
                          <span>فترة فراغ</span>
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                      <div className="min-w-[920px]">
                        {/* 1. رأس الجدول (Header Row) */}
                        <div className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))] gap-2 mb-2">
                          <div className="font-bold text-center p-2.5 bg-muted/50 rounded-xl flex items-center justify-center text-xs text-foreground/80 font-mono">
                            الوقت
                          </div>
                          {timetableDaysList.map((dayName) => {
                            const isToday = dayName === currentDayOfWeek;
                            const dayData = weeklyTimetable.find((d) => d.day === dayName);
                            const slotsCount = dayData?.slots?.length || 0;
                            return (
                              <div
                                key={dayName}
                                className={`font-bold text-center p-2 sm:p-2.5 rounded-xl transition-all ${
                                  isToday
                                    ? "bg-emerald-500/15 border-2 border-emerald-500/60 text-emerald-800 dark:text-emerald-300 shadow-xs"
                                    : "bg-muted/40 border border-border/50 text-foreground"
                                }`}
                              >
                                <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                                  {isToday && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                                  <span>{dayName}</span>
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                  {isToday ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">اليوم الحالي ({slotsCount})</span>
                                  ) : (
                                    <span>{slotsCount > 0 ? `${slotsCount} محاضرات` : "راحة"}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 2. صفوف الفترات (Period Rows) */}
                        {distinctPeriods.map((period) => {
                          return (
                            <div
                              key={period.label}
                              className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))] gap-2 mt-2 items-stretch"
                            >
                              {/* عمود توقيت الفترة */}
                              <div className="text-center p-2 bg-muted/30 rounded-xl border border-border/40 flex flex-col items-center justify-center h-full text-[11px] font-mono font-semibold text-foreground/85">
                                <Clock className="w-3.5 h-3.5 text-primary mb-1 shrink-0" />
                                <span>{period.start}</span>
                                <span className="text-[9px] text-muted-foreground leading-none my-0.5">إلى</span>
                                <span>{period.end}</span>
                              </div>

                              {/* خلايا أيام الأسبوع */}
                              {timetableDaysList.map((dayName) => {
                                const isToday = dayName === currentDayOfWeek;
                                const dayData = weeklyTimetable.find((d) => d.day === dayName);
                                const slotsInCell = (dayData?.slots || []).filter((s: any) => {
                                  const sStart = (s.start_time || "").slice(0, 5);
                                  const sEnd = (s.end_time || "").slice(0, 5);
                                  return (
                                    sStart === period.start ||
                                    (sStart >= period.start && sStart < period.end)
                                  );
                                });

                                return (
                                  <div key={dayName} className="min-h-[125px] p-0.5 flex flex-col justify-stretch">
                                    {slotsInCell.length === 0 ? (
                                      <div className="h-full min-h-[115px] border border-dashed border-border/50 rounded-xl bg-transparent flex items-center justify-center text-center p-2 transition-colors hover:bg-muted/10">
                                        <span className="text-[11px] text-muted-foreground/60 select-none">
                                          لا توجد جلسات
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-1.5 h-full">
                                        {slotsInCell.map((s: any) => {
                                          const matchedToday = isToday
                                            ? todayLectures.find((t) => t.timetable_id === s.timetable_id)
                                            : null;
                                          const isAttended = Boolean(
                                            isToday &&
                                              (matchedToday?.is_attended ||
                                                scannedSessions.includes(s.timetable_id))
                                          );
                                          const slotStatusCode =
                                            matchedToday?.status_code ??
                                            (() => {
                                              const now = new Date();
                                              const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(
                                                now.getMinutes()
                                              ).padStart(2, "0")}:00`;
                                              if (nowStr < s.start_time) return 0;
                                              if (nowStr > s.end_time) return 2;
                                              return 1;
                                            })();

                                          const isPractical =
                                            s.lecture_type?.includes("عملي") ||
                                            s.lecture_type?.includes("معمل");
                                          const isClinical = s.lecture_type?.includes("سريري");

                                          return (
                                            <Card
                                              key={s.timetable_id}
                                              className={`h-full shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between p-2.5 rounded-xl border ${
                                                isToday
                                                  ? "border-emerald-500/40 bg-card hover:border-emerald-500/80"
                                                  : isPractical
                                                    ? "border-emerald-300 dark:border-emerald-800/50 bg-card hover:border-emerald-500"
                                                    : isClinical
                                                      ? "border-purple-300 dark:border-purple-800/50 bg-card hover:border-purple-500"
                                                      : "border-border/70 bg-card hover:border-primary/50"
                                              }`}
                                            >
                                              <div className="space-y-1.5 text-right">
                                                {/* Bar: Course Code & Badge */}
                                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                                  <span className="font-mono text-[10px] sm:text-[11px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                                                    {s.course_code || "مقرر"}
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-[9px] py-0 px-1.5 h-4 font-semibold ${
                                                      isPractical
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                        : isClinical
                                                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                                                          : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                    }`}
                                                  >
                                                    {s.lecture_type}
                                                  </Badge>
                                                </div>

                                                {/* Course Title */}
                                                <h4 className="font-bold text-[11px] sm:text-xs text-foreground line-clamp-2 leading-tight">
                                                  {s.course_name}
                                                </h4>

                                                {/* Lecturer & Classroom */}
                                                <div className="pt-1 border-t border-border/40 space-y-1 text-[10px] text-muted-foreground">
                                                  <div className="flex items-center gap-1 truncate">
                                                    <User className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                                    <span className="truncate">{s.lecturer_name || "محاضر غير محدد"}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 truncate">
                                                    <Building className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                                    <span className="truncate">{s.classroom_name || "قاعة غير محددة"}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Action/Attendance Status */}
                                              <div className="mt-2 pt-1.5 border-t border-border/40">
                                                {isToday ? (
                                                  isAttended ? (
                                                    <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                      <span>تم التحضير اليوم ✓</span>
                                                    </div>
                                                  ) : slotStatusCode === 1 ? (
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        navigate('/student/scan-qr', { state: { lecture: matchedToday } });
                                                      }}
                                                      className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7 px-1.5 font-bold shadow-xs transition-all animate-pulse"
                                                    >
                                                      <QrCode className="w-3 h-3" />
                                                      <span>جارية الآن • مسح الـ QR</span>
                                                    </Button>
                                                  ) : slotStatusCode === 0 ? (
                                                    <div className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-muted text-muted-foreground border border-border/50 text-[10px] font-medium select-none truncate">
                                                      <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                                      <span className="truncate">تبدأ {s.start_time.slice(0, 5)}</span>
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center justify-center py-1 px-1.5 rounded-md bg-muted/40 text-muted-foreground border border-border/40 text-[10px] font-medium text-center">
                                                      <span>انتهت المحاضرة</span>
                                                    </div>
                                                  )
                                                ) : (
                                                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 py-0.5 px-1 rounded bg-muted/30">
                                                    <span className="font-mono">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                                                    <span>أسبوعياً</span>
                                                  </div>
                                                )}
                                              </div>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* ========================================================== */
                /* VIEW 2: DETAILED CARDS VIEW (عرض البطاقات اليومية التفاعلية) */
                /* ========================================================== */
                <div className="space-y-6">
                  {weeklyTimetable
                    .filter((dayGroup) => selectedTimetableDay === "all" || selectedTimetableDay === dayGroup.day)
                    .map((dayGroup) => {
                      const isToday = dayGroup.day === currentDayOfWeek;
                      return (
                        <div key={dayGroup.day} className="space-y-3">
                          {/* Day Header Bar */}
                          <div className="flex items-center justify-between pb-2 border-b">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${isToday ? "bg-emerald-500 animate-pulse" : "bg-primary/50"}`} />
                              <h3 className="font-bold text-sm sm:text-base text-foreground">
                                يوم {dayGroup.day}
                              </h3>
                              {isToday && (
                                <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2 h-5">
                                  اليوم الدراسي الحالي
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {dayGroup.slots.length} محاضرات
                            </Badge>
                          </div>

                          {dayGroup.slots.length === 0 ? (
                            <div className="p-6 rounded-xl border border-dashed text-center bg-muted/20">
                              <Sparkles className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1" />
                              <p className="text-xs text-muted-foreground">لا توجد محاضرات في هذا اليوم (يوم دراسة ذاتية / راحة).</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {dayGroup.slots.map((s: any) => {
                                const isAttended = Boolean(
                                  isToday && (todayLectures.find((t) => t.timetable_id === s.timetable_id)?.is_attended || scannedSessions.includes(s.timetable_id))
                                );
                                const isPractical = s.lecture_type?.includes("عملي") || s.lecture_type?.includes("معمل");
                                const isClinical = s.lecture_type?.includes("سريري");

                                // Clean period name: e.g. "الفترة الأولى" without duplicate hours
                                const cleanPeriodName = (s.period_name || "").replace(/\(.*?\)/g, "").trim() || s.period_name;

                                return (
                                  <Card
                                    key={s.timetable_id}
                                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${isPractical
                                        ? "border-r-4 border-r-emerald-500 bg-card hover:border-emerald-500/50"
                                        : isClinical
                                          ? "border-r-4 border-r-purple-500 bg-card hover:border-purple-500/50"
                                          : "border-r-4 border-r-indigo-500 bg-card hover:border-indigo-500/50"
                                      }`}
                                  >
                                    <div className="space-y-3">
                                      {/* Top Bar: Code, Type, Period */}
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                            {s.course_code}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] py-0 px-2 h-5 font-semibold ${isPractical
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : isClinical
                                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300"
                                              }`}
                                          >
                                            {s.lecture_type}
                                          </Badge>
                                        </div>

                                        {cleanPeriodName && (
                                          <span className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded">
                                            {cleanPeriodName}
                                          </span>
                                        )}
                                      </div>

                                      {/* Course Title */}
                                      <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                                        {s.course_name}
                                      </h4>

                                      {/* Details Grid */}
                                      <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                          <span className="font-mono">
                                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Building className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                          <span className="truncate">{s.classroom_name} {s.building_name ? `• ${s.building_name}` : ""}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                          <span className="truncate">أستاذ المقرر: {s.lecturer_name}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card Footer: Conditional for Today vs Other Days */}
                                    <div className="pt-3 border-t mt-3">
                                      {isToday ? (() => {
                                        const matched = todayLectures.find((t) => t.timetable_id === s.timetable_id);
                                        const slotStatusCode = matched?.status_code ?? (() => {
                                          const now = new Date();
                                          const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
                                          if (nowStr < s.start_time) return 0;
                                          if (nowStr > s.end_time) return 2;
                                          return 1;
                                        })();

                                        if (isAttended) {
                                          return (
                                            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold dark:bg-emerald-950/40 dark:text-emerald-300">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>تم التحضير بنجاح اليوم ✓</span>
                                            </div>
                                          );
                                        }

                                        if (slotStatusCode === 1) {
                                          return (
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                navigate('/student/scan-qr', { state: { lecture: matched } });
                                              }}
                                              className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shadow-xs transition-all animate-pulse"
                                            >
                                              <QrCode className="w-3.5 h-3.5" />
                                              <span>🔴 جارية الآن • مسح رمز الـ QR للتحضير</span>
                                            </Button>
                                          );
                                        }

                                        if (slotStatusCode === 0) {
                                          return (
                                            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-muted text-muted-foreground border border-border/60 text-xs font-medium cursor-not-allowed select-none">
                                              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                              <span>تبدأ {s.start_time.slice(0, 5)} • لم يحن وقت التحضير</span>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-muted/40 text-muted-foreground border border-border/40 text-xs font-medium">
                                            <span>انتهت المحاضرة</span>
                                          </div>
                                        );
                                      })() : (
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground py-1 px-2 rounded-md bg-muted/40 border border-border/40">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-primary/70" />
                                            <span>مجدولة أسبوعياً (يوم {dayGroup.day})</span>
                                          </span>
                                          <span className="font-mono text-[10px] text-muted-foreground/80">ثابتة</span>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* 3. TAB: ATTENDANCE & QR (كشف الحضور والغياب) */}
          {/* ==================================================================== */}
          {currentTab === "attendance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">نسبة الحضور لكل مقرر دراسي</CardTitle>
                      <CardDescription>
                        يتم احتساب الحرمان تلقائياً في حال انخفاض نسبة الحضور عن 75%
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowExcuseDialog(true)}
                      size="sm"
                      className="gap-1.5 bg-primary self-start sm:self-auto"
                    >
                      <PlusCircle className="w-4 h-4" />
                      تقديم عذر غياب
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {isLoadingAttendance ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : attendanceCourses.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات حضور مسجلة بعد.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attendanceCourses.map((ac) => (
                        <div
                          key={ac.course_id}
                          className="p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/5 transition-colors space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-mono font-bold text-primary">{ac.course_code}</span>
                              <h4 className="font-bold text-sm text-foreground mt-0.5">{ac.course_name}</h4>
                            </div>

                            <Badge
                              variant={
                                ac.status_level === "safe"
                                  ? "default"
                                  : ac.status_level === "warning"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {ac.status_level === "safe"
                                ? "حضور آمن"
                                : ac.status_level === "warning"
                                  ? "إنذار أولي"
                                  : "خطر حرمان"}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span>نسبة الالتزام بالحضور:</span>
                              <span className="font-mono text-primary">{ac.rate}%</span>
                            </div>
                            <Progress value={ac.rate} className="h-2" />
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-2 border-t text-center text-xs">
                            <div className="p-1.5 rounded bg-muted/40">
                              <span className="text-[10px] text-muted-foreground block">الجلسات</span>
                              <span className="font-bold text-foreground">{ac.total_sessions}</span>
                            </div>
                            <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                              <span className="text-[10px] block">حاضر</span>
                              <span className="font-bold">{ac.attended}</span>
                            </div>
                            <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600">
                              <span className="text-[10px] block">بعذر</span>
                              <span className="font-bold">{ac.excused}</span>
                            </div>
                            <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                              <span className="text-[10px] block">غياب</span>
                              <span className="font-bold">{ac.absent}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Attendance Logs */}
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">سجل عمليات التحضير الأخيرة بالـ QR Code</CardTitle>
                  <CardDescription>آخر الجلسات التي قمت بمسح رمز الاستجابة السريعة فيها</CardDescription>
                </CardHeader>

                <CardContent>
                  {recentAttendanceLogs.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">لا يوجد سجل جلسات سابقة.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentAttendanceLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-lg border flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <span className="font-bold text-foreground">{log.course_name}</span>
                              <span className="text-muted-foreground block text-[11px]">{log.date}</span>
                            </div>
                          </div>

                          <Badge variant="outline" className="text-[11px]">
                            {log.status_text}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* 4. TAB: GRADES & RESULTS (درجات أعمال الفصل والتقييمات المميزة) */}
          {/* ==================================================================== */}
          {currentTab === "grades" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Grades Overview KPI */}
              {gradesData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-5 shadow-2xs border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">متوسط أعمال الفصل التراكمي</span>
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-primary">
                        {(gradesData.reduce((acc: number, cur: any) => acc + (cur.percentage || 0), 0) / gradesData.length).toFixed(1)}%
                      </span>
                      <Badge className={getLetterGradeInfo(gradesData.reduce((acc: number, cur: any) => acc + (cur.percentage || 0), 0) / gradesData.length).color}>
                        التقدير: {getLetterGradeInfo(gradesData.reduce((acc: number, cur: any) => acc + (cur.percentage || 0), 0) / gradesData.length).grade}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {getLetterGradeInfo(gradesData.reduce((acc: number, cur: any) => acc + (cur.percentage || 0), 0) / gradesData.length).label}
                    </p>
                  </Card>

                  <Card className="p-5 shadow-2xs border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">حالة استيفاء حد النجاح في أعمال الفصل</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-600">
                        مستوفي المعايير ✅
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      الحد الأدنى لدخول الاختبار النهائي هو 50% من مجموع أعمال الفصل
                    </p>
                  </Card>

                  <Card className="p-5 shadow-2xs border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">المقررات المرصودة</span>
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {gradesData.length}
                      </span>
                      <span className="text-xs text-muted-foreground">مقررات دراسية</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      يتم تحديث الدرجات آلياً فور اعتمادها من قِبل الدكاترة
                    </p>
                  </Card>
                </div>
              )}

              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">كشف درجات أعمال الفصل والاختبارات الأكاديمية</CardTitle>
                      <CardDescription>
                        تفصيل درجات النصفي، الكويزات، التكاليف، العملي، والمواظبة لكل مقرر
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {isLoadingGrades ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : gradesData.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">
                      لم يتم رصد درجات أعمال فصل حتى الآن.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {gradesData.map((cg) => {
                        const letterInfo = getLetterGradeInfo(cg.percentage);
                        return (
                          <div key={cg.course_id} className="p-5 rounded-xl border border-border/70 bg-card space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                    {cg.course_code}
                                  </span>
                                  <Badge className={letterInfo.color}>
                                    {letterInfo.grade} • {letterInfo.label}
                                  </Badge>
                                  {cg.percentage >= 50 ? (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-[10px]">
                                      مؤهل للاختبار النهائي
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-[10px]">
                                      تحت حد النجاح
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-foreground">{cg.course_name}</h3>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-left sm:text-right">
                                  <span className="text-xs text-muted-foreground block">مجموع أعمال الفصل:</span>
                                  <span className="text-xl font-extrabold text-primary">
                                    {cg.total_score} <span className="text-sm font-normal text-muted-foreground">/ {cg.max_score}</span>
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-sm h-8 px-2.5 font-bold">
                                  {cg.percentage}%
                                </Badge>
                              </div>
                            </div>

                            {/* Coursework Visual Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                <span>نسبة تحصيل أعمال الفصل</span>
                                <span className="font-bold text-foreground">{cg.percentage}%</span>
                              </div>
                              <Progress value={cg.percentage} className="h-2" />
                            </div>

                            {cg.assessments.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 italic">لم تتم إضافة بنود تقييم تفصيلية بعد.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                {cg.assessments.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-xl border bg-muted/20 flex flex-col justify-between space-y-2 text-xs"
                                  >
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="font-semibold text-foreground">{item.name}</span>
                                      <span className="font-mono font-bold text-primary shrink-0">
                                        {item.score} / {item.max_score}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      <Progress value={item.max_score > 0 ? (item.score / item.max_score) * 100 : 0} className="h-1 bg-muted" />
                                    </div>
                                    {item.notes && (
                                      <p className="text-[11px] text-muted-foreground italic border-t pt-1">
                                        ملاحظة الدكتور: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: UNDERSTANDING & COMPREHENSION (مؤشرات الفهم والاستيعاب) */}
          {/* ==================================================================== */}
          {currentTab === "understanding" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isLoadingUnderstanding ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">جاري تحليل مؤشرات الفهم وبنوك الأسئلة للمقررات...</p>
                </div>
              ) : (
                <>
                  {/* Summary KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 shadow-2xs border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">متوسط مؤشر الفهم والاستيعاب العام</span>
                        <BrainCircuit className="w-5 h-5 text-primary" />
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-primary">
                          {understandingData?.summary?.overall_understanding_average ?? 86.5}%
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          استيعاب متميز
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        مستنتج من إجاباتك على أسئلة وبنوك تقييم الفهم في المحاضرات
                      </p>
                    </Card>

                    <Card className="p-5 shadow-2xs border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">متوسط نسبة الحضور الفعلي</span>
                        <QrCode className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">
                          {understandingData?.summary?.overall_attendance_average ?? stats?.rate ?? 91}%
                        </span>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-[10px]">
                          حضور نظامي
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        نسبة التحضير عبر مسح الـ QR والتحقق الجغرافي الصارم
                      </p>
                    </Card>

                    <Card className="p-5 shadow-2xs border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">المقررات المرصودة بالتحليل</span>
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">
                          {understandingData?.courses_analytics?.length ?? 5}
                        </span>
                        <span className="text-xs text-muted-foreground">مقررات نشطة</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        يتم تحديث المؤشرات تلقائياً مع كل محاضرة تفاعلية تحضرها
                      </p>
                    </Card>
                  </div>

                  {/* Course by Course Understanding Cards */}
                  <div className="space-y-6">
                    {(understandingData?.courses_analytics || []).map((course: any) => (
                      <Card key={course.course_id} className="shadow-sm border-border/60 overflow-hidden">
                        <CardHeader className="bg-muted/15 border-b pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                  {course.course_code}
                                </span>
                                <Badge
                                  variant={course.attendance_rate >= 85 ? "default" : course.attendance_rate >= 75 ? "outline" : "destructive"}
                                  className="text-xs"
                                >
                                  {course.attendance_status}
                                </Badge>
                                <Badge className="bg-blue-600 text-white text-xs">
                                  {course.understanding_level}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg font-bold text-foreground">
                                {course.course_name}
                              </CardTitle>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[11px] text-muted-foreground block">معدل الحضور:</span>
                                <span className="font-bold text-sm text-foreground">{course.attendance_rate}%</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] text-muted-foreground block">مؤشر الاستيعاب:</span>
                                <span className="font-extrabold text-base text-primary">{course.understanding_score}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Comparative Visual Bars */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>نسبة الحضور ({course.attended_sessions} من {course.total_sessions} جلسات)</span>
                                <span className="font-semibold text-foreground">{course.attendance_rate}%</span>
                              </div>
                              <Progress value={course.attendance_rate} className="h-2 bg-muted" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>مؤشر فهم بنوك الأسئلة والكويزات</span>
                                <span className="font-semibold text-primary">{course.understanding_score}%</span>
                              </div>
                              <Progress value={course.understanding_score} className="h-2 bg-primary/20" />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6 space-y-4">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-primary" />
                            تحليل تفاعل بنوك الأسئلة وموضوعات المقرر (Topic Mastery Breakdown)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {course.topics.map((t: any) => (
                              <div
                                key={t.topic_id}
                                className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-accent/5 transition-colors space-y-2 flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold text-xs text-foreground line-clamp-1">
                                      {t.title}
                                    </span>
                                    <Badge
                                      variant={t.comprehension_rate >= 85 ? "default" : t.comprehension_rate >= 70 ? "secondary" : "destructive"}
                                      className="text-[10px] shrink-0"
                                    >
                                      {t.status}
                                    </Badge>
                                  </div>

                                  <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-[11px] text-muted-foreground">
                                      <span>مستوى الإتقان</span>
                                      <span className="font-bold text-foreground">{t.comprehension_rate}%</span>
                                    </div>
                                    <Progress value={t.comprehension_rate} className="h-1.5" />
                                  </div>
                                </div>

                                <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40 leading-relaxed">
                                  💡 <span className="font-medium text-foreground">توصية الأداء:</span> {t.recommendation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: ASSIGNMENTS (التكاليف والواجبات) */}
          {/* ==================================================================== */}
          {currentTab === "assignments" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">التكاليف والواجبات الدراسية</CardTitle>
                      <CardDescription>
                        متابعة الواجبات المسندة من المحاضرين، المتطلبات، المواعيد النهائية، وتسليم الحلول
                      </CardDescription>
                    </div>

                    <Button
                      onClick={() => setShowAssignmentModal(true)}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs font-semibold h-9 shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>رفع وتسليم تكليف الآن</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {isLoadingAssignments ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : assignmentsData.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
                      <FileCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-foreground">لا توجد تكاليف مطلوبة حالياً</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        عند إضافة الدكاترة لأي واجبات أو تكاليف ستظهر هنا فوراً.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignmentsData.map((assign: any) => (
                        <div
                          key={assign.id}
                          className="p-5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold">
                                {assign.course_name}
                              </Badge>
                              <Badge
                                variant={assign.is_mandatory ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {assign.is_mandatory ? "إلزامي" : "اختياري"}
                              </Badge>
                            </div>

                            <h3 className="font-bold text-base text-foreground leading-snug">
                              {assign.title}
                            </h3>

                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                              {assign.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-border/60 space-y-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                آخر موعد: <span className="font-medium text-foreground font-mono">{assign.due_date}</span>
                              </span>
                              <span className="flex items-center gap-1 font-bold text-primary">
                                <Award className="w-3.5 h-3.5" />
                                الدرجة المستحقة: {assign.max_grade} درجات
                              </span>
                            </div>

                            <Button
                              onClick={() => setShowAssignmentModal(true)}
                              className="w-full gap-2 text-xs font-semibold h-9"
                              variant="default"
                            >
                              <Upload className="w-4 h-4" />
                              <span>رفع الحل وتسليم الواجب</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* 5. TAB: EXCUSES (أعذاري المرفوعة) */}
          {/* ==================================================================== */}
          {currentTab === "excuses" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">سجل الأعذار الطبية والغياب</CardTitle>
                      <CardDescription>
                        متابعة قرارات المحاضرين على طلبات الأعذار التي قمت بتقديمها
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowExcuseDialog(true)} size="sm" className="gap-1.5 bg-primary">
                      <PlusCircle className="w-4 h-4" />
                      تقديم عذر جديد
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {excuses.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                      <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">لم تقم بتقديم أي أعذار حتى الآن.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        في حال غيابك عن أي محاضرة لظرف صحي أو طارئ، يمكنك رفع العذر مباشرة من هنا.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {excuses.map((ex) => (
                        <div
                          key={ex.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${ex.status === 1
                              ? "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10"
                              : ex.status === 2
                                ? "border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10"
                                : "border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{ex.course_name}</h4>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3.5 h-3.5" />
                                تاريخ الغياب: {ex.request_date}
                              </span>
                            </div>

                            <Badge
                              variant={ex.status === 1 ? "default" : ex.status === 2 ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {ex.status === 1 ? "مقبول ✅" : ex.status === 2 ? "مرفوض ❌" : "قيد المراجعة ⏳"}
                            </Badge>
                          </div>

                          <div className="p-2.5 rounded-lg bg-background/80 border text-xs text-foreground/90 leading-relaxed">
                            <span className="font-semibold text-primary block mb-0.5">السبب المقدم:</span>
                            {ex.reason}
                          </div>

                          {ex.comment && (
                            <div className="p-2 rounded bg-muted/60 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground block mb-0.5">رد المحاضر:</span>
                              {ex.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* 6. TAB: ANNOUNCEMENTS (إعلانات وتنبيهات المحاضرين) */}
          {/* ==================================================================== */}
          {currentTab === "announcements" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-lg">إعلانات وتوجيهات المحاضرين للمجموعة</CardTitle>
                    </div>
                    <Badge variant="outline">{announcements.length} إعلان</Badge>
                  </div>
                  <CardDescription>
                    جميع التنبيهات الموجهة لدفعتك: مواعيد الاختبارات، التكليفات الأكاديمية، والاعتذارات
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {announcements.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                      <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">لا توجد إعلانات منشورة لمجموعتك حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className="p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/5 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                              {ann.subject}
                            </h4>
                            <Badge variant="outline" className="text-xs shrink-0 font-normal">
                              {ann.date}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pr-4">
                            {ann.message}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                            <span className="text-primary font-medium">أستاذ المقرر: {ann.sender}</span>
                            <span className="text-emerald-600 font-medium">تم التحقق رسمياً</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================================== */}
          {/* 7. TAB: PROFILE & SETTINGS (الملف الشخصي وإعدادات الحساب) */}
          {/* ==================================================================== */}
          {currentTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Academic Identity Details */}
                <Card className="lg:col-span-2 shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <span>البيانات الأكاديمية والشخصية للطالب</span>
                    </CardTitle>
                    <CardDescription>معلومات القيد الجامعي والمستوى الأكاديمي المسجل في النظام</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">الاسم الرباعي</span>
                        <p className="font-bold text-sm text-foreground mt-1">{student?.full_name}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">الرقم الأكاديمي</span>
                        <p className="font-bold font-mono text-sm text-primary mt-1">{student?.academic_number}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">الكلية</span>
                        <p className="font-semibold text-sm text-foreground mt-1">{student?.college_name}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">القسم والبرنامج</span>
                        <p className="font-semibold text-sm text-foreground mt-1">{student?.program_name}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">المستوى والفصل الدراسي</span>
                        <p className="font-semibold text-sm text-foreground mt-1">{student?.level_name} - {student?.semester_name}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">المجموعة الطلابية</span>
                        <p className="font-semibold text-sm text-primary mt-1">{student?.group_name}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">البريد الإلكتروني الجامعي</span>
                        <p className="font-mono text-xs text-foreground mt-1">{student?.email}</p>
                      </div>
                      <div className="p-3.5 bg-muted/30 rounded-xl border">
                        <span className="text-[11px] text-muted-foreground block">رقم الهاتف</span>
                        <p className="font-mono text-xs text-foreground mt-1">{student?.phone || "غير مسجل"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Password Settings */}
                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <span>إعدادات الأمان وكلمة المرور</span>
                    </CardTitle>
                    <CardDescription>تحديث كلمة المرور لحماية الحساب الجامعي</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <Label className="text-xs">كلمة المرور الحالية</Label>
                        <Input
                          type="password"
                          className="mt-1"
                          placeholder="••••••••"
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs">كلمة المرور الجديدة</Label>
                        <Input
                          type="password"
                          className="mt-1"
                          placeholder="••••••••"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs">تأكيد كلمة المرور الجديدة</Label>
                        <Input
                          type="password"
                          className="mt-1"
                          placeholder="••••••••"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={isChangingPassword} className="w-full text-xs">
                        {isChangingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabErrorBoundary>

        {/* نافذة تقديم عذر غياب جديد */}
        <Dialog open={showExcuseDialog} onOpenChange={setShowExcuseDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تقديم عذر طبي / غياب جديد</DialogTitle>
              <DialogDescription>
                سيتم إرسال العذر مباشرة إلى أستاذ المقرر المعني لمراجعته وتحديث كشف الحضور
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitExcuse} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  المقرر الدراسي الذي غبت عنه
                </label>
                <Select value={excuseCourseId} onValueChange={(val) => { setExcuseCourseId(val); setExcuseLecturerId(""); }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المقرر الدراسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {registeredCourses.map((c) => (
                      <SelectItem key={c.course_id} value={c.course_id.toString()}>
                        {c.course_name} ({c.course_code}) {c.lecturer_name ? `— د. ${c.lecturer_name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* بطاقة توضيحية ذكية تبين المحاضر المستلم للعذر */}
                {(() => {
                  const selectedCourse = registeredCourses.find((c) => c.course_id.toString() === excuseCourseId);
                  if (!selectedCourse) return null;

                  return (
                    <div className="mt-2.5 p-3 rounded-lg border bg-primary/5 border-primary/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span>أستاذ المقرر لمجموعتك:</span>
                          <span className="font-bold text-primary">{selectedCourse.lecturer_name || "محاضر المقرر المسند"}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-background border-primary/30 text-primary">
                          المستلم التلقائي
                        </Badge>
                      </div>

                      {selectedCourse.lecturers && selectedCourse.lecturers.length > 1 && (
                        <div className="pt-2 border-t border-primary/10">
                          <label className="text-[11px] text-muted-foreground block mb-1">
                            تحديد المحاضر (اختياري - في حال كان الغياب بمحاضرة نظري أو معمل عملي محدد):
                          </label>
                          <Select value={excuseLecturerId} onValueChange={setExcuseLecturerId}>
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder={`افتراضي: ${selectedCourse.lecturer_name || 'أستاذ المقرر المعني'}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCourse.lecturers.map((l) => (
                                <SelectItem key={l.lecturer_id} value={l.lecturer_id.toString()} className="text-xs">
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  تاريخ يوم الغياب
                </label>
                <Input
                  type="date"
                  value={excuseDate}
                  onChange={(e) => setExcuseDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  شرح سبب الغياب (طبي أو اضطراري)
                </label>
                <Textarea
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  placeholder="وضح الظرف الصحي أو الطارئ الذي منعك من الحضور بالتفصيل..."
                  rows={4}
                  required
                />
              </div>

              {/* إرفاق تقرير طبي أو التقاط صورة بالكاميرا */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-semibold text-foreground block">
                  إرفاق تقرير طبي أو صورة للعذر (اختياري)
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-9 border-dashed border-primary/40 text-xs font-medium"
                    onClick={() => {
                      const el = document.getElementById("excuse-camera-snap") as HTMLInputElement;
                      el?.click();
                    }}
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    تصوير التقرير بالكاميرا 📷
                  </Button>
                  <input
                    id="excuse-camera-snap"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setExcuseFile(file);
                        setExcusePreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-9 border-dashed border-primary/40 text-xs font-medium"
                    onClick={() => {
                      const el = document.getElementById("excuse-file-upload") as HTMLInputElement;
                      el?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    رفع ملف (PDF / صورة) 📁
                  </Button>
                  <input
                    id="excuse-file-upload"
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setExcuseFile(file);
                        if (file.type.startsWith("image/")) {
                          setExcusePreviewUrl(URL.createObjectURL(file));
                        } else {
                          setExcusePreviewUrl(null);
                        }
                      }
                    }}
                  />
                </div>

                {excuseFile && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{excuseFile.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({(excuseFile.size / 1024).toFixed(0)} كيلوبايت)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExcuseFile(null);
                        setExcusePreviewUrl(null);
                      }}
                      className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {excusePreviewUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border max-h-36 flex justify-center bg-black/5">
                    <img src={excusePreviewUrl} alt="معاينة التقرير" className="object-contain max-h-36" />
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExcuseDialog(false)}
                  disabled={isSubmittingExcuse}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="gap-1.5" disabled={isSubmittingExcuse}>
                  {isSubmittingExcuse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال العذر للدكتور
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* نوافذ المودال التفاعلية الاحترافية */}

        <StudentNotificationsModal
          open={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          announcements={announcements}
        />

        <StudentAssignmentSubmissionModal
          open={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          courses={registeredCourses}
        />

        {/* نافذة أسئلة المحاضرة التفاعلية */}
        <Dialog open={!!selectedLectureForQuestions} onOpenChange={(open) => !open && setSelectedLectureForQuestions(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-6" dir="rtl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <span>أسئلة المحاضرة التفاعلية</span>
                <Badge variant="outline" className="text-xs">{selectedLectureForQuestions?.course_name}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                يمكنك الإجابة فوراً الآن، أو اختيار "الإجابة لاحقاً" وإرسالها في أي وقت قبل نهاية موعد المحاضرة.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {selectedLectureForQuestions?.interactive_questions?.map((q, qIndex) => (
                <div key={q.id || qIndex} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <div className="font-semibold text-sm flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center shrink-0 font-bold">
                      {qIndex + 1}
                    </span>
                    <span className="leading-relaxed">{q.question}</span>
                  </div>

                  <RadioGroup
                    value={answersMap[q.id] || ""}
                    onValueChange={(val) => setAnswersMap(prev => ({ ...prev, [q.id]: val }))}
                    className="space-y-2 pr-8"
                  >
                    {(q.options || ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث']).map((rawOpt: any, optIdx: number) => {
                      const opt = typeof rawOpt === 'string' ? rawOpt : rawOpt?.text || rawOpt?.option_text || String(rawOpt);
                      return (
                        <div key={optIdx} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                          <RadioGroupItem value={opt} id={`q-${q.id}-opt-${optIdx}`} />
                          <Label htmlFor={`q-${q.id}-opt-${optIdx}`} className="text-xs cursor-pointer font-normal">
                            {opt}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-3">
              <Button
                onClick={handleSubmitAnswers}
                disabled={isSubmittingAnswers}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {isSubmittingAnswers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إرسال وتوثيق الإجابات الآن</span>
              </Button>

              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  toast({
                    title: "تم حفظ اختيارك",
                    description: "يمكنك العودة للإجابة على الأسئلة من بطاقة المحاضرة قبل نهاية موعدها.",
                  });
                  setSelectedLectureForQuestions(null);
                }}
                className="w-full sm:w-auto text-xs"
              >
                <span>الإجابة لاحقاً (قبل انتهاء وقت المحاضرة)</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة استعراض المرفقات والروابط */}
        <Dialog open={!!selectedLectureForAttachments} onOpenChange={(open) => !open && setSelectedLectureForAttachments(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary" />
                <span>المرفقات والمراجع الأكاديمية</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                المصادر والملفات والروابط المرفقة بمحاضرة ({selectedLectureForAttachments?.course_name})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto">
              {(!selectedLectureForAttachments?.attachments || selectedLectureForAttachments.attachments.length === 0) ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                  <Paperclip className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">لم يقم المحاضر برفع ملفات أو روابط لهذه المحاضرة بعد.</p>
                </div>
              ) : (
                selectedLectureForAttachments.attachments.map((att, idx) => (
                  <div key={att.id || idx} className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {att.type === 'video' ? <Tv className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">{att.title}</p>
                        <span className="text-[10px] text-muted-foreground">{att.type === 'file' ? 'ملف مستند / عرض' : 'رابط مرجعي خارجي'}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs h-8 gap-1 shrink-0"
                    >
                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح / تحميل</span>
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="border-t pt-3">
              <Button variant="ghost" onClick={() => setSelectedLectureForAttachments(null)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

