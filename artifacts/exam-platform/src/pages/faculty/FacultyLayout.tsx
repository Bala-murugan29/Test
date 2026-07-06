import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import FacultyDashboard from './FacultyDashboard';
import FacultyExamListPage from './FacultyExamListPage';
import CreateExamPage from './CreateExamPage';
import QuestionBankPage from './QuestionBankPage';
import StudentManagementPage from './StudentManagementPage';
import ReportsPage from './ReportsPage';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function FacultyLayout() {
  return (
    <Switch>
      <Route path="/faculty/dashboard" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/list" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyExamListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/create" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <CreateExamPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/:examId/questions" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <QuestionBankPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/students" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <StudentManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/reports" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/analytics" nest>
        <ProtectedRoute allowedRoles={['faculty']}>
          <AnalyticsDashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
