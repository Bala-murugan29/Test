import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PassRateDonutChart } from '@/components/charts/PassRateDonutChart';
import { Button } from '@/components/ui/button';
import { resultService } from '@/services/result.service';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import type { ExamResult, Exam, Question } from '@/types';
import { formatDateTime, formatDuration, formatScore } from '@/utils/format';

export default function ResultScreen() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!examId || !user) return;
    const load = async () => {
      try {
        const [allResults, e] = await Promise.all([
          resultService.getStudentResults(user.id),
          examService.getExamById(examId),
        ]);
        const r = allResults.find((x) => x.examId === examId) ?? allResults[0] ?? null;
        setResult(r);
        setExam(e);
        if (!r) setNotFound(true);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [examId, user]);

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Student', 'Result']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading result..." />
      </DashboardLayout>
    );
  }

  if (notFound || !result || !exam) {
    return (
      <DashboardLayout breadcrumbs={['Student', 'Result']}>
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
          <XCircle className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Result Not Found</h2>
            <p className="text-muted-foreground text-sm mt-1">
              The result for this exam is not available yet. It may take a moment to process.
            </p>
          </div>
          <Button onClick={() => setLocation('/student/results')} variant="outline">
            View All Results
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const correct = result.answers.filter((a) => a.isCorrect).length;
  const incorrect = result.answers.filter((a) => !a.isCorrect && a.selectedOptionId !== '').length;

  return (
    <DashboardLayout breadcrumbs={['Student', 'Results', exam.title]}>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Exam Result"
          subtitle={exam.title}
          actions={
            <Button onClick={() => setLocation('/student/results')} variant="outline" data-testid="button-back-to-results">
              All Results
            </Button>
          }
        />

        {/* Score card */}
        <div className={`rounded-2xl p-6 mb-6 border ${result.isPassed ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${result.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {Math.round(result.percentage)}%
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${result.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                {result.isPassed ? <><CheckCircle2 className="w-4 h-4" /> Passed</> : <><XCircle className="w-4 h-4" /> Failed</>}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Stat label="Score" value={formatScore(result.obtainedMarks, result.totalMarks)} />
              <Stat label="Time Taken" value={formatDuration(result.timeTakenMinutes)} icon={<Clock className="w-3.5 h-3.5" />} />
              {result.rank && result.totalStudents && (
                <Stat label="Rank" value={`#${result.rank} / ${result.totalStudents}`} icon={<Trophy className="w-3.5 h-3.5" />} />
              )}
              <Stat label="Submitted" value={formatDateTime(result.submittedAt)} />
              <Stat label="Correct" value={String(correct)} />
              <Stat label="Incorrect" value={String(incorrect)} />
            </div>
          </div>
        </div>

        {/* Chart + breakdown */}
        {result.answers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Score Distribution</h3>
              <PassRateDonutChart passed={correct} failed={incorrect} />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Answer Summary</h3>
              <div className="flex flex-col gap-3">
                <SummaryRow label="Correct answers" count={correct} color="text-emerald-600 dark:text-emerald-400" />
                <SummaryRow label="Incorrect answers" count={incorrect} color="text-red-500" />
                <SummaryRow label="Unattempted" count={questions.length - correct - incorrect} color="text-muted-foreground" />
                <div className="border-t border-card-border pt-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-foreground">Total Questions</span>
                    <span className="text-foreground">{questions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question breakdown */}
        {result.answers.length > 0 && questions.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Question Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left px-2 py-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left px-2 py-2 text-muted-foreground font-medium">Question</th>
                    <th className="text-left px-2 py-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right px-2 py-2 text-muted-foreground font-medium">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {result.answers.map((answer, i) => {
                    const q = questions.find((x) => x.id === answer.questionId);
                    const attempted = answer.selectedOptionId !== '';
                    return (
                      <tr key={answer.questionId} className="border-b border-card-border last:border-0">
                        <td className="px-2 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2.5 text-foreground max-w-xs">
                          <p className="truncate">{q?.text ?? 'Question'}</p>
                        </td>
                        <td className="px-2 py-2.5">
                          {!attempted ? (
                            <span className="text-xs text-muted-foreground">Skipped</span>
                          ) : answer.isCorrect ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Correct</span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Incorrect</span>
                          )}
                        </td>
                        <td className={`px-2 py-2.5 text-right font-medium ${answer.marksAwarded > 0 ? 'text-emerald-600 dark:text-emerald-400' : answer.marksAwarded < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {answer.marksAwarded > 0 ? '+' : ''}{answer.marksAwarded}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button onClick={() => setLocation('/student/dashboard')} className="w-full" data-testid="button-return-dashboard">
          Return to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground flex items-center gap-1 mt-0.5">{icon}{value}</p>
    </div>
  );
}

function SummaryRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{count}</span>
    </div>
  );
}
