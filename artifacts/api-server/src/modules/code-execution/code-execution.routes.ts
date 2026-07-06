import type { FastifyPluginAsync } from "fastify";
import { runCodeController } from "./code-execution.controller";

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const codeExecutionRoutes: FastifyPluginAsync = async (app) => {
  app.post("/code/run", {
    preHandler: [jwtPreHandler],
    handler: runCodeController,
  });
};
