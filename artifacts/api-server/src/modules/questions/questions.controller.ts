import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createMcqQuestionBodySchema,
  createCodingQuestionBodySchema,
  updateQuestionBodySchema,
  updateQuestionStatusBodySchema,
  questionResponseSchema,
  paginatedQuestionsSchema,
} from "./questions.schemas";
import * as questionsService from "./questions.service";

export async function listQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await questionsService.listQuestions(request.server, query);
  const payload = paginatedQuestionsSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getQuestionByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await questionsService.getQuestionById(request.server, id);
  const payload = questionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createMcqQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createMcqQuestionBodySchema.parse(request.body);
  const user = request.user as { sub: string };
  const result = await questionsService.createMcqQuestion(
    request.server,
    body,
    user.sub,
  );
  const payload = questionResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function createCodingQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createCodingQuestionBodySchema.parse(request.body);
  const user = request.user as { sub: string };
  const result = await questionsService.createCodingQuestion(
    request.server,
    body,
    user.sub,
  );
  const payload = questionResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateQuestionBodySchema.parse(request.body);
  const result = await questionsService.updateQuestion(
    request.server,
    id,
    body,
  );
  const payload = questionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function updateQuestionStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateQuestionStatusBodySchema.parse(request.body);
  const result = await questionsService.updateQuestionStatus(
    request.server,
    id,
    body.status,
  );
  const payload = questionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function deleteQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await questionsService.deleteQuestion(request.server, id);
  return reply.code(200).send(result);
}

export async function getQuestionUsageController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await questionsService.getQuestionUsage(request.server, id);
  return reply.code(200).send(result);
}
