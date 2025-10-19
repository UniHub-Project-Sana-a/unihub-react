import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, UserX, Calendar, GraduationCap } from "lucide-react";

const failedStudents = [
  {
    id: "2023001",
    name: "Ahmed Al-Rashid",
    course: "CS101 - أساسيات البرمجة",
    previousTerm: "خريف 2023",
    grade: "F",
    attendanceRate: 45,
    email: "ahmed.rashid@student.unihub.edu",
    attempts: 1
  },
  {
    id: "2023002",
    name: "Sarah Johnson",
    course: "MATH201 - التفاضل والتكامل 2", 
    previousTerm: "خريف 2023",
    grade: "D-",
    attendanceRate: 62,
    email: "sarah.johnson@student.unihub.edu",
    attempts: 2
  },
  {
    id: "2023003",
    name: "Mohamed Hassan",
    course: "PHY301 - فيزياء الكم",
    previousTerm: "خريف 2023", 
    grade: "F",
    attendanceRate: 38,
    email: "mohamed.hassan@student.unihub.edu",
    attempts: 1
  }
];

export function FailedStudentCarryover() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isCarryingOver, setIsCarryingOver] = useState(false);

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleCarryoverAll = () => {
    setSelectedStudents(failedStudents.map(s => s.id));
  };

  const handleCarryover = () => {
    setIsCarryingOver(true);
    // Simulate carryover process
    setTimeout(() => {
      setIsCarryingOver(false);
      setSelectedStudents([]);
      console.log("تم ترحيل الطلاب:", selectedStudents);
    }, 2000);
  };

  return (
    <Card className="shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            <span>ترحيل الطلاب الراسبين</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCarryoverAll}>
              تحديد الكل
            </Button>
            <Button 
              onClick={handleCarryover}
              disabled={selectedStudents.length === 0 || isCarryingOver}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isCarryingOver ? "جاري المعالجة..." : `ترحيل المحددين (${selectedStudents.length})`}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <UserX className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-900">عملية الترحيل التلقائية</h3>
          </div>
          <p className="text-sm text-orange-700">
            الطلاب الذين رسبوا في مقررات الفصل السابق سيتم تسجيلهم تلقائيًا في نفس المقررات للفصل الجديد.
            يرجى المراجعة واختيار الطلاب المطلوب ترحيلهم.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">تحديد</TableHead>
              <TableHead>الطالب</TableHead>
              <TableHead>المقرر</TableHead>
              <TableHead>الفصل السابق</TableHead>
              <TableHead>الدرجة</TableHead>
              <TableHead>الحضور</TableHead>
              <TableHead>المحاولات</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failedStudents.map((student) => (
              <TableRow key={student.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-900">{student.course}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{student.previousTerm}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-700">
                    {student.grade}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${student.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{student.attendanceRate}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    محاولة {student.attempts + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        عرض التفاصيل
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تفاصيل الطالب - {student.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">الرقم الجامعي</label>
                            <p className="text-sm text-gray-900">{student.id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <p className="text-sm text-gray-900">{student.email}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">المقرر الراسب</label>
                          <p className="text-sm text-gray-900">{student.course}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">الدرجة النهائية</label>
                            <Badge className="bg-red-100 text-red-700">{student.grade}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">نسبة الحضور</label>
                            <p className="text-sm text-gray-900">{student.attendanceRate}%</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">محاولات المقرر</label>
                            <p className="text-sm text-gray-900">{student.attempts}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}