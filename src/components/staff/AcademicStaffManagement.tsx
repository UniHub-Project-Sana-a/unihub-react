import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Send,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Building,
  GraduationCap,
  Users,
  BarChart3,
  Edit,
  Eye,
  AlertTriangle,
  Bell,
  Info,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Settings,
  ChevronRight,
  BookOpen,
  Calendar as CalendarIcon,
  Target,
  TrendingDown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// بيانات تجريبية للعرض
const staffMembers = [
  {
    id: "STAFF-001",
    name: "Dr. Ahmed Hassan",
    rank: "Professor",
    department: "Computer Science",
    hourlyRate: 150,
    multiUniversity: true,
    totalLectures: 48,
    attendedLectures: 42,
    missedLectures: 6,
    grossPay: 6300,
    taxDeduction: 945,
    bonuses: 500,
    netPay: 5855,
    email: "ahmed.hassan@unihub.edu",
    phone: "+20 12 345 6789",
    address: "123 University Street, Cairo",
    joinDate: "2020-09-01",
    employmentStatus: "Full-time",
    contractType: "Permanent",
    officeNumber: "CS-301",
    requiredLectures: 48,
    performance: 92,
    hasAlerts: true
  },
  {
    id: "STAFF-002",
    name: "Dr. Sarah Wilson",
    rank: "Associate Professor",
    department: "Mathematics",
    hourlyRate: 120,
    multiUniversity: false,
    totalLectures: 36,
    attendedLectures: 35,
    missedLectures: 1,
    grossPay: 4320,
    taxDeduction: 648,
    bonuses: 200,
    netPay: 3872,
    email: "sarah.wilson@unihub.edu",
    phone: "+20 12 567 8901",
    address: "456 Academic Ave, Giza",
    joinDate: "2021-02-15",
    employmentStatus: "Full-time",
    contractType: "Permanent",
    officeNumber: "MATH-205",
    requiredLectures: 36,
    performance: 97,
    hasAlerts: false
  },
  {
    id: "STAFF-003",
    name: "Prof. Mohamed Ali",
    rank: "Lecturer",
    department: "Physics",
    hourlyRate: 100,
    multiUniversity: true,
    totalLectures: 40,
    attendedLectures: 38,
    missedLectures: 2,
    grossPay: 4000,
    taxDeduction: 600,
    bonuses: 150,
    netPay: 3550,
    email: "mohamed.ali@unihub.edu",
    phone: "+20 12 789 0123",
    address: "789 Science Blvd, Alexandria",
    joinDate: "2019-08-20",
    employmentStatus: "Part-time",
    contractType: "Contract",
    officeNumber: "PHY-102",
    requiredLectures: 40,
    performance: 95,
    hasAlerts: true
  },
  {
    id: "STAFF-004",
    name: "Dr. Fatima Al-Zahra",
    rank: "Assistant Professor",
    department: "Chemistry",
    hourlyRate: 110,
    multiUniversity: false,
    totalLectures: 32,
    attendedLectures: 31,
    missedLectures: 1,
    grossPay: 3520,
    taxDeduction: 528,
    bonuses: 100,
    netPay: 3092,
    email: "fatima.alzahra@unihub.edu",
    phone: "+20 12 456 7890",
    address: "321 Research Park, Cairo",
    joinDate: "2022-01-10",
    employmentStatus: "Full-time",
    contractType: "Permanent",
    officeNumber: "CHEM-401",
    requiredLectures: 32,
    performance: 96,
    hasAlerts: false
  },
  {
    id: "STAFF-005",
    name: "Prof. John Smith",
    rank: "Professor",
    department: "Engineering",
    hourlyRate: 160,
    multiUniversity: true,
    totalLectures: 44,
    attendedLectures: 40,
    missedLectures: 4,
    grossPay: 7040,
    taxDeduction: 1056,
    bonuses: 300,
    netPay: 6284,
    email: "john.smith@unihub.edu",
    phone: "+20 12 234 5678",
    address: "654 Innovation Hub, New Cairo",
    joinDate: "2018-03-12",
    employmentStatus: "Full-time",
    contractType: "Permanent",
    officeNumber: "ENG-501",
    requiredLectures: 44,
    performance: 90,
    hasAlerts: true
  }
];

