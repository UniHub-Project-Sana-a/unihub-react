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
import { Checkbox } from "@/components/ui/checkbox";
import { usePermission } from "@/hooks/usePermission";

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
  const { can } = usePermission();
  
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

  // ✅ --- States خاصة بالجلسة التعويضية ---
  const [isMakeupSession, setIsMakeupSession] = useState(false);
  const [makeupStartTime, setMakeupStartTime] = useState("");
  const [makeupEndTime, setMakeupEndTime] = useState("");
  const [makeupRoomId, setMakeupRoomId] = useState("");
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
  
  // قائمة قاعات مخصصة لمودال التعويض (تحتوي على خاصية is_busy)
  const [makeupClassrooms, setMakeupClassrooms] = useState<any[]>([]);
  const [isLoadingMakeupRooms, setIsLoadingMakeupRooms] = useState(false);
  
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

  // ===================== الجزاء الخاص بالتعديل الجلسات والجدول بداية  ======================
    // --- ✅ حالات مودال تعديل الجلسة ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // المتغير الذي يحمل بيانات الجلسة المراد تعديلها
  const [editingSession, setEditingSession] = useState<any>(null);

  // --- ✅ دالة جلب تفاصيل الجلسة وفتح المودال ---
  const handleSessionClick = async (sessionId: number) => {
    try {
      setIsEditLoading(true);
      setIsEditModalOpen(true);

      const res = await api.get(`/v1/lecture-sessions/${sessionId}`);
      const data = res.data?.data || res.data;

      setEditingSession({
        session_id: data.session_id,
        timetable_id: data.timetable_id,
        
        // ✅ التصحيح هنا: نأخذ أول 10 حروف فقط (YYYY-MM-DD)
        session_date: data.session_date ? String(data.session_date).split('T')[0] : "",
        
        status: String(data.status),
        actual_classroom_id: data.actual_classroom_id ? String(data.actual_classroom_id) : String(data.timetable?.classroom_id),
        
        // ✅ الإضافة الجديدة: جلب المحاضر الفعلي، وإذا لم يوجد نأخذ المحاضر الأصلي من الجدول
        actual_lecturer_id: data.lecturer_id ? String(data.lecturer_id) : String(data.timetable?.lecturer_id),

        // ... (باقي الحقول كما هي)
        start_time: data.start_time ? data.start_time.slice(0, 5) : "",
        end_time: data.end_time ? data.end_time.slice(0, 5) : "",

        original_course_name: data.timetable?.course?.course_name,
        original_group_name: data.timetable?.group?.group_name,
        original_lecturer_name: data.timetable?.lecturer?.user?.full_name,
        original_start_time: data.timetable?.start_time,
        original_end_time: data.timetable?.end_time,
        original_room_id: data.timetable?.classroom_id // نحتاجه لمقارنة القاعة الأصلية
      });

    } catch (error) {
      toast({ title: "خطأ", description: "فشل جلب تفاصيل الجلسة", variant: "destructive" });
      setIsEditModalOpen(false);
    } finally {
      setIsEditLoading(false);
    }
  };

  // --- ✅ دالة حفظ التعديلات ---
  const handleSaveChanges = async () => {
    if (!editingSession) return;
    setIsSavingEdit(true);
    try {
        const payload = {
            session_date: editingSession.session_date,
            status: Number(editingSession.status),
            actual_classroom_id: Number(editingSession.actual_classroom_id),
            // يمكن إضافة start_time و end_time إذا كان الباك-إند يسمح بتعديل وقت الجلسة الفردية
            lecturer_id: Number(editingSession.actual_lecturer_id), // تحديث المحاضر الفعلي
            start_time: editingSession.start_time,
            end_time: editingSession.end_time,
        };

        await api.put(`/v1/lecture-sessions/${editingSession.session_id}`, payload);
        
        toast({ title: "نجاح", description: "تم تحديث بيانات الجلسة" });
        setIsEditModalOpen(false);
        fetchSessionsGrid(viewDate); // تحديث الشبكة

    } catch (error: any) {
        toast({ title: "خطأ", description: error.response?.data?.message || "فشل التحديث", variant: "destructive" });
    } finally {
        setIsSavingEdit(false);
    }
  };

  // --- ✅ دالة حذف الجلسة ---
  const handleDeleteSession = async () => {
      if (!confirm("هل أنت متأكد من حذف هذه الجلسة نهائياً؟")) return;
      
      try {
          await api.delete(`/v1/lecture-sessions/${editingSession.session_id}`);
          toast({ title: "تم الحذف", description: "تم حذف الجلسة بنجاح" });
          setIsEditModalOpen(false);
          fetchSessionsGrid(viewDate); // تحديث الشبكة
      } catch (error) {
          toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
      }
  };
  // ===================== الجزاء الخاص بالتعديل الجلسات والجدول نهاية =====================

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

    //  مراقب لتحديث قاعات التعويض عند تغيير الوقت
  useEffect(() => {
    const fetchMakeupRooms = async () => {
        // إذا لم يكن الوضع تعويض، أو البيانات ناقصة، لا تفعل شيئاً مكلفاً
        if (!isMakeupSession || !sessionDate || !makeupStartTime || !makeupEndTime) {
            // كحالة افتراضية، نضع القاعات العادية (كلها متاحة)
            setMakeupClassrooms(classrooms.map(c => ({ ...c, is_busy: false })));
            return;
        }

        setIsLoadingMakeupRooms(true);
        try {
            const res = await api.get('/v1/classrooms/availability', {
                params: {
                    college_id: collegeIdNum,
                    date: sessionDate,
                    start_time: makeupStartTime,
                    end_time: makeupEndTime
                }
            });
            setMakeupClassrooms(res.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingMakeupRooms(false);
        }
    };

    // Debounce خفيف
    const timer = setTimeout(() => {
        fetchMakeupRooms();
    }, 300);
    return () => clearTimeout(timer);

  }, [isMakeupSession, sessionDate, makeupStartTime, makeupEndTime, collegeIdNum, classrooms]);

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
    allowance_minutes: number | "";
  }

  const [manualForm, setManualForm] = useState<ManualForm>({
    course_id: "", lecturer_id: "", group_id: "", classroom_id: "",
    day_id: "", period_id: "", lecture_type: 0, status: 1, start_date: "",
    end_date: "", academic_year: "", college_id: collegeIdNum || "", department_id: "",
    level_id: "", program_id: "", gender_type: 0, lecture_hours: 2, allowance_minutes: 15,
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
    // إذا لم يتم اختيار المستوى، نفرغ القوائم
    if (!manualForm.level_id) {
      setCourses([]); 
      setGroups([]); 
      setManualForm(f => ({ ...f, course_id: "", group_id: "" }));
      return;
    }

    (async () => {
      try {
        // 1. تجهيز فلاتر المواد (لضمان جلب مواد القسم والبرنامج المحدد فقط)
        const courseParams = new URLSearchParams();
        courseParams.append('college_id', String(collegeIdNum));
        if (manualForm.department_id) courseParams.append('department_id', String(manualForm.department_id));
        if (manualForm.program_id) courseParams.append('program_id', String(manualForm.program_id));
        courseParams.append('level_id', String(manualForm.level_id));

        // 2. تجهيز فلاتر المجموعات
        const groupParams = new URLSearchParams();
        groupParams.append('college_id', String(collegeIdNum));
        if (manualForm.department_id) groupParams.append('department_id', String(manualForm.department_id));
        groupParams.append('level_id', String(manualForm.level_id));

        // 3. جلب البيانات
        const [coursesRes, groupsRes] = await Promise.all([
          apiJson(`/v1/courses?${courseParams.toString()}`),
          apiJson(`/v1/student-groups?${groupParams.toString()}`),
        ]);

        // 4. معالجة بيانات المواد
        const coursesData = coursesRes?.data || coursesRes || [];
        setCourses(coursesData.map((course: any) => ({
            course_id: course.course_id,
            name: course.course_name,
            code: course.course_code,
            department_id: course.department_id,
            semester_id: course.semester_id,
        })));

        // 5. معالجة بيانات المجموعات
        const groupsData = groupsRes?.data || groupsRes || [];
        setGroups(groupsData.map((group: any) => ({
            group_id: group.group_id,
            name: group.group_name
        })));

      } catch (error) {
        console.error("Failed to fetch courses/groups", error);
        toast({ title: "خطأ", description: "فشل تحديث قائمة المواد والمجموعات", variant: "destructive" });
      }
    })();
    
    // أضفنا department_id و program_id للمصفوفة لضمان التحديث عند تغيرهم
  }, [manualForm.level_id, manualForm.department_id, manualForm.program_id]); 


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
      // التعديل هنا: إرسال collegeId كـ parameter
      const res = await api.get('/v1/schedulable-lectures', { 
          params: { college_id: collegeId } 
      });
      
      const lectures = res.data?.data || [];
      setSchedulableLectures(lectures);
      return lectures;
  } catch (error: any) {
      console.error("Failed to fetch schedulable lectures:", error.response?.data || error);
      toast({
          title: "خطأ في جلب البيانات",
          description: "فشل جلب المحاضرات القابلة للجدولة.",
          variant: "destructive",
      });
      setSchedulableLectures([]); 
      return [];
  }
};
  
  // ✅ --- تعديل دالة فتح النموذج --- ✅
