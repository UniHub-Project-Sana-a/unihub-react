import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // تأكد من وجود هذا المكون في shadcn/ui
import { AlertTriangle, MapPin, Loader2, BookOpen, CheckCircle2 , Clock, Play, Check} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // تأكد من وجود ScrollArea
import { api } from "@/lib/api"; // لاستدعاء API
import { Badge } from "@/components/ui/badge";

// ✅ تحديث الواجهة لتشمل المواضيع المختارة
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
  lectureId: string | null; // هذا هو timetable_id
  classroomInfo: ClassroomInfo | null;
  expectedCount: number;
}

// 1. قائمة المواضيع الثابتة (React Topics)
const availableTopics = [
  "Introduction to JSX",
  "Components & Props",
  "State & Lifecycle",
  "Hooks (useState, useEffect)",
  "Event Handling",
  "Conditional Rendering",
  "Lists & Keys",
  "Context API",
  "React Router"
];

export function StartQRModal({ open, onClose, onSubmit, lectureId, classroomInfo, expectedCount }: StartQRModalProps) {
  // الحالات الأساسية
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [validMinutes, setValidMinutes] = useState(1);
  const [maxScans, setMaxScans] = useState(50);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [allowedDistance, setAllowedDistance] = useState(50);

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 2. حالة لتخزين المواضيع المختارة
  const [selectedTopics, setSelectedTopics] = useState([]);
    // 3. دالة تبديل الاختيار (Toggle)
  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  useEffect(() => {
    if (open) {
      // 1. إعادة تعيين البيانات الأساسية
      if (expectedCount && expectedCount > 0) setMaxScans(expectedCount);
      
      if (classroomInfo) {
        const lat = classroomInfo.latitude !== null ? Number(classroomInfo.latitude) : null;
        const lon = classroomInfo.longitude !== null ? Number(classroomInfo.longitude) : null;
        const dist = classroomInfo.allowed_distance !== null ? Number(classroomInfo.allowed_distance) : 50;
        
        setLatitude(isNaN(lat) ? null : lat);
        setLongitude(isNaN(lon) ? null : lon);
        setAllowedDistance(isNaN(dist) ? 50 : dist);
      }
    }
  }, [open, classroomInfo, expectedCount, lectureId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (intervalSeconds < 5) newErrors.intervalSeconds = "الحد الأدنى 5 ثوانٍ.";
    if (validMinutes < 1) newErrors.validMinutes = "الحد الأدنى دقيقة واحدة.";
    if (!latitude || !longitude) newErrors.location = "إحداثيات القاعة غير متوفرة.";
    
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>إعدادات الجلسة والمواضيع</DialogTitle>
          <DialogDescription>تحديد إعدادات الحضور واختيار المواضيع التي سيتم شرحها.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-6">
  
          {/* حاوية الشبكة الرئيسية للإعدادات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
              {/* ========================================================= */}
              {/* ✅ 1. (جديد) قسم مواضيع الجلسة - يظهر في العرض الكامل */}
              {/* ========================================================= */}
              <div className="col-span-1 md:col-span-2 space-y-4 p-4 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm">مواضيع هذه الجلسة</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                          تم اختيار {selectedTopics.length}
                      </span>
                  </div>
          
                  <div className="flex flex-wrap gap-2">
                      {availableTopics.map((topic) => {
                          const isSelected = selectedTopics.includes(topic);
                          return (
                              <Badge
                                  key={topic}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-all hover:bg-primary/90 hover:text-primary-foreground text-sm py-1 px-3 ${
                                      isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary"
                                  }`}
                                  onClick={() => toggleTopic(topic)}
                              >
                                  {isSelected && <Check className="w-3 h-3 mr-1" />}
                                  {topic}
                              </Badge>
                          );
                      })}
                  </div>
                  
                  {/* حقل إدخال لموضوع مخصص (اختياري) */}
                  <div className="pt-2">
                       <p className="text-[10px] text-muted-foreground">حدد النقاط التي سيتم تغطيتها لتوثيقها في سجل المحاضرة.</p>
                  </div>
              </div>
              {/* ========================================================= */}
          
          
              {/* 2. إعدادات التوقيت (Interval & Validity) - (كما هي) */}
              <div className="space-y-4 p-4 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b">
                      <Clock className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">إعدادات التوقيت</h3>
                  </div>
                  
                  <div className="space-y-3">
                      <div className="space-y-1.5">
                          <div className="flex justify-between">
                              <Label htmlFor="interval" className="text-xs">تحديث الكود (ثوانٍ)</Label>
                              <span className="text-xs text-muted-foreground font-mono">{intervalSeconds}s</span>
                          </div>
                          <Input 
                              id="interval" 
                              type="number" 
                              min={5} 
                              className="h-9"
                              value={intervalSeconds} 
                              onChange={(e) => setIntervalSeconds(Number(e.target.value))} 
                          />
                          {errors.intervalSeconds && <p className="text-[10px] text-destructive">{errors.intervalSeconds}</p>}
                      </div>
          
                      <div className="space-y-1.5">
                          <div className="flex justify-between">
                              <Label htmlFor="validity" className="text-xs">مدة الجلسة (دقيقة)</Label>
                              <span className="text-xs text-muted-foreground font-mono">{validMinutes}m</span>
                          </div>
                          <Input 
                              id="validity" 
                              type="number" 
                              min={1} 
                              className="h-9"
                              value={validMinutes} 
                              onChange={(e) => setValidMinutes(Number(e.target.value))} 
                          />
                      </div>
                  </div>
              </div>
          
              {/* 3. إعدادات الحضور والموقع (Attendance & Location) - (كما هي) */}
              <div className="space-y-4 p-4 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">الموقع والحضور</h3>
                  </div>
          
                  <div className="space-y-3">
                      <div className="space-y-1.5">
                          <Label htmlFor="maxScans" className="text-xs">عدد الطلاب المتوقع</Label>
                          <Input 
                              id="maxScans" 
                              type="number" 
                              min={1} 
                              className="h-9"
                              value={maxScans} 
                              onChange={(e) => setMaxScans(Number(e.target.value))} 
                          />
                      </div>
          
                      <div className="space-y-1.5">
                          <Label className="text-xs">نطاق الموقع الجغرافي</Label>
                          {latitude && longitude ? (
                              <div className="flex items-center gap-2">
                                  <div className="flex-1 p-2 border rounded-md bg-muted/50 text-xs flex items-center justify-center gap-1 text-muted-foreground">
                                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                                      <span>تم تحديد الموقع</span>
                                  </div>
                                  <div className="flex items-center gap-1 border rounded-md px-2 bg-background w-24">
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">متر:</span>
                                      <Input 
                                          id="distance" 
                                          type="number" 
                                          className="h-8 border-none shadow-none focus-visible:ring-0 p-0 text-center" 
                                          min={1} 
                                          value={allowedDistance} 
                                          onChange={(e) => setAllowedDistance(Number(e.target.value))} 
                                      />
                                  </div>
                              </div>
                          ) : (
                              <div className="p-2 border border-destructive/40 rounded-md bg-destructive/5 text-destructive flex items-center justify-center gap-2 text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>الإحداثيات غير متوفرة لهذه القاعة</span>
                              </div>
                          )}
                          {errors.location && <p className="text-[10px] text-destructive">{errors.location}</p>}
                      </div>
                  </div>
              </div>
          
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t mt-auto bg-muted/10 p-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!latitude || !longitude} 
            className="w-full sm:w-auto gap-2"
          >
            <Play className="w-4 h-4" /> {/* يمكنك استيراد Play من lucide-react */}
            بدء الجلسة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}