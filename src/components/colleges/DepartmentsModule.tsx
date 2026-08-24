import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, Edit, Trash2, Loader2, Target, Layers, LayoutGrid, 
  Clock, AlertCircle, X, ChevronRight, BookOpen, GraduationCap, Calendar, Box, Edit2, Save, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import CourseQualityDialog from "./CourseQualityDialog";

// ==========================================
// Types
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
  academic_system: "semester" | "credit";
  block_based: boolean;
  total_hours?: number;
};

type ApiLevel = { 
  id: number; 
  program_id: number; 
  level_number: number; 
};

type ApiSemester = { 
  id: number; 
  semester_name: string;
  level_id: number; 
  term_number: number; 
};

type CoursePart = {
  name: "نظري" | "عملي" | "تمارين" | "سريري";
  actual_hours: number;
  rate: number; 
};

type ApiCourse = { 
  id: number; 
  course_code: string; 
  course_name: string; 
  credit_hours: number;
  
  course_parts: CoursePart[];
  
  weight: number;
  category: "متطلب جامعة" | "متطلب كلية" | "متطلب تخصص إجباري" | "متطلب تخصص اختياري";
  teaching_language: "العربية" | "الإنجليزية" | "ثنائي اللغة";
  notes?: string | null;
  
  college_id: number;
  department_id: number;
  program_id: number;
  level_id?: number | null;
  semester_id?: number | null;
  block_id?: number | null;
  
  prerequisites?: ApiCourse[];
  corequisites?: ApiCourse[];

    college?: {
    id: number;
    name: string;
  };
  
  department?: {
    id: number;
    name: string;
  };
  
  program?: {
    id: number;
    name: string;
    academic_system?: string;
  };
};

type Block = {
  id: number;
  program_id?: number;
  level_id?: number;
  block_name: string;
  block_number: number;
  weeks: number;
  weight: number;
  credit_hours: number;
  type: 'compulsory' | 'elective';
  description?: string;
};

type ProgramOutcome = {
  plo_id: number;
  code: string;
  description: string;
  domain: "Knowledge" | "Intellectual" | "Professional" | "General";
  weight: number;
  order: number;
  is_active: boolean;
  program_id: number;
};

type ProgramOption = {
  id: number;
  program_id?: number | null;
  name: string;
  description?: string | null;
  category: string;
  order: number;
  is_active: boolean;
};

type ProgramOptionAudit = {
  id: number;
  option_type: "teaching_strategy" | "assessment_method";
  option_id?: number;
  action: "created" | "updated" | "deleted";
  details?: { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null };
  changed_by?: number | null;
  changed_at: string;
};

