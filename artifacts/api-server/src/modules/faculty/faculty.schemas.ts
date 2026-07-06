import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
});

const createFacultyBodySchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid(),
  employeeNumber: z.string().min(1).max(50),
  designation: z.string().min(1).max(100),
  specialization: z.string().max(255).optional(),
  hireDate: z.string().datetime().optional(),
});

const updateFacultyBodySchema = z.object({
  designation: z.string().min(1).max(100).optional(),
  specialization: z.string().max(255).optional(),
});

const assignCourseBodySchema = z.object({
  courseId: z.string().uuid(),
});

const facultyResponseSchema = z.object({
  userId: z.string().uuid(),
  employeeNumber: z.string(),
  designation: z.string(),
  specialization: z.string().nullable().optional(),
  hireDate: z.string().datetime().nullable().optional(),
  department: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  }),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    phone: z.string().nullable().optional(),
    status: z.string(),
  }),
  createdAt: z.string().datetime(),
});

const paginatedFacultySchema = z.object({
  data: z.array(facultyResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const courseAssignmentSchema = z.object({
  courseId: z.string().uuid(),
  courseCode: z.string(),
  courseTitle: z.string(),
  assignedAt: z.string().datetime(),
  assignedByUserId: z.string().uuid().nullable().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateFacultyBody = z.infer<typeof createFacultyBodySchema>;
export type UpdateFacultyBody = z.infer<typeof updateFacultyBodySchema>;
export type AssignCourseBody = z.infer<typeof assignCourseBodySchema>;
export type FacultyResponse = z.infer<typeof facultyResponseSchema>;
export type PaginatedFaculty = z.infer<typeof paginatedFacultySchema>;
export type CourseAssignment = z.infer<typeof courseAssignmentSchema>;

export {
  paginationQuerySchema,
  createFacultyBodySchema,
  updateFacultyBodySchema,
  assignCourseBodySchema,
  facultyResponseSchema,
  paginatedFacultySchema,
  courseAssignmentSchema,
};
