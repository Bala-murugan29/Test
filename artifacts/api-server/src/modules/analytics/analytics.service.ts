import type { FastifyInstance } from "fastify";
import * as analyticsRepo from "./analytics.repository";
import type {
  SummaryResponse,
  DepartmentStatsItem,
  ExamPerformanceItem,
  MonthlyStatsItem,
  StudentPerformance,
} from "./analytics.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function getSummary(app: FastifyInstance): Promise<SummaryResponse> {
  return analyticsRepo.getSummary(app) as Promise<SummaryResponse>;
}

export async function getDepartmentStats(app: FastifyInstance): Promise<DepartmentStatsItem[]> {
  return analyticsRepo.getDepartmentStats(app) as Promise<DepartmentStatsItem[]>;
}

export async function getExamPerformance(app: FastifyInstance): Promise<ExamPerformanceItem[]> {
  return analyticsRepo.getExamPerformance(app) as Promise<ExamPerformanceItem[]>;
}

export async function getMonthlyStats(app: FastifyInstance, year: number): Promise<MonthlyStatsItem[]> {
  return analyticsRepo.getMonthlyStats(app, year) as Promise<MonthlyStatsItem[]>;
}

export async function getStudentPerformance(
  app: FastifyInstance,
  studentUserId: string,
): Promise<StudentPerformance> {
  const student = await app.prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) {
    throw new HttpError(404, "Student profile not found");
  }

  return analyticsRepo.getStudentPerformance(app, studentUserId) as Promise<StudentPerformance>;
}

export async function getExamAnalytics(app: FastifyInstance, examId: string) {
  const result = await analyticsRepo.getExamAnalytics(app, examId);
  if (!result) {
    throw new HttpError(404, "Exam not found");
  }
  return result;
}
