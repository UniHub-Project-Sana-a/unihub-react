import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Globe, Clock, Eye, Download, Plus, Trash2, Users, Settings, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// بيانات تجريبية
const securityPolicies = {
  passwordComplexity: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },
  twoFactorAuth: {
    enabled: true,
    requiredForRoles: ["Admin", "Department Head"],
  },
  loginPolicy: {
    maxFailedAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 120,
  }
};

const ipRestrictions = [
  { id: 1, type: "whitelist", address: "192.168.1.0/24", description: "شبكة داخلية", status: "active" },
  { id: 2, type: "whitelist", address: "10.0.0.0/8", description: "شبكة VPN", status: "active" },
  { id: 3, type: "blacklist", address: "203.0.113.0/24", description: "منطقة محجوبة", status: "active" },
];

const sessionSettings = {
  globalTimeout: 120,
  maxConcurrentSessions: 3,
  rememberMeEnabled: true,
  rememberMeDuration: 30,
};

const activeSessions = [
  { id: 1, user: "Dr. Sarah Johnson", ip: "192.168.1.100", location: "المكتب", device: "Windows Chrome", loginTime: "2024-01-15 09:30", lastActivity: "2024-01-15 10:45" },
  { id: 2, user: "Prof. Ahmed Hassan", ip: "10.0.1.50", location: "المنزل", device: "MacOS Safari", loginTime: "2024-01-15 08:00", lastActivity: "2024-01-15 10:50" },
  { id: 3, user: "Mary Rodriguez", ip: "192.168.1.200", location: "مكتب الإدارة", device: "Windows Edge", loginTime: "2024-01-15 07:45", lastActivity: "2024-01-15 10:48" },
];

const auditLogs = [
  { id: 1, timestamp: "2024-01-15 10:45:32", user: "Dr. Sarah Johnson", action: "Login", resource: "System", ip: "192.168.1.100", status: "Success" },
  { id: 2, timestamp: "2024-01-15 10:44:15", user: "System", action: "Policy Change", resource: "Security Settings", ip: "127.0.0.1", status: "Success" },
  { id: 3, timestamp: "2024-01-15 10:43:21", user: "Unknown", action: "Failed Login", resource: "Login Page", ip: "203.0.113.45", status: "Failed" },
  { id: 4, timestamp: "2024-01-15 10:42:10", user: "Prof. Ahmed Hassan", action: "Data Export", resource: "User Reports", ip: "10.0.1.50", status: "Success" },
];

// مخططات النماذج
const securityPolicySchema = z.object({
  minPasswordLength: z.number().min(6).max(50),
  maxFailedAttempts: z.number().min(3).max(10),
  lockoutDuration: z.number().min(5).max(120),
});

const ipRestrictionSchema = z.object({
  type: z.enum(["whitelist", "blacklist"]),
  address: z.string().min(7, "يرجى إدخال عنوان IP صالح أو مدى CIDR"),
  description: z.string().min(1, "الوصف مطلوب"),
});

const sessionSettingsSchema = z.object({
  globalTimeout: z.number().min(15).max(480),
  maxConcurrentSessions: z.number().min(1).max(10),
  rememberMeDuration: z.number().min(1).max(90),
});

type SecurityPolicyFormData = z.infer<typeof securityPolicySchema>;
type IpRestrictionFormData = z.infer<typeof ipRestrictionSchema>;
type SessionSettingsFormData = z.infer<typeof sessionSettingsSchema>;

const AccessControl = () => {
  const [activeTab, setActiveTab] = useState("security");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingIpRule, setIsAddingIpRule] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logFilter, setLogFilter] = useState("all");
  const { toast } = useToast();

  // النماذج
  const securityForm = useForm<SecurityPolicyFormData>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: {
      minPasswordLength: securityPolicies.passwordComplexity.minLength,
      maxFailedAttempts: securityPolicies.loginPolicy.maxFailedAttempts,
      lockoutDuration: securityPolicies.loginPolicy.lockoutDuration,
    },
  });

  const ipForm = useForm<IpRestrictionFormData>({
    resolver: zodResolver(ipRestrictionSchema),
    defaultValues: {
      type: "whitelist",
      address: "",
      description: "",
    },
  });

  const sessionForm = useForm<SessionSettingsFormData>({
    resolver: zodResolver(sessionSettingsSchema),
    defaultValues: {
      globalTimeout: sessionSettings.globalTimeout,
      maxConcurrentSessions: sessionSettings.maxConcurrentSessions,
      rememberMeDuration: sessionSettings.rememberMeDuration,
    },
  });

  const onUpdateSecurityPolicy = async (data: SecurityPolicyFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "نجاح",
        description: "تم تحديث سياسة الأمان بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث سياسة الأمان",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddIpRestriction = async (data: IpRestrictionFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "نجاح",
        description: "تمت إضافة قاعدة تقييد IP بنجاح",
      });
      ipForm.reset();
      setIsAddingIpRule(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة قاعدة تقييد IP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdateSessionSettings = async (data: SessionSettingsFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "نجاح",
        description: "تم تحديث إعدادات الجلسات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات الجلسات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnectivity = () => {
    toast({
      title: "اختبار الاتصال",
      description: "جارٍ اختبار الاتصال من عنوان IP الحالي...",
    });
    
    // محاكاة الاختبار
    setTimeout(() => {
      toast({
        title: "تم الاختبار بنجاح",
        description: "يمكن لعنوان IP الحالي الوصول إلى النظام",
      });
    }, 2000);
  };

  const handleForceLogout = (sessionId: number) => {
    toast({
      title: "نجاح",
      description: "تم إنهاء جلسة المستخدم بنجاح",
    });
  };

  const handleExportLogs = () => {
    toast({
      title: "نجاح",
      description: "تم تصدير سجلات التدقيق بنجاح",
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = logFilter === "all" || log.status.toLowerCase() === logFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التحكم في الوصول</h1>
          <p className="text-muted-foreground">إدارة سياسات الأمان وضوابط الوصول</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            سياسة الأمان
          </TabsTrigger>
          <TabsTrigger value="ip" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            قيود عناوين IP
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            إدارة الجلسات
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            سجلات الوصول
          </TabsTrigger>
        </TabsList>

        {/* تبويب سياسة الأمان */}
        <TabsContent value="security" className="space-y-6">
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onUpdateSecurityPolicy)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      سياسة كلمة المرور
                    </CardTitle>
                    <CardDescription>ضبط متطلبات تعقيد كلمة المرور</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="minPasswordLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحد الأدنى لطول كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>يتطلب حروف كبيرة</Label>
                          <p className="text-sm text-muted-foreground">على الأقل حرف كبير واحد</p>
                        </div>
                        <Switch defaultChecked={securityPolicies.passwordComplexity.requireUppercase} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>يتطلب حروف صغيرة</Label>
                          <p className="text-sm text-muted-foreground">على الأقل حرف صغير واحد</p>
                        </div>
                        <Switch defaultChecked={securityPolicies.passwordComplexity.requireLowercase} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>يتطلب أرقام</Label>
                          <p className="text-sm text-muted-foreground">على الأقل رقم واحد</p>
                        </div>
                        <Switch defaultChecked={securityPolicies.passwordComplexity.requireNumbers} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>يتطلب رموز</Label>
                          <p className="text-sm text-muted-foreground">على الأقل رمز خاص واحد</p>
                        </div>
                        <Switch defaultChecked={securityPolicies.passwordComplexity.requireSymbols} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-green-600" />
                      سياسة المصادقة
                    </CardTitle>
                    <CardDescription>ضبط إعدادات تسجيل الدخول والمصادقة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="maxFailedAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحد الأقصى لمحاولات تسجيل الدخول الفاشلة</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="lockoutDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مدة قفل الحساب (بالدقائق)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تفعيل المصادقة الثنائية</Label>
                        <p className="text-sm text-muted-foreground">طلب المصادقة الثنائية للحسابات ذات الصلاحيات</p>
                      </div>
                      <Switch defaultChecked={securityPolicies.twoFactorAuth.enabled} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  تحديث سياسة الأمان
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* تبويب قيود IP */}
        <TabsContent value="ip" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">قيود عناوين IP</h3>
              <p className="text-sm text-muted-foreground">التحكم في الوصول بناءً على عناوين IP والشبكات</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestConnectivity}>
                اختبار الاتصال
              </Button>
              <Button onClick={() => setIsAddingIpRule(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة قاعدة
              </Button>
            </div>
          </div>

          {isAddingIpRule && (
            <Card>
              <CardHeader>
                <CardTitle>إضافة قاعدة تقييد IP</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...ipForm}>
                  <form onSubmit={ipForm.handleSubmit(onAddIpRestriction)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={ipForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع القاعدة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر النوع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="whitelist">القائمة البيضاء (سماح)</SelectItem>
                                <SelectItem value="blacklist">القائمة السوداء (حظر)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ipForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عنوان IP/CIDR</FormLabel>
                            <FormControl>
                              <Input placeholder="192.168.1.0/24" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ipForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الوصف</FormLabel>
                            <FormControl>
                              <Input placeholder="أدخل الوصف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingIpRule(false)}
                        disabled={isLoading}
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        إضافة قاعدة
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>عنوان IP/CIDR</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipRestrictions.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge className={rule.type === "whitelist" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {rule.type === "whitelist" ? "سماح" : "حظر"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{rule.address}</TableCell>
                      <TableCell>{rule.description}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إدارة الجلسات */}
        <TabsContent value="sessions" className="space-y-6">
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onUpdateSessionSettings)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      مهلة الجلسة
                    </CardTitle>
                    <CardDescription>ضبط مهلة الجلسة العامة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={sessionForm.control}
                      name="globalTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المهلة (بالدقائق)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تحذير قبل انتهاء المهلة</Label>
                        <p className="text-sm text-muted-foreground">إظهار تحذير قبل 5 دقائق</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      تحديث المهلة
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      الجلسات المتزامنة
                    </CardTitle>
                    <CardDescription>إدارة الوصول عبر جلسات متعددة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={sessionForm.control}
                      name="maxConcurrentSessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحد الأقصى للجلسات المتزامنة</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تفعيل "تذكرني"</Label>
                        <p className="text-sm text-muted-foreground">السماح بجلسات تسجيل دخول ممتدة</p>
                      </div>
                      <Switch defaultChecked={sessionSettings.rememberMeEnabled} />
                    </div>
                    <FormField
                      control={sessionForm.control}
                      name="rememberMeDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مدة "تذكرني" (أيام)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      تحديث إعدادات التزامن
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      الجلسات النشطة
                    </CardTitle>
                    <CardDescription>{activeSessions.length} جلسة نشطة حالياً</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-700">{activeSessions.length}</p>
                      <p className="text-sm text-purple-600">جلسات نشطة</p>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      عرض جميع الجلسات
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>جلسات المستخدمين النشطة</CardTitle>
                <div className="flex items-center gap-2">
                  <Input placeholder="ابحث في الجلسات النشطة..." className="w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>عنوان IP</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>الجهاز</TableHead>
                    <TableHead>وقت تسجيل الدخول</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.user}</TableCell>
                      <TableCell className="font-mono">{session.ip}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell>{session.device}</TableCell>
                      <TableCell>{session.loginTime}</TableCell>
                      <TableCell>{session.lastActivity}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleForceLogout(session.id)}
                        >
                          تسجيل خروج إجباري
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب سجلات الوصول */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">سجلات الوصول</h3>
              <p className="text-sm text-muted-foreground">مراقبة وصول النظام والأحداث الأمنية</p>
            </div>
            <div className="flex items-center gap-4">
              <Input 
                placeholder="ابحث في السجلات..." 
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={logFilter} onValueChange={setLogFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="تصفية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأحداث</SelectItem>
                  <SelectItem value="success">ناجحة</SelectItem>
                  <SelectItem value="failed">فاشلة</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                تصدير
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطابع الزمني</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>عنوان IP</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono">{log.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.status === "Success" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : log.status === "Failed" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          <Badge 
                            className={
                              log.status === "Success" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessControl;