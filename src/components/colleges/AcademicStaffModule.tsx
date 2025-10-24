import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
}

interface AcademicStaff {
  id: string;
  fullName: string;
  staffNumber: string;
  academicAffairsNumber?: string;
  academicRank: string;
  employmentType: "متفرغ" | "غير متفرغ";
  lectureRate: number;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  collegeId: string;
  departmentId?: string | null;
}

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

type StaffFormData = {
  fullName: string;
  staffNumber: string;
  academicAffairsNumber: string;
  academicRank: string;
  departmentId: string;
  employmentType: "متفرغ" | "غير متفرغ";
  lectureRate: number;
  address: string;
  phone: string;
  email: string;
  notes: string;
};

interface Props {
  collegeStaff: AcademicStaff[];
  departments: Department[];

  entitlementStep: string;
  setEntitlementStep: (v: string) => void;
  entitlementPeriod: EntitlementPeriod;
  setEntitlementPeriod: (v: EntitlementPeriod) => void;
  entitlementReviews: EntitlementReview[];
  entitlementApprovals: EntitlementApproval[];
  entitlementPayouts: EntitlementPayout[];
  toggleApprovalStatus: (staffId: string) => void;

  isStaffFormOpen: boolean;
  editingStaffId: string | null;
  staffFormData: StaffFormData;
  setIsStaffFormOpen: (v: boolean) => void;
  setEditingStaffId: (v: string | null) => void;
  setStaffFormData: (v: StaffFormData) => void;

  handleAddStaff: () => void;
  handleEditStaff: (staff: AcademicStaff) => void;
  handleDeleteStaff: (id: string) => void | Promise<void>;
  handleSubmitStaff: (e: React.FormEvent) => void | Promise<void>;
}

const AcademicStaffModule: React.FC<Props> = ({
  collegeStaff,
  departments,

  entitlementStep,
  setEntitlementStep,
  entitlementPeriod,
  setEntitlementPeriod,
  entitlementReviews,
  entitlementApprovals,
  entitlementPayouts,
  toggleApprovalStatus,

  isStaffFormOpen,
  editingStaffId,
  staffFormData,
  setIsStaffFormOpen,
  setEditingStaffId,
  setStaffFormData,

  handleAddStaff,
  handleEditStaff,
  handleDeleteStaff,
  handleSubmitStaff,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">أعضاء هيئة التدريس</h2>
        <Button onClick={handleAddStaff}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة عضو
        </Button>
      </div>

      {/* Entitlements (واجهة فقط) */}
      <Card>
        <CardHeader>
          <CardTitle>الاستحقاقات الأكاديمية</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={entitlementStep} onValueChange={setEntitlementStep}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="1">فترات الاستحقاق</TabsTrigger>
              <TabsTrigger value="2">أجر الساعة</TabsTrigger>
              <TabsTrigger value="3">مراجعة</TabsTrigger>
              <TabsTrigger value="4">اعتماد</TabsTrigger>
              <TabsTrigger value="5">صرف</TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={entitlementPeriod.from}
                    onChange={(e) => setEntitlementPeriod({ ...entitlementPeriod, from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>تاريخ النهاية</Label>
                  <Input
                    type="date"
                    value={entitlementPeriod.to}
                    onChange={(e) => setEntitlementPeriod({ ...entitlementPeriod, to: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead>أجر الساعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collegeStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>{staff.fullName}</TableCell>
                      <TableCell>
                        <Input type="number" min={0} defaultValue={staff.lectureRate} className="w-32" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead>عدد الساعات</TableHead>
                    <TableHead>أجر الساعة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entitlementReviews.map((review) => {
                    const staff = collegeStaff.find((s) => s.id === review.staffId);
                    return (
                      <TableRow key={review.staffId}>
                        <TableCell>{staff?.fullName || "-"}</TableCell>
                        <TableCell>{review.hoursWorked}</TableCell>
                        <TableCell>{review.hourlyRate}</TableCell>
                        <TableCell className="font-bold">{review.total.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>مُعتمد بواسطة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entitlementApprovals.map((approval) => {
                    const staff = collegeStaff.find((s) => s.id === approval.staffId);
                    return (
                      <TableRow key={approval.staffId}>
                        <TableCell>{staff?.fullName || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-sm",
                              approval.status === "معتمد" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {approval.status}
                          </span>
                        </TableCell>
                        <TableCell>{approval.approvedBy}</TableCell>
                        <TableCell>{approval.date}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => toggleApprovalStatus(approval.staffId)}>
                            {approval.status === "قيد المراجعة" ? "اعتماد" : "إلغاء الاعتماد"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العضو</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>طريقة الصرف</TableHead>
                    <TableHead>رقم المرجع</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entitlementPayouts.map((payout) => {
                    const staff = collegeStaff.find((s) => s.id === payout.staffId);
                    return (
                      <TableRow key={payout.staffId}>
                        <TableCell>{staff?.fullName || "-"}</TableCell>
                        <TableCell>{payout.amount.toLocaleString()}</TableCell>
                        <TableCell>{payout.method}</TableCell>
                        <TableCell>{payout.ref}</TableCell>
                        <TableCell>{payout.date}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-sm",
                              payout.status === "تم" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                            )}
                          >
                            {payout.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Staff form */}
      {isStaffFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaffId ? "تعديل عضو هيئة تدريس" : "إضافة عضو هيئة تدريس جديد"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={staffFormData.fullName}
                    onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>الرقم الوظيفي *</Label>
                  <Input
                    value={staffFormData.staffNumber}
                    onChange={(e) => setStaffFormData({ ...staffFormData, staffNumber: e.target.value })}
                    required
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
                    value={staffFormData.academicRank}
                    onValueChange={(value) => setStaffFormData({ ...staffFormData, academicRank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أستاذ">أستاذ</SelectItem>
                      <SelectItem value="أستاذ مشارك">أستاذ مشارك</SelectItem>
                      <SelectItem value="أستاذ مساعد">أستاذ مساعد</SelectItem>
                      <SelectItem value="محاضر">محاضر</SelectItem>
                      <SelectItem value="معيد">معيد</SelectItem>
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
                  <Label>أجر الساعة *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={staffFormData.lectureRate}
                    onChange={(e) =>
                      setStaffFormData({ ...staffFormData, lectureRate: parseInt(e.target.value || "0") })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>رقم الجوال</Label>
                  <Input value={staffFormData.phone} onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })} />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>العنوان</Label>
                  <Input value={staffFormData.address} onChange={(e) => setStaffFormData({ ...staffFormData, address: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={staffFormData.notes}
                    onChange={(e) => setStaffFormData({ ...staffFormData, notes: e.target.value })}
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
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الرقم الوظيفي</TableHead>
                <TableHead>رقم الشؤون</TableHead>
                <TableHead>الدرجة</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>أجر الساعة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collegeStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.fullName}</TableCell>
                  <TableCell>{staff.staffNumber}</TableCell>
                  <TableCell>{staff.academicAffairsNumber}</TableCell>
                  <TableCell>{staff.academicRank}</TableCell>
                  <TableCell>{departments.find((d) => d.id === staff.departmentId)?.name || "-"}</TableCell>
                  <TableCell>{staff.employmentType}</TableCell>
                  <TableCell>{staff.lectureRate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditStaff(staff)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteStaff(staff.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicStaffModule;