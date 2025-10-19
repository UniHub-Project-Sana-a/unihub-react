import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Clock, FileText, TrendingUp, TrendingDown } from "lucide-react";

const kpis = [
  {
    title: "إجمالي المستخدمين",
    value: "2,847",
    change: "+12%",
    changeType: "increase",
    icon: Users,
    color: "blue"
  },
  {
    title: "المقررات النشطة",
    value: "156",
    change: "+8%",
    changeType: "increase",
    icon: BookOpen,
    color: "green"
  },
  {
    title: "الجلسات المباشرة",
    value: "23",
    change: "-2%",
    changeType: "decrease",
    icon: Clock,
    color: "orange"
  },
  {
    title: "الأعذار قيد الانتظار",
    value: "7",
    change: "+3",
    changeType: "increase",
    icon: FileText,
    color: "red"
  }
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                <div className="flex items-center mt-2">
                  {kpi.changeType === "increase" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpi.changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}>
                    {kpi.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">مقارنة بالشهر الماضي</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-${kpi.color}-100`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
              </div>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${kpi.color}-400 to-${kpi.color}-600`} />
        </Card>
      ))}
    </div>
  );
}