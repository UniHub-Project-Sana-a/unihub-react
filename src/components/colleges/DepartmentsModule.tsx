import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  Plus, Edit, Trash2, Loader2, Pencil, Target, ArrowLeft, ArrowRight, LayoutGrid, Layers, Settings2, Clock, CalendarRange 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

// ==========================================
// Types Definitions
// ==========================================

type ApiDepartment = { department_id: number; department_name: string; department_code?: string | null; college_id: number; };
type Program = { id: number; name: string; is_active: boolean; system_type: "semester" | "credit" | "block"; }; // 🌟 NEW: system_type
type ApiLevel = { id: number; program_id: number; level_number: number; };
type ApiSemester = { id: number; level_id: number; term_number: 1 | 2; };
type ApiCourse = { id: number; semester_id: number; course_code: string; course_name: string; credit_hours: number; is_elective: boolean; department_id?: number | null; notes?: string | null; parts?: string[]; weight?: number; }; // 🌟 NEW: weight & parts

interface QA_Outcome { id: string; name: string; type: string; code: string; weight?: number; }
interface QA_Topic { id: string; title: string; description: string; outcomeIds: string[]; order_index?: number; weight?: number; }
interface QA_Option { id: string; text: string; isCorrect: boolean; }
interface QA_Question { id: string; text: string; type: string; topicId: string; outcomeId?: string; difficulty?: number; options: QA_Option[]; weight?: number; }

const departmentSchema = z.object({ department_name: z.string().min(2, "الاسم مطلوب"), department_code: z.string().min(1, "الكود مطلوب"), });
type DepartmentFormData = z.infer<typeof departmentSchema>;


