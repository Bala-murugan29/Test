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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden bg-[url('/bg-reactor-blue.png')] bg-cover bg-center bg-no-repeat bg-fixed" data-testid="landing-page">
      {/* Background Dark Overlay for text readability */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-zinc-950/60" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900/50 bg-zinc-950/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">ExamPro</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-9 h-9 p-0 rounded-full hover:bg-zinc-800 hover:text-yellow-400 text-zinc-400 transition-colors" data-testid="button-theme-toggle">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/50 border border-red-500/30 text-yellow-500 text-xs font-bold tracking-wide uppercase mb-8 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
          Advanced Evaluation System
        </div>
        
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] mb-6">
          <span className="text-zinc-100">Conduct exams with</span><br/>
          <span className="bg-gradient-to-r from-red-500 via-red-600 to-yellow-500 bg-clip-text text-transparent">precision & power</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-16">
          A state-of-the-art examination platform built for performance. Students take tests, faculty manage assessments, and administrators oversee the entire ecosystem.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl relative z-10">
          <RoleCard
            title="Student Portal"
            description="Access your assessments and analyze your performance metrics."
            icon={<BookOpen className="w-6 h-6" />}
            href="/login/student"
            testId="card-student"
          />
          <RoleCard
            title="Faculty Portal"
            description="Deploy examinations and monitor academic progression."
            icon={<Users className="w-6 h-6" />}
            href="/login/faculty"
            testId="card-faculty"
          />
          <RoleCard
            title="Admin Override"
            description="System-level access for platform configuration and security."
            icon={<Shield className="w-6 h-6" />}
            href="/login/admin"
            testId="card-admin"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-zinc-950/80 backdrop-blur-sm px-6 py-8 text-center">
        <p className="text-sm font-semibold tracking-widest text-zinc-600 uppercase">
          A Hades Legion Product
        </p>
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
        className="group relative h-full flex flex-col gap-4 p-8 rounded-2xl border-2 border-red-900/40 bg-zinc-950/60 backdrop-blur-md hover:border-yellow-500/50 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer text-left overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:-translate-y-1"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 w-14 h-14 rounded-full bg-zinc-950 border border-yellow-600/30 flex items-center justify-center text-yellow-500 group-hover:border-yellow-400 group-hover:text-yellow-400 group-hover:bg-red-950/50 transition-all duration-300 shadow-[0_0_15px_rgba(202,138,4,0.15)] group-hover:shadow-[0_0_20px_rgba(202,138,4,0.4)] mx-auto mb-2">
          {icon}
        </div>
        
        <div className="relative z-10 flex-1 text-center">
          <h3 className="font-bold text-zinc-100 text-xl mb-3 tracking-wide group-hover:text-white transition-colors">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{description}</p>
        </div>
        
        <div className="relative z-10 flex items-center justify-center gap-2 text-zinc-500 text-sm font-semibold uppercase tracking-widest group-hover:text-yellow-500 transition-colors mt-6 pt-5 border-t border-red-900/30 group-hover:border-yellow-500/30">
          <span>Initialize</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
        </div>
      </div>
    </Link>
  );
}
