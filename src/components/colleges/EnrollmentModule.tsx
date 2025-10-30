import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, FilePlus, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";

// const csvInputRef = useRef<HTMLInputElement>(null);

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  Upload,
  Grid3x3,
  Shuffle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Types
type ApiDepartment = { department_id: number; department_name: string; department_code?: string; college_id: number; };
type ApiProgram = { program_id?: number; id?: number; program_name?: string; name?: string; department_id: number; };
type ApiLevel = { level_id?: number; id?: number; program_id: number; level_number: number; };
type ApiSemester = { semester_id?: number; id?: number; level_id: number; term_number: number; academic_year?: string | null;};
type ApiCourse = {
  course_id?: number; id?: number; semester_id: number;
  course_code: string; course_name: string; credit_hours: number; is_elective: boolean;
};
type ApiStudent = {
  student_id: number;
  user_id: number;
  college_id: number;
  department_id: number;
  level_id: number;
  program_id?: number | null;
  status: boolean;
  user?: { full_name: string; gender?: number | null; email?: string | null; phone?: string | null; academic_number?: string | null; };
};
type ApiStudentGroup = { group_id: number; group_name: string };

// Props
interface EnrollmentModuleProps {
  collegeId: string;
}

// Component
export default function EnrollmentModule({ collegeId }: EnrollmentModuleProps) {
  const { toast } = useToast();

  // Cohorts (دفعات) نحاول استخراجها من الفصول (semesters.academic_year)
const [selectedCohort, setSelectedCohort] = useState<string>("");
const [groupName, setGroupName] = useState<string>("");

// CSV import
const csvInputRef = useRef<HTMLInputElement>(null);
const [isImportingCsv, setIsImportingCsv] = useState(false);

// API import dialog
const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
const [apiImportUrl, setApiImportUrl] = useState("");

// Manual add dialog
const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
const [manualForm, setManualForm] = useState({
  fullName: "",
  email: "",
  phone: "",
  academicNumber: "",
  gender: "1", // 1 ذكر، 2 أنثى
  status: "1", // 1 نشط/مسجل، 0 غير نشط
});
const [isImportingApi, setIsImportingApi] = useState(false);
const [isSavingManual, setIsSavingManual] = useState(false);

const requirePath = (needCourse = false) => {
  if (!selectedDepartmentId) { toast({ title: "تنبيه", description: "اختر القسم أولًا", variant: "destructive" }); return false; }
  if (!selectedProgramId) { toast({ title: "تنبيه", description: "اختر البرنامج أولًا", variant: "destructive" }); return false; }
  if (!selectedLevelId) { toast({ title: "تنبيه", description: "اختر المستوى أولًا", variant: "destructive" }); return false; }
  if (!selectedTermId) { toast({ title: "تنبيه", description: "اختر الترم أولًا", variant: "destructive" }); return false; }
  if (needCourse && !selectedCourseId) { toast({ title: "تنبيه", description: "اختر المقرر أولًا", variant: "destructive" }); return false; }
  if (!selectedCohort) { toast({ title: "تنبيه", description: "اختر الدفعة (السنة الأكاديمية)", variant: "destructive" }); return false; }
  if (!groupName.trim()) { toast({ title: "تنبيه", description: "أدخل اسم المجموعة", variant: "destructive" }); return false; }
  return true;
};

const handleClickImportCsv = () => {
  if (!requirePath(false)) return;
  csvInputRef.current?.click();
};

const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const isCsv = file.name.toLowerCase().endsWith(".csv");
  if (!isCsv) {
    toast({ title: "تنبيه", description: "الرجاء اختيار ملف CSV", variant: "destructive" });
    e.target.value = "";
    return;
  }

  try {
    setIsImportingCsv(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("college_id", String(collegeId));
    formData.append("department_id", selectedDepartmentId);
    formData.append("program_id", selectedProgramId);
    formData.append("level_id", selectedLevelId);
    formData.append("semester_id", selectedTermId);
    if (selectedCourseId) formData.append("course_id", selectedCourseId);
    formData.append("cohort", selectedCohort);

    // Endpoint متوقع: POST /v1/students/import-csv
    await api.post("/v1/students/import-csv", formData, { headers: { "Content-Type": "multipart/form-data" } });
    toast({ title: "نجاح", description: "تم استيراد الطلاب من CSV" });
    await fetchAvailableStudents();
  } catch (error: any) {
    const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل استيراد ملف الطلاب";
    const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل استيراد ملف الطلاب";
    toast({ title: "خطأ", description: String(msg), variant: "destructive" });
  } finally {
    setIsImportingCsv(false);
    if (csvInputRef.current) csvInputRef.current.value = "";
  }
};

const openApiDialog = () => {
  if (!requirePath(false)) return;
  setApiImportUrl("");
  setIsApiDialogOpen(true);
};

const handleImportFromApi = async () => {
  if (!apiImportUrl) {
    toast({ title: "تنبيه", description: "أدخل رابط API أولًا", variant: "destructive" });
    return;
  }
  try {
    setIsImportingApi(true);
    // ننصح بأن ينفذ الخادم عملية الجلب من المصدر الخارجي لتجنب CORS
    // Endpoint متوقع: POST /v1/students/import-external
    const payload = {
      source_url: apiImportUrl,
      college_id: Number(collegeId),
      department_id: Number(selectedDepartmentId),
      program_id: Number(selectedProgramId),
      level_id: Number(selectedLevelId),
      semester_id: Number(selectedTermId),
      course_id: selectedCourseId ? Number(selectedCourseId) : null,
      cohort: selectedCohort,
    };
    await api.post("/v1/students/import-external", payload);
    toast({ title: "نجاح", description: "تم استيراد الطلاب من مصدر API" });
    setIsApiDialogOpen(false);
    await fetchAvailableStudents();
  } catch (error: any) {
    const msg = error?.response?.data?.message || "فشل استيراد الطلاب عبر API";
    toast({ title: "خطأ", description: msg, variant: "destructive" });
  } finally {
    setIsImportingApi(false);
  }
};

const openManualDialog = () => {
  if (!requirePath(false)) return;
  setManualForm({
    fullName: "",
    email: "",
    phone: "",
    academicNumber: "",
    gender: "1",
    status: "1",
  });
  setIsManualDialogOpen(true);
};

const handleSubmitManual = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setIsSavingManual(true);
    const payload = {
      // نقترح أن يوفر الباك اند endpoint يقوم بإنشاء user + student معًا
      full_name: manualForm.fullName,
      email: manualForm.email,
      phone: manualForm.phone,
      academic_number: manualForm.academicNumber,
      gender: Number(manualForm.gender),
      status: manualForm.status === "1",
      college_id: Number(collegeId),
      department_id: Number(selectedDepartmentId),
      program_id: Number(selectedProgramId),
      level_id: Number(selectedLevelId),
      semester_id: Number(selectedTermId),
      course_id: selectedCourseId ? Number(selectedCourseId) : null,
      cohort: selectedCohort,
    };
    // Endpoint متوقع: POST /v1/students (أو /v1/students/manual)
    await api.post("/v1/students", payload);
    toast({ title: "نجاح", description: "تم إضافة الطالب يدويًا" });
    setIsManualDialogOpen(false);
    await fetchAvailableStudents();
  } catch (error: any) {
    const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل حفظ بيانات الطالب";
    const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل حفظ بيانات الطالب";
    toast({ title: "خطأ", description: String(msg), variant: "destructive" });
  } finally {
    setIsSavingManual(false);
  }
};

  // Import step
  const [importStep, setImportStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(false);

  // Steps state
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [levels, setLevels] = useState<ApiLevel[]>([]);
  const [semesters, setSemesters] = useState<ApiSemester[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Groups/Students
  const [groups, setGroups] = useState<{ id: number; name: string; students: any[]; maxSize: number }[]>([]);
  const [availableStudents, setAvailableStudents] = useState<{ id: string; name: string; gender: string; gpa?: number; group?: string | null }[]>([]);

  // Mock (kept for UI)
  const mockFailingStudents = [
    { id: "STD-2101", name: "أحمد محمد علي", year: 2023, gpa: 2.3, gender: "ذكر", notes: "راسب في CS101" },
    { id: "STD-2102", name: "فاطمة حسن", year: 2023, gpa: 2.1, gender: "أنثى", notes: "راسب في CS102" },
    { id: "STD-2103", name: "خالد عبدالله", year: 2022, gpa: 1.9, gender: "ذكر", notes: "راسب في CS101, CS202" },
    { id: "STD-2104", name: "نورة سالم", year: 2023, gpa: 2.4, gender: "أنثى", notes: "راسب في CS101" },
  ];

  // Steps labels
  const steps = [
    { num: 1, label: "اختر القسم" },
    { num: 2, label: "البرنامج" },
    { num: 3, label: "المستوى" },
    { num: 4, label: "الترم" },
    { num: 5, label: "المقرر" },
    { num: 6, label: "المعاينة" },
  ];

  // Fetchers
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/v1/departments", { params: { college_id: collegeId } });
      setDepartments(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" });
    }
  };

  const fetchPrograms = async (departmentId: number) => {
    try {
      const res = await api.get("/v1/programs", { params: { department_id: departmentId } });
      const raw = res.data?.data ?? res.data;
      const mapped: ApiProgram[] = raw.map((p: any) => ({
        program_id: p.program_id ?? p.id,
        program_name: p.program_name ?? p.name,
        department_id: p.department_id,
      }));
      setPrograms(mapped);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل البرامج", variant: "destructive" });
    }
  };

  const computedCohorts = useMemo(() => {
    const years = (semesters as any[]).map(s => s.academic_year).filter(Boolean);
    return Array.from(new Set(years)) as string[];
  }, [semesters]);

  const fetchLevels = async (programId: number) => {
    try {
      const res = await api.get("/v1/levels", { params: { program_id: programId } });
      const raw = res.data?.data ?? res.data;
      const mapped: ApiLevel[] = raw.map((l: any) => ({
        level_id: l.level_id ?? l.id,
        program_id: l.program_id,
        level_number: l.level_number ?? l.number ?? 1,
      }));
      setLevels(mapped);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستويات", variant: "destructive" });
    }
  };

const fetchSemesters = async (levelId: number) => {
  try {
    const res = await api.get("/v1/semesters", { params: { level_id: levelId } });
    const raw = res.data?.data ?? res.data;
    const mapped: ApiSemester[] = raw.map((t: any) => ({
      semester_id: t.semester_id ?? t.id,
      level_id: t.level_id,
      term_number: t.term_number ?? t.number ?? 1,
      academic_year: t.academic_year ?? null, // ← هنا
    }));
    setSemesters(mapped);
  } catch {
    toast({ title: "خطأ", description: "فشل تحميل الفصول", variant: "destructive" });
  }
};

  const fetchCourses = async (semesterId: number) => {
    try {
      const res = await api.get("/v1/courses", { params: { semester_id: semesterId } });
      const raw = res.data?.data ?? res.data;
      const mapped: ApiCourse[] = raw.map((c: any) => ({
        course_id: c.course_id ?? c.id,
        semester_id: c.semester_id,
        course_code: c.course_code ?? c.code,
        course_name: c.course_name ?? c.name,
        credit_hours: c.credit_hours ?? 0,
        is_elective: !!c.is_elective,
      }));
      setCourses(mapped);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المقررات", variant: "destructive" });
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/v1/student-groups", { params: { college_id: collegeId } });
      const raw: ApiStudentGroup[] = res.data?.data ?? res.data;
      setGroups(raw.map(g => ({
        id: g.group_id,
        name: g.group_name,
        students: [], // سيتم تعبئتها عندما تنفذ الربط
        maxSize: 30,
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المجموعات", variant: "destructive" });
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      if (!selectedDepartmentId) return;
      const params: any = {
        college_id: collegeId,
        department_id: Number(selectedDepartmentId),
      };
      if (selectedProgramId) params.program_id = Number(selectedProgramId);
      if (selectedLevelId) params.level_id = Number(selectedLevelId);
      // semester/course filters ليست موجودة عادة على مستوى الطلاب، لذا نتجاهلها هنا

      // ملاحظة: يجب أن يتوفر لديك StudentsController@index يدعم هذه الفلاتر
      const res = await api.get("/v1/students", { params });
      const raw: ApiStudent[] = res.data?.data ?? res.data;

      setAvailableStudents(
        raw.map((s) => ({
          id: String(s.user?.academic_number || s.student_id),
          name: s.user?.full_name || `طالب ${s.student_id}`,
          gender: s.user?.gender === 1 ? "ذكر" : s.user?.gender === 2 ? "أنثى" : "-",
          group: null,
        }))
      );
    } catch {
      // لو ما عندك /v1/students حالياً، أبقِ القائمة فارغة بدون إزعاج المستخدم
      // toast({ title: "تنبيه", description: "لم يتم العثور على واجهة الطلاب. يرجى إضافة StudentsController.", variant: "destructive" });
    }
  };

  // Effects chain
  useEffect(() => {
    if (!collegeId) return;
    fetchDepartments();
    fetchGroups();
  }, [collegeId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchPrograms(Number(selectedDepartmentId));
    } else {
      setPrograms([]);
      setSelectedProgramId("");
    }
    setLevels([]);
    setSemesters([]);
    setCourses([]);
    setSelectedLevelId("");
    setSelectedTermId("");
    setSelectedCourseId("");
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchLevels(Number(selectedProgramId));
    } else {
      setLevels([]);
      setSelectedLevelId("");
    }
    setSemesters([]);
    setCourses([]);
    setSelectedTermId("");
    setSelectedCourseId("");
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedLevelId) {
      fetchSemesters(Number(selectedLevelId));
    } else {
      setSemesters([]);
      setSelectedTermId("");
    }
    setCourses([]);
    setSelectedCourseId("");
  }, [selectedLevelId]);

  useEffect(() => {
    if (selectedTermId) {
      fetchCourses(Number(selectedTermId));
    } else {
      setCourses([]);
      setSelectedCourseId("");
    }
  }, [selectedTermId]);

  // تحميل الطلاب المتاحين حسب الاختيارات (لتبويب المجموعات + خطوة 6 مستقبلاً)
  useEffect(() => {
    fetchAvailableStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentId, selectedProgramId, selectedLevelId]);

  // UI helpers
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const currentStepList = useMemo(() => {
    switch (importStep) {
      case 1: return departments.map(d => ({ value: String(d.department_id), label: d.department_name }));
      case 2: return programs.map(p => ({ value: String(p.program_id ?? p.id), label: p.program_name ?? (p as any).name }));
      case 3: return levels.map(l => ({ value: String(l.level_id ?? l.id), label: `المستوى ${l.level_number}` }));
      case 4: return semesters.map(s => ({ value: String(s.semester_id ?? s.id), label: `الترم ${s.term_number}` }));
      case 5: return courses.map(c => ({ value: String(c.course_id ?? c.id), label: `${c.course_code} - ${c.course_name}` }));
      default: return [];
    }
  }, [importStep, departments, programs, levels, semesters, courses]);

  const currentStepValue = useMemo(() => {
    switch (importStep) {
      case 1: return selectedDepartmentId;
      case 2: return selectedProgramId;
      case 3: return selectedLevelId;
      case 4: return selectedTermId;
      case 5: return selectedCourseId;
      default: return "";
    }
  }, [importStep, selectedDepartmentId, selectedProgramId, selectedLevelId, selectedTermId, selectedCourseId]);

  const handleCurrentStepChange = (val: string) => {
    switch (importStep) {
      case 1: setSelectedDepartmentId(val); break;
      case 2: setSelectedProgramId(val); break;
      case 3: setSelectedLevelId(val); break;
      case 4: setSelectedTermId(val); break;
      case 5: setSelectedCourseId(val); break;
      default: break;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-1 bg-card/50 backdrop-blur-sm">
          {/* <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">استيراد الطلاب</TabsTrigger> */}
          <TabsTrigger value="groups" className="data-[state=active]:bg-primary/10">إدارة المجموعات</TabsTrigger>
        </TabsList>

        {/* Import Students */}
        {/* <TabsContent value="import" className="space-y-6">
          Stepper
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={step.num} className="flex items-center">
                    <div className={`flex items-center gap-2 ${importStep >= step.num ? 'text-primary' : 'text-muted-foreground'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        importStep >= step.num
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-card border-2'
                      }`}>
                        {importStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                      </div>
                      <span className="text-sm font-medium hidden md:block">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 w-12 mx-2 ${importStep > step.num ? 'bg-primary' : 'bg-border'}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          Step Content
          {importStep < 6 && (
            <Card className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{steps[importStep - 1].label}</CardTitle>
                <p className="text-sm text-muted-foreground">البيانات من نظام SAR (تجريبي)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={currentStepValue} onValueChange={handleCurrentStepChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStepList.length === 0 ? (
                      <SelectItem value="-" disabled>لا توجد خيارات</SelectItem>
                    ) : currentStepList.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportStep(Math.max(1, importStep - 1))}>السابق</Button>
                  <Button
                    onClick={() => {
                      // تأكيد اختيار كل خطوة قبل الانتقال
                      if (importStep === 1 && !selectedDepartmentId) return toast({ title: "تنبيه", description: "اختر القسم أولاً", variant: "destructive" });
                      if (importStep === 2 && !selectedProgramId) return toast({ title: "تنبيه", description: "اختر البرنامج أولاً", variant: "destructive" });
                      if (importStep === 3 && !selectedLevelId) return toast({ title: "تنبيه", description: "اختر المستوى أولاً", variant: "destructive" });
                      if (importStep === 4 && !selectedTermId) return toast({ title: "تنبيه", description: "اختر الترم أولاً", variant: "destructive" });
                      if (importStep === 5 && !selectedCourseId) return toast({ title: "تنبيه", description: "اختر المقرر أولاً", variant: "destructive" });
                      setImportStep(Math.min(6, importStep + 1));
                    }}
                  >
                    التالي
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          Preview Failing Students (mock kept)
          {importStep === 6 && (
            <Card className="backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>الطلاب الراسبون (السنوات السابقة)</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Search className="w-4 h-4 ml-2" />
                      بحث
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 ml-2" />
                      تصدير
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox />
                      </TableHead>
                      <TableHead>رقم الطالب</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>سنة الرسوب</TableHead>
                      <TableHead>المعدل</TableHead>
                      <TableHead>الجنس</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockFailingStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>
                          <Badge variant={student.gpa < 2.0 ? "destructive" : "default"}>
                            {student.gpa}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                Assignment Panel
                <Card className="mt-6 border-primary/30">
                  <CardHeader>
                    <CardTitle>تعيين إلى دفعة/مجموعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>الدفعة الحالية</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدفعة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025/2026</SelectItem>
                          <SelectItem value="2024">2024/2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="add-all" />
                      <Label htmlFor="add-all">إضافة الكل</Label>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ملخص الاختيار</span>
                        <Badge>{selectedStudents.length} طالب مختار</Badge>
                      </div>
                      {selectedStudents.length > 0 && (
                        <Badge variant="outline" className="mr-2">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          0 تعارضات
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full" disabled={selectedStudents.length === 0}>
                      تأكيد التعيين
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </TabsContent> */}

        {/* Manage Groups */}
        <TabsContent value="groups" className="space-y-6">
          {/* Selection Path */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* القسم */}
                <div>
                  <Label>القسم</Label>
                  <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* البرنامج */}
                <div>
                  <Label>البرنامج</Label>
                  <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={!programs.length}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر البرنامج" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={String(p.program_id ?? (p as any).id)} value={String(p.program_id ?? (p as any).id)}>
                          {p.program_name ?? (p as any).name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* المستوى */}
                <div>
                  <Label>المستوى</Label>
                  <Select value={selectedLevelId} onValueChange={setSelectedLevelId} disabled={!levels.length}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map(l => (
                        <SelectItem key={String(l.level_id ?? (l as any).id)} value={String(l.level_id ?? (l as any).id)}>
                          المستوى {l.level_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* الترم */}
                <div>
                  <Label>الترم</Label>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId} disabled={!semesters.length}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الترم" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map(s => (
                        <SelectItem key={String(s.semester_id ?? (s as any).id)} value={String(s.semester_id ?? (s as any).id)}>
                          الترم {s.term_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أدوات الاستيراد حسب الدفعة */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle> استيراد المجموعات الدراسية </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* الدفعة (السنة الأكاديمية) */}
                <div>
                  <Label>الدفعة (السنة الأكاديمية)</Label>
                  {computedCohorts.length > 0 ? (
                    <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدفعة" />
                      </SelectTrigger>
                      <SelectContent>
                        {computedCohorts.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="مثال: 2025/2026 أو 2025"
                      value={selectedCohort}
                      onChange={(e) => setSelectedCohort(e.target.value)}
                    />
                  )}
                </div>
                <div> 
                  <Label>اسم المجموعة *</Label> 
                  <Input placeholder="مثال: المجموعة أ - الفصل الأول" value={groupName} onChange={(e) => setGroupName(e.target.value)} required /> 
                </div>

                
          
                {/* استيراد CSV */}
                <div className="flex items-end">
                  <div className="flex gap-2">
                    <input
                      ref={(csvInputRef as any)}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCsvChange}
                    />
                    <Button variant="outline" onClick={handleClickImportCsv} disabled={isImportingCsv}>
                      {isImportingCsv && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                      <Upload className="w-4 h-4 ml-2" />
                      استيراد CSV
                    </Button>
          
                    {/* استيراد من API */}
                    <Button variant="outline" onClick={openApiDialog}>
                      <Link2 className="w-4 h-4 ml-2" />
                      استيراد من API
                    </Button>
          
                    {/* إضافة يدوي */}
                    <Button onClick={openManualDialog}>
                      <FilePlus className="w-4 h-4 ml-2" />
                      إضافة يدوي
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvChange}
          />
          
          {/* حوار استيراد من API */}
          <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>استيراد الطلاب من API خارجي</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>رابط API</Label>
                <Input
                  placeholder="https://example.com/students.json"
                  value={apiImportUrl}
                  onChange={(e) => setApiImportUrl(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsApiDialogOpen(false)}>إلغاء</Button>
                <Button onClick={handleImportFromApi} disabled={isImportingApi}>
                  {isImportingApi && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  استيراد
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* حوار إضافة يدوي */}
          <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب يدويًا</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmitManual}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>الاسم الكامل *</Label>
                    <Input value={manualForm.fullName} onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>الرقم الأكاديمي *</Label>
                    <Input value={manualForm.academicNumber} onChange={(e) => setManualForm({ ...manualForm, academicNumber: e.target.value })} required />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني *</Label>
                    <Input type="email" value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>الجوال *</Label>
                    <Input value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} required />
                  </div>
                  <div>
                    <Label>الجنس *</Label>
                    <Select value={manualForm.gender} onValueChange={(v) => setManualForm({ ...manualForm, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ذكر</SelectItem>
                        <SelectItem value="2">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحالة *</Label>
                    <Select value={manualForm.status} onValueChange={(v) => setManualForm({ ...manualForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">نشط</SelectItem>
                        <SelectItem value="0">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsManualDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isSavingManual}>
                    {isSavingManual && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    حفظ
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Groups Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map(group => (
              <Card key={group.id} className="backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="outline">{group.students.length}/{group.maxSize}</Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${(group.students.length / group.maxSize) * 100}%` }}
                    ></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 min-h-[200px] border-2 border-dashed border-border/30 rounded-lg p-3">
                    {group.students.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <UserPlus className="w-8 h-8" />
                      </div>
                    ) : (
                      group.students.map(student => (
                        <div key={student.id} className="p-2 bg-card rounded border text-sm">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الذكور:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الإناث:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>التعارضات:</span>
                      <Badge variant="outline" className="text-xs">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Available Students */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>الطلاب المتاحون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(availableStudents.length ? availableStudents : []).map(student => (
                  <Card key={student.id} className="cursor-move hover:shadow-lg transition-all duration-200 border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="font-medium text-sm">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.id}</div>
                      <Badge variant="outline" className="mt-2 text-xs">{student.gender}</Badge>
                    </CardContent>
                  </Card>
                ))}
                {availableStudents.length === 0 && (
                  <div className="text-sm text-muted-foreground">لا يوجد طلاب متاحون وفق الفلاتر المختارة.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}