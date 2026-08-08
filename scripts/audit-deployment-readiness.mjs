import { readFile, stat } from "node:fs/promises";

const failures = [];

async function text(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

function requireMatch(label, value, matcher) {
  if (!matcher.test(value)) failures.push(label);
}

const [
  packageRaw,
  vite,
  nvmrc,
  nodeVersion,
  preflight,
  bootstrap,
  installSafe,
  buildSafe,
  buildNode,
  smoke,
  service,
  docs,
  gitignore,
] = await Promise.all([
  text("package.json"),
  text("vite.config.ts"),
  text(".nvmrc"),
  text(".node-version"),
  text("scripts/deployment/vps-preflight.sh"),
  text("scripts/deployment/bootstrap-bun-vps.sh"),
  text("scripts/deployment/install-vps-safe.sh"),
  text("scripts/deployment/build-vps-safe.sh"),
  text("scripts/deployment/build-node-server.mjs"),
  text("scripts/deployment/smoke-node-server.mjs"),
  text("deploy/systemd/sole-frontend.service.example"),
  text("docs/frontend/SOLE_VPS_DEPLOYMENT.md"),
  text(".gitignore"),
]);

let pkg = {};
try {
  pkg = JSON.parse(packageRaw);
} catch {
  failures.push("package.json must remain valid JSON");
}

if (pkg.packageManager !== "bun@1.3.14") failures.push("packageManager must stay bun@1.3.14");
if (pkg.engines?.node !== "22.23.1") failures.push("Node engine must stay pinned to 22.23.1");
if (nvmrc.trim() !== "22.23.1") failures.push(".nvmrc must pin 22.23.1");
if (nodeVersion.trim() !== "22.23.1") failures.push(".node-version must pin 22.23.1");

const expectedScripts = {
  "build:vps": "node scripts/deployment/build-node-server.mjs",
  "start:vps": "node .output/server/index.mjs",
  "smoke:vps": "node scripts/deployment/smoke-node-server.mjs",
  "audit:deploy": "node scripts/audit-deployment-readiness.mjs",
};
for (const [name, command] of Object.entries(expectedScripts)) {
  if (pkg.scripts?.[name] !== command) failures.push(`package script ${name} is missing or changed`);
}
if (!pkg.scripts?.check?.includes("bun run audit:deploy")) {
  failures.push("cumulative check must include deployment audit");
}

requireMatch("VPS build must opt in through SOLE_DEPLOY_TARGET", vite, /SOLE_DEPLOY_TARGET\s*===\s*["']node-server["']/);
requireMatch("Nitro node-server preset must be conditional", vite, /isNodeServerBuild[\s\S]*preset:\s*["']node-server["']/);
if (/export default defineConfig\(\{\s*nitro:\s*\{\s*preset:\s*["']node-server["']/.test(vite)) {
  failures.push("node-server must not be hard-coded for normal Lovable preview/build");
}

requireMatch("preflight must enforce Node 22.23.1", preflight, /REQUIRED_NODE="v22\.23\.1"/);
requireMatch("preflight must inspect AVX2", preflight, /\bavx2\b/);
requireMatch("bootstrap must support x64 baseline Bun", bootstrap, /x64-baseline/);
requireMatch("bootstrap must install Bun locally", bootstrap, /RUNTIME.*bun|\.runtime\/bun/s);
requireMatch("safe dependency install must use cgroup memory limits", installSafe, /MemoryMax/);
requireMatch("safe build must use cgroup memory limits", buildSafe, /MemoryMax/);
requireMatch("VPS build must set node-server target", buildNode, /SOLE_DEPLOY_TARGET:\s*"node-server"/);
requireMatch("VPS build must verify Nitro server output", buildNode, /\.output\/server\/index\.mjs/);
requireMatch("smoke test must probe loopback by default", smoke, /http:\/\/127\.0\.0\.1:4173/);

requireMatch("systemd service must bind loopback", service, /127\.0\.0\.1/);
requireMatch("systemd service must use production Node output", service, /node\s+\.output\/server\/index\.mjs/);
requireMatch("systemd service must have a hard memory limit", service, /MemoryMax=/);
if (/\b(vite dev|vite preview|bun run dev)\b/.test(service)) {
  failures.push("systemd production service must never run a Vite dev/preview server");
}

requireMatch("deployment docs must forbid dev server as production", docs, /Do not run `vite dev` or `vite preview` as the production service/i);
requireMatch("deployment docs must document SSH loopback preview", docs, /127\.0\.0\.1:4173/);
requireMatch("deployment docs must document Node 22.23.1", docs, /22\.23\.1/);
requireMatch("runtime artifacts must be ignored", gitignore, /^\/?\.runtime\/$/m);

try {
  const serviceStats = await stat("deploy/systemd/sole-frontend.service.example");
  if (serviceStats.size === 0) failures.push("systemd service template must not be empty");
} catch {
  // Missing file already recorded by text().
}

if (failures.length > 0) {
  console.error("Deployment readiness audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Deployment readiness audit passed.");
