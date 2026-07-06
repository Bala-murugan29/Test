import type { FastifyPluginAsync } from "fastify";
import { healthController } from "./health.controller";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/healthz", healthController);
};