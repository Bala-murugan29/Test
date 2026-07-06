import type { FastifyPluginAsync } from "fastify";
import {
  listExamsController,
  getExamController,
  createExamController,
  updateExamController,
  publishExamController,
  archiveExamController,
  getExamQuestionsController,
  addQuestionController,
  removeQuestionController,
  reorderQuestionsController,
} from "./exams.controller";

const examResponseSchema = {
  type: "object",
  required: ["id", "courseId", "title", "durationMinutes", "totalMarks", "passMarks", "status", "randomizeQuestions", "allowReview", "attemptLimit", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    courseId: { type: "string" },
    courseTitle: { type: "string", nullable: true },
    title: { type: "string" },
    instructions: { type: "string", nullable: true },
    durationMinutes: { type: "integer" },
    totalMarks: { type: "integer" },
    passMarks: { type: "integer" },
    status: { type: "string" },
    startsAt: { type: "string", nullable: true },
    endsAt: { type: "string", nullable: true },
    randomizeQuestions: { type: "boolean" },
    allowReview: { type: "boolean" },
    attemptLimit: { type: "integer" },
    publishedAt: { type: "string", nullable: true },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const examDetailResponseSchema = {
  ...examResponseSchema,
  required: [...(examResponseSchema.required ?? []), "questions"],
  properties: {
    ...examResponseSchema.properties,
    questions: {
      type: "array",
      items: {
        type: "object",
        required: ["questionId", "sequenceNo", "negativeMarks", "isMandatory"],
        properties: {
          questionId: { type: "string" },
          sequenceNo: { type: "integer" },
          marksOverride: { type: "integer", nullable: true },
          negativeMarks: { type: "integer" },
          isMandatory: { type: "boolean" },
        },
      },
    },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: examResponseSchema },
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

export const examsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/exams", {
    schema: {
      tags: ["exams"],
      summary: "List exams",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"] },
          courseId: { type: "string", format: "uuid" },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    handler: listExamsController,
  });

  app.get("/exams/:id", {
    schema: {
      tags: ["exams"],
      summary: "Get exam by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: examDetailResponseSchema },
    },
    handler: getExamController,
  });

  app.post("/exams", {
    schema: {
      tags: ["exams"],
      summary: "Create a new exam",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["courseId", "title", "durationMinutes", "totalMarks", "passMarks"],
        properties: {
          courseId: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1 },
          instructions: { type: "string" },
          durationMinutes: { type: "integer", minimum: 1 },
          totalMarks: { type: "integer", minimum: 1 },
          passMarks: { type: "integer", minimum: 0 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          randomizeQuestions: { type: "boolean", default: true },
          allowReview: { type: "boolean", default: false },
          attemptLimit: { type: "integer", minimum: 1, default: 1 },
        },
      },
      response: { 201: examResponseSchema },
    },
    handler: createExamController,
  });

  app.put("/exams/:id", {
    schema: {
      tags: ["exams"],
      summary: "Update exam",
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
          instructions: { type: "string" },
          durationMinutes: { type: "integer", minimum: 1 },
          totalMarks: { type: "integer", minimum: 1 },
          passMarks: { type: "integer", minimum: 0 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          randomizeQuestions: { type: "boolean" },
          allowReview: { type: "boolean" },
          attemptLimit: { type: "integer", minimum: 1 },
        },
      },
      response: { 200: examResponseSchema },
    },
    handler: updateExamController,
  });

  app.put("/exams/:id/publish", {
    schema: {
      tags: ["exams"],
      summary: "Publish exam",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: examResponseSchema },
    },
    handler: publishExamController,
  });

  app.put("/exams/:id/archive", {
    schema: {
      tags: ["exams"],
      summary: "Archive exam",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: examResponseSchema },
    },
    handler: archiveExamController,
  });

  app.get("/exams/:id/questions", {
    schema: {
      tags: ["exams"],
      summary: "List exam questions",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            required: ["questionId", "sequenceNo", "negativeMarks", "isMandatory"],
            properties: {
              questionId: { type: "string" },
              sequenceNo: { type: "integer" },
              marksOverride: { type: "integer", nullable: true },
              negativeMarks: { type: "integer" },
              isMandatory: { type: "boolean" },
            },
          },
        },
      },
    },
    handler: getExamQuestionsController,
  });

  app.post("/exams/:id/questions", {
    schema: {
      tags: ["exams"],
      summary: "Add question to exam",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["questionId", "sequenceNo"],
        properties: {
          questionId: { type: "string", format: "uuid" },
          sequenceNo: { type: "integer", minimum: 1 },
          marksOverride: { type: "integer", minimum: 0 },
          negativeMarks: { type: "integer", minimum: 0, default: 0 },
          isMandatory: { type: "boolean", default: true },
        },
      },
      response: { 201: {
        type: "object",
        required: ["questionId", "sequenceNo", "negativeMarks", "isMandatory"],
        properties: {
          questionId: { type: "string" },
          sequenceNo: { type: "integer" },
          marksOverride: { type: "integer", nullable: true },
          negativeMarks: { type: "integer" },
          isMandatory: { type: "boolean" },
        },
      }},
    },
    handler: addQuestionController,
  });

  app.delete("/exams/:id/questions/:questionId", {
    schema: {
      tags: ["exams"],
      summary: "Remove question from exam",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id", "questionId"],
        properties: {
          id: { type: "string", format: "uuid" },
          questionId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string" } },
        },
      },
    },
    handler: removeQuestionController,
  });

  app.put("/exams/:id/questions/reorder", {
    schema: {
      tags: ["exams"],
      summary: "Reorder exam questions",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["questionIds"],
        properties: {
          questionIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string" } },
        },
      },
    },
    handler: reorderQuestionsController,
  });
};
