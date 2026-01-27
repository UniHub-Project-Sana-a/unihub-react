import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // 1. استيراد useNavigate
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoFull from "@/assets/logo-full.png";
import { api } from "@/lib/api";
import { Eye, EyeOff, CheckCircle, XCircle, MailCheck } from "lucide-react"; 

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate(); // 2. تعريف الهوك

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
     const res = await api.post("/v1/auth/forgot-password", { email });
      
      setIsSubmitted(true);

      // ✅ الآن الباك إند سيرسل التوكن، فسيتحقق الشرط ويتم التوجيه
      // if (res.data?.token) {
      //   // توجيه مباشر وسريع
      //   navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.data.token)}`);
      // } else {
      //   // في حالة لم يرجع التوكن (مثلاً إيميل غير موجود)
      //   setError("لم يتم إرجاع رمز التحقق، تأكد من صحة البريد الإلكتروني.");
      // }

    } catch (err: any) {
      const msg = err?.response?.data?.message || "حدث خطأ أثناء إرسال طلب الاسترجاع.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2">
            <img src={logoFull} alt="UniHub" className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            هل نسيت كلمة المرور؟
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            أدخل بريدك الإلكتروني لاستلام رابط/رمز إعادة التعيين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "جارٍ الإرسال..." : "إرسال رابط/رمز إعادة التعيين"}
              </Button>
            </form>
          ) : (
                        // ✅ الواجهة الجديدة عند النجاح
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-sm">
                  <MailCheck className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">تحقق من بريدك الإلكتروني</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  لقد أرسلنا تعليمات إعادة تعيين كلمة المرور إلى:
                  <br />
                  <span className="font-semibold text-primary block mt-1">{email}</span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-xs text-muted-foreground">
                لم يصلك البريد؟ تأكد من مجلد الرسائل غير المرغوب فيها (Spam) أو حاول مرة أخرى لاحقاً.
              </div>

              
            </div>
          )}

          <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button variant="outline" className="w-full border-primary/20 hover:border-primary hover:bg-primary/5">
                    العودة إلى صفحة تسجيل الدخول
                  </Button>
                </Link>
              </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;