import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(["MCQ", "CODING"]).optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  departmentId: z.string().uuid().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
});

const mcqOptionSchema = z.object({
  text: z.string().min(1),
});

const createMcqQuestionBodySchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().min(1).max(500),
  prompt: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  marks: z.number().int().min(1),
  timeLimitSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(mcqOptionSchema).min(2).max(10),
  correctOptionIndex: z.number().int().min(0),
  shuffleOptions: z.boolean().default(true),
  answerExplanation: z.string().optional(),
});

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().optional(),
});

const createCodingQuestionBodySchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().min(1).max(500),
  prompt: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  marks: z.number().int().min(1),
  timeLimitSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  starterCode: z.string().optional(),
  solutionTemplate: z.string().optional(),
  testCases: z.array(testCaseSchema).min(1),
  languageConstraints: z.array(z.string()).optional(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
});

const updateQuestionBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  prompt: z.string().min(1).optional(),
  explanation: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  marks: z.number().int().min(1).optional(),
  timeLimitSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

const updateQuestionStatusBodySchema = z.object({
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
});

const questionResponseSchema = z.object({
  id: z.string().uuid(),
  departmentId: z.string().uuid(),
  createdByUserId: z.string().uuid().nullable().optional(),
  type: z.string(),
  status: z.string(),
  title: z.string(),
  prompt: z.string(),
  explanation: z.string().nullable().optional(),
  difficulty: z.number(),
  marks: z.number(),
  timeLimitSeconds: z.number().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  mcq: z
    .object({
      options: z.array(z.object({ text: z.string() })),
      correctOptionIndex: z.number(),
      shuffleOptions: z.boolean(),
      answerExplanation: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  coding: z
    .object({
      starterCode: z.string().nullable().optional(),
      solutionTemplate: z.string().nullable().optional(),
      testCases: z.array(
        z.object({
          input: z.string(),
          expectedOutput: z.string(),
          isHidden: z.boolean().optional(),
        })
      ),
      languageConstraints: z.array(z.string()).nullable().optional(),
      sampleInput: z.string().nullable().optional(),
      sampleOutput: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const paginatedQuestionsSchema = z.object({
  data: z.array(questionResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateMcqQuestionBody = z.infer<typeof createMcqQuestionBodySchema>;
export type CreateCodingQuestionBody = z.infer<typeof createCodingQuestionBodySchema>;
export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>;
export type UpdateQuestionStatusBody = z.infer<typeof updateQuestionStatusBodySchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type PaginatedQuestions = z.infer<typeof paginatedQuestionsSchema>;

export {
  paginationQuerySchema,
  createMcqQuestionBodySchema,
  createCodingQuestionBodySchema,
  updateQuestionBodySchema,
  updateQuestionStatusBodySchema,
  questionResponseSchema,
  paginatedQuestionsSchema,
};
