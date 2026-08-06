import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f0-f1-behavior.json");
const MAX_ATTEMPTS = 2;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function runAttempt() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/run-browser-check.mjs", "behavior"], {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
    });
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

function isChromeStartupFailure() {
  try {
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const fatal = String(report.fatalError ?? "");
    return /json\/version|Chrome\/Chromium executable|remote-debugging-port/i.test(fatal);
  } catch {
    return false;
  }
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const code = await runAttempt();
  if (code === 0) process.exit(0);

  const retryable = isChromeStartupFailure();
  if (!retryable || attempt === MAX_ATTEMPTS) process.exit(code || 1);

  console.warn(`Foundation Chrome startup failed on attempt ${attempt}; retrying once.`);
  await sleep(1_000);
}
