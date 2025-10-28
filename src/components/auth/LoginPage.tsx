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
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
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

  const getDeviceDetails = async (): Promise<{ mac_address: string; device_name: string; os_type: string; }> => {
    const fpPromise = FingerprintJS.load();
    const fp = await fpPromise;
    const result = await fp.get();
    const visitorId = result.visitorId;
    
    const os = window.navigator.platform;
    const browser = window.navigator.userAgent.split(') ')[0].split(' (')[1] || 'Unknown Browser';
  
    return {
      mac_address: visitorId,
      device_name: `${os} - ${browser}`,
      os_type: "web",
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const deviceDetails = await getDeviceDetails();
      const res = await api.post('/v1/auth/login', {
        email: email,
        password: password,
        ...deviceDetails,
      });
      const token = res.data?.access_token;
      if (!token) throw new Error('No token returned from server');
      
      login(token, rememberMe);
  
      if (rememberMe) localStorage.setItem('rememberedUser', email);
      else localStorage.removeItem('rememberedUser');
  
      const target = nextQuery || fromState || '/';
      navigate(target, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'بيانات الدخول غير صحيحة أو حدث خطأ بالخادم.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setEmail(rememberedUser);
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
          <h1 className="text-2xl font-bold text-foreground"> نظام التحضير الاكاديمي ومراقبة الأداء </h1>
          <p className="text-muted-foreground mt-1">النظام العام  </p>
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
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
      </div>
    </div>
  );
}