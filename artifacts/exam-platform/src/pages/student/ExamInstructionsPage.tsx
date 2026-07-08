import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { CheckCircle2, Clock, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { examService } from '@/services/exam.service';
import { useExamSession } from '@/hooks/useExamSession';
import { apiPost } from '@/lib/axios';
import { Exam } from '@/types';
import { formatDuration } from '@/utils/format';

export default function ExamInstructionsPage() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const { startSession, setSessionId } = useExamSession();

  useEffect(() => {
    if (!examId) return;
    examService.getExamById(examId).then((e) => {
      setExam(e);
      setLoading(false);
    });
  }, [examId]);

  const handleStart = async () => {
    if (!exam || !agreed) return;
    setStarting(true);
    setStartError(null);
    try {
      // Create (or resume) the backend exam session first.
      const session = await apiPost<{ id: string }>('/sessions', { examId: exam.id });
      // Initialise the local timer/answer store and persist the backend session ID.
      startSession(exam.id, exam.durationMinutes, session.id);
      setSessionId(session.id);
      setLocation(`/student/exams/${exam.id}/code`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to start exam. Please try again.';
      setStartError(msg);
      setStarting(false);
    }
  };

  if (loading || !exam) {
    return (
      <DashboardLayout breadcrumbs={['Student', 'Exams', 'Instructions']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading exam details..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={['Student', 'Exams', exam.title]}>
      <div className="max-w-2xl mx-auto">
        <PageHeader title={exam.title} subtitle={`${exam.subject} · ${exam.department}`} />

        {/* Exam meta */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Duration', value: formatDuration(exam.durationMinutes), icon: <Clock className="w-4 h-4" /> },
            { label: 'Problems', value: String(exam.totalQuestions), icon: <FileText className="w-4 h-4" /> },
            { label: 'Total Marks', value: String(exam.totalMarks), icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map((m) => (
            <div key={m.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
              <div className="flex justify-center text-primary mb-2">{m.icon}</div>
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Passing marks */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Passing marks: <strong>{exam.passingMarks}</strong> out of {exam.totalMarks}</span>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Instructions</h2>
          <ol className="flex flex-col gap-3">
            {exam.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* Agree checkbox */}
        <div className="flex items-start gap-3 mb-4">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            data-testid="checkbox-agree-instructions"
          />
          <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
            I have read and understood all the instructions. I agree to abide by the examination rules.
          </label>
        </div>

        {/* Session creation error */}
        {startError && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{startError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => history.back()} disabled={starting} data-testid="button-back">
            Go Back
          </Button>
          <Button onClick={handleStart} disabled={!agreed || starting} className="flex-1" data-testid="button-start-exam">
            {starting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</> : 'Start Exam'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
