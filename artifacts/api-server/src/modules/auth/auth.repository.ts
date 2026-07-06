import type { FastifyInstance } from "fastify";
import type { RegisterBody } from "./auth.schemas";

export async function findUserByEmail(app: FastifyInstance, email: string) {
  return app.prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  });
}

export async function findUserById(app: FastifyInstance, id: string) {
  return app.prisma.user.findUnique({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });
}

export async function createUser(
  app: FastifyInstance,
  data: RegisterBody,
  passwordHash: string,
) {
  const roleKey = data.role ?? "student";

  const role = await app.prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) {
    throw new Error(`Role "${roleKey}" not found`);
  }

  return app.prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      userRoles: {
        create: { roleId: role.id },
      },
    },
    include: { userRoles: { include: { role: true } } },
  });
}

export async function createRefreshToken(
  app: FastifyInstance,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  deviceId?: string,
  familyId?: string,
  rotatedFromTokenId?: string,
) {
  return app.prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      deviceId,
      familyId,
      rotatedFromTokenId,
    },
  });
}

export async function findRefreshTokenByHash(
  app: FastifyInstance,
  tokenHash: string,
) {
  return app.prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { userRoles: { include: { role: true } } } } },
  });
}

export async function revokeRefreshToken(
  app: FastifyInstance,
  tokenHash: string,
) {
  return app.prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function revokeRefreshTokenFamily(
  app: FastifyInstance,
  familyId: string,
) {
  return app.prisma.refreshToken.updateMany({
    where: { familyId },
    data: { revokedAt: new Date() },
  });
}

export async function updateLastLogin(app: FastifyInstance, userId: string) {
  return app.prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function createAuditLog(
  app: FastifyInstance,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
) {
  return app.prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? undefined,
      ipAddress,
      userAgent,
    },
  });
}
