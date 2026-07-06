import type { FastifyInstance } from "fastify";

export async function findSettingsByCategory(
  app: FastifyInstance,
  category: string,
) {
  return app.prisma.systemSetting.findMany({
    where: { category },
    orderBy: { key: "asc" },
  });
}

export async function findAllSettings(app: FastifyInstance) {
  return app.prisma.systemSetting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
}

export async function upsertSetting(
  app: FastifyInstance,
  category: string,
  key: string,
  value: unknown,
  description: string | null,
  updatedByUserId: string | null,
) {
  return app.prisma.systemSetting.upsert({
    where: { category_key: { category, key } },
    create: { category, key, value, description, updatedByUserId },
    update: { value, description, updatedByUserId },
  });
}
