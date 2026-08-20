import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ledgerPath = process.argv[2];
if (!ledgerPath) throw new Error("release ledger path is required");
const required = [
  "ENVIRONMENT",
  "RELEASE_STRATEGY",
  "CURRENT_SHA",
  "NEW_SHA",
  "RELEASE_PATH",
  "ROLLBACK_TARGET",
  "HEALTH_CHECK_RESULT",
  "PUBLIC_REACHABILITY_RESULT",
  "STARTED_AT",
  "FINISHED_AT",
  "ACTOR",
];
const record = Object.fromEntries(required.map((key) => [key, process.env[key] ?? ""]));
const missing = required.filter((key) => !record[key]);
if (missing.length) throw new Error(`release evidence missing: ${missing.join(", ")}`);
if (!/^[0-9a-f]{40}$/.test(record.NEW_SHA)) throw new Error("NEW_SHA must be a full Git SHA");
if (record.CURRENT_SHA !== "NONE" && !/^[0-9a-f]{40}$/.test(record.CURRENT_SHA)) {
  throw new Error("CURRENT_SHA must be NONE or a full Git SHA");
}
await mkdir(path.dirname(ledgerPath), { recursive: true });
await appendFile(ledgerPath, `${JSON.stringify(record)}\n`, { mode: 0o640 });
console.log(`[release-ledger] appended ${record.NEW_SHA}`);
