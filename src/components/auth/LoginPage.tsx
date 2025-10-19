import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoFull from "@/assets/logo-full.png";

const users = [
  { username: 'admin', password: '123', role: 'admin', redirect: '/dashboard/admin' },
  { username: 'academic', password: '123', role: 'academic', redirect: '/dashboard/academic' },
  { username: 'department', password: '123', role: 'department', redirect: '/dashboard/department' },
  { username: 'schedule', password: '123', role: 'schedule', redirect: '/dashboard/schedule' },
  { username: 'control', password: '123', role: 'control', redirect: '/dashboard/control' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Store session info if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
      }
      
      // Store current user session
      sessionStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        role: user.role
      }));
      
      // Redirect to appropriate dashboard
      window.location.href = user.redirect;
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى.');
    }
    
    setIsLoading(false);
  };

  // Load remembered user on component mount
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setUsername(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* University Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logoFull} alt="UniHub" className="h-20 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة إدارة الجامعة</h1>
          <p className="text-muted-foreground mt-1">نظام إدارة الشؤون الأكاديمية</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border border-border/50 bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center text-foreground">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بيانات الدخول للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="py-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
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

              {/* Remember Me */}
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

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center mt-6">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                هل نسيت كلمة المرور؟
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Test Credentials Info */}
        <Card className="mt-6 bg-muted/30 border-muted">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
              بيانات الدخول التجريبية:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>المشرف:</span>
                <span>admin / 123</span>
              </div>
              <div className="flex justify-between">
                <span>الأكاديمي:</span>
                <span>academic / 123</span>
              </div>
              <div className="flex justify-between">
                <span>القسم:</span>
                <span>department / 123</span>
              </div>
              <div className="flex justify-between">
                <span>الجدول:</span>
                <span>schedule / 123</span>
              </div>
              <div className="flex justify-between">
                <span>الكنترول:</span>
                <span>control / 123</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}