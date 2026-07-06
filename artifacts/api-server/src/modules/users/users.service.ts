import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import * as usersRepo from "./users.repository";
import type { PaginationQuery, CreateUserBody, UpdateUserBody } from "./users.schemas";
import { HttpError } from "../../shared/errors/http-error";

const SALT_ROUNDS = 12;

type UserRoleEntry = { role: { key: string } };

function formatUser(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  userRoles: UserRoleEntry[];
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    status: user.status,
    roles: user.userRoles.map((ur: UserRoleEntry) => ur.role.key),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsers(app: FastifyInstance, query: PaginationQuery) {
  return usersRepo.findUsers(app, query);
}

export async function getUserById(app: FastifyInstance, id: string) {
  const user = await usersRepo.findUserById(app, id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return formatUser(user);
}

export async function createUser(app: FastifyInstance, data: CreateUserBody) {
  const existing = await app.prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await usersRepo.createUser(app, data, passwordHash);

  return formatUser(user);
}

export async function updateUser(
  app: FastifyInstance,
  id: string,
  data: UpdateUserBody,
) {
  const existing = await usersRepo.findUserById(app, id);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await app.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new HttpError(409, "Email already in use");
    }
  }

  const user = await usersRepo.updateUser(app, id, data);
  return formatUser(user);
}

export async function updateUserStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  const existing = await usersRepo.findUserById(app, id);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  const user = await usersRepo.updateUserStatus(app, id, status);
  return formatUser(user);
}

export async function deleteUser(app: FastifyInstance, id: string) {
  const existing = await usersRepo.findUserById(app, id);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  await usersRepo.deleteUser(app, id);
  return { message: "User deleted successfully" };
}

export async function assignRole(
  app: FastifyInstance,
  userId: string,
  roleKey: string,
) {
  const existing = await usersRepo.findUserById(app, userId);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  await usersRepo.assignRole(app, userId, roleKey);
  return { message: `Role "${roleKey}" assigned successfully` };
}

export async function removeRole(
  app: FastifyInstance,
  userId: string,
  roleId: string,
) {
  const existing = await usersRepo.findUserById(app, userId);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  await usersRepo.removeRole(app, userId, roleId);
  return { message: "Role removed successfully" };
}

export async function getUserRoles(app: FastifyInstance, userId: string) {
  const existing = await usersRepo.findUserById(app, userId);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  const roles = await usersRepo.getUserRoles(app, userId);
  return roles.map((r: { role: { id: string; key: string; name: string }; assignedAt: Date }) => ({
    roleId: r.role.id,
    key: r.role.key,
    name: r.role.name,
    assignedAt: r.assignedAt.toISOString(),
  }));
}
