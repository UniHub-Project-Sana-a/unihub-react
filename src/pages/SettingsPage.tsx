
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SystemSettings } from "@/components/settings/SystemSettings";

const SettingsPage = () => {
  return (
    <AdminLayout>
      <SystemSettings />
    </AdminLayout>
  );
};

export default SettingsPage;
