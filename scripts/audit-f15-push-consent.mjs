import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "7cca0787e932c0417454aafa0ab186c2ba676001";
const REPORT = path.join(ROOT, "artifacts/audits/f15-push-consent.json");
const checks = [];
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
const record = (name, pass, evidence = null) =>
  checks.push({ name, pass: Boolean(pass), evidence });
const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").stdout.trim();
const phaseNumber = Number(branch.match(/^phase\/sole-f(\d+)-/)?.[1] ?? -1);

record(
  "F15 uses controlled lineage",
  phaseNumber >= 15 ||
    branch === "integration/sole-frontend-v2" ||
    branch === "main" ||
    process.env.CI === "true",
  branch,
);
record(
  "accepted F14 Integration is ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);

const center = read("src/components/notifications/NotificationCenter.tsx");
const client = read("src/notifications/client.ts");
const contracts = read("src/notifications/contracts.ts");
const worker = read("public/sw.js");
const navbar = read("src/components/Navbar.tsx");

record(
  "notification center is owned by the global header",
  navbar.includes("<NotificationCenter />") &&
    center.includes('data-testid="notification-center-trigger"'),
);
record(
  "loading empty and real error states exist",
  center.includes("در حال دریافت اعلان‌ها") &&
    center.includes("اعلانی وجود ندارد") &&
    center.includes('role="alert"'),
);
record(
  "unread count comes only from backend snapshot",
  center.includes("snapshot.unreadCount") &&
    !center.includes("unreadCount +") &&
    !center.includes("unreadCount -"),
);
record(
  "mark-read mutation refetches instead of optimistic decrement",
  center.includes("await notificationApi.markRead(id)") && center.includes("await load()"),
);
record(
  "permission is requested only after an explanatory second step",
  center.includes("setShowPermissionStep(true)") &&
    center.includes("Notification.requestPermission()") &&
    center.includes("onClick={requestPush}") &&
    center.includes("ادامه و درخواست مجوز"),
);
record(
  "browser permission and channel consent are explicitly independent",
  center.includes("دو موضوع مستقل") &&
    center.includes("رضایت پیامک") &&
    center.includes("بازاریابی نیست"),
);
record(
  "preference contract separates order price promotion system email SMS and marketing",
  ["orderUpdates", "priceDrops", "promotions", "system", "email", "sms", "marketing"].every((key) =>
    contracts.includes(key),
  ),
);
record(
  "mutations require same-origin credentials and CSRF",
  client.includes('credentials: "same-origin"') &&
    client.includes("X-CSRF-Token") &&
    client.includes("CSRF_MISSING"),
);
record(
  "subscription rollback prevents orphan browser subscription",
  center.includes("await subscription.unsubscribe()") &&
    center.includes("notificationApi.subscribe(subscription.toJSON())"),
);
record(
  "VAPID remains server-configured",
  client.includes('meta[name="sole-vapid-public-key"]') && !/[A-Za-z0-9_-]{80,}/.test(client),
);
record(
  "service worker supports bounded payloads and safe deep links",
  worker.includes('self.addEventListener("push"') &&
    worker.includes('self.addEventListener("notificationclick"') &&
    worker.includes("safeNotificationPath") &&
    worker.includes("slice(0, 240)"),
);
record(
  "external and unknown notification URLs fall back home",
  worker.includes("url.origin !== self.location.origin") && worker.includes('return "/"'),
);

const pkg = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const cumulative = read("scripts/verify-cumulative-quality.mjs");
record("F15 commands are registered", pkg.includes('"audit:f15"') && pkg.includes('"test:f15"'));
record(
  "CI enforces F15",
  workflow.includes("F15 push consent source audit") &&
    workflow.includes("F15 push consent contracts"),
);
record(
  "cumulative verifier requires F15",
  cumulative.includes('"f15-push-consent"') && cumulative.includes('"f15-push-contracts"'),
);
record(
  "lockfile is unchanged",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout.trim() === "",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f15-push-consent",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  branch,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
