import type { FastifyInstance } from "fastify";
import * as autosaveRepo from "./autosave.repository";
import type { SaveAnswerBody, SaveMultipleAnswersBody } from "./autosave.schemas";
import { HttpError } from "../../shared/errors/http-error";

function formatAnswer(answer: {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string | null;
  selectedOptionIndex: number | null;
  codeAnswer: string | null;
  answerPayload: unknown;
  submittedAt: Date;
}) {
  return {
    id: answer.id,
    sessionId: answer.sessionId,
    questionId: answer.questionId,
    answerText: answer.answerText,
    selectedOptionIndex: answer.selectedOptionIndex,
    codeAnswer: answer.codeAnswer,
    answerPayload: answer.answerPayload,
    submittedAt: answer.submittedAt.toISOString(),
  };
}

export async function saveAnswer(
  app: FastifyInstance,
  sessionId: string,
  studentUserId: string,
  data: SaveAnswerBody,
) {
  const session = await autosaveRepo.findSessionForSave(app, sessionId, studentUserId);
  if (!session) {
    throw new HttpError(403, "Session not found or not in progress");
  }

  const answer = await autosaveRepo.upsertAnswer(app, sessionId, data.questionId, {
    answerText: data.answerText,
    selectedOptionIndex: data.selectedOptionIndex,
    codeAnswer: data.codeAnswer,
    answerPayload: data.answerPayload,
  });

  return formatAnswer(answer);
}

export async function saveMultipleAnswers(
  app: FastifyInstance,
  sessionId: string,
  studentUserId: string,
  data: SaveMultipleAnswersBody,
) {
  const session = await autosaveRepo.findSessionForSave(app, sessionId, studentUserId);
  if (!session) {
    throw new HttpError(403, "Session not found or not in progress");
  }

  const answers = await autosaveRepo.upsertMultipleAnswers(app, sessionId, data.answers);
  return answers.map((a: {
    id: string;
    sessionId: string;
    questionId: string;
    answerText: string | null;
    selectedOptionIndex: number | null;
    codeAnswer: string | null;
    answerPayload: unknown;
    submittedAt: Date;
  }) => formatAnswer(a));
}

export async function getSavedAnswers(
  app: FastifyInstance,
  sessionId: string,
  studentUserId: string,
) {
  const session = await autosaveRepo.findSessionForSave(app, sessionId, studentUserId);
  if (!session) {
    throw new HttpError(403, "Session not found or not in progress");
  }

  const answers = await autosaveRepo.getSessionAnswers(app, sessionId);
  return answers.map((a: {
    id: string;
    sessionId: string;
    questionId: string;
    answerText: string | null;
    selectedOptionIndex: number | null;
    codeAnswer: string | null;
    answerPayload: unknown;
    submittedAt: Date;
  }) => formatAnswer(a));
}
