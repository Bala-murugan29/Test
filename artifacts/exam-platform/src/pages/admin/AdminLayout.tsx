import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import AdminDashboard from './AdminDashboard';
import UserManagementPage from './UserManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';
import SettingsPage from './SettingsPage';

export default function AdminLayout() {
  return (
    <Switch>
      <Route path="/admin/dashboard" nest>
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users" nest>
        <ProtectedRoute allowedRoles={['admin']}>
          <UserManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/departments" nest>
        <ProtectedRoute allowedRoles={['admin']}>
          <DepartmentManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings" nest>
        <ProtectedRoute allowedRoles={['admin']}>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
