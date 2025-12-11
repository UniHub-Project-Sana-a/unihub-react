import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, Users, QrCode, CheckCircle, 
  BatteryCharging, Loader2, MapPin, Building, 
  HeartHandshake, RefreshCw, Printer 
} from "lucide-react";
import { LectureSession } from "@/pages/LecturerPage";
import { format, startOfWeek, endOfWeek, addDays, subDays, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { AttendanceReportSheet, ReportStudent } from "@/components/reports/AttendanceReportSheet";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LectureScheduleProps {
  sessions: LectureSession[];
  onStartQR: (session: LectureSession) => void;
  isLoading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  onRefresh: () => void;
  lecturerName: string; 
}

export function LectureSchedule({ 
    sessions, 
    onStartQR, 
    isLoading, 
    viewDate, 
    setViewDate, 
    onRefresh, 
    lecturerName 
}: LectureScheduleProps) {
    
  const { toast } = useToast();
  const printComponentRef = useRef<HTMLDivElement>(null);

  const [isPrintingId, setIsPrintingId] = useState<string | null>(null);
  
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
                    
                    const isPast = new Date(session.date) < new Date() && !isToday(new Date(session.date));
                    let cardClass = "";
                    let badgeText = "مجدولة";
                    if (session.isCurrent) badgeText = "جارية الآن";
  
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
                        className={`p-4 transition-all ${session.isCurrent ? "border-primary bg-primary/5" : "border-border bg-background/50"} ${cardClass}`}
                      >
                        <div className="flex items-center sm:items-start justify-between gap-4 flex-col sm:flex-row">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold">{session.title}</h4>
                              {session.isCurrent && <Badge className="animate-pulse">{badgeText}</Badge>}
                              {session.isAttended && !session.isCurrent && <Badge variant={isPast && session.status !== 0 ? 'secondary' : 'outline'}>{badgeText}</Badge>}
                            </div>
                            
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                               <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {session.groupName}</span>
                               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {session.time}</span>
                               <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {session.classroomName} ({session.buildingName})</span>
                               <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {session.departmentName}</span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 w-full sm:w-auto flex flex-col items-end gap-2">
                            
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
                            
                            ) : isPast ? (
                              <div className="flex gap-2 w-full sm:w-auto">
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

                            ) : (
                              <Button 
                                onClick={() => onStartQR(session)} 
                                disabled={!session.isCurrent}
                                className="w-full sm:w-auto gap-2"
                              >
                                <QrCode className="w-4 h-4" /> بدء الحضور
                              </Button>
                            )}

                            {!session.isCurrent && !session.isAttended && !isPast && (
                                <p className="text-xs text-muted-foreground">يبدأ التحضير مع وقت المحاضرة</p>
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
            />
        )}
      </div>

    </Card>
  );
}