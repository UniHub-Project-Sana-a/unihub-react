import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Users, GraduationCap, TrendingUp, 
  Activity, AlertCircle, ArrowRight, BarChart3, DollarSign, Printer, FileText, Download, Loader2 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api"; // تأكد من مسار استيراد api
import { toast } from "sonner";

// تعريف الواجهات (Interfaces) بناءً على رد الباك إند
interface UniversityKpis {
  total_colleges: number;
  total_students: number;
  total_staff: number;
  daily_attendance_rate: number;
  trends: {
    colleges: string;
    students: string;
    staff: string;
    attendance: string;
  };
}

interface CollegePerformance {
  id: number;
  name: string;
  attendance: number;
  sessions: number;
  total_sessions: number;
  budget: number;
}

interface Alert {
  id: number;
  college: string;
  msg: string;
  type: string;
}

interface DashboardData {
  kpis: UniversityKpis;
  colleges_performance: CollegePerformance[];
  alerts: Alert[];
}

// مجموعة ألوان متدرجة واحترافية
const COLORS = [
  '#2563eb', // أزرق (Blue 600)
  '#16a34a', // أخضر (Green 600)
  '#d97706', // برتقالي (Amber 600)
  '#dc2626', // أحمر (Red 600)
  '#7c3aed', // بنفسجي (Violet 600)
  '#0891b2', // سماوي (Cyan 600)
  '#db2777', // وردي (Pink 600)
  '#475569', // رمادي داكن (Slate 600)
];

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة لجلب البيانات من الـ API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // تأكد من أنك أضفت هذا المسار في routes/api.php
        const res = await api.get('/v1/dashboard/university-overview');
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch university dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // عرض مؤشر التحميل
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">جاري تحميل بيانات الجامعة...</p>
      </div>
    );
  }

  // التعامل مع حالة الفشل أو عدم وجود بيانات
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
        <p>لا توجد بيانات متاحة للعرض.</p>
      </div>
    );
  }

    // حساب إجمالي الميزانية لجميع الكليات للعرض في وسط الدائرة
  const totalBudget = data?.colleges_performance.reduce((acc, curr) => acc + curr.budget, 0) || 0;
  
  // دالة تنسيق الرقم (لتحويله إلى Millions أو Thousands)
  const formatBudget = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      
      {/* 1. ترويسة الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">نظرة عامة على الجامعة</h1>
          <p className="text-muted-foreground mt-1">
            متابعة حية للأداء الأكاديمي والمالي لجميع الكليات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="py-1.5 px-3 bg-white">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* 2. المؤشرات العليا (University KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="الكليات النشطة" 
          value={data.kpis.total_colleges} 
          icon={<Building2 className="w-5 h-5" />} 
          // الحماية باستخدام علامة الاستفهام ؟
          trend={data.kpis.trends?.colleges || "جاري التحديث..."} 
        />
        <KpiCard 
          title="إجمالي الطلاب" 
          value={data.kpis.total_students.toLocaleString()} 
          icon={<GraduationCap className="w-5 h-5" />} 
          trend={data.kpis.trends?.students || "جاري التحديث..."} 
        />
        <KpiCard 
          title="الكادر الأكاديمي" 
          value={data.kpis.total_staff} 
          icon={<Users className="w-5 h-5" />} 
          trend={data.kpis.trends?.staff || "جاري التحديث..."} 
        />
        <KpiCard 
          title="نسبة الانضباط اليومي" 
          value={`%${data.kpis.daily_attendance_rate}`} 
          icon={<Activity className="w-5 h-5" />} 
          trend={data.kpis.trends?.attendance || "جاري التحديث..."} 
          highlight
        />
      </div>

      {/* 3. الرسوم البيانية المقارنة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* أداء الكليات (Bar Chart) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              مقارنة الأداء الأكاديمي بين الكليات
            </CardTitle>
            <CardDescription>نسبة تنفيذ المحاضرات والالتزام بالجداول خلال الشهر الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.colleges_performance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="attendance" name="نسبة الالتزام" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* التوزيع المالي (Pie Chart) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              توزيع الميزانية التشغيلية
            </CardTitle>
            <CardDescription>نسبة الاستحقاقات المالية لكل كلية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.colleges_performance}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5}
                    dataKey="budget"
                  >
                    {data.colleges_performance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload; // الوصول لبيانات الكلية الحالية
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg text-right min-w-[150px]">
                            <p className="font-bold text-sm mb-1 text-primary">{data.name}</p> {/* اسم الكلية */}
                            <div className="flex justify-between items-center text-xs text-muted-foreground gap-4">
                              <span>الميزانية:</span>
                              <span className="font-mono font-medium text-foreground">
                                {data.budget.toLocaleString()} {/* المبلغ كاملاً مع الفواصل */}
                                <span className="text-[10px] mr-1">ر.ي</span>
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                <span className="text-xs text-muted-foreground">الإجمالي</span>
                <div className="font-bold text-lg" dir="ltr">
                  {formatBudget(totalBudget)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">ر.ي</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

            {/* 4. مصفوفة الكليات (Detailed Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* قائمة الكليات والحالة */}
        <Card className="lg:col-span-3 shadow-sm border-t-4 border-t-primary/20">
          <CardHeader className="pb-2 border-b bg-muted/5">
            <div className="flex justify-between items-center">
              <CardTitle>مصفوفة الكليات</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => toast("الصفحة قيد التطوير 🚧", {
                  description: "جاري العمل على التقرير المفصل للمصفوفة، سيكون متاحاً قريباً.",
                  duration: 3000,
                  action: {
                    label: "حسناً",
                    onClick: () => console.log("Dismissed"),
                  },
                })}
              >
                عرض تقرير مفصل
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right">الكلية</TableHead>
                  <TableHead className="text-center">الأداء الشهري</TableHead>
                  <TableHead className="text-center">الجلسات المنفذة</TableHead>
                  <TableHead className="text-center">الالتزام</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.colleges_performance.map((college) => {
                  
                  // منطق تحديد لون وحالة الالتزام (داخل الـ Map ليكون نظيفاً)
                  let statusColor = "bg-red-50 text-red-700 border-red-200";
                  let statusText = "ضعيف";
                  let progressColor = "bg-red-500";

                  if (college.attendance >= 85) {
                    statusColor = "bg-green-50 text-green-700 border-green-200";
                    statusText = "ممتاز";
                    progressColor = "bg-green-600";
                  } else if (college.attendance >= 60) {
                    statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                    statusText = "جيد";
                    progressColor = "bg-yellow-500";
                  }

                  return (
                    <TableRow key={college.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 rounded-lg text-primary"><Building2 className="w-4 h-4" /></div>
                          {/* حذفنا كلمة كلية الثابتة واعتمدنا على اسم الداتابيز */}
                          <span>{college.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-normal ${statusColor}`}>
                          {statusText}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        <span className="text-green-600 font-bold">{college.sessions}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-foreground">{college.total_sessions}</span>
                      </TableCell>
                       <TableCell className="text-center">
                        {college.total_sessions === 0 ? (
                          <span className="text-xs text-muted-foreground">--</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor}`} style={{ width: `${college.attendance}%` }}></div>
                            </div>
                            <span className="text-xs font-bold">{college.attendance}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        {/* 🔥 تصحيح الرابط: استخدام college.id بدلاً من index 🔥 */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => toast("الصفحة قيد التطوير 🚧", {
                            description: "جاري العمل على لوحة تحكم الكلية التفصيلية، ستكون متاحة قريباً.",
                            duration: 4000, // تختفي تلقائياً بعد 4 ثواني
                            action: {
                              label: "حسناً",
                              onClick: () => console.log("Dismissed"),
                            },
                          })}
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* التنبيهات والمخاطر */}
        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-orange-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              تنبيهات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* التعامل مع حالة عدم وجود تنبيهات */}
            {data.alerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <p>لا توجد تنبيهات نشطة حالياً ✅</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.alerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-white border rounded-lg shadow-sm text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-xs text-foreground">{alert.college}</span>
                      {/* يمكن جعل الوقت ديناميكياً لاحقاً */}
                      <span className="text-[10px] text-muted-foreground">الشهر الحالي</span>
                    </div>
                    <p className="text-muted-foreground leading-tight text-xs">{alert.msg}</p>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full text-xs mt-2" disabled>
                  عرض سجل التنبيهات (قريباً)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 5. مركز التقارير الموحد (Reports Hub) */}
      {/* <Card className="shadow-md border-t-4 border-t-secondary/70 bg-gradient-to-br from-white to-muted/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6 text-secondary" />
                مركز التقارير الموحد
              </CardTitle>
              <CardDescription>استخراج تقارير شاملة أو مخصصة لجميع الكليات بنقرة واحدة</CardDescription>
            </div>
            <Button variant="outline" size="sm">سجل عمليات التصدير</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-foreground">تقرير الأداء المؤسسي</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تحليل شامل لنسب الحضور، تنفيذ المحاضرات، والالتزام بالخطط الدراسية لجميع الكليات.
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs">تصدير PDF</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs px-2"><Download className="w-3 h-3" /></Button>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-foreground">الموقف المالي الموحد</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ملخص الاستحقاقات المالية، المصروفات الشهرية، والمديونيات القائمة لكل كلية.
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs">تصدير Excel</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs px-2"><Printer className="w-3 h-3" /></Button>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-foreground">سجل الكادر الأكاديمي</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                قائمة بأعضاء هيئة التدريس، أنصبتهم التدريسية، وحالات الغياب والانقطاع.
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs">تصدير PDF</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs px-2"><Download className="w-3 h-3" /></Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

// --- مكون البطاقة الإحصائية ---
function KpiCard({ title, value, icon, trend, highlight = false }: any) {
  return (
    <Card className={`border-none shadow-sm transition-all hover:shadow-md ${highlight ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{title}</p>
            <h3 className="text-3xl font-bold mt-2 tracking-tight">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${highlight ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
        </div>
        <div className={`mt-4 text-xs ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}