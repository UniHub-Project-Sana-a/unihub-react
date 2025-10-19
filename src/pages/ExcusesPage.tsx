
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ExcuseManagement } from "@/components/excuses/ExcuseManagement";
import { PendingExcuses } from "@/components/excuses/PendingExcuses";

const ExcusesPage = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<ExcuseManagement />} />
        <Route path="pending" element={<PendingExcuses />} />
        <Route path="salary" element={<ExcuseManagement />} />
        <Route path="audit" element={<ExcuseManagement />} />
        <Route path="*" element={<Navigate to="/excuses" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default ExcusesPage;
