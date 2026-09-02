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
  backend,
  runtime,
  bff,
  infra,
  server,
  contentRoute,
  seoHead,
  registry,
  handoff,
  pkg,
  verifier,
] = await Promise.all([
  source("src/seo/p10-seo.server.ts"),
  source("src/seo/p10-seo.ts"),
  source("src/routes/api.seo.ts"),
  source("src/seo/p10-seo-infrastructure.ts"),
  source("src/server.ts"),
  source("src/routes/pages.$slug.tsx"),
  source("src/seo/seo-head.ts"),
  source("contracts/production-phase-registry.json"),
  source("docs/handoffs/P10-SEO-CONTENT-MERCHANT.md"),
  source("package.json"),
  source("scripts/verify-cumulative-quality.mjs"),
]);

for (const marker of [
  "/v1/seo/sitemap",
  "/v1/seo/manifest",
  "/v1/merchant/products",
  "/v1/content/pages/",
  "AbortSignal.timeout(5000)",
  "z.object",
])
  if (!backend.includes(marker)) failures.push(`P10 backend boundary missing ${marker}`);

for (const marker of [
  "/sitemap.xml",
  "sitemap-(core|content|products)",
  "/merchant-feed.json",
  "merchant_feed_unavailable",
  "x-robots-tag",
])
  if (!infra.includes(marker)) failures.push(`P10 infrastructure missing ${marker}`);

if (!runtime.includes("import.meta.env.SSR") || !runtime.includes("fetch(`/api/seo?mode=content"))
  failures.push(
    "P10 runtime must keep backend access server-side and use same-origin BFF in browser",
  );
if (!bff.includes("fetchP10ContentPage") || !bff.includes("content_unavailable"))
  failures.push("P10 content BFF contract missing");
if (!server.includes("await createP10InfrastructureResponse(request)"))
  failures.push("server entry does not enforce P10 infrastructure before application routing");
for (const marker of [
  "contentPageForRuntime",
  'name: "robots"',
  'rel: "canonical"',
  "application/ld+json",
])
  if (!contentRoute.includes(marker)) failures.push(`governed content route missing ${marker}`);
for (const marker of ["authoritative?.slug", '"@type": "Product"', 'name: "robots"'])
  if (!seoHead.includes(marker)) failures.push(`authoritative product SEO missing ${marker}`);
if (!pkg.includes('"audit:p10"') || !pkg.includes('"test:p10"'))
  failures.push("P10 scripts are not registered");
for (const marker of ["p09-loyalty-crm-notifications", "p10-seo-content-merchant"])
  if (!verifier.includes(marker)) failures.push(`cumulative verifier missing ${marker}`);
try {
  const phase = JSON.parse(registry).phases.find((item) => item.id === "P10");
  if (!phase || !["registered", "completed"].includes(phase.status))
    failures.push("P10 registry invalid");
} catch {
  failures.push("P10 registry must be valid JSON");
}
for (const marker of ["P10.1", "P10.2", "P10.3", "P10.4", "P10.5", "P10.6"])
  if (!handoff.includes(marker)) failures.push(`P10 handoff missing ${marker}`);

if (failures.length) {
  console.error("P10 audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P10 SEO/content/merchant audit passed.");
