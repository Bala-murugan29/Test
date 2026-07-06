import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

const createDepartmentBodySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateDepartmentBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

const createCourseBodySchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(10),
  level: z.number().int().min(1).max(10).optional(),
});

const departmentResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  _count: z
    .object({
      students: z.number(),
      faculty: z.number(),
      courses: z.number(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const courseResponseSchema = z.object({
  id: z.string().uuid(),
  departmentId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  credits: z.number(),
  level: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const paginatedDepartmentsSchema = z.object({
  data: z.array(departmentResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const departmentStatsResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  studentCount: z.number(),
  facultyCount: z.number(),
  courseCount: z.number(),
  examCount: z.number(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateDepartmentBody = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentBodySchema>;
export type CreateCourseBody = z.infer<typeof createCourseBodySchema>;
export type DepartmentResponse = z.infer<typeof departmentResponseSchema>;
export type CourseResponse = z.infer<typeof courseResponseSchema>;
export type PaginatedDepartments = z.infer<typeof paginatedDepartmentsSchema>;
export type DepartmentStatsResponse = z.infer<typeof departmentStatsResponseSchema>;

export {
  paginationQuerySchema,
  createDepartmentBodySchema,
  updateDepartmentBodySchema,
  createCourseBodySchema,
  departmentResponseSchema,
  courseResponseSchema,
  paginatedDepartmentsSchema,
  departmentStatsResponseSchema,
};
