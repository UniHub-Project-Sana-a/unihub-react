import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermission } from "@/hooks/usePermission";

interface AcademicStaff {
  id: string;               // lecturer_id
  userId: string;           // user_id
  fullName: string;         // users.full_name
  staffNumber: string;      // users.academic_number
  academicAffairsNumber?: string; // غير مستخدمة في DB - للعرض فقط
  academicRank: string;     // academic_titles.title_name
  academicTitleId?: string; // title_id
  employmentType: "متفرغ" | "غير متفرغ"; // نربطها بـ status (true/false)
  lectureRate: number;      // academic_titles.hourly_price (للعرض)
  address?: string;         // لا يوجد في DB - للعرض فقط
  phone?: string;           // users.phone
  email?: string;           // users.email
  notes?: string;           // للعرض فقط
  collegeId: string;        // lecturers.college_id
  departmentId?: string | null; // lecturers.department_id
  hireDate?: string;        // lecturers.hire_date
  canTeachExternally?: boolean;
}

interface Department {
  id: string;
  name: string;
  code?: string;
  collegeId: string;
}

interface Title {
  id: string;
  name: string;
  hourlyPrice: number;
  lecturePrice: number;
}

interface UserOption {
  id: string;          // user_id
  name: string;        // full_name
  email?: string;
  phone?: string;
  academicNumber?: string;
}

type StaffFormData = {
  userId: string; // حقل جديد لاختيار المستخدم
  fullName: string;
  staffNumber: string;
  academicAffairsNumber: string;
  academicRank: string;      // title_name
  academicTitleId: string;   // title_id
  departmentId: string;
  employmentType: "متفرغ" | "غير متفرغ";
  canTeachExternally: boolean;
  lectureRate: number;       // للعرض فقط من title
  address: string;
  phone: string;
  email: string;
  notes: string;
  hireDate: string;
};

interface EntitlementPeriod {
  from: string;
  to: string;
}

interface EntitlementReview {
  staffId: string;
  hoursWorked: number;
  hourlyRate: number;
  total: number;
}

interface EntitlementApproval {
  staffId: string;
  status: string;
  approvedBy: string;
  date: string;
}

interface EntitlementPayout {
  staffId: string;
  amount: number;
  method: string;
  ref: string;
  date: string;
  status: string;
}

interface Props {
  collegeId: string;
}

