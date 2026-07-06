import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/department.service';
import { notifyError, notifySuccess } from './mutation-helpers';

export const departmentKeys = {
  all: ['departments'] as const,
  list: () => ['departments', 'list'] as const,
  stats: () => ['departments', 'stats'] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentService.getAll(),
  });
}

export function useDepartmentStats() {
  return useQuery({
    queryKey: departmentKeys.stats(),
    queryFn: () => departmentService.getStatsAll(),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string }) =>
      departmentService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      notifySuccess('Department created');
    },
    onError: (err) => notifyError(err, 'Failed to create department'),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      departmentService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      notifySuccess('Department updated');
    },
    onError: (err) => notifyError(err, 'Failed to update department'),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      notifySuccess('Department deleted');
    },
    onError: (err) => notifyError(err, 'Failed to delete department'),
  });
}
