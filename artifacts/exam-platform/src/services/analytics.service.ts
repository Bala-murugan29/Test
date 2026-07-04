import { DepartmentStats, MonthlyStats, ExamPerformance } from '../types';
import { departmentStats, monthlyStats, examPerformance, platformSummary } from '../data/mock-analytics';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PlatformSummary {
  totalStudents: number;
  totalFaculty: number;
  totalExams: number;
  avgPassRate: number;
  activeExams: number;
  examsConductedThisMonth: number;
}

export const analyticsService = {
  getDepartmentStats: async (): Promise<DepartmentStats[]> => {
    await delay(400);
    return departmentStats;
  },

  getMonthlyStats: async (): Promise<MonthlyStats[]> => {
    await delay(400);
    return monthlyStats;
  },

  getExamPerformance: async (): Promise<ExamPerformance[]> => {
    await delay(400);
    return examPerformance;
  },

  getPlatformSummary: async (): Promise<PlatformSummary> => {
    await delay(300);
    return platformSummary;
  },
};
