import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
const ROOT = process.cwd(),
  BASELINE = "30326e736c7c823f594a691255bb3f6f4175bdba",
  REPORT = path.join(ROOT, "artifacts/audits/f16-commerce-contract.json"),
  checks = [];
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8"),
  git = (...a) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8" }),
  record = (name, pass) => checks.push({ name, pass: Boolean(pass) });
const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").stdout.trim();
record(
  "controlled lineage",
  /^phase\/sole-f16-/.test(branch) ||
    branch === "integration/sole-frontend-v2" ||
    process.env.CI === "true",
);
record("F15 ancestor", git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0);
const doc = read("docs/backend/COMMERCE-BACKEND-CONTRACT.md"),
  api = read("openapi/sole-commerce-v1.yaml"),
  machines = JSON.parse(read("contracts/commerce-state-machines.json"));
record(
  "backend authority and fail closed",
  doc.includes("sole authority") && doc.includes("fail-closed"),
);
record(
  "money inventory invariants",
  doc.includes("integer minor units") && doc.includes("append-only ledger"),
);
record(
  "seven machines",
  ["reservation", "checkout", "order", "payment", "shipment", "return", "refund"].every(
    (k) => machines.machines[k],
  ),
);
record(
  "terminal states final",
  Object.values(machines.machines).every((m) => m.terminal.every((s) => !m.transitions[s])),
);
record(
  "idempotency version outbox audit",
  ["IDEMPOTENCY_KEY_REUSED", "expected revision", "outbox", "redacted"].every((t) =>
    doc.includes(t),
  ),
);
record(
  "OpenAPI security controls",
  ["sessionCookie", "csrfToken", "ExpectedRevision", "IdempotencyKey"].every((t) =>
    api.includes(t),
  ),
);
record(
  "OpenAPI lifecycle",
  [
    "/catalog/products",
    "/cart/lines",
    "/checkout/{checkoutId}/reserve",
    "/payment-attempts",
    "/payments/webhooks",
    "/orders/{orderId}/cancel",
    "/returns",
  ].every((t) => api.includes(t)),
);
record(
  "no fake provider success",
  api.includes("not payment success") && api.includes("not approval/refund"),
);
record(
  "lockfile unchanged",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout.trim() === "",
);
const failed = checks.filter((c) => !c.pass),
  report = {
    schemaVersion: 1,
    suite: "f16-commerce-contract",
    generatedAt: new Date().toISOString(),
    baseline: BASELINE,
    branch,
    summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
    checks,
    pass: failed.length === 0,
  };
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary));
if (failed.length) process.exitCode = 1;
