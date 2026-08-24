import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LecturerDetailsDialog } from "./LecturerDetailsDialog";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table";
import { GroupAttendanceDialog } from "@/components/reports/GroupAttendanceDialog";
import { InstructorsReportDialog } from "@/components/reports/InstructorsReportDialog";
import { AdminGradesReportDialog } from "@/components/reports/AdminGradesReportDialog";
import { QAReportDialog } from "@/components/reports/QAReportDialog";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Users,BookOpen,Calendar,MapPin,Download,Filter,BarChart3,PieChart,LineChart,FileText,Search,Loader2,AlertCircle,Edit, Plus, Printer, ShieldCheck, GraduationCap, ArrowRight} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";

// --- Interfaces ---
interface Department {
  department_id: number;
  department_name: string;
}

interface Program {
  program_id: number;
  program_name: string;
}

interface Level {
  level_id: number;
  level_name: string;
  level_number: number;
}

interface ReportsData {
  financial: {
    approved: number;
    executed: number;
    compensation: number;
    missed: number;
  };
  instructors: {
    id: number;
    name: string;
    department: string;
    approved: number;
    delivered: number;
    absences: number;
    makeups: number;
    rooms: string; 
    total_hours: number;
    compliance_rate: number;
    academic_rank: string;
    hourly_price: number;
    total_amount: number;
  }[];
  courses: {
    course_id: number;
    course_name: string;
    course_code: string;
    notes: string | null;
    total_lectures: number;
    attendance_rate: number;
    students_count: number;
  }[];
}

interface ReportsModuleProps {
  collegeId: string | number;
}

