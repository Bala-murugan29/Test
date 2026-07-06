import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

interface StudentRecord {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  cgpa: number;
  examsTaken: number;
  examsCleared: number;
  avgScore: number;
  status: 'active' | 'suspended';
  enrolledAt: string;
}

const DEPARTMENTS = ['All', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];

export default function StudentManagementPage() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    // TODO: wire to real API
    setLoading(false);
  }, []);

  const filtered = records.filter((s) => {
    const matchesDept = department === 'All' || s.department === department;
    const matchesSearch =
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const columns: Column<StudentRecord>[] = [
    { key: 'rollNumber', header: 'Roll No', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'year', header: 'Year', sortable: true, cell: (r) => <span>Year {r.year}</span> },
    { key: 'cgpa', header: 'CGPA', sortable: true, cell: (r) => <span>{r.cgpa.toFixed(1)}</span> },
    { key: 'examsTaken', header: 'Exams', sortable: true },
    {
      key: 'avgScore',
      header: 'Avg Score',
      sortable: true,
      cell: (r) => <span className="font-medium">{r.avgScore}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Students']}>
      <PageHeader title="Students" subtitle="View and manage enrolled students" />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or roll number..." className="max-w-sm" />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          data-testid="select-department-filter"
        >
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading students..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting your search." icon={<Users className="w-7 h-7" />} />
      ) : (
        <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} pageSize={10} />
      )}
    </DashboardLayout>
  );
}
