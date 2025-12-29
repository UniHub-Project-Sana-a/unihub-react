import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom"; 
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Lazy imports
const TimetableModule = lazy(() => import("@/components/colleges/TimetableModule"));
const EnrollmentModule = lazy(() => import("@/components/colleges/EnrollmentModule"));
const ReportsModule = lazy(() => import("@/components/colleges/ReportsModule"));
const AcademicStaffModule = lazy(() => import("@/components/colleges/AcademicStaffModule"));
const ClassroomsModule = lazy(() => import("@/components/colleges/ClassroomsModule"));
const CollegesDashboardModule = lazy(() => import("@/components/colleges/CollegesDashboardModule"));
const DepartmentsModule = lazy(() => import("@/components/colleges/DepartmentsModule"));
const AcademicTitlesModule = lazy(() => import("@/components/colleges/AcademicTitlesModule"));
const PeriodsModule = lazy(() => import("@/components/colleges/PeriodsModule"));
// ✅ إضافة الاستيراد للموديول الجديد
const QualityAssuranceModule = lazy(() => import("@/components/colleges/QualityAssuranceModule"));

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
  const { id: routeId } = useParams(); 
  const navigate = useNavigate(); 
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
  const [isLoading, setIsLoading] = useState(true);

  // تحديد نوع المستخدم
  const myUserType = useMemo(() => {
    if (!me || !userTypes || userTypes.length === 0) return null;
    return userTypes.find(t => t.user_type_id === (me as any).user_type_id) || null;
  }, [me, userTypes]);
  
  const myUserTypeCode = myUserType?.user_type_code;

  // هل المستخدم "سوبر" (مشرف عام أو أدمن)؟
  const isSuperUser = myUserTypeCode === 'presidency' || myUserTypeCode === 'admin';

  // تحميل الكليات
  const loadColleges = async () => {
    try {
      const res = await api.get("/v1/colleges");
      let data: any[] = res.data?.data ?? res.data;
      
      if (myUserTypeCode && !isSuperUser) {
        data = data.filter(c => Number(c.college_id) === Number(me?.college_id));
      }
  
      setColleges(data.map(c => ({
        id: String(c.college_id),
        name: c.college_name,
        academicCode: c.college_code || ""
      })));
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل الكليات", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
    if (myUserTypeCode) {
      loadColleges();
    }
  }, [myUserTypeCode]);

  // منطق المزامنة بين الرابط والكلية المختارة
  useEffect(() => {
    if (isLoading || colleges.length === 0) return;

    if (routeId) {
      const target = colleges.find(c => c.id === routeId);
      if (target) {
        setSelectedCollege(target);
      }
    } else {
      if (colleges.length === 1 && !isSuperUser) {
         setSelectedCollege(colleges[0]);
      } else {
         setSelectedCollege(null);
      }
    }
  }, [routeId, colleges, isLoading, isSuperUser]); 

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

  const handleSelectCollege = (college: College) => {
    setSelectedCollege(college);
    navigate(`/colleges/${college.id}/dashboard`);
  };

  const handleBackToAll = () => {
    setSelectedCollege(null);
    navigate('/colleges');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6">
        {!selectedCollege ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">الكليات</h1>
              {isSuperUser && (
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
                      <TableRow key={college.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectCollege(college)}>
                        <TableCell className="font-medium">{college.name}</TableCell>
                        <TableCell>{college.academicCode}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isSuperUser && (
                              <>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditCollege(college); }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteCollege(college.id); }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSelectCollege(college); }}>
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                 {isSuperUser && (
                    <Button variant="outline" onClick={handleBackToAll} className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للكليات
                    </Button>
                 )}
                 <h1 className="text-2xl sm:text-3xl font-bold mt-1">{selectedCollege.name}</h1>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="h-auto flex flex-wrap justify-center bg-muted/30 p-2 rounded-xl border border-border/50 gap-2 w-full">
                  {[
                    { val: "colleges-dashboard", label: "لوحة التحكم" },
                    // ✅ إضافة تبويب ضمان الجودة هنا
                    { val: "quality-assurance", label: "ضمان الجودة" },
                    { val: "departments", label: "الأقسام" },
                    { val: "classrooms", label: "القاعات" },
                    { val: "academic-titles", label: "الرتب الأكاديمية" },
                    { val: "Academic Staff", label: "هيئة التدريس" },
                    { val: "Timetable", label: "الجدول" },
                    { val: "Enrollment", label: "التسجيل" },
                    { val: "Reports", label: "التقارير" },
                    { val: "periods", label: "الفترات" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.val}
                      value={tab.val}
                      className="
                        flex-1 min-w-[110px] sm:min-w-[140px] md:min-w-[auto]
                        px-3 py-2.5
                        rounded-lg 
                        text-xs sm:text-sm font-medium 
                        transition-all duration-200
                        border border-transparent
                        data-[state=active]:bg-primary 
                        data-[state=active]:text-primary-foreground 
                        data-[state=active]:shadow-sm
                        data-[state=active]:border-primary/10
                        hover:bg-background/80
                      "
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
              </TabsList>

              <TabsContent value="colleges-dashboard">
                <Suspense fallback={<ModuleSkeleton title="لوحة التحكم " />}>
                  {activeTab === "colleges-dashboard" && (
                    <CollegesDashboardModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              {/* ✅ إضافة المحتوى الخاص بضمان الجودة */}
              <TabsContent value="quality-assurance">
                <Suspense fallback={<ModuleSkeleton title="ضمان الجودة" />}>
                  {activeTab === "quality-assurance" && (
                    <QualityAssuranceModule collegeId={selectedCollege.id} />
                  )}
                </Suspense>
              </TabsContent>

              <TabsContent value="academic-titles">
                <Suspense fallback={<ModuleSkeleton title="الدرجات الأكاديمية" />}>
                  {activeTab === "academic-titles" && <AcademicTitlesModule collegeId={selectedCollege.id} />} 
                </Suspense> 
              </TabsContent>

              <TabsContent value="departments">
                <Suspense fallback={<ModuleSkeleton title=" ألاقسام " />}>
                  {activeTab === "departments" && <DepartmentsModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="classrooms">
                <Suspense fallback={<ModuleSkeleton title=" المباني " />}>
                  {activeTab === "classrooms" && <ClassroomsModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="Academic Staff">
                <Suspense fallback={<ModuleSkeleton title=" أعضاء هيئة التدريس " />}>
                  {activeTab === "Academic Staff" && <AcademicStaffModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="Timetable">
                <Suspense fallback={<ModuleSkeleton title="الجدول الزمني" />}>
                  {activeTab === "Timetable" && <TimetableModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

              <TabsContent value="periods">
                <Suspense fallback={<ModuleSkeleton title="الفترات" />}>
                  {activeTab === "periods" && <PeriodsModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Enrollment">
                <Suspense fallback={<ModuleSkeleton title="تسجيل الطلاب" />}>
                  {activeTab === "Enrollment" && <EnrollmentModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="Reports">
                <Suspense fallback={<ModuleSkeleton title="التقارير" />}>
                  {activeTab === "Reports" && <ReportsModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}