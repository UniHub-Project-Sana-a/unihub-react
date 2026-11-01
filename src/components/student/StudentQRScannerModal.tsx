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
  HelpCircle,
  Upload,
  Sparkles,
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
  const scanIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

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

  // 2. إرسال رمز الـ QR مع الموقع الجغرافي للباك إند
  const handleVerifyQR = async (qrValue: string) => {
    if (!qrValue || !qrValue.trim()) return;

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
        stopScanningLoop();
        stopCamera();
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

  // 3. مسح الفيديو التلقائي عبر BarcodeDetector
  const startScanningLoop = () => {
    stopScanningLoop();
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        setIsScanningActive(true);
        scanIntervalRef.current = setInterval(async () => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= 2 &&
            !isSubmitting &&
            !scanResult
          ) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const detectedCode = barcodes[0].rawValue;
                stopScanningLoop();
                if (navigator.vibrate) {
                  try { navigator.vibrate(100); } catch (_) {}
                }
                handleVerifyQR(detectedCode);
              }
            } catch (_) {}
          }
        }, 300);
      } catch (e) {
        console.warn("BarcodeDetector error:", e);
      }
    }
  };

  const stopScanningLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanningActive(false);
  };

  // 4. تشغيل الكاميرا المباشرة
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
      startScanningLoop();
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("تعذر تشغيل الكاميرا أو تم رفض الإذن. يرجى منح الإذن للكاميرا أو التقاط صورة للرمز.");
      setHasCamera(false);
    }
  };

  // 5. إيقاف الكاميرا
  const stopCamera = () => {
    stopScanningLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 6. مسح رمز من صورة ملتقطة بالكاميرا
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const imageBitmap = await createImageBitmap(file);
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await barcodeDetector.detect(imageBitmap);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          handleVerifyQR(barcodes[0].rawValue);
          return;
        }
      } catch (err) {
        console.warn("Barcode image detection error:", err);
      }
    }

    toast({
      title: "تعذر قراءة الرمز تلقائياً",
      description: "يرجى توجيه الكاميرا مباشرة نحو رمز الـ QR المعروض على شاشة الدكتور والمحاولة مرة أخرى.",
      variant: "destructive",
    });
  };

  useEffect(() => {
    if (open) {
      setScanResult(null);
      acquireLocation();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

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
            <div className="space-y-4 py-4 text-center animate-in fade-in zoom-in-95 duration-300">
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

              {/* التنبيه بالأسئلة التفاعلية المرفقة */}
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-right space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>توجد أسئلة تفاعلية مرفقة بهذه المحاضرة!</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  يمكنك الإجابة على أسئلة المحاضرة الآن أو قبل انتهاء موعد المحاضرة من بطاقة المحاضرة في جدولك الدراسي.
                </p>
              </div>

              <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                متابعة إلى لوحة المحاضرات والأسئلة
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
                  <Compass className={`w-4 h-4 shrink-0 ${isGettingGps ? "animate-spin" : "animate-pulse"}`} />
                  <div>
                    {isGettingGps ? (
                      <span className="font-medium">جاري تحديد موقعك الجغرافي عبر GPS...</span>
                    ) : gpsLocation ? (
                      <span className="font-medium">
                        تم رصد موقعك: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)} (دقة: {gpsLocation.accuracy}م)
                      </span>
                    ) : (
                      <span className="font-medium">{gpsError || "الموقع الجغرافي مطلوب للتحضير"}</span>
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
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-500/80 rounded-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                      </div>
                    </div>

                    {isSubmitting && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs font-semibold text-foreground">جاري توثيق الحضور والتحقق من القاعة...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-muted-foreground space-y-3">
                    <Camera className="w-10 h-10 mx-auto text-muted-foreground/50" />
                    <p className="text-xs leading-relaxed">{cameraError || "جاري تهيئة الكاميرا..."}</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={startCamera} className="text-xs h-8">
                        إعادة فتح الكاميرا
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8 gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        التقاط صورة للـ QR
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions and Photo Fallback */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  وجّه الكاميرا نحو رمز QR على شاشة القاعة ليتم المسح تلقائياً
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageCapture}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] h-7 gap-1 text-primary hover:bg-primary/5"
                >
                  <Camera className="w-3 h-3" />
                  التقاط صورة
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
