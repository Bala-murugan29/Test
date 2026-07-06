import { buildApp, startApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = buildApp();

  try {
    await startApp(app);
  } catch (error) {
    app.log.error({ err: error }, "Server failed to start");
    process.exit(1);
  }

  app.log.info(
    { host: env.HOST, port: env.PORT },
    "Server listening",
  );
}

void main();
