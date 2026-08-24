# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


```
unihub-react
├─ components.json
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ favicon.png
│  ├─ images
│  ├─ placeholder.svg
│  └─ robots.txt
├─ README.md
├─ READMEgit.md
├─ src
│  ├─ App.css
│  ├─ App.tsx
│  ├─ assets
│  │  ├─ 366544.svg
│  │  ├─ logo-center.png
│  │  ├─ logo-color.png
│  │  ├─ logo-dark.png
│  │  ├─ logo-full.png
│  │  ├─ logo-mini.png
│  │  ├─ logo-sidebar.png
│  │  ├─ logo.png
│  │  └─ report-bg.png
│  ├─ auth
│  │  ├─ RedirectIfAuthed.tsx
│  │  ├─ RequireAuth.tsx
│  │  ├─ RequirePermission.tsx
│  │  └─ RequireRole.tsx
│  ├─ components
│  │  ├─ audit
│  │  │  └─ AuditLog.tsx
│  │  ├─ auth
│  │  │  ├─ AddUserPage.tsx
│  │  │  ├─ ChangePasswordPage.tsx
│  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  ├─ LoginPage.tsx
│  │  │  └─ ResetPasswordPage.tsx
│  │  ├─ colleges
│  │  │  ├─ AcademicStaffModule.tsx
│  │  │  ├─ AcademicTitlesModule.tsx
│  │  │  ├─ ClassroomsModule.tsx
│  │  │  ├─ ClassworkGradesModule.tsx
│  │  │  ├─ CollegesDashboardModule.tsx
│  │  │  ├─ CourseQualityDialog.tsx
│  │  │  ├─ DepartmentsModule.tsx
│  │  │  ├─ EnrollmentModule.tsx
│  │  │  ├─ ExcusesModule.tsx
│  │  │  ├─ JsonImportModal.tsx
│  │  │  ├─ LecturerDetailsDialog.tsx
│  │  │  ├─ MakeupRequestsModule.tsx
│  │  │  ├─ PeriodsModule.tsx
│  │  │  ├─ qa
│  │  │  │  ├─ campaigns
│  │  │  │  │  └─ QaCampaignsManager.tsx
│  │  │  │  ├─ forms
│  │  │  │  │  └─ QaFormsManager.tsx
│  │  │  │  ├─ QualityAssuranceModule.tsx
│  │  │  │  └─ reports
│  │  │  │     ├─ CourseExecutionReports.tsx
│  │  │  │     └─ QaReportsDashboard.tsx
│  │  │  ├─ ReportsModule.tsx
│  │  │  └─ TimetableModule.tsx
│  │  ├─ courses
│  │  │  └─ CourseManagement.tsx
│  │  ├─ dashboard
│  │  │  └─ Dashboard.tsx
│  │  ├─ enrollment
│  │  │  ├─ EnrollmentManagement.tsx
│  │  │  ├─ FailedStudentCarryover.tsx
│  │  │  ├─ GroupManagement.tsx
│  │  │  └─ StudentImport.tsx
│  │  ├─ excuses
│  │  │  ├─ ExcuseManagement.tsx
│  │  │  └─ PendingExcuses.tsx
│  │  ├─ Gallery - Shortcut.lnk
│  │  ├─ integration
│  │  │  └─ IntegrationHub.tsx
│  │  ├─ layout
│  │  │  ├─ AdminLayout.tsx
│  │  │  ├─ LanguageSwitcher.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  └─ TopBar.tsx
│  │  ├─ lecturer
│  │  │  ├─ AttendanceSummary.tsx
│  │  │  ├─ GradesManager.tsx
│  │  │  ├─ LecturerWelcome.tsx
│  │  │  ├─ LectureSchedule.tsx
│  │  │  ├─ QRFallbackView.tsx
│  │  │  ├─ QRSessionView.tsx
│  │  │  ├─ RequestMakeupDialog.tsx
│  │  │  └─ StartQRModal.tsx
│  │  ├─ reports
│  │  │  ├─ AdminGradesReportDialog.tsx
│  │  │  ├─ AttendanceReportSheet.tsx
│  │  │  ├─ GroupAttendanceDialog.tsx
│  │  │  ├─ InstructorsReportDialog.tsx
│  │  │  ├─ QAReportDialog.tsx
│  │  │  ├─ QaReportDocument.tsx
│  │  │  ├─ QaReportPrintDialog.tsx
│  │  │  └─ UniversityComprehensiveReport.tsx
│  │  ├─ settings
│  │  │  └─ SystemSettings.tsx
│  │  ├─ staff
│  │  │  └─ AcademicStaffManagement.tsx
│  │  ├─ student
│  │  │  └─ qa
│  │  │     ├─ StudentQaModule.tsx
│  │  │     └─ StudentQaPage.tsx
│  │  ├─ timetable
│  │  │  └─ TimetableManagement.tsx
│  │  ├─ ui
│  │  │  ├─ accordion.tsx
│  │  │  ├─ alert-dialog.tsx
│  │  │  ├─ alert.tsx
│  │  │  ├─ aspect-ratio.tsx
│  │  │  ├─ avatar.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ breadcrumb.tsx
│  │  │  ├─ button.tsx
│  │  │  ├─ calendar.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ carousel.tsx
│  │  │  ├─ chart.tsx
│  │  │  ├─ checkbox.tsx
│  │  │  ├─ collapsible.tsx
│  │  │  ├─ command.tsx
│  │  │  ├─ context-menu.tsx
│  │  │  ├─ dialog.tsx
│  │  │  ├─ drawer.tsx
│  │  │  ├─ dropdown-menu.tsx
│  │  │  ├─ form.tsx
│  │  │  ├─ hover-card.tsx
│  │  │  ├─ input-otp.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ label.tsx
│  │  │  ├─ menubar.tsx
│  │  │  ├─ navigation-menu.tsx
│  │  │  ├─ pagination.tsx
│  │  │  ├─ popover.tsx
│  │  │  ├─ progress.tsx
│  │  │  ├─ radio-group.tsx
│  │  │  ├─ resizable.tsx
│  │  │  ├─ scroll-area.tsx
│  │  │  ├─ select.tsx
│  │  │  ├─ separator.tsx
│  │  │  ├─ sheet.tsx
│  │  │  ├─ sidebar.tsx
│  │  │  ├─ skeleton.tsx
│  │  │  ├─ slider.tsx
│  │  │  ├─ sonner.tsx
│  │  │  ├─ switch.tsx
│  │  │  ├─ table.tsx
│  │  │  ├─ tabs.tsx
│  │  │  ├─ textarea.tsx
│  │  │  ├─ toast.tsx
│  │  │  ├─ toaster.tsx
│  │  │  ├─ toggle-group.tsx
│  │  │  ├─ toggle.tsx
│  │  │  ├─ tooltip.tsx
│  │  │  └─ use-toast.ts
│  │  └─ users
│  │     ├─ AccessControl.tsx
│  │     ├─ RoleManagement.tsx
│  │     └─ UserManagement.tsx
│  ├─ context
│  │  └─ AuthContext.tsx
│  ├─ global.d.ts
│  ├─ hooks
│  │  ├─ use-mobile.tsx
│  │  ├─ use-toast.ts
│  │  ├─ useMotivationalQuote.tsx
│  │  └─ usePermission.ts
│  ├─ i18n
│  │  ├─ config.ts
│  │  ├─ locales
│  │  │  ├─ ar.json
│  │  │  ├─ en.json
│  │  │  └─ fr.json
│  │  └─ README.md
│  ├─ index.css
│  ├─ lib
│  │  ├─ api.ts
│  │  └─ utils.ts
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ AcademicStaffPage.tsx
│  │  ├─ AccessControlPage.tsx
│  │  ├─ AuditLogPage.tsx
│  │  ├─ CertInstructionPage.tsx
│  │  ├─ CollegesPage.tsx
│  │  ├─ CourseManagementPage.tsx
│  │  ├─ EnrollmentPage.tsx
│  │  ├─ EvaluationForm.js
│  │  ├─ ExcusesPage.tsx
│  │  ├─ Index.tsx
│  │  ├─ IntegrationPage.tsx
│  │  ├─ LecturerPage.tsx
│  │  ├─ LocationsPage.tsx
│  │  ├─ NotFound.tsx
│  │  ├─ RolesPage.tsx
│  │  ├─ SettingsPage.tsx
│  │  ├─ TimetablePage.tsx
│  │  ├─ UnauthorizedPage.tsx
│  │  └─ UsersPage.tsx
│  ├─ services
│  │  ├─ buildings.ts
│  │  ├─ classrooms.ts
│  │  ├─ colleges.ts
│  │  ├─ courses.ts
│  │  ├─ departments.ts
│  │  ├─ levels.ts
│  │  ├─ programs.ts
│  │  ├─ staff.ts
│  │  └─ terms.ts
│  └─ vite-env.d.ts
├─ tailwind.config.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts

```
