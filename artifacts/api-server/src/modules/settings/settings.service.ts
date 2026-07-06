import type { FastifyInstance } from "fastify";
import * as settingsRepo from "./settings.repository";
import type {
  SettingResponse,
  SettingsCategoryResponse,
  UpdateSettingsCategoryBody,
} from "./settings.schemas";

function formatSetting(s: {
  category: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: Date;
}): SettingResponse {
  return {
    category: s.category,
    key: s.key,
    value: s.value,
    description: s.description,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function getAllSettings(app: FastifyInstance): Promise<SettingsCategoryResponse[]> {
  const settings = await settingsRepo.findAllSettings(app);
  const grouped = new Map<string, SettingResponse[]>();

  for (const s of settings) {
    const arr = grouped.get(s.category) ?? [];
    arr.push(formatSetting(s));
    grouped.set(s.category, arr);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    settings: items,
  }));
}

export async function getSettingsByCategory(
  app: FastifyInstance,
  category: string,
): Promise<SettingsCategoryResponse> {
  const settings = await settingsRepo.findSettingsByCategory(app, category);
  return {
    category,
    settings: settings.map(formatSetting),
  };
}

export async function updateSettingsCategory(
  app: FastifyInstance,
  category: string,
  body: UpdateSettingsCategoryBody,
  userId: string,
): Promise<SettingsCategoryResponse> {
  for (const [key, value] of Object.entries(body.values)) {
    await settingsRepo.upsertSetting(app, category, key, value, null, userId);
  }

  return getSettingsByCategory(app, category);
}
