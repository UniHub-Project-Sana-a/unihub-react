import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoFull from "@/assets/logo-full.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // جديد: عرض الرمز القادم من الـ API + التحميل + الأخطاء
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsSubmitted(false);
    setToken(null);
    setIsLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/forgot-password",
        { email },
        { headers: { Accept: "application/json" } }
      );
      setIsSubmitted(true);

      // في بيئة التطوير قد يعيد الـ API token لسهولة الاختبار
      if (res.data?.token) setToken(res.data.token);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "حدث خطأ أثناء إرسال طلب الاسترجاع.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
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
            <div className="space-y-4">
              <div className="p-4 bg-accent/20 border border-accent rounded-lg text-center">
                <p className="text-foreground font-medium">
                  إذا كان هذا الحساب موجودًا، سيتم إرسال رابط/رمز إعادة التعيين إلى بريدك الإلكتروني.
                </p>
              </div>

              {/* عرض الرمز المُرجع من الـ API لسهولة الاختبار قبل تفعيل SMTP */}
              {token && (
                <div className="p-3 border rounded-md bg-muted/30 space-y-3">
                  <p className="text-sm">الرمز (token) لاستخدامه في صفحة إعادة التعيين:</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={token} className="font-mono text-xs" />
                    <Button type="button" variant="secondary" onClick={handleCopy}>
                      {copied ? "تم النسخ" : "نسخ"}
                    </Button>
                  </div>
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link to={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`}>
                      الانتقال لتعيين كلمة المرور
                    </Link>
                  </Button>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور.
              </p>
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