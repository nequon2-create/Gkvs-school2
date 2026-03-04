import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-load all pages so the browser only downloads the code for the page being visited
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AcademicYearsPage = lazy(() => import('./pages/AcademicYearsPage').then(m => ({ default: m.AcademicYearsPage })));
const CreateProfilePage = lazy(() => import('./pages/CreateProfilePage').then(m => ({ default: m.CreateProfilePage })));
const ClassesPage = lazy(() => import('./pages/ClassesPage').then(m => ({ default: m.ClassesPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then(m => ({ default: m.StudentsPage })));
const TeachersPage = lazy(() => import('./pages/TeachersPage').then(m => ({ default: m.TeachersPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const StudentAttendancePage = lazy(() => import('./pages/StudentAttendancePage').then(m => ({ default: m.StudentAttendancePage })));
const TeacherAttendancePage = lazy(() => import('./pages/TeacherAttendancePage').then(m => ({ default: m.TeacherAttendancePage })));
const MarkAttendancePage = lazy(() => import('./pages/MarkAttendancePage').then(m => ({ default: m.MarkAttendancePage })));
const StudentAttendanceSheetPage = lazy(() => import('./pages/StudentAttendanceSheetPage').then(m => ({ default: m.StudentAttendanceSheetPage })));
const TeacherAttendanceSheetPage = lazy(() => import('./pages/TeacherAttendanceSheetPage').then(m => ({ default: m.TeacherAttendanceSheetPage })));
const ExamsPage = lazy(() => import('./pages/ExamsPage').then(m => ({ default: m.ExamsPage })));
const MarksPage = lazy(() => import('./pages/MarksPage').then(m => ({ default: m.MarksPage })));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })));
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage').then(m => ({ default: m.TeacherProfilePage })));
const EditStudentProfilePage = lazy(() => import('./pages/EditStudentProfilePage').then(m => ({ default: m.EditStudentProfilePage })));
const EditTeacherProfilePage = lazy(() => import('./pages/EditTeacherProfilePage').then(m => ({ default: m.EditTeacherProfilePage })));
const ReportCardPage = lazy(() => import('./pages/ReportCardPage').then(m => ({ default: m.ReportCardPage })));
const TeacherReportPage = lazy(() => import('./pages/TeacherReportPage').then(m => ({ default: m.TeacherReportPage })));
const CertificationPage = lazy(() => import('./pages/CertificationPage').then(m => ({ default: m.CertificationPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const HomeworkPage = lazy(() => import('./pages/HomeworkPage').then(m => ({ default: m.HomeworkPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const SetFeesPage = lazy(() => import('./pages/SetFeesPage').then(m => ({ default: m.SetFeesPage })));
const CreateReceiptPage = lazy(() => import('./pages/CreateReceiptPage').then(m => ({ default: m.CreateReceiptPage })));
const DashboardRouteLayout = lazy(() => import('./components/layouts/DashboardRouteLayout').then(m => ({ default: m.DashboardRouteLayout })));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then(m => ({ default: m.PromotionsPage })));

// Mobile App Pages
const RoleSelectionPage = lazy(() => import('./pages/mobile/RoleSelectionPage').then(m => ({ default: m.RoleSelectionPage })));
const MobileLoginPage = lazy(() => import('./pages/mobile/MobileLoginPage').then(m => ({ default: m.MobileLoginPage })));
const ParentHomePage = lazy(() => import('./pages/mobile/parent/ParentHomePage').then(m => ({ default: m.ParentHomePage })));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <div>Loading...</div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* New Mobile App Routes */}
            <Route path="/mobile" element={<RoleSelectionPage />} />
            <Route path="/mobile/login/:role" element={<MobileLoginPage />} />
            <Route path="/mobile/parent/home" element={<ParentHomePage />} />

            {/* Protected Routes with Sidebar Layout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardRouteLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/academic-years" element={<AcademicYearsPage />} />
              <Route path="/create-profile" element={<CreateProfilePage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentProfilePage />} />
              <Route path="/students/:id/edit" element={<EditStudentProfilePage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/teachers/:id" element={<TeacherProfilePage />} />
              <Route path="/teachers/:id/edit" element={<EditTeacherProfilePage />} />
              <Route path="/students/:id/report-card" element={<ReportCardPage />} />
              <Route path="/teachers/:id/report-card" element={<TeacherReportPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/attendance/students" element={<StudentAttendancePage />} />
              <Route path="/attendance/students/:classId/sheet" element={<StudentAttendanceSheetPage />} />
              <Route path="/attendance/teachers" element={<TeacherAttendancePage />} />
              <Route path="/attendance/teachers/sheet" element={<TeacherAttendanceSheetPage />} />
              <Route path="/attendance/mark" element={<MarkAttendancePage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/marks" element={<MarksPage />} />
              <Route path="/homework" element={<HomeworkPage />} />
              <Route path="/certification" element={<CertificationPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/set-fees" element={<SetFeesPage />} />
              <Route path="/billing/create-receipt" element={<CreateReceiptPage />} />
              <Route path="/events" element={<CalendarPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
