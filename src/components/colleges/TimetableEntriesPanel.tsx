import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Lookup = { id: number; name: string };

type TimetableEntry = {
  timetable_id: number;
  status?: number;
  start_date?: string;
  end_date?: string;
  academic_year?: string;
  course?: { course_name?: string; course_code?: string };
  lecturer?: { user?: { full_name?: string } };
  group?: { group_name?: string };
  classroom?: { classroom_name?: string };
  day?: { day_name?: string };
  period?: { start_time?: string; end_time?: string };
  department?: { department_name?: string };
  program?: { program_name?: string };
  level?: { level_name?: string; level_number?: number };
  semester?: { semester_name?: string; term_number?: number };
  block?: { block_name?: string };
};

type Meta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type Filters = {
  department_id: string;
  program_id: string;
  level_id: string;
  semester_id: string;
  block_id: string;
  day_id: string;
  period_id: string;
  lecturer_id: string;
  group_id: string;
  classroom_id: string;
  status: string;
};

const EMPTY_FILTERS: Filters = {
  department_id: "",
  program_id: "",
  level_id: "",
  semester_id: "",
  block_id: "",
  day_id: "",
  period_id: "",
  lecturer_id: "",
  group_id: "",
  classroom_id: "",
  status: "",
};

const ALL = "__all__";
const dateOnly = (value?: string) => (value ? value.slice(0, 10) : "—");
const hhmm = (value?: string) => (value ? value.slice(0, 5) : "");

const mapLookup = (rows: any[], idKey: string, nameKey: string, fallbackKey?: string): Lookup[] =>
  (Array.isArray(rows) ? rows : []).map((row) => ({
    id: Number(row[idKey]),
    name: row[nameKey] || (fallbackKey ? row[fallbackKey] : "") || `#${row[idKey]}`,
  }));

interface TimetableEntriesPanelProps {
  collegeId: string;
  departments: { department_id: number; name: string }[];
  days: { day_id: number; name?: string; name_ar?: string }[];
  periods: { period_id: number; start_time?: string; end_time?: string }[];
  classrooms: { classroom_id: number; name?: string; classroom_name?: string }[];
  lecturers: { lecturer_id: number; name: string }[];
  refreshToken?: number;
  onChanged?: () => void;
}

