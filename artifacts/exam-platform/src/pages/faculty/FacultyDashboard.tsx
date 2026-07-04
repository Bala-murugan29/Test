import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Users, TrendingUp, CheckSquare, Plus, ArrowRight, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { analyticsService } from '@/services/analytics.service';
import { useAuth } from '@/hooks/useAuth';
import { Exam } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [summary, setSummary] = useState<{ totalStudents: number; avgPassRate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      examService.getFacultyExams(user.id),
      analyticsService.getPlatformSummary(),
    ]).then(([e, s]) => {
      setExams(e);
      setSummary(s);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Faculty', 'Dashboard']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  const activeExams = exams.filter((e) => e.status === 'ongoing');
  const completedExams = exams.filter((e) => e.status === 'completed');

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Dashboard']}>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${user?.department} · ${user?.employeeId}`}
        actions={
          <Button onClick={() => setLocation('/faculty/exams/create')} data-testid="button-create-exam">
            <Plus className="w-4 h-4 mr-1.5" /> Create Exam
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Exams" value={exams.length} icon={<BookOpen className="w-4 h-4" />} data-testid="stat-total-exams" />
        <StatsCard label="Active Now" value={activeExams.length} icon={<CheckSquare className="w-4 h-4" />} data-testid="stat-active" />
        <StatsCard label="Total Students" value={summary?.totalStudents ?? 0} icon={<Users className="w-4 h-4" />} data-testid="stat-students" />
        <StatsCard label="Avg Pass Rate" value={`${summary?.avgPassRate ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} data-testid="stat-pass-rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">My Exams</h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/faculty/exams/list')}>
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {exams.slice(0, 5).map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-card-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(exam.durationMinutes)} · {exam.totalQuestions} questions</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <StatusBadge status={exam.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLocation(`/faculty/exams/${exam.id}/questions`)}
                    data-testid={`button-view-exam-${exam.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Create New Exam', desc: 'Set up a new examination', href: '/faculty/exams/create', icon: <Plus className="w-4 h-4" /> },
              { label: 'View Students', desc: 'Manage enrolled students', href: '/faculty/students', icon: <Users className="w-4 h-4" /> },
              { label: 'Exam Reports', desc: 'View detailed exam analytics', href: '/faculty/reports', icon: <BookOpen className="w-4 h-4" /> },
              { label: 'Analytics', desc: 'Platform performance data', href: '/faculty/analytics', icon: <TrendingUp className="w-4 h-4" /> },
            ].map((action) => (
              <button
                key={action.href}
                onClick={() => setLocation(action.href)}
                data-testid={`quick-action-${action.href.replace(/\//g, '-')}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left w-full"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Completed exams: {completedExams.length} · Active: {activeExams.length}
      </div>
    </DashboardLayout>
  );
}
