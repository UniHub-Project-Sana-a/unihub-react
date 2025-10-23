import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserType = { user_type_id: number; user_type_name: string; user_type_code: string; };
type Permission = { permission_id: number; permission_key: string; permission_name: string; };
type College = { college_id: number; college_name: string; };

export default function AddUserPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicNumber, setAcademicNumber] = useState('');
  const [gender, setGender] = useState<'0' | '1' | ''>('');
  const [userTypeId, setUserTypeId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<number[]>([]);
  const [applyPermissions, setApplyPermissions] = useState<boolean>(false);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [ut, perms, cols] = await Promise.all([
          axios.get('/api/v1/user-types', authHeader()),
          axios.get('/api/v1/permissions', authHeader()),
          axios.get('/api/v1/colleges', authHeader()),
        ]);
        setUserTypes(ut.data?.data ?? ut.data);
        setPermissions(perms.data?.data ?? perms.data);
        setColleges(cols.data?.data ?? cols.data);
      } catch (e: any) {
        console.error(e);
        setError('تعذر تحميل بيانات الأنواع/الصلاحيات/الكليات.');
      }
    };
    fetchLists();
  }, []);

  const authHeader = () => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const toggleArrayValue = (arr: number[], value: number): number[] =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== passwordConfirm) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    if (!userTypeId) {
      setError('يرجى اختيار نوع المستخدم.');
      return;
    }
    if (applyPermissions && (selectedPermissions.length === 0 || selectedColleges.length === 0)) {
      setError('لتطبيق الصلاحيات، اختر صلاحية واحدة على الأقل وكلية واحدة على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) إنشاء المستخدم
      const createRes = await axios.post('/api/v1/users', {
        full_name: fullName,
        email,
        phone,
        password,
        academic_number: academicNumber,
        gender: Number(gender), // 0 = ذكر, 1 = أنثى
        user_type_id: Number(userTypeId),
      }, authHeader());

      // 2) (اختياري) تعيين صلاحيات لنوع المستخدم المختار عبر الكليات المحددة
      if (applyPermissions) {
        await axios.post(`/api/v1/user-types/${userTypeId}/permissions/bulk-assign`, {
          permission_ids: selectedPermissions,
          college_ids: selectedColleges,
          mode: 'attach', // أو 'sync' لاحقاً حسب الحاجة
        }, authHeader());
      }

      setSuccess('تم إنشاء المستخدم بنجاح.');
      setFullName('');
      setEmail('');
      setPhone('');
      setAcademicNumber('');
      setGender('');
      setUserTypeId('');
      setPassword('');
      setPasswordConfirm('');
      setSelectedPermissions([]);
      setSelectedColleges([]);
      setApplyPermissions(false);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || 'حدث خطأ أثناء إنشاء المستخدم.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-xl border border-border/50 bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-foreground text-center">إضافة مستخدم جديد</CardTitle>
            <CardDescription className="text-center">
              تُطبّق الصلاحيات على مستوى "نوع المستخدم" (user_type) حسب السكيمة الحالية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Alerts */}
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic_number">الرقم الأكاديمي</Label>
                <Input id="academic_number" value={academicNumber} onChange={e => setAcademicNumber(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>الجنس</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as '0'|'1')}>
                  <SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">ذكر</SelectItem>
                    <SelectItem value="1">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المنصب / نوع المستخدم</Label>
                <Select value={userTypeId} onValueChange={(v) => setUserTypeId(v)}>
                  <SelectTrigger><SelectValue placeholder="اختر نوع المستخدم" /></SelectTrigger>
                  <SelectContent>
                    {userTypes.map(t => (
                      <SelectItem key={t.user_type_id} value={String(t.user_type_id)}>
                        {t.user_type_name} ({t.user_type_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">تأكيد كلمة المرور</Label>
                <Input id="password_confirm" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
              </div>

              {/* Permissions Section */}
              <div className="col-span-1 md:col-span-2 border rounded-md p-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox id="applyPerms" checked={applyPermissions} onCheckedChange={(v) => setApplyPermissions(Boolean(v))} />
                  <Label htmlFor="applyPerms" className="text-sm">تطبيق صلاحيات على نوع المستخدم المختار</Label>
                </div>

                {applyPermissions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">اختر الصلاحيات</p>
                      <div className="max-h-40 overflow-auto space-y-2 pr-2">
                        {permissions.map(p => (
                          <label key={p.permission_id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedPermissions.includes(p.permission_id)}
                              onCheckedChange={() => setSelectedPermissions(prev => toggleArrayValue(prev, p.permission_id))}
                            />
                            <span className="text-sm">{p.permission_name} ({p.permission_key})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">اختر الكليات لتطبيق الصلاحيات عليها</p>
                      <div className="max-h-40 overflow-auto space-y-2 pr-2">
                        {colleges.map(c => (
                          <label key={c.college_id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedColleges.includes(c.college_id)}
                              onCheckedChange={() => setSelectedColleges(prev => toggleArrayValue(prev, c.college_id))}
                            />
                            <span className="text-sm">{c.college_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  ملاحظة: تعيين الصلاحيات هنا يتم على مستوى نوع المستخدم (user_type) حسب قاعدة البيانات لديك.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ المستخدم'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}