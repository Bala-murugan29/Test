import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import AdminDashboard from './AdminDashboard';
import UserManagementPage from './UserManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';
import SettingsPage from './SettingsPage';

import AddStudentPage from './AddStudentPage';
import AddFacultyPage from './AddFacultyPage';

export default function AdminLayout() {
  return (
    <Switch>
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/add-student">
        <ProtectedRoute allowedRoles={['admin']}>
          <AddStudentPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/add-faculty">
        <ProtectedRoute allowedRoles={['admin']}>
          <AddFacultyPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={['admin']}>
          <UserManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/departments">
        <ProtectedRoute allowedRoles={['admin']}>
          <DepartmentManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute allowedRoles={['admin']}>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
