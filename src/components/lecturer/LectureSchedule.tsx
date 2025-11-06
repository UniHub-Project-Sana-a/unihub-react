// src/components/lecturer/LectureSchedule.tsx

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, QrCode } from "lucide-react";
import { Lecture } from "@/pages/LecturerPage"; // افترض أن الواجهة مستوردة من هنا

// 1. تعديل واجهة الـ Props
interface LectureScheduleProps {
  lectures: Lecture[];
  onStartQR: (lecture: Lecture) => void; // <-- الآن تستقبل كائن المحاضرة
}

export function LectureSchedule({ lectures, onStartQR }: LectureScheduleProps) {
  // تجميع المحاضرات حسب اليوم
  const lecturesByDay = lectures.reduce((acc, lecture) => {
    const day = lecture.date; // اسم اليوم الآن في خاصية date
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lecture);
    return acc;
  }, {} as Record<string, Lecture[]>);

  // ترتيب الأيام
  const orderedDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت", "الجمعة"];
  const sortedDays = Object.keys(lecturesByDay).sort((a, b) => {
    return orderedDays.indexOf(a) - orderedDays.indexOf(b);
  });
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary" />
        جدول المحاضرات الأسبوعي
      </h2>

      {sortedDays.length > 0 ? (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day}>
              <h3 className="text-xl font-semibold mb-3 border-b pb-2">{day}</h3>
              <div className="space-y-4">
                {lecturesByDay[day].map((lecture) => (
                  <Card
                    key={lecture.id}
                    className={`p-4 transition-all hover:shadow-md ${
                      lecture.isCurrent ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold">{lecture.title}</h4>
                          {lecture.isCurrent && (
                            <Badge className="bg-primary/20 text-primary border-primary">جارية الآن</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {lecture.groupName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {lecture.time}
                          </span>
                        </div>
                      </div>
                      {lecture.isCurrent && (
                        <Button onClick={() => onStartQR(lecture)} className="gap-2">
                          <QrCode className="w-4 h-4" />
                          بدء حضور QR
                        </Button>
                       )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          لا توجد محاضرات مجدولة لك.
        </p>
      )}
    </Card>
  );
}