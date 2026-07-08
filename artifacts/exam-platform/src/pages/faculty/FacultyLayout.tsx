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
      <Route path="/faculty/dashboard">
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/list">
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyExamListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/create">
        <ProtectedRoute allowedRoles={['faculty']}>
          <CreateExamPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/:examId/edit">
        <ProtectedRoute allowedRoles={['faculty']}>
          <CreateExamPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/exams/:examId/questions">
        <ProtectedRoute allowedRoles={['faculty']}>
          <QuestionBankPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/students">
        <ProtectedRoute allowedRoles={['faculty']}>
          <StudentManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/reports">
        <ProtectedRoute allowedRoles={['faculty']}>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/faculty/analytics">
        <ProtectedRoute allowedRoles={['faculty']}>
          <AnalyticsDashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
