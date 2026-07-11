import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma";
import { redis } from "./infrastructure/cache/redis";
import routes from "./routes";
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "production"
          ? undefined
          : {
              target: "pino-pretty",
              options: { colorize: true },
            },
    },
    requestIdHeader: "x-request-id",
  });

  app.decorate("prisma", prisma);
  app.decorate("redis", redis);

  app.register(cors, {
    origin:
      env.CORS_ORIGIN === "*"
        ? true
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  });
  app.register(helmet);
  app.register(cookie);
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
  app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  app.register(routes, { prefix: "/api" });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Unhandled request error");
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    if (statusCode >= 500) {
      console.error("Unhandled 500 error:", error);
    }
    const message = error instanceof Error ? error.stack || error.message : "Internal Server Error";
    reply.status(statusCode).send({
      error: statusCode >= 500 ? message : message,
      requestId: request.id,
    });
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  return app;
}

export async function startApp(app: FastifyInstance) {
  await prisma.$connect();
  await redis.connect();
  await app.listen({
    host: env.HOST,
    port: env.PORT,
  });
}
