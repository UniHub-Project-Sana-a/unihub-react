import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  deleted_at: string;
  data: Record<string, unknown>;
};

type TrashGroup = {
  type: string;
  label: string;
  records: TrashRecord[];
};

type DeleteTarget = {
  type: string;
  id: number;
  name: string;
};

/**
 * صفحة عامة لسلة المحذوفات (Soft Delete) — ديناميكية تخدم أي وحدة:
 * - الخطة الدراسية (الأقسام/البرامج/المستويات/المقررات...) عبر /v1/study-plan/trash
 * - المباني والقاعات عبر /v1/classrooms/trash
 * المطلوب تمرير endpoint + الصلاحية + النصوص، والباقي عام.
 */
export default function SoftDeleteTrashPage({
  collegeId,
  onBack,
  endpoint = "/v1/study-plan/trash",
  permission = "study_plan.delete",
  title = "سلة المحذوفات",
  subtitle = "العناصر المحذوفة حذفاً ناعماً في هذه الكلية",
  backLabel = "العودة",
}: {
  collegeId?: string;
  onBack: () => void;
  endpoint?: string;
  permission?: string | string[];
  title?: string;
  subtitle?: string;
  backLabel?: string;
}) {
  const { can } = usePermission();
  const { toast } = useToast();
  const [groups, setGroups] = useState<TrashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRecord, setBusyRecord] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const canManage = Array.isArray(permission)
    ? permission.some((key) => can(key))
    : can(permission);

  // بعض الوحدات (مثل الكليات) غير مرتبطة بكلية أب، لذا نرسل college_id فقط عند توفره.
  const collegeScope = collegeId ? { college_id: collegeId } : {};

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.post(endpoint, {
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
  }, [endpoint, collegeId, toast]);

  useEffect(() => {
    void loadTrash();
  }, [loadTrash]);

  const restoreRecord = async (group: TrashGroup, record: TrashRecord) => {
    const key = `${group.type}:${record.id}`;
    setBusyRecord(key);
    try {
      await api.post(endpoint, {
        action: "restore",
        ...collegeScope,
        type: group.type,
        id: record.id,
      });
      toast({ title: "تمت الاستعادة", description: `تمت استعادة ${record.name}` });
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
      await api.post(endpoint, {
        action: "force_delete",
        ...collegeScope,
        type: target.type,
        id: target.id,
      });
      toast({ title: "تم الحذف نهائياً", description: `تم حذف ${target.name} نهائياً` });
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

  const totalRecords = groups.reduce((total, group) => total + group.records.length, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
            {backLabel}
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary">{totalRecords} عنصر محذوف</Badge>
      </div>

      {!canManage && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          لا تملك صلاحية استعادة العناصر أو حذفها نهائياً.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : totalRecords === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            سلة المحذوفات فارغة.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.filter((group) => group.records.length > 0).map((group) => (
            <Card key={group.type} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-50">
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <Badge variant="outline">{group.records.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {group.records.map((record) => {
                  const key = `${group.type}:${record.id}`;
                  const isBusy = busyRecord === key;

                  return (
                    <div key={key} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-semibold">{record.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            تاريخ الحذف: {new Date(record.deleted_at).toLocaleString("ar")}
                          </p>
                        </div>
                        {canManage && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => void restoreRecord(group, record)}
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
                                  type: group.type,
                                  id: record.id,
                                  name: record.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف نهائي
                            </Button>
                          </div>
                        )}
                      </div>
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-primary">
                          عرض جميع بيانات السجل
                        </summary>
                        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-950 p-3 text-left text-xs text-slate-100" dir="ltr">
                          {JSON.stringify(record.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              حذف نهائي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.name}» نهائياً؟ قد تُحذف معه بيانات مرتبطة وفق علاقات قاعدة البيانات، ولا يمكن التراجع عن هذا الإجراء.
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
