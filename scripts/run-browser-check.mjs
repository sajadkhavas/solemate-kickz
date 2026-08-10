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
    report: "artifacts/reports/f0-f1-behavior.json",
  },
  visual: {
    port: 4173,
    script: "scripts/visual-qa-f0-f1.mjs",
    baseEnv: "VISUAL_QA_BASE_URL",
    log: "artifacts/runtime/visual-server.txt",
    report: "artifacts/visual-qa/f0-f1-visual-qa.json",
  },
};

if (!MODES[mode]) {
  console.error(`Unknown browser check: ${mode ?? "<missing>"}`);
  process.exit(2);
}

const config = MODES[mode];
const existingBaseUrl = process.env[config.baseEnv];
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function spawnChild(command, args, options = {}) {
  return spawn(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
}

function waitForExit(child) {
  if (child.exitCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code: code ?? (signal ? 1 : 0), signal });
    });
  });
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  const exited = waitForExit(child);
  child.kill("SIGTERM");
  const graceful = await Promise.race([exited.then(() => true), sleep(3_000).then(() => false)]);
  if (!graceful && child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([exited, sleep(1_000)]);
  }
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
    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

function readReport(reportPath) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    return typeof report.pass === "boolean" ? report : null;
  } catch {
    return null;
  }
}

async function waitForBrowserResult(child, reportPath, timeoutMs = 12 * 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const report = readReport(reportPath);
    if (report) {
      await stopProcess(child);
      return { code: report.pass ? 0 : 1, report };
    }
    if (child.exitCode !== null) {
      return { code: child.exitCode, report: readReport(reportPath) };
    }
    await sleep(200);
  }

  await stopProcess(child);
  return { code: 124, report: readReport(reportPath) };
}

async function runBrowserScript(baseUrl) {
  const reportPath = path.join(ROOT, config.report);
  fs.rmSync(reportPath, { force: true });
  const child = spawnChild(process.execPath, [config.script], {
    env: { ...process.env, [config.baseEnv]: baseUrl },
  });
  return waitForBrowserResult(child, reportPath);
}

function isRetryableChromeStartup(result) {
  if (mode !== "behavior" || result.code === 0) return false;
  const fatal = String(result.report?.fatalError ?? "");
  return /json\/version|Chrome\/Chromium executable|remote-debugging-port/i.test(fatal);
}

async function runWithStartupRecovery(baseUrl) {
  const first = await runBrowserScript(baseUrl);
  if (!isRetryableChromeStartup(first)) return first;

  console.warn(
    "Foundation Chrome startup failed; retrying once without masking behavior failures.",
  );
  await sleep(1_000);
  return runBrowserScript(baseUrl);
}

async function main() {
  if (existingBaseUrl) {
    const result = await runWithStartupRecovery(existingBaseUrl);
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
    await stopProcess(server);
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
    const result = await runWithStartupRecovery(baseUrl);
    process.exitCode = result.code;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
