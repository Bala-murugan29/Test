import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, CheckSquare, BarChart3, Trophy, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { resultService } from '@/services/result.service';
import { useAuth } from '@/hooks/useAuth';
import { StudentExam, ExamResult } from '@/types';
import { formatDateTime, formatDuration, formatPercentage } from '@/utils/format';
import { getTimeUntilExam } from '@/utils/exam.utils';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const [e, r] = await Promise.all([
        examService.getStudentExams(user.id),
        resultService.getStudentResults(user.id),
      ]);
      setExams(e);
      setResults(r);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Student', 'Dashboard']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  const completedExams = exams.filter((e) => e.status === 'completed');
  const activeExams = exams.filter((e) => e.status === 'ongoing' || e.status === 'published');
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;
  const bestRank = results.length > 0
    ? Math.min(...results.filter((r) => r.rank !== undefined).map((r) => r.rank ?? 999))
    : null;

  return (
    <DashboardLayout breadcrumbs={['Student', 'Dashboard']}>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle={`${user?.department} · Roll No: ${user?.rollNumber}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Available Exams" value={activeExams.length} icon={<BookOpen className="w-4 h-4" />} data-testid="stat-available" />
        <StatsCard label="Completed" value={completedExams.length} icon={<CheckSquare className="w-4 h-4" />} data-testid="stat-completed" />
        <StatsCard label="Avg Score" value={`${avgScore}%`} icon={<BarChart3 className="w-4 h-4" />} data-testid="stat-avg-score" />
        <StatsCard label="Best Rank" value={bestRank !== null ? `#${bestRank}` : 'N/A'} icon={<Trophy className="w-4 h-4" />} data-testid="stat-best-rank" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Exams */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Active &amp; Upcoming Exams</h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/student/exams')} data-testid="link-view-all-exams">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {activeExams.slice(0, 4).map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-card-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exam.status === 'ongoing' ? 'Live now' : getTimeUntilExam(exam.scheduledAt)} · {formatDuration(exam.durationMinutes)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <StatusBadge status={exam.status} />
                  {exam.status === 'ongoing' && (
                    <Button
                      size="sm"
                      onClick={() => setLocation(`/student/exams/${exam.id}/instructions`)}
                      data-testid={`button-enter-exam-${exam.id}`}
                    >
                      Enter
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {activeExams.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No active exams at the moment.</p>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Results</h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/student/results')} data-testid="link-view-all-results">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {results.slice(0, 4).map((result) => {
              const exam = exams.find((e) => e.id === result.examId);
              return (
                <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-card-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exam?.title ?? result.examId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(result.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`text-sm font-bold ${result.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {formatPercentage(result.percentage, 0)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {result.isPassed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              );
            })}
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No results yet. Take your first exam!</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
