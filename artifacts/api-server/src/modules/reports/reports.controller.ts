import type { FastifyRequest, FastifyReply } from "fastify";
import { exportQuerySchema } from "./reports.schemas";
import * as reportsService from "./reports.service";

export async function getExamReportController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { examId } = request.params as { examId: string };
  const result = await reportsService.generateExamReport(request.server, examId);
  return reply.code(200).send(result);
}

export async function getStudentReportController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { studentUserId } = request.params as { studentUserId: string };
  const result = await reportsService.generateStudentReport(
    request.server,
    studentUserId,
  );
  return reply.code(200).send(result);
}

export async function getDepartmentReportController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { departmentId } = request.params as { departmentId: string };
  const result = await reportsService.generateDepartmentReport(
    request.server,
    departmentId,
  );
  return reply.code(200).send(result);
}

export async function exportExamResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { examId } = request.params as { examId: string };
  const query = exportQuerySchema.parse(request.query);

  const results = await reportsService.generateExamReport(request.server, examId);

  const rows = results.questionWiseAnalysis.map(
    (q: {
      questionId: string;
      title: string;
      type: string;
      totalAttempts: number;
      correctAttempts: number;
      avgMarks: number;
      maxMarks: number;
      correctRate: number;
    }) => ({
      questionId: q.questionId,
      title: q.title,
      type: q.type,
      totalAttempts: q.totalAttempts,
      correctAttempts: q.correctAttempts,
      avgMarks: q.avgMarks,
      maxMarks: q.maxMarks,
      correctRate: q.correctRate,
    }),
  );

  const headers = [
    "questionId",
    "title",
    "type",
    "totalAttempts",
    "correctAttempts",
    "avgMarks",
    "maxMarks",
    "correctRate",
  ];

  const csv = await reportsService.exportToCsv(rows, headers);

  return reply
    .code(200)
    .header("Content-Type", "text/csv")
    .header("Content-Disposition", `attachment; filename="exam-${examId}-report.csv"`)
    .send(csv);
}

export async function exportStudentResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { studentUserId } = request.params as { studentUserId: string };
  const query = exportQuerySchema.parse(request.query);

  const report = await reportsService.generateStudentReport(
    request.server,
    studentUserId,
  );

  const rows = report.results.map(
    (r: {
      examId: string;
      examTitle: string;
      obtainedMarks: number;
      maxMarks: number;
      percentage: number;
      passed: boolean;
      grade: string | null;
      attemptedAt: string;
    }) => ({
      examId: r.examId,
      examTitle: r.examTitle,
      obtainedMarks: r.obtainedMarks,
      maxMarks: r.maxMarks,
      percentage: r.percentage,
      passed: r.passed,
      grade: r.grade ?? "",
      attemptedAt: r.attemptedAt,
    }),
  );

  const headers = [
    "examId",
    "examTitle",
    "obtainedMarks",
    "maxMarks",
    "percentage",
    "passed",
    "grade",
    "attemptedAt",
  ];

  const csv = await reportsService.exportToCsv(rows, headers);

  return reply
    .code(200)
    .header("Content-Type", "text/csv")
    .header(
      "Content-Disposition",
      `attachment; filename="student-${studentUserId}-results.csv"`,
    )
    .send(csv);
}
