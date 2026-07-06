import type { FastifyInstance } from "fastify";

export async function findExpiredSessions(app: FastifyInstance) {
  const now = new Date();
  return app.prisma.examSession.findMany({
    where: {
      expiresAt: { lt: now },
      status: { in: ["CREATED", "IN_PROGRESS"] },
    },
    include: { exam: true },
  });
}

export async function autoSubmitSession(app: FastifyInstance, sessionId: string) {
  return app.prisma.examSession.update({
    where: { id: sessionId },
    data: {
      status: "AUTO_SUBMITTED",
      autoSubmittedAt: new Date(),
    },
  });
}

export async function createResultForSession(
  app: FastifyInstance,
  sessionId: string,
  obtainedMarks: number,
  maxMarks: number,
  percentage: number,
  passed: boolean,
) {
  return app.prisma.result.create({
    data: {
      sessionId,
      obtainedMarks,
      maxMarks,
      percentage,
      passed,
      evaluatedAt: new Date(),
    },
  });
}
