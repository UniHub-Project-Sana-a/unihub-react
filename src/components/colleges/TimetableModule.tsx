import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Link, FileText, CheckCircle2, AlertCircle, Download, ZoomIn, ZoomOut, Clock, MapPin, User, Loader2, PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Types ---
type DropdownOption = { value: string; label: string; };
type ImportLog = { id: number; created_at: string; source: string; items: number; status: string; notes?: string; };
type TimetableEntry = {
  id: number; day: string; time: string; course: string; code: string;
  instructor: string; room: string; capacity: string; color: string;
};
type LectureSession = {
    session_id: number; timetable_id: number; session_date: string;
    start_time: string; end_time: string; status: number;
};

interface TimetableModuleProps {
  collegeId: string;
}

export default function TimetableModule({ collegeId }: TimetableModuleProps) {
    // ========================= الإعدادات العامة =========================
  const collegeIdNum = Number(collegeId);

  // مصادر الاستيراد
  const [importSource, setImportSource] = useState<"api" | "file" | "manual" | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "conflict" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [debugOpen, setDebugOpen] = useState(false);

  // ربط axios instance المركزي
  const apiJson = async (path: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();
    const data = init?.body ? JSON.parse(init.body as string) : undefined;
    switch (method) {
      case "GET":
        return api.get(path).then((r) => r.data);
      case "POST":
        return api.post(path, data).then((r) => r.data);
      case "PUT":
        return api.put(path, data).then((r) => r.data);
      case "PATCH":
        return api.patch(path, data).then((r) => r.data);
      case "DELETE":
        return api.delete(path, { data }).then((r) => r.data);
      default:
        return api.request({ url: path, method: method as any, data }).then((r) => r.data);
    }
  };

  // ===================== بيانات التعارضات والسجل والجدول =====================
  const [mockConflicts, setMockConflicts] = useState<
    { course: string; instructor: string; room: string; date: string; time: string }[]
  >([
    { course: "CS101", instructor: "د. أحمد", room: "C-101", date: "الأحد", time: "08:00-10:00" },
    { course: "CS202", instructor: "د. سارة", room: "C-102", date: "الثلاثاء", time: "10:00-12:00" }
  ]);

  const [mockImportLog, setMockImportLog] = useState<
    { date: string; source: string; items: number; status: string; notes: string }[]
  >([
    { date: "2025-10-15 14:30", source: "API", items: 120, status: "نجح", notes: "تم الاستيراد بنجاح" },
    { date: "2025-10-10 09:15", source: "Excel", items: 95, status: "فشل", notes: "خطأ في التنسيق" },
    { date: "2025-10-05 16:20", source: "CSV", items: 110, status: "نجح", notes: "لا توجد تعارضات" }
  ]);

  const [mockSchedule, setMockSchedule] = useState<
    { id: number; day: string; time: string; course: string; code: string; instructor: string; room: string; capacity: string; color: string }[]
  >([
    { id: 1, day: "الأحد", time: "08:00-10:00", course: "مدخل إلى الحاسوب", code: "CS101", instructor: "د. أحمد الحربي", room: "C-101", capacity: "60/60", color: "bg-blue-500/10 border-blue-500/30" },
    { id: 2, day: "الأحد", time: "10:00-12:00", course: "هياكل البيانات", code: "CS202", instructor: "د. سارة القحطاني", room: "C-102", capacity: "45/60", color: "bg-purple-500/10 border-purple-500/30" },
    { id: 3, day: "الاثنين", time: "08:00-10:00", course: "قواعد البيانات", code: "CS301", instructor: "د. مريم باوزير", room: "Lab-1", capacity: "30/30", color: "bg-teal-500/10 border-teal-500/30" },
    { id: 4, day: "الاثنين", time: "12:00-14:00", course: "الذكاء الاصطناعي", code: "CS401", instructor: "أ.د. محمد", room: "C-201", capacity: "40/60", color: "bg-orange-500/10 border-orange-500/30" },
  ]);

  // ===================== تحميل بيانات الجداول المرتبطة (Foreign Keys) =====================
  type Course = { course_id: number; name: string; code?: string; department_id?: number; semester_id?: number };
  type Lecturer = { lecturer_id: number; name: string; department_id?: number; college_id?: number };
  type Group = { group_id: number; name: string };
  type Classroom = { classroom_id: number; name: string; capacity?: number; college_id?: number };
  type Day = { day_id: number; name?: string; name_ar?: string };
  type Period = { period_id: number; name?: string; start_time?: string; end_time?: string; college_id?: number };
  type College = { college_id: number; name: string };
  type Department = { department_id: number; name: string; college_id: number };

  // سلاسل الأكاديميات
  type Program = { program_id: number; program_name: string; department_id: number };
  type Level = { level_id: number; level_number: number; level_name?: string; program_id: number };
  type Semester = { semester_id: number; semester_name: string; academic_year: string; level_id: number; term_number: number };

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
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupsError, setLookupsError] = useState<string | null>(null);

  // فلاتر تبويب "عرض الجدول"
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>("");
  const [filterProgramId, setFilterProgramId] = useState<string>("");
  const [filterLevelId, setFilterLevelId] = useState<string>("");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("");

  // تحميل بيانات أولية: الكليات، الأقسام حسب الكلية، الأيام، الفترات/القاعات/المحاضرين حسب الكلية
    // تحميل بيانات أولية: الكليات، الأقسام حسب الكلية، الأيام، الفترات/القاعات/المحاضرين حسب الكلية
  useEffect(() => {
    if (!collegeIdNum) return;
    const loadInitial = async () => {
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

        setColleges((colRes?.data || colRes || []).map((c: any) => ({
          college_id: c.college_id,
          name: c.college_name || c.name,
        })));

        setDepartments((depRes?.data || depRes || []).map((d: any) => ({
          department_id: d.department_id,
          name: d.department_name || d.name,
          college_id: d.college_id,
        })));

        setDays((daysRes?.data || daysRes || []).map((d: any) => ({
          day_id: d.day_id,
          name: d.day_name || d.name,
          name_ar: d.day_name || d.name_ar,
        })));

        setPeriods((periodsRes?.data || periodsRes || []).map((p: any) => ({
          period_id: p.period_id,
          name: p.period_name || p.name,
          start_time: p.start_time,
          end_time: p.end_time,
          college_id: p.college_id,
        })));

        setClassrooms((roomsRes?.data || roomsRes || []).map((r: any) => ({
          classroom_id: r.classroom_id,
          name: r.classroom_name || r.name,
          capacity: r.capacity,
          college_id: r.college_id,
        })));

        // ========== التعديل هنا ==========
        setLecturers((lecturersRes?.data || lecturersRes || []).map((l: any) => {
          // للتحقق، اطبع شكل الكائن في الكونسول
          // console.log('Lecturer from API:', l);
          return {
            lecturer_id: l.lecturer_id,
            // اقرأ الاسم من user.full_name، ثم تراجع للخيارات الأخرى
            name: l.user?.full_name || l.full_name || l.name,
            department_id: l.department_id,
            college_id: l.college_id,
          };
        }));
      } catch (e: any) {
        setLookupsError(e?.message || "فشل تحميل البيانات المرجعية");
      } finally {
        setLookupsLoading(false);
      }
    };
    loadInitial();
  }, [collegeIdNum]);

  // عند اختيار قسم: أجلب البرامج التابعة
  useEffect(() => {
    if (!filterDepartmentId) {
      setPrograms([]); setFilterProgramId("");
      setLevels([]); setFilterLevelId("");
      setSemesters([]); setFilterSemesterId("");
      return;
    }
    (async () => {
      try {
        const pr = await apiJson(`/v1/programs?department_id=${filterDepartmentId}`);
        setPrograms(pr?.data || pr || []);
      } catch {
        setPrograms([]);
      }
    })();
  }, [filterDepartmentId]);

  // عند اختيار برنامج: أجلب المستويات
  useEffect(() => {
    if (!filterProgramId) {
      setLevels([]); setFilterLevelId("");
      setSemesters([]); setFilterSemesterId("");
      return;
    }
    (async () => {
      try {
        const lv = await apiJson(`/v1/levels?program_id=${filterProgramId}`);
        setLevels(lv?.data || lv || []);
      } catch {
        setLevels([]);
      }
    })();
  }, [filterProgramId]);

  // عند اختيار مستوى: أجلب الفصول (الترم)
  useEffect(() => {
    if (!filterLevelId) {
      setSemesters([]); setFilterSemesterId("");
      return;
    }
    (async () => {
      try {
        const sm = await apiJson(`/v1/semesters?level_id=${filterLevelId}`);
        setSemesters(sm?.data || sm || []);
      } catch {
        setSemesters([]);
      }
    })();
  }, [filterLevelId]);

  // أدوات مساعدة للوصول السريع
  const getCourseById = (id?: number) => courses.find(x => x.course_id === id);
  const getLecturerById = (id?: number) => lecturers.find(x => x.lecturer_id === id);
  const getGroupById = (id?: number) => groups.find(x => x.group_id === id);
  const getClassroomById = (id?: number) => classrooms.find(x => x.classroom_id === id);
  const getDayNameById = (id?: number) => {
    const d = days.find(x => x.day_id === id);
    return d ? normalizeDayName(d.name_ar || d.name) : "";
  };
  const getPeriodRangeById = (id?: number) => {
    const p = periods.find(x => x.period_id === id);
    if (!p) return "";
    const fmt = (t?: string) => (t ? t.slice(0, 5) : "");
    if (p.start_time && p.end_time) return `${fmt(p.start_time)}-${fmt(p.end_time)}`;
    return p.name || "";
  };

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
    gender_type: number | "";
    lecture_hours: number | "";
  }

  const [manualForm, setManualForm] = useState<ManualForm>({
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
    college_id: "",
    department_id: "",
    gender_type: 0,
    lecture_hours: 2,
  });

  const [manualFormErrors, setManualFormErrors] = useState<Partial<Record<keyof ManualForm, string>>>({});
  const [manualSubmitLoading, setManualSubmitLoading] = useState(false);

  // عيّن الكلية افتراضياً من prop
  useEffect(() => {
    if (collegeIdNum && !manualForm.college_id) {
      setManualForm((f) => ({ ...f, college_id: collegeIdNum }));
    }
  }, [collegeIdNum]);

  const computeAcademicYear = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const validateManualForm = (f: ManualForm) => {
    const e: Partial<Record<keyof ManualForm, string>> = {};
  
    // حقول مطلوبة دائماً
    const requiredAlways: (keyof ManualForm)[] = [
      "course_id","lecturer_id","group_id","classroom_id",
      "day_id","period_id","lecture_type","gender_type","lecture_hours"
    ];
    requiredAlways.forEach(k => {
      const v = f[k];
      if (v === "" || v === undefined || v === null || (typeof v === "number" && isNaN(v))) {
        e[k] = "هذا الحقل مطلوب";
      }
    });
  
    // start_date/end_date اختيارية (لو تريد إلزامها أضفهما هنا)
    if (f.start_date && f.end_date && new Date(f.start_date) > new Date(f.end_date)) {
      e.end_date = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }
  
    // إذا لم يكن هناك جدول محدد، تأكد من وجود الكلية/القسم (لأن السيرفر يتطلبها حين لا ترسل schedule_id)
    if (!selectedScheduleId) {
      const requiredScope: (keyof ManualForm)[] = ["college_id","department_id"];
      requiredScope.forEach(k => {
        const v = f[k];
        if (v === "" || v === undefined || v === null || (typeof v === "number" && isNaN(v))) {
          e[k] = "هذا الحقل مطلوب";
        }
      });
    }
  
    setManualFormErrors(e);
    return e;
  };

  const resetManualForm = () => {
    setManualForm({
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
      college_id: collegeIdNum || "",
      department_id: "",
      gender_type: 0,
      lecture_hours: 2,
    });
    setManualFormErrors({});
  };

  // عند تغيير الكلية في الإدخال اليدوي: اجلب الفترات/القاعات/المحاضرين ضمن الكلية
  useEffect(() => {
    if (!manualForm.college_id) return;
    (async () => {
      try {
        const [periodsRes, roomsRes, lecturersRes] = await Promise.all([
          apiJson(`/v1/periods?college_id=${manualForm.college_id}`),
          apiJson(`/v1/classrooms?college_id=${manualForm.college_id}`),
          apiJson(`/v1/lecturers?college_id=${manualForm.college_id}`),
        ]);

        setPeriods((periodsRes?.data || periodsRes || []).map((p: any) => ({
          period_id: p.period_id, name: p.period_name || p.name, start_time: p.start_time, end_time: p.end_time, college_id: p.college_id
        })));

        setClassrooms((roomsRes?.data || roomsRes || []).map((r: any) => ({
          classroom_id: r.classroom_id, name: r.classroom_name || r.name, capacity: r.capacity, college_id: r.college_id
        })));

        setLecturers((lecturersRes?.data || lecturersRes || []).map((l: any) => ({
          lecturer_id: l.lecturer_id, name: l.full_name || l.name, department_id: l.department_id, college_id: l.college_id
        })));
      } catch {
        // تجاهل
      }
    })();
  }, [manualForm.college_id]);

  // عند تغيير القسم في الإدخال اليدوي: اجلب المجموعات/المقررات/المحاضرين ضمن القسم
  useEffect(() => {
    if (!manualForm.college_id || !manualForm.department_id) return;
    (async () => {
      try {
        const [groupsRes, coursesRes, lecturersRes] = await Promise.all([
          apiJson(`/v1/student-groups?college_id=${manualForm.college_id}&department_id=${manualForm.department_id}`),
          apiJson(`/v1/courses?department_id=${manualForm.department_id}`),
          apiJson(`/v1/lecturers?college_id=${manualForm.college_id}&department_id=${manualForm.department_id}`),
        ]);

        setGroups((groupsRes?.data || groupsRes || []).map((g: any) => ({
          group_id: g.group_id, name: g.group_name || g.name
        })));

        setCourses((coursesRes?.data || coursesRes || []).map((c: any) => ({
          course_id: c.course_id, name: c.course_name || c.name, code: c.course_code || c.code, department_id: c.department_id, semester_id: c.semester_id
        })));

        setLecturers((lecturersRes?.data || lecturersRes || []).map((l: any) => ({
          lecturer_id: l.lecturer_id, name: l.full_name || l.name, department_id: l.department_id, college_id: l.college_id
        })));
      } catch {
        // تجاهل
      }
    })();
  }, [manualForm.college_id, manualForm.department_id]);

  // ======================== إدارة الجداول الدراسية (timetable_sets) ========================
  type TimetableSet = {
    schedule_id: number;
    name: string;
    start_date: string;
    end_date: string;
    weeks_count: number;
    status: 'draft' | 'published' | 'archived';
    is_primary: boolean;
    college_id: number;
    department_id: number | null;
    semester_id: number;
  };

  const [schedules, setSchedules] = useState<TimetableSet[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [scheduleForm, setScheduleForm] = useState<{
    name: string;
    semester_id: string;
    start_date: string;
    end_date: string;
    weeks_count: number;
    status: 'draft' | 'published' | 'archived';
    is_primary: boolean;
  }>({
    name: '',
    semester_id: '',
    start_date: '',
    end_date: '',
    weeks_count: 12,
    status: 'published',
    is_primary: true,
  });
  const [scheduleFormErrors, setScheduleFormErrors] = useState<Record<string, string>>({});

  const validateScheduleForm = () => {
    const errs: Record<string, string> = {};
    if (!scheduleForm.name) errs.name = "اسم الجدول مطلوب";
    if (!scheduleForm.start_date) errs.start_date = "تاريخ البداية مطلوب";
    if (!scheduleForm.end_date) errs.end_date = "تاريخ النهاية مطلوب";
    if (scheduleForm.start_date && scheduleForm.end_date && new Date(scheduleForm.start_date) > new Date(scheduleForm.end_date)) {
      errs.end_date = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }
    if (!collegeIdNum) errs.college_id = "الكلية غير معروفة";
    setScheduleFormErrors(errs);
    return errs;
  };

  const loadSchedules = async () => {
    if (!collegeIdNum) {
      setSchedules([]); setSelectedScheduleId(null);
      return;
    }
    setScheduleLoading(true);
    try {
      const res = await apiJson(`/v1/timetable-sets?college_id=${collegeIdNum}`);
      const list: TimetableSet[] = res?.data || res || [];
      setSchedules(list);
      const primary = list.find(s => s.is_primary) || list[0] || null;
      setSelectedScheduleId(primary ? primary.schedule_id : null);
    } catch {
      setSchedules([]); setSelectedScheduleId(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    const errs = validateScheduleForm();
    if (Object.keys(errs).length) return;
  
    setScheduleLoading(true);
    try {
      const payload: any = {
        college_id: collegeIdNum,
        name: scheduleForm.name,
        start_date: scheduleForm.start_date,
        end_date: scheduleForm.end_date,
        weeks_count: Number(scheduleForm.weeks_count || 12),
        status: scheduleForm.status,
        is_primary: Boolean(scheduleForm.is_primary),
        // بدون قسم وبدون ترم كما طلبت
      };
      console.log('Create schedule payload:', payload);
      const created = await apiJson(`/v1/timetable-sets`, { method: 'POST', body: JSON.stringify(payload) });
  
      // بعض الـ APIs ترجع {data:{...}} والبعض يرجّع {...} مباشرة
      const newSet = created?.data ?? created;
  
      if (!newSet?.schedule_id) {
        console.warn('Unexpected response shape for timetable-set:', created);
      }
  
      // أضِف الجدول الجديد للقائمة واختره
      setSchedules(prev => [newSet, ...prev]);
  
      // اجعل الجدول الذي أنشأته هو المختار
      setSelectedScheduleId(newSet?.schedule_id ?? null);
  
      // (اختياري) حمّل الجداول من السيرفر ثم أعد اختيار الجدول المنشأ لضمان التزامن
      // await loadSchedules();
      // setSelectedScheduleId(newSet?.schedule_id ?? null);
  
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace('T',' '), source: 'Manual', items: 0, status: 'نجح', notes: `تم إنشاء جدول: ${payload.name}` },
        ...prev,
      ]);
    } catch (e: any) {
      console.error('Create schedule error:', e?.response?.data || e);
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace('T',' '), source: 'Manual', items: 0, status: 'فشل', notes: `تعذر إنشاء الجدول: ${e?.response?.data?.message || e?.message || ''}` },
        ...prev,
      ]);
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (collegeIdNum && manualForm.department_id && scheduleForm.semester_id) {
      loadSchedules();
    } else {
      setSchedules([]);
      setSelectedScheduleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeIdNum, manualForm.department_id, scheduleForm.semester_id]);

  useEffect(() => {
    if (!selectedScheduleId) return;
    const s = schedules.find(x => x.schedule_id === selectedScheduleId);
    if (!s) return;
  
    // اربط القسم/الكلية/الترم من الجدول المختار بالفورم
    setManualForm(f => ({
      ...f,
      college_id: s.college_id,
      department_id: s.department_id ?? f.department_id,
    }));
  
    // حدّث الترم في نموذج الجدول إذا كان فارغاً
    if (!scheduleForm.semester_id) {
      setScheduleForm(sf => ({ ...sf, semester_id: String(s.semester_id) }));
    }
  }, [selectedScheduleId, schedules]);

  // ======================== ربط "عرض الجدول" بالـ API ========================
  const [viewLoading, setViewLoading] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);

  const loadScheduleGrid = async () => {
    if (!collegeIdNum) {
      setMockSchedule([]);
      setActiveSchedule(null);
      return;
    }
    setViewLoading(true);
    try {
      let scheduleId: number | null = selectedScheduleId;
      let schedule: any | null = null;
  
      // 1) إن كان لديك جدول مختار، استخدمه مباشرة
      if (scheduleId) {
        schedule = schedules.find(s => s.schedule_id === scheduleId) ?? { schedule_id: scheduleId };
      } else {
        // 2) وإلا، حاول اختيار primary بحسب الفلاتر
        // لو لم يوجد ترم، جلب الجدول العام (semester_id=null)
        let url = `/v1/timetable-sets?college_id=${collegeIdNum}&is_primary=1`;
        if (filterSemesterId) url += `&semester_id=${filterSemesterId}`;
        else url += `&semester_id=null`;
        if (filterDepartmentId) url += `&department_id=${filterDepartmentId}`;
  
        const sets = await apiJson(url);
        const list = sets?.data || sets || [];
        schedule = list[0] || null;
        scheduleId = schedule?.schedule_id ?? null;
      }
  
      if (!scheduleId) {
        setActiveSchedule(null);
        setMockSchedule([]);
        return;
      }
  
      // 3) اجلب البنود
      const entriesRes = await apiJson(`/v1/timetable-entries?schedule_id=${scheduleId}`);
      const entries = entriesRes?.data || entriesRes || [];
  
      // 4) خرائط العرض (اليوم/الفترة) إلى سلاسل الشبكة
      const mapped = entries.map((tt: any) => ({
        id: tt.entry_id,
        day: getDayNameById(tt.day_id) || "",                       // يجب أن يعيد نص عربي مطابق لعناوين الأعمدة
        time: getPeriodRangeById(tt.period_id) || "",               // الآن "08:00-10:00" بصيغة HH:mm-HH:mm
        course: tt.course?.course_name || getCourseById(tt.course_id)?.name || "",
        code: tt.course?.course_code || getCourseById(tt.course_id)?.code || "",
        instructor: tt.lecturer?.name || tt.lecturer?.full_name || getLecturerById(tt.lecturer_id)?.name || "",
        room: tt.classroom?.classroom_name || getClassroomById(tt.classroom_id)?.name || "",
        capacity: `${getClassroomById(tt.classroom_id)?.capacity ?? ""}`,
        color: "bg-blue-500/10 border-blue-500/30",
      }));
  
      console.debug("loadScheduleGrid:", { scheduleId, entriesCount: entries.length });
      setActiveSchedule(schedule);
      setMockSchedule(mapped);
    } catch (e) {
      console.error("loadScheduleGrid error:", e);
      setMockSchedule([]);
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadScheduleGrid();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeIdNum, filterDepartmentId, filterSemesterId]);

  useEffect(() => {
  const loadForSchedule = async () => {
    if (!selectedScheduleId) return;
    try {
      const groupsRes = await apiJson(`/v1/student-groups?college_id=${collegeIdNum}`);
      setGroups((groupsRes?.data || groupsRes || []).map((g: any) => ({
        group_id: g.group_id,
        name: g.group_name || g.name,
      })));
    } catch {}
    try {
      const coursesRes = await apiJson(`/v1/courses`);
      setCourses((coursesRes?.data || coursesRes || []).map((c: any) => ({
        course_id: c.course_id,
        name: c.course_name || c.name,
        code: c.course_code || c.code,
        department_id: c.department_id,
        semester_id: c.semester_id,
      })));
    } catch {}
  };
  loadForSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedScheduleId]);

  // ================================= حفظ محاضرة: ربطها بالجدول المحدد =================================
  const handleManualSubmit = async () => {
    // فقط للإطمئنان أننا نصل هنا
    console.log("handleManualSubmit: start", { selectedScheduleId, manualForm });
  
    const errs = validateManualForm(manualForm);
    if (Object.keys(errs).length) {
      console.warn("handleManualSubmit: validation errors", errs);
      return;
    }
  
    // لو ما في جدول مختار لا نسمح (كما طلبت)، ويمكنك إلغاء هذا الشرط لو أردت الاستنتاج التلقائي
    if (!selectedScheduleId) {
      alert("رجاءً اختر/أنشئ جدولاً أولاً");
      return;
    }
  
    setManualSubmitLoading(true);
    try {
      // payload الأساسي المطلوب دائماً
      const payload: any = {
        course_id: Number(manualForm.course_id),
        lecturer_id: Number(manualForm.lecturer_id),
        group_id: Number(manualForm.group_id),
        classroom_id: Number(manualForm.classroom_id),
        day_id: Number(manualForm.day_id),
        period_id: Number(manualForm.period_id),
        lecture_type: Number(manualForm.lecture_type),
        status: Number(manualForm.status ?? 1),
        start_date: manualForm.start_date || undefined, // اختياري
        end_date: manualForm.end_date || undefined,     // اختياري
        academic_year: manualForm.academic_year || (manualForm.start_date ? computeAcademicYear(manualForm.start_date) : undefined),
        gender_type: Number(manualForm.gender_type ?? 0),
        lecture_hours: Number(manualForm.lecture_hours),
        schedule_id: selectedScheduleId, // أهم شيء
      };
  
      // ملاحظة: لا ترسل college_id/department_id إذا كان معك schedule_id (السيرفر لا يحتاجهما)
      console.log("POST /timetable payload:", payload);
  
      await apiJson("/timetable", { method: "POST", body: JSON.stringify(payload) });
  
      setImportStatus("success");
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "Manual", items: 1, status: "نجح", notes: `أضيف بند للجدول ${selectedScheduleId}` },
        ...prev,
      ]);
  
      if (filterSemesterId) {
        await loadScheduleGrid();
      }
  
      resetManualForm();
    } catch (err: any) {
      console.error("handleManualSubmit error:", err?.response?.data || err);
      setImportStatus("conflict");
      let ui: { course: string; instructor: string; room: string; date: string; time: string }[] = [];
      const details = err?.response?.data?.conflicts || err?.responseBody?.conflicts;
      if (Array.isArray(details) && details.length) {
        ui = details.map((c: any) => ({
          course: getCourseById(c.course_id)?.code || String(c.course_id),
          instructor: getLecturerById(c.lecturer_id)?.name || String(c.lecturer_id),
          room: getClassroomById(c.classroom_id)?.name || String(c.classroom_id),
          date: getDayNameById(c.day_id) || String(c.day_id),
          time: getPeriodRangeById(c.period_id) || String(c.period_id),
        }));
      } else {
        ui = [{
          course: getCourseById(Number(manualForm.course_id))?.code || String(manualForm.course_id),
          instructor: getLecturerById(Number(manualForm.lecturer_id))?.name || String(manualForm.lecturer_id),
          room: getClassroomById(Number(manualForm.classroom_id))?.name || String(manualForm.classroom_id),
          date: getDayNameById(Number(manualForm.day_id)) || String(manualForm.day_id),
          time: getPeriodRangeById(Number(manualForm.period_id)) || String(manualForm.period_id),
        }];
      }
      setMockConflicts(ui);
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "Manual", items: 1, status: "فشل", notes: "تعارض أو خطأ في الإدخال" },
        ...prev,
      ]);
    } finally {
      setManualSubmitLoading(false);
    }
  };

  // ============================ تكامل API ============================
  const [apiUrl, setApiUrl] = useState("");
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiImportLoading, setApiImportLoading] = useState(false);
  const [apiImportSummary, setApiImportSummary] = useState<{ lectures: number; courses?: number; conflicts: number } | null>(null);

  const testApiConnection = async () => {
    if (!apiUrl) return;
    setApiTestLoading(true);
    try {
      const res = await fetch(apiUrl, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "API", items: 0, status: "نجح", notes: "اختبار الاتصال ناجح" },
        ...prev,
      ]);
    } catch (e: any) {
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "API", items: 0, status: "فشل", notes: `فشل اختبار الاتصال: ${e?.message || ""}` },
        ...prev,
      ]);
    } finally {
      setApiTestLoading(false);
    }
  };

  type ExternalRow = any;
  const normalizeExternalRow = (row: ExternalRow) => {
    const findId = (type: "course"|"lecturer"|"group"|"classroom"|"day"|"period"|"college"|"department", val: any) => {
      const by = String(val ?? "").toLowerCase().trim();
      if (!by) return undefined;
      switch (type) {
        case "course": {
          const byId = courses.find(c => String(c.course_id) === by);
          if (byId) return byId.course_id;
          const byCode = courses.find(c => String(c.code || "").toLowerCase() === by);
          if (byCode) return byCode.course_id;
          const byName = courses.find(c => String((c as any).name || "").toLowerCase() === by);
          return byName?.course_id;
        }
        case "lecturer": {
          const l = lecturers.find(x => String(x.lecturer_id) === by || String((x as any).name || "").toLowerCase() === by);
          return l?.lecturer_id;
        }
        case "group": {
          const g = groups.find(x => String(x.group_id) === by || String((x as any).name || "").toLowerCase() === by);
          return g?.group_id;
        }
        case "classroom": {
          const r = classrooms.find(x => String(x.classroom_id) === by || String((x as any).name || "").toLowerCase() === by);
          return r?.classroom_id;
        }
        case "day": {
          const d = days.find(x =>
            String(x.day_id) === by ||
            String((x as any).name || "").toLowerCase() === by ||
            String((x as any).name_ar || "").toLowerCase() === by
          );
          return d?.day_id;
        }
        case "period": {
          const p = periods.find(x => String(x.period_id) === by || String((x as any).name || "").toLowerCase() === by);
          if (p) return p.period_id;
          const [st, et] = String(val || "").split("-");
          const p2 = periods.find(x => x.start_time === st && x.end_time === et);
          return p2?.period_id;
        }
        case "college": {
          const c = colleges.find(x => String(x.college_id) === by || String((x as any).name || "").toLowerCase() === by);
          return c?.college_id;
        }
        case "department": {
          const d = departments.find(x => String(x.department_id) === by || String((x as any).name || "").toLowerCase() === by);
          return d?.department_id;
        }
      }
    };

    return {
      course_id: findId("course", row.course_id ?? row.course_code ?? row.course ?? row.course_name),
      lecturer_id: findId("lecturer", row.lecturer_id ?? row.lecturer ?? row.instructor),
      group_id: findId("group", row.group_id ?? row.group ?? row.section),
      classroom_id: findId("classroom", row.classroom_id ?? row.classroom ?? row.room),
      day_id: findId("day", row.day_id ?? row.day ?? row.weekday),
      period_id: findId("period", row.period_id ?? row.period ?? row.slot ?? row.time),
      lecture_type: Number(row.lecture_type ?? 0),
      status: Number(row.status ?? 1),
      start_date: String(row.start_date ?? row.start ?? row.begin ?? "").slice(0,10),
      end_date: String(row.end_date ?? row.end ?? row.finish ?? "").slice(0,10),
      academic_year: row.academic_year ?? "",
      college_id: findId("college", row.college_id ?? row.college),
      department_id: findId("department", row.department_id ?? row.department),
      gender_type: Number(row.gender_type ?? 0),
      lecture_hours: Number(row.lecture_hours ?? row.hours ?? 2),
    };
  };

  const handleApiImport = async () => {
    if (!apiUrl) return;
    setApiImportLoading(true);
    setApiImportSummary(null);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows: ExternalRow[] = Array.isArray(data) ? data : (data?.items || data?.data || []);
      if (!Array.isArray(rows)) throw new Error("صيغة البيانات غير مدعومة");

      const basePayloads = rows
        .map(normalizeExternalRow)
        .filter(p => p.course_id && p.lecturer_id && p.group_id && p.classroom_id && p.day_id && p.period_id);

      const payloads = basePayloads.map(p => selectedScheduleId ? ({ ...p, schedule_id: selectedScheduleId }) : p);

      const result = await apiJson("/timetable/bulk", { method: "POST", body: JSON.stringify({ rows: payloads }) });
      const inserted = result?.inserted ?? payloads.length;
      const conflicts = result?.conflicts ?? [];

      setApiImportSummary({ lectures: inserted, conflicts: conflicts.length });
      setImportStatus(conflicts.length ? "conflict" : "success");

      if (conflicts.length) {
        const ui = conflicts.map((c:any) => ({
          course: getCourseById(c.course_id)?.code || String(c.course_id),
          instructor: getLecturerById(c.lecturer_id)?.name || String(c.lecturer_id),
          room: getClassroomById(c.classroom_id)?.name || String(c.classroom_id),
          date: getDayNameById(c.day_id) || String(c.day_id),
          time: getPeriodRangeById(c.period_id) || String(c.period_id),
        }));
        setMockConflicts(ui);
      }

      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "API", items: payloads.length, status: conflicts.length ? "فشل" : "نجح", notes: conflicts.length ? `${conflicts.length} تعارض` : `استيراد إلى الجدول ${selectedScheduleId || 'افتراضي'}` },
        ...prev,
      ]);

      if (filterSemesterId) {
        await loadScheduleGrid();
      }
    } catch (e: any) {
      setImportStatus("error");
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "API", items: 0, status: "فشل", notes: `خطأ: ${e?.message || ""}` },
        ...prev,
      ]);
    } finally {
      setApiImportLoading(false);
    }
  };

  // ============================ استيراد CSV ============================
  const [csvParsingLoading, setCsvParsingLoading] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvImportSummary, setCsvImportSummary] = useState<{ total: number; inserted: number; conflicts: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setCsvFile(file);
    } else {
      setFileName("");
      setCsvFile(null);
    }
  };

  const parseCsvFile = (file: File): Promise<any[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const mod = await import("papaparse");
        const Papa = (mod as any).default ?? mod;
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          worker: true,
          complete: (res: any) => resolve(res.data || []),
          error: (err: any) => reject(err),
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  const processCsvAndImport = async () => {
    if (!csvFile) return;
    setCsvParsingLoading(true);
    setCsvImportSummary(null);
    try {
      const rows = await parseCsvFile(csvFile);
      setCsvRows(rows);
      const basePayloads = rows
        .map(normalizeExternalRow)
        .filter((p) => p.course_id && p.lecturer_id && p.group_id && p.classroom_id && p.day_id && p.period_id);

      const payloads = basePayloads.map(p => selectedScheduleId ? ({ ...p, schedule_id: selectedScheduleId }) : p);

      const result = await apiJson("/timetable/bulk", { method: "POST", body: JSON.stringify({ rows: payloads }) });
      const inserted = result?.inserted ?? 0;
      const conflicts = result?.conflicts ?? [];

      setCsvImportSummary({ total: rows.length, inserted, conflicts: conflicts.length });
      setImportStatus(conflicts.length ? "conflict" : "success");

      if (conflicts.length) {
        const ui = conflicts.map((c:any) => ({
          course: getCourseById(c.course_id)?.code || String(c.course_id),
          instructor: getLecturerById(c.lecturer_id)?.name || String(c.lecturer_id),
          room: getClassroomById(c.classroom_id)?.name || String(c.classroom_id),
          date: getDayNameById(c.day_id) || String(c.day_id),
          time: getPeriodRangeById(c.period_id) || String(c.period_id),
        }));
        setMockConflicts(ui);
      }

      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "CSV", items: payloads.length, status: conflicts.length ? "فشل" : "نجح", notes: conflicts.length ? `${conflicts.length} تعارض` : `استيراد إلى الجدول ${selectedScheduleId || 'افتراضي'}` },
        ...prev,
      ]);

      if (filterSemesterId) {
        await loadScheduleGrid();
      }
    } catch (e: any) {
      setImportStatus("error");
      setMockImportLog(prev => [
        { date: new Date().toISOString().slice(0,16).replace("T"," "), source: "CSV", items: 0, status: "فشل", notes: `خطأ: ${e?.message || ""}` },
        ...prev,
      ]);
    } finally {
      setCsvParsingLoading(false);
    }
  };

  // تنزيل سجل (زر التحميل)
  const handleDownloadLog = (log: { date: string; source: string; items: number; status: string; notes: string }, index: number) => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-log-${index + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================ إدارة جلسات المحاضرات (lecture_sessions) ============================
  interface SessionForm {
    session_date: string;
    start_time: string;
    end_time: string;
    actual_classroom_id: number | "";
    actual_attendance_count: number | "";
    session_code: string;
    status: number;
    attendance_overage_alert: boolean;
    system_attendance_count: number;
  }

  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [currentTimetableId, setCurrentTimetableId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    session_date: "",
    start_time: "",
    end_time: "",
    actual_classroom_id: "",
    actual_attendance_count: "",
    session_code: "",
    status: 0,
    attendance_overage_alert: false,
    system_attendance_count: 0,
  });
  const [sessionSubmitLoading, setSessionSubmitLoading] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  const openSessionsFor = async (timetableId: number) => {
    setCurrentTimetableId(timetableId);
    setSessionsModalOpen(true);
    try {
      const list = await apiJson(`/lecture-sessions?timetable_id=${timetableId}`);
      setSessionsList(list?.data || list || []);
    } catch {
      setSessionsList([]);
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      session_date: "",
      start_time: "",
      end_time: "",
      actual_classroom_id: "",
      actual_attendance_count: "",
      session_code: "",
      status: 0,
      attendance_overage_alert: false,
      system_attendance_count: 0,
    });
  };

  const handleCreateSession = async () => {
    if (!currentTimetableId) return;
    if (!sessionForm.session_date || !sessionForm.start_time || !sessionForm.end_time || !sessionForm.session_code) {
      return;
    }
    setSessionSubmitLoading(true);
    try {
      const payload = {
        timetable_id: currentTimetableId, // alias للـ entry_id
        session_date: sessionForm.session_date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        actual_classroom_id: sessionForm.actual_classroom_id === "" ? null : Number(sessionForm.actual_classroom_id),
        actual_attendance_count: sessionForm.actual_attendance_count === "" ? null : Number(sessionForm.actual_attendance_count),
        session_code: sessionForm.session_code,
        status: Number(sessionForm.status ?? 0),
        attendance_overage_alert: Boolean(sessionForm.attendance_overage_alert),
        system_attendance_count: Number(sessionForm.system_attendance_count ?? 0),
      };
            const created = await apiJson("/lecture-sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSessionsList((prev) => [created, ...prev]);
      resetSessionForm();
      setMockImportLog((prev) => [
        {
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          source: "Sessions",
          items: 1,
          status: "نجح",
          notes: `أضيفت جلسة ${payload.session_code}`,
        },
        ...prev,
      ]);
    } catch (e: any) {
      setMockImportLog((prev) => [
        {
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          source: "Sessions",
          items: 0,
          status: "فشل",
          notes: `تعذر إضافة الجلسة: ${e?.message || ""}`,
        },
        ...prev,
      ]);
    } finally {
      setSessionSubmitLoading(false);
    }
  };

  const closeSessionsModal = () => {
    setSessionsModalOpen(false);
    setCurrentTimetableId(null);
  };

  // تنسيق وقت HH:mm من HH:mm:ss
  const fmtHHMM = (t?: string) => (t ? t.slice(0, 5) : "");
  
  // تطبيع اسم اليوم (إن كانت مخزنة بصيغ مختلفة)
  const normalizeDayName = (name?: string) => {
    if (!name) return "";
    const s = name.replace(/\s+/g, "").toLowerCase();
    const map: Record<string, string> = {
      "الاحد": "الأحد",
      "الأحد": "الأحد",
      "الاِثنين": "الاثنين",
      "الاثنين": "الاثنين",
      "الإثنين": "الاثنين",
      "الثلاثاء": "الثلاثاء",
      "الاربعاء": "الأربعاء",
      "الأربعاء": "الأربعاء",
      "الخميس": "الخميس",
      "السبت": "السبت",
      "الجمعه": "الجمعة",
      "الجمعة": "الجمعة",
    };
    return map[s] || name;
  };
  
  // الأيام المستخدمة في رؤوس الشبكة (ثابتة عندك)
  const gridDays = useMemo(() => {
    return days
      .filter(d => d.name_ar && ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"].includes(normalizeDayName(d.name_ar)))
      .sort((a, b) => {
        // رتّب الأيام حسب ترتيبها في الأسبوع
        const order = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
        return order.indexOf(normalizeDayName(a.name_ar)) - order.indexOf(normalizeDayName(b.name_ar));
      });
  }, [days]);

  const gridPeriods = useMemo(() => {
    return periods
      .filter(p => p.start_time && p.end_time) // اعرض فقط الفترات ذات التوقيت
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [periods]);
  // صفوف الوقت الثابتة في الشبكة (لو بقيت عليها)
  const staticTimeRows = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00"];

  useEffect(() => {
    if (days.length) {
      const rows = days.map(d => ({
        day_id: d.day_id,
        name: d.name,
        name_ar: d.name_ar,
        normalized: normalizeDayName(d.name_ar || d.name),
      }));
      console.log("Days (raw):", days);
      console.table(rows);
  
      // عرّف الأيام المتوقعة هنا محلياً فقط لأغراض التحذير
      const expectedGridDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
      
      const dbDayNames = rows.map(r => r.normalized);
      const notInGrid = dbDayNames.filter(n => !expectedGridDays.includes(n));
      if (notInGrid.length) {
        console.warn("تنبيه: أيام في قاعدة البيانات غير موجودة ضمن رؤوس الشبكة:", notInGrid);
        console.warn("رؤوس الشبكة المتوقعة:", expectedGridDays);
      }
    }
  }, [days]);
  
  useEffect(() => {
    if (periods.length) {
      const rows = periods.map(p => ({
        period_id: p.period_id,
        name: p.name,
        start_time: p.start_time,
        end_time: p.end_time,
        label: p.start_time && p.end_time ? `${fmtHHMM(p.start_time)}-${fmtHHMM(p.end_time)}` : (p.name || ""),
      }));
      console.log("Periods (raw):", periods);
      console.table(rows);
  
      // عرّف الفترات المتوقعة هنا محلياً فقط لأغراض التحذير
      const expectedTimeRows = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00"];
      
      const labels = Array.from(new Set(rows.map(r => r.label).filter(Boolean)));
      const notInStaticRows = labels.filter(l => !expectedTimeRows.includes(l));
      if (notInStaticRows.length) {
        console.warn("تنبيه: تسميات فترات في قاعدة البيانات لا تتطابق مع صفوف الوقت الثابتة:", notInStaticRows);
        console.warn("صفوف الوقت المتوقعة في الشبكة:", expectedTimeRows);
      }
    }
  }, [periods]);

   return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">استيراد الجدول</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:bg-primary/10">عرض الجدول</TabsTrigger>
        </TabsList>

        {/* Import Schedule */}
        <TabsContent value="import" className="space-y-6">
          {/* Source Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "api" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("api")}
            >
              <CardContent className="pt-6 text-center">
                <Link className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-bold text-lg mb-2">تكامل API</h3>
                <p className="text-sm text-muted-foreground">الاتصال بنظام خارجي</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "file" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("file")}
            >
              <CardContent className="pt-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-bold text-lg mb-2">رفع ملف</h3>
                <p className="text-sm text-muted-foreground">Excel, PDF, CSV</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "manual" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("manual")}
            >
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-bold text-lg mb-2">إدخال يدوي</h3>
                <p className="text-sm text-muted-foreground">إنشاء/اختيار جدول وإضافة محاضرات</p>
              </CardContent>
            </Card>
          </div>

          {/* API Integration Form */}
          {importSource === "api" && (
            <Card className="backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle>تكامل API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>عنوان URL</Label>
                  <Input placeholder="https://api.example.com/timetable" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={testApiConnection} disabled={!apiUrl || apiTestLoading}>اختبار الاتصال</Button>
                  <Button onClick={handleApiImport} disabled={!apiUrl || apiImportLoading}>استيراد</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedScheduleId
                    ? `سيتم الاستيراد داخل الجدول المحدد (ID: ${selectedScheduleId}).`
                    : "لم يتم اختيار جدول محدد، سيُنشئ الخادم جدولاً مناسباً تلقائياً إذا لزم."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          {importSource === "file" && (
            <Card className="backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle>رفع ملف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">اسحب الملف هنا أو</p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                  {fileName && (
                    <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>
                  )}
                </div>
                <Button className="w-full" onClick={processCsvAndImport} disabled={!fileName}>استيراد</Button>
                <p className="text-xs text-muted-foreground">
                  {selectedScheduleId
                    ? `سيتم الاستيراد داخل الجدول المحدد (ID: ${selectedScheduleId}).`
                    : "لم يتم اختيار جدول محدد، سيُنشئ الخادم جدولاً مناسباً تلقائياً إذا لزم."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Form */}
          {importSource === "manual" && (
            <div className="space-y-6">
              {/* 1) إدارة جدول عام للكلية */}
              <Card className="backdrop-blur-sm border-primary/30">
                <CardHeader>
                  <CardTitle>إدارة الجدول الدراسي (عام للكلية)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* إنشاء جدول جديد */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label>اسم الجدول</Label>
                      <Input
                        placeholder="مثال: جدول التدريس العام 2024-2025"
                        value={scheduleForm.name}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                      />
                      {scheduleFormErrors.name && <p className="text-xs text-destructive mt-1">{scheduleFormErrors.name}</p>}
                    </div>
                    <div>
                      <Label>تاريخ البداية</Label>
                      <Input
                        type="date"
                        value={scheduleForm.start_date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                      />
                      {scheduleFormErrors.start_date && <p className="text-xs text-destructive mt-1">{scheduleFormErrors.start_date}</p>}
                    </div>
                    <div>
                      <Label>تاريخ النهاية</Label>
                      <Input
                        type="date"
                        value={scheduleForm.end_date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })}
                      />
                      {scheduleFormErrors.end_date && <p className="text-xs text-destructive mt-1">{scheduleFormErrors.end_date}</p>}
                    </div>
                  </div>
          
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>عدد الأسابيع</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={String(scheduleForm.weeks_count)}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, weeks_count: Number(e.target.value || 12) })}
                      />
                    </div>
                    <div>
                      <Label>حالة الجدول</Label>
                      <Select
                        value={scheduleForm.status}
                        onValueChange={(v) => setScheduleForm({ ...scheduleForm, status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">مسودّة</SelectItem>
                          <SelectItem value="published">منشور</SelectItem>
                          <SelectItem value="archived">مؤرشف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={scheduleForm.is_primary}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, is_primary: e.target.checked })}
                      />
                      <Label>جعله الجدول الأساسي</Label>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={loadSchedules}
                        disabled={!collegeIdNum || scheduleLoading}
                      >
                        {scheduleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "جلب الجداول"}
                      </Button>
                    </div>
                  </div>
          
                  {/* اختيار جدول موجود */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>اختر جدولاً</Label>
                      <Select
                        value={selectedScheduleId ? String(selectedScheduleId) : ""}
                        onValueChange={(v) => setSelectedScheduleId(v ? Number(v) : null)}
                        disabled={scheduleLoading || schedules.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={scheduleLoading ? "جاري التحميل..." : (schedules.length ? "اختر جدولاً" : "لا توجد جداول")} />
                        </SelectTrigger>
                        <SelectContent>
                          {schedules.map(s => (
                            <SelectItem key={s.schedule_id} value={String(s.schedule_id)}>
                              {s.name} • {s.status === 'published' ? 'منشور' : s.status === 'draft' ? 'مسودّة' : 'مؤرشف'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleCreateSchedule} disabled={scheduleLoading || !collegeIdNum}>
                        {scheduleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                        إنشاء جدول جديد
                      </Button>
                    </div>
                  </div>
          
                  <p className="text-xs text-muted-foreground">
                    هذا الجدول عام للكلية ولا يتطلب اختيار قسم أو ترم.
                  </p>
                </CardContent>
              </Card>
          
              {/* 2) إضافة محاضرة إلى الجدول المختار */}
              <Card className={`backdrop-blur-sm ${selectedScheduleId ? 'border-primary/30' : 'border-destructive/30'}`}>
                <CardHeader>
                  <CardTitle>إضافة محاضرة {selectedScheduleId ? `(لجدول ID: ${selectedScheduleId})` : ``}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedScheduleId && (
                    <div className="text-sm text-destructive border border-destructive/30 rounded-md p-2">
                      رجاءً أنشئ/اختر جدولاً أولاً.
                    </div>
                  )}
          
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* المجموعة */}
                    <div>
                      <Label>المجموعة</Label>
                      <Select
                        value={manualForm.group_id ? String(manualForm.group_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, group_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر مجموعة" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.group_id} value={String(g.group_id)}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.group_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.group_id}</p>}
                    </div>
          
                    {/* المقرر */}
                    <div>
                      <Label>المقرر</Label>
                      <Select
                        value={manualForm.course_id ? String(manualForm.course_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, course_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر مقرراً" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(c => (
                            <SelectItem key={c.course_id} value={String(c.course_id)}>
                              {c.code ? `${c.code} - ${c.name}` : c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.course_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.course_id}</p>}
                    </div>
          
                    {/* المحاضر */}
                    <div>
                      <Label>المحاضر</Label>
                      <Select
                        value={manualForm.lecturer_id ? String(manualForm.lecturer_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, lecturer_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر محاضراً" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {lecturers.map(l => (
                            <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.lecturer_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecturer_id}</p>}
                    </div>
          
                    {/* القاعة */}
                    <div>
                      <Label>القاعة</Label>
                      <Select
                        value={manualForm.classroom_id ? String(manualForm.classroom_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, classroom_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر قاعة" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {classrooms.map(r => (
                            <SelectItem key={r.classroom_id} value={String(r.classroom_id)}>
                              {r.name} {r.capacity ? `(${r.capacity})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.classroom_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.classroom_id}</p>}
                    </div>
          
                    {/* اليوم */}
                    <div>
                      <Label>اليوم</Label>
                      <Select
                        value={manualForm.day_id ? String(manualForm.day_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, day_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر اليوم" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(d => (
                            <SelectItem key={d.day_id} value={String(d.day_id)}>{d.name_ar || d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.day_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.day_id}</p>}
                    </div>
          
                    {/* الفترة */}
                    <div>
                      <Label>الفترة</Label>
                      <Select
                        value={manualForm.period_id ? String(manualForm.period_id) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, period_id: v ? Number(v) : "" })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedScheduleId ? "اختر الفترة" : "اختر جدولاً أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {periods.map(p => {
                            const lbl = p.start_time && p.end_time ? `${p.start_time}-${p.end_time}` : (p.name || `الفترة ${p.period_id}`);
                            return <SelectItem key={p.period_id} value={String(p.period_id)}>{lbl}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      {manualFormErrors.period_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.period_id}</p>}
                    </div>
          
                    {/* نوع المحاضرة */}
                    <div>
                      <Label>نوع المحاضرة</Label>
                      <Select
                        value={manualForm.lecture_type !== "" ? String(manualForm.lecture_type) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, lecture_type: v === "" ? "" : Number(v) })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">محاضرة</SelectItem>
                          <SelectItem value="1">تمرين</SelectItem>
                          <SelectItem value="2">مختبر</SelectItem>
                        </SelectContent>
                      </Select>
                      {manualFormErrors.lecture_type && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecture_type}</p>}
                    </div>
          
                    {/* الحالة */}
                    <div>
                      <Label>الحالة</Label>
                      <Select
                        value={manualForm.status !== "" ? String(manualForm.status) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, status: v === "" ? "" : Number(v) })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">فعال</SelectItem>
                          <SelectItem value="0">غير فعال</SelectItem>
                        </SelectContent>
                      </Select>
                      {manualFormErrors.status && <p className="text-xs text-destructive mt-1">{manualFormErrors.status}</p>}
                    </div>
          
                    {/* تواريخ وساعات */}
                    <div>
                      <Label>تاريخ البداية</Label>
                      <Input
                        type="date"
                        value={manualForm.start_date}
                        onChange={(e) => setManualForm({ ...manualForm, start_date: e.target.value, academic_year: computeAcademicYear(e.target.value) })}
                        disabled={!selectedScheduleId}
                      />
                      {manualFormErrors.start_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.start_date}</p>}
                    </div>
          
                    <div>
                      <Label>تاريخ النهاية</Label>
                      <Input
                        type="date"
                        value={manualForm.end_date}
                        onChange={(e) => setManualForm({ ...manualForm, end_date: e.target.value })}
                        disabled={!selectedScheduleId}
                      />
                      {manualFormErrors.end_date && <p className="text-xs text-destructive mt-1">{manualFormErrors.end_date}</p>}
                    </div>
          
                    <div>
                      <Label>العام الأكاديمي</Label>
                      <Input
                        placeholder="2024-2025"
                        value={manualForm.academic_year}
                        onChange={(e) => setManualForm({ ...manualForm, academic_year: e.target.value })}
                        disabled={!selectedScheduleId}
                      />
                    </div>
          
                    <div>
                      <Label>نوع الجنس</Label>
                      <Select
                        value={manualForm.gender_type !== "" ? String(manualForm.gender_type) : ""}
                        onValueChange={(v) => setManualForm({ ...manualForm, gender_type: v === "" ? "" : Number(v) })}
                        disabled={!selectedScheduleId}
                      >
                        <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">مشترك</SelectItem>
                          <SelectItem value="1">طلاب</SelectItem>
                          <SelectItem value="2">طالبات</SelectItem>
                        </SelectContent>
                      </Select>
                      {manualFormErrors.gender_type && <p className="text-xs text-destructive mt-1">{manualFormErrors.gender_type}</p>}
                    </div>
          
                    <div>
                      <Label>ساعات المحاضرة</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={manualForm.lecture_hours === "" ? "" : String(manualForm.lecture_hours)}
                        onChange={(e) => setManualForm({ ...manualForm, lecture_hours: e.target.value === "" ? "" : Number(e.target.value) })}
                        disabled={!selectedScheduleId}
                      />
                      {manualFormErrors.lecture_hours && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecture_hours}</p>}
                    </div>
                  </div>
          
                  <div className="flex gap-2">
                    <Button onClick={handleManualSubmit} disabled={manualSubmitLoading || !selectedScheduleId}>
                      {manualSubmitLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      حفظ
                    </Button>
                    <Button variant="outline" onClick={resetManualForm}>تفريغ</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Success Banner */}
          {importStatus === "success" && (
            <Card className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">تمت العملية بنجاح!</h3>
                    <p className="text-sm text-muted-foreground mb-3">تم حفظ/استيراد البيانات دون تعارضات حرجة</p>
                    <Button size="sm" onClick={loadScheduleGrid}>معاينة في التقويم</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conflicts Panel */}
          {importStatus === "conflict" && (
            <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-red-600">تم اكتشاف تعارضات</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المقرر</TableHead>
                      <TableHead>المحاضر</TableHead>
                      <TableHead>القاعة</TableHead>
                      <TableHead>اليوم</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockConflicts.map((conflict, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{conflict.course}</TableCell>
                        <TableCell>{conflict.instructor}</TableCell>
                        <TableCell>{conflict.room}</TableCell>
                        <TableCell>{conflict.date}</TableCell>
                        <TableCell>{conflict.time}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">تجاهل</Button>
                            <Button size="sm" variant="outline">تعديل</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Import Log */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>سجل الاستيراد/التصدير</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ والوقت</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>عدد العناصر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>تحميل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockImportLog.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>{log.items}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "نجح" ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.notes}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadLog(log, idx)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Schedule */}
        <TabsContent value="view" className="space-y-6">
          {/* Filters */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>القسم</Label>
                  <Select
                    value={filterDepartmentId}
                    onValueChange={(v) => {
                      setFilterDepartmentId(v);
                      setFilterProgramId("");
                      setFilterLevelId("");
                      setFilterSemesterId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قسماً" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .filter((d: any) => String(d.college_id) === String(collegeId))
                        .map((d) => (
                          <SelectItem key={d.department_id} value={String(d.department_id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>البرنامج</Label>
                  <Select
                    value={filterProgramId}
                    onValueChange={(v) => {
                      setFilterProgramId(v);
                      setFilterLevelId("");
                      setFilterSemesterId("");
                    }}
                    disabled={!filterDepartmentId || programs.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر برنامجاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.program_id} value={String(p.program_id)}>
                          {p.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المستوى</Label>
                  <Select
                    value={filterLevelId}
                    onValueChange={(v) => {
                      setFilterLevelId(v);
                      setFilterSemesterId("");
                    }}
                    disabled={!filterProgramId || levels.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((lv) => (
                        <SelectItem key={lv.level_id} value={String(lv.level_id)}>
                          {lv.level_name ? lv.level_name : `المستوى ${lv.level_number}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الترم</Label>
                  <Select
                    value={filterSemesterId}
                    onValueChange={setFilterSemesterId}
                    disabled={!filterLevelId || semesters.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الترم" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((s) => (
                        <SelectItem key={s.semester_id} value={String(s.semester_id)}>
                          {s.semester_name || `الترم ${s.term_number}`} {s.academic_year ? `- ${s.academic_year}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{zoomLevel}%</span>
              <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadScheduleGrid}>اليوم</Button>
              <Button size="sm" variant="outline">طباعة</Button>
              <Button size="sm" variant="outline">تصدير</Button>
            </div>
          </div>

          <Card className="backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>تشخيص البيانات (اختياري)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setDebugOpen(v => !v)}>
                  {debugOpen ? "إخفاء التشخيص" : "عرض التشخيص"}
                </Button>
              </div>
            </CardHeader>
            {debugOpen && (
              <CardContent className="space-y-4">
                <div>
                  <Label>الأيام من قاعدة البيانات</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>name</TableHead>
                        <TableHead>name_ar</TableHead>
                        <TableHead>normalized</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map(d => {
                        const normalized = normalizeDayName(d.name_ar || d.name);
                        return (
                          <TableRow key={d.day_id}>
                            <TableCell>{d.day_id}</TableCell>
                            <TableCell>{d.name || "-"}</TableCell>
                            <TableCell>{d.name_ar || "-"}</TableCell>
                            <TableCell>{normalized}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-1">
                    رؤوس الشبكة الحالية: {gridDays.map(d => d.name_ar || d.name).join("، ")}
                  </p>
                </div>
          
                <div>
                  <Label>الفترات من قاعدة البيانات</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>name</TableHead>
                        <TableHead>start_time</TableHead>
                        <TableHead>end_time</TableHead>
                        <TableHead>label HH:mm-HH:mm</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.map(p => {
                        const label = p.start_time && p.end_time ? `${fmtHHMM(p.start_time)}-${fmtHHMM(p.end_time)}` : (p.name || "");
                        return (
                          <TableRow key={p.period_id}>
                            <TableCell>{p.period_id}</TableCell>
                            <TableCell>{p.name || "-"}</TableCell>
                            <TableCell>{p.start_time || "-"}</TableCell>
                            <TableCell>{p.end_time || "-"}</TableCell>
                            <TableCell>{label || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-1">
                    صفوف الوقت الحالية في الشبكة: {gridPeriods.map(p => `${fmtHHMM(p.start_time)}-${fmtHHMM(p.end_time)}`).join("، ")}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Weekly Grid */}
          <Card className="backdrop-blur-sm overflow-x-auto">
            <CardContent className="pt-6">
              <div className="min-w-[800px]" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top right' }}>
                {/* رأس الشبكة (الأيام) */}
                <div className={cn("grid gap-2", `grid-cols-${gridDays.length + 1}`)}>
                  <div className="font-bold text-center p-4 bg-card rounded-lg">الوقت</div>
                  {gridDays.map(day => (
                    <div key={day.day_id} className="font-bold text-center p-4 bg-card rounded-lg">
                      {day.name_ar || day.name}
                    </div>
                  ))}
                </div>
          
                {/* صفوف الشبكة (الفترات) */}
                {gridPeriods.map((period) => {
                  const timeLabel = `${fmtHHMM(period.start_time)}-${fmtHHMM(period.end_time)}`;
                  return (
                    <div key={period.period_id} className={cn("grid gap-2 mt-2", `grid-cols-${gridDays.length + 1}`)}>
                      {/* خلية الوقت */}
                      <div className="text-center p-4 bg-card/50 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 ml-2" />
                        {timeLabel}
                      </div>
          
                      {/* خلايا المحاضرات */}
                      {gridDays.map(day => {
                        const lecture = mockSchedule.find(s =>
                          s.day === normalizeDayName(day.name_ar || day.name) && s.time === timeLabel
                        );
                        return (
                          <div key={day.day_id} className="min-h-[120px]">
                            {lecture ? (
                              <Card
                                className={`h-full ${lecture.color} border backdrop-blur-sm hover:scale-105 transition-all duration-200 cursor-pointer`}
                                onClick={() => openSessionsFor(lecture.id)}
                              >
                                <CardContent className="p-3">
                                  <div className="font-bold text-sm mb-1">{lecture.code}</div>
                                  <div className="text-xs mb-2">{lecture.course}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <User className="w-3 h-3" />
                                    {lecture.instructor}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {lecture.room}
                                  </div>
                                  <Badge variant="outline" className="text-xs">{lecture.capacity}</Badge>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="h-full border border-dashed border-border/30 rounded-lg bg-card/20"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
          
                {viewLoading && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/30"></div>
                  <span className="text-sm">علوم الحاسوب</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500/30"></div>
                  <span className="text-sm">نظم المعلومات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-teال-500/30"></div>
                  <span className="text-sm">الذكاء الاصطناعي</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500/30"></div>
                  <span className="text-sm">هندسة البرمجيات</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sessions Modal */}
      {sessionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>إدارة جلسات الجدول</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>تاريخ الجلسة</Label>
                  <Input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
                </div>
                <div>
                  <Label>بداية</Label>
                  <Input type="time" value={sessionForm.start_time} onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>نهاية</Label>
                  <Input type="time" value={sessionForm.end_time} onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })} />
                </div>

                <div>
                  <Label>القاعة الفعلية</Label>
                  <Select
                    value={sessionForm.actual_classroom_id ? String(sessionForm.actual_classroom_id) : ""}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, actual_classroom_id: v ? Number(v) : "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القاعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map(r => (
                        <SelectItem key={r.classroom_id} value={String(r.classroom_id)}>
                          {r.name} {r.capacity ? `(${r.capacity})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الحضور الفعلي</Label>
                  <Input type="number" value={sessionForm.actual_attendance_count === "" ? "" : String(sessionForm.actual_attendance_count)} onChange={(e) => setSessionForm({ ...sessionForm, actual_attendance_count: e.target.value === "" ? "" : Number(e.target.value) })} />
                </div>

                <div>
                  <Label>كود الجلسة</Label>
                  <Input value={sessionForm.session_code} onChange={(e) => setSessionForm({ ...sessionForm, session_code: e.target.value })} placeholder="مثال: CS101-2025-10-15-01" />
                </div>

                <div>
                  <Label>حالة الجلسة</Label>
                  <Select
                    value={String(sessionForm.status)}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, status: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">مجدولة</SelectItem>
                      <SelectItem value="1">منفذة</SelectItem>
                      <SelectItem value="2">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={sessionForm.attendance_overage_alert}
                    onChange={(e) => setSessionForm({ ...sessionForm, attendance_overage_alert: e.target.checked })}
                  />
                  <Label>تنبيه تجاوز السعة</Label>
                </div>

                <div>
                  <Label>الحضور (من النظام)</Label>
                  <Input type="number" value={String(sessionForm.system_attendance_count)} onChange={(e) => setSessionForm({ ...sessionForm, system_attendance_count: Number(e.target.value || 0) })} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateSession} disabled={sessionSubmitLoading || !currentTimetableId}>
                  {sessionSubmitLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  إضافة جلسة
                </Button>
                <Button variant="outline" onClick={closeSessionsModal}>إغلاق</Button>
              </div>

              <div className="mt-6">
                <Label>الجلسات الحالية</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكود</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>القاعة الفعلية</TableHead>
                      <TableHead>الحضور الفعلي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">لا توجد جلسات</TableCell>
                      </TableRow>
                    ) : (
                      sessionsList.map((s: any) => (
                        <TableRow key={s.session_id}>
                          <TableCell className="font-medium">{s.session_code}</TableCell>
                          <TableCell>{s.session_date}</TableCell>
                          <TableCell>{s.start_time} - {s.end_time}</TableCell>
                          <TableCell>{getClassroomById(s.actual_classroom_id)?.name || "-"}</TableCell>
                          <TableCell>{s.actual_attendance_count ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === 1 ? "default" : s.status === 2 ? "destructive" : "outline"}>
                              {s.status === 1 ? "منفذة" : s.status === 2 ? "ملغاة" : "مجدولة"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}