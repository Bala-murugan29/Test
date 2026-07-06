import { useQuery } from '@tanstack/react-query';
import { analyticsService, type PlatformSummary } from '@/services/analytics.service';
import type { DepartmentStats, MonthlyStats, ExamPerformance } from '@/types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => ['analytics', 'summary'] as const,
  departments: () => ['analytics', 'departments'] as const,
  monthly: () => ['analytics', 'monthly'] as const,
  exams: () => ['analytics', 'exams'] as const,
};

export function usePlatformSummary() {
  return useQuery<PlatformSummary>({
    queryKey: analyticsKeys.summary(),
    queryFn: () => analyticsService.getPlatformSummary(),
  });
}

export function useAnalyticsDepartmentStats() {
  return useQuery<DepartmentStats[]>({
    queryKey: analyticsKeys.departments(),
    queryFn: () => analyticsService.getDepartmentStats(),
  });
}

export function useMonthlyStats() {
  return useQuery<MonthlyStats[]>({
    queryKey: analyticsKeys.monthly(),
    queryFn: () => analyticsService.getMonthlyStats(),
  });
}

export function useExamPerformance() {
  return useQuery<ExamPerformance[]>({
    queryKey: analyticsKeys.exams(),
    queryFn: () => analyticsService.getExamPerformance(),
  });
}