export default function TimetableEntriesPanel({
  collegeId,
  departments,
  days,
  periods,
  classrooms,
  lecturers,
  refreshToken = 0,
  onChanged,
}: TimetableEntriesPanelProps) {
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // خيارات الفلاتر التابعة (تُجلب حسب اختيار المستخدم)
  const [programs, setPrograms] = useState<Lookup[]>([]);
  const [levels, setLevels] = useState<Lookup[]>([]);
  const [semesters, setSemesters] = useState<Lookup[]>([]);
  const [blocks, setBlocks] = useState<Lookup[]>([]);
  const [groups, setGroups] = useState<Lookup[]>([]);

  // تأخير البحث لتقليل عدد الطلبات
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // البرامج حسب القسم
  useEffect(() => {
    if (!filters.department_id) {
      setPrograms([]);
      return;
    }
    let cancelled = false;
    api
      .get("/v1/programs", { params: { department_id: filters.department_id } })
      .then((res) => {
        if (!cancelled) setPrograms(mapLookup(res.data, "program_id", "program_name"));
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.department_id]);

  // المستويات حسب البرنامج
  useEffect(() => {
    if (!filters.program_id) {
      setLevels([]);
      return;
    }
    let cancelled = false;
    api
      .get("/v1/levels", { params: { program_id: filters.program_id } })
      .then((res) => {
        if (!cancelled) setLevels(mapLookup(res.data, "level_id", "level_name", "level_number"));
      })
      .catch(() => {
        if (!cancelled) setLevels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.program_id]);

  // الفصول حسب المستوى
  useEffect(() => {
    if (!filters.level_id) {
      setSemesters([]);
      return;
    }
    let cancelled = false;
    api
      .get("/v1/semesters", { params: { level_id: filters.level_id } })
      .then((res) => {
        if (!cancelled) setSemesters(mapLookup(res.data, "semester_id", "semester_name", "term_number"));
      })
      .catch(() => {
        if (!cancelled) setSemesters([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.level_id]);

  // البلوكات حسب البرنامج
  useEffect(() => {
    if (!filters.program_id) {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    api
      .get("/v1/blocks", { params: { program_id: filters.program_id } })
      .then((res) => {
        if (!cancelled) setBlocks(mapLookup(res.data, "id", "block_name", "block_number"));
      })
      .catch(() => {
        if (!cancelled) setBlocks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.program_id]);

  // كل مجموعات الكلية
  useEffect(() => {
    if (!collegeId) return;
    let cancelled = false;
    api
      .get("/v1/student-groups", { params: { college_id: collegeId, all: 1 } })
      .then((res) => {
        if (!cancelled) setGroups(mapLookup(res.data, "group_id", "group_name"));
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [collegeId]);

  const loadEntries = useCallback(async () => {
    if (!collegeId) return;
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        college_id: collegeId,
        with: "course,lecturer.user,group,classroom,day,period,department,program,level,semester",
        per_page: String(perPage),
        page: String(page),
      };

      if (search) params.search = search;
      (Object.keys(filters) as (keyof Filters)[]).forEach((key) => {
        const value = filters[key];
        if (value) params[key] = value;
      });

      const res = await api.get("/v1/timetable", { params });
      const payload = res.data;
      setEntries(Array.isArray(payload?.data) ? payload.data : []);
      setMeta(
        payload?.meta ?? {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: Array.isArray(payload?.data) ? payload.data.length : 0,
        }
      );
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر تحميل بنود الجدول الدراسي",
        variant: "destructive",
      });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [collegeId, filters, page, perPage, search, refreshToken, toast]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ id: d.department_id, name: d.name })),
    [departments]
  );
  const dayOptions = useMemo(
    () => days.map((d) => ({ id: d.day_id, name: d.name_ar || d.name || `يوم #${d.day_id}` })),
    [days]
  );
  const periodOptions = useMemo(
    () =>
      periods.map((p) => ({
        id: p.period_id,
        name: `${hhmm(p.start_time)} - ${hhmm(p.end_time)}`,
      })),
    [periods]
  );
  const classroomOptions = useMemo(
    () => classrooms.map((c) => ({ id: c.classroom_id, name: c.classroom_name || c.name || `قاعة #${c.classroom_id}` })),
    [classrooms]
  );
  const lecturerOptions = useMemo(
    () => lecturers.map((l) => ({ id: l.lecturer_id, name: l.name })),
    [lecturers]
  );

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDepartmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      department_id: value,
      program_id: "",
      level_id: "",
      semester_id: "",
      block_id: "",
    }));
    setPage(1);
  };

  const handleProgramChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      program_id: value,
      level_id: "",
      semester_id: "",
      block_id: "",
    }));
    setPage(1);
  };

  const handleLevelChange = (value: string) => {
    setFilters((prev) => ({ ...prev, level_id: value, semester_id: "" }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  const handleDelete = async (entry: TimetableEntry) => {
    const courseName = entry.course?.course_name || `بند #${entry.timetable_id}`;
    const approved = await confirm({
      title: "حذف بند من الجدول",
      description: `سيتم نقل بند «${courseName}» وجميع جلساته إلى سلة المحذوفات. هل تريد المتابعة؟`,
    });
    if (!approved) return;

    setDeletingId(entry.timetable_id);
    try {
      await api.delete(`/v1/timetable/${entry.timetable_id}`);
      toast({
        title: "تم الحذف",
        description: "تم نقل بند الجدول وجميع جلساته إلى سلة المحذوفات",
      });
      onChanged?.();

      if (entries.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await loadEntries();
      }
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر حذف بند الجدول",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderLookupSelect = (
    value: string,
    onChange: (value: string) => void,
    options: Lookup[],
    placeholder: string,
    disabled = false
  ) => (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const firstRow = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const lastRow = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <Card className="backdrop-blur-sm" dir="rtl">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <BookOpen className="h-5 w-5 text-primary" />
              الجداول الدراسية
            </CardTitle>
            <CardDescription className="mt-1">
              جميع بنود الجدول الدراسي لهذه الكلية، مع البحث والفلترة والحذف.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" />
                {activeFiltersCount} فلتر
              </Badge>
            )}
            <Badge variant="secondary">{meta.total} بند</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 md:p-6">
        {/* البحث وعدد الصفوف */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ابحث بالمقرر، كود المقرر، المحاضر، المجموعة، القاعة، اليوم أو العام الجامعي..."
              className="pr-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">صفوف الصفحة</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              مسح الفلاتر
            </Button>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {renderLookupSelect(filters.department_id, handleDepartmentChange, departmentOptions, "كل الأقسام")}
          {renderLookupSelect(
            filters.program_id,
            handleProgramChange,
            programs,
            "كل البرامج",
            !filters.department_id
          )}
          {renderLookupSelect(filters.level_id, handleLevelChange, levels, "كل المستويات", !filters.program_id)}
          {renderLookupSelect(
            filters.semester_id,
            (value) => setFilter("semester_id", value),
            semesters,
            "كل الفصول",
            !filters.level_id
          )}
          {renderLookupSelect(filters.block_id, (value) => setFilter("block_id", value), blocks, "كل البلوكات", !filters.program_id)}
          {renderLookupSelect(filters.day_id, (value) => setFilter("day_id", value), dayOptions, "كل الأيام")}
          {renderLookupSelect(filters.period_id, (value) => setFilter("period_id", value), periodOptions, "كل الفترات")}
          {renderLookupSelect(filters.lecturer_id, (value) => setFilter("lecturer_id", value), lecturerOptions, "كل المحاضرين")}
          {renderLookupSelect(filters.group_id, (value) => setFilter("group_id", value), groups, "كل المجموعات")}
          {renderLookupSelect(
            filters.classroom_id,
            (value) => setFilter("classroom_id", value),
            classroomOptions,
            "كل القاعات"
          )}
          {renderLookupSelect(
            filters.status,
            (value) => setFilter("status", value),
            [
              { id: 1, name: "فعال" },
              { id: 0, name: "غير فعال" },
            ],
            "كل الحالات"
          )}
        </div>

        {/* الجدول */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            لا توجد بنود مطابقة للبحث أو الفلاتر الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right">المقرر</TableHead>
                  <TableHead className="text-right">المحاضر</TableHead>
                  <TableHead className="text-right">المجموعة</TableHead>
                  <TableHead className="text-right">المسار</TableHead>
                  <TableHead className="text-right">الموعد</TableHead>
                  <TableHead className="text-right">القاعة</TableHead>
                  <TableHead className="text-right">الفترة الزمنية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const levelLabel =
                    entry.level?.level_name ||
                    (entry.level?.level_number !== undefined ? `المستوى ${entry.level.level_number}` : "");
                  const semesterLabel =
                    entry.semester?.semester_name ||
                    (entry.semester?.term_number !== undefined ? `الفصل ${entry.semester.term_number}` : "");
                  const pathParts = [
                    entry.department?.department_name,
                    entry.program?.program_name,
                    levelLabel,
                    semesterLabel,
                    entry.block?.block_name,
                  ].filter(Boolean);
                  const isActive = Number(entry.status ?? 1) === 1;

                  return (
                    <TableRow key={entry.timetable_id} className="align-top">
                      <TableCell>
                        <div className="font-semibold">{entry.course?.course_name || "—"}</div>
                        {entry.course?.course_code && (
                          <div className="mt-0.5 font-mono text-xs text-muted-foreground" dir="ltr">
                            {entry.course.course_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{entry.lecturer?.user?.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{entry.group?.group_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[220px] text-xs leading-5 text-muted-foreground">
                          {pathParts.length > 0 ? pathParts.join(" / ") : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1 font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {entry.day?.day_name || "—"}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                            <Clock className="h-3.5 w-3.5" />
                            {hhmm(entry.period?.start_time)} - {hhmm(entry.period?.end_time)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5 text-xs">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{entry.classroom?.classroom_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap font-mono text-xs" dir="ltr">
                          {dateOnly(entry.start_date)} ← {dateOnly(entry.end_date)}
                        </div>
                        {entry.academic_year && (
                          <div className="mt-1 text-xs text-muted-foreground">{entry.academic_year}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "فعال" : "غير فعال"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === entry.timetable_id}
                          onClick={() => void handleDelete(entry)}
                          className="gap-1.5"
                        >
                          {deletingId === entry.timetable_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* الترقيم */}
        {meta.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              عرض {firstRow}–{lastRow} من {meta.total} بند
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {meta.current_page} من {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page || isLoading}
                onClick={() => setPage((prev) => Math.min(meta.last_page, prev + 1))}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {confirmDialog}
    </Card>
  );
}
