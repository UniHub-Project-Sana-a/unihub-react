import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Compass,
  Building,
  User,
  Clock,
  XCircle,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function StudentQRScannerModal({ open, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<any | null>(null);

  // 1. طلب الموقع الجغرافي (GPS Geolocation)
  const acquireLocation = () => {
    setIsGettingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("متصفحك لا يدعم خاصية تحديد الموقع الجغرافي.");
      setIsGettingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
        });
        setIsGettingGps(false);
      },
      (err) => {
        let msg = "تعذر الحصول على موقعك الجغرافي.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "تم رفض إذن الوصول للموقع. يرجى تفعيل الـ GPS في إعدادات جهازك/المتصفح والمحاولة مجدداً.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "إشارة الـ GPS غير متاحة حالياً، يرجى التأكد من تشغيل خدمات الموقع.";
        }
        setGpsError(msg);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 2. تشغيل الكاميرا المباشرة
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("الكاميرا غير مدعومة في هذا المتصفح.");
        setHasCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("تعذر تشغيل الكاميرا أو تم رفض الإذن. يمكنك إدخال الرمز يدوياً أدناه.");
      setHasCamera(false);
    }
  };

  // 3. إيقاف الكاميرا
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      setScanResult(null);
      setManualCode("");
      acquireLocation();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  // 4. إرسال رمز الـ QR مع الموقع الجغرافي للباك إند
  const handleVerifyQR = async (qrValue: string) => {
    if (!qrValue.trim()) {
      toast({
        title: "رمز غير مدخل",
        description: "يرجى توجيه الكاميرا إلى الرمز أو كتابة كود الـ QR.",
        variant: "destructive",
      });
      return;
    }

    if (!gpsLocation) {
      toast({
        title: "الموقع الجغرافي مطلوب",
        description: "يجب تحديد موقعك الجغرافي عبر GPS أولاً للتحقق من وجودك داخل القاعة.",
        variant: "destructive",
      });
      acquireLocation();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/v1/student/scan-qr", {
        qr_code_value: qrValue.trim(),
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lng,
      });

      if (res.data?.status) {
        setScanResult(res.data);
        toast({
          title: "تم التحضير بنجاح! 🎉",
          description: res.data.message || "تم تسجيل حضورك في المحاضرة بنجاح.",
        });
        if (onSuccess) onSuccess(res.data);
      }
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.is_out_of_range) {
        toast({
          title: "خارج نطاق القاعة الدراسية! ⛔",
          description: data.message || `المسافة المقدرة: ${data.distance} متر، والحد الأقصى هو ${data.allowed_distance} متر.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل تسجيل الحضور",
          description: data?.message || "رمز الـ QR غير صالح أو أن الجلسة منتهية.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="p-6 pb-3 bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              مسح رمز الـ QR للتحضير الذكي
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              وجّه كاميرا هاتفك نحو رمز الاستجابة السريعة المعروض على شاشة الدكتور مع التأكد من تشغيل الـ GPS.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Success Result View */}
          {scanResult ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {scanResult.message || "تم تسجيل الحضور بنجاح"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  تم توثيق الحضور والتحقق من الموقع الجغرافي بالقاعة.
                </p>
              </div>

              {scanResult.data && (
                <div className="bg-muted/40 rounded-xl p-4 text-xs text-right space-y-2 border">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" /> المقرر والقاعة:
                    </span>
                    <span className="font-semibold text-foreground">
                      {scanResult.data.course_name} ({scanResult.data.classroom})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> أستاذ المقرر:
                    </span>
                    <span className="font-semibold text-foreground">{scanResult.data.lecturer_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> دقة النطاق:
                    </span>
                    <span className="font-semibold text-emerald-600">{scanResult.data.distance}</span>
                  </div>
                </div>
              )}

              <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
                إتمام وإغلاق
              </Button>
            </div>
          ) : (
            <>
              {/* GPS Geofencing Status Pill */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  gpsLocation
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : gpsError
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 shrink-0 animate-pulse" />
                  <div>
                    {isGettingGps ? (
                      <span className="font-medium">جاري تحديد موقعك الجغرافي عبر GPS...</span>
                    ) : gpsLocation ? (
                      <span className="font-medium">
                        تم رصد موقعك: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)} (دقة: {gpsLocation.accuracy}م)
                      </span>
                    ) : (
                      <span className="font-medium">{gpsError || "الموقع الجغرافي مطلوب"}</span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={acquireLocation}
                  disabled={isGettingGps}
                  className="h-7 text-xs px-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGettingGps ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Live Camera Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-border/80 shadow-inner">
                {hasCamera ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    {/* Laser Scanner Frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-primary/80 rounded-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-muted-foreground space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-muted-foreground/50" />
                    <p className="text-xs">{cameraError || "جاري تهيئة الكاميرا..."}</p>
                    <Button variant="outline" size="sm" onClick={startCamera} className="text-xs h-8">
                      إعادة محاولة فتح الكاميرا
                    </Button>
                  </div>
                )}
              </div>

              {/* Manual Code Entry Fallback */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-medium text-foreground block">
                  أو أدخل كود الجلسة / الرمز يدوياً (للاختبار السريع):
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="الصق كود الـ QR المعروض..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="text-xs font-mono"
                    dir="ltr"
                  />
                  <Button
                    onClick={() => handleVerifyQR(manualCode)}
                    disabled={isSubmitting || !manualCode.trim() || !gpsLocation}
                    className="gap-1.5 shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>تأكيد الحضور</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
