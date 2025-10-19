import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const validatePassword = () => {
    const validationErrors = [];
    
    if (newPassword.length < 6) {
      validationErrors.push("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
    }
    
    if (newPassword !== confirmPassword) {
      validationErrors.push("كلمتا المرور غير متطابقتين");
    }
    
    return validationErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors([]);
    // محاكاة نجاح تغيير كلمة المرور وإعادة التوجيه إلى لوحة التحكم
    // في التطبيق الحقيقي، سيتم تحديث كلمة مرور المستخدم
    navigate("/");
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
          <CardTitle className="text-2xl font-bold text-foreground">
            قم بتعيين كلمة المرور الجديدة
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            يجب تغيير كلمة المرور قبل استخدام النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Password Validation Indicators */}
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

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                {errors.map((error, index) => (
                  <p key={index} className="text-destructive text-sm">{error}</p>
                ))}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={validatePassword().length > 0}
            >
              حفظ كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;