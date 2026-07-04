import { ExamResult, SubmissionAnswer } from '../types';
import { results, getResultsByStudentId, getResultsByExamId, getResultById } from '../data/mock-results';
import { getQuestionsByExamId } from '../data/mock-questions';
import { getExamById } from '../data/mock-exams';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const resultService = {
  submitExam: async (
    examId: string,
    studentId: string,
    answers: Record<string, string>
  ): Promise<ExamResult> => {
    await delay(800);
    const exam = getExamById(examId);
    const questions = getQuestionsByExamId(examId);

    if (!exam) throw new Error('Exam not found.');

    const answerRecords: SubmissionAnswer[] = questions.map((q) => {
      const selected = answers[q.id] ?? '';
      const isCorrect = selected !== '' && selected === q.correctOptionId;
      const marksAwarded = !selected ? 0 : isCorrect ? q.marks : -q.negativeMarks;
      return { questionId: q.id, selectedOptionId: selected, isCorrect, marksAwarded };
    });

    const obtainedMarks = Math.max(
      0,
      answerRecords.reduce((sum, a) => sum + a.marksAwarded, 0)
    );
    const percentage = exam.totalMarks > 0 ? (obtainedMarks / exam.totalMarks) * 100 : 0;

    const result: ExamResult = {
      id: `res${Date.now()}`,
      examId,
      studentId,
      studentName: 'Arjun Sharma',
      totalMarks: exam.totalMarks,
      obtainedMarks,
      percentage: Math.round(percentage * 10) / 10,
      isPassed: obtainedMarks >= exam.passingMarks,
      timeTakenMinutes: Math.floor(exam.durationMinutes * 0.8),
      submittedAt: new Date().toISOString(),
      rank: Math.floor(Math.random() * 30) + 1,
      totalStudents: 48,
      answers: answerRecords,
    };

    results.push(result);
    return result;
  },

  getStudentResults: async (studentId: string): Promise<ExamResult[]> => {
    await delay(400);
    return getResultsByStudentId(studentId);
  },

  getExamResults: async (examId: string): Promise<ExamResult[]> => {
    await delay(400);
    return getResultsByExamId(examId);
  },

  getResultById: async (resultId: string): Promise<ExamResult> => {
    await delay(300);
    const result = getResultById(resultId);
    if (!result) throw new Error(`Result "${resultId}" not found.`);
    return result;
  },
};
