import { useState, useEffect, useMemo } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { 
  BookOpen, CheckCircle2, XCircle, AlertTriangle, 
  CalendarDays, Download, Filter, Target 
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

// --- أنواع البيانات التي تعكس قاعدة البيانات ---
interface TopicStatus {
  id: number;
  title: string;
  cloCode: string; // CLO1, CLO2 linked via topic_learning_outcomes
  status: 'covered' | 'pending' | 'delayed';
  week?: number; // من lecture_sessions
  studentPerformance?: number; // متوسط إجابات الطلاب (من student_lecture_answers)
}

interface CLOPerformance {
  code: string; // CLO1
  description: string;
  target: number; // مثلاً 75%
  actual: number; // المحقق فعلياً
}

interface DashboardData {
  courseName: string;
  courseCode: string;
  instructorName: string;
  totalTopics: number;
  coveredTopics: number;
  attendanceRate: number;
  topics: TopicStatus[];
  cloPerformance: CLOPerformance[];
}

// --- بيانات وهمية تحاكي استعلام SQL المعقد ---
const MOCK_DB_DATA: DashboardData = {
  courseName: "أساسيات نظم المعلومات",
  courseCode: "IS-201",
  instructorName: "د. أحمد علي",
  totalTopics: 20,
  coveredTopics: 12,
  attendanceRate: 88,
  topics: [
    { id: 1, title: "مقدمة في عصر المعلومات", cloCode: "CLO1", status: "covered", week: 1, studentPerformance: 92 },
    { id: 2, title: "البيانات والمعلومات والمعرفة", cloCode: "CLO1", status: "covered", week: 1, studentPerformance: 85 },
    { id: 3, title: "مكونات نظم المعلومات", cloCode: "CLO1", status: "covered", week: 2, studentPerformance: 78 },
    { id: 4, title: "أنواع نظم المعلومات", cloCode: "CLO2", status: "covered", week: 2, studentPerformance: 88 },
    { id: 5, title: "نظم معالجة المعاملات (TPS)", cloCode: "CLO2", status: "covered", week: 3, studentPerformance: 70 },
    { id: 6, title: "نظم المعلومات الإدارية (MIS)", cloCode: "CLO2", status: "covered", week: 3, studentPerformance: 65 },
    { id: 7, title: "نظم دعم القرار (DSS)", cloCode: "CLO2", status: "covered", week: 4, studentPerformance: 60 },
    { id: 8, title: "العتاد الصلب (Hardware)", cloCode: "CLO1", status: "covered", week: 5, studentPerformance: 95 },
    { id: 9, title: "البرمجيات (Software)", cloCode: "CLO1", status: "covered", week: 5, studentPerformance: 90 },
    { id: 10, title: "أساسيات قواعد البيانات", cloCode: "CLO2", status: "covered", week: 6, studentPerformance: 55 },
    { id: 11, title: "الاتصالات والشبكات", cloCode: "CLO2", status: "covered", week: 6, studentPerformance: 0 }, // تم الشرح ولم يختبروا بعد
    { id: 12, title: "التجارة الإلكترونية", cloCode: "CLO2", status: "covered", week: 7, studentPerformance: 0 },
    { id: 13, title: "نظم تخطيط موارد المؤسسة (ERP)", cloCode: "CLO2", status: "pending" },
    { id: 14, title: "إدارة علاقات العملاء (CRM)", cloCode: "CLO2", status: "pending" },
    { id: 15, title: "دورة حياة تطوير النظم (SDLC)", cloCode: "CLO1", status: "pending" },
  ],
  cloPerformance: [
    { code: "CLO1", description: "فهم المفاهيم الأساسية للبيانات", target: 75, actual: 88 },
    { code: "CLO2", description: "القدرة على تمييز أنواع النظم", target: 70, actual: 65 },
  ]
};

export default function QualityAssuranceModule({ collegeId }: { collegeId: number | string }) {
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("IS-201");
  const [data, setData] = useState<DashboardData>(MOCK_DB_DATA);

  // هنا يتم جلب البيانات لاحقاً من API
  useEffect(() => {
    // fetchData(selectedCourse)...
  }, [selectedCourse]);

  const coveragePercent = Math.round((data.coveredTopics / data.totalTopics) * 100);

  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-500" dir="rtl">
      
      {/* 1. Header & Filters (مبسط وواضح) */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            تقرير متابعة المقرر
          </h2>
          <p className="text-sm text-muted-foreground">عرض تفصيلي لسير العملية التعليمية ومخرجات التعلم.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IS-201">أساسيات نظم المعلومات (IS-201)</SelectItem>
              <SelectItem value="IS-301">قواعد البيانات (IS-301)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Overview Stats (أرقام مباشرة) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">نسبة إنجاز الخطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold">{coveragePercent}%</span>
              <span className="text-sm text-muted-foreground">{data.coveredTopics} من {data.totalTopics} موضوع</span>
            </div>
            <Progress value={coveragePercent} className="h-2" indicatorClassName={coveragePercent < 50 ? 'bg-red-500' : 'bg-green-500'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">متوسط أداء الطلاب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-blue-600">76%</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">بناءً على 1200 إجابة</span>
            </div>
            <p className="text-xs text-muted-foreground">متوسط الدرجات في الأسئلة التفاعلية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">حالة مخرجات التعلم</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex gap-4 items-center">
                 {data.cloPerformance.map(clo => (
                     <div key={clo.code} className="text-center">
                         <div className={`text-xl font-bold ${clo.actual >= clo.target ? 'text-green-600' : 'text-red-500'}`}>
                             {clo.actual}%
                         </div>
                         <div className="text-xs font-bold text-muted-foreground">{clo.code}</div>
                     </div>
                 ))}
             </div>
             <p className="text-xs text-muted-foreground mt-2">مقارنة المستهدف بالمحقق</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. The Main Table (انعكاس مباشر لجداول course_topics + session_topics_covered) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الجدول التفصيلي (ياخذ المساحة الأكبر) */}
        <Card className="lg:col-span-2 shadow-sm border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>سجل متابعة المواضيع (Syllabus Tracking)</span>
                <Badge variant="outline">{data.courseCode}</Badge>
            </CardTitle>
            <CardDescription>
                يوضح هذا الجدول المواضيع التي تم شرحها فعلياً، الأسبوع، والأداء المرتبط بها.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  <TableHead className="text-right">الموضوع</TableHead>
                  <TableHead className="text-center w-[80px]">CLO</TableHead>
                  <TableHead className="text-center w-[100px]">الحالة</TableHead>
                  <TableHead className="text-center w-[80px]">الأسبوع</TableHead>
                  <TableHead className="text-left w-[140px]">أداء الطلاب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topics.map((topic, index) => (
                  <TableRow key={topic.id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{topic.title}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className="text-xs">{topic.cloCode}</Badge></TableCell>
                    <TableCell className="text-center">
                        {topic.status === 'covered' ? (
                            <div className="flex justify-center"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
                        ) : (
                            <div className="flex justify-center"><XCircle className="w-5 h-5 text-muted-foreground/30" /></div>
                        )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                        {topic.week ? `أسبوع ${topic.week}` : '-'}
                    </TableCell>
                    <TableCell>
                        {topic.studentPerformance && topic.studentPerformance > 0 ? (
                           <div className="flex items-center gap-2">
                               <Progress value={topic.studentPerformance} className="h-1.5 w-16" 
                                   indicatorClassName={topic.studentPerformance < 60 ? 'bg-red-500' : 'bg-green-500'} 
                               />
                               <span className="text-xs font-bold">{topic.studentPerformance}%</span>
                           </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CLO Analysis Chart (بسيط وواضح) */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">تحليل المخرجات (Target vs Actual)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full text-xs" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.cloPerformance} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="code" type="category" width={40} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Legend />
                                <Bar dataKey="target" name="المستهدف" fill="#e2e8f0" barSize={20} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="actual" name="المحقق" fill="#10b981" barSize={20} radius={[0, 4, 4, 0]}>
                                    {data.cloPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.actual < entry.target ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {data.cloPerformance.map(clo => (
                            <div key={clo.code} className="text-xs border-r-2 border-primary pr-2">
                                <span className="font-bold block">{clo.code}</span>
                                <span className="text-muted-foreground">{clo.description}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-800 dark:text-amber-500 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        تنبيهات الجودة
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-amber-700 dark:text-amber-400 space-y-2">
                    <p>• <strong>CLO2</strong>: نسبة التحقق (65%) أقل من المستهدف (70%). يرجى مراجعة مواضيع "قواعد البيانات".</p>
                    <p>• هناك تأخر في شرح مواضيع الأسبوع السابع.</p>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}