import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, Search, Edit, Trash2, Users, Mail, 
  MoreHorizontal, Loader2, Phone, UserCircle, Briefcase,
  Eye, EyeOff, Key, RefreshCw
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

// --- Types ---
type ApiUser = {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  academic_number: string;
  gender: number;
  user_type_id: number;
  college_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiUserType = { user_type_id: number; user_type_name: string; user_type_code: string; };
type ApiCollege = { college_id: number; college_name: string; };

// --- Validation ---
const userSchema = z.object({
  full_name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(6, "أدخل رقم هاتف صحيح"),
  academic_number: z.string().min(1, "الرقم الوظيفي مطلوب"),
  gender: z.string(), 
  user_type_id: z.string().min(1, "الدور مطلوب"),
  college_id: z.string().optional(),
  password: z.string().refine(val => !val || val.length >= 6, {
    message: "كلمة المرور يجب أن لا تقل عن 6 أحرف",
  }).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const { toast } = useToast();
  const { user: me } = useAuth();
  const { can } = usePermission(); 
  
  // --- States ---
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userTypes, setUserTypes] = useState<ApiUserType[]>([]);
  const [colleges, setColleges] = useState<ApiCollege[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

  // Loading
  const [isLoading, setIsLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Forms
  const addUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "", password: "" },
  });

  const editUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "", password: "" },
  });

  // --- Helpers & Computed ---
  const myUserType = useMemo(() => {
    if (!me || userTypes.length === 0) return null;
    // @ts-ignore
    const typeId = me.user_type_id || me.user_type?.user_type_id;
    return userTypes.find(t => t.user_type_id === Number(typeId)) || null;
  }, [me, userTypes]);

  const isCollegeScopedUser =
    !!me?.college_id &&
    !["admin", "presidency"].includes(myUserType?.user_type_code || "");

  const currentCollegeName = useMemo(() => {
    if (isCollegeScopedUser && me?.college_id) {
      return colleges.find(c => c.college_id === me.college_id)?.college_name;
    }
    return null;
  }, [isCollegeScopedUser, me, colleges]);

  const roleNameById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_name || "غير معروف";
  const roleCodeById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_code || "";

  const allowedRoleCodesForCreate = useMemo(() => {
    const code = myUserType?.user_type_code || "";
    let allowed: string[] = [];
    if (code === "admin" || code === "presidency") {
       // المشرف العام يستطيع إنشاء أي دور
       allowed = userTypes.map(t => t.user_type_code);
    } else if (code === "dean" || can('roles.assign_user')) {
      // العميد أو من يملك صلاحية تعيين الأدوار يستطيع إنشاء جميع أدوار الكلية
      allowed = userTypes
        .filter(t => !["admin", "presidency", "dean"].includes(t.user_type_code))
        .map(t => t.user_type_code);
    } else if (
      can('users.create') ||
      can('staff.create') ||
      ["academic_affairs", "dept_head", "control", "classroom_manager", "secretary", "coordinator"].includes(code)
    ) {
      // المنسقون الأكاديميون وأصحاب صلاحية إنشاء المستخدمين يستطيعون إضافة محاضرين
      allowed = ["lecturer"];
    }

    let filtered = allowed.filter(role => role !== 'student');

    // صمام أمان: إذا كان المستخدم يملك صلاحية فتح نافذة الإضافة، تتاح له صلاحية المحاضر كحد أدنى ولا تكون القائمة فارغة إطلاقاً
    if (filtered.length === 0 && (can('users.create') || can('staff.create') || isCollegeScopedUser)) {
      filtered = ["lecturer"];
    }

    return filtered;
  }, [myUserType, userTypes, can, isCollegeScopedUser]);

  const isCollegeRequired = (roleId: string) => {
      const code = roleCodeById(Number(roleId));
      return !["admin", "presidency"].includes(code);
  };

  // --- API Calls ---
  const fetchUsersData = async () => {
    setLoadingList(true);
    try {
      const params: any = { per_page: 10000 };
      
      // Restrict college users to their own college's accounts.
      if (isCollegeScopedUser && me?.college_id) {
          params.college_id = me?.college_id;
      }
      
      // ملاحظة: إذا كان الـ Backend يدعم استبعاد الطلاب، يمكن إضافة شيء مثل:
      // const studentTypeId = userTypes.find(t => t.user_type_code === 'student')?.user_type_id;
      // if (studentTypeId) params.exclude_user_type_id = studentTypeId; 
      // ولكن بما أننا لا نعرف، سنعتمد على الفلترة في المتصفح للحماية

      const res = await api.get("/v1/users", { params });
      setUsers(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين", variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  // المرحلة 1: جلب القوائم
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [typesRes, collegesRes] = await Promise.all([
          api.get("/v1/lookups/user-types"),
          api.get("/v1/lookups/colleges"),
        ]);
        setUserTypes(typesRes.data?.data ?? typesRes.data);
        setColleges(collegesRes.data?.data ?? collegesRes.data);
      } catch {
        toast({ title: "خطأ", description: "فشل تحميل القوائم الأساسية", variant: "destructive" });
        setLoadingList(false);
      }
    };
    fetchLookups();
  }, []);

  // ✅ المرحلة 2: تم إصلاح الخطأ هنا
  useEffect(() => {
    // نعتمد على myUserType الجاهز بدلاً من الدخول في تفاصيل me
    if (userTypes.length > 0 && myUserType) {
        fetchUsersData();
    }
  }, [userTypes.length, myUserType?.user_type_code, isCollegeScopedUser, me?.college_id]);


  // --- Filtering Logic ---

  // 1. القائمة الأساسية: بدون طلاب + قواعد العميد
  const baseUsers = useMemo(() => {
    if (!me || userTypes.length === 0) return [];
    let processed = users;

    // A. استبعاد الطلاب نهائياً (Client-Side Protection)
    processed = processed.filter(u => roleCodeById(u.user_type_id) !== 'student');

    // B. قواعد العميد
    if (myUserType?.user_type_code === "dean") {
        processed = processed.filter(u => {
            const uRole = roleCodeById(u.user_type_id);
            if (['admin', 'presidency'].includes(uRole)) return false;
            // @ts-ignore
            return Number(u.college_id) === Number(me.college_id);
        });
    }
    return processed;
  }, [users, myUserType, me, userTypes]);

  // 2. قائمة العرض (حسب الكلية المحددة من المشرف)
  const usersInView = useMemo(() => {
    if ((myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency") && collegeFilter !== "all") {
        return baseUsers.filter(u => u.college_id === Number(collegeFilter));
    }
    return baseUsers;
  }, [baseUsers, collegeFilter, myUserType]);

  // 3. القائمة النهائية (بحث + فلتر الدور)
  const finalFilteredUsers = useMemo(() => {
    return usersInView.filter(u => {
      const q = searchQuery.toLowerCase();
      const rn = roleNameById(u.user_type_id).toLowerCase();
      return u.full_name.toLowerCase().includes(q) || 
             u.email.toLowerCase().includes(q) || 
             u.academic_number.includes(q) ||
             rn.includes(q);
    }).filter(u => {
      if (roleFilter === "all") return true;
      return u.user_type_id === roleFilter;
    });
  }, [usersInView, searchQuery, roleFilter, userTypes]);

  // 4. أنواع المستخدمين الظاهرة (بدون طالب)
  const visibleUserTypes = useMemo(() => {
    let types = userTypes.filter(t => t.user_type_code !== 'student');
    if (myUserType?.user_type_code === "dean") {
        types = types.filter(t => !['admin', 'presidency'].includes(t.user_type_code));
    }
    return types;
  }, [userTypes, myUserType]);


  // --- Submit Handlers ---
  const onAddUser: SubmitHandler<UserFormData> = async (data) => {
    setIsLoading(true);
    try {
      let finalCollegeId = null;
      if (myUserType?.user_type_code === 'dean') {
        // @ts-ignore
        finalCollegeId = Number(me?.college_id); 
      } else if (data.college_id) {
        finalCollegeId = Number(data.college_id);
      }
      const finalPassword = data.password && data.password.trim() ? data.password.trim() : "12345678";
      const payload = {
        ...data,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
        password: finalPassword,
        college_id: finalCollegeId
      };
      // @ts-ignore
      const headers = myUserType?.user_type_code === 'dean' ? { "X-College-Id": String(me?.college_id) } : {};
      await api.post("/v1/users", payload, { headers });
      toast({ 
        title: "تم بنجاح", 
        description: `تم إنشاء المستخدم بنجاح (كلمة المرور: ${finalPassword})` 
      });
      addUserForm.reset();
      setIsAddUserOpen(false);
      await fetchUsersData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.response?.data?.message || "فشل الإنشاء", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditUser: SubmitHandler<UserFormData> = async (data) => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      let finalCollegeId = null;
      if (myUserType?.user_type_code === 'dean') {
        // @ts-ignore
        finalCollegeId = Number(me?.college_id);
      } else if (data.college_id) {
        finalCollegeId = Number(data.college_id);
      }
      const payload: any = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        academic_number: data.academic_number,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
        college_id: finalCollegeId
      };
      if (data.password && data.password.trim().length > 0) {
        if (data.password.trim().length < 6) {
          toast({ title: "خطأ", description: "كلمة المرور يجب ألا تقل عن 6 خانات", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        payload.password = data.password.trim();
      }
      await api.put(`/v1/users/${editingUser.user_id}`, payload);
      toast({ title: "تم بنجاح", description: "تم تحديث بيانات المستخدم وكلمة المرور بنجاح" });
      editUserForm.reset();
      setIsEditUserOpen(false);
      setEditingUser(null);
      setShowEditPassword(false);
      await fetchUsersData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.response?.data?.message || "فشل التحديث", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await api.delete(`/v1/users/${userId}`);
      toast({ title: "تم الحذف النهائي", description: "تم مسح الحساب نهائياً من قاعدة البيانات بنجاح" });
      await fetchUsersData();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUsers(new Set(finalFilteredUsers.map(u => u.user_id)));
    else setSelectedUsers(new Set());
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const next = new Set(selectedUsers);
    if (checked) next.add(userId);
    else next.delete(userId);
    setSelectedUsers(next);
  };

  if ((!userTypes.length || !me) && loadingList) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center flex-wrap gap-2">
            إدارة المستخدمين
            {currentCollegeName && <span className="text-xl font-medium text-muted-foreground/80 mt-1">- {currentCollegeName}</span>}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {myUserType?.user_type_code === "dean" 
              ? "إدارة الكادر الأكاديمي والإداري (الموظفين) في كليتك" 
              : "لوحة تحكم شاملة للموظفين وأعضاء هيئة التدريس"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {can('users.create') && (
            <Dialog open={isAddUserOpen} onOpenChange={(open) => {
              setIsAddUserOpen(open);
              if (open) {
                const defaultRoleId = allowedRoleCodesForCreate.length === 1 && allowedRoleCodesForCreate[0] === 'lecturer'
                  ? String(userTypes.find(t => t.user_type_code === 'lecturer')?.user_type_id || "")
                  : "";
                addUserForm.reset({
                  full_name: "", email: "", phone: "", academic_number: "", gender: "0", password: "",
                  user_type_id: defaultRoleId,
                  college_id: isCollegeScopedUser && me?.college_id ? String(me.college_id) : undefined
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                  <Plus className="w-5 h-5 ml-2" /> إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle className="text-xl text-right">إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription className="text-right">بيانات الموظف / عضو هيئة التدريس الجديد.</DialogDescription>
                </DialogHeader>
                <Form {...addUserForm}>
                  <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-6 mt-4">
                    {/* ... (نفس حقول النموذج - لا تغيير) ... */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                        <UserCircle className="w-4 h-4" /> البيانات الشخصية
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={addUserForm.control} name="full_name" render={({ field }) => (
                          <FormItem className="md:col-span-1"><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="الاسم الرباعي" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="gender" render={({ field }) => (
                          <FormItem>
                            <FormLabel>النوع</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="0">ذكر</SelectItem><SelectItem value="1">أنثى</SelectItem></SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                        <Briefcase className="w-4 h-4" /> البيانات الوظيفية
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={addUserForm.control} name="academic_number" render={({ field }) => (
                          <FormItem><FormLabel>الرقم الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="user_type_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدور (الصلاحية)</FormLabel>
                            <Select onValueChange={(val) => { field.onChange(val); if(!isCollegeRequired(val)) { addUserForm.setValue("college_id", undefined); } }} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {userTypes.filter(t => allowedRoleCodesForCreate.includes(t.user_type_code)).map(t => (
                                  <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>{t.user_type_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                          <FormField
                            control={addUserForm.control}
                            name="college_id"
                            render={({ field }) => {
                              const selectedRole = addUserForm.watch("user_type_id");
                              if (!selectedRole || !isCollegeRequired(selectedRole)) return <></>;
                              return (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>الكلية التابع لها</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="اختر الكلية" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {colleges.map((college) => (
                                        <SelectItem key={college.college_id} value={String(college.college_id)}>{college.college_name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* حقل كلمة المرور الجديد للمستخدم مع إمكانية التحديد أو التوليد */}
                    <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">كلمة مرور الحساب</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-primary gap-1"
                          onClick={() => {
                            const randomPass = "U@" + Math.random().toString(36).slice(-6) + "9";
                            addUserForm.setValue("password", randomPass);
                            setShowAddPassword(true);
                            toast({ title: "تم توليد كلمة سر مؤقتة", description: `كلمة السر: ${randomPass}` });
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> توليد كلمة مرور
                        </Button>
                      </div>

                      <FormField
                        control={addUserForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              كلمة المرور (اختياري - إن تركتها فارغة ستكون الافتراضية 12345678)
                            </FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  type={showAddPassword ? "text" : "password"}
                                  placeholder="أدخل كلمة مرور مخصصة أو اضغط توليد (الافتراضي: 12345678)"
                                  className="pl-10 text-right"
                                  dir="ltr"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowAddPassword(!showAddPassword)}
                              >
                                {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              💡 يمكن للمستخدم تغيير كلمة المرور هذه بنفسه في أي وقت لاحقاً من حسابه.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
                      <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ المستخدم</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم، الرقم الوظيفي..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 h-10 bg-background" />
          </div>
          <div className="flex gap-2">
             {(myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency") && (
                <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="الكلية" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الكليات</SelectItem>
                    {colleges.map(c => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}
                  </SelectContent>
                </Select>
             )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {/* العدد هنا يتحدث بناءً على usersInView */}
          <Button variant={roleFilter === 'all' ? "default" : "outline"} onClick={() => setRoleFilter('all')} size="sm" className="w-full rounded-md">
            الكل ({usersInView.length})
          </Button>

          {visibleUserTypes.map(type => {
             const count = usersInView.filter(u => u.user_type_id === type.user_type_id).length;
             return (
              <Button key={type.user_type_id} variant={roleFilter === type.user_type_id ? "default" : "outline"} onClick={() => setRoleFilter(type.user_type_id)} size="sm" className="w-full rounded-md border-dashed justify-between px-3">
                <span>{type.user_type_name}</span>
                <span className="text-[10px] bg-primary-foreground/20 px-1.5 rounded-full min-w-[20px] text-center">{count}</span>
              </Button>
             )
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center"><Checkbox onCheckedChange={handleSelectAll} /></TableHead>
                  <TableHead className="w-24 text-center">الرقم</TableHead>
                  <TableHead className="min-w-[200px] text-right">المستخدم</TableHead>
                  <TableHead className="min-w-[200px] text-right">معلومات الاتصال</TableHead>
                  <TableHead className="w-[150px] text-center">الدور الوظيفي</TableHead>
                  <TableHead className="w-24 text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingList ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : finalFilteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                     <Users className="w-10 h-10 opacity-20 mb-2" />
                     <p>لا توجد نتائج مطابقة للبحث</p>
                  </TableCell></TableRow>
                ) : (
                  finalFilteredUsers.slice(0, 100).map((user) => {
                    const roleCode = roleCodeById(user.user_type_id);
                    const roleName = roleNameById(user.user_type_id);
                    
                    const targetIsDean = roleCode === 'dean';
                    const iAmDean = myUserType?.user_type_code === 'dean';
                    const isProtectedUser = iAmDean && targetIsDean;

                    const canEdit = can('users.update') && !isProtectedUser;
                    const canDelete = can('users.delete') && !isProtectedUser;
                    const hasActions = canEdit || canDelete;

                    return (
                      <TableRow key={user.user_id} className="hover:bg-muted/5 group">
                        <TableCell className="text-center"><Checkbox checked={selectedUsers.has(user.user_id)} onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)} /></TableCell>
                        <TableCell className="text-center text-muted-foreground font-mono text-xs">{user.academic_number}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border hidden sm:block">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {user.full_name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{user.full_name}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={colleges.find(c=>c.college_id===user.college_id)?.college_name}>
                                 {colleges.find(c=>c.college_id===user.college_id)?.college_name || '—'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 text-xs">
                             <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="w-3 h-3" /> {user.email}
                             </div>
                             <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="w-3 h-3" /> {user.phone}
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${getRoleColor(roleCode)} font-medium`}>
                            {roleName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasActions && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => {
                                      setEditingUser(user);
                                      setShowEditPassword(false);
                                      editUserForm.reset({
                                        full_name: user.full_name,
                                        email: user.email,
                                        phone: user.phone,
                                        academic_number: user.academic_number,
                                        gender: String(user.gender) as "0"|"1",
                                        user_type_id: String(user.user_type_id),
                                        college_id: user.college_id ? String(user.college_id) : undefined,
                                        password: ""
                                      });
                                      setIsEditUserOpen(true);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" /> تعديل البيانات
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteUser(user.user_id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> حذف الحساب نهائياً
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl font-bold text-right">تعديل البيانات</DialogTitle>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUser)} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={editUserForm.control} name="full_name" render={({ field }) => (
                    <FormItem className="md:col-span-1"><FormLabel>الاسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editUserForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>البريد</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editUserForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editUserForm.control} name="academic_number" render={({ field }) => (
                    <FormItem><FormLabel>الرقم الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <FormField control={editUserForm.control} name="user_type_id" render={({ field }) => (
                    <FormItem>
                        <FormLabel>الدور</FormLabel>
                        <Select onValueChange={(val) => { field.onChange(val); if(!isCollegeRequired(val)) editUserForm.setValue("college_id", undefined); }} defaultValue={field.value}
                            disabled={roleCodeById(editingUser?.user_type_id) === 'student'} 
                        >
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            {userTypes.filter(t => allowedRoleCodesForCreate.includes(t.user_type_code) || t.user_type_id === editingUser?.user_type_id).map(t => (
                                <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>{t.user_type_name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                    </FormItem>
                  )} />
                  
                  {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                    <FormField control={editUserForm.control} name="college_id" render={({ field }) => {
                        const selectedRole = editUserForm.watch("user_type_id");
                        if (!selectedRole || !isCollegeRequired(selectedRole)) return <></>;
                        return (
                          <FormItem className="md:col-span-2"><FormLabel>الكلية</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{colleges.map((c) => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        );
                      }}
                    />
                  )}

                  {/* حقل تعديل كلمة المرور الجديد مع إظهار/إخفاء وتوليد عشوائي */}
                  <div className="md:col-span-2 rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">تعديل كلمة المرور</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-primary gap-1"
                        onClick={() => {
                          const randomPass = "U@" + Math.random().toString(36).slice(-6) + "9";
                          editUserForm.setValue("password", randomPass);
                          setShowEditPassword(true);
                          toast({ title: "تم توليد كلمة سر مؤقتة", description: `كلمة السر: ${randomPass}` });
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> توليد كلمة مرور
                      </Button>
                    </div>

                    <FormField
                      control={editUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            كلمة المرور الجديدة (اتركه فارغاً إذا كنت لا ترغب بتغييرها)
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                type={showEditPassword ? "text" : "password"}
                                placeholder="أدخل كلمة مرور جديدة أو اتركه فارغاً"
                                className="pr-10"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                            >
                              {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ التغييرات</Button>
               </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}