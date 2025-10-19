import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  Users, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Download,
  UserPlus,
  BookOpen,
  Filter
} from "lucide-react";

// Mock data for failed students
const mockFailedStudents = [
  {
    id: "2023001",
    name: "Ahmed Al-Rashid",
    department: "علوم الحاسب",
    major: "هندسة البرمجيات",
    failedCourses: ["CS101", "CS102", "MATH201"],
    failedCoursesCount: 3,
    status: "مطلوب إعادة التسجيل"
  },
  {
    id: "2023002", 
    name: "Sarah Johnson",
    department: "الهندسة",
    major: "هندسة كهربائية", 
    failedCourses: ["EE201"],
    failedCoursesCount: 1,
    status: "مطلوب إعادة التسجيل"
  },
  {
    id: "2023003",
    name: "Mohamed Hassan",
    department: "الرياضيات",
    major: "رياضيات تطبيقية",
    failedCourses: ["MATH301", "MATH302"],
    failedCoursesCount: 2,
    status: "مطلوب إعادة التسجيل"
  }
];

// Mock course data
const mockCourses = [
  { code: "CS101", name: "أساسيات البرمجة", failedStudents: 8 },
  { code: "CS102", name: "هياكل البيانات", failedStudents: 5 },
  { code: "MATH201", name: "التفاضل والتكامل 2", failedStudents: 12 },
  { code: "EE201", name: "تحليل الدوائر", failedStudents: 3 },
  { code: "MATH301", name: "الجبر الخطي", failedStudents: 6 },
  { code: "MATH302", name: "المعادلات التفاضلية", failedStudents: 4 }
];

// Mock groups for assignment
const mockGroups = [
  { id: "G1", name: "المجموعة 1", capacity: 30, enrolled: 25 },
  { id: "G2", name: "المجموعة 2", capacity: 30, enrolled: 28 },
  { id: "G3", name: "المجموعة 3", capacity: 25, enrolled: 20 }
];

