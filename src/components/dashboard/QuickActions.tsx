import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, Settings } from "lucide-react";

const actions = [
  {
    title: "إضافة مستخدم جديد",
    description: "إنشاء حساب مستخدم",
    icon: Plus,
    color: "blue"
  },
  {
    title: "استيراد الجدول الزمني",
    description: "رفع جدول ASC",
    icon: Upload,
    color: "green"
  },
  {
    title: "تصدير التقارير",
    description: "تنزيل التحليلات",
    icon: Download,
    color: "orange"
  },
  {
    title: "إعدادات النظام",
    description: "إدارة الإعدادات",
    icon: Settings,
    color: "purple"
  }
];

export function QuickActions() {
  return (
    <Card className="shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">الإجراءات السريعة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            className="w-full justify-start h-auto p-4 hover:bg-gray-50 transition-all duration-200"
          >
            <div className={`p-2 rounded-lg bg-${action.color}-100 mr-3`}>
              <action.icon className={`w-4 h-4 text-${action.color}-600`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">{action.title}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}