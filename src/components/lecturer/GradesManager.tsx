import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowRight, 
  Plus, 
  Search, 
  BookOpen, 
  Users, 
  CalendarDays,
  Save,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Types: Based on Controller Response ---

// 1. البيانات الأولية القادمة من getMyCourses
interface RawCourseEntry {
  course_id: number;
  course_name: string;
  course_code: string;
  group_id: number;
  group_name: string;
  semester_id: number;
  semester_name: string;
  academic_year: string;
  college_id: number;
}

// 2. هيكلة بيانات الشبكة (الطلاب والدرجات)
interface AssessmentColumn {
  assessment_id: number;
  name: string;
  max_score: number;
  weight: number;
}

interface StudentRow {
  student_id: number;
  academic_number: string;
  full_name: string;
  status: number;
  grades: { [key: number]: number | null }; // assessment_id -> score
  attendance: {
    attended: number;
    total_sessions: number;
    percentage: number;
  };
}

interface GradebookMeta {
  total_sessions: number;
  students_count: number;
  academic_year: string;
}

// --- Component ---
export function GradesManager() {
  const { toast } = useToast();

  // --- States ---
  
  // 1. Navigation State
  const [viewStep, setViewStep] = useState<'COURSES' | 'GROUPS' | 'SHEET'>('COURSES');
  
  // 2. Selection Data
  const [rawCourses, setRawCourses] = useState<RawCourseEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedContext, setSelectedContext] = useState<RawCourseEntry | null>(null); // يحمل تفاصيل المجموعة المختارة

  // 3. Gradebook Data
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<AssessmentColumn[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState<GradebookMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 4. UI States (Modals)
  const [isAddColOpen, setIsAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColMax, setNewColMax] = useState("20");

  // --- Helpers to Process Raw Data ---

  // استخراج قائمة المواد الفريدة فقط (للمرحلة الأولى)
  const uniqueCourses = useMemo(() => {
    const map = new Map();
    rawCourses.forEach(item => {
      if (!map.has(item.course_id)) {
        map.set(item.course_id, {
          course_id: item.course_id,
          course_name: item.course_name,
          course_code: item.course_code
        });
      }
    });
    return Array.from(map.values());
  }, [rawCourses]);

  // استخراج المجموعات المرتبطة بالمادة المختارة (للمرحلة الثانية)
  const availableGroups = useMemo(() => {
    if (!selectedCourseId) return [];
    return rawCourses.filter(c => c.course_id === selectedCourseId);
  }, [rawCourses, selectedCourseId]);


  // --- API Calls ---

  // 1. جلب القائمة الأولية عند التحميل
  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/lecturer/my-courses');
      setRawCourses(res.data.data);
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحميل قائمة المواد.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 2. جلب بيانات الشبكة (الطلاب والدرجات)
  const fetchGradebook = async (context: RawCourseEntry) => {
    setLoading(true);
    try {
      const res = await api.get('/v1/lecturer/gradebook', {
        params: {
          course_id: context.course_id,
          group_id: context.group_id,
          semester_id: context.semester_id,
          academic_year: context.academic_year
        }
      });
      setColumns(res.data.columns);
      setStudents(res.data.students);
      setMeta(res.data.meta);
      setViewStep('SHEET');
    } catch (err) {
      toast({ title: "خطأ", description: "فشل تحميل سجل الدرجات.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 3. إضافة عمود جديد
  const handleAddColumn = async () => {
    if (!newColName || !selectedContext) return;
    try {
      const res = await api.post('/v1/lecturer/assessments', {
        name: newColName,
        max_score: newColMax,
        course_id: selectedContext.course_id,
        group_id: selectedContext.group_id,
        semester_id: selectedContext.semester_id,
        academic_year: selectedContext.academic_year
      });

      setColumns([...columns, res.data.data]);
      setIsAddColOpen(false);
      setNewColName("");
      toast({ title: "تم بنجاح", description: "تمت إضافة بند التقييم." });
    } catch (err) {
      toast({ title: "خطأ", description: "فشل إضافة العمود.", variant: "destructive" });
    }
  };

  // 4. حفظ الدرجة (عند الخروج من الحقل - onBlur)
  const handleSaveGrade = async (studentId: number, assessmentId: number, value: string) => {
    // تحديث الواجهة فورياً (Optimistic UI)
    const numValue = value === "" ? null : Number(value);
    
    // التحقق البسيط
    const column = columns.find(c => c.assessment_id === assessmentId);
    if (column && numValue !== null && numValue > column.max_score) {
        toast({ title: "تنبيه", description: `الدرجة أكبر من الحد الأقصى (${column.max_score})`, variant: "destructive" });
        return; // لا ترسل للسيرفر، ويفترض إعادة القيمة السابقة (يمكن تحسينها)
    }

    try {
      await api.post('/v1/lecturer/grades/update', {
        student_id: studentId,
        assessment_id: assessmentId,
        score: numValue
      });
      // لا حاجة لرسالة نجاح لكل خلية لتجنب الإزعاج
    } catch (err: any) {
       toast({ title: "فشل الحفظ", description: err.response?.data?.message || "تعذر حفظ الدرجة", variant: "destructive" });
    }
  };

  // تحديث الحالة المحلية عند الكتابة
  const handleLocalGradeChange = (studentId: number, assessmentId: number, value: string) => {
    const updatedStudents = students.map(s => {
        if (s.student_id === studentId) {
            return {
                ...s,
                grades: { ...s.grades, [assessmentId]: value === "" ? null : Number(value) }
            };
        }
        return s;
    });
    setStudents(updatedStudents);
  };

  // حذف عمود
  const handleDeleteColumn = async (id: number) => {
      if(!confirm("هل أنت متأكد من حذف هذا العمود وجميع الدرجات المرتبطة به؟")) return;
      try {
          await api.delete(`/v1/lecturer/assessments/${id}`);
          setColumns(columns.filter(c => c.assessment_id !== id));
          toast({ title: "تم الحذف", description: "تم حذف العمود بنجاح" });
      } catch (err) {
          toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
      }
  }


  // --- Navigation Handlers ---

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setViewStep('GROUPS');
  };

  const handleSelectGroup = (entry: RawCourseEntry) => {
    setSelectedContext(entry);
    fetchGradebook(entry);
  };

  const handleBack = () => {
    if (viewStep === 'SHEET') {
      setViewStep('GROUPS');
      setStudents([]);
      setColumns([]);
    } else if (viewStep === 'GROUPS') {
      setViewStep('COURSES');
      setSelectedCourseId(null);
    }
  };

  // --- Views Renderers ---

  // 1. عرض المواد
  if (viewStep === 'COURSES') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">المواد الدراسية</h2>
        </div>
        
        {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueCourses.map((course: any) => (
                <Card 
                    key={course.course_id} 
                    className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                    onClick={() => handleSelectCourse(course.course_id)}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-primary group-hover:underline decoration-2 underline-offset-4">
                                {course.course_name}
                            </h3>
                            <Badge variant="outline" className="mt-2 text-muted-foreground">
                                {course.course_code || 'بدون كود'}
                            </Badge>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-full">
                            <ArrowRight className="w-5 h-5 text-primary rotate-180" />
                        </div>
                    </div>
                </Card>
            ))}
            {uniqueCourses.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
                    لا توجد مواد مسندة إليك حالياً.
                </div>
            )}
            </div>
        )}
      </div>
    );
  }

  // 2. عرض المجموعات (الدفعة + السنة)
  if (viewStep === 'GROUPS') {
    const courseName = uniqueCourses.find((c: any) => c.course_id === selectedCourseId)?.course_name;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
                <h2 className="text-2xl font-bold">اختيار المجموعة / الدفعة</h2>
                <p className="text-muted-foreground">لمادة: {courseName}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableGroups.map((group) => (
                <Card 
                    key={`${group.group_id}-${group.academic_year}-${group.semester_id}`}
                    className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
                    onClick={() => handleSelectGroup(group)}
                >
                    <div className="absolute top-0 right-0 w-2 h-full bg-primary/20" />
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-lg font-bold">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            {group.group_name}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            <CalendarDays className="w-4 h-4" />
                            <span>{group.academic_year}</span>
                            <span className="mx-1">•</span>
                            <span>{group.semester_name}</span>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    );
  }

  // 3. عرض الشبكة (الطلاب والدرجات)
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.academic_number.includes(searchQuery)
  );

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={handleBack}>
                    <ArrowRight className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        {selectedContext?.course_name}
                        <Badge>{selectedContext?.group_name}</Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 flex gap-2">
                        <span>{selectedContext?.academic_year}</span>
                        <span>•</span>
                        <span>{selectedContext?.semester_name}</span>
                    </p>
                </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="بحث بالاسم أو القيد..." 
                        className="pr-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Add Column Dialog */}
                <Dialog open={isAddColOpen} onOpenChange={setIsAddColOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 whitespace-nowrap">
                            <Plus className="w-4 h-4" />
                            <span>رصد درجة جديدة</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة عمود تقييم جديد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>اسم التقييم (مثال: اختبار نصفي، مشاركة)</Label>
                                <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="أدخل الاسم..." />
                            </div>
                            <div className="space-y-2">
                                <Label>الدرجة العظمى</Label>
                                <Input type="number" value={newColMax} onChange={(e) => setNewColMax(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddColumn} disabled={!newColName}>إضافة</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* The Data Grid */}
        <div className="border rounded-lg bg-white overflow-x-auto shadow-sm relative min-h-[400px]">
            <Table className="relative w-full border-collapse">
                <TableHeader>
                    <TableRow className="bg-primary/5 hover:bg-primary/5">
                        <TableHead className="w-[50px] text-center font-bold text-primary sticky right-0 z-20 bg-primary/5 border-l">#</TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-primary sticky right-[50px] z-20 bg-primary/5 border-l">رقم القيد</TableHead>
                        <TableHead className="w-[200px] text-right font-bold text-primary sticky right-[170px] z-20 bg-primary/5 border-l shadow-sm">اسم الطالب</TableHead>
                        
                        {/* Attendance Column */}
                        <TableHead className="w-[100px] text-center font-bold text-blue-600 bg-blue-50 border-l border-blue-100">
                            <div>الحضور</div>
                            <div className="text-[10px] font-normal opacity-80">% النسبة</div>
                        </TableHead>

                        {/* Dynamic Assessment Columns */}
                        {columns.map(col => (
                            <TableHead key={col.assessment_id} className="min-w-[120px] text-center border-l group relative">
                                <div className="flex flex-col items-center justify-center py-2">
                                    <span className="font-semibold text-foreground">{col.name}</span>
                                    <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-1.5">
                                        من {col.max_score}
                                    </Badge>
                                </div>
                                {/* زر الحذف المخفي يظهر عند التحويم */}
                                <button 
                                    onClick={() => handleDeleteColumn(col.assessment_id)}
                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-all"
                                    title="حذف العمود"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4 + columns.length} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                                    <span>جاري تحميل البيانات...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student, idx) => (
                            <TableRow key={student.student_id} className="hover:bg-muted/5 group transition-colors">
                                {/* Fixed Columns */}
                                <TableCell className="text-center font-medium text-muted-foreground sticky right-0 z-10 bg-white group-hover:bg-muted/5 border-l">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground sticky right-[50px] z-10 bg-white group-hover:bg-muted/5 border-l">{student.academic_number}</TableCell>
                                <TableCell className="font-medium text-foreground sticky right-[170px] z-10 bg-white group-hover:bg-muted/5 border-l shadow-sm">{student.full_name}</TableCell>
                                
                                {/* Attendance Cell */}
                                <TableCell className="text-center bg-blue-50/30 border-l border-blue-100 group-hover:bg-blue-50/50">
                                    <div className="flex flex-col items-center">
                                        <span className={`font-bold ${student.attendance.percentage < 75 ? 'text-destructive' : 'text-blue-700'}`}>
                                            {student.attendance.percentage}%
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            ({student.attendance.attended} / {student.attendance.total_sessions})
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Grade Inputs Cells */}
                                {columns.map(col => (
                                    <TableCell key={col.assessment_id} className="p-1 border-l">
                                        <Input 
                                            type="number" 
                                            className="h-9 w-full text-center border-transparent hover:border-input focus:border-primary bg-transparent focus:bg-white transition-all text-base"
                                            placeholder="-"
                                            dir="ltr"
                                            value={student.grades[col.assessment_id] ?? ""}
                                            onChange={(e) => handleLocalGradeChange(student.student_id, col.assessment_id, e.target.value)}
                                            onBlur={(e) => handleSaveGrade(student.student_id, col.assessment_id, e.target.value)}
                                            min={0}
                                            max={col.max_score}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4 + columns.length} className="h-32 text-center text-muted-foreground">
                                لا يوجد طلاب مطابقين للبحث.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Footer Summary */}
        {meta && (
            <div className="flex justify-end gap-6 text-sm text-muted-foreground px-2">
                <div>عدد الطلاب: <span className="font-medium text-foreground">{meta.students_count}</span></div>
                <div>إجمالي الجلسات: <span className="font-medium text-foreground">{meta.total_sessions}</span></div>
            </div>
        )}
    </div>
  );
}