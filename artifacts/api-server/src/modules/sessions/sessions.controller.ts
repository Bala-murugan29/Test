import type { FastifyRequest, FastifyReply } from "fastify";
import {
  createSessionBodySchema,
  sessionResponseSchema,
  sessionDetailResponseSchema,
  paginatedSessionsSchema,
} from "./sessions.schemas";
import * as sessionsService from "./sessions.service";

export async function startSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createSessionBodySchema.parse(request.body);
  const user = request.user as { sub: string };
  const result = await sessionsService.startSession(
    request.server,
    body.examId,
    user.sub,
  );
  const payload = sessionResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function getSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.getSession(request.server, id);
  const payload = sessionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getSessionDetailController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.getSessionDetail(request.server, id);
  const payload = sessionDetailResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getSessionQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.getSessionQuestions(request.server, id);
  return reply.code(200).send(result);
}

export async function submitSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.submitSession(request.server, id);
  const payload = sessionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getSessionStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.getSession(request.server, id);
  return reply.code(200).send({
    id: result.id,
    status: result.status,
    startedAt: result.startedAt,
    expiresAt: result.expiresAt,
  });
}

export async function pauseSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.pauseSession(request.server, id);
  const payload = sessionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function resumeSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await sessionsService.resumeSession(request.server, id);
  const payload = sessionResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function listExamSessionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { examId } = request.params as { examId: string };
  const query = request.query as { page?: string; limit?: string };
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "20", 10);
  const result = await sessionsService.listSessionsByExam(
    request.server,
    examId,
    page,
    limit,
  );
  const payload = paginatedSessionsSchema.parse(result);
  return reply.code(200).send(payload);
}
