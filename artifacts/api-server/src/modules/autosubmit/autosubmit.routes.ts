import type { FastifyPluginAsync } from "fastify";
import {
  triggerAutoSubmitController,
  getExpiredSessionsController,
  autoSubmitSessionController,
} from "./autosubmit.controller";

const autoSubmitResponseSchema = {
  type: "object",
  required: ["sessionId", "autoSubmittedAt", "resultId"],
  properties: {
    sessionId: { type: "string" },
    autoSubmittedAt: { type: "string" },
    resultId: { type: "string" },
  },
};

const expiredSessionsResponseSchema = {
  type: "object",
  required: ["sessions"],
  properties: {
    sessions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "examId", "studentUserId", "expiresAt"],
        properties: {
          id: { type: "string" },
          examId: { type: "string" },
          studentUserId: { type: "string" },
          expiresAt: { type: "string" },
        },
      },
    },
  },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const autosubmitRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.post("/autosubmit/trigger", {
    schema: {
      tags: ["autosubmit"],
      summary: "Trigger auto-submit for all expired sessions",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "array",
          items: autoSubmitResponseSchema,
        },
      },
    },
    handler: triggerAutoSubmitController,
  });

  app.get("/autosubmit/expired", {
    schema: {
      tags: ["autosubmit"],
      summary: "List expired sessions",
      security: [{ bearerAuth: [] }],
      response: { 200: expiredSessionsResponseSchema },
    },
    handler: getExpiredSessionsController,
  });

  app.post("/autosubmit/sessions/:sessionId", {
    schema: {
      tags: ["autosubmit"],
      summary: "Auto-submit a specific session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["sessionId"],
        properties: { sessionId: { type: "string", format: "uuid" } },
      },
      response: { 200: autoSubmitResponseSchema },
    },
    handler: autoSubmitSessionController,
  });
};
