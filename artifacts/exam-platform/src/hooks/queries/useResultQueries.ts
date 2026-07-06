import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultService } from '@/services/result.service';
import type { ExamResult } from '@/types';
import { notifyError, notifySuccess } from './mutation-helpers';

export const resultKeys = {
  all: ['results'] as const,
  student: (studentId: string) => ['results', 'student', studentId] as const,
  exam: (examId: string) => ['results', 'exam', examId] as const,
  detail: (resultId: string) => ['results', 'detail', resultId] as const,
};

export function useStudentResults(studentId: string | undefined) {
  return useQuery<ExamResult[]>({
    queryKey: resultKeys.student(studentId ?? ''),
    queryFn: () => resultService.getStudentResults(studentId!),
    enabled: !!studentId,
  });
}

export function useExamResults(examId: string | undefined) {
  return useQuery<ExamResult[]>({
    queryKey: resultKeys.exam(examId ?? ''),
    queryFn: () => resultService.getExamResults(examId!),
    enabled: !!examId,
  });
}

export function useResult(resultId: string | undefined) {
  return useQuery<ExamResult | null>({
    queryKey: resultKeys.detail(resultId ?? ''),
    queryFn: () => resultService.getResultById(resultId!),
    enabled: !!resultId,
  });
}

export function useSubmitExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      studentId,
      answers,
    }: {
      examId: string;
      studentId: string;
      answers: Record<string, string>;
    }) => resultService.submitExam(examId, studentId, answers),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: resultKeys.all });
      qc.invalidateQueries({ queryKey: ['exams', 'student', variables.studentId] });
      notifySuccess('Exam submitted', 'Your answers have been submitted successfully.');
    },
    onError: (err) => notifyError(err, 'Failed to submit exam'),
  });
}
