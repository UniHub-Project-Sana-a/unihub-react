import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, ChevronDown, Edit2, Loader2, Plus, RefreshCw, Search, Users, UserRoundPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

type StudentPath = {
  college_id: number | null;
  college?: { college_name: string } | null;
  department_id: number | null;
  department?: { department_name: string } | null;
  program_id: number | null;
  program?: { program_name: string } | null;
  level_id: number | null;
  level?: { level_number: number } | null;
  semester_id: number | null;
  semester?: { term_number: number } | null;
  block_id: number | null;
  block?: { block_name: string; block_number: number } | null;
};

type StudentGroup = {
  group_id: number;
  group_name: string;
  college_id: number;
  college_name?: string | null;
  department_id: number;
  department_name?: string | null;
  program_id: number | null;
  program_name?: string | null;
  level_id: number | null;
  level_number?: number | null;
  semester_id: number | null;
  term_number?: number | null;
  block_id: number | null;
  block_name?: string | null;
  block_number?: number | null;
  max_students: number;
  students_count: number;
};

type CollegeOption = { college_id: number; college_name: string };
type DepartmentOption = { department_id: number; department_name: string; college_id: number };
type ProgramOption = {
  program_id: number;
  program_name: string;
  department_id: number;
  academic_system?: "semester" | "credit";
  block_based?: boolean;
};
type LevelOption = { level_id: number; level_number: number; program_id: number };
type SemesterOption = { semester_id: number; term_number: number; level_id: number };
type BlockOption = { id: number; block_name: string; block_number: number; program_id: number; level_id?: number | null };
type PathFilterKey = "college_id" | "department_id" | "program_id" | "level_id" | "semester_id" | "block_id";
type PathFilters = Record<PathFilterKey, string[]>;
type PathOption = { value: string; label: string };

type Student = StudentPath & {
  student_id: number;
  status: boolean;
  user?: {
    full_name?: string | null;
    academic_number?: string | null;
    email?: string | null;
    phone?: string | null;
    gender?: number | string | null;
  } | null;
  groups?: StudentGroup[];
};

const dependentPathFilterKeys: Partial<Record<PathFilterKey, PathFilterKey[]>> = {
  college_id: ["department_id", "program_id", "level_id", "semester_id", "block_id"],
  department_id: ["program_id", "level_id", "semester_id", "block_id"],
  program_id: ["level_id", "semester_id", "block_id"],
  level_id: ["semester_id", "block_id"],
};

const emptyPathFilters: PathFilters = {
  college_id: [],
  department_id: [],
  program_id: [],
  level_id: [],
  semester_id: [],
  block_id: [],
};

function matchesPathFilters(record: Partial<Record<PathFilterKey, number | null>>, filters: PathFilters) {
  return (Object.keys(filters) as PathFilterKey[]).every((key) =>
    filters[key].length === 0 || filters[key].includes(String(record[key] ?? "")),
  );
}

function MultiSelectFilter({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: PathOption[];
  onChange: (values: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const toggleValue = (value: string, checked: boolean) => {
    onChange(checked ? [...new Set([...values, value])] : values.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">
              {values.length === 0 ? `اختر ${label}` : `تم اختيار ${values.length} من ${label}`}
            </span>
            <ChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`ابحث في ${label}...`}
            className="mb-2"
          />
          <div className="mb-2 flex justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(options.map((option) => option.value))}>
              تحديد الكل
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
              مسح
            </Button>
          </div>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent">
                <Checkbox
                  checked={values.includes(option.value)}
                  onCheckedChange={(checked) => toggleValue(option.value, checked === true)}
                />
                <span className="flex-1">{option.label}</span>
                {values.includes(option.value) && <Check className="h-4 w-4 text-primary" />}
              </label>
            ))}
            {filteredOptions.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">لا توجد قيم مطابقة</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const responseRows = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
    return data.data as T[];
  }
  return [];
};

const groupPathLabel = (group: StudentGroup) => {
  const parts = [
    group.college_name || `كلية #${group.college_id}`,
    group.department_name || `قسم #${group.department_id}`,
    group.program_name || (group.program_id ? `برنامج #${group.program_id}` : "بدون برنامج"),
  ];
  if (group.level_id) parts.push(`المستوى ${group.level_number ?? group.level_id}`);
  if (group.semester_id) parts.push(`الفصل ${group.term_number ?? group.semester_id}`);
  if (group.block_id) parts.push(group.block_name || `بلوك ${group.block_number ?? group.block_id}`);
  return parts.join(" / ");
};

