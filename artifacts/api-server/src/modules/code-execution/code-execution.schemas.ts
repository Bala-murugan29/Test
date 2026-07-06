import { z } from "zod";

export const runCodeBodySchema = z.object({
  language: z.string().min(1),
  sourceCode: z.string().min(1),
  stdin: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      }),
    )
    .optional(),
});

export const codeRunResponseSchema = z.object({
  id: z.string(),
  language: z.string(),
  sourceCode: z.string(),
  stdin: z.string().nullable(),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  status: z.string(),
  executionTimeMs: z.number().nullable(),
  createdAt: z.string(),
});

export type RunCodeBody = z.infer<typeof runCodeBodySchema>;
export type CodeRunResponse = z.infer<typeof codeRunResponseSchema>;
