import type { FastifyInstance } from "fastify";

export async function readHealthSnapshot(app: FastifyInstance) {
  await Promise.all([
    app.prisma.$queryRaw`SELECT 1`,
    app.redis.ping(),
  ]);

  return {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    dependencies: {
      database: "ok" as const,
      cache: "ok" as const,
    },
  };
}