import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
  dependencies: z.object({
    database: z.literal("ok"),
    cache: z.literal("ok"),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;