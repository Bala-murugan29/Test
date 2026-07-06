import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  examId: z.string().uuid().optional(),
  studentUserId: z.string().uuid().optional(),
  passed: z.coerce.boolean().optional(),
});

const evaluateResultBodySchema = z.object({
  remarks: z.string().max(1000).optional(),
});

const issueCertificateBodySchema = z.object({});

const resultResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  obtainedMarks: z.number().int(),
  maxMarks: z.number().int(),
  percentage: z.number(),
  passed: z.boolean(),
  grade: z.string().nullable(),
  remarks: z.string().nullable(),
  breakdown: z.any().nullable(),
  evaluatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

const certificateResponseSchema = z.object({
  id: z.string().uuid(),
  resultId: z.string().uuid(),
  certificateNumber: z.string(),
  verificationCode: z.string(),
  issuedAt: z.string().datetime(),
  status: z.string(),
  pdfUrl: z.string().nullable(),
});

const paginatedResultsSchema = z.object({
  data: z.array(resultResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type EvaluateResultBody = z.infer<typeof evaluateResultBodySchema>;
export type IssueCertificateBody = z.infer<typeof issueCertificateBodySchema>;
export type ResultResponse = z.infer<typeof resultResponseSchema>;
export type CertificateResponse = z.infer<typeof certificateResponseSchema>;
export type PaginatedResults = z.infer<typeof paginatedResultsSchema>;

export {
  paginationQuerySchema,
  evaluateResultBodySchema,
  issueCertificateBodySchema,
  resultResponseSchema,
  certificateResponseSchema,
  paginatedResultsSchema,
};
