import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, BookOpen, Users, DollarSign, Loader2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api"; // تأكد من مسار api لديك
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// تعريف أنواع البيانات القادمة من الـ API
interface DashboardData {
  counts: {
    departments: number;
    classrooms: number;
    programs: number;
    staff: number;
  };
  financials: {
    current_month: number;
    last_six_months: { month_key: string; total_amount: string }[];
    top_spenders: {
      name: string;
      department: string;
      hours: string;
      amount: string;
    }[];
  };
}

type CollegesDashboardModuleProps = {
  collegeId: number | string; // نستقبل فقط الآيدي
};

export default function CollegesDashboardModule({ collegeId }: CollegesDashboardModuleProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/v1/colleges/${collegeId}/dashboard`);
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch college dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) {
      fetchDashboardData();
    }
  }, [collegeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-10">لا توجد بيانات لعرضها</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* البطاقات الإحصائية العلوية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="عدد الأقسام" value={data.counts.departments} icon={<Building2 className="h-8 w-8 text-primary" />} />
        <StatsCard title="عدد القاعات" value={data.counts.classrooms} icon={<BookOpen className="h-8 w-8 text-blue-500" />} />
        <StatsCard title="عدد البرامج" value={data.counts.programs} icon={<BookOpen className="h-8 w-8 text-indigo-500" />} />
        <StatsCard title="أعضاء هيئة التدريس" value={data.counts.staff} icon={<Users className="h-8 w-8 text-green-500" />} />
        <StatsCard 
            title="مصروفات الشهر الحالي" 
            value={Number(data.financials.current_month).toLocaleString()} 
            icon={<DollarSign className="h-8 w-8 text-amber-500" />} 
            isMoney
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* جدول الرسم البياني (مبسط كقائمة) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              استحقاقات آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.financials.last_six_months.length > 0 ? (
                data.financials.last_six_months.map((item, idx) => {
                    // تحويل YYYY-MM إلى اسم شهر عربي
                    const date = new Date(item.month_key + "-01");
                    const monthName = format(date, "MMMM yyyy", { locale: ar });
                    
                    return (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium text-sm">{monthName}</span>
                        <span className="text-primary font-bold">{Number(item.total_amount).toLocaleString()} ر.ي</span>
                        </div>
                    );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد بيانات مالية مسجلة.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* جدول أعلى المصروفات */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>أعلى أعضاء هيئة التدريس استحقاقاً (تراكمي)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-center">الساعات المحسوبة</TableHead>
                  <TableHead className="text-left">المبلغ الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.financials.top_spenders.length > 0 ? (
                    data.financials.top_spenders.map((lecturer, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{lecturer.name}</TableCell>
                        <TableCell>{lecturer.department}</TableCell>
                        <TableCell className="text-center">{Number(lecturer.hours).toFixed(1)}</TableCell>
                        <TableCell className="text-left font-bold text-green-600">
                        {Number(lecturer.amount).toLocaleString()} ر.ي
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            لا توجد سجلات حضور مدفوعة بعد.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// مكون مساعد للبطاقات لتقليل التكرار
function StatsCard({ title, value, icon, isMoney = false }: { title: string; value: number | string; icon: React.ReactNode; isMoney?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
                {value}
                {isMoney && <span className="text-sm font-normal text-muted-foreground mr-1">ر.ي</span>}
            </p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}