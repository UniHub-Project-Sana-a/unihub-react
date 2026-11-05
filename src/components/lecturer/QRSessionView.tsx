// src/components/lecturer/QRSessionView.tsx

import { Card } from "@/components/ui/card";
import { QRFallbackView } from "./QRFallbackView";
import { AttendanceRecord, ActiveQRInfo } from "@/pages/LecturerPage";

interface QRSettings {
  intervalSeconds: number;
  validMinutes: number;
}

interface QRSessionViewProps {
  settings: QRSettings;
  lectureTitle: string;
  groupName: string;
  lectureId: string;
  sessionStorageKey: string;
  initialQR: ActiveQRInfo;
  onActiveQRChange: (qr: ActiveQRInfo) => void;
  onEndSession: (records: AttendanceRecord[]) => void;
}

export function QRSessionView({
  settings,
  lectureTitle,
  groupName,
  lectureId,
  sessionStorageKey,
  initialQR,
  onActiveQRChange,
  onEndSession,
}: QRSessionViewProps) {

  return (
    <Card className="p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">{lectureTitle}</h2>
        <p className="text-xl text-primary font-semibold">{groupName}</p>
        <p className="text-muted-foreground mt-2">جلسة الحضور نشطة. اعرض الرمز للطلاب.</p>
      </div>
      
      <div className="mt-6">
        <QRFallbackView
          settings={settings}
          initialQR={initialQR}
          lectureId={lectureId}
          sessionStorageKey={sessionStorageKey}
          onActiveQRChange={onActiveQRChange}
          onEndSession={onEndSession}
        />
      </div>
    </Card>
  );
}