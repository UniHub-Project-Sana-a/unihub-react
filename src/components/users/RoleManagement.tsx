import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Users, Settings, Edit, Trash2, Plus, UserPlus, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ApiUserType = {
  user_type_id: number;
  user_type_name: string;
  user_type_code: string;
};

type ApiPermission = {
  permission_id: number;
  permission_key: string;
  permission_name: string;
  description?: string;
};

type ApiUser = {
  user_id: number;
  full_name: string;
  email: string;
  user_type_id: number;
};

type ApiCollege = {
  college_id: number;
  college_name: string;
};

// مخطط إنشاء/تعديل الدور: اسم الدور + كود الدور (مطابق لقاعدة البيانات)
const roleSchema = z.object({
  name: z.string().min(2, "يجب أن يكون اسم الدور مكوّنًا من حرفين على الأقل"), // user_type_name
  code: z.string().min(2, "يجب إدخال كود الدور"), // user_type_code
});

// مخطط تعيين دور لمستخدم
const assignRoleSchema = z.object({
  userId: z.string().min(1, "يرجى اختيار مستخدم"),
  roleId: z.string().min(1, "يرجى اختيار دور"),
  collegeId: z.string().optional(), // مطلوب للأدوار المرتبطة بكلية
});

type RoleFormData = z.infer<typeof roleSchema>;
type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

