import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createExamBodySchema,
  updateExamBodySchema,
  addQuestionBodySchema,
  reorderQuestionsBodySchema,
  examListItemSchema,
  examDetailSchema,
  paginatedExamsSchema,
} from "./exams.schemas";
import * as examsService from "./exams.service";

export async function listExamsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await examsService.listExams(request.server, query);
  const payload = paginatedExamsSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getExamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await examsService.getExam(request.server, id);
  const payload = examDetailSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createExamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createExamBodySchema.parse(request.body);
  const userId = request.user?.sub as string;
  const result = await examsService.createExam(request.server, body, userId);
  const payload = examListItemSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateExamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateExamBodySchema.parse(request.body);
  const result = await examsService.updateExam(request.server, id, body);
  const payload = examListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function publishExamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await examsService.publishExam(request.server, id);
  const payload = examListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function archiveExamController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await examsService.archiveExam(request.server, id);
  const payload = examListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getExamQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await examsService.getExamQuestions(request.server, id);
  return reply.code(200).send(result);
}

export async function addQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = addQuestionBodySchema.parse(request.body);
  const result = await examsService.addQuestion(request.server, id, body);
  return reply.code(201).send(result);
}

export async function removeQuestionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id, questionId } = request.params as { id: string; questionId: string };
  const result = await examsService.removeQuestion(request.server, id, questionId);
  return reply.code(200).send(result);
}

export async function reorderQuestionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = reorderQuestionsBodySchema.parse(request.body);
  const result = await examsService.reorderQuestions(request.server, id, body);
  return reply.code(200).send(result);
}
