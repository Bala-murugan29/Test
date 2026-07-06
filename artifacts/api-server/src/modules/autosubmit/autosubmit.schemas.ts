import { z } from "zod";

const expiredSessionItemSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  studentUserId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

const expiredSessionsResponseSchema = z.object({
  sessions: z.array(expiredSessionItemSchema),
});

const autoSubmitResponseSchema = z.object({
  sessionId: z.string().uuid(),
  autoSubmittedAt: z.string().datetime(),
  resultId: z.string().uuid(),
});

export type ExpiredSessionItem = z.infer<typeof expiredSessionItemSchema>;
export type ExpiredSessionsResponse = z.infer<typeof expiredSessionsResponseSchema>;
export type AutoSubmitResponse = z.infer<typeof autoSubmitResponseSchema>;

export {
  expiredSessionItemSchema,
  expiredSessionsResponseSchema,
  autoSubmitResponseSchema,
};
