import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import process from "node:process";

const root = process.cwd();
const port = Number(process.env.SOLE_QA_PORT ?? 4173);
const origin = `http://127.0.0.1:${port}`;
const entry = `${root}/.output/server/index.mjs`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertPortFree(label) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", () => reject(new Error(`${label}: port ${port} is occupied`)));
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

function descendants(rootPid) {
  const result = spawnSync("ps", ["-eo", "pid=,ppid="], { encoding: "utf8" });
  if (result.status !== 0) return [];
  const children = new Map();
  for (const line of result.stdout.trim().split("\n")) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);
    if (!children.has(ppid)) children.set(ppid, []);
    children.get(ppid).push(pid);
  }
  const found = [];
  const visit = (pid) => {
    for (const child of children.get(pid) ?? []) {
      visit(child);
      found.push(child);
    }
  };
  visit(rootPid);
  return found;
}

async function terminateTree(child) {
  if (!child || child.exitCode !== null) return;
  const pids = [...descendants(child.pid), child.pid];
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process may have exited between discovery and signaling.
    }
  }
  for (let attempt = 0; attempt < 30 && child.exitCode === null; attempt += 1) await sleep(100);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // A process already terminated by SIGTERM needs no forced signal.
    }
  }
}

async function waitForReady(child) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`production server exited with ${child.exitCode}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1000) });
      if (response.status === 200) return;
    } catch {
      // Readiness polling intentionally tolerates connection failures until timeout.
    }
    await sleep(100);
  }
  throw new Error("production server readiness timed out");
}

await assertPortFree("before QA");
const child = spawn(process.execPath, [entry], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    NITRO_HOST: "127.0.0.1",
    PORT: String(port),
    NITRO_PORT: String(port),
  },
});
const stop = async () => terminateTree(child);
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  await waitForReady(child);
  const smoke = spawnSync(process.execPath, ["scripts/deployment/smoke-node-server.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, SOLE_SMOKE_ORIGIN: origin },
  });
  if (smoke.status !== 0) throw new Error(`production smoke exited with ${smoke.status}`);
} finally {
  await terminateTree(child);
  await sleep(250);
  await assertPortFree("after QA");
}

console.log(`[production-runtime] PASS; port ${port} released.`);
