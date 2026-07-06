import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import type { MockUser } from '@/types';
import { notifyError, notifySuccess } from './mutation-helpers';

export const userKeys = {
  all: ['users'] as const,
  students: () => ['users', 'students'] as const,
  faculty: () => ['users', 'faculty'] as const,
  list: () => ['users', 'all'] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function useAllStudents() {
  return useQuery<MockUser[]>({
    queryKey: userKeys.students(),
    queryFn: () => userService.getAllStudents(),
  });
}

export function useAllFaculty() {
  return useQuery<MockUser[]>({
    queryKey: userKeys.faculty(),
    queryFn: () => userService.getAllFaculty(),
  });
}

export function useAllUsers() {
  return useQuery<MockUser[]>({
    queryKey: userKeys.list(),
    queryFn: () => userService.getAllUsers(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MockUser>) => userService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      notifySuccess('User created', 'The account has been created successfully.');
    },
    onError: (err) => notifyError(err, 'Failed to create user'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MockUser> }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      notifySuccess('User updated');
    },
    onError: (err) => notifyError(err, 'Failed to update user'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      notifySuccess('User deleted', 'The account has been removed.');
    },
    onError: (err) => notifyError(err, 'Failed to delete user'),
  });
}
