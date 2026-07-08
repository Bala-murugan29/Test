import type { FastifyInstance } from "fastify";

export async function findSessionById(app: FastifyInstance, id: string) {
  return app.prisma.examSession.findUnique({
    where: { id },
    include: {
      exam: true,
      answers: true,
    },
  });
}

export async function findSessionByExamAndStudent(
  app: FastifyInstance,
  examId: string,
  studentUserId: string,
) {
  return app.prisma.examSession.findFirst({
    where: { examId, studentUserId },
    orderBy: { attemptNo: "desc" },
  });
}

export async function findSessionsByExam(
  app: FastifyInstance,
  examId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    app.prisma.examSession.findMany({
      where: { examId },
      include: {
        student: { include: { user: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.examSession.count({ where: { examId } }),
  ]);

  return {
    data: sessions.map((s: {
      id: string;
      examId: string;
      studentUserId: string;
      attemptNo: number;
      status: string;
      startedAt: Date | null;
      submittedAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      student: { user: { fullName: string; email: string } };
    }) => ({
      id: s.id,
      examId: s.examId,
      studentUserId: s.studentUserId,
      attemptNo: s.attemptNo,
      status: s.status,
      startedAt: s.startedAt?.toISOString() ?? null,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      expiresAt: s.expiresAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      studentName: s.student.user.fullName,
      studentEmail: s.student.user.email,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createSession(
  app: FastifyInstance,
  examId: string,
  studentUserId: string,
  attemptNo: number,
  expiresAt: Date,
) {
  return app.prisma.examSession.create({
    data: {
      examId,
      studentUserId,
      attemptNo,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt,
    },
    include: { exam: true },
  });
}

export async function updateSessionStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  const data: Record<string, unknown> = { status };

  if (status === "IN_PROGRESS") {
    data.startedAt = new Date();
  } else if (status === "SUBMITTED" || status === "AUTO_SUBMITTED") {
    data.submittedAt = new Date();
  }

  return app.prisma.examSession.update({
    where: { id },
    data,
    include: { exam: true },
  });
}

export async function getSessionAnswers(app: FastifyInstance, sessionId: string) {
  return app.prisma.studentAnswer.findMany({
    where: { sessionId },
    include: { question: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function upsertAnswer(
  app: FastifyInstance,
  sessionId: string,
  questionId: string,
  answerData: {
    answerText?: string;
    selectedOptionIndex?: number;
    codeAnswer?: string;
  },
) {
  return app.prisma.studentAnswer.upsert({
    where: { sessionId_questionId: { sessionId, questionId } },
    create: {
      sessionId,
      questionId,
      ...answerData,
    },
    update: {
      ...answerData,
    },
  });
}

export async function getMaxAttemptNo(
  app: FastifyInstance,
  examId: string,
  studentUserId: string,
) {
  const result = await app.prisma.examSession.findFirst({
    where: { examId, studentUserId },
    orderBy: { attemptNo: "desc" },
    select: { attemptNo: true },
  });

  return result?.attemptNo ?? 0;
}
