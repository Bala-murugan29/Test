import { Exam, StudentExam, Question } from '../types';
import { exams, studentExams, getExamById } from '../data/mock-exams';
import { getQuestionsByExamId } from '../data/mock-questions';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const examService = {
  getStudentExams: async (_studentId: string): Promise<StudentExam[]> => {
    await delay(400);
    return studentExams;
  },

  getExamById: async (examId: string): Promise<Exam> => {
    await delay(300);
    const exam = getExamById(examId);
    if (!exam) throw new Error(`Exam with id "${examId}" not found.`);
    return exam;
  },

  getExamQuestions: async (examId: string): Promise<Question[]> => {
    await delay(500);
    return getQuestionsByExamId(examId);
  },

  getFacultyExams: async (facultyId: string): Promise<Exam[]> => {
    await delay(400);
    return exams.filter((e) => e.facultyId === facultyId);
  },

  getAllExams: async (): Promise<Exam[]> => {
    await delay(400);
    return exams;
  },

  createExam: async (data: Partial<Exam>): Promise<Exam> => {
    await delay(600);
    const newExam: Exam = {
      id: `exam${String(Date.now()).slice(-4)}`,
      title: data.title ?? 'New Exam',
      subject: data.subject ?? '',
      department: data.department ?? '',
      facultyId: data.facultyId ?? 'f001',
      facultyName: data.facultyName ?? 'Dr. Priya Mehta',
      totalMarks: data.totalMarks ?? 100,
      passingMarks: data.passingMarks ?? 40,
      durationMinutes: data.durationMinutes ?? 60,
      totalQuestions: data.totalQuestions ?? 50,
      status: 'draft',
      scheduledAt: data.scheduledAt ?? new Date().toISOString(),
      endsAt: data.endsAt ?? new Date().toISOString(),
      instructions: data.instructions ?? [],
      allowedAttempts: data.allowedAttempts ?? 1,
    };
    return newExam;
  },

  updateExam: async (examId: string, data: Partial<Exam>): Promise<Exam> => {
    await delay(500);
    const exam = getExamById(examId);
    if (!exam) throw new Error(`Exam "${examId}" not found.`);
    return { ...exam, ...data };
  },

  publishExam: async (examId: string): Promise<Exam> => {
    await delay(500);
    const exam = getExamById(examId);
    if (!exam) throw new Error(`Exam "${examId}" not found.`);
    return { ...exam, status: 'published' };
  },
};
