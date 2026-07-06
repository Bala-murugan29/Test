import type { FastifyRequest, FastifyReply } from "fastify";
import {
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  changePasswordBodySchema,
  authResponseSchema,
  messageResponseSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";
import { HttpError } from "../../shared/errors/http-error";

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = registerBodySchema.parse(request.body);
  const result = await authService.register(request.server, body);
  const payload = authResponseSchema.parse(result);
  return reply.code(201).send(payload);
}

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = loginBodySchema.parse(request.body);
  const ipAddress = request.ip;
  const userAgent = request.headers["user-agent"];
  const result = await authService.login(
    request.server,
    body,
    ipAddress,
    userAgent,
  );
  const payload = authResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function refreshController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = refreshBodySchema.parse(request.body);
  const result = await authService.refresh(request.server, body.refreshToken);
  const payload = authResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = refreshBodySchema.parse(request.body);
  const result = await authService.logout(request.server, body.refreshToken);
  const payload = messageResponseSchema.parse(result);
  return reply.code(200).send(payload);
}

export async function meController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user as { sub: string } | undefined;
  const userId = user?.sub;
  if (!userId) {
    throw new HttpError(401, "Not authenticated");
  }

  const foundUser = await request.server.prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!foundUser) {
    throw new HttpError(404, "User not found");
  }

  const payload = {
    id: foundUser.id,
    email: foundUser.email,
    fullName: foundUser.fullName,
    phone: foundUser.phone,
    status: foundUser.status,
    roles: foundUser.userRoles.map((ur: { role: { key: string } }) => ur.role.key),
    createdAt: foundUser.createdAt.toISOString(),
  };

  return reply.code(200).send(payload);
}

export async function changePasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user as { sub: string } | undefined;
  const userId = user?.sub;
  if (!userId) {
    throw new HttpError(401, "Not authenticated");
  }

  const body = changePasswordBodySchema.parse(request.body);
  const result = await authService.changePassword(
    request.server,
    userId,
    body,
  );
  const payload = messageResponseSchema.parse(result);
  return reply.code(200).send(payload);
}
