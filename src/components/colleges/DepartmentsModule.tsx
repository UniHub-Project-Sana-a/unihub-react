import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

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

const departmentSchema = z.object({
  department_name: z.string().min(2, "الاسم مطلوب"),
  department_code: z.string().min(1, "الكود مطلوب"),
});
type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentsModuleProps {
  collegeId: string;
}

export default function DepartmentsModule({ collegeId }: DepartmentsModuleProps) {
  const { toast } = useToast();

  // Departments
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);

  // Selections
  const [selectedDepartment, setSelectedDepartment] = useState<ApiDepartment | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ApiLevel | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ApiSemester | null>(null);
  
  // برامج
  const [departmentPrograms, setDepartmentPrograms] = useState<Program[]>([]);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState<{ name: string; is_active: boolean }>({
    name: "",
    is_active: true,
  });
  
  // مستويات
  const [programLevels, setProgramLevels] = useState<ApiLevel[]>([]);
  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ApiLevel | null>(null);
  const [levelFormData, setLevelFormData] = useState({ levelNumber: 1 });
  
  // فصول (Semesters)
  const [levelTerms, setLevelTerms] = useState<ApiSemester[]>([]);
  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ApiSemester | null>(null);
  const [termFormData, setTermFormData] = useState<{ termNumber: 1 | 2 }>({ termNumber: 1 });
  
  // مواد
  const [termCourses, setTermCourses] = useState<ApiCourse[]>([]);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ApiCourse | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    courseCode: "",
    courseName: "",
    creditHours: 3,
    isElective: false,
    departmentId: "",
    notes: "",
  });

  // Department form
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { department_name: "", department_code: "" },
  });

  // Fetchers
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/v1/departments", {
        params: { college_id: collegeId },
      });
      setDepartments(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" });
    }
  };

  const fetchPrograms = async (departmentId: number) => {
    try {
      const res = await api.get("/v1/programs", { params: { department_id: departmentId } });
      const raw = res.data?.data ?? res.data;

      const normalized: Program[] = (raw as any[]).map((p) => ({
        id: p.id ?? p.program_id,
        name: p.name ?? p.program_name,
        is_active: Boolean(p.is_active ?? 1),
      }));

      setDepartmentPrograms(normalized);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل البرامج", variant: "destructive" });
    }
  };
  
  const fetchLevels = async (programId: number) => {
    try {
      const res = await api.get("/v1/levels", { params: { program_id: programId } });
      const raw = res.data?.data ?? res.data;
      const normalized: ApiLevel[] = (raw as any[]).map((l) => ({
        id: l.id ?? l.level_id,
        program_id: l.program_id ?? programId,
        level_number: l.level_number ?? l.number ?? l.level_no ?? l.level ?? 1,
      }));
      setProgramLevels(normalized);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستويات", variant: "destructive" });
    }
  };
  
  const fetchTerms = async (levelId: number) => {
    try {
      const res = await api.get("/v1/semesters", { params: { level_id: levelId } });
      const raw = res.data?.data ?? res.data;
      const normalized: ApiSemester[] = (raw as any[]).map((t) => ({
        id: t.id ?? t.semester_id ?? t.term_id,
        level_id: t.level_id ?? levelId,
        term_number: (t.term_number ?? t.number ?? 1) as 1 | 2,
      }));
      setLevelTerms(normalized);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الفصول", variant: "destructive" });
    }
  };
  
  const fetchCourses = async (semesterId: number) => {
    try {
      const res = await api.get("/v1/courses", { params: { semester_id: semesterId } });
      const raw = res.data?.data ?? res.data;
      const normalized: ApiCourse[] = (raw as any[]).map((c) => ({
        id: c.id ?? c.course_id,
        semester_id: c.semester_id ?? semesterId,
        course_code: c.course_code ?? c.code ?? "",
        course_name: c.course_name ?? c.name ?? "",
        credit_hours: Number(c.credit_hours ?? c.hours ?? 0),
        is_elective: Boolean(c.is_elective ?? c.elective ?? false),
        department_id: c.department_id ?? null,
        notes: c.notes ?? c.description ?? "",
      }));
      setTermCourses(normalized);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المواد", variant: "destructive" });
    }
  };

  // Effects: فلترة هرميّة حسب الاختيارات
  useEffect(() => {
    fetchDepartments();
  }, [collegeId]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchPrograms(selectedDepartment.department_id);
    } else {
      setDepartmentPrograms([]);
    }
    setSelectedProgram(null);
    setSelectedLevel(null);
    setSelectedTerm(null);
  }, [selectedDepartment]);
  
  useEffect(() => {
    // جلب أقسام الكلية المختارة
    fetchDepartments();
    // تصفير الاختيارات عند تغيير الكلية
    setSelectedDepartment(null);
    setSelectedProgram(null);
    setSelectedLevel(null);
    setSelectedTerm(null);
  }, [collegeId]);
  useEffect(() => {
    if (selectedProgram) {
      fetchLevels(selectedProgram.id);
    } else {
      setProgramLevels([]);
    }
    setSelectedLevel(null);
    setSelectedTerm(null);
  }, [selectedProgram]);
  
  useEffect(() => {
    if (selectedLevel) {
      fetchTerms(selectedLevel.id);
    } else {
      setLevelTerms([]);
    }
    setSelectedTerm(null);
  }, [selectedLevel]);
  
  useEffect(() => {
    if (selectedTerm) {
      fetchCourses(selectedTerm.id);
    } else {
      setTermCourses([]);
    }
  }, [selectedTerm]);

  // Department submit
  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, college_id: Number(collegeId) };
      if (editingDepartment) {
        await api.put(`/v1/departments/${editingDepartment.department_id}`, payload);
        toast({ title: "نجاح", description: "تم تحديث القسم" });
      } else {
        await api.post("/v1/departments", payload);
        toast({ title: "نجاح", description: "تم إنشاء القسم" });
      }
      setIsDialogOpen(false);
      await fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (department: ApiDepartment | null = null) => {
    if (department) {
      setEditingDepartment(department);
      form.reset({
        department_name: department.department_name,
        department_code: department.department_code || "",
      });
    } else {
      setEditingDepartment(null);
      form.reset({ department_name: "", department_code: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/departments/${id}`);
      toast({ title: "نجاح", description: "تم حذف القسم" });
      if (selectedDepartment?.department_id === id) {
        setSelectedDepartment(null);
      }
      await fetchDepartments();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف القسم", variant: "destructive" });
    }
  };

  // Programs handlers
  const handleAddProgram = () => {
    setEditingProgram(null);
    setProgramFormData({ name: "", is_active: true });
    setIsProgramFormOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramFormData({ name: program.name, is_active: program.is_active });
    setIsProgramFormOpen(true);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      if (editingProgram) {
        await api.put(`/v1/programs/${editingProgram.id}`, {
          program_name: programFormData.name,
          is_active: programFormData.is_active ? 1 : 0,
        });
        toast({ title: "نجاح", description: "تم تعديل البرنامج" });
      } else {
        await api.post("/v1/programs", {
          program_name: programFormData.name,
          is_active: programFormData.is_active ? 1 : 0,
          department_id: selectedDepartment.department_id, // ربط بالقسم المختار
        });
        toast({ title: "نجاح", description: "تم إنشاء البرنامج" });
      }
      setIsProgramFormOpen(false);
      await fetchPrograms(selectedDepartment.department_id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حفظ البرنامج";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleDeleteProgram = async (id: number) => {
    if (!selectedDepartment) return;
    try {
      await api.delete(`/v1/programs/${id}`);
      toast({ title: "نجاح", description: "تم حذف البرنامج" });
      if (selectedProgram?.id === id) setSelectedProgram(null);
      await fetchPrograms(selectedDepartment.department_id);
    } catch {
      toast({ title: "خطأ", description: "فشل حذف البرنامج", variant: "destructive" });
    }
  };

  // Levels handlers
  const handleAddLevel = () => {
    setEditingLevel(null);
    setLevelFormData({ levelNumber: 1 });
    setIsLevelFormOpen(true);
  };

  const handleSubmitLevel = async (e: any) => {
    e.preventDefault();
    if (!selectedProgram) return;
    try {
      const payload = { program_id: selectedProgram.id, level_number: levelFormData.levelNumber };
      if (editingLevel) {
        await api.put(`/v1/levels/${editingLevel.id}`, payload);
        toast({ title: "نجاح", description: "تم تعديل المستوى" });
      } else {
        await api.post("/v1/levels", payload);
        toast({ title: "نجاح", description: "تم إنشاء المستوى" });
      }
      setIsLevelFormOpen(false);
      await fetchLevels(selectedProgram.id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حفظ المستوى";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleEditLevel = (level: ApiLevel) => {
    setEditingLevel(level);
    setLevelFormData({ levelNumber: level.level_number });
    setIsLevelFormOpen(true);
  };

  const handleDeleteLevel = async (id: number) => {
    if (!selectedProgram) return;
    try {
      await api.delete(`/v1/levels/${id}`);
      toast({ title: "نجاح", description: "تم حذف المستوى" });
      if (selectedLevel?.id === id) {
        setSelectedLevel(null);
      }
      await fetchLevels(selectedProgram.id);
    } catch {
      toast({ title: "خطأ", description: "فشل حذف المستوى", variant: "destructive" });
    }
  };

  // Terms (Semesters) handlers
  const handleAddTerm = () => {
    setEditingTerm(null);
    setTermFormData({ termNumber: 1 });
    setIsTermFormOpen(true);
  };

  const handleSubmitTerm = async (e: any) => {
    e.preventDefault();
    if (!selectedLevel) return;
    try {
      const payload = { level_id: selectedLevel.id, term_number: termFormData.termNumber };
      if (editingTerm) {
        await api.put(`/v1/semesters/${editingTerm.id}`, payload);
        toast({ title: "نجاح", description: "تم تعديل الفصل" });
      } else {
        await api.post("/v1/semesters", payload);
        toast({ title: "نجاح", description: "تم إنشاء الفصل" });
      }
      setIsTermFormOpen(false);
      await fetchTerms(selectedLevel.id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حفظ الفصل";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleEditTerm = (term: ApiSemester) => {
    setEditingTerm(term);
    setTermFormData({ termNumber: term.term_number });
    setIsTermFormOpen(true);
  };

  const handleDeleteTerm = async (id: number) => {
    if (!selectedLevel) return;
    try {
      await api.delete(`/v1/semesters/${id}`);
      toast({ title: "نجاح", description: "تم حذف الفصل" });
      if (selectedTerm?.id === id) {
        setSelectedTerm(null);
      }
      await fetchTerms(selectedLevel.id);
    } catch {
      toast({ title: "خطأ", description: "فشل حذف الفصل", variant: "destructive" });
    }
  };

  // Courses handlers
  const handleAddCourse = () => {
    setEditingCourse(null);
    setCourseFormData({
      courseCode: "",
      courseName: "",
      creditHours: 3,
      isElective: false,
      departmentId: "",
      notes: "",
    });
    setIsCourseFormOpen(true);
  };

    const handleSubmitCourse = async (e: any) => {
    e.preventDefault();
    // التحقق من وجود جميع البيانات الهرمية المطلوبة
    if (!selectedDepartment || !selectedProgram || !selectedLevel || !selectedTerm) {
      toast({ title: "خطأ", description: "يجب اختيار المسار الكامل (القسم > البرنامج > المستوى > الفصل) قبل إضافة مادة.", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        // 1. البيانات الأساسية للمادة
        course_code: courseFormData.courseCode,
        course_name: courseFormData.courseName,
        credit_hours: Number(courseFormData.creditHours),
        is_elective: courseFormData.isElective,
        notes: courseFormData.notes || null,
        semester_id: selectedTerm.id,

        // 2. بيانات الربط الهرمي (لتحسين التقارير)
        college_id: Number(collegeId), // من الـ Props
        department_id: selectedDepartment.department_id, // من الـ State
        program_id: selectedProgram.id, // من الـ State
        level_id: selectedLevel.id, // من الـ State
      };

      if (editingCourse) {
        await api.put(`/v1/courses/${editingCourse.id}`, payload);
        toast({ title: "نجاح", description: "تم تعديل المادة وتحديث بيانات الربط" });
      } else {
        await api.post("/v1/courses", payload);
        toast({ title: "نجاح", description: "تم إنشاء المادة بنجاح" });
      }
      
      setIsCourseFormOpen(false);
      await fetchCourses(selectedTerm.id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حفظ المادة";
      console.error(error); // للمساعدة في تتبع الأخطاء
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleEditCourse = (course: ApiCourse) => {
    setEditingCourse(course);
    setCourseFormData({
      courseCode: course.course_code,
      courseName: course.course_name,
      creditHours: course.credit_hours,
      isElective: course.is_elective,
      departmentId: course.department_id ? String(course.department_id) : "",
      notes: course.notes || "",
    });
    setIsCourseFormOpen(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!selectedTerm) return;
    try {
      await api.delete(`/v1/courses/${id}`);
      toast({ title: "نجاح", description: "تم حذف المادة" });
      await fetchCourses(selectedTerm.id);
    } catch {
      toast({ title: "خطأ", description: "فشل حذف المادة", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">الأقسام</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Department dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="department_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم القسم</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>كود القسم</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingDepartment ? "حفظ التغييرات" : "إنشاء القسم"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Departments table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[50px]">#</TableHead>
                <TableHead className="text-right">اسم القسم</TableHead>
                <TableHead className="text-right">كود القسم</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    لا توجد أقسام مضافة لهذه الكلية
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
                    <TableCell className="text-right">{dept.department_id}</TableCell>
                    <TableCell className="text-right font-medium">{dept.department_name}</TableCell>
                    <TableCell className="text-right">{dept.department_code || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openDialog(dept); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(dept.department_id); }}
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
        </CardContent>
      </Card>

      {/* برامج/مستويات/فصول/مواد */}
      {selectedDepartment && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>البرامج - {selectedDepartment.department_name}</CardTitle>
              <Button onClick={handleAddProgram} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                إضافة برنامج
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Program form */}
            {isProgramFormOpen && (
               <Card className="mb-4">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmitProgram} className="space-y-4">
                      <div>
                        <Label>اسم البرنامج *</Label>
                        <Input
                          value={programFormData.name}
                          onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={programFormData.is_active}
                          onCheckedChange={(checked) => setProgramFormData({ ...programFormData, is_active: checked })}
                        />
                        <Label>مفعّل؟</Label>
                      </div>
              
                      <div className="flex gap-2">
                        <Button type="submit">حفظ</Button>
                        <Button type="button" variant="outline" onClick={() => setIsProgramFormOpen(false)}>إلغاء</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
            )}

            {/* Programs table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم البرنامج</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      لا توجد برامج مضافة لهذا القسم
                    </TableCell>
                  </TableRow>
                ) : (
                  departmentPrograms.map((program) => (
                    <TableRow
                      key={program.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        selectedProgram?.id === program.id && "bg-muted/70"
                      )}
                      onClick={() => setSelectedProgram(program)}
                    >
                      <TableCell className="text-right font-medium">{program.name}</TableCell>
                      <TableCell className="text-right">{program.is_active ? "مفعل" : "معطّل"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleEditProgram(program); }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }}
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

            {/* خطة البرنامج */}
            {selectedProgram && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>الخطة الدراسية - {selectedProgram.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Levels */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">المستويات</h3>
                        <Button onClick={handleAddLevel} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة مستوى
                        </Button>
                      </div>

                      {isLevelFormOpen && (
                        <Card className="mb-4">
                          <CardContent className="pt-6">
                            <form onSubmit={handleSubmitLevel} className="space-y-4">
                              <div>
                               <Label>رقم المستوى *</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={levelFormData.levelNumber ?? ""} // يسمح يكون فاضي أثناء الكتابة
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setLevelFormData({
                                        levelNumber: v === "" ? (undefined as any) : parseInt(v, 10) || 1,
                                      });
                                    }}
                                    onBlur={() => {
                                      // عند الخروج: لو فاضي، رجّعه 1
                                      if (levelFormData.levelNumber == null || Number.isNaN(levelFormData.levelNumber)) {
                                        setLevelFormData({ levelNumber: 1 });
                                      }
                                    }}
                                    required
                                  />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit">حفظ</Button>
                                <Button type="button" variant="outline" onClick={() => setIsLevelFormOpen(false)}>إلغاء</Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {programLevels.map((level) => (
                          <Card
                            key={level.id}
                            className={cn("cursor-pointer", selectedLevel?.id === level.id && "border-primary")}
                            onClick={() => setSelectedLevel(level)}
                          >
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">المستوى {level.level_number}</h4>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditLevel(level); }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteLevel(level.id); }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Terms (Semesters) */}
                    {selectedLevel && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">الفصول - المستوى {selectedLevel.level_number}</h3>
                          <Button onClick={handleAddTerm} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            إضافة فصل
                          </Button>
                        </div>

                        {isTermFormOpen && (
                          <Card className="mb-4">
                            <CardContent className="pt-6">
                              <form onSubmit={handleSubmitTerm} className="space-y-4">
                                <div>
                                  <Label>رقم الترم *</Label>
                                  <Select
                                    value={termFormData.termNumber.toString()}
                                    onValueChange={(value) => setTermFormData({ termNumber: parseInt(value) as 1 | 2 })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر الترم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">الترم 1</SelectItem>
                                      <SelectItem value="2">الترم 2</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit">حفظ</Button>
                                  <Button type="button" variant="outline" onClick={() => setIsTermFormOpen(false)}>إلغاء</Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {levelTerms.map((term) => (
                            <Card
                              key={term.id}
                              className={cn("cursor-pointer", selectedTerm?.id === term.id && "border-primary")}
                              onClick={() => setSelectedTerm(term)}
                            >
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">الترم {term.term_number}</h4>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditTerm(term); }}>
                                      <Pencil className="w-3 ه-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteTerm(term.id); }}>
                                      <Trash2 className="w-3 ه-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Courses */}
                    {selectedTerm && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">المواد - الترم {selectedTerm.term_number}</h3>
                          <Button onClick={handleAddCourse} size="sm">
                            <Plus className="w-4 ه-4 mr-2" />
                            إضافة مادة
                          </Button>
                        </div>

                        {isCourseFormOpen && (
                          <Card className="mb-4">
                            <CardContent className="pt-6">
                              <form onSubmit={handleSubmitCourse} className="space-y-4">
                                <div>
                                  <Label>كود المادة *</Label>
                                  <Input
                                    value={courseFormData.courseCode}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, courseCode: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>اسم المادة *</Label>
                                  <Input
                                    value={courseFormData.courseName}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, courseName: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>الساعات المعتمدة *</Label>
                                  <Input
                                    type="number"
                                    value={courseFormData.creditHours}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, creditHours: parseInt(e.target.value) || 0 })}
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={courseFormData.isElective}
                                    onCheckedChange={(checked) => setCourseFormData({ ...courseFormData, isElective: checked })}
                                  />
                                  <Label>اختيارية؟</Label>
                                </div>
                                <div>
                                  <Label>ملاحظات</Label>
                                  <Textarea
                                    value={courseFormData.notes}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, notes: e.target.value })}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit">حفظ</Button>
                                  <Button type="button" variant="outline" onClick={() => setIsCourseFormOpen(false)}>إلغاء</Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        )}

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">كود المادة</TableHead>
                              <TableHead className="text-right">اسم المادة</TableHead>
                              <TableHead className="text-right">الساعات</TableHead>
                              <TableHead className="text-right">النوع</TableHead>
                              <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {termCourses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد مواد مسجلة لهذا الفصل</TableCell>
                                </TableRow>
                            ) : (
                                termCourses.map((course) => (
                                  <TableRow key={course.id}>
                                    <TableCell className="text-right font-medium">{course.course_code}</TableCell>
                                    <TableCell className="text-right">{course.course_name}</TableCell>
                                    <TableCell className="text-right">{course.credit_hours}</TableCell>
                                    <TableCell className="text-right">{course.is_elective ? "اختيارية" : "إجبارية"}</TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)}>
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)}>
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
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}