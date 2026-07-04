import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { PassRateDonutChart } from '@/components/charts/PassRateDonutChart';
import { ScoreBarChart } from '@/components/charts/ScoreBarChart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { resultService } from '@/services/result.service';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { ExamResult, Exam } from '@/types';
import { formatDateTime, formatPercentage } from '@/utils/format';
import { ExamPerformance } from '@/types';

export default function ReportsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (!user) return;
    examService.getFacultyExams(user.id).then((e) => {
      const completed = e.filter((x) => x.status === 'completed');
      setExams(completed);
      if (completed.length > 0) setSelectedExamId(completed[0].id);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoadingResults(true);
    resultService.getExamResults(selectedExamId).then((r) => {
      setResults(r);
      setLoadingResults(false);
    });
  }, [selectedExamId]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const passed = results.filter((r) => r.isPassed).length;
  const failed = results.filter((r) => !r.isPassed).length;

  const performanceData: ExamPerformance[] = [
    {
      examTitle: (selectedExam?.title.slice(0, 12) ?? 'Exam') + '...',
      avgScore: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0,
      passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
      totalAppeared: results.length,
    },
  ];

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Reports']}>
      <PageHeader
        title="Exam Reports"
        subtitle="Detailed analytics for each exam"
        actions={
          <Button variant="outline" onClick={() => alert('CSV export — demo only')} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading exams..." />
      ) : exams.length === 0 ? (
        <EmptyState title="No completed exams" description="Reports are available for completed exams." icon={<FileText className="w-7 h-7" />} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm font-medium text-foreground">Select Exam:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[220px]"
              data-testid="select-exam-report"
            >
              {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>

          {loadingResults ? (
            <LoadingSpinner className="min-h-[200px]" message="Loading results..." />
          ) : results.length === 0 ? (
            <EmptyState title="No results yet" description="No students have completed this exam." icon={<FileText className="w-7 h-7" />} />
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Appeared', value: String(results.length) },
                  { label: 'Passed', value: String(passed) },
                  { label: 'Failed', value: String(failed) },
                  { label: 'Avg Score', value: formatPercentage(performanceData[0].avgScore) },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Pass / Fail Distribution</h3>
                  <PassRateDonutChart passed={passed} failed={failed} />
                </div>
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Score Overview</h3>
                  <ScoreBarChart data={performanceData} />
                </div>
              </div>

              {/* Top scorers */}
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Top Scorers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Rank</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Student</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Score</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...results]
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 10)
                        .map((r, i) => (
                          <tr key={r.id} className="border-b border-card-border last:border-0">
                            <td className="px-3 py-2.5 text-muted-foreground font-medium">#{i + 1}</td>
                            <td className="px-3 py-2.5 text-foreground font-medium">{r.studentName}</td>
                            <td className="px-3 py-2.5">
                              <span className={`font-semibold ${r.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {formatPercentage(r.percentage)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {r.isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDateTime(r.submittedAt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
