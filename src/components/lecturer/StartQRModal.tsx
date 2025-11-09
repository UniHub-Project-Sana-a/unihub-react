import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MapPin } from "lucide-react";

export interface QRFormSettings {
  intervalSeconds: number;
  validMinutes: number;
  maxScans: number;
  latitude: number;
  longitude: number;
  allowedDistance: number;
}

interface ClassroomInfo {
  latitude: number | string | null;
  longitude: number | string | null;
  allowed_distance: number | string | null;
}

interface StartQRModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (settings: QRFormSettings) => void;
  lectureId: string | null;
  classroomInfo: ClassroomInfo | null;
}

export function StartQRModal({ open, onClose, onSubmit, lectureId, classroomInfo }: StartQRModalProps) {
  // الحالات الداخلية للمودال
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [validMinutes, setValidMinutes] = useState(1);
  const [maxScans, setMaxScans] = useState(50);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [allowedDistance, setAllowedDistance] = useState(50);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && classroomInfo) {
      // تحويل القيم إلى أرقام بشكل آمن
      const lat = classroomInfo.latitude !== null ? Number(classroomInfo.latitude) : null;
      const lon = classroomInfo.longitude !== null ? Number(classroomInfo.longitude) : null;
      const dist = classroomInfo.allowed_distance !== null ? Number(classroomInfo.allowed_distance) : 50;
      
      setLatitude(isNaN(lat) ? null : lat);
      setLongitude(isNaN(lon) ? null : lon);
      setAllowedDistance(isNaN(dist) ? 50 : dist);
      
      setErrors({}); // إعادة تعيين الأخطاء عند الفتح
    }
  }, [open, classroomInfo]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (intervalSeconds < 5) newErrors.intervalSeconds = "الحد الأدنى 5 ثوانٍ.";
    if (validMinutes < 1) newErrors.validMinutes = "الحد الأدنى دقيقة واحدة.";
    if (!latitude || !longitude) newErrors.location = "إحداثيات القاعة غير متوفرة.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate() && lectureId && latitude && longitude) {
      onSubmit({
        intervalSeconds,
        validMinutes,
        maxScans,
        latitude,
        longitude,
        allowedDistance,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إعدادات جلسة QR</DialogTitle>
          <DialogDescription>سيتم استخدام إعدادات القاعة الدراسية لتحديد الموقع.</DialogDescription>
        </DialogHeader>

        {/* ✅ --- تم إرجاع جميع حقول النموذج هنا --- ✅ */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interval">تحديث الرمز كل (ثوانٍ)</Label>
            <Input id="interval" type="number" min={5} value={intervalSeconds} onChange={(e) => setIntervalSeconds(Number(e.target.value))} />
            {errors.intervalSeconds && <p className="text-sm text-destructive mt-1">{errors.intervalSeconds}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity">صلاحية الرمز (دقائق)</Label>
            <Input id="validity" type="number" min={1} value={validMinutes} onChange={(e) => setValidMinutes(Number(e.target.value))} />
            {errors.validMinutes && <p className="text-sm text-destructive mt-1">{errors.validMinutes}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxScans">عدد الطلاب المتوقع</Label>
            <Input id="maxScans" type="number" min={1} value={maxScans} onChange={(e) => setMaxScans(Number(e.target.value))} />
          </div>
          
          <div className="space-y-2">
            <Label>الموقع الجغرافي للقاعة (تلقائي)</Label>
            {latitude && longitude ? (
              <div className="p-3 border rounded-md bg-muted text-muted-foreground flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>خط العرض: {latitude.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>خط الطول: {longitude.toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 border border-destructive/50 rounded-md bg-destructive/10 text-destructive flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>إحداثيات القاعة غير متوفرة</span>
              </div>
            )}
            {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">المسافة المسموح بها (بالمتر)</Label>
            <Input id="distance" type="number" min={1} value={allowedDistance} onChange={(e) => setAllowedDistance(Number(e.target.value))} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!latitude || !longitude}>ابدأ الجلسة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}