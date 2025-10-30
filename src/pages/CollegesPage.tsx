import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, ArrowLeft, ChevronRight } from "lucide-react";
import { lazy, Suspense } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

// Lazy imports
const TimetableModule = lazy(() => import("@/components/colleges/TimetableModule"));
const EnrollmentModule = lazy(() => import("@/components/colleges/EnrollmentModule"));
const ExcusesModule = lazy(() => import("@/components/colleges/ExcusesModule"));
const ReportsModule = lazy(() => import("@/components/colleges/ReportsModule"));
const ClassworkGradesModule = lazy(() => import("@/components/colleges/ClassworkGradesModule"));
const AcademicStaffModule = lazy(() => import("@/components/colleges/AcademicStaffModule"));
const ClassroomsModule = lazy(() => import("@/components/colleges/ClassroomsModule"));
const CollegesDashboardModule = lazy(() => import("@/components/colleges/CollegesDashboardModule"));
const DepartmentsModule = lazy(() => import("@/components/colleges/DepartmentsModule"));
const AcademicTitlesModule = lazy(() => import("@/components/colleges/AcademicTitlesModule"));
const ModuleSkeleton = ({ title }: { title: string }) => (
  <div className="p-6">
    <div className="mb-4 font-semibold">{title}</div>
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  </div>
);

interface College {
  id: string;
  name: string;
  academicCode: string;
}

