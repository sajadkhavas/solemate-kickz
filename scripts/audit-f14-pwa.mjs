import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "389bcc5cdd3bec51dea2bcd4b3c7cb6772657b9b";
const REPORT = path.join(ROOT, "artifacts/audits/f14-pwa-foundation.json");
const checks = [];
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
const record = (name, pass, evidence = null) =>
  checks.push({ name, pass: Boolean(pass), evidence });

const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").stdout.trim();
const phaseNumber = Number(branch.match(/^phase\/sole-f(\d+)-/)?.[1] ?? -1);
record(
  "F14 uses controlled lineage",
  phaseNumber >= 14 ||
    branch === "integration/sole-frontend-v2" ||
    branch === "main" ||
    process.env.CI === "true",
  branch,
);
record(
  "accepted F13 Integration is an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);

const manifest = JSON.parse(read("public/manifest.webmanifest"));
record(
  "manifest is Persian RTL standalone",
  manifest.lang === "fa" &&
    manifest.dir === "rtl" &&
    manifest.display === "standalone" &&
    manifest.scope === "/",
);
record(
  "manifest has install and maskable icons",
  manifest.icons.some((icon) => icon.sizes === "192x192") &&
    manifest.icons.some((icon) => icon.sizes === "512x512") &&
    manifest.icons.some((icon) => icon.purpose === "maskable"),
);
record(
  "manifest shortcuts use real routes",
  ["/products", "/wishlist", "/cart"].every((route) =>
    manifest.shortcuts.some((shortcut) => shortcut.url.startsWith(route)),
  ),
);

for (const icon of [
  "public/icons/sole-192.png",
  "public/icons/sole-512.png",
  "public/icons/sole-maskable-512.png",
]) {
  record(`${icon} exists and is non-empty`, fs.statSync(path.join(ROOT, icon)).size > 1_000);
}

const sw = read("public/sw.js");
record(
  "service worker excludes sensitive commerce routes",
  ["/api", "/auth", "/account", "/checkout", "/cart", "/wishlist"].every((route) =>
    sw.includes(`"${route}"`),
  ),
);
record(
  "service worker caches GET-only same-origin responses",
  sw.includes('request.method !== "GET"') && sw.includes("url.origin !== self.location.origin"),
);
record(
  "service worker provides explicit offline and update lifecycle",
  sw.includes('caches.match("/offline.html")') &&
    sw.includes('type === "SKIP_WAITING"') &&
    sw.includes("self.clients.claim()"),
);

const root = read("src/routes/__root.tsx");
const experience = read("src/components/pwa/PwaExperience.tsx");
record(
  "root exposes manifest touch icon and PWA controller",
  root.includes('rel: "manifest"') &&
    root.includes('rel: "apple-touch-icon"') &&
    root.includes("<PwaExperience />"),
);
record(
  "install prompt is intent-driven and iOS uses guidance",
  experience.includes("beforeinstallprompt") &&
    experience.includes("Add to Home Screen") &&
    !experience.includes("Notification.requestPermission"),
);
record(
  "badge mirrors only local cart count",
  experience.includes("useCartCount") &&
    experience.includes("setAppBadge") &&
    experience.includes("clearAppBadge"),
);
record(
  "offline copy preserves commerce truth boundary",
  read("public/offline.html").includes("قیمت، تخفیف، موجودی") &&
    read("public/offline.html").includes("بعد از اتصال دوباره بررسی"),
);

const pkg = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const cumulative = read("scripts/verify-cumulative-quality.mjs");
record("F14 commands are registered", pkg.includes('"audit:f14"') && pkg.includes('"test:f14"'));
record(
  "CI enforces F14 contracts",
  workflow.includes("F14 PWA source audit") && workflow.includes("F14 PWA behavior contracts"),
);
record(
  "cumulative verifier requires F14 evidence",
  cumulative.includes('"f14-pwa-foundation"') && cumulative.includes('"f14-pwa-contracts"'),
);
record(
  "lockfile is unchanged",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout.trim() === "",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f14-pwa-foundation",
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
