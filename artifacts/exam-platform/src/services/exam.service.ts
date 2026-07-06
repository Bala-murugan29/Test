import { apiGet, apiPost, apiPut } from '@/lib/axios';
import type { Exam, StudentExam, Question } from '@/types';

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

function mapExam(e: BackendExamListItem | BackendExamDetail): Exam {
  const detail = 'questions' in e ? e : null;
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
    totalQuestions: detail ? detail.questions.length : 0,
    status: STATUS_MAP[e.status] ?? 'draft',
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
    type: q.type === 'MCQ' ? 'mcq' : 'mcq',
    options: q.mcq?.options.map((o, i) => ({ id: String(i), text: o.text })) ?? [],
    correctOptionId: q.mcq ? String(q.mcq.correctOptionIndex) : '',
    marks: q.marks,
    negativeMarks: 0,
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
  async getStudentExams(_studentId: string): Promise<StudentExam[]> {
    const [active, scheduled, ended] = await Promise.all([
      fetchAllExams({ status: 'ACTIVE' }).catch(() => []),
      fetchAllExams({ status: 'SCHEDULED' }).catch(() => []),
      fetchAllExams({ status: 'ENDED' }).catch(() => []),
    ]);
    const allExams = [...active, ...scheduled, ...ended];
    return allExams.map((e) => ({
      ...mapExam(e),
      attemptsMade: 0,
      lastScore: undefined,
      isPassed: undefined,
    }));
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
        try {
          const courses = await apiGet<Paginated<{ id: string }>>(`/departments/${deptId}/courses`);
          if (courses.data.length > 0) courseId = courses.data[0].id;
        } catch { /* no courses */ }
        if (!courseId) {
          const course = await apiPost<{ id: string }>(`/departments/${deptId}/courses`, {
            code: data.subject?.slice(0, 10) ?? 'EXAM101',
            title: data.subject ?? 'General',
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
