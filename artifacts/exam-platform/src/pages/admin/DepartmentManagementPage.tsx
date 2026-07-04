import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { departmentStats } from '@/data/mock-analytics';

interface Department {
  id: string;
  name: string;
  studentCount: number;
  facultyCount: number;
  totalExams: number;
}

const initialDepartments: Department[] = departmentStats.map((d, i) => ({
  id: `dept${i + 1}`,
  name: d.department,
  studentCount: d.totalStudents,
  facultyCount: Math.round(d.totalStudents / 20),
  totalExams: Math.round(d.totalStudents / 8),
}));

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', facultyCount: '5' });

  const handleDelete = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setDeleteTarget(null);
  };

  const handleAdd = () => {
    if (!newDept.name.trim()) return;
    setDepartments((prev) => [
      ...prev,
      {
        id: `dept_${Date.now()}`,
        name: newDept.name,
        studentCount: 0,
        facultyCount: Number(newDept.facultyCount),
        totalExams: 0,
      },
    ]);
    setNewDept({ name: '', facultyCount: '5' });
    setAddOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    setDepartments((prev) => prev.map((d) => (d.id === editTarget.id ? editTarget : d)));
    setEditTarget(null);
  };

  return (
    <DashboardLayout breadcrumbs={['Admin', 'Departments']}>
      <PageHeader
        title="Departments"
        subtitle="Manage academic departments across the institution"
        actions={
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-department">
            <Plus className="w-4 h-4 mr-1.5" /> Add Department
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-4"
            data-testid={`dept-card-${dept.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{dept.name}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditTarget({ ...dept })}
                  data-testid={`button-edit-dept-${dept.id}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(dept.id)}
                  data-testid={`button-delete-dept-${dept.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <DeptStat label="Students" value={dept.studentCount} />
              <DeptStat label="Faculty" value={dept.facultyCount} />
              <DeptStat label="Exams" value={dept.totalExams} />
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Department?"
        description="All associated data will be affected. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input id="dept-name" value={newDept.name} onChange={(e) => setNewDept((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Biotechnology" data-testid="input-dept-name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-faculty">Faculty Count</Label>
              <Input id="dept-faculty" type="number" min="1" value={newDept.facultyCount} onChange={(e) => setNewDept((s) => ({ ...s, facultyCount: e.target.value }))} className="w-28" data-testid="input-dept-faculty" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newDept.name.trim()} data-testid="button-confirm-add-dept">Add Department</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-dept-name">Department Name *</Label>
                <Input id="edit-dept-name" value={editTarget.name} onChange={(e) => setEditTarget((s) => s ? { ...s, name: e.target.value } : s)} data-testid="input-edit-dept-name" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-students">Students</Label>
                  <Input id="edit-students" type="number" value={editTarget.studentCount} onChange={(e) => setEditTarget((s) => s ? { ...s, studentCount: Number(e.target.value) } : s)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-faculty">Faculty</Label>
                  <Input id="edit-faculty" type="number" value={editTarget.facultyCount} onChange={(e) => setEditTarget((s) => s ? { ...s, facultyCount: Number(e.target.value) } : s)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-exams">Exams</Label>
                  <Input id="edit-exams" type="number" value={editTarget.totalExams} onChange={(e) => setEditTarget((s) => s ? { ...s, totalExams: Number(e.target.value) } : s)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} data-testid="button-save-edit-dept">Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function DeptStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/40 rounded-lg p-2">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
