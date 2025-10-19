import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { GraduationCap, TrendingUp, Users, Award } from "lucide-react";

const coursePerformanceData = [
  {
    course: "CS101 - Programming Fundamentals",
    totalStudents: 45,
    gradeDistribution: [
      { grade: "A", count: 12, percentage: 26.7 },
      { grade: "B", count: 18, percentage: 40.0 },
      { grade: "C", count: 10, percentage: 22.2 },
      { grade: "D", count: 3, percentage: 6.7 },
      { grade: "F", count: 2, percentage: 4.4 }
    ],
    passRate: 95.6,
    instructor: "Dr. Smith"
  },
  {
    course: "MATH201 - Calculus II",
    totalStudents: 38,
    gradeDistribution: [
      { grade: "A", count: 8, percentage: 21.1 },
      { grade: "B", count: 15, percentage: 39.5 },
      { grade: "C", count: 9, percentage: 23.7 },
      { grade: "D", count: 4, percentage: 10.5 },
      { grade: "F", count: 2, percentage: 5.3 }
    ],
    passRate: 94.7,
    instructor: "Prof. Johnson"
  }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

export function CoursePerformanceReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المقررات</p>
                <p className="text-3xl font-bold text-blue-600">{coursePerformanceData.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الطلاب</p>
                <p className="text-3xl font-bold text-green-600">
                  {coursePerformanceData.reduce((sum, course) => sum + course.totalStudents, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط نسبة النجاح</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(coursePerformanceData.reduce((sum, course) => sum + course.passRate, 0) / coursePerformanceData.length).toFixed(1)}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {coursePerformanceData.map((courseData, index) => (
        <Card key={index} className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{courseData.course}</span>
              <div className="flex items-center space-x-4">
                <Badge className="bg-blue-100 text-blue-700">
                  {courseData.totalStudents} طلاب
                </Badge>
                <Badge className="bg-green-100 text-green-700">
                  {courseData.passRate}% نسبة النجاح
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">توزيع الدرجات</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={courseData.gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade, percentage }) => `${grade}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {courseData.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} طلاب`, 'العدد']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-4">تفاصيل مفصلة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>الطلاب</TableHead>
                      <TableHead>النسبة المئوية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.gradeDistribution.map((grade) => (
                      <TableRow key={grade.grade}>
                        <TableCell>
                          <Badge 
                            className={
                              grade.grade === 'A' ? 'bg-green-100 text-green-700' :
                              grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              grade.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              grade.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }
                          >
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{grade.count}</TableCell>
                        <TableCell>{grade.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">المحاضر:</span>
                    <span className="text-gray-600">{courseData.instructor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="font-medium text-gray-700">نسبة النجاح:</span>
                    <span className="font-medium text-green-600">{courseData.passRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}