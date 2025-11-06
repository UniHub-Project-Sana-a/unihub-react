import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { QRFallbackView } from "./QRFallbackView";
import { QRSession3DView } from "./QRSession3DView"; // يمكنك إضافته لاحقًا
import { QRSettings, AttendanceRecord, ActiveQRInfo } from "@/pages/LecturerPage"; // استورد الواجهات الجديدة

// 1. تحديث واجهة الـ Props
interface QRSessionViewProps {
  settings: QRSettings;
  lectureTitle: string;
  groupName: string;
  lectureId: string;
  initialQR: ActiveQRInfo;
  onEndSession: (records: AttendanceRecord[]) => void;
}

export function QRSessionView({
  settings,
  lectureTitle,
  groupName,
  lectureId,
  initialQR,
  onEndSession,
}: QRSessionViewProps) {
  // للتبسيط، سنستخدم العرض ثنائي الأبعاد فقط حاليًا
  const [use3D, setUse3D] = useState(false); 

  useEffect(() => {
    // يمكنك إعادة تفعيل التحقق من WebGL إذا أردت استخدام العرض ثلاثي الأبعاد
    // const canvas = document.createElement("canvas");
    // const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    // setUse3D(!!gl);
  }, []);

  return (
    <Card className="p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">{lectureTitle}</h2>
        <p className="text-xl text-primary font-semibold">{groupName}</p>
        <p className="text-muted-foreground mt-2">جلسة الحضور نشطة. اعرض الرمز للطلاب.</p>
      </div>
      
      <div className="mt-6">
        {use3D ? (
          <QRSession3DView
            settings={settings}
            initialQR={initialQR}
            lectureId={lectureId}
            onEndSession={onEndSession}
          />
        ) : (
          // 2. تمرير كل الخصائص اللازمة إلى المكون الفرعي
          <QRFallbackView
            settings={settings}
            initialQR={initialQR}
            lectureId={lectureId}
            onEndSession={onEndSession}
          />
        )}
      </div>
    </Card>
  );
}