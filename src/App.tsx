import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./i18n/config";

// استيراد الصفحات
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
import CollegesPage from "./pages/CollegesPage";
import LoginPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import LecturerPage from "./pages/LecturerPage";
import UnauthorizedPage from "./pages/UnauthorizedPage"; // <-- أضف صفحة "غير مصرح به"
import CertInstructionPage from "@/pages/CertInstructionPage";

// استيراد مكونات الحماية
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/auth/RequireAuth";
import RedirectIfAuthed from "@/auth/RedirectIfAuthed";
import RequireRole from "@/auth/RequireRole"; // <-- استيراد المكون الجديد

const queryClient = new QueryClient();

const App = () => (
  <div dir="rtl">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* 1. المسارات العامة */}
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/install-cert" element={<CertInstructionPage />} />
  
              {/* 2. المسارات المحمية (تتطلب تسجيل دخول) */}
              <Route element={<RequireAuth />}>
  
                {/* 2.1. مسارات خاصة بالمحاضر فقط */}
                <Route element={<RequireRole allowedRoles={['lecturer']} />}>
                  <Route path="/lecturer" element={<LecturerPage />} />
                  {/* يمكنك إضافة مسارات أخرى خاصة بالمحاضر هنا */}
                </Route>
  
                {/* 2.2. مسارات إدارية (محمية من المحاضر) */}
                <Route element={<RequireRole allowedRoles={['admin', 'dean', 'presidency', 'head_of_department']} />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/colleges" element={<CollegesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
                  <Route path="/academic-staff" element={<AcademicStaffPage />} />
                </Route>
  
              </Route>
  
              {/* 3. مسار احتياطي لـ 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;