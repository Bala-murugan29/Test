import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '@/services/question.service';
import { notifyError, notifySuccess } from './mutation-helpers';

export const questionKeys = {
  all: ['questions'] as const,
  list: (params?: Record<string, string | number>) => ['questions', 'list', params ?? {}] as const,
  detail: (id: string) => ['questions', 'detail', id] as const,
};

export function useQuestions(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: questionKeys.list(params),
    queryFn: () => questionService.getAll(params),
  });
}

export function useCreateMcq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: questionService.createMcq,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
      notifySuccess('Question created');
    },
    onError: (err) => notifyError(err, 'Failed to create question'),
  });
}

export function useCreateCodingQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: questionService.createCoding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
      notifySuccess('Coding question created');
    },
    onError: (err) => notifyError(err, 'Failed to create question'),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionKeys.all });
      notifySuccess('Question deleted');
    },
    onError: (err) => notifyError(err, 'Failed to delete question'),
  });
}
