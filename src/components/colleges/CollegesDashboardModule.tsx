import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, BookOpen, Users, DollarSign, Loader2, TrendingUp, GraduationCap, Clock, Activity, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardData {
  counts: {
    departments: number;
    classrooms: number;
    programs: number;
    staff: number;
  };
  financials: {
    current_month: number;
    last_six_months: { month_key: string; total_amount: string }[];
    top_spenders: {
      name: string;
      department: string;
      hours: string;
      amount: string;
    }[];
  };
  // بيانات النشاط السريع (Simulation - يمكن ربطها بالباك إند لاحقاً)
  quick_stats?: {
    today_sessions: number;
    active_courses: number;
    today_attendance: number;
    today_absence: number;
    busy_rooms: number;
  };
}

type CollegesDashboardModuleProps = {
  collegeId: number | string;
};

export default function CollegesDashboardModule({ collegeId }: CollegesDashboardModuleProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // لزر التحديث

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      // التحكم في مؤشرات التحميل
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      
      // جلب البيانات الحقيقية من الباك إند
      const res = await api.get(`/v1/colleges/${collegeId}/dashboard`);
      
      // تخزين البيانات في الحالة
      setData(res.data.data);
      
    } catch (error) {
      console.error("Failed to fetch college dashboard", error);
      // (اختياري) إظهار رسالة خطأ للمستخدم
      // toast({ title: "خطأ", description: "فشل تحميل البيانات", variant: "destructive" });
    } finally {
      // إيقاف مؤشرات التحميل دائماً
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (collegeId) fetchDashboardData();
  }, [collegeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل لوحة البيانات...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-muted-foreground">لا توجد بيانات لعرضها</div>;

  const chartData = data.financials.last_six_months.map(item => ({
    name: format(new Date(item.month_key + "-01"), "MMM", { locale: ar }),
    fullDate: format(new Date(item.month_key + "-01"), "MMMM yyyy", { locale: ar }),
    value: Number(item.total_amount)
  })).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10" dir="rtl">
      
      {/* 1. Header Stats (ألوان هادئة ومتسقة) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="أعضاء هيئة التدريس" 
          value={data.counts.staff} 
          desc="كادر أكاديمي نشط"
          icon={<Users className="h-5 w-5" />} 
        />
        <StatsCard 
          title="البرامج الأكاديمية" 
          value={data.counts.programs} 
          desc={`موزعة على ${data.counts.departments} أقسام`}
          icon={<GraduationCap className="h-5 w-5" />} 
        />
        <StatsCard 
          title="القاعات الدراسية" 
          value={data.counts.classrooms} 
          desc="جاهزة للاستخدام"
          icon={<Building2 className="h-5 w-5" />} 
        />
        <StatsCard 
          title="المصروفات (الشهر الحالي)" 
          value={Number(data.financials.current_month).toLocaleString()} 
          desc="إجمالي الاستحقاقات"
          icon={<DollarSign className="h-5 w-5" />} 
          isMoney
          highlight // تمييز بسيط لهذه البطاقة فقط
        />
      </div>

      {/* 2. Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Chart */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              الاتجاه المالي
            </CardTitle>
            <CardDescription>تحليل المصروفات والاستحقاقات لآخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {/* تدرج لوني هادئ يعتمد على لون النظام */}
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    cursor={{stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4'}}
                    formatter={(value: number) => [`${value.toLocaleString()} ر.ي`, 'المبلغ']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Activity Card (المطور) */}
        <Card className="border shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                النشاط اليومي
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>ملخص العمليات لليوم الحالي</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            
            {/* 1. الجلسات */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full border text-primary"><Clock className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold">المحاضرات المجدولة</p>
                  <p className="text-xs text-muted-foreground">لليوم الدراسي</p>
                </div>
              </div>
              <span className="text-xl font-bold text-foreground">{data.quick_stats?.today_sessions}</span>
            </div>

            {/* 2. الحضور */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full border text-green-600"><CheckCircle2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold">تم التحضير</p>
                  <p className="text-xs text-muted-foreground">جلسات منفذة</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">{data.quick_stats?.today_attendance}</span>
            </div>

            {/* 3. الغياب */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full border text-red-500"><AlertCircle className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold">غياب / لم يبدأ</p>
                  <p className="text-xs text-muted-foreground">تحتاج متابعة</p>
                </div>
              </div>
              <span className="text-xl font-bold text-red-500">{data.quick_stats?.today_absence}</span>
            </div>

            {/* 4. القاعات */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full border text-blue-500"><Building2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-bold">القاعات المشغولة</p>
                  <p className="text-xs text-muted-foreground">الآن</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{data.quick_stats?.busy_rooms}</span>
            </div>
            
            <div className="mt-auto pt-2 text-center">
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                آخر تحديث: {new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Top Spenders Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/5 border-b py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">الأكثر نشاطاً واستحقاقاً</CardTitle>
              <CardDescription>أعلى 5 أعضاء هيئة تدريس (تراكمي)</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal">الكلية كاملة</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="w-[50px] text-center text-muted-foreground h-10">#</TableHead>
                <TableHead className="text-right text-muted-foreground h-10">عضو هيئة التدريس</TableHead>
                <TableHead className="text-right text-muted-foreground h-10">القسم العلمي</TableHead>
                <TableHead className="text-center text-muted-foreground h-10">إجمالي الساعات</TableHead>
                <TableHead className="text-left pl-6 text-muted-foreground h-10">المستحقات المالية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.financials.top_spenders.length > 0 ? (
                  data.financials.top_spenders.map((lecturer, index) => (
                  <TableRow key={index} className="hover:bg-muted/5 transition-colors group border-b border-border/40 last:border-0">
                      <TableCell className="text-center text-muted-foreground font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border bg-background">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {lecturer.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-foreground">{lecturer.name}</p>
                            <p className="text-[10px] text-muted-foreground">عضو هيئة تدريس</p> 
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lecturer.department}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                          {Number(lecturer.hours).toFixed(1)} ساعة
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left pl-6">
                        <span className="font-bold text-foreground font-mono text-sm">
                          {Number(lecturer.amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground mr-1">ر.ي</span>
                      </TableCell>
                  </TableRow>
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8 opacity-10" />
                          <p>لا توجد سجلات مالية نشطة حالياً.</p>
                        </div>
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- مكون البطاقة الإحصائية (بتصميم نظيف) ---
function StatsCard({ title, value, desc, icon, isMoney = false, highlight = false }: { title: string; value: number | string; desc?: string; icon: React.ReactNode; isMoney?: boolean; highlight?: boolean }) {
  return (
    <Card className={`shadow-sm transition-all duration-300 overflow-hidden relative group border ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={`text-2xl font-bold tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>
              {value}
              {isMoney && <span className="text-xs font-normal text-muted-foreground mr-1">ر.ي</span>}
            </h3>
            {desc && <p className="text-[10px] text-muted-foreground mt-2 opacity-80">{desc}</p>}
          </div>
          <div className={`p-2 rounded-lg shadow-sm ${highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}