import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, DollarSign, Clock, Calendar, FileDown } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast"; // استدعاء التوست

interface LecturerDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lecturerId: number | null;
  collegeId: string | number;
}

export function LecturerDetailsDialog({ isOpen, onClose, lecturerId, collegeId }: LecturerDetailsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // حالة زر التصدير
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && lecturerId) {
      setLoading(true);
      api.get(`/v1/colleges/${collegeId}/reports/lecturer/${lecturerId}`)
        .then((res) => setData(res.data.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, lecturerId, collegeId]);

  // ✅ دالة التصدير الجديدة
    const handleExport = async () => {
    if (!lecturerId) return;
    setIsExporting(true);
    try {
      const response = await api.get(`/v1/colleges/${collegeId}/reports/lecturer/${lecturerId}`, {
        params: { export: 'true' },
        responseType: 'blob',
      });

      // إنشاء الرابط
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // تعيين الاسم
      const fileName = `statement_${lecturerId}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      
      // ⚠️ هام: إضافة target blank قد يساعد في تجاوز بعض قيود المتصفح الأمني محلياً
      link.target = "_blank";

      // إضافته للصفحة
      document.body.appendChild(link);
      
      // الضغط عليه
      link.click();
      
      // ✅ التصحيح: الحذف المباشر والآمن
      // بدلاً من document.body.removeChild(link) داخل setTimeout
      link.parentNode?.removeChild(link);
      
      // تحرير الذاكرة
      window.URL.revokeObjectURL(url);

      toast({ title: "تم التصدير", description: "تم تحميل كشف الحساب بنجاح." });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "خطأ", description: "فشل تصدير الملف.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        {/* ... (نفس كود الهيدر والمحتوى السابق تماماً) ... */}
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            تفاصيل العضو / {data?.info?.name || "جاري التحميل..."}
          </DialogTitle>
          <DialogDescription>
            {data?.info?.department} - {data?.info?.title}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-6">
             {/* ... (محتوى البطاقات والجدول السابق) ... */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* ... Cards ... */}
               <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold text-primary">{Number(data.stats.total_earned).toLocaleString()} ر.ي</div>
                  <p className="text-sm text-muted-foreground">إجمالي المستحقات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{Number(data.stats.total_hours).toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">إجمالي الساعات المحسوبة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{data.stats.total_sessions}</div>
                  <p className="text-sm text-muted-foreground">عدد الجلسات المنفذة</p>
                </CardContent>
              </Card>
             </div>

             <div>
              <h3 className="font-semibold mb-3">سجل المحاضرات الحديثة</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المقرر</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-center">الساعات</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="font-medium">{row.course}</TableCell>
                        <TableCell>
                            <Badge variant={row.type === 'تعويضي' ? 'default' : 'secondary'}>
                                {row.type}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">{row.hours}</TableCell>
                        <TableCell className="text-left font-bold text-green-600">
                            {Number(row.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
            <p className="text-center text-destructive">فشل تحميل البيانات</p>
        )}

        {/* ✅ الفوتر المعدل مع تفعيل الزر */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button 
            className="gap-2" 
            onClick={handleExport} 
            disabled={isExporting || loading} // تعطيل الزر أثناء التحميل
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            تصدير كشف حساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}