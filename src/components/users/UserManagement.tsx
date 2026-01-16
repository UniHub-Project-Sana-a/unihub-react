import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Search, Edit, Trash2, Users, Mail, Download, 
  MoreHorizontal, Loader2, Phone, UserCircle, Briefcase 
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  // status تم إزالته لأنه غير موجود
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
  academic_number: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  gender: z.enum(["0", "1"]),
  user_type_id: z.string().min(1, "الدور مطلوب"),
  college_id: z.string().optional(),
});
type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const { toast } = useToast();
  const { user: me } = useAuth();
  
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
  const [loadingList, setLoadingList] = useState(false);

  // Forms
  const addUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "" },
  });

  const editUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", phone: "", academic_number: "", gender: "0", user_type_id: "" },
  });

  // --- Helpers & Computed ---
  const myUserType = useMemo(() => {
    if (!me) return null;
    const typeId = (me as any).user_type_id || (me as any).user_type?.user_type_id;
    return userTypes.find(t => t.user_type_id === Number(typeId)) || null;
  }, [me, userTypes]);

  const roleNameById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_name || "غير معروف";
  const roleCodeById = (id?: number) => userTypes.find(x => x.user_type_id === id)?.user_type_code || "";

  // ✅ تعديل المنطق: تحديد الأدوار المسموح بإنشائها
  const allowedRoleCodesForCreate = useMemo(() => {
    const code = myUserType?.user_type_code || "";
    
    // 1. المشرف العام: يضيف الكل
    if (code === "admin" || code === "presidency") {
       // نعيد كل الأكواد المتاحة في النظام
       return userTypes.map(t => t.user_type_code);
    }
    
    // 2. العميد: يضيف ما تحته فقط
    if (code === "dean") {
      return userTypes
        .filter(t => !["admin", "dean", "presidency"].includes(t.user_type_code))
        .map(t => t.user_type_code);
    }
    return [];
  }, [myUserType, userTypes]);

  // دالة لمعرفة هل الدور يتطلب كلية؟
  const isCollegeRequired = (roleId: string) => {
      const code = roleCodeById(Number(roleId));
      // الأدوار العليا لا تتطلب كلية، البقية تتطلب
      return !["admin", "presidency"].includes(code);
  };

  // --- API Calls ---
  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/v1/users", { params: { per_page: 500 } });
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
          api.get("/v1/users", { params: { per_page: 500 } }),
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

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. صلاحيات الرؤية
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
      // 2. البحث
      const q = searchQuery.toLowerCase();
      const rn = roleNameById(u.user_type_id).toLowerCase();
      return u.full_name.toLowerCase().includes(q) || 
             u.email.toLowerCase().includes(q) || 
             u.academic_number.includes(q) ||
             rn.includes(q);
    }).filter(u => {
      // 3. فلتر الدور
      if (roleFilter === "all") return true;
      return u.user_type_id === roleFilter;
    });
  }, [users, searchQuery, roleFilter, collegeFilter, myUserType, me]);

  // --- Handlers ---
  const onAddUser: SubmitHandler<UserFormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
        password: "12345678",
        college_id: data.college_id ? Number(data.college_id) : null
      };
      // Header للكليات، مهم للعميد
      const headers = myUserType?.user_type_code === 'dean' ? { "X-College-Id": String(me?.college_id) } : {};
      
      await api.post("/v1/users", payload, { headers });
      toast({ title: "تم بنجاح", description: "تم إنشاء المستخدم بنجاح" });
      addUserForm.reset();
      setIsAddUserOpen(false);
      await fetchUsers();
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
      const payload = {
        ...data,
        gender: Number(data.gender),
        user_type_id: Number(data.user_type_id),
        college_id: data.college_id ? Number(data.college_id) : null
      };
      await api.put(`/v1/users/${editingUser.user_id}`, payload);
      toast({ title: "تم بنجاح", description: "تم تحديث البيانات" });
      editUserForm.reset();
      setIsEditUserOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.response?.data?.message || "فشل التحديث", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await api.delete(`/v1/users/${userId}`);
      toast({ title: "تم الحذف", description: "تم حذف المستخدم بنجاح" });
      await fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  const getRoleColor = (code: string) => {
    switch (code) {
      case "admin": return "bg-red-100 text-red-700 border-red-200";
      case "dean": return "bg-amber-100 text-amber-700 border-amber-200";
      case "lecturer": return "bg-blue-100 text-blue-700 border-blue-200";
      case "student": return "bg-green-100 text-green-700 border-green-200";
      case "dept_head": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const next = new Set(selectedUsers);
    if (checked) next.add(userId);
    else next.delete(userId);
    setSelectedUsers(next);
  };

  // --- Render ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500 container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {myUserType?.user_type_code === "dean" 
              ? "إدارة الكادر الأكاديمي والإداري والطلاب في كليتك" 
              : "لوحة تحكم شاملة لجميع مستخدمي النظام"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(myUserType?.user_type_code === "admin" || myUserType?.user_type_code === "presidency" || myUserType?.user_type_code === "dean") && (
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>أدخل بيانات المستخدم الجديد بدقة لإنشاء حساب.</DialogDescription>
                </DialogHeader>
                <Form {...addUserForm}>
                  <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-6 mt-4">
                    
                    {/* بيانات شخصية */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                        <UserCircle className="w-4 h-4" /> البيانات الشخصية
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={addUserForm.control} name="full_name" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl><Input placeholder="الاسم الرباعي" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
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
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={addUserForm.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <Separator />

                    {/* بيانات وظيفية */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                        <Briefcase className="w-4 h-4" /> البيانات الوظيفية
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={addUserForm.control} name="academic_number" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرقم الأكاديمي / الوظيفي</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={addUserForm.control} name="user_type_id" render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدور (الصلاحية)</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                // إعادة تعيين الكلية إذا كان الدور لا يتطلبها
                                if(!isCollegeRequired(val)) {
                                    addUserForm.setValue("college_id", undefined); 
                                }
                            }} defaultValue={field.value}>
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
                        
                        {/* حقل الكلية: يظهر إذا كان المستخدم أدمن والدور المختار يتطلب كلية */}
                        {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                          <FormField
                            control={addUserForm.control}
                            name="college_id"
                            render={({ field }) => {
                                // إخفاء الحقل إذا كان الدور لا يتطلب كلية
                                const selectedRole = addUserForm.watch("user_type_id");
                                if(selectedRole && !isCollegeRequired(selectedRole)) return <></>;

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

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>إلغاء</Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ المستخدم
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث بالاسم، البريد، الرقم الأكاديمي..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-10 h-10 bg-background"
            />
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

        {/* Role Tabs (Responsive Grid) */}
        {/* ✅ هذا الجزء تم تعديله ليكون متجاوباً تماماً */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <Button 
            variant={roleFilter === 'all' ? "default" : "outline"} 
            onClick={() => setRoleFilter('all')}
            size="sm"
            className="w-full rounded-md"
          >
            الكل ({users.length})
          </Button>
          {userTypes.map(type => {
             const count = users.filter(u => u.user_type_id === type.user_type_id).length;
             return (
              <Button
                key={type.user_type_id}
                variant={roleFilter === type.user_type_id ? "default" : "outline"}
                onClick={() => setRoleFilter(type.user_type_id)}
                size="sm"
                className="w-full rounded-md border-dashed justify-between px-3"
              >
                <span>{type.user_type_name}</span>
                <span className="text-[10px] bg-primary-foreground/20 px-1.5 rounded-full min-w-[20px] text-center">{count}</span>
              </Button>
             )
          })}
        </div>
      </div>

      {/* Users Table */}
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
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground flex-col gap-2">
                     <Users className="w-10 h-10 mx-auto opacity-20 mb-2" />
                     <p>لا توجد نتائج مطابقة للبحث</p>
                  </TableCell></TableRow>
                ) : (
                  filteredUsers.slice(0, 100).map((user) => {
                    const roleCode = roleCodeById(user.user_type_id);
                    const roleName = roleNameById(user.user_type_id);
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onClick={() => {
                                  setEditingUser(user);
                                  editUserForm.reset({
                                    full_name: user.full_name,
                                    email: user.email,
                                    phone: user.phone,
                                    academic_number: user.academic_number,
                                    gender: String(user.gender) as "0"|"1",
                                    user_type_id: String(user.user_type_id),
                                    college_id: String(user.college_id || "")
                                  });
                                  setIsEditUserOpen(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" /> تعديل البيانات
                              </DropdownMenuItem>

                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteUser(user.user_id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> حذف الحساب
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
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog (Similar to Add) */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUser)} className="space-y-6 mt-4">
               {/* Same Fields as Add User */}
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
                    <FormItem><FormLabel>الدور</FormLabel>
                      <Select onValueChange={(val) => {
                          field.onChange(val);
                          if(!isCollegeRequired(val)) editUserForm.setValue("college_id", undefined); 
                      }} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{userTypes.filter(t => allowedRoleCodesForCreate.includes(t.user_type_code)).map(t => <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>{t.user_type_name}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                  
                  {/* حقل الكلية للتعديل */}
                  {(myUserType?.user_type_code === 'admin' || myUserType?.user_type_code === 'presidency') && (
                    <FormField
                      control={editUserForm.control}
                      name="college_id"
                      render={({ field }) => {
                          const selectedRole = editUserForm.watch("user_type_id");
                          if(selectedRole && !isCollegeRequired(selectedRole)) return <></>;
                          return (
                            <FormItem className="md:col-span-2">
                              <FormLabel>الكلية</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{colleges.map((c) => <SelectItem key={c.college_id} value={String(c.college_id)}>{c.college_name}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                      }}
                    />
                  )}
               </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ</Button>
               </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}