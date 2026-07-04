import { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { ExamTimer } from '@/components/exam/ExamTimer';
import { ExamProgressBar } from '@/components/exam/ExamProgressBar';

interface ExamLayoutProps {
  children: ReactNode;
  examTitle: string;
  timeRemainingSeconds: number;
  answeredCount: number;
  totalQuestions: number;
}

export function ExamLayout({
  children,
  examTitle,
  timeRemainingSeconds,
  answeredCount,
  totalQuestions,
}: ExamLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="exam-layout">
      {/* Exam topbar */}
      <header className="h-14 bg-card border-b border-card-border flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">ExamPro</p>
            <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-xs">{examTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 min-w-[180px]">
            <ExamProgressBar answered={answeredCount} total={totalQuestions} />
          </div>
          <ExamTimer seconds={timeRemainingSeconds} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto" data-testid="exam-main-content">
        {children}
      </main>
    </div>
  );
}
