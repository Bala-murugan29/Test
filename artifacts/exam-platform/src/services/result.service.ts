import { apiGet, apiPost, apiPut } from '@/lib/axios';
import type { ExamResult } from '@/types';

/* ---------- backend shapes ---------- */

interface BackendResult {
  id: string;
  sessionId: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
  grade: string | null;
  remarks: string | null;
  breakdown: unknown;
  evaluatedAt: string;
  createdAt: string;
  session?: {
    examId: string;
    attemptNo: number;
    exam?: { title: string; courseId?: string };
    user?: { id?: string; fullName: string; email?: string };
  };
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- mapper ---------- */

function mapResult(r: BackendResult): ExamResult {
  // Backend breakdown is a summary object (not per-answer array).
  // answers[] is not available from the list endpoint.
  return {
    id: r.id,
    examId: r.session?.examId ?? '',
    studentId: r.session?.user?.id ?? '',
    studentName: r.session?.user?.fullName || r.session?.user?.email || '',
    totalMarks: r.maxMarks,
    obtainedMarks: r.obtainedMarks,
    percentage: Math.round(r.percentage * 100) / 100,
    isPassed: r.passed,
    timeTakenMinutes: 0,
    submittedAt: r.evaluatedAt,
    answers: [],
    rank: undefined,
    totalStudents: undefined,
  };
}

async function fetchAllResults(url: string): Promise<BackendResult[]> {
  // The student/exam results endpoints return a plain array, not paginated.
  const res = await apiGet<Paginated<BackendResult> | BackendResult[]>(url);
  if (Array.isArray(res)) {
    return res;
  }
  // Paginated response
  return res.data;
}

/* ---------- public service ---------- */

export const resultService = {
  async submitExam(
    examId: string,
    studentId: string,
    answers: Record<string, string>,
    questions: { id: string; type: string }[] = [],
    existingSessionId?: string,
  ): Promise<ExamResult> {
    // 1. Use the active session from the exam flow, or resume/create one.
    let sessionId = existingSessionId ?? '';
    if (!sessionId) {
      const session = await apiPost<{ id: string }>('/sessions', { examId });
      sessionId = session.id;
    }

    // 2. Save all answers via autosave.
    const answerEntries = Object.entries(answers).map(([questionId, answerValue]) => {
      const question = questions.find((q) => q.id === questionId);
      const isCoding = question ? question.type === 'coding' : !/^\d+$/.test(answerValue);
      return {
        questionId,
        selectedOptionIndex: isCoding ? undefined : parseInt(answerValue, 10),
        codeAnswer: isCoding ? answerValue : undefined,
      };
    });
    if (answerEntries.length > 0) {
      await apiPut(`/sessions/${sessionId}/answers`, { answers: answerEntries });
    }

    // 3. Submit the session.
    await apiPost(`/sessions/${sessionId}/submit`);

    // 4. Load this student's result for the exam (API returns a plain array, not paginated).
    const studentResults = await fetchAllResults(`/students/${studentId}/results`);
    const match =
      studentResults.find((r) => r.session?.examId === examId) ??
      studentResults.find((r) => r.sessionId === sessionId);
    if (match) {
      return mapResult(match);
    }

    // Fallback result if evaluation isn't immediate.
    return {
      id: 'pending',
      examId,
      studentId,
      studentName: '',
      totalMarks: 100,
      obtainedMarks: 0,
      percentage: 0,
      isPassed: false,
      timeTakenMinutes: 0,
      submittedAt: new Date().toISOString(),
      answers: [],
      rank: undefined,
      totalStudents: undefined,
    };
  },

  async getStudentResults(studentId: string): Promise<ExamResult[]> {
    try {
      const results = await fetchAllResults(`/students/${studentId}/results`);
      return results.map(mapResult);
    } catch {
      return [];
    }
  },

  async getExamResults(examId: string): Promise<ExamResult[]> {
    try {
      const results = await fetchAllResults(`/exams/${examId}/results`);
      return results.map(mapResult);
    } catch {
      return [];
    }
  },

  async getResultById(resultId: string): Promise<ExamResult | null> {
    try {
      const r = await apiGet<BackendResult>(`/results/${resultId}`);
      return mapResult(r);
    } catch {
      return null;
    }
  },
};
