import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialToken) setToken(initialToken);
  }, [initialEmail, initialToken]);

  const validatePassword = () => {
    const validationErrors: string[] = [];
    if (!email) validationErrors.push("البريد الإلكتروني مطلوب.");
    if (!token) validationErrors.push("رمز إعادة التعيين (token) مطلوب.");
    if (newPassword.length < 6) validationErrors.push("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
    if (newPassword !== confirmPassword) validationErrors.push("كلمتا المرور غير متطابقتين");
    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    const validationErrors = validatePassword();
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    setErrors([]);
    setIsSubmitting(true);

    try {
      await axios.post('/api/v1/auth/reset-password', {
        email,
        token,
        password: newPassword,
        password_confirmation: confirmPassword
      }, { headers: { Accept: 'application/json' } });

      setServerSuccess('تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة الدخول...');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordValidations = [
    { text: "على الأقل 6 أحرف", valid: newPassword.length >= 6 },
    { text: "تطابق كلمتي المرور", valid: newPassword === confirmPassword && confirmPassword !== "" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2">
            <img src={logoFull} alt="UniHub" className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">قم بتعيين كلمة المرور الجديدة</CardTitle>
          <CardDescription className="text-muted-foreground">
            يجب تغيير كلمة المرور قبل استخدام النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          {serverSuccess && (
            <Alert>
              <AlertDescription>{serverSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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

            {/* Token */}
            <div className="space-y-2">
              <Label htmlFor="token">رمز إعادة التعيين (token)</Label>
              <Input
                id="token"
                type="text"
                placeholder="الصق الرمز هنا (إن لم يمتلئ تلقائياً)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              {initialToken && (
                <p className="text-xs text-muted-foreground">
                  تم جلب الرمز تلقائياً من الرابط.
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة مرور جديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="أكّد كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password rules */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">متطلبات كلمة المرور:</p>
              {passwordValidations.map((validation, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {validation.valid ? (
                    <CheckCircle size={16} className="text-accent" />
                  ) : (
                    <XCircle size={16} className="text-destructive" />
                  )}
                  <span className={`text-sm ${validation.valid ? 'text-accent' : 'text-destructive'}`}>
                    {validation.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Client-side validation errors */}
            {errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                {errors.map((error, index) => (
                  <p key={index} className="text-destructive text-sm">{error}</p>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || validatePassword().length > 0}>
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-primary hover:underline">العودة لتسجيل الدخول</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;