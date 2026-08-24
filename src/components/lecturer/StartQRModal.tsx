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
  selectedTopics: number[];
}

interface ClassroomInfo {
  latitude: number | string | null;
  longitude: number | string | null;
  allowed_distance: number | string | null;
}

interface TopicItem {
  topic_id: number;
  title: string;
  unit_name?: string;
  part?: string;
  week?: number;
  subtopics?: string[];
  is_covered: boolean;
}

interface StartQRModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (settings: QRFormSettings) => void;
  lectureId: string | null; // هذا هو timetable_id
  courseId?: number | null;
  lectureType?: number | null;
  classroomInfo: ClassroomInfo | null;
  expectedCount: number;
}

export function StartQRModal({ open, onClose, onSubmit, lectureId, courseId, lectureType, classroomInfo, expectedCount }: StartQRModalProps) {
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
  }, [open, classroomInfo, expectedCount, lectureId, courseId, lectureType]);

  const fetchTopicsStatus = async (timetableId: string) => {
    setIsLoadingTopics(true);
    try {
      const partMap = ["نظري", "عملي", "تمارين", "سريري"];
      const targetPart = lectureType !== null && lectureType !== undefined ? partMap[Number(lectureType)] ?? "نظري" : "نظري";
      const normalizePart = (value?: string | null) => String(value ?? "").replace(/\s+/g, '').toLowerCase();

      let rawTopics: any[] = [];

      if (courseId) {
        const courseRes = await api.get(`/v1/courses/${courseId}/topics`);
        const data = courseRes.data?.topics ?? courseRes.data?.data ?? courseRes.data ?? [];
        rawTopics = Array.isArray(data) ? data : [];
      }

      if (!rawTopics.length && timetableId) {
        const timetableRes = await api.get(`/v1/timetable/${timetableId}/topics-status`);
        const data = timetableRes.data?.data ?? timetableRes.data ?? [];
        rawTopics = Array.isArray(data) ? data : [];
      }

      const filtered = rawTopics.filter((topic: any) => {
        const topicPart = topic.part ?? topic.unit_name ?? "";
        return normalizePart(topicPart) === normalizePart(targetPart) || normalizePart(topicPart) === normalizePart(String(topic.part || "")) || topic.unit_name || topic.title;
      });

      setTopics(filtered.length > 0 ? filtered : rawTopics);
    } catch (error) {
      console.error("فشل جلب المواضيع", error);
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleTopicToggle = (topicId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTopics(prev => prev.includes(topicId) ? prev : [...prev, topicId]);
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

        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-6">
          <div className="space-y-6">
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
                <ScrollArea className="h-[360px] w-full rounded-md border p-2 bg-background">
                  <div className="space-y-3">
                    {topics.map((topic) => {
                      const unitTitle = topic.unit_name || topic.title || "وحدة بدون عنوان";
                      const selectableItems = Array.isArray(topic.subtopics) && topic.subtopics.length > 0
                        ? topic.subtopics.map((subtopic, index) => ({
                            id: `${topic.topic_id}-${index}`,
                            label: subtopic,
                            parentId: topic.topic_id,
                          }))
                        : [{ id: `topic-${topic.topic_id}`, label: unitTitle, parentId: topic.topic_id }];

                      return (
                        <div
                          key={topic.topic_id}
                          className={`rounded-md border p-3 transition-colors ${topic.is_covered ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/80' : 'bg-muted/10 hover:bg-muted/30'}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-medium">عنوان الوحدة</p>
                              <p className="text-sm font-semibold leading-relaxed break-words text-foreground">{unitTitle}</p>
                            </div>
                            {topic.is_covered && (
                              <p className="text-[10px] text-green-600 dark:text-green-500 flex items-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" />
                                تم شرحه مسبقاً
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            {selectableItems.map((item) => {
                              const isChecked = topic.is_covered || selectedTopics.includes(item.parentId);

                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-start gap-3 rounded-md border p-2 ${isChecked ? 'bg-primary/5 border-primary/30' : 'bg-background/70'}`}
                                >
                                  <Checkbox
                                    id={item.id}
                                    checked={isChecked}
                                    disabled={topic.is_covered}
                                    onCheckedChange={(checked) => !topic.is_covered && handleTopicToggle(item.parentId, checked === true)}
                                    className={topic.is_covered ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 opacity-70" : ""}
                                  />
                                  <Label
                                    htmlFor={item.id}
                                    className={`text-sm leading-relaxed break-words cursor-pointer flex-1 ${topic.is_covered ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}
                                  >
                                    {item.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">لا توجد مواضيع مسجلة لهذه المادة.</p>
              )}
              {errors.topics && <p className="text-sm text-destructive">{errors.topics}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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