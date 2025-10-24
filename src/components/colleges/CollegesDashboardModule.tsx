import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, BookOpen, Users, DollarSign } from "lucide-react";

type CollegesDashboardModuleProps = {
  departmentsCount: number;
  allClassroomsCount: number;
  programsCount: number;
  collegeStaffCount: number;
};

export default function CollegesDashboardModule({
  departmentsCount,
  allClassroomsCount,
  programsCount,
  collegeStaffCount,
}: CollegesDashboardModuleProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد الأقسام</p>
                <p className="text-2xl font-bold">{departmentsCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد القاعات</p>
                <p className="text-2xl font-bold">{allClassroomsCount}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد البرامج</p>
                <p className="text-2xl font-bold">{programsCount}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أعضاء هيئة التدريس</p>
                <p className="text-2xl font-bold">{collegeStaffCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المصروفات الشهرية</p>
                <p className="text-2xl font-bold">45,000</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مصاريف الاستحقاقات لآخر 6 أشهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { month: "أبريل", amount: 35000 },
              { month: "مايو", amount: 38000 },
              { month: "يونيو", amount: 41000 },
              { month: "يوليو", amount: 39500 },
              { month: "أغسطس", amount: 42000 },
              { month: "سبتمبر", amount: 45000 },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">{item.month}</span>
                <span className="text-primary font-bold">{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أعلى أعضاء هيئة التدريس صرفاً</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الساعات المدفوعة</TableHead>
                <TableHead>الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>أ.د. أحمد الحربي</TableCell>
                <TableCell>نظم المعلومات</TableCell>
                <TableCell>36</TableCell>
                <TableCell className="font-bold">5,400</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>د. مريم باوزير</TableCell>
                <TableCell>الذكاء الاصطناعي</TableCell>
                <TableCell>32</TableCell>
                <TableCell className="font-bold">4,160</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>د. سارة القحطاني</TableCell>
                <TableCell>علوم الحاسوب</TableCell>
                <TableCell>28</TableCell>
                <TableCell className="font-bold">3,360</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}