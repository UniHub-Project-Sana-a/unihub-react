import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, QrCode, CheckCircle, BatteryCharging, Loader2, MapPin, Building, HeartHandshake, RefreshCw  } from "lucide-react";
import { LectureSession } from "@/pages/LecturerPage"; // استيراد النوع الجديد
import { format, startOfWeek, endOfWeek, addDays, subDays, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface LectureScheduleProps {
  sessions: LectureSession[];
  onStartQR: (session: LectureSession) => void;
  isLoading: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  onRefresh: () => void;
}

export function LectureSchedule({ sessions, onStartQR, isLoading, viewDate, setViewDate, onRefresh }: LectureScheduleProps) {
    
  // تجميع الجلسات حسب التاريخ
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = session.date.slice(0, 10); // 'YYYY-MM-DD'
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, LectureSession[]>);

  // حساب أيام الأسبوع المعروض
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
      {/* لوحة التحكم بالأسبوع */}
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
  
      {/* عرض أيام الأسبوع والجلسات (مع تقسيم العرض) */}
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
              className={cn(
                  // إذا كان اليوم هو الجمعة، اجعله يمتد على عمودين
                  isFriday && 'lg:col-span-2'
              )}
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
                    if (session.isCurrent) {
                        badgeText = "جارية الآن";
                    }
  
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
                          
                          <div className="shrink-0 w-full sm:w-auto flex flex-col items-end">
                            {session.isAttended ? (
                              // 1. حالة المحاضرة المكتملة (كما هي)
                              <Button disabled variant="secondary" className="w-full sm:w-auto gap-2 cursor-not-allowed">
                                <CheckCircle className="w-4 h-4" /> {badgeText}
                              </Button>
                            ) : isPast ? (
                              // ✅ 2. التعديل الجديد: حالة "فاتت"
                              // قمنا بإضافة شرط isPast لعرض زر خاص باللون الأحمر ومعطل
                              <Button disabled variant="outline" className="w-full sm:w-auto gap-2 cursor-not-allowed border-destructive/50 text-destructive bg-destructive/10">
                                <Clock className="w-4 h-4" /> فاتت
                              </Button>
                            ) : (
                              // 3. حالة المحاضرة القادمة أو الحالية (زر البدء)
                              <Button 
                                onClick={() => onStartQR(session)} 
                                disabled={!session.isCurrent}
                                className="w-full sm:w-auto gap-2"
                              >
                                <QrCode className="w-4 h-4" /> بدء الحضور
                              </Button>
                            )}

                            {/* إخفاء النص المساعد إذا كانت المحاضرة قد فاتت */}
                            {!session.isCurrent && !session.isAttended && !isPast && (
                                <p className="text-xs text-muted-foreground mt-2">يبدأ التحضير مع وقت المحاضرة</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // عرض رسالة مخصصة بناءً على اليوم
                isFriday ? (
                  <Card className="border-dashed bg-teal-500/5 dark:bg-teal-500/10 border-teal-500/30">
                    <CardContent className="p-6 text-center">
                      <HeartHandshake className="w-10 h-10 mx-auto text-teal-500 mb-3" />
                      <p className="font-bold text-lg">جمعة مباركة</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        "خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ"
                      </p>
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
    </Card>
  );
}