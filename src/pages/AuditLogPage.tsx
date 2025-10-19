import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuditLog } from "@/components/audit/AuditLog";

export default function AuditLogPage() {
  return (
    <AdminLayout>
      <AuditLog />
    </AdminLayout>
  );
}