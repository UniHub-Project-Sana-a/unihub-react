import { useEffect, useMemo, useState, useRef  } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Globe, Clock, Eye, Download, Plus, Trash2, Users, Settings, Loader2, Smartphone, AlertTriangle, Search, Monitor, UserCheck, UserX, School, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";

// --- Schemas (Stable Types) ---
const securityPolicySchema = z.object({
  minPasswordLength: z.number().min(6).max(50),
  maxFailedAttempts: z.number().min(3).max(10),
  lockoutDuration: z.number().min(5).max(120),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
});

const ipRestrictionSchema = z.object({
  type: z.enum(["whitelist", "blacklist"]),
  address: z.string().min(7, "عنوان IP غير صالح"),
  description: z.string().min(1, "الوصف مطلوب"),
});

const sessionSettingsSchema = z.object({
  globalTimeout: z.number().min(15).max(480),
  maxConcurrentSessions: z.number().min(1).max(10),
  rememberMeEnabled: z.boolean(),
  rememberMeDuration: z.number().min(1).max(90),
});

// --- Types Injection ---
type SecurityPolicyValues = z.infer<typeof securityPolicySchema>;
type IpRestrictionValues = z.infer<typeof ipRestrictionSchema>;
type SessionSettingsValues = z.infer<typeof sessionSettingsSchema>;

// --- API Types ---
type ApiSession = {
  id: string;
  user_id: number;
  full_name: string;
  email: string;
  device: string | null;
  revoked: number;
  created_at: string | null;
  expires_at: string | null;
};

type ApiLog = {
  activity_id: number;
  created_at: string;
  full_name: string;
  email: string;
  action_type: string;
  module_name: string | null;
  action_description: string | null;
};

type IpRule = {
    id: number;
    type: "whitelist" | "blacklist";
    address: string;
    description: string;
    status: string;
    created_at: string;
}

type UserDevice = {
    device_id: number;
    user_id: number;
    device_name: string;
    mac_address: string;
    os_type: string;
    is_auto_attendance_enabled: boolean;
    last_login_at: string;
    user?: {
        full_name: string;
        academic_number: string;
    };
};

