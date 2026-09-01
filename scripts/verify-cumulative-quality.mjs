import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ARTIFACTS = path.join(ROOT, "artifacts");

const expectedReportFragments = [
  "f0-f1-foundation",
  "f0-f1-behavior",
  "f0-f1-visual-qa",
  "f2-navigation-search",
  "f3-homepage",
  "f8-content-pages",
  "f4-f5-catalog-product-card",
  "f6-product-detail",
  "f7-cart-checkout",
  "f9-wishlist-account-orders",
  "f10-motion-3d",
  "f11-technical-seo",
  "f12-performance-media",
  "f13-full-code-audit",
  "f13-hardening",
  "f14-pwa-foundation",
  "f14-pwa-contracts",
  "f15-push-consent",
  "f15-push-contracts",
  "f16-commerce-contract",
  "f17-production-content",
  "f18-final-acceptance",
  "p05-discovery-pdp",
  "p06-cart-checkout-orders",
  "p07-payment-shipping-returns",
];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function collectFailures(value, location = "report", failures = []) {
  if (!value || typeof value !== "object") return failures;

  if (value.pass === false) failures.push(`${location}.pass=false`);
  if (typeof value.failed === "number" && value.failed > 0) {
    failures.push(`${location}.failed=${value.failed}`);
  }
  if (typeof value.critical === "number" && value.critical > 0) {
    failures.push(`${location}.critical=${value.critical}`);
  }
  if (
    typeof value.foundationCriticalFindings === "number" &&
    value.foundationCriticalFindings > 0
  ) {
    failures.push(`${location}.foundationCriticalFindings=${value.foundationCriticalFindings}`);
  }
  if (Array.isArray(value.criticalFindings) && value.criticalFindings.length > 0) {
    failures.push(`${location}.criticalFindings=${value.criticalFindings.length}`);
  }

  for (const key of ["summary", "checks", "results"]) {
    const child = value[key];
    if (Array.isArray(child)) {
      child.forEach((entry, index) =>
        collectFailures(entry, `${location}.${key}[${index}]`, failures),
      );
    } else if (child && typeof child === "object") {
      collectFailures(child, `${location}.${key}`, failures);
    }
  }

  return failures;
}

const reportFiles = walk(ARTIFACTS)
  .filter((file) => file.endsWith(".json"))
  .sort();

if (!reportFiles.length) {
  console.error("No JSON quality reports were generated.");
  process.exit(1);
}

const relativeReports = reportFiles.map((file) => path.relative(ROOT, file));
const missingFragments = expectedReportFragments.filter(
  (fragment) => !relativeReports.some((file) => file.includes(fragment)),
);

const invalidReports = [];
for (const file of reportFiles) {
  const relative = path.relative(ROOT, file);
  try {
    const report = JSON.parse(fs.readFileSync(file, "utf8"));
    const failures = collectFailures(report);
    if (failures.length) invalidReports.push({ file: relative, failures });
  } catch (error) {
    invalidReports.push({
      file: relative,
      failures: [error instanceof Error ? error.message : String(error)],
    });
  }
}

const summary = {
  reports: relativeReports.length,
  expectedFragments: expectedReportFragments.length,
  missingFragments,
  invalidReports,
};

console.log(JSON.stringify(summary));

if (missingFragments.length || invalidReports.length) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}
