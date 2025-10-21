import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  FileText
} from "lucide-react";

export const ReportsModule = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedSemester, setSelectedSemester] = useState("1");

  const financialKPIs = [
    { label: "المحاضرات المعتمدة", value: "320", icon: BookOpen, change: "+12%", trend: "up" },
    { label: "المحاضرات المنفذة", value: "298", icon: Calendar, change: "-7%", trend: "down" },
    { label: "التعويض المقدر", value: "450,000", icon: DollarSign, change: "+8%", trend: "up" },
    { label: "الغياب/التأخير", value: "22", icon: TrendingDown, change: "-3%", trend: "up" },
  ];

  const instructorAttendance = [
    { id: 1, name: "د. أحمد الحربي", department: "نظم المعلومات", approved: 36, delivered: 36, absences: 0, makeups: 0, rooms: "C-101, C-102" },
    { id: 2, name: "د. سارة القحطاني", department: "علوم الحاسوب", approved: 32, delivered: 30, absences: 2, makeups: 1, rooms: "C-102, Lab-1" },
    { id: 3, name: "د. مريم باوزير", department: "الذكاء الاصطناعي", approved: 28, delivered: 28, absences: 0, makeups: 0, rooms: "C-201" },
    { id: 4, name: "أ. فهد المطيري", department: "هندسة البرمجيات", approved: 24, delivered: 22, absences: 2, makeups: 0, rooms: "Lab-2" },
  ];

  const courseAttendance = [
    { course: "CS101", total: 30, attendance: 92, students: 60 },
    { course: "CS202", total: 28, attendance: 88, students: 45 },
    { course: "CS301", total: 32, attendance: 95, students: 30 },
  ];

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="financial" className="w-full">
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
                    <Badge variant={kpi.trend === "up" ? "default" : "destructive"} className="gap-1">
                      {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                  <div className="text-sm text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trend Chart Mock */}
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
                {["تقرير الأداء الشهري", "تقرير التعويضات", "تقرير الغياب", "تقرير المحاضرات التعويضية"].map((report, idx) => (
                  <Button key={idx} variant="outline" className="h-auto py-4 flex-col gap-2">
                    <FileText className="w-6 h-6" />
                    <span className="text-sm">{report}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructor Attendance */}
        <TabsContent value="instructor" className="space-y-6">
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>حضور أعضاء هيئة التدريس</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Filter className="w-4 h-4 ml-2" />
                    تصفية
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
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
                    <TableHead>المعتمدة</TableHead>
                    <TableHead>المنفذة</TableHead>
                    <TableHead>الغياب</TableHead>
                    <TableHead>التعويضية</TableHead>
                    <TableHead>القاعات/المعامل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorAttendance.map(instructor => (
                    <TableRow key={instructor.id} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{instructor.name}</TableCell>
                      <TableCell>{instructor.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{instructor.approved}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={instructor.delivered === instructor.approved ? "default" : "secondary"}>
                          {instructor.delivered}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={instructor.absences === 0 ? "outline" : "destructive"}>
                          {instructor.absences}
                        </Badge>
                      </TableCell>
                      <TableCell>{instructor.makeups}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{instructor.rooms}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">عرض التفاصيل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
};
export default ReportsModule;