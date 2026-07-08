import { create } from 'zustand';

interface ExamSessionState {
  examId: string | null;
  /** Backend ExamSession ID — set after POST /sessions succeeds. */
  sessionId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> optionId
  flaggedQuestions: Set<string>;
  timeRemainingSeconds: number;
  isSubmitted: boolean;
  startSession: (examId: string, durationMinutes: number, sessionId?: string) => void;
  setSessionId: (sessionId: string) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  toggleFlag: (questionId: string) => void;
  navigateToQuestion: (index: number) => void;
  setTimeRemaining: (seconds: number) => void;
  submitExam: () => void;
  clearSession: () => void;
}

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  examId: null,
  sessionId: null,
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: new Set(),
  timeRemainingSeconds: 0,
  isSubmitted: false,
  startSession: (examId, durationMinutes, sessionId) =>
    set({
      examId,
      sessionId: sessionId ?? null,
      timeRemainingSeconds: durationMinutes * 60,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: new Set(),
      isSubmitted: false,
    }),
  setSessionId: (sessionId) => set({ sessionId }),
  answerQuestion: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),
  toggleFlag: (questionId) =>
    set((state) => {
      const newFlagged = new Set(state.flaggedQuestions);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { flaggedQuestions: newFlagged };
    }),
  navigateToQuestion: (index) => set({ currentQuestionIndex: index }),
  setTimeRemaining: (seconds) => set({ timeRemainingSeconds: seconds }),
  submitExam: () => set({ isSubmitted: true }),
  clearSession: () =>
    set({
      examId: null,
      sessionId: null,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: new Set(),
      timeRemainingSeconds: 0,
      isSubmitted: false,
    }),
}));