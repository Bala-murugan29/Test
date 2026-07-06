import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["student", "faculty", "admin"]).optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"]).optional(),
});

const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(255),
  phone: z.string().optional(),
  role: z.enum(["student", "faculty", "admin"]),
});

const updateUserBodySchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const updateUserStatusBodySchema = z.object({
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"]),
});

const assignRoleBodySchema = z.object({
  role: z.enum(["student", "faculty", "admin"]),
});

const userListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  roles: z.array(z.string()),
  createdAt: z.string().datetime(),
});

const paginatedUsersSchema = z.object({
  data: z.array(userListItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
export type AssignRoleBody = z.infer<typeof assignRoleBodySchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;

export {
  paginationQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  assignRoleBodySchema,
  userListItemSchema,
  paginatedUsersSchema,
};
