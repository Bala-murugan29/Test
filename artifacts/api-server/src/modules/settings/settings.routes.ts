import type { FastifyPluginAsync } from "fastify";
import {
  getAllSettingsController,
  getSettingsCategoryController,
  updateSettingsCategoryController,
} from "./settings.controller";

const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
  await req.jwtVerify();
};

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/settings", {
    preHandler: [jwtPreHandler],
    handler: getAllSettingsController,
  });

  app.get("/settings/:category", {
    preHandler: [jwtPreHandler],
    handler: getSettingsCategoryController,
  });

  app.put("/settings/:category", {
    preHandler: [jwtPreHandler],
    handler: updateSettingsCategoryController,
  });
};
