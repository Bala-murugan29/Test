import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import {
  findUserByEmail,
  createUser,
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
  updateLastLogin,
  createAuditLog,
} from "./auth.repository";
import type { RegisterBody, LoginBody, ChangePasswordBody } from "./auth.schemas";
import { HttpError } from "../../shared/errors/http-error";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateFamilyId(): string {
  return crypto.randomUUID();
}

export async function register(app: FastifyInstance, body: RegisterBody) {
  const existing = await findUserByEmail(app, body.email);
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
  // Create user as DISABLED pending admin approval
  await createUser(app, body, passwordHash, "DISABLED");

  return { message: "Registration successful. Please wait for an administrator to approve your account." };
}

export async function login(
  app: FastifyInstance,
  body: LoginBody,
  ipAddress?: string,
  userAgent?: string,
) {
  const user = await findUserByEmail(app, body.email);
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "Account is not active");
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  await updateLastLogin(app, user.id);

  await createAuditLog(
    app,
    user.id,
    "USER_LOGIN",
    "User",
    user.id,
    undefined,
    ipAddress,
    userAgent,
  );

  return generateTokenPair(app, user, "login");
}

export async function refresh(app: FastifyInstance, refreshTokenValue: string) {
  const tokenHash = hashToken(refreshTokenValue);
  const stored = await findRefreshTokenByHash(app, tokenHash);

  if (!stored) {
    throw new HttpError(401, "Invalid refresh token");
  }

  if (stored.revokedAt) {
    await revokeRefreshTokenFamily(app, stored.familyId ?? "default");
    throw new HttpError(401, "Refresh token revoked — possible token reuse detected");
  }

  if (new Date() > stored.expiresAt) {
    throw new HttpError(401, "Refresh token expired");
  }

  const user = stored.user;
  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "Account is not active");
  }

  // Rotate: revoke old, issue new pair
  await revokeRefreshToken(app, tokenHash);

  return generateTokenPair(app, user, "refresh", stored.familyId);
}

export async function changePassword(
  app: FastifyInstance,
  userId: string,
  body: ChangePasswordBody,
) {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Current password is incorrect");
  }

  const newHash = await bcrypt.hash(body.newPassword, SALT_ROUNDS);
  await app.prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke all refresh tokens for this user (force re-login on other devices)
  await app.prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });

  await createAuditLog(app, userId, "PASSWORD_CHANGED", "User", userId);

  return { message: "Password changed successfully" };
}

export async function logout(app: FastifyInstance, refreshTokenValue: string) {
  const tokenHash = hashToken(refreshTokenValue);
  await revokeRefreshToken(app, tokenHash);
  return { message: "Logged out successfully" };
}

async function generateTokenPair(
  app: FastifyInstance,
  user: { id: string; email: string; fullName: string; userRoles: Array<{ role: { key: string } }> },
  context: string,
  existingFamilyId?: string | null,
) {
  const roles = user.userRoles.map((ur) => ur.role.key);

  const accessToken = app.jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
    },
    { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS },
  );

  const refreshToken = app.jwt.sign(
    { sub: user.id, ctx: context },
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
  );

  const familyId = existingFamilyId ?? generateFamilyId();

  await createRefreshToken(
    app,
    user.id,
    hashToken(refreshToken),
    new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    undefined,
    familyId,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: null,
      status: "ACTIVE",
      roles,
      createdAt: new Date().toISOString(),
    },
    accessToken,
    refreshToken,
  };
}
