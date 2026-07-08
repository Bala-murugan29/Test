import { useExamSessionStore } from '../store/exam-session.store';

export function useExamSession() {
  const examId = useExamSessionStore((s) => s.examId);
  const sessionId = useExamSessionStore((s) => s.sessionId);
  const currentQuestionIndex = useExamSessionStore((s) => s.currentQuestionIndex);
  const answers = useExamSessionStore((s) => s.answers);
  const flaggedQuestions = useExamSessionStore((s) => s.flaggedQuestions);
  const timeRemainingSeconds = useExamSessionStore((s) => s.timeRemainingSeconds);
  const isSubmitted = useExamSessionStore((s) => s.isSubmitted);
  const startSession = useExamSessionStore((s) => s.startSession);
  const setSessionId = useExamSessionStore((s) => s.setSessionId);
  const answerQuestion = useExamSessionStore((s) => s.answerQuestion);
  const toggleFlag = useExamSessionStore((s) => s.toggleFlag);
  const navigateToQuestion = useExamSessionStore((s) => s.navigateToQuestion);
  const setTimeRemaining = useExamSessionStore((s) => s.setTimeRemaining);
  const submitExam = useExamSessionStore((s) => s.submitExam);
  const clearSession = useExamSessionStore((s) => s.clearSession);

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;

  return {
    examId,
    sessionId,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    timeRemainingSeconds,
    isSubmitted,
    answeredCount,
    flaggedCount,
    startSession,
    setSessionId,
    answerQuestion,
    toggleFlag,
    navigateToQuestion,
    setTimeRemaining,
    submitExam,
    clearSession,
  };
}
