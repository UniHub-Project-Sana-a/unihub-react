import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LecturerDetailsDialog } from "./LecturerDetailsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  BookOpen,
  Calendar,
  MapPin,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// تعريف واجهة البيانات القادمة من الباك إند
interface ReportsData {
  financial: {
    approved: number;
    executed: number;
    compensation: number;
    missed: number;
  };
  instructors: {
    id: number;
    name: string;
    department: string;
    approved: number;
    delivered: number;
    absences: number;
    makeups: number;
    rooms: string;
  }[];
  courses: {
    course: string;
    total: number;
    attendance: number;
    students: number;
  }[];
}

interface ReportsModuleProps {
  collegeId: string | number;
}

export default function ReportsModule({ collegeId }: ReportsModuleProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);

  // 2. أضف state للتحكم بالمودال
  const [selectedLecturerId, setSelectedLecturerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // حالات الفلاتر
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [isExporting, setIsExporting] = useState(false);

  // جلب البيانات من الـ API
  useEffect(() => {
    const fetchData = async () => {
      if (!collegeId) return;
      
      setLoading(true);
      try {
        const res = await api.get(`/v1/colleges/${collegeId}/reports`, {
          params: { year: selectedYear, semester: selectedSemester }
        });
        setData(res.data.data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({
          title: "خطأ",
          description: "فشل تحميل بيانات التقارير",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collegeId, selectedYear, selectedSemester, toast]);

  // دالة لتنزيل التقارير التفصيلية (تفعيل الأزرار)
    const handleDownloadReport = async (type: string) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/v1/colleges/${collegeId}/reports/detailed`, {
        params: { 
          type: type, 
          export: 'true',
          year: selectedYear 
        },
        responseType: 'blob', // ⚠️ تأكد 100% أن هذا السطر موجود
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      link.target = "_blank"; // ⚠️ هام للعمل محلياً
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "تم التصدير", description: `تم تحميل تقرير ${type} بنجاح.` });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "خطأ", description: "فشل التصدير.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري تجميع التقارير المالية والأكاديمية...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>لا توجد بيانات متاحة لهذه الكلية.</p>
      </div>
    );
  }

  // تحويل البيانات الحقيقية لتناسب واجهة العرض (Mapping)
  
  // 1. البيانات المالية (KPIs)
  const financialKPIs = [
    { 
      label: "المحاضرات المعتمدة", 
      value: data.financial.approved.toString(), 
      icon: BookOpen, 
      change: "مجدولة", // يمكن حساب النسبة لاحقاً
      trend: "neutral" 
    },
    { 
      label: "المحاضرات المنفذة", 
      value: data.financial.executed.toString(), 
      icon: Calendar, 
      change: `${Math.round((data.financial.executed / (data.financial.approved || 1)) * 100)}%`, 
      trend: "up" 
    },
    { 
      label: "التعويض المقدر", 
      value: Number(data.financial.compensation).toLocaleString(), 
      icon: DollarSign, 
      change: "ريال يمني", 
      trend: "up" 
    },
    { 
      label: "الغياب/التأخير", 
      value: data.financial.missed.toString(), 
      icon: TrendingDown, 
      change: "جلسة فائتة", 
      trend: "down" 
    },
  ];

  // 2. بيانات المحاضرين
  const instructorAttendance = data.instructors;

  // 3. بيانات المقررات
  const courseAttendance = data.courses;
    return (
    <div className="space-y-6" dir="rtl">
      {/* Global Controls */}
      <Card className="backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>السنة الدراسية</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025/2026</SelectItem>
                  <SelectItem value="2024">2024/2025</SelectItem>
                  <SelectItem value="2023">2023/2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الفصل الدراسي</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">الفصل الأول</SelectItem>
                  <SelectItem value="2">الفصل الثاني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>القسم</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="cs">علوم الحاسوب</SelectItem>
                  <SelectItem value="is">نظم المعلومات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>البرنامج</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="bachelor">بكالوريوس</SelectItem>
                  <SelectItem value="master">ماجستير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="financial" className="data-[state=active]:bg-primary/10">التقارير المالية</TabsTrigger>
          <TabsTrigger value="instructor" className="data-[state=active]:bg-primary/10">حضور المحاضرين</TabsTrigger>
          <TabsTrigger value="student" className="data-[state=active]:bg-primary/10">حضور الطلاب</TabsTrigger>
          <TabsTrigger value="builder" className="data-[state=active]:bg-primary/10">منشئ التقارير</TabsTrigger>
        </TabsList>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialKPIs.map((kpi, idx) => (
              <Card key={idx} className="backdrop-blur-sm border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <kpi.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant={kpi.trend === "up" ? "default" : (kpi.trend === "down" ? "destructive" : "secondary")} className="gap-1">
                      {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : (kpi.trend === "down" ? <TrendingDown className="w-3 h-3" /> : null)}
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                  <div className="text-sm text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trend Chart Mock (Static for now as per request) */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الاتجاه مقارنة بالفصل السابق</CardTitle>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">رسم بياني للاتجاهات (تجريبي)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>الوصول السريع للتقارير التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "تقرير الأداء الشهري", type: "monthly" },
                  { label: "تقرير التعويضات", type: "compensation" },
                  { label: "تقرير الغياب", type: "absences" },
                  { label: "تقرير المحاضرات التعويضية", type: "makeups" }
                ].map((report, idx) => (
                  <Button 
                    key={idx} 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => handleDownloadReport(report.type)}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                    <span className="text-sm">{report.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructor Attendance Tab */}
        <TabsContent value="instructor" className="space-y-6">
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>حضور أعضاء هيئة التدريس</CardTitle>
                
                {/* أدوات التحكم: بحث + تصدير */}
                <div className="flex gap-2 items-center">
                  {/* حقل البحث يظهر دائماً أو يمكن إخفاؤه */}
                  <div className="relative">
                    <Input 
                      placeholder="بحث باسم المحاضر..." 
                      className="w-64 h-9" 
                      value={searchQuery} // يجب تعريف هذا الـ state فوق
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadReport('instructors_summary')} // ✅ ربط التصدير
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Download className="w-4 h-4 ml-2" />}
                    تصدير القائمة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead className="text-center">المعتمدة</TableHead>
                    <TableHead className="text-center">المنفذة</TableHead>
                    <TableHead className="text-center">الغياب</TableHead>
                    <TableHead className="text-center text-green-600 font-bold">تعويضي</TableHead>
                    <TableHead>القاعات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ✅ الفلترة الحقيقية هنا */}
                  {instructorAttendance
                    .filter(i => i.name.includes(searchQuery) || i.department.includes(searchQuery))
                    .map(instructor => (
                    <TableRow key={instructor.id} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{instructor.name}</TableCell>
                      <TableCell>{instructor.department}</TableCell>
                      
                      {/* المعتمدة: إجمالي الجلسات */}
                      <TableCell className="text-center">
                        <Badge variant="outline">{instructor.approved}</Badge>
                      </TableCell>
                      
                      {/* المنفذة */}
                      <TableCell className="text-center">
                        <Badge variant={instructor.delivered >= instructor.approved * 0.8 ? "default" : "secondary"}>
                          {instructor.delivered}
                        </Badge>
                      </TableCell>
                      
                      {/* الغياب */}
                      <TableCell className="text-center">
                        <Badge variant={instructor.absences === 0 ? "outline" : "destructive"}>
                          {instructor.absences}
                        </Badge>
                      </TableCell>
                      
                      {/* التعويضي */}
                      <TableCell className="text-center">
                        {instructor.makeups > 0 ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                {instructor.makeups}
                            </Badge>
                        ) : "-"}
                      </TableCell>
                      
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]" title={instructor.rooms}>
                        {instructor.rooms}
                      </TableCell>
                      
                      <TableCell>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:text-primary hover:bg-primary/10"
                            onClick={() => setSelectedLecturerId(instructor.id)}
                        >
                            عرض التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* رسالة في حال عدم وجود نتائج */}
                  {instructorAttendance.filter(i => i.name.includes(searchQuery) || i.department.includes(searchQuery)).length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            لا توجد نتائج تطابق بحثك.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <LecturerDetailsDialog 
        isOpen={!!selectedLecturerId} 
        onClose={() => setSelectedLecturerId(null)} 
        lecturerId={selectedLecturerId}
        collegeId={collegeId}
      />

        {/* Student Attendance */}
        <TabsContent value="student" className="space-y-6">
          {/* Drill-in Path */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">علوم الحاسوب</Badge>
                <span className="text-muted-foreground">/</span>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">بكالوريوس</Badge>
                <span className="text-muted-foreground">/</span>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">المستوى الأول</Badge>
                <span className="text-muted-foreground">/</span>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">الترم الأول</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Course List */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>المقررات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courseAttendance.map(course => (
                  <Card key={course.course} className="border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-bold">{course.course}</div>
                        <Badge variant="outline">{course.students} طالب</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">المحاضرات المعتمدة</span>
                          <span className="font-medium">{course.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">نسبة الحضور</span>
                          <Badge variant={course.attendance >= 90 ? "default" : "secondary"}>
                            {course.attendance}%
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${course.attendance}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Report Builder */}
        <TabsContent value="builder" className="space-y-6">
          <Card className="backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle>منشئ التقارير المخصصة</CardTitle>
              <p className="text-sm text-muted-foreground">قم ببناء تقرير مخصص حسب احتياجاتك</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Data Source */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">1. اختر مصدر البيانات</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["الحضور", "الدرجات", "المحاضرات", "الطلاب"].map((source, idx) => (
                    <Button key={idx} variant="outline" className="h-20">
                      <BarChart3 className="w-6 h-6 mb-2" />
                      {source}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Fields */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">2. اختر الحقول</Label>
                <div className="flex flex-wrap gap-2">
                  {["الاسم", "القسم", "المقرر", "التاريخ", "الحالة", "الدرجة"].map((field, idx) => (
                    <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-primary/10 px-3 py-2">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Step 3: Filters */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">3. أضف المرشحات</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dept">القسم</SelectItem>
                        <SelectItem value="date">التاريخ</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="المعامل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">يساوي</SelectItem>
                        <SelectItem value="gt">أكبر من</SelectItem>
                        <SelectItem value="lt">أصغر من</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="القيمة" className="flex-1" />
                    <Button variant="outline">إضافة</Button>
                  </div>
                </div>
              </div>

              {/* Step 4: Output Type */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">4. نوع المخرج</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <Table className="w-8 h-8" />
                    <span>جدول</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <BarChart3 className="w-8 h-8" />
                    <span>رسم بياني</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <PieChart className="w-8 h-8" />
                    <span>بطاقات</span>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1">معاينة التقرير</Button>
                <Button variant="outline">حفظ كقالب</Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Templates */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>القوالب المحفوظة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["تقرير أداء القسم", "حضور الطلاب الشهري", "تقييم المحاضرين"].map((template, idx) => (
                  <Card key={idx} className="border-primary/20 cursor-pointer hover:shadow-lg transition-all duration-200">
                    <CardContent className="pt-6">
                      <FileText className="w-8 h-8 mb-3 text-primary" />
                      <div className="font-medium mb-2">{template}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">تحميل</Button>
                        <Button size="sm" variant="ghost">حذف</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}