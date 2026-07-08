import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import AdminDashboard from './AdminDashboard';
import UserManagementPage from './UserManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';
import SettingsPage from './SettingsPage';

export default function AdminLayout() {
  return (
    <Switch>
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
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
