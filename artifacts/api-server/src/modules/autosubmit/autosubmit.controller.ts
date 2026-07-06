import type { FastifyRequest, FastifyReply } from "fastify";
import {
  expiredSessionsResponseSchema,
  autoSubmitResponseSchema,
} from "./autosubmit.schemas";
import * as autosubmitService from "./autosubmit.service";

export async function triggerAutoSubmitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await autosubmitService.autoSubmitExpiredSessions(request.server);
  return reply.code(200).send(result);
}

export async function getExpiredSessionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await autosubmitService.getExpiredSessions(request.server);
  const payload = expiredSessionsResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function autoSubmitSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.params as { sessionId: string };
  const result = await autosubmitService.autoSubmitSingleSession(request.server, sessionId);
  const payload = autoSubmitResponseSchema.parse(result);
  return reply.code(200).send(payload);
}
