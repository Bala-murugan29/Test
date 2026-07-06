import type { FastifyReply, FastifyRequest } from "fastify";
import { getAllSettings, getSettingsByCategory, updateSettingsCategory as updateSettingsSvc } from "./settings.service";
import { settingsCategoryResponseSchema } from "./settings.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function getAllSettingsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await getAllSettings(request.server);
  return reply.code(200).send(settingsCategoryResponseSchema.array().parse(data));
}

export async function getSettingsCategoryController(
  request: FastifyRequest<{ Params: { category: string } }>,
  reply: FastifyReply,
) {
  const { category } = request.params;
  const data = await getSettingsByCategory(request.server, category);
  return reply.code(200).send(settingsCategoryResponseSchema.parse(data));
}

export async function updateSettingsCategoryController(
  request: FastifyRequest<{
    Params: { category: string };
    Body: { values: Record<string, unknown> };
  }>,
  reply: FastifyReply,
) {
  const userId = (request.user as { sub: string } | undefined)?.sub;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const { category } = request.params;
  const { values } = request.body;
  const data = await updateSettingsSvc(
    request.server,
    category,
    { values },
    userId,
  );
  return reply.code(200).send(settingsCategoryResponseSchema.parse(data));
}
