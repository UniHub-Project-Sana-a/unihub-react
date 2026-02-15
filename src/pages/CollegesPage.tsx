import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom"; 
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, ArrowLeft, ChevronRight, Loader2, Upload, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // تأكد من وجود هذا المكون أو استخدم img عادي
import { usePermission } from "@/hooks/usePermission";

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
const MakeupRequestsModule = lazy(() => import("@/components/colleges/MakeupRequestsModule"));
const QualityAssuranceModule = lazy(() => import("@/components/colleges/qa/QualityAssuranceModule"));

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

// تحديث الواجهة لتشمل الشعار
interface College {
  id: string;
  name: string;
  academicCode: string;
  logoUrl: string | null; // الحقل الجديد
}

// واجهة حالة النموذج
interface CollegeFormData {
    name: string;
    academicCode: string;
    logoFile: File | null;
    logoPreview: string | null;
}

export default function CollegesPage() {
  const { can } = usePermission();
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
  const STORAGE_BASE_URL = "http://192.168.0.124/unihub-api/storage/";
  
  // تحديث الحالة لتدعم الملفات
  const [collegeFormData, setCollegeFormData] = useState<CollegeFormData>({ 
      name: "", 
      academicCode: "", 
      logoFile: null, 
      logoPreview: null 
  });

  const [userTypes, setUserTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const myUserType = useMemo(() => {
    if (!me || !userTypes || userTypes.length === 0) return null;
    return userTypes.find(t => t.user_type_id === (me as any).user_type_id) || null;
  }, [me, userTypes]);
  
  const myUserTypeCode = myUserType?.user_type_code;
  const isSuperUser = myUserTypeCode === 'presidency' || myUserTypeCode === 'admin';

  // تحميل الكليات
  const loadColleges = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/v1/colleges");
      
      // التأكد من أن البيانات مصفوفة لتجنب الأخطاء
      let data: any[] = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      // تصفية الكليات حسب صلاحيات المستخدم
      if (myUserTypeCode && !isSuperUser) {
        data = data.filter(c => Number(c.college_id) === Number(me?.college_id));
      }
  
      const mappedColleges = data.map(c => {
        return {
          id: String(c.college_id),
          name: c.college_name,
          academicCode: c.college_code || "",
          // استخدم الحقل الجاهز مباشرة من الـ API
          logoUrl: c.logoUrl ? `${c.logoUrl}?t=${new Date().getTime()}` : null 
        };
      });

      setColleges(mappedColleges);

    } catch (error) {
      console.error("Error loading colleges:", error); // طباعة الخطأ في الكونسول للمراجعة
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
    setCollegeFormData({ name: "", academicCode: "", logoFile: null, logoPreview: null });
  };

  const handleEditCollege = (college: College) => {
    setIsCollegeFormOpen(true);
    setEditingCollegeId(college.id);
    setCollegeFormData({ 
        name: college.name, 
        academicCode: college.academicCode,
        logoFile: null,
        logoPreview: college.logoUrl // عرض الشعار الحالي كمعاينة مبدئية
    });
  };

  // دالة التعامل مع اختيار ملف الصورة
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setCollegeFormData(prev => ({
            ...prev,
            logoFile: file,
            logoPreview: URL.createObjectURL(file) // إنشاء رابط محلي للمعاينة
        }));
    }
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
      // استخدام FormData لإرسال الملفات
      const formData = new FormData();
      formData.append('college_name', collegeFormData.name);
      formData.append('college_code', collegeFormData.academicCode);
      
      if (collegeFormData.logoFile) {
          formData.append('college_logo', collegeFormData.logoFile);
      }

      const config = {
          headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editingCollegeId) {
        // في Laravel عند تحديث ملفات يفضل استخدام POST مع _method: PUT
        formData.append('_method', 'PUT'); 
        await api.post(`/v1/colleges/${editingCollegeId}`, formData, config);
        toast({ title: "نجاح", description: "تم تحديث الكلية والشعار" });
      } else {
        await api.post("/v1/colleges", formData, config);
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

  // 2. تعريف التبويبات مع صلاحياتها
  const tabsConfig = [
    { val: "colleges-dashboard", label: "لوحة التحكم",      perm: "dashboard.view_college" },
    { val: "departments",        label: "الخطة الدراسية",   perm: "study_plan.view" },
    { val: "classrooms",         label: "القاعات",          perm: "locations.view" },
    { val: "academic-titles",    label: "الرتب الأكاديمية", perm: "academic_titles.view" },
    { val: "Academic Staff",     label: "هيئة التدريس",     perm: "staff.view" },
    { val: "Timetable",          label: "الجدول",           perm: "timetable.view_lectures" },
    { val: "Enrollment",         label: "التسجيل",          perm: "groups.view" },
    { val: "periods",            label: "الفترات",          perm: "periods.view" },
    { val: "Reports",            label: "التقارير",         perm: "reports.view_custom" }, // تأكد من وجود هذه الصلاحية
    { val: "MakeupRequests",     label: "طلبات التعويض",    perm: "requests.view_makeup" }, // تأكد من وجود هذه الصلاحية
    { val: "QualityAssurance",   label: "ضمان الجودة",      perm: "dashboard.view_college" }, // qa.manage 
  ];
  
  // 3. تصفية القائمة بناءً على الصلاحيات
  const visibleTabs = tabsConfig.filter(tab => can(tab.perm));

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6">
        {!selectedCollege ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">الكليات</h1>
              {can('colleges.create') && (
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
                    <div className="flex gap-4 items-start">
                        {/* قسم رفع الصورة */}
                        <div className="w-32 h-32 shrink-0 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden bg-muted/20">
                            {collegeFormData.logoPreview ? (
                                <img src={collegeFormData.logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-muted-foreground text-xs p-2">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                    <span>اختر شعار</span>
                                </div>
                            )}
                            <Input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <Label>اسم الكلية *</Label>
                                <Input value={collegeFormData.name} onChange={(e) => setCollegeFormData({ ...collegeFormData, name: e.target.value })} required />
                            </div>
                            <div>
                                <Label>الكود الأكاديمي *</Label>
                                <Input value={collegeFormData.academicCode} onChange={(e) => setCollegeFormData({ ...collegeFormData, academicCode: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsCollegeFormOpen(false)}>إلغاء</Button>
                        <Button type="submit">حفظ</Button>
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
                      {/* 1. عمود الشعار: عرض ثابت */}
                      <TableHead className="w-[120px] text-right">الشعار</TableHead>
                      
                      {/* 2. عمود الاسم: يأخذ المساحة المتبقية */}
                      <TableHead className="w-auto min-w-[200px] text-right">اسم الكلية</TableHead>
                      
                      {/* 3. عمود الكود: عرض ثابت */}
                      <TableHead className="w-[150px] text-right">الكود الأكاديمي</TableHead>
                      
                      {/* 4. عمود الإجراءات: عرض ثابت */}
                      <TableHead className="w-[140px] text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colleges.map((college) => (
                      <TableRow 
                        key={college.id} 
                        // 1. التحكم في الـ CSS: نظهر تأثير الـ Hover والمؤشر فقط إذا كان يملك الصلاحية
                        className={`${
                          can('dashboard.view_college') 
                            ? "cursor-pointer hover:bg-muted/50" 
                            : "cursor-default"
                        } transition-colors h-[70px]`} 
                        
                        // 2. التحكم في الحدث: ننفذ الدالة فقط إذا كان الشرط متحققاً
                        onClick={() => {
                          if (can('dashboard.view_college')) {
                            handleSelectCollege(college);
                          }
                        }}
                      >
                        {/* 1. خلية الشعار */}
                        <TableCell className="align-middle">
                          {college.logoUrl ? (
                            <div className="h-12 w-12 rounded-md overflow-hidden border bg-white p-1 flex items-center justify-center shrink-0">
                              <img 
                                src={college.logoUrl} 
                                alt={college.name} 
                                className="h-full w-full object-contain"
                                // إضافة onError لإخفاء الصورة المكسورة إذا فشل التحميل
                                onError={(e) => {
                                  console.error("فشل تحميل الصورة على الرابط:", college.logoUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerText = "!"; 
                                }} 
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground border shrink-0">
                              {college.academicCode ? college.academicCode.substring(0, 2).toUpperCase() : "??"}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* 2. خلية الاسم */}
                        <TableCell className="font-medium text-base align-middle">
                            {college.name}
                        </TableCell>
                        
                        {/* 3. خلية الكود */}
                        <TableCell className="align-middle">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                {college.academicCode}
                            </span>
                        </TableCell>
                        
                        {/* 4. خلية الإجراءات */}
                        <TableCell className="align-middle">
                          <div className="flex gap-1 items-center justify-end"> 
                            
                            {/* زر التعديل */}
                            {can('colleges.update') && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50" 
                                onClick={(e) => { e.stopPropagation(); handleEditCollege(college); }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                        
                            {/* زر الحذف */}
                            {can('colleges.delete') && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCollege(college.id); }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                        
                            {/* زر الدخول للكلية (السهم) */}
                            {/* نستخدم صلاحية عرض لوحة تحكم الكلية هنا لأن السهم يوجه لداخل الكلية */}
                            {can('dashboard.view_college') && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" 
                                onClick={(e) => { e.stopPropagation(); handleSelectCollege(college); }}
                              >
                                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                              </Button>
                            )}
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
              <div className="flex items-center gap-4">
                 {isSuperUser && (
                    <Button variant="ghost" size="icon" onClick={handleBackToAll} className="mb-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                 )}
                 
                 {/* عرض الشعار الكبير في صفحة الكلية */}
                 <div className="flex items-center gap-3">
                    {selectedCollege.logoUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white p-1">
                            <img src={selectedCollege.logoUrl} alt={selectedCollege.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold mt-1">{selectedCollege.name}</h1>
                 </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-auto flex flex-wrap justify-center bg-muted/30 p-2 rounded-xl border border-border/50 gap-2 w-full">
                    {visibleTabs.map((tab) => (
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
                    
                    {/* (اختياري) رسالة في حال اختفت جميع التبويبات */}
                    {visibleTabs.length === 0 && (
                      <div className="w-full text-center py-2 text-muted-foreground text-sm">
                        لا توجد أقسام متاحة للعرض
                      </div>
                    )}
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

              <TabsContent value="MakeupRequests">
                <Suspense fallback={<ModuleSkeleton title="طلبات التعويض" />}>
                  {activeTab === "MakeupRequests" && <MakeupRequestsModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

              {/* ✅ الإضافة الجديدة هنا */}
              <TabsContent value="QualityAssurance">
                <Suspense fallback={<ModuleSkeleton title="نظام ضمان الجودة" />}>
                  {activeTab === "QualityAssurance" && <QualityAssuranceModule collegeId={selectedCollege.id} />}
                </Suspense>
              </TabsContent>

            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}