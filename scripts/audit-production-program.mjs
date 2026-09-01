import { readFile } from "node:fs/promises";

const failures = [];

async function text(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [
  constitution,
  roadmap,
  registryRaw,
  service,
  workflow,
  packageRaw,
  p01Handoff,
  catalogOpenapi,
  viteConfig,
  productionCatalog,
  p02Handoff,
  productionCatalogServer,
  productionCatalogRuntime,
  responsiveCatalogImage,
] = await Promise.all([
  text("docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md"),
  text("docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md"),
  text("contracts/production-phase-registry.json"),
  text("deploy/systemd/sole-frontend.service.example"),
  text(".github/workflows/frontend-ci.yml"),
  text("package.json"),
  text("docs/handoffs/P01-BACKEND-ADMIN-PRODUCT-TRUTH.md"),
  text("openapi/sole-catalog-v1.yaml"),
  text("vite.config.ts"),
  text("src/data/production-shoes.ts"),
  text("docs/handoffs/P02-MEDIA-CATALOG-INGESTION.md"),
  text("src/catalog/production-catalog.server.ts"),
  text("src/catalog/production-catalog.ts"),
  text("src/components/catalog/ResponsiveCatalogImage.tsx"),
]);
const navigationAudit = await text("scripts/audit-f2-navigation-search.mjs");
const contentAudit = await text("scripts/audit-f8-content-pages.mjs");
const catalogAudit = await text("scripts/audit-f4-f5-catalog-product-card.mjs");
const checkoutAudit = await text("scripts/audit-f7-cart-checkout.mjs");

let registry;
let pkg;
try {
  registry = JSON.parse(registryRaw);
} catch {
  failures.push("production phase registry must be valid JSON");
}
try {
  pkg = JSON.parse(packageRaw);
} catch {
  failures.push("package.json must be valid JSON");
}

const requiredRules = [
  "Direct work on `main` is forbidden",
  "/var/www/sole/",
  "development",
  "preview",
  "production",
  "typecheck",
  "Playwright regression",
  "KillMode=control-group",
  "canonical URL policy",
  "Core Web Vitals",
  "CURRENT_SHA",
  "NEW_SHA",
  "RELEASE_PATH",
  "ROLLBACK_TARGET",
  "HEALTH_CHECK_RESULT",
];
for (const rule of requiredRules) {
  if (!constitution.includes(rule)) failures.push(`constitution missing: ${rule}`);
}

if (registry?.baseline?.sha !== "6bb540d84ef3952937e03fee5b657b1446b02f47") {
  failures.push("program baseline SHA changed unexpectedly");
}
if (registry?.phases?.length !== 15) failures.push("registry must contain P00-P14");
for (const [index, phase] of (registry?.phases ?? []).entries()) {
  const expected = `P${String(index).padStart(2, "0")}`;
  if (phase.id !== expected) failures.push(`expected ${expected} at registry index ${index}`);
  if (!["registered", "completed"].includes(phase.status)) {
    failures.push(`${phase.id} has invalid status ${phase.status}`);
  }
  if (phase.status === "completed") {
    for (const field of ["startSha", "endSha", "qaResult", "rollbackImpact", "acceptedAt"]) {
      if (!phase[field]) failures.push(`${phase.id} completed evidence missing ${field}`);
    }
  }
  if (!roadmap.includes(`### ${phase.id}`)) failures.push(`roadmap missing ${phase.id}`);
}

for (const field of ["START_SHA", "END_SHA", "QA_RESULT", "ROLLBACK_IMPACT"]) {
  if (!registry?.requiredPhaseEvidence?.includes(field))
    failures.push(`phase evidence missing ${field}`);
}
for (const field of [
  "CURRENT_SHA",
  "NEW_SHA",
  "RELEASE_PATH",
  "ROLLBACK_TARGET",
  "HEALTH_CHECK_RESULT",
]) {
  if (!registry?.requiredReleaseEvidence?.includes(field))
    failures.push(`release evidence missing ${field}`);
}

if (!/KillMode=control-group/.test(service)) {
  failures.push("systemd service must use KillMode=control-group");
}
if (!/sole-p\(\?:0\[0-9\]\|1\[0-4\]\)/.test(navigationAudit)) {
  failures.push("legacy branch gate must recognize registered P00-P14 branches");
}
for (const [name, source] of [
  ["content", contentAudit],
  ["catalog", catalogAudit],
  ["checkout", checkoutAudit],
]) {
  if (!/sole-p/.test(source) || !/1\[0-4\]/.test(source)) {
    failures.push(`${name} branch gate must recognize registered P00-P14 branches`);
  }
}
if (!/Production program contract audit[\s\S]*audit:production-program/.test(workflow)) {
  failures.push("CI must run the production program audit");
}
if (
  pkg?.scripts?.["audit:production-program"] !==
  "node scripts/audit-production-program.mjs && bun run audit:p03"
) {
  failures.push("package script audit:production-program is missing");
}

const p01 = registry?.phases?.find((phase) => phase.id === "P01");
if (p01) {
  if (p01.backendRepository !== "sajadkhavas/sole-backend") {
    failures.push("P01 must bind the canonical sole-backend repository");
  }
  if (!p01.backendStartSha || !p01.backendAcceptedEndSha) {
    failures.push("P01 must record backend start and accepted implementation SHAs");
  }
  for (const marker of ["P01.1", "P01.2", "P01.3", "P01.4", "P01.5", "P01.6", "P01.7"]) {
    if (!p01Handoff.includes(marker)) failures.push(`P01 handoff missing ${marker}`);
  }
  if (
    !viteConfig.includes("sole-production-truth-guard") ||
    !viteConfig.includes('source === "@/data/shoes"')
  ) {
    failures.push("production build must redirect the development shoe dataset");
  }
  if (!productionCatalog.includes("export const SHOES: Shoe[] = []")) {
    failures.push("production catalog fixture boundary must remain fail closed");
  }
  for (const forbidden of [
    "Silver Bullet",
    "Air Max 97",
    "SOLE-0001",
    "images.unsplash.com/photo-",
  ]) {
    if (productionCatalog.includes(forbidden)) {
      failures.push(
        `production catalog contains forbidden development product truth: ${forbidden}`,
      );
    }
  }
  for (const marker of ["/v1/catalog/products", "price_minor", "available_quantity"]) {
    if (!catalogOpenapi.includes(marker)) failures.push(`catalog OpenAPI missing ${marker}`);
  }
}

const p02 = registry?.phases?.find((phase) => phase.id === "P02");
if (p02?.status === "completed") {
  if (p02.backendRepository !== "sajadkhavas/sole-backend") {
    failures.push("P02 must bind the canonical sole-backend repository");
  }
  for (const field of [
    "backendStartSha",
    "backendAcceptedEndSha",
    "backendMergeSha",
    "backendPullRequest",
    "frontendQualityRun",
    "frontendPullRequest",
  ]) {
    if (!p02[field]) failures.push(`P02 completed evidence missing ${field}`);
  }
  for (const marker of ["P02.1", "P02.2", "P02.3", "P02.4", "P02.5", "P02.6"]) {
    if (!p02Handoff.includes(marker)) failures.push(`P02 handoff missing ${marker}`);
  }
  for (const marker of ["version: 1.1.0", "MediaSource:", "CatalogMedia:", "sha256", "media:"]) {
    if (!catalogOpenapi.includes(marker)) failures.push(`P02 catalog OpenAPI missing ${marker}`);
  }
  for (const marker of [
    "process.env.SOLE_API_URL",
    "z.object",
    'variant.currency !== "IRR"',
    "% 10",
    "AbortSignal.timeout(5000)",
  ]) {
    if (!productionCatalogServer.includes(marker)) {
      failures.push(`P02 production catalog server boundary missing ${marker}`);
    }
  }
  for (const marker of [
    "if (!import.meta.env.PROD) return fixtures",
    'import("@/catalog/production-catalog.server")',
    'fetch("/api/catalog"',
  ]) {
    if (!productionCatalogRuntime.includes(marker)) {
      failures.push(`P02 runtime catalog boundary missing ${marker}`);
    }
  }
  for (const marker of ["<picture", '<source type="image/webp"', "srcSet={media.srcSet}"]) {
    if (!responsiveCatalogImage.includes(marker)) {
      failures.push(`P02 responsive catalog image boundary missing ${marker}`);
    }
  }
}

if (failures.length) {
  console.error("Production program audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Production program audit passed: P00-P14 and accepted production boundaries are registered.",
);
