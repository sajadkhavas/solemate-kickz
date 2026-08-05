import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { sleep, waitForHttp } from "./browser-harness.mjs";

const ROOT = process.cwd();

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolve) =>
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0))),
  );
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const exited = waitForExit(child);
  child.kill("SIGTERM");
  const graceful = await Promise.race([exited.then(() => true), sleep(3_000).then(() => false)]);
  if (!graceful && child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([exited, sleep(1_000)]);
  }
}

function readReport(reportPath) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    return typeof report.pass === "boolean" ? report : null;
  } catch {
    return null;
  }
}

async function waitForResult(child, reportPath, timeout = 25 * 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const report = readReport(reportPath);
    if (report) {
      await stop(child);
      return report.pass ? 0 : 1;
    }
    if (child.exitCode !== null) return child.exitCode;
    await sleep(200);
  }
  await stop(child);
  return 124;
}

function defaultReportPath(envName) {
  return envName.includes("BEHAVIOR")
    ? "artifacts/reports/f2-navigation-search-behavior.json"
    : "artifacts/visual-qa/f2-navigation-search/f2-navigation-search.json";
}

export async function delegateToDevServer({ envName, port, entryPath, logName, reportPath }) {
  if (process.env[envName]) return null;

  const baseUrl = `http://127.0.0.1:${port}`;
  const absoluteReportPath = path.join(ROOT, reportPath ?? defaultReportPath(envName));
  const logPath = path.join(ROOT, "artifacts/runtime", logName);
  fs.rmSync(absoluteReportPath, { force: true });
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.openSync(logPath, "w");
  const server = spawn("bun", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", log, log],
    env: process.env,
  });

  try {
    await waitForHttp(baseUrl, 60_000);
    const child = spawn(process.execPath, [entryPath], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, [envName]: baseUrl },
    });
    return await waitForResult(child, absoluteReportPath);
  } finally {
    await stop(server);
    fs.closeSync(log);
  }
}
