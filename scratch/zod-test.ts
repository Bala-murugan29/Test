import { z } from 'zod';

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

const result = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  examId: "550e8400-e29b-41d4-a716-446655440001",
  studentUserId: "550e8400-e29b-41d4-a716-446655440002",
  attemptNo: 1,
  status: "IN_PROGRESS",
  startedAt: new Date().toISOString(),
  submittedAt: null,
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

try {
  sessionResponseSchema.parse(result);
  console.log("Validation passed for normal payload");
} catch (e) {
  console.error("Validation failed for normal payload", e);
}

const result2 = {
  ...result,
  startedAt: null,
  expiresAt: null
};

try {
  sessionResponseSchema.parse(result2);
  console.log("Validation passed for nulls");
} catch (e) {
  console.error("Validation failed for nulls", e);
}
