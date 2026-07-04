import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';

import LandingPage from '@/pages/landing/LandingPage';
import StudentLoginPage from '@/pages/auth/StudentLoginPage';
import FacultyLoginPage from '@/pages/auth/FacultyLoginPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';

import StudentDashboard from '@/pages/student/StudentDashboard';
import AvailableExamsPage from '@/pages/student/AvailableExamsPage';
import ExamInstructionsPage from '@/pages/student/ExamInstructionsPage';
import ExamScreen from '@/pages/student/ExamScreen';
import CodingExamScreen from '@/pages/student/CodingExamScreen';
import SubmitScreen from '@/pages/student/SubmitScreen';
import ResultScreen from '@/pages/student/ResultScreen';
import StudentResultsPage from '@/pages/student/StudentResultsPage';

import FacultyDashboard from '@/pages/faculty/FacultyDashboard';
import FacultyExamListPage from '@/pages/faculty/FacultyExamListPage';
import CreateExamPage from '@/pages/faculty/CreateExamPage';
import QuestionBankPage from '@/pages/faculty/QuestionBankPage';
import StudentManagementPage from '@/pages/faculty/StudentManagementPage';
import ReportsPage from '@/pages/faculty/ReportsPage';
import AnalyticsDashboard from '@/pages/faculty/AnalyticsDashboard';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import DepartmentManagementPage from '@/pages/admin/DepartmentManagementPage';
import SettingsPage from '@/pages/admin/SettingsPage';

import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />

      {/* Auth */}
      <Route path="/login/student" component={StudentLoginPage} />
      <Route path="/login/faculty" component={FacultyLoginPage} />
      <Route path="/login/admin" component={AdminLoginPage} />

      {/* Student */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/exams" component={AvailableExamsPage} />
      <Route path="/student/exams/:examId/instructions" component={ExamInstructionsPage} />
      <Route path="/student/exams/:examId/take" component={ExamScreen} />
      <Route path="/student/exams/:examId/code" component={CodingExamScreen} />
      <Route path="/student/exams/:examId/submit" component={SubmitScreen} />
      <Route path="/student/exams/:examId/result" component={ResultScreen} />
      <Route path="/student/results" component={StudentResultsPage} />

      {/* Faculty */}
      <Route path="/faculty/dashboard" component={FacultyDashboard} />
      <Route path="/faculty/exams/list" component={FacultyExamListPage} />
      <Route path="/faculty/exams/create" component={CreateExamPage} />
      <Route path="/faculty/exams/:examId/questions" component={QuestionBankPage} />
      <Route path="/faculty/students" component={StudentManagementPage} />
      <Route path="/faculty/reports" component={ReportsPage} />
      <Route path="/faculty/analytics" component={AnalyticsDashboard} />

      {/* Admin */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagementPage} />
      <Route path="/admin/departments" component={DepartmentManagementPage} />
      <Route path="/admin/settings" component={SettingsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInitializer>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ThemeInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