export default function CollegesPage() {
  const location = useLocation();
  const { toast } = useToast();
  const { user: me } = useAuth();

  const [activeTab, setActiveTab] = useState("colleges-dashboard");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isCollegeFormOpen, setIsCollegeFormOpen] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [collegeFormData, setCollegeFormData] = useState({ name: "", academicCode: "" });
  const [userTypes, setUserTypes] = useState<any[]>([]);
  
  const myUserType = useMemo(() => {
    // لا تحسب أي شيء إلا بعد تحميل `me` و `userTypes`
    if (!me || !userTypes || userTypes.length === 0) {
      return null;
    }
    return userTypes.find(t => t.user_type_id === me.user_type_id) || null;
  }, [me, userTypes]); // يعتمد على me و userTypes
  
  const myUserTypeCode = myUserType?.user_type_code;

  const loadColleges = async () => {
    try {
      const res = await api.get("/v1/colleges");
      let data: any[] = res.data?.data ?? res.data;
      
      if (myUserTypeCode === 'dean') {
        data = data.filter(c => c.college_id === me?.college_id);
      }
  
      setColleges(data.map(c => ({
        id: String(c.college_id),
        name: c.college_name,
        academicCode: c.college_code || ""
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الكليات", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const typesRes = await api.get("/v1/lookups/user-types");
        setUserTypes(typesRes.data?.data ?? typesRes.data);
      } catch {
        toast({ title: "خطأ", description: "فشل تحميل أنواع المستخدم", variant: "destructive" });
      }
    };
    fetchLookups();
  }, []);
  
  useEffect(() => {
    if (location.pathname === "/colleges" && myUserTypeCode) {
      setSelectedCollege(null);
      loadColleges();
    }
  }, [location.pathname, myUserTypeCode]);

  const handleAddCollege = () => {
    setIsCollegeFormOpen(true);
    setEditingCollegeId(null);
    setCollegeFormData({ name: "", academicCode: "" });
  };

  const handleEditCollege = (college: College) => {
    setIsCollegeFormOpen(true);
    setEditingCollegeId(college.id);
    setCollegeFormData({ name: college.name, academicCode: college.academicCode });
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("سيتم حذف الكلية وكل ما يتبعها. هل أنت متأكد؟")) return;
    try {
      await api.delete(`/v1/colleges/${id}`);
      if (selectedCollege?.id === id) setSelectedCollege(null);
      await loadColleges();
    } catch {
      toast({ title: "خطأ", description: "فشل حذف الكلية", variant: "destructive" });
    }
  };

  const handleSubmitCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        college_name: collegeFormData.name,
        college_code: collegeFormData.academicCode,
      };
      if (editingCollegeId) {
        await api.put(`/v1/colleges/${editingCollegeId}`, payload);
        toast({ title: "نجاح", description: "تم تحديث الكلية" });
      } else {
        await api.post("/v1/colleges", payload);
        toast({ title: "نجاح", description: "تم إنشاء الكلية" });
      }
      setIsCollegeFormOpen(false);
      await loadColleges();
    } catch (error: any) {
      const msg = error?.response?.data?.errors?.college_name?.[0] || error?.response?.data?.errors?.college_code?.[0] || error?.response?.data?.message || "فشل حفظ الكلية";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };
  

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6">
        {!selectedCollege ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">الكليات</h1>
              {(myUserTypeCode === 'admin' || myUserTypeCode === 'presidency') && (
                <Button onClick={handleAddCollege}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة كلية
                </Button>
              )}
            </div>
        
            {isCollegeFormOpen && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingCollegeId ? "تعديل كلية" : "إضافة كلية جديدة"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitCollege} className="space-y-4">
                    <div>
                      <Label>اسم الكلية *</Label>
                      <Input value={collegeFormData.name} onChange={(e) => setCollegeFormData({ ...collegeFormData, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label>الكود الأكاديمي *</Label>
                      <Input value={collegeFormData.academicCode} onChange={(e) => setCollegeFormData({ ...collegeFormData, academicCode: e.target.value })} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">حفظ</Button>
                      <Button type="button" variant="outline" onClick={() => setIsCollegeFormOpen(false)}>إلغاء</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
        
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الكلية</TableHead>
                      <TableHead>الكود الأكاديمي</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colleges.map((college) => (
                      <TableRow key={college.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCollege(college)}>
                        <TableCell className="font-medium">{college.name}</TableCell>
                        <TableCell>{college.academicCode}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* عرض أزرار التعديل والحذف فقط للمشرف العام */}
                            {(myUserTypeCode === 'admin' || myUserTypeCode === 'presidency') && (
                              <>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditCollege(college); }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteCollege(college.id); }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedCollege(college); }}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Button variant="outline" onClick={() => setSelectedCollege(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة للكليات
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold mt-4">{selectedCollege.name}</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger value="colleges-dashboard">لوحة التحكم</TabsTrigger>
                <TabsTrigger value="departments">الأقسام</TabsTrigger>
                <TabsTrigger value="classrooms">القاعات الدراسية</TabsTrigger>
                <TabsTrigger value="academic-titles">الدرجات الأكاديمية</TabsTrigger>
                <TabsTrigger value="Academic Staff">أعضاء هيئة التدريس</TabsTrigger>
                <TabsTrigger value="Timetable">الجدول الزمني</TabsTrigger>
                <TabsTrigger value="Enrollment">تسجيل الطلاب</TabsTrigger>
                <TabsTrigger value="Excuses">إدارة الاعذار</TabsTrigger>
                <TabsTrigger value="Reports">التقارير</TabsTrigger>
                <TabsTrigger value="Class-work-grades">درجات اعمال الفصل</TabsTrigger>
              </TabsList>

              <TabsContent value="colleges-dashboard">
                <Suspense fallback={<ModuleSkeleton title="لوحة التحكم " />}>
                  {activeTab === "colleges-dashboard" && (
                    <CollegesDashboardModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="academic-titles">
                <Suspense fallback={<ModuleSkeleton title="الدرجات الأكاديمية" />}>
                  {activeTab === "academic-titles" && ( 
                    <AcademicTitlesModule collegeId={selectedCollege.id} /> 
                    )} 
                </Suspense> 
              </TabsContent>

              <TabsContent value="departments">
                <Suspense fallback={<ModuleSkeleton title=" ألاقسام " />}>
                  {activeTab === "departments" && (
                    <DepartmentsModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="classrooms">
                <Suspense fallback={<ModuleSkeleton title=" المباني " />}>
                  {activeTab === "classrooms" && (
                    <ClassroomsModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="Academic Staff">
                <Suspense fallback={<ModuleSkeleton title=" أعضاء هيئة التدريس " />}>
                  {activeTab === "Academic Staff" && (
                    <AcademicStaffModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="Timetable">
                <Suspense fallback={<ModuleSkeleton title="الجدول الزمني" />}>
                  {activeTab === "Timetable" && (
                    <TimetableModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Enrollment">
                <Suspense fallback={<ModuleSkeleton title="تسجيل الطلاب" />}>
                  {activeTab === "Enrollment" && (
                    <EnrollmentModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Excuses">
                <Suspense fallback={<ModuleSkeleton title="إدارة الأعذار" />}>
                  {activeTab === "Excuses" && (
                    <ExcusesModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Reports">
                <Suspense fallback={<ModuleSkeleton title="التقارير" />}>
                  {activeTab === "Reports" && (
                    <ReportsModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Class-work-grades">
                <Suspense fallback={<ModuleSkeleton title="درجات أعمال الفصل" />}>
                  {activeTab === "Class-work-grades" && (
                    <ClassworkGradesModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}