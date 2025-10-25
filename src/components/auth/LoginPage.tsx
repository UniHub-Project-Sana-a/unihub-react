import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoFull from "@/assets/logo-full.png";
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as any)?.from?.pathname;
  const nextQuery = new URLSearchParams(location.search).get("next");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/v1/auth/login', {
        email: username,
        password,
        mac_address: "web-device", // قيمة افتراضية
        device_name: "Web Browser", // قيمة افتراضية
        os_type: "web", // قيمة افتراضية
      });
      const token = res.data?.access_token;
      if (!token) throw new Error('No token');
      
      await login(token, rememberMe);

      if (rememberMe) localStorage.setItem('rememberedUser', username);
      else localStorage.removeItem('rememberedUser');

      const target = nextQuery || fromState || '/';
      navigate(target, { replace: true });
    } catch (err) {
      setError('بيانات الدخول غير صحيحة أو حدث خطأ بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // لا حاجة لـ clearToken هنا
    navigate('/forgot-password');
  };

  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setUsername(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logoFull} alt="UniHub" className="h-20 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة إدارة الجامعة</h1>
          <p className="text-muted-foreground mt-1">نظام العام  </p>
        </div>

        <Card className="shadow-2xl border border-border/50 bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center text-foreground">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">أدخل بيانات الدخول للوصول إلى النظام</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">البريد الإلكتروني</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  تذكرني
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Button variant="link" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
                هل نسيت كلمة المرور؟
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-muted/30 border-muted">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
              بيانات الدخول التجريبية:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>المشرف:</span>
                <span>admin@unihub.test / Admin@12345</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}