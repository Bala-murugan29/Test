import { apiGet, apiPost, apiPut } from '@/lib/axios';

/* ---------- backend shapes ---------- */

interface BackendSession {
  id: string;
  examId: string;
  studentUserId: string;
  attemptNo: number;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface BackendSessionDetail extends BackendSession {
  answers: BackendSessionAnswer[];
}

interface BackendSessionAnswer {
  id: string;
  questionId: string;
  answerText: string | null;
  selectedOptionIndex: number | null;
  codeAnswer: string | null;
  submittedAt: string;
}

interface BackendAutosaveAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string | null;
  selectedOptionIndex: number | null;
  codeAnswer: string | null;
  answerPayload: unknown | null;
  submittedAt: string;
}

export interface SessionAnswersResponse {
  data: BackendAutosaveAnswer[];
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- public service ---------- */

export const sessionService = {
  async startSession(examId: string): Promise<BackendSession> {
    return apiPost<BackendSession>('/sessions', { examId });
  },

  async getSession(sessionId: string): Promise<BackendSession> {
    return apiGet<BackendSession>(`/sessions/${sessionId}`);
  },

  async getSessionDetail(sessionId: string): Promise<BackendSessionDetail> {
    return apiGet<BackendSessionDetail>(`/sessions/${sessionId}`);
  },

  async getSessionQuestions(sessionId: string) {
    return apiGet<unknown>(`/sessions/${sessionId}/questions`);
  },

  async submitSession(sessionId: string): Promise<BackendSession> {
    return apiPost<BackendSession>(`/sessions/${sessionId}/submit`);
  },

  async pauseSession(sessionId: string): Promise<BackendSession> {
    return apiPost<BackendSession>(`/sessions/${sessionId}/pause`);
  },

  async resumeSession(sessionId: string): Promise<BackendSession> {
    return apiPost<BackendSession>(`/sessions/${sessionId}/resume`);
  },

  async getSessionStatus(sessionId: string) {
    return apiGet<{ status: string }>(`/sessions/${sessionId}/status`);
  },

  async getExamSessions(examId: string) {
    return apiGet<Paginated<BackendSession>>(`/exams/${examId}/sessions`);
  },

  // ---- answer persistence ----

  async saveAnswer(
    sessionId: string,
    answer: {
      questionId: string;
      answerText?: string;
      selectedOptionIndex?: number;
      codeAnswer?: string;
    },
  ): Promise<void> {
    await apiPut(`/sessions/${sessionId}/answers`, answer);
  },

  async saveAnswers(
    sessionId: string,
    answers: Array<{
      questionId: string;
      answerText?: string;
      selectedOptionIndex?: number;
      codeAnswer?: string;
    }>,
  ): Promise<void> {
    await apiPut(`/sessions/${sessionId}/answers`, { answers });
  },

  async getSavedAnswers(sessionId: string): Promise<SessionAnswersResponse> {
    return apiGet<SessionAnswersResponse>(`/sessions/${sessionId}/answers`);
  },
};
