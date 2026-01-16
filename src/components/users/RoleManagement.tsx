import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Settings, Edit, Trash2, Plus, UserPlus, Loader2, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// --- Types ---
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
  college_id?: number | null;
};

type ApiCollege = {
  college_id: number;
  college_name: string;
};

// --- Schemas ---
const roleSchema = z.object({
  name: z.string().min(2, "يجب أن يكون اسم الدور مكوّنًا من حرفين على الأقل"),
  code: z.string().min(2, "يجب إدخال كود الدور"),
});

const assignRoleSchema = z.object({
  userId: z.string().min(1, "يرجى اختيار مستخدم"),
  roleId: z.string().min(1, "يرجى اختيار دور"),
  collegeId: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;
type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

export function RoleManagement() {
  const { toast } = useToast();
  const { user: me } = useAuth(); // للحصول على صلاحيات المستخدم الحالي

  // --- States ---
  const [userTypes, setUserTypes] = useState<ApiUserType[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [colleges, setColleges] = useState<ApiCollege[]>([]);

  // Selection
  const [selectedRole, setSelectedRole] = useState<ApiUserType | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [assignedPermIds, setAssignedPermIds] = useState<number[]>([]);

  // UI States
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiUserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const createRoleForm = useForm<RoleFormData>({ resolver: zodResolver(roleSchema), defaultValues: { name: "", code: "" } });
  const editRoleForm = useForm<RoleFormData>({ resolver: zodResolver(roleSchema), defaultValues: { name: "", code: "" } });
  const assignRoleForm = useForm<AssignRoleFormData>({ resolver: zodResolver(assignRoleSchema), defaultValues: { userId: "", roleId: "", collegeId: "" } });

  // --- Helpers ---
  const myUserType = useMemo(() => {
    if (!me) return null;
    const typeId = (me as any).user_type_id || (me as any).user_type?.user_type_id;
    return userTypes.find(t => t.user_type_id === Number(typeId)) || null;
  }, [me, userTypes]);

  // تصفية الأدوار (استثناء الطلاب)
  const filteredUserTypes = useMemo(() => {
    return userTypes.filter(t => t.user_type_code !== 'student');
  }, [userTypes]);

  // تصفية المستخدمين بناءً على الصلاحية (المشرف يرى الكل، العميد يرى كليته فقط)
  const filteredUsers = useMemo(() => {
    if (!me) return [];
    const code = myUserType?.user_type_code || "";
    
    if (code === "admin" || code === "presidency") {
      return users; // يرى الجميع
    }
    
    if (code === "dean") {
      return users.filter(u => u.college_id === me.college_id); // يرى كليته فقط
    }
    
    return []; // أدوار أخرى لا ترى شيئاً
  }, [users, me, myUserType]);

  // تحديد الكلية الافتراضية للعميد
  useEffect(() => {
    if (myUserType?.user_type_code === 'dean' && me?.college_id) {
        setSelectedCollegeId(String(me.college_id));
    }
  }, [myUserType, me]);

  const displayRoleName = (code: string, fallback: string) => {
    switch (code) {
      case "presidency": return "رئاسة الجامعة";
      case "admin": return "مشرف عام";
      case "dean": return "عميد";
      case "dept_head": return "رئيس قسم";
      case "academic": return "شؤون أكاديمية";
      case "control": return "كنترول";
      case "lecturer": return "محاضر";
      case "student": return "طالب";
      default: return fallback || code;
    }
  };

  const getRoleColor = (code: string) => {
    switch (code) {
      case "admin": return "bg-red-100 text-red-700 border-red-200";
      case "dean": return "bg-amber-100 text-amber-700 border-amber-200";
      case "lecturer": return "bg-blue-100 text-blue-700 border-blue-200";
      case "dept_head": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // --- API Calls ---
  const fetchData = async () => {
    try {
      const [typesRes, permsRes, collegesRes, usersRes] = await Promise.all([
        api.get("/v1/lookups/user-types"),
        api.get("/v1/lookups/permissions"),
        api.get("/v1/lookups/colleges"),
        api.get("/v1/users", { params: { per_page: 500 } })
      ]);

      const typesData = typesRes.data?.data ?? typesRes.data;
      setUserTypes(typesData);
      
      // تعيين أول دور افتراضي إذا لم يكن محدداً
      if (!selectedRole && typesData.length > 0) {
          const firstValid = typesData.find((t: any) => t.user_type_code !== 'student');
          if (firstValid) setSelectedRole(firstValid);
      }

      setPermissions(permsRes.data?.data ?? permsRes.data);
      setColleges(collegesRes.data?.data ?? collegesRes.data);
      setUsers(usersRes.data?.data ?? usersRes.data);

    } catch (e) {
      toast({ title: "خطأ", description: "فشل تحميل البيانات الأساسية", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // تحميل الصلاحيات المعينة
  useEffect(() => {
    const loadPermissions = async () => {
        if (!selectedRole || !selectedCollegeId) {
            setAssignedPermIds([]);
            return;
        }
        try {
            const res = await api.get(`/v1/user-types/${selectedRole.user_type_id}/permissions`, {
                params: { college_id: selectedCollegeId },
            });
            const data: ApiPermission[] = res.data?.data ?? res.data;
            setAssignedPermIds(data.map((p) => p.permission_id));
        } catch {
            setAssignedPermIds([]);
        }
    };
    loadPermissions();
  }, [selectedRole, selectedCollegeId]);

  // --- Handlers ---
  const onCreateRole = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      await api.post("/v1/user-types", { user_type_name: data.name, user_type_code: data.code });
      toast({ title: "تم بنجاح", description: "تم إنشاء الدور الجديد" });
      createRoleForm.reset();
      setIsCreateRoleOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "فشل الإنشاء", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditRole = async (data: RoleFormData) => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      await api.put(`/v1/user-types/${editingRole.user_type_id}`, { user_type_name: data.name, user_type_code: data.code });
      toast({ title: "تم بنجاح", description: "تم تحديث الدور" });
      editRoleForm.reset();
      setIsEditRoleOpen(false);
      setEditingRole(null);
      fetchData();
    } catch {
      toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("هل أنت متأكد؟ سيتم حذف هذا الدور نهائياً.")) return;
    try {
      await api.delete(`/v1/user-types/${roleId}`);
      toast({ title: "تم الحذف", description: "تم حذف الدور بنجاح" });
      if (selectedRole?.user_type_id === roleId) setSelectedRole(null);
      fetchData();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف (قد يكون الدور مرتبطاً بمستخدمين)", variant: "destructive" });
    }
  };

  const savePermissions = async () => {
    if (!selectedRole || !selectedCollegeId) return;
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
      toast({ title: "تم الحفظ", description: "تم تحديث الصلاحيات للدور المختار" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الصلاحيات", variant: "destructive" });
    }
  };

  const onAssignRole = async (data: AssignRoleFormData) => {
    setIsLoading(true);
    try {
        const headers = data.collegeId ? { "X-College-Id": data.collegeId } : {};
        await api.put(`/v1/users/${data.userId}`, { user_type_id: Number(data.roleId) }, { headers });
        toast({ title: "نجاح", description: "تم تعيين الدور للمستخدم" });
        assignRoleForm.reset();
        setIsAssignRoleOpen(false);
        fetchData();
    } catch {
        toast({ title: "خطأ", description: "فشل تعيين الدور", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-6 container mx-auto px-4 sm:px-6 py-4 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">الأدوار والصلاحيات</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            إدارة هيكل الصلاحيات وتوزيع الأدوار على مستوى {myUserType?.user_type_code === 'dean' ? 'الكلية' : 'النظام'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* زر تعيين دور */}
          <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                تعيين دور لمستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تعيين دور وظيفي</DialogTitle>
                <DialogDescription>اختر المستخدم والدور الذي تريد منحه إياه.</DialogDescription>
              </DialogHeader>
              <Form {...assignRoleForm}>
                <form onSubmit={assignRoleForm.handleSubmit(onAssignRole)} className="space-y-4 pt-4">
                    <FormField control={assignRoleForm.control} name="userId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>المستخدم</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="اختر المستخدم" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {filteredUsers.map(u => <SelectItem key={u.user_id} value={String(u.user_id)}>{u.full_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={assignRoleForm.control} name="roleId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>الدور الجديد</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {filteredUserTypes.map(t => <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>{displayRoleName(t.user_type_code, t.user_type_name)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                        <FormField control={assignRoleForm.control} name="collegeId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>الكلية (اختياري)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="حدد الكلية إن وجد" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {colleges.map(c => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} تعيين</Button>
                    </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* زر إنشاء دور (للمشرف فقط) */}
          {(myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency") && (
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  دور جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء دور جديد</DialogTitle>
                </DialogHeader>
                <Form {...createRoleForm}>
                    <form onSubmit={createRoleForm.handleSubmit(onCreateRole)} className="space-y-4 pt-4">
                        <FormField control={createRoleForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>اسم الدور</FormLabel><FormControl><Input placeholder="مثال: مدير شؤون الطلاب" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={createRoleForm.control} name="code" render={({ field }) => (
                            <FormItem><FormLabel>الكود (بالإنجليزي)</FormLabel><FormControl><Input placeholder="student_affairs_mgr" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter><Button type="submit" disabled={isLoading}>حفظ</Button></DialogFooter>
                    </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar: Roles List */}
        <div className="lg:col-span-4 space-y-4">
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" /> قائمة الأدوار
                    </CardTitle>
                    <CardDescription>اختر دوراً لعرض وتعديل صلاحياته</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {filteredUserTypes.map(role => (
                        <div 
                            key={role.user_type_id}
                            onClick={() => setSelectedRole(role)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                                selectedRole?.user_type_id === role.user_type_id 
                                ? 'bg-primary/10 border-primary shadow-sm' 
                                : 'hover:bg-muted hover:border-primary/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={getRoleColor(role.user_type_code)}>
                                    {role.user_type_code}
                                </Badge>
                                <span className="font-medium text-sm">
                                    {displayRoleName(role.user_type_code, role.user_type_name)}
                                </span>
                            </div>
                            
                            {/* أزرار التعديل والحذف (للمشرف فقط) */}
                            {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingRole(role); editRoleForm.reset({name: role.user_type_name, code: role.user_type_code}); setIsEditRoleOpen(true); }}>
                                        <Edit className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.user_type_id); }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* Main Content: Permissions Matrix */}
        <div className="lg:col-span-8">
            <Card className="h-full border-t-4 border-t-primary/60">
                <CardHeader className="pb-4 border-b bg-muted/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                صلاحيات الدور: <span className="text-primary font-bold underline decoration-dotted underline-offset-4">{selectedRole ? displayRoleName(selectedRole.user_type_code, selectedRole.user_type_name) : "—"}</span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {selectedRole ? "حدد الصلاحيات المسموحة لهذا الدور داخل الكلية المحددة." : "الرجاء اختيار دور من القائمة الجانبية."}
                            </CardDescription>
                        </div>

                        {/* College Selector (Context) */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') ? (
                                <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                                    <SelectTrigger className="w-[200px] bg-background">
                                        <SelectValue placeholder="اختر الكلية للسياق" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colleges.map(c => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : (
                                // للعميد: عرض اسم الكلية فقط (ثابت)
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    {colleges.find(c => String(c.college_id) === selectedCollegeId)?.college_name || "كليتك"}
                                </Badge>
                            )}
                            
                            <Button onClick={savePermissions} disabled={!selectedRole || !selectedCollegeId} className="shadow-sm">
                                حفظ التغييرات
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {!selectedRole ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Shield className="w-16 h-16 opacity-10 mb-4" />
                            <p>اختر دوراً من القائمة للبدء.</p>
                        </div>
                    ) : !selectedCollegeId ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Lock className="w-16 h-16 opacity-10 mb-4" />
                            <p>يجب تحديد الكلية أولاً لعرض الصلاحيات الخاصة بها.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {permissions.map((perm) => {
                                const isChecked = assignedPermIds.includes(perm.permission_id);
                                return (
                                    <div 
                                        key={perm.permission_id} 
                                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isChecked ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/50'}`}
                                    >
                                        <Checkbox 
                                            id={`perm-${perm.permission_id}`} 
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                const next = new Set(assignedPermIds);
                                                if(checked) next.add(perm.permission_id);
                                                else next.delete(perm.permission_id);
                                                setAssignedPermIds(Array.from(next));
                                            }}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label 
                                                htmlFor={`perm-${perm.permission_id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {perm.permission_name}
                                            </label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {perm.description || perm.permission_key}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>تعديل الدور</DialogTitle></DialogHeader>
            <Form {...editRoleForm}>
                <form onSubmit={editRoleForm.handleSubmit(onEditRole)} className="space-y-4 pt-4">
                    <FormField control={editRoleForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editRoleForm.control} name="code" render={({ field }) => (
                        <FormItem><FormLabel>الكود</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter><Button type="submit" disabled={isLoading}>حفظ التغييرات</Button></DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}