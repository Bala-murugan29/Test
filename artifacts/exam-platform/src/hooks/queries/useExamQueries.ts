import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examService } from '@/services/exam.service';
import type { Exam, StudentExam, Question } from '@/types';
import { notifyError, notifySuccess } from './mutation-helpers';

/* ---------- query keys ---------- */
export const examKeys = {
  all: ['exams'] as const,
  student: (studentId: string) => ['exams', 'student', studentId] as const,
  detail: (examId: string) => ['exams', 'detail', examId] as const,
  questions: (examId: string) => ['exams', 'questions', examId] as const,
  faculty: (facultyId: string) => ['exams', 'faculty', facultyId] as const,
  list: () => ['exams', 'list'] as const,
};

/* ---------- queries ---------- */

export function useStudentExams(studentId: string | undefined) {
  return useQuery<StudentExam[]>({
    queryKey: examKeys.student(studentId ?? ''),
    queryFn: () => examService.getStudentExams(studentId!),
    enabled: !!studentId,
  });
}

export function useExam(examId: string | undefined) {
  return useQuery<Exam | null>({
    queryKey: examKeys.detail(examId ?? ''),
    queryFn: () => examService.getExamById(examId!),
    enabled: !!examId,
  });
}

export function useExamQuestions(examId: string | undefined) {
  return useQuery<Question[]>({
    queryKey: examKeys.questions(examId ?? ''),
    queryFn: () => examService.getExamQuestions(examId!),
    enabled: !!examId,
  });
}

export function useFacultyExams(facultyId: string | undefined) {
  return useQuery<Exam[]>({
    queryKey: examKeys.faculty(facultyId ?? ''),
    queryFn: () => examService.getFacultyExams(facultyId!),
    enabled: !!facultyId,
  });
}

export function useAllExams() {
  return useQuery<Exam[]>({
    queryKey: examKeys.list(),
    queryFn: () => examService.getAllExams(),
  });
}

/* ---------- mutations ---------- */

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Exam>) => examService.createExam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      notifySuccess('Exam created', 'The exam has been created successfully.');
    },
    onError: (err) => notifyError(err, 'Failed to create exam'),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: Partial<Exam> }) =>
      examService.updateExam(examId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      notifySuccess('Exam updated');
    },
    onError: (err) => notifyError(err, 'Failed to update exam'),
  });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => examService.publishExam(examId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      notifySuccess('Exam published', 'The exam is now available to students.');
    },
    onError: (err) => notifyError(err, 'Failed to publish exam'),
  });
}
