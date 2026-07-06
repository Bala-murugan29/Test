import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createStudentBodySchema,
  updateStudentBodySchema,
  enrollBodySchema,
  paginatedStudentsSchema,
  studentResponseSchema,
  enrollmentResponseSchema,
  resultResponseSchema,
} from "./students.schemas";
import * as studentsService from "./students.service";

export async function listStudentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await studentsService.listStudents(request.server, query);
  const payload = paginatedStudentsSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getStudentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const result = await studentsService.getStudent(request.server, userId);
  const payload = studentResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createStudentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createStudentBodySchema.parse(request.body);
  const result = await studentsService.createStudent(request.server, body);
  const payload = studentResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateStudentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const body = updateStudentBodySchema.parse(request.body);
  const result = await studentsService.updateStudent(request.server, userId, body);
  const payload = studentResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getEnrollmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const result = await studentsService.getEnrollments(request.server, userId);
  const payload = enrollmentResponseSchema.array().parse(result);
  return reply.code(200).send(payload);
}

export async function enrollStudentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const body = enrollBodySchema.parse(request.body);
  const result = await studentsService.enrollStudent(request.server, userId, body.courseId);
  const payload = enrollmentResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function dropEnrollmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId, courseId } = request.params as { userId: string; courseId: string };
  const result = await studentsService.dropEnrollment(request.server, userId, courseId);
  return reply.code(200).send(result);
}

export async function getStudentResultsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const result = await studentsService.getStudentResults(request.server, userId);
  const payload = resultResponseSchema.array().parse(result);
  return reply.code(200).send(payload);
}
