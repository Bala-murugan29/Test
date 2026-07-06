import type { FastifyInstance } from "fastify";
import type { PaginationQuery, CreateUserBody, UpdateUserBody } from "./users.schemas";

export async function findUsers(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search, role, status } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (role) {
    where.userRoles = {
      some: { role: { key: role } },
    };
  }

  const [users, total] = await Promise.all([
    app.prisma.user.findMany({
      where,
      include: { userRoles: { include: { role: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u: { id: string; email: string; fullName: string; phone: string | null; status: string; userRoles: Array<{ role: { key: string } }>; createdAt: Date }) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      status: u.status,
      roles: u.userRoles.map((ur: { role: { key: string } }) => ur.role.key),
      createdAt: u.createdAt.toISOString(),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findUserById(app: FastifyInstance, id: string) {
  return app.prisma.user.findUnique({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });
}

export async function createUser(
  app: FastifyInstance,
  data: CreateUserBody,
  passwordHash: string,
) {
  const role = await app.prisma.role.findUnique({ where: { key: data.role } });
  if (!role) {
    throw new Error(`Role "${data.role}" not found`);
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

export async function updateUser(
  app: FastifyInstance,
  id: string,
  data: UpdateUserBody,
) {
  return app.prisma.user.update({
    where: { id },
    data,
    include: { userRoles: { include: { role: true } } },
  });
}

export async function updateUserStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  return app.prisma.user.update({
    where: { id },
    data: { status: status as "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED" },
    include: { userRoles: { include: { role: true } } },
  });
}

export async function deleteUser(app: FastifyInstance, id: string) {
  return app.prisma.user.delete({ where: { id } });
}

export async function assignRole(
  app: FastifyInstance,
  userId: string,
  roleKey: string,
) {
  const role = await app.prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) {
    throw new Error(`Role "${roleKey}" not found`);
  }

  return app.prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

export async function removeRole(
  app: FastifyInstance,
  userId: string,
  roleId: string,
) {
  return app.prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } },
  });
}

export async function getUserRoles(app: FastifyInstance, userId: string) {
  return app.prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
}
