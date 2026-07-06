import { z } from "zod";

export const getSettingsCategoryQuerySchema = z.object({
  category: z.string().min(1).optional(),
});

export const updateSettingsCategoryBodySchema = z.object({
  values: z.record(z.unknown()).refine((obj) => Object.keys(obj).length >= 1, "Must have at least 1 key"),
});

export const settingResponseSchema = z.object({
  category: z.string(),
  key: z.string(),
  value: z.unknown(),
  description: z.string().nullable(),
  updatedAt: z.string(),
});

export const settingsCategoryResponseSchema = z.object({
  category: z.string(),
  settings: z.array(settingResponseSchema),
});

export type GetSettingsCategoryQuery = z.infer<typeof getSettingsCategoryQuerySchema>;
export type UpdateSettingsCategoryBody = z.infer<typeof updateSettingsCategoryBodySchema>;
export type SettingResponse = z.infer<typeof settingResponseSchema>;
export type SettingsCategoryResponse = z.infer<typeof settingsCategoryResponseSchema>;
