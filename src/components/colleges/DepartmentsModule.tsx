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
  Clock, AlertCircle, X, ChevronRight, BookOpen, GraduationCap, Calendar, Box
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
  name: string;
  theoretical_hours: number;
  practical_hours: number;
  exercise_hours: number;
  seminar_hours: number;
};

type ApiCourse = { 
  id: number; 
  semester_id?: number;
  block_id?: number;
  course_code: string; 
  course_name: string; 
  credit_hours: number;
  course_parts: CoursePart[];
  is_elective: boolean; 
  department_id?: number | null; 
  notes?: string | null; 
  weight?: number;
  prerequisites?: string;
  corequisites?: string;
  teaching_language?: string;
  category?: string;
};

type Block = {
  id: number;
  program_id?: number;
  level_id?: number;
  block_name: string;
  block_number: number;
  weeks: number;
  weight: number;
};

type ProgramOutcome = {
  id: string;
  code: string;
  name: string;
  domain: string;
  weight: number;
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
    weight: 0
  });

  const [termCourses, setTermCourses] = useState<ApiCourse[]>([]);
  const [blockCourses, setBlockCourses] = useState<ApiCourse[]>([]);
  const [categoryCourses, setCategoryCourses] = useState<ApiCourse[]>([]);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null);
  const [courseFormData, setCourseFormData] = useState<{
    courseCode: string;
    courseName: string;
    creditHours: number;
    courseParts: CoursePart[];
    isElective: boolean;
    departmentId: string;
    notes: string;
    weight: number;
    prerequisites: string;
    corequisites: string;
    teachingLanguage: string;
    category: string;
  }>({ 
    courseCode: "", 
    courseName: "", 
    creditHours: 3, 
    courseParts: [{ 
      name: "نظري", 
      theoretical_hours: 2, 
      practical_hours: 0, 
      exercise_hours: 0, 
      seminar_hours: 0 
    }],
    isElective: false, 
    departmentId: "", 
    notes: "", 
    weight: 0,
    prerequisites: "",
    corequisites: "",
    teachingLanguage: "العربية",
    category: "متطلب تخصص"
  });

  const [isProgramOutcomesDialogOpen, setIsProgramOutcomesDialogOpen] = useState(false);
  const [activeProgramForOutcomes, setActiveProgramForOutcomes] = useState<Program | null>(null);
  const [programOutcomes, setProgramOutcomes] = useState<ProgramOutcome[]>([]);
  const [isProgramOutcomeFormOpen, setIsProgramOutcomeFormOpen] = useState(false);
  const [programOutcomeFormMode, setProgramOutcomeFormMode] = useState<"add" | "edit">("add");
  const [programOutcomeFormData, setProgramOutcomeFormData] = useState<Partial<ProgramOutcome>>({});

  const [qualityDialogCourse, setQualityDialogCourse] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("متطلب تخصص");

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
      const blocks = (raw as any[]).map((b) => ({
        id: b.id,
        program_id: b.program_id,
        level_id: b.level_id,
        block_name: b.block_name || b.name,
        block_number: b.block_number || b.number,
        weeks: b.weeks || 6,
        weight: b.weight || 0
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

  const fetchCourses = async (semesterId?: number, blockId?: number, category?: string) => { 
    try {
      let params: any = {};
      if (semesterId) params.semester_id = semesterId;
      if (blockId) params.block_id = blockId;
      if (category) params.category = category;

      const res = await api.get("/v1/courses", { params });
      const raw = res.data?.data ?? res.data;
      const courses = (raw as any[]).map((c) => ({
        id: c.id ?? c.course_id,
        semester_id: c.semester_id,
        block_id: c.block_id,
        course_code: c.course_code ?? "",
        course_name: c.course_name ?? "",
        credit_hours: Number(c.credit_hours ?? 0),
        course_parts: c.course_parts || [{ name: "نظري", theoretical_hours: 2, practical_hours: 0, exercise_hours: 0, seminar_hours: 0 }],
        is_elective: Boolean(c.is_elective ?? false),
        department_id: c.department_id ?? null,
        notes: c.notes ?? "",
        weight: c.weight || 0,
        prerequisites: c.prerequisites || "",
        corequisites: c.corequisites || "",
        teaching_language: c.teaching_language || "العربية",
        category: c.category || "متطلب تخصص"
      }));

      if (semesterId) {
        setTermCourses(courses);
      } else if (blockId) {
        setBlockCourses(courses);
      } else if (category) {
        setCategoryCourses(courses);
      }
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المقررات", variant: "destructive" });
    }
  };

  const fetchProgramOutcomes = async (programId: number) => {
    try {
      const res = await api.get(`/v1/programs/${programId}/outcomes`);
      setProgramOutcomes(res.data?.data || []);
    } catch {
      setProgramOutcomes([]);
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
        fetchLevels(selectedProgram.id);
      } else if (selectedProgram.academic_system === 'semester' && selectedProgram.block_based) {
        fetchLevels(selectedProgram.id);
      } else if (selectedProgram.academic_system === 'credit' && !selectedProgram.block_based) {
        // عرض التصنيفات مباشرة
      } else if (selectedProgram.academic_system === 'credit' && selectedProgram.block_based) {
        fetchBlocks(selectedProgram.id);
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
    if (selectedProgram && selectedProgram.academic_system === 'credit' && !selectedProgram.block_based) {
      fetchCourses(undefined, undefined, activeCategory);
    }
  }, [activeCategory, selectedProgram]);

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

  const handleOpenProgramOutcomes = (program: Program) => {
    setActiveProgramForOutcomes(program);
    fetchProgramOutcomes(program.id);
    setIsProgramOutcomesDialogOpen(true);
  };

  const handleSaveProgramOutcome = async () => {
    try {
      const payload = {
        ...programOutcomeFormData,
        program_id: activeProgramForOutcomes!.id
      };

      if (programOutcomeFormMode === "edit" && programOutcomeFormData.id) {
        await api.put(`/v1/program-outcomes/${programOutcomeFormData.id}`, payload);
      } else {
        await api.post("/v1/program-outcomes", payload);
      }

      setIsProgramOutcomeFormOpen(false);
      fetchProgramOutcomes(activeProgramForOutcomes!.id);
      toast({ title: "نجاح", description: "تم الحفظ" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحفظ", variant: "destructive" });
    }
  };

  const handleDeleteProgramOutcome = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    try {
      await api.delete(`/v1/program-outcomes/${id}`);
      fetchProgramOutcomes(activeProgramForOutcomes!.id);
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  // ==========================================
  // Level Handlers
  // ==========================================

  const handleAddLevel = () => { 
    setEditingLevel(null); 
    setLevelFormData({ levelNumber: 1 }); 
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
    setTermFormData({ semesterName: "", termNumber: 1 }); 
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
    setBlockFormData({ blockName: "", blockNumber: 1, weeks: 6, weight: 0 });
    setIsBlockFormOpen(true);
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setBlockFormData({
      blockName: block.block_name,
      blockNumber: block.block_number,
      weeks: block.weeks,
      weight: block.weight
    });
    setIsBlockFormOpen(true);
  };

  const handleSubmitBlock = async (e: any) => {
    e.preventDefault();
    try {
      const payload: any = {
        block_name: blockFormData.blockName,
        block_number: blockFormData.blockNumber,
        weeks: blockFormData.weeks,
        weight: blockFormData.weight
      };

      if (selectedLevel) {
        payload.level_id = selectedLevel.id;
      } else if (selectedProgram) {
        payload.program_id = selectedProgram.id;
      }

      if (editingBlock) {
        await api.put(`/v1/blocks/${editingBlock.id}`, payload);
      } else {
        await api.post("/v1/blocks", payload);
      }

      setIsBlockFormOpen(false);
      
      if (selectedLevel) {
        fetchBlocks(undefined, selectedLevel.id);
      } else {
        fetchBlocks(selectedProgram!.id);
      }
      
      toast({ title: "نجاح", description: "تم حفظ البلوك" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ البلوك", variant: "destructive" });
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
  // Course Handlers
  // ==========================================

  const handleAddCourse = () => { 
    setEditingCourse(null); 
    setCourseFormData({ 
      courseCode: "", 
      courseName: "", 
      creditHours: 3, 
      courseParts: [{ 
        name: "نظري", 
        theoretical_hours: 2, 
        practical_hours: 0, 
        exercise_hours: 0, 
        seminar_hours: 0 
      }],
      isElective: false, 
      departmentId: "", 
      notes: "", 
      weight: 0,
      prerequisites: "",
      corequisites: "",
      teachingLanguage: "العربية",
      category: activeCategory || "متطلب تخصص"
    }); 
    setIsCourseFormOpen(true); 
  };

  const handleEditCourse = (course: ApiCourse) => {
    setEditingCourse(course);
    setCourseFormData({
      courseCode: course.course_code,
      courseName: course.course_name,
      creditHours: course.credit_hours,
      courseParts: course.course_parts,
      isElective: course.is_elective,
      departmentId: course.department_id?.toString() || "",
      notes: course.notes || "",
      weight: course.weight || 0,
      prerequisites: course.prerequisites || "",
      corequisites: course.corequisites || "",
      teachingLanguage: course.teaching_language || "العربية",
      category: course.category || "متطلب تخصص"
    });
    setIsCourseFormOpen(true);
  };

  const handleSubmitCourse = async (e: any) => { 
    e.preventDefault(); 
    try { 
      const payload: any = { 
        course_code: courseFormData.courseCode, 
        course_name: courseFormData.courseName, 
        credit_hours: Number(courseFormData.creditHours), 
        course_parts: courseFormData.courseParts,
        is_elective: courseFormData.isElective, 
        notes: courseFormData.notes || null, 
        weight: Number(courseFormData.weight),
        prerequisites: courseFormData.prerequisites || null,
        corequisites: courseFormData.corequisites || null,
        teaching_language: courseFormData.teachingLanguage,
        category: courseFormData.category,
        college_id: Number(collegeId), 
        department_id: selectedDepartment!.department_id, 
        program_id: selectedProgram!.id
      };

      if (selectedLevel) payload.level_id = selectedLevel.id;
      if (selectedTerm) payload.semester_id = selectedTerm.id;
      if (selectedBlock) payload.block_id = selectedBlock.id;

      if(editingCourse) {
        await api.put(`/v1/courses/${editingCourse.id}`, payload);
      } else {
        await api.post("/v1/courses", payload);
      }
      
      setIsCourseFormOpen(false); 
      
      if (selectedTerm) {
        fetchCourses(selectedTerm.id);
      } else if (selectedBlock) {
        fetchCourses(undefined, selectedBlock.id);
      } else {
        fetchCourses(undefined, undefined, activeCategory);
      }
      
      toast({ title: "نجاح", description: "تم حفظ المقرر" }); 
    } catch { 
      toast({ title: "خطأ", description: "فشل حفظ المقرر", variant: "destructive" }); 
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
        fetchCourses(undefined, undefined, activeCategory);
      }
      
      toast({ title: "نجاح", description: "تم الحذف" });
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  const handleOpenQuality = (course: ApiCourse) => {
    setQualityDialogCourse({
      ...course,
      parts: course.course_parts?.map(p => p.name) || ["نظري"]
    });
  };

  const handleAddCoursePart = () => {
    setCourseFormData({
      ...courseFormData,
      courseParts: [
        ...courseFormData.courseParts,
        { name: "", theoretical_hours: 0, practical_hours: 0, exercise_hours: 0, seminar_hours: 0 }
      ]
    });
  };

  const handleRemoveCoursePart = (index: number) => {
    if (courseFormData.courseParts.length === 1) {
      toast({ title: "تحذير", description: "يجب أن يكون للمقرر جزء واحد على الأقل", variant: "destructive" });
      return;
    }
    setCourseFormData({
      ...courseFormData,
      courseParts: courseFormData.courseParts.filter((_, i) => i !== index)
    });
  };

  const handleUpdateCoursePart = (index: number, field: keyof CoursePart, value: any) => {
    const updated = [...courseFormData.courseParts];
    updated[index] = { ...updated[index], [field]: value };
    setCourseFormData({ ...courseFormData, courseParts: updated });
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500" dir="rtl">
      
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

          {/* مخرجات البرنامج */}
          <Dialog open={isProgramOutcomesDialogOpen} onOpenChange={setIsProgramOutcomesDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
                    <Target className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <DialogTitle className="text-xl">مخرجات التعلم للبرنامج (PLOs)</DialogTitle>
                      <DialogDescription className="text-base mt-1">
                        {selectedDepartment?.department_name} • <span className="font-bold text-indigo-700">{activeProgramForOutcomes?.name}</span>
                      </DialogDescription>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-center">
                      <div className="text-xs text-slate-500 font-medium mb-1">إجمالي الأوزان</div>
                      <div className={cn(
                        "font-bold",
                        programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0) > 100 
                          ? "text-red-600" 
                          : "text-emerald-600"
                      )}>
                        {programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="p-6 flex-1 overflow-y-auto bg-white">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-slate-600">مخرجات التعلم المستهدفة على مستوى البرنامج</p>
                  <Button 
                    onClick={() => { 
                      setProgramOutcomeFormMode("add"); 
                      setProgramOutcomeFormData({ domain: "معرفي", weight: 0 }); 
                      setIsProgramOutcomeFormOpen(true); 
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> إضافة مخرج
                  </Button>
                </div>

                <div className="space-y-3">
                  {programOutcomes.map((outcome) => (
                    <div 
                      key={outcome.id} 
                      className="flex justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors shadow-sm bg-white"
                    >
                      <div className="flex gap-4">
                        <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-3 py-1.5 rounded-lg text-sm h-fit shrink-0 mt-0.5">
                          {outcome.code}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-base">{outcome.name}</p>
                          <div className="flex gap-2 mt-2.5">
                            <Badge variant="outline" className="bg-white text-slate-600 font-normal">
                              {outcome.domain}
                            </Badge>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
                              الوزن: {outcome.weight}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start shrink-0">
                        <Button 
                          size="icon" 
                          variant="ghost" 
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
                          className="text-red-500" 
                          onClick={() => handleDeleteProgramOutcome(outcome.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isProgramOutcomeFormOpen} onOpenChange={setIsProgramOutcomeFormOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {programOutcomeFormMode === "add" ? "إضافة مخرج للبرنامج" : "تعديل المخرج"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>الرمز</Label>
                    <Input 
                      value={programOutcomeFormData.code || ""}
                      onChange={e => setProgramOutcomeFormData({...programOutcomeFormData, code: e.target.value})}
                      placeholder="PLO-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوزن (%)</Label>
                    <Input 
                      type="number"
                      value={programOutcomeFormData.weight || ""}
                      onChange={e => setProgramOutcomeFormData({...programOutcomeFormData, weight: Number(e.target.value)})}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المجال</Label>
                    <Select 
                      value={programOutcomeFormData.domain}
                      onValueChange={v => setProgramOutcomeFormData({...programOutcomeFormData, domain: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="معرفي">معرفي</SelectItem>
                        <SelectItem value="مهاري">مهاري</SelectItem>
                        <SelectItem value="وجداني">وجداني</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>النص</Label>
                  <Textarea 
                    value={programOutcomeFormData.name || ""}
                    onChange={e => setProgramOutcomeFormData({...programOutcomeFormData, name: e.target.value})}
                    placeholder="وصف المخرج..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProgramOutcomeFormOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveProgramOutcome}>
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
                            </div>

                            <div className="space-y-2">
                              <Label>نوع المتطلب</Label>
                              <Select 
                                value={courseFormData.category}
                                onValueChange={v => setCourseFormData({...courseFormData, category: v})}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="متطلب جامعة">متطلب جامعة</SelectItem>
                                  <SelectItem value="متطلب كلية">متطلب كلية</SelectItem>
                                  <SelectItem value="متطلب تخصص">متطلب تخصص (إجباري)</SelectItem>
                                  <SelectItem value="متطلب اختياري">متطلب تخصص (اختياري)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3 bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-bold text-slate-700">أجزاء المقرر (نوع المقرر)</Label>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs" 
                                onClick={handleAddCoursePart}
                              >
                                <Plus className="w-3 h-3 mr-1" /> إضافة جزء
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {courseFormData.courseParts.map((part, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      value={part.name}
                                      onChange={e => handleUpdateCoursePart(idx, 'name', e.target.value)}
                                      placeholder="مثال: نظري، عملي، تمارين"
                                      className="bg-white flex-1"
                                    />
                                    {courseFormData.courseParts.length > 1 && (
                                      <Button 
                                        type="button"
                                        size="icon" 
                                        variant="ghost"
                                        className="text-red-500 hover:bg-red-50"
                                        onClick={() => handleRemoveCoursePart(idx)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-slate-600">نظري</Label>
                                      <Input 
                                        type="number"
                                        min="0"
                                        value={part.theoretical_hours}
                                        onChange={e => handleUpdateCoursePart(idx, 'theoretical_hours', +e.target.value)}
                                        className="bg-white h-8 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-slate-600">عملي</Label>
                                      <Input 
                                        type="number"
                                        min="0"
                                        value={part.practical_hours}
                                        onChange={e => handleUpdateCoursePart(idx, 'practical_hours', +e.target.value)}
                                        className="bg-white h-8 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-slate-600">تمارين</Label>
                                      <Input 
                                        type="number"
                                        min="0"
                                        value={part.exercise_hours}
                                        onChange={e => handleUpdateCoursePart(idx, 'exercise_hours', +e.target.value)}
                                        className="bg-white h-8 text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-slate-600">سمنار</Label>
                                      <Input 
                                        type="number"
                                        min="0"
                                        value={part.seminar_hours}
                                        onChange={e => handleUpdateCoursePart(idx, 'seminar_hours', +e.target.value)}
                                        className="bg-white h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>المتطلبات السابقة (إن وجدت)</Label>
                              <Input 
                                value={courseFormData.prerequisites}
                                onChange={e => setCourseFormData({...courseFormData, prerequisites: e.target.value})}
                                placeholder="مثال: CS101, MATH101"
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>المتطلبات المصاحبة (إن وجدت)</Label>
                              <Input 
                                value={courseFormData.corequisites}
                                onChange={e => setCourseFormData({...courseFormData, corequisites: e.target.value})}
                                placeholder="مثال: PHYS101"
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>لغة التدريس</Label>
                              <Select 
                                value={courseFormData.teachingLanguage}
                                onValueChange={v => setCourseFormData({...courseFormData, teachingLanguage: v})}
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
                              <Label>النظام (تلقائي)</Label>
                              <Input 
                                value={selectedProgram?.academic_system === 'semester' ? 'فصلي' : 'ساعات'}
                                disabled
                                className="bg-slate-100 cursor-not-allowed"
                              />
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

                          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                            <Switch 
                              checked={courseFormData.isElective}
                              onCheckedChange={c => setCourseFormData({...courseFormData, isElective: c})}
                            />
                            <Label className="cursor-pointer">مقرر اختياري</Label>
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

                    <div className="border rounded-md overflow-hidden">
                      <Table className="bg-white">
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>الكود</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead className="text-center">الساعات</TableHead>
                            <TableHead className="text-center">الأجزاء</TableHead>
                            <TableHead className="text-center text-emerald-700">الوزن %</TableHead>
                            <TableHead className="text-center">الجودة</TableHead>
                            <TableHead className="text-left">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {termCourses.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                لا توجد مقررات مسجلة
                              </TableCell>
                            </TableRow>
                          ) : (
                            termCourses.map(course => (
                              <TableRow key={course.id} className="hover:bg-slate-50">
                                <TableCell className="font-mono text-slate-600">{course.course_code}</TableCell>
                                <TableCell className="font-semibold text-slate-800">{course.course_name}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{course.credit_hours}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {course.course_parts.map((part, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-[10px]">
                                        {part.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {course.weight || 0}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="gap-2 text-blue-700 bg-blue-50 hover:bg-blue-100" 
                                    onClick={() => handleOpenQuality(course)}
                                  >
                                    <Target className="w-4 h-4" /> التوصيف
                                  </Button>
                                </TableCell>
                                <TableCell className="text-left">
                                  <div className="flex gap-1 justify-end">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleEditCourse(course)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-500" 
                                      onClick={() => handleDeleteCourse(course.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* نظام الفصول + بلوكات */}
          {selectedProgram && selectedProgram.academic_system === 'semester' && selectedProgram.block_based && (
            <div className="space-y-6">
              {/* تنبيه نوع النظام */}
              <div className="flex items-center gap-3 text-indigo-700 bg-indigo-50 p-4 rounded-lg border border-indigo-200 animate-in fade-in duration-500">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="text-sm">
                  <strong>نظام البلوكات (Block-Based System):</strong> يتم تنظيم المنهج في وحدات زمنية مكثفة (بلوكات) داخل كل مستوى دراسي.
                </p>
              </div>
          
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
                      <Button size="sm" onClick={() => setIsBlockFormOpen(true)} className="h-8 bg-indigo-600">
                        <Plus className="w-3.5 h-3.5 mr-1" /> إضافة بلوك
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    
                    {/* فورم البلوك (تصميم أمامي فقط حالياً) */}
                    {isBlockFormOpen && (
                      <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <Label>اسم البلوك</Label>
                            <Input placeholder="مثال: بلوك الجهاز الهضمي" className="bg-white" />
                          </div>
                          <div className="space-y-2">
                            <Label>كود البلوك</Label>
                            <Input placeholder="GI202" className="bg-white font-mono" />
                          </div>
                          <div className="space-y-2">
                            <Label>عدد الأسابيع</Label>
                            <Input type="number" placeholder="4" className="bg-white" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsBlockFormOpen(false)}>إلغاء</Button>
                          <Button size="sm" className="bg-indigo-600">حفظ البلوك</Button>
                        </div>
                      </div>
                    )}
          
                    {/* عرض البلوكات بشكل بطاقات طولية أو شبكة */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* مثال لبلوك معروض */}
                      <div className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow group relative border-r-4 border-r-indigo-500">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">GI202</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">بلوك الجهاز الهضمي</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> المدة: 4 أسابيع
                        </p>
                        
                        <Button 
                          variant="secondary" 
                          className="w-full mt-4 h-8 text-xs bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                          onClick={() => setSelectedBlock({
                            id: 1, 
                            block_name: 'الجهاز الهضمي', 
                            block_number: 1, // إجباري حسب الـ type
                            weeks: 4,        // إجباري حسب الـ type
                            weight: 10       // إجباري حسب الـ type
                          })}
                        >
                          عرض المقررات داخل البلوك
                        </Button>
                      </div>
                    </div>
          
                    {/* في حال لا توجد بلوكات */}
                    <div className="text-center py-10 border-2 border-dashed rounded-xl mt-4">
                       <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Box className="text-slate-300 w-6 h-6" />
                       </div>
                       <p className="text-slate-400 text-sm">لا توجد بلوكات مضافة لهذا المستوى بعد</p>
                    </div>
          
                  </CardContent>
                </Card>
              )}
          
              {/* ثالثاً: المقررات (تظهر عند اختيار بلوك معين) */}
              {selectedBlock && (
                <div className="animate-in fade-in slide-in-from-top-4">
                    <Card className="border-t-4 border-t-indigo-600">
                      <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle className="text-lg">مقررات {selectedBlock.block_name}</CardTitle>
                            <CardDescription>إدارة المواد الدراسية التابعة لهذا البلوك</CardDescription>
                         </div>
                         <Button onClick={handleAddCourse}>
                            <Plus className="w-4 h-4 mr-2" /> إضافة مقرر للبلوك
                         </Button>
                      </CardHeader>
                      <CardContent>
                         {/* هنا نستخدم نفس جدول المقررات الموجود في كود "الفصول" الخاص بك */}
                         <div className="rounded-md border">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>الكود</TableHead>
                                    <TableHead>اسم المقرر</TableHead>
                                    <TableHead className="text-center">الساعات</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-slate-400">
                                       لم يتم إضافة مقررات لهذا البلوك
                                    </TableCell>
                                 </TableRow>
                              </TableBody>
                           </Table>
                         </div>
                      </CardContent>
                    </Card>
                </div>
              )}
            </div>
          )}

          {/* نظام الساعات المعتمدة (بدون بلوكات) */}
          {selectedProgram && selectedProgram.academic_system === 'credit' && !selectedProgram.block_based && (
            <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
              <CardHeader className="bg-blue-50/50 border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      <Clock className="w-5 h-5"/> نظام الساعات المعتمدة
                    </CardTitle>
                    <CardDescription>برنامج: {selectedProgram.name} (إدارة المقررات حسب التصنيف)</CardDescription>
                  </div>
                  <Button onClick={handleAddCourse} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> إضافة مقرر
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
                
                <div className="w-full md:w-64 shrink-0 space-y-2">
                  {["متطلب جامعة", "متطلب كلية", "متطلب تخصص", "متطلب اختياري"].map(cat => (
                    <div 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)} 
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all font-medium text-sm", 
                        activeCategory === cat 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      )}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                <div className="flex-1">
                  {isCourseFormOpen && (
                    <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">
                        إضافة مقرر لـ ({activeCategory})
                      </h4>
                      <form onSubmit={handleSubmitCourse} className="space-y-4">
                        {/* (نفس الفورم السابق) */}
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsCourseFormOpen(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit">
                            حفظ
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-slate-800 mb-4">{activeCategory}</h3>
                  <div className="space-y-3">
                    {categoryCourses.filter(c => c.category === activeCategory).map(course => (
                      <div 
                        key={course.id} 
                        className="p-4 border rounded-xl bg-white hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 text-blue-800 w-12 h-12 flex items-center justify-center rounded-lg font-black text-lg shrink-0">
                            {course.credit_hours}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              {course.course_name} 
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {course.course_code}
                              </span>
                            </h4>
                            <div className="flex gap-2 mt-2">
                              {course.prerequisites && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                  متطلب: {course.prerequisites}
                                </Badge>
                              )}
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                الوزن: {course.weight}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200" 
                            onClick={() => handleOpenQuality(course)}
                          >
                            <Target className="w-4 h-4 mr-1.5"/> التوصيف
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditCourse(course)}>
                            <Edit className="w-4 h-4 text-slate-500"/>
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-500"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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