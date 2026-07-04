import { useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userService } from '@/services/user.service';
import { useDebounce } from '@/hooks/useDebounce';
import { MockUser, Role } from '@/types';

export default function UserManagementPage() {
  const [allUsers, setAllUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addRole, setAddRole] = useState<Role>('student');
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '' });
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    userService.getAllUsers().then((u) => {
      setAllUsers(u);
      setLoading(false);
    });
  }, []);

  const filterUsers = (role: Role) =>
    allUsers.filter(
      (u) =>
        u.role === role &&
        (u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );

  const handleDelete = async (id: string) => {
    await userService.deleteUser(id);
    setAllUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteTarget(null);
  };

  const handleAdd = async () => {
    const user = await userService.createUser({ ...newUser, role: addRole });
    setAllUsers((prev) => [...prev, user]);
    setAddDialogOpen(false);
    setNewUser({ name: '', email: '', department: '' });
  };

  const makeColumns = (role: Role): Column<MockUser>[] => [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true, cell: (u) => <span className="text-muted-foreground text-xs">{u.email}</span> },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'rollNumber',
      header: role === 'student' ? 'Roll No' : 'Employee ID',
      cell: (u) => <span className="text-muted-foreground text-xs">{role === 'student' ? u.rollNumber ?? '-' : u.employeeId ?? '-'}</span>,
    },
    {
      key: 'avatar',
      header: '',
      cell: (u) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive h-7 w-7 p-0"
          onClick={() => setDeleteTarget(u.id)}
          data-testid={`button-delete-user-${u.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  const TabContent = ({ role }: { role: Role }) => {
    const data = filterUsers(role);
    return (
      <TabsContent value={role} className="mt-4">
        {data.length === 0 ? (
          <EmptyState title={`No ${role}s found`} icon={<Users className="w-7 h-7" />} />
        ) : (
          <DataTable columns={makeColumns(role)} data={data} keyExtractor={(u) => u.id} pageSize={8} />
        )}
      </TabsContent>
    );
  };

  return (
    <DashboardLayout breadcrumbs={['Admin', 'Users']}>
      <PageHeader
        title="User Management"
        subtitle="Manage students, faculty, and administrators"
        actions={
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-user">
            <Plus className="w-4 h-4 mr-1.5" /> Add User
          </Button>
        }
      />

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="max-w-sm" />
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading users..." />
      ) : (
        <Tabs defaultValue="student">
          <TabsList>
            <TabsTrigger value="student" data-testid="tab-students">Students ({filterUsers('student').length})</TabsTrigger>
            <TabsTrigger value="faculty" data-testid="tab-faculty">Faculty ({filterUsers('faculty').length})</TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admins">Admins ({filterUsers('admin').length})</TabsTrigger>
          </TabsList>
          <TabContent role="student" />
          <TabContent role="faculty" />
          <TabContent role="admin" />
        </Tabs>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete User?"
        description="This user will be permanently removed from the platform."
        confirmLabel="Delete User"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as Role)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid="select-new-user-role"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-name">Full Name *</Label>
              <Input id="new-name" value={newUser.name} onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))} placeholder="Full name" data-testid="input-new-user-name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-email">Email *</Label>
              <Input id="new-email" type="email" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} placeholder="email@university.edu" data-testid="input-new-user-email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-dept">Department</Label>
              <Input id="new-dept" value={newUser.department} onChange={(e) => setNewUser((s) => ({ ...s, department: e.target.value }))} placeholder="Department name" data-testid="input-new-user-department" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newUser.name.trim() || !newUser.email.trim()} data-testid="button-confirm-add-user">Add User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
