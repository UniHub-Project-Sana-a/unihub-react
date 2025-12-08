import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { api } from "@/lib/api";

type PasswordPolicy = {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
};

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
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

  const isPasswordValid = useMemo(() => passwordValidations.every(v => v.valid), [passwordValidations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword === '12345678') {
        setError('لا يمكن استخدام كلمة المرور الافتراضية، يرجى اختيار كلمة مرور قوية.');
        return;
    }

    if (!isPasswordValid) return;
    setIsSubmitting(true);
  
    try {
      await api.post('/v1/auth/change-password', {
        password: newPassword, 
        password_confirmation: confirmPassword
      });

      setSuccess('تم تحديث كلمة المرور بنجاح! جاري تحويلك...');
      setTimeout(() => navigate('/'), 2000);

    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء تحديث كلمة المرور.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      {/* 👇 هنا التعديل: إطار علوي عريض باللون الرئيسي */}
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-card backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2">
            <img src={logoFull} alt="UniHub" className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            تغيير كلمة المرور إلزامي
          </CardTitle>
          <CardDescription>
            لأسباب أمنية، يجب عليك تغيير كلمة المرور الافتراضية قبل المتابعة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="bg-green-50 text-green-800 border-green-200"><AlertDescription>{success}</AlertDescription></Alert>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-3">متطلبات الأمان:</p>
              <div className="grid grid-cols-1 gap-2">
                {passwordValidations.map((v, i) => (
                    <div key={i} className="flex items-center space-x-2 space-x-reverse">
                    {v.valid ? <CheckCircle size={15} className="text-primary" /> : <div className="w-[15px] h-[15px] rounded-full border border-muted-foreground/30" />}
                    <span className={`text-xs ${v.valid ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{v.text}</span>
                    </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !isPasswordValid}>
              {isSubmitting ? 'جارٍ التحديث...' : 'حفظ ومتابعة'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;