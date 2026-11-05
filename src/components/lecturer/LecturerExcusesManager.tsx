import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FileText, CheckCircle2, XCircle, Clock, Calendar, User, BookOpen, AlertCircle, Loader2 } from "lucide-react";

interface ExcuseItem {
  id: number;
  student_name: string;
  academic_number: string;
  course_name: string;
  request_date: string;
  reason: string;
  excuse_image?: string | null;
  response_status: number; // 0: pending, 1: approved, 2: rejected
  status_text: string;
  lecturer_comment?: string | null;
  created_at: string;
}

export function LecturerExcusesManager() {
  const { toast } = useToast();
  const [excuses, setExcuses] = useState<ExcuseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Review modal
  const [selectedExcuse, setSelectedExcuse] = useState<ExcuseItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExcuses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/v1/lecturer/student-excuses");
      if (res.data?.excuses) {
        setExcuses(res.data.excuses);
      }
    } catch (error) {
      console.error("Error fetching student excuses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExcuses();
  }, []);

  const openReviewDialog = (excuse: ExcuseItem) => {
    setSelectedExcuse(excuse);
    setReviewComment(excuse.lecturer_comment || "");
  };

  const handleReviewDecision = async (status: 1 | 2) => {
    if (!selectedExcuse) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/v1/lecturer/student-excuses/${selectedExcuse.id}/review`, {
        status,
        comment: reviewComment.trim() || undefined,
      });

      toast({
        title: status === 1 ? "تم قبول العذر" : "تم رفض العذر",
        description: res.data?.message || "تم تحديث حالة العذر وإبلاغ الطالب بها.",
      });

      setSelectedExcuse(null);
      fetchExcuses();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.response?.data?.message || "تعذر مراجعة العذر.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExcuses = excuses.filter((ex) => {
    if (filterStatus === "pending") return ex.response_status === 0;
    if (filterStatus === "approved") return ex.response_status === 1;
    if (filterStatus === "rejected") return ex.response_status === 2;
    return true;
  });

  const pendingCount = excuses.filter((e) => e.response_status === 0).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري جلب أعذار الطلاب المقدمة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">مراجعة واعتماد أعذار الطلاب</CardTitle>
              </div>
              <CardDescription className="mt-1">
                استعراض طلبات الغياب الطبية والاضطرارية المقدمة من الطلاب لمقرراتك الدراسية
              </CardDescription>
            </div>

            {/* أزرار الفلترة */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilterStatus("all")}
              >
                الكل ({excuses.length})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilterStatus("pending")}
              >
                قيد الانتظار ({pendingCount})
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilterStatus("approved")}
              >
                المقبولة ({excuses.filter((e) => e.response_status === 1).length})
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setFilterStatus("rejected")}
              >
                المرفوضة ({excuses.filter((e) => e.response_status === 2).length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredExcuses.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">لا توجد أعذار مطابقة للفلتر المحدد.</p>
              <p className="text-xs text-muted-foreground mt-1">جميع طلبات الأعذار الطارئة تم التعامل معها بنجاح.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExcuses.map((ex) => (
                <div
                  key={ex.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    ex.response_status === 0
                      ? "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10"
                      : ex.response_status === 1
                      ? "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10"
                      : "border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" />
                        {ex.student_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>الرقم: {ex.academic_number}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {ex.course_name}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        ex.response_status === 1
                          ? "default"
                          : ex.response_status === 2
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {ex.status_text}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background/80 border text-xs text-foreground/90 leading-relaxed">
                    <span className="font-semibold text-primary block mb-1">سبب الغياب المذكور:</span>
                    {ex.reason}
                  </div>

                  {ex.lecturer_comment && (
                    <div className="p-2 rounded bg-muted/60 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">تعليقك السابق:</span> {ex.lecturer_comment}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      تاريخ الغياب: {ex.request_date}
                    </span>

                    <Button
                      variant={ex.response_status === 0 ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => openReviewDialog(ex)}
                    >
                      {ex.response_status === 0 ? "اتخاذ قرار / مراجعة" : "تعديل القرار"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة اتخاذ القرار والمراجعة */}
      <Dialog open={!!selectedExcuse} onOpenChange={(open) => !open && setSelectedExcuse(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مراجعة عذر الطالب</DialogTitle>
            <DialogDescription>
              {selectedExcuse?.student_name} (الرقم: {selectedExcuse?.academic_number}) - مقرر {selectedExcuse?.course_name}
            </DialogDescription>
          </DialogHeader>

          {selectedExcuse && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>تاريخ المحاضرة التي غاب عنها:</span>
                  <span className="font-semibold text-foreground">{selectedExcuse.request_date}</span>
                </div>
                <div>
                  <span className="font-semibold text-primary block mb-0.5">شرح سبب الغياب:</span>
                  <p className="text-foreground leading-relaxed whitespace-pre-line">{selectedExcuse.reason}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  ملاحظات أو توجيه للطالب (اختياري يظهر له في بوابته)
                </label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="مثال: العذر مقبول ويجب تعويض التكليف المعملي مع الزملاء."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedExcuse(null)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-1"
              disabled={isSubmitting}
              onClick={() => handleReviewDecision(2)}
            >
              <XCircle className="w-4 h-4" />
              رفض العذر
            </Button>
            <Button
              type="button"
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
              onClick={() => handleReviewDecision(1)}
            >
              <CheckCircle2 className="w-4 h-4" />
              قبول واعتماد العذر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

