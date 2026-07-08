import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import * as resultsRepo from "./results.repository";
import type { PaginationQuery, EvaluateResultBody } from "./results.schemas";
import { HttpError } from "../../shared/errors/http-error";

type SessionWithExam = {
  examId: string;
  attemptNo: number;
  exam: { id: string; title: string; passMarks: number; totalMarks: number } | null;
  student: { userId: string; studentNumber: string } | null;
};

type ResultWithSession = {
  id: string;
  sessionId: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: { toNumber: () => number };
  passed: boolean;
  grade: string | null;
  remarks: string | null;
  breakdown: unknown;
  evaluatedAt: Date;
  createdAt: Date;
  session: SessionWithExam;
};

function formatResult(r: ResultWithSession) {
  return {
    id: r.id,
    sessionId: r.sessionId,
    obtainedMarks: r.obtainedMarks,
    maxMarks: r.maxMarks,
    percentage: r.percentage.toNumber(),
    passed: r.passed,
    grade: r.grade,
    remarks: r.remarks,
    breakdown: r.breakdown,
    evaluatedAt: r.evaluatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    session: r.session ? {
      examId: r.session.examId,
      attemptNo: r.session.attemptNo,
      exam: r.session.exam ? { title: r.session.exam.title } : null,
    } : null,
  };
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 30) return "D";
  return "F";
}

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

function generateVerificationCode(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

export async function listResults(app: FastifyInstance, query: PaginationQuery) {
  return resultsRepo.findResults(app, query);
}

export async function getResult(app: FastifyInstance, id: string) {
  const result = await resultsRepo.findResultById(app, id);
  if (!result) {
    throw new HttpError(404, "Result not found");
  }
  return formatResult(result as ResultWithSession);
}

export async function evaluateResult(
  app: FastifyInstance,
  sessionId: string,
  data: EvaluateResultBody,
  evaluatedByUserId: string,
) {
  const existing = await app.prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: { select: { id: true, totalMarks: true, passMarks: true } },
      answers: { select: { isCorrect: true, marksAwarded: true } },
    },
  });

  if (!existing) {
    throw new HttpError(404, "Exam session not found");
  }

  if (existing.status !== "SUBMITTED" && existing.status !== "AUTO_SUBMITTED") {
    throw new HttpError(400, "Session must be submitted before evaluation");
  }

  const exam = existing.exam;
  if (!exam) {
    throw new HttpError(404, "Associated exam not found");
  }

  let obtainedMarks = 0;
  const totalMarks = exam.totalMarks;

  for (const answer of existing.answers) {
    if (answer.marksAwarded !== null && answer.marksAwarded !== undefined) {
      obtainedMarks += answer.marksAwarded;
    } else if (answer.isCorrect === true) {
      obtainedMarks += 1;
    }
  }

  obtainedMarks = Math.min(obtainedMarks, totalMarks);
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;
  const passed = obtainedMarks >= exam.passMarks;
  const grade = calculateGrade(percentage);

  const breakdown: Record<string, unknown> = {
    totalQuestions: existing.answers.length,
    correctAnswers: existing.answers.filter((a: { isCorrect: boolean | null }) => a.isCorrect === true).length,
    obtainedMarks,
    totalMarks,
    passMarks: exam.passMarks,
  };

  const result = await resultsRepo.evaluateResult(app, sessionId, {
    obtainedMarks,
    maxMarks: totalMarks,
    percentage,
    passed,
    grade,
    remarks: data.remarks,
    breakdown,
    evaluatedByUserId,
  });

  await app.prisma.examSession.update({
    where: { id: sessionId },
    data: { status: "EVALUATED", evaluatedAt: new Date() },
  });

  return formatResult(result as ResultWithSession);
}

export async function issueCertificate(
  app: FastifyInstance,
  resultId: string,
  issuerUserId: string,
) {
  const result = await resultsRepo.findResultById(app, resultId);
  if (!result) {
    throw new HttpError(404, "Result not found");
  }

  if (!result.passed) {
    throw new HttpError(400, "Cannot issue certificate for a failed result");
  }

  const existingCert = await resultsRepo.getCertificate(app, resultId);
  if (existingCert) {
    throw new HttpError(409, "Certificate already issued for this result");
  }

  const certificateNumber = generateCertificateNumber();
  const verificationCode = generateVerificationCode();

  const certificate = await resultsRepo.issueCertificate(
    app,
    resultId,
    certificateNumber,
    verificationCode,
    issuerUserId,
  );

  return {
    id: certificate.id,
    resultId: certificate.resultId,
    certificateNumber: certificate.certificateNumber,
    verificationCode: certificate.verificationCode,
    issuedAt: certificate.issuedAt.toISOString(),
    status: certificate.status,
    pdfUrl: certificate.pdfUrl,
  };
}

export async function getCertificate(app: FastifyInstance, resultId: string) {
  const certificate = await resultsRepo.getCertificate(app, resultId);
  if (!certificate) {
    throw new HttpError(404, "Certificate not found");
  }

  return {
    id: certificate.id,
    resultId: certificate.resultId,
    certificateNumber: certificate.certificateNumber,
    verificationCode: certificate.verificationCode,
    issuedAt: certificate.issuedAt.toISOString(),
    status: certificate.status,
    pdfUrl: certificate.pdfUrl,
  };
}

export async function getStudentResults(app: FastifyInstance, studentUserId: string) {
  const results = await resultsRepo.getStudentResults(app, studentUserId);
  return results.map((r: ResultWithSession) => formatResult(r));
}

export async function getExamResults(app: FastifyInstance, examId: string) {
  const results = await resultsRepo.getExamResults(app, examId);
  return results.map((r: ResultWithSession) => formatResult(r));
}
