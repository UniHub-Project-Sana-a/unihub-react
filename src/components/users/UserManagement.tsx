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
import { Plus, Search, Edit, Trash2, Shield, Users, Mail, Download, Upload, UserCheck, UserX, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ApiUser = {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  academic_number: string;
  gender: number;
  user_type_id: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiUserType = {
  user_type_id: number;
  user_type_name: string;
  user_type_code: string;
};

const userSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(6, "أدخل رقم هاتف صحيح"),
  user_type_id: z.string().min(1, "الدور مطلوب"),
});
type UserFormData = z.infer<typeof userSchema>;

const editUserSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(6, "أدخل رقم هاتف صحيح"),
  user_type_id: z.string().min(1, "الدور مطلوب"),
});
type EditUserFormData = z.infer<typeof editUserSchema>;

const COLLEGE_ID = "1";

export function UserManagement() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userTypes, setUserTypes] = useState<ApiUserType[]>([]);
  const [loadingUserTypes, setLoadingUserTypes] = useState(true);
  const [me, setMe] = useState<ApiUser | null>(null);

  const addUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", user_type_id: "" },
  });

  const editUserForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: "", email: "", phone: "", user_type_id: "" },
  });

  const myUserType = useMemo(() => {
    if (!me) return null;
    return userTypes.find(t => t.user_type_id === me.user_type_id) || null;
  }, [me, userTypes]);

  const roleNameById = (id?: number) => {
    const t = userTypes.find(x => x.user_type_id === id);
    return t ? t.user_type_name : "غير معروف";
  };

  const roleCodeById = (id?: number) => {
    const t = userTypes.find(x => x.user_type_id === id);
    return t ? t.user_type_code : "";
  };

  const allowedRoleCodesForView = useMemo(() => {
    const code = myUserType?.user_type_code || "";
    if (code === "admin" || code === "presidency") return ["dean"];
    if (code === "dean") return ["dept_head", "academic", "control"];
    return [];
  }, [myUserType]);

  const allowedRoleIdsForView = useMemo(
    () => userTypes.filter(t => allowedRoleCodesForView.includes(t.user_type_code)).map(t => t.user_type_id),
    [userTypes, allowedRoleCodesForView]
  );

  const allowedRoleIdsForCreate = allowedRoleIdsForView;

  const fetchMe = async () => { try { const res = await api.get("/v1/auth/me"); setMe(res.data?.data ?? res.data); } catch {} };

  const fetchUserTypes = async () => {
    setLoadingUserTypes(true);
    try {
      const res = await api.get("/v1/lookups/user-types"); // <-- التغيير هنا
      setUserTypes(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل أنواع المستخدم", variant: "destructive" });
    } finally {
      setLoadingUserTypes(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/v1/users", { params: { q: searchQuery, per_page: 100 } });
      setUsers(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchMe(); fetchUserTypes(); }, []);
  useEffect(() => { fetchUsers(); }, [searchQuery]);

  const filteredUsers = users
  .filter(u => {
    const code = myUserType?.user_type_code || "";
    if (code === "admin" || code === "presidency") {
      return allowedRoleIdsForView.includes(u.user_type_id);
    }
    if (code === "dean") {
      return allowedRoleIdsForView.includes(u.user_type_id);
    }
    return true; // <-- عرض جميع المستخدمين لأي دور آخر
  })
  .filter(u => {
    const q = searchQuery.toLowerCase();
    const rn = roleNameById(u.user_type_id).toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || rn.includes(q);
  })
  .filter(u => {
    if (roleFilter === "all") return true;
    return roleNameById(u.user_type_id).toLowerCase() === roleFilter;
  })
  .filter(() => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return true;
    if (statusFilter === "suspended") return false;
    return true;
  });

  const activeUsers = filteredUsers.length;
  const suspendedUsers = 0;

  const roleFilterItems = useMemo(() => [
    { value: "all", label: "كل الأدوار" },
    { value: "admin", label: "مسؤول" },
    { value: "department head", label: "رئيس قسم" },
    { value: "instructor", label: "محاضر" },
    { value: "dean", label: "عميد" },
    { value: "academic", label: "شؤون أكاديمية" },
    { value: "control", label: "كنترول" },
  ], []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
      case "مسؤول":
        return "bg-red-100 text-red-700";
      case "Department Head":
      case "رئيس قسم":
        return "bg-purple-100 text-purple-700";
      case "Instructor":
      case "محاضر":
        return "bg-blue-100 text-blue-700";
      case "Student":
      case "طالب":
        return "bg-green-100 text-green-700";
      case "Dean":
      case "عميد":
        return "bg-amber-100 text-amber-700";
      case "Academic":
      case "شؤون أكاديمية":
        return "bg-cyan-100 text-cyan-700";
      case "Control":
      case "كنترول":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const displayRoleName = (code: string, fallback: string) => {
    switch (code) {
      case "admin":
      case "presidency":
        return "Admin";
      case "dean":
        return "Dean";
      case "dept_head":
        return "Department Head";
      case "academic":
        return "Academic";
      case "control":
        return "Control";
      case "lecter":
      case "lecturer":
        return "Instructor";
      case "student":
        return "Student";
      default:
        return fallback || code;
    }
  };

  const onAddUser: SubmitHandler<UserFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: "P@ssw0rd",
        academic_number: `ADM-${Date.now()}`,
        gender: 0,
        user_type_id: Number(data.user_type_id),
      };
      await api.post("/v1/users", payload, { headers: { "X-College-Id": COLLEGE_ID } });
      toast({ title: "نجاح", description: "تم إنشاء المستخدم بنجاح" });
      addUserForm.reset();
      setIsAddUserOpen(false);
      await fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في إنشاء المستخدم";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditUser: SubmitHandler<EditUserFormData> = async (data) => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        user_type_id: Number(data.user_type_id),
      };
      await api.put(`/v1/users/${editingUser.user_id}`, payload, { headers: { "X-College-Id": COLLEGE_ID } });
      toast({ title: "نجاح", description: "تم تحديث المستخدم بنجاح" });
      editUserForm.reset();
      setIsEditUserOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في تحديث المستخدم";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (u: ApiUser) => {
    setEditingUser(u);
    editUserForm.reset({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      user_type_id: String(u.user_type_id),
    });
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/v1/users/${userId}`, { headers: { "X-College-Id": COLLEGE_ID } });
      toast({ title: "نجاح", description: "تم حذف المستخدم بنجاح" });
      await fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف المستخدم", variant: "destructive" });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    else setSelectedUsers(new Set());
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const next = new Set(selectedUsers);
    if (checked) next.add(userId);
    else next.delete(userId);
    setSelectedUsers(next);
  };

  const roleOptionsForCreate = useMemo(() => {
    return userTypes
      .filter(t => allowedRoleIdsForCreate.includes(t.user_type_id))
      .map(t => ({
        value: String(t.user_type_id),
        label: displayRoleName(t.user_type_code, t.user_type_name),
        code: t.user_type_code,
      }));
  }, [userTypes, allowedRoleIdsForCreate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            {myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency"
              ? "إدارة العمداء على مستوى الجامعة"
              : myUserType?.user_type_code === "dean"
              ? "إدارة المستخدمين الإداريين ضمن الكلية"
              : "عرض المستخدمين"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({ title: "قريبًا" })}><Upload className="w-4 h-4 mr-2" />استيراد</Button>
          <Button variant="outline" onClick={() => toast({ title: "قريبًا" })}><Download className="w-4 h-4 mr-2" />تصدير</Button>
          {(myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency" || myUserType?.user_type_code === "dean") && (
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />إضافة مستخدم</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>إضافة مستخدم جديد</DialogTitle></DialogHeader>
                <Form {...addUserForm}>
                  <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={addUserForm.control} name="full_name" render={({ field }) => (
                        <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="أدخل الاسم الكامل" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={addUserForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={addUserForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input placeholder="أدخل رقم الهاتف" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={addUserForm.control} name="user_type_id" render={({ field }) => (
                        <FormItem><FormLabel>الدور</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {loadingUserTypes ? <div>...</div> : roleOptionsForCreate.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">لا توجد أدوار متاحة</div> : roleOptionsForCreate.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isLoading}>إلغاء</Button>
                      <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}إنشاء مستخدم</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ... بقية JSX كما هو ... */}
    </div>
  );
}