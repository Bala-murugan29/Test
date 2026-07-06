import type { FastifyRequest, FastifyReply } from "fastify";
import {
  paginationQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  assignRoleBodySchema,
  paginatedUsersSchema,
  userListItemSchema,
} from "./users.schemas";
import * as usersService from "./users.service";

export async function listUsersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = paginationQuerySchema.parse(request.query);
  const result = await usersService.listUsers(request.server, query);
  const payload = paginatedUsersSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function getUserByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await usersService.getUserById(request.server, id);
  const payload = userListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function createUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createUserBodySchema.parse(request.body);
  const result = await usersService.createUser(request.server, body);
  const payload = userListItemSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function updateUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateUserBodySchema.parse(request.body);
  const result = await usersService.updateUser(request.server, id, body);
  const payload = userListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function updateUserStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = updateUserStatusBodySchema.parse(request.body);
  const result = await usersService.updateUserStatus(request.server, id, body.status);
  const payload = userListItemSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function deleteUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await usersService.deleteUser(request.server, id);
  return reply.code(200).send(result);
}

export async function assignRoleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = assignRoleBodySchema.parse(request.body);
  const result = await usersService.assignRole(request.server, id, body.role);
  return reply.code(200).send(result);
}

export async function removeRoleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id, roleId } = request.params as { id: string; roleId: string };
  const result = await usersService.removeRole(request.server, id, roleId);
  return reply.code(200).send(result);
}

export async function getUserRolesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const result = await usersService.getUserRoles(request.server, id);
  return reply.code(200).send(result);
}
