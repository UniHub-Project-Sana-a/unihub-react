import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  ChevronDown,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  Building,
  GraduationCap,
  Calendar,
  UserCheck,
  UserX
} from "lucide-react";

// Mock data structure
const departments = [
  {
    id: "CS",
    name: "علوم الحاسب",
    totalStudents: 450,
    passRate: 85,
    specializations: [
      {
        id: "CS-AI",
        name: "الذكاء الاصطناعي",
        totalStudents: 120,
        passRate: 88,
        levels: {
          "1": {
            fall: [
              { code: "CS101", name: "أساسيات البرمجة", enrolled: 30, passRate: 90, failRate: 10 },
              { code: "CS102", name: "رياضيات لعلوم الحاسب", enrolled: 30, passRate: 85, failRate: 15 }
            ],
            spring: [
              { code: "CS103", name: "هياكل البيانات", enrolled: 28, passRate: 88, failRate: 12 },
              { code: "CS104", name: "بنية الحاسوب", enrolled: 28, passRate: 82, failRate: 18 }
            ]
          },
          "2": {
            fall: [
              { code: "CS201", name: "الخوارزميات", enrolled: 25, passRate: 85, failRate: 15 },
              { code: "CS202", name: "أنظمة قواعد البيانات", enrolled: 25, passRate: 88, failRate: 12 }
            ],
            spring: [
              { code: "CS203", name: "هندسة البرمجيات", enrolled: 23, passRate: 92, failRate: 8 },
              { code: "CS204", name: "أنظمة التشغيل", enrolled: 23, passRate: 78, failRate: 22 }
            ]
          }
        }
      },
      {
        id: "CS-SE",
        name: "هندسة البرمجيات",
        totalStudents: 180,
        passRate: 82,
        levels: {
          "1": {
            fall: [
              { code: "SE101", name: "مبادئ البرمجة", enrolled: 45, passRate: 88, failRate: 12 },
              { code: "SE102", name: "تحليل النظم", enrolled: 45, passRate: 80, failRate: 20 }
            ],
            spring: [
              { code: "SE103", name: "تطوير الويب", enrolled: 42, passRate: 90, failRate: 10 },
              { code: "SE104", name: "تطوير تطبيقات الجوال", enrolled: 42, passRate: 85, failRate: 15 }
            ]
          }
        }
      }
    ]
  },
  {
    id: "MATH",
    name: "الرياضيات",
    totalStudents: 320,
    passRate: 78,
    specializations: [
      {
        id: "MATH-PURE",
        name: "رياضيات بحتة",
        totalStudents: 150,
        passRate: 75,
        levels: {
          "1": {
            fall: [
              { code: "MATH101", name: "التفاضل والتكامل 1", enrolled: 40, passRate: 70, failRate: 30 },
              { code: "MATH102", name: "الجبر الخطي", enrolled: 40, passRate: 75, failRate: 25 }
            ],
            spring: [
              { code: "MATH103", name: "التفاضل والتكامل 2", enrolled: 35, passRate: 72, failRate: 28 },
              { code: "MATH104", name: "الرياضيات المتقطعة", enrolled: 35, passRate: 78, failRate: 22 }
            ]
          }
        }
      }
    ]
  }
];

// Mock groups data
const courseGroups = {
  "CS101": [
    { code: "CS101-L1", type: "Lecture", studentCount: 15 },
    { code: "CS101-L2", type: "Lecture", studentCount: 15 },
    { code: "CS101-LAB1", type: "Lab", studentCount: 8 },
    { code: "CS101-LAB2", type: "Lab", studentCount: 7 }
  ],
  "CS102": [
    { code: "CS102-L1", type: "Lecture", studentCount: 18 },
    { code: "CS102-L2", type: "Lecture", studentCount: 12 },
    { code: "CS102-LAB1", type: "Lab", studentCount: 10 }
  ]
};

