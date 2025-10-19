import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Users, FileSpreadsheet, Split, Download } from "lucide-react";
import { FailedStudentCarryover } from "./FailedStudentCarryover";

const enrollmentData = [
  {
    id: 1,
    course: "CS101 - أساسيات البرمجة",
    totalStudents: 89,
    groups: [
      { name: "المجموعة 1", students: 45, instructor: "Dr. Smith", schedule: "الإثنين/الأربعاء 9:00-11:00" },
      { name: "المجموعة 2", students: 44, instructor: "Dr. Ahmed", schedule: "الثلاثاء/الخميس 9:00-11:00" }
    ],
    status: "نشط"
  },
  {
    id: 2,
    course: "MATH201 - التفاضل والتكامل 2",
    totalStudents: 76,
    groups: [
      { name: "المجموعة 1", students: 38, instructor: "Prof. Johnson", schedule: "الإثنين/الأربعاء 11:00-13:00" },
      { name: "المجموعة 2", students: 38, instructor: "Dr. Wilson", schedule: "الثلاثاء/الخميس 11:00-13:00" }
    ],
    status: "نشط"
  },
  {
    id: 3,
    course: "PHY301 - فيزياء الكم",
    totalStudents: 52,
    groups: [
      { name: "المجموعة 1", students: 28, instructor: "Dr. Chen", schedule: "الأربعاء/الجمعة 14:00-16:00" },
      { name: "المجموعة 2", students: 24, instructor: "Prof. Garcia", schedule: "الإثنين/الخميس 14:00-16:00" }
    ],
    status: "نشط"
  },
  {
    id: 4,
    course: "ENG102 - الكتابة الأكاديمية",
    totalStudents: 95,
    groups: [
      { name: "المجموعة 1", students: 32, instructor: "Dr. Brown", schedule: "الثلاثاء/الخميس 10:00-12:00" },
      { name: "المجموعة 2", students: 31, instructor: "Prof. Davis", schedule: "الأربعاء/الجمعة 10:00-12:00" },
      { name: "المجموعة 3", students: 32, instructor: "Dr. Martinez", schedule: "الإثنين/الأربعاء 13:00-15:00" }
    ],
    status: "قيد الانتظار"
  }
];

export function EnrollmentManagement() {
  const [selectedCourse, setSelectedCourse] = useState(enrollmentData[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة تسجيل الطلاب</h1>
          <p className="text-gray-600">استيراد وإدارة تسجيلات الطلاب في المقررات</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            تصدير البيانات
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Upload className="w-4 h-4 mr-2" />
            استيراد الطلاب
          </Button>
        </div>
      </div>

      <Tabs defaultValue="enrollment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrollment">إدارة التسجيل</TabsTrigger>
          <TabsTrigger value="carryover">ترحيل الطلاب الراسبين</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enrollment" className="space-y-6">
          {/* Import Interface */}
          <Card className="shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>استيراد بيانات الطلاب</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">رفع ملف CSV</h3>
                  <p className="text-sm text-gray-500 mb-3">رفع قوائم الطلاب بصيغة CSV</p>
                  <Button variant="outline" size="sm">اختر ملفًا</Button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors duration-200 cursor-pointer">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">رفع ملف Excel</h3>
                  <p className="text-sm text-gray-500 mb-3">الاستيراد من ملفات Excel</p>
                  <Button variant="outline" size="sm">اختر ملفًا</Button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors duration-200 cursor-pointer">
                  <Split className="w-12 ه-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">تقسيم المجموعات تلقائيًا</h3>
                  <p className="text-sm text-gray-500 mb-3">تقسيم الطلاب إلى مجموعات تلقائيًا</p>
                  <Button variant="outline" size="sm">إعداد</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>قائمة المقررات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrollmentData.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedCourse.id === course.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{course.course}</h3>
                      <Badge className={course.status === "نشط" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{course.totalStudents} طلاب</span>
                      <span>{course.groups.length} مجموعات</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card className="shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Split className="w-5 h-5 text-blue-600" />
                      <span>إدارة المجموعات - {selectedCourse.course}</span>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Split className="w-4 h-4 mr-2" />
                      تقسيم المجموعات
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCourse.groups.map((group, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{group.students} طلاب</Badge>
                            <Button variant="ghost" size="sm">تعديل</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">المدرّس:</span>
                            <span className="ml-2 text-gray-600">{group.instructor}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">الجدول:</span>
                            <span className="ml-2 text-gray-600">{group.schedule}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Student List */}
              <Card className="shadow-xl bg-white mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>الطلاب المسجّلون</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الرقم الجامعي</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>المجموعة</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { id: "2024001", name: "Ahmed Al-Rashid", group: "المجموعة 1", email: "ahmed.rashid@student.unihub.edu", status: "نشط" },
                        { id: "2024002", name: "Sarah Johnson", group: "المجموعة 1", email: "sarah.johnson@student.unihub.edu", status: "نشط" },
                        { id: "2024003", name: "Mohamed Hassan", group: "المجموعة 2", email: "mohamed.hassan@student.unihub.edu", status: "نشط" },
                        { id: "2024004", name: "Lisa Chen", group: "المجموعة 2", email: "lisa.chen@student.unihub.edu", status: "قيد الانتظار" }
                      ].map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">{student.id}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.group}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                          <TableCell>
                            <Badge className={student.status === "نشط" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="carryover">
          <FailedStudentCarryover />
        </TabsContent>
      </Tabs>
    </div>
  );
}