import { ExamStatus } from '@/types';
import { getExamStatusColor, getStatusLabel } from '@/utils/exam.utils';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: ExamStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getExamStatusColor(status),
        className
      )}
    >
      {status === 'ongoing' && (
        <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
