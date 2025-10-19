import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const healthItems = [
  {
    name: "قاعدة البيانات",
    status: "healthy",
    message: "جميع الأنظمة تعمل بشكل طبيعي"
  },
  {
    name: "مزامنة الهاتف المحمول",
    status: "warning",
    message: "تأخيرات طفيفة في المزامنة"
  },
  {
    name: "خدمات واجهة برمجة التطبيقات",
    status: "healthy",
    message: "زمن الاستجابة: 120ms"
  },
  {
    name: "نظام النسخ الاحتياطي",
    status: "healthy",
    message: "آخر نسخة احتياطية: قبل ساعتين"
  }
];

export function SystemHealth() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">صحة النظام</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {healthItems.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              {getStatusIcon(item.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.message}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}