// Mock student data
const groupStudents = {
  "CS101-L1": [
    { regNo: "2024001", name: "Ahmed Hassan", courseworkTotal: 52, passing: true },
    { regNo: "2024002", name: "Sarah Wilson", courseworkTotal: 45, passing: true },
    { regNo: "2024003", name: "Mohamed Ali", courseworkTotal: 28, passing: false },
    { regNo: "2024004", name: "Chen Liu", courseworkTotal: 55, passing: true },
    { regNo: "2024005", name: "Emma Thompson", courseworkTotal: 32, passing: false }
  ]
};

export function CourseManagement() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("1");
  const [selectedSemester, setSelectedSemester] = useState<string>("fall");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
    setSelectedSpecialization(null);
    setSelectedCourse(null);
    setSelectedGroup(null);
  };

  const handleSpecializationSelect = (specId: string) => {
    setSelectedSpecialization(specId);
    setSelectedCourse(null);
    setSelectedGroup(null);
  };

  const handleCourseSelect = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (groupCode: string) => {
    setSelectedGroup(groupCode);
  };

  const exportGroupData = (groupCode: string) => {
    console.log("Exporting data for group:", groupCode);
    // Implementation for Excel export
  };

  const getCurrentCourses = () => {
    if (!selectedSpecialization) return [];
    
    const dept = departments.find(d => d.id === selectedDepartment);
    const spec = dept?.specializations.find(s => s.id === selectedSpecialization);
    const levelData = spec?.levels[selectedLevel as keyof typeof spec.levels];
    
    if (!levelData) return [];
    return levelData[selectedSemester as keyof typeof levelData] || [];
  };

  const getCurrentGroups = () => {
    if (!selectedCourse) return [];
    return courseGroups[selectedCourse as keyof typeof courseGroups] || [];
  };

  const getCurrentStudents = () => {
    if (!selectedGroup) return [];
    return groupStudents[selectedGroup as keyof typeof groupStudents] || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المقررات</h1>
        <p className="text-muted-foreground">
          عرض وتصدير درجات الأعمال الفصلية ونِسَب النجاح/الرسوب حسب القسم والتخصص
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Pane: Department & Specialization Tree */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                الأقسام
              </CardTitle>
              <CardDescription>اختر القسم والتخصص</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {departments.map((dept) => (
                <div key={dept.id} className="space-y-2">
                  {/* Department Header */}
                  <div 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      selectedDepartment === dept.id ? "bg-blue-100 text-blue-700" : "hover:bg-muted"
                    )}
                    onClick={() => {
                      toggleDepartment(dept.id);
                      handleDepartmentSelect(dept.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {expandedDepartments.includes(dept.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Building className="h-4 w-4" />
                      <span className="font-medium text-sm">{dept.name}</span>
                    </div>
                  </div>

                  {/* Department Summary Cards */}
                  {selectedDepartment === dept.id && (
                    <div className="ml-6 space-y-2">
                      <div className="grid gap-2">
                        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
                                <p className="text-lg font-bold text-blue-600">{dept.totalStudents}</p>
                              </div>
                              <Users className="h-4 w-4 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="shadow-sm bg-gradient-to-r from-green-50 to-green-100">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">نسبة النجاح</p>
                                <p className="text-lg font-bold text-green-600">{dept.passRate}%</p>
                              </div>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {expandedDepartments.includes(dept.id) && (
                    <div className="ml-6 space-y-1">
                      {dept.specializations.map((spec) => (
                        <div
                          key={spec.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors",
                            selectedSpecialization === spec.id ? "bg-blue-50 text-blue-700" : "hover:bg-muted"
                          )}
                          onClick={() => handleSpecializationSelect(spec.id)}
                        >
                          <GraduationCap className="h-4 w-4" />
                          <span>{spec.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {spec.totalStudents}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: Course Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSpecialization ? (
            <>
              {/* Level & Semester Tabs */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    المستويات والفصول الدراسية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="1">المستوى 1</TabsTrigger>
                      <TabsTrigger value="2">المستوى 2</TabsTrigger>
                      <TabsTrigger value="3">المستوى 3</TabsTrigger>
                      <TabsTrigger value="4">المستوى 4</TabsTrigger>
                      <TabsTrigger value="graduate">دراسات عليا</TabsTrigger>
                    </TabsList>
                    
                    {["1", "2", "3", "4", "graduate"].map((level) => (
                      <TabsContent key={level} value={level} className="mt-4">
                        <Tabs value={selectedSemester} onValueChange={setSelectedSemester}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="fall">فصل الخريف</TabsTrigger>
                            <TabsTrigger value="spring">فصل الربيع</TabsTrigger>
                          </TabsList>
                          
                          {["fall", "spring"].map((semester) => (
                            <TabsContent key={semester} value={semester} className="mt-4">
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {getCurrentCourses().map((course) => (
                                  <Card
                                    key={course.code}
                                    className={cn(
                                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                                      selectedCourse === course.code 
                                        ? "ring-2 ring-blue-500 shadow-lg" 
                                        : "hover:shadow-md"
                                    )}
                                    onClick={() => handleCourseSelect(course.code)}
                                  >
                                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                                      <CardTitle className="text-sm">{course.code}</CardTitle>
                                      <CardDescription className="text-blue-100 text-xs">
                                        {course.name}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">المسجلون</span>
                                          <Badge variant="secondary">{course.enrolled}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">نسبة النجاح</span>
                                          <div className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3 text-green-500" />
                                            <span className="text-sm font-medium text-green-600">
                                              {course.passRate}%
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">نسبة الرسوب</span>
                                          <div className="flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3 text-red-500" />
                                            <span className="text-sm font-medium text-red-600">
                                              {course.failRate}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Groups View */}
              {selectedCourse && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        مجموعات المقرر - {selectedCourse}
                      </CardTitle>
                      <CardDescription>اختر مجموعة لعرض تفاصيل الطلاب</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getCurrentGroups().map((group) => (
                          <div
                            key={group.code}
                            className={cn(
                              "flex items-center justify_between p-3 rounded-lg cursor-pointer transition-colors",
                              selectedGroup === group.code 
                                ? "bg-blue-100 text-blue-700" 
                                : "hover:bg-muted"
                            )}
                            onClick={() => handleGroupSelect(group.code)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{group.code}</span>
                              </div>
                              <Badge 
                                variant={group.type === "Lecture" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {group.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{group.studentCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Student Details */}
                  {selectedGroup && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <UserCheck className="h-5 w-5" />
                              الطلاب - {selectedGroup}
                            </CardTitle>
                            <CardDescription>درجات الأعمال الفصلية من 60</CardDescription>
                          </div>
                          <Button 
                            onClick={() => exportGroupData(selectedGroup)}
                            variant="outline"
                            size="sm"
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            تصدير إلى Excel
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>الرقم الجامعي</TableHead>
                                <TableHead>اسم الطالب</TableHead>
                                <TableHead>مجموع الأعمال الفصلية</TableHead>
                                <TableHead>الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getCurrentStudents().map((student) => (
                                <TableRow 
                                  key={student.regNo}
                                  className={cn(
                                    !student.passing && "bg-red-50"
                                  )}
                                >
                                  <TableCell className="font-mono text-sm">
                                    {student.regNo}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {student.name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "font-bold",
                                        student.passing ? "text-green-600" : "text-red-600"
                                      )}>
                                        {student.courseworkTotal}/60
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {student.passing ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        ناجح
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">
                                        <UserX className="h-3 w-3 mr-1" />
                                        راسب
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">اختر تخصصًا</h3>
                <p className="text-muted-foreground">
                  اختر قسمًا وتخصصًا من اللوحة اليسرى لعرض تفاصيل المقررات
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}