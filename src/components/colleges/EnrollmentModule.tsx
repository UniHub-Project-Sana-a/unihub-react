import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2,
  Search,
  Download,
  Upload,
  Grid3x3,
  Shuffle
} from "lucide-react";

export const EnrollmentModule = () => {
  const [importStep, setImportStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(false);

  const mockFailingStudents = [
    { id: "STD-2101", name: "أحمد محمد علي", year: 2023, gpa: 2.3, gender: "ذكر", notes: "راسب في CS101" },
    { id: "STD-2102", name: "فاطمة حسن", year: 2023, gpa: 2.1, gender: "أنثى", notes: "راسب في CS102" },
    { id: "STD-2103", name: "خالد عبدالله", year: 2022, gpa: 1.9, gender: "ذكر", notes: "راسب في CS101, CS202" },
    { id: "STD-2104", name: "نورة سالم", year: 2023, gpa: 2.4, gender: "أنثى", notes: "راسب في CS101" },
  ];

  const mockCurrentStudents = [
    { id: "STD-3001", name: "سارة أحمد", gender: "أنثى", gpa: 3.5, group: null },
    { id: "STD-3002", name: "محمد خالد", gender: "ذكر", gpa: 3.2, group: null },
    { id: "STD-3003", name: "ليلى عمر", gender: "أنثى", gpa: 3.8, group: null },
    { id: "STD-3004", name: "عبدالرحمن سعيد", gender: "ذكر", gpa: 3.1, group: null },
    { id: "STD-3005", name: "مريم حسين", gender: "أنثى", gpa: 3.6, group: null },
    { id: "STD-3006", name: "يوسف علي", gender: "ذكر", gpa: 2.9, group: null },
  ];

  const [groups, setGroups] = useState([
    { id: 1, name: "المجموعة أ", students: [] as typeof mockCurrentStudents, maxSize: 30 },
    { id: 2, name: "المجموعة ب", students: [] as typeof mockCurrentStudents, maxSize: 30 },
    { id: 3, name: "المجموعة ج", students: [] as typeof mockCurrentStudents, maxSize: 30 },
  ]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const steps = [
    { num: 1, label: "اختر القسم" },
    { num: 2, label: "البرنامج" },
    { num: 3, label: "المستوى" },
    { num: 4, label: "الترم" },
    { num: 5, label: "المقرر" },
    { num: 6, label: "المعاينة" },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">استيراد الطلاب</TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-primary/10">إدارة المجموعات</TabsTrigger>
        </TabsList>

        {/* Import Students */}
        <TabsContent value="import" className="space-y-6">
          {/* Stepper */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={step.num} className="flex items-center">
                    <div className={`flex items-center gap-2 ${importStep >= step.num ? 'text-primary' : 'text-muted-foreground'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        importStep >= step.num 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                          : 'bg-card border-2'
                      }`}>
                        {importStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                      </div>
                      <span className="text-sm font-medium hidden md:block">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 w-12 mx-2 ${importStep > step.num ? 'bg-primary' : 'bg-border'}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          {importStep < 6 && (
            <Card className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{steps[importStep - 1].label}</CardTitle>
                <p className="text-sm text-muted-foreground">البيانات من نظام SAR (تجريبي)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">علوم الحاسوب</SelectItem>
                    <SelectItem value="2">نظم المعلومات</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportStep(Math.max(1, importStep - 1))}>السابق</Button>
                  <Button onClick={() => setImportStep(Math.min(6, importStep + 1))}>التالي</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Failing Students */}
          {importStep === 6 && (
            <Card className="backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>الطلاب الراسبون (السنوات السابقة)</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Search className="w-4 h-4 ml-2" />
                      بحث
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 ml-2" />
                      تصدير
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox />
                      </TableHead>
                      <TableHead>رقم الطالب</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>سنة الرسوب</TableHead>
                      <TableHead>المعدل</TableHead>
                      <TableHead>الجنس</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockFailingStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>
                          <Badge variant={student.gpa < 2.0 ? "destructive" : "default"}>
                            {student.gpa}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Assignment Panel */}
                <Card className="mt-6 border-primary/30">
                  <CardHeader>
                    <CardTitle>تعيين إلى دفعة/مجموعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>الدفعة الحالية</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدفعة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025/2026</SelectItem>
                          <SelectItem value="2024">2024/2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="add-all" />
                      <Label htmlFor="add-all">إضافة الكل</Label>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ملخص الاختيار</span>
                        <Badge>{selectedStudents.length} طالب مختار</Badge>
                      </div>
                      {selectedStudents.length > 0 && (
                        <Badge variant="outline" className="mr-2">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          0 تعارضات
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full" disabled={selectedStudents.length === 0}>
                      تأكيد التعيين
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Groups */}
        <TabsContent value="groups" className="space-y-6">
          {/* Selection Path */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["القسم", "البرنامج", "المستوى", "الترم", "الدفعة"].map((label, idx) => (
                  <div key={idx}>
                    <Label>{label}</Label>
                    <Select defaultValue={idx === 4 ? "2025" : "1"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {idx === 4 ? "2025/2026" : label === "القسم" ? "علوم الحاسوب" : "الخيار 1"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grouping Tools */}
          <Card className="backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle>أدوات التجميع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline">
                  <Grid3x3 className="w-4 h-4 ml-2" />
                  يدوي
                </Button>
                <Button 
                  variant={autoBalanceEnabled ? "default" : "outline"}
                  onClick={() => setAutoBalanceEnabled(!autoBalanceEnabled)}
                >
                  <Shuffle className="w-4 h-4 ml-2" />
                  توازن تلقائي
                </Button>
              </div>

              {/* Constraints */}
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium">القيود</h4>
                <div className="flex items-center gap-2">
                  <Checkbox id="lab-size" defaultChecked />
                  <Label htmlFor="lab-size">حجم مجموعة المعمل ≤ 30</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="gender-sep" defaultChecked />
                  <Label htmlFor="gender-sep">فصل حسب الجنس</Label>
                </div>
                <Button size="sm" variant="outline">إضافة قاعدة مخصصة</Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">فحص القيود</Button>
                <Button>حفظ مسودة</Button>
                <Button variant="default">نشر</Button>
              </div>
            </CardContent>
          </Card>

          {/* Groups Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map(group => (
              <Card key={group.id} className="backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="outline">{group.students.length}/{group.maxSize}</Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${(group.students.length / group.maxSize) * 100}%` }}
                    ></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 min-h-[200px] border-2 border-dashed border-border/30 rounded-lg p-3">
                    {group.students.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <UserPlus className="w-8 h-8" />
                      </div>
                    ) : (
                      group.students.map(student => (
                        <div key={student.id} className="p-2 bg-card rounded border text-sm">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الذكور:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الإناث:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>التعارضات:</span>
                      <Badge variant="outline" className="text-xs">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Available Students */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>الطلاب المتاحون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {mockCurrentStudents.map(student => (
                  <Card key={student.id} className="cursor-move hover:shadow-lg transition-all duration-200 border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="font-medium text-sm">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.id}</div>
                      <Badge variant="outline" className="mt-2 text-xs">{student.gender}</Badge>
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
export default EnrollmentModule;