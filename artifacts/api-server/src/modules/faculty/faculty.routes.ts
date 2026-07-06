import type { FastifyPluginAsync } from "fastify";
import {
  listFacultyController,
  getFacultyController,
  createFacultyController,
  updateFacultyController,
  getCourseAssignmentsController,
  assignCourseController,
  unassignCourseController,
} from "./faculty.controller";

const facultyResponseSchema = {
  type: "object",
  required: ["userId", "employeeNumber", "designation", "department", "user", "createdAt"],
  properties: {
    userId: { type: "string" },
    employeeNumber: { type: "string" },
    designation: { type: "string" },
    specialization: { type: "string", nullable: true },
    hireDate: { type: "string", nullable: true },
    department: {
      type: "object",
      required: ["id", "code", "name"],
      properties: {
        id: { type: "string" },
        code: { type: "string" },
        name: { type: "string" },
      },
    },
    user: {
      type: "object",
      required: ["id", "email", "fullName", "status"],
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        fullName: { type: "string" },
        phone: { type: "string", nullable: true },
        status: { type: "string" },
      },
    },
    createdAt: { type: "string" },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: facultyResponseSchema },
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

const courseAssignmentResponseSchema = {
  type: "object",
  required: ["courseId", "courseCode", "courseTitle", "assignedAt"],
  properties: {
    courseId: { type: "string" },
    courseCode: { type: "string" },
    courseTitle: { type: "string" },
    assignedAt: { type: "string" },
    assignedByUserId: { type: "string", nullable: true },
  },
};

const messageResponseSchema = {
  type: "object",
  required: ["message"],
  properties: { message: { type: "string" } },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const facultyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/faculty", {
    schema: {
      tags: ["faculty"],
      summary: "List faculty members",
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
    handler: listFacultyController,
  });

  app.get("/faculty/:userId", {
    schema: {
      tags: ["faculty"],
      summary: "Get faculty member by user ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      response: { 200: facultyResponseSchema },
    },
    handler: getFacultyController,
  });

  app.post("/faculty", {
    schema: {
      tags: ["faculty"],
      summary: "Create faculty profile",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["userId", "departmentId", "employeeNumber", "designation"],
        properties: {
          userId: { type: "string", format: "uuid" },
          departmentId: { type: "string", format: "uuid" },
          employeeNumber: { type: "string", minLength: 1 },
          designation: { type: "string", minLength: 1 },
          specialization: { type: "string" },
          hireDate: { type: "string", format: "date-time" },
        },
      },
      response: { 201: facultyResponseSchema },
    },
    handler: createFacultyController,
  });

  app.put("/faculty/:userId", {
    schema: {
      tags: ["faculty"],
      summary: "Update faculty profile",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          designation: { type: "string", minLength: 1 },
          specialization: { type: "string" },
        },
      },
      response: { 200: facultyResponseSchema },
    },
    handler: updateFacultyController,
  });

  app.get("/faculty/:userId/courses", {
    schema: {
      tags: ["faculty"],
      summary: "List course assignments for faculty",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId"],
        properties: { userId: { type: "string", format: "uuid" } },
      },
      response: {
        200: { type: "array", items: courseAssignmentResponseSchema },
      },
    },
    handler: getCourseAssignmentsController,
  });

  app.post("/faculty/:userId/courses", {
    schema: {
      tags: ["faculty"],
      summary: "Assign course to faculty",
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
      response: { 200: messageResponseSchema },
    },
    handler: assignCourseController,
  });

  app.delete("/faculty/:userId/courses/:courseId", {
    schema: {
      tags: ["faculty"],
      summary: "Unassign course from faculty",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["userId", "courseId"],
        properties: {
          userId: { type: "string", format: "uuid" },
          courseId: { type: "string", format: "uuid" },
        },
      },
      response: { 200: messageResponseSchema },
    },
    handler: unassignCourseController,
  });
};
