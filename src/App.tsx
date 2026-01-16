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
// import CollegeDashboard from "./pages/colleges/CollegeDashboard";

// استيراد مكونات الحماية
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/auth/RequireAuth";
import RedirectIfAuthed from "@/auth/RedirectIfAuthed";
import RequireRole from "@/auth/RequireRole"; // <-- استيراد المكون الجديد
import ChangePasswordPage from '@/components/auth/ChangePasswordPage';

const queryClient = new QueryClient();

const App = () => (
  <div dir="rtl">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/react-app"
         future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
              <Routes>
              {/* 1. المسارات العامة (بدون تسجيل دخول) */}
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/install-cert" element={<CertInstructionPage />} />
              
              {/* لم نعد بحاجة لصفحة unauthorized بسبب التوجيه التلقائي، لكن يمكنك تركها كاحتياط */}
              {/* <Route path="/unauthorized" element={<UnauthorizedPage />} /> */}
  
              {/* 2. المسارات المحمية (تتطلب تسجيل دخول أولاً) */}
              <Route element={<RequireAuth />}>
  
                {/* 🔒 أ) منطقة المشرف العام فقط (رئاسة الجامعة) */}
                {/* هذا هو الوحيد الذي يمكنه رؤية الصفحة الرئيسية للنظام / */}
                <Route element={<RequireRole allowedRoles={['presidency' , 'admin']} />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/colleges" element={<CollegesPage />} /> {/* قائمة الكليات */}
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* <Route path="/users" element={<UsersPage />} /> */}
                  {/* <Route path="/users/roles" element={<RolesPage />} /> */}
                  <Route path="/users/access-control" element={<AccessControlPage />} />
                  <Route path="/auditlog" element={<AuditLogPage />} />
                  
                  {/* مسارات إدارية عامة تابعة للرئاسة */}
                  <Route path="/integration/*" element={<IntegrationPage />} />
                </Route>

                <Route element={<RequireRole allowedRoles={['presidency', 'admin', 'dean']} />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/roles" element={<RolesPage />} />
                  {/* <Route path="/users/access-control" element={<AccessControlPage />} /> */}
                </Route>
  
                {/* 🔒 ب) منطقة الكليات (مشتركة بين الرئاسة وإدارة الكلية) */}
                {/* يسمح للمشرف العام + العميد + رئيس القسم بالدخول هنا */}
                {/* ملاحظة: المحاضر ممنوع من هنا */}
                <Route element={<RequireRole allowedRoles={['presidency', 'admin', 'dean', 'head_of_department', 'secretary']} />}>
                  
                  {/* صفحة الداشبورد الخاصة بكلية محددة */}
                  {/* مثال: /colleges/5/dashboard */}
                  <Route path="/colleges" element={<CollegesPage />} /> 
                  <Route path="/colleges/:id/dashboard" element={<CollegesPage />} /> 

                  {/* باقي الصفحات الإدارية الخاصة بالكلية */}
                  <Route path="/timetable/*" element={<TimetablePage />} />
                  <Route path="/enrollment/*" element={<EnrollmentPage />} />
                  <Route path="/excuses/*" element={<ExcusesPage />} />
                  <Route path="/course-management/*" element={<CourseManagementPage />} />
                  <Route path="/academic-staff" element={<AcademicStaffPage />} />
                </Route>
  
                {/* 🔒 ج) منطقة المحاضر فقط */}
                {/* لا يدخلها المشرف العام ولا العميد، فقط المحاضر صاحب الحساب */}
                <Route element={<RequireRole allowedRoles={['lecturer']} />}>
                  <Route path="/lecturer" element={<LecturerPage />} />
                  {/* <Route path="/lecturer/schedule" element={<LecturerSchedule />} /> */}
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