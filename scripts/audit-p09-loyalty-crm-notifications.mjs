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

const [api, proxy, store, wishlist, notification, loyalty, vite, accountRoute, registry, handoff] =
  await Promise.all([
    source("src/engagement/engagement-api.ts"),
    source("src/engagement/engagement-proxy.server.ts"),
    source("src/engagement/production-wishlist-store.ts"),
    source("src/engagement/ProductionWishlistPage.tsx"),
    source("src/engagement/ProductionNotificationCenter.tsx"),
    source("src/engagement/ProductionLoyaltyPage.tsx"),
    source("vite.config.ts"),
    source("src/auth/production-account-route.tsx"),
    source("contracts/production-phase-registry.json"),
    source("docs/handoffs/P09-WORKING-HANDOFF.md"),
  ]);

for (const marker of [
  "getWishlist",
  "migrateWishlistVariants",
  "getNotificationPreferences",
  "getNotificationSignals",
  "getLoyalty",
]) {
  if (!api.includes(marker)) failures.push(`P09 client missing ${marker}`);
}
for (const marker of [
  "/api/v1/customer/wishlist",
  "/api/v1/customer/notification-preferences",
  "/api/v1/customer/notification-signals",
  "/api/v1/customer/loyalty",
]) {
  if (!proxy.includes(marker)) failures.push(`P09 BFF missing ${marker}`);
}
if (!store.includes("localStorage.getItem(\"sole-store\")") || !store.includes("clearLegacyWishlist"))
  failures.push("legacy wishlist migration contract missing");
if (!wishlist.includes("data-testid=\"p09-production-wishlist\"") || wishlist.includes('to="/shop"'))
  failures.push("production wishlist truth surface invalid");
for (const marker of ["adapter/provider واقعی", "fail-closed", "لغو این کانال"])
  if (!notification.includes(marker)) failures.push(`notification policy disclosure missing ${marker}`);
for (const marker of ["Server-authoritative loyalty", "ارزش نقدی: ندارد", "هیچ امتیازی را در مرورگر"])
  if (!loyalty.includes(marker)) failures.push(`loyalty truth surface missing ${marker}`);
for (const marker of [
  "ProductionShoeCard.tsx",
  "ProductionProductPurchasePanel.tsx",
  "ProductionNotificationCenter.tsx",
  'source === "./routes/wishlist"',
]) {
  if (!vite.includes(marker)) failures.push(`production truth guard missing ${marker}`);
}
if (!accountRoute.includes('section === "loyalty"') || !accountRoute.includes("ProductionLoyaltyPage"))
  failures.push("loyalty account route missing");
try {
  const phase = JSON.parse(registry).phases.find((item) => item.id === "P09");
  if (!phase || !["registered", "completed"].includes(phase.status))
    failures.push("P09 registry entry invalid");
} catch {
  failures.push("P09 registry must be valid JSON");
}
for (const marker of ["P09.1", "P09.2", "P09.3", "P09.4", "P09.5", "P09.6"])
  if (!handoff.includes(marker)) failures.push(`P09 handoff missing ${marker}`);

if (failures.length) {
  console.error("P09 audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("P09 loyalty/CRM/notifications audit passed.");
