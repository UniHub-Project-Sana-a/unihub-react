import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, Lock, Eye, Server, FileText, ArrowRight, 
  CheckCircle2, AlertTriangle, Key, Users, BookOpen, Smartphone, 
  Printer, Download, ShieldAlert, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans" dir="rtl">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">منصة UniHub الجامعية</h1>
                <p className="text-[11px] text-slate-500">سياسة الخصوصية وأمن المعلومات</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الوثيقة
            </Button>
            <Link to="/login" className="print:hidden">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* ترويسة الصفحة */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200">
          <Badge variant="outline" className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            معايير الحماية المؤسسية للجامعات
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            وثيقة سياسة الخصوصية والأمان الأكاديمي
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            تلتزم منصة UniHub بأعلى المعايير الأكاديمية والتقنية لحماية خصوصية وسرية بيانات الطلاب، 
            المحاضرين، والإداريين، وضمان سلامة وموثوقية كافة المعاملات والجداول الدراسية.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
            <span>الإصدار: 2.4 المؤسسي</span>
            <span>•</span>
            <span>تاريخ السريان: نوفمبر 2026</span>
            <span>•</span>
            <span>حالة الوثيقة: نشطة ومعتمدة</span>
          </div>
        </div>

        {/* 1. المقدمة ونطاق التطبيق */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              1. نطاق التطبيق والالتزام الجامعي
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              تسري هذه السياسة على كافة مستخدمي منصة <strong>UniHub</strong>، بما يشمل:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-600">
              <li><strong>الطلاب:</strong> عند تسجيل المقررات، استعراض الجداول، إثبات الحضور، أو تقييم جودة المقررات.</li>
              <li><strong>أعضاء هيئة التدريس:</strong> عند إدارة المحاضرات، رصد الحضور الذكي بالـ QR، وتدوين كشوف الدرجات.</li>
              <li><strong>القيادات الأكاديمية والإدارية (عمداء، رؤساء أقسام، شؤون أكاديمية، كنترول):</strong> عند إدارة الخطط وتوزيع القاعات.</li>
            </ul>
          </CardContent>
        </Card>

        {/* 2. تصنيف البيانات المجمعة */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Eye className="w-4 h-4 text-blue-600" />
              2. طبيعة وتصنيف البيانات التي نقوم بمعالجتها
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm leading-relaxed text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1.5">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  البيانات التعريفية والأكاديمية
                </h4>
                <p className="text-xs text-blue-800 leading-normal">
                  الاسم الرباعي، الرقم الجامعي، الكلية، القسم، البرنامج، المستوى الدراسي، والمجموعة الطلابية المسند إليها الطالب.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  بيانات الحضور والدرجات الرسمية
                </h4>
                <p className="text-xs text-emerald-800 leading-normal">
                  سجلات الحضور اليومية، سجلات المسح عبر الـ QR، أعذار الغياب المعتمدة، وأعمال الفصل والدرجات النهائية.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-purple-50/60 border border-purple-100 space-y-1.5">
                <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  بيانات الحساب والمصادقة
                </h4>
                <p className="text-xs text-purple-800 leading-normal">
                  البريد الإلكتروني، رقم الهاتف، وكلمات المرور المشفرة خوارزمياً (Bcrypt) دون إمكانية فك تشفيرها حتى من قبل مسؤولي النظام.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-100 space-y-1.5">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  سجلات التدقيق الأمني (Audit Logs)
                </h4>
                <p className="text-xs text-amber-800 leading-normal">
                  عنوان الـ IP، نوع المتصفح والجهاز، وتوقيت الإجراءات الحساسة (إنشاء/تعديل الجداول أو الصلاحيات) لمراقبة الأمان.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. بروتوكولات حماية الـ API والأمان السيبراني */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Server className="w-4 h-4 text-emerald-600" />
              3. البنية التحتية لحماية واجهات الـ API وقواعد البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                <div>
                  <strong className="text-slate-900">عزل مسارات الـ API والمصادقة عبر Sanctum:</strong>
                  <span className="text-slate-600 block text-xs mt-0.5">
                    تعتمد واجهات الـ REST API على رموز Bearer Tokens مشفرة، وتخضع كافة الطلبات للتحقق الصارم من صحة المدخلات (Form Requests).
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                <div>
                  <strong className="text-slate-900">منظومة الصلاحيات المتعددة (Granular RBAC):</strong>
                  <span className="text-slate-600 block text-xs mt-0.5">
                    عزل كامل للبيانات بين الكليات؛ لا يمكن لأي مستخدم من كلية ما استعراض أو تعديل جداول أو طلاب كلية أخرى دون إذن إداري صريح.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</div>
                <div>
                  <strong className="text-slate-900">حظر الوصول المباشر للملفات الحساسة:</strong>
                  <span className="text-slate-600 block text-xs mt-0.5">
                    يتم حظر تنزيل ملفات التكوين والبيئة (.env) وقواعد البيانات الاحتياطية وسجلات الأخطاء على مستوى خادم الويب (.htaccess).
                  </span>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 4. أمان جلسات الحضور والـ QR الديناميكي */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Smartphone className="w-4 h-4 text-purple-600" />
              4. أمان وموثوقية التحضير الذكي عبر الـ QR
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              لمنع التلاعب وتسجيل الحضور بالنيابة في القاعات الدراسية، يطبق النظام القواعد التالية:
            </p>
            <div className="space-y-2 text-xs text-slate-600 pr-2">
              <p>• <strong>التشفير اللحظي والرموز متغيرة الوقت:</strong> يتم تدوير رمز الـ QR كل ثوانٍ معدودة برمز رقمي مشفر غير قابل لإعادة الاستخدام.</p>
              <p>• <strong>التحقق من بصمة الجهاز والشبكة:</strong> منع مسح الطالب لأكثر من زميل من الجهاز نفسه خلال نفس الجلسة.</p>
              <p>• <strong>الاعتماد النهائي من المحاضر:</strong> يملك المحاضر حق مراجعة الكشف لحظياً وتأكيد الحضور أو استبعاد أي طالب مشكوك في تسجيله.</p>
            </div>
          </CardContent>
        </Card>

        {/* 5. سياسة سلة المحذوفات والاحتفاظ بالبيانات */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Award className="w-4 h-4 text-amber-600" />
              5. سلة المحذوفات والوقاية من فقدان البيانات (Data Retention & Soft Delete)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
            <p>
              تطبق المنصة تقنية <strong>الحذف الناعم (Soft Delete)</strong> على الجداول الدراسية، المحاضرات، المجموعات، والطلاب:
            </p>
            <p className="text-xs text-slate-600 leading-normal">
              لا يتم حذف أي محاضرة أو مقرر نهائياً عند النقر على حذف، بل تنتقل إلى <strong>سلة المحذوفات</strong> التابعة للكلية مع الحفاظ على سجل التعارضات لمنع إشغال القاعة حتى يتم تأكيد الحذف النهائي أو استرجاع المحاضرة.
            </p>
          </CardContent>
        </Card>

        {/* 6. الدعم والتواصل الأمني */}
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-blue-50/70 to-indigo-50/70 p-6 text-center space-y-2 shadow-2xs">
          <h4 className="font-bold text-slate-900 text-base">هل لديك استفسار أمني أو ترغب بالإبلاغ عن مشكلة؟</h4>
          <p className="text-xs text-slate-600 max-w-xl mx-auto">
            فريق مركز تقنية المعلومات وأمن البيانات الأكاديمية متاح دائماً لدعم كافة الكليات ومنتسبي الجامعة.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <a href="mailto:security@university.edu.ye" className="text-xs font-bold text-indigo-700 hover:underline">
              security@unihub.edu.ye
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">جامعة صنعاء - كلية الطب والعلوم الصحية</span>
          </div>
        </div>
      </main>

      {/* التذييل */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        <p>© 2026 UniHub. جميع الحقوق محفوظة لجامعة صنعاء وكافة الكليات المتعاقدة.</p>
      </footer>
    </div>
  );
}

