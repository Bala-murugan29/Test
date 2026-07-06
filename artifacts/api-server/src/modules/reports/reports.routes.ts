import type { FastifyPluginAsync } from "fastify";
import {
  getExamReportController,
  getStudentReportController,
  getDepartmentReportController,
  exportExamResultsController,
  exportStudentResultsController,
} from "./reports.controller";

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

const examReportSchema = {
  type: "object",
  required: [
    "examId",
    "examTitle",
    "totalStudents",
    "appeared",
    "passed",
    "avgScore",
    "medianScore",
    "passRate",
    "scoreDistribution",
    "questionWiseAnalysis",
  ],
  properties: {
    examId: { type: "string", format: "uuid" },
    examTitle: { type: "string" },
    totalStudents: { type: "integer" },
    appeared: { type: "integer" },
    passed: { type: "integer" },
    avgScore: { type: "number" },
    medianScore: { type: "number" },
    passRate: { type: "number" },
    scoreDistribution: {
      type: "array",
      items: {
        type: "object",
        required: ["range", "count"],
        properties: {
          range: { type: "string" },
          count: { type: "integer" },
        },
      },
    },
    questionWiseAnalysis: {
      type: "array",
      items: {
        type: "object",
        required: [
          "questionId",
          "title",
          "type",
          "totalAttempts",
          "correctAttempts",
          "avgMarks",
          "maxMarks",
          "correctRate",
        ],
        properties: {
          questionId: { type: "string", format: "uuid" },
          title: { type: "string" },
          type: { type: "string" },
          totalAttempts: { type: "integer" },
          correctAttempts: { type: "integer" },
          avgMarks: { type: "number" },
          maxMarks: { type: "integer" },
          correctRate: { type: "number" },
        },
      },
    },
  },
};

const studentReportSchema = {
  type: "object",
  required: [
    "studentUserId",
    "studentName",
    "totalExamsTaken",
    "avgScore",
    "passRate",
    "results",
  ],
  properties: {
    studentUserId: { type: "string", format: "uuid" },
    studentName: { type: "string" },
    totalExamsTaken: { type: "integer" },
    avgScore: { type: "number" },
    passRate: { type: "number" },
    results: {
      type: "array",
      items: {
        type: "object",
        required: [
          "examId",
          "examTitle",
          "obtainedMarks",
          "maxMarks",
          "percentage",
          "passed",
          "grade",
          "attemptedAt",
        ],
        properties: {
          examId: { type: "string", format: "uuid" },
          examTitle: { type: "string" },
          obtainedMarks: { type: "integer" },
          maxMarks: { type: "integer" },
          percentage: { type: "number" },
          passed: { type: "boolean" },
          grade: { type: "string", nullable: true },
          attemptedAt: { type: "string" },
        },
      },
    },
  },
};

const departmentReportSchema = {
  type: "object",
  required: [
    "departmentId",
    "departmentName",
    "totalStudents",
    "totalFaculty",
    "totalCourses",
    "avgScore",
    "passRate",
  ],
  properties: {
    departmentId: { type: "string", format: "uuid" },
    departmentName: { type: "string" },
    totalStudents: { type: "integer" },
    totalFaculty: { type: "integer" },
    totalCourses: { type: "integer" },
    avgScore: { type: "number" },
    passRate: { type: "number" },
  },
};

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/reports/exam/:examId", {
    schema: {
      tags: ["reports"],
      summary: "Get exam report",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["examId"],
        properties: { examId: { type: "string", format: "uuid" } },
      },
      response: { 200: examReportSchema },
    },
    handler: getExamReportController,
  });

  app.get("/reports/student/:studentUserId", {
    schema: {
      tags: ["reports"],
      summary: "Get student report",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["studentUserId"],
        properties: { studentUserId: { type: "string", format: "uuid" } },
      },
      response: { 200: studentReportSchema },
    },
    handler: getStudentReportController,
  });

  app.get("/reports/department/:departmentId", {
    schema: {
      tags: ["reports"],
      summary: "Get department report",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["departmentId"],
        properties: { departmentId: { type: "string", format: "uuid" } },
      },
      response: { 200: departmentReportSchema },
    },
    handler: getDepartmentReportController,
  });

  app.get("/reports/export/exam/:examId", {
    schema: {
      tags: ["reports"],
      summary: "Export exam results as CSV",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["examId"],
        properties: { examId: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["csv"], default: "csv" },
        },
      },
    },
    handler: exportExamResultsController,
  });

  app.get("/reports/export/student/:studentUserId", {
    schema: {
      tags: ["reports"],
      summary: "Export student results as CSV",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["studentUserId"],
        properties: { studentUserId: { type: "string", format: "uuid" } },
      },
      querystring: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["csv"], default: "csv" },
        },
      },
    },
    handler: exportStudentResultsController,
  });
};
