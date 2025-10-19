import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoFull from "@/assets/logo-full.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
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
            أدخل بريدك الإلكتروني أو اسم المستخدم لاستلام رابط إعادة التعيين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني أو اسم المستخدم</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="أدخل بريدك الإلكتروني أو اسم المستخدم"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                إرسال رابط إعادة التعيين
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-accent/20 border border-accent rounded-lg">
                <p className="text-foreground font-medium">
                  إذا كان هذا الحساب موجودًا، سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
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