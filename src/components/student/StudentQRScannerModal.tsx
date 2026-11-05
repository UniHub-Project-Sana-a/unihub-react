import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  HelpCircle,
  Sparkles,
  Send,
  Check,
  Zap,
} from "lucide-react";

interface InteractiveQuestion {
  id: number;
  question: string;
  type?: string;
  options?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  activeLecture?: any;
}

export default function StudentQRScannerModal({ open, onClose, onSuccess, activeLecture }: Props) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Modal Flow Step: 'scan' | 'questions' | 'success'
  const [modalStep, setModalStep] = useState<"scan" | "questions" | "success">("scan");

  // Camera & GPS States
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Interactive Questions States
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

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

  // 2. التحقق من كود الـ QR
  const handleVerifyQR = async (qrValue: string) => {
    if (!qrValue || !qrValue.trim() || isSubmitting) return;

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

        const questions: InteractiveQuestion[] = res.data?.data?.interactive_questions || [];
        const hasAnswered: boolean = Boolean(res.data?.data?.has_answered_questions);

        if (questions.length > 0 && !hasAnswered) {
          // الانتقال الفوري والمباشر لخطوة حل الأسئلة التفاعلية قبل اعتماد التحضير النهائي
          setModalStep("questions");
          toast({
            title: "تم التحقق من الرمز والموقع! 🎯",
            description: "يرجى الإجابة على أسئلة المحاضرة لاعتماد التحضير نهائياً.",
          });
        } else {
          // تمت الإجابة مسبقاً أو لا توجد أسئلة
          setModalStep("success");
          toast({
            title: "تم اعتماد التحضير بنجاح! 🎉",
            description: res.data.message || "تم تسجيل وتوثيق حضورك في المحاضرة بنجاح.",
          });
        }

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
          title: "فشل التحقق من الرمز",
          description: data?.message || "رمز الـ QR غير صالح أو أن وقت المحاضرة قد انتهى.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. المحرك المزدوج فائق السرعة لمسح الـ QR (jsQR + BarcodeDetector)
  const startScanningLoop = () => {
    stopScanningLoop();
    setIsScanningActive(true);

    let barcodeDetector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        console.warn("Native BarcodeDetector not available, using jsQR fallback:", e);
      }
    }

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || isSubmitting || modalStep !== "scan") {
        return;
      }

      // أ) الفحص بالمحرك العتادي المباشر إن وُجد
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            stopScanningLoop();
            if (navigator.vibrate) {
              try { navigator.vibrate(120); } catch (_) {}
            }
            handleVerifyQR(barcodes[0].rawValue);
            return;
          }
        } catch (_) {}
      }

      // ب) المحرك البرمجي فائق الدقة عبر Canvas و jsQR
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data && code.data.trim()) {
            stopScanningLoop();
            if (navigator.vibrate) {
              try { navigator.vibrate(120); } catch (_) {}
            }
            handleVerifyQR(code.data);
          }
        }
      } catch (_) {}
    }, 200);
  };

  const stopScanningLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanningActive(false);
  };

  // 4. تشغيل الكاميرا الاحترافية بدقة عالية وتركيز مستمر
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("الكاميرا غير مدعومة في هذا المتصفح.");
        setHasCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 },
        },
      });

      // تفعيل التركيز المستمر إن كان مدعوماً
      const track = stream.getVideoTracks()[0];
      if (track && "applyConstraints" in track) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" } as any],
          });
        } catch (_) {}
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
      startScanningLoop();
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("تعذر فتح الكاميرا أو تم رفض الإذن. يرجى التأكد من منح إذن الكاميرا في المتصفح.");
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

  // 6. تسليم وتوثيق الإجابات لاعتماد التحضير النهائي
  const handleSubmitAnswersAndFinalize = async () => {
    const questions: InteractiveQuestion[] = scanResult?.data?.interactive_questions || [];
    if (questions.length > 0 && Object.keys(answersMap).length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار إجابة واحدة على الأقل قبل اعتماد التحضير.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAnswers(true);
    try {
      const timetableId = scanResult?.data?.timetable_id || activeLecture?.timetable_id;
      const sessionId = scanResult?.data?.session_id || activeLecture?.session_id;

      await api.post("/v1/student/submit-lecture-answers", {
        timetable_id: timetableId,
        session_id: sessionId,
        answers: Object.entries(answersMap).map(([qId, val]) => ({
          question_id: Number(qId),
          answer_value: val,
        })),
      });

      setModalStep("success");
      toast({
        title: "تم اعتماد تحضيرك بنجاح! 🎉",
        description: "تم توثيق حضورك وإجاباتك الأكاديمية بنسبة 100%.",
      });

      if (onSuccess) onSuccess({ ...scanResult, finalized: true });
    } catch (err: any) {
      toast({
        title: "خطأ في اعتماد الإجابات",
        description: err?.response?.data?.message || "تعذر توثيق الإجابات، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  useEffect(() => {
    if (open) {
      setModalStep("scan");
      setScanResult(null);
      setAnswersMap({});
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
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-border/70 rounded-2xl shadow-xl" dir="rtl">
        {/* Step Indicator Header */}
        <div className="p-5 pb-3 bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <QrCode className="w-5 h-5 text-primary" />
                <span>التحضير الذكي عبر الـ QR</span>
              </DialogTitle>
              <Badge variant="outline" className="text-xs font-medium">
                {modalStep === "scan"
                  ? "الخطوة 1: مسح الرمز"
                  : modalStep === "questions"
                  ? "الخطوة 2: الأسئلة التفاعلية"
                  : "تم الاعتماد بنجاح"}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {modalStep === "scan"
                ? "وجّه الكاميرا نحو رمز الاستجابة السريعة المعروض على شاشة القاعة مع تفعيل الـ GPS."
                : modalStep === "questions"
                ? "أجب عن الأسئلة التفاعلية التالية للمحاضرة لتأكيد واعتماد حضورك رسمياً."
                : "تم توثيق الحضور الأكاديمي والإجابات التفاعلية بنجاح."}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/40">
            <div
              className={`h-1.5 rounded-full transition-all ${
                modalStep === "scan"
                  ? "bg-primary animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all ${
                modalStep === "questions"
                  ? "bg-primary animate-pulse"
                  : modalStep === "success"
                  ? "bg-emerald-500"
                  : "bg-muted"
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* ==================================================================== */}
          {/* STEP 1: LIVE CAMERA QR SCANNER */}
          {/* ==================================================================== */}
          {modalStep === "scan" && (
            <div className="space-y-4">
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
                        تم رصد الموقع بدقة: {gpsLocation.accuracy} متر (داخل نطاق الكلية والقاعة ✓)
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

              {/* Live High-Definition Viewfinder */}
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

                    {/* Laser Scanner Frame & Reticle */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-500/80 rounded-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                      </div>
                    </div>

                    {/* Live Status Pill Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <Badge className="bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[11px] gap-1 px-2.5 py-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>الكاميرا تلتقط بدقة عالية (Dual Engine)</span>
                      </Badge>
                    </div>

                    {isSubmitting && (
                      <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5">
                        <Loader2 className="w-9 h-9 animate-spin text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          جاري التحقق من الرمز والموقع الجغرافي بالقاعة...
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-muted-foreground space-y-3">
                    <Camera className="w-10 h-10 mx-auto text-muted-foreground/50" />
                    <p className="text-xs leading-relaxed">{cameraError || "جاري تهيئة الكاميرا المباشرة..."}</p>
                    <Button variant="outline" size="sm" onClick={startCamera} className="text-xs h-8">
                      إعادة المحاولة لفتح الكاميرا
                    </Button>
                  </div>
                )}
              </div>

              {/* Scanning Instructions */}
              <div className="text-center pt-1">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  وجّه الكاميرا مباشرة نحو شاشة العرض بالقاعة، وسيتم المسح والتحقق تلقائياً.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 2: INTERACTIVE QUESTIONS (مطلوب الإجابة لاعتماد التحضير) */}
          {/* ==================================================================== */}
          {modalStep === "questions" && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Lecture Summary Bar */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-primary/5 to-background border border-indigo-500/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {scanResult?.data?.course_name || activeLecture?.course_name || "المقرر الدراسي"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {scanResult?.data?.classroom || activeLecture?.classroom || "القاعة الدراسية"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                  <span>أستاذ المقرر: {scanResult?.data?.lecturer_name || activeLecture?.lecturer_name}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">تم التحقق من الحضور في القاعة ✓</span>
                </div>
              </div>

              {/* Questions Container */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {((scanResult?.data?.interactive_questions || activeLecture?.interactive_questions || []) as InteractiveQuestion[]).map((q, idx) => (
                  <div key={q.id || idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
                    <div className="font-semibold text-xs text-foreground flex items-start gap-2 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>

                    <RadioGroup
                      value={answersMap[q.id] || ""}
                      onValueChange={(val) => setAnswersMap((prev) => ({ ...prev, [q.id]: val }))}
                      className="space-y-1.5 pr-7"
                    >
                      {(q.options || ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"]).map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          onClick={() => setAnswersMap((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                            answersMap[q.id] === opt
                              ? "bg-primary/10 border-primary/40 text-primary font-medium"
                              : "bg-background/80 hover:bg-accent/40 border-border/60"
                          }`}
                        >
                          <RadioGroupItem value={opt} id={`modal-q-${q.id}-opt-${optIdx}`} />
                          <Label htmlFor={`modal-q-${q.id}-opt-${optIdx}`} className="cursor-pointer text-xs font-normal flex-1">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t">
                <Button
                  onClick={handleSubmitAnswersAndFinalize}
                  disabled={isSubmittingAnswers}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-1.5 shadow-sm text-xs"
                >
                  {isSubmittingAnswers ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري اعتماد وتوثيق التحضير...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>اعتماد التحضير وتوثيق الإجابات الآن</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "تم حفظ التحقق الأولي",
                      description: "يمكنك إكمال إجابة الأسئلة من بطاقة المحاضرة قبل انتهاء موعدها.",
                    });
                    onClose();
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  الإجابة لاحقاً (قبل انتهاء وقت المحاضرة)
                </Button>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 3: SUCCESS & FINAL VERIFICATION */}
          {/* ==================================================================== */}
          {modalStep === "success" && (
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-inner">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  تم اعتماد تحضيرك بنجاح! 🎉
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  تم توثيق الحضور والتحقق من الموقع الجغرافي بالقاعة وتسجيل تفاعلك الأكاديمي بنجاح.
                </p>
              </div>

              {scanResult?.data && (
                <div className="bg-muted/40 rounded-xl p-3.5 text-xs text-right space-y-2 border">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" /> المقرر:
                    </span>
                    <span className="font-semibold text-foreground">{scanResult.data.course_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> الأستاذ:
                    </span>
                    <span className="font-semibold text-foreground">{scanResult.data.lecturer_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> وقت الاعتماد:
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {scanResult.data.time || new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9"
              >
                تم • متابعة لوحة المتابعة
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
