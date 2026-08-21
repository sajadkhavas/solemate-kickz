import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { terminateProcessTree, waitForHttp } from "./browser-harness.mjs";

const ROOT = process.cwd();
export async function withCatalogServer({ envName, port, logPath }, callback) {
  const externalBaseUrl = process.env[envName];
  if (externalBaseUrl) return callback(externalBaseUrl);

  const baseUrl = `http://127.0.0.1:${port}`;
  const absoluteLogPath = path.join(ROOT, logPath);
  fs.mkdirSync(path.dirname(absoluteLogPath), { recursive: true });
  const log = fs.openSync(absoluteLogPath, "w");
  const server = spawn("bun", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", log, log],
  });

  try {
    await waitForHttp(baseUrl, 60_000);
    return await callback(baseUrl);
  } finally {
    await terminateProcessTree(server);
    fs.closeSync(log);
  }
}
