import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { api } from "@/lib/api";

type PasswordPolicy = {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
};

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
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);

  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get("/v1/admin/security/policy");
        setPolicy(res.data?.password);
      } catch {
        setPolicy({ min_length: 8, require_uppercase: true, require_lowercase: true, require_numbers: true, require_symbols: false });
      }
    };
    fetchPolicy();
  }, []);

  const passwordValidations = useMemo(() => {
    if (!policy) return [];
    return [
      { text: `على الأقل ${policy.min_length} أحرف`, valid: newPassword.length >= policy.min_length },
      policy.require_uppercase && { text: "حرف كبير واحد على الأقل", valid: /[A-Z]/.test(newPassword) },
      policy.require_lowercase && { text: "حرف صغير واحد على الأقل", valid: /[a-z]/.test(newPassword) },
      policy.require_numbers && { text: "رقم واحد على الأقل", valid: /\d/.test(newPassword) },
      policy.require_symbols && { text: "رمز واحد على الأقل", valid: /[\W_]/.test(newPassword) },
      { text: "تطابق كلمتي المرور", valid: newPassword === confirmPassword && confirmPassword !== "" },
    ].filter(Boolean) as { text: string; valid: boolean }[];
  }, [newPassword, confirmPassword, policy]);

  const isPasswordValid = useMemo(() => {
    return passwordValidations.every(v => v.valid);
  }, [passwordValidations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    if (!isPasswordValid || !email || !token) return;
    setIsSubmitting(true);

    try {
      await api.post('/v1/auth/reset-password', {
        email, token, password: newPassword, password_confirmation: confirmPassword
      });
      setServerSuccess('تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة الدخول...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.password?.[0] || err?.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2"><img src={logoFull} alt="UniHub" className="h-16 w-auto mx-auto" /></div>
          <CardTitle className="text-2xl font-bold text-foreground">قم بتعيين كلمة المرور الجديدة</CardTitle>
          <CardDescription className="text-muted-foreground">يجب تغيير كلمة المرور قبل استخدام النظام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
          {serverSuccess && <Alert><AlertDescription>{serverSuccess}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">رمز إعادة التعيين (token)</Label>
              <Input id="token" type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">متطلبات كلمة المرور:</p>
              {passwordValidations.length === 0 ? <p className="text-xs text-muted-foreground">جارٍ تحميل السياسة...</p> : passwordValidations.map((v, i) => (
                <div key={i} className="flex items-center space-x-2">
                  {v.valid ? <CheckCircle size={16} className="text-accent" /> : <XCircle size={16} className="text-destructive" />}
                  <span className={`text-sm ${v.valid ? 'text-accent' : 'text-destructive'}`}>{v.text}</span>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !isPasswordValid}>
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