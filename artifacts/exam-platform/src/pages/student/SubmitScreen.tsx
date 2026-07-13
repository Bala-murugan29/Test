import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react';
import { ExamLayout } from '@/components/layout/ExamLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { resultService } from '@/services/result.service';
import { useExamSession } from '@/hooks/useExamSession';
import { useExamSessionStore } from '@/store/exam-session.store';
import { useAuth } from '@/hooks/useAuth';
import { Exam, Question } from '@/types';

export default function SubmitScreen() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { answers, flaggedQuestions, timeRemainingSeconds, submitExam, clearSession } = useExamSession();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const storeExamId = useExamSessionStore((s) => s.examId);

  useEffect(() => {
    if (examId && storeExamId !== examId) {
      setLocation('/student/dashboard', { replace: true });
    }
  }, [examId, storeExamId, setLocation]);

  useEffect(() => {
    if (!examId) return;
    Promise.all([examService.getExamById(examId), examService.getExamQuestions(examId)]).then(([e, q]) => {
      setExam(e);
      setQuestions(q);
      setLoading(false);
    });
  }, [examId]);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestions.size;

  const handleConfirmSubmit = async () => {
    if (!examId || !user) return;
    setSubmitting(true);
    try {
      await resultService.submitExam(examId, user.id, answers);
      submitExam();
      clearSession();
      setLocation(`/student/exams/${examId}/result`, { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <ExamLayout
      examTitle={exam.title}
      timeRemainingSeconds={timeRemainingSeconds}
      answeredCount={answeredCount}
      totalQuestions={questions.length}
    >
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="bg-card border border-card-border rounded-2xl p-8 max-w-md w-full shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Review &amp; Submit</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Please review your progress before submitting. This action cannot be undone.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Answered</span>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Not Answered</span>
                </div>
                <span className="text-sm font-bold text-red-700 dark:text-red-400">{unansweredCount}</span>
              </div>
            )}

            {flaggedCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-medium">Flagged</span>
                </div>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{flaggedCount}</span>
              </div>
            )}
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-5 text-xs text-amber-800 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Unattempted questions will not be scored.</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation(`/student/exams/${examId}/take`)}
              className="flex-1"
              data-testid="button-go-back"
            >
              Go Back
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              className="flex-1"
              disabled={submitting}
              data-testid="button-final-submit"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit Exam?"
        description="Once submitted, you cannot change your answers. Are you sure you want to submit?"
        confirmLabel="Submit Now"
        cancelLabel="Not yet"
        onConfirm={handleConfirmSubmit}
        variant="default"
      />
    </ExamLayout>
  );
}
