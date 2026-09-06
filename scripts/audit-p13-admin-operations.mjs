import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (file) => {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    failures.push(`missing ${file}`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
};

const contractText = read("contracts/p13-admin-operations.json");
const handoff = read("docs/handoffs/P13-WORKING-HANDOFF.md");
const registryText = read("contracts/production-phase-registry.json");
const roadmap = read("docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md");
const verifier = read("scripts/verify-cumulative-quality.mjs");
let contract;
let registry;
try {
  contract = JSON.parse(contractText);
  registry = JSON.parse(registryText);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

for (const marker of Array.from({ length: 10 }, (_, index) => `P13.${index + 1}`)) {
  if (!handoff.includes(marker)) failures.push(`handoff missing ${marker}`);
}
for (const resource of [
  "orders",
  "payment-attempts",
  "payment-reconciliations",
  "shipments",
  "return-requests",
  "refund-requests",
  "support-cases",
  "product-reviews",
  "notification-delivery-attempts",
  "loyalty-ledger-entries",
]) {
  if (!contract?.resources?.includes(resource)) failures.push(`contract missing ${resource}`);
}
for (const rule of [
  "genericEditForbidden",
  "genericDeleteForbidden",
  "explicitPermissionRequired",
  "databaseLockRequired",
  "domainStateMachineRequired",
  "appendOnlyAuditRequired",
]) {
  if (contract?.mutationRules?.[rule] !== true) failures.push(`contract must require ${rule}`);
}
if (contract?.mutationRules?.browserFinancialAuthority !== false) {
  failures.push("browser financial authority must remain false");
}
const phase = registry?.phases?.find((candidate) => candidate.id === "P13");
if (
  !phase ||
  phase.serverRequired !== false ||
  !["registered", "completed"].includes(phase.status)
) {
  failures.push("P13 must remain registered/completed and server-free");
}
if (phase?.status === "completed") {
  for (const field of [
    "startSha",
    "endSha",
    "backendStartSha",
    "backendEndSha",
    "backendMergeSha",
    "backendQualityRun",
    "frontendQualityRun",
    "qaResult",
    "rollbackImpact",
  ]) {
    if (!phase[field]) failures.push(`completed P13 missing ${field}`);
  }
  if (phase.completedParts?.length !== 10) failures.push("completed P13 must record ten parts");
}
for (const marker of [
  "Admin Operations & Complete Platform Acceptance",
  "least privilege",
  "immutable financial truth",
  "append-only audit",
]) {
  if (!roadmap.includes(marker)) failures.push(`roadmap missing ${marker}`);
}
if (!verifier.includes("p13-admin-operations"))
  failures.push("cumulative verifier must require P13 evidence");
for (const marker of [
  "No VPS access",
  "No credential enrollment",
  "No Production-data mutation",
  "No F12 performance-budget change",
]) {
  if (!handoff.includes(marker)) failures.push(`handoff safety boundary missing: ${marker}`);
}

const report = {
  schemaVersion: 1,
  suite: "p13-admin-operations-audit",
  pass: failures.length === 0,
  failed: failures.length,
  failures,
};
fs.mkdirSync(path.join(root, "artifacts/audits"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/audits/p13-admin-operations-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report));
if (failures.length) process.exit(1);
