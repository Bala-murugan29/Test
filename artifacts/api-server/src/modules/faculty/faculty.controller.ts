import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createFacultyBodySchema,
  updateFacultyBodySchema,
  assignCourseBodySchema,
  paginatedFacultySchema,
  facultyResponseSchema,
  courseAssignmentSchema,
} from "./faculty.schemas";
import * as facultyService from "./faculty.service";

export async function listFacultyController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await facultyService.listFaculty(request.server, query);
  const payload = paginatedFacultySchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getFacultyController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const result = await facultyService.getFaculty(request.server, userId);
  const payload = facultyResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createFacultyController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createFacultyBodySchema.parse(request.body);
  const result = await facultyService.createFaculty(request.server, body);
  const payload = facultyResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateFacultyController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const body = updateFacultyBodySchema.parse(request.body);
  const result = await facultyService.updateFaculty(request.server, userId, body);
  const payload = facultyResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getCourseAssignmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const result = await facultyService.getCourseAssignments(request.server, userId);
  const payload = courseAssignmentSchema.array().parse(result);
  return reply.code(200).send(payload);
}

export async function assignCourseController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.params as { userId: string };
  const body = assignCourseBodySchema.parse(request.body);
  const result = await facultyService.assignCourse(
    request.server,
    userId,
    body.courseId,
    request.user.sub,
  );
  return reply.code(200).send(result);
}

export async function unassignCourseController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId, courseId } = request.params as { userId: string; courseId: string };
  const result = await facultyService.unassignCourse(request.server, userId, courseId);
  return reply.code(200).send(result);
}