// ==========================================
// MOCK VIEWS FOR CREDIT AND BLOCK SYSTEMS
// ==========================================
// ============================================================================
// 1. نظام الساعات المعتمدة (Credit Hour System)
// يعتمد على: متطلبات جامعة، كلية، تخصص، ومتطلبات سابقة
// ============================================================================
const CreditHourSystemView = ({ program, onOpenQa }: { program: Program, onOpenQa: (course: any) => void }) => {
    // محاكاة للبيانات (UI State)
    const categories = ["متطلبات جامعة", "متطلبات كلية", "متطلبات تخصص (إجباري)", "متطلبات تخصص (اختياري)"];
    const [activeCat, setActiveCat] = useState(categories[2]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // قائمة مواد وهمية للتوضيح
    const [courses] = useState([
        { id: 201, course_code: "CS201", course_name: "هياكل البيانات", credit_hours: 3, prerequisite: "CS101", weight: 15, parts: ["نظري", "عملي"], category: "متطلبات تخصص (إجباري)" },
        { id: 202, course_code: "CS202", course_name: "الخوارزميات", credit_hours: 3, prerequisite: "CS201", weight: 20, parts: ["نظري", "تمارين"], category: "متطلبات تخصص (إجباري)" },
    ]);

    return (
        <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
            <CardHeader className="bg-blue-50/50 border-b pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg text-blue-800 flex items-center gap-2"><Clock className="w-5 h-5"/> الخطة الدراسية: نظام الساعات</CardTitle>
                        <CardDescription>برنامج: {program.name} (إجمالي الساعات: 132)</CardDescription>
                    </div>
                    <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> إضافة مقرر</Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
                
                {/* القائمة الجانبية: التصنيفات */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                    {categories.map(cat => (
                        <div key={cat} onClick={() => setActiveCat(cat)} className={cn("p-3 rounded-lg border cursor-pointer transition-all font-medium text-sm", activeCat === cat ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 hover:bg-slate-100 text-slate-700")}>
                            {cat}
                        </div>
                    ))}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                        <div className="font-bold text-blue-800 mb-2">إحصائيات الخطة</div>
                        <div className="flex justify-between text-slate-600"><span>الساعات المنجزة:</span> <span className="font-bold">45</span></div>
                        <div className="flex justify-between text-slate-600"><span>إجمالي الأوزان:</span> <span className="font-bold text-emerald-600">100%</span></div>
                    </div>
                </div>

                {/* المحتوى: المواد التابعة للتصنيف */}
                <div className="flex-1">
                    {isFormOpen && (
                        <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                            <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">إضافة مقرر لـ ({activeCat})</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>الاسم</Label><Input placeholder="اسم المقرر" /></div>
                                <div className="space-y-2"><Label>الكود</Label><Input placeholder="CS101" /></div>
                                <div className="space-y-2"><Label>الساعات</Label><Input type="number" defaultValue={3} /></div>
                                <div className="space-y-2"><Label>المتطلب السابق</Label><Input placeholder="مثال: CS100" /></div>
                                <div className="space-y-2"><Label className="text-emerald-700">وزن المادة %</Label><Input type="number" placeholder="%" className="bg-emerald-50" /></div>
                                <div className="flex items-end gap-2">
                                    <Button className="w-full">حفظ</Button>
                                    <Button variant="outline" onClick={() => setIsFormOpen(false)}>إلغاء</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <h3 className="text-lg font-bold text-slate-800 mb-4">{activeCat}</h3>
                    <div className="space-y-3">
                        {courses.filter(c => c.category === activeCat).map(course => (
                            <div key={course.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 text-blue-800 w-12 h-12 flex items-center justify-center rounded-lg font-black text-lg shrink-0">{course.credit_hours}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            {course.course_name} <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{course.course_code}</span>
                                        </h4>
                                        <div className="flex gap-2 mt-2">
                                            {course.prerequisite && <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">متطلب: {course.prerequisite}</Badge>}
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">الوزن: {course.weight}%</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {/* 🌟 السر هنا: استدعاء نفس نافذة الجودة الخاصة بالفصول! */}
                                    <Button size="sm" variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200" onClick={() => onOpenQa(course)}>
                                        <Target className="w-4 h-4 mr-1.5"/> ملف الجودة
                                    </Button>
                                    <Button size="icon" variant="ghost"><Edit className="w-4 h-4 text-slate-500"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ============================================================================
// 2. نظام البلوكات (Block System) - الكليات الطبية
// يعتمد على: سنوات، بلوكات (أسابيع)، ومقررات مدمجة داخل البلوك
// ============================================================================
const BlockSystemView = ({ program, onOpenQa }: { program: Program, onOpenQa: (course: any) => void }) => {
    const [activeYear, setActiveYear] = useState(2);
    const [activeBlockId, setActiveBlockId] = useState(1);

    const blocks = [
        { id: 1, year: 2, name: "الجهاز التنفسي (Respiratory)", weeks: 6, weight: 15 },
        { id: 2, year: 2, name: "القلب والأوعية (Cardiovascular)", weeks: 8, weight: 20 },
    ];

    const subjects = [
        { id: 301, block_id: 1, course_code: "ANAT-R", course_name: "التشريح (Anatomy)", weight: 30, parts: ["نظري", "مشرحة"], hours: 24 },
        { id: 302, block_id: 1, course_code: "PHYS-R", course_name: "وظائف الأعضاء (Physiology)", weight: 40, parts: ["نظري", "معمل"], hours: 32 },
        { id: 303, block_id: 1, course_code: "PATH-R", course_name: "علم الأمراض (Pathology)", weight: 30, parts: ["نظري"], hours: 20 },
    ];

    return (
        <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
            <CardHeader className="bg-indigo-50/50 border-b pb-4">
                <CardTitle className="text-lg text-indigo-800 flex items-center gap-2"><LayoutGrid className="w-5 h-5"/> نظام البلوكات الطبية</CardTitle>
                <CardDescription>إدارة الوحدات والمقررات المدمجة لبرنامج: {program.name}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                
                {/* 1. اختيار السنة الدراسية */}
                <div className="flex items-center gap-3 border-b pb-4">
                    <Label className="font-bold text-slate-700">السنة الدراسية:</Label>
                    {[1, 2, 3, 4, 5].map(year => (
                        <Button key={year} size="sm" variant={activeYear === year ? "default" : "outline"} className={activeYear === year ? "bg-indigo-600" : ""} onClick={() => setActiveYear(year)}>
                            السنة {year}
                        </Button>
                    ))}
                </div>

                {/* 2. البلوكات (الوحدات) في هذه السنة */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800">البلوكات (Modules) - السنة {activeYear}</h3>
                        <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1"/> إضافة بلوك</Button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {blocks.filter(b => b.year === activeYear).map(block => (
                            <div key={block.id} onClick={() => setActiveBlockId(block.id)} className={cn("min-w-[240px] p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2", activeBlockId === block.id ? "border-indigo-600 bg-indigo-50/50 shadow-md" : "border-slate-200 bg-white hover:border-indigo-300")}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-indigo-900 leading-tight">{block.name}</h4>
                                </div>
                                <div className="flex justify-between items-center mt-2 text-sm">
                                    <Badge variant="secondary" className="bg-white"><CalendarRange className="w-3 h-3 mr-1"/> {block.weeks} أسابيع</Badge>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">الوزن: {block.weight}%</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. المقررات المدمجة داخل البلوك (Subjects/Disciplines) */}
                <div className="bg-slate-50 p-5 rounded-xl border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">مكونات البلوك (المقررات)</h3>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-1"/> إضافة مقرر</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.filter(s => s.block_id === activeBlockId).map(sub => (
                            <div key={sub.id} className="bg-white p-4 rounded-lg border flex flex-col justify-between hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-slate-800">{sub.course_name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">رمز: {sub.course_code} • {sub.hours} ساعة تدريسية</div>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{sub.weight}%</Badge>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-3 border-t">
                                    <div className="flex gap-1">
                                        {sub.parts.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
                                    </div>
                                    {/* 🌟 السر هنا أيضاً: ملف الجودة الموحد! */}
                                    <Button size="sm" variant="ghost" className="h-7 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" onClick={() => onOpenQa(sub)}>
                                        <Target className="w-3.5 h-3.5 mr-1" /> الجودة
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};


// ==========================================
// MAIN COMPONENT
// ==========================================
export default function DepartmentsModule({ collegeId }: { collegeId: string }) {
  const { can } = usePermission();
  const { toast } = useToast();

  // State Management - الأساسي
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<ApiDepartment | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ApiLevel | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ApiSemester | null>(null);
  
  // States - البرامج
  const [departmentPrograms, setDepartmentPrograms] = useState<Program[]>([]);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  // 🌟 NEW: تم إضافة system_type لفورم البرنامج
  const [programFormData, setProgramFormData] = useState<{ name: string; is_active: boolean; system_type: "semester" | "credit" | "block" }>({ name: "", is_active: true, system_type: "semester" });
  
  // States - المستويات والأترام والمواد
  const [programLevels, setProgramLevels] = useState<ApiLevel[]>([]);
  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ApiLevel | null>(null);
  const [levelFormData, setLevelFormData] = useState({ levelNumber: 1 });
  
  const [levelTerms, setLevelTerms] = useState<ApiSemester[]>([]);
  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ApiSemester | null>(null);
  const [termFormData, setTermFormData] = useState<{ termNumber: 1 | 2 }>({ termNumber: 1 });
  
  const [termCourses, setTermCourses] = useState<ApiCourse[]>([]);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null);
  // 🌟 NEW: تم إضافة weight (الوزن) و parts للمادة
  const [courseFormData, setCourseFormData] = useState({ courseCode: "", courseName: "", creditHours: 3, isElective: false, departmentId: "", notes: "", parts: ["نظري"], weight: 0 });

  // States - مخرجات البرنامج (PLOs)
  const [isProgramQaDialogOpen, setIsProgramQaDialogOpen] = useState(false);
  const [activeProgramForQa, setActiveProgramForQa] = useState<Program | null>(null);
  const [programOutcomes, setProgramOutcomes] = useState<any[]>([]); 
  const [isProgramQaFormOpen, setIsProgramQaFormOpen] = useState(false);
  const [programQaFormMode, setProgramQaFormMode] = useState<"add" | "edit">("add");
  const [programQaFormData, setProgramQaFormData] = useState<any>({});

  // States - جودة المواد (Course QA)
  const [isQaDialogOpen, setIsQaDialogOpen] = useState(false);
  const [qaActiveCourse, setQaActiveCourse] = useState<ApiCourse | null>(null);
  const [qaSelectedPart, setQaSelectedPart] = useState<string | null>(null);
  const [qaView, setQaView] = useState<"menu" | "outcomes" | "topics" | "questions">("menu");
  const [qaOutcomes, setQaOutcomes] = useState<QA_Outcome[]>([]);
  const [qaTopics, setQaTopics] = useState<QA_Topic[]>([]);
  const [qaQuestions, setQaQuestions] = useState<QA_Question[]>([]);
  const [selectedQaTopic, setSelectedQaTopic] = useState<QA_Topic | null>(null);
  const [qaFormOpen, setQaFormOpen] = useState(false);
  const [qaFormMode, setQaFormMode] = useState<"add" | "edit">("add");
  const [qaFormData, setQaFormData] = useState<any>({});

  const form = useForm<DepartmentFormData>({ resolver: zodResolver(departmentSchema), defaultValues: { department_name: "", department_code: "" } });

  // ==========================================
  // Fetchers
  // ==========================================
  const fetchDepartments = async () => { try { const res = await api.get("/v1/departments", { params: { college_id: collegeId } }); setDepartments(res.data?.data ?? res.data); } catch { toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" }); } };
  const fetchPrograms = async (departmentId: number) => { 
      try { 
          const res = await api.get("/v1/programs", { params: { department_id: departmentId } }); 
          const raw = res.data?.data ?? res.data; 
          setDepartmentPrograms((raw as any[]).map((p, index) => { 
            let mockSystemType = "semester";
              
              if (index === 2) mockSystemType = "credit";
              else if (index === 3) mockSystemType = "block";
              return{
                id: p.id ?? p.program_id, 
                name: p.name ?? p.program_name, 
                is_active: Boolean(p.is_active ?? 1),
                system_type: mockSystemType as "semester" | "credit" | "block"
              }
          })); 
      } catch { toast({ title: "خطأ", description: "فشل تحميل البرامج", variant: "destructive" }); } 
  };

  
  const fetchLevels = async (programId: number) => { try { const res = await api.get("/v1/levels", { params: { program_id: programId } }); const raw = res.data?.data ?? res.data; setProgramLevels((raw as any[]).map((l) => ({ id: l.id ?? l.level_id, program_id: l.program_id ?? programId, level_number: l.level_number ?? l.number ?? 1 }))); } catch { toast({ title: "خطأ", description: "فشل تحميل المستويات", variant: "destructive" }); } };
  const fetchTerms = async (levelId: number) => { try { const res = await api.get("/v1/semesters", { params: { level_id: levelId } }); const raw = res.data?.data ?? res.data; setLevelTerms((raw as any[]).map((t) => ({ id: t.id ?? t.semester_id, level_id: t.level_id ?? levelId, term_number: (t.term_number ?? 1) as 1 | 2 }))); } catch { toast({ title: "خطأ", description: "فشل تحميل الفصول", variant: "destructive" }); } };
  const fetchCourses = async (semesterId: number) => { try { const res = await api.get("/v1/courses", { params: { semester_id: semesterId } }); const raw = res.data?.data ?? res.data; setTermCourses((raw as any[]).map((c) => ({ id: c.id ?? c.course_id, semester_id: c.semester_id ?? semesterId, course_code: c.course_code ?? "", course_name: c.course_name ?? "", credit_hours: Number(c.credit_hours ?? 0), is_elective: Boolean(c.is_elective ?? false), department_id: c.department_id ?? null, notes: c.notes ?? "", parts: c.parts || ["نظري"], weight: c.weight || 0 }))); } catch { toast({ title: "خطأ", description: "فشل تحميل المواد", variant: "destructive" }); } };
  const fetchQaData = async (courseId: number) => { try { const res = await api.get(`/v1/courses/${courseId}/qa-data`); const data = res.data.data; setQaOutcomes(data.outcomes || []); setQaTopics(data.topics || []); setQaQuestions(data.questions || []); } catch { toast({ title: "خطأ", description: "فشل تحميل بيانات الجودة", variant: "destructive" }); } };
  
  const fetchProgramOutcomes = async (programId: number) => {
    try {
        setProgramOutcomes([
            { id: 1, code: "PLO-1", name: "القدرة على تحليل وتصميم النظم المعقدة بناءً على المتطلبات.", domain: "مهاري", weight: 40 },
            { id: 2, code: "PLO-2", name: "استيعاب المفاهيم الأساسية لعلوم الحاسوب وتطبيقاتها.", domain: "معرفي", weight: 60 }
        ]);
    } catch { toast({ title: "خطأ", description: "فشل تحميل مخرجات البرنامج", variant: "destructive" }); }
  };

  useEffect(() => { fetchDepartments(); setSelectedDepartment(null); setSelectedProgram(null); setSelectedLevel(null); setSelectedTerm(null); }, [collegeId]);
  useEffect(() => { if (selectedDepartment) fetchPrograms(selectedDepartment.department_id); else setDepartmentPrograms([]); setSelectedProgram(null); }, [selectedDepartment]);
  useEffect(() => { if (selectedProgram && selectedProgram.system_type === 'semester') fetchLevels(selectedProgram.id); else setProgramLevels([]); setSelectedLevel(null); }, [selectedProgram]);
  useEffect(() => { if (selectedLevel) fetchTerms(selectedLevel.id); else setLevelTerms([]); setSelectedTerm(null); }, [selectedLevel]);
  useEffect(() => { if (selectedTerm) fetchCourses(selectedTerm.id); else setTermCourses([]); }, [selectedTerm]);

  // ==========================================
  // Handlers
  // ==========================================
  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => { setIsLoading(true); try { const payload = { ...data, college_id: Number(collegeId) }; if (editingDepartment) await api.put(`/v1/departments/${editingDepartment.department_id}`, payload); else await api.post("/v1/departments", payload); setIsDialogOpen(false); await fetchDepartments(); toast({ title: "نجاح", description: "تم الحفظ" }); } catch { toast({ title: "خطأ", description: "فشل الحفظ", variant: "destructive" }); } finally { setIsLoading(false); } };
  const openDialog = (dept: ApiDepartment | null = null) => { setEditingDepartment(dept); form.reset({ department_name: dept?.department_name || "", department_code: dept?.department_code || "" }); setIsDialogOpen(true); };
  const handleDelete = async (id: number) => { if(!confirm("هل أنت متأكد من حذف القسم؟")) return; try { await api.delete(`/v1/departments/${id}`); fetchDepartments(); } catch {} };

  // Programs Handlers (Updated with system_type)
  const handleAddProgram = () => { setEditingProgram(null); setProgramFormData({ name: "", is_active: true, system_type: "semester" }); setIsProgramFormOpen(true); };
  const handleEditProgram = (prog: Program) => { setEditingProgram(prog); setProgramFormData({ name: prog.name, is_active: prog.is_active, system_type: prog.system_type }); setIsProgramFormOpen(true); };
  const handleSubmitProgram = async (e: any) => { e.preventDefault(); try{ const p = {program_name: programFormData.name, is_active: programFormData.is_active?1:0, system_type: programFormData.system_type, department_id: selectedDepartment!.department_id}; if(editingProgram) await api.put(`/v1/programs/${editingProgram.id}`, p); else await api.post("/v1/programs", p); setIsProgramFormOpen(false); fetchPrograms(selectedDepartment!.department_id); toast({title:"نجاح"}); } catch {toast({title:"خطأ", variant:"destructive"});} };
  const handleDeleteProgram = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/programs/${id}`); if (selectedProgram?.id === id) setSelectedProgram(null); fetchPrograms(selectedDepartment!.department_id); };

  // Levels & Terms
  const handleAddLevel = () => { setEditingLevel(null); setLevelFormData({ levelNumber: 1 }); setIsLevelFormOpen(true); };
  const handleEditLevel = (lvl: ApiLevel) => { setEditingLevel(lvl); setLevelFormData({ levelNumber: lvl.level_number }); setIsLevelFormOpen(true); };
  const handleSubmitLevel = async (e: any) => { e.preventDefault(); const p = {program_id: selectedProgram!.id, level_number: levelFormData.levelNumber}; if(editingLevel) await api.put(`/v1/levels/${editingLevel.id}`, p); else await api.post("/v1/levels", p); setIsLevelFormOpen(false); fetchLevels(selectedProgram!.id); };
  const handleDeleteLevel = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/levels/${id}`); if (selectedLevel?.id === id) setSelectedLevel(null); fetchLevels(selectedProgram!.id); };

  const handleAddTerm = () => { setEditingTerm(null); setTermFormData({ termNumber: 1 }); setIsTermFormOpen(true); };
  const handleEditTerm = (t: ApiSemester) => { setEditingTerm(t); setTermFormData({ termNumber: t.term_number }); setIsTermFormOpen(true); };
  const handleSubmitTerm = async (e: any) => { e.preventDefault(); const p = {level_id: selectedLevel!.id, term_number: termFormData.termNumber}; if(editingTerm) await api.put(`/v1/semesters/${editingTerm.id}`, p); else await api.post("/v1/semesters", p); setIsTermFormOpen(false); fetchTerms(selectedLevel!.id); };
  const handleDeleteTerm = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/semesters/${id}`); if (selectedTerm?.id === id) setSelectedTerm(null); fetchTerms(selectedLevel!.id); };

  // Course Handlers (Updated with weight and parts)
  const handleAddCourse = () => { setEditingCourse(null); setCourseFormData({ courseCode: "", courseName: "", creditHours: 3, isElective: false, departmentId: "", notes: "", parts: ["نظري"], weight: 0 }); setIsCourseFormOpen(true); };
  const handleSubmitCourse = async (e: any) => { e.preventDefault(); try { const payload = { course_code: courseFormData.courseCode, course_name: courseFormData.courseName, credit_hours: Number(courseFormData.creditHours), is_elective: courseFormData.isElective, notes: courseFormData.notes || null, parts: courseFormData.parts, weight: Number(courseFormData.weight), semester_id: selectedTerm!.id, college_id: Number(collegeId), department_id: selectedDepartment!.department_id, program_id: selectedProgram!.id, level_id: selectedLevel!.id }; if(editingCourse) await api.put(`/v1/courses/${editingCourse.id}`, payload); else await api.post("/v1/courses", payload); setIsCourseFormOpen(false); fetchCourses(selectedTerm!.id); toast({title: "نجاح"}); } catch { toast({title: "خطأ", variant: "destructive"}); } };
  const handleDeleteCourse = async (id: number) => { if(!confirm("هل أنت متأكد؟")) return; await api.delete(`/v1/courses/${id}`); fetchCourses(selectedTerm!.id); };

  // Program PLO Handlers
  const handleOpenProgramQa = (program: Program) => { setActiveProgramForQa(program); fetchProgramOutcomes(program.id); setIsProgramQaDialogOpen(true); };
  const handleProgramQaSave = async () => { toast({ title: "نجاح", description: "تم الحفظ" }); setIsProgramQaFormOpen(false); };
  const handleProgramQaDelete = async (id: number) => { if(confirm("متأكد؟")) toast({ title: "تم الحذف" }); };

  // Course QA Handlers
  const handleOpenQa = (course: any) => { setQaActiveCourse({...course, parts: course.parts?.length ? course.parts : ["نظري"]}); setQaSelectedPart(course.parts?.length ? course.parts[0] : "نظري"); setQaView("menu"); fetchQaData(course.id); setIsQaDialogOpen(true); };
  const handleQaDelete = async (id: string, type: "outcome" | "topic" | "question") => { /* API Logic */ };
  const handleQaSave = async () => { setQaFormOpen(false); };
  const handleAddOption = () => { const currentOptions = qaFormData.options || []; if(currentOptions.length >= 6) return; setQaFormData({ ...qaFormData, options: [...currentOptions, { id: Date.now().toString(), text: "", isCorrect: false }] }); };
  const handleOptionChange = (optId: string, val: string) => { setQaFormData({ ...qaFormData, options: qaFormData.options.map((o: any) => o.id === optId ? { ...o, text: val } : o) }); };
  const handleCorrectOptionChange = (optId: string) => { setQaFormData({ ...qaFormData, options: qaFormData.options.map((o: any) => ({ ...o, isCorrect: o.id === optId })) }); };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500" dir="rtl">
        {/* الترويسة الأساسية */}
        <div className="flex items-center justify-between mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">إدارة الأقسام والبرامج</h2>
                <p className="text-sm text-muted-foreground">قم بإدارة هيكلة الأقسام واختيار النظام الأكاديمي لكل برنامج على حدة.</p>
            </div>
            {can('study_plan.create') && <Button onClick={() => openDialog()} className="shadow-md hover:shadow-lg transition-all"><Plus className="w-4 h-4 mr-2" /> إضافة قسم</Button>}
        </div>

        {/* 1. قائمة الأقسام */}
        <Card className="border-t-4 border-t-slate-700 shadow-sm">
            <CardContent className="pt-6">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[50%] text-right font-bold">القسم الأكاديمي</TableHead>
                            <TableHead className="w-[30%] text-right font-bold">كود القسم</TableHead>
                            <TableHead className="w-[20%] text-left font-bold">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">لا توجد أقسام مسجلة حالياً</TableCell></TableRow>
                        ) : (
                            departments.map((dept) => (
                                <TableRow 
                                    key={dept.department_id} 
                                    className={cn("cursor-pointer transition-colors hover:bg-slate-50", selectedDepartment?.department_id === dept.department_id && "bg-blue-50/50 border-r-4 border-r-blue-600")} 
                                    onClick={() => setSelectedDepartment(dept)}
                                >
                                    <TableCell className="text-right font-medium text-slate-700">{dept.department_name}</TableCell>
                                    <TableCell className="text-right"><Badge variant="outline" className="font-mono bg-white">{dept.department_code}</Badge></TableCell>
                                    <TableCell className="text-left">
                                        <div className="flex gap-2 justify-end sm:justify-start">
                                            {can('study_plan.update') && <Button size="sm" variant="ghost" className="hover:bg-blue-100 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); openDialog(dept); }}><Edit className="w-4 h-4" /></Button>}
                                            {can('study_plan.delete') && <Button size="sm" variant="ghost" className="hover:bg-red-100 hover:text-red-700 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(dept.department_id); }}><Trash2 className="w-4 h-4" /></Button>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* نافذة إضافة/تعديل القسم */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingDepartment ? "تعديل القسم" : "إضافة قسم"}</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><FormField control={form.control} name="department_name" render={({ field }) => (<FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="department_code" render={({ field }) => (<FormItem><FormLabel>الكود</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button type="submit">{isLoading ? <Loader2 className="animate-spin" /> : "حفظ"}</Button></div></form></Form></DialogContent></Dialog>

        {/* 2. البرامج التابعة للقسم */}
        {selectedDepartment && (
            <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
                <Card className="border shadow-sm bg-white">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg text-slate-800">البرامج الأكاديمية</CardTitle>
                                <CardDescription>التابعة لقسم {selectedDepartment.department_name}</CardDescription>
                            </div>
                            {can('study_plan.create') && <Button onClick={handleAddProgram} className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> إضافة برنامج</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* 🌟 NEW: فورم البرنامج المحدث يحتوي على اختيار النظام */}
                        {isProgramFormOpen && (
                            <div className="bg-blue-50/30 p-5 rounded-lg border border-blue-200 mb-6 shadow-sm animate-in fade-in zoom-in-95">
                                <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">{editingProgram ? "تعديل البرنامج" : "إضافة برنامج جديد"}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <Label>اسم البرنامج</Label>
                                        <Input value={programFormData.name} onChange={e => setProgramFormData({...programFormData, name: e.target.value})} placeholder="مثال: بكالوريوس طب الأسنان" className="bg-white" />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="text-indigo-700 font-bold">النظام الأكاديمي للبرنامج</Label>
                                        <Select value={programFormData.system_type} onValueChange={(v:any) => setProgramFormData({...programFormData, system_type: v})}>
                                            <SelectTrigger className="bg-white border-indigo-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="semester">نظام الفصول الدراسية</SelectItem>
                                                <SelectItem value="credit">نظام الساعات المعتمدة</SelectItem>
                                                <SelectItem value="block">نظام البلوكات (الطبي)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-1 space-y-2 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Switch checked={programFormData.is_active} onCheckedChange={c => setProgramFormData({...programFormData, is_active: c})} />
                                            <Label className="cursor-pointer">{programFormData.is_active ? "نشط" : "معطل"}</Label>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <Button className="w-full" onClick={handleSubmitProgram}>حفظ</Button>
                                        <Button variant="ghost" size="icon" onClick={() => setIsProgramFormOpen(false)}><Trash2 className="w-4 h-4 text-muted-foreground"/></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {departmentPrograms.map(prog => (
                                <div 
                                    key={prog.id} 
                                    onClick={() => setSelectedProgram(prog)} 
                                    className={cn(
                                        "p-5 rounded-xl border transition-all cursor-pointer bg-white flex flex-col justify-between min-h-[130px]", 
                                        selectedProgram?.id === prog.id ? "border-primary ring-2 ring-primary/20 shadow-md bg-blue-50/10" : "hover:border-slate-300 hover:shadow-sm"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 text-lg leading-tight pr-2">{prog.name}</div>
                                            <Badge variant={prog.is_active ? "default" : "secondary"} className={cn("shrink-0", prog.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : "")}>
                                                {prog.is_active ? "نشط" : "معطل"}
                                            </Badge>
                                        </div>
                                        {/* عرض بادج يوضح نوع النظام */}
                                        <div className="mt-2">
                                            {prog.system_type === 'semester' && <Badge variant="outline" className="bg-slate-50 text-slate-600"><Layers className="w-3 h-3 mr-1"/> فصول</Badge>}
                                            {prog.system_type === 'credit' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1"/> ساعات معتمدة</Badge>}
                                            {prog.system_type === 'block' && <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200"><LayoutGrid className="w-3 h-3 mr-1"/> بلوكات</Badge>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                        <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100" onClick={(e) => { e.stopPropagation(); handleOpenProgramQa(prog); }}>
                                            <Target className="w-3.5 h-3.5" /> مخرجات التعلم
                                        </Button>
                                        <div className="flex gap-1">
                                            {can('study_plan.update') && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={(e) => {e.stopPropagation(); handleEditProgram(prog)}}><Pencil className="w-3.5 h-3.5" /></Button>}
                                            {can('study_plan.delete') && <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => {e.stopPropagation(); handleDeleteProgram(prog.id)}}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ========================================================================= */}
                {/* 3. شجرة البرنامج (تعتمد على system_type) */}
                {/* ========================================================================= */}
                {selectedProgram && selectedProgram.system_type === 'credit' && (
                    <CreditHourSystemView 
                        program={selectedProgram} 
                        onOpenQa={handleOpenQa} // 🌟 تمرير نافذة الجودة
                    />
                )}
                {selectedProgram && selectedProgram.system_type === 'block' && (
                    <BlockSystemView 
                        program={selectedProgram} 
                        onOpenQa={handleOpenQa} // 🌟 تمرير نافذة الجودة
                    />
                )}
                
                {/* نظام الفصول (Semester System Logic) - مفصل ويعمل بالكامل */}
                {selectedProgram && selectedProgram.system_type === 'semester' && (
                    <div className="space-y-6">
                        {/* 3.1 المستويات */}
                        <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                            <CardHeader className="bg-slate-50/50 border-b pb-4 py-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base text-slate-800 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> مستويات البرنامج</CardTitle>
                                    {can('study_plan.create') && <Button size="sm" variant="outline" onClick={handleAddLevel} className="h-8"><Plus className="w-3.5 h-3.5 mr-1" /> مستوى جديد</Button>}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLevelFormOpen && (
                                    <div className="bg-slate-50 p-3 rounded-lg border mb-4 flex items-end gap-3 max-w-md">
                                        <div className="space-y-1.5 flex-1"><Label className="text-xs">رقم المستوى</Label><Input type="number" min="1" value={levelFormData.levelNumber} onChange={e => setLevelFormData({levelNumber: +e.target.value})} className="bg-white h-9" /></div>
                                        <Button size="sm" onClick={handleSubmitLevel} className="h-9">حفظ</Button>
                                        <Button size="icon" variant="ghost" onClick={() => setIsLevelFormOpen(false)} className="h-9 w-9"><Trash2 className="w-4 h-4 text-muted-foreground"/></Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    {programLevels.map(lvl => (
                                        <div key={lvl.id} onClick={() => setSelectedLevel(lvl)} className={cn("min-w-[140px] p-3 rounded-lg border cursor-pointer transition-all group flex flex-col items-center justify-center relative overflow-hidden", selectedLevel?.id === lvl.id ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-white hover:bg-slate-50 hover:border-slate-300")}>
                                            <div className="font-bold text-lg mb-1">المستوى {lvl.level_number}</div>
                                            <div className="text-xs opacity-80 mb-2">انقر لعرض الفصول</div>
                                            <div className={cn("flex justify-center gap-1 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100", selectedLevel?.id === lvl.id ? "text-white" : "text-slate-600")}>
                                                {can('study_plan.update') && <Button size="icon" className="h-7 w-7 hover:bg-black/10 rounded-full" variant="ghost" onClick={(e)=>{e.stopPropagation(); handleEditLevel(lvl)}}><Pencil className="w-3.5 h-3.5" /></Button>}
                                                {can('study_plan.delete') && <Button size="icon" className="h-7 w-7 hover:bg-red-500 hover:text-white rounded-full" variant="ghost" onClick={(e)=>{e.stopPropagation(); handleDeleteLevel(lvl.id)}}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3.2 الفصول */}
                        {selectedLevel && (
                            <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                                <CardHeader className="bg-slate-50/50 border-b pb-4 py-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base text-slate-800 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-primary" /> فصول المستوى: {selectedLevel.level_number}</CardTitle>
                                        {can('study_plan.create') && <Button size="sm" variant="outline" onClick={handleAddTerm} className="h-8"><Plus className="w-3.5 h-3.5 mr-1" /> فصل دراسي</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {isTermFormOpen && (
                                        <div className="bg-slate-50 p-3 rounded-lg border mb-4 flex items-end gap-3 max-w-md">
                                            <div className="space-y-1.5 flex-1">
                                                <Label className="text-xs">اختر الفصل</Label>
                                                <Select value={String(termFormData.termNumber)} onValueChange={v => setTermFormData({termNumber: +v as 1|2})}><SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">الفصل الأول</SelectItem><SelectItem value="2">الفصل الثاني</SelectItem></SelectContent></Select>
                                            </div>
                                            <Button size="sm" onClick={handleSubmitTerm} className="h-9">حفظ</Button>
                                            <Button size="icon" variant="ghost" onClick={() => setIsTermFormOpen(false)} className="h-9 w-9"><Trash2 className="w-4 h-4 text-muted-foreground"/></Button>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-4">
                                        {levelTerms.map(term => (
                                            <div key={term.id} onClick={() => setSelectedTerm(term)} className={cn("flex-1 min-w-[200px] p-4 text-center border-2 rounded-xl cursor-pointer transition-all group", selectedTerm?.id === term.id ? "border-primary bg-primary/5" : "bg-white hover:border-slate-300")}>
                                                <div className="text-sm text-muted-foreground mb-1">الفصل الدراسي</div>
                                                <div className={cn("font-bold text-2xl mb-3", selectedTerm?.id === term.id ? "text-primary" : "text-slate-700")}>{term.term_number === 1 ? "الأول" : "الثاني"}</div>
                                                <div className="flex justify-center gap-2 opacity-50 group-hover:opacity-100"><Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={(e)=>{e.stopPropagation(); handleEditTerm(term)}}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={(e)=>{e.stopPropagation(); handleDeleteTerm(term.id)}}><Trash2 className="w-3.5 h-3.5" /></Button></div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3.3 المواد الدراسية */}
                        {selectedTerm && (
                            <Card className="border shadow-sm bg-white animate-in fade-in slide-in-from-top-4">
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <div className="flex justify-between items-center">
                                        <div><CardTitle className="text-lg text-slate-800">المقررات الدراسية</CardTitle></div>
                                        <Button onClick={handleAddCourse} className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> إضافة مادة</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {isCourseFormOpen && (
                                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm animate-in fade-in">
                                            <h4 className="font-semibold mb-4 text-slate-700 border-b pb-2">{editingCourse ? "تعديل المادة" : "إضافة مادة جديدة"}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                                <div className="md:col-span-3 space-y-2"><Label>كود المادة</Label><Input value={courseFormData.courseCode} onChange={e => setCourseFormData({...courseFormData, courseCode: e.target.value})} className="bg-white" /></div>
                                                <div className="md:col-span-4 space-y-2"><Label>اسم المادة</Label><Input value={courseFormData.courseName} onChange={e => setCourseFormData({...courseFormData, courseName: e.target.value})} className="bg-white" /></div>
                                                <div className="md:col-span-2 space-y-2"><Label>الساعات</Label><Input type="number" min="1" value={courseFormData.creditHours} onChange={e => setCourseFormData({...courseFormData, creditHours: +e.target.value})} className="bg-white" /></div>
                                                
                                                {/* 🌟 NEW: حقل وزن المادة */}
                                                <div className="md:col-span-3 space-y-2">
                                                    <Label className="text-emerald-700 font-bold">وزن المادة % (من البرنامج)</Label>
                                                    <Input type="number" min="0" max="100" placeholder="مثال: 25" value={courseFormData.weight} onChange={e => setCourseFormData({...courseFormData, weight: +e.target.value})} className="bg-emerald-50/50 border-emerald-200" />
                                                </div>

                                                {/* أجزاء المادة */}
                                                <div className="md:col-span-6 space-y-3 bg-white p-3 rounded-lg border">
                                                    <div className="flex justify-between items-center"><Label className="text-sm font-bold text-slate-700">أجزاء المادة</Label><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCourseFormData({...courseFormData, parts: [...courseFormData.parts, ""]})}><Plus className="w-3 h-3 mr-1" /> إضافة جزء</Button></div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {courseFormData.parts.map((part, idx) => (
                                                            <div key={idx} className="flex items-center gap-1 bg-slate-50 border rounded-md p-1">
                                                                <Input className="h-7 w-24 text-xs border-0 bg-transparent focus-visible:ring-0 px-2" value={part} onChange={e => { const newParts = [...courseFormData.parts]; newParts[idx] = e.target.value; setCourseFormData({...courseFormData, parts: newParts}); }} />
                                                                {courseFormData.parts.length > 1 && <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => setCourseFormData({...courseFormData, parts: courseFormData.parts.filter((_, i) => i !== idx)})}><Trash2 className="w-3 h-3" /></Button>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-6 space-y-2"><Label>ملاحظات (اختياري)</Label><Textarea value={courseFormData.notes} onChange={e => setCourseFormData({...courseFormData, notes: e.target.value})} className="bg-white h-[84px] resize-none" /></div>

                                                <div className="md:col-span-12 flex justify-between items-center bg-white p-3 rounded border">
                                                    <div className="flex items-center gap-3"><Switch checked={courseFormData.isElective} onCheckedChange={c => setCourseFormData({...courseFormData, isElective: c})} /><Label>مادة اختيارية</Label></div>
                                                    <div className="flex gap-2"><Button variant="outline" onClick={() => setIsCourseFormOpen(false)}>إلغاء</Button><Button onClick={handleSubmitCourse}>حفظ المادة</Button></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border rounded-md overflow-hidden">
                                        <Table className="bg-white">
                                            <TableHeader className="bg-slate-50"><TableRow><TableHead>الكود</TableHead><TableHead>الاسم</TableHead><TableHead className="text-center">الساعات</TableHead><TableHead className="text-center text-emerald-700">الوزن %</TableHead><TableHead className="text-center">الجودة</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {termCourses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد مواد مسجلة</TableCell></TableRow> : termCourses.map(course => (
                                                    <TableRow key={course.id} className="hover:bg-slate-50">
                                                        <TableCell className="font-mono text-slate-600">{course.course_code}</TableCell>
                                                        <TableCell className="font-semibold text-slate-800">{course.course_name}</TableCell>
                                                        <TableCell className="text-center"><Badge variant="outline">{course.credit_hours}</Badge></TableCell>
                                                        <TableCell className="text-center"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{course.weight || 0}%</Badge></TableCell>
                                                        <TableCell className="text-center"><Button size="sm" variant="secondary" className="gap-2 text-blue-700 bg-blue-50" onClick={() => handleOpenQa(course)}><Target className="w-4 h-4" /> ضمان الجودة</Button></TableCell>
                                                        <TableCell className="text-left">
                                                            <div className="flex gap-1 justify-end">
                                                                <Button size="sm" variant="ghost" onClick={() => { setEditingCourse(course); setCourseFormData({courseCode: course.course_code, courseName: course.course_name, creditHours: course.credit_hours, isElective: course.is_elective, departmentId: "", notes: course.notes||"", parts: course.parts || ["نظري"], weight: course.weight || 0}); setIsCourseFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                                                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-4 h-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* ===================================================================== */}
        {/* نـوافـذ الـجـودة المـخـفـيـة (PLOs & Course QA) */}
        {/* ===================================================================== */}
        
        {/* 1. نافذة مخرجات البرنامج */}
        <Dialog open={isProgramQaDialogOpen} onOpenChange={setIsProgramQaDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0"><Target className="w-6 h-6 text-indigo-700" /></div>
                        <div className="flex-1 flex justify-between items-center">
                            <div><DialogTitle className="text-xl">مخرجات التعلم للبرنامج (PLOs)</DialogTitle><DialogDescription className="text-base mt-1">قسم {selectedDepartment?.department_name} • <span className="font-bold text-indigo-700">{activeProgramForQa?.name}</span></DialogDescription></div>
                            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-center"><div className="text-xs text-slate-500 font-medium mb-1">إجمالي الأوزان</div><div className={cn("font-bold", programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0) > 100 ? "text-red-600" : "text-emerald-600")}>{programOutcomes.reduce((sum, o) => sum + (Number(o.weight) || 0), 0)}%</div></div>
                        </div>
                    </div>
                </DialogHeader>
                <div className="p-6 flex-1 overflow-y-auto bg-white">
                    <div className="flex justify-between items-center mb-6"><p className="text-slate-600">أضف مخرجات التعلم المستهدفة مع تحديد الوزن النسبي.</p><Button onClick={() => { setProgramQaFormMode("add"); setProgramQaFormData({ domain: "معرفي", weight: 10 }); setIsProgramQaFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"><Plus className="w-4 h-4 mr-2" /> إضافة مخرج تعلم</Button></div>
                    <div className="space-y-3">
                        {programOutcomes.map((outcome) => (
                            <div key={outcome.id} className="flex justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors shadow-sm bg-white">
                                <div className="flex gap-4"><div className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-3 py-1.5 rounded-lg text-sm h-fit shrink-0 mt-0.5">{outcome.code}</div><div><p className="font-semibold text-slate-800 text-base">{outcome.name}</p><div className="flex gap-2 mt-2.5"><Badge variant="outline" className="bg-white text-slate-600 font-normal">{outcome.domain}</Badge><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">الوزن: {outcome.weight}%</Badge></div></div></div>
                                <div className="flex gap-2 items-start shrink-0"><Button size="icon" variant="ghost" onClick={() => { setProgramQaFormMode("edit"); setProgramQaFormData(outcome); setIsProgramQaFormOpen(true); }}><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleProgramQaDelete(outcome.id)}><Trash2 className="w-4 h-4" /></Button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isProgramQaFormOpen} onOpenChange={setIsProgramQaFormOpen}>
            <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{programQaFormMode === "add" ? "إضافة مخرج للبرنامج" : "تعديل المخرج"}</DialogTitle></DialogHeader><div className="space-y-5 py-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label>الرمز</Label><Input value={programQaFormData.code || ""} onChange={e => setProgramQaFormData({...programQaFormData, code: e.target.value})} /></div><div className="space-y-2"><Label>الوزن (%)</Label><Input type="number" value={programQaFormData.weight || ""} onChange={e => setProgramQaFormData({...programQaFormData, weight: e.target.value})} /></div><div className="space-y-2"><Label>المجال</Label><Input value={programQaFormData.domain || ""} onChange={e => setProgramQaFormData({...programQaFormData, domain: e.target.value})} /></div></div><div className="space-y-2"><Label>النص</Label><Textarea value={programQaFormData.name || ""} onChange={e => setProgramQaFormData({...programQaFormData, name: e.target.value})} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsProgramQaFormOpen(false)}>إلغاء</Button><Button onClick={handleProgramQaSave}>حفظ</Button></DialogFooter></DialogContent>
        </Dialog>

        {/* 2. نافذة جودة المادة (مع الأجزاء) */}
        <Dialog open={isQaDialogOpen} onOpenChange={setIsQaDialogOpen}>
            <DialogContent className="w-[95vw] max-w-6xl h-[90vh] md:h-[95vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 md:p-6 border-b bg-muted/20 shrink-0"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="bg-primary/10 p-2.5 rounded-xl shrink-0"><Target className="w-6 h-6 text-primary" /></div><div><DialogTitle className="text-xl">جودة المادة: {qaActiveCourse?.course_name}</DialogTitle></div></div><div className="flex bg-slate-100 p-1 rounded-lg border w-fit">{(qaActiveCourse as any)?.parts?.map((part: string) => (<Button key={part} variant={qaSelectedPart === part ? "default" : "ghost"} size="sm" className="px-6 rounded-md transition-all" onClick={() => setQaSelectedPart(part)}>الجانب الـ {part}</Button>))}</div></div></DialogHeader>
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-l bg-slate-50 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 flex flex-row md:flex-col shrink-0 overflow-x-auto no-scrollbar"><Button variant={qaView === "menu" ? "default" : "ghost"} className="justify-start gap-2" onClick={() => setQaView("menu")}>نظرة عامة</Button><Button variant={qaView === "outcomes" ? "default" : "ghost"} className="justify-start gap-2" onClick={() => setQaView("outcomes")}>1. مخرجات (CLOs)</Button><Button variant={qaView === "topics" ? "default" : "ghost"} className="justify-start gap-2" onClick={() => setQaView("topics")}>2. مواضيع المادة</Button><Button variant={qaView === "questions" ? "default" : "ghost"} className="justify-start gap-2" onClick={() => setQaView("questions")}>3. بنك الأسئلة</Button></div>
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white relative">
                        <div className="absolute top-4 left-6 text-slate-100 font-black text-6xl select-none pointer-events-none z-0">{qaSelectedPart}</div>
                        <div className="relative z-10">
                            {qaView === "menu" && <div className="grid grid-cols-3 gap-6"><Card className="bg-blue-50" onClick={() => setQaView("outcomes")}><CardContent className="pt-6 text-center text-blue-600 font-bold text-xl">{qaOutcomes.length} مخرجات</CardContent></Card><Card className="bg-amber-50" onClick={() => setQaView("topics")}><CardContent className="pt-6 text-center text-amber-600 font-bold text-xl">{qaTopics.length} مواضيع</CardContent></Card><Card className="bg-green-50" onClick={() => setQaView("questions")}><CardContent className="pt-6 text-center text-green-600 font-bold text-xl">{qaQuestions.length} أسئلة</CardContent></Card></div>}
                            {/* هنا يتم عرض القوائم كما هي بدون تغيير لتوفير المساحة */}
                            {qaView === "outcomes" && <div className="space-y-4"><Button onClick={() => { setQaFormMode("add"); setQaFormData({ weight: 10 }); setQaFormOpen(true); }}>إضافة مخرج</Button><div className="space-y-2">{qaOutcomes.map(o=><div key={o.id} className="p-3 border rounded flex justify-between">{o.code} - {o.name} <Badge>{o.weight}%</Badge> <Button size="icon" onClick={()=> {setQaFormMode('edit'); setQaFormData(o); setQaFormOpen(true);}}><Edit className="w-4 h-4"/></Button></div>)}</div></div>}
                            {qaView === "topics" && <div className="space-y-4"><Button onClick={() => { setQaFormMode("add"); setQaFormData({ weight: 10 }); setQaFormOpen(true); }}>إضافة موضوع</Button><div className="space-y-2">{qaTopics.map(t=><div key={t.id} className="p-3 border rounded flex justify-between">{t.title} <Badge>{t.weight}%</Badge> <Button size="icon" onClick={()=> {setQaFormMode('edit'); setQaFormData(t); setQaFormOpen(true);}}><Edit className="w-4 h-4"/></Button></div>)}</div></div>}
                            {qaView === "questions" && <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{qaTopics.map(t=><Button variant="outline" key={t.id} onClick={()=>setSelectedQaTopic(t)}>{t.title}</Button>)}</div>{selectedQaTopic && <div className="mt-4 border-t pt-4"><Button onClick={() => { setQaFormMode("add"); setQaFormData({ topicId: selectedQaTopic.id, weight: 10 }); setQaFormOpen(true); }}>إضافة سؤال للموضوع</Button><div className="mt-4 space-y-2">{qaQuestions.filter(q=>q.topicId===selectedQaTopic.id).map(q=><div key={q.id} className="p-3 border rounded flex justify-between">{q.text} <Badge>{q.weight}%</Badge> <Button size="icon" onClick={()=> {setQaFormMode('edit'); setQaFormData(q); setQaFormOpen(true);}}><Edit className="w-4 h-4"/></Button></div>)}</div></div>}</div>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* فورم إضافة/تعديل الجودة المتجاوب */}
        <Dialog open={qaFormOpen} onOpenChange={setQaFormOpen}>
            <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] md:max-h-[95vh] p-0 gap-0 flex flex-col overflow-hidden rounded-xl">
                <DialogHeader className="p-4 border-b bg-slate-50/50 shrink-0"><div className="flex justify-between items-center pr-4"><DialogTitle className="text-base md:text-lg font-bold">{qaFormMode === "add" ? "إضافة" : "تعديل"}</DialogTitle><Badge variant="outline" className="bg-indigo-50 text-indigo-700">الجانب: {qaSelectedPart}</Badge></div></DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {qaView === "outcomes" && <div className="space-y-4"><div className="flex gap-4"><Input placeholder="الرمز" value={qaFormData.code||""} onChange={e=>setQaFormData({...qaFormData,code:e.target.value})} /><Input type="number" placeholder="الوزن %" value={qaFormData.weight||""} onChange={e=>setQaFormData({...qaFormData,weight:e.target.value})} /></div><Textarea placeholder="الوصف" value={qaFormData.name||""} onChange={e=>setQaFormData({...qaFormData,name:e.target.value})} /></div>}
                    {qaView === "topics" && <div className="space-y-4"><div className="flex gap-4"><Input placeholder="العنوان" value={qaFormData.title||""} onChange={e=>setQaFormData({...qaFormData,title:e.target.value})} /><Input type="number" placeholder="الوزن %" value={qaFormData.weight||""} onChange={e=>setQaFormData({...qaFormData,weight:e.target.value})} /></div><div className="border p-3 rounded">مخرجات (CLOs): {qaOutcomes.map(lo => <div key={lo.id}><Switch checked={(qaFormData.outcomeIds||[]).includes(lo.id)} onCheckedChange={(c) => { const ids = qaFormData.outcomeIds||[]; setQaFormData({...qaFormData, outcomeIds: c ? [...ids, lo.id] : ids.filter((i:any)=>i!==lo.id)}) }}/> {lo.code}</div>)}</div></div>}
                    {qaView === "questions" && <div className="space-y-4"><Textarea placeholder="نص السؤال" value={qaFormData.text||""} onChange={e=>setQaFormData({...qaFormData,text:e.target.value})} /><div className="flex gap-4"><Select value={String(qaFormData.outcomeId||"")} onValueChange={v => setQaFormData({...qaFormData, outcomeId: +v})}><SelectTrigger><SelectValue placeholder="المخرج"/></SelectTrigger><SelectContent>{qaOutcomes.map(lo => <SelectItem key={lo.id} value={String(lo.id)}>{lo.code}</SelectItem>)}</SelectContent></Select><Input type="number" placeholder="الوزن %" value={qaFormData.weight||""} onChange={e=>setQaFormData({...qaFormData,weight:e.target.value})} /></div><Button size="sm" onClick={handleAddOption}>إضافة خيار</Button><RadioGroup value={qaFormData.options?.find((o:any)=>o.isCorrect)?.id}>{qaFormData.options?.map((opt:any, idx:number) => <div key={opt.id} className="flex items-center gap-2"><RadioGroupItem value={opt.id} onClick={()=>handleCorrectOptionChange(opt.id)} /><Input value={opt.text} onChange={e=>handleOptionChange(opt.id,e.target.value)} /></div>)}</RadioGroup></div>}
                </div>
                <DialogFooter className="p-4 border-t"><Button variant="outline" onClick={() => setQaFormOpen(false)}>إلغاء</Button><Button onClick={handleQaSave}>حفظ</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}