function StudentsGroupsContent() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [pathFilters, setPathFilters] = useState<PathFilters>(emptyPathFilters);
  const [appliedPathFilters, setAppliedPathFilters] = useState<PathFilters>(emptyPathFilters);
  const [genderFilter, setGenderFilter] = useState("all");
  const [appliedGenderFilter, setAppliedGenderFilter] = useState("all");
  const [isQuickGroupFormOpen, setIsQuickGroupFormOpen] = useState(false);
  const [quickGroupName, setQuickGroupName] = useState("");
  const [quickGroupCapacity, setQuickGroupCapacity] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreatingQuickGroup, setIsCreatingQuickGroup] = useState(false);
  const [editingGroupModal, setEditingGroupModal] = useState<StudentGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupCapacity, setEditGroupCapacity] = useState("");
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState<boolean>(false);
  const [transferModalStudent, setTransferModalStudent] = useState<Student | null>(null);
  const [transferModalTargetGroupId, setTransferModalTargetGroupId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsResponse, groupsResponse, collegesResponse, departmentsResponse, programsResponse, levelsResponse, semestersResponse, blocksResponse] = await Promise.all([
        api.get("/v1/students", { params: { all: true } }),
        api.get("/v1/student-groups", { params: { all: true, with_counts: 1 } }),
        api.get("/v1/colleges"),
        api.get("/v1/departments"),
        api.get("/v1/programs"),
        api.get("/v1/levels"),
        api.get("/v1/semesters"),
        api.get("/v1/blocks"),
      ]);
      setStudents(responseRows<Student>(studentsResponse.data));
      setGroups(responseRows<StudentGroup>(groupsResponse.data));
      setColleges(responseRows<CollegeOption>(collegesResponse.data));
      setDepartments(responseRows<DepartmentOption>(departmentsResponse.data));
      setPrograms(responseRows<ProgramOption>(programsResponse.data));
      setLevels(responseRows<LevelOption>(levelsResponse.data));
      setSemesters(responseRows<SemesterOption>(semestersResponse.data));
      setBlocks(responseRows<BlockOption>(blocksResponse.data));
      setSelectedIds([]);
      setSelectedGroupId("");
    } catch (error) {
      toast({
        title: "تعذر تحميل بيانات الطلاب",
        description: getApiErrorMessage(error, "تحقق من الاتصال ثم أعد المحاولة."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unassignedStudents = useMemo(
    () => students.filter((student) => !student.groups?.length),
    [students],
  );
  const groupOptions = useMemo(
    () => groups.filter((group) => matchesPathFilters(group, appliedPathFilters)),
    [appliedPathFilters, groups],
  );
  const selectedGroup = groups.find((group) => String(group.group_id) === selectedGroupId);
  const visibleStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return students.filter((student) => {
      if (!matchesPathFilters(student, appliedPathFilters)) return false;
      if (appliedGenderFilter !== "all" && String(student.user?.gender ?? "") !== appliedGenderFilter) return false;
      const groupNames = (student.groups ?? []).map((g) => g.group_name).join(" ");
      const searchable = [
        student.user?.full_name,
        student.user?.academic_number,
        student.user?.email,
        student.user?.phone,
        groupNames,
        student.college?.college_name,
        student.department?.department_name,
        student.program?.program_name,
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [appliedGenderFilter, appliedPathFilters, search, students]);

  const toggleStudent = (studentId: number, checked: boolean) => {
    setSelectedIds((previous) =>
      checked ? [...new Set([...previous, studentId])] : previous.filter((id) => id !== studentId),
    );
    setSelectedGroupId("");
  };

  const toggleVisibleStudents = (checked: boolean) => {
    setSelectedIds((previous) => {
      const visibleIds = visibleStudents.map((student) => student.student_id);
      return checked
        ? [...new Set([...previous, ...visibleIds])]
        : previous.filter((id) => !visibleIds.includes(id));
    });
    setSelectedGroupId("");
  };

  const setPathFilter = (key: PathFilterKey, values: string[]) => {
    setPathFilters((previous) => {
      const next = { ...previous, [key]: values };
      dependentPathFilterKeys[key]?.forEach((dependentKey) => {
        next[dependentKey] = [];
      });
      return next;
    });
    setSelectedIds([]);
    setSelectedGroupId("");
  };

  const applyPathFilters = () => {
    setAppliedPathFilters({ ...pathFilters });
    setAppliedGenderFilter(genderFilter);
    setSelectedIds([]);
    setSelectedGroupId("");
  };

  const createQuickGroup = async () => {
    const singleValue = (key: PathFilterKey) => pathFilters[key].length === 1 ? Number(pathFilters[key][0]) : null;
    const collegeId = singleValue("college_id");
    const departmentId = singleValue("department_id");
    const programId = singleValue("program_id");
    const levelId = singleValue("level_id");
    const semesterId = singleValue("semester_id");
    const blockId = singleValue("block_id");
    const program = programs.find((item) => item.program_id === programId);
    const needsLevel = program?.academic_system === "semester";
    const needsSemester = needsLevel && !program?.block_based;
    const needsBlock = Boolean(program?.block_based);

    if (!collegeId || !departmentId || !programId || !program) {
      toast({
        title: "المسار غير مكتمل",
        description: "لإنشاء مجموعة سريعة، اختر قيمة واحدة للكلية والقسم والبرنامج.",
        variant: "destructive",
      });
      return;
    }
    const department = departments.find((item) => item.department_id === departmentId);
    if (department && department.college_id !== collegeId) {
      toast({
        title: "المسار غير متطابق",
        description: "القسم المحدد لا يتبع الكلية المختارة.",
        variant: "destructive",
      });
      return;
    }
    if (program.department_id !== departmentId) {
      toast({
        title: "المسار غير متطابق",
        description: "البرنامج المحدد لا يتبع القسم المختار.",
        variant: "destructive",
      });
      return;
    }
    if ((needsLevel && !levelId) || (needsSemester && !semesterId) || (needsBlock && !blockId)) {
      toast({
        title: "المسار غير مكتمل",
        description: "اختر مستوى وفصل أو بلوك المسار حسب نظام البرنامج قبل إنشاء المجموعة.",
        variant: "destructive",
      });
      return;
    }
    if ((Object.values(pathFilters) as string[][]).some((values) => values.length > 1)) {
      toast({
        title: "اختر مسارًا واحدًا",
        description: "إنشاء المجموعة يتطلب اختيار قيمة واحدة فقط لكل فلتر مستخدم في المسار.",
        variant: "destructive",
      });
      return;
    }

    const capacity = Number(quickGroupCapacity);
    if (!quickGroupName.trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      toast({
        title: "بيانات المجموعة غير مكتملة",
        description: "أدخل اسمًا للمجموعة وسعة صحيحة بين 1 و500.",
        variant: "destructive",
      });
      return;
    }

    const payload: Record<string, number | string> = {
      college_id: collegeId,
      department_id: departmentId,
      program_id: programId,
      group_name: quickGroupName.trim(),
      max_students: capacity,
    };
    if (needsLevel && levelId) payload.level_id = levelId;
    if (needsSemester && semesterId) payload.semester_id = semesterId;
    if (needsBlock && blockId) payload.block_id = blockId;

    setIsCreatingQuickGroup(true);
    try {
      const response = await api.post("/v1/student-groups", payload);
      const groupId = Number(response.data?.group_id ?? response.data?.group?.group_id);
      if (!groupId) throw new Error("تم إنشاء المجموعة لكن لم يُرجع الخادم رقمها.");

      const groupsResponse = await api.get("/v1/student-groups", { params: { all: "true", with_counts: 1 } });
      setGroups(responseRows<StudentGroup>(groupsResponse.data));
      setAppliedPathFilters({ ...pathFilters });
      setAppliedGenderFilter(genderFilter);
      setSelectedGroupId(String(groupId));
      setQuickGroupName("");
      setIsQuickGroupFormOpen(false);
      toast({
        title: "تم إنشاء المجموعة",
        description: selectedIds.length
          ? "تم تحديد المجموعة الجديدة. اضغط «إسناد الطلاب المحددين» لإضافة الطلاب إليها."
          : "يمكنك الآن تحديد الطلاب وإسنادهم إلى المجموعة الجديدة.",
      });
    } catch (error) {
      toast({
        title: "تعذر إنشاء المجموعة",
        description: getApiErrorMessage(error, "تحقق من بيانات المسار واسم المجموعة."),
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuickGroup(false);
    }
  };

  const openEditGroupModal = (group: StudentGroup) => {
    setEditingGroupModal(group);
    setEditGroupName(group.group_name);
    setEditGroupCapacity(String(group.max_students));
  };

  const handleUpdateGroup = async () => {
    if (!editingGroupModal) return;
    const trimmed = editGroupName.trim();
    const capacityVal = Number(editGroupCapacity);

    if (!trimmed) {
      toast({ title: "تنبيه", description: "اسم المجموعة مطلوب", variant: "destructive" });
      return;
    }
    if (!Number.isInteger(capacityVal) || capacityVal < 1 || capacityVal > 500) {
      toast({ title: "تنبيه", description: "أدخل سعة صحيحة بين 1 و 500", variant: "destructive" });
      return;
    }

    setIsUpdatingGroup(true);
    try {
      const res = await api.put(`/v1/student-groups/${editingGroupModal.group_id}`, {
        group_name: trimmed,
        max_students: capacityVal,
      });
      toast({ title: "نجاح", description: "تم تحديث بيانات وسعة المجموعة بنجاح" });

      const updatedGroupData = res.data?.group;
      setGroups((prev) =>
        prev.map((g) =>
          g.group_id === editingGroupModal.group_id
            ? {
                ...g,
                group_name: trimmed,
                max_students: capacityVal,
                ...(updatedGroupData?.students_count !== undefined
                  ? { students_count: Number(updatedGroupData.students_count) }
                  : {}),
              }
            : g
        )
      );
      setEditingGroupModal(null);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.response?.data?.message || getApiErrorMessage(error, "فشل تحديث المجموعة"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const assignStudents = async (expandCapacity = false) => {
    if (!selectedGroup || selectedIds.length === 0) return;
    setIsAssigning(true);
    try {
      const response = await api.post("/v1/student-groups/assign-students", {
        group_id: selectedGroup.group_id,
        student_ids: selectedIds,
        expand_capacity: expandCapacity ? 1 : 0,
      });
      toast({
        title: "تم إسناد الطلاب",
        description: response.data?.message || `تم إسناد ${selectedIds.length} طالبًا إلى ${selectedGroup.group_name}.`,
      });
      await loadData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || getApiErrorMessage(error, "تعذر إسناد الطلاب إلى المجموعة المحددة.");
      toast({
        title: "تعذر إسناد الطلاب",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTransferSelected = async (expandCapacity = false) => {
    if (!selectedGroup || selectedIds.length === 0) return;
    setIsTransferring(true);
    try {
      const response = await api.post("/v1/student-groups/transfer-students", {
        to_group_id: selectedGroup.group_id,
        student_ids: selectedIds,
        expand_capacity: expandCapacity ? 1 : 0,
      });
      toast({
        title: "تم نقل الطلاب بنجاح",
        description: response.data?.message || `تم نقل ${selectedIds.length} طالبًا إلى ${selectedGroup.group_name}.`,
      });
      setSelectedIds([]);
      await loadData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || getApiErrorMessage(error, "تعذر نقل الطلاب إلى المجموعة المحددة.");
      toast({
        title: "تعذر نقل الطلاب",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferSingleStudent = async (expandCapacity = false) => {
    if (!transferModalStudent || !transferModalTargetGroupId) return;
    setIsTransferring(true);
    try {
      const fromGroupId = transferModalStudent.groups?.[0]?.group_id;
      const response = await api.post("/v1/student-groups/transfer-students", {
        to_group_id: Number(transferModalTargetGroupId),
        from_group_id: fromGroupId,
        student_ids: [transferModalStudent.student_id],
        expand_capacity: expandCapacity ? 1 : 0,
      });
      toast({
        title: "تم نقل الطالب بنجاح",
        description: response.data?.message || "تم نقل الطالب إلى المجموعة المحددة.",
      });
      setTransferModalStudent(null);
      setTransferModalTargetGroupId("");
      await loadData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || getApiErrorMessage(error, "تعذر نقل الطالب إلى المجموعة المحددة.");
      toast({
        title: "تعذر نقل الطالب",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const allVisibleSelected = visibleStudents.length > 0 &&
    visibleStudents.every((student) => selectedIds.includes(student.student_id));

  const collegeOptions = colleges.map((item) => ({ value: String(item.college_id), label: item.college_name }));
  const selectedCollegeIds = pathFilters.college_id.map(Number);
  const selectedDepartmentIds = pathFilters.department_id.map(Number);
  const selectedProgramIds = pathFilters.program_id.map(Number);
  const selectedLevelIds = pathFilters.level_id.map(Number);
  const availableDepartments = selectedCollegeIds.length
    ? departments.filter((item) => selectedCollegeIds.includes(item.college_id))
    : departments;
  const availableDepartmentIds = selectedDepartmentIds.length
    ? selectedDepartmentIds
    : selectedCollegeIds.length
      ? availableDepartments.map((item) => item.department_id)
      : [];
  const isDepartmentScoped = selectedDepartmentIds.length > 0 || selectedCollegeIds.length > 0;
  const availablePrograms = isDepartmentScoped
    ? programs.filter((item) => availableDepartmentIds.includes(item.department_id))
    : programs;
  const availableProgramIds = selectedProgramIds.length
    ? selectedProgramIds
    : isDepartmentScoped || selectedProgramIds.length
      ? availablePrograms.map((item) => item.program_id)
      : [];
  const isProgramScoped = isDepartmentScoped || selectedProgramIds.length > 0;
  const availableLevels = isProgramScoped
    ? levels.filter((item) => availableProgramIds.includes(item.program_id))
    : levels;
  const availableLevelIds = selectedLevelIds.length
    ? selectedLevelIds
    : isProgramScoped || selectedLevelIds.length
      ? availableLevels.map((item) => item.level_id)
      : [];
  const isLevelScoped = isProgramScoped || selectedLevelIds.length > 0;
  const availableSemesters = isLevelScoped
    ? semesters.filter((item) => availableLevelIds.includes(item.level_id))
    : semesters;
  const availableBlocks = blocks.filter((item) => {
    if (isProgramScoped && !availableProgramIds.includes(item.program_id)) return false;
    return !isLevelScoped || item.level_id == null || availableLevelIds.includes(item.level_id);
  });
  const departmentOptions = availableDepartments.map((item) => ({ value: String(item.department_id), label: item.department_name }));
  const programOptions = availablePrograms.map((item) => ({ value: String(item.program_id), label: item.program_name }));
  const levelOptions = availableLevels.map((item) => {
    const program = programs.find((candidate) => candidate.program_id === item.program_id);
    return { value: String(item.level_id), label: `المستوى ${item.level_number}${program ? ` - ${program.program_name}` : ""}` };
  });
  const semesterOptions = availableSemesters.map((item) => {
    const level = levels.find((candidate) => candidate.level_id === item.level_id);
    const program = programs.find((candidate) => candidate.program_id === level?.program_id);
    return { value: String(item.semester_id), label: `الفصل ${item.term_number}${program ? ` - ${program.program_name}` : ""}` };
  });
  const blockOptions = availableBlocks.map((item) => {
    const program = programs.find((candidate) => candidate.program_id === item.program_id);
    return { value: String(item.id), label: `${item.block_name}${program ? ` - ${program.program_name}` : ""}` };
  });

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة مجموعات الطلاب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عرض جميع طلاب الجامعة، تصفيتهم حسب المسار الدراسي، وإسناد الطالب إلى مجموعة أو مجموعات متعددة.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={isLoading || isAssigning}>
          <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          تحديث البيانات
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي الطلاب</p><p className="mt-1 text-2xl font-bold">{students.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">طلاب ضمن مجموعة</p><p className="mt-1 text-2xl font-bold">{students.length - unassignedStudents.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">طلاب بلا مجموعة</p><p className="mt-1 text-2xl font-bold">{unassignedStudents.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فلترة الطلاب حسب المسار الدراسي</CardTitle>
          <p className="text-sm text-muted-foreground">يمكن تحديد عدة قيم. لا تتغير النتائج حتى تضغط على زر تطبيق الفلاتر.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MultiSelectFilter label="الكليات" values={pathFilters.college_id} options={collegeOptions} onChange={(values) => setPathFilter("college_id", values)} />
            <MultiSelectFilter label="الأقسام" values={pathFilters.department_id} options={departmentOptions} onChange={(values) => setPathFilter("department_id", values)} />
            <MultiSelectFilter label="البرامج" values={pathFilters.program_id} options={programOptions} onChange={(values) => setPathFilter("program_id", values)} />
            <MultiSelectFilter label="المستويات" values={pathFilters.level_id} options={levelOptions} onChange={(values) => setPathFilter("level_id", values)} />
            <MultiSelectFilter label="الفصول / الأترام" values={pathFilters.semester_id} options={semesterOptions} onChange={(values) => setPathFilter("semester_id", values)} />
            <MultiSelectFilter label="البلوكات" values={pathFilters.block_id} options={blockOptions} onChange={(values) => setPathFilter("block_id", values)} />
            <div className="space-y-2">
              <span className="text-sm font-medium">الجنس</span>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="1">ذكر</SelectItem>
                  <SelectItem value="0">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={applyPathFilters} disabled={isLoading}>
              تطبيق الفلاتر
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPathFilters({ ...emptyPathFilters });
                setAppliedPathFilters({ ...emptyPathFilters });
                setGenderFilter("all");
                setAppliedGenderFilter("all");
                setSelectedIds([]);
                setSelectedGroupId("");
              }}
            >
              مسح الفلاتر
            </Button>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              النتائج: {visibleStudents.length}
            </span>
          </div>
          <div className="border-t pt-4">
            {!isQuickGroupFormOpen ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickGroupFormOpen(true)}
                disabled={isCreatingQuickGroup}
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء مجموعة سريعة للمسار المحدد
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">إنشاء مجموعة في المسار المحدد</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    اختر قيمة واحدة للكلية والقسم والبرنامج، وأكمل المستوى والفصل أو البلوك حسب نظام البرنامج.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto]">
                  <Input
                    value={quickGroupName}
                    onChange={(event) => setQuickGroupName(event.target.value)}
                    placeholder="اسم المجموعة الجديدة"
                    maxLength={100}
                    disabled={isCreatingQuickGroup}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={quickGroupCapacity}
                    onChange={(event) => setQuickGroupCapacity(event.target.value)}
                    placeholder="السعة"
                    aria-label="سعة المجموعة"
                    disabled={isCreatingQuickGroup}
                  />
                  <Button onClick={() => void createQuickGroup()} disabled={isCreatingQuickGroup}>
                    {isCreatingQuickGroup ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
                    إنشاء
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsQuickGroupFormOpen(false)} disabled={isCreatingQuickGroup}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">قائمة الطلاب</CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                {visibleStudents.length} من {students.length}
              </Badge>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث بالاسم، الرقم، البريد، المجموعة..."
                className="pr-9 pl-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />جاري تحميل الطلاب...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleVisibleStudents(checked === true)} aria-label="تحديد الطلاب الظاهرين" />
                    </TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>المسار الدراسي</TableHead>
                    <TableHead>المجموعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStudents.map((student) => {
                    const assignedGroups = (student.groups ?? []).filter((group) =>
                      matchesPathFilters(group, appliedPathFilters),
                    );
                    const pathLabel = [
                      student.college?.college_name,
                      student.department?.department_name,
                      student.program?.program_name,
                      student.level?.level_number ? `المستوى ${student.level.level_number}` : null,
                      student.semester?.term_number ? `الفصل ${student.semester.term_number}` : null,
                      student.block?.block_name,
                    ].filter(Boolean).join(" / ");
                    return (
                      <TableRow key={student.student_id} className={!assignedGroups.length ? "border-r-2 border-r-red-500 bg-red-50/40" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(student.student_id)}
                            onCheckedChange={(checked) => toggleStudent(student.student_id, checked === true)}
                            aria-label={`تحديد ${student.user?.full_name ?? "الطالب"}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.user?.full_name || `طالب #${student.student_id}`}</div>
                          <div className="text-xs text-muted-foreground">{student.user?.academic_number || student.user?.email || "لا يوجد رقم جامعي"}</div>
                        </TableCell>
                        <TableCell className="min-w-52 text-xs text-muted-foreground">
                          {pathLabel || `كلية #${student.college_id ?? "—"} / قسم #${student.department_id ?? "—"} / برنامج #${student.program_id ?? "—"}`}
                        </TableCell>
                        <TableCell>
                          {assignedGroups.length ? (
                            <div className="space-y-1">
                              {assignedGroups.map((group) => (
                                <div key={group.group_id} className="flex items-center justify-between gap-2">
                                  <div>
                                    <Badge variant="secondary">{group.group_name}</Badge>
                                    <div className="mt-1 max-w-xs text-[11px] text-muted-foreground">{groupPathLabel(group)}</div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1"
                                    onClick={() => {
                                      setTransferModalStudent(student);
                                      setTransferModalTargetGroupId("");
                                    }}
                                  >
                                    <ArrowLeftRight className="h-3 w-3" />
                                    نقل
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline">غير مسند</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                                onClick={() => {
                                  setTransferModalStudent(student);
                                  setTransferModalTargetGroupId("");
                                }}
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                                إسناد/نقل
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!visibleStudents.length && (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">لا توجد نتائج مطابقة.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {isTransferMode ? <ArrowLeftRight className="h-5 w-5 text-blue-600" /> : <UserRoundPlus className="h-5 w-5 text-primary" />}
              {isTransferMode ? "نقل الطلاب المحددين" : "إسناد إلى مجموعة"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span>الطلاب المحددون:</span>
              <strong className="text-base text-primary">{selectedIds.length}</strong>
            </div>

            {/* وضع النقل أو الإسناد */}
            <div className="rounded-lg p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="transfer-mode-check"
                  checked={isTransferMode}
                  onCheckedChange={(c) => setIsTransferMode(c === true)}
                />
                <Label htmlFor="transfer-mode-check" className="text-xs font-semibold cursor-pointer text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  وضع النقل (استبدال المجموعة السابقة)
                </Label>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 pr-6">
                عند التفعيل، سيتم إخراج الطلاب المحددين من مجموعاتهم السابقة ونقلهم مباشرة للمجموعة المختارة.
              </p>
            </div>

            <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={!selectedIds.length || isAssigning || isTransferring}>
              <SelectTrigger><SelectValue placeholder="حدد الطلاب أولًا ثم اختر المجموعة" /></SelectTrigger>
              <SelectContent>
                {groupOptions.map((group) => (
                  <SelectItem key={group.group_id} value={String(group.group_id)}>
                    {group.group_name} ({group.students_count}/{group.max_students}) — {groupPathLabel(group)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGroup && (() => {
              const remaining = Math.max(0, selectedGroup.max_students - selectedGroup.students_count);
              const isOverCapacity = selectedIds.length > remaining;
              const neededCapacity = selectedGroup.students_count + selectedIds.length;

              return (
                <div className="rounded-lg border p-3 text-xs space-y-2.5 bg-card/60">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{selectedGroup.group_name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={() => openEditGroupModal(selectedGroup)}
                    >
                      <Edit2 className="h-3 w-3" />
                      تعديل السعة
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{groupPathLabel(selectedGroup)}</p>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t text-[11px] text-center">
                    <div className="rounded bg-muted/40 p-1.5">
                      <span className="block text-muted-foreground text-[10px]">السعة الكلية</span>
                      <span className="font-bold text-xs">{selectedGroup.max_students}</span>
                    </div>
                    <div className="rounded bg-muted/40 p-1.5">
                      <span className="block text-muted-foreground text-[10px]">الطلاب المسندون</span>
                      <span className="font-bold text-xs">{selectedGroup.students_count}</span>
                    </div>
                    <div className="rounded bg-muted/40 p-1.5">
                      <span className="block text-muted-foreground text-[10px]">السعة المتبقية</span>
                      <span className={`font-bold text-xs ${isOverCapacity ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {remaining}
                      </span>
                    </div>
                  </div>

                  {isOverCapacity && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-2.5 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-2">
                      <p className="leading-tight">
                        ⚠️ عدد الطلاب المحددين ({selectedIds.length}) يتجاوز السعة المتبقية ({remaining}).
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => isTransferMode ? void handleTransferSelected(true) : void assignStudents(true)}
                        disabled={isAssigning || isTransferring}
                      >
                        زيادة السعة تلقائياً إلى {neededCapacity} و{isTransferMode ? "نقل" : "إسناد"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
            <Button
              className="w-full gap-2"
              onClick={() => isTransferMode ? void handleTransferSelected(false) : void assignStudents(false)}
              disabled={!selectedGroup || !selectedIds.length || isAssigning || isTransferring}
            >
              {(isAssigning || isTransferring) ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : isTransferMode ? (
                <ArrowLeftRight className="ml-2 h-4 w-4" />
              ) : (
                <UserRoundPlus className="ml-2 h-4 w-4" />
              )}
              {isTransferMode ? "نقل الطلاب واستبدال المجموعة" : "إسناد الطلاب المحددين"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* مودال نقل طالب فردي إلى مجموعة أخرى */}
      <Dialog open={Boolean(transferModalStudent)} onOpenChange={(open) => !open && setTransferModalStudent(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              نقل الطالب إلى مجموعة أخرى
            </DialogTitle>
            <DialogDescription>
              نقل الطالب واستبدال مجموعته السابقة بمجموعة جديدة مباشرة.
            </DialogDescription>
          </DialogHeader>

          {transferModalStudent && (() => {
            const currentGroups = transferModalStudent.groups ?? [];
            const targetGroupObj = groups.find(g => String(g.group_id) === transferModalTargetGroupId);
            const remaining = targetGroupObj ? Math.max(0, targetGroupObj.max_students - targetGroupObj.students_count) : null;
            const isFull = remaining !== null && remaining <= 0;

            return (
              <div className="space-y-4 py-3">
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-semibold">{transferModalStudent.user?.full_name || `طالب #${transferModalStudent.student_id}`}</p>
                  <p className="text-xs text-muted-foreground">{transferModalStudent.user?.academic_number || transferModalStudent.user?.email || "لا يوجد رقم جامعي"}</p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-muted-foreground">المجموعة الحالية:</span>
                    {currentGroups.length ? (
                      currentGroups.map(g => <Badge key={g.group_id} variant="secondary">{g.group_name}</Badge>)
                    ) : (
                      <Badge variant="outline">غير مسند</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المجموعة الهدف المراد النقل إليها</Label>
                  <Select
                    value={transferModalTargetGroupId}
                    onValueChange={setTransferModalTargetGroupId}
                    disabled={isTransferring}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المجموعة الهدف..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((group) => (
                        <SelectItem key={group.group_id} value={String(group.group_id)}>
                          {group.group_name} ({group.students_count}/{group.max_students}) — {groupPathLabel(group)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isFull && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-2.5 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                    ⚠️ هذه المجموعة ممتلئة ({targetGroupObj?.students_count}/{targetGroupObj?.max_students}). سيتم زيادة سعتها تلقائياً عند التأكيد.
                  </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTransferModalStudent(null)}
                    disabled={isTransferring}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleTransferSingleStudent(Boolean(isFull))}
                    disabled={!transferModalTargetGroupId || isTransferring}
                    className="gap-2"
                  >
                    {isTransferring ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="ml-2 h-4 w-4" />}
                    تأكيد نقل الطالب
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* مودال تعديل سعة واسم المجموعة */}
      <Dialog open={Boolean(editingGroupModal)} onOpenChange={(open) => !open && setEditingGroupModal(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المجموعة</DialogTitle>
            <DialogDescription>
              تعديل اسم المجموعة وسعتها الاستيعابية للطلاب.
            </DialogDescription>
          </DialogHeader>

          {editingGroupModal && (
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="edit-modal-group-name">اسم المجموعة</Label>
                <Input
                  id="edit-modal-group-name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="مثال: مجموعة A"
                  maxLength={100}
                  disabled={isUpdatingGroup}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-modal-group-capacity">سعة المجموعة (الحد الأقصى للطلاب)</Label>
                <Input
                  id="edit-modal-group-capacity"
                  type="number"
                  min={1}
                  max={500}
                  value={editGroupCapacity}
                  onChange={(e) => setEditGroupCapacity(e.target.value)}
                  placeholder="السعة"
                  disabled={isUpdatingGroup}
                />
                <p className="text-xs text-muted-foreground">
                  الطلاب المسندون حالياً في هذه المجموعة: {editingGroupModal.students_count} طالب.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingGroupModal(null)}
              disabled={isUpdatingGroup}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => void handleUpdateGroup()}
              disabled={isUpdatingGroup}
            >
              {isUpdatingGroup ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentsGroupsPage() {
  return (
    <AdminLayout>
      <StudentsGroupsContent />
    </AdminLayout>
  );
}
