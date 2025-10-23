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
import { useForm } from "react-hook-form";
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
  gender: number; // 0 ذكر، 1 أنثى
  user_type_id: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiUserType = {
  user_type_id: number;
  user_type_name: string;
  user_type_code: string; // presidency, dean, dept_head, academic, control, lecter, student ...
};

type ApiCollege = {
  college_id: number;
  college_name: string;
  college_code?: string | null;
};

type ApiPermission = {
  permission_id: number;
  permission_key: string;
  permission_name: string;
};

// مطابقة قاعدة البيانات (إضافة)
const addSchema = z.object({
  full_name: z.string().min(2, "يجب أن يحتوي الاسم على حرفين على الأقل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  phone: z.string().min(3, "أدخل رقم هاتف صحيح"),
  academic_number: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  gender: z.enum(["0", "1"] as const, { message: "النوع مطلوب" }), // 0
  password: z.string().min(6, "الحد الأدنى 6 أحرف"),
  password_confirmation: z.string().min(6, "الحد الأدنى 6 أحرف"),
  role: z.string().min(1, "يرجى اختيار الدور"), // user_type_id كنص
  college_id: z.string().optional(), // مطلوب عند الدور = dean أو أدوار الكلية
  // صلاحيات الدور (اختيارية) — تُطبق على مستوى نوع المستخدم + الكلية
  permission_ids: z.array(z.number()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "تأكيد كلمة المرور غير متطابق",
  path: ["password_confirmation"],
});

// تعديل مستخدم (دون كلمة مرور)
const editSchema = z.object({
  full_name: z.string().min(2, "يجب أن يحتوي الاسم على حرفين على الأقل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  phone: z.string().min(3, "أدخل رقم هاتف صحيح"),
  academic_number: z.string().min(1, "الرقم الأكاديمي مطلوب"), // إضافة
  gender: z.enum(["0", "1"] as const, { message: "النوع مطلوب" }), // إضافة
  role: z.string().min(1, "يرجى اختيار الدور"),
});

type AddFormData = z.infer<typeof addSchema>;
type EditFormData = z.infer<typeof editSchema>;

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
  const [colleges, setColleges] = useState<ApiCollege[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [me, setMe] = useState<ApiUser | null>(null);

  // نماذج
  const addForm = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      academic_number: "",
      gender: "0",
      password: "",
      password_confirmation: "",
      role: "",
      college_id: "",
      permission_ids: [],
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  const watchRole = addForm.watch("role");
  const selectedRoleType = useMemo(
    () => userTypes.find((t) => String(t.user_type_id) === String(watchRole)),
    [watchRole, userTypes]
  );
  const selectedRoleCode = selectedRoleType?.user_type_code || "";

  // هل يتطلب الدور سياق كلية؟
  const roleRequiresCollege = useMemo(() => {
    // الأدوار المرتبطة بكلية
    return ["dean", "dept_head", "academic", "control"].includes(selectedRoleCode);
  }, [selectedRoleCode]);

  // هل نعرض اختيار الكلية والصلاحيات؟
  const showCollegeAndPermissions = roleRequiresCollege;

  // المستخدم الحالي ونوعه
  const myUserType = useMemo(() => {
    if (!me) return null;
    return userTypes.find((t) => t.user_type_id === me.user_type_id) || null;
  }, [me, userTypes]);

  // أدوار العرض/الإنشاء حسب نوع المستخدم الحالي
  const allowedRoleCodesForView = useMemo(() => {
    const code = myUserType?.user_type_code || "";
    if (code === "admin" || code === "presidency") return ["dean"];
    if (code === "dean") return ["dept_head", "academic", "control"];
    return [];
  }, [myUserType]);

  const allowedRoleIdsForView = useMemo(
    () => userTypes.filter((t) => allowedRoleCodesForView.includes(t.user_type_code)).map((t) => t.user_type_id),
    [userTypes, allowedRoleCodesForView]
  );

  const allowedRoleIdsForCreate = allowedRoleIdsForView;

  // تحميل البيانات
  const fetchMe = async () => {
    try {
      const res = await api.get("/v1/auth/me");
      setMe(res.data?.data ?? res.data);
    } catch {}
  };

  const fetchUserTypes = async () => {
    try {
      const res = await api.get("/v1/user-types");
      setUserTypes(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل أنواع المستخدم", variant: "destructive" });
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

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/v1/permissions");
      setPermissions(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الصلاحيات", variant: "destructive" });
    }
  };

  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/v1/users", { params: { q: searchQuery, per_page: 100 } });
      const data: ApiUser[] = res.data?.data ?? res.data;
      setUsers(data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchUserTypes();
    fetchColleges();
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Helpers
  const roleNameById = (id?: number) => {
    const t = userTypes.find((x) => x.user_type_id === id);
    return t ? t.user_type_name : "—";
  };

  const roleCodeById = (id?: number) => {
    const t = userTypes.find((x) => x.user_type_id === id);
    return t ? t.user_type_code : "";
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

  // فلترة العرض حسب المتطلبات + فلاتر الواجهة
  const filteredUsers = users
    .filter((u) => allowedRoleIdsForView.includes(u.user_type_id))
    .filter((u) => {
      const q = searchQuery.toLowerCase();
      const rn = roleNameById(u.user_type_id).toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || rn.includes(q);
    })
    .filter((u) => {
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

  const roleFilterItems = useMemo(
    () => [
      { value: "all", label: "كل الأدوار" },
      { value: "admin", label: "مسؤول" },
      { value: "department head", label: "رئيس قسم" },
      { value: "instructor", label: "محاضر" },
      { value: "dean", label: "عميد" },
      { value: "academic", label: "شؤون أكاديمية" },
      { value: "control", label: "كنترول" },
    ],
    []
  );

  // إنشاء مستخدم جديد
  const onAddUser = async (data: AddFormData) => {
    setIsLoading(true);
    try {
      const user_type_id = Number(data.role);
      const selType = userTypes.find((t) => t.user_type_id === user_type_id);
      const selCode = selType?.user_type_code || "";
      const collegeIdHeader =
        ["dean", "dept_head", "academic", "control"].includes(selCode) ? data.college_id || "" : "";

      if (["dean", "dept_head", "academic", "control"].includes(selCode) && !collegeIdHeader) {
        toast({ title: "تنبيه", description: "اختر الكلية لهذا الدور", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // 1) إنشاء المستخدم
      await api.post(
        "/v1/users",
        {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          academic_number: data.academic_number,
          gender: Number(data.gender), // 0/1
          user_type_id,
        },
        { headers: collegeIdHeader ? { "X-College-Id": collegeIdHeader } : {} }
      );

      // 2) (اختياري) تعيين صلاحيات الدور لهذه الكلية (خاصة بالعميد/الأدوار المرتبطة بالكلية)
      if (collegeIdHeader && data.permission_ids && data.permission_ids.length > 0) {
        await api.post(
          `/v1/user-types/${user_type_id}/permissions/bulk-assign`,
          {
            permission_ids: data.permission_ids,
            college_ids: [Number(collegeIdHeader)],
            mode: "attach",
          },
          { headers: { "X-College-Id": collegeIdHeader } }
        );
      }

      toast({ title: "نجاح", description: "تم إنشاء المستخدم بنجاح" });
      addForm.reset();
      setIsAddUserOpen(false);
      await fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل في إنشاء المستخدم";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // تعديل مستخدم
  const onEditUser = async (data: EditFormData) => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      const user_type_id = Number(data.role);
      
      await api.put(
        `/v1/users/${editingUser.user_id}`,
        {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          academic_number: data.academic_number, // إضافة
          gender: Number(data.gender), // إضافة
          user_type_id,
        },
        {}
      );
      toast({ title: "نجاح", description: "تم تحديث المستخدم بنجاح" });
      editForm.reset();
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
    editForm.reset({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      academic_number: u.academic_number, // إضافة
      gender: String(u.gender) as "0" | "1", // إضافة
      role: String(u.user_type_id),
    });
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    // تأكيد قبل الحذف
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      return;
    }
    
    try {
      await api.delete(`/api/v1/users/${userId}`, { 
        headers: { "Accept": "application/json" } 
      });
      toast({ 
        title: "نجاح", 
        description: "تم حذف المستخدم بنجاح" 
      });
      
      // إزالة المستخدم من المحدد إن كان محدداً
      if (selectedUsers.has(userId)) {
        const next = new Set(selectedUsers);
        next.delete(userId);
        setSelectedUsers(next);
      }
      
      await fetchUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف المستخدم";
      toast({ 
        title: "خطأ", 
        description: msg, 
        variant: "destructive" 
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUsers(new Set(filteredUsers.map((u) => u.user_id)));
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
      .filter((t) => allowedRoleIdsForCreate.includes(t.user_type_id))
      .map((t) => ({
        value: String(t.user_type_id),
        label: displayRoleName(t.user_type_code, t.user_type_name),
        code: t.user_type_code,
      }));
  }, [userTypes, allowedRoleIdsForCreate]);

  return (
    <div className="space-y-6">
      {/* الرأس */}
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
          <Button variant="outline" onClick={() => toast({ title: "قريبًا", description: "استيراد المستخدمين لاحقًا" })}>
            <Upload className="w-4 h-4 mr-2" />
            استيراد المستخدمين
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "قريبًا", description: "تصدير المستخدمين لاحقًا" })}>
            <Download className="w-4 h-4 mr-2" />
            تصدير المستخدمين
          </Button>

          {(myUserType?.user_type_code === "admin" ||
            myUserType?.user_type_code === "presidency" ||
            myUserType?.user_type_code === "dean") && (
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>            

              {/* نافذة منبثقة عريضة مع جسم قابل للتمرير */}
              <DialogContent className="w-[95vw] sm:max-w-3xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                </DialogHeader>            

                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddUser)} className="space-y-0">
                    {/* الجسم القابل للتمرير */}
                    <div className="px-6 pb-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* full_name */}
                        <FormField
                          control={addForm.control}
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
                        {/* email */}
                        <FormField
                          control={addForm.control}
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
                        {/* phone */}
                        <FormField
                          control={addForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم الهاتف</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل رقم الهاتف" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* academic_number */}
                        <FormField
                          control={addForm.control}
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

                        {/* gender */}
                        <FormField
                          control={addForm.control}
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

                        {/* role */}
                        <FormField
                          control={addForm.control}
                          name="role"
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
                                  {roleOptionsForCreate.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">لا توجد أدوار متاحة</div>
                                  ) : (
                                    roleOptionsForCreate.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />            

                        {/* password */}
                        <FormField
                          control={addForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كلمة المرور</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* password_confirmation */}
                        <FormField
                          control={addForm.control}
                          name="password_confirmation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تأكيد كلمة المرور</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="أكد كلمة المرور" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>            

                      {/* اختيار الكلية والصلاحيات — للأدوار المرتبطة بكلية (مثل عميد) */}
                      {showCollegeAndPermissions && (
                        <div className="space-y-4 border rounded-md p-4">
                          <FormField
                            control={addForm.control}
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

                          <FormField
                            control={addForm.control}
                            name="permission_ids"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>الصلاحيات (تنطبق على هذا الدور ضمن الكلية المختارة)</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-auto border rounded-md p-3">
                                  {permissions.map((p) => {
                                    const checked = (field.value || []).includes(p.permission_id);
                                    return (
                                      <label key={p.permission_id} className="flex items-center gap-2">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(ch) => {
                                            const on = Boolean(ch);
                                            const next = new Set(field.value || []);
                                            if (on) next.add(p.permission_id);
                                            else next.delete(p.permission_id);
                                            field.onChange(Array.from(next));
                                          }}
                                        />
                                        <span className="text-sm">
                                          {p.permission_name} <span className="text-muted-foreground">({p.permission_key})</span>
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>            

                    {/* شريط الأزرار ثابت أسفل النافذة */}
                    <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isLoading}>
                        إلغاء
                      </Button>
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

      {/* مربع حوار تعديل المستخدم */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
      
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-0">
              {/* جسم قابل للتمرير */}
              <div className="px-6 pb-2 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* full_name */}
                  <FormField
                    control={editForm.control}
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
                  
                  {/* email */}
                  <FormField
                    control={editForm.control}
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
                  
                  {/* phone */}
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل رقم الهاتف" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* academic_number - جديد */}
                  <FormField
                    control={editForm.control}
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
                  
                  {/* gender - جديد */}
                  <FormField
                    control={editForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النوع</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  
                  {/* role */}
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدور</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الدور" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userTypes
                              .filter((t) => allowedRoleIdsForCreate.includes(t.user_type_id))
                              .map((t) => (
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
                </div>
              </div>
      
              {/* شريط الأزرار ثابت */}
              <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  تحديث المستخدم
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-blue-700">{loadingList ? "…" : filteredUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">المستخدمون النشطون</p>
                <p className="text-2xl font-bold text-green-700">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-500 rounded-lg">
                <UserX className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">الموقوفون</p>
                <p className="text-2xl font-bold text-red-700">{0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">المسؤولون</p>
                <p className="text-2xl font-bold text-purple-700">
                  {filteredUsers.filter((u) => {
                    const code = roleCodeById(u.user_type_id);
                    return code === "admin" || code === "presidency";
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الجدول */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>جميع المستخدمين ({filteredUsers.length})</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن المستخدمين..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roleFilterItems.map((it) => (
                    <SelectItem key={it.value} value={it.value}>
                      {it.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">تم تحديد {selectedUsers.size} مستخدم</p>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="outline" size="sm" onClick={() => toast({ title: "قريبًا", description: "تصدير المحدد لاحقاً" })}>
                <Download className="w-4 h-4 mr-2" />
                تصدير المحدد
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "قريبًا", description: "تعديل جماعي لاحقاً" })}>
                تعديل جماعي
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تسجيل دخول</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                    جارٍ التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    لا يوجد بيانات مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const code = roleCodeById(user.user_type_id);
                  const roleLabel = displayRoleName(code, roleNameById(user.user_type_id));
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.user_id)}
                          onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-medium">
                              {user.full_name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(roleLabel)}>{roleLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.updated_at ?? "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              تعديل المستخدم
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "ملاحظة", description: "إدارة الصلاحيات على مستوى نوع المستخدم من صفحة الأدوار" })}>
                              <Shield className="w-4 h-4 mr-2" />
                              إدارة الصلاحيات
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "ملاحظة", description: "قريبًا: إيقاف/تفعيل من حالة المستخدم" })}>
                              <UserX className="w-4 h-4 mr-2" />
                              إيقاف المستخدم
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.user_id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              حذف المستخدم
                            </DropdownMenuItem>
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