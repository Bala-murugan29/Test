import { apiGet, apiPost, apiPut } from '@/lib/axios';
import type { Exam, StudentExam, Question, ExamResult } from '@/types';
import { resultService } from './result.service';

/* ---------- backend shapes ---------- */

interface BackendExamQuestion {
  questionId: string;
  sequenceNo: number;
  marksOverride: number | null;
  negativeMarks: number;
  isMandatory: boolean;
}

interface BackendExamListItem {
  id: string;
  courseId: string;
  courseTitle: string | null;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  randomizeQuestions: boolean;
  allowReview: boolean;
  attemptLimit: number;
  publishedAt: string | null;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendExamDetail extends BackendExamListItem {
  questions: BackendExamQuestion[];
}

interface BackendQuestion {
  id: string;
  departmentId: string;
  createdByUserId: string | null;
  type: string;
  status: string;
  title: string;
  prompt: string;
  explanation: string | null;
  difficulty: number;
  marks: number;
  timeLimitSeconds: number | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  mcq: {
    options: { text: string }[];
    correctOptionIndex: number;
    shuffleOptions: boolean;
    answerExplanation: string | null;
  } | null;
  coding: {
    starterCode: string | null;
    testCases: { input: string; expectedOutput: string }[];
    languageConstraints: string[] | null;
    sampleInput: string | null;
    sampleOutput: string | null;
  } | null;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- mappers ---------- */

const STATUS_MAP: Record<string, Exam['status']> = {
  DRAFT: 'draft',
  SCHEDULED: 'published',
  ACTIVE: 'ongoing',
  ENDED: 'completed',
  ARCHIVED: 'cancelled',
};

/**
 * Derive the real-time status from timestamps.
 *
 * The backend status is set explicitly (publish/archive actions) and does NOT
 * auto-transition by time. So a `SCHEDULED` exam whose `startsAt` has already
 * passed still shows as "Upcoming" from the backend alone.
 *
 * Priority:
 *  1. DRAFT / ARCHIVED / ENDED — trust the backend; these are terminal or explicit.
 *  2. SCHEDULED or ACTIVE — override with time-window logic:
 *       • before startsAt          → upcoming (published)
 *       • startsAt passed, endsAt not yet → ongoing
 *       • endsAt passed            → completed
 */
function deriveStatus(e: BackendExamListItem): Exam['status'] {
  const backendStatus = STATUS_MAP[e.status] ?? 'draft';

  // Trust terminal / explicit states.
  if (backendStatus === 'draft' || backendStatus === 'cancelled' || backendStatus === 'completed') {
    return backendStatus;
  }

  const now = Date.now();
  const startsAt = e.startsAt ? new Date(e.startsAt).getTime() : null;
  // Compute endsAt from startsAt + duration if not explicitly set.
  const endsAt = e.endsAt
    ? new Date(e.endsAt).getTime()
    : startsAt
      ? startsAt + e.durationMinutes * 60_000
      : null;

  // Exam ended (endsAt passed)
  if (endsAt && now > endsAt) {
    return 'completed';
  }

  // No explicit startsAt → published exam is immediately open (ongoing) until endsAt.
  if (!startsAt) {
    return 'ongoing';
  }

  // startsAt set and has passed → ongoing (still within window, endsAt check above passed)
  if (now >= startsAt) {
    return 'ongoing';
  }

  // Still before start
  return 'published';
}

function mapExam(e: BackendExamListItem | BackendExamDetail): Exam {
  return {
    id: e.id,
    title: e.title,
    subject: e.courseTitle ?? '',
    department: '',
    facultyId: '',
    facultyName: '',
    totalMarks: e.totalMarks,
    passingMarks: e.passMarks,
    durationMinutes: e.durationMinutes,
    totalQuestions: e.questionCount ?? 0,
    status: deriveStatus(e),
    scheduledAt: e.startsAt ?? '',
    endsAt: e.endsAt ?? '',
    instructions: e.instructions ? [e.instructions] : [],
    allowedAttempts: e.attemptLimit ?? 1,
  };
}

function mapQuestion(q: BackendQuestion, examId: string): Question {
  return {
    id: q.id,
    examId,
    text: q.prompt,
    type: q.type === 'MCQ' ? 'mcq' : q.type === 'CODING' ? 'coding' : 'mcq',
    options: q.mcq?.options.map((o, i) => ({ id: String(i), text: o.text })) ?? [],
    correctOptionId: q.mcq ? String(q.mcq.correctOptionIndex) : '',
    marks: q.marks,
    negativeMarks: 0,
    coding: q.coding
      ? {
          starterCode: q.coding.starterCode ?? undefined,
          testCases: q.coding.testCases ?? [],
          languageConstraints: q.coding.languageConstraints ?? undefined,
          sampleInput: q.coding.sampleInput ?? undefined,
          sampleOutput: q.coding.sampleOutput ?? undefined,
        }
      : undefined,
  };
}

async function fetchAllExams(params?: Record<string, string | number>): Promise<BackendExamListItem[]> {
  const all: BackendExamListItem[] = [];
  let page = 1;
  while (true) {
    const res = await apiGet<Paginated<BackendExamListItem>>('/exams', { params: { page, limit: 100, ...params } });
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return all;
}

/* ---------- public service ---------- */

export const examService = {
  async getStudentExams(studentId: string): Promise<StudentExam[]> {
    const [active, scheduled, ended, results] = await Promise.all([
      fetchAllExams({ status: 'ACTIVE' }).catch(() => [] as BackendExamListItem[]),
      fetchAllExams({ status: 'SCHEDULED' }).catch(() => [] as BackendExamListItem[]),
      fetchAllExams({ status: 'ENDED' }).catch(() => [] as BackendExamListItem[]),
      resultService.getStudentResults(studentId).catch(() => [] as ExamResult[]),
    ]);
    const allExams = [...active, ...scheduled, ...ended];

    // Filter out duplicates (just in case they appear in multiple backend statuses)
    const uniqueExamsMap = new Map<string, BackendExamListItem>();
    allExams.forEach((e) => uniqueExamsMap.set(e.id, e));
    const uniqueExams = Array.from(uniqueExamsMap.values());

    return uniqueExams.map((e) => {
      const exam = mapExam(e);
      const userResult = results.find((r) => r.examId === exam.id);

      // Derive if it's missed/unattended or completed
      if (exam.status === 'completed' && !userResult) {
        exam.status = 'missed';
      } else if (userResult) {
        // If the user has a result, from their perspective this exam is completed
        exam.status = 'completed';
      }

      return {
        ...exam,
        attemptsMade: userResult ? 1 : 0,
        lastScore: userResult?.percentage,
        isPassed: userResult?.isPassed,
      };
    });
  },

  async getExamById(examId: string): Promise<Exam | null> {
    try {
      const detail = await apiGet<BackendExamDetail>(`/exams/${examId}`);
      return mapExam(detail);
    } catch {
      return null;
    }
  },

  async getExamQuestions(examId: string): Promise<Question[]> {
    try {
      const detail = await apiGet<BackendExamDetail>(`/exams/${examId}`);
      const questions = await Promise.all(
        detail.questions.map((eq) => apiGet<BackendQuestion>(`/questions/${eq.questionId}`)),
      );
      return questions.map((q) => mapQuestion(q, examId));
    } catch {
      return [];
    }
  },

  async getFacultyExams(_facultyId: string): Promise<Exam[]> {
    const all = await fetchAllExams();
    return all.map(mapExam);
  },

  async getAllExams(): Promise<Exam[]> {
    const all = await fetchAllExams();
    return all.map(mapExam);
  },

  async createExam(data: Partial<Exam>): Promise<Exam> {
    let courseId = '';
    try {
      const depts = await apiGet<Paginated<{ id: string }>>('/departments', { params: { page: 1, limit: 1 } });
      if (depts.data.length > 0) {
        const deptId = depts.data[0].id;
        const cleanSubject = data.subject && data.subject.trim().length > 0 ? data.subject.trim() : 'EXAM101';
        const targetCode = cleanSubject.slice(0, 10).toUpperCase();
        try {
          const courses = await apiGet<Array<{ id: string; code: string }>>(`/departments/${deptId}/courses`);
          const existing = courses.find((c) => c.code.toUpperCase() === targetCode);
          if (existing) {
            courseId = existing.id;
          }
        } catch { /* no courses / query failed */ }
        if (!courseId) {
          const course = await apiPost<{ id: string }>(`/departments/${deptId}/courses`, {
            code: targetCode,
            title: data.subject && data.subject.trim().length > 0 ? data.subject.trim() : 'General',
            credits: 3,
          });
          courseId = course.id;
        }
      }
    } catch { /* fallback */ }

    const body = {
      courseId,
      title: data.title ?? '',
      instructions: data.instructions?.join('\n') ?? '',
      durationMinutes: data.durationMinutes ?? 60,
      totalMarks: data.totalMarks ?? 100,
      passMarks: data.passingMarks ?? 40,
      startsAt: data.scheduledAt || undefined,
      endsAt: data.endsAt || undefined,
      attemptLimit: data.allowedAttempts ?? 1,
    };

    const created = await apiPost<BackendExamListItem>('/exams', body);
    return mapExam(created);
  },

  async updateExam(examId: string, data: Partial<Exam>): Promise<Exam> {
    const body: Record<string, unknown> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.instructions) body.instructions = data.instructions.join('\n');
    if (data.durationMinutes !== undefined) body.durationMinutes = data.durationMinutes;
    if (data.totalMarks !== undefined) body.totalMarks = data.totalMarks;
    if (data.passingMarks !== undefined) body.passMarks = data.passingMarks;
    if (data.scheduledAt !== undefined) body.startsAt = data.scheduledAt;
    if (data.endsAt !== undefined) body.endsAt = data.endsAt;
    if (data.allowedAttempts !== undefined) body.attemptLimit = data.allowedAttempts;

    const updated = await apiPut<BackendExamListItem>(`/exams/${examId}`, body);
    return mapExam(updated);
  },

  async publishExam(examId: string): Promise<Exam> {
    const updated = await apiPut<BackendExamListItem>(`/exams/${examId}/publish`);
    return mapExam(updated);
  },
};
