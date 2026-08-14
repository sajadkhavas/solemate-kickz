import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/reports/f14-pwa-contracts.json");
const sw = fs.readFileSync(path.join(ROOT, "public/sw.js"), "utf8");
const ui = fs.readFileSync(path.join(ROOT, "src/components/pwa/PwaExperience.tsx"), "utf8");
const offline = fs.readFileSync(path.join(ROOT, "public/offline.html"), "utf8");
const results = [];
const record = (name, pass, evidence = null) =>
  results.push({ name, pass: Boolean(pass), evidence });

const privateRoutes = ["/api", "/auth", "/account", "/checkout", "/cart", "/wishlist"];
record(
  "all sensitive prefixes are denylisted",
  privateRoutes.every((route) => sw.includes(`\"${route}\"`)),
  privateRoutes,
);
record(
  "non-GET and cross-origin requests bypass the cache",
  sw.includes('request.method !== "GET"') && sw.includes("url.origin !== self.location.origin"),
);
record(
  "public navigation uses network-first fallback",
  sw.indexOf("fetch(request)") < sw.indexOf("caches.match(request)") &&
    sw.includes('caches.match("/offline.html")'),
);
record(
  "updates require explicit user activation",
  ui.includes("waitingWorker.postMessage") &&
    ui.includes('type: "SKIP_WAITING"') &&
    sw.includes("self.skipWaiting()"),
);
record(
  "Safari never receives a fake install prompt",
  ui.includes("iosNeedsGuide") &&
    ui.includes("راهنمای نصب در آیفون") &&
    ui.includes("Add to Home Screen"),
);
record(
  "offline page is noindex and truth-safe",
  offline.includes('name="robots" content="noindex,nofollow"') &&
    offline.includes("قیمت، تخفیف، موجودی"),
);

const failed = results.filter((result) => !result.pass);
const report = {
  schemaVersion: 1,
  suite: "f14-pwa-contracts",
  generatedAt: new Date().toISOString(),
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
  pass: failed.length === 0,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
