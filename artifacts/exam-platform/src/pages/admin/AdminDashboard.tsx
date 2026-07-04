import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Users, Building2, BookOpen, TrendingUp, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { analyticsService } from '@/services/analytics.service';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatRelativeTime } from '@/utils/format';

interface Summary {
  totalStudents: number;
  totalFaculty: number;
  totalExams: number;
  avgPassRate: number;
  activeExams: number;
  examsConductedThisMonth: number;
}

const ROLE_COLORS = ['hsl(233 57% 50%)', 'hsl(160 60% 45%)', 'hsl(43 90% 55%)'];

const ACTIVITY_FEED = [
  { id: '1', text: 'New user registered: Pooja Reddy (Student)', time: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: '2', text: 'Exam "Advanced DBMS" is now live', time: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: '3', text: 'Faculty Dr. Anita Bose published a new exam', time: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: '4', text: '48 students appeared in "OS Fundamentals"', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: '5', text: 'Department "Information Technology" added', time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getPlatformSummary().then((s) => {
      setSummary(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Admin', 'Dashboard']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  const roleData = [
    { name: 'Students', value: summary?.totalStudents ?? 0 },
    { name: 'Faculty', value: summary?.totalFaculty ?? 0 },
    { name: 'Admins', value: 4 },
  ];

  return (
    <DashboardLayout breadcrumbs={['Admin', 'Dashboard']}>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Users" value={(summary?.totalStudents ?? 0) + (summary?.totalFaculty ?? 0) + 4} icon={<Users className="w-4 h-4" />} trend={3.4} data-testid="stat-total-users" />
        <StatsCard label="Total Exams" value={summary?.totalExams ?? 0} icon={<BookOpen className="w-4 h-4" />} trend={8.2} data-testid="stat-total-exams" />
        <StatsCard label="Active Exams" value={summary?.activeExams ?? 0} icon={<ShieldCheck className="w-4 h-4" />} data-testid="stat-active-exams" />
        <StatsCard label="Avg Pass Rate" value={`${summary?.avgPassRate ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} trend={1.8} data-testid="stat-pass-rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User breakdown */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">User Breakdown by Role</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleData} dataKey="value" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {roleData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {ACTIVITY_FEED.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Administration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Manage Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
            { label: 'Departments', href: '/admin/departments', icon: <Building2 className="w-5 h-5" /> },
            { label: 'Platform Settings', href: '/admin/settings', icon: <TrendingUp className="w-5 h-5" /> },
          ].map((a) => (
            <button
              key={a.href}
              onClick={() => setLocation(a.href)}
              data-testid={`quick-action-admin-${a.label.replace(/\s+/g, '-').toLowerCase()}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-card-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{a.icon}</div>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
