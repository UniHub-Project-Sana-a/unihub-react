import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Award, 
  AlertCircle,
  Download,
  Upload,
  Search,
  Eye,
  BarChart2,
  TrendingUp
} from "lucide-react";

export const ClassworkGradesModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [densityMode, setDensityMode] = useState<"comfortable" | "compact">("comfortable");

  const mockStudents = [
    { 
      id: "STD-3001", 
      name: "سارة أحمد محمد", 
      assignments: { hw1: 8, hw2: 9, quiz1: 9, quiz2: 10, midterm: 28 }, 
      total: 60,
      notes: "أداء ممتاز"
    },
    { 
      id: "STD-3002", 
      name: "محمد خالد عبدالله", 
      assignments: { hw1: 7, hw2: 8, quiz1: 8, quiz2: 9, midterm: 25 }, 
      total: 57,
      notes: ""
    },
    { 
      id: "STD-3003", 
      name: "ليلى عمر حسن", 
      assignments: { hw1: 9, hw2: 10, quiz1: 10, quiz2: 10, midterm: 29 }, 
      total: 60,
      notes: "متميزة"
    },
    { 
      id: "STD-3004", 
      name: "عبدالرحمن سعيد", 
      assignments: { hw1: 6, hw2: 7, quiz1: 7, quiz2: 8, midterm: 22 }, 
      total: 50,
      notes: ""
    },
    { 
      id: "STD-3005", 
      name: "مريم حسين علي", 
      assignments: { hw1: 8, hw2: 9, quiz1: 9, quiz2: 9, midterm: 26 }, 
      total: 58,
      notes: ""
    },
    { 
      id: "STD-3006", 
      name: "يوسف علي محمود", 
      assignments: { hw1: 5, hw2: null, quiz1: 6, quiz2: 7, midterm: 20 }, 
      total: 38,
      notes: "ناقص واجب"
    },
  ];

  const assessmentColumns = [
    { key: "hw1", label: "واجب 1", max: 10 },
    { key: "hw2", label: "واجب 2", max: 10 },
    { key: "quiz1", label: "اختبار 1", max: 10 },
    { key: "quiz2", label: "اختبار 2", max: 10 },
    { key: "midterm", label: "منتصف الفصل", max: 30 },
  ];

  const filteredStudents = mockStudents.filter(s => 
    s.name.includes(searchTerm) || s.id.includes(searchTerm)
  );

  // Stats
  const avgTotal = mockStudents.reduce((sum, s) => sum + s.total, 0) / mockStudents.length;
  const fullScoreCount = mockStudents.filter(s => s.total === 60).length;
  const distribution = {
    "54-60": mockStudents.filter(s => s.total >= 54).length,
    "48-53": mockStudents.filter(s => s.total >= 48 && s.total < 54).length,
    "42-47": mockStudents.filter(s => s.total >= 42 && s.total < 48).length,
    "0-41": mockStudents.filter(s => s.total < 42).length,
  };

  return (
    <div className="space-y-6">
      {/* Navigation Path */}
      <Card className="backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">علوم الحاسوب</Badge>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">المستوى الأول</Badge>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">الترم الأول</Badge>
            <span className="text-muted-foreground">/</span>
            <Badge variant="default">CS101 - مدخل إلى الحاسوب</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">درجات أعمال الفصل</h2>
              <p className="text-sm text-muted-foreground">الإجمالي من 60 درجة</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 ml-2" />
                استيراد
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                طباعة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Grades Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>بحث</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="ابحث بالاسم أو الرقم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>الكثافة</Label>
                  <Select value={densityMode} onValueChange={(v: any) => setDensityMode(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">مريح</SelectItem>
                      <SelectItem value="compact">مضغوط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>النطاق</Label>
                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="high">54-60</SelectItem>
                      <SelectItem value="mid">48-53</SelectItem>
                      <SelectItem value="low">أقل من 48</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grades Table */}
          <Card className="backdrop-blur-sm overflow-x-auto">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky right-0 bg-background z-10">رقم الطالب</TableHead>
                    <TableHead className="sticky right-0 bg-background z-10">الاسم</TableHead>
                    {assessmentColumns.map(col => (
                      <TableHead key={col.key} className="text-center">
                        {col.label}
                        <div className="text-xs text-muted-foreground">({col.max})</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">الإجمالي (60)</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => {
                    const hasFullScore = student.total === 60;
                    const hasMissing = Object.values(student.assignments).some(v => v === null);
                    
                    return (
                      <TableRow 
                        key={student.id} 
                        className={`hover:bg-primary/5 ${densityMode === "compact" ? "h-12" : "h-16"}`}
                      >
                        <TableCell className="font-medium sticky right-0 bg-background">{student.id}</TableCell>
                        <TableCell className="sticky right-0 bg-background">{student.name}</TableCell>
                        {assessmentColumns.map(col => {
                          const value = student.assignments[col.key as keyof typeof student.assignments];
                          return (
                            <TableCell key={col.key} className="text-center">
                              {value !== null ? (
                                <Badge variant={value === col.max ? "default" : "outline"}>
                                  {value}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  ناقص
                                </Badge>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge 
                            variant={hasFullScore ? "default" : student.total >= 48 ? "secondary" : "outline"}
                            className="text-base font-bold"
                          >
                            {hasFullScore && <Award className="w-4 h-4 ml-1" />}
                            {student.total}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="backdrop-blur-sm max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>تفاصيل الطالب - {student.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>رقم الطالب</Label>
                                    <p className="text-sm font-medium mt-1">{student.id}</p>
                                  </div>
                                  <div>
                                    <Label>الاسم الكامل</Label>
                                    <p className="text-sm font-medium mt-1">{student.name}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="mb-3 block">تفصيل الدرجات</Label>
                                  <div className="space-y-3">
                                    {assessmentColumns.map(col => {
                                      const value = student.assignments[col.key as keyof typeof student.assignments];
                                      return (
                                        <div key={col.key} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                          <span className="font-medium">{col.label}</span>
                                          <div className="flex items-center gap-3">
                                            <div className="text-sm text-muted-foreground">من {col.max}</div>
                                            <Badge variant={value === col.max ? "default" : value === null ? "destructive" : "outline"}>
                                              {value !== null ? value : "ناقص"}
                                            </Badge>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="pt-4 border-t">
                                  <div className="flex items-center justify-between text-lg">
                                    <span className="font-bold">الإجمالي:</span>
                                    <Badge variant="default" className="text-lg px-4 py-2">
                                      {student.total} / 60
                                    </Badge>
                                  </div>
                                </div>

                                {student.notes && (
                                  <div>
                                    <Label>ملاحظات المحاضر</Label>
                                    <p className="text-sm p-3 bg-secondary/50 rounded-lg mt-2">
                                      {student.notes}
                                    </p>
                                  </div>
                                )}

                                <Button variant="outline" className="w-full">
                                  عرض سجل الحضور
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="space-y-4">
          <Card className="backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">المتوسط</span>
                  <Badge variant="default">{avgTotal.toFixed(1)}</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${(avgTotal / 60) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">الدرجة الكاملة</span>
                  <Badge variant="default" className="gap-1">
                    <Award className="w-3 h-3" />
                    {fullScoreCount}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="mb-3 block">توزيع الدرجات</Label>
                <div className="space-y-2">
                  {Object.entries(distribution).map(([range, count]) => (
                    <div key={range} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{range}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart Mock */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">رسم بياني</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-border">
                <div className="text-center">
                  <BarChart2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">توزيع الدرجات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="backdrop-blur-sm border-primary/20">
            <CardContent className="pt-6 space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 ml-2" />
                إظهار/إخفاء أعمدة
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 ml-2" />
                تثبيت الأعمدة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default ClassworkGradesModule;