import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Plus, Edit, Trash2, Loader2, Pencil, 
  Target, List, FileQuestion, 
  ArrowLeft, CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

// ==========================================
// Types Definitions
// ==========================================

type ApiDepartment = {
  department_id: number;
  department_name: string;
  department_code?: string | null;
  college_id: number;
};

type Program = {
  id: number;
  name: string;
  is_active: boolean;
};

type ApiLevel = {
  id: number;
  program_id: number;
  level_number: number;
};

type ApiSemester = {
  id: number;
  level_id: number;
  term_number: 1 | 2;
};

type ApiCourse = {
  id: number;
  semester_id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  is_elective: boolean;
  department_id?: number | null;
  notes?: string | null;
};

// --- QA Types ---
interface QA_Outcome { id: string; name: string; type: string; code: string; }
interface QA_Topic { id: string; title: string; description: string; outcomeIds: string[]; order_index?: number; }
interface QA_Option { id: string; text: string; isCorrect: boolean; }
interface QA_Question { 
  id: string; 
  text: string; 
  type: string; 
  topicId: string; 
  outcomeId?: string;
  difficulty?: number;
  options: QA_Option[];
}

// --- Validation Schemas ---
const departmentSchema = z.object({
  department_name: z.string().min(2, "الاسم مطلوب"),
  department_code: z.string().min(1, "الكود مطلوب"),
});
type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentsModuleProps {
  collegeId: string;
}

// ==========================================
// 1. بيانات ثابته (MOCK DATA)
// ==========================================
const MOCK_COURSE = {
    course_name: "برمجة تطبيقات الويب",
    course_code: "IT-305"
};

const INITIAL_OUTCOMES = [
    { id: 1, code: "LO-1", name: "أن يفهم الطالب مفاهيم الـ React الأساسية والـ Hooks.", type: "معرفي" },
    { id: 2, code: "LO-2", name: "القدرة على بناء واجهات مستخدم متجاوبة باستخدام Tailwind CSS.", type: "مهاري" },
    { id: 3, code: "LO-3", name: "تحليل المشاكل البرمجية واقتراح حلول برمجية فعالة.", type: "ذهني" },
];

const INITIAL_TOPICS = [
    { id: 101, order_index: 1, title: "مقدمة في React.js", description: "شرح الـ Components و JSX", outcomeIds: [1] },
    { id: 102, order_index: 2, title: "State Management", description: "استخدام useState و useEffect", outcomeIds: [1, 2] },
    { id: 103, order_index: 3, title: "Routing & API", description: "التعامل مع الخوادم والراوتنج", outcomeIds: [2, 3] },
];

const INITIAL_QUESTIONS = [
    { 
        id: 1001, topicId: 101, outcomeId: 1, difficulty: 1, text: "ما هو الـ JSX؟", 
        options: [
            { id: "a", text: "JavaScript XML", isCorrect: true },
            { id: "b", text: "Java Syntax Extension", isCorrect: false },
            { id: "c", text: "JSON X", isCorrect: false }
        ]
    },
    { 
        id: 1002, topicId: 102, outcomeId: 1, difficulty: 2, text: "أي من التالي هو Hook؟", 
        options: [
            { id: "a", text: "render()", isCorrect: false },
            { id: "b", text: "useEffect()", isCorrect: true },
            { id: "c", text: "class Component", isCorrect: false }
        ]
    },
];

