import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  evaluateResultBodySchema,
  paginatedResultsSchema,
  resultResponseSchema,
  certificateResponseSchema,
} from "./results.schemas";
import * as resultsService from "./results.service";

export async function listResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await resultsService.listResults(request.server, query);
  const payload = paginatedResultsSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getResultController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await resultsService.getResult(request.server, id);
  const payload = resultResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function evaluateResultController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = evaluateResultBodySchema.parse(request.body);
  const user = request.user as { sub: string };
  const result = await resultsService.evaluateResult(
    request.server,
    id,
    body,
    user.sub,
  );
  const payload = resultResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function issueCertificateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const user = request.user as { sub: string };
  const result = await resultsService.issueCertificate(
    request.server,
    id,
    user.sub,
  );
  const payload = certificateResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function getCertificateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await resultsService.getCertificate(request.server, id);
  const payload = certificateResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getStudentResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { studentUserId } = request.params as { studentUserId: string };
  const result = await resultsService.getStudentResults(
    request.server,
    studentUserId,
  );
  return reply.code(200).send(result);
}

export async function getExamResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { examId } = request.params as { examId: string };
  const result = await resultsService.getExamResults(request.server, examId);
  return reply.code(200).send(result);
}
