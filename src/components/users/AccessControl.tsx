import { useEffect, useMemo, useState } from "react";
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
import { Shield, Globe, Clock, Eye, Download, Plus, Trash2, Users, Settings, Loader2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

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

export default function AccessControl() {
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

  useEffect(() => {
    fetchSessions();
    fetchLogs();
    fetchSettings();
    fetchIpRules();
  }, []);

  // --- Handlers ---
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

  return (
    <div className="space-y-6 container mx-auto p-4 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التحكم في الوصول والأمان</h1>
          <p className="text-muted-foreground mt-1">إدارة سياسات الأمان، الجلسات النشطة، وسجلات النظام</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full min-w-[600px] grid-cols-4 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> سياسة الأمان</TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2"><Clock className="h-4 w-4" /> إدارة الجلسات</TabsTrigger>
            <TabsTrigger value="ip" className="gap-2"><Globe className="h-4 w-4" /> قيود الشبكة (IP)</TabsTrigger>
            <TabsTrigger value="logs" className="gap-2"><Eye className="h-4 w-4" /> سجلات النظام</TabsTrigger>
            </TabsList>
        </div>

        {/* 1. Security Policy Tab */}
        <TabsContent value="security">
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onUpdateSecurityPolicy)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    
                    <FormField control={securityForm.control} name="requireUppercase" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5"><FormLabel>حروف كبيرة (A-Z)</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />

                    <FormField control={securityForm.control} name="requireNumbers" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5"><FormLabel>أرقام (0-9)</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                  </CardContent>
                </Card>

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
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} size="lg" className="shadow-md">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} حفظ التغييرات
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* 2. Sessions Management Tab */}
        <TabsContent value="sessions" className="space-y-6">
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
        <TabsContent value="ip" className="space-y-6">
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
        <TabsContent value="logs" className="space-y-4">
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

      </Tabs>
    </div>
  );
}