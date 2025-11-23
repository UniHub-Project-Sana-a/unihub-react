import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowRight, CheckCircle2, Download, ShieldCheck, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CertInstructionPage() {
  const navigate = useNavigate();
  
  // رابط ملف الشهادة (تأكد أن الملف موجود في public/certs)
  // بما أن React مدمج مع Laravel، الرابط يبدأ من الـ root مباشرة
  const certUrl = "/certs/unihub-ca.crt"; 

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-3xl w-full shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">تفعيل الاتصال الآمن</CardTitle>
          <CardDescription className="text-base mt-2">
            لضمان عمل  ( النظام ) بشكل صحيح على الشبكة المحلية، <br />
            يرجى تثبيت شهادة الحماية الخاصة بالنظام.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          
          {/* زر التحميل */}
          <div className="bg-muted/50 p-6 rounded-xl border border-dashed border-primary/30 text-center space-y-4">
            <h3 className="font-semibold text-lg">الخطوة 1: تحميل الشهادة</h3>
            <p className="text-sm text-muted-foreground">اضغط على الزر أدناه لتحميل ملف الشهادة (unihub-ca.crt) إلى جهازك.</p>
            <a href="/certs/unihub-ca.crt" download target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Download className="w-5 h-5" />
                تحميل الشهادة الآن
              </Button>
            </a>
          </div>

          {/* تعليمات التثبيت */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              الخطوة 2: تثبيت الشهادة
            </h3>
            
            <Tabs defaultValue="android" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="android">Android</TabsTrigger>
                <TabsTrigger value="ios">iPhone / iOS</TabsTrigger>
                <TabsTrigger value="windows">Windows</TabsTrigger>
              </TabsList>

              <TabsContent value="android" className="p-4 border rounded-md mt-2 bg-card">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>بعد التحميل، اذهب إلى <strong>الإعدادات (Settings)</strong>.</li>
                  <li>ابحث عن <strong>"الشهادات"</strong> أو <strong>"Certificates"</strong>.</li>
                  <li>اختر <strong>"تثبيت شهادة" (Install Certificate)</strong> ثم <strong>"شهادة CA"</strong>.</li>
                  <li>اختر الملف الذي قمت بتحميله (unihub-ca.crt).</li>
                  <li>اضغط <strong>"تثبيت على أي حال"</strong> إذا طُلب منك ذلك.</li>
                </ol>
              </TabsContent>

              <TabsContent value="ios" className="p-4 border rounded-md mt-2 bg-card">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>بعد التحميل، سيظهر إشعار "تم تنزيل ملف تعريف".</li>
                  <li>اذهب إلى <strong>الإعدادات</strong> {'>'} <strong>تم تنزيل ملف التعريف</strong>.</li>
                  <li>اضغط <strong>تثبيت</strong> (أدخل رمز المرور إذا طُلب).</li>
                  <li><strong>خطوة مهمة جداً:</strong> اذهب إلى الإعدادات {'>'} عام {'>'} حول {'>'} إعدادات ثقة الشهادة.</li>
                  <li>قم بتفعيل الزر بجانب اسم الشهادة (UniHub CA).</li>
                </ol>
              </TabsContent>

              <TabsContent value="windows" className="p-4 border rounded-md mt-2 bg-card">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>افتح ملف الشهادة الذي تم تحميله.</li>
                  <li>اضغط على <strong>"تثبيت الشهادة" (Install Certificate)</strong>.</li>
                  <li>اختر <strong>"جهاز الكمبيوتر المحلي" (Local Machine)</strong>.</li>
                  <li>اختر <strong>"وضع جميع الشهادات في المخزن التالي"</strong>.</li>
                  <li>اضغط "استعراض" واختر <strong>"المراجع المصدقة الجذرية الموثوقة" (Trusted Root Certification Authorities)</strong>.</li>
                  <li>أكمل المعالج واضغط "إنهاء".</li>
                </ol>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex gap-3 items-start border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              بعد التثبيت، قد تحتاج إلى إغلاق المتصفح وإعادة فتحه ليعمل الاتصال بشكل آمن (القفل الأخضر).
            </p>
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Button variant="ghost" onClick={() => navigate('/login')} className="gap-2 text-muted-foreground hover:text-primary">
              العودة إلى تسجيل الدخول
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}