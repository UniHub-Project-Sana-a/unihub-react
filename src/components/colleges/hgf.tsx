import React, { useState, useEffect, useMemo } from "react";
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

// --- Types based on Database Schema ---
type College = { college_id: number; college_name: string; };
type Department = { department_id: number; department_name: string; college_id: number; };
type Program = { program_id: number; program_name: string; department_id: number; };
type Level = { level_id: number; level_number: number; level_name?: string; program_id: number; };
type Course = { course_id: number; course_name: string; course_code?: string; department_id?: number; semester_id?: number; };
type Lecturer = { lecturer_id: number; user?: { full_name: string; }; department_id: number; college_id: number; };
type StudentGroup = { group_id: number; group_name: string; college_id: number; department_id: number; level_id: number; semester_id: number; };
type Classroom = { classroom_id: number; classroom_name: string; capacity?: number; building?: { college_id: number; }; };
type Day = { day_id: number; day_name: string; };
type Period = { period_id: number; period_name?: string; start_time: string; end_time: string; college_id: number; };

// Main Timetable Entry Type
type TimetableEntry = {
  timetable_id: number;
  course_id: number; lecturer_id: number; group_id: number; level_id: number;
  classroom_id: number; day_id: number; period_id: number;
  start_date: string; end_date: string;
  course?: Course; lecturer?: Lecturer; classroom?: Classroom; day?: Day; period?: Period;
};

// Log Entry Type
type ImportLog = { id: number; created_at: string; source: string; items: number; status: string; notes?: string; };

interface TimetableModuleProps {
  collegeId: string;
}