const openCreateSessionModal = async () => {
    // الآن، هذه الدالة مسؤولة فقط عن جلب البيانات وفتح النموذج
    await fetchSchedulableLectures();
    setIsMakeupSession(false);
    setMakeupStartTime("");
    setMakeupEndTime("");
    setMakeupRoomId("")
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
              isMakeup: session.is_makeup,
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
    // ✅ ملاحظة: لا يمكن إنشاء الكل (Bulk) إذا كانت جلسة تعويضية
    if (createAllSessions && !isMakeupSession) {
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
      // --- الحالة ب: إنشاء جلسة واحدة (Single) [عادية أو تعويضية] ---
      if (!sessionDate) {
        toast({ title: "بيانات ناقصة", description: "الرجاء اختيار تاريخ." });
        setIsCreatingSession(false);
        return;
      }
  
      try {
        // ✅ بناء الـ Payload بناءً على نوع الجلسة
        const payload: any = {
            timetable_id: selectedLectureForSession.timetable_id,
            session_date: sessionDate,
            is_makeup: isMakeupSession ? 1 : 0, // إرسال حالة التعويض
        };

        // ✅ إضافة البيانات الخاصة بالتعويض (إذا تم تفعيلها)
        if (isMakeupSession) {
            // التحقق من الحقول الإضافية المطلوبة
            if (!makeupStartTime || !makeupEndTime || !makeupRoomId) {
                toast({ 
                    title: "بيانات ناقصة", 
                    description: "الرجاء تحديد وقت البدء والنهاية والقاعة للجلسة التعويضية.", 
                    variant: "destructive" 
                });
                setIsCreatingSession(false);
                return;
            }
            payload.start_time = makeupStartTime;
            payload.end_time = makeupEndTime;
            payload.actual_classroom_id = makeupRoomId;
        }

        // إرسال الطلب
        await api.post('/v1/lecture-sessions', payload);
  
        toast({
          title: "نجاح",
          description: isMakeupSession 
            ? `تم إنشاء جلسة تعويضية بتاريخ ${sessionDate} بنجاح.`
            : `تم إنشاء الجلسة بتاريخ ${sessionDate} بنجاح.`,
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
      allowance_minutes: 15,
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

  // ============================ إدارة طلبات التعويض (جاهزة للجدولة) ============================
  const [readyMakeupRequests, setReadyMakeupRequests] = useState<any[]>([]);
  const [isLoadingMakeupList, setIsLoadingMakeupList] = useState(false);
  const [processingMakeupId, setProcessingMakeupId] = useState<number | null>(null);

  // جلب الطلبات
  const fetchReadyMakeupRequests = async () => {
    setIsLoadingMakeupList(true);
    try {
      // status_group=ready تعيد الطلبات بحالة 3
      const res = await api.get(`/v1/colleges/${collegeIdNum}/makeup-requests`, {
        params: { status_group: 'ready' }
      });
      setReadyMakeupRequests(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch makeup requests", error);
    } finally {
      setIsLoadingMakeupList(false);
    }
  };

  // تحميل القائمة عند فتح الصفحة
  useEffect(() => {
    if (collegeIdNum) fetchReadyMakeupRequests();
  }, [collegeIdNum]);

  // دالة تحديث الحالة إلى "مجدولة" (4)
  const markAsScheduled = async (requestId: number) => {
    // تأكيد بسيط
    if (!confirm("هل قمت بإضافة المحاضرة للجدول يدوياً وتود إغلاق هذا الطلب؟")) return;

    setProcessingMakeupId(requestId);
    try {
        // نستخدم نفس راوت المراجعة، ونرسل الحالة 4
        await api.put(`/v1/makeup-lectures/${requestId}/review`, {
            status: 4, 
            notes: "تمت الجدولة يدوياً بواسطة مسؤول الجدول"
        });

        toast({ 
            title: "تم التحديث", 
            description: "تم نقل الطلب إلى الأرشيف (مجدولة) بنجاح.",
            className: "bg-green-600 text-white"
        });
        
        // تحديث القائمة محلياً (حذف العنصر المعالج)
        setReadyMakeupRequests(prev => prev.filter(req => req.request_id !== requestId));
        
    } catch (error) {
        toast({ title: "خطأ", description: "فشل تحديث حالة الطلب.", variant: "destructive" });
    } finally {
        setProcessingMakeupId(null);
    }
  };
   return (
    <div className="space-y-6" >
      <Tabs defaultValue="import" className="w-full" dir="rtl">
         {/* ✅ --- قسم الشرح والإرشادات --- ✅ */}
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
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">إضافة للجدول الرئيسي</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:bg-primary/10"> عرض الجدول / تعديل</TabsTrigger>
        </TabsList>

        {/* ======================= */}
        {/* === IMPORT TAB ======== */}
        {/* ======================= */}
        <TabsContent value="import" className="space-y-6">

          {/* 1. قائمة طلبات التعويض بانتظار الجدولة (تظهر فقط إذا وجدت طلبات) */}
          {readyMakeupRequests.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40 shadow-sm animate-in fade-in slide-in-from-top-4">
                <CardHeader className="pb-3 border-b border-amber-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-amber-900">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <CardTitle className="text-lg">طلبات تعويض معتمدة (بانتظار الجدولة)</CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                            {readyMakeupRequests.length} طلبات
                        </Badge>
                    </div>
                    <CardDescription>
                        يرجى إضافة هذه المحاضرات للجدول يدوياً أدناه، ثم الضغط على زر "تمت الجدولة" لإغلاق الطلب.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-amber-100/30 hover:bg-amber-100/30">
                                <TableHead className="text-right font-bold text-amber-900">المحاضر</TableHead>
                                <TableHead className="text-right font-bold text-amber-900">المادة / المجموعة</TableHead>
                                <TableHead className="text-right font-bold text-amber-900">الموعد المقترح</TableHead>
                                <TableHead className="text-right font-bold text-amber-900">القاعة</TableHead>
                                <TableHead className="text-left font-bold text-amber-900 px-4">الإجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {readyMakeupRequests.map((req) => (
                                <TableRow key={req.request_id} className="hover:bg-amber-100/20">
                                    <TableCell className="font-medium">{req.lecturer_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="font-bold">{req.course_name}</span>
                                            <span className="text-muted-foreground">{req.group_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-xs">
                                            <div className="flex items-center gap-1 font-bold text-amber-800">
                                                {/* ✅ التعديل هنا: قمنا بإضافة split('T')[0] لأخذ التاريخ فقط */}
                                                <span className="font-mono">
                                                    {req.requested_date ? req.requested_date.split('T')[0] : '-'}
                                                </span>
                                            </div>
                                            <span className="font-mono text-muted-foreground dir-ltr text-right">
                                                {req.start_time?.slice(0,5)} - {req.end_time?.slice(0,5)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white">
                                            {req.classroom_name || "غير محدد"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-left px-4">
                                      {can('requests.schedule_makeup') && (
                                        <Button 
                                            size="sm" 
                                            className="h-8 bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                                            onClick={() => markAsScheduled(req.request_id)}
                                            disabled={processingMakeupId === req.request_id}
                                        >
                                            {processingMakeupId === req.request_id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            )}
                                            تمت الجدولة
                                        </Button>
                                      )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          {/* === Source Selector */}
          <div className="flex flex-col md:flex-row gap-4">
                      
            {/* البطاقة الأولى */}
            {can('timetable.create_table') && (
              <Card
                // نضيف flex-1 لتأخذ البطاقة المساحة المتاحة بالتساوي
                className={`flex-1 cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
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
            )}
          
            {/* البطاقة الثانية */}
            {can('timetable.create_lecture') && (
              <Card
                // نضيف flex-1 هنا أيضاً
                className="flex-1 cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm border-border/50 hover:border-primary"
                onClick={openCreateSessionModal}
              >
                <CardContent className="pt-6 text-center">
                  <PlusCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-bold text-lg mb-2">إنشاء جلسة محاضرة</h3>
                  <p className="text-sm text-muted-foreground">توليد جلسة فعلية لمحاضرة في تاريخ محدد.</p>
                </CardContent>
              </Card>
            )}
          
          </div>

          {/* ======================================================== */}
          {/* ========= UNIFIED MANUAL ENTRY FORM ======== */}
          {/* ======================================================== */}
          {importSource === "manual" && (
            <Card className="backdrop-blur-sm border-primary/30 w-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">إضافة بند في الجدول الدراسي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-4 md:p-6">
                
                {/* Academic Structure Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* College */}
                  <div className="space-y-2">
                    <Label>الكلية</Label>
                    <Input
                      disabled
                      value={colleges.find(c => c.college_id === collegeIdNum)?.name || `كلية ID: ${collegeIdNum}`}
                      className="cursor-not-allowed"
                    />
                  </div>
                  {/* Department */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Course */}
                  <div className="space-y-2">
                    <Label>المقرر</Label>
                    <Select value={String(manualForm.course_id)} onValueChange={(v) => setManualForm({ ...manualForm, course_id: v ? Number(v) : "" })} disabled={!manualForm.level_id || courses.length === 0}>
                      <SelectTrigger><SelectValue placeholder="اختر المستوى أولاً" /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.course_id} value={String(c.course_id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.course_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.course_id}</p>}
                  </div>
                  {/* Group */}
                  <div className="space-y-2">
                    <Label>المجموعة الطلابية</Label>
                    <Select value={String(manualForm.group_id)} onValueChange={(v) => setManualForm({ ...manualForm, group_id: v ? Number(v) : "" })} disabled={!manualForm.level_id || groups.length === 0}>
                      <SelectTrigger><SelectValue placeholder="اختر المستوى أولاً" /></SelectTrigger>
                      <SelectContent>{groups.map(g => <SelectItem key={g.group_id} value={String(g.group_id)}>{g.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.group_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.group_id}</p>}
                  </div>
                  
                  {/* ======================= LECTURER SECTION (MODIFIED) ======================= */}
                  {/* خانة الاختيار لتفعيل وضع المحاضر الخارجي */}
                  {/* تعديل: الامتداد col-span يتغير حسب حجم الشاشة لضمان أخذ السطر كاملاً كفاصل */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center space-x-2 rtl:space-x-reverse pt-2 md:pt-4 bg-muted/30 p-2 rounded border border-dashed">
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
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                          اختيار محاضر من كلية أخرى
                      </label>
                  </div>
              
                  {/* حقل اختيار كلية المحاضر (يظهر فقط إذا تم تفعيل الخيار أعلاه) */}
                  {isExternalLecturer && (
                      <div className="space-y-2">
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
                                  {/* قائمة `colleges` لدي�� تحتوي على كل الكليات */}
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>القاعة</Label>
                    <Select value={String(manualForm.classroom_id)} onValueChange={(v) => setManualForm({ ...manualForm, classroom_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر قاعة" /></SelectTrigger>
                      <SelectContent>
                        {classrooms.map((r: any) => (
                            <SelectItem key={r.classroom_id} value={String(r.classroom_id)}>
                                {/* ✅ التنسيق: اسم القاعة - (السعة: 50) */}
                                {r.classroom_name || r.name} {r.capacity ? `- (السعة: ${r.capacity})` : ""}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {manualFormErrors.classroom_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.classroom_id}</p>}
                  </div>
                  {/* Day */}
                  <div className="space-y-2">
                    <Label>اليوم</Label>
                    <Select value={String(manualForm.day_id)} onValueChange={(v) => setManualForm({ ...manualForm, day_id: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر اليوم" /></SelectTrigger>
                      <SelectContent>{days.map(d => <SelectItem key={d.day_id} value={String(d.day_id)}>{d.name_ar || d.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {manualFormErrors.day_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.day_id}</p>}
                  </div>
                  {/* Period */}
                  <div className="space-y-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البداية</Label>
                    <Input type="date" value={manualForm.start_date} onChange={(e) => setManualForm({ ...manualForm, start_date: e.target.value, academic_year: computeAcademicYear(e.target.value) })}/>
                    {manualFormErrors.start_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.start_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ النهاية</Label>
                    <Input type="date" value={manualForm.end_date} onChange={(e) => setManualForm({ ...manualForm, end_date: e.target.value })}/>
                    {manualFormErrors.end_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.end_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>العام الأكاديمي</Label>
                    <Input placeholder="2024-2025" value={manualForm.academic_year} onChange={(e) => setManualForm({ ...manualForm, academic_year: e.target.value })}/>
                    {manualFormErrors.academic_year && <p className="text-xs text-destructive mt-1">{manualFormErrors.academic_year}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>ساعات المحاضرة</Label>
                    <Input type="number" step="0.25" min="0" value={String(manualForm.lecture_hours)} onChange={(e) => setManualForm({ ...manualForm, lecture_hours: e.target.value === "" ? "" : Number(e.target.value) })}/>
                    {manualFormErrors.lecture_hours && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecture_hours}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>فترة السماح (دقائق)</Label>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded" title="الوقت المسموح للمحاضر الخروج فيه قبل نهاية الوقت الرسمي">
                            لكل ساعة
                        </span>
                    </div>
                    <Input 
                        type="number" 
                        min="0" 
                        max="60"
                        placeholder="مثلاً: 15"
                        value={String(manualForm.allowance_minutes)} 
                        onChange={(e) => setManualForm({ ...manualForm, allowance_minutes: e.target.value === "" ? 0 : Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                        سيتم خصمها من مدة البقاء المطلوبة.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع المحاضرة</Label>
                    <Select value={String(manualForm.lecture_type)} onValueChange={(v) => setManualForm({ ...manualForm, lecture_type: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0"> نظري </SelectItem>
                        <SelectItem value="1"> عملي </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={String(manualForm.status)} onValueChange={(v) => setManualForm({ ...manualForm, status: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">فعال</SelectItem>
                        <SelectItem value="0">غير فعال</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الجنس</Label>
                    <Select value={String(manualForm.gender_type)} onValueChange={(v) => setManualForm({ ...manualForm, gender_type: v ? Number(v) : "" })}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">ذكور</SelectItem>
                        <SelectItem value="1">إناث</SelectItem>
                        <SelectItem value="2">مختلط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buttons - Stacked on Mobile */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={handleManualSubmit} disabled={manualSubmitLoading} className="flex-1 sm:flex-none">
                    {manualSubmitLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    حفظ البند
                  </Button>
                  <Button variant="outline" onClick={resetManualForm} className="flex-1 sm:flex-none">تفريغ</Button>
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
                    <CardTitle>عرض المحاضرات الأسبوعي</CardTitle>
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
                                  const sessionsInSlot = sessionsGrid.filter(s => 
                                    s.date?.slice(0, 10) === currentDayString && 
                                    s.time === timeLabel
                                  );
                                  
                                  // --- ✅ --- تعريف مكون البطاقة (SessionCard) المعدل --- ✅ ---
                                  const SessionCard = ({ session }: { session: any }) => {
                                    const isPast = new Date(session.date) < new Date() && !isToday(new Date(session.date));
                                    // ✅ التحقق هل هي تعويضية
                                    const isMakeup = session.isMakeup === 1;
                                    
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
            
                                    // ✅ منطق تمييز الجلسة التعويضية
                                    if (isMakeup) {
                                        // إضافة لون برتقالي/عنبري وحدود متقطعة لتمييزها
                                        // نستخدم cn لدمج الكلاسات أو نستبدلها
                                        if (!isPast || (isPast && session.status !== 1)) {
                                            // إذا كانت في المستقبل أو فاتت وهي تعويضية
                                            cardClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-500 border-dashed border-2";
                                        } else {
                                            // إذا كانت مكتملة وهي تعويضية (نحتفظ بالخلفية الخضراء مع حدود برتقالية)
                                            cardClass = "bg-green-100/50 dark:bg-green-900/30 border-amber-500 border-2";
                                        }
                                    }
            
                                    const canEdit = can('timetable.view_lectures');
                                    return (
                                      <Card 
                                          // التحكم في النقر: ينفذ فقط إذا كان لديه صلاحية التعديل
                                          onClick={() => {
                                              if (canEdit) {
                                                  handleSessionClick(session.id);
                                              }
                                          }}
                                          
                                          // التحكم في الـ CSS:
                                          // إذا كان يملك التعديل: مؤشر يد (pointer) وتأثير ظل.
                                          // إذا كان عرض فقط: مؤشر عادي (default).
                                          className={cn(
                                              "h-full border shadow-sm transition-shadow group",
                                              canEdit ? "cursor-pointer hover:shadow-md" : "cursor-default",
                                              cardClass
                                          )}
                                      >
                                          <CardContent className="p-2 text-right text-xs flex flex-col justify-between h-full">
                                              <div>
                                                  <div className="flex justify-between items-start flex-wrap gap-1">
                                                      {/* جعل تأثير الخط السفلي (underline) مرتبطاً بإمكانية التعديل */}
                                                      <span className={`font-bold text-primary ${canEdit ? "group-hover:underline" : ""}`}>
                                                          {session.code || 'N/A'}
                                                      </span>
                                                      
                                                      <div className="flex gap-1 flex-wrap justify-end">
                                                        {/* ✅ شارة "تعويضية" */}
                                                        {isMakeup && (
                                                            <Badge className="bg-amber-500 hover:bg-amber-600 border-0 text-[10px] px-1 h-5">تعويضية</Badge>
                                                        )}
                                                        <Badge variant={badgeVariant} className="h-5">{badgeText}</Badge>
                                                      </div>
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

        {/* ✅ --- المودال الجديد لعرض الجلسات المتعددة ---  */}
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
                    <Card 
                        key={session.id} 
                        // ✅ إضافة حدث النقر وتغيير شكل المؤشر
                        onClick={() => handleSessionClick(session.id)}
                        className={cn("border transition-colors cursor-pointer hover:shadow-md", cardClass)}
                    >
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
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader dir="rtl">
              <DialogTitle>إنشاء جلسة محاضرة جديدة</DialogTitle>
              <DialogDescription>
                اختر محاضرة لإنشاء جلسة. المحاضرات المكتملة يمكن اختيارها للتعويض فقط.
              </DialogDescription>
            </DialogHeader>
        
            <div className="space-y-4 py-4" dir="rtl">
              {/* 1. حقل اختيار المحاضرة */}
              <div className="space-y-2">
                <Label htmlFor="lecture-select">اختر المحاضرة</Label>
                <Select
                  onValueChange={(value) => {
                    const selected = schedulableLectures.find(lec => String(lec.timetable_id) === value);
                    setSelectedLectureForSession(selected || null);
                    
                    // المتغيرات الافتراضية
                    setSessionDate(""); 
                    setCreateAllSessions(false); 
                    setMakeupStartTime("");
                    setMakeupEndTime("");
                    setMakeupRoomId("");
        
                    const availableDates = selected?.available_dates || [];
                    setAvailableSessionDates(availableDates);
        
                    // ✅ المنطق الذكي:
                    if (availableDates.length === 0) {
                        setIsMakeupSession(true);
                        if (selected) {
                            setMakeupStartTime(selected.start_time || "");
                            setMakeupEndTime(selected.end_time || "");
                            setMakeupRoomId(String(selected.classroom_id || ""));
                        }
                        toast({
                            description: "تم تفعيل وضع التعويض لأن هذه المحاضرة مكتملة الجلسات الأساسية.",
                            duration: 3000,
                        });
                    } else {
                        setIsMakeupSession(false);
                    }
                  }}
                  value={selectedLectureForSession ? String(selectedLectureForSession.timetable_id) : ""}
                >
                  <SelectTrigger id="lecture-select" className="h-auto py-2">
                    <SelectValue placeholder="اختر محاضرة لجدولتها..." />
                  </SelectTrigger>
                  
                  <SelectContent className="max-h-[300px]">
                    {schedulableLectures.length > 0 ? (
                      schedulableLectures.map((lec) => {
                          const count = lec.available_dates?.length || 0;
                          const isCompleted = count === 0;
                          // 1. استخراج اسم المادة والمجموعة
                          const courseName = lec.course_name || lec.course?.course_name || "مادة غير محددة";
                          const groupName = lec.group_name || lec.group?.group_name || "مجموعة ؟";
                          // 2. إصلاح اسم المحاضر (يبحث في عدة مسارات محتملة)
                          const lecturerName = 
                              lec.lecturer_name || 
                              lec.lecturer?.user?.full_name || // المسار الأكثر شيوعاً في لارافيل
                              lec.lecturer?.full_name || 
                              lec.lecturer?.name || 
                              "محاضر غير محدد";
                          // 3. إصلاح اسم القاعة
                          const classroomName = 
                              lec.classroom_name || 
                              lec.classroom?.classroom_name || 
                              lec.classroom?.name || 
                              "قاعة غير محددة";
                          // 4. إصلاح اسم اليوم
                          const dayName = 
                              lec.day_name || 
                              lec.day?.day_name || 
                              lec.day?.name_ar || // أحياناً يكون الاسم العربي
                              lec.day?.name || 
                              "";
                          // 5. إصلاح التوقيت (المشكلة الأكبر: غالباً الوقت داخل period)
                          // نحاول جلبه من الجذر، وإذا لم نجد نبحث داخل period
                          const rawStart = lec.start_time || lec.period?.start_time;
                          const rawEnd = lec.end_time || lec.period?.end_time;
                          
                          const timeRange = (rawStart && rawEnd) 
                              ? `${String(rawStart).slice(0, 5)} - ${String(rawEnd).slice(0, 5)}` 
                              : "وقت غير محدد";
                          return (
                              <SelectItem 
                                  key={lec.timetable_id} 
                                  value={String(lec.timetable_id)}
                                  className={cn(
                                      "border-b last:border-0 py-3 cursor-pointer focus:bg-accent", 
                                      isCompleted && "opacity-80 bg-muted/20"
                                  )}
                              >
                                <div className="flex flex-col gap-1.5 w-full text-right">
                                  {/* السطر الأول: اسم المادة والمجموعة والحالة */}
                                  <div className="flex justify-between items-center w-full gap-4">
                                      <div className="font-bold text-sm truncate max-w-[200px]" title={courseName}>
                                          {courseName} <span className="text-muted-foreground font-normal">({groupName})</span>
                                      </div>
                                      {count > 0 ? (
                                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap bg-green-100 text-green-700 hover:bg-green-100">
                                              {count} متاحة
                                          </Badge>
                                      ) : (
                                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 whitespace-nowrap text-muted-foreground">
                                              للتعويض
                                          </Badge>
                                      )}
                                  </div>
                                  {/* السطر الثاني: اسم المحاضر */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{lecturerName}</span>
                                  </div>
                                  {/* السطر الثالث: التفاصيل الزمنية والمكانية */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                      <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border">
                                          <Clock className="w-3 h-3" />
                                          <span>{dayName} | <span dir="ltr">{timeRange}</span></span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          <span>{classroomName}</span>
                                      </div>
                                  </div>
                                </div>
                              </SelectItem>
                          );
                      })
                    ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Info className="w-8 h-8 opacity-50" />
                            <p>لا توجد محاضرات مضافة في الجدول الدراسي.</p>
                        </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
        
              {/* يظهر باقي المحتوى فقط عند اختيار محاضرة */}
              {selectedLectureForSession && (
                <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                  
                  <hr className="border-border/50" />
        
                  {/* ✅ قسم الجلسة التعويضية */}
                  <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-md border transition-colors ${isMakeupSession ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-dashed'}`}>
                      <Checkbox
                          id="makeup-session-toggle"
                          checked={isMakeupSession}
                          // ✅ لا نسمح بإلغاء التفعيل إذا كانت المحاضرة مكتملة (لأنه لا خيار آخر)
                          disabled={availableSessionDates.length === 0}
                          onCheckedChange={(checked: boolean) => {
                              setIsMakeupSession(checked);
                              setSessionDate(""); 
                              setCreateAllSessions(false); 
                              
                              if (checked && selectedLectureForSession) {
                                  setMakeupStartTime(selectedLectureForSession.start_time || "");
                                  setMakeupEndTime(selectedLectureForSession.end_time || "");
                                  setMakeupRoomId(String(selectedLectureForSession.classroom_id || ""));
                              }
                          }}
                      />
                      <div className="grid gap-1.5 leading-none">
                          <label
                              htmlFor="makeup-session-toggle"
                              className={`text-sm font-bold leading-none cursor-pointer ${availableSessionDates.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-primary'}`}
                          >
                              تسجيل كجلسة تعويضية / إضافية
                          </label>
                          <p className="text-xs text-muted-foreground">
                              {availableSessionDates.length === 0 
                                ? "إجباري لهذه المحاضرة لأن جميع جلساتها الأساسية قد أنشئت." 
                                : "تفعيل هذا الخيار يسمح باختيار أي تاريخ وتغيير الفترة والقاعة."}
                          </p>
                      </div>
                  </div>
        
                  {/* 2. خانة الاختيار لإنشاء جميع الجلسات (تظهر فقط إذا لم يكن تعويض) */}
                  {!isMakeupSession && availableSessionDates.length > 0 && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2 px-1">
                        <Checkbox
                            id="create-all-sessions-toggle"
                            checked={createAllSessions}
                            onCheckedChange={(checked: boolean) => setCreateAllSessions(checked)}
                        />
                        <label
                            htmlFor="create-all-sessions-toggle"
                            className="text-sm font-medium leading-none cursor-pointer"
                        >
                            إنشاء جميع الجلسات المتاحة ({availableSessionDates.length} جلسة)
                        </label>
                    </div>
                  )}
        
                  {/* 3. حقول الإدخال */}
                  {!createAllSessions && (
                    <div className="space-y-4">
                        
                        {/* حقل التاريخ */}
                        <div className="space-y-2">
                          <Label htmlFor="session-date-select">
                              تاريخ الجلسة {isMakeupSession && <span className="text-xs text-primary font-bold">(حر)</span>}
                          </Label>
                          
                          {isMakeupSession ? (
                              // في وضع التعويض: إدخال يدوي
                              <Input 
                                  type="date" 
                                  value={sessionDate} 
                                  onChange={(e) => setSessionDate(e.target.value)}
                                  className="bg-background"
                              />
                          ) : (
                              // في الوضع العادي: قائمة منسدلة
                              <Select
                                value={sessionDate}
                                onValueChange={setSessionDate}
                              >
                                <SelectTrigger id="session-date-select">
                                  <SelectValue placeholder="اختر تاريخًا من التواريخ المتاحة..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSessionDates.map(date => (
                                    <SelectItem key={date} value={date}>
                                      {date}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          )}
                        </div>
        
                        {/* ✅ حقول إضافية تظهر فقط عند تفعيل التعويض */}
                        {isMakeupSession && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg border animate-in slide-in-from-top-2">
                              
                              {/* الفترة الزمنية */}
                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label className="text-xs">الفترة الزمنية</Label>
                                  <Select
                                      value={periods.find(p => p.start_time === makeupStartTime)?.period_id.toString() || ""}
                                      onValueChange={(val) => {
                                          const selectedPeriod = periods.find(p => String(p.period_id) === val);
                                          if (selectedPeriod) {
                                              setMakeupStartTime(selectedPeriod.start_time || "");
                                              setMakeupEndTime(selectedPeriod.end_time || "");
                                          }
                                      }}
                                  >
                                      <SelectTrigger>
                                          <SelectValue placeholder="اختر وقت المحاضرة" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {periods.map((p) => (
                                              <SelectItem key={p.period_id} value={String(p.period_id)}>
                                                  {fmtHHMM(p.start_time)} - {fmtHHMM(p.end_time)}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
      
                              {/* القاعة (المعدلة لعرض الحالة والاسم بشكل صحيح) */}
                              <div className="space-y-2 col-span-2 sm:col-span-1">
                                  <Label className="text-xs flex items-center justify-between">
                                      <span>القاعة</span>
                                      {/* مؤشر التحميل يظهر عند تغيير الوقت */}
                                      {isLoadingMakeupRooms && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                                  </Label>
                                  
                                  <Select value={makeupRoomId} onValueChange={setMakeupRoomId}>
                                      <SelectTrigger className={cn(
                                          // تغيير لون الإطار إذا كانت القاعة المختارة مشغولة
                                          makeupClassrooms.find(c => String(c.classroom_id) === makeupRoomId)?.is_busy 
                                          ? "border-red-500 text-red-600" : ""
                                      )}>
                                          <SelectValue placeholder={isLoadingMakeupRooms ? "جاري التحقق..." : "اختر القاعة"} />
                                      </SelectTrigger>
                                      
                                      <SelectContent className="max-h-[200px]">
                                          {makeupClassrooms.length > 0 ? (
                                              makeupClassrooms.map((c) => (
                                                  <SelectItem 
                                                      key={c.classroom_id} 
                                                      value={String(c.classroom_id)}
                                                      disabled={c.is_busy} // تعطيل الاختيار إذا كانت مشغولة
                                                      className={cn(
                                                          "w-full cursor-pointer",
                                                          c.is_busy && "opacity-70 bg-red-50/50" // خلفية خفيفة للمشغول
                                                      )}
                                                  >
                                                      <div className="flex items-center justify-between w-full gap-2 min-w-[120px]">
                                                          <span className="truncate font-medium">
                                                              {/* ✅ التعديل هنا: فحص الاسم بأكثر من صيغة */}
                                                              {c.name || c.classroom_name || "قاعة غير محددة"} 
                                                              {c.capacity ? <span className="text-[10px] text-muted-foreground mr-1">({c.capacity})</span> : ""}
                                                          </span>
                                                          
                                                          {/* شارة تظهر فقط للقاعات المشغولة */}
                                                          {c.is_busy && (
                                                              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] shrink-0">
                                                                  مشغولة
                                                              </Badge>
                                                          )}
                                                      </div>
                                                  </SelectItem>
                                              ))
                                          ) : (
                                              <div className="p-3 text-center text-xs text-muted-foreground">
                                                  {!makeupStartTime ? "يرجى تحديد الوقت أولاً" : "لا توجد قاعات متاحة"}
                                              </div>
                                          )}
                                      </SelectContent>
                                  </Select>
                              </div>
      
                              <div className="col-span-2 text-xs text-muted-foreground flex justify-between px-1">
                                  <span>الوقت المحدد: {makeupStartTime ? fmtHHMM(makeupStartTime) : "--:--"} - {makeupEndTime ? fmtHHMM(makeupEndTime) : "--:--"}</span>
                              </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
        
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSessionModalOpen(false)}>إلغاء</Button>
              <Button 
                onClick={handleCreateSession} 
                disabled={
                    isCreatingSession || 
                    !selectedLectureForSession ||
                    // إذا لم يكن تعويض ولم ننشئ الكل ولم نختر تاريخ (المنطق العادي)
                    (!isMakeupSession && !createAllSessions && !sessionDate) || 
                    // إذا اخترنا إنشاء الكل ولكن القائمة فارغة
                    (createAllSessions && availableSessionDates.length === 0) ||
                    // إذا كان تعويض ولكن البيانات ناقصة
                    (isMakeupSession && (!sessionDate || !makeupStartTime || !makeupEndTime || !makeupRoomId))
                }
              >
                {isCreatingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createAllSessions ? "إنشاء جميع الجلسات" : (isMakeupSession ? "إنشاء جلسة تعويضية" : "إنشاء الجلسة")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ✅ --- مودال تفاصيل وتعديل الجلسة --- ✅ */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الجلسة</DialogTitle>
              <DialogDescription>
                تعديل بيانات الجلسة الفعلية. (التعديل هنا يؤثر على هذه الجلسة فقط)
              </DialogDescription>
            </DialogHeader>
        
            {isEditLoading ? (
               <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : editingSession ? (
               <div className="space-y-4 py-4">
                  {/* معلومات ثابتة في الأعلى */}
                  <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border mb-4">
                     <div>
                        <Label className="text-xs text-muted-foreground">المقرر</Label>
                        <p className="font-bold text-sm">{editingSession.original_course_name}</p>
                     </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">المجموعة</Label>
                        <p className="font-bold text-sm">{editingSession.original_group_name}</p>
                     </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">المحاضر الأصلي</Label>
                        <p className="text-sm">{editingSession.original_lecturer_name}</p>
                     </div>
                  </div>
        
                  {/* نموذج التعديل الكامل */}
                  <div className="grid grid-cols-2 gap-4">
                      {/* الصف الأول: التاريخ */}
                      <div className="space-y-2">
                          <Label>تاريخ الجلسة</Label>
                          <Input 
                             type="date" 
                             value={editingSession.session_date}
                             onChange={(e) => setEditingSession({...editingSession, session_date: e.target.value})}
                          />
                      </div>
                      
                      {/* الصف الثاني: اختيار الفترة الزمنية */}
                      <div className="space-y-2 col-span-2">
                          <Label>توقيت الجلسة (الفترة)</Label>
                          <Select
                             value={periods.find(p => 
                                p.start_time?.slice(0,5) === editingSession.start_time?.slice(0,5) && 
                                p.end_time?.slice(0,5) === editingSession.end_time?.slice(0,5)
                             )?.period_id?.toString() || ""}
                             
                             onValueChange={(val) => {
                                const selectedPeriod = periods.find(p => String(p.period_id) === val);
                                if (selectedPeriod) {
                                    setEditingSession({
                                        ...editingSession,
                                        start_time: selectedPeriod.start_time,
                                        end_time: selectedPeriod.end_time
                                    });
                                }
                             }}
                          >
                             <SelectTrigger>
                                <SelectValue placeholder="اختر فترة زمنية..." />
                             </SelectTrigger>
                             <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.period_id} value={String(p.period_id)}>
                                        {fmtHHMM(p.start_time)} - {fmtHHMM(p.end_time)}
                                        {p.start_time?.slice(0,5) === editingSession.original_start_time?.slice(0,5) ? " (الوقت الأصلي)" : ""}
                                    </SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                             الوقت المحدد: <span dir="ltr">{editingSession.start_time ? fmtHHMM(editingSession.start_time) : "--:--"} - {editingSession.end_time ? fmtHHMM(editingSession.end_time) : "--:--"}</span>
                          </p>
                      </div>
        
                      {/* الصف الثالث: القاعة الفعلية */}
                      <div className="space-y-2 col-span-2">
                          <Label>القاعة الفعلية</Label>
                          <Select 
                             value={editingSession.actual_classroom_id}
                             onValueChange={(v) => setEditingSession({...editingSession, actual_classroom_id: v})}
                          >
                             <SelectTrigger>
                                <SelectValue placeholder="اختر القاعة" />
                             </SelectTrigger>
                             <SelectContent>
                                {classrooms.map((c: any) => (
                                    <SelectItem key={c.classroom_id} value={String(c.classroom_id)}>
                                        {c.classroom_name || c.name} - (السعة: {c.capacity || 'غير محدد'}) 
                                    </SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                      </div>
        
                      {/* ✅ الصف الرابع: المحاضر الفعلي (جديد) */}
                      <div className="space-y-2 col-span-2">
                          <Label>المحاضر الفعلي <span className="text-xs font-normal text-muted-foreground">(اتركه كما هو إذا لم يتغير)</span></Label>
                          <Select 
                             value={editingSession.actual_lecturer_id}
                             onValueChange={(v) => setEditingSession({...editingSession, actual_lecturer_id: v})}
                          >
                             <SelectTrigger>
                                <SelectValue placeholder="اختر المحاضر" />
                             </SelectTrigger>
                             <SelectContent>
                                {/* استخدام availableLecturers أو lecturers حسب المتاح في السياق، يفضل lecturers لعرض الجميع */}
                                {lecturers.map((l: any) => (
                                    <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>
                                        {l.name}
                                        {/* تمييز المحاضر الأصلي */}
                                        {l.name === editingSession.original_lecturer_name ? " (الأصلي)" : ""}
                                    </SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                      </div>
        
                  </div>
               </div>
            ) : null}
        
            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              {can('timetable.delete_lecture') && (
                <Button variant="destructive" onClick={handleDeleteSession} disabled={isSavingEdit || isEditLoading}>
                    <span className="sr-only">حذف</span> حذف الجلسة
                </Button>
              )}
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>إلغاء</Button>
                    {can('timetable.update_lecture') && (
                      <Button onClick={handleSaveChanges} disabled={isSavingEdit || isEditLoading}>
                          {isSavingEdit && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                          حفظ التعديلات
                      </Button>
                    )}
                </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}