import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsQR from "jsqr";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Flashlight,
  Camera,
  HelpCircle,
  Check,
  Sparkles,
  Building,
  User,
  Clock,
  AlertTriangle,
  Star,
  Zap,
} from "lucide-react";

interface InteractiveQuestion {
  id: number;
  question: string;
  type?: string;
  options?: string[];
}

type PageStep = "scan" | "questions" | "success";

export default function StudentQRScannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Lecture data passed via navigation state
  const activeLecture = (location.state as any)?.lecture ?? null;

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Page step
  const [step, setStep] = useState<PageStep>("scan");

  // Camera states
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  // Camera advanced controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const [minZoom, setMinZoom] = useState(1);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);

  // GPS states
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Questions states
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

  // ─────────────────────────────────────────────
  // GPS
  // ─────────────────────────────────────────────
  const acquireLocation = useCallback(() => {
    setIsGettingGps(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("متصفحك لا يدعم تحديد الموقع الجغرافي.");
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
          msg = "تم رفض إذن الوصول للموقع. فعّل الـ GPS في إعدادات جهازك/المتصفح.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "إشارة GPS غير متاحة، تأكد من تشغيل خدمات الموقع.";
        }
        setGpsError(msg);
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ─────────────────────────────────────────────
  // Zoom control
  // ─────────────────────────────────────────────
  const applyZoom = useCallback(async (newZoom: number) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoomLevel(clamped);
    try {
      await track.applyConstraints({ advanced: [{ zoom: clamped } as any] });
    } catch (_) { }
  }, [minZoom, maxZoom]);

  const zoomIn = () => applyZoom(zoomLevel + 0.5);
  const zoomOut = () => applyZoom(zoomLevel - 0.5);

  // ─────────────────────────────────────────────
  // Torch (Flashlight)
  // ─────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const newTorchState = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newTorchState } as any] });
      setTorchOn(newTorchState);
    } catch (_) {
      toast({ title: "الفلاش غير مدعوم", description: "هذا الجهاز لا يدعم التحكم في الفلاش.", variant: "destructive" });
    }
  }, [torchOn, toast]);

  // ─────────────────────────────────────────────
  // Scanning loop
  // ─────────────────────────────────────────────
  const handleVerifyQR = useCallback(async (qrValue: string) => {
    if (!qrValue.trim() || isSubmitting) return;
    if (!gpsLocation) {
      toast({ title: "الموقع الجغرافي مطلوب", description: "يجب تحديد موقعك أولاً.", variant: "destructive" });
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

        const questions: InteractiveQuestion[] =
          res.data?.data?.interactive_questions?.length > 0
            ? res.data.data.interactive_questions
            : activeLecture?.interactive_questions?.length > 0
            ? activeLecture.interactive_questions
            : [];
        const hasAnswered: boolean = Boolean(res.data?.data?.has_answered_questions);

        if (questions.length > 0 && !hasAnswered) {
          setStep("questions");
          toast({ title: "تم التحقق من رمز الـ QR! 🎯", description: "أجب على أسئلة المحاضرة لاعتماد تحضيرك." });
        } else {
          setStep("success");
          toast({ title: "تم اعتماد تحضيرك! 🎉", description: res.data.message || "تم توثيق حضورك بنجاح." });
        }
      }
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.is_out_of_range) {
        toast({
          title: "خارج نطاق القاعة! ⛔",
          description: `المسافة: ${data.distance} متر، الحد الأقصى: ${data.allowed_distance} متر.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل التحقق",
          description: data?.message || "رمز QR غير صالح أو انتهى وقت المحاضرة.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsLocation, isSubmitting, acquireLocation, toast]);

  const stopScanningLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanningActive(false);
  }, []);

  const startScanningLoop = useCallback(() => {
    stopScanningLoop();
    setIsScanningActive(true);

    let barcodeDetector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch (_) { }
    }

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      // Native BarcodeDetector (fastest)
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes?.length > 0 && barcodes[0].rawValue) {
            stopScanningLoop();
            if (navigator.vibrate) try { navigator.vibrate([80, 40, 80]); } catch (_) { }
            handleVerifyQR(barcodes[0].rawValue);
            return;
          }
        } catch (_) { }
      }

      // jsQR fallback
      try {
        if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          if (code?.data?.trim()) {
            stopScanningLoop();
            if (navigator.vibrate) try { navigator.vibrate([80, 40, 80]); } catch (_) { }
            handleVerifyQR(code.data);
          }
        }
      } catch (_) { }
    }, 150);
  }, [handleVerifyQR, stopScanningLoop]);

  // ─────────────────────────────────────────────
  // Camera
  // ─────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stopScanningLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setHasCamera(null);
    setTorchOn(false);
  }, [stopScanningLoop]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setHasCamera(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("الكاميرا غير مدعومة في هذا المتصفح.");
      setHasCamera(false);
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // المحاولة الأولى: دقة عالية متوافقة
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
    } catch (_) {
      try {
        // المحاولة الثانية: الكاميرا الافتراضية بأقل قيود ممكنة لضمان الفتح الفوري
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch (err2: any) {
        console.warn("Camera failed:", err2);
        setCameraError("تعذر فتح الكاميرا. تأكد من منح إذن الكاميرا في المتصفح.");
        setHasCamera(false);
        return;
      }
    }

    if (!stream) {
      setCameraError("تعذر الوصول لبث الكاميرا.");
      setHasCamera(false);
      return;
    }

    streamRef.current = stream;
    const track = stream.getVideoTracks()[0];

    // Detect capabilities (Zoom & Torch)
    if (track) {
      const caps = track.getCapabilities?.() as any;
      if (caps) {
        if (caps.zoom) {
          setHasZoom(true);
          setMinZoom(caps.zoom.min ?? 1);
          setMaxZoom(caps.zoom.max ?? 4);
          setZoomLevel(caps.zoom.min ?? 1);
        }
        if (caps.torch) setHasTorch(true);
      }
      try {
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] });
      } catch (_) { }
    }

    // ربط البث بعنصر الفيديو وتشغيله فوراً
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasCamera(true);
            startScanningLoop();
          })
          .catch((e) => {
            console.warn("Autoplay was prevented, starting scan anyway:", e);
            setHasCamera(true);
            startScanningLoop();
          });
      } else {
        setHasCamera(true);
        startScanningLoop();
      }
    } else {
      // في حالة لم يكن الـ ref جاهزاً بعد
      setHasCamera(true);
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
          startScanningLoop();
        }
      }, 100);
    }
  }, [startScanningLoop]);

  // ─────────────────────────────────────────────
  // Submit answers
  // ─────────────────────────────────────────────
  const handleSubmitAnswers = async () => {
    const questions: InteractiveQuestion[] = scanResult?.data?.interactive_questions || [];
    if (questions.length > 0 && Object.keys(answersMap).length === 0) {
      toast({ title: "تنبيه", description: "يرجى الإجابة على سؤال واحد على الأقل.", variant: "destructive" });
      return;
    }
    setIsSubmittingAnswers(true);
    try {
      const timetableId = scanResult?.data?.timetable_id ?? activeLecture?.timetable_id;
      const sessionId = scanResult?.data?.session_id ?? activeLecture?.session_id;
      await api.post("/v1/student/submit-lecture-answers", {
        timetable_id: timetableId,
        session_id: sessionId,
        answers: Object.entries(answersMap).map(([qId, val]) => ({
          question_id: Number(qId),
          answer_value: val,
        })),
      });
      setStep("success");
      toast({ title: "تم اعتماد تحضيرك بنجاح! 🎉", description: "تم توثيق حضورك وإجاباتك الأكاديمية." });
    } catch (err: any) {
      toast({
        title: "خطأ في اعتماد الإجابات",
        description: err?.response?.data?.message || "تعذر توثيق الإجابات، حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────
  useEffect(() => {
    acquireLocation();
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoBack = () => {
    stopCamera();
    navigate(-1);
  };

  const handleDone = () => {
    navigate("/student/portal", { replace: true });
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl" style={{ touchAction: "none" }}>

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 1 — FULL SCREEN CAMERA SCANNER           */}
      {/* ══════════════════════════════════════════════ */}
      {step === "scan" && (
        <>
          {/* Camera Viewport */}
          <div ref={videoContainerRef} className="relative flex-1 bg-black overflow-hidden">

            {/* Video element */}
            {hasCamera !== false && (
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: hasCamera ? 1 : 0 }}
              />
            )}

            {/* Loading overlay */}
            {hasCamera === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <Camera className="absolute inset-0 m-auto w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white/70 text-sm">جاري تهيئة الكاميرا...</p>
              </div>
            )}

            {/* Error overlay */}
            {hasCamera === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/95 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-red-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-bold text-base">تعذر فتح الكاميرا</p>
                  <p className="text-white/60 text-sm leading-relaxed max-w-xs">{cameraError}</p>
                </div>
                <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {/* Scanning frame overlay */}
            {hasCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Darkened corners */}
                <div className="absolute inset-0 bg-black/50" style={{
                  WebkitMaskImage: "radial-gradient(ellipse 65% 65% at 50% 48%, transparent 0%, black 100%)",
                  maskImage: "radial-gradient(ellipse 65% 65% at 50% 48%, transparent 0%, black 100%)",
                }} />

                {/* Scanner box */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                  {/* Corner brackets */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />

                  {/* Scanning laser line */}
                  {isScanningActive && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scan_2s_ease-in-out_infinite]"
                      style={{ animation: "scanLine 2s ease-in-out infinite" }}
                    />
                  )}

                  {/* Center QR icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-white/20" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 text-center px-6">
                  <p className="text-white font-semibold text-sm drop-shadow-lg">
                    وجّه الكاميرا نحو رمز الـ QR المعروض
                  </p>
                  <p className="text-white/60 text-xs mt-1 drop-shadow">
                    سيتم المسح والتحقق تلقائياً فور الرصد
                  </p>
                </div>
              </div>
            )}

            {/* Submitting overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                <p className="text-white font-semibold text-sm">جاري التحقق من الرمز والموقع...</p>
              </div>
            )}

            {/* ── TOP BAR ── */}
            <div className="absolute top-0 inset-x-0 z-20">
              {/* Safe area padding */}
              <div className="pt-safe-top bg-gradient-to-b from-black/80 to-transparent pb-6">
                <div className="flex items-center justify-between px-4 pt-3">
                  {/* Back button */}
                  <button
                    onClick={handleGoBack}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Title */}
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">مسح رمز QR للتحضير</p>
                    {activeLecture && (
                      <p className="text-white/60 text-[10px] mt-0.5 truncate max-w-[180px]">{activeLecture.course_name}</p>
                    )}
                  </div>

                  {/* Live scanning indicator */}
                  <div className="flex items-center gap-1.5 bg-emerald-600/80 backdrop-blur-md rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-[10px] font-bold">مباشر</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── GPS STATUS BAR ── */}
            {hasCamera && (
              <div className="absolute top-[72px] inset-x-4 z-20">
                <div className={`rounded-xl px-3 py-2 flex items-center justify-between gap-2 backdrop-blur-md border text-xs ${gpsLocation
                    ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-300"
                    : gpsError
                      ? "bg-red-900/80 border-red-500/40 text-red-300"
                      : "bg-amber-900/80 border-amber-500/40 text-amber-300"
                  }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className={`w-3.5 h-3.5 shrink-0 ${isGettingGps ? "animate-spin" : ""}`} />
                    <span className="truncate">
                      {isGettingGps
                        ? "جاري تحديد موقعك..."
                        : gpsLocation
                          ? `الموقع محدد • دقة ${gpsLocation.accuracy}م ✓`
                          : gpsError || "تحديد الموقع مطلوب"}
                    </span>
                  </div>
                  {(gpsError || !gpsLocation) && !isGettingGps && (
                    <button onClick={acquireLocation} className="shrink-0 opacity-80 hover:opacity-100">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── BOTTOM CONTROLS ── */}
            {hasCamera && (
              <div className="absolute bottom-0 inset-x-0 z-20">
                <div className="bg-gradient-to-t from-black/90 to-transparent pt-12 pb-safe-bottom pb-6 px-6">

                  {/* Zoom slider */}
                  {hasZoom && (
                    <div className="flex items-center gap-3 mb-5">
                      <button onClick={zoomOut} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform">
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={minZoom}
                          max={maxZoom}
                          step={0.1}
                          value={zoomLevel}
                          onChange={(e) => applyZoom(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${((zoomLevel - minZoom) / (maxZoom - minZoom)) * 100}%, rgba(255,255,255,0.2) ${((zoomLevel - minZoom) / (maxZoom - minZoom)) * 100}%, rgba(255,255,255,0.2) 100%)` }}
                        />
                        <div className="text-center mt-1">
                          <span className="text-white/60 text-[10px] font-mono">{zoomLevel.toFixed(1)}×</span>
                        </div>
                      </div>
                      <button onClick={zoomIn} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Controls row */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Torch */}
                    {hasTorch && (
                      <button
                        onClick={toggleTorch}
                        className={`flex flex-col items-center gap-1.5 transition-all active:scale-95 ${torchOn ? "opacity-100" : "opacity-60"}`}
                      >
                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${torchOn ? "bg-amber-400/20 border-amber-400 text-amber-400" : "bg-white/10 border-white/30 text-white"
                          }`}>
                          <Flashlight className="w-5 h-5" />
                        </div>
                        <span className="text-white/60 text-[10px]">فلاش</span>
                      </button>
                    )}

                    {/* Main scan button / status */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${isScanningActive
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                          : "border-white/30 bg-white/10 text-white/60"
                        }`}>
                        <QrCode className="w-7 h-7" />
                      </div>
                      <span className="text-white/60 text-[10px]">
                        {isScanningActive ? "جاري المسح..." : "في انتظار الكاميرا"}
                      </span>
                    </div>

                    {/* Refresh camera */}
                    <button
                      onClick={() => { stopCamera(); setTimeout(startCamera, 300); }}
                      className="flex flex-col items-center gap-1.5 opacity-60 active:opacity-100 active:scale-95 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="text-white/60 text-[10px]">إعادة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 2 — INTERACTIVE QUESTIONS                */}
      {/* ══════════════════════════════════════════════ */}
      {step === "questions" && (
        <div className="flex-1 bg-background overflow-y-auto" dir="rtl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                onClick={handleGoBack}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-foreground" />
              </button>
              <div className="flex-1">
                <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  الأسئلة التفاعلية للمحاضرة
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">أجب لاعتماد تحضيرك رسمياً</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-0 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                تم التحقق ✓
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 px-4 pb-3">
              <div className="h-1 flex-1 rounded-full bg-emerald-500" />
              <div className="h-1 flex-1 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32">
            {/* Lecture info card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/8 via-background to-background border border-primary/20 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm text-foreground">
                      {scanResult?.data?.course_name || activeLecture?.course_name || "المقرر الدراسي"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {scanResult?.data?.lecturer_name || activeLecture?.lecturer_name || "المحاضر"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {scanResult?.data?.classroom || activeLecture?.classroom || "القاعة"}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <MapPin className="w-3 h-3" />
                      داخل النطاق • تم التحقق
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                أسئلة تفاعلية للتحقق من المتابعة الأكاديمية
              </p>

              {(((scanResult?.data?.interactive_questions?.length ? scanResult.data.interactive_questions : activeLecture?.interactive_questions) || []) as InteractiveQuestion[]).map((q, idx) => (
                <div key={q.id || idx} className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-[11px] font-bold">{idx + 1}</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground leading-relaxed flex-1">{q.question}</p>
                  </div>

                  <RadioGroup
                    value={answersMap[q.id] || ""}
                    onValueChange={(val) => setAnswersMap((prev) => ({ ...prev, [q.id]: val }))}
                    className="space-y-2 pr-9"
                  >
                    {(q.options || ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"]).map((rawOpt: any, optIdx: number) => {
                      const opt = typeof rawOpt === "string" ? rawOpt : rawOpt?.text || rawOpt?.option_text || String(rawOpt);
                      return (
                        <div
                          key={optIdx}
                          onClick={() => setAnswersMap((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm transition-all active:scale-[0.98] ${
                            answersMap[q.id] === opt
                              ? "bg-primary/8 border-primary/40 text-primary font-semibold shadow-sm"
                              : "bg-muted/30 hover:bg-muted/60 border-border/60 text-foreground"
                          }`}
                        >
                          <RadioGroupItem value={opt} id={`q-${q.id}-opt-${optIdx}`} className="shrink-0" />
                          <Label htmlFor={`q-${q.id}-opt-${optIdx}`} className="cursor-pointer text-sm font-normal flex-1 leading-relaxed">
                            {opt}
                          </Label>
                          {answersMap[q.id] === opt && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed bottom action */}
          <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t p-4 space-y-2 max-w-2xl mx-auto">
            <Button
              onClick={handleSubmitAnswers}
              disabled={isSubmittingAnswers}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 gap-2 text-sm shadow-lg rounded-xl"
            >
              {isSubmittingAnswers ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري اعتماد التحضير...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>اعتماد التحضير الآن</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="w-full text-muted-foreground text-xs h-9 hover:text-foreground"
            >
              الإجابة لاحقاً (قبل انتهاء وقت المحاضرة)
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 3 — SUCCESS                              */}
      {/* ══════════════════════════════════════════════ */}
      {step === "success" && (
        <div className="flex-1 bg-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          {/* Success animation */}
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            {/* Stars */}
            <Star className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <Star className="absolute top-2 -left-3 w-4 h-4 text-emerald-400 fill-emerald-400 animate-bounce" style={{ animationDelay: "200ms" }} />
            <Zap className="absolute -bottom-1 -right-3 w-5 h-5 text-primary animate-bounce" style={{ animationDelay: "400ms" }} />
          </div>

          <h2 className="text-2xl font-extrabold text-foreground mb-2">تم اعتماد تحضيرك! 🎉</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-8">
            تم توثيق حضورك الأكاديمي والتحقق من موقعك داخل القاعة بنجاح كامل.
          </p>

          {/* Details card */}
          {scanResult?.data && (
            <div className="w-full max-w-sm bg-card border rounded-2xl p-4 mb-6 text-right space-y-3 shadow-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" /> المقرر
                </span>
                <span className="font-bold text-sm text-foreground">{scanResult.data.course_name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> الأستاذ
                </span>
                <span className="font-semibold text-sm text-foreground">{scanResult.data.lecturer_name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> القاعة
                </span>
                <span className="font-semibold text-sm text-foreground">{scanResult.data.classroom}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> وقت الاعتماد
                </span>
                <span className="font-bold text-sm text-emerald-600">
                  {scanResult.data.time || new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleDone}
            className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 gap-2 rounded-xl text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            العودة للبوابة الطلابية
          </Button>
        </div>
      )}

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(250px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 1; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
}

