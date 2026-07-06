import type { FastifyRequest, FastifyReply } from "fastify";
import {
  saveAnswerBodySchema,
  saveMultipleAnswersBodySchema,
  answerResponseSchema,
  sessionAnswersResponseSchema,
} from "./autosave.schemas";
import * as autosaveService from "./autosave.service";

export async function saveAnswerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.params as { sessionId: string };
  const body = saveAnswerBodySchema.parse(request.body);
  const result = await autosaveService.saveAnswer(
    request.server,
    sessionId,
    request.user.sub,
    body,
  );
  const payload = answerResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function saveMultipleAnswersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.params as { sessionId: string };
  const body = saveMultipleAnswersBodySchema.parse(request.body);
  const result = await autosaveService.saveMultipleAnswers(
    request.server,
    sessionId,
    request.user.sub,
    body,
  );
  return reply.code(200).send({ data: result });
}

export async function getSavedAnswersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.params as { sessionId: string };
  const result = await autosaveService.getSavedAnswers(
    request.server,
    sessionId,
    request.user.sub,
  );
  const payload = sessionAnswersResponseSchema.parse({ data: result });
  return reply.code(200).send(payload);
}

export async function saveQuestionAnswerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId, questionId } = request.params as {
    sessionId: string;
    questionId: string;
  };
  const raw = request.body as Record<string, unknown> | undefined;
  const body = saveAnswerBodySchema.parse({ ...(raw ?? {}), questionId });
  const result = await autosaveService.saveAnswer(
    request.server,
    sessionId,
    request.user.sub,
    body,
  );
  const payload = answerResponseSchema.parse(result);
  return reply.code(200).send(payload);
}
