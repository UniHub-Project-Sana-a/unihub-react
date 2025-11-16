import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Info, Link, FileText, CheckCircle2, AlertCircle, Download, ZoomIn, ZoomOut, Clock, MapPin, User, Loader2, PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { addDays, format, getDay, eachDayOfInterval } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const { toast } = useToast();
  const collegeIdNum = Number(collegeId);
  const [importSource, setImportSource] = useState<"manual" | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "conflict">("idle");
  
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

  const openCreateSessionModal = async () => {
    try {
      const res = await api.get('/v1/schedulable-lectures');
      setSchedulableLectures(res.data?.data || []);
      setIsSessionModalOpen(true);
    } catch (error: any) {
      // ✅ --- التعديل هنا: منطق أكثر تفصيلاً لعرض الخطأ --- ✅
      
      console.error("Failed to fetch schedulable lectures:", error.response?.data || error);

      // استخلاص رسالة الخطأ من استجابة Laravel
      let errorMessage = "فشل جلب المحاضرات القابلة للجدولة."; // رسالة افتراضية
      
      if (error.response?.data?.error) {
        // إذا كان الخادم يرسل رسالة خطأ صريحة في حقل 'error'
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        // إذا كان الخادم يرسل رسالة في حقل 'message'
        errorMessage = error.response.data.message;
      }

      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive",
        duration: 9000, // زيادة مدة عرض التنبيه لقراءة الخطأ
      });
    }
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
  const fetchSessionsGrid = async () => {
  setIsGridLoading(true);
  try {
    // الطلب الآن لا يرسل أي تواريخ
    const res = await api.get('/v1/lecture-sessions');

    const sessions = res.data?.data || [];
    
    const mappedSessions = sessions.map((session: any) => {
        const timetable = session.timetable; 
        if (!timetable) return null;

        return {
            id: session.session_id,
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
    toast({ title: "خطأ", description: "فشل تحميل جدول الجلسات.", variant: "destructive" });
    setSessionsGrid([]);
  } finally {
    setIsGridLoading(false);
  }
};

  useEffect(() => {
    fetchSessionsGrid();
  }, []);
  
  // دالة لإنشاء الجلسة
  const handleCreateSession = async () => {
     console.log("Values before submit:", { selectedLectureForSession, sessionDate });
        if (!selectedLectureForSession || !sessionDate) {
      toast({ title: "بيانات ناقصة", description: "الرجاء اختيار محاضرة وتاريخ.", variant: "destructive" });
      return;
    }
    setIsCreatingSession(true);
    try {
      await api.post('/v1/lecture-sessions', {
        timetable_id: selectedLectureForSession.timetable_id,
        session_date: sessionDate,
      });
      toast({ title: "نجاح", description: "تم إنشاء الجلسة بنجاح." });
      setIsSessionModalOpen(false);
      setSelectedLectureForSession(null);
      setSessionDate("");
      // يمكنك إعادة جلب البيانات هنا إذا أردت تحديث القائمة
    } catch (error: any) {
      toast({
        title: "خطأ في الإنشاء",
        description: error.response?.data?.message || "فشل إنشاء الجلسة.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSession(false);
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
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
         {/* ✅ --- قسم الشرح والإرشادات --- ✅ */}
        {/* ✅ --- قسم الشرح والإرشادات (مُصحح) --- ✅ */}
        <Alert className="mb-4 bg-background/80">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-bold">دليل استخدام وحدة الجداول</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2 text-sm">
              <p>هذه الوحدة تتيح لك إدارة قوالب الجداول والجلسات الفعلية للمحاضرات بطريقتين:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong className="text-primary">الجداول الأسبوعية (المتكررة):</strong>
                  <ul className="pr-4">
                    <li>
                      اذهب إلى <span className="font-semibold">"إدارة الجدول"</span>
                      <span className="mx-2">{'>'}</span> 
                      <span className="font-semibold">"إضافة للجدول الرئيسي"</span>.
                    </li>
                    <li className="ml-4">
                      عند إدخال محاضرة، حدد تاريخ بداية ونهاية يغطي الفصل الدراسي كاملاً (مثلاً، من 1 سبتمبر إلى 31 ديسمبر).
                    </li>
                  </ul>
                </li>
                <li>
                  <strong className="text-primary">الجداول اليومية (لمحاضرة واحدة):</strong>
                   <ul className="pr-4">
                    <li>
                      اذهب إلى <span className="font-semibold">"إدارة الجدول"</span>
                      <span className="mx-2">{'>'}</span> 
                      <span className="font-semibold">"إضافة للجدول الرئيسي"</span>.
                    </li>
                    <li className="ml-4">
                      عند إدخال المحاضرة، اختر **نفس التاريخ** في حقلي "تاريخ البداية" و "تاريخ النهاية".
                    </li>
                  </ul>
                </li>
              </ul>
              <p className="pt-2">
                لتحويل محاضرة من الجدول الرئيسي إلى جلسة فعلية قابلة للتحضير، استخدم زر <span className="font-semibold">"إنشاء جلسة محاضرة"</span>.
              </p>
            </div>
          </AlertDescription>
        </Alert>
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
                  {/* Lecturer */}
                  <div>
                    <Label>المحاضر</Label>
                    <Select value={String(manualForm.lecturer_id)} onValueChange={(v) => setManualForm({ ...manualForm, lecturer_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر محاضراً" /></SelectTrigger>
                      <SelectContent>{lecturers.map(l => <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.lecturer_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecturer_id}</p>}
                  </div>
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
                        <SelectItem value="0">محاضرة</SelectItem>
                        <SelectItem value="1">عملي</SelectItem>
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
          <TabsContent value="view" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>عرض الجلسات المجدولة</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  جميع الجلسات التي تم إنشاؤها ولم تتم مصادقتها بعد.
                  <Button onClick={fetchSessionsGrid} variant="ghost" size="icon" className="h-6 w-6">
                    <Loader2 className={`h-4 w-4 ${isGridLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="backdrop-blur-sm overflow-x-auto relative">
              <CardContent className="pt-6">
                {isGridLoading ? (
                  <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : sessionsGrid.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">لا توجد جلسات مجدولة حاليًا.</div>
                ) : (
                  <div className="min-w-[1200px]">
                    <div className="grid grid-cols-8 gap-2">
                      <div className="font-bold text-center p-4 bg-card rounded-lg">الوقت</div>
                      {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => (
                        <div key={day} className="font-bold text-center p-4 bg-card rounded-lg">{day}</div>
                      ))}
                    </div>
                    
                    {periods.sort((a,b) => (a.start_time || "").localeCompare(b.start_time || "")).map((period) => {
                      const timeLabel = `${fmtHHMM(period.start_time)}-${fmtHHMM(period.end_time)}`;
                      return (
                        <div key={period.period_id} className="grid grid-cols-8 gap-2 mt-2 items-start">
                          <div className="text-center p-4 bg-card/50 rounded-lg flex items-center justify-center h-full"><Clock className="w-4 h-4 ml-2" />{timeLabel}</div>
                          
                          {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => {
                            // ✅ 1. جلب جميع الجلسات في هذه الخانة
                            const sessionsInSlot = sessionsGrid.filter(s => normalizeDayName(s.day) === normalizeDayName(day) && s.time === timeLabel);
                            
                            return (
                              <div key={day} className="min-h-[120px] p-1">
                                {sessionsInSlot.length === 0 ? (
                                  // الحالة أ: لا توجد جلسات
                                  <div className="h-full border border-dashed border-border/30 rounded-lg bg-transparent"></div>
                                ) : sessionsInSlot.length === 1 ? (
                                  // الحالة ب: توجد جلسة واحدة فقط
                                  <Card className="h-full border bg-background/80">
                                    <CardContent className="p-2 text-right text-xs flex flex-col justify-between h-full">
                                      <div>
                                        <div className="flex justify-between items-start">
                                          <span className="font-bold">{sessionsInSlot[0].code}</span>
                                          <Badge variant="outline">مجدولة</Badge>
                                        </div>
                                        <p className="mt-1 font-semibold">{sessionsInSlot[0].course}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mt-1 flex items-center justify-end gap-1"><span>{sessionsInSlot[0].instructor}</span><User className="w-3 h-3" /></p>
                                        <p className="text-muted-foreground flex items-center justify-end gap-1"><span>{sessionsInSlot[0].room}</span><MapPin className="w-3 h-3" /></p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  // ✅ الحالة ج: توجد أكثر من جلسة
                                  <Card
                                    className="h-full border-2 border-primary/50 bg-primary/5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/10 transition-all"
                                    onClick={() => openSlotModal(sessionsInSlot, day, timeLabel)}
                                  >
                                    <CardContent className="p-2">
                                      <div className="font-bold text-lg text-primary">{sessionsInSlot.length}</div>
                                      <p className="text-sm text-primary/80">جلسات</p>
                                      <p className="text-xs text-muted-foreground mt-2">انقر لعرض التفاصيل</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ✅ --- المودال الجديد لعرض الجلسات المتعددة --- ✅ */}
        <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>الجلسات المجدولة لـ {modalSlotInfo.day} - {modalSlotInfo.time}</DialogTitle>
            <DialogDescription>
              جميع الجلسات المجدولة في هذا الوقت.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {modalSessions.map(session => (
              <Card key={session.id} className="border bg-background">
                <CardContent className="p-4 text-right">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-lg">{session.course} <span className="text-sm font-normal text-muted-foreground">({session.code})</span></p>
                      <Badge variant="outline">مجدولة</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="flex items-center justify-end gap-2"><span>{session.instructor}</span><User className="w-4 h-4 text-muted-foreground" /></p>
                        <p className="flex items-center justify-end gap-2"><span>{session.room}</span><MapPin className="w-4 h-4 text-muted-foreground" /></p>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
        </Dialog>
  
              {/* === مودال إنشاء الجلسات (مع تقييد اليوم) === */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء جلسة محاضرة جديدة</DialogTitle>
            <DialogDescription>
              اختر محاضرة وسيتم عرض التواريخ المتاحة لها فقط.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lecture-select">اختر المحاضرة</Label>
              <Select
                onValueChange={(value) => {
                  const selected = schedulableLectures.find(lec => String(lec.timetable_id) === value);
                  setSelectedLectureForSession(selected || null);
                  setSessionDate(""); // تفريغ التاريخ عند تغيير المحاضرة
                  
                  // ✅ توليد التواريخ المتاحة عند اختيار محاضرة
                  const dates = generateAvailableDates(selected);
                  // console.log("Generated Dates for Session:", dates);
                  setAvailableSessionDates(dates);
                }}
                value={selectedLectureForSession ? String(selectedLectureForSession.timetable_id) : ""}
              >
                <SelectTrigger id="lecture-select">
                  <SelectValue placeholder="اختر محاضرة لجدولتها..." />
                </SelectTrigger>
                <SelectContent>
                  {schedulableLectures.map((lec) => (
                    <SelectItem key={lec.timetable_id} value={String(lec.timetable_id)}>
                      {lec.course?.course_name} - ({lec.group?.group_name}) - {lec.day?.day_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLectureForSession && (
              <div className="space-y-2">
                <Label htmlFor="session-date-select">تاريخ الجلسة</Label>
                <Select
                  value={sessionDate}
                  onValueChange={setSessionDate}
                  disabled={availableSessionDates.length === 0}
                >
                  <SelectTrigger id="session-date-select">
                    <SelectValue placeholder="اختر تاريخًا من التواريخ المتاحة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessionDates.length > 0 ? (
                      availableSessionDates.map(date => (
                        <SelectItem key={date} value={date}>
                          {date}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        لا توجد تواريخ متاحة في هذا النطاق.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  تم عرض التواريخ التي توافق يوم "{selectedLectureForSession.day.name}" فقط.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateSession} disabled={isCreatingSession || !sessionDate}>
              {isCreatingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إنشاء الجلسة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}