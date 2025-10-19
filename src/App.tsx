import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./i18n/config";
import Index from "./pages/Index";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import AccessControlPage from "./pages/AccessControlPage";
import TimetablePage from "./pages/TimetablePage";
import EnrollmentPage from "./pages/EnrollmentPage";
import ExcusesPage from "./pages/ExcusesPage";
import ReportsPage from "./pages/ReportsPage";
import IntegrationPage from "./pages/IntegrationPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import AcademicStaffPage from "./pages/AcademicStaffPage";
import CourseManagementPage from "./pages/CourseManagementPage";
import LoginPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import CollegesPage from "./pages/CollegesPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/colleges" element={<CollegesPage />} />
          
          {/* User Management */}
          <Route path="/user-management/all-users" element={<PlaceholderPage title="جميع المستخدمين" />} />
          <Route path="/user-management/roles-permissions" element={<PlaceholderPage title="الأدوار والصلاحيات" />} />
          <Route path="/user-management/access-control" element={<PlaceholderPage title="التحكم بالوصول" />} />
          
          {/* Timetable */}
          <Route path="/timetable/import-schedule" element={<PlaceholderPage title="استيراد الجدول" />} />
          <Route path="/timetable/view" element={<PlaceholderPage title="عرض الجدول" />} />
          <Route path="/timetable/course-mapping" element={<PlaceholderPage title="ربط المقررات" />} />
          
          {/* Student Enrollment */}
          <Route path="/enrollment/import-students" element={<PlaceholderPage title="استيراد الطلاب" />} />
          <Route path="/enrollment/manage-groups" element={<PlaceholderPage title="إدارة المجموعات" />} />
          <Route path="/enrollment/course-assignment" element={<PlaceholderPage title="إسناد المقررات" />} />
          
          {/* Excuse Management */}
          <Route path="/excuse/pending-requests" element={<PlaceholderPage title="الطلبات المعلقة" />} />
          <Route path="/excuse/salary-adjustments" element={<PlaceholderPage title="تعديلات الرواتب" />} />
          
          {/* Reports */}
          <Route path="/reports/financial" element={<PlaceholderPage title="التقارير المالية" />} />
          <Route path="/reports/teaching-load" element={<PlaceholderPage title="عبء التدريس" />} />
          <Route path="/reports/attendance" element={<PlaceholderPage title="الحضور" />} />
          <Route path="/reports/grades-overview" element={<PlaceholderPage title="نظرة عامة على الدرجات" />} />
          
          {/* Integration */}
          <Route path="/integration/mobile-sync" element={<PlaceholderPage title="مزامنة الهاتف المحمول" />} />
          <Route path="/integration/api-status" element={<PlaceholderPage title="حالة واجهة برمجة التطبيقات" />} />
          <Route path="/integration/real-time" element={<PlaceholderPage title="المراقبة في الوقت الفعلي" />} />
          
          {/* Course Management */}
          <Route path="/course-management/departments" element={<PlaceholderPage title="عرض الأقسام" />} />
          <Route path="/course-management/grade-reports" element={<PlaceholderPage title="تقارير الدرجات" />} />
          <Route path="/course-management/export" element={<PlaceholderPage title="تصدير البيانات" />} />
          
          {/* Other pages */}
          <Route path="/audit-log" element={<PlaceholderPage title="سجل التدقيق" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/academic-staff" element={<PlaceholderPage title="الهيئة الأكاديمية" />} />
          
          {/* Legacy routes */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/roles" element={<RolesPage />} />
          <Route path="/users/access-control" element={<AccessControlPage />} />
          <Route path="/timetable/*" element={<TimetablePage />} />
          <Route path="/enrollment/*" element={<EnrollmentPage />} />
          <Route path="/excuses/*" element={<ExcusesPage />} />
          <Route path="/reports/*" element={<ReportsPage />} />
          <Route path="/integration/*" element={<IntegrationPage />} />
          <Route path="/course-management/*" element={<CourseManagementPage />} />
          <Route path="/auditlog" element={<AuditLogPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;