import { apiGet, apiPost } from '@/lib/axios';
import type { ExamResult, SubmissionAnswer } from '@/types';

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
    exam?: { title: string; courseId: string };
  };
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- mapper ---------- */

function mapResult(r: BackendResult): ExamResult {
  const breakdown = (r.breakdown as SubmissionAnswer[] | undefined) ?? [];
  return {
    id: r.id,
    examId: r.session?.examId ?? '',
    studentId: '',
    studentName: '',
    totalMarks: r.maxMarks,
    obtainedMarks: r.obtainedMarks,
    percentage: Math.round(r.percentage * 100) / 100,
    isPassed: r.passed,
    timeTakenMinutes: 0,
    submittedAt: r.evaluatedAt,
    answers: breakdown,
    rank: undefined,
    totalStudents: undefined,
  };
}

async function fetchAllResults(url: string): Promise<BackendResult[]> {
  const all: BackendResult[] = [];
  let page = 1;
  while (true) {
    const res = await apiGet<Paginated<BackendResult>>(url, { params: { page, limit: 100 } });
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return all;
}

/* ---------- public service ---------- */

export const resultService = {
  async submitExam(
    examId: string,
    _studentId: string,
    answers: Record<string, string>,
  ): Promise<ExamResult> {
    // 1. Start a session (or get existing one).
    let sessionId = '';
    try {
      const session = await apiPost<{ id: string }>('/sessions', { examId });
      sessionId = session.id;
    } catch {
      // Session may already exist — try to find it.
      const sessions = await apiGet<Paginated<{ id: string; status: string }>>(`/exams/${examId}/sessions`, {
        params: { page: 1, limit: 1 },
      });
      if (sessions.data.length > 0) {
        sessionId = sessions.data[0].id;
      } else {
        throw new Error('Could not start or find exam session.');
      }
    }

    // 2. Save all answers via autosave.
    const answerEntries = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionIndex: parseInt(selectedOptionId, 10),
    }));
    await apiPost(`/sessions/${sessionId}/answers`, { answers: answerEntries });

    // 3. Submit the session.
    await apiPost(`/sessions/${sessionId}/submit`);

    // 4. Evaluate the result.
    const results = await apiGet<Paginated<BackendResult>>(`/exams/${examId}/results`, {
      params: { page: 1, limit: 1 },
    });
    if (results.data.length > 0) {
      return mapResult(results.data[0]);
    }

    // Fallback result if evaluation isn't immediate.
    return {
      id: 'pending',
      examId,
      studentId: _studentId,
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
