import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // تأكد من وجود هذا المكون في shadcn/ui
import { AlertTriangle, MapPin, Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // تأكد من وجود ScrollArea
import { api } from "@/lib/api"; // لاستدعاء API

// ✅ تحديث الواجهة لتشمل المواضيع المختارة
export interface QRFormSettings {
  intervalSeconds: number;
  validMinutes: number;
  maxScans: number;
  latitude: number;
  longitude: number;
  allowedDistance: number;
  selectedTopics: number[]; // مصفوفة معرفات المواضيع المختارة
}

interface ClassroomInfo {
  latitude: number | string | null;
  longitude: number | string | null;
  allowed_distance: number | string | null;
}

interface TopicItem {
  topic_id: number;
  title: string;
  is_covered: boolean; // هل تم شرحه سابقاً في هذا الترم؟
}

interface StartQRModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (settings: QRFormSettings) => void;
  lectureId: string | null; // هذا هو timetable_id
  classroomInfo: ClassroomInfo | null;
  expectedCount: number;
}

export function StartQRModal({ open, onClose, onSubmit, lectureId, classroomInfo, expectedCount }: StartQRModalProps) {
  // الحالات الأساسية
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [validMinutes, setValidMinutes] = useState(1);
  const [maxScans, setMaxScans] = useState(50);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [allowedDistance, setAllowedDistance] = useState(50);
  
  // حالات المواضيع
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setErrors({});
      setSelectedTopics([]); // تصفير الاختيارات الجديدة

      // 2. جلب المواضيع وحالتها لهذا الجدول الدراسي (lectureId = timetable_id)
      if (lectureId) {
        fetchTopicsStatus(lectureId);
      }
    }
  }, [open, classroomInfo, expectedCount, lectureId]);

  const fetchTopicsStatus = async (timetableId: string) => {
    setIsLoadingTopics(true);
    try {
      // نفترض وجود هذا الرابط في الباك إند (سأعطيك الكود الخاص به في الأسفل)
      const res = await api.get(`/v1/timetable/${timetableId}/topics-status`);
      setTopics(res.data.data || []);
    } catch (error) {
      console.error("فشل جلب المواضيع", error);
      // يمكن وضع مواضيع افتراضية أو تركها فارغة
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleTopicToggle = (topicId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTopics(prev => [...prev, topicId]);
    } else {
      setSelectedTopics(prev => prev.filter(id => id !== topicId));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (intervalSeconds < 5) newErrors.intervalSeconds = "الحد الأدنى 5 ثوانٍ.";
    if (validMinutes < 1) newErrors.validMinutes = "الحد الأدنى دقيقة واحدة.";
    if (!latitude || !longitude) newErrors.location = "إحداثيات القاعة غير متوفرة.";
    
    
    if (selectedTopics.length === 0) newErrors.topics = "يجب اختيار موضوع واحد على الأقل لبدء المحاضرة.";

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
        selectedTopics, 
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

        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-6">
          
          {/* قسم إعدادات المواضيع */}
          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <Label className="font-semibold text-base">مواضيع المحاضرة</Label>
            </div>
            
            {isLoadingTopics ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : topics.length > 0 ? (
              <ScrollArea className="h-[150px] w-full rounded-md border p-2 bg-background">
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <div 
                      key={topic.topic_id} 
                      className={`flex items-start gap-3 p-2 rounded-md transition-colors ${topic.is_covered ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-muted'}`}
                    >
                      <Checkbox 
                        id={`topic-${topic.topic_id}`}
                        checked={topic.is_covered || selectedTopics.includes(topic.topic_id)}
                        disabled={topic.is_covered} // 🔒 لا يمكن اختياره إذا تم شرحه
                        onCheckedChange={(checked) => !topic.is_covered && handleTopicToggle(topic.topic_id, checked === true)}
                        className={topic.is_covered ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 opacity-70" : ""}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={`topic-${topic.topic_id}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${topic.is_covered ? 'text-green-700 dark:text-green-400' : ''}`}
                        >
                          {topic.title}
                        </Label>
                        {topic.is_covered && (
                           <p className="text-[10px] text-green-600 dark:text-green-500 flex items-center gap-1">
                             <CheckCircle2 className="w-3 h-3" />
                             تم شرحه مسبقاً
                           </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد مواضيع مسجلة لهذه المادة.</p>
            )}
            {errors.topics && <p className="text-sm text-destructive">{errors.topics}</p>}
          </div>

          {/* قسم إعدادات QR (كما هو) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">تحديث (ثوانٍ)</Label>
              <Input id="interval" type="number" min={5} value={intervalSeconds} onChange={(e) => setIntervalSeconds(Number(e.target.value))} />
              {errors.intervalSeconds && <p className="text-xs text-destructive">{errors.intervalSeconds}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity">الصلاحية (دقيقة)</Label>
              <Input id="validity" type="number" min={1} value={validMinutes} onChange={(e) => setValidMinutes(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxScans">عدد الطلاب المتوقع</Label>
            <Input id="maxScans" type="number" min={1} value={maxScans} onChange={(e) => setMaxScans(Number(e.target.value))} />
          </div>
          
          <div className="space-y-2">
            <Label>الموقع الجغرافي للقاعة</Label>
            {latitude && longitude ? (
              <div className="p-3 border rounded-md bg-muted text-muted-foreground flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-500" />
                  <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Label htmlFor="distance" className="whitespace-nowrap">المسافة (م):</Label>
                   <Input 
                     id="distance" 
                     type="number" 
                     className="h-6 w-16 text-xs" 
                     min={1} 
                     value={allowedDistance} 
                     onChange={(e) => setAllowedDistance(Number(e.target.value))} 
                   />
                </div>
              </div>
            ) : (
              <div className="p-3 border border-destructive/50 rounded-md bg-destructive/10 text-destructive flex items-center justify-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>إحداثيات القاعة غير متوفرة</span>
              </div>
            )}
            {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!latitude || !longitude || selectedTopics.length === 0}>
             بدء المحاضرة ({selectedTopics.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}