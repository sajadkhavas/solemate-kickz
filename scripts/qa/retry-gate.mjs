import { spawnSync } from "node:child_process";

const separator = process.argv.indexOf("--");
const command = process.argv[separator + 1];
const args = process.argv.slice(separator + 2);
if (separator < 0 || !command) {
  console.error("usage: retry-gate.mjs -- <command> [args...]");
  process.exit(2);
}

for (let attempt = 1; attempt <= 2; attempt += 1) {
  console.log(`[retry-gate] attempt ${attempt}/2: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status === 0) process.exit(0);
  if (result.signal) console.error(`[retry-gate] terminated by ${result.signal}`);
  if (attempt === 2) process.exit(result.status ?? 1);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
