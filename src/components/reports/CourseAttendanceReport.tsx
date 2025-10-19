import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";

const courseAttendanceData = [
  {
    course: "CS101 - Programming Fundamentals",
    students: [
      { id: "2024001", name: "Ahmed Al-Rashid", attendance: 92 },
      { id: "2024002", name: "Sarah Johnson", attendance: 88 },
      { id: "2024003", name: "Mohamed Hassan", attendance: 76 },
      { id: "2024004", name: "Lisa Chen", attendance: 95 },
    ],
    averageAttendance: 87.75
  },
  {
    course: "MATH201 - Calculus II",
    students: [
      { id: "2024005", name: "Omar Khalil", attendance: 85 },
      { id: "2024006", name: "Emma Wilson", attendance: 92 },
      { id: "2024007", name: "Yasmin Ali", attendance: 68 },
      { id: "2024008", name: "David Park", attendance: 89 },
    ],
    averageAttendance: 83.5
  }
];

const chartData = courseAttendanceData.map(course => ({
  course: course.course.split(' - ')[0],
  average: course.averageAttendance,
  students: course.students.length
}));

export function CourseAttendanceReport() {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>ملخص حضور المقررات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`, 
                  name === 'average' ? 'متوسط الحضور' : 'الطلاب'
                ]}
              />
              <Bar dataKey="average" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {courseAttendanceData.map((courseData, index) => (
        <Card key={index} className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{courseData.course}</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">المتوسط: {courseData.averageAttendance}%</span>
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  {courseData.students.length} طلاب
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم الجامعي</TableHead>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>نسبة الحضور</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseData.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">{student.id}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div 
                            className={`h-2 rounded-full ${
                              student.attendance >= 85 ? 'bg-green-500' : 
                              student.attendance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.attendance >= 85 ? (
                        <Badge className="bg-green-100 text-green-700">ممتاز</Badge>
                      ) : student.attendance >= 70 ? (
                        <Badge className="bg-yellow-100 text-yellow-700">جيد</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          معرض للخطر
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}