
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ReportsManagement } from "@/components/reports/ReportsManagement";

const ReportsPage = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<ReportsManagement />} />
        <Route path="financial" element={<ReportsManagement />} />
        <Route path="teaching" element={<ReportsManagement />} />
        <Route path="attendance" element={<ReportsManagement />} />
        <Route path="grades" element={<ReportsManagement />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default ReportsPage;
