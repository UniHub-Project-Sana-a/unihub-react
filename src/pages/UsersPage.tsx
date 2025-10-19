
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserManagement } from "@/components/users/UserManagement";

const UsersPage = () => {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
};

export default UsersPage;
