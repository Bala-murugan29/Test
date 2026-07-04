import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { resultService } from '@/services/result.service';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { ExamResult, StudentExam } from '@/types';
import { formatDateTime, formatPercentage } from '@/utils/format';

interface ResultRow {
  id: string;
  examTitle: string;
  submittedAt: string;
  percentage: number;
  obtainedMarks: number;
  totalMarks: number;
  isPassed: boolean;
  rank?: number;
  totalStudents?: number;
  examId: string;
}

export default function StudentResultsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [results, exams] = await Promise.all([
        resultService.getStudentResults(user.id),
        examService.getStudentExams(user.id),
      ]);
      const examMap: Record<string, StudentExam> = {};
      exams.forEach((e) => { examMap[e.id] = e; });
      setRows(
        results.map((r) => ({
          id: r.id,
          examId: r.examId,
          examTitle: examMap[r.examId]?.title ?? r.examId,
          submittedAt: r.submittedAt,
          percentage: r.percentage,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          isPassed: r.isPassed,
          rank: r.rank,
          totalStudents: r.totalStudents,
        }))
      );
      setLoading(false);
    };
    load();
  }, [user]);

  const columns: Column<ResultRow>[] = [
    { key: 'examTitle', header: 'Exam', sortable: true },
    {
      key: 'submittedAt',
      header: 'Date',
      sortable: true,
      cell: (r) => <span className="text-muted-foreground text-xs">{formatDateTime(r.submittedAt)}</span>,
    },
    {
      key: 'obtainedMarks',
      header: 'Score',
      sortable: true,
      cell: (r) => <span>{r.obtainedMarks} / {r.totalMarks}</span>,
    },
    {
      key: 'percentage',
      header: 'Percentage',
      sortable: true,
      cell: (r) => (
        <span className={`font-semibold ${r.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
          {formatPercentage(r.percentage)}
        </span>
      ),
    },
    {
      key: 'isPassed',
      header: 'Status',
      cell: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {r.isPassed ? 'Passed' : 'Failed'}
        </span>
      ),
    },
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      cell: (r) => r.rank ? <span className="text-muted-foreground">#{r.rank} / {r.totalStudents}</span> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'id',
      header: '',
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => setLocation(`/student/exams/${r.examId}/result`)} data-testid={`button-view-result-${r.id}`}>
          View
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout breadcrumbs={['Student', 'My Results']}>
      <PageHeader title="My Results" subtitle="History of all your completed examinations" />

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading results..." />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="You haven't completed any exams yet. Start with an available exam."
          icon={<BarChart3 className="w-7 h-7" />}
          action={{ label: 'Browse Exams', onClick: () => setLocation('/student/exams') }}
        />
      ) : (
        <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} pageSize={10} />
      )}
    </DashboardLayout>
  );
}