export function RoleManagement() {
  const { toast } = useToast();

  // بيانات من API
  const [userTypes, setUserTypes] = useState<ApiUserType[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [colleges, setColleges] = useState<ApiCollege[]>([]);

  // اختيار الدور الحالي
  const [selectedRole, setSelectedRole] = useState<ApiUserType | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(""); // لسياق حفظ الصلاحيات
  const [assignedPermIds, setAssignedPermIds] = useState<number[]>([]);

  // حالات واجهة
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiUserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // نماذج
  const createRoleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", code: "" },
  });

  const editRoleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", code: "" },
  });

  const assignRoleForm = useForm<AssignRoleFormData>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { userId: "", roleId: "", collegeId: "" },
  });

  // تحميل البيانات
  const fetchUserTypes = async () => {
    try {
      // لو لديك LookupsController@userTypes (بدون paginate) فهو مناسب
      const res = await api.get("/v1/user-types");
      const data: ApiUserType[] = res.data?.data ?? res.data;
      setUserTypes(data);
      if (!selectedRole && data.length > 0) setSelectedRole(data[0]);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الأدوار", variant: "destructive" });
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/v1/permissions");
      setPermissions(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الصلاحيات", variant: "destructive" });
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await api.get("/v1/colleges");
      setColleges(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الكليات", variant: "destructive" });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/v1/users", { params: { per_page: 200 } });
      const data = res.data?.data ?? res.data;
      setUsers(data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
    }
  };

  // تحميل الصلاحيات المعينة لدور + كلية
  const loadAssignedPermissions = async (role: ApiUserType | null, collegeId: string) => {
    if (!role || !collegeId) {
      setAssignedPermIds([]);
      return;
    }
    try {
      const res = await api.get(`/v1/user-types/${role.user_type_id}/permissions`, {
        params: { college_id: collegeId },
      });
      const data: ApiPermission[] = res.data?.data ?? res.data;
      setAssignedPermIds(data.map((p) => p.permission_id));
    } catch {
      setAssignedPermIds([]);
    }
  };

  useEffect(() => {
    fetchUserTypes();
    fetchPermissions();
    fetchColleges();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // تحديث الصلاحيات المعيّنة عند تغيير الدور أو الكلية
    loadAssignedPermissions(selectedRole, selectedCollegeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, selectedCollegeId]);

  // ألوان للبطاقات حسب كود الدور (للشكل فقط)
  const colorByCode = (code: string) => {
    switch (code) {
      case "presidency":
      case "admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "dean":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "dept_head":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "academic":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "control":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "lecter":
      case "lecturer":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "student":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // حساب عدد المستخدمين لكل دور (اختياري للعرض)
  const userCountByRoleId = useMemo(() => {
    const map = new Map<number, number>();
    users.forEach((u) => {
      map.set(u.user_type_id, (map.get(u.user_type_id) || 0) + 1);
    });
    return map;
  }, [users]);

  const displayRoleName = (code: string, fallback: string) => {
    switch (code) {
      case "presidency":
      case "admin":
        return "مشرف عام";
      case "dean":
        return "عميد";
      case "dept_head":
        return "رئيس قسم";
      case "academic":
        return "شؤون أكاديمية";
      case "control":
        return "كنترول";
      case "lecter":
      case "lecturer":
        return "محاضر";
      case "student":
        return "طالب";
      default:
        return fallback || code;
    }
  };

  // إنشاء دور
  const onCreateRole = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      await api.post("/v1/user-types", {
        user_type_name: data.name,
        user_type_code: data.code,
      });
      toast({ title: "نجاح", description: "تم إنشاء الدور بنجاح" });
      createRoleForm.reset();
      setIsCreateRoleOpen(false);
      await fetchUserTypes();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في إنشاء الدور";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // تعديل دور
  const onEditRole = async (data: RoleFormData) => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      await api.put(`/v1/user-types/${editingRole.user_type_id}`, {
        user_type_name: data.name,
        user_type_code: data.code,
      });
      toast({ title: "نجاح", description: "تم تحديث الدور بنجاح" });
      editRoleForm.reset();
      setIsEditRoleOpen(false);
      setEditingRole(null);
      await fetchUserTypes();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في تحديث الدور";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // حذف دور
  const handleDeleteRole = async (roleId: number) => {
    try {
      await api.delete(`/v1/user-types/${roleId}`);
      toast({ title: "نجاح", description: "تم حذف الدور بنجاح" });
      if (selectedRole?.user_type_id === roleId) setSelectedRole(null);
      await fetchUserTypes();
    } catch {
      toast({ title: "خطأ", description: "فشل في حذف الدور", variant: "destructive" });
    }
  };

  // فتح نافذة تعديل دور
  const handleEditRole = (role: ApiUserType) => {
    setEditingRole(role);
    editRoleForm.reset({
      name: role.user_type_name,
      code: role.user_type_code,
    });
    setIsEditRoleOpen(true);
  };

  // تغيير حالة اختيار صلاحية لدور
  const togglePermission = (pid: number, checked: boolean) => {
    const set = new Set(assignedPermIds);
    if (checked) set.add(pid);
    else set.delete(pid);
    setAssignedPermIds(Array.from(set));
  };

  // حفظ الصلاحيات للدور + الكلية
  const savePermissions = async () => {
    if (!selectedRole) {
      return toast({ title: "تنبيه", description: "اختر دوراً أولاً", variant: "destructive" });
    }
    if (!selectedCollegeId) {
      return toast({ title: "تنبيه", description: "اختر كلية لحفظ الصلاحيات", variant: "destructive" });
    }
    try {
      await api.post(
        `/v1/user-types/${selectedRole.user_type_id}/permissions/bulk-assign`,
        {
          permission_ids: assignedPermIds,
          college_ids: [Number(selectedCollegeId)],
          mode: "sync",
        },
        { headers: { "X-College-Id": selectedCollegeId } }
      );
      toast({ title: "نجاح", description: "تم تحديث الصلاحيات بنجاح" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل تحديث الصلاحيات";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  // تعيين دور لمستخدم
  const onAssignRole = async (data: AssignRoleFormData) => {
    setIsLoading(true);
    try {
      const userId = Number(data.userId);
      const roleId = Number(data.roleId);
      const role = userTypes.find((t) => t.user_type_id === roleId);
      const roleCode = role?.user_type_code || "";
      const requiresCollege = ["dean", "dept_head", "academic", "control"].includes(roleCode);
      const headers = requiresCollege && data.collegeId ? { "X-College-Id": data.collegeId } : {};

      await api.put(`/v1/users/${userId}`, { user_type_id: roleId }, { headers });
      toast({ title: "نجاح", description: "تم تعيين الدور للمستخدم" });
      assignRoleForm.reset({ userId: "", roleId: "", collegeId: "" });
      setIsAssignRoleOpen(false);
      await fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في تعيين الدور";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* أعلى الصفحة: أزرار إنشاء/تعيين */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الأدوار والصلاحيات</h1>
          <p className="text-muted-foreground">إدارة أدوار المستخدمين وصلاحيات النظام</p>
        </div>

        <div className="flex items-center gap-2">
          {/* تعيين دور لمستخدم */}
          <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                تعيين دور
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>تعيين دور لمستخدم</DialogTitle>
              </DialogHeader>
              <Form {...assignRoleForm}>
                <form onSubmit={assignRoleForm.handleSubmit(onAssignRole)} className="space-y-0">
                  <div className="px-6 pb-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto space-y-4">
                    <FormField
                      control={assignRoleForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اختر مستخدمًا</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر مستخدمًا" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u.user_id} value={String(u.user_id)}>
                                  {u.full_name} ({u.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignRoleForm.control}
                      name="roleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اختر دورًا</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر دورًا" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {userTypes.map((t) => (
                                <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>
                                  {displayRoleName(t.user_type_code, t.user_type_name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* اختيار كلية إذا كان الدور مرتبطًا بكلية */}
                    <FormField
                      control={assignRoleForm.control}
                      name="collegeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الكلية (للأدوار المرتبطة بكلية)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الكلية إن لزم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colleges.map((c) => (
                                <SelectItem key={c.college_id} value={String(c.college_id)}>
                                  {c.college_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAssignRoleOpen(false)}
                      disabled={isLoading}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      تعيين الدور
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* إنشاء دور */}
          <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء دور
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>إنشاء دور جديد</DialogTitle>
              </DialogHeader>
              <Form {...createRoleForm}>
                <form onSubmit={createRoleForm.handleSubmit(onCreateRole)} className="space-y-0">
                  <div className="px-6 pb-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto space-y-4">
                    <FormField
                      control={createRoleForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الدور</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم الدور" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* نستخدم هذا الحقل لكود الدور (مطابقة DB) */}
                    <FormField
                      control={createRoleForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كود الدور</FormLabel>
                          <FormControl>
                            <Textarea placeholder="أدخل كود الدور (مثال: dean, dept_head)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateRoleOpen(false)}
                      disabled={isLoading}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      إنشاء دور
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* مربع حوار تعديل الدور */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>تعديل الدور</DialogTitle>
          </DialogHeader>
          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(onEditRole)} className="space-y-0">
              <div className="px-6 pb-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto space-y-4">
                <FormField
                  control={editRoleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الدور</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الدور" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editRoleForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود الدور</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أدخل كود الدور (مثال: dean, dept_head)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditRoleOpen(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  تحديث الدور
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* بطاقات ملخص الأدوار */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {userTypes.map((role) => (
          <Card key={role.user_type_id} className={`${colorByCode(role.user_type_code)} transition-all duration-200 hover:shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{displayRoleName(role.user_type_code, role.user_type_name)}</h3>
                  <p className="text-sm opacity-80 mt-1">{userCountByRoleId.get(role.user_type_id) || 0} مستخدم</p>
                </div>
                <Shield className="h-8 w-8 opacity-60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الأدوار */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              الأدوار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userTypes.map((role) => (
                <div
                  key={role.user_type_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole?.user_type_id === role.user_type_id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{displayRoleName(role.user_type_code, role.user_type_name)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {userCountByRoleId.get(role.user_type_id) || 0} مستخدم
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.user_type_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* مصفوفة الصلاحيات */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                صلاحيات {selectedRole ? displayRoleName(selectedRole.user_type_code, selectedRole.user_type_name) : "—"}
              </CardTitle>

              {/* اختيار الكلية لسياق الصلاحيات */}
              <div className="flex items-center gap-2">
                <div className="w-56">
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكلية" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c.college_id} value={String(c.college_id)}>
                          {c.college_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={savePermissions} disabled={!selectedRole || !selectedCollegeId}>
                  حفظ الصلاحيات
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!selectedRole ? (
              <div className="text-sm text-muted-foreground">اختر دورًا لعرض صلاحياته</div>
            ) : !selectedCollegeId ? (
              <div className="text-sm text-muted-foreground">اختر الكلية لعرض/تعديل الصلاحيات</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map((p) => {
                  const checked = assignedPermIds.includes(p.permission_id);
                  return (
                    <label key={p.permission_id} className="flex items-center gap-2 p-2 border rounded-md">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(ch) => togglePermission(p.permission_id, Boolean(ch))}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{p.permission_name}</div>
                        <div className="text-muted-foreground text-xs">{p.permission_key}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}