export default function DepartmentsModule({ collegeId }: DepartmentsModuleProps) {

  const { can } = usePermission();
  const { toast } = useToast();

      // State Management
    const [isQaDialogOpen, setIsQaDialogOpen] = useState(false);
    const [qaView, setQaView] = useState("menu"); // menu, outcomes, topics, questions
    const [selectedQaTopic, setSelectedQaTopic] = useState<any>(null);

    // Data States (Initialized with Mock Data)
    const [qaOutcomes, setQaOutcomes] = useState<any[]>(INITIAL_OUTCOMES);
    const [qaTopics, setQaTopics] = useState<any[]>(INITIAL_TOPICS);
    const [qaQuestions, setQaQuestions] = useState<any[]>(INITIAL_QUESTIONS);

    // Form States
    const [qaFormOpen, setQaFormOpen] = useState(false);
    const [qaFormMode, setQaFormMode] = useState<"add" | "edit">("add");
    const [qaFormData, setQaFormData] = useState<any>({});

    // ==========================================
    // Handlers (Simulated Logic)
    // ==========================================
    const handleOpenQa = () => {
        setIsQaDialogOpen(true);
        setQaView("menu");
    };

    const handleQaDelete = (id: number, type: string) => {
        if (!confirm("هل أنت متأكد من الحذف؟ (تعديل وهمي)")) return;
        if (type === "outcome") setQaOutcomes(prev => prev.filter(i => i.id !== id));
        if (type === "topic") setQaTopics(prev => prev.filter(i => i.id !== id));
        if (type === "question") setQaQuestions(prev => prev.filter(i => i.id !== id));
    };

    const handleQaSave = () => {
        // Simple mock save logic
        const newItem = { ...qaFormData, id: qaFormData.id || Math.floor(Math.random() * 10000) };
        
        if (qaView === "outcomes") {
            if (qaFormMode === "add") setQaOutcomes([...qaOutcomes, newItem]);
            else setQaOutcomes(qaOutcomes.map(i => i.id === newItem.id ? newItem : i));
        } else if (qaView === "topics") {
            if (qaFormMode === "add") setQaTopics([...qaTopics, newItem]);
            else setQaTopics(qaTopics.map(i => i.id === newItem.id ? newItem : i));
        } else if (qaView === "questions") {
            if (qaFormMode === "add") setQaQuestions([...qaQuestions, newItem]);
            else setQaQuestions(qaQuestions.map(i => i.id === newItem.id ? newItem : i));
        }
        setQaFormOpen(false);
    };

    const handleAddOption = () => {
        const currentOptions = qaFormData.options || [];
        if (currentOptions.length >= 6) return;
        setQaFormData({
            ...qaFormData,
            options: [...currentOptions, { id: Math.random().toString(36).substr(2, 9), text: "", isCorrect: false }]
        });
    };

    const handleOptionChange = (optId: string, text: string) => {
        const updatedOptions = qaFormData.options.map((o: any) => o.id === optId ? { ...o, text } : o);
        setQaFormData({ ...qaFormData, options: updatedOptions });
    };

    const handleCorrectOptionChange = (optId: string) => {
        const updatedOptions = qaFormData.options.map((o: any) => ({ ...o, isCorrect: o.id === optId }));
        setQaFormData({ ...qaFormData, options: updatedOptions });
    };

  // ==========================================
  // 1. State Management
  // ==========================================

  // Departments
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);

  // Hierarchy Selection
  const [selectedDepartment, setSelectedDepartment] = useState<ApiDepartment | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ApiLevel | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ApiSemester | null>(null);
  
  // Programs
  const [departmentPrograms, setDepartmentPrograms] = useState<Program[]>([]);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState<{ name: string; is_active: boolean }>({ name: "", is_active: true });
  
  // Levels
  const [programLevels, setProgramLevels] = useState<ApiLevel[]>([]);
  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ApiLevel | null>(null);
  const [levelFormData, setLevelFormData] = useState({ levelNumber: 1 });
  
  // Terms (Semesters)
  const [levelTerms, setLevelTerms] = useState<ApiSemester[]>([]);
  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ApiSemester | null>(null);
  const [termFormData, setTermFormData] = useState<{ termNumber: 1 | 2 }>({ termNumber: 1 });
  
  // Courses
  const [termCourses, setTermCourses] = useState<ApiCourse[]>([]);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    courseCode: "", courseName: "", creditHours: 3, isElective: false, departmentId: "", notes: "",
  });

  // Department Form Hook
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { department_name: "", department_code: "" },
  });

  // ==========================================
  // 2. Fetchers (API Calls)
  // ==========================================

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/v1/departments", { params: { college_id: collegeId } });
      setDepartments(res.data?.data ?? res.data);
    } catch { toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" }); }
  };

  const fetchPrograms = async (departmentId: number) => {
    try {
      const res = await api.get("/v1/programs", { params: { department_id: departmentId } });
      const raw = res.data?.data ?? res.data;
      setDepartmentPrograms((raw as any[]).map((p) => ({
        id: p.id ?? p.program_id, name: p.name ?? p.program_name, is_active: Boolean(p.is_active ?? 1),
      })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل البرامج", variant: "destructive" }); }
  };
  
  const fetchLevels = async (programId: number) => {
    try {
      const res = await api.get("/v1/levels", { params: { program_id: programId } });
      const raw = res.data?.data ?? res.data;
      setProgramLevels((raw as any[]).map((l) => ({
        id: l.id ?? l.level_id, program_id: l.program_id ?? programId, level_number: l.level_number ?? l.number ?? 1,
      })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل المستويات", variant: "destructive" }); }
  };
  
  const fetchTerms = async (levelId: number) => {
    try {
      const res = await api.get("/v1/semesters", { params: { level_id: levelId } });
      const raw = res.data?.data ?? res.data;
      setLevelTerms((raw as any[]).map((t) => ({
        id: t.id ?? t.semester_id, level_id: t.level_id ?? levelId, term_number: (t.term_number ?? 1) as 1 | 2,
      })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل الفصول", variant: "destructive" }); }
  };
  
  const fetchCourses = async (semesterId: number) => {
    try {
      const res = await api.get("/v1/courses", { params: { semester_id: semesterId } });
      const raw = res.data?.data ?? res.data;
      setTermCourses((raw as any[]).map((c) => ({
        id: c.id ?? c.course_id, semester_id: c.semester_id ?? semesterId, course_code: c.course_code ?? "",
        course_name: c.course_name ?? "", credit_hours: Number(c.credit_hours ?? 0), is_elective: Boolean(c.is_elective ?? false),
        department_id: c.department_id ?? null, notes: c.notes ?? "",
      })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل المواد", variant: "destructive" }); }
  };

  // ==========================================
  // 3. Effects (Cascading Selection)
  // ==========================================
  useEffect(() => { fetchDepartments(); setSelectedDepartment(null); setSelectedProgram(null); setSelectedLevel(null); setSelectedTerm(null); }, [collegeId]);
  useEffect(() => { if (selectedDepartment) fetchPrograms(selectedDepartment.department_id); else setDepartmentPrograms([]); setSelectedProgram(null); }, [selectedDepartment]);
  useEffect(() => { if (selectedProgram) fetchLevels(selectedProgram.id); else setProgramLevels([]); setSelectedLevel(null); }, [selectedProgram]);
  useEffect(() => { if (selectedLevel) fetchTerms(selectedLevel.id); else setLevelTerms([]); setSelectedTerm(null); }, [selectedLevel]);
  useEffect(() => { if (selectedTerm) fetchCourses(selectedTerm.id); else setTermCourses([]); }, [selectedTerm]);

  // ==========================================
  // 4. Handlers: Departments
  // ==========================================

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, college_id: Number(collegeId) };
      if (editingDepartment) await api.put(`/v1/departments/${editingDepartment.department_id}`, payload);
      else await api.post("/v1/departments", payload);
      setIsDialogOpen(false); await fetchDepartments(); toast({ title: "نجاح", description: "تم الحفظ" });
    } catch (e) { toast({ title: "خطأ", description: "فشل الحفظ", variant: "destructive" }); } finally { setIsLoading(false); }
  };

  const openDialog = (dept: ApiDepartment | null = null) => {
    setEditingDepartment(dept); form.reset({ department_name: dept?.department_name || "", department_code: dept?.department_code || "" }); setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => { 
      if(!confirm("هل أنت متأكد من حذف القسم؟")) return;
      try { await api.delete(`/v1/departments/${id}`); fetchDepartments(); } catch {} 
  };

  // ==========================================
  // 5. Handlers: Hierarchy (Prog/Lvl/Term/Course)
  // ==========================================

  // Programs
  const handleAddProgram = () => { setEditingProgram(null); setProgramFormData({ name: "", is_active: true }); setIsProgramFormOpen(true); };
  const handleEditProgram = (prog: Program) => { setEditingProgram(prog); setProgramFormData({ name: prog.name, is_active: prog.is_active }); setIsProgramFormOpen(true); };
  const handleSubmitProgram = async (e: any) => { e.preventDefault(); try{ const p = {program_name: programFormData.name, is_active: programFormData.is_active?1:0, department_id: selectedDepartment!.department_id}; if(editingProgram) await api.put(`/v1/programs/${editingProgram.id}`, p); else await api.post("/v1/programs", p); setIsProgramFormOpen(false); fetchPrograms(selectedDepartment!.department_id); toast({title:"نجاح"}); } catch {toast({title:"خطأ", variant:"destructive"});} };
  const handleDeleteProgram = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/programs/${id}`); if (selectedProgram?.id === id) setSelectedProgram(null); fetchPrograms(selectedDepartment!.department_id); };

  // Levels
  const handleAddLevel = () => { setEditingLevel(null); setLevelFormData({ levelNumber: 1 }); setIsLevelFormOpen(true); };
  const handleEditLevel = (lvl: ApiLevel) => { setEditingLevel(lvl); setLevelFormData({ levelNumber: lvl.level_number }); setIsLevelFormOpen(true); };
  const handleSubmitLevel = async (e: any) => { e.preventDefault(); const p = {program_id: selectedProgram!.id, level_number: levelFormData.levelNumber}; if(editingLevel) await api.put(`/v1/levels/${editingLevel.id}`, p); else await api.post("/v1/levels", p); setIsLevelFormOpen(false); fetchLevels(selectedProgram!.id); };
  const handleDeleteLevel = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/levels/${id}`); if (selectedLevel?.id === id) setSelectedLevel(null); fetchLevels(selectedProgram!.id); };

  // Terms
  const handleAddTerm = () => { setEditingTerm(null); setTermFormData({ termNumber: 1 }); setIsTermFormOpen(true); };
  const handleEditTerm = (t: ApiSemester) => { setEditingTerm(t); setTermFormData({ termNumber: t.term_number }); setIsTermFormOpen(true); };
  const handleSubmitTerm = async (e: any) => { e.preventDefault(); const p = {level_id: selectedLevel!.id, term_number: termFormData.termNumber}; if(editingTerm) await api.put(`/v1/semesters/${editingTerm.id}`, p); else await api.post("/v1/semesters", p); setIsTermFormOpen(false); fetchTerms(selectedLevel!.id); };
  const handleDeleteTerm = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/semesters/${id}`); if (selectedTerm?.id === id) setSelectedTerm(null); fetchTerms(selectedLevel!.id); };

  // Courses
  const handleAddCourse = () => { setEditingCourse(null); setCourseFormData({ courseCode: "", courseName: "", creditHours: 3, isElective: false, departmentId: "", notes: "" }); setIsCourseFormOpen(true); };
  const handleSubmitCourse = async (e: any) => { 
    e.preventDefault(); 
    try {
        const payload = {
            course_code: courseFormData.courseCode, course_name: courseFormData.courseName, credit_hours: Number(courseFormData.creditHours),
            is_elective: courseFormData.isElective, notes: courseFormData.notes || null, semester_id: selectedTerm!.id,
            college_id: Number(collegeId), department_id: selectedDepartment!.department_id, program_id: selectedProgram!.id, level_id: selectedLevel!.id,
        };
        if(editingCourse) await api.put(`/v1/courses/${editingCourse.id}`, payload); else await api.post("/v1/courses", payload);
        setIsCourseFormOpen(false); fetchCourses(selectedTerm!.id); toast({title: "نجاح"});
    } catch { toast({title: "خطأ", variant: "destructive"}); }
  };
  const handleDeleteCourse = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/courses/${id}`); fetchCourses(selectedTerm!.id); };

  // ==========================================
  // 7. RENDER
  // ==========================================

  

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">الأقسام</h2>
        {can('study_plan.create') && (
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة قسم
          </Button>
        )}
      </div>

      {/* Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "تعديل القسم" : "إضافة قسم"}</DialogTitle>
            <DialogDescription className="sr-only">نموذج بيانات القسم</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="department_name" render={({ field }) => (<FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="department_code" render={({ field }) => (<FormItem><FormLabel>الكود</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button type="submit">{isLoading ? <Loader2 className="animate-spin" /> : "حفظ"}</Button></div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Departments List Table */}
      <Card>
        <CardContent className="pt-6">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%] text-right">القسم</TableHead>
                <TableHead className="w-[30%] text-right">الكود</TableHead>
                <TableHead className="w-[20%] text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    لا توجد أقسام
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow
                    key={dept.department_id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedDepartment?.department_id === dept.department_id && "bg-muted/70"
                    )}
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    <TableCell className="text-right">{dept.department_name}</TableCell>
                    <TableCell className="text-right font-mono">{dept.department_code}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2 justify-end sm:justify-start">
                        {can('study_plan.update') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog(dept);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {can('study_plan.delete') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(dept.department_id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Main Hierarchy Container (Programs -> Courses) */}
      {selectedDepartment && (
        <Card className="mt-6 bg-slate-50/50">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>البرامج - {selectedDepartment.department_name}</CardTitle>
              {can('study_plan.create') && (
                <Button size="sm" onClick={handleAddProgram}><Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            
            {/* Program Form */}
            {isProgramFormOpen && (
                <div className="bg-white p-4 rounded border mb-4">
                    <div className="space-y-4">
                        <Input value={programFormData.name} onChange={e => setProgramFormData({...programFormData, name: e.target.value})} placeholder="اسم البرنامج" />
                         <div className="flex items-center gap-2">
                             <Switch checked={programFormData.is_active} onCheckedChange={c => setProgramFormData({...programFormData, is_active: c})} />
                             <Label>مفعل</Label>
                         </div>
                        <div className="flex gap-2"><Button size="sm" onClick={handleSubmitProgram}>حفظ</Button><Button size="sm" variant="outline" onClick={() => setIsProgramFormOpen(false)}>إلغاء</Button></div>
                    </div>
                </div>
            )}
            
            {/* Programs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
               {departmentPrograms.map(prog => (
                   <div key={prog.id} onClick={() => setSelectedProgram(prog)} className={cn("p-4 border rounded cursor-pointer bg-white hover:border-primary", selectedProgram?.id === prog.id && "border-primary ring-1 ring-primary")}>
                       <div className="flex justify-between items-center">
                           <div>
                               <div className="font-semibold">{prog.name}</div>
                               <Badge variant={prog.is_active ? "default" : "secondary"} className="mt-1">{prog.is_active ? "مفعل" : "معطل"}</Badge>
                           </div>
                           <div className="flex gap-1">
                            {can('study_plan.update') && (
                               <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditProgram(prog)}}><Pencil className="w-4 h-4" /></Button>
                            )}
                            {can('study_plan.delete') && (
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => {e.stopPropagation(); handleDeleteProgram(prog.id)}}><Trash2 className="w-4 h-4" /></Button>
                            )}
                           </div>
                       </div>
                   </div>
               ))}
               {departmentPrograms.length === 0 && <div className="col-span-3 text-center text-muted-foreground py-4">لا توجد برامج مضافة</div>}
            </div>

            {/* Levels Section */}
            {selectedProgram && (
                <div className="animate-in fade-in slide-in-from-top-4 mb-6">
                    <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">المستويات</h3>
                    {can('study_plan.create') && (
                    <Button size="sm" variant="outline" onClick={handleAddLevel}><Plus className="w-3 h-3" /></Button>
                    )}
                    </div>
                    {isLevelFormOpen && <div className="bg-white p-3 mb-2 rounded border flex gap-2"><Input type="number" value={levelFormData.levelNumber} onChange={e => setLevelFormData({levelNumber: +e.target.value})} /><Button size="sm" onClick={handleSubmitLevel}>حفظ</Button></div>}
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {programLevels.map(lvl => (
                            <div 
                                key={lvl.id} 
                                onClick={() => setSelectedLevel(lvl)} 
                                className={cn(
                                    "min-w-[120px] p-3 text-center border rounded cursor-pointer bg-white hover:bg-muted group relative flex flex-col justify-between min-h-[90px]", // أضفت min-h لضمان تناسق الطول
                                    selectedLevel?.id === lvl.id && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                <div className="mb-1 font-semibold text-sm">مستوى {lvl.level_number}</div>
                            
                                <div className={cn(
                                    "flex justify-center gap-1 transition-opacity duration-200", 
                                    "opacity-100 md:opacity-0 md:group-hover:opacity-100", 
                                    selectedLevel?.id === lvl.id ? "text-white" : "text-muted-foreground"
                                )}>
                                  {can('study_plan.update') && (
                                    <Button 
                                        size="icon" 
                                        className="h-7 w-7 hover:bg-black/10 rounded-full" 
                                        variant="ghost" 
                                        onClick={(e)=>{e.stopPropagation(); handleEditLevel(lvl)}}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {can('study_plan.delete') && (
                                    <Button 
                                        size="icon" 
                                        className="h-7 w-7 hover:bg-red-100 hover:text-red-600 rounded-full" 
                                        variant="ghost" 
                                        onClick={(e)=>{e.stopPropagation(); handleDeleteLevel(lvl.id)}}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Terms Section */}
            {selectedLevel && (
                 <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">الفصول (الترم)</h3>
                    {can('study_plan.create') && (
                      <Button size="sm" variant="outline" onClick={handleAddTerm}><Plus className="w-3 h-3" /></Button>
                    )}
                    </div>
                    {isTermFormOpen && <div className="bg-white p-3 mb-2 rounded border flex gap-2"><Select onValueChange={v => setTermFormData({termNumber: +v as 1|2})}><SelectTrigger><SelectValue placeholder="الترم" /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent></Select><Button size="sm" onClick={handleSubmitTerm}>حفظ</Button></div>}
                    
                    <div className="flex gap-4">
                        {levelTerms.map(term => (
                            <div key={term.id} onClick={() => setSelectedTerm(term)} className={cn("flex-1 p-3 text-center border rounded cursor-pointer bg-white group hover:border-primary", selectedTerm?.id === term.id && "border-primary ring-1 ring-primary")}>
                                <div className="font-bold text-lg">الترم {term.term_number}</div>
                                <div className="flex justify-center gap-2 mt-2 opacity-50 group-hover:opacity-100">
                                  {can('study_plan.update') && (
                                     <Button size="icon" className="h-7 w-7" variant="ghost" onClick={(e)=>{e.stopPropagation(); handleEditTerm(term)}}><Pencil className="w-3 h-3" /></Button>
                                  )}
                                  {can('study_plan.delete') && (
                                     <Button size="icon" className="h-7 w-7 text-destructive" variant="ghost" onClick={(e)=>{e.stopPropagation(); handleDeleteTerm(term.id)}}><Trash2 className="w-3 h-3" /></Button>
                                  )}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {/* Courses Table */}
            {selectedTerm && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">المواد الدراسية</h3>
                    {can('study_plan.create') && (
                    <Button size="sm" onClick={handleAddCourse}><Plus className="w-4 h-4 mr-2" /> إضافة مادة</Button>
                    )}
                    </div>
                    
                    {isCourseFormOpen && (
                        <Card className="mb-4 bg-white"><CardContent className="pt-4 space-y-3">
                           <div className="grid grid-cols-2 gap-3">
                              <Input placeholder="كود المادة" value={courseFormData.courseCode} onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})} />
                              <Input placeholder="اسم المادة" value={courseFormData.courseName} onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})} />
                              <Input type="number" placeholder="الساعات" value={courseFormData.creditHours} onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})} />
                              <div className="flex items-center gap-2 border p-2 rounded"><Switch checked={courseFormData.isElective} onCheckedChange={c => setCourseFormData({...courseFormData, isElective: c})} /><Label>مادة اختيارية</Label></div>
                           </div>
                           <Button onClick={handleSubmitCourse}>حفظ المادة</Button>
                        </CardContent></Card>
                    )}

                    <Table className="bg-white rounded-md border w-full table-fixed">
                        <TableHeader>
                            <TableRow>
                                {/* تحديد نسب مئوية لضمان ثبات الهيكل */}
                                <TableHead className="w-[20%] text-right">الكود</TableHead>
                                <TableHead className="w-[40%] text-right">الاسم</TableHead>
                                <TableHead className="w-[20%] text-center">الساعات</TableHead>
                                <TableHead className="w-[20%] text-center">الجودة</TableHead>
                                <TableHead className="w-[20%] text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {termCourses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        لا توجد مواد مسجلة
                                    </TableCell>
                                </TableRow>
                            ) : (
                                termCourses.map(course => (
                                    <TableRow key={course.id}>
                                        {/* محاذاة البيانات لتطابق العناوين أعلاه */}
                                        <TableCell className="text-right font-mono">{course.course_code}</TableCell>
                                        <TableCell className="text-right font-medium">{course.course_name}</TableCell>
                                        <TableCell className="text-center">{course.credit_hours}</TableCell>
            {/* ================= Trigger Button ================= */}
            <Button 
                size="sm" 
                variant="secondary" 
                className="gap-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200" 
                onClick={handleOpenQa}
            >
                <Target className="w-4 h-4" /> ملف الجودة
            </Button>
                                        <TableCell className="text-center">
                                            <div className="flex gap-1 justify-center">
                                              {can('study_plan.update') && (
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingCourse(course); setCourseFormData({courseCode: course.course_code, courseName: course.course_name, creditHours: course.credit_hours, isElective: course.is_elective, departmentId: "", notes: course.notes||""}); setIsCourseFormOpen(true); }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                              )}
                                              {can('study_plan.delete') && (
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteCourse(course.id)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                              )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
          </CardContent>
        </Card>
      )}

                  {/* ================= Main QA Dialog ================= */}
            <Dialog open={isQaDialogOpen} onOpenChange={setIsQaDialogOpen}>
                <DialogContent className="w-[95vw] max-w-6xl h-[90vh] md:h-[95vh] flex flex-col p-0 gap-0">
                    {/* Header */}
                    <DialogHeader className="p-4 md:p-6 border-b bg-muted/20 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full shrink-0"><Target className="w-5 h-5 md:w-6 md:h-6 text-primary" /></div>
                                <div>
                                    <DialogTitle className="text-lg md:text-xl">إدارة ملف الجودة (QA)</DialogTitle>
                                    <DialogDescription className="text-muted-foreground mt-1 text-xs md:text-sm">
                                        المادة: <span className="font-bold text-foreground">{MOCK_COURSE.course_name} ({MOCK_COURSE.course_code})</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Main Layout Container */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                        {/* Sidebar Navigation */}
                        <div className="w-full md:w-64 border-b md:border-b-0 md:border-l bg-slate-50 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 flex flex-row md:flex-col shrink-0 overflow-x-auto no-scrollbar">
                            <Button variant={qaView === "menu" ? "default" : "ghost"} className="whitespace-nowrap justify-start gap-2 text-sm h-9 md:h-10 md:w-full" onClick={() => setQaView("menu")}>
                                <Target className="w-4 h-4" /> <span className="hidden sm:inline">نظرة عامة</span><span className="sm:hidden">عام</span>
                            </Button>
                            <div className="hidden md:block py-2"><div className="border-t"></div></div>
                            <Button variant={qaView === "outcomes" ? "default" : "ghost"} className="whitespace-nowrap justify-start gap-2 text-sm h-9 md:h-10 md:w-full" onClick={() => setQaView("outcomes")}>
                                <Target className="w-4 h-4" /> 1. مخرجات <span className="hidden lg:inline">التعلم (LOs)</span>
                            </Button>
                            <Button variant={qaView === "topics" ? "default" : "ghost"} className="whitespace-nowrap justify-start gap-2 text-sm h-9 md:h-10 md:w-full" onClick={() => setQaView("topics")}>
                                <List className="w-4 h-4" /> 2. مواضيع <span className="hidden lg:inline">المادة</span>
                            </Button>
                            <Button variant={qaView === "questions" ? "default" : "ghost"} className="whitespace-nowrap justify-start gap-2 text-sm h-9 md:h-10 md:w-full" onClick={() => setQaView("questions")}>
                                <FileQuestion className="w-4 h-4" /> 3. <span className="hidden lg:inline">بنك</span> الأسئلة
                            </Button>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white">
                            
                            {/* 0. Dashboard View */}
                            {qaView === "menu" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                    <Card className="bg-blue-50 border-blue-100 cursor-pointer hover:shadow-md transition" onClick={() => setQaView("outcomes")}>
                                        <CardContent className="pt-6 text-center">
                                            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{qaOutcomes.length}</div>
                                            <div className="text-blue-900 font-medium">مخرجات تعلم</div>
                                            <p className="text-xs text-blue-700 mt-2">الأهداف التعليمية للمقرر</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-amber-50 border-amber-100 cursor-pointer hover:shadow-md transition" onClick={() => setQaView("topics")}>
                                        <CardContent className="pt-6 text-center">
                                            <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">{qaTopics.length}</div>
                                            <div className="text-amber-900 font-medium">مواضيع</div>
                                            <p className="text-xs text-amber-700 mt-2">الخطة الدراسية</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-green-50 border-green-100 cursor-pointer hover:shadow-md transition" onClick={() => setQaView("questions")}>
                                        <CardContent className="pt-6 text-center">
                                            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{qaQuestions.length}</div>
                                            <div className="text-green-900 font-medium">أسئلة</div>
                                            <p className="text-xs text-green-700 mt-2">بنك الأسئلة</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* 1. Outcomes View */}
                            {qaView === "outcomes" && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-3 rounded border gap-3">
                                        <div><h3 className="text-base md:text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5" /> مخرجات التعلم</h3></div>
                                        <Button size="sm" onClick={() => { setQaFormMode("add"); setQaFormData({ domain: "Cognitive" }); setQaFormOpen(true); }} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> إضافة مخرج</Button>
                                    </div>
                                    <div className="grid gap-3">
                                        {qaOutcomes.map(lo => (
                                            <div key={lo.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 md:p-4 border rounded hover:bg-slate-50 transition-colors gap-3">
                                                <div className="flex gap-3 items-start w-full sm:w-auto">
                                                    <div className="bg-primary/10 text-primary font-bold px-2 md:px-3 py-1 rounded text-xs md:text-sm min-w-[50px] md:min-w-[60px] text-center shrink-0">{lo.code}</div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm md:text-lg leading-tight break-words">{lo.name}</p>
                                                        <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs font-normal">المجال: {lo.type || "غير محدد"}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setQaFormMode("edit"); setQaFormData(lo); setQaFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleQaDelete(lo.id, "outcome")}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Topics View */}
                            {qaView === "topics" && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-3 rounded border gap-3">
                                        <div><h3 className="text-base md:text-lg font-bold flex items-center gap-2"><List className="w-5 h-5" /> مواضيع المادة</h3></div>
                                        <Button size="sm" onClick={() => { setQaFormMode("add"); setQaFormData({ order_index: qaTopics.length + 1, outcomeIds: [] }); setQaFormOpen(true); }} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> إضافة موضوع</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {qaTopics.sort((a,b) => (a.order_index || 0) - (b.order_index || 0)).map((topic) => (
                                            <div key={topic.id} className="p-3 md:p-4 border rounded hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                    <div className="flex gap-3 w-full">
                                                        <div className="flex flex-col items-center justify-center bg-muted w-8 h-8 md:w-10 md:h-10 rounded text-muted-foreground font-bold shrink-0">
                                                            <span className="text-[9px] md:text-[10px]">#</span>{topic.order_index || "?"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-base md:text-lg break-words">{topic.title}</h4>
                                                            <p className="text-xs md:text-sm text-muted-foreground break-words">{topic.description || "لا يوجد وصف"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start shrink-0">
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setQaFormMode("edit"); setQaFormData(topic); setQaFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleQaDelete(topic.id, "topic")}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-dashed flex items-center flex-wrap gap-2">
                                                    <span className="text-xs font-semibold text-muted-foreground ml-2">يحقق الأهداف:</span>
                                                    {topic.outcomeIds && topic.outcomeIds.length > 0 ? (
                                                        topic.outcomeIds.map((id: any) => {
                                                            const lo = qaOutcomes.find(o => o.id === id);
                                                            return <Badge key={id} variant="outline" className="bg-white hover:bg-white text-[10px] md:text-xs">{lo ? `${lo.code}` : id}</Badge>;
                                                        })
                                                    ) : (<span className="text-[10px] md:text-xs text-destructive">غير مرتبط بأهداف!</span>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Questions View */}
                            {qaView === "questions" && (
                                <div className="space-y-4">
                                    {!selectedQaTopic ? (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded text-blue-800 text-xs md:text-sm mb-4">اختر الموضوع أدناه لعرض أو إضافة الأسئلة المرتبطة به.</div>
                                            <h3 className="text-base md:text-lg font-bold">المواضيع المتاحة</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                                {qaTopics.map(topic => (
                                                    <div key={topic.id} onClick={() => setSelectedQaTopic(topic)} className="p-3 md:p-4 border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition flex justify-between items-center group">
                                                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                                            <List className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-blue-600 shrink-0" />
                                                            <span className="font-bold text-sm md:text-base truncate">{topic.title}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="shrink-0">{qaQuestions.filter(q => q.topicId === topic.id).length} سؤال</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-3 rounded border gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedQaTopic(null)} className="shrink-0"><ArrowLeft className="w-4 h-4 ml-1" /> رجوع</Button>
                                                    <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                                                    <div className="overflow-hidden">
                                                        <h3 className="font-bold text-sm md:text-base truncate">بنك الأسئلة</h3>
                                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">الموضوع: {selectedQaTopic.title}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => { setQaFormMode("add"); setQaFormData({ topicId: selectedQaTopic.id, difficulty: 1, options: [] }); setQaFormOpen(true); }} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> إضافة سؤال</Button>
                                            </div>
                                            <div className="grid gap-4">
                                                {qaQuestions.filter(q => q.topicId === selectedQaTopic.id).map((q) => (
                                                    <div key={q.id} className="border rounded-lg p-3 md:p-4 bg-white shadow-sm">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                                            <div className="w-full">
                                                                <div className="flex gap-2 items-center mb-1 flex-wrap">
                                                                    <Badge variant={q.difficulty === 1 ? "outline" : q.difficulty === 2 ? "secondary" : "destructive"} className="text-[10px] md:text-xs">
                                                                        {q.difficulty === 1 ? "سهل" : q.difficulty === 2 ? "متوسط" : "صعب"}
                                                                    </Badge>
                                                                    {q.outcomeId && <Badge variant="outline" className="text-[10px] md:text-xs text-blue-700 border-blue-200 bg-blue-50">Target: {qaOutcomes.find(o => o.id === q.outcomeId)?.code || "LO-?"}</Badge>}
                                                                </div>
                                                                <p className="font-bold text-sm md:text-lg break-words">{q.text}</p>
                                                            </div>
                                                            <div className="flex gap-1 self-end sm:self-start shrink-0">
                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setQaFormMode("edit"); setQaFormData(q); setQaFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleQaDelete(q.id, "question")}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2 md:p-3 rounded">
                                                            {q.options?.map((opt: any, idx: number) => (
                                                                <div key={idx} className={cn("text-xs md:text-sm p-2 rounded border flex items-center gap-2", opt.isCorrect ? "bg-green-100 border-green-300 text-green-800 font-medium shadow-sm" : "bg-white border-slate-200")}>
                                                                    {opt.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>}
                                                                    <span className="break-words">{opt.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ================= Forms Dialog ================= */}
            <Dialog open={qaFormOpen} onOpenChange={setQaFormOpen}>
                <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] md:max-h-[95vh] p-0 gap-0 flex flex-col overflow-hidden rounded-xl">
                    <DialogHeader className="p-4 border-b bg-slate-50/50 shrink-0">
                        <DialogTitle className="text-base md:text-lg font-bold flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded">{qaFormMode === "add" ? <Plus className="w-4 h-4 md:w-5 md:h-5 text-primary" /> : <Edit className="w-4 h-4 md:w-5 md:h-5 text-primary" />}</div>
                            {qaFormMode === "add" ? "إضافة عنصر جديد" : "تعديل العنصر"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">نموذج</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {qaView === "outcomes" && (
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <Label className="text-sm font-semibold sm:w-24 sm:text-right shrink-0">الرمز (Code)</Label>
                                    <Input className="flex-1" placeholder="مثال: LO-1" value={qaFormData.code || ""} onChange={e => setQaFormData({...qaFormData, code: e.target.value})} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <Label className="text-sm font-semibold sm:w-24 sm:text-right shrink-0">المجال</Label>
                                    <Input className="flex-1" placeholder="مثال: معرفي" value={qaFormData.type || ""} onChange={v => setQaFormData({...qaFormData, type: v.target.value})} />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                    <Label className="text-sm font-semibold sm:w-24 sm:text-right shrink-0 sm:mt-2">الوصف</Label>
                                    <Textarea className="flex-1 min-h-[100px] resize-none" rows={3} placeholder="الوصف..." value={qaFormData.name || ""} onChange={e => setQaFormData({...qaFormData, name: e.target.value})} />
                                </div>
                            </div>
                        )}
                        {qaView === "topics" && (
                             <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                     <div className="flex-1 space-y-2">
                                        <Label className="text-sm font-semibold">عنوان الموضوع</Label>
                                        <Input placeholder="أدخل العنوان" value={qaFormData.title || ""} onChange={e => setQaFormData({...qaFormData, title: e.target.value})} />
                                     </div>
                                     <div className="w-full sm:w-28 space-y-2">
                                        <Label className="text-sm font-semibold">الترتيب</Label>
                                        <Input type="number" value={qaFormData.order_index || ""} onChange={e => setQaFormData({...qaFormData, order_index: +e.target.value})} />
                                     </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">الوصف</Label>
                                    <Textarea className="min-h-[80px]" rows={2} placeholder="الوصف..." value={qaFormData.description || ""} onChange={e => setQaFormData({...qaFormData, description: e.target.value})} />
                                </div>
                                <div className="space-y-3 pt-2">
                                    <Label className="block text-sm font-bold text-primary">مخرجات التعلم:</Label>
                                    <div className="border rounded-lg bg-slate-50 p-2 md:p-3 max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 gap-2">
                                            {qaOutcomes.map(lo => (
                                                <div key={lo.id} className="flex items-start gap-3 bg-white p-2.5 rounded border shadow-sm">
                                                    <Switch id={`lo-${lo.id}`} className="mt-0.5 shrink-0" checked={(qaFormData.outcomeIds || []).includes(lo.id)} onCheckedChange={(checked) => {
                                                        const current = qaFormData.outcomeIds || [];
                                                        if(checked) setQaFormData({...qaFormData, outcomeIds: [...current, lo.id]});
                                                        else setQaFormData({...qaFormData, outcomeIds: current.filter((id:any) => id !== lo.id)});
                                                    }} />
                                                    <Label htmlFor={`lo-${lo.id}`} className="text-xs md:text-sm cursor-pointer flex-1"><span className="font-bold text-primary ml-1">{lo.code}</span> {lo.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                        {qaView === "questions" && (
                            <div className="space-y-6">
                                {(() => {
                                    const currentTopic = qaTopics.find(t => t.id === qaFormData.topicId);
                                    const allowedOutcomes = qaOutcomes.filter(lo => currentTopic?.outcomeIds?.includes(lo.id));
                                    return (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold">نص السؤال</Label>
                                                <Textarea className="min-h-[100px] text-base" placeholder="السؤال..." value={qaFormData.text || ""} onChange={e => setQaFormData({...qaFormData, text: e.target.value})} />
                                                <p className="text-xs text-muted-foreground">الموضوع: {currentTopic?.title}</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase">الهدف (LO)</Label>
                                                    <Select value={qaFormData.outcomeId ? String(qaFormData.outcomeId) : ""} onValueChange={v => setQaFormData({...qaFormData, outcomeId: +v})}>
                                                        <SelectTrigger><SelectValue placeholder="-- اختر --" /></SelectTrigger>
                                                        <SelectContent>{allowedOutcomes.map(lo => <SelectItem key={lo.id} value={String(lo.id)}>{lo.code}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase">الصعوبة</Label>
                                                    <Select value={String(qaFormData.difficulty || 1)} onValueChange={v => setQaFormData({...qaFormData, difficulty: +v})}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="1">سهل</SelectItem><SelectItem value="2">متوسط</SelectItem><SelectItem value="3">صعب</SelectItem></SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center pb-2 border-b">
                                        <Label className="text-sm font-bold">الخيارات</Label>
                                        <Button size="sm" variant="outline" type="button" onClick={handleAddOption} disabled={(qaFormData.options?.length || 0) >= 6} className="h-8 text-xs"><Plus className="w-3 h-3 mr-1" /> إضافة</Button>
                                    </div>
                                    <RadioGroup value={qaFormData.options?.find((o:any) => o.isCorrect)?.id} className="space-y-3">
                                        {qaFormData.options?.map((opt: any, idx: number) => (
                                            <div key={opt.id} className={cn("flex items-center gap-3 p-2 rounded-lg border", opt.isCorrect ? "bg-green-50 border-green-300" : "bg-white")}>
                                                <div className="flex items-center justify-center h-10 w-10 cursor-pointer" onClick={() => handleCorrectOptionChange(opt.id)}>
                                                  <RadioGroupItem value={opt.id} id={opt.id} className={cn("w-5 h-5 border-2", opt.isCorrect ? "border-green-600 text-green-600" : "border-slate-400")} />
                                                </div>
                                                <Input placeholder={`خيار ${idx + 1}`} value={opt.text} onChange={e => handleOptionChange(opt.id, e.target.value)} className={cn("h-9 border-0 bg-transparent px-0", opt.isCorrect ? "text-green-900" : "text-slate-900")} />
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-4 border-t bg-slate-50/50 flex flex-row gap-3 sm:justify-end shrink-0">
                        <Button variant="outline" onClick={() => setQaFormOpen(false)} className="flex-1 sm:flex-none">إلغاء</Button>
                        <Button onClick={handleQaSave} className="flex-1 sm:flex-none">{qaFormMode === "add" ? "حفظ" : "حفظ التغييرات"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    </div>
  );
}