import { networkInterfaces } from "node:os";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLanPath = path.join(root, ".env.lan");
const examplePath = path.join(root, ".env.lan.example");

function parseArgs(argv) {
  const args = { ip: null, detect: false, dev: false, docker: false, print: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--detect") args.detect = true;
    else if (arg === "--dev") args.dev = true;
    else if (arg === "--docker") args.docker = true;
    else if (arg === "--print") args.print = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (!arg.startsWith("-")) args.ip = arg;
  }
  if (!args.dev && !args.docker && !args.print && !args.help) {
    args.print = true;
  }
  return args;
}

function detectLanIp() {
  const nets = networkInterfaces();
  const candidates = [];

  for (const [name, entries] of Object.entries(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      candidates.push({ name, address: net.address });
    }
  }

  const wifiFirst = candidates.find((item) =>
    /wi-?fi|wlan|wireless/i.test(item.name),
  );
  return wifiFirst?.address ?? candidates[0]?.address ?? null;
}

function loadTemplate() {
  return readFileSync(examplePath, "utf8");
}

function writeLanEnv(ip) {
  const template = loadTemplate();
  const content = template.replace(/^LAN_HOST=.*$/m, `LAN_HOST=${ip}`);
  writeFileSync(envLanPath, content, "utf8");
  return content;
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function mergeEnv(...sources) {
  return Object.assign({}, ...sources);
}

function printInstructions(ip, mode) {
  const devUrl = `http://${ip}:3000`;
  const dockerUrl = `http://${ip}`;
  const apiUrl = `http://${ip}:5000/api/health`;

  console.log("\n=== LAN exam hosting ready ===\n");
  console.log(`LAN IP: ${ip}`);
  console.log(`Config: ${envLanPath}\n`);

  if (mode === "dev" || mode === "print") {
    console.log("Development (hot reload):");
    console.log(`  Students open: ${devUrl}`);
    console.log("  Start with:    pnpm run lan:dev\n");
  }

  if (mode === "docker" || mode === "print") {
    console.log("Docker (production-like):");
    console.log(`  Students open: ${dockerUrl}`);
    console.log("  Start with:    pnpm run lan:docker\n");
  }

  console.log("Health check (optional):");
  console.log(`  ${apiUrl}\n`);
  console.log("Tips:");
  console.log("  - All devices must be on the same WiFi.");
  console.log("  - Allow Node/Docker through Windows Firewall if students cannot connect.");
  console.log("  - Re-run with a new IP anytime: node scripts/lan.mjs 192.168.x.x\n");
}

function spawnProcess(command, args, env) {
  return spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
}

async function startDev(lanEnv) {
  const ip = lanEnv.LAN_HOST;
  const sharedEnv = mergeEnv(process.env, lanEnv, {
    HOST: "0.0.0.0",
    VITE_API_URL: "/api",
    BASE_PATH: "/",
  });

  console.log(`Starting LAN dev servers for ${ip} ...\n`);

  const apiEnv = mergeEnv(sharedEnv, {
    PORT: lanEnv.API_PORT ?? "5000",
    DATABASE_URL: lanEnv.DATABASE_URL ?? process.env.DATABASE_URL,
    REDIS_URL: lanEnv.REDIS_URL ?? process.env.REDIS_URL,
  });

  const api = spawnProcess("corepack", [
    "pnpm",
    "--filter",
    "@workspace/api-server",
    "run",
    "dev",
  ], apiEnv);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const frontendEnv = mergeEnv(sharedEnv, {
    PORT: lanEnv.PORT ?? "3000",
  });

  const frontend = spawnProcess("corepack", [
    "pnpm",
    "--filter",
    "@workspace/exam-platform",
    "run",
    "dev",
  ], frontendEnv);

  const shutdown = (signal) => {
    api.kill(signal);
    frontend.kill(signal);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  api.on("exit", (code) => {
    if (code && code !== 0) frontend.kill();
  });
  frontend.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function startDocker(lanEnv) {
  const ip = lanEnv.LAN_HOST;
  console.log(`Starting LAN Docker stack for ${ip} ...\n`);

  const composeDir = path.join(root, "artifacts", "api-server");
  const child = spawn(
    "docker",
    ["compose", "--env-file", path.join(root, ".env.docker"), "up", "-d", "--build"],
    {
      cwd: composeDir,
      stdio: "inherit",
      env: mergeEnv(process.env, lanEnv, { LAN_HOST: ip }),
      shell: process.platform === "win32",
    },
  );

  child.on("exit", (code) => process.exit(code ?? 0));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Usage:
  node scripts/lan.mjs [--detect | <ip>] [--print | --dev | --docker]

Examples:
  node scripts/lan.mjs --detect          Auto-detect WiFi IP and write .env.lan
  node scripts/lan.mjs 192.168.1.100     Configure for a specific IP
  node scripts/lan.mjs 192.168.1.100 --dev     Configure + start dev servers
  node scripts/lan.mjs 192.168.1.100 --docker  Configure + start Docker stack
`);
    return;
  }

  let ip = args.ip;
  if (args.detect || !ip) {
    ip = detectLanIp();
    if (!ip) {
      console.error("Could not detect a LAN IP. Pass it manually: node scripts/lan.mjs 192.168.1.100");
      process.exit(1);
    }
    console.log(`Detected LAN IP: ${ip}`);
  }

  writeLanEnv(ip);
  const lanEnv = parseEnvFile(envLanPath);

  if (args.dev) {
    printInstructions(ip, "dev");
    await startDev(lanEnv);
    return;
  }

  if (args.docker) {
    printInstructions(ip, "docker");
    await startDocker(lanEnv);
    return;
  }

  printInstructions(ip, "print");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
