import type { FastifyInstance } from "fastify";
import type { PaginationQuery, EvaluateResultBody } from "./results.schemas";

export async function findResults(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, examId, studentUserId, passed } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (examId || studentUserId) {
    const sessionFilter: Record<string, unknown> = {};
    if (examId) sessionFilter.examId = examId;
    if (studentUserId) sessionFilter.studentUserId = studentUserId;
    where.session = sessionFilter;
  }

  if (passed !== undefined) {
    where.passed = passed;
  }

  const [results, total] = await Promise.all([
    app.prisma.result.findMany({
      where,
      include: {
        session: {
          include: {
            exam: { select: { id: true, title: true } },
            student: { select: { userId: true, studentNumber: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.result.count({ where }),
  ]);

  return {
    data: results.map((r: {
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
      session: {
        exam: { id: string; title: string } | null;
        student: { userId: string; studentNumber: string } | null;
      };
    }) => ({
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
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findResultById(app: FastifyInstance, id: string) {
  return app.prisma.result.findUnique({
    where: { id },
    include: {
      session: {
        include: {
          exam: true,
          student: true,
          answers: true,
        },
      },
      evaluatedBy: { select: { id: true, fullName: true } },
      certificate: true,
    },
  });
}

export async function findResultBySessionId(app: FastifyInstance, sessionId: string) {
  return app.prisma.result.findUnique({
    where: { sessionId },
    include: {
      session: {
        include: {
          exam: true,
          student: true,
        },
      },
    },
  });
}

export async function evaluateResult(
  app: FastifyInstance,
  sessionId: string,
  data: {
    obtainedMarks: number;
    maxMarks: number;
    percentage: number;
    passed: boolean;
    grade: string | null;
    remarks?: string;
    breakdown?: unknown;
    evaluatedByUserId?: string;
  },
) {
  return app.prisma.result.upsert({
    where: { sessionId },
    create: {
      sessionId,
      obtainedMarks: data.obtainedMarks,
      maxMarks: data.maxMarks,
      percentage: data.percentage,
      passed: data.passed,
      grade: data.grade,
      remarks: data.remarks,
      breakdown: data.breakdown ?? undefined,
      evaluatedByUserId: data.evaluatedByUserId,
    },
    update: {
      obtainedMarks: data.obtainedMarks,
      maxMarks: data.maxMarks,
      percentage: data.percentage,
      passed: data.passed,
      grade: data.grade,
      remarks: data.remarks,
      breakdown: data.breakdown ?? undefined,
      evaluatedByUserId: data.evaluatedByUserId,
      evaluatedAt: new Date(),
    },
    include: {
      session: {
        include: {
          exam: { select: { id: true, title: true } },
          student: { select: { userId: true, studentNumber: true } },
        },
      },
    },
  });
}

export async function issueCertificate(
  app: FastifyInstance,
  resultId: string,
  certificateNumber: string,
  verificationCode: string,
  issuerUserId?: string,
) {
  return app.prisma.certificate.create({
    data: {
      resultId,
      certificateNumber,
      verificationCode,
      issuerUserId,
    },
    include: {
      result: true,
    },
  });
}

export async function getCertificate(app: FastifyInstance, resultId: string) {
  return app.prisma.certificate.findUnique({
    where: { resultId },
    include: {
      result: {
        include: {
          session: {
            include: {
              exam: { select: { id: true, title: true } },
              student: { select: { userId: true, studentNumber: true } },
            },
          },
        },
      },
    },
  });
}

export async function getStudentResults(app: FastifyInstance, studentUserId: string) {
  return app.prisma.result.findMany({
    where: {
      session: { studentUserId },
    },
    include: {
      session: {
        include: {
          exam: { select: { id: true, title: true } },
          student: { select: { userId: true, studentNumber: true } },
        },
      },
      certificate: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExamResults(app: FastifyInstance, examId: string) {
  return app.prisma.result.findMany({
    where: {
      session: { examId },
    },
    include: {
      session: {
        include: {
          exam: { select: { id: true, title: true } },
          student: { select: { userId: true, studentNumber: true } },
        },
      },
      certificate: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
