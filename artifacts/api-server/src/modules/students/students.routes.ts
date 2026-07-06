import type { FastifyPluginAsync } from "fastify";
import {
  listStudentsController,
  getStudentController,
  createStudentController,
  updateStudentController,
  getEnrollmentsController,
  enrollStudentController,
  dropEnrollmentController,
  getStudentResultsController,
} from "./students.controller";

const studentResponseSchema = {
  type: "object",
  required: ["userId", "departmentId", "studentNumber", "admissionYear", "currentSemester", "user", "department", "createdAt"],
  properties: {
    userId: { type: "string" },
    departmentId: { type: "string" },
    studentNumber: { type: "string" },
    admissionYear: { type: "integer" },
    currentSemester: { type: "integer" },
    gpa: { type: "number", nullable: true },
    user: {
      type: "object",
      required: ["id", "email", "fullName", "status", "createdAt"],
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        fullName: { type: "string" },
        phone: { type: "string", nullable: true },
        status: { type: "string" },
        createdAt: { type: "string" },
      },
    },
    department: {
      type: "object",
      required: ["id", "code", "name"],
      properties: {
        id: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
      },
    },
    createdAt: { type: "string" },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: studentResponseSchema },
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

const enrollmentResponseSchema = {
  type: "object",
  required: ["courseId", "studentUserId", "enrolledAt", "status", "course"],
  properties: {
    courseId: { type: "string" },
    studentUserId: { type: "string" },
    enrolledAt: { type: "string" },
    status: { type: "string" },
    course: {
      type: "object",
      required: ["id", "code", "title", "credits"],
      properties: {
        id: { type: "string" },
        code: { type: "string" },
        title: { type: "string" },
        credits: { type: "integer" },
      },
    },
  },
};

const resultResponseSchema = {
  type: "object",
  required: ["id", "sessionId", "obtainedMarks", "maxMarks", "percentage", "passed", "evaluatedAt", "session"],
  properties: {
    id: { type: "string" },
    sessionId: { type: "string" },
    obtainedMarks: { type: "integer" },
    maxMarks: { type: "integer" },
    percentage: { type: "number" },
    passed: { type: "boolean" },
    grade: { type: "string", nullable: true },
    remarks: { type: "string", nullable: true },
    evaluatedAt: { type: "string" },
    session: {
      type: "object",
      required: ["examId", "attemptNo", "exam"],
      properties: {
        examId: { type: "string" },
        attemptNo: { type: "integer" },
        exam: {
          type: "object",
          required: ["title", "courseId"],
          properties: {
            title: { type: "string" },
            courseId: { type: "string" },
          },
        },
      },
    },
  },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const studentsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/students", {
    schema: {
      tags: ["students"],
      summary: "List students",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" },
          departmentId: { type: "string", format: "uuid" },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    handler: listStudentsController,
  });

  app.get("/students/:userId", {
    schema: {
      tags: ["students"],
      summary: "Get student by user ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      response: { 200: studentResponseSchema },
    },
    handler: getStudentController,
  });

  app.post("/students", {
    schema: {
      tags: ["students"],
      summary: "Create a student profile",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["userId", "departmentId", "studentNumber", "admissionYear", "currentSemester"],
        properties: {
          userId: { type: "string", format: "uuid" },
          departmentId: { type: "string", format: "uuid" },
          studentNumber: { type: "string", minLength: 1 },
          admissionYear: { type: "integer" },
          currentSemester: { type: "integer" },
          gpa: { type: "number" },
        },
      },
      response: { 201: studentResponseSchema },
    },
    handler: createStudentController,
  });

  app.put("/students/:userId", {
    schema: {
      tags: ["students"],
      summary: "Update student profile",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          departmentId: { type: "string", format: "uuid" },
          currentSemester: { type: "integer" },
          gpa: { type: "number" },
        },
      },
      response: { 200: studentResponseSchema },
    },
    handler: updateStudentController,
  });

  app.get("/students/:userId/enrollments", {
    schema: {
      tags: ["students"],
      summary: "List student enrollments",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "array",
          items: enrollmentResponseSchema,
        },
      },
    },
    handler: getEnrollmentsController,
  });

  app.post("/students/:userId/enrollments", {
    schema: {
      tags: ["students"],
      summary: "Enroll student in a course",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["courseId"],
        properties: {
          courseId: { type: "string", format: "uuid" },
        },
      },
      response: { 201: enrollmentResponseSchema },
    },
    handler: enrollStudentController,
  });

  app.delete("/students/:userId/enrollments/:courseId", {
    schema: {
      tags: ["students"],
      summary: "Drop student enrollment",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId", "courseId"],
        properties: {
          userId: { type: "string", format: "uuid" },
          courseId: { type: "string", format: "uuid" },
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
    handler: dropEnrollmentController,
  });

  // Duplicate — results module registers GET /students/:studentUserId/results
};
