import type { FastifyPluginAsync } from "fastify";
import {
  saveAnswerController,
  saveMultipleAnswersController,
  getSavedAnswersController,
  saveQuestionAnswerController,
} from "./autosave.controller";

const answerResponseSchema = {
  type: "object",
  required: ["id", "sessionId", "questionId", "submittedAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    sessionId: { type: "string", format: "uuid" },
    questionId: { type: "string", format: "uuid" },
    answerText: { type: "string", nullable: true },
    selectedOptionIndex: { type: "integer", nullable: true },
    codeAnswer: { type: "string", nullable: true },
    answerPayload: {},
    submittedAt: { type: "string", format: "date-time" },
  },
};

const sessionAnswersResponseSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: { type: "array", items: answerResponseSchema },
  },
};

const saveAnswerBodySchema = {
  type: "object",
  required: ["questionId"],
  properties: {
    questionId: { type: "string", format: "uuid" },
    answerText: { type: "string" },
    selectedOptionIndex: { type: "integer", minimum: 0 },
    codeAnswer: { type: "string" },
    answerPayload: {},
  },
};

const saveMultipleAnswersBodySchema = {
  type: "object",
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        required: ["questionId"],
        properties: {
          questionId: { type: "string", format: "uuid" },
          answerText: { type: "string" },
          selectedOptionIndex: { type: "integer", minimum: 0 },
          codeAnswer: { type: "string" },
          answerPayload: {},
        },
      },
    },
  },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const autosaveRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.put("/sessions/:sessionId/answers", {
    schema: {
      tags: ["autosave"],
      summary: "Save single or batch answers for a session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["sessionId"],
        properties: { sessionId: { type: "string", format: "uuid" } },
      },
      body: {
        oneOf: [saveAnswerBodySchema, saveMultipleAnswersBodySchema],
      },
      response: {
        200: {
          oneOf: [answerResponseSchema, sessionAnswersResponseSchema],
        },
      },
    },
    handler: async (request, reply) => {
      const body = request.body as Record<string, unknown>;
      if (body && typeof body === "object" && "answers" in body) {
        return saveMultipleAnswersController(request, reply);
      }
      return saveAnswerController(request, reply);
    },
  });

  app.get("/sessions/:sessionId/answers", {
    schema: {
      tags: ["autosave"],
      summary: "Get all saved answers for a session",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["sessionId"],
        properties: { sessionId: { type: "string", format: "uuid" } },
      },
      response: { 200: sessionAnswersResponseSchema },
    },
    handler: getSavedAnswersController,
  });

  app.put("/sessions/:sessionId/answers/:questionId", {
    schema: {
      tags: ["autosave"],
      summary: "Save a specific answer for a question",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["sessionId", "questionId"],
        properties: {
          sessionId: { type: "string", format: "uuid" },
          questionId: { type: "string", format: "uuid" },
        },
      },
      body: {
        type: "object",
        properties: {
          answerText: { type: "string" },
          selectedOptionIndex: { type: "integer", minimum: 0 },
          codeAnswer: { type: "string" },
          answerPayload: {},
        },
      },
      response: { 200: answerResponseSchema },
    },
    handler: saveQuestionAnswerController,
  });
};
