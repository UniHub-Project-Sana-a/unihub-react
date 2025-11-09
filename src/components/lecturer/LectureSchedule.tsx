import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, QrCode, BatteryCharging, CheckCircle } from "lucide-react";
import { Lecture } from "@/pages/LecturerPage";

interface LectureScheduleProps {
  lectures: Lecture[];
  onStartQR: (lecture: Lecture) => void;
}

const normalizeDayName = (name?: string): string => {
  if (!name) return "";
  const s = name.trim().replace(/أ|إ|آ/g, "ا").toLowerCase();
  const map: Record<string, string> = {
    "الاحد": "الأحد", "الاثنين": "الاثنين", "الثلاثاء": "الثلاثاء",
    "الاربعاء": "الأربعاء", "الخميس": "الخميس", "الجمعه": "الجمعة", "السبت": "السبت",
  };
  for (const key in map) { if (s.includes(key)) return map[key]; }
  return name;
};

export function LectureSchedule({ lectures, onStartQR }: LectureScheduleProps) {
  const lecturesByDay = lectures.reduce((acc, lecture) => {
    const day = normalizeDayName(lecture.date);
    if (!acc[day]) acc[day] = [];
    acc[day].push(lecture);
    return acc;
  }, {} as Record<string, Lecture[]>);

  // ترتيب المحاضرات داخل كل يوم حسب وقت البداية
  for (const day in lecturesByDay) {
    lecturesByDay[day].sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  }
  
  const orderedDays = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  return (
    <Card className="p-4 md:p-6 backdrop-blur-sm bg-card/50">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary" />
        جدول المحاضرات الأسبوعي
      </h2>

      {lectures.length > 0 ? (
        <div className="space-y-6">
          {orderedDays.map((day) => {
            const dailyLectures = lecturesByDay[day];
            return (
              <div key={day}>
                <h3 className="text-xl font-semibold mb-3 border-b pb-2">{day}</h3>
                {dailyLectures && dailyLectures.length > 0 ? (
                  <div className="space-y-4">
                    {dailyLectures.map((lecture) => (
                      <Card
                        key={lecture.id}
                        className={`p-4 transition-all ${lecture.isCurrent ? "border-primary bg-primary/5" : "border-border bg-background/50"}`}
                      >
                        <div className="flex items-center sm:items-start justify-between gap-4 flex-col sm:flex-row">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold">{lecture.title}</h4>
                              {lecture.isCurrent && <Badge className="animate-pulse">جارية الآن</Badge>}
                              {lecture.isAttended && <Badge variant="secondary" className="border-green-500/50">تم تحضيرها</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {lecture.groupName}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {lecture.time}</span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 w-full sm:w-auto">
                            {/* ✅ --- التعديل النهائي هنا --- ✅ */}
                            {lecture.isAttended ? (
                              // إذا تم التحضير، اعرض زرًا معطلاً
                              <Button disabled variant="secondary" className="w-full sm:w-auto gap-2 cursor-not-allowed">
                                <CheckCircle className="w-4 h-4" />
                                تم التحضير
                              </Button>
                            ) : (
                              // وإلا، اعرض زر بدء الحضور العادي
                              <Button onClick={() => onStartQR(lecture)} className="w-full sm:w-auto gap-2">
                                <QrCode className="w-4 h-4" />
                                بدء الحضور
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed bg-card/30">
                    <CardContent className="p-6 text-center">
                      <BatteryCharging className="w-10 h-10 mx-auto text-green-500 mb-3" />
                      <p className="font-medium">يوم راحة!</p>
                      <p className="text-sm text-muted-foreground">لا توجد محاضرات مجدولة لهذا اليوم.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p className="font-semibold">لا توجد محاضرات مجدولة لك هذا الأسبوع.</p>
            <p className="text-sm">إذا كنت تعتقد أن هذا خطأ، يرجى مراجعة منسق القسم.</p>
        </div>
      )}
    </Card>
  );
}