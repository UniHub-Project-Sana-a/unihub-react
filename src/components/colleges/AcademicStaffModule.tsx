import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Upload, Loader2, Search, X, Users, Filter, RefreshCw, Check, AlertCircle, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import SoftDeleteTrashPage from "@/components/colleges/SoftDeleteTrashPage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  role?: string;
  roleName?: string;
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

interface UserSearchComboboxProps {
  users: UserOption[];
  selectedUserId: string;
  onSelectUser: (user: UserOption | null) => void;
  existingStaffUserIds: Set<string>;
  editingUserId?: string;
  disabled?: boolean;
}

function UserSearchCombobox({
  users,
  selectedUserId,
  onSelectUser,
  existingStaffUserIds,
  editingUserId,
  disabled = false,
}: UserSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // فلترة فورية بحسب الاسم أو الرقم الوظيفي أو البريد أو الهاتف
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const nameMatch = (u.name || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      const numMatch = (u.academicNumber || "").toLowerCase().includes(q);
      const phoneMatch = (u.phone || "").toLowerCase().includes(q);
      return nameMatch || emailMatch || numMatch || phoneMatch;
    });
  }, [users, searchQuery]);

  const handleSelect = (user: UserOption) => {
    onSelectUser(user);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelectUser(null);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full text-right" dir="rtl">
      {/* في حال تم اختيار مستخدم بالفعل ولم تفتح القائمة للبحث */}
      {selectedUser && !isOpen ? (
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchQuery("");
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={cn(
            "flex items-center justify-between p-2.5 bg-accent/40 border border-primary/30 rounded-md cursor-pointer transition hover:bg-accent/60",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {selectedUser.name ? selectedUser.name.charAt(0) : "م"}
            </div>
            <div className="text-right truncate">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate">{selectedUser.name}</span>
                {selectedUser.roleName && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                    {selectedUser.roleName}
                  </span>
                )}
                <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> تم الاختيار
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                {selectedUser.academicNumber ? (
                  <span className="font-mono">الرقم الوظيفي: {selectedUser.academicNumber}</span>
                ) : (
                  <span>الرقم الوظيفي: غير محدد</span>
                )}
                {selectedUser.email && <span>• {selectedUser.email}</span>}
                {selectedUser.phone && <span>• {selectedUser.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 mr-2">
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="إلغاء التحديد للبحث عن شخص آخر"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* حقل الكتابة والبحث الحي */
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            disabled={disabled}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="ابحث بالاسم (مثال: أ.د. عبدالكريم أو د. محمد) أو الرقم الوظيفي..."
            className="pr-9 pl-9 text-sm text-right"
            dir="rtl"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* نتائج البحث المنسدلة */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-xl max-h-64 overflow-y-auto text-right animate-in fade-in-0 zoom-in-95">
          {users.length === 0 ? (
            <div className="p-4 text-center space-y-1.5 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                لا يوجد مستخدمون متاحون للربط حالياً
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ملاحظة: يمكنك اختيار أي مستخدم مسجل في النظام (عميد، رئيس قسم، أو محاضر) لربطه كعضو هيئة تدريس.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center space-y-1.5 text-xs">
              <p className="font-medium text-foreground">
                لم يتم العثور على أي مستخدم يطابق "{searchQuery}"
              </p>
              <p className="text-muted-foreground leading-relaxed">
                تأكد من كتابة الاسم أو الرقم الوظيفي بشكل صحيح.
              </p>
            </div>
          ) : (
            <div className="py-1 divide-y divide-border/40">
              <div className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 font-medium flex items-center justify-between">
                <span>اختر مستخدماً للربط كعضو هيئة تدريس:</span>
                <span>{filteredUsers.length} من {users.length} مستخدم</span>
              </div>
              {filteredUsers.map((u) => {
                const isAlreadyInCollege = existingStaffUserIds.has(u.id) && u.id !== editingUserId;
                const isCurrent = u.id === selectedUserId;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      if (!isAlreadyInCollege) {
                        handleSelect(u);
                      }
                    }}
                    className={cn(
                      "p-2.5 flex items-center justify-between text-sm transition-colors",
                      isAlreadyInCollege
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "cursor-pointer hover:bg-accent/70",
                      isCurrent && "bg-primary/10 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {u.name ? u.name.charAt(0) : "م"}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{u.name}</span>
                          {u.roleName && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium shrink-0">
                              {u.roleName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {u.academicNumber && (
                            <span className="bg-muted px-1.5 py-0.2 rounded font-mono text-[11px]">
                              #{u.academicNumber}
                            </span>
                          )}
                          {u.email && <span className="truncate">{u.email}</span>}
                          {u.phone && <span>{u.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 mr-2">
                      {isAlreadyInCollege ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                          مضاف مسبقاً
                        </span>
                      ) : isCurrent ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <span className="text-xs text-primary font-medium">
                          اختيار ←
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  collegeId: string;
}

export default function AcademicStaffModule({ collegeId }: Props) {
  const { can } = usePermission();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  // Lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [collegeStaff, setCollegeStaff] = useState<AcademicStaff[]>([]);
  const [showTrash, setShowTrash] = useState(false);

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

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("all");

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

  const isExcelOrCsv = /\.(csv|xlsx|xls)$/i.test(file.name);
  if (!isExcelOrCsv) {
    toast({ title: "تنبيه", description: "الرجاء اختيار ملف Excel (.xlsx) أو CSV صالح", variant: "destructive" });
    e.target.value = "";
    return;
  }

  try {
    setIsImportingCsv(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("college_id", collegeId);

    const response = await api.post("/v1/lecturers/import-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // استخراج البيانات بما فيها مصفوفة الأخطاء
    const { imported, updated, skipped, errors } = response.data;

    // بناء رسالة الوصف
    let description = `تم استيراد ${imported} وتحديث ${updated}.`;
    if (skipped > 0) {
      description += ` تم تخطي ${skipped} سطر.`;
    }

    // إذا وجدنا أخطاء، ندمجها في الرسالة
    if (errors && errors.length > 0) {
      const errorText = errors.slice(0, 3).join("\n"); // عرض أول 3 أخطاء
      const more = errors.length > 3 ? `\n... و ${errors.length - 3} أخطاء أخرى` : "";
      
      toast({
        title: skipped > 0 ? "اكتمل الاستيراد مع وجود تنبيهات" : "تمت العملية",
        description: (
          <div className="whitespace-pre-line text-sm">
            <p>{description}</p>
            <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-xs">
              <strong>أسباب التخطي:</strong>
              <p className="mt-1">{errorText + more}</p>
            </div>
          </div>
        ) as any, // استخدام JSX لعرض الأخطاء بشكل جميل
        duration: 7000,
      });
    } else {
      toast({
        title: "نجاح الاستيراد",
        description: description,
      });
    }

    await fetchUsers();
    await fetchStaff();
  } catch (error: any) {
    // هذا الجزء للأخطاء الفادحة (500) أو أخطاء الشبكة
    const msg = error?.response?.data?.message || "فشل اتصال السيرفر";
    toast({
      title: "خطأ فادح",
      description: msg,
      variant: "destructive",
    });
  } finally {
    setIsImportingCsv(false);
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

  const existingStaffUserIds = useMemo(() => {
    return new Set(collegeStaff.map((s) => String(s.userId)));
  }, [collegeStaff]);

  const editingStaff = useMemo(() => {
    return editingStaffId ? collegeStaff.find((s) => s.id === editingStaffId) : null;
  }, [editingStaffId, collegeStaff]);

  const handleSelectUser = (u: UserOption | null) => {
    if (!u) {
      setStaffFormData((prev) => ({
        ...prev,
        userId: "",
        fullName: "",
        staffNumber: "",
        email: "",
        phone: "",
      }));
      return;
    }

    setStaffFormData((prev) => ({
      ...prev,
      userId: u.id,
      fullName: u.name,
      staffNumber: u.academicNumber || "",
      email: u.email || "",
      phone: u.phone || "",
    }));
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/v1/users", {
        params: {
          user_type_code: "lecturer,dean,dept_head,admin,academic_affairs", // جلب المحاضرين والعمداء ورؤساء الأقسام
          all: "true",
        },
      });
      const raw: any[] = res.data?.data ?? res.data;
      setUsers(raw.map((u) => ({
        id: String(u.user_id),
        name: u.full_name,
        email: u.email || "",
        phone: u.phone || "",
        academicNumber: u.academic_number || "",
        role: u.user_type?.user_type_code || u.role || "",
        roleName: u.user_type?.name || u.user_type?.user_type_name || u.role_name || "",
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المستخدمين (المحاضرين والهيئة الأكاديمية)", variant: "destructive" });
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get("/v1/lecturers", { params: { college_id: collegeId } });
      const raw: any[] = res.data?.data ?? res.data;
  
      const mapped: AcademicStaff[] = raw.map((lec) => {
        // هنا نستخدم البيانات المدمجة مباشرة من الـ API (lec.user و lec.academic_title)
        const u = lec.user;
        const t = lec.academic_title;
        const d = lec.department;
  
        return {
          id: String(lec.lecturer_id),
          userId: String(lec.user_id),
          // استخدم البيانات القادمة من العلاقة (Relation) مباشرة
          fullName: u?.full_name || "", 
          staffNumber: u?.academic_number || "",
          academicAffairsNumber: "", 
          academicRank: t?.title_name || "",
          academicTitleId: lec.title_id ? String(lec.title_id) : undefined,
          employmentType: lec.status ? "متفرغ" : "غير متفرغ",
          lectureRate: t?.hourly_price ?? 0,
          address: "", 
          phone: u?.phone || "",
          email: u?.email || "",
          notes: "",
          collegeId: String(lec.college_id),
          departmentId: lec.department_id ? String(lec.department_id) : null,
          hireDate: lec.hire_date || "",
          canTeachExternally: lec.can_teach_externally === 1 || lec.can_teach_externally === true,
        };
      });
  
      setCollegeStaff(mapped);
      
      // تحديث واجهات الاستحقاقات
      setEntitlementReviews(mapped.map(s => ({
        staffId: s.id,
        hoursWorked: 0,
        hourlyRate: s.lectureRate,
        total: 0,
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل أعضاء هيئة التدريس", variant: "destructive" });
    }
  };

  const departmentsMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach(d => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const filteredStaff = useMemo(() => {
    return collegeStaff.filter((staff) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (staff.fullName || "").toLowerCase().includes(q);
        const matchNum = (staff.staffNumber || "").toLowerCase().includes(q);
        const matchPhone = (staff.phone || "").toLowerCase().includes(q);
        const matchEmail = (staff.email || "").toLowerCase().includes(q);
        const matchRank = (staff.academicRank || "").toLowerCase().includes(q);
        const matchDept = (departmentsMap.get(staff.departmentId || "") || "").toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchPhone && !matchEmail && !matchRank && !matchDept) {
          return false;
        }
      }
      if (departmentFilter !== "all" && staff.departmentId !== departmentFilter) {
        return false;
      }
      if (titleFilter !== "all" && staff.academicTitleId !== titleFilter) {
        return false;
      }
      if (employmentFilter !== "all" && staff.employmentType !== employmentFilter) {
        return false;
      }
      return true;
    });
  }, [collegeStaff, searchQuery, departmentFilter, titleFilter, employmentFilter, departmentsMap]);

  useEffect(() => {
    if (!collegeId) return;
    // تنفيذ جميع الاستدعاءات بالتوازي لتسريع تحميل الصفحة بشكل فوري
    Promise.all([fetchDepartments(), fetchTitles(), fetchUsers(), fetchStaff()]);
  }, [collegeId]);

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
      hireDate: new Date().toISOString().slice(0, 10),
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
      hireDate: staff.hireDate || new Date().toISOString().slice(0, 10),
      canTeachExternally: staff.canTeachExternally || false,
    });
    setIsStaffFormOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!(await confirm({ title: "حذف عضو هيئة تدريس", description: "هل تريد حذف هذا العضو؟" }))) return;
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
      if (!staffFormData.departmentId) {
        toast({ title: "تنبيه", description: "يرجى اختيار القسم الأكاديمي للعضو", variant: "destructive" });
        return;
      }
      if (!staffFormData.hireDate) {
        toast({ title: "تنبيه", description: "يرجى تحديد تاريخ التعيين", variant: "destructive" });
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
        toast({ title: "نجاح", description: "تم تعديل بيانات عضو هيئة التدريس" });
      } else {
        await api.post(`/v1/lecturers`, payload);
        toast({ title: "نجاح", description: "تم ربط وإضافة عضو هيئة التدريس بنجاح" });
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

  if (showTrash) {
    return (
      <SoftDeleteTrashPage
        collegeId={collegeId}
        onBack={() => {
          setShowTrash(false);
          void fetchStaff();
        }}
        endpoint="/v1/lecturers/trash"
        permission="staff.delete"
        title="سلة محذوفات هيئة التدريس"
        subtitle="أعضاء هيئة التدريس المحذوفون حذفاً ناعماً في هذه الكلية"
        backLabel="العودة لهيئة التدريس"
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">أعضاء هيئة التدريس</h2>
        <div className="flex gap-2">
          {can('staff.create') && (
            <Button variant="outline" onClick={handleClickImportCsv} disabled={isImportingCsv}>
              {isImportingCsv && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Upload className="w-4 h-4 mr-2" />
              استيراد ملف (Excel / CSV)
            </Button>
          )}
          {can('staff.create') && (
            <Button onClick={handleAddStaff}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عضو
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowTrash(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            سلة المحذوفات
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleCsvChange}
      />

      {/* Staff modal dialog */}
      <Dialog open={isStaffFormOpen} onOpenChange={setIsStaffFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold text-right">
              {editingStaffId ? "تعديل عضو هيئة تدريس" : "إضافة عضو هيئة تدريس جديد"}
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-muted-foreground">
              {editingStaffId
                ? "تعديل بيانات ورتبة عضو هيئة التدريس الحالي وقسمه الأكاديمي."
                : "إدخال بيانات ورتبة عضو هيئة تدريس جديد وربطه بالمستخدم المناسب."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStaff} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اختيار المستخدم بالبحث والكتابة والفلترة السريعة والتعبئة التلقائية */}
                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      المستخدم المرتبط بالعضو (مطلوب) *
                    </Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      اكتب حرفاً أو اسماً للفلترة السريعة
                    </span>
                  </div>
                  <UserSearchCombobox
                    users={users}
                    selectedUserId={staffFormData.userId}
                    onSelectUser={handleSelectUser}
                    existingStaffUserIds={existingStaffUserIds}
                    editingUserId={editingStaff?.userId}
                  />
                  {!staffFormData.userId && (
                    <p className="text-[11px] text-muted-foreground">
                      💡 ملاحظة: يمكنك اختيار أي مستخدم مسجل في النظام (عميد، رئيس قسم، أو محاضر) لربطه كعضو هيئة تدريس بالكلية لإسناد المحاضرات إليه.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>الرقم الوظيفي</Label>
                    {staffFormData.staffNumber ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الجلب تلقائياً
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">من حساب المستخدم</span>
                    )}
                  </div>
                  <Input
                    value={staffFormData.staffNumber}
                    onChange={(e) => setStaffFormData({ ...staffFormData, staffNumber: e.target.value })}
                    placeholder="يتم تعبئته تلقائياً عند اختيار المستخدم"
                    className={staffFormData.staffNumber ? "bg-muted/30 font-mono" : ""}
                  />
                </div>

                <div>
                  <Label>رقم الشؤون الأكاديمية</Label>
                  <Input
                    value={staffFormData.academicAffairsNumber}
                    onChange={(e) => setStaffFormData({ ...staffFormData, academicAffairsNumber: e.target.value })}
                    placeholder="اختياري - رقم خاص بالشؤون الأكاديمية"
                  />
                </div>

                <div>
                  <Label>الدرجة الأكاديمية *</Label>
                  <Select
                    value={staffFormData.academicTitleId}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, academicTitleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدرجة الأكاديمية" />
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
                  <Label>القسم *</Label>
                  <Select
                    value={staffFormData.departmentId}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم التابع له" />
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
                    className="bg-muted/40 font-mono"
                  />
                </div>

                <div>
                  <Label>تاريخ التعيين *</Label>
                  <Input
                    type="date"
                    value={staffFormData.hireDate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, hireDate: e.target.value })}
                  />
                </div>

                {/* تخويل بالتدريس في كليات أخرى */}
                <div className="md:col-span-2 flex items-center space-x-2 rtl:space-x-reverse pt-3 border-t mt-1">
                  <Checkbox
                    id="can-teach-externally"
                    checked={staffFormData.canTeachExternally}
                    onCheckedChange={(checked: boolean) =>
                      setStaffFormData({ ...staffFormData, canTeachExternally: checked })
                    }
                  />
                  <label
                    htmlFor="can-teach-externally"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    مخول بالتدريس في كليات أخرى
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>رقم الجوال</Label>
                    {staffFormData.phone && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الجلب تلقائياً
                      </span>
                    )}
                  </div>
                  <Input
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    placeholder="يتم تعبئته تلقائياً من المستخدم"
                    className={staffFormData.phone ? "bg-muted/30" : ""}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>البريد الإلكتروني</Label>
                    {staffFormData.email && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الجلب تلقائياً
                      </span>
                    )}
                  </div>
                  <Input
                    type="email"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    placeholder="يتم تعبئته تلقائياً من المستخدم"
                    className={staffFormData.email ? "bg-muted/30" : ""}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setIsStaffFormOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingStaffId ? "حفظ التعديلات" : "إضافة العضو"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Staff table with advanced search & filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">قائمة أعضاء هيئة التدريس</CardTitle>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {filteredStaff.length} من {collegeStaff.length}
              </span>
            </div>

            {/* محرك البحث السريع */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الرقم، الهاتف، البريد..."
                className="pr-9 pl-8 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* فلاتر إضافية سريعة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t mt-3">
            <div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="تصفية حسب القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأقسام</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={titleFilter} onValueChange={setTitleFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="تصفية حسب الدرجة العلمية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الدرجات</SelectItem>
                  {titles.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="الحالة الوظيفية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="متفرغ">متفرغ</SelectItem>
                  <SelectItem value="غير متفرغ">غير متفرغ</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || departmentFilter !== "all" || titleFilter !== "all" || employmentFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => {
                    setSearchQuery("");
                    setDepartmentFilter("all");
                    setTitleFilter("all");
                    setEmploymentFilter("all");
                  }}
                  title="إلغاء الفلاتر"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> مسح
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
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
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    {searchQuery || departmentFilter !== "all" || titleFilter !== "all" || employmentFilter !== "all"
                      ? "لا توجد نتائج مطابقة لمعايير البحث الحالية"
                      : "لا توجد بيانات"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
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

      {confirmDialog}
    </div>
  );
}