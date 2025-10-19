import { AdminLayout } from "@/components/layout/AdminLayout";
import AccessControl from "@/components/users/AccessControl";

const AccessControlPage = () => {
  return (
    <AdminLayout>
      <AccessControl />
    </AdminLayout>
  );
};

export default AccessControlPage;