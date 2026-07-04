import { ExamStatus, Question } from '../types';

export interface ScoreBreakdown {
  correct: number;
  incorrect: number;
  unattempted: number;
  obtainedMarks: number;
  percentage: number;
}

export function calculateScore(
  answers: Record<string, string>,
  questions: Question[]
): ScoreBreakdown {
  let correct = 0;
  let incorrect = 0;
  let obtainedMarks = 0;

  questions.forEach((q) => {
    const selected = answers[q.id];
    if (!selected) return;
    if (selected === q.correctOptionId) {
      correct++;
      obtainedMarks += q.marks;
    } else {
      incorrect++;
      obtainedMarks -= q.negativeMarks;
    }
  });

  const unattempted = questions.length - correct - incorrect;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const clamped = Math.max(0, obtainedMarks);
  const percentage = totalMarks > 0 ? (clamped / totalMarks) * 100 : 0;

  return { correct, incorrect, unattempted, obtainedMarks: clamped, percentage };
}

export function getExamStatusColor(status: ExamStatus): string {
  const map: Record<ExamStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    published: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ongoing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status];
}

export function getStatusLabel(status: ExamStatus): string {
  const map: Record<ExamStatus, string> = {
    draft: 'Draft',
    published: 'Upcoming',
    ongoing: 'Live',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status];
}

export function getTimeUntilExam(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}
