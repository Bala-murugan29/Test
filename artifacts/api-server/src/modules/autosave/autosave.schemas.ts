import { z } from "zod";

const saveAnswerBodySchema = z.object({
  questionId: z.string().uuid(),
  answerText: z.string().optional(),
  selectedOptionIndex: z.number().int().min(0).optional(),
  codeAnswer: z.string().optional(),
  answerPayload: z.unknown().optional(),
});

const saveMultipleAnswersBodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answerText: z.string().optional(),
      selectedOptionIndex: z.number().int().min(0).optional(),
      codeAnswer: z.string().optional(),
      answerPayload: z.unknown().optional(),
    }),
  ),
});

const answerResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  answerText: z.string().nullable(),
  selectedOptionIndex: z.number().int().nullable(),
  codeAnswer: z.string().nullable(),
  answerPayload: z.unknown().nullable(),
  submittedAt: z.string().datetime(),
});

const sessionAnswersResponseSchema = z.object({
  data: z.array(answerResponseSchema),
});

export type SaveAnswerBody = z.infer<typeof saveAnswerBodySchema>;
export type SaveMultipleAnswersBody = z.infer<typeof saveMultipleAnswersBodySchema>;
export type AnswerResponse = z.infer<typeof answerResponseSchema>;
export type SessionAnswersResponse = z.infer<typeof sessionAnswersResponseSchema>;

export {
  saveAnswerBodySchema,
  saveMultipleAnswersBodySchema,
  answerResponseSchema,
  sessionAnswersResponseSchema,
};
