import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
});

const createStudentBodySchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  studentNumber: z.string().min(1).max(50),
  admissionYear: z.number().int().min(2000).max(2100),
  currentSemester: z.number().int().min(1).max(12),
  gpa: z.number().min(0).max(4).optional(),
});

const updateStudentBodySchema = z.object({
  departmentId: z.string().uuid().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  gpa: z.number().min(0).max(4).optional(),
});

const enrollBodySchema = z.object({
  courseId: z.string().uuid(),
});

const studentResponseSchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid().nullable().optional(),
  studentNumber: z.string(),
  admissionYear: z.number(),
  currentSemester: z.number(),
  gpa: z.number().nullable().optional(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    phone: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string().datetime(),
  }),
  department: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  }).nullable().optional(),
  createdAt: z.string().datetime(),
});

const paginatedStudentsSchema = z.object({
  data: z.array(studentResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const enrollmentResponseSchema = z.object({
  courseId: z.string().uuid(),
  studentUserId: z.string().uuid(),
  enrolledAt: z.string().datetime(),
  status: z.string(),
  course: z.object({
    id: z.string().uuid(),
    code: z.string(),
    title: z.string(),
    credits: z.number(),
  }),
});

const resultResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  obtainedMarks: z.number(),
  maxMarks: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  grade: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  evaluatedAt: z.string().datetime(),
  session: z.object({
    examId: z.string().uuid(),
    attemptNo: z.number(),
    exam: z.object({
      title: z.string(),
      courseId: z.string().uuid(),
    }),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateStudentBody = z.infer<typeof createStudentBodySchema>;
export type UpdateStudentBody = z.infer<typeof updateStudentBodySchema>;
export type EnrollBody = z.infer<typeof enrollBodySchema>;
export type StudentResponse = z.infer<typeof studentResponseSchema>;
export type PaginatedStudents = z.infer<typeof paginatedStudentsSchema>;
export type EnrollmentResponse = z.infer<typeof enrollmentResponseSchema>;
export type ResultResponse = z.infer<typeof resultResponseSchema>;

export {
  paginationQuerySchema,
  createStudentBodySchema,
  updateStudentBodySchema,
  enrollBodySchema,
  studentResponseSchema,
  paginatedStudentsSchema,
  enrollmentResponseSchema,
  resultResponseSchema,
};