export default function AcademicStaffModule({ collegeId }: Props) {
  const { can } = usePermission();
  const { toast } = useToast();

  // Lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [collegeStaff, setCollegeStaff] = useState<AcademicStaff[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Entitlements UI state (واجهات فقط)
  const [entitlementStep, setEntitlementStep] = useState("1");
  const [entitlementPeriod, setEntitlementPeriod] = useState<EntitlementPeriod>({
    from: "",
    to: "",
  });
  const [entitlementReviews, setEntitlementReviews] = useState<EntitlementReview[]>([]);
  const [entitlementApprovals, setEntitlementApprovals] = useState<EntitlementApproval[]>([]);
  const [entitlementPayouts, setEntitlementPayouts] = useState<EntitlementPayout[]>([]);

  // Form state
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState<StaffFormData>({
    userId: "",
    fullName: "",
    staffNumber: "",
    academicAffairsNumber: "",
    academicRank: "",
    academicTitleId: "",
    departmentId: "",
    employmentType: "متفرغ",
    lectureRate: 0,
    address: "",
    phone: "",
    email: "",
    notes: "",
    hireDate: "",
    canTeachExternally: false,
  });

  const handleClickImportCsv = () => {
  // تأكد من وجود collegeId
  if (!collegeId) {
    toast({ title: "تنبيه", description: "الكلية غير محددة", variant: "destructive" });
    return;
  }
  fileInputRef.current?.click();
};

const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // تحقق من الامتداد
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  if (!isCsv) {
    toast({ title: "تنبيه", description: "الرجاء اختيار ملف CSV", variant: "destructive" });
    e.target.value = "";
    return;
  }

  try {
    setIsImportingCsv(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("college_id", collegeId); // لو الـ API يحتاج تمرير الكلية

    // نوصي بمسار مثل: POST /v1/lecturers/import-csv
    await api.post("/v1/lecturers/import-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast({ title: "نجاح", description: "تم استيراد أعضاء هيئة التدريس من CSV" });
    await fetchStaff();
  } catch (error: any) {
    const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل استيراد الملف";
    const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل استيراد الملف";
    toast({ title: "خطأ", description: String(msg), variant: "destructive" });
  } finally {
    setIsImportingCsv(false);
    // لتسمح برفع نفس الملف مرة أخرى
    e.target.value = "";
  }
};

  // Fetchers
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/v1/departments", { params: { college_id: collegeId } });
      const raw: any[] = res.data?.data ?? res.data;
      setDepartments(
        raw.map((d) => ({
          id: String(d.department_id),
          name: d.department_name,
          code: d.department_code || "",
          collegeId: String(d.college_id),
        }))
      );
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الأقسام", variant: "destructive" });
    }
  };

  const fetchTitles = async () => {
    try {
      // تأكد أن عندك resource academic-titles
      const res = await api.get("/v1/academic-titles", { params: { college_id: collegeId } });
      const raw: any[] = res.data?.data ?? res.data;
      setTitles(
        raw.map((t) => ({
          id: String(t.title_id),
          name: t.title_name,
          hourlyPrice: Number(t.hourly_price ?? 0),
          lecturePrice: Number(t.lecture_price ?? 0),
        }))
      );
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الدرجات الأكاديمية", variant: "destructive" });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/v1/users", {
        params: {
          college_id: collegeId,
          user_type_code: "lecturer", // ← طلب المحاضرين فقط
        },
      });
      const raw: any[] = res.data?.data ?? res.data;
      setUsers(raw.map((u) => ({
        id: String(u.user_id),
        name: u.full_name,
        email: u.email || "",
        phone: u.phone || "",
        academicNumber: u.academic_number || "",
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين (المحاضرين)", variant: "destructive" });
    }
  };

  const fetchStaff = async () => {
    try {
      // يفترض وجود LecturersController@index يدعم college_id ويعيد user/title/department محملة أو مفاتيحها
      const res = await api.get("/v1/lecturers", { params: { college_id: collegeId } });
      const raw: any[] = res.data?.data ?? res.data;

      // لو الـ API لا يعيد user و title بالداخل، سنحتاج تطبيع عبر users/titles التي حمّلناها
      const usersMap = new Map(users.map((u) => [u.id, u]));
      const titlesMap = new Map(titles.map((t) => [t.id, t]));

      const mapped: AcademicStaff[] = raw.map((lec) => {
        const userId = String(lec.user_id);
        const depId = lec.department_id ? String(lec.department_id) : null;
        const titleId = lec.title_id ? String(lec.title_id) : "";
        const u = usersMap.get(userId);
        const t = titlesMap.get(titleId);

        return {
          id: String(lec.lecturer_id),
          userId,
          fullName: u?.name || lec.full_name || "",
          staffNumber: u?.academicNumber || "",
          academicAffairsNumber: "", // ليس في DB
          academicRank: t?.name || lec.academic_rank || "",
          academicTitleId: titleId || undefined,
          employmentType: lec.status ? "متفرغ" : "غير متفرغ",
          lectureRate: t?.hourlyPrice ?? 0,
          address: "", // ليس في DB
          phone: u?.phone || "",
          email: u?.email || "",
          notes: "",
          collegeId: String(lec.college_id),
          departmentId: depId,
          hireDate: lec.hire_date || "",
          canTeachExternally: lec.can_teach_externally || false,
        };
      });

      setCollegeStaff(mapped);
      // بيانات واجهات الاستحقاقات (اختيارية)
      setEntitlementReviews(
        mapped.map((s) => ({
          staffId: s.id,
          hoursWorked: 0,
          hourlyRate: s.lectureRate,
          total: 0,
        }))
      );
      setEntitlementApprovals(
        mapped.map((s) => ({
          staffId: s.id,
          status: "قيد المراجعة",
          approvedBy: "-",
          date: "",
        }))
      );
      setEntitlementPayouts([]);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل أعضاء هيئة التدريس", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!collegeId) return;
    (async () => {
      await Promise.all([fetchDepartments(), fetchTitles(), fetchUsers()]);
      await fetchStaff();
    })();
  }, [collegeId]);

  // When titles or users change, refetch staff to improve mapping (اختياري)
  useEffect(() => {
    if (collegeId && (users.length || titles.length)) {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length, titles.length]);

  const toggleApprovalStatus = (staffId: string) => {
    setEntitlementApprovals((prev) =>
      prev.map((a) =>
        a.staffId === staffId
          ? { ...a, status: a.status === "قيد المراجعة" ? "معتمد" : "قيد المراجعة", approvedBy: "المشرف", date: new Date().toISOString().slice(0, 10) }
          : a
      )
    );
  };

  // Handlers
  const handleAddStaff = () => {
    setEditingStaffId(null);
    setStaffFormData({
      userId: "",            // يجب اختيار مستخدم موجود
      fullName: "",
      staffNumber: "",
      academicAffairsNumber: "",
      academicRank: "",
      academicTitleId: "",
      departmentId: "",
      employmentType: "متفرغ",
      lectureRate: 0,
      address: "",
      phone: "",
      email: "",
      notes: "",
      hireDate: "",
      canTeachExternally: false,
    });
    setIsStaffFormOpen(true);
  };

  const handleEditStaff = (staff: AcademicStaff) => {
    setEditingStaffId(staff.id);
    setStaffFormData({
      userId: staff.userId,
      fullName: staff.fullName,
      staffNumber: staff.staffNumber,
      academicAffairsNumber: staff.academicAffairsNumber || "",
      academicRank: staff.academicRank,
      academicTitleId: staff.academicTitleId || "",
      departmentId: staff.departmentId || "",
      employmentType: staff.employmentType,
      lectureRate: staff.lectureRate,
      address: staff.address || "",
      phone: staff.phone || "",
      email: staff.email || "",
      notes: staff.notes || "",
      hireDate: staff.hireDate || "",
       canTeachExternally: staff.canTeachExternally || false,
    });
    setIsStaffFormOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("هل تريد حذف هذا العضو؟")) return;
    try {
      await api.delete(`/v1/lecturers/${id}`);
      toast({ title: "نجاح", description: "تم حذف العضو" });
      await fetchStaff();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف العضو";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // تحقق من المستخدم المختار
      if (!staffFormData.userId) {
        toast({ title: "تنبيه", description: "يرجى اختيار المستخدم المرتبط بالعضو", variant: "destructive" });
        return;
      }
      // تحديد العنوان الأكاديمي (title)
      const titleId = staffFormData.academicTitleId || titles.find((t) => t.name === staffFormData.academicRank)?.id || "";

      const payload = {
        user_id: Number(staffFormData.userId),
        college_id: Number(collegeId),
        department_id: staffFormData.departmentId ? Number(staffFormData.departmentId) : null,
        title_id: titleId ? Number(titleId) : null,
        hire_date: staffFormData.hireDate || null,
        status: staffFormData.employmentType === "متفرغ",
        can_teach_externally: staffFormData.canTeachExternally,
      };

      if (editingStaffId) {
        await api.put(`/v1/lecturers/${editingStaffId}`, payload);
        toast({ title: "نجاح", description: "تم تعديل العضو" });
      } else {
        await api.post(`/v1/lecturers`, payload);
        toast({ title: "نجاح", description: "تم إنشاء العضو" });
      }
      setIsStaffFormOpen(false);
      setEditingStaffId(null);
      await fetchStaff();
    } catch (error: any) {
      const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل حفظ بيانات العضو";
      const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل حفظ بيانات العضو";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    }
  };

  // تحديث اسم الدرجة وأجر الساعة عند تغيير الـ Title
  useEffect(() => {
    if (!staffFormData.academicTitleId) return;
    const t = titles.find((x) => x.id === staffFormData.academicTitleId);
    if (t) {
      setStaffFormData((prev) => ({
        ...prev,
        academicRank: t.name,
        lectureRate: t.hourlyPrice,
      }));
    }
  }, [staffFormData.academicTitleId, titles]);

  // عند اختيار مستخدم، حدّث البيانات العرضية للحقول (اسم/رقم/بريد/جوال)
  useEffect(() => {
    if (!staffFormData.userId) return;
    const u = users.find((x) => x.id === staffFormData.userId);
    if (u) {
      setStaffFormData((prev) => ({
        ...prev,
        fullName: u.name,
        staffNumber: u.academicNumber || "",
        email: u.email || "",
        phone: u.phone || "",
      }));
    }
  }, [staffFormData.userId, users]);

  // عرض الاسم للقسم/الدرجة
  const departmentsMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">أعضاء هيئة التدريس</h2>
        <div className="flex gap-2">
          {can('staff.create') && (
            <Button variant="outline" onClick={handleClickImportCsv} disabled={isImportingCsv}>
              {isImportingCsv && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Upload className="w-4 h-4 mr-2" />
              استيراد CSV
            </Button>
          )}
          {can('staff.create') && (
            <Button onClick={handleAddStaff}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عضو
            </Button>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvChange}
      />

      {/* Staff form */}
      {isStaffFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaffId ? "تعديل عضو هيئة تدريس" : "إضافة عضو هيئة تدريس جديد"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اختيار المستخدم (مطلوب للربط مع lecturers.user_id) */}
                <div>
                  <Label>المستخدم (مطلوب)</Label>
                  <Select
                    value={staffFormData.userId}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستخدم" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.email ? `- ${u.email}` : ""} {u.academicNumber ? `- ${u.academicNumber}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الرقم الوظيفي</Label>
                  <Input
                    value={staffFormData.staffNumber}
                    onChange={(e) => setStaffFormData({ ...staffFormData, staffNumber: e.target.value })}
                    placeholder="يتم تعبئته من المستخدم (academic_number)"
                  />
                </div>
                <div>
                  <Label>رقم الشؤون الأكاديمية</Label>
                  <Input
                    value={staffFormData.academicAffairsNumber}
                    onChange={(e) => setStaffFormData({ ...staffFormData, academicAffairsNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label>الدرجة الأكاديمية *</Label>
                  <Select
                    value={staffFormData.academicTitleId}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, academicTitleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدرجة" />
                    </SelectTrigger>
                    <SelectContent>
                      {titles.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>القسم</Label>
                  <Select
                    value={staffFormData.departmentId}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الحالة الوظيفية *</Label>
                  <Select
                    value={staffFormData.employmentType}
                    onValueChange={(value: "متفرغ" | "غير متفرغ") =>
                      setStaffFormData({ ...staffFormData, employmentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="متفرغ">متفرغ</SelectItem>
                      <SelectItem value="غير متفرغ">غير متفرغ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>أجر الساعة (من الدرجة)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={staffFormData.lectureRate}
                    onChange={(e) =>
                      setStaffFormData({ ...staffFormData, lectureRate: parseInt(e.target.value || "0") })
                    }
                    disabled
                  />
                </div>

                <div>
                  <Label>تاريخ التعيين</Label>
                  <Input
                    type="date"
                    value={staffFormData.hireDate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, hireDate: e.target.value })}
                  />
                </div>
                {/* ⬇️ أضف هذا الجزء الجديد ⬇️ */}
                <div className="md:col-span-2 flex items-center space-x-2 rtl:space-x-reverse pt-4 border-t mt-2">
                    <Checkbox
                        id="can-teach-externally"
                        checked={staffFormData.canTeachExternally}
                        onCheckedChange={(checked: boolean) =>
                            setStaffFormData({ ...staffFormData, canTeachExternally: checked })
                        }
                    />
                    <label
                        htmlFor="can-teach-externally"
                        className="text-sm font-medium leading-none"
                    >
                        مخول بالتدريس في كليات أخرى
                    </label>
                </div>
                {/* ⬆️ نهاية الإضافة ⬆️ */}

                <div>
                  <Label>رقم الجوال</Label>
                  <Input
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    placeholder="من بيانات المستخدم"
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    placeholder="من بيانات المستخدم"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">حفظ</Button>
                <Button type="button" variant="outline" onClick={() => setIsStaffFormOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم الكامل</TableHead>
                <TableHead className="text-right">الرقم الوظيفي</TableHead>
                <TableHead className="text-right">رقم الشؤون</TableHead>
                <TableHead className="text-right">الدرجة</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">أجر الساعة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collegeStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                collegeStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="text-right font-medium">{staff.fullName}</TableCell>
                    <TableCell className="text-right">{staff.staffNumber}</TableCell>
                    <TableCell className="text-right">{staff.academicAffairsNumber || "-"}</TableCell>
                    <TableCell className="text-right">{staff.academicRank}</TableCell>
                    <TableCell className="text-right">{departmentsMap.get(staff.departmentId || "") || "-"}</TableCell>
                    <TableCell className="text-right">{staff.employmentType}</TableCell>
                    <TableCell className="text-right">{staff.lectureRate}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {can('staff.update') && (
                          <Button size="sm" variant="outline" onClick={() => handleEditStaff(staff)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {can('staff.delete') && (
                          <Button size="sm" variant="outline" onClick={() => handleDeleteStaff(staff.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}