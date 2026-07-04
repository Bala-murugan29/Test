import { Link } from 'wouter';
import { GraduationCap, BookOpen, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

const features = [
  'Role-based access for students, faculty, and admins',
  'Real-time countdown timer with auto-submit',
  'Negative marking and partial scoring support',
  'Detailed result analytics with question-level breakdown',
  'Question flagging and palette navigation',
  'Department-wise performance reports',
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="landing-page">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-card-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ExamPro</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-8 h-8 p-0" data-testid="button-theme-toggle">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Online Examination Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight max-w-3xl leading-tight">
          Conduct exams with{' '}
          <span className="text-primary">precision and confidence</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
          A secure, feature-complete examination platform for universities. Students take exams,
          faculty manage assessments, and administrators oversee everything — from one place.
        </p>

        {/* Role cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <RoleCard
            title="Student"
            description="Take exams, view results and track your performance"
            icon={<BookOpen className="w-6 h-6" />}
            href="/login/student"
            testId="card-student"
          />
          <RoleCard
            title="Faculty"
            description="Create and manage exams, analyze student performance"
            icon={<Users className="w-6 h-6" />}
            href="/login/faculty"
            testId="card-faculty"
          />
          <RoleCard
            title="Admin"
            description="Manage users, departments and platform settings"
            icon={<Shield className="w-6 h-6" />}
            href="/login/admin"
            testId="card-admin"
          />
        </div>

        {/* Features */}
        <div className="mt-16 max-w-2xl w-full text-left">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border px-6 py-4 text-center text-xs text-muted-foreground">
        ExamPro — Online Examination Platform
      </footer>
    </div>
  );
}

function RoleCard({ title, description, icon, href, testId }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  testId: string;
}) {
  return (
    <Link href={href}>
      <div
        data-testid={testId}
        className="group flex flex-col gap-3 p-5 rounded-2xl border border-card-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-primary text-xs font-medium">
          <span>Sign in as {title}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
