import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createDepartmentBodySchema,
  updateDepartmentBodySchema,
  createCourseBodySchema,
  paginatedDepartmentsSchema,
  departmentResponseSchema,
  courseResponseSchema,
  departmentStatsResponseSchema,
} from "./departments.schemas";
import * as departmentsService from "./departments.service";

export async function listDepartmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await departmentsService.listDepartments(request.server, query);
  const payload = paginatedDepartmentsSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getDepartmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await departmentsService.getDepartment(request.server, id);
  const payload = departmentResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createDepartmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createDepartmentBodySchema.parse(request.body);
  const result = await departmentsService.createDepartment(request.server, body);
  const payload = departmentResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateDepartmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateDepartmentBodySchema.parse(request.body);
  const result = await departmentsService.updateDepartment(request.server, id, body);
  const payload = departmentResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function deleteDepartmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await departmentsService.deleteDepartment(request.server, id);
  return reply.code(200).send(result);
}

export async function getCoursesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await departmentsService.getCourses(request.server, id);
  return reply.code(200).send(result);
}

export async function createCourseController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = createCourseBodySchema.parse(request.body);
  const result = await departmentsService.createCourse(request.server, id, body);
  const payload = courseResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function getDepartmentStatsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await departmentsService.getDepartmentStats(request.server, id);
  const payload = departmentStatsResponseSchema.parse(result);
  return reply.code(200).send(payload);
}
