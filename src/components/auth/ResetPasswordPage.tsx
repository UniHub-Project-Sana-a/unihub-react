import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2   } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type PasswordPolicy = {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireLowercase?: boolean; 
  requireSymbols?: boolean;
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken); // تم تصحيح الاسم هنا كان initailToken
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // ✅ التعديل 1: وضع القيم الافتراضية مباشرة كقيمة ابتدائية لتجنب التأخير أو طلب API محظور
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireLowercase: true,
    requireSymbols: false
  });

  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logout } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    // التأكد من عدم وجود جلسة سابقة قد تسبب تضارباً
    logout();
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
  }, []);

  // ❌ تم حذف useEffect الخاص بطلب السياسة (/v1/admin/security/policy)
  // لأنه يسبب 401 و Redirect لأن المستخدم غير مسجل دخول

  const passwordValidations = useMemo(() => {
    if (!policy) return [];
    
    return [
      { 
          text: `على الأقل ${policy.minPasswordLength} أحرف`, 
          valid: newPassword.length >= policy.minPasswordLength 
      },
      policy.requireUppercase && { 
          text: "حرف كبير واحد على الأقل", 
          valid: /[A-Z]/.test(newPassword) 
      },
      (policy.requireLowercase ?? true) && { 
          text: "حرف صغير واحد على الأقل", 
          valid: /[a-z]/.test(newPassword) 
      },
      policy.requireNumbers && { 
          text: "رقم واحد على الأقل", 
          valid: /\d/.test(newPassword) 
      },
      (policy.requireSymbols ?? false) && { 
          text: "رمز واحد على الأقل", 
          valid: /[\W_]/.test(newPassword) 
      },
      { 
          text: "تطابق كلمتي المرور", 
          valid: newPassword === confirmPassword && confirmPassword !== "" 
      },
    ].filter(Boolean) as { text: string; valid: boolean }[];
  }, [newPassword, confirmPassword, policy]);

  const isPasswordValid = useMemo(() => {
    return passwordValidations.every(v => v.valid);
  }, [passwordValidations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    
    // التحقق من صحة البيانات قبل الإرسال
    if (!isPasswordValid) {
        setServerError("يرجى تحقيق جميع شروط كلمة المرور");
        return;
    }
    if (!email || !token) {
        setServerError("رابط تغيير كلمة المرور غير صالح أو ناقص");
        return;
    }

    setIsSubmitting(true);
  
    try {
      // ✅ إرسال طلب تغيير كلمة المرور
      await api.post('/v1/auth/reset-password', {
        email, 
        token, 
        password: newPassword, 
        password_confirmation: confirmPassword
      });
      
      setServerSuccess('تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة الدخول...');
      
      // ✅ الانتظار قليلاً ثم التحويل لصفحة الدخول
      setTimeout(() => navigate('/login'), 2000); 

    } catch (err: any) {
      const msg = err?.response?.data?.errors?.password?.[0] || err?.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور. تأكد من صحة الرابط أو اطلب رابطاً جديداً.';
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
          <CardTitle className="text-2xl font-bold text-foreground">تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-muted-foreground">أدخل كلمة المرور الجديدة لحساب: {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
          {serverSuccess && <Alert className="bg-green-50 text-green-700 border-green-200"><AlertDescription>{serverSuccess}</AlertDescription></Alert>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* تم إخفاء حقل الإيميل لأنه يأتي من الرابط ولا يجب تعديله يدوياً عادة */}
            <input type="hidden" value={email} />

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

            {/* عرض شروط كلمة المرور */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-md">
              <p className="text-sm font-medium text-foreground mb-2">الشروط المطلوبة:</p>
              {passwordValidations.map((v, i) => (
                <div key={i} className="flex items-center space-x-2">
                  {v.valid ? <CheckCircle size={14} className="text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />}
                  <span className={`text-xs ${v.valid ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}>{v.text}</span>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !isPasswordValid}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> جاري الحفظ...</> : 'تغيير كلمة المرور'}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary hover:underline">العودة لتسجيل الدخول</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;