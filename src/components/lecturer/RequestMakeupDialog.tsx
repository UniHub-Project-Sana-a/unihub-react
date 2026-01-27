import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RequestMakeupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: any; // الجلسة الفائتة
  lecturerId: number; // معرف المحاضر
  lecturerName: string
}

export function RequestMakeupDialog({ isOpen, onClose, session, lecturerId, lecturerName }: RequestMakeupDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  // Periods State 
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  
  // Form State
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [reasonType, setReasonType] = useState("");
  const [description, setDescription] = useState("");

  // جلب القاعات عند الفتح
  useEffect(() => {
    if (isOpen) {
        api.get('/v1/classrooms').then(res => {
            setClassrooms(res.data.data || res.data);
        }).catch(() => console.error("Failed to load classrooms"));
    }
  }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
          // جلب القاعات
          api.get('/v1/classrooms').then(res => {
              setClassrooms(res.data.data || res.data);
          }).catch(() => console.error("Failed to load classrooms"));
  
          // ✅ جلب الفترات
          api.get('/v1/periods').then(res => {
              setPeriods(res.data.data || res.data);
          }).catch(() => console.error("Failed to load periods"));
      }
    }, [isOpen]);

    const handleSubmit = async () => {
      console.log("Submitting makeup request..."); // 1. تأكد أن الدالة تعمل
  
      // التحقق من الحقول الإجبارية في الفورم
      if (!date || !startTime || !endTime || !reasonType) {
          toast({ title: "تنبيه", description: "يرجى تعبئة جميع الحقول المطلوبة (التاريخ، الوقت، السبب)", variant: "destructive" });
          return;
      }
  
      // استخراج الـ IDs
      const cId = session.courseId || session.timetable?.course_id || session.course_id;
      const gId = session.groupId || session.timetable?.group_id || session.group_id;
  
      // فحص البيانات قبل الإرسال
      if (!lecturerId) {
          console.error("Missing lecturerId", lecturerId);
          toast({ title: "خطأ", description: "رقم المحاضر مفقود. يرجى إعادة تحميل الصفحة.", variant: "destructive" });
          return;
      }
      if (!cId) {
          console.error("Missing courseId", session);
          toast({ title: "خطأ", description: "رقم المادة مفقود في بيانات الجلسة.", variant: "destructive" });
          return;
      }
      if (!gId) {
          console.error("Missing groupId", session);
          toast({ title: "خطأ", description: "رقم المجموعة مفقود في بيانات الجلسة.", variant: "destructive" });
          return;
      }
  
      setIsSubmitting(true);
      try {
          const payload = {
              lecturer_id: Number(lecturerId),
              course_id: Number(cId),
              group_id: Number(gId),
              original_date: session.date,
              requested_date: format(date, 'yyyy-MM-dd'),
              start_time: startTime,
              end_time: endTime,
              classroom_id: classroomId,
              reason_type: reasonType,
              description: description
          };
  
          console.log("Sending payload:", payload); // 2. اطبع البيانات المرسلة
  
          await api.post('/v1/makeup-lectures', payload);
  
          toast({ title: "تم الإرسال", description: "تم إرسال طلب التعويض للإدارة بنجاح." });
          onClose();
      } catch (error: any) {
          console.error("API Error:", error); // 3. اطبع خطأ الـ API
          const errorMsg = error.response?.data?.message || error.message || "فشل غير معروف";
          toast({ title: "خطأ", description: errorMsg, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
    };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            طلب محاضرة تعويضية
          </DialogTitle>
          <DialogDescription>
            تقديم طلب لتعويض المحاضرة الفائتة بتاريخ {session.date}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            
            {/* 1. بيانات المحاضرة الأصلية (للقراءة فقط) */}
            <div className="bg-muted/30 p-4 rounded-lg border border-dashed grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 border-b pb-2 mb-2"> {/* ✅ صف كامل للاسم */}
                    <span className="text-muted-foreground block text-xs">اسم المحاضر</span>
                    <span className="font-bold text-primary">{lecturerName}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs">المقرر الدراسي</span>
                    <span className="font-bold">{session.title}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs">المجموعة</span>
                    <span className="font-bold">{session.groupName}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs">التاريخ الأصلي</span>
                    <span className="font-mono">{session.date}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs">التوقيت الأصلي</span>
                    <span className="font-mono">{session.time}</span>
                </div>
            </div>

            {/* 2. بيانات الموعد المقترح */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">الموعد الجديد المقترح</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* التاريخ */}
                    <div className="space-y-2">
                        <Label>تاريخ التعويض <span className="text-red-500">*</span></Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ar }) : <span>اختر التاريخ</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={(date) => date < new Date()} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* القاعة */}
                    <div className="space-y-2">
                        <Label>القاعة المقترحة</Label>
                        <Select value={classroomId} onValueChange={setClassroomId}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر القاعة" />
                            </SelectTrigger>
                            <SelectContent>
                                {classrooms.map((room) => (
                                    <SelectItem key={room.classroom_id} value={String(room.classroom_id)}>
                                        {room.classroom_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* اختيار الفترة الزمنية */}
                <div className="space-y-2">
                    <Label>الفترة الزمنية <span className="text-red-500">*</span></Label>
                    <Select 
                        value={selectedPeriodId} 
                        onValueChange={(val) => {
                            setSelectedPeriodId(val);
                            // البحث عن الفترة المختارة لضبط الوقت تلقائياً
                            const period = periods.find(p => String(p.period_id) === val);
                            if (period) {
                                // نفترض أن الباك إند يعيد start_time و end_time بتنسيق HH:mm:ss
                                // نأخذ أول 5 حروف (HH:mm) لتناسب الـ input time
                                setStartTime(period.start_time.slice(0,5)); 
                                setEndTime(period.end_time.slice(0,5));
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الفترة" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (
                                <SelectItem key={p.period_id} value={String(p.period_id)}>
                                    {p.period_name} ({p.start_time.slice(0,5)} - {p.end_time.slice(0,5)})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 3. سبب التعويض */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">تفاصيل الطلب</h3>
                
                <div className="space-y-2">
                    <Label>سبب الغياب/التعويض <span className="text-red-500">*</span></Label>
                    <Select value={reasonType} onValueChange={setReasonType}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر السبب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sick_leave">إجازة مرضية / عذر طبي</SelectItem>
                            <SelectItem value="travel">سفر / مهمة رسمية</SelectItem>
                            <SelectItem value="official_holiday">إجازة رسمية / أعياد</SelectItem>
                            <SelectItem value="schedule_conflict">تعارض في الجدول</SelectItem>
                            <SelectItem value="event">فعالية / مؤتمر بالكلية</SelectItem>
                            <SelectItem value="maintenance">صيانة القاعات / المعامل</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>ملاحظات إضافية</Label>
                    <Textarea 
                        placeholder="اكتب تفاصيل إضافية هنا..." 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="resize-none"
                    />
                </div>
            </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
            {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            إرسال الطلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}