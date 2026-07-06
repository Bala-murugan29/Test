import { apiGet } from '@/lib/axios';
import type { DepartmentStats, MonthlyStats, ExamPerformance } from '@/types';

/* ---------- backend shapes ---------- */

interface BackendSummary {
  totalStudents: number;
  totalFaculty: number;
  totalExams: number;
  avgPassRate: number;
  activeExams: number;
  examsConductedThisMonth: number;
}

interface BackendDeptStats {
  departmentId: string;
  departmentName: string;
  totalStudents: number;
  avgScore: number;
  passRate: number;
}

interface BackendExamPerf {
  examId: string;
  examTitle: string;
  avgScore: number;
  passRate: number;
  totalAppeared: number;
}

interface BackendMonthly {
  month: string;
  examsCreated: number;
  studentsAppeared: number;
  avgScore: number;
}

/* ---------- public service ---------- */

export interface PlatformSummary {
  totalStudents: number;
  totalFaculty: number;
  totalExams: number;
  avgPassRate: number;
  activeExams: number;
  examsConductedThisMonth: number;
}

function mapSummary(s: BackendSummary): PlatformSummary {
  return {
    totalStudents: s.totalStudents,
    totalFaculty: s.totalFaculty,
    totalExams: s.totalExams,
    avgPassRate: Math.round(s.avgPassRate * 100) / 100,
    activeExams: s.activeExams,
    examsConductedThisMonth: s.examsConductedThisMonth,
  };
}

export const analyticsService = {
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const data = await apiGet<BackendDeptStats[]>('/analytics/departments');
      return data.map((d) => ({
        department: d.departmentName,
        totalStudents: d.totalStudents,
        avgScore: Math.round(d.avgScore * 100) / 100,
        passRate: Math.round(d.passRate * 100) / 100,
      }));
    } catch {
      return [];
    }
  },

  async getMonthlyStats(): Promise<MonthlyStats[]> {
    try {
      const data = await apiGet<BackendMonthly[]>('/analytics/monthly');
      return data.map((m) => ({
        month: m.month,
        examsCreated: m.examsCreated,
        studentsAppeared: m.studentsAppeared,
        avgScore: Math.round(m.avgScore * 100) / 100,
      }));
    } catch {
      return [];
    }
  },

  async getExamPerformance(): Promise<ExamPerformance[]> {
    try {
      const data = await apiGet<BackendExamPerf[]>('/analytics/exams');
      return data.map((e) => ({
        examTitle: e.examTitle,
        avgScore: Math.round(e.avgScore * 100) / 100,
        passRate: Math.round(e.passRate * 100) / 100,
        totalAppeared: e.totalAppeared,
      }));
    } catch {
      return [];
    }
  },

  async getPlatformSummary(): Promise<PlatformSummary> {
    try {
      const data = await apiGet<BackendSummary>('/analytics/summary');
      return mapSummary(data);
    } catch {
      return {
        totalStudents: 0,
        totalFaculty: 0,
        totalExams: 0,
        avgPassRate: 0,
        activeExams: 0,
        examsConductedThisMonth: 0,
      };
    }
  },
};
