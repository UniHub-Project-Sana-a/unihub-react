import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CourseManagement } from "@/components/courses/CourseManagement";

export default function CourseManagementPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<CourseManagement />} />
        <Route path="departments" element={<CourseManagement />} />
        <Route path="grades" element={<CourseManagement />} />
        <Route path="export" element={<CourseManagement />} />
        <Route path="*" element={<Navigate to="/course-management" replace />} />
      </Routes>
    </AdminLayout>
  );
}