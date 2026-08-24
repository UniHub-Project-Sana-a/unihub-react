import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link2, FilePlus, Loader2, Users, UserPlus, AlertTriangle, CheckCircle2, Search, Download, Upload, Grid3x3, Shuffle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

// --- Types ---
type ApiDepartment = { department_id: number; department_name: string; };
type ApiProgram = { program_id: number; program_name: string; academic_system?: "semester" | "credit"; block_based?: boolean; };
type ApiLevel = { level_id: number; level_number: number; };
type ApiSemester = { semester_id: number; term_number: number; };
type ApiBlock = { id: number; block_name: string; block_number: number; level_id?: number | null; };
type ApiCourse = { course_id: number; course_code: string; course_name: string; };
type StudentVM = { id: string; name: string; gender: string; studentDbId: number; userId: number;};
type GroupVM = { id: number; name: string; studentsCount: number; maxSize: number; };

interface EnrollmentModuleProps {
  collegeId: string;
}

export default function EnrollmentModule({ collegeId }: EnrollmentModuleProps) {
  const { can } = usePermission();
  const { toast } = useToast();
  const csvInputRef = useRef<HTMLInputElement>(null);

    // --- States for Edit Student Dialog ---
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null); // يحمل بيانات الفورم
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // --- States for Path & Stepper ---
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [levels, setLevels] = useState<ApiLevel[]>([]);
  const [semesters, setSemesters] = useState<ApiSemester[]>([]);
  const [blocks, setBlocks] = useState<ApiBlock[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const activeProgram = programs.find((p) => String(p.program_id) === selectedProgramId) || null;
  const isSemesterProgram = activeProgram?.academic_system === "semester";
  const isBlockBasedProgram = !!activeProgram?.block_based;

  // --- States for Groups ---
  const [groups, setGroups] = useState<GroupVM[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupCapacity, setGroupCapacity] = useState<number | "">("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupVM | null>(null);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupVM | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupCapacity, setEditGroupCapacity] = useState<number | "">("");
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // --- States for Group Details & Students ---
  const [groupMembers, setGroupMembers] = useState<StudentVM[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiImportUrl, setApiImportUrl] = useState("");

  // --- States for Import Tab ---
  const [importStep, setImportStep] = useState(1);
  const [selectedFailingStudents, setSelectedFailingStudents] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [academicAction, setAcademicAction] = useState<"promote" | "demote" | "pass" | "fail" | "move">("move");
  const [moveTargetLevelId, setMoveTargetLevelId] = useState("");
  const [moveTargetSemesterId, setMoveTargetSemesterId] = useState("");
  const [moveTargetBlockId, setMoveTargetBlockId] = useState("");
  
  // --- Mock Data (as per original code) ---
  const mockFailingStudents = [
    { id: "STD-2101", name: "أحمد محمد علي", year: 2023, gpa: 2.3, gender: "ذكر", notes: "راسب في CS101" },
    { id: "STD-2102", name: "فاطمة حسن", year: 2023, gpa: 2.1, gender: "أنثى", notes: "راسب في CS102" },
  ];
  const steps = [{ num: 1, label: "القسم" }, { num: 2, label: "البرنامج" }, { num: 3, label: "المستوى" }, { num: 4, label: "الترم" }, { num: 5, label: "المقرر" }, { num: 6, label: "المعاينة" }];

  // --- States for Add Manual Student ---
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    full_name: "",
    academic_number: "",
    email: "",
    phone: "",
    gender: "1" // 1: Male, 2: Female
  });

  // --- Fetchers ---
  const fetchDepartments = async () => { try { const res = await api.get("/v1/departments", { params: { college_id: collegeId } }); setDepartments(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchPrograms = async (deptId: string) => { try { const res = await api.get("/v1/programs", { params: { department_id: deptId } }); setPrograms(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchLevels = async (progId: string) => { try { const res = await api.get("/v1/levels", { params: { program_id: progId } }); setLevels(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchSemesters = async (levelId: string) => { try { const res = await api.get("/v1/semesters", { params: { level_id: levelId } }); setSemesters(res.data?.data ?? res.data); } catch { /* ... */ }};
  const fetchBlocks = async (programId: string) => { try { const res = await api.get("/v1/blocks", { params: { program_id: programId } }); setBlocks(res.data?.data ?? res.data ?? []); } catch { setBlocks([]); } };
  const fetchCourses = async (semesterId: string) => { try { const res = await api.get("/v1/courses", { params: { semester_id: semesterId } }); setCourses(res.data?.data ?? res.data); } catch { /* ... */ }};

  const fetchGroups = async () => {
    const params: Record<string, string | number> = {
      college_id: Number(collegeId),
      department_id: Number(selectedDepartmentId),
      program_id: Number(selectedProgramId),
      with_counts: 1,
    };

    if (isSemesterProgram && !isBlockBasedProgram) {
      if (!selectedLevelId || !selectedSemesterId) { setGroups([]); return; }
      params.level_id = Number(selectedLevelId);
      params.semester_id = Number(selectedSemesterId);
    } else if (isSemesterProgram && isBlockBasedProgram) {
      if (!selectedLevelId || !selectedBlockId) { setGroups([]); return; }
      params.level_id = Number(selectedLevelId);
      params.block_id = Number(selectedBlockId);
    } else if (!isSemesterProgram && isBlockBasedProgram) {
      if (!selectedBlockId) { setGroups([]); return; }
      params.block_id = Number(selectedBlockId);
    } else {
      if (!selectedProgramId) { setGroups([]); return; }
    }

    try {
      const res = await api.get("/v1/student-groups", { params });
      const raw: any[] = res.data?.data ?? res.data;
      setGroups(raw.map((g) => ({ id: g.group_id, name: g.group_name, studentsCount: Number(g.students_count ?? 0), maxSize: Number(g.max_students ?? 1) })));
    } catch { toast({ title: "خطأ", description: "فشل تحميل المجموعات" }); }
  };

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const res = await api.get(`/v1/student-groups/${groupId}/students`);
      const raw: any[] = res.data?.data ?? res.data;

      setGroupMembers(raw.map((s) => ({
        id: String(s.user?.academic_number || s.student_id),
        name: s.user?.full_name || `طالب ${s.student_id}`,
        gender: (s.user?.gender === 1 || s.gender === 1) ? "ذكر" : "أنثى",
        studentDbId: s.student_id,
        // حفظ الرقم الجامعي لنستخدمه في البحث
        academicNumber: s.user?.academic_number || s.academic_number, 
        // محاولة حفظ الـ ID لو توفر (حالياً هو null)
        userId: s.user_id ?? s.user?.user_id ?? s.user?.id 
      })));
    } catch { 
      toast({ title: "خطأ", description: "فشل تحميل طلاب المجموعة" }); 
    }
  };

  // 2. تعديل دالة النقر لإضافة الحماية
    const handleStudentClick = async (student: any) => {
    try {
      setIsLoadingDetails(true);
      
      let targetUserId = student.userId;
      let userData = null;

      // 1. إذا لم يكن لدينا ID، نبحث بالرقم الجامعي
      if (!targetUserId) {
        
        if (!student.academicNumber || student.academicNumber === "غير معروف") {
             toast({ title: "بيانات ناقصة", description: "لا يوجد رقم جامعي لهذا الطالب للبحث عنه.", variant: "destructive" });
             setIsLoadingDetails(false);
             return;
        }

        try {
            const searchRes = await api.get('/v1/users', { 
                params: { academic_number: student.academicNumber } 
            });
            
            const searchData = searchRes.data?.data ?? searchRes.data;
            
            if (Array.isArray(searchData) && searchData.length > 0) {
                // ✅ التعديل: تحسين منطق المطابقة (تحويل لنص + إزالة المسافات)
                const searchNum = String(student.academicNumber).trim();

                // محاولة 1: بحث دقيق بعد التنظيف
                let match = searchData.find((u: any) => String(u.academic_number).trim() === searchNum);
                
                // محاولة 2: إذا لم نجد وكان هناك نتيجة واحدة فقط، نعتمدها
                if (!match && searchData.length === 1) {
                    console.warn(`⚠️ اعتماد النتيجة الوحيدة رغم اختلاف التنسيق: ${searchData[0].academic_number} != ${searchNum}`);
                    match = searchData[0];
                }

                if (match) {
                    targetUserId = match.user_id;
                    userData = match;
                } else {
                    console.error("⚠️ فشل المطابقة التامة", { searched: searchNum, found: searchData });
                }

            } else if (searchData?.user_id) {
                targetUserId = searchData.user_id;
                userData = searchData;
            }
        } catch (searchErr) {
            console.error("فشل البحث عن المستخدم", searchErr);
        }
      }

      // 2. التحقق النهائي
      if (!targetUserId || !userData) {
        toast({ 
            title: "عفواً", 
            description: `لم يتم العثور على حساب مستخدم مطابق للرقم الجامعي (${student.academicNumber}).`, 
            variant: "destructive" 
        });
        setIsLoadingDetails(false);
        return;
      }

      // 3. فتح المودال
      setIsEditStudentOpen(true);

      // جلب التفاصيل الكاملة إذا لزم الأمر
      if (!userData.email || !userData.phone) {
          const res = await api.get(`/v1/users/${targetUserId}`);
          userData = res.data?.data ?? res.data;
      }

      setEditingStudent({
        user_id: userData.user_id,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        academic_number: userData.academic_number,
        gender: String(userData.gender), 
      });

    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "حدث خطأ أثناء جلب بيانات الطالب", variant: "destructive" });
      setIsEditStudentOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // --- Handler: Add Single Student ---
    // --- Handler: Add Single Student (via CSV Simulation) ---
  const handleAddSingleStudent = async () => {
    if (!selectedGroup) return;
    
    // التحقق من البيانات
    if (!newStudentData.full_name || !newStudentData.academic_number) {
        toast({ title: "بيانات ناقصة", description: "يرجى إدخال الاسم والرقم الجامعي", variant: "destructive" });
        return;
    }

    try {
      setIsAddingStudent(true);

      // 1. تجهيز محتوى CSV لطالب واحد
      // الترويسة يجب أن تطابق ما يتوقعه السيرفر
      const headers = "academic_number,full_name,email,phone,gender";
      const genderLabel = newStudentData.gender === "1" ? "ذكر" : "أنثى"; // أو 1/2 حسب ما يقبله ملف الـ CSV في الباك
      // ملاحظة: نرسل القيم مفصولة بفواصل
      const row = `${newStudentData.academic_number},${newStudentData.full_name},${newStudentData.email},${newStudentData.phone},${genderLabel}`;
      const csvContent = "\uFEFF" + headers + "\n" + row; // \uFEFF لدعم الترميز العربي

      // 2. إنشاء ملف وهمي في الذاكرة
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const file = new File([blob], "manual_single_student.csv", { type: 'text/csv' });

      // 3. تجهيز الفورم داتا
      const formData = new FormData();
      formData.append("file", file);
      formData.append("group_id", String(selectedGroup.id));
      formData.append("allow_null_phone", "1");

      // 4. الإرسال لنفس رابط استيراد الـ CSV الذي يعمل
      const res = await api.post("/v1/student-groups/import-csv", formData);

      // 5. التحقق من النتيجة
      const d = res.data ?? {};
      const totalSuccess = (Number(d.created_users ?? 0) + Number(d.created_students ?? 0) + Number(d.attached_to_group ?? 0));

      if (totalSuccess > 0) {
        toast({ title: "نجاح", description: "تم إضافة الطالب للمجموعة بنجاح" });
        // تنظيف الحقول وإغلاق النافذة
        setNewStudentData({ full_name: "", academic_number: "", email: "", phone: "", gender: "1" });
        setIsAddStudentOpen(false);
        // تحديث القائمة
        fetchGroupMembers(selectedGroup.id);
        fetchGroups();
      } else {
        // حالة التكرار أو الفشل
        const skipped = Number(d.skipped_conflicts ?? 0);
        if (skipped > 0) {
            toast({ title: "تنبيه", description: "هذا الطالب موجود بالفعل في النظام أو المجموعة.", variant: "destructive" });
        } else {
             toast({ title: "فشل", description: "لم يتم إضافة الطالب، تحقق من البيانات.", variant: "destructive" });
        }
      }

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "فشل إضافة الطالب";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsAddingStudent(false);
    }
  };

  // --- Effects ---
  useEffect(() => { fetchDepartments(); }, [collegeId]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setPrograms([]);
      setSelectedProgramId("");
      return;
    }
    fetchPrograms(selectedDepartmentId);
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (!selectedProgramId) {
      setLevels([]);
      setSemesters([]);
      setBlocks([]);
      setSelectedLevelId("");
      setSelectedSemesterId("");
      setSelectedBlockId("");
      setGroups([]);
      setSelectedGroup(null);
      setGroupMembers([]);
      return;
    }

    const program = programs.find((p) => String(p.program_id) === selectedProgramId);
    if (!program) return;

    if (program.academic_system === "semester") {
      fetchLevels(selectedProgramId);
      if (program.block_based) {
        fetchBlocks(selectedProgramId);
      } else {
        setBlocks([]);
        setSelectedBlockId("");
      }
    } else {
      setLevels([]);
      setSemesters([]);
      setSelectedLevelId("");
      setSelectedSemesterId("");
      if (program.block_based) {
        fetchBlocks(selectedProgramId);
      } else {
        setBlocks([]);
        setSelectedBlockId("");
      }
    }
  }, [selectedProgramId, programs]);

  useEffect(() => {
    if (!selectedLevelId) {
      setSemesters([]);
      setSelectedSemesterId("");
      return;
    }

    if (isSemesterProgram && !isBlockBasedProgram) {
      fetchSemesters(selectedLevelId);
    }
  }, [selectedLevelId, isSemesterProgram, isBlockBasedProgram]);

  useEffect(() => {
    if (!selectedDepartmentId || !selectedProgramId) {
      setGroups([]);
      setSelectedGroup(null);
      setGroupMembers([]);
      return;
    }

    const validForGroup = isSemesterProgram
      ? (!isBlockBasedProgram ? !!selectedLevelId && !!selectedSemesterId : !!selectedLevelId && !!selectedBlockId)
      : isBlockBasedProgram ? !!selectedBlockId : true;

    if (!validForGroup) {
      setGroups([]);
      setSelectedGroup(null);
      setGroupMembers([]);
      return;
    }

    fetchGroups();
  }, [selectedDepartmentId, selectedProgramId, selectedLevelId, selectedSemesterId, selectedBlockId, isSemesterProgram, isBlockBasedProgram]);

  // --- Handlers ---
  const handleCreateGroup = async (): Promise<void> => {
    const capacityValue = Number(groupCapacity);

    if (!newGroupName.trim() || !selectedDepartmentId || !selectedProgramId) {
      toast({
        title: "تنبيه",
        description: "اختر القسم والبرنامج وأدخل اسم المجموعة",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(capacityValue) || capacityValue < 1) {
      toast({
        title: "تنبيه",
        description: "أدخل سعة المجموعة بشكل صحيح قبل الإنشاء",
        variant: "destructive",
      });
      return;
    }

    const payload: Record<string, string | number> = {
      college_id: Number(collegeId),
      department_id: Number(selectedDepartmentId),
      program_id: Number(selectedProgramId),
      group_name: newGroupName.trim(),
      max_students: capacityValue,
    };

    if (isSemesterProgram) {
      if (isBlockBasedProgram) {
        if (!selectedLevelId || !selectedBlockId) {
          toast({ title: "تنبيه", description: "اختر المستوى والبلوك أولاً", variant: "destructive" });
          return;
        }
        payload.level_id = Number(selectedLevelId);
        payload.block_id = Number(selectedBlockId);
      } else {
        if (!selectedLevelId || !selectedSemesterId) {
          toast({ title: "تنبيه", description: "اختر المستوى والترم أولاً", variant: "destructive" });
          return;
        }
        payload.level_id = Number(selectedLevelId);
        payload.semester_id = Number(selectedSemesterId);
      }
    } else if (isBlockBasedProgram) {
      if (!selectedBlockId) {
        toast({ title: "تنبيه", description: "اختر البلوك أولاً", variant: "destructive" });
        return;
      }
      payload.block_id = Number(selectedBlockId);
    }

    try {
      setIsCreatingGroup(true);

      await api.post("/v1/student-groups/upsert-and-attach", payload);

      toast({ title: "نجاح", description: "تم إنشاء/تجهيز المجموعة" });
      setNewGroupName("");
      setGroupCapacity("");
      await fetchGroups();
    } catch (err: any) {
      try {
        await api.post("/v1/student-groups", payload);

        toast({ title: "نجاح", description: "تم إنشاء المجموعة" });
        setNewGroupName("");
        setGroupCapacity("");
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

  const openEditGroupDialog = (group: GroupVM) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupCapacity(group.maxSize);
    setIsEditGroupOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    const trimmed = editGroupName.trim();
    const capacityValue = Number(editGroupCapacity);

    if (!trimmed) {
      toast({ title: "تنبيه", description: "اسم المجموعة مطلوب", variant: "destructive" });
      return;
    }

    if (!Number.isFinite(capacityValue) || capacityValue < 1) {
      toast({ title: "تنبيه", description: "أدخل سعة المجموعة بشكل صحيح", variant: "destructive" });
      return;
    }

    try {
      setIsUpdatingGroup(true);
      await api.put(`/v1/student-groups/${editingGroup.id}`, {
        group_name: trimmed,
        max_students: capacityValue,
      });

      toast({ title: "نجاح", description: "تم تحديث اسم المجموعة وسعتها" });
      setIsEditGroupOpen(false);
      setEditingGroup(null);
      setEditGroupName("");
      setEditGroupCapacity("");
      await fetchGroups();
      if (selectedGroup?.id === editingGroup.id) {
        setSelectedGroup({ ...selectedGroup, name: trimmed, maxSize: capacityValue });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "فشل تحديث المجموعة";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsUpdatingGroup(false);
    }
  };

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

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const clearAcademicSelection = () => {
    setSelectedStudentIds([]);
    setMoveTargetLevelId("");
    setMoveTargetSemesterId("");
    setMoveTargetBlockId("");
  };

  const handleAcademicBulkAction = async (action: "promote" | "demote" | "pass" | "fail" | "move") => {
    if (!selectedGroup) {
      toast({ title: "تنبيه", description: "اختر مجموعة أولاً", variant: "destructive" });
      return;
    }

    const payload: Record<string, any> = {
      college_id: Number(collegeId),
      department_id: Number(selectedDepartmentId),
      program_id: Number(selectedProgramId),
    };

    if (action === "move") {
      if (isSemesterProgram && !isBlockBasedProgram) {
        if (!moveTargetLevelId || !moveTargetSemesterId) {
          toast({ title: "تنبيه", description: "اختر المستوى والمرحلة المستهدفة أولاً", variant: "destructive" });
          return;
        }
        payload.level_id = Number(moveTargetLevelId);
        payload.semester_id = Number(moveTargetSemesterId);
      } else if (isSemesterProgram && isBlockBasedProgram) {
        if (!moveTargetLevelId || !moveTargetBlockId) {
          toast({ title: "تنبيه", description: "اختر المستوى والبلوك المستهدف أولاً", variant: "destructive" });
          return;
        }
        payload.level_id = Number(moveTargetLevelId);
        payload.block_id = Number(moveTargetBlockId);
      } else if (!isSemesterProgram && isBlockBasedProgram) {
        if (!moveTargetBlockId) {
          toast({ title: "تنبيه", description: "اختر البلوك المستهدف أولاً", variant: "destructive" });
          return;
        }
        payload.block_id = Number(moveTargetBlockId);
      }

      try {
        await api.post(`/v1/student-groups/${selectedGroup.id}/move`, payload);
        toast({ title: "نجاح", description: "تم نقل المجموعة داخل نفس البرنامج بنجاح" });
        await fetchGroups();
        await fetchGroupMembers(selectedGroup.id);
      } catch (err: any) {
        toast({ title: "خطأ", description: err?.response?.data?.message || "فشل نقل المجموعة", variant: "destructive" });
      }
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر طالباً أو أكثر أولاً", variant: "destructive" });
      return;
    }

    if (isSemesterProgram && !isBlockBasedProgram) {
      payload.level_id = Number(moveTargetLevelId || selectedLevelId || 0);
      payload.semester_id = Number(moveTargetSemesterId || selectedSemesterId || 0);
    } else if (isSemesterProgram && isBlockBasedProgram) {
      payload.level_id = Number(moveTargetLevelId || selectedLevelId || 0);
      payload.block_id = Number(moveTargetBlockId || selectedBlockId || 0);
    } else if (!isSemesterProgram && isBlockBasedProgram) {
      payload.block_id = Number(moveTargetBlockId || selectedBlockId || 0);
    }

    try {
      await api.post("/v1/student-groups/students/bulk-move", {
        ...payload,
        student_ids: selectedStudentIds,
        action,
      });
      toast({ title: "نجاح", description: action === "pass" ? "تم تحديث الطلاب كناجحين" : action === "fail" ? "تم تحديث الطلاب كراسبين" : action === "promote" ? "تم ترفيع الطلاب بنجاح" : "تم هبوط الطلاب بنجاح" });
      clearAcademicSelection();
      await fetchGroupMembers(selectedGroup.id);
      await fetchGroups();
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.response?.data?.message || "فشل تنفيذ العملية", variant: "destructive" });
    }
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

  // دالة حفظ التعديلات
  const handleSaveStudentChanges = async () => {
    if (!editingStudent) return;
    try {
      setIsSavingStudent(true);
      
      // إرسال التحديث لجدول Users
      await api.put(`/v1/users/${editingStudent.user_id}`, {
        full_name: editingStudent.full_name,
        email: editingStudent.email,
        phone: editingStudent.phone,
        academic_number: editingStudent.academic_number,
        gender: Number(editingStudent.gender),
        // password: ... (لا نرسلها إلا إذا تم تغييرها)
        user_type_id: 2 // Assuming 2 is student, or fetch from existing
      });

      toast({ title: "نجاح", description: "تم تحديث بيانات الطالب" });
      setIsEditStudentOpen(false);
      
      // تحديث القائمة
      if (selectedGroup) fetchGroupMembers(selectedGroup.id);

    } catch (err: any) {
        const msg = err?.response?.data?.message || "فشل تحديث البيانات";
        toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsSavingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="groups" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-1 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="groups" className="data-[state=active]:bg-primary/10">إدارة المجموعات</TabsTrigger>
        </TabsList>

        {/* --- Manage Groups Tab --- */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>1. اختر المسار الدراسي للمجموعات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={selectedDepartmentId} onValueChange={(val) => {
                  setSelectedDepartmentId(val);
                  setSelectedProgramId("");
                  setSelectedLevelId("");
                  setSelectedSemesterId("");
                  setSelectedBlockId("");
                }}><SelectTrigger><SelectValue placeholder="القسم..." /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>)}</SelectContent></Select>

                <Select value={selectedProgramId} onValueChange={(val) => {
                  setSelectedProgramId(val);
                  setSelectedLevelId("");
                  setSelectedSemesterId("");
                  setSelectedBlockId("");
                }} disabled={!programs.length}><SelectTrigger><SelectValue placeholder="البرنامج..." /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.program_id} value={String(p.program_id)}>{p.program_name}</SelectItem>)}</SelectContent></Select>

                {!selectedProgramId ? null : isSemesterProgram && !isBlockBasedProgram ? (
                  <Select value={selectedLevelId} onValueChange={setSelectedLevelId} disabled={!levels.length}><SelectTrigger><SelectValue placeholder="المستوى..." /></SelectTrigger><SelectContent>{levels.map(l => <SelectItem key={l.level_id} value={String(l.level_id)}>المستوى {l.level_number}</SelectItem>)}</SelectContent></Select>
                ) : null}

                {!selectedProgramId ? null : isSemesterProgram && !isBlockBasedProgram ? (
                  <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId} disabled={!semesters.length}><SelectTrigger><SelectValue placeholder="الترم..." /></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s.semester_id} value={String(s.semester_id)}>الترم {s.term_number}</SelectItem>)}</SelectContent></Select>
                ) : null}

                {!selectedProgramId ? null : isSemesterProgram && isBlockBasedProgram ? (
                  <Select value={selectedLevelId} onValueChange={setSelectedLevelId} disabled={!levels.length}><SelectTrigger><SelectValue placeholder="المستوى..." /></SelectTrigger><SelectContent>{levels.map(l => <SelectItem key={l.level_id} value={String(l.level_id)}>المستوى {l.level_number}</SelectItem>)}</SelectContent></Select>
                ) : null}

                {!selectedProgramId ? null : isSemesterProgram && isBlockBasedProgram ? (
                  <Select value={selectedBlockId} onValueChange={setSelectedBlockId} disabled={!blocks.length}><SelectTrigger><SelectValue placeholder="البلوك..." /></SelectTrigger><SelectContent>{blocks.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.block_name}</SelectItem>)}</SelectContent></Select>
                ) : null}

                {!selectedProgramId ? null : !isSemesterProgram && isBlockBasedProgram ? (
                  <Select value={selectedBlockId} onValueChange={setSelectedBlockId} disabled={!blocks.length}><SelectTrigger><SelectValue placeholder="البلوك..." /></SelectTrigger><SelectContent>{blocks.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.block_name}</SelectItem>)}</SelectContent></Select>
                ) : null}

                {!selectedProgramId ? null : !isSemesterProgram && !isBlockBasedProgram ? (
                  <div className="flex items-center rounded-md border border-dashed px-3 text-sm text-muted-foreground bg-muted/20">برنامج ساعات معتمدة - لا توجد مستويات/فصول</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. إدارة المجموعات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {can('groups.create') && (
                  <Input 
                    placeholder="اسم المجموعة الجديدة..." 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    disabled={!selectedProgramId || (isSemesterProgram && !isBlockBasedProgram ? !selectedLevelId || !selectedSemesterId : isSemesterProgram && isBlockBasedProgram ? !selectedLevelId || !selectedBlockId : !isSemesterProgram && isBlockBasedProgram ? !selectedBlockId : false)} 
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateGroup();
                      }
                    }}
                    className="flex-1"
                  />
                )}
                {can('groups.create') && (
                  <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">سعة المجموعة</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={groupCapacity}
                      onChange={(e) => setGroupCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-24"
                      placeholder="السعة"
                      disabled={!selectedProgramId || (isSemesterProgram && !isBlockBasedProgram ? !selectedLevelId || !selectedSemesterId : isSemesterProgram && isBlockBasedProgram ? !selectedLevelId || !selectedBlockId : !isSemesterProgram && isBlockBasedProgram ? !selectedBlockId : false)}
                    />
                  </div>
                )}
                {can('groups.create') && (
                  <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !selectedProgramId || (isSemesterProgram && !isBlockBasedProgram ? !selectedLevelId || !selectedSemesterId : isSemesterProgram && isBlockBasedProgram ? !selectedLevelId || !selectedBlockId : !isSemesterProgram && isBlockBasedProgram ? !selectedBlockId : false)}>
                    {isCreatingGroup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} إنشاء
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map(group => (
                  <Card key={group.id} onClick={() => handleSelectGroup(group)} className={cn("cursor-pointer", selectedGroup?.id === group.id && "border-primary")}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <CardTitle>{group.name}</CardTitle>
                      {(can('groups.update') || can('groups.create')) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditGroupDialog(group);
                          }}
                          aria-label="تعديل المجموعة"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                          </svg>
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Badge variant="outline">{group.studentsCount}/{group.maxSize}</Badge>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden"><div className="bg-primary h-full" style={{ width: `${(group.studentsCount / group.maxSize) * 100}%` }}></div></div>
                    </CardContent>
                  </Card>
                ))}
                {selectedProgramId && groups.length === 0 && <p className="text-muted-foreground">لا توجد مجموعات في هذا المسار داخل البرنامج. قم بإنشاء واحدة.</p>}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>تعديل المجموعة</DialogTitle>
                <DialogDescription>يمكنك تغيير اسم المجموعة وسعتها فقط.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-group-name">اسم المجموعة</Label>
                  <Input
                    id="edit-group-name"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-group-capacity">السعة</Label>
                  <Input
                    id="edit-group-capacity"
                    type="number"
                    min={1}
                    max={500}
                    value={editGroupCapacity}
                    onChange={(e) => setEditGroupCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditGroupOpen(false)} disabled={isUpdatingGroup}>إلغاء</Button>
                <Button onClick={handleUpdateGroup} disabled={isUpdatingGroup}>
                  {isUpdatingGroup && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedGroup && (
            <Card>
              <CardHeader><CardTitle>3. طلاب المجموعة: {selectedGroup.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex flex-wrap items-center gap-4 bg-muted/20">
                  <Label className="text-base font-semibold ml-2">أدوات الإضافة:</Label>
                  
                  {/* زر إضافة طالب يدوياً */}
                  {can('students.add') && (
                    <Button onClick={() => setIsAddStudentOpen(true)}>
                      <UserPlus className="w-4 h-4 ml-2" /> إضافة طالب يدوياً
                    </Button>
                  )}

                  {/* فاصل عمودي */}
                  <div className="h-8 w-px bg-border mx-2 hidden md:block"></div>

                  {/* زر استيراد CSV */}
                  {can('students.add') && (
                    <Button variant="outline" onClick={() => csvInputRef.current?.click()} disabled={isImporting}>
                      {isImporting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                      <Upload className="w-4 h-4 ml-2" /> استيراد CSV
                    </Button>
                  )}
                  <input ref={csvInputRef} type="file" className="hidden" accept=".csv" onChange={handleCsvChange} />
                </div>
                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label className="text-base font-semibold">الانتقال الأكاديمي</Label>
                    <Select value={academicAction} onValueChange={(val) => setAcademicAction(val as typeof academicAction)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="اختر العملية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="move">نقل المجموعة</SelectItem>
                        <SelectItem value="promote">ترفييع الطلاب</SelectItem>
                        <SelectItem value="demote">هبوط الطلاب</SelectItem>
                        <SelectItem value="pass">نجاح</SelectItem>
                        <SelectItem value="fail">رسوب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(academicAction === "move" || academicAction === "promote" || academicAction === "demote") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {isSemesterProgram && !isBlockBasedProgram ? (
                        <>
                          <Select value={moveTargetLevelId || selectedLevelId} onValueChange={setMoveTargetLevelId} disabled={!levels.length}>
                            <SelectTrigger><SelectValue placeholder="المستوى المستهدف" /></SelectTrigger>
                            <SelectContent>
                              {levels.map((l) => <SelectItem key={l.level_id} value={String(l.level_id)}>المستوى {l.level_number}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <Select value={moveTargetSemesterId || selectedSemesterId} onValueChange={setMoveTargetSemesterId} disabled={!semesters.length}>
                            <SelectTrigger><SelectValue placeholder="الترم المستهدف" /></SelectTrigger>
                            <SelectContent>
                              {semesters.map((s) => <SelectItem key={s.semester_id} value={String(s.semester_id)}>الترم {s.term_number}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </>
                      ) : null}

                      {isSemesterProgram && isBlockBasedProgram ? (
                        <>
                          <Select value={moveTargetLevelId || selectedLevelId} onValueChange={setMoveTargetLevelId} disabled={!levels.length}>
                            <SelectTrigger><SelectValue placeholder="المستوى المستهدف" /></SelectTrigger>
                            <SelectContent>
                              {levels.map((l) => <SelectItem key={l.level_id} value={String(l.level_id)}>المستوى {l.level_number}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <Select value={moveTargetBlockId || selectedBlockId} onValueChange={setMoveTargetBlockId} disabled={!blocks.length}>
                            <SelectTrigger><SelectValue placeholder="البلوك المستهدف" /></SelectTrigger>
                            <SelectContent>
                              {blocks.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.block_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </>
                      ) : null}

                      {!isSemesterProgram && isBlockBasedProgram ? (
                        <Select value={moveTargetBlockId || selectedBlockId} onValueChange={setMoveTargetBlockId} disabled={!blocks.length}>
                          <SelectTrigger><SelectValue placeholder="البلوك المستهدف" /></SelectTrigger>
                          <SelectContent>
                            {blocks.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.block_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleAcademicBulkAction(academicAction)}
                      disabled={!selectedGroup || (academicAction !== "move" && selectedStudentIds.length === 0)}
                    >
                      {academicAction === "move" ? "تطبيق نقل المجموعة" : academicAction === "promote" ? "تطبيق الترفيع" : academicAction === "demote" ? "تطبيق الهبوط" : academicAction === "pass" ? "تطبيق النجاح" : "تطبيق الرسوب"}
                    </Button>
                    {(selectedStudentIds.length > 0 || academicAction === "move") && (
                      <Button variant="outline" onClick={clearAcademicSelection}>مسح التحديد</Button>
                    )}
                  </div>
                </div>

                {/* شبكة عرض الطلاب */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {groupMembers.map(student => {
                    const canUpdate = can('students.update');
                    const isSelected = selectedStudentIds.includes(student.studentDbId);
                    return (
                      <Card 
                        key={student.id} 
                        className={`transition-colors relative group ${
                          canUpdate ? "cursor-pointer hover:border-primary" : "cursor-default"
                        } ${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}
                        onClick={() => {
                          if (canUpdate) {
                            handleStudentClick(student);
                          }
                        }} 
                      >
                        <div className="absolute left-2 top-2 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudentSelection(student.studentDbId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <CardContent className="p-3 text-center pt-10">
                          {can('students.delete') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                handleRemoveStudentFromGroup(student.studentDbId);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                          
                          <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <div className="font-medium text-sm truncate" title={student.name}>{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.id}</div>
                          <Badge variant="outline" className="mt-2 text-xs">{student.gender}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {groupMembers.length === 0 && <p className="text-muted-foreground col-span-full">لا يوجد طلاب في هذه المجموعة بعد.</p>}
                </div>
              </CardContent>
            </Card>
          )}
          {/* --- Dialog تعديل الطالب --- */}
          <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                <DialogDescription>
                  قم بتعديل البيانات الشخصية والأكاديمية للطالب أدناه.
                </DialogDescription>
              </DialogHeader>
              
              {isLoadingDetails ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : editingStudent ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveStudentChanges();
                  }}
                  className="grid gap-4 py-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input 
                        value={editingStudent.full_name} 
                        onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})} 
                        autoFocus 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرقم الجامعي</Label>
                      <Input 
                        value={editingStudent.academic_number} 
                        onChange={(e) => setEditingStudent({...editingStudent, academic_number: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input 
                      value={editingStudent.email} 
                      onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input 
                          value={editingStudent.phone || ''} 
                          onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})} 
                      />
                      </div>
                      <div className="space-y-2">
                          <Label>الجنس</Label>
                          <Select 
                              value={String(editingStudent.gender)} 
                              onValueChange={(val) => setEditingStudent({...editingStudent, gender: val})}
                          >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="1">ذكر</SelectItem>
                                  <SelectItem value="2">أنثى</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditStudentOpen(false)}>إلغاء</Button>
                    <Button type="submit" disabled={isSavingStudent}>
                      {isSavingStudent && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ التغييرات
                    </Button>
                  </div>
                </form>
              ) : null}
            </DialogContent>
          </Dialog>

          {/* --- Dialog إضافة طالب جديد --- */}
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد للمجموعة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الطالب الجديد ليتم إنشاء حسابه وإضافته لهذه المجموعة فوراً.
                </DialogDescription>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSingleStudent();
                }} 
                className="grid gap-4 py-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                    <Input 
                      required
                      placeholder="مثال: محمد أحمد"
                      value={newStudentData.full_name} 
                      onChange={(e) => setNewStudentData({...newStudentData, full_name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرقم الجامعي <span className="text-destructive">*</span></Label>
                    <Input 
                      required
                      placeholder="مثال: 44100232"
                      value={newStudentData.academic_number} 
                      onChange={(e) => setNewStudentData({...newStudentData, academic_number: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input 
                    type="email"
                    placeholder="student@university.edu"
                    value={newStudentData.email} 
                    onChange={(e) => setNewStudentData({...newStudentData, email: e.target.value})} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input 
                      placeholder="05xxxxxxxx"
                      value={newStudentData.phone} 
                      onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجنس</Label>
                    <Select 
                      value={newStudentData.gender} 
                      onValueChange={(val) => setNewStudentData({...newStudentData, gender: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ذكر</SelectItem>
                        <SelectItem value="2">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddStudentOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isAddingStudent}>
                    {isAddingStudent && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} إضافة الطالب
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}