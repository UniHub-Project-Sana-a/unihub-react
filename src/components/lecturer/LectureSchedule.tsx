import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, Users, QrCode, CheckCircle, 
  BatteryCharging, Loader2, MapPin, Building, 
  HeartHandshake, RefreshCw, Printer, CalendarPlus, CheckCircle2, XCircle, Info,
   Paperclip, Youtube, FileText, UploadCloud ,  Link as LinkIcon , Trash2, X , Plus
} from "lucide-react";
import { LectureSession } from "@/pages/LecturerPage";
import { format, startOfWeek, endOfWeek, addDays, subDays, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { AttendanceReportSheet, ReportStudent } from "@/components/reports/AttendanceReportSheet";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { RequestMakeupDialog } from "@/components/lecturer/RequestMakeupDialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast"; 

interface LectureScheduleProps {
  sessions: LectureSession[];
  onStartQR: (session: LectureSession) => void;
  isLoading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  onRefresh: () => void;
  lecturerName: string; 
  collegeId?: string | number;
  lecturerId?: number;
}

export function LectureSchedule({ 
    sessions, 
    onStartQR, 
    isLoading, 
    viewDate, 
    setViewDate, 
    onRefresh, 
    lecturerName,
    collegeId,
    lecturerId
}: LectureScheduleProps) {
    
  const { toast } = useToast();
  const printComponentRef = useRef<HTMLDivElement>(null);

  const [isPrintingId, setIsPrintingId] = useState<string | null>(null);

  // حالات الجلسة التعويضية
  const [isMakeupRequestOpen, setIsMakeupRequestOpen] = useState(false);
  const [makeupSession, setMakeupSession] = useState<any>(null); // الجلسة التي نريد تعويضها

  // تعريف الحالات (States) - يفضل وضعها في بداية المكون
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [attachments, setAttachments] = useState([]); // قائمة المرفقات المضافة
const [videoInput, setVideoInput] = useState("");
const [linkInput, setLinkInput] = useState("");
const [isUploading, setIsUploading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const fileRef = useRef(null);

// دوال المعالجة
const addVideo = () => {
    if (!videoInput) return;
    setAttachments([...attachments, { id: Date.now(), type: 'video', name: 'فيديو شرح', value: videoInput }]);
    setVideoInput("");
};

const addLink = () => {
    if (!linkInput) return;
    setAttachments([...attachments, { id: Date.now(), type: 'link', name: 'رابط خارجي', value: linkInput }]);
    setLinkInput("");
};

const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // محاكاة رفع الملف
    setTimeout(() => {
        setAttachments([...attachments, { 
            id: Date.now(), 
            type: 'file', 
            name: file.name, 
            value: (file.size / 1024 / 1024).toFixed(2) + ' MB' 
        }]);
        setIsUploading(false);
    }, 1500);
};

const removeAttachment = (id) => {
    setAttachments(attachments.filter(item => item.id !== id));
};

const handleSave = () => {
    setIsSaving(true);
    // محاكاة حفظ البيانات للسيرفر
    setTimeout(() => {
        setIsSaving(false);
        setIsDialogOpen(false);
        setAttachments([]);
        toast({ title: "تم الحفظ", description: "تمت إضافة المرفقات بنجاح." });
    }, 1500);
};
  
  // ✅ تعديل الـ State ليحمل وقتين
  const [printData, setPrintData] = useState<{
    session: LectureSession | null;
    students: ReportStudent[];
    presentCount: number;
    absentCount: number;
    printTime: string;   // وقت الطباعة
  }>({
    session: null,
    students: [],
    presentCount: 0,
    absentCount: 0,
    printTime: ""
  });

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: printData.session 
        ? `Attendance_${printData.session.title}_${printData.session.date}` 
        : "Attendance_Report",
    onAfterPrint: () => {
        setIsPrintingId(null);
        setPrintData(prev => ({ ...prev, session: null }));
    }
  });

    // --- دالة تجهيز البيانات والطباعة ---
  const prepareAndPrint = async (session: LectureSession) => {
    setIsPrintingId(session.id);
    
    try {
        // ------------------------------------------------------------------
        // الخطوة 1: جلب قائمة جميع طلاب المجموعة
        // ------------------------------------------------------------------
        const groupRes = await api.get(`/v1/student-groups/${session.groupId}/students`);
        const allStudents = groupRes.data.data || groupRes.data || [];

        // ------------------------------------------------------------------
        // الخطوة 2: تجهيز باراميترات البحث عن سجلات الحضور
        // ------------------------------------------------------------------
        const params: any = {
            per_page: 1000 
        };

        if (session.sessionCode) {
            params.session_code = session.sessionCode;
        } else {
            params.timetable_id = session.timetableId;
            params.attendance_date = session.date;
        }

        // ------------------------------------------------------------------
        // الخطوة 3: جلب سجلات الحضور من السيرفر
        // ------------------------------------------------------------------
        const attendanceRes = await api.get('/v1/student-attendance', { params });
        const attendanceRecords = attendanceRes.data.data || attendanceRes.data || [];

        // ------------------------------------------------------------------
        // الخطوة 4: المطابقة ودمج البيانات (Mapping)
        // ------------------------------------------------------------------
        const finalReportStudents: ReportStudent[] = allStudents.map((student: any) => {
            
            const sID = String(student.student_id);
            const record = attendanceRecords.find((r: any) => String(r.student_id) === sID);
            
            // الطالب حاضر فقط إذا وجد السجل والحالة = 1
            const isPresent = record && Number(record.status) === 1;

            return {
                name: student.user?.full_name || student.name || "طالب",
                id: String(student.user?.academic_number || student.academic_number),
                status: isPresent ? 'present' : 'absent',
                method: isPresent ? (record.method || 'QR') : '-', 
            };
        });

        // التحقق من وجود بيانات
        if (finalReportStudents.length === 0) {
            toast({ title: "تنبيه", description: "لا يوجد طلاب في هذه المجموعة.", variant: "destructive" });
            setIsPrintingId(null);
            return;
        }

        // ------------------------------------------------------------------
        // الخطوة 5: حساب الإحصائيات والترتيب
        // ------------------------------------------------------------------
        const presentCount = finalReportStudents.filter(s => s.status === 'present').length;
        const absentCount = finalReportStudents.length - presentCount;

        const sortedStudents = finalReportStudents.sort((a, b) => {
            if (a.status === 'present' && b.status === 'absent') return -1;
            if (a.status === 'absent' && b.status === 'present') return 1;
            return a.name.localeCompare(b.name);
        });

        // ------------------------------------------------------------------
        // الخطوة 6: حفظ البيانات وتفعيل الطباعة (مبسط)
        // ------------------------------------------------------------------
        setPrintData({
            session: session,
            students: sortedStudents,
            presentCount,
            absentCount,
            // وقت الطباعة الحالي بصيغة (08:30 ص)
            printTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });

        // تأخير بسيط لضمان تحديث الـ DOM قبل فتح نافذة الطباعة
        setTimeout(() => {
            handlePrint();
        }, 300);

    } catch (error) {
        console.error("Error fetching report data", error);
        toast({ 
            title: "خطأ", 
            description: "فشل جلب بيانات التقرير.", 
            variant: "destructive" 
        });
        setIsPrintingId(null);
    }
  };


  // --- تجميع الجلسات حسب التاريخ (كما هو) ---
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = session.date.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, LectureSession[]>);

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 6 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  if (isLoading) {
      return (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
  }

  // -----------------------------------------------------------
  // 🌟 دالة ذكية للتحقق من الوقت (تتعامل مع كل صيغ البيانات)
  // -----------------------------------------------------------
  const checkTimeBuffer = (session: LectureSession) => {
    const s = session as any;
      
      // 1. التحقق من تاريخ اليوم (يجب أن تكون المحاضرة اليوم)
      // نستخدم مقارنة التواريخ المحلية لضمان الدقة
      const now = new Date();
      const sessDate = new Date(session.date);
      const isSameDay = now.getDate() === sessDate.getDate() &&
                        now.getMonth() === sessDate.getMonth() &&
                        now.getFullYear() === sessDate.getFullYear();

      if (!isSameDay) return false;

      // 2. استخراج الساعات والدقائق
      let startH = 0, startM = 0, endH = 0, endM = 0;
      let foundTimes = false;

      // أ) المحاولة الأولى: قراءة start_time المباشر
      if (s.start_time && s.end_time) {
          [startH, startM] = s.start_time.split(':').map(Number);
          [endH, endM] = s.end_time.split(':').map(Number);
          foundTimes = true;
      } 
      // ب) المحاولة الثانية: تحليل النص الموجود في session.time (مثال: "08:00 - 10:00")
      else if (s.time && s.time.includes('-')) {
          try {
              const parts = s.time.split('-'); // ["08:00 ", " 10:00"]
            if (parts.length === 2) {
                const startPart = parts[0].trim(); // "08:00"
                const endPart = parts[1].trim();   // "10:00"
                
                // دعم صيغة AM/PM إذا وجدت، أو 24 ساعة
                // هنا نفترض الصيغة البسيطة HH:mm
                [startH, startM] = startPart.replace(/[^\d:]/g, '').split(':').map(Number);
                [endH, endM] = endPart.replace(/[^\d:]/g, '').split(':').map(Number);
                
                // تصحيح بسيط: إذا كانت الساعة 08 مساءً مكتوبة 08، قد تحتاج منطق AM/PM
                // لكن غالباً الجداول الجامعية تستخدم 24 ساعة أو صباحاً افتراضياً
                foundTimes = true;
            }
        } catch (e) {
            console.error("Error parsing time string:", s.time);
        }
    }
    if (!foundTimes) {
        // إذا فشلنا في معرفة الوقت، نعود للحالة الافتراضية
        return session.isCurrent;
    }
    // 3. الحسابات
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    // 4. 🔥 طباعة للتصحيح (افتح Console المتصفح لترى هذا)
    // console.log(`Checking ${session.title}: Now=${currentMinutes}, Start-10=${startTotal - 10}, End+10=${endTotal + 10}`);
    // 5. النتيجة النهائية: هل نحن داخل النافذة؟
    return currentMinutes >= (startTotal - 10) && currentMinutes <= (endTotal + 10);
  };

  return (
    <Card className="p-4 md:p-6 backdrop-blur-sm bg-card/50">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                جدول الجلسات الأسبوعي
            </h2>
            <p className="text-sm text-muted-foreground">
                {format(startOfWeek(viewDate, { weekStartsOn: 6 }), 'd MMMM', { locale: ar })} - {format(endOfWeek(viewDate, { weekStartsOn: 6 }), 'd MMMM yyyy', { locale: ar })}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setViewDate(subDays(viewDate, 7))} variant="outline">السابق</Button>
            <Button onClick={() => setViewDate(new Date())} variant="secondary">الحالي</Button>
            <Button onClick={() => setViewDate(addDays(viewDate, 7))} variant="outline">التالي</Button>
            <Button onClick={onRefresh} variant="ghost" size="icon" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>
  
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-8">
        {weekDays.map((day) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const dayName = format(day, 'eeee', { locale: ar });
          const isFriday = dayName === 'الجمعة';
          
          const dailySessions = sessionsByDate[dayString] || [];
          dailySessions.sort((a, b) => a.time.localeCompare(b.time));
  
          return (
            <div 
              key={dayString}
              className={cn(isFriday && 'lg:col-span-2')}
            >
              <h3 className="text-xl font-semibold mb-3 border-b pb-2 flex justify-between">
                <span>{dayName}</span>
                <span className="text-muted-foreground">{format(day, 'd/M')}</span>
              </h3>
              {dailySessions.length > 0 ? (
                <div className="space-y-4">
                  {dailySessions.map((session) => {
  
                    // 1. استدعاء دالة التحقق من الوقت
                    const isWithinBuffer = checkTimeBuffer(session);
                  
                    // حساب إذا كانت الجلسة في الماضي (أيام سابقة)
                    const isDatePast = new Date(session.date) < new Date() && !isToday(new Date(session.date));
                    
                    // حساب إذا كانت الجلسة اليوم ولكن انتهى وقتها + المهلة
                    // (هذا يعتمد على أن الدالة تعيد false إذا انتهى الوقت والمهلة)
                    const isTimePastToday = isToday(new Date(session.date)) && !isWithinBuffer && !session.isCurrent && (function() {
                        // منطق إضافي بسيط لمعرفة هل الوقت "فات" فعلاً اليوم
                        const s = session as any;
                        const endTimeStr = s.end_time || s.endTime;
                        if (!endTimeStr) return false;
                        const [endH, endM] = endTimeStr.split(':').map(Number);
                        const now = new Date();
                        return (now.getHours() * 60 + now.getMinutes()) > (endH * 60 + endM + 10);
                    })();
                  
                    // نعتبرها "فاتت" إذا كانت في يوم سابق أو انتهى وقتها اليوم
                    const isPast = isDatePast || isTimePastToday;
                  
                    let cardClass = "";
                    let badgeText = "مجدولة";
                    
                    // تحديد النصوص والألوان
                    if (session.isCurrent || isWithinBuffer) badgeText = "جارية الآن";
                  
                    if (isPast) {
                        if (session.status !== 0) {
                            cardClass = "bg-green-100/50 dark:bg-green-900/30 border-green-500/50";
                            badgeText = "مكتملة";
                        } else {
                            cardClass = "bg-red-100/50 dark:bg-red-900/30 border-red-500/50";
                            badgeText = "فاتت";
                        }
                    }
                  
                    return (
                      <Card
                        key={session.id}
                        className={cn(
                            "p-4 transition-all",
                            // التنسيق الأساسي للحالة (جارية / مجدولة)
                            session.isCurrent || isWithinBuffer ? "border-primary bg-primary/5" : "border-border bg-background/50",
                            // إضافة التنسيق الخاص بالتعويض (حدود برتقالية وخلفية صفراء خفيفة)
                            session.isMakeup && !session.isCurrent && !isWithinBuffer && !isPast && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10 border-dashed border-2",
                            cardClass
                        )}
                      >
                        <div className="flex items-center sm:items-start justify-between gap-4 flex-col sm:flex-row">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg font-semibold">{session.title}</h4>
                              
                              {/* الشارة (Badge) */}
                              {(session.isCurrent || isWithinBuffer) && <Badge className="animate-pulse">{badgeText}</Badge>}
                              
                              {/* شارة الحالة العادية */}
                              {session.isAttended && !session.isCurrent && !isWithinBuffer && (
                                  <Badge variant={isPast && session.status !== 0 ? 'secondary' : 'outline'}>{badgeText}</Badge>
                              )}
                      
                              {/* ✅ شارة "تعويضية" جديدة ومميزة */}
                              {session.isMakeup && (
                                  <Badge className="bg-amber-500 hover:bg-amber-600 border-0 text-white">
                                      تعويضية
                                  </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                               <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {session.groupName}</span>
                               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {session.time}</span>
                               <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {session.classroomName} ({session.buildingName})</span>
                               <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {session.departmentName}</span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 w-full sm:w-auto flex flex-col items-end gap-2">
    
                                    {/* ======================================================== */}
    {/* ✅ زر المرفقات (التصميم الأول + تفاعلي + الترتيب الجديد) */}
    {/* ======================================================== */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
            <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
                <Paperclip className="w-4 h-4" /> مرفقات المحاضرة
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader className="text-right">
                <DialogTitle>إضافة مرفقات</DialogTitle>
                <DialogDescription>
                    قم بإضافة مصادر المحاضرة بالترتيب أدناه.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
                
                {/* 1. قسم الفيديو */}
                <div className="grid gap-2">
                    <Label className="flex items-center gap-2 text-foreground/80">
                        <Youtube className="w-4 h-4 text-red-500" /> فيديو
                    </Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="ضع رابط الفيديو هنا..." 
                            className="text-left ltr" 
                            value={videoInput}
                            onChange={(e) => setVideoInput(e.target.value)}
                        />
                        <Button variant="secondary" size="icon" onClick={addVideo} disabled={!videoInput}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* 2. قسم ملف العرض (الرفع) */}
                <div className="grid gap-2">
                    <Label className="flex items-center gap-2 text-foreground/80">
                        <FileText className="w-4 h-4 text-orange-500" /> ملف العرض
                    </Label>
                    <div 
                        onClick={() => !isUploading && fileRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isUploading ? "bg-muted border-muted-foreground/20" : "border-muted-foreground/25 hover:bg-accent/50 hover:border-blue-400"
                        }`}
                    >
                        <input type="file" className="hidden" ref={fileRef} onChange={handleFileUpload} />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 animate-pulse">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="text-xs text-muted-foreground">جاري الرفع...</span>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">اضغط لرفع ملف العرض (PPTX, PDF)</p>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. قسم الرابط */}
                <div className="grid gap-2">
                    <Label className="flex items-center gap-2 text-foreground/80">
                        <LinkIcon className="w-4 h-4 text-blue-500" /> رابط
                    </Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="https://example.com" 
                            className="text-left ltr" 
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                        />
                        <Button variant="secondary" size="icon" onClick={addLink} disabled={!linkInput}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* عرض القائمة المضافة (تفاعلي) */}
                {attachments.length > 0 && (
                    <div className="mt-2 space-y-2 border-t pt-4">
                        <Label className="text-xs text-muted-foreground">تمت إضافتها ({attachments.length})</Label>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto pl-1">
                            {attachments.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md border text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {item.type === 'video' && <Youtube className="w-4 h-4 text-red-500 shrink-0" />}
                                        {item.type === 'file' && <FileText className="w-4 h-4 text-orange-500 shrink-0" />}
                                        {item.type === 'link' && <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />}
                                        <div className="flex flex-col truncate">
                                            <span className="font-medium truncate">{item.name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate dir-ltr text-right">{item.value}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeAttachment(item.id)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <DialogFooter className="sm:justify-start gap-2">
                <Button onClick={handleSave} disabled={isSaving || isUploading || attachments.length === 0} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                    حفظ المرفقات
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    {/* ======================================================== */}
                          
                              {session.isAttended ? (
                                  <div className="flex gap-2 w-full sm:w-auto">
                                  <Button disabled variant="secondary" className="flex-1 gap-2 cursor-not-allowed">
                                      <CheckCircle className="w-4 h-4" /> {badgeText}
                                  </Button>
                                  <Button 
                                      variant="outline" 
                                      size="icon" 
                                      className="bg-background"
                                      title="طباعة كشف الحضور" 
                                      onClick={() => prepareAndPrint(session)}
                                      disabled={isPrintingId !== null}
                                  >
                                      {isPrintingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                  </Button>
                                  </div>
                              
                              ) : (isPast && !isWithinBuffer) ? (
                                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                                  <div className="flex gap-2">
                                      <Button disabled variant="outline" className="flex-1 gap-2 cursor-not-allowed border-destructive/50 text-destructive bg-destructive/10">
                                          <Clock className="w-4 h-4" /> فاتت
                                      </Button>
                                      <Button 
                                          variant="outline" 
                                          size="icon" 
                                          className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive bg-background"
                                          title="طباعة كشف الغياب"
                                          onClick={() => prepareAndPrint(session)}
                                          disabled={isPrintingId !== null}
                                      >
                                          {isPrintingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                      </Button>
                                  </div>
                                  
                                  {/* ✅ الزر الذكي: طلب تعويض أو عرض الحالة */}
                                  {session.makeupRequest ? (
                                      // الحالة 1: يوجد طلب مسبق -> نعرض الحالة
                                      <Button 
                                          size="sm" 
                                          variant="outline"
                                          className={cn(
                                              "gap-2 h-8 w-full border cursor-default", 
                                              session.makeupRequest.status === 0 && "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100", 
                                              session.makeupRequest.status === 1 && "text-green-600 border-green-200 bg-green-50 hover:bg-green-100", 
                                              session.makeupRequest.status === 2 && "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" 
                                          )}
                                          onClick={() => {
                                              toast({
                                                  title: session.makeupRequest?.status === 0 ? "طلب قيد المراجعة" : 
                                                          session.makeupRequest?.status === 1 ? "تمت الموافقة" : "تم رفض الطلب",
                                                  description: session.makeupRequest?.status === 0 
                                                      ? "الطلب بانتظار موافقة رئيس القسم/العميد." 
                                                      : session.makeupRequest?.status === 1 
                                                          ? `تم اعتماد التعويض بتاريخ ${session.makeupRequest.requestedDate}`
                                                          : "عذراً، تم رفض طلب التعويض لهذه المحاضرة.",
                                                  variant: session.makeupRequest?.status === 2 ? "destructive" : "default"
                                              });
                                          }}
                                      >
                                          {session.makeupRequest.status === 0 && <Clock className="w-4 h-4 animate-pulse" />}
                                          {session.makeupRequest.status === 1 && <CheckCircle2 className="w-4 h-4" />}
                                          {session.makeupRequest.status === 2 && <XCircle className="w-4 h-4" />}
                                          
                                          {session.makeupRequest.status === 0 ? "قيد المراجعة" : 
                                              session.makeupRequest.status === 1 ? "تمت الموافقة" : "مرفوض"}
                                      </Button>
                                  ) : (
                                      // الحالة 2: لا يوجد طلب -> زر التقديم (القديم)
                                      <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-2 h-8 w-full border border-amber-200"
                                          onClick={() => {
                                              setMakeupSession(session);
                                              setIsMakeupRequestOpen(true);
                                          }}
                                      >
                                          <CalendarPlus className="w-4 h-4" /> طلب تعويض
                                      </Button>
                                  )}
                                  </div>
                              
                              ) : (
                                  <Button 
                                  onClick={() => onStartQR(session)} 
                                  disabled={!isWithinBuffer}
                                  className={cn(
                                      "w-full sm:w-auto gap-2",
                                      session.isMakeup && isWithinBuffer && "bg-amber-600 hover:bg-amber-700"
                                  )}
                                  >
                                  <QrCode className="w-4 h-4" /> بدء الحضور
                                  </Button>
                              )}
                          
                              {!isWithinBuffer && !session.isAttended && !isPast && (
                                  <p className="text-xs text-muted-foreground">متاح قبل 10د من البدء وحتى 10د بعد الانتهاء</p>
                              )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                isFriday ? (
                  <Card className="border-dashed bg-teal-500/5 dark:bg-teal-500/10 border-teal-500/30">
                    <CardContent className="p-6 text-center">
                      <HeartHandshake className="w-10 h-10 mx-auto text-teal-500 mb-3" />
                      <p className="font-bold text-lg">جمعة مباركة</p>
                      <p className="text-sm text-muted-foreground mt-2">"خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ"</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed bg-card/30">
                    <CardContent className="p-6 text-center">
                      <BatteryCharging className="w-10 h-10 mx-auto text-green-500 mb-3" />
                      <p className="font-medium">يوم راحة!</p>
                      <p className="text-sm text-muted-foreground">لا توجد جلسات مجدولة لهذا اليوم.</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "none" }}>
        {printData.session && (
            <AttendanceReportSheet 
                ref={printComponentRef}
                lectureTitle={printData.session.title}
                groupName={printData.session.groupName}
                lecturerName={lecturerName}
                classroomName={printData.session.classroomName}
                buildingName={printData.session.buildingName}
                date={printData.session.date.slice(0, 10)} 
                
                // ✅ نمرر الوقت والعنوان المناسب
                time={printData.printTime}
                timeLabel="وقت الطباعة"
                
                studentsList={printData.students}
                presentCount={printData.presentCount}
                absentCount={printData.absentCount}
                collegeId={collegeId}
            />
        )}
      </div>

      {/* ✅✅ هنا يتم وضع المودال الجديد */}
      {makeupSession && (
        <RequestMakeupDialog
          isOpen={isMakeupRequestOpen}
          onClose={() => {
            setIsMakeupRequestOpen(false);
            setMakeupSession(null);
          }}
          session={makeupSession}
          lecturerId={lecturerId || 0} 
          lecturerName={lecturerName}
        />
      )}

    </Card>
  );
}