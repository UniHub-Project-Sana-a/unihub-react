import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, Users, QrCode, CheckCircle, 
  BatteryCharging, Loader2, MapPin, Building, 
  HeartHandshake, RefreshCw, Printer, CalendarPlus, CheckCircle2, XCircle, Info,
   Paperclip, Youtube, FileText, UploadCloud ,  Link as LinkIcon , Trash2, X , Plus,
   LogOut, Pencil, PlayCircle 
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
  const [videoInput, setVideoInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);
  
  // States للإنهاء
  const [isEndSessionOpen, setIsEndSessionOpen] = useState(false);
  const [selectedSessionToEnd, setSelectedSessionToEnd] = useState<LectureSession | null>(null);
  const [earlyExitReason, setEarlyExitReason] = useState("");
  const [isEnding, setIsEnding] = useState(false);
  const [isEarlyExit, setIsEarlyExit] = useState(false); // هل هو خروج مبكر؟
  const [timeElapsed, setTimeElapsed] = useState(""); // للعرض في النافذة
  // ✅ 1. State حقيقي للمرفقات
  const [realAttachments, setRealAttachments] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [editingAttachmentId, setEditingAttachmentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", url: "" });
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  

  // دالة فتح نافذة الإنهاء (التحقق الذكي)
const handleOpenEndSession = (session: LectureSession) => {
    setSelectedSessionToEnd(session);
    setEarlyExitReason("");
    
    if (session.actual_start_time) {
        // 1. وقت البدء (من السيرفر - UTC)
        const serverDate = new Date(session.actual_start_time);
        
        // 2. الوقت الحالي (من جهازك - Local)
        const now = new Date();

        // 🔥 التصحيح اليدوي 🔥
        // نحسب فرق التوقيت بين جهازك وبين UTC بالدقائق
        // getTimezoneOffset() يعيد الفرق بالدقائق (مثلاً -180 لليمن/السعودية)
        const timezoneOffsetMinutes = now.getTimezoneOffset();
        
        // نحول وقت السيرفر (UTC) إلى وقتك المحلي يدوياً
        // نطرح الفرق (لأن الدالة تعيد العكس: UTC - Local)
        // مثال: 3:00 UTC - (-180) = 3:00 + 3 ساعات = 6:00 Local
        // أو العكس، نحول وقتك الحالي إلى UTC لنقارنه بوقت السيرفر
        
        // الأسهل: نستخدم توقيت UTC للطرفين
        const startTimestamp = serverDate.getTime(); // هذا دائماً UTC Epoch
        
        // لكن مهلاً، المشكلة أن new Date(string) قد يضيف التوقيت المحلي تلقائياً إذا لم يكن هناك Z
        // لنفترض أن السيرفر يرسل "2026-02-27 03:00:00"
        
        // الحل الأضمن: تجاهل التاريخ والاعتماد على الفارق الزمني النسبي
        // لكن بما أننا لا نستطيع، سنقوم بالحل التالي:
        
        // نحسب الفرق بالميلي ثانية
        let diffMs = now.getTime() - serverDate.getTime();
        
        // إذا كان الفرق أكبر من ساعة (بسبب الـ Timezone)، نقوم بالتصحيح
        // إذا كان الفارق قريباً من 3 ساعات (180 دقيقة)، نطرحها
        const diffMinsRaw = diffMs / (1000 * 60);
        
        // تصحيح الانزياح: إذا كان الفارق ضخماً (مثلاً 180 دقيقة = 3 ساعات)، فهذا خطأ توقيت
        // نقوم بطرح فرق التوقيت (offset) من الناتج
        // ملاحظة: getTimezoneOffset يعيد القيمة معكوسة (مثلاً -180 للمناطق الشرقية)
        let finalDiffMinutes = diffMinsRaw;
        
        // إذا كانت النتيجة غير منطقية (مثلاً 58 دقيقة وأنت بدأت قبل دقيقة)، 
        // فهذا يعني أن المتصفح لم يحول وقت السيرفر، بل اعتبره محلياً.
        // سنفترض أننا بحاجة لإزالة "دقائق الساعة الحالية" ونعتمد على الفارق النسبي
        
        // 🔥 الحل البسيط: إعادة ضبط تاريخ البدء ليكون "الآن" ناقصاً المدة المتوقعة 🔥
        // لا، هذا غش. الحل الصحيح:
        
        // بما أنك تقول (الساعة 3:58 وهو يقول مضى 58 دقيقة)، فهذا يعني أنه اعتبر وقت البدء 3:00.
        // بينما أنت بدأت المحاضرة فعلياً الساعة 3:55 مثلاً؟
        
        // إذا كنت بدأت المحاضرة الساعة 3:40 (حسب رسالتك السابقة)
        // والساعة الآن 3:58. الفرق = 18 دقيقة.
        // لماذا يظهر 58؟ لأن السيرفر أرسل 3:00 (وقت UTC ربما؟)
        
        // إذن: السيرفر يرسل وقت البدء "ناقصاً" عن وقتك الحقيقي.
        // الحل: إضافة فرق التوقيت (3 ساعات) لوقت البدء القادم من السيرفر.
        
        const correctedStartDate = new Date(serverDate.getTime() - (timezoneOffsetMinutes * 60 * 1000));
        
        // نعيد الحساب مع الوقت المصحح
        // لكن مهلاً، في حالتك، الرقم (58) يوحي بأن وقت البدء هو 3:00 بالضبط.
        // هل وقت البدء الفعلي هو 3:00؟ أم 3:40؟
        // إذا كان 3:40، والفرق 58، فهذا يعني أن "الآن" هو 4:38؟
        
        // ---------------------------------------------------------
        // ✅ الكود النهائي (الذي يحلل المشكلة ويعالجها)
        // ---------------------------------------------------------
        
        // نحسب الفرق العادي
        let diffMinutes = (now.getTime() - serverDate.getTime()) / (1000 * 60);
        
        // إذا كان الفرق سلبياً (المستقبل)، نجعله صفراً
        if (diffMinutes < 0) diffMinutes = 0;

        // 4. جلب القيم من الجدول
        const durationHours = Number(session.lecture_hours || 2); 
        const allowancePerHr = Number(session.timetable?.allowance_minutes || 15); 
        
        const totalDurationMins = durationHours * 60;
        const totalAllowance = durationHours * allowancePerHr;
        const requiredMinutes = totalDurationMins - totalAllowance;

        // 5. المقارنة
        if (diffMinutes < requiredMinutes) {
            setIsEarlyExit(true); 
        } else {
            setIsEarlyExit(false); 
        }
        
        const hrs = Math.floor(diffMinutes / 60);
        const mins = Math.floor(diffMinutes % 60);
        setTimeElapsed(`${hrs} ساعة و ${mins} دقيقة`);

    } else {
        setIsEarlyExit(false); 
        setTimeElapsed("غير معروف");
    }

    setIsEndSessionOpen(true);
};
  
  // دالة تنفيذ الإنهاء (مع GPS)
  const confirmEndSession = async () => {
      if (isEarlyExit && !earlyExitReason.trim()) {
          toast({ title: "تنبيه", description: "يرجى ذكر سبب إنهاء المحاضرة قبل وقتها.", variant: "destructive" });
          return;
      }
  
      setIsEnding(true);

      // 1. التحقق من حالة صلاحية الموقع قبل طلبه
      if (!navigator.geolocation) {
          toast({ title: "خطأ", description: "المتصفح لا يدعم تحديد الموقع.", variant: "destructive" });
          setIsEnding(false);
          return;
      }

      try {
          if (navigator.permissions && navigator.permissions.query) {
              const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

              if (status.state === 'denied') {
                  toast({
                      title: "تم رفض الوصول للموقع",
                      description: "المتصفح منع طلب الموقع. افتح إعدادات الموقع في المتصفح ثم أعد المحاولة.",
                      variant: "destructive"
                  });
                  setIsEnding(false);
                  return;
              }

              if (status.state === 'prompt') {
                  toast({
                      title: "السماح للوصول للموقع",
                      description: "يرجى الموافقة على الوصول إلى الموقع لتأكيد إتمام المحاضرة.",
                      variant: "default"
                  });
              }
          } else {
              toast({
                  title: "السماح للوصول للموقع",
                  description: "يرجى الموافقة على الوصول إلى الموقع لتأكيد إتمام المحاضرة.",
                  variant: "default"
              });
          }
      } catch (permissionError) {
          console.warn("Permission query failed, falling back to geolocation request", permissionError);
          toast({
              title: "السماح للوصول للموقع",
              description: "يرجى الموافقة على الوصول إلى الموقع لتأكيد إتمام المحاضرة.",
              variant: "default"
          });
      }
  
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              try {
                  // 2. إرسال الطلب للسيرفر
                  await api.post(`/v1/sessions/${selectedSessionToEnd?.id}/finish`, {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                      early_exit_reason: isEarlyExit ? earlyExitReason : null
                  });
  
                  toast({ title: "تم الإنهاء", description: "تم تسجيل وقت وموقع الانتهاء بنجاح." });
                  setIsEndSessionOpen(false);
                  onRefresh(); // تحديث الجدول لتختفي الأزرار وتتغير الحالة
              } catch (error) {
                  toast({ title: "فشل الإنهاء", description: "حدث خطأ أثناء الاتصال بالسيرفر.", variant: "destructive" });
              } finally {
                  setIsEnding(false);
              }
          },
          (error) => {
              console.error(error);

              if (error.code === error.PERMISSION_DENIED) {
                  toast({
                      title: "تم رفض الوصول للموقع",
                      description: "تم رفض الوصول إلى الموقع من المتصفح. افتح إعدادات الموقع في المتصفح ثم أعد المحاولة.",
                      variant: "destructive"
                  });
              } else {
                  toast({ title: "فشل تحديد الموقع", description: "يرجى السماح للموقع بالعمل.", variant: "destructive" });
              }

              setIsEnding(false);
          },
          { enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0 
           } // دقة عالية
      );
  };
  // ✅ 2. دالة جلب المرفقات عند فتح النافذة
  const fetchAttachments = async (sessionId: number) => {
      setIsAttachmentsLoading (true);
      try {
          const res = await api.get(`/v1/sessions/${sessionId}/attachments`);
          setRealAttachments(res.data);
      } catch (e) { console.error(e); } 
      finally { setIsAttachmentsLoading (false); }
  };
  
  // ✅ 3. دالة الحفظ الحقيقية
  const handleRealSave = async (type: 'link' | 'video' | 'file', value: string | File) => {
      if (!selectedSessionId) return;
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append('session_id', String(selectedSessionId));
      formData.append('type', type);
      
      // تحديد العنوان والقيمة
      if (type === 'file') {
          formData.append('file', value);
          formData.append('title', (value as File).name);
      } else {
          formData.append('url', value as string);
          formData.append('title', type === 'video' ? 'فيديو توضيحي' : 'رابط خارجي');
      }
  
      try {
          const res = await api.post('/v1/attachments', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // تحديث القائمة فوراً
          setRealAttachments([res.data, ...realAttachments]);
          toast({ title: "تم الإضافة", description: "تم حفظ المرفق بنجاح" });
          
          // تصفير الحقول
          setVideoInput("");
          setLinkInput("");
      } catch (error) {
          toast({ title: "فشل الحفظ", description: "تأكد من الملف أو الرابط", variant: "destructive" });
      } finally {
          setIsUploading(false);
      }
  };
  
  // ✅ 4. دالة الحذف الحقيقية
  const handleRealDelete = async (id: number) => {
      try {
          await api.delete(`/v1/attachments/${id}`);
          setRealAttachments(realAttachments.filter(a => a.attachment_id !== id));
          toast({ title: "تم الحذف" });
      } catch (e) { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const handleUpdateAttachment = async (id: number) => {
      try {
          const res = await api.put(`/v1/attachments/${id}`, editForm);
          
          // تحديث القائمة المحلية
          setRealAttachments(realAttachments.map(att => 
              att.attachment_id === id ? res.data : att
          ));
          
          setEditingAttachmentId(null);
          toast({ title: "تم التعديل بنجاح" });
      } catch (e) {
          toast({ title: "فشل التعديل", variant: "destructive" });
      }
  };
  
  const startEditing = (attachment: any) => {
      setEditingAttachmentId(attachment.attachment_id);
      setEditForm({ title: attachment.title, url: attachment.url });
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


    // --- تجميع الجلسات حسب التاريخ (مع إصلاح التوقيت) ---
  const sessionsByDate = sessions.reduce((acc, session) => {
    // نأخذ التاريخ كنص كما جاء من السيرفر بالضبط (أول 10 خانات)
    // السيرفر سيرسله الآن "2026-02-22"، لذلك لن يتغير اليوم أبداً
    const dateKey = session.date.substring(0, 10); 

    if (!acc[dateKey]) acc[dateKey] = [];
    
    // منع التكرار
    const exists = acc[dateKey].some(s => s.id === session.id);
    if (!exists) {
        acc[dateKey].push(session);
    }
    
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
                            {/* 1. زر المرفقات (دائماً موجود ومتاح) */}
                            {/* ======================================================== */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full sm:w-auto gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => {
                                            const sId = Number(session.id);
                                            setSelectedSessionId(sId);
                                            fetchAttachments(sId);
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        <Paperclip className="w-4 h-4" /> مرفقات المحاضرة
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                                    <DialogHeader className="text-right">
                                        <DialogTitle>إدارة مرفقات المحاضرة</DialogTitle>
                                        <DialogDescription>
                                            أضف روابط أو ملفات، ويمكنك تعديلها لاحقاً.
                                        </DialogDescription>
                                    </DialogHeader>
                            
                                    <div className="grid gap-5 py-4">
                                        {/* 1. فيديو */}
                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2 text-foreground/80"><Youtube className="w-4 h-4 text-red-500" /> رابط فيديو</Label>
                                            <div className="flex gap-2">
                                                <Input placeholder="https://youtube.com/..." className="text-left ltr" value={videoInput} onChange={(e) => setVideoInput(e.target.value)} />
                                                <Button variant="secondary" size="icon" onClick={() => handleRealSave('video', videoInput)} disabled={!videoInput || isUploading}><Plus className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                            
                                        {/* 2. ملف */}
                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2 text-foreground/80"><FileText className="w-4 h-4 text-orange-500" /> ملف العرض</Label>
                                            <div onClick={() => !isUploading && fileRef.current?.click()} className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:bg-accent/50 border-muted-foreground/25">
                                                <input type="file" className="hidden" ref={fileRef} accept=".pdf,.pptx,.ppt,.docx,.doc" onChange={(e) => { if (e.target.files?.[0]) handleRealSave('file', e.target.files[0]); }} />
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center gap-2 animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span className="text-xs text-muted-foreground">جاري الرفع...</span></div>
                                                ) : (
                                                    <div className="flex items-center gap-2"><UploadCloud className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">اضغط لرفع ملف</span></div>
                                                )}
                                            </div>
                                        </div>
                            
                                        {/* 3. رابط */}
                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2 text-foreground/80"><LinkIcon className="w-4 h-4 text-blue-500" /> رابط خارجي</Label>
                                            <div className="flex gap-2">
                                                <Input placeholder="https://example.com" className="text-left ltr" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} />
                                                <Button variant="secondary" size="icon" onClick={() => handleRealSave('link', linkInput)} disabled={!linkInput || isUploading}><Plus className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                            
                                        {/* 4. القائمة */}
                                        <div className="mt-2 space-y-2 border-t pt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <Label className="text-xs text-muted-foreground font-bold">المرفقات الحالية ({realAttachments.length})</Label>
                                                {isAttachmentsLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                                            </div>
                                            
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pl-1 pr-1 custom-scrollbar">
                                                {realAttachments.length === 0 && !isAttachmentsLoading && (
                                                    <p className="text-center text-xs text-muted-foreground py-4">لا توجد مرفقات مضافة.</p>
                                                )}
                            
                                                {realAttachments.map((item) => (
                                                    <div key={item.attachment_id} className="flex flex-col gap-2 bg-muted/30 p-2 rounded-md border text-sm hover:bg-muted/50 transition-colors">
                                                        {editingAttachmentId === item.attachment_id ? (
                                                            <div className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                                <Input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} placeholder="العنوان" className="h-8 bg-white" autoFocus />
                                                                {item.type !== 'file' && (
                                                                    <Input value={editForm.url} onChange={(e) => setEditForm({...editForm, url: e.target.value})} placeholder="الرابط" className="h-8 ltr bg-white" />
                                                                )}
                                                                <div className="flex gap-2 justify-end mt-1">
                                                                    <Button size="sm" className="h-7 text-xs" onClick={() => handleUpdateAttachment(item.attachment_id)}>حفظ</Button>
                                                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingAttachmentId(null)}>إلغاء</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                                    <div className="shrink-0 p-1.5 bg-white rounded border shadow-sm">
                                                                        {item.type === 'video' ? <Youtube className="w-4 h-4 text-red-500" /> : item.type === 'file' ? <FileText className="w-4 h-4 text-orange-500" /> : <LinkIcon className="w-4 h-4 text-blue-500" />}
                                                                    </div>
                                                                    <div className="flex flex-col truncate flex-1">
                                                                        <a href={item.url} target="_blank" rel="noreferrer" className="font-medium truncate hover:underline text-primary text-sm" title={item.title}>{item.title}</a>
                                                                        <span className="text-[10px] text-muted-foreground truncate dir-ltr text-right flex items-center gap-1">
                                                                            {item.type === 'file' ? item.file_size : new URL(item.url).hostname}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEditing(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => handleRealDelete(item.attachment_id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                            
                                    <DialogFooter className="sm:justify-start gap-2 border-t pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full">إغلاق</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        
                            {/* ======================================================== */}
                            {/* 2. منطق الأزرار الذكي (حسب الحالة) */}
                            {/* ======================================================== */}
                        
                            {/* الحالة: جارية (Status 2) -> زر إنهاء المحاضرة */}
                            {session.status === 2 && (
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full sm:w-auto gap-2 animate-pulse hover:animate-none shadow-md"
                                    onClick={() => handleOpenEndSession(session)}
                                >
                                    <LogOut className="w-4 h-4" /> إنهاء المحاضرة
                                </Button>
                            )}
                        
                            {/* الحالة: منتهية (Status 1) -> زر الطباعة */}
                            {session.status === 1 ? (
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button disabled variant="secondary" className="flex-1 gap-2 cursor-not-allowed border-green-200 bg-green-50 text-green-700">
                                        <CheckCircle2 className="w-4 h-4" /> تم الإنهاء
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        title="طباعة كشف الحضور" 
                                        onClick={() => prepareAndPrint(session)}
                                        disabled={isPrintingId !== null}
                                    >
                                        {isPrintingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                    </Button>
                                </div>
                        
                            ) : (isPast && !isWithinBuffer && session.status !== 2) ? (
                                // الحالة: فاتت ولم تبدأ -> خيارات التعويض والطباعة
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
                                    
                                    {/* زر طلب التعويض */}
                                    {session.makeupRequest ? (
                                        <Button size="sm" variant="outline" className={cn("gap-2 h-8 w-full border cursor-default", session.makeupRequest.status === 0 && "text-amber-600 border-amber-200 bg-amber-50", session.makeupRequest.status === 1 && "text-green-600 border-green-200 bg-green-50", session.makeupRequest.status === 2 && "text-red-600 border-red-200 bg-red-50")} onClick={() => toast({ title: "حالة الطلب", description: session.makeupRequest?.status === 0 ? "قيد المراجعة" : session.makeupRequest?.status === 1 ? "مقبول" : "مرفوض" })}>
                                            {session.makeupRequest.status === 0 ? "قيد المراجعة" : session.makeupRequest.status === 1 ? "تمت الموافقة" : "مرفوض"}
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-2 h-8 w-full border border-amber-200" onClick={() => { setMakeupSession(session); setIsMakeupRequestOpen(true); }}>
                                            <CalendarPlus className="w-4 h-4" /> طلب تعويض
                                        </Button>
                                    )}
                                </div>
                        
                            ) : (session.status === 0 || session.status === undefined) && (
                                // الحالة: مجدولة (وقت الحضور) -> زر بدء الحضور
                                <Button 
                                    onClick={() => onStartQR(session)} 
                                    disabled={!isWithinBuffer} 
                                    className={cn("w-full sm:w-auto gap-2 shadow-sm", session.isMakeup && isWithinBuffer && "bg-amber-600 hover:bg-amber-700")}
                                >
                                    <QrCode className="w-4 h-4" /> بدء الحضور
                                </Button>
                            )}
                        
                            {!isWithinBuffer && !session.isAttended && !isPast && session.status !== 2 && (
                                <p className="text-xs text-muted-foreground">متاح قبل 10د من البدء</p>
                            )}
                        
                            {/* نافذة الإنهاء (Dialog) */}
                            <Dialog open={isEndSessionOpen} onOpenChange={setIsEndSessionOpen}>
                                <DialogContent dir="rtl" className="sm:max-w-[550px] gap-0 p-0 overflow-hidden border-0 shadow-xl">
                                    
                                    {/* 1. رأس النافذة */}
                                    <div className={cn(
                                        "p-6 flex flex-col items-center justify-center text-center gap-3 border-b relative",
                                        isEarlyExit ? "bg-amber-50/80" : "bg-primary/5"
                                    )}>
                                        <div className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-4 border-white",
                                            isEarlyExit ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                                        )}>
                                            {isEarlyExit ? <Clock className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <DialogTitle className={cn("text-xl font-bold tracking-tight", isEarlyExit ? "text-amber-900" : "text-primary")}>
                                                {isEarlyExit ? "إنهاء مبكر للمحاضرة" : "اكتمال وقت المحاضرة"}
                                            </DialogTitle>
                                            <DialogDescription className="text-muted-foreground text-sm max-w-sm mx-auto">
                                                سيتم إغلاق الجلسة وتوثيق التوقيت والموقع الجغرافي.
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 space-y-6 bg-white">
                                        
                                        {/* 2. بطاقات المعلومات (وقت البدء + المدة + المطلوب) */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* وقت البدء */}
                                            <div className="bg-muted/30 p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-center">
                                                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                                                    <PlayCircle className="w-3 h-3 hidden sm:block" /> وقت البدء
                                                </span>
                                                <span className="text-sm sm:text-base font-bold font-mono text-foreground dir-ltr">
                                                    {selectedSessionToEnd?.actual_start_time 
                                                        ? new Date(selectedSessionToEnd.actual_start_time).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})
                                                        : '--:--'}
                                                </span>
                                            </div>
                
                                            {/* المدة المنقضية (الحالية) */}
                                            <div className={cn(
                                                "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors",
                                                isEarlyExit ? "bg-amber-50 border-amber-200" : "bg-primary/5 border-primary/20"
                                            )}>
                                                <span className={cn("text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1", isEarlyExit ? "text-amber-700" : "text-primary")}>
                                                    <Clock className="w-3 h-3 hidden sm:block" /> قضيت
                                                </span>
                                                <span className={cn("text-sm sm:text-base font-black font-mono dir-ltr", isEarlyExit ? "text-amber-600" : "text-primary")}>
                                                    {timeElapsed}
                                                </span>
                                            </div>
                
                                            {/* ✅ البطاقة الجديدة: الحد الأدنى المطلوب */}
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 text-center">
                                                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 flex items-center justify-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 hidden sm:block" /> المطلوب
                                                </span>
                                                <span className="text-sm sm:text-base font-bold font-mono text-slate-700 dir-ltr">
                                                    {(() => {
                                                        const h = Number(selectedSessionToEnd?.lecture_hours || 2);
                                                        const allow = Number(selectedSessionToEnd?.timetable?.allowance_minutes || 15);
                                                        const reqMins = (h * 60) - (h * allow);
                                                        const rH = Math.floor(reqMins / 60);
                                                        const rM = reqMins % 60;
                                                        return `${rH}:${String(rM).padStart(2, '0')}`;
                                                    })()} ساعة
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* 3. حقل السبب (يظهر فقط عند الخروج المبكر) */}
                                        {isEarlyExit && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                                    <div className="flex items-center gap-2 mb-2 text-amber-800">
                                                        <Info className="w-4 h-4" />
                                                        <Label className="font-bold text-sm">سبب الخروج المبكر (إلزامي)</Label>
                                                    </div>
                                                    <textarea 
                                                        placeholder="يرجى كتابة توضيح مختصر لسبب إنهاء المحاضرة قبل الوقت المحدد..." 
                                                        value={earlyExitReason}
                                                        onChange={(e) => setEarlyExitReason(e.target.value)}
                                                        className="w-full resize-none focus-visible:ring-amber-500 min-h-[100px] bg-white border-amber-200 text-sm shadow-sm"
                                                    />
                                                    <p className="text-[10px] text-amber-600/80 mt-2">
                                                        * الوقت القانوني للمحاضرة لم يكتمل بعد.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                
                                        {/* مؤشر التحميل */}
                                        {isEnding && (
                                            <div className="flex items-center justify-center gap-3 text-primary bg-primary/5 p-4 rounded-xl text-sm animate-pulse border border-primary/10">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="font-medium">جاري التحقق من الموقع (GPS) والحفظ...</span>
                                            </div>
                                        )}
                                    </div>
                
                                    {/* 4. الأزرار */}
                                    <DialogFooter className="p-6 pt-2 gap-3 sm:gap-0 bg-white border-t border-slate-50">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setIsEndSessionOpen(false)} 
                                            disabled={isEnding}
                                            size="lg"
                                            className="w-full sm:w-auto"
                                        >
                                            تراجع
                                        </Button>
                                        <Button 
                                            className={cn(
                                                "w-full sm:w-auto shadow-md min-w-[160px]",
                                                isEarlyExit ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90"
                                            )}
                                            onClick={confirmEndSession}
                                            disabled={isEnding}
                                            size="lg"
                                        >
                                            {isEarlyExit ? "تأكيد السبب وإنهاء" : "اعتماد وإنهاء الجلسة"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        
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