export default function ReportsModule({ collegeId }: ReportsModuleProps) {
  const {can} = usePermission();
  const { toast } = useToast();
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<{id: number, name: string} | null>(null);
  const [isInstructorReportOpen, setIsInstructorReportOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [calendarType, setCalendarType] = useState<'gregorian' | 'hijri'>('gregorian');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<number | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({ type: 'deduction', amount: '', reason: '' });
  const [isPercentage, setIsPercentage] = useState(false);
  const [percentageValue, setPercentageValue] = useState('');

    // --- Financial States ---
  const [financialCycle, setFinancialCycle] = useState<any>(null);
  const [isGeneratingCycle, setIsGeneratingCycle] = useState(false);

  // --- 1. UI & Tab Control States ---
  const [activeTab, setActiveTab] = useState("financial"); // الافتراضي: تبويب الطلاب
  const [selectedLecturerId, setSelectedLecturerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 2. Data Loading States ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- 3. Filter Selection States ---
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  // --- 4. Lookup Lists States ---
  const [academicYearsList, setAcademicYearsList] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [semestersList, setSemestersList] = useState<{id: number, name: string}[]>([]);

  // لتخزين المقرر المختار لعرض مجموعاته
  const [selectedCourseIdForGroups, setSelectedCourseIdForGroups] = useState<number | null>(null);
  const [courseGroups, setCourseGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // لتخزين المقرر والمجموعة المختارة لتقرير الدرجات
  const [selectedGradeReportGroup, setSelectedGradeReportGroup] = useState<{groupId: number, courseId: number, groupYear: string;} | null>(null);

  // بيانات تقرير الجودة
  const [qaData, setQaData] = useState<any[]>([]);
  const [selectedQATimetableId, setSelectedQATimetableId] = useState<number | null>(null);

  // ==================================================================================
  // Effects: Fetching Lookups (Cascading Logic)
  // ==================================================================================

  // 1. Fetch Academic Years & Departments (Initial Load)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!collegeId) return;
      try {
        // أ) جلب السنوات الدراسية
        // ملاحظة: إذا لم يكن لديك API مخصص، يمكنك استخدام مسار مؤقت أو بيانات وهمية
        try {
          const yearsRes = await api.get('/v1/lookups/academic-years'); 
          setAcademicYearsList(yearsRes.data.data || []);
        } catch (err) {
           // Fallback if API not ready
           console.warn("Academic years API missing, using fallback.");
           setAcademicYearsList(["2023-2024", "2024-2025", "2025-2026"]);
        }

        // ب) جلب الأقسام
        const deptsRes = await api.get('/v1/departments', { params: { college_id: collegeId } });
        setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : (deptsRes.data.data || []));

      } catch (error) {
        console.error("Failed to fetch initial lookup data", error);
      }
    };
    fetchInitialData();
  }, [collegeId]);

  // 2. Fetch Programs (Depends on Department)
  useEffect(() => {
    // Reset dependents
    setSelectedProgram("all");
    setSelectedLevel("all");
    setSelectedSemester("all");
    setPrograms([]);
    setLevels([]);
    setSemestersList([]);

    const fetchPrograms = async () => {
      if (selectedDepartment === "all") return;
      try {
        const res = await api.get('/v1/programs', { params: { department_id: selectedDepartment } });
        setPrograms(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } catch (error) {
        console.error("Failed to fetch programs", error);
      }
    };
    fetchPrograms();
  }, [selectedDepartment]);

  // 3. Fetch Levels (Depends on Program)
  useEffect(() => {
    // Reset dependents
    setSelectedLevel("all");
    setSelectedSemester("all");
    setLevels([]);
    setSemestersList([]);

    const fetchLevels = async () => {
      if (selectedProgram === "all") return;
      try {
        const res = await api.get('/v1/levels', { params: { program_id: selectedProgram } });
        setLevels(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } catch (error) {
        console.error("Failed to fetch levels", error);
      }
    };
    fetchLevels();
  }, [selectedProgram]);

  // 4. Fetch Semesters (Depends on Level)
  useEffect(() => {
    // Reset dependent
    setSelectedSemester("all");
    setSemestersList([]);

    const fetchSemesters = async () => {
      if (selectedLevel === "all") return;
      try {
        const res = await api.get('/v1/semesters', { params: { level_id: selectedLevel } });
        const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        
        // Map to standardized format {id, name}
        setSemestersList(rawData.map((s: any) => ({
          id: s.semester_id,
          name: s.semester_name || `الترم ${s.term_number}`
        })));
      } catch (error) {
        console.error("Failed to fetch semesters", error);
      }
    };
    fetchSemesters();
  }, [selectedLevel]);

  // جلب المجموعات عند اختيار مقرر
  useEffect(() => {
    const fetchCourseGroups = async () => {
      // إذا تم إلغاء الاختيار، نفرغ القائمة
      if (!selectedCourseIdForGroups) {
        setCourseGroups([]);
        return;
      }

      setIsLoadingGroups(true);
      try {
        // ✅ استخدام المسار الجديد المخصص في الباك إند
        const res = await api.get(`/v1/colleges/${collegeId}/reports/course-groups`, { 
          params: { 
            course_id: selectedCourseIdForGroups,
            academic_year: selectedAcademicYear === "all" ? null : selectedAcademicYear
          }
        });
        setCourseGroups(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch groups", error);
        toast({ title: "خطأ", description: "فشل جلب مجموعات المقرر", variant: "destructive" });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchCourseGroups();
  }, [selectedCourseIdForGroups, selectedAcademicYear, collegeId]); // تمت إضافة collegeId للاعتماديات

    // دالة لجلب بيانات الجودة
  const fetchQAReport = async () => {
      setLoading(true);
      try {
          const res = await api.get(`/v1/colleges/${collegeId}/reports/qa-performance`, {
              params: {
                  academic_year: selectedAcademicYear === "all" ? null : selectedAcademicYear,
                  department_id: selectedDepartment === "all" ? null : selectedDepartment
              }
          });
          setQaData(res.data.data);
      } catch (error) {
          console.error("QA Fetch Error", error);
      } finally {
          setLoading(false);
      }
  };
  
  // Trigger fetch when tab is active
  useEffect(() => {
      if (activeTab === 'qa') {
          fetchQAReport();
      }
  }, [activeTab, selectedAcademicYear, selectedDepartment]);

  // ==================================================================================
  // Effect: Fetch Main Report Data (Triggered by ANY Filter Change)
  // ==================================================================================
  useEffect(() => {
    const fetchReportData = async () => {
      if (!collegeId) return;
      
      setLoading(true);
      try {
        const res = await api.get(`/v1/colleges/${collegeId}/reports`, {
          params: { 
            academic_year: selectedAcademicYear === "all" ? null : selectedAcademicYear,
            month: selectedMonth === "all" ? null : selectedMonth,
            semester_id: selectedSemester === "all" ? null : selectedSemester,
            department_id: selectedDepartment === "all" ? null : selectedDepartment,
            program_id: selectedProgram === "all" ? null : selectedProgram,
            level_id: selectedLevel === "all" ? null : selectedLevel,
          }
        });
        setData(res.data.data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({
          title: "تنبيه",
          description: "تعذر تحديث البيانات للفلاتر المحددة.",
          variant: "destructive", // أو "default" ليكون أقل إزعاجاً
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [
    collegeId, 
    selectedAcademicYear,
    selectedMonth,
    selectedDepartment, 
    selectedProgram, 
    selectedLevel, 
    selectedSemester,
    toast
  ]);

  // ==================================================================================
  // Helper Functions
  // ==================================================================================
  
  // دالة للحصول على النص العربي للفلتر لعرضه في شريط المسار (Breadcrumb)
  const getFilterLabel = (type: 'dept' | 'prog' | 'lvl' | 'sem' | 'year', id: string) => {
    if (id === "all") return "الكل";
    
    switch (type) {
      case 'year': 
        return id; // السنة نصية أصلاً
      case 'dept': 
        return departments.find(d => String(d.department_id) === id)?.department_name || id;
      case 'prog': 
        return programs.find(p => String(p.program_id) === id)?.program_name || id;
      case 'lvl': 
        return levels.find(l => String(l.level_id) === id)?.level_name || `مستوى ${id}`;
      case 'sem': 
        return semestersList.find(s => String(s.id) === id)?.name || `فصل ${id}`;
      default: 
        return id;
    }
  };

  const handleDownloadReport = async (type: string) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/v1/colleges/${collegeId}/reports/detailed`, {
        params: { 
          type: type, 
          export: 'true',
          academic_year: selectedAcademicYear === "all" ? null : selectedAcademicYear,
          semester_id: selectedSemester === "all" ? null : selectedSemester,
          department_id: selectedDepartment === "all" ? null : selectedDepartment,
          program_id: selectedProgram === "all" ? null : selectedProgram,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `report_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "تم التصدير", description: `تم تحميل تقرير ${type} بنجاح.` });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "خطأ", description: "فشل التصدير.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

   const openSingleInstructorReport = (instructor: any) => {
    setReportData([instructor]); // نضع محاضراً واحداً فقط في القائمة
    setIsInstructorReportOpen(true);
  };

  // دالة لفتح التقرير الشامل (للمحاضرين المفلترين)
  const openFullReport = () => {
    // نستخدم القائمة المفلترة بالبحث الحالي
    const filtered = instructorAttendance.filter(i => 
       i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setReportData(filtered);
    setIsInstructorReportOpen(true);
  };

    // 1. دالة لجلب الكشف المالي للشهر المختار
  const fetchFinancialCycle = async () => {
    if (!collegeId || selectedMonth === 'all' || selectedAcademicYear === 'all') {
        setFinancialCycle(null);
        return;
    }
    
    // نحتاج لاستخراج السنة الرقمية من النص (مثلاً "2024-2025" -> 2024 أو 2025 حسب الشهر)
    // للتبسيط، سنرسل السنة كما هي والباك إند يتعامل، أو نطلب من المستخدم تحديد سنة ميلادية دقيقة للراتب
    // سنفترض هنا أن السنة المختارة هي السنة المالية (2024 مثلاً)
    // *ملاحظة: يفضل إضافة حقل "سنة مالية" مستقل، لكن سنستخدم الجزء الأول من السنة الدراسية مؤقتاً
    const yearPart = parseInt(selectedAcademicYear.split('-')[0]); 

    try {
      const res = await api.get(`/v1/colleges/${collegeId}/financial/cycle`, {
        params: {
          month: selectedMonth,
          year: yearPart,
          calendar_type: calendarType
        }
      });
      setFinancialCycle(res.data.data);
    } catch (error) {
      console.log("No cycle found or error");
      setFinancialCycle(null); // لم يتم إنشاء كشف بعد
    }
  };

  // استدعاء الدالة عند تغيير الشهر أو السنة
  useEffect(() => {
    if (activeTab === 'financial') {
        fetchFinancialCycle();
    }
  }, [selectedMonth, selectedAcademicYear, activeTab]);


  // 2. دالة لتوليد/تحديث الكشف (Generate)
  const handleGenerateCycle = async () => {
    if (selectedMonth === 'all') {
        toast({title: "تنبيه", description: "يرجى اختيار شهر محدد لإنشاء الكشف.", variant: "destructive"});
        return;
    }
    
    setIsGeneratingCycle(true);
    const yearPart = parseInt(selectedAcademicYear.split('-')[0]); // 2024

    try {
      const res = await api.post(`/v1/colleges/${collegeId}/financial/generate`, {
        month: selectedMonth,
        year: yearPart,
        calendar_type: calendarType
      });
      setFinancialCycle(res.data.data);
      toast({ title: "تم بنجاح", description: "تم حساب الاستحقاقات وتحديث الكشف." });
    } catch (error: any) {
      toast({ 
          title: "خطأ", 
          description: error.response?.data?.message || "فشل إنشاء الكشف", 
          variant: "destructive" 
      });
    } finally {
      setIsGeneratingCycle(false);
    }
  };

  const handleAddAdjustment = async () => {
    if (!selectedPayoutId || !adjustmentData.amount) return;
    
    try {
      await api.post(`/v1/colleges/${collegeId}/financial/payouts/${selectedPayoutId}/adjustments`, {
        type: adjustmentData.type,
        amount: Number(adjustmentData.amount),
        reason: adjustmentData.reason
      });
      
      toast({ title: "تم بنجاح", description: "تمت إضافة التسوية وتحديث الصافي." });
      setAdjustmentModalOpen(false);
      fetchFinancialCycle(); // تحديث الجدول لرؤية التغيير
    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل العملية", variant: "destructive" });
    }
  };

  const updateCycleStatus = async (newStatus: string) => {
    if (!financialCycle) return;
    try {
      await api.put(`/v1/colleges/${collegeId}/financial/cycles/${financialCycle.cycle_id}/status`, {
        status: newStatus
      });
      fetchFinancialCycle();
      toast({ title: "تحديث الحالة", description: `تم تغيير حالة الكشف إلى ${newStatus}` });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
    }
  };

   // دالة لحساب المبلغ بناءً على النسبة
  const calculateAmountFromPercentage = (percent: string) => {
    setPercentageValue(percent); // تحديث حقل النسبة للعرض
    
    if (!selectedPayoutId || !financialCycle) return;
    
    // البحث عن سجل المحاضر المختار في البيانات المحملة حالياً
    const payout = financialCycle.payouts.find((p: any) => p.payout_id === selectedPayoutId);
    
    if (payout) {
      const base = parseFloat(payout.base_amount || 0); // الراتب الأساسي
      const percentage = Number(percent) || 0;
      
      // الحساب الدقيق
      const calculatedAmount = (base * (percentage / 100)).toFixed(2);
      
      // تحديث القيمة التي سترسل للباك إند
      setAdjustmentData(prev => ({ ...prev, amount: calculatedAmount }));
    }
  };

  // ==================================================================================
  // Data Mapping for Render
  // ==================================================================================
  
  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري معالجة البيانات...</p>
      </div>
    );
  }

  // 2. Empty State
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>لا توجد بيانات متاحة.</p>
      </div>
    );
  }

  // 3. Prepare Data
  const financialKPIs = [
    { 
      label: "المحاضرات المعتمدة", 
      value: data.financial.approved.toString(), 
      icon: BookOpen, 
      change: "مجدولة", 
      trend: "neutral" 
    },
    { 
      label: "المحاضرات المنفذة", 
      value: data.financial.executed.toString(), 
      icon: Calendar, 
      change: `${Math.round((data.financial.executed / (data.financial.approved || 1)) * 100)}% إنجاز`, 
      trend: "up" 
    },
    { 
      label: "التعويض المقدر", 
      value: Number(data.financial.compensation).toLocaleString(), 
      icon: DollarSign, 
      change: "ريال يمني", 
      trend: "up" 
    },
    { 
      label: "الغياب/التأخير", 
      value: data.financial.missed.toString(), 
      icon: TrendingDown, 
      change: "جلسة فائتة", 
      trend: "down" 
    },
  ];

  const getMonthName = (monthIndex: number) => {
    if (calendarType === 'gregorian') {
      return new Date(2024, monthIndex, 1).toLocaleString('ar-EG', { month: 'long' }); // يناير
    } else {
      // أسماء الأشهر الهجرية يدوياً للدقة
      const hijriMonths = [
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
        "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
      ];
      return hijriMonths[monthIndex];
    }
  };

    // دالة مساعدة للحصول على اسم الشهر المختار
  const getSelectedMonthName = () => {
    if (selectedMonth === 'all') return 'الكل';
    const monthIndex = parseInt(selectedMonth) - 1;
    return getMonthName(monthIndex); // نستخدم نفس دالة التسمية السابقة
  };


  const instructorAttendance = data.instructors || [];
  const courseAttendance = data.courses || [];

  // 1. تعريف التبويبات وصلاحياتها
  const tabsConfig = [
    { 
      value: "financial", 
      label: "التقارير المالية", 
      permission: "reports.financial_manage" 
    },
    { 
      value: "instructor", 
      label: "حضور المحاضرين", 
      permission: "reports.lecturer_attendance" 
    },
    { 
      value: "student", 
      label: "حضور الطلاب", 
      permission: "reports.student_attendance" 
    },
    { 
      value: "grades", 
      label: "نتائج أعمال الفصل", 
      permission: "reports.semester_results" 
    },
    { 
      value: "qa", 
      label: "جودة التعليم", 
      permission: "reports.semester_results" //"reports.quality_assurance" 
    },
  ];
  
  // 2. تصفية التبويبات المسموح بها فقط
  const visibleTabs = tabsConfig.filter(tab => can(tab.permission));
  
  // 3. تحديد كلاس الـ Grid ديناميكياً بناءً على العدد
  // إذا كان العدد 1، يأخذ العرض كامل، 2 يقسم بالنصف، وهكذا...
  const gridClassMap = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };
  
  // نختار الكلاس المناسب، وإذا لم يوجد (0 مثلاً) نضع قيمة افتراضية
  const dynamicGridClass = gridClassMap[visibleTabs.length] || "md:grid-cols-4";
  return (
    <div className="space-y-6" dir="rtl">
      {/* ✅ 1. Global Controls (محسن ومدمج) */}
      <Card className="backdrop-blur-sm border-primary/20 shadow-md mb-8">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col gap-6">
            
            {/* الصف الأول: الفلاتر الزمنية (السنة والشهر) */}
            <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-border/50">
              
              {/* السنة الدراسية */}
              <div className="space-y-2 w-full sm:w-48">
                <Label className="text-sm font-bold text-primary">السنة الدراسية</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger className="h-10 bg-background">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل السنوات</SelectItem>
                    {academicYearsList.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الشهر (مجموعة متصلة) */}
              <div className="space-y-2 w-full sm:w-auto flex-1 max-w-xs">
                <Label className="text-sm font-bold text-primary">الشهر (فترة التقرير)</Label>
                <div className="flex items-center border rounded-md bg-background overflow-hidden h-10 shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  
                  {/* زر التبديل */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-none border-l bg-muted/20 hover:bg-muted text-muted-foreground"
                    title={calendarType === 'gregorian' ? "التقويم الميلادي" : "التقويم الهجري"}
                    onClick={() => setCalendarType(prev => prev === 'gregorian' ? 'hijri' : 'gregorian')}
                  >
                    <span className="text-xs font-bold">
                      {calendarType === 'gregorian' ? 'م' : 'هـ'}
                    </span>
                  </Button>

                  {/* قائمة الأشهر */}
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="flex-1 h-10 border-none shadow-none focus:ring-0 bg-transparent px-3">
                      <SelectValue placeholder="اختر الشهر" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      <SelectItem value="all" className="font-bold text-primary border-b mb-1 bg-muted/20">
                        الكل (سنوي)
                      </SelectItem>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          <span className="w-6 inline-block text-muted-foreground text-xs font-mono">{i + 1}</span>
                          {getMonthName(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

            {/* الصف الثاني: الفلاتر الهيكلية (القسم -> البرنامج -> المستوى -> الفصل) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. القسم */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">القسم العلمي</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="الكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأقسام</SelectItem>
                    {departments.map(d => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
  
              {/* 2. البرنامج */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">البرنامج</Label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram} disabled={selectedDepartment === "all"}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="الكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل البرامج</SelectItem>
                    {programs.map(p => <SelectItem key={p.program_id} value={String(p.program_id)}>{p.program_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
  
              {/* 3. المستوى */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">المستوى</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={selectedProgram === "all"}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="الكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المستويات</SelectItem>
                    {levels.map(l => <SelectItem key={l.level_id} value={String(l.level_id)}>{l.level_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
  
              {/* 4. الترم */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">الفصل</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={selectedLevel === "all"}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="الكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفصول</SelectItem>
                    {semestersList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
  
      {/* ✅ 2. Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        {/* ✅ Professional Responsive Grid Layout */}
          <TabsList className={`grid w-full h-auto min-h-[3.5rem] grid-cols-2 ${dynamicGridClass} bg-muted/30 backdrop-blur-sm shadow-sm border border-border/60 rounded-xl p-1.5 gap-2`}>
            {visibleTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="rounded-lg font-medium h-10 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-background/50"
              >
                {tab.label}
              </TabsTrigger>
            ))}

                    {/* رسالة احتياطية في حال لم يملك أي صلاحية (اختياري) */}
            {visibleTabs.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-2">
                لا توجد صلاحيات لعرض التقارير
              </div>
            )}

          </TabsList>

        {/* Financial Management Tab */}
        <TabsContent value="financial" className="space-y-6 animate-in fade-in duration-500">
          
          {/* 1. شريط التحكم والدورة */}
          <Card className={`border-l-4 shadow-sm ${financialCycle ? 'border-l-green-600 bg-green-50/30' : 'border-l-gray-400 bg-gray-50'}`}>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* تفاصيل */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full shadow-sm ${financialCycle ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                        {financialCycle ? 'إدارة مستحقات المحاضرين' : 'لا يوجد كشف لهذا الشهر'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      فترة الاستحقاق: 
                      <span className="font-bold bg-white px-2 py-0.5 rounded border">
                        {selectedMonth !== 'all' ? getMonthName(parseInt(selectedMonth)-1) : '--'} {selectedAcademicYear}
                      </span>
                    </p>
                  </div>
                </div>

                {/* الإجراءات والتحكم بالحالة */}
                <div className="flex items-center gap-3">
                  {financialCycle ? (
                      <>
                        {/* 1. شارة الحالة (Badge) */}
                        <div className="text-center px-4 border-l border-green-200/50 hidden sm:block">
                            <span className="block text-xs text-muted-foreground mb-1">حالة الكشف</span>
                            <Badge 
                              variant="outline" 
                              className={`bg-white font-bold ${
                                financialCycle.status === 'approved' ? 'text-green-700 border-green-300' : 
                                financialCycle.status === 'paid' ? 'text-blue-700 border-blue-300' :
                                'text-yellow-700 border-yellow-300'
                              }`}
                            >
                              {financialCycle.status === 'draft' ? 'مسودة' : 
                               financialCycle.status === 'review' ? 'قيد المراجعة' :
                               financialCycle.status === 'approved' ? 'معتمد نهائياً' : 
                               financialCycle.status === 'paid' ? 'تم الصرف' : financialCycle.status}
                            </Badge>
                        </div>

                        {/* 2. أزرار المرحلة الأولى: مسودة (Draft) */}
                        {financialCycle.status === 'draft' && (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={handleGenerateCycle} 
                                disabled={isGeneratingCycle}
                                title="إعادة حساب الساعات من الجدول"
                              >
                                  {isGeneratingCycle ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                  <span className="hidden lg:inline ml-2">تحديث</span>
                              </Button>

                              <Button 
                                className="gap-2 bg-blue-600 hover:bg-blue-700" 
                                onClick={() => updateCycleStatus('review')}
                              >
                                  <FileText className="w-4 h-4" />
                                  إرسال للمراجعة
                              </Button>
                            </>
                        )}

                        {/* 3. أزرار المرحلة الثانية: مراجعة (Review) */}
                        {financialCycle.status === 'review' && (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={() => updateCycleStatus('draft')}
                                title="إعادة الكشف لوضع المسودة للتعديل"
                              >
                                  تراجع للمسودة
                              </Button>

                              <Button 
                                className="gap-2 bg-green-600 hover:bg-green-700 shadow-sm" 
                                onClick={() => updateCycleStatus('approved')}
                              >
                                  <ShieldCheck className="w-4 h-4" />
                                  اعتماد وإغلاق الكشف
                              </Button>
                            </>
                        )}
                        
                        {/* 4. أزرار المرحلة النهائية: معتمد/مدفوع (Approved/Paid) */}
                        {(financialCycle.status === 'approved' || financialCycle.status === 'paid') && (
                            <div className="flex gap-2">
                              {/* زر طباعة الكشف المالي الرسمي */}
                              <Button 
                                variant="secondary" 
                                className="gap-2 border border-gray-200" 
                                onClick={() => {
                                    // ✅ التحويل الصحيح لبيانات الكشف المالي لتناسب المودال
                                    const reportData = financialCycle.payouts.map((p: any) => ({
                                        id: p.lecturer_id,
                                        name: p.lecturer?.user?.full_name || "غير معروف",
                                        academic_rank: p.lecturer?.academicTitle?.title_name || "محاضر", 
                                        department: p.lecturer?.department?.department_name || "-",
                                        total_hours: Number(p.total_hours),
                                        hourly_price: Number(p.hourly_rate),
                                        
                                        // ✅ البيانات التفصيلية الجديدة
                                        base_amount: Number(p.base_amount),
                                        total_bonuses: Number(p.total_bonuses),
                                        total_deductions: Number(p.total_deductions),
                                        tax_amount: Number(p.tax_amount),
                                        
                                        total_amount: Number(p.net_amount), // الصافي النهائي
                                        approved: 0, delivered: 0
                                    }));
                                    
                                    // تعيين البيانات وفتح المودال
                                    setReportData(reportData);
                                    setIsInstructorReportOpen(true); 
                                }}
                              > 
                                  <Printer className="w-4 h-4" />
                                  <span className="hidden sm:inline">طباعة الكشف</span>
                              </Button>
                              
                              {financialCycle.status === 'approved' && (
                                <Button 
                                  className="gap-2 bg-blue-600 hover:bg-blue-700" 
                                  onClick={() => updateCycleStatus('paid')}
                                >
                                    <DollarSign className="w-4 h-4" />
                                    صرف
                                </Button>
                              )}
                            </div>
                        )}
                      </>
                  ) : (
                      /* زر الإنشاء الجديد */
                      <Button 
                        onClick={handleGenerateCycle} 
                        disabled={isGeneratingCycle || selectedMonth === 'all'}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isGeneratingCycle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        إنشاء كشف استحقاق جديد
                      </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* 2. الجدول المالي المطور */}
          {financialCycle && (
            <Card className="shadow-md border-t-4 border-t-primary/60">
              <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px] text-center">#</TableHead>
                        <TableHead>المحاضر</TableHead>
                        <TableHead className="text-center">الساعات</TableHead>
                        <TableHead className="text-center text-xs">السعر</TableHead>
                        <TableHead className="text-center font-bold text-blue-700 bg-blue-50/30">الإجمالي المستحق</TableHead>
                        
                        {/* الأعمدة التفصيلية */}
                        <TableHead className="text-center text-green-600 text-xs">مكافآت (+)</TableHead>
                        <TableHead className="text-center text-red-600 text-xs">خصومات (-)</TableHead>
                        <TableHead className="text-center text-orange-600 text-xs">ضرائب (-)</TableHead>
                        
                        <TableHead className="text-center font-bold bg-green-50 text-green-800 text-lg border-r">الصافي للدفع</TableHead>
                        
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center w-[50px]"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {financialCycle.payouts?.map((payout: any, idx: number) => (
                        <TableRow key={payout.payout_id} className="group hover:bg-muted/5">
                        <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                            <span className="font-medium text-sm">{payout.lecturer?.user?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">{payout.lecturer?.department?.department_name}</span>
                            </div>
                        </TableCell>
                        
                        <TableCell className="text-center font-mono font-bold text-sm">{payout.total_hours}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{Number(payout.hourly_rate).toLocaleString()}</TableCell>
                        <TableCell className="text-center font-mono text-blue-700 font-bold bg-blue-50/10">
                            {Number(payout.base_amount).toLocaleString()}
                        </TableCell>
                        
                        {/* المكافآت */}
                        <TableCell className="text-center font-mono text-green-600 text-sm">
                            {Number(payout.total_bonuses) > 0 ? `+${Number(payout.total_bonuses).toLocaleString()}` : '-'}
                        </TableCell>

                        {/* الخصومات */}
                        <TableCell className="text-center font-mono text-red-600 text-sm">
                            {Number(payout.total_deductions) > 0 ? `-${Number(payout.total_deductions).toLocaleString()}` : '-'}
                        </TableCell>
                        
                        {/* الضرائب */}
                        <TableCell className="text-center font-mono text-orange-600 text-sm">
                            {Number(payout.tax_amount) > 0 ? `-${Number(payout.tax_amount).toLocaleString()}` : '-'}
                        </TableCell>
                        
                        <TableCell className="text-center font-mono font-bold bg-green-50/50 text-lg border-r border-green-100">
                            {Number(payout.net_amount).toLocaleString()}
                        </TableCell>
                        
                        <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] px-1.5 h-5">{payout.status}</Badge>
                        </TableCell>
                        
                          <TableCell className="text-center">
                            {/* يظهر زر التعديل فقط عندما تكون الحالة "قيد المراجعة" */}
                            {financialCycle.status === 'review' && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                  title="إضافة تسوية (خصم/مكافأة)"
                                  onClick={() => {
                                    setSelectedPayoutId(payout.payout_id);
                                    setAdjustmentModalOpen(true);
                                    setAdjustmentData({ type: 'deduction', amount: '', reason: '' });
                                    setIsPercentage(false);
                                    setPercentageValue('');
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </CardContent>
              
              {/* ✅ Totals Footer المحدث والشامل */}
              <div className="bg-slate-50 border-t p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  
                  <div className="text-center border-l">
                      <span className="block text-muted-foreground text-[10px] mb-1">إجمالي الساعات</span>
                      <span className="font-bold font-mono text-base">
                          {financialCycle.payouts?.reduce((sum: any, p: any) => sum + Number(p.total_hours), 0)}
                      </span>
                  </div>
                  <div className="text-center border-l">
                      <span className="block text-muted-foreground text-[10px] mb-1">إجمالي المكافآت</span>
                      <span className="font-bold font-mono text-green-600">
                          +{financialCycle.payouts?.reduce((sum: any, p: any) => sum + Number(p.total_bonuses), 0).toLocaleString()}
                      </span>
                  </div>
                  <div className="text-center border-l">
                      <span className="block text-muted-foreground text-[10px] mb-1">إجمالي الخصومات</span>
                      <span className="font-bold font-mono text-red-600">
                          -{financialCycle.payouts?.reduce((sum: any, p: any) => sum + Number(p.total_deductions), 0).toLocaleString()}
                      </span>
                  </div>
                  <div className="text-center border-l">
                      <span className="block text-muted-foreground text-[10px] mb-1">إجمالي الضرائب</span>
                      <span className="font-bold font-mono text-orange-600">
                          -{financialCycle.payouts?.reduce((sum: any, p: any) => sum + Number(p.tax_amount), 0).toLocaleString()}
                      </span>
                  </div>
                  <div className="text-center bg-green-100/50 -my-4 py-4 flex flex-col justify-center rounded-r-md">
                      <span className="block text-green-800 text-xs font-bold mb-1">صافي الصرف النهائي</span>
                      <span className="font-bold font-mono text-xl text-green-700">
                          {Number(financialCycle.total_payout).toLocaleString()} <span className="text-xs">ر.ي</span>
                      </span>
                  </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================== */}
        {/* Instructor Attendance Tab */}
        <TabsContent value="instructor" className="space-y-6">
          <Card className="backdrop-blur-sm border-t-4 border-t-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    أداء أعضاء هيئة التدريس
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    تقرير الأداء والالتزام للعام {selectedAcademicYear === 'all' ? 'الشامل' : selectedAcademicYear}
                  </p>
                </div>
                
                {/* أدوات التحكم المحسنة */}
                <div className="flex gap-2 items-center flex-wrap">
                  
                  {/* 4. البحث النصي */}
                  <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="بحث بالاسم..." 
                      className="w-48 h-9 pr-9 bg-background" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* 5. زر التصدير */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openFullReport}
                    disabled={isExporting || instructorAttendance.length === 0} // تعطيل إذا لا توجد بيانات
                    className="h-9"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">تصدير</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px]">المحاضر</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead className="text-center">ساعات العمل</TableHead>
                    <TableHead className="text-center">المعتمدة</TableHead>
                    <TableHead className="text-center">المنفذة</TableHead>
                    <TableHead className="text-center">الغياب</TableHead>
                    <TableHead className="w-[180px]">مؤشر الالتزام</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorAttendance
                    .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) // فلترة محلية بالاسم فقط، القسم يتم عبر الـ API
                    .map(instructor => (
                    <TableRow key={instructor.id} className="hover:bg-muted/5 group">
                      
                      {/* الاسم والرتبة */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-base">{instructor.name}</span>
                          <span className="text-xs text-muted-foreground bg-primary/5 w-fit px-1.5 rounded mt-0.5">
                            {instructor.academic_rank || 'محاضر'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-muted-foreground text-sm">{instructor.department}</TableCell>
                      
                      {/* إجمالي الساعات */}
                      <TableCell className="text-center font-mono font-medium">
                        {instructor.total_hours} <span className="text-xs text-muted-foreground">ساعة</span>
                      </TableCell>
                      
                      <TableCell className="text-center text-muted-foreground">{instructor.approved}</TableCell>
                      
                      <TableCell className="text-center font-bold">{instructor.delivered}</TableCell>
                      
                      <TableCell className="text-center">
                        {instructor.absences > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5">
                            {instructor.absences}
                          </Badge>
                        )}
                      </TableCell>
                      
                      {/* مؤشر الأداء (Progress Bar) */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">نسبة التنفيذ</span>
                            <span className={
                              instructor.compliance_rate >= 90 ? "text-green-600" :
                              instructor.compliance_rate >= 75 ? "text-yellow-600" : "text-red-600"
                            }>
                              {instructor.compliance_rate}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                instructor.compliance_rate >= 90 ? 'bg-green-500' : 
                                instructor.compliance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${instructor.compliance_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-left">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs"
                              onClick={() => openSingleInstructorReport(instructor)} // ✅ هنا التعديل
                          >
                              التفاصيل المالية
                          </Button>
                          <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs"
                              onClick={() => setSelectedLecturerId(instructor.id)}
                          >
                              التفاصيل
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {instructorAttendance.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            لا توجد بيانات محاضرين للعرض.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <LecturerDetailsDialog 
          isOpen={!!selectedLecturerId} 
          onClose={() => setSelectedLecturerId(null)} 
          lecturerId={selectedLecturerId}
          collegeId={collegeId}
        />

          {isInstructorReportOpen && (
            <InstructorsReportDialog
              isOpen={isInstructorReportOpen}
              onClose={() => setIsInstructorReportOpen(false)}
              instructors={reportData} // ✅ نمرر البيانات المجهزة (فردي أو جماعي)
              academicYear={selectedAcademicYear}
              selectedMonth={getSelectedMonthName()}
              departmentName={getFilterLabel('dept', selectedDepartment)}
              mode={activeTab === 'financial' ? 'financial' : 'performance'} 
              collegeId={collegeId}
            />
        )}

        {/* Student Attendance */}
        <TabsContent value="student" className="space-y-6">
          
          {/* ✅ Drill-in Path (Dynamic) */}
          <Card className="backdrop-blur-sm bg-muted/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="text-muted-foreground font-medium ml-2">المسار الحالي:</span>
                
                <Badge variant="secondary" className="px-3 py-1">
                  {getFilterLabel('year', selectedAcademicYear)}
                </Badge>
                <span className="text-muted-foreground">/</span>

                <Badge variant="outline" className={selectedDepartment !== 'all' ? "bg-primary/10 border-primary/20 text-primary" : ""}>
                  {getFilterLabel('dept', selectedDepartment)}
                </Badge>
                <span className="text-muted-foreground">/</span>
                
                <Badge variant="outline" className={selectedProgram !== 'all' ? "bg-primary/10 border-primary/20 text-primary" : ""}>
                  {getFilterLabel('prog', selectedProgram)}
                </Badge>
                <span className="text-muted-foreground">/</span>
                
                <Badge variant="outline" className={selectedLevel !== 'all' ? "bg-primary/10 border-primary/20 text-primary" : ""}>
                  {getFilterLabel('lvl', selectedLevel)}
                </Badge>
                <span className="text-muted-foreground">/</span>
                
                <Badge variant="outline" className={selectedSemester !== 'all' ? "bg-primary/10 border-primary/20 text-primary" : ""}>
                  {getFilterLabel('sem', selectedSemester)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Course List */}
          <Card className="backdrop-blur-sm border-t-4 border-t-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  المقررات الدراسية
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {courseAttendance.length} مقرر
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {courseAttendance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                  <BookOpen className="w-12 h-12 opacity-20" />
                  <p>لا توجد مقررات مطابقة للفلاتر المحددة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseAttendance.map((course: any) => (
                    <Card 
                      key={course.course_id || course.course_code}
                      // ✅ إضافة التفاعل عند النقر لعرض المجموعات (المتطلب السابق)
                      onClick={() => setSelectedCourseIdForGroups(
                        selectedCourseIdForGroups === course.course_id ? null : course.course_id
                      )}
                      // ✅ تغيير الستايل عند الاختيار لتمييز المقرر النشط
                      className={`border transition-all duration-200 cursor-pointer group overflow-hidden ${
                        selectedCourseIdForGroups === course.course_id 
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                          : 'hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                       <CardContent className="p-5 space-y-4">
                        
                        {/* Header: الاسم والكود واسم القسم */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 w-full">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2" title={course.course_name}>
                              {course.course_name || course.course}
                            </h3>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* كود المقرر */}
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground px-1.5 py-0 h-5 bg-background">
                                {course.course_code}
                              </Badge>
                              
                              {/* ✅ تم التعديل: عرض اسم القسم بدلاً من عدد الطلاب */}
                              <span className="text-xs text-muted-foreground truncate max-w-[150px] bg-muted/50 px-2 py-0.5 rounded-sm" title={course.department_name}>
                                {course.department_name}
                              </span>
                            </div>
                          </div>
                        </div>
  
                        {/* ✅ تم التعديل: شبكة المعلومات (البرنامج | المستوى | الفصل) */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-center bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          
                          {/* البرنامج */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium">البرنامج</span>
                            <span className="font-semibold text-foreground truncate" title={course.program_name}>
                              {course.program_name || "-"}
                            </span>
                          </div>

                          {/* الخط الفاصل والمستوى */}
                          <div className="flex flex-col gap-1 border-x border-border/60 px-1">
                            <span className="text-[10px] text-muted-foreground font-medium">المستوى</span>
                            <span className="font-semibold text-foreground">
                              {course.level_name || "-"}
                            </span>
                          </div>

                          {/* الترم */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium">الفصل</span>
                            <span className="font-semibold text-foreground">
                              {course.semester_name || "-"}
                            </span>
                          </div>
                        </div>
  
                        {/* ✅ تم التعديل: تصميم الملاحظات (وصفي وليس تحذيري) */}
                        {course.notes && (
                          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-md border border-primary/10 flex gap-2 mt-2 items-start">
                            <div className="shrink-0 mt-0.5">
                              <FileText className="w-3.5 h-3.5 text-primary/60" />
                            </div>
                            <span className="line-clamp-2 leading-relaxed">
                              {course.notes}
                            </span>
                          </div>
                        )}
  
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Course Groups Details */}
          {selectedCourseIdForGroups && (
            <Card className="backdrop-blur-sm border-t-4 border-t-secondary animate-in slide-in-from-top-4 duration-300 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-secondary" />
                  المجموعات الدراسية المرتبطة بالمقرر
                  {isLoadingGroups && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courseGroups.length === 0 && !isLoadingGroups ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <p>لا توجد مجموعات مرتبطة بهذا المقرر {selectedAcademicYear !== 'all' ? `للعام ${selectedAcademicYear}` : ''}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseGroups.map((group: any) => (
                      <div 
                        key={group.group_id} 
                        className="p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50"
                        // ✅ تفعيل النقر لفتح المودال
                        onClick={() => setSelectedGroupDetails({ id: group.group_id, name: group.group_name })}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-base">{group.group_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{group.students_count} طالب</span>
                                <span>•</span>
                                <span>{group.sessions_count} محاضرة منفذة</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* زر الإجراء (شكلي فقط، النقر يتم على الكارد بالكامل) */}
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                            عرض الكشف
                          </Button>
                        </div>

                        {/* شريط نسبة الحضور */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">نسبة الحضور العامة</span>
                            <span className={group.attendance_percentage >= 85 ? "text-green-600" : "text-orange-600"}>
                              {group.attendance_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary/20 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                group.attendance_percentage >= 85 ? 'bg-green-500' : 
                                group.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${group.attendance_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ✅ استدعاء المودال في نهاية الـ JSX */}
          {selectedGroupDetails && (
            <GroupAttendanceDialog
              isOpen={!!selectedGroupDetails}
              onClose={() => setSelectedGroupDetails(null)}
              groupId={selectedGroupDetails.id}
              groupName={selectedGroupDetails.name}
              courseId={selectedCourseIdForGroups!}
              // البحث عن اسم الكورس بأمان
              courseName={
                // @ts-ignore (لتجنب خطأ النوع مؤقتاً إذا لم يكن معرفاً بدقة)
                courseAttendance.find((c: any) => c.course_id === selectedCourseIdForGroups)?.course_name || "مقرر"
              }
              collegeId={collegeId}
              academicYear={selectedAcademicYear}
            />
          )}
        </TabsContent>

        {/* ======================================================= */}
        {/* 4. Grades Reports Tab (نتائج أعمال الفصل)              */}
        {/* ======================================================= */}
        <TabsContent value="grades" className="space-y-6">
          <Card className="backdrop-blur-sm border-t-4 border-t-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  سجلات درجات أعمال الفصل
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                استعراض وطباعة كشوف درجات أعمال الفصل للمقررات والمجموعات الدراسية.
              </p>
            </CardHeader>
            
            <CardContent>
              {/* إعادة استخدام قائمة المواد الموجودة (courseAttendance) */}
              {courseAttendance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                  <BookOpen className="w-12 h-12 opacity-20" />
                  <p>لا توجد مقررات للعرض.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseAttendance.map((course: any) => (
                    <Card 
                      key={course.course_id}
                      onClick={() => setSelectedCourseIdForGroups(
                        selectedCourseIdForGroups === course.course_id ? null : course.course_id
                      )}
                      className={`border transition-all duration-200 cursor-pointer group overflow-hidden ${
                        selectedCourseIdForGroups === course.course_id 
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                          : 'hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                       <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 w-full">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                              {course.course_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                                {course.course_code}
                              </Badge>
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm">
                                {course.department_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
        
              {/* عرض المجموعات للمقرر المختار */}
              {selectedCourseIdForGroups && (
                <div className="mt-8 animate-in slide-in-from-top-4 duration-300 border-t pt-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                    <Users className="w-5 h-5" />
                    اختر المجموعة لعرض التقرير
                    {isLoadingGroups && <Loader2 className="w-4 h-4 animate-spin" />}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseGroups.map((group: any) => (
                      <div 
                        key={group.group_id} 
                        className="p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/50 flex justify-between items-center"
                        onClick={() => {
                          // const yearToUse = group.academic_year || (selectedAcademicYear === 'all' ? new Date().getFullYear() + '-' + (new Date().getFullYear()+1) : selectedAcademicYear);
                           // ✅ فتح المودال عند الضغط
                           setSelectedGradeReportGroup({
                               groupId: group.group_id,
                               courseId: selectedCourseIdForGroups!,
                               groupYear: group.academic_year || selectedAcademicYear
                           });
                        }}
                      >
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{group.group_name}</p>
                              <p className="text-xs text-muted-foreground">{group.students_count} طالب</p>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                           عرض الكشف <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                        </Button>
                      </div>
                    ))}
                    {courseGroups.length === 0 && !isLoadingGroups && (
                        <p className="text-muted-foreground col-span-2 text-center py-4">لا توجد مجموعات مرتبطة.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        
          {/* ✅ استدعاء المودال الجديد */}
          {selectedGradeReportGroup && (
              <AdminGradesReportDialog 
                isOpen={!!selectedGradeReportGroup}
                onClose={() => setSelectedGradeReportGroup(null)}
                collegeId={collegeId}
                courseId={selectedGradeReportGroup.courseId}
                groupId={selectedGradeReportGroup.groupId}
                academicYear={
                  selectedAcademicYear !== 'all' 
                    ? selectedAcademicYear 
                    : selectedGradeReportGroup.groupYear
                } 
              />
          )}
        </TabsContent>

        {/* ======================================================= */}
        {/* 5. Quality Assurance Tab (ضمان الجودة)              */}
        {/* ======================================================= */}
        <TabsContent value="qa" className="space-y-6">
          <Card className="border-t-4 border-t-primary/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      مؤشرات أداء العملية التعليمية
                  </CardTitle>
                  <Badge variant="outline">العام: {selectedAcademicYear === 'all' ? 'شامل' : selectedAcademicYear}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {qaData.length === 0 && !loading ? (
                   <div className="text-center py-10 text-muted-foreground">لا توجد بيانات متاحة للعرض.</div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow className="bg-muted/50 border-b-2 border-primary/10">
                              {/* المحاضر */}
                              <TableHead className="w-[20%] text-right font-bold text-primary">المحاضر</TableHead>
                              
                              {/* المقرر الدراسي (موسع ومحسّن) */}
                              <TableHead className="w-[25%] text-right font-bold text-primary">المقرر الدراسي والمجموعة</TableHead>
                              
                              {/* إنجاز الجلسات (بدلاً من topics مؤقتاً لتصحيح المحاذاة) */}
                              <TableHead className="w-[15%] text-center font-bold text-primary">إنجاز الجلسات</TableHead>
                              
                              {/* إنجاز المقرر (المواضيع) */}
                              <TableHead className="w-[15%] text-center font-bold text-primary">تغطية المواضيع</TableHead>
                              
                              {/* فهم الطلاب (العمود الجديد) */}
                              <TableHead className="w-[15%] text-center font-bold text-primary">مستوى الفهم</TableHead>
                              
                              {/* التفاصيل */}
                              <TableHead className="w-[10%] text-center font-bold text-primary">إجراءات</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {qaData.map((row: any) => (
                              <TableRow key={row.timetable_id} className="hover:bg-muted/5 group transition-colors">
                                  
                                  {/* 1. المحاضر */}
                                  <TableCell className="align-middle">
                                      <div className="flex flex-col gap-1">
                                          <span className="font-bold text-sm text-foreground">{row.lecturer_name}</span>
                                          <span className="text-[11px] text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded">
                                              {row.department_name}
                                          </span>
                                      </div>
                                  </TableCell>
                  
                                  {/* 2. المقرر والمجموعة (تحسين التصميم) */}
                                  <TableCell className="align-middle">
                                      <div className="flex flex-col gap-1.5">
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-sm text-foreground">{row.course_name}</span>
                                              <Badge variant="outline" className="text-[10px] h-5 font-mono px-1">
                                                  {row.course_code}
                                              </Badge>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                              <Users className="w-3 h-3 text-muted-foreground" />
                                              <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                  {row.group_name}
                                              </span>
                                          </div>
                                      </div>
                                  </TableCell>
                                  
                                  {/* 3. إنجاز الجلسات (Sessions) */}
                                  <TableCell className="text-center align-middle">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                          <span className="font-bold font-mono text-sm">
                                              {row.sessions_executed} <span className="text-muted-foreground font-sans text-[10px]">/ {row.sessions_total}</span>
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">جلسة منفذة</span>
                                      </div>
                                  </TableCell>
                  
                                  {/* 4. تغطية المواضيع (Topics Coverage) */}
                                  <TableCell className="align-middle">
                                      <div className="w-full max-w-[120px] mx-auto space-y-1.5">
                                          <div className="flex justify-between items-center text-xs">
                                              <span className="font-bold text-foreground">{row.coverage_percent}%</span>
                                              <span className="text-[10px] text-muted-foreground">
                                                  ({row.topics_covered}/{row.topics_total})
                                              </span>
                                          </div>
                                          <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden shadow-inner">
                                              <div 
                                                  className={`h-full rounded-full transition-all duration-500 ${
                                                      row.coverage_percent >= 80 ? 'bg-green-500' : 
                                                      row.coverage_percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                  }`}
                                                  style={{width: `${row.coverage_percent}%`}}
                                              />
                                          </div>
                                      </div>
                                  </TableCell>
                  
                                  {/* 5. مستوى الفهم (Understanding) - المنطق الجديد */}
                                  <TableCell className="align-middle">
                                      {row.qa_sessions_count > 0 ? (
                                          <div className="w-full max-w-[120px] mx-auto space-y-1.5">
                                              <div className="flex justify-between items-center text-xs">
                                                  <span className={`font-bold ${
                                                      row.understanding_percent >= 75 ? 'text-green-600' : 
                                                      row.understanding_percent >= 50 ? 'text-blue-600' : 'text-red-500'
                                                  }`}>
                                                      {row.understanding_percent}%
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground" title="عدد الجلسات التي شملت تقييماً">
                                                      {row.qa_sessions_count} تقييم
                                                  </span>
                                              </div>
                                              <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden shadow-inner">
                                                  <div 
                                                      className={`h-full rounded-full transition-all duration-500 ${
                                                          row.understanding_percent >= 75 ? 'bg-green-500' : 
                                                          row.understanding_percent >= 50 ? 'bg-blue-500' : 'bg-red-500'
                                                      }`}
                                                      style={{width: `${row.understanding_percent}%`}}
                                                  />
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="text-center">
                                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                  لا يوجد تقييم
                                              </span>
                                          </div>
                                      )}
                                  </TableCell>
                  
                                  {/* 6. التفاصيل */}
                                  <TableCell className="text-center align-middle">
                                      <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-primary hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 rounded-full"
                                          title="عرض التقرير التفصيلي"
                                          onClick={() => setSelectedQATimetableId(row.timetable_id)}
                                      >
                                          <FileText className="w-4 h-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              )}
            </CardContent>
          </Card>
        
          {/* QA Dialog */}
          {selectedQATimetableId && (
              <QAReportDialog 
                  isOpen={!!selectedQATimetableId}
                  onClose={() => setSelectedQATimetableId(null)}
                  collegeId={collegeId}
                  timetableId={selectedQATimetableId}
              />
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* Adjustment Modal: مودال إضافة التسويات (خصم/مكافأة/ضريبة) */}
      {/* ============================================================ */}
      <Dialog open={adjustmentModalOpen} onOpenChange={setAdjustmentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة تسوية مالية</DialogTitle>
            {/* ✅ تمت إضافة الوصف لحل مشكلة التحذير */}
            <DialogDescription>
              يمكنك إضافة خصم أو مكافأة أو ضريبة لهذا الاستحقاق المالي.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            
            {/* 1. نوع التسوية */}
            <div className="space-y-2">
              <Label>نوع التسوية</Label>
              <Select 
                value={adjustmentData.type} 
                onValueChange={(val) => {
                    setAdjustmentData({...adjustmentData, type: val});
                    // إذا اختار ضريبة، نفعل النسبة تلقائياً
                    if (val === 'tax') {
                        setIsPercentage(true);
                        setPercentageValue('');
                    }
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deduction" className="text-red-600 font-medium">خصم / جزاء</SelectItem>
                  <SelectItem value="bonus" className="text-green-600 font-medium">مكافأة / إضافة</SelectItem>
                  <SelectItem value="tax" className="text-orange-600 font-medium">ضريبة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. خيار النسبة المئوية */}
            <div className="flex items-center gap-2 mb-2 bg-muted/30 p-2 rounded-md border border-dashed">
                <Switch 
                    id="percent-mode" 
                    checked={isPercentage} 
                    onCheckedChange={(checked) => {
                        setIsPercentage(checked);
                        // تصفير القيم عند التبديل لمنع الخطأ
                        setPercentageValue('');
                        if (!checked) setAdjustmentData(prev => ({...prev, amount: ''}));
                    }}
                />
                <Label htmlFor="percent-mode" className="cursor-pointer text-sm font-normal">
                    حساب القيمة كنسبة مئوية (%) من الراتب الأساسي
                </Label>
            </div>

            {/* 3. حقل الإدخال (ديناميكي) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">
                {isPercentage ? 'النسبة المئوية (%)' : 'المبلغ (ر.ي)'}
              </Label>
              
              {isPercentage ? (
                  <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            placeholder="مثلاً: 5" 
                            value={percentageValue}
                            onChange={(e) => calculateAmountFromPercentage(e.target.value)}
                            className="pr-8" // مساحة لعلامة %
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground font-bold">%</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-2 rounded-md border border-primary/20 min-w-[100px] text-center">
                          = {Number(adjustmentData.amount).toLocaleString()} 
                      </div>
                  </div>
              ) : (
                  <div className="relative">
                    <Input 
                        type="number" 
                        min="0"
                        placeholder="مثلاً: 5000"
                        value={adjustmentData.amount}
                        onChange={(e) => setAdjustmentData({...adjustmentData, amount: e.target.value})}
                    />
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">ر.ي</span>
                  </div>
              )}
            </div>

            {/* 4. السبب */}
            <div className="space-y-2">
              <Label>السبب / الملاحظات</Label>
              <Input 
                placeholder={adjustmentData.type === 'tax' ? 'مثلاً: ضريبة دخل' : 'مثلاً: غياب إداري يوم...'}
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
              />
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setAdjustmentModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddAdjustment} disabled={!adjustmentData.amount || Number(adjustmentData.amount) <= 0}>
                حفظ التسوية
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}