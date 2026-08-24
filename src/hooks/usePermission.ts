import { useAuth } from "@/context/AuthContext";

export function usePermission() {
  const { user } = useAuth();

  // التحقق من صلاحية واحدة
  const can = (permissionKey: string) => {
    // 1. المشرف العام ورئاسة الجامعة يملكون كل شيء (Super Admin)
    if (user?.user_type_code === 'admin' || user?.user_type_code === 'presidency') {
      return true;
    }

    const permissionList = Array.isArray((user as any)?.permissions) ? (user as any).permissions : [];

    // 2. إذا لم يرسل الباك قائمة الصلاحيات الحالية، نستخدم نسخة متينة في الواجهة
    // حتى لا تختفي أزرار التعديل عند عدم وجود metadata للـ permissions.
    if (permissionList.length === 0) {
      return [
        'groups.create',
        'groups.update',
        'groups.delete',
        'students.add',
        'students.update',
        'students.delete',
      ].includes(permissionKey);
    }

    return permissionList.includes(permissionKey) || permissionList.includes('*');
  };

  // التحقق من أي صلاحية من مجموعة (OR)
  const canAny = (permissionKeys: string[]) => {
      return permissionKeys.some(key => can(key));
  };

  // التحقق من كل الصلاحيات (AND)
  const canAll = (permissionKeys: string[]) => {
      return permissionKeys.every(key => can(key));
  };

  return { can, canAny, canAll };
}