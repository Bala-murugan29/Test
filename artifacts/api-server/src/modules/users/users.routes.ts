import type { FastifyPluginAsync } from "fastify";
import {
  listUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  updateUserStatusController,
  deleteUserController,
  assignRoleController,
  removeRoleController,
  getUserRolesController,
} from "./users.controller";

const userResponseSchema = {
  type: "object",
  required: ["id", "email", "fullName", "status", "roles", "createdAt"],
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    fullName: { type: "string" },
    phone: { type: "string", nullable: true },
    status: { type: "string" },
    roles: { type: "array", items: { type: "string" } },
    createdAt: { type: "string" },
  },
};

const paginatedResponseSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: { type: "array", items: userResponseSchema },
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

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", jwtPreHandler);

  app.get("/users", {
    schema: {
      tags: ["users"],
      summary: "List users",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          search: { type: "string" },
          role: { type: "string", enum: ["student", "faculty", "admin"] },
          status: { type: "string", enum: ["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"] },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    handler: listUsersController,
  });

  app.get("/users/:id", {
    schema: {
      tags: ["users"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: { 200: userResponseSchema },
    },
    handler: getUserByIdController,
  });

  app.post("/users", {
    schema: {
      tags: ["users"],
      summary: "Create a new user",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["email", "password", "fullName", "role"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          fullName: { type: "string", minLength: 1 },
          phone: { type: "string" },
          role: { type: "string", enum: ["student", "faculty", "admin"] },
        },
      },
      response: { 201: userResponseSchema },
    },
    handler: createUserController,
  });

  app.put("/users/:id", {
    schema: {
      tags: ["users"],
      summary: "Update user",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          fullName: { type: "string", minLength: 1 },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      response: { 200: userResponseSchema },
    },
    handler: updateUserController,
  });

  app.put("/users/:id/status", {
    schema: {
      tags: ["users"],
      summary: "Update user status",
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
          status: { type: "string", enum: ["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"] },
        },
      },
      response: { 200: userResponseSchema },
    },
    handler: updateUserStatusController,
  });

  app.delete("/users/:id", {
    schema: {
      tags: ["users"],
      summary: "Delete user",
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
    handler: deleteUserController,
  });

  app.get("/users/:id/roles", {
    schema: {
      tags: ["users"],
      summary: "Get user roles",
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
            required: ["roleId", "key", "name", "assignedAt"],
            properties: {
              roleId: { type: "string" },
              key: { type: "string" },
              name: { type: "string" },
              assignedAt: { type: "string" },
            },
          },
        },
      },
    },
    handler: getUserRolesController,
  });

  app.post("/users/:id/roles", {
    schema: {
      tags: ["users"],
      summary: "Assign role to user",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["student", "faculty", "admin"] },
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
    handler: assignRoleController,
  });

  app.delete("/users/:id/roles/:roleId", {
    schema: {
      tags: ["users"],
      summary: "Remove role from user",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id", "roleId"],
        properties: {
          id: { type: "string", format: "uuid" },
          roleId: { type: "string", format: "uuid" },
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
    handler: removeRoleController,
  });
};
