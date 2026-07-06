import type { FastifyInstance } from "fastify";
import * as autosubmitRepo from "./autosubmit.repository";
import { HttpError } from "../../shared/errors/http-error";

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
      (s: { id: string; examId: string; studentUserId: string; expiresAt: Date }) => ({
        id: s.id,
        examId: s.examId,
        studentUserId: s.studentUserId,
        expiresAt: s.expiresAt.toISOString(),
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

  const maxMarks = session.exam.totalMarks;
  const obtainedMarks = 0;
  const percentage = 0;
  const passed = session.exam.passMarks <= 0;

  const updatedSession = await autosubmitRepo.autoSubmitSession(app, sessionId);
  const result = await autosubmitRepo.createResultForSession(
    app,
    sessionId,
    obtainedMarks,
    maxMarks,
    percentage,
    passed,
  );

  return {
    sessionId: updatedSession.id,
    autoSubmittedAt: updatedSession.autoSubmittedAt!.toISOString(),
    resultId: result.id,
  };
}

export async function autoSubmitExpiredSessions(app: FastifyInstance) {
  const sessions = await autosubmitRepo.findExpiredSessions(app);
  const results: Array<{ sessionId: string; autoSubmittedAt: string; resultId: string }> = [];

  for (const session of sessions as ExamSessionWithExam[]) {
    const maxMarks = session.exam.totalMarks;
    const obtainedMarks = 0;
    const percentage = 0;
    const passed = session.exam.passMarks <= 0;

    const updatedSession = await autosubmitRepo.autoSubmitSession(app, session.id);
    const result = await autosubmitRepo.createResultForSession(
      app,
      session.id,
      obtainedMarks,
      maxMarks,
      percentage,
      passed,
    );

    results.push({
      sessionId: updatedSession.id,
      autoSubmittedAt: updatedSession.autoSubmittedAt!.toISOString(),
      resultId: result.id,
    });
  }

  return results;
}
