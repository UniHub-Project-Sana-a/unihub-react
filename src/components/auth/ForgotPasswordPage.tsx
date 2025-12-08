import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // 1. استيراد useNavigate
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoFull from "@/assets/logo-full.png";

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
      const res = await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/forgot-password", // تأكد من الرابط
        { email },
        { headers: { Accept: "application/json" } }
      );
      
      setIsSubmitted(true);

      // ✅ الآن الباك إند سيرسل التوكن، فسيتحقق الشرط ويتم التوجيه
      if (res.data?.token) {
        // توجيه مباشر وسريع
        navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.data.token)}`);
      } else {
        // في حالة لم يرجع التوكن (مثلاً إيميل غير موجود)
        setError("لم يتم إرجاع رمز التحقق، تأكد من صحة البريد الإلكتروني.");
      }

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
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  تم إرسال الطلب بنجاح!
                </p>
                <p className="text-sm text-green-700 mt-2">
                  جاري تحويلك لصفحة تعيين كلمة المرور...
                </p>
              </div>
              {/* Spinner loader */}
              <div className="flex justify-center mt-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 text-sm font-medium underline-offset-4 hover:underline"
            >
              الرجوع إلى تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;