import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";

type ApiPeriod = {
  period_id: number;
  college_id: number;
  period_name: string;
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  session_type: string;
};

type Period = {
  id: number;
  name: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  sessionType: string;
  collegeId: number;
};

interface PeriodsModuleProps {
  collegeId: string;
}

export default function PeriodsModule({ collegeId }: PeriodsModuleProps) {
  const { can } = usePermission();
  const { toast } = useToast();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    start: "08:00",
    end: "10:00",
    sessionType: "LECTURE", // LECTURE/LAB/SEMINAR
  });

  const fetchPeriods = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/v1/periods", { params: { college_id: collegeId } });
      const raw: ApiPeriod[] = res.data?.data ?? res.data;
      const mapped: Period[] = raw.map((p) => ({
        id: p.period_id,
        name: p.period_name,
        start: p.start_time?.slice(0,5) ?? "00:00",
        end: p.end_time?.slice(0,5) ?? "00:00",
        sessionType: p.session_type,
        collegeId: p.college_id,
      }));
      setPeriods(mapped.sort((a,b) => a.start.localeCompare(b.start)));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الفترات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!collegeId) return;
    fetchPeriods();
  }, [collegeId]);

  const openAdd = () => {
    setEditingPeriod(null);
    setFormData({ name: "", start: "08:00", end: "10:00", sessionType: "LECTURE" });
    setIsDialogOpen(true);
  };

  const openEdit = (p: Period) => {
    setEditingPeriod(p);
    setFormData({ name: p.name, start: p.start, end: p.end, sessionType: p.sessionType });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الفترة؟")) return;
    try {
      await api.delete(`/v1/periods/${id}`);
      toast({ title: "نجاح", description: "تم حذف الفترة" });
      await fetchPeriods();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف الفترة";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        college_id: Number(collegeId),
        period_name: formData.name,
        start_time: formData.start,
        end_time: formData.end,
        session_type: formData.sessionType,
      };

      if (editingPeriod) {
        await api.put(`/v1/periods/${editingPeriod.id}`, payload);
        toast({ title: "نجاح", description: "تم تعديل الفترة" });
      } else {
        await api.post("/v1/periods", payload);
        toast({ title: "نجاح", description: "تم إنشاء الفترة" });
      }

      setIsDialogOpen(false);
      setEditingPeriod(null);
      await fetchPeriods();
    } catch (error: any) {
      const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل حفظ الفترة";
      const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل حفظ الفترة";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">الفترات الزمنية</h2>
        {can('periods.create') && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة فترة
          </Button>
        )}
      </div>

      {/* Dialog form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriod ? "تعديل فترة" : "إضافة فترة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم الفترة *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>نوع الجلسة *</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(v) => setFormData((p) => ({ ...p, sessionType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PM">PM</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>وقت البداية *</Label>
                <Input
                  type="time"
                  value={formData.start}
                  onChange={(e) => setFormData((p) => ({ ...p, start: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>وقت النهاية *</Label>
                <Input
                  type="time"
                  value={formData.end}
                  onChange={(e) => setFormData((p) => ({ ...p, end: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPeriod ? "حفظ التغييرات" : "إنشاء"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Periods table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {/* تم إضافة text-right لضمان المحاذاة لليمين */}
                <TableHead className="text-right w-[50px]">#</TableHead>
                <TableHead className="text-right">اسم الفترة</TableHead>
                <TableHead className="text-right">البداية</TableHead>
                <TableHead className="text-right">النهاية</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                {/* الإجراءات عادة تكون أجمل في الوسط */}
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">جاري التحميل...</TableCell></TableRow>
              ) : periods.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد فترات لهذه الكلية</TableCell></TableRow>
              ) : (
                periods.map((p, idx) => (
                  <TableRow key={p.id}>
                    {/* تم إضافة text-right للخلايا لتطابق العناوين */}
                    <TableCell className="text-right font-medium">{idx + 1}</TableCell>
                    <TableCell className="text-right font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.start}</TableCell>
                    <TableCell className="text-right">{p.end}</TableCell>
                    <TableCell className="text-right">
                        {p.sessionType === "LECTURE" ? "محاضرة" : p.sessionType === "LAB" ? "معمل" : "حلقة"}
                    </TableCell>
                    {/* توسيط أزرار الإجراءات */}
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {can('periods.update') && (
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        )}
                        {can('periods.delete') && (
                        <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}