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
const [api, proxy, support, orders, route, registry, handoff] = await Promise.all([
  source("src/postpurchase/postpurchase-api.ts"),
  source("src/commerce/commerce-proxy.server.ts"),
  source("src/postpurchase/ProductionSupportPage.tsx"),
  source("src/commerce/ProductionOrdersPage.tsx"),
  source("src/auth/production-account-route.tsx"),
  source("contracts/production-phase-registry.json"),
  source("docs/handoffs/P08-TRUST-SUPPORT-POSTPURCHASE.md"),
]);
for (const marker of [
  "getTrustContent",
  "getSupportCases",
  "createSupportCase",
  "getOrderTracking",
  "getCommunications",
  "submitVerifiedReview",
])
  if (!api.includes(marker)) failures.push(`P08 client missing ${marker}`);
for (const marker of ["trust/content", "support/cases", "communications", "reviews", "/tracking"])
  if (!proxy.includes(marker)) failures.push(`P08 exact BFF allowlist missing ${marker}`);
for (const marker of [
  "محتوای تأییدشده‌ای منتشر نشده",
  "مهلت پاسخ رسمی پیکربندی نشده",
  "ارسال تأیید نشده",
  "p08-production-support-page",
])
  if (!support.includes(marker)) failures.push(`P08 support truth surface missing ${marker}`);
for (const marker of [
  "p08-order-tracking",
  "p08-verified-review",
  "هنوز عمومی نیست",
  "submitVerifiedReview",
])
  if (!orders.includes(marker)) failures.push(`P08 post-purchase surface missing ${marker}`);
if (!route.includes('=== "support"') || !route.includes("ProductionSupportPage"))
  failures.push("P08 support route is not production-swapped");
for (const marker of ["P08.1", "P08.2", "P08.3", "P08.4", "P08.5", "P08.6", "P08.7"])
  if (!handoff.includes(marker)) failures.push(`P08 handoff missing ${marker}`);
try {
  const phase = JSON.parse(registry).phases.find((item) => item.id === "P08");
  if (!phase || !["registered", "completed"].includes(phase.status))
    failures.push("P08 registry entry invalid");
} catch {
  failures.push("P08 registry must be valid JSON");
}
if (failures.length) {
  console.error("P08 audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P08 trust/support/post-purchase audit passed.");
