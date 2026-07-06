import type { FastifyPluginAsync } from "fastify";
import {
  listResultsController,
  getResultController,
  evaluateResultController,
  issueCertificateController,
  getCertificateController,
  getStudentResultsController,
  getExamResultsController,
} from "./results.controller";

const resultResponseSchema = {
  type: "object",
  required: ["id", "sessionId", "obtainedMarks", "maxMarks", "percentage", "passed", "evaluatedAt", "createdAt"],
  properties: {
    id: { type: "string" },
    sessionId: { type: "string" },
    obtainedMarks: { type: "integer" },
    maxMarks: { type: "integer" },
    percentage: { type: "number" },
    passed: { type: "boolean" },
    grade: { type: "string", nullable: true },
    remarks: { type: "string", nullable: true },
    breakdown: { type: "object", nullable: true },
    evaluatedAt: { type: "string" },
    createdAt: { type: "string" },
  },
};

const certificateResponseSchema = {
  type: "object",
  required: ["id", "resultId", "certificateNumber", "verificationCode", "issuedAt", "status"],
  properties: {
    id: { type: "string" },
    resultId: { type: "string" },
    certificateNumber: { type: "string" },
    verificationCode: { type: "string" },
    issuedAt: { type: "string" },
    status: { type: "string" },
    pdfUrl: { type: "string", nullable: true },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: resultResponseSchema },
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

export const resultsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/results", {
    schema: {
      tags: ["results"],
      summary: "List results",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          examId: { type: "string", format: "uuid" },
          studentUserId: { type: "string", format: "uuid" },
          passed: { type: "boolean" },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    handler: listResultsController,
  });

  app.get("/results/:id", {
    schema: {
      tags: ["results"],
      summary: "Get result by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: resultResponseSchema },
    },
    handler: getResultController,
  });

  app.post("/results/:id/evaluate", {
    schema: {
      tags: ["results"],
      summary: "Evaluate a result",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          remarks: { type: "string", maxLength: 1000 },
        },
      },
      response: { 200: resultResponseSchema },
    },
    handler: evaluateResultController,
  });

  app.post("/results/:id/certificate", {
    schema: {
      tags: ["results"],
      summary: "Issue certificate for result",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 201: certificateResponseSchema },
    },
    handler: issueCertificateController,
  });

  app.get("/results/:id/certificate", {
    schema: {
      tags: ["results"],
      summary: "Get certificate for result",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: certificateResponseSchema },
    },
    handler: getCertificateController,
  });

  app.get("/students/:studentUserId/results", {
    schema: {
      tags: ["results"],
      summary: "Get results for a student",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["studentUserId"],
        properties: { studentUserId: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "array",
          items: resultResponseSchema,
        },
      },
    },
    handler: getStudentResultsController,
  });

  app.get("/exams/:examId/results", {
    schema: {
      tags: ["results"],
      summary: "Get results for an exam",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["examId"],
        properties: { examId: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "array",
          items: resultResponseSchema,
        },
      },
    },
    handler: getExamResultsController,
  });
};
