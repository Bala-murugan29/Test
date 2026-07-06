import { createServer } from "node:net";
import { spawn } from "node:child_process";

const workspaceRoot = new URL("..", import.meta.url);
const defaultPort = Number(process.env.PORT ?? 3000);
const basePath = process.env.BASE_PATH ?? "/";
const maxPort = Number(process.env.DEV_MAX_PORT ?? 3100);

async function isPortFree(port) {
  return await new Promise((resolve) => {
    const server = createServer();

    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort(startPort) {
  for (let port = startPort; port <= maxPort; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(
    `Unable to find a free port between ${startPort} and ${maxPort}`,
  );
}

async function main() {
  const port = await findPort(defaultPort);
  const env = {
    ...process.env,
    PORT: String(port),
    BASE_PATH: basePath,
  };

  const child =
    process.platform === "win32"
      ? spawn(
          process.env.ComSpec ?? "cmd.exe",
          [
            "/d",
            "/s",
            "/c",
            "corepack pnpm --filter @workspace/exam-platform run dev",
          ],
          {
            cwd: workspaceRoot,
            stdio: "inherit",
            env,
          },
        )
      : spawn(
          "corepack",
          ["pnpm", "--filter", "@workspace/exam-platform", "run", "dev"],
          {
            cwd: workspaceRoot,
            stdio: "inherit",
            env,
          },
        );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});