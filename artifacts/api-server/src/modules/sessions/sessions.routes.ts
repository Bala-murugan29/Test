import type { FastifyPluginAsync } from "fastify";
import {
  startSessionController,
  getSessionController,
  getSessionDetailController,
  getSessionQuestionsController,
  submitSessionController,
  getSessionStatusController,
  pauseSessionController,
  resumeSessionController,
  listExamSessionsController,
} from "./sessions.controller";

const sessionResponseSchema = {
  type: "object",
  required: ["id", "examId", "studentUserId", "attemptNo", "status", "createdAt"],
  properties: {
    id: { type: "string" },
    examId: { type: "string" },
    studentUserId: { type: "string" },
    attemptNo: { type: "integer" },
    status: { type: "string" },
    startedAt: { type: "string", nullable: true },
    submittedAt: { type: "string", nullable: true },
    expiresAt: { type: "string", nullable: true },
    createdAt: { type: "string" },
  },
};

const sessionDetailResponseSchema = {
  ...sessionResponseSchema,
  properties: {
    ...sessionResponseSchema.properties,
    answers: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "questionId", "submittedAt"],
        properties: {
          id: { type: "string" },
          questionId: { type: "string" },
          answerText: { type: "string", nullable: true },
          selectedOptionIndex: { type: "integer", nullable: true },
          codeAnswer: { type: "string", nullable: true },
          submittedAt: { type: "string" },
        },
      },
    },
  },
};

const paginatedSessionsSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: {
      type: "array",
      items: {
        ...sessionResponseSchema,
        properties: {
          ...sessionResponseSchema.properties,
          studentName: { type: "string" },
          studentEmail: { type: "string" },
        },
      },
    },
    meta: {
      type: "object",
      required: ["page", "limit", "total", "totalPages"],
      properties: {
        page: { type: "integer" },
        limit: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const sessionsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.post("/sessions", {
    schema: {
      tags: ["sessions"],
      summary: "Start a new exam session",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["examId"],
        properties: {
          examId: { type: "string", format: "uuid" },
        },
      },
      response: { 201: sessionResponseSchema },
    },
    handler: startSessionController,
  });

  app.get("/sessions/:id", {
    schema: {
      tags: ["sessions"],
      summary: "Get session details",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: sessionResponseSchema },
    },
    handler: getSessionController,
  });

  app.get("/sessions/:id/questions", {
    schema: {
      tags: ["sessions"],
      summary: "Get session questions",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
    },
    handler: getSessionQuestionsController,
  });

  app.post("/sessions/:id/submit", {
    schema: {
      tags: ["sessions"],
      summary: "Submit exam session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: sessionResponseSchema },
    },
    handler: submitSessionController,
  });

  app.get("/sessions/:id/status", {
    schema: {
      tags: ["sessions"],
      summary: "Get session status",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          required: ["id", "status"],
          properties: {
            id: { type: "string" },
            status: { type: "string" },
            startedAt: { type: "string", nullable: true },
            expiresAt: { type: "string", nullable: true },
          },
        },
      },
    },
    handler: getSessionStatusController,
  });

  app.post("/sessions/:id/pause", {
    schema: {
      tags: ["sessions"],
      summary: "Pause session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: sessionResponseSchema },
    },
    handler: pauseSessionController,
  });

  app.post("/sessions/:id/resume", {
    schema: {
      tags: ["sessions"],
      summary: "Resume session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: sessionResponseSchema },
    },
    handler: resumeSessionController,
  });

  app.get("/exams/:examId/sessions", {
    schema: {
      tags: ["sessions"],
      summary: "List sessions for an exam (faculty view)",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["examId"],
        properties: { examId: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
        },
      },
      response: { 200: paginatedSessionsSchema },
    },
    handler: listExamSessionsController,
  });
};
