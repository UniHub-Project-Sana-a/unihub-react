import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileJson, CheckCircle2, AlertTriangle, ShieldAlert, RefreshCw, X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collegeId?: string;
}

type SyncErrorEntry = {
  room_code: string;
  error_type: string;
  message: string;
  dev_note?: string;
};

type SyncSummary = {
  imported_classrooms: number;
  skipped_test_data: number;
  skipped_unapproved_buildings: number;
  skipped_scope: number;
  skipped_invalid_college_mapping?: number;
  errors?: SyncErrorEntry[];
  message: string;
};

type ImportedRoom = Record<string, unknown>;

export default function JsonImportModal({ isOpen, onClose, onSuccess, collegeId }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonParsed, setJsonParsed] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setJsonParsed(null);
    setParseError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setSyncResult(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    setParseError(null);
    setSyncResult(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.rooms || !Array.isArray(parsed.rooms)) {
          setParseError("الملف لا يحتوي على مصفوفة قاعات صالحة ('rooms').");
          setJsonParsed(null);
          return;
        }

        setJsonParsed(parsed);
      } catch {
        setParseError("ملف JSON غير صالح أو به خطأ في التنسيق.");
        setJsonParsed(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUploadAndSync = async () => {
    if (!jsonParsed) return;

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Prepare college/building mappings without replacing explicit nulls for shared data.
      const rooms = (jsonParsed.rooms || []) as ImportedRoom[];

      const hasField = (value: ImportedRoom, ...keys: string[]) =>
        keys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
      const readField = (value: ImportedRoom, ...keys: string[]): unknown => {
        const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(value, candidate));
        return key ? value[key] : undefined;
      };
      const getRoomCollegeScope = (room: ImportedRoom): string | null => {
        const roomCollegeId = readField(room, "collegeId", "college_id");
        if (roomCollegeId === null || roomCollegeId === "") return null;

        const collegeName = readField(room, "collegeName", "college_name");
        if (collegeName !== undefined) {
          if (typeof collegeName !== "string" || collegeName.trim() === "") return null;
          if (["عام", "shared", "general", "مشترك"].includes(collegeName.trim().toLowerCase())) return null;
          return `name:${collegeName}`;
        }

        if (roomCollegeId !== undefined) {
          return String(roomCollegeId);
        }
        return collegeId == null ? null : String(collegeId);
      };

      const buildingsMap = new Map<string, {
        local_id: string;
        code: string;
        name_ar: string;
        roomCollegeScopes: Set<string | null>;
        hasExplicitBuildingCollege: boolean;
        explicitBuildingCollegeId: string | null;
        explicitBuildingCollegeName: string | null;
        explicitlyShared: boolean;
      }>();
      rooms.forEach((r) => {
        const bId = readField(r, "buildingId", "building_id");
        if (typeof bId !== "string" && typeof bId !== "number") return;
        const rawBuildingName = readField(r, "buildingName", "building_name");
        const bName = typeof rawBuildingName === "string" && rawBuildingName
          ? rawBuildingName
          : `مبنى ${bId}`;
        const buildingCollegeIdProvided = hasField(r, "buildingCollegeId", "building_college_id");
        const buildingCollegeNameProvided = hasField(r, "buildingCollegeName", "building_college_name");
        const explicitBuildingCollegeId = readField(r, "buildingCollegeId", "building_college_id");
        const explicitBuildingCollegeName = readField(r, "buildingCollegeName", "building_college_name");
        const existing = buildingsMap.get(String(bId));

        if (!existing) {
          buildingsMap.set(String(bId), {
            local_id: String(bId),
            code: String(bId),
            name_ar: bName,
            roomCollegeScopes: new Set([getRoomCollegeScope(r)]),
            hasExplicitBuildingCollege: buildingCollegeIdProvided || buildingCollegeNameProvided,
            explicitBuildingCollegeId:
              explicitBuildingCollegeId == null || explicitBuildingCollegeId === ""
                ? null
                : String(explicitBuildingCollegeId),
            explicitBuildingCollegeName:
              buildingCollegeIdProvided && (explicitBuildingCollegeId == null || explicitBuildingCollegeId === "")
                ? null
                : typeof explicitBuildingCollegeName === "string" ? explicitBuildingCollegeName : null,
            explicitlyShared: r.buildingIsShared === true || r.building_is_shared === true,
          });
        } else {
          existing.roomCollegeScopes.add(getRoomCollegeScope(r));
          existing.explicitlyShared ||= r.buildingIsShared === true || r.building_is_shared === true;
          if (buildingCollegeIdProvided || buildingCollegeNameProvided) {
            existing.hasExplicitBuildingCollege = true;
            existing.explicitBuildingCollegeId =
              explicitBuildingCollegeId == null || explicitBuildingCollegeId === ""
                ? null
                : String(explicitBuildingCollegeId);
            existing.explicitBuildingCollegeName =
              buildingCollegeIdProvided && (explicitBuildingCollegeId == null || explicitBuildingCollegeId === "")
                ? null
                : typeof explicitBuildingCollegeName === "string" ? explicitBuildingCollegeName : null;
          }
        }
      });

      const buildingsPayload = Array.from(buildingsMap.values()).map((building) => {
        const roomCollegeIds = new Set(
          Array.from(building.roomCollegeScopes).filter(
            (scope): scope is string => scope !== null && !scope.startsWith("name:")
          )
        );
        const roomCollegeNames = Array.from(building.roomCollegeScopes).filter(
          (scope): scope is string => scope !== null && scope.startsWith("name:")
        );
        const allRoomsShared = Array.from(building.roomCollegeScopes).every((scope) => scope === null);
        const isShared =
          building.explicitlyShared ||
          (!building.hasExplicitBuildingCollege && (allRoomsShared || roomCollegeIds.size > 1 || roomCollegeNames.length > 1));

        const resolvedCollegeId = building.explicitlyShared
          ? null
          : building.hasExplicitBuildingCollege
          ? building.explicitBuildingCollegeId ?? null
          : isShared
            ? null
            : roomCollegeIds.values().next().value ?? collegeId ?? null;
        const resolvedCollegeName = building.explicitlyShared
          ? undefined
          : building.hasExplicitBuildingCollege
          ? building.explicitBuildingCollegeName
          : !isShared && roomCollegeNames.length === 1
            ? roomCollegeNames[0].slice("name:".length)
            : undefined;

        return {
          local_id: building.local_id,
          code: building.code,
          name_ar: building.name_ar,
          college_id: resolvedCollegeId,
          ...(resolvedCollegeName ? { collegeName: resolvedCollegeName } : {}),
        };
      });

      const payload = {
        buildings: buildingsPayload,
        classrooms: rooms.map((r) => {
          const room: ImportedRoom = {
            ...r,
            building_id: readField(r, "buildingId", "building_id"),
          };
          const roomCollegeId = readField(r, "collegeId", "college_id");
          if (hasField(r, "collegeId", "college_id") && (roomCollegeId == null || roomCollegeId === "")) {
            room.collegeName = "مشترك";
            room.college_name = "مشترك";
          }
          if (!hasField(r, "collegeId", "college_id") && !hasField(r, "collegeName", "college_name")) {
            room.college_id = collegeId;
          } else if (hasField(r, "collegeId", "college_id")) {
            room.college_id = roomCollegeId;
          }
          return room;
        }),
        scope_college_id: collegeId || undefined,
      };

      setUploadProgress(50);

      let res;
      try {
        res = await api.post("/v1/sync/bulk", payload);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          res = await api.post("/v1/sync", payload);
        } else {
          throw err;
        }
      }
      setUploadProgress(100);

      const summary: SyncSummary = res.data?.summary || {
        imported_classrooms: rooms.length,
        skipped_test_data: 0,
        skipped_unapproved_buildings: 0,
        skipped_scope: 0,
        skipped_invalid_college_mapping: 0,
        errors: [],
        message: "تم المزامنة بنجاح",
      };

      setSyncResult(summary);

      if (summary.errors && summary.errors.length > 0) {
        toast({
          title: "اكتملت المزامنة مع وجود أخطاء",
          description: `تم استيراد بعض القاعات، ولكن تم رفض ${summary.errors.length} قاعة بسبب أخطاء تقنية في البيانات.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "نجاح المزامنة",
          description: summary.message,
        });
      }

      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشلت عملية المزامنة مع السيرفر";
      toast({
        title: "خطأ في المزامنة",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileJson className="w-6 h-6 text-primary" />
            استيراد ومزامنة بيانات القاعات (JSON)
          </DialogTitle>
          <DialogDescription>
            قم برفع ملف البيانات المكون من تطبيق الموبايل الميداني للمزامنة المحصنة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* منطقة سحب وإفلات الملف */}
          {!syncResult && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                selectedFile
                  ? "border-primary/50 bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold text-sm">
                انقر لاختيار ملف الـ JSON أو اسحبه وأسقطه هنا
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                يدعم الملفات المصدّرة من تطبيق القاعات الميداني (UniHub Mobile App)
              </p>
            </div>
          )}

          {/* الخطأ في القراءة */}
          {parseError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* معاينة البيانات قبل المزامنة */}
          {jsonParsed && !syncResult && (
            <div className="bg-muted/40 border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-bold text-sm flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-primary" />
                  {selectedFile?.name}
                </span>
                <Badge variant="outline">
                  {(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-background p-2.5 rounded-lg border">
                  <span className="text-muted-foreground block">إجمالي القاعات بالملف</span>
                  <span className="text-base font-bold text-primary">{jsonParsed.rooms?.length || 0} قاعة</span>
                </div>
                <div className="bg-background p-2.5 rounded-lg border">
                  <span className="text-muted-foreground block">تاريخ التصدير</span>
                  <span className="font-medium">
                    {jsonParsed.metadata?.exported_at
                      ? new Date(jsonParsed.metadata.exported_at).toLocaleDateString("ar-EG")
                      : "غير محدد"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* شريط التقدم عند التحميل */}
          {isUploading && (
            <div className="space-y-2 py-3">
              <div className="flex justify-between text-xs font-semibold">
                <span>جاري المزامنة والتصفية المحصنة...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* تقرير نتائج المزامنة البصري */}
          {syncResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                syncResult.errors && syncResult.errors.length > 0
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
              }`}>
                {syncResult.errors && syncResult.errors.length > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {syncResult.errors && syncResult.errors.length > 0 ? "اكتملت المزامنة مع وجود أخطاء" : "تمت المزامنة بنجاح"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">{syncResult.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-green-50 border border-green-200 dark:bg-green-950/20 p-3 rounded-xl">
                  <span className="text-muted-foreground block">القاعات المباشرة المستوردة</span>
                  <span className="text-lg font-extrabold text-green-600">{syncResult.imported_classrooms}</span>
                </div>

                {syncResult.skipped_scope > 0 && (
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 p-3 rounded-xl">
                    <span className="text-amber-800 dark:text-amber-300 block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      تجاوز قاعات كليات أخرى
                    </span>
                    <span className="text-lg font-extrabold text-amber-600">{syncResult.skipped_scope}</span>
                  </div>
                )}

                {syncResult.skipped_unapproved_buildings > 0 && (
                  <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 p-3 rounded-xl">
                    <span className="text-red-800 dark:text-red-300 block">مبانٍ غير معتمدة</span>
                    <span className="text-lg font-extrabold text-red-600">{syncResult.skipped_unapproved_buildings}</span>
                  </div>
                )}

                {syncResult.skipped_test_data > 0 && (
                  <div className="bg-muted p-3 rounded-xl border">
                    <span className="text-muted-foreground block">سجلات تجريبية منقاة</span>
                    <span className="text-lg font-extrabold text-muted-foreground">{syncResult.skipped_test_data}</span>
                  </div>
                )}
              </div>

              {/* قائمة قابلة للتمرير بأخطاء ربط الكلية القادمة من الملف */}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-destructive/20 text-destructive font-bold text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    قاعات مرفوضة بسبب أخطاء تقنية ({syncResult.errors.length})
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-destructive/10">
                    {syncResult.errors.map((err, idx) => (
                      <div key={idx} className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground">{err.room_code}</span>
                          <Badge variant="destructive" className="text-[10px]">{err.error_type}</Badge>
                        </div>
                        <p className="text-destructive leading-relaxed">{err.message}</p>
                        {err.dev_note && (
                          <p className="text-muted-foreground text-[11px] font-mono ltr:text-left" dir="ltr">
                            {err.dev_note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row-reverse justify-start gap-2 pt-2 border-t">
          {!syncResult ? (
            <>
              <Button
                onClick={handleUploadAndSync}
                disabled={!jsonParsed || isUploading}
                className="gap-2"
              >
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                بدء المزامنة
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                إلغاء
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>إغلاق التقرير</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
