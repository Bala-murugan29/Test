import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import StudentDashboard from './StudentDashboard';
import AvailableExamsPage from './AvailableExamsPage';
import ExamInstructionsPage from './ExamInstructionsPage';
import ExamScreen from './ExamScreen';
import CodingExamScreen from './CodingExamScreen';
import SubmitScreen from './SubmitScreen';
import ResultScreen from './ResultScreen';
import StudentResultsPage from './StudentResultsPage';

export default function StudentLayout() {
  return (
    <Switch>
      <Route path="/student/dashboard">
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams">
        <ProtectedRoute allowedRoles={['student']}>
          <AvailableExamsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams/:examId/instructions">
        <ProtectedRoute allowedRoles={['student']}>
          <ExamInstructionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams/:examId/take">
        <ProtectedRoute allowedRoles={['student']}>
          <ExamScreen />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams/:examId/code">
        <ProtectedRoute allowedRoles={['student']}>
          <CodingExamScreen />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams/:examId/submit">
        <ProtectedRoute allowedRoles={['student']}>
          <SubmitScreen />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exams/:examId/result">
        <ProtectedRoute allowedRoles={['student']}>
          <ResultScreen />
        </ProtectedRoute>
      </Route>
      <Route path="/student/results">
        <ProtectedRoute allowedRoles={['student']}>
          <StudentResultsPage />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
