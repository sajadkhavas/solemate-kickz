import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const mode = process.argv[2];
const MODES = {
  behavior: {
    port: 4174,
    script: "scripts/test-f0-f1-behavior.mjs",
    baseEnv: "FOUNDATION_BASE_URL",
    log: "artifacts/runtime/behavior-server.txt",
  },
  visual: {
    port: 4173,
    script: "scripts/visual-qa-f0-f1.mjs",
    baseEnv: "VISUAL_QA_BASE_URL",
    log: "artifacts/runtime/visual-server.txt",
  },
};

if (!MODES[mode]) {
  console.error(`Unknown browser check: ${mode ?? "<missing>"}`);
  process.exit(2);
}

const config = MODES[mode];
const existingBaseUrl = process.env[config.baseEnv];

function spawnChild(command, args, options = {}) {
  return spawn(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code: code ?? (signal ? 1 : 0), signal });
    });
  });
}

async function waitForHttp(url, timeoutMs = 60_000) {
  const started = Date.now();
  let lastError = "server not ready";

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    waitForExit(server),
    new Promise((resolve) =>
      setTimeout(() => {
        if (server.exitCode === null) server.kill("SIGKILL");
        resolve();
      }, 5_000),
    ),
  ]);
}

async function main() {
  if (existingBaseUrl) {
    const child = spawnChild(process.execPath, [config.script]);
    const result = await waitForExit(child);
    process.exitCode = result.code;
    return;
  }

  const baseUrl = `http://127.0.0.1:${config.port}`;
  const logPath = path.join(ROOT, config.log);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.openSync(logPath, "w");

  const server = spawn(
    "bun",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(config.port)],
    {
      cwd: ROOT,
      stdio: ["ignore", log, log],
      env: process.env,
    },
  );

  const cleanup = async () => {
    await stopServer(server);
    fs.closeSync(log);
  };

  process.once("SIGINT", () => {
    cleanup().finally(() => process.exit(130));
  });
  process.once("SIGTERM", () => {
    cleanup().finally(() => process.exit(143));
  });

  try {
    await waitForHttp(baseUrl);
    const child = spawnChild(process.execPath, [config.script], {
      env: { ...process.env, [config.baseEnv]: baseUrl },
    });
    const result = await waitForExit(child);
    process.exitCode = result.code;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