// بيانات التنبيهات والإشعارات
const alertsData = [
  {
    id: "ALERT-001",
    staffId: "STAFF-001",
    type: "bonus",
    title: "Bonus Eligibility",
    message: "Dr. Ahmed Hassan is eligible for excellence bonus based on student feedback",
    priority: "info",
    date: "2024-01-15",
    isRead: false
  },
  {
    id: "ALERT-002",
    staffId: "STAFF-003",
    type: "policy",
    title: "Policy Reminder",
    message: "Multi-university teaching requires approval for schedule changes",
    priority: "warning",
    date: "2024-01-14",
    isRead: false
  },
  {
    id: "ALERT-003",
    staffId: "STAFF-005",
    type: "attendance",
    title: "Attendance Warning",
    message: "Prof. John Smith has exceeded the absence threshold this month",
    priority: "high",
    date: "2024-01-13",
    isRead: true
  }
];

// بيانات الأداء للرسوم
const performanceData = [
  { month: "Sep", attendance: 95, performance: 88 },
  { month: "Oct", attendance: 92, performance: 91 },
  { month: "Nov", attendance: 89, performance: 85 },
  { month: "Dec", attendance: 94, performance: 89 },
  { month: "Jan", attendance: 96, performance: 93 }
];

// بيانات التوزيع حسب الأقسام
const departmentData = [
  { name: "Computer Science", value: 35, color: "#0ea5e9" },
  { name: "Mathematics", value: 25, color: "#8b5cf6" },
  { name: "Physics", value: 20, color: "#10b981" },
  { name: "Chemistry", value: 12, color: "#f59e0b" },
  { name: "Engineering", value: 8, color: "#ef4444" }
];

const attendanceData = [
  { month: "Sep", attended: 8, missed: 1 },
  { month: "Oct", attended: 12, missed: 0 },
  { month: "Nov", attended: 10, missed: 2 },
  { month: "Dec", attended: 9, missed: 1 },
  { month: "Jan", attended: 11, missed: 1 }
];

const compensatoryLectures = [
  {
    id: "COMP-001",
    date: "2024-01-20",
    time: "14:00-15:30",
    course: "Advanced Algorithms",
    reason: "Missed due to conference",
    status: "Approved"
  },
  {
    id: "COMP-002",
    date: "2024-01-25",
    time: "10:00-11:30",
    course: "Database Systems",
    reason: "Medical leave",
    status: "Pending"
  }
];

const lectureDetails = [
  {
    date: "2024-01-15",
    course: "Data Structures",
    hours: 1.5,
    rate: 150,
    deduction: 22.5,
    bonus: 0,
    netAmount: 127.5,
    status: "attended"
  },
  {
    date: "2024-01-16",
    course: "Algorithms",
    hours: 1.5,
    rate: 150,
    deduction: 22.5,
    bonus: 25,
    netAmount: 152.5,
    status: "attended"
  },
  {
    date: "2024-01-17",
    course: "Programming",
    hours: 1.5,
    rate: 150,
    deduction: 22.5,
    bonus: 0,
    netAmount: 0,
    status: "missed"
  }
];

