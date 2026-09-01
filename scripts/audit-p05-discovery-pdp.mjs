import { readFile } from "node:fs/promises";

const failures = [];
async function source(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [
  server,
  runtime,
  apiRoute,
  catalogRoute,
  filters,
  purchase,
  productRoute,
  registryRaw,
  handoff,
] = await Promise.all([
  source("src/catalog/p05-discovery.server.ts"),
  source("src/catalog/production-catalog.ts"),
  source("src/routes/api.catalog.ts"),
  source("src/routes/products.tsx"),
  source("src/components/catalog/CatalogFilters.tsx"),
  source("src/components/product/ProductPurchasePanel.tsx"),
  source("src/routes/product.$id.tsx"),
  source("contracts/production-phase-registry.json"),
  source("docs/handoffs/P05-DISCOVERY-PDP-CONVERSION.md"),
]);

for (const marker of [
  "process.env.SOLE_API_URL",
  "AbortSignal.timeout(5000)",
  "merchandising",
  "availability",
  "recovery",
  "decision_support",
  "social_proof",
  "deferred_to_p09",
  "consent_version",
]) {
  if (!server.includes(marker)) failures.push(`P05 server boundary missing ${marker}`);
}

for (const marker of [
  "discoverCatalogForRuntime",
  "fetchProductionCatalogP05",
  'fetch("/api/catalog',
  'if (!import.meta.env.PROD)',
]) {
  if (!runtime.includes(marker)) failures.push(`P05 runtime boundary missing ${marker}`);
}

for (const marker of ["loaderDeps", "availability", "suggestedQuery", "lastPage", "چیدمان پیشنهادی فروشگاه"]) {
  if (!catalogRoute.includes(marker)) failures.push(`P05 catalog route missing ${marker}`);
}
if (catalogRoute.includes("بیشترین بازخورد داده")) {
  failures.push("P05 must not label merchandising priority as customer popularity");
}

for (const marker of ["فقط موجود", "فقط ناموجود", "facets.brands", "facets.categories", "facets.sizes"]) {
  if (!filters.includes(marker)) failures.push(`P05 filter UI missing ${marker}`);
}

for (const marker of [
  "back-in-stock-form",
  "registerBackInStockForRuntime",
  "رضایت می‌دهم",
  "ارسال اعلان در P09",
  "socialProof",
  "زمان یا وعده‌ای بدون داده معتبر",
]) {
  if (!purchase.includes(marker)) failures.push(`P05 PDP conversion boundary missing ${marker}`);
}

if (!productRoute.includes("relatedCatalogForRuntime")) {
  failures.push("P05 PDP must use authoritative related inventory in production");
}
for (const marker of ["Cache-Control", "no-store", "back_in_stock", "registerProductionBackInStock"]) {
  if (!apiRoute.includes(marker)) failures.push(`P05 BFF route missing ${marker}`);
}

for (const marker of ["P05.1", "P05.2", "P05.3", "P05.4", "P05.5", "P05.6"]) {
  if (!handoff.includes(marker)) failures.push(`P05 handoff missing ${marker}`);
}

let registry;
try {
  registry = JSON.parse(registryRaw);
} catch {
  failures.push("P05 registry must be valid JSON");
}
const p05 = registry?.phases?.find((phase) => phase.id === "P05");
if (!p05 || !["registered", "in_progress", "completed"].includes(p05.status)) {
  failures.push("P05 registry entry is invalid");
}

if (failures.length) {
  console.error("P05 discovery/PDP audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P05 discovery/PDP audit passed.");
