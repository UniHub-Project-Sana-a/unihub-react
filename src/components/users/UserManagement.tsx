import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Edit, Trash2, Shield, Users, Mail, Phone, Download, Upload, UserCheck, UserX, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const users = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@unihub.edu",
    role: "Instructor",
    status: "Active",
    permissions: ["View Timetable", "Submit Excuses", "View Reports"],
    lastLogin: "2024-01-15 10:30",
    phone: "+1-555-0123"
  },
  {
    id: 2,
    name: "Prof. Ahmed Hassan",
    email: "ahmed.hassan@unihub.edu",
    role: "Department Head",
    status: "Active",
    permissions: ["Full Access", "Approve Excuses", "Manage Users"],
    lastLogin: "2024-01-15 09:15",
    phone: "+1-555-0124"
  },
  {
    id: 3,
    name: "John Smith",
    email: "john.smith@unihub.edu",
    role: "Student",
    status: "Active",
    permissions: ["View Schedule", "Submit Attendance"],
    lastLogin: "2024-01-15 11:45",
    phone: "+1-555-0125"
  },
  {
    id: 4,
    name: "Mary Rodriguez",
    email: "mary.rodriguez@unihub.edu",
    role: "Admin",
    status: "Active",
    permissions: ["System Admin", "Full Access", "User Management"],
    lastLogin: "2024-01-15 08:00",
    phone: "+1-555-0126"
  }
];

// مخططات النماذج
const userSchema = z.object({
  name: z.string().min(2, "يجب أن يحتوي الاسم على حرفين على الأقل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  phone: z.string().min(10, "يجب أن يحتوي رقم الهاتف على 10 أرقام على الأقل"),
  role: z.string().min(1, "يرجى اختيار الدور"),
});

const editUserSchema = z.object({
  name: z.string().min(2, "يجب أن يحتوي الاسم على حرفين على الأقل"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  phone: z.string().min(10, "يجب أن يحتوي رقم الهاتف على 10 أرقام على الأقل"),
  role: z.string().min(1, "يرجى اختيار الدور"),
});

type UserFormData = z.infer<typeof userSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // النماذج
  const addUserForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  const editUserForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter;
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const activeUsers = users.filter(user => user.status === "Active").length;
  const suspendedUsers = users.filter(user => user.status === "Suspended").length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const onAddUser = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      // محاكاة اتصال API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجاح",
        description: "تم إنشاء المستخدم بنجاح",
      });
      
      addUserForm.reset();
      setIsAddUserOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditUser = async (data: EditUserFormData) => {
    setIsLoading(true);
    try {
      // محاكاة اتصال API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجاح",
        description: "تم تحديث المستخدم بنجاح",
      });
      
      editUserForm.reset();
      setIsEditUserOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase().replace(" ", "-"),
    });
    setIsEditUserOpen(true);
  };

  const toggleUserStatus = (userId: number) => {
    toast({
      title: "نجاح",
      description: "تم تحديث حالة المستخدم بنجاح",
    });
  };

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "نجاح",
      description: "تم حذف المستخدم بنجاح",
    });
  };

  const handleBulkExport = () => {
    toast({
      title: "نجاح",
      description: "تم تصدير المستخدمين بنجاح",
    });
  };

  const handleImportUsers = () => {
    toast({
      title: "نجاح",
      description: "تم استيراد المستخدمين بنجاح",
    });
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
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إدارة مسؤولي النظام ورؤساء الأقسام</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportUsers}>
            <Upload className="w-4 h-4 mr-2" />
            استيراد المستخدمين
          </Button>
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            تصدير المستخدمين
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                إضافة مستخدم جديد
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
                      name="name"
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
                            <Input placeholder="أدخل رقم الهاتف" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addUserForm.control}
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
                              <SelectItem value="admin">مسؤول</SelectItem>
                              <SelectItem value="department-head">رئيس قسم</SelectItem>
                              <SelectItem value="instructor">محاضر</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddUserOpen(false)}
                      disabled={isLoading}
                    >
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
        </div>
      </div>

      {/* مربع حوار تعديل المستخدم */}
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
                  name="name"
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
                  control={editUserForm.control}
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
                  control={editUserForm.control}
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
                <FormField
                  control={editUserForm.control}
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
                          <SelectItem value="admin">مسؤول</SelectItem>
                          <SelectItem value="department-head">رئيس قسم</SelectItem>
                          <SelectItem value="instructor">محاضر</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
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
                <p className="text-2xl font-bold text-blue-700">{users.length}</p>
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
                <p className="text-2xl font-bold text-red-700">{suspendedUsers}</p>
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
                  {users.filter(u => u.role === "Admin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="admin">مسؤول</SelectItem>
                  <SelectItem value="department head">رئيس قسم</SelectItem>
                  <SelectItem value="instructor">محاضر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">تم تحديد {selectedUsers.size} مستخدم</p>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="w-4 h-4 mr-2" />
                تصدير المحدد
              </Button>
              <Button variant="outline" size="sm">
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={user.status === "Active" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin}
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
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          إدارة الصلاحيات
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                          {user.status === "Active" ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              إيقاف المستخدم
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              تفعيل المستخدم
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف المستخدم
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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