import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// عدّل الواجهة لتشمل كل الحقول
export interface QRFormSettings {
  intervalSeconds: number;
  validMinutes: number;
  maxScans: number;
  latitude: number;
  longitude: number;
  allowedDistance: number;
}

interface StartQRModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (settings: QRFormSettings) => void;
}

export function StartQRModal({ open, onClose, onSubmit }: StartQRModalProps) {
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [validMinutes, setValidMinutes] = useState(2);
  const [maxScans, setMaxScans] = useState(50);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [allowedDistance, setAllowedDistance] = useState(50);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      // حاول الحصول على الموقع تلقائيًا عند فتح المودال
      handleGetLocation();
    }
  }, [open]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({...prev, location: "المتصفح لا يدعم تحديد الموقع."}));
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setErrors(prev => ({ ...prev, location: '' })); // امسح الخطأ عند النجاح
        setIsGettingLocation(false);
      },
      () => {
        setErrors(prev => ({...prev, location: "فشل الحصول على الموقع. تأكد من تفعيل الأذونات."}));
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (intervalSeconds < 5) newErrors.intervalSeconds = "الحد الأدنى 5 ثوانٍ";
    if (validMinutes < 1) newErrors.validMinutes = "الحد الأدنى دقيقة واحدة";
    if (maxScans < 1) newErrors.maxScans = "الحد الأدنى مسح واحد";
    if (!latitude || !longitude) newErrors.location = "الموقع الجغرافي مطلوب.";
    if (allowedDistance < 1) newErrors.allowedDistance = "المسافة يجب أن تكون 1 متر على الأقل.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        intervalSeconds,
        validMinutes,
        maxScans,
        latitude: latitude!,
        longitude: longitude!,
        allowedDistance,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إعدادات جلسة QR</DialogTitle>
          <DialogDescription>قم بتخصيص إعدادات الحضور باستخدام رموز QR</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interval">تغيير QR كل (ثوانٍ)</Label>
            <Input id="interval" type="number" min={5} value={intervalSeconds} onChange={(e) => setIntervalSeconds(Number(e.target.value))} className={errors.intervalSeconds ? "border-destructive" : ""} />
            {errors.intervalSeconds && <p className="text-sm text-destructive">{errors.intervalSeconds}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity">مدة صلاحية كل رمز (دقائق)</Label>
            <Input id="validity" type="number" min={1} value={validMinutes} onChange={(e) => setValidMinutes(Number(e.target.value))} className={errors.validMinutes ? "border-destructive" : ""} />
            {errors.validMinutes && <p className="text-sm text-destructive">{errors.validMinutes}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxScans">عدد الطلاب المتوقع</Label>
            <Input id="maxScans" type="number" min={1} value={maxScans} onChange={(e) => setMaxScans(Number(e.target.value))} className={errors.maxScans ? "border-destructive" : ""} />
            {errors.maxScans && <p className="text-sm text-destructive">{errors.maxScans}</p>}
          </div>

          <div className="space-y-2">
            <Label>الموقع الجغرافي للمحاضرة</Label>
            <div className="flex gap-2 items-center">
              <Input value={latitude ? `Lat: ${latitude.toFixed(5)}` : "لم يحدد"} readOnly />
              <Input value={longitude ? `Lon: ${longitude.toFixed(5)}` : "لم يحدد"} readOnly />
              <Button variant="outline" onClick={handleGetLocation} disabled={isGettingLocation}>
                {isGettingLocation ? <Loader2 className="w-4 h-4 animate-spin"/> : "تحديث"}
              </Button>
            </div>
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">المسافة المسموح بها (بالمتر)</Label>
            <Input id="distance" type="number" min={1} value={allowedDistance} onChange={(e) => setAllowedDistance(Number(e.target.value))} />
            {errors.allowedDistance && <p className="text-sm text-destructive">{errors.allowedDistance}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isGettingLocation}>ابدأ الجلسة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}