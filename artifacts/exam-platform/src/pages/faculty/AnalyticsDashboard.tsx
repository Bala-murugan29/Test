import { useEffect, useState } from 'react';
import { TrendingUp, Users, BookOpen, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { DepartmentStatsChart } from '@/components/charts/DepartmentStatsChart';
import { ScoreBarChart } from '@/components/charts/ScoreBarChart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { analyticsService } from '@/services/analytics.service';
import { DepartmentStats, MonthlyStats, ExamPerformance } from '@/types';

interface PlatformSummary {
  totalStudents: number;
  totalFaculty: number;
  totalExams: number;
  avgPassRate: number;
  activeExams: number;
  examsConductedThisMonth: number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStats[]>([]);
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [performance, setPerformance] = useState<ExamPerformance[]>([]);

  useEffect(() => {
    Promise.all([
      analyticsService.getPlatformSummary(),
      analyticsService.getMonthlyStats(),
      analyticsService.getDepartmentStats(),
      analyticsService.getExamPerformance(),
    ]).then(([s, m, d, p]) => {
      setSummary(s);
      setMonthly(m);
      setDepartments(d);
      setPerformance(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Faculty', 'Analytics']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading analytics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Analytics']}>
      <PageHeader title="Analytics Dashboard" subtitle="Platform-wide performance metrics" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Students" value={summary?.totalStudents ?? 0} icon={<Users className="w-4 h-4" />} trend={5.2} trendLabel="vs last month" data-testid="stat-total-students" />
        <StatsCard label="Total Exams" value={summary?.totalExams ?? 0} icon={<BookOpen className="w-4 h-4" />} trend={12.1} trendLabel="vs last month" data-testid="stat-total-exams" />
        <StatsCard label="Avg Pass Rate" value={`${summary?.avgPassRate ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} trend={2.3} data-testid="stat-avg-pass-rate" />
        <StatsCard label="This Month" value={summary?.examsConductedThisMonth ?? 0} icon={<BarChart3 className="w-4 h-4" />} trendLabel="exams" data-testid="stat-this-month" />
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-6">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Activity Trend</h3>
          <MonthlyTrendChart data={monthly} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Department-wise Pass Rate</h3>
            <DepartmentStatsChart data={departments} />
          </div>
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Exam Average Scores</h3>
            <ScoreBarChart data={performance} />
          </div>
        </div>

        {/* Department table */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Department Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  {['Department', 'Students', 'Avg Score', 'Pass Rate'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.department} className="border-b border-card-border last:border-0">
                    <td className="px-3 py-2.5 font-medium text-foreground">{d.department}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.totalStudents}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.avgScore}%</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${d.passRate}%` }} />
                        </div>
                        <span className="text-foreground font-medium">{d.passRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
