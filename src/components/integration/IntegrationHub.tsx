import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, Database, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

// تعريب أسماء الأنظمة وحالاتها
const integrations = [
  {
    name: "تطبيق الطلاب للجوال",
    status: "متصل",
    lastSync: "منذ دقيقتين",
    users: 2681,
    version: "v2.1.4"
  },
  {
    name: "تطبيق المحاضرين للجوال",
    status: "متصل",
    lastSync: "منذ 5 دقائق",
    users: 156,
    version: "v2.1.4"
  },
  {
    name: "نظام جداول ASC",
    status: "تحذير",
    lastSync: "منذ ساعتين",
    users: 1,
    version: "v3.2"
  },
  {
    name: "النظام المالي",
    status: "غير متصل",
    lastSync: "منذ يوم واحد",
    users: 8,
    version: "v1.8"
  }
];

// تعديل الدالة لتعمل مع الحالة المعرّبة
const getStatusIcon = (status: string) => {
  switch (status) {
    case "متصل":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "تحذير":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "غير متصل":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <RefreshCw className="w-5 h-5 text-gray-400" />;
  }
};

// تعديل الدالة لتعمل مع الحالة المعرّبة
const getStatusColor = (status: string) => {
  switch (status) {
    case "متصل":
      return "bg-green-100 text-green-700";
    case "تحذير":
      return "bg-yellow-100 text-yellow-700";
    case "غير متصل":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export function IntegrationHub() {
  // بيانات الملخص معرّبة يدويًا
  const connectedSystems = integrations.filter(i => i.status === "متصل").length;
  const mobileUsers = (2681 + 156).toLocaleString(); // مجموع المستخدمين
  const apiCalls = "45,231";
  const uptime = "99.8%";


  return (
    <div className="space-y-6 text-right"> {/* المحاذاة لليمين للنصوص العامة */}
      <div className="flex items-center justify-between flex-row-reverse"> {/* عكس اتجاه عناصر الهيدر */}
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">مركز التكامل</h1> {/* النص المُعرب */}
          <p className="text-gray-600">إدارة مزامنة تطبيقات الجوال وتكامل الأنظمة</p> {/* النص المُعرب */}
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          <RefreshCw className="w-4 h-4 ml-2" /> {/* عكس موقع الأيقونة */}
          مزامنة الكل {/* النص المُعرب */}
        </Button>
      </div>

      {/* Integration Status Overview (نظرة عامة على حالة التكامل) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse"> {/* عكس ترتيب الأيقونة والبيانات */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">الأنظمة المتصلة</p> {/* النص المُعرب */}
                <p className="text-3xl font-bold text-green-600">{connectedSystems}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">مستخدمو الجوال</p> {/* النص المُعرب */}
                <p className="text-3xl font-bold text-blue-600">{mobileUsers}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">استدعاءات API/اليوم</p> {/* النص المُعرب */}
                <p className="text-3xl font-bold text-purple-600">{apiCalls}</p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">وقت التشغيل</p> {/* النص المُعرب */}
                <p className="text-3xl font-bold text-orange-600">{uptime}</p>
              </div>
              <Wifi className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards (بطاقات التكامل) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration, index) => (
          <Card key={index} className="shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-row-reverse"> {/* عكس ترتيب الأيقونة والعنوان والشارة */}
                <div className="flex items-center space-x-3 flex-row-reverse space-x-reverse"> {/* عكس ترتيب الأيقونة والاسم */}
                  {getStatusIcon(integration.status)}
                  <span>{integration.name}</span>
                </div>
                <Badge className={getStatusColor(integration.status)}>
                  {integration.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-right"> {/* محاذاة لليمين */}
                <div>
                  <span className="text-gray-500">آخر مزامنة:</span> {/* النص المُعرب */}
                  <p className="font-medium">{integration.lastSync}</p>
                </div>
                <div>
                  <span className="text-gray-500">المستخدمون النشطون:</span> {/* النص المُعرب */}
                  <p className="font-medium">{integration.users.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">الإصدار:</span> {/* النص المُعرب */}
                  <p className="font-medium">{integration.version}</p>
                </div>
                <div>
                  <span className="text-gray-500">تدفق البيانات:</span> {/* النص المُعرب */}
                  <p className="font-medium">ثنائي الاتجاه</p> {/* النص المُعرب */}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t flex-row-reverse"> {/* عكس ترتيب مجموعات الأزرار */}
                <div className="flex items-center space-x-2 space-x-reverse"> {/* عكس ترتيب الأزرار */}
                  <Button variant="outline" size="sm">
                    إعدادات {/* النص المُعرب */}
                  </Button>
                  <Button variant="outline" size="sm">
                    السجلات {/* النص المُعرب */}
                  </Button>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="w-4 h-4 ml-2" /> {/* عكس موقع الأيقونة */}
                  مزامنة الآن {/* النص المُعرب */}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Data Monitor (مراقب البيانات في الوقت الفعلي) */}
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 flex-row-reverse space-x-reverse"> {/* عكس ترتيب الأيقونة والعنوان */}
            <Database className="w-5 h-5 text-blue-600" />
            <span>مراقب البيانات في الوقت الفعلي</span> {/* النص المُعرب */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "تحديث الجدول الزمني", time: "2:34 م", status: "متصل", details: "تمت مزامنة 156 مقررًا" }, // تعريب
              { type: "حضور الطلاب", time: "2:31 م", status: "متصل", details: "تم تحديث 2,681 سجل" }, // تعريب
              { type: "تقديم عذر", time: "2:28 م", status: "متصل", details: "طلب جديد من د. جونسون" }, // تعريب
              { type: "تحديث الدرجات", time: "2:25 م", status: "تحذير", details: "مزامنة جزئية - فشل 3 سجلات" }, // تعريب
              { type: "تسجيل دخول مستخدم", time: "2:22 م", status: "متصل", details: "أ. حسن - تطبيق الجوال" } // تعريب
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 flex-row-reverse"> {/* عكس اتجاه عناصر السجل */}
                <div className="flex items-center space-x-3 flex-row-reverse space-x-reverse"> {/* عكس ترتيب الأيقونة والتفاصيل */}
                  {getStatusIcon(activity.status)}
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{activity.type}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                  </div>
                </div>
                <div className="text-left"> {/* محاذاة الوقت لليسار ليظهر على الجانب الأيسر (الأخير في سياق RTL) */}
                  <p className="text-sm text-gray-500">{activity.time}</p>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}