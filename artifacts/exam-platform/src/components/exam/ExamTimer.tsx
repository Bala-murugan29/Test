import { Clock } from 'lucide-react';
import { formatSeconds } from '@/utils/format';
import { cn } from '@/utils/cn';

interface ExamTimerProps {
  seconds: number;
  className?: string;
}

export function ExamTimer({ seconds, className }: ExamTimerProps) {
  const isWarning = seconds <= 10 * 60;
  const isDanger = seconds <= 5 * 60;

  return (
    <div
      data-testid="exam-timer"
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-semibold text-lg border',
        isDanger
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse'
          : isWarning
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          : 'bg-card text-foreground border-card-border',
        className
      )}
    >
      <Clock className="w-5 h-5" />
      <span>{formatSeconds(seconds)}</span>
    </div>
  );
}
