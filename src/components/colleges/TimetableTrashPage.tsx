import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  RotateCcw,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TrashRecord = {
  id: number;
  name: string;
  deleted_at: string | null;
  meta?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

type TrashGroup = {
  type: string;
  label: string;
  records: TrashRecord[];
};

type TrashType = "timetable" | "lecture_sessions";

type DeleteTarget = {
  type: TrashType;
  id: number;
  name: string;
};

const ENDPOINT = "/v1/timetable/trash";

const toText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const formatDate = (value: unknown): string => {
  if (!value) return "—";
  const raw = String(value);
  // session_date قد يصل بصيغة ISO كاملة، نعرض التاريخ فقط
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return raw;
};

const MetaRow = ({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className="break-words font-medium">{value}</span>
    </div>
  </div>
);

/**
 * سلة محذوفات وحدة الجداول:
 * تبويب للجداول (timetable) وتبويب لجلسات المحاضرات (lecture_sessions)
 * مع إمكانية الاستعادة أو الحذف النهائي لكل عنصر.
 */
export default function TimetableTrashPage({
  collegeId,
  onBack,
}: {
  collegeId: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<TrashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRecord, setBusyRecord] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [activeTab, setActiveTab] = useState<TrashType>("timetable");

  const collegeScope = { college_id: collegeId };

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.post(ENDPOINT, {
        action: "list",
        ...collegeScope,
      });
      setGroups(response.data?.groups ?? []);
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر تحميل سلة المحذوفات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [collegeId, toast]);

  useEffect(() => {
    void loadTrash();
  }, [loadTrash]);

  const timetableGroup = useMemo(
    () => groups.find((group) => group.type === "timetable"),
    [groups]
  );
  const sessionsGroup = useMemo(
    () => groups.find((group) => group.type === "lecture_sessions"),
    [groups]
  );

  const timetableCount = timetableGroup?.records.length ?? 0;
  const sessionsCount = sessionsGroup?.records.length ?? 0;
  const totalRecords = timetableCount + sessionsCount;

  const restoreRecord = async (type: TrashType, record: TrashRecord) => {
    const key = `${type}:${record.id}`;
    setBusyRecord(key);
    try {
      await api.post(ENDPOINT, {
        action: "restore",
        ...collegeScope,
        type,
        id: record.id,
      });
      toast({
        title: "تمت الاستعادة",
        description: `تمت استعادة «${record.name}»${type === "timetable" ? " مع جميع جلساته" : ""}`,
      });
      await loadTrash();
    } catch {
      toast({
        title: "تعذر الاستعادة",
        description: "لم نتمكن من استعادة هذا العنصر",
        variant: "destructive",
      });
    } finally {
      setBusyRecord(null);
    }
  };

  const permanentlyDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const key = `${target.type}:${target.id}`;
    setBusyRecord(key);
    try {
      await api.post(ENDPOINT, {
        action: "force_delete",
        ...collegeScope,
        type: target.type,
        id: target.id,
      });
      toast({
        title: "تم الحذف نهائياً",
        description: `تم حذف «${target.name}» نهائياً`,
      });
      setDeleteTarget(null);
      await loadTrash();
    } catch {
      toast({
        title: "تعذر الحذف",
        description: "لم نتمكن من حذف هذا العنصر نهائياً",
        variant: "destructive",
      });
    } finally {
      setBusyRecord(null);
    }
  };

  const renderRecords = (group: TrashGroup | undefined, type: TrashType) => {
    if (!group || group.records.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {type === "timetable" ? "لا توجد جداول في سلة المحذوفات." : "لا توجد جلسات محاضرات في سلة المحذوفات."}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {group.records.map((record) => {
          const key = `${type}:${record.id}`;
          const isBusy = busyRecord === key;
          const meta = (record.meta ?? {}) as Record<string, unknown>;

          return (
            <Card key={key} className="overflow-hidden">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold">{record.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تاريخ الحذف: {record.deleted_at ? new Date(record.deleted_at).toLocaleString("ar") : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => void restoreRecord(type, record)}
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      استعادة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() =>
                        setDeleteTarget({
                          type,
                          id: record.id,
                          name: record.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف نهائي
                    </Button>
                  </div>
                </div>

                {type === "timetable" ? (
                  <div className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                    <MetaRow icon={BookOpen} label="المقرر" value={toText(meta.course_name)} />
                    <MetaRow icon={User} label="المحاضر" value={toText(meta.lecturer_name)} />
                    <MetaRow icon={Users} label="المجموعة" value={toText(meta.group_name)} />
                    <MetaRow icon={MapPin} label="القاعة" value={toText(meta.classroom_name)} />
                    <MetaRow icon={CalendarDays} label="اليوم" value={toText(meta.day_name)} />
                    <MetaRow icon={Clock} label="الفترة" value={toText(meta.period_label)} />
                    <MetaRow
                      icon={CalendarDays}
                      label="الفترة الزمنية"
                      value={`${formatDate(meta.start_date)} ← ${formatDate(meta.end_date)}`}
                    />
                    <MetaRow icon={GraduationCap} label="العام الجامعي" value={toText(meta.academic_year)} />
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                    <MetaRow icon={BookOpen} label="المقرر" value={toText(meta.course_name)} />
                    <MetaRow icon={User} label="المحاضر" value={toText(meta.lecturer_name)} />
                    <MetaRow icon={Users} label="المجموعة" value={toText(meta.group_name)} />
                    <MetaRow icon={MapPin} label="القاعة" value={toText(meta.classroom_name)} />
                    <MetaRow icon={CalendarDays} label="التاريخ" value={formatDate(meta.session_date)} />
                    <MetaRow icon={Clock} label="الوقت" value={toText(meta.time_label)} />
                    <MetaRow icon={GraduationCap} label="اليوم" value={toText(meta.day_name)} />
                    <MetaRow icon={BookOpen} label="كود الجلسة" value={toText(meta.session_code)} />
                  </div>
                )}

                {type === "lecture_sessions" && Boolean(meta.timetable_deleted) && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    جدول هذه الجلسة محذوف أيضاً؛ عند استعادة الجلسة سيتم استعادة الجدول وكل جلساته تلقائياً.
                  </p>
                )}

                <details>
                  <summary className="cursor-pointer text-sm text-primary">عرض جميع بيانات السجل</summary>
                  <pre
                    className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-left text-xs text-slate-100"
                    dir="ltr"
                  >
                    {JSON.stringify(record.data ?? {}, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
            العودة لوحدة الجداول
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">سلة محذوفات الجداول</h2>
            <p className="text-sm text-muted-foreground">
              الجداول وجلسات المحاضرات المحذوفة حذفاً ناعماً في هذه الكلية
            </p>
          </div>
        </div>
        <Badge variant="secondary">{totalRecords} عنصر محذوف</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TrashType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="timetable" className="data-[state=active]:bg-primary/10">
              الجداول
              <Badge variant="outline" className="mr-2">
                {timetableCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="lecture_sessions" className="data-[state=active]:bg-primary/10">
              جلسات المحاضرات
              <Badge variant="outline" className="mr-2">
                {sessionsCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timetable" className="space-y-4 pt-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              استعادة الجدول تُعيد جميع جلساته المحذوفة معه، وحذفه نهائياً يحذف جميع جلساته نهائياً.
            </div>
            {renderRecords(timetableGroup, "timetable")}
          </TabsContent>

          <TabsContent value="lecture_sessions" className="space-y-4 pt-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              حذف جلسة نهائياً لا يؤثر على جدولها، أما استعادتها وجدولها محذوف فسيُستعاد الجدول وجميع جلساته.
            </div>
            {renderRecords(sessionsGroup, "lecture_sessions")}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              حذف نهائي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.name}» نهائياً؟
              {deleteTarget?.type === "timetable"
                ? " سيتم حذف جميع جلسات هذا الجدول نهائياً أيضاً."
                : ""}{" "}
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyRecord}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!busyRecord}
              onClick={(event) => {
                event.preventDefault();
                void permanentlyDelete();
              }}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
