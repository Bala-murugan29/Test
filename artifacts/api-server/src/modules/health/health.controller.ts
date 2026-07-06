import type { FastifyReply, FastifyRequest } from "fastify";
import { healthResponseSchema } from "./health.schemas";
import { healthService } from "./health.service";

export async function healthController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const payload = healthResponseSchema.parse(
    await healthService(request.server),
  );

  return reply.code(200).send(payload);
}