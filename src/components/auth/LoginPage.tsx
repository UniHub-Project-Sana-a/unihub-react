import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoFull from "@/assets/366544.png";
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { getCollegeLandingPath } from '@/lib/collegeAccess';

export default function LoginPage() {
  // حالات تسجيل الدخول
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // حالات عامة
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // استرجاع الإيميل
    const savedEmail = localStorage.getItem('rememberedUser');
    // استرجاع حالة الـ Checkbox
    const savedState = localStorage.getItem('rememberMeState');

    if (savedEmail) {
      setEmail(savedEmail);
    }
    
    if (savedState === 'true') {
      setRememberMe(true);
    }
  }, []);

  const getDeviceDetails = async (): Promise<{ mac_address: string; device_name: string; os_type: string }> => {
    const detectOS = () => (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown OS';
    const detectBrowser = () => {
      const ua = navigator.userAgent;
      if (/Edg/i.test(ua)) return 'Edge';
      if (/OPR|Opera/i.test(ua)) return 'Opera';
      if (/Chrome/i.test(ua)) return 'Chrome';
      if (/Safari/i.test(ua)) return 'Safari';
      if (/Firefox/i.test(ua)) return 'Firefox';
      if (/MSIE|Trident/i.test(ua)) return 'IE';
      return 'Unknown Browser';
    };
  
    const os = detectOS();
    const browser = detectBrowser();
  
    const cached = localStorage.getItem('device_fp');
    if (cached) {
      return { mac_address: cached, device_name: `${os} - ${browser}`, os_type: 'web' };
    }
  
    try {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      localStorage.setItem('device_fp', visitorId);
      return { mac_address: visitorId, device_name: `${os} - ${browser}`, os_type: 'web' };
    } catch (e) {
      const fallback = `FP-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      localStorage.setItem('device_fp', fallback);
      console.warn('Fingerprint fallback used:', fallback);
      return { mac_address: fallback, device_name: `${os} - ${browser}`, os_type: 'web' };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const deviceDetails = await getDeviceDetails();
      const res = await api.post('/v1/auth/login', {
        email,
        password,
        ...deviceDetails,
      });
  
      // 1. التحقق من فرض تغيير كلمة المرور
      if (res.data?.require_password_change) {
         const tempToken = res.data.access_token;
         
         api.defaults.headers.common.Authorization = `Bearer ${tempToken}`;
         localStorage.setItem('token', tempToken); 

         navigate('/change-password', { 
           state: { 
             message: res.data.message,
             mustChange: true 
           } 
         });
         
         setIsLoading(false);
         return;
      }

      const token = res.data?.access_token;
      if (!token) throw new Error('No token returned from server');
      
      // 2. إكمال الدخول الطبيعي المباشر
      await finalizeLogin(token);

    } catch (err: any) {
      if (err?.response?.data?.error_code === 'STUDENT_LOGIN_FORBIDDEN') {
        setError(err.response.data.message);
      } else {
        const msg = err?.response?.data?.message || 'بيانات الدخول غير صحيحة أو حدث خطأ بالخادم.';
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  const finalizeLogin = async (token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  
    try {
      const meRes = await api.get('/v1/auth/me');
      
      const responseData = meRes.data;
      const userObj = responseData?.data?.user || responseData?.data || responseData?.user || responseData;
      
      const role = userObj?.user_type?.user_type_code || userObj?.user_type_code || '';
      const collegeId = userObj?.college_id;

      let destination = '/dashboard';

      if (role === 'student') {
          destination = '/student/portal';
      } 
      else {
          let defaultPath = '/dashboard';
          
          if (role === 'lecturer') {
              defaultPath = '/lecturer';
          } else if (role === 'presidency' || role === 'admin') {
              defaultPath = '/';
          } else if (collegeId) {
              defaultPath = getCollegeLandingPath(collegeId, userObj?.permissions ?? []);
          }

          const previousPath = location.state?.from?.pathname;
          destination = (previousPath && previousPath !== '/login') ? previousPath : defaultPath;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      await login(token, rememberMe);

      setTimeout(() => {
          navigate(destination, { replace: true });
      }, 0);

      if (rememberMe) {
        localStorage.setItem('rememberedUser', email);
        localStorage.setItem('rememberMeState', 'true');
      } else {
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberMeState');
      }
      
    } catch (error) {
      console.error("Login Error:", error);
      setError("فشل التحقق من بيانات المستخدم.");
      localStorage.removeItem('token');
      api.defaults.headers.common.Authorization = '';
    } finally {
      setIsLoading(false);
    }
  };

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
                    id="email" type="email" placeholder="أدخل البريد الإلكتروني"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10" required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"} placeholder="أدخل كلمة المرور"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10" required
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
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="remember"
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">تذكرني</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
            <div className="text-center mt-6 space-y-2">
              <Button variant="link" onClick={() => navigate('/forgot-password')} className="text-sm text-primary hover:underline">
                هل نسيت كلمة المرور؟
              </Button>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Button variant="link" onClick={() => navigate('/privacy')} className="text-xs text-slate-500 hover:text-slate-800 p-0 h-auto">
                  سياسة الخصوصية والأمان
                </Button>
                <span>•</span>
                <span>نظام UniHub الجامعي</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}