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

const [contracts, client, reporter, proxy, route, account, root, handoff, pkg, verifier] =
  await Promise.all([
    source("src/observability/contracts.ts"),
    source("src/observability/client.ts"),
    source("src/observability/RumReporter.tsx"),
    source("src/observability/observability-proxy.server.ts"),
    source("src/routes/api.observability.$.ts"),
    source("src/observability/AnalyticsConsentPanel.tsx"),
    source("src/routes/__root.tsx"),
    source("docs/handoffs/P11-WORKING-HANDOFF.md"),
    source("package.json"),
    source("scripts/verify-cumulative-quality.mjs"),
  ]);

for (const marker of [
  "ANALYTICS_POLICY_VERSION",
  "ANALYTICS_TAXONOMY_VERSION",
  "ClientAnalyticsEvent",
  "routeTemplate",
])
  if (!contracts.includes(marker)) failures.push(`analytics contract missing ${marker}`);
for (const marker of [
  'credentials: "same-origin"',
  "X-Sole-Analytics-Session",
  "keepalive",
  "First-party telemetry is deliberately non-blocking",
])
  if (!client.includes(marker)) failures.push(`client transport missing ${marker}`);
for (const marker of [
  "PerformanceObserver",
  "largest-contentful-paint",
  '"event"',
  "layout-shift",
  "hasLocalAnalyticsConsent",
])
  if (!reporter.includes(marker)) failures.push(`RUM reporter missing ${marker}`);
for (const marker of [
  "/api/v1/observability/consent",
  "/api/v1/observability/events",
  "/api/v1/observability/experiments",
  "AbortSignal.timeout(5_000)",
  "X-XSRF-TOKEN",
])
  if (!proxy.includes(marker)) failures.push(`BFF allow-list missing ${marker}`);
if (!route.includes('createFileRoute("/api/observability/$")'))
  failures.push("same-origin observability route missing");
if (!account.includes('role="switch"') || !account.includes("setAnalyticsConsent"))
  failures.push("explicit reversible analytics consent control missing");
if (!root.includes("<RumReporter />")) failures.push("RUM reporter is not mounted");
for (const forbidden of ["payment_paid", "order_created", "cart_engaged"]) {
  if (contracts.includes(forbidden) || client.includes(forbidden) || reporter.includes(forbidden))
    failures.push(`browser can express authoritative outcome ${forbidden}`);
}
for (const marker of ["P11.1", "P11.2", "P11.3", "P11.4", "P11.5", "P11.6", "P11.7"])
  if (!handoff.includes(marker)) failures.push(`handoff missing ${marker}`);
if (!pkg.includes('"audit:p11"') || !pkg.includes('"test:p11"'))
  failures.push("P11 scripts are not registered");
if (!verifier.includes("p11-observability-rum-cro"))
  failures.push("cumulative verifier does not require P11 evidence");

if (failures.length) {
  console.error("P11 audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P11 observability/RUM/CRO audit passed.");
