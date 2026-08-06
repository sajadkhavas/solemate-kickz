import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { waitForHttp } from "./browser-harness.mjs";

const ROOT = process.cwd();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once("exit", resolve));
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

export async function withCatalogServer({ envName, port, logPath }, callback) {
  const externalBaseUrl = process.env[envName];
  if (externalBaseUrl) return callback(externalBaseUrl);

  const baseUrl = `http://127.0.0.1:${port}`;
  const absoluteLogPath = path.join(ROOT, logPath);
  fs.mkdirSync(path.dirname(absoluteLogPath), { recursive: true });
  const log = fs.openSync(absoluteLogPath, "w");
  const server = spawn(
    "bun",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    { cwd: ROOT, env: process.env, stdio: ["ignore", log, log] },
  );

  try {
    await waitForHttp(baseUrl, 60_000);
    return await callback(baseUrl);
  } finally {
    await stopProcess(server);
    fs.closeSync(log);
  }
}
