import type { FastifyPluginAsync } from "fastify";
import {
  getSummaryController,
  getDepartmentStatsController,
  getExamPerformanceController,
  getMonthlyStatsController,
  getStudentPerformanceController,
  getExamAnalyticsController,
} from "./analytics.controller";

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/analytics/summary", {
    schema: {
      tags: ["analytics"],
      summary: "Get platform-wide analytics summary",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          required: [
            "totalStudents",
            "totalFaculty",
            "totalExams",
            "avgPassRate",
            "activeExams",
            "examsConductedThisMonth",
          ],
          properties: {
            totalStudents: { type: "integer" },
            totalFaculty: { type: "integer" },
            totalExams: { type: "integer" },
            avgPassRate: { type: "number" },
            activeExams: { type: "integer" },
            examsConductedThisMonth: { type: "integer" },
          },
        },
      },
    },
    handler: getSummaryController,
  });

  app.get("/analytics/departments", {
    schema: {
      tags: ["analytics"],
      summary: "Get department-wise analytics",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            required: ["departmentId", "departmentName", "totalStudents", "avgScore", "passRate"],
            properties: {
              departmentId: { type: "string" },
              departmentName: { type: "string" },
              totalStudents: { type: "integer" },
              avgScore: { type: "number" },
              passRate: { type: "number" },
            },
          },
        },
      },
    },
    handler: getDepartmentStatsController,
  });

  app.get("/analytics/exams", {
    schema: {
      tags: ["analytics"],
      summary: "Get exam-wise performance analytics",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            required: ["examId", "examTitle", "avgScore", "passRate", "totalAppeared"],
            properties: {
              examId: { type: "string" },
              examTitle: { type: "string" },
              avgScore: { type: "number" },
              passRate: { type: "number" },
              totalAppeared: { type: "integer" },
            },
          },
        },
      },
    },
    handler: getExamPerformanceController,
  });

  app.get("/analytics/monthly", {
    schema: {
      tags: ["analytics"],
      summary: "Get monthly analytics trends",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          year: { type: "integer", default: 2026 },
        },
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            required: ["month", "examsCreated", "studentsAppeared", "avgScore"],
            properties: {
              month: { type: "string" },
              examsCreated: { type: "integer" },
              studentsAppeared: { type: "integer" },
              avgScore: { type: "number" },
            },
          },
        },
      },
    },
    handler: getMonthlyStatsController,
  });

  app.get("/analytics/students/:studentUserId", {
    schema: {
      tags: ["analytics"],
      summary: "Get student performance analytics",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["studentUserId"],
        properties: {
          studentUserId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["totalExamsTaken", "avgScore", "bestScore", "passRate", "recentResults"],
          properties: {
            totalExamsTaken: { type: "integer" },
            avgScore: { type: "number" },
            bestScore: { type: "number" },
            passRate: { type: "number" },
            recentResults: {
              type: "array",
              items: {
                type: "object",
                required: ["examId", "examTitle", "score", "maxScore", "percentage", "passed", "takenAt"],
                properties: {
                  examId: { type: "string" },
                  examTitle: { type: "string" },
                  score: { type: "number" },
                  maxScore: { type: "number" },
                  percentage: { type: "number" },
                  passed: { type: "boolean" },
                  takenAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    handler: getStudentPerformanceController,
  });

  app.get("/analytics/exams/:examId", {
    schema: {
      tags: ["analytics"],
      summary: "Get single exam analytics",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["examId"],
        properties: {
          examId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          required: [
            "examId",
            "examTitle",
            "totalAppeared",
            "totalCompleted",
            "avgScore",
            "passRate",
            "distribution",
          ],
          properties: {
            examId: { type: "string" },
            examTitle: { type: "string" },
            totalAppeared: { type: "integer" },
            totalCompleted: { type: "integer" },
            avgScore: { type: "number" },
            passRate: { type: "number" },
            distribution: {
              type: "object",
              properties: {
                "0-20": { type: "integer" },
                "21-40": { type: "integer" },
                "41-60": { type: "integer" },
                "61-80": { type: "integer" },
                "81-100": { type: "integer" },
              },
            },
          },
        },
      },
    },
    handler: getExamAnalyticsController,
  });
};
