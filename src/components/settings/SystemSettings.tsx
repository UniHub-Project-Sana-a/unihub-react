import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Database, Shield, Bell, Globe } from "lucide-react";

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-gray-600">تكوين الإعدادات والتفضيلات على مستوى النظام</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          <Settings className="w-4 h-4 mr-2" />
          حفظ جميع التغييرات
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الإعدادات العامة */}
        <Card className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>الإعدادات العامة</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university-name">اسم الجامعة</Label>
              <Input id="university-name" defaultValue="UniHub University" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">بريد المسؤول</Label>
              <Input id="admin-email" type="email" defaultValue="admin@unihub.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">العام الدراسي</Label>
              <Input id="academic-year" defaultValue="2024-2025" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">وضع الصيانة</Label>
              <Switch id="maintenance-mode" />
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الأمان */}
        <Card className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>إعدادات الأمان</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor">المصادقة الثنائية</Label>
              <Switch id="two-factor" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password-policy">سياسة كلمة مرور قوية</Label>
              <Switch id="password-policy" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">مهلة الجلسة (بالدقائق)</Label>
              <Input id="session-timeout" type="number" defaultValue="30" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="audit-logs">تفعيل سجلات التدقيق</Label>
              <Switch id="audit-logs" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* إعدادات قاعدة البيانات */}
        <Card className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>إعدادات قاعدة البيانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">تكرار النسخ الاحتياطي</Label>
              <select className="w-full p-2 border rounded-md">
                <option>يوميًا</option>
                <option>أسبوعيًا</option>
                <option>شهريًا</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">نسخ احتياطي تلقائي</Label>
              <Switch id="auto-backup" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention-period">مدة الاحتفاظ بالبيانات (أيام)</Label>
              <Input id="retention-period" type="number" defaultValue="365" />
            </div>
            <Button variant="outline" className="w-full">
              تنفيذ النسخ الاحتياطي الآن
            </Button>
          </CardContent>
        </Card>

        {/* إعدادات الإشعارات */}
        <Card className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span>إعدادات الإشعارات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">إشعارات الرسائل النصية</Label>
              <Switch id="sms-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">إشعارات الدفع</Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-email">بريد الإشعارات</Label>
              <Input id="notification-email" type="email" defaultValue="notifications@unihub.edu" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معلومات النظام */}
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>معلومات النظام</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">الإصدار</h3>
              <p className="text-2xl font-bold text-blue-600">v2.1.4</p>
              <p className="text-sm text-gray-500">تاريخ الإصدار: يناير 2024</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">حجم قاعدة البيانات</h3>
              <p className="text-2xl font-bold text-green-600">2.4 GB</p>
              <p className="text-sm text-gray-500">آخر نسخة احتياطية: منذ ساعتين</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">مدة تشغيل الخادم</h3>
              <p className="text-2xl font-bold text-purple-600">99.8%</p>
              <p className="text-sm text-gray-500">متوسط 30 يومًا</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}