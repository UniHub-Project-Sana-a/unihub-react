import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Settings, Edit, Trash2, Plus, UserPlus, Loader2, Lock, FolderKey, CheckSquare, Search } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const { user: me } = useAuth(); 

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
  const [permissionSearch, setPermissionSearch] = useState("");

  // --- Helpers ---
  const myUserType = useMemo(() => {
    if (!me) return null;
    const typeId = (me as any).user_type_id || (me as any).user_type?.user_type_id;
    return userTypes.find(t => t.user_type_id === Number(typeId)) || null;
  }, [me, userTypes]);

  const filteredUserTypes = useMemo(() => userTypes.filter(t => t.user_type_code !== 'student'), [userTypes]);

  const filteredUsers = useMemo(() => {
    if (!me) return [];
    const code = myUserType?.user_type_code || "";
    if (code === "admin" || code === "presidency") return users;
    if (code === "dean") return users.filter(u => u.college_id === me.college_id);
    return [];
  }, [users, me, myUserType]);

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

  // ✅ تجميع الصلاحيات (Grouped Permissions)
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, ApiPermission[]> = {};
    
    // قاموس لترجمة أسماء المجموعات (اختياري، يمكن استخدام الاسم الإنجليزي)
    const groupNames: Record<string, string> = {
        'users': 'المستخدمين', 'roles': 'الأدوار', 'colleges': 'الكليات', 
        'departments': 'الأقسام', 'programs': 'البرامج', 'levels': 'المستويات', 
        'semesters': 'الفصول', 'courses': 'المقررات', 'buildings': 'المباني',
        'classrooms': 'القاعات', 'periods': 'الفترات', 'lecturers': 'المحاضرين',
        'students': 'الطلاب', 'groups': 'المجموعات', 'timetable': 'الجدول الدراسي',
        'financial': 'الشؤون المالية', 'financial_cycles': 'الكشوف المالية',
        'attendance': 'الحضور', 'sessions': 'الجلسات', 'makeup': 'التعويض',
        'excuses': 'الأعذار', 'grades': 'الدرجات', 'assessments': 'التقييمات',
        'settings': 'الإعدادات', 'audit_logs': 'السجلات', 'devices': 'الأجهزة',
        'dashboard': 'لوحة التحكم'
    };

    permissions
      .filter(perm => {
          const q = permissionSearch.toLowerCase();
          return perm.permission_name.toLowerCase().includes(q) || 
                 perm.permission_key.toLowerCase().includes(q);
      })
      .forEach(perm => {
        const keyParts = perm.permission_key.split('.');
        const groupKey = keyParts[0]; 
        const groupName = groupNames[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
        
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(perm);
    });

    return groups;
  }, [permissions, permissionSearch]);

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
      fetchData(); 
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
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
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

          {/* زر إنشاء دور */}
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
        <div className="lg:col-span-3 space-y-4">
            <Card className="h-full border-l-4 border-l-primary/50 shadow-sm">
                <CardHeader className="pb-3 bg-muted/10">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> قائمة الأدوار
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 max-h-[600px] overflow-y-auto">
                    {filteredUserTypes.map(role => (
                        <div 
                            key={role.user_type_id}
                            onClick={() => setSelectedRole(role)}
                            className={`p-2.5 rounded-md border cursor-pointer transition-all flex items-center justify-between group text-sm ${
                                selectedRole?.user_type_id === role.user_type_id 
                                ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                                : 'hover:bg-muted hover:border-primary/30 bg-card'
                            }`}
                        >
                            <span className="font-medium truncate">
                                {displayRoleName(role.user_type_code, role.user_type_name)}
                            </span>
                            
                            {/* أزرار التعديل والحذف (للمشرف فقط) */}
                            {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className={`h-6 w-6 ${selectedRole?.user_type_id === role.user_type_id ? 'text-white hover:text-white/80 hover:bg-white/20' : 'text-muted-foreground'}`} onClick={(e) => { e.stopPropagation(); setEditingRole(role); editRoleForm.reset({name: role.user_type_name, code: role.user_type_code}); setIsEditRoleOpen(true); }}>
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className={`h-6 w-6 ${selectedRole?.user_type_id === role.user_type_id ? 'text-white hover:text-white/80 hover:bg-white/20' : 'text-destructive hover:bg-destructive/10'}`} onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.user_type_id); }}>
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
        <div className="lg:col-span-9">
            <Card className="h-full border shadow-sm">
                <CardHeader className="pb-4 border-b bg-muted/5">
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                      
                      {/* العنوان والوصف */}
                      <div className="min-w-[200px]">
                          <CardTitle className="flex items-center gap-2 text-lg">
                              <Settings className="w-5 h-5 text-primary" />
                              مصفوفة الصلاحيات
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                              الدور الحالي: 
                              <Badge variant="outline" className="text-primary border-primary/30">
                                  {selectedRole ? displayRoleName(selectedRole.user_type_code, selectedRole.user_type_name) : "—"}
                              </Badge>
                          </CardDescription>
                      </div>
                      {/* ✅ خانة البحث الجديدة (في الوسط) */}
                      <div className="relative w-full xl:w-96 order-last xl:order-none">
                          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                              placeholder="بحث سريع في الصلاحيات..." 
                              value={permissionSearch}
                              onChange={(e) => setPermissionSearch(e.target.value)}
                              className="pr-9 bg-background focus-visible:ring-primary/20 transition-all"
                          />
                      </div>
                      {/* College Selector & Save */}
                      <div className="flex items-center gap-3 w-full sm:w-auto bg-card p-1.5 rounded-lg border shadow-sm shrink-0">
                          {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') ? (
                              <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                                  <SelectTrigger className="w-full sm:w-[180px] h-9 border-none focus:ring-0 shadow-none bg-transparent">
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                          <FolderKey className="w-4 h-4" />
                                          <SelectValue placeholder="اختر الكلية..." />
                                      </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                      {colleges.map(c => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          ) : (
                              <div className="flex items-center gap-2 px-3 text-sm font-medium text-muted-foreground">
                                  <FolderKey className="w-4 h-4" />
                                  {colleges.find(c => String(c.college_id) === selectedCollegeId)?.college_name || "كليتك"}
                              </div>
                          )}
                          
                          <div className="h-6 w-px bg-border mx-1"></div>
                          <Button size="sm" onClick={savePermissions} disabled={!selectedRole || !selectedCollegeId}>
                              حفظ التغييرات
                          </Button>
                      </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-slate-50/30 min-h-[500px]">
                    {!selectedRole ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Shield className="w-16 h-16 opacity-10 mb-4" />
                            <p>اختر دوراً من القائمة الجانبية للبدء.</p>
                        </div>
                    ) : !selectedCollegeId ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Lock className="w-16 h-16 opacity-10 mb-4" />
                            <p>يجب تحديد الكلية أولاً (سياق الصلاحية) لعرض الخيارات.</p>
                        </div>
                    ) : (
                        // ✅ العرض المحسن (Accordion Groups)
                        <div className="space-y-4">
                            {Object.entries(groupedPermissions).map(([groupName, groupPerms], idx) => (
                                <Accordion type="single" collapsible defaultValue={`item-${idx}`} key={groupName} className="bg-white border rounded-lg shadow-sm">
                                    <AccordionItem value={`item-${idx}`} className="border-0">
                                        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/20 rounded-t-lg py-3">
                                            <div className="flex items-center gap-2">
                                                <FolderKey className="w-4 h-4 text-primary/70" />
                                                <span className="font-bold text-sm text-foreground">{groupName}</span>
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-2">
                                                    {groupPerms.filter(p => assignedPermIds.includes(p.permission_id)).length} / {groupPerms.length}
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 pt-2 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {groupPerms.map((perm) => {
                                                    const isChecked = assignedPermIds.includes(perm.permission_id);
                                                    return (
                                                        <div 
                                                            key={perm.permission_id} 
                                                            className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-all group ${
                                                                isChecked 
                                                                ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                                                : 'bg-gray-50/50 border-transparent hover:bg-white hover:border-gray-200'
                                                            }`}
                                                            onClick={() => {
                                                                const next = new Set(assignedPermIds);
                                                                if(!isChecked) next.add(perm.permission_id);
                                                                else next.delete(perm.permission_id);
                                                                setAssignedPermIds(Array.from(next));
                                                            }}
                                                        >
                                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40 group-hover:border-primary/50'}`}>
                                                                {isChecked && <CheckSquare className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <div className="grid gap-0.5 leading-none select-none">
                                                                <span className={`text-sm font-medium ${isChecked ? 'text-primary' : 'text-foreground/80'}`}>
                                                                    {perm.permission_name}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground/70 font-mono">
                                                                    {perm.permission_key}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ))}
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