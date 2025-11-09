import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, StopCircle, Loader2 } from "lucide-react";
import { QRSettings, ActiveQRInfo, AttendanceRecord } from "@/pages/LecturerPage";
import QRCode from "qrcode";
import * as THREE from "three";
import { api } from "@/lib/api";

// واجهة الخصائص الجديدة
interface QRSession3DViewProps {
  settings: QRSettings;
  initialQR: ActiveQRInfo;
  lectureId: string;
  onEndSession: (records: AttendanceRecord[]) => void;
}

// مكون داخلي لعرض بطاقة الـ QR
function QRCard({ qrTexture, isFlipping }: { qrTexture: THREE.Texture | null; isFlipping: boolean; }) {
  const groupRef = useRef<THREE.Group>(null);
  const qrPlaneRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.1, delta * 2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.1, delta * 2);
    }
    
    if (qrPlaneRef.current) {
      const targetRotation = isFlipping ? Math.PI : 0;
      qrPlaneRef.current.rotation.y = THREE.MathUtils.lerp(qrPlaneRef.current.rotation.y, targetRotation, delta * 5);
    }
  });

  return (
    <group ref={groupRef}>
      {qrTexture && (
        <mesh ref={qrPlaneRef}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial map={qrTexture} transparent />
        </mesh>
      )}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// مكون المشهد الرئيسي
function Scene({ qrTexture, isFlipping }: { qrTexture: THREE.Texture | null; isFlipping: boolean; scansRemaining: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={75} />
      <OrbitControls enableZoom={false} enablePan={false} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <QRCard qrTexture={qrTexture} isFlipping={isFlipping} />
    </>
  );
}

export function QRSession3DView({
  settings,
  initialQR,
  lectureId,
  onEndSession,
}: QRSession3DViewProps) {
  const [currentQR, setCurrentQR] = useState(initialQR);
  const [qrTexture, setQrTexture] = useState<THREE.Texture | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // دالة لتحميل الـ QR code كـ Texture
  const generateTexture = async (qrData: string) => {
    setIsRefreshing(true);
    try {
      const qrDataURL = await QRCode.toDataURL(qrData, { width: 512, margin: 2 });
      const texture = new THREE.TextureLoader().load(qrDataURL, (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        setQrTexture(loadedTexture);
        setIsRefreshing(false);
      });
    } catch (err) {
      console.error("Error generating QR texture:", err);
      setIsRefreshing(false);
    }
  };

  // دالة لتحديث الرمز من الـ API
  const refreshQRCode = async () => {
    if (isRefreshing) return;
    try {
      // أنت ترسل qr_id و valid_minutes
      const res = await api.post('/v1/qr-codes/refresh', {
        qr_id: currentQR.qr_id,
        valid_minutes: settings.validMinutes,
      });
      // يجب أن تعيد هذه الاستجابة بيانات الـ QR الجديد
      setCurrentQR(res.data); // هذا صحيح، يفترض أن res.data هو الـ QR الجديد
    } catch (error) {
      console.error("Failed to refresh QR code:", error);
    }
};

  // تأثير لتوليد الـ Texture عند تغير الرمز
  useEffect(() => {
    generateTexture(currentQR.qr_code_value);
  }, [currentQR.qr_code_value]);

  // تأثير لتشغيل العدادات والتحديث
  useEffect(() => {
    const startCountdown = () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        const expiryTime = new Date(currentQR.expires_at).getTime();
        const now = new Date().getTime();
        setTimeLeft(Math.max(0, Math.floor((expiryTime - now) / 1000)));
      }, 1000);
    };

    const startRefreshInterval = () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = setInterval(refreshQRCode, settings.intervalSeconds * 1000);
    };

    if (!isPaused) {
      startCountdown();
      startRefreshInterval();
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [currentQR, isPaused, settings.intervalSeconds]);

  // تأثير WebSocket للاستماع للحضور
  useEffect(() => {
    if (window.Echo) {
      const channel = window.Echo.channel(`lecture.${lectureId}`);
      channel.listen('.student.attended', (event: any) => {
        setAttendance(prev => [...prev, event.record]);
      });
      return () => {
        channel.stopListening('.student.attended');
        window.Echo.leave(`lecture.${lectureId}`);
      };
    }
  }, [lectureId]);

  const handlePauseToggle = () => setIsPaused(prev => !prev);

  const handleEndSession = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    onEndSession(attendance);
  };

  return (
    <div className="space-y-6">
      <div className="h-[500px] bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden border shadow-lg relative">
        <Canvas shadows>
          <Scene qrTexture={qrTexture} isFlipping={isRefreshing} scansRemaining={settings.maxScans - attendance.length} />
        </Canvas>
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Badge variant="outline" className="text-xl px-6 py-3 font-semibold">
            صالح لمدة: {timeLeft} ثانية
          </Badge>
          <Badge variant="secondary" className="text-xl px-6 py-3 font-semibold">
            الحضور: {attendance.length} / {settings.maxScans}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePauseToggle} className="gap-2" size="lg">
            {isPaused ? <><Play className="w-5 h-5" /> استئناف</> : <><Pause className="w-5 h-5" /> إيقاف مؤقت</>}
          </Button>
          <Button variant="destructive" onClick={handleEndSession} className="gap-2" size="lg">
            <StopCircle className="w-5 h-5" /> إنهاء الجلسة
          </Button>
        </div>
      </div>
    </div>
  );
}