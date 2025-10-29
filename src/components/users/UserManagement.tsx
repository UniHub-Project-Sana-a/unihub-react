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
import { useAuth } from "@/context/AuthContext";

type ApiUser = {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  academic_number: string;
  gender: number;
  user_type_id: number;
  college_id?: number | null;
  status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiUserType = { user_type_id: number; user_type_name: string; user_type_code: string; };
type ApiCollege = { college_id: number; college_name: string; };

const userSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(6, "أدخل رقم هاتف صحيح"),
  academic_number: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  gender: z.enum(["0", "1"]),
  user_type_id: z.string().min(1, "الدور مطلوب"),
  college_id: z.string().optional(),
});
type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const { toast } = useToast();
  const { user: me } = useAuth();
  
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userTypes, setUserTypes] = useState<ApiUserType[]>([]);
  const [colleges, setColleges] = useState<ApiCollege[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const addUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "" },
  });

  const editUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "" },
  });

  const myUserType = useMemo(() => {
    if (!me) return null;
    return userTypes.find(t => t.user_type_id === me.user_type_id) || null;
  }, [me, userTypes]);

  const roleNameById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_name || "غير معروف";
  const roleCodeById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_code || "";

const allowedRoleCodesForCreate = useMemo(() => {
  const code = myUserType?.user_type_code || "";
  if (code === "admin" || code === "presidency") return ["dean"];
  if (code === "dean") {
    return userTypes
      .filter(t => !["student", "lecturer", "admin", "dean"].includes(t.user_type_code))
      .map(t => t.user_type_code);
  }
  return [];
}, [myUserType, userTypes]);

  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/v1/users", { params: { per_page: 200 } });
      setUsers(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [usersRes, typesRes, collegesRes] = await Promise.all([
          api.get("/v1/users", { params: { per_page: 200 } }),
          api.get("/v1/lookups/user-types"),
          api.get("/v1/lookups/colleges"),
        ]);
        setUsers(usersRes.data?.data ?? usersRes.data);
        setUserTypes(typesRes.data?.data ?? typesRes.data);
        setColleges(collegesRes.data?.data ?? collegesRes.data);
      } catch {
        toast({ title: "خطأ", description: "فشل تحميل البيانات", variant: "destructive" });
      }
    };
    fetchLookups();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const code = myUserType?.user_type_code || "";
      if (code === "admin" || code === "presidency") {
        if (collegeFilter !== "all" && u.college_id !== Number(collegeFilter)) return false;
        return true;
      }
      if (code === "dean") {
        return u.college_id === me?.college_id;
      }
      return true;
    }).filter(u => {
      const q = searchQuery.toLowerCase();
      const rn = roleNameById(u.user_type_id).toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || rn.includes(q);
    }).filter(u => {
      if (roleFilter === "all") return true;
      return roleNameById(u.user_type_id).toLowerCase() === roleFilter;
    }).filter(() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return true;
      if (statusFilter === "suspended") return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, collegeFilter, myUserType]);

  const onAddUser: SubmitHandler<UserFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        academic_number: data.academic_number,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
        password: "123",
        college_id: data.college_id ? Number(data.college_id) : null
      };
      await api.post("/v1/users", payload, { headers: { "X-College-Id": data.college_id || "1" } });
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

 const onEditUser: SubmitHandler<UserFormData> = async (data) => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        academic_number: data.academic_number,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
      };
      await api.put(`/v1/users/${editingUser.user_id}`, payload, { headers: { "X-College-Id": data.college_id || "1" } });
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

    const toggleUserStatus = async (user: ApiUser) => {
    try {
      await api.put(`/v1/users/${user.user_id}`, { status: !user.status });
      toast({ title: "نجاح", description: "تم تحديث حالة المستخدم" });
      await fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل تحديث حالة المستخدم", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await api.delete(`/v1/users/${userId}`);
      toast({ title: "نجاح", description: "تم حذف المستخدم بنجاح" });
      await fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف المستخدم", variant: "destructive" });
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

const getRoleColor = (role: string) => {
  switch (role) {
    case "Admin":
      return "bg-red-100 text-red-700";
    case "Department Head":
      return "bg-purple-100 text-purple-700";
    case "Instructor":
      return "bg-blue-100 text-blue-700";
    case "Student":
      return "bg-green-100 text-green-700";
    case "Dean":
      return "bg-amber-100 text-amber-700";
    case "Academic":
      return "bg-cyan-100 text-cyan-700";
    case "Control":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const handleSelectUser = (userId: number, checked: boolean) => {
  const next = new Set(selectedUsers);
  if (checked) next.add(userId);
  else next.delete(userId);
  setSelectedUsers(next);
};
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
  } else {
    setSelectedUsers(new Set());
  }
};

  return (
    <div className="space-y-6">
      {/* الرأس والأزرار */}
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
          {/* <Button variant="outline" onClick={() => toast({ title: "قريبًا" })}><Upload className="w-4 h-4 mr-2" />استيراد</Button> */}
          <Button variant="outline" onClick={() => toast({ title: "قريبًا" })}><Download className="w-4 h-4 mr-2" />تصدير</Button>
          {(myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency" || myUserType?.user_type_code === "dean") && (
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                </DialogHeader>
                <Form {...addUserForm}>
                  <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addUserForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الاسم الكامل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="ادخل رقم الهاتف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="academic_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرقم الأكاديمي</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الرقم الأكاديمي" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>النوع</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر النوع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">ذكر</SelectItem>
                                <SelectItem value="1">أنثى</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="user_type_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدور</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {userTypes
                                  .filter(t => allowedRoleCodesForCreate.includes(t.user_type_code))
                                  .map((type) => (
                                    <SelectItem key={type.user_type_id} value={String(type.user_type_id)}>
                                      {type.user_type_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* ... */}
                      <FormField
                        control={addUserForm.control}
                        name="college_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكلية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الكلية" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {myUserType?.user_type_code === "dean"
                                  ? colleges
                                      .filter(c => c.college_id === me?.college_id)
                                      .map((college) => (
                                        <SelectItem key={college.college_id} value={String(college.college_id)}>
                                          {college.college_name}
                                        </SelectItem>
                                      ))
                                  : colleges.map((college) => (
                                      <SelectItem key={college.college_id} value={String(college.college_id)}>
                                        {college.college_name}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* ... */}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isLoading}>إلغاء</Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        إنشاء مستخدم
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="academic_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم الأكاديمي</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النوع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">ذكر</SelectItem>
                          <SelectItem value="1">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="user_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userTypes
                            .filter(t => allowedRoleCodesForCreate.includes(t.user_type_code))
                            .map((type) => (
                              <SelectItem key={type.user_type_id} value={String(type.user_type_id)}>
                                {type.user_type_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
      
                {/* حقل الكلية (يظهر فقط للمشرف العام) */}
                {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                  <FormField
                    control={editUserForm.control}
                    name="college_id"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>الكلية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الكلية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colleges.map((college) => (
                              <SelectItem key={college.college_id} value={String(college.college_id)}>
                                {college.college_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)} disabled={isLoading}>إلغاء</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ... بطاقات الملخص ... */}
      </div>

      {/* الجدول */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2"><Users className="w-5 h-5" /><span>جميع المستخدمين ({filteredUsers.length})</span></div>
            <div className="flex items-center gap-4">
              {/* <Input placeholder="ابحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-72 pl-10" /> */}
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">معلق</SelectItem></SelectContent></Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {userTypes.map((type) => (
                    <SelectItem key={type.user_type_id} value={roleNameById(type.user_type_id).toLowerCase()}>
                      {type.user_type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency" ? (
                <Select value={collegeFilter} onValueChange={setCollegeFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="all">كل الكليات</SelectItem>
                  {colleges.map(c => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}
                </SelectContent></Select>
              ) : null}
            </div>
          </CardTitle>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">تم تحديد {selectedUsers.size} مستخدم</p>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="outline" size="sm" onClick={() => toast({ title: "قريبًا" })}><Download className="w-4 h-4 mr-2" />تصدير المحدد</Button>
              {/* <Button variant="outline" size="sm" onClick={() => toast({ title: "قريبًا" })}><UserCheck className="w-4 h-4 mr-2" />تعديل جماعي</Button> */}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} /></TableHead><TableHead>المستخدم</TableHead><TableHead>الدور</TableHead><TableHead>الحالة</TableHead><TableHead>آخر تحديث</TableHead><TableHead>الإجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground"><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />جارٍ التحميل...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا يوجد بيانات مطابقة</TableCell></TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const roleLabel = displayRoleName(roleCodeById(user.user_type_id), roleNameById(user.user_type_id));
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell><Checkbox checked={selectedUsers.has(user.user_id)} onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)} /></TableCell>
                      <TableCell><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center"><span className="text-primary-foreground font-medium">{user.full_name.split(" ").map((n) => n[0]).join("")}</span></div><div><p className="font-medium">{user.full_name}</p><div className="flex items-center text-sm text-muted-foreground"><Mail className="w-3 h-3 mr-1" />{user.email}</div></div></div></TableCell>
                      <TableCell><Badge className={getRoleColor(roleLabel)}>{roleLabel}</Badge></TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-700">Active</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.updated_at ?? "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* الشرط:
                                1. إذا كان المستخدم الحالي مشرفًا عامًا والمستخدم المستهدف عميدًا أو مشرفًا عامًا آخر.
                                2. إذا كان المستخدم الحالي عميدًا والمستخدم المستهدف ليس هو نفسه.
                            */}
                            {((myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') &&
                              ['dean', 'admin', 'presidency'].includes(roleCodeById(user.user_type_id))) ||
                            (myUserType?.user_type_code === 'dean' && user.user_id !== me?.user_id) ? (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setEditingUser(user);
                                  editUserForm.reset({
                                    full_name: user.full_name,
                                    email: user.email,
                                    phone: user.phone,
                                    academic_number: user.academic_number,
                                    gender: String(user.gender) as "0" | "1",
                                    user_type_id: String(user.user_type_id),
                                    college_id: String(user.college_id || "")
                                  });
                                  setIsEditUserOpen(true);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  تعديل المستخدم
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.user_id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  حذف المستخدم
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem disabled>عرض فقط</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}