export function AcademicStaffManagement() {
  const [selectedStaff, setSelectedStaff] = useState<typeof staffMembers[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCompensatoryDialogOpen, setIsCompensatoryDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const filteredStaff = staffMembers.filter(staff => {
    return (
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterRank === "" || filterRank === "all" || staff.rank === filterRank) &&
      (filterDepartment === "" || filterDepartment === "all" || staff.department === filterDepartment) &&
      (filterStatus === "" || filterStatus === "all" || staff.employmentStatus === filterStatus)
    );
  });

  // ترقيم الصفحات
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case "Professor":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100";
      case "Associate Professor":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100";
      case "Assistant Professor":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-100";
      case "Lecturer":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Full-time":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100";
      case "Part-time":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getAttendancePercentage = (attended: number, total: number) => {
    return Math.round((attended / total) * 100);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600";
    if (percentage >= 85) return "text-blue-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const handleExportReport = (format: 'pdf' | 'excel', staffId?: string) => {
    toast({
      title: "تصدير التقرير",
      description: `يتم الآن إنشاء تقرير ${format.toUpperCase()}...`,
    });
    // هنا يمكن تنفيذ منطق التصدير الفعلي
  };

  const handleAddStaff = () => {
    toast({
      title: "تمت إضافة العضو",
      description: "تمت إضافة عضو هيئة أكاديمية بنجاح.",
    });
    setIsAddStaffDialogOpen(false);
  };

  const handleEditStaff = () => {
    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات عضو الهيئة بنجاح.",
    });
    setIsEditMode(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">إدارة أعضاء الهيئة الأكاديمية</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            إدارة شاملة لأعضاء الهيئة الأكاديمية، الأعباء التدريسية، والتعويضات المالية
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setIsAddStaffDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            إضافة عضو
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('excel')} className="w-full sm:w-auto">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            تصدير البيانات
          </Button>
        </div>
      </div>

      {/* قسم التنبيهات */}
      {alertsData.filter(alert => !alert.isRead).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Bell className="h-5 w-5" />
            تنبيهات نشطة ({alertsData.filter(alert => !alert.isRead).length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alertsData.filter(alert => !alert.isRead).slice(0, 3).map((alert) => (
              <Alert key={alert.id} className={cn(
                "border-l-4",
                alert.priority === "high" && "border-l-red-500 bg-red-50 dark:bg-red-950",
                alert.priority === "warning" && "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950",
                alert.priority === "info" && "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
              )}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* بطاقات نظرة عامة */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-blue-50/50 dark:to-blue-950/20 border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">إجمالي الأعضاء</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{staffMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              أعضاء هيئة أكاديمية نشطون
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-green-50/50 dark:to-green-950/20 border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">محاضرات اليوم</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">24</div>
            <p className="text-xs text-muted-foreground">
              مجدولة لليوم
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-yellow-50/50 dark:to-yellow-950/20 border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">متوسط الأداء</CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {Math.round(staffMembers.reduce((acc, s) => acc + s.performance, 0) / staffMembers.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              درجة الأداء الإجمالية
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-purple-50/50 dark:to-purple-950/20 border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">مدفوعات معلّقة</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              ${staffMembers.reduce((acc, s) => acc + s.netPay, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              صافي الرواتب الشهري
            </p>
          </CardContent>
        </Card>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* دليل الأعضاء */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg">دليل الأعضاء</CardTitle>
                  <CardDescription>إدارة معلومات أعضاء الهيئة والتكليفات</CardDescription>
                </div>
                <Badge variant="secondary" className="والف">
                  {filteredStaff.length} من {staffMembers.length} عضو
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* المرشحات */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن الأعضاء..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={filterRank} onValueChange={setFilterRank}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الرتب الأكاديمية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الرتب</SelectItem>
                    <SelectItem value="Professor">أستاذ</SelectItem>
                    <SelectItem value="Associate Professor">أستاذ مشارك</SelectItem>
                    <SelectItem value="Assistant Professor">أستاذ مساعد</SelectItem>
                    <SelectItem value="Lecturer">محاضر</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأقسام</SelectItem>
                    <SelectItem value="Computer Science">علوم الحاسب</SelectItem>
                    <SelectItem value="Mathematics">الرياضيات</SelectItem>
                    <SelectItem value="Physics">الفيزياء</SelectItem>
                    <SelectItem value="Chemistry">الكيمياء</SelectItem>
                    <SelectItem value="Engineering">الهندسة</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="Full-time">دوام كامل</SelectItem>
                    <SelectItem value="Part-time">دوام جزئي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* جدول الأعضاء */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">الاسم</TableHead>
                      <TableHead className="hidden sm:table-cell">الرتبة الأكاديمية</TableHead>
                      <TableHead className="hidden md:table-cell">القسم</TableHead>
                      <TableHead className="hidden lg:table-cell">الأجر</TableHead>
                      <TableHead className="hidden xl:table-cell">الحالة</TableHead>
                      <TableHead>الأداء</TableHead>
                      <TableHead className="w-[100px]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStaff.map((staff) => (
                      <TableRow 
                        key={staff.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedStaff?.id === staff.id && "bg-muted"
                        )}
                        onClick={() => setSelectedStaff(staff)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <User className="h-8 w-8 p-1 bg-muted rounded-full" />
                              {staff.hasAlerts && (
                                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{staff.name}</div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {staff.rank} • {staff.department}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className={getRankBadgeColor(staff.rank)}>
                            {staff.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{staff.department}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm font-medium">${staff.hourlyRate}</span>
                          <span className="text-xs text-muted-foreground">/ساعة</span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant="outline" className={getStatusBadgeColor(staff.employmentStatus)}>
                            {staff.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium", getPerformanceColor(staff.performance))}>
                              {staff.performance}%
                            </span>
                            <Progress 
                              value={staff.performance} 
                              className="w-12 h-2" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ترقيم الصفحات */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.max(1, currentPage - 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.min(totalPages, currentPage + 1));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </div>

        {/* لوحة تفاصيل العضو */}
        <div className="space-y-4">
          {selectedStaff ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">نظرة عامة</TabsTrigger>
                <TabsTrigger value="financial" className="text-xs sm:text-sm">المالية</TabsTrigger>
                <TabsTrigger value="performance" className="text-xs sm:text-sm">الأداء</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* بطاقة الملف الشخصي */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <GraduationCap className="h-10 w-10 p-2 bg-primary/10 text-primary rounded-full" />
                          {selectedStaff.hasAlerts && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{selectedStaff.name}</CardTitle>
                          <CardDescription>
                            {selectedStaff.rank} • {selectedStaff.department}
                          </CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditMode(!isEditMode)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">البريد الإلكتروني:</span>
                        </div>
                        <span className="font-medium">{selectedStaff.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">الهاتف:</span>
                        </div>
                        <span className="font-medium">{selectedStaff.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">المكتب:</span>
                        </div>
                        <span className="font-medium">{selectedStaff.officeNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">تاريخ الانضمام:</span>
                        </div>
                        <span className="font-medium">{new Date(selectedStaff.joinDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">الأجر بالساعة:</span>
                        </div>
                        <span className="font-medium text-primary">${selectedStaff.hourlyRate}/ساعة</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-lg font-bold text-green-600">{selectedStaff.attendedLectures}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">حضور</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-lg font-bold text-red-600">{selectedStaff.missedLectures}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">غياب</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleExportReport('pdf', selectedStaff.id)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        تقرير
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleExportReport('excel', selectedStaff.id)}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        تصدير
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* بطاقة حالة التدريس */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      حالة التدريس
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">متعدد الجامعات:</span>
                        <Badge variant={selectedStaff.multiUniversity ? "default" : "outline"}>
                          {selectedStaff.multiUniversity ? "نعم" : "لا"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">المحاضرات المطلوبة:</span>
                        <span className="font-medium">{selectedStaff.requiredLectures}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">نسبة الإنجاز:</span>
                        <span className={cn("font-medium", getPerformanceColor(getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)))}>
                          {getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)}%
                        </span>
                      </div>
                      <Progress 
                        value={getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)} 
                        className="mt-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                {/* الملخص المالي */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      الملخص المالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <span className="text-sm font-medium">إجمالي الأجر</span>
                        <span className="text-lg font-bold text-blue-600">
                          ${selectedStaff.grossPay.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <span className="text-sm font-medium">الضريبة المقتطعة</span>
                        <span className="text-lg font-bold text-red-600">
                          -${selectedStaff.taxDeduction.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <span className="text-sm font-medium">المكافآت</span>
                        <span className="text-lg font-bold text-green-600">
                          +${selectedStaff.bonuses.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                        <span className="text-sm font-bold">صافي الأجر</span>
                        <span className="text-xl font-bold text-primary">
                          ${selectedStaff.netPay.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <h4 className="font-medium text-sm">التفصيل الشهري</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>الأجر الأساسي ({selectedStaff.attendedLectures} ساعة × ${selectedStaff.hourlyRate})</span>
                          <span>${(selectedStaff.attendedLectures * selectedStaff.hourlyRate).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>نسبة الضريبة</span>
                          <span>{Math.round((selectedStaff.taxDeduction / selectedStaff.grossPay) * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مكافأة الأداء</span>
                          <span>${selectedStaff.bonuses.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* خيارات التصدير */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">تصدير التقرير المالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportReport('pdf', selectedStaff.id)}
                      >
                        <FileText className="ه-4 w-4 mr-2" />
                        تقرير PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportReport('excel', selectedStaff.id)}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        تصدير Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 mt-4">
                {/* منحنى الأداء */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      اتجاهات الأداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attendance" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="نسبة الحضور"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="performance" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="نسبة الأداء"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* مؤشرات الأداء */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">مؤشرات الأداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الأداء الإجمالي:</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", getPerformanceColor(selectedStaff.performance))}>
                            {selectedStaff.performance}%
                          </span>
                          <Progress value={selectedStaff.performance} className="w-16 h-2" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">معدل الحضور:</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", getPerformanceColor(getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)))}>
                            {getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)}%
                          </span>
                          <Progress value={getAttendancePercentage(selectedStaff.attendedLectures, selectedStaff.totalLectures)} className="w-16 h-2" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الانضباط الزمني:</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", getPerformanceColor(96))}>96%</span>
                          <Progress value={96} className="w-16 h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* تنبيهات هذا العضو */}
                {alertsData.filter(alert => alert.staffId === selectedStaff.id).length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        تنبيهات نشطة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {alertsData.filter(alert => alert.staffId === selectedStaff.id).map((alert) => (
                          <Alert key={alert.id} className={cn(
                            "text-sm",
                            alert.priority === "high" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
                            alert.priority === "warning" && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
                            alert.priority === "info" && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                          )}>
                            <Info className="h-4 w-4" />
                            <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                            <AlertDescription className="text-xs">
                              {alert.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="flex items-center justify-center h-80">
                <div className="text-center space-y-3">
                  <User className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">اختر عضو هيئة</h3>
                    <p className="text-sm text-muted-foreground">
                      اختر عضوًا من الدليل لعرض معلوماته التفصيلية، التقارير المالية، ومؤشرات الأداء.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setIsAddStaffDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة عضو جديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* نافذة إضافة عضو */}
      <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عضو هيئة جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات عضو الهيئة الأكاديمية الجديد.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" placeholder="Dr. John Smith" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rank">الرتبة الأكاديمية</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الرتبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">أستاذ</SelectItem>
                  <SelectItem value="associate">أستاذ مشارك</SelectItem>
                  <SelectItem value="assistant">أستاذ مساعد</SelectItem>
                  <SelectItem value="lecturer">محاضر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">القسم</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">علوم الحاسب</SelectItem>
                  <SelectItem value="math">الرياضيات</SelectItem>
                  <SelectItem value="physics">الفيزياء</SelectItem>
                  <SelectItem value="chemistry">الكيمياء</SelectItem>
                  <SelectItem value="engineering">الهندسة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">الأجر بالساعة ($)</Label>
              <Input id="rate" type="number" placeholder="120" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddStaff}>
              إضافة العضو
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة محاضرة تعويضية */}
      <Dialog open={isCompensatoryDialogOpen} onOpenChange={setIsCompensatoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>جدولة محاضرة تعويضية</DialogTitle>
            <DialogDescription>
              جدولة محاضرة تعويضية للجلسات الفائتة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comp-date">التاريخ</Label>
              <Input id="comp-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-time">الوقت</Label>
              <Input id="comp-time" placeholder="14:00-15:30" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-course">المقرر</Label>
              <Input id="comp-course" placeholder="Advanced Algorithms" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comp-reason">سبب الغياب الأصلي</Label>
              <Textarea id="comp-reason" placeholder="إجازة مرضية، حضور مؤتمر، إلخ." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCompensatoryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button>
              جدولة المحاضرة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}