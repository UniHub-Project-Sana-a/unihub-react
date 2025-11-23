import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link2, FilePlus, Loader2, Users, UserPlus, AlertTriangle, CheckCircle2, Search, Download, Upload, Grid3x3, Shuffle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Types ---
type ApiDepartment = { department_id: number; department_name: string; };
type ApiProgram = { program_id: number; program_name: string; };
type ApiLevel = { level_id: number; level_number: number; };
type ApiSemester = { semester_id: number; term_number: number; };
type ApiCourse = { course_id: number; course_code: string; course_name: string; };
type StudentVM = { id: string; name: string; gender: string; studentDbId: number; };
type GroupVM = { id: number; name: string; studentsCount: number; maxSize: number; };

interface EnrollmentModuleProps {
  collegeId: string;
}

export default function EnrollmentModule({ collegeId }: EnrollmentModuleProps) {
  const { toast } = useToast();
  const csvInputRef = useRef<HTMLInputElement>(null);

  // --- States for Path & Stepper ---
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [levels, setLevels] = useState<ApiLevel[]>([]);
  const [semesters, setSemesters] = useState<ApiSemester[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // --- States for Groups ---
  const [groups, setGroups] = useState<GroupVM[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupVM | null>(null);

  // --- States for Group Details & Students ---
  const [groupMembers, setGroupMembers] = useState<StudentVM[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiImportUrl, setApiImportUrl] = useState("");

  // --- States for Import Tab ---
  const [importStep, setImportStep] = useState(1);
  const [selectedFailingStudents, setSelectedFailingStudents] = useState<string[]>([]);
  
  // --- Mock Data (as per original code) ---
  const mockFailingStudents = [
    { id: "STD-2101", name: "أحمد محمد علي", year: 2023, gpa: 2.3, gender: "ذكر", notes: "راسب في CS101" },
    { id: "STD-2102", name: "فاطمة حسن", year: 2023, gpa: 2.1, gender: "أنثى", notes: "راسب في CS102" },
  ];
  const steps = [{ num: 1, label: "القسم" }, { num: 2, label: "البرنامج" }, { num: 3, label: "المستوى" }, { num: 4, label: "الترم" }, { num: 5, label: "المقرر" }, { num: 6, label: "المعاينة" }];

  // --- Fetchers ---
  const fetchDepartments = async () => { try { const res = await api.get("/v1/departments", { params: { college_id: collegeId } }); setDepartments(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchPrograms = async (deptId: string) => { try { const res = await api.get("/v1/programs", { params: { department_id: deptId } }); setPrograms(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchLevels = async (progId: string) => { try { const res = await api.get("/v1/levels", { params: { program_id: progId } }); setLevels(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchSemesters = async (levelId: string) => { try { const res = await api.get("/v1/semesters", { params: { level_id: levelId } }); setSemesters(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchCourses = async (semesterId: string) => { try { const res = await api.get("/v1/courses", { params: { semester_id: semesterId } }); setCourses(res.data?.data ?? res.data); } catch { /* ... */ }};

  const fetchGroups = async () => {
    if (!selectedSemesterId) { setGroups([]); return; }
    try {
      const res = await api.get("/v1/student-groups", { params: { college_id: collegeId, department_id: selectedDepartmentId, level_id: selectedLevelId, semester_id: selectedSemesterId, with_counts: 1 } });
      const raw: any[] = res.data?.data ?? res.data;
      setGroups(raw.map((g) => ({ id: g.group_id, name: g.group_name, studentsCount: Number(g.students_count ?? 0), maxSize: 30 })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل المجموعات" }); }
  };

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const res = await api.get(`/v1/student-groups/${groupId}/students`);
      const raw: any[] = res.data?.data ?? res.data;
      setGroupMembers(raw.map((s) => ({ id: String(s.user?.academic_number || s.student_id), name: s.user?.full_name || `طالب ${s.student_id}`, gender: s.user?.gender === 1 ? "ذكر" : "أنثى", studentDbId: s.student_id })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل طلاب المجموعة" }); }
  };

  // --- Effects ---
  useEffect(() => { fetchDepartments(); }, [collegeId]);
  useEffect(() => { if (selectedDepartmentId) fetchPrograms(selectedDepartmentId); }, [selectedDepartmentId]);
  useEffect(() => { if (selectedProgramId) fetchLevels(selectedProgramId); }, [selectedProgramId]);
  useEffect(() => { if (selectedLevelId) fetchSemesters(selectedLevelId); }, [selectedLevelId]);
  useEffect(() => {
  // إن لم يكتمل المسار، نظّف القوائم والاختيارات
  if (!selectedDepartmentId || !selectedLevelId || !selectedSemesterId) {
    setGroups([]);
    setSelectedGroup(null);
    setGroupMembers([]);
    return;
  }
  // useEffect(() => {
  //   if (selectedSemesterId) {
  //     fetchCourses(selectedSemesterId);
  //   } else {
  //     setCourses([]);
  //   }
  // }, [selectedSemesterId]);

  // عند اكتمال المسار، اجلب المجموعات
  fetchGroups();
}, [selectedDepartmentId, selectedLevelId, selectedSemesterId]);

  // --- Handlers ---
  const handleCreateGroup = async (): Promise<void> => {
    if (
      !newGroupName.trim() ||
      !selectedDepartmentId ||
      !selectedLevelId ||
      !selectedSemesterId
    ) {
      toast({
        title: "تنبيه",
        description: "اختر القسم والمستوى والترم وأدخل اسم المجموعة",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsCreatingGroup(true);
  
      // المحاولة الأولى: إنشاء/استرجاع المجموعة لنفس المسار (يحترم unique_group_per_path)
      await api.post("/v1/student-groups/upsert-and-attach", {
        college_id: Number(collegeId),
        department_id: Number(selectedDepartmentId),
        level_id: Number(selectedLevelId),
        semester_id: Number(selectedSemesterId),
        group_name: newGroupName.trim(),
      });
  
      toast({ title: "نجاح", description: "تم إنشاء/تجهيز المجموعة" });
      setNewGroupName("");
      await fetchGroups();
    } catch (err: any) {
      // fallback: استخدام المسار القياسي لو لم يتوفر upsert-and-attach
      try {
        await api.post("/v1/student-groups", {
          college_id: Number(collegeId),
          department_id: Number(selectedDepartmentId),
          level_id: Number(selectedLevelId),
          semester_id: Number(selectedSemesterId),
          group_name: newGroupName.trim(),
        });
  
        toast({ title: "نجاح", description: "تم إنشاء المجموعة" });
        setNewGroupName("");
        await fetchGroups();
      } catch (e2: any) {
        toast({
          title: "خطأ",
          description: e2?.response?.data?.message || "فشل إنشاء المجموعة",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSelectGroup = (group: GroupVM) => { setSelectedGroup(group); fetchGroupMembers(group.id); };

  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedGroup) return;
  
    try {
      setIsImporting(true);
  
      const formData = new FormData();
      formData.append("file", e.target.files[0]);           // يدعم csv/txt و xlsx/xls
      formData.append("group_id", String(selectedGroup.id));
      // ملاحظة: الهاتف غير موجود في الملف وسيُعتبر null. إن كان الباك يدعم خياراً صريحاً:
      formData.append("allow_null_phone", "1"); // سيتم تجاهله إن لم يدعمه السيرفر
  
      // لا تضبط Content-Type يدوياً (ليضيف Axios الـ boundary تلقائياً)
      const res = await api.post("/v1/student-groups/import-csv", formData);
  
      const d = res.data ?? {};
      const createdUsers     = Number(d.created_users ?? 0);
      const createdStudents  = Number(d.created_students ?? 0);
      const attached         = Number(d.attached_to_group ?? 0);
      const skippedMissing   = Number(d.skipped_missing ?? 0);
      const skippedConflicts = Number(d.skipped_conflicts ?? 0);
  
      if ((createdUsers + createdStudents + attached) === 0) {
        toast({
          title: "لم يتم استيراد أي طالب",
          description: "تحقق من عناوين الأعمدة: academic_number, full_name, email, gender. الهاتف (phone) اختياري وسيُخزّن كـ null إن لم يوجد.",
          variant: "destructive",
        });
      } else {
        const details = [
          `مستخدمون جدد: ${createdUsers}`,
          `طلاب جدد: ${createdStudents}`,
          `تم ربطهم بالمجموعة: ${attached}`,
        ].join(" | ");
  
        const warnings =
          skippedMissing + skippedConflicts > 0
            ? ` | تخطي: ${skippedMissing} | تعارضات: ${skippedConflicts}`
            : "";
  
        toast({
          title: "نجحت عملية الاستيراد",
          description: details + warnings,
        });
      }
  
      await fetchGroupMembers(selectedGroup.id);
      await fetchGroups();
    } catch (err: any) {
      const server = err?.response?.data;
      const msg =
        server?.message ||
        server?.error ||
        "فشل استيراد الملف. تأكد من أن الأعمدة صحيحة وأن الملف محفوظ بصيغة CSV أو Excel.";
      console.error("Import error:", server || err);
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };
  
  const handleImportFromApi = async (): Promise<void> => {
    if (!selectedGroup || !apiImportUrl.trim()) {
      toast({
        title: "تنبيه",
        description: "اختر مجموعة وأدخل رابط API",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsImporting(true);
  
      const payload = {
        url: apiImportUrl.trim(),
        group_id: Number(selectedGroup.id),
        college_id: Number(collegeId),
        department_id: selectedDepartmentId ? Number(selectedDepartmentId) : undefined,
        level_id: selectedLevelId ? Number(selectedLevelId) : undefined,
        semester_id: selectedSemesterId ? Number(selectedSemesterId) : undefined,
        course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
      };
  
      const res = await api.post("/v1/student-groups/import-external", payload);
  
      toast({
        title: "نجاح",
        description: res?.data?.message || "تم الاستيراد من API",
      });
  
      // إغلاق النموذج وتحديث البيانات
      setIsApiDialogOpen(false);
      setApiImportUrl("");
      await fetchGroupMembers(selectedGroup.id);
      await fetchGroups();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
  
      if (status === 501) {
        toast({
          title: "غير مفعّل",
          description: "الاستيراد من API غير مفعّل حالياً (Placeholder).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: msg || "فشل استيراد من API",
          variant: "destructive",
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveStudentFromGroup = async (studentDbId: number) => {
    if (!selectedGroup || !confirm("هل أنت متأكد من حذف هذا الطالب من المجموعة؟")) return;
    try {
      await api.delete(`/v1/student-groups/${selectedGroup.id}/students`, { data: { student_id: studentDbId } });
      toast({ title: "نجاح", description: "تم حذف الطالب من المجموعة" });
      await fetchGroupMembers(selectedGroup.id); await fetchGroups();
    } catch (err: any) { toast({ title: "خطأ", description: err?.response?.data?.message || "فشل حذف الطالب", variant: "destructive" }); }
  };

  const toggleFailingStudentSelection = (studentId: string) => setSelectedFailingStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  
  // Memos for Stepper
  const currentStepList = useMemo(() => {
    switch (importStep) {
      case 1: return departments.map(d => ({ value: String(d.department_id), label: d.department_name }));
      case 2: return programs.map(p => ({ value: String(p.program_id), label: p.program_name }));
      case 3: return levels.map(l => ({ value: String(l.level_id), label: `المستوى ${l.level_number}` }));
      case 4: return semesters.map(s => ({ value: String(s.semester_id), label: `الترم ${s.term_number}` }));
      case 5: return courses.map(c => ({ value: String(c.course_id), label: `${c.course_code} - ${c.course_name}` }));
      default: return [];
    }
  }, [importStep, departments, programs, levels, semesters, courses]);
  
  const currentStepValue = useMemo(() => {
    switch (importStep) {
      case 1: return selectedDepartmentId;
      case 2: return selectedProgramId;
      case 3: return selectedLevelId;
      case 4: return selectedSemesterId;
      case 5: return selectedCourseId;
      default: return "";
    }
  }, [importStep, selectedDepartmentId, selectedProgramId, selectedLevelId, selectedSemesterId, selectedCourseId]);

  const handleCurrentStepChange = (val: string) => {
    switch (importStep) {
      case 1: setSelectedDepartmentId(val); break;
      case 2: setSelectedProgramId(val); break;
      case 3: setSelectedLevelId(val); break;
      case 4: setSelectedSemesterId(val); break;
      case 5: setSelectedCourseId(val); break;
      default: break;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="groups" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-1 bg-card/50 backdrop-blur-sm">
          {/* <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">استيراد الطلاب</TabsTrigger> */}
          <TabsTrigger value="groups" className="data-[state=active]:bg-primary/10">إدارة المجموعات</TabsTrigger>
        </TabsList>

        {/* --- Import Students Tab --- */}
        {/* <TabsContent value="import" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={step.num} className="flex items-center">
                    <div className={`flex items-center gap-2 ${importStep >= step.num ? 'text-primary' : 'text-muted-foreground'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${importStep >= step.num ? 'bg-primary text-primary-foreground' : 'bg-card border-2'}`}>
                        {importStep > step.num ? <CheckCircle2 /> : step.num}
                      </div>
                      <span className="text-sm font-medium hidden md:block">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className={`h-0.5 w-12 mx-2 ${importStep > step.num ? 'bg-primary' : 'bg-border'}`}></div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {importStep < 6 && (
            <Card>
              <CardHeader><CardTitle>{steps[importStep - 1].label}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Select value={currentStepValue} onValueChange={handleCurrentStepChange}>
                  <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent>{currentStepList.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportStep(Math.max(1, importStep - 1))}>السابق</Button>
                  <Button onClick={() => setImportStep(Math.min(6, importStep + 1))}>التالي</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {importStep === 6 && (
            <Card>
              <CardHeader><CardTitle>الطلاب الراسبون (السنوات السابقة)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead><Checkbox /></TableHead><TableHead>رقم الطالب</TableHead><TableHead>الاسم</TableHead><TableHead>المعدل</TableHead><TableHead>ملاحظات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {mockFailingStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell><Checkbox checked={selectedFailingStudents.includes(student.id)} onCheckedChange={() => toggleFailingStudentSelection(student.id)} /></TableCell>
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell><Badge variant={student.gpa < 2.0 ? "destructive" : "default"}>{student.gpa}</Badge></TableCell>
                        <TableCell>{student.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent> */}

        {/* --- Manage Groups Tab --- */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>1. اختر المسار الدراسي للمجموعات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Selects for Department, Program, Level, Semester */}
                <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}><SelectTrigger><SelectValue placeholder="القسم..." /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={!programs.length}><SelectTrigger><SelectValue placeholder="البرنامج..." /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.program_id} value={String(p.program_id)}>{p.program_name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedLevelId} onValueChange={setSelectedLevelId} disabled={!levels.length}><SelectTrigger><SelectValue placeholder="المستوى..." /></SelectTrigger><SelectContent>{levels.map(l => <SelectItem key={l.level_id} value={String(l.level_id)}>المستوى {l.level_number}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId} disabled={!semesters.length}><SelectTrigger><SelectValue placeholder="الترم..." /></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s.semester_id} value={String(s.semester_id)}>الترم {s.term_number}</SelectItem>)}</SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. إدارة المجموعات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="اسم المجموعة الجديدة..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} disabled={!selectedSemesterId} />
                <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !selectedSemesterId}>
                  {isCreatingGroup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} إنشاء
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map(group => (
                  <Card key={group.id} onClick={() => handleSelectGroup(group)} className={cn("cursor-pointer", selectedGroup?.id === group.id && "border-primary")}>
                    <CardHeader>
                      <CardTitle>{group.name}</CardTitle>
                      <Badge variant="outline">{group.studentsCount}/{group.maxSize}</Badge>
                    </CardHeader>
                    <CardContent><div className="w-full bg-secondary rounded-full h-2 overflow-hidden"><div className="bg-primary h-full" style={{ width: `${(group.studentsCount / group.maxSize) * 100}%` }}></div></div></CardContent>
                  </Card>
                ))}
                {selectedSemesterId && groups.length === 0 && <p className="text-muted-foreground">لا توجد مجموعات. قم بإنشاء واحدة.</p>}
              </div>
            </CardContent>
          </Card>

          {selectedGroup && (
            <Card>
              <CardHeader><CardTitle>3. طلاب المجموعة: {selectedGroup.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex items-center gap-4">
                  <Label>ضم طلاب لهذه المجموعة:</Label>
                  <Button variant="outline" onClick={() => csvInputRef.current?.click()} disabled={isImporting}>
                    {isImporting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}<Upload className="w-4 h-4 ml-2" /> استيراد CSV
                  </Button>
                  <input ref={csvInputRef} type="file" className="hidden" accept=".csv" onChange={handleCsvChange} />
                  <Button variant="outline" onClick={() => setIsApiDialogOpen(true)}><Link2 className="w-4 h-4 ml-2" /> استيراد من API</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {groupMembers.map(student => (
                    <Card key={student.id}>
                      <CardContent className="p-3 text-center relative">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveStudentFromGroup(student.studentDbId)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.id}</div>
                        <Badge variant="outline" className="mt-2 text-xs">{student.gender}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {groupMembers.length === 0 && <p className="text-muted-foreground col-span-full">لا يوجد طلاب في هذه المجموعة بعد. يمكنك ضمهم عبر أدوات الاستيراد.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>استيراد من API</DialogTitle></DialogHeader>
                <div className="space-y-2"><Label>رابط API</Label><Input value={apiImportUrl} onChange={(e) => setApiImportUrl(e.target.value)} /></div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsApiDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleImportFromApi} disabled={isImporting}>
                        {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} استيراد
                    </Button>
                </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}