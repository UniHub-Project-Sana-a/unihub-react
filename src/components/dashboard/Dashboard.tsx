import { KPICards } from "./KPICards";
import { QuickActions } from "./QuickActions";
import { RecentActivities } from "./RecentActivities";
import { SystemHealth } from "./SystemHealth";
import { EnrollmentChart } from "./EnrollmentChart";
import { InstructorWorkload } from "./InstructorWorkload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm sm:text-base text-muted-foreground">مرحبًا بك في بوابة إدارة UniHub</p>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          آخر تحديث: {new Date().toLocaleString()}
        </div>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* النفقات بناءً على الكليات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              النفقات بناءً على الكليات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "كلية الحاسوب", amount: 180000 },
                { name: "كلية الطب", amount: 240000 },
                { name: "كلية الهندسة", amount: 150000 },
                { name: "كلية الإعلام", amount: 90000 }
              ].map((college, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{college.name}</span>
                    <span className="text-primary font-bold">{college.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${(college.amount / 240000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* أكثر الكليات صرفاً للمستحقات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              أكثر الكليات صرفاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { rank: 1, name: "كلية الطب", amount: 240000 },
                { rank: 2, name: "كلية الحاسوب", amount: 180000 },
                { rank: 3, name: "كلية الهندسة", amount: 150000 }
              ].map((college) => (
                <div key={college.rank} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {college.rank}
                    </div>
                    <span className="font-medium">{college.name}</span>
                  </div>
                  <span className="text-primary font-bold">{college.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* مؤشرات عامة لرئاسة الجامعة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              مؤشرات عامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">إجمالي أعضاء هيئة التدريس</p>
                <p className="text-2xl font-bold text-primary">120</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">عدد البرامج</p>
                <p className="text-2xl font-bold text-primary">28</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">متوسط أجر الساعة</p>
                <p className="text-2xl font-bold text-primary">115</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">إجمالي المصروفات هذا الشهر</p>
                <p className="text-2xl font-bold text-primary">720,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <EnrollmentChart />
          <InstructorWorkload />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <QuickActions />
          <RecentActivities />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
}