import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ApiDepartment = {
  department_id: number;
  department_name: string;
  department_code?: string | null;
  college_id: number;
};

const departmentSchema = z.object({
  department_name: z.string().min(2, "الاسم مطلوب"),
  department_code: z.string().optional(),
});
type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentsModuleProps {
  collegeId: string;
}

export default function DepartmentsModule({ collegeId }: DepartmentsModuleProps) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ApiDepartment | null>(null);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { department_name: "", department_code: "" },
  });

  const fetchDepartments = async () => {
    try {
      const res = await api.get(`/v1/departments?college_id=${collegeId}`);
      setDepartments(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" });
    }
  };

  useEffect(() => { fetchDepartments(); }, [collegeId]);

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, college_id: collegeId };
      if (editingDepartment) {
        await api.put(`/v1/departments/${editingDepartment.department_id}`, payload);
        toast({ title: "نجاح", description: "تم تحديث القسم" });
      } else {
        await api.post("/v1/departments", payload);
        toast({ title: "نجاح", description: "تم إنشاء القسم" });
      }
      setIsDialogOpen(false);
      await fetchDepartments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (department: ApiDepartment | null = null) => {
    if (department) {
      setEditingDepartment(department);
      form.reset({
        department_name: department.department_name,
        department_code: department.department_code || "",
      });
    } else {
      setEditingDepartment(null);
      form.reset({ department_name: "", department_code: "" });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/departments/${id}`);
      toast({ title: "نجاح", description: "تم حذف القسم" });
      await fetchDepartments();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف القسم", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">الأقسام</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة قسم
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="department_name" render={({ field }) => (
                <FormItem><FormLabel>اسم القسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="department_code" render={({ field }) => (
                <FormItem><FormLabel>كود القسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingDepartment ? "حفظ التغييرات" : "إنشاء القسم"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>اسم القسم</TableHead>
                <TableHead>كود القسم</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.department_id}>
                  <TableCell>{dept.department_id}</TableCell>
                  <TableCell>{dept.department_name}</TableCell>
                  <TableCell>{dept.department_code || "—"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(dept)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(dept.department_id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}