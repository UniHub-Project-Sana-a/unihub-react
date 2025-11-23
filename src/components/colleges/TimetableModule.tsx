import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Info, Link, FileText, CheckCircle2, AlertCircle, Download, ZoomIn, ZoomOut, Clock, MapPin, User, Loader2, PlusCircle, Search, RefreshCw  } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { addDays, format, getDay, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday  } from "date-fns";
import { ar } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox"

// --- Types ---
type ImportLog = { id: number; created_at: string; source: string; items: number; status: string; notes?: string; };
type LectureSession = {
    session_id: number; timetable_id: number; session_date: string;
    start_time: string; end_time: string; status: number;
};

// --- DB Types for Form Dropdowns ---
type Course = { course_id: number; name: string; code?: string; department_id?: number; semester_id?: number };
type Lecturer = { lecturer_id: number; name: string; department_id?: number; college_id?: number; user?: { full_name: string } };
type Group = { group_id: number; name: string };
type Classroom = { classroom_id: number; name: string; capacity?: number; college_id?: number };
type Day = { day_id: number; name?: string; name_ar?: string };
type Period = { period_id: number; name?: string; start_time?: string; end_time?: string; college_id?: number };
type College = { college_id: number; name: string };
type Department = { department_id: number; name: string; college_id: number };
type Program = { program_id: number; program_name: string; department_id: number };
type Level = { level_id: number; level_number: number; level_name?: string; program_id: number };


interface TimetableModuleProps {
  collegeId: string;
}

