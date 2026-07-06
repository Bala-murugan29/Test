import type { FastifyRequest, FastifyReply } from "fastify";
import {
  summaryResponseSchema,
  departmentStatsItemSchema,
  examPerformanceItemSchema,
  monthlyStatsItemSchema,
  studentPerformanceSchema,
} from "./analytics.schemas";
import * as analyticsService from "./analytics.service";

export async function getSummaryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await analyticsService.getSummary(request.server);
  const payload = summaryResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getDepartmentStatsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await analyticsService.getDepartmentStats(request.server);
  const payload = result.map((item: {
    departmentId: string;
    departmentName: string;
    totalStudents: number;
    avgScore: number;
    passRate: number;
  }) => departmentStatsItemSchema.parse(item));
  return reply.code(200).send(payload);
}

export async function getExamPerformanceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await analyticsService.getExamPerformance(request.server);
  const payload = result.map((item: {
    examId: string;
    examTitle: string;
    avgScore: number;
    passRate: number;
    totalAppeared: number;
  }) => examPerformanceItemSchema.parse(item));
  return reply.code(200).send(payload);
}

export async function getMonthlyStatsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { year } = request.query as { year?: string };
  const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const result = await analyticsService.getMonthlyStats(request.server, targetYear);
  const payload = result.map((item: {
    month: string;
    examsCreated: number;
    studentsAppeared: number;
    avgScore: number;
  }) => monthlyStatsItemSchema.parse(item));
  return reply.code(200).send(payload);
}

export async function getStudentPerformanceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { studentUserId } = request.params as { studentUserId: string };
  const result = await analyticsService.getStudentPerformance(request.server, studentUserId);
  const payload = studentPerformanceSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getExamAnalyticsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { examId } = request.params as { examId: string };
  const result = await analyticsService.getExamAnalytics(request.server, examId);
  return reply.code(200).send(result);
}
