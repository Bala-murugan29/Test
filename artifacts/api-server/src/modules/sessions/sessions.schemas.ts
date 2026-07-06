import { z } from "zod";

const createSessionBodySchema = z.object({
  examId: z.string().uuid(),
});

const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  studentUserId: z.string().uuid(),
  attemptNo: z.number().int(),
  status: z.string(),
  startedAt: z.string().datetime().nullable().optional(),
  submittedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

const sessionAnswerResponseSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  answerText: z.string().nullable().optional(),
  selectedOptionIndex: z.number().int().nullable().optional(),
  codeAnswer: z.string().nullable().optional(),
  submittedAt: z.string().datetime(),
});

const sessionDetailResponseSchema = sessionResponseSchema.extend({
  answers: z.array(sessionAnswerResponseSchema),
});

const paginatedSessionsSchema = z.object({
  data: z.array(sessionResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type SessionDetailResponse = z.infer<typeof sessionDetailResponseSchema>;
export type SessionAnswerResponse = z.infer<typeof sessionAnswerResponseSchema>;
export type PaginatedSessions = z.infer<typeof paginatedSessionsSchema>;

export {
  createSessionBodySchema,
  sessionResponseSchema,
  sessionDetailResponseSchema,
  sessionAnswerResponseSchema,
  paginatedSessionsSchema,
};
