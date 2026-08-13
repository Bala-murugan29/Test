import type { FastifyRequest, FastifyReply } from "fastify";
import { exportQuerySchema } from "./reports.schemas";
import * as reportsService from "./reports.service";
import * as reportsRepo from "./reports.repository";
import { HttpError } from "../../shared/errors/http-error";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

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
  exportQuerySchema.parse(request.query);

  const sessions = await reportsRepo.exportExamResults(request.server, examId);
  if (sessions.length === 0) {
    throw new HttpError(404, "Exam not found");
  }

  const evaluatedSessions = sessions
    .filter((session) => session.result !== null)
    .sort(
      (a, b) =>
        toNumber(b.result!.percentage) - toNumber(a.result!.percentage),
    );

  const rows = evaluatedSessions.map((session, index) => ({
    rank: index + 1,
    studentId: session.user.id,
    studentName: session.user.fullName,
    email: session.user.email,
    obtainedMarks: session.result!.obtainedMarks,
    maxMarks: session.result!.maxMarks,
    percentage: toNumber(session.result!.percentage),
    status: session.result!.passed ? "Passed" : "Failed",
    grade: session.result!.grade ?? "",
    submittedAt: session.result!.evaluatedAt.toISOString(),
  }));

  const headers = [
    "rank",
    "studentId",
    "studentName",
    "email",
    "obtainedMarks",
    "maxMarks",
    "percentage",
    "status",
    "grade",
    "submittedAt",
  ];

  const csv = await reportsService.exportToCsv(rows, headers);
  const examTitle = sessions[0]?.exam?.title ?? "exam";
  const safeTitle = examTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return reply
    .code(200)
    .header("Content-Type", "text/csv; charset=utf-8")
    .header(
      "Content-Disposition",
      `attachment; filename="${safeTitle || "exam"}-results.csv"`,
    )
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