export default function TimetableModule({ collegeId }: TimetableModuleProps) {
  // ========================= الإعدادات العامة =========================
  const collegeIdNum = Number(collegeId);
  const { toast } = useToast();

  // UI States
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "conflict" | "error">("idle");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [debugOpen, setDebugOpen] = useState(false);

  // API Wrapper
  const apiJson = async (path: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();
    const data = init?.body ? JSON.parse(init.body as string) : undefined;
    try {
        const response = await api.request({ url: path, method: method as any, data });
        return response.data;
    } catch (error: any) {
        console.error(`API Error on ${method} ${path}:`, error.response?.data || error.message);
        toast({
            title: "خطأ في الاتصال بالخادم",
            description: error.response?.data?.message || "فشل جلب البيانات، يرجى المحاولة مرة أخرى.",
            variant: "destructive",
        });
        throw error;
    }
  };

  // ===================== States for Fetched Data =====================
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [scheduleData, setScheduleData] = useState<TimetableEntry[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Loading states
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  
  // ===================== Data Loading Effects =====================
  
  // 1. Load data that doesn't depend on user selection
  useEffect(() => {
    const loadInitialData = async () => {
      if (!collegeIdNum) return;
      setLookupsLoading(true);
      try {
        const [collegesRes, daysRes, logsRes, lecturersRes, classroomsRes, periodsRes] = await Promise.all([
          apiJson('/v1/colleges'),
          apiJson('/v1/days'),
          apiJson(`/v1/timetable-import-logs?college_id=${collegeIdNum}`),
          apiJson(`/v1/lecturers?college_id=${collegeIdNum}&with=user`),
          apiJson(`/v1/classrooms?college_id=${collegeIdNum}`),
          apiJson(`/v1/periods?college_id=${collegeIdNum}`),
        ]);
        setColleges(collegesRes.data || collegesRes || []);
        setDays(daysRes.data || daysRes || []);
        setImportLogs(logsRes.data || logsRes || []);
        setLecturers(lecturersRes.data || lecturersRes || []);
        setClassrooms(classroomsRes.data || classroomsRes || []);
        setPeriods(periodsRes.data || periodsRes || []);
      } catch (error) { /* Handled by apiJson */ }
      finally { setLookupsLoading(false); }
    };
    loadInitialData();
  }, [collegeIdNum]);

  // 2. Filters for "View Schedule" tab
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>("");
  const [filterProgramId, setFilterProgramId] = useState<string>("");
  const [filterLevelId, setFilterLevelId] = useState<string>("");

  // ============================ Manual Entry Form (`timetable`) ============================

  interface ManualForm {
    course_id: number | ""; lecturer_id: number | ""; group_id: number | "";
    level_id: number | ""; classroom_id: number | ""; day_id: number | "";
    period_id: number | ""; lecture_type: number | ""; status: number | "";
    start_date: string; end_date: string; academic_year: string;
    college_id: number | ""; department_id: number | "";
    program_id: number | ""; // Helper field for cascading
    gender_type: number | ""; lecture_hours: number | "";
  }

  const [manualForm, setManualForm] = useState<ManualForm>({
    college_id: collegeIdNum || "", department_id: "", program_id: "",
    level_id: "", course_id: "", lecturer_id: "", group_id: "", classroom_id: "",
    day_id: "", period_id: "", lecture_type: 0, status: 1, start_date: "",
    end_date: "", academic_year: "", gender_type: 0, lecture_hours: 2,
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
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  // --- CASCADING LOADS FOR MANUAL FORM ---
  
  // A) When form's college_id changes, fetch departments
  useEffect(() => {
    const college = manualForm.college_id;
    if (!college) { setDepartments([]); return; }
    apiJson(`/v1/departments?college_id=${college}`)
      .then(res => setDepartments(res.data || res || []))
      .catch(() => setDepartments([]));
  }, [manualForm.college_id]);

  // B) When form's department_id changes, fetch programs
  useEffect(() => {
    const department = manualForm.department_id;
    if (!department) {
      setPrograms([]);
      setManualForm(f => ({ ...f, program_id: "", level_id: "", course_id: "", group_id: "" }));
      return;
    }
    apiJson(`/v1/programs?department_id=${department}`)
      .then(res => setPrograms(res.data || res || []))
      .catch(() => setPrograms([]));
  }, [manualForm.department_id]);

  // C) When form's program_id changes, fetch levels
  useEffect(() => {
    const program = manualForm.program_id;
    if (!program) {
      setLevels([]);
      setManualForm(f => ({ ...f, level_id: "", course_id: "", group_id: "" }));
      return;
    }
    apiJson(`/v1/levels?program_id=${program}`)
      .then(res => setLevels(res.data || res || []))
      .catch(() => setLevels([]));
  }, [manualForm.program_id]);

  // D) ⭐ NEW: When form's level_id changes, fetch courses and groups for that level
  useEffect(() => {
    const levelId = manualForm.level_id;
    if (!levelId) {
      setCourses([]);
      setGroups([]);
      setManualForm(f => ({ ...f, course_id: "", group_id: "" }));
      return;
    }
    const loadLevelData = async () => {
      try {
        const [coursesRes, groupsRes] = await Promise.all([
          // Assuming backend supports fetching courses by level_id
          apiJson(`/v1/courses?level_id=${levelId}`),
          apiJson(`/v1/student-groups?level_id=${levelId}`)
        ]);
        setCourses(coursesRes.data || coursesRes || []);
        setGroups(groupsRes.data || groupsRes || []);
      } catch (error) {
        setCourses([]);
        setGroups([]);
      }
    };
    loadLevelData();
  }, [manualForm.level_id]);


  // --- FORM VALIDATION AND SUBMISSION ---
  const validateManualForm = (): boolean => {
    const errors: Partial<Record<keyof ManualForm, string>> = {};
    const requiredFields: (keyof ManualForm)[] = [
        'college_id', 'department_id', 'level_id', 'course_id', 'lecturer_id',
        'group_id', 'classroom_id', 'day_id', 'period_id',
        'start_date', 'end_date'
    ];
    requiredFields.forEach(field => {
      if (!manualForm[field]) { errors[field] = "هذا الحقل مطلوب"; }
    });
    setManualFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetManualForm = () => { /* ... (code is correct) ... */ };
  
  const handleManualSubmit = async () => {
    if (!validateManualForm()) {
      toast({ title: "الرجاء تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setManualSubmitLoading(true);
    setImportStatus("idle");
    const { program_id, ...payload } = manualForm; // Remove helper field
    try {
      await apiJson('/v1/timetable', { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: "نجاح", description: "تمت إضافة البند بنجاح." });
      setImportStatus("success");
      resetManualForm();
      // ... (rest of success logic)
    } catch (error: any) {
      setImportStatus("conflict");
      // ... (error handling)
    } finally {
      setManualSubmitLoading(false);
    }
  };

  // ... (Rest of the functions before return)
  const loadScheduleGrid = async () => { /* ... */ };
  const gridDays = useMemo(() => { /* ... */ return []; }, [days]);
  const gridPeriods = useMemo(() => { /* ... */ return []; }, [periods]);
  const mappedScheduleForGrid = useMemo(() => { /* ... */ return []; }, [scheduleData]);
  const openSessionsFor = async (timetableId: number) => { /* ... */ };
  const closeSessionsModal = () => { /* ... */ };
  
  const collegeName = useMemo(() => {
      const college = colleges.find(c => c.college_id === collegeIdNum);
      return college ? college.college_name : `كلية ID: ${collegeIdNum}`;
  }, [colleges, collegeIdNum]);

   return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">إضافة بند للجدول</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:bg-primary/10">عرض الجدول</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card className="backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle>إضافة بند في الجدول الدراسي</CardTitle>
              <p className="text-sm text-muted-foreground">اتبع التسلسل في الاختيار من الأعلى للأسفل.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* === ACADEMIC STRUCTURE SECTION === */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* College (Read-only) */}
                <div>
                  <Label>الكلية</Label>
                  <Input
                    disabled
                    value={lookupsLoading ? "جاري التحميل..." : collegeName}
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
                      {departments.map(d => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>)}
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

              {/* === LECTURE DETAILS SECTION === */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Course */}
                <div>
                  <Label>المقرر</Label>
                  <Select
                    value={String(manualForm.course_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, course_id: v ? Number(v) : "" })}
                    disabled={!manualForm.level_id || courses.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!manualForm.level_id ? "اختر المستوى أولاً" : "اختر مقرراً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.course_id} value={String(c.course_id)}>{c.course_code} - {c.course_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.course_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.course_id}</p>}
                </div>
                
                {/* Student Group */}
                <div>
                  <Label>المجموعة الطلابية</Label>
                  <Select
                    value={String(manualForm.group_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, group_id: v ? Number(v) : "" })}
                    disabled={!manualForm.level_id || groups.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!manualForm.level_id ? "اختر المستوى أولاً" : "اختر مجموعة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => <SelectItem key={g.group_id} value={String(g.group_id)}>{g.group_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.group_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.group_id}</p>}
                </div>

                {/* --- التعديل هنا: تم حذف قيد disabled --- */}
                {/* Lecturer */}
                <div>
                  <Label>المحاضر</Label>
                  <Select
                    value={String(manualForm.lecturer_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, lecturer_id: v ? Number(v) : "" })}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder={lookupsLoading ? "جاري التحميل..." : "اختر محاضراً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {lecturers.map(l => <SelectItem key={l.lecturer_id} value={String(l.lecturer_id)}>{l.user?.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.lecturer_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecturer_id}</p>}
                </div>

                {/* Classroom */}
                <div>
                  <Label>القاعة الدراسية</Label>
                  <Select
                    value={String(manualForm.classroom_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, classroom_id: v ? Number(v) : "" })}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder={lookupsLoading ? "جاري التحميل..." : "اختر قاعة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map(r => <SelectItem key={r.classroom_id} value={String(r.classroom_id)}>{r.classroom_name} {r.capacity ? `(${r.capacity})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.classroom_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.classroom_id}</p>}
                </div>

                {/* Day */}
                <div>
                  <Label>اليوم</Label>
                  <Select
                    value={String(manualForm.day_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, day_id: v ? Number(v) : "" })}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder={lookupsLoading ? "جاري التحميل..." : "اختر اليوم"} />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d.day_id} value={String(d.day_id)}>{d.day_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.day_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.day_id}</p>}
                </div>

                {/* Period */}
                <div>
                  <Label>الفترة الزمنية</Label>
                  <Select
                    value={String(manualForm.period_id)}
                    onValueChange={(v) => setManualForm({ ...manualForm, period_id: v ? Number(v) : "" })}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder={lookupsLoading ? "جاري التحميل..." : "اختر الفترة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map(p => (
                         <SelectItem key={p.period_id} value={String(p.period_id)}>
                           {`${p.start_time.slice(0,5)} - ${p.end_time.slice(0,5)}`}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {manualFormErrors.period_id && <p className="text-xs text-destructive mt-1">{manualFormErrors.period_id}</p>}
                </div>
              </div>
              
              <hr className="border-border/20" />

              {/* === DATES & PROPERTIES SECTION === */}
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
                  <Input placeholder="مثال: 2024-2025" value={manualForm.academic_year} onChange={(e) => setManualForm({ ...manualForm, academic_year: e.target.value })}/>
                  {manualFormErrors.academic_year && <p className="text-xs text-destructive mt-1">{manualFormErrors.academic_year}</p>}
                </div>
                <div>
                  <Label>ساعات المحاضرة</Label>
                  <Input type="number" step="0.25" min="0" value={String(manualForm.lecture_hours)} onChange={(e) => setManualForm({ ...manualForm, lecture_hours: e.target.value === "" ? "" : Number(e.target.value) })}/>
                  {manualFormErrors.lecture_hours && <p className="text-xs text-destructive mt-1">{manualFormErrors.lecture_hours}</p>}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleManualSubmit} disabled={manualSubmitLoading || lookupsLoading}>
                  {(manualSubmitLoading || lookupsLoading) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ البند
                </Button>
                <Button variant="outline" onClick={resetManualForm}>تفريغ النموذج</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Result banners and import log remain the same */}
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
           {/* The "View" tab content can be added here */}
        </TabsContent>
      </Tabs>

      {/* The sessions modal can be added here */}
    </div>
  );
}