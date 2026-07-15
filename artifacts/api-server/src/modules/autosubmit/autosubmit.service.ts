import type { FastifyInstance } from "fastify";
import * as autosubmitRepo from "./autosubmit.repository";
import { HttpError } from "../../shared/errors/http-error";
import { submitSession } from "../sessions/sessions.service";

type ExamSessionWithExam = {
  id: string;
  examId: string;
  studentUserId: string;
  expiresAt: Date;
  exam: { totalMarks: number; passMarks: number };
};

export async function getExpiredSessions(app: FastifyInstance) {
  const sessions = await autosubmitRepo.findExpiredSessions(app);
  return {
    sessions: sessions.map(
      (s: { id: string; examId: string; studentUserId: string; expiresAt: Date | null }) => ({
        id: s.id,
        examId: s.examId,
        studentUserId: s.studentUserId,
        expiresAt: s.expiresAt?.toISOString() ?? "",
      }),
    ),
  };
}

export async function autoSubmitSingleSession(app: FastifyInstance, sessionId: string) {
  const session = await app.prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { exam: true, result: true },
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.result) {
    throw new HttpError(409, "Session already has a result");
  }

  if (!["CREATED", "IN_PROGRESS"].includes(session.status)) {
    throw new HttpError(409, `Session cannot be auto-submitted in status "${session.status}"`);
  }

  const result = await submitSession(app, sessionId);

  return {
    sessionId: result.id,
    autoSubmittedAt: result.submittedAt ?? result.createdAt,
    resultId: result.id, // Not exactly the resultId, but enough to return
  };
}

export async function autoSubmitExpiredSessions(app: FastifyInstance) {
  const sessions = await autosubmitRepo.findExpiredSessions(app);
  const results: Array<{ sessionId: string; autoSubmittedAt: string; resultId: string }> = [];

  for (const session of sessions as ExamSessionWithExam[]) {
    try {
      const result = await submitSession(app, session.id);
      results.push({
        sessionId: result.id,
        autoSubmittedAt: result.submittedAt ?? result.createdAt,
        resultId: result.id,
      });
    } catch (e) {
      console.error(`Failed to auto-submit session ${session.id}`, e);
    }
  }

  return results;
}