export default function TimetableModule({ collegeId }: TimetableModuleProps) {
  // ========================= الإعدادات العامة =========================
  
  // --- ✅ حالات ودوال خاصة بمودال عرض الجلسات المتعددة ---
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [modalSessions, setModalSessions] = useState<any[]>([]);
  const [modalSlotInfo, setModalSlotInfo] = useState({ day: "", time: "" });
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  // --- حالات خاصة بتبويب عرض الجلسات ---
  const [sessionsGrid, setSessionsGrid] = useState<any[]>([]);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [viewStartDate, setViewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSessionDates, setAvailableSessionDates] = useState<string[]>([]);
  // --- حالات خاصة بمودال إنشاء الجلسات ---
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [schedulableLectures, setSchedulableLectures] = useState<any[]>([]);
  const [selectedLectureForSession, setSelectedLectureForSession] = useState<any | null>(null);
  const [sessionDate, setSessionDate] = useState<string>("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createAllSessions, setCreateAllSessions] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // --- ⬇️ أضف هذه الحالات الجديدة هنا ⬇️ ---
  const [isExternalLecturer, setIsExternalLecturer] = useState(false);
  const [externalCollegeId, setExternalCollegeId] = useState<string>("");
  const [availableLecturers, setAvailableLecturers] = useState<Lecturer[]>([]);
  // --- ⬆️ نهاية الإضافة ⬆️ ---

  const { toast } = useToast();
  const collegeIdNum = Number(collegeId);
  const [importSource, setImportSource] = useState<"manual" | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "conflict">("idle");
  const [viewDate, setViewDate] = useState(new Date());
  
  // ربط axios instance المركزي
  const apiJson = async (path: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();
    const data = init?.body ? JSON.parse(init.body as string) : undefined;
    switch (method) {
      case "GET": return api.get(path).then((r) => r.data);
      case "POST": return api.post(path, data).then((r) => r.data);
      // ... other methods
      default: return api.request({ url: path, method: method as any, data }).then((r) => r.data);
    }
  };

  // ===================== بيانات السجل والتعارضات (وهمية حالياً) =====================
  const [mockConflicts, setMockConflicts] = useState<any[]>([]);
  const [mockImportLog, setMockImportLog] = useState<any[]>([]);

  // ===================== تحميل بيانات القوائم المنسدلة للنموذج =====================
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupsError, setLookupsError] = useState<string | null>(null);

  // تحميل البيانات الأولية للنموذج
  useEffect(() => {
    if (!collegeIdNum) return;
    const loadInitialForForm = async () => {
      setLookupsLoading(true);
      setLookupsError(null);
      try {
        const [colRes, depRes, daysRes, periodsRes, roomsRes, lecturersRes] = await Promise.all([
          apiJson(`/v1/colleges`),
          apiJson(`/v1/departments?college_id=${collegeIdNum}`),
          apiJson(`/v1/days`),
          apiJson(`/v1/periods?college_id=${collegeIdNum}`),
          apiJson(`/v1/classrooms?college_id=${collegeIdNum}`),
          apiJson(`/v1/lecturers?college_id=${collegeIdNum}`),
        ]);

        const mapData = (res: any) => res?.data || res || [];
        setColleges(mapData(colRes).map((c: any) => ({ college_id: c.college_id, name: c.college_name || c.name })));
        setDepartments(mapData(depRes).map((d: any) => ({ department_id: d.department_id, name: d.department_name || d.name, college_id: d.college_id })));
        setDays(mapData(daysRes).map((d: any) => ({ day_id: d.day_id, name: d.day_name || d.name, name_ar: d.day_name || d.name_ar })));
        setPeriods(mapData(periodsRes));
        setClassrooms(mapData(roomsRes));
        setLecturers(mapData(lecturersRes).map((l: any) => ({
            lecturer_id: l.lecturer_id,
            name: l.user?.full_name || l.full_name || l.name,
            department_id: l.department_id,
            college_id: l.college_id,
        })));
      } catch (e: any) {
        setLookupsError(e?.message || "فشل تحميل البيانات المرجعية");
      } finally {
        setLookupsLoading(false);
      }
    };
    loadInitialForForm();
  }, [collegeIdNum]);

  // هذا الـ Effect مسؤول عن تحديث قائمة المحاضرين المتاحة
  useEffect(() => {
    // ✅ --- دالة معدلة لجلب المحاضرين --- ✅
    const fetchAvailableLecturers = async () => {
        let apiUrl = '/v1/lecturers?';
        let params = new URLSearchParams();

        if (isExternalLecturer) {
            // 1. الوضع الخارجي:
            // جلب المحاضرين المخولين فقط
            params.append('can_teach_externally', '1');
            
            // (اختياري ولكن موصى به) استثناء محاضري الكلية الحالية
            params.append('exclude_college_id', String(collegeIdNum));
            
            // إذا تم تحديد كلية خارجية محددة، قم بفلترتها
            if (externalCollegeId) {
                params.append('college_id', externalCollegeId);
            }

        } else {
            // 2. الوضع الداخلي:
            // جلب جميع المحاضرين من الكلية الحالية
            if (collegeIdNum) {
                params.append('college_id', String(collegeIdNum));
            }
        }
        
        // إذا لم يكن هناك أي بارامترات، لا تقم بالطلب
        if (params.toString() === '') {
            setAvailableLecturers([]);
            return;
        }

        apiUrl += params.toString();

        try {
            console.log(`Fetching lecturers from: ${apiUrl}`); // للتصحيح
            const res = await apiJson(apiUrl);
            const lecturersData = (res?.data || res || []).map((l: any) => ({
                lecturer_id: l.lecturer_id,
                name: l.user?.full_name || l.full_name || l.name,
                department_id: l.department_id,
                college_id: l.college_id,
            }));
            setAvailableLecturers(lecturersData);
        } catch (error) {
            console.error("Failed to fetch lecturers:", error);
            toast({ title: "خطأ", description: "فشل جلب قائمة المحاضرين.", variant: "destructive" });
            setAvailableLecturers([]);
        }
    };

    fetchAvailableLecturers();
    
    // عند التبديل، قم بإعادة تعيين المحاضر المختار لمنع الأخطاء
    setManualForm(prev => ({ ...prev, lecturer_id: "" }));

  }, [isExternalLecturer, externalCollegeId, collegeIdNum]); // <-- يعتمد على هذه القيم

  // ============================ الإدخال اليدوي (timetable) ============================
  interface ManualForm {
    course_id: number | "";
    lecturer_id: number | "";
    group_id: number | "";
    classroom_id: number | "";
    day_id: number | "";
    period_id: number | "";
    lecture_type: number | "";
    status: number | "";
    start_date: string;
    end_date: string;
    academic_year: string;
    college_id: number | "";
    department_id: number | "";
    level_id: number | "";
    program_id: number | ""; // حقل مساعد
    gender_type: number | "";
    lecture_hours: number | "";
  }

  const [manualForm, setManualForm] = useState<ManualForm>({
    course_id: "", lecturer_id: "", group_id: "", classroom_id: "",
    day_id: "", period_id: "", lecture_type: 0, status: 1, start_date: "",
    end_date: "", academic_year: "", college_id: collegeIdNum || "", department_id: "",
    level_id: "", program_id: "", gender_type: 0, lecture_hours: 2,
  });

  const [manualFormErrors, setManualFormErrors] = useState<Partial<Record<keyof ManualForm, string>>>({});
  const [manualSubmitLoading, setManualSubmitLoading] = useState(false);

  useEffect(() => {
    if (collegeIdNum && manualForm.college_id !== collegeIdNum) {
      setManualForm((f) => ({ ...f, college_id: collegeIdNum }));
    }
  }, [collegeIdNum]);
  
  const computeAcademicYear = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.getMonth() + 1 >= 8 ? `${d.getFullYear()}-${d.getFullYear() + 1}` : `${d.getFullYear() - 1}-${d.getFullYear()}`;
  };

  // --- تحميل بيانات النموذج بشكل تسلسلي ---

  // عند تغيير القسم في النموذج
  useEffect(() => {
    if (!manualForm.department_id) {
      setPrograms([]); setManualForm(f => ({ ...f, program_id: "", level_id: "", course_id: "", group_id: "" }));
      return;
    }
    apiJson(`/v1/programs?department_id=${manualForm.department_id}`).then(res => setPrograms(res?.data || res || []));
  }, [manualForm.department_id]);

  // عند تغيير البرنامج في النموذج
  useEffect(() => {
    if (!manualForm.program_id) {
      setLevels([]); setManualForm(f => ({ ...f, level_id: "", course_id: "", group_id: "" }));
      return;
    }
    apiJson(`/v1/levels?program_id=${manualForm.program_id}`).then(res => setLevels(res?.data || res || []));
  }, [manualForm.program_id]);
  
  // عند تغيير المستوى في النموذج
  useEffect(() => {
    if (!manualForm.level_id) {
      setCourses([]); setGroups([]); setManualForm(f => ({ ...f, course_id: "", group_id: "" }));
      return;
    }
    (async () => {
      const [coursesRes, groupsRes] = await Promise.all([
        apiJson(`/v1/courses?level_id=${manualForm.level_id}`),
        apiJson(`/v1/student-groups?level_id=${manualForm.level_id}`),
      ]);
      const coursesData = coursesRes?.data || coursesRes || [];
      setCourses(coursesData.map(course => ({
          course_id: course.course_id,
          name: course.course_name,      // <-- هنا يتم تحويل course_name إلى name
          code: course.course_code,      // <-- وهنا يتم تحويل course_code إلى code
          department_id: course.department_id,
          semester_id: course.semester_id,
      })));
      const groupsData = groupsRes?.data || groupsRes || [];
      setGroups(groupsData.map(group => ({
          group_id: group.group_id,
          name: group.group_name // <-- هنا يتم تحويل group_name إلى name
      })));
    })();
  }, [manualForm.level_id]);


  const validateManualForm = (): boolean => {
  const errors: Partial<Record<keyof ManualForm, string>> = {};
    
    const requiredFields: (keyof ManualForm)[] = [
        'college_id', 'department_id', 'level_id', 'course_id', 'lecturer_id',
        'group_id', 'classroom_id', 'day_id', 'period_id', 'lecture_type',
        'gender_type', 'lecture_hours', 'academic_year', 'start_date', 'end_date'
    ];

    requiredFields.forEach(field => {
      const value = manualForm[field];
      if (value === "" || value === null || value === undefined) {
        errors[field] = "هذا الحقل مطلوب";
      }
    });

    if (manualForm.start_date && manualForm.end_date && new Date(manualForm.start_date) > new Date(manualForm.end_date)) {
      errors.end_date = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }

    setManualFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ --- الدالة الجديدة لجلب البيانات --- ✅
  const fetchSchedulableLectures = async () => {
      try {
          const res = await api.get('/v1/schedulable-lectures');
          const lectures = res.data?.data || [];
          setSchedulableLectures(lectures);
          return lectures; // إرجاع البيانات للاستخدام الفوري
      } catch (error: any) {
          console.error("Failed to fetch schedulable lectures:", error.response?.data || error);
          toast({
              title: "خطأ في جلب البيانات",
              description: "فشل جلب المحاضرات القابلة للجدولة.",
              variant: "destructive",
          });
          setSchedulableLectures([]); // أفرغ القائمة عند حدوث خطأ
          return [];
      }
  };
  
  // ✅ --- تعديل دالة فتح النموذج --- ✅
  const openCreateSessionModal = async () => {
      // الآن، هذه الدالة مسؤولة فقط عن جلب البيانات وفتح النموذج
      await fetchSchedulableLectures();
      setIsSessionModalOpen(true);
  };

  const openSlotModal = (sessions: any[], day: string, time: string) => {
    setModalSessions(sessions);
    setModalSlotInfo({ day, time });
    setIsSlotModalOpen(true);
  };

  const generateAvailableDates = (lecture: any): string[] => {
    // 1. تحقق من وجود البيانات اللازمة
    if (!lecture || !lecture.start_date || !lecture.end_date || !lecture.day_id) {
        return [];
    }

    // 2. تحويل day_id من Laravel إلى ترقيم JavaScript
    // افترض أن: 1=السبت, 2=الأحد, 3=الاثنين, 4=الثلاثاء, 5=الأربعاء, 6=الخميس, 7=الجمعة
    const laravelDayMap: { [key: number]: number } = {
        1: 6, // السبت
        2: 0, // الأحد
        3: 1, // الاثنين
        4: 2, // الثلاثاء
        5: 3, // الأربعاء
        6: 4, // الخميس
        7: 5, // الجمعة
    };
    const targetDayIndex = laravelDayMap[lecture.day_id];

    // إذا لم يتم العثور على اليوم، أرجع مصفوفة فارغة
    if (targetDayIndex === undefined) {
        console.error(`Day ID "${lecture.day_id}" is not a valid day.`);
        return [];
    }

    try {
        const startDate = new Date(lecture.start_date);
        const endDate = new Date(lecture.end_date);

        // تأكد من أن التواريخ صالحة
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid start or end date provided.");
            return [];
        }

        // 3. إنشاء قائمة بكل الأيام بين تاريخ البداية والنهاية
        const allDatesInInterval = eachDayOfInterval({ start: startDate, end: endDate });

        // 4. فلترة الأيام التي تطابق اليوم المطلوب فقط
        const availableDates = allDatesInInterval
            .filter(date => getDay(date) === targetDayIndex)
            .map(date => format(date, 'yyyy-MM-dd')); // تنسيق التاريخ

        return availableDates;

    } catch (error) {
        console.error("Error generating available dates:", error);
        return [];
    }
  };

  // ✅ دالة جديدة لجلب بيانات شبكة الجلسات
  const fetchSessionsGrid = async (date: Date) => {
    setIsGridLoading(true);
    try {
      // 1. حساب تاريخ بداية ونهاية الأسبوع بناءً على التاريخ المُمرر
      //    نفترض أن الأسبوع يبدأ يوم السبت (weekStartsOn: 6)
      const weekStart = startOfWeek(date, { weekStartsOn: 6 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 6 });
  
      // 2. إرسال طلب إلى الـ API مع بارامترات التاريخ
      const res = await api.get('/v1/lecture-sessions', {
        params: {
          college_id: collegeIdNum, // فلتر الكلية (مهم)
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
        }
      });
  
      const sessions = res.data?.data || [];
      
      const mappedSessions = sessions.map((session: any) => {
          const timetable = session.timetable; 
          if (!timetable) {
            console.warn("Session with ID", session.session_id, "is missing timetable relation.");
            return null;
          }
  
          // 3. معالجة البيانات وإضافة خاصية `date`
          return {
              id: session.session_id,
              date: session.session_date ? String(session.session_date).slice(0, 10) : null,
              day: timetable.day?.day_name,
              time: `${fmtHHMM(session.start_time)}-${fmtHHMM(session.end_time)}`,
              course: timetable.course?.course_name,
              code: timetable.course?.course_code,
              instructor: timetable.lecturer?.user?.full_name,
              room: timetable.classroom?.classroom_name,
              capacity: String(timetable.classroom?.capacity ?? ''),
              status: session.status,
              color: "bg-blue-500/10 border-blue-500/30",
          };
      }).filter(Boolean);
  
      setSessionsGrid(mappedSessions);
  
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحميل جدول الجلسات الأسبوعي.", variant: "destructive" });
      setSessionsGrid([]);
    } finally {
      setIsGridLoading(false);
    }
  };

  useEffect(() => {
      // استدعاء الدالة مع التاريخ الحالي عند تحميل المكون أو تغيير التاريخ
      fetchSessionsGrid(viewDate);
  }, [viewDate]);
  
  // دالة لإنشاء الجلسة
  const handleCreateSession = async () => {
    // 1. التحقق من وجود محاضرة مختارة
    if (!selectedLectureForSession) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء اختيار محاضرة أولاً.",
        variant: "destructive",
      });
      return;
    }
  
    // 2. تفعيل حالة التحميل
    setIsCreatingSession(true);
  
    // 3. تعريف دالة مساعدة لمعالجة ما بعد النجاح
    //    هذا يمنع تكرار الكود
    const handleSuccess = async () => {
      // أ. جلب بيانات الشبكة المحدثة
      fetchSessionsGrid(viewDate); 
      
      // ب. جلب قائمة المحاضرات المحدثة (مع التواريخ الجديدة)
      const updatedLectures = await fetchSchedulableLectures(); 
      
      // ج. تحديث حالة المحاضرة المختارة حالياً
      const currentLectureId = selectedLectureForSession.timetable_id;
      const updatedSelectedLecture = updatedLectures.find(
          (lec) => lec.timetable_id === currentLectureId
      );
  
      if (updatedSelectedLecture) {
          // إذا كانت المحاضرة لا تزال قابلة للجدولة (بها تواريخ متبقية)
          // قم بتحديث الكائن المختار والحالات التابعة له
          setSelectedLectureForSession(updatedSelectedLecture);
          setAvailableSessionDates(updatedSelectedLecture.available_dates || []);
          setSessionDate(""); // تفريغ التاريخ المختار
      } else {
          // إذا لم تعد المحاضرة قابلة للجدولة (تم جدولة كل تواريخها)
          // قم بإعادة تعيين كل شيء لتنظيف النموذج
          setSelectedLectureForSession(null);
          setAvailableSessionDates([]);
          setSessionDate("");
          setCreateAllSessions(false);
      }
      
      // د. إغلاق النموذج
      setIsSessionModalOpen(false); 
    };
  
    // 4. تنفيذ منطق الإنشاء بناءً على اختيار المستخدم
    if (createAllSessions) {
      // --- الحالة أ: إنشاء جميع الجلسات (Bulk) ---
      try {
        const response = await api.post('/v1/lecture-sessions/bulk', {
          timetable_id: selectedLectureForSession.timetable_id,
        });
        
        const { created_count, skipped_count } = response.data;
        toast({
          title: "اكتملت العملية بنجاح",
          description: `تم إنشاء ${created_count} جلسة جديدة. وتم تخطي ${skipped_count} جلسة لوجودها مسبقاً.`,
          duration: 9000,
          className: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700",
        });
  
        // استدعاء دالة النجاح لتحديث الواجهة
        await handleSuccess();
  
      } catch (error: any) {
        console.error("Bulk Creation API Error:", error.response);
        const serverMessage = error.response?.data?.message || error.response?.data?.error;
        const fallbackMessage = "فشل إنشاء الجلسات. تحقق من الـ console لمزيد من التفاصيل.";
        toast({
          title: "خطأ في الإنشاء المجمع",
          description: serverMessage || fallbackMessage,
          variant: "destructive",
          duration: 9000,
        });
      } finally {
        setIsCreatingSession(false);
      }
  
    } else {
      // --- الحالة ب: إنشاء جلسة واحدة (Single) ---
      if (!sessionDate) {
        toast({ title: "بيانات ناقصة", description: "الرجاء اختيار تاريخ." });
        setIsCreatingSession(false);
        return;
      }
  
      try {
        await api.post('/v1/lecture-sessions', {
          timetable_id: selectedLectureForSession.timetable_id,
          session_date: sessionDate,
        });
  
        toast({
          title: "نجاح",
          description: `تم إنشاء الجلسة بتاريخ ${sessionDate} بنجاح.`,
        });
  
        // استدعاء دالة النجاح لتحديث الواجهة
        await handleSuccess();
  
      } catch (error: any) {
        console.error("Single Creation API Error:", error.response);
        toast({
          title: "خطأ في إنشاء الجلسة",
          description: error.response?.data?.message || "فشل إنشاء الجلسة. قد تكون موجودة بالفعل.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingSession(false);
      }
    }
  };
  
  /**
   * يقوم بإعادة تعيين حقول النموذج إلى حالتها الأولية.
   */
  const resetManualForm = () => {
    setManualForm({
      college_id: collegeIdNum || "",
      department_id: "",
      program_id: "",
      level_id: "",
      course_id: "",
      lecturer_id: "",
      group_id: "",
      classroom_id: "",
      day_id: "",
      period_id: "",
      lecture_type: 0,
      status: 1,
      start_date: "",
      end_date: "",
      academic_year: "",
      gender_type: 0,
      lecture_hours: 2,
    });
    setManualFormErrors({});
    setPrograms([]);
    setLevels([]);
    setCourses([]);
    setGroups([]);
    setIsExternalLecturer(false);
    setExternalCollegeId("");
  };
  
  /**
   * يعالج عملية إرسال النموذج: يتحقق من الصحة، يرسل البيانات إلى الـ API، ويتعامل مع الاستجابة.
   */
  const handleManualSubmit = async () => {
    if (!validateManualForm()) {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء تعبئة جميع الحقول المطلوبة.",
        variant: "destructive",
      });
      return;
    }

    setManualSubmitLoading(true);
    setImportStatus("idle");
    setMockConflicts([]); // استخدم setMockConflicts هنا

    const { program_id, ...payload } = manualForm;

    try {
      console.log("إرسال البيانات إلى /v1/timetable:", payload);
      await apiJson('/v1/timetable', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة البند إلى الجدول الدراسي بنجاح.",
        className: "bg-green-500 text-white",
      });
      setImportStatus("success");
      resetManualForm();
      
    } catch (error: any) {
      console.error("API Error during submit:", error.response?.data || error);
      setImportStatus("conflict");
      
      const errorData = error.response?.data;

      // ✅ --- التعديل هنا: منطق عرض رسالة التعارض --- ✅
      if (errorData && Array.isArray(errorData.conflicts) && errorData.conflicts.length > 0) {
        // إذا أرسل الخادم مصفوفة تعارضات
        setMockConflicts(errorData.conflicts); // استخدم setMockConflicts
        toast({
          title: "تم اكتشاف تعارض",
          description: errorData.conflicts[0].message, // اعرض رسالة أول تعارض
          variant: "destructive",
        });
      } else {
        // إذا كان هناك خطأ آخر
        setMockConflicts([{ type: 'غير معروف', message: errorData?.message || 'حدث خطأ غير متوقع' }]);
        toast({
          title: "خطأ",
          description: errorData?.message || "فشل إنشاء السجل.",
          variant: "destructive",
        });
      }
      
    } finally {
      setManualSubmitLoading(false);
    }
  };

  // ============================ إدارة جلسات المحاضرات (lecture_sessions) ============================
  // const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  // const [currentTimetableId, setCurrentTimetableId] = useState<number | null>(null);
  // const [sessionsList, setSessionsList] = useState<any[]>([]);

  // const openSessionsFor = async (timetableId: number) => { /* ... */ };
  // const closeSessionsModal = () => { /* ... */ };

  const fmtHHMM = (t?: string) => (t ? t.slice(0, 5) : "");

    const normalizeDayName = (name?: string): string => {
    // إذا كان الإدخال فارغًا، أرجع سلسلة فارغة
    if (!name) return "";

    // 1. إزالة المسافات الزائدة من البداية والنهاية
    // 2. استبدال كل أشكال الألف (أ, إ, آ) بألف عادية (ا)
    // 3. تحويل كل الحروف إلى حالة صغيرة (lowercase) للمقارنة
    const s = name.trim().replace(/أ|إ|آ/g, "ا").toLowerCase();
    
    // قاموس يحتوي على الصيغ المحتملة والصيغة الموحدة
    const map: Record<string, string> = {
      "السبت": "السبت",
      "saturday": "السبت",
      "الاحد": "الأحد",
      "sunday": "الأحد",
      "الاثنين": "الاثنين",
      "monday": "الاثنين",
      "الثلاثاء": "الثلاثاء",
      "tuesday": "الثلاثاء",
      "الاربعاء": "الأربعاء",
      "wednesday": "الأربعاء",
      "الخميس": "الخميس",
      "thursday": "الخميس",
      "الجمعه": "الجمعة", // مع تاء مربوطة
      "الجمعة": "الجمعة", // مع هاء
      "friday": "الجمعة",
    };

    // ابحث عن أول مفتاح في القاموس موجود في النص المُعالج
    for (const key in map) {
      if (s.includes(key)) {
        return map[key]; // أرجع القيمة الموحدة
      }
    }

    // إذا لم يتم العثور على أي تطابق، أرجع الاسم الأصلي
    return name;
  };
  // console.log("Lectures available for scheduling:", schedulableLectures);
   return (
    <div className="space-y-6" >
      <Tabs defaultValue="import" className="w-full" dir="rtl">
         {/* ✅ --- قسم الشرح والإرشادات --- ✅ */}
        {/* ✅ --- أيقونة ومودال الشرح (جديد) --- ✅ */}
        <div className="flex justify-end mb-2">
          {/* الزر الذي يحتوي على الأيقونة */}
          <Button variant="ghost" size="icon" onClick={() => setIsInfoModalOpen(true)}>
            <Info className="h-5 w-5 text-muted-foreground hover:text-primary" />
            <span className="sr-only">عرض دليل الاستخدام</span>
          </Button>
        </div>
        
        {/* المودال الذي يحتوي على الشرح */}
        <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                دليل استخدام وحدة الجداول
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm leading-relaxed space-y-4">
              <p>هذه الوحدة تتيح لك إدارة قوالب الجداول والجلسات الفعلية للمحاضرات بطريقتين:</p>
              
              <div>
                <h4 className="font-bold text-primary mb-2">الجداول الأسبوعية (المتكررة)</h4>
                <ul className="list-disc list-inside space-y-1 pe-4">
                  <li>
                    اذهب إلى <span className="font-semibold">"إضافة / تعديل"</span>
                    <span className="mx-2">{'>'}</span> 
                    <span className="font-semibold">"إضافة للجدول الرئيسي"</span>.
                  </li>
                  <li className="me-4">
                    عند إدخال محاضرة، حدد تاريخ بداية ونهاية يغطي الفصل الدراسي كاملاً (مثلاً، من 1 سبتمبر إلى 31 ديسمبر).
                  </li>
                </ul>
              </div>
        
              <div>
                <h4 className="font-bold text-primary mb-2">الجداول اليومية (لمحاضرة واحدة)</h4>
                <ul className="list-disc list-inside space-y-1 pe-4">
                  <li>
                    اذهب إلى <span className="font-semibold">"إضافة / تعديل"</span>
                    <span className="mx-2">{'>'}</span> 
                    <span className="font-semibold">"إضافة للجدول الرئيسي"</span>.
                  </li>
                  <li className="me-4">
                    عند إدخال المحاضرة، اختر **نفس التاريخ** في حقلي "تاريخ البداية" و "تاريخ النهاية".
                  </li>
                  <li className="text-xs text-muted-foreground me-4">
                    (سيقوم النظام تلقائياً بإنشاء جلسة فعلية لهذه المحاضرة).
                  </li>
                </ul>
              </div>
              
              <div className="pt-2 border-t mt-4">
                <p>
                  لتحويل محاضرة من الجدول الأسبوعي إلى جلسة فعلية قابلة للتحضير، استخدم زر <span className="font-semibold">"إنشاء جلسة محاضرة"</span>.
                </p>
              </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsInfoModalOpen(false)}>فهمت</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ✅ --- نهاية قسم الشرح --- ✅ */}

        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">إضافة / تعديل</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:bg-primary/10">عرض الجدول</TabsTrigger>
        </TabsList>

        {/* ======================= */}
        {/* === IMPORT TAB ======== */}
        {/* ======================= */}
        <TabsContent value="import" className="space-y-6">
          {/* === Source Selector (المُعدّل) === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* البطاقة الأولى: الإدخال اليدوي للجدول */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "manual" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("manual")}
            >
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-bold text-lg mb-2">إضافة للجدول الرئيسي</h3>
                <p className="text-sm text-muted-foreground">إضافة محاضرة جديدة إلى قالب الجدول الدراسي.</p>
              </CardContent>
            </Card>
  
            {/* ✅ البطاقة الثانية: إنشاء جلسة فعلية */}
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm border-border/50 hover:border-primary"
              onClick={openCreateSessionModal}
            >
              <CardContent className="pt-6 text-center">
                <PlusCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-bold text-lg mb-2">إنشاء جلسة محاضرة</h3>
                <p className="text-sm text-muted-foreground">توليد جلسة فعلية لمحاضرة في تاريخ محدد.</p>
              </CardContent>
            </Card>
  
          </div>

          {/* ======================================================== */}
          {/* ========= UNIFIED MANUAL ENTRY FORM ======== */}
          {/* ======================================================== */}
          {importSource === "manual" && (
            <Card className="backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle>إضافة بند في الجدول الدراسي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Academic Structure Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* College */}
                  <div>
                    <Label>الكلية</Label>
                    <Input
                      disabled
                      value={colleges.find(c => c.college_id === collegeIdNum)?.name || `كلية ID: ${collegeIdNum}`}
                      className="cursor-not-allowed"
                    />
                  </div>
                  {/* Department */}
                  <div>
                    <Label>القسم</Label>
                    <Select
                      value={String(manualForm.department_id)}
                      onValueChange={(v) => setManualForm({ ...manualForm, department_id: v ? Number(v) : "", program_id: "", level_id: "", course_id: "", group_id: "" })}
                      disabled={lookupsLoading || departments.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={lookupsLoading ? "جاري التحميل..." : "اختر القسم"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {manualFormErrors.department_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.department_id}</p>}
                  </div>
                  {/* Program */}
                  <div>
                    <Label>البرنامج</Label>
                    <Select
                      value={String(manualForm.program_id)}
                      onValueChange={(v) => setManualForm({ ...manualForm, program_id: v ? Number(v) : "", level_id: "", course_id: "", group_id: "" })}
                      disabled={!manualForm.department_id || programs.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!manualForm.department_id ? "اختر القسم أولاً" : "اختر البرنامج"} />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map(p => <SelectItem key={p.program_id} value={String(p.program_id)}>{p.program_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
  
                  {/* Level */}
                  <div>
                    <Label>المستوى</Label>
                    <Select
                      value={String(manualForm.level_id)}
                      onValueChange={(v) => setManualForm({ ...manualForm, level_id: v ? Number(v) : "", course_id: "", group_id: "" })}
                      disabled={!manualForm.program_id || levels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!manualForm.program_id ? "اختر البرنامج أولاً" : "اختر المستوى"} />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(l => <SelectItem key={l.level_id} value={String(l.level_id)}>{l.level_name || `المستوى ${l.level_number}`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {manualFormErrors.level_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.level_id}</p>}
                  </div>
                </div>

                <hr className="border-border/20" />

                {/* Lecture Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Course */}
                  <div>
                    <Label>المقرر</Label>
                    <Select value={String(manualForm.course_id)} onValueChange={(v) => setManualForm({ ...manualForm, course_id: v ? Number(v) : "" })} disabled={!manualForm.level_id || courses.length === 0}>
                      <SelectTrigger><SelectValue placeholder="اختر المستوى أولاً" /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.course_id} value={String(c.course_id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.course_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.course_id}</p>}
                  </div>
                  {/* Group */}
                  <div>
                    <Label>المجموعة الطلابية</Label>
                    <Select value={String(manualForm.group_id)} onValueChange={(v) => setManualForm({ ...manualForm, group_id: v ? Number(v) : "" })} disabled={!manualForm.level_id || groups.length === 0}>
                      <SelectTrigger><SelectValue placeholder="اختر المستوى أولاً" /></SelectTrigger>
                      <SelectContent>{groups.map(g => <SelectItem key={g.group_id} value={String(g.group_id)}>{g.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.group_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.group_id}</p>}
                  </div>
                  {/* ======================= LECTURER SECTION (MODIFIED) ======================= */}
                  {/* خانة الاختيار لتفعيل وضع المحاضر الخارجي */}
                  <div className="col-span-3 flex items-center space-x-2 rtl:space-x-reverse pt-4">
                      <Checkbox
                          id="external-lecturer-toggle"
                          checked={isExternalLecturer}
                          onCheckedChange={(checked: boolean) => {
                              setIsExternalLecturer(checked);
                              // عند إلغاء التفعيل، أعد تعيين الكلية الخارجية والمحاضر
                              if (!checked) {
                                  setExternalCollegeId("");
                                  setManualForm({ ...manualForm, lecturer_id: "" });
                              }
                          }}
                      />
                      <label
                          htmlFor="external-lecturer-toggle"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                          اختيار محاضر من كلية أخرى
                      </label>
                  </div>
              
                  {/* حقل اختيار كلية المحاضر (يظهر فقط إذا تم تفعيل الخيار أعلاه) */}
                  {isExternalLecturer && (
                      <div>
                          <Label>كلية المحاضر</Label>
                          <Select
                              value={String(externalCollegeId)}
                              onValueChange={(v) => {
                                  setExternalCollegeId(v);
                                  // أفرغ اختيار المحاضر عند تغيير الكلية
                                  setManualForm({ ...manualForm, lecturer_id: "" });
                              }}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="اختر كلية المحاضر" />
                              </SelectTrigger>
                              <SelectContent>
                                  {/* قائمة `colleges` لديك تحتوي على كل الكليات */}
                                  {colleges.map(c => 
                                      <SelectItem key={c.college_id} value={String(c.college_id)}>
                                          {c.name}
                                      </SelectItem>
                                  )}
                              </SelectContent>
                          </Select>
                      </div>
                  )}
              
                  {/* حقل اختيار المحاضر (مُعدّل) */}
                  <div>
                      <Label>المحاضر</Label>
                      <Select 
                          value={String(manualForm.lecturer_id)} 
                          onValueChange={(v) => setManualForm({ ...manualForm, lecturer_id: v ? Number(v) : "" })}
                          // يتم تعطيل الحقل إذا كان الوضع "خارجي" ولم يتم اختيار كلية بعد
                          disabled={isExternalLecturer && !externalCollegeId}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder={
                                  isExternalLecturer && !externalCollegeId 
                                  ? "اختر كلية المحاضر أولاً" 
                                  : "اختر محاضراً"
                              } />
                          </SelectTrigger>
                          <SelectContent>
                              {/* القائمة أصبحت الآن `availableLecturers` الديناميكية */}
                              {availableLecturers.map(l => <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>{l.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      {manualFormErrors.lecturer_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecturer_id}</p>}
                  </div>
                  {/* ===================== END OF LECTURER SECTION ===================== */}
                  {/* Classroom */}
                  <div>
                    <Label>القاعة</Label>
                    <Select value={String(manualForm.classroom_id)} onValueChange={(v) => setManualForm({ ...manualForm, classroom_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر قاعة" /></SelectTrigger>
                      <SelectContent>{classrooms.map(r => <SelectItem key={r.classroom_id} value={String(r.classroom_id)}>{r.name} {r.capacity ? `(${r.capacity})` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.classroom_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.classroom_id}</p>}
                  </div>
                  {/* Day */}
                  <div>
                    <Label>اليوم</Label>
                    <Select value={String(manualForm.day_id)} onValueChange={(v) => setManualForm({ ...manualForm, day_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر اليوم" /></SelectTrigger>
                      <SelectContent>{days.map(d => <SelectItem key={d.day_id} value={String(d.day_id)}>{d.name_ar || d.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.day_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.day_id}</p>}
                  </div>
                  {/* Period */}
                  <div>
                    <Label>الفترة</Label>
                    <Select value={String(manualForm.period_id)} onValueChange={(v) => setManualForm({ ...manualForm, period_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر الفترة" /></SelectTrigger>
                      <SelectContent>{periods.map(p => <SelectItem key={p.period_id} value={String(p.period_id)}>{`${p.start_time?.slice(0,5)} - ${p.end_time?.slice(0,5)}`}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.period_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.period_id}</p>}
                  </div>
                </div>

                <hr className="border-border/20" />

                {/* Dates and Properties Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>تاريخ البداية</Label>
                    <Input type="date" value={manualForm.start_date} onChange={(e) => setManualForm({ ...manualForm, start_date: e.target.value, academic_year: computeAcademicYear(e.target.value) })}/>
                    {manualFormErrors.start_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.start_date}</p>}
                  </div>
                  <div>
                    <Label>تاريخ النهاية</Label>
                    <Input type="date" value={manualForm.end_date} onChange={(e) => setManualForm({ ...manualForm, end_date: e.target.value })}/>
                    {manualFormErrors.end_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.end_date}</p>}
                  </div>
                  <div>
                    <Label>العام الأكاديمي</Label>
                    <Input placeholder="2024-2025" value={manualForm.academic_year} onChange={(e) => setManualForm({ ...manualForm, academic_year: e.target.value })}/>
                    {manualFormErrors.academic_year && <p className="text-xs text-destructive mt-1">{manualFormErrors.academic_year}</p>}
                  </div>
                  <div>
                    <Label>ساعات المحاضرة</Label>
                    <Input type="number" step="0.25" min="0" value={String(manualForm.lecture_hours)} onChange={(e) => setManualForm({ ...manualForm, lecture_hours: e.target.value === "" ? "" : Number(e.target.value) })}/>
                    {manualFormErrors.lecture_hours && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecture_hours}</p>}
                  </div>
                  <div>
                    <Label>نوع المحاضرة</Label>
                    <Select value={String(manualForm.lecture_type)} onValueChange={(v) => setManualForm({ ...manualForm, lecture_type: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">أساسية</SelectItem>
                        <SelectItem value="1">تعويضي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحالة</Label>
                    <Select value={String(manualForm.status)} onValueChange={(v) => setManualForm({ ...manualForm, status: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">فعال</SelectItem>
                        <SelectItem value="0">غير فعال</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع الجنس</Label>
                    <Select value={String(manualForm.gender_type)} onValueChange={(v) => setManualForm({ ...manualForm, gender_type: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">مختلط</SelectItem>
                        <SelectItem value="0">ذكور</SelectItem>
                        <SelectItem value="3">إناث</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleManualSubmit} disabled={manualSubmitLoading}>
                    {manualSubmitLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    حفظ البند
                  </Button>
                  <Button variant="outline" onClick={resetManualForm}>تفريغ</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Banner, Conflicts Panel, and Import Log can be added here */}
  
          </TabsContent>
  
          {/* ======================================= */}
          {/* === VIEW TAB (FINAL WITH MODAL) === */}
          {/* ======================================= */}
          <TabsContent value="view" className="space-y-4">
            {/* --- لوحة التحكم بالتاريخ --- */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <CardTitle>عرض الجلسات الأسبوعي</CardTitle>
                    <CardDescription><br/>
                      {format(startOfWeek(viewDate, { weekStartsOn: 6 }), 'd MMMM yyyy', { locale: ar })} - {format(endOfWeek(viewDate, { weekStartsOn: 6 }), 'd MMMM yyyy', { locale: ar })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setViewDate(subDays(viewDate, 7))} variant="outline">
                      الأسبوع السابق
                    </Button>
                    <Button onClick={() => setViewDate(new Date())} variant="secondary">
                      الحالي
                    </Button>
                    <Button onClick={() => setViewDate(addDays(viewDate, 7))} variant="outline">
                      الأسبوع التالي
                    </Button>
                    <Button onClick={() => fetchSessionsGrid(viewDate)} variant="ghost" size="icon" className="h-9 w-9">
                      <RefreshCw className={`h-4 w-4 ${isGridLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* --- عرض الجدول --- */}
            <Card className="backdrop-blur-sm overflow-x-auto relative">
              <CardContent className="pt-6">
                {isGridLoading ? (
                  <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="min-w-[1200px]">
                    {(() => {
                      const weekStart = startOfWeek(viewDate, { weekStartsOn: 6 });
                      const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
            
                      return (
                        <>
                          {/* رأس الجدول */}
                          <div className="grid grid-cols-8 gap-2">
                            <div className="font-bold text-center p-2 bg-card rounded-lg flex items-center justify-center">الوقت</div>
                            {weekDays.map(day => (
                              <div key={day.toString()} className="font-bold text-center p-2 bg-card rounded-lg">
                                <div>{format(day, 'eeee', { locale: ar })}</div>
                                <div className="text-sm font-normal text-muted-foreground">{format(day, 'd/M')}</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* جسم الجدول */}
                          {periods.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map((period) => {
                            const timeLabel = `${fmtHHMM(period.start_time)}-${fmtHHMM(period.end_time)}`;
                            return (
                              <div key={period.period_id} className="grid grid-cols-8 gap-2 mt-2 items-start">
                                <div className="text-center p-2 bg-card/50 rounded-lg flex items-center justify-center h-full text-sm">
                                  <Clock className="w-4 h-4 ml-2" />{timeLabel}
                                </div>
                                
                                {weekDays.map(currentDay => {
                                  const currentDayString = format(currentDay, 'yyyy-MM-dd');
                                  // ✅ --- إصلاح فلترة التاريخ هنا --- ✅
                                  const sessionsInSlot = sessionsGrid.filter(s => 
                                    s.date?.slice(0, 10) === currentDayString && 
                                    s.time === timeLabel
                                  );
                                  
                                  // --- ✅ --- تعريف مكون البطاقة هنا لتجنب أخطاء JSX --- ✅ ---
                                  const SessionCard = ({ session }: { session: any }) => {
                                    const isPast = new Date(session.date) < new Date() && !isToday(new Date(session.date));
                                    
                                    let cardClass = "bg-background/80";
                                    let badgeText = "مجدولة";
                                    let badgeVariant: "outline" | "secondary" | "destructive" | "default" = "outline";                                        
            
                                    if (isPast) {
                                        if (session.status === 1) { // تم التحضير
                                            cardClass = "bg-green-100/50 dark:bg-green-900/30 border-green-500/50";
                                            badgeText = "مكتملة";
                                            badgeVariant = "secondary";
                                        } else { // لم يتم التحضير
                                            cardClass = "bg-red-100/50 dark:bg-red-900/30 border-red-500/50";
                                            badgeText = "فاتت";
                                            badgeVariant = "destructive";
                                        }
                                    }                                        
            
                                    return (
                                        <Card className={cn("h-full border shadow-sm hover:shadow-md transition-shadow", cardClass)}>
                                            <CardContent className="p-2 text-right text-xs flex flex-col justify-between h-full">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-primary">{session.code || 'N/A'}</span>
                                                        <Badge variant={badgeVariant}>{badgeText}</Badge>
                                                    </div>
                                                    <p className="mt-1 font-semibold leading-tight">{session.course || 'مقرر غير محدد'}</p>
                                                </div>
                                                <div className="mt-2 pt-1 border-t border-dashed">
                                                    <p className="text-muted-foreground mt-1 flex items-center justify-end gap-1">
                                                        <span>{session.instructor || 'محاضر غير محدد'}</span>
                                                        <User className="w-3 h-3" />
                                                    </p>
                                                    <p className="text-muted-foreground flex items-center justify-end gap-1">
                                                        <span>{session.room || 'قاعة غير محددة'}</span>
                                                        <MapPin className="w-3 h-3" />
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                  };
                                  
                                  return (
                                    <div key={currentDayString} className="min-h-[120px] p-1 space-y-1">
                                      {sessionsInSlot.length === 0 ? (
                                        <div className="h-full border border-dashed border-border/30 rounded-lg bg-transparent flex items-center justify-center text-center p-2">
                                          <span className="text-xs text-muted-foreground/50">لا توجد جلسات</span>
                                        </div>
                                      ) : sessionsInSlot.length === 1 ? (
                                        // استخدام المكون الذي عرفناه للتو
                                        <SessionCard session={sessionsInSlot[0]} />
                                      ) : (
                                        <Card
                                          className="h-full border-2 border-primary/50 bg-primary/5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/10 transition-all"
                                          onClick={() => openSlotModal(sessionsInSlot, format(currentDay, 'eeee', { locale: ar }), timeLabel)}
                                        >
                                          <CardContent className="p-2">
                                            <div className="font-bold text-lg text-primary">{sessionsInSlot.length}</div>
                                            <p className="text-sm text-primary/80">جلسات</p>
                                            <p className="text-xs text-muted-foreground mt-2">انقر للعرض</p>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                          
                          {sessionsGrid.length === 0 && !isGridLoading && (
                              <div className="text-center py-20 text-muted-foreground">
                                  <p className="font-bold text-lg">أسبوع هادئ!</p>
                                  <p>لا توجد جلسات مجدولة لهذا الأسبوع.</p>
                              </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ✅ --- المودال الجديد لعرض الجلسات المتعددة --- ✅ */}
        {/* ✅ --- مودال عرض الجلسات المتعددة (مع بحث وتلوين) --- ✅ */}
        <Dialog 
          open={isSlotModalOpen} 
          onOpenChange={(isOpen) => {
            setIsSlotModalOpen(isOpen);
            // إعادة تعيين البحث عند إغلاق المودال
            if (!isOpen) {
              setModalSearchTerm("");
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>الجلسات المجدولة لـ {modalSlotInfo.day} - {modalSlotInfo.time}</DialogTitle>
              <DialogDescription>
                جميع الجلسات المجدولة في هذا الوقت.
              </DialogDescription>
            </DialogHeader>
        
            {/* --- حقل البحث الجديد --- */}
            <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                <Input
                    placeholder="ابحث باسم المقرر, المحاضر, القاعة..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="pl-10 rtl:pr-10"
                />
            </div>
        
            {/* --- عرض الجلسات المفلترة مع التلوين --- */}
            <div className="max-h-[50vh] overflow-y-auto p-1 -m-1 space-y-4">
              {(() => {
                // فلترة الجلسات بناءً على نص البحث
                const filteredSessions = modalSessions.filter(session => {
                    if (!modalSearchTerm) return true;
                    const searchTerm = modalSearchTerm.toLowerCase();
                    return (
                      session.course?.toLowerCase().includes(searchTerm) ||
                      session.instructor?.toLowerCase().includes(searchTerm) ||
                      session.room?.toLowerCase().includes(searchTerm)
                    );
                });
        
                // رسالة في حال عدم وجود نتائج للبحث
                if (filteredSessions.length === 0 && modalSearchTerm) {
                    return (
                        <div className="text-center py-10 text-muted-foreground">
                          لا توجد نتائج تطابق بحثك.
                        </div>
                    );
                }
        
                return filteredSessions.map(session => {
                  // --- منطق تحديد الألوان (نفس منطق الجدول الرئيسي) ---
                  const isPast = new Date(session.date) < new Date() && !isToday(new Date(session.date));
                  
                  let cardClass = "bg-background";
                  let badgeText = "مجدولة";
                  let badgeVariant: "outline" | "secondary" | "destructive" | "default" = "outline";
        
                  if (isPast) {
                      if (session.status === 1) { // تم التحضير
                          cardClass = "bg-green-100/50 dark:bg-green-900/30 border-green-500/50";
                          badgeText = "مكتملة";
                          badgeVariant = "secondary";
                      } else { // لم يتم التحضير
                          cardClass = "bg-red-100/50 dark:bg-red-900/30 border-red-500/50";
                          badgeText = "فاتت";
                          badgeVariant = "destructive";
                      }
                  }
        
                  return (
                    <Card key={session.id} className={cn("border transition-colors", cardClass)}>
                      <CardContent className="p-4 text-right">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-lg">{session.course} <span className="text-sm font-normal text-muted-foreground">({session.code})</span></p>
                            <Badge variant={badgeVariant}>{badgeText}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                              <p className="flex items-center justify-end gap-2"><span>{session.instructor}</span><User className="w-4 h-4 text-muted-foreground" /></p>
                              <p className="flex items-center justify-end gap-2"><span>{session.room}</span><MapPin className="w-4 h-4 text-muted-foreground" /></p>
                          </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          </DialogContent>
        </Dialog>
  
        {/* === مودال إنشاء الجلسات (مع تقييد اليوم) === */}
        <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>إنشاء جلسة محاضرة جديدة</DialogTitle>
              <DialogDescription>
                اختر محاضرة من القائمة لإنشاء جلسة فعلية لها.
              </DialogDescription>
            </DialogHeader>
        
            <div className="space-y-4 py-4">
              {/* 1. حقل اختيار المحاضرة */}
              <div className="space-y-2">
                <Label htmlFor="lecture-select">اختر المحاضرة</Label>
                <Select
                  onValueChange={(value) => {
                    const selected = schedulableLectures.find(lec => String(lec.timetable_id) === value);
                    setSelectedLectureForSession(selected || null);
                    // ✅ لم نعد نحتاج لحساب التواريخ هنا، فقط أعد تعيين الحقول
                    setSessionDate(""); 
                    setCreateAllSessions(false); 
                    // ✅ تم تحديث `availableSessionDates` مباشرة من بيانات المحاضرة
                    setAvailableSessionDates(selected?.available_dates || []);
                  }}
                  value={selectedLectureForSession ? String(selectedLectureForSession.timetable_id) : ""}
                >
                  <SelectTrigger id="lecture-select">
                    <SelectValue placeholder="اختر محاضرة لجدولتها..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schedulableLectures.length > 0 ? (
                        schedulableLectures.map((lec) => (
                            <SelectItem key={lec.timetable_id} value={String(lec.timetable_id)}>
                              {/* ✅ عرض عدد الجلسات المتاحة بجانب كل محاضرة */}
                              {lec.course?.course_name} - ({lec.group?.group_name}) - ({lec.available_dates?.length || 0} متاحة)
                            </SelectItem>
                        ))
                    ) : (
                        // ✅ --- رسالة جديدة عندما لا تكون هناك محاضرات قابلة للجدولة --- ✅
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            تم إنشاء جميع الجلسات الممكنة.
                        </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
        
              {/* هذا الجزء يظهر فقط بعد اختيار محاضرة */}
              {selectedLectureForSession && (
                <>
                  {/* 2. خانة الاختيار لإنشاء جميع الجلسات */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2 border-t border-border/20 mt-4">
                      <Checkbox
                          id="create-all-sessions-toggle"
                          checked={createAllSessions}
                          onCheckedChange={(checked: boolean) => setCreateAllSessions(checked)}
                          disabled={availableSessionDates.length === 0}
                      />
                      <label
                          htmlFor="create-all-sessions-toggle"
                          className="text-sm font-medium leading-none cursor-pointer"
                      >
                          إنشاء جميع الجلسات المتاحة ({availableSessionDates.length} جلسة)
                      </label>
                  </div>
        
                  {/* 3. حقل اختيار التاريخ (لم يتغير) */}
                  {!createAllSessions && (
                    <div className="space-y-2">
                      <Label htmlFor="session-date-select">اختر تاريخ الجلسة</Label>
                      <Select
                        value={sessionDate}
                        onValueChange={setSessionDate}
                        disabled={availableSessionDates.length === 0}
                      >
                        <SelectTrigger id="session-date-select">
                          <SelectValue placeholder="اختر تاريخًا من التواريخ المتاحة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* القائمة الآن تأتي مباشرة من `availableSessionDates` المفلترة */}
                          {availableSessionDates.map(date => (
                            <SelectItem key={date} value={date}>
                              {date}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
        
            <DialogFooter>
              {/* (لا تغيير هنا، دالة handleCreateSession والزر كما هما) */}
              <Button variant="outline" onClick={() => setIsSessionModalOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleCreateSession} 
                disabled={
                    isCreatingSession || 
                    !selectedLectureForSession ||
                    (!createAllSessions && !sessionDate) || 
                    (createAllSessions && availableSessionDates.length === 0)
                }
              >
                {isCreatingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createAllSessions ? "إنشاء جميع الجلسات" : "إنشاء الجلسة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}