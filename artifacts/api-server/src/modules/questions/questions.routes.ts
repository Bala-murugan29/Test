import type { FastifyPluginAsync } from "fastify";
import {
  listQuestionsController,
  getQuestionByIdController,
  createMcqQuestionController,
  createCodingQuestionController,
  updateQuestionController,
  updateQuestionStatusController,
  deleteQuestionController,
  getQuestionUsageController,
} from "./questions.controller";

const questionResponseSchema = {
  type: "object",
  required: ["id", "departmentId", "type", "status", "title", "prompt", "difficulty", "marks", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    departmentId: { type: "string" },
    createdByUserId: { type: "string", nullable: true },
    type: { type: "string", enum: ["MCQ", "CODING"] },
    status: { type: "string", enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] },
    title: { type: "string" },
    prompt: { type: "string" },
    explanation: { type: "string", nullable: true },
    difficulty: { type: "integer" },
    marks: { type: "integer" },
    timeLimitSeconds: { type: "integer", nullable: true },
    tags: { type: "array", items: { type: "string" }, nullable: true },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    mcq: {
      type: "object",
      nullable: true,
      properties: {
        options: { type: "array", items: { type: "object", properties: { text: { type: "string" } } } },
        correctOptionIndex: { type: "integer" },
        shuffleOptions: { type: "boolean" },
        answerExplanation: { type: "string", nullable: true },
      },
    },
    coding: {
      type: "object",
      nullable: true,
      properties: {
        starterCode: { type: "string", nullable: true },
        solutionTemplate: { type: "string", nullable: true },
        testCases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              input: { type: "string" },
              expectedOutput: { type: "string" },
            },
          },
        },
        languageConstraints: { type: "array", items: { type: "string" }, nullable: true },
        sampleInput: { type: "string", nullable: true },
        sampleOutput: { type: "string", nullable: true },
      },
    },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: questionResponseSchema },
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

export const questionsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/questions", {
    schema: {
      tags: ["questions"],
      summary: "List questions",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" },
          type: { type: "string", enum: ["MCQ", "CODING"] },
          status: { type: "string", enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] },
          departmentId: { type: "string", format: "uuid" },
          difficulty: { type: "integer" },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    handler: listQuestionsController,
  });

  app.get("/questions/:id", {
    schema: {
      tags: ["questions"],
      summary: "Get question by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: questionResponseSchema },
    },
    handler: getQuestionByIdController,
  });

  app.post("/questions/mcq", {
    schema: {
      tags: ["questions"],
      summary: "Create MCQ question",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: [
          "departmentId", "title", "prompt", "difficulty", "marks",
          "options", "correctOptionIndex",
        ],
        properties: {
          departmentId: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1 },
          prompt: { type: "string", minLength: 1 },
          explanation: { type: "string" },
          difficulty: { type: "integer", minimum: 1, maximum: 5 },
          marks: { type: "integer", minimum: 1 },
          timeLimitSeconds: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
          options: {
            type: "array",
            minItems: 2,
            maxItems: 10,
            items: {
              type: "object",
              required: ["text"],
              properties: { text: { type: "string", minLength: 1 } },
            },
          },
          correctOptionIndex: { type: "integer", minimum: 0 },
          shuffleOptions: { type: "boolean", default: true },
          answerExplanation: { type: "string" },
        },
      },
      response: { 201: questionResponseSchema },
    },
    handler: createMcqQuestionController,
  });

  app.post("/questions/coding", {
    schema: {
      tags: ["questions"],
      summary: "Create coding question",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: [
          "departmentId", "title", "prompt", "difficulty", "marks", "testCases",
        ],
        properties: {
          departmentId: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1 },
          prompt: { type: "string", minLength: 1 },
          explanation: { type: "string" },
          difficulty: { type: "integer", minimum: 1, maximum: 5 },
          marks: { type: "integer", minimum: 1 },
          timeLimitSeconds: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
          starterCode: { type: "string" },
          solutionTemplate: { type: "string" },
          testCases: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["input", "expectedOutput"],
              properties: {
                input: { type: "string" },
                expectedOutput: { type: "string" },
              },
            },
          },
          languageConstraints: { type: "array", items: { type: "string" } },
          sampleInput: { type: "string" },
          sampleOutput: { type: "string" },
        },
      },
      response: { 201: questionResponseSchema },
    },
    handler: createCodingQuestionController,
  });

  app.put("/questions/:id", {
    schema: {
      tags: ["questions"],
      summary: "Update question",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          prompt: { type: "string", minLength: 1 },
          explanation: { type: "string" },
          difficulty: { type: "integer", minimum: 1, maximum: 5 },
          marks: { type: "integer", minimum: 1 },
          timeLimitSeconds: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      response: { 200: questionResponseSchema },
    },
    handler: updateQuestionController,
  });

  app.put("/questions/:id/status", {
    schema: {
      tags: ["questions"],
      summary: "Update question status",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] },
        },
      },
      response: { 200: questionResponseSchema },
    },
    handler: updateQuestionStatusController,
  });

  app.delete("/questions/:id", {
    schema: {
      tags: ["questions"],
      summary: "Delete question",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string" } },
        },
      },
    },
    handler: deleteQuestionController,
  });

  app.get("/questions/:id/usage", {
    schema: {
      tags: ["questions"],
      summary: "Get question usage across exams",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          required: ["questionId", "usedInExams", "totalUsage"],
          properties: {
            questionId: { type: "string" },
            usedInExams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  examId: { type: "string" },
                  examTitle: { type: "string" },
                  examStatus: { type: "string" },
                  sequenceNo: { type: "integer" },
                  marksOverride: { type: "integer", nullable: true },
                },
              },
            },
            totalUsage: { type: "integer" },
          },
        },
      },
    },
    handler: getQuestionUsageController,
  });
};
