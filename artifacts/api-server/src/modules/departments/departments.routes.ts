import type { FastifyPluginAsync } from "fastify";
import {
  listDepartmentsController,
  getDepartmentController,
  createDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  getCoursesController,
  createCourseController,
  getDepartmentStatsController,
} from "./departments.controller";

const departmentResponseSchema = {
  type: "object",
  required: ["id", "code", "name", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    code: { type: "string" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    _count: {
      type: "object",
      properties: {
        students: { type: "integer" },
        faculty: { type: "integer" },
        courses: { type: "integer" },
      },
    },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const courseResponseSchema = {
  type: "object",
  required: ["id", "departmentId", "code", "title", "credits", "isActive", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    departmentId: { type: "string" },
    code: { type: "string" },
    title: { type: "string" },
    description: { type: "string", nullable: true },
    credits: { type: "integer" },
    level: { type: "integer", nullable: true },
    isActive: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const paginatedDepartmentsSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: departmentResponseSchema },
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

const departmentStatsSchema = {
  type: "object",
  required: ["id", "code", "name", "studentCount", "facultyCount", "courseCount", "examCount"],
  properties: {
    id: { type: "string" },
    code: { type: "string" },
    name: { type: "string" },
    studentCount: { type: "integer" },
    facultyCount: { type: "integer" },
    courseCount: { type: "integer" },
    examCount: { type: "integer" },
  },
};

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const departmentsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/departments", {
    schema: {
      tags: ["departments"],
      summary: "List departments",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" },
        },
      },
      response: { 200: paginatedDepartmentsSchema },
    },
    handler: listDepartmentsController,
  });

  app.get("/departments/:id", {
    schema: {
      tags: ["departments"],
      summary: "Get department by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: departmentResponseSchema },
    },
    handler: getDepartmentController,
  });

  app.post("/departments", {
    schema: {
      tags: ["departments"],
      summary: "Create a new department",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["code", "name"],
        properties: {
          code: { type: "string", minLength: 1, maxLength: 20 },
          name: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
        },
      },
      response: { 201: departmentResponseSchema },
    },
    handler: createDepartmentController,
  });

  app.put("/departments/:id", {
    schema: {
      tags: ["departments"],
      summary: "Update department",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
        },
      },
      response: { 200: departmentResponseSchema },
    },
    handler: updateDepartmentController,
  });

  app.delete("/departments/:id", {
    schema: {
      tags: ["departments"],
      summary: "Delete department",
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
    handler: deleteDepartmentController,
  });

  app.get("/departments/:id/courses", {
    schema: {
      tags: ["departments"],
      summary: "List courses in a department",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "array",
          items: courseResponseSchema,
        },
      },
    },
    handler: getCoursesController,
  });

  app.post("/departments/:id/courses", {
    schema: {
      tags: ["departments"],
      summary: "Create a course in a department",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["code", "title", "credits"],
        properties: {
          code: { type: "string", minLength: 1, maxLength: 20 },
          title: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
          credits: { type: "integer", minimum: 1, maximum: 10 },
          level: { type: "integer", minimum: 1, maximum: 10 },
        },
      },
      response: { 201: courseResponseSchema },
    },
    handler: createCourseController,
  });

  app.get("/departments/:id/stats", {
    schema: {
      tags: ["departments"],
      summary: "Get department statistics",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: departmentStatsSchema },
    },
    handler: getDepartmentStatsController,
  });
};
