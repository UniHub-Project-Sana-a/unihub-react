import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, TrendingUp, TrendingDown, Minus } from "lucide-react";

// بيانات الطلاب (قد تظل الأسماء باللاتينية في بيئة أكاديمية، لكن تم تعريب الحالة الأكاديمية والمقررات لغرض العرض)
const studentProgressData = [
  {
    id: "2024001",
    name: "أحمد الراشد", // تعريب الاسم
    email: "ahmed.rashid@student.unihub.edu",
    gpa: 3.2,
    academicStanding: "وضع أكاديمي جيد", // تعريب
    courses: [
      { code: "CS101", name: "أساسيات البرمجة", attendance: 92, grade: "B+", status: "نجاح", credits: 3 }, // تعريب
      { code: "MATH201", name: "حساب التفاضل والتكامل II", attendance: 88, grade: "A-", status: "نجاح", credits: 4 }, // تعريب
      { code: "PHY101", name: "فيزياء I", attendance: 76, grade: "C+", status: "نجاح", credits: 3 }, // تعريب
      { code: "ENG102", name: "الكتابة الأكاديمية", attendance: 95, grade: "A", status: "نجاح", credits: 2 } // تعريب
    ]
  },
  {
    id: "2024002",
    name: "سارة جونسون", // تعريب الاسم
    email: "sarah.johnson@student.unihub.edu",
    gpa: 2.8,
    academicStanding: "تحت الملاحظة الأكاديمية", // تعريب
    courses: [
      { code: "CS101", name: "أساسيات البرمجة", attendance: 65, grade: "C-", status: "نجاح", credits: 3 },
      { code: "MATH201", name: "حساب التفاضل والتكامل II", attendance: 72, grade: "D+", status: "نجاح", credits: 4 },
      { code: "PHY101", name: "فيزياء I", attendance: 58, grade: "F", status: "رسوب", credits: 3 }, // تعريب
      { code: "ENG102", name: "الكتابة الأكاديمية", attendance: 89, grade: "B", status: "نجاح", credits: 2 }
    ]
  }
];

export function StudentProgressReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(studentProgressData[0]);

  const filteredStudents = studentProgressData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600";
    if (gpa >= 3.0) return "text-blue-600";
    if (gpa >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  // تعديل قيم التلوين بناءً على التعريب
  const getStandingColor = (standing: string) => {
    if (standing === "وضع أكاديمي جيد") return "bg-green-100 text-green-700";
    if (standing === "تحت الملاحظة الأكاديمية") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return "bg-green-100 text-green-700";
    if (grade.startsWith('B')) return "bg-blue-100 text-blue-700";
    if (grade.startsWith('C')) return "bg-yellow-100 text-yellow-700";
    if (grade.startsWith('D')) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };
  
  // دالة مساعدة لتعريب حالة النجاح/الرسوب
  const getStatusColor = (status: string) => {
      return status === "نجاح" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  };


  return (
    <div className="space-y-6 text-right"> {/* إضافة محاذاة لليمين للنصوص العامة */}
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 flex-row-reverse space-x-reverse"> {/* عكس ترتيب الأيقونة والعنوان */}
            <User className="w-5 h-5 text-blue-600" />
            <span>تقرير التقدم الأكاديمي للطالب</span> {/* النص المُعرب */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 flex-row-reverse space-x-reverse mb-6"> {/* عكس اتجاه عناصر البحث والزر */}
            <div className="relative flex-1">
              {/* تعديل مكان الأيقونة من left إلى right، وتعديل padding-left إلى padding-right */}
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" /> 
              <Input
                placeholder="ابحث عن الطلاب بالاسم أو الرقم الجامعي..." // النص المُعرب
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10" // تعديل الـ padding-left إلى padding-right
              />
            </div>
            <Button variant="outline">
              تصدير التقرير {/* النص المُعرب */}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* قائمة الطلاب */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-lg text-right">الطلاب</CardTitle> {/* النص المُعرب والمحاذاة لليمين */}
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStudent.id === student.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.id}</p>
                    <div className="flex items-center justify-between mt-2 flex-row-reverse"> {/* عكس ترتيب العناصر */}
                      <span className={`text-sm font-medium ${getGPAColor(student.gpa)}`}>
                        المعدل (GPA): {student.gpa} {/* النص المُعرب */}
                      </span>
                      <Badge className={getStandingColor(student.academicStanding)}>
                        {student.academicStanding}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* تفاصيل الطالب المختار */}
            <div className="lg:col-span-2">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-row-reverse"> {/* عكس ترتيب العنوان والبيانات */}
                    <span>{selectedStudent.name} - التقدم الأكاديمي</span> {/* النص المُعرب */}
                    <div className="flex items-center space-x-2 flex-row-reverse space-x-reverse"> {/* عكس ترتيب الشارات */}
                      <span className={`text-lg font-bold ${getGPAColor(selectedStudent.gpa)}`}>
                        المعدل (GPA): {selectedStudent.gpa}
                      </span>
                      <Badge className={getStandingColor(selectedStudent.academicStanding)}>
                        {selectedStudent.academicStanding}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg text-right"> {/* المحاذاة لليمين */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">الرقم الجامعي:</span> {/* النص المُعرب */}
                        <span className="mr-2">{selectedStudent.id}</span> {/* تعديل ml-2 إلى mr-2 */}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">البريد الإلكتروني:</span> {/* النص المُعرب */}
                        <span className="mr-2">{selectedStudent.email}</span> {/* تعديل ml-2 إلى mr-2 */}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">إجمالي المقررات:</span> {/* النص المُعرب */}
                        <span className="mr-2">{selectedStudent.courses.length}</span> {/* تعديل ml-2 إلى mr-2 */}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">إجمالي الساعات المعتمدة:</span> {/* النص المُعرب */}
                        <span className="mr-2"> {/* تعديل ml-2 إلى mr-2 */}
                          {selectedStudent.courses.reduce((sum, course) => sum + course.credits, 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المقرر</TableHead> {/* تعريب العناوين */}
                        <TableHead>الحضور</TableHead>
                        <TableHead>الدرجة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>النقاط المعتمدة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.courses.map((course, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="text-right"> {/* المحاذاة لليمين */}
                              <p className="font-medium text-gray-900">{course.code}</p>
                              <p className="text-sm text-gray-500">{course.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 flex-row-reverse space-x-reverse"> {/* عكس اتجاه الـ progress bar */}
                              <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                                <div 
                                  className={`h-2 rounded-full ${
                                    course.attendance >= 85 ? 'bg-green-500' : 
                                    course.attendance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${course.attendance}%` }}
                                />
                              </div>
                              <span className="text-sm">{course.attendance}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(course.grade)}>
                              {course.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(course.status)}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{course.credits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}