import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
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
  Layers,
  Bell,
  Camera,
  Upload,
  Paperclip,
  Trash2,
  FileCheck,
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
  course_name: string;
  course_code: string;
  lecturer_name: string;
  classroom: string;
  start_time: string;
  end_time: string;
  lecture_type: string;
  status_code: number; // 0: scheduled, 1: live, 2: completed
  status_text: string;
}

interface RegisteredCourse {
  course_id: number;
  course_name: string;
  course_code: string;
  credit_hours: number;
  category: string;
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

type TabType = "overview" | "timetable" | "attendance" | "grades" | "excuses" | "announcements";

export default function StudentPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);

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

  // Attendance full breakdown
  const [attendanceCourses, setAttendanceCourses] = useState<any[]>([]);
  const [recentAttendanceLogs, setRecentAttendanceLogs] = useState<any[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Grades breakdown
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Modals state
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Submit excuse dialog
  const [showExcuseDialog, setShowExcuseDialog] = useState(false);
  const [excuseCourseId, setExcuseCourseId] = useState("");
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
    }
  }, [currentTab]);

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
    window.location.href = "/react-app/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <h2 className="text-lg font-bold text-foreground">بوابة الطالب الذكية - UniHub</h2>
        <p className="text-muted-foreground text-sm">جاري تحميل بياناتك الأكاديمية وجدول المحاضرات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Header */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shadow-xs">
              U
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                بوابة الطالب الأكاديمية
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  {student?.group_name || "طالب"}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {student?.college_name} • {student?.program_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotificationsModal(true)}
              className="relative h-8 px-2.5 gap-1.5 border-primary/20 hover:bg-primary/5 text-foreground"
              title="مركز التنبيهات والإعلانات العاجلة"
            >
              <Bell className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-xs font-semibold">التنبيهات</span>
              {announcements.length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
              {announcements.length > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px] rounded-full">
                  {announcements.length}
                </Badge>
              )}
            </Button>

            <Link to="/student/qa">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">استبيانات التقييم</span>
              </Button>
            </Link>

            <Link to="/privacy">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-8 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الأمان والخصوصية</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Student Academic Identity Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {student?.full_name?.charAt(0) || "ط"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{student?.full_name}</h2>
                  <Badge variant="outline" className="text-xs font-mono">
                    الرقم الأكاديمي: {student?.academic_number}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    {student?.college_name}
                  </span>
                  <span>•</span>
                  <span>{student?.department_name}</span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{student?.level_name}</span>
                  {student?.block_name && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {student?.block_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setShowQRScannerModal(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold h-9"
              >
                <QrCode className="w-4 h-4" />
                <span>مسح رمز QR للتحضير</span>
              </Button>

              <Button
                onClick={() => setShowAssignmentModal(true)}
                variant="outline"
                className="gap-1.5 h-9 border-primary/30 hover:bg-primary/5 text-xs font-medium"
              >
                <FileCheck className="w-4 h-4 text-primary" />
                <span>تسليم تكليف / واجب</span>
              </Button>

              <Button
                onClick={() => setShowExcuseDialog(true)}
                variant="outline"
                className="gap-1.5 h-9 border-primary/30 hover:bg-primary/5 text-xs font-medium"
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>رفع عذر طبي / غياب</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b overflow-x-auto pb-2 scrollbar-none">
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
        </div>

        {/* ==================================================================== */}
        {/* 1. TAB: OVERVIEW (لوحة المتابعة الشاملة) */}
        {/* ==================================================================== */}
        {currentTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
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
                    className={`text-xs font-semibold ${
                      (stats?.rate || 0) >= 85
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
                      {todayLectures.map((lec) => (
                        <div
                          key={lec.timetable_id}
                          className={`p-4 rounded-xl border transition-all ${
                            lec.status_code === 1
                              ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                              : "border-border/70 bg-card hover:bg-accent/5"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-foreground text-sm sm:text-base">
                                  {lec.course_name}
                                </h4>
                                <Badge variant="secondary" className="text-[11px]">
                                  {lec.lecture_type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                <span>أستاذ المقرر: {lec.lecturer_name}</span>
                                <span>•</span>
                                <span className="font-semibold text-foreground">القاعة: {lec.classroom}</span>
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
                                className={`text-[11px] ${
                                  lec.status_code === 1 ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse" : ""
                                }`}
                              >
                                {lec.status_text}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Latest Announcements */}
              <Card className="lg:col-span-5 shadow-sm border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-base sm:text-lg">تنبيهات وإعلانات الدكاترة</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {announcements.length} إشعار
                    </Badge>
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. TAB: WEEKLY TIMETABLE (الجدول الدراسي الأسبوعي) */}
        {/* ==================================================================== */}
        {currentTab === "timetable" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">الجدول الدراسي الأسبوعي المعتمد</CardTitle>
                    <CardDescription>
                      مجموعتك: {student?.group_name} • من السبت إلى الخميس
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoadingTimetable ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : weeklyTimetable.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">لم يتم العثور على حصص مجدولة.</p>
                ) : (
                  <div className="space-y-6">
                    {weeklyTimetable.map((dayGroup) => (
                      <div key={dayGroup.day} className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <h3 className="font-bold text-base text-foreground">يوم {dayGroup.day}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {dayGroup.slots.length} حصص
                          </Badge>
                        </div>

                        {dayGroup.slots.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pr-6">لا توجد محاضرات في هذا اليوم.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
                            {dayGroup.slots.map((s: any) => (
                              <div
                                key={s.timetable_id}
                                className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-2"
                              >
                                <div className="flex items-start justify-between">
                                  <span className="font-mono text-xs font-bold text-primary">{s.course_code}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {s.lecture_type}
                                  </Badge>
                                </div>

                                <h4 className="font-bold text-sm text-foreground">{s.course_name}</h4>

                                <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    <span>
                                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} ({s.period_name})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-primary" />
                                    <span>{s.classroom_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    <span>أستاذ المقرر: {s.lecturer_name}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
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
        {/* 4. TAB: GRADES & RESULTS (أعمال الفصل والدرجات) */}
        {/* ==================================================================== */}
        {currentTab === "grades" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">كشف درجات أعمال الفصل والاختبارات</CardTitle>
                    <CardDescription>
                      الدرجات والتقييمات الأكاديمية المرصودة من قِبل الدكاترة لكل مقرر
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
                    {gradesData.map((cg) => (
                      <div key={cg.course_id} className="p-4 rounded-xl border border-border/70 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-primary">{cg.course_code}</span>
                            <h3 className="text-base font-bold text-foreground">{cg.course_name}</h3>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-muted-foreground block">المجموع المرصود:</span>
                              <span className="text-lg font-bold text-primary">
                                {cg.total_score} / {cg.max_score}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs h-7">
                              {cg.percentage}%
                            </Badge>
                          </div>
                        </div>

                        {cg.assessments.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2 italic">لم تتم إضافة بنود تقييم بعد.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cg.assessments.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between space-y-2 text-xs"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-foreground">{item.name}</span>
                                  <span className="font-mono font-bold text-primary">
                                    {item.score} / {item.max_score}
                                  </span>
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
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          ex.status === 1
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

      </main>

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
              <Select value={excuseCourseId} onValueChange={setExcuseCourseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المقرر الدراسي" />
                </SelectTrigger>
                <SelectContent>
                  {registeredCourses.map((c) => (
                    <SelectItem key={c.course_id} value={c.course_id.toString()}>
                      {c.course_name} ({c.course_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      <StudentQRScannerModal
        open={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        onSuccess={() => fetchSummary()}
      />

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
    </div>
  );
}

