import type { FastifyPluginAsync } from "fastify";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  meController,
  changePasswordController,
} from "./auth.controller";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", {
    schema: {
      tags: ["auth"],
      summary: "Register a new user",
      body: {
        type: "object",
        required: ["email", "password", "fullName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          fullName: { type: "string", minLength: 1, maxLength: 255 },
          phone: { type: "string" },
          role: { type: "string", enum: ["student", "faculty", "admin"] },
        },
      },
      response: {
        201: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    handler: registerController,
  });

  app.post("/auth/login", {
    schema: {
      tags: ["auth"],
      summary: "Login with email and password",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["user", "accessToken", "refreshToken"],
          properties: {
            user: {
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
            },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
      },
    },
    handler: loginController,
  });

  app.post("/auth/refresh", {
    schema: {
      tags: ["auth"],
      summary: "Refresh access token",
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["user", "accessToken", "refreshToken"],
          properties: {
            user: {
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
            },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
      },
    },
    handler: refreshController,
  });

  app.post("/auth/logout", {
    schema: {
      tags: ["auth"],
      summary: "Logout and revoke refresh token",
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    handler: logoutController,
  });

  app.get("/auth/me", {
    preHandler: [async (req) => {
      await req.jwtVerify();
    }],
    schema: {
      tags: ["auth"],
      summary: "Get current user profile",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
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
        },
      },
    },
    handler: meController,
  });

  app.put("/auth/password", {
    preHandler: [async (req) => {
      await req.jwtVerify();
    }],
    schema: {
      tags: ["auth"],
      summary: "Change password",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      response: {
        200: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    handler: changePasswordController,
  });
};
