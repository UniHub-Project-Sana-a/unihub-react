import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, KeyRound } from 'lucide-react';
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
  // حالات تسجيل الدخول
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // حالات OTP
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationData, setVerificationData] = useState<any>(null);

  // حالات عامة
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDeviceDetails = async (): Promise<{ mac_address: string; device_name: string; os_type: string }> => {
    // ... (نفس دالة getDeviceDetails، لا تغيير)
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
  
      // إذا كان الجهاز غير معروف، سيطلب الخادم OTP
      if (res.data?.otp_required) {
        setVerificationData(res.data); // خزّن البيانات المؤقتة (مثل user_id, device_name)
        setShowOtpForm(true);
        setIsLoading(false);
        return;
      }
  
      const token = res.data?.access_token;
      if (!token) throw new Error('No token returned from server');
      
      // إذا لم يكن OTP مطلوباً، أكمل كالسابق
      await finalizeLogin(token);

    } catch (err: any) {
      const msg = err?.response?.data?.message || 'بيانات الدخول غير صحيحة أو حدث خطأ بالخادم.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      // تأكد من أن verificationData ليس null
      if (!verificationData || !verificationData.verification_id) {
        throw new Error("بيانات التحقق غير متوفرة. الرجاء المحاولة مرة أخرى.");
      }
  
      // أرسل OTP والبيانات المؤقتة بشكل صريح
      const res = await api.post('/v1/auth/verify-otp', {
        verification_id: verificationData.verification_id, // أرسل الـ ID
        otp_code: otp,
      });
  
      const token = res.data?.access_token;
      if (!token) throw new Error('فشل التحقق من الرمز أو لم يتم إرجاع التوكن.');
  
      await finalizeLogin(token);
  
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'رمز التحقق غير صحيح.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeLogin = async (token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  
    let target = '/';
    try {
      const meRes = await api.get('/v1/auth/me');
      const meRaw = meRes.data?.data ?? meRes.data ?? {};
      const me = meRaw.user ?? meRaw;
      const userTypeCode = me?.user_type?.user_type_code || me?.user_type_code || null;
      if (userTypeCode === 'lecturer') {
        target = '/lecturer';
      }
    } catch (meError) {
      console.error("Failed to fetch user details, redirecting to default path:", meError);
    }

    login(token, rememberMe);

    const from = new URLSearchParams(location.search).get("from") || location.state?.from?.pathname || target;
    navigate(from, { replace: true });

    if (rememberMe) {
      localStorage.setItem('rememberedUser', email);
    } else {
      localStorage.removeItem('rememberedUser');
    }
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
          {showOtpForm ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">التحقق بخطوتين</CardTitle>
                <CardDescription className="text-center">
                  لقد أرسلنا رمز تحقق إلى بريدك الإلكتروني. الرجاء إدخاله أدناه.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-3">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="otp">رمز التحقق</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="أدخل الرمز المكون من 6 أرقام"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 text-center tracking-widest"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'جاري التحقق...' : 'تحقق'}
                  </Button>
                  <Button variant="link" className="w-full" onClick={() => setShowOtpForm(false)}>
                    العودة لتسجيل الدخول
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">تذكرني</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Button>
                </form>
                <div className="text-center mt-6">
                  <Button variant="link" onClick={() => navigate('/forgot-password')} className="text-sm text-primary hover:underline">
                    هل نسيت كلمة المرور؟
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}