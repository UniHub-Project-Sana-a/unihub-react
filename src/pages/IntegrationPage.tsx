
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { IntegrationHub } from "@/components/integration/IntegrationHub";

const IntegrationPage = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<IntegrationHub />} />
        <Route path="mobile" element={<IntegrationHub />} />
        <Route path="api" element={<IntegrationHub />} />
        <Route path="monitor" element={<IntegrationHub />} />
        <Route path="*" element={<Navigate to="/integration" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default IntegrationPage;
