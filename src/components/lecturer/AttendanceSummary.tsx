import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Check, X, Loader2, ShieldCheck } from "lucide-react";
import { AttendanceRecord } from "@/pages/LecturerPage";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

// 1. تحديث الواجهة لتستقبل الخصائص الجديدة
interface AttendanceSummaryProps {
  records: AttendanceRecord[];
  onAddManual: (record: AttendanceRecord) => void;
  lectureTitle: string;
  groupName: string;
  lectureId: string;
}

export function AttendanceSummary({
  records,
  onAddManual,
  lectureTitle,
  groupName,
  lectureId,
}: AttendanceSummaryProps) {
  const [manualStudentId, setManualStudentId] = useState("");
  const [pendingManual, setPendingManual] = useState<AttendanceRecord | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const { toast } = useToast();

  const handleAddManual = () => {
    if (manualStudentId.trim()) {
      // هنا يمكنك إضافة استدعاء API للتحقق من وجود الطالب قبل إضافته للقائمة
      const newRecord: AttendanceRecord = {
        studentName: `(يدوي) طالب`, // سيتم تحديث الاسم من الخادم لاحقًا
        studentId: manualStudentId.trim(),
        scanTime: new Date().toLocaleTimeString("ar-SA"),
        method: "يدوي",
      };
      setPendingManual(newRecord);
    }
  };

  const handleConfirm = () => {
    if (pendingManual) {
      onAddManual(pendingManual);
      setPendingManual(null);
      setManualStudentId("");
    }
  };

  const handleCancel = () => {
    setPendingManual(null);
    setManualStudentId("");
  };

  // 2. دالة المصادقة على الحضور
  const handleFinalize = async () => {
    if (!confirm("هل أنت متأكد من المصادقة على هذه القائمة؟ لا يمكن التراجع عن هذه العملية.")) {
      return;
    }
    setIsFinalizing(true);
    try {
      await api.post('/v1/attendance/finalize', {
        entry_id: Number(lectureId),
        records: records,
      });
      toast({
        title: "نجاح",
        description: "تم حفظ ومصادقة قائمة الحضور بنجاح.",
      });
      setIsFinalized(true); // لمنع إعادة الإرسال
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.response?.data?.message || "فشل حفظ الحضور. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const exportToCSV = () => {
    // ... (دالة تصدير CSV تبقى كما هي)
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">ملخص الحضور - {lectureTitle}</CardTitle>
              <CardDescription>{groupName}</CardDescription>
            </div>
            <Badge className="text-lg px-4 py-2">
              إجمالي الحضور: {records.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="manual-add" className="text-sm font-medium mb-2 block">
                إضافة طالب يدوياً
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-add"
                  placeholder="أدخل الرقم الأكاديمي"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddManual()}
                />
                <Button onClick={handleAddManual} className="gap-2">
                  <Plus className="w-4 h-4" /> أضف
                </Button>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
          </div>

          {pendingManual && (
            <Card className="p-4 mb-4 border-primary bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">تأكيد الإضافة اليدوية</p>
                  <p className="text-sm text-muted-foreground">الرقم الأكاديمي: {pendingManual.studentId}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleConfirm} className="gap-2">
                    <Check className="w-4 h-4" /> تأكيد
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="gap-2">
                    <X className="w-4 h-4" /> إلغاء
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الطالب</TableHead>
                  <TableHead className="text-right">الرقم الأكاديمي</TableHead>
                  <TableHead className="text-right">وقت المسح</TableHead>
                  <TableHead className="text-right">الطريقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      لا توجد سجلات حضور بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.studentId}</TableCell>
                      <TableCell>{record.scanTime}</TableCell>
                      <TableCell>
                        <Badge variant={record.method === "QR" ? "default" : "secondary"}>
                          {record.method}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 3. زر المصادقة */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleFinalize} disabled={isFinalizing || isFinalized} size="lg" className="gap-2">
              {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {isFinalized ? "تمت المصادقة" : "مصادقة وإنهاء"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}