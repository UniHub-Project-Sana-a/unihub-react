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
import { usePermission } from "@/hooks/usePermission";

type ApiTitle = {
  title_id: number;
  title_name: string;
  title_code: string;
  hourly_price: number | string;
  college_id: number;
};

type Title = {
  id: number;
  name: string;
  code: string;
  hourlyPrice: number;
  collegeId: number;
};

interface AcademicTitlesModuleProps {
  collegeId: string;
}

export default function AcademicTitlesModule({ collegeId }: AcademicTitlesModuleProps) {
  const { can } = usePermission();
  const { toast } = useToast();

  const [titles, setTitles] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    hourlyPrice: 0,
  });
  

  const fetchTitles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/v1/academic-titles", { params: { college_id: collegeId } });
      const raw: ApiTitle[] = res.data?.data ?? res.data;
      const mapped: Title[] = raw.map((t) => ({
        id: t.title_id,
        name: t.title_name,
        code: t.title_code,
        hourlyPrice: Number(t.hourly_price ?? 0),
        collegeId: Number(t.college_id),
      }));
      // ترتيب اختياري بالاسم
      setTitles(mapped.sort((a, b) => a.name.localeCompare(b.name, "ar")));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الدرجات الأكاديمية", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!collegeId) return;
    fetchTitles();
  }, [collegeId]);

  const openAdd = () => {
    setEditingTitle(null);
    setFormData({ name: "", code: "", hourlyPrice: 0 });
    setIsDialogOpen(true);
  };

  const openEdit = (t: Title) => {
    setEditingTitle(t);
    setFormData({
      name: t.name,
      code: t.code,
      hourlyPrice: t.hourlyPrice,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الدرجة الأكاديمية؟")) return;
    try {
      await api.delete(`/v1/academic-titles/${id}`);
      toast({ title: "نجاح", description: "تم حذف الدرجة الأكاديمية" });
      await fetchTitles();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف الدرجة الأكاديمية";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title_name: formData.name,
        title_code: formData.code,
        hourly_price: Number(formData.hourlyPrice),
        college_id: Number(collegeId),
      };

      if (editingTitle) {
        await api.put(`/v1/academic-titles/${editingTitle.id}`, payload);
        toast({ title: "نجاح", description: "تم تعديل الدرجة الأكاديمية" });
      } else {
        await api.post("/v1/academic-titles", payload);
        toast({ title: "نجاح", description: "تم إنشاء الدرجة الأكاديمية" });
      }

      setIsDialogOpen(false);
      setEditingTitle(null);
      await fetchTitles();
    } catch (error: any) {
      const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل حفظ الدرجة الأكاديمية";
      const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل حفظ الدرجة الأكاديمية";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">الدرجات الأكاديمية</h2>
        {can('academic_titles.create') && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة درجة
          </Button>
        )}
      </div>

      {/* Dialog form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTitle ? "تعديل درجة أكاديمية" : "إضافة درجة أكاديمية"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم الدرجة الأكاديمية *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>الكود الأكاديمي *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  required
                />
              </div>
             <div>
               <Label>أجر الساعة (ريال)</Label>
               <Input
                 type="number"
                 step="0.01"
                 min={0}
                 value={formData.hourlyPrice ?? ""} // يسمح يكون فاضي أثناء الكتابة
                 onChange={(e) =>
                   setFormData((p) => ({
                     ...p,
                     hourlyPrice: e.target.value === "" ? (undefined as any) : Number(e.target.value),
                   }))
                 }
                 onBlur={() => {
                   // لو بقي فاضي عند الخروج، رجّعه 0 أو أي قيمة افتراضية تريدها
                   if (formData.hourlyPrice == null || Number.isNaN(formData.hourlyPrice as any)) {
                     setFormData((p) => ({ ...p, hourlyPrice: 0 }));
                   }
                 }}
               />
             </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTitle ? "حفظ التغييرات" : "إنشاء"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Titles table */}
      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                {/* ضبط المحاذاة لليمين للعناوين */}
                <TableHead className="text-right w-[50px]">#</TableHead>
                <TableHead className="text-right">اسم الدرجة</TableHead>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">أجر الساعة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">جاري التحميل...</TableCell>
                </TableRow>
              ) : titles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    لا توجد درجات أكاديمية لهذه الكلية
                  </TableCell>
                </TableRow>
              ) : (
                titles.map((t, i) => (
                  <TableRow key={t.id}>
                    {/* ضبط المحاذاة لليمين للخلايا */}
                    <TableCell className="text-right font-medium">{i + 1}</TableCell>
                    <TableCell className="text-right font-medium">{t.name}</TableCell>
                    <TableCell className="text-right">{t.code}</TableCell>
                    <TableCell className="text-right">{t.hourlyPrice}</TableCell>
                    {/* توسيط الإجراءات */}
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {can('academic_titles.update') && (
                        <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        )}
                        {can('academic_titles.delete') && (
                        <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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