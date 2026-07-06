import type { FastifyInstance } from "fastify";

export async function createCodeRun(
  app: FastifyInstance,
  data: {
    userId: string;
    sessionId?: string;
    questionId?: string;
    language: string;
    sourceCode: string;
    stdin?: string;
    stdout?: string;
    stderr?: string;
    status: string;
    executionTimeMs?: number;
  },
) {
  return app.prisma.codeRun.create({ data });
}
