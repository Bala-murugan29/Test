import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExamLayout } from '@/components/layout/ExamLayout';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { QuestionNavigator } from '@/components/exam/QuestionNavigator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { useExamSession } from '@/hooks/useExamSession';
import { Exam, Question } from '@/types';

import { useAntiCheat } from '@/hooks/useAntiCheat';

export default function ExamScreen() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [localTime, setLocalTime] = useState(0);

  const {
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    answeredCount,
    timeRemainingSeconds,
    navigateToQuestion,
    answerQuestion,
    toggleFlag,
    setTimeRemaining,
  } = useExamSession();

  useEffect(() => {
    if (!examId) return;
    Promise.all([examService.getExamById(examId), examService.getExamQuestions(examId)]).then(([e, q]) => {
      setExam(e);
      setQuestions(q);
      setLocalTime(timeRemainingSeconds);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Countdown
  useEffect(() => {
    if (loading) return;
    setLocalTime(timeRemainingSeconds);
    const interval = setInterval(() => {
      setLocalTime((prev) => {
        const next = prev - 1;
        setTimeRemaining(next);
        if (next <= 0) {
          clearInterval(interval);
          setLocation(`/student/exams/${examId}/submit`);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Anti-Cheat integration
  useAntiCheat({
    onAutoSubmit: () => {
      setLocation(`/student/exams/${examId}/submit`);
    },
    maxViolations: 3,
  });

  // Warn on browser back/close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions.length, navigateToQuestion]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, navigateToQuestion]);

  if (loading || !exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" message="Loading exam..." />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ExamLayout
      examTitle={exam.title}
      timeRemainingSeconds={localTime}
      answeredCount={answeredCount}
      totalQuestions={questions.length}
    >
      <div className="flex h-full">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedOptionId={answers[currentQuestion.id]}
              isFlagged={flaggedQuestions.has(currentQuestion.id)}
              onAnswer={(optionId) => answerQuestion(currentQuestion.id, optionId)}
              onToggleFlag={() => toggleFlag(currentQuestion.id)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-card-border">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                data-testid="button-prev-question"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={() => setLocation(`/student/exams/${examId}/submit`)}
                    data-testid="button-submit-exam"
                  >
                    Review &amp; Submit
                  </Button>
                ) : (
                  <Button onClick={handleNext} data-testid="button-next-question">
                    Save &amp; Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigator panel */}
        <div className="hidden lg:block w-64 border-l border-card-border p-4 overflow-y-auto bg-card">
          <QuestionNavigator
            questions={questions}
            currentIndex={currentQuestionIndex}
            answers={answers}
            flaggedQuestions={flaggedQuestions}
            onNavigate={navigateToQuestion}
          />
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation(`/student/exams/${examId}/submit`)}
              data-testid="button-finish-exam"
            >
              Finish Exam
            </Button>
          </div>
        </div>
      </div>
    </ExamLayout>
  );
}