export function StudentImport() {
  const [importedData, setImportedData] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [selectedFailureCount, setSelectedFailureCount] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const handleImport = (type: string) => {
    setImportedData(mockFailedStudents);
    toast({
      title: "تم الاستيراد بنجاح",
      description: `تم استيراد ${mockFailedStudents.length} طالب من ${type}`,
      variant: "default"
    });
  };

  const filteredStudents = importedData.filter(student => {
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    const matchesMajor = selectedMajor === "all" || student.major === selectedMajor;
    const matchesFailureCount = selectedFailureCount === "all" || 
      (selectedFailureCount === "1" && student.failedCoursesCount === 1) ||
      (selectedFailureCount === "2-3" && student.failedCoursesCount >= 2 && student.failedCoursesCount <= 3) ||
      (selectedFailureCount === "3+" && student.failedCoursesCount > 3);
    const matchesCourse = !selectedCourse || student.failedCourses.includes(selectedCourse);
    const matchesSearch = searchTerm === "" || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesMajor && matchesFailureCount && matchesCourse && matchesSearch;
  });

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleBulkAssign = () => {
    if (selectedStudents.length === 0 || !selectedGroup) {
      toast({
        title: "خطأ في الإسناد",
        description: "يرجى اختيار طلاب ومجموعة",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "تم إسناد المجموعة بنجاح",
      description: `تم إسناد ${selectedStudents.length} طالب إلى ${selectedGroup}`,
      variant: "default"
    });
    setSelectedStudents([]);
    setSelectedGroup("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">استيراد تسجيلات الطلاب</h1>
          <p className="text-muted-foreground">استيراد وإدارة إعادة تسجيل الطلاب الراسبين</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="shadow-md">
            <Download className="w-4 h-4 mr-2" />
            تصدير القائمة
          </Button>
          <Button variant="outline" className="shadow-md">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            إنشاء تقرير
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">الإجمالي المعلّق</p>
                <p className="text-2xl font-bold text-foreground">{importedData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500 rounded-lg shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">المعتمد هذا الشهر</p>
                <p className="text-2xl font-bold text-foreground">47</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-500 rounded-lg shadow-md">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">المرفوض هذا الشهر</p>
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500 rounded-lg shadow-md">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">حالات مصعدة</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Interface */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>استيراد بيانات الطلاب</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-blue-400 transition-all duration-200 cursor-pointer hover:shadow-md"
              onClick={() => handleImport("واجهة برمجة تطبيقات نظام SAR")}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">واجهة برمجة تطبيقات نظام SAR</h3>
              <p className="text-sm text-muted-foreground mb-3">استيراد مباشرة من نظام SAR</p>
              <Button variant="outline" size="sm">الاتصال بالواجهة</Button>
            </div>
            
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-green-400 transition-all duration-200 cursor-pointer hover:shadow-md"
              onClick={() => handleImport("ملف CSV")}
            >
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">رفع ملف CSV</h3>
              <p className="text-sm text-muted-foreground mb-3">رفع ملف CSV يحتوي على بيانات الطلاب</p>
              <Button variant="outline" size="sm">اختر ملفًا</Button>
            </div>
            
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-purple-400 transition-all duration-200 cursor-pointer hover:shadow-md"
              onClick={() => handleImport("ملف Excel")}
            >
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-2">رفع ملف Excel</h3>
              <p className="text-sm text-muted-foreground mb-3">استيراد من ملف Excel</p>
              <Button variant="outline" size="sm">اختر ملفًا</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {importedData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course List Sidebar */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>المقررات الراسبة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedCourse === null ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCourse(null)}
              >
                كل المقررات
              </Button>
              {mockCourses.map((course) => (
                <Button
                  key={course.code}
                  variant={selectedCourse === course.code ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCourse(course.code)}
                >
                  <span className="text-sm">{course.code}</span>
                  <Badge variant="secondary">{course.failedStudents}</Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters and Search */}
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن الطلاب..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأقسام</SelectItem>
                      <SelectItem value="علوم الحاسب">علوم الحاسب</SelectItem>
                      <SelectItem value="الهندسة">الهندسة</SelectItem>
                      <SelectItem value="الرياضيات">الرياضيات</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                    <SelectTrigger>
                      <SelectValue placeholder="التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل التخصصات</SelectItem>
                      <SelectItem value="هندسة البرمجيات">هندسة البرمجيات</SelectItem>
                      <SelectItem value="هندسة كهربائية">هندسة كهربائية</SelectItem>
                      <SelectItem value="رياضيات تطبيقية">رياضيات تطبيقية</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedFailureCount} onValueChange={setSelectedFailureCount}>
                    <SelectTrigger>
                      <SelectValue placeholder="عدد الرسوبات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأعداد</SelectItem>
                      <SelectItem value="1">مقرر واحد</SelectItem>
                      <SelectItem value="2-3">2-3 مقررات</SelectItem>
                      <SelectItem value="3+">3+ مقررات</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    مسح عوامل التصفية
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                        />
                        <div>
                          <h3 className="font-semibold text-foreground">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.id}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={student.failedCoursesCount >= 3 ? "destructive" : "secondary"}
                        className="shadow-sm"
                      >
                        {student.failedCoursesCount} مواد راسبة
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">القسم:</span>
                        <span className="font-medium text-foreground">{student.department}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">التخصص:</span>
                        <span className="font-medium text-foreground">{student.major}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المقررات الراسبة:</span>
                        <span className="font-medium text-foreground">{student.failedCourses.join(", ")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Group Assignment */}
            {selectedStudents.length > 0 && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      <span>إسناد إلى مجموعة</span>
                    </div>
                    <Badge variant="secondary" className="shadow-sm">
                      تم اختيار {selectedStudents.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">الطلاب المحددون</h4>
                      <div className="bg-background rounded-lg p-3 max-h-32 overflow-y-auto">
                        {selectedStudents.map(studentId => {
                          const student = filteredStudents.find(s => s.id === studentId);
                          return (
                            <div key={studentId} className="text-sm text-foreground">
                              {student?.name} ({student?.id})
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">إسناد إلى مجموعة</h4>
                      <div className="space-y-2">
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مجموعة..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mockGroups.map((group) => (
                              <SelectItem key={group.id} value={group.name}>
                                {group.name} ({group.enrolled}/{group.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full" 
                              disabled={!selectedGroup}
                            >
                              إسناد الطلاب المحددين
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تأكيد إسناد المجموعة</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                أنت على وشك إسناد {selectedStudents.length} طالب إلى {selectedGroup}.
                                لا يمكن التراجع عن هذا الإجراء.
                              </p>
                              <div className="flex space-x-2">
                                <Button variant="outline" className="flex-1">إلغاء</Button>
                                <Button onClick={handleBulkAssign} className="flex-1">
                                  تأكيد الإسناد
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}