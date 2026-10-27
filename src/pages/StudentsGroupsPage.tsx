import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, Users, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

type Student = StudentPath & {
  student_id: number;
  status: boolean;
  user?: {
    full_name?: string | null;
    academic_number?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  groups?: StudentGroup[];
};

const responseRows = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
    return data.data as T[];
  }
  return [];
};

const sameNullableId = (left: number | null, right: number | null) =>
  left == null ? right == null : right != null && Number(left) === Number(right);

const samePathRoot = (student: Student, group: StudentGroup) =>
  sameNullableId(student.college_id, group.college_id) &&
  sameNullableId(student.department_id, group.department_id) &&
  Number(student.program_id ?? 0) === Number(group.program_id ?? 0);

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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsResponse, groupsResponse] = await Promise.all([
        api.get("/v1/students", { params: { all: true } }),
        api.get("/v1/student-groups", { params: { all: true, with_counts: 1 } }),
      ]);
      setStudents(responseRows<Student>(studentsResponse.data));
      setGroups(responseRows<StudentGroup>(groupsResponse.data));
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
  const selectedStudents = useMemo(
    () => unassignedStudents.filter((student) => selectedIds.includes(student.student_id)),
    [selectedIds, unassignedStudents],
  );
  const compatibleGroups = useMemo(() => {
    if (selectedStudents.length === 0) return [];
    const first = selectedStudents[0];
    if (!selectedStudents.every((student) =>
      sameNullableId(student.college_id, first.college_id) &&
      sameNullableId(student.department_id, first.department_id) &&
      Number(student.program_id ?? 0) === Number(first.program_id ?? 0)
    )) return [];
    return groups.filter((group) => samePathRoot(first, group));
  }, [groups, selectedStudents]);
  const selectedGroup = groups.find((group) => String(group.group_id) === selectedGroupId);
  const visibleStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const list = students.filter((student) => {
      if (!normalizedSearch) return true;
      const searchable = [
        student.user?.full_name,
        student.user?.academic_number,
        student.user?.email,
        student.user?.phone,
        student.college?.college_name,
        student.department?.department_name,
        student.program?.program_name,
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      return searchable.includes(normalizedSearch);
    });
    return list;
  }, [search, students]);
  const visibleUnassignedStudents = visibleStudents.filter((student) => !student.groups?.length);

  const toggleStudent = (studentId: number, checked: boolean) => {
    setSelectedIds((previous) =>
      checked ? [...new Set([...previous, studentId])] : previous.filter((id) => id !== studentId),
    );
    setSelectedGroupId("");
  };

  const toggleVisibleStudents = (checked: boolean) => {
    setSelectedIds((previous) => {
      const visibleIds = visibleUnassignedStudents.map((student) => student.student_id);
      return checked
        ? [...new Set([...previous, ...visibleIds])]
        : previous.filter((id) => !visibleIds.includes(id));
    });
    setSelectedGroupId("");
  };

  const assignStudents = async () => {
    if (!selectedGroup || selectedIds.length === 0) return;
    setIsAssigning(true);
    try {
      const response = await api.post("/v1/student-groups/assign-students", {
        group_id: selectedGroup.group_id,
        student_ids: selectedIds,
      });
      toast({
        title: "تم إسناد الطلاب",
        description: response.data?.message || `تم إسناد ${selectedIds.length} طالبًا إلى ${selectedGroup.group_name}.`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "تعذر إسناد الطلاب",
        description: getApiErrorMessage(error, "تعذر إسناد الطلاب إلى المجموعة المحددة."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const allVisibleSelected = visibleUnassignedStudents.length > 0 &&
    visibleUnassignedStudents.every((student) => selectedIds.includes(student.student_id));

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة مجموعات الطلاب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عرض الطلاب المسجلين وإسناد الطلاب غير المرتبطين بمجموعة إلى مجموعة ضمن مسارهم الدراسي.
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" />قائمة الطلاب</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو الرقم الجامعي" className="pr-9" />
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
                      <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleVisibleStudents(checked === true)} aria-label="تحديد الطلاب الظاهرين غير المسندين" />
                    </TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>المسار الدراسي</TableHead>
                    <TableHead>المجموعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStudents.map((student) => {
                    const assignedGroups = student.groups ?? [];
                    const pathLabel = [
                      student.college?.college_name,
                      student.department?.department_name,
                      student.program?.program_name,
                      student.level?.level_number ? `المستوى ${student.level.level_number}` : null,
                      student.semester?.term_number ? `الفصل ${student.semester.term_number}` : null,
                      student.block?.block_name,
                    ].filter(Boolean).join(" / ");
                    return (
                      <TableRow key={student.student_id}>
                        <TableCell>
                          {!assignedGroups.length && (
                            <Checkbox
                              checked={selectedIds.includes(student.student_id)}
                              onCheckedChange={(checked) => toggleStudent(student.student_id, checked === true)}
                              aria-label={`تحديد ${student.user?.full_name ?? "الطالب"}`}
                            />
                          )}
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
                                <div key={group.group_id}>
                                  <Badge variant="secondary">{group.group_name}</Badge>
                                  <div className="mt-1 max-w-xs text-[11px] text-muted-foreground">{groupPathLabel(group)}</div>
                                </div>
                              ))}
                            </div>
                          ) : <Badge variant="outline">غير مسند</Badge>}
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
            <CardTitle className="flex items-center gap-2 text-lg"><UserRoundPlus className="h-5 w-5" />إسناد إلى مجموعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              الطلاب المحددون: <strong>{selectedIds.length}</strong>
            </div>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={!selectedIds.length || isAssigning}>
              <SelectTrigger><SelectValue placeholder="حدد الطلاب أولًا ثم اختر المجموعة" /></SelectTrigger>
              <SelectContent>
                {compatibleGroups.map((group) => (
                  <SelectItem key={group.group_id} value={String(group.group_id)}>
                    {group.group_name} — {groupPathLabel(group)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudents.length > 0 && compatibleGroups.length === 0 && (
              <p className="text-xs text-destructive">
                لا توجد مجموعة متوافقة. يجب أن يكون الطلاب المحددون من الكلية والقسم والبرنامج نفسه، وتوجد مجموعة فعالة بهذا المسار الأساسي.
              </p>
            )}
            {selectedGroup && (
              <div className="rounded-lg border p-3 text-xs">
                <p className="font-semibold">{selectedGroup.group_name}</p>
                <p className="mt-1 text-muted-foreground">{groupPathLabel(selectedGroup)}</p>
                <p className="mt-2 text-muted-foreground">
                  السعة المتبقية: {Math.max(0, selectedGroup.max_students - selectedGroup.students_count)}
                </p>
                <p className="mt-2 text-muted-foreground">
                  عند الإسناد سيُحدّث مسار المستوى والفصل/البلوك للطلاب ليطابق مسار المجموعة.
                </p>
              </div>
            )}
            <Button className="w-full" onClick={() => void assignStudents()} disabled={!selectedGroup || !selectedIds.length || isAssigning}>
              {isAssigning ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <UserRoundPlus className="ml-2 h-4 w-4" />}
              إسناد الطلاب المحددين
            </Button>
          </CardContent>
        </Card>
      </div>
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
