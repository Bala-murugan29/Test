import { z } from "zod";

const examStatusEnum = z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "ARCHIVED"]);

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: examStatusEnum.optional(),
  courseId: z.string().uuid().optional(),
});

const createExamBodySchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(255),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1),
  totalMarks: z.number().int().min(1),
  passMarks: z.number().int().min(0),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  randomizeQuestions: z.boolean().default(true),
  allowReview: z.boolean().default(false),
  attemptLimit: z.number().int().min(1).default(1),
});

const updateExamBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  totalMarks: z.number().int().min(1).optional(),
  passMarks: z.number().int().min(0).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  randomizeQuestions: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  attemptLimit: z.number().int().min(1).optional(),
});

const addQuestionBodySchema = z.object({
  questionId: z.string().uuid(),
  sequenceNo: z.number().int().min(1),
  marksOverride: z.number().int().min(0).optional(),
  negativeMarks: z.number().int().min(0).default(0),
  isMandatory: z.boolean().default(true),
});

const reorderQuestionsBodySchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
});

const examListItemSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.string().nullable().optional(),
  title: z.string(),
  instructions: z.string().nullable().optional(),
  durationMinutes: z.number(),
  totalMarks: z.number(),
  passMarks: z.number(),
  status: z.string(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  randomizeQuestions: z.boolean(),
  allowReview: z.boolean(),
  attemptLimit: z.number(),
  publishedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const examQuestionSchema = z.object({
  questionId: z.string().uuid(),
  sequenceNo: z.number(),
  marksOverride: z.number().nullable().optional(),
  negativeMarks: z.number(),
  isMandatory: z.boolean(),
});

const examDetailSchema = examListItemSchema.extend({
  questions: z.array(examQuestionSchema),
});

const paginatedExamsSchema = z.object({
  data: z.array(examListItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateExamBody = z.infer<typeof createExamBodySchema>;
export type UpdateExamBody = z.infer<typeof updateExamBodySchema>;
export type AddQuestionBody = z.infer<typeof addQuestionBodySchema>;
export type ReorderQuestionsBody = z.infer<typeof reorderQuestionsBodySchema>;
export type ExamListItem = z.infer<typeof examListItemSchema>;
export type ExamDetail = z.infer<typeof examDetailSchema>;
export type PaginatedExams = z.infer<typeof paginatedExamsSchema>;

export {
  paginationQuerySchema,
  createExamBodySchema,
  updateExamBodySchema,
  addQuestionBodySchema,
  reorderQuestionsBodySchema,
  examListItemSchema,
  examDetailSchema,
  paginatedExamsSchema,
};
