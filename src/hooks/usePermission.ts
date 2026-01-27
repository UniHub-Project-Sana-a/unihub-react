import { useAuth } from "@/context/AuthContext";

export function usePermission() {
  const { user } = useAuth();

  // التحقق من صلاحية واحدة
  const can = (permissionKey: string) => {
    // 1. المشرف العام ورئاسة الجامعة يملكون كل شيء (Super Admin)
    if (user?.user_type_code === 'admin' || user?.user_type_code === 'presidency') {
       return true; 
    }

    // 2. التحقق من القائمة القادمة من الباك إند
    // (سنقوم بتحديث واجهة المستخدم في AuthContext قريباً لتشمل permissions)
    return (user as any)?.permissions?.includes(permissionKey) ?? false;
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