const departmentSchema = z.object({ 
  department_name: z.string().min(2, "الاسم مطلوب"), 
  department_code: z.string().min(1, "الكود مطلوب") 
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

// ==========================================
// Main Component
// ==========================================

export default function DepartmentsModule({ collegeId }: { collegeId: string }) {
  const { can } = usePermission();
  const { toast } = useToast();

  const handleNumberInputFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "number" && target.value === "0") {
      target.select();
    }
  };

  const handleNumberInputWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "number") {
      target.blur();
    }
  };

  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<ApiDepartment | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ApiLevel | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ApiSemester | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  
  const [departmentPrograms, setDepartmentPrograms] = useState<Program[]>([]);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState<{ 
    name: string; 
    is_active: boolean; 
    academic_system: "semester" | "credit";
    block_based: boolean;
    total_hours?: number | string;
  }>({ 
    name: "", 
    is_active: true, 
    academic_system: "semester",
    block_based: false,
    total_hours: ""
  });
  
  const [programLevels, setProgramLevels] = useState<ApiLevel[]>([]);
  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ApiLevel | null>(null);
  const [levelFormData, setLevelFormData] = useState({ levelNumber: 1 });
  const [levelError, setLevelError] = useState<string>("");
  
  const [levelTerms, setLevelTerms] = useState<ApiSemester[]>([]);
  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ApiSemester | null>(null);
  const [termFormData, setTermFormData] = useState<{ 
    semesterName: string; 
    termNumber: number 
  }>({ 
    semesterName: "", 
    termNumber: 1 
  });
  
  const [programBlocks, setProgramBlocks] = useState<Block[]>([]);
  const [levelBlocks, setLevelBlocks] = useState<Block[]>([]);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [blockFormData, setBlockFormData] = useState({
    blockName: "",
    blockNumber: 1,
    weeks: 6,
    weight: 0,
    credit_hours: 0,
    type: "compulsory",
    description: "",
  });

  const [selectedPrerequisites, setSelectedPrerequisites] = useState<number[]>([]);
  const [selectedCorequisites, setSelectedCorequisites] = useState<number[]>([]);
  const [isPrereqModalOpen, setIsPrereqModalOpen] = useState(false);
  const [isCoreqModalOpen, setIsCoreqModalOpen] = useState(false);

  const [availableCoursesForPrereq, setAvailableCoursesForPrereq] = useState<ApiCourse[]>([]);
  const [isPrereqSelectOpen, setIsPrereqSelectOpen] = useState(false);
  const [isCoreqSelectOpen, setIsCoreqSelectOpen] = useState(false);
  const [termCourses, setTermCourses] = useState<ApiCourse[]>([]);
  const [blockCourses, setBlockCourses] = useState<ApiCourse[]>([]);
  const [categoryCourses, setCategoryCourses] = useState<ApiCourse[]>([]);
  const [courseWeightSummary, setCourseWeightSummary] = useState({
    programWeight: 0,
    usedCourseWeight: 0,
    remainingWeight: 0,
  });
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null);
  const [activeCourseCategory, setActiveCourseCategory] = useState<string | null>(null);
  const [highlightedCourseId, setHighlightedCourseId] = useState<number | null>(null);
  const [courseFormData, setCourseFormData] = useState<{
    courseCode: string;
    courseName: string;
    creditHours: number;
    courseParts: CoursePart[];
    
    // ✅ معلومات إضافية
    weight: number;
    category: "متطلب جامعة" | "متطلب كلية" | "متطلب تخصص إجباري" | "متطلب تخصص اختياري";
    teachingLanguage: "العربية" | "الإنجليزية" | "ثنائي اللغة";
    notes: string;
    
    // ✅ المتطلبات (IDs فقط)
    prerequisiteIds: number[];
    corequisiteIds: number[];
  }>({ 
    courseCode: "", 
    courseName: "", 
    creditHours: 0, // ✅ سيُحسب تلقائياً
    courseParts: [
      { 
        name: "نظري", 
        actual_hours: 2, 
        rate: 1.0 
      }
    ],
    weight: 0,
    category: "متطلب تخصص إجباري",
    teachingLanguage: "العربية",
    notes: "",
    prerequisiteIds: [],
    corequisiteIds: []
  });

  const [isProgramOutcomesDialogOpen, setIsProgramOutcomesDialogOpen] = useState(false);
  const [activeProgramForOutcomes, setActiveProgramForOutcomes] = useState<Program | null>(null);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [isProgramOutcomeFormOpen, setIsProgramOutcomeFormOpen] = useState(false);
  const [programOutcomeFormMode, setProgramOutcomeFormMode] = useState<"add" | "edit">("add");
  const [programOutcomeFormData, setProgramOutcomeFormData] = useState<Partial<ProgramOutcome>>({
    code: "",
    domain: "Knowledge",
    description: "",
    weight: 0,
    order: 0,
    is_active: true
  });

  const [isProgramOptionsDialogOpen, setIsProgramOptionsDialogOpen] = useState(false);
  const [activeProgramForOptions, setActiveProgramForOptions] = useState<Program | null>(null);
  const [programOptionTab, setProgramOptionTab] = useState<"teaching" | "assessment">("teaching");
  const [teachingProgramOptions, setTeachingProgramOptions] = useState<ProgramOption[]>([]);
  const [assessmentProgramOptions, setAssessmentProgramOptions] = useState<ProgramOption[]>([]);
  const [programOptionAudits, setProgramOptionAudits] = useState<ProgramOptionAudit[]>([]);
  const [isProgramOptionFormOpen, setIsProgramOptionFormOpen] = useState(false);
  const [editingProgramOption, setEditingProgramOption] = useState<ProgramOption | null>(null);
  const [programOptionFormData, setProgramOptionFormData] = useState({ name: "", description: "", category: "other", order: 0, is_active: true });

  const [qualityDialogCourse, setQualityDialogCourse] = useState<any>(null);

  const form = useForm<DepartmentFormData>({ 
    resolver: zodResolver(departmentSchema), 
    defaultValues: { department_name: "", department_code: "" } 
  });

  // ==========================================
  // Fetch Functions
  // ==========================================

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
      setDepartmentPrograms((raw as any[]).map((p) => ({ 
        id: p.id ?? p.program_id, 
        name: p.name ?? p.program_name, 
        is_active: Boolean(p.is_active ?? 1),
        academic_system: p.academic_system,
        block_based: Boolean(p.block_based ?? false),
        total_hours: p.total_hours
      }))); 
    } catch { 
      toast({ title: "خطأ", description: "فشل تحميل البرامج", variant: "destructive" }); 
    } 
  };

  const fetchLevels = async (programId: number) => { 
    try { 
      const res = await api.get("/v1/levels", { params: { program_id: programId } }); 
      const raw = res.data?.data ?? res.data; 
      setProgramLevels((raw as any[]).map((l) => ({ 
        id: l.id ?? l.level_id, 
        program_id: l.program_id ?? programId, 
        level_number: l.level_number ?? l.number ?? 1 
      }))); 
    } catch { 
      toast({ title: "خطأ", description: "فشل تحميل المستويات", variant: "destructive" }); 
    } 
  };

  const fetchTerms = async (levelId: number) => { 
    try { 
      const res = await api.get("/v1/semesters", { params: { level_id: levelId } }); 
      const raw = res.data?.data ?? res.data; 
      setLevelTerms((raw as any[]).map((t) => ({ 
        id: t.id ?? t.semester_id, 
        semester_name: t.semester_name || `الفصل ${t.term_number}`,
        level_id: t.level_id ?? levelId, 
        term_number: t.term_number ?? 1 
      }))); 
    } catch { 
      toast({ title: "خطأ", description: "فشل تحميل الفصول", variant: "destructive" }); 
    } 
  };

  const fetchBlocks = async (programId?: number, levelId?: number) => {
    try {
      const params: any = {};
      if (programId) params.program_id = programId;
      if (levelId) params.level_id = levelId;

      const res = await api.get("/v1/blocks", { params });
      const raw = res.data?.data ?? res.data;
      const blocks: Block[] = (raw as any[]).map((b) => ({
        id: b.id,
        program_id: b.program_id,
        level_id: b.level_id,
        block_name: b.block_name || b.name,
        block_number: b.block_number || b.number,
        weeks: b.weeks || 0,
        weight: b.weight || 0,
        credit_hours: b.credit_hours || 0,
        type: b.type || 'compulsory',
        description: b.description || ""
      }));

      if (levelId) {
        setLevelBlocks(blocks);
      } else {
        setProgramBlocks(blocks);
      }
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل البلوكات", variant: "destructive" });
    }
  };

  const fetchCourses = async (semesterId?: number, blockId?: number, programId?: number) => { 
    try {
      let params: any = {};
      if (semesterId) params.semester_id = semesterId;
      if (blockId) params.block_id = blockId;
      if (programId) params.program_id = programId;

      
  
     const res = await api.get("/v1/courses", { 
      params: {
        ...params,
        // ✅ أضف هذا - جلب العلاقات
        include: "college,department,program,prerequisites,corequisites"
      }
    });
      const raw = res.data?.data ?? res.data;
      const courses: ApiCourse[] = (raw as any[]).map((c) => ({
        id: c.id ?? c.course_id,
        course_code: c.course_code ?? "",
        course_name: c.course_name ?? "",
        credit_hours: Number(c.credit_hours ?? 0),
        
        college_id: c.college_id ?? Number(collegeId),
        department_id: c.department_id ?? selectedDepartment?.department_id ?? 0,
        program_id: c.program_id ?? selectedProgram?.id ?? 0,
        
        level_id: c.level_id ?? null,
        semester_id: c.semester_id ?? null,
        block_id: c.block_id ?? null,
        
        course_parts: Array.isArray(c.course_parts) 
          ? c.course_parts 
          : (c.course_parts ? JSON.parse(c.course_parts) : [
              { name: "نظري" as const, actual_hours: 2, rate: 1.0 }
            ]),
        
        weight: Number(c.weight) || 0,
        category: c.category || "متطلب تخصص إجباري",
        teaching_language: c.teaching_language || "العربية",
        notes: c.notes ?? null,
        
        prerequisites: c.prerequisites || [],
        corequisites: c.corequisites || [],

          college: c.college ? {
            id: c.college.id,
            name: c.college.name || c.college.college_name
          } : undefined,
          
          department: c.department ? {
            id: c.department.id,
            name: c.department.name || c.department.department_name
          } : undefined,
          
          program: c.program ? {
            id: c.program.id,
            name: c.program.name || c.program.program_name,
            academic_system: c.program.academic_system
          } : undefined
      }));

      if (semesterId) {
        setTermCourses(courses);
      } else if (blockId) {
        setBlockCourses(courses);
      } else if (programId) {
        setCategoryCourses(courses);
      }
    } catch (error) {
      console.error("خطأ في جلب المقررات:", error);
      toast({ 
        title: "خطأ", 
        description: "فشل تحميل المقررات", 
        variant: "destructive" 
      });
    }
  };

  /**
   * جلب المقررات المتاحة لاختيارها كمتطلبات
   * (من نفس البرنامج، باستثناء المقرر الحالي)
   */
  const fetchAvailableCoursesForPrereq = async () => {
    if (!selectedProgram) return;
    
    try {
      const res = await api.get("/v1/courses", { 
        params: { 
          program_id: selectedProgram.id,
          active_only: true
        } 
      });
      
      const courses = (res.data?.data ?? res.data).map((c: any) => ({
        id: c.id ?? c.course_id,
        course_code: c.course_code,
        course_name: c.course_name,
        credit_hours: c.credit_hours,
        category: c.category
      }));
      
      // ✅ استثناء المقرر الحالي عند التعديل
      const filtered = editingCourse 
        ? courses.filter((c: ApiCourse) => c.id !== editingCourse.id)
        : courses;
      
      setAvailableCoursesForPrereq(filtered);
    } catch (error) {
      console.error("فشل جلب المقررات:", error);
    }
  };

  const fetchProgramOutcomes = async (programId: number) => {
    try {
      const res = await api.get(`/v1/program-learning-outcomes/${programId}`);
      setProgramOutcomes(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching outcomes:", error);
      setProgramOutcomes([]);
      toast({ 
        title: "خطأ", 
        description: "فشل في تحميل المخرجات", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => { 
    fetchDepartments(); 
    setSelectedDepartment(null); 
    setSelectedProgram(null); 
    setSelectedLevel(null); 
    setSelectedTerm(null); 
  }, [collegeId]);

  useEffect(() => { 
    if (selectedDepartment) {
      fetchPrograms(selectedDepartment.department_id);
    } else {
      setDepartmentPrograms([]);
    }
    setSelectedProgram(null); 
  }, [selectedDepartment]);

  useEffect(() => { 
    if (selectedProgram) {
      if (selectedProgram.academic_system === 'semester' && !selectedProgram.block_based) {
        // نظام الفصول: جلب المستويات
        fetchLevels(selectedProgram.id);
      } else if (selectedProgram.academic_system === 'semester' && selectedProgram.block_based) {
        // نظام الفصول + بلوكات: جلب المستويات
        fetchLevels(selectedProgram.id);
      } else if (selectedProgram.academic_system === 'credit' && !selectedProgram.block_based) {
        fetchCourses(undefined, undefined, selectedProgram.id);
      } else if (selectedProgram.academic_system === 'credit' && selectedProgram.block_based) {
        // ✅ نظام الساعات + بلوكات: جلب بلوكات البرنامج مباشرة
        fetchBlocks(selectedProgram.id, undefined);
      }
    } else {
      setProgramLevels([]);
      setProgramBlocks([]);
    }
    setSelectedLevel(null); 
  }, [selectedProgram]);

  useEffect(() => { 
    if (selectedLevel && selectedProgram) {
      if (selectedProgram.block_based) {
        fetchBlocks(undefined, selectedLevel.id);
      } else {
        fetchTerms(selectedLevel.id);
      }
    } else {
      setLevelTerms([]);
      setLevelBlocks([]);
    }
    setSelectedTerm(null);
    setSelectedBlock(null);
  }, [selectedLevel]);

  useEffect(() => { 
    if (selectedTerm) {
      fetchCourses(selectedTerm.id);
    } else {
      setTermCourses([]);
    }
  }, [selectedTerm]);

  useEffect(() => {
    if (selectedBlock) {
      fetchCourses(undefined, selectedBlock.id);
    } else {
      setBlockCourses([]);
    }
  }, [selectedBlock]);

  useEffect(() => {
    if (highlightedCourseId !== null) {
      const timer = setTimeout(() => {
        setHighlightedCourseId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedCourseId]);

  // ==========================================
  // Department Handlers
  // ==========================================

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => { 
    setIsLoading(true); 
    try { 
      const payload = { ...data, college_id: Number(collegeId) }; 
      if (editingDepartment) {
        await api.put(`/v1/departments/${editingDepartment.department_id}`, payload);
      } else {
        await api.post("/v1/departments", payload);
      }
      setIsDialogOpen(false); 
      await fetchDepartments(); 
      toast({ title: "نجاح", description: "تم الحفظ بنجاح" }); 
    } catch { 
      toast({ title: "خطأ", description: "فشل الحفظ", variant: "destructive" }); 
    } finally { 
      setIsLoading(false); 
    } 
  };

  const openDialog = (dept: ApiDepartment | null = null) => { 
    setEditingDepartment(dept); 
    form.reset({ 
      department_name: dept?.department_name || "", 
      department_code: dept?.department_code || "" 
    }); 
    setIsDialogOpen(true); 
  };

  const handleDeleteDepartment = async (id: number) => { 
    if(!confirm("هل أنت متأكد من حذف القسم؟")) return; 
    try { 
      await api.delete(`/v1/departments/${id}`); 
      fetchDepartments(); 
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    } 
  };

  // ==========================================
  // Program Handlers
  // ==========================================

  const handleAddProgram = () => { 
    setEditingProgram(null); 
    setProgramFormData({ 
      name: "", 
      is_active: true, 
      academic_system: "semester",
      block_based: false,
      total_hours: ""
    }); 
    setIsProgramFormOpen(true); 
  };

  const handleEditProgram = (prog: Program) => { 
    setEditingProgram(prog); 
    setProgramFormData({ 
      name: prog.name, 
      is_active: prog.is_active, 
      academic_system: prog.academic_system,
      block_based: prog.block_based,
      total_hours: prog.total_hours || ""
    }); 
    setIsProgramFormOpen(true); 
  };

  const handleSubmitProgram = async (e: any) => { 
    e.preventDefault(); 
    try { 
      const payload = {
        program_name: programFormData.name, 
        is_active: programFormData.is_active ? 1 : 0, 
        academic_system: programFormData.academic_system,
        block_based: programFormData.block_based ? 1 : 0,
        total_hours: programFormData.total_hours,
        department_id: selectedDepartment!.department_id
      }; 
      
      if(editingProgram) {
        await api.put(`/v1/programs/${editingProgram.id}`, payload);
      } else {
        await api.post("/v1/programs", payload);
      }
      
      setIsProgramFormOpen(false); 
      fetchPrograms(selectedDepartment!.department_id); 
      toast({ title: "نجاح", description: "تم حفظ البرنامج" }); 
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ البرنامج", variant: "destructive" });
    } 
  };

  const handleDeleteProgram = async (id: number) => { 
    if(!confirm("هل أنت متأكد من حذف البرنامج؟")) return; 
    try {
      await api.delete(`/v1/programs/${id}`); 
      if (selectedProgram?.id === id) setSelectedProgram(null); 
      fetchPrograms(selectedDepartment!.department_id);
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  const handleOpenProgramOutcomes = async (program: Program) => {
    setActiveProgramForOutcomes(program);
    setIsProgramOutcomesDialogOpen(true);
    await fetchProgramOutcomes(program.id);
  };

  const fetchProgramOptions = async (programId: number) => {
    const [strategiesRes, methodsRes, auditsRes] = await Promise.all([
      api.get("/v1/teaching-strategies", { params: { program_id: programId } }),
      api.get("/v1/assessment-methods", { params: { program_id: programId } }),
      api.get("/v1/program-option-audits", { params: { program_id: programId } }),
    ]);
    const normalize = (value: any): ProgramOption[] => (value?.data ?? value ?? []).map((item: any) => ({
      id: Number(item.id),
      program_id: item.program_id ? Number(item.program_id) : null,
      name: String(item.name ?? ""),
      description: item.description ?? "",
      category: String(item.category ?? "other"),
      order: Number(item.order ?? 0),
      is_active: Boolean(item.is_active ?? true),
    }));
    setTeachingProgramOptions(normalize(strategiesRes.data?.data ?? strategiesRes.data?.strategies));
    setAssessmentProgramOptions(normalize(methodsRes.data?.data ?? methodsRes.data?.methods));
    setProgramOptionAudits(auditsRes.data?.data ?? []);
  };

  const handleOpenProgramOptions = async (program: Program) => {
    setActiveProgramForOptions(program);
    setIsProgramOptionsDialogOpen(true);
    try {
      await fetchProgramOptions(program.id);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل استراتيجيات التدريس وطرق التقييم", variant: "destructive" });
    }
  };

  const openProgramOptionForm = (option: ProgramOption | null = null) => {
    setEditingProgramOption(option);
    setProgramOptionFormData(option
      ? { name: option.name, description: option.description ?? "", category: option.category, order: option.order, is_active: option.is_active }
      : { name: "", description: "", category: "other", order: 0, is_active: true });
    setIsProgramOptionFormOpen(true);
  };

  const handleSaveProgramOption = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeProgramForOptions || !programOptionFormData.name.trim()) {
      toast({ title: "تنبيه", description: "اسم العنصر مطلوب", variant: "destructive" });
      return;
    }
    const isTeaching = programOptionTab === "teaching";
    const endpoint = isTeaching ? "/v1/teaching-strategies" : "/v1/assessment-methods";
    const payload = { ...programOptionFormData, name: programOptionFormData.name.trim(), program_id: activeProgramForOptions.id };
    try {
      if (editingProgramOption) await api.put(`${endpoint}/${editingProgramOption.id}`, payload);
      else await api.post(endpoint, payload);
      await fetchProgramOptions(activeProgramForOptions.id);
      setIsProgramOptionFormOpen(false);
      toast({ title: "نجاح", description: "تم حفظ البيانات وتسجيل التغيير" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.response?.data?.message || "فشل حفظ البيانات", variant: "destructive" });
    }
  };

  const handleDeleteProgramOption = async (option: ProgramOption) => {
    if (!activeProgramForOptions || !confirm(`هل أنت متأكد من حذف ${option.name}؟`)) return;
    const endpoint = programOptionTab === "teaching" ? "/v1/teaching-strategies" : "/v1/assessment-methods";
    try {
      await api.delete(`${endpoint}/${option.id}`);
      await fetchProgramOptions(activeProgramForOptions.id);
      toast({ title: "نجاح", description: "تم الحذف وتسجيل التغيير" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.response?.data?.message || "فشل الحذف", variant: "destructive" });
    }
  };

  const handleSaveProgramOutcome = async () => {
    if (!programOutcomeFormData.code || !programOutcomeFormData.description) {
      toast({ 
        title: "تنبيه", 
        description: "يرجى ملء الرمز والوصف", 
        variant: "destructive" 
      });
      return;
    }
  
    // ✅ التحقق من صحة الرمز
    if (!validateCode(programOutcomeFormData.code, programOutcomeFormData.domain || "Knowledge")) {
      const prefix = getDomainPrefix(programOutcomeFormData.domain || "Knowledge");
      toast({ 
        title: "خطأ في الرمز", 
        description: `الرمز يجب أن يبدأ بـ ${prefix} ثم رقم (مثال: ${prefix}1)`, 
        variant: "destructive" 
      });
      return;
    }
  
    // ✅ التحقق من تفرد الترتيب
    const order = programOutcomeFormData.order || 1;
    if (!isOrderUnique(order, programOutcomeFormData.plo_id)) {
      toast({ 
        title: "خطأ في الترتيب", 
        description: `الترتيب ${order} مستخدم بالفعل. الاقتراح: ${getNextOrderNumber()}`, 
        variant: "destructive" 
      });
      return;
    }
  
    // التحقق من الوزن
    const currentWeight = programOutcomes
      .filter(o => o.plo_id !== programOutcomeFormData.plo_id)
      .reduce((sum, o) => sum + (Number(o.weight) || 0), 0);
    
    const newWeight = Number(programOutcomeFormData.weight) || 0;
    const remainingWeight = Math.max(0, 100 - currentWeight);
    const totalWeight = currentWeight + newWeight;
  
    if (newWeight > remainingWeight) {
      toast({ 
        title: "خطأ في الوزن", 
        description: `الوزن المتاح لهذا المخرج هو ${remainingWeight.toFixed(2)}% فقط`, 
        variant: "destructive" 
      });
      return;
    }
  
    try {
      const payload = {
        ...programOutcomeFormData,
        program_id: activeProgramForOutcomes!.id,
        weight: newWeight,
        order: order
      };
  
      if (programOutcomeFormMode === "edit" && programOutcomeFormData.plo_id) {
        await api.put(`/v1/program-learning-outcomes/${programOutcomeFormData.plo_id}`, payload);
      } else {
        await api.post("/v1/program-learning-outcomes", payload);
      }
  
      setIsProgramOutcomeFormOpen(false);
      setProgramOutcomeFormData({
        code: "",
        domain: "Knowledge",
        description: "",
        weight: 0,
        order: getNextOrderNumber(),
        is_active: true
      });
      
      await fetchProgramOutcomes(activeProgramForOutcomes!.id);
      
      toast({ 
        title: "نجاح", 
        description: programOutcomeFormMode === "add" ? "تم الإضافة بنجاح" : "تم التحديث بنجاح" 
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ 
        title: "خطأ", 
        description: error?.response?.data?.message || "فشل الحفظ", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteProgramOutcome = async (ploId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المخرج؟")) return;
    
    try {
      await api.delete(`/v1/program-learning-outcomes/${ploId}`);
      await fetchProgramOutcomes(activeProgramForOutcomes!.id);
      toast({ 
        title: "نجح", 
        description: "تم حذف المخرج بنجاح" 
      });
    } catch (error: any) {
      toast({ 
        title: "خطأ", 
        description: error?.response?.data?.message || "فشل الحذف", 
        variant: "destructive" 
      });
    }
  };

  // ✅ الحصول على بادئة المجال
  const getDomainPrefix = (domain: string): string => {
    const prefixMap: Record<string, string> = {
      "Knowledge": "A",
      "Intellectual": "B",
      "Professional": "C",
      "General": "D"
    };
    return prefixMap[domain] || "A";
  };
  
  // ✅ التحقق من صحة الرمز
  const validateCode = (code: string, domain: string): boolean => {
    const prefix = getDomainPrefix(domain);
    const regex = new RegExp(`^${prefix}\\d+$`);
    return regex.test(code);
  };
  
  // ✅ الحصول على رقم الترتيب التالي المقترح
  const getNextOrderNumber = (): number => {
    if (programOutcomes.length === 0) return 1;
    
    const maxOrder = Math.max(...programOutcomes.map(o => o.order || 0));
    return maxOrder + 1;
  };
  
  // ✅ التحقق من تفرد الترتيب
  const isOrderUnique = (order: number, currentPloId?: number): boolean => {
    return !programOutcomes.some(
      o => o.order === order && o.plo_id !== currentPloId
    );
  };
  
  // ✅ إضافة helper function لترجمة المجال
  const getDomainLabel = (domain: string): string => {
    const domainMap: Record<string, string> = {
      "Knowledge": "المعرفة",
      "Intellectual": "الفكري", 
      "Professional": "المهني",
      "General": "العام"
    };
    return domainMap[domain] || domain;
  };
  
  // ✅ إضافة helper function لترتيب المخرجات حسب المجال
  const groupOutcomesByDomain = () => {
    const grouped: Record<string, ProgramOutcome[]> = {
      "Knowledge": [],
      "Intellectual": [],
      "Professional": [],
      "General": []
    };
  
    programOutcomes.forEach(outcome => {
      if (grouped[outcome.domain]) {
        grouped[outcome.domain].push(outcome);
      }
    });
  
    return grouped;
  };

  // ==========================================
  // Level Handlers
  // ==========================================

  const handleAddLevel = () => { 
    setEditingLevel(null); 
    const nextLevelNumber = programLevels.length > 0
      ? Math.max(...programLevels.map(level => level.level_number || 0)) + 1
      : 1;
    setLevelFormData({ levelNumber: nextLevelNumber }); 
    setLevelError("");
    setIsLevelFormOpen(true); 
  };

  const handleEditLevel = (lvl: ApiLevel) => { 
    setEditingLevel(lvl); 
    setLevelFormData({ levelNumber: lvl.level_number }); 
    setLevelError("");
    setIsLevelFormOpen(true); 
  };

  const handleSubmitLevel = async (e: any) => { 
    e.preventDefault();
    setLevelError("");

    const exists = programLevels.some(l => 
      l.level_number === levelFormData.levelNumber && 
      (!editingLevel || l.id !== editingLevel.id)
    );

    if (exists) {
      setLevelError(`المستوى رقم ${levelFormData.levelNumber} موجود بالفعل!`);
      toast({ 
        title: "تحذير", 
        description: `المستوى رقم ${levelFormData.levelNumber} مضاف مسبقاً`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      const payload = {
        program_id: selectedProgram!.id, 
        level_number: levelFormData.levelNumber
      }; 
      
      if(editingLevel) {
        await api.put(`/v1/levels/${editingLevel.id}`, payload);
      } else {
        await api.post("/v1/levels", payload);
      }
      
      setIsLevelFormOpen(false); 
      fetchLevels(selectedProgram!.id);
      toast({ title: "نجاح", description: "تم حفظ المستوى" });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "فشل حفظ المستوى";
      setLevelError(errorMsg);
      toast({ title: "خطأ", description: errorMsg, variant: "destructive" });
    }
  };

  const handleDeleteLevel = async (id: number) => { 
    if(!confirm("هل أنت متأكد من حذف المستوى؟")) return; 
    try {
      await api.delete(`/v1/levels/${id}`); 
      if (selectedLevel?.id === id) setSelectedLevel(null); 
      fetchLevels(selectedProgram!.id);
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  // ==========================================
  // Term Handlers
  // ==========================================

  const handleAddTerm = () => { 
    setEditingTerm(null); 
    const nextTermNumber = levelTerms.length > 0
      ? Math.max(...levelTerms.map(term => term.term_number || 0)) + 1
      : 1;
    setTermFormData({ semesterName: "", termNumber: nextTermNumber }); 
    setIsTermFormOpen(true); 
  };

  const handleEditTerm = (t: ApiSemester) => { 
    setEditingTerm(t); 
    setTermFormData({ 
      semesterName: t.semester_name, 
      termNumber: t.term_number 
    }); 
    setIsTermFormOpen(true); 
  };

  const handleSubmitTerm = async (e: any) => { 
    e.preventDefault(); 
    try {
      const payload = {
        level_id: selectedLevel!.id, 
        semester_name: termFormData.semesterName,
        term_number: termFormData.termNumber
      }; 
      
      if(editingTerm) {
        await api.put(`/v1/semesters/${editingTerm.id}`, payload);
      } else {
        await api.post("/v1/semesters", payload);
      }
      
      setIsTermFormOpen(false); 
      fetchTerms(selectedLevel!.id);
      toast({ title: "نجاح", description: "تم حفظ الفصل" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الفصل", variant: "destructive" });
    }
  };

  const handleDeleteTerm = async (id: number) => { 
    if(!confirm("هل أنت متأكد من حذف الفصل؟")) return; 
    try {
      await api.delete(`/v1/semesters/${id}`); 
      if (selectedTerm?.id === id) setSelectedTerm(null); 
      fetchTerms(selectedLevel!.id);
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  // ==========================================
  // Block Handlers
  // ==========================================

  const handleAddBlock = () => {
    setEditingBlock(null);
    const blocksInScope = selectedLevel ? levelBlocks : programBlocks;
    const nextBlockNumber = blocksInScope.length > 0
      ? Math.max(...blocksInScope.map(block => block.block_number || 0)) + 1
      : 1;
    setBlockFormData({ blockName: "", blockNumber: nextBlockNumber, weeks: 6, weight: 0, credit_hours: 0, type: "compulsory", description: "" });
    setIsBlockFormOpen(true);
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setBlockFormData({
      blockName: block.block_name,
      blockNumber: block.block_number,
      weeks: block.weeks,
      weight: block.weight,
      credit_hours: block.credit_hours || 0,
      type: block.type || "compulsory",
      description: block.description || ""
    });
    setIsBlockFormOpen(true);
  };

  const handleSubmitBlock = async (e: any) => {
    e.preventDefault();
  
    // ✅ التحقق حسب نوع النظام
    if (!selectedProgram) {
      toast({ 
        title: "تنبيه", 
        description: "يرجى اختيار البرنامج أولاً", 
        variant: "destructive" 
      });
      return;
    }
  
    // ✅ في نظام الفصول + بلوكات: المستوى مطلوب
    if (selectedProgram.academic_system === 'semester' && selectedProgram.block_based && !selectedLevel) {
      toast({ 
        title: "تنبيه", 
        description: "يرجى اختيار المستوى أولاً", 
        variant: "destructive" 
      });
      return;
    }
  
    try {
      const payload: any = {
        block_name: blockFormData.blockName,
        block_number: blockFormData.blockNumber,
        weeks: blockFormData.weeks,
        weight: blockFormData.weight,
        type: blockFormData.type,
        description: blockFormData.description,
        program_id: selectedProgram.id,
        prerequisite_ids: [], 
        corequisite_ids: []
      };
  
      // ✅ إضافة الساعات المعتمدة فقط في أنظمة الساعات
      if (selectedProgram.academic_system === 'credit') {
        payload.credit_hours = blockFormData.credit_hours;
      } else {
        payload.credit_hours = null;
      }
  
      // ✅ إضافة المستوى فقط في نظام الفصول + بلوكات
      if (selectedProgram.academic_system === 'semester' && selectedProgram.block_based) {
        payload.level_id = selectedLevel?.id;
      } else {
        // في نظام الساعات + بلوكات: level_id يكون null
        payload.level_id = null;
      }
  
      if (editingBlock) {
        await api.put(`/v1/blocks/${editingBlock.id}`, payload);
        toast({ 
          title: "تم التحديث", 
          description: "تم تحديث بيانات البلوك بنجاح" 
        });
      } else {
        await api.post("/v1/blocks", payload);
        toast({ 
          title: "تم الحفظ", 
          description: "تم إضافة البلوك الجديد بنجاح" 
        });
      }
  
      setIsBlockFormOpen(false);
      setEditingBlock(null);
  
      // ✅ جلب البلوكات حسب النظام
      if (selectedProgram.academic_system === 'credit' && selectedProgram.block_based) {
        // نظام الساعات + بلوكات: جلب بلوكات البرنامج فقط
        fetchBlocks(selectedProgram.id, undefined);
      } else if (selectedLevel) {
        // نظام الفصول + بلوكات: جلب بلوكات المستوى
        fetchBlocks(undefined, selectedLevel.id);
      }
  
    } catch (error: any) {
      console.error("Save Error:", error.response?.data);
      toast({ 
        title: "خطأ في الحفظ", 
        description: error.response?.data?.message || "فشل الاتصال بالسيرفر", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف البلوك؟")) return;
    try {
      await api.delete(`/v1/blocks/${id}`);
      if (selectedBlock?.id === id) setSelectedBlock(null);
      
      if (selectedLevel) {
        fetchBlocks(undefined, selectedLevel.id);
      } else {
        fetchBlocks(selectedProgram!.id);
      }
      
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  // ==========================================
  // Course Helper Functions
  // ==========================================
  
  /**
   * حساب الساعات المعتمدة من أجزاء المقرر
   */
  const calculateCreditHours = (parts: CoursePart[]): number => {
    return parts.reduce((total, part) => {
      return total + Math.round(part.actual_hours * part.rate);
    }, 0);
  };
  
  /**
   * الحصول على معدل التحويل الافتراضي حسب نوع الجزء
   */
  const getDefaultRate = (partName: string): number => {
    switch (partName) {
      case "نظري": return 1.0;
      case "عملي": return 0.5;
      case "تمارين": return 0.5;
      case "سريري": return 1/3;
      default: return 1.0;
    }
  };
  
  /**
   * التحقق من صحة الساعات
   */
  const validateCreditHours = (parts: CoursePart[], stated: number): boolean => {
    const calculated = calculateCreditHours(parts);
    return Math.abs(calculated - stated) < 0.01;
  };

  // ==========================================
  // Course Handlers 
  // ==========================================

  const handleAddCourse = () => { 
    setEditingCourse(null); 
    fetchCourseWeightSummary(selectedProgram?.id);
    setCourseFormData({ 
      courseCode: "", 
      courseName: "", 
      creditHours: 2, // افتراضي
      courseParts: [
        { 
          name: "نظري", 
          actual_hours: 2, 
          rate: 1.0 
        }
      ],
      weight: 0,
      category: "متطلب تخصص إجباري",
      teachingLanguage: "العربية",
      notes: "",
      prerequisiteIds: [],
      corequisiteIds: []
    }); 
    
    // ✅ جلب المقررات المتاحة للمتطلبات
    fetchAvailableCoursesForPrereq();
    
    setIsCourseFormOpen(true); 
  };

  const handleEditCourse = (course: ApiCourse) => {
    setEditingCourse(course);
    fetchCourseWeightSummary(selectedProgram?.id, course.id);
    
    setCourseFormData({
      courseCode: course.course_code,
      courseName: course.course_name,
      creditHours: course.credit_hours,
      courseParts: course.course_parts?.length > 0 
        ? course.course_parts 
        : [{ name: "نظري", actual_hours: 2, rate: 1.0 }],
      weight: course.weight || 0,
      category: course.category || "متطلب تخصص إجباري",
      teachingLanguage: course.teaching_language || "العربية",
      notes: course.notes || "",
      prerequisiteIds: course.prerequisites?.map(p => p.id) || [],
      corequisiteIds: course.corequisites?.map(c => c.id) || []
    });
    
    // ✅ جلب المقررات المتاحة
    fetchAvailableCoursesForPrereq();
    
    setIsCourseFormOpen(true);
  };

  const fetchCourseWeightSummary = async (programId?: number, excludedCourseId?: number) => {
    if (!programId) return;

    try {
      const [outcomesResponse, coursesResponse] = await Promise.all([
        api.get(`/v1/program-learning-outcomes/${programId}`),
        api.get("/v1/courses", { params: { program_id: programId } })
      ]);
      const outcomes = outcomesResponse.data?.data || outcomesResponse.data || [];
      const courses = coursesResponse.data?.data || coursesResponse.data || [];
      const programWeight = outcomes.reduce((sum: number, outcome: any) => sum + (Number(outcome.weight) || 0), 0);
      const usedCourseWeight = courses
        .filter((course: any) => (course.course_id ?? course.id) !== excludedCourseId)
        .reduce((sum: number, course: any) => sum + (Number(course.weight) || 0), 0);

      setCourseWeightSummary({
        programWeight,
        usedCourseWeight,
        remainingWeight: Math.max(0, programWeight - usedCourseWeight),
      });
    } catch {
      setCourseWeightSummary({ programWeight: 0, usedCourseWeight: 0, remainingWeight: 0 });
    }
  };

  const handleSubmitCourse = async (e: any) => { 
    e.preventDefault();
    
    // ✅ التحقق من صحة الساعات المعتمدة
    const totalCredited = courseFormData.courseParts.reduce((sum, p) => 
      sum + Math.round(p.actual_hours * p.rate), 0
    );
    
    if (totalCredited !== courseFormData.creditHours) {
      toast({ 
        title: "خطأ في الموازنة", 
        description: `مجموع الأجزاء (${totalCredited}) لا يساوي الساعات المعتمدة (${courseFormData.creditHours})`,
        variant: "destructive" 
      });
      return;
    }

    // ✅ التحقق من البيانات المطلوبة حسب النظام
    if (!selectedProgram) {
      toast({ 
        title: "خطأ", 
        description: "يرجى اختيار البرنامج أولاً",
        variant: "destructive" 
      });
      return;
    }
  
    if (selectedProgram.academic_system === 'semester' && !selectedTerm && !selectedBlock) {
      toast({ 
        title: "خطأ", 
        description: selectedProgram.block_based 
          ? "يرجى اختيار البلوك"
          : "يرجى اختيار الفصل",
        variant: "destructive" 
      });
      return;
    }
  
    if (selectedProgram.academic_system === 'credit' && selectedProgram.block_based && !selectedBlock) {
      toast({ 
        title: "خطأ", 
        description: "يرجى اختيار البلوك",
        variant: "destructive" 
      });
      return;
    }

    // ✅ وزن المقرر يستهلك من مجموع أوزان مخرجات البرنامج المضافة فقط
    try {
      const [outcomesResponse, coursesResponse] = await Promise.all([
        api.get(`/v1/program-learning-outcomes/${selectedProgram.id}`),
        api.get("/v1/courses", { params: { program_id: selectedProgram.id } })
      ]);
      const programWeight = (outcomesResponse.data?.data || outcomesResponse.data || [])
        .reduce((sum: number, outcome: any) => sum + (Number(outcome.weight) || 0), 0);
      const courses = coursesResponse.data?.data || coursesResponse.data || [];
      const currentCourseWeight = courses
        .filter((course: any) => course.course_id !== editingCourse?.id && course.id !== editingCourse?.id)
        .reduce((sum: number, course: any) => sum + (Number(course.weight) || 0), 0);
      const remainingCourseWeight = Math.max(0, programWeight - currentCourseWeight);

      if (Number(courseFormData.weight) > remainingCourseWeight) {
        toast({
          title: "الوزن يتجاوز المتاح",
          description: `أوزان مخرجات البرنامج: ${programWeight.toFixed(2)}%. المتاح لهذا المقرر: ${remainingCourseWeight.toFixed(2)}%`,
          variant: "destructive"
        });
        return;
      }
    } catch {
      toast({
        title: "تعذر التحقق من الوزن",
        description: "لم يتم حفظ المقرر قبل التحقق من أوزان البرنامج والمقررات.",
        variant: "destructive"
      });
      return;
    }
    
    try { 
      const payload: any = { 
        course_code: courseFormData.courseCode, 
        course_name: courseFormData.courseName, 
        credit_hours: courseFormData.creditHours,
        course_parts: courseFormData.courseParts,
        
        // ✅ معلومات إضافية
        weight: courseFormData.weight,
        category: courseFormData.category,
        teaching_language: courseFormData.teachingLanguage,
        notes: courseFormData.notes || null,
        
        // ✅ الربط بالهيكل
        college_id: Number(collegeId), 
        department_id: selectedDepartment!.department_id, 
        program_id: selectedProgram!.id,
        
        // ✅ المتطلبات
        prerequisites: courseFormData.prerequisiteIds,
        corequisites: courseFormData.corequisiteIds
      };
  
      // ✅ الربط حسب النظام الأكاديمي
      // if (selectedProgram!.academic_system === 'semester' && !selectedProgram!.block_based) {
      //   // نظام الفصول: level + semester
      //   payload.level_id = selectedLevel?.id;
      //   payload.semester_id = selectedTerm?.id;
      //   payload.block_id = null;
      // } else if (selectedProgram!.academic_system === 'semester' && selectedProgram!.block_based) {
      //   payload.level_id = selectedLevel?.id;
      //   payload.block_id = selectedBlock?.id;
      //   payload.semester_id = null;
      // } else if (selectedProgram!.academic_system === 'credit' && !selectedProgram!.block_based) {
      //   payload.level_id = null;
      //   payload.semester_id = null;
      //   payload.block_id = null;
      // } else if (selectedProgram!.academic_system === 'credit' && selectedProgram!.block_based) {
      //   // نظام الساعات + بلوكات: block فقط
      //   payload.level_id = null;
      //   payload.semester_id = null;
      //   payload.block_id = selectedBlock?.id;
      // }

          // ✅ تعيين الحقول حسب النظام الأكاديمي
    if (selectedProgram.academic_system === 'semester') {
      payload.level_id = selectedLevel?.id;
      
      if (selectedProgram.block_based) {
        // الفصول + بلوكات
        payload.block_id = selectedBlock?.id;
        payload.semester_id = null;
      } else {
        // الفصول فقط
        payload.semester_id = selectedTerm?.id;
        payload.block_id = null;
      }
    } else {
      // نظام الساعات
      payload.level_id = null;
      payload.semester_id = null;
      
      if (selectedProgram.block_based) {
        // ساعات + بلوكات
        payload.block_id = selectedBlock?.id;
      } else {
        // ساعات فقط
        payload.block_id = null;
      }
    }
  
      if (editingCourse) {
        await api.put(`/v1/courses/${editingCourse.id}`, payload);
        toast({ title: "نجاح", description: "تم تحديث المقرر بنجاح" });
      } else {
        await api.post("/v1/courses", payload);
        toast({ title: "نجاح", description: "تم إضافة المقرر بنجاح" });
      }
      
      setIsCourseFormOpen(false);
      setEditingCourse(null);
      
      // ✅ إعادة جلب المقررات حسب النظام
      if (selectedTerm) {
        fetchCourses(selectedTerm.id);
      } else if (selectedBlock) {
        fetchCourses(undefined, selectedBlock.id);
      } else if (selectedProgram) {
        fetchCourses(undefined, undefined, selectedProgram.id);
      }
      
    } catch (error: any) { 
      console.error("خطأ في حفظ المقرر:", error.response?.data);
      toast({ 
        title: "خطأ", 
        description: error.response?.data?.message || "فشل حفظ المقرر", 
        variant: "destructive" 
      }); 
    } 
  };

  const handleDeleteCourse = async (id: number) => { 
    if(!confirm("هل أنت متأكد من حذف المقرر؟")) return; 
    try {
      await api.delete(`/v1/courses/${id}`); 
      
      if (selectedTerm) {
        fetchCourses(selectedTerm.id);
      } else if (selectedBlock) {
        fetchCourses(undefined, selectedBlock.id);
      } else {
        fetchCourses(undefined, undefined, selectedProgram.id);
      }
      
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  const handleOpenQuality = (course: ApiCourse) => {
    setQualityDialogCourse({ id: course.id } as any);
  };

  const handleAddCoursePart = () => {
    setCourseFormData({
      ...courseFormData,
      courseParts: [
        ...courseFormData.courseParts,
        { name: "عملي", actual_hours: 2, rate: 0.5 }
      ]
    });
  };

  const handleRemoveCoursePart = (index: number) => {
    if (courseFormData.courseParts.length === 1) {
      toast({ title: "تحذير", description: "يجب أن يكون للمقرر جزء واحد على الأقل", variant: "destructive" });
      return;
    }
    const updated = courseFormData.courseParts.filter((_, i) => i !== index);
    const newCreditHours = calculateCreditHours(updated);

    setCourseFormData({
      ...courseFormData,
       courseParts: updated,
      creditHours: Math.round(newCreditHours * 100) / 100
    });
  };

  const handleUpdateCoursePart = (index: number, field: keyof CoursePart, value: any) => {
    const updated = [...courseFormData.courseParts];
    
    // ✅ عند تغيير النوع، تحديث معدل التحويل تلقائياً
    if (field === 'name') {
      updated[index] = { 
        ...updated[index], 
        name: value as "نظري" | "عملي" | "تمارين" | "سريري",
        rate: getDefaultRate(value)
      };
    } else if (field === 'actual_hours') {
      updated[index] = { 
        ...updated[index], 
        actual_hours: Math.max(0, parseInt(value) || 0)
      };
    } else if (field === 'rate') {
      updated[index] = { 
        ...updated[index], 
        rate: Number(value)
      };
    }
    
    // ✅ حساب الساعات المعتمدة تلقائياً
    const newCreditHours = calculateCreditHours(updated);
    
    setCourseFormData({ 
      ...courseFormData, 
      courseParts: updated,
    });
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      className="space-y-6 animate-in slide-in-from-right-4 duration-500"
      dir="rtl"
      onFocusCapture={handleNumberInputFocus}
      onWheelCapture={handleNumberInputWheel}
    >
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الخطة الدراسية</h2>
          <p className="text-sm text-muted-foreground">إدارة الأقسام والبرامج والمقررات الدراسية</p>
        </div>
        {can('study_plan.create') && (
          <Button onClick={() => openDialog()} className="shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4 mr-2" /> إضافة قسم
          </Button>
        )}
      </div>

      {/* الأقسام */}
      <Card className="border-t-4 border-t-slate-700 shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[50%] text-right font-bold">القسم الأكاديمي</TableHead>
                <TableHead className="w-[30%] text-right font-bold">كود القسم</TableHead>
                <TableHead className="w-[20%] text-left font-bold">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    لا توجد أقسام مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow 
                    key={dept.department_id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50", 
                      selectedDepartment?.department_id === dept.department_id && "bg-blue-50/50 border-r-4 border-r-blue-600"
                    )} 
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    <TableCell className="text-right font-medium text-slate-700">
                      {dept.department_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono bg-white">
                        {dept.department_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2 justify-end">
                        {can('study_plan.update') && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-blue-100 hover:text-blue-700" 
                            onClick={(e) => { e.stopPropagation(); openDialog(dept); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {can('study_plan.delete') && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-red-100 hover:text-red-700 text-destructive" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept.department_id); }}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "تعديل القسم" : "إضافة قسم"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField 
                control={form.control} 
                name="department_name" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم القسم</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: قسم علوم الحاسوب" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              <FormField 
                control={form.control} 
                name="department_code" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود القسم</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: CS" className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "حفظ"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* البرامج */}
      {selectedDepartment && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg text-slate-800">البرامج الأكاديمية</CardTitle>
                  <CardDescription>التابعة لـ {selectedDepartment.department_name}</CardDescription>
                </div>
                {can('study_plan.create') && (
                  <Button onClick={handleAddProgram} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> إضافة برنامج
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              {isProgramFormOpen && (
                <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-200 mb-6 shadow-sm">
                  <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">
                    {editingProgram ? "تعديل البرنامج" : "إضافة برنامج جديد"}
                  </h4>
                  <form onSubmit={handleSubmitProgram} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>اسم البرنامج</Label>
                        <Input 
                          value={programFormData.name}
                          onChange={e => setProgramFormData({...programFormData, name: e.target.value})}
                          placeholder="مثال: بكالوريوس علوم الحاسوب"
                          className="bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-indigo-700 font-bold">النظام الأكاديمي</Label>
                        <Select 
                          value={programFormData.academic_system} 
                          onValueChange={(v: "semester" | "credit") => setProgramFormData({...programFormData, academic_system: v})}
                        >
                          <SelectTrigger className="bg-white border-indigo-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester">نظام الفصول الدراسية</SelectItem>
                            <SelectItem value="credit">نظام الساعات المعتمدة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* يظهر الحقل فقط إذا كان النظام ساعات معتمدة أو ساعات + بلوكات */}
                      {programFormData.academic_system === 'credit' && (
                        <div className="space-y-2 mt-4">
                          <Label>إجمالي ساعات البرنامج</Label>
                          <Input 
                            type="number" 
                            value={programFormData.total_hours || ''} 
                            onChange={(e) => setProgramFormData({...programFormData, total_hours: e.target.value})}
                            placeholder="مثلاً: 132"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-purple-700 font-bold">نظام البلوكات</Label>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                          <Switch 
                            checked={programFormData.block_based}
                            onCheckedChange={c => setProgramFormData({...programFormData, block_based: c})}
                          />
                          <Label className="cursor-pointer">
                            {programFormData.block_based ? "نعم - يعتمد على البلوكات" : "لا - نظام تقليدي"}
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>الحالة</Label>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                          <Switch 
                            checked={programFormData.is_active}
                            onCheckedChange={c => setProgramFormData({...programFormData, is_active: c})}
                          />
                          <Label className="cursor-pointer">
                            {programFormData.is_active ? "نشط" : "معطل"}
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsProgramFormOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit">
                        <Plus className="w-4 h-4 mr-2" />
                        حفظ البرنامج
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentPrograms.map(prog => (
                  <div 
                    key={prog.id} 
                    onClick={() => setSelectedProgram(prog)} 
                    className={cn(
                      "p-5 rounded-xl border-2 transition-all cursor-pointer bg-white flex flex-col justify-between min-h-[160px]", 
                      selectedProgram?.id === prog.id 
                        ? "border-primary ring-2 ring-primary/20 shadow-md bg-blue-50/10" 
                        : "hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-slate-800 text-lg leading-tight pr-2">
                          {prog.name}
                        </div>
                        <Badge 
                          variant={prog.is_active ? "default" : "secondary"} 
                          className={cn(
                            "shrink-0", 
                            prog.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                          )}
                        >
                          {prog.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {prog.academic_system === 'semester' && !prog.block_based && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600">
                            <Layers className="w-3 h-3 mr-1"/> فصول دراسية
                          </Badge>
                        )}
                        {prog.academic_system === 'semester' && prog.block_based && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            <LayoutGrid className="w-3 h-3 mr-1"/> فصول + بلوكات
                          </Badge>
                        )}
                        {prog.academic_system === 'credit' && !prog.block_based && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Clock className="w-3 h-3 mr-1"/> ساعات معتمدة
                          </Badge>
                        )}
                        {prog.academic_system === 'credit' && prog.block_based && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <LayoutGrid className="w-3 h-3 mr-1"/> ساعات + بلوكات
                          </Badge>
                        )}
                      </div>

                      {/* إضافة عرض الساعات الإجمالية داخل الكرت */}
                      {(prog.academic_system === 'credit' || prog.block_based) && prog.total_hours && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 mt-2 w-fit">
                          <BookOpen className="w-3 h-3 ml-1" />
                          الإجمالي: {prog.total_hours} ساعة
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100" 
                          onClick={(e) => { 
                            e.stopPropagation();
                            handleOpenProgramOutcomes(prog);
                          }}
                        >
                          <Target className="w-3.5 h-3.5" /> مخرجات التعلم
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProgramOptions(prog);
                          }}
                        >
                          <Lightbulb className="w-3.5 h-3.5" /> التدريس والتقييم
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        {can('study_plan.update') && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-500 hover:text-blue-600" 
                            onClick={(e) => {e.stopPropagation(); handleEditProgram(prog)}}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {can('study_plan.delete') && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" 
                            onClick={(e) => {e.stopPropagation(); handleDeleteProgram(prog.id)}}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isProgramOptionsDialogOpen} onOpenChange={setIsProgramOptionsDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>استراتيجيات التدريس وطرق التقييم</DialogTitle>
                <DialogDescription>{activeProgramForOptions?.name} - بيانات مستقلة لهذا البرنامج</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 border-b pb-3">
                <Button variant={programOptionTab === "teaching" ? "default" : "outline"} onClick={() => setProgramOptionTab("teaching")}>استراتيجيات التدريس</Button>
                <Button variant={programOptionTab === "assessment" ? "default" : "outline"} onClick={() => setProgramOptionTab("assessment")}>طرق التقييم</Button>
                <Button className="mr-auto" onClick={() => openProgramOptionForm()}><Plus className="w-4 h-4 ml-1" /> إضافة</Button>
              </div>
              {(() => {
                const options = programOptionTab === "teaching" ? teachingProgramOptions : assessmentProgramOptions;
                const auditFor = (option: ProgramOption) => programOptionAudits.find(a => a.option_type === (programOptionTab === "teaching" ? "teaching_strategy" : "assessment_method") && a.option_id === option.id);
                return (
                  <Table>
                    <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الفئة</TableHead><TableHead>الحالة</TableHead><TableHead>آخر تحديث</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {options.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات لهذا البرنامج</TableCell></TableRow> : options.map(option => {
                        const audit = auditFor(option);
                        return <TableRow key={option.id}>
                          <TableCell className="font-medium">{option.name}<div className="text-xs text-muted-foreground">{option.description}</div></TableCell>
                          <TableCell>{option.category}</TableCell>
                          <TableCell>{option.is_active ? "نشط" : "غير نشط"}</TableCell>
                          <TableCell className="text-xs">{audit ? `${audit.action === "created" ? "أضيف" : audit.action === "updated" ? "عُدّل" : "حُذف"} - ${new Date(audit.changed_at).toLocaleString("ar-EG")}` : "لا يوجد سجل"}</TableCell>
                          <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => openProgramOptionForm(option)}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteProgramOption(option)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                        </TableRow>;
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
              <Dialog open={isProgramOptionFormOpen} onOpenChange={setIsProgramOptionFormOpen}>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>{editingProgramOption ? "تعديل" : "إضافة"} {programOptionTab === "teaching" ? "استراتيجية تدريس" : "طريقة تقييم"}</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveProgramOption} className="space-y-4">
                    <div className="space-y-2"><Label>الاسم</Label><Input value={programOptionFormData.name} onChange={e => setProgramOptionFormData({ ...programOptionFormData, name: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>الوصف</Label><Textarea value={programOptionFormData.description} onChange={e => setProgramOptionFormData({ ...programOptionFormData, description: e.target.value })} /></div>
                    <div className="space-y-2"><Label>الفئة</Label>
                      <Select value={programOptionFormData.category} onValueChange={category => setProgramOptionFormData({ ...programOptionFormData, category })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(programOptionTab === "teaching"
                            ? [["lecture", "محاضرة"], ["practical", "عملي"], ["discussion", "مناقشة"], ["collaboration", "تعاوني"], ["project_based", "تعلم قائم على المشروع"], ["problem_solving", "حل المشكلات"], ["simulation", "محاكاة"], ["other", "أخرى"]]
                            : [["exam", "اختبار"], ["assignment", "تكليف"], ["project", "مشروع"], ["presentation", "عرض"], ["participation", "مشاركة"], ["portfolio", "ملف إنجاز"], ["other", "أخرى"]]
                          ).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsProgramOptionFormOpen(false)}>إلغاء</Button><Button type="submit">حفظ</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            </DialogContent>
          </Dialog>

          {/* مخرجات البرنامج */}
          <Dialog open={isProgramOutcomesDialogOpen} onOpenChange={setIsProgramOutcomesDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
                    <Target className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <DialogTitle className="text-xl">مخرجات التعلم للبرنامج (PLOs)</DialogTitle>
                      <DialogDescription className="text-base mt-1">
                        {selectedDepartment?.department_name} • 
                        <span className="font-bold text-indigo-700">{activeProgramForOutcomes?.name}</span>
                      </DialogDescription>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-center">
                      <div className="text-xs text-slate-500 font-medium mb-1">إجمالي الأوزان</div>
                      <div className={cn(
                        "text-2xl font-bold",
                        programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0) === 100
                          ? "text-emerald-600"
                          : programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0) > 100
                          ? "text-red-600"
                          : "text-amber-600"
                      )}>
                        {programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0)}%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        المتبقي: {Math.max(0, 100 - programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0)).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="p-6 flex-1 overflow-y-auto bg-white">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-slate-600">
                    مخرجات التعلم المستهدفة
                    <span className="mr-2 text-indigo-600 font-semibold">
                      ({programOutcomes.length})
                    </span>
                  </p>
                  <Button 
                    disabled={programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0) >= 100}
                    onClick={() => { 
                      setProgramOutcomeFormMode("add"); 
                      setProgramOutcomeFormData({
                        code: "",
                        domain: "Knowledge",
                        description: "",
                        weight: 0,
                        order: getNextOrderNumber(),
                        is_active: true
                      }); 
                      setIsProgramOutcomeFormOpen(true); 
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> إضافة مخرج
                  </Button>
                </div>
          
                {programOutcomes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">لا توجد مخرجات تعلم</p>
                    <p className="text-sm mt-2">ابدأ بإضافة مخرجات التعلم للبرنامج</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupOutcomesByDomain()).map(([domain, outcomes]) => {
                      if (outcomes.length === 0) return null;
                      
                      const domainWeight = outcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0);
                      
                      return (
                        <div key={domain} className="border rounded-xl p-4 bg-slate-50">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800">
                              {getDomainLabel(domain)}
                            </h3>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                              الوزن: {domainWeight}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {outcomes
                              .sort((a, b) => a.order - b.order)
                              .map((outcome) => (
                                <div 
                                  key={outcome.plo_id} 
                                  className="flex justify-between p-4 border rounded-xl hover:bg-white transition-colors shadow-sm bg-white"
                                >
                                  <div className="flex gap-4 flex-1">
                                    <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-3 py-1.5 rounded-lg text-sm h-fit shrink-0">
                                      {outcome.code}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-800 leading-relaxed">
                                        {outcome.description}
                                      </p>
                                      <div className="flex gap-2 mt-2.5">
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
                                          الوزن: {outcome.weight}%
                                        </Badge>
                                        {!outcome.is_active && (
                                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                            غير نشط
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-start shrink-0 mr-3">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="hover:bg-indigo-50 hover:text-indigo-600"
                                      onClick={() => { 
                                        setProgramOutcomeFormMode("edit"); 
                                        setProgramOutcomeFormData(outcome); 
                                        setIsProgramOutcomeFormOpen(true); 
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="text-red-500 hover:bg-red-50" 
                                      onClick={() => handleDeleteProgramOutcome(outcome.plo_id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* فورم إضافة/تعديل مخرج التعلم */}
          <Dialog open={isProgramOutcomeFormOpen} onOpenChange={setIsProgramOutcomeFormOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {programOutcomeFormMode === "add" ? "إضافة مخرج تعلم جديد" : "تعديل مخرج التعلم"}
                </DialogTitle>
                <DialogDescription>
                  {activeProgramForOutcomes?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ✅ المجال أولاً */}
                  <div className="space-y-2">
                    <Label>المجال <span className="text-red-500">*</span></Label>
                    <Select 
                      value={programOutcomeFormData.domain}
                      onValueChange={v => {
                        setProgramOutcomeFormData({
                          ...programOutcomeFormData, 
                          domain: v as any,
                          code: "" // ✅ إعادة تعيين الرمز عند تغيير المجال
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Knowledge">المعرفة (A)</SelectItem>
                        <SelectItem value="Intellectual">الفكري (B)</SelectItem>
                        <SelectItem value="Professional">المهني (C)</SelectItem>
                        <SelectItem value="General">العام (D)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      الرموز: A=المعرفة، B=الفكري، C=المهني، D=العام
                    </p>
                  </div>
                  
                  {/* ✅ الرمز مع التحقق التلقائي */}
                  <div className="space-y-2">
                    <Label>الرمز <span className="text-red-500">*</span></Label>
                    <Input 
                      value={programOutcomeFormData.code || ""}
                      onChange={e => {
                        const input = e.target.value.toUpperCase();
                        const domainPrefix = getDomainPrefix(programOutcomeFormData.domain || "Knowledge");
                        
                        // ✅ التحقق من النمط الصحيح
                        const regex = new RegExp(`^${domainPrefix}\\d*$`);
                        
                        if (input === "" || regex.test(input)) {
                          setProgramOutcomeFormData({
                            ...programOutcomeFormData, 
                            code: input
                          });
                        }
                      }}
                      placeholder={`${getDomainPrefix(programOutcomeFormData.domain || "Knowledge")}1, ${getDomainPrefix(programOutcomeFormData.domain || "Knowledge")}2, ...`}
                      maxLength={4}
                      disabled={!programOutcomeFormData.domain}
                    />
                    <p className="text-xs text-slate-500">
                      يجب أن يبدأ بـ {getDomainPrefix(programOutcomeFormData.domain || "Knowledge")} 
                      ثم رقم (مثال: {getDomainPrefix(programOutcomeFormData.domain || "Knowledge")}1)
                    </p>
                  </div>
                </div>
          
                <div className="space-y-2">
                  <Label>الوصف <span className="text-red-500">*</span></Label>
                  <Textarea 
                    value={programOutcomeFormData.description || ""}
                    onChange={e => setProgramOutcomeFormData({
                      ...programOutcomeFormData, 
                      description: e.target.value
                    })}
                    placeholder="اكتب وصف مخرج التعلم بشكل واضح ومحدد..."
                    className="min-h-[120px]"
                    rows={5}
                  />
                </div>
          
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>الوزن (%) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number"
                      value={programOutcomeFormData.weight || ""}
                      onChange={e => setProgramOutcomeFormData({
                        ...programOutcomeFormData, 
                        weight: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-slate-500">
                      المتبقي: {(100 - programOutcomes
                        .filter(o => o.plo_id !== programOutcomeFormData.plo_id)
                        .reduce((sum, o) => sum + (Number(o.weight) || 0), 0)).toFixed(2)}%
                    </p>
                  </div>
          
                  {/* ✅ الترتيب مع التحقق */}
                  <div className="space-y-2">
                    <Label>الترتيب <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number"
                      value={programOutcomeFormData.order || ""}
                      onChange={e => setProgramOutcomeFormData({
                        ...programOutcomeFormData, 
                        order: parseInt(e.target.value) || 1
                      })}
                      min="1"
                      placeholder="1, 2, 3, ..."
                    />
                    <p className="text-xs text-slate-500">
                      {programOutcomeFormMode === "add" 
                        ? `الاقتراح: ${getNextOrderNumber()}`
                        : "يجب أن يكون فريداً"}
                    </p>
                  </div>
          
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <div className="flex items-center space-x-2 space-x-reverse h-10">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={programOutcomeFormData.is_active ?? true}
                        onChange={e => setProgramOutcomeFormData({
                          ...programOutcomeFormData, 
                          is_active: e.target.checked
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        نشط
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
          
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsProgramOutcomeFormOpen(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSaveProgramOutcome}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* هيكل البرنامج حسب النظام */}
          {selectedProgram && selectedProgram.academic_system === 'semester' && !selectedProgram.block_based && (
            <div className="space-y-6">
              
              {/* المستويات */}
              <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                <CardHeader className="bg-slate-50/50 border-b pb-4 py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> مستويات البرنامج
                    </CardTitle>
                    {can('study_plan.create') && (
                      <Button size="sm" variant="outline" onClick={handleAddLevel} className="h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> مستوى جديد
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLevelFormOpen && (
                    <div className="bg-slate-50 p-4 rounded-lg border mb-4 space-y-3">
                      <h4 className="font-semibold text-sm">{editingLevel ? "تعديل المستوى" : "إضافة مستوى جديد"}</h4>
                      
                      {levelError && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{levelError}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSubmitLevel} className="flex items-end gap-3">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-xs">رقم المستوى</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={levelFormData.levelNumber}
                            onChange={e => {
                              setLevelFormData({levelNumber: +e.target.value});
                              setLevelError("");
                            }}
                            className="bg-white h-9"
                            required
                          />
                        </div>
                        <Button size="sm" type="submit" className="h-9">
                          حفظ
                        </Button>
                        <Button 
                          size="icon" 
                          type="button"
                          variant="ghost" 
                          onClick={() => {
                            setIsLevelFormOpen(false);
                            setLevelError("");
                          }}
                          className="h-9 w-9"
                        >
                          <X className="w-4 h-4 text-muted-foreground"/>
                        </Button>
                      </form>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {programLevels.map(lvl => (
                      <div 
                        key={lvl.id} 
                        onClick={() => setSelectedLevel(lvl)} 
                        className={cn(
                          "min-w-[140px] p-3 rounded-lg border cursor-pointer transition-all group flex flex-col items-center justify-center relative overflow-hidden", 
                          selectedLevel?.id === lvl.id 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "bg-white hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div className="font-bold text-lg mb-1">المستوى {lvl.level_number}</div>
                        <div className="text-xs opacity-80 mb-2">انقر لعرض الفصول</div>
                        <div className={cn(
                          "flex justify-center gap-1 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100", 
                          selectedLevel?.id === lvl.id ? "text-white" : "text-slate-600"
                        )}>
                          {can('study_plan.update') && (
                            <Button 
                              size="icon" 
                              className="h-7 w-7 hover:bg-black/10 rounded-full" 
                              variant="ghost" 
                              onClick={(e)=>{e.stopPropagation(); handleEditLevel(lvl)}}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {can('study_plan.delete') && (
                            <Button 
                              size="icon" 
                              className="h-7 w-7 hover:bg-red-500 hover:text-white rounded-full" 
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
                </CardContent>
              </Card>

              {/* الفصول */}
              {selectedLevel && (
                <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                  <CardHeader className="bg-slate-50/50 border-b pb-4 py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" /> فصول المستوى: {selectedLevel.level_number}
                      </CardTitle>
                      {can('study_plan.create') && (
                        <Button size="sm" variant="outline" onClick={handleAddTerm} className="h-8">
                          <Plus className="w-3.5 h-3.5 mr-1" /> فصل دراسي
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isTermFormOpen && (
                      <div className="bg-slate-50 p-4 rounded-lg border mb-4 space-y-3">
                        <h4 className="font-semibold text-sm">{editingTerm ? "تعديل الفصل" : "إضافة فصل جديد"}</h4>
                        <form onSubmit={handleSubmitTerm} className="flex items-end gap-3">
                          <div className="space-y-1.5 flex-1">
                            <Label className="text-xs">اسم الفصل</Label>
                            <Input 
                              value={termFormData.semesterName}
                              onChange={e => setTermFormData({...termFormData, semesterName: e.target.value})}
                              placeholder="مثال: الفصل الأول، الفصل الصيفي"
                              className="bg-white h-9"
                              required
                            />
                          </div>
                          <div className="space-y-1.5 w-32">
                            <Label className="text-xs">رقم الترتيب</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={termFormData.termNumber}
                              onChange={e => setTermFormData({...termFormData, termNumber: +e.target.value})}
                              className="bg-white h-9"
                              required
                            />
                          </div>
                          <Button size="sm" type="submit" className="h-9">
                            حفظ
                          </Button>
                          <Button 
                            size="icon" 
                            type="button"
                            variant="ghost" 
                            onClick={() => setIsTermFormOpen(false)}
                            className="h-9 w-9"
                          >
                            <X className="w-4 h-4 text-muted-foreground"/>
                          </Button>
                        </form>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {levelTerms.map(term => (
                        <div 
                          key={term.id} 
                          onClick={() => setSelectedTerm(term)} 
                          className={cn(
                            "flex-1 min-w-[200px] p-4 text-center border-2 rounded-xl cursor-pointer transition-all group", 
                            selectedTerm?.id === term.id 
                              ? "border-primary bg-primary/5" 
                              : "bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="text-sm text-muted-foreground mb-1">الفصل الدراسي</div>
                          <div className={cn(
                            "font-bold text-xl mb-3", 
                            selectedTerm?.id === term.id ? "text-primary" : "text-slate-700"
                          )}>
                            {term.semester_name}
                          </div>
                          <div className="flex justify-center gap-2 opacity-50 group-hover:opacity-100">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0" 
                              onClick={(e)=>{e.stopPropagation(); handleEditTerm(term)}}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" 
                              onClick={(e)=>{e.stopPropagation(); handleDeleteTerm(term.id)}}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* المقررات */}
              {selectedTerm && (
                <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                  <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg text-slate-800">المقررات الدراسية</CardTitle>
                        <CardDescription>
                          المستوى {selectedLevel?.level_number} - {selectedTerm.semester_name}
                        </CardDescription>
                      </div>
                      <Button onClick={handleAddCourse} className="shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> إضافة مقرر
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isCourseFormOpen && (
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                        <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">
                          {editingCourse ? "تعديل المقرر" : "إضافة مقرر جديد"}
                        </h4>
                        <form onSubmit={handleSubmitCourse} className="space-y-6">
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>كود المقرر *</Label>
                              <Input 
                                value={courseFormData.courseCode}
                                onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})}
                                placeholder="CS101"
                                className="bg-white font-mono"
                                required
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label>اسم المقرر *</Label>
                              <Input 
                                value={courseFormData.courseName}
                                onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})}
                                placeholder="مثال: مقدمة في البرمجة"
                                className="bg-white"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>الساعات المعتمدة *</Label>
                              <Input 
                                type="number"
                                min="1"
                                value={courseFormData.creditHours}
                                onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})}
                                className="bg-white"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-emerald-700 font-bold">وزن المقرر % (من البرنامج)</Label>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={courseFormData.weight}
                                onChange={e => setCourseFormData({...courseFormData, weight: +e.target.value})}
                                placeholder="0"
                                className="bg-emerald-50/50 border-emerald-200"
                              />
                              <p className="text-xs text-slate-500 leading-relaxed">
                                مجموع أوزان البرنامج: <b>{courseWeightSummary.programWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المستخدم للمقررات: <b>{courseWeightSummary.usedCourseWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المتبقي: <b className="text-emerald-700">{courseWeightSummary.remainingWeight.toFixed(2)}%</b>
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>نوع المتطلب</Label>
                              <Select 
                                value={courseFormData.category}
                                onValueChange={v => setCourseFormData({...courseFormData, category: v as "متطلب جامعة" | "متطلب كلية" | "متطلب تخصص إجباري" | "متطلب تخصص اختياري"})}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="متطلب جامعة">متطلب جامعة</SelectItem>
                                  <SelectItem value="متطلب كلية">متطلب كلية</SelectItem>
                                  <SelectItem value="متطلب تخصص إجباري">متطلب تخصص (إجباري)</SelectItem>
                                  <SelectItem value="متطلب تخصص اختياري">متطلب تخصص (اختياري)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* ==================== القسم 2: أجزاء المقرر والساعات ==================== */}
                          <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <h5 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600" />
                                أجزاء المقرر والساعات المعتمدة
                              </h5>
                            </div>
                          
                            {/* الساعات المعتمدة (ثابتة - في الأعلى) */}
                            <Alert className="bg-blue-50 border-2 border-blue-400">
                              <Clock className="h-5 w-5 text-blue-700" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-900 text-base">
                                    إجمالي الساعات المعتمدة للمقرر (ثابت):
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Input 
                                      type="number"
                                      min="1"
                                      max="10"
                                      step="1"
                                      value={courseFormData.creditHours}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setCourseFormData({...courseFormData, creditHours: val});
                                      }}
                                      className="w-24 h-10 font-bold text-xl text-center bg-white border-2 border-blue-300 text-blue-700"
                                      required
                                    />
                                    <span className="text-blue-800 font-bold">ساعة</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                            
                            {/* ⚠️ تنبيه */}
                            <Alert className="bg-amber-50 border-amber-300">
                              <AlertCircle className="h-4 w-4 text-amber-700" />
                              <AlertDescription className="text-xs text-amber-800">
                                💡 <b>ملاحظة:</b> يجب أن يساوي مجموع الساعات المحسوبة من الأجزاء (بعد التحويل) الساعات المعتمدة المدخلة أعلاه.
                              </AlertDescription>
                            </Alert>
                          
                            {/*  عرض الأجزاء */}
                            <div className="space-y-3">
                              {courseFormData.courseParts.map((part, idx) => {
                                // ✅ حساب دقيق للساعات المعتمدة
                                const creditedHours = Math.round(part.actual_hours * part.rate);
                                
                                return (
                                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-3">
                                    
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary" className="shrink-0 min-w-[80px] justify-center">
                                        {part.name}
                                      </Badge>
                                      
                                      {/* الساعات الفعلية */}
                                      <div className="flex items-center gap-2 flex-1">
                                        <Label className="text-xs text-slate-600 w-28">الساعات الفعلية:</Label>
                                        <Input 
                                          type="number"
                                          min="0"
                                          step={
                                            part.name === "نظري" ? 1 :
                                            part.name === "عملي" ? 2 :
                                            part.name === "تمارين" ? 2 :
                                            part.name === "سريري" ? 3 : 1
                                          }
                                          value={part.actual_hours}
                                          onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            
                                            // ✅ تقييد القيم حسب النوع
                                            if (part.name === "عملي" || part.name === "تمارين") {
                                              val = Math.floor(val / 2) * 2; // مضاعفات 2
                                            } else if (part.name === "سريري") {
                                              val = Math.floor(val / 3) * 3; // مضاعفات 3
                                            }
                                            
                                            handleUpdateCoursePart(idx, 'actual_hours', val);
                                          }}
                                          className="bg-white h-9 w-24 text-center font-semibold"
                                          placeholder={
                                            part.name === "نظري" ? "1, 2, 3..." :
                                            part.name === "عملي" ? "2, 4, 6..." :
                                            part.name === "تمارين" ? "2, 4, 6..." :
                                            part.name === "سريري" ? "3, 6, 9..." : "0"
                                          }
                                        />
                                        <span className="text-xs text-slate-500">ساعة</span>
                                      </div>
                            
                                      {/* العرض التوضيحي */}
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {part.name === "سريري" ? "÷3" : part.name === "نظري" ? "×1" : "÷2"}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                        <Badge className={cn(
                                          "font-bold min-w-[100px] justify-center",
                                          creditedHours <= courseFormData.creditHours 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        )}>
                                          {creditedHours} ساعة معتمدة
                                        </Badge>
                                      </div>
                            
                                      {/* زر الحذف */}
                                      {courseFormData.courseParts.length > 1 && (
                                        <Button 
                                          type="button"
                                          size="icon" 
                                          variant="ghost"
                                          className="text-red-500 hover:bg-red-50 shrink-0"
                                          onClick={() => handleRemoveCoursePart(idx)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                            
                                    {/* شرح المعدل */}
                                    <div className="text-xs text-slate-500 bg-white p-2 rounded border flex items-center gap-2">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        <b>{part.name}:</b> 
                                        {part.name === "نظري" && " كل ساعة فعلية = 1 ساعة معتمدة"}
                                        {part.name === "عملي" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "تمارين" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "سريري" && " كل 3 ساعات فعلية = 1 ساعة معتمدة"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          
                            {/* ✅ زر إضافة جزء (فقط إذا لم تكتمل الأجزاء) */}
                            {courseFormData.courseParts.length < 4 && (
                              <div className="flex gap-2">
                                {!courseFormData.courseParts.find(p => p.name === "نظري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "نظري", actual_hours: 0, rate: 1.0 }]
                                    })}
                                  >
                                    + نظري
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "عملي") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "عملي", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + عملي
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "تمارين") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "تمارين", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + تمارين
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "سريري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "سريري", actual_hours: 0, rate: 0.33 }]
                                    })}
                                  >
                                    + سريري
                                  </Button>
                                )}
                              </div>
                            )}
                          
                            {/* ✅ التحقق من الموازنة */}
                            {(() => {
                              const totalCredited = courseFormData.courseParts.reduce((sum, p) => 
                                sum + Math.round(p.actual_hours * p.rate), 0
                              );
                              const isBalanced = totalCredited === courseFormData.creditHours;
                              const difference = totalCredited - courseFormData.creditHours;
                            
                              return (
                                <Alert className={cn(
                                  "border-2",
                                  isBalanced 
                                    ? "bg-emerald-50 border-emerald-400" 
                                    : difference > 0 
                                    ? "bg-red-50 border-red-400" 
                                    : "bg-amber-50 border-amber-400"
                                )}>
                                  <AlertCircle className="h-5 w-5" />
                                  <AlertDescription className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-sm">
                                        مجموع الساعات المحسوبة من الأجزاء:
                                      </span>
                                      {!isBalanced && (
                                        <span className="text-xs">
                                          {difference > 0 
                                            ? `⚠️ زيادة ${difference} ساعة - قلل الساعات الفعلية` 
                                            : `⚠️ نقص ${Math.abs(difference)} ساعة - زد الساعات الفعلية`
                                          }
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-2xl font-bold",
                                        isBalanced 
                                          ? "text-emerald-700" 
                                          : difference > 0 
                                          ? "text-red-700" 
                                          : "text-amber-700"
                                      )}>
                                        {totalCredited}
                                      </span>
                                      <span className="text-slate-400">/</span>
                                      <span className="text-xl font-bold text-slate-700">
                                        {courseFormData.creditHours}
                                      </span>
                                      {isBalanced ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                          ✓ متوازن
                                        </Badge>
                                      ) : (
                                        <Badge className={cn(
                                          difference > 0 
                                            ? "bg-red-100 text-red-700 border-red-300" 
                                            : "bg-amber-100 text-amber-700 border-amber-300"
                                        )}>
                                          {difference > 0 ? "⚠ زيادة" : "⚠ نقص"}
                                        </Badge>
                                      )}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ==================== القسم 3: المتطلبات (فقط لأنظمة الساعات) ==================== */}
                            {selectedProgram && (selectedProgram.academic_system as string) === 'credit' && (
                              <div className="bg-white p-4 rounded-lg border space-y-4">
                                <h5 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
                                  <Layers className="w-4 h-4 text-indigo-600" />
                                  المتطلبات السابقة والمصاحبة
                                </h5>
                            
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  
                                  {/* المتطلبات السابقة */}
                                  <div className="space-y-3">
                                    <Label className="font-semibold text-indigo-700">
                                      المتطلبات السابقة (Prerequisites)
                                    </Label>
                                    <div className="min-h-[80px] p-3 bg-indigo-50/30 rounded-lg border-2 border-dashed border-indigo-200">
                                      <div className="flex flex-wrap gap-2">
                                        {courseFormData.prerequisiteIds.map(id => {
                                          const course = availableCoursesForPrereq.find(c => c.id === id);
                                          return course ? (
                                            <Badge key={id} variant="secondary" className="gap-1 bg-indigo-100 text-indigo-700">
                                              {course.course_code}
                                              <X 
                                                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                                onClick={() => setCourseFormData({
                                                  ...courseFormData,
                                                  prerequisiteIds: courseFormData.prerequisiteIds.filter(i => i !== id)
                                                })}
                                              />
                                            </Badge>
                                          ) : null;
                                        })}
                                        {courseFormData.prerequisiteIds.length === 0 && (
                                          <span className="text-xs text-slate-400">لا توجد متطلبات سابقة</span>
                                        )}
                                      </div>
                                    </div>
                                    <Button 
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => setIsPrereqSelectOpen(true)}
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                      اختيار متطلب سابق
                                    </Button>
                                  </div>
                            
                                  {/* المتطلبات المصاحبة */}
                                  <div className="space-y-3">
                                    <Label className="font-semibold text-blue-700">
                                      المتطلبات المصاحبة (Corequisites)
                                    </Label>
                                    <div className="min-h-[80px] p-3 bg-blue-50/30 rounded-lg border-2 border-dashed border-blue-200">
                                      <div className="flex flex-wrap gap-2">
                                        {courseFormData.corequisiteIds.map(id => {
                                          const course = availableCoursesForPrereq.find(c => c.id === id);
                                          return course ? (
                                            <Badge key={id} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                              {course.course_code}
                                              <X 
                                                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                                onClick={() => setCourseFormData({
                                                  ...courseFormData,
                                                  corequisiteIds: courseFormData.corequisiteIds.filter(i => i !== id)
                                                })}
                                              />
                                            </Badge>
                                          ) : null;
                                        })}
                                        {courseFormData.corequisiteIds.length === 0 && (
                                          <span className="text-xs text-slate-400">لا توجد متطلبات مصاحبة</span>
                                        )}
                                      </div>
                                    </div>
                                    <Button 
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                      onClick={() => setIsCoreqSelectOpen(true)}
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                      اختيار متطلب مصاحب
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="font-semibold">لغة التدريس</Label>
                              <Select 
                                value={courseFormData.teachingLanguage}
                                onValueChange={(v) => setCourseFormData({
                                  ...courseFormData, 
                                  teachingLanguage: v as "العربية" | "الإنجليزية" | "ثنائي اللغة"
                                })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="العربية">العربية</SelectItem>
                                  <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                                  <SelectItem value="ثنائي اللغة">ثنائي اللغة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>ملاحظات (اختياري)</Label>
                            <Textarea 
                              value={courseFormData.notes}
                              onChange={e => setCourseFormData({...courseFormData, notes: e.target.value})}
                              placeholder="أي ملاحظات إضافية..."
                              className="bg-white min-h-[80px]"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsCourseFormOpen(false)}>
                              إلغاء
                            </Button>
                            <Button type="submit">
                              حفظ المقرر
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* جدول المقررات المحدث */}
                     <div className="border rounded-lg overflow-hidden">
                       <div className="overflow-x-auto">
                         <Table className="bg-white">
                           <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                             <TableRow>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الكود</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">اسم المقرر</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الساعات</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">الأجزاء</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">التصنيف</TableHead>
                               <TableHead className="text-center font-bold text-emerald-700 min-w-[80px]">الوزن %</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">اللغة</TableHead>
                               <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">التوصيف</TableHead>
                               <TableHead className="text-left font-bold text-slate-700 min-w-[120px]">الإجراءات</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {termCourses.length === 0 ? (
                               <TableRow>
                                 <TableCell colSpan={9} className="text-center py-12">
                                   <div className="flex flex-col items-center gap-3">
                                     <div className="bg-slate-100 p-4 rounded-full">
                                       <BookOpen className="w-12 h-12 text-slate-300" />
                                     </div>
                                     <p className="text-slate-400 font-medium">لا توجد مقررات مسجلة</p>
                                     <p className="text-xs text-slate-400">ابدأ بإضافة المقررات لهذا الفصل الدراسي</p>
                                   </div>
                                 </TableCell>
                               </TableRow>
                             ) : (
                               termCourses.map(course => (
                                 <TableRow 
                                   key={course.id}
                                   className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                                 >
                                   {/* الكود */}
                                   <TableCell className="font-mono text-slate-700 font-bold text-sm align-top py-4">
                                     <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                                       {course.course_code}
                                     </div>
                                   </TableCell>
                     
                                   {/* الاسم */}
                                   <TableCell className="align-top py-4">
                                     <div className="font-semibold text-slate-800 text-sm leading-snug">
                                       {course.course_name}
                                     </div>
                                   </TableCell>
                     
                                   {/* الساعات */}
                                   <TableCell className="text-center align-top py-4">
                                     <Badge 
                                       variant="outline" 
                                       className="font-bold bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1"
                                     >
                                       {course.credit_hours}
                                     </Badge>
                                   </TableCell>
                     
                                   {/* الأجزاء */}
                                   <TableCell className="text-center align-top py-4">
                                     <div className="flex flex-col gap-1.5 items-center">
                                       {course.course_parts?.map((part, idx) => (
                                         <div 
                                           key={idx}
                                           className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 w-full max-w-[120px]"
                                         >
                                           <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">
                                             {part.name}
                                           </span>
                                           <span className="text-[10px] text-purple-600 font-medium">
                                             ({part.actual_hours}س)
                                           </span>
                                         </div>
                                       ))}
                                     </div>
                                   </TableCell>
                     
                                   {/* التصنيف */}
                                   <TableCell className="text-center align-top py-4">
                                     <Badge 
                                       variant="outline" 
                                       className={cn(
                                         "text-xs font-medium px-2 py-1 whitespace-nowrap",
                                         course.category === "متطلب جامعة" && "bg-slate-50 text-slate-700 border-slate-300",
                                         course.category === "متطلب كلية" && "bg-blue-50 text-blue-700 border-blue-300",
                                         course.category === "متطلب تخصص إجباري" && "bg-green-50 text-green-700 border-green-300",
                                         course.category === "متطلب تخصص اختياري" && "bg-amber-50 text-amber-700 border-amber-300"
                                       )}
                                     >
                                       {course.category?.replace('متطلب ', '')}
                                     </Badge>
                                   </TableCell>
                     
                                   {/* الوزن */}
                                   <TableCell className="text-center align-top py-4">
                                     <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-sm px-3 py-1">
                                       {course.weight || 0}%
                                     </Badge>
                                   </TableCell>
                     
                                   {/* اللغة */}
                                   <TableCell className="text-center align-top py-4">
                                     <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
                                       <span className="text-lg">
                                         {course.teaching_language === 'العربية' && '🇸🇦'}
                                         {course.teaching_language === 'الإنجليزية' && '🇬🇧'}
                                         {course.teaching_language === 'ثنائي اللغة' && '🌐'}
                                       </span>
                                       <span className="whitespace-nowrap">{course.teaching_language}</span>
                                     </div>
                                   </TableCell>
                     
                                   {/* التوصيف */}
                                   <TableCell className="text-center align-top py-4">
                                     <Button 
                                       size="sm" 
                                       variant="secondary" 
                                       className="gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 whitespace-nowrap" 
                                       onClick={() => handleOpenQuality(course)}
                                     >
                                       <Target className="w-3.5 h-3.5" /> 
                                       <span className="hidden sm:inline">التوصيف</span>
                                     </Button>
                                   </TableCell>
                     
                                   {/* الإجراءات */}
                                   <TableCell className="text-left align-top py-4">
                                     <div className="flex gap-1 justify-end flex-wrap">
                                       {can('study_plan.update') && (
                                         <Button 
                                           size="sm" 
                                           variant="ghost"
                                           className="hover:bg-blue-50 hover:text-blue-700 h-8 w-8 p-0"
                                           onClick={() => handleEditCourse(course)}
                                           title="تعديل"
                                         >
                                           <Edit className="w-4 h-4" />
                                         </Button>
                                       )}
                     
                                       {can('study_plan.delete') && (
                                         <Button 
                                           size="sm" 
                                           variant="ghost" 
                                           className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                           onClick={() => handleDeleteCourse(course.id)}
                                           title="حذف"
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
                       </div>
                     </div>

                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* نظام الفصول + بلوكات */}
          {selectedProgram && selectedProgram.academic_system === 'semester' && selectedProgram.block_based && (
            <div className="space-y-6">
          
              {/* أولاً: إدارة المستويات (نفس منطق نظام الفصول) */}
              <Card className="border shadow-sm bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-indigo-600" /> مستويات النظام التكاملي
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleAddLevel} className="h-8 border-indigo-200 hover:bg-indigo-50">
                      <Plus className="w-3.5 h-3.5 mr-1" /> مستوى جديد
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* فورم إضافة/تعديل المستوى (يستخدم نفس الحالة levelFormData) */}
                  {isLevelFormOpen && (
                    <div className="bg-slate-50 p-4 rounded-lg border mb-4 animate-in zoom-in-95">
                       <form onSubmit={handleSubmitLevel} className="flex items-end gap-3">
                          <div className="space-y-1.5 flex-1">
                            <Label className="text-xs">رقم المستوى</Label>
                            <Input 
                              type="number" 
                              value={levelFormData.levelNumber}
                              onChange={e => setLevelFormData({levelNumber: +e.target.value})}
                              className="bg-white h-9"
                              required
                            />
                          </div>
                          <Button size="sm" type="submit" className="h-9 bg-indigo-600 hover:bg-indigo-700">حفظ</Button>
                          <Button size="icon" variant="ghost" onClick={() => setIsLevelFormOpen(false)} className="h-9 w-9">
                            <X className="w-4 h-4" />
                          </Button>
                       </form>
                    </div>
                  )}
          
                  <div className="flex flex-wrap gap-3">
                    {programLevels.map(lvl => (
                      <div 
                        key={lvl.id} 
                        onClick={() => setSelectedLevel(lvl)} 
                        className={cn(
                          "min-w-[140px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative", 
                          selectedLevel?.id === lvl.id 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-indigo-200"
                        )}
                      >
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full mb-1", selectedLevel?.id === lvl.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                          LEVEL
                        </span>
                        <div className="font-bold text-xl text-slate-800">{lvl.level_number}</div>
                        
                        {/* أزرار التحكم تظهر عند الهوفر */}
                        <div className="flex gap-1 mt-2">
                           <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-indigo-600" onClick={(e)=>{e.stopPropagation(); handleEditLevel(lvl)}}>
                              <Edit className="w-3 h-3" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-red-600" onClick={(e)=>{e.stopPropagation(); handleDeleteLevel(lvl.id)}}>
                              <Trash2 className="w-3 h-3" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          
              {/* ثانياً: إدارة البلوكات (تظهر عند اختيار مستوى) */}
              {selectedLevel && (
                <Card className="border shadow-sm bg-white animate-in slide-in-from-bottom-4">
                  <CardHeader className="bg-indigo-50/30 border-b py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                        <Box className="w-4 h-4 text-indigo-600" /> بلوكات المستوى {selectedLevel.level_number}
                      </CardTitle>
                      <Button size="sm" onClick={handleAddBlock} className="h-8 bg-indigo-600">
                        <Plus className="w-3.5 h-3.5 mr-1" /> إضافة بلوك
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    
                    {isBlockFormOpen && (
                      <form onSubmit={handleSubmitBlock} className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* اسم البلوك ورقم البلوك */}
                          <div className="md:col-span-2 space-y-2">
                            <Label>اسم البلوك</Label>
                            <Input 
                              value={blockFormData.blockName}
                              onChange={(e) => setBlockFormData({...blockFormData, blockName: e.target.value})}
                              className="bg-white" required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم البلوك</Label>
                            <Input 
                              type="number"
                              value={blockFormData.blockNumber}
                              onChange={(e) => setBlockFormData({...blockFormData, blockNumber: Number(e.target.value)})}
                              className="bg-white" 
                            />
                          </div>
                    
                          {/* حقل الساعات - يظهر فقط في نظام الساعات */}
                          {(selectedProgram?.academic_system as string) === 'credit' && (
                            <div className="space-y-2">
                              <Label>الساعات المعتمدة</Label>
                              <Input 
                                type="number"
                                value={blockFormData.credit_hours}
                                onChange={(e) => setBlockFormData({...blockFormData, credit_hours: Number(e.target.value)})}
                                className="bg-white" 
                              />
                            </div>
                          )}
                    
                          {/* النوع والأسابيع والوزن */}
                          <div className="space-y-2">
                            <Label>نوع البلوك</Label>
                            <Select value={blockFormData.type} onValueChange={(val) => setBlockFormData({...blockFormData, type: val})}>
                              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compulsory">إجباري</SelectItem>
                                <SelectItem value="elective">اختياري</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>عدد الأسابيع</Label>
                            <Input type="number" value={blockFormData.weeks} onChange={(e) => setBlockFormData({...blockFormData, weeks: Number(e.target.value)})} className="bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label>الوزن (%)</Label>
                            <Input type="number" value={blockFormData.weight} onChange={(e) => setBlockFormData({...blockFormData, weight: Number(e.target.value)})} className="bg-white" />
                          </div>
                        </div>
                    
                        <div className="flex justify-end gap-2 pt-4 border-t border-indigo-100">
                          <Button type="button" variant="outline" size="sm" onClick={() => setIsBlockFormOpen(false)}>إلغاء</Button>
                          <Button type="submit" size="sm" className="bg-indigo-600">حفظ البيانات</Button>
                        </div>
                      </form>
                    )}
              
                    {levelBlocks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {levelBlocks.map((block) => (
                        <div key={block.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow group relative border-r-4 border-r-indigo-500">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
                              {block.type === 'compulsory' ? 'إجباري' : 'اختياري'}
                            </Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button onClick={() => handleEditBlock(block)} size="icon" variant="ghost" className="h-7 w-7 text-indigo-600">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button onClick={() => handleDeleteBlock(block.id)} size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 mb-1">{block.block_name}</h3>
                          <div className="space-y-1.5">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> المدة: {block.weeks} أسابيع
                            </p>
                            {/* <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> الساعات: {block.credit_hours} ساعة
                            </p> */}
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Target className="w-3 h-3" /> الوزن: {block.weight}%
                            </p>
                          </div>
                          
                          <Button 
                            variant="secondary" 
                            className={cn(
                              "w-full mt-4 h-8 text-xs bg-slate-100 transition-colors",
                              selectedBlock?.id === block.id ? "bg-indigo-600 text-white" : "group-hover:bg-indigo-600 group-hover:text-white"
                            )}
                            onClick={() => setSelectedBlock(block)}
                          >
                            عرض المقررات داخل البلوك
                          </Button>
                        </div>
                      ))}
                    </div>
                    ) : (
                      !isBlockFormOpen && (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl mt-4">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Box className="text-slate-300 w-6 h-6" />
                          </div>
                          <p className="text-slate-400 text-sm">لا توجد بلوكات مضافة لهذا المستوى بعد</p>
                        </div>
                      )
                    )}
              
                  </CardContent>
                </Card>
              )}
          
              {/* ثالثاً: المقررات (تظهر عند اختيار بلوك معين) */}
              {selectedBlock && (
                <Card className="border-t-4 border-t-indigo-600 shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                  <CardHeader className="bg-indigo-50/50 border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg text-slate-800">المقررات الدراسية</CardTitle>
                        <CardDescription>
                          المستوى {selectedLevel?.level_number} - {selectedBlock.block_name}
                        </CardDescription>
                      </div>
                      {can('study_plan.create') && (
                        <Button onClick={handleAddCourse} className="shadow-sm">
                          <Plus className="w-4 h-4 mr-2" /> إضافة مقرر
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    
                    {/* نموذج إضافة/تعديل المقرر */}
                    {isCourseFormOpen && (
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                        <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">
                          {editingCourse ? "تعديل المقرر" : "إضافة مقرر جديد"}
                        </h4>
                        <form onSubmit={handleSubmitCourse} className="space-y-6">
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>كود المقرر *</Label>
                              <Input 
                                value={courseFormData.courseCode}
                                onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})}
                                placeholder="CS101"
                                className="bg-white font-mono"
                                required
                              />
                            </div>
              
                            <div className="space-y-2 md:col-span-2">
                              <Label>اسم المقرر *</Label>
                              <Input 
                                value={courseFormData.courseName}
                                onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})}
                                placeholder="مثال: مقدمة في البرمجة"
                                className="bg-white"
                                required
                              />
                            </div>
              
                            <div className="space-y-2">
                              <Label>الساعات المعتمدة *</Label>
                              <Input 
                                type="number"
                                min="1"
                                value={courseFormData.creditHours}
                                onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})}
                                className="bg-white"
                                required
                              />
                            </div>
              
                            <div className="space-y-2">
                              <Label className="text-emerald-700 font-bold">وزن المقرر % (من البرنامج)</Label>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={courseFormData.weight}
                                onChange={e => setCourseFormData({...courseFormData, weight: +e.target.value})}
                                placeholder="0"
                                className="bg-emerald-50/50 border-emerald-200"
                              />
                              <p className="text-xs text-slate-500 leading-relaxed">
                                مجموع أوزان البرنامج: <b>{courseWeightSummary.programWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المستخدم للمقررات: <b>{courseWeightSummary.usedCourseWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المتبقي: <b className="text-emerald-700">{courseWeightSummary.remainingWeight.toFixed(2)}%</b>
                              </p>
                            </div>
              
                            <div className="space-y-2">
                              <Label>نوع المتطلب</Label>
                              <Select 
                                value={courseFormData.category}
                                onValueChange={v => setCourseFormData({...courseFormData, category: v as "متطلب جامعة" | "متطلب كلية" | "متطلب تخصص إجباري" | "متطلب تخصص اختياري"})}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="متطلب جامعة">متطلب جامعة</SelectItem>
                                  <SelectItem value="متطلب كلية">متطلب كلية</SelectItem>
                                  <SelectItem value="متطلب تخصص إجباري">متطلب تخصص (إجباري)</SelectItem>
                                  <SelectItem value="متطلب تخصص اختياري">متطلب تخصص (اختياري)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
              
                          {/* القسم 2: أجزاء المقرر */}
                          <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <h5 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600" />
                                أجزاء المقرر والساعات المعتمدة
                              </h5>
                            </div>
                          
                            {/* الساعات المعتمدة (ثابتة) */}
                            <Alert className="bg-blue-50 border-2 border-blue-400">
                              <Clock className="h-5 w-5 text-blue-700" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-900 text-base">
                                    إجمالي الساعات المعتمدة للمقرر:
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Input 
                                      type="number"
                                      min="1"
                                      max="10"
                                      step="1"
                                      value={courseFormData.creditHours}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setCourseFormData({...courseFormData, creditHours: val});
                                      }}
                                      className="w-24 h-10 font-bold text-xl text-center bg-white border-2 border-blue-300 text-blue-700"
                                      required
                                    />
                                    <span className="text-blue-800 font-bold">ساعة</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                            
                            {/* تنبيه */}
                            <Alert className="bg-amber-50 border-amber-300">
                              <AlertCircle className="h-4 w-4 text-amber-700" />
                              <AlertDescription className="text-xs text-amber-800">
                                💡 <b>ملاحظة:</b> يجب أن يساوي مجموع الساعات المحسوبة من الأجزاء الساعات المعتمدة المدخلة أعلاه.
                              </AlertDescription>
                            </Alert>
                          
                            {/* عرض الأجزاء */}
                            <div className="space-y-3">
                              {courseFormData.courseParts.map((part, idx) => {
                                const creditedHours = Math.round(part.actual_hours * part.rate);
                                
                                return (
                                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-3">
                                    
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary" className="shrink-0 min-w-[80px] justify-center">
                                        {part.name}
                                      </Badge>
                                      
                                      {/* الساعات الفعلية */}
                                      <div className="flex items-center gap-2 flex-1">
                                        <Label className="text-xs text-slate-600 w-28">الساعات الفعلية:</Label>
                                        <Input 
                                          type="number"
                                          min="0"
                                          step={
                                            part.name === "نظري" ? 1 :
                                            part.name === "عملي" ? 2 :
                                            part.name === "تمارين" ? 2 :
                                            part.name === "سريري" ? 3 : 1
                                          }
                                          value={part.actual_hours}
                                          onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            
                                            if (part.name === "عملي" || part.name === "تمارين") {
                                              val = Math.floor(val / 2) * 2;
                                            } else if (part.name === "سريري") {
                                              val = Math.floor(val / 3) * 3;
                                            }
                                            
                                            handleUpdateCoursePart(idx, 'actual_hours', val);
                                          }}
                                          className="bg-white h-9 w-24 text-center font-semibold"
                                          placeholder={
                                            part.name === "نظري" ? "1, 2, 3..." :
                                            part.name === "عملي" ? "2, 4, 6..." :
                                            part.name === "تمارين" ? "2, 4, 6..." :
                                            part.name === "سريري" ? "3, 6, 9..." : "0"
                                          }
                                        />
                                        <span className="text-xs text-slate-500">ساعة</span>
                                      </div>
                              
                                      {/* العرض التوضيحي */}
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {part.name === "سريري" ? "÷3" : part.name === "نظري" ? "×1" : "÷2"}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                        <Badge className={cn(
                                          "font-bold min-w-[100px] justify-center",
                                          creditedHours <= courseFormData.creditHours 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        )}>
                                          {creditedHours} ساعة معتمدة
                                        </Badge>
                                      </div>
                              
                                      {/* زر الحذف */}
                                      {courseFormData.courseParts.length > 1 && (
                                        <Button 
                                          type="button"
                                          size="icon" 
                                          variant="ghost"
                                          className="text-red-500 hover:bg-red-50 shrink-0"
                                          onClick={() => handleRemoveCoursePart(idx)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                              
                                    {/* شرح المعدل */}
                                    <div className="text-xs text-slate-500 bg-white p-2 rounded border flex items-center gap-2">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        <b>{part.name}:</b> 
                                        {part.name === "نظري" && " كل ساعة فعلية = 1 ساعة معتمدة"}
                                        {part.name === "عملي" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "تمارين" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "سريري" && " كل 3 ساعات فعلية = 1 ساعة معتمدة"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          
                            {/* زر إضافة جزء */}
                            {courseFormData.courseParts.length < 4 && (
                              <div className="flex gap-2">
                                {!courseFormData.courseParts.find(p => p.name === "نظري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "نظري", actual_hours: 0, rate: 1.0 }]
                                    })}
                                  >
                                    + نظري
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "عملي") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "عملي", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + عملي
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "تمارين") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "تمارين", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + تمارين
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "سريري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "سريري", actual_hours: 0, rate: 0.33 }]
                                    })}
                                  >
                                    + سريري
                                  </Button>
                                )}
                              </div>
                            )}
                          
                            {/* التحقق من الموازنة */}
                            {(() => {
                              const totalCredited = courseFormData.courseParts.reduce((sum, p) => 
                                sum + Math.round(p.actual_hours * p.rate), 0
                              );
                              const isBalanced = totalCredited === courseFormData.creditHours;
                              const difference = totalCredited - courseFormData.creditHours;
                            
                              return (
                                <Alert className={cn(
                                  "border-2",
                                  isBalanced 
                                    ? "bg-emerald-50 border-emerald-400" 
                                    : difference > 0 
                                    ? "bg-red-50 border-red-400" 
                                    : "bg-amber-50 border-amber-400"
                                )}>
                                  <AlertCircle className="h-5 w-5" />
                                  <AlertDescription className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-sm">
                                        مجموع الساعات المحسوبة من الأجزاء:
                                      </span>
                                      {!isBalanced && (
                                        <span className="text-xs">
                                          {difference > 0 
                                            ? `⚠️ زيادة ${difference} ساعة - قلل الساعات الفعلية` 
                                            : `⚠️ نقص ${Math.abs(difference)} ساعة - زد الساعات الفعلية`
                                          }
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-2xl font-bold",
                                        isBalanced 
                                          ? "text-emerald-700" 
                                          : difference > 0 
                                          ? "text-red-700" 
                                          : "text-amber-700"
                                      )}>
                                        {totalCredited}
                                      </span>
                                      <span className="text-slate-400">/</span>
                                      <span className="text-xl font-bold text-slate-700">
                                        {courseFormData.creditHours}
                                      </span>
                                      {isBalanced ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                          ✓ متوازن
                                        </Badge>
                                      ) : (
                                        <Badge className={cn(
                                          difference > 0 
                                            ? "bg-red-100 text-red-700 border-red-300" 
                                            : "bg-amber-100 text-amber-700 border-amber-300"
                                        )}>
                                          {difference > 0 ? "⚠ زيادة" : "⚠ نقص"}
                                        </Badge>
                                      )}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              );
                            })()}
                          </div>
              
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-semibold">لغة التدريس</Label>
                              <Select 
                                value={courseFormData.teachingLanguage}
                                onValueChange={(v) => setCourseFormData({
                                  ...courseFormData, 
                                  teachingLanguage: v as "العربية" | "الإنجليزية" | "ثنائي اللغة"
                                })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="العربية">العربية</SelectItem>
                                  <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                                  <SelectItem value="ثنائي اللغة">ثنائي اللغة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
              
                            {/* ملاحظات */}
                            <div className="space-y-2">
                              <Label>ملاحظات (اختياري)</Label>
                              <Input 
                                value={courseFormData.notes}
                                onChange={e => setCourseFormData({...courseFormData, notes: e.target.value})}
                                placeholder="ملاحظات إضافية..."
                                className="bg-white"
                              />
                            </div>
                          </div>
              
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsCourseFormOpen(false)}>
                              إلغاء
                            </Button>
                            <Button type="submit">
                              حفظ المقرر
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
              
                    {/* جدول المقررات المحدث - نفس تصميم الفصول */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table className="bg-white">
                          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <TableRow>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الكود</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[150px]">اسم المقرر</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الساعات</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">الأجزاء</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">التصنيف</TableHead>
                              <TableHead className="text-center font-bold text-emerald-700 min-w-[80px]">الوزن %</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">اللغة</TableHead>
                              <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">التوصيف</TableHead>
                              <TableHead className="text-left font-bold text-slate-700 min-w-[120px]">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blockCourses.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-12">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="bg-slate-100 p-4 rounded-full">
                                      <BookOpen className="w-12 h-12 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium">لا توجد مقررات مسجلة</p>
                                    <p className="text-xs text-slate-400">ابدأ بإضافة المقررات لهذا البلوك</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              blockCourses.map(course => (
                                <TableRow 
                                  key={course.id}
                                  className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                                >
                                  {/* الكود */}
                                  <TableCell className="font-mono text-slate-700 font-bold text-sm align-top py-4">
                                    <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                                      {course.course_code}
                                    </div>
                                  </TableCell>
                        
                                  {/* الاسم */}
                                  <TableCell className="align-top py-4">
                                    <div className="font-semibold text-slate-800 text-sm leading-snug">
                                      {course.course_name}
                                    </div>
                                  </TableCell>
                        
                                  {/* الساعات */}
                                  <TableCell className="text-center align-top py-4">
                                    <Badge 
                                      variant="outline" 
                                      className="font-bold bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1"
                                    >
                                      {course.credit_hours}
                                    </Badge>
                                  </TableCell>
                        
                                  {/* الأجزاء */}
                                  <TableCell className="text-center align-top py-4">
                                    <div className="flex flex-col gap-1.5 items-center">
                                      {course.course_parts?.map((part, idx) => (
                                        <div 
                                          key={idx}
                                          className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 w-full max-w-[120px]"
                                        >
                                          <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">
                                            {part.name}
                                          </span>
                                          <span className="text-[10px] text-purple-600 font-medium">
                                            ({part.actual_hours}س)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                        
                                  {/* التصنيف */}
                                  <TableCell className="text-center align-top py-4">
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs font-medium px-2 py-1 whitespace-nowrap",
                                        course.category === "متطلب جامعة" && "bg-slate-50 text-slate-700 border-slate-300",
                                        course.category === "متطلب كلية" && "bg-blue-50 text-blue-700 border-blue-300",
                                        course.category === "متطلب تخصص إجباري" && "bg-green-50 text-green-700 border-green-300",
                                        course.category === "متطلب تخصص اختياري" && "bg-amber-50 text-amber-700 border-amber-300"
                                      )}
                                    >
                                      {course.category?.replace('متطلب ', '')}
                                    </Badge>
                                  </TableCell>
                        
                                  {/* الوزن */}
                                  <TableCell className="text-center align-top py-4">
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-sm px-3 py-1">
                                      {course.weight || 0}%
                                    </Badge>
                                  </TableCell>
                        
                                  {/* اللغة */}
                                  <TableCell className="text-center align-top py-4">
                                    <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
                                      <span className="text-lg">
                                        {course.teaching_language === 'العربية' && '🇸🇦'}
                                        {course.teaching_language === 'الإنجليزية' && '🇬🇧'}
                                        {course.teaching_language === 'ثنائي اللغة' && '🌐'}
                                      </span>
                                      <span className="whitespace-nowrap">{course.teaching_language}</span>
                                    </div>
                                  </TableCell>
                        
                                  {/* التوصيف */}
                                  <TableCell className="text-center align-top py-4">
                                    <Button 
                                      size="sm" 
                                      variant="secondary" 
                                      className="gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 whitespace-nowrap" 
                                      onClick={() => handleOpenQuality(course)}
                                    >
                                      <Target className="w-3.5 h-3.5" /> 
                                      <span className="hidden sm:inline">التوصيف</span>
                                    </Button>
                                  </TableCell>
                        
                                  {/* الإجراءات */}
                                  <TableCell className="text-left align-top py-4">
                                    <div className="flex gap-1 justify-end flex-wrap">
                                      {can('study_plan.update') && (
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          className="hover:bg-blue-50 hover:text-blue-700 h-8 w-8 p-0"
                                          onClick={() => handleEditCourse(course)}
                                          title="تعديل"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      )}
                        
                                      {can('study_plan.delete') && (
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                          onClick={() => handleDeleteCourse(course.id)}
                                          title="حذف"
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
                      </div>
                    </div>
              
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Dialog open={isPrereqModalOpen} onOpenChange={setIsPrereqModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>اختيار المتطلبات السابقة</DialogTitle>
                <DialogDescription>اختر البلوكات التي يجب على الطالب اجتيازها قبل هذا البلوك</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto p-2">
                {levelBlocks
                  .filter(b => b.id !== editingBlock?.id) // منع اختيار البلوك لنفسه كمتطلب
                  .map(block => (
                  <div key={block.id} className="flex items-center space-x-3 space-x-reverse p-2 hover:bg-slate-50 rounded-lg border">
                    <Switch 
                      checked={selectedPrerequisites.includes(block.id)}
                      onCheckedChange={(checked) => {
                        if(checked) setSelectedPrerequisites([...selectedPrerequisites, block.id]);
                        else setSelectedPrerequisites(selectedPrerequisites.filter(id => id !== block.id));
                      }}
                    />
                    <Label>{block.block_name}</Label>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsPrereqModalOpen(false)}>تم</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ==========================================
              نظام الساعات المعتمدة (بدون بلوكات)
              ========================================== */}
          {selectedProgram && selectedProgram.academic_system === 'credit' && !selectedProgram.block_based && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              
              {/* بطاقة معلومات البرنامج */}
              <Card className="border-t-4 border-t-blue-600 shadow-md bg-gradient-to-br from-blue-50 to-white sticky top-6 z-10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-blue-900">
                          نظام الساعات المعتمدة
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedProgram.name}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
          
                  {/* ✅ إحصائيات الساعات */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    {/* الإجمالي */}
                    <div className="bg-white px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm">
                      <div className="text-xs text-slate-500 font-medium mb-1">إجمالي الساعات</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {selectedProgram.total_hours || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">ساعة معتمدة</div>
                    </div>
          
                    {/* المضافة */}
                    <div className={cn(
                      "px-4 py-3 rounded-lg border-2 shadow-sm",
                      (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) > (selectedProgram.total_hours || 0))
                        ? "bg-red-50 border-red-200"
                        : "bg-emerald-50 border-emerald-200"
                    )}>
                      <div className="text-xs text-slate-500 font-medium mb-1">المضافة</div>
                      <div className={cn(
                        "text-2xl font-bold",
                        (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) > (selectedProgram.total_hours || 0))
                          ? "text-red-700"
                          : "text-emerald-700"
                      )}>
                        {categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">من {selectedProgram.total_hours || 0}</div>
                    </div>
          
                    {/* المتبقي */}
                    <div className={cn(
                      "px-4 py-3 rounded-lg border-2 shadow-sm",
                      (selectedProgram.total_hours || 0) - (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0)) < 0
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    )}>
                      <div className="text-xs text-slate-500 font-medium mb-1">المتبقي</div>
                      <div className={cn(
                        "text-2xl font-bold",
                        (selectedProgram.total_hours || 0) - (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0)) < 0
                          ? "text-red-700"
                          : "text-amber-700"
                      )}>
                        {Math.max(0, (selectedProgram.total_hours || 0) - (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0)))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">ساعة</div>
                    </div>
          
                    {/* النسبة المئوية */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border-2 border-indigo-200 shadow-sm">
                      <div className="text-xs text-slate-500 font-medium mb-1">النسبة المئوية</div>
                      <div className="text-2xl font-bold text-indigo-700">
                        {selectedProgram.total_hours 
                          ? Math.round((categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) / (selectedProgram.total_hours || 1)) * 100)
                          : 0}%
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) > (selectedProgram.total_hours || 0))
                              ? "bg-red-500"
                              : "bg-emerald-500"
                          )}
                          style={{
                            width: `${Math.min(100, selectedProgram.total_hours 
                              ? (categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) / (selectedProgram.total_hours || 1)) * 100
                              : 0)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
          
                  {/* ⚠️ تنبيه إذا تجاوزت */}
                  {(categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0) > (selectedProgram.total_hours || 0)) && (
                    <Alert className="mt-4 bg-red-50 border-red-300">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-red-700">
                        <b>⚠️ تجاوزت الساعات المسموحة!</b>
                        <p className="text-sm mt-1">
                          الساعات المضافة ({categoryCourses.reduce((sum, c) => sum + c.credit_hours, 0)}) تتجاوز المسموح ({selectedProgram.total_hours}).
                          يرجى تعديل ساعات البرنامج أولاً.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
              </Card>
          
              {/* تصنيفات المقررات */}
              <Card className="border shadow-sm bg-white">
                <CardHeader className="bg-blue-50/50 border-b pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <CardTitle className="text-lg text-slate-800">المقررات الدراسية</CardTitle>
                      <CardDescription>تصنيف حسب نوع المتطلب</CardDescription>
                    </div>
                    {can('study_plan.create') && (
                      <Button 
                        onClick={handleAddCourse}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" /> إضافة مقرر
                      </Button>
                    )}
                  </div>
              
                  {/* ✅ Tabs للتصنيفات */}
                  <div className="flex flex-wrap gap-2 border-b pb-3">
                    {/* الكل */}
                    <button
                      onClick={() => setActiveCourseCategory(null)}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                        activeCourseCategory === null
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        📊 الكل
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-1",
                            activeCourseCategory === null ? "bg-blue-400 text-white" : ""
                          )}
                        >
                          {categoryCourses.length}
                        </Badge>
                      </span>
                    </button>
              
                    {/* متطلب جامعة */}
                    <button
                      onClick={() => setActiveCourseCategory('متطلب جامعة')}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                        activeCourseCategory === 'متطلب جامعة'
                          ? "bg-slate-600 text-white border-slate-600 shadow-md"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        🏫 جامعة
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-1",
                            activeCourseCategory === 'متطلب جامعة' ? "bg-slate-400 text-white" : "bg-slate-100"
                          )}
                        >
                          {categoryCourses.filter(c => c.category === 'متطلب جامعة').length}
                        </Badge>
                      </span>
                    </button>
              
                    {/* متطلب كلية */}
                    <button
                      onClick={() => setActiveCourseCategory('متطلب كلية')}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                        activeCourseCategory === 'متطلب كلية'
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-white text-blue-700 border-blue-200 hover:border-blue-400"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        🏢 كلية
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-1",
                            activeCourseCategory === 'متطلب كلية' ? "bg-blue-400 text-white" : "bg-blue-100"
                          )}
                        >
                          {categoryCourses.filter(c => c.category === 'متطلب كلية').length}
                        </Badge>
                      </span>
                    </button>
              
                    {/* متطلب تخصص إجباري */}
                    <button
                      onClick={() => setActiveCourseCategory('متطلب تخصص إجباري')}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                        activeCourseCategory === 'متطلب تخصص إجباري'
                          ? "bg-green-600 text-white border-green-600 shadow-md"
                          : "bg-white text-green-700 border-green-200 hover:border-green-400"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        ⭐ إجباري
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-1",
                            activeCourseCategory === 'متطلب تخصص إجباري' ? "bg-green-400 text-white" : "bg-green-100"
                          )}
                        >
                          {categoryCourses.filter(c => c.category === 'متطلب تخصص إجباري').length}
                        </Badge>
                      </span>
                    </button>
              
                    {/* متطلب تخصص اختياري */}
                    <button
                      onClick={() => setActiveCourseCategory('متطلب تخصص اختياري')}
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                        activeCourseCategory === 'متطلب تخصص اختياري'
                          ? "bg-amber-600 text-white border-amber-600 shadow-md"
                          : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        ♦️ اختياري
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-1",
                            activeCourseCategory === 'متطلب تخصص اختياري' ? "bg-amber-400 text-white" : "bg-amber-100"
                          )}
                        >
                          {categoryCourses.filter(c => c.category === 'متطلب تخصص اختياري').length}
                        </Badge>
                      </span>
                    </button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  
                  {/* نموذج إضافة/تعديل المقرر */}
                  {isCourseFormOpen && (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                      <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">
                        {editingCourse ? "تعديل المقرر" : "إضافة مقرر جديد"}
                      </h4>
                      <form onSubmit={handleSubmitCourse} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>كود المقرر *</Label>
                            <Input 
                              value={courseFormData.courseCode}
                              onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})}
                              placeholder="CS101"
                              className="bg-white font-mono"
                              required
                            />
                          </div>
          
                          <div className="space-y-2 md:col-span-2">
                            <Label>اسم المقرر *</Label>
                            <Input 
                              value={courseFormData.courseName}
                              onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})}
                              placeholder="مثال: مقدمة في البرمجة"
                              className="bg-white"
                              required
                            />
                          </div>
          
                          <div className="space-y-2">
                            <Label>الساعات المعتمدة *</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={courseFormData.creditHours}
                              onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})}
                              className="bg-white"
                              required
                            />
                          </div>
          
                          <div className="space-y-2">
                            <Label className="text-emerald-700 font-bold">وزن المقرر % (من البرنامج)</Label>
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              value={courseFormData.weight}
                              onChange={e => setCourseFormData({...courseFormData, weight: +e.target.value})}
                              placeholder="0"
                              className="bg-emerald-50/50 border-emerald-200"
                            />
                              <p className="text-xs text-slate-500 leading-relaxed">
                                مجموع أوزان البرنامج: <b>{courseWeightSummary.programWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المستخدم للمقررات: <b>{courseWeightSummary.usedCourseWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المتبقي: <b className="text-emerald-700">{courseWeightSummary.remainingWeight.toFixed(2)}%</b>
                              </p>
                          </div>
          
                          <div className="space-y-2">
                            <Label>نوع المتطلب</Label>
                            <Select 
                              value={courseFormData.category}
                              onValueChange={v => setCourseFormData({...courseFormData, category: v as any})}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="متطلب جامعة">متطلب جامعة</SelectItem>
                                <SelectItem value="متطلب كلية">متطلب كلية</SelectItem>
                                <SelectItem value="متطلب تخصص إجباري">متطلب تخصص (إجباري)</SelectItem>
                                <SelectItem value="متطلب تخصص اختياري">متطلب تخصص (اختياري)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
          
                        {/* أجزاء المقرر */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h5 className="font-semibold text-slate-700 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-purple-600" />
                              أجزاء المقرر والساعات المعتمدة
                            </h5>
                          </div>
                        
                          {/* الساعات المعتمدة */}
                          <Alert className="bg-blue-50 border-2 border-blue-400">
                            <Clock className="h-5 w-5 text-blue-700" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-900 text-base">
                                  إجمالي الساعات المعتمدة للمقرر:
                                </span>
                                <div className="flex items-center gap-3">
                                  <Input 
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={courseFormData.creditHours}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setCourseFormData({...courseFormData, creditHours: val});
                                    }}
                                    className="w-24 h-10 font-bold text-xl text-center bg-white border-2 border-blue-300 text-blue-700"
                                    required
                                  />
                                  <span className="text-blue-800 font-bold">ساعة</span>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        
                          {/* تنبيه */}
                          <Alert className="bg-amber-50 border-amber-300">
                            <AlertCircle className="h-4 w-4 text-amber-700" />
                            <AlertDescription className="text-xs text-amber-800">
                              💡 <b>ملاحظة:</b> يجب أن يساوي مجموع الساعات المحسوبة من الأجزاء الساعات المعتمدة.
                            </AlertDescription>
                          </Alert>
                        
                          {/* عرض الأجزاء */}
                          <div className="space-y-3">
                            {courseFormData.courseParts.map((part, idx) => {
                              const creditedHours = Math.round(part.actual_hours * part.rate);
                              
                              return (
                                <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-3">
                                  
                                  <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="shrink-0 min-w-[80px] justify-center">
                                      {part.name}
                                    </Badge>
                                    
                                    <div className="flex items-center gap-2 flex-1">
                                      <Label className="text-xs text-slate-600 w-28">الساعات الفعلية:</Label>
                                      <Input 
                                        type="number"
                                        min="0"
                                        step={
                                          part.name === "نظري" ? 1 :
                                          part.name === "عملي" ? 2 :
                                          part.name === "تمارين" ? 2 :
                                          part.name === "سريري" ? 3 : 1
                                        }
                                        value={part.actual_hours}
                                        onChange={(e) => {
                                          let val = parseInt(e.target.value) || 0;
                                          
                                          if (part.name === "عملي" || part.name === "تمارين") {
                                            val = Math.floor(val / 2) * 2;
                                          } else if (part.name === "سريري") {
                                            val = Math.floor(val / 3) * 3;
                                          }
                                          
                                          handleUpdateCoursePart(idx, 'actual_hours', val);
                                        }}
                                        className="bg-white h-9 w-24 text-center font-semibold"
                                      />
                                      <span className="text-xs text-slate-500">ساعة</span>
                                    </div>
                          
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {part.name === "سريري" ? "÷3" : part.name === "نظري" ? "×1" : "÷2"}
                                      </Badge>
                                      <ChevronRight className="w-4 h-4 text-slate-400" />
                                      <Badge className={cn(
                                        "font-bold min-w-[100px] justify-center",
                                        creditedHours <= courseFormData.creditHours 
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      )}>
                                        {creditedHours} ساعة
                                      </Badge>
                                    </div>
                          
                                    {courseFormData.courseParts.length > 1 && (
                                      <Button 
                                        type="button"
                                        size="icon" 
                                        variant="ghost"
                                        className="text-red-500 hover:bg-red-50 shrink-0"
                                        onClick={() => handleRemoveCoursePart(idx)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                          
                                  <div className="text-xs text-slate-500 bg-white p-2 rounded border flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      <b>{part.name}:</b> 
                                      {part.name === "نظري" && " كل ساعة فعلية = 1 ساعة معتمدة"}
                                      {part.name === "عملي" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                      {part.name === "تمارين" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                      {part.name === "سريري" && " كل 3 ساعات فعلية = 1 ساعة معتمدة"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        
                          {/* زر إضافة جزء */}
                          {courseFormData.courseParts.length < 4 && (
                            <div className="flex gap-2">
                              {!courseFormData.courseParts.find(p => p.name === "نظري") && (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setCourseFormData({
                                    ...courseFormData,
                                    courseParts: [...courseFormData.courseParts, { name: "نظري", actual_hours: 0, rate: 1.0 }]
                                  })}
                                >
                                  + نظري
                                </Button>
                              )}
                              {!courseFormData.courseParts.find(p => p.name === "عملي") && (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setCourseFormData({
                                    ...courseFormData,
                                    courseParts: [...courseFormData.courseParts, { name: "عملي", actual_hours: 0, rate: 0.5 }]
                                  })}
                                >
                                  + عملي
                                </Button>
                              )}
                              {!courseFormData.courseParts.find(p => p.name === "تمارين") && (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setCourseFormData({
                                    ...courseFormData,
                                    courseParts: [...courseFormData.courseParts, { name: "تمارين", actual_hours: 0, rate: 0.5 }]
                                  })}
                                >
                                  + تمارين
                                </Button>
                              )}
                              {!courseFormData.courseParts.find(p => p.name === "سريري") && (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setCourseFormData({
                                    ...courseFormData,
                                    courseParts: [...courseFormData.courseParts, { name: "سريري", actual_hours: 0, rate: 0.33 }]
                                  })}
                                >
                                  + سريري
                                </Button>
                              )}
                            </div>
                          )}
                        
                          {/* التحقق من الموازنة */}
                          {(() => {
                            const totalCredited = courseFormData.courseParts.reduce((sum, p) => 
                              sum + Math.round(p.actual_hours * p.rate), 0
                            );
                            const isBalanced = totalCredited === courseFormData.creditHours;
                            const difference = totalCredited - courseFormData.creditHours;
                          
                            return (
                              <Alert className={cn(
                                "border-2",
                                isBalanced 
                                  ? "bg-emerald-50 border-emerald-400" 
                                  : difference > 0 
                                  ? "bg-red-50 border-red-400" 
                                  : "bg-amber-50 border-amber-400"
                              )}>
                                <AlertCircle className="h-5 w-5" />
                                <AlertDescription className="flex items-center justify-between">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm">
                                      مجموع الساعات المحسوبة:
                                    </span>
                                    {!isBalanced && (
                                      <span className="text-xs">
                                        {difference > 0 
                                          ? `⚠️ زيادة ${difference} ساعة` 
                                          : `⚠️ نقص ${Math.abs(difference)} ساعة`
                                        }
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-2xl font-bold",
                                      isBalanced 
                                        ? "text-emerald-700" 
                                        : difference > 0 
                                        ? "text-red-700" 
                                        : "text-amber-700"
                                    )}>
                                      {totalCredited}
                                    </span>
                                    <span className="text-slate-400">/</span>
                                    <span className="text-xl font-bold text-slate-700">
                                      {courseFormData.creditHours}
                                    </span>
                                    {isBalanced ? (
                                      <Badge className="bg-emerald-100 text-emerald-700">
                                        ✓ متوازن
                                      </Badge>
                                    ) : (
                                      <Badge className={cn(
                                        difference > 0 
                                          ? "bg-red-100 text-red-700" 
                                          : "bg-amber-100 text-amber-700"
                                      )}>
                                        {difference > 0 ? "⚠ زيادة" : "⚠ نقص"}
                                      </Badge>
                                    )}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            );
                          })()}
                        </div>
          
                        {/* المتطلبات السابقة والمصاحبة */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                          <h5 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            المتطلبات السابقة والمصاحبة
                          </h5>
                      
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* المتطلبات السابقة */}
                            <div className="space-y-3">
                              <Label className="font-semibold text-indigo-700">
                                المتطلبات السابقة (Prerequisites)
                              </Label>
                              <div className="min-h-[80px] p-3 bg-indigo-50/30 rounded-lg border-2 border-dashed border-indigo-200">
                                <div className="flex flex-wrap gap-2">
                                  {courseFormData.prerequisiteIds.map(id => {
                                    const course = availableCoursesForPrereq.find(c => c.id === id);
                                    return course ? (
                                      <Badge key={id} variant="secondary" className="gap-1 bg-indigo-100 text-indigo-700">
                                        {course.course_code}
                                        <X 
                                          className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                          onClick={() => setCourseFormData({
                                            ...courseFormData,
                                            prerequisiteIds: courseFormData.prerequisiteIds.filter(i => i !== id)
                                          })}
                                        />
                                      </Badge>
                                    ) : null;
                                  })}
                                  {courseFormData.prerequisiteIds.length === 0 && (
                                    <span className="text-xs text-slate-400">لا توجد متطلبات سابقة</span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                onClick={() => setIsPrereqSelectOpen(true)}
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                اختيار متطلب سابق
                              </Button>
                            </div>
                      
                            {/* المتطلبات المصاحبة */}
                            <div className="space-y-3">
                              <Label className="font-semibold text-blue-700">
                                المتطلبات المصاحبة (Corequisites)
                              </Label>
                              <div className="min-h-[80px] p-3 bg-blue-50/30 rounded-lg border-2 border-dashed border-blue-200">
                                <div className="flex flex-wrap gap-2">
                                  {courseFormData.corequisiteIds.map(id => {
                                    const course = availableCoursesForPrereq.find(c => c.id === id);
                                    return course ? (
                                      <Badge key={id} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                        {course.course_code}
                                        <X 
                                          className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                          onClick={() => setCourseFormData({
                                            ...courseFormData,
                                            corequisiteIds: courseFormData.corequisiteIds.filter(i => i !== id)
                                          })}
                                        />
                                      </Badge>
                                    ) : null;
                                  })}
                                  {courseFormData.corequisiteIds.length === 0 && (
                                    <span className="text-xs text-slate-400">لا توجد متطلبات مصاحبة</span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => setIsCoreqSelectOpen(true)}
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                اختيار متطلب مصاحب
                              </Button>
                            </div>
                          </div>
                        </div>
          
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-semibold">لغة التدريس</Label>
                            <Select 
                              value={courseFormData.teachingLanguage}
                              onValueChange={(v) => setCourseFormData({
                                ...courseFormData, 
                                teachingLanguage: v as any
                              })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="العربية">العربية</SelectItem>
                                <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                                <SelectItem value="ثنائي اللغة">ثنائي اللغة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
          
                          <div className="space-y-2">
                            <Label>ملاحظات (اختياري)</Label>
                            <Input 
                              value={courseFormData.notes}
                              onChange={e => setCourseFormData({...courseFormData, notes: e.target.value})}
                              placeholder="ملاحظات إضافية..."
                              className="bg-white"
                            />
                          </div>
                        </div>
          
                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsCourseFormOpen(false);
                            setEditingCourse(null);
                          }}>
                            إلغاء
                          </Button>
                          <Button type="submit">
                            حفظ المقرر
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
          
                  {/* جدول المقررات */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table className="bg-white">
                        <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                          <TableRow>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الكود</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[150px]">اسم المقرر</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الساعات</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">الأجزاء</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">التصنيف</TableHead>
                            <TableHead className="text-center font-bold text-emerald-700 min-w-[80px]">الوزن %</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">اللغة</TableHead>
                            <TableHead className="text-center font-bold text-indigo-700 min-w-[150px]">المتطلبات السابقة</TableHead>
                            <TableHead className="text-center font-bold text-blue-700 min-w-[150px]">المتطلبات المصاحبة</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">التوصيف</TableHead>
                            <TableHead className="text-left font-bold text-slate-700 min-w-[120px]">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* ✅ فلترة البيانات حسب التصنيف المختار */}
                          {(() => {
                            const filteredCourses = activeCourseCategory === null
                              ? categoryCourses
                              : categoryCourses.filter(c => c.category === activeCourseCategory);
                  
                            if (filteredCourses.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={11} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="bg-slate-100 p-4 rounded-full">
                                        <BookOpen className="w-12 h-12 text-slate-300" />
                                      </div>
                                      <p className="text-slate-400 font-medium">
                                        {activeCourseCategory ? `لا توجد مقررات من نوع "${activeCourseCategory}"` : 'لا توجد مقررات مسجلة'}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {activeCourseCategory ? 'جرّب اختيار تصنيف آخر' : 'ابدأ بإضافة المقررات للبرنامج'}
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            }
                  
                            return filteredCourses.map(course => (
                                <TableRow 
                                  key={course.id} 
                                  className={cn(
                                    "hover:bg-slate-50 transition-all border-b border-slate-100 duration-500",
                                    highlightedCourseId === course.id ? "bg-yellow-300" : ""
                                  )}
                                >
                                {/* الكود */}
                                <TableCell className="font-mono text-slate-700 font-bold text-sm align-top py-4">
                                  <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                                    {course.course_code}
                                  </div>
                                </TableCell>
                            
                                {/* الاسم */}
                                <TableCell className="align-top py-4">
                                  <div className="font-semibold text-slate-800 text-sm leading-snug">
                                    {course.course_name}
                                  </div>
                                </TableCell>
                            
                                {/* الساعات */}
                                <TableCell className="text-center align-top py-4">
                                  <Badge 
                                    variant="outline" 
                                    className="font-bold bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1"
                                  >
                                    {course.credit_hours}
                                  </Badge>
                                </TableCell>
                            
                                {/* الأجزاء */}
                                <TableCell className="text-center align-top py-4">
                                  <div className="flex flex-col gap-1.5 items-center">
                                    {course.course_parts?.map((part, idx) => (
                                      <div 
                                        key={idx}
                                        className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 w-full max-w-[120px]"
                                      >
                                        <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">
                                          {part.name}
                                        </span>
                                        <span className="text-[10px] text-purple-600 font-medium">
                                          ({part.actual_hours}س)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                            
                                {/* التصنيف */}
                                <TableCell className="text-center align-top py-4">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs font-medium px-2 py-1 whitespace-nowrap",
                                      course.category === "متطلب جامعة" && "bg-slate-50 text-slate-700 border-slate-300",
                                      course.category === "متطلب كلية" && "bg-blue-50 text-blue-700 border-blue-300",
                                      course.category === "متطلب تخصص إجباري" && "bg-green-50 text-green-700 border-green-300",
                                      course.category === "متطلب تخصص اختياري" && "bg-amber-50 text-amber-700 border-amber-300"
                                    )}
                                  >
                                    {course.category?.replace('متطلب ', '')}
                                  </Badge>
                                </TableCell>
                            
                                {/* الوزن */}
                                <TableCell className="text-center align-top py-4">
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-sm px-3 py-1">
                                    {course.weight || 0}%
                                  </Badge>
                                </TableCell>
                            
                                {/* اللغة */}
                                <TableCell className="text-center align-top py-4">
                                  <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
                                    <span className="text-lg">
                                      {course.teaching_language === 'العربية' && '🇸🇦'}
                                      {course.teaching_language === 'الإنجليزية' && '🇬🇧'}
                                      {course.teaching_language === 'ثنائي اللغة' && '🌐'}
                                    </span>
                                    <span className="whitespace-nowrap">{course.teaching_language}</span>
                                  </div>
                                </TableCell>
                  
                                {/* المتطلبات السابقة */}
                                <TableCell className="text-center align-top py-4">
                                  {course.prerequisites && course.prerequisites.length > 0 ? (
                                    <div className="flex flex-col gap-2 items-center justify-center">
                                      {course.prerequisites.slice(0, 3).map(p => (
                                        <button
                                          key={p.id}
                                          onClick={() => {
                                            // ✅ تمييز الصف فقط
                                            setHighlightedCourseId(p.id);
                                            
                                            // ✅ إظهار رسالة
                                            setTimeout(() => {
                                              alert(`🔍 ابحث عن المقرر: ${p.course_name}\n\nالكود: ${p.course_code}`);
                                            }, 100);
                                          }}
                                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer font-medium"
                                        >
                                          {p.course_name}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </TableCell>
                                
                                {/* المتطلبات المصاحبة */}
                                <TableCell className="text-center align-top py-4">
                                  {course.corequisites && course.corequisites.length > 0 ? (
                                    <div className="flex flex-col gap-2 items-center justify-center">
                                      {course.corequisites.slice(0, 3).map(c => (
                                        <button
                                          key={c.id}
                                          onClick={() => {
                                            // ✅ تمييز الصف
                                            setHighlightedCourseId(c.id);
                                            
                                            // ✅ بحث بسيط عن الصف
                                            const rows = Array.from(document.querySelectorAll('tbody tr'));
                                            const targetRow = rows.find(row => 
                                              row.textContent.includes(c.course_code)
                                            );
                                            
                                            if (targetRow) {
                                              // ✅ الانتقال السلس
                                              targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                          }}
                                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer font-medium"
                                        >
                                          {c.course_name}
                                        </button>
                                      ))}
                                      {course.corequisites.length > 3 && (
                                        <span className="text-xs text-blue-500">
                                          +{course.corequisites.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </TableCell>
                            
                                {/* التوصيف */}
                                <TableCell className="text-center align-top py-4">
                                  <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 whitespace-nowrap" 
                                    onClick={() => handleOpenQuality(course)}
                                  >
                                    <Target className="w-3.5 h-3.5" /> 
                                    <span className="hidden sm:inline">التوصيف</span>
                                  </Button>
                                </TableCell>
                            
                                {/* الإجراءات */}
                                <TableCell className="text-left align-top py-4">
                                  <div className="flex gap-1 justify-end flex-wrap">
                                    {can('study_plan.update') && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="hover:bg-blue-50 hover:text-blue-700 h-8 w-8 p-0"
                                        onClick={() => handleEditCourse(course)}
                                        title="تعديل"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    )}
                            
                                    {can('study_plan.delete') && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                        onClick={() => handleDeleteCourse(course.id)}
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
          
                  {/* Modals للمتطلبات */}
                  <Dialog open={isPrereqSelectOpen} onOpenChange={setIsPrereqSelectOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-600" />
                          اختيار المتطلبات السابقة
                        </DialogTitle>
                        <DialogDescription>
                          اختر المقررات التي يجب على الطالب اجتيازها قبل هذا المقرر
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                        {availableCoursesForPrereq.map(course => (
                          <div 
                            key={course.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              courseFormData.prerequisiteIds.includes(course.id)
                                ? "bg-indigo-50 border-indigo-300"
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            )}
                            onClick={() => {
                              const isSelected = courseFormData.prerequisiteIds.includes(course.id);
                              setCourseFormData({
                                ...courseFormData,
                                prerequisiteIds: isSelected
                                  ? courseFormData.prerequisiteIds.filter(id => id !== course.id)
                                  : [...courseFormData.prerequisiteIds, course.id]
                              });
                            }}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center",
                              courseFormData.prerequisiteIds.includes(course.id)
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-slate-300"
                            )}>
                              {courseFormData.prerequisiteIds.includes(course.id) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{course.course_name}</div>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{course.course_code}</Badge>
                                <span>•</span>
                                <span>{course.credit_hours} ساعة</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button onClick={() => setIsPrereqSelectOpen(false)}>
                          تم ({courseFormData.prerequisiteIds.length} مقرر)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
          
                  <Dialog open={isCoreqSelectOpen} onOpenChange={setIsCoreqSelectOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          اختيار المتطلبات المصاحبة
                        </DialogTitle>
                        <DialogDescription>
                          اختر المقررات التي يجب دراستها في نفس الوقت مع هذا المقرر
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                        {availableCoursesForPrereq.map(course => (
                          <div 
                            key={course.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              courseFormData.corequisiteIds.includes(course.id)
                                ? "bg-blue-50 border-blue-300"
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            )}
                            onClick={() => {
                              const isSelected = courseFormData.corequisiteIds.includes(course.id);
                              setCourseFormData({
                                ...courseFormData,
                                corequisiteIds: isSelected
                                  ? courseFormData.corequisiteIds.filter(id => id !== course.id)
                                  : [...courseFormData.corequisiteIds, course.id]
                              });
                            }}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center",
                              courseFormData.corequisiteIds.includes(course.id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300"
                            )}>
                              {courseFormData.corequisiteIds.includes(course.id) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{course.course_name}</div>
                              <div className="text-sm text-slate-500 flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{course.course_code}</Badge>
                                <span>•</span>
                                <span>{course.credit_hours} ساعة</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button onClick={() => setIsCoreqSelectOpen(false)}>
                          تم ({courseFormData.corequisiteIds.length} مقرر)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
          
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==========================================
              نظام الساعات المعتمدة + البلوكات
              ========================================== */}
          {selectedProgram && selectedProgram.academic_system === 'credit' && selectedProgram.block_based && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              
              {/* عرض معلومات البرنامج */}
              <Card className="border-t-4 border-t-purple-600 shadow-sm bg-gradient-to-br from-purple-50 to-white sticky top-6 z-10">
                <CardHeader className="pb-4">
                  {/* ✅ الحسابات */}
                  {(() => {
          
                    const totalBlockHours = programBlocks?.length > 0
                      ? programBlocks.reduce((sum, b) => sum + (Number(b.credit_hours) || 0), 0)
                      : 0;
                    
                    const maxHours = Number(selectedProgram?.total_hours) || 0;
                    const remainingHours = maxHours - totalBlockHours;
                    const progressPercentage = maxHours > 0
                      ? Math.round((totalBlockHours / maxHours) * 100)
                      : 0;
          
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-purple-100 p-3 rounded-xl">
                              <LayoutGrid className="w-6 h-6 text-purple-700" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg text-purple-900">
                                نظام الساعات المعتمدة + البلوكات
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {selectedProgram.name}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
          
                        {/* ✅ إحصائيات الساعات */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                          
                          {/* الإجمالي */}
                          <div className="bg-white px-4 py-3 rounded-lg border-2 border-purple-200 shadow-sm">
                            <div className="text-xs text-slate-500 font-medium mb-1">إجمالي الساعات</div>
                            <div className="text-2xl font-bold text-purple-700">
                              {maxHours}
                            </div>
                          </div>
          
                          {/* المضافة */}
                          <div className={cn(
                            "px-4 py-3 rounded-lg border-2 shadow-sm",
                            totalBlockHours > maxHours
                              ? "bg-red-50 border-red-200"
                              : "bg-emerald-50 border-emerald-200"
                          )}>
                            <div className="text-xs text-slate-500 font-medium mb-1">المضافة</div>
                            <div className={cn(
                              "text-2xl font-bold",
                              totalBlockHours > maxHours ? "text-red-700" : "text-emerald-700"
                            )}>
                              {totalBlockHours}
                            </div>
                          </div>
          
                          {/* المتبقي */}
                          <div className={cn(
                            "px-4 py-3 rounded-lg border-2 shadow-sm",
                            remainingHours < 0
                              ? "bg-red-50 border-red-200"
                              : "bg-amber-50 border-amber-200"
                          )}>
                            <div className="text-xs text-slate-500 font-medium mb-1">المتبقي</div>
                            <div className={cn(
                              "text-2xl font-bold",
                              remainingHours < 0 ? "text-red-700" : "text-amber-700"
                            )}>
                              {Math.max(0, remainingHours)}
                            </div>
                          </div>
          
                          {/* النسبة */}
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-3 rounded-lg border-2 border-purple-200 shadow-sm">
                            <div className="text-xs text-slate-500 font-medium mb-1">النسبة</div>
                            <div className="text-2xl font-bold text-purple-700">{progressPercentage}%</div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all",
                                  totalBlockHours > maxHours ? "bg-red-500" : "bg-purple-500"
                                )}
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                              />
                            </div>
                          </div>
                        </div>
          
                        {/* ⚠️ تنبيه */}
                        {totalBlockHours > maxHours && (
                          <Alert className="mt-4 bg-red-50 border-red-300">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <AlertDescription className="text-red-700">
                              <b>⚠️ تجاوزت الساعات!</b>
                              <p className="text-sm mt-1">
                                الساعات ({totalBlockHours}) تتجاوز المسموح ({maxHours})
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    );
                  })()}
                </CardHeader>
              </Card>
          
              {/* إدارة البلوكات */}
              <Card className="border shadow-sm bg-white">
                <CardHeader className="bg-purple-50/50 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-600" /> البلوكات الدراسية
                      </CardTitle>
                      <CardDescription>
                        تنظيم المحتوى الدراسي في وحدات تكاملية مع تحديد الساعات المعتمدة
                      </CardDescription>
                    </div>
                    {can('study_plan.create') && (
                      <Button 
                        onClick={handleAddBlock} 
                        className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" /> إضافة بلوك
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  
                  {/* فورم إضافة/تعديل البلوك */}
                  {isBlockFormOpen && (
                    <form 
                      onSubmit={handleSubmitBlock} 
                      className="bg-purple-50/50 p-5 rounded-xl border-2 border-purple-100 mb-6 space-y-5 shadow-inner"
                    >
                      <div className="flex justify-between items-center border-b border-purple-200 pb-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <Edit2 className="w-4 h-4 text-purple-600" />
                          {editingBlock ? "تعديل البلوك" : "إضافة بلوك جديد"}
                        </h4>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          نظام الساعات + البلوكات
                        </Badge>
                      </div>
          
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* اسم البلوك */}
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-slate-700 font-semibold">اسم البلوك *</Label>
                          <Input 
                            value={blockFormData.blockName}
                            onChange={(e) => setBlockFormData({...blockFormData, blockName: e.target.value})}
                            placeholder="مثال: بلوك العلوم الأساسية"
                            className="bg-white border-purple-200 focus:border-purple-400"
                            required
                          />
                        </div>
          
                        {/* رقم البلوك */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">رقم البلوك</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={blockFormData.blockNumber}
                            onChange={(e) => setBlockFormData({...blockFormData, blockNumber: Number(e.target.value)})}
                            className="bg-white border-purple-200"
                          />
                        </div>
          
                        {/* الساعات المعتمدة - مميز في هذا النظام */}
                        <div className="space-y-2">
                          <Label className="text-purple-700 font-bold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            الساعات المعتمدة *
                          </Label>
                          <Input 
                            type="number"
                            min="0"
                            value={blockFormData.credit_hours}
                            onChange={(e) => setBlockFormData({...blockFormData, credit_hours: Number(e.target.value)})}
                            placeholder="مثلاً: 12"
                            className="bg-purple-50/50 border-purple-300 font-bold text-purple-700"
                            required
                          />
                        </div>
          
                        {/* نوع البلوك */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">نوع البلوك</Label>
                          <Select 
                            value={blockFormData.type} 
                            onValueChange={(val) => setBlockFormData({...blockFormData, type: val})}
                          >
                            <SelectTrigger className="bg-white border-purple-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compulsory">إجباري</SelectItem>
                              <SelectItem value="elective">اختياري</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
          
                        {/* عدد الأسابيع */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">عدد الأسابيع</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={blockFormData.weeks}
                            onChange={(e) => setBlockFormData({...blockFormData, weeks: Number(e.target.value)})}
                            className="bg-white border-purple-200"
                          />
                        </div>
          
                        {/* الوزن */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">الوزن (%)</Label>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            value={blockFormData.weight}
                            onChange={(e) => setBlockFormData({...blockFormData, weight: Number(e.target.value)})}
                            className="bg-white border-purple-200"
                          />
                        </div>
                      </div>
          
                      {/* وصف البلوك */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">الوصف (اختياري)</Label>
                        <Textarea 
                          value={blockFormData.description}
                          onChange={(e) => setBlockFormData({...blockFormData, description: e.target.value})}
                          placeholder="وصف مختصر عن محتوى البلوك..."
                          className="bg-white border-purple-200 min-h-[80px]"
                        />
                      </div>
          
                      {/* أزرار التحكم */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-purple-200">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsBlockFormOpen(false);
                            setEditingBlock(null);
                          }}
                          className="border-purple-200"
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          حفظ البلوك
                        </Button>
                      </div>
                    </form>
                  )}
          
                  {/* عرض البلوكات */}
                  {programBlocks.length > 0 ? (
                    <div className="space-y-4">

                      {/* قائمة البلوكات */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {programBlocks.map((block) => (
                          <div 
                            key={block.id} 
                            className={cn(
                              "border-2 rounded-xl p-5 bg-white transition-all group relative",
                              "hover:shadow-lg hover:border-purple-300",
                              selectedBlock?.id === block.id 
                                ? "border-purple-600 bg-purple-50/30 shadow-md" 
                                : "border-slate-200"
                            )}
                          >
                            {/* رأس الكارت */}
                            <div className="flex justify-between items-start mb-3">
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  block.type === 'compulsory' 
                                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                )}
                              >
                                {block.type === 'compulsory' ? 'إجباري' : 'اختياري'}
                              </Badge>
                              
                              {/* أزرار التحكم */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {can('study_plan.update') && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-purple-600 hover:bg-purple-100"
                                    onClick={() => handleEditBlock(block)}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {can('study_plan.delete') && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDeleteBlock(block.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
          
                            {/* اسم البلوك */}
                            <h3 className="font-bold text-slate-800 text-lg mb-3 leading-tight">
                              {block.block_name}
                            </h3>
          
                            {/* معلومات البلوك */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> الساعات:
                                </span>
                                <span className="font-bold text-purple-700 text-base">
                                  {block.credit_hours || 0} ساعة
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> المدة:
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {block.weeks} أسابيع
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5" /> الوزن:
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {block.weight}%
                                </span>
                              </div>
                            </div>
          
                            {/* زر عرض المقررات */}
                            <Button 
                              variant="secondary" 
                              className={cn(
                                "w-full h-9 text-xs transition-all",
                                selectedBlock?.id === block.id 
                                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                                  : "bg-slate-100 hover:bg-purple-600 hover:text-white"
                              )}
                              onClick={() => setSelectedBlock(block)}
                            >
                              <ChevronRight className="w-4 h-4 mr-1" />
                              عرض مقررات البلوك
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !isBlockFormOpen && (
                      <div className="text-center py-12 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/30">
                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Box className="text-purple-400 w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">
                          لم يتم إضافة بلوكات بعد
                        </p>
                        <p className="text-sm text-slate-400">
                          ابدأ بإضافة البلوكات الدراسية وتحديد الساعات المعتمدة لكل بلوك
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
          
              {/* المقررات (تظهر عند اختيار بلوك) */}
              {selectedBlock && (
                <Card className="border-t-4 border-t-indigo-600 shadow-lg animate-in slide-in-from-bottom-4">
                  <CardHeader className="bg-indigo-50/50 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                          {selectedBlock?.block_name ? `مقررات ${selectedBlock.block_name}` : 'المقررات'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          إدارة المواد الدراسية
                          {selectedBlock?.credit_hours && (() => {
                            // ✅ حساب مجموع ساعات المقررات
                            const totalCourseHours = blockCourses.reduce((sum, c) => sum + (Number(c.credit_hours) || 0), 0);
                            const blockCapacity = Number(selectedBlock.credit_hours) || 0;
                            
                            return (
                              <>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "mr-2",
                                    totalCourseHours > blockCapacity
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : totalCourseHours === blockCapacity
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  )}
                                >
                                  {totalCourseHours} / {blockCapacity} ساعة معتمدة
                                </Badge>
                                
                                {/* ✅ عرض المتبقي */}
                                {totalCourseHours < blockCapacity && (
                                  <Badge variant="secondary" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                                    متبقي: {blockCapacity - totalCourseHours} ساعة
                                  </Badge>
                                )}
                                
                                {/* ⚠️ تنبيه إذا تجاوز */}
                                {totalCourseHours > blockCapacity && (
                                  <Badge className="mr-2 bg-red-100 text-red-700 border-red-300">
                                    تجاوز: +{totalCourseHours - blockCapacity} ساعة
                                  </Badge>
                                )}
                              </>
                            );
                          })()}
                        </CardDescription>
                      </div>
                      {can('study_plan.create') && (
                        <Button 
                          onClick={handleAddCourse}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" /> إضافة مقرر
                        </Button>
                      )}
                    </div>

                    {/* ✅ Tabs للتصنيفات */}
                    <div className="flex flex-wrap gap-2 border-b pb-3">
                      {/* الكل */}
                      <button
                        onClick={() => setActiveCourseCategory(null)}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                          activeCourseCategory === null
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        الكل <Badge className="ml-2">{blockCourses.length}</Badge>
                      </button>
              
                      {/* جامعة */}
                      <button
                        onClick={() => setActiveCourseCategory('متطلب جامعة')}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                          activeCourseCategory === 'متطلب جامعة'
                            ? "bg-slate-600 text-white border-slate-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        🏫 جامعة <Badge className="ml-2">{blockCourses.filter(c => c.category === 'متطلب جامعة').length}</Badge>
                      </button>
              
                      {/* كلية */}
                      <button
                        onClick={() => setActiveCourseCategory('متطلب كلية')}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                          activeCourseCategory === 'متطلب كلية'
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-blue-700 border-blue-200 hover:border-blue-400"
                        )}
                      >
                        🏢 كلية <Badge className="ml-2">{blockCourses.filter(c => c.category === 'متطلب كلية').length}</Badge>
                      </button>
              
                      {/* إجباري */}
                      <button
                        onClick={() => setActiveCourseCategory('متطلب تخصص إجباري')}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                          activeCourseCategory === 'متطلب تخصص إجباري'
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-green-700 border-green-200 hover:border-green-400"
                        )}
                      >
                        ⭐ إجباري <Badge className="ml-2">{blockCourses.filter(c => c.category === 'متطلب تخصص إجباري').length}</Badge>
                      </button>
              
                      {/* اختياري */}
                      <button
                        onClick={() => setActiveCourseCategory('متطلب تخصص اختياري')}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium text-sm transition-all border-2",
                          activeCourseCategory === 'متطلب تخصص اختياري'
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                        )}
                      >
                        ♦️ اختياري <Badge className="ml-2">{blockCourses.filter(c => c.category === 'متطلب تخصص اختياري').length}</Badge>
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">

                    {/* نموذج إضافة المقرر */}
                    {isCourseFormOpen && (
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
                        <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">
                          {editingCourse ? "تعديل المقرر" : "إضافة مقرر جديد"}
                        </h4>
                        <form onSubmit={handleSubmitCourse} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>كود المقرر *</Label>
                              <Input 
                                value={courseFormData.courseCode}
                                onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})}
                                placeholder="CS101"
                                className="bg-white font-mono"
                                required
                              />
                            </div>
            
                            <div className="space-y-2 md:col-span-2">
                              <Label>اسم المقرر *</Label>
                              <Input 
                                value={courseFormData.courseName}
                                onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})}
                                placeholder="مثال: مقدمة في البرمجة"
                                className="bg-white"
                                required
                              />
                            </div>
            
                            <div className="space-y-2">
                              <Label>الساعات المعتمدة *</Label>
                              <Input 
                                type="number"
                                min="1"
                                value={courseFormData.creditHours}
                                onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})}
                                className="bg-white"
                                required
                              />
                            </div>
            
                            <div className="space-y-2">
                              <Label className="text-emerald-700 font-bold">وزن المقرر % (من البرنامج)</Label>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={courseFormData.weight}
                                onChange={e => setCourseFormData({...courseFormData, weight: +e.target.value})}
                                placeholder="0"
                                className="bg-emerald-50/50 border-emerald-200"
                              />
                              <p className="text-xs text-slate-500 leading-relaxed">
                                مجموع أوزان البرنامج: <b>{courseWeightSummary.programWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المستخدم للمقررات: <b>{courseWeightSummary.usedCourseWeight.toFixed(2)}%</b>
                                <span className="mx-1">|</span>
                                المتبقي: <b className="text-emerald-700">{courseWeightSummary.remainingWeight.toFixed(2)}%</b>
                              </p>
                            </div>
            
                            <div className="space-y-2">
                              <Label>نوع المتطلب</Label>
                              <Select 
                                value={courseFormData.category}
                                onValueChange={v => setCourseFormData({...courseFormData, category: v as any})}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="متطلب جامعة">متطلب جامعة</SelectItem>
                                  <SelectItem value="متطلب كلية">متطلب كلية</SelectItem>
                                  <SelectItem value="متطلب تخصص إجباري">متطلب تخصص (إجباري)</SelectItem>
                                  <SelectItem value="متطلب تخصص اختياري">متطلب تخصص (اختياري)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
            
                          {/* أجزاء المقرر */}
                          <div className="bg-white p-4 rounded-lg border space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <h5 className="font-semibold text-slate-700 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600" />
                                أجزاء المقرر والساعات المعتمدة
                              </h5>
                            </div>
                          
                            {/* الساعات المعتمدة */}
                            <Alert className="bg-blue-50 border-2 border-blue-400">
                              <Clock className="h-5 w-5 text-blue-700" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-900 text-base">
                                    إجمالي الساعات المعتمدة للمقرر:
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Input 
                                      type="number"
                                      min="1"
                                      max="10"
                                      step="1"
                                      value={courseFormData.creditHours}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setCourseFormData({...courseFormData, creditHours: val});
                                      }}
                                      className="w-24 h-10 font-bold text-xl text-center bg-white border-2 border-blue-300 text-blue-700"
                                      required
                                    />
                                    <span className="text-blue-800 font-bold">ساعة</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          
                            {/* تنبيه */}
                            <Alert className="bg-amber-50 border-amber-300">
                              <AlertCircle className="h-4 w-4 text-amber-700" />
                              <AlertDescription className="text-xs text-amber-800">
                                💡 <b>ملاحظة:</b> يجب أن يساوي مجموع الساعات المحسوبة من الأجزاء الساعات المعتمدة.
                              </AlertDescription>
                            </Alert>
                          
                            {/* عرض الأجزاء */}
                            <div className="space-y-3">
                              {courseFormData.courseParts.map((part, idx) => {
                                const creditedHours = Math.round(part.actual_hours * part.rate);
                                
                                return (
                                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 space-y-3">
                                    
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary" className="shrink-0 min-w-[80px] justify-center">
                                        {part.name}
                                      </Badge>
                                      
                                      <div className="flex items-center gap-2 flex-1">
                                        <Label className="text-xs text-slate-600 w-28">الساعات الفعلية:</Label>
                                        <Input 
                                          type="number"
                                          min="0"
                                          step={
                                            part.name === "نظري" ? 1 :
                                            part.name === "عملي" ? 2 :
                                            part.name === "تمارين" ? 2 :
                                            part.name === "سريري" ? 3 : 1
                                          }
                                          value={part.actual_hours}
                                          onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            
                                            if (part.name === "عملي" || part.name === "تمارين") {
                                              val = Math.floor(val / 2) * 2;
                                            } else if (part.name === "سريري") {
                                              val = Math.floor(val / 3) * 3;
                                            }
                                            
                                            handleUpdateCoursePart(idx, 'actual_hours', val);
                                          }}
                                          className="bg-white h-9 w-24 text-center font-semibold"
                                        />
                                        <span className="text-xs text-slate-500">ساعة</span>
                                      </div>
                            
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {part.name === "سريري" ? "÷3" : part.name === "نظري" ? "×1" : "÷2"}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                        <Badge className={cn(
                                          "font-bold min-w-[100px] justify-center",
                                          creditedHours <= courseFormData.creditHours 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        )}>
                                          {creditedHours} ساعة
                                        </Badge>
                                      </div>
                            
                                      {courseFormData.courseParts.length > 1 && (
                                        <Button 
                                          type="button"
                                          size="icon" 
                                          variant="ghost"
                                          className="text-red-500 hover:bg-red-50 shrink-0"
                                          onClick={() => handleRemoveCoursePart(idx)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                            
                                    <div className="text-xs text-slate-500 bg-white p-2 rounded border flex items-center gap-2">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        <b>{part.name}:</b> 
                                        {part.name === "نظري" && " كل ساعة فعلية = 1 ساعة معتمدة"}
                                        {part.name === "عملي" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "تمارين" && " كل ساعتين فعلية = 1 ساعة معتمدة"}
                                        {part.name === "سريري" && " كل 3 ساعات فعلية = 1 ساعة معتمدة"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          
                            {/* زر إضافة جزء */}
                            {courseFormData.courseParts.length < 4 && (
                              <div className="flex gap-2">
                                {!courseFormData.courseParts.find(p => p.name === "نظري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "نظري", actual_hours: 0, rate: 1.0 }]
                                    })}
                                  >
                                    + نظري
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "عملي") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "عملي", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + عملي
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "تمارين") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "تمارين", actual_hours: 0, rate: 0.5 }]
                                    })}
                                  >
                                    + تمارين
                                  </Button>
                                )}
                                {!courseFormData.courseParts.find(p => p.name === "سريري") && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCourseFormData({
                                      ...courseFormData,
                                      courseParts: [...courseFormData.courseParts, { name: "سريري", actual_hours: 0, rate: 0.33 }]
                                    })}
                                  >
                                    + سريري
                                  </Button>
                                )}
                              </div>
                            )}
                          
                            {/* التحقق من الموازنة */}
                            {(() => {
                              const totalCredited = courseFormData.courseParts.reduce((sum, p) => 
                                sum + Math.round(p.actual_hours * p.rate), 0
                              );
                              const isBalanced = totalCredited === courseFormData.creditHours;
                              const difference = totalCredited - courseFormData.creditHours;
                            
                              return (
                                <Alert className={cn(
                                  "border-2",
                                  isBalanced 
                                    ? "bg-emerald-50 border-emerald-400" 
                                    : difference > 0 
                                    ? "bg-red-50 border-red-400" 
                                    : "bg-amber-50 border-amber-400"
                                )}>
                                  <AlertCircle className="h-5 w-5" />
                                  <AlertDescription className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-sm">
                                        مجموع الساعات المحسوبة:
                                      </span>
                                      {!isBalanced && (
                                        <span className="text-xs">
                                          {difference > 0 
                                            ? `⚠️ زيادة ${difference} ساعة` 
                                            : `⚠️ نقص ${Math.abs(difference)} ساعة`
                                          }
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-2xl font-bold",
                                        isBalanced 
                                          ? "text-emerald-700" 
                                          : difference > 0 
                                          ? "text-red-700" 
                                          : "text-amber-700"
                                      )}>
                                        {totalCredited}
                                      </span>
                                      <span className="text-slate-400">/</span>
                                      <span className="text-xl font-bold text-slate-700">
                                        {courseFormData.creditHours}
                                      </span>
                                      {isBalanced ? (
                                        <Badge className="bg-emerald-100 text-emerald-700">
                                          ✓ متوازن
                                        </Badge>
                                      ) : (
                                        <Badge className={cn(
                                          difference > 0 
                                            ? "bg-red-100 text-red-700" 
                                            : "bg-amber-100 text-amber-700"
                                        )}>
                                          {difference > 0 ? "⚠ زيادة" : "⚠ نقص"}
                                        </Badge>
                                      )}
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              );
                            })()}
                          </div>
            
                          {/* المتطلبات السابقة والمصاحبة */}
                          <div className="bg-white p-4 rounded-lg border space-y-4">
                            <h5 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
                              <Layers className="w-4 h-4 text-indigo-600" />
                              المتطلبات السابقة والمصاحبة
                            </h5>
                        
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* المتطلبات السابقة */}
                              <div className="space-y-3">
                                <Label className="font-semibold text-indigo-700">
                                  المتطلبات السابقة (Prerequisites)
                                </Label>
                                <div className="min-h-[80px] p-3 bg-indigo-50/30 rounded-lg border-2 border-dashed border-indigo-200">
                                  <div className="flex flex-wrap gap-2">
                                    {courseFormData.prerequisiteIds.map(id => {
                                      const course = availableCoursesForPrereq.find(c => c.id === id);
                                      return course ? (
                                        <Badge key={id} variant="secondary" className="gap-1 bg-indigo-100 text-indigo-700">
                                          {course.course_code}
                                          <X 
                                            className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                            onClick={() => setCourseFormData({
                                              ...courseFormData,
                                              prerequisiteIds: courseFormData.prerequisiteIds.filter(i => i !== id)
                                            })}
                                          />
                                        </Badge>
                                      ) : null;
                                    })}
                                    {courseFormData.prerequisiteIds.length === 0 && (
                                      <span className="text-xs text-slate-400">لا توجد متطلبات سابقة</span>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => setIsPrereqSelectOpen(true)}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  اختيار متطلب سابق
                                </Button>
                              </div>
                        
                              {/* المتطلبات المصاحبة */}
                              <div className="space-y-3">
                                <Label className="font-semibold text-blue-700">
                                  المتطلبات المصاحبة (Corequisites)
                                </Label>
                                <div className="min-h-[80px] p-3 bg-blue-50/30 rounded-lg border-2 border-dashed border-blue-200">
                                  <div className="flex flex-wrap gap-2">
                                    {courseFormData.corequisiteIds.map(id => {
                                      const course = availableCoursesForPrereq.find(c => c.id === id);
                                      return course ? (
                                        <Badge key={id} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                          {course.course_code}
                                          <X 
                                            className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                            onClick={() => setCourseFormData({
                                              ...courseFormData,
                                              corequisiteIds: courseFormData.corequisiteIds.filter(i => i !== id)
                                            })}
                                          />
                                        </Badge>
                                      ) : null;
                                    })}
                                    {courseFormData.corequisiteIds.length === 0 && (
                                      <span className="text-xs text-slate-400">لا توجد متطلبات مصاحبة</span>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                                  onClick={() => setIsCoreqSelectOpen(true)}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  اختيار متطلب مصاحب
                                </Button>
                              </div>
                            </div>
                          </div>
            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-semibold">لغة التدريس</Label>
                              <Select 
                                value={courseFormData.teachingLanguage}
                                onValueChange={(v) => setCourseFormData({
                                  ...courseFormData, 
                                  teachingLanguage: v as any
                                })}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="العربية">العربية</SelectItem>
                                  <SelectItem value="الإنجليزية">الإنجليزية</SelectItem>
                                  <SelectItem value="ثنائي اللغة">ثنائي اللغة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
            
                            <div className="space-y-2">
                              <Label>ملاحظات (اختياري)</Label>
                              <Input 
                                value={courseFormData.notes}
                                onChange={e => setCourseFormData({...courseFormData, notes: e.target.value})}
                                placeholder="ملاحظات إضافية..."
                                className="bg-white"
                              />
                            </div>
                          </div>
            
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => {
                              setIsCourseFormOpen(false);
                              setEditingCourse(null);
                            }}>
                              إلغاء
                            </Button>
                            <Button type="submit">
                              حفظ المقرر
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
              
                    {/* جدول المقررات */}
                    {(() => {
                      // ✅ فلترة المقررات حسب التصنيف المختار
                      const filteredCourses = activeCourseCategory === null
                        ? blockCourses
                        : blockCourses.filter(c => c.category === activeCourseCategory);
                    
                      return (
                        <div className="rounded-md border">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <TableRow>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الكود</TableHead>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[150px]">اسم المقرر</TableHead>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[80px]">الساعات</TableHead>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">الأجزاء</TableHead>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[140px]">التصنيف</TableHead>
                                  <TableHead className="text-center font-bold text-emerald-700 min-w-[80px]">الوزن %</TableHead>
                                  <TableHead className="text-center font-bold text-indigo-700 min-w-[150px]">المتطلبات</TableHead>
                                  <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">التوصيف</TableHead>
                                  <TableHead className="text-left font-bold text-slate-700 min-w-[120px]">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCourses.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12">
                                      <div className="flex flex-col items-center gap-3">
                                        <div className="bg-slate-100 p-4 rounded-full">
                                          <BookOpen className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-medium">
                                          {blockCourses.length === 0 
                                            ? "لا توجد مقررات مسجلة"
                                            : `لا توجد مقررات من نوع "${activeCourseCategory}"`
                                          }
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {blockCourses.length > 0 && activeCourseCategory 
                                            ? "جرّب اختيار تصنيف آخر"
                                            : "ابدأ بإضافة المقررات لهذا البلوك"
                                          }
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredCourses.map(course => (
                                    <TableRow 
                                      key={course.id} 
                                      className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                                    >
                                      {/* الكود */}
                                      <TableCell className="font-mono text-slate-700 font-bold text-sm align-top py-4">
                                        <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                                          {course.course_code}
                                        </div>
                                      </TableCell>
                              
                                      {/* الاسم */}
                                      <TableCell className="align-top py-4">
                                        <div className="font-semibold text-slate-800 text-sm leading-snug">
                                          {course.course_name}
                                        </div>
                                      </TableCell>
                              
                                      {/* الساعات */}
                                      <TableCell className="text-center align-top py-4">
                                        <Badge 
                                          variant="outline" 
                                          className="font-bold bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1"
                                        >
                                          {course.credit_hours}
                                        </Badge>
                                      </TableCell>
                              
                                      {/* الأجزاء */}
                                      <TableCell className="text-center align-top py-4">
                                        <div className="flex flex-col gap-1.5 items-center">
                                          {course.course_parts?.map((part, idx) => (
                                            <div 
                                              key={idx}
                                              className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 w-full max-w-[120px]"
                                            >
                                              <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">
                                                {part.name}
                                              </span>
                                              <span className="text-[10px] text-purple-600 font-medium">
                                                ({part.actual_hours}س)
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </TableCell>
                              
                                      {/* التصنيف */}
                                      <TableCell className="text-center align-top py-4">
                                        <Badge 
                                          variant="outline" 
                                          className={cn(
                                            "text-xs font-medium px-2 py-1 whitespace-nowrap",
                                            course.category === "متطلب جامعة" && "bg-slate-50 text-slate-700 border-slate-300",
                                            course.category === "متطلب كلية" && "bg-blue-50 text-blue-700 border-blue-300",
                                            course.category === "متطلب تخصص إجباري" && "bg-green-50 text-green-700 border-green-300",
                                            course.category === "متطلب تخصص اختياري" && "bg-amber-50 text-amber-700 border-amber-300"
                                          )}
                                        >
                                          {course.category?.replace('متطلب ', '')}
                                        </Badge>
                                      </TableCell>
                              
                                      {/* الوزن */}
                                      <TableCell className="text-center align-top py-4">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-sm px-3 py-1">
                                          {course.weight || 0}%
                                        </Badge>
                                      </TableCell>
                              
                                      {/* المتطلبات */}
                                      <TableCell className="text-center align-top py-4">
                                        {course.prerequisites && course.prerequisites.length > 0 ? (
                                          <div className="flex flex-col gap-1 items-center justify-center text-[10px]">
                                            {course.prerequisites.slice(0, 2).map(p => (
                                              <Badge 
                                                key={p.id} 
                                                variant="outline" 
                                                className="bg-indigo-50 text-indigo-700 border-indigo-200"
                                              >
                                                {p.course_code}
                                              </Badge>
                                            ))}
                                            {course.prerequisites.length > 2 && (
                                              <Badge variant="secondary" className="text-[10px]">
                                                +{course.prerequisites.length - 2}
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-slate-400">-</span>
                                        )}
                                      </TableCell>
                              
                                      {/* التوصيف */}
                                      <TableCell className="text-center align-top py-4">
                                        <Button 
                                          size="sm" 
                                          variant="secondary" 
                                          className="gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 whitespace-nowrap text-xs" 
                                          onClick={() => handleOpenQuality(course)}
                                        >
                                          <Target className="w-3 h-3" /> 
                                          التوصيف
                                        </Button>
                                      </TableCell>
                              
                                      {/* الإجراءات */}
                                      <TableCell className="text-left align-top py-4">
                                        <div className="flex gap-1 justify-end flex-wrap">
                                          {can('study_plan.update') && (
                                            <Button 
                                              size="sm" 
                                              variant="ghost"
                                              className="hover:bg-blue-50 hover:text-blue-700 h-8 w-8 p-0"
                                              onClick={() => handleEditCourse(course)}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                          )}
                              
                                          {can('study_plan.delete') && (
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                              onClick={() => handleDeleteCourse(course.id)}
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
                          </div>
                        </div>
                      );
                    })()}

                    {/* Modals للمتطلبات */}
                  <Dialog open={isPrereqSelectOpen} onOpenChange={setIsPrereqSelectOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-600" />
                          اختيار المتطلبات السابقة
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                        {availableCoursesForPrereq.map(course => (
                          <div 
                            key={course.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              courseFormData.prerequisiteIds.includes(course.id)
                                ? "bg-indigo-50 border-indigo-300"
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            )}
                            onClick={() => {
                              const isSelected = courseFormData.prerequisiteIds.includes(course.id);
                              setCourseFormData({
                                ...courseFormData,
                                prerequisiteIds: isSelected
                                  ? courseFormData.prerequisiteIds.filter(id => id !== course.id)
                                  : [...courseFormData.prerequisiteIds, course.id]
                              });
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={courseFormData.prerequisiteIds.includes(course.id)}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{course.course_name}</div>
                              <div className="text-sm text-slate-500">{course.course_code}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button onClick={() => setIsPrereqSelectOpen(false)}>
                          تم ({courseFormData.prerequisiteIds.length} مقرر)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  
                  <Dialog open={isCoreqSelectOpen} onOpenChange={setIsCoreqSelectOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          اختيار المتطلبات المصاحبة
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                        {availableCoursesForPrereq.map(course => (
                          <div 
                            key={course.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              courseFormData.corequisiteIds.includes(course.id)
                                ? "bg-blue-50 border-blue-300"
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            )}
                            onClick={() => {
                              const isSelected = courseFormData.corequisiteIds.includes(course.id);
                              setCourseFormData({
                                ...courseFormData,
                                corequisiteIds: isSelected
                                  ? courseFormData.corequisiteIds.filter(id => id !== course.id)
                                  : [...courseFormData.corequisiteIds, course.id]
                              });
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={courseFormData.corequisiteIds.includes(course.id)}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{course.course_name}</div>
                              <div className="text-sm text-slate-500">{course.course_code}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <DialogFooter>
                        <Button onClick={() => setIsCoreqSelectOpen(false)}>
                          تم ({courseFormData.corequisiteIds.length} مقرر)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  </CardContent>
                </Card>
              )}
            </div>
          )}
 
        </div>
      )}

      <CourseQualityDialog
        isOpen={!!qualityDialogCourse}
        onClose={() => setQualityDialogCourse(null)}
        course={qualityDialogCourse}
      />
    </div>
  );
}