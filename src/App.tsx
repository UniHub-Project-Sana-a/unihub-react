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
import CollegesPage from "./pages/CollegesPage";

import LoginPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/auth/RequireAuth";
import RedirectIfAuthed from "@/auth/RedirectIfAuthed";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* مسارات عامة */}
            <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* مسارات محمية */}
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/colleges" element={<RequireAuth><CollegesPage /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

            <Route path="/users" element={<RequireAuth><UsersPage /></RequireAuth>} />
            <Route path="/users/roles" element={<RequireAuth><RolesPage /></RequireAuth>} />
            <Route path="/users/access-control" element={<RequireAuth><AccessControlPage /></RequireAuth>} />
            <Route path="/timetable/*" element={<RequireAuth><TimetablePage /></RequireAuth>} />
            <Route path="/enrollment/*" element={<RequireAuth><EnrollmentPage /></RequireAuth>} />
            <Route path="/excuses/*" element={<RequireAuth><ExcusesPage /></RequireAuth>} />
            <Route path="/reports/*" element={<RequireAuth><ReportsPage /></RequireAuth>} />
            <Route path="/integration/*" element={<RequireAuth><IntegrationPage /></RequireAuth>} />
            <Route path="/course-management/*" element={<RequireAuth><CourseManagementPage /></RequireAuth>} />
            <Route path="/auditlog" element={<RequireAuth><AuditLogPage /></RequireAuth>} />
            <Route path="/academic-staff" element={<RequireAuth><AcademicStaffPage /></RequireAuth>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;