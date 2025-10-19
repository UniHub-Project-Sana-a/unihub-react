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
import { Textarea } from "@/components/ui/textarea";
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, UserPlus, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    id: 1,
    name: "مسؤول النظام",
    description: "وصول كامل للنظام وإدارة المستخدمين",
    userCount: 3,
    color: "red"
  },
  {
    id: 2,
    name: "رئيس القسم",
    description: "إدارة موارد القسم والموظفين",
    userCount: 8,
    color: "purple"
  },
  {
    id: 3,
    name: "الهيئة الأكاديمية",
    description: "التدريس والمسؤوليات الأكاديمية",
    userCount: 45,
    color: "blue"
  },
  {
    id: 4,
    name: "الموظفون الإداريون",
    description: "المهام الإدارية والدعم",
    userCount: 12,
    color: "green"
  }
];

const permissions = {
  dashboard: {
    name: "لوحة التحكم",
    actions: ["عرض", "إدارة"]
  },
  userManagement: {
    name: "إدارة المستخدمين",
    actions: ["عرض", "إنشاء", "تعديل", "حذف"]
  },
  timetableManagement: {
    name: "إدارة الجداول الدراسية",
    actions: ["عرض", "إنشاء", "تعديل", "حذف", "استيراد"]
  },
  courseManagement: {
    name: "إدارة المقررات",
    actions: ["عرض", "إنشاء", "تعديل", "حذف"]
  },
  enrollmentManagement: {
    name: "إدارة التسجيل",
    actions: ["عرض", "إنشاء", "تعديل", "حذف", "استيراد"]
  },
  excuseManagement: {
    name: "إدارة الأعذار",
    actions: ["عرض", "إنشاء", "اعتماد", "رفض"]
  },
  reports: {
    name: "التقارير",
    actions: ["عرض", "إنشاء", "تصدير"]
  },
  settings: {
    name: "إعدادات النظام",
    actions: ["عرض", "إدارة"]
  },
  integrations: {
    name: "التكاملات",
    actions: ["عرض", "تكوين"]
  },
  auditLogs: {
    name: "سجلات التدقيق",
    actions: ["عرض", "تصدير"]
  }
};

const users = [
  { id: 1, name: "Dr. Sarah Johnson", email: "sarah.johnson@unihub.edu", role: "" },
  { id: 2, name: "Prof. Ahmed Hassan", email: "ahmed.hassan@unihub.edu", role: "Department Head" },
  { id: 3, name: "John Smith", email: "john.smith@unihub.edu", role: "" },
  { id: 4, name: "Mary Rodriguez", email: "mary.rodriguez@unihub.edu", role: "System Administrator" }
];

// مخططات النماذج
const roleSchema = z.object({
  name: z.string().min(2, "يجب أن يكون اسم الدور مكوّنًا من حرفين على الأقل"),
  description: z.string().min(10, "يجب أن يكون الوصف بطول 10 أحرف على الأقل"),
});

const assignRoleSchema = z.object({
  userId: z.string().min(1, "يرجى اختيار مستخدم"),
  roleId: z.string().min(1, "يرجى اختيار دور"),
});

type RoleFormData = z.infer<typeof roleSchema>;
type AssignRoleFormData = z.infer<typeof assignRoleSchema>;

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<{[key: string]: string[]}>({});
  const { toast } = useToast();

  // النماذج
  const createRoleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editRoleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const assignRoleForm = useForm<AssignRoleFormData>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      userId: "",
      roleId: "",
    },
  });

  const onCreateRole = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      // محاكاة اتصال API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجاح",
        description: "تم إنشاء الدور بنجاح",
      });
      
      createRoleForm.reset();
      setIsCreateRoleOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الدور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditRole = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      // محاكاة اتصال API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجاح",
        description: "تم تحديث الدور بنجاح",
      });
      
      editRoleForm.reset();
      setIsEditRoleOpen(false);
      setEditingRole(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الدور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAssignRole = async (data: AssignRoleFormData) => {
    setIsLoading(true);
    try {
      // محاكاة اتصال API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "نجاح",
        description: "تم تعيين الدور بنجاح",
      });
      
      assignRoleForm.reset();
      setIsAssignRoleOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تعيين الدور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    editRoleForm.reset({
      name: role.name,
      description: role.description,
    });
    setIsEditRoleOpen(true);
  };

  const handleDeleteRole = (roleId: number) => {
    toast({
      title: "نجاح",
      description: "تم حذف الدور بنجاح",
    });
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const key = `${module}-${action}`;
    setRolePermissions(prev => {
      const updated = { ...prev };
      if (!updated[selectedRole.name]) {
        updated[selectedRole.name] = [];
      }
      
      if (checked) {
        updated[selectedRole.name] = [...updated[selectedRole.name], key];
      } else {
        updated[selectedRole.name] = updated[selectedRole.name].filter(p => p !== key);
      }
      
      return updated;
    });
  };

  const savePermissions = () => {
    toast({
      title: "نجاح",
      description: "تم تحديث الصلاحيات بنجاح",
    });
  };

  const getRoleColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-100 text-red-700 border-red-200";
      case "purple":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "blue":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "green":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الأدوار والصلاحيات</h1>
          <p className="text-muted-foreground">إدارة أدوار المستخدمين وصلاحيات النظام</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                تعيين دور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعيين دور لمستخدم</DialogTitle>
              </DialogHeader>
              <Form {...assignRoleForm}>
                <form onSubmit={assignRoleForm.handleSubmit(onAssignRole)} className="space-y-4">
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
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email})
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
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
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
          
          <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء دور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء دور جديد</DialogTitle>
              </DialogHeader>
              <Form {...createRoleForm}>
                <form onSubmit={createRoleForm.handleSubmit(onCreateRole)} className="space-y-4">
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
                  <FormField
                    control={createRoleForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف</FormLabel>
                        <FormControl>
                          <Textarea placeholder="أدخل وصف الدور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
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
                      إنشاء الدور
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الدور</DialogTitle>
          </DialogHeader>
          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(onEditRole)} className="space-y-4">
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل وصف الدور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
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
        {roles.map((role) => (
          <Card key={role.id} className={`${getRoleColor(role.color)} transition-all duration-200 hover:shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-sm opacity-80 mt-1">{role.userCount} مستخدم</p>
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
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole.id === role.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-muted-foreground">{role.userCount} مستخدم</p>
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
                          handleDeleteRole(role.id);
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                صلاحيات {selectedRole.name}
              </CardTitle>
              <Button onClick={savePermissions}>
                حفظ الصلاحيات
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(permissions).map(([module, config]) => (
                <div key={module} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {config.name}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {config.actions.map((action) => (
                      <div key={`${module}-${action}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}-${action}`}
                          checked={rolePermissions[selectedRole.name]?.includes(`${module}-${action}`) || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, action, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`${module}-${action}`}
                          className="text-sm font-medium capitalize cursor-pointer"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}