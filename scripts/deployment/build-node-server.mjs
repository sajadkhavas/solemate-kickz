import { spawn } from "node:child_process";
import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_NODE = "v22.23.1";
const root = process.cwd();
const viteBin = resolve(root, "node_modules/vite/bin/vite.js");
const serverEntry = resolve(root, ".output/server/index.mjs");
const publicDir = resolve(root, ".output/public");

function fail(message) {
  console.error(`[build:vps] ${message}`);
  process.exit(1);
}

if (process.version !== REQUIRED_NODE) {
  fail(`Node ${REQUIRED_NODE} is required; current runtime is ${process.version}.`);
}

try {
  await access(viteBin, constants.R_OK);
} catch {
  fail("Vite is not installed. Install dependencies from bun.lock before building.");
}

console.log("[build:vps] Building Nitro node-server output with Node 22.23.1...");

const child = spawn(process.execPath, [viteBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    SOLE_DEPLOY_TARGET: "node-server",
  },
});

const exitCode = await new Promise((resolveExit) => {
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[build:vps] Build terminated by signal ${signal}.`);
      resolveExit(1);
      return;
    }
    resolveExit(code ?? 1);
  });
  child.on("error", (error) => {
    console.error("[build:vps] Failed to launch Vite:", error);
    resolveExit(1);
  });
});

if (exitCode !== 0) {
  process.exit(exitCode);
}

try {
  const [entryStats] = await Promise.all([stat(serverEntry), access(publicDir, constants.R_OK)]);

  if (!entryStats.isFile() || entryStats.size === 0) {
    fail(".output/server/index.mjs is missing or empty.");
  }
} catch (error) {
  fail(`Node-server output verification failed: ${error.message}`);
}

console.log("[build:vps] Verified .output/server/index.mjs and .output/public.");
