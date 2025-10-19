import { AdminLayout } from "@/components/layout/AdminLayout";
import { AcademicStaffManagement } from "@/components/staff/AcademicStaffManagement";

export default function AcademicStaffPage() {
  return (
    <AdminLayout>
      <AcademicStaffManagement />
    </AdminLayout>
  );
}