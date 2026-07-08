import type { FastifyInstance } from "fastify";
import type { SaveAnswerBody } from "./autosave.schemas";

type AnswerData = Omit<SaveAnswerBody, "questionId">;

export async function findSessionForSave(
  app: FastifyInstance,
  sessionId: string,
  studentUserId: string,
) {
  return app.prisma.examSession.findFirst({
    where: {
      id: sessionId,
      studentUserId,
      status: { in: ["CREATED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
}

export async function upsertAnswer(
  app: FastifyInstance,
  sessionId: string,
  questionId: string,
  data: AnswerData,
) {
  return app.prisma.studentAnswer.upsert({
    where: {
      sessionId_questionId: { sessionId, questionId },
    },
    create: {
      sessionId,
      questionId,
      answerText: data.answerText ?? null,
      selectedOptionIndex: data.selectedOptionIndex ?? null,
      codeAnswer: data.codeAnswer ?? null,
      answerPayload: data.answerPayload ?? undefined,
    },
    update: {
      answerText: data.answerText ?? undefined,
      selectedOptionIndex: data.selectedOptionIndex ?? undefined,
      codeAnswer: data.codeAnswer ?? undefined,
      answerPayload: data.answerPayload ?? undefined,
      submittedAt: new Date(),
    },
  });
}

export async function upsertMultipleAnswers(
  app: FastifyInstance,
  sessionId: string,
  answers: Array<{ questionId: string } & AnswerData>,
) {
  const results = await Promise.all(
    answers.map(
      (a: { questionId: string } & AnswerData) =>
        upsertAnswer(app, sessionId, a.questionId, a),
    ),
  );
  return results;
}

export async function getSessionAnswers(
  app: FastifyInstance,
  sessionId: string,
) {
  return app.prisma.studentAnswer.findMany({
    where: { sessionId },
    orderBy: { submittedAt: "desc" },
  });
}
