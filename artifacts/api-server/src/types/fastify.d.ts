import type { PrismaClient } from "@prisma/client";
import type { AppRedisClient } from "../infrastructure/cache/redis";

interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  roles: string[];
}

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: AppRedisClient;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
