
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { TimetableManagement } from "@/components/timetable/TimetableManagement";

const TimetablePage = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<TimetableManagement />} />
        <Route path="import" element={<TimetableManagement />} />
        <Route path="view" element={<TimetableManagement />} />
        <Route path="mapping" element={<TimetableManagement />} />
        <Route path="*" element={<Navigate to="/timetable" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default TimetablePage;