export default function AccessControl() {
  const {can, canAny } = usePermission();
  const { toast } = useToast();

  // States
  const [activeTab, setActiveTab] = useState("security");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingIpRule, setIsAddingIpRule] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data States
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [ipRestrictions, setIpRestrictions] = useState<IpRule[]>([]);

  // Device States
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [suspiciousDevices, setSuspiciousDevices] = useState<Record<string, UserDevice[]>>({});
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null);

  //  حالة للتبويب الفرعي للأجهزة
  const [deviceSubTab, setDeviceSubTab] = useState("student"); // student | lecturer
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [colleges, setColleges] = useState<any[]>([]); // قائمة الكليات

  // ✅ مرجع للجدول للقفز إليه
  const tableRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // --- Forms Initialization ---
  const securityForm = useForm<SecurityPolicyValues>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: {
      minPasswordLength: 8,
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      requireUppercase: true,
      requireNumbers: true,
    },
  });

  const ipForm = useForm<IpRestrictionValues>({
    resolver: zodResolver(ipRestrictionSchema),
    defaultValues: { type: "whitelist", address: "", description: "" },
  });

  const sessionForm = useForm<SessionSettingsValues>({
    resolver: zodResolver(sessionSettingsSchema),
    defaultValues: {
      globalTimeout: 120,
      maxConcurrentSessions: 3,
      rememberMeEnabled: true,
      rememberMeDuration: 30,
    },
  });

  // --- API Calls ---
    // جلب الكليات للفلتر
  useEffect(() => {
      api.get('/v1/lookups/colleges').then(res => {
          // طباعة للتشخيص
          console.log("Colleges Data:", res.data); 
          
          // تأكد من المسار الصحيح (data.data أو data مباشرة)
          // في LookupsController عادة تكون البيانات مباشرة في مصفوفة أو داخل data
          const collegesData = Array.isArray(res.data) ? res.data : (res.data.data || []);
          
          // تحويل البيانات لتناسب القائمة (في حال كانت الأسماء مختلفة)
          const formattedColleges = collegesData.map((c: any) => ({
              college_id: c.college_id || c.id,
              college_name: c.college_name || c.name
          }));
          
          setColleges(formattedColleges);
      });
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/v1/admin/sessions");
      setSessions(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الجلسات النشطة", variant: "destructive" });
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get("/v1/admin/audit-logs");
      setLogs(res.data?.data ?? res.data);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل سجلات النظام", variant: "destructive" });
    }
  };

  const fetchIpRules = async () => {
    try {
      const res = await api.get("/v1/admin/ip-restrictions");
      const data = res.data?.data || res.data;
      setIpRestrictions(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch IP rules");
    }
  };

  const fetchSettings = async () => {
    try {
        const res = await api.get("/v1/admin/security/policy");
        if(res.data) {
            if (res.data.security) securityForm.reset(res.data.security);
            if (res.data.session) sessionForm.reset(res.data.session);
        }
    } catch {
        // Ignore
    }
  };

  const fetchDevices = async () => {
      try {
          const res = await api.get("/v1/admin/devices", { 
              params: { 
                  search: deviceSearch,
                  user_type: deviceSubTab,
                  college_id: selectedCollege
              } 
          });
          setDevices(res.data.data?.data || res.data.data || []);
          setSuspiciousDevices(res.data.suspicious || {});
      } catch (error) {
          console.error("Failed to fetch devices");
      }
  };

  useEffect(() => {
    fetchSessions();
    fetchLogs();
    fetchSettings();
    fetchIpRules();
    fetchDevices();
  }, []);

  useEffect(() => {
      if (activeTab === 'devices') {
          fetchDevices();
      }
  }, [activeTab, deviceSubTab, selectedCollege, deviceSearch]);

  // --- Handlers ---
    //  Toggle Attendance Function
  const toggleAttendance = async (deviceId: number, currentStatus: boolean) => {
      try {
          await api.put(`/v1/admin/devices/${deviceId}/toggle-attendance`);
          toast({ title: "تم التحديث", description: `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الحضور الآلي.` });
          // تحديث محلي سريع للواجهة
          setDevices(prev => prev.map(d => d.device_id === deviceId ? {...d, is_auto_attendance_enabled: !currentStatus} : d));
      } catch {
          toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
      }
  }

  //  Scroll to Row Function
  const scrollToDevice = (deviceId: number) => {
      const element = tableRowRefs.current[deviceId];
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-yellow-100'); // تمييز مؤقت
          setTimeout(() => element.classList.remove('bg-yellow-100'), 2000);
      } else {
          toast({ description: "الجهاز غير موجود في الصفحة الحالية" });
      }
  };

  const deleteDevice = async (id: number) => {
      try {
          await api.delete(`/v1/admin/devices/${id}`);
          toast({ title: "تم الحذف", description: "تم إزالة الجهاز بنجاح." });
          fetchDevices();
      } catch {
          toast({ title: "خطأ", description: "فشل حذف الجهاز", variant: "destructive" });
      }
  };

  const revokeToken = async (tokenId: string) => {
    if(!confirm("هل أنت متأكد من إنهاء هذه الجلسة؟")) return;
    try {
      await api.post("/v1/admin/sessions/revoke", { token_id: tokenId });
      toast({ title: "تم بنجاح", description: "تم إنهاء الجلسة" });
      await fetchSessions();
    } catch {
      toast({ title: "خطأ", description: "فشل العملية", variant: "destructive" });
    }
  };

  const onUpdateSecurityPolicy: SubmitHandler<SecurityPolicyValues> = async (data) => {
    setIsLoading(true);
    try {
      await api.put("/v1/admin/security/policy", { type: 'security', ...data });
      toast({ title: "تم الحفظ", description: "تم تحديث سياسات الأمان بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdateSessionSettings: SubmitHandler<SessionSettingsValues> = async (data) => {
    setIsLoading(true);
    try {
      await api.put("/v1/admin/security/policy", { type: 'session', ...data });
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات الجلسات" });
    } catch {
      toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddIpRestriction: SubmitHandler<IpRestrictionValues> = async (data) => {
      setIsLoading(true);
      try {
        await api.post("/v1/admin/ip-restrictions", data);
        toast({ title: "تم الإضافة", description: "تمت إضافة قاعدة IP جديدة" });
        ipForm.reset();
        setIsAddingIpRule(false);
        fetchIpRules();
      } catch (error: any) {
        toast({ title: "خطأ", description: "فشل إضافة القاعدة", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  };

  const deleteIpRule = async (id: number) => {
      if(!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
      try {
          await api.delete(`/v1/admin/ip-restrictions/${id}`);
          toast({ title: "تم الحذف", description: "تم إزالة القاعدة" });
          fetchIpRules();
      } catch {
          toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
      }
  }

  const exportLogsCsv = () => {
    const header = ["Timestamp","User","Email","Action","Module","Description"];
    const rows = logs.map((l) => [
      l.created_at, l.full_name, l.email, l.action_type, l.module_name ?? "", (l.action_description ?? "").replace(/[\r\n]+/g, " "),
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtering
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const text = `${log.full_name} ${log.email} ${log.action_type} ${log.module_name || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [logs, searchQuery]);

  const tabsConfig = [
    { 
      value: "security", 
      label: "سياسة الأمان", 
      icon: Shield,
      // يظهر التبويب إذا كان يملك عرض أو تعديل
      isVisible: canAny(['security.view_policy', 'security.manage_policy']) 
    },
    { 
      value: "sessions", 
      label: "إدارة الجلسات", 
      icon: Clock, 
      isVisible: can('security.manage_sessions') 
    },
    { 
      value: "devices", 
      label: "أجهزة المستخدمين", 
      icon: Smartphone, 
      isVisible: can('security.view_devices') 
    },
    { 
      value: "ip", 
      label: "قيود الشبكة (IP)", 
      icon: Globe, 
      isVisible: can('security.manage_ips') 
    },
    { 
      value: "logs", 
      label: "سجلات النظام", 
      icon: Eye, 
      isVisible: can('logs.view') 
    },
  ];
  
  // تصفية التبويبات
  const visibleTabs = tabsConfig.filter(tab => tab.isVisible);
  
  // تحديد عدد الأعمدة ديناميكياً
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[visibleTabs.length] || "grid-cols-5"; // Fallback
  const canManage = can('security.manage_policy');

  return (
    <div className="space-y-6 container mx-auto p-4 animate-in fade-in duration-500" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التحكم في الوصول والأمان</h1>
          <p className="text-muted-foreground mt-1">إدارة سياسات الأمان، الجلسات النشطة، وسجلات النظام</p>
        </div>
      </div>

    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2" dir="rtl">
          {/* ندمج كلاس الأعمدة الديناميكي */}
          <TabsList className={`grid w-full min-w-[600px] ${gridColsClass} bg-muted/50 p-1 rounded-lg`}>
            
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <Icon className="h-4 w-4" /> 
                  {tab.label}
                </TabsTrigger>
              );
            })}
        
          </TabsList>
        </div>

        {/* 1. Security Policy Tab */}
        <TabsContent value="security" dir="rtl">
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onUpdateSecurityPolicy)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* بطاقة تعقيد كلمة المرور */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" /> تعقيد كلمة المرور
                    </CardTitle>
                    <CardDescription>الحد الأدنى لمتطلبات كلمات مرور المستخدمين</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={securityForm.control} name="minPasswordLength" render={({ field }) => (
                        <FormItem>
                            <FormLabel>أقل طول لكلمة المرور</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    // ✅ تعطيل الحقل إذا لم يملك صلاحية الإدارة
                                    disabled={!canManage} 
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    
                    <FormField control={securityForm.control} name="requireUppercase" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5"><FormLabel>حروف كبيرة (A-Z)</FormLabel></div>
                            <FormControl>
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                    // ✅ تعطيل الزر
                                    disabled={!canManage} 
                                />
                            </FormControl>
                        </FormItem>
                    )} />
    
                    <FormField control={securityForm.control} name="requireNumbers" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5"><FormLabel>أرقام (0-9)</FormLabel></div>
                            <FormControl>
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                    // ✅ تعطيل الزر
                                    disabled={!canManage} 
                                />
                            </FormControl>
                        </FormItem>
                    )} />
                  </CardContent>
                </Card>
    
                {/* بطاقة سياسة الدخول */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-green-600" /> سياسة الدخول
                    </CardTitle>
                    <CardDescription>حماية الحسابات من محاولات التخمين</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={securityForm.control} name="maxFailedAttempts" render={({ field }) => (
                        <FormItem>
                            <FormLabel>الحد الأقصى للمحاولات الفاشلة</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    // ✅ تعطيل الحقل
                                    disabled={!canManage} 
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={securityForm.control} name="lockoutDuration" render={({ field }) => (
                        <FormItem>
                            <FormLabel>مدة الحظر المؤقت (دقائق)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    // ✅ تعطيل الحقل
                                    disabled={!canManage} 
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>
    
              {/* زر الحفظ: يظهر فقط إذا كان لديه صلاحية الإدارة */}
              {canManage && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} size="lg" className="shadow-md">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ التغييرات
                  </Button>
                </div>
              )}
              
            </form>
          </Form>
        </TabsContent>

        {/* 2. Sessions Management Tab */}
        <TabsContent value="sessions" className="space-y-6" dir="rtl">
            <Card className="bg-muted/20 border-dashed">
                <CardHeader><CardTitle className="text-base">إعدادات الجلسات</CardTitle></CardHeader>
                <CardContent>
                    <Form {...sessionForm}>
                        <form onSubmit={sessionForm.handleSubmit(onUpdateSessionSettings)} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <FormField control={sessionForm.control} name="globalTimeout" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>وقت انتهاء الجلسة (دقيقة)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <FormField control={sessionForm.control} name="maxConcurrentSessions" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الحد الأقصى للأجهزة المتزامنة</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <FormField control={sessionForm.control} name="rememberMeDuration" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>مدة "تذكرني" (أيام)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <div className="pb-2">
                                <Button type="submit" variant="secondary" className="w-full">تحديث الإعدادات</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> الجلسات النشطة حالياً</CardTitle>
                        <Badge variant="outline" className="text-base px-3">{sessions.filter(s => !s.revoked).length} جلسة</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>المستخدم</TableHead>
                                <TableHead>الجهاز / المتصفح</TableHead>
                                <TableHead className="text-center">وقت الدخول</TableHead>
                                <TableHead className="text-center">الحالة</TableHead>
                                <TableHead className="text-left">إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد جلسات نشطة.</TableCell></TableRow>
                            ) : (
                                sessions.map(session => (
                                    <TableRow key={session.id} className={session.revoked ? "opacity-50 bg-muted/20" : ""}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{session.full_name}</span>
                                                <span className="text-xs text-muted-foreground">{session.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]" title={session.device || ""}>
                                            {session.device || "Unknown Device"}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{session.created_at}</TableCell>
                                        <TableCell className="text-center">
                                            {session.revoked ? (
                                                <Badge variant="secondary">منتهية</Badge>
                                            ) : (
                                                <Badge className="bg-green-500 hover:bg-green-600">نشطة</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!session.revoked && (
                                                <Button variant="destructive" size="sm" onClick={() => revokeToken(session.id)}>
                                                    إخراج
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 3. IP Restrictions Tab */}
        <TabsContent value="ip" className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">القائمة السوداء والبيضاء</h3>
                    <p className="text-sm text-muted-foreground">التحكم في العناوين المسموح لها بالوصول للنظام.</p>
                </div>
                <Button onClick={() => setIsAddingIpRule(true)}><Plus className="w-4 h-4 mr-2" /> إضافة قاعدة</Button>
            </div>

            {isAddingIpRule && (
                <Card className="border-dashed border-2">
                    <CardContent className="pt-6">
                        <Form {...ipForm}>
                            <form onSubmit={ipForm.handleSubmit(onAddIpRestriction)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <FormField control={ipForm.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel>النوع</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="whitelist">سماح (Whitelist)</SelectItem><SelectItem value="blacklist">حظر (Blacklist)</SelectItem></SelectContent></Select>
                                    </FormItem>
                                )} />
                                <FormField control={ipForm.control} name="address" render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>IP / CIDR</FormLabel><FormControl><Input placeholder="e.g. 192.168.1.0/24" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={ipForm.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input placeholder="وصف القاعدة..." {...field} /></FormControl></FormItem>
                                )} />
                                <div className="flex gap-2 col-span-1 md:col-span-4 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setIsAddingIpRule(false)}>إلغاء</Button>
                                    <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ القاعدة</Button>
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
                                <TableHead>نوع القيد</TableHead>
                                <TableHead>العنوان (IP)</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ipRestrictions.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد قيود مضافة.</TableCell></TableRow>
                            ) : (
                                ipRestrictions.map((rule, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Badge variant={rule.type === 'whitelist' ? 'default' : 'destructive'}>
                                                {rule.type === 'whitelist' ? 'مسموح' : 'محظور'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">{rule.address}</TableCell>
                                        <TableCell>{rule.description}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{rule.created_at ? new Date(rule.created_at).toLocaleDateString() : '—'}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteIpRule(rule.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 4. Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4" dir="rtl">
            <div className="flex gap-4">
                <Input 
                    placeholder="بحث في السجلات (اسم، بريد، عملية)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
                <Button variant="outline" onClick={exportLogsCsv}><Download className="w-4 h-4 mr-2" /> تصدير CSV</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">الوقت</TableHead>
                                    <TableHead>المستخدم</TableHead>
                                    <TableHead>العملية</TableHead>
                                    <TableHead>الوحدة</TableHead>
                                    <TableHead className="w-[40%]">التفاصيل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد سجلات مطابقة.</TableCell></TableRow>
                                ) : (
                                    filteredLogs.map(log => (
                                        <TableRow key={log.activity_id} className="hover:bg-muted/5">
                                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{log.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{log.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{log.action_type}</Badge></TableCell>
                                            <TableCell className="text-sm">{log.module_name || 'System'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]" title={log.action_description || ""}>
                                                {log.action_description}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* 5. Devices Management Tab */}
        <TabsContent value="devices" className="space-y-6" dir="rtl">
            
            {/* Sub-Tabs & Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-end bg-card p-4 rounded-xl border shadow-sm">
                
                {/* التبويبات الفرعية (طلاب / محاضرين) */}
                <div className="bg-muted p-1 rounded-lg flex gap-1 w-full md:w-auto">
                    <Button 
                        variant={deviceSubTab === 'student' ? 'default' : 'ghost'} 
                        onClick={() => setDeviceSubTab('student')}
                        size="sm"
                        className="gap-2 flex-1 md:flex-none shadow-sm"
                    >
                        <GraduationCap className="w-4 h-4" /> الطلاب
                    </Button>
                    <Button 
                        variant={deviceSubTab === 'lecturer' ? 'default' : 'ghost'} 
                        onClick={() => setDeviceSubTab('lecturer')}
                        size="sm"
                        className="gap-2 flex-1 md:flex-none shadow-sm"
                    >
                        <UserCheck className="w-4 h-4" /> المحاضرين
                    </Button>
                </div>

                {/* الفلاتر */}
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                        <SelectTrigger className="w-full md:w-[200px] bg-background">
                            <SelectValue placeholder="اختر الكلية" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الكليات</SelectItem>
                            {colleges.map(col => (
                                <SelectItem key={col.college_id} value={String(col.college_id)}>{col.college_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="بحث (اسم، رقم جامعي)..." 
                            className="pr-8 bg-background"
                            value={deviceSearch}
                            onChange={(e) => setDeviceSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* أ) قسم التنبيهات (الأجهزة المكررة) */}
            {Object.keys(suspiciousDevices).length > 0 && (
                <Card className="border-red-200 bg-red-50/30 animate-in slide-in-from-top-4 duration-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                                    <AlertTriangle className="h-5 w-5" />
                                    تنبيه أمني: أجهزة مشتركة
                                </CardTitle>
                                <CardDescription className="text-red-700/80 mt-1">
                                    تم اكتشاف {Object.keys(suspiciousDevices).length} أجهزة (MAC Address متطابق) مسجلة لأكثر من مستخدم.
                                </CardDescription>
                            </div>
                            <Badge variant="destructive" className="animate-pulse">إجراء مطلوب</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(suspiciousDevices).map(([mac, devs]) => (
                                <div key={mac} className="border bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-muted-foreground truncate max-w-[150px]" title={mac}>
                                            {mac}
                                        </span>
                                        <Badge variant="outline" className="h-5 text-[10px] border-red-200 text-red-600 bg-red-50">
                                            {devs.length} حسابات
                                        </Badge>
                                    </div>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                        {devs.map(d => (
                                            <div key={d.device_id} className="flex justify-between items-center text-sm p-1.5 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-colors">
                                                <div 
                                                    className="flex flex-col cursor-pointer"
                                                    onClick={() => scrollToDevice(d.device_id)}
                                                    title="انقر للذهاب للجدول"
                                                >
                                                    <span className="font-bold text-primary text-xs hover:underline">{d.user?.full_name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{d.user?.academic_number}</span>
                                                </div>
                                                
                                                <div className="flex gap-1">
                                                    {/* زر الانتقال */}
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500 hover:bg-blue-50" onClick={() => scrollToDevice(d.device_id)}>
                                                        <Settings className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ب) جدول الأجهزة العام */}
            <Card className="border-t-4 border-t-primary/60 shadow-md">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead className="text-right w-[250px] font-bold">المستخدم</TableHead>
                                <TableHead className="text-right font-bold">الجهاز</TableHead>
                                <TableHead className="text-right font-mono text-xs hidden md:table-cell text-muted-foreground">MAC Address</TableHead>
                                <TableHead className="text-center font-bold">آخر دخول</TableHead>
                                
                                {/* عمود الحضور الآلي (يظهر للطلاب فقط) */}
                                {deviceSubTab === 'student' && (
                                    <TableHead className="text-center w-[150px] font-bold">الحضور الآلي</TableHead>
                                )}
                                
                                <TableHead className="text-left w-[100px] font-bold px-4">إجراء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {devices.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <Smartphone className="w-10 h-10 opacity-20" />
                                    <p>لا توجد أجهزة مطابقة للفلاتر الحالية.</p>
                                </TableCell></TableRow>
                            ) : (
                                devices.map(device => (
                                    <TableRow 
                                        key={device.device_id} 
                                        ref={(el) => (tableRowRefs.current[device.device_id] = el)} 
                                        className="transition-colors duration-1000 hover:bg-muted/5 group"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-primary">{device.user?.full_name || "مستخدم محذوف"}</span>
                                                <span className="text-[11px] text-muted-foreground font-mono">{device.user?.academic_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md w-fit border">
                                                {device.os_type?.toLowerCase().includes('android') ? <Smartphone className="w-4 h-4 text-green-600" /> : 
                                                 device.os_type?.toLowerCase().includes('ios') ? <Smartphone className="w-4 h-4 text-slate-600" /> : 
                                                 <Monitor className="w-4 h-4 text-blue-600" />}
                                                <span className="text-xs font-medium">{device.device_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] hidden md:table-cell text-muted-foreground">{device.mac_address}</TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground dir-ltr font-medium">
                                            {device.last_login_at ? new Date(device.last_login_at).toLocaleDateString('en-GB') : '-'}
                                        </TableCell>
                                        
                                        {/* زر التبديل للطلاب */}
                                        {deviceSubTab === 'student' && (
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2 bg-muted/20 py-1 rounded-full border border-transparent hover:border-border transition-colors w-fit mx-auto px-3">
                                                    <Switch 
                                                        className="data-[state=checked]:bg-green-500"
                                                        checked={device.is_auto_attendance_enabled} 
                                                        onCheckedChange={() => toggleAttendance(device.device_id, device.is_auto_attendance_enabled)}
                                                    />
                                                    <span className={`text-[10px] w-8 text-center ${device.is_auto_attendance_enabled ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}>
                                                        {device.is_auto_attendance_enabled ? 'مفعل' : 'معطل'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        )}
                                        
                                        <TableCell className="text-left px-4">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-destructive hover:bg-red-50 hover:text-red-700 h-8 w-8 transition-colors" 
                                                onClick={() => setDeviceToDelete(device.device_id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* مودال تأكيد الحذف */}
            <Dialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="w-5 h-5" />
                            حذف الجهاز
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            هل أنت متأكد من رغبتك في حذف هذا الجهاز نهائياً؟ <br/>
                            <span className="text-xs text-red-600 font-medium">سيتم تسجيل خروج المستخدم فوراً ولن يتمكن من الدخول إلا بتوثيق جديد.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-start mt-4">
                        <Button 
                            variant="destructive" 
                            onClick={() => deviceToDelete && deleteDevice(deviceToDelete).then(() => setDeviceToDelete(null))}
                        >
                            تأكيد الحذف
                        </Button>
                        <Button variant="outline" onClick={() => setDeviceToDelete(null)}>
                            إلغاء
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </TabsContent>

      </Tabs>
    </div